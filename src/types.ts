export interface Transaction {
  id: number;
  data: string;
  origem: string;
  classificacao: string;
  conta: string;
  cartaoId?: number | null;
  entrada: number;
  saída: number;
  comentario: string;
  individuo: string;
  operacao: string;
  fixedInstallmentId?: number | null;
}

export interface Card {
  id: number;
  nome: string;
  titular: string;
  limite: number;
  faturaAtual: number;
  diaFechamento: number;
  diaVencimento: number;
  cor: string;
}

export interface Budget {
  id?: number;
  categoria: string;
  periodo?: string;
  valor_planejado: number;
}

export type FixedAccountType = 'fixo' | 'variavel';
export type FixedAccountNature = 'despesa' | 'receita';
export type PaymentStatus = 'pendente' | 'pago' | 'atrasado';

export interface FixedAccount {
  id: number;
  nome: string;
  origem: string;
  classificacao: string;
  conta: string;
  valorPadrao: number;
  diaVencimento: number;
  tipoValor: FixedAccountType;
  mesesDuracao: number;
  mesInicio: string; // YYYY-MM
  isCartao?: boolean;
  cartaoId?: number | null;
  individuo: string;
  ativo: boolean;
  natureza?: FixedAccountNature; // 'despesa' | 'receita' (default: 'despesa')
  observacao?: string;
  installments?: FixedAccountInstallment[];
}

export interface FixedAccountInstallment {
  id: number | string;
  fixedAccountId: number;
  periodo: string; // YYYY-MM
  numeroParcela: number;
  totalParcelas: number;
  valor: number;
  dataVencimento: string; // YYYY-MM-DD
  dataPagamento?: string | null; // YYYY-MM-DD
  status: PaymentStatus;
  transactionId?: number | null;
  contaPagamento?: string;
  observacao?: string;
}

export interface ReserveTransaction {
  id: string;
  data: string; // YYYY-MM-DD
  tipo: 'deposito' | 'resgate';
  valor: number;
  nota?: string;
  contaOrigemDestino?: string;
}

export interface ReserveGoal {
  id: string;
  nome: string;
  tipo: 'emergencia' | 'objetivo';
  categoria: string;
  valorAtual: number;
  valorMeta: number;
  mesesCustoFixo?: number;
  dataAlvo?: string; // YYYY-MM ou YYYY-MM-DD
  contaOndeEsta?: string;
  rendimentoEstimado?: number; // % ao ano
  cor: string;
  icone: string;
  descricao?: string;
  criadoEm: string;
  historico: ReserveTransaction[];
}

export type ActiveTab = 'painel' | 'dashboard' | 'planejamento' | 'cartoes' | 'contas_fixas' | 'reservas';
