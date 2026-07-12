import jsPDF from 'jspdf';

/**
 * Génère la fiche individuelle PDF avec jsPDF pur (texte natif)
 */
export const generateFicheIndividuellePDF = (data) => {
  const { nom, monthLabel, jours, bilan, primes, selectedMonth } = data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, margin = 10;
  let y = margin;

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DALLELEC Sàrl', W / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fiche mensuelle - ${monthLabel}`, W / 2, y, { align: 'center' });
  y += 4;
  doc.setDrawColor(0);
  doc.line(margin, y, W - margin, y);
  y += 6;

  // Nom employé
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${nom}`, margin, y);
  y += 6;

  // Tableau jours
  const colWidths = [22, 14, 28, 65, 18];
  const headers = ['Jour', 'Date', 'Statut', 'Chantier', 'Heures'];
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 3, W - margin * 2, 4.5, 'F');
  let x = margin;
  headers.forEach((h, i) => { doc.text(h, x + 1, y); x += colWidths[i]; });
  y += 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  jours.forEach(j => {
    if (y > 265) { doc.addPage(); y = margin; }
    x = margin;
    if (j.isWeekend) doc.setTextColor(150, 150, 150);
    else if (j.isAbsence) doc.setTextColor(180, 120, 0);
    else doc.setTextColor(0, 0, 0);

    doc.text(j.jour, x + 1, y); x += colWidths[0];
    doc.text(j.date, x + 1, y); x += colWidths[1];
    doc.text(j.statut, x + 1, y); x += colWidths[2];
    doc.text(j.chantier, x + 1, y); x += colWidths[3];
    doc.text(j.heures, x + colWidths[4] - 2, y, { align: 'right' });
    y += 3.5;
  });

  doc.setTextColor(0, 0, 0);
  y += 4;

  // Check si on a assez de place pour les box, sinon nouvelle page
  if (y > 220) { doc.addPage(); y = margin; }

  // Box Bilan Heures + Vacances côte à côte
  const boxW = (W - margin * 2 - 6) / 2;
  const boxX1 = margin;
  const boxX2 = margin + boxW + 6;
  const boxY = y;

  // Box Heures
  doc.setDrawColor(50);
  doc.setLineWidth(0.4);
  doc.rect(boxX1, boxY, boxW, 52);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Bilan Heures', boxX1 + 3, boxY + 5);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  let by = boxY + 10;
  const hLines = [
    ['Heures prévues', `${bilan.heuresPrevues}h`],
    ['Heures travaillées', `${bilan.heuresTravaillees}h`],
    ['Jours travaillés (paniers)', `${bilan.joursTravailles} j`],
    ...(bilan.heuresNuit50 && parseFloat(bilan.heuresNuit50) > 0 ? [['Heures nuit +50%', `${bilan.heuresNuit50}h`]] : []),
    ...(bilan.heuresNuit100 && parseFloat(bilan.heuresNuit100) > 0 ? [['Heures nuit +100%', `${bilan.heuresNuit100}h`]] : []),
    ['Jours fériés payés', `${bilan.joursFeries}h`],
    ['Autres absences payées', `${bilan.absPayees}h`],
    ['Absences non payées', `${bilan.absNonPayees}h`],
    ['Solde précédent', `${bilan.soldePrecedent}h`],
    ['Delta mois', `${bilan.delta >= 0 ? '+' : ''}${bilan.delta}h`]
  ];
  hLines.forEach(([label, val]) => {
    doc.text(label, boxX1 + 3, by);
    doc.setFont('helvetica', 'bold');
    doc.text(val, boxX1 + boxW - 3, by, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    by += 4.2;
  });
  doc.line(boxX1 + 3, by - 1, boxX1 + boxW - 3, by - 1);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  if (bilan.soldeHeures >= 0) doc.setTextColor(0, 128, 0);
  else doc.setTextColor(200, 0, 0);
  doc.text(`Solde heures: ${bilan.soldeHeures}h`, boxX1 + 3, by + 3);
  doc.setTextColor(0, 0, 0);

  // Box Vacances
  doc.setDrawColor(50);
  doc.rect(boxX2, boxY, boxW, 52);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Bilan Vacances', boxX2 + 3, boxY + 5);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  by = boxY + 10;
  const vLines = [
    ['Solde précédent', `${bilan.vacSoldPrec}h`],
    ['Acquises ce mois', `+${bilan.vacAcquises}h`],
    ['Prises ce mois', `-${bilan.vacPrises}h`]
  ];
  vLines.forEach(([label, val]) => {
    doc.text(label, boxX2 + 3, by);
    doc.setFont('helvetica', 'bold');
    doc.text(val, boxX2 + boxW - 3, by, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    by += 4.2;
  });
  doc.line(boxX2 + 3, by - 1, boxX2 + boxW - 3, by - 1);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Nouveau solde: ${bilan.vacNouveau}h`, boxX2 + 3, by + 3);

  y = boxY + 56;

  // Section BONUS
  if (primes && primes.length > 0) {
    if (y > 250) { doc.addPage(); y = margin; }
    doc.setDrawColor(200, 150, 0);
    doc.setLineWidth(0.5);
    const bonusH = 12 + primes.length * 5 + 8;
    doc.rect(margin, y, W - margin * 2, bonusH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(130, 90, 0);
    doc.text('BONUS', margin + 3, y + 5);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7.5);

    let py = y + 10;
    // Header
    doc.setFont('helvetica', 'bold');
    doc.text('Chantier', margin + 3, py);
    doc.text('Prime Efficacité', margin + 80, py);
    doc.text('Prime Régies', margin + 115, py);
    doc.text('Total', margin + 150, py);
    py += 4;
    doc.setFont('helvetica', 'normal');

    let totalBonus = 0;
    primes.forEach(p => {
      doc.text(p.chantierNom, margin + 3, py);
      doc.text(`${p.eff.toFixed(2)} CHF`, margin + 80, py);
      doc.text(`${p.reg.toFixed(2)} CHF`, margin + 115, py);
      doc.setFont('helvetica', 'bold');
      doc.text(`${p.total.toFixed(2)} CHF`, margin + 150, py);
      doc.setFont('helvetica', 'normal');
      totalBonus += p.total;
      py += 5;
    });
    doc.line(margin + 3, py - 2, W - margin - 3, py - 2);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', margin + 3, py + 1);
    doc.text(`${totalBonus.toFixed(2)} CHF`, margin + 150, py + 1);
    y = py + 6;
  }

  // Footer
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} - DALLELEC Sàrl`, W / 2, 290, { align: 'center' });

  doc.save(`fiche-${nom.replace(/\s+/g, '-')}-${selectedMonth}.pdf`);
};

/**
 * Génère le PDF global (récapitulatif) avec jsPDF pur
 */
export const generateGlobalPDF = (data) => {
  const { bilans, monthLabel, selectedMonth, getEmployeName, getTotalBonusMois } = data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, margin = 10;
  const boxW = (W - margin * 2 - 6) / 2;

  let pageCount = 0;
  for (let i = 0; i < bilans.length; i++) {
    const b = bilans[i];
    const nom = getEmployeName(b.employee_email);
    const bonus = getTotalBonusMois(b.employee_email);

    // 4 employés par page
    if (i % 4 === 0) {
      if (pageCount > 0) doc.addPage();
      pageCount++;
      // Header
      let y = margin;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('DALLELEC Sàrl - Rapport Mensuel', W / 2, y, { align: 'center' });
      y += 4;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(`${monthLabel} — Document pour le commercialiste`, W / 2, y, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      doc.line(margin, y + 2, W - margin, y + 2);
    }

    const slotIndex = i % 4;
    let y = margin + 12 + slotIndex * 67;

    // Nom employé
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, W - margin * 2, 5, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(nom, margin + 2, y + 3.5);
    y += 7;

    const boxX1 = margin;
    const boxX2 = margin + boxW + 6;

    // Box Heures (compact)
    doc.setDrawColor(50);
    doc.setLineWidth(0.3);
    doc.rect(boxX1, y, boxW, 40);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Bilan Heures', boxX1 + 2, y + 4);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    let by = y + 8;
    const hData = [
      ['H. prévues', `${b.heures_prevues.toFixed(2)}h`],
      ['H. travaillées', `${b.heures_travaillees.toFixed(2)}h`],
      ['Jours (paniers)', `${b.jours_travailles || 0} j`],
      ['J. fériés', `${(b.heures_jours_feries || 0).toFixed(2)}h`],
      ['Abs. payées', `${((b.heures_absences_payees || 0) - (b.heures_jours_feries || 0)).toFixed(2)}h`],
      ['Solde préc.', `${b.solde_precedent.toFixed(2)}h`],
      ['Delta', `${b.delta_mois >= 0 ? '+' : ''}${b.delta_mois.toFixed(2)}h`]
    ];
    hData.forEach(([l, v]) => {
      doc.text(l, boxX1 + 2, by);
      doc.setFont('helvetica', 'bold');
      doc.text(v, boxX1 + boxW - 2, by, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      by += 3.8;
    });
    doc.line(boxX1 + 2, by - 1, boxX1 + boxW - 2, by - 1);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    if (b.solde_final >= 0) doc.setTextColor(0, 128, 0);
    else doc.setTextColor(200, 0, 0);
    doc.text(`Solde: ${b.solde_final.toFixed(2)}h`, boxX1 + 2, by + 2.5);
    doc.setTextColor(0, 0, 0);

    // Box Vacances (compact)
    doc.setDrawColor(50);
    doc.rect(boxX2, y, boxW, 40);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Bilan Vacances', boxX2 + 2, y + 4);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    by = y + 8;
    const vData = [
      ['Solde préc.', `${(b.vac_solde_prec || 0).toFixed(2)}h`],
      ['Acquises', `+${(b.vac_acquises || 0).toFixed(2)}h`],
      ['Prises', `-${(b.vac_prises || 0).toFixed(2)}h`]
    ];
    vData.forEach(([l, v]) => {
      doc.text(l, boxX2 + 2, by);
      doc.setFont('helvetica', 'bold');
      doc.text(v, boxX2 + boxW - 2, by, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      by += 3.8;
    });
    doc.line(boxX2 + 2, by - 1, boxX2 + boxW - 2, by - 1);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`Solde: ${(b.vac_nouveau_solde || 0).toFixed(2)}h`, boxX2 + 2, by + 2.5);

    // Bonus line
    if (bonus > 0) {
      const bonusY = y + 42;
      doc.setFillColor(212, 237, 218);
      doc.rect(margin, bonusY, W - margin * 2, 5, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 100, 30);
      doc.text(`Bonus: ${bonus.toFixed(2)} CHF`, margin + 2, bonusY + 3.5);
      doc.setTextColor(0, 0, 0);
    }
  }

  // Footer sur chaque page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} — DALLELEC Sàrl`, W / 2, 290, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }

  doc.save(`rapport-mensuel-${selectedMonth}.pdf`);
};
