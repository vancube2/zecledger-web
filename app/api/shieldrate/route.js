import { getShieldRate } from "../../../lib/datasource";

export const revalidate = 60;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 100);
  try {
    const data = await getShieldRate(limit);
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 502 });
  }
}
