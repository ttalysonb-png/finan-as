import React, { useState, useEffect, useMemo } from 'react';
import {
  X, CheckCircle2, Calendar, DollarSign, Wallet, FileText,
  AlertTriangle, Layers, Clock, Check, ChevronRight
} from 'lucide-react';
import { FixedAccount, FixedAccountInstallment } from '../types';
import { MONTHS } from '../constants';

interface PayFixedAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (
    account: FixedAccount,
    installment: FixedAccountInstallment,
    paymentDetails: {
      dataPagamento: string;
      valorPago: number;
      contaPagamento: string;
      operacao: string;
      observacao: string;
      includedInstallmentIds?: (number | string)[];
    }
  ) => Promise<void>;
  account: FixedAccount | null;
  installment: FixedAccountInstallment | null;
  accounts: string[];
  pastUnpaidInstallments?: FixedAccountInstallment[];
  initialSelectedInstallmentId?: number | string | null;
}

export const PayFixedAccountModal: React.FC<PayFixedAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirmPayment,
  account,
  installment,
  accounts,
  pastUnpaidInstallments = [],
  initialSelectedInstallmentId = null
}) => {
  const [dataPagamento, setDataPagamento] = useState('');
  const [valorPago, setValorPago] = useState('');
  const [contaPagamento, setContaPagamento] = useState('');
  const [operacao, setOperacao] = useState('Pix');
  const [observacao, setObservacao] = useState('');
  const [selectedInstallmentIds, setSelectedInstallmentIds] = useState<(number | string)[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Lista unificada de todas as parcelas quitáveis (passadas não pagas + parcela do mês atual)
  const allPayableInstallments = useMemo(() => {
    if (!account) return [];
    const list: {
      installment: FixedAccountInstallment;
      id: number | string;
      isCurrentMonth: boolean;
      periodo: string;
      monthName: string;
      year: string;
      numeroParcela: number;
      totalParcelas: number;
      valor: number;
      vencimento: string;
    }[] = [];

    // Parcelas passadas em atraso ordenadas cronologicamente
    const sortedPast = [...pastUnpaidInstallments].sort((a, b) =>
      (a.periodo || '').localeCompare(b.periodo || '')
    );
    sortedPast.forEach(p => {
      const [y, m] = (p.periodo || '').split('-');
      const mName = MONTHS[parseInt(m, 10) - 1] || p.periodo;
      list.push({
        installment: p,
        id: p.id,
        isCurrentMonth: false,
        periodo: p.periodo,
        monthName: mName,
        year: y,
        numeroParcela: p.numeroParcela,
        totalParcelas: p.totalParcelas,
        valor: Number(p.valor) || 0,
        vencimento: p.dataVencimento
      });
    });

    // Parcela do mês atual (se existir e não for virtual de rolagem)
    if (installment && !String(installment.id).startsWith('virtual_roll_')) {
      if (!list.some(item => item.id === installment.id)) {
        const [y, m] = (installment.periodo || '').split('-');
        const mName = MONTHS[parseInt(m, 10) - 1] || installment.periodo;
        list.push({
          installment: installment,
          id: installment.id,
          isCurrentMonth: true,
          periodo: installment.periodo,
          monthName: mName,
          year: y,
          numeroParcela: installment.numeroParcela,
          totalParcelas: installment.totalParcelas,
          valor: Number(installment.valor) || 0,
          vencimento: installment.dataVencimento
        });
      }
    }

    return list;
  }, [pastUnpaidInstallments, installment, account]);

  // Inicializa o estado quando o modal abre
  useEffect(() => {
    if (installment && account && isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setDataPagamento(installment.dataPagamento || today);
      setContaPagamento(installment.contaPagamento || account.conta || accounts[0] || 'Conta Talyson');
      setOperacao('Pix');
      setObservacao(installment.observacao || '');

      if (
        initialSelectedInstallmentId &&
        allPayableInstallments.some(p => p.id === initialSelectedInstallmentId)
      ) {
        // Usuário escolheu pagar um mês avulso específico
        setSelectedInstallmentIds([initialSelectedInstallmentId]);
        const target = allPayableInstallments.find(p => p.id === initialSelectedInstallmentId);
        setValorPago(String(target ? target.valor.toFixed(2) : '0.00'));
      } else {
        // Por padrão, seleciona todas as parcelas acumuladas
        const allIds = allPayableInstallments.map(p => p.id);
        setSelectedInstallmentIds(allIds);
        const sumVal = allPayableInstallments.reduce((sum, p) => sum + p.valor, 0);
        setValorPago(String(sumVal.toFixed(2)));
      }
    }
  }, [installment, account, accounts, initialSelectedInstallmentId, allPayableInstallments, isOpen]);

  if (!isOpen || !account || !installment) return null;

  const isReceita = account.natureza === 'receita';
  const hasMultipleInstallments = allPayableInstallments.length > 1;

  // Cálculos de totais dos itens selecionados e não selecionados
  const selectedItems = allPayableInstallments.filter(item => selectedInstallmentIds.includes(item.id));
  const unselectedItems = allPayableInstallments.filter(item => !selectedInstallmentIds.includes(item.id));
  const selectedSum = selectedItems.reduce((acc, item) => acc + item.valor, 0);
  const unselectedSum = unselectedItems.reduce((acc, item) => acc + item.valor, 0);

  // Ações de seleção rápida
  const handleToggleInstallment = (id: number | string) => {
    setSelectedInstallmentIds(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      const sum = allPayableInstallments
        .filter(item => next.includes(item.id))
        .reduce((acc, item) => acc + item.valor, 0);
      setValorPago(String(sum.toFixed(2)));
      return next;
    });
  };

  const handleSelectAll = () => {
    const allIds = allPayableInstallments.map(p => p.id);
    setSelectedInstallmentIds(allIds);
    const sum = allPayableInstallments.reduce((acc, item) => acc + item.valor, 0);
    setValorPago(String(sum.toFixed(2)));
  };

  const handleSelectOldestOnly = () => {
    if (allPayableInstallments.length === 0) return;
    const oldest = allPayableInstallments[0];
    setSelectedInstallmentIds([oldest.id]);
    setValorPago(String(oldest.valor.toFixed(2)));
  };

  const handleSelectCurrentOnly = () => {
    const current = allPayableInstallments.find(p => p.isCurrentMonth);
    if (current) {
      setSelectedInstallmentIds([current.id]);
      setValorPago(String(current.valor.toFixed(2)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(valorPago) || 0;
    if (val <= 0 || !dataPagamento) return;
    if (selectedInstallmentIds.length === 0) return;

    setSubmitting(true);
    try {
      const primaryInst = selectedItems[0]?.installment || installment;
      await onConfirmPayment(account, primaryInst, {
        dataPagamento,
        valorPago: val,
        contaPagamento,
        operacao,
        observacao: observacao.trim(),
        includedInstallmentIds: selectedInstallmentIds
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`bg-slate-900 border ${
          isReceita ? 'border-emerald-500/50' : 'border-indigo-500/40'
        } rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto`}
      >
        {/* Cabeçalho */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isReceita
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isReceita ? 'Registrar Recebimento de Receita' : 'Registrar Pagamento'}
              </h3>
              <p className="text-xs text-slate-400">
                {account.nome} &bull; {account.origem}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SELETOR DE MESES ACUMULADOS (Permite pagar o mês desejado e deixar o restante pendente) */}
        {hasMultipleInstallments ? (
          <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Escolha o(s) Mês(es) que Deseja Pagar Agora</span>
              </div>
              <span className="text-[10px] text-amber-400/80 font-mono">
                {selectedItems.length} de {allPayableInstallments.length} selecionado(s)
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Marque o mês ou meses que você deseja quitar nesta operação. Os meses desmarcados permanecerão <strong>pendentes</strong> e continuarão acumulando nos próximos períodos.
            </p>

            {/* Presets Rápidos */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={handleSelectAll}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                  selectedInstallmentIds.length === allPayableInstallments.length
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-amber-400/60'
                }`}
              >
                Todos ({allPayableInstallments.length} meses)
              </button>

              <button
                type="button"
                onClick={handleSelectOldestOnly}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                  selectedInstallmentIds.length === 1 && selectedInstallmentIds[0] === allPayableInstallments[0].id
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-amber-400/60'
                }`}
              >
                Apenas Mês Mais Antigo ({allPayableInstallments[0]?.periodo})
              </button>

              {allPayableInstallments.some(p => p.isCurrentMonth) && (
                <button
                  type="button"
                  onClick={handleSelectCurrentOnly}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                    selectedInstallmentIds.length === 1 &&
                    selectedInstallmentIds[0] === allPayableInstallments.find(p => p.isCurrentMonth)?.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-amber-400/60'
                  }`}
                >
                  Apenas Mês Atual
                </button>
              )}
            </div>

            {/* Lista Interativa de Parcelas/Meses */}
            <div className="space-y-2 pt-1">
              {allPayableInstallments.map(item => {
                const isChecked = selectedInstallmentIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleInstallment(item.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                      isChecked
                        ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 opacity-70 hover:opacity-100 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // O onClick do container gerencia
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {item.monthName}/{item.year}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              item.isCurrentMonth
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {item.isCurrentMonth ? 'Mês Atual' : 'Atrasada'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Parcela {item.numeroParcela}/{item.totalParcelas} &bull; Venc: {item.vencimento.split('-').reverse().join('/')}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-mono font-bold block ${isChecked ? 'text-emerald-400' : 'text-slate-400'}`}>
                        R$ {item.valor.toFixed(2)}
                      </span>
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.2 rounded inline-block mt-0.5 ${
                          isChecked
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isChecked ? '✓ Quitar agora' : '⏳ Ficará pendente'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resumo da Seleção */}
            <div className="bg-slate-950/90 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between text-slate-300 font-semibold">
                <span>Total Selecionado a Quitar:</span>
                <span className="text-emerald-400 font-mono font-bold">
                  R$ {selectedSum.toFixed(2)} ({selectedItems.length} mês/meses)
                </span>
              </div>
              {unselectedItems.length > 0 && (
                <div className="flex justify-between text-amber-400/90 text-[11px] pt-1 border-t border-slate-800/80">
                  <span>Permanecerá Pendente:</span>
                  <span className="font-mono">
                    R$ {unselectedSum.toFixed(2)} ({unselectedItems.length} mês/meses)
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>{isReceita ? 'Data Prevista:' : 'Vencimento Previsto:'}</span>
              <span className="font-mono text-slate-200">
                {installment.dataVencimento.split('-').reverse().join('/')}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Classificação:</span>
              <span className="font-semibold text-indigo-300">
                {account.origem} &bull; {account.classificacao}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Valor da Parcela:</span>
              <span className="font-mono font-bold text-emerald-400">
                R$ {Number(installment.valor).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Formulário de Pagamento / Confirmação */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                {isReceita ? 'Data do Recebimento *' : 'Data do Pagamento *'}
              </label>
              <input
                type="date"
                required
                value={dataPagamento}
                onChange={e => setDataPagamento(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                {isReceita ? 'Valor Efetivo Recebido (R$) *' : 'Valor Efetivo Pago (R$) *'}
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={valorPago}
                onChange={e => setValorPago(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                {isReceita ? 'Conta de Destino (Onde Caiu) *' : 'Conta Debitada *'}
              </label>
              <select
                value={contaPagamento}
                onChange={e => setContaPagamento(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                {accounts.map(acc => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Forma de Operação
              </label>
              <select
                value={operacao}
                onChange={e => setOperacao(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                {['Pix', 'Transferência', 'Boleto', 'Débito', 'Dinheiro', 'Crédito'].map(op => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Observação / Comprovante (Opcional)
            </label>
            <input
              type="text"
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder={
                isReceita
                  ? 'Ex: Recebido com bônus, adiantamento quinzenal...'
                  : 'Ex: Pago com desconto, pago adiantado...'
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-300 flex items-center gap-2">
            <FileText className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              Ao confirmar, este {isReceita ? 'recebimento' : 'pagamento'} será registrado automaticamente no{' '}
              <strong>Histórico de Lançamentos</strong>.
              {hasMultipleInstallments && unselectedItems.length > 0 && (
                <span className="text-amber-300 block mt-0.5">
                  &bull; Atenção: {unselectedItems.length} mês(es) continuarão pendentes.
                </span>
              )}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || selectedInstallmentIds.length === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold rounded-lg text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
            >
              {submitting
                ? 'Registrando...'
                : isReceita
                ? `Confirmar Recebimento (${selectedItems.length} mês/meses)`
                : `Confirmar Pagamento (${selectedItems.length} mês/meses)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
