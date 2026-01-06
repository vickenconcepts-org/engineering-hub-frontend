import React, { useState } from 'react';
import { ArrowLeft, Building2, MapPin, Phone, Mail, FileText, CheckCircle, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Textarea } from '../components/Textarea';

interface AdminCompanyReviewPageProps {
  onNavigate: (path: string) => void;
}

export function AdminCompanyReviewPage({ onNavigate }: AdminCompanyReviewPageProps) {
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Mock data
  const company = {
    id: 1,
    name: 'BuildRight Construction',
    email: 'contact@buildright.com',
    phone: '+234 123 456 7890',
    location: 'Abuja, Nigeria',
    specialization: 'Residential & Commercial',
    yearsInBusiness: 12,
    description: 'Full-service construction company specializing in modern residential and commercial projects across Nigeria.',
    submittedDate: 'January 5, 2026',
    documents: [
      { id: 1, name: 'Business Registration Certificate', url: '#', verified: false },
      { id: 2, name: 'Professional License', url: '#', verified: false },
      { id: 3, name: 'Insurance Certificate', url: '#', verified: false },
      { id: 4, name: 'Tax Clearance', url: '#', verified: false },
    ],
    references: [
      { name: 'ABC Development', phone: '+234 111 222 333', email: 'abc@example.com' },
      { name: 'XYZ Properties', phone: '+234 444 555 666', email: 'xyz@example.com' },
    ],
    portfolio: [
      { id: 1, project: 'Luxury Villa - Abuja', year: 2024, value: '$450,000' },
      { id: 2, project: 'Office Complex - Lagos', year: 2023, value: '$1,200,000' },
      { id: 3, project: 'Residential Homes - Port Harcourt', year: 2022, value: '$650,000' },
    ],
  };
  
  const handleApprove = () => {
    setApproveModalOpen(false);
    // In production, would approve company
    onNavigate('/admin/companies');
  };
  
  const handleReject = () => {
    setRejectModalOpen(false);
    // In production, would reject company
    onNavigate('/admin/companies');
  };
  
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
            {company.name}
          </h1>
          <p className="text-sm text-[#64748B]">
            Submitted: {company.submittedDate}
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="danger"
            onClick={() => setRejectModalOpen(true)}
          >
            <X className="w-4 h-4" />
            Reject
          </Button>
          <Button onClick={() => setApproveModalOpen(true)}>
            <CheckCircle className="w-4 h-4" />
            Approve
          </Button>
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
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                    Description
                  </p>
                  <p className="text-sm text-[#334155]">{company.description}</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-[#64748B] mt-0.5" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                        Specialization
                      </p>
                      <p className="text-sm text-[#334155]">{company.specialization}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#64748B] mt-0.5" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                        Location
                      </p>
                      <p className="text-sm text-[#334155]">{company.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-[#64748B] mt-0.5" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                        Email
                      </p>
                      <p className="text-sm text-[#334155]">{company.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-[#64748B] mt-0.5" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                        Phone
                      </p>
                      <p className="text-sm text-[#334155]">{company.phone}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                    Years in Business
                  </p>
                  <p className="text-sm text-[#334155]">{company.yearsInBusiness} years</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Submitted Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {company.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-[#64748B]" />
                      <span className="text-sm text-[#334155]">{doc.name}</span>
                    </div>
                    <Button size="sm" variant="ghost">
                      View Document
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Portfolio */}
          <Card>
            <CardHeader>
              <CardTitle>Previous Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {company.portfolio.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#334155]">{project.project}</p>
                      <p className="text-xs text-[#64748B] mt-1">Completed: {project.year}</p>
                    </div>
                    <span className="text-sm font-medium text-[#334155]">{project.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* References */}
          <Card>
            <CardHeader>
              <CardTitle>References</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {company.references.map((ref, index) => (
                  <div key={index} className="pb-4 border-b border-[#E5E7EB] last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-[#334155] mb-2">{ref.name}</p>
                    <p className="text-xs text-[#64748B] mb-1">{ref.phone}</p>
                    <p className="text-xs text-[#64748B]">{ref.email}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Verification Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  'Business registration verified',
                  'Professional licenses current',
                  'Insurance coverage adequate',
                  'References contacted',
                  'Portfolio validated',
                  'Background check completed',
                ].map((item, index) => (
                  <label key={index} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 rounded border-[#E5E7EB] text-[#1E3A8A] focus:ring-[#1E3A8A]"
                    />
                    <span className="text-sm text-[#334155]">{item}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Approve Modal */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Approve Company"
        primaryAction={{
          label: 'Approve Company',
          onClick: handleApprove,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setApproveModalOpen(false),
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-[#64748B]">
            You are about to approve <strong className="text-[#334155]">{company.name}</strong> to operate on the platform.
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
          label: 'Reject Application',
          onClick: handleReject,
          variant: 'danger',
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setRejectModalOpen(false),
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
