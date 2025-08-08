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
    
    // Lista completa dipendenti
    const employes = [
      { userId: 'chef@dallelec.com', nom: 'Chef de Chantier', email: 'chef@dallelec.com' },
      ...collaborateurs.map(c => ({ userId: c.email, nom: `${c.nom} ${c.prenom}`, email: c.email }))
    ];
    
    // Fetch ore di tutti i dipendenti
    const heuresChefSnapshot = await getDocs(collection(db, 'heures_chef_propres'));
    const heuresChef = heuresChefSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const heuresInterimSnapshot = await getDocs(collection(db, 'heures_chef_interim'));
    const heuresInterim = heuresInterimSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Fetch assenze
    const absencesSnapshot = await getDocs(collection(db, 'absences'));
    const absences = absencesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Genera report per ogni dipendente
    const employesReport = [];
    let totalHeuresAzienda = 0;
    let totalJoursAbsence = 0;
    const absencesAziendali = {};
    
    for (const employe of employes) {
      // Ore del dipendente
      const heuresEmploye = heuresChef.filter(h => 
        h.date >= startDate && 
        h.date <= endDate && 
        h.chefId === employe.email
      );
      
      // Ore intérimaires per questo dipendente
      const heuresInterimEmploye = heuresInterim.filter(h => 
        h.date >= startDate && 
        h.date <= endDate && 
        h.collaborateurId === employe.email
      );
      
      // Assenze del dipendente
      const absencesEmploye = absences.filter(absence => 
        absence.userId === employe.email &&
        ((absence.startDate >= startDate && absence.startDate <= endDate) ||
         (absence.endDate >= startDate && absence.endDate <= endDate) ||
         (absence.startDate <= startDate && absence.endDate >= endDate))
      );
      
      // Calcola totali
      const totalHeures = heuresEmploye.reduce((sum, h) => sum + (h.heuresPropres || 0), 0) +
                         heuresInterimEmploye.reduce((sum, h) => sum + (h.heuresInterim || 0), 0);
      
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
        
        const totalHeuresJour = heuresJour.reduce((sum, h) => sum + (h.heuresPropres || 0), 0) +
                               heuresInterimJour.reduce((sum, h) => sum + (h.heuresInterim || 0), 0);
        
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
      const heuresJour = heuresChef.filter(h => h.date === dateStr);
      const heuresInterimJour = heuresInterim.filter(h => h.date === dateStr);
      const absencesJour = absences.filter(a => 
        a.startDate <= dateStr && a.endDate >= dateStr
      );
      
      const totalHeuresJour = heuresJour.reduce((sum, h) => sum + (h.heuresPropres || 0), 0) +
                             heuresInterimJour.reduce((sum, h) => sum + (h.heuresInterim || 0), 0);
      
      heuresSemaine += totalHeuresJour;
      absencesSemaine += absencesJour.length;
      
      // Conta dipendenti attivi
      const employesActifsJour = new Set();
      heuresJour.forEach(h => employesActifsJour.add(h.chefId));
      heuresInterimJour.forEach(h => employesActifsJour.add(h.collaborateurId));
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

const exportToPDF = () => {
  // TODO: Implementare export PDF
  alert('Fonctionnalité d\'export PDF à implémenter');
};

onMounted(() => {
  generateReport();
});
</script>
