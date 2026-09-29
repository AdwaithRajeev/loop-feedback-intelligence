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
      { status: 401 },
    );
  }

  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "ANALYST"
  ) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const feedbackId = body.feedbackId;

    if (!feedbackId) {
      return NextResponse.json(
        { error: "Feedback ID is required" },
        { status: 400 },
      );
    }

    const feedback = await prisma.feedback.findFirst({
      where: {
        id: feedbackId,
        workspaceId: session.user.workspaceId,
      },
    });

    if (!feedback) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 },
      );
    }

    const prompt = `
Analyze this customer feedback.

Feedback:
"${feedback.content}"

Return ONLY valid JSON in this exact format:

{
  "sentiment": "POSITIVE",
  "sentimentScore": 0.85,
  "featureArea": "Checkout",
  "rationale": "Short explanation of why this sentiment was selected.",
  "themes": [
    {
      "name": "Performance",
      "description": "Short description of the theme."
    }
  ]
}

Rules:
- sentiment must be exactly POSITIVE, NEUTRAL, or NEGATIVE.
- sentimentScore must be a number between 0 and 1.
- featureArea should be a short product area.
- rationale should be short and clear.
- Return between 1 and 3 relevant themes.
- Do not include markdown.
- Do not include text outside the JSON.
`;

const response = await ai.models.generateContent({
  model: "gemini-3.5-flash-lite",
  contents: prompt,
});
    const text = response.text?.trim();

    if (!text) {
      return NextResponse.json(
        { error: "Gemini returned an empty response" },
        { status: 500 },
      );
    }

    const cleanText = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const result = JSON.parse(cleanText);

    if (
      !["POSITIVE", "NEUTRAL", "NEGATIVE"].includes(
        result.sentiment,
      )
    ) {
      throw new Error("Invalid sentiment returned by Gemini");
    }

    if (
      typeof result.sentimentScore !== "number" ||
      result.sentimentScore < 0 ||
      result.sentimentScore > 1
    ) {
      throw new Error("Invalid sentiment score returned by Gemini");
    }

    await prisma.feedback.update({
      where: {
        id: feedback.id,
      },
      data: {
        sentiment: result.sentiment,
        sentimentScore: result.sentimentScore,
        featureArea: result.featureArea || null,
        rationale: result.rationale || null,
      },
    });

    await prisma.feedbackTheme.deleteMany({
      where: {
        feedbackId: feedback.id,
      },
    });

    for (const item of result.themes || []) {
      if (!item.name) {
        continue;
      }

      const theme = await prisma.theme.upsert({
        where: {
          workspaceId_name: {
            workspaceId: session.user.workspaceId,
            name: item.name,
          },
        },
        update: {
          description: item.description || null,
        },
        create: {
          name: item.name,
          description: item.description || null,
          workspaceId: session.user.workspaceId,
        },
      });

      await prisma.feedbackTheme.create({
        data: {
          feedbackId: feedback.id,
          themeId: theme.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      analysis: result,
    });
  } catch (error) {
    console.error("Feedback analysis error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 },
    );
  }
}