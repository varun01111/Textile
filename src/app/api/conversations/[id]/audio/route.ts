import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getConversationAudioSignedUrl } from "@/lib/conversations";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const signedUrl = await getConversationAudioSignedUrl(user.id, id);

  if (!signedUrl) {
    return NextResponse.json({ error: "Audio file not found." }, { status: 404 });
  }

  return NextResponse.redirect(signedUrl);
}
