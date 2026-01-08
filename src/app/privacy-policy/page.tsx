
export default function PrivacyPolicy() {
    return (
        <main className="min-h-screen bg-canvas-alt/50 pt-32 pb-20">
            <div className="max-w-3xl mx-auto px-6">
                <h1 className="text-3xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
                <div className="prose prose-slate">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>
                    <p>At Resumind, we take your privacy seriously. This Privacy Policy describes how we collect, use, and protect your information.</p>

                    <h3>1. Information We Collect</h3>
                    <p>We collect information you provide directly to us, such as when you upload a resume for analysis. This includes your name, contact information, and professional history contained within the resume.</p>

                    <h3>2. How We Use Your Information</h3>
                    <p>We use the information we collect to provide, maintain, and improve our services, specifically to generate AI-powered analysis and feedback on your resume.</p>

                    <h3>3. Data Security</h3>
                    <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.</p>

                    <h3>4. Contact Us</h3>
                    <p>If you have any questions about this Privacy Policy, please contact us.</p>
                </div>
            </div>
        </main>
    );
}
