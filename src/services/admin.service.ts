import apiClient, { extractData, extractMeta, ApiResponse } from '../lib/api-client';
import { Company } from './consultation.service';

/**
 * Admin Service
 * Handles all admin-related API calls
 */

/**
 * Company interface for admin
 */
export interface AdminCompany extends Company {
  user?: {
    id: string; // UUID
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
  id: string; // UUID
  project_id: string; // UUID
  milestone_id?: string; // UUID
  type: 'revision_request' | 'dispute';
  raised_by: string; // UUID
  reason: string;
  status: 'open' | 'resolved' | 'escalated';
  resolution_notes?: string;
  project?: {
    id: string; // UUID
    title: string;
    client_id: string; // UUID
    company_id: string; // UUID
  };
  milestone?: {
    id: string; // UUID
    title: string;
    amount: number;
  };
  raised_by_user?: {
    id: string; // UUID
    name: string;
    email: string;
  };
  raised_by?: {
    id: string; // UUID
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
  id: string; // UUID
  project_id: string; // UUID
  title: string;
  amount: number;
  status: string;
  escrow?: {
    id: string; // UUID
    amount: number;
    status: string;
    payment_reference: string;
  };
  project?: {
    id: string; // UUID
    title: string;
    company_id: string; // UUID
    company?: {
      id: string; // UUID
      user_id: string; // UUID
      user?: {
        id: string; // UUID
        name: string;
        email: string;
      };
    };
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

/**
 * User interface for admin
 */
export interface AdminUser {
  id: string; // UUID
  name: string;
  email: string;
  phone?: string;
  role: 'client' | 'company' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
  company?: AdminCompany;
}

/**
 * Update user data
 */
export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  role?: 'client' | 'company' | 'admin';
}

/**
 * Suspend user data
 */
export interface SuspendUserData {
  reason?: string;
}

/**
 * Create user data
 */
export interface CreateUserData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: 'client' | 'company';
  status?: 'active' | 'suspended' | 'pending';
}

/**
 * Create company data
 */
export interface CreateCompanyData {
  // User data
  name: string;
  email: string;
  phone?: string;
  password: string;
  user_status?: 'active' | 'suspended' | 'pending';
  
  // Company data
  company_name: string;
  registration_number: string;
  license_documents?: File[];
  portfolio_links?: string[];
  specialization?: string[];
  consultation_fee?: number;
  company_status?: 'pending' | 'approved' | 'rejected' | 'suspended';
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
  async getCompany(id: string): Promise<AdminCompany> {
    const response = await apiClient.get<ApiResponse<AdminCompany>>(`/admin/companies/${id}`);
    return extractData<AdminCompany>(response);
  },

  /**
   * Approve company
   */
  async approveCompany(id: string): Promise<AdminCompany> {
    const response = await apiClient.post<ApiResponse<AdminCompany>>(`/admin/companies/${id}/approve`);
    return extractData<AdminCompany>(response);
  },

  /**
   * Reject company
   */
  async rejectCompany(id: string, reason: string): Promise<AdminCompany> {
    const response = await apiClient.post<ApiResponse<AdminCompany>>(`/admin/companies/${id}/reject`, {
      reason,
    });
    return extractData<AdminCompany>(response);
  },

  /**
   * Suspend company
   */
  async suspendCompany(id: string, reason: string): Promise<AdminCompany> {
    const response = await apiClient.post<ApiResponse<AdminCompany>>(`/admin/companies/${id}/suspend`, {
      reason,
    });
    return extractData<AdminCompany>(response);
  },

  /**
   * Lift suspension and re-approve company
   */
  async liftSuspension(id: string): Promise<AdminCompany> {
    const response = await apiClient.post<ApiResponse<AdminCompany>>(`/admin/companies/${id}/lift-suspension`);
    return extractData<AdminCompany>(response);
  },

  /**
   * Get appeals for a company
   */
  async getCompanyAppeals(id: string): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>(`/admin/companies/${id}/appeals`);
    return extractData<any[]>(response);
  },

  /**
   * List disputes
   */
  async listDisputes(params?: {
    status?: 'open' | 'resolved' | 'escalated';
    project_id?: string; // UUID
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
  async getDispute(id: string): Promise<Dispute> {
    const response = await apiClient.get<ApiResponse<Dispute>>(`/admin/disputes/${id}`);
    return extractData<Dispute>(response);
  },

  /**
   * Resolve dispute
   */
  async resolveDispute(id: string, data: ResolveDisputeData): Promise<Dispute> {
    const response = await apiClient.post<ApiResponse<Dispute>>(`/admin/disputes/${id}/resolve`, data);
    return extractData<Dispute>(response);
  },

  /**
   * List milestones with escrow funds
   */
  async listEscrowMilestones(params?: {
    per_page?: number;
    page?: number;
    status?: 'held' | 'released' | 'all';
  }): Promise<{ milestones: MilestoneForRelease[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiResponse<any>>('/admin/milestones', { params });
    
    // extractData gets the 'data' field from response, which contains the array of milestones
    const milestonesData = extractData<any>(response);
    const meta = extractMeta(response) as PaginationMeta;
    
    // Handle different response structures
    let milestones: MilestoneForRelease[] = [];
    
    if (Array.isArray(milestonesData)) {
      milestones = milestonesData;
    } else if (milestonesData && typeof milestonesData === 'object' && 'data' in milestonesData) {
      milestones = Array.isArray(milestonesData.data) ? milestonesData.data : [];
    }
    
    return {
      milestones,
      meta: meta || {
        current_page: 1,
        per_page: params?.per_page || 15,
        total: 0,
        last_page: 1,
        from: 0,
        to: 0,
      },
    };
  },

  /**
   * Get platform fee percentage
   */
  async getPlatformFee(): Promise<{ percentage: number; description?: string }> {
    const response = await apiClient.get<ApiResponse<{ percentage: number; description?: string }>>('/admin/platform-settings/fee');
    return extractData(response);
  },

  /**
   * Update platform fee percentage
   */
  async updatePlatformFee(percentage: number): Promise<{ percentage: number; description?: string }> {
    const response = await apiClient.put<ApiResponse<{ percentage: number; description?: string }>>('/admin/platform-settings/fee', {
      percentage,
    });
    return extractData(response);
  },

  /**
   * Release escrow funds
   */
  async releaseEscrow(id: string, data: ReleaseEscrowData): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/milestones/${id}/release`, data);
    return extractData(response);
  },

  /**
   * List users (with filters)
   */
  async listUsers(params?: {
    role?: 'client' | 'company' | 'admin' | 'all';
    status?: 'active' | 'suspended' | 'pending' | 'all';
    search?: string;
    per_page?: number;
    page?: number;
  }): Promise<{ users: AdminUser[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiResponse<AdminUser[]>>('/admin/users', {
      params,
    });
    return {
      users: extractData<AdminUser[]>(response),
      meta: extractMeta(response) as PaginationMeta,
    };
  },

  /**
   * Get user details
   */
  async getUser(id: string): Promise<AdminUser> {
    const response = await apiClient.get<ApiResponse<AdminUser>>(`/admin/users/${id}`);
    return extractData<AdminUser>(response);
  },

  /**
   * Update user
   */
  async updateUser(id: string, data: UpdateUserData): Promise<AdminUser> {
    const response = await apiClient.put<ApiResponse<AdminUser>>(`/admin/users/${id}`, data);
    return extractData<AdminUser>(response);
  },

  /**
   * Activate user
   */
  async activateUser(id: string): Promise<AdminUser> {
    const response = await apiClient.post<ApiResponse<AdminUser>>(`/admin/users/${id}/activate`);
    return extractData<AdminUser>(response);
  },

  /**
   * Suspend user
   */
  async suspendUser(id: string, data?: SuspendUserData): Promise<AdminUser> {
    const response = await apiClient.post<ApiResponse<AdminUser>>(`/admin/users/${id}/suspend`, data || {});
    return extractData<AdminUser>(response);
  },

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/admin/users/${id}`);
  },

  /**
   * Create user
   */
  async createUser(data: CreateUserData): Promise<AdminUser> {
    const response = await apiClient.post<ApiResponse<AdminUser>>('/admin/users', data);
    return extractData<AdminUser>(response);
  },

  /**
   * Create company
   */
  async createCompany(data: CreateCompanyData): Promise<AdminCompany> {
    const formData = new FormData();
    
    // Add user data
    formData.append('name', data.name);
    formData.append('email', data.email);
    if (data.phone) formData.append('phone', data.phone);
    formData.append('password', data.password);
    if (data.user_status) formData.append('user_status', data.user_status);
    
    // Add company data
    formData.append('company_name', data.company_name);
    formData.append('registration_number', data.registration_number);
    if (data.consultation_fee !== undefined) formData.append('consultation_fee', data.consultation_fee.toString());
    if (data.company_status) formData.append('company_status', data.company_status);
    
    // Add arrays
    if (data.portfolio_links && data.portfolio_links.length > 0) {
      data.portfolio_links.forEach((link, index) => {
        formData.append(`portfolio_links[${index}]`, link);
      });
    }
    
    if (data.specialization && data.specialization.length > 0) {
      data.specialization.forEach((spec, index) => {
        formData.append(`specialization[${index}]`, spec);
      });
    }
    
    // Add files
    if (data.license_documents && data.license_documents.length > 0) {
      data.license_documents.forEach((file) => {
        formData.append('license_documents[]', file);
      });
    }
    
    const response = await apiClient.post<ApiResponse<AdminCompany>>('/admin/companies', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return extractData<AdminCompany>(response);
  },
};

