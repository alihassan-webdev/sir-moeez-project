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
  const { title, body, filenameBase } = params;
  const [{ jsPDF }, html2canvasMod] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  const html2canvas = (html2canvasMod as any).default || html2canvasMod;
  const JsPDF = (jsPDF as any) || (await import("jspdf")).default;

  try {
    if ((document as any).fonts && (document as any).fonts.ready) {
      await (document as any).fonts.ready;
    }
  } catch {}

  let container: HTMLElement | null = document.querySelector(
    ".paper-view .paper-body",
  );
  let cleanup: (() => void) | null = null;

  if (!container) {
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "-99999px";
    wrapper.style.top = "0";
    wrapper.style.width = "794px"; // approx A4 width in px at 96dpi
    wrapper.className = "paper-view";
    const inner = document.createElement("div");
    inner.className =
      "paper-body prose prose-invert prose-lg leading-relaxed max-w-none break-words";
    try {
      const fmt = await import("@/lib/format");
      inner.innerHTML = fmt.formatResultHtml(body || "");
    } catch {
      inner.textContent = body || "";
    }
    wrapper.appendChild(inner);
    document.body.appendChild(wrapper);
    container = inner;
    cleanup = () => {
      try {
        document.body.removeChild(wrapper);
      } catch {}
    };
  }

  const rect = container.getBoundingClientRect();
  const width = Math.max(700, Math.ceil(rect.width));
  const canvas = await html2canvas(container, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    allowTaint: true,
    windowWidth: width,
    windowHeight: Math.ceil(container.scrollHeight || rect.height),
    logging: false,
  });

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
      ctx.fillStyle = "#ffffff";
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
  const filename = `${base}_${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.pdf`;
  doc.save(filename);

  if (cleanup) cleanup();
}
