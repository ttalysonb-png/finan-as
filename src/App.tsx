import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import {
  Wallet, Megaphone, Plus, Trash2, Edit3, Filter, Download, Upload,
  PlusCircle, CreditCard, X, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { supabase } from './lib/supabase';
import {
  Transaction, Card, Budget, FixedAccount, FixedAccountInstallment,
  ActiveTab, PaymentStatus
} from './types';
import {
  MONTHS, DEFAULT_CATEGORIES_MAP, addMonthsToDate, addMonthsToPeriod,
  getTransactionInvoicePeriod
} from './constants';
import { Navbar } from './components/Navbar';
import { TransactionsTable } from './components/TransactionsTable';
import { FixedAccountsTab } from './components/FixedAccountsTab';
import { DashboardTab } from './components/DashboardTab';
import { BudgetsTab } from './components/BudgetsTab';
import { CardsTab } from './components/CardsTab';
import { MigrationsModal } from './components/MigrationsModal';
import { AddFixedAccountModal } from './components/AddFixedAccountModal';
import { PayFixedAccountModal } from './components/PayFixedAccountModal';

export default function App() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [financeTab, setFinanceTab] = useState<ActiveTab>('painel');
  const [loading, setLoading] = useState(true);

  // Dados Centrais
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [cards, setCards] = useState<Card[]>([]);
  const [fixedAccounts, setFixedAccounts] = useState<FixedAccount[]>([]);

  // Modos de Tabela
  const [spreadsheetMode, setSpreadsheetMode] = useState(false);
  const [cardSpreadsheetMode, setCardSpreadsheetMode] = useState(false);
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState<number[]>([]);
  const [searchTx, setSearchTx] = useState('');

  // Filtros de Coluna
  const [columnFilters, setColumnFilters] = useState({
    origem: '',
    classificacao: '',
    conta: '',
    operacao: '',
    individuo: ''
  });
  const [showColumnFilters, setShowColumnFilters] = useState(false);

  // Mapeamentos de Categorias e Contas
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string[]>>(DEFAULT_CATEGORIES_MAP);
  const [accounts, setAccounts] = useState<string[]>(['Conta Talyson', 'Conta Karla', 'Ambos', 'Outro']);

  // Modais de Diálogo
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
  }>({ isOpen: false, title: '', message: '', onConfirm: null });

  const [customModal, setCustomModal] = useState<{
    isOpen: boolean;
    type: 'origem' | 'classificacao' | 'conta' | '';
    categoryTarget?: string;
    name: string;
  }>({ isOpen: false, type: '', categoryTarget: '', name: '' });

  const [showMigrationsModal, setShowMigrationsModal] = useState(false);
  const [showAddFixedAccountModal, setShowAddFixedAccountModal] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<FixedAccount | null>(null);

  const [showPayModal, setShowPayModal] = useState(false);
  const [payingAccount, setPayingAccount] = useState<FixedAccount | null>(null);
  const [payingInstallment, setPayingInstallment] = useState<FixedAccountInstallment | null>(null);

  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [selectedCardForDetails, setSelectedCardForDetails] = useState<Card | null>(null);

  // Formulário de Novo Lançamento
  const selectedPeriodKey = useMemo(() => {
    const m = String(selectedMonth).padStart(2, '0');
    return `${selectedYear}-${m}`;
  }, [selectedYear, selectedMonth]);

  const [newTxForm, setNewTxForm] = useState({
    data: `${selectedPeriodKey}-01`,
    origem: 'Dia a Dia',
    classificacao: 'Supermercado',
    conta: 'Conta Talyson',
    operacao: 'Pix',
    cartaoId: '',
    entrada: '',
    saida: '',
    comentario: '',
    individuo: 'Ambos',
    isParcelado: false,
    totalParcelas: '2'
  });

  const [newCard, setNewCard] = useState({
    nome: '',
    titular: 'Talyson',
    limite: '',
    faturaAtual: '0',
    diaFechamento: '16',
    diaVencimento: '25',
    cor: 'from-indigo-600 to-purple-800'
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (today.startsWith(selectedPeriodKey)) {
      setNewTxForm(prev => ({ ...prev, data: today }));
    } else {
      setNewTxForm(prev => ({ ...prev, data: `${selectedPeriodKey}-01` }));
    }
  }, [selectedPeriodKey]);

  // Carregamento de dados do Supabase
  const fetchDatabaseData = async () => {
    setLoading(true);
    try {
      const [cardsRes, budgetsRes, txRes] = await Promise.all([
        supabase.from('cards').select('*').order('id', { ascending: true }),
        supabase.from('budgets').select('*'),
        supabase.from('transactions').select('*').order('data', { ascending: false }).order('id', { ascending: false })
      ]);

      if (cardsRes.data) {
        const loadedCards: Card[] = cardsRes.data.map(c => ({
          id: c.id,
          nome: c.nome,
          titular: c.titular,
          limite: Number(c.limite),
          faturaAtual: Number(c.fatura_atual),
          diaFechamento: c.dia_fechamento,
          diaVencimento: c.dia_vencimento,
          cor: c.cor
        }));
        setCards(loadedCards);
        if (loadedCards.length > 0 && !selectedCardForDetails) {
          setSelectedCardForDetails(loadedCards[0]);
        }
      }

      if (budgetsRes.data) {
        const bMap: Record<string, number> = {};
        budgetsRes.data.forEach(b => {
          if (b.periodo) {
            bMap[`${b.periodo}_${b.categoria}`] = Number(b.valor_planejado);
          } else {
            bMap[b.categoria] = Number(b.valor_planejado);
          }
        });
        setBudgets(bMap);
      }

      if (txRes.data) {
        const loadedTx: Transaction[] = txRes.data.map(t => ({
          id: t.id,
          data: t.data,
          origem: t.origem,
          classificacao: t.classificacao,
          conta: t.conta,
          cartaoId: t.cartao_id,
          entrada: Number(t.entrada),
          saída: Number(t.saida),
          comentario: t.comentario,
          individuo: t.individuo,
          operacao: t.operacao,
          fixedInstallmentId: t.fixed_installment_id || null
        }));

        const newCatMap = { ...categoriesMap };
        const newAccounts = new Set(accounts);

        loadedTx.forEach(t => {
          if (t.origem) {
            if (!newCatMap[t.origem]) {
              newCatMap[t.origem] = [t.classificacao || 'Geral'];
            } else if (t.classificacao && !newCatMap[t.origem].includes(t.classificacao)) {
              newCatMap[t.origem].push(t.classificacao);
            }
          }
          if (t.conta && !newAccounts.has(t.conta)) {
            newAccounts.add(t.conta);
          }
        });

        setCategoriesMap(newCatMap);
        setAccounts(Array.from(newAccounts));
        setTransactions(loadedTx);
      }

      // Tenta buscar as Contas Fixas e Parcelas do Supabase
      try {
        const { data: fixedData, error: fixedErr } = await supabase
          .from('fixed_accounts')
          .select('*, fixed_account_installments(*)');

        if (!fixedErr && fixedData) {
          const loadedFixed: FixedAccount[] = fixedData.map(fa => ({
            id: fa.id,
            nome: fa.nome,
            origem: fa.origem,
            classificacao: fa.classificacao,
            conta: fa.conta,
            valorPadrao: Number(fa.valor_padrao),
            diaVencimento: fa.dia_vencimento,
            tipoValor: fa.tipo_valor || 'fixo',
            mesesDuracao: fa.meses_duracao || 12,
            mesInicio: fa.mes_inicio,
            isCartao: fa.is_cartao,
            cartaoId: fa.cartao_id,
            individuo: fa.individuo,
            ativo: fa.ativo,
            observacao: fa.observacao,
            installments: (fa.fixed_account_installments || []).map((inst: any) => ({
              id: inst.id,
              fixedAccountId: inst.fixed_account_id,
              periodo: inst.periodo,
              numeroParcela: inst.numero_parcela,
              totalParcelas: inst.total_parcelas,
              valor: Number(inst.valor),
              dataVencimento: inst.data_vencimento,
              dataPagamento: inst.data_pagamento,
              status: inst.status as PaymentStatus,
              transactionId: inst.transaction_id,
              contaPagamento: inst.conta_pagamento,
              observacao: inst.observacao
            }))
          }));
          setFixedAccounts(loadedFixed);
          localStorage.setItem('fixed_accounts_backup', JSON.stringify(loadedFixed));
        } else {
          // Se tabela ainda não existe no Supabase, carrega do localStorage
          const localBackup = localStorage.getItem('fixed_accounts_backup');
          if (localBackup) {
            setFixedAccounts(JSON.parse(localBackup));
          }
        }
      } catch (e) {
        console.warn('Contas fixas carregadas localmente:', e);
        const localBackup = localStorage.getItem('fixed_accounts_backup');
        if (localBackup) {
          setFixedAccounts(JSON.parse(localBackup));
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados do Supabase:', err);
      showToast('Erro de conexão com o banco de dados.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseData();
  }, []);

  // Navegação de Meses
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  // Lançamentos do Mês
  const monthlyTransactions = useMemo(() => {
    if (showAllMonths) return transactions;
    return transactions.filter(t => t.data && t.data.startsWith(selectedPeriodKey));
  }, [transactions, selectedPeriodKey, showAllMonths]);

  // Cálculos de Saldos
  const talysonBalance = useMemo(() => {
    return transactions
      .filter(t => t.conta === 'Conta Talyson')
      .reduce((acc, t) => {
        const entrada = Number(t.entrada) || 0;
        const saida = t.operacao === 'Crédito' ? 0 : (Number(t.saída) || 0);
        return acc + entrada - saida;
      }, 0.0);
  }, [transactions]);

  const karlaBalance = useMemo(() => {
    return transactions
      .filter(t => t.conta === 'Conta Karla')
      .reduce((acc, t) => {
        const entrada = Number(t.entrada) || 0;
        const saida = t.operacao === 'Crédito' ? 0 : (Number(t.saída) || 0);
        return acc + entrada - saida;
      }, 0.0);
  }, [transactions]);

  const consolidatedBalance = talysonBalance + karlaBalance;

  // Fatura de Cartão
  const getCardInvoice = (cardId: number, baseValue: number) => {
    const creditSum = transactions
      .filter(
        t =>
          t.operacao === 'Crédito' &&
          Number(t.cartaoId) === Number(cardId) &&
          getTransactionInvoicePeriod(t.data) === selectedPeriodKey
      )
      .reduce((sum, t) => sum + (Number(t.saída) || 0), 0);
    return (Number(baseValue) || 0) + creditSum;
  };

  const getCardTransactionsForPeriod = (cardId: number) => {
    return transactions.filter(
      t =>
        t.operacao === 'Crédito' &&
        Number(t.cartaoId) === Number(cardId) &&
        getTransactionInvoicePeriod(t.data) === selectedPeriodKey
    );
  };

  const totalFaturasCartoes = useMemo(() => {
    return cards.reduce((acc, c) => acc + getCardInvoice(c.id, c.faturaAtual), 0);
  }, [cards, transactions, selectedPeriodKey]);

  // Orçamentos
  const getCategoryBudget = (category: string) => {
    const periodKey = `${selectedPeriodKey}_${category}`;
    if (budgets[periodKey] !== undefined) return budgets[periodKey];
    return budgets[category] || 0;
  };

  const expenseCategories = useMemo(
    () => Object.keys(categoriesMap).filter(cat => cat !== 'Trabalho'),
    [categoriesMap]
  );

  const totalExpensePlanned = useMemo(() => {
    return expenseCategories.reduce((sum, cat) => sum + getCategoryBudget(cat), 0);
  }, [budgets, expenseCategories, selectedPeriodKey]);

  const totalExpenseExecuted = useMemo(() => {
    return monthlyTransactions
      .filter(t => expenseCategories.includes(t.origem))
      .reduce((sum, t) => sum + (Number(t.saída) || 0), 0);
  }, [monthlyTransactions, expenseCategories]);

  const totalExpenseRemaining = totalExpensePlanned - totalExpenseExecuted;
  const globalExpensePercentage =
    totalExpensePlanned > 0 ? (totalExpenseExecuted / totalExpensePlanned) * 100 : 0;

  const monthlyIncome = useMemo(() => {
    return monthlyTransactions.reduce((sum, t) => sum + (Number(t.entrada) || 0), 0);
  }, [monthlyTransactions]);

  const monthlyExpensesTotal = useMemo(() => {
    return monthlyTransactions.reduce((sum, t) => sum + (Number(t.saída) || 0), 0);
  }, [monthlyTransactions]);

  const incomeExpenseRatio =
    monthlyIncome > 0 ? (monthlyExpensesTotal / monthlyIncome) * 100 : 0;

  const historicalComparison = useMemo(() => {
    const map: Record<string, { period: string; income: number; expense: number }> = {};
    transactions.forEach(t => {
      if (!t.data) return;
      const period = t.data.substring(0, 7);
      if (!map[period]) {
        map[period] = { period, income: 0, expense: 0 };
      }
      map[period].income += Number(t.entrada) || 0;
      map[period].expense += Number(t.saída) || 0;
    });
    return Object.values(map).sort((a, b) => b.period.localeCompare(a.period));
  }, [transactions]);

  const financialHealthScore = useMemo(() => {
    let score = 70;
    if (monthlyIncome > 0) {
      const ratio = monthlyExpensesTotal / monthlyIncome;
      if (ratio <= 0.5) score += 25;
      else if (ratio <= 0.75) score += 15;
      else if (ratio <= 1.0) score += 5;
      else score -= 30;
    }
    if (totalExpensePlanned > 0 && totalExpenseExecuted <= totalExpensePlanned) {
      score += 15;
    } else {
      score -= 10;
    }
    if (consolidatedBalance > 0) score += 10;
    else score -= 15;
    return Math.max(0, Math.min(100, score));
  }, [monthlyIncome, monthlyExpensesTotal, totalExpensePlanned, totalExpenseExecuted, consolidatedBalance]);

  // Contas fixas pendentes e atrasadas para badges
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const pendingFixedCount = useMemo(() => {
    let count = 0;
    fixedAccounts.forEach(a => {
      if (!a.ativo) return;
      const inst = a.installments?.find(i => i.periodo === selectedPeriodKey);
      if (inst && inst.status === 'pendente' && inst.dataVencimento >= todayStr) {
        count++;
      }
    });
    return count;
  }, [fixedAccounts, selectedPeriodKey, todayStr]);

  const lateFixedCount = useMemo(() => {
    let count = 0;
    fixedAccounts.forEach(a => {
      if (!a.ativo) return;
      const inst = a.installments?.find(i => i.periodo === selectedPeriodKey);
      if (inst && (inst.status === 'atrasado' || (inst.status === 'pendente' && inst.dataVencimento < todayStr))) {
        count++;
      }
    });
    return count;
  }, [fixedAccounts, selectedPeriodKey, todayStr]);

  // Ticker com informações em tempo real
  const tickerItems = useMemo(() => {
    const items = [
      { icon: '📅', label: 'Período', value: `${MONTHS[selectedMonth - 1]} / ${selectedYear}`, colorClass: 'text-indigo-300' },
      { icon: '🎯', label: 'Meta Mensal', value: `R$ ${totalExpensePlanned.toFixed(2)}`, colorClass: 'text-indigo-400' },
      { icon: '💸', label: 'Executado no Mês', value: `R$ ${totalExpenseExecuted.toFixed(2)} (${globalExpensePercentage.toFixed(1)}%)`, colorClass: 'text-amber-400' },
      { icon: '💳', label: 'Faturas do Mês', value: `R$ ${totalFaturasCartoes.toFixed(2)}`, colorClass: 'text-purple-400' },
      { icon: '💰', label: 'Saldo Restante', value: `R$ ${totalExpenseRemaining.toFixed(2)}`, colorClass: totalExpenseRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400' },
      {
        icon: '📋',
        label: 'Contas Fixas',
        value: `${pendingFixedCount} pendente(s) | ${lateFixedCount} atrasada(s)`,
        colorClass: lateFixedCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-300'
      }
    ];

    expenseCategories.forEach(cat => {
      const planned = getCategoryBudget(cat);
      if (planned <= 0) return;
      const executed = monthlyTransactions
        .filter(t => t.origem === cat)
        .reduce((sum, t) => sum + (Number(t.saída) || 0), 0);
      const pct = (executed / planned) * 100;

      if (pct >= 100) {
        items.push({
          icon: '🚨',
          label: `ALERTA: ${cat}`,
          value: `Excedido! (${pct.toFixed(0)}%) - R$ ${executed.toFixed(2)} / R$ ${planned.toFixed(2)}`,
          colorClass: 'text-rose-400 font-bold'
        });
      } else if (pct >= 75) {
        items.push({
          icon: '⚠️',
          label: `Atenção: ${cat}`,
          value: `Atingiu ${pct.toFixed(0)}% da meta`,
          colorClass: 'text-amber-300 font-semibold'
        });
      }
    });

    return items;
  }, [
    selectedMonth, selectedYear, expenseCategories, budgets, monthlyTransactions,
    totalExpensePlanned, totalExpenseExecuted, totalExpenseRemaining, globalExpensePercentage,
    totalFaturasCartoes, pendingFixedCount, lateFixedCount
  ]);

  // Filtros Únicos para Lançamentos
  const uniqueOrigins = useMemo(
    () => Array.from(new Set(monthlyTransactions.map(t => t.origem).filter(Boolean))).sort(),
    [monthlyTransactions]
  );
  const uniqueClassifications = useMemo(
    () => Array.from(new Set(monthlyTransactions.map(t => t.classificacao).filter(Boolean))).sort(),
    [monthlyTransactions]
  );
  const uniqueAccounts = useMemo(
    () => Array.from(new Set(monthlyTransactions.map(t => t.conta).filter(Boolean))).sort(),
    [monthlyTransactions]
  );
  const uniqueOperations = useMemo(
    () => Array.from(new Set(monthlyTransactions.map(t => t.operacao).filter(Boolean))).sort(),
    [monthlyTransactions]
  );
  const uniqueIndividuals = useMemo(
    () => Array.from(new Set(monthlyTransactions.map(t => t.individuo).filter(Boolean))).sort(),
    [monthlyTransactions]
  );

  const filteredTransactions = useMemo(() => {
    return [...monthlyTransactions]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime() || b.id - a.id)
      .filter(t => {
        const matchesSearch =
          (t.comentario || '').toLowerCase().includes(searchTx.toLowerCase()) ||
          (t.origem || '').toLowerCase().includes(searchTx.toLowerCase()) ||
          (t.classificacao || '').toLowerCase().includes(searchTx.toLowerCase());

        const matchesOrigem = !columnFilters.origem || t.origem === columnFilters.origem;
        const matchesClassificacao =
          !columnFilters.classificacao || t.classificacao === columnFilters.classificacao;
        const matchesConta = !columnFilters.conta || t.conta === columnFilters.conta;
        const matchesOperacao = !columnFilters.operacao || t.operacao === columnFilters.operacao;
        const matchesIndividuo = !columnFilters.individuo || t.individuo === columnFilters.individuo;

        return (
          matchesSearch &&
          matchesOrigem &&
          matchesClassificacao &&
          matchesConta &&
          matchesOperacao &&
          matchesIndividuo
        );
      });
  }, [monthlyTransactions, searchTx, columnFilters]);

  // Ações de Lançamento Manual / Parcelado
  const handleCreateTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalSaida = parseFloat(newTxForm.saida) || 0;
    const isCreditoParcelado = newTxForm.operacao === 'Crédito' && newTxForm.isParcelado;
    const parcelasCount = isCreditoParcelado ? parseInt(newTxForm.totalParcelas, 10) || 1 : 1;

    if (isCreditoParcelado && parcelasCount > 1) {
      const valorParcela = totalSaida / parcelasCount;
      const payloads: any[] = [];

      for (let i = 0; i < parcelasCount; i++) {
        const parcelaData = addMonthsToDate(newTxForm.data, i);
        const comentarioBase = newTxForm.comentario ? newTxForm.comentario : 'Compra Parcelada';
        const comentarioParcela = `${comentarioBase} (${i + 1}/${parcelasCount})`;

        payloads.push({
          data: parcelaData,
          origem: newTxForm.origem,
          classificacao: newTxForm.classificacao,
          conta: newTxForm.conta,
          cartao_id: newTxForm.cartaoId ? parseInt(newTxForm.cartaoId, 10) : null,
          entrada: 0,
          saida: parseFloat(valorParcela.toFixed(2)),
          comentario: comentarioParcela,
          individuo: newTxForm.individuo,
          operacao: 'Crédito'
        });
      }

      const { data, error } = await supabase.from('transactions').insert(payloads).select();

      if (!error && data) {
        const newRows: Transaction[] = data.map(d => ({
          id: d.id,
          data: d.data,
          origem: d.origem,
          classificacao: d.classificacao,
          conta: d.conta,
          cartaoId: d.cartao_id,
          entrada: Number(d.entrada),
          saída: Number(d.saida),
          comentario: d.comentario,
          individuo: d.individuo,
          operacao: d.operacao,
          fixedInstallmentId: d.fixed_installment_id || null
        }));
        setTransactions(prev => [...newRows, ...prev]);
        setShowAddTxModal(false);
        showToast(`${parcelasCount} parcelas cadastradas com sucesso!`);
      } else {
        showToast('Erro ao salvar parcelamento no banco.', 'error');
      }
    } else {
      const payload = {
        data: newTxForm.data,
        origem: newTxForm.origem,
        classificacao: newTxForm.classificacao,
        conta: newTxForm.conta,
        cartao_id:
          newTxForm.operacao === 'Crédito' && newTxForm.cartaoId
            ? parseInt(newTxForm.cartaoId, 10)
            : null,
        entrada: parseFloat(newTxForm.entrada) || 0,
        saida: totalSaida,
        comentario: newTxForm.comentario,
        individuo: newTxForm.individuo,
        operacao: newTxForm.operacao
      };

      const { data, error } = await supabase.from('transactions').insert([payload]).select().single();

      if (!error && data) {
        const newRow: Transaction = {
          id: data.id,
          data: data.data,
          origem: data.origem,
          classificacao: data.classificacao,
          conta: data.conta,
          cartaoId: data.cartao_id,
          entrada: Number(data.entrada),
          saída: Number(data.saida),
          comentario: data.comentario,
          individuo: data.individuo,
          operacao: data.operacao,
          fixedInstallmentId: data.fixed_installment_id || null
        };
        setTransactions([newRow, ...transactions]);
        setShowAddTxModal(false);
        showToast('Lançamento adicionado com sucesso!');
      } else {
        showToast('Erro ao salvar no banco de dados.', 'error');
      }
    }

    setNewTxForm({
      data: `${selectedPeriodKey}-01`,
      origem: Object.keys(categoriesMap)[0] || 'Dia a Dia',
      classificacao: (categoriesMap[Object.keys(categoriesMap)[0]] || ['Supermercado'])[0],
      conta: accounts[0] || 'Conta Talyson',
      operacao: 'Pix',
      cartaoId: cards[0]?.id ? String(cards[0].id) : '',
      entrada: '',
      saida: '',
      comentario: '',
      individuo: 'Ambos',
      isParcelado: false,
      totalParcelas: '2'
    });
  };

  const handleUpdateTx = async (id: number, field: string, value: any) => {
    const txTarget = transactions.find(t => t.id === id);
    if (!txTarget) return;

    const updatedTx = { ...txTarget, [field]: value };
    if (field === 'origem' && categoriesMap[value]) {
      updatedTx.classificacao = categoriesMap[value][0] || 'Geral';
    }
    if (field === 'operacao' && value === 'Crédito' && !updatedTx.cartaoId && cards.length > 0) {
      updatedTx.cartaoId = cards[0].id;
    }

    setTransactions(prev => prev.map(t => (t.id === id ? updatedTx : t)));

    const dbPayload = {
      data: updatedTx.data,
      origem: updatedTx.origem,
      classificacao: updatedTx.classificacao,
      conta: updatedTx.conta,
      cartao_id: updatedTx.cartaoId,
      entrada: updatedTx.entrada,
      saida: updatedTx.saída,
      comentario: updatedTx.comentario,
      individuo: updatedTx.individuo,
      operacao: updatedTx.operacao,
      fixed_installment_id: updatedTx.fixedInstallmentId
    };

    await supabase.from('transactions').update(dbPayload).eq('id', id);
  };

  const handleDeleteSingleTx = (txId: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Lançamento',
      message: 'Tem certeza que deseja remover este lançamento de forma permanente?',
      onConfirm: async () => {
        setTransactions(prev => prev.filter(t => t.id !== txId));
        await supabase.from('transactions').delete().eq('id', txId);
        showToast('Lançamento excluído com sucesso.');
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleDeleteSelectedTx = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Múltiplos Lançamentos',
      message: `Tem certeza que deseja excluir os ${selectedTxIds.length} lançamentos selecionados?`,
      onConfirm: async () => {
        const idsToDelete = [...selectedTxIds];
        setTransactions(prev => prev.filter(t => !idsToDelete.includes(t.id)));
        setSelectedTxIds([]);
        await supabase.from('transactions').delete().in('id', idsToDelete);
        showToast(`${idsToDelete.length} lançamentos excluídos.`);
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleExportCSV = () => {
    const csvData = filteredTransactions.map(t => ({
      Data: t.data,
      Origem: t.origem,
      Classificação: t.classificacao,
      Conta: t.conta,
      Operação: t.operacao,
      'Cartão (ID)': t.cartaoId || '',
      Entrada: t.entrada,
      Saída: t.saída,
      Comentário: t.comentario,
      Indivíduo: t.individuo
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financas_${selectedPeriodKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async results => {
        const rows = results.data as any[];

        const parseCurrency = (val: any) => {
          if (!val) return 0;
          let s = String(val).trim().replace('R$', '').replace(/\s/g, '');
          if (!s) return 0;
          if (s.includes(',')) {
            s = s.replace(/\./g, '').replace(',', '.');
          }
          const num = parseFloat(s);
          return isNaN(num) ? 0 : num;
        };

        const parseDate = (val: any) => {
          if (!val) return `${selectedPeriodKey}-01`;
          let str = String(val).trim();
          if (str.includes(' ')) str = str.split(' ')[0];
          if (str.includes('T')) str = str.split('T')[0];

          if (str.includes('/')) {
            const parts = str.split('/');
            if (parts.length === 3) {
              const d = parts[0].padStart(2, '0');
              const m = parts[1].padStart(2, '0');
              const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
              return `${y}-${m}-${d}`;
            }
          }
          if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
          return `${selectedPeriodKey}-01`;
        };

        const getColVal = (row: any, possibleKeys: string[]) => {
          const rowKeys = Object.keys(row);
          for (const pk of possibleKeys) {
            const matchedKey = rowKeys.find(
              k =>
                k.trim().toUpperCase() === pk.toUpperCase() ||
                k.trim().toUpperCase().startsWith(pk.toUpperCase())
            );
            if (matchedKey && row[matchedKey] !== undefined) {
              return String(row[matchedKey]).trim();
            }
          }
          return '';
        };

        const payloads = rows.map(row => {
          const rawData = getColVal(row, ['DATA']);
          const rawOrigem = getColVal(row, ['ORIGEM/D', 'ORIGEM', 'CATEGORIA', 'DESCRICAO', 'DESCRIÇÃO']);
          const rawConta = getColVal(row, ['CONTA']);
          const rawClassific = getColVal(row, ['CLASSIFIC.', 'CLASSIFIC', 'CLASSIFICAÇÃO', 'CLASSIFICACAO']);
          const rawEntrada = getColVal(row, ['ENTRADA']);
          const rawSaida = getColVal(row, ['SAIDA', 'SAÍDA', 'VALOR']);
          const rawComenta = getColVal(row, ['COMENTA', 'COMENTÁRIO', 'COMENTARIO', 'OBSERVAÇÃO']);
          const rawIndividuo = getColVal(row, ['INDIVIDUO', 'INDIVÍDUO']);
          const rawOp = getColVal(row, ['OP', 'OPERAÇÃO', 'OPERACAO']);

          let conta = 'Conta Talyson';
          const contaUpper = rawConta.toUpperCase();
          if (contaUpper.includes('TALYSON')) conta = 'Conta Talyson';
          else if (contaUpper.includes('KARLA')) conta = 'Conta Karla';
          else if (contaUpper) conta = rawConta;

          let operacao = 'Pix';
          const opUpper = rawOp.toUpperCase();
          if (opUpper === 'DEB' || opUpper.includes('DÉBITO') || opUpper.includes('DEBITO')) operacao = 'Débito';
          else if (opUpper === 'PIX') operacao = 'Pix';
          else if (opUpper === 'CRED' || opUpper.includes('CRÉDITO') || opUpper.includes('CREDITO')) operacao = 'Crédito';
          else if (opUpper === 'TRANS' || opUpper.includes('TRANSFERÊNCIA') || opUpper.includes('TRANSFERENCIA')) operacao = 'Transferência';
          else if (opUpper.includes('DINHEIRO')) operacao = 'Dinheiro';

          let individuo = 'Ambos';
          const indUpper = rawIndividuo.toUpperCase();
          if (indUpper.includes('TALYSON')) individuo = 'Talyson';
          else if (indUpper.includes('KARLA')) individuo = 'Karla';
          else if (indUpper) individuo = rawIndividuo;

          let origem = rawOrigem || 'Dia a Dia';
          const matchedOrigem = Object.keys(DEFAULT_CATEGORIES_MAP).find(
            c => c.toUpperCase() === origem.toUpperCase()
          );
          if (matchedOrigem) origem = matchedOrigem;

          let classificacao =
            rawClassific ||
            (DEFAULT_CATEGORIES_MAP[origem] ? DEFAULT_CATEGORIES_MAP[origem][0] : 'Geral');

          return {
            data: parseDate(rawData),
            origem: origem,
            classificacao: classificacao,
            conta: conta,
            operacao: operacao,
            cartao_id: null,
            entrada: parseCurrency(rawEntrada),
            saida: parseCurrency(rawSaida),
            comentario: rawComenta || 'Importado via CSV',
            individuo: individuo
          };
        });

        if (payloads.length === 0) {
          showToast('Arquivo CSV vazio ou em formato inválido.', 'error');
          return;
        }

        const { data, error } = await supabase.from('transactions').insert(payloads).select();

        if (!error && data) {
          const newRows: Transaction[] = data.map(d => ({
            id: d.id,
            data: d.data,
            origem: d.origem,
            classificacao: d.classificacao,
            conta: d.conta,
            cartaoId: d.cartao_id,
            entrada: Number(d.entrada),
            saída: Number(d.saida),
            comentario: d.comentario,
            individuo: d.individuo,
            operacao: d.operacao,
            fixedInstallmentId: d.fixed_installment_id || null
          }));

          setTransactions(prev => [...newRows, ...prev]);
          showToast(`${newRows.length} linhas importadas com sucesso!`);
        } else {
          showToast('Erro ao importar dados no banco.', 'error');
        }
        e.target.value = '';
      }
    });
  };

  // Cartões de Crédito
  const handleAddCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCard.nome || !newCard.limite) return;

    const payload = {
      nome: newCard.nome,
      titular: newCard.titular,
      limite: parseFloat(newCard.limite) || 0,
      fatura_atual: parseFloat(newCard.faturaAtual) || 0,
      dia_fechamento: parseInt(newCard.diaFechamento, 10) || 16,
      dia_vencimento: parseInt(newCard.diaVencimento, 10) || 25,
      cor: newCard.cor
    };

    const { data, error } = await supabase.from('cards').insert([payload]).select().single();

    if (!error && data) {
      const newCItem: Card = {
        id: data.id,
        nome: data.nome,
        titular: data.titular,
        limite: Number(data.limite),
        faturaAtual: Number(data.fatura_atual),
        diaFechamento: data.dia_fechamento,
        diaVencimento: data.dia_vencimento,
        cor: data.cor
      };
      setCards([...cards, newCItem]);
      setSelectedCardForDetails(newCItem);
      setNewCard({
        nome: '',
        titular: 'Talyson',
        limite: '',
        faturaAtual: '0',
        diaFechamento: '16',
        diaVencimento: '25',
        cor: 'from-indigo-600 to-purple-800'
      });
      setShowAddCard(false);
      showToast('Cartão adicionado com sucesso!');
    } else {
      showToast('Erro ao salvar o cartão.', 'error');
    }
  };

  const handleDeleteCard = (cardId: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remover Cartão',
      message: 'Cuidado: Remover o cartão pode afetar os lançamentos já associados a ele. Tem certeza?',
      onConfirm: async () => {
        const nextCards = cards.filter(c => c.id !== cardId);
        setCards(nextCards);
        if (selectedCardForDetails && selectedCardForDetails.id === cardId) {
          setSelectedCardForDetails(nextCards[0] || null);
        }
        await supabase.from('cards').delete().eq('id', cardId);
        showToast('Cartão removido.');
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  // Orçamentos
  const handleUpdateCategoryBudget = async (category: string, value: string) => {
    const val = parseFloat(value) || 0;
    const periodKey = `${selectedPeriodKey}_${category}`;

    setBudgets(prev => ({
      ...prev,
      [periodKey]: val
    }));

    try {
      const { data: existing } = await supabase
        .from('budgets')
        .select('id')
        .eq('categoria', category)
        .eq('periodo', selectedPeriodKey)
        .maybeSingle();

      if (existing && existing.id) {
        await supabase
          .from('budgets')
          .update({ valor_planejado: val })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('budgets')
          .insert([
            {
              categoria: category,
              periodo: selectedPeriodKey,
              valor_planejado: val
            }
          ]);
      }
    } catch (err) {
      console.error('Erro ao atualizar orçamento:', err);
      showToast('Falha ao salvar orçamento no banco de dados.', 'error');
    }
  };

  // =========================================================================
  // GESTÃO DAS CONTAS FIXAS & PARCELAS (CONFORME REQUERIMENTO DO USUÁRIO)
  // =========================================================================

  const handleSaveFixedAccount = async (
    accountData: Partial<FixedAccount>,
    monthlyValues: { periodo: string; valor: number }[]
  ) => {
    try {
      const isEditing = !!accountToEdit;
      const accountId = isEditing ? accountToEdit.id : Date.now();

      const accountPayload = {
        nome: accountData.nome,
        origem: accountData.origem,
        classificacao: accountData.classificacao,
        conta: accountData.conta,
        valor_padrao: accountData.valorPadrao,
        dia_vencimento: accountData.diaVencimento,
        tipo_valor: accountData.tipoValor,
        meses_duracao: accountData.mesesDuracao,
        mes_inicio: accountData.mesInicio,
        is_cartao: accountData.isCartao,
        cartao_id: accountData.cartaoId,
        individuo: accountData.individuo,
        ativo: true,
        observacao: accountData.observacao
      };

      let createdId = accountId;

      // 1. Persistência no Supabase (com fallback local se tabela ainda não criada)
      try {
        if (isEditing) {
          await supabase.from('fixed_accounts').update(accountPayload).eq('id', accountToEdit.id);
          createdId = accountToEdit.id;
        } else {
          const { data: inserted, error } = await supabase
            .from('fixed_accounts')
            .insert([accountPayload])
            .select()
            .single();
          if (inserted && !error) {
            createdId = inserted.id;
          }
        }
      } catch (dbErr) {
        console.warn('Supabase fixed_accounts não configurado ainda. Salvando em cache local:', dbErr);
      }

      // 2. Criação das Parcelas / Meses da Conta Fixa
      const generatedInstallments: FixedAccountInstallment[] = monthlyValues.map((mv, idx) => {
        const diaStr = String(accountData.diaVencimento || 10).padStart(2, '0');
        const vencimento = `${mv.periodo}-${diaStr}`;
        const existingInst = accountToEdit?.installments?.find(i => i.periodo === mv.periodo);

        return {
          id: existingInst ? existingInst.id : `${createdId}_${mv.periodo}`,
          fixedAccountId: createdId,
          periodo: mv.periodo,
          numeroParcela: idx + 1,
          totalParcelas: monthlyValues.length,
          valor: Number(mv.valor),
          dataVencimento: vencimento,
          dataPagamento: existingInst?.dataPagamento || null,
          status: existingInst?.status || 'pendente',
          transactionId: existingInst?.transactionId || null,
          contaPagamento: existingInst?.contaPagamento || accountData.conta,
          observacao: existingInst?.observacao || ''
        };
      });

      // Tenta persistir parcelas no Supabase
      try {
        if (isEditing) {
          await supabase.from('fixed_account_installments').delete().eq('fixed_account_id', createdId);
        }
        const installmentPayloads = generatedInstallments.map(inst => ({
          fixed_account_id: createdId,
          periodo: inst.periodo,
          numero_parcela: inst.numeroParcela,
          total_parcelas: inst.totalParcelas,
          valor: inst.valor,
          data_vencimento: inst.dataVencimento,
          data_pagamento: inst.dataPagamento,
          status: inst.status,
          transaction_id: inst.transactionId,
          conta_pagamento: inst.contaPagamento,
          observacao: inst.observacao
        }));
        await supabase.from('fixed_account_installments').insert(installmentPayloads);
      } catch (instErr) {
        console.warn('Parcelas salvas em cache local:', instErr);
      }

      const completeAccount: FixedAccount = {
        id: createdId,
        nome: accountData.nome || '',
        origem: accountData.origem || 'Infraestrutura',
        classificacao: accountData.classificacao || 'Geral',
        conta: accountData.conta || 'Conta Talyson',
        valorPadrao: accountData.valorPadrao || 0,
        diaVencimento: accountData.diaVencimento || 10,
        tipoValor: accountData.tipoValor || 'fixo',
        mesesDuracao: accountData.mesesDuracao || 12,
        mesInicio: accountData.mesInicio || selectedPeriodKey,
        isCartao: accountData.isCartao,
        cartaoId: accountData.cartaoId,
        individuo: accountData.individuo || 'Ambos',
        ativo: true,
        observacao: accountData.observacao,
        installments: generatedInstallments
      };

      setFixedAccounts(prev => {
        const next = isEditing
          ? prev.map(a => (a.id === createdId ? completeAccount : a))
          : [...prev, completeAccount];
        localStorage.setItem('fixed_accounts_backup', JSON.stringify(next));
        return next;
      });

      showToast(isEditing ? 'Conta fixa atualizada com sucesso!' : 'Conta fixa cadastrada com sucesso!');
      setAccountToEdit(null);
    } catch (err) {
      console.error('Erro ao salvar conta fixa:', err);
      showToast('Erro ao salvar a conta fixa.', 'error');
    }
  };

  const handleDeleteFixedAccount = (accountId: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Conta Fixa',
      message:
        'Tem certeza que deseja excluir esta conta fixa e todas as parcelas programadas? Lançamentos já quitados permanecerão no histórico.',
      onConfirm: async () => {
        setFixedAccounts(prev => {
          const next = prev.filter(a => a.id !== accountId);
          localStorage.setItem('fixed_accounts_backup', JSON.stringify(next));
          return next;
        });

        try {
          await supabase.from('fixed_accounts').delete().eq('id', accountId);
        } catch (e) {
          console.warn('Erro ao deletar no Supabase:', e);
        }

        showToast('Conta fixa excluída com sucesso.');
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  // REGISTRAR PAGAMENTO E LANÇAR NO HISTÓRICO PRINCIPAL AUTOMATICAMENTE!
  const handleConfirmPayment = async (
    account: FixedAccount,
    installment: FixedAccountInstallment,
    paymentDetails: {
      dataPagamento: string;
      valorPago: number;
      contaPagamento: string;
      operacao: string;
      observacao: string;
    }
  ) => {
    try {
      // 1. Cria o Lançamento na tabela `transactions` do histórico
      const txPayload = {
        data: paymentDetails.dataPagamento,
        origem: account.origem,
        classificacao: account.classificacao || 'Conta Fixa',
        conta: paymentDetails.contaPagamento,
        cartao_id: account.cartaoId || null,
        entrada: 0,
        saida: paymentDetails.valorPago,
        comentario: `Pagamento Conta Fixa: ${account.nome} (${installment.numeroParcela}/${installment.totalParcelas})${
          paymentDetails.observacao ? ` - ${paymentDetails.observacao}` : ''
        }`,
        individuo: account.individuo,
        operacao: paymentDetails.operacao,
        fixed_installment_id: typeof installment.id === 'number' ? installment.id : null
      };

      let newTxId = Date.now();
      try {
        const { data: txCreated, error } = await supabase
          .from('transactions')
          .insert([txPayload])
          .select()
          .single();

        if (txCreated && !error) {
          newTxId = txCreated.id;
          const newTxRow: Transaction = {
            id: txCreated.id,
            data: txCreated.data,
            origem: txCreated.origem,
            classificacao: txCreated.classificacao,
            conta: txCreated.conta,
            cartaoId: txCreated.cartao_id,
            entrada: 0,
            saída: Number(txCreated.saida),
            comentario: txCreated.comentario,
            individuo: txCreated.individuo,
            operacao: txCreated.operacao,
            fixedInstallmentId: txCreated.fixed_installment_id
          };
          setTransactions(prev => [newTxRow, ...prev]);
        } else {
          // Fallback se erro no insert de transaction
          const fallbackTx: Transaction = {
            id: newTxId,
            data: txPayload.data,
            origem: txPayload.origem,
            classificacao: txPayload.classificacao,
            conta: txPayload.conta,
            cartaoId: txPayload.cartao_id,
            entrada: 0,
            saída: txPayload.saida,
            comentario: txPayload.comentario,
            individuo: txPayload.individuo,
            operacao: txPayload.operacao,
            fixedInstallmentId: txPayload.fixed_installment_id
          };
          setTransactions(prev => [fallbackTx, ...prev]);
        }
      } catch (txErr) {
        console.warn('Erro ao inserir transação:', txErr);
      }

      // 2. Atualiza a Parcela da Conta Fixa para status 'pago' e vincula o ID da transação
      setFixedAccounts(prev => {
        const next = prev.map(acc => {
          if (acc.id !== account.id) return acc;
          const updatedInsts = (acc.installments || []).map(inst => {
            if (inst.id === installment.id || (inst.periodo === installment.periodo && !inst.dataPagamento)) {
              return {
                ...inst,
                status: 'pago' as PaymentStatus,
                dataPagamento: paymentDetails.dataPagamento,
                valor: paymentDetails.valorPago,
                contaPagamento: paymentDetails.contaPagamento,
                transactionId: newTxId,
                observacao: paymentDetails.observacao
              };
            }
            return inst;
          });
          return { ...acc, installments: updatedInsts };
        });
        localStorage.setItem('fixed_accounts_backup', JSON.stringify(next));
        return next;
      });

      // Tenta atualizar no Supabase a parcela
      try {
        if (typeof installment.id === 'number') {
          await supabase
            .from('fixed_account_installments')
            .update({
              status: 'pago',
              data_pagamento: paymentDetails.dataPagamento,
              valor: paymentDetails.valorPago,
              conta_pagamento: paymentDetails.contaPagamento,
              transaction_id: newTxId,
              observacao: paymentDetails.observacao
            })
            .eq('id', installment.id);
        }
      } catch (updErr) {
        console.warn('Atualização da parcela salva em cache local');
      }

      showToast(`Pagamento de "${account.nome}" registrado com sucesso no Histórico!`);
    } catch (err) {
      console.error('Erro ao registrar pagamento:', err);
      showToast('Erro ao registrar o pagamento.', 'error');
    }
  };

  // Reverter pagamento
  const handleRevertPayment = async (account: FixedAccount, installment: FixedAccountInstallment) => {
    setConfirmModal({
      isOpen: true,
      title: 'Desmarcar Pagamento',
      message: `Deseja desmarcar o pagamento de "${account.nome}"? O lançamento correspondente será removido do Histórico e o saldo será estornado.`,
      onConfirm: async () => {
        // Remove a transação associada do histórico se houver
        if (installment.transactionId) {
          setTransactions(prev => prev.filter(t => t.id !== installment.transactionId));
          try {
            await supabase.from('transactions').delete().eq('id', installment.transactionId);
          } catch (e) {
            console.warn(e);
          }
        }

        // Reverte o status da parcela para pendente
        setFixedAccounts(prev => {
          const next = prev.map(acc => {
            if (acc.id !== account.id) return acc;
            const updatedInsts = (acc.installments || []).map(inst => {
              if (inst.id === installment.id) {
                return {
                  ...inst,
                  status: 'pendente' as PaymentStatus,
                  dataPagamento: null,
                  transactionId: null
                };
              }
              return inst;
            });
            return { ...acc, installments: updatedInsts };
          });
          localStorage.setItem('fixed_accounts_backup', JSON.stringify(next));
          return next;
        });

        try {
          if (typeof installment.id === 'number') {
            await supabase
              .from('fixed_account_installments')
              .update({
                status: 'pendente',
                data_pagamento: null,
                transaction_id: null
              })
              .eq('id', installment.id);
          }
        } catch (e) {
          console.warn(e);
        }

        showToast('Pagamento desmarcado e lançamento removido do Histórico.');
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  // Edição rápida de valor da parcela
  const handleQuickUpdateInstallmentValue = async (installmentId: number | string, newValue: number) => {
    setFixedAccounts(prev => {
      const next = prev.map(acc => {
        const hasInst = acc.installments?.some(i => i.id === installmentId);
        if (!hasInst) return acc;
        const updated = (acc.installments || []).map(i => {
          if (i.id === installmentId) {
            return { ...i, valor: newValue };
          }
          return i;
        });
        return { ...acc, installments: updated };
      });
      localStorage.setItem('fixed_accounts_backup', JSON.stringify(next));
      return next;
    });

    try {
      if (typeof installmentId === 'number') {
        await supabase
          .from('fixed_account_installments')
          .update({ valor: newValue })
          .eq('id', installmentId);
      }
    } catch (e) {
      console.warn(e);
    }
    showToast('Valor atualizado para o mês selecionado.');
  };

  // Sincronizar Faturas de Cartão com Contas Fixas
  const handleSyncCardInvoicesToFixedAccounts = async () => {
    try {
      let addedOrUpdated = 0;
      for (const card of cards) {
        const invoiceVal = getCardInvoice(card.id, card.faturaAtual);
        const existing = fixedAccounts.find(a => a.isCartao && a.cartaoId === card.id);

        if (existing) {
          // Atualiza a parcela do mês atual se ainda não estiver paga
          const instIndex = existing.installments?.findIndex(i => i.periodo === selectedPeriodKey);
          if (instIndex !== undefined && instIndex >= 0) {
            const currentInst = existing.installments![instIndex];
            if (currentInst.status !== 'pago') {
              await handleQuickUpdateInstallmentValue(currentInst.id, invoiceVal);
              addedOrUpdated++;
            }
          }
        } else {
          // Cria uma nova conta fixa vinculada ao cartão
          const monthlyList = [];
          for (let i = 0; i < 12; i++) {
            const p = addMonthsToPeriod(selectedPeriodKey, i);
            monthlyList.push({
              periodo: p,
              valor: i === 0 ? invoiceVal : 0
            });
          }

          await handleSaveFixedAccount(
            {
              nome: `Fatura ${card.nome}`,
              origem: 'Cartão de Crédito',
              classificacao: `Fatura ${card.nome}`,
              conta: card.titular === 'Talyson' ? 'Conta Talyson' : 'Conta Karla',
              valorPadrao: invoiceVal,
              diaVencimento: card.diaVencimento,
              tipoValor: 'variavel',
              mesesDuracao: 12,
              mesInicio: selectedPeriodKey,
              isCartao: true,
              cartaoId: card.id,
              individuo: card.titular,
              observacao: `Fatura do cartão de crédito ${card.nome} (${card.titular})`
            },
            monthlyList
          );
          addedOrUpdated++;
        }
      }
      showToast(`${addedOrUpdated} fatura(s) de cartão sincronizada(s) nas Contas Fixas!`);
    } catch (err) {
      console.error(err);
      showToast('Erro ao sincronizar faturas com contas fixas.', 'error');
    }
  };

  // Adicionar Categoria / Classificação / Conta Customizada
  const handleAddCustomItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = customModal.name.trim();
    if (!name) return;

    if (customModal.type === 'origem') {
      if (!categoriesMap[name]) {
        setCategoriesMap(prev => ({ ...prev, [name]: ['Geral'] }));
        setNewTxForm(prev => ({ ...prev, origem: name, classificacao: 'Geral' }));
        showToast(`Nova categoria "${name}" adicionada!`);
      } else {
        showToast('Esta categoria já existe.', 'error');
      }
    } else if (customModal.type === 'classificacao') {
      const targetCat = customModal.categoryTarget || newTxForm.origem;
      if (categoriesMap[targetCat]) {
        if (!categoriesMap[targetCat].includes(name)) {
          setCategoriesMap(prev => ({
            ...prev,
            [targetCat]: [...prev[targetCat], name]
          }));
          setNewTxForm(prev => ({ ...prev, classificacao: name }));
          showToast(`Nova classificação "${name}" adicionada em "${targetCat}"!`);
        } else {
          showToast('Esta classificação já existe para esta categoria.', 'error');
        }
      }
    } else if (customModal.type === 'conta') {
      if (!accounts.includes(name)) {
        setAccounts(prev => [...prev, name]);
        setNewTxForm(prev => ({ ...prev, conta: name }));
        showToast(`Nova conta "${name}" cadastrada!`);
      } else {
        showToast('Esta conta já está cadastrada.', 'error');
      }
    }

    setCustomModal({ isOpen: false, type: '', categoryTarget: '', name: '' });
  };

  return (
    <div className="flex-1 flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header e Barra de Navegação */}
      <Navbar
        financeTab={financeTab}
        setFinanceTab={setFinanceTab}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        setSelectedMonth={setSelectedMonth}
        setSelectedYear={setSelectedYear}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        loading={loading}
        onRefresh={fetchDatabaseData}
        talysonBalance={talysonBalance}
        karlaBalance={karlaBalance}
        consolidatedBalance={consolidatedBalance}
        pendingFixedCount={pendingFixedCount}
        lateFixedCount={lateFixedCount}
        onOpenMigrationsModal={() => setShowMigrationsModal(true)}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-[1700px] w-full mx-auto space-y-6 pb-16">
          {/* Aba 1: Painel Geral & Histórico */}
          {financeTab === 'painel' && (
            <div className="space-y-6">
              {/* Marquee / Ticker de Métricas */}
              <div className="bg-slate-900/90 border border-indigo-500/30 rounded-xl overflow-hidden p-2.5 flex items-center gap-3 shadow-lg backdrop-blur">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 shrink-0">
                  <Megaphone className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <span className="whitespace-nowrap uppercase tracking-wider text-[11px]">
                    Resumo ({MONTHS[selectedMonth - 1]}/{selectedYear})
                  </span>
                </div>
                <div className="overflow-hidden w-full relative">
                  <div className="animate-marquee flex items-center gap-8 text-xs font-mono">
                    {[...tickerItems, ...tickerItems].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 whitespace-nowrap">
                        <span className="text-sm">{item.icon}</span>
                        <span className="text-slate-400">{item.label}:</span>
                        <span className={`font-semibold ${item.colorClass}`}>{item.value}</span>
                        <span className="text-slate-700 ml-4 font-normal">&bull;</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cards de Saldos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/50 transition-colors shadow-lg">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Conta Talyson (Total)</p>
                  <h3 className="text-2xl font-bold text-white mt-1">
                    R$ {talysonBalance.toFixed(2)}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">Saldo em Conta</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-purple-500/50 transition-colors shadow-lg">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Conta Karla (Total)</p>
                  <h3 className="text-2xl font-bold text-white mt-1">
                    R$ {karlaBalance.toFixed(2)}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">Saldo em Conta</p>
                </div>

                <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-5 relative overflow-hidden group shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <p className="text-xs text-indigo-300 font-semibold uppercase relative z-10">Saldo Consolidado</p>
                  <h3 className="text-3xl font-extrabold text-white mt-1 relative z-10">
                    R$ {consolidatedBalance.toFixed(2)}
                  </h3>
                  <p className="text-[10px] text-indigo-300/70 mt-1 relative z-10">Disponível em Dinheiro/Pix</p>
                </div>

                <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-5 hover:border-purple-400/60 transition-colors shadow-lg">
                  <p className="text-xs text-purple-400 font-semibold uppercase">
                    Faturas ({MONTHS[selectedMonth - 1]})
                  </p>
                  <h3 className="text-2xl font-bold text-purple-300 mt-1">
                    R$ {totalFaturasCartoes.toFixed(2)}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">Gasto em Crédito no Mês</p>
                </div>
              </div>

              {/* Tabela de Lançamentos do Histórico */}
              <TransactionsTable
                transactions={transactions}
                filteredTransactions={filteredTransactions}
                selectedTxIds={selectedTxIds}
                showAllMonths={showAllMonths}
                spreadsheetMode={spreadsheetMode}
                showColumnFilters={showColumnFilters}
                searchTx={searchTx}
                columnFilters={columnFilters}
                categoriesMap={categoriesMap}
                accounts={accounts}
                cards={cards}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onToggleShowAllMonths={() => setShowAllMonths(!showAllMonths)}
                onToggleSpreadsheetMode={() => setSpreadsheetMode(!spreadsheetMode)}
                onToggleColumnFilters={() => setShowColumnFilters(!showColumnFilters)}
                onSetSearchTx={setSearchTx}
                onSetColumnFilters={setColumnFilters}
                onOpenAddTxModal={() => setShowAddTxModal(true)}
                onExportCSV={handleExportCSV}
                onImportCSV={handleImportCSV}
                onDeleteSingleTx={handleDeleteSingleTx}
                onDeleteSelectedTx={handleDeleteSelectedTx}
                onSelectTx={id =>
                  setSelectedTxIds(prev =>
                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                  )
                }
                onSelectAllTx={e =>
                  setSelectedTxIds(e.target.checked ? filteredTransactions.map(t => t.id) : [])
                }
                onUpdateTx={handleUpdateTx}
                onOpenCustomModal={(type, target) =>
                  setCustomModal({ isOpen: true, type, categoryTarget: target || '', name: '' })
                }
                uniqueOrigins={uniqueOrigins}
                uniqueClassifications={uniqueClassifications}
                uniqueAccounts={uniqueAccounts}
                uniqueOperations={uniqueOperations}
                uniqueIndividuals={uniqueIndividuals}
              />
            </div>
          )}

          {/* Aba 2: Contas Fixas & Recorrentes */}
          {financeTab === 'contas_fixas' && (
            <FixedAccountsTab
              fixedAccounts={fixedAccounts}
              cards={cards}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              selectedPeriodKey={selectedPeriodKey}
              getCardInvoice={getCardInvoice}
              onOpenAddModal={() => {
                setAccountToEdit(null);
                setShowAddFixedAccountModal(true);
              }}
              onEditAccount={account => {
                setAccountToEdit(account);
                setShowAddFixedAccountModal(true);
              }}
              onDeleteAccount={handleDeleteFixedAccount}
              onOpenPayModal={(account, installment) => {
                setPayingAccount(account);
                setPayingInstallment(installment);
                setShowPayModal(true);
              }}
              onRevertPayment={handleRevertPayment}
              onQuickUpdateInstallmentValue={handleQuickUpdateInstallmentValue}
              onOpenMigrationsModal={() => setShowMigrationsModal(true)}
              onSyncCardInvoicesToFixedAccounts={handleSyncCardInvoicesToFixedAccounts}
            />
          )}

          {/* Aba 3: Dashboard Analítico */}
          {financeTab === 'dashboard' && (
            <DashboardTab
              monthlyTransactions={monthlyTransactions}
              transactions={transactions}
              expenseCategories={expenseCategories}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              selectedPeriodKey={selectedPeriodKey}
              monthlyIncome={monthlyIncome}
              monthlyExpensesTotal={monthlyExpensesTotal}
              incomeExpenseRatio={incomeExpenseRatio}
              financialHealthScore={financialHealthScore}
              historicalComparison={historicalComparison}
            />
          )}

          {/* Aba 4: Planejamento de Gastos */}
          {financeTab === 'planejamento' && (
            <BudgetsTab
              expenseCategories={expenseCategories}
              categoriesMap={categoriesMap}
              monthlyTransactions={monthlyTransactions}
              totalExpensePlanned={totalExpensePlanned}
              totalExpenseExecuted={totalExpenseExecuted}
              totalExpenseRemaining={totalExpenseRemaining}
              globalExpensePercentage={globalExpensePercentage}
              getCategoryBudget={getCategoryBudget}
              onUpdateCategoryBudget={handleUpdateCategoryBudget}
            />
          )}

          {/* Aba 5: Cartões de Crédito */}
          {financeTab === 'cartoes' && (
            <CardsTab
              cards={cards}
              selectedCardForDetails={selectedCardForDetails}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              cardSpreadsheetMode={cardSpreadsheetMode}
              getCardInvoice={getCardInvoice}
              getCardTransactionsForPeriod={getCardTransactionsForPeriod}
              onSetSelectedCardForDetails={setSelectedCardForDetails}
              onSetCardSpreadsheetMode={setCardSpreadsheetMode}
              onOpenAddCard={() => setShowAddCard(true)}
              onDeleteCard={handleDeleteCard}
              onDeleteSingleTx={handleDeleteSingleTx}
            />
          )}
        </div>
      </main>

      {/* MODAL: MIGRATIONS DO SUPABASE */}
      <MigrationsModal
        isOpen={showMigrationsModal}
        onClose={() => setShowMigrationsModal(false)}
        showToast={showToast}
      />

      {/* MODAL: CADASTRAR / EDITAR CONTA FIXA */}
      <AddFixedAccountModal
        isOpen={showAddFixedAccountModal}
        onClose={() => {
          setShowAddFixedAccountModal(false);
          setAccountToEdit(null);
        }}
        onSave={handleSaveFixedAccount}
        categoriesMap={categoriesMap}
        accounts={accounts}
        cards={cards}
        selectedPeriodKey={selectedPeriodKey}
        accountToEdit={accountToEdit}
        onOpenCustomModal={(type, target) =>
          setCustomModal({ isOpen: true, type, categoryTarget: target || '', name: '' })
        }
      />

      {/* MODAL: REGISTRAR PAGAMENTO DE CONTA FIXA */}
      <PayFixedAccountModal
        isOpen={showPayModal}
        onClose={() => {
          setShowPayModal(false);
          setPayingAccount(null);
          setPayingInstallment(null);
        }}
        onConfirmPayment={handleConfirmPayment}
        account={payingAccount}
        installment={payingInstallment}
        accounts={accounts}
      />

      {/* MODAL: NOVO LANÇAMENTO MANUAL (COM PARCELAMENTO) */}
      {showAddTxModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" /> Novo Lançamento Financeiro
              </h3>
              <button onClick={() => setShowAddTxModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransactionSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={newTxForm.data}
                    onChange={e => setNewTxForm({ ...newTxForm, data: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Operação</label>
                  <select
                    value={newTxForm.operacao}
                    onChange={e => setNewTxForm({ ...newTxForm, operacao: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {['Pix', 'Débito', 'Crédito', 'Dinheiro', 'Transferência', 'Boleto'].map(op => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>
              </div>

              {newTxForm.operacao === 'Crédito' && (
                <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl space-y-3">
                  <div>
                    <label className="text-xs text-purple-300 font-semibold block mb-1">
                      Selecionar Cartão de Crédito
                    </label>
                    <select
                      value={newTxForm.cartaoId}
                      onChange={e => setNewTxForm({ ...newTxForm, cartaoId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      required={newTxForm.operacao === 'Crédito'}
                    >
                      <option value="">Selecione o Cartão...</option>
                      {cards.map(c => (
                        <option key={c.id} value={c.id}>{c.nome} ({c.titular})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isParcelado"
                      checked={newTxForm.isParcelado}
                      onChange={e => setNewTxForm({ ...newTxForm, isParcelado: e.target.checked })}
                      className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                    />
                    <label htmlFor="isParcelado" className="text-xs font-semibold text-purple-200 cursor-pointer">
                      Compra Parcelada em Vários Meses?
                    </label>
                  </div>

                  {newTxForm.isParcelado && (
                    <div>
                      <label className="text-xs text-purple-300 font-semibold block mb-1">
                        Número de Parcelas
                      </label>
                      <select
                        value={newTxForm.totalParcelas}
                        onChange={e => setNewTxForm({ ...newTxForm, totalParcelas: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      >
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map(n => (
                          <option key={n} value={n}>{n}x vezes</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-purple-400 mt-1">
                        O valor informado será dividido igualmente entre {newTxForm.totalParcelas} meses consecutivos.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Origem / Categoria</label>
                  <select
                    value={newTxForm.origem}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '___NEW___') {
                        setCustomModal({ isOpen: true, type: 'origem', name: '' });
                      } else {
                        const firstClass = (categoriesMap[val] || ['Geral'])[0];
                        setNewTxForm({ ...newTxForm, origem: val, classificacao: firstClass });
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
                    value={newTxForm.classificacao}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '___NEW___') {
                        setCustomModal({
                          isOpen: true,
                          type: 'classificacao',
                          categoryTarget: newTxForm.origem,
                          name: ''
                        });
                      } else {
                        setNewTxForm({ ...newTxForm, classificacao: val });
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {(categoriesMap[newTxForm.origem] || ['Geral']).map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                    <option value="___NEW___" className="text-indigo-400 font-bold">+ Adicionar Classificação...</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Conta Vinculada</label>
                  <select
                    value={newTxForm.conta}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '___NEW___') {
                        setCustomModal({ isOpen: true, type: 'conta', name: '' });
                      } else {
                        setNewTxForm({ ...newTxForm, conta: val });
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
                    value={newTxForm.individuo}
                    onChange={e => setNewTxForm({ ...newTxForm, individuo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {['Ambos', 'Talyson', 'Karla'].map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Entrada (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTxForm.entrada}
                    onChange={e => setNewTxForm({ ...newTxForm, entrada: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-emerald-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    {newTxForm.isParcelado ? 'Valor Total da Compra (R$)' : 'Saída / Gasto (R$)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTxForm.saida}
                    onChange={e => setNewTxForm({ ...newTxForm, saida: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-rose-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Comentário / Observação</label>
                <input
                  type="text"
                  value={newTxForm.comentario}
                  onChange={e => setNewTxForm({ ...newTxForm, comentario: e.target.value })}
                  placeholder="Ex: Supermercado mensal..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddTxModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg text-white shadow-lg shadow-indigo-600/30"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR CARTÃO DE CRÉDITO */}
      {showAddCard && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" /> Novo Cartão de Crédito
              </h3>
              <button onClick={() => setShowAddCard(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCardSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Nome do Cartão</label>
                <input
                  type="text"
                  required
                  value={newCard.nome}
                  onChange={e => setNewCard({ ...newCard, nome: e.target.value })}
                  placeholder="Ex: Nubank, Visa Infinite..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Titular</label>
                  <select
                    value={newCard.titular}
                    onChange={e => setNewCard({ ...newCard, titular: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Talyson">Talyson</option>
                    <option value="Karla">Karla</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Limite Total (R$)</label>
                  <input
                    type="number"
                    step="100"
                    required
                    value={newCard.limite}
                    onChange={e => setNewCard({ ...newCard, limite: e.target.value })}
                    placeholder="5000.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Dia Fechamento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={newCard.diaFechamento}
                    onChange={e => setNewCard({ ...newCard, diaFechamento: e.target.value })}
                    placeholder="16"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Dia Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={newCard.diaVencimento}
                    onChange={e => setNewCard({ ...newCard, diaVencimento: e.target.value })}
                    placeholder="25"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Fatura Atual (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newCard.faturaAtual}
                    onChange={e => setNewCard({ ...newCard, faturaAtual: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Estilo Visual do Cartão</label>
                <select
                  value={newCard.cor}
                  onChange={e => setNewCard({ ...newCard, cor: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {[
                    { label: 'Roxo / Índigo', value: 'from-indigo-600 to-purple-800' },
                    { label: 'Rosa / Violeta', value: 'from-purple-600 to-pink-700' },
                    { label: 'Verde / Esmeralda', value: 'from-emerald-600 to-teal-800' },
                    { label: 'Azul / Ciano', value: 'from-blue-600 to-cyan-800' },
                    { label: 'Laranja / Amarelo', value: 'from-amber-600 to-orange-800' },
                    { label: 'Cinza / Escuro', value: 'from-slate-700 to-slate-900' },
                    { label: 'Vermelho / Rubi', value: 'from-rose-600 to-red-900' }
                  ].map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCard(false)}
                  className="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-lg text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-xs font-semibold rounded-lg text-white"
                >
                  Cadastrar Cartão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR ITEM PERSONALIZADO (CATEGORIA / CONTA) */}
      {customModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white capitalize">
              Adicionar Novo{' '}
              {customModal.type === 'origem'
                ? 'Categoria'
                : customModal.type === 'classificacao'
                ? 'Classificação'
                : 'Conta'}
            </h3>
            <form onSubmit={handleAddCustomItemSubmit} className="space-y-4">
              <input
                type="text"
                required
                autoFocus
                placeholder="Nome..."
                value={customModal.name}
                onChange={e => setCustomModal(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCustomModal({ isOpen: false, type: '', categoryTarget: '', name: '' })}
                  className="px-3 py-1.5 bg-slate-800 text-xs rounded-lg text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-xs rounded-lg text-white font-semibold"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO GENÉRICA */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">{confirmModal.title}</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{confirmModal.message}</p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })}
                className="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-lg text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-xs font-semibold rounded-lg text-white font-medium"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST DE NOTIFICAÇÃO */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-xs font-semibold animate-bounce ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
