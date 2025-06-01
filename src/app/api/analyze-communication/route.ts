import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
  SYSTEM_PROMPT,
  getCommunicationAnalysisPrompt,
} from "@/lib/prompts/communication-analysis";
import { generateCommunicationAnalysis, CommunicationAnalysisResponse } from "@/lib/gemini";

export async function POST(req: Request) {
  logger.info("analyze-communication request received");

  try {
    const body = await req.json();
    const { transcript } = body;

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 },
      );
    }

    // Use type-safe Gemini API helper instead of OpenAI
    const prompt = getCommunicationAnalysisPrompt(transcript);
    
    const analysisResult = await generateCommunicationAnalysis(
      SYSTEM_PROMPT,
      prompt
    );
    
    // No need to stringify since we're using the object directly

    logger.info("Communication analysis completed successfully with Gemini");

    // We now have a properly typed response from our helper function
    return NextResponse.json(
      { analysis: analysisResult },
      { status: 200 },
    );
  } catch (error) {
    // logger.error("Error analyzing communication skills with Gemini:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
