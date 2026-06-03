import crypto from "crypto";

export interface GuacConnectionConfig {
  /** Display name of the file -> used as the connection name shown in Guacamole. */
  fileName: string;
  /** Absolute path of the Excel file on the Windows host (passed to the RemoteApp). */
  serverPath: string;
  /** Username embedded in the token (informational, shown in Guacamole). */
  username: string;
}

/**
 * Builds the Guacamole "Encrypted JSON" auth token.
 *
 * The format is defined by the guacamole-auth-json extension:
 *   1. plaintext  = JSON.stringify(authObject)
 *   2. signature  = HMAC-SHA-256(plaintext, KEY)
 *   3. signed     = signature || plaintext
 *   4. encrypted  = AES-128-CBC(signed, KEY, IV=16 zero bytes)
 *   5. token      = base64(encrypted)
 *
 * KEY is the json-secret-key from guacamole.properties, given as 32 hex chars (16 bytes).
 */
export function buildGuacToken(cfg: GuacConnectionConfig): string {
  const hexKey = (process.env.GUAC_JSON_SECRET_KEY || "").trim();
  if (hexKey.length !== 32) {
    throw new Error(
      "GUAC_JSON_SECRET_KEY must be exactly 32 hex characters (128-bit / 16 bytes)."
    );
  }
  const KEY = Buffer.from(hexKey, "hex");
  if (KEY.length !== 16) {
    throw new Error("GUAC_JSON_SECRET_KEY is not valid hex (must decode to 16 bytes).");
  }

  const ttl = Number(process.env.TOKEN_TTL_MS || 60000);
  const host = process.env.WINDOWS_RDP_HOST || "127.0.0.1";
  const port = process.env.WINDOWS_RDP_PORT || "3389";
  const rdpUser = process.env.WINDOWS_RDP_USER || "";
  const rdpPass = process.env.WINDOWS_RDP_PASS || "";
  const remoteApp = process.env.GUAC_REMOTE_APP || "||excel";

  const authObject = {
    username: cfg.username,
    expires: Date.now() + ttl,
    connections: {
      [cfg.fileName]: {
        protocol: "rdp",
        parameters: {
          hostname: host,
          port: String(port),
          username: rdpUser,
          password: rdpPass,
          security: "any",
          "ignore-cert": "true",
          "resize-method": "display-update",
          "remote-app": remoteApp,
          // RemoteApp argument: the file to open, quoted to survive spaces.
          "remote-app-args": `"${cfg.serverPath}"`,
        },
      },
    },
  };

  // 2) plaintext
  const plaintext = Buffer.from(JSON.stringify(authObject), "utf-8");

  // 3) signature = HMAC-SHA-256(plaintext, KEY)
  const signature = crypto.createHmac("sha256", KEY).update(plaintext).digest();

  // 4) signed = signature || plaintext
  const signed = Buffer.concat([signature, plaintext]);

  // 5) AES-128-CBC with a 16-byte zero IV.
  const iv = Buffer.alloc(16, 0);
  const cipher = crypto.createCipheriv("aes-128-cbc", KEY, iv);
  const encrypted = Buffer.concat([cipher.update(signed), cipher.final()]);

  // 6) base64
  return encrypted.toString("base64");
}

/**
 * Produces the URL the client iframe should load.
 * Uses the direct `#/?data=<token>` redirect form (token URL-encoded).
 */
export function buildGuacUrl(token: string): string {
  const base = (process.env.GUAC_BASE_URL || "https://guac.host/guacamole").replace(/\/+$/, "");
  return `${base}/#/?data=${encodeURIComponent(token)}`;
}
