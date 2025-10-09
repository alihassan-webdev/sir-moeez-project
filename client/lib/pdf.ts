function sanitizeFilenameBase(s: string) {
  const out = s
    .trim()
    .slice(0, 60)
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/\s+/g, "_");
  return out || "document";
}

export async function generateExamStylePdf(params: {
  title: string;
  body: string;
  filenameBase?: string;
  instituteHeader?: {
    instituteName?: string;
    instituteLogo?: string;
    tagline?: string;
  };
}) {
  const { title, body, filenameBase, instituteHeader } = params;

  const [{ jsPDF }, html2canvasMod] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  const html2canvas = (html2canvasMod as any).default || html2canvasMod;
  const JsPDF = (jsPDF as any) || (await import("jspdf")).default;

  // Get current template selection
  const { getSelectedTemplate } = await import("@/lib/templates");
  const template = getSelectedTemplate();
  const { palette, layout, preview } = template;

  try {
    if ((document as any).fonts && (document as any).fonts.ready) {
      await (document as any).fonts.ready;
    }
  } catch {}

  // Offscreen container
  let wrapper: HTMLDivElement | null = null;
  let container: HTMLElement | null = null;
  let cleanup: (() => void) | null = null;

  wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-99999px";
  wrapper.style.top = "0";
  wrapper.style.width = "794px"; // ~A4 width in px at 96dpi
  wrapper.style.background = palette.pageBackground || "#ffffff";
  wrapper.style.padding = "0";
  wrapper.style.boxSizing = "border-box";
  wrapper.className = "paper-view";
  wrapper.style.fontFamily = palette.fontFamily;
  wrapper.style.color = palette.text || "#000000";

  // Optional watermark
  if (palette.watermark) {
    const wm = document.createElement("div");
    wm.textContent = String(palette.watermark.text || "");
    wm.style.position = "absolute";
    wm.style.inset = "0";
    wm.style.display = "flex";
    wm.style.alignItems = "center";
    wm.style.justifyContent = "center";
    wm.style.pointerEvents = "none";
    wm.style.textTransform = "uppercase";
    wm.style.fontWeight = "900";
    wm.style.letterSpacing = "0.4em";
    wm.style.fontSize = "28px";
    wm.style.color = palette.heading || "#000";
    wm.style.opacity = String(palette.watermark.opacity ?? 0.05);
    wrapper.appendChild(wm);
  }

  const inner = document.createElement("div");
  inner.className =
    "paper-body prose prose-lg leading-relaxed max-w-none break-words";
  inner.style.position = "relative";
  inner.style.zIndex = "1";
  inner.style.color = preview.bodyTextColor || palette.text || "#000000";

  // Optional institute header
  if (instituteHeader?.instituteName || instituteHeader?.instituteLogo) {
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.gap = "12px";
    header.style.borderBottom = `1px solid ${palette.border || "#E5E7EB"}`;
    header.style.padding = "6px 0 12px 0";

    if (instituteHeader?.instituteLogo) {
      const img = document.createElement("img");
      img.src = instituteHeader.instituteLogo;
      img.alt = "Institute Logo";
      img.style.width = "56px";
      img.style.height = "56px";
      img.style.objectFit = "contain";
      img.style.borderRadius = "6px";
      img.crossOrigin = "anonymous";
      header.appendChild(img);
    }

    if (instituteHeader?.instituteName) {
      const name = document.createElement("div");
      name.style.fontWeight = "800";
      name.style.fontSize = "18px";
      name.style.lineHeight = "1.2";
      name.style.color = palette.heading || "#000000";
      name.textContent = String(instituteHeader.instituteName || "");
      header.appendChild(name);
    }

    if (instituteHeader?.tagline) {
      const tag = document.createElement("div");
      tag.textContent = String(instituteHeader.tagline || "");
      tag.style.marginLeft = "auto";
      tag.style.fontSize = "12px";
      tag.style.opacity = "0.8";
      tag.style.color = preview.bodyTextColor || palette.text || "#000";
      header.appendChild(tag);
    }

    inner.appendChild(header);
  }

  // Template-styled exam title header
  const headerBand = document.createElement("div");
  headerBand.style.background = preview.headerBackground || palette.accentSoft;
  headerBand.style.color = preview.headerTextColor || palette.heading;
  headerBand.style.boxShadow = layout.headerShadow;
  headerBand.style.padding = "12px 16px";
  headerBand.style.borderRadius = `${layout.rounded}px`;
  headerBand.style.fontWeight = "700";
  headerBand.style.fontSize = "18px";
  headerBand.style.backdropFilter = "blur(2px)";
  headerBand.style.textTransform = layout.uppercaseTitle ? "uppercase" : "none";
  headerBand.style.textAlign =
    layout.headerAlign === "center" ? "center" : "left";
  headerBand.textContent = title;

  // Accent line top/bottom
  if (layout.accentLine === "top" && preview.accentBar) {
    const bar = document.createElement("div");
    bar.style.height = "6px";
    bar.style.borderRadius = "9999px";
    bar.style.background = preview.accentBar;
    bar.style.marginBottom = "10px";
    inner.appendChild(bar);
  }

  inner.appendChild(headerBand);

  if (layout.accentLine === "bottom" && preview.accentBar) {
    const bar = document.createElement("div");
    bar.style.height = "6px";
    bar.style.borderRadius = "9999px";
    bar.style.background = preview.accentBar;
    bar.style.marginTop = "10px";
    inner.appendChild(bar);
  }

  // Paper body
  const paperCard = document.createElement("div");
  paperCard.style.background = palette.cardBackground || "#ffffff";
  paperCard.style.border = `1px solid ${palette.border || "#e5e7eb"}`;
  paperCard.style.borderRadius = `${layout.rounded - 4}px`;
  paperCard.style.boxShadow = layout.shadow;
  paperCard.style.padding = "16px";
  paperCard.style.marginTop = "12px";
  paperCard.style.textAlign = "left";
  paperCard.style.lineHeight = "1.7";

  const bodyEl = document.createElement("div");
  bodyEl.style.color = preview.bodyTextColor || palette.text || "#000000";
  try {
    const fmt = await import("@/lib/format");
    bodyEl.innerHTML = fmt.formatResultHtml(body || "");
  } catch {
    bodyEl.textContent = body || "";
  }

  paperCard.appendChild(bodyEl);
  inner.appendChild(paperCard);

  wrapper.appendChild(inner);
  document.body.appendChild(wrapper);
  container = inner;
  cleanup = () => {
    try {
      if (wrapper && wrapper.parentNode)
        wrapper.parentNode.removeChild(wrapper);
    } catch {}
  };

  // Render to canvas
  const rect = container.getBoundingClientRect();
  const width = Math.max(700, Math.ceil(rect.width));
  const canvas = await html2canvas(container, {
    scale: 2,
    backgroundColor: palette.pageBackground || "#ffffff",
    useCORS: true,
    allowTaint: true,
    windowWidth: width,
    windowHeight: Math.ceil(container.scrollHeight || rect.height),
    logging: false,
  });

  // Slice into A4 pages
  const doc = new JsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentW = pageW - margin * 2;

  const imgWidthPt = contentW;
  const pageContentH = pageH - margin * 2;
  const pageContentHPx = Math.floor((pageContentH * canvas.width) / imgWidthPt);
  const totalSlices = Math.ceil(canvas.height / pageContentHPx);

  for (let i = 0; i < totalSlices; i++) {
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = Math.min(
      pageContentHPx,
      canvas.height - i * pageContentHPx,
    );
    const ctx = sliceCanvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = palette.pageBackground || "#ffffff";
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        i * pageContentHPx,
        canvas.width,
        sliceCanvas.height,
        0,
        0,
        sliceCanvas.width,
        sliceCanvas.height,
      );
    }
    const dataUrl = sliceCanvas.toDataURL("image/png", 1.0);
    if (i > 0) doc.addPage();
    doc.addImage(
      dataUrl,
      "PNG",
      margin,
      margin,
      imgWidthPt,
      (sliceCanvas.height * imgWidthPt) / sliceCanvas.width,
    );
  }

  const base = sanitizeFilenameBase(filenameBase || title || "exam");
  const filename = `${base}_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`;
  doc.save(filename);

  if (cleanup) cleanup();
}
