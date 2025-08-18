<template>
  <!--
    Questo componente non renderizza alcun markup visibile: espone solo
    il metodo `generatePdf()` per generare il documento PDF del preventivo.
    Il layout del PDF viene creato programmaticamente con jsPDF e
    jspdf‑autotable. Le informazioni vengono passate come proprietà al
    componente.
  -->
  <div style="display: none;"></div>
</template>

<script setup>
import { computed } from 'vue';
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import logo from '@/assets/logo.jpg'
import supplementsImage from '@/assets/supplements_page1.png'

// Props
const props = defineProps({
  devisParZone: { type: Array, default: () => [] },
  supplementParZone: { type: Array, default: () => [] },
  nomClient: { type: String, default: '' },
  nomChantier: { type: String, default: '' },
  numeroDevis: { type: String, default: '' },
  dateDevis: { type: String, default: '' },
  // Famiglie e sottofamiglie da visualizzare nella sezione "Type de pose";
  // devono essere solo stringhe descrittive, senza percentuali di sconto.
  famillesVisibles: { type: Array, default: () => [] },
  // Modalità di pagamento selezionata
  selectedPaiement: { type: Object, default: null },
  // Condizioni comprese nel devis
  conditionsComprend: { type: Array, default: () => [] },
  // Condizioni non comprese nel devis
  conditionsNeComprendPas: { type: Array, default: () => [] },
  // Eventuali note inserite dall'utente
  notes: { type: String, default: '' }
});

// Computed
const devisTotal = computed(() => {
  return (props.devisParZone || []).reduce((sumZones, zone) => {
    if (Array.isArray(zone.produits)) {
      const sumZone = zone.produits.reduce((acc, p) => acc + (p.total || 0), 0)
      return sumZones + sumZone
    }
    return sumZones
  }, 0)
});

// Methods
const generatePdf = async () => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  /**
   * Disegna l'intestazione con logo e dati aziendali. Deve essere
   * richiamata all'inizio di ogni pagina.
   * @param {number} pageNum Numero della pagina corrente
   * @param {number} totPages Numero totale di pagine previsto
   */
  const drawHeader = (pageNum, totPages) => {
    // Logo: manteniamo le proporzioni riducendo l'altezza a 20 mm
    const logoW = 55
    const logoH = logoW / 5.32
    doc.addImage(logo, 'JPEG', 10, 10, logoW, logoH)
    // Dati aziendali allineati a destra
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    const companyInfo = [
      'DALLELEC Sarl',
      'Rue de Bourgogne 25',
      '1203 Genève',
      'contact@dallelec.ch'
    ]
    let y = 12
    const prevColor = doc.getTextColor()
    doc.setTextColor(80)
    companyInfo.forEach((line) => {
      doc.setFont('helvetica', 'normal')
      doc.text(line, 200, y, { align: 'right' })
      y += 4
    })
    doc.setTextColor(prevColor)
  }

  /**
   * Disegna il piè di pagina con la numerazione pagina/numero totale.
   * @param {number} pageNum Numero della pagina corrente
   * @param {number} totPages Numero totale di pagine previsto
   */
  const drawFooter = (pageNum, totPages) => {
    doc.setFontSize(8)
    doc.text(`Pag. ${pageNum}/${totPages}`, 105, 292, { align: 'center' })
  }

  // Calcoliamo in anticipo il numero totale di pagine
  let currentPage = 1
  const plannedPages = 4

  /* Pagina 1: intestazione generale */
  drawHeader(currentPage, plannedPages)
  doc.setFontSize(20)
  doc.setFont('Helvetica', 'bold')
  doc.text(`DEVIS N. ${props.numeroDevis}`, 10, 40)
  doc.setFontSize(11)
  doc.setFont('Helvetica', 'normal')
  doc.text(`Client: ${props.nomClient}`, 10, 55)
  doc.text(`Chantier: ${props.nomChantier}`, 10, 63)
  doc.text(`Date: ${props.dateDevis}`, 10, 71)
  // drawFooter(currentPage, plannedPages) - Rimosso per evitare duplicazione

  /* Pagina 2: tipo di posa e lista supplementi */
  doc.addPage()
  currentPage++
  drawHeader(currentPage, plannedPages)
  // Titolo "Type de pose"
  doc.setFontSize(14)
  doc.setFont('Helvetica', 'bold')
  doc.text('Type de pose', 10, 50)
  // Scriviamo le famiglie visibili come elenco con descrizioni
  doc.setFontSize(10)
  doc.setFont('Helvetica', 'normal')
  let yPos = 56
  if (Array.isArray(props.famillesVisibles) && props.famillesVisibles.length > 0) {
    props.famillesVisibles.forEach((fam) => {
      doc.text(`- ${fam}`, 12, yPos)
      yPos += 5
    })
    yPos += 15
  } else {
    // Se non ci sono famiglie, aggiungiamo un testo di default
    doc.text('- Installation de chemins de câbles', 12, yPos)
    yPos += 5
    doc.text('- Pose standard selon normes en vigueur', 12, yPos)
    yPos += 15
  }
  // Titolo per la lista dei supplementi
  doc.setFontSize(14)
  doc.setFont('Helvetica', 'bold')
  doc.text('Liste suppléments', 10, yPos)
  yPos += 12
  // Aggiungiamo l'immagine dei supplementi
  const imgWidthSupp = 140
  const imgHeightSupp = imgWidthSupp / 1.4142
  doc.addImage(supplementsImage, 'PNG', 10, yPos + 5, imgWidthSupp, imgHeightSupp)
  // drawFooter(currentPage, plannedPages) - Rimosso per evitare duplicazione

  /* Pagina 3: dettagli del devis e supplementi per zona */
  doc.addPage()
  currentPage++
  drawHeader(currentPage, plannedPages)
  // Titolo per la sezione dettaglio
  doc.setFontSize(16)
  doc.setFont('Helvetica', 'bold')
  doc.text('Détail du Devis', 10, 40)

  // Coordina la posizione iniziale della prima tabella
  let tableStartY = 45
  // Per ogni zona, costruiamo la tabella dei prodotti
  ;(props.devisParZone || []).forEach((zone, zIndex) => {
    const zoneName = zone.nom || `Zone ${zIndex + 1}`
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(zoneName, 10, tableStartY)
    // Testata e corpo della tabella
    const head = [[
      'Code',
      'Produit',
      'Taille',
      'Unité',
      'Quantité',
      'Total Suppl.',
      'Total',
      'Prix U.',
      'Total'
    ]]
    const body = []
    if (Array.isArray(zone.produits)) {
      zone.produits.forEach((p) => {
        body.push([
          p.article || '',
          p.nom || '',
          p.taille || '',
          p.unite || '',
          p.ml != null ? String(p.ml) : '',
          p.totalSuppML != null ? p.totalSuppML.toFixed(2) : '',
          p.totalML != null ? p.totalML.toFixed(2) : '',
          p.prix != null ? p.prix.toFixed(2) + '€' : '',
          p.total != null ? p.total.toFixed(2) + '€' : ''
        ])
      })
    }
    autoTable(doc, {
      head: head,
      body: body,
      startY: tableStartY + 4,
      theme: 'grid',
      margin: { top: 35 }, // Aggiungiamo margine superiore per evitare sovrapposizione con logo
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: 20,
        halign: 'center',
        valign: 'middle',
        fontSize: 8
      },
      bodyStyles: {
        textColor: 20,
        fontSize: 8,
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 20 }, // Code
        1: { cellWidth: 35 }, // Produit
        2: { cellWidth: 15 }, // Taille
        3: { cellWidth: 15 }, // Unité
        4: { cellWidth: 20 }, // Quantité
        5: { cellWidth: 20 }, // Total Suppl.
        6: { cellWidth: 18 }, // Total
        7: { cellWidth: 20 }, // Prix U.
        8: { cellWidth: 20 } // Total
      },
      didDrawPage: (data) => {
        drawHeader(doc.internal.getCurrentPageInfo().pageNumber, plannedPages)
        // drawFooter(doc.internal.getCurrentPageInfo().pageNumber, plannedPages) - Rimosso per evitare duplicazione
      }
    })
    // Calcola il sotto-totale della zona
    let zoneSubtotal = 0
    if (Array.isArray(zone.produits)) {
      zoneSubtotal = zone.produits.reduce((acc, p) => acc + (p.total || 0), 0)
    }
    // Posizione del sotto‑totale sotto la tabella
    const finalY = doc.lastAutoTable.finalY || tableStartY + 10
    doc.setFontSize(9)
    doc.setFont('Helvetica', 'bold')
    doc.text(`Sous-total: ${zoneSubtotal.toFixed(2)} €`, 170, finalY + 4, { align: 'right' })
    tableStartY = finalY + 10
  })

  // Inseriamo il totale del devis
  doc.setFontSize(10)
  doc.setFont('Helvetica', 'bold')
  doc.text(`Total Devis: ${devisTotal.value.toFixed(2)} €`, 170, tableStartY + 4, { align: 'right' })
  tableStartY += 15

  // Ora aggiungiamo la sezione "Détail des Suppléments par Zone" se esistono dati
  if (Array.isArray(props.supplementParZone) && props.supplementParZone.length) {
    doc.setFontSize(14)
    doc.setFont('Helvetica', 'bold')
    doc.text('Détail des Suppléments par Zone', 10, tableStartY)
    tableStartY += 4
    ;(props.supplementParZone || []).forEach((suppZone, idx) => {
      const suppZoneName = suppZone.nom || `Zone ${idx + 1}`
      doc.setFontSize(11)
      doc.setFont('Helvetica', 'bold')
      doc.text(suppZoneName, 10, tableStartY)
      const head = [[
        'Code',
        'Produit',
        'Taille',
        'Supplement',
        'Qté',
        'Valeur',
        'Total'
      ]]
      const body = []
      if (Array.isArray(suppZone.supplements)) {
        suppZone.supplements.forEach((s) => {
          // Calcoliamo totalML se non presente
          const totalML = s.totalML || (s.qte && s.valeur ? s.qte * s.valeur : 0);
          body.push([
            s.article || '',
            s.nom || '',
            s.taille || '',
            s.supplement || '',
            s.qte != null ? String(s.qte) : '',
            s.valeur != null ? s.valeur.toFixed(2) : '',
            totalML.toFixed(2)
          ])
        })
      }
      autoTable(doc, {
        head: head,
        body: body,
        startY: tableStartY + 4,
        theme: 'grid',
        margin: { top: 35 }, // Aggiungiamo margine superiore per evitare sovrapposizione con logo
        headStyles: {
          fillColor: [230, 230, 230],
          textColor: 20,
          halign: 'center',
          valign: 'middle',
          fontSize: 8
        },
        bodyStyles: {
          textColor: 20,
          fontSize: 8,
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 35 },
          2: { cellWidth: 15 },
          3: { cellWidth: 35 },
          4: { cellWidth: 10 },
          5: { cellWidth: 15 },
          6: { cellWidth: 15 }
        },
        didDrawPage: (data) => {
          drawHeader(doc.internal.getCurrentPageInfo().pageNumber, plannedPages)
          // drawFooter(doc.internal.getCurrentPageInfo().pageNumber, plannedPages) - Rimosso per evitare duplicazione
        }
      })
      // Totale per la zona supplementi
      let suppSubtotal = 0
      if (Array.isArray(suppZone.supplements)) {
        suppSubtotal = suppZone.supplements.reduce((acc, s) => {
          const totalML = s.totalML || (s.qte && s.valeur ? s.qte * s.valeur : 0);
          return acc + totalML;
        }, 0)
      }
      const finalY2 = doc.lastAutoTable.finalY || (tableStartY + 10)
      doc.setFontSize(9)
      doc.setFont('Helvetica', 'bold')
      doc.text(`Total Suppléments (${suppZoneName}): ${suppSubtotal.toFixed(2)}`, 170, finalY2 + 4, { align: 'right' })
      tableStartY = finalY2 + 10
    })
  }
  // drawFooter(currentPage, plannedPages) - Rimosso per evitare duplicazione

  /* Pagina 4: condizioni, note e firma */
  doc.addPage()
  currentPage++
  drawHeader(currentPage, plannedPages)
  // Modalité de paiement
  doc.setFontSize(12)
  doc.setFont('Helvetica', 'bold')
  doc.text('Modalité de paiement', 10, 50)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const paiementText = props.selectedPaiement && props.selectedPaiement.nom
    ? props.selectedPaiement.nom
    : 'Réception facture'
  doc.text(paiementText, 10, 58)
  
  // "Le devis comprend"
  let yCond = 85
  doc.setFontSize(12)
  doc.setFont('Helvetica', 'bold')
  doc.text('Le devis comprend', 10, yCond)
  yCond += 8
  doc.setFontSize(10)
  doc.setFont('Helvetica', 'normal')
  if (props.conditionsComprend && props.conditionsComprend.length) {
    props.conditionsComprend.forEach((c) => {
      doc.text('- ' + (c.texte || c), 12, yCond)
      yCond += 6
    })
  } else {
    doc.text('- Ponts roulant et nacelles', 12, yCond)
    yCond += 6
  }
  
  // "Le devis ne comprend pas"
  yCond += 8
  doc.setFontSize(12)
  doc.setFont('Helvetica', 'bold')
  doc.text('Le devis ne comprend pas', 10, yCond)
  yCond += 8
  doc.setFontSize(10)
  doc.setFont('Helvetica', 'normal')
  if (props.conditionsNeComprendPas && props.conditionsNeComprendPas.length) {
    props.conditionsNeComprendPas.forEach((c) => {
      doc.text('- ' + (c.texte || c), 12, yCond)
      yCond += 6
    })
  } else {
    doc.text('- Mise à disposition d\'un local pour se changer et garder les outils', 12, yCond)
    yCond += 6
    doc.text('- La mise à la terre et sa continuitée', 12, yCond)
    yCond += 6
    doc.text('- La fourniture de matériel, compris goujon d\'encrage', 12, yCond)
    yCond += 6
    doc.text('- Main d\'oeuvre nécessaire pour déplacement matériels qui empêchent l\'installation', 12, yCond)
    yCond += 6
    doc.text('- La coordination avec la direction des travaux', 12, yCond)
    yCond += 6
    doc.text('- Traitement déchets dehors de chantier', 12, yCond)
    yCond += 6
  }
  
  // Note
  if (props.notes && props.notes.trim().length > 0) {
    yCond += 10
    doc.setFontSize(12)
    doc.setFont('Helvetica', 'bold')
    doc.text('Annotations/Remarques', 10, yCond)
    yCond += 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    // Suddividiamo il testo delle note in righe corte per evitare overflow
    const notesLines = doc.splitTextToSize(props.notes, 180)
    doc.text(notesLines, 12, yCond)
    yCond += notesLines.length * 6 + 10
  }
  
  // Spazio per firma
  if (yCond < 220) yCond = 220
  doc.setFontSize(11)
  doc.setFont('Helvetica', 'bold')
  doc.text('Bon pour l\'accord', 10, yCond)
  yCond += 12
  doc.setFontSize(9)
  doc.setFont('Helvetica', 'normal')
  doc.text('Date :', 10, yCond)
  doc.text('Le Client', 150, yCond)
  // drawFooter(currentPage, plannedPages) - Rimosso per evitare duplicazione

  // Aggiorna il numero totale di pagine se autoTable ha creato pagine aggiuntive
  const finalTotalPages = doc.internal.getNumberOfPages()
  // Disegna i footer su tutte le pagine SOLO UNA VOLTA alla fine
  for (let i = 1; i <= finalTotalPages; i++) {
    doc.setPage(i)
    drawFooter(i, finalTotalPages)
  }
  // Salva il documento con un nome significativo
  doc.save(`devis-${props.numeroDevis || 'document'}.pdf`)
};

// Expose the generatePdf method
defineExpose({
  generatePdf
});
</script>
