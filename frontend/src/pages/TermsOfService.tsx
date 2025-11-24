import React from "react";

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-8">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold">Terms of Service</h1>
          <p className="mt-2 text-gray-600">The Future You — AI Personal Communication Coach</p>
          <p className="mt-1 text-sm text-gray-500">Effective date: 24 November 2025</p>
        </header>

        <div className="prose max-w-none">
          <section className="mb-6">
            <h2 className="text-xl font-bold mb-2">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing or using The Future You ("Service"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-bold mb-2">2. Description of Service</h2>
            <p className="mb-4">
              The Future You is an AI-powered self-reflection and communication tool. We provide automated feedback
              on your uploaded videos using artificial intelligence technologies.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-bold mb-2">3. User Accounts</h2>
            <p className="mb-4">
              You are responsible for maintaining the confidentiality of your account and password.
              You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-bold mb-2">4. User Content</h2>
            <p className="mb-4">
              You retain all rights to the videos you upload. By uploading content, you grant us a license to
              process and analyze it solely for the purpose of providing the Service to you, in accordance with our Privacy Policy.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-bold mb-2">5. Acceptable Use</h2>
            <p className="mb-4">
              You agree not to misuse the Service or help anyone else do so. You must not upload content that is illegal,
              harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-bold mb-2">6. Termination</h2>
            <p className="mb-4">
              We may terminate or suspend your access to the Service immediately, without prior notice or liability,
              for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-bold mb-2">7. Limitation of Liability</h2>
            <p className="mb-4">
              In no event shall The Future You, nor its directors, employees, partners, agents, suppliers, or affiliates,
              be liable for any indirect, incidental, special, consequential or punitive damages.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-bold mb-2">8. Changes</h2>
            <p className="mb-4">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-bold mb-2">9. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us at <strong>support@thefutureyou.app</strong>.
            </p>

            <div className="mt-4 flex gap-3">
              <a
                href="/docs/terms.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
              >
                Download PDF
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
