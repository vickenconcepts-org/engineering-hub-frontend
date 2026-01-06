import apiClient, { extractData, extractMeta, ApiResponse } from '../lib/api-client';

/**
 * Company interface (nested in consultation)
 */
export interface Company {
  id: number;
  user_id: number;
  company_name: string;
  registration_number: string;
  license_documents?: string[];
  portfolio_links?: string[];
  specialization?: string[];
  verified_at?: string;
  status: string;
  is_verified: boolean;
  is_approved: boolean;
  user?: {
    id: number;
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
  id: number;
  client_id: number;
  company_id: number;
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
    id: number;
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
  company_id: number;
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
 * Handles all consultation-related API calls for clients
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
   * Get a specific consultation by ID
   */
  async get(id: number): Promise<Consultation> {
    const response = await apiClient.get<ApiResponse<Consultation>>(`/client/consultations/${id}`);
    return extractData<Consultation>(response);
  },

  /**
   * Create a new consultation booking
   */
  async create(data: CreateConsultationData): Promise<Consultation> {
    const response = await apiClient.post<ApiResponse<Consultation>>('/client/consultations', data);
    return extractData<Consultation>(response);
  },

  /**
   * Initialize payment for a consultation
   * Returns payment URL to redirect user to payment gateway
   */
  async pay(id: number): Promise<PaymentInitResponse> {
    const response = await apiClient.post<ApiResponse<PaymentInitResponse>>(
      `/client/consultations/${id}/pay`
    );
    return extractData<PaymentInitResponse>(response);
  },
};

