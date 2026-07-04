import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { approveAndExportConversation } from "@/lib/conversations";
import { getFeatureReadiness, hasGoogleSheetsEnv } from "@/lib/env";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!hasGoogleSheetsEnv()) {
      const readiness = getFeatureReadiness();
      return NextResponse.json(
        {
          error: `Google Sheets export is not configured yet. Add ${readiness.checklist.sheets.join(", ")} in .env.local before exporting approved conversations.`,
        },
        { status: 400 },
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;
    const detail = await approveAndExportConversation(user.id, id);
    return NextResponse.json({ ok: true, detail });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Export failed.",
      },
      { status: 400 },
    );
  }
}
