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
  budget_min?: number;
  budget_max?: number;
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
};

