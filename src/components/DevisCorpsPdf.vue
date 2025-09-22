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

  const drawHeader = () => {
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
    doc.setTextColor(80)
    companyInfo.forEach((line) => {
      doc.text(line, 200, y, { align: 'right' })
      y += 4
    })
    doc.setTextColor(0)
  }

  drawHeader()

  // Titre
  doc.setFontSize(20)
  doc.setFont('Helvetica', 'bold')
  doc.text(`DEVIS À CORPS N. ${props.numeroDevis}`, 10, 40)

  // Informations client
  doc.setFontSize(11)
  doc.setFont('Helvetica', 'normal')
  doc.text(`Client: ${props.nomClient}`, 10, 55)
  doc.text(`Chantier: ${props.nomChantier}`, 10, 63)
  doc.text(`Date: ${props.dateDevis}`, 10, 71)

  // Description des travaux
  let yPos = 90
  doc.setFontSize(14)
  doc.setFont('Helvetica', 'bold')
  doc.text('Description des travaux', 10, yPos)
  yPos += 10

  doc.setFontSize(10)
  doc.setFont('Helvetica', 'normal')
  const descLines = doc.splitTextToSize(props.descriptionCorps || 'Travaux selon plans fournis', 180)
  doc.text(descLines, 10, yPos)
  yPos += descLines.length * 6 + 15

  // Montant forfaitaire
  doc.setFontSize(14)
  doc.setFont('Helvetica', 'bold')
  doc.text('Montant forfaitaire', 10, yPos)
  yPos += 10

  // Tableau montant
  doc.setFontSize(12)
  doc.setFont('Helvetica', 'normal')
  
  // Cadre pour le montant
  doc.rect(10, yPos, 180, 25)
  doc.setFont('Helvetica', 'bold')
  doc.text('Montant HT:', 15, yPos + 10)
  doc.text(`${props.montantCorps.toFixed(2)} CHF`, 150, yPos + 10, { align: 'right' })
  
  const tva = props.montantCorps * 0.081
  const totalTTC = props.montantCorps + tva
  
  doc.setFont('Helvetica', 'normal')
  doc.text('TVA 8.1%:', 15, yPos + 17)
  doc.text(`${tva.toFixed(2)} CHF`, 150, yPos + 17, { align: 'right' })
  
  doc.setFont('Helvetica', 'bold')
  doc.text('Total TTC:', 15, yPos + 24)
  doc.text(`${totalTTC.toFixed(2)} CHF`, 150, yPos + 24, { align: 'right' })
  
  yPos += 40

  // Modalité de paiement
  doc.setFontSize(12)
  doc.setFont('Helvetica', 'bold')
  doc.text('Modalité de paiement', 10, yPos)
  yPos += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const paiementText = props.selectedPaiement?.nom || 'Réception facture'
  doc.text(paiementText, 10, yPos)
  yPos += 15

  // Conditions générales
  if (props.conditionsGenerales?.length) {
    doc.setFontSize(12)
    doc.setFont('Helvetica', 'bold')
    doc.text('Conditions générales', 10, yPos)
    yPos += 8
    doc.setFontSize(10)
    doc.setFont('Helvetica', 'normal')
    props.conditionsGenerales.forEach((c) => {
      const text = c.nom || c.description || c.texte || c
      const lines = doc.splitTextToSize('- ' + text, 180)
      doc.text(lines, 12, yPos)
      yPos += lines.length * 6
    })
    yPos += 8
  }

  // Le devis comprend
  doc.setFontSize(12)
  doc.setFont('Helvetica', 'bold')
  doc.text('Le devis comprend', 10, yPos)
  yPos += 8
  doc.setFontSize(10)
  doc.setFont('Helvetica', 'normal')
  if (props.conditionsComprend?.length) {
    props.conditionsComprend.forEach((c) => {
      const text = c.nom || c.description || c.texte || c
      const lines = doc.splitTextToSize('- ' + text, 180)
      doc.text(lines, 12, yPos)
      yPos += lines.length * 6
    })
  } else {
    doc.text('- Fourniture et pose selon description', 12, yPos)
    yPos += 6
  }
  yPos += 8

  // Le devis ne comprend pas
  doc.setFontSize(12)
  doc.setFont('Helvetica', 'bold')
  doc.text('Le devis ne comprend pas', 10, yPos)
  yPos += 8
  doc.setFontSize(10)
  doc.setFont('Helvetica', 'normal')
  if (props.conditionsNeComprendPas?.length) {
    props.conditionsNeComprendPas.forEach((c) => {
      const text = c.nom || c.description || c.texte || c
      const lines = doc.splitTextToSize('- ' + text, 180)
      doc.text(lines, 12, yPos)
      yPos += lines.length * 6
    })
  } else {
    doc.text('- Mise à disposition d\'un local pour se changer', 12, yPos)
    yPos += 6
    doc.text('- La fourniture de matériel non spécifié', 12, yPos)
    yPos += 6
  }

  // Notes
  if (props.notes?.trim()) {
    yPos += 10
    doc.setFontSize(12)
    doc.setFont('Helvetica', 'bold')
    doc.text('Annotations/Remarques', 10, yPos)
    yPos += 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const notesLines = doc.splitTextToSize(props.notes, 180)
    doc.text(notesLines, 12, yPos)
    yPos += notesLines.length * 6 + 10
  }

  // Signature
  if (yPos < 220) yPos = 220
  doc.setFontSize(11)
  doc.setFont('Helvetica', 'bold')
  doc.text('Bon pour l\'accord', 10, yPos)
  yPos += 12
  doc.setFontSize(9)
  doc.setFont('Helvetica', 'normal')
  doc.text('Date :', 10, yPos)
  doc.text('Le Client', 150, yPos)

  // Footer
  doc.setFontSize(8)
  doc.text('Pag. 1/1', 105, 292, { align: 'center' })

  doc.save(`devis-corps-${props.numeroDevis || 'document'}.pdf`)
}

defineExpose({
  generatePdf
})
</script>