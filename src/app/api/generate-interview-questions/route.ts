import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
  generateQuestionsPrompt,
  SYSTEM_PROMPT,
} from "@/lib/prompts/generate-questions";
import { generateQuestions, QuestionsResponse } from "@/lib/gemini";

export const maxDuration = 60;

export async function POST(req: Request, res: Response) {
  logger.info("generate-interview-questions request received");
  const body = await req.json();

  try {
    logger.info("Sending request to Gemini API");
    
    const prompt = generateQuestionsPrompt(body);
    
    // Use type-safe Gemini API helper to generate interview questions
    const response: QuestionsResponse = await generateQuestions(
      SYSTEM_PROMPT,
      prompt
    ).catch(error => {
      logger.error("Gemini API Error:", error);
      throw error;
    });
    
    // Convert response to string for compatibility with existing code
    const content = JSON.stringify(response);

    logger.info("Interview questions generated successfully with Gemini");

    return NextResponse.json(
      {
        response: content,
      },
      { status: 200 },
    );
  } catch (error: any) {
    logger.error("Error generating interview questions with Gemini:", {
      error: error?.message || 'Unknown error',
      status: error?.status,
      code: error?.code,
      response: error?.response?.data
    });

    return NextResponse.json(
      { 
        error: "Failed to generate interview questions",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 },
    );
  }
}
