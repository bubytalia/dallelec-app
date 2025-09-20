# PROBLEMI DA RISOLVERE - SISTEMA DALLELEC

## 🔴 PROBLEMA PRINCIPALE: Prezzo Régies sempre 65 CHF/h invece di 75 CHF/h

### Situazione:
- Il chantier dovrebbe avere régies a 75 CHF/h
- Il sistema mostra sempre 65 CHF/h
- Ho corretto i default da 65 a 75, ma il problema persiste

### Possibili cause:
1. **Database**: Il campo `prixRegie` nel chantier non è impostato a 75
2. **Régies esistenti**: Le régies già salvate hanno `prixHeure: 65` hardcoded
3. **Cache**: Dati vecchi in cache

### Da verificare:
1. Controllare il database `chantiers` - campo `prixRegie`
2. Controllare le régies salvate in `resoconti_percentuali` - campo `regies[].prixHeure`
3. Verificare se il chantier specifico ha `prixRegie = 75`

### Files modificati:
- `AdminFacturation.vue`: Corretto per usare prezzo dal chantier
- `ChefResocontoPercentuale.vue`: Corretto default da 65 a 75

### Prossimi passi:
1. Verificare database chantiers
2. Se necessario, aggiornare il campo `prixRegie` del chantier a 75
3. Testare con nuovo resoconto

## ✅ RISOLTO: Fattura eliminata riappariva
- Problema: Quando eliminavi una fattura da resoconto, il resoconto rimaneva "approved"
- Soluzione: Aggiunto codice per rimettere resoconto in "en_attente" quando elimini fattura