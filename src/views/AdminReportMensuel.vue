<template>
  <div class="container py-5">
    <RetourButton to="/admin" />
    
    <h2 class="text-center mb-4">Report Mensuel Aziendale - Commercialiste</h2>
    
    <!-- Selezione mese -->
    <div class="row mb-4">
      <div class="col-md-6 mx-auto">
        <div class="card">
          <div class="card-header">
            <h5>Sélection du mois</h5>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label>Mois:</label>
              <input v-model="selectedMonth" type="month" class="form-control" @change="generateReport" />
            </div>
            <button @click="generateReport" class="btn btn-primary">Générer le rapport</button>
            <button @click="exportToPDF" class="btn btn-success ms-2" :disabled="!reportData">Exporter PDF</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Report generato -->
    <div v-if="reportData" class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5>Rapport mensuel aziendale - {{ formatMonth(selectedMonth) }}</h5>
          </div>
          <div class="card-body">
            <!-- Riepilogo generale aziendale -->
            <div class="row mb-4">
              <div class="col-md-12">
                <h6>Résumé général de l'entreprise</h6>
                <table class="table table-sm">
                  <tbody>
                    <tr>
                      <td><strong>Période:</strong></td>
                      <td>{{ formatMonth(selectedMonth) }}</td>
                    </tr>
                    <tr>
                      <td><strong>Total heures travaillées:</strong></td>
                      <td>{{ reportData.totalHeuresAzienda }} heures</td>
                    </tr>
                    <tr>
                      <td><strong>Nombre d'employés:</strong></td>
                      <td>{{ reportData.nombreEmployes }} employés</td>
                    </tr>
                    <tr>
                      <td><strong>Jours d'absence total:</strong></td>
                      <td>{{ reportData.totalJoursAbsence }} jours</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Report per dipendente -->
            <div class="row mb-4">
              <div class="col-md-12">
                <h6>Rapport par employé</h6>
                <div v-for="employe in reportData.employes" :key="employe.userId" class="card mb-3">
                  <div class="card-header">
                    <h6>{{ employe.nom }}</h6>
                  </div>
                  <div class="card-body">
                    <div class="row">
                      <div class="col-md-6">
                        <table class="table table-sm">
                          <tbody>
                            <tr>
                              <td><strong>Heures travaillées:</strong></td>
                              <td>{{ employe.totalHeures }} heures</td>
                            </tr>
                            <tr>
                              <td><strong>Jours de travail:</strong></td>
                              <td>{{ employe.joursTravail }} jours</td>
                            </tr>
                            <tr>
                              <td><strong>Jours d'absence:</strong></td>
                              <td>{{ employe.joursAbsence }} jours</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div class="col-md-6">
                        <h6>Détail des absences</h6>
                        <table class="table table-sm">
                          <thead>
                            <tr>
                              <th>Type</th>
                              <th>Jours</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(count, type) in employe.absencesResume" :key="type">
                              <td>{{ getTypeLabel(type) }}</td>
                              <td>{{ count }} jours</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Riepilogo assenze aziendali -->
            <div class="row mb-4">
              <div class="col-md-12">
                <h6>Résumé des absences par type</h6>
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Type d'absence</th>
                      <th>Nombre total de jours</th>
                      <th>Nombre d'employés concernés</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(data, type) in reportData.absencesAziendali" :key="type">
                      <td>{{ getTypeLabel(type) }}</td>
                      <td>{{ data.totalJours }} jours</td>
                      <td>{{ data.nombreEmployes }} employés</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Statistiche settimanali aziendali -->
            <div class="row">
              <div class="col-md-12">
                <h6>Statistiques hebdomadaires de l'entreprise</h6>
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Semaine</th>
                      <th>Heures travaillées</th>
                      <th>Jours d'absence</th>
                      <th>Employés actifs</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="semaine in reportData.semainesAziendali" :key="semaine.numero">
                      <td>Semaine {{ semaine.numero }}</td>
                      <td>{{ semaine.heures }}h</td>
                      <td>{{ semaine.absences }} jours</td>
                      <td>{{ semaine.employesActifs }} employés</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import RetourButton from '@/components/RetourButton.vue';

const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const reportData = ref(null);

const generateReport = async () => {
  try {
    const [year, month] = selectedMonth.value.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    // Fetch tutti i dipendenti (chef + collaboratori)
    const collaborateursSnapshot = await getDocs(collection(db, 'collaborateurs'));
    const collaborateurs = collaborateursSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const chefsSnapshot = await getDocs(collection(db, 'chefdechantiers'));
    const chefs = chefsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Lista completa dipendenti (esclusi quelli marcati)
    const employes = [
      ...chefs.filter(c => !c.excludeFromReport).map(c => ({ userId: c.email, nom: `${c.nom} ${c.prenom}`, email: c.email, type: 'chef' })),
      ...collaborateurs.filter(c => !c.excludeFromReport).map(c => ({ userId: c.email, nom: `${c.nom} ${c.prenom}`, email: c.email, type: 'ouvrier' }))
    ];
    
    // Fetch ore di tutti i dipendenti
    const heuresChefSnapshot = await getDocs(collection(db, 'heures_chef_propres'));
    const heuresChef = heuresChefSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const heuresInterimSnapshot = await getDocs(collection(db, 'heures_chef_interim'));
    const heuresInterim = heuresInterimSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Fetch ore ouvriers
    const heuresOuvriersSnapshot = await getDocs(collection(db, 'heures_ouvriers'));
    const heuresOuvriers = heuresOuvriersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Fetch assenze
    const absencesSnapshot = await getDocs(collection(db, 'absences'));
    const absences = absencesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Genera report per ogni dipendente
    const employesReport = [];
    let totalHeuresAzienda = 0;
    let totalJoursAbsence = 0;
    const absencesAziendali = {};
    
    for (const employe of employes) {
      let heuresEmploye = [];
      let heuresInterimEmploye = [];
      
      if (employe.type === 'chef') {
        // Per il chef: ore proprie + ore interim
        heuresEmploye = heuresChef.filter(h => 
          h.date >= startDate && 
          h.date <= endDate && 
          h.chefId === employe.email
        );
        
        heuresInterimEmploye = heuresInterim.filter(h => 
          h.date >= startDate && 
          h.date <= endDate && 
          h.chefId === employe.email
        );
      } else {
        // Per gli ouvriers: solo ore ouvriers
        heuresEmploye = heuresOuvriers.filter(h => 
          h.date >= startDate && 
          h.date <= endDate && 
          h.ouvrierId === employe.email
        );
      }
      
      // Assenze del dipendente
      const absencesEmploye = absences.filter(absence => 
        absence.userId === employe.email &&
        ((absence.startDate >= startDate && absence.startDate <= endDate) ||
         (absence.endDate >= startDate && absence.endDate <= endDate) ||
         (absence.startDate <= startDate && absence.endDate >= endDate))
      );
      
      // Calcola totali
      let totalHeures = 0;
      
      if (employe.type === 'chef') {
        totalHeures = heuresEmploye.reduce((sum, h) => sum + (h.heuresPropres || 0), 0) +
                     heuresInterimEmploye.reduce((sum, h) => sum + (h.heuresInterim || 0), 0);
      } else {
        totalHeures = heuresEmploye.reduce((sum, h) => sum + (h.heures || 0), 0);
      }
      
      const joursTravail = new Set();
      const joursAbsence = new Set();
      const absencesResume = {};
      
      // Per ogni giorno del mese
      const currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      while (currentDate <= endDateObj) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const heuresJour = heuresEmploye.filter(h => h.date === dateStr);
        const heuresInterimJour = heuresInterimEmploye.filter(h => h.date === dateStr);
        const absenceJour = absencesEmploye.find(a => 
          a.startDate <= dateStr && a.endDate >= dateStr
        );
        
        let totalHeuresJour = 0;
        if (employe.type === 'chef') {
          totalHeuresJour = heuresJour.reduce((sum, h) => sum + (h.heuresPropres || 0), 0) +
                           heuresInterimJour.reduce((sum, h) => sum + (h.heuresInterim || 0), 0);
        } else {
          totalHeuresJour = heuresJour.reduce((sum, h) => sum + (h.heures || 0), 0);
        }
        
        if (absenceJour) {
          joursAbsence.add(dateStr);
          absencesResume[absenceJour.type] = (absencesResume[absenceJour.type] || 0) + 1;
          
          // Aggiorna statistiche aziendali
          absencesAziendali[absenceJour.type] = absencesAziendali[absenceJour.type] || { totalJours: 0, employes: new Set() };
          absencesAziendali[absenceJour.type].totalJours++;
          absencesAziendali[absenceJour.type].employes.add(employe.email);
        } else if (totalHeuresJour > 0) {
          joursTravail.add(dateStr);
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      employesReport.push({
        userId: employe.userId,
        nom: employe.nom,
        totalHeures,
        joursTravail: joursTravail.size,
        joursAbsence: joursAbsence.size,
        absencesResume
      });
      
      totalHeuresAzienda += totalHeures;
      totalJoursAbsence += joursAbsence.size;
    }
    
    // Calcola statistiche settimanali aziendali
    const semainesAziendali = [];
    let semaineCourante = 1;
    let heuresSemaine = 0;
    let absencesSemaine = 0;
    let employesActifsSemaine = new Set();
    
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    while (currentDate <= endDateObj) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const jourSemaine = currentDate.getDay();
      
      // Conta ore e assenze per questo giorno
      const heuresChefJour = heuresChef.filter(h => h.date === dateStr);
      const heuresInterimJour = heuresInterim.filter(h => h.date === dateStr);
      const heuresOuvriersJour = heuresOuvriers.filter(h => h.date === dateStr);
      const absencesJour = absences.filter(a => 
        a.startDate <= dateStr && a.endDate >= dateStr
      );
      
      const totalHeuresJour = heuresChefJour.reduce((sum, h) => sum + (h.heuresPropres || 0), 0) +
                             heuresInterimJour.reduce((sum, h) => sum + (h.heuresInterim || 0), 0) +
                             heuresOuvriersJour.reduce((sum, h) => sum + (h.heures || 0), 0);
      
      heuresSemaine += totalHeuresJour;
      absencesSemaine += absencesJour.length;
      
      // Conta dipendenti attivi
      const employesActifsJour = new Set();
      heuresChefJour.forEach(h => employesActifsJour.add(h.chefId));
      heuresInterimJour.forEach(h => employesActifsJour.add(h.chefId));
      heuresOuvriersJour.forEach(h => employesActifsJour.add(h.ouvrierId));
      employesActifsJour.forEach(email => employesActifsSemaine.add(email));
      
      // Fine settimana (domenica) o fine mese
      if (jourSemaine === 0 || currentDate.getTime() === endDateObj.getTime()) {
        semainesAziendali.push({
          numero: semaineCourante,
          heures: heuresSemaine,
          absences: absencesSemaine,
          employesActifs: employesActifsSemaine.size
        });
        semaineCourante++;
        heuresSemaine = 0;
        absencesSemaine = 0;
        employesActifsSemaine = new Set();
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Converti Set in numeri per le statistiche aziendali
    const absencesAziendaliFormatted = {};
    Object.keys(absencesAziendali).forEach(type => {
      absencesAziendaliFormatted[type] = {
        totalJours: absencesAziendali[type].totalJours,
        nombreEmployes: absencesAziendali[type].employes.size
      };
    });
    
    // Debug: verifica dati caricati
    console.log('=== DEBUG REPORT ===');
    console.log('Période:', startDate, 'à', endDate);
    console.log('Employés trouvés:', employes.length);
    console.log('Heures chef:', heuresChef.length);
    console.log('Heures interim:', heuresInterim.length);
    console.log('Heures ouvriers:', heuresOuvriers.length);
    console.log('Absences:', absences.length);
    console.log('Employés avec données:', employesReport.filter(e => e.totalHeures > 0 || e.joursAbsence > 0).length);
    
    reportData.value = {
      totalHeuresAzienda,
      nombreEmployes: employes.length,
      totalJoursAbsence,
      employes: employesReport,
      absencesAziendali: absencesAziendaliFormatted,
      semainesAziendali
    };
    
  } catch (error) {
    console.error('Erreur lors de la génération du rapport:', error);
  }
};

const formatMonth = (monthStr) => {
  const [year, month] = monthStr.split('-');
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
};

const getTypeLabel = (type) => {
  switch (type) {
    case 'vacances': return 'Vacances';
    case 'maladie': return 'Maladie';
    case 'accident': return 'Accident';
    case 'vacances_sans_solde': return 'Vacances sans solde';
    case 'cours': return 'Cours';
    default: return type;
  }
};

const exportToPDF = async () => {
  if (!reportData.value) return;
  
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const logo = (await import('@/assets/logo.jpg')).default;
  
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  
  const drawHeader = (pageNum, totalPages) => {
    // Logo aziendale
    const logoW = 45;
    const logoH = logoW / 5.32;
    doc.addImage(logo, 'JPEG', 10, 10, logoW, logoH);
    
    // Dati aziendali a destra
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'normal');
    const companyInfo = [
      'DALLELEC Sarl',
      'Rue de Bourgogne 25',
      '1203 Genève',
      'contact@dallelec.ch'
    ];
    let y = 12;
    const prevColor = doc.getTextColor();
    doc.setTextColor(80);
    companyInfo.forEach((line) => {
      doc.text(line, 200, y, { align: 'right' });
      y += 4;
    });
    doc.setTextColor(prevColor);
    
    // Titolo centrato
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.text('RAPPORT MENSUEL', 105, 35, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Période: ${formatMonth(selectedMonth.value)}`, 105, 42, { align: 'center' });
    
    // Numero pagina
    doc.setFontSize(8);
    doc.text(`Page ${pageNum}/${totalPages}`, 200, 285, { align: 'right' });
  };
  
  let currentPage = 1;
  const totalPages = 3;
  
  // Page 1: Résumé général
  drawHeader(currentPage, totalPages);
  
  doc.setFontSize(14);
  doc.setFont('Helvetica', 'bold');
  doc.text('Résumé Général de l\'Entreprise', 10, 55);
  
  const resumeData = [
    ['Période', formatMonth(selectedMonth.value)],
    ['Total heures travaillées', `${reportData.value.totalHeuresAzienda} heures`],
    ['Nombre d\'employés', `${reportData.value.nombreEmployes} employés`],
    ['Jours d\'absence total', `${reportData.value.totalJoursAbsence} jours`]
  ];
  
  autoTable(doc, {
    body: resumeData,
    startY: 60,
    theme: 'grid',
    headStyles: { fillColor: [230, 230, 230] },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { cellWidth: 100 }
    }
  });
  
  // Statistiques hebdomadaires
  let yPos = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  doc.text('Statistiques Hebdomadaires', 10, yPos);
  
  const semainesHead = [['Semaine', 'Heures', 'Absences', 'Employés Actifs']];
  const semainesBody = reportData.value.semainesAziendali.map(s => [
    `Semaine ${s.numero}`,
    `${s.heures}h`,
    `${s.absences} jours`,
    `${s.employesActifs} employés`
  ]);
  
  autoTable(doc, {
    head: semainesHead,
    body: semainesBody,
    startY: yPos + 5,
    theme: 'grid',
    headStyles: { fillColor: [200, 200, 200] }
  });
  
  // Page 2: Rapport par employé
  doc.addPage();
  currentPage++;
  drawHeader(currentPage, totalPages);
  
  doc.setFontSize(14);
  doc.setFont('Helvetica', 'bold');
  doc.text('Rapport par Employé', 10, 55);
  
  const employesHead = [['Employé', 'Heures', 'Jours Travail', 'Jours Absence']];
  const employesBody = reportData.value.employes.map(emp => [
    emp.nom,
    `${emp.totalHeures}h`,
    `${emp.joursTravail} jours`,
    `${emp.joursAbsence} jours`
  ]);
  
  autoTable(doc, {
    head: employesHead,
    body: employesBody,
    startY: 60,
    theme: 'grid',
    headStyles: { fillColor: [200, 200, 200] }
  });
  
  // Page 3: Détail des absences
  doc.addPage();
  currentPage++;
  drawHeader(currentPage, totalPages);
  
  doc.setFontSize(14);
  doc.setFont('Helvetica', 'bold');
  doc.text('Résumé des Absences par Type', 10, 55);
  
  const absencesHead = [['Type d\'Absence', 'Total Jours', 'Employés Concernés']];
  const absencesBody = Object.entries(reportData.value.absencesAziendali).map(([type, data]) => [
    getTypeLabel(type),
    `${data.totalJours} jours`,
    `${data.nombreEmployes} employés`
  ]);
  
  autoTable(doc, {
    head: absencesHead,
    body: absencesBody,
    startY: 60,
    theme: 'grid',
    headStyles: { fillColor: [200, 200, 200] }
  });
  
  // Détail absences par employé
  yPos = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  doc.text('Détail des Absences par Employé', 10, yPos);
  
  yPos += 10;
  reportData.value.employes.forEach(emp => {
    if (Object.keys(emp.absencesResume).length > 0) {
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${emp.nom}:`, 15, yPos);
      yPos += 5;
      
      Object.entries(emp.absencesResume).forEach(([type, count]) => {
        doc.setFont('Helvetica', 'normal');
        doc.text(`  • ${getTypeLabel(type)}: ${count} jours`, 20, yPos);
        yPos += 4;
      });
      yPos += 3;
    }
  });
  
  // Footer con data generazione
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'italic');
  doc.text(`Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 105, 285, { align: 'center' });
  
  doc.save(`rapport-mensuel-${selectedMonth.value}.pdf`);
};

onMounted(() => {
  generateReport();
});
</script>
