/**
 * Kefo Baba Takipte — Cloud Functions
 *
 * İzlenen cihaz Firestore'a bir olay yazınca tetiklenir; aynı ailedeki EBEVEYN
 * cihazlarının FCM token'larına push gönderir. FCM server key istemcide TUTULMAZ;
 * push yalnızca buradan (Admin SDK ile) atılır — en güvenli yol.
 */
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";

admin.initializeApp();
setGlobalOptions({ region: "europe-west1", maxInstances: 10 });

const db = admin.firestore();

interface EventData {
  packageName?: string;
  appName?: string;
  timestamp?: number;
  childDeviceId?: string;
  childDeviceName?: string;
}

export const onAppEventCreated = onDocumentCreated(
  "families/{familyId}/events/{eventId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data() as EventData;
    const familyId = event.params.familyId;

    const appName = data.appName || data.packageName || "Bir uygulama";
    const childName = data.childDeviceName || "Çocuk cihazı";
    const time = formatTime(data.timestamp);

    // Aynı ailedeki ebeveyn cihazlarının token'larını topla.
    const devicesSnap = await db
      .collection("families")
      .doc(familyId)
      .collection("devices")
      .where("role", "==", "PARENT")
      .get();

    const tokens: string[] = [];
    devicesSnap.forEach((doc) => {
      const token = doc.get("fcmToken");
      if (typeof token === "string" && token.length > 0) tokens.push(token);
    });

    if (tokens.length === 0) {
      console.log(`Ailede (${familyId}) ebeveyn token'ı yok; bildirim atlanıyor.`);
      return;
    }

    const title = `'${appName}' açıldı`;
    const body = `${childName} • ${time}`;

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: {
        title,
        body,
        packageName: data.packageName || "",
        familyId,
      },
      android: {
        priority: "high",
        notification: { channelId: "kefo_alerts" },
      },
    });

    console.log(
      `Bildirim: ${response.successCount} başarılı, ${response.failureCount} başarısız.`
    );

    // Geçersiz token'ları temizle.
    await cleanupInvalidTokens(familyId, devicesSnap, response);
  }
);

function formatTime(ts?: number): string {
  const d = ts ? new Date(ts) : new Date();
  return d.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });
}

async function cleanupInvalidTokens(
  familyId: string,
  devicesSnap: admin.firestore.QuerySnapshot,
  response: admin.messaging.BatchResponse
): Promise<void> {
  const docs = devicesSnap.docs;
  const batch = db.batch();
  let changed = false;

  response.responses.forEach((res, idx) => {
    if (res.success) return;
    const code = res.error?.code || "";
    if (
      code === "messaging/registration-token-not-registered" ||
      code === "messaging/invalid-registration-token"
    ) {
      const ref = db
        .collection("families")
        .doc(familyId)
        .collection("devices")
        .doc(docs[idx].id);
      batch.update(ref, { fcmToken: "" });
      changed = true;
    }
  });

  if (changed) await batch.commit();
}

/** Süresi dolmuş eşleştirme kodlarını periyodik temizleyen yardımcı (isteğe bağlı). */
export const cleanupExpiredPairingCodes = onDocumentCreated(
  "pairingCodes/{code}",
  async () => {
    const now = Date.now();
    const expired = await db
      .collection("pairingCodes")
      .where("expiresAt", "<", now)
      .get();
    if (expired.empty) return;
    const batch = db.batch();
    expired.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
);
