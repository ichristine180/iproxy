"use client";

import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="page-content-gap flex flex-col">
        <Hero />
        <div id="w-full">
          <Pricing />
        </div>
        <div id="features">
          <Features />
        </div>
      </div>
      <Footer />
    </div>
  );
}
