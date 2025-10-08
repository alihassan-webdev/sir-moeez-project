import { app, db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { getStorage, ref, getDownloadURL, uploadBytes } from "firebase/storage";

export type TemplateDoc = {
  id: string;
  name: string;
  pdfUrl: string;
  preview: string;
  primaryColor?: string;
  font?: string;
};

export async function fetchTemplates(): Promise<TemplateDoc[]> {
  const col = collection(db, "templates");
  const snap = await getDocs(col);
  const list: TemplateDoc[] = [];
  snap.forEach((d) => {
    const data = d.data() as any;
    list.push({
      id: d.id,
      name: String(data.name || "Untitled"),
      pdfUrl: String(data.pdfUrl || ""),
      preview: String(data.preview || ""),
      primaryColor:
        typeof data.primaryColor === "string" ? data.primaryColor : undefined,
      font: typeof data.font === "string" ? data.font : undefined,
    });
  });
  return list;
}

export async function fetchTemplatePdfBytes(
  pdfUrl: string,
): Promise<ArrayBuffer> {
  if (!pdfUrl) throw new Error("Missing pdfUrl");
  const noCacheInit: RequestInit = { cache: "no-store" };
  if (/^https?:\/\//i.test(pdfUrl)) {
    const res = await fetch(pdfUrl, noCacheInit);
    if (!res.ok) throw new Error("Failed to fetch template PDF");
    return await res.arrayBuffer();
  }
  const storage = getStorage(app);
  const fileRef = ref(storage, pdfUrl.replace(/^\/*/, ""));
  const url = await getDownloadURL(fileRef);
  const res = await fetch(url, noCacheInit);
  if (!res.ok) throw new Error("Failed to fetch template PDF from storage");
  return await res.arrayBuffer();
}

export async function uploadGeneratedPdf(
  bytes: Uint8Array | ArrayBuffer,
  filename: string,
): Promise<string> {
  const storage = getStorage(app);
  const safe = filename.replace(/[^a-z0-9-_\.]/gi, "_");
  const path = `generated/${Date.now()}-${safe}`;
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, data, { contentType: "application/pdf" });
  const url = await getDownloadURL(fileRef);
  return url;
}
