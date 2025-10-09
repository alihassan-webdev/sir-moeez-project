import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const goHome = () => {
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
    }
    setOpen(false);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setOpen(false);
  };

  return (
    <header className="w-full sticky top-0 z-50 bg-white border-b border-input">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={goHome}
          className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-black"
        >
          <span className="inline-flex h-8 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
            PG
          </span>
          <span>PaperGen</span>
        </button>

        <nav className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={goHome}
            className="px-3 py-2 rounded-md hover:bg-primary/10 text-black"
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("pricing")}
            className="px-3 py-2 rounded-md hover:bg-primary/10 text-black"
          >
            Pricing
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("faq")}
            className="px-3 py-2 rounded-md hover:bg-primary/10 text-black"
          >
            FAQ
          </button>
          <Button onClick={() => navigate("/login")}>Login</Button>
        </nav>

        <div className="md:hidden">
          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-md p-2 hover:bg-primary/10"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              className={`transition-transform duration-300 ${open ? "rotate-90 scale-95" : ""}`}
            >
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={`md:hidden bg-white border-t border-input overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${open ? "max-h-96 opacity-100 pointer-events-auto" : "max-h-0 opacity-0 pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col gap-3">
          <button
            type="button"
            className="px-3 py-2 rounded-md hover:bg-primary/10 text-black text-left"
            onClick={goHome}
          >
            Home
          </button>
          <button
            type="button"
            className="px-3 py-2 rounded-md hover:bg-primary/10 text-black text-left"
            onClick={() => scrollToSection("pricing")}
          >
            Pricing
          </button>
          <button
            type="button"
            className="px-3 py-2 rounded-md hover:bg-primary/10 text-black text-left"
            onClick={() => scrollToSection("faq")}
          >
            FAQ
          </button>
          <div className="pt-2">
            <Button onClick={() => navigate("/login")}>Login</Button>
          </div>
        </div>
      </div>
    </header>
  );
}
