import apiClient, { extractData, extractMeta, ApiResponse } from '../lib/api-client';

/**
 * Transaction interface
 */
export interface Transaction {
  id: string;
  type: 'escrow_deposit' | 'escrow_release' | 'escrow_refund' | 'consultation_payment';
  amount: number;
  status: 'success' | 'pending' | 'failed';
  payment_reference?: string;
  description: string;
  entity_type: string;
  entity_id: string;
  milestone?: {
    id: string;
    title: string;
  };
  project?: {
    id: string;
    title: string;
  };
  consultation?: {
    id: string;
    scheduled_at?: string;
  };
  client?: {
    id: string;
    name: string;
  };
  company?: {
    id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Pagination meta
 */
export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

/**
 * Transaction Service
 * Handles transaction history API calls
 */
export const transactionService = {
  /**
   * List transactions with pagination
   */
  async list(params?: {
    per_page?: number;
    page?: number;
    type?: 'escrow' | 'consultation' | 'all';
    status?: 'success' | 'pending' | 'failed' | 'all';
  }): Promise<{ transactions: Transaction[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiResponse<Transaction[]>>('/transactions', {
      params,
    });
    
    const transactions = extractData<Transaction[]>(response);
    const meta = extractMeta(response) as PaginationMeta;
    
    return {
      transactions,
      meta,
    };
  },
};

