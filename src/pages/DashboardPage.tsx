import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FolderKanban, DollarSign, Clock, AlertCircle, Video, Mail, FileText, Zap, Plus, BarChart3, TrendingUp, User, ArrowRight, Building2, ShieldAlert, Scale } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { consultationService, Consultation } from '../services/consultation.service';
import { projectService, Project } from '../services/project.service';
import { parseFormattedAmount, formatAmountWithCurrency } from '../lib/money-utils';
import { companyProfileService } from '../services/company-profile.service';
import { adminService, MilestoneForRelease, Dispute } from '../services/admin.service';
import toast from 'react-hot-toast';

interface DashboardPageProps {
  userRole?: 'client' | 'company' | 'admin' | null;
}

export function DashboardPage({ userRole }: DashboardPageProps) {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [companyProfileError, setCompanyProfileError] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  // Admin dashboard data
  const [adminMilestonesHeld, setAdminMilestonesHeld] = useState<MilestoneForRelease[]>([]);
  const [adminPendingCompanies, setAdminPendingCompanies] = useState<any[]>([]);
  const [adminOpenDisputes, setAdminOpenDisputes] = useState<Dispute[]>([]);
  
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
          const [consultationsData, projectsData, profileData] = await Promise.all([
            consultationService.listForCompany({ per_page: 10 }),
            projectService.listForCompany({ per_page: 10 }),
            companyProfileService.get().catch(() => null), // Don't fail if profile doesn't exist
          ]);
          
          setConsultations(consultationsData.consultations);
          setProjects(projectsData.projects);
          setCompanyProfile(profileData);
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
      } else if (userRole === 'admin') {
        const [milestonesRes, companiesRes, disputesRes] = await Promise.all([
          adminService.listEscrowMilestones({ status: 'held', per_page: 10 }),
          adminService.listCompanies({ status: 'pending', per_page: 10 }),
          adminService.listDisputes({ status: 'open', per_page: 10 }),
        ]);
        setAdminMilestonesHeld(milestonesRes.milestones || []);
        setAdminPendingCompanies(companiesRes.companies || []);
        setAdminOpenDisputes(disputesRes.disputes || []);
      } else {
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
        return milestoneTotal + parseFormattedAmount(milestone.escrow.amount);
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
  
  // Consultation breakdown: completed (done) vs scheduled (upcoming)
  const completedConsultations = consultations.filter(c => c.status === 'completed').length;
  const scheduledConsultations = consultations.filter(c => c.status === 'scheduled').length;
  // Project breakdown: active (in progress) vs draft (not yet started)
  const activeProjectsCount = projects.filter(p => p.status === 'active').length;
  const draftProjectsCount = projects.filter(p => p.status === 'draft').length;

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
      completed: `${completedConsultations} completed`,
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
      active: `${activeProjectsCount} active`,
      draft: `${draftProjectsCount} draft`,
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

  // Admin dashboard: different cards, table, and quick actions
  if (userRole === 'admin') {
    const escrowTotalHeld = adminMilestonesHeld.reduce((sum, m) => sum + (m.escrow?.amount ? parseFormattedAmount(String(m.escrow.amount)) : 0), 0);
    return (
      <div className="space-y-6 min-h-screen">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155] mb-2">Admin Dashboard</h1>
          <p className="text-sm text-[#64748B]">Platform overview and actions requiring your attention.</p>
        </div>

        {/* Admin stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[#64748B] mb-2">Pending Companies</p>
                <p className="text-4xl font-bold text-[#1E3A8A]">{adminPendingCompanies.length}</p>
                <p className="text-xs text-[#64748B] mt-1">Awaiting approval</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-[#1E3A8A]" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[#64748B] mb-2">Escrow to Release</p>
                <p className="text-4xl font-bold text-[#F59E0B]">{adminMilestonesHeld.length}</p>
                <p className="text-xs text-[#64748B] mt-1">₦{escrowTotalHeld.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} held</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[#64748B] mb-2">Open Disputes</p>
                <p className="text-4xl font-bold text-[#DC2626]">{adminOpenDisputes.length}</p>
                <p className="text-xs text-[#64748B] mt-1">Need resolution</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#DC2626]/10 flex items-center justify-center">
                <Scale className="w-6 h-6 text-[#DC2626]" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[#64748B] mb-2">Quick Links</p>
                <p className="text-sm font-semibold text-[#334155]">Platform</p>
                <p className="text-xs text-[#64748B] mt-1">Settings & audit</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#64748B]/10 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-[#64748B]" />
              </div>
            </div>
          </div>
        </div>

        {/* Admin table: Milestones awaiting release */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg overflow-hidden">
          <div className="border-b border-[#E5E7EB] pb-4 px-6 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#334155]">Milestones Awaiting Escrow Release</h3>
              <Button size="sm" variant="primary" onClick={() => navigate('/admin/escrow')}>
                View all
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Milestone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {adminMilestonesHeld.length > 0 ? (
                  adminMilestonesHeld.slice(0, 5).map((m) => (
                    <tr key={m.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-6 py-3 font-medium text-[#334155]">{m.project?.title || '—'}</td>
                      <td className="px-6 py-3 text-[#334155]">{m.title}</td>
                      <td className="px-6 py-3 text-[#64748B]">{m.project?.company?.user?.name || m.project?.company?.company_name || '—'}</td>
                      <td className="px-6 py-3 text-[#334155]">{m.escrow?.amount != null ? formatAmountWithCurrency(m.escrow.amount) : '—'}</td>
                      <td className="px-6 py-3">
                        <Button size="sm" variant="primary" onClick={() => navigate(`/admin/escrow?release=${m.id}`)}>
                          Release
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[#64748B]">No milestones awaiting release</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Admin quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/companies')}
            className="bg-white rounded-xl border border-[#E5E7EB] shadow p-4 text-left hover:shadow-md hover:border-[#1E3A8A]/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1E3A8A]/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#1E3A8A]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#334155]">Review Companies</p>
                <p className="text-xs text-[#64748B]">{adminPendingCompanies.length} pending</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/admin/escrow')}
            className="bg-white rounded-xl border border-[#E5E7EB] shadow p-4 text-left hover:shadow-md hover:border-[#F59E0B]/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#334155]">Release Escrow</p>
                <p className="text-xs text-[#64748B]">{adminMilestonesHeld.length} held</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/admin/disputes')}
            className="bg-white rounded-xl border border-[#E5E7EB] shadow p-4 text-left hover:shadow-md hover:border-[#DC2626]/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#DC2626]/10 flex items-center justify-center">
                <Scale className="w-5 h-5 text-[#DC2626]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#334155]">Resolve Disputes</p>
                <p className="text-xs text-[#64748B]">{adminOpenDisputes.length} open</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/admin/audit-logs')}
            className="bg-white rounded-xl border border-[#E5E7EB] shadow p-4 text-left hover:shadow-md hover:border-[#64748B]/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#64748B]/10 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-[#64748B]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#334155]">Audit Logs</p>
                <p className="text-xs text-[#64748B]">Activity</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6  min-h-screen">
      {/* Suspension Warning Banner for Companies */}
      {userRole === 'company' && companyProfile && companyProfile.status === 'suspended' && (
        <div className="bg-gradient-to-r from-[#DC2626] to-[#EF4444] rounded-xl border border-[#B91C1C] shadow-lg p-6 text-white">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Account Suspended</h3>
              {companyProfile.suspension_reason && (
                <div className="bg-white/10 rounded-lg p-3 mb-4">
                  <p className="text-xs font-medium mb-1 opacity-90">Suspension Reason:</p>
                  <p className="text-sm">{companyProfile.suspension_reason}</p>
                </div>
              )}
              <p className="text-sm opacity-90 mb-4">
                Your company account has been suspended. You cannot receive new consultations or projects, create milestones, or submit work until the suspension is lifted.
                <strong className="block mt-2">To appeal, please contact support. Do not submit multiple appeals.</strong>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    try {
                      await companyProfileService.appealSuspension();
                      toast.success('Appeal submitted successfully. Our support team will review your request and contact you soon.');
                      loadData();
                    } catch (error: any) {
                      toast.error(error.response?.data?.message || 'Failed to submit appeal');
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors px-4 py-2 text-sm bg-white text-[#DC2626] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DC2626]"
                >
                  Contact Support / Appeal Suspension
                </button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/settings')}
                  className="bg-white/20 text-white hover:bg-white/30"
                >
                  View Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
                <p className="text-sm text-[#1E3A8A]">{completedConsultations} completed</p>
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
                <p className="text-sm text-[#F59E0B]">{activeProjectsCount} active</p>
                <p className="text-sm text-[#F59E0B]">{draftProjectsCount} draft</p>
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
              <p className="text-4xl font-bold text-[#1E3A8A] mb-3">₦{escrowBalance.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
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
