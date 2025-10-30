import Link from "next/link";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8 text-center">
          <div>
            <a href="/" className="font-bold text-lg mb-4 gradient-text block">
              Highbid Proxies
            </a>
            <p className="text-sm text-muted-foreground">
              Manage Your Proxies with Ease
            </p>
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
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <p className="text-sm text-muted-foreground">
              If you have any issues, questions, or special requests, please don't hesitate to contact us:{" "}
              <a
                href="https://t.me/HighbidProxyUS"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline transition-colors"
              >
                Telegram - @HighbidProxyUS
              </a>
            </p>
          </div>
        </div>

        <div className="flex justify-center items-center pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            © 2025 iproxy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
