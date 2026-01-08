
export default function TermsOfService() {
    return (
        <main className="min-h-screen bg-canvas-alt/50 pt-32 pb-20">
            <div className="max-w-3xl mx-auto px-6">
                <h1 className="text-3xl font-bold text-slate-900 mb-8">Terms of Service</h1>
                <div className="prose prose-slate">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>
                    <p>Please read these Terms of Service custom carefully before using Resumind.</p>

                    <h3>1. Acceptance of Terms</h3>
                    <p>By accessing or using our service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.</p>

                    <h3>2. Use of Service</h3>
                    <p>You are responsible for the content of the resumes you upload. You agree not to upload any content that is illegal, offensive, or violates the rights of others.</p>

                    <h3>3. AI Analysis</h3>
                    <p>Our service uses Artificial Intelligence to analyze resumes. While we strive for accuracy, we cannot guarantee the correctness or effectiveness of the advice provided.</p>

                    <h3>4. Changes</h3>
                    <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time.</p>
                </div>
            </div>
        </main>
    );
}
