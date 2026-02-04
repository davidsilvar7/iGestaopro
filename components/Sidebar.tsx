import React from 'react';
import { supabase } from '../services/supabase';
import { LayoutDashboard, Smartphone, Wrench, DollarSign, Menu, X, LogOut, PieChart, TrendingUp, Settings, HelpCircle, Target, UserPlus, Users, RefreshCcw } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  session: Session | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen, session }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sales', label: 'Vendas & Caixa', icon: DollarSign },
    { id: 'trade_in', label: 'Trade-in (Troca)', icon: RefreshCcw },
    { id: 'inventory', label: 'Estoque', icon: Smartphone },
    { id: 'service', label: 'Assistência (OS)', icon: Wrench },
    { id: 'financial', label: 'Financeiro', icon: TrendingUp },
    { id: 'reports', label: 'Relatórios', icon: PieChart },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Content */}
      <div className={`fixed inset-y-0 left-0 z-30 w-72 bg-slate-900 text-white transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-6 bg-slate-950/50 border-b border-white/5">
          <div className="flex items-center">
            {/* Logo Image */}
            {/* Logo Image */}
            <div className="h-10 w-10 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50 mr-3">
              <Smartphone className="text-white" size={24} />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight block leading-none text-white">iGestão<span className="text-blue-400">Pro</span></span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">Loja Principal</span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">Principal</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/40 translate-x-1'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
                  }`}
              >
                <Icon size={20} className={`mr-3 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} transition-colors`} />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>
            );

          })}

          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">CRM (Clientes)</p>
          {[
            { id: 'crm_dashboard', label: 'Visão Geral', icon: Target },
            { id: 'crm_leads', label: 'Leads & Pipeline', icon: UserPlus },
            { id: 'crm_customers', label: 'Carteira de Clientes', icon: Users },
            { id: 'marketing', label: 'Marketing & Disparos', icon: Smartphone },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/40 translate-x-1'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
                  }`}
              >
                <Icon size={20} className={`mr-3 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} transition-colors`} />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>
            );
          })}

          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Sistema</p>
          <button
            onClick={() => { setActiveTab('settings'); setIsOpen(false); }}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'settings'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/40 translate-x-1'
              : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
              }`}
          >
            <Settings size={20} className={`mr-3 ${activeTab === 'settings' ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
            <span className="font-medium text-sm">Configurações</span>
          </button>
          <button
            onClick={() => { setActiveTab('help'); setIsOpen(false); }}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'help'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/40 translate-x-1'
              : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
              }`}
          >
            <HelpCircle size={20} className={`mr-3 ${activeTab === 'help' ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
            <span className="font-medium text-sm">Central de Ajuda</span>
          </button>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-sm text-white border-2 border-slate-800 shadow-md">
              {session?.user.email?.slice(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-sm font-semibold text-white truncate max-w-[140px]" title={session?.user.email}>
                {session?.user.email || 'Usuário'}
              </p>
              <p className="text-xs text-green-400 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                Online agora
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500 hover:text-red-300 transition-all text-sm font-medium group"
          >
            <LogOut size={16} className="mr-2 group-hover:-translate-x-0.5 transition-transform" />
            Sair do Sistema
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
