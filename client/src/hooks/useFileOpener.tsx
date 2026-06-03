import { useCallback, useState } from "react";
import { openFile as apiOpenFile } from "../lib/api";
import GuacamoleViewer from "../components/GuacamoleViewer";
import { useToast } from "../components/Toast";
import type { FileItem } from "../lib/types";

/**
 * Centralizes "open a file in the Guacamole viewer" behaviour:
 *  - calls POST /api/open
 *  - shows a toast on the 3-session limit (HTTP 429)
 *  - renders the fullscreen viewer
 * Returns { open, busyId, viewer } where `viewer` must be placed in the tree.
 */
export function useFileOpener() {
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [active, setActive] = useState<{ file: FileItem; url: string } | null>(null);

  const open = useCallback(
    async (file: FileItem) => {
      if (busyId) return;
      setBusyId(file.id);
      try {
        const { url } = await apiOpenFile(file.id);
        setActive({ file, url });
      } catch (e: any) {
        if (e?.status === 429) {
          toast.error(
            e?.message || "En fazla 3 dosya aynı anda açık olabilir."
          );
        } else {
          toast.error(e?.message || "Dosya açılamadı.");
        }
      } finally {
        setBusyId(null);
      }
    },
    [busyId, toast]
  );

  const viewer = active ? (
    <GuacamoleViewer
      file={active.file}
      url={active.url}
      onClose={() => setActive(null)}
    />
  ) : null;

  return { open, busyId, viewer };
}
