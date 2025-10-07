import { Link } from "react-router-dom";
import Container from "@/components/layout/Container";

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <Container className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link
              to="/"
              className="text-xl font-extrabold tracking-tight text-black hover:opacity-90"
            >
              PaperGen
            </Link>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm">
              Simple, fast test paper generation for teachers and institutes.
            </p>
          </div>

          <div>
            <div className="text-sm font-semibold text-foreground">Product</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/#home" className="text-black hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/#how-it-works" className="text-black hover:underline">
                  How it works
                </Link>
              </li>
              <li>
                <Link to="/#pricing" className="text-black hover:underline">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-black hover:underline">
                  Get started
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold text-foreground">
              Resources
            </div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/#faq" className="text-black hover:underline">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold text-foreground">Company</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/support" className="text-black hover:underline">
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-input pt-6 text-center text-sm text-muted-foreground">
          <span>© 2025 PaperGen. All rights reserved.</span>
        </div>
      </Container>
    </footer>
  );
}
