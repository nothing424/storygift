import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidSlug } from "@/lib/slug";

// Uses the anon key — slug existence is not sensitive information, so this
// is safe to check with the public client server-side (keeps an extra
// round trip off the client bundle and centralizes validation).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim().toLowerCase() || "";

  if (!isValidSlug(slug)) {
    return NextResponse.json({
      available: false,
      reason: "Slugs can only use lowercase letters, numbers, and hyphens (3-60 characters).",
    });
  }

  const { data, error } = await supabase
    .from("stories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ available: false, reason: "Couldn't check right now." }, { status: 500 });
  }

  return NextResponse.json({ available: !data });
}
