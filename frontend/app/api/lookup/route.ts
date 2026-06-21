import { NextResponse } from "next/server";
import { lookupFacility } from "@/lib/server/cms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const ccn = new URL(request.url).searchParams.get("ccn") ?? "";
  if (!/^\d{6}$/.test(ccn)) {
    return NextResponse.json({ error: "Enter a valid 6 digit CCN." }, { status: 400 });
  }

  try {
    return NextResponse.json(await lookupFacility(ccn));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lookup failed.";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
