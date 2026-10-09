import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

/**
 * A small page-flow helper on top of pdf-lib: headings, wrapped paragraphs, bullet and numbered lists, key/value
 * tables, automatic page breaks and page numbers. The built-in PDF fonts only cover Latin-1, so typographic
 * characters are mapped to plain equivalents first.
 */

const MAP: Record<string, string> = {
  '‘': "'", '’': "'", '‚': "'", '“': '"', '”': '"', '„': '"',
  '–': '-', '—': '-', '−': '-', '…': '...', '•': '-', '·': '-', '→': '->', '✓': 'v',
  ' ': ' ', ' ': ' ', ' ': ' ', '​': '', ' ': ' ',
};

export function pdfSafe(input: string): string {
  return String(input ?? '')
    .replace(/[‘’‚“”„–—−…•·→✓   ​ ]/g, (c) => MAP[c] ?? ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[^\x20-\x7E¡-ÿ]/g, '?');
}

const W = 595, H = 842, M = 54, LINE = 14.5;
const INK = rgb(0.1, 0.1, 0.1);
const MUTED = rgb(0.42, 0.42, 0.42);
const ACCENT = rgb(0.8, 0, 0.2);
const RULE = rgb(0.82, 0.82, 0.82);

export class PdfWriter {
  private constructor(
    private doc: PDFDocument,
    private font: PDFFont,
    private bold: PDFFont,
    private page: PDFPage,
    private y: number,
    private footerText: string,
  ) {}

  static async create(footerText = ''): Promise<PdfWriter> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const page = doc.addPage([W, H]);
    return new PdfWriter(doc, font, bold, page, H - M, footerText);
  }

  private ensure(h: number) {
    if (this.y - h < M + 10) {
      this.page = this.doc.addPage([W, H]);
      this.y = H - M;
    }
  }

  private wrap(text: string, f: PDFFont, size: number, maxW: number): string[] {
    const out: string[] = [];
    let line = '';
    for (const w of pdfSafe(text).split(' ')) {
      const test = line ? line + ' ' + w : w;
      if (f.widthOfTextAtSize(test, size) <= maxW) { line = test; continue; }
      if (line) out.push(line);
      let chunk = w;
      while (f.widthOfTextAtSize(chunk, size) > maxW && chunk.length > 1) {
        let n = chunk.length;
        while (n > 1 && f.widthOfTextAtSize(chunk.slice(0, n), size) > maxW) n--;
        out.push(chunk.slice(0, n));
        chunk = chunk.slice(n);
      }
      line = chunk;
    }
    if (line) out.push(line);
    return out.length ? out : [''];
  }

  gap(n = 8) { this.y -= n; }

  title(text: string, subtitle?: string) {
    this.ensure(60);
    for (const l of this.wrap(text, this.bold, 20, W - 2 * M)) {
      this.page.drawText(l, { x: M, y: this.y - 20, size: 20, font: this.bold, color: INK });
      this.y -= 26;
    }
    if (subtitle) {
      for (const l of this.wrap(subtitle, this.font, 12, W - 2 * M)) {
        this.ensure(LINE + 2);
        this.page.drawText(l, { x: M, y: this.y - 12, size: 12, font: this.font, color: MUTED });
        this.y -= LINE + 2;
      }
    }
    this.gap(4);
  }

  heading(text: string) {
    this.gap(10);
    this.ensure(34);
    for (const l of this.wrap(text, this.bold, 11, W - 2 * M)) {
      this.page.drawText(l, { x: M, y: this.y - 11, size: 11, font: this.bold, color: ACCENT });
      this.y -= 15;
    }
    this.page.drawLine({ start: { x: M, y: this.y + 2 }, end: { x: W - M, y: this.y + 2 }, thickness: 0.5, color: RULE });
    this.y -= 6;
  }

  para(text: string, opts: { x?: number; size?: number; bold?: boolean; color?: ReturnType<typeof rgb> } = {}) {
    const size = opts.size ?? 10;
    const f = opts.bold ? this.bold : this.font;
    const x = opts.x ?? M;
    for (const l of this.wrap(text, f, size, W - M - x)) {
      this.ensure(LINE);
      this.page.drawText(l, { x, y: this.y - size, size, font: f, color: opts.color ?? INK });
      this.y -= LINE;
    }
    this.gap(3);
  }

  list(items: string[], style: 'bullet' | 'number' = 'bullet') {
    items.forEach((item, i) => {
      const marker = style === 'number' ? `${i + 1}.` : '-';
      const lines = this.wrap(item, this.font, 10, W - M - (M + 18));
      lines.forEach((l, idx) => {
        this.ensure(LINE);
        if (idx === 0) this.page.drawText(marker, { x: M + 4, y: this.y - 10, size: 10, font: this.font, color: MUTED });
        this.page.drawText(l, { x: M + 18, y: this.y - 10, size: 10, font: this.font, color: INK });
        this.y -= LINE;
      });
      this.gap(1);
    });
    this.gap(3);
  }

  rows(rows: [string, string][], keyWidth = 150) {
    for (const [k, v] of rows) {
      const valLines = this.wrap(v, this.bold, 10, W - M - (M + keyWidth));
      this.ensure(LINE * valLines.length);
      this.page.drawText(pdfSafe(k), { x: M, y: this.y - 10, size: 10, font: this.font, color: MUTED });
      valLines.forEach((l, i) => {
        this.page.drawText(l, { x: M + keyWidth, y: this.y - 10 - i * LINE, size: 10, font: this.bold, color: INK });
      });
      this.y -= LINE * valLines.length;
    }
    this.gap(4);
  }

  rule() {
    this.ensure(10);
    this.page.drawLine({ start: { x: M, y: this.y }, end: { x: W - M, y: this.y }, thickness: 0.5, color: RULE });
    this.y -= 8;
  }

  async save(): Promise<Uint8Array> {
    const pages = this.doc.getPages();
    pages.forEach((p, i) => {
      if (this.footerText) p.drawText(pdfSafe(this.footerText).slice(0, 110), { x: M, y: 26, size: 7.5, font: this.font, color: MUTED });
      p.drawText(`Page ${i + 1} of ${pages.length}`, { x: W - M - 58, y: 26, size: 7.5, font: this.font, color: MUTED });
    });
    return this.doc.save();
  }
}
