import apiClient, { extractData, extractMeta, ApiResponse } from '../lib/api-client';

/**
 * Company interface (nested in consultation)
 */
export interface Company {
  id: string; // UUID
  user_id: string; // UUID
  company_name: string;
  registration_number: string;
  license_documents?: string[];
  portfolio_links?: string[];
  specialization?: string[];
  consultation_fee?: number;
  verified_at?: string;
  status: string;
  is_verified: boolean;
  is_approved: boolean;
  user?: {
    id: string; // UUID
    name: string;
    email: string;
  };
  created_at?: string;
  updated_at?: string;
}

/**
 * Consultation interface matching backend Consultation model
 */
export interface Consultation {
  id: string; // UUID
  client_id: string; // UUID
  company_id: string; // UUID
  scheduled_at: string;
  duration_minutes: number;
  price: number;
  payment_status: 'pending' | 'paid' | 'refunded';
  meeting_link?: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  is_paid: boolean;
  is_completed: boolean;
  company?: Company;
  client?: {
    id: string; // UUID
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Pagination metadata
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
 * Create consultation request data
 */
export interface CreateConsultationData {
  company_id: string; // UUID
  scheduled_at: string; // ISO datetime string
  duration_minutes?: number; // Optional, defaults to 30
  price: number;
}

/**
 * Payment initialization response
 */
export interface PaymentInitResponse {
  payment_url: string;
  reference: string;
  consultation: Consultation;
}

/**
 * Consultation Service
 * Handles all consultation-related API calls for clients and companies
 */
export const consultationService = {
  /**
   * List client's consultations with pagination
   */
  async list(params?: { per_page?: number }): Promise<{ consultations: Consultation[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiResponse<Consultation[]>>('/client/consultations', {
      params,
    });
    
    const consultations = extractData<Consultation[]>(response);
    const meta = extractMeta(response) as PaginationMeta;
    
    return {
      consultations,
      meta,
    };
  },

  /**
   * List company's consultations with pagination
   */
  async listForCompany(params?: { per_page?: number }): Promise<{ consultations: Consultation[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiResponse<Consultation[]>>('/company/consultations', {
      params,
    });
    
    const consultations = extractData<Consultation[]>(response);
    const meta = extractMeta(response) as PaginationMeta;
    
    return {
      consultations,
      meta,
    };
  },

  /**
   * Get a specific consultation by ID (client)
   */
  async get(id: string): Promise<Consultation> {
    const response = await apiClient.get<ApiResponse<Consultation>>(`/client/consultations/${id}`);
    return extractData<Consultation>(response);
  },

  /**
   * Get a specific consultation by ID (company)
   */
  async getForCompany(id: string): Promise<Consultation> {
    const response = await apiClient.get<ApiResponse<Consultation>>(`/company/consultations/${id}`);
    return extractData<Consultation>(response);
  },

  /**
   * Create a new consultation booking (client only)
   */
  async create(data: CreateConsultationData): Promise<Consultation> {
    const response = await apiClient.post<ApiResponse<Consultation>>('/client/consultations', data);
    return extractData<Consultation>(response);
  },

  /**
   * Initialize payment for a consultation (client only)
   * Returns payment URL to redirect user to payment gateway
   */
  async pay(id: string): Promise<PaymentInitResponse> {
    const response = await apiClient.post<ApiResponse<PaymentInitResponse>>(
      `/client/consultations/${id}/pay`
    );
    return extractData<PaymentInitResponse>(response);
  },

  /**
   * Mark consultation as completed (company only)
   */
  async complete(id: string): Promise<Consultation> {
    const response = await apiClient.post<ApiResponse<Consultation>>(
      `/company/consultations/${id}/complete`
    );
    return extractData<Consultation>(response);
  },
};

