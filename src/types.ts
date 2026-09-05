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

export type ActiveTab = 'painel' | 'dashboard' | 'planejamento' | 'cartoes' | 'contas_fixas';
