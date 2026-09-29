import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST() {
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

    if (feedback.length === 0) {
      return NextResponse.json(
        { error: "No feedback available to generate a report" },
        { status: 400 }
      );
    }

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
You are generating a Voice-of-Customer report for LOOP.

Analyze the customer feedback data below and produce a concise
executive report.

Customer Feedback:
${feedbackContext}

Return ONLY valid JSON in this exact format:

{
  "summary": "Short overall summary of customer sentiment.",
  "sentimentOverview": "Summary of positive, neutral, and negative feedback.",
  "topThemes": [
    {
      "name": "Theme name",
      "description": "Why this theme matters."
    }
  ],
  "painPoints": [
    "Customer pain point 1",
    "Customer pain point 2"
  ],
  "featureAreas": [
    {
      "name": "Feature area",
      "description": "What customers are saying about this area."
    }
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2"
  ]
}

Rules:
- Base the report ONLY on the provided feedback.
- Do not invent statistics or customer statements.
- Keep the summary concise.
- Return 3 to 5 top themes when enough data exists.
- Return 2 to 5 pain points when enough data exists.
- Return 2 to 5 recommendations.
- Recommendations should directly address observed customer pain points.
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
        { status: 500 }
      );
    }

    const cleanText = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const report = JSON.parse(cleanText);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Voice-of-Customer report error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate report",
      },
      { status: 500 }
    );
  }
}