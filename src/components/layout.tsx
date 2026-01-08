import Link from "next/link";

const Navbar = () => {
    return (
        <div className="nav-container mt-6 px-4 animate-fade-up">
            <nav className="nav-glass">
                <Link href="/" className="inline-block transition-transform hover:scale-105 active:scale-95 duration-300">
                    <h2 className="text-xl font-bold font-display tracking-tight text-slate-900 uppercase">
                        RESUMIND<span className="text-accent">.</span>
                    </h2>
                </Link>
                <Link
                    href="/upload"
                    className="btn-primary text-sm px-6 py-2.5"
                >
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Analysis
                    </span>
                </Link>
            </nav>
        </div>
    )
}
export default Navbar
