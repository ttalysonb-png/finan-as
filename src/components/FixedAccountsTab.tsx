import React, { useState, useMemo } from 'react';
import {
  Calendar, CheckCircle2, Clock, AlertCircle, Plus, Edit3, Trash2,
  DollarSign, CreditCard, Filter, Search, RotateCcw, Check, ArrowRight,
  Database, RefreshCw, FileText, ChevronRight, Layers, Eye,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Wallet,
  AlertTriangle, Ban, XCircle, Info
} from 'lucide-react';
import { FixedAccount, FixedAccountInstallment, Card, PaymentStatus, FixedAccountNature } from '../types';
import { MONTHS, formatCurrency } from '../constants';

export interface MonthlyFixedItem {
  account: FixedAccount;
  installment: FixedAccountInstallment;
  pastUnpaidInstallments: FixedAccountInstallment[];
  pastUnpaidTotal: number;
  totalWithPast: number;
  isOnlyFromPastUnpaid?: boolean;
}

interface FixedAccountsTabProps {
  fixedAccounts: FixedAccount[];
  cards: Card[];
  selectedYear: number;
  selectedMonth: number;
  selectedPeriodKey: string;
  getCardInvoice: (cardId: number, baseValue: number) => number;
  onOpenAddModal: (initialNature?: FixedAccountNature) => void;
  onEditAccount: (account: FixedAccount) => void;
  onOpenPayModal: (
    account: FixedAccount,
    installment: FixedAccountInstallment,
    pastUnpaid?: FixedAccountInstallment[],
    initialSelectedId?: number | string | null
  ) => void;
  onQuickUpdateInstallmentValue: (installmentId: number | string, newValue: number) => Promise<void>;
  onOpenMigrationsModal: () => void;
  onSyncCardInvoicesToFixedAccounts: () => Promise<void>;
  onCancelAccount?: (accountId: number) => Promise<void>;
  onCancelPastAccumulated?: (account: FixedAccount, pastInstallments: FixedAccountInstallment[]) => Promise<void>;
}

export const FixedAccountsTab: React.FC<FixedAccountsTabProps> = ({
  fixedAccounts,
  cards,
  selectedYear,
  selectedMonth,
  selectedPeriodKey,
  getCardInvoice,
  onOpenAddModal,
  onEditAccount,
  onDeleteAccount,
  onOpenPayModal,
  onRevertPayment,
  onQuickUpdateInstallmentValue,
  onOpenMigrationsModal,
  onSyncCardInvoicesToFixedAccounts,
  onCancelAccount,
  onCancelPastAccumulated
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'despesa' | 'receita' | PaymentStatus | 'cartao'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingInstallmentId, setEditingInstallmentId] = useState<number | string | null>(null);
  const [editingValueInput, setEditingValueInput] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Coleta as parcelas/meses das contas fixas e previsões para o período atual (com acúmulo automático de não pagas)
  const monthlyItems = useMemo(() => {
    const list: MonthlyFixedItem[] = [];

    fixedAccounts.forEach(acc => {
      // Se a conta estiver cancelada/inativa, para de ser exibida e de acumular
      if (!acc.ativo) return;

      // Localiza todas as parcelas anteriores a selectedPeriodKey que NÃO foram pagas nem canceladas
      const pastUnpaid = (acc.installments || []).filter(
        i => i.periodo < selectedPeriodKey && i.status !== 'pago' && i.status !== 'cancelado'
      );
      const pastTotal = pastUnpaid.reduce((sum, i) => sum + (Number(i.valor) || 0), 0);

      const currentInst = acc.installments?.find(i => i.periodo === selectedPeriodKey);

      if (currentInst) {
        // Checa se está atrasado (se pendente, despesa e vencimento < hoje)
        let computedStatus = currentInst.status;
        if (computedStatus === 'pendente' && currentInst.dataVencimento < todayStr && acc.natureza !== 'receita') {
          computedStatus = 'atrasado';
        }
        if (pastUnpaid.length > 0 && computedStatus !== 'pago' && computedStatus !== 'cancelado') {
          computedStatus = 'atrasado';
        }

        const effectiveTotal = computedStatus === 'pago'
          ? (Number(currentInst.valor) || 0)
          : (Number(currentInst.valor) || 0) + pastTotal;

        list.push({
          account: acc,
          installment: {
            ...currentInst,
            status: computedStatus
          },
          pastUnpaidInstallments: pastUnpaid,
          pastUnpaidTotal: pastTotal,
          totalWithPast: effectiveTotal,
          isOnlyFromPastUnpaid: false
        });
      } else if (pastUnpaid.length > 0) {
        // A conta fixa não tem parcela programada neste mês específico, mas tem débitos anteriores NÃO PAGOS!
        // "AS CONTAS FIXAS DE UM MES, CASO NÃO PAGAS, AUTOMATICAMENTE SE ACUMULE PARA O MES SEGUINTE, ATE O USUARIO FAZER O CANCELAMENTO DELA"
        const lastUnpaid = pastUnpaid[pastUnpaid.length - 1];
        const dayStr = String(acc.diaVencimento || 10).padStart(2, '0');

        list.push({
          account: acc,
          installment: {
            id: `virtual_roll_${acc.id}_${selectedPeriodKey}`,
            fixedAccountId: acc.id,
            periodo: selectedPeriodKey,
            numeroParcela: lastUnpaid.numeroParcela,
            totalParcelas: lastUnpaid.totalParcelas,
            valor: pastTotal,
            dataVencimento: `${selectedPeriodKey}-${dayStr}`,
            status: 'atrasado',
            observacao: `Acúmulo de ${pastUnpaid.length} mês(es) anterior(es) não pago(s)`
          },
          pastUnpaidInstallments: pastUnpaid,
          pastUnpaidTotal: pastTotal,
          totalWithPast: pastTotal,
          isOnlyFromPastUnpaid: true
        });
      }
    });

    return list;
  }, [fixedAccounts, selectedPeriodKey, todayStr]);

  // Separação entre Despesas Fixas e Previsões de Receita
  const despesasItems = useMemo(
    () => monthlyItems.filter(item => item.account.natureza !== 'receita'),
    [monthlyItems]
  );

  const receitasItems = useMemo(
    () => monthlyItems.filter(item => item.account.natureza === 'receita'),
    [monthlyItems]
  );

  // Cálculos de Despesas (considerando acúmulo de meses não pagos)
  const totalDespesasPrevisto = useMemo(() => {
    return despesasItems.reduce((sum, item) => {
      const val = item.installment.status === 'pago'
        ? (Number(item.installment.valor) || 0)
        : (Number(item.totalWithPast) || 0);
      return sum + val;
    }, 0);
  }, [despesasItems]);

  const totalDespesasPago = useMemo(() => {
    return despesasItems
      .filter(item => item.installment.status === 'pago')
      .reduce((sum, item) => sum + (Number(item.installment.valor) || 0), 0);
  }, [despesasItems]);

  const totalDespesasPendente = useMemo(() => {
    return despesasItems
      .filter(item => item.installment.status === 'pendente')
      .reduce((sum, item) => sum + (Number(item.totalWithPast) || 0), 0);
  }, [despesasItems]);

  const totalDespesasAtrasado = useMemo(() => {
    return despesasItems
      .filter(item => item.installment.status === 'atrasado')
      .reduce((sum, item) => sum + (Number(item.totalWithPast) || 0), 0);
  }, [despesasItems]);

  const totalAcumuladoMesesAnteriores = useMemo(() => {
    return despesasItems
      .filter(item => item.installment.status !== 'pago')
      .reduce((sum, item) => sum + (Number(item.pastUnpaidTotal) || 0), 0);
  }, [despesasItems]);

  // Cálculos de Receitas
  const totalReceitasPrevisto = useMemo(() => {
    return receitasItems.reduce((sum, item) => sum + (Number(item.installment.valor) || 0), 0);
  }, [receitasItems]);

  const totalReceitasRecebido = useMemo(() => {
    return receitasItems
      .filter(item => item.installment.status === 'pago')
      .reduce((sum, item) => sum + (Number(item.installment.valor) || 0), 0);
  }, [receitasItems]);

  const totalReceitasPendente = useMemo(() => {
    return receitasItems
      .filter(item => item.installment.status === 'pendente')
      .reduce((sum, item) => sum + (Number(item.installment.valor) || 0), 0);
  }, [receitasItems]);

  // Saldos
  const saldoPrevisto = totalReceitasPrevisto - totalDespesasPrevisto;
  const saldoRealizado = totalReceitasRecebido - totalDespesasPago;

  const percentDespesasPago = totalDespesasPrevisto > 0 ? (totalDespesasPago / totalDespesasPrevisto) * 100 : 0;
  const percentReceitasRecebido = totalReceitasPrevisto > 0 ? (totalReceitasRecebido / totalReceitasPrevisto) * 100 : 0;

  // Filtragem da lista
  const filteredItems = useMemo(() => {
    return monthlyItems.filter(item => {
      const matchSearch =
        item.account.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.account.origem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.account.classificacao || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'despesa') return item.account.natureza !== 'receita';
      if (statusFilter === 'receita') return item.account.natureza === 'receita';
      if (statusFilter === 'cartao') return !!item.account.isCartao;
      if ((statusFilter as string) === 'acumulado') return item.pastUnpaidInstallments.length > 0;
      return item.installment.status === statusFilter;
    });
  }, [monthlyItems, searchTerm, statusFilter]);

  const handleStartEditingValue = (inst: FixedAccountInstallment) => {
    setEditingInstallmentId(inst.id);
    setEditingValueInput(String(inst.valor || 0));
  };

  const handleSaveEditingValue = async (instId: number | string) => {
    const val = parseFloat(editingValueInput) || 0;
    await onQuickUpdateInstallmentValue(instId, val);
    setEditingInstallmentId(null);
  };

  return (
    <div className="space-y-6">
      {/* Banner de Cabeçalho com Ações Rápidas */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-indigo-500/30 p-5 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-indigo-400" />
            Contas Fixas & Previsões — {MONTHS[selectedMonth - 1]} / {selectedYear}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Planejamento de receitas previstas, despesas fixas, parcelamentos e baixas automáticas no histórico financeiro.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenMigrationsModal}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-indigo-300 border border-indigo-500/40 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm"
            title="Ver e copiar script SQL de migrations para o Supabase"
          >
            <Database className="w-4 h-4 text-indigo-400" />
            Migrations Supabase
          </button>

          <button
            onClick={onSyncCardInvoicesToFixedAccounts}
            className="flex items-center gap-1.5 bg-purple-950/60 hover:bg-purple-900 text-purple-200 border border-purple-500/40 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm"
            title="Sincroniza os valores calculados das faturas de cartão para a lista de contas fixas"
          >
            <CreditCard className="w-4 h-4 text-purple-400" />
            Sincronizar Faturas
          </button>

          {/* Botão de Previsão de Receitas */}
          <button
            onClick={() => onOpenAddModal('receita')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all"
            title="Registrar nova previsão de entrada/receita recorrente"
          >
            <TrendingUp className="w-4 h-4" />
            + Previsão de Receita
          </button>

          {/* Botão de Conta Fixa / Despesa */}
          <button
            onClick={() => onOpenAddModal('despesa')}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            title="Cadastrar nova despesa fixa recorrente"
          >
            <Plus className="w-4 h-4" />
            Nova Despesa Fixa
          </button>
        </div>
      </div>

      {/* Cards de Métricas: Despesas vs Receitas vs Saldo Previsto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Previsão de Receitas (A Receber) */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center text-emerald-400 text-xs font-semibold uppercase">
            <span>Previsão de Receitas</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-extrabold text-emerald-400 mt-2 font-mono">
            R$ {totalReceitasPrevisto.toFixed(2)}
          </h3>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(percentReceitasRecebido, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2">
            <span>Recebido: <strong className="text-emerald-300">R$ {totalReceitasRecebido.toFixed(2)}</strong></span>
            <span>A Receber: <strong className="text-slate-300">R$ {totalReceitasPendente.toFixed(2)}</strong></span>
          </div>
        </div>

        {/* Card 2: Despesas Fixas (A Pagar) */}
        <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center text-indigo-300 text-xs font-semibold uppercase">
            <span>Despesas Fixas a Pagar</span>
            <TrendingDown className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="text-2xl font-extrabold text-white mt-2 font-mono">
            R$ {totalDespesasPrevisto.toFixed(2)}
          </h3>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${Math.min(percentDespesasPago, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2">
            <span>Quitado: <strong className="text-emerald-400">R$ {totalDespesasPago.toFixed(2)}</strong></span>
            <span>A Pagar: <strong className="text-rose-400">R$ {(totalDespesasPendente + totalDespesasAtrasado).toFixed(2)}</strong></span>
          </div>
          {totalAcumuladoMesesAnteriores > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-amber-300 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Inclui R$ {totalAcumuladoMesesAnteriores.toFixed(2)} de meses anteriores não pagos</span>
            </div>
          )}
        </div>

        {/* Card 3: Saldo Operacional Previsto */}
        <div className={`bg-slate-900 border rounded-xl p-5 shadow-lg ${
          saldoPrevisto >= 0 ? 'border-teal-500/30' : 'border-rose-500/30'
        }`}>
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase">
            <span>Saldo Previsto no Mês</span>
            <DollarSign className={`w-4 h-4 ${saldoPrevisto >= 0 ? 'text-teal-400' : 'text-rose-400'}`} />
          </div>
          <h3 className={`text-2xl font-extrabold mt-2 font-mono ${
            saldoPrevisto >= 0 ? 'text-teal-300' : 'text-rose-400'
          }`}>
            {saldoPrevisto >= 0 ? '+' : ''}R$ {saldoPrevisto.toFixed(2)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Realizado no Histórico:</span>
            <strong className={`font-mono ${saldoRealizado >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {saldoRealizado >= 0 ? '+' : ''}R$ {saldoRealizado.toFixed(2)}
            </strong>
          </p>
          <div className="mt-1 text-[10px] text-slate-500">
            {saldoPrevisto >= 0 ? 'Superávit planejado nas contas fixas' : 'Atenção: despesas superam receitas'}
          </div>
        </div>

        {/* Card 4: Contas Vencidas & Atrasadas */}
        <div className={`bg-slate-900 border rounded-xl p-5 shadow-lg ${
          totalDespesasAtrasado > 0 ? 'border-rose-500/40' : 'border-slate-800'
        }`}>
          <div className="flex justify-between items-center text-rose-400 text-xs font-semibold uppercase">
            <span>Vencidas & Acumuladas</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <h3 className={`text-2xl font-extrabold mt-2 font-mono ${
            totalDespesasAtrasado > 0 ? 'text-rose-400' : 'text-slate-400'
          }`}>
            R$ {totalDespesasAtrasado.toFixed(2)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-3">
            {totalDespesasAtrasado > 0
              ? `${totalAcumuladoMesesAnteriores > 0 ? `R$ ${totalAcumuladoMesesAnteriores.toFixed(2)} acumulados de meses anteriores não pagos` : 'Existem pagamentos pendentes com prazo vencido'}`
              : 'Nenhuma conta em atraso ou acumulada'}
          </p>
        </div>
      </div>

      {/* Barra de Filtros, Natureza e Busca */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all', label: `Todos (${monthlyItems.length})` },
            { id: 'despesa', label: `Despesas (${despesasItems.length})` },
            { id: 'receita', label: `Receitas Previstas (${receitasItems.length})` },
            { id: 'pendente', label: 'Pendentes' },
            { id: 'pago', label: 'Quitados / Recebidos' },
            { id: 'atrasado', label: 'Atrasados' },
            { id: 'acumulado', label: `Acumulados (${monthlyItems.filter(i => i.pastUnpaidInstallments.length > 0).length})` },
            { id: 'cartao', label: 'Faturas de Cartão' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === f.id
                  ? f.id === 'receita'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : f.id === 'acumulado'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar conta ou previsão..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tabela
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'cards' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Lista Principal de Contas Fixas e Previsões de Receita */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Nenhum registro encontrado</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {statusFilter !== 'all' || searchTerm
                ? 'Nenhum item corresponde aos filtros selecionados. Experimente limpar a busca.'
                : `Ainda não há despesas ou receitas fixas registradas para o mês de ${MONTHS[selectedMonth - 1]}/${selectedYear}.`}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenAddModal('despesa')}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" /> Cadastrar Despesa Fixa
            </button>
            <button
              onClick={() => onOpenAddModal('receita')}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all"
            >
              <TrendingUp className="w-4 h-4" /> Previsão de Receita
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* Modo Tabela */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="p-3.5">Natureza</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Descrição / Conta</th>
                  <th className="p-3.5">Origem / Categoria</th>
                  <th className="p-3.5">Vencimento / Prev.</th>
                  <th className="p-3.5">Data Baixa</th>
                  <th className="p-3.5">Parcela / Duração</th>
                  <th className="p-3.5 text-right">Valor Previsto</th>
                  <th className="p-3.5">Conta Vinculada</th>
                  <th className="p-3.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredItems.map(({ account, installment, pastUnpaidInstallments, pastUnpaidTotal, totalWithPast, isOnlyFromPastUnpaid }) => {
                  const isReceita = account.natureza === 'receita';
                  const isPaid = installment.status === 'pago';
                  const isLate = installment.status === 'atrasado';
                  const hasAccumulated = pastUnpaidInstallments.length > 0 && !isPaid;
                  const isEditingValue = editingInstallmentId === installment.id;

                  return (
                    <tr
                      key={installment.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isPaid
                          ? 'bg-emerald-950/10'
                          : isLate || hasAccumulated
                          ? 'bg-amber-950/10'
                          : isReceita
                          ? 'bg-emerald-950/5'
                          : ''
                      }`}
                    >
                      {/* Natureza */}
                      <td className="p-3.5">
                        {isReceita ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
                            <TrendingUp className="w-3 h-3 text-emerald-400" /> Receita
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                            <TrendingDown className="w-3 h-3 text-rose-400" /> Despesa
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        {hasAccumulated ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-amber-500/15 border-amber-500/40 text-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                            Acumulado ({pastUnpaidInstallments.length} {pastUnpaidInstallments.length === 1 ? 'mês' : 'meses'})
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              isPaid
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                : isLate
                                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 animate-pulse'
                                : isReceita
                                ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                                : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                            }`}
                          >
                            {isPaid ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                {isReceita ? 'Recebido' : 'Pago'}
                              </>
                            ) : isLate ? (
                              <>
                                <AlertCircle className="w-3 h-3 text-rose-400" /> Atrasado
                              </>
                            ) : isReceita ? (
                              <>
                                <Clock className="w-3 h-3 text-teal-400" /> A Receber
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-400" /> Pendente
                              </>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Nome / Descrição */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          {account.isCartao && (
                            <span
                              className="p-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30"
                              title="Fatura de Cartão de Crédito"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <div>
                            <span className="font-bold text-white text-sm block">
                              {account.nome}
                            </span>
                            {hasAccumulated ? (
                              <div className="mt-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-1">
                                  <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Pagar avulso:
                                  </span>
                                  {pastUnpaidInstallments.map(p => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => onOpenPayModal(account, installment, pastUnpaidInstallments, p.id)}
                                      className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 hover:scale-105"
                                      title={`Clique para pagar especificamente o mês ${p.periodo} (R$ ${Number(p.valor).toFixed(2)})`}
                                    >
                                      <span>{p.periodo}</span>
                                      <span className="text-[9px] text-amber-400/80">R$ {Number(p.valor).toFixed(2)}</span>
                                    </button>
                                  ))}
                                  {!isOnlyFromPastUnpaid && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenPayModal(account, installment, pastUnpaidInstallments, installment.id)}
                                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-mono transition-all cursor-pointer flex items-center gap-1 hover:scale-105"
                                      title={`Clique para pagar especificamente o mês atual ${installment.periodo} (R$ ${Number(installment.valor).toFixed(2)})`}
                                    >
                                      <span>{installment.periodo} (Atual)</span>
                                      <span className="text-[9px] text-slate-400">R$ {Number(installment.valor).toFixed(2)}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : account.observacao ? (
                              <span className="text-[11px] text-slate-400 truncate max-w-[200px] block">
                                {account.observacao}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Origem e Classificação */}
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-300 block">
                          {account.origem}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {account.classificacao || 'Geral'}
                        </span>
                      </td>

                      {/* Vencimento */}
                      <td className="p-3.5 font-mono">
                        <span className="text-slate-200 font-semibold block">
                          Dia {account.diaVencimento}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {installment.dataVencimento.split('-').reverse().join('/')}
                        </span>
                      </td>

                      {/* Data Baixa (Pagamento / Recebimento) */}
                      <td className="p-3.5 font-mono">
                        {isPaid && installment.dataPagamento ? (
                          <div>
                            <span className="text-emerald-400 font-bold block">
                              {installment.dataPagamento.split('-').reverse().join('/')}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              via {installment.contaPagamento || account.conta}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Parcela / Duração */}
                      <td className="p-3.5">
                        {isOnlyFromPastUnpaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/30 font-mono text-amber-300 text-[10px]">
                            <Layers className="w-3 h-3 text-amber-400" />
                            Acúmulo de meses anteriores
                          </span>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-slate-300 text-[11px]">
                              <Layers className="w-3 h-3 text-indigo-400" />
                              {installment.numeroParcela} / {installment.totalParcelas} meses
                            </span>
                            <span className="block text-[10px] text-slate-500 mt-0.5">
                              {account.tipoValor === 'fixo' ? 'Valor Fixo' : 'Valor Variável'}
                            </span>
                          </>
                        )}
                      </td>

                      {/* Valor */}
                      <td className="p-3.5 text-right font-mono">
                        {isEditingValue ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-xs text-slate-500">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              autoFocus
                              value={editingValueInput}
                              onChange={e => setEditingValueInput(e.target.value)}
                              className="w-24 bg-slate-950 border border-indigo-500 rounded px-2 py-1 text-right text-xs text-emerald-400 focus:outline-none"
                            />
                            <button
                              onClick={() => handleSaveEditingValue(installment.id)}
                              className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded"
                              title="Salvar valor"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="group/val flex flex-col items-end">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className={`text-sm font-extrabold ${
                                isReceita ? 'text-emerald-400' : hasAccumulated ? 'text-amber-300' : 'text-white'
                              }`}>
                                {isReceita ? '+ ' : ''}R$ {Number(hasAccumulated ? totalWithPast : installment.valor).toFixed(2)}
                              </span>
                              {!isOnlyFromPastUnpaid && (
                                <button
                                  onClick={() => handleStartEditingValue(installment)}
                                  className="opacity-0 group-hover/val:opacity-100 p-1 text-slate-400 hover:text-indigo-400 transition-opacity"
                                  title="Editar valor deste mês"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            {hasAccumulated && !isOnlyFromPastUnpaid && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                (R$ {Number(installment.valor).toFixed(2)} mês + R$ {pastUnpaidTotal.toFixed(2)} atrasado)
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Conta Vinculada */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                            (installment.contaPagamento || account.conta) === 'Conta Talyson'
                              ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                              : (installment.contaPagamento || account.conta) === 'Conta Karla'
                              ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                              : 'bg-slate-800/80 border-slate-700 text-slate-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              (installment.contaPagamento || account.conta) === 'Conta Talyson'
                                ? 'bg-blue-400'
                                : (installment.contaPagamento || account.conta) === 'Conta Karla'
                                ? 'bg-purple-400'
                                : 'bg-slate-400'
                            }`}
                          ></span>
                          {installment.contaPagamento || account.conta}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {isPaid ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => onRevertPayment(account, installment)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-200 border border-slate-700 transition-colors flex items-center gap-1"
                                title={isReceita ? "Desmarcar recebimento e remover do histórico" : "Desmarcar pagamento e estornar do histórico"}
                              >
                                <RotateCcw className="w-3 h-3" />
                                Desmarcar
                              </button>
                              {hasAccumulated && (
                                <button
                                  onClick={() => onOpenPayModal(account, installment, pastUnpaidInstallments, pastUnpaidInstallments[0]?.id)}
                                  className="px-2 py-1 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow transition-colors flex items-center gap-1"
                                  title="O mês atual foi pago, mas ainda há meses anteriores em aberto. Clique para quitar!"
                                >
                                  <Layers className="w-3 h-3" />
                                  Pagar Atrasadas ({pastUnpaidInstallments.length})
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => onOpenPayModal(account, installment, pastUnpaidInstallments)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-md transition-all flex items-center gap-1.5 ${
                                isReceita
                                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                                  : hasAccumulated
                                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                              }`}
                              title={hasAccumulated ? "Pagar ou escolher meses desejados para quitar" : (isReceita ? "Registrar recebimento" : "Registrar pagamento")}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {isReceita ? 'Receber' : hasAccumulated ? 'Pagar / Escolher Mês' : 'Pagar'}
                            </button>
                          )}

                          {hasAccumulated && onCancelPastAccumulated && (
                            <button
                              onClick={() => onCancelPastAccumulated(account, pastUnpaidInstallments)}
                              className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors flex items-center gap-1"
                              title="Dispensar / Cancelar parcelas atrasadas de meses anteriores (mantém apenas este mês)"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Dispensar
                            </button>
                          )}

                          {onCancelAccount && (
                            <button
                              onClick={() => onCancelAccount(account.id)}
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Cancelar conta fixa (desativa e para todos os acúmulos futuros)"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onEditAccount(account)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Editar conta e vigência"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteAccount(account.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Excluir cadastro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Modo Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(({ account, installment, pastUnpaidInstallments, pastUnpaidTotal, totalWithPast, isOnlyFromPastUnpaid }) => {
            const isReceita = account.natureza === 'receita';
            const isPaid = installment.status === 'pago';
            const isLate = installment.status === 'atrasado';
            const hasAccumulated = pastUnpaidInstallments.length > 0 && !isPaid;

            return (
              <div
                key={installment.id}
                className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all shadow-lg ${
                  isPaid
                    ? 'border-emerald-500/40 bg-gradient-to-b from-slate-900 to-emerald-950/20'
                    : hasAccumulated
                    ? 'border-amber-500/40 bg-gradient-to-b from-slate-900 to-amber-950/20'
                    : isLate
                    ? 'border-rose-500/40 bg-gradient-to-b from-slate-900 to-rose-950/20'
                    : isReceita
                    ? 'border-emerald-500/30 bg-gradient-to-b from-slate-900 to-emerald-950/10'
                    : 'border-slate-800 hover:border-indigo-500/40'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      {account.isCartao ? (
                        <span className="p-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          <CreditCard className="w-4 h-4" />
                        </span>
                      ) : isReceita ? (
                        <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <TrendingUp className="w-4 h-4" />
                        </span>
                      ) : null}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-base font-bold text-white">{account.nome}</h4>
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            isReceita ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isReceita ? 'Receita' : 'Despesa'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{account.origem} &bull; {account.classificacao}</p>
                      </div>
                    </div>

                    {hasAccumulated ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-500/20 border-amber-500/40 text-amber-300">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        Acumulado ({pastUnpaidInstallments.length}m)
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isPaid
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : isLate
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                            : isReceita
                            ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                            : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        }`}
                      >
                        {isPaid ? (isReceita ? 'Recebido' : 'Pago') : isLate ? 'Atrasado' : isReceita ? 'A Receber' : 'Pendente'}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Valor {hasAccumulated ? 'Total a Pagar:' : 'Previsto:'}</span>
                      <div className="text-right">
                        <span className={`font-mono font-extrabold text-sm ${
                          isReceita ? 'text-emerald-400' : hasAccumulated ? 'text-amber-300' : 'text-white'
                        }`}>
                          {isReceita ? '+ ' : ''}R$ {Number(hasAccumulated ? totalWithPast : installment.valor).toFixed(2)}
                        </span>
                        {hasAccumulated && !isOnlyFromPastUnpaid && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            (R$ {Number(installment.valor).toFixed(2)} mês + R$ {pastUnpaidTotal.toFixed(2)} atrasado)
                          </div>
                        )}
                      </div>
                    </div>

                    {hasAccumulated && (
                      <div className="text-[10px] text-amber-400 font-mono bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 space-y-1.5">
                        <span className="block font-semibold">Pagar mês avulso:</span>
                        <div className="flex flex-wrap items-center gap-1">
                          {pastUnpaidInstallments.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => onOpenPayModal(account, installment, pastUnpaidInstallments, p.id)}
                              className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 text-[9px] font-mono transition-all cursor-pointer flex items-center gap-1"
                              title={`Pagar mês ${p.periodo} (R$ ${Number(p.valor).toFixed(2)})`}
                            >
                              <span>{p.periodo}</span>
                              <span className="text-[9px] text-amber-400/80">R$ {Number(p.valor).toFixed(2)}</span>
                            </button>
                          ))}
                          {!isOnlyFromPastUnpaid && (
                            <button
                              type="button"
                              onClick={() => onOpenPayModal(account, installment, pastUnpaidInstallments, installment.id)}
                              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[9px] font-mono transition-all cursor-pointer flex items-center gap-1"
                              title={`Pagar mês atual ${installment.periodo}`}
                            >
                              <span>{installment.periodo} (Atual)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Vencimento / Prazo:</span>
                      <span className="font-mono text-slate-200">
                        {installment.dataVencimento.split('-').reverse().join('/')} (Dia {account.diaVencimento})
                      </span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Duração / Período:</span>
                      <span className="font-mono text-indigo-300 font-semibold">
                        {isOnlyFromPastUnpaid ? 'Acúmulo de meses anteriores' : `${installment.numeroParcela} de ${installment.totalParcelas} meses`}
                      </span>
                    </div>

                    {isPaid && installment.dataPagamento && (
                      <div className="flex justify-between text-xs pt-1 border-t border-slate-800">
                        <span className="text-emerald-400 font-semibold">Data da Baixa:</span>
                        <span className="font-mono text-emerald-300 font-bold">
                          {installment.dataPagamento.split('-').reverse().join('/')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditAccount(account)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {onCancelAccount && (
                      <button
                        onClick={() => onCancelAccount(account.id)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Cancelar conta fixa"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteAccount(account.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isPaid ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onRevertPayment(account, installment)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3 h-3" /> Desmarcar
                      </button>
                      {hasAccumulated && (
                        <button
                          onClick={() => onOpenPayModal(account, installment, pastUnpaidInstallments, pastUnpaidInstallments[0]?.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow transition-colors flex items-center gap-1"
                          title="Pagar parcelas que ainda estão pendentes de meses anteriores"
                        >
                          <Layers className="w-3 h-3" /> Pagar Atrasadas ({pastUnpaidInstallments.length})
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {hasAccumulated && onCancelPastAccumulated && (
                        <button
                          onClick={() => onCancelPastAccumulated(account, pastUnpaidInstallments)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
                          title="Dispensar acúmulo de meses anteriores"
                        >
                          Dispensar
                        </button>
                      )}
                      <button
                        onClick={() => onOpenPayModal(account, installment, pastUnpaidInstallments)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-semibold text-white shadow-md transition-all flex items-center gap-1.5 ${
                          hasAccumulated ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {isReceita ? 'Receber' : hasAccumulated ? 'Pagar / Escolher Mês' : 'Pagar'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cartões de Crédito Integrados */}
      {cards.length > 0 && (
        <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Faturas de Cartão no Período ({MONTHS[selectedMonth - 1]} / {selectedYear})
                </h3>
                <p className="text-xs text-slate-400">
                  Resumo das faturas calculadas com base nas compras realizadas entre o dia 16 do mês anterior e 15 deste mês
                </p>
              </div>
            </div>

            <button
              onClick={onSyncCardInvoicesToFixedAccounts}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-purple-600/30 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sincronizar com Contas Fixas
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map(card => {
              const invoiceVal = getCardInvoice(card.id, card.faturaAtual);
              // Verifica se já existe uma conta fixa vinculada para este cartão
              const linkedAccount = fixedAccounts.find(a => a.isCartao && a.cartaoId === card.id);
              const installment = linkedAccount?.installments?.find(i => i.periodo === selectedPeriodKey);
              const isPaid = installment?.status === 'pago';

              return (
                <div
                  key={card.id}
                  className="bg-slate-950 border border-purple-500/20 rounded-xl p-4 flex flex-col justify-between gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-purple-400 uppercase tracking-wider font-semibold">
                        Titular: {card.titular}
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5">{card.nome}</h4>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Venc. Dia {card.diaVencimento}
                    </span>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Fatura do Mês</span>
                      <span className="text-xl font-extrabold text-purple-300 font-mono">
                        R$ {invoiceVal.toFixed(2)}
                      </span>
                    </div>

                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Fatura Paga
                      </span>
                    ) : linkedAccount && installment ? (
                      <button
                        onClick={() => onOpenPayModal(linkedAccount, installment)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors flex items-center gap-1"
                      >
                        Pagar Fatura
                      </button>
                    ) : (
                      <button
                        onClick={onSyncCardInvoicesToFixedAccounts}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Adicionar à Lista
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
