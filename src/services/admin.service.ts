import apiClient, { extractData, extractMeta, ApiResponse } from '../lib/api-client';
import { Company } from './auth.service';

/**
 * Admin Service
 * Handles all admin-related API calls
 */

/**
 * Company interface for admin
 */
export interface AdminCompany extends Company {
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Dispute interface
 */
export interface Dispute {
  id: number;
  project_id: number;
  milestone_id?: number;
  raised_by: number;
  reason: string;
  status: 'open' | 'resolved' | 'escalated';
  resolution_notes?: string;
  project?: {
    id: number;
    title: string;
    client_id: number;
    company_id: number;
  };
  milestone?: {
    id: number;
    title: string;
    amount: number;
  };
  raised_by_user?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Milestone for escrow release
 */
export interface MilestoneForRelease {
  id: number;
  project_id: number;
  title: string;
  amount: number;
  status: string;
  escrow?: {
    id: number;
    amount: number;
    status: string;
    payment_reference: string;
  };
  project?: {
    id: number;
    title: string;
    company_id: number;
  };
}

/**
 * Pagination meta
 */
interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

/**
 * Release escrow data
 */
export interface ReleaseEscrowData {
  override?: boolean;
  recipient_account: {
    account_number: string;
    bank_code: string;
    name: string;
  };
}

/**
 * Resolve dispute data
 */
export interface ResolveDisputeData {
  resolution: string;
  status: 'resolved' | 'escalated';
}

export const adminService = {
  /**
   * List companies (with filters)
   */
  async listCompanies(params?: {
    status?: 'pending' | 'approved' | 'rejected' | 'suspended';
    verified?: boolean;
    per_page?: number;
  }): Promise<{ companies: AdminCompany[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiResponse<AdminCompany[]>>('/admin/companies', {
      params,
    });
    return {
      companies: extractData<AdminCompany[]>(response),
      meta: extractMeta(response) as PaginationMeta,
    };
  },

  /**
   * Get company details
   */
  async getCompany(id: number): Promise<AdminCompany> {
    const response = await apiClient.get<ApiResponse<AdminCompany>>(`/admin/companies/${id}`);
    return extractData<AdminCompany>(response);
  },

  /**
   * Approve company
   */
  async approveCompany(id: number): Promise<AdminCompany> {
    const response = await apiClient.post<ApiResponse<AdminCompany>>(`/admin/companies/${id}/approve`);
    return extractData<AdminCompany>(response);
  },

  /**
   * Reject company
   */
  async rejectCompany(id: number, reason: string): Promise<AdminCompany> {
    const response = await apiClient.post<ApiResponse<AdminCompany>>(`/admin/companies/${id}/reject`, {
      reason,
    });
    return extractData<AdminCompany>(response);
  },

  /**
   * Suspend company
   */
  async suspendCompany(id: number, reason: string): Promise<AdminCompany> {
    const response = await apiClient.post<ApiResponse<AdminCompany>>(`/admin/companies/${id}/suspend`, {
      reason,
    });
    return extractData<AdminCompany>(response);
  },

  /**
   * List disputes
   */
  async listDisputes(params?: {
    status?: 'open' | 'resolved' | 'escalated';
    project_id?: number;
    per_page?: number;
  }): Promise<{ disputes: Dispute[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiResponse<Dispute[]>>('/admin/disputes', {
      params,
    });
    return {
      disputes: extractData<Dispute[]>(response),
      meta: extractMeta(response) as PaginationMeta,
    };
  },

  /**
   * Get dispute details
   */
  async getDispute(id: number): Promise<Dispute> {
    const response = await apiClient.get<ApiResponse<Dispute>>(`/admin/disputes/${id}`);
    return extractData<Dispute>(response);
  },

  /**
   * Resolve dispute
   */
  async resolveDispute(id: number, data: ResolveDisputeData): Promise<Dispute> {
    const response = await apiClient.post<ApiResponse<Dispute>>(`/admin/disputes/${id}/resolve`, data);
    return extractData<Dispute>(response);
  },

  /**
   * Release escrow funds
   */
  async releaseEscrow(id: number, data: ReleaseEscrowData): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/milestones/${id}/release`, data);
    return extractData(response);
  },
};

