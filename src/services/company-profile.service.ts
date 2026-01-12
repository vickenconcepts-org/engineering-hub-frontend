import apiClient, { extractData, ApiResponse } from '../lib/api-client';

/**
 * Company Profile interface
 */
export interface CompanyProfile {
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
  suspension_reason?: string;
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
  consultation_fee?: number;
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
    
    console.log('Company Profile Service - Update data received:', data);
    
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
    
    // Always send consultation_fee if it's defined (including 0)
    // Check explicitly for undefined/null, not falsy (0 is falsy but valid)
    console.log('Consultation fee check:', {
      consultation_fee: data.consultation_fee,
      type: typeof data.consultation_fee,
      isUndefined: data.consultation_fee === undefined,
      isNull: data.consultation_fee === null,
    });
    
    if (data.consultation_fee !== undefined && data.consultation_fee !== null) {
      formData.append('consultation_fee', data.consultation_fee.toString());
      console.log('Added consultation_fee to FormData:', data.consultation_fee.toString());
    } else {
      console.log('NOT adding consultation_fee - undefined or null');
    }
    
    // Debug: Log all FormData entries
    console.log('FormData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }

    // Use POST endpoint for FormData updates (PUT doesn't work well with FormData in Laravel)
    // Don't set Content-Type header - let axios set it automatically with boundary for FormData
    const response = await apiClient.post<ApiResponse<CompanyProfile>>('/company/profile/update', formData);
    return extractData<CompanyProfile>(response);
  },

  /**
   * Appeal suspension / Re-request approval
   * Sends appeal message to admin - does NOT auto-change status
   */
  async appealSuspension(message?: string): Promise<CompanyProfile> {
    const response = await apiClient.post<ApiResponse<CompanyProfile>>('/company/profile/appeal', {
      message: message || 'I would like to appeal my suspension and request a review of my account.',
    });
    return extractData<CompanyProfile>(response);
  },
};

