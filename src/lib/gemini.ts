import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Define a generic response type
export type GeminiResponse<T = Record<string, any>> = T;

// Get the model
export function getGeminiModel(modelName: string = "gemini-2.0-flash"): GenerativeModel {
  return genAI.getGenerativeModel({ model: modelName });
}

// Function to generate content with system prompt and user content
export async function generateContent<T = Record<string, any>>(
  systemPrompt: string,
  userContent: string,
  responseFormat: "json" | "text" = "text"
): Promise<T | string> {
  const model = getGeminiModel();
  
  try {
    // Prepare the chat session with the system prompt
    const chat = model.startChat({
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
        responseMimeType: responseFormat === "json" ? "application/json" : "text/plain",
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        }
      ]
    });

    // Send the system prompt as the first message
    await chat.sendMessage(systemPrompt);
    
    // Send the user content and get the response
    const result = await chat.sendMessage(userContent);
    const text = result.response.text();
    
    // If JSON response is expected, parse it
    if (responseFormat === "json") {
      try {
        // Parse and type cast to the generic type
        return JSON.parse(text) as T;
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        console.log("Raw response:", text);
        throw new Error("Failed to parse JSON response from Gemini");
      }
    }
    
    return text as unknown as T;
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    throw error;
  }
}

// Type-safe versions for different response types
export interface AnalyticsResponse {
  overallScore: number;
  feedback: string;
  communication: {
    score: number;
    feedback: string;
  };
  questionSummaries: any[];
  [key: string]: any;
}

export interface InsightsResponse {
  insights: any[];
  [key: string]: any;
}

export interface QuestionsResponse {
  questions: Array<{ question: string; type: string }>;
  [key: string]: any;
}

export interface CommunicationAnalysisResponse {
  score: number;
  feedback: string;
  areas: Record<string, any>;
  [key: string]: any;
}

// Type-specific helper functions
export async function generateAnalytics(systemPrompt: string, userPrompt: string): Promise<AnalyticsResponse> {
  const result = await generateContent<AnalyticsResponse>(systemPrompt, userPrompt, "json");
  return result as AnalyticsResponse;
}

export async function generateInsights(systemPrompt: string, userPrompt: string): Promise<InsightsResponse> {
  const result = await generateContent<InsightsResponse>(systemPrompt, userPrompt, "json");
  return result as InsightsResponse;
}

export async function generateQuestions(systemPrompt: string, userPrompt: string): Promise<QuestionsResponse> {
  const result = await generateContent<QuestionsResponse>(systemPrompt, userPrompt, "json");
  return result as QuestionsResponse;
}

export async function generateCommunicationAnalysis(systemPrompt: string, userPrompt: string): Promise<CommunicationAnalysisResponse> {
  const result = await generateContent<CommunicationAnalysisResponse>(systemPrompt, userPrompt, "json");
  return result as CommunicationAnalysisResponse;
}
