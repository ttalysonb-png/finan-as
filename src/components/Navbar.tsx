import React, { useState } from 'react';
import {
  Wallet, ChevronLeft, ChevronRight, Calendar, RefreshCw,
  BarChart3, Target, CreditCard, Layers, Database, Menu, X,
  PanelLeftClose, ArrowRight, ShieldCheck, Sun, Moon
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
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
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
  onOpenMigrationsModal,
  theme,
  onToggleTheme
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabsConfig = [
    {
      id: 'painel' as ActiveTab,
      label: 'Painel Geral & Histórico',
      shortLabel: 'Painel',
      icon: Wallet,
      badge: null
    },
    {
      id: 'contas_fixas' as ActiveTab,
      label: 'Contas Fixas & Previsões',
      shortLabel: 'Contas Fixas',
      icon: Layers,
      badge: lateFixedCount > 0 ? (
        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
          {lateFixedCount} atrasadas
        </span>
      ) : pendingFixedCount > 0 ? (
        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
          {pendingFixedCount} pendentes
        </span>
      ) : null
    },
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard Analítico',
      shortLabel: 'Dashboard',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'planejamento' as ActiveTab,
      label: 'Planejamento de Gastos',
      shortLabel: 'Planejamento',
      icon: Target,
      badge: null
    },
    {
      id: 'cartoes' as ActiveTab,
      label: 'Cartões de Crédito',
      shortLabel: 'Cartões',
      icon: CreditCard,
      badge: null
    }
  ];

  const currentTab = tabsConfig.find(t => t.id === financeTab) || tabsConfig[0];
  const CurrentIcon = currentTab.icon;

  const handleSelectTab = (tabId: ActiveTab) => {
    setFinanceTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur z-30 px-3 sm:px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Botão de Menu Hambúrguer visível no mobile */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-xl bg-slate-800 text-indigo-400 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors flex items-center justify-center shadow-sm"
            aria-label="Abrir menu de abas"
            title="Abrir Menu de Abas"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="p-2 bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 rounded-xl shadow-lg shadow-indigo-500/20 shrink-0">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="text-sm sm:text-lg font-bold text-white flex items-center gap-1.5 sm:gap-2">
              <span className="truncate max-w-[150px] sm:max-w-none">Finanças Pessoais</span>
              <span className="text-[9px] sm:text-[10px] uppercase font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 border border-slate-700 shrink-0">
                Supabase
              </span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
              Controle Orçamentário, Cartões e Contas Fixas Recorrentes
            </p>
          </div>
        </div>

        {/* Seletor de Período */}
        <div className="flex items-center gap-1 sm:gap-2 bg-slate-950 border border-indigo-500/30 rounded-xl p-1 sm:p-1.5 shadow-inner">
          <button
            onClick={onPrevMonth}
            className="p-1 sm:p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2">
            <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-[11px] sm:text-xs font-bold text-white focus:outline-none cursor-pointer"
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
              className="bg-transparent text-[11px] sm:text-xs font-bold text-indigo-300 focus:outline-none cursor-pointer"
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
            className="p-1 sm:p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            title="Próximo Mês"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Saldos e Ações no Desktop */}
        <div className="hidden sm:flex items-center gap-3 sm:gap-4 border-l border-slate-800 pl-3 sm:pl-4">
          {/* Botão de Alternar Tema Claro/Escuro */}
          <button
            onClick={onToggleTheme}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            aria-label="Alternar Tema"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
            <span className="hidden xl:inline">{theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}</span>
          </button>

          <button
            onClick={onOpenMigrationsModal}
            className="p-2 text-indigo-400 hover:text-white bg-indigo-950/50 hover:bg-indigo-900/50 border border-indigo-500/30 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Ver e copiar migration SQL para o Supabase"
          >
            <Database className="w-4 h-4" />
            <span className="hidden lg:inline">Migrations</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
            title="Recarregar do Banco de Dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <div className="text-xs">
            <span className="text-slate-400 text-[10px] block">Talyson</span>
            <span className="font-semibold text-indigo-300">R$ {talysonBalance.toFixed(2)}</span>
          </div>

          <div className="text-xs">
            <span className="text-slate-400 text-[10px] block">Karla</span>
            <span className="font-semibold text-purple-300">R$ {karlaBalance.toFixed(2)}</span>
          </div>
        </div>

        {/* Botões no mobile ultra compacto */}
        <div className="flex sm:hidden items-center gap-1.5">
          <button
            onClick={onToggleTheme}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors border border-slate-700/60"
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            aria-label="Alternar Tema"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>

          <button
            onClick={onRefresh}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
            title="Recarregar dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* Barra de Navegação Desktop (visível apenas em md ou maior) */}
      <div className="hidden md:flex flex-wrap gap-2 border-b border-slate-800 px-6 py-2.5 bg-slate-950/95 backdrop-blur z-20 shrink-0">
        {tabsConfig.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFinanceTab(tab.id)}
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

      {/* Sub-barra Mobile: Indicador da aba ativa com botão para abrir o menu lateral */}
      <div className="flex md:hidden items-center justify-between px-3 py-2 bg-slate-950/95 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px]">Aba atual:</span>
          <div className="flex items-center gap-1.5 font-bold text-indigo-400 bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-500/30">
            <CurrentIcon className="w-3.5 h-3.5" />
            <span>{currentTab.shortLabel}</span>
            {currentTab.badge}
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold rounded-lg border border-slate-700 transition-colors shadow-sm"
        >
          <Menu className="w-3.5 h-3.5 text-indigo-400" />
          <span>Menu Lateral</span>
        </button>
      </div>

      {/* MENU LATERAL MOBILE (SIDEBAR DRAWER) COM BOTÃO DE OCULTAR */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop escurecido: clique para ocultar */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Ocultar menu lateral"
          />

          {/* Drawer Lateral */}
          <div className="relative w-80 max-w-[85vw] bg-slate-900 border-r border-slate-800 flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Cabeçalho do Menu Lateral com botão de ocultar */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 rounded-lg shadow-md">
                  <Wallet className="w-4 h-4 text-slate-950 font-bold" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Menu de Navegação</h2>
                  <p className="text-[10px] text-slate-400">Abas e Módulos do Sistema</p>
                </div>
              </div>

              {/* Botão de Ocultar / Fechar */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold transition-colors"
                title="Ocultar menu lateral"
                aria-label="Ocultar menu"
              >
                <X className="w-4 h-4" />
                <span>Ocultar</span>
              </button>
            </div>

            {/* Lista das Abas no Menu Lateral */}
            <div className="p-4 flex-1 overflow-y-auto space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                Selecione uma Aba
              </div>

              {tabsConfig.map(tab => {
                const isActive = financeTab === tab.id;
                const TabIcon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSelectTab(tab.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all text-xs font-semibold ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 text-white border border-indigo-500/50 shadow-md shadow-indigo-950'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <TabIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold">{tab.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {tab.id === 'painel' && 'Extrato, balanço e histórico'}
                          {tab.id === 'contas_fixas' && 'Recorrências e previsões de receita'}
                          {tab.id === 'dashboard' && 'Gráficos e evolução mensal'}
                          {tab.id === 'planejamento' && 'Orçamento e limites por categoria'}
                          {tab.id === 'cartoes' && 'Faturas e limites disponíveis'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {tab.badge}
                      <ArrowRight className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-600'}`} />
                    </div>
                  </button>
                );
              })}

              {/* Seção de Saldos no Menu Lateral */}
              <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                  Saldos das Contas
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Conta Talyson</span>
                    <span className="text-xs font-bold text-indigo-300">
                      R$ {talysonBalance.toFixed(2)}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Conta Karla</span>
                    <span className="text-xs font-bold text-purple-300">
                      R$ {karlaBalance.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-500/20">
                  <span className="text-[10px] text-indigo-300 block">Saldo Consolidado</span>
                  <span className="text-sm font-extrabold text-white">
                    R$ {consolidatedBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Alternador de Tema Claro/Escuro no Menu Lateral */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
                      {theme === 'dark' ? (
                        <Moon className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Sun className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {theme === 'dark' ? 'Tema Escuro' : 'Tema Claro'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {theme === 'dark' ? 'Cores escuras ativadas' : 'Cores claras ativadas'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={onToggleTheme}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 shadow-sm ${
                      theme === 'dark'
                        ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500'
                    }`}
                  >
                    {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                    <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
                  </button>
                </div>
              </div>

              {/* Botões de Ações Rápidas no Menu Lateral */}
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenMigrationsModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-indigo-950/50 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 text-xs font-semibold"
                >
                  <Database className="w-4 h-4" />
                  <span>Migrations Supabase SQL</span>
                </button>

                <button
                  onClick={() => {
                    onRefresh();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
                  <span>Recarregar Dados</span>
                </button>
              </div>
            </div>

            {/* Rodapé do Menu com Botão de Ocultar em destaque */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/90">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-700 shadow-md"
              >
                <PanelLeftClose className="w-4 h-4 text-slate-400" />
                <span>Ocultar Menu Lateral</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
