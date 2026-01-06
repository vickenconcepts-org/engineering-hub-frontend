import apiClient, { extractData, extractMeta, ApiResponse } from '../lib/api-client';
import { Company, PaginationMeta } from './consultation.service';

/**
 * Company Service
 * Handles company-related API calls for clients
 */
export const companyService = {
  /**
   * List verified companies (for clients to browse)
   */
  async listVerified(params?: { 
    per_page?: number;
    specialization?: string;
    search?: string;
  }): Promise<{ companies: Company[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiResponse<Company[]>>('/client/companies', {
      params,
    });
    
    const companies = extractData<Company[]>(response);
    const meta = extractMeta(response) as PaginationMeta;
    
    return {
      companies,
      meta,
    };
  },

  /**
   * Get a specific verified company by ID
   */
  async get(id: number): Promise<Company> {
    const response = await apiClient.get<ApiResponse<Company>>(`/client/companies/${id}`);
    return extractData<Company>(response);
  },
};

