import OpenAI from "openai";
import { type Feedback } from "./db";

const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "";

const openai = new OpenAI({
    apiKey: API_KEY,
    dangerouslyAllowBrowser: true
});

const AIResponseFormat = `
interface Feedback {
    parsedText: string; // CRITICAL: This is the "Resume Reconstruction". Re-write the ENITRE resume content here as clean, professional Markdown. 
                        // - Use # for name, ## for sections (Experience, Education).
                        // - Use bullet points for lists.
                        // - PRESERVE ALL ORIGINAL TEXT CONTENT EXACTLY.
                        // - This will be used to generate a new editable version.
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
    return `You are an expert Resume Reconstructor and ATS Analyst.
    
TASK 1: RESUME RECONSTRUCTION (Most Important)
"Read" the provided resume (PDF/Image) and reconstruct it completely as a Markdown document in the 'parsedText' field.
- Don't summarize. Extract the FULL content.
- Format it beautifully using Markdown headers (#, ##), bullet points, and bold text.
- This markdown will be used to generate a new fresh PDF for the user.

TASK 2: ANALYSIS
Analyze the resume and provide feedback for the position of "${jobTitle}".
${jobDescription ? `Job Description: ${jobDescription}` : ""}

Provide the output strictly using this JSON format:
${AIResponseFormat}
Return ONLY the JSON object.`;
}

export async function analyzeResume(
    pdfBase64: string,
    jobContext: { title: string; description: string }
): Promise<Feedback> {
    const prompt = buildPrompt(jobContext.title, jobContext.description);

    console.log("[OpenAI] API Key configured:", !!API_KEY, "Key length:", API_KEY.length);
    console.log("[OpenAI] Model: gpt-5-mini-2025-08-07");
    console.log("[OpenAI] PDF size:", Math.round(pdfBase64.length / 1024), "KB");

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-5-mini-2025-08-07",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "file",
                            file: {
                                filename: "resume.pdf",
                                file_data: `data:application/pdf;base64,${pdfBase64}`,
                            },
                        },
                        {
                            type: "text",
                            text: prompt,
                        },
                    ],
                },
            ],
        });

        console.log("[OpenAI] Response received successfully");

        const text = response.choices[0]?.message?.content || "";

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
        console.error("[OpenAI] Error:", error);
        throw error;
    }
}

export async function analyzeResumeText(
    text: string,
    jobContext: { title: string; description: string }
): Promise<Feedback> {
    const prompt = buildPrompt(jobContext.title, jobContext.description);

    console.log("[OpenAI] Analyzing edited text. Length:", text.length);

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-5-mini-2025-08-07",
            messages: [
                {
                    role: "user",
                    content: `Here is the resume content to analyze:\n\n${text}\n\n---\n\n${prompt}`
                },
            ],
        });

        console.log("[OpenAI] Text analysis response received");

        const responseText = response.choices[0]?.message?.content || "";

        let cleanedText = responseText.trim();
        if (cleanedText.startsWith("```json")) cleanedText = cleanedText.slice(7);
        if (cleanedText.startsWith("```")) cleanedText = cleanedText.slice(3);
        if (cleanedText.endsWith("```")) cleanedText = cleanedText.slice(0, -3);
        cleanedText = cleanedText.trim();

        return JSON.parse(cleanedText) as Feedback;
    } catch (error) {
        console.error("[OpenAI] Error analyzing text:", error);
        throw error;
    }
}

export function isAIConfigured(): boolean {
    return !!API_KEY;
}

export interface AIFixResult {
    improved: string;
    explanation: string;
    originalSnippet?: string;
}

export async function getAIFix(
    issue: string,
    explanation: string,
    category: string,
    jobContext?: { title: string; description: string },
    resumeContext?: string
): Promise<AIFixResult> {
    console.log("[OpenAI] Getting AI fix for:", issue);

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-5-mini-2025-08-07",
            messages: [
                {
                    role: "system",
                    content: `You are a professional resume writer and ATS optimization expert. 
Your task is to provide improved resume content based on feedback.
Always respond with practical, action-oriented improvements.
Keep improvements concise but impactful.`,
                },
                {
                    role: "user",
                    content: `I received the following feedback on my resume:

Category: ${category}
Issue: ${issue}
Details: ${explanation}
${jobContext ? `Target Job: ${jobContext.title}` : ""}
${jobContext?.description ? `Job Description: ${jobContext.description}` : ""}

Please provide:
1. The EXACT new text content that should replace the problematic section.
2. A brief explanation.

IMPORTANT RULES:
- The "improved" field MUST contain ONLY the content to be inserted into the resume.
- Do NOT include instructions like "Add this section..." or "Replace with...".
- Do NOT include conversational text.
- Just give the final, polished content.

Respond in JSON format:
{
  "improved": "the actual new content (e.g. 'Managed a team of 5...')",
  "explanation": "brief explanation of why this improvement helps",
  "originalSnippet": "the exact text segment from the Resume Content that should be replaced. This MUST match the text in the Resume Content exactly."
}

Resume Content:
${resumeContext ? resumeContext.slice(0, 15000) : "Not available"}

Return only the JSON, no other text.`,
                },
            ],
        });

        const text = response.choices[0]?.message?.content || "";

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

        return JSON.parse(cleanedText) as AIFixResult;
    } catch (error) {
        console.error("[OpenAI] Error getting AI fix:", error);
        throw error;
    }
}

export async function generateJobDescription(title: string, company: string): Promise<string> {
    console.log("[OpenAI] Generating job description for:", title);
    try {
        const prompt = `Write a professional and concise job description for a "${title}" position${company ? ` at "${company}"` : ""}.
    Include key responsibilities and required skills. Keep it under 200 words.`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-5-mini-2025-08-07",
        });

        return completion.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("[OpenAI] Error generating description:", error);
        throw new Error("Failed to generate description");
    }
}
