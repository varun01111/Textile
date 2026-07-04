import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { saveReviewEdits } from "@/lib/conversations";
import { reviewPayloadSchema } from "@/lib/validation/conversation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;
    const payload = reviewPayloadSchema.parse(await request.json());

    await saveReviewEdits({
      userId: user.id,
      conversationId: id,
      analysis: payload.analysis,
      tasks: payload.tasks.map((task) => ({
        taskText: task.taskText,
        dueDate: task.dueDate,
        reminderAt: task.reminderAt,
        status: task.status,
      })),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not save review.",
      },
      { status: 400 },
    );
  }
}
