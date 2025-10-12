import { ref } from 'vue';
import { supabase } from '@/supabase.js';

export function useFacturation() {
  const loading = ref(false);

  const generateNumeroFacture = async () => {
    try {
      const { data: config } = await supabase
        .from('configurazione_fatture')
        .select('*')
        .single();
      
      const ultimoNumero = config?.ultimo_numero || 0;
      const anno = config?.anno || new Date().getFullYear();
      const prefisso = config?.prefisso || 'F';
      
      const { data: factures } = await supabase
        .from('factures')
        .select('numero')
        .like('numero', `${prefisso}${anno}%`);
      
      const prossimoNumero = ultimoNumero + (factures?.length || 0) + 1;
      return `${prefisso}${anno}-${String(prossimoNumero).padStart(3, '0')}`;
    } catch (error) {
      return `F${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
    }
  };

  const createFactureFromMetrage = async (metrage, dataFacture, acconti = 0) => {
    loading.value = true;
    try {
      const numeroFacture = await generateNumeroFacture();
      
      // Calcola montanti
      const montantHT = calculateMontantMetrage(metrage);
      const dataScadenza = new Date(dataFacture);
      dataScadenza.setDate(dataScadenza.getDate() + 30);
      
      const { error } = await supabase
        .from('factures')
        .insert([{
          numero: numeroFacture,
          chantier_id: metrage.chantier_id,
          metrage_id: metrage.id,
          date_facture: dataFacture,
          montant_ht: montantHT,
          taux_tva: 8.1,
          montant_ttc: montantHT * 1.081,
          acconti_precedenti: acconti,
          statut: 'emise',
          date_echeance: dataScadenza.toISOString().split('T')[0],
          created_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
      
      // Marca métrage come fatturato
      await supabase
        .from('metrages')
        .update({
          facture: true,
          facture_numero: numeroFacture,
          facture_date: dataFacture
        })
        .eq('id', metrage.id);
      
      return numeroFacture;
    } finally {
      loading.value = false;
    }
  };

  const createFactureFromResoconto = async (resoconto, dataFacture, acconti = 0) => {
    loading.value = true;
    try {
      const numeroFacture = resoconto.numero_fattura_riservato || await generateNumeroFacture();
      
      const montantHT = calculateMontantResoconto(resoconto);
      const dataScadenza = new Date(dataFacture);
      dataScadenza.setDate(dataScadenza.getDate() + 30);
      
      const { error } = await supabase
        .from('factures')
        .insert([{
          numero: numeroFacture,
          chantier_id: resoconto.chantier_id || resoconto.chantierId,
          resoconto_id: resoconto.id,
          date_facture: dataFacture,
          montant_ht: montantHT,
          taux_tva: 8.1,
          montant_ttc: montantHT * 1.081,
          acconti_precedenti: acconti,
          statut: 'emise',
          date_echeance: dataScadenza.toISOString().split('T')[0],
          created_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
      
      // Pulisci numero riservato
      if (resoconto.numero_fattura_riservato) {
        await supabase
          .from('resoconti_percentuali')
          .update({ numero_fattura_riservato: null })
          .eq('id', resoconto.id);
      }
      
      return numeroFacture;
    } finally {
      loading.value = false;
    }
  };

  const calculateMontantMetrage = (metrage) => {
    // Logica semplificata per calcolo métrage
    let total = 0;
    
    if (metrage.items?.length > 0) {
      total += metrage.items.reduce((sum, item) => {
        const quantite = Number(item.mlPosee || 0);
        const supplements = item.supplements?.reduce((s, supp) => 
          s + (Number(supp.qte || 0) * Number(supp.valeur || 0)), 0) || 0;
        return sum + ((quantite + supplements) * Number(item.prix || 50));
      }, 0);
    }
    
    if (metrage.regies?.length > 0) {
      total += metrage.regies.reduce((sum, r) => 
        sum + (Number(r.heures || 0) * Number(r.prixHeure || 75)), 0);
    }
    
    return total;
  };

  const calculateMontantResoconto = (resoconto) => {
    // Logica semplificata per calcolo resoconto
    let total = 0;
    
    // Calcola da avancementi (necessita devis e chantier)
    if (resoconto.avancementi) {
      // Implementazione base - da completare con devis
      total = Object.values(resoconto.avancementi).reduce((sum, pct) => sum + pct, 0) * 100;
    }
    
    // Aggiungi regies
    if (resoconto.regies?.length > 0) {
      total += resoconto.regies.reduce((sum, r) => 
        sum + (Number(r.heures || 0) * Number(r.prixHeure || 75)), 0);
    }
    
    return total;
  };

  return {
    loading,
    generateNumeroFacture,
    createFactureFromMetrage,
    createFactureFromResoconto,
    calculateMontantMetrage,
    calculateMontantResoconto
  };
}