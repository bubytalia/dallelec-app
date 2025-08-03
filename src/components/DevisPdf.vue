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

<script>
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import logo from '@/assets/logo.jpg'
import supplementsImage from '@/assets/supplements_page1.png'

export default {
  name: 'DevisPdf',
  props: {
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
  },
  computed: {
    /**
     * Calcola il totale complessivo del devis sommando i totali di tutte
     * le zone. Ogni prodotto deve avere la proprietà `total` numerica.
     * @returns {number}
     */
    devisTotal () {
      return (this.devisParZone || []).reduce((sumZones, zone) => {
        if (Array.isArray(zone.produits)) {
          const sumZone = zone.produits.reduce((acc, p) => acc + (p.total || 0), 0)
          return sumZones + sumZone
        }
        return sumZones
      }, 0)
    }
  },
  methods: {
    /**
     * Crea il PDF del devis. Il documento segue il layout definito nella
     * bozza fornita: quattro pagine (o più, se le tabelle sono lunghe) con
     * intestazione, dettagli del devis, supplementi e condizioni.
     */
    async generatePdf () {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })

      /**
       * Disegna l'intestazione con logo e dati aziendali. Deve essere
       * richiamata all'inizio di ogni pagina.
       * @param {number} pageNum Numero della pagina corrente
       * @param {number} totPages Numero totale di pagine previsto
       */
      const drawHeader = (pageNum, totPages) => {
        // Logo: manteniamo le proporzioni riducendo l'altezza a 20 mm
        // Usiamo dimensioni più equilibrate per evitare distorsioni del logo.
        // Manteniamo un'altezza fissa (18 mm) e calcoliamo la larghezza in base
        // al rapporto originale dell'immagine. Se conosci il rapporto preciso,
        // sostituisci 4:1 con quello reale (larghezza:altezza). Qui assumiamo
        // circa 2.5:1 per evitare schiacciamenti.
        // Dimensioni del logo: manteniamo l'aspect ratio originale (~5.32:1)
        // scegliendo una larghezza più ampia e un'altezza ridotta.
        const logoW = 55
        const logoH = logoW / 5.32
        doc.addImage(logo, 'JPEG', 10, 10, logoW, logoH)
        // Dati aziendali allineati a destra
        doc.setFontSize(8)
        // Assicuriamo che il testo dei dati aziendali non venga mai in
        // grassetto forzando il font normale prima di scrivere ogni riga.
        doc.setFont('helvetica', 'normal')
        const companyInfo = [
          'DALLELEC Sarl',
          'Rue de Bourgogne 25',
          '1203 Genève',
          'contact@dallelec.ch'
        ]
        let y = 12
        // Impostiamo un colore testo più chiaro per l'intestazione (grigio)
        const prevColor = doc.getTextColor()
        doc.setTextColor(80)
        companyInfo.forEach((line) => {
          // Usiamo un font regolare per evitare il grassetto
          doc.setFont('helvetica', 'normal')
          doc.text(line, 200, y, { align: 'right' })
          y += 4
        })
        // Ripristiniamo il colore del testo a nero per i contenuti successivi
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

      // Calcoliamo in anticipo il numero totale di pagine. Nel nostro layout
      // base sono previste 4 pagine: se tuttavia le tabelle sono molto lunghe
      // autoTable creerà automaticamente nuove pagine; aggiorneremo il
      // contatore alla fine.
      let currentPage = 1
      const plannedPages = 4

      /* Pagina 1: intestazione generale */
      drawHeader(currentPage, plannedPages)
      doc.setFontSize(20)
      doc.setFont('Helvetica', 'bold')
      doc.text(`DEVIS N. ${this.numeroDevis}`, 10, 40)
      doc.setFontSize(11)
      doc.setFont('Helvetica', 'normal')
      doc.text(`Client: ${this.nomClient}`, 10, 55)
      doc.text(`Chantier: ${this.nomChantier}`, 10, 63)
      doc.text(`Date: ${this.dateDevis}`, 10, 71)
      drawFooter(currentPage, plannedPages)

      /* Pagina 2: tipo di posa e lista supplementi */
      doc.addPage()
      currentPage++
      drawHeader(currentPage, plannedPages)
      // Titolo "Type de pose"
      doc.setFontSize(12)
      doc.setFont('Helvetica', 'bold')
      // Spostiamo la sezione più in basso per dare maggiore equilibrio alla pagina
      doc.text('Type de pose', 10, 50)
      // Scriviamo le famiglie visibili come elenco con descrizioni. Usiamo
      // caratteri più piccoli e separiamo maggiormente gli elementi per
      // migliorare la leggibilità.
      doc.setFontSize(9)
      doc.setFont('Helvetica', 'normal')
      let yPos = 56
      if (Array.isArray(this.famillesVisibles) && this.famillesVisibles.length > 0) {
        this.famillesVisibles.forEach((fam) => {
          doc.text(`- ${fam}`, 12, yPos)
          yPos += 4.5
        })
        // Spazio extra prima del titolo successivo
        yPos += 12
      } else {
        // Se non ci sono famiglie visibili, posizioniamo il prossimo titolo a una
        // distanza predefinita più in basso
        yPos = 60
      }
      // Titolo per la lista dei supplementi
      doc.setFontSize(12)
      doc.setFont('Helvetica', 'bold')
      doc.text('Liste suppléments', 10, yPos)
      // Immagine dei supplementi: ridimensioniamo l'immagine mantenendo
      // l'aspect ratio originale (≈0,707) ma invertendo le proporzioni per
      // rendere l'insieme più orizzontale. Scegliamo una larghezza ampia e
      // calcoliamo l'altezza corrispondente.
      const imgWidthSupp = 140
      const imgHeightSupp = imgWidthSupp / 1.4142 // perché vogliamo un quadro più largo
      doc.addImage(supplementsImage, 'PNG', 10, yPos + 5, imgWidthSupp, imgHeightSupp)
      drawFooter(currentPage, plannedPages)

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
      ;(this.devisParZone || []).forEach((zone, zIndex) => {
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
          'Quantité ML',
          'Total Suppl. (ML)',
          'Total ML',
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
            4: { cellWidth: 20 }, // Quantité ML
            5: { cellWidth: 20 }, // Total Suppl. (ML)
            6: { cellWidth: 18 }, // Total ML
            7: { cellWidth: 20 }, // Prix U.
            8: { cellWidth: 20 } // Total
          },
          didDrawPage: (data) => {
            // Ridisegna intestazione e piè di pagina per le pagine che autoTable
            // crea automaticamente quando la tabella supera i limiti della
            // pagina.
            drawHeader(doc.internal.getCurrentPageInfo().pageNumber, plannedPages)
            drawFooter(doc.internal.getCurrentPageInfo().pageNumber, plannedPages)
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

      // Inseriamo il totale del devis subito dopo il dettaglio per zone, prima
      // del riepilogo dei supplementi. Questo posiziona il totale nella
      // stessa area in cui appare nella bozza ricevuta.
      doc.setFontSize(10)
      doc.setFont('Helvetica', 'bold')
      doc.text(`Total Devis: ${this.devisTotal.toFixed(2)} €`, 170, tableStartY + 4, { align: 'right' })
      // Aggiorniamo la y di partenza per lasciare spazio sotto al totale
      tableStartY += 15
      // Ora aggiungiamo la sezione "Détail des Suppléments par Zone" se esistono dati
      if (Array.isArray(this.supplementParZone) && this.supplementParZone.length) {
        doc.setFontSize(14)
        doc.setFont('Helvetica', 'bold')
        doc.text('Détail des Suppléments par Zone', 10, tableStartY)
        tableStartY += 4
        ;(this.supplementParZone || []).forEach((suppZone, idx) => {
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
            'Total ML'
          ]]
          const body = []
          if (Array.isArray(suppZone.supplements)) {
            suppZone.supplements.forEach((s) => {
              body.push([
                s.article || '',
                s.nom || '',
                s.taille || '',
                s.supplement || '',
                s.qte != null ? String(s.qte) : '',
                s.valeur != null ? s.valeur.toFixed(2) : '',
                s.totalML != null ? s.totalML.toFixed(2) : ''
              ])
            })
          }
          autoTable(doc, {
            head: head,
            body: body,
            startY: tableStartY + 4,
            theme: 'grid',
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
              drawFooter(doc.internal.getCurrentPageInfo().pageNumber, plannedPages)
            }
          })
          // Totale per la zona supplementi
          let suppSubtotal = 0
          if (Array.isArray(suppZone.supplements)) {
            suppSubtotal = suppZone.supplements.reduce((acc, s) => acc + (s.totalML || 0), 0)
          }
          const finalY2 = doc.lastAutoTable.finalY || (tableStartY + 10)
          doc.setFontSize(9)
          doc.setFont('Helvetica', 'bold')
          doc.text(`Total Suppléments (${suppZoneName}): ${suppSubtotal.toFixed(2)} ML`, 170, finalY2 + 4, { align: 'right' })
          tableStartY = finalY2 + 10
        })
      }
      drawFooter(currentPage, plannedPages)

      /* Pagina 4: condizioni, note e firma */
      doc.addPage()
      currentPage++
      drawHeader(currentPage, plannedPages)
      // Modalité de paiement
      // Impostiamo caratteri più grandi per titoli e testo nella pagina finale
      doc.setFontSize(12)
      doc.setFont('Helvetica', 'bold')
      // Posizioniamo il titolo della modalità di pagamento leggermente più in basso
      doc.text('Modalité de paiement', 10, 50)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const paiementText = this.selectedPaiement && this.selectedPaiement.nom
        ? this.selectedPaiement.nom
        : ''
      if (paiementText) {
        doc.text(paiementText, 10, 52)
      }
      // "Le devis comprend"
      // Iniziamo la sezione delle condizioni più in basso per evitare sovrapposizioni
      let yCond = 78
      doc.setFontSize(12)
      doc.setFont('Helvetica', 'bold')
      doc.text('Le devis comprend', 10, yCond)
      yCond += 6
      doc.setFontSize(10)
      doc.setFont('Helvetica', 'normal')
      if (this.conditionsComprend && this.conditionsComprend.length) {
        this.conditionsComprend.forEach((c) => {
          doc.text('- ' + (c.texte || c), 12, yCond)
          yCond += 5
        })
      } else {
        doc.text('-', 12, yCond)
        yCond += 5
      }
      // "Le devis ne comprend pas"
      if (yCond < 80) yCond = 80
      doc.setFontSize(12)
      doc.setFont('Helvetica', 'bold')
      doc.text('Le devis ne comprend pas', 10, yCond)
      yCond += 6
      doc.setFontSize(10)
      doc.setFont('Helvetica', 'normal')
      if (this.conditionsNeComprendPas && this.conditionsNeComprendPas.length) {
        this.conditionsNeComprendPas.forEach((c) => {
          doc.text('- ' + (c.texte || c), 12, yCond)
          yCond += 5
        })
      } else {
        doc.text('-', 12, yCond)
        yCond += 5
      }
      // Note
      if (this.notes && this.notes.trim().length > 0) {
        if (yCond < 120) yCond = 120
        doc.setFontSize(12)
        doc.setFont('Helvetica', 'bold')
        doc.text('Annotations/Remarques', 10, yCond)
        yCond += 6
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        // Suddividiamo il testo delle note in righe corte per evitare overflow
        const notesLines = doc.splitTextToSize(this.notes, 180)
        doc.text(notesLines, 12, yCond)
        yCond += notesLines.length * 5 + 5
      }
      // Spazio per firma
      if (yCond < 200) yCond = 200
      doc.setFontSize(11)
      doc.setFont('Helvetica', 'bold')
      doc.text('Bon pour l\'accord', 10, yCond)
      yCond += 9
      doc.setFontSize(9)
      doc.setFont('Helvetica', 'normal')
      doc.text('Date :', 10, yCond)
      doc.text('Le Client', 150, yCond)
      drawFooter(currentPage, plannedPages)

      // Aggiorna il numero totale di pagine se autoTable ha creato pagine aggiuntive
      const finalTotalPages = doc.internal.getNumberOfPages()
      // Aggiorna le numerazioni: iteriamo su ciascuna pagina e riscriviamo il piè di pagina
      for (let i = 1; i <= finalTotalPages; i++) {
        doc.setPage(i)
        drawFooter(i, finalTotalPages)
      }
      // Salva il documento con un nome significativo
      doc.save(`devis-${this.numeroDevis || 'document'}.pdf`)
    }
  }
}
</script>