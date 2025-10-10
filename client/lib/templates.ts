export type PaperTemplate = {
  id: string;
  name: string;
  html: string;
  placeholderSelector?: string;
};

const STORAGE_KEY = "papergen.selected_template_id";

export const DEFAULT_TEMPLATE_HTML: string = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Exam Paper Template</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html, body { font-family: 'Poppins', Arial, sans-serif; background: transparent; color:#111; }
    .page { width:160mm; margin:0; padding:12mm 16mm 8mm 16mm; background:#fff; border:none; box-shadow:none; border-radius:0; display:flex; flex-direction:column; gap:0; transform: scale(0.55); transform-origin: top left; }
    header{ display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid #111; padding-bottom:8px; margin-bottom:12px; }
    .logo{ font-weight:600; font-size:16px; color:#333; }
    .school-info{ flex:1; text-align:center; }
    .school-info h1{ margin:0; font-size:22px; font-weight:600; display:inline-block; vertical-align:middle; }
    .meta{ width:220px; text-align:left; }
    .meta table{ width:100%; border-collapse:collapse; }
    .meta td{ padding:4px; font-size:13px; border-bottom:1px solid #eee; }
    .title{ text-align:center; margin:16px 0 8px 0; }
    .title h2{ font-size:18px; font-weight:600; }
    .subtitle{ font-size:13px; color:#555; margin-top:4px; }
    .instructions{ border:1px solid #ddd; border-radius:6px; padding:10px; font-size:13px; color:#333; background:#fafafa; margin-bottom:12px; }
    section.questions{ margin-top:12px; margin-bottom:8px; }
    .question{ border:1px dashed #ccc; border-radius:5px; padding:10px; margin-bottom:8px; min-height:40px; }
    .question:last-child{ margin-bottom:0; padding-bottom:0; }
    footer{ border-top:1px solid #ddd; margin-top:0; padding-top:2px; padding-bottom:4px; display:flex; justify-content:space-between; font-size:13px; color:#444; }
    .sign{ width:30%; text-align:center; }
    @media print{
      body{background:#fff}
      .page{ transform:none; box-shadow:none; border:none; border-radius:0; margin:0; padding:8mm 12mm 6mm 12mm; page-break-after:always; min-height:297mm; }
    }
  </style>
</head>
<body>
  <div class="page" id="paper" contenteditable="true">
    <header>
      <div class="logo">Logo</div>
      <div class="school-info">
        <h1>Institute Name</h1>
      </div>
      <div class="meta">
        <table>
          <tr><td>Class:</td><td>10th</td></tr>
          <tr><td>Duration:</td><td>2 Hours</td></tr>
          <tr><td>Total Marks:</td><td>100</td></tr>
        </table>
      </div>
    </header>
    <div class="title">
      <h2>Examination Paper</h2>
      <div class="subtitle">Instructions: Read all questions carefully before attempting.</div>
    </div>
    <div class="instructions">Write exam instructions here...</div>
    <section class="questions">
      <div class="question">Question area...</div>
      <div class="question">Question area...</div>
      <div class="question">Question area...</div>
    </section>
    <footer>
      <div class="sign">Examiner Signature</div>
      <div class="sign">Date</div>
      <div class="sign">Instructor Signature</div>
    </footer>
  </div>
</body>
</html>`;

export const AVAILABLE_TEMPLATES: PaperTemplate[] = [
  {
    id: "default",
    name: "Default Template",
    html: DEFAULT_TEMPLATE_HTML,
    placeholderSelector: ".questions",
  },
];

export function getSelectedTemplateId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setSelectedTemplateId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {}
}

export function getSelectedTemplateHtml(): {
  html: string;
  placeholderSelector?: string;
} | null {
  const id = getSelectedTemplateId();
  if (!id) return null;
  const t = AVAILABLE_TEMPLATES.find((t) => t.id === id);
  if (!t) return null;
  return { html: t.html, placeholderSelector: t.placeholderSelector };
}
