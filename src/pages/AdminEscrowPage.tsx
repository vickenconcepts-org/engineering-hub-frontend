import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { Table, Pagination } from '../components/Table';
import { adminService, MilestoneForRelease } from '../services/admin.service';
import { DollarSign, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminEscrowPage() {
  const navigate = useNavigate();
  const [milestones, setMilestones] = useState<MilestoneForRelease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'held' | 'released' | 'all'>('held');
  const [perPage] = useState(15);

  useEffect(() => {
    loadMilestones();
  }, [currentPage, statusFilter]);

  const loadMilestones = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.listEscrowMilestones({
        per_page: perPage,
        page: currentPage,
        status: statusFilter,
      });
      setMilestones(response.milestones || []);
      setTotalPages(response.meta?.last_page || 1);
      setTotal(response.meta?.total || 0);
    } catch (error) {
      console.error('Failed to load escrow milestones:', error);
      toast.error('Failed to load escrow milestones');
    } finally {
      setIsLoading(false);
    }
  };

  const getEscrowStatusBadge = (status: string | undefined): 'pending' | 'approved' | 'rejected' | 'funded' | 'released' | 'disputed' | 'completed' | 'active' | 'scheduled' => {
    if (!status) return 'pending';
    switch (status.toLowerCase()) {
      case 'released':
        return 'released';
      case 'held':
        return 'funded';
      case 'refunded':
        return 'rejected';
      default:
        return 'pending';
    }
  };

  const getMilestoneStatusBadge = (status: string | undefined): 'pending' | 'approved' | 'rejected' | 'funded' | 'released' | 'disputed' | 'completed' | 'active' | 'scheduled' => {
    if (!status) return 'pending';
    switch (status.toLowerCase()) {
      case 'approved':
        return 'approved';
      case 'submitted':
        return 'pending';
      case 'funded':
        return 'funded';
      case 'pending':
        return 'pending';
      case 'rejected':
        return 'rejected';
      case 'released':
        return 'released';
      default:
        return 'pending';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateTotalHeld = () => {
    return milestones
      .filter(m => m.escrow?.status === 'held')
      .reduce((sum, m) => {
        const amount = m.escrow?.amount || m.amount || 0;
        return sum + parseFloat(amount.toString());
      }, 0);
  };

  const calculateTotalReleased = () => {
    return milestones
      .filter(m => m.escrow?.status === 'released')
      .reduce((sum, m) => {
        const amount = m.escrow?.amount || m.amount || 0;
        return sum + parseFloat(amount.toString());
      }, 0);
  };

  const columns = [
    {
      header: 'Milestone',
      accessor: (milestone: MilestoneForRelease) => {
        const projectTitle = milestone.project?.title || (milestone.project_id ? `Project ID: ${milestone.project_id}` : 'N/A');
        const milestoneTitle = milestone.title || `Milestone #${milestone.id}`;
        
        return (
        <div>
            <p className="font-medium text-[#334155]">{milestoneTitle}</p>
            <p className="text-xs text-[#64748B]">Project: {projectTitle}</p>
        </div>
        );
      },
    },
    {
      header: 'Amount',
      accessor: (milestone: MilestoneForRelease) => {
        // Get amount from escrow first, then fallback to milestone amount
        const amount = milestone.escrow?.amount || milestone.amount || 0;
        
        return (
        <span className="font-semibold text-[#334155]">
            ₦{parseFloat(amount.toString()).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        );
      },
    },
    {
      header: 'Milestone Status',
      accessor: (milestone: MilestoneForRelease) => {
        const status = milestone.status || '';
        return <StatusBadge status={getMilestoneStatusBadge(status)} />;
      },
    },
    {
      header: 'Escrow Status',
      accessor: (milestone: MilestoneForRelease) => {
        const escrowStatus = milestone.escrow?.status || '';
        return <StatusBadge status={getEscrowStatusBadge(escrowStatus)} />;
      },
    },
    {
      header: 'Actions',
      accessor: (milestone: MilestoneForRelease) => {
        const projectId = milestone.project?.id || milestone.project_id;
        if (!projectId) {
          return <span className="text-sm text-[#64748B]">N/A</span>;
        }
        const canRelease = milestone.escrow?.status === 'held' && 
                          (milestone.status === 'approved' || milestone.status === 'submitted');
        return (
          <div className="flex gap-2">
          <Button
              variant="secondary"
            size="sm"
              onClick={() => navigate(`/projects/${projectId}?milestone=${milestone.id}&project_id=${projectId}`)}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
            {canRelease && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  // TODO: Open release modal
                  toast.success('Release functionality coming soon');
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Release
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  // Table component expects the original data array, not transformed data
  // It will call the accessor functions with the original milestone objects

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#334155]">Escrow Management</h1>
        <p className="text-sm text-[#64748B] mt-1">Manage milestone escrow funds and releases</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">Total Held</p>
                <p className="text-2xl font-semibold text-[#F59E0B]">
                  ₦{calculateTotalHeld().toLocaleString()}
                </p>
              </div>
              <Clock className="w-8 h-8 text-[#F59E0B]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">Total Released</p>
                <p className="text-2xl font-semibold text-[#16A34A]">
                  ₦{calculateTotalReleased().toLocaleString()}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-[#16A34A]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">Total Milestones</p>
                <p className="text-2xl font-semibold text-[#334155]">{total}</p>
              </div>
              <DollarSign className="w-8 h-8 text-[#334155]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-[#334155]">Filter by Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'held' | 'released' | 'all');
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="held">Held</option>
              <option value="released">Released</option>
              <option value="all">All</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Milestones Table */}
      <Card>
        <CardHeader>
          <CardTitle>Escrow Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
              <p className="text-sm text-[#64748B]">Loading escrow milestones...</p>
            </div>
          ) : milestones.length === 0 ? (
            <div className="text-center py-12">
              <XCircle className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
              <p className="text-sm text-[#64748B]">No milestones with escrow found</p>
            </div>
          ) : (
            <>
              <Table columns={columns} data={milestones} />
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

