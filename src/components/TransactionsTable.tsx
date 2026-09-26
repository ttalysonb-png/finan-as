import React, { useState } from 'react';
import {
  Edit3, Filter, Download, Upload, Plus, Trash2, Info, Layers, Tag,
  Eye, LayoutGrid, Table, Calendar, CreditCard, TrendingUp, TrendingDown,
  X, Check, DollarSign, Wallet, User, MessageSquare, ArrowUpRight, ArrowDownLeft
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
  onSaveEditedTx?: (updatedTx: Transaction) => Promise<void>;
  onOpenCustomModal: (type: 'origem' | 'classificacao' | 'conta', categoryTarget?: string) => void;
  uniqueOrigins: string[];
  uniqueClassifications: string[];
  uniqueAccounts: string[];
  uniqueOperations: string[];
  uniqueIndividuals: string[];
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
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
  onSaveEditedTx,
  onOpenCustomModal,
  uniqueOrigins,
  uniqueClassifications,
  uniqueAccounts,
  uniqueOperations,
  uniqueIndividuals
}) => {
  // Modo de visualização: 'cards' ou 'table'
  // No mobile, exibimos cards por padrão
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Estados dos modais de Detalhe e Edição
  const [txToDetail, setTxToDetail] = useState<Transaction | null>(null);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);

  // Form state para edição de lançamento
  const [editForm, setEditForm] = useState({
    data: '',
    origem: '',
    classificacao: '',
    conta: '',
    operacao: 'Pix',
    cartaoId: '' as string | number,
    entrada: '',
    saida: '',
    comentario: '',
    individuo: 'Ambos'
  });

  // Abrir modal de edição com os dados preenchidos
  const handleOpenEdit = (tx: Transaction) => {
    setTxToEdit(tx);
    setEditForm({
      data: tx.data,
      origem: tx.origem,
      classificacao: tx.classificacao,
      conta: tx.conta,
      operacao: tx.operacao || 'Pix',
      cartaoId: tx.cartaoId ? String(tx.cartaoId) : '',
      entrada: tx.entrada > 0 ? String(tx.entrada) : '',
      saida: tx.saída > 0 ? String(tx.saída) : '',
      comentario: tx.comentario || '',
      individuo: tx.individuo || 'Ambos'
    });
  };

  // Salvar alterações da edição
  const handleSaveEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txToEdit) return;

    const updatedTx: Transaction = {
      ...txToEdit,
      data: editForm.data,
      origem: editForm.origem,
      classificacao: editForm.classificacao,
      conta: editForm.conta,
      operacao: editForm.operacao,
      cartaoId: editForm.operacao === 'Crédito' && editForm.cartaoId ? parseInt(String(editForm.cartaoId), 10) : undefined,
      entrada: parseFloat(editForm.entrada) || 0,
      saída: parseFloat(editForm.saida) || 0,
      comentario: editForm.comentario,
      individuo: editForm.individuo
    };

    if (onSaveEditedTx) {
      await onSaveEditedTx(updatedTx);
    } else {
      // Fallback usando onUpdateTx campo a campo
      await onUpdateTx(txToEdit.id, 'data', updatedTx.data);
      await onUpdateTx(txToEdit.id, 'origem', updatedTx.origem);
      await onUpdateTx(txToEdit.id, 'classificacao', updatedTx.classificacao);
      await onUpdateTx(txToEdit.id, 'conta', updatedTx.conta);
      await onUpdateTx(txToEdit.id, 'operacao', updatedTx.operacao);
      await onUpdateTx(txToEdit.id, 'cartaoId', updatedTx.cartaoId);
      await onUpdateTx(txToEdit.id, 'entrada', updatedTx.entrada);
      await onUpdateTx(txToEdit.id, 'saída', updatedTx.saída);
      await onUpdateTx(txToEdit.id, 'comentario', updatedTx.comentario);
      await onUpdateTx(txToEdit.id, 'individuo', updatedTx.individuo);
    }

    setTxToEdit(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col min-h-[660px]">
      {/* Barra Superior / Cabeçalho */}
      <div className="p-3 sm:p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-slate-900/95">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <span className="text-sm font-bold flex items-center gap-2">
            Histórico de Lançamentos
            <span className="text-xs font-normal text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {showAllMonths ? 'Todos os Meses' : `${MONTHS[selectedMonth - 1]} / ${selectedYear}`} ({filteredTransactions.length})
            </span>
          </span>

          {/* Alternador de Modo de Visualização: Cards vs Tabela */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Visualizar em Cards (ideal para celular)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Visualizar em Tabela completa"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabela</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 border-l border-slate-800 pl-2 sm:pl-4 flex-wrap">
            <button
              onClick={onToggleShowAllMonths}
              className={`text-[11px] sm:text-xs border px-2.5 py-1.5 rounded font-semibold transition-colors flex items-center gap-1 ${
                showAllMonths
                  ? 'bg-amber-600/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {showAllMonths ? 'Apenas Mês Atual' : 'Todos os Meses'}
            </button>

            {viewMode === 'table' && (
              <button
                onClick={onToggleSpreadsheetMode}
                className={`text-[11px] sm:text-xs border px-2.5 sm:px-3 py-1.5 rounded font-semibold transition-colors flex items-center gap-1.5 ${
                  spreadsheetMode
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-950 border-slate-800 text-indigo-400 hover:bg-slate-800'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{spreadsheetMode ? 'Edição Direta (ON)' : 'Edição Direta'}</span>
              </button>
            )}

            <button
              onClick={onToggleColumnFilters}
              className={`text-[11px] sm:text-xs border px-2.5 sm:px-3 py-1.5 rounded font-semibold transition-colors flex items-center gap-1.5 ${
                showColumnFilters
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{showColumnFilters ? 'Ocultar Filtros' : 'Filtros'}</span>
            </button>

            <button
              onClick={onExportCSV}
              className="text-[11px] sm:text-xs border border-slate-800 bg-slate-950 text-emerald-400 hover:bg-slate-800 px-2.5 sm:px-3 py-1.5 rounded font-semibold transition-colors flex items-center gap-1.5"
              title="Exportar CSV"
            >
              <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Exportar</span>
            </button>

            <label className="text-[11px] sm:text-xs border border-slate-800 bg-slate-950 text-amber-400 hover:bg-slate-800 px-2.5 sm:px-3 py-1.5 rounded font-semibold transition-colors flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Importar</span>
              <input type="file" accept=".csv" className="hidden" onChange={onImportCSV} />
            </label>
          </div>
        </div>

        {/* Busca e Ações Rápidas */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar lançamentos..."
            value={searchTx}
            onChange={e => onSetSearchTx(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 flex-1 sm:w-56"
          />
          <button
            onClick={onOpenAddTxModal}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Novo Lançamento
          </button>
          {selectedTxIds.length > 0 && (
            <button
              onClick={onDeleteSelectedTx}
              className="flex items-center gap-1 bg-rose-600/90 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" /> Excluir ({selectedTxIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros por Coluna quando ativa */}
      {showColumnFilters && (
        <div className="p-3 bg-slate-950 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-1">Origem</span>
            <select
              value={columnFilters.origem}
              onChange={e => onSetColumnFilters({ ...columnFilters, origem: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-indigo-300 focus:outline-none"
            >
              <option value="">Todas as Origens</option>
              {uniqueOrigins.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-1">Classificação</span>
            <select
              value={columnFilters.classificacao}
              onChange={e => onSetColumnFilters({ ...columnFilters, classificacao: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-indigo-300 focus:outline-none"
            >
              <option value="">Todas Classificações</option>
              {uniqueClassifications.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-1">Conta</span>
            <select
              value={columnFilters.conta}
              onChange={e => onSetColumnFilters({ ...columnFilters, conta: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-indigo-300 focus:outline-none"
            >
              <option value="">Todas as Contas</option>
              {uniqueAccounts.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-1">Operação</span>
            <select
              value={columnFilters.operacao}
              onChange={e => onSetColumnFilters({ ...columnFilters, operacao: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-indigo-300 focus:outline-none"
            >
              <option value="">Todas Operações</option>
              {uniqueOperations.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-1">Indivíduo</span>
            <select
              value={columnFilters.individuo}
              onChange={e => onSetColumnFilters({ ...columnFilters, individuo: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-indigo-300 focus:outline-none"
            >
              <option value="">Todos Indivíduos</option>
              {uniqueIndividuals.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </div>

          <div className="flex items-end">
            {(columnFilters.origem || columnFilters.classificacao || columnFilters.conta || columnFilters.operacao || columnFilters.individuo) && (
              <button
                onClick={() => onSetColumnFilters({ origem: '', classificacao: '', conta: '', operacao: '', individuo: '' })}
                className="w-full bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/40 rounded px-2 py-1 text-xs font-semibold"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* SELEÇÃO GLOBAL QUANDO NO MODO CARDS */}
      {viewMode === 'cards' && filteredTransactions.length > 0 && (
        <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="accent-indigo-500 cursor-pointer w-4 h-4 rounded"
              onChange={onSelectAllTx}
              checked={selectedTxIds.length === filteredTransactions.length && filteredTransactions.length > 0}
            />
            <span>Selecionar todos ({filteredTransactions.length} lançamentos)</span>
          </label>

          {selectedTxIds.length > 0 && (
            <span className="text-indigo-400 font-semibold">
              {selectedTxIds.length} selecionado(s)
            </span>
          )}
        </div>
      )}

      {/* CORPO: MODO CARDS OU MODO TABELA */}
      {viewMode === 'cards' ? (
        /* MODO CARDS: Otimizado para Mobile e Visualização Intuitiva */
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <Info className="w-10 h-10 text-slate-600" />
              <p className="text-sm">Nenhum lançamento encontrado para este período com os filtros aplicados.</p>
              <button
                onClick={onOpenAddTxModal}
                className="mt-2 text-xs font-semibold text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Cadastrar primeiro lançamento
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredTransactions.map(tx => {
                const isFixedAccountTx = !!tx.fixedInstallmentId || (tx.comentario || '').toLowerCase().includes('conta fixa');
                const isSelected = selectedTxIds.includes(tx.id);
                const isEntrada = tx.entrada > 0;
                const valor = isEntrada ? tx.entrada : tx.saída;
                const formattedDate = tx.data.split('-').reverse().join('/');
                const cardName = tx.operacao === 'Crédito'
                  ? cards.find(c => Number(c.id) === Number(tx.cartaoId))?.nome || 'Cartão de Crédito'
                  : null;

                return (
                  <div
                    key={tx.id}
                    className={`bg-slate-900 border rounded-xl p-4 flex flex-col justify-between gap-3 transition-all shadow-md relative ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/20 shadow-indigo-950/50'
                        : isFixedAccountTx
                        ? 'border-emerald-500/40 hover:border-emerald-500/70'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Linha 1: Checkbox, Data e Badges de Operação/Conta */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          className="accent-indigo-500 cursor-pointer w-4 h-4 rounded shrink-0"
                          checked={isSelected}
                          onChange={() => onSelectTx(tx.id)}
                        />
                        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{formattedDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            tx.operacao === 'Crédito'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : tx.operacao === 'Pix'
                              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {tx.operacao}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            tx.conta === 'Conta Talyson'
                              ? 'bg-blue-950/60 border-blue-500/40 text-blue-300'
                              : tx.conta === 'Conta Karla'
                              ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          {tx.conta}
                        </span>
                      </div>
                    </div>

                    {/* Linha 2: Valor em destaque e Selo Conta Fixa */}
                    <div className="flex items-baseline justify-between gap-2 border-y border-slate-800/80 py-2.5">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          {isEntrada ? 'Receita / Entrada' : 'Despesa / Saída'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isEntrada ? (
                            <ArrowDownLeft className="w-5 h-5 text-emerald-400 shrink-0" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-rose-400 shrink-0" />
                          )}
                          <span
                            className={`text-xl font-extrabold font-mono tracking-tight ${
                              isEntrada ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isEntrada ? '+' : '-'} R$ {valor.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {isFixedAccountTx && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <Layers className="w-3 h-3" /> Conta Fixa
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium">
                          Indivíduo: <strong className="text-slate-200">{tx.individuo || 'Ambos'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Linha 3: Categorias e Detalhes Adicionais */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-indigo-950/50 border border-indigo-500/30 text-indigo-300 font-bold text-[11px] flex items-center gap-1">
                          <Tag className="w-3 h-3 text-indigo-400" />
                          {tx.origem}
                        </span>
                        <span className="text-slate-500">&bull;</span>
                        <span className="text-slate-300 font-semibold">{tx.classificacao}</span>

                        {cardName && (
                          <>
                            <span className="text-slate-500">&bull;</span>
                            <span className="px-2 py-0.5 rounded bg-purple-950/40 border border-purple-500/30 text-purple-300 text-[10px] font-semibold flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              {cardName}
                            </span>
                          </>
                        )}
                      </div>

                      {tx.comentario && (
                        <p className="text-xs text-slate-300 bg-slate-950/80 rounded-lg p-2 border border-slate-800/80 italic line-clamp-2">
                          &ldquo;{tx.comentario}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Linha 4: BOTÕES DE AÇÃO: DETALHAR, EDITAR, EXCLUIR */}
                    <div className="pt-2 border-t border-slate-800 grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setTxToDetail(tx)}
                        className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        title="Ver todos os detalhes deste lançamento"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Detalhar</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(tx)}
                        className="py-1.5 px-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        title="Editar lançamento"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => onDeleteSingleTx(tx.id)}
                        className="py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        title="Excluir este lançamento"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* MODO TABELA COMPLETA (Spreadsheet / Listagem clássica) */
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
                <th className="p-3 min-w-[160px]">4. Conta</th>
                <th className="p-3 min-w-[120px]">5. Operação</th>
                <th className="p-3 min-w-[160px]">6. Cartão</th>
                <th className="p-3 min-w-[120px] text-right">7. Entrada (R$)</th>
                <th className="p-3 min-w-[120px] text-right">8. Saída (R$)</th>
                <th className="p-3 min-w-[220px]">9. Comentário</th>
                <th className="p-3 min-w-[120px]">10. Indivíduo</th>
                <th className="p-3 min-w-[130px] text-center">Ações</th>
              </tr>
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

                      {/* AÇÕES NA TABELA: Detalhar, Editar, Excluir */}
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setTxToDetail(tx)}
                            className="p-1 text-slate-400 hover:text-indigo-400 transition-colors rounded hover:bg-slate-800"
                            title="Detalhes do lançamento"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(tx)}
                            className="p-1 text-slate-400 hover:text-indigo-300 transition-colors rounded hover:bg-slate-800"
                            title="Editar lançamento"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteSingleTx(tx.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 transition-colors rounded hover:bg-slate-800"
                            title="Excluir lançamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: DETALHES DO LANÇAMENTO */}
      {txToDetail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Detalhes do Lançamento</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Registro #{txToDetail.id}</span>
                </div>
              </div>
              <button
                onClick={() => setTxToDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bloco de Valor Principal */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              txToDetail.entrada > 0
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            }`}>
              <div>
                <span className="text-xs uppercase font-semibold block text-slate-400">
                  {txToDetail.entrada > 0 ? 'Receita / Entrada Realizada' : 'Despesa / Saída Registrada'}
                </span>
                <span className="text-2xl font-black font-mono">
                  {txToDetail.entrada > 0 ? '+' : '-'} R$ {(txToDetail.entrada > 0 ? txToDetail.entrada : txToDetail.saída).toFixed(2)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                {txToDetail.entrada > 0 ? (
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-rose-400" />
                )}
              </div>
            </div>

            {/* Informações Estruturadas em Grade */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-medium block">Data do Lançamento</span>
                <div className="font-bold text-white flex items-center gap-1.5 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  {txToDetail.data.split('-').reverse().join('/')}
                </div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-medium block">Forma de Operação</span>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                    {txToDetail.operacao}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-medium block">Conta Vinculada</span>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-indigo-400" />
                  {txToDetail.conta}
                </div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-medium block">Indivíduo Responsável</span>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  {txToDetail.individuo || 'Ambos'}
                </div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-medium block">Origem / Categoria</span>
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" />
                  {txToDetail.origem}
                </div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-medium block">Classificação Específica</span>
                <div className="font-bold text-slate-200">
                  {txToDetail.classificacao}
                </div>
              </div>
            </div>

            {/* Cartão de Crédito (se houver) */}
            {txToDetail.operacao === 'Crédito' && (
              <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="text-[10px] text-purple-300 block">Cartão Selecionado</span>
                    <span className="font-bold text-white">
                      {cards.find(c => Number(c.id) === Number(txToDetail.cartaoId))?.nome || 'Cartão de Crédito'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Vínculo de Conta Fixa */}
            {(!!txToDetail.fixedInstallmentId || (txToDetail.comentario || '').toLowerCase().includes('conta fixa')) && (
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2 text-xs">
                <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-emerald-300">
                  Este lançamento foi gerado automaticamente a partir da quitação de uma <strong>Conta Fixa Recorrente</strong>.
                </span>
              </div>
            )}

            {/* Comentário / Observação */}
            {txToDetail.comentario && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Observação / Comentário
                </span>
                <p className="text-slate-200 italic">&ldquo;{txToDetail.comentario}&rdquo;</p>
              </div>
            )}

            {/* Botões do Rodapé do Modal */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 gap-3">
              <button
                onClick={() => {
                  const id = txToDetail.id;
                  setTxToDetail(null);
                  onDeleteSingleTx(id);
                }}
                className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const tx = txToDetail;
                    setTxToDetail(null);
                    handleOpenEdit(tx);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Editar Lançamento
                </button>

                <button
                  onClick={() => setTxToDetail(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR LANÇAMENTO */}
      {txToEdit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Editar Lançamento</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Registro #{txToEdit.id}</span>
                </div>
              </div>
              <button
                onClick={() => setTxToEdit(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={editForm.data}
                    onChange={e => setEditForm({ ...editForm, data: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Operação</label>
                  <select
                    value={editForm.operacao}
                    onChange={e => setEditForm({ ...editForm, operacao: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {['Pix', 'Débito', 'Crédito', 'Dinheiro', 'Transferência', 'Boleto'].map(op => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>
              </div>

              {editForm.operacao === 'Crédito' && (
                <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl space-y-2">
                  <label className="text-xs text-purple-300 font-semibold block">Cartão de Crédito</label>
                  <select
                    value={editForm.cartaoId}
                    onChange={e => setEditForm({ ...editForm, cartaoId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">Selecione o Cartão...</option>
                    {cards.map(c => (
                      <option key={c.id} value={c.id}>{c.nome} ({c.titular})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Origem / Categoria</label>
                  <select
                    value={editForm.origem}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '___NEW___') {
                        onOpenCustomModal('origem');
                      } else {
                        const firstClass = (categoriesMap[val] || ['Geral'])[0];
                        setEditForm({ ...editForm, origem: val, classificacao: firstClass });
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {Object.keys(categoriesMap).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="___NEW___" className="text-indigo-400 font-bold">+ Adicionar Categoria...</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Classificação</label>
                  <select
                    value={editForm.classificacao}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '___NEW___') {
                        onOpenCustomModal('classificacao', editForm.origem);
                      } else {
                        setEditForm({ ...editForm, classificacao: val });
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {(categoriesMap[editForm.origem] || ['Geral']).map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                    <option value="___NEW___" className="text-indigo-400 font-bold">+ Adicionar Classificação...</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Conta Vinculada</label>
                  <select
                    value={editForm.conta}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '___NEW___') {
                        onOpenCustomModal('conta');
                      } else {
                        setEditForm({ ...editForm, conta: val });
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {accounts.map(acc => (
                      <option key={acc} value={acc}>{acc}</option>
                    ))}
                    <option value="___NEW___" className="text-indigo-400 font-bold">+ Adicionar Conta...</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Indivíduo</label>
                  <select
                    value={editForm.individuo}
                    onChange={e => setEditForm({ ...editForm, individuo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {['Ambos', 'Talyson', 'Karla'].map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Entrada / Receita (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.entrada}
                    onChange={e => setEditForm({ ...editForm, entrada: e.target.value, saida: e.target.value ? '' : editForm.saida })}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-emerald-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Saída / Despesa (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.saida}
                    onChange={e => setEditForm({ ...editForm, saida: e.target.value, entrada: e.target.value ? '' : editForm.entrada })}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-rose-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Comentário / Observação</label>
                <input
                  type="text"
                  value={editForm.comentario}
                  onChange={e => setEditForm({ ...editForm, comentario: e.target.value })}
                  placeholder="Ex: Supermercado mensal..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTxToEdit(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg text-white shadow-lg shadow-indigo-600/30 transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
