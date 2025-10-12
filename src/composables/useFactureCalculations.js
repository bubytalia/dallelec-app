import { computed } from 'vue';

export function useFactureCalculations(factures, devis, chantiers) {
  
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

  const calculateZoneMontant = (zone, percentage, detailResoconto, chantiers, devis) => {
    const chantier = chantiers.value?.find(c => c.id == (detailResoconto.chantier_id || detailResoconto.chantierId));
    const chantierDevis = devis.value?.find(d => d.id == chantier?.devis_id);
    
    if (!chantierDevis) return 0;
    
    if (chantierDevis.modalita_prezzi === 'aCorps') {
      const montantCorps = Number(chantierDevis.montant_corps || 0);
      const numeroZone = chantierDevis.zones?.length || 1;
      const montantPerZona = montantCorps / numeroZone;
      return montantPerZona * percentage / 100;
    }
    
    if (!chantierDevis.produits) return 0;
    
    const totaleZona = chantierDevis.produits
      .filter(p => p.zone === zone)
      .reduce((sum, p) => sum + Number(p.total || 0), 0);
    
    return totaleZona * percentage / 100;
  };

  const calculateTotalTravaux = (detailResoconto, chantiers, devis) => {
    if (!detailResoconto.avancementi) return 0;
    return Object.entries(detailResoconto.avancementi).reduce((sum, [zone, percentage]) => {
      return sum + calculateZoneMontant(zone, percentage, detailResoconto, chantiers, devis);
    }, 0);
  };

  const calculateTotalRegies = (detailResoconto, chantiers) => {
    if (!detailResoconto.regies) return 0;
    const chantier = chantiers.value?.find(c => c.id == (detailResoconto.chantier_id || detailResoconto.chantierId));
    const prixRegie = chantier?.prix_regie || 75;
    return detailResoconto.regies.reduce((sum, r) => sum + (r.heures * (r.prixHeure || prixRegie)), 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toDate ? date.toDate().toLocaleDateString('fr-FR') : new Date(date).toLocaleDateString('fr-FR');
  };

  // Statistiques
  const facturationMois = computed(() => {
    if (!factures.value) return 0;
    const thisMonth = new Date();
    return factures.value
      .filter(f => {
        const factureDate = new Date(f.date_facture || f.dateFacture);
        return factureDate.getMonth() === thisMonth.getMonth() && 
               factureDate.getFullYear() === thisMonth.getFullYear();
      })
      .reduce((sum, f) => sum + calculateSoldeFinale(f), 0);
  });

  const facturationAnnee = computed(() => {
    if (!factures.value) return 0;
    const thisYear = new Date().getFullYear();
    return factures.value
      .filter(f => {
        const factureDate = new Date(f.date_facture || f.dateFacture);
        return factureDate.getFullYear() === thisYear;
      })
      .reduce((sum, f) => sum + calculateSoldeFinale(f), 0);
  });

  const facturesPayees = computed(() => {
    if (!factures.value) return 0;
    return factures.value
      .filter(f => f.statut === 'payee')
      .reduce((sum, f) => sum + calculateSoldeFinale(f), 0);
  });

  const facturesImpayes = computed(() => {
    if (!factures.value) return 0;
    return factures.value
      .filter(f => f.statut === 'emise' || f.statut === 'envoyee' || f.statut === 'en_retard')
      .reduce((sum, f) => sum + calculateSoldeFinale(f), 0);
  });

  return {
    calculateSoldeFinale,
    calculateZoneMontant,
    calculateTotalTravaux,
    calculateTotalRegies,
    formatCurrency,
    formatDate,
    facturationMois,
    facturationAnnee,
    facturesPayees,
    facturesImpayes
  };
}