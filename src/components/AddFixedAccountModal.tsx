import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Layers, PlusCircle, CreditCard, Sparkles } from 'lucide-react';
import { FixedAccount, Card } from '../types';
import { MONTHS, addMonthsToPeriod } from '../constants';

interface AddFixedAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (accountData: Partial<FixedAccount>, monthlyValues: { periodo: string; valor: number }[]) => Promise<void>;
  categoriesMap: Record<string, string[]>;
  accounts: string[];
  cards: Card[];
  selectedPeriodKey: string;
  accountToEdit?: FixedAccount | null;
  onOpenCustomModal: (type: 'origem' | 'classificacao' | 'conta', categoryTarget?: string) => void;
}

export const AddFixedAccountModal: React.FC<AddFixedAccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categoriesMap,
  accounts,
  cards,
  selectedPeriodKey,
  accountToEdit,
  onOpenCustomModal
}) => {
  const [nome, setNome] = useState('');
  const [origem, setOrigem] = useState('Infraestrutura');
  const [classificacao, setClassificacao] = useState('Aluguel');
  const [conta, setConta] = useState('Conta Talyson');
  const [individuo, setIndividuo] = useState('Ambos');
  const [diaVencimento, setDiaVencimento] = useState('10');
  const [mesInicio, setMesInicio] = useState(selectedPeriodKey);
  const [mesesDuracao, setMesesDuracao] = useState('12');
  const [tipoValor, setTipoValor] = useState<'fixo' | 'variavel'>('fixo');
  const [valorPadrao, setValorPadrao] = useState('');
  const [isCartao, setIsCartao] = useState(false);
  const [cartaoId, setCartaoId] = useState<string>('');
  const [observacao, setObservacao] = useState('');
  const [customMonthlyValues, setCustomMonthlyValues] = useState<{ periodo: string; valor: number }[]>([]);
  const [saving, setSaving] = useState(false);

  // Inicializa com dados para edição ou criação
  useEffect(() => {
    if (accountToEdit) {
      setNome(accountToEdit.nome);
      setOrigem(accountToEdit.origem);
      setClassificacao(accountToEdit.classificacao || (categoriesMap[accountToEdit.origem]?.[0] || 'Geral'));
      setConta(accountToEdit.conta);
      setIndividuo(accountToEdit.individuo || 'Ambos');
      setDiaVencimento(String(accountToEdit.diaVencimento || 10));
      setMesInicio(accountToEdit.mesInicio || selectedPeriodKey);
      setMesesDuracao(String(accountToEdit.mesesDuracao || 12));
      setTipoValor(accountToEdit.tipoValor || 'fixo');
      setValorPadrao(String(accountToEdit.valorPadrao || ''));
      setIsCartao(!!accountToEdit.isCartao);
      setCartaoId(accountToEdit.cartaoId ? String(accountToEdit.cartaoId) : '');
      setObservacao(accountToEdit.observacao || '');

      if (accountToEdit.installments && accountToEdit.installments.length > 0) {
        setCustomMonthlyValues(
          accountToEdit.installments.map(inst => ({
            periodo: inst.periodo,
            valor: Number(inst.valor) || 0
          }))
        );
      } else {
        generateMonthlyList(accountToEdit.mesInicio || selectedPeriodKey, accountToEdit.mesesDuracao || 12, accountToEdit.valorPadrao || 0);
      }
    } else {
      setNome('');
      setOrigem(Object.keys(categoriesMap)[0] || 'Infraestrutura');
      setClassificacao((categoriesMap[Object.keys(categoriesMap)[0]] || ['Aluguel'])[0]);
      setConta(accounts[0] || 'Conta Talyson');
      setIndividuo('Ambos');
      setDiaVencimento('10');
      setMesInicio(selectedPeriodKey);
      setMesesDuracao('12');
      setTipoValor('fixo');
      setValorPadrao('');
      setIsCartao(false);
      setCartaoId(cards[0]?.id ? String(cards[0].id) : '');
      setObservacao('');
      generateMonthlyList(selectedPeriodKey, 12, 0);
    }
  }, [accountToEdit, isOpen, selectedPeriodKey]);

  const generateMonthlyList = (startPeriod: string, totalMonths: number, baseVal: number) => {
    const list: { periodo: string; valor: number }[] = [];
    for (let i = 0; i < totalMonths; i++) {
      const period = addMonthsToPeriod(startPeriod, i);
      list.push({ periodo: period, valor: baseVal });
    }
    setCustomMonthlyValues(list);
  };

  // Quando altera duração ou início e está no modo variável, atualiza lista
  const handleDurationOrStartChange = (newStart: string, newTotal: number, baseVal: number) => {
    const list: { periodo: string; valor: number }[] = [];
    const prevMap = new Map<string, number>(customMonthlyValues.map(m => [m.periodo, m.valor]));
    for (let i = 0; i < newTotal; i++) {
      const p = addMonthsToPeriod(newStart, i);
      const existingVal = prevMap.get(p);
      list.push({
        periodo: p,
        valor: existingVal !== undefined ? existingVal : baseVal
      });
    }
    setCustomMonthlyValues(list);
  };

  const handleApplyBaseToAll = () => {
    const num = parseFloat(valorPadrao) || 0;
    setCustomMonthlyValues(prev => prev.map(item => ({ ...item, valor: num })));
  };

  const handleMonthValueChange = (index: number, valStr: string) => {
    const num = parseFloat(valStr) || 0;
    setCustomMonthlyValues(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], valor: num };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const parsedValPadrao = parseFloat(valorPadrao) || 0;
    const totalMonths = parseInt(mesesDuracao, 10) || 12;

    const accountData: Partial<FixedAccount> = {
      nome: nome.trim(),
      origem,
      classificacao,
      conta,
      individuo,
      diaVencimento: parseInt(diaVencimento, 10) || 10,
      mesInicio,
      mesesDuracao: totalMonths,
      tipoValor,
      valorPadrao: parsedValPadrao,
      isCartao,
      cartaoId: isCartao && cartaoId ? parseInt(cartaoId, 10) : null,
      observacao: observacao.trim(),
      ativo: true
    };

    let monthlyList = customMonthlyValues;
    if (tipoValor === 'fixo') {
      monthlyList = [];
      for (let i = 0; i < totalMonths; i++) {
        monthlyList.push({
          periodo: addMonthsToPeriod(mesInicio, i),
          valor: parsedValPadrao
        });
      }
    }

    setSaving(true);
    try {
      await onSave(accountData, monthlyList);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {accountToEdit ? 'Editar Conta Fixa' : 'Cadastrar Nova Conta Fixa / Recorrente'}
              </h3>
              <p className="text-xs text-slate-400">
                Configure os meses de vigência e defina se os valores são fixos ou variáveis
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome e Origem */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Nome da Conta Fixa *
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Aluguel, Internet, Academia, Energia..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Origem / Categoria *
              </label>
              <select
                value={origem}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '___NEW___') {
                    onOpenCustomModal('origem');
                  } else {
                    setOrigem(val);
                    setClassificacao(categoriesMap[val]?.[0] || 'Geral');
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
          </div>

          {/* Classificação e Conta Bancária */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Classificação
              </label>
              <select
                value={classificacao}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '___NEW___') {
                    onOpenCustomModal('classificacao', origem);
                  } else {
                    setClassificacao(val);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                {(categoriesMap[origem] || ['Geral']).map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
                <option value="___NEW___" className="text-indigo-400 font-bold">+ Adicionar Classificação...</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Conta de Débito Padrão
              </label>
              <select
                value={conta}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '___NEW___') {
                    onOpenCustomModal('conta');
                  } else {
                    setConta(val);
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
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Indivíduo
              </label>
              <select
                value={individuo}
                onChange={e => setIndividuo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                {['Ambos', 'Talyson', 'Karla'].map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Vencimento e Duração de Meses */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Dia do Vencimento (1 a 31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={diaVencimento}
                onChange={e => setDiaVencimento(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Mês Inicial (YYYY-MM)
              </label>
              <input
                type="month"
                required
                value={mesInicio}
                onChange={e => {
                  setMesInicio(e.target.value);
                  handleDurationOrStartChange(e.target.value, parseInt(mesesDuracao, 10) || 12, parseFloat(valorPadrao) || 0);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Duração (Quantos Meses?)
              </label>
              <select
                value={mesesDuracao}
                onChange={e => {
                  const val = e.target.value;
                  setMesesDuracao(val);
                  handleDurationOrStartChange(mesInicio, parseInt(val, 10) || 12, parseFloat(valorPadrao) || 0);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="1">1 mês (Única parcela)</option>
                <option value="3">3 meses (Trimestral)</option>
                <option value="6">6 meses (Semestral)</option>
                <option value="12">12 meses (1 Ano)</option>
                <option value="24">24 meses (2 Anos)</option>
                <option value="36">36 meses (3 Anos)</option>
                <option value="48">48 meses (4 Anos)</option>
              </select>
            </div>
          </div>

          {/* Integração com Fatura de Cartão */}
          <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple-200 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCartao}
                  onChange={e => setIsCartao(e.target.checked)}
                  className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                />
                <CreditCard className="w-4 h-4 text-purple-400" />
                Esta conta representa a Fatura de um Cartão de Crédito?
              </label>
            </div>

            {isCartao && (
              <div className="pt-2">
                <label className="text-xs text-purple-300 block mb-1">
                  Vincular ao Cartão de Crédito Cadastrado:
                </label>
                <select
                  value={cartaoId}
                  onChange={e => {
                    const cId = e.target.value;
                    setCartaoId(cId);
                    const found = cards.find(c => String(c.id) === cId);
                    if (found && !nome) {
                      setNome(`Fatura ${found.nome}`);
                    }
                    if (found) {
                      setDiaVencimento(String(found.diaVencimento || 10));
                    }
                  }}
                  className="w-full bg-slate-950 border border-purple-500/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="">Selecione um cartão (ou deixe geral)...</option>
                  {cards.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} (Titular: {c.titular})</option>
                  ))}
                </select>
                <p className="text-[10px] text-purple-400 mt-1">
                  O valor da fatura do mês poderá ser sincronizado automaticamente com os gastos daquele período.
                </p>
              </div>
            )}
          </div>

          {/* Escolha do Regime de Valores: Fixos ou Diferentes por Mês */}
          <div className="space-y-3 p-4 bg-slate-950/70 border border-indigo-500/20 rounded-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Regime de Valores para os Meses
              </span>

              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setTipoValor('fixo')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    tipoValor === 'fixo' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mesmo Valor para Todos os Meses
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTipoValor('variavel');
                    if (customMonthlyValues.length === 0) {
                      generateMonthlyList(mesInicio, parseInt(mesesDuracao, 10) || 12, parseFloat(valorPadrao) || 0);
                    }
                  }}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    tipoValor === 'variavel' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Valores Diferentes por Mês (Editar)
                </button>
              </div>
            </div>

            {/* Caso 1: Mesmo valor para todos os meses */}
            {tipoValor === 'fixo' ? (
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  Valor Padrão da Parcela / Mês (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={valorPadrao}
                    onChange={e => setValorPadrao(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Este valor será replicado em todos os {mesesDuracao} meses da vigência (Total previsto: R$ {((parseFloat(valorPadrao) || 0) * (parseInt(mesesDuracao, 10) || 12)).toFixed(2)}).
                </p>
              </div>
            ) : (
              /* Caso 2: Valores diferentes por mês */
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Valor base..."
                      value={valorPadrao}
                      onChange={e => setValorPadrao(e.target.value)}
                      className="w-32 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-emerald-400 font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyBaseToAll}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded font-medium border border-slate-700"
                    >
                      Preencher Todos
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Ajuste o valor específico de cada mês abaixo:
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto pr-1 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {customMonthlyValues.map((item, idx) => {
                      const [y, m] = item.periodo.split('-');
                      const monthName = MONTHS[parseInt(m, 10) - 1] || item.periodo;
                      return (
                        <div
                          key={item.periodo}
                          className="flex items-center justify-between p-2 bg-slate-900/90 border border-slate-800 rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-indigo-400 font-mono px-1.5 py-0.5 bg-indigo-500/10 rounded">
                              #{idx + 1}
                            </span>
                            <span className="font-semibold text-slate-200">
                              {monthName} <span className="text-[10px] text-slate-500">{y}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 text-[10px]">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={item.valor}
                              onChange={e => handleMonthValueChange(idx, e.target.value)}
                              className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-right font-mono text-emerald-400 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400">
                  Soma total dos meses: <strong className="text-emerald-400 font-mono">
                    R$ {customMonthlyValues.reduce((sum, item) => sum + (Number(item.valor) || 0), 0).toFixed(2)}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Observações / Detalhes (Opcional)
            </label>
            <input
              type="text"
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Ex: Contrato até final do ano, reajuste pelo IGPM, código de barras..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold rounded-lg text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              {saving ? 'Salvando...' : accountToEdit ? 'Atualizar Conta Fixa' : 'Cadastrar Conta Fixa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
