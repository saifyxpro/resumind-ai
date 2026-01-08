import Dexie, { type EntityTable } from 'dexie';

export interface ResumeRecord {
    id: string;
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    pdfBlob: Blob;
    imageBlob: Blob;
    feedback: Feedback | null;
    parsedText?: string;
    createdAt: Date;
}

export interface Feedback {
    parsedText?: string; // Markdown content of the resume
    overallScore: number;
    ATS: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
        }[];
    };
    toneAndStyle: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    content: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    structure: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    skills: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
}

const db = new Dexie('ResumeAnalyzerDB') as Dexie & {
    resumes: EntityTable<ResumeRecord, 'id'>;
};

db.version(1).stores({
    resumes: 'id, companyName, jobTitle, createdAt'
});

export async function saveResume(resume: ResumeRecord): Promise<void> {
    await db.resumes.put(resume);
}

export async function getResume(id: string): Promise<ResumeRecord | undefined> {
    return await db.resumes.get(id);
}

export async function getAllResumes(): Promise<ResumeRecord[]> {
    return await db.resumes.orderBy('createdAt').reverse().toArray();
}

export async function deleteResume(id: string): Promise<void> {
    await db.resumes.delete(id);
}

export async function updateResumeFeedback(id: string, feedback: Feedback, parsedText?: string): Promise<void> {
    // If parsedText is provided separately, use it. Otherwise try to extract from feedback.
    const textToSave = parsedText || feedback.parsedText;

    // Remove parsedText from feedback object to avoid duplication/bloat if we want, 
    // but keeping it is fine too. Let's save it to the top-level parsedText field.
    await db.resumes.update(id, {
        feedback,
        ...(textToSave ? { parsedText: textToSave } : {})
    });
}

export async function updateResumeParsedText(id: string, parsedText: string): Promise<void> {
    await db.resumes.update(id, { parsedText });
}

export async function clearAllResumes(): Promise<void> {
    await db.resumes.clear();
}

export { db };
