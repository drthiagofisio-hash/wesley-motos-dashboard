import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MOCK_WEEKLY_DATA, MOCK_IMPORTS } from '../data/mockData';
import { supabase, SUPABASE_URL } from '../lib/supabase';
import { CAMPANHAS, FLUXOS, encontrarCampanha, VERBA_TOTAL_SEMANAL, VERBA_TOTAL_CAMPANHA } from '../data/campaigns';
import { VIDEOS } from '../data/videos';

const EMPTY_WEEKLY_DATA = { 1: [], 2: [], 3: [], 4: [] };
const STORAGE_KEY = 'wesley_motos_v1';
const BM_ID = 'wesley';

const DEFAULT_CONFIG = {
  clientName: 'Wesley Motos',
  bmName: 'Wesley Motos',
  cplTargets: { whatsapp: 10 },
  adVideoMap: {},
  columnMap: {},
};

const DEFAULT_SEGMENTACAO = [
  {
    temperatura: 'frio',
    emoji: '🔵',
    label: 'FRIO',
    cor: {
      header: 'bg-blue-600',
      borda: 'border-blue-200',
      fundo: 'bg-blue-50',
      badge: 'bg-blue-100 text-blue-700',
      linha: 'hover:bg-blue-50',
    },
    publicos: [
      {
        publico: 'Público geral — interesse em motos',
        videos: [],
        localidade: 'Balsas-MA',
        campanhas: ['WES_MSG_01'],
      },
    ],
  },
];

const DEFAULT_STATE = {
  weeklyData: EMPTY_WEEKLY_DATA,
  weeklyAdsData: EMPTY_WEEKLY_DATA,
  imports: [],
  adsImports: [],
  campanhasOcultas: [],
  anunciosOcultos: [],
  config: DEFAULT_CONFIG,
  segmentacao: DEFAULT_SEGMENTACAO,
};

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    return null;
  } catch {
    return null;
  }
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Erro ao salvar no localStorage', e);
  }
}

const AppContext = createContext(null);

function getInitialState() {
  const stored = loadFromStorage();
  if (!stored) return DEFAULT_STATE;
  return {
    weeklyData:      (stored.weeklyData && Object.keys(stored.weeklyData).length > 0) ? stored.weeklyData : DEFAULT_STATE.weeklyData,
    weeklyAdsData:   (stored.weeklyAdsData && Object.keys(stored.weeklyAdsData).length > 0) ? stored.weeklyAdsData : DEFAULT_STATE.weeklyAdsData,
    imports:          stored.imports          || DEFAULT_STATE.imports,
    adsImports:       stored.adsImports       || DEFAULT_STATE.adsImports,
    campanhasOcultas: stored.campanhasOcultas || DEFAULT_STATE.campanhasOcultas,
    anunciosOcultos:  stored.anunciosOcultos  || DEFAULT_STATE.anunciosOcultos,
    config: stored.config
      ? { ...DEFAULT_STATE.config, ...stored.config, cplTargets: { ...DEFAULT_STATE.config.cplTargets, ...(stored.config.cplTargets || {}) }, adVideoMap: { ...DEFAULT_STATE.config.adVideoMap, ...(stored.config.adVideoMap || {}) } }
      : DEFAULT_STATE.config,
    segmentacao: stored.segmentacao || DEFAULT_STATE.segmentacao,
  };
}

export function AppProvider({ children }) {
  const [state, setState] = useState(getInitialState);
  const [activeWeek, setActiveWeek] = useState(1);
  const [activeFluxo, setActiveFluxo] = useState('todos');
  const [activeTemp, setActiveTemp] = useState('todos');
  const [loading, setLoading] = useState(false);

  const saveTimerRef = useRef(null);
  const hasLoadedRef = useRef(false);

  const applyStoredData = useCallback((stored) => {
    if (!stored) return;
    setState(prev => ({
      weeklyData:      (stored.weeklyData && Object.keys(stored.weeklyData).length > 0) ? stored.weeklyData : prev.weeklyData,
      weeklyAdsData:   (stored.weeklyAdsData && Object.keys(stored.weeklyAdsData).length > 0) ? stored.weeklyAdsData : prev.weeklyAdsData,
      imports:          stored.imports          || prev.imports,
      adsImports:       stored.adsImports       || prev.adsImports,
      campanhasOcultas: stored.campanhasOcultas || prev.campanhasOcultas,
      anunciosOcultos:  stored.anunciosOcultos  || prev.anunciosOcultos,
      config: stored.config
        ? { ...prev.config, ...stored.config, cplTargets: { ...prev.config.cplTargets, ...(stored.config.cplTargets || {}) }, adVideoMap: { ...prev.config.adVideoMap, ...(stored.config.adVideoMap || {}) } }
        : prev.config,
      segmentacao: stored.segmentacao || prev.segmentacao,
    }));
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        if (SUPABASE_URL.includes('SEU_PROJETO')) throw new Error('Supabase não configurado');
        const { data: rows } = await supabase.from('bm_state').select('*').eq('bm_id', BM_ID);
        if (rows?.length > 0) {
          const row = rows[0];
          applyStoredData({
            weeklyData:      row.weekly_data,
            weeklyAdsData:   row.weekly_ads_data,
            imports:         row.imports,
            adsImports:      row.ads_imports,
            campanhasOcultas: row.campanhas_ocultas,
            anunciosOcultos:  row.anuncios_ocultos,
            config:          row.config,
            segmentacao:     row.segmentacao,
          });
          saveToStorage(row);
        }
      } catch (e) {
        console.warn('Supabase indisponível, usando localStorage:', e.message);
      }
      hasLoadedRef.current = true;
    }
    loadData();
  }, [applyStoredData]);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    saveToStorage(state);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await supabase.from('bm_state').upsert({
          bm_id:            BM_ID,
          weekly_data:      state.weeklyData,
          weekly_ads_data:  state.weeklyAdsData,
          imports:          state.imports,
          ads_imports:      state.adsImports,
          campanhas_ocultas: state.campanhasOcultas,
          anuncios_ocultos:  state.anunciosOcultos,
          config:           state.config,
          segmentacao:      state.segmentacao,
          updated_at:       new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Erro ao salvar no Supabase:', e.message);
      }
    }, 800);
  }, [state]);

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const { weeklyData, weeklyAdsData, imports, adsImports, config, segmentacao, campanhasOcultas, anunciosOcultos } = state;

  const getWeekLabel = useCallback((week, formato = 'curto') => {
    const imp = imports.find(i => i.week === week && i.dataInicio) || adsImports.find(i => i.week === week && i.dataInicio);
    if (!imp?.dataInicio) return `S${week}`;
    const fmtDate = (d) => {
      if (!d) return '';
      const parts = d.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
      return d;
    };
    if (formato === 'longo') return `${fmtDate(imp.dataInicio)} a ${fmtDate(imp.dataFim)}`;
    return `${fmtDate(imp.dataInicio)} - ${fmtDate(imp.dataFim)}`;
  }, [imports, adsImports]);

  const bmContext = useMemo(() => ({
    campanhas: CAMPANHAS,
    fluxos: FLUXOS,
    videos: VIDEOS,
    encontrarCampanhaFn: encontrarCampanha,
  }), []);

  const updateConfig = useCallback((updates) => {
    updateState({ config: { ...state.config, ...updates } });
  }, [updateState, state.config]);

  const updateSegmentacao = useCallback((nova) => {
    updateState({ segmentacao: nova });
  }, [updateState]);

  const ocultarCampanhas = useCallback((nomes) => {
    updateState({ campanhasOcultas: [...new Set([...state.campanhasOcultas, ...nomes])] });
  }, [updateState, state.campanhasOcultas]);

  const restaurarCampanhas = useCallback((nomes) => {
    updateState({ campanhasOcultas: state.campanhasOcultas.filter(n => !nomes.includes(n)) });
  }, [updateState, state.campanhasOcultas]);

  const ocultarAnuncios = useCallback((nomes) => {
    updateState({ anunciosOcultos: [...new Set([...state.anunciosOcultos, ...nomes])] });
  }, [updateState, state.anunciosOcultos]);

  const restaurarAnuncios = useCallback((nomes) => {
    updateState({ anunciosOcultos: state.anunciosOcultos.filter(n => !nomes.includes(n)) });
  }, [updateState, state.anunciosOcultos]);

  const importWeekData = useCallback((week, rows, filename, dataInicio = '', dataFim = '') => {
    const newWeeklyData = { ...state.weeklyData, [week]: rows };
    const importEntry = { id: `import_${Date.now()}`, week, importedAt: new Date().toISOString(), filename, rowCount: rows.length, dataInicio, dataFim };
    const sem = state.imports.filter(i => i.week !== week);
    updateState({ weeklyData: newWeeklyData, imports: [...sem, importEntry].sort((a, b) => a.week - b.week) });
  }, [updateState, state.weeklyData, state.imports]);

  const importWeekAdsData = useCallback((week, rows, filename, dataInicio = '', dataFim = '') => {
    const newWeeklyAdsData = { ...state.weeklyAdsData, [week]: rows };
    const importEntry = { id: `ads_import_${Date.now()}`, week, importedAt: new Date().toISOString(), filename, rowCount: rows.length, dataInicio, dataFim };
    const sem = state.adsImports.filter(i => i.week !== week);
    updateState({ weeklyAdsData: newWeeklyAdsData, adsImports: [...sem, importEntry].sort((a, b) => a.week - b.week) });
  }, [updateState, state.weeklyAdsData, state.adsImports]);

  const resetToMock = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const value = {
    activeBM: BM_ID,
    bmLabel: 'Wesley Motos',
    bmContext,
    impostoInfo: { tem: false, pct: 0 },
    campanhas: CAMPANHAS,
    fluxos: FLUXOS,
    videos: VIDEOS,
    encontrarCampanhaFn: encontrarCampanha,
    verbaTotalSemanal: VERBA_TOTAL_SEMANAL,
    verbaTotalCampanha: VERBA_TOTAL_CAMPANHA,
    config, updateConfig,
    segmentacao, updateSegmentacao,
    campanhasOcultas, ocultarCampanhas, restaurarCampanhas,
    anunciosOcultos, ocultarAnuncios, restaurarAnuncios,
    weeklyData, weeklyAdsData,
    imports, adsImports,
    importWeekData, importWeekAdsData,
    getWeekLabel,
    resetToMock,
    activeWeek, setActiveWeek,
    activeFluxo, setActiveFluxo,
    activeTemp, setActiveTemp,
    loading, setLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppProvider');
  return ctx;
}
