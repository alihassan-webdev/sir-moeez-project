import React from "react";
import Container from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchTemplates, fetchTemplatePdfBytes, uploadGeneratedPdf, type TemplateDoc } from "@/lib/templateService";
import { fillTemplateWithData } from "@/lib/pdfGenerator";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export default function Templates() {
  const { toast } = useToast();
  const [templates, setTemplates] = React.useState<TemplateDoc[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [generating, setGenerating] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchTemplates();
        if (!cancelled) setTemplates(list);
      } catch (e: any) {
        toast({ title: "Failed to load", description: e?.message || "Could not fetch templates.", variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const handleGenerate = async () => {
    if (!selected) return;
    const tpl = templates.find((t) => t.id === selected);
    if (!tpl) return;
    setGenerating(true);
    try {
      const bytes = await fetchTemplatePdfBytes(tpl.pdfUrl);
      const sample: Record<string, string> = {
        "{{question_1}}": "What is AI?",
        "{{question_2}}": "Define Cloud Computing.",
        "{{question_3}}": "Explain supervised learning.",
        "{{question_4}}": "List two CPU components.",
        "{{question_5}}": "What is HTTP?",
      };
      const filled = await fillTemplateWithData(bytes, sample);
      const url = await uploadGeneratedPdf(filled, `${tpl.name}.pdf`);
      toast({
        title: "PDF generated",
        description: (
          <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-primary">Download your PDF</a>
        ),
      });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e?.message || "Could not generate PDF.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-svh">
      <Container className="py-6">
        <section className="relative overflow-hidden rounded-2xl px-6 pt-0 pb-12 sm:pt-0 sm:pb-14 mt-4">
          <div className="absolute inset-0 bg-background -z-10" />
          <div className="relative mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl text-primary">Templates</h1>
            <p className="mt-3 text-sm text-muted-foreground">Create professional papers using ready-made templates.</p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl border border-input bg-white card-yellow-shadow p-4">
            <div className="max-h-[65vh] overflow-y-auto scrollbar-none pr-1">
              {loading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Loading templates…</div>
              ) : templates.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">No templates available.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {templates.map((t) => {
                    const isSelected = selected === t.id;
                    return (
                      <div
                        key={t.id}
                        className={`group relative rounded-xl border bg-white card-yellow-shadow overflow-hidden transition hover:shadow-md ${isSelected ? "ring-2 ring-primary border-primary/60" : "border-input"}`}
                      >
                        <div className="p-3">
                          <AspectRatio ratio={4/3}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={t.preview} alt={t.name} className="h-full w-full object-cover rounded-lg" loading="lazy" />
                          </AspectRatio>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold truncate">{t.name}</div>
                            <Button
                              variant={isSelected ? "secondary" : "default"}
                              onClick={() => setSelected(isSelected ? null : t.id)}
                              className="transition-transform hover:-translate-y-0.5"
                            >
                              {isSelected ? "Selected" : "Select Template"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>

      {selected && (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center">
          <Button size="lg" className="shadow-lg" onClick={handleGenerate} disabled={generating}>
            {generating ? "Generating…" : "Generate PDF"}
          </Button>
        </div>
      )}
    </div>
  );
}
