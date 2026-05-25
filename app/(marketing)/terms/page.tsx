'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080B14] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-white/[0.02] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-space font-bold">Terms of Service</h1>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-white/60 hover:text-white"
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="max-w-4xl mx-auto px-6 py-16"
      >
        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">Terms of Service</h2>
            <p className="text-white/60">
              Last updated: May 2026
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h3>
            <p className="text-white/70 leading-relaxed">
              By accessing and using XCrypt (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. We reserve the right to modify these terms at any time. Changes are effective immediately upon posting.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">2. Service Description</h3>
            <p className="text-white/70 leading-relaxed">
              XCrypt is an encrypted media sharing platform that allows users to upload, encrypt, and share files. The Service is provided &quot;as is&quot; without warranties of any kind, express or implied.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">3. User Accounts</h3>
            <div className="space-y-3 text-white/70">
              <div>
                <h4 className="font-semibold text-white mb-2">Account Creation</h4>
                <p>You may create an account using your email and password. You are responsible for maintaining the confidentiality of your account credentials.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Anonymous Access</h4>
                <p>You can use XCrypt without creating an account to upload and share files anonymously.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Account Responsibility</h4>
                <p>You are responsible for all activity on your account. You agree not to share your account credentials with third parties.</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">4. Prohibited Content &amp; Activities</h3>
            <p className="text-white/70 leading-relaxed mb-3">
              You agree not to upload, share, or transmit any content that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li>Violates any law or regulation</li>
              <li>Infringes on intellectual property rights or copyrights</li>
              <li>Contains explicit, offensive, or illegal material</li>
              <li>Includes malware, viruses, or harmful code</li>
              <li>Harasses, threatens, or defames any person</li>
              <li>Violates privacy rights or personal data regulations (GDPR, etc.)</li>
              <li>Is used for fraud, phishing, or social engineering</li>
              <li>Violates any third-party terms of service</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">5. Copyright &amp; Intellectual Property</h3>
            <p className="text-white/70 leading-relaxed">
              You retain all ownership rights to content you upload. By uploading content, you grant XCrypt a non-exclusive license to store, transmit, and display your content as necessary to provide the Service. You represent and warrant that you own or have the right to share all content you upload. You are responsible for ensuring you have proper licenses or permissions for all content shared through XCrypt.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">6. DMCA &amp; Copyright Infringement</h3>
            <p className="text-white/70 leading-relaxed">
              If you believe your copyright has been infringed, you may submit a DMCA takedown notice. We will investigate valid DMCA claims and take appropriate action, including removing infringing content. However, we cannot be held liable for user-uploaded content or third-party infringement claims.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">7. Storage Limits &amp; Service Limitations</h3>
            <div className="space-y-3 text-white/70">
              <div>
                <h4 className="font-semibold text-white mb-2">Free Tier</h4>
                <p>Free users have a 100MB total storage limit across all uploads. Individual files are limited to 10MB.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Premium Tier</h4>
                <p>Premium subscribers have unlimited storage and increased individual file limits.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Expiration</h4>
                <p>Files expire and are automatically deleted based on your settings. Deleted files cannot be recovered.</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">8. Encryption &amp; Data Loss Disclaimer</h3>
            <p className="text-white/70 leading-relaxed">
              While we use AES-256 encryption to protect your files, XCrypt is provided without warranties. We are not responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li>Loss of data due to user error or system failure</li>
              <li>Corruption of files during transmission</li>
              <li>Unauthorized access from weak passwords or compromised accounts</li>
              <li>Service interruptions or downtime</li>
              <li>Data loss resulting from your failure to maintain backups</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">9. User Responsibility for Content</h3>
            <p className="text-white/70 leading-relaxed mb-3">
              CRITICAL DISCLAIMER:
            </p>
            <p className="text-white/70 leading-relaxed">
              You are FULLY RESPONSIBLE for all content you upload and share. Platform owners and administrators are NOT liable for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li>How others use shared access codes</li>
              <li>Unauthorized distribution by recipients</li>
              <li>Illegal use or violations of law</li>
              <li>Copyright or trademark infringement</li>
              <li>Privacy violations or data breaches caused by user negligence</li>
              <li>Harassment, defamation, or harm caused by shared content</li>
            </ul>
            <p className="text-white/70 leading-relaxed mt-3">
              By using XCrypt, you assume full legal responsibility for your actions and content.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">10. Account Termination</h3>
            <p className="text-white/70 leading-relaxed">
              We reserve the right to suspend or terminate your account if you violate these Terms of Service or engage in illegal activity. Upon termination, your access to the Service is revoked and your data may be deleted permanently.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">11. Limitation of Liability</h3>
            <p className="text-white/70 leading-relaxed">
              To the fullest extent permitted by law, XCrypt and its owners are not liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, even if advised of the possibility of such damages. Our total liability is limited to the amount paid by you for the Service.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">12. Disclaimer of Warranties</h3>
            <p className="text-white/70 leading-relaxed">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">13. Indemnification</h3>
            <p className="text-white/70 leading-relaxed">
              You agree to indemnify and hold harmless XCrypt, its owners, operators, and employees from any claims, damages, liabilities, and expenses arising from your use of the Service or violation of these Terms of Service.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">14. Governing Law</h3>
            <p className="text-white/70 leading-relaxed">
              These Terms of Service are governed by applicable laws. Any disputes shall be resolved in competent courts, and you agree to submit to their jurisdiction.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">15. Contact &amp; Support</h3>
            <p className="text-white/70 leading-relaxed">
              For questions about these Terms of Service, please contact us through our website.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
