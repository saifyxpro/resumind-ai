import { GoogleGenAI } from "@google/genai";
import { type Feedback } from "./db";

// Try both Next.js public env var and standard env var
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";

// Initialize with API key explicitly passed
const ai = new GoogleGenAI({ apiKey: API_KEY });

const AIResponseFormat = `
interface Feedback {
    overallScore: number; //max 100
    ATS: {
        score: number; //rate based on ATS suitability
        tips: {
            type: "good" | "improve";
            tip: string; //give 3-4 tips
        }[];
    };
    toneAndStyle: {
        score: number; //max 100
        tips: {
            type: "good" | "improve";
            tip: string; //make it a short "title" for the actual explanation
            explanation: string; //explain in detail here
        }[]; //give 3-4 tips
    };
    content: {
        score: number; //max 100
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[]; //give 3-4 tips
    };
    structure: {
        score: number; //max 100
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[]; //give 3-4 tips
    };
    skills: {
        score: number; //max 100
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[]; //give 3-4 tips
    };
}`;

function buildPrompt(jobTitle: string, jobDescription: string): string {
    return `You are an expert in ATS (Applicant Tracking System) and resume analysis.
Please analyze and rate this resume and suggest how to improve it.
The rating can be low if the resume is bad.
Be thorough and detailed. Don't be afraid to point out any mistakes or areas for improvement.
If there is a lot to improve, don't hesitate to give low scores. This is to help the user to improve their resume.
If available, use the job description for the job user is applying to to give more detailed feedback.
If provided, take the job description into consideration.
The job title is: ${jobTitle}
The job description is: ${jobDescription}
Provide the feedback using the following format:
${AIResponseFormat}
Return the analysis as an JSON object, without any other text and without the backticks.
Do not include any other text or comments.`;
}

export async function analyzeResume(
    pdfBase64: string,
    jobContext: { title: string; description: string }
): Promise<Feedback> {
    const prompt = buildPrompt(jobContext.title, jobContext.description);

    console.log("[Gemini] API Key configured:", !!API_KEY, "Key length:", API_KEY.length);
    console.log("[Gemini] Model: gemini-3-flash-preview");
    console.log("[Gemini] PDF size:", Math.round(pdfBase64.length / 1024), "KB");

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            inlineData: {
                                mimeType: "application/pdf",
                                data: pdfBase64,
                            },
                        },
                        {
                            text: prompt,
                        },
                    ],
                },
            ],
        });

        console.log("[Gemini] Response received successfully");

        const text = response.text || "";

        // Clean up potential markdown formatting
        let cleanedText = text.trim();
        if (cleanedText.startsWith("```json")) {
            cleanedText = cleanedText.slice(7);
        }
        if (cleanedText.startsWith("```")) {
            cleanedText = cleanedText.slice(3);
        }
        if (cleanedText.endsWith("```")) {
            cleanedText = cleanedText.slice(0, -3);
        }
        cleanedText = cleanedText.trim();

        return JSON.parse(cleanedText) as Feedback;
    } catch (error) {
        console.error("[Gemini] Error:", error);
        throw error;
    }
}

export function isGeminiConfigured(): boolean {
    return !!API_KEY;
}
