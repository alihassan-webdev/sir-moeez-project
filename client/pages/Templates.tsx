import Container from "@/components/layout/Container";
import { useTemplateSelection } from "@/hooks/use-template-selection";

export default function Templates() {
  const { selectedTemplate } = useTemplateSelection();

  return (
    <div className="min-h-svh bg-background py-8 lg:py-12">
      <Container className="space-y-8">
        <header className="rounded-xl bg-white p-6 border border-input card-yellow-shadow">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Personalize your PDF exports
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Browse curated layouts crafted for exams, MCQs, and question
                banks. Choose a style to update all generated PDFs instantly.
              </p>
            </div>
            <div className="flex w-full max-w-sm items-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/40 p-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border/40 text-[10px] font-semibold uppercase"
                style={{
                  background: selectedTemplate.palette.accent,
                  color: selectedTemplate.palette.tagText,
                }}
              >
                {selectedTemplate.name
                  .split(" ")
                  .slice(0, 2)
                  .map((word) => word[0])
                  .join("")}
              </div>
              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold text-muted-foreground">
                  Current template
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {selectedTemplate.name}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {selectedTemplate.tier} • {selectedTemplate.palette.fontFamily
                    .split(",")[0]
                    ?.replace(/["']/g, "")}
                </div>
              </div>
            </div>
          </div>
        </header>
      </Container>
    </div>
  );
}
