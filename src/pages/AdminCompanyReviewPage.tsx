import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Building2, MapPin, Phone, Mail, FileText, CheckCircle, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
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
  const companyId = parseInt(window.location.pathname.split('/admin/companies/')[1]?.split('#')[0] || '0');
  
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
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
          <p className="text-sm text-[#64748B]">Loading company details...</p>
        </div>
      </div>
    );
  }
  
  if (!company) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-sm text-[#64748B]">Company not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => onNavigate('/admin/companies')}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#334155]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Companies
      </button>
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155] mb-2">
            {company.company_name}
          </h1>
          <p className="text-sm text-[#64748B]">
            Submitted: {formatDate(company.created_at)}
          </p>
          <div className="mt-2">
            <StatusBadge status={company.status} color={getStatusColor(company.status)} />
          </div>
        </div>
        
        <div className="flex gap-3">
          {company.status === 'approved' && (
            <Button
              variant="danger"
              onClick={() => setSuspendModalOpen(true)}
              disabled={isProcessing}
            >
              <X className="w-4 h-4" />
              Suspend
            </Button>
          )}
          {company.status === 'pending' && (
            <>
              <Button
                variant="danger"
                onClick={() => setRejectModalOpen(true)}
                disabled={isProcessing}
              >
                <X className="w-4 h-4" />
                Reject
              </Button>
              <Button 
                onClick={() => setApproveModalOpen(true)}
                disabled={isProcessing}
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
          
          {/* License Documents */}
          {company.license_documents && company.license_documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>License Documents</CardTitle>
              </CardHeader>
              <CardContent>
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
                      >
                        View Document
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Portfolio Links */}
          {company.portfolio_links && company.portfolio_links.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Links</CardTitle>
              </CardHeader>
              <CardContent>
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
                      >
                        Visit
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Status */}
          <Card>
            <CardHeader>
              <CardTitle>Company Status</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
          
          {/* User Information */}
          {company.user && (
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
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
  );
}
