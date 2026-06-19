import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Save, RotateCcw } from 'lucide-react';

export function Settings() {
  const { config, updateConfig, resetToMock, campanhas } = useApp();
  const [form, setForm] = useState({ ...config });
  const [saved, setSaved] = useState(false);

  const handleSave = () => { updateConfig(form); setSaved(true); setTimeout(() => setSaved(false), 3000); };

  const handleCplTarget = (fluxo, value) => {
    setForm(f => ({ ...f, cplTargets: { ...f.cplTargets, [fluxo]: parseFloat(value) || 0 } }));
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
          <p className="text-sm text-gray-500">Ajuste os parâmetros do sistema — Wesley Motos</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { if (confirm('Restaurar todos os dados?')) resetToMock(); }}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
            <RotateCcw size={14} /> Resetar dados
          </button>
          <button onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-semibold transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-red-600 text-white hover:bg-red-700'}`}>
            <Save size={14} /> {saved ? '✓ Salvo!' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Informações do Cliente</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome do Cliente</label>
            <input type="text" value={form.clientName}
              onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome da BM</label>
            <input type="text" value={form.bmName}
              onChange={e => setForm(f => ({ ...f, bmName: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">CPL Meta por Fluxo</h3>
        <p className="text-xs text-gray-400 mb-4">O sistema usa esses valores para calcular os status das campanhas</p>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp</label>
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden w-48">
            <span className="px-2 text-gray-400 text-sm bg-gray-50">R$</span>
            <input type="number" min="0" step="0.50" value={form.cplTargets?.whatsapp || 0}
              onChange={e => handleCplTarget('whatsapp', e.target.value)}
              className="flex-1 px-2 py-2 text-sm outline-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Verba Semanal por Campanha</h3>
        <p className="text-xs text-gray-400 mb-4">Ajuste caso a verba mude no meio da campanha</p>
        <div className="space-y-2">
          {campanhas.map(camp => (
            <div key={camp.id} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 flex-1">{camp.nome}</span>
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden w-36">
                <span className="px-2 text-gray-400 text-xs bg-gray-50">R$</span>
                <input type="number" min="0" step="0.50" defaultValue={camp.verbaSemanal}
                  className="flex-1 px-2 py-1.5 text-xs outline-none" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm rounded-lg font-semibold transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-red-600 text-white hover:bg-red-700'}`}>
          <Save size={14} /> {saved ? '✓ Salvo!' : 'Salvar configurações'}
        </button>
      </div>
    </div>
  );
}
