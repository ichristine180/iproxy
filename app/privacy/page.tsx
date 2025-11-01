"use client"

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Header */}
          <div className="mb-12 [animation:var(--animate-fade-in)]">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">Last updated: January 1, 2024</p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground mb-4">
                iProxy ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our proxy rental and management services.
              </p>
              <p className="text-muted-foreground">
                Please read this Privacy Policy carefully. By using our services, you agree to the collection and use of information in accordance with this policy.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-semibold mb-3 mt-6">2.1 Personal Information</h3>
              <p className="text-muted-foreground mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Name and email address</li>
                <li>Billing information and payment details</li>
                <li>Account credentials (username and password)</li>
                <li>Company information (for business accounts)</li>
                <li>Communication preferences</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Usage Information</h3>
              <p className="text-muted-foreground mb-4">
                We automatically collect certain information about your use of our services:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>IP addresses and proxy usage logs</li>
                <li>Bandwidth consumption and connection metrics</li>
                <li>API requests and responses</li>
                <li>Device information and browser type</li>
                <li>Access times and dates</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Cookies and Tracking</h3>
              <p className="text-muted-foreground">
                We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">
                We use the collected information for various purposes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>To provide and maintain our service</li>
                <li>To process your transactions and manage your account</li>
                <li>To send you technical notices and support messages</li>
                <li>To respond to your comments and questions</li>
                <li>To monitor and analyze usage patterns and trends</li>
                <li>To detect, prevent, and address technical issues and fraud</li>
                <li>To improve our services and develop new features</li>
                <li>To comply with legal obligations</li>
              </ul>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">4. How We Share Your Information</h2>
              <p className="text-muted-foreground mb-4">
                We may share your information in the following situations:
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">4.1 Service Providers</h3>
              <p className="text-muted-foreground mb-4">
                We may share your information with third-party service providers who perform services on our behalf, such as payment processing, data analysis, and customer service.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Legal Requirements</h3>
              <p className="text-muted-foreground mb-4">
                We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">4.3 Business Transfers</h3>
              <p className="text-muted-foreground">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred. We will provide notice before your information is transferred and becomes subject to a different privacy policy.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
              <p className="text-muted-foreground mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and audits</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Employee training on data protection</li>
                <li>Incident response procedures</li>
              </ul>
              <p className="text-muted-foreground">
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">6. Data Retention</h2>
              <p className="text-muted-foreground mb-4">
                We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
              </p>
              <p className="text-muted-foreground">
                Usage logs and connection data are typically retained for 90 days, while account information is retained until you request deletion or your account is terminated.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">7. Your Privacy Rights</h2>
              <p className="text-muted-foreground mb-4">
                Depending on your location, you may have certain rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li><strong>Access:</strong> Request access to your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request transfer of your information</li>
                <li><strong>Objection:</strong> Object to processing of your information</li>
                <li><strong>Restriction:</strong> Request restriction of processing</li>
              </ul>
              <p className="text-muted-foreground">
                To exercise these rights, please contact us at privacy@iproxy.com. We will respond to your request within 30 days.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">8. International Data Transfers</h2>
              <p className="text-muted-foreground mb-4">
                Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ.
              </p>
              <p className="text-muted-foreground">
                We take appropriate safeguards to ensure that your personal information remains protected in accordance with this Privacy Policy, including the use of Standard Contractual Clauses approved by the European Commission.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">9. Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">10. Third-Party Links</h2>
              <p className="text-muted-foreground">
                Our service may contain links to third-party websites. We are not responsible for the privacy practices of these websites. We encourage you to read the privacy policies of every website you visit.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground mb-4">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
              <p className="text-muted-foreground">
                You are advised to review this Privacy Policy periodically for any changes. Changes are effective when posted on this page.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">12. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <p className="text-muted-foreground">
                Email: privacy@iproxy.com<br />
                Address: [Your Company Address]<br />
                Data Protection Officer: dpo@iproxy.com
              </p>
            </Card>
          </div>

          {/* Related Links */}
          <div className="mt-12 p-6 bg-card/30 border border-border rounded-lg">
            <h3 className="font-semibold mb-4">Related Documents</h3>
            <div className="flex flex-wrap gap-4">
              <Link href="/terms" className="text-accent hover:underline">
                Terms of Service
              </Link>
              <Link href="/refund" className="text-accent hover:underline">
                Refund Policy
              </Link>
              <Link href="/docs" className="text-accent hover:underline">
                Documentation
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
