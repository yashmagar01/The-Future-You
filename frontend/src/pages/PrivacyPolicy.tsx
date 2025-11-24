import React from "react";

// Privacy Policy Page for The Future You
// Single-file React component (Tailwind CSS classes used for styling)
// Default export a React component ready to drop into a React/Next.js app.
//
// Integration notes and implementation checklist are included at the bottom of this file
// as a large commented block for the coding assistant / dev team.
//
// Local reference docs used while writing this page:
// - /mnt/data/Yash_ Core Objectives and Goals.pdf
// - /mnt/data/Yash MVP Technology Overview.pdf
// - /mnt/data/Final Tech Stack.pdf
//
// These local files were used to align wording and tech details. Replace email/URLs
// with your production values before publishing.

const POLICY_PDF_PATH = "#"; // developer: transform this path to your public URL if required

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-8">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold">Privacy Policy</h1>
          <p className="mt-2 text-gray-600">The Future You — AI Personal Communication Coach</p>
          <p className="mt-1 text-sm text-gray-500">Effective date: 24 November 2025</p>
        </header>

        <div className="prose max-w-none">
          <section>
            <h2 className="text-xl font-bold mt-6 mb-2">1. Introduction</h2>
            <p className="mb-4">
              Welcome to <strong>The Future You</strong>. We provide an AI-powered self-reflection and
              communication tool where users upload short videos to receive automated feedback on
              clarity, tone, posture, and speaking style.
            </p>
            <p className="mb-4">
              This policy explains what data we collect, how we use it, where we store it, how long
              we keep it, and your rights. We aim for clear, simple language: we only collect what we
              need, and we never sell your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-6 mb-2">2. Data we collect</h2>
            <h3 className="text-lg font-semibold mt-4 mb-2">2.1 Account information</h3>
            <p className="mb-4">
              We use Supabase Auth for authentication. We store basic account data such as email
              address and hashed password (Supabase handles password encryption). We also record
              device and login metadata (IP, browser, OS) for security and debugging.
            </p>

            <h3 className="text-lg font-semibold mt-4 mb-2">2.2 Video & audio data</h3>
            <p className="mb-4">
              When you upload a 5–10 minute video, the raw video file is stored in Supabase
              Storage. We extract audio locally using FFmpeg for analysis. No human reviews your
              raw videos unless you explicitly opt into a research program.
            </p>

            <h3 className="text-lg font-semibold mt-4 mb-2">2.3 AI-generated analysis</h3>
            <p className="mb-4">
              We analyze videos using local, open-source models running on our compute layer.
              Typical models in use at MVP:
            </p>
            <ul className="list-disc pl-5 mb-4">
              <li>Vosk — offline speech-to-text (transcripts & timestamps)</li>
              <li>Transformers.js — clarity, filler-word detection, simple summarization</li>
              <li>MediaPipe Pose — posture and gesture detection</li>
            </ul>

            <p className="mb-4">
              The outputs (transcript, clarity score, tone summary, posture markers, and
              structured insights) are stored as JSON in the Supabase database.
            </p>

            <h3 className="text-lg font-semibold mt-4 mb-2">2.4 Internal logs and analytics</h3>
            <p className="mb-4">
              We store internal logs and usage counters (upload success, feature usage, streaks)
              inside Supabase for product reliability and debugging. We do not use external
              analytics providers like Google Analytics in this MVP.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-6 mb-2">3. How we use your data</h2>
            <p className="mb-4">
              We use your data to provide and improve the service:
            </p>
            <ul className="list-disc pl-5 mb-4">
              <li>Process videos and produce insights shown on your dashboard.</li>
              <li>Maintain authentication and account security.</li>
              <li>Improve product reliability and offline model accuracy (beta users only).</li>
            </ul>
            <p className="mb-4">
              We do not sell your data, use it for advertising, or send your raw videos to third-party
              AI services. All core analysis happens using local/open-source tools and Supabase.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-6 mb-2">4. Storage and retention</h2>
            <h3 className="text-lg font-semibold mt-4 mb-2">Normal users</h3>
            <p className="mb-4">Videos are deleted within 24–48 hours after automated processing completes.</p>

            <h3 className="text-lg font-semibold mt-4 mb-2">Beta users</h3>
            <p className="mb-4">
              If you sign up as a beta tester and consent, we may store videos for up to 12 months
              to improve our models. You may withdraw consent any time and we will delete your
              stored videos within 7 days.
            </p>

            <h3 className="text-lg font-semibold mt-4 mb-2">Transcripts and analysis</h3>
            <p className="mb-4">
              Transcripts and analysis results are retained in Supabase until you request deletion
              or you delete your account. Temporary processing files are removed after analysis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-6 mb-2">5. Security</h2>
            <p className="mb-4">
              We follow secure practices appropriate for this MVP:
            </p>
            <ul className="list-disc pl-5 mb-4">
              <li>HTTPS/TLS for all traffic.</li>
              <li>Supabase Row-Level Security (RLS) to ensure users only access their own data.</li>
              <li>Signed upload URLs and limited access to storage objects.</li>
              <li>Temporary files are removed after processing; we do not keep video data in logs.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-6 mb-2">6. Data sharing</h2>
            <p className="mb-4">
              We do not share your personal data with third-party AI providers, advertisers, or
              data brokers. The only external service we use is Supabase for hosting storage,
              database, and authentication.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-6 mb-2">7. Your rights</h2>
            <p className="mb-4">
              You control your data. You can request:
            </p>
            <ul className="list-disc pl-5 mb-4">
              <li>Account deletion (removes videos, transcripts, and insights)</li>
              <li>Data export (download transcripts and analysis results)</li>
              <li>Withdrawal of beta consent (stop any future research use)</li>
            </ul>
            <p className="mb-4">
              To exercise these rights, contact us at <strong>privacy@thefutureyou.app</strong> or
              use the account settings page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-6 mb-2">8. Cookies</h2>
            <p className="mb-4">
              We only use essential cookies via Supabase Auth for login sessions. We do not use
              tracking or advertising cookies in the MVP.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-6 mb-2">9. Children</h2>
            <p className="mb-4">
              The service is not intended for children under 13. If we learn that a child under 13
              created an account, we will delete their data promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-6 mb-2">10. Changes to this policy</h2>
            <p className="mb-4">
              We will update this policy when our tech stack or data practices change (for
              example, if we start using paid cloud APIs). Significant changes will be presented to
              users via email or an in-app banner.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-6 mb-2">11. Contact</h2>
            <p className="mb-4">
              For privacy requests or questions: <strong>privacy@thefutureyou.app</strong>.
            </p>

            <div className="mt-4 flex gap-3">
              <a
                href={POLICY_PDF_PATH}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
              >
                Download reference PDF
              </a>

              <a
                href="#contact"
                className="inline-block px-4 py-2 border border-gray-300 text-sm rounded-md hover:bg-gray-50 transition-colors"
              >
                Contact us
              </a>
            </div>
          </section>
        </div>

        <footer className="mt-8 text-xs text-gray-500 border-t pt-4">
          <p>Short summary: We use local open-source models and Supabase. We do not sell your data.</p>
        </footer>
      </div>
    </main>
  );
}
