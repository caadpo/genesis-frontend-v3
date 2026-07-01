import { buildApiResponse } from "@/src/lib/apiResponse";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET() {
  const token = (await cookies()).get("accessToken")?.value;

  const response = await fetch(`${API_URL}/diretoria`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return buildApiResponse(response);
}
