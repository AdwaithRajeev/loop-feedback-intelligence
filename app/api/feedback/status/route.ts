import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const statusSchema = z.object({
  feedbackId: z.string().min(1),
  status: z.enum(["NEW", "REVIEWED", "ACTIONED"]),
});

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "ANALYST"
  ) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const result = statusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid status data",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { feedbackId, status } = result.data;

    const existingFeedback = await prisma.feedback.findFirst({
      where: {
        id: feedbackId,
        workspaceId: session.user.workspaceId,
      },
    });

    if (!existingFeedback) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    const feedback = await prisma.feedback.update({
      where: {
        id: feedbackId,
      },
      data: {
        status,
      },
    });

    return NextResponse.json({
      success: true,
      feedback,
    });
  } catch (error) {
    console.error("Feedback status update error:", error);

    return NextResponse.json(
      { error: "Failed to update feedback status" },
      { status: 500 }
    );
  }
}