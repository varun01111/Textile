import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { deleteConversationAssets } from "@/lib/conversations";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;
    const result = await deleteConversationAssets(user.id, id);

    return NextResponse.json({
      ok: true,
      warning: result?.deletedExportedConversation
        ? "Assets deleted. The previous Google Sheets row was intentionally left unchanged in v1."
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Delete failed.",
      },
      { status: 400 },
    );
  }
}
