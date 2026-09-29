import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

const feedbackSchema = z.object({
  content: z.string().min(1, "Feedback content is required"),
  customerLabel: z.string().optional(),
  channel: z.enum(["MANUAL", "CSV", "SIMULATED"]),
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const analysisSchema = {
  type: "object",
  properties: {
    sentiment: {
      type: "string",
      enum: ["POSITIVE", "NEUTRAL", "NEGATIVE"],
    },
    sentimentScore: {
      type: "number",
      description:
        "Confidence score between 0 and 1 for the sentiment classification.",
    },
    featureArea: {
      type: "string",
      description:
        "The main product area mentioned in the feedback.",
    },
    rationale: {
      type: "string",
      description:
        "A short explanation for why the feedback was classified this way.",
    },
  },
  required: [
    "sentiment",
    "sentimentScore",
    "featureArea",
    "rationale",
  ],
};

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

    const result = feedbackSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid feedback data",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { content, customerLabel, channel } = result.data;

    let sentiment:
      | "POSITIVE"
      | "NEUTRAL"
      | "NEGATIVE"
      | null = null;

    let sentimentScore: number | null = null;
    let featureArea: string | null = null;
    let rationale: string | null = null;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `
Analyze the following customer feedback for a customer feedback intelligence platform.

Customer feedback:
"${content}"

Classify the feedback using exactly one sentiment:
- POSITIVE
- NEUTRAL
- NEGATIVE

Also identify:
- sentimentScore: confidence from 0 to 1
- featureArea: the main product area mentioned
- rationale: a short explanation

Return only the requested structured JSON.
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: analysisSchema,
        },
      });

      const text = response.text;

      if (text) {
        const analysis = JSON.parse(text);

        if (
          analysis.sentiment === "POSITIVE" ||
          analysis.sentiment === "NEUTRAL" ||
          analysis.sentiment === "NEGATIVE"
        ) {
          sentiment = analysis.sentiment;
        }

        if (typeof analysis.sentimentScore === "number") {
          sentimentScore = Math.max(
            0,
            Math.min(1, analysis.sentimentScore)
          );
        }

        if (typeof analysis.featureArea === "string") {
          featureArea = analysis.featureArea;
        }

        if (typeof analysis.rationale === "string") {
          rationale = analysis.rationale;
        }
      }
    } catch (aiError) {
      console.error("Gemini analysis error:", aiError);

      // Feedback can still be saved even if AI analysis fails.
      sentiment = null;
      sentimentScore = null;
      featureArea = null;
      rationale = null;
    }

    const feedback = await prisma.feedback.create({
      data: {
        content,
        customerLabel: customerLabel || null,
        channel,
        workspaceId: session.user.workspaceId,
        status: "NEW",
        sentiment,
        sentimentScore,
        featureArea,
        rationale,
      },
    });

    return NextResponse.json(
      {
        success: true,
        feedback,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Feedback creation error:", error);

    return NextResponse.json(
      { error: "Failed to create feedback" },
      { status: 500 }
    );
  }
}