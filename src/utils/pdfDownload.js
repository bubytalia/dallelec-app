import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Génère un PDF à partir de HTML et le télécharge directement.
 * @param {string} htmlContent - Le contenu HTML (avec styles inline)
 * @param {string} fileName - Nom du fichier PDF (sans .pdf)
 */
export const downloadPDF = async (htmlContent, fileName) => {
  // Créer un conteneur temporaire caché
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // A4 width at 96dpi
  container.style.background = 'white';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 8;
  const usableWidth = pageWidth - (margin * 2);
  const usableHeight = pageHeight - (margin * 2);

  // Chercher les éléments .page
  const pages = container.querySelectorAll('.page');

  if (pages.length > 0) {
    // Multi-page: chaque .page = une page PDF
    for (let i = 0; i < pages.length; i++) {
      if (i > 0) doc.addPage();
      const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const ratio = canvas.width / usableWidth;
      const imgHeight = canvas.height / ratio;
      
      // Si le contenu dépasse la page, on le réduit pour qu'il tienne
      if (imgHeight > usableHeight) {
        const scale = usableHeight / imgHeight;
        doc.addImage(imgData, 'JPEG', margin, margin, usableWidth * scale, usableHeight);
      } else {
        doc.addImage(imgData, 'JPEG', margin, margin, usableWidth, imgHeight);
      }
    }
  } else {
    // Pas de .page — render tout et fit sur une page
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const ratio = canvas.width / usableWidth;
    const imgHeight = canvas.height / ratio;

    if (imgHeight > usableHeight) {
      // Réduire pour tenir sur une page
      const scale = usableHeight / imgHeight;
      doc.addImage(imgData, 'JPEG', margin, margin, usableWidth * scale, usableHeight);
    } else {
      doc.addImage(imgData, 'JPEG', margin, margin, usableWidth, imgHeight);
    }
  }

  // Nettoyer
  document.body.removeChild(container);

  // Télécharger
  doc.save(`${fileName}.pdf`);
};
