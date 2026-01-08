"use client";

import { useEffect, useRef, useState } from "react";

import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface PendingChange {
    appliedContent: string;
    originalContent: string;
    selectionRange: [number, number];
}

interface ResumeEditorProps {
    content: string;
    onContentChange: (newContent: string) => void;
    pendingChange?: PendingChange | null;
    onAcceptChange?: () => void;
    onRejectChange?: () => void;
}

export default function ResumeEditor({
    content,
    onContentChange,
    pendingChange,
    onAcceptChange,
    onRejectChange
}: ResumeEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [localContent, setLocalContent] = useState(content);
    const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
    const [popupPosition, setPopupPosition] = useState<{ top: number, left: number } | null>(null);

    // Sync local state when prop changes, specifically handling pending changes
    useEffect(() => {
        if (pendingChange) {
            setLocalContent(pendingChange.appliedContent);

            if (textareaRef.current && viewMode === "edit") {
                const [start, end] = pendingChange.selectionRange;

                setTimeout(() => {
                    if (!textareaRef.current) return;
                    textareaRef.current.focus();
                    textareaRef.current.setSelectionRange(start, end);

                    // Helper logic inline to avoid external dep
                    const element = textareaRef.current;
                    const div = document.createElement('div');
                    const styles = window.getComputedStyle(element);

                    ['font-family', 'font-size', 'font-weight', 'line-height', 'padding', 'border', 'width', 'box-sizing', 'white-space'].forEach(key => {
                        div.style.setProperty(key, styles.getPropertyValue(key));
                    });

                    div.style.position = 'absolute';
                    div.style.visibility = 'hidden';
                    div.style.top = '-9999px';
                    div.style.left = '-9999px';
                    div.style.whiteSpace = 'pre-wrap';

                    div.textContent = pendingChange.appliedContent.substring(0, start);
                    const span = document.createElement('span');
                    span.textContent = pendingChange.appliedContent.substring(start, end);
                    div.appendChild(span);

                    document.body.appendChild(div);

                    const relativeTop = span.offsetTop;
                    const relativeLeft = span.offsetLeft;

                    // Auto-scroll logic
                    const lineHeight = parseInt(styles.lineHeight) || 20;
                    const lines = div.textContent?.split('\n').length || 1;
                    const estimatedScroll = Math.max(0, (lines * lineHeight) - (element.clientHeight / 2));
                    element.scrollTop = estimatedScroll;

                    setPopupPosition({
                        top: relativeTop - 45, // Positioning slightly above
                        left: Math.min(Math.max(20, relativeLeft), element.clientWidth - 280)
                    });

                    document.body.removeChild(div);

                }, 50);
            }
        } else {
            setLocalContent(content);
            setPopupPosition(null);
        }
    }, [content, pendingChange, viewMode]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        // If pending change exists, user shouldn't edit manually until resolved? 
        // Or editing "accepts" it implicitly? Let's block editing or warn. 
        // For smooth UX, let's treat manual edit as "taking over" but for now let's just allow it.
        const newValue = e.target.value;
        setLocalContent(newValue);
        onContentChange(newValue);
    };

    const handleDownload = () => {
        // Create a printable window
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Escape backticks and standard chars for template string safety
        const safeContent = localContent
            .replace(/\\/g, '\\\\')
            .replace(/`/g, '\\`')
            .replace(/\${/g, '\\${');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Resume</title>
                <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
                <style>
                    body {
                        font-family: 'Georgia', 'Times New Roman', serif;
                        line-height: 1.6;
                        color: #1a1a1a;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 40px;
                    }
                    /* Markdown Styling */
                    h1 { 
                        font-size: 24pt; 
                        text-transform: uppercase; 
                        letter-spacing: 1px; 
                        border-bottom: 2px solid #000; 
                        padding-bottom: 4px; 
                        margin-bottom: 16px; 
                        margin-top: 0;
                    }
                    h2 { 
                        font-size: 14pt; 
                        font-weight: bold; 
                        text-transform: uppercase; 
                        border-bottom: 1px solid #ccc; 
                        padding-bottom: 2px; 
                        margin-top: 24px; 
                        margin-bottom: 12px;
                        color: #2d3748;
                    }
                    h3 { font-size: 12pt; font-weight: bold; margin-top: 16px; margin-bottom: 4px; }
                    p { margin-bottom: 8px; font-size: 11pt; text-align: justify; }
                    ul { margin-top: 4px; margin-bottom: 8px; padding-left: 20px; }
                    li { margin-bottom: 2px; font-size: 11pt; }
                    strong { font-weight: 700; color: #000; }
                    
                    @media print {
                        body {
                            padding: 0;
                            margin: 1.5cm;
                            max-width: 100%;
                        }
                        a { text-decoration: none; color: inherit; }
                    }
                </style>
            </head>
            <body>
                <div id="content"></div>
                <script>
                    document.getElementById('content').innerHTML = marked.parse(\`${safeContent}\`);
                    
                    // Wait for rendering then print
                    setTimeout(() => {
                        window.print();
                    }, 500);
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
    };

    const handleExportMarkdown = () => {
        const blob = new Blob([localContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className={`flex flex-col h-full bg-white rounded-xl border shadow-sm overflow-hidden relative transition-colors ${pendingChange ? 'border-accent ring-4 ring-accent/10' : 'border-slate-200'}`}>

            {/* Review Overlay Bar - Fixed at bottom */}
            {pendingChange && (
                <div
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 p-2 pl-4 bg-slate-900 text-white rounded-full shadow-2xl animate-scale-in ring-2 ring-white/20"
                >
                    <span className="text-[11px] font-bold text-slate-300 mr-2 uppercase tracking-wide flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                        AI Suggestion
                    </span>
                    <button
                        onClick={onAcceptChange}
                        onMouseDown={(e) => e.preventDefault()}
                        className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        Accept
                    </button>
                    <button
                        onClick={onRejectChange}
                        onMouseDown={(e) => e.preventDefault()}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold rounded-lg transition-colors hover:text-red-300"
                    >
                        Reject
                    </button>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                    <button
                        onClick={() => setViewMode("edit")}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === "edit"
                            ? "bg-slate-100 text-slate-900 shadow-sm ring-1 ring-black/5"
                            : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => setViewMode("preview")}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === "preview"
                            ? "bg-slate-100 text-slate-900 shadow-sm ring-1 ring-black/5"
                            : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        Preview
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportMarkdown}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export MD
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download PDF
                    </button>
                </div>
            </div>

            {/* Editor/Preview Area */}
            <div className="relative flex-1 group overflow-hidden">
                {viewMode === "edit" ? (
                    <>
                        <textarea
                            ref={textareaRef}
                            value={localContent}
                            onChange={handleChange}
                            className={`w-full h-full p-8 resize-none outline-none font-mono text-sm leading-relaxed text-slate-700 bg-white selection:bg-accent/20 transition-opacity ${pendingChange ? 'opacity-50' : ''}`}
                            placeholder="Resume content will appear here..."
                            spellCheck={false}
                            readOnly={!!pendingChange} // Lock editing during review
                        />
                        {/* Status Indicator */}
                        <div className="absolute bottom-4 right-4 text-[10px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {localContent.length} chars
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full overflow-y-auto bg-slate-50/50 p-8">
                        <div className="max-w-[800px] mx-auto bg-white shadow-sm border border-slate-100 min-h-[1000px] p-[40px] prose prose-sm prose-slate max-w-none">
                            <style jsx global>{`
                                .prose {
                                    font-family: 'Georgia', 'Times New Roman', serif;
                                    color: #1a1a1a;
                                }
                                .prose h1 { 
                                    font-size: 24pt; 
                                    text-transform: uppercase; 
                                    letter-spacing: 1px; 
                                    border-bottom: 2px solid #000; 
                                    padding-bottom: 4px; 
                                    margin-bottom: 16px; 
                                    margin-top: 0;
                                    line-height: 1.2;
                                }
                                .prose h2 { 
                                    font-size: 14pt; 
                                    font-weight: bold; 
                                    text-transform: uppercase; 
                                    border-bottom: 1px solid #ccc; 
                                    padding-bottom: 2px; 
                                    margin-top: 24px; 
                                    margin-bottom: 12px;
                                    color: #2d3748;
                                }
                                .prose h3 { margin-top: 16px; margin-bottom: 4px; font-weight: bold; }
                                .prose p { margin-bottom: 8px; text-align: justify; }
                                .prose ul { padding-left: 20px; list-style-type: disc; }
                                .prose li { margin-bottom: 2px; margin-top: 0; }
                            `}</style>
                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{localContent}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
