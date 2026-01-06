import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Table, Pagination } from '../components/Table';
import { projectService, Project } from '../services/project.service';

interface ProjectsPageProps {
  onNavigate: (path: string) => void;
}

export function ProjectsPage({ onNavigate }: ProjectsPageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paginationMeta, setPaginationMeta] = useState({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
  });
  
  useEffect(() => {
    loadProjects();
  }, [currentPage]);
  
  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const { projects: fetchedProjects, meta } = await projectService.list({
        per_page: 15,
      });
      setProjects(fetchedProjects);
      setPaginationMeta(meta);
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
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Calculate stats
  const activeProjects = projects.filter(
    (p) => p.status === 'active' || p.status === 'draft'
  ).length;
  
  const completedProjects = projects.filter(
    (p) => p.status === 'completed'
  ).length;
  
  const totalInvestment = projects.reduce((total, project) => {
    if (project.budget_max) {
      return total + project.budget_max;
    }
    if (project.budget_min) {
      return total + project.budget_min;
    }
    return total;
  }, 0);
  
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
      accessor: (row: Project) => row.location,
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
      accessor: (row: Project) => <StatusBadge status={row.status} />,
    },
  ];
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155] mb-2">Projects</h1>
          <p className="text-sm text-[#64748B]">
            Track and manage your construction projects.
          </p>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
          <p className="text-sm text-[#64748B]">Loading projects...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155] mb-2">Projects</h1>
          <p className="text-sm text-[#64748B]">
            Track and manage your construction projects.
          </p>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide text-[#64748B] mb-2">
              Active Projects
            </p>
            <p className="text-3xl font-semibold text-[#334155]">{activeProjects}</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide text-[#64748B] mb-2">
              Total Investment
            </p>
            <p className="text-3xl font-semibold text-[#334155]">
              ₦{(totalInvestment / 1000).toFixed(0)}K
            </p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide text-[#64748B] mb-2">
              Completed Projects
            </p>
            <p className="text-3xl font-semibold text-[#334155]">{completedProjects}</p>
          </div>
        </Card>
      </div>
      
      {/* Projects Table */}
      <Card>
        <Table
          columns={columns}
          data={projects}
          onRowClick={(row) => onNavigate(`/projects/${row.id}`)}
          emptyMessage="No projects yet. Book a consultation to get started."
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
      </Card>
    </div>
  );
}
