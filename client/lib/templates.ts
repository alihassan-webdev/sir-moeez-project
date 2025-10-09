const isBrowser = () =>
  typeof window !== "undefined" && typeof window.document !== "undefined";

export type TemplateTier = "Standard" | "Professional" | "Premium";

export const TEMPLATE_TIERS: TemplateTier[] = [
  "Standard",
  "Professional",
  "Premium",
];

type TemplateWatermark = {
  text: string;
  opacity: number;
};

export type TemplateDefinition = {
  id: string;
  name: string;
  tier: TemplateTier;
  description: string;
  features: string[];
  palette: {
    pageBackground: string;
    cardBackground: string;
    border: string;
    accent: string;
    accentSoft: string;
    heading: string;
    text: string;
    tagBackground: string;
    tagText: string;
    fontFamily: string;
    watermark?: TemplateWatermark;
  };
  layout: {
    headerAlign: "left" | "center";
    rounded: number;
    shadow: string;
    headerShadow: string;
    uppercaseTitle?: boolean;
    accentLine?: "bottom" | "top" | "none";
  };
  preview: {
    background: string;
    headerBackground: string;
    accentBar?: string;
    headerTextColor: string;
    bodyTextColor: string;
  };
};

const TEMPLATE_STORAGE_KEY = "papergen:selected-template";

const TEMPLATES: TemplateDefinition[] = [
  {
    id: "standard-classic",
    name: "Classic Blue",
    tier: "Standard",
    description:
      "Clean typography with a confident blue underline and subtle watermark.",
    features: [
      "Blue accent underline for headings",
      "Neutral background ideal for printing",
      "Subtle PaperGen watermark",
    ],
    palette: {
      pageBackground: "#f8fafc",
      cardBackground: "#ffffff",
      border: "#d5dde6",
      accent: "#1d4ed8",
      accentSoft: "#e0e7ff",
      heading: "#1e293b",
      text: "#0f172a",
      tagBackground: "rgba(29,78,216,0.12)",
      tagText: "#1d4ed8",
      fontFamily: "'Inter','Segoe UI',sans-serif",
      watermark: {
        text: "PaperGen",
        opacity: 0.04,
      },
    },
    layout: {
      headerAlign: "left",
      rounded: 18,
      shadow: "0 28px 60px rgba(15,23,42,0.08)",
      headerShadow: "0 10px 30px rgba(15,23,42,0.12)",
      accentLine: "bottom",
    },
    preview: {
      background: "linear-gradient(135deg,#f8fafc 0%,#dfe7ff 100%)",
      headerBackground: "#e0e7ff",
      accentBar: "#1d4ed8",
      headerTextColor: "#1d4ed8",
      bodyTextColor: "#0f172a",
    },
  },
  {
    id: "standard-modern",
    name: "Modern Slate",
    tier: "Standard",
    description:
      "Minimal slate styling with tight spacing and crisp section headers.",
    features: [
      "Slate grey title band",
      "Sans-serif body copy",
      "Thin divider lines",
    ],
    palette: {
      pageBackground: "#f5f7fa",
      cardBackground: "#ffffff",
      border: "#d0d7e2",
      accent: "#334155",
      accentSoft: "#e2e8f0",
      heading: "#111827",
      text: "#1f2937",
      tagBackground: "rgba(51,65,85,0.12)",
      tagText: "#334155",
      fontFamily: "'Inter','Segoe UI',sans-serif",
    },
    layout: {
      headerAlign: "left",
      rounded: 18,
      shadow: "0 20px 45px rgba(15,23,42,0.07)",
      headerShadow: "0 12px 32px rgba(15,23,42,0.08)",
      accentLine: "top",
    },
    preview: {
      background: "linear-gradient(135deg,#f5f7fa 0%,#e3e8ef 100%)",
      headerBackground: "#e2e8f0",
      accentBar: "#334155",
      headerTextColor: "#1f2937",
      bodyTextColor: "#1f2937",
    },
  },
  {
    id: "professional-midnight",
    name: "Midnight Professional",
    tier: "Professional",
    description:
      "Dark header ribbon with centered title and elevated contrast.",
    features: [
      "Centered exam title",
      "Dark midnight ribbon",
      "High contrast body text",
    ],
    palette: {
      pageBackground: "#f3f4f6",
      cardBackground: "#ffffff",
      border: "#cbd5f5",
      accent: "#312e81",
      accentSoft: "linear-gradient(90deg,#1e1b4b,#312e81)",
      heading: "#111827",
      text: "#1f2937",
      tagBackground: "rgba(49,46,129,0.15)",
      tagText: "#312e81",
      fontFamily: "'DM Sans','Inter','Segoe UI',sans-serif",
      watermark: {
        text: "PaperGen Pro",
        opacity: 0.05,
      },
    },
    layout: {
      headerAlign: "center",
      rounded: 20,
      shadow: "0 32px 70px rgba(79,70,229,0.18)",
      headerShadow: "0 16px 40px rgba(79,70,229,0.25)",
      uppercaseTitle: true,
      accentLine: "none",
    },
    preview: {
      background: "linear-gradient(135deg,#ede9fe 0%,#c7d2fe 100%)",
      headerBackground: "linear-gradient(90deg,#1e1b4b,#312e81)",
      accentBar: "rgba(49,46,129,0.6)",
      headerTextColor: "#f8fafc",
      bodyTextColor: "#1f2937",
    },
  },
  {
    id: "premium-aurora",
    name: "Aurora Elite",
    tier: "Premium",
    description:
      "Gradient aurora header, floating card shadow, and elegant serif body.",
    features: [
      "Aurora gradient banner",
      "Serif body copy",
      "Premium watermark",
    ],
    palette: {
      pageBackground: "#fdf4ff",
      cardBackground: "#ffffff",
      border: "rgba(76,29,149,0.15)",
      accent: "#9333ea",
      accentSoft: "linear-gradient(135deg,#fbcfe8 0%,#c084fc 100%)",
      heading: "#581c87",
      text: "#312e81",
      tagBackground: "rgba(147,51,234,0.14)",
      tagText: "#7e22ce",
      fontFamily: "'Georgia','Times New Roman',serif",
      watermark: {
        text: "Aurora Series",
        opacity: 0.05,
      },
    },
    layout: {
      headerAlign: "center",
      rounded: 22,
      shadow: "0 36px 80px rgba(147,51,234,0.22)",
      headerShadow: "0 18px 44px rgba(147,51,234,0.30)",
      uppercaseTitle: true,
      accentLine: "bottom",
    },
    preview: {
      background: "linear-gradient(180deg,#fbcfe8 0%,#ede9fe 50%,#faf5ff 100%)",
      headerBackground: "linear-gradient(120deg,#f472b6,#c084fc,#818cf8)",
      accentBar: "rgba(147,51,234,0.6)",
      headerTextColor: "#fdf4ff",
      bodyTextColor: "#4c1d95",
    },
  },
];

let hasLoadedFromStorage = false;
let selectedTemplateId = TEMPLATES[0]?.id ?? "standard-classic";
const listeners = new Set<() => void>();

function ensureLoadedFromStorage() {
  if (hasLoadedFromStorage) return;
  hasLoadedFromStorage = true;
  if (!isBrowser()) return;
  const stored = window.localStorage.getItem(TEMPLATE_STORAGE_KEY);
  if (stored && TEMPLATES.some((t) => t.id === stored)) {
    selectedTemplateId = stored;
  }
}

function notifySelectionChange() {
  listeners.forEach((listener) => listener());
  if (isBrowser()) {
    window.dispatchEvent(
      new CustomEvent("papergen:template-selection", {
        detail: { templateId: selectedTemplateId },
      }),
    );
  }
}

export function listTemplates() {
  return [...TEMPLATES];
}

export function groupTemplatesByTier(
  templates: TemplateDefinition[] = listTemplates(),
) {
  const grouped = TEMPLATE_TIERS.reduce(
    (acc, tier) => {
      acc[tier] = [] as TemplateDefinition[];
      return acc;
    },
    {} as Record<TemplateTier, TemplateDefinition[]>,
  );

  for (const template of templates) {
    grouped[template.tier]?.push(template);
  }

  return grouped;
}

export function getTemplateById(id: string | null | undefined) {
  if (!id) return undefined;
  return TEMPLATES.find((template) => template.id === id);
}

export function getDefaultTemplate() {
  return TEMPLATES[0];
}

export function getSelectedTemplateIdSnapshot() {
  ensureLoadedFromStorage();
  return selectedTemplateId;
}

export function getSelectedTemplate() {
  return (
    getTemplateById(getSelectedTemplateIdSnapshot()) ?? getDefaultTemplate()
  );
}

export function setSelectedTemplateId(id: string) {
  ensureLoadedFromStorage();
  if (!TEMPLATES.some((template) => template.id === id)) return;
  selectedTemplateId = id;
  if (isBrowser()) {
    window.localStorage.setItem(TEMPLATE_STORAGE_KEY, id);
  }
  notifySelectionChange();
}

export function subscribeTemplateSelection(listener: () => void) {
  ensureLoadedFromStorage();
  listeners.add(listener);
  return () => listeners.delete(listener);
}
