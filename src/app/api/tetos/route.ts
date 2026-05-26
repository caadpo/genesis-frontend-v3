import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const sistema = searchParams.get("sistema");
    const mes = searchParams.get("mes");
    const ano = searchParams.get("ano");

    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    let url = "";

    if (sistema === "PJES") {
      url = `http://localhost:3001/tetos/pjes?mes=${mes}&ano=${ano}`;
    }

    if (sistema === "DIARIAS") {
      const status = searchParams.get("status");
      url = `http://localhost:3001/tetos/diarias${status ? `?status=${status}` : ""}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("ERRO TETOS:", error);
    return NextResponse.json(
      { error: "Erro ao buscar tetos" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    const body = await request.json();

    const response = await fetch("http://localhost:3001/tetos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("ERRO AO CRIAR TETO:", error);
    return NextResponse.json({ error: "Erro ao criar teto" }, { status: 500 });
  }
}
