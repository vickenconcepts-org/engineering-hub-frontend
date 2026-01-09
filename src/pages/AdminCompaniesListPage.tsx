import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, Search, CheckCircle, Clock, Users, Shield } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { StatusBadge } from '../components/StatusBadge';
import { Table, Pagination } from '../components/Table';
import { adminService, AdminCompany } from '../services/admin.service';

interface AdminCompaniesListPageProps {
}

export function AdminCompaniesListPage({}: AdminCompaniesListPageProps) {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  useEffect(() => {
    loadCompanies();
  }, [currentPage, statusFilter, verifiedFilter]);
  
  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        per_page: perPage,
        page: currentPage,
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (verifiedFilter !== 'all') {
        params.verified = verifiedFilter === 'true';
      }
      
      const response = await adminService.listCompanies(params);
      setCompanies(response.companies);
      setTotalPages(response.meta.last_page);
      setTotal(response.meta.total);
    } catch (error) {
      console.error('Failed to load companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = () => {
    // Search would be implemented on backend, for now just reload
    loadCompanies();
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'rejected':
        return 'red';
      case 'suspended':
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
  
  const filteredCompanies = companies.filter(company => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      company.company_name.toLowerCase().includes(search) ||
      company.registration_number.toLowerCase().includes(search) ||
      company.user?.email.toLowerCase().includes(search) ||
      company.user?.name.toLowerCase().includes(search)
    );
  });
  
  const columns = [
    { header: 'Company Name', accessor: (row: any) => row.company_name },
    { header: 'Registration', accessor: (row: any) => row.registration_number },
    { header: 'Contact', accessor: (row: any) => row.user },
    { header: 'Status', accessor: (row: any) => row.status },
    { header: 'Verified', accessor: (row: any) => row.is_verified },
    { header: 'Submitted', accessor: (row: any) => row.created_at },
    { header: 'Actions', accessor: (row: any) => row.actions },
  ];
  
  const tableData = filteredCompanies.map((company) => ({
    company_name: (
      <div>
        <p className="text-sm font-medium text-[#334155]">{company.company_name}</p>
        {company.specialization && company.specialization.length > 0 && (
          <p className="text-xs text-[#64748B] mt-1">
            {company.specialization.slice(0, 2).join(', ')}
          </p>
        )}
      </div>
    ),
    registration_number: (
      <p className="text-sm text-[#334155]">{company.registration_number}</p>
    ),
    user: (
      <div>
        <p className="text-sm text-[#334155]">{company.user?.name || 'N/A'}</p>
        <p className="text-xs text-[#64748B]">{company.user?.email || ''}</p>
      </div>
    ),
    status: <StatusBadge status={company.status} color={getStatusColor(company.status)} />,
    is_verified: company.is_verified ? (
      <CheckCircle className="w-5 h-5 text-[#16A34A]" />
    ) : (
      <Clock className="w-5 h-5 text-[#F59E0B]" />
    ),
    created_at: (
      <p className="text-sm text-[#64748B]">{formatDate(company.created_at)}</p>
    ),
    actions: (
      <Button
        size="sm"
        variant="secondary"
        onClick={() => navigate(`/admin/companies/${company.id}`)}
        className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all"
      >
        Review
      </Button>
    ),
  }));
  
  const pendingCount = companies.filter(c => c.status === 'pending').length;
  const approvedCount = companies.filter(c => c.status === 'approved').length;
  const verifiedCount = companies.filter(c => c.is_verified).length;

  return (
    <div className="bg-[#F5F5F5] min-h-screen p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#334155] mb-2">Company Management</h1>
          <p className="text-sm text-[#64748B]">
            Review and manage company registrations and verifications
          </p>
        </div>
        
        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'suspended', label: 'Suspended' },
              ]}
            />
            
            <Select
              label="Verification"
              value={verifiedFilter}
              onChange={(e) => {
                setVerifiedFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All' },
                { value: 'true', label: 'Verified' },
                { value: 'false', label: 'Not Verified' },
              ]}
            />
          </div>
        </div>
      
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* First Card - Blue Gradient */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#1E40AF] shadow-lg">
            <div className="p-6 text-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium mb-2 opacity-90">Total Companies</p>
                  <p className="text-4xl font-bold mb-1">{total}</p>
                  <p className="text-xs opacity-80 mt-2">All registered companies</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Second Card - White with Yellow */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E5E7EB]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[#1E3A8A] mb-2">Pending</p>
                <p className="text-3xl font-bold mb-1 text-[#F59E0B]">
                  {pendingCount}
                </p>
                <p className="text-xs text-[#64748B] mt-1">Awaiting review</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#F59E0B]/10 to-[#FBBF24]/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
          </div>

          {/* Third Card - White with Green */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E5E7EB]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[#1E3A8A] mb-2">Approved</p>
                <p className="text-3xl font-bold mb-1 text-[#16A34A]">
                  {approvedCount}
                </p>
                <p className="text-xs text-[#64748B] mt-1">Active companies</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#16A34A]/10 to-[#22C55E]/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-[#16A34A]" />
              </div>
            </div>
          </div>

          {/* Fourth Card - White with Blue */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E5E7EB]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[#1E3A8A] mb-2">Verified</p>
                <p className="text-3xl font-bold mb-1 text-[#1E3A8A]">
                  {verifiedCount}
                </p>
                <p className="text-xs text-[#64748B] mt-1">Verified companies</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1E3A8A]/10 to-[#2563EB]/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#1E3A8A]" />
              </div>
            </div>
          </div>
        </div>
      
        {/* Companies Table */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg overflow-hidden">
          <div className="p-6 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1E3A8A]/10 to-[#2563EB]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#1E3A8A]" />
              </div>
              <h2 className="text-lg font-semibold text-[#334155]">Companies</h2>
            </div>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
                <p className="text-sm text-[#64748B]">Loading companies...</p>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-[#64748B]" />
                </div>
                <p className="text-sm font-medium text-[#334155] mb-1">No companies found</p>
                <p className="text-xs text-[#64748B]">Try adjusting your filters</p>
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
          </div>
        </div>
      </div>
    </div>
  );
}

