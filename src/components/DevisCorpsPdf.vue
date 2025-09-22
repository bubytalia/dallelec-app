<template>
  <div style="display: none;"></div>
</template>

<script setup>
import { jsPDF } from 'jspdf'
import logo from '@/assets/logo.jpg'

const props = defineProps({
  nomClient: { type: String, default: '' },
  nomChantier: { type: String, default: '' },
  numeroDevis: { type: String, default: '' },
  dateDevis: { type: String, default: '' },
  descriptionCorps: { type: String, default: '' },
  montantCorps: { type: Number, default: 0 },
  selectedPaiement: { type: Object, default: null },
  conditionsGenerales: { type: Array, default: () => [] },
  conditionsComprend: { type: Array, default: () => [] },
  conditionsNeComprendPas: { type: Array, default: () => [] },
  notes: { type: String, default: '' }
});

const generatePdf = async () => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const drawHeader = (pageNum, totPages) => {
    const logoW = 55
    const logoH = logoW / 5.32
    doc.addImage(logo, 'JPEG', 10, 10, logoW, logoH)
    
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
      doc.text(line, 200, y, { align: 'right' })
      y += 4
    })
    doc.setTextColor(prevColor)
  }

  const drawFooter = (pageNum, totPages) => {
    doc.setFontSize(8)
    doc.text(`Pag. ${pageNum}/${totPages}`, 105, 292, { align: 'center' })
  }

  let currentPage = 1
  const plannedPages = 2

  // PAGE 1: Informations et description
  drawHeader(currentPage, plannedPages)
  
  // Titre
  doc.setFontSize(16)
  doc.setFont('Helvetica', 'bold')
  doc.text(`DEVIS À CORPS N. ${props.numeroDevis}`, 10, 40)

  // Informations client
  doc.setFontSize(10)
  doc.setFont('Helvetica', 'normal')
  doc.text(`Client: ${props.nomClient}`, 10, 55)
  doc.text(`Chantier: ${props.nomChantier}`, 10, 63)
  doc.text(`Date: ${props.dateDevis}`, 10, 71)

  // Description des travaux
  let yPos = 85
  doc.setFontSize(12)
  doc.setFont('Helvetica', 'bold')
  doc.text('Description des travaux', 10, yPos)
  yPos += 8

  doc.setFontSize(9)
  doc.setFont('Helvetica', 'normal')
  const descLines = doc.splitTextToSize(props.descriptionCorps || 'Travaux selon plans fournis', 180)
  doc.text(descLines, 10, yPos)
  yPos += descLines.length * 5 + 15

  // Montant forfaitaire - Tableau professionnel
  doc.setFontSize(12)
  doc.setFont('Helvetica', 'bold')
  doc.text('Montant forfaitaire', 10, yPos)
  yPos += 10

  // Tableau avec bordures comme les autres devis
  const tableY = yPos
  const tableHeight = 15
  
  // Bordures tableau
  doc.setLineWidth(0.5)
  doc.rect(10, tableY, 180, tableHeight)
  doc.line(10, tableY + 7, 190, tableY + 7) // Ligne séparation
  
  // Header tableau
  doc.setFontSize(9)
  doc.setFont('Helvetica', 'bold')
  doc.text('Description', 12, tableY + 5)
  doc.text('Montant HT (CHF)', 150, tableY + 5, { align: 'right' })
  
  // Contenu tableau
  doc.setFont('Helvetica', 'normal')
  doc.text('Forfait selon description ci-dessus', 12, tableY + 12)
  doc.setFont('Helvetica', 'bold')
  doc.text(`${props.montantCorps.toFixed(2)}`, 150, tableY + 12, { align: 'right' })
  
  yPos += tableHeight + 20

  // Modalité de paiement
  doc.setFontSize(11)
  doc.setFont('Helvetica', 'bold')
  doc.text('Modalité de paiement', 10, yPos)
  yPos += 6
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const paiementText = props.selectedPaiement?.nom || 'Réception facture'
  doc.text(paiementText, 10, yPos)
  
  drawFooter(currentPage, plannedPages)

  // PAGE 2: Conditions et signature
  doc.addPage()
  currentPage++
  drawHeader(currentPage, plannedPages)
  
  yPos = 40

  // Conditions générales
  if (props.conditionsGenerales?.length) {
    doc.setFontSize(11)
    doc.setFont('Helvetica', 'bold')
    doc.text('Conditions générales', 10, yPos)
    yPos += 6
    doc.setFontSize(9)
    doc.setFont('Helvetica', 'normal')
    props.conditionsGenerales.forEach((c) => {
      const text = c.nom || c.description || c.texte || c
      const cleanText = text.trim() // Rimuove spazi iniziali/finali
      const lines = doc.splitTextToSize('- ' + cleanText, 180)
      doc.text(lines, 12, yPos)
      yPos += lines.length * 4
    })
    yPos += 6
  }

  // Le devis comprend
  doc.setFontSize(11)
  doc.setFont('Helvetica', 'bold')
  doc.text('Le devis comprend', 10, yPos)
  yPos += 6
  doc.setFontSize(9)
  doc.setFont('Helvetica', 'normal')
  if (props.conditionsComprend?.length) {
    props.conditionsComprend.forEach((c) => {
      const text = c.nom || c.description || c.texte || c
      const cleanText = text.trim() // Rimuove spazi iniziali/finali
      const lines = doc.splitTextToSize('- ' + cleanText, 180)
      doc.text(lines, 12, yPos)
      yPos += lines.length * 4
    })
  } else {
    doc.text('- Fourniture et pose selon description', 12, yPos)
    yPos += 4
  }
  yPos += 6

  // Le devis ne comprend pas
  doc.setFontSize(11)
  doc.setFont('Helvetica', 'bold')
  doc.text('Le devis ne comprend pas', 10, yPos)
  yPos += 6
  doc.setFontSize(9)
  doc.setFont('Helvetica', 'normal')
  if (props.conditionsNeComprendPas?.length) {
    props.conditionsNeComprendPas.forEach((c) => {
      const text = c.nom || c.description || c.texte || c
      const cleanText = text.trim() // Rimuove spazi iniziali/finali
      const lines = doc.splitTextToSize('- ' + cleanText, 180)
      doc.text(lines, 12, yPos)
      yPos += lines.length * 4
    })
  } else {
    doc.text('- Mise à disposition d\'un local pour se changer et garder les outils', 12, yPos)
    yPos += 4
    doc.text('- La mise à la terre et sa continuité', 12, yPos)
    yPos += 4
    doc.text('- La fourniture de matériel, compris goujon d\'ancrage', 12, yPos)
    yPos += 4
    doc.text('- Main d\'œuvre nécessaire pour déplacement matériels qui empêchent l\'installation', 12, yPos)
    yPos += 4
    doc.text('- La coordination avec la direction des travaux', 12, yPos)
    yPos += 4
    doc.text('- Traitement déchets dehors de chantier', 12, yPos)
    yPos += 4
  }

  // Notes
  if (props.notes?.trim()) {
    yPos += 8
    doc.setFontSize(11)
    doc.setFont('Helvetica', 'bold')
    doc.text('Annotations/Remarques', 10, yPos)
    yPos += 6
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const notesLines = doc.splitTextToSize(props.notes, 180)
    doc.text(notesLines, 12, yPos)
    yPos += notesLines.length * 4 + 8
  }

  // Spazio per firma - identico agli altri devis
  if (yPos < 220) yPos = 220
  doc.setFontSize(11)
  doc.setFont('Helvetica', 'bold')
  doc.text('Bon pour l\'accord', 10, yPos)
  yPos += 12
  doc.setFontSize(9)
  doc.setFont('Helvetica', 'normal')
  doc.text('Date :', 10, yPos)
  doc.text('Le Client', 150, yPos)
  
  drawFooter(currentPage, plannedPages)

  doc.save(`devis-corps-${props.numeroDevis || 'document'}.pdf`)
}

defineExpose({
  generatePdf
})
</script>