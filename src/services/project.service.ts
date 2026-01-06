import apiClient, { extractData, extractMeta, ApiResponse } from '../lib/api-client';
import { Company, PaginationMeta } from './consultation.service';

/**
 * Milestone interface
 */
export interface Milestone {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  amount: number;
  sequence_order: number;
  status: 'pending' | 'funded' | 'submitted' | 'approved' | 'rejected' | 'released';
  escrow?: {
    id: number;
    milestone_id: number;
    amount: number;
    status: 'held' | 'released' | 'refunded';
    created_at: string;
    released_at?: string;
  };
  evidence?: Array<{
    id: number;
    milestone_id: number;
    type: 'image' | 'video' | 'text';
    file_path?: string;
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
  id: number;
  client_id: number;
  company_id: number;
  title: string;
  description?: string;
  location: string;
  budget_min?: number;
  budget_max?: number;
  status: 'draft' | 'active' | 'completed' | 'disputed' | 'cancelled';
  company?: Company;
  milestones?: Milestone[];
  disputes?: Array<{
    id: number;
    milestone_id?: number;
    raised_by: number;
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
  consultation_id: number;
  title: string;
  description?: string;
  location: string;
  budget_min?: number;
  budget_max?: number;
}

/**
 * Project Service
 * Handles all project-related API calls for clients
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
   * Get a specific project by ID
   */
  async get(id: number): Promise<Project> {
    const response = await apiClient.get<ApiResponse<Project>>(`/client/projects/${id}`);
    return extractData<Project>(response);
  },

  /**
   * Create a new project from a completed consultation
   */
  async create(data: CreateProjectData): Promise<Project> {
    const response = await apiClient.post<ApiResponse<Project>>('/client/projects', data);
    return extractData<Project>(response);
  },
};

