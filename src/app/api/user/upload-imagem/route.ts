import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    if (!token)
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("imagem") as File | null;
    const mat = formData.get("mat") as string | null;

    if (!file || !mat) {
      return NextResponse.json(
        { error: "Arquivo ou matrícula ausente" },
        { status: 400 },
      );
    }

    // ─── Validação de matrícula (evita path traversal no nome do arquivo) ──
    if (!/^[a-zA-Z0-9_-]+$/.test(mat)) {
      return NextResponse.json(
        { error: "Matrícula inválida" },
        { status: 400 },
      );
    }

    // ─── Validação de tipo (checagem declarada pelo cliente) ───────────────
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato inválido. Envie uma imagem JPEG, PNG ou WEBP." },
        { status: 400 },
      );
    }

    // ─── Validação de tamanho ───────────────────────────────────────────────
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Imagem muito grande. Tamanho máximo: 5MB." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // ─── Validação real do conteúdo (o "type" do File pode ser forjado) ────
    let resized: Buffer;
    try {
      const metadata = await sharp(buffer).metadata();
      if (
        !metadata.format ||
        !["jpeg", "png", "webp"].includes(metadata.format)
      ) {
        return NextResponse.json(
          { error: "Arquivo não é uma imagem válida." },
          { status: 400 },
        );
      }

      resized = await sharp(buffer)
        .resize(200, 200, { fit: "cover", position: "centre" })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch {
      return NextResponse.json(
        { error: "Não foi possível processar a imagem enviada." },
        { status: 400 },
      );
    }

    const fileName = `${mat}.jpg`;
    const filePath = path.join(process.cwd(), "storage", "avatares", fileName);

    await writeFile(filePath, resized);

    const imagemUrl = `/avatares/${fileName}`;

    const response = await fetch(`${API_URL}/user/me/imagem`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ imagemUrl }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erro ao salvar no backend" },
        { status: 500 },
      );
    }

    return NextResponse.json({ imagemUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
