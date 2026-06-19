import { useState } from 'react';
import { Info } from 'lucide-react';

export function Tooltip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center gap-1">
      {children}
      <span className="cursor-help text-gray-400 hover:text-gray-600"
        onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
        <Info size={13} />
      </span>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 rounded-lg bg-gray-900 text-white text-xs px-3 py-2 shadow-xl pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  );
}
