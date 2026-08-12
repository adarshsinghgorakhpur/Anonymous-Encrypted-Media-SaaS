'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080B14] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-white/[0.02] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-space font-bold">Privacy Policy</h1>
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
            <h2 className="text-2xl font-bold mb-4 text-white">Privacy Policy</h2>
            <p className="text-white/60">
              Last updated: May 2026
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">1. Overview</h3>
            <p className="text-white/70 leading-relaxed">
              XCrypt (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our website, application, and services (collectively, the &quot;Service&quot;).
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">2. Information We Collect</h3>
            <div className="space-y-3 text-white/70">
              <div>
                <h4 className="font-semibold text-white mb-2">Anonymous Uploads</h4>
                <p>Users can upload media without creating an account. We collect minimal information: only the file data, access codes, and metadata necessary to provide the service.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Account Information</h4>
                <p>If you create an account, we collect your email address and password. We do not collect or require personal information such as your name, address, or phone number.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Technical Information</h4>
                <p>We automatically collect certain information about your device and usage patterns, including IP address (hashed), user agent, browser type, and pages accessed. This information is used for security, fraud prevention, and service improvement only.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Cookies</h4>
                <p>We use essential cookies to maintain your session and provide core functionality. We do not use tracking cookies, third-party cookies, or behavioral analytics cookies.</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">3. How We Use Your Information</h3>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li>To provide, maintain, and improve our Service</li>
              <li>To authenticate users and prevent unauthorized access</li>
              <li>To encrypt and securely store your files</li>
              <li>To track storage usage for your account</li>
              <li>To process subscription and billing information</li>
              <li>To respond to your inquiries and provide customer support</li>
              <li>To prevent fraud, abuse, and security threats</li>
              <li>To comply with legal obligations and law enforcement requests</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">4. Encryption &amp; Data Security</h3>
            <p className="text-white/70 leading-relaxed">
              All uploaded files are encrypted using AES-256 encryption. Files under 500MB are encrypted on your device before transmission. We cannot decrypt files without your password. Metadata such as original filename, file type, and encryption parameters are stored separately and used to facilitate retrieval and display of your files.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">5. Data Retention &amp; Deletion</h3>
            <div className="space-y-3 text-white/70">
              <p>
                Files are retained based on your settings:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Anonymous uploads expire after 7 days by default</li>
                <li>User account uploads are retained indefinitely unless deleted</li>
                <li>Files with expiration dates are automatically destroyed</li>
                <li>Files set to &quot;burn after views&quot; are destroyed after reaching view limit</li>
              </ul>
              <p>
                You can manually delete files at any time. Deleted files cannot be recovered.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">6. Sharing &amp; Access</h3>
            <p className="text-white/70 leading-relaxed">
              Files are shared via unique access codes. Only those with the access code can view your files. You control who receives your access codes. We do not share access codes with third parties and do not publish shared files on social media or search engines.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">7. Third-Party Integrations</h3>
            <p className="text-white/70 leading-relaxed">
              We may use third-party services for authentication (Google OAuth), payment processing, and analytics. These services are subject to their own privacy policies. We do not share your file data with third parties except as necessary to provide the Service.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">8. User Responsibility</h3>
            <p className="text-white/70 leading-relaxed mb-3">
              IMPORTANT: You are entirely responsible for the content you upload and share. XCrypt is provided &quot;as is&quot; without liability for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li>Unauthorized sharing of your files by others</li>
              <li>Misuse of shared access codes</li>
              <li>Illegal content uploaded by users</li>
              <li>Copyright violations or intellectual property infringement</li>
              <li>Loss of files due to user action or system failure</li>
              <li>Unauthorized access resulting from weak passwords or compromised accounts</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">9. Platform Liability Disclaimer</h3>
            <p className="text-white/70 leading-relaxed">
              Platform owners and administrators are NOT responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li>Content uploaded by users</li>
              <li>Misuse of the Service by any party</li>
              <li>Illegal activities or violations of law</li>
              <li>Unauthorized sharing or distribution of files</li>
              <li>Damages resulting from use of the Service</li>
              <li>Interception or loss of data in transmission</li>
            </ul>
            <p className="text-white/70 leading-relaxed mt-3">
              Use of XCrypt constitutes acceptance of these terms and full responsibility for your uploaded content.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">10. Children&apos;s Privacy</h3>
            <p className="text-white/70 leading-relaxed">
              Our Service is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you are under 13, please do not use our Service.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">11. Changes to This Policy</h3>
            <p className="text-white/70 leading-relaxed">
              We reserve the right to modify this Privacy Policy at any time. Changes will be effective immediately upon posting. Your continued use of the Service constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">12. Contact Us</h3>
            <p className="text-white/70 leading-relaxed">
              If you have questions about this Privacy Policy or our privacy practices, please contact us through our website.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
