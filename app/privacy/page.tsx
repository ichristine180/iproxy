"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Header */}
          <h1 className="content-heading tp-headline-l" data-v-129383>
            Privacy and Confidentiality Policy
          </h1>

          {/* Content */}
          <div className="space-y-8">
            <div className="mb-12 [animation:var(--animate-fade-in)]">
              <h1 className="tp-headline-m" data-v-129383>
                1. Definitions
              </h1>
            </div>

            <h3 className="tp-headline-s mb-3 mt-4">1.1. Highbid</h3>
            <p className="text-muted-foreground mb-4">
              "Highbid", "we", "our", or "us" means Highbid LTD, and its
              affiliated companies, which own and operate the System and
              Services as defined in the Terms of Service.
            </p>

            <h3 className="tp-headline-s mb-3">1.2. User</h3>
            <p className="text-muted-foreground mb-4">
              "User", "you" or "Client" means any individual or legal entity
              that accesses or uses the System and Services in accordance with
              the Highbid Terms of Service and is duly authorised to do so.
            </p>

            <h3 className="tp-headline-s mb-3">1.3. System and Services</h3>
            <p className="text-muted-foreground mb-4">
              "System" and "Services" have the meanings given to them in the
              Highbid Terms of Service and include, without limitation,
              Highbid's multiple IP address proxy infrastructure, data-gathering,
              and proxy management solutions.
            </p>

            <h3 className="tp-headline-s mb-3">1.4. Personal Data</h3>
            <p className="text-muted-foreground mb-4">
              "Personal Data" means any information relating to an identified or
              identifiable natural person, as defined by applicable data
              protection laws.
            </p>

            <h3 className="tp-headline-s mb-3">1.5. Processing</h3>
            <p className="text-muted-foreground mb-4">
              "Processing" means any operation or set of operations performed on
              Personal Data, whether or not by automated means, such as
              collection, recording, organisation, storage, adaptation,
              retrieval, use, disclosure, or deletion.
            </p>

            <h3 className="tp-headline-s mb-3">1.6. Confidential Information</h3>
            <p className="text-muted-foreground mb-4">
              "Confidential Information" means all non-public, confidential, or
              proprietary information (in any form or medium) disclosed by one
              party (the "Disclosing Party") to the other party (the "Receiving
              Party") or its Representatives in connection with the use of the
              System and Services, including, without limitation:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>
                business, technical, operational, financial, and product
                information;
              </li>
              <li>
                client lists, usage patterns, configurations, and network data;
              </li>
              <li>
                any information that is identified as confidential or that,
                given its nature or the circumstances of disclosure, should
                reasonably be understood to be confidential.
              </li>
            </ul>

            <h3 className="tp-headline-s mb-3">1.7. Representatives and Affiliates</h3>
            <p className="text-muted-foreground">
              "Representatives" means a party's employees, officers, directors,
              professional advisors, and contractors who need access to
              Confidential Information for the Permitted Purpose. "Affiliates"
              means any entity that directly or indirectly controls, is
              controlled by, or is under common control with a party.
            </p>

            <h1 className="tp-headline-m" data-v-129383>
              2. Confidential Information
            </h1>

            <h3 className="tp-headline-s mb-3 mt-4">
              2.1. Exclusions from Confidential Information
            </h3>
            <p className="text-muted-foreground mb-4">
              Confidential Information does not include information that:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>
                a) is or becomes publicly available through no breach of this
                Policy or any confidentiality obligation by the Receiving Party
                or its Representatives;
              </li>
              <li>
                b) was lawfully known to the Receiving Party on a
                non-confidential basis before disclosure by the Disclosing
                Party;
              </li>
              <li>
                c) is or becomes available to the Receiving Party on a
                non-confidential basis from a third party who, to the Receiving
                Party's knowledge, is not bound by a confidentiality obligation
                to the Disclosing Party or otherwise prohibited from disclosing
                the information;
              </li>
              <li>
                d) is independently developed by the Receiving Party without use
                of or reference to the Disclosing Party's Confidential
                Information; or
              </li>
              <li>
                e) the parties explicitly agree in writing is not confidential
                or may be publicly disclosed.
              </li>
            </ul>

            <h3 className="tp-headline-s mb-3">2.2. Use and Non-Disclosure</h3>
            <p className="text-muted-foreground mb-4">Each party shall:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>
                a) keep the other party's Confidential Information strictly
                confidential;
              </li>
              <li>
                b) use such Confidential Information solely for the purpose of
                performing or receiving the Services, exercising rights, or
                complying with obligations under the Terms of Service or other
                written agreements between the parties (the "Permitted
                Purpose"); and
              </li>
              <li>
                c) not disclose any Confidential Information, in whole or in
                part, to any third party, except as permitted in this Policy or
                with the prior written consent of the Disclosing Party.
              </li>
            </ul>

            <h3 className="tp-headline-s mb-3">
              2.3. Disclosure to Representatives and Affiliates
            </h3>
            <p className="text-muted-foreground mb-4">
              A party may disclose the other party's Confidential Information to
              its Representatives and Affiliates who have a strict need to know
              such information for the Permitted Purpose, provided that:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>
                a) such persons are informed of the confidential nature of the
                Confidential Information prior to disclosure; and
              </li>
              <li>
                b) the disclosing party remains fully responsible and liable for
                any breach of this Policy by its Representatives and Affiliates
                as if such breach had been committed by the disclosing party
                itself.
              </li>
            </ul>

            <h3 className="tp-headline-s mb-3">2.4. Disclosure Required by Law</h3>
            <p className="text-muted-foreground mb-4">
              A party may disclose Confidential Information to the extent
              required by applicable law, regulation, or by a court,
              supervisory, or regulatory authority of competent jurisdiction,
              provided that, where legally permitted and reasonably practicable,
              the Receiving Party:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>
                a) gives prompt written notice to the Disclosing Party of the
                required disclosure; and
              </li>
              <li>
                b) reasonably cooperates with the Disclosing Party, at the
                Disclosing Party's cost, in seeking protective measures or
                limiting the scope of such disclosure.
              </li>
            </ul>

            <h3 className="tp-headline-s mb-3">2.5. No Implied Rights</h3>
            <p className="text-muted-foreground mb-4">
              Each party retains all rights, title, and interest in and to its
              own Confidential Information. No rights or licences (including
              intellectual property rights) are granted by either party to the
              other in relation to its Confidential Information except as
              expressly set out in this Policy or in the Terms of Service.
            </p>

            <h3 className="tp-headline-s mb-3">2.6. Survival</h3>
            <p className="text-muted-foreground">
              The confidentiality obligations in this Policy survive termination
              or expiry of the contractual relationship between the parties and
              shall remain in effect for as long as the relevant Confidential
              Information remains confidential.
            </p>

            <h1 className="tp-headline-m" data-v-129383>
              3. Personal Data and Privacy
            </h1>

            <h3 className="tp-headline-s mb-3 mt-4">3.1. Scope</h3>
            <p className="text-muted-foreground mb-4">
              This section describes how Highbid processes Personal Data in
              connection with the System and Services, including data relating
              to Users and, where applicable, their end-users.
            </p>

            <h3 className="tp-headline-s mb-3">3.2. Categories of Personal Data</h3>
            <p className="text-muted-foreground mb-4">
              Depending on how you use the Services, Highbid may process the
              following categories of Personal Data:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>
                <strong>Account and identification data:</strong> name, company
                name, contact details (e-mail address, phone number), login
                credentials, role, and billing contact information;
              </li>
              <li>
                <strong>Billing and transaction data:</strong> payment method
                identifiers (e.g., masked card data), invoicing details,
                transaction history;
              </li>
              <li>
                <strong>Technical and usage data:</strong> IP addresses, device
                identifiers, proxy configuration, connection timestamps, logs of
                requests and responses via the System (to the extent required
                for security, abuse prevention, billing, and service
                optimisation);
              </li>
              <li>
                <strong>Communication data:</strong> content of support
                requests, feedback, and any other communications with Highbid.
              </li>
            </ul>

            <h3 className="tp-headline-s mb-3">3.3. Purposes of Processing</h3>
            <p className="text-muted-foreground mb-4">
              Highbid processes Personal Data for the following purposes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>
                To create, manage, and secure User accounts and access to the
                Services;
              </li>
              <li>
                To provide, operate, maintain, and improve the System and
                Services, including troubleshooting, monitoring, capacity
                planning, and performance optimisation;
              </li>
              <li>
                To prevent, detect, investigate, and mitigate security
                incidents, abuse, fraud, or Prohibited Activities, as defined in
                the Terms of Service;
              </li>
              <li>
                To process payments, issue invoices, and manage billing and
                collections;
              </li>
              <li>
                To communicate with Users regarding the Services, including
                service updates, alerts, and support;
              </li>
              <li>
                To comply with legal obligations and to respond to lawful
                requests from public authorities;
              </li>
              <li>
                To produce aggregated or anonymised statistics and analytics
                that do not identify individual Users.
              </li>
            </ul>

            <h3 className="tp-headline-s mb-3">3.4. Legal Bases</h3>
            <p className="text-muted-foreground mb-4">
              Highbid processes Personal Data based on one or more of the
              following legal bases, as applicable:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>
                performance of a contract or taking steps prior to entering into
                a contract with you (e.g., provision of the Services, billing);
              </li>
              <li>
                compliance with legal obligations (e.g., accounting, tax, AML
                requirements, regulatory requests);
              </li>
              <li>
                Highbid's legitimate interests (e.g., securing the System,
                preventing abuse, improving the Services), provided that such
                interests are not overridden by your rights and freedoms;
              </li>
              <li>
                your consent, where required by applicable law (e.g., certain
                cookies, marketing communications).
              </li>
            </ul>

            <h3 className="tp-headline-s mb-3">3.5. Third-Party Service Providers</h3>
            <p className="text-muted-foreground mb-4">
              Highbid may share Personal Data with trusted third-party service
              providers who process data on Highbid's behalf and in accordance
              with Highbid's instructions, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>hosting and infrastructure providers;</li>
              <li>payment processors and financial institutions;</li>
              <li>analytics, logging, and monitoring providers;</li>
              <li>professional advisors (legal, tax, audit).</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              These service providers are bound by contractual obligations to
              protect Personal Data and to use it only for the purposes for
              which it was disclosed.
            </p>

            <h3 className="tp-headline-s mb-3">3.6. Data Retention</h3>
            <p className="text-muted-foreground">
              Highbid retains Personal Data only for as long as necessary to
              fulfil the purposes for which it was collected, including to
              comply with legal, accounting, or reporting requirements, and to
              resolve disputes or enforce agreements. The specific retention
              periods may vary depending on the category of data and applicable
              law.
            </p>

            <h1 className="tp-headline-m" data-v-129383>
              4. Cookies and Similar Technologies
            </h1>

            <h3 className="tp-headline-s mb-3 mt-4">4.1. Use of Cookies</h3>
            <p className="text-muted-foreground mb-4">
              Highbid may use cookies and similar technologies (such as local
              storage, pixels, and scripts) on its websites and within the
              dashboard to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>
                enable and secure core functionality of the Services (e.g.,
                authentication, session management);
              </li>
              <li>remember your preferences and settings;</li>
              <li>
                collect technical and usage information for service performance,
                diagnostics, and optimisation;
              </li>
              <li>
                conduct analytics and produce statistics on how the Services are
                used;
              </li>
              <li>
                support marketing and advertising activities where permitted by
                law and, where required, with your consent.
              </li>
            </ul>

            <h3 className="tp-headline-s mb-3">4.2. Types of Cookies</h3>
            <p className="text-muted-foreground mb-4">
              The cookies used by Highbid may include:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>
                <strong>Strictly necessary cookies:</strong> required for the
                operation and security of the website and dashboard and cannot
                be disabled in our systems;
              </li>
              <li>
                <strong>Functional cookies:</strong> used to remember your
                preferences and improve your experience;
              </li>
              <li>
                <strong>Analytics cookies:</strong> used to understand how Users
                interact with the Services and to help us improve them;
              </li>
              <li>
                <strong>Advertising/marketing cookies:</strong> used, where
                applicable, to deliver relevant content and campaigns.
              </li>
            </ul>

            <h3 className="tp-headline-s mb-3">4.3. Control of Cookies</h3>
            <p className="text-muted-foreground mb-4">
              Where required by law, Highbid will request your consent before
              placing non-essential cookies (such as analytics or advertising
              cookies). You may manage or withdraw your consent through the
              cookie banner or settings provided on our website, and you can
              also control cookies through your browser settings. Disabling
              certain cookies may affect the functionality or performance of the
              Services.
            </p>

            <h3 className="tp-headline-s mb-3">4.4. Third-Party Cookies</h3>
            <p className="text-muted-foreground">
              Some cookies or similar technologies may be placed by third-party
              service providers (for example, analytics or advertising partners)
              acting on Highbid's behalf. These third parties may process
              limited Personal Data in connection with their services, in
              accordance with their own privacy terms and applicable data
              protection laws.
            </p>

            <h1 className="tp-headline-m" data-v-129383>
              5. Data Security
            </h1>
            <p className="text-muted-foreground">
              Highbid implements appropriate technical and organisational
              measures designed to protect Personal Data and Confidential
              Information against accidental or unlawful destruction, loss,
              alteration, unauthorised disclosure, or access. While no system
              can be guaranteed to be 100% secure, Highbid uses industry-standard
              safeguards and regularly reviews its security controls in light of
              technological developments and risk assessments.
            </p>

            <h1 className="tp-headline-m" data-v-129383>
              6. International Data Transfers
            </h1>
            <p className="text-muted-foreground">
              Where Personal Data is transferred across borders, Highbid will
              ensure that such transfers comply with applicable data protection
              laws and that an adequate level of protection is provided, for
              example by using standard contractual clauses or other lawful
              transfer mechanisms.
            </p>

            <h1 className="tp-headline-m" data-v-129383>
              7. Changes to This Policy
            </h1>
            <p className="text-muted-foreground">
              Highbid may update this Privacy and Confidentiality Policy from
              time to time. Any material changes will be communicated through
              the website or dashboard, or by other appropriate means. Your
              continued use of the Services after such changes become effective
              constitutes your acceptance of the revised Policy.
            </p>
          </div>

         
        </div>
      </main>

      <Footer />
    </div>
  );
}
