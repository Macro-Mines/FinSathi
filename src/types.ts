export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  incomeBracket?: string;
  goals?: string[];
  preferredLanguage?: string;
  isZeroRetention?: boolean;
  createdAt: string;
}

export interface Transaction {
  id?: string;
  userId: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  subCategory?: string;
  bank?: string;
  rawDescription: string;
}

export interface ChatMessage {
  id?: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export type IncomeBracket = '0-5L' | '5-10L' | '10-20L' | '20L+';

export const CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Investments',
  'Utilities',
  'P2P Transfers',
  'EMI / Loan',
  'Shopping',
  'Entertainment',
  'Health',
  'Others'
] as const;

export type Category = typeof CATEGORIES[number];
