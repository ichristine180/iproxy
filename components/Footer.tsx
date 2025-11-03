import Link from "next/link";

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-solid border-neutral-700">
      <div className="content-sizer flex flex-col gap-16 pb-32 pt-32 text-neutral-500 max-sm:pb-0 md:pt-40 lg:pt-[80px]">
        <div className="grid md:grid-cols-3 gap-8 mb-8 text-center">
          <div>
            <a href="/" className="tp-title mb-[19px] min-h-[24px] uppercase text-neutral-500">
              Highbid Proxies
            </a>
            <p className="text-neutral-0 hover:text-brand-300 transition-all cursor-pointer">
             Consistent Performence. Releable uptime.
            </p>
          </div>

          <div>
            <h4 className="ftp-title mb-[19px] min-h-[24px] uppercase text-neutral-500">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/terms"
                  className="text-neutral-0 hover:text-brand-300 transition-all cursor-pointer"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-neutral-0 hover:text-brand-300 transition-all cursor-pointer"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/refund"
                  className="text-neutral-0 hover:text-brand-300 transition-all cursor-pointer"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <p className="text-neutral-0 hover:text-brand-300 transition-all cursor-pointer">
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

        <div className="flex items-center justify-between border-y border-solid border-neutral-600 py-16">
          <p className="text-sm text-muted-foreground">
            © 2025 Highbid proxy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
