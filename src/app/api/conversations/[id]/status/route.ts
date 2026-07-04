import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getConversationStatus } from "@/lib/conversations";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const status = await getConversationStatus(user.id, id);

  if (!status) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  return NextResponse.json(status);
}
