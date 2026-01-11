import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, Search, CheckCircle, Clock, Users, Shield, Plus, X } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { StatusBadge } from '../components/StatusBadge';
import { Table, Pagination } from '../components/Table';
import { Modal } from '../components/Modal';
import { Textarea } from '../components/Textarea';
import { adminService, AdminCompany, CreateCompanyData } from '../services/admin.service';

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateCompanyData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    user_status: 'active',
    company_name: '',
    registration_number: '',
    license_documents: [],
    portfolio_links: [],
    specialization: [],
    consultation_fee: 0,
    company_status: 'approved',
  });
  const [newPortfolioLink, setNewPortfolioLink] = useState('');
  const [newSpecialization, setNewSpecialization] = useState('');
  
  useEffect(() => {
    loadCompanies();
  }, [currentPage, statusFilter, verifiedFilter]);
  
  const loadCompanies = async (page?: number) => {
    try {
      setIsLoading(true);
      const pageToUse = page !== undefined ? page : currentPage;
      const params: any = {
        per_page: perPage,
        page: pageToUse,
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
      // Update currentPage if a specific page was requested and different
      if (page !== undefined && page !== currentPage) {
        setCurrentPage(page);
      }
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
  
  const handleCreateCompany = async () => {
    if (!createFormData.name || !createFormData.email || !createFormData.password || 
        !createFormData.company_name || !createFormData.registration_number) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setIsCreating(true);
      await adminService.createCompany(createFormData);
      toast.success('Company created successfully');
      setIsCreateModalOpen(false);
      setCreateFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        user_status: 'active',
        company_name: '',
        registration_number: '',
        license_documents: [],
        portfolio_links: [],
        specialization: [],
        consultation_fee: 0,
        company_status: 'approved',
      });
      setNewPortfolioLink('');
      setNewSpecialization('');
      // Reset to page 1 to see the new company and reload
      await loadCompanies(1);
    } catch (error: any) {
      console.error('Failed to create company:', error);
      toast.error(error?.response?.data?.message || 'Failed to create company');
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setCreateFormData({
        ...createFormData,
        license_documents: [...(createFormData.license_documents || []), ...files],
      });
    }
  };
  
  const removeLicenseFile = (index: number) => {
    const newFiles = [...(createFormData.license_documents || [])];
    newFiles.splice(index, 1);
    setCreateFormData({ ...createFormData, license_documents: newFiles });
  };
  
  const addPortfolioLink = () => {
    if (newPortfolioLink.trim()) {
      try {
        new URL(newPortfolioLink);
        setCreateFormData({
          ...createFormData,
          portfolio_links: [...(createFormData.portfolio_links || []), newPortfolioLink.trim()],
        });
        setNewPortfolioLink('');
      } catch {
        toast.error('Please enter a valid URL');
      }
    }
  };
  
  const removePortfolioLink = (index: number) => {
    const newLinks = [...(createFormData.portfolio_links || [])];
    newLinks.splice(index, 1);
    setCreateFormData({ ...createFormData, portfolio_links: newLinks });
  };
  
  const addSpecialization = () => {
    if (newSpecialization.trim()) {
      setCreateFormData({
        ...createFormData,
        specialization: [...(createFormData.specialization || []), newSpecialization.trim()],
      });
      setNewSpecialization('');
    }
  };
  
  const removeSpecialization = (index: number) => {
    const newSpecs = [...(createFormData.specialization || [])];
    newSpecs.splice(index, 1);
    setCreateFormData({ ...createFormData, specialization: newSpecs });
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
    <div className="min-h-screen">
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1E3A8A]/10 to-[#2563EB]/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#1E3A8A]" />
                </div>
                <h2 className="text-lg font-semibold text-[#334155]">Companies</h2>
              </div>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Company
              </Button>
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

      {/* Create Company Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateFormData({
            name: '',
            email: '',
            phone: '',
            password: '',
            user_status: 'active',
            company_name: '',
            registration_number: '',
            license_documents: [],
            portfolio_links: [],
            specialization: [],
            consultation_fee: 0,
            company_status: 'approved',
          });
          setNewPortfolioLink('');
          setNewSpecialization('');
        }}
        title="Create Company"
        size="lg"
        primaryAction={{
          label: 'Create Company',
          onClick: handleCreateCompany,
          disabled: isCreating,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => {
            setIsCreateModalOpen(false);
            setCreateFormData({
              name: '',
              email: '',
              phone: '',
              password: '',
              user_status: 'active',
              company_name: '',
              registration_number: '',
              license_documents: [],
              portfolio_links: [],
              specialization: [],
              consultation_fee: 0,
              company_status: 'approved',
            });
            setNewPortfolioLink('');
            setNewSpecialization('');
          },
        }}
      >
        <div className="space-y-4">
          {/* User Information Section */}
          <div>
            <h3 className="text-sm font-semibold text-[#334155] mb-3">User Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1">
                  Name <span className="text-[#DC2626]">*</span>
                </label>
                <Input
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  placeholder="User name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1">
                  Email <span className="text-[#DC2626]">*</span>
                </label>
                <Input
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1">
                  Phone
                </label>
                <Input
                  value={createFormData.phone || ''}
                  onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1">
                  Password <span className="text-[#DC2626]">*</span>
                </label>
                <Input
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  placeholder="Password (min 8 characters)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1">
                  User Status
                </label>
                <Select
                  value={createFormData.user_status || 'active'}
                  onChange={(e) => setCreateFormData({ ...createFormData, user_status: e.target.value as 'active' | 'suspended' | 'pending' })}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'suspended', label: 'Suspended' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Company Information Section */}
          <div className="border-t border-[#E5E7EB] pt-4">
            <h3 className="text-sm font-semibold text-[#334155] mb-3">Company Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1">
                  Company Name <span className="text-[#DC2626]">*</span>
                </label>
                <Input
                  value={createFormData.company_name}
                  onChange={(e) => setCreateFormData({ ...createFormData, company_name: e.target.value })}
                  placeholder="Company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1">
                  Registration Number <span className="text-[#DC2626]">*</span>
                </label>
                <Input
                  value={createFormData.registration_number}
                  onChange={(e) => setCreateFormData({ ...createFormData, registration_number: e.target.value })}
                  placeholder="Registration number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1">
                  Consultation Fee (₦)
                </label>
                <Input
                  type="number"
                  value={createFormData.consultation_fee || ''}
                  onChange={(e) => setCreateFormData({ ...createFormData, consultation_fee: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1">
                  Company Status
                </label>
                <Select
                  value={createFormData.company_status || 'approved'}
                  onChange={(e) => setCreateFormData({ ...createFormData, company_status: e.target.value as 'pending' | 'approved' | 'rejected' | 'suspended' })}
                  options={[
                    { value: 'approved', label: 'Approved' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'suspended', label: 'Suspended' },
                  ]}
                />
              </div>
              
              {/* License Documents */}
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1">
                  License Documents
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-[#64748B] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#EFF6FF] file:text-[#1E3A8A] hover:file:bg-[#DBEAFE]"
                />
                {createFormData.license_documents && createFormData.license_documents.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {createFormData.license_documents.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-[#F8FAFC] p-2 rounded">
                        <span className="text-sm text-[#334155]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeLicenseFile(index)}
                          className="text-[#DC2626] hover:text-[#B91C1C]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Portfolio Links */}
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1">
                  Portfolio Links
                </label>
                <div className="flex gap-2">
                  <Input
                    value={newPortfolioLink}
                    onChange={(e) => setNewPortfolioLink(e.target.value)}
                    placeholder="https://example.com"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPortfolioLink())}
                  />
                  <Button
                    type="button"
                    onClick={addPortfolioLink}
                    size="sm"
                    className="bg-[#1E3A8A] text-white"
                  >
                    Add
                  </Button>
                </div>
                {createFormData.portfolio_links && createFormData.portfolio_links.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {createFormData.portfolio_links.map((link, index) => (
                      <div key={index} className="flex items-center justify-between bg-[#F8FAFC] p-2 rounded">
                        <span className="text-sm text-[#334155] truncate">{link}</span>
                        <button
                          type="button"
                          onClick={() => removePortfolioLink(index)}
                          className="text-[#DC2626] hover:text-[#B91C1C] ml-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Specialization */}
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1">
                  Specialization
                </label>
                <div className="flex gap-2">
                  <Input
                    value={newSpecialization}
                    onChange={(e) => setNewSpecialization(e.target.value)}
                    placeholder="e.g., Residential Construction"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                  />
                  <Button
                    type="button"
                    onClick={addSpecialization}
                    size="sm"
                    className="bg-[#1E3A8A] text-white"
                  >
                    Add
                  </Button>
                </div>
                {createFormData.specialization && createFormData.specialization.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {createFormData.specialization.map((spec, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 bg-[#EFF6FF] text-[#1E3A8A] px-2 py-1 rounded text-sm"
                      >
                        {spec}
                        <button
                          type="button"
                          onClick={() => removeSpecialization(index)}
                          className="text-[#1E3A8A] hover:text-[#DC2626]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

