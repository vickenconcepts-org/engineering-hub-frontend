import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FolderKanban, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { consultationService, Consultation } from '../services/consultation.service';
import { projectService, Project } from '../services/project.service';

interface DashboardPageProps {
  userRole?: 'client' | 'company' | 'admin' | null;
}

export function DashboardPage({ userRole }: DashboardPageProps) {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [companyProfileError, setCompanyProfileError] = useState(false);
  
  useEffect(() => {
    loadData();
  }, [userRole]);
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      setCompanyProfileError(false);
      
      // Use role-specific endpoints
      if (userRole === 'company') {
        try {
          const [consultationsData, projectsData] = await Promise.all([
            consultationService.listForCompany({ per_page: 10 }),
            projectService.listForCompany({ per_page: 10 }),
          ]);
          
          setConsultations(consultationsData.consultations);
          setProjects(projectsData.projects);
        } catch (error: any) {
          // Check if it's a company profile not found error
          if (error.response?.status === 404 && error.response?.data?.message?.includes('Company profile not found')) {
            setCompanyProfileError(true);
          } else {
            throw error;
          }
        }
      } else if (userRole === 'client') {
        const [consultationsData, projectsData] = await Promise.all([
          consultationService.list({ per_page: 10 }),
          projectService.list({ per_page: 10 }),
        ]);
        
        setConsultations(consultationsData.consultations);
        setProjects(projectsData.projects);
      } else {
        // Admin or unknown role - skip loading for now
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate stats
  const activeConsultations = consultations.filter(
    (c) => c.status === 'scheduled' && !c.is_completed
  ).length;
  
  const activeProjects = projects.filter(
    (p) => p.status === 'active' || p.status === 'draft'
  ).length;
  
  // Calculate escrow balance (sum of funded but not released escrows)
  const escrowBalance = projects.reduce((total, project) => {
    if (!project.milestones) return total;
    return total + project.milestones.reduce((milestoneTotal, milestone) => {
      if (milestone.escrow && milestone.escrow.status === 'held') {
        return milestoneTotal + milestone.escrow.amount;
}
      return milestoneTotal;
    }, 0);
  }, 0);
  
  // Calculate pending approvals (milestones submitted but not approved)
  const pendingApprovals = projects.reduce((total, project) => {
    if (!project.milestones) return total;
    return total + project.milestones.filter(
      (m) => m.status === 'submitted'
    ).length;
  }, 0);
  
  // Get recent consultations (upcoming scheduled ones)
  const recentConsultations = consultations
    .filter((c) => c.status === 'scheduled' && !c.is_completed)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 5);
  
  // Get active projects
  const activeProjectsList = projects
    .filter((p) => p.status === 'active' || p.status === 'draft')
    .slice(0, 5);
  
  // Get pending milestones for actions
  const pendingActions = projects.flatMap((project) => {
    if (!project.milestones) return [];
    return project.milestones
      .filter((m) => m.status === 'submitted')
      .map((milestone) => ({
        id: milestone.id,
        title: `Review ${milestone.title} Milestone`,
        project: project.title,
        projectId: project.id,
        milestoneId: milestone.id,
        type: 'approval' as const,
      }));
  });
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const calculateProjectProgress = (project: Project): number => {
    if (!project.milestones || project.milestones.length === 0) return 0;
    
    const completedMilestones = project.milestones.filter(
      (m) => m.status === 'approved' || m.status === 'released'
    ).length;
    
    return Math.round((completedMilestones / project.milestones.length) * 100);
  };
  
  const stats = [
    {
      label: 'Active Consultations',
      value: activeConsultations.toString(),
      icon: <Calendar className="w-5 h-5" />,
      color: 'text-[#2563EB]',
      bgColor: 'bg-[#DBEAFE]',
    },
    {
      label: 'Active Projects',
      value: activeProjects.toString(),
      icon: <FolderKanban className="w-5 h-5" />,
      color: 'text-[#16A34A]',
      bgColor: 'bg-[#D1FAE5]',
    },
    {
      label: 'Escrow Balance',
      value: `₦${escrowBalance.toLocaleString()}`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-[#1E3A8A]',
      bgColor: 'bg-[#DBEAFE]',
    },
    {
      label: 'Pending Approvals',
      value: pendingApprovals.toString(),
      icon: <Clock className="w-5 h-5" />,
      color: 'text-[#F59E0B]',
      bgColor: 'bg-[#FEF3C7]',
    },
  ];
  
  // Show company profile error message
  if (companyProfileError) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155] mb-2">Dashboard</h1>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-[#F59E0B] mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[#334155] mb-2">Company Profile Required</h2>
              <p className="text-sm text-[#64748B] mb-6">
                You need to create your company profile before you can access consultations and projects.
              </p>
              <Button onClick={() => navigate('/settings')} className="bg-[#1E3A8A] text-white">
                Go to Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155] mb-2">Dashboard</h1>
          <p className="text-sm text-[#64748B]">Welcome back! Here's an overview of your projects.</p>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
          <p className="text-sm text-[#64748B]">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#334155] mb-2">Dashboard</h1>
        <p className="text-sm text-[#64748B]">Welcome back! Here's an overview of your projects.</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl font-semibold text-[#334155]">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Consultations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Consultations</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/consultations')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentConsultations.map((consultation) => (
                <div
                  key={consultation.id}
                  onClick={() => navigate(`/consultations/${consultation.id}`)}
                  className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg hover:bg-[#E5E7EB] cursor-pointer transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-[#334155]">
                      {consultation.company?.company_name || 'Company'}
                    </p>
                    <p className="text-xs text-[#64748B] mt-1">{formatDate(consultation.scheduled_at)}</p>
                  </div>
                  <StatusBadge status={consultation.status} />
                </div>
              ))}
              
              {recentConsultations.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-[#64748B] mb-4">No upcoming consultations</p>
                  <Button onClick={() => navigate('/consultations')}>
                    Book Consultation
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Active Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Projects</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/projects')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeProjectsList.map((project) => {
                const progress = calculateProjectProgress(project);
                return (
                <div
                  key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  className="p-4 bg-[#F8FAFC] rounded-lg hover:bg-[#E5E7EB] cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-[#334155]">
                          {project.title}
                        </p>
                        <p className="text-xs text-[#64748B] mt-1">
                          {project.company?.company_name || 'Company'}
                      </p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#64748B]">Progress</span>
                        <span className="text-xs font-medium text-[#334155]">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#16A34A] rounded-full"
                          style={{ width: `${progress}%` }}
                      />
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {activeProjectsList.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-[#64748B]">No active projects</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Pending Actions */}
      {pendingActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Actions Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-4 bg-[#FEF3C7] rounded-lg border border-[#F59E0B]/20"
                >
                  <div>
                    <p className="text-sm font-medium text-[#334155]">{action.title}</p>
                    <p className="text-xs text-[#64748B] mt-1">{action.project}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/projects/${action.projectId}#milestone-${action.milestoneId}`)}
                  >
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
