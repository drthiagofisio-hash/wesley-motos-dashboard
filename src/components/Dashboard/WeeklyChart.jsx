import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { calcularDadosSemanais } from '../../utils/calculations';
import { fmtBRL, fmtNum } from '../../utils/calculations';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>
            {p.name === 'CPL Médio' ? fmtBRL(p.value) : fmtNum(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export function WeeklyChart({ weeklyData, bmContext = {}, getWeekLabel }) {
  const data = calcularDadosSemanais(weeklyData, bmContext).map(d => ({
    ...d,
    semana: getWeekLabel ? getWeekLabel(d.week) : d.semana,
  }));
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Evolução Semanal — Resultados</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={v => `R$${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line yAxisId="left" type="monotone" dataKey="totalConversations" name="Conversas WhatsApp"
            stroke="#10b981" strokeWidth={2.5} dot={{ r: 5, fill: '#10b981' }} activeDot={{ r: 7 }} />
          <Line yAxisId="right" type="monotone" dataKey="cplMedio" name="CPL Médio"
            stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="5 5"
            dot={{ r: 5, fill: '#f59e0b' }} activeDot={{ r: 7 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CPLChart({ campanhaData }) {
  const data = campanhaData
    .filter(c => c.costPerLead || c.costPerConversation)
    .map(c => ({
      nome: c.campaignName || c.campaignId,
      cpl: parseFloat((c.costPerLead || c.costPerConversation || 0).toFixed(2)),
      fill: '#10b981',
    }))
    .sort((a, b) => a.cpl - b.cpl)
    .slice(0, 10);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">CPL por Campanha (menor é melhor)</h3>
      <div className="flex gap-4 mb-3 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-green-500"></span>WhatsApp</span>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 28)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 60, left: 90, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
          <YAxis type="category" dataKey="nome" tick={{ fontSize: 10 }} width={90} />
          <Tooltip formatter={(v) => [fmtBRL(v), 'CPL']} />
          <Bar dataKey="cpl" name="CPL" radius={[0, 4, 4, 0]} fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
