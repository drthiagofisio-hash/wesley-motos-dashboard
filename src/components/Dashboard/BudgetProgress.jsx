import { useApp } from '../../context/AppContext';
import { fmtBRL, fmtPct } from '../../utils/calculations';
import { Wallet, AlertTriangle } from 'lucide-react';

function ProgressBar({ value, max, cor = 'green' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const colors = { blue: 'bg-blue-500', green: 'bg-green-500', orange: 'bg-orange-500', red: 'bg-red-500', purple: 'bg-purple-500' };
  const danger = pct > 100;
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${danger ? 'bg-red-500' : (colors[cor] || colors.green)}`}
        style={{ width: `${pct}%` }} />
    </div>
  );
}

export function BudgetProgress({ rows, saldoAnterior = null }) {
  const { fluxos, bmContext, verbaTotalSemanal } = useApp();
  const { encontrarCampanhaFn } = bmContext;

  const fluxosData = Object.entries(fluxos).map(([fluxoId, fluxo]) => {
    const fluxoRows = rows.filter(row => {
      const campDef = encontrarCampanhaFn(row.campaignName);
      return campDef?.fluxo === fluxoId;
    });
    const invested = fluxoRows.reduce((s, r) => s + (r.spend || 0), 0);
    const pct = fluxo.verbaSemanal > 0 ? (invested / fluxo.verbaSemanal) * 100 : 0;
    return { fluxoId, fluxo, invested, pct };
  });

  const totalInvested = rows.reduce((s, r) => s + (r.spend || 0), 0);
  const totalPct = verbaTotalSemanal > 0 ? (totalInvested / verbaTotalSemanal) * 100 : 0;
  const saldoAtual = verbaTotalSemanal - totalInvested;
  const saldoPositivo = saldoAtual >= 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Verba — Semana Atual</h3>

      <div className="mb-5 pb-4 border-b border-gray-100">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm font-semibold text-gray-700">Total Geral</span>
          <span className="text-sm font-bold text-gray-900">
            {fmtBRL(totalInvested)} <span className="text-gray-400 font-normal">/ {fmtBRL(verbaTotalSemanal)}</span>
          </span>
        </div>
        <ProgressBar value={totalInvested} max={verbaTotalSemanal} cor={totalPct > 100 ? 'red' : 'green'} />
        <div className="flex justify-end mt-1">
          <span className={`text-xs font-medium ${totalPct > 100 ? 'text-red-600' : totalPct > 90 ? 'text-orange-600' : 'text-green-600'}`}>
            {fmtPct(totalPct, 1)} utilizado
          </span>
        </div>
      </div>

      {fluxosData.map(({ fluxoId, fluxo, invested, pct }) => (
        <div key={fluxoId} className="mb-3">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">{fluxo.percentual}%</span>
              <span className="text-sm text-gray-700">{fluxo.nome}</span>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {fmtBRL(invested)} <span className="text-gray-400 font-normal text-xs">/ {fmtBRL(fluxo.verbaSemanal)}</span>
            </span>
          </div>
          <ProgressBar value={invested} max={fluxo.verbaSemanal} cor="green" />
          <div className="flex justify-end mt-1">
            <span className={`text-xs ${pct > 100 ? 'text-red-600' : pct > 90 ? 'text-orange-600' : 'text-green-600'} font-medium`}>
              {fmtPct(pct, 1)}
            </span>
          </div>
        </div>
      ))}

      <div className="mt-5 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1.5 mb-3">
          <Wallet size={13} className="text-gray-400" />
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Saldo de Verba</h4>
        </div>
        <div className={`rounded-xl p-4 flex items-center justify-between ${saldoPositivo ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div>
            <p className="text-xs font-medium text-gray-500">Saldo desta semana</p>
            <p className={`text-xl font-bold mt-0.5 ${saldoPositivo ? 'text-green-700' : 'text-red-700'}`}>
              {saldoPositivo ? '+' : ''}{fmtBRL(saldoAtual)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {saldoPositivo ? `${fmtBRL(saldoAtual)} ainda disponíveis` : `Orçamento excedido em ${fmtBRL(Math.abs(saldoAtual))}`}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${saldoPositivo ? 'bg-green-100' : 'bg-red-100'}`}>
            {saldoPositivo ? <Wallet size={22} className="text-green-600" /> : <AlertTriangle size={22} className="text-red-600" />}
          </div>
        </div>

        {saldoAnterior !== null && (
          <div className={`mt-2 rounded-lg px-3 py-2.5 flex items-center justify-between ${saldoAnterior >= 0 ? 'bg-gray-50 border border-gray-100' : 'bg-red-50 border border-red-100'}`}>
            <div>
              <p className="text-xs text-gray-500 font-medium">Saldo da semana anterior</p>
              <p className="text-xs text-gray-400 mt-0.5">{saldoAnterior >= 0 ? 'Verba não utilizada' : 'Excedeu o orçamento'}</p>
            </div>
            <span className={`text-sm font-bold ${saldoAnterior >= 0 ? 'text-gray-600' : 'text-red-600'}`}>
              {saldoAnterior >= 0 ? '+' : ''}{fmtBRL(saldoAnterior)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
