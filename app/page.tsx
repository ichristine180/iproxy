"use client";

import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen ">
      <Header />

      {/* Main content area with responsive section spacing */}
      <main className="page-content-gap flex flex-col">
        <Hero />
        <Pricing />
        <Features />
      </main>

      <Footer />
    </div>
  );
}
