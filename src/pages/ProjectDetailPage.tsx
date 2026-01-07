import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Building2, DollarSign, Calendar, MapPin, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { projectService, Project } from '../services/project.service';
import { milestoneService } from '../services/milestone.service';
import { Milestone } from '../services/project.service';

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
        return total + m.escrow.amount;
      }
      return total;
    }, 0) || 0,
    released: project.milestones?.reduce((total, m) => {
      if (m.escrow && m.escrow.status === 'released') {
        return total + m.escrow.amount;
      }
      return total;
    }, 0) || 0,
  } : { funded: 0, released: 0 };
  
  const handleFundMilestone = async (milestoneId: string) => {
    try {
      const payment = await milestoneService.fundEscrow(milestoneId);
      window.location.href = payment.payment_url;
    } catch (error) {
      console.error('Failed to fund milestone:', error);
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
      <div className="space-y-6">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#334155]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
          <p className="text-sm text-[#64748B]">Loading project...</p>
        </div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#334155]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-sm text-[#64748B]">Project not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const progress = calculateProjectProgress(project);
  const milestones = project.milestones || [];
  
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#334155]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </button>
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155] mb-2">
            {project.title}
          </h1>
          <p className="text-sm text-[#64748B]">Project ID: #{project.id}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>
      
      {/* Progress Bar */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#334155]">Overall Progress</span>
            <span className="text-sm font-medium text-[#334155]">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-[#E5E7EB] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#16A34A] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs */}
      <div className="border-b border-[#E5E7EB]">
        <div className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'milestones', label: 'Milestones' },
            { id: 'escrow', label: 'Escrow' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#1E3A8A] text-[#1E3A8A]'
                  : 'border-transparent text-[#64748B] hover:text-[#334155]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.description && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                      Description
                    </p>
                    <p className="text-sm text-[#334155]">{project.description}</p>
                  </div>
                  )}
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-[#64748B] mt-0.5" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                          Created Date
                        </p>
                        <p className="text-sm text-[#334155]">{formatDate(project.created_at)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[#64748B] mt-0.5" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                          Location
                        </p>
                        <p className="text-sm text-[#334155]">{project.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-[#64748B] mt-0.5" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                          Budget Range
                        </p>
                        <p className="text-sm text-[#334155]">
                          {formatBudget(project)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                      Company Name
                    </p>
                    <p className="text-sm text-[#334155] font-medium">
                      {project.company?.company_name || 'N/A'}
                    </p>
                  </div>
                  
                  {project.company?.user && (
                    <>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                      Contact Person
                    </p>
                        <p className="text-sm text-[#334155]">{project.company.user.name}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                      Email
                    </p>
                    <a
                          href={`mailto:${project.company.user.email}`}
                      className="text-sm text-[#1E3A8A] hover:text-[#1D4ED8]"
                    >
                          {project.company.user.email}
                    </a>
                  </div>
                    </>
                  )}
                  
                  {project.company?.registration_number && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                        Registration Number
                    </p>
                      <p className="text-sm text-[#334155]">{project.company.registration_number}</p>
                  </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          {/* Company: Create Milestones for Draft Projects */}
          {userRole === 'company' && project?.status === 'draft' && milestones.length === 0 && (
            <Card>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-sm text-[#64748B] mb-4">No milestones yet. Create milestones to activate this project.</p>
                  <Button onClick={() => navigate(`/projects/${projectId}/create-milestones`)}>
                    Create Milestones
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {milestones.length === 0 && !(userRole === 'company' && project?.status === 'draft') ? (
            <Card>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-sm text-[#64748B]">No milestones yet</p>
                </div>
              </CardContent>
            </Card>
          ) : milestones.length > 0 ? (
            milestones.map((milestone) => {
              // Find dispute for this milestone
              const milestoneDispute = project.disputes?.find(d => d.milestone_id === milestone.id);
              
              return (
                <Card
                  key={milestone.id}
                  onClick={() => navigate(`/milestones/${milestone.id}`)}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getMilestoneStatusColor(milestone.status)}`}>
                          {getMilestoneStatusIcon(milestone.status)}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-[#334155] mb-1">
                            {milestone.title}
                          </h3>
                          {milestone.description && (
                            <p className="text-sm text-[#64748B]">{milestone.description}</p>
                          )}
                          
                          {/* Show rejection reason for companies */}
                          {userRole === 'company' && milestone.status === 'rejected' && milestoneDispute && (
                            <div className="mt-2 p-3 bg-[#FEF3C7] rounded-lg border border-[#F59E0B]/20">
                              <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                                Rejection Reason
                              </p>
                              <p className="text-sm text-[#334155] line-clamp-2">
                                {milestoneDispute.reason}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 mt-3 text-sm">
                            <span className="text-[#64748B]">
                              Sequence: {milestone.sequence_order}
                            </span>
                            {milestone.escrow && (
                              <span className="text-[#64748B]">
                                Escrow: {milestone.escrow.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <p className="text-lg font-semibold text-[#334155] mb-2">
                        ₦{milestone.amount.toLocaleString()}
                      </p>
                      <StatusBadge status={milestone.status} />
                      {userRole === 'client' && milestone.status === 'pending' && !milestone.escrow && (
                        <Button
                          size="sm"
                          className="mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFundMilestone(milestone.id);
                          }}
                        >
                          Fund Escrow
                        </Button>
                      )}
                      {userRole === 'company' && milestone.status === 'rejected' && (
                        <Button
                          size="sm"
                          variant="primary"
                          className="mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/milestones/${milestone.id}`);
                          }}
                        >
                          View & Revise
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          ) : null}
        </div>
      )}
      
      {activeTab === 'escrow' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Escrow Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                    Total Funded
                  </p>
                  <p className="text-2xl font-semibold text-[#334155]">
                    ₦{escrowTotals.funded.toLocaleString()}
                  </p>
                </div>
                
                <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#64748B]">Released to Date</span>
                    <span className="text-sm font-medium text-[#16A34A]">
                      ₦{escrowTotals.released.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#64748B]">Remaining in Escrow</span>
                    <span className="text-sm font-medium text-[#1E3A8A]">
                      ₦{(escrowTotals.funded - escrowTotals.released).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {escrowTotals.funded > 0 && (
                <div className="pt-4 border-t border-[#E5E7EB]">
                  <div className="w-full h-3 bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#16A34A] rounded-full"
                        style={{ width: `${(escrowTotals.released / escrowTotals.funded) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#64748B] mt-2">
                      {((escrowTotals.released / escrowTotals.funded) * 100).toFixed(0)}% of funds released
                  </p>
                </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Escrow Protection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-[#64748B]">
                  Your funds are held securely in escrow and only released when you approve completed milestones.
                </p>
                
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#334155]">
                      Funds protected until milestone approval
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#334155]">
                      Evidence-based approval process
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#334155]">
                      Dispute resolution available
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
