import React from 'react';
import {
  Edit3, Filter, Download, Upload, Plus, Trash2, Info, Layers, Tag
} from 'lucide-react';
import { Transaction, Card } from '../types';
import { MONTHS } from '../constants';

interface TransactionsTableProps {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  selectedTxIds: number[];
  showAllMonths: boolean;
  spreadsheetMode: boolean;
  showColumnFilters: boolean;
  searchTx: string;
  columnFilters: {
    origem: string;
    classificacao: string;
    conta: string;
    operacao: string;
    individuo: string;
  };
  categoriesMap: Record<string, string[]>;
  accounts: string[];
  cards: Card[];
  selectedMonth: number;
  selectedYear: number;
  onToggleShowAllMonths: () => void;
  onToggleSpreadsheetMode: () => void;
  onToggleColumnFilters: () => void;
  onSetSearchTx: (val: string) => void;
  onSetColumnFilters: React.Dispatch<React.SetStateAction<{
    origem: string;
    classificacao: string;
    conta: string;
    operacao: string;
    individuo: string;
  }>>;
  onOpenAddTxModal: () => void;
  onExportCSV: () => void;
  onImportCSV: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteSingleTx: (id: number) => void;
  onDeleteSelectedTx: () => void;
  onSelectTx: (id: number) => void;
  onSelectAllTx: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateTx: (id: number, field: string, value: any) => Promise<void>;
  onOpenCustomModal: (type: 'origem' | 'classificacao' | 'conta', categoryTarget?: string) => void;
  uniqueOrigins: string[];
  uniqueClassifications: string[];
  uniqueAccounts: string[];
  uniqueOperations: string[];
  uniqueIndividuals: string[];
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  filteredTransactions,
  selectedTxIds,
  showAllMonths,
  spreadsheetMode,
  showColumnFilters,
  searchTx,
  columnFilters,
  categoriesMap,
  accounts,
  cards,
  selectedMonth,
  selectedYear,
  onToggleShowAllMonths,
  onToggleSpreadsheetMode,
  onToggleColumnFilters,
  onSetSearchTx,
  onSetColumnFilters,
  onOpenAddTxModal,
  onExportCSV,
  onImportCSV,
  onDeleteSingleTx,
  onDeleteSelectedTx,
  onSelectTx,
  onSelectAllTx,
  onUpdateTx,
  onOpenCustomModal,
  uniqueOrigins,
  uniqueClassifications,
  uniqueAccounts,
  uniqueOperations,
  uniqueIndividuals
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-[660px]">
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0 bg-slate-900/95">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-bold flex items-center gap-2">
            Histórico de Lançamentos
            <span className="text-xs font-normal text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {showAllMonths ? 'Todos os Meses' : `${MONTHS[selectedMonth - 1]} / ${selectedYear}`} ({filteredTransactions.length})
            </span>
          </span>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-4 flex-wrap">
            <button
              onClick={onToggleShowAllMonths}
              className={`text-xs border px-2.5 py-1.5 rounded font-semibold transition-colors flex items-center gap-1 ${
                showAllMonths
                  ? 'bg-amber-600/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {showAllMonths ? 'Ver Apenas Mês Atual' : 'Ver Todos os Meses'}
            </button>

            <button
              onClick={onToggleSpreadsheetMode}
              className={`text-xs border px-3 py-1.5 rounded font-semibold transition-colors flex items-center gap-1.5 ${
                spreadsheetMode
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-950 border-slate-800 text-indigo-400 hover:bg-slate-800'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              {spreadsheetMode ? 'Modo Edição (ON)' : 'Ativar Edição Direta'}
            </button>

            <button
              onClick={onToggleColumnFilters}
              className={`text-xs border px-3 py-1.5 rounded font-semibold transition-colors flex items-center gap-1.5 ${
                showColumnFilters
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {showColumnFilters ? 'Ocultar Filtros' : 'Filtros por Colunas'}
            </button>

            <button
              onClick={onExportCSV}
              className="text-xs border border-slate-800 bg-slate-950 text-emerald-400 hover:bg-slate-800 px-3 py-1.5 rounded font-semibold transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Exportar CSV
            </button>

            <label className="text-xs border border-slate-800 bg-slate-950 text-amber-400 hover:bg-slate-800 px-3 py-1.5 rounded font-semibold transition-colors flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Importar CSV
              <input type="file" accept=".csv" className="hidden" onChange={onImportCSV} />
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Buscar no histórico..."
            value={searchTx}
            onChange={e => onSetSearchTx(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 min-w-[200px]"
          />
          <button
            onClick={onOpenAddTxModal}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Novo Lançamento
          </button>
          {selectedTxIds.length > 0 && (
            <button
              onClick={onDeleteSelectedTx}
              className="flex items-center gap-1 bg-rose-600/90 hover:bg-rose-500 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Excluir ({selectedTxIds.length})
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto flex-1 overflow-y-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800 sticky top-0 z-10">
            <tr>
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  className="accent-indigo-500 cursor-pointer w-3.5 h-3.5 rounded"
                  onChange={onSelectAllTx}
                  checked={selectedTxIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                />
              </th>
              <th className="p-3 min-w-[130px]">1. Data</th>
              <th className="p-3 min-w-[160px]">2. Origem/Destino</th>
              <th className="p-3 min-w-[170px]">3. Classificação</th>
              <th className="p-3 min-w-[160px]">4. Conta (Destaque)</th>
              <th className="p-3 min-w-[120px]">5. Operação</th>
              <th className="p-3 min-w-[160px]">6. Cartão</th>
              <th className="p-3 min-w-[120px] text-right">7. Entrada (R$)</th>
              <th className="p-3 min-w-[120px] text-right">8. Saída (R$)</th>
              <th className="p-3 min-w-[220px]">9. Comentário</th>
              <th className="p-3 min-w-[120px]">10. Indivíduo</th>
              <th className="p-3 w-12 text-center">Ações</th>
            </tr>

            {showColumnFilters && (
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-300 normal-case">
                <th className="p-2 text-center">
                  {(columnFilters.origem || columnFilters.classificacao || columnFilters.conta || columnFilters.operacao || columnFilters.individuo) && (
                    <button
                      onClick={() => onSetColumnFilters({ origem: '', classificacao: '', conta: '', operacao: '', individuo: '' })}
                      className="text-[10px] text-rose-400 hover:underline font-bold"
                    >
                      Limpar
                    </button>
                  )}
                </th>
                <th className="p-2"><span className="text-[10px] text-slate-500 block">Data</span></th>
                <th className="p-2">
                  <select
                    value={columnFilters.origem}
                    onChange={e => onSetColumnFilters({ ...columnFilters, origem: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-indigo-300 focus:outline-none"
                  >
                    <option value="">Todas as Origens</option>
                    {uniqueOrigins.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </th>
                <th className="p-2">
                  <select
                    value={columnFilters.classificacao}
                    onChange={e => onSetColumnFilters({ ...columnFilters, classificacao: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-indigo-300 focus:outline-none"
                  >
                    <option value="">Todas Classificações</option>
                    {uniqueClassifications.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </th>
                <th className="p-2">
                  <select
                    value={columnFilters.conta}
                    onChange={e => onSetColumnFilters({ ...columnFilters, conta: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-indigo-300 focus:outline-none"
                  >
                    <option value="">Todas as Contas</option>
                    {uniqueAccounts.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </th>
                <th className="p-2">
                  <select
                    value={columnFilters.operacao}
                    onChange={e => onSetColumnFilters({ ...columnFilters, operacao: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-indigo-300 focus:outline-none"
                  >
                    <option value="">Todas Operações</option>
                    {uniqueOperations.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                </th>
                <th className="p-2"><span className="text-[10px] text-slate-500 block">-</span></th>
                <th className="p-2 text-right"><span className="text-[10px] text-slate-500 block">-</span></th>
                <th className="p-2 text-right"><span className="text-[10px] text-slate-500 block">-</span></th>
                <th className="p-2"><span className="text-[10px] text-slate-500 block">-</span></th>
                <th className="p-2">
                  <select
                    value={columnFilters.individuo}
                    onChange={e => onSetColumnFilters({ ...columnFilters, individuo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-indigo-300 focus:outline-none"
                  >
                    <option value="">Todos Indivíduos</option>
                    {uniqueIndividuals.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                </th>
                <th className="p-2"></th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-8 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Info className="w-8 h-8 text-slate-600" />
                    <p>Nenhum lançamento encontrado para este período com os filtros aplicados.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTransactions.map(tx => {
                const isFixedAccountTx = !!tx.fixedInstallmentId || (tx.comentario || '').toLowerCase().includes('conta fixa');

                return (
                  <tr
                    key={tx.id}
                    className={`hover:bg-slate-800/50 transition-colors ${
                      selectedTxIds.includes(tx.id) ? 'bg-indigo-900/10' : ''
                    } ${isFixedAccountTx ? 'border-l-2 border-emerald-500' : ''}`}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        className="accent-indigo-500 cursor-pointer w-3.5 h-3.5 rounded"
                        checked={selectedTxIds.includes(tx.id)}
                        onChange={() => onSelectTx(tx.id)}
                      />
                    </td>

                    <td className="p-2">
                      {spreadsheetMode ? (
                        <input
                          type="date"
                          value={tx.data}
                          onChange={e => onUpdateTx(tx.id, 'data', e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-full text-white focus:border-indigo-500 focus:outline-none"
                        />
                      ) : (
                        <span className="font-mono">{tx.data.split('-').reverse().join('/')}</span>
                      )}
                    </td>

                    <td className="p-2">
                      {spreadsheetMode ? (
                        <select
                          value={tx.origem}
                          onChange={e => {
                            if (e.target.value === '___NEW___') {
                              onOpenCustomModal('origem');
                            } else {
                              onUpdateTx(tx.id, 'origem', e.target.value);
                            }
                          }}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-full text-white focus:border-indigo-500 focus:outline-none"
                        >
                          {Object.keys(categoriesMap).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="___NEW___" className="text-indigo-400 font-bold">+ Adicionar Categoria...</option>
                        </select>
                      ) : (
                        <span className="font-semibold text-slate-300">{tx.origem}</span>
                      )}
                    </td>

                    <td className="p-2">
                      {spreadsheetMode ? (
                        <select
                          value={tx.classificacao}
                          onChange={e => {
                            if (e.target.value === '___NEW___') {
                              onOpenCustomModal('classificacao', tx.origem);
                            } else {
                              onUpdateTx(tx.id, 'classificacao', e.target.value);
                            }
                          }}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-full text-white focus:border-indigo-500 focus:outline-none"
                        >
                          {(categoriesMap[tx.origem] || ['Geral']).map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                          <option value="___NEW___" className="text-indigo-400 font-bold">+ Adicionar Classificação...</option>
                        </select>
                      ) : (
                        <span className="text-slate-400">{tx.classificacao}</span>
                      )}
                    </td>

                    <td className="p-2">
                      {spreadsheetMode ? (
                        <select
                          value={tx.conta}
                          onChange={e => {
                            if (e.target.value === '___NEW___') {
                              onOpenCustomModal('conta');
                            } else {
                              onUpdateTx(tx.id, 'conta', e.target.value);
                            }
                          }}
                          className={`border rounded px-2 py-1 w-full text-xs font-semibold focus:outline-none ${
                            tx.conta === 'Conta Talyson'
                              ? 'bg-blue-950/80 border-blue-500/60 text-blue-200'
                              : tx.conta === 'Conta Karla'
                              ? 'bg-purple-950/80 border-purple-500/60 text-purple-200'
                              : 'bg-slate-950 border-slate-700 text-white'
                          }`}
                        >
                          {accounts.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                          <option value="___NEW___" className="text-indigo-400 font-bold">+ Adicionar Conta...</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${
                            tx.conta === 'Conta Talyson'
                              ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                              : tx.conta === 'Conta Karla'
                              ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                              : 'bg-slate-800/80 border-slate-700 text-slate-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              tx.conta === 'Conta Talyson'
                                ? 'bg-blue-400 animate-pulse'
                                : tx.conta === 'Conta Karla'
                                ? 'bg-purple-400 animate-pulse'
                                : 'bg-slate-400'
                            }`}
                          ></span>
                          {tx.conta}
                        </span>
                      )}
                    </td>

                    <td className="p-2">
                      {spreadsheetMode ? (
                        <select
                          value={tx.operacao}
                          onChange={e => onUpdateTx(tx.id, 'operacao', e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-full text-white focus:border-indigo-500 focus:outline-none"
                        >
                          {['Pix', 'Débito', 'Crédito', 'Dinheiro', 'Transferência', 'Boleto'].map(o => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            tx.operacao === 'Crédito'
                              ? 'bg-purple-500/20 text-purple-400'
                              : tx.operacao === 'Pix'
                              ? 'bg-teal-500/20 text-teal-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {tx.operacao}
                        </span>
                      )}
                    </td>

                    <td className="p-2">
                      {tx.operacao === 'Crédito' ? (
                        spreadsheetMode ? (
                          <select
                            value={tx.cartaoId || ''}
                            onChange={e => onUpdateTx(tx.id, 'cartaoId', e.target.value ? parseInt(e.target.value, 10) : null)}
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-full text-white focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="">Selecione Cartão...</option>
                            {cards.map(c => (
                              <option key={c.id} value={c.id}>{c.nome}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-purple-300 font-semibold">
                            {cards.find(c => Number(c.id) === Number(tx.cartaoId))?.nome || 'Cartão'}
                          </span>
                        )
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    <td className="p-2 text-right">
                      {spreadsheetMode ? (
                        <input
                          type="number"
                          step="0.01"
                          value={tx.entrada}
                          onChange={e => onUpdateTx(tx.id, 'entrada', parseFloat(e.target.value) || 0)}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-24 text-right text-emerald-400 focus:border-indigo-500 focus:outline-none"
                        />
                      ) : (
                        <span className={`font-mono font-semibold ${tx.entrada > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                          {tx.entrada > 0 ? `+ R$ ${tx.entrada.toFixed(2)}` : '-'}
                        </span>
                      )}
                    </td>

                    <td className="p-2 text-right">
                      {spreadsheetMode ? (
                        <input
                          type="number"
                          step="0.01"
                          value={tx.saída}
                          onChange={e => onUpdateTx(tx.id, 'saída', parseFloat(e.target.value) || 0)}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-24 text-right text-rose-400 focus:border-indigo-500 focus:outline-none"
                        />
                      ) : (
                        <span className={`font-mono font-semibold ${tx.saída > 0 ? 'text-rose-400' : 'text-slate-600'}`}>
                          {tx.saída > 0 ? `- R$ ${tx.saída.toFixed(2)}` : '-'}
                        </span>
                      )}
                    </td>

                    <td className="p-2">
                      {spreadsheetMode ? (
                        <input
                          type="text"
                          value={tx.comentario || ''}
                          onChange={e => onUpdateTx(tx.id, 'comentario', e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-full text-white focus:border-indigo-500 focus:outline-none"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5 max-w-[240px]">
                          {isFixedAccountTx && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0"
                              title="Lançamento gerado a partir de Conta Fixa Quitada"
                            >
                              Conta Fixa
                            </span>
                          )}
                          <span className="text-slate-300 truncate block">{tx.comentario || '-'}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-2">
                      {spreadsheetMode ? (
                        <select
                          value={tx.individuo}
                          onChange={e => onUpdateTx(tx.id, 'individuo', e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-full text-white focus:border-indigo-500 focus:outline-none"
                        >
                          {['Talyson', 'Karla', 'Ambos'].map(i => (
                            <option key={i} value={i}>{i}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-slate-400">{tx.individuo}</span>
                      )}
                    </td>

                    <td className="p-2 text-center">
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
    </div>
  );
};
