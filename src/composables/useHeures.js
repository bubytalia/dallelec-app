/**
 * Composable centralizzato per la lettura delle ore.
 * Usa sempre il fallback: total_heures → heures_normales → heures
 * per gestire righe storiche dove total_heures può essere null.
 */

export const getHeures = (h) => h.total_heures ?? h.heures_normales ?? h.heures ?? 0

export const useHeures = (supabase) => {
  const loadHeuresChantier = async (chantierId) => {
    const [{ data: propres }, { data: interim }, { data: ouvriers }] = await Promise.all([
      supabase.from('heures_chef_propres').select('*').eq('chantier_id', chantierId),
      supabase.from('heures_chef_interim').select('*').eq('chantier_id', chantierId),
      supabase.from('heures_ouvriers').select('*').eq('chantier_id', chantierId)
    ])

    return {
      propres: (propres || []).map(h => ({ ...h, _heures: getHeures(h) })),
      interim: (interim || []).map(h => ({ ...h, _heures: getHeures(h) })),
      ouvriers: (ouvriers || []).map(h => ({ ...h, _heures: getHeures(h) }))
    }
  }

  return { getHeures, loadHeuresChantier }
}
