import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FolderKanban, DollarSign, Clock, AlertCircle, Video, Mail, FileText, Zap, Plus, BarChart3, TrendingUp, User, ArrowRight } from 'lucide-react';
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
  
  // Helper function to parse formatted money string back to number
  const parseMoneyAmount = (amount: string | number | null | undefined): number => {
    if (amount === null || amount === undefined) return 0;
    if (typeof amount === 'number') return amount;
    // Remove currency symbol, thousand separators, and parse
    const cleaned = String(amount).replace(/[₦,\s]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Calculate escrow balance (sum of funded but not released escrows)
  const escrowBalance = projects.reduce((total, project) => {
    if (!project.milestones) return total;
    return total + project.milestones.reduce((milestoneTotal, milestone) => {
      if (milestone.escrow && milestone.escrow.status === 'held') {
        return milestoneTotal + parseMoneyAmount(milestone.escrow.amount);
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
  
  // Calculate sent and scheduled counts for consultations
  const sentConsultations = consultations.filter(c => c.status === 'completed').length;
  const scheduledConsultations = consultations.filter(c => c.status === 'scheduled').length;
  
  const sentProjects = projects.filter(p => p.status === 'active').length;
  const scheduledProjects = projects.filter(p => p.status === 'draft').length;

  const stats = [
    {
      label: 'Active Consultations',
      value: activeConsultations.toString(),
      icon: <Video className="w-6 h-6" />,
      gradient: 'from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9]',
      bgGradient: 'bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9]',
      iconBg: 'bg-white/20',
      change: '0%',
      subtitle: `${consultations.length} total`,
      folders: `${consultations.length} folders`,
    },
    {
      label: 'Consultations',
      value: consultations.length.toString(),
      icon: <Mail className="w-6 h-6" />,
      gradient: 'from-[#1E3A8A] via-[#2563EB] to-[#3B82F6]',
      bgGradient: 'bg-white',
      iconBg: 'bg-[#1E3A8A]/10',
      change: '0%',
      sent: `${sentConsultations} sent`,
      scheduled: `${scheduledConsultations} scheduled`,
      textColor: 'text-[#1E3A8A]',
    },
    {
      label: 'Active Projects',
      value: activeProjects.toString(),
      icon: <FileText className="w-6 h-6" />,
      gradient: 'from-[#F59E0B] via-[#D97706] to-[#B45309]',
      bgGradient: 'bg-white',
      iconBg: 'bg-[#F59E0B]/10',
      change: '0%',
      sent: `${sentProjects} sent`,
      scheduled: `${scheduledProjects} scheduled`,
      textColor: 'text-[#F59E0B]',
    },
  ];
  
  // Show company profile error message
  if (companyProfileError) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155] mb-2">Dashboard</h1>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-[#F59E0B] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[#334155] mb-2">Company Profile Required</h2>
            <p className="text-sm text-[#64748B] mb-6">
              You need to create your company profile before you can access consultations and projects.
            </p>
            <button
              onClick={() => navigate('/settings')}
              className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors bg-[#1E3A8A] text-white hover:bg-[#1D4ED8] px-4 py-2 text-sm"
            >
              Go to Settings
            </button>
          </div>
        </div>
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
  
  // Get recent responses (completed consultations)
  const recentResponses = consultations
    .filter((c) => c.status === 'completed' || c.is_completed)
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 4);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMonths = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    if (diffInMonths === 0) return 'Less than a month ago';
    if (diffInMonths === 1) return '1 month ago';
    return `${diffInMonths} months ago`;
  };

  return (
    <div className="space-y-6 bg-[#F5F5F5] min-h-screen p-6">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* First Card - Blue Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#1E40AF] shadow-lg">
          <div className="p-6 text-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium mb-2 opacity-90">Active Consultations</p>
                <p className="text-4xl font-bold mb-1">{activeConsultations}</p>
                <div className="flex items-center gap-2 text-xs opacity-80">
                  <TrendingUp className="w-3 h-3" />
                  <span>0%</span>
                </div>
                <p className="text-xs mt-2 opacity-80">{consultations.length} folders</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Video className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Second Card - White with Blue */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[#1E3A8A] mb-2">Consultations</p>
              <p className="text-4xl font-bold text-[#1E3A8A] mb-3">{consultations.length}</p>
              <div className="space-y-1">
                <p className="text-sm text-[#1E3A8A]">{sentConsultations} sent</p>
                <p className="text-sm text-[#F59E0B]">{scheduledConsultations} scheduled</p>
              </div>
            </div>
            <div className="w-16 h-16 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-[#1E3A8A]" />
            </div>
          </div>
        </div>

        {/* Third Card - White with Orange */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[#F59E0B] mb-2">Active Projects</p>
              <p className="text-4xl font-bold text-[#F59E0B] mb-3">{activeProjects}</p>
              <div className="space-y-1">
                <p className="text-sm text-[#F59E0B]">{sentProjects} sent</p>
                <p className="text-sm text-[#F59E0B]">{scheduledProjects} scheduled</p>
              </div>
            </div>
            <div className="w-16 h-16 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
              <FileText className="w-8 h-8 text-[#F59E0B]" />
            </div>
          </div>
        </div>

        {/* Fourth Card - White with Blue (Escrow Balance) */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[#1E3A8A] mb-2">Escrow Balance</p>
              <p className="text-4xl font-bold text-[#1E3A8A] mb-3">₦{escrowBalance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <div className="space-y-1">
                <p className="text-sm text-[#64748B]">Held in escrow</p>
                <p className="text-sm text-[#1E3A8A]">{pendingApprovals} pending</p>
              </div>
            </div>
            <div className="w-16 h-16 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-[#1E3A8A]" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Responses - Left Side (2 columns) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg">
            <div className="border-b border-[#E5E7EB] pb-4 px-6 pt-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#EC4899]" />
                <h3 className="text-lg font-semibold text-[#334155]">Recent Responses</h3>
              </div>
            </div>
            <div className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">USER</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">EMAIL</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">TIME</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#E5E7EB]">
                    {recentResponses.length > 0 ? (
                      recentResponses.map((consultation) => (
                        <tr key={consultation.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-[#1E3A8A]" />
                              </div>
                              <span className="text-sm font-medium text-[#334155]">
                                {consultation.client?.name || consultation.company?.company_name || 'Anonymous'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-[#64748B]">
                              {consultation.client?.email || consultation.company?.user?.email || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-[#64748B]">
                              {formatTimeAgo(consultation.updated_at || consultation.created_at)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status="completed" />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-sm text-[#64748B]">
                          No recent responses
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {recentResponses.length > 0 && (
                <div className="px-6 py-4 border-t border-[#E5E7EB]">
                  <button
                    onClick={() => navigate('/consultations')}
                    className="flex items-center gap-2 text-sm font-medium text-[#EC4899] hover:text-[#DB2777] transition-colors"
                  >
                    View all responses
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions - Right Side (1 column) */}
        <div className="space-y-4">
          {/* Quick Actions Header */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1E3A8A]/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#1E3A8A]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#334155]">Quick Actions</h3>
                  <p className="text-xs text-[#64748B]">Create a new campaign</p>
                </div>
              </div>
          </div>

          {/* Quick Actions Main Card */}
          <div className="bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] rounded-xl border border-[#E5E7EB] shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Quick Actions</h3>
                    <p className="text-sm opacity-90">Get things done faster</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{pendingActions.length}</p>
                  <Zap className="w-4 h-4 mx-auto mt-1" />
                </div>
              </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Create Consultation */}
            <button
              onClick={() => navigate('/consultations')}
              className="bg-gradient-to-br from-[#16A34A] to-[#15803D] rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <div className="flex flex-col items-center gap-2">
                <Video className="w-6 h-6" />
                <div className="text-center">
                  <p className="text-xs font-semibold">Create Consultation</p>
                  <p className="text-xs opacity-90">New booking</p>
                </div>
              </div>
            </button>

            {/* Create Project */}
            <button
              onClick={() => navigate('/projects')}
              className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <div className="flex flex-col items-center gap-2">
                <Plus className="w-6 h-6" />
                <div className="text-center">
                  <p className="text-xs font-semibold">Create Project</p>
                  <p className="text-xs opacity-90">New campaign</p>
                </div>
              </div>
            </button>

            {/* View Projects */}
            <button
              onClick={() => navigate('/projects')}
              className="bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-6 h-6" />
                <div className="text-center">
                  <p className="text-xs font-semibold">View Projects</p>
                  <p className="text-xs opacity-90">All projects</p>
                </div>
              </div>
            </button>

            {/* View Analytics */}
            <button
              onClick={() => navigate('/consultations')}
              className="bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <div className="flex flex-col items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                <div className="text-center">
                  <p className="text-xs font-semibold">View Analytics</p>
                  <p className="text-xs opacity-90">Reports</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
