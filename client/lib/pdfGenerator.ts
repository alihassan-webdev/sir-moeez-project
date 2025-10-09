import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function fillTemplateWithData(
  templateBytes: ArrayBuffer,
  data: Record<string, string>,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes);
  let usedForm = false;
  try {
    const form = pdfDoc.getForm();
    if (form) {
      for (const [key, val] of Object.entries(data)) {
        const fieldName = key.replace(/[{}]/g, "");
        try {
          const field = form.getTextField(fieldName);
          field.setText(val);
          usedForm = true;
        } catch {}
      }
      if (usedForm) {
        form.updateFieldAppearances();
      }
    }
  } catch {}

  if (!usedForm) {
    const page = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { width, height } = page.getSize();
    let y = height - 48;
    page.drawText("Generated Content", {
      x: 48,
      y,
      size: 18,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 24;
    for (const [key, val] of Object.entries(data)) {
      const line = `${key.replace(/[{}]/g, "")}: ${val}`;
      page.drawText(line, { x: 48, y, size: 12, font, color: rgb(0, 0, 0) });
      y -= 16;
      if (y < 48) {
        y = height - 48;
      }
    }
  }

  return await pdfDoc.save();
}
