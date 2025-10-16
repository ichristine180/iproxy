"use client"

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Header */}
          <div className="mb-12 [animation:var(--animate-fade-in)]">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              Refund Policy
            </h1>
            <p className="text-muted-foreground">Last updated: January 1, 2024</p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">1. Money-Back Guarantee</h2>
              <p className="text-muted-foreground mb-4">
                At iProxy, we stand behind the quality of our services. We offer a 7-day money-back guarantee for all new customers on monthly plans. If you are not satisfied with our service for any reason within the first 7 days of your initial purchase, you can request a full refund.
              </p>
              <p className="text-muted-foreground">
                This guarantee applies only to your first purchase and does not apply to renewals or subsequent purchases.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">2. Eligibility for Refunds</h2>
              <p className="text-muted-foreground mb-4">
                To be eligible for a refund, you must meet the following conditions:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>The refund request must be made within 7 days of your initial purchase</li>
                <li>You must not have violated our Terms of Service or Acceptable Use Policy</li>
                <li>Your account must not have been suspended or terminated for abuse</li>
                <li>You must not have exceeded 50GB of bandwidth usage during the trial period</li>
                <li>The refund request must be submitted through our official support channels</li>
              </ul>
              <p className="text-muted-foreground">
                Refunds are not available for accounts that have been flagged for fraudulent activity, spam, or abuse of our services.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">3. Non-Refundable Items</h2>
              <p className="text-muted-foreground mb-4">
                The following items are non-refundable:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Renewal payments after the initial 7-day period</li>
                <li>Add-on services and bandwidth upgrades</li>
                <li>Custom enterprise solutions (subject to contract terms)</li>
                <li>Setup fees and domain registration fees</li>
                <li>Unused portions of monthly or annual subscriptions after the 7-day period</li>
              </ul>
              <p className="text-muted-foreground">
                Pro-rated refunds are not provided for cancelled subscriptions. If you cancel your subscription, you will retain access to the service until the end of your current billing period.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">4. How to Request a Refund</h2>
              <p className="text-muted-foreground mb-4">
                To request a refund, please follow these steps:
              </p>
              <ol className="list-decimal list-inside text-muted-foreground space-y-3 mb-4">
                <li>
                  <strong>Contact Support:</strong> Email our support team at refunds@iproxy.com with your account details and reason for refund
                </li>
                <li>
                  <strong>Provide Information:</strong> Include your account email, order number, and a brief explanation
                </li>
                <li>
                  <strong>Wait for Review:</strong> Our team will review your request within 2-3 business days
                </li>
                <li>
                  <strong>Receive Confirmation:</strong> You will receive an email confirming whether your refund has been approved
                </li>
              </ol>
              <p className="text-muted-foreground">
                Please note that refund requests submitted after the 7-day period will not be approved unless required by applicable law.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">5. Refund Processing Time</h2>
              <p className="text-muted-foreground mb-4">
                Once your refund request is approved:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Credit card refunds are processed within 5-10 business days</li>
                <li>PayPal refunds are processed within 3-5 business days</li>
                <li>Bank transfers may take 7-14 business days depending on your financial institution</li>
              </ul>
              <p className="text-muted-foreground">
                Refunds will be issued to the original payment method used for the purchase. If the original payment method is no longer available, please contact our support team to arrange an alternative refund method.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">6. Service Disruptions and Credits</h2>
              <p className="text-muted-foreground mb-4">
                In the event of significant service disruptions that fall outside our SLA guarantees, we may provide service credits instead of monetary refunds:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Credits are calculated based on the downtime duration and your plan level</li>
                <li>Credits are automatically applied to your account within 7 days of the incident</li>
                <li>Credits can be used toward future service payments</li>
                <li>Credits expire after 12 months if not used</li>
              </ul>
              <p className="text-muted-foreground">
                Service credits do not apply to scheduled maintenance or disruptions caused by third-party services beyond our control.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">7. Chargebacks</h2>
              <p className="text-muted-foreground mb-4">
                We encourage you to contact us directly before initiating a chargeback with your payment provider. Chargebacks can result in:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Immediate suspension of your account and services</li>
                <li>Additional fees to cover chargeback costs</li>
                <li>Permanent ban from using our services</li>
              </ul>
              <p className="text-muted-foreground">
                If you have a legitimate concern, our support team is here to help resolve it without resorting to chargebacks.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">8. Annual Plan Refunds</h2>
              <p className="text-muted-foreground mb-4">
                Annual plans are eligible for the 7-day money-back guarantee with the following conditions:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Full refund is available within the first 7 days of purchase</li>
                <li>After 7 days, no refunds are provided for the remaining subscription period</li>
                <li>If you cancel an annual plan, you retain access until the end of the annual period</li>
                <li>Bandwidth usage limits for refund eligibility still apply</li>
              </ul>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">9. Enterprise Contracts</h2>
              <p className="text-muted-foreground mb-4">
                Enterprise contracts may have different refund terms based on the specific agreement. Please refer to your contract or contact your account manager for details regarding:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Custom refund policies</li>
                <li>Service level agreements</li>
                <li>Termination clauses</li>
                <li>Pro-rated refund eligibility</li>
              </ul>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">10. Changes to This Policy</h2>
              <p className="text-muted-foreground mb-4">
                We reserve the right to modify this Refund Policy at any time. Changes will be effective immediately upon posting to our website.
              </p>
              <p className="text-muted-foreground">
                Your continued use of our services after changes are posted constitutes your acceptance of the modified policy. We encourage you to review this policy periodically.
              </p>
            </Card>

            <Card className="p-8 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">11. Contact Information</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about our Refund Policy or need assistance with a refund request, please contact us:
              </p>
              <p className="text-muted-foreground">
                Email: refunds@iproxy.com<br />
                Support Portal: <a href={`${process.env.NEXT_PUBLIC_APP_BASE_URL}/support`} className="text-accent hover:underline">Dashboard Support</a><br />
                Business Hours: Monday - Friday, 9 AM - 6 PM EST
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
              <Link href="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </Link>
              <Link href="/pricing" className="text-accent hover:underline">
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
