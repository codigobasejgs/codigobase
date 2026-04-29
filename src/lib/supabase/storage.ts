import { createAdminClient } from "./admin";

const BUCKET = "media";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

export function validateUpload(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return "Tipo de arquivo não permitido.";
  if (file.size > MAX_SIZE) return "Arquivo maior que 5 MB.";
  return null;
}

export async function uploadToStorage(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const admin = createAdminClient();
  const ext = filename.split(".").pop() ?? "bin";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
