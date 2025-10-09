import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  getDefaultTemplate,
  getSelectedTemplateIdSnapshot,
  getTemplateById,
  groupTemplatesByTier,
  listTemplates,
  setSelectedTemplateId,
  subscribeTemplateSelection,
  TEMPLATE_TIERS,
  type TemplateDefinition,
  type TemplateTier,
} from "@/lib/templates";

type TemplateGroups = Record<TemplateTier, TemplateDefinition[]>;

type TemplateSelectionHook = {
  templates: TemplateDefinition[];
  groupedTemplates: TemplateGroups;
  tiers: TemplateTier[];
  selectedTemplateId: string;
  selectedTemplate: TemplateDefinition;
  selectTemplate: (templateId: string) => void;
  setSelectedTemplateId: (templateId: string) => void;
  isSelected: (templateId: string) => boolean;
};

export function useTemplateSelection(): TemplateSelectionHook {
  const selectedId = useSyncExternalStore(
    subscribeTemplateSelection,
    getSelectedTemplateIdSnapshot,
    getSelectedTemplateIdSnapshot,
  );

  const templates = useMemo(() => listTemplates(), []);
  const groupedTemplates = useMemo<TemplateGroups>(
    () => groupTemplatesByTier(templates),
    [templates],
  );

  const tiers = useMemo<TemplateTier[]>(
    () => TEMPLATE_TIERS.filter((tier) => groupedTemplates[tier]?.length),
    [groupedTemplates],
  );

  const selectedTemplate = useMemo(() => {
    const template = getTemplateById(selectedId) ?? templates[0];
    return template ?? getDefaultTemplate();
  }, [selectedId, templates]);

  const selectTemplate = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
  }, []);

  const isSelected = useCallback(
    (templateId: string) => selectedId === templateId,
    [selectedId],
  );

  return {
    templates,
    groupedTemplates,
    tiers,
    selectedTemplateId: selectedId,
    selectedTemplate,
    selectTemplate,
    setSelectedTemplateId: selectTemplate,
    isSelected,
  };
}
