// Simple DOM-to-PDF utility using html2canvas + jsPDF
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * exportNodeToPdf
 * Captures a DOM node and saves it as a paginated A4 PDF.
 * @param {HTMLElement} node - The DOM element to capture
 * @param {string} filename - The file name to save
 * @param {object} options - Optional { scale: number, margin: number }
 */
export async function exportNodeToPdf(node, filename = 'document.pdf', options = {}) {
  if (!node) return;
  const scale = options.scale || 2;
  const margin = options.margin || 10; // in px (will be scaled to mm later)

  // Render node to canvas
  const canvas = await html2canvas(node, {
    scale,
    useCORS: true,
    allowTaint: false,
    imageTimeout: 0,
    backgroundColor: '#ffffff',
    scrollY: -window.scrollY
  });
  const imgData = canvas.toDataURL('image/png');

  // PDF setup
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Convert canvas size to mm
  const pxToMm = (px) => px * 0.264583; // 1px ~ 0.264583 mm
  const imgWidthMm = pxToMm(canvas.width);
  const imgHeightMm = pxToMm(canvas.height);

  // Compute render width to fit page with margins
  const marginMm = margin * 0.264583;
  const availableWidth = pageWidth - (marginMm * 2);
  const scaleRatio = availableWidth / imgWidthMm;
  const renderWidth = availableWidth;
  const renderHeight = imgHeightMm * scaleRatio;

  // First page: place the full image scaled to fit width
  pdf.addImage(imgData, 'PNG', marginMm, marginMm, renderWidth, renderHeight);

  // Calculate remaining height inside the page content area
  const innerPageHeight = pageHeight - marginMm * 2;
  let heightLeft = renderHeight - innerPageHeight;

  // Subsequent pages: shift the same image up to reveal lower parts
  while (heightLeft > 0) {
    pdf.addPage();
    const position = marginMm - (renderHeight - heightLeft); // negative Y to shift image up
    pdf.addImage(imgData, 'PNG', marginMm, position, renderWidth, renderHeight);
    heightLeft -= innerPageHeight;
  }

  pdf.save(filename);
}

// Render a DOM node to a PDF and return a blob URL for inline viewing
export async function renderNodeToPdfUrl(node, options = {}) {
  if (!node) return null;
  const scale = options.scale || 2;
  const margin = options.margin || 10;

  const canvas = await html2canvas(node, {
    scale,
    useCORS: true,
    allowTaint: false,
    imageTimeout: 0,
    backgroundColor: '#ffffff',
    scrollY: -window.scrollY
  });
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const pxToMm = (px) => px * 0.264583;
  const imgWidthMm = pxToMm(canvas.width);
  const imgHeightMm = pxToMm(canvas.height);

  const marginMm = margin * 0.264583;
  const availableWidth = pageWidth - (marginMm * 2);
  const scaleRatio = availableWidth / imgWidthMm;
  const renderWidth = availableWidth;
  const renderHeight = imgHeightMm * scaleRatio;

  pdf.addImage(imgData, 'PNG', marginMm, marginMm, renderWidth, renderHeight);

  const innerPageHeight = pageHeight - marginMm * 2;
  let heightLeft = renderHeight - innerPageHeight;
  while (heightLeft > 0) {
    pdf.addPage();
    const position = marginMm - (renderHeight - heightLeft);
    pdf.addImage(imgData, 'PNG', marginMm, position, renderWidth, renderHeight);
    heightLeft -= innerPageHeight;
  }

  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);
  return url;
}