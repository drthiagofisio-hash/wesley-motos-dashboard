export function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

export function TempBadge({ temperatura }) {
  const map = {
    quente:      'bg-red-100 text-red-700',
    morno:       'bg-orange-100 text-orange-700',
    frio:        'bg-blue-100 text-blue-700',
    remarketing: 'bg-violet-100 text-violet-700',
  };
  const labels = { quente: 'Quente', morno: 'Morno', frio: 'Frio', remarketing: '🔁 RMK' };
  return <Badge className={map[temperatura] || 'bg-gray-100 text-gray-600'}>{labels[temperatura] || temperatura}</Badge>;
}

export function FluxoBadge({ fluxo }) {
  const map = {
    whatsapp: 'bg-green-100 text-green-700',
  };
  const labels = { whatsapp: 'WhatsApp' };
  return <Badge className={map[fluxo] || 'bg-gray-100 text-gray-600'}>{labels[fluxo] || fluxo}</Badge>;
}

export function StatusBadge({ status }) {
  if (!status) return null;
  return <Badge className={status.classe}>{status.emoji} {status.label}</Badge>;
}
