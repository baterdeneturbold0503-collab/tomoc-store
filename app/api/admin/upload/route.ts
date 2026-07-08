import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin-auth";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

type CloudinaryUpload = { secure_url?: string; error?: { message?: string } };

function optimizedUrl(url: string) {
  return url.replace("/upload/", "/upload/f_auto,q_auto,c_limit,w_1600/");
}

export async function POST(request: Request) {
  const auth = await authorizeAdmin(request);
  if (auth.error) return auth.error;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Cloudinary тохиргоо хийгдээгүй байна." }, { status: 503 });
  }

  const form = await request.formData();
  const files = form.getAll("files").filter((value): value is File => value instanceof File).slice(0, 8);
  if (!files.length) return NextResponse.json({ error: "Зураг сонгоно уу." }, { status: 400 });

  const uploaded: string[] = [];
  for (const file of files) {
    if (!allowed.has(file.type) || file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Зураг JPG, PNG, WebP эсвэл AVIF, 5MB-аас бага байна." }, { status: 400 });
    }

    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("folder", `tomoc/products/${auth.user.id}`);
    uploadForm.append("use_filename", "true");
    uploadForm.append("unique_filename", "true");
    uploadForm.append("overwrite", "false");

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}` },
      body: uploadForm,
    });
    const result = (await response.json()) as CloudinaryUpload;
    if (!response.ok || !result.secure_url) {
      return NextResponse.json({ error: result.error?.message || "Зураг байршуулахад алдаа гарлаа." }, { status: 502 });
    }
    uploaded.push(optimizedUrl(result.secure_url));
  }

  return NextResponse.json({ urls: uploaded });
}
