import React from 'react';
import {
  Wallet, ChevronLeft, ChevronRight, Calendar, RefreshCw,
  BarChart3, Target, CreditCard, Layers, Database
} from 'lucide-react';
import { ActiveTab } from '../types';
import { MONTHS } from '../constants';

interface NavbarProps {
  financeTab: ActiveTab;
  setFinanceTab: (tab: ActiveTab) => void;
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  loading: boolean;
  onRefresh: () => void;
  talysonBalance: number;
  karlaBalance: number;
  consolidatedBalance: number;
  pendingFixedCount: number;
  lateFixedCount: number;
  onOpenMigrationsModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  financeTab,
  setFinanceTab,
  selectedMonth,
  selectedYear,
  setSelectedMonth,
  setSelectedYear,
  onPrevMonth,
  onNextMonth,
  loading,
  onRefresh,
  talysonBalance,
  karlaBalance,
  consolidatedBalance,
  pendingFixedCount,
  lateFixedCount,
  onOpenMigrationsModal
}) => {
  return (
    <>
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur z-30 px-4 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 rounded-xl shadow-lg shadow-indigo-500/20">
            <Wallet className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Sistema de Finanças Pessoais
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 border border-slate-700">
                Supabase DB
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Controle Orçamentário, Cartões e Contas Fixas Recorrentes
            </p>
          </div>
        </div>

        {/* Seletor de Período */}
        <div className="flex items-center gap-2 bg-slate-950 border border-indigo-500/30 rounded-xl p-1.5 shadow-inner">
          <button
            onClick={onPrevMonth}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx + 1} className="bg-slate-900 text-white">
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-indigo-300 focus:outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                <option key={y} value={y} className="bg-slate-900 text-white">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onNextMonth}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            title="Próximo Mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Saldos e Ações */}
        <div className="flex items-center gap-4 border-l border-slate-800 pl-4 flex-wrap">
          <button
            onClick={onOpenMigrationsModal}
            className="p-2 text-indigo-400 hover:text-white bg-indigo-950/50 hover:bg-indigo-900/50 border border-indigo-500/30 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Ver e copiar migration SQL para o Supabase"
          >
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Migrations</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
            title="Recarregar do Banco de Dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <div className="text-xs">
            <span className="text-slate-400 text-[10px] block">Talyson (Conta)</span>
            <span className="font-semibold text-indigo-300">R$ {talysonBalance.toFixed(2)}</span>
          </div>

          <div className="text-xs">
            <span className="text-slate-400 text-[10px] block">Karla (Conta)</span>
            <span className="font-semibold text-purple-300">R$ {karlaBalance.toFixed(2)}</span>
          </div>
        </div>
      </header>

      {/* Abas de Navegação */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 px-6 py-2.5 bg-slate-950/95 backdrop-blur z-20 shrink-0">
        {[
          { id: 'painel', label: 'Painel Geral & Histórico', icon: Wallet },
          {
            id: 'contas_fixas',
            label: 'Contas Fixas',
            icon: Layers,
            badge: lateFixedCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                {lateFixedCount} atrasadas
              </span>
            ) : pendingFixedCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {pendingFixedCount}
              </span>
            ) : null
          },
          { id: 'dashboard', label: 'Dashboard Analítico', icon: BarChart3 },
          { id: 'planejamento', label: 'Planejamento de Gastos', icon: Target },
          { id: 'cartoes', label: 'Cartões de Crédito', icon: CreditCard }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFinanceTab(tab.id as ActiveTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              financeTab === tab.id
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.badge}
          </button>
        ))}
      </div>
    </>
  );
};
