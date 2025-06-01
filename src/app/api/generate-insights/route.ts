import { NextResponse } from "next/server";
import { InterviewService } from "@/services/interviews.service";
import { ResponseService } from "@/services/responses.service";
import { logger } from "@/lib/logger";
import {
  createUserPrompt,
  SYSTEM_PROMPT,
} from "@/lib/prompts/generate-insights";
import { generateInsights, InsightsResponse } from "@/lib/gemini";

export async function POST(req: Request, res: Response) {
  logger.info("generate-insights request received");
  const body = await req.json();

  const responses = await ResponseService.getAllResponses(body.interviewId);
  const interview = await InterviewService.getInterviewById(body.interviewId);

  let callSummaries = "";
  if (responses) {
    responses.forEach((response) => {
      callSummaries += response.details?.call_analysis?.call_summary;
    });
  }

  try {
    const prompt = createUserPrompt(
      callSummaries,
      interview.name,
      interview.objective,
      interview.description,
    );

    // Use type-safe Gemini API helper to generate insights
    const insightsResponse: InsightsResponse = await generateInsights(
      SYSTEM_PROMPT,
      prompt
    );
    
    // For compatibility with existing code
    const content = JSON.stringify(insightsResponse);

    // Extract insights from the response
    const insights = insightsResponse.insights || [];
    
    await InterviewService.updateInterview(
      { insights },
      body.interviewId,
    );

    logger.info("Insights generated successfully with Gemini");

    return NextResponse.json(
      {
        response: content,
      },
      { status: 200 },
    );
  } catch (error) {
    // logger.error("Error generating insights with Gemini:", error);

    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 },
    );
  }
}
