import { useState } from 'react';
import {
  LayoutDashboard, BarChart2, FileText, Upload, Settings,
  ChevronLeft, ChevronRight, CalendarDays, TrendingUp, BookOpen, LogOut,
  Menu, X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'campanhas',    label: 'Campanhas',       icon: BarChart2 },
  { id: 'anuncios',     label: 'Anúncios',        icon: FileText },
  { id: 'semanal',      label: 'Comparativo',     icon: TrendingUp },
  { id: 'importar',     label: 'Importar CSV',    icon: Upload },
  { id: 'guia',         label: 'Guia de Nomes',   icon: BookOpen, destaque: true },
  { id: 'configuracoes', label: 'Configurações',  icon: Settings },
];

function fmtBRLSimple(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
}

export function Sidebar({ activePage, onPageChange, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { verbaTotalCampanha } = useApp();

  const handleNav = (id) => {
    onPageChange(id);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-700">
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-widest truncate">Agora Marketing</span>
            <span className="text-sm font-bold text-white truncate">Wesley Motos</span>
            <span className="text-xs truncate font-medium text-slate-400">Revenda de Motos · Balsas-MA</span>
          </div>
        )}
        <button onClick={() => { setCollapsed(c => !c); setMobileOpen(false); }}
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-auto hidden lg:block">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        <button onClick={() => setMobileOpen(false)}
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-auto lg:hidden">
          <X size={20} />
        </button>
      </div>

      {!collapsed && (
        <div className="mx-3 mt-3 px-3 py-2 bg-red-600/20 rounded-lg border border-red-500/30">
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-red-400" />
            <span className="text-xs text-red-300 font-medium">Campanha em andamento</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            4 semanas · {fmtBRLSimple(verbaTotalCampanha)}
          </div>
        </div>
      )}

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = activePage === item.id;
          return (
            <button key={item.id} onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active ? 'bg-red-600 text-white shadow'
                : item.destaque ? 'text-amber-300 hover:bg-amber-500/20 hover:text-amber-200'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}>
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.destaque && !active && (
                <span className="ml-auto text-xs bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded font-semibold">novo</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className={`border-t border-slate-700 ${collapsed ? 'px-2 py-3' : 'px-4 py-3'}`}>
        {onLogout && (
          <button onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-colors ${collapsed ? 'justify-center' : ''}`}
            title="Sair">
            <LogOut size={16} className="flex-shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        )}
        {!collapsed && <p className="text-xs text-slate-500 mt-2">© 2025 Agora Marketing</p>}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
          <Menu size={22} />
        </button>
        <div className="text-center">
          <span className="text-xs font-semibold text-red-400 uppercase tracking-widest">Agora Marketing</span>
          <p className="text-sm font-bold text-white -mt-0.5">Wesley Motos</p>
        </div>
        <div className="w-9" />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-slate-900 h-full flex flex-col shadow-2xl">
            {sidebarContent}
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={`h-screen flex-col bg-slate-900 text-white transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      } flex-shrink-0 hidden lg:flex`}>
        {sidebarContent}
      </aside>
    </>
  );
}
