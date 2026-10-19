import React, { useState } from 'react';
import {
  CreditCard, Plus, History, Trash2, FileText, Edit3, Clock, Layers, Info
} from 'lucide-react';
import { Card, Transaction } from '../types';
import { MONTHS, getTransactionInvoicePeriod } from '../constants';

interface CardsTabProps {
  cards: Card[];
  selectedCardForDetails: Card | null;
  selectedMonth: number;
  selectedYear: number;
  cardSpreadsheetMode: boolean;
  getCardInvoice: (cardId: number, baseValue: number) => number;
  getCardTransactionsForPeriod: (cardId: number) => Transaction[];
  getCardFutureTransactions?: (cardId: number) => Transaction[];
  getCardFutureCommitted?: (cardId: number) => number;
  getCardTotalCommitted?: (cardId: number, baseValue: number) => number;
  onSetSelectedCardForDetails: (card: Card | null) => void;
  onSetCardSpreadsheetMode: (val: boolean) => void;
  onOpenAddCard: () => void;
  onOpenAddTxModal?: () => void;
  onDeleteCard: (cardId: number) => void;
  onDeleteSingleTx: (id: number) => void;
}

export const CardsTab: React.FC<CardsTabProps> = ({
  cards,
  selectedCardForDetails,
  selectedMonth,
  selectedYear,
  cardSpreadsheetMode,
  getCardInvoice,
  getCardTransactionsForPeriod,
  getCardFutureTransactions,
  getCardFutureCommitted,
  getCardTotalCommitted,
  onSetSelectedCardForDetails,
  onSetCardSpreadsheetMode,
  onOpenAddCard,
  onOpenAddTxModal,
  onDeleteCard,
  onDeleteSingleTx
}) => {
  const [tableFilter, setTableFilter] = useState<'fatura' | 'futuras' | 'todas'>('fatura');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Cartões de Crédito Cadastrados</h2>
          <p className="text-xs text-slate-400">
            Gastos efetuados a partir do dia 16 caem automaticamente na fatura do mês seguinte
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onOpenAddTxModal && (
            <button
              onClick={onOpenAddTxModal}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Lançar Compra / Parcelamento
            </button>
          )}
          <button
            onClick={onOpenAddCard}
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
          >
            <CreditCard className="w-4 h-4" /> Novo Cartão
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(card => {
          const invoiceValue = getCardInvoice(card.id, card.faturaAtual);
          const futureCommitted = getCardFutureCommitted ? getCardFutureCommitted(card.id) : 0;
          const totalCommitted = getCardTotalCommitted
            ? getCardTotalCommitted(card.id, card.faturaAtual)
            : invoiceValue + futureCommitted;
          // O limite disponível segue o padrão bancário: Limite Total - Limite Total Comprometido (Fatura Atual + Parcelas Futuras)
          const availableLimit = Math.max(0, card.limite - totalCommitted);
          const percentUsed = card.limite > 0 ? Math.min(100, (totalCommitted / card.limite) * 100) : 0;
          const isSelectedCard = selectedCardForDetails && selectedCardForDetails.id === card.id;

          return (
            <div
              key={card.id}
              className={`bg-gradient-to-br ${
                card.cor || 'from-indigo-600 to-purple-800'
              } rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between min-h-[260px] relative overflow-hidden group border-2 transition-all ${
                isSelectedCard ? 'border-white ring-4 ring-purple-500/30' : 'border-transparent'
              }`}
            >
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/70 font-bold">
                    {card.titular}
                  </span>
                  <h3 className="text-xl font-black mt-0.5">{card.nome}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSetSelectedCardForDetails(card)}
                    className={`p-1.5 rounded-lg text-white transition-colors ${
                      isSelectedCard ? 'bg-white/30' : 'bg-black/30 hover:bg-black/50'
                    }`}
                    title="Ver Histórico e Gerenciar Fatura"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteCard(card.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-black/30 hover:bg-black/50 rounded-lg text-rose-300"
                    title="Excluir cartão"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Valores Principais: Fatura e Limite Disponível */}
              <div className="relative z-10 my-auto py-2">
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-white/70 block font-medium">
                      Fatura Atual ({MONTHS[selectedMonth - 1]})
                    </span>
                    <span className="text-2xl font-extrabold tracking-tight">
                      R$ {invoiceValue.toFixed(2)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-emerald-200 font-semibold block uppercase tracking-wider">
                      Valor Disponível
                    </span>
                    <span className={`text-xl font-black tracking-tight ${
                      availableLimit <= 0 ? 'text-rose-300' : 'text-emerald-300'
                    }`}>
                      R$ {availableLimit.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Detalhe de comprometimento de parcelas futuras */}
                {futureCommitted > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/80">
                    <span className="flex items-center gap-1 text-purple-200">
                      <Clock className="w-3 h-3" /> Parcelas Futuras:
                    </span>
                    <span className="font-semibold text-white">R$ {futureCommitted.toFixed(2)}</span>
                  </div>
                )}

                {/* Barra de Progresso do Limite Utilizado */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-white/80 font-medium mb-1">
                    <span>
                      Comprometido: R$ {totalCommitted.toFixed(2)}
                    </span>
                    <span>{percentUsed.toFixed(0)}% utilizado</span>
                  </div>
                  <div className="w-full bg-black/30 backdrop-blur rounded-full h-2 overflow-hidden p-0.5 border border-white/15">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percentUsed >= 90
                          ? 'bg-rose-400'
                          : percentUsed >= 70
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${percentUsed}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Rodapé do Card */}
              <div className="flex justify-between items-end text-xs text-white/80 relative z-10 border-t border-white/10 pt-2.5">
                <div>
                  <span className="text-[9px] block text-white/60">Limite Total</span>
                  <span className="font-semibold text-sm">R$ {card.limite.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] block text-white/60">Fech. / Venc.</span>
                  <span className="font-semibold">
                    Dia {card.diaFechamento} / Dia {card.diaVencimento}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {cards.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 mt-8">
          {(() => {
            const targetCard = selectedCardForDetails || cards[0];
            const currentPeriodKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
            const targetCardId = targetCard.id;
            const cardTxs = getCardTransactionsForPeriod(targetCardId);
            const futureTxs = getCardFutureTransactions ? getCardFutureTransactions(targetCardId) : [];
            const baseFat = Number(targetCard.faturaAtual) || 0;
            const invoiceVal = getCardInvoice(targetCardId, targetCard.faturaAtual);
            const futureVal = getCardFutureCommitted ? getCardFutureCommitted(targetCardId) : 0;
            const totalComp = getCardTotalCommitted ? getCardTotalCommitted(targetCardId, targetCard.faturaAtual) : (invoiceVal + futureVal);
            const avail = Math.max(0, targetCard.limite - totalComp);

            let displayedTxs: { tx: Transaction; isFuture?: boolean }[] = [];
            if (tableFilter === 'fatura') {
              displayedTxs = cardTxs.map(tx => ({ tx, isFuture: false }));
            } else if (tableFilter === 'futuras') {
              displayedTxs = futureTxs.map(tx => ({ tx, isFuture: true }));
            } else {
              displayedTxs = [
                ...cardTxs.map(tx => ({ tx, isFuture: false })),
                ...futureTxs.map(tx => ({ tx, isFuture: true }))
              ].sort((a, b) => (a.tx.data || '').localeCompare(b.tx.data || ''));
            }

            return (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        Extrato e Fatura — {targetCard.nome}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Titular: {targetCard.titular} • Fatura referente a {MONTHS[selectedMonth - 1]} / {selectedYear}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Filtros da Tabela */}
                    <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                      <button
                        onClick={() => setTableFilter('fatura')}
                        className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                          tableFilter === 'fatura'
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Fatura do Mês ({cardTxs.length})
                      </button>
                      <button
                        onClick={() => setTableFilter('futuras')}
                        className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                          tableFilter === 'futuras'
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Parcelas Futuras ({futureTxs.length})
                      </button>
                      <button
                        onClick={() => setTableFilter('todas')}
                        className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                          tableFilter === 'todas'
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Todas as Compras ({cardTxs.length + futureTxs.length})
                      </button>
                    </div>

                    <button
                      onClick={() => onSetCardSpreadsheetMode(!cardSpreadsheetMode)}
                      className={`text-xs border px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                        cardSpreadsheetMode
                          ? 'bg-purple-600 border-purple-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-700 text-purple-300 hover:bg-slate-800'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {cardSpreadsheetMode ? 'Modo Edição (ON)' : 'Ativar Edição'}
                    </button>

                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400 font-semibold">Cartão:</label>
                      <select
                        value={targetCardId}
                        onChange={e => {
                          const cId = Number(e.target.value);
                          const found = cards.find(c => c.id === cId);
                          onSetSelectedCardForDetails(found || null);
                        }}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-purple-500"
                      >
                        {cards.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.nome} ({c.titular})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Painel Informativo com o Raciocínio Bancário */}
                <div className="bg-slate-950/70 border border-purple-500/20 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-300">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>
                      <strong>Raciocínio Bancário do Limite:</strong> O limite total é comprometido imediatamente pelo valor integral da compra (fatura atual + parcelas futuras).
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px] flex-wrap">
                    <span className="text-slate-400">Limite Total: <strong className="text-white">R$ {targetCard.limite.toFixed(2)}</strong></span>
                    <span className="text-purple-300">Fatura Atual: <strong>R$ {invoiceVal.toFixed(2)}</strong></span>
                    {futureVal > 0 && (
                      <span className="text-amber-300">Parcelas Futuras: <strong>R$ {futureVal.toFixed(2)}</strong></span>
                    )}
                    <span className="text-rose-300">Comprometido: <strong>R$ {totalComp.toFixed(2)}</strong></span>
                    <span className="text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded">
                      Disponível: <strong>R$ {avail.toFixed(2)}</strong>
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                      <tr>
                        <th className="p-3">Data / Mês</th>
                        <th className="p-3">Período da Fatura</th>
                        <th className="p-3">Categoria / Origem</th>
                        <th className="p-3">Classificação</th>
                        <th className="p-3">Comentário</th>
                        <th className="p-3">Indivíduo</th>
                        <th className="p-3 text-right">Valor do Gasto (R$)</th>
                        <th className="p-3 text-center w-16">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {tableFilter !== 'futuras' && baseFat > 0 && (
                        <tr className="bg-purple-950/20">
                          <td className="p-3 font-mono">-</td>
                          <td className="p-3 font-mono text-purple-400">{currentPeriodKey}</td>
                          <td className="p-3 font-semibold text-purple-300">Fatura Inicial Cadastrada</td>
                          <td className="p-3 text-slate-400">Saldo Anterior</td>
                          <td className="p-3 text-slate-300">Valor inicial informado no cadastro do cartão</td>
                          <td className="p-3 text-slate-400">-</td>
                          <td className="p-3 text-right font-mono font-bold text-purple-300">
                            R$ {baseFat.toFixed(2)}
                          </td>
                          <td className="p-3 text-center text-slate-500">-</td>
                        </tr>
                      )}

                      {displayedTxs.length === 0 && (tableFilter === 'futuras' || baseFat === 0) ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500">
                            {tableFilter === 'futuras'
                              ? 'Nenhuma parcela futura a vencer cadastrada para este cartão.'
                              : tableFilter === 'fatura'
                              ? 'Nenhum gasto registrado nesta fatura para o período selecionado.'
                              : 'Nenhuma compra registrada para este cartão.'}
                          </td>
                        </tr>
                      ) : (
                        displayedTxs.map(({ tx, isFuture }) => {
                          const txInvoicePeriod = getTransactionInvoicePeriod(tx.data);
                          return (
                            <tr
                              key={tx.id}
                              className={`hover:bg-slate-800/50 transition-colors ${
                                isFuture ? 'bg-amber-950/10' : ''
                              }`}
                            >
                              <td className="p-3 font-mono">
                                {tx.data ? tx.data.split('-').reverse().join('/') : '-'}
                              </td>
                              <td className="p-3 font-mono">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  isFuture
                                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                    : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                                }`}>
                                  {txInvoicePeriod || '-'}
                                  {isFuture && ' (Futura)'}
                                </span>
                              </td>
                              <td className="p-3 font-semibold text-slate-200">{tx.origem}</td>
                              <td className="p-3 text-slate-400">{tx.classificacao}</td>
                              <td className="p-3 text-slate-300">{tx.comentario || '-'}</td>
                              <td className="p-3 text-slate-400">{tx.individuo}</td>
                              <td className="p-3 text-right font-mono font-bold text-rose-400">
                                - R$ {(Number(tx.saída) || 0).toFixed(2)}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => onDeleteSingleTx(tx.id)}
                                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                                  title="Excluir lançamento"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
