"use server";

import { ResponseService } from "@/services/responses.service";
import { InterviewService } from "@/services/interviews.service";
import { Question } from "@/types/interview";
import { Analytics } from "@/types/response";
import {
  getInterviewAnalyticsPrompt,
  SYSTEM_PROMPT,
} from "@/lib/prompts/analytics";
import { generateAnalytics, AnalyticsResponse } from "@/lib/gemini";

export const generateInterviewAnalytics = async (payload: {
  callId: string;
  interviewId: string;
  transcript: string;
}) => {
  const { callId, interviewId, transcript } = payload;

  try {
    const response = await ResponseService.getResponseByCallId(callId);
    const interview = await InterviewService.getInterviewById(interviewId);

    if (response.analytics) {
      return { analytics: response.analytics as Analytics, status: 200 };
    }

    const interviewTranscript = transcript || response.details?.transcript;
    const questions = interview?.questions || [];
    const mainInterviewQuestions = questions
      .map((q: Question, index: number) => `${index + 1}. ${q.question}`)
      .join("\n");

    const prompt = getInterviewAnalyticsPrompt(
      interviewTranscript,
      mainInterviewQuestions,
    );

    // Use type-safe Gemini API helper instead of OpenAI
    let analyticsResponse = await generateAnalytics(
      SYSTEM_PROMPT,
      prompt
    );

    console.log('Raw analytics response from Gemini:', JSON.stringify(analyticsResponse, null, 2));

    // Ensure scores are numbers and have default values
    analyticsResponse = {
      ...analyticsResponse,
      overallScore: Number(analyticsResponse.overallScore) || 0,
      communication: {
        score: Number(analyticsResponse.communication?.score) || 0,
        feedback: analyticsResponse.communication?.feedback || "No communication feedback available"
      },
      // Ensure questionSummaries exists and is an array
      questionSummaries: Array.isArray(analyticsResponse.questionSummaries) 
        ? analyticsResponse.questionSummaries 
        : [],
      // Add softSkillSummary if it doesn't exist
      softSkillSummary: analyticsResponse.softSkillSummary || "No soft skill summary available"
    };

    console.log('Processed analytics response:', JSON.stringify(analyticsResponse, null, 2));

    analyticsResponse.mainInterviewQuestions = questions.map(
      (q: Question) => q.question,
    );

    
    return { analytics: analyticsResponse, status: 200 };
  } catch (error) {
    console.error("Error in Gemini API request:", error);
    
    return { 
      error: "internal server error", 
      status: 500,
      // Return default analytics object on error
      analytics: {
        overallScore: 0,
        overallFeedback: "Error generating analytics",
        communication: { score: 0, feedback: "Error generating communication analysis" },
        questionSummaries: [],
        softSkillSummary: "Error generating soft skills summary"
      }
    };
  }
};
