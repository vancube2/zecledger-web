import { getNetworkStats } from "../../../lib/datasource";

export const revalidate = 60;

export async function GET() {
  try {
    const data = await getNetworkStats();
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 502 });
  }
}
