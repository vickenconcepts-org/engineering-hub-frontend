import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { AlertCircle, Search, Filter, Clock, CheckCircle, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { StatusBadge } from '../components/StatusBadge';
import { Table, Pagination } from '../components/Table';
import { adminService, Dispute } from '../services/admin.service';
import { formatAmountWithCurrency } from '../lib/money-utils';

interface AdminDisputesListPageProps {
  onNavigate: (path: string) => void;
}

export function AdminDisputesListPage({ onNavigate }: AdminDisputesListPageProps) {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  useEffect(() => {
    loadDisputes();
  }, [currentPage, statusFilter]);
  
  const loadDisputes = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        per_page: perPage,
        page: currentPage,
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await adminService.listDisputes(params);
      setDisputes(response.disputes);
      setTotalPages(response.meta.last_page);
      setTotal(response.meta.total);
    } catch (error) {
      console.error('Failed to load disputes:', error);
      toast.error('Failed to load disputes');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = () => {
    // Search would be implemented on backend, for now just reload
    loadDisputes();
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
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const filteredDisputes = disputes.filter(dispute => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      dispute.project?.title.toLowerCase().includes(search) ||
      dispute.reason.toLowerCase().includes(search) ||
      dispute.raised_by_user?.name.toLowerCase().includes(search) ||
      dispute.raised_by_user?.email.toLowerCase().includes(search)
    );
  });
  
  const columns = [
    { header: 'ID', accessor: (row: any) => row.id },
    { header: 'Type', accessor: (row: any) => row.type },
    { header: 'Project', accessor: (row: any) => row.project },
    { header: 'Milestone', accessor: (row: any) => row.milestone },
    { header: 'Raised By', accessor: (row: any) => row.raised_by },
    { header: 'Reason', accessor: (row: any) => row.reason },
    { header: 'Status', accessor: (row: any) => row.status },
    { header: 'Opened', accessor: (row: any) => row.created_at },
    { header: 'Actions', accessor: (row: any) => row.actions },
  ];
  
  const tableData = filteredDisputes.map((dispute) => ({
    id: (
      <p className="text-sm font-medium text-[#334155]">#{dispute.id}</p>
    ),
    type: (
      <div>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          dispute.type === 'revision_request' 
            ? 'bg-[#FEF3C7] text-[#F59E0B]' 
            : 'bg-[#FEE2E2] text-[#DC2626]'
        }`}>
          {dispute.type === 'revision_request' ? 'Revision Request' : 'Dispute'}
        </span>
      </div>
    ),
    project: (
      <div>
        <p className="text-sm font-medium text-[#334155]">
          {dispute.project?.title || 'N/A'}
        </p>
        {dispute.project && (
          <button
            onClick={() => onNavigate(`/projects/${dispute.project?.id}`)}
            className="text-xs text-[#1E3A8A] hover:text-[#1D4ED8] hover:underline mt-1"
          >
            View Project
          </button>
        )}
      </div>
    ),
    milestone: dispute.milestone ? (
      <div>
        <p className="text-sm text-[#334155]">{dispute.milestone.title}</p>
        <p className="text-xs text-[#64748B]">
          {formatAmountWithCurrency(dispute.milestone.amount)}
        </p>
      </div>
    ) : (
      <p className="text-sm text-[#64748B]">N/A</p>
    ),
    raised_by: (
      <div>
        <p className="text-sm text-[#334155]">
          {(dispute.raised_by_user || dispute.raised_by)?.name || 'N/A'}
        </p>
        {(dispute.raised_by_user || dispute.raised_by)?.email && (
          <p className="text-xs text-[#64748B]">
            {(dispute.raised_by_user || dispute.raised_by)?.email}
          </p>
        )}
      </div>
    ),
    reason: (
      <p className="text-sm text-[#334155] line-clamp-2 max-w-xs">
        {dispute.reason}
      </p>
    ),
    status: <StatusBadge status={dispute.status as any} />,
    created_at: (
      <p className="text-sm text-[#64748B]">{formatDate(dispute.created_at)}</p>
    ),
    actions: (
      <Button
        size="sm"
        variant="secondary"
        {...({ onClick: () => onNavigate(`/admin/disputes/${dispute.id}`) } as any)}
      >
        Review
      </Button>
    ),
  }));
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#334155] mb-2">Dispute Management</h1>
        <p className="text-sm text-[#64748B]">
          Review and resolve disputes between clients and companies
        </p>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <Input
                  {...({ placeholder: "Search disputes...", value: searchTerm, onChange: (e: any) => setSearchTerm(e.target.value), onKeyPress: (e: any) => e.key === 'Enter' && handleSearch() } as any)}
                />
                <Button {...({ onClick: handleSearch } as any)}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <Select
              label="Status"
              {...({ value: statusFilter, onChange: (e: any) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              } } as any)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'open', label: 'Open' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'escalated', label: 'Escalated' },
              ]}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">Total</p>
                <p className="text-2xl font-semibold text-[#334155]">{total}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-[#64748B]" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">Open</p>
                <p className="text-2xl font-semibold text-[#F59E0B]">
                  {disputes.filter(d => d.status === 'open').length}
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
                <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">Resolved</p>
                <p className="text-2xl font-semibold text-[#16A34A]">
                  {disputes.filter(d => d.status === 'resolved').length}
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
                <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">Escalated</p>
                <p className="text-2xl font-semibold text-[#DC2626]">
                  {disputes.filter(d => d.status === 'escalated').length}
                </p>
              </div>
              <X className="w-8 h-8 text-[#DC2626]" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Disputes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Disputes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
              <p className="text-sm text-[#64748B]">Loading disputes...</p>
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
              <p className="text-sm text-[#64748B]">No disputes found</p>
            </div>
          ) : (
            <>
              <Table columns={columns} data={tableData} />
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

