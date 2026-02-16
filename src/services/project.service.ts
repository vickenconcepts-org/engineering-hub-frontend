import apiClient, { extractData, extractMeta, ApiResponse } from '../lib/api-client';
import { Company, PaginationMeta } from './consultation.service';

/**
 * Milestone interface
 */
export interface Milestone {
  id: string; // UUID
  project_id: string; // UUID
  title: string;
  description?: string;
  amount: number;
  sequence_order: number;
  status: 'pending' | 'funded' | 'submitted' | 'approved' | 'rejected' | 'released';
  verified_at?: string; // ISO date string
  verified_by?: string; // UUID of user who verified
  client_notes?: string; // Notes from client
  company_notes?: string; // Notes from company
  verifier?: {
    id: string;
    name: string;
    email: string;
  };
  escrow?: {
    id: string; // UUID
    milestone_id: string; // UUID
    amount: number;
    platform_fee?: number;
    net_amount?: number;
    platform_fee_percentage?: number;
    status: 'held' | 'released' | 'refunded';
    created_at: string;
    released_at?: string;
  };
  evidence?: Array<{
    id: string; // UUID
    milestone_id: string; // UUID
    type: 'image' | 'video' | 'text';
    file_path?: string; // Legacy - kept for backward compatibility
    url?: string; // Cloudinary URL
    thumbnail_url?: string; // For videos
    description?: string;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

/**
 * Project interface matching backend Project model
 */
export interface Project {
  id: string; // UUID
  client_id: string; // UUID
  company_id: string; // UUID
  title: string;
  description?: string;
  location: string;
  location_country?: string;
  location_state?: string;
  location_address?: string;
  preview_image_url?: string;
  drawing_architectural_url?: string;
  drawing_structural_url?: string;
  drawing_mechanical_url?: string;
  drawing_technical_url?: string;
  budget_min?: number;
  budget_max?: number;
  status: 'draft' | 'active' | 'completed' | 'disputed' | 'cancelled';
  company?: Company;
  client?: {
    id: string; // UUID
    name: string;
    email: string;
  };
  milestones?: Milestone[];
  disputes?: Array<{
    id: string; // UUID
    milestone_id?: string; // UUID
    raised_by: string; // UUID
    reason: string;
    status: 'open' | 'resolved' | 'escalated';
    created_at: string;
  }>;
  documents?: Array<{
    id: string;
    title: string;
    file_url: string;
    uploaded_by?: string;
    created_at?: string;
  }>;
  created_at: string;
  updated_at: string;
}

/**
 * Create project request data
 */
export interface CreateProjectData {
  consultation_id: string; // UUID
  title: string;
  description?: string;
  location: string;
  location_country?: string;
  location_state?: string;
  location_address?: string;
  budget_min?: number;
  budget_max?: number;
}

export interface UploadProjectDocumentsData {
  preview_image?: File;
  drawing_architectural?: File;
  drawing_structural?: File;
  drawing_mechanical?: File;
  drawing_technical?: File;
  extra_documents?: Array<{
    title: string;
    file: File;
  }>;
}

/**
 * Project Service
 * Handles all project-related API calls for clients and companies
 */
export const projectService = {
  /**
   * List client's projects with pagination
   */
  async list(params?: { per_page?: number }): Promise<{ projects: Project[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiResponse<Project[]>>('/client/projects', {
      params,
    });
    
    const projects = extractData<Project[]>(response);
    const meta = extractMeta(response) as PaginationMeta;
    
    return {
      projects,
      meta,
    };
  },

  /**
   * List company's projects with pagination
   */
  async listForCompany(params?: { per_page?: number }): Promise<{ projects: Project[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiResponse<Project[]>>('/company/projects', {
      params,
    });
    
    const projects = extractData<Project[]>(response);
    const meta = extractMeta(response) as PaginationMeta;
    
    return {
      projects,
      meta,
    };
  },

  /**
   * Get a specific project by ID (client)
   */
  async get(id: string): Promise<Project> {
    const response = await apiClient.get<ApiResponse<Project>>(`/client/projects/${id}`);
    return extractData<Project>(response);
  },

  /**
   * Get a specific project by ID (company)
   */
  async getForCompany(id: string): Promise<Project> {
    const response = await apiClient.get<ApiResponse<Project>>(`/company/projects/${id}`);
    return extractData<Project>(response);
  },

  /**
   * Get a specific project by ID (admin or shared endpoint)
   * Uses the shared /api/projects/{id} endpoint which allows admins
   */
  async getShared(id: string): Promise<Project> {
    const response = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`);
    return extractData<Project>(response);
  },

  /**
   * Create a new project from a completed consultation (client only)
   */
  async create(data: CreateProjectData): Promise<Project> {
    const response = await apiClient.post<ApiResponse<Project>>('/client/projects', data);
    return extractData<Project>(response);
  },

  /**
   * Create milestones for a project (company only)
   */
  async createMilestones(projectId: string, milestones: Array<{
    title: string;
    description?: string;
    amount: number;
    sequence_order: number;
  }>): Promise<Project> {
    const response = await apiClient.post<ApiResponse<Project>>(
      `/company/projects/${projectId}/milestones`,
      { milestones }
    );
    return extractData<Project>(response);
  },

  /**
   * Mark project as completed (client)
   */
  async complete(projectId: string): Promise<Project> {
    const response = await apiClient.post<ApiResponse<Project>>(
      `/client/projects/${projectId}/complete`
    );
    return extractData<Project>(response);
  },

  /**
   * Mark project as completed (company)
   */
  async completeForCompany(projectId: string): Promise<Project> {
    const response = await apiClient.post<ApiResponse<Project>>(
      `/company/projects/${projectId}/complete`
    );
    return extractData<Project>(response);
  },

  /**
   * Upload project documents (company only)
   */
  async uploadDocuments(projectId: string, data: UploadProjectDocumentsData): Promise<Project> {
    const formData = new FormData();

    if (data.preview_image) {
      formData.append('preview_image', data.preview_image);
    }
    if (data.drawing_architectural) {
      formData.append('drawing_architectural', data.drawing_architectural);
    }
    if (data.drawing_structural) {
      formData.append('drawing_structural', data.drawing_structural);
    }
    if (data.drawing_mechanical) {
      formData.append('drawing_mechanical', data.drawing_mechanical);
    }
    if (data.drawing_technical) {
      formData.append('drawing_technical', data.drawing_technical);
    }

    if (data.extra_documents && data.extra_documents.length > 0) {
      data.extra_documents.forEach((doc, index) => {
        formData.append(`extra_titles[${index}]`, doc.title);
        formData.append(`extra_files[${index}]`, doc.file);
      });
    }

    const response = await apiClient.post<ApiResponse<Project>>(
      `/company/projects/${projectId}/documents`,
      formData
    );
    return extractData<Project>(response);
  },
};

