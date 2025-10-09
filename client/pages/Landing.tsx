import * as React from "react";
import Header from "@/components/layout/Header";
import Container from "@/components/layout/Container";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Pricing from "./Pricing";
import Footer from "@/components/layout/Footer";
import { TemplatePreview } from "@/components/templates/TemplatePreview";
import { listTemplates } from "@/lib/templates";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Landing() {
  const navigate = useNavigate();
  const scrollToPricing = () => {
    const el = document.getElementById("pricing");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", "#pricing");
    } else {
      navigate("/#pricing");
    }
  };

  // Shared duration for all counters so they finish together and faster
  const sharedDuration = 1200; // milliseconds

  const CountUp = ({
    end,
    duration = sharedDuration,
    format,
  }: {
    end: number;
    duration?: number;
    format?: "comma" | "percent";
  }) => {
    const [value, setValue] = React.useState(0);
    React.useEffect(() => {
      let raf = 0;
      const start = performance.now();
      const from = 0;
      const to = end;
      // easeOutCubic for a snappier finish
      const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
      const step = (now: number) => {
        const elapsed = now - start;
        const tRaw = Math.min(1, elapsed / duration);
        const t = easeOutCubic(tRaw);
        const current = Math.floor(from + (to - from) * t);
        setValue(current);
        if (tRaw < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [end, duration]);

    if (format === "percent") return <>{value}%</>;
    // default: comma formatting with + suffix
    return <>{value.toLocaleString()}+</>;
  };

  return (
    <div className="min-h-svh flex flex-col">
      <Header />

      <main className="flex-1">
        <section id="home" className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="h-40 bg-gradient-to-b from-primary/10 to-transparent" />
          </div>
          <Container className="py-16 md:py-24 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
              Generate <span className="text-primary">Smart Test Papers</span>{" "}
              Effortlessly
            </h1>
            <p className="mt-4 text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Upload chapters, set marks, and create professional test papers in
              seconds. Simple, fast, and built for teachers and institutes.
            </p>

            <div className="mt-5 flex items-end justify-center gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold leading-none tabular-nums h-9 sm:h-10 flex items-center justify-center whitespace-nowrap">
                  <CountUp end={100} format="comma" />
                </div>
                <div className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Teachers using PaperGen
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold leading-none tabular-nums h-9 sm:h-10 flex items-center justify-center whitespace-nowrap">
                  <CountUp end={5000} format="comma" />
                </div>
                <div className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Papers generated
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold leading-none tabular-nums h-9 sm:h-10 flex items-center justify-center whitespace-nowrap">
                  <CountUp end={99} format="percent" />
                </div>
                <div className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Satisfaction rating
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/login")}>
                Get started
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-primary/10 border-primary/60"
                onClick={scrollToPricing}
              >
                View pricing
              </Button>
            </div>
          </Container>
        </section>

        <section>
          <Container className="pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-white border border-input px-6 py-6 card-yellow-shadow text-left">
                <div className="text-xl font-semibold mb-1">Fast</div>
                <p className="text-sm text-muted-foreground">
                  Create papers in a few clicks with clean, readable layouts.
                </p>
              </div>
              <div className="rounded-xl bg-white border border-input px-6 py-6 card-yellow-shadow text-left">
                <div className="text-xl font-semibold mb-1">Accurate</div>
                <p className="text-sm text-muted-foreground">
                  Select chapters precisely and balance total marks with
                  presets.
                </p>
              </div>
              <div className="rounded-xl bg-white border border-input px-6 py-6 card-yellow-shadow text-left">
                <div className="text-xl font-semibold mb-1">Ready to share</div>
                <p className="text-sm text-muted-foreground">
                  Export polished PDFs for printing or digital distribution.
                </p>
              </div>
            </div>
          </Container>
        </section>

        <section id="how-it-works">
          <Container className="py-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                How it works
              </h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                Generate high-quality test papers in three simple steps — upload
                syllabus or chapters, customize marks and question types, then
                export or share with your students.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-lg border bg-white px-6 py-6 text-left card-yellow-shadow">
                <div className="text-xl font-semibold">1. Upload syllabus</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Upload PDFs or select chapters from our library. PaperGen
                  parses the content and extracts topics automatically.
                </p>
              </div>
              <div className="rounded-lg border bg-white px-6 py-6 text-left card-yellow-shadow">
                <div className="text-xl font-semibold">2. Customize</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Choose question types (MCQ, short answer), total marks, and
                  difficulty distribution. Save settings for repeat use.
                </p>
              </div>
              <div className="rounded-lg border bg-white px-6 py-6 text-left card-yellow-shadow">
                <div className="text-xl font-semibold">
                  3. Generate &amp; export
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  One click generation produces printable PDF papers with answer
                  keys. Share via link or download for offline printing.
                </p>
              </div>
            </div>
          </Container>
        </section>

        <section>
          <Container className="py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold">
                  Customization
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Customize layouts or create your own.
                  Control layout, fonts, instructions, and marking schemes to
                  match your institution's standards.
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">•</span>
                    <span>
                      Preset paper styles (objective, subjective, mixed)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">•</span>
                    <span>Custom header and school branding</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">•</span>
                    <span>Difficulty and topic weighting controls</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">•</span>
                    <span>Export high-quality PDFs with answer keys</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border bg-white px-6 py-6 card-yellow-shadow">
                <div className="text-sm text-muted-foreground">
                  Example layout preview — All papers are fully editable
                  and export-ready. Use the editor to tweak layout and
                  marks.
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section id="template-gallery">
          <Container className="py-12">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Template gallery</h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">Preview exam-style layouts. Apply a template to update all future downloads.</p>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listTemplates().map((t) => (
                <div key={t.id} className="rounded-xl border bg-white p-3 card-yellow-shadow">
                  <TemplatePreview template={t} mode="compact" />
                  <div className="mt-2 text-sm font-semibold truncate">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground">{t.tier}</div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <section id="security">
          <Container className="py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-3">
                <h2 className="text-2xl sm:text-3xl font-bold">Security & Privacy</h2>
                <p className="text-sm text-muted-foreground max-w-prose">Your data stays private. PDFs are processed client-side where possible and downloads are yours to keep.</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex items-start gap-3"><span className="mt-1 text-primary">•</span><span>No student data required to generate papers</span></li>
                  <li className="flex items-start gap-3"><span className="mt-1 text-primary">•</span><span>Local PDF export with offline-friendly files</span></li>
                  <li className="flex items-start gap-3"><span className="mt-1 text-primary">•</span><span>Role-based access for institutes (coming soon)</span></li>
                </ul>
              </div>
              <div className="rounded-xl border bg-white p-5 card-yellow-shadow">
                <div className="grid grid-cols-2 gap-4 text-center text-sm">
                  <div className="rounded-lg border bg-muted/40 p-4"><div className="text-xl font-bold">Client-first</div><div className="mt-1 text-xs text-muted-foreground">Render & export locally</div></div>
                  <div className="rounded-lg border bg-muted/40 p-4"><div className="text-xl font-bold">No tracking</div><div className="mt-1 text-xs text-muted-foreground">Focus on teaching</div></div>
                  <div className="rounded-lg border bg-muted/40 p-4"><div className="text-xl font-bold">Controls</div><div className="mt-1 text-xs text-muted-foreground">Marking schemes</div></div>
                  <div className="rounded-lg border bg-muted/40 p-4"><div className="text-xl font-bold">PDF Ready</div><div className="mt-1 text-xs text-muted-foreground">Print optimized</div></div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section id="faq">
          <Container className="py-12">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold">FAQ</h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">Common questions about generating and exporting test papers.</p>
            </div>
            <div className="mt-6 rounded-xl border bg-white p-2 sm:p-4 card-yellow-shadow">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Can I use my own PDFs or chapters?</AccordionTrigger>
                  <AccordionContent>Yes. Upload your PDFs or pick chapters from the built-in library, then generate papers from them.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>How do I customize marks or difficulty?</AccordionTrigger>
                  <AccordionContent>Use the customization step to set total marks, question types, and difficulty weighting. Save presets for reuse.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Will the exported PDF match my selected template?</AccordionTrigger>
                  <AccordionContent>Yes. Your selected template applies to all generated PDFs automatically.</AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </Container>
        </section>

        <section id="cta">
          <Container className="py-12">
            <div className="rounded-xl border bg-white p-6 sm:p-8 text-center card-yellow-shadow">
              <h3 className="text-xl sm:text-2xl font-bold">Create your next test paper in minutes</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto">Pick a template, choose chapters, and export a print-ready PDF for your class.</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <Button onClick={() => navigate("/get-started")}>Get started</Button>
                <Button variant="outline" onClick={() => navigate("/templates")}>Browse templates</Button>
              </div>
            </div>
          </Container>
        </section>

        <div id="pricing" />
        <Pricing />
      </main>

      <Footer />
    </div>
  );
}
