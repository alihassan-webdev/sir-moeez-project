import Container from "@/components/layout/Container";
import { DEFAULT_TEMPLATE_HTML, getSelectedTemplateId, setSelectedTemplateId } from "@/lib/templates";
import * as React from "react";

export default function Templates() {
  const [selectedId, setSelectedId] = React.useState<string | null>(getSelectedTemplateId());
  const isSelected = selectedId === "default";
  return (
    <Container className="py-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold">Default Template</h1>
          <button
            type="button"
            onClick={() => setSelectedTemplateId("default")}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${
              isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-white hover:bg-primary/10 border-input"
            }`}
            aria-pressed={isSelected}
          >
            {isSelected ? "Selected" : "Use this template"}
          </button>
        </div>
        <div className="mt-4">
          <iframe
            title="Default Template Preview"
            srcDoc={DEFAULT_TEMPLATE_HTML}
            style={{ width: 460, height: 650, border: "none", background: "transparent" }}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      </div>
    </Container>
  );
}
