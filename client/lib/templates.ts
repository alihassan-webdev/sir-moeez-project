const isBrowser = () =>
  typeof window !== "undefined" && typeof window.document !== "undefined";

export type TemplateTier = "Professional";

type TemplatePreviewVariant = "default" | "board-exam";

export const TEMPLATE_TIERS: TemplateTier[] = ["Professional"];

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
    variant?: TemplatePreviewVariant;
  };
};

const TEMPLATE_STORAGE_KEY = "papergen:selected-template";

const TEMPLATES: TemplateDefinition[] = [
  {
    id: "professional-board-paper",
    name: "Board Style Exam",
    tier: "Professional",
    description:
      "Board inspired A4 layout with editable metadata, tables, and structured sections.",
    features: [
      "Dual-column header with board crest placeholder",
      "Marks breakdown table and instruction callout",
      "Sectioned MCQ, short, and long answer blocks",
    ],
    palette: {
      pageBackground: "#f2f2f2",
      cardBackground: "#ffffff",
      border: "#d6d6d6",
      accent: "#222222",
      accentSoft: "#f4f4f4",
      heading: "#1f2937",
      text: "#374151",
      tagBackground: "rgba(34,34,34,0.1)",
      tagText: "#222222",
      fontFamily: "'Georgia','Times New Roman',serif",
    },
    layout: {
      headerAlign: "left",
      rounded: 12,
      shadow: "0 24px 60px rgba(15,23,42,0.12)",
      headerShadow: "0 16px 40px rgba(34,34,34,0.15)",
      accentLine: "none",
    },
    preview: {
      background: "linear-gradient(135deg,#f2f2f2 0%,#ffffff 80%)",
      headerBackground: "#ffffff",
      headerTextColor: "#1f2937",
      bodyTextColor: "#374151",
      variant: "board-exam",
    },
  },
];

let hasLoadedFromStorage = false;
let selectedTemplateId = TEMPLATES[0]?.id ?? "professional-board-paper";
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
