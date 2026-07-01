// src/lib/apiResponse.ts

import { NextResponse } from "next/server";

export async function buildApiResponse(response: Response) {
  const data = await response.json();

  const nextResponse = NextResponse.json(data, {
    status: response.status,
  });

  if (response.status === 401) {
    nextResponse.cookies.delete("accessToken");
  }

  return nextResponse;
}
