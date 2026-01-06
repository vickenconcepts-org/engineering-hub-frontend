import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, AlertCircle, DollarSign, FileText, Image as ImageIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Textarea } from '../components/Textarea';
import { Input } from '../components/Input';
import { adminService, Dispute } from '../services/admin.service';

interface AdminDisputePageProps {
  onNavigate: (path: string) => void;
}

export function AdminDisputePage({ onNavigate }: AdminDisputePageProps) {
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState<'resolved' | 'escalated'>('resolved');
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Extract dispute ID from current path
  const disputeId = parseInt(window.location.pathname.split('/admin/disputes/')[1]?.split('#')[0] || '0');
  
  useEffect(() => {
    if (disputeId) {
      loadDispute();
    }
  }, [disputeId]);
  
  const loadDispute = async () => {
    try {
      setIsLoading(true);
      const fetchedDispute = await adminService.getDispute(disputeId);
      setDispute(fetchedDispute);
    } catch (error) {
      console.error('Failed to load dispute:', error);
      toast.error('Failed to load dispute details');
      onNavigate('/admin/disputes');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResolve = async () => {
    if (!dispute || !resolutionNotes.trim()) {
      toast.error('Please provide resolution notes');
      return;
    }
    
    try {
      setIsProcessing(true);
      await adminService.resolveDispute(dispute.id, {
        resolution: resolutionNotes,
        status: resolutionStatus,
      });
      toast.success('Dispute resolved successfully');
      setResolveModalOpen(false);
      setResolutionNotes('');
      loadDispute();
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
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
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'yellow';
      case 'resolved':
        return 'green';
      case 'escalated':
        return 'red';
      default:
        return 'gray';
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
          <p className="text-sm text-[#64748B]">Loading dispute details...</p>
        </div>
      </div>
    );
  }
  
  if (!dispute) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-sm text-[#64748B]">Dispute not found</p>
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
        onClick={() => onNavigate('/admin/disputes')}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#334155]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Disputes
      </button>
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155] mb-2">
            Dispute #{dispute.id}
          </h1>
          <p className="text-sm text-[#64748B]">
            {dispute.project?.title || 'Project'} • Opened: {formatDate(dispute.created_at)}
          </p>
        </div>
        <StatusBadge status={dispute.status} color={getStatusColor(dispute.status)} />
      </div>
      
      {/* Alert Banner */}
      {dispute.status === 'open' && dispute.milestone && (
        <div className="bg-[#FEF3C7] rounded-lg p-4 border border-[#F59E0B]/20">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#334155] mb-1">
                Disputed Milestone: {dispute.milestone.title}
              </p>
              <p className="text-sm text-[#64748B]">
                ₦{dispute.milestone.amount.toLocaleString()} in escrow is on hold pending resolution.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {dispute.resolution_notes && (
        <div className="bg-[#D1FAE5] rounded-lg p-4 border border-[#16A34A]/20">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-[#16A34A] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#334155] mb-1">
                Resolution
              </p>
              <p className="text-sm text-[#334155]">{dispute.resolution_notes}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Complaint */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Client Complaint</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                    Raised By
                  </p>
                  <p className="text-sm text-[#334155] font-medium">
                    {dispute.raised_by_user?.name || 'Client'}
                  </p>
                  {dispute.raised_by_user?.email && (
                    <p className="text-xs text-[#64748B] mt-1">{dispute.raised_by_user.email}</p>
                  )}
                </div>
                
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                    Complaint Details
                  </p>
                  <p className="text-sm text-[#334155]">{dispute.reason}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Company Information */}
          {dispute.project && (
            <Card>
              <CardHeader>
                <CardTitle>Project & Company</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                      Project
                    </p>
                    <p className="text-sm text-[#334155] font-medium">{dispute.project.title}</p>
                  </div>
                  
                  {dispute.milestone && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                        Disputed Milestone
                      </p>
                      <p className="text-sm text-[#334155]">{dispute.milestone.title}</p>
                      <p className="text-xs text-[#64748B] mt-1">
                        Amount: ₦{dispute.milestone.amount.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Resolution - Only show if dispute is open */}
          {dispute.status === 'open' && (
            <Card>
              <CardHeader>
                <CardTitle>Resolution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#334155] mb-2">
                      Resolution Status
                    </label>
                    <select
                      value={resolutionStatus}
                      onChange={(e) => setResolutionStatus(e.target.value as 'resolved' | 'escalated')}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none"
                    >
                      <option value="resolved">Resolved</option>
                      <option value="escalated">Escalated</option>
                    </select>
                  </div>
                  
                  <Textarea
                    label="Resolution Notes"
                    placeholder="Document your decision and reasoning..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={6}
                    helperText="This will be sent to both parties."
                    required
                  />
                  
                  <Button
                    fullWidth
                    onClick={() => setResolveModalOpen(true)}
                    disabled={!resolutionNotes.trim()}
                  >
                    Resolve Dispute
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Show resolution if already resolved */}
          {dispute.status !== 'open' && dispute.resolution_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Resolution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                      Status
                    </p>
                    <StatusBadge status={dispute.status} color={getStatusColor(dispute.status)} />
                  </div>
                  
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                      Resolution Notes
                    </p>
                    <p className="text-sm text-[#334155]">{dispute.resolution_notes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dispute.project && (
                  <>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                        Project Name
                      </p>
                      <button
                        onClick={() => onNavigate(`/projects/${dispute.project?.id}`)}
                        className="text-sm text-[#1E3A8A] hover:text-[#1D4ED8] hover:underline"
                      >
                        {dispute.project.title}
                      </button>
                    </div>
                    
                    {dispute.milestone && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                          Disputed Milestone
                        </p>
                        <p className="text-sm text-[#334155] font-medium">
                          {dispute.milestone.title}
                        </p>
                        <p className="text-xs text-[#64748B] mt-1">
                          Amount: ₦{dispute.milestone.amount.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Dispute Info */}
          <Card>
            <CardHeader>
              <CardTitle>Dispute Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                    Status
                  </p>
                  <StatusBadge status={dispute.status} color={getStatusColor(dispute.status)} />
                </div>
                
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                    Opened Date
                  </p>
                  <p className="text-sm text-[#334155]">{formatDate(dispute.created_at)}</p>
                </div>
                
                {dispute.raised_by_user && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                      Raised By
                    </p>
                    <p className="text-sm text-[#334155]">{dispute.raised_by_user.name}</p>
                    <p className="text-xs text-[#64748B] mt-1">{dispute.raised_by_user.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Resolve Dispute Modal */}
      <Modal
        isOpen={resolveModalOpen}
        onClose={() => !isProcessing && setResolveModalOpen(false)}
        title="Resolve Dispute"
        size="lg"
        primaryAction={{
          label: isProcessing ? 'Resolving...' : 'Resolve Dispute',
          onClick: handleResolve,
          disabled: isProcessing || !resolutionNotes.trim(),
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => {
            setResolveModalOpen(false);
            setResolutionNotes('');
          },
          disabled: isProcessing,
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-[#64748B]">
            Resolve this dispute and provide resolution notes that will be sent to both parties.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-2">
              Resolution Status
            </label>
            <select
              value={resolutionStatus}
              onChange={(e) => setResolutionStatus(e.target.value as 'resolved' | 'escalated')}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none"
              disabled={isProcessing}
            >
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
            </select>
            <p className="text-xs text-[#64748B] mt-1">
              {resolutionStatus === 'resolved' 
                ? 'Mark dispute as resolved and close the case.'
                : 'Escalate dispute for further review.'}
            </p>
          </div>
          
          <Textarea
            label="Resolution Notes (Required)"
            placeholder="Explain your decision and reasoning..."
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            rows={6}
            required
            disabled={isProcessing}
            helperText="This will be sent to both the client and company."
          />
        </div>
      </Modal>
    </div>
  );
}
