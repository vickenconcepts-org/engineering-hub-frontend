import apiClient, { extractData, ApiResponse } from '../lib/api-client';
import { Milestone } from './project.service';

/**
 * Payment initialization response for milestone escrow
 */
export interface MilestonePaymentInitResponse {
  payment_url: string;
  reference: string;
  milestone: Milestone;
}

/**
 * Reject milestone request data
 */
export interface RejectMilestoneData {
  reason: string;
}

/**
 * Milestone Service
 * Handles all milestone-related API calls for clients
 * Focuses on escrow funding and approval/rejection
 */
export const milestoneService = {
  /**
   * Fund milestone escrow (deposit payment)
   * Returns payment URL to redirect user to payment gateway
   */
  async fundEscrow(id: number): Promise<MilestonePaymentInitResponse> {
    const response = await apiClient.post<ApiResponse<MilestonePaymentInitResponse>>(
      `/client/milestones/${id}/fund`
    );
    return extractData<MilestonePaymentInitResponse>(response);
  },

  /**
   * Approve a milestone
   * Client approves milestone completion, allowing admin to release escrow
   */
  async approve(id: number): Promise<Milestone> {
    const response = await apiClient.post<ApiResponse<Milestone>>(
      `/client/milestones/${id}/approve`
    );
    return extractData<Milestone>(response);
  },

  /**
   * Reject a milestone
   * Client rejects milestone, creating a dispute automatically
   */
  async reject(id: number, data: RejectMilestoneData): Promise<Milestone> {
    const response = await apiClient.post<ApiResponse<Milestone>>(
      `/client/milestones/${id}/reject`,
      data
    );
    return extractData<Milestone>(response);
  },
};

