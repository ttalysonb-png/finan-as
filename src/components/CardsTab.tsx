import React from 'react';
import {
  CreditCard, Plus, History, Trash2, FileText, Edit3
} from 'lucide-react';
import { Card, Transaction } from '../types';
import { MONTHS } from '../constants';

interface CardsTabProps {
  cards: Card[];
  selectedCardForDetails: Card | null;
  selectedMonth: number;
  selectedYear: number;
  cardSpreadsheetMode: boolean;
  getCardInvoice: (cardId: number, baseValue: number) => number;
  getCardTransactionsForPeriod: (cardId: number) => Transaction[];
  onSetSelectedCardForDetails: (card: Card | null) => void;
  onSetCardSpreadsheetMode: (val: boolean) => void;
  onOpenAddCard: () => void;
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
  onSetSelectedCardForDetails,
  onSetCardSpreadsheetMode,
  onOpenAddCard,
  onDeleteCard,
  onDeleteSingleTx
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Cartões de Crédito Cadastrados</h2>
          <p className="text-xs text-slate-400">
            Gastos efetuados a partir do dia 16 caem automaticamente na fatura do mês seguinte
          </p>
        </div>
        <button
          onClick={onOpenAddCard}
          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Adicionar Cartão
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(card => {
          const invoiceValue = getCardInvoice(card.id, card.faturaAtual);
          const availableLimit = Math.max(0, card.limite - invoiceValue);
          const percentUsed = card.limite > 0 ? Math.min(100, (invoiceValue / card.limite) * 100) : 0;
          const isSelectedCard = selectedCardForDetails && selectedCardForDetails.id === card.id;

          return (
            <div
              key={card.id}
              className={`bg-gradient-to-br ${
                card.cor || 'from-indigo-600 to-purple-800'
              } rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between min-h-[240px] relative overflow-hidden group border-2 transition-all ${
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
                    <span className="text-[10px] text-white/70 block">
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

                {/* Barra de Progresso do Limite Utilizado */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-white/80 font-medium mb-1">
                    <span>Uso do Limite</span>
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
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Lançamentos da Fatura — {selectedCardForDetails ? selectedCardForDetails.nome : cards[0].nome}
                </h3>
                <p className="text-xs text-slate-400">
                  Fatura referente a {MONTHS[selectedMonth - 1]} / {selectedYear} (Dia 16 do mês anterior até o dia 15 deste mês)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => onSetCardSpreadsheetMode(!cardSpreadsheetMode)}
                className={`text-xs border px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                  cardSpreadsheetMode
                    ? 'bg-purple-600 border-purple-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-700 text-purple-300 hover:bg-slate-800'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                {cardSpreadsheetMode ? 'Modo Edição (ON)' : 'Ativar Edição na Fatura'}
              </button>

              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 font-semibold">Cartão:</label>
                <select
                  value={selectedCardForDetails ? selectedCardForDetails.id : cards[0].id}
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

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Data da Compra</th>
                  <th className="p-3">Categoria / Origem</th>
                  <th className="p-3">Classificação</th>
                  <th className="p-3">Comentário</th>
                  <th className="p-3">Indivíduo</th>
                  <th className="p-3 text-right">Valor do Gasto (R$)</th>
                  <th className="p-3 text-center w-16">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {(() => {
                  const targetCardId = selectedCardForDetails ? selectedCardForDetails.id : cards[0].id;
                  const cardTxs = getCardTransactionsForPeriod(targetCardId);
                  const baseFat = selectedCardForDetails
                    ? Number(selectedCardForDetails.faturaAtual)
                    : Number(cards[0].faturaAtual);

                  if (cardTxs.length === 0 && baseFat === 0) {
                    return (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          Nenhum gasto registrado nesta fatura para o período selecionado.
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <>
                      {baseFat > 0 && (
                        <tr className="bg-purple-950/20">
                          <td className="p-3 font-mono">-</td>
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
                      {cardTxs.map(t => (
                        <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="p-3 font-mono">{t.data.split('-').reverse().join('/')}</td>
                          <td className="p-3 font-semibold text-slate-200">{t.origem}</td>
                          <td className="p-3 text-slate-400">{t.classificacao}</td>
                          <td className="p-3 text-slate-300">{t.comentario || '-'}</td>
                          <td className="p-3 text-slate-400">{t.individuo}</td>
                          <td className="p-3 text-right font-mono font-bold text-rose-400">
                            - R$ {(Number(t.saída) || 0).toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => onDeleteSingleTx(t.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Excluir lançamento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
