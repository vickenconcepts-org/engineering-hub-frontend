import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, TrendingUp, CheckCircle, DollarSign } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Table, Pagination } from '../components/Table';
import { projectService, Project } from '../services/project.service';
import { formatAmountWithCurrency, parseFormattedAmount } from '../lib/money-utils';

interface ProjectsPageProps {
  userRole?: 'client' | 'company' | 'admin' | null;
}

export function ProjectsPage({ userRole }: ProjectsPageProps) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [paginationMeta, setPaginationMeta] = useState({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
  });
  
  useEffect(() => {
    loadProjects();
  }, [currentPage, userRole]);
  
  const loadProjects = async () => {
    try {
      setIsLoading(true);
      // Use role-specific endpoints
      if (userRole === 'company') {
        const { projects: fetchedProjects, meta } = await projectService.listForCompany({
          per_page: 15,
        });
        setProjects(fetchedProjects);
        setPaginationMeta(meta);
      } else if (userRole === 'client') {
        const { projects: fetchedProjects, meta } = await projectService.list({
          per_page: 15,
        });
        setProjects(fetchedProjects);
        setPaginationMeta(meta);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
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
        return `${formatAmountWithCurrency(project.budget_min)}`;
      }
      return `${formatAmountWithCurrency(project.budget_min)} - ${formatAmountWithCurrency(project.budget_max)}`;
    }
    if (project.budget_min) {
      return `${formatAmountWithCurrency(project.budget_min)}+`;
    }
    if (project.budget_max) {
      return `Up to ${formatAmountWithCurrency(project.budget_max)}`;
    }
    return 'Not specified';
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getLocationFull = (project: Project): string => {
    if (project.location_address && project.location_state && project.location_country) {
      return `${project.location_address}, ${project.location_state}, ${project.location_country}`;
    }
    return project.location || 'N/A';
  };

  const getLocationDisplay = (project: Project): string => {
    if (project.location_state && project.location_country) {
      return `${project.location_state}, ${project.location_country}`;
    }
    return project.location || 'N/A';
  };

  const getProjectBadgeStatus = (status: Project['status']) => {
    switch (status) {
      case 'draft':
        return 'pending';
      case 'active':
        return 'active';
      case 'completed':
        return 'completed';
      case 'disputed':
        return 'disputed';
      case 'cancelled':
        return 'rejected';
      default:
        return 'pending';
    }
  };

  const filteredProjects = useMemo(() => {
    const normalizedQuery = filterQuery.trim().toLowerCase();
    return projects.filter((project) => {
      const locationSearch = project.location_address && project.location_state && project.location_country
        ? `${project.location_address} ${project.location_state} ${project.location_country}`
        : (project.location || '');
      const nameMatches = normalizedQuery
        ? `${project.title} ${project.company?.company_name || ''} ${locationSearch}`
            .toLowerCase()
            .includes(normalizedQuery)
        : true;
      const statusMatches = filterStatus === 'all'
        ? true
        : project.status === filterStatus;
      return nameMatches && statusMatches;
    });
  }, [projects, filterQuery, filterStatus]);
  
  // Calculate stats
  const activeProjects = projects.filter(
    (p) => p.status === 'active' || p.status === 'draft'
  ).length;
  
  const completedProjects = projects.filter(
    (p) => p.status === 'completed'
  ).length;
  
  // Calculate total investment from actual milestone escrow payments (what was actually paid)
  const totalInvestment = projects.reduce((total, project) => {
    if (!project.milestones || project.milestones.length === 0) {
      return total;
    }
    
    // Sum up all milestone amounts that have escrow (actually paid)
    const projectTotal = project.milestones.reduce((milestoneTotal, milestone) => {
      // Only count milestones that have escrow (funded/paid)
      if (milestone.escrow && (milestone.escrow.status === 'held' || milestone.escrow.status === 'released')) {
        return milestoneTotal + parseFormattedAmount(milestone.escrow.amount);
      }
      // If no escrow but milestone has an amount, count it (for pending milestones that might be paid)
      // Actually, let's only count what's actually been paid (has escrow)
      return milestoneTotal;
    }, 0);
    
    return total + projectTotal;
  }, 0);
  
  const formatInvestment = (amount: number): string => {
    if (!amount || isNaN(amount) || amount === 0) {
      return '₦0';
    }
    if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(0)}K`;
    }
    return formatAmountWithCurrency(amount);
  };
  
  const columns = [
    {
      header: 'Project Name',
      accessor: (row: Project) => (
        <div>
          <p className="font-medium text-[#334155]">{row.title}</p>
          <p className="text-xs text-[#64748B] mt-1">
            {row.company?.company_name || 'Company'}
          </p>
        </div>
      ),
    },
    {
      header: 'Location',
      accessor: (row: Project) => (
        <span title={getLocationFull(row)} className="text-sm text-[#334155]">
          {getLocationDisplay(row)}
        </span>
      ),
    },
    {
      header: 'Budget',
      accessor: (row: Project) => formatBudget(row),
    },
    {
      header: 'Progress',
      accessor: (row: Project) => {
        const progress = calculateProjectProgress(row);
        return (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-[#334155]">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#16A34A] rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: (row: Project) => <StatusBadge status={getProjectBadgeStatus(row.status)} />,
    },
    {
      header: 'Action',
      accessor: (row: Project) => (
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate(`/projects/${row.id}`)}
          className="whitespace-nowrap"
        >
          View Project
        </Button>
      ),
    },
  ];
  
  if (isLoading) {
    return (
      <div className="space-y-6 min-h-screen">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155] mb-2">Projects</h1>
          <p className="text-sm text-[#64748B]">
            Track and manage your construction projects.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
            <p className="text-sm text-[#64748B]">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#334155] mb-2">Projects</h1>
        <p className="text-sm text-[#64748B]">
          Track and manage your construction projects.
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Active Projects Card - Blue Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#1E40AF] shadow-lg">
          <div className="p-6 text-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium mb-2 opacity-90">Active Projects</p>
                <p className="text-4xl font-bold mb-1">{activeProjects}</p>
                <div className="flex items-center gap-2 text-xs opacity-80">
                  <TrendingUp className="w-3 h-3" />
                  <span>{paginationMeta.total || projects.length} total</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <FolderKanban className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Total Investment / Client Payments Card - White with Blue */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[#1E3A8A] mb-2">
                {userRole === 'company' ? 'Client Payments Total' : 'Total Investment'}
              </p>
              <p className="text-4xl font-bold text-[#1E3A8A] mb-3">
                {formatInvestment(totalInvestment)}
              </p>
              <p className="text-xs text-[#64748B]">
                {userRole === 'company'
                  ? 'Total paid by clients across all projects'
                  : 'Across all projects'}
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-[#1E3A8A]" />
            </div>
          </div>
        </div>
        
        {/* Completed Projects Card - White with Orange */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[#F59E0B] mb-2">Completed Projects</p>
              <p className="text-4xl font-bold text-[#F59E0B] mb-3">{completedProjects}</p>
              <p className="text-xs text-[#64748B]">Successfully finished</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-[#F59E0B]" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Projects Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg">
        <div className="border-b border-[#E5E7EB] px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-[#1E3A8A]" />
              <h3 className="text-lg font-semibold text-[#334155]">All Projects</h3>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full md:w-60 px-3 py-2 rounded-lg border border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none text-sm"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full md:w-44 px-3 py-2 rounded-lg border border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none text-sm bg-white"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-0">
          <Table
            columns={columns}
            data={filteredProjects}
            emptyMessage={filteredProjects.length === 0 && (filterQuery || filterStatus !== 'all')
              ? 'No projects match your filters.'
              : 'No projects yet. Book a consultation to get started.'}
          />
          
          {paginationMeta.last_page > 1 && (
            <div className="p-6 border-t border-[#E5E7EB]">
              <Pagination
                currentPage={currentPage}
                totalPages={paginationMeta.last_page}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
