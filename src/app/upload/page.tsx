"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout";
import CompanyInput from "@/components/inputs";
import FileUploader from "@/components/FileUploader";
import { convertPdfToImage } from "@/lib/pdf2img";
import { saveResume, updateResumeFeedback, type Feedback } from "@/lib/db";
import { analyzeResume, isAIConfigured, generateJobDescription } from "@/lib/openai";

function generateUUID(): string {
    return crypto.randomUUID();
}

async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

const steps = [
    { id: 1, title: "Upload", description: "Select PDF" },
    { id: 2, title: "Process", description: "Converting" },
    { id: 3, title: "Analyze", description: "AI Reviewing" },
    { id: 4, title: "Results", description: "Complete" },
];

export default function UploadPage() {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [statusText, setStatusText] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    // AI Generation State
    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
    const [jobDescription, setJobDescription] = useState("");

    const handleFileSelect = (selectedFile: File | null) => {
        setFile(selectedFile);
        setError(null);
    };

    const handleGenerateDescription = async () => {
        const titleInput = document.getElementById("job-title") as HTMLInputElement;
        const companyInput = document.getElementById("company-name") as HTMLInputElement;

        if (!titleInput?.value) {
            setError("Please enter a Job Title first to generate a description.");
            return;
        }

        if (!isAIConfigured()) {
            setError("OpenAI API Key is missing. Please configure it in .env.local");
            return;
        }

        setIsGeneratingDesc(true);
        setError(null);

        try {
            const desc = await generateJobDescription(titleInput.value, companyInput?.value || "");
            setJobDescription(desc);
        } catch (err) {
            setError("Failed to generate job description. Please try again.");
        } finally {
            setIsGeneratingDesc(false);
        }
    };

    const handleAnalyze = async ({
        companyName,
        jobTitle,
        jobDescription,
        file,
    }: {
        companyName: string;
        jobTitle: string;
        jobDescription: string;
        file: File;
    }) => {
        if (!isAIConfigured()) {
            setError("OpenAI API key not configured. Please add NEXT_PUBLIC_OPENAI_API_KEY to your .env.local file.");
            return;
        }

        setIsProcessing(true);
        setError(null);
        setCurrentStep(2);

        try {
            setStatusText("Preparing document...");
            const imageResult = await convertPdfToImage(file);
            if (!imageResult.file) {
                throw new Error(imageResult.error || "Failed to convert PDF to image");
            }

            setStatusText("Saving securely...");
            const uuid = generateUUID();

            await saveResume({
                id: uuid,
                companyName,
                jobTitle,
                jobDescription,
                pdfBlob: file,
                imageBlob: imageResult.file,
                feedback: null,
                createdAt: new Date(),
            });

            setCurrentStep(3);
            setStatusText("AI is analyzing content...");
            const pdfBase64 = await blobToBase64(file);

            const feedback: Feedback = await analyzeResume(pdfBase64, {
                title: jobTitle,
                description: jobDescription,
            });

            // Extract parsedText for top-level storage
            const constructedResume = feedback.parsedText;

            setStatusText("Finalizing report...");
            await updateResumeFeedback(uuid, feedback, constructedResume);

            setCurrentStep(4);
            setStatusText("Complete! Redirecting...");

            setTimeout(() => {
                router.push(`/resume/${uuid}`);
            }, 800);
        } catch (err) {
            const message = err instanceof Error ? err.message : "An error occurred";
            setError(message);
            setIsProcessing(false);
            setCurrentStep(1);
        }
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        const companyName = formData.get("company-name") as string;
        const jobTitle = formData.get("job-title") as string;
        // Use state value if present (from AI generation), otherwise form data
        const description = jobDescription || (formData.get("job-description") as string);

        if (!file) {
            setError("Please select a file to upload");
            return;
        }

        handleAnalyze({ companyName, jobTitle, jobDescription: description, file });
    };

    return (
        <main className="min-h-screen bg-canvas">
            <Navbar />

            <section className="pt-12 pb-20 px-6">
                <div className="max-w-7xl mx-auto">

                    {/* Progress Indicator */}
                    <div className="mb-12 animate-fade-up">
                        <div className="flex justify-between items-center relative">
                            {/* Line Background */}
                            <div className="absolute left-0 top-5 w-full h-0.5 bg-slate-100 -z-10" />

                            {steps.map((step, index) => (
                                <div key={step.id} className="flex flex-col items-center flex-1 bg-transparen">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 border-4 border-white ${currentStep > step.id
                                            ? 'bg-emerald-500 text-white shadow-emerald-200'
                                            : currentStep === step.id
                                                ? 'bg-primary text-white shadow-lg scale-110'
                                                : 'bg-slate-100 text-slate-400'
                                            }`}
                                    >
                                        {currentStep > step.id ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            step.id
                                        )}
                                    </div>
                                    <span className={`text-xs mt-3 font-medium uppercase tracking-wider ${currentStep >= step.id ? 'text-primary' : 'text-slate-300'
                                        }`}>
                                        {step.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center mb-10 animate-fade-up stagger-1">
                        <h1 className="mb-3">
                            {isProcessing ? "Analyzing Resume" : "New Analysis"}
                        </h1>
                        <p className="text-secondary max-w-lg mx-auto">
                            {isProcessing
                                ? "Our AI is currently reviewing your document against industry standards."
                                : "Upload your resume and the job description to get a tailored analysis."}
                        </p>
                    </div>

                    {isProcessing ? (
                        <div className="executive-card flex flex-col items-center py-20 animate-fade-up">
                            <div className="relative w-48 h-48 mb-8">
                                <img src="/images/resume-scan.gif" alt="processing" className="w-full h-full object-contain opacity-80 mix-blend-multiply" />
                            </div>
                            <h3 className="text-xl font-medium text-primary mb-2 animate-pulse">{statusText}</h3>
                            <p className="text-sm text-tertiary">This usually takes about 10-15 seconds</p>
                        </div>
                    ) : (
                        <div className="executive-card p-0 overflow-hidden animate-fade-up stagger-2">
                            <div className="p-8 md:p-10">
                                {error && (
                                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-8 flex items-start gap-3 text-red-700">
                                        <div className="mt-0.5">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="text-sm font-medium">{error}</div>
                                    </div>
                                )}

                                <form id="upload-form" onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="company-name">Target Company</label>
                                            <CompanyInput name="company-name" className="mb-1" />
                                        </div>
                                        <div>
                                            <label htmlFor="job-title">Job Title <span className="text-red-400">*</span></label>
                                            <input type="text" name="job-title" placeholder="Ex: Senior Product Designer" id="job-title" required />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label htmlFor="job-description" className="mb-0">Job Description</label>
                                            <button
                                                type="button"
                                                onClick={handleGenerateDescription}
                                                disabled={isGeneratingDesc}
                                                className="text-xs font-semibold text-accent hover:text-accent-hover flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                            >
                                                {isGeneratingDesc ? (
                                                    <>
                                                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                        Auto-fill with AI
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <textarea
                                            name="job-description"
                                            id="job-description"
                                            value={jobDescription}
                                            onChange={(e) => setJobDescription(e.target.value)}
                                            rows={8}
                                            className="min-h-[200px]"
                                            placeholder="Paste the job description here, or use the 'Auto-fill' button to generate one based on the job title."
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <label className="mb-3 block">Resume File (PDF)</label>
                                        <div>
                                            <FileUploader onFileSelect={handleFileSelect} />
                                        </div>
                                    </div>

                                    <div className="pt-8 flex items-center justify-end gap-4 border-t border-slate-100 mt-8">
                                        <Link href="/" className="btn-secondary">Cancel</Link>
                                        <button type="submit" className="btn-primary flex items-center gap-2">
                                            <span>Run Analysis</span>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </button>
                                    </div>
                                </form>
                            </div>
                            <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center gap-2 text-xs text-secondary">
                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Your data is processed locally and via secure OpenAI API. We do not store your files.
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
