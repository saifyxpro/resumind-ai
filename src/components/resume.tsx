import Link from "next/link";
import ScoreRing from "@/components/ScoreRing";
import { type Feedback } from "@/lib/db";

interface ResumeCardProps {
    id: string;
    companyName?: string;
    jobTitle?: string;
    imagePath: string;
    feedback?: Feedback;
}

const ResumeCard = ({ id, companyName, jobTitle, feedback, imagePath }: ResumeCardProps) => {
    const score = feedback?.overallScore || 0;

    return (
        <Link
            href={`/resume/${id}`}
            className="group relative flex flex-col bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-border/50 hover:border-slate-300 ring-1 ring-black/5"
        >
            {/* Image Preview Area */}
            <div className="relative aspect-[3/4] bg-slate-50 w-full overflow-hidden border-b border-border/50">
                {imagePath ? (
                    <>
                        <img
                            src={imagePath}
                            alt="Resume preview"
                            className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                        />
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                )}

                {/* Score Tag floating on top right */}
                {score > 0 && (
                    <div className="absolute top-3 right-3 shadow-sm bg-white rounded-full p-0.5 ring-1 ring-black/5">
                        <ScoreRing
                            score={score}
                            size={48}
                            strokeWidth={4}
                            showLabel={true}
                            animate={false}
                            subLabel=""
                        />
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="p-5 flex flex-col gap-1.5 flex-1">
                {companyName && (
                    <div className="inline-flex self-start items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200/50">
                        {companyName}
                    </div>
                )}

                <h3 className="font-bold text-primary truncate text-lg group-hover:text-accent transition-colors font-display leading-tight mt-1">
                    {jobTitle || "Resume Analysis"}
                </h3>

                <div className="flex-1" />

                <div className="pt-4 flex items-center justify-between border-t border-border/50 mt-2">
                    <span className="text-xs font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-1 group-hover:translate-y-0 duration-300 flex items-center gap-1">
                        View Report
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </span>
                    <span className="text-[10px] font-medium text-tertiary">
                        {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                </div>
            </div>
        </Link>
    )
}
export default ResumeCard
