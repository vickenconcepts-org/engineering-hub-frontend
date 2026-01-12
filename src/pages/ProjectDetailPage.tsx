import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Building2, DollarSign, Calendar, MapPin, CheckCircle, Clock, AlertCircle, X, MessageSquare, FolderKanban, Shield } from 'lucide-react';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Textarea } from '../components/Textarea';
import { projectService, Project } from '../services/project.service';
import { milestoneService } from '../services/milestone.service';
import { Milestone } from '../services/project.service';
import { formatAmountWithCurrency, parseFormattedAmount } from '../lib/money-utils';

interface ProjectDetailPageProps {
  userRole?: 'client' | 'company' | 'admin' | null;
}

export function ProjectDetailPage({ userRole }: ProjectDetailPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const projectId = id || '';
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'escrow'>('overview');
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [milestoneNotes, setMilestoneNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId, userRole]);
  
  const loadProject = async () => {
    try {
      setIsLoading(true);
      // Use role-specific endpoints
      let fetchedProject: Project;
      if (userRole === 'admin') {
        // Admin uses shared endpoint which allows viewing any project
        fetchedProject = await projectService.getShared(projectId);
      } else if (userRole === 'company') {
        fetchedProject = await projectService.getForCompany(projectId);
      } else {
        fetchedProject = await projectService.get(projectId);
      }
      setProject(fetchedProject);
    } catch (error) {
      console.error('Failed to load project:', error);
      toast.error('Failed to load project details');
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateProjectProgress = (project: Project): number => {
    if (!project.milestones || project.milestones.length === 0) return 0;
    
    const completedMilestones = project.milestones.filter(
      (m) => m.status === 'approved' || m.status === 'released'
    ).length;
    
    return Math.round((completedMilestones / project.milestones.length) * 100);
  };
  
  const formatBudget = (project: Project): string => {
    if (project.budget_min && project.budget_max) {
      return `₦${project.budget_min.toLocaleString()} - ₦${project.budget_max.toLocaleString()}`;
    }
    if (project.budget_min) {
      return `₦${project.budget_min.toLocaleString()}+`;
    }
    if (project.budget_max) {
      return `Up to ₦${project.budget_max.toLocaleString()}`;
    }
    return 'Not specified';
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  

  // Calculate escrow totals
  const escrowTotals = project ? {
    funded: project.milestones?.reduce((total, m) => {
      if (m.escrow && (m.escrow.status === 'held' || m.escrow.status === 'released')) {
        return total + parseFormattedAmount(m.escrow.amount);
      }
      return total;
    }, 0) || 0,
    released: project.milestones?.reduce((total, m) => {
      if (m.escrow && m.escrow.status === 'released') {
        return total + parseFormattedAmount(m.escrow.amount);
      }
      return total;
    }, 0) || 0,
  } : { funded: 0, released: 0 };
  
  // Ensure totals are valid numbers
  const safeFunded = typeof escrowTotals.funded === 'number' && !isNaN(escrowTotals.funded) ? escrowTotals.funded : 0;
  const safeReleased = typeof escrowTotals.released === 'number' && !isNaN(escrowTotals.released) ? escrowTotals.released : 0;
  const safeRemaining = safeFunded - safeReleased;
  
  const handleFundMilestone = async (milestoneId: string) => {
    try {
      const payment = await milestoneService.fundEscrow(milestoneId);
      window.location.href = payment.payment_url;
    } catch (error) {
      console.error('Failed to fund milestone:', error);
    }
  };

  const handleVerifyMilestone = async () => {
    if (!selectedMilestone) return;
    
    setIsProcessing(true);
    try {
      await milestoneService.verify(selectedMilestone.id, verificationNotes || undefined);
      toast.success('Milestone verified successfully!');
      setVerifyModalOpen(false);
      setVerificationNotes('');
      setSelectedMilestone(null);
      await loadProject(); // Reload to check if project should be activated
    } catch (error) {
      console.error('Failed to verify milestone:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (!selectedMilestone) return;
    
    setIsProcessing(true);
    try {
      if (userRole === 'client') {
        await milestoneService.updateClientNotes(selectedMilestone.id, milestoneNotes);
      } else if (userRole === 'company') {
        await milestoneService.updateCompanyNotes(selectedMilestone.id, milestoneNotes);
      }
      toast.success('Notes updated successfully!');
      setNotesModalOpen(false);
      setMilestoneNotes('');
      setSelectedMilestone(null);
      await loadProject();
    } catch (error) {
      console.error('Failed to update notes:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openVerifyModal = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setVerificationNotes(milestone.client_notes || '');
    setVerifyModalOpen(true);
  };

  const openNotesModal = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    if (userRole === 'client') {
      setMilestoneNotes(milestone.client_notes || '');
    } else if (userRole === 'company') {
      setMilestoneNotes(milestone.company_notes || '');
    }
    setNotesModalOpen(true);
  };
  
  const getMilestoneStatusIcon = (status: string) => {
    switch (status) {
      case 'released':
      case 'approved':
        return <CheckCircle className="w-5 h-5" />;
      case 'submitted':
        return <AlertCircle className="w-5 h-5" />;
      case 'rejected':
        return <X className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };
  
  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'released':
      case 'approved':
        return 'bg-[#D1FAE5] text-[#16A34A]';
      case 'submitted':
        return 'bg-[#FEF3C7] text-[#F59E0B]';
      case 'funded':
        return 'bg-[#DBEAFE] text-[#2563EB]';
      case 'rejected':
        return 'bg-[#FEE2E2] text-[#DC2626]';
      default:
        return 'bg-[#F8FAFC] text-[#64748B]';
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6 min-h-screen">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#334155] transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
            <p className="text-sm text-[#64748B]">Loading project...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="space-y-6 min-h-screen">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#334155] transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-8">
          <div className="text-center py-12">
            <p className="text-sm text-[#64748B]">Project not found</p>
          </div>
        </div>
      </div>
    );
  }
  
  const progress = calculateProjectProgress(project);
  const milestones = project.milestones || [];
  
  return (
    <div className="space-y-6 min-h-screen">
      {/* Back Button */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#334155] transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </button>
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[#334155] mb-1">
                {project.title}
              </h1>
              <p className="text-sm text-[#64748B]">Project ID: {project.id.slice(0, 8)}...</p>
            </div>
          </div>
          <StatusBadge status={project.status} />
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-[#334155]">Overall Progress</span>
          <span className="text-lg font-bold text-[#1E3A8A]">{progress}%</span>
        </div>
        <div className="w-full h-3 bg-[#E5E7EB] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#16A34A] to-[#22C55E] rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-1">
        <div className="flex gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: FolderKanban },
            { id: 'milestones', label: 'Milestones', icon: CheckCircle },
            { id: 'escrow', label: 'Escrow', icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-all rounded-lg flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] text-white shadow-md'
                  : 'text-[#64748B] hover:text-[#334155] hover:bg-[#F8FAFC]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg">
              <div className="border-b border-[#E5E7EB] pb-4 px-6 pt-6">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-[#1E3A8A]" />
                  <h3 className="text-lg font-semibold text-[#334155]">Project Details</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {project.description && (
                    <div>
                      <p className="text-xs text-[#64748B] mb-2 font-medium">Description</p>
                      <p className="text-sm text-[#334155] leading-relaxed">{project.description}</p>
                    </div>
                  )}
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-[#1E3A8A]" />
                      </div>
                      <div>
                        <p className="text-xs text-[#64748B] mb-1">Created Date</p>
                        <p className="text-sm font-medium text-[#334155]">{formatDate(project.created_at)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-[#1E3A8A]" />
                      </div>
                      <div>
                        <p className="text-xs text-[#64748B] mb-1">Location</p>
                        <p className="text-sm font-medium text-[#334155]">{project.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-[#1E3A8A]" />
                      </div>
                      <div>
                        <p className="text-xs text-[#64748B] mb-1">Budget Range</p>
                        <p className="text-sm font-medium text-[#334155]">
                          {formatBudget(project)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg">
              <div className="border-b border-[#E5E7EB] pb-4 px-6 pt-6">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#1E3A8A]" />
                  <h3 className="text-lg font-semibold text-[#334155]">Company</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Company Name</p>
                    <p className="text-sm text-[#334155] font-semibold">
                      {project.company?.company_name || 'N/A'}
                    </p>
                  </div>
                  
                  {project.company?.user && (
                    <>
                      <div>
                        <p className="text-xs text-[#64748B] mb-1">Contact Person</p>
                        <p className="text-sm text-[#334155] font-medium">{project.company.user.name}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-[#64748B] mb-1">Email</p>
                        <a
                          href={`mailto:${project.company.user.email}`}
                          className="text-sm text-[#1E3A8A] hover:text-[#1D4ED8] font-medium"
                        >
                          {project.company.user.email}
                        </a>
                      </div>
                    </>
                  )}
                  
                  {project.company?.registration_number && (
                    <div>
                      <p className="text-xs text-[#64748B] mb-1">Registration Number</p>
                      <p className="text-sm text-[#334155] font-medium">{project.company.registration_number}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'milestones' && (
        <div className="space-y-6">
          {/* Client: Verification Notice for Draft Projects */}
          {userRole === 'client' && project?.status === 'draft' && milestones.length > 0 && (
            <div className="bg-[#FEF3C7] rounded-xl border border-[#FCD34D] shadow-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#334155] mb-1">
                    Verify Milestones to Activate Project
                  </p>
                  <p className="text-sm text-[#64748B]">
                    Please review and verify all milestones. The project will become active once all milestones are verified.
                  </p>
                  <div className="mt-2 text-xs text-[#64748B] font-medium">
                    Verified: {milestones.filter(m => m.verified_at).length} / {milestones.length}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Company: Create Milestones for Draft Projects */}
          {userRole === 'company' && project?.status === 'draft' && milestones.length === 0 && (
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-8">
              <div className="text-center py-12">
                <p className="text-sm text-[#64748B] mb-4">No milestones yet. Create milestones to activate this project.</p>
                <Button 
                  onClick={() => navigate(`/projects/${projectId}/create-milestones`)}
                  className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all"
                >
                  Create Milestones
                </Button>
              </div>
            </div>
          )}
          
          {milestones.length === 0 && !(userRole === 'company' && project?.status === 'draft') ? (
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-8">
              <div className="text-center py-12">
                <p className="text-sm text-[#64748B]">No milestones yet</p>
              </div>
            </div>
          ) : milestones.length > 0 ? (
            milestones.map((milestone) => {
              // Find dispute for this milestone
              const milestoneDispute = project.disputes?.find(d => d.milestone_id === milestone.id);
              
              return (
                <div
                  key={milestone.id}
                  className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div 
                    onClick={() => navigate(`/milestones/${milestone.id}`)}
                    className="p-6 cursor-pointer"
                  >
                    <div className="flex items-start gap-4 mb-6">
                      <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 ${getMilestoneStatusColor(milestone.status)}`}>
                        {getMilestoneStatusIcon(milestone.status)}
                      </div>
                      
                      <div className="flex-1 h-[100px]">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-[#334155] mb-2">
                              {milestone.title}
                            </h3>
                            {milestone.description && (
                              <p className="text-sm text-[#64748B] leading-relaxed mb-4">{milestone.description}</p>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="bg-gradient-to-br from-[#1E3A8A]/5 to-[#2563EB]/5 rounded-lg p-4 border border-[#E5E7EB] min-w-[120px]">
                              <p className="text-xs text-[#64748B] mb-1 font-medium">Amount</p>
                              <p className="text-xl font-bold text-[#1E3A8A]">
                                {formatAmountWithCurrency(milestone.amount)}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Badges and Info Row */}
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <StatusBadge status={milestone.status} />
                          
                          {/* Show verification status */}
                          {milestone.verified_at && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0] text-xs font-medium">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Verified</span>
                            </div>
                          )}
                          
                          {/* Show notes indicators */}
                          {(milestone.client_notes || milestone.company_notes) && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] text-[#64748B] border border-[#E5E7EB] text-xs font-medium">
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>
                                {milestone.client_notes && milestone.company_notes 
                                  ? 'Both have notes' 
                                  : milestone.client_notes 
                                    ? 'Client notes' 
                                    : 'Company notes'}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB]">
                            <div className="w-6 h-6 rounded-lg bg-[#1E3A8A]/10 flex items-center justify-center">
                              <span className="text-xs font-semibold text-[#1E3A8A]">{milestone.sequence_order}</span>
                            </div>
                            <span className="text-xs text-[#64748B] font-medium">Sequence</span>
                          </div>
                          
                          {milestone.escrow && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB]">
                              <Shield className="w-4 h-4 text-[#1E3A8A]" />
                              <span className="text-xs text-[#64748B] font-medium">Escrow: {milestone.escrow.status}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Show rejection reason for companies */}
                        {userRole === 'company' && milestone.status === 'rejected' && milestoneDispute && (
                          <div className="mt-3 p-4 bg-[#FEF3C7] rounded-lg border border-[#FCD34D]">
                            <p className="text-xs text-[#64748B] mb-1 font-semibold">
                              Rejection Reason
                            </p>
                            <p className="text-sm text-[#334155]">
                              {milestoneDispute.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions Section - Separated at bottom */}
                  <div className="px-6 pb-6 pt-0 border-t border-[#E5E7EB]">
                    <div className="flex items-center justify-end gap-3 mt-4">
                      {/* Client: Verify milestone (for draft projects) */}
                      {userRole === 'client' && project?.status === 'draft' && !milestone.verified_at && (
                        <Button
                          size="sm"
                          variant="primary"
                          className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            openVerifyModal(milestone);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          Verify Milestone
                        </Button>
                      )}
                      
                      {/* Client: Fund escrow (for active projects) */}
                      {userRole === 'client' && project?.status === 'active' && milestone.status === 'pending' && !milestone.escrow && (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFundMilestone(milestone.id);
                          }}
                        >
                          <DollarSign className="w-4 h-4 mr-1.5" />
                          Fund Escrow
                        </Button>
                      )}
                      
                      {/* Add Notes button */}
                      {(userRole === 'client' || userRole === 'company') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            openNotesModal(milestone);
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-1.5" />
                          Notes
                        </Button>
                      )}
                      
                      {userRole === 'company' && milestone.status === 'rejected' && (
                        <Button
                          size="sm"
                          variant="primary"
                          className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/milestones/${milestone.id}`);
                          }}
                        >
                          View & Revise
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/milestones/${milestone.id}`);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : null}
        </div>
      )}
      
      {activeTab === 'escrow' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg">
            <div className="border-b border-[#E5E7EB] pb-4 px-6 pt-6">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#1E3A8A]" />
                <h3 className="text-lg font-semibold text-[#334155]">Escrow Summary</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-[#1E3A8A]/5 to-[#2563EB]/5 rounded-xl p-5 border border-[#E5E7EB]">
                  <p className="text-xs text-[#64748B] mb-2 font-medium">Total Funded</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">
                    ₦{safeFunded.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                    <span className="text-sm text-[#64748B]">Released to Date</span>
                    <span className="text-sm font-semibold text-[#16A34A]">
                      ₦{safeReleased.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                    <span className="text-sm text-[#64748B]">Remaining in Escrow</span>
                    <span className="text-sm font-semibold text-[#1E3A8A]">
                      ₦{safeRemaining.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                
                {safeFunded > 0 && (
                  <div className="pt-4 border-t border-[#E5E7EB]">
                    <div className="w-full h-3 bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#16A34A] to-[#22C55E] rounded-full"
                        style={{ width: `${(safeReleased / safeFunded) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#64748B] mt-2 font-medium">
                      {((safeReleased / safeFunded) * 100).toFixed(0)}% of funds released
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg">
            <div className="border-b border-[#E5E7EB] pb-4 px-6 pt-6">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#1E3A8A]" />
                <h3 className="text-lg font-semibold text-[#334155]">Escrow Protection</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Your funds are held securely in escrow and only released when you approve completed milestones.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#D1FAE5] flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-[#16A34A]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#334155] mb-1">Funds Protected</p>
                      <p className="text-xs text-[#64748B]">Funds protected until milestone approval</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#D1FAE5] flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-[#16A34A]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#334155] mb-1">Evidence-Based</p>
                      <p className="text-xs text-[#64748B]">Evidence-based approval process</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#D1FAE5] flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-[#16A34A]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#334155] mb-1">Dispute Resolution</p>
                      <p className="text-xs text-[#64748B]">Dispute resolution available</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verify Milestone Modal */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => {
          setVerifyModalOpen(false);
          setSelectedMilestone(null);
          setVerificationNotes('');
        }}
        title="Verify Milestone"
        primaryAction={{
          label: isProcessing ? 'Verifying...' : 'Verify Milestone',
          onClick: handleVerifyMilestone,
          disabled: isProcessing,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => {
            setVerifyModalOpen(false);
            setSelectedMilestone(null);
            setVerificationNotes('');
          },
          disabled: isProcessing,
        }}
      >
        {selectedMilestone && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#1E3A8A]/5 to-[#2563EB]/5 rounded-xl p-4 border border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Milestone</p>
                  <p className="text-sm font-semibold text-[#334155]">{selectedMilestone.title}</p>
                </div>
              </div>
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
          </div>
        )}
      </Modal>
      
      {/* Notes Modal */}
      <Modal
        isOpen={notesModalOpen}
        onClose={() => {
          setNotesModalOpen(false);
          setSelectedMilestone(null);
          setMilestoneNotes('');
        }}
        title={`${userRole === 'client' ? 'Client' : 'Company'} Notes`}
        primaryAction={{
          label: isProcessing ? 'Saving...' : 'Save Notes',
          onClick: handleUpdateNotes,
          disabled: isProcessing,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => {
            setNotesModalOpen(false);
            setSelectedMilestone(null);
            setMilestoneNotes('');
          },
          disabled: isProcessing,
        }}
      >
        {selectedMilestone && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#1E3A8A]/5 to-[#2563EB]/5 rounded-xl p-4 border border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Milestone</p>
                  <p className="text-sm font-semibold text-[#334155]">{selectedMilestone.title}</p>
                </div>
              </div>
            </div>
            
            {/* Show existing notes from both parties */}
            {selectedMilestone.client_notes && (
              <div className="p-4 bg-[#EFF6FF] rounded-xl border border-[#3B82F6]/20">
                <p className="text-xs text-[#64748B] mb-2 font-medium">
                  Client Notes
                </p>
                <p className="text-sm text-[#334155] whitespace-pre-wrap leading-relaxed">{selectedMilestone.client_notes}</p>
              </div>
            )}
            
            {selectedMilestone.company_notes && (
              <div className="p-4 bg-[#F0FDF4] rounded-xl border border-[#16A34A]/20">
                <p className="text-xs text-[#64748B] mb-2 font-medium">
                  Company Notes
                </p>
                <p className="text-sm text-[#334155] whitespace-pre-wrap leading-relaxed">{selectedMilestone.company_notes}</p>
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
          </div>
        )}
      </Modal>
    </div>
  );
}
