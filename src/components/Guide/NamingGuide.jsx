import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Copy, CheckCheck, BookOpen } from 'lucide-react';
import { TempBadge, FluxoBadge } from '../ui/Badge';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={handleCopy}
      className={`p-1.5 rounded-md transition-all ${copied ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}>
      {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
    </button>
  );
}

function CopyCell({ value }) {
  return (
    <div className="flex items-center gap-1 font-mono text-xs text-gray-800 bg-gray-50 rounded px-2 py-1 border border-gray-200 w-fit">
      <span>{value}</span>
      <CopyButton text={value} />
    </div>
  );
}

export function NamingGuide() {
  const { campanhas, fluxos } = useApp();

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-red-100">
          <BookOpen size={22} className="text-red-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Guia de Nomes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Nomes exatos para criar as campanhas no Meta Ads Manager · <span className="font-semibold text-red-600">Wesley Motos</span></p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">⚠️ Por que os nomes precisam ser exatos?</p>
        <p>Quando você importar o CSV da Meta, o sistema identifica cada campanha pelo nome. Se o nome no Meta for diferente, os dados não serão vinculados.</p>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Crie as campanhas no Meta Ads usando exatamente os nomes abaixo no campo <strong>"Nome da campanha"</strong>:
        </p>

        {Object.entries(fluxos).map(([fluxoId, fluxo]) => {
          const camps = campanhas.filter(c => c.fluxo === fluxoId);
          return (
            <div key={fluxoId} className="rounded-xl border-2 p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <FluxoBadge fluxo={fluxoId} />
                <span className="text-sm font-semibold text-gray-700">{fluxo.nome}</span>
                <span className="text-xs text-gray-400">· {fluxo.percentual}% da verba · R$ {fluxo.verbaSemanal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /semana</span>
              </div>
              <div className="space-y-2">
                {camps.map(camp => (
                  <div key={camp.id} className="flex flex-wrap items-center gap-3 bg-white rounded-lg border border-gray-200 px-3 py-2.5">
                    <span className="text-xs font-bold text-gray-400 w-28 shrink-0">{camp.id}</span>
                    <CopyCell value={camp.nome} />
                    <TempBadge temperatura={camp.temperatura} />
                    <span className="text-xs text-gray-400 hidden md:block">{camp.geo}</span>
                    <div className="flex flex-col items-end ml-auto">
                      <span className="text-xs text-gray-500 font-medium">R$ {camp.verbaSemanal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/sem</span>
                      <span className="text-xs text-gray-400">R$ {camp.verbaSemanal ? (camp.verbaSemanal / 7).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}/dia</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
        ✅ Os nomes dos anúncios serão puxados automaticamente do CSV importado. Você pode nomeá-los como quiser no Meta Ads.
      </div>
    </div>
  );
}
