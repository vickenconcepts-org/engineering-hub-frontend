import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Image as ImageIcon, Video, CheckCircle, X, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Textarea } from '../components/Textarea';
import { projectService, Project, Milestone } from '../services/project.service';
import { milestoneService } from '../services/milestone.service';
import { adminService } from '../services/admin.service';
import { paymentAccountService, PaymentAccount } from '../services/payment-account.service';
import { getFileUrl } from '../lib/file-utils';
import apiClient from '../lib/api-client';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { formatAmountWithCurrency, parseFormattedAmount } from '../lib/money-utils';

interface MilestoneDetailPageProps {
  onNavigate: (path: string) => void;
  userRole?: 'client' | 'company' | 'admin' | null;
}

export function MilestoneDetailPage({ onNavigate, userRole }: MilestoneDetailPageProps) {
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [uploadEvidenceModalOpen, setUploadEvidenceModalOpen] = useState(false);
  const [releaseEscrowModalOpen, setReleaseEscrowModalOpen] = useState(false);
  const [refundEscrowModalOpen, setRefundEscrowModalOpen] = useState(false);
  const [companyReleaseModalOpen, setCompanyReleaseModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [evidenceType, setEvidenceType] = useState<'image' | 'video' | 'text'>('image');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [adminOverride, setAdminOverride] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [companyAccounts, setCompanyAccounts] = useState<PaymentAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedCompanyAccountId, setSelectedCompanyAccountId] = useState<string>('');
  const [isLoadingCompanyAccounts, setIsLoadingCompanyAccounts] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [milestoneNotes, setMilestoneNotes] = useState('');
  
  // Extract milestone ID and project ID from URL
  const milestoneId = window.location.pathname.split('/milestones/')[1]?.split('#')[0] || '';
  const urlParams = new URLSearchParams(window.location.search);
  const projectIdFromUrl = urlParams.get('project_id') || urlParams.get('project');
  
  useEffect(() => {
    if (milestoneId) {
      loadMilestone();
    }
  }, [milestoneId, userRole, projectIdFromUrl]);

  useEffect(() => {
    if (companyReleaseModalOpen || refundEscrowModalOpen) {
      loadPaymentAccounts();
    }
  }, [companyReleaseModalOpen, refundEscrowModalOpen]);

  useEffect(() => {
    if (releaseEscrowModalOpen && userRole === 'admin' && project) {
      loadCompanyAccounts();
    }
  }, [releaseEscrowModalOpen, project, userRole]);

  const loadPaymentAccounts = async () => {
    try {
      const accounts = await paymentAccountService.list();
      setPaymentAccounts(accounts);
      const defaultAccount = accounts.find(acc => acc.is_default);
      if (defaultAccount) {
        setSelectedAccountId(defaultAccount.id);
      } else if (accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
      }
    } catch (error) {
      console.error('Failed to load payment accounts:', error);
    }
  };

  const loadCompanyAccounts = async () => {
    if (!project) {
      return;
    }

    // Try to get company user_id from project
    // Check if project has company.user_id or company.user.id
    const companyUserId = (project as any)?.company?.user_id || (project as any)?.company?.user?.id;
    if (!companyUserId) {
      toast.error('Company user information not available. Please refresh the page.');
      return;
    }

    try {
      setIsLoadingCompanyAccounts(true);
      const accounts = await paymentAccountService.getUserAccounts(companyUserId);
      setCompanyAccounts(accounts);
      const defaultAccount = accounts.find(acc => acc.is_default);
      if (defaultAccount) {
        setSelectedCompanyAccountId(defaultAccount.id);
      } else if (accounts.length > 0) {
        setSelectedCompanyAccountId(accounts[0].id);
      }
    } catch (error: any) {
      console.error('Failed to load company accounts:', error);
      toast.error('Failed to load company payment accounts');
    } finally {
      setIsLoadingCompanyAccounts(false);
    }
  };
  
  const loadMilestone = async () => {
    try {
      setIsLoading(true);
      // Get all projects to find the one containing this milestone
      // Note: In production, consider adding GET /api/milestones/{id} endpoint
      // Use role-specific endpoints
      let projects: Project[];
      if (userRole === 'admin') {
        // Admin needs to fetch project directly using shared endpoint
        // Try to get project_id from URL params first
        if (projectIdFromUrl) {
          const project = await projectService.getShared(projectIdFromUrl);
          projects = [project];
        } else {
          // If no project_id in URL, fetch from admin milestones list to get project_id
          // Admin milestones endpoint includes project relationship
          const milestonesResult = await adminService.listEscrowMilestones({ 
            per_page: 100, 
            status: 'all' 
          });
          const milestoneWithProject = milestonesResult.milestones.find(m => m.id === milestoneId);
          
          if (milestoneWithProject && milestoneWithProject.project_id) {
            // Found milestone with project_id, fetch the project
            const project = await projectService.getShared(milestoneWithProject.project_id);
            projects = [project];
          } else {
            toast.error('Milestone not found or project ID unavailable');
            return;
          }
        }
      } else if (userRole === 'company') {
        const result = await projectService.listForCompany({ per_page: 100 });
        projects = result.projects;
      } else {
        const result = await projectService.list({ per_page: 100 });
        projects = result.projects;
      }
      
      // Find project containing this milestone
      let foundProject: Project | null = null;
      let foundMilestone: Milestone | null = null;
      
      for (const proj of projects) {
        const milestone = proj.milestones?.find(m => m.id === milestoneId);
        if (milestone) {
          foundProject = proj;
          foundMilestone = milestone;
          break;
        }
      }
      
      // If not found, try fetching project directly using shared endpoint
      // This requires knowing project_id, which we don't have
      // For MVP, we'll show error if not found in user's projects
      if (!foundMilestone) {
        toast.error('Milestone not found in your projects');
        return;
      }
      
      // If milestone doesn't have evidence loaded, fetch project with full details
      if (!foundMilestone.evidence || foundMilestone.evidence.length === 0) {
        let fullProject: Project;
        // Use role-specific endpoints
        if (userRole === 'admin') {
          // Admin uses shared endpoint which allows viewing any project
          fullProject = await projectService.getShared(foundProject.id);
        } else if (userRole === 'company') {
          fullProject = await projectService.getForCompany(foundProject.id);
        } else {
          fullProject = await projectService.get(foundProject.id);
        }
        const fullMilestone = fullProject.milestones?.find(m => m.id === milestoneId);
        if (fullMilestone) {
          foundMilestone = fullMilestone;
          foundProject = fullProject;
        }
      }
      
      setProject(foundProject);
      setMilestone(foundMilestone);
    } catch (error) {
      console.error('Failed to load milestone:', error);
      toast.error('Failed to load milestone details');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApprove = async () => {
    if (!milestone) return;
    
    setIsProcessing(true);
    try {
      await milestoneService.approve(milestone.id);
      toast.success('Milestone approved successfully! Funds will be released by admin.');
      setApproveModalOpen(false);
      // Reload milestone to get updated status
      await loadMilestone();
      onNavigate(`/projects/${project?.id}`);
    } catch (error) {
      console.error('Approval error:', error);
      // Error already handled by API client interceptor
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleReject = async () => {
    if (!milestone || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setIsProcessing(true);
    try {
      await milestoneService.reject(milestone.id, { reason: rejectionReason });
      toast.success('Milestone rejected. A dispute has been created for review.');
      setRejectModalOpen(false);
      setRejectionReason('');
      // Reload milestone to get updated status
      await loadMilestone();
      onNavigate(`/projects/${project?.id}`);
    } catch (error) {
      console.error('Rejection error:', error);
      // Error already handled by API client interceptor
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDispute = async () => {
    if (!milestone || !disputeReason.trim() || !project) {
      toast.error('Please provide a reason for the dispute');
      return;
    }
    
    setIsProcessing(true);
    try {
      // Create a dispute directly (not a revision request)
      const response = await apiClient.post('/disputes', {
        project_id: project.id,
        milestone_id: milestone.id,
        reason: disputeReason,
      });
      toast.success('Dispute created successfully. Admin will review within 24-48 hours.');
      setDisputeModalOpen(false);
      setDisputeReason('');
      // Reload milestone to get updated status
      await loadMilestone();
      onNavigate(`/projects/${project?.id}`);
    } catch (error) {
      console.error('Dispute error:', error);
      // Error already handled by API client interceptor
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyMilestone = async () => {
    if (!milestone) return;
    
    setIsProcessing(true);
    try {
      await milestoneService.verify(milestone.id, verificationNotes || undefined);
      toast.success('Milestone verified successfully!');
      setVerifyModalOpen(false);
      setVerificationNotes('');
      await loadMilestone(); // Reload to check if project should be activated
    } catch (error) {
      console.error('Failed to verify milestone:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (!milestone) return;
    
    setIsProcessing(true);
    try {
      if (userRole === 'client') {
        await milestoneService.updateClientNotes(milestone.id, milestoneNotes);
      } else if (userRole === 'company') {
        await milestoneService.updateCompanyNotes(milestone.id, milestoneNotes);
      }
      toast.success('Notes updated successfully!');
      setNotesModalOpen(false);
      setMilestoneNotes('');
      await loadMilestone();
    } catch (error) {
      console.error('Failed to update notes:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openVerifyModal = () => {
    setVerificationNotes(milestone?.client_notes || '');
    setVerifyModalOpen(true);
  };

  const openNotesModal = () => {
    if (userRole === 'client') {
      setMilestoneNotes(milestone?.client_notes || '');
    } else if (userRole === 'company') {
      setMilestoneNotes(milestone?.company_notes || '');
    }
    setNotesModalOpen(true);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // Get evidence by type
  const photoEvidence = milestone?.evidence?.filter(e => e.type === 'image') || [];
  const videoEvidence = milestone?.evidence?.filter(e => e.type === 'video') || [];
  const textEvidence = milestone?.evidence?.filter(e => e.type === 'text') || [];
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => onNavigate('/projects')}
          className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#334155]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
          <p className="text-sm text-[#64748B]">Loading milestone...</p>
        </div>
      </div>
    );
  }
  
  if (!milestone || !project) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => onNavigate('/projects')}
          className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#334155]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-sm text-[#64748B]">Milestone not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => onNavigate(`/projects/${project.id}`)}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#334155]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Project
      </button>
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155] mb-2">
            {milestone.title}
          </h1>
          <p className="text-sm text-[#64748B]">{project.title}</p>
        </div>
        <StatusBadge status={milestone.status} />
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Milestone Details */}
          <Card>
            <CardHeader>
              <CardTitle>Milestone Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {milestone.description && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                      Description
                    </p>
                    <p className="text-sm text-[#334155]">{milestone.description}</p>
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                      Sequence Order
                    </p>
                    <p className="text-sm text-[#334155]">{milestone.sequence_order}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                      Created Date
                    </p>
                    <p className="text-sm text-[#334155]">{formatDate(milestone.created_at)}</p>
                  </div>
                  
                  {milestone.status === 'submitted' && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                        Submitted Date
                      </p>
                      <p className="text-sm text-[#334155]">{formatDate(milestone.updated_at)}</p>
                    </div>
                  )}
                  
                  {milestone.escrow && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                        Escrow Status
                      </p>
                      <p className="text-sm text-[#334155] capitalize">{milestone.escrow.status}</p>
                    </div>
                  )}
                  
                  {milestone.verified_at && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                        Verified Date
                      </p>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#16A34A]" />
                        <p className="text-sm text-[#334155]">{formatDate(milestone.verified_at)}</p>
                      </div>
                      {milestone.verifier && (
                        <p className="text-xs text-[#64748B] mt-1">by {milestone.verifier.name}</p>
                      )}
                    </div>
                  )}
                </div>
                
                
                {textEvidence.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                      Notes from Company
                    </p>
                    {textEvidence.map((note) => (
                      <p key={note.id} className="text-sm text-[#334155] mb-2">
                        {note.description}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Photo Evidence */}
          {photoEvidence.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#64748B]" />
                  <CardTitle>Photo Evidence</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {photoEvidence.map((photo) => {
                    const imageUrl = photo.url || photo.file_path;
                    return (
                      <div key={photo.id} className="space-y-2">
                        <div className="aspect-video rounded-lg overflow-hidden bg-[#F8FAFC] border border-[#E5E7EB]">
                          {imageUrl ? (
                            <img
                              src={getFileUrl(imageUrl)}
                              alt={photo.description || 'Evidence photo'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x450?text=Image+Not+Available';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#64748B]">
                              No image available
                            </div>
                          )}
                        </div>
                        {photo.description && (
                          <p className="text-xs text-[#64748B]">{photo.description}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Video Evidence */}
          {videoEvidence.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#64748B]" />
                  <CardTitle>Video Evidence</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {videoEvidence.map((video) => {
                    const videoUrl = video.url || video.file_path;
                    return (
                      <div
                        key={video.id}
                        className="space-y-2"
                      >
                        {video.description && (
                          <p className="text-sm font-medium text-[#334155]">
                            {video.description}
                          </p>
                        )}
                        {videoUrl ? (
                          <div className="rounded-lg overflow-hidden bg-[#000] border border-[#E5E7EB]">
                            <video
                              src={getFileUrl(videoUrl)}
                              controls
                              className="w-full max-h-[600px]"
                              preload="metadata"
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        ) : (
                          <div className="w-full aspect-video flex items-center justify-center bg-[#F8FAFC] rounded-lg border border-[#E5E7EB] text-[#64748B]">
                            Video not available
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          
          {(!photoEvidence.length && !videoEvidence.length && !textEvidence.length) && (
            <Card>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-sm text-[#64748B]">No evidence uploaded yet</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                    Milestone Amount
                  </p>
                  <p className="text-3xl font-semibold text-[#334155]">
                    {formatAmountWithCurrency(milestone.amount)}
                  </p>
                </div>
                
                {milestone.escrow && (
                  <div className="pt-4 border-t border-[#E5E7EB] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748B]">Escrow Amount</span>
                      <span className="text-sm font-medium text-[#334155]">
                        {formatAmountWithCurrency(milestone.escrow.amount)}
                      </span>
                    </div>
                    {milestone.escrow.platform_fee && milestone.escrow.platform_fee > 0 && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#64748B]">
                            Platform Fee ({milestone.escrow.platform_fee_percentage || 0}%)
                          </span>
                          <span className="text-sm font-medium text-[#F97316]">
                            -{formatAmountWithCurrency(milestone.escrow.platform_fee)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
                          <span className="text-xs font-medium text-[#334155]">
                            {userRole === 'client' ? 'Amount to Company' : 'Amount You\'ll Receive'}
                          </span>
                          <span className="text-sm font-bold text-[#334155]">
                            {formatAmountWithCurrency(milestone.escrow.net_amount || (parseFormattedAmount(milestone.escrow.amount) - parseFormattedAmount(milestone.escrow.platform_fee)))}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748B]">Escrow Status</span>
                      <StatusBadge status={milestone.escrow.status} />
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-[#E5E7EB]">
                  <p className="text-xs text-[#64748B] mb-3">
                    {milestone.status === 'submitted'
                      ? userRole === 'client'
                        ? 'This amount will be released from escrow upon your approval.'
                        : 'This amount will be released from escrow once the client approves the milestone.'
                      : milestone.escrow?.status === 'held'
                      ? userRole === 'client'
                        ? 'Funds are held in escrow. Approve milestone to release payment.'
                        : 'Funds are held in escrow. Client will approve to release payment to you.'
                      : userRole === 'client'
                      ? (milestone.verified_at
                          ? 'Fund escrow to proceed with this milestone.'
                          : 'Verify this milestone first to enable funding.')
                      : 'Waiting for client to fund this milestone. You can proceed with work once funding is complete.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Client: Verify Milestone (for draft projects) */}
          {userRole === 'client' && project?.status === 'draft' && !milestone.verified_at && (
            <Card>
              <CardHeader>
                <CardTitle>Verify Milestone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#64748B] mb-4">
                  Verify this milestone to proceed. The project will become active once all milestones are verified.
                </p>
                <Button
                  fullWidth
                  variant="primary"
                  onClick={openVerifyModal}
                  disabled={isProcessing}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify Milestone
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Client Actions */}
          {userRole === 'client' && milestone.status === 'submitted' && (
            <Card>
              <CardHeader>
                <CardTitle>Review Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    fullWidth
                    onClick={() => setApproveModalOpen(true)}
                    disabled={isProcessing}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Milestone
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="secondary"
                    onClick={() => setRejectModalOpen(true)}
                    disabled={isProcessing}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Request Revisions
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="danger"
                    onClick={() => setDisputeModalOpen(true)}
                    disabled={isProcessing}
                  >
                    Open Dispute
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Notes Section - Available for both client and company */}
          {(userRole === 'client' || userRole === 'company') && (
            <Card>
              <CardHeader>
                <CardTitle>Notes & Annotations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {milestone.client_notes && (
                    <div className="p-3 bg-[#EFF6FF] rounded-lg border border-[#3B82F6]/20">
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1 font-medium">
                        Client Notes
                      </p>
                      <p className="text-sm text-[#334155] whitespace-pre-wrap">{milestone.client_notes}</p>
                    </div>
                  )}
                  
                  {milestone.company_notes && (
                    <div className="p-3 bg-[#F0FDF4] rounded-lg border border-[#16A34A]/20">
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1 font-medium">
                        Company Notes
                      </p>
                      <p className="text-sm text-[#334155] whitespace-pre-wrap">{milestone.company_notes}</p>
                    </div>
                  )}
                  
                  {!milestone.client_notes && !milestone.company_notes && (
                    <p className="text-sm text-[#64748B]">
                      No notes added yet. Add notes to communicate with the {userRole === 'client' ? 'company' : 'client'}.
                    </p>
                  )}
                  
                  <Button
                    fullWidth
                    variant="outline"
                    onClick={openNotesModal}
                    disabled={isProcessing}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {milestone.client_notes || milestone.company_notes ? 'Update Notes' : 'Add Notes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Client: Request Refund */}
          {userRole === 'client' && milestone.escrow && milestone.escrow.status === 'held' && (
            <Card>
              <CardHeader>
                <CardTitle>Escrow Refund</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#64748B] mb-4">
                  Request a refund for the escrow funds. This will cancel the milestone payment.
                </p>
                <Button
                  fullWidth
                  variant="danger"
                  onClick={() => setRefundEscrowModalOpen(true)}
                  disabled={isProcessing}
                >
                  Request Refund
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Client: Funding Required (only after milestone is verified) */}
          {userRole === 'client' && milestone.status === 'pending' && !milestone.escrow && milestone.verified_at && (
            <Card>
              <CardHeader>
                <CardTitle>Funding Required</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#64748B] mb-4">
                  Fund the escrow for this milestone to proceed. A platform fee will be deducted when funds are released.
                </p>
                <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg p-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#64748B]">Milestone Amount</span>
                      <span className="text-sm font-medium text-[#334155]">
                        {formatAmountWithCurrency(milestone.amount)}
                      </span>
                    </div>
                    <div className="text-xs text-[#64748B] pt-2 border-t border-[#E5E7EB]">
                      <p>Note: A platform fee (5-8%) will be deducted from the escrow amount when funds are released to the company.</p>
                    </div>
                  </div>
                </div>
                <Button
                  fullWidth
                  onClick={async () => {
                    try {
                      const payment = await milestoneService.fundEscrow(milestone.id);
                      window.location.href = payment.payment_url;
                    } catch (error) {
                      console.error('Funding error:', error);
                    }
                  }}
                >
                  Fund Escrow ({formatAmountWithCurrency(milestone.amount)})
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Company: Request Escrow Release */}
          {userRole === 'company' && milestone.escrow && milestone.escrow.status === 'held' && milestone.status === 'approved' && (
            <Card>
              <CardHeader>
                <CardTitle>Escrow Release</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#64748B] mb-4">
                  Milestone has been approved. Request release of escrow funds to your account.
                </p>
                <Button
                  fullWidth
                  variant="primary"
                  onClick={() => setCompanyReleaseModalOpen(true)}
                  disabled={isProcessing}
                >
                  Request Escrow Release
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Company Actions */}
          {userRole === 'company' && milestone.status === 'funded' && (
            <Card>
              <CardHeader>
                <CardTitle>Milestone Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    fullWidth
                    onClick={() => setUploadEvidenceModalOpen(true)}
                    disabled={isProcessing}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Upload Evidence
                  </Button>
                  
                  {milestone.evidence && milestone.evidence.length > 0 && (
                    <Button
                      fullWidth
                      variant="primary"
                      onClick={async () => {
                        try {
                          setIsProcessing(true);
                          await milestoneService.submit(milestone.id);
                          toast.success('Milestone submitted for approval!');
                          loadMilestone();
                        } catch (error) {
                          console.error('Submit error:', error);
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                      disabled={isProcessing}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit for Approval
                    </Button>
                  )}
                </div>
                <p className="text-xs text-[#64748B] mt-3">
                  Upload evidence of completed work, then submit for client approval.
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* Company: Rejected Milestone Actions */}
          {userRole === 'company' && milestone.status === 'rejected' && (
            <Card>
              <CardHeader>
                <CardTitle>Revision Required</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.disputes && project.disputes.length > 0 && (
                    <div className="bg-[#FEF3C7] rounded-lg p-4 border border-[#F59E0B]/20">
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-2">
                        Rejection Reason
                      </p>
                      <p className="text-sm text-[#334155]">
                        {project.disputes.find(d => d.milestone_id === milestone.id)?.reason || 
                         project.disputes[0]?.reason || 
                         'Client requested revisions'}
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <Button
                      fullWidth
                      onClick={() => setUploadEvidenceModalOpen(true)}
                      disabled={isProcessing}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Upload Revised Evidence
                    </Button>
                    
                    {milestone.evidence && milestone.evidence.length > 0 && (
                      <Button
                        fullWidth
                        variant="primary"
                        onClick={async () => {
                          try {
                            setIsProcessing(true);
                            await milestoneService.submit(milestone.id);
                            toast.success('Milestone resubmitted for approval!');
                            loadMilestone();
                          } catch (error) {
                            console.error('Resubmit error:', error);
                          } finally {
                            setIsProcessing(false);
                          }
                        }}
                        disabled={isProcessing}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Resubmit for Approval
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-xs text-[#64748B]">
                    Address the client's concerns, upload revised evidence, then resubmit for approval.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Client: Rejected Milestone Info */}
          {userRole === 'client' && milestone.status === 'rejected' && (
            <Card>
              <CardHeader>
                <CardTitle>Revision Requested</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.disputes && project.disputes.length > 0 && (
                    <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E5E7EB]">
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-2">
                        Your Revision Request
                      </p>
                      <p className="text-sm text-[#334155]">
                        {project.disputes.find(d => d.milestone_id === milestone.id)?.reason || 
                         project.disputes[0]?.reason || 
                         'Revision requested'}
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-[#DBEAFE] rounded-lg p-4 border border-[#1E3A8A]/20">
                    <p className="text-sm text-[#334155] mb-2">
                      <strong>Next Steps:</strong>
                    </p>
                    <ul className="space-y-1 text-xs text-[#64748B]">
                      <li>• Company will address your concerns</li>
                      <li>• They will upload revised evidence</li>
                      <li>• You'll be notified when they resubmit</li>
                      <li>• Review the updated work and approve or request more changes</li>
                    </ul>
                  </div>
                  
                  {project.disputes && project.disputes.length > 0 && (
                    <div className="pt-2 border-t border-[#E5E7EB]">
                      <p className="text-xs text-[#64748B] mb-2">
                        Dispute Status: <StatusBadge status={project.disputes.find(d => d.milestone_id === milestone.id)?.status || project.disputes[0]?.status || 'open'} />
                      </p>
                      <p className="text-xs text-[#64748B]">
                        Admin will review the dispute and coordinate resolution between you and the company.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Admin: Escrow Release */}
          {userRole === 'admin' && milestone.escrow && milestone.escrow.status === 'held' && (
            <Card>
              <CardHeader>
                <CardTitle>Escrow Release</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                      Escrow Amount
                    </p>
                    <p className="text-2xl font-semibold text-[#334155]">
                      ₦{milestone.escrow.amount.toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                      Milestone Status
                    </p>
                    <StatusBadge status={milestone.status} />
                  </div>
                  
                  {milestone.status !== 'approved' && (
                    <div className="bg-[#FEF3C7] rounded-lg p-3 border border-[#F59E0B]/20">
                      <label className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={adminOverride}
                          onChange={(e) => setAdminOverride(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-[#E5E7EB] text-[#1E3A8A] focus:ring-[#1E3A8A]"
                        />
                        <span className="text-xs text-[#334155]">
                          Override: Release funds without client approval
                        </span>
                      </label>
                    </div>
                  )}
                  
                  <Button
                    fullWidth
                    onClick={() => setReleaseEscrowModalOpen(true)}
                    disabled={isProcessing || (milestone.status !== 'approved' && !adminOverride)}
                  >
                    Release Escrow Funds
                  </Button>
                  
                  <p className="text-xs text-[#64748B]">
                    {milestone.status === 'approved'
                      ? 'Milestone is approved. Release funds to company.'
                      : 'Use override to release funds without client approval.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Guidelines - Client Only */}
          {userRole === 'client' && (
            <Card>
              <CardHeader>
                <CardTitle>Approval Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-[#64748B]">
                  <p>Review all photo and video evidence carefully.</p>
                  <p>Verify work matches the milestone description.</p>
                  <p>Check quality meets agreed specifications.</p>
                  <p>Contact company if you need clarification.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Approve Modal */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => !isProcessing && setApproveModalOpen(false)}
        title="Approve Milestone"
        primaryAction={{
          label: isProcessing ? 'Processing...' : `Approve & Release ${formatAmountWithCurrency(milestone.amount)}`,
          onClick: handleApprove,
          disabled: isProcessing,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setApproveModalOpen(false),
          disabled: isProcessing,
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-[#64748B]">
            You are about to approve this milestone. Admin will release{' '}
            <strong className="text-[#334155]">{formatAmountWithCurrency(milestone.amount)}</strong>{' '}
            from escrow to the construction company.
          </p>
          
          <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E5E7EB]">
            <p className="text-sm text-[#334155]">
              <strong>Please confirm:</strong>
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[#64748B]">
              <li>✓ Work matches milestone description</li>
              <li>✓ Quality meets specifications</li>
              <li>✓ All evidence has been reviewed</li>
            </ul>
          </div>
          
          <p className="text-xs text-[#64748B]">
            This action cannot be undone. Admin will release funds after approval.
          </p>
        </div>
      </Modal>
      
      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => !isProcessing && setRejectModalOpen(false)}
        title="Request Revisions"
        primaryAction={{
          label: isProcessing ? 'Processing...' : 'Send Request',
          onClick: handleReject,
          disabled: isProcessing,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setRejectModalOpen(false),
          disabled: isProcessing,
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-[#64748B]">
            Please explain what needs to be revised or corrected before you can approve this milestone.
            This will create a dispute for admin review.
          </p>
          
          <Textarea
            label="Revision Details"
            placeholder="Describe what needs to be changed..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={6}
            required
          />
        </div>
      </Modal>
      
      {/* Dispute Modal */}
      <Modal
        isOpen={disputeModalOpen}
        onClose={() => !isProcessing && setDisputeModalOpen(false)}
        title="Open Dispute"
        size="lg"
        primaryAction={{
          label: isProcessing ? 'Processing...' : 'Submit Dispute',
          onClick: handleDispute,
          variant: 'danger',
          disabled: isProcessing,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setDisputeModalOpen(false),
          disabled: isProcessing,
        }}
      >
        <div className="space-y-4">
          <div className="bg-[#FEF3C7] rounded-lg p-4 border border-[#F59E0B]/20">
            <p className="text-sm text-[#334155]">
              <strong>Opening a dispute will:</strong>
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[#64748B]">
              <li>• Pause all payments for this project</li>
              <li>• Notify our admin team for review</li>
              <li>• Require mediation before proceeding</li>
            </ul>
          </div>
          
          <Textarea
            label="Dispute Reason"
            placeholder="Explain the issue in detail..."
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            rows={6}
            helperText="Be specific about what is wrong and what you expect."
            required
          />
          
          <p className="text-xs text-[#64748B]">
            Our admin team will review your dispute within 24-48 hours.
          </p>
        </div>
      </Modal>
      
      {/* Upload Evidence Modal - Company Only */}
      {userRole === 'company' && (
        <Modal
          isOpen={uploadEvidenceModalOpen}
          onClose={() => !isProcessing && setUploadEvidenceModalOpen(false)}
          title="Upload Evidence"
          size="lg"
          primaryAction={{
            label: isProcessing ? 'Uploading...' : 'Upload Evidence',
            onClick: async () => {
              if (!evidenceDescription.trim()) {
                toast.error('Description is required');
                return;
              }
              if (evidenceType !== 'text' && !evidenceFile) {
                toast.error('File is required for image/video evidence');
                return;
              }
              
              try {
                setIsProcessing(true);
                await milestoneService.uploadEvidence(milestone.id, {
                  type: evidenceType,
                  file: evidenceFile || undefined,
                  description: evidenceDescription,
                });
                toast.success('Evidence uploaded successfully!');
                setUploadEvidenceModalOpen(false);
                setEvidenceFile(null);
                setEvidenceDescription('');
                setEvidenceType('image');
                loadMilestone();
              } catch (error) {
                console.error('Upload error:', error);
              } finally {
                setIsProcessing(false);
              }
            },
            disabled: isProcessing,
          }}
          secondaryAction={{
            label: 'Cancel',
            onClick: () => {
              setUploadEvidenceModalOpen(false);
              setEvidenceFile(null);
              setEvidenceDescription('');
            },
            disabled: isProcessing,
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-2">
                Evidence Type <span className="text-red-500">*</span>
              </label>
              <select
                value={evidenceType}
                onChange={(e) => {
                  setEvidenceType(e.target.value as 'image' | 'video' | 'text');
                  setEvidenceFile(null);
                }}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none"
                disabled={isProcessing}
              >
                <option value="image">Photo</option>
                <option value="video">Video</option>
                <option value="text">Text Note</option>
              </select>
            </div>
            
            {(evidenceType === 'image' || evidenceType === 'video') && (
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-2">
                  File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept={evidenceType === 'image' ? 'image/*' : 'video/*'}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setEvidenceFile(e.target.files[0]);
                    }
                  }}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none"
                  disabled={isProcessing}
                />
                <p className="text-xs text-[#64748B] mt-1">
                  Max file size: 10MB. Supported: {evidenceType === 'image' ? 'JPG, PNG' : 'MP4, MOV, AVI'}
                </p>
                {evidenceFile && (
                  <p className="text-sm text-[#334155] mt-2">
                    Selected: {evidenceFile.name}
                  </p>
                )}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={evidenceDescription}
                onChange={(e) => setEvidenceDescription(e.target.value)}
                placeholder="Describe the evidence or work completed..."
                rows={4}
                disabled={isProcessing}
                required
              />
            </div>
          </div>
        </Modal>
      )}
      
      {/* Admin: Release Escrow Modal */}
      {userRole === 'admin' && (
        <Modal
          isOpen={releaseEscrowModalOpen}
          onClose={() => !isProcessing && setReleaseEscrowModalOpen(false)}
          title="Release Escrow Funds"
          size="lg"
          primaryAction={{
            label: isProcessing ? 'Releasing...' : 'Release Funds',
            onClick: async () => {
              if (!milestone || !milestone.escrow) return;
              
              if (companyAccounts.length === 0) {
                toast.error('Company has no payment accounts. Please ask them to add one first.');
                return;
              }

              const selectedAccount = companyAccounts.find(acc => acc.id === selectedCompanyAccountId);
              if (!selectedAccount) {
                toast.error('Please select a payment account');
                return;
              }
              
              setIsProcessing(true);
              try {
                await adminService.releaseEscrow(milestone.id, {
                  override: adminOverride,
                  recipient_account: {
                    account_number: selectedAccount.account_number,
                    bank_code: selectedAccount.bank_code,
                    name: selectedAccount.account_name,
                  },
                });
                toast.success('Escrow funds released successfully!');
                setReleaseEscrowModalOpen(false);
                setSelectedCompanyAccountId('');
                setAdminOverride(false);
                loadMilestone();
              } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to release escrow funds');
              } finally {
                setIsProcessing(false);
              }
            },
            disabled: isProcessing || companyAccounts.length === 0 || !selectedCompanyAccountId,
          }}
          secondaryAction={{
            label: 'Cancel',
            onClick: () => {
              setReleaseEscrowModalOpen(false);
              setSelectedCompanyAccountId('');
              setAdminOverride(false);
            },
            disabled: isProcessing,
          }}
        >
          <div className="space-y-4">
            <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E5E7EB]">
              <p className="text-sm text-[#334155] mb-2">
                <strong>Release Details:</strong>
              </p>
              <div className="space-y-1 text-sm text-[#64748B]">
                <p>Milestone: {milestone?.title}</p>
                <p>Amount: {formatAmountWithCurrency(milestone?.escrow?.amount)}</p>
                <p>Status: {milestone?.status}</p>
              </div>
            </div>
            
            {milestone?.status !== 'approved' && (
              <div className="bg-[#FEF3C7] rounded-lg p-3 border border-[#F59E0B]/20">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={adminOverride}
                    onChange={(e) => setAdminOverride(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[#E5E7EB] text-[#1E3A8A] focus:ring-[#1E3A8A]"
                  />
                  <span className="text-xs text-[#334155]">
                    Override client approval requirement
                  </span>
                </label>
              </div>
            )}

            {isLoadingCompanyAccounts ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A] mx-auto mb-2"></div>
                <p className="text-sm text-[#64748B]">Loading company payment accounts...</p>
              </div>
            ) : companyAccounts.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 mb-2">
                  Company has no payment accounts linked. Please ask them to add a payment account in their settings.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-2">
                  Select Company Payment Account <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedCompanyAccountId}
                  onChange={(e) => setSelectedCompanyAccountId(e.target.value)}
                  options={companyAccounts.map(acc => ({
                    value: acc.id,
                    label: `${acc.account_name} - ${acc.account_number}${acc.is_default ? ' (Default)' : ''}`,
                  }))}
                  placeholder="Select payment account"
                  required
                />
                {selectedCompanyAccountId && (
                  <div className="mt-3 p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
                    {(() => {
                      const account = companyAccounts.find(acc => acc.id === selectedCompanyAccountId);
                      return account ? (
                        <div className="text-sm text-[#64748B]">
                          <p><strong>Account:</strong> {account.account_name}</p>
                          <p><strong>Number:</strong> {account.account_number}</p>
                          <p><strong>Bank:</strong> {account.bank_name || `Code: ${account.bank_code}`}</p>
                          {account.is_verified && (
                            <p className="text-green-600 mt-1">✓ Verified</p>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            )}
            
            <div className="bg-[#D1FAE5] rounded-lg p-4 border border-[#16A34A]/20">
              <p className="text-sm text-[#334155] mb-2">
                <strong>This action will:</strong>
              </p>
              <ul className="space-y-1 text-sm text-[#64748B]">
                <li>• Transfer funds from escrow to company account</li>
                <li>• Mark milestone as released</li>
                <li>• Update escrow status</li>
                <li>• Notify both parties</li>
              </ul>
            </div>
          </div>
        </Modal>
      )}

      {/* Company: Request Escrow Release Modal */}
      {userRole === 'company' && (
        <Modal
          isOpen={companyReleaseModalOpen}
          onClose={() => !isProcessing && setCompanyReleaseModalOpen(false)}
          title="Request Escrow Release"
          size="lg"
          primaryAction={{
            label: isProcessing ? 'Processing...' : 'Request Release',
            onClick: async () => {
              if (!milestone || !milestone.escrow) return;
              
              if (paymentAccounts.length === 0) {
                toast.error('Please add a payment account in Settings first');
                return;
              }
              
              setIsProcessing(true);
              try {
                await paymentAccountService.requestEscrowRelease(milestone.id, {
                  account_id: selectedAccountId || undefined,
                });
                toast.success('Escrow release requested successfully!');
                setCompanyReleaseModalOpen(false);
                loadMilestone();
              } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to request escrow release');
              } finally {
                setIsProcessing(false);
              }
            },
            disabled: isProcessing || paymentAccounts.length === 0,
          }}
          secondaryAction={{
            label: 'Cancel',
            onClick: () => {
              setCompanyReleaseModalOpen(false);
            },
            disabled: isProcessing,
          }}
        >
          <div className="space-y-4">
            <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E5E7EB]">
              <p className="text-sm text-[#334155] mb-2">
                <strong>Release Details:</strong>
              </p>
              <div className="space-y-1 text-sm text-[#64748B]">
                <p>Milestone: {milestone?.title}</p>
                <p>Amount: {formatAmountWithCurrency(milestone?.escrow?.amount)}</p>
              </div>
            </div>

            {paymentAccounts.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 mb-2">
                  No payment accounts found. Please add a payment account in Settings first.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setCompanyReleaseModalOpen(false);
                    onNavigate('/settings');
                  }}
                >
                  Go to Settings
                </Button>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-2">
                  Select Payment Account
                </label>
                <Select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  options={paymentAccounts.map(acc => ({
                    value: acc.id,
                    label: `${acc.account_name} - ${acc.account_number}${acc.is_default ? ' (Default)' : ''}`,
                  }))}
                />
                {selectedAccountId && (
                  <div className="mt-3 p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
                    {(() => {
                      const account = paymentAccounts.find(acc => acc.id === selectedAccountId);
                      return account ? (
                        <div className="text-sm text-[#64748B]">
                          <p><strong>Account:</strong> {account.account_name}</p>
                          <p><strong>Number:</strong> {account.account_number}</p>
                          <p><strong>Bank:</strong> {account.bank_name || `Code: ${account.bank_code}`}</p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            )}

            <div className="bg-[#D1FAE5] rounded-lg p-4 border border-[#16A34A]/20">
              <p className="text-sm text-[#334155] mb-2">
                <strong>This action will:</strong>
              </p>
              <ul className="space-y-1 text-sm text-[#64748B]">
                <li>• Transfer funds from escrow to your selected account</li>
                <li>• Mark milestone as released</li>
                <li>• Update escrow status</li>
              </ul>
            </div>
          </div>
        </Modal>
      )}

      {/* Client: Request Refund Modal */}
      {userRole === 'client' && (
        <Modal
          isOpen={refundEscrowModalOpen}
          onClose={() => !isProcessing && setRefundEscrowModalOpen(false)}
          title="Request Escrow Refund"
          size="lg"
          primaryAction={{
            label: isProcessing ? 'Processing...' : 'Request Refund',
            onClick: async () => {
              if (!milestone || !milestone.escrow) return;
              
              if (!refundReason.trim()) {
                toast.error('Please provide a reason for the refund');
                return;
              }

              if (paymentAccounts.length === 0) {
                toast.error('Please add a payment account in Settings first');
                return;
              }
              
              setIsProcessing(true);
              try {
                await paymentAccountService.requestEscrowRefund(milestone.id, {
                  reason: refundReason,
                  account_id: selectedAccountId || undefined,
                });
                toast.success('Refund requested successfully!');
                setRefundEscrowModalOpen(false);
                setRefundReason('');
                loadMilestone();
              } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to request refund');
              } finally {
                setIsProcessing(false);
              }
            },
            disabled: isProcessing || !refundReason.trim() || paymentAccounts.length === 0,
          }}
          secondaryAction={{
            label: 'Cancel',
            onClick: () => {
              setRefundEscrowModalOpen(false);
              setRefundReason('');
            },
            disabled: isProcessing,
          }}
        >
          <div className="space-y-4">
            <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E5E7EB]">
              <p className="text-sm text-[#334155] mb-2">
                <strong>Refund Details:</strong>
              </p>
              <div className="space-y-1 text-sm text-[#64748B]">
                <p>Milestone: {milestone?.title}</p>
                <p>Amount: {formatAmountWithCurrency(milestone?.escrow?.amount)}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#334155] mb-2">
                Reason for Refund <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Please explain why you are requesting a refund..."
                rows={4}
                required
              />
            </div>

            {paymentAccounts.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 mb-2">
                  No payment accounts found. Please add a payment account in Settings first.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setRefundEscrowModalOpen(false);
                    onNavigate('/settings');
                  }}
                >
                  Go to Settings
                </Button>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-2">
                  Refund to Account
                </label>
                <Select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  options={paymentAccounts.map(acc => ({
                    value: acc.id,
                    label: `${acc.account_name} - ${acc.account_number}${acc.is_default ? ' (Default)' : ''}`,
                  }))}
                />
              </div>
            )}

            <div className="bg-[#FEF3C7] rounded-lg p-4 border border-[#F59E0B]/20">
              <p className="text-sm text-[#334155] mb-2">
                <strong>Note:</strong>
              </p>
              <p className="text-sm text-[#64748B]">
                This will cancel the milestone payment and refund the escrow amount to your selected account.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* Verify Milestone Modal */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => {
          setVerifyModalOpen(false);
          setVerificationNotes('');
        }}
        title="Verify Milestone"
      >
        {milestone && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-[#64748B] mb-2">Milestone:</p>
              <p className="font-medium text-[#334155]">{milestone.title}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-2">
                Notes (Optional)
              </label>
              <Textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Add any notes or comments about this milestone..."
                rows={4}
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setVerifyModalOpen(false);
                  setVerificationNotes('');
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleVerifyMilestone}
                disabled={isProcessing}
              >
                {isProcessing ? 'Verifying...' : 'Verify Milestone'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Notes Modal */}
      <Modal
        isOpen={notesModalOpen}
        onClose={() => {
          setNotesModalOpen(false);
          setMilestoneNotes('');
        }}
        title={`${userRole === 'client' ? 'Client' : 'Company'} Notes`}
      >
        {milestone && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-[#64748B] mb-2">Milestone:</p>
              <p className="font-medium text-[#334155]">{milestone.title}</p>
            </div>
            
            {/* Show existing notes from both parties */}
            {milestone.client_notes && (
              <div className="p-3 bg-[#EFF6FF] rounded-lg border border-[#3B82F6]/20">
                <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                  Client Notes
                </p>
                <p className="text-sm text-[#334155] whitespace-pre-wrap">{milestone.client_notes}</p>
              </div>
            )}
            
            {milestone.company_notes && (
              <div className="p-3 bg-[#F0FDF4] rounded-lg border border-[#16A34A]/20">
                <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                  Company Notes
                </p>
                <p className="text-sm text-[#334155] whitespace-pre-wrap">{milestone.company_notes}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-2">
                {userRole === 'client' ? 'Your Notes' : 'Company Notes'}
              </label>
              <Textarea
                value={milestoneNotes}
                onChange={(e) => setMilestoneNotes(e.target.value)}
                placeholder={`Add your notes or comments about this milestone...`}
                rows={4}
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setNotesModalOpen(false);
                  setMilestoneNotes('');
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateNotes}
                disabled={isProcessing}
              >
                {isProcessing ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
