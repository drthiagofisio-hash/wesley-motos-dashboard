// ============================================================
// DADOS FIXOS DAS CAMPANHAS — WESLEY MOTOS (Balsas-MA)
// ============================================================

export const FLUXOS = {
  whatsapp: { id: 'whatsapp', nome: 'WhatsApp', percentual: 100, verbaSemanal: 375.00 },
};

export const TEMPERATURAS = {
  quente: { id: 'quente', nome: 'Quente', cor: '#ef4444', badge: 'bg-red-100 text-red-700' },
  morno:  { id: 'morno',  nome: 'Morno',  cor: '#f97316', badge: 'bg-orange-100 text-orange-700' },
  frio:   { id: 'frio',   nome: 'Frio',   cor: '#3b82f6', badge: 'bg-blue-100 text-blue-700' },
};

export const CAMPANHAS = [
  {
    id: 'WES_MSG_01',
    nome: '[MAI 01 ] MSG MOTOS - [ORK- ]',
    fluxo: 'whatsapp',
    segmentacao: 'Público geral — interesse em motos',
    geo: 'Balsas-MA',
    temperatura: 'frio',
    verbaSemanal: 375.00,
  },
];

export const VERBA_TOTAL_SEMANAL = 375.00;
export const VERBA_TOTAL_CAMPANHA = 1500.00;
export const TOTAL_SEMANAS = 4;

export const CAMPANHAS_MAP = Object.fromEntries(
  CAMPANHAS.map(c => [c.nome.toLowerCase(), c])
);

export function encontrarCampanha(nomeCampanha) {
  if (!nomeCampanha) return null;
  const key = nomeCampanha.toLowerCase().trim();
  if (CAMPANHAS_MAP[key]) return CAMPANHAS_MAP[key];
  return CAMPANHAS.find(c =>
    key.includes(c.nome.toLowerCase()) || c.nome.toLowerCase().includes(key)
  ) || null;
}
