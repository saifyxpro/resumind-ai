"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout";
import ResumeCard from "@/components/resume";
import { getAllResumes, type ResumeRecord } from "@/lib/db";

const features = [
  {
    icon: "/icons/info.svg",
    title: "AI-Powered Analysis",
    description: "Get instant, comprehensive feedback on your resume's ATS compatibility and content quality.",
    delay: "stagger-1"
  },
  {
    icon: "/icons/ats-good.svg",
    title: "Detailed Scoring",
    description: "Receive precise scores across 5 key dimensions: ATS, Content, Structure, Tone, and Skills.",
    delay: "stagger-2"
  },
  {
    icon: "/icons/check.svg",
    title: "Smart Suggestions",
    description: "One-click AI improvements for every issue found, helping you polish your resume instantly.",
    delay: "stagger-3"
  },
  {
    icon: "/icons/pin.svg",
    title: "100% Private",
    description: "Your data stays in your browser. No accounts created, no servers storing your files.",
    delay: "stagger-4" // fixed duration to simple number/string if needed, but using class here
  },
];

export default function Home() {
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResumes = async () => {
      try {
        const data = await getAllResumes();
        setResumes(data);
      } catch (error) {
        console.error("Failed to load resumes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadResumes();
  }, []);

  return (
    <main className="min-h-screen bg-transparent">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Powered by GPT-5
          </div>

          <h1 className="tracking-tight text-primary">
            Land Your Dream Job with <br className="hidden md:block" />
            <span className="text-accent">Intelligent Resume Analysis</span>
          </h1>

          <p className="text-xl text-secondary max-w-2xl mx-auto leading-relaxed">
            Upload your resume and get instant, actionable feedback. Optimize for ATS,
            improve your content, and stand out to recruiters.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/upload" className="btn-primary flex items-center gap-3 group">
              <span>Start Free Analysis</span>
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link href="#features" className="btn-secondary">
              Learn How It Works
            </Link>
          </div>

          <div className="pt-12 text-sm text-tertiary">
            No credit card required · No login · 100% Local Privacy
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 bg-canvas-alt border-y border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`executive-card hover:-translate-y-1 animate-fade-up stagger-${(index % 3) + 1}`}
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-6">
                  <img src={feature.icon} alt={feature.title} className="w-6 h-6 opacity-80" />
                </div>
                <h3 className="mb-3 text-lg font-bold text-primary">{feature.title}</h3>
                <p className="text-secondary text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Previous Analyses Section */}
      {!isLoading && resumes.length > 0 && (
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="flex items-end justify-between border-b border-border pb-6 animate-fade-up">
              <div>
                <h2 className="mb-2">Your Dashboard</h2>
                <p className="text-secondary">Manage and review your previous analyses</p>
              </div>
              <Link href="/upload" className="text-sm font-medium text-accent hover:text-accent-hover hidden md:block">
                analyze new resume →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {resumes.map((resume, index) => (
                <div key={resume.id} className={`animate-fade-up stagger-${(index % 3) + 1}`}>
                  <ResumeCard
                    id={resume.id}
                    companyName={resume.companyName}
                    jobTitle={resume.jobTitle}
                    imagePath={URL.createObjectURL(resume.imageBlob)}
                    feedback={resume.feedback || undefined}
                  />
                </div>
              ))}
            </div>

            <div className="md:hidden text-center pt-8">
              <Link href="/upload" className="text-sm font-medium text-accent hover:text-accent-hover">
                analyze new resume →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {!isLoading && resumes.length === 0 && (
        <section className="py-20 px-6">
          <div className="max-w-md mx-auto text-center executive-card bg-slate-50 border-dashed animate-fade-up">
            <div className="w-20 h-20 mx-auto mb-6 opacity-50">
              <img src="/images/pdf.png" alt="document" className="w-full h-full object-contain grayscale" />
            </div>
            <h3 className="mb-2">No Analyses Yet</h3>
            <p className="text-secondary mb-8">
              Upload your resume to see how it stacks up against ATS algorithms.
            </p>
            <Link href="/upload" className="btn-primary w-full justify-center flex">
              Upload Resume
            </Link>
          </div>
        </section>
      )}


    </main>
  );
}
