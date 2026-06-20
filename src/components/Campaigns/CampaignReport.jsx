import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { agregarPorCampanha, calcularStatus, calcularResumo, filtrarRows, fmtBRL, fmtPct, fmtNum } from '../../utils/calculations';
import { SortableTable } from '../ui/SortableTable';
import { TempBadge, FluxoBadge, StatusBadge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
import { Download, EyeOff, Eye, RotateCcw } from 'lucide-react';

function exportCSV(data) {
  const headers = ['Campanha','Fluxo','Temp.','Geo','Verba Planejada','Investido','%Verba','Conversas','CPL','CTR','Frequência','Alcance','Taxa Msg','Status'];
  const rows = data.map(c => [
    c.campaignName, c.fluxo, c.temperatura, c.geo,
    c.verbaSemanal, c.spend?.toFixed(2), c.pctVerba?.toFixed(1),
    c.conversations, (c.costPerConversation || 0).toFixed(2),
    c.ctr?.toFixed(2), c.frequency?.toFixed(2), c.reach,
    c.taxaMensagem?.toFixed(3), c.status?.label,
  ]);
  const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'relatorio_campanhas_wesley.csv'; a.click();
  URL.revokeObjectURL(url);
}

export function CampaignReport() {
  const {
    weeklyData, activeWeek, setActiveWeek, activeTemp, setActiveTemp, config,
    campanhasOcultas, ocultarCampanhas, restaurarCampanhas, fluxos, bmContext,
    getWeekLabel,
  } = useApp();

  const [selected, setSelected] = useState(new Set());
  const [mostrarOcultas, setMostrarOcultas] = useState(false);

  const rows = useMemo(() => weeklyData[activeWeek] || [], [weeklyData, activeWeek]);
  const rowsVisiveis = useMemo(() => {
    if (mostrarOcultas) return rows;
    const ocultas = new Set(campanhasOcultas);
    return rows.filter(r => !ocultas.has(r.campaignName) && !ocultas.has(r.campaignId));
  }, [rows, campanhasOcultas, mostrarOcultas]);

  const filteredRows = useMemo(() => filtrarRows(rowsVisiveis, 'todos', activeTemp, bmContext), [rowsVisiveis, activeTemp, bmContext]);
  const resumo = useMemo(() => calcularResumo(filteredRows, bmContext), [filteredRows, bmContext]);

  const campanhaData = useMemo(() => {
    const aggr = agregarPorCampanha(filteredRows, config.adVideoMap, bmContext);
    const mediaCpl = resumo?.cplMedio || 0;
    const mediaLeads = aggr.length > 0 ? aggr.reduce((s, c) => s + (c.leads + c.conversations), 0) / aggr.length : 0;
    return aggr.map(c => {
      const cplEfetivo = c.costPerLead || c.costPerConversation;
      return {
        ...c,
        oculta: campanhasOcultas.includes(c.campaignName) || campanhasOcultas.includes(c.campaignId),
        status: calcularStatus(cplEfetivo, mediaCpl, c.frequency, c.ctr, c.leads + c.conversations, mediaLeads),
      };
    });
  }, [filteredRows, config.adVideoMap, bmContext, resumo, campanhasOcultas]);

  const toggleSelect = (nome) => {
    setSelected(prev => { const next = new Set(prev); next.has(nome) ? next.delete(nome) : next.add(nome); return next; });
  };
  const toggleSelectAll = () => {
    selected.size === campanhaData.length ? setSelected(new Set()) : setSelected(new Set(campanhaData.map(c => c.campaignName)));
  };
  const handleOcultar = () => { ocultarCampanhas([...selected]); setSelected(new Set()); };
  const handleRestaurarTodas = () => { restaurarCampanhas(campanhasOcultas); setMostrarOcultas(false); };

  const columns = [
    { key: '__check__', label: (<input type="checkbox" className="accent-red-600 cursor-pointer" checked={selected.size > 0 && selected.size === campanhaData.length}
        ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < campanhaData.length; }} onChange={toggleSelectAll} />), sortable: false, className: 'w-8',
      render: (_, row) => (<input type="checkbox" className="accent-red-600 cursor-pointer" checked={selected.has(row.campaignName)} onChange={() => toggleSelect(row.campaignName)} />) },
    { key: 'campaignName', label: 'Campanha', render: (v, row) => (<span className={`font-medium text-xs ${row.oculta ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{v}</span>) },
    { key: 'fluxo', label: 'Fluxo', sortable: false, render: v => <FluxoBadge fluxo={v} /> },
    { key: 'temperatura', label: 'Temp.', sortable: false, render: v => <TempBadge temperatura={v} /> },
    { key: 'geo', label: 'Geo', render: v => <span className="text-xs text-gray-500">{v}</span> },
    { key: 'verbaSemanal', label: 'Planejado', render: v => <span className="font-mono text-xs text-gray-600">{fmtBRL(v)}</span> },
    { key: 'spend', label: 'Investido', render: v => <span className="font-mono text-xs font-semibold">{fmtBRL(v)}</span> },
    { key: 'pctVerba', label: <Tooltip text="Investido ÷ Planejado × 100">% Verba</Tooltip>,
      render: v => <span className={`font-mono text-xs font-semibold ${v > 100 ? 'text-red-600' : v > 90 ? 'text-orange-500' : 'text-green-600'}`}>{fmtPct(v, 0)}</span> },
    { key: 'conversations', label: 'Conv. WA', render: v => <span className="font-mono text-xs">{fmtNum(v)}</span> },
    { key: 'costPerConversation', label: 'CPL', render: v => <span className="font-mono text-xs font-semibold">{fmtBRL(v)}</span> },
    { key: 'frequency', label: 'Freq.', render: v => <span className={`font-mono text-xs ${v > 3.5 ? 'text-red-600 font-bold' : v > 2.5 ? 'text-orange-500' : ''}`}>{fmtNum(v, 1)}</span> },
    { key: 'ctr', label: <Tooltip text="Cliques ÷ Alcance × 100">CTR</Tooltip>,
      render: v => <span className={`font-mono text-xs ${v < 1 ? 'text-red-500' : v > 2 ? 'text-green-600' : ''}`}>{fmtPct(v, 1)}</span> },
    { key: 'taxaMensagem', label: <Tooltip text="Conversas ÷ Alcance × 100">Taxa Msg</Tooltip>, render: v => <span className="font-mono text-xs">{fmtPct(v, 2)}</span> },
    { key: 'reach', label: 'Alcance', render: v => <span className="font-mono text-xs">{fmtNum(v)}</span> },
    { key: 'status', label: 'Status', sortable: false,
      render: (v, row) => row.oculta
        ? (<button onClick={() => restaurarCampanhas([row.campaignName])} className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"><RotateCcw size={12} /> Restaurar</button>)
        : <StatusBadge status={v} /> },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Relatório por Campanha</h1>
          <p className="text-sm text-gray-500">
            {campanhaData.length} campanha(s) · {getWeekLabel(activeWeek, 'longo')}
            {campanhasOcultas.length > 0 && (
              <button onClick={() => setMostrarOcultas(v => !v)} className="ml-2 text-xs text-blue-500 hover:underline">
                {mostrarOcultas ? '← Esconder ocultas' : `+ ${campanhasOcultas.length} oculta(s)`}
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
          <button onClick={() => exportCSV(campanhaData)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Download size={14} /> Exportar CSV
          </button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <span className="text-sm font-semibold text-amber-800">{selected.size} selecionada(s)</span>
          <button onClick={handleOcultar} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-semibold">
            <EyeOff size={14} /> Ocultar
          </button>
          <button onClick={() => setSelected(new Set())} className="text-sm px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">Cancelar</button>
        </div>
      )}

      {mostrarOcultas && campanhasOcultas.length > 0 && selected.size === 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <Eye size={16} className="text-blue-500 shrink-0" />
          <span className="text-sm text-blue-800">Mostrando <strong>{campanhasOcultas.length}</strong> oculta(s).</span>
          <button onClick={handleRestaurarTodas} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold ml-auto">
            <RotateCcw size={13} /> Restaurar todas
          </button>
        </div>
      )}

      <SortableTable columns={columns} data={campanhaData} emptyMessage="Sem dados. Importe um CSV da Meta." />
    </div>
  );
}
