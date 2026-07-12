import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin-auth";

const BUCKET = "product-images";
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const jsonError = (error: string, status = 400) => NextResponse.json({ success: false, error }, { status });
const safeName = (name: string) => name.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "product-image";

async function ensureBucket(supabase: NonNullable<Awaited<ReturnType<typeof authorizeAdmin>>["supabase"]>) {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (data) return null;
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_SIZE,
    allowedMimeTypes: Array.from(ALLOWED_TYPES),
  });
  return error;
}

export async function POST(request: Request) {
  const auth = await authorizeAdmin(request);
  if (auth.error) return auth.error;

  const bucketError = await ensureBucket(auth.supabase);
  if (bucketError) return jsonError(`Supabase Storage bucket үүсгэхэд алдаа гарлаа: ${bucketError.message}`, 500);

  const form = await request.formData();
  const files = form.getAll("files").filter((value): value is File => value instanceof File).slice(0, 8);
  if (!files.length) return jsonError("Зураг сонгоно уу");

  const urls: string[] = [];
  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) return jsonError("Зөвхөн JPG, PNG, WEBP зураг оруулна уу");
    if (file.size > MAX_SIZE) return jsonError("Зураг 5MB-аас их байна");

    const extension = EXTENSION_BY_TYPE[file.type] || "jpg";
    const path = `${auth.user.id}/${Date.now()}-${crypto.randomUUID()}-${safeName(file.name)}.${extension}`;
    const { error } = await auth.supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });
    if (error) return jsonError(`Зураг upload хийхэд алдаа гарлаа: ${error.message}`, 500);

    const { data } = auth.supabase.storage.from(BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return NextResponse.json({ success: true, urls });
}
