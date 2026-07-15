import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const AVATARES_DIR = path.join(process.cwd(), "storage", "avatares");

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ arquivo: string }> },
) {
  const { arquivo } = await params;

  // ─── Sanitização: só aceita nomes no formato "matricula.jpg" ───────────
  if (!/^[a-zA-Z0-9_-]+\.jpg$/.test(arquivo)) {
    return new NextResponse(null, { status: 400 });
  }

  const filePath = path.join(AVATARES_DIR, arquivo);

  try {
    const file = await readFile(filePath);
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
