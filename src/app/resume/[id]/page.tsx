"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getResume, deleteResume, type ResumeRecord, type Feedback } from "@/lib/db";
import { getAIFix } from "@/lib/openai";
import FixModal from "@/components/FixModal";
import ScoreRing from "@/components/ScoreRing";
import ResumeEditor from "@/components/ResumeEditor";
import { Accordion, AccordionItem, AccordionHeader, AccordionContent } from "@/components/ui";
import { analyzeResumeText } from "@/lib/openai";
import { updateResumeFeedback } from "@/lib/db";

interface SelectedTip {
    tip: string;
    explanation: string;
    category: string;
    originalSnippet?: string;
    tipKey: string; // Unique key to identify this tip
}

export default function ResumePage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [resume, setResume] = useState<ResumeRecord | null>(null);
    const [imageUrl, setImageUrl] = useState("");
    const [pdfUrl, setPdfUrl] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"analysis" | "editor">("analysis");
    const [resumeText, setResumeText] = useState("");

    // Modal & Fix States
    const [showFixModal, setShowFixModal] = useState(false);
    const [selectedTip, setSelectedTip] = useState<SelectedTip | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isReanalyzing, setIsReanalyzing] = useState(false);

    // Pending Fix State for Review Mode
    const [pendingFix, setPendingFix] = useState<{
        appliedContent: string;
        originalContent: string;
        selectionRange: [number, number];
        tipKey?: string; // Track which tip this fix is for
    } | null>(null);

    // Track tips that have been addressed (hidden from UI)
    const [addressedTips, setAddressedTips] = useState<Set<string>>(new Set());

    useEffect(() => {
        const loadResume = async () => {
            try {
                const data = await getResume(id);
                if (!data) {
                    router.push("/");
                    return;
                }

                setResume(data);
                setImageUrl(URL.createObjectURL(data.imageBlob));
                setPdfUrl(URL.createObjectURL(data.pdfBlob));
                setResumeText(data.parsedText || ""); // Load parsed text if available
            } catch (error) {
                console.error("Failed to load resume:", error);
                router.push("/");
            } finally {
                setIsLoading(false);
            }
        };

        loadResume();
    }, [id, router]);

    const handleDelete = async () => {
        try {
            await deleteResume(id);
            router.push("/");
        } catch (error) {
            console.error("Failed to delete:", error);
        }
    };

    const handleApplyFix = (improved: string, original?: string) => {
        if (!resumeText) return;

        // helper to escape regex special chars
        const escapeRegExp = (string: string) => {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };

        // helper to normalize whitespace for "fuzzy" matching
        const createFlexiblePattern = (text: string) => {
            return text.trim().split(/\s+/).map(escapeRegExp).join('\\s+');
        };

        let newText = resumeText;
        let replaced = false;
        let startIndex = -1;
        let endIndex = -1;

        // Strategy 1: Exact Match
        if (original && resumeText.includes(original)) {
            startIndex = resumeText.indexOf(original);
            newText = resumeText.replace(original, improved);
            replaced = true;
        }
        // Strategy 2: Flexible Whitespace Match
        else if (original) {
            const pattern = createFlexiblePattern(original);
            const regex = new RegExp(pattern, 'i');
            const match = resumeText.match(regex);

            if (match && match.index !== undefined) {
                startIndex = match.index;
                newText = resumeText.replace(regex, improved);
                replaced = true;
            } else {
                // Strategy 3: Ultra-loose match
                const clean = (s: string) => s.replace(/[^\w\s]/g, '').trim().split(/\s+/).join('.*');
                const loosePattern = clean(original);
                try {
                    const looseRegex = new RegExp(loosePattern.substring(0, Math.min(loosePattern.length, 100)), 'i');
                    const matchLoose = resumeText.match(looseRegex);
                    if (matchLoose && matchLoose.index !== undefined) {
                        startIndex = matchLoose.index;
                        newText = resumeText.replace(matchLoose[0], improved);
                        replaced = true;
                    }
                } catch (e) {
                    console.warn("Regex failed", e);
                }
            }
        }

        if (replaced && startIndex !== -1) {
            endIndex = startIndex + improved.length;

            // Set Pending State instead of applying immediately
            setPendingFix({
                appliedContent: newText,
                originalContent: resumeText,
                selectionRange: [startIndex, endIndex],
                tipKey: selectedTip?.tipKey // Pass the tip key for tracking
            });

            setActiveTab("editor");
            setShowFixModal(false);
        } else {
            // Fallback: Could not find text
            const snippet = original ? `"${original.substring(0, 50)}..."` : "selected text";
            alert(`Could not automatically match the text:\n${snippet}\n\nThe AI might have slightly altered the quote. Please apply the fix manually in the Editor tab.`);
            setActiveTab("editor");
            setShowFixModal(false);
        }
    };

    const handleAcceptFix = async () => {
        if (pendingFix) {
            setResumeText(pendingFix.appliedContent);

            // Mark this tip as addressed so it hides from the UI
            if (pendingFix.tipKey) {
                setAddressedTips(prev => new Set([...prev, pendingFix.tipKey!]));
            }

            // Persist the updated text to the database
            try {
                const { updateResumeParsedText } = await import("@/lib/db");
                await updateResumeParsedText(id, pendingFix.appliedContent);
            } catch (error) {
                console.error("Failed to save fix:", error);
            }

            setPendingFix(null);
        }
    };

    const handleRejectFix = () => {
        setPendingFix(null);
        // Returns to original state automatically since we never updated resumeText
    };

    const handleReanalyze = async () => {
        if (!resume || !resumeText) return;
        setIsReanalyzing(true);
        try {
            const newFeedback = await analyzeResumeText(resumeText, {
                title: resume.jobTitle,
                description: resume.jobDescription
            });

            // Save new feedback to DB
            // We pass resumeText as parsedText to ensure it stays in sync
            await updateResumeFeedback(id, newFeedback, resumeText);

            // Update local state
            setResume(prev => prev ? { ...prev, feedback: newFeedback } : null);
            setActiveTab("analysis"); // Switch back to view results
            // alert("Analysis updated based on your edits!");
        } catch (error) {
            console.error("Re-analysis failed:", error);
            alert("Failed to re-analyze resume. Please try again.");
        } finally {
            setIsReanalyzing(false);
        }
    };



    const handleOpenFixModal = (tip: any, category: string, tipKey: string) => { // Using any for tip temporarily as the full type isn't exported
        setSelectedTip({
            tip: tip.tip,
            explanation: tip.explanation,
            category: category,
            originalSnippet: tip.originalSnippet || tip.tip, // Fallback to tip text if snippet not explicitly provided
            tipKey: tipKey
        });
        setShowFixModal(true);
    };

    if (isLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-canvas">
                <div className="text-center animate-fade-up">
                    <div className="w-24 h-24 mx-auto mb-4 opacity-50">
                        <img src="/images/resume-scan.gif" alt="loading" className="w-full h-full object-contain mix-blend-multiply grayscale" />
                    </div>
                    <p className="text-secondary font-medium">Initializing Executive Dashboard...</p>
                </div>
            </main>
        );
    }

    if (!resume) return null;

    const feedback = resume.feedback as Feedback | null;

    return (
        <main className="min-h-screen bg-canvas-alt/50">
            {/* Premium Header (Static) */}
            <div className="mx-4 mt-2 bg-white/80 border border-white/20 shadow-sm backdrop-blur-md relative z-50 rounded-2xl">
                <div className="max-w-[1800px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6 relative">
                    {/* Left: Nav & Title */}
                    <div className="flex items-center gap-5 min-w-0 flex-1">
                        <Link
                            href="/"
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-primary hover:border-slate-300 hover:shadow-md transition-all duration-300 flex-shrink-0 group"
                            title="Back to Dashboard"
                        >
                            <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>


                    </div>

                    {/* Center: Segmented Control Tabs */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center p-1 bg-slate-100/80 backdrop-blur-md rounded-xl border border-slate-200/50 shadow-inner">
                        <button
                            onClick={() => setActiveTab("analysis")}
                            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${activeTab === "analysis"
                                ? "bg-white text-primary shadow-sm ring-1 ring-black/5 scale-[1.02]"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            <svg className={`w-4 h-4 ${activeTab === "analysis" ? "text-accent" : "opacity-50"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
                            Analysis Report
                        </button>
                        <button
                            onClick={() => setActiveTab("editor")}
                            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${activeTab === "editor"
                                ? "bg-white text-primary shadow-sm ring-1 ring-black/5 scale-[1.02]"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            <svg className={`w-4 h-4 ${activeTab === "editor" ? "text-emerald-500" : "opacity-50"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Resume Editor
                        </button>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Re-analyze Button */}
                        {resumeText && (
                            <button
                                onClick={handleReanalyze}
                                disabled={isReanalyzing}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm border ${isReanalyzing
                                    ? "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed"
                                    : "bg-white border-slate-200 text-slate-700 hover:border-accent hover:text-accent hover:shadow-md active:scale-95"}`}
                                title="Run new analysis on current text"
                            >
                                {isReanalyzing ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                        Re-Analyze
                                    </>
                                )}
                            </button>
                        )}

                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition-all duration-300"
                            title="Delete Analysis"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6 py-8">
                <div className="grid grid-cols-12 gap-8">

                    {/* Left Sidebar - Sticky PDF Preview */}
                    <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-6">
                        <div className="sticky top-28 space-y-6">

                            {/* Context Card (Moved from Header) */}
                            <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100 space-y-3">
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target Role</div>
                                    <h2 className="text-lg font-bold text-slate-900 leading-tight">
                                        {resume.jobTitle}
                                    </h2>
                                </div>

                                {resume.companyName && (
                                    <div className="pt-3 border-t border-slate-100">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target Company</div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={`https://cdn.jsdelivr.net/gh/gilbarbara/logos@master/logos/${resume.companyName.toLowerCase().replace(/\s+/g, '-')}-icon.svg`}
                                                    alt={resume.companyName}
                                                    className="w-5 h-5 object-contain"
                                                    onError={(e) => {
                                                        // Try without -icon suffix
                                                        const target = e.currentTarget;
                                                        if (target.src.includes('-icon.svg')) {
                                                            target.src = target.src.replace('-icon.svg', '.svg');
                                                        } else {
                                                            target.style.display = 'none';
                                                            target.nextElementSibling?.classList.remove('hidden');
                                                        }
                                                    }}
                                                />
                                                <div className="hidden w-full h-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                                                    {resume.companyName.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            <span className="font-semibold text-slate-700">{resume.companyName}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-2xl p-4 shadow-xl shadow-slate-200/50 border border-white/50 backdrop-blur-sm">
                                <div className="aspect-[1/1.4] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative group">
                                    {imageUrl ? (
                                        <img src={imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Resume" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">No Preview</div>
                                    )}

                                    <a
                                        href={pdfUrl}
                                        target="_blank"
                                        className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                                    >
                                        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg font-semibold text-sm transform translate-y-2 group-hover:translate-y-0 transition-all">
                                            Open Original PDF
                                        </div>
                                    </a>
                                </div>

                                <div className="mt-4 flex items-center justify-between px-2">
                                    <div className="text-xs font-mono text-slate-400">
                                        {new Date(resume.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                                        PDF
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <div className="col-span-12 lg:col-span-8 xl:col-span-9">
                        {activeTab === "analysis" ? (
                            <div className="space-y-8 animate-fade-up">
                                {feedback ? (
                                    <>
                                        {/* Hero Score Card */}
                                        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/40 border border-white/60 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                                            <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                                                <div className="flex-shrink-0">
                                                    <ScoreRing
                                                        score={feedback.overallScore}
                                                        size={180}
                                                        strokeWidth={12}
                                                        subLabel="Resume Score"
                                                    />
                                                </div>

                                                <div className="flex-1 text-center md:text-left space-y-4">
                                                    <div>
                                                        <h2 className="text-3xl font-bold text-primary font-display mb-2">
                                                            {feedback.overallScore >= 80 ? "Exemplary Candidate Profile" :
                                                                feedback.overallScore >= 60 ? "Solid Professional Foundation" :
                                                                    "Optimization Required"}
                                                        </h2>
                                                        <p className="text-secondary text-lg leading-relaxed max-w-2xl">
                                                            {feedback.overallScore >= 80
                                                                ? "Your resume demonstrates exceptional alignment with industry standards. Minor tweaks can achieve perfection."
                                                                : "We've identified several key areas where your resume can be significantly strengthened to pass ATS filters."}
                                                        </p>
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                                                        {[
                                                            { label: 'ATS', val: feedback.ATS.score },
                                                            { label: 'Content', val: feedback.content.score },
                                                            { label: 'Structure', val: feedback.structure.score },
                                                            { label: 'Impact', val: feedback.skills.score }, // Using 'Impact' for Skills score visual
                                                        ].map(s => (
                                                            <div key={s.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                                <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">{s.label}</div>
                                                                <div className={`text-xl font-bold ${s.val >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                                    {s.val}/100
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Detailed Breakdown - Accordion Style */}
                                        <div className="grid gap-6">
                                            <h3 className="text-xl font-bold text-primary px-2 font-display">Optimization Roadmap</h3>

                                            <Accordion defaultOpen="ats" className="space-y-4">
                                                {/* ATS Section */}
                                                <AccordionItem id="ats" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                                    <AccordionHeader itemId="ats" className="hover:bg-slate-50/50">
                                                        <div className="flex items-center gap-4">
                                                            <ScoreRing score={feedback.ATS.score} size={48} strokeWidth={4} showLabel={false} animate={false} />
                                                            <div>
                                                                <div className="font-bold text-lg text-primary">ATS Compatibility</div>
                                                                <div className="text-xs text-secondary font-medium">Critical for passing screening robots</div>
                                                            </div>
                                                        </div>
                                                    </AccordionHeader>
                                                    <AccordionContent itemId="ats">
                                                        <div className="grid gap-3 pt-2">
                                                            {feedback.ATS.tips
                                                                .filter((tip) => !addressedTips.has(tip.tip))
                                                                .map((tip, idx) => {
                                                                    const tipKey = tip.tip; // Use tip text as key for cross-section dedup
                                                                    return (
                                                                        <div key={idx} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                                            <div className={`mt-1 ${tip.type === 'good' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                                                {tip.type === 'good' ? (
                                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                                ) : (
                                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <div className="font-medium text-primary mb-1">{tip.tip}</div>
                                                                                {tip.type === 'improve' && (
                                                                                    <button onClick={() => handleOpenFixModal(tip, 'ATS', tipKey)} className="text-xs font-bold text-accent hover:text-accent-hover flex items-center gap-1 mt-2">
                                                                                        GENERATE FIX <span className="text-lg leading-none">→</span>
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>

                                                {/* Content Quality */}
                                                <AccordionItem id="content" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                                    <AccordionHeader itemId="content" className="hover:bg-slate-50/50">
                                                        <div className="flex items-center gap-4">
                                                            <ScoreRing score={feedback.content.score} size={48} strokeWidth={4} showLabel={false} animate={false} />
                                                            <div>
                                                                <div className="font-bold text-lg text-primary">Content Impact</div>
                                                                <div className="text-xs text-secondary font-medium">Clarity and action-oriented language</div>
                                                            </div>
                                                        </div>
                                                    </AccordionHeader>
                                                    <AccordionContent itemId="content">
                                                        <div className="grid gap-3 pt-2">
                                                            {feedback.content.tips
                                                                .filter((tip) => !addressedTips.has(tip.tip))
                                                                .map((tip, idx) => {
                                                                    const tipKey = tip.tip; // Use tip text as key for cross-section dedup
                                                                    return (
                                                                        <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                                            <div className="font-medium text-primary mb-1">{tip.tip}</div>
                                                                            <div className="text-sm text-secondary mb-3">{tip.explanation}</div>
                                                                            {tip.type === 'improve' && (
                                                                                <button onClick={() => handleOpenFixModal(tip, 'Content', tipKey)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-primary hover:border-accent hover:text-accent transition-colors shadow-sm">
                                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                                                    Smart Fix
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>

                                                {/* Structure & Tone - Grouped visually */}
                                                {['structure', 'toneAndStyle'].map(key => {
                                                    const section = feedback[key as keyof Feedback] as any;
                                                    if (!section) return null;
                                                    return (
                                                        <AccordionItem key={key} id={key} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                                            <AccordionHeader itemId={key} className="hover:bg-slate-50/50">
                                                                <div className="flex items-center gap-4">
                                                                    <ScoreRing score={section.score} size={48} strokeWidth={4} showLabel={false} animate={false} />
                                                                    <div>
                                                                        <div className="font-bold text-lg text-primary capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                                                                        <div className="text-xs text-secondary font-medium">Layout and professional voice</div>
                                                                    </div>
                                                                </div>
                                                            </AccordionHeader>
                                                            <AccordionContent itemId={key}>
                                                                <div className="grid gap-3 pt-2">
                                                                    {section.tips
                                                                        .filter((tip: any) => !addressedTips.has(tip.tip))
                                                                        .map((tip: any, idx: number) => {
                                                                            const tipKey = tip.tip; // Use tip text as key for cross-section dedup
                                                                            return (
                                                                                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                                                    <div className="font-medium text-primary mb-1">{tip.tip}</div>
                                                                                    <div className="text-sm text-secondary">{tip.explanation}</div>
                                                                                    {tip.type === 'improve' && (
                                                                                        <button onClick={() => handleOpenFixModal(tip, key === 'toneAndStyle' ? 'Tone & Style' : 'Structure', tipKey)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-primary hover:border-accent hover:text-accent transition-colors shadow-sm mt-3">
                                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                                                            Smart Fix
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                </div>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    );
                                                })}
                                            </Accordion>
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-12 text-center text-secondary">No feedback analysis available.</div>
                                )}
                            </div>
                        ) : (
                            // Editor Tab
                            <div className="h-[calc(100vh-140px)] animate-scale-in">
                                {resumeText ? (
                                    <ResumeEditor
                                        content={resumeText}
                                        onContentChange={setResumeText}
                                        pendingChange={pendingFix}
                                        onAcceptChange={handleAcceptFix}
                                        onRejectChange={handleRejectFix}
                                    />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-slate-300 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-primary mb-2">Resume Text Not Found</h3>
                                        <p className="text-secondary opacity-80 max-w-sm mb-6">
                                            The text content couldn't be automatically extracted. Please paste your resume text below to enable the editor and smart fixes.
                                        </p>
                                        <textarea
                                            className="w-full max-w-2xl h-64 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none resize-none font-mono text-sm"
                                            placeholder="Paste your resume text here..."
                                            onChange={(e) => setResumeText(e.target.value)}
                                        />
                                        <div className="mt-4 text-xs text-secondary">
                                            Paste text to activate the editor
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Smart Fix Modal */}
            {selectedTip && (
                <FixModal
                    isOpen={showFixModal}
                    onClose={() => setShowFixModal(false)}
                    issue={selectedTip.tip}
                    explanation={selectedTip.explanation}
                    category={selectedTip.category}
                    jobContext={resume ? { title: resume.jobTitle, description: resume.jobDescription } : undefined}
                    resumeContext={resumeText}
                    onApplyFix={(improved, original) => handleApplyFix(improved, original)}
                />
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowDeleteConfirm(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-scale-in border border-white/20">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto text-red-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-primary mb-2 text-center">Delete Analysis?</h3>
                        <p className="text-secondary text-sm mb-6 text-center leading-relaxed">This will permanently remove this analysis and its data. This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-primary font-semibold hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 shadow-lg shadow-red-200 transition-all hover:-translate-y-0.5"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
