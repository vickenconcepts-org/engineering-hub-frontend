import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Image as ImageIcon, Video, CheckCircle, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Textarea } from '../components/Textarea';
import { projectService, Project, Milestone } from '../services/project.service';
import { milestoneService } from '../services/milestone.service';
import apiClient from '../lib/api-client';

interface MilestoneDetailPageProps {
  onNavigate: (path: string) => void;
}

export function MilestoneDetailPage({ onNavigate }: MilestoneDetailPageProps) {
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Extract milestone ID from current path
  const milestoneId = parseInt(window.location.pathname.split('/milestones/')[1]?.split('#')[0] || '0');
  
  useEffect(() => {
    if (milestoneId) {
      loadMilestone();
    }
  }, [milestoneId]);
  
  const loadMilestone = async () => {
    try {
      setIsLoading(true);
      // Get all projects to find the one containing this milestone
      // Note: In production, consider adding GET /api/milestones/{id} endpoint
      const { projects } = await projectService.list({ per_page: 100 });
      
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
        const fullProject = await projectService.get(foundProject.id);
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
    if (!milestone || !disputeReason.trim()) {
      toast.error('Please provide a reason for the dispute');
      return;
    }
    
    setIsProcessing(true);
    try {
      // Reject milestone which automatically creates a dispute
      await milestoneService.reject(milestone.id, { reason: disputeReason });
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
  
  // Get file URL (assuming backend serves files from storage)
  const getFileUrl = (filePath?: string) => {
    if (!filePath) return '';
    // Construct URL - adjust based on your backend file serving setup
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    return `${apiBaseUrl.replace('/api', '')}/storage/${filePath}`;
  };
  
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
                  {photoEvidence.map((photo) => (
                    <div key={photo.id} className="space-y-2">
                      <div className="aspect-video rounded-lg overflow-hidden bg-[#F8FAFC] border border-[#E5E7EB]">
                        {photo.file_path ? (
                          <img
                            src={getFileUrl(photo.file_path)}
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
                  ))}
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
                <div className="space-y-3">
                  {videoEvidence.map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
                          <Video className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="text-sm text-[#334155] block">
                            {video.description || 'Video evidence'}
                          </span>
                          {video.file_path && (
                            <span className="text-xs text-[#64748B]">
                              {video.file_path.split('/').pop()}
                            </span>
                          )}
                        </div>
                      </div>
                      {video.file_path && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => window.open(getFileUrl(video.file_path), '_blank')}
                        >
                          View
                        </Button>
                      )}
                    </div>
                  ))}
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
                    ₦{milestone.amount.toLocaleString()}
                  </p>
                </div>
                
                {milestone.escrow && (
                  <div className="pt-4 border-t border-[#E5E7EB] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748B]">Escrow Amount</span>
                      <span className="text-sm font-medium text-[#334155]">
                        ₦{milestone.escrow.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748B]">Escrow Status</span>
                      <StatusBadge status={milestone.escrow.status} />
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-[#E5E7EB]">
                  <p className="text-xs text-[#64748B] mb-3">
                    {milestone.status === 'submitted' 
                      ? 'This amount will be released from escrow upon your approval.'
                      : milestone.escrow?.status === 'held'
                      ? 'Funds are held in escrow. Approve milestone to release payment.'
                      : 'Fund escrow to proceed with this milestone.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Actions */}
          {milestone.status === 'submitted' && (
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
          
          {milestone.status === 'pending' && !milestone.escrow && (
            <Card>
              <CardHeader>
                <CardTitle>Funding Required</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#64748B] mb-4">
                  Fund the escrow for this milestone to proceed.
                </p>
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
                  Fund Escrow (₦{milestone.amount.toLocaleString()})
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Guidelines */}
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
        </div>
      </div>
      
      {/* Approve Modal */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => !isProcessing && setApproveModalOpen(false)}
        title="Approve Milestone"
        primaryAction={{
          label: isProcessing ? 'Processing...' : `Approve & Release ₦${milestone.amount.toLocaleString()}`,
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
            <strong className="text-[#334155]">₦{milestone.amount.toLocaleString()}</strong>{' '}
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
    </div>
  );
}
