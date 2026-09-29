import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
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
    const question = body.question?.trim();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.findMany({
      where: {
        workspaceId: session.user.workspaceId,
      },
      select: {
        content: true,
        sentiment: true,
        sentimentScore: true,
        featureArea: true,
        rationale: true,
        themes: {
          include: {
            theme: {
              select: {
                name: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 500,
    });

    const feedbackContext = feedback
      .map((item, index) => {
        const themes = item.themes
          .map((item) => item.theme.name)
          .join(", ");

        return `
Feedback ${index + 1}:
Content: ${item.content}
Sentiment: ${item.sentiment ?? "PENDING"}
Sentiment Score: ${item.sentimentScore ?? "N/A"}
Feature Area: ${item.featureArea ?? "N/A"}
Rationale: ${item.rationale ?? "N/A"}
Themes: ${themes || "None"}
`;
      })
      .join("\n");

    const prompt = `
You are the AI assistant for LOOP, an AI-powered customer feedback
intelligence platform.

Answer the user's question using ONLY the customer feedback data
provided below.

Customer Feedback Data:
${feedbackContext || "No feedback data is available."}

User Question:
"${question}"

Rules:
- Give a clear and useful answer.
- Use only information supported by the feedback data.
- Do not invent customer feedback or statistics.
- If the data does not contain enough information to answer,
  clearly say that.
- You may summarize patterns across the feedback.
- Keep the answer concise but informative.
`;

const response = await ai.models.generateContent({
  model: "gemini-3.5-flash-lite",
  contents: prompt,
});

    const answer = response.text?.trim();

    if (!answer) {
      return NextResponse.json(
        { error: "Gemini returned an empty response" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error("AI Q&A error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to answer question",
      },
      { status: 500 }
    );
  }
}