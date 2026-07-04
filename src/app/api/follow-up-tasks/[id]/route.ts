import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { updateFollowUpTask } from "@/lib/conversations";

const followUpTaskActionSchema = z.object({
  action: z.enum(["complete", "reopen", "snooze", "update"]),
  taskText: z.string().trim().optional(),
  dueDate: z.string().trim().nullable().optional(),
  reminderAt: z.string().trim().nullable().optional(),
  status: z.enum(["pending", "completed"]).optional(),
});

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
    const payload = followUpTaskActionSchema.parse(await request.json());

    await updateFollowUpTask({
      userId: user.id,
      taskId: id,
      action: payload.action,
      taskText: payload.taskText,
      dueDate: payload.dueDate,
      reminderAt: payload.reminderAt,
      status: payload.status,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update follow-up task.",
      },
      { status: 400 },
    );
  }
}
