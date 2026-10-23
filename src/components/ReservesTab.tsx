import React, { useState, useMemo } from 'react';
import {
  ShieldCheck, Target, Plus, TrendingUp, Calendar, ArrowUpRight,
  ArrowDownLeft, History, Edit3, Trash2, CheckCircle2, AlertCircle,
  PiggyBank, DollarSign, Sparkles, Building2, Percent, Clock, X,
  Compass, ChevronRight, Car, Home, Plane, GraduationCap, Heart,
  Flame, Laptop, HelpCircle
} from 'lucide-react';
import { ReserveGoal, ReserveTransaction, Transaction } from '../types';

interface ReservesTabProps {
  reserveGoals: ReserveGoal[];
  onSaveGoal: (goal: ReserveGoal) => void;
  onDeleteGoal: (goalId: string) => void;
  onRecordTransaction: (goalId: string, tx: Omit<ReserveTransaction, 'id'>, syncGeneralTx?: boolean) => void;
  monthlyExpensesEstimate: number; // Média ou despesas do mês atual
  accounts: string[];
  selectedMonth: number;
  selectedYear: number;
  selectedPeriodKey: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  'Emergência': ShieldCheck,
  'Viagem': Plane,
  'Veículo': Car,
  'Moradia': Home,
  'Educação': GraduationCap,
  'Saúde & Família': Heart,
  'Tecnologia': Laptop,
  'Sonhos & Lazer': Sparkles,
  'Independência Financeira': Flame,
  'Outro': Target
};

const COLOR_PALETTES = [
  { name: 'Esmeralda', gradient: 'from-emerald-500 to-teal-700', ring: 'ring-emerald-500', bar: 'bg-emerald-500', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { name: 'Índigo', gradient: 'from-indigo-500 to-blue-700', ring: 'ring-indigo-500', bar: 'bg-indigo-500', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  { name: 'Púrpura', gradient: 'from-purple-500 to-indigo-700', ring: 'ring-purple-500', bar: 'bg-purple-500', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { name: 'Âmbar', gradient: 'from-amber-500 to-orange-600', ring: 'ring-amber-500', bar: 'bg-amber-500', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { name: 'Ciano', gradient: 'from-cyan-500 to-blue-600', ring: 'ring-cyan-500', bar: 'bg-cyan-500', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  { name: 'Rosa', gradient: 'from-pink-500 to-rose-600', ring: 'ring-pink-500', bar: 'bg-pink-500', bg: 'bg-pink-500/10 text-pink-400 border-pink-500/30' },
];

export const ReservesTab: React.FC<ReservesTabProps> = ({
  reserveGoals,
  onSaveGoal,
  onDeleteGoal,
  onRecordTransaction,
  monthlyExpensesEstimate,
  accounts,
  selectedMonth,
  selectedYear,
  selectedPeriodKey
}) => {
  // Filtros de listagem
  const [filterType, setFilterType] = useState<'todos' | 'emergencia' | 'objetivo'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'progresso' | 'valor' | 'meta' | 'prazo'>('progresso');

  // Modais
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<ReserveGoal | null>(null);

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [targetGoalForTx, setTargetGoalForTx] = useState<ReserveGoal | null>(null);
  const [txType, setTxType] = useState<'deposito' | 'resgate'>('deposito');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [txNote, setTxNote] = useState('');
  const [txAccount, setTxAccount] = useState(accounts[0] || 'Conta Talyson');
  const [syncWithGeneral, setSyncWithGeneral] = useState(false);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [viewingHistoryGoal, setViewingHistoryGoal] = useState<ReserveGoal | null>(null);

  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    isOpen: boolean;
    goal: ReserveGoal | null;
  }>({ isOpen: false, goal: null });

  // Formulário de Criar/Editar Objetivo
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'objetivo' as 'emergencia' | 'objetivo',
    categoria: 'Outro',
    valorAtual: '',
    valorMeta: '',
    mesesCustoFixo: 6,
    dataAlvo: '',
    contaOndeEsta: 'Nubank Caixinha (100% CDI)',
    rendimentoEstimado: '10.5',
    cor: COLOR_PALETTES[0].gradient,
    icone: 'Target',
    descricao: ''
  });

  // Métricas Consolidadas
  const totalGuardado = useMemo(() => {
    return reserveGoals.reduce((sum, g) => sum + (Number(g.valorAtual) || 0), 0);
  }, [reserveGoals]);

  const totalMeta = useMemo(() => {
    return reserveGoals.reduce((sum, g) => sum + (Number(g.valorMeta) || 0), 0);
  }, [reserveGoals]);

  const emergencyGoals = useMemo(() => {
    return reserveGoals.filter(g => g.tipo === 'emergencia');
  }, [reserveGoals]);

  const totalEmergencia = useMemo(() => {
    return emergencyGoals.reduce((sum, g) => sum + (Number(g.valorAtual) || 0), 0);
  }, [emergencyGoals]);

  const totalEmergenciaMeta = useMemo(() => {
    return emergencyGoals.reduce((sum, g) => sum + (Number(g.valorMeta) || 0), 0);
  }, [emergencyGoals]);

  const specificGoals = useMemo(() => {
    return reserveGoals.filter(g => g.tipo === 'objetivo');
  }, [reserveGoals]);

  const totalObjetivos = useMemo(() => {
    return specificGoals.reduce((sum, g) => sum + (Number(g.valorAtual) || 0), 0);
  }, [specificGoals]);

  const totalObjetivosMeta = useMemo(() => {
    return specificGoals.reduce((sum, g) => sum + (Number(g.valorMeta) || 0), 0);
  }, [specificGoals]);

  // Aportes no mês selecionado
  const aportesMesAtual = useMemo(() => {
    let sum = 0;
    reserveGoals.forEach(g => {
      (g.historico || []).forEach(tx => {
        if (tx.tipo === 'deposito' && tx.data.startsWith(selectedPeriodKey)) {
          sum += Number(tx.valor) || 0;
        }
      });
    });
    return sum;
  }, [reserveGoals, selectedPeriodKey]);

  // Meses de custo de vida garantidos pela reserva de emergência
  const safeMonthlyCost = monthlyExpensesEstimate > 0 ? monthlyExpensesEstimate : 2500;
  const mesesCobertos = safeMonthlyCost > 0 ? totalEmergencia / safeMonthlyCost : 0;

  // Filtragem e Ordenação
  const filteredGoals = useMemo(() => {
    return reserveGoals
      .filter(g => {
        if (filterType === 'emergencia' && g.tipo !== 'emergencia') return false;
        if (filterType === 'objetivo' && g.tipo !== 'objetivo') return false;
        if (searchTerm) {
          const s = searchTerm.toLowerCase();
          const matchName = g.nome.toLowerCase().includes(s);
          const matchCat = (g.categoria || '').toLowerCase().includes(s);
          const matchConta = (g.contaOndeEsta || '').toLowerCase().includes(s);
          return matchName || matchCat || matchConta;
        }
        return true;
      })
      .sort((a, b) => {
        const pctA = a.valorMeta > 0 ? (a.valorAtual / a.valorMeta) * 100 : 0;
        const pctB = b.valorMeta > 0 ? (b.valorAtual / b.valorMeta) * 100 : 0;
        if (sortBy === 'progresso') return pctB - pctA;
        if (sortBy === 'valor') return b.valorAtual - a.valorAtual;
        if (sortBy === 'meta') return b.valorMeta - a.valorMeta;
        if (sortBy === 'prazo') {
          if (!a.dataAlvo) return 1;
          if (!b.dataAlvo) return -1;
          return a.dataAlvo.localeCompare(b.dataAlvo);
        }
        return 0;
      });
  }, [reserveGoals, filterType, searchTerm, sortBy]);

  // Abertura do modal de criação / edição
  const handleOpenCreateModal = (presetType: 'emergencia' | 'objetivo' = 'objetivo') => {
    setEditingGoal(null);
    setFormData({
      nome: presetType === 'emergencia' ? 'Reserva de Emergência Essencial' : '',
      tipo: presetType,
      categoria: presetType === 'emergencia' ? 'Emergência' : 'Sonhos & Lazer',
      valorAtual: '',
      valorMeta: presetType === 'emergencia' ? String(Math.round(safeMonthlyCost * 6)) : '',
      mesesCustoFixo: 6,
      dataAlvo: '',
      contaOndeEsta: presetType === 'emergencia' ? 'Tesouro Selic / Nubank 100% CDI' : 'Caixinha Nubank / CDB 100%',
      rendimentoEstimado: '10.5',
      cor: presetType === 'emergencia' ? COLOR_PALETTES[0].gradient : COLOR_PALETTES[1].gradient,
      icone: presetType === 'emergencia' ? 'ShieldCheck' : 'Sparkles',
      descricao: presetType === 'emergencia' ? 'Colchão de segurança financeira para imprevistos e tranquilidade.' : ''
    });
    setGoalModalOpen(true);
  };

  const handleOpenEditModal = (goal: ReserveGoal) => {
    setEditingGoal(goal);
    setFormData({
      nome: goal.nome,
      tipo: goal.tipo,
      categoria: goal.categoria || 'Outro',
      valorAtual: String(goal.valorAtual),
      valorMeta: String(goal.valorMeta),
      mesesCustoFixo: goal.mesesCustoFixo || 6,
      dataAlvo: goal.dataAlvo || '',
      contaOndeEsta: goal.contaOndeEsta || '',
      rendimentoEstimado: goal.rendimentoEstimado ? String(goal.rendimentoEstimado) : '',
      cor: goal.cor || COLOR_PALETTES[0].gradient,
      icone: goal.icone || 'Target',
      descricao: goal.descricao || ''
    });
    setGoalModalOpen(true);
  };

  const handleSaveGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    const vAtual = parseFloat(formData.valorAtual) || 0;
    const vMeta = parseFloat(formData.valorMeta) || 0;

    const goalToSave: ReserveGoal = {
      id: editingGoal ? editingGoal.id : `res_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      nome: formData.nome.trim(),
      tipo: formData.tipo,
      categoria: formData.categoria,
      valorAtual: vAtual,
      valorMeta: vMeta,
      mesesCustoFixo: formData.tipo === 'emergencia' ? Number(formData.mesesCustoFixo) : undefined,
      dataAlvo: formData.dataAlvo || undefined,
      contaOndeEsta: formData.contaOndeEsta.trim() || undefined,
      rendimentoEstimado: formData.rendimentoEstimado ? parseFloat(formData.rendimentoEstimado) : undefined,
      cor: formData.cor,
      icone: formData.icone,
      descricao: formData.descricao.trim() || undefined,
      criadoEm: editingGoal ? editingGoal.criadoEm : new Date().toISOString().split('T')[0],
      historico: editingGoal ? editingGoal.historico : (vAtual > 0 ? [{
        id: `tx_${Date.now()}`,
        data: new Date().toISOString().split('T')[0],
        tipo: 'deposito',
        valor: vAtual,
        nota: 'Saldo inicial cadastrado',
        contaOrigemDestino: formData.contaOndeEsta
      }] : [])
    };

    onSaveGoal(goalToSave);
    setGoalModalOpen(false);
    setEditingGoal(null);
  };

  // Abrir modal de depósito ou resgate
  const handleOpenTxModal = (goal: ReserveGoal, type: 'deposito' | 'resgate') => {
    setTargetGoalForTx(goal);
    setTxType(type);
    setTxAmount('');
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxNote('');
    setTxAccount(accounts[0] || 'Conta Talyson');
    setSyncWithGeneral(false);
    setTxModalOpen(true);
  };

  const handleConfirmTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetGoalForTx) return;
    const val = parseFloat(txAmount);
    if (!val || val <= 0) return;

    if (txType === 'resgate' && val > targetGoalForTx.valorAtual) {
      alert(`Valor de resgate (R$ ${val.toFixed(2)}) não pode ser superior ao saldo atual da reserva (R$ ${targetGoalForTx.valorAtual.toFixed(2)}).`);
      return;
    }

    onRecordTransaction(targetGoalForTx.id, {
      data: txDate,
      tipo: txType,
      valor: val,
      nota: txNote.trim() || (txType === 'deposito' ? 'Aporte na reserva' : 'Resgate da reserva'),
      contaOrigemDestino: txAccount
    }, syncWithGeneral);

    setTxModalOpen(false);
    setTargetGoalForTx(null);
  };

  // Cálculo de Aporte Mensal Recomendado
  const getMonthlySuggestedContribution = (goal: ReserveGoal) => {
    const restante = Math.max(0, goal.valorMeta - goal.valorAtual);
    if (restante <= 0) return { months: 0, monthlyAmount: 0, status: 'completed' as const };
    if (!goal.dataAlvo) return null;

    const today = new Date();
    const target = new Date(goal.dataAlvo + 'T00:00:00');
    const diffMonths = (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth());

    if (diffMonths <= 0) {
      return { months: 0, monthlyAmount: restante, status: 'overdue' as const };
    }

    const monthlyAmount = restante / diffMonths;
    return { months: diffMonths, monthlyAmount, status: 'on_track' as const };
  };

  // Quick preset apply for Emergency Reserve Assistant
  const handleApplyEmergencyPreset = (months: number) => {
    const targetValue = Math.round(safeMonthlyCost * months);
    const existingEmerg = reserveGoals.find(g => g.tipo === 'emergencia');

    if (existingEmerg) {
      const updated: ReserveGoal = {
        ...existingEmerg,
        valorMeta: targetValue,
        mesesCustoFixo: months,
        nome: `Reserva de Emergência (${months} Meses)`
      };
      onSaveGoal(updated);
    } else {
      const newEmerg: ReserveGoal = {
        id: `res_emerg_${Date.now()}`,
        nome: `Reserva de Emergência (${months} Meses)`,
        tipo: 'emergencia',
        categoria: 'Emergência',
        valorAtual: 0,
        valorMeta: targetValue,
        mesesCustoFixo: months,
        contaOndeEsta: 'Tesouro Selic / Nubank 100% CDI',
        rendimentoEstimado: 10.5,
        cor: COLOR_PALETTES[0].gradient,
        icone: 'ShieldCheck',
        descricao: `Colchão de segurança para cobrir ${months} meses de custo essencial (R$ ${safeMonthlyCost.toFixed(2)}/mês).`,
        criadoEm: new Date().toISOString().split('T')[0],
        historico: []
      };
      onSaveGoal(newEmerg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 rounded-2xl shadow-lg shadow-emerald-500/20 text-white">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <span>Reservas & Objetivos Específicos</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                Caixinhas & Metas
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Construa sua reserva de emergência e separe fundos para suas viagens, bens, sonhos e projetos futuros.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleOpenCreateModal('emergencia')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 transition-all shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>+ Reserva de Emergência</span>
          </button>

          <button
            onClick={() => handleOpenCreateModal('objetivo')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Objetivo</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas Consolidadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Guardado */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total em Reservas</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              R$ {totalGuardado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
              <span>Meta consolidada:</span>
              <span className="font-semibold text-slate-200">
                R$ {totalMeta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {/* Barra de progresso */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, totalMeta > 0 ? (totalGuardado / totalMeta) * 100 : 0)}%` }}
              />
            </div>
            <div className="text-[10px] text-indigo-400 font-semibold mt-1.5 text-right">
              {totalMeta > 0 ? ((totalGuardado / totalMeta) * 100).toFixed(1) : 0}% da meta geral
            </div>
          </div>
        </div>

        {/* Card 2: Reserva de Emergência */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden hover:border-emerald-500/60 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Reserva de Emergência</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              R$ {totalEmergencia.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300 mt-2">
              <span>Segurança garantida:</span>
              <span className="font-bold text-emerald-300">
                {mesesCobertos.toFixed(1)} meses
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, totalEmergenciaMeta > 0 ? (totalEmergencia / totalEmergenciaMeta) * 100 : 0)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-1.5 flex justify-between">
              <span>Meta: R$ {totalEmergenciaMeta.toFixed(2)}</span>
              <span className="font-semibold text-emerald-400">
                {totalEmergenciaMeta > 0 ? ((totalEmergencia / totalEmergenciaMeta) * 100).toFixed(0) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Objetivos Específicos */}
        <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden hover:border-purple-500/60 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Objetivos & Caixinhas</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-300">
              R$ {totalObjetivos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
              <span>Caixinhas ativas:</span>
              <span className="font-semibold text-white">{specificGoals.length} projetos</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-purple-500 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, totalObjetivosMeta > 0 ? (totalObjetivos / totalObjetivosMeta) * 100 : 0)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-1.5 flex justify-between">
              <span>Meta: R$ {totalObjetivosMeta.toFixed(2)}</span>
              <span className="font-semibold text-purple-400">
                {totalObjetivosMeta > 0 ? ((totalObjetivos / totalObjetivosMeta) * 100).toFixed(0) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Aportes no Mês Atual */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Aportes ({selectedMonth}/{selectedYear})</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300">
              R$ {aportesMesAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Total direcionado para poupança e reservas neste período.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Continue aportando todo mês</span>
            </div>
          </div>
        </div>
      </div>

      {/* Assistente Inteligente de Reserva de Emergência */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wide">
                Assistente de Planejamento
              </span>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-indigo-400" />
                Como calcular o tamanho ideal da sua Reserva de Emergência?
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              Seu custo de vida mensal estimado é de{' '}
              <strong className="text-white">R$ {safeMonthlyCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>.
              Especialistas recomendam entre 3 e 12 meses de despesas guardados em ativos de liquidez imediata (ex: Tesouro Selic ou CDB 100% CDI).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => handleApplyEmergencyPreset(3)}
              className="px-3 py-2 bg-slate-800 hover:bg-indigo-900/60 hover:border-indigo-400 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition-all flex items-center gap-1.5"
              title="Para funcionários públicos e CLT com estabilidade"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>3 Meses (R$ {(safeMonthlyCost * 3).toFixed(0)})</span>
            </button>

            <button
              onClick={() => handleApplyEmergencyPreset(6)}
              className="px-3 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500 text-xs font-bold text-indigo-200 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              title="Recomendação padrão para a maioria das pessoas"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>6 Meses (R$ {(safeMonthlyCost * 6).toFixed(0)}) [Recomendado]</span>
            </button>

            <button
              onClick={() => handleApplyEmergencyPreset(12)}
              className="px-3 py-2 bg-slate-800 hover:bg-indigo-900/60 hover:border-indigo-400 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition-all flex items-center gap-1.5"
              title="Para autônomos, empresários e freelancers com renda variável"
            >
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              <span>12 Meses (R$ {(safeMonthlyCost * 12).toFixed(0)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Filtros, Pesquisa e Ordenação */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
        {/* Filtro por Tipo */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilterType('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'todos'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({reserveGoals.length})
          </button>
          <button
            onClick={() => setFilterType('emergencia')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'emergencia'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Emergência ({emergencyGoals.length})</span>
          </button>
          <button
            onClick={() => setFilterType('objetivo')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'objetivo'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Objetivos ({specificGoals.length})</span>
          </button>
        </div>

        {/* Busca e Ordenação */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Buscar reserva ou objetivo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
            <span className="hidden md:inline">Ordenar:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-white rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="progresso">Maior Progresso (%)</option>
              <option value="valor">Maior Saldo (R$)</option>
              <option value="meta">Maior Meta (R$)</option>
              <option value="prazo">Data Alvo mais Próxima</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Cards de Reservas e Objetivos */}
      {filteredGoals.length === 0 ? (
        <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
            <PiggyBank className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">Nenhuma reserva ou meta encontrada</h3>
            <p className="text-xs text-slate-400 mt-1">
              {searchTerm
                ? 'Nenhum resultado corresponde à sua pesquisa. Tente outro termo.'
                : 'Comece criando sua Reserva de Emergência ou uma caixinha para um objetivo específico (viagem, carro, casa própria, etc.).'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handleOpenCreateModal('emergencia')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all"
            >
              + Criar Reserva de Emergência
            </button>
            <button
              onClick={() => handleOpenCreateModal('objetivo')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
            >
              + Criar Objetivo Específico
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredGoals.map(goal => {
            const pct = goal.valorMeta > 0 ? (goal.valorAtual / goal.valorMeta) * 100 : 0;
            const restante = Math.max(0, goal.valorMeta - goal.valorAtual);
            const isCompleted = goal.valorAtual >= goal.valorMeta && goal.valorMeta > 0;
            const forecast = getMonthlySuggestedContribution(goal);
            const IconComp = CATEGORY_ICONS[goal.categoria] || Target;

            return (
              <div
                key={goal.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative group transition-all duration-200"
              >
                {/* Linha do topo do Card */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${goal.cor || 'from-indigo-500 to-purple-600'} text-white shadow-md`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              goal.tipo === 'emergencia'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            }`}
                          >
                            {goal.tipo === 'emergencia' ? 'Reserva de Emergência' : goal.categoria || 'Objetivo'}
                          </span>

                          {isCompleted && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Meta Atingida!
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-extrabold text-white mt-1 group-hover:text-indigo-300 transition-colors">
                          {goal.nome}
                        </h4>
                      </div>
                    </div>

                    {/* Menu de Ações Rápidas */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setViewingHistoryGoal(goal);
                          setHistoryModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Ver histórico de movimentações"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(goal)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Editar meta"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteModal({ isOpen: true, goal })}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Excluir reserva"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Descrição se houver */}
                  {goal.descricao && (
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                      {goal.descricao}
                    </p>
                  )}

                  {/* Informações da conta / instituição */}
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 mb-4 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        Onde está guardado:
                      </span>
                      <span className="font-semibold text-slate-200 truncate max-w-[170px]">
                        {goal.contaOndeEsta || 'Conta principal'}
                      </span>
                    </div>

                    {goal.rendimentoEstimado ? (
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Percent className="w-3.5 h-3.5 text-slate-500" />
                          Rendimento aproximado:
                        </span>
                        <span className="font-semibold text-emerald-400">
                          {goal.rendimentoEstimado}% a.a.
                        </span>
                      </div>
                    ) : null}

                    {goal.dataAlvo && (
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          Data Alvo:
                        </span>
                        <span className="font-semibold text-indigo-300">
                          {goal.dataAlvo.split('-').reverse().join('/')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Números Principais: Valor Atual vs Meta */}
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-400 font-medium">Saldo Atual</span>
                      <span className="text-xs text-slate-400">
                        Meta: <strong className="text-slate-200">R$ {goal.valorMeta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-extrabold text-white tracking-tight">
                        R$ {goal.valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className={`text-sm font-extrabold ${pct >= 100 ? 'text-emerald-400' : 'text-indigo-400'}`}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= 100
                            ? 'bg-emerald-500'
                            : `bg-gradient-to-r ${goal.cor || 'from-indigo-500 to-purple-600'}`
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      {isCompleted ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          🎉 Parabéns! Meta 100% atingida.
                        </span>
                      ) : (
                        <span>
                          Faltam: <strong className="text-slate-200">R$ {restante.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </span>
                      )}

                      {goal.tipo === 'emergencia' && (
                        <span className="text-emerald-400/90 font-medium">
                          {(goal.valorAtual / safeMonthlyCost).toFixed(1)} meses garantidos
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Projeção de Aporte Mensal Recomendado */}
                  {forecast && !isCompleted && (
                    <div className="mt-3.5 p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-indigo-300 text-[11px] flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          Aporte sugerido:
                        </span>
                        <span className="font-extrabold text-white">
                          R$ {forecast.monthlyAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mês
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Faltam {forecast.months} meses até o prazo estabelecido.
                      </p>
                    </div>
                  )}
                </div>

                {/* Botões de Ação do Card: + Aportar e - Resgatar */}
                <div className="grid grid-cols-2 gap-2 mt-5 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => handleOpenTxModal(goal, 'deposito')}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-300" />
                    <span>+ Aportar</span>
                  </button>

                  <button
                    onClick={() => handleOpenTxModal(goal, 'resgate')}
                    disabled={goal.valorAtual <= 0}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                      goal.valorAtual <= 0
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 shadow-sm'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                    <span>- Resgatar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR OU EDITAR OBJETIVO / RESERVA */}
      {/* ========================================================================= */}
      {goalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingGoal ? 'Editar Reserva ou Meta' : 'Novo Objetivo ou Reserva'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Defina valores, prazo, categoria e onde os recursos estão alocados.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setGoalModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoalSubmit} className="p-6 space-y-4 overflow-y-auto">
              {/* Seletor de Tipo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tipo de Caixinha
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        tipo: 'emergencia',
                        categoria: 'Emergência',
                        nome: prev.nome || 'Reserva de Emergência',
                        valorMeta: prev.valorMeta || String(safeMonthlyCost * 6)
                      }));
                    }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                      formData.tipo === 'emergencia'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Reserva de Emergência</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        tipo: 'objetivo',
                        categoria: prev.categoria === 'Emergência' ? 'Sonhos & Lazer' : prev.categoria
                      }));
                    }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                      formData.tipo === 'objetivo'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Target className="w-4 h-4 text-purple-400" />
                    <span>Objetivo Específico</span>
                  </button>
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Objetivo / Reserva *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Viagem Europa 2026, Troca de Carro, Reserva 6 Meses..."
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {Object.keys(CATEGORY_ICONS).map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Onde o dinheiro está guardado
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Nubank Caixinhas, Tesouro Selic, CDB Inter..."
                    value={formData.contaOndeEsta}
                    onChange={e => setFormData({ ...formData, contaOndeEsta: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Valores: Meta e Saldo Atual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor da Meta Financeira (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={formData.valorMeta}
                    onChange={e => setFormData({ ...formData, valorMeta: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                  {formData.tipo === 'emergencia' && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Dica: 6 meses de custo = R$ {(safeMonthlyCost * 6).toFixed(2)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor Já Guardado Atualmente (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.valorAtual}
                    onChange={e => setFormData({ ...formData, valorAtual: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-emerald-400 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
              </div>

              {/* Data Alvo e Rendimento Estimado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data Alvo / Prazo (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.dataAlvo}
                    onChange={e => setFormData({ ...formData, dataAlvo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Rendimento Estimado (% ao ano)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 10.5"
                    value={formData.rendimentoEstimado}
                    onChange={e => setFormData({ ...formData, rendimentoEstimado: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Cor de Destaque */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Cor do Cartão
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_PALETTES.map(p => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, cor: p.gradient })}
                      className={`w-8 h-8 rounded-full bg-gradient-to-tr ${p.gradient} transition-transform ${
                        formData.cor === p.gradient ? 'scale-110 ring-2 ring-white shadow-lg' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>

              {/* Descrição / Notas */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observações / Detalhes (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Descreva detalhes do objetivo, como o hotel planejado, modelo do carro, ou regras de resgate..."
                  value={formData.descricao}
                  onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Rodapé de Ações */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGoalModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/30"
                >
                  {editingGoal ? 'Salvar Alterações' : 'Cadastrar Caixinha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR APORTE OU RESGATE */}
      {/* ========================================================================= */}
      {txModalOpen && targetGoalForTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl text-white shadow-md ${
                    txType === 'deposito' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  {txType === 'deposito' ? (
                    <ArrowDownLeft className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {txType === 'deposito' ? 'Registrar Aporte (+)' : 'Registrar Resgate (-)'}
                  </h3>
                  <p className="text-xs text-slate-400 truncate max-w-[240px]">
                    {targetGoalForTx.nome}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTxModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmTxSubmit} className="p-6 space-y-4">
              {/* Alternar entre Aporte e Resgate */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTxType('deposito')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    txType === 'deposito'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  + Aporte (Guardar)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('resgate')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    txType === 'resgate'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  - Resgate (Retirar)
                </button>
              </div>

              {/* Informação do Saldo Atual */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Saldo atual da caixinha:</span>
                <span className="font-extrabold text-white text-sm">
                  R$ {targetGoalForTx.valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Valor do Movimento */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Valor do Movimento (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  autoFocus
                  placeholder="0.00"
                  value={txAmount}
                  onChange={e => setTxAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-lg text-white font-extrabold focus:outline-none focus:border-indigo-500"
                />

                {/* Chips com valores rápidos */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[50, 100, 200, 500, 1000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTxAmount(String(val))}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold rounded-lg transition-colors border border-slate-700/60"
                    >
                      +R$ {val}
                    </button>
                  ))}
                  {txType === 'resgate' && targetGoalForTx.valorAtual > 0 && (
                    <button
                      type="button"
                      onClick={() => setTxAmount(String(targetGoalForTx.valorAtual))}
                      className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-[11px] font-bold rounded-lg transition-colors border border-rose-500/30"
                    >
                      Tudo (R$ {targetGoalForTx.valorAtual.toFixed(2)})
                    </button>
                  )}
                </div>
              </div>

              {/* Data e Conta Envolvida */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data da Movimentação
                  </label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={e => setTxDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {txType === 'deposito' ? 'Origem do Dinheiro' : 'Destino do Dinheiro'}
                  </label>
                  <select
                    value={txAccount}
                    onChange={e => setTxAccount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {accounts.map(acc => (
                      <option key={acc} value={acc}>
                        {acc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nota / Motivo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nota / Motivo (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Aporte do salário, sobra do mês, resgate para conserto..."
                  value={txNote}
                  onChange={e => setTxNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Checkbox de sincronizar como lançamento nas finanças gerais */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="syncGeneral"
                  checked={syncWithGeneral}
                  onChange={e => setSyncWithGeneral(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="syncGeneral" className="text-xs text-slate-300 cursor-pointer select-none">
                  <span className="font-semibold block text-white">
                    Lançar também no extrato geral
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {txType === 'deposito'
                      ? 'Gera uma saída (despesa de Poupança/Reserva) no painel principal.'
                      : 'Gera uma entrada (receita de Resgate) no painel principal.'}
                  </span>
                </label>
              </div>

              {/* Botões de Ação */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTxModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-md ${
                    txType === 'deposito'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  }`}
                >
                  {txType === 'deposito' ? 'Confirmar Aporte' : 'Confirmar Resgate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: HISTÓRICO DE MOVIMENTAÇÕES */}
      {/* ========================================================================= */}
      {historyModalOpen && viewingHistoryGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Histórico de Movimentações</h3>
                  <p className="text-xs text-slate-400 truncate max-w-[260px]">
                    {viewingHistoryGoal.nome}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              {/* Resumo do Saldo */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Saldo Atual</span>
                  <span className="text-xl font-extrabold text-white">
                    R$ {viewingHistoryGoal.valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Meta</span>
                  <span className="text-sm font-bold text-indigo-300">
                    R$ {viewingHistoryGoal.valorMeta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Lista de Movimentos */}
              {(!viewingHistoryGoal.historico || viewingHistoryGoal.historico.length === 0) ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Nenhuma movimentação registrada para esta caixinha até o momento.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Extrato de Aportes e Resgates ({viewingHistoryGoal.historico.length})
                  </div>

                  {[...viewingHistoryGoal.historico]
                    .sort((a, b) => b.data.localeCompare(a.data) || b.id.localeCompare(a.id))
                    .map(tx => (
                      <div
                        key={tx.id}
                        className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-2 rounded-lg ${
                              tx.tipo === 'deposito'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {tx.tipo === 'deposito' ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{tx.tipo === 'deposito' ? 'Aporte' : 'Resgate'}</span>
                              {tx.contaOrigemDestino && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ({tx.contaOrigemDestino})
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {tx.data.split('-').reverse().join('/')}
                              {tx.nota ? ` • ${tx.nota}` : ''}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`font-extrabold text-sm ${
                            tx.tipo === 'deposito' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {tx.tipo === 'deposito' ? '+' : '-'} R$ {Number(tx.valor).toFixed(2)}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMAR EXCLUSÃO */}
      {/* ========================================================================= */}
      {confirmDeleteModal.isOpen && confirmDeleteModal.goal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Remover Caixinha / Reserva?</h4>
              <p className="text-xs text-slate-400 mt-1">
                Tem certeza que deseja excluir <strong>"{confirmDeleteModal.goal.nome}"</strong>?
                {confirmDeleteModal.goal.valorAtual > 0 && (
                  <span className="block text-amber-300 font-semibold mt-1">
                    Aviso: Há um saldo registrado de R$ {confirmDeleteModal.goal.valorAtual.toFixed(2)}.
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteModal({ isOpen: false, goal: null })}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (confirmDeleteModal.goal) {
                    onDeleteGoal(confirmDeleteModal.goal.id);
                  }
                  setConfirmDeleteModal({ isOpen: false, goal: null });
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
