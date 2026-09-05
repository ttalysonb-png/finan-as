import React, { useState, useMemo } from 'react';
import {
  Calendar, CheckCircle2, Clock, AlertCircle, Plus, Edit3, Trash2,
  DollarSign, CreditCard, Filter, Search, RotateCcw, Check, ArrowRight,
  Database, RefreshCw, FileText, ChevronRight, Layers, Eye
} from 'lucide-react';
import { FixedAccount, FixedAccountInstallment, Card, PaymentStatus } from '../types';
import { MONTHS, formatCurrency } from '../constants';

interface FixedAccountsTabProps {
  fixedAccounts: FixedAccount[];
  cards: Card[];
  selectedYear: number;
  selectedMonth: number;
  selectedPeriodKey: string;
  getCardInvoice: (cardId: number, baseValue: number) => number;
  onOpenAddModal: () => void;
  onEditAccount: (account: FixedAccount) => void;
  onDeleteAccount: (accountId: number) => void;
  onOpenPayModal: (account: FixedAccount, installment: FixedAccountInstallment) => void;
  onRevertPayment: (account: FixedAccount, installment: FixedAccountInstallment) => Promise<void>;
  onQuickUpdateInstallmentValue: (installmentId: number | string, newValue: number) => Promise<void>;
  onOpenMigrationsModal: () => void;
  onSyncCardInvoicesToFixedAccounts: () => Promise<void>;
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
  onSyncCardInvoicesToFixedAccounts
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus | 'cartao'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingInstallmentId, setEditingInstallmentId] = useState<number | string | null>(null);
  const [editingValueInput, setEditingValueInput] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Coleta as parcelas das contas fixas para o período atual
  const monthlyItems = useMemo(() => {
    const list: { account: FixedAccount; installment: FixedAccountInstallment }[] = [];

    fixedAccounts.forEach(acc => {
      if (!acc.ativo) return;
      const inst = acc.installments?.find(i => i.periodo === selectedPeriodKey);
      if (inst) {
        // Checa se está atrasado (se pendente e vencimento < hoje)
        let computedStatus = inst.status;
        if (computedStatus === 'pendente' && inst.dataVencimento < todayStr) {
          computedStatus = 'atrasado';
        }

        list.push({
          account: acc,
          installment: {
            ...inst,
            status: computedStatus
          }
        });
      }
    });

    return list;
  }, [fixedAccounts, selectedPeriodKey, todayStr]);

  // Cálculos de totais
  const totalPrevisto = useMemo(() => {
    return monthlyItems.reduce((sum, item) => sum + (Number(item.installment.valor) || 0), 0);
  }, [monthlyItems]);

  const totalPago = useMemo(() => {
    return monthlyItems
      .filter(item => item.installment.status === 'pago')
      .reduce((sum, item) => sum + (Number(item.installment.valor) || 0), 0);
  }, [monthlyItems]);

  const totalPendente = useMemo(() => {
    return monthlyItems
      .filter(item => item.installment.status === 'pendente')
      .reduce((sum, item) => sum + (Number(item.installment.valor) || 0), 0);
  }, [monthlyItems]);

  const totalAtrasado = useMemo(() => {
    return monthlyItems
      .filter(item => item.installment.status === 'atrasado')
      .reduce((sum, item) => sum + (Number(item.installment.valor) || 0), 0);
  }, [monthlyItems]);

  const percentPago = totalPrevisto > 0 ? (totalPago / totalPrevisto) * 100 : 0;

  // Filtragem da lista
  const filteredItems = useMemo(() => {
    return monthlyItems.filter(item => {
      const matchSearch =
        item.account.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.account.origem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.account.classificacao || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'cartao') return !!item.account.isCartao;
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
            Contas Fixas & Recorrentes — {MONTHS[selectedMonth - 1]} / {selectedYear}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Controle de vencimentos, duração em meses, status de quitação e baixa integrada ao histórico financeiro.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenMigrationsModal}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-indigo-300 border border-indigo-500/40 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm"
            title="Ver e copiar comandos de migration SQL para o Supabase"
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

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nova Conta Fixa
          </button>
        </div>
      </div>

      {/* Cards de Métricas e Progresso do Mês */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Previsto */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase">
            <span>Total Previsto no Mês</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mt-2">
            R$ {totalPrevisto.toFixed(2)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            {monthlyItems.length} conta(s) fixa(s) programada(s)
          </p>
        </div>

        {/* Total Já Pago */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5 shadow-lg">
          <div className="flex justify-between items-center text-emerald-400 text-xs font-semibold uppercase">
            <span>Total Já Quitado</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-emerald-400 mt-2">
            R$ {totalPago.toFixed(2)}
          </h3>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(percentPago, 100)}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {percentPago.toFixed(0)}% das contas fixas quitadas
          </p>
        </div>

        {/* Total Pendente */}
        <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-5 shadow-lg">
          <div className="flex justify-between items-center text-amber-400 text-xs font-semibold uppercase">
            <span>Pendente (A Vencer)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="text-2xl font-bold text-amber-400 mt-2">
            R$ {totalPendente.toFixed(2)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Contas a vencer dentro do prazo
          </p>
        </div>

        {/* Total Atrasado */}
        <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-5 shadow-lg">
          <div className="flex justify-between items-center text-rose-400 text-xs font-semibold uppercase">
            <span>Contas Vencidas</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <h3 className={`text-2xl font-bold mt-2 ${totalAtrasado > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            R$ {totalAtrasado.toFixed(2)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            {totalAtrasado > 0 ? 'Atenção: pagamentos pendentes em atraso' : 'Nenhuma conta em atraso'}
          </p>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all', label: 'Todas as Contas' },
            { id: 'pendente', label: 'Pendentes' },
            { id: 'pago', label: 'Pagas' },
            { id: 'atrasado', label: 'Atrasadas' },
            { id: 'cartao', label: 'Faturas de Cartão' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === f.id
                  ? 'bg-indigo-600 text-white shadow-md'
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
              placeholder="Buscar conta fixa..."
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

      {/* Lista Principal de Contas Fixas */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Nenhuma conta fixa encontrada</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {statusFilter !== 'all' || searchTerm
                ? 'Nenhum resultado corresponde aos filtros selecionados. Experimente limpar a busca.'
                : `Ainda não há contas fixas registradas para o mês de ${MONTHS[selectedMonth - 1]}/${selectedYear}.`}
            </p>
          </div>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Cadastrar Primeira Conta Fixa
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Modo Tabela */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Conta Fixa / Descrição</th>
                  <th className="p-3.5">Origem / Categoria</th>
                  <th className="p-3.5">Vencimento</th>
                  <th className="p-3.5">Data Pagamento</th>
                  <th className="p-3.5">Parcela / Duração</th>
                  <th className="p-3.5 text-right">Valor (R$)</th>
                  <th className="p-3.5">Conta Débito</th>
                  <th className="p-3.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredItems.map(({ account, installment }) => {
                  const isPaid = installment.status === 'pago';
                  const isLate = installment.status === 'atrasado';
                  const isEditingValue = editingInstallmentId === installment.id;

                  return (
                    <tr
                      key={installment.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isPaid ? 'bg-emerald-950/10' : isLate ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Status */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isPaid
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : isLate
                              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 animate-pulse'
                              : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                          }`}
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Pago
                            </>
                          ) : isLate ? (
                            <>
                              <AlertCircle className="w-3 h-3 text-rose-400" /> Atrasado
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-400" /> Pendente
                            </>
                          )}
                        </span>
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
                            {account.observacao && (
                              <span className="text-[11px] text-slate-400 truncate max-w-[200px] block">
                                {account.observacao}
                              </span>
                            )}
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

                      {/* Data Pagamento */}
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-slate-300 text-[11px]">
                          <Layers className="w-3 h-3 text-indigo-400" />
                          {installment.numeroParcela} / {installment.totalParcelas} meses
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          {account.tipoValor === 'fixo' ? 'Valor Fixo' : 'Valor Variável'}
                        </span>
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
                          <div className="group/val flex items-center justify-end gap-1.5">
                            <span className="text-sm font-bold text-white">
                              R$ {Number(installment.valor).toFixed(2)}
                            </span>
                            <button
                              onClick={() => handleStartEditingValue(installment)}
                              className="opacity-0 group-hover/val:opacity-100 p-1 text-slate-400 hover:text-indigo-400 transition-opacity"
                              title="Editar valor deste mês"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Conta de Débito */}
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
                        <div className="flex items-center justify-center gap-1.5">
                          {isPaid ? (
                            <button
                              onClick={() => onRevertPayment(account, installment)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-200 border border-slate-700 transition-colors flex items-center gap-1"
                              title="Desmarcar pagamento e remover do histórico"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Desmarcar
                            </button>
                          ) : (
                            <button
                              onClick={() => onOpenPayModal(account, installment)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
                              title="Registrar pagamento e lançar no histórico do painel principal"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Pagar
                            </button>
                          )}

                          <button
                            onClick={() => onEditAccount(account)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Editar conta fixa e vigência"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteAccount(account.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Excluir conta fixa"
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
          {filteredItems.map(({ account, installment }) => {
            const isPaid = installment.status === 'pago';
            const isLate = installment.status === 'atrasado';

            return (
              <div
                key={installment.id}
                className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all shadow-lg ${
                  isPaid
                    ? 'border-emerald-500/40 bg-gradient-to-b from-slate-900 to-emerald-950/20'
                    : isLate
                    ? 'border-rose-500/40 bg-gradient-to-b from-slate-900 to-rose-950/20'
                    : 'border-slate-800 hover:border-indigo-500/40'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      {account.isCartao && (
                        <span className="p-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          <CreditCard className="w-4 h-4" />
                        </span>
                      )}
                      <div>
                        <h4 className="text-base font-bold text-white">{account.nome}</h4>
                        <p className="text-xs text-slate-400">{account.origem} &bull; {account.classificacao}</p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isPaid
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : isLate
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      }`}
                    >
                      {isPaid ? 'Pago' : isLate ? 'Atrasado' : 'Pendente'}
                    </span>
                  </div>

                  <div className="mt-4 p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Valor da Parcela:</span>
                      <span className="font-mono font-bold text-white text-sm">
                        R$ {Number(installment.valor).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Vencimento:</span>
                      <span className="font-mono text-slate-200">
                        {installment.dataVencimento.split('-').reverse().join('/')} (Dia {account.diaVencimento})
                      </span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Duração / Parcela:</span>
                      <span className="font-mono text-indigo-300 font-semibold">
                        {installment.numeroParcela} de {installment.totalParcelas} meses
                      </span>
                    </div>

                    {isPaid && installment.dataPagamento && (
                      <div className="flex justify-between text-xs pt-1 border-t border-slate-800">
                        <span className="text-emerald-400 font-semibold">Data do Pagamento:</span>
                        <span className="font-mono text-emerald-300 font-bold">
                          {installment.dataPagamento.split('-').reverse().join('/')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditAccount(account)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteAccount(account.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isPaid ? (
                    <button
                      onClick={() => onRevertPayment(account, installment)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3 h-3" /> Desmarcar
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenPayModal(account, installment)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Registrar Pagamento
                    </button>
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
