import { getAddress } from "../../../lib/datasource";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const addr = searchParams.get("addr") || "";
  try {
    const data = await getAddress(addr);
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 502 });
  }
}
