import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    if (!token)
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("imagem") as File;
    const mat = formData.get("mat") as string;

    if (!file || !mat) {
      return NextResponse.json(
        { error: "Arquivo ou matrícula ausente" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const resized = await sharp(buffer)
      .resize(200, 200, { fit: "cover", position: "centre" })
      .jpeg({ quality: 80 })
      .toBuffer();

    const fileName = `${mat}.jpg`;
    const filePath = path.join(process.cwd(), "public", "avatares", fileName);

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
