import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Génère un PDF à partir de HTML et le télécharge directement.
 * @param {string} htmlContent - Le HTML complet (sans <html><head>...)
 * @param {string} fileName - Nom du fichier PDF (sans .pdf)
 * @param {object} options - { orientation: 'portrait'|'landscape', margin: number }
 */
export const downloadPDF = async (htmlContent, fileName, options = {}) => {
  const { orientation = 'portrait', margin = 10 } = options;

  // Créer un conteneur temporaire caché
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // A4 width in px at 96dpi
  container.style.background = 'white';
  container.style.padding = '20px';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.fontSize = '9px';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  // Trouver toutes les pages
  const pages = container.querySelectorAll('.page');
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = orientation === 'portrait' ? 210 : 297;
  const pageHeight = orientation === 'portrait' ? 297 : 210;
  const usableWidth = pageWidth - (margin * 2);

  if (pages.length > 0) {
    for (let i = 0; i < pages.length; i++) {
      if (i > 0) doc.addPage();
      const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgHeight = (canvas.height * usableWidth) / canvas.width;
      doc.addImage(imgData, 'JPEG', margin, margin, usableWidth, imgHeight);
    }
  } else {
    // Pas de .page, render tout le contenu
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const imgHeight = (canvas.height * usableWidth) / canvas.width;
    
    // Si le contenu dépasse une page, on split
    let position = 0;
    const usablePageHeight = pageHeight - (margin * 2);
    let pageIndex = 0;
    while (position < imgHeight) {
      if (pageIndex > 0) doc.addPage();
      doc.addImage(imgData, 'JPEG', margin, margin - position, usableWidth, imgHeight);
      position += usablePageHeight;
      pageIndex++;
    }
  }

  // Nettoyer
  document.body.removeChild(container);

  // Télécharger
  doc.save(`${fileName}.pdf`);
};
