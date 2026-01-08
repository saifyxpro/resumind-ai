"use client";

import { useState } from "react";
import { getAIFix, type AIFixResult } from "@/lib/openai";

interface FixModalProps {
    isOpen: boolean;
    onClose: () => void;
    issue: string;
    explanation: string;
    category: string;
    jobContext?: { title: string; description: string };
    resumeContext?: string;
    onApplyFix?: (improved: string, original?: string) => void;
}

export default function FixModal({
    isOpen,
    onClose,
    issue,
    explanation,
    category,
    jobContext,
    resumeContext,
    onApplyFix,
}: FixModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [fix, setFix] = useState<AIFixResult | null>(null);

    // ... (lines 35-188 remain unchanged)

    {
        onApplyFix && (
            <button
                onClick={() => fix?.improved && onApplyFix(fix.improved, fix.originalSnippet)}
                className="btn-primary flex-[2] justify-center text-sm flex items-center gap-2 bg-accent hover:bg-accent-hover shadow-sky-200"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Apply Fix
            </button>
        )
    }
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGetFix = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getAIFix(issue, explanation, category, jobContext, resumeContext);
            setFix(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to get AI fix");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        if (fix?.improved) {
            await navigator.clipboard.writeText(fix.improved);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClose = () => {
        setFix(null);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm animate-fade-in"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-0 overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-primary leading-tight">AI Enhancement</h3>
                            <p className="text-xs text-secondary font-medium uppercase tracking-wide">{category}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {/* Original Issue */}
                    <div className="mb-8">
                        <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-3 block">Identified Issue</label>
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                            <p className="font-medium text-amber-900">{issue}</p>
                            <p className="text-sm text-amber-700 mt-2 leading-relaxed">{explanation}</p>
                        </div>
                    </div>

                    {/* AI Fix Generation Area */}
                    {!fix && !isLoading && !error && (
                        <div className="flex flex-col items-center gap-6 py-6 border-t border-dashed border-slate-200">
                            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                                <img src="/icons/info.svg" alt="AI" className="w-8 h-8 opacity-50 grayscale" />
                            </div>
                            <div className="text-center max-w-sm">
                                <h4 className="font-semibold text-primary mb-1">Ready to Fix?</h4>
                                <p className="text-secondary text-sm">Our AI will rewrite this section to better match industry standards and ATS requirements.</p>
                            </div>
                            <button
                                onClick={handleGetFix}
                                className="btn-primary w-auto px-8 py-3 text-sm"
                            >
                                Generate Correction
                            </button>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex flex-col items-center gap-4 py-12">
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin"></div>
                            </div>
                            <p className="text-secondary font-medium animate-pulse">Generating improvements...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-sm">Generation Failed</p>
                                <p className="text-xs mt-1">{error}</p>
                            </div>
                            <button
                                onClick={handleGetFix}
                                className="text-sm font-medium underline hover:no-underline"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {fix && (
                        <div className="space-y-6 animate-fade-up">
                            <div>
                                <label className="text-xs font-bold text-accent uppercase tracking-wider mb-3 block flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-accent"></span>
                                    Suggested Improvement
                                </label>
                                <div className="p-5 bg-white border border-emerald-100 shadow-sm rounded-xl ring-1 ring-emerald-500/10">
                                    <p className="text-primary whitespace-pre-wrap leading-relaxed">{fix.improved}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-3 block">Reasoning</label>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                    <p className="text-sm text-secondary leading-relaxed">{fix.explanation}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {fix && (
                    <div className="p-6 border-t border-border bg-slate-50 flex gap-4">
                        <button
                            onClick={handleGetFix}
                            className="btn-secondary flex-1 justify-center text-sm"
                        >
                            Regenerate
                        </button>
                        <button
                            onClick={handleCopy}
                            className={`btn-secondary flex-1 justify-center text-sm flex items-center gap-2 transition-all ${copied ? 'bg-emerald-50 text-emerald-600' : ''}`}
                        >
                            {copied ? (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Copied
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                    Copy
                                </>
                            )}
                        </button>
                        {onApplyFix && (
                            <button
                                onClick={() => fix?.improved && onApplyFix(fix.improved, fix.originalSnippet)}
                                className="btn-primary flex-[2] justify-center text-sm flex items-center gap-2 bg-accent hover:bg-accent-hover shadow-sky-200"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                Apply Fix
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
