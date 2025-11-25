"use client";

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
          <h1 className="content-heading tp-headline-l" data-v-129383>
            Terms of service
          </h1>
          <div className="mb-12 [animation:var(--animate-fade-in)]">
            <h1 className="tp-headline-m" data-v-129383>
              1. License Agreement
            </h1>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <p className="text-muted-foreground mb-4">
              Highbid's multiple IP address proxy infrastructure solution,
              providing IP addresses for the User to connect to the internet
              and/or access Highbid's data-gathering and proxy management
              solutions (the "System" and "Services"), is owned and operated by
              Highbid LTD, and its affiliated companies ("Highbid", "we", "our",
              or "us"). The System is intended for research, personal, and
              commercial use, strictly for lawful and legitimate purposes, as
              described in this License Agreement (the "Agreement") and all
              applicable laws.
            </p>
            <p className="text-muted-foreground mb-4">
              This Agreement applies to all versions and components of the
              System, including any separate functionality, modules, and
              derivatives. By clicking "Register", creating an account, or by
              accessing or using the System in any manner, you ("User", "you")
              acknowledge that you have read, understood, and agree to be
              legally bound by this Agreement and, where applicable, any
              separate support services agreement referenced on our Website.
            </p>
            <p className="text-muted-foreground mb-4">
              If you do not agree to be bound by this Agreement, you must not
              access or use the System or any part of the Services and must
              immediately discontinue any such use.
            </p>
            <p className="text-muted-foreground mb-4">
              Unless explicitly stated otherwise in writing, any new features,
              modules, or enhancements that augment or improve the current
              System will be subject to this Agreement.
            </p>
            <p className="text-muted-foreground">
              If you use the System on behalf of an organization, you represent
              and warrant that you have the authority to bind that organization
              to this Agreement. In that case, "you" and "User" refer to both
              the organization and any individual using the System on its
              behalf.
            </p>

            <h1 className="tp-headline-m" data-v-129383>
              2. Payment Terms
            </h1>

            <h3 className="tp-headline-s mb-3 mt-4">
              2.1. Supported payment methods
            </h3>
            <p className="text-muted-foreground mb-4">
              The following payment methods are supported, as listed and updated
              on our Website from time to time:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>Manual payment via credit, debit, or prepaid card;</li>
              <li>
                Third-party payment providers, as listed on our Website or
                within the dashboard.
              </li>
            </ul>

            <h3 className="tp-headline-s mb-3">2.2. Plans and billing model</h3>
            <p className="text-muted-foreground mb-4">
              Highbid currently offers a time-based access model (the "Plan"),
              under which you prepay for access to the Services for a defined
              period (for example, 1 day, 7 days, or 30 days) as described on
              the product page in the dashboard.
            </p>
            <p className="text-muted-foreground mb-2">Key terms:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>
                You gain access to the Services within one (1) business day
                after successful payment of the applicable fee set by Highbid.
              </li>
              <li>
                The price for 4G and 5G mobile proxy Services is charged per
                selected access period (e.g., 1 day, 7 days, or 30 days), as
                specified at the time of purchase.
              </li>
              <li>
                You may purchase additional Services or extend your access
                period at any time, subject to availability and the pricing in
                effect at the time of purchase.
              </li>
            </ul>

            <h3 className="tp-headline-s mb-3">
              2.3. Pricing, discounts, and changes
            </h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>
                All prices, fees, and applicable discounts are determined by
                Highbid and are displayed in the dashboard at the time of
                purchase.
              </li>
              <li>
                Discounts apply on a per-purchase basis only, unless explicitly
                stated otherwise. Information on any active discounts is
                available in your dashboard.
              </li>
              <li>
                Highbid reserves the right to modify pricing, fee structures,
                and discount terms at any time. Any such changes will not affect
                orders that have already been completed and paid.
              </li>
            </ul>

            <h3 className="tp-headline-s mb-3">2.4. Invoices and tax</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>
                An invoice for any purchased Services will be available from the
                relevant product page in the dashboard once payment is
                successfully completed.
              </li>
              <li>
                All prices are exclusive of any applicable taxes, levies, or
                duties (including but not limited to VAT, withholding taxes,
                customs duties, or similar). You are solely responsible for
                paying all such taxes, levies, and duties that may be imposed in
                connection with your use or purchase of the Services, except for
                taxes based on Highbid's net income.
              </li>
            </ul>

            <h3 className="tp-headline-s mb-3">2.5. Refunds</h3>
            <p className="text-muted-foreground">
              Unless expressly stated otherwise in this Agreement or required by
              applicable mandatory law, all purchases are final and
              non-refundable. You acknowledge and agree that you are responsible
              for reviewing the Plan description, term, and pricing before
              making a purchase.
            </p>

            <h1 className="tp-headline-m" data-v-129383>
              3. Limited License Grant
            </h1>
            <p className="text-muted-foreground mb-4">
              Subject to your full and ongoing compliance with this Agreement
              and any applicable policies referenced herein, Highbid grants you
              a non-exclusive, non-transferable, revocable, limited license to
              access and use the System and Services for legitimate personal,
              research, and commercial purposes.
            </p>
            <p className="text-muted-foreground mb-2">You agree to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>
                Use the System only in accordance with this Agreement, any
                applicable documentation, and all laws and regulations that
                apply to your use of the Services and the data you access,
                collect, or process;
              </li>
              <li>
                Ensure that all data you collect, process, or route via the
                System is obtained and used lawfully and that you have all
                necessary rights, consents, and authorizations.
              </li>
            </ul>
            <p className="text-muted-foreground mb-2">
              Highbid may, in its sole discretion, at any time and without
              liability to you:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>
                Modify, suspend, or discontinue the System or any part of the
                Services;
              </li>
              <li>
                Impose technical or usage limits on specific products, features,
                or accounts;
              </li>
              <li>
                Terminate or suspend your access to the System or any part of
                the Services, including where your use, or any use under your
                account, negatively impacts or may negatively impact the
                System's performance, stability, security, or availability, or
                where Highbid reasonably suspects abuse, breach of this
                Agreement, or unlawful activity.
              </li>
            </ul>
            <p className="text-muted-foreground mb-4">
              In such cases, unless otherwise required by applicable law,
              Highbid will not be obligated to provide any refund, credit, or
              other compensation in respect of any fees already paid.
            </p>
            <p className="text-muted-foreground mb-2">
              Your use of the Services is at your own risk and expense. You are
              solely responsible for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>
                Meeting the technical and functional requirements necessary to
                access and use the Services;
              </li>
              <li>
                Maintaining suitable electronic communications and internet
                connections;
              </li>
              <li>
                Any loss, theft, corruption, or damage of your data, except
                where such loss directly results from Highbid's wilful
                misconduct or gross negligence, if and to the extent such
                limitation is permitted by applicable law.
              </li>
            </ul>

            <h3 className="tp-headline-s mb-3">
              3.1. System protection and fair use
            </h3>
            <p className="text-muted-foreground mb-2">
              Highbid reserves the right to take any reasonable technical or
              organizational measures necessary to protect the System and its
              infrastructure, including, without limitation, implementing rate
              limits, caps on concurrent sessions, or other restrictions, and to
              terminate or throttle specific connections, User orders, or
              Services if your activities cause or risk causing:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>Overloading or degradation of the System;</li>
              <li>
                Service outages, downtime, or significant decline in
                performance;
              </li>
              <li>
                Security incidents or abuse of network or infrastructure
                resources.
              </li>
            </ul>

            <h3 className="tp-headline-s mb-3">
              3.2. "Unlimited" data usage
            </h3>
            <p className="text-muted-foreground mb-2">
              Where your Plan includes "unlimited" data usage, such usage is
              subject to a bona fide, fair, and lawful use requirement:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>
                "Unlimited" is intended to support normal, reasonable use of
                mobile proxy services and does not permit abusive, excessive, or
                automated usage that is inconsistent with typical usage patterns
                or that circumvents technical or commercial limitations.
              </li>
              <li>
                Any usage that Highbid, acting reasonably and in good faith,
                deems to be excessive, abusive, or intended to bypass legal,
                ethical, or fair use standards may result in immediate
                restriction, suspension, or termination of your access to the
                Services, without obligation to provide a refund.
              </li>
            </ul>

            <h3 className="tp-headline-s mb-3">
              3.3. Re-assignment of mobile proxies
            </h3>
            <p className="text-muted-foreground mb-2">
              When you rent mobile proxies, Highbid may, from time to time,
              temporarily or permanently re-assign IP addresses, devices, or
              underlying network resources, including in connection with:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>Natural disasters or force majeure events;</li>
              <li>Hardware failure or maintenance;</li>
              <li>Network or infrastructure changes;</li>
              <li>Optimization of capacity, redundancy, and performance.</li>
            </ul>
            <p className="text-muted-foreground">
              Highbid will use commercially reasonable efforts to maintain a
              high level of availability and minimize disruptions to your
              Services. However, you acknowledge and agree that such
              re-assignments and changes may occur and are inherent to the
              operation of the Services.
            </p>

            <h1 className="tp-headline-m" data-v-129383>
              4. Prohibited Activities
            </h1>
            <p className="text-muted-foreground mb-4">
              You agree not to use, and not to allow, enable, or assist any
              third party to use, the System or Services for any of the
              following ("Prohibited Activities"):
            </p>

            <h3 className="tp-headline-s mb-3">
              4.1. Malicious code and attacks
            </h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>
                Creating, distributing, or transmitting viruses, worms, trojan
                horses, malware, spyware, adware, or any other malicious code or
                software;
              </li>
              <li>
                Deploying any computer code, file, or program designed to
                interrupt, hijack, damage, limit, or negatively affect the
                functionality or security of any computer software, hardware,
                network, or telecommunications equipment;
              </li>
              <li>
                Conducting or facilitating any denial-of-service (DoS) or
                distributed denial-of-service (DDoS) attack or any activity
                aimed at making a network, system, or resource unavailable to
                its intended users.
              </li>
            </ul>

            <h3 className="tp-headline-s mb-3">
              4.2. Unlawful, harmful, or abusive content and activity
            </h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>
                Distributing, promoting, or facilitating any unlawful, harmful,
                fraudulent, deceptive, defamatory, infringing, harassing, or
                otherwise prohibited content or activity;
              </li>
              <li>
                Using the Services for phishing, identity theft, payment fraud,
                carding, account takeover, credential stuffing, brute-force
                attacks, or any other fraudulent or abusive behaviour;
              </li>
              <li>
                Causing damage or service disruption to any third-party systems,
                servers, websites, or services.
              </li>
            </ul>

            <h3 className="tp-headline-s mb-3">
              4.3. Violation of third-party rights or policies
            </h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>
                Accessing, collecting, or scraping data from third-party
                websites, applications, or services in a manner that violates
                their terms of service, privacy policies, robots.txt settings,
                copyright, or other legal rights;
              </li>
              <li>
                Infringing any intellectual property rights, privacy rights, or
                other rights of third parties, including by using the Services
                to distribute content that you do not have the right to use.
              </li>
            </ul>

            <h3 className="tp-headline-s mb-3">
              4.4. Circumventing law or regulation
            </h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>
                Using the Services to bypass, circumvent, or attempt to
                circumvent any law, regulation, sanction, or export control,
                including by masking or manipulating your true location or
                identity for illegal purposes;
              </li>
              <li>
                Using the Services in violation of any applicable sanctions, AML
                (anti-money laundering), CTF (counter-terrorist financing), or
                KYC requirements.
              </li>
            </ul>

            <h3 className="tp-headline-s mb-3">
              4.5. Competition and benchmarking
            </h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>
                Using the Services to build, enhance, operate, or support a
                product or service that competes with the Services;
              </li>
              <li>
                Reverse engineering, decompiling, or otherwise attempting to
                derive the source code, underlying ideas, algorithms, or
                non-public APIs of the System, except to the limited extent
                permitted by applicable mandatory law.
              </li>
            </ul>
            <p className="text-muted-foreground">
              Highbid reserves the right, in its sole discretion and without
              liability, to investigate any suspected breach of this Section, to
              suspend or terminate any User account or access to the Services,
              and to cooperate with law enforcement authorities and third
              parties in investigating and addressing any alleged Prohibited
              Activities.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
