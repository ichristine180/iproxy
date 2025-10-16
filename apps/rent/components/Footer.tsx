import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4 gradient-text">
             iProxy
            </h3>
            <p className="text-sm text-muted-foreground">
              Manage Your Proxies with Ease
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="#pricing"
                  className="hover:text-primary transition-colors"
                >
                  Pricing
                </a>
              </li>
              <li>
                <Link
                  href="/docs"
                  className="hover:text-primary transition-colors"
                >
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/terms"
                  className="hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/refund"
                  className="hover:text-primary transition-colors"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#contact" className="hover:text-primary transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#support" className="hover:text-primary transition-colors">
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4 md:mb-0">
            © 2025 iproxy. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a
              href="#"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
