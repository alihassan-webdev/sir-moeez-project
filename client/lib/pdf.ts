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
  instituteHeader?: { instituteName?: string; instituteLogo?: string; tagline?: string };
}) {
  const { title, body, filenameBase, instituteHeader } = params;
  const mod: any = await import("jspdf");
  const JsPDF = mod.jsPDF || mod.default;
  const doc = new JsPDF({ unit: "pt", format: "a4" });

  const margin = 64;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - margin * 2;
  const BORDER_PAD_X = 18;
  const BORDER_PAD_Y_TOP = 14;
  const BORDER_PAD_Y_BOTTOM = 22;
  let y = margin;

  const headingTitle = title || "Exam";

  // Optional institute header (name centered, logo left)
  if (instituteHeader?.instituteName) {
    try {
      if (instituteHeader.instituteLogo) {
        const dataUrl = instituteHeader.instituteLogo;
        const fmt = /data:image\/(png|jpeg|jpg)/i.test(dataUrl)
          ? dataUrl.match(/data:image\/(png|jpeg|jpg)/i)![1].toUpperCase() ===
            "PNG"
            ? "PNG"
            : "JPEG"
          : "PNG";
        try {
          const dims: { w: number; h: number } = await new Promise(
            (resolve, reject) => {
              const img = new Image();
              img.onload = () =>
                resolve({
                  w: img.naturalWidth || img.width,
                  h: img.naturalHeight || img.height,
                });
              img.onerror = reject;
              img.src = dataUrl;
            },
          );
          const box = 60;
          const ratio = dims.w && dims.h ? dims.w / dims.h : 1;
          let w = box;
          let h = box;
          if (ratio > 1) {
            w = box;
            h = Math.max(1, box / ratio);
          } else {
            h = box;
            w = Math.max(1, box * ratio);
          }
          const yPos = y - 6 + (box - h) / 2;
          doc.addImage(dataUrl, fmt as any, margin, yPos, w, h);
        } catch {
          doc.addImage(dataUrl, fmt as any, margin, y - 6, 60, 60);
        }
      }
    } catch {}
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    const nameLines = doc.splitTextToSize(
      String(instituteHeader.instituteName),
      pageW - margin * 2 - 70,
    );
    doc.text(nameLines, pageW / 2, y + 20, { align: "center" });
    y += 60;
    doc.setDrawColor(210);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageW - margin, y);
    y += 12;
  }

  // Title
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text("Examination Paper", pageW / 2, y, { align: "center" });
  y += 18;

  // Date line
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  const dateStr = new Date().toLocaleDateString();
  doc.text(`Generated: ${dateStr}`, pageW - margin, y, { align: "right" });
  y += 18;

  // Content bordered box
  let boxTop = y;
  const boxLeft = margin;
  const boxRight = pageW - margin;

  // Clean and normalize text
  const rawText = (body || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

  // Renumber within sections: reset at each Section ...
  const renumbered = (() => {
    const lines = rawText.split(/\r?\n/);
    let count = 0;
    const headingRe = /^\s*Section\s+[A-Z0-9\-–].*$/i;
    const qRe = /^\s*(?:Q\.?\s*)?\d+\.\s*/i;
    const optionRe = /^\s*(?:[A-Da-d][\).]|\([A-Da-d]\))\s+/;
    const out: string[] = [];
    for (const line of lines) {
      if (headingRe.test(line)) {
        count = 0;
        out.push(line);
        continue;
      }
      if (optionRe.test(line)) {
        out.push(line);
        continue;
      }
      if (qRe.test(line)) {
        count += 1;
        const rest = line.replace(qRe, "");
        out.push(`${count}. ${rest}`);
      } else {
        out.push(line);
      }
    }
    return out.join("\n");
  })();

  const paragraphs = renumbered.split(/\n\s*\n/);
  const lineHeight = 18;
  const paraGap = 10;

  function ensurePageSpace(linesNeeded = 1) {
    if (y + lineHeight * linesNeeded > pageH - margin) {
      // close current box
      doc.setDrawColor(140);
      doc.setLineWidth(1.2);
      doc.roundedRect(
        boxLeft - BORDER_PAD_X,
        boxTop - BORDER_PAD_Y_TOP,
        boxRight - boxLeft + BORDER_PAD_X * 2,
        y - boxTop + BORDER_PAD_Y_TOP + BORDER_PAD_Y_BOTTOM,
        6,
        6,
      );
      // new page
      doc.addPage();
      y = margin;
      // running header
      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.text(headingTitle, margin, y);
      doc.setDrawColor(220);
      doc.setLineWidth(0.5);
      doc.line(margin, y + 6, pageW - margin, y + 6);
      y += 16;
      boxTop = y;
    }
  }

  // Measure text with optional bold
  const measure = (t: string, bold: boolean) => {
    doc.setFont("times", bold ? "bold" : "normal");
    return doc.getTextWidth(t);
  };

  // Draw a line that supports **bold** segments
  const drawStyledLine = (
    raw: string,
    baseBold: boolean,
    x: number,
    maxW: number,
  ) => {
    const parts = raw
      .split(/(\*\*[^*]+\*\*)/g)
      .filter(Boolean)
      .map((seg) =>
        /(^\*\*[^*]+\*\*$)/.test(seg)
          ? { text: seg.slice(2, -2), bold: true }
          : { text: seg, bold: baseBold },
      );

    const tokens: { text: string; bold: boolean }[] = [];
    for (const p of parts) {
      const pieces = p.text.split(/(\s+)/);
      for (const piece of pieces) {
        if (piece === "") continue;
        tokens.push({ text: piece, bold: p.bold });
      }
    }

    let line: { text: string; bold: boolean }[] = [];
    let lineW = 0;
    let cursorX = x;

    const flush = () => {
      if (!line.length) return;
      ensurePageSpace(1);
      cursorX = x;
      for (const seg of line) {
        doc.setFont("times", seg.bold ? "bold" : "normal");
        doc.text(seg.text, cursorX, y);
        cursorX += measure(seg.text, seg.bold);
      }
      y += lineHeight;
      line = [];
      lineW = 0;
    };

    for (const tk of tokens) {
      const w = measure(tk.text, tk.bold);
      if (lineW + w > maxW && tk.text.trim() !== "") {
        flush();
      }
      line.push(tk);
      lineW += w;
    }
    flush();
  };

  for (const para of paragraphs) {
    const text = para.trim();
    if (!text) {
      y += paraGap;
      continue;
    }

    const isSection = /^\s*(Section\s+[A-Z0-9\-–].*)$/i.test(text);
    const isQuestion =
      /^\s*(?:\d+)\.\s+/.test(text) || /^\s*Q\.?\s*\d+\./i.test(text);

    if (isSection) {
      doc.setFont("times", "bold");
      doc.setFontSize(15);
      ensurePageSpace(2);
      doc.text(text.replace(/\*\*/g, ""), margin, y);
      y += 8;
      doc.setDrawColor(210);
      doc.setLineWidth(0.6);
      doc.line(margin, y, pageW - margin, y);
      y += 10;
      continue;
    }

    const lines = text.split(/\n/);
    for (let i = 0; i < lines.length; i++) {
      let l = lines[i];
      const isOption = /^\s*(?:[A-Da-d][\).]|\([A-Da-d]\))\s+/.test(l);
      const indent = isOption ? 18 : 0;
      l = l.replace(/^(\s*)(?:Q\.?\s*)?(\d+)\./i, "$1$2.");
      // Bold only the question number
      if (isQuestion) {
        l = l.replace(/^(\s*)(\d+\.)/, "$1**$2**");
      }
      const baseBold = false;
      doc.setFontSize(isQuestion ? 13 : 12);
      drawStyledLine(l, baseBold, margin + indent, contentW - indent);
      if (isOption) y -= 3;
    }
    y += paraGap;
  }

  // Close last box
  doc.setDrawColor(140);
  doc.setLineWidth(1.2);
  doc.roundedRect(
    boxLeft - BORDER_PAD_X,
    boxTop - BORDER_PAD_Y_TOP,
    boxRight - boxLeft + BORDER_PAD_X * 2,
    y - boxTop + BORDER_PAD_Y_TOP + BORDER_PAD_Y_BOTTOM,
    6,
    6,
  );

  // Footer with page numbers and optional tagline
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Page ${i} of ${totalPages}`, pageW / 2, pageH - 24, { align: "center" });
    if (instituteHeader?.tagline) {
      doc.text(String(instituteHeader.tagline), pageW - margin, pageH - 24, { align: "right" });
    }
  }

  const base = sanitizeFilenameBase(filenameBase || headingTitle);
  const filename = `${base}_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`;
  doc.save(filename);
}
