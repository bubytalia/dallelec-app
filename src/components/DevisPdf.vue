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
  // Condizioni generali del devis
  conditionsGenerales: { type: Array, default: () => [] },
  // Condizioni comprese nel devis
  conditionsComprend: { type: Array, default: () => [] },
  // Condizioni non comprese nel devis
  conditionsNeComprendPas: { type: Array, default: () => [] },
  // Eventuali note inserite dall'utente
  notes: { type: String, default: '' },
  // Opzione per nascondere la lista supplementi
  hideSupplementsList: { type: Boolean, default: false },
  // Opzione per nascondere i prezzi
  hidePrices: { type: Boolean, default: false },
  // Remise supplémentaire in percentuale
  remiseSupplementaire: { type: Number, default: 0 },
  // Modalità prezzi del devis
  modalitaPrezzi: { type: String, default: 'scontistica' }
});

// Computed
const devisTotal = computed(() => {
  return (props.devisParZone || []).reduce((sumZones, zone) => {
    if (Array.isArray(zone.produits)) {
      const sumZone = zone.produits.reduce((acc, p) => acc + (p.informativo ? 0 : (p.total || 0)), 0)
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
  // Per railEnergie, saltiamo sempre la pagina 2 (Type de pose + supplementi)
  const isRailEnergie = props.modalitaPrezzi === 'railEnergie'
  const plannedPages = (props.hideSupplementsList || isRailEnergie) ? 3 : 4

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

  /* Pagina 2: tipo di posa e lista supplementi (solo se non nascosta e non railEnergie) */
  if (!props.hideSupplementsList && !isRailEnergie) {
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
    // Aggiungiamo l'immagine dei supplementi - larghezza massima tra i margini
    const imgWidthSupp = 190  // Da 10mm a 200mm (margini) = 190mm di larghezza
    const imgHeightSupp = imgWidthSupp / 1.4142
    doc.addImage(supplementsImage, 'PNG', 10, yPos + 5, imgWidthSupp, imgHeightSupp)
    // drawFooter(currentPage, plannedPages) - Rimosso per evitare duplicazione
  }

  /* Pagina 3: dettagli del devis e supplementi per zona */
  doc.addPage()
  currentPage++
  drawHeader(currentPage, plannedPages)
  // Titolo per la sezione dettaglio
  doc.setFontSize(16)
  doc.setFont('Helvetica', 'bold')
  doc.text('Détail du Devis', 10, 40)

  // Coordina la posizione iniziale della prima tabella
  let tableStartY = 50
  // Per ogni zona, costruiamo la tabella dei prodotti
  ;(props.devisParZone || []).forEach((zone, zIndex) => {
    const zoneName = zone.nom || `Zone ${zIndex + 1}`
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(zoneName, 10, tableStartY)
    tableStartY += 6
    // Testata e corpo della tabella (diversa per railEnergie e hidePrices)
    let head
    if (props.hidePrices) {
      // Versione senza prezzi
      head = isRailEnergie ? [[
        'Code',
        'Produit',
        'Taille',
        'Unité',
        'Quantité'
      ]] : [[
        'Code',
        'Produit',
        'Taille',
        'Unité',
        'Quantité',
        'Total Suppl. m.',
        'Total m.'
      ]]
    } else {
      // Versione con prezzi (originale)
      head = isRailEnergie ? [[
        'Code',
        'Produit',
        'Taille',
        'Unité',
        'Quantité',
        'Prix U.',
        'Total'
      ]] : [[
        'Code',
        'Produit',
        'Taille',
        'Unité',
        'Quantité',
        'Total Suppl. m.',
        'Total m.',
        'Prix U.',
        'Total'
      ]]
    }
    const body = []
    if (Array.isArray(zone.produits)) {
      zone.produits.forEach((p) => {
        if (props.hidePrices) {
          // Versione senza prezzi
          if (isRailEnergie) {
            body.push([
              (p.article || '') + (p.informativo ? ' (Info)' : ''),
              p.nom || '',
              p.taille || '',
              p.unite || '',
              p.ml != null ? String(p.ml) : ''
            ])
          } else {
            body.push([
              (p.article || '') + (p.informativo ? ' (Info)' : ''),
              p.nom || '',
              p.taille || '',
              p.unite || '',
              p.ml != null ? String(p.ml) : '',
              p.totalSuppML != null ? p.totalSuppML.toFixed(2) : '',
              p.totalML != null ? p.totalML.toFixed(2) : ''
            ])
          }
        } else {
          // Versione con prezzi (originale)
          if (isRailEnergie) {
            body.push([
              (p.article || '') + (p.informativo ? ' (Info)' : ''),
              p.nom || '',
              p.taille || '',
              p.unite || '',
              p.ml != null ? String(p.ml) : '',
              p.prix != null ? p.prix.toFixed(2) + ' CHF' : '',
              p.informativo ? 'Info' : (p.total != null ? p.total.toFixed(2) + ' CHF' : '')
            ])
          } else {
            body.push([
              (p.article || '') + (p.informativo ? ' (Info)' : ''),
              p.nom || '',
              p.taille || '',
              p.unite || '',
              p.ml != null ? String(p.ml) : '',
              p.totalSuppML != null ? p.totalSuppML.toFixed(2) : '',
              p.totalML != null ? p.totalML.toFixed(2) : '',
              p.prix != null ? p.prix.toFixed(2) + ' CHF' : '',
              p.informativo ? 'Info' : (p.total != null ? p.total.toFixed(2) + ' CHF' : '')
            ])
          }
        }
      })
    }
    autoTable(doc, {
      head: head,
      body: body,
      startY: tableStartY + 2,
      theme: 'plain',
      pageBreak: 'auto',
      rowPageBreak: 'avoid',
      margin: { top: 35 }, // Aggiungiamo margine superiore per evitare sovrapposizione con logo
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: 20,
        halign: 'center',
        valign: 'middle',
        fontSize: 7
      },
      bodyStyles: {
        textColor: 20,
        fontSize: 7,
        valign: 'middle'
      },
      columnStyles: (() => {
        if (props.hidePrices) {
          // Stili per versione senza prezzi
          return isRailEnergie ? {
            0: { cellWidth: 45, halign: 'left' }, // Code - più largo
            1: { cellWidth: 60, halign: 'left' }, // Produit - più largo
            2: { cellWidth: 25, halign: 'center' }, // Taille
            3: { cellWidth: 20, halign: 'center' }, // Unité
            4: { cellWidth: 25, halign: 'center' } // Quantité
          } : {
            0: { cellWidth: 25 }, // Code
            1: { cellWidth: 45 }, // Produit
            2: { cellWidth: 20 }, // Taille
            3: { cellWidth: 20 }, // Unité
            4: { cellWidth: 25 }, // Quantité
            5: { cellWidth: 25 }, // Total Suppl.
            6: { cellWidth: 25 } // Total
          }
        } else {
          // Stili originali con prezzi
          return isRailEnergie ? {
            0: { cellWidth: 35, halign: 'left' }, // Code - ancora più largo per 14 caratteri
            1: { cellWidth: 40, halign: 'left' }, // Produit - ridotto per compensare
            2: { cellWidth: 20, halign: 'center' }, // Taille
            3: { cellWidth: 15, halign: 'center' }, // Unité
            4: { cellWidth: 15, halign: 'center' }, // Quantité
            5: { cellWidth: 25, halign: 'right' }, // Prix U.
            6: { cellWidth: 25, halign: 'right' } // Total
          } : {
            0: { cellWidth: 20 }, // Code
            1: { cellWidth: 35 }, // Produit
            2: { cellWidth: 15 }, // Taille
            3: { cellWidth: 15 }, // Unité
            4: { cellWidth: 20 }, // Quantité
            5: { cellWidth: 20 }, // Total Suppl.
            6: { cellWidth: 18 }, // Total
            7: { cellWidth: 20 }, // Prix U.
            8: { cellWidth: 20 } // Total
          }
        }
      })(),
      didDrawPage: (data) => {
        drawHeader(doc.internal.getCurrentPageInfo().pageNumber, plannedPages)
        // drawFooter(doc.internal.getCurrentPageInfo().pageNumber, plannedPages) - Rimosso per evitare duplicazione
      }
    })
    // Calcola il sotto-totale della zona (escludendo articoli informativi) solo se i prezzi sono visibili
    let finalY = doc.lastAutoTable.finalY || tableStartY + 10
    if (!props.hidePrices) {
      // Controllo spazio per sous-total zona
      if (finalY > 270) {
        doc.addPage()
        currentPage++
        drawHeader(currentPage, plannedPages)
        finalY = 50
      }
      let zoneSubtotal = 0
      if (Array.isArray(zone.produits)) {
        zoneSubtotal = zone.produits.reduce((acc, p) => acc + (p.informativo ? 0 : (p.total || 0)), 0)
      }
      // Posizione del sotto‑totale sotto la tabella
      doc.setFontSize(9)
      doc.setFont('Helvetica', 'bold')
      doc.text(`Sous-total: ${zoneSubtotal.toFixed(2)} CHF`, 170, finalY + 6, { align: 'right' })
      tableStartY = finalY + 15
    } else {
      tableStartY = finalY + 10
    }
  })

  // Sezione totali con remise détaillée (solo se i prezzi sono visibili)
  if (!props.hidePrices) {
    // Controllo spazio: servono almeno 40mm per i totali
    if (tableStartY > 250) {
      doc.addPage()
      currentPage++
      drawHeader(currentPage, plannedPages)
      tableStartY = 50
    }

    const subtotalSansRemise = devisTotal.value
    const remisePct = props.remiseSupplementaire || 0
    const montantRemise = subtotalSansRemise * (remisePct / 100)
    const totalAvecRemise = subtotalSansRemise - montantRemise
    
    doc.setFontSize(9)
    doc.setFont('Helvetica', 'normal')
    doc.text(`Sous-total:`, 80, tableStartY + 6)
    doc.text(`${subtotalSansRemise.toFixed(2)} CHF`, 170, tableStartY + 6, { align: 'right' })
    
    if (remisePct > 0) {
      doc.text(`Remise suppl. (${remisePct}%):`, 80, tableStartY + 12)
      doc.text(`-${montantRemise.toFixed(2)} CHF`, 170, tableStartY + 12, { align: 'right' })
      tableStartY += 6
    }
    
    doc.setFontSize(10)
    doc.setFont('Helvetica', 'bold')
    doc.text(`Total Devis:`, 80, tableStartY + 12)
    doc.text(`${totalAvecRemise.toFixed(2)} CHF`, 170, tableStartY + 12, { align: 'right' })
    tableStartY += 26
  } else {
    // Se i prezzi sono nascosti, aggiungiamo solo un po' di spazio
    tableStartY += 15
  }

  // Ora aggiungiamo la sezione "Détail des Suppléments par Zone" se esistono dati (non per railEnergie)
  if (!isRailEnergie && Array.isArray(props.supplementParZone) && props.supplementParZone.length) {
    // Controllo spazio per sezione supplementi - se meno di 100mm, nuova pagina
    if (tableStartY > 200) {
      doc.addPage()
      currentPage++
      drawHeader(currentPage, plannedPages)
      tableStartY = 50
    }
    
    doc.setFontSize(14)
    doc.setFont('Helvetica', 'bold')
    doc.text('Détail des Suppléments par Zone', 10, tableStartY)
    tableStartY += 8
    ;(props.supplementParZone || []).forEach((suppZone, idx) => {
      // Controllo spazio per zona - se meno di 80mm, nuova pagina
      if (tableStartY > 220) {
        doc.addPage()
        currentPage++
        drawHeader(currentPage, plannedPages)
        tableStartY = 50
      }
      
      const suppZoneName = suppZone.nom || `Zone ${idx + 1}`
      doc.setFontSize(11)
      doc.setFont('Helvetica', 'bold')
      doc.text(suppZoneName, 10, tableStartY)
      tableStartY += 6
      
      // Raggruppiamo i supplementi per prodotto+taglia
      const groupedSupplements = {}
      if (Array.isArray(suppZone.supplements)) {
        suppZone.supplements.forEach((s) => {
          const key = `${s.article || ''}-${s.nom || ''}-${s.taille || ''}`
          if (!groupedSupplements[key]) {
            groupedSupplements[key] = {
              article: s.article || '',
              nom: s.nom || '',
              taille: s.taille || '',
              supplements: [],
              total: 0
            }
          }
          groupedSupplements[key].supplements.push(s)
          const totalML = s.totalML || (s.qte && s.valeur ? s.qte * s.valeur : 0)
          groupedSupplements[key].total += totalML
        })
      }
      
      // Per ogni gruppo prodotto+taglia, creiamo una sezione
      Object.values(groupedSupplements).forEach((group) => {
        // Controllo spazio pagina - se meno di 60mm dal fondo, nuova pagina
        if (tableStartY > 240) {
          doc.addPage()
          currentPage++
          drawHeader(currentPage, plannedPages)
          tableStartY = 50
        }
        
        doc.setFontSize(10)
        doc.setFont('Helvetica', 'normal')
        doc.text(`${group.article} - ${group.nom} ${group.taille}`, 10, tableStartY + 2)
        
        const head = [[
          'Supplement',
          'Qté',
          'Valeur',
          'Total m.'
        ]]
        const body = []
        group.supplements.forEach((s) => {
          const totalML = s.totalML || (s.qte && s.valeur ? s.qte * s.valeur : 0)
          body.push([
            s.supplement || '',
            s.qte != null ? String(s.qte) : '',
            s.valeur != null ? s.valeur.toFixed(2) : '',
            totalML.toFixed(2)
          ])
        })
        
        autoTable(doc, {
          head: head,
          body: body,
          startY: tableStartY + 6,
          theme: 'plain',
          pageBreak: 'auto',
          rowPageBreak: 'avoid',
          margin: { top: 35 },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: 20,
            halign: 'center',
            valign: 'middle',
            fontSize: 8
          },
          bodyStyles: {
            textColor: 20,
            fontSize: 8,
            valign: 'middle',
            halign: 'center'
          },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 20 },
            2: { cellWidth: 25 },
            3: { cellWidth: 25 }
          },
          didDrawPage: (data) => {
            drawHeader(doc.internal.getCurrentPageInfo().pageNumber, plannedPages)
          }
        })
        
        // Totale per questo prodotto+taglia
        const finalY3 = doc.lastAutoTable.finalY || (tableStartY + 15)
        doc.setFontSize(8)
        doc.setFont('Helvetica', 'bold')
        doc.text(`Total Suppléments: ${group.total.toFixed(2)} m.`, 105, finalY3 + 4, { align: 'center' })
        tableStartY = finalY3 + 10
      })
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
  
  const paiementText = props.selectedPaiement?.nom || 'Paiement à réception facture'
  doc.text(paiementText, 10, 58)
  
  // "Conditions générales" - NUOVA SEZIONE SOPRA LE ALTRE
  let yCond = 75
  if (props.conditionsGenerales && props.conditionsGenerales.length) {
    doc.setFontSize(12)
    doc.setFont('Helvetica', 'bold')
    doc.text('Conditions générales', 10, yCond)
    yCond += 8
    doc.setFontSize(10)
    doc.setFont('Helvetica', 'normal')
    props.conditionsGenerales.forEach((c) => {
      const text = c.nom || c.description || c.texte || c
      const lines = doc.splitTextToSize('- ' + text, 180)
      doc.text(lines, 12, yCond)
      yCond += lines.length * 6
    })
    yCond += 8
  }
  
  // "Le devis comprend"
  doc.setFontSize(12)
  doc.setFont('Helvetica', 'bold')
  doc.text('Le devis comprend', 10, yCond)
  yCond += 8
  doc.setFontSize(10)
  doc.setFont('Helvetica', 'normal')
  if (props.conditionsComprend && props.conditionsComprend.length) {
    props.conditionsComprend.forEach((c) => {
      const text = c.nom || c.description || c.texte || c
      const lines = doc.splitTextToSize('- ' + text, 180)
      doc.text(lines, 12, yCond)
      yCond += lines.length * 6
    })
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
      const text = c.nom || c.description || c.texte || c
      const lines = doc.splitTextToSize('- ' + text, 180)
      doc.text(lines, 12, yCond)
      yCond += lines.length * 6
    })
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
  // Salva il documento con nome personalizzato: Cliente_Cantiere_NumeroDevis
  const clientName = props.nomClient.replace(/[^a-zA-Z0-9]/g, '_') || 'Client'
  const chantierName = props.nomChantier.split(' - ')[0].replace(/[^a-zA-Z0-9]/g, '_') || 'Chantier'
  const numeroDevis = props.numeroDevis || 'DEV-000'
  const priceSuffix = props.hidePrices ? '_SANS_PRIX' : ''
  
  doc.save(`${clientName}_${chantierName}_${numeroDevis}${priceSuffix}.pdf`)
};

// Expose the generatePdf method
defineExpose({
  generatePdf
});
</script>
