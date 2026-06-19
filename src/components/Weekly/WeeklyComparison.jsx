import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { calcularResumo, agregarPorCampanha, variacao, fmtBRL, fmtPct, fmtNum } from '../../utils/calculations';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { FluxoBadge, TempBadge } from '../ui/Badge';

function VarCell({ valor, inverter = false, formatFn }) {
  if (valor == null) return <span className="text-gray-300">—</span>;
  const positivo = inverter ? valor < 0 : valor > 0;
  const neutro = Math.abs(valor) < 1;
  const Icon = neutro ? Minus : positivo ? TrendingUp : TrendingDown;
  const cor = neutro ? 'text-gray-400' : positivo ? 'text-green-600' : 'text-red-500';
  return (
    <span className={`flex items-center gap-1 font-medium text-xs ${cor}`}>
      <Icon size={12} />
      {formatFn ? formatFn(Math.abs(valor)) : `${Math.abs(valor).toFixed(1)}%`}
    </span>
  );
}

export function WeeklyComparison() {
  const { weeklyData, campanhas, bmContext, getWeekLabel } = useApp();
  const semanas = [1, 2, 3, 4];

  const resumoPorSemana = useMemo(() =>
    Object.fromEntries(semanas.map(w => [w, calcularResumo(weeklyData[w] || [], bmContext)])), [weeklyData, bmContext]);

  const campanhasPorSemana = useMemo(() =>
    Object.fromEntries(semanas.map(w => [w, agregarPorCampanha(weeklyData[w] || [], {}, bmContext)])), [weeklyData, bmContext]);

  const metricas = [
    { key: 'totalSpend', label: 'Total Investido', fmt: fmtBRL, inverter: true },
    { key: 'totalConversations', label: 'Conversas WA', fmt: fmtNum, inverter: false },
    { key: 'cplMedio', label: 'CPL Geral', fmt: fmtBRL, inverter: true },
    { key: 'cplConversa', label: 'Custo por Conv. WA', fmt: fmtBRL, inverter: true },
    { key: 'taxaMensagemMedia', label: 'Taxa de Mensagem', fmt: (v) => fmtPct(v, 2), inverter: false },
    { key: 'totalReach', label: 'Alcance', fmt: fmtNum, inverter: false },
    { key: 'totalResultadosReais', label: 'Total Resultados', fmt: fmtNum, inverter: false },
  ];

  const wColors = ['bg-blue-50', 'bg-purple-50', 'bg-green-50', 'bg-orange-50'];
  const wTextColors = ['text-blue-700', 'text-purple-700', 'text-green-700', 'text-orange-700'];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Comparativo Semanal</h1>
        <p className="text-sm text-gray-500">Evolução de métricas ao longo das 4 semanas</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Métricas Gerais</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Métrica</th>
                {semanas.map(w => <th key={w} className={`px-4 py-3 text-center font-semibold text-xs ${wTextColors[w-1]}`}>{getWeekLabel(w)}</th>)}
                <th className="px-4 py-3 text-center font-semibold text-gray-600 text-xs">Variação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {metricas.map(m => (
                <tr key={m.key} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-700">{m.label}</td>
                  {semanas.map((w, i) => {
                    const val = resumoPorSemana[w]?.[m.key];
                    const anterior = resumoPorSemana[w-1]?.[m.key];
                    const var_ = variacao(val, anterior);
                    return (
                      <td key={w} className={`px-4 py-3 text-center ${wColors[i]}`}>
                        <div className="font-mono font-semibold text-gray-800">{val != null ? m.fmt(val) : '—'}</div>
                        {w > 1 && <div className="flex justify-center mt-1"><VarCell valor={var_} inverter={m.inverter} /></div>}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center">
                    <VarCell valor={variacao(resumoPorSemana[4]?.[m.key], resumoPorSemana[1]?.[m.key])} inverter={m.inverter} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">CPL por Campanha — Todas as Semanas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Campanha</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Fluxo</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Temp.</th>
                {semanas.map(w => <th key={w} className={`px-4 py-3 text-center font-semibold text-xs ${wTextColors[w-1]}`}>{getWeekLabel(w)} CPL</th>)}
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campanhas.map(camp => {
                const cplPorSemana = semanas.map(w => {
                  const campData = campanhasPorSemana[w]?.find(c => c.campaignId === camp.id);
                  return campData?.costPerConversation || campData?.costPerLead || null;
                });
                if (!cplPorSemana.some(v => v !== null)) return null;
                return (
                  <tr key={camp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><span className="text-xs font-medium text-gray-800">{camp.nome}</span></td>
                    <td className="px-4 py-3"><FluxoBadge fluxo={camp.fluxo} /></td>
                    <td className="px-4 py-3"><TempBadge temperatura={camp.temperatura} /></td>
                    {cplPorSemana.map((cpl, i) => (
                      <td key={i} className={`px-4 py-3 text-center ${wColors[i]}`}>
                        <div className="font-mono text-xs font-semibold">{cpl != null ? fmtBRL(cpl) : '—'}</div>
                        {i > 0 && cpl && <div className="flex justify-center mt-0.5"><VarCell valor={variacao(cpl, cplPorSemana[i-1])} inverter={true} /></div>}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center"><VarCell valor={variacao(cplPorSemana[3], cplPorSemana[0])} inverter={true} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
