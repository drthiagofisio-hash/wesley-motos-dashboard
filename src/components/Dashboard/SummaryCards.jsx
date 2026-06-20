import { DollarSign, MessageSquare, MessagesSquare, Target, Eye, Users, UserPlus } from 'lucide-react';
import { fmtBRL, fmtNum, fmtPct } from '../../utils/calculations';

function Card({ icon: Icon, label, value, sub, color, trend }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   text: 'text-blue-700' },
    green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600', text: 'text-green-700' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', text: 'text-purple-700' },
    orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600', text: 'text-orange-700' },
    red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',    text: 'text-red-700' },
    teal:   { bg: 'bg-teal-50',   icon: 'bg-teal-100 text-teal-600',  text: 'text-teal-700' },
    indigo: { bg: 'bg-indigo-50', icon: 'bg-indigo-100 text-indigo-600', text: 'text-indigo-700' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className={`${c.bg} rounded-xl p-3 sm:p-5 border border-white shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className={`p-2 sm:p-2.5 rounded-lg ${c.icon}`}><Icon size={18} /></div>
        {trend !== undefined && trend !== null && (
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-2 sm:mt-4">
        <p className="text-xs sm:text-sm text-gray-500 font-medium">{label}</p>
        <p className={`text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 ${c.text}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{sub}</p>}
      </div>
    </div>
  );
}

export function SummaryCards({ resumo, resumoAnterior, rows = [] }) {
  if (!resumo) return null;

  const trend = (atual, anterior, inverter = false) => {
    if (!anterior || anterior === 0) return null;
    const v = ((atual - anterior) / anterior) * 100;
    return inverter ? -v : v;
  };

  const totalVisitasPerfil = rows.reduce((s, r) => s + (r.profileVisits || 0), 0);
  const totalSeguidores = rows.reduce((s, r) => s + (r.followers || 0), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      <Card icon={DollarSign} label="Total Investido" value={fmtBRL(resumo.totalSpend)}
        sub="na semana selecionada" color="blue"
        trend={trend(resumo.totalSpend, resumoAnterior?.totalSpend)} />
      <Card icon={MessageSquare} label="Conversas WA" value={fmtNum(resumo.totalConversations)}
        sub="mensagens iniciadas" color="green"
        trend={trend(resumo.totalConversations, resumoAnterior?.totalConversations)} />
      <Card icon={MessagesSquare} label="Custo por Conv. WA"
        value={resumo.cplConversa != null ? fmtBRL(resumo.cplConversa) : '—'}
        sub="custo por mensagem" color="purple"
        trend={trend(resumo.cplConversa, resumoAnterior?.cplConversa, true)} />
      <Card icon={Target} label="Taxa de Mensagem" value={fmtPct(resumo.taxaMensagemMedia, 2)}
        sub="conversas ÷ alcance" color="orange"
        trend={trend(resumo.taxaMensagemMedia, resumoAnterior?.taxaMensagemMedia)} />
      <Card icon={Eye} label="Alcance Total" value={fmtNum(resumo.totalReach)}
        sub="pessoas alcançadas" color="red"
        trend={trend(resumo.totalReach, resumoAnterior?.totalReach)} />
      <Card icon={Users} label="Visitas ao Perfil" value={fmtNum(totalVisitasPerfil)}
        sub="visitas no Instagram" color="indigo" />
      <Card icon={UserPlus} label="Seguidores" value={fmtNum(totalSeguidores)}
        sub="novos seguidores" color="teal" />
    </div>
  );
}
