import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { calcularResumo, agregarPorCampanha, filtrarRows, calcularStatus } from '../../utils/calculations';
import { SummaryCards } from './SummaryCards';
import { BudgetProgress } from './BudgetProgress';
import { WeeklyChart, CPLChart } from './WeeklyChart';
import { SortableTable } from '../ui/SortableTable';
import { StatusBadge, TempBadge, FluxoBadge } from '../ui/Badge';
import { fmtBRL, fmtPct, fmtNum } from '../../utils/calculations';

export function Dashboard() {
  const {
    weeklyData, activeWeek, setActiveWeek,
    activeFluxo, setActiveFluxo,
    activeTemp, setActiveTemp,
    config, campanhasOcultas,
    fluxos, bmContext,
    verbaTotalSemanal,
    imports,
    getWeekLabel,
  } = useApp();

  const importAtual = imports.find(i => i.week === activeWeek);

  const rows = useMemo(() => {
    const all = weeklyData[activeWeek] || [];
    const ocultas = new Set(campanhasOcultas);
    return all.filter(r => !ocultas.has(r.campaignName) && !ocultas.has(r.campaignId));
  }, [weeklyData, activeWeek, campanhasOcultas]);

  const rowsAnterior = useMemo(() => activeWeek > 1 ? weeklyData[activeWeek - 1] || [] : [], [weeklyData, activeWeek]);

  const filteredRows = useMemo(() => filtrarRows(rows, activeFluxo, activeTemp, bmContext), [rows, activeFluxo, activeTemp, bmContext]);
  const resumo = useMemo(() => calcularResumo(filteredRows, bmContext), [filteredRows, bmContext]);
  const resumoAnterior = useMemo(() => calcularResumo(rowsAnterior, bmContext), [rowsAnterior, bmContext]);

  const campanhaData = useMemo(() => {
    const aggr = agregarPorCampanha(filteredRows, config.adVideoMap, bmContext);
    const mediaCpl = resumo?.cplMedio || 0;
    const mediaLeads = aggr.length > 0 ? aggr.reduce((s, c) => s + (c.leads + c.conversations), 0) / aggr.length : 0;
    return aggr.map(c => {
      const cplEfetivo = c.costPerLead || c.costPerConversation;
      return { ...c, status: calcularStatus(cplEfetivo, mediaCpl, c.frequency, c.ctr, c.leads + c.conversations, mediaLeads) };
    });
  }, [filteredRows, config.adVideoMap, bmContext, resumo]);

  const alertas = useMemo(() =>
    campanhaData.filter(c => ['Pausar', 'Trocar criativo', 'Escalar'].includes(c.status?.label)),
    [campanhaData]
  );

  const saldoAnterior = useMemo(() => {
    if (activeWeek <= 1) return null;
    const totalInvestidoAnterior = rowsAnterior.reduce((s, r) => s + (r.spend || 0), 0);
    return verbaTotalSemanal - totalInvestidoAnterior;
  }, [rowsAnterior, verbaTotalSemanal, activeWeek]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard Geral</h1>
          <p className="text-sm text-gray-500">
            Wesley Motos · Campanha de Tráfego · Balsas-MA
            {importAtual?.dataInicio && (
              <span className="ml-2 text-red-600 font-medium">
                · {importAtual.dataInicio} até {importAtual.dataFim}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
            <span className="text-gray-500 font-medium">Período:</span>
            {[1, 2, 3, 4].map(w => (
              <button key={w} onClick={() => setActiveWeek(w)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors text-xs ${activeWeek === w ? 'bg-red-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                {getWeekLabel(w)}
              </button>
            ))}
          </div>
          <select value={activeTemp} onChange={e => setActiveTemp(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700">
            <option value="todos">Todas as temperaturas</option>
            <option value="quente">🔴 Quente</option>
            <option value="morno">🟠 Morno</option>
            <option value="frio">🔵 Frio</option>
          </select>
        </div>
      </div>

      <SummaryCards resumo={resumo} resumoAnterior={resumoAnterior} rows={filteredRows} />

      {alertas.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">⚡ Alertas de campanha</h3>
          <div className="flex flex-wrap gap-2">
            {alertas.map(c => (
              <div key={c.campaignId} className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-1.5 text-sm">
                <StatusBadge status={c.status} />
                <span className="text-gray-700 font-medium">{c.campaignName}</span>
                <span className="text-gray-400 text-xs">{fmtBRL(c.costPerLead || c.costPerConversation)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <WeeklyChart weeklyData={weeklyData} bmContext={bmContext} getWeekLabel={getWeekLabel} />
        </div>
        <div>
          <BudgetProgress rows={filteredRows} saldoAnterior={saldoAnterior} />
        </div>
      </div>

      <CPLChart campanhaData={campanhaData} />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Status das Campanhas — {getWeekLabel(activeWeek, 'longo')}</h3>
        </div>
        <SortableTable
          columns={[
            { key: 'campaignName', label: 'Campanha', render: (v) => <span className="font-medium text-gray-800 text-xs">{v}</span> },
            { key: 'fluxo', label: 'Fluxo', render: (v) => <FluxoBadge fluxo={v} /> },
            { key: 'temperatura', label: 'Temp.', render: (v) => <TempBadge temperatura={v} /> },
            { key: 'spend', label: 'Investido', render: (v) => <span className="font-mono text-xs">{fmtBRL(v)}</span> },
            { key: 'pctVerba', label: '% Verba', render: (v) => <span className={`text-xs font-medium ${v > 100 ? 'text-red-600' : v > 90 ? 'text-orange-600' : 'text-gray-700'}`}>{fmtPct(v, 0)}</span> },
            { key: 'totalResult', label: 'Resultados' },
            { key: 'costPerConversation', label: 'CPL', render: (v, row) => <span className="font-mono text-xs">{fmtBRL(v || row.costPerLead)}</span> },
            { key: 'ctr', label: 'CTR', render: (v) => <span className="font-mono text-xs">{fmtPct(v, 1)}</span> },
            { key: 'frequency', label: 'Freq.', render: (v) => <span className={`text-xs ${v > 3 ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>{fmtNum(v, 1)}</span> },
            { key: 'status', label: 'Status', sortable: false, render: (v) => <StatusBadge status={v} /> },
          ]}
          data={campanhaData}
          emptyMessage="Sem dados para a semana selecionada. Importe um CSV da Meta."
        />
      </div>
    </div>
  );
}
