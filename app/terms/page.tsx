"use client"

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Header */}
          <div className="mb-12 [animation:var(--animate-fade-in)]">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">Last updated: January 1, 2024</p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground mb-4">
                By accessing and using iProxy's services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use our services.
              </p>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to our website. Your continued use of the service following the posting of changes constitutes your acceptance of such changes.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground mb-4">
                iProxy provides proxy rental and management services ("Service") that allow users to rent and manage proxy servers for legitimate business purposes. The Service is provided on an "as is" and "as available" basis.
              </p>
              <p className="text-muted-foreground">
                We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">3. Acceptable Use Policy</h2>
              <p className="text-muted-foreground mb-4">
                You agree to use our proxies only for lawful purposes. You are prohibited from using our services to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Engage in any illegal activities or violate any laws</li>
                <li>Distribute malware, viruses, or other harmful code</li>
                <li>Engage in unauthorized access to computer systems or networks</li>
                <li>Send spam or unsolicited communications</li>
                <li>Engage in fraudulent activities or identity theft</li>
                <li>Violate intellectual property rights</li>
                <li>Interfere with or disrupt our services or servers</li>
              </ul>
              <p className="text-muted-foreground">
                Violation of this policy may result in immediate termination of your account without refund.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">4. Account Registration</h2>
              <p className="text-muted-foreground mb-4">
                To use our Service, you must create an account and provide accurate, complete, and current information. You are responsible for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Maintaining the security of your account and password</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
              <p className="text-muted-foreground">
                You may not use another person's account without permission. We reserve the right to refuse service or terminate accounts at our discretion.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">5. Payment Terms</h2>
              <p className="text-muted-foreground mb-4">
                Payment is required before accessing our services. By providing payment information, you represent that you are authorized to use the designated payment method.
              </p>
              <p className="text-muted-foreground mb-4">
                All fees are non-refundable except as required by law or as specified in our Refund Policy. We reserve the right to change our pricing with 30 days notice to existing customers.
              </p>
              <p className="text-muted-foreground">
                If payment fails, we may suspend or terminate your access to the Service.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">6. Service Level Agreement</h2>
              <p className="text-muted-foreground mb-4">
                We strive to maintain high availability of our services:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Starter Plan: 99% uptime SLA</li>
                <li>Professional Plan: 99.9% uptime SLA</li>
                <li>Enterprise Plan: 99.99% uptime SLA</li>
              </ul>
              <p className="text-muted-foreground">
                SLA credits will be provided for verified downtime that exceeds these thresholds, as detailed in your service agreement.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">7. Intellectual Property</h2>
              <p className="text-muted-foreground mb-4">
                The Service and its original content, features, and functionality are owned by iProxy and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p className="text-muted-foreground">
                You may not copy, modify, distribute, sell, or lease any part of our services or software without our written permission.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">8. Limitation of Liability</h2>
              <p className="text-muted-foreground mb-4">
                In no event shall iProxy, its directors, employees, partners, or suppliers be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>
              <p className="text-muted-foreground">
                Our liability is limited to the amount you paid for the Service in the past 12 months.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">9. Termination</h2>
              <p className="text-muted-foreground mb-4">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including breach of these Terms.
              </p>
              <p className="text-muted-foreground">
                Upon termination, your right to use the Service will immediately cease. All provisions of these Terms which by their nature should survive termination shall survive.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">10. Governing Law</h2>
              <p className="text-muted-foreground mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which iProxy operates, without regard to its conflict of law provisions.
              </p>
              <p className="text-muted-foreground">
                Any disputes arising from these Terms will be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">11. Contact Information</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about these Terms, please contact us at:
              </p>
              <p className="text-muted-foreground">
                Email: legal@iproxy.com<br />
                Address: [Your Company Address]
              </p>
            </Card>
          </div>

          {/* Related Links */}
          <div className="mt-12 p-6 bg-card/30 border border-border rounded-lg">
            <h3 className="font-semibold mb-4">Related Documents</h3>
            <div className="flex flex-wrap gap-4">
              <Link href="/privacy" className="text-accent hover:underline">
                Privacy Policy
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
