import apiClient, { extractData, ApiResponse } from '../lib/api-client';

/**
 * Company Profile interface
 */
export interface CompanyProfile {
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
 * Create Company Profile data
 */
export interface CreateCompanyProfileData {
  company_name: string;
  registration_number: string;
  license_documents?: File[];
  portfolio_links?: string[];
  specialization?: string[];
}

/**
 * Update Company Profile data
 */
export interface UpdateCompanyProfileData {
  company_name?: string;
  registration_number?: string;
  license_documents?: File[];
  portfolio_links?: string[];
  specialization?: string[];
}

/**
 * Company Profile Service
 * Handles company profile API calls
 */
export const companyProfileService = {
  /**
   * Get company profile
   */
  async get(): Promise<CompanyProfile | null> {
    try {
      const response = await apiClient.get<ApiResponse<CompanyProfile>>('/company/profile');
      return extractData<CompanyProfile>(response);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // Profile doesn't exist yet
      }
      throw error;
    }
  },

  /**
   * Create company profile
   */
  async create(data: CreateCompanyProfileData): Promise<CompanyProfile> {
    const formData = new FormData();
    formData.append('company_name', data.company_name);
    formData.append('registration_number', data.registration_number);
    
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
    
    if (data.license_documents && data.license_documents.length > 0) {
      data.license_documents.forEach((file) => {
        formData.append('license_documents[]', file);
      });
    }

    // Don't set Content-Type header - let axios set it automatically with boundary for FormData
    const response = await apiClient.post<ApiResponse<CompanyProfile>>('/company/profile', formData);
    return extractData<CompanyProfile>(response);
  },

  /**
   * Update company profile
   */
  async update(data: UpdateCompanyProfileData): Promise<CompanyProfile> {
    const formData = new FormData();
    
    if (data.company_name) {
      formData.append('company_name', data.company_name);
    }
    if (data.registration_number) {
      formData.append('registration_number', data.registration_number);
    }
    
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
    
    if (data.license_documents && data.license_documents.length > 0) {
      data.license_documents.forEach((file) => {
        formData.append('license_documents[]', file);
      });
    }

    // Don't set Content-Type header - let axios set it automatically with boundary for FormData
    const response = await apiClient.put<ApiResponse<CompanyProfile>>('/company/profile', formData);
    return extractData<CompanyProfile>(response);
  },
};

