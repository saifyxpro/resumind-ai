
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="mt-auto py-12 border-t border-slate-100 bg-white/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center space-y-6 text-center">

                {/* Brand */}
                <Link href="/" className="inline-block transition-transform hover:scale-105 active:scale-95 duration-300">
                    <h2 className="text-xl font-bold font-display tracking-tight text-slate-900 uppercase">
                        RESUMIND<span className="text-accent">.</span>
                    </h2>
                </Link>

                {/* Copyright */}
                <p className="text-slate-400 text-sm font-medium">
                    &copy; 2026 Resumind. Built for professionals.
                </p>

                {/* Legal Links (Subtle) */}
                <div className="flex items-center gap-6 pt-2">
                    <Link
                        href="/privacy-policy"
                        className="text-xs font-medium text-slate-400 hover:text-primary transition-colors border-b border-transparent hover:border-slate-300 pb-0.5"
                    >
                        Privacy Policy
                    </Link>
                    <Link
                        href="/terms-of-service"
                        className="text-xs font-medium text-slate-400 hover:text-primary transition-colors border-b border-transparent hover:border-slate-300 pb-0.5"
                    >
                        Terms of Service
                    </Link>
                </div>
            </div>
        </footer>
    );
}
