// ============================================================
// UTILITÁRIOS DE CÁLCULO — WESLEY MOTOS
// ============================================================
import { CAMPANHAS, FLUXOS, encontrarCampanha } from '../data/campaigns';
import { VIDEOS } from '../data/videos';

export const fmtBRL = (v) =>
  v == null ? '-' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export const fmtPct = (v, dec = 1) =>
  v == null ? '-' : `${Number(v).toFixed(dec)}%`;

export const fmtNum = (v, dec = 0) =>
  v == null ? '-' : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

function resolveBM(bmContext = {}) {
  return {
    campanhas: bmContext.campanhas || CAMPANHAS,
    fluxos: bmContext.fluxos || FLUXOS,
    videos: bmContext.videos || VIDEOS,
    encontrarFn: bmContext.encontrarCampanhaFn || encontrarCampanha,
  };
}

export function calcularStatus(cpl, mediaCpl, frequencia, ctr, leads, mediaLeads) {
  if (!cpl || !mediaCpl) return { label: 'Sem dados', cor: 'gray', classe: 'bg-gray-100 text-gray-600' };
  const ratioCpl = cpl / mediaCpl;
  if (ctr < 1 && frequencia > 2) return { label: 'Trocar criativo', cor: 'orange', classe: 'bg-orange-100 text-orange-700', emoji: '🟠' };
  if (ratioCpl > 2 || (frequencia > 3.5 && leads === 0)) return { label: 'Pausar', cor: 'red', classe: 'bg-red-100 text-red-700', emoji: '🔴' };
  if (ratioCpl > 1.3) return { label: 'Observar', cor: 'yellow', classe: 'bg-yellow-100 text-yellow-700', emoji: '🟡' };
  if (ratioCpl < 0.7 && leads > mediaLeads) return { label: 'Escalar', cor: 'green', classe: 'bg-green-100 text-green-700', emoji: '🟢' };
  return { label: 'Manter', cor: 'blue', classe: 'bg-blue-100 text-blue-700', emoji: '🔵' };
}

export function agregarPorCampanha(rows, adVideoMap = {}, bmContext = {}) {
  const { campanhas, encontrarFn } = resolveBM(bmContext);
  const map = {};

  rows.forEach(row => {
    const campaignId = row.campaignId || row.campaignName;
    if (!map[campaignId]) {
      const campDef = encontrarFn(row.campaignName) ||
        campanhas.find(c => c.id === row.campaignId) || null;
      map[campaignId] = {
        campaignId: campDef?.id || campaignId,
        campaignName: row.campaignName,
        campDef,
        fluxo: campDef?.fluxo || 'desconhecido',
        temperatura: campDef?.temperatura || 'frio',
        geo: campDef?.geo || '-',
        verbaSemanal: campDef?.verbaSemanal || 0,
        spend: 0, results: 0, leads: 0, conversations: 0,
        frequency: [], clicks: 0, reach: 0,
        ctrs: [], ctr: 0,
        costPerLead: null, costPerConversation: null,
        adCount: 0,
      };
    }
    const agg = map[campaignId];
    agg.spend += row.spend || 0;
    agg.results += row.results || 0;
    agg.leads += row.leads || 0;
    agg.conversations += row.conversations || 0;
    agg.clicks += row.clicks || 0;
    agg.reach += row.reach || 0;
    if (row.frequency) agg.frequency.push(row.frequency);
    if (row.ctr) agg.ctrs.push(row.ctr);
    agg.adCount += 1;
  });

  return Object.values(map).map(agg => {
    const totalResult = agg.leads > 0 ? agg.leads : agg.conversations;
    const freq = agg.frequency.length ? agg.frequency.reduce((a, b) => a + b, 0) / agg.frequency.length : 0;
    const ctr = agg.ctrs.length ? agg.ctrs.reduce((a, b) => a + b, 0) / agg.ctrs.length : 0;
    const costPerLead = agg.leads > 0 ? agg.spend / agg.leads : null;
    const costPerConversation = agg.conversations > 0 ? agg.spend / agg.conversations : null;
    const taxaLead = agg.reach > 0 ? (agg.leads / agg.reach) * 100 : 0;
    const taxaMensagem = agg.reach > 0 ? (agg.conversations / agg.reach) * 100 : 0;
    const pctVerba = agg.verbaSemanal > 0 ? (agg.spend / agg.verbaSemanal) * 100 : 0;

    return { ...agg, frequency: freq, ctr, costPerLead, costPerConversation, taxaLead, taxaMensagem, pctVerba, totalResult };
  });
}

export function agregarPorAnuncio(rows, adVideoMap = {}, bmContext = {}) {
  const { campanhas, videos, encontrarFn } = resolveBM(bmContext);

  return rows.map(row => {
    const videoId = adVideoMap[row.adName] || null;
    const video = videoId ? videos.find(v => v.id === videoId) : null;
    const campDef = encontrarFn(row.campaignName) ||
      campanhas.find(c => c.id === row.campaignId) || null;
    const taxaLead = row.reach > 0 ? (row.leads / row.reach) * 100 : 0;
    const taxaMensagem = row.reach > 0 ? (row.conversations / row.reach) * 100 : 0;
    const totalResult = row.leads > 0 ? row.leads : row.conversations;
    const cpl = totalResult > 0 ? row.spend / totalResult : null;

    return {
      ...row, campDef,
      fluxo: campDef?.fluxo || 'desconhecido',
      temperatura: campDef?.temperatura || 'frio',
      verbaSemanal: campDef?.verbaSemanal || 0,
      videoId, video, taxaLead, taxaMensagem, totalResult, cpl,
    };
  });
}

export function agregarPorVideo(rows, adVideoMap = {}, bmContext = {}) {
  const { videos } = resolveBM(bmContext);
  const map = {};

  rows.forEach(row => {
    const videoId = adVideoMap[row.adName];
    if (!videoId) return;
    if (!map[videoId]) {
      map[videoId] = {
        videoId, spend: 0, leads: 0, conversations: 0, results: 0,
        clicks: 0, reach: 0, ctrs: [], campanhas: new Set(), adCount: 0,
      };
    }
    const agg = map[videoId];
    agg.spend += row.spend || 0;
    agg.leads += row.leads || 0;
    agg.conversations += row.conversations || 0;
    agg.results += row.results || 0;
    agg.clicks += row.clicks || 0;
    agg.reach += row.reach || 0;
    if (row.ctr) agg.ctrs.push(row.ctr);
    agg.campanhas.add(row.campaignId || row.campaignName);
    agg.adCount += 1;
  });

  return Object.values(map).map(agg => {
    const video = videos.find(v => v.id === agg.videoId);
    const totalResult = agg.leads > 0 ? agg.leads : agg.conversations;
    const cpl = totalResult > 0 ? agg.spend / totalResult : null;
    const taxaLead = agg.reach > 0 ? (agg.leads / agg.reach) * 100 : 0;
    const ctr = agg.ctrs.length ? agg.ctrs.reduce((a, b) => a + b, 0) / agg.ctrs.length : 0;
    return { ...agg, video, nome: video?.nome || agg.videoId, objecao: video?.objecao || '-', temperatura: video?.temperatura || 'frio', totalResult, cpl, taxaLead, ctr, campanhas: [...agg.campanhas] };
  }).sort((a, b) => (a.cpl || 999) - (b.cpl || 999));
}

export function calcularResumo(rows, bmContext = {}) {
  if (!rows || rows.length === 0) return null;
  const { encontrarFn } = resolveBM(bmContext);

  const totalSpend = rows.reduce((s, r) => s + (r.spend || 0), 0);
  const totalLeads = rows.reduce((s, r) => s + (r.leads || 0), 0);
  const totalConversations = rows.reduce((s, r) => s + (r.conversations || 0), 0);
  const totalResults = rows.reduce((s, r) => s + (r.results || 0), 0);
  const totalReach = rows.reduce((s, r) => s + (r.reach || 0), 0);
  const totalClicks = rows.reduce((s, r) => s + (r.clicks || 0), 0);

  const totalResultadosReais = totalLeads + totalConversations;
  const cplMedio = totalResultadosReais > 0 ? totalSpend / totalResultadosReais : null;
  const taxaLeadMedia = totalReach > 0 ? (totalLeads / totalReach) * 100 : 0;
  const taxaMensagemMedia = totalReach > 0 ? (totalConversations / totalReach) * 100 : 0;
  const ctr = totalClicks > 0 && totalReach > 0 ? (totalClicks / totalReach) * 100 : 0;

  const waConversas = totalConversations;
  const waSpend = totalSpend;
  const cplConversa = waConversas > 0 ? waSpend / waConversas : null;

  return {
    totalSpend, totalLeads, totalConversations, totalResults,
    totalReach, totalClicks, cplMedio, cplLead: null, cplConversa,
    taxaLeadMedia, taxaMensagemMedia, ctr, totalResultadosReais,
  };
}

export function calcularResumoFluxo(rows, bmContext = {}) {
  const { fluxos, encontrarFn } = resolveBM(bmContext);
  const fluxoIds = Object.keys(fluxos);
  const map = Object.fromEntries(fluxoIds.map(id => [id, []]));

  rows.forEach(row => {
    const campDef = encontrarFn(row.campaignName);
    if (campDef && map[campDef.fluxo]) map[campDef.fluxo].push(row);
  });

  return Object.entries(map).map(([fluxoId, flRows]) => {
    const fluxo = fluxos[fluxoId];
    const resumo = calcularResumo(flRows, bmContext);
    return { fluxoId, fluxo, resumo, rowCount: flRows.length };
  });
}

export function calcularDadosSemanais(weeklyData, bmContext = {}) {
  return [1, 2, 3, 4].map(week => {
    const rows = weeklyData[week] || [];
    const resumo = calcularResumo(rows, bmContext);
    return {
      semana: `S${week}`, week,
      totalLeads: resumo?.totalLeads || 0,
      totalConversations: resumo?.totalConversations || 0,
      cplMedio: resumo?.cplMedio || 0,
      totalSpend: resumo?.totalSpend || 0,
      totalResultados: resumo?.totalResultadosReais || 0,
    };
  });
}

export function variacao(atual, anterior) {
  if (atual == null || anterior == null || anterior === 0) return null;
  return ((atual - anterior) / anterior) * 100;
}

export function filtrarRows(rows, fluxo = 'todos', temperatura = 'todos', bmContext = {}) {
  const { encontrarFn } = resolveBM(bmContext);
  return rows.filter(row => {
    const campDef = encontrarFn(row.campaignName);
    if (fluxo !== 'todos' && campDef?.fluxo !== fluxo) return false;
    if (temperatura !== 'todos' && campDef?.temperatura !== temperatura) return false;
    return true;
  });
}
