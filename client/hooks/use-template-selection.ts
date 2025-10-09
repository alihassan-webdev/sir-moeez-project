import { useMemo, useSyncExternalStore } from "react";
import {
  getSelectedTemplate,
  getSelectedTemplateIdSnapshot,
  listTemplates,
  setSelectedTemplateId,
  subscribeTemplateSelection,
} from "@/lib/templates";

export function useTemplateSelection() {
  const selectedId = useSyncExternalStore(
    subscribeTemplateSelection,
    getSelectedTemplateIdSnapshot,
    getSelectedTemplateIdSnapshot,
  );

  const templates = useMemo(() => listTemplates(), []);
  const selectedTemplate = useMemo(() => getSelectedTemplate(), [selectedId]);

  return {
    templates,
    selectedTemplateId: selectedId,
    selectedTemplate,
    setSelectedTemplateId,
  };
}
