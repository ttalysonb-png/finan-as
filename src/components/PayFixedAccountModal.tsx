import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Calendar, DollarSign, Wallet, FileText, AlertTriangle, Layers } from 'lucide-react';
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
}

export const PayFixedAccountModal: React.FC<PayFixedAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirmPayment,
  account,
  installment,
  accounts,
  pastUnpaidInstallments = []
}) => {
  const [dataPagamento, setDataPagamento] = useState('');
  const [valorPago, setValorPago] = useState('');
  const [contaPagamento, setContaPagamento] = useState('');
  const [operacao, setOperacao] = useState('Pix');
  const [observacao, setObservacao] = useState('');
  const [quitarAcumulados, setQuitarAcumulados] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const pastUnpaidTotal = pastUnpaidInstallments.reduce((sum, inst) => sum + (Number(inst.valor) || 0), 0);
  const currentInstVal = installment ? Number(installment.valor) || 0 : 0;
  const totalWithAccumulated = currentInstVal + pastUnpaidTotal;

  useEffect(() => {
    if (installment && account) {
      const today = new Date().toISOString().split('T')[0];
      setDataPagamento(installment.dataPagamento || today);
      
      const hasPast = pastUnpaidInstallments.length > 0;
      setQuitarAcumulados(hasPast);
      
      const initialVal = hasPast ? (currentInstVal + pastUnpaidTotal) : currentInstVal;
      setValorPago(String(initialVal || '0'));
      setContaPagamento(installment.contaPagamento || account.conta || accounts[0] || 'Conta Talyson');
      setOperacao('Pix');
      setObservacao(installment.observacao || '');
    }
  }, [installment, account, accounts, pastUnpaidInstallments]);

  if (!isOpen || !account || !installment) return null;

  const [year, month] = installment.periodo.split('-');
  const monthName = MONTHS[parseInt(month, 10) - 1] || installment.periodo;
  const isReceita = account.natureza === 'receita';

  const handleToggleQuitarAcumulados = (checked: boolean) => {
    setQuitarAcumulados(checked);
    if (checked) {
      setValorPago(String(totalWithAccumulated.toFixed(2)));
    } else {
      setValorPago(String(currentInstVal.toFixed(2)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(valorPago) || 0;
    if (val <= 0 || !dataPagamento) return;

    setSubmitting(true);
    try {
      const includedIds = [installment.id];
      if (quitarAcumulados && pastUnpaidInstallments.length > 0) {
        pastUnpaidInstallments.forEach(p => includedIds.push(p.id));
      }

      await onConfirmPayment(account, installment, {
        dataPagamento,
        valorPago: val,
        contaPagamento,
        operacao,
        observacao: observacao.trim(),
        includedInstallmentIds: includedIds
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-slate-900 border ${
        isReceita ? 'border-emerald-500/50' : 'border-indigo-500/40'
      } rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5`}>
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isReceita
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
            }`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isReceita ? 'Registrar Recebimento de Receita' : 'Registrar Pagamento'}
              </h3>
              <p className="text-xs text-slate-400">
                {account.nome} — Parcela {installment.numeroParcela}/{installment.totalParcelas} ({monthName}/{year})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo do Lançamento e Alerta de Acumulado */}
        <div className="space-y-2">
          {pastUnpaidInstallments.length > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Parcelas Anteriores Não Pagas Acumuladas!</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Esta conta possui <strong>{pastUnpaidInstallments.length} mês(es) anterior(es)</strong> não pago(s) totalizando <strong>R$ {pastUnpaidTotal.toFixed(2)}</strong> que foram automaticamente acumulados para este mês.
              </p>
              <div className="bg-slate-950/80 p-2 rounded-lg text-[10px] font-mono space-y-1">
                {pastUnpaidInstallments.map(p => (
                  <div key={p.id} className="flex justify-between text-slate-400">
                    <span>Mês {p.periodo} (Parcela {p.numeroParcela}/{p.totalParcelas}):</span>
                    <span className="text-amber-300 font-semibold">R$ {Number(p.valor).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800 font-bold">
                  <span>Parcela do Mês Atual ({installment.periodo}):</span>
                  <span className="text-white">R$ {currentInstVal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 pt-1 border-t border-slate-800 text-xs font-extrabold">
                  <span>Total Acumulado a Pagar:</span>
                  <span>R$ {totalWithAccumulated.toFixed(2)}</span>
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 text-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={quitarAcumulados}
                  onChange={e => handleToggleQuitarAcumulados(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-semibold">
                  Quitar o valor total acumulado (R$ {totalWithAccumulated.toFixed(2)}) e baixar meses anteriores
                </span>
              </label>
            </div>
          )}

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>{isReceita ? 'Data Prevista:' : 'Vencimento Previsto:'}</span>
              <span className="font-mono text-slate-200">{installment.dataVencimento.split('-').reverse().join('/')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Categoria / Origem:</span>
              <span className="font-semibold text-indigo-300">{account.origem} &bull; {account.classificacao}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Valor {pastUnpaidInstallments.length > 0 && quitarAcumulados ? 'Total com Acúmulo' : 'Deste Mês'}:</span>
              <span className="font-mono font-bold text-emerald-400">
                R$ {pastUnpaidInstallments.length > 0 && quitarAcumulados ? totalWithAccumulated.toFixed(2) : currentInstVal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

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
                  <option key={acc} value={acc}>{acc}</option>
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
                  <option key={op} value={op}>{op}</option>
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
              placeholder={isReceita ? 'Ex: Recebido com bônus, adiantamento quinzenal...' : 'Ex: Pago com desconto, pago adiantado...'}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-300 flex items-center gap-2">
            <FileText className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              Ao confirmar, este {isReceita ? 'recebimento' : 'pagamento'} será registrado automaticamente no <strong>Histórico de Lançamentos</strong> e {isReceita ? 'somado ao saldo (Entrada)' : 'debitado do saldo (Saída)'}.
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
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold rounded-lg text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
            >
              {submitting ? 'Registrando...' : isReceita ? 'Confirmar Recebimento' : 'Confirmar Pagamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
