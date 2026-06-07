import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getProfileBySession } from "@/lib/firebase/admin";

export async function GET() {
  const profile = await getProfileBySession(await cookies());
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({ profile });
}
