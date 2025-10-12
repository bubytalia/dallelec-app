<template>
  <div class="row justify-content-center mb-4">
    <div class="col-md-9">
      <div class="row">
        <div class="col">
          <div class="card bg-warning text-white text-center">
            <div class="card-body py-2">
              <h6 class="mb-1">En Attente</h6>
              <h5 class="mb-1">{{ metragesEnAttente }}</h5>
              <small>Métrages</small>
            </div>
          </div>
        </div>
        <div class="col">
          <div class="card bg-info text-white text-center">
            <div class="card-body py-2">
              <h6 class="mb-1">Ce Mois</h6>
              <h6 class="mb-1">{{ formatCurrency(facturationMois) }}</h6>
              <small>Facturé</small>
            </div>
          </div>
        </div>
        <div class="col">
          <div class="card bg-primary text-white text-center">
            <div class="card-body py-2">
              <h6 class="mb-1">Cette Année</h6>
              <h6 class="mb-1">{{ formatCurrency(facturationAnnee) }}</h6>
              <small>Total</small>
            </div>
          </div>
        </div>
        <div class="col">
          <div class="card bg-success text-white text-center">
            <div class="card-body py-2">
              <h6 class="mb-1">Payées</h6>
              <h6 class="mb-1">{{ formatCurrency(facturesPayees) }}</h6>
              <small>Encaissé</small>
            </div>
          </div>
        </div>
        <div class="col">
          <div class="card bg-danger text-white text-center">
            <div class="card-body py-2">
              <h6 class="mb-1">Impayées</h6>
              <h6 class="mb-1">{{ formatCurrency(facturesImpayes) }}</h6>
              <small>À encaisser</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  factures: Array,
  metragesEnAttente: Number
});

const calculateSoldeFinale = (facture) => {
  const acconti = Number(facture.acconti_precedenti || 0);
  if (acconti === 0) {
    return Number(facture.montant_ttc || facture.montantTTC || 0);
  }
  const montantHT = Number(facture.montant_ht || 0);
  const montantNetHT = montantHT - acconti;
  const tva = montantNetHT * 0.081;
  return montantNetHT + tva;
};

const facturationMois = computed(() => {
  const thisMonth = new Date();
  return props.factures
    .filter(f => {
      const factureDate = new Date(f.date_facture || f.dateFacture);
      return factureDate.getMonth() === thisMonth.getMonth() && 
             factureDate.getFullYear() === thisMonth.getFullYear();
    })
    .reduce((sum, f) => sum + calculateSoldeFinale(f), 0);
});

const facturationAnnee = computed(() => {
  const thisYear = new Date().getFullYear();
  return props.factures
    .filter(f => {
      const factureDate = new Date(f.date_facture || f.dateFacture);
      return factureDate.getFullYear() === thisYear;
    })
    .reduce((sum, f) => sum + calculateSoldeFinale(f), 0);
});

const facturesPayees = computed(() => {
  return props.factures
    .filter(f => f.statut === 'payee')
    .reduce((sum, f) => sum + calculateSoldeFinale(f), 0);
});

const facturesImpayes = computed(() => {
  return props.factures
    .filter(f => f.statut === 'emise' || f.statut === 'envoyee' || f.statut === 'en_retard')
    .reduce((sum, f) => sum + calculateSoldeFinale(f), 0);
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: 'CHF'
  }).format(amount);
};
</script>