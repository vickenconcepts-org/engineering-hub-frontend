import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Building2, DollarSign, Calendar, MapPin, CheckCircle, Clock, AlertCircle, X, MessageSquare, FolderKanban, Shield, Image as ImageIcon, Plus, Eye, Lock, Unlock, Send, Check, XCircle, FileText } from 'lucide-react';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Textarea } from '../components/Textarea';
import { FilePreviewInput } from '../components/FilePreviewInput';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
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
  const [previewImageFile, setPreviewImageFile] = useState<File | null>(null);
  const [previewImagePreview, setPreviewImagePreview] = useState<string | null>(null);
  const [drawingFiles, setDrawingFiles] = useState({
    architectural: null as File | null,
    structural: null as File | null,
    mechanical: null as File | null,
    technical: null as File | null,
  });
  const [extraUploads, setExtraUploads] = useState<Array<{ id: string; title: string; file: File | null }>>([]);
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
  const [viewerModalOpen, setViewerModalOpen] = useState(false);
  const [viewerDocumentUrl, setViewerDocumentUrl] = useState<string | null>(null);
  const [viewerDocumentTitle, setViewerDocumentTitle] = useState<string>('');
  const [requestUpdateModalOpen, setRequestUpdateModalOpen] = useState(false);
  const [requestUpdateType, setRequestUpdateType] = useState<string>('');
  const [requestUpdateExtraDocId, setRequestUpdateExtraDocId] = useState<string | null>(null);
  const [requestUpdateReason, setRequestUpdateReason] = useState('');
  const [isRequestingUpdate, setIsRequestingUpdate] = useState(false);
  const [documentsEnabled, setDocumentsEnabled] = useState(true);
  
  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId, userRole]);

  useEffect(() => {
    if (previewImageFile) {
      const objectUrl = URL.createObjectURL(previewImageFile);
      setPreviewImagePreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setPreviewImagePreview(null);
  }, [previewImageFile]);
  
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
      // Normalize document_update_requests (snake_case) to documentUpdateRequests (camelCase)
      if ((fetchedProject as any).document_update_requests && !fetchedProject.documentUpdateRequests) {
        fetchedProject.documentUpdateRequests = (fetchedProject as any).document_update_requests;
      }
      
      // Debug: Log document update requests
      console.log('📥 Loaded project:', {
        projectId: fetchedProject.id,
        hasRequests: !!fetchedProject.documentUpdateRequests,
        count: fetchedProject.documentUpdateRequests?.length || 0,
        requests: fetchedProject.documentUpdateRequests,
        snakeCaseExists: !!(fetchedProject as any).document_update_requests,
        snakeCaseCount: (fetchedProject as any).document_update_requests?.length || 0
      });
      
      setProject(fetchedProject);
      console.log('✅ Project state updated with documentUpdateRequests:', fetchedProject.documentUpdateRequests?.length || 0);
      setPreviewImageFile(null);
      setDrawingFiles({
        architectural: null,
        structural: null,
        mechanical: null,
        technical: null,
      });
      setExtraUploads([]);
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
      if (project.budget_min === project.budget_max) {
        return `₦${project.budget_min.toLocaleString()}`;
      }
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

  const getLocationFull = (project: Project): string => {
    if (project.location_address && project.location_state && project.location_country) {
      return `${project.location_address}, ${project.location_state}, ${project.location_country}`;
    }
    return project.location || 'N/A';
  };

  const handleUploadDocuments = async () => {
    if (!project || userRole !== 'company') return;

    const missingRequired = [
      !project.drawing_architectural_url && !drawingFiles.architectural,
      !project.drawing_structural_url && !drawingFiles.structural,
      !project.drawing_mechanical_url && !drawingFiles.mechanical,
      !project.drawing_technical_url && !drawingFiles.technical,
    ].some(Boolean);

    if (missingRequired) {
      toast.error('Please upload all required drawings before saving.');
      return;
    }

    try {
      setIsUploadingDocuments(true);
      const extraDocuments = extraUploads
        .filter((item) => item.title.trim() && item.file)
        .map((item) => ({ title: item.title.trim(), file: item.file as File }));

      await projectService.uploadDocuments(project.id, {
        preview_image: previewImageFile || undefined,
        drawing_architectural: drawingFiles.architectural || undefined,
        drawing_structural: drawingFiles.structural || undefined,
        drawing_mechanical: drawingFiles.mechanical || undefined,
        drawing_technical: drawingFiles.technical || undefined,
        extra_documents: extraDocuments.length > 0 ? extraDocuments : undefined,
      });

      toast.success('Project documents updated successfully.');
      await loadProject();
    } catch (error: any) {
      console.error('Failed to upload project documents:', error);
      toast.error(error.response?.data?.message || 'Failed to upload documents');
    } finally {
      setIsUploadingDocuments(false);
    }
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

  const openDocumentViewer = (url: string, title: string) => {
    setViewerDocumentUrl(url);
    setViewerDocumentTitle(title);
    setViewerModalOpen(true);
  };

  const openRequestUpdateModal = (documentType: string, extraDocId?: string) => {
    setRequestUpdateType(documentType);
    setRequestUpdateExtraDocId(extraDocId || null);
    setRequestUpdateReason('');
    setRequestUpdateModalOpen(true);
  };

  const handleRequestDocumentUpdate = async () => {
    if (!project) {
      console.log('❌ No project in handleRequestDocumentUpdate');
      return;
    }

    console.log('📤 Sending document update request:', {
      projectId: project.id,
      documentType: requestUpdateType,
      extraDocId: requestUpdateExtraDocId,
      reason: requestUpdateReason
    });

    try {
      setIsRequestingUpdate(true);
      const response = await projectService.requestDocumentUpdate(
        project.id,
        requestUpdateType,
        requestUpdateExtraDocId || undefined,
        requestUpdateReason || undefined
      );
      console.log('✅ Request sent successfully:', response);
      toast.success('Update request submitted successfully. Waiting for client approval.');
      setRequestUpdateModalOpen(false);
      setRequestUpdateReason('');
      console.log('🔄 Reloading project...');
      await loadProject();
      console.log('✅ Project reloaded');
    } catch (error: any) {
      console.error('❌ Failed to request document update:', error);
      toast.error(error.response?.data?.message || 'Failed to submit update request');
    } finally {
      setIsRequestingUpdate(false);
    }
  };

  const canUpdateDocument = (documentType: string): boolean => {
    if (!project || userRole !== 'company') return false;
    
    // For main documents, check if document exists
    const mainDocTypes = ['preview_image', 'drawing_architectural', 'drawing_structural', 'drawing_mechanical', 'drawing_technical'];
    if (mainDocTypes.includes(documentType)) {
      const fieldName = documentType === 'preview_image' ? 'preview_image_url' : documentType + '_url';
      return !project[fieldName as keyof Project]; // Can update if document doesn't exist
    }
    
    return true; // For extra documents, can always add new ones
  };

  const hasPendingRequest = (documentType: string, extraDocId?: string): any => {
    if (!project) {
      return null;
    }
    
    // Check both camelCase and snake_case property names
    const requests = project.documentUpdateRequests || (project as any).document_update_requests;
    
    if (!requests || !Array.isArray(requests)) {
      return null;
    }
    
    const found = requests.find((req: any) => {
      const typeMatch = req.document_type === documentType;
      const statusMatch = req.status === 'pending';
      const extraDocMatch = extraDocId 
        ? req.extra_document_id === extraDocId 
        : !req.extra_document_id;
      
      return typeMatch && statusMatch && extraDocMatch;
    });
    
    return found || null;
  };

  const getDocumentUpdateRequests = (): any[] => {
    if (!project) {
      return [];
    }
    
    // Check both camelCase and snake_case property names
    const requests = project.documentUpdateRequests || (project as any).document_update_requests;
    
    if (!requests || !Array.isArray(requests)) {
      return [];
    }
    
    return requests.filter((req: any) => req.status === 'pending');
  };

  const handleGrantDocumentUpdate = async (requestId: string) => {
    try {
      await projectService.grantDocumentUpdate(requestId);
      toast.success('Document update request granted successfully.');
      await loadProject();
    } catch (error: any) {
      console.error('Failed to grant document update:', error);
      toast.error(error.response?.data?.message || 'Failed to grant request');
    }
  };

  const handleDenyDocumentUpdate = async (requestId: string) => {
    try {
      await projectService.denyDocumentUpdate(requestId);
      toast.success('Document update request denied.');
      await loadProject();
    } catch (error: any) {
      console.error('Failed to deny document update:', error);
      toast.error(error.response?.data?.message || 'Failed to deny request');
    }
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
  const previewImageUrl = previewImagePreview || project.preview_image_url || null;
  
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
      
      {/* Header + Progress */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
          <div className="relative h-48 lg:h-full">
            {previewImageUrl ? (
              <img
                src={previewImageUrl}
                alt="Project preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[#F8FAFC] flex flex-col items-center justify-center text-[#64748B] border-b border-[#E5E7EB] lg:border-b-0 lg:border-r">
                <ImageIcon className="w-10 h-10 mb-2" />
                <span className="text-xs font-medium">Project preview not set</span>
              </div>
            )}
          </div>
          <div className="p-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#94A3B8] mb-1">Project</p>
                <h1 className="text-2xl font-semibold text-[#334155]">{project.title}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={project.status} />
                {(userRole === 'client' || userRole === 'company') &&
                 project.status !== 'completed' &&
                 milestones.length > 0 &&
                 milestones.every(m => m.status === 'released') && (
                  <Button
                    onClick={async () => {
                      try {
                        setIsProcessing(true);
                        if (userRole === 'client') {
                          await projectService.complete(project.id);
                        } else if (userRole === 'company') {
                          await projectService.completeForCompany(project.id);
                        }
                        toast.success('Project marked as completed!');
                        loadProject();
                      } catch (error: any) {
                        console.error('Failed to complete project:', error);
                        toast.error(error.response?.data?.message || 'Failed to mark project as completed');
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-[#16A34A] to-[#22C55E] hover:from-[#15803D] hover:to-[#16A34A] text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isProcessing ? 'Completing...' : 'Mark as Completed'}
                  </Button>
                )}
              </div>
            </div>
            <div className="bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] p-4">
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
          </div>
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
                        <p className="text-sm font-medium text-[#334155]">{getLocationFull(project)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-[#1E3A8A]" />
                      </div>
                      <div>
                        <p className="text-xs text-[#64748B] mb-1">Budget</p>
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
                  <h3 className="text-lg font-semibold text-[#334155]">
                    {userRole === 'company' ? 'Client' : 'Company'}
                  </h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {userRole === 'company' ? (
                    <>
                      <div>
                        <p className="text-xs text-[#64748B] mb-1">Client Name</p>
                        <p className="text-sm text-[#334155] font-semibold">
                          {project.client?.name || 'N/A'}
                        </p>
                      </div>
                      {project.client?.email && (
                        <div>
                          <p className="text-xs text-[#64748B] mb-1">Email</p>
                          <a
                            href={`mailto:${project.client.email}`}
                            className="text-sm text-[#1E3A8A] hover:text-[#1D4ED8] font-medium"
                          >
                            {project.client.email}
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
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
                      
                      {userRole === 'admin' && project.company?.registration_number && (
                        <div>
                          <p className="text-xs text-[#64748B] mb-1">Registration Number</p>
                          <p className="text-sm text-[#334155] font-medium">{project.company.registration_number}</p>
                        </div>
                      )}
                    </>
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

      {/* Document Update Requests - Client Side */}
      {userRole === 'client' && getDocumentUpdateRequests().length > 0 && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg">
          <div className="border-b border-[#E5E7EB] pb-4 px-6 pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
              <h3 className="text-lg font-semibold text-[#334155]">Document Update Requests</h3>
            </div>
            <p className="text-xs text-[#64748B] mt-2">
              The company has requested permission to update the following documents. Please review and approve or deny each request.
            </p>
          </div>
          <div className="p-6 space-y-4">
            {getDocumentUpdateRequests().map((request: any) => {
              const getDocumentName = () => {
                switch (request.document_type) {
                  case 'preview_image':
                    return 'Project Preview Image';
                  case 'drawing_architectural':
                    return 'Architectural Drawing';
                  case 'drawing_structural':
                    return 'Structural Drawing';
                  case 'drawing_mechanical':
                    return 'Mechanical Drawing';
                  case 'drawing_technical':
                    return 'Technical Drawing';
                  case 'extra_document':
                    return request.extra_document?.title || 'Extra Document';
                  default:
                    return 'Document';
                }
              };

              return (
                <div
                  key={request.id}
                  className="bg-[#FEF3C7] border border-[#FCD34D] rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-[#92400E]" />
                        <h4 className="text-sm font-semibold text-[#334155]">
                          {getDocumentName()}
                        </h4>
                      </div>
                      {request.reason && (
                        <p className="text-xs text-[#64748B] mb-2">
                          <span className="font-medium">Reason:</span> {request.reason}
                        </p>
                      )}
                      <p className="text-xs text-[#64748B]">
                        Requested by: {request.company?.company_name || request.requested_by?.name || 'Company'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleGrantDocumentUpdate(request.id)}
                        className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDenyDocumentUpdate(request.id)}
                        className="border-[#DC2626] text-[#DC2626] hover:bg-[#FEE2E2] text-xs"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Deny
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Project Files */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg">
        <div className="border-b border-[#E5E7EB] pb-4 px-6 pt-6">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-[#1E3A8A]" />
            <h3 className="text-lg font-semibold text-[#334155]">Project Files</h3>
          </div>
          <p className="text-xs text-[#64748B] mt-2">
            {userRole === 'company'
              ? 'Upload required drawings and supporting documents for this project.'
              : 'Review project drawings and documents shared by the company.'}
          </p>
        </div>
        <div className="p-6 space-y-8">
          {/* Enable/Disable Toggle */}
          {userRole === 'company' && (
            <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
              <div>
                <p className="text-sm font-semibold text-[#334155]">Document Management</p>
                <p className="text-xs text-[#64748B]">Enable or disable document uploads</p>
              </div>
              <button
                onClick={() => setDocumentsEnabled(!documentsEnabled)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  documentsEnabled
                    ? 'bg-[#D1FAE5] text-[#065F46] hover:bg-[#A7F3D0]'
                    : 'bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FECACA]'
                }`}
              >
                {documentsEnabled ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span className="text-sm font-medium">{documentsEnabled ? 'Enabled' : 'Disabled'}</span>
              </button>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-[#334155]">Project Preview Image</p>
                <p className="text-xs text-[#64748B]">Upload the final look of the project.</p>
              </div>
              {userRole === 'company' && project.preview_image_url && !canUpdateDocument('preview_image') && (
                <div className="flex justify-end">
                  {hasPendingRequest('preview_image') ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEF3C7] text-[#92400E] text-xs font-medium border border-[#FCD34D]">
                      <Clock className="w-3 h-3" />
                      Request Awaiting Approval
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openRequestUpdateModal('preview_image')}
                      className="text-xs"
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Request Update
                    </Button>
                  )}
                </div>
              )}
            </div>
            <FilePreviewInput
              label="Project Preview"
              value={previewImageFile || project.preview_image_url || null}
              onChange={setPreviewImageFile}
              accept="image/png,image/jpeg,.png,.jpg,.jpeg"
              disabled={userRole !== 'company' || !documentsEnabled}
              onView={() => project.preview_image_url && openDocumentViewer(project.preview_image_url, 'Project Preview Image')}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[#334155]">Required Drawings</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {userRole === 'company' && project.drawing_architectural_url && !canUpdateDocument('drawing_architectural') && (
                  <div className="mb-2 flex justify-end">
                    {hasPendingRequest('drawing_architectural') ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEF3C7] text-[#92400E] text-xs font-medium border border-[#FCD34D]">
                        <Clock className="w-3 h-3" />
                        Request Awaiting Approval
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openRequestUpdateModal('drawing_architectural')}
                        className="text-xs"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Request Update
                      </Button>
                    )}
                  </div>
                )}
                <FilePreviewInput
                  label="Architectural Drawing"
                  value={drawingFiles.architectural || project.drawing_architectural_url || null}
                  onChange={(file) => setDrawingFiles((prev) => ({ ...prev, architectural: file }))}
                  disabled={userRole !== 'company' || !documentsEnabled}
                  onView={() => project.drawing_architectural_url && openDocumentViewer(project.drawing_architectural_url, 'Architectural Drawing')}
                />
              </div>
              <div>
                {userRole === 'company' && project.drawing_structural_url && !canUpdateDocument('drawing_structural') && (
                  <div className="mb-2 flex justify-end">
                    {hasPendingRequest('drawing_structural') ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEF3C7] text-[#92400E] text-xs font-medium border border-[#FCD34D]">
                        <Clock className="w-3 h-3" />
                        Request Awaiting Approval
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openRequestUpdateModal('drawing_structural')}
                        className="text-xs"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Request Update
                      </Button>
                    )}
                  </div>
                )}
                <FilePreviewInput
                  label="Structural Drawing"
                  value={drawingFiles.structural || project.drawing_structural_url || null}
                  onChange={(file) => setDrawingFiles((prev) => ({ ...prev, structural: file }))}
                  disabled={userRole !== 'company' || !documentsEnabled}
                  onView={() => project.drawing_structural_url && openDocumentViewer(project.drawing_structural_url, 'Structural Drawing')}
                />
              </div>
              <div>
                {userRole === 'company' && project.drawing_mechanical_url && !canUpdateDocument('drawing_mechanical') && (
                  <div className="mb-2 flex justify-end">
                    {hasPendingRequest('drawing_mechanical') ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEF3C7] text-[#92400E] text-xs font-medium border border-[#FCD34D]">
                        <Clock className="w-3 h-3" />
                        Request Awaiting Approval
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openRequestUpdateModal('drawing_mechanical')}
                        className="text-xs"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Request Update
                      </Button>
                    )}
                  </div>
                )}
                <FilePreviewInput
                  label="Mechanical Drawing"
                  value={drawingFiles.mechanical || project.drawing_mechanical_url || null}
                  onChange={(file) => setDrawingFiles((prev) => ({ ...prev, mechanical: file }))}
                  disabled={userRole !== 'company' || !documentsEnabled}
                  onView={() => project.drawing_mechanical_url && openDocumentViewer(project.drawing_mechanical_url, 'Mechanical Drawing')}
                />
              </div>
              <div>
                {userRole === 'company' && project.drawing_technical_url && !canUpdateDocument('drawing_technical') && (
                  <div className="mb-2 flex justify-end">
                    {hasPendingRequest('drawing_technical') ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEF3C7] text-[#92400E] text-xs font-medium border border-[#FCD34D]">
                        <Clock className="w-3 h-3" />
                        Request Awaiting Approval
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openRequestUpdateModal('drawing_technical')}
                        className="text-xs"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Request Update
                      </Button>
                    )}
                  </div>
                )}
                <FilePreviewInput
                  label="Technical Drawing"
                  value={drawingFiles.technical || project.drawing_technical_url || null}
                  onChange={(file) => setDrawingFiles((prev) => ({ ...prev, technical: file }))}
                  disabled={userRole !== 'company' || !documentsEnabled}
                  onView={() => project.drawing_technical_url && openDocumentViewer(project.drawing_technical_url, 'Technical Drawing')}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-[#334155]">Other Documents (Optional)</p>
                <p className="text-xs text-[#64748B]">Add any additional files related to the project.</p>
              </div>
              {userRole === 'company' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setExtraUploads((prev) => [
                      ...prev,
                      { id: `extra-${Date.now()}-${prev.length}`, title: '', file: null },
                    ])
                  }
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add File
                </Button>
              )}
            </div>

            {project.documents && project.documents.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {project.documents.map((doc) => (
                  <div key={doc.id}>
                    {userRole === 'company' && (
                      <div className="mb-2 flex justify-end">
                        {hasPendingRequest('extra_document', doc.id) ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEF3C7] text-[#92400E] text-xs font-medium border border-[#FCD34D]">
                            <Clock className="w-3 h-3" />
                            Request Awaiting Approval
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRequestUpdateModal('extra_document', doc.id)}
                            className="text-xs"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Request Update
                          </Button>
                        )}
                      </div>
                    )}
                    <FilePreviewInput
                      label={doc.title}
                      value={doc.file_url}
                      onChange={() => {}}
                      disabled={userRole === 'company' ? !documentsEnabled : true}
                      onView={() => openDocumentViewer(doc.file_url, doc.title)}
                    />
                  </div>
                ))}
              </div>
            )}

            {extraUploads.length > 0 && (
              <div className="space-y-4">
                {extraUploads.map((item, index) => (
                  <div key={item.id} className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <input
                        value={item.title}
                        onChange={(e) =>
                          setExtraUploads((prev) =>
                            prev.map((entry, idx) =>
                              idx === index ? { ...entry, title: e.target.value } : entry
                            )
                          )
                        }
                        placeholder="Document title"
                        className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none text-sm"
                        disabled={userRole !== 'company' || !documentsEnabled}
                      />
                      {userRole === 'company' && (
                        <button
                          type="button"
                          onClick={() =>
                            setExtraUploads((prev) => prev.filter((entry) => entry.id !== item.id))
                          }
                          className="text-[#DC2626] hover:text-[#B91C1C] text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <FilePreviewInput
                      label="Upload File"
                      value={item.file}
                      onChange={(file) =>
                        setExtraUploads((prev) =>
                          prev.map((entry, idx) =>
                            idx === index ? { ...entry, file } : entry
                          )
                        )
                      }
                      disabled={userRole !== 'company' || !documentsEnabled}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {userRole === 'company' && documentsEnabled && (
            <div className="flex justify-end">
              <Button
                onClick={handleUploadDocuments}
                disabled={isUploadingDocuments}
                className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all"
              >
                {isUploadingDocuments ? 'Saving...' : 'Save Documents'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={viewerModalOpen}
        onClose={() => {
          setViewerModalOpen(false);
          setViewerDocumentUrl(null);
          setViewerDocumentTitle('');
        }}
        documentUrl={viewerDocumentUrl || ''}
        documentTitle={viewerDocumentTitle}
      />

      {/* Request Document Update Modal */}
      <Modal
        isOpen={requestUpdateModalOpen}
        onClose={() => {
          setRequestUpdateModalOpen(false);
          setRequestUpdateType('');
          setRequestUpdateExtraDocId(null);
          setRequestUpdateReason('');
        }}
        title="Request Document Update"
        primaryAction={{
          label: isRequestingUpdate ? 'Submitting...' : 'Submit Request',
          onClick: handleRequestDocumentUpdate,
          disabled: isRequestingUpdate,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => {
            setRequestUpdateModalOpen(false);
            setRequestUpdateType('');
            setRequestUpdateExtraDocId(null);
            setRequestUpdateReason('');
          },
          disabled: isRequestingUpdate,
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-[#64748B]">
            You are requesting permission to update this document. The client will need to approve your request before you can upload a new version.
          </p>
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-2">
              Reason (Optional)
            </label>
            <textarea
              value={requestUpdateReason}
              onChange={(e) => setRequestUpdateReason(e.target.value)}
              placeholder="Explain why you need to update this document..."
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none transition-colors text-sm text-[#334155] placeholder:text-[#64748B] resize-vertical"
            />
          </div>
        </div>
      </Modal>

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
