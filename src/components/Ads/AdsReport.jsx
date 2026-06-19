import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { agregarPorAnuncio, calcularStatus, calcularResumo, filtrarRows, fmtBRL, fmtPct, fmtNum } from '../../utils/calculations';
import { SortableTable } from '../ui/SortableTable';
import { TempBadge, FluxoBadge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
import { Download, EyeOff, Eye, RotateCcw } from 'lucide-react';

function exportCSV(data) {
  const headers = ['Anúncio','Campanha','Fluxo','Temp.','Investido','Resultados','Conv.WA','CPL','CTR','Freq.','Alcance','Taxa Msg'];
  const rows = data.map(r => [
    r.adName, r.campaignName, r.fluxo, r.temperatura,
    r.spend?.toFixed(2), r.totalResult, r.conversations,
    (r.cpl || 0).toFixed(2), r.ctr?.toFixed(2), r.frequency?.toFixed(2),
    r.reach, r.taxaMensagem?.toFixed(3),
  ]);
  const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'relatorio_anuncios_wesley.csv'; a.click();
  URL.revokeObjectURL(url);
}

export function AdsReport() {
  const {
    weeklyAdsData, weeklyData, activeWeek, setActiveWeek,
    activeTemp, setActiveTemp, config, fluxos, bmContext,
    anunciosOcultos, ocultarAnuncios, restaurarAnuncios,
    getWeekLabel,
  } = useApp();

  const [selected, setSelected] = useState(new Set());
  const [mostrarOcultos, setMostrarOcultos] = useState(false);

  const rows = useMemo(() => {
    const adsRows = weeklyAdsData[activeWeek] || [];
    return adsRows.length > 0 ? adsRows : weeklyData[activeWeek] || [];
  }, [weeklyAdsData, weeklyData, activeWeek]);

  const rowsVisiveis = useMemo(() => {
    if (mostrarOcultos) return rows;
    const ocultos = new Set(anunciosOcultos);
    return rows.filter(r => !ocultos.has(r.adName));
  }, [rows, anunciosOcultos, mostrarOcultos]);

  const filteredRows = useMemo(() => filtrarRows(rowsVisiveis, 'todos', activeTemp, bmContext), [rowsVisiveis, activeTemp, bmContext]);
  const resumo = useMemo(() => calcularResumo(filteredRows, bmContext), [filteredRows, bmContext]);

  const anuncioData = useMemo(() => {
    const ads = agregarPorAnuncio(filteredRows, config.adVideoMap, bmContext);
    const mediaCpl = resumo?.cplMedio || 0;
    const mediaResult = ads.length > 0 ? ads.reduce((s, a) => s + (a.totalResult || 0), 0) / ads.length : 0;

    const campanhaGroups = {};
    ads.forEach(ad => {
      if (!campanhaGroups[ad.campaignName]) campanhaGroups[ad.campaignName] = [];
      campanhaGroups[ad.campaignName].push(ad);
    });
    const rankedAds = {};
    Object.values(campanhaGroups).forEach(group => {
      const sorted = [...group].sort((a, b) => (a.cpl || 999) - (b.cpl || 999));
      sorted.forEach((ad, i) => { rankedAds[`${ad.campaignName}__${ad.adName}`] = i + 1; });
    });

    return ads.map(ad => ({
      ...ad,
      oculto: anunciosOcultos.includes(ad.adName),
      status: calcularStatus(ad.cpl, mediaCpl, ad.frequency, ad.ctr, ad.totalResult, mediaResult),
      rankEmCampanha: rankedAds[`${ad.campaignName}__${ad.adName}`] || '-',
    }));
  }, [filteredRows, config.adVideoMap, bmContext, resumo, anunciosOcultos]);

  const toggleSelect = (adName) => {
    setSelected(prev => { const next = new Set(prev); next.has(adName) ? next.delete(adName) : next.add(adName); return next; });
  };
  const toggleSelectAll = () => {
    selected.size === anuncioData.length ? setSelected(new Set()) : setSelected(new Set(anuncioData.map(a => a.adName)));
  };
  const handleOcultar = () => { ocultarAnuncios([...selected]); setSelected(new Set()); };
  const handleRestaurarTodos = () => { restaurarAnuncios(anunciosOcultos); setMostrarOcultos(false); };

  const rankIcon = (rank) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

  const columns = [
    { key: '__check__', label: (<input type="checkbox" className="accent-red-600 cursor-pointer" checked={selected.size > 0 && selected.size === anuncioData.length}
        ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < anuncioData.length; }} onChange={toggleSelectAll} />), sortable: false, className: 'w-8',
      render: (_, row) => (<input type="checkbox" className="accent-red-600 cursor-pointer" checked={selected.has(row.adName)} onChange={() => toggleSelect(row.adName)} />) },
    { key: 'rankEmCampanha', label: 'Rank', render: v => <span className="text-lg">{rankIcon(v)}</span> },
    { key: 'adName', label: 'Nome do Anúncio',
      render: (v, row) => (<span className={`font-medium text-xs max-w-[220px] block truncate ${row.oculto ? 'text-gray-400 line-through' : 'text-gray-800'}`} title={v}>{v}</span>) },
    { key: 'campaignName', label: 'Campanha', render: v => <span className="text-xs text-gray-500 max-w-[160px] block truncate" title={v}>{v}</span> },
    { key: 'fluxo', label: 'Fluxo', sortable: false, render: v => <FluxoBadge fluxo={v} /> },
    { key: 'spend', label: 'Investido', render: v => <span className="font-mono text-xs">{fmtBRL(v)}</span> },
    { key: 'totalResult', label: 'Result.', render: v => <span className="font-mono text-xs font-semibold">{fmtNum(v)}</span> },
    { key: 'conversations', label: 'Conv.', render: v => <span className="font-mono text-xs">{fmtNum(v)}</span> },
    { key: 'cpl', label: 'CPL', render: v => <span className={`font-mono text-xs font-semibold ${v && v < 10 ? 'text-green-600' : v && v > 30 ? 'text-red-600' : ''}`}>{fmtBRL(v)}</span> },
    { key: 'ctr', label: <Tooltip text="Cliques ÷ Alcance × 100">CTR</Tooltip>, render: v => <span className={`font-mono text-xs ${v < 1 ? 'text-red-500' : ''}`}>{fmtPct(v, 1)}</span> },
    { key: 'frequency', label: 'Freq.', render: v => <span className={`font-mono text-xs ${v > 3.5 ? 'text-red-600 font-bold' : ''}`}>{fmtNum(v, 1)}</span> },
    { key: 'reach', label: 'Alcance', render: v => <span className="font-mono text-xs">{fmtNum(v)}</span> },
    { key: 'taxaMensagem', label: <Tooltip text="Conversas ÷ Alcance × 100">Taxa Msg</Tooltip>, render: v => <span className="font-mono text-xs">{fmtPct(v, 2)}</span> },
    { key: '__acao__', label: '', sortable: false,
      render: (_, row) => row.oculto ? (
        <button onClick={() => restaurarAnuncios([row.adName])} className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700">
          <RotateCcw size={12} /> Restaurar
        </button>
      ) : null },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Relatório por Anúncio</h1>
          <p className="text-sm text-gray-500">
            {anuncioData.length} anúncio(s) · {getWeekLabel(activeWeek, 'longo')}
            {anunciosOcultos.length > 0 && (
              <button onClick={() => setMostrarOcultos(v => !v)} className="ml-2 text-xs text-blue-500 hover:underline">
                {mostrarOcultos ? '← Esconder ocultos' : `+ ${anunciosOcultos.length} oculto(s)`}
              </button>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
            <span className="text-gray-500 font-medium">Semana:</span>
            {[1, 2, 3, 4].map(w => (
              <button key={w} onClick={() => setActiveWeek(w)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors text-xs ${activeWeek === w ? 'bg-red-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>{getWeekLabel(w)}</button>
            ))}
          </div>
          <button onClick={() => exportCSV(anuncioData)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Download size={14} /> Exportar CSV
          </button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <span className="text-sm font-semibold text-amber-800">{selected.size} selecionado(s)</span>
          <button onClick={handleOcultar} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-semibold">
            <EyeOff size={14} /> Ocultar
          </button>
          <button onClick={() => setSelected(new Set())} className="text-sm px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">Cancelar</button>
        </div>
      )}

      {mostrarOcultos && anunciosOcultos.length > 0 && selected.size === 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <Eye size={16} className="text-blue-500 shrink-0" />
          <span className="text-sm text-blue-800">Mostrando <strong>{anunciosOcultos.length}</strong> oculto(s).</span>
          <button onClick={handleRestaurarTodos} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold ml-auto">
            <RotateCcw size={13} /> Restaurar todos
          </button>
        </div>
      )}

      <SortableTable columns={columns} data={anuncioData} emptyMessage="Sem dados para a semana selecionada." />
    </div>
  );
}
