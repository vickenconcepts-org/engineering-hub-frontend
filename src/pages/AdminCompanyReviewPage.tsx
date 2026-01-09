import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Building2, Phone, Mail, FileText, CheckCircle, X, Shield, User, Calendar } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Textarea } from '../components/Textarea';
import { StatusBadge } from '../components/StatusBadge';
import { adminService, AdminCompany } from '../services/admin.service';
import { getFileUrl } from '../lib/file-utils';

interface AdminCompanyReviewPageProps {
  onNavigate: (path: string) => void;
}

export function AdminCompanyReviewPage({ onNavigate }: AdminCompanyReviewPageProps) {
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [company, setCompany] = useState<AdminCompany | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Extract company ID from current path
  const companyId = window.location.pathname.split('/admin/companies/')[1]?.split('#')[0] || '';
  
  useEffect(() => {
    if (companyId) {
      loadCompany();
    }
  }, [companyId]);
  
  const loadCompany = async () => {
    try {
      setIsLoading(true);
      const fetchedCompany = await adminService.getCompany(companyId);
      setCompany(fetchedCompany);
    } catch (error) {
      console.error('Failed to load company:', error);
      toast.error('Failed to load company details');
      onNavigate('/admin/companies');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApprove = async () => {
    if (!company) return;
    
    try {
      setIsProcessing(true);
      await adminService.approveCompany(company.id);
      toast.success('Company approved successfully!');
      setApproveModalOpen(false);
      onNavigate('/admin/companies');
    } catch (error) {
      console.error('Failed to approve company:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleReject = async () => {
    if (!company || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    
    try {
      setIsProcessing(true);
      await adminService.rejectCompany(company.id, rejectionReason);
      toast.success('Company rejected successfully');
      setRejectModalOpen(false);
      setRejectionReason('');
      onNavigate('/admin/companies');
    } catch (error) {
      console.error('Failed to reject company:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSuspend = async () => {
    if (!company || !suspendReason.trim()) {
      toast.error('Please provide a suspension reason');
      return;
    }
    
    try {
      setIsProcessing(true);
      await adminService.suspendCompany(company.id, suspendReason);
      toast.success('Company suspended successfully');
      setSuspendModalOpen(false);
      setSuspendReason('');
      loadCompany();
    } catch (error) {
      console.error('Failed to suspend company:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
  
  if (isLoading) {
    return (
      <div className="bg-[#F5F5F5] min-h-screen p-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
            <p className="text-sm text-[#64748B]">Loading company details...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!company) {
    return (
      <div className="bg-[#F5F5F5] min-h-screen p-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-12">
          <div className="text-center">
            <p className="text-sm text-[#64748B]">Company not found</p>
          </div>
        </div>
      </div>
    );
  }
  
  
  return (
    <div className="bg-[#F5F5F5] min-h-screen p-6">
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('/admin/companies')}
          className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#334155] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Companies
        </button>
        
        {/* Header */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#1E3A8A]/10 to-[#2563EB]/10 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-[#1E3A8A]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#334155] mb-2">
                  {company.company_name}
                </h1>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 text-sm text-[#64748B]">
                    <Calendar className="w-4 h-4" />
                    <span>Submitted: {formatDate(company.created_at)}</span>
                  </div>
                </div>
                <StatusBadge status={company.status} color={getStatusColor(company.status)} />
              </div>
            </div>
            
            <div className="flex gap-3">
              {company.status === 'approved' && (
                <Button
                  variant="danger"
                  onClick={() => setSuspendModalOpen(true)}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-[#DC2626] to-[#EF4444] hover:from-[#B91C1C] hover:to-[#DC2626] text-white shadow-md hover:shadow-lg transition-all"
                >
                  <X className="w-4 h-4 mr-1.5" />
                  Suspend
                </Button>
              )}
              {company.status === 'pending' && (
                <>
                  <Button
                    variant="danger"
                    onClick={() => setRejectModalOpen(true)}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-[#DC2626] to-[#EF4444] hover:from-[#B91C1C] hover:to-[#DC2626] text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <X className="w-4 h-4 mr-1.5" />
                    Reject
                  </Button>
                  <Button 
                    onClick={() => setApproveModalOpen(true)}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-[#16A34A] to-[#22C55E] hover:from-[#15803D] hover:to-[#16A34A] text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Approve
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Information */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg overflow-hidden">
              <div className="p-6 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1E3A8A]/10 to-[#2563EB]/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#1E3A8A]" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#334155]">Company Information</h2>
                </div>
              </div>
              <div className="p-6">
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-[#64748B] mt-0.5" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                        Company Name
                      </p>
                      <p className="text-sm text-[#334155]">{company.company_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-[#64748B] mt-0.5" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                        Registration Number
                      </p>
                      <p className="text-sm text-[#334155]">{company.registration_number}</p>
                    </div>
                  </div>
                  
                  {company.specialization && company.specialization.length > 0 && (
                    <div className="flex items-start gap-3 md:col-span-2">
                      <Building2 className="w-5 h-5 text-[#64748B] mt-0.5" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                          Specialization
                        </p>
                        <p className="text-sm text-[#334155]">{company.specialization.join(', ')}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-[#64748B] mt-0.5" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                        Email
                      </p>
                      <p className="text-sm text-[#334155]">{company.user?.email || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {company.user?.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-[#64748B] mt-0.5" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                          Phone
                        </p>
                        <p className="text-sm text-[#334155]">{company.user.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {company.verified_at && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                      Verified At
                    </p>
                    <p className="text-sm text-[#334155]">{formatDate(company.verified_at)}</p>
                  </div>
                )}
              </div>
              </div>
            </div>
            
            {/* License Documents */}
            {company.license_documents && company.license_documents.length > 0 && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg overflow-hidden">
                <div className="p-6 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1E3A8A]/10 to-[#2563EB]/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-[#1E3A8A]" />
                    </div>
                    <h2 className="text-lg font-semibold text-[#334155]">License Documents</h2>
                  </div>
                </div>
                <div className="p-6">
                <div className="space-y-3">
                  {company.license_documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#64748B]" />
                        <span className="text-sm text-[#334155]">{doc}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => window.open(getFileUrl(doc), '_blank')}
                        className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all"
                      >
                        View Document
                      </Button>
                    </div>
                  ))}
                </div>
                </div>
              </div>
            )}
            
            {/* Portfolio Links */}
            {company.portfolio_links && company.portfolio_links.length > 0 && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg overflow-hidden">
                <div className="p-6 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1E3A8A]/10 to-[#2563EB]/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-[#1E3A8A]" />
                    </div>
                    <h2 className="text-lg font-semibold text-[#334155]">Portfolio Links</h2>
                  </div>
                </div>
                <div className="p-6">
                <div className="space-y-3">
                  {company.portfolio_links.map((link, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg"
                    >
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#1E3A8A] hover:text-[#1D4ED8] hover:underline"
                      >
                        {link}
                      </a>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => window.open(link, '_blank')}
                        className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all"
                      >
                        Visit
                      </Button>
                    </div>
                  ))}
                </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Status */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg overflow-hidden">
              <div className="p-6 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1E3A8A]/10 to-[#2563EB]/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[#1E3A8A]" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#334155]">Company Status</h2>
                </div>
              </div>
              <div className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                    Status
                  </p>
                  <StatusBadge status={company.status} color={getStatusColor(company.status)} />
                </div>
                
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                    Verification Status
                  </p>
                  <p className="text-sm text-[#334155]">
                    {company.is_verified ? 'Verified' : 'Not Verified'}
                  </p>
                </div>
                
                {company.verified_at && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                      Verified Date
                    </p>
                    <p className="text-sm text-[#334155]">{formatDate(company.verified_at)}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                    Created Date
                  </p>
                  <p className="text-sm text-[#334155]">{formatDate(company.created_at)}</p>
                </div>
              </div>
              </div>
            </div>
            
            {/* User Information */}
            {company.user && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg overflow-hidden">
                <div className="p-6 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1E3A8A]/10 to-[#2563EB]/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-[#1E3A8A]" />
                    </div>
                    <h2 className="text-lg font-semibold text-[#334155]">User Information</h2>
                  </div>
                </div>
                <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                      Name
                    </p>
                    <p className="text-sm text-[#334155]">{company.user.name}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                      Email
                    </p>
                    <p className="text-sm text-[#334155]">{company.user.email}</p>
                  </div>
                  
                  {company.user.phone && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                        Phone
                      </p>
                      <p className="text-sm text-[#334155]">{company.user.phone}</p>
                    </div>
                  )}
                </div>
                </div>
              </div>
            )}
          </div>
        </div>
      
      {/* Approve Modal */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Approve Company"
        primaryAction={{
          label: isProcessing ? 'Approving...' : 'Approve Company',
          onClick: handleApprove,
          disabled: isProcessing,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setApproveModalOpen(false),
          disabled: isProcessing,
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-[#64748B]">
            You are about to approve <strong className="text-[#334155]">{company.company_name}</strong> to operate on the platform.
          </p>
          
          <div className="bg-[#D1FAE5] rounded-lg p-4 border border-[#16A34A]/20">
            <p className="text-sm text-[#334155]">
              <strong>This will:</strong>
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[#334155]">
              <li>• Allow company to accept consultations</li>
              <li>• Make company visible to clients</li>
              <li>• Enable project creation</li>
            </ul>
          </div>
          
          <p className="text-xs text-[#64748B]">
            Ensure all verification steps have been completed.
          </p>
        </div>
      </Modal>
      
      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Company Application"
        primaryAction={{
          label: isProcessing ? 'Rejecting...' : 'Reject Application',
          onClick: handleReject,
          variant: 'danger',
          disabled: isProcessing,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setRejectModalOpen(false),
          disabled: isProcessing,
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-[#64748B]">
            Please provide a reason for rejecting this company's application.
          </p>
          
          <Textarea
            label="Rejection Reason"
            placeholder="Explain why the application was rejected..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={6}
            helperText="This will be sent to the company."
            required
          />
        </div>
      </Modal>
      </div>
    </div>
  );
}
