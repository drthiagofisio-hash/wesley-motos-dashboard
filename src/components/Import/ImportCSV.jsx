import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, AlertCircle, CheckCircle2, FileText, BarChart2, Film } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fmtBRL, fmtNum } from '../../utils/calculations';

const MAP_CAMP = {
  nomeCampanha:    ['nome da campanha', 'campaign name'],
  investido:       ['valor usado (brl)', 'amount spent (brl)', 'valor usado', 'valor gasto (brl)'],
  resultados:      ['resultados', 'results'],
  indicadorResult: ['indicador de resultados', 'result indicator'],
  custoResultado:  ['custo por resultados', 'custo por resultado', 'cost per result'],
  taxaMsg:         ['taxa de msg'],
  retencao:        ['retenção'],
  visitasPerfil:   ['visitas ao perfil do instagram', 'visitas ao perfil', 'profile visits'],
  taxaVisitaInsta: ['taxa visita insta'],
  seguidores:      ['seguidores no instagram', 'seguidores', 'followers'],
  taxaSeguidor:    ['taxa de seguidor'],
  cliques:         ['cliques no link', 'link clicks', 'cliques'],
  cpc:             ['cpc (custo por clique no link) (brl)', 'cpc', 'custo por clique'],
  ctr:             ['ctr único (taxa de cliques no link)', 'ctr (taxa de cliques no link)', 'ctr'],
  cpm:             ['cpm (custo por 1.000 impressões)', 'cpm'],
  impressoes:      ['impressões', 'impressions'],
  alcance:         ['alcance', 'reach'],
  frequencia:      ['frequência', 'frequency'],
};

const MAP_ADS = {
  nomeAnuncio:     ['nome do anúncio', 'ad name'],
  nomeCampanha:    ['nome da campanha', 'campaign name'],
  veiculacao:      ['veiculação de anúncio', 'veiculação da campanha'],
  investido:       ['valor usado (brl)', 'amount spent (brl)', 'valor usado'],
  resultados:      ['resultados', 'results'],
  indicadorResult: ['indicador de resultados', 'result indicator'],
  custoResultado:  ['custo por resultados', 'custo por resultado', 'cost per result'],
  qualidade:       ['classificação de qualidade'],
  taxaMsg:         ['taxa de msg'],
  retencao:        ['retenção'],
  visitasPerfil:   ['visitas ao perfil do instagram', 'visitas ao perfil', 'profile visits'],
  taxaVisitaInsta: ['taxa visita insta'],
  seguidores:      ['seguidores no instagram', 'seguidores', 'followers'],
  taxaSeguidor:    ['taxa de seguidor'],
  cliques:         ['cliques no link', 'link clicks', 'cliques'],
  cpc:             ['cpc (custo por clique no link) (brl)', 'cpc'],
  ctr:             ['ctr único (taxa de cliques no link)', 'ctr'],
  cpm:             ['cpm (custo por 1.000 impressões)', 'cpm'],
  impressoes:      ['impressões', 'impressions'],
  alcance:         ['alcance', 'reach'],
  frequencia:      ['frequência', 'frequency'],
};

const LABELS_CAMP = {
  nomeCampanha:    'Nome da Campanha',
  investido:       'Valor Investido (R$)',
  resultados:      'Resultados (Mensagens WA)',
  custoResultado:  'Custo por Mensagem',
  visitasPerfil:   'Visitas ao Perfil Instagram',
  seguidores:      'Seguidores Instagram',
  cliques:         'Cliques no Link',
  ctr:             'CTR (%)',
  cpm:             'CPM',
  alcance:         'Alcance',
  frequencia:      'Frequência',
  impressoes:      'Impressões',
};

const LABELS_ADS = {
  nomeAnuncio:     'Nome do Anúncio',
  nomeCampanha:    'Nome da Campanha',
  investido:       'Valor Investido (R$)',
  resultados:      'Resultados (Mensagens WA)',
  custoResultado:  'Custo por Mensagem',
  qualidade:       'Classificação de Qualidade',
  visitasPerfil:   'Visitas ao Perfil Instagram',
  seguidores:      'Seguidores Instagram',
  cliques:         'Cliques no Link',
  ctr:             'CTR (%)',
  cpm:             'CPM',
  alcance:         'Alcance',
  frequencia:      'Frequência',
  impressoes:      'Impressões',
};

function encontrarColuna(headers, cands) {
  const lower = headers.map(h => h.toLowerCase().trim());
  for (const c of cands) { const i = lower.indexOf(c.toLowerCase()); if (i !== -1) return headers[i]; }
  for (const c of cands) { const idx = lower.findIndex(h => h.includes(c.toLowerCase())); if (idx !== -1) return headers[idx]; }
  return null;
}

function parseNum(v) {
  if (!v || v === '--' || v === '-' || v === '–' || v === '') return 0;
  const s = String(v).replace(/R\$\s?/g, '').trim();
  if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(s)) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  if (/^\d+(,\d+)?$/.test(s)) return parseFloat(s.replace(',', '.'));
  return parseFloat(s.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
}

function detectarDatas(rawData, headers) {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());
  const colInicio = headers[lowerHeaders.findIndex(h => h.includes('início dos relatórios') || h.includes('reporting starts'))] || null;
  const colFim = headers[lowerHeaders.findIndex(h => h.includes('encerramento dos relatórios') || h.includes('reporting ends'))] || null;

  let dataInicio = '', dataFim = '';
  if (colInicio && rawData.length > 0) dataInicio = rawData[0][colInicio] || '';
  if (colFim && rawData.length > 0) dataFim = rawData[0][colFim] || '';

  return { dataInicio, dataFim };
}

function FluxoImport({ modo, semanaNum, setSemanaNum, dataInicio, setDataInicio, dataFim, setDataFim, onSucesso }) {
  const { importWeekData, importWeekAdsData, bmContext } = useApp();
  const fileRef = useRef();
  const [etapa, setEtapa] = useState('upload');
  const [rawData, setRawData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapa, setMapa] = useState({});
  const [preview, setPreview] = useState(null);
  const [erro, setErro] = useState('');
  const [nomeArq, setNomeArq] = useState('');

  const mapDef = modo === 'camp' ? MAP_CAMP : MAP_ADS;
  const labels = modo === 'camp' ? LABELS_CAMP : LABELS_ADS;

  function handleFile(e) {
    const file = e.target.files[0]; if (!file) return;
    setErro(''); setNomeArq(file.name);
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: ({ data: rows, meta }) => {
        if (!rows.length) { setErro('Arquivo vazio.'); return; }
        const cols = meta.fields || Object.keys(rows[0]);
        setHeaders(cols); setRawData(rows);
        const auto = {};
        Object.entries(mapDef).forEach(([k, cands]) => { const f = encontrarColuna(cols, cands); if (f) auto[k] = f; });
        setMapa(auto);

        const datas = detectarDatas(rows, cols);
        if (datas.dataInicio && !dataInicio) setDataInicio(datas.dataInicio);
        if (datas.dataFim && !dataFim) setDataFim(datas.dataFim);

        setEtapa('mapeamento');
      },
      error: () => setErro('Erro ao ler o CSV.'),
    });
  }

  function gerarPreview() {
    const { encontrarCampanhaFn } = bmContext;

    if (modo === 'camp') {
      const rows = rawData.map(row => {
        const campaignName = mapa.nomeCampanha ? String(row[mapa.nomeCampanha] || '').trim() : '';
        if (!campaignName || campaignName.toLowerCase().includes('total')) return null;
        const campDef = encontrarCampanhaFn(campaignName);

        const investido = parseNum(mapa.investido ? row[mapa.investido] : 0);
        const resultados = parseNum(mapa.resultados ? row[mapa.resultados] : 0);
        const custoResultado = parseNum(mapa.custoResultado ? row[mapa.custoResultado] : 0);

        return {
          campaignId: campDef?.id || campaignName,
          campaignName,
          adSetName: '',
          adName: '',
          spend: investido,
          results: resultados,
          leads: 0,
          conversations: resultados,
          costPerResult: custoResultado,
          costPerLead: 0,
          costPerConversation: custoResultado || (resultados > 0 ? investido / resultados : 0),
          frequency: parseNum(mapa.frequencia ? row[mapa.frequencia] : 0),
          clicks: parseNum(mapa.cliques ? row[mapa.cliques] : 0),
          cpc: parseNum(mapa.cpc ? row[mapa.cpc] : 0),
          ctr: parseNum(mapa.ctr ? row[mapa.ctr] : 0),
          reach: parseNum(mapa.alcance ? row[mapa.alcance] : 0),
          impressions: parseNum(mapa.impressoes ? row[mapa.impressoes] : 0),
          profileVisits: parseNum(mapa.visitasPerfil ? row[mapa.visitasPerfil] : 0),
          followers: parseNum(mapa.seguidores ? row[mapa.seguidores] : 0),
        };
      }).filter(Boolean);

      const totalInvestido = rows.reduce((s, r) => s + r.spend, 0);
      const totalConversas = rows.reduce((s, r) => s + r.conversations, 0);
      const totalVisitas = rows.reduce((s, r) => s + r.profileVisits, 0);
      const totalSeguidores = rows.reduce((s, r) => s + r.followers, 0);
      const totalAlcance = rows.reduce((s, r) => s + r.reach, 0);
      const cplMedio = totalConversas > 0 ? totalInvestido / totalConversas : 0;

      setPreview({ rows, totalInvestido, totalConversas, totalVisitas, totalSeguidores, totalAlcance, cplMedio, linhas: rows.length });
    } else {
      const rows = rawData.map((row, i) => {
        const adName = mapa.nomeAnuncio ? String(row[mapa.nomeAnuncio] || '').trim() : '';
        const campaignName = mapa.nomeCampanha ? String(row[mapa.nomeCampanha] || '').trim() : '';
        if ((!adName && !campaignName) || campaignName.toLowerCase().includes('total')) return null;
        const campDef = encontrarCampanhaFn(campaignName);

        const investido = parseNum(mapa.investido ? row[mapa.investido] : 0);
        const resultados = parseNum(mapa.resultados ? row[mapa.resultados] : 0);
        const custoResultado = parseNum(mapa.custoResultado ? row[mapa.custoResultado] : 0);

        return {
          campaignId: campDef?.id || campaignName,
          campaignName,
          adSetName: '',
          adName,
          spend: investido,
          results: resultados,
          leads: 0,
          conversations: resultados,
          costPerResult: custoResultado,
          costPerLead: 0,
          costPerConversation: custoResultado || (resultados > 0 ? investido / resultados : 0),
          frequency: parseNum(mapa.frequencia ? row[mapa.frequencia] : 0),
          clicks: parseNum(mapa.cliques ? row[mapa.cliques] : 0),
          cpc: parseNum(mapa.cpc ? row[mapa.cpc] : 0),
          ctr: parseNum(mapa.ctr ? row[mapa.ctr] : 0),
          reach: parseNum(mapa.alcance ? row[mapa.alcance] : 0),
          impressions: parseNum(mapa.impressoes ? row[mapa.impressoes] : 0),
          profileVisits: parseNum(mapa.visitasPerfil ? row[mapa.visitasPerfil] : 0),
          followers: parseNum(mapa.seguidores ? row[mapa.seguidores] : 0),
        };
      }).filter(Boolean);

      const totalInvestido = rows.reduce((s, r) => s + r.spend, 0);
      const totalConversas = rows.reduce((s, r) => s + r.conversations, 0);
      const totalVisitas = rows.reduce((s, r) => s + r.profileVisits, 0);
      const totalSeguidores = rows.reduce((s, r) => s + r.followers, 0);
      const cplMedio = totalConversas > 0 ? totalInvestido / totalConversas : 0;

      setPreview({ rows, totalInvestido, totalConversas, totalVisitas, totalSeguidores, cplMedio, linhas: rows.length });
    }
    setEtapa('confirmacao');
  }

  function salvar() {
    if (modo === 'camp') {
      importWeekData(semanaNum, preview.rows, nomeArq, dataInicio, dataFim);
    } else {
      importWeekAdsData(semanaNum, preview.rows, nomeArq, dataInicio, dataFim);
    }
    onSucesso();
    setEtapa('upload'); setRawData(null); setHeaders([]); setMapa({}); setPreview(null); setNomeArq('');
    if (fileRef.current) fileRef.current.value = '';
  }

  if (etapa === 'upload') return (
    <div className="space-y-4">
      {erro && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600"><AlertCircle size={15}/> {erro}</div>}
      <div onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-200 hover:border-red-400 rounded-2xl p-10 text-center cursor-pointer transition-colors group">
        <div className="w-12 h-12 bg-gray-100 group-hover:bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors">
          <Upload size={22} className="text-gray-400 group-hover:text-red-500" />
        </div>
        <p className="text-gray-600 font-semibold text-sm">Clique para selecionar o CSV</p>
        <p className="text-gray-400 text-xs mt-1">Exportado do Gerenciador de Anúncios da Meta</p>
      </div>
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-gray-500 text-xs font-semibold mb-1">Nº da semana</label>
          <input type="number" value={semanaNum} onChange={e => setSemanaNum(Number(e.target.value))}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-red-400" />
        </div>
        <div>
          <label className="block text-gray-500 text-xs font-semibold mb-1">Data início</label>
          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-red-400" />
        </div>
        <div>
          <label className="block text-gray-500 text-xs font-semibold mb-1">Data fim</label>
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-red-400" />
        </div>
      </div>
    </div>
  );

  if (etapa === 'mapeamento') return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200">
        <FileText size={16} className="text-red-500" />
        <p className="text-gray-700 text-sm font-medium">{nomeArq}</p>
      </div>
      {dataInicio && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-xs text-green-700">
          <CheckCircle2 size={13} />
          Período detectado: <strong>{dataInicio}</strong> até <strong>{dataFim}</strong>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(labels).map(([campo, label]) => (
          <div key={campo}>
            <label className="block text-gray-500 text-xs font-semibold mb-1">{label}</label>
            <select value={mapa[campo] || ''} onChange={e => setMapa(p => ({ ...p, [campo]: e.target.value || null }))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-600 text-xs focus:outline-none focus:border-red-400">
              <option value="">— não mapear —</option>
              {headers.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={() => setEtapa('upload')} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors">Voltar</button>
        <button onClick={gerarPreview} className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors">Gerar prévia</button>
      </div>
    </div>
  );

  if (etapa === 'confirmacao' && preview) {
    const cards = [
      { label: 'Investido', val: fmtBRL(preview.totalInvestido), cor: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Conversas WA', val: fmtNum(preview.totalConversas), cor: 'text-green-600', bg: 'bg-green-50' },
      { label: 'CPL Médio', val: fmtBRL(preview.cplMedio), cor: 'text-purple-600', bg: 'bg-purple-50' },
      { label: 'Visitas Perfil', val: fmtNum(preview.totalVisitas), cor: 'text-orange-600', bg: 'bg-orange-50' },
      { label: 'Seguidores', val: fmtNum(preview.totalSeguidores), cor: 'text-rose-600', bg: 'bg-rose-50' },
      { label: 'Linhas', val: preview.linhas, cor: 'text-gray-600', bg: 'bg-gray-50' },
    ];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {cards.map(c => (
            <div key={c.label} className={`${c.bg} rounded-xl p-3 text-center`}>
              <p className={`font-bold text-sm ${c.cor}`}>{c.val}</p>
              <p className="text-gray-500 text-xs mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
        <p className="text-gray-400 text-xs">Semana {semanaNum}{dataInicio ? ` · ${dataInicio} → ${dataFim}` : ''}</p>
        <div className="flex gap-3">
          <button onClick={() => setEtapa('mapeamento')} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors">Voltar</button>
          <button onClick={salvar} className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors">Salvar dados</button>
        </div>
      </div>
    );
  }
  return null;
}

export function ImportCSV() {
  const { imports, adsImports } = useApp();
  const [modoAtivo, setModoAtivo] = useState('camp');
  const [semanaNum, setSemanaNum] = useState(Math.max(imports.length, adsImports.length) + 1);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [sucesso, setSucesso] = useState('');

  const modos = [
    { id: 'camp', icon: BarChart2, label: 'Dados de Campanha', sub: 'Métricas por campanha — alimenta Dashboard, Campanhas e Comparativo' },
    { id: 'ads',  icon: Film,      label: 'Dados de Anúncios', sub: 'Métricas por anúncio — alimenta a aba Anúncios' },
  ];

  if (sucesso) return (
    <div className="p-6 flex justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-16 text-center space-y-3 max-w-lg">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={28} className="text-green-600" />
        </div>
        <p className="text-gray-800 font-bold text-lg">Dados importados!</p>
        <p className="text-gray-500 text-sm">{sucesso}</p>
        <button onClick={() => { setSucesso(''); setDataInicio(''); setDataFim(''); }}
          className="mt-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors">
          Importar mais dados
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Importar CSV</h1>
        <p className="text-sm text-gray-500">Importe dados do Gerenciador de Anúncios da Meta</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {modos.map(({ id, icon: Icon, label, sub }) => (
          <button key={id} onClick={() => setModoAtivo(id)}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              modoAtivo === id ? 'border-red-600 bg-red-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${modoAtivo === id ? 'bg-red-600' : 'bg-gray-100'}`}>
              <Icon size={18} className={modoAtivo === id ? 'text-white' : 'text-gray-500'} />
            </div>
            <p className={`font-bold text-sm ${modoAtivo === id ? 'text-red-700' : 'text-gray-700'}`}>{label}</p>
            <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{sub}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-gray-800 font-bold text-sm mb-4">
          {modoAtivo === 'camp' ? '📊 Importar dados de campanha' : '🎬 Importar dados de anúncios'}
        </h2>
        <FluxoImport
          key={modoAtivo}
          modo={modoAtivo}
          semanaNum={semanaNum}
          setSemanaNum={setSemanaNum}
          dataInicio={dataInicio}
          setDataInicio={setDataInicio}
          dataFim={dataFim}
          setDataFim={setDataFim}
          onSucesso={() => {
            setSucesso(modoAtivo === 'camp'
              ? `Semana ${semanaNum} salva com sucesso.`
              : `Dados de anúncios da Semana ${semanaNum} salvos.`);
            setSemanaNum(s => s + 1);
          }}
        />
      </div>

      {(imports.length > 0 || adsImports.length > 0) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Histórico de Importações</h3>
          <div className="divide-y divide-gray-100">
            {[...imports, ...adsImports].sort((a, b) => a.week - b.week).map(imp => (
              <div key={imp.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600 text-xs font-bold">S{imp.week}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{imp.filename}</p>
                    <p className="text-xs text-gray-400">
                      {imp.rowCount} linhas
                      {imp.dataInicio && ` · ${imp.dataInicio} → ${imp.dataFim}`}
                      {imp.id.startsWith('ads_') && <span className="text-purple-500 font-medium ml-1">· Anúncios</span>}
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">✓</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
