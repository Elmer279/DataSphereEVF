/**
 * Utility for exporting DOM elements to high-fidelity PDF documents
 * with robust sanitization to prevent html2canvas/html2pdf failures caused by
 * modern CSS color functions (e.g. Tailwind v4 oklch() colors).
 */

export interface PdfExportOptions {
  element: HTMLElement | null;
  filename: string;
  orientation?: 'landscape' | 'portrait';
  format?: string | [number, number];
  margin?: [number, number, number, number] | number;
  scale?: number;
  selfContained?: boolean;
  valign?: 'top' | 'middle';
  multiPage?: boolean;
  onSuccess?: () => void;
  onError?: (err: any) => void;
}

/**
 * Converts any CSS color string (including modern oklch, lab, color-mix, etc.)
 * to standard rgba/hex using the browser's native canvas 2D rendering engine.
 */
export function convertColorToRgb(colorStr: string): string {
  if (!colorStr) return colorStr;
  if (
    !colorStr.includes('oklch') &&
    !colorStr.includes('lch') &&
    !colorStr.includes('lab') &&
    !colorStr.includes('color(') &&
    !colorStr.includes('color-mix')
  ) {
    return colorStr;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillStyle = colorStr;
      const computed = ctx.fillStyle;
      if (computed && !computed.includes('oklch')) {
        return computed;
      }
    }
  } catch {
    // Fallback if canvas context fails
  }

  // Fallback defaults for common ALS brand tones
  const lower = colorStr.toLowerCase();
  if (lower.includes('blue') || lower.includes('sky') || lower.includes('navy') || lower.includes('265')) {
    return '#002B6D';
  }
  if (lower.includes('amber') || lower.includes('yellow') || lower.includes('orange')) {
    return '#D97706';
  }
  if (lower.includes('emerald') || lower.includes('green')) {
    return '#059669';
  }
  if (lower.includes('rose') || lower.includes('red') || lower.includes('pink')) {
    return '#E11D48';
  }
  if (lower.includes('purple') || lower.includes('indigo') || lower.includes('violet')) {
    return '#7C3AED';
  }
  return '#334155';
}

/**
 * Deeply sanitizes a cloned DOM document before html2canvas parses its CSS rules,
 * eliminating all oklch() color expressions in stylesheets, inline styles, and CSS variables.
 * Also resets any negative-offset positioning so html2canvas captures the element cleanly.
 */
export function sanitizeDocForHtml2Canvas(clonedDoc: Document, selfContained: boolean = false): void {
  try {
    // 1. If selfContained (contains complete inline styles), strip external stylesheet links
    // to avoid html2canvas crashing on Tailwind v4 oklch() in external stylesheets.
    if (selfContained) {
      const linkElements = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
      linkElements.forEach((link) => link.remove());
    }

    // 2. Sanitize all <style> tags
    const styleElements = clonedDoc.querySelectorAll('style');
    styleElements.forEach((styleTag) => {
      if (styleTag.textContent) {
        // Replace all oklch(...) expressions
        styleTag.textContent = styleTag.textContent
          .replace(/oklch\s*\([^;}]+\)/gi, (match) => convertColorToRgb(match))
          .replace(/color-mix\s*\([^;}]+\)/gi, (match) => convertColorToRgb(match));
      }
    });

    // 3. Reset any offscreen or fixed positioning on exported containers
    const allElements = clonedDoc.querySelectorAll('*');
    allElements.forEach((node) => {
      const el = node as HTMLElement;

      // Fix offscreen coordinates that would cause html2canvas to render a blank canvas
      if (el.style) {
        if (el.style.left && el.style.left.includes('-')) {
          el.style.left = '0px';
        }
        if (el.style.top && el.style.top.includes('-')) {
          el.style.top = '0px';
        }
        if (el.style.position === 'fixed') {
          el.style.position = 'static';
        }
        if (el.style.zIndex && parseInt(el.style.zIndex, 10) < 0) {
          el.style.zIndex = '1';
        }

        // Sanitize inline styles with oklch/color-mix
        if (el.style.cssText && (el.style.cssText.includes('oklch') || el.style.cssText.includes('color-mix'))) {
          el.style.cssText = el.style.cssText
            .replace(/oklch\s*\([^;}]+\)/gi, (match) => convertColorToRgb(match))
            .replace(/color-mix\s*\([^;}]+\)/gi, (match) => convertColorToRgb(match));
        }
      }
    });

    // 4. Inject standard print styling override
    const overrideStyle = clonedDoc.createElement('style');
    overrideStyle.textContent = `
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
        background-color: #ffffff !important;
        color: #0f172a !important;
      }
    `;
    clonedDoc.head.appendChild(overrideStyle);
  } catch (err) {
    console.warn('DOM sanitization warning for PDF export:', err);
  }
}

/**
 * Exports an HTML element directly to a downloadable PDF file.
 */
export async function exportElementToPdf(options: PdfExportOptions): Promise<boolean> {
  const {
    element,
    filename,
    orientation = 'landscape',
    format = 'a4',
    margin = [5, 5, 5, 5],
    scale = 2.0,
    selfContained = false,
    valign = 'middle',
    multiPage = false,
    onSuccess,
    onError
  } = options;

  if (!element) {
    console.error('PDF Export Error: Target element is null or undefined.');
    if (onError) onError(new Error('Target element not found'));
    return false;
  }

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf')
    ]);

    // Render DOM element to high-DPI canvas with sanitization
    const canvas = await html2canvas(element, {
      scale: scale || 2.0,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      onclone: (clonedDoc: Document) => {
        sanitizeDocForHtml2Canvas(clonedDoc, selfContained);
      }
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas rendering produced an empty canvas');
    }

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Parse margins [top, right, bottom, left] - default to 5mm (0.5cm) on all sides
    let mTop = 5, mRight = 5, mBottom = 5, mLeft = 5;
    if (Array.isArray(margin)) {
      if (margin.length === 4) {
        [mTop, mRight, mBottom, mLeft] = margin;
      } else if (margin.length === 2) {
        [mTop, mRight] = margin;
        mBottom = mTop;
        mLeft = mRight;
      }
    } else if (typeof margin === 'number') {
      mTop = mRight = mBottom = mLeft = margin;
    }

    const printableWidth = pageWidth - mLeft - mRight;
    const printableHeight = pageHeight - mTop - mBottom;

    const pxPerMm = canvas.width / printableWidth;
    const pageHeightPx = Math.floor(printableHeight * pxPerMm);

    // Multi-page slicing support for high-volume tabular records
    if (multiPage && canvas.height > pageHeightPx) {
      const totalPages = Math.ceil(canvas.height / pageHeightPx);
      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        if (pageIdx > 0) {
          pdf.addPage(format, orientation);
        }

        const sourceY = pageIdx * pageHeightPx;
        const sliceHeightPx = Math.min(pageHeightPx, canvas.height - sourceY);

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeightPx;
        const pageCtx = pageCanvas.getContext('2d');
        if (pageCtx) {
          pageCtx.fillStyle = '#ffffff';
          pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          pageCtx.drawImage(
            canvas,
            0, sourceY, canvas.width, sliceHeightPx,
            0, 0, canvas.width, sliceHeightPx
          );
        }

        const sliceHeightMm = sliceHeightPx / pxPerMm;
        const sliceImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
        pdf.addImage(sliceImgData, 'JPEG', mLeft, mTop, printableWidth, sliceHeightMm, undefined, 'FAST');
      }
    } else {
      // Calculate aspect ratios for proportional scaling on a single page
      const canvasAspect = canvas.width / canvas.height;

      let finalWidth = printableWidth;
      let finalHeight = printableWidth / canvasAspect;

      // Constrain by height if content is taller than printable aspect
      if (finalHeight > printableHeight) {
        finalHeight = printableHeight;
        finalWidth = printableHeight * canvasAspect;
      }

      // Position horizontally centered, and vertically according to valign preference
      const posX = mLeft + (printableWidth - finalWidth) / 2;
      const posY = valign === 'top' ? mTop : (mTop + (printableHeight - finalHeight) / 2);

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', posX, posY, finalWidth, finalHeight, undefined, 'FAST');
    }

    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);

    if (onSuccess) onSuccess();
    return true;
  } catch (err) {
    console.error('PDF Export Failed:', err);
    if (onError) onError(err);
    return false;
  }
}

/**
 * Triggers a standalone print dialog inside an isolated invisible iframe,
 * preserving layout fidelity without interfering with parent app UI.
 */
export function printElementViaIframe(
  element: HTMLElement | null,
  title: string = 'Document',
  orientation: 'landscape' | 'portrait' = 'landscape'
): void {
  if (!element) {
    window.print();
    return;
  }
  printHtmlViaIframe(element.outerHTML, title, orientation);
}

/**
 * Prints raw HTML directly inside an isolated iframe, eliminating popup-blocker issues.
 */
export function printHtmlViaIframe(
  htmlContent: string,
  title: string = 'Document',
  orientation: 'landscape' | 'portrait' = 'landscape'
): void {
  try {
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.left = '-10000px';
    printFrame.style.top = '0';
    printFrame.style.width = '1080px';
    printFrame.style.height = '800px';
    printFrame.style.border = '0';
    printFrame.style.opacity = '0';
    printFrame.style.pointerEvents = 'none';
    printFrame.style.zIndex = '-99999';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
    if (!frameDoc) {
      window.print();
      document.body.removeChild(printFrame);
      return;
    }

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            @page {
              size: A4 ${orientation};
              margin: 0.5cm;
            }
            *, *::before, *::after {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            html, body {
              width: 100% !important;
              height: auto !important;
              min-height: auto !important;
              max-height: none !important;
              margin: 0 !important;
              padding: 0 !important;
              background-color: #ffffff !important;
              color: #0f172a !important;
              font-family: Arial, 'Segoe UI', sans-serif;
              -webkit-font-smoothing: antialiased;
              overflow: visible !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
            tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: auto !important;
            }
            td, th {
              overflow: visible !important;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch (e) {
        console.warn('Iframe print failed, falling back to direct window.print():', e);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 1500);
      }
    }, 450);
  } catch (err) {
    console.error('Print iframe generation error:', err);
    window.print();
  }
}
