import React, { useState } from 'react';
import { ArrowLeft, AlertCircle, DollarSign, FileText, Image as ImageIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Textarea } from '../components/Textarea';
import { CurrencyInput } from '../components/CurrencyInput';

interface AdminDisputePageProps {
  onNavigate: (path: string) => void;
}

export function AdminDisputePage({ onNavigate }: AdminDisputePageProps) {
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  
  // Mock data
  const dispute = {
    id: 1,
    status: 'pending' as const,
    openedDate: 'January 8, 2026',
    project: {
      id: 1,
      name: 'Residential Home - Lagos',
      budget: 125000,
      escrowBalance: 68750,
    },
    client: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 234 567 8900',
    },
    company: {
      name: 'AfricaBuild Ltd',
      email: 'john@africabuild.com',
      phone: '+234 123 456 7890',
    },
    milestone: {
      id: 2,
      name: 'Structure & Roofing',
      amount: 31250,
    },
    reason: 'Quality concerns with foundation work. Cracks appeared in the foundation after completion. Requesting inspection and remediation.',
    clientEvidence: [
      { id: 1, type: 'photo', url: 'https://images.unsplash.com/photo-1590479773265-7464e5d48118?w=800', caption: 'Foundation cracks' },
      { id: 2, type: 'photo', url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800', caption: 'Structural issues' },
    ],
    companyResponse: 'Foundation meets all specifications. Cracks are superficial and within normal range for settling. We are willing to provide additional documentation from structural engineer.',
    companyEvidence: [
      { id: 1, type: 'document', name: 'Structural Engineer Report.pdf' },
      { id: 2, type: 'document', name: 'Foundation Specifications.pdf' },
    ],
  };
  
  const handleRelease = () => {
    setReleaseModalOpen(false);
    // In production, would release funds
    onNavigate('/admin/disputes');
  };
  
  const handleRefund = () => {
    setRefundModalOpen(false);
    // In production, would process refund
    onNavigate('/admin/disputes');
  };
  
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => onNavigate('/admin/disputes')}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#334155]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Disputes
      </button>
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155] mb-2">
            Dispute #{dispute.id}
          </h1>
          <p className="text-sm text-[#64748B]">
            {dispute.project.name} • Opened: {dispute.openedDate}
          </p>
        </div>
        <StatusBadge status={dispute.status} />
      </div>
      
      {/* Alert Banner */}
      <div className="bg-[#FEF3C7] rounded-lg p-4 border border-[#F59E0B]/20">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[#334155] mb-1">
              Disputed Milestone: {dispute.milestone.name}
            </p>
            <p className="text-sm text-[#64748B]">
              ${dispute.milestone.amount.toLocaleString()} in escrow is on hold pending resolution.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Complaint */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Client Complaint</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                    Client Name
                  </p>
                  <p className="text-sm text-[#334155] font-medium">{dispute.client.name}</p>
                </div>
                
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                    Complaint Details
                  </p>
                  <p className="text-sm text-[#334155]">{dispute.reason}</p>
                </div>
                
                {dispute.clientEvidence.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-3">
                      Evidence Submitted
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {dispute.clientEvidence.map((evidence) => (
                        <div key={evidence.id} className="space-y-2">
                          <div className="aspect-video rounded-lg overflow-hidden bg-[#F8FAFC] border border-[#E5E7EB]">
                            <img
                              src={evidence.url}
                              alt={evidence.caption}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-xs text-[#64748B]">{evidence.caption}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Company Response */}
          <Card>
            <CardHeader>
              <CardTitle>Company Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                    Company Name
                  </p>
                  <p className="text-sm text-[#334155] font-medium">{dispute.company.name}</p>
                </div>
                
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                    Response
                  </p>
                  <p className="text-sm text-[#334155]">{dispute.companyResponse}</p>
                </div>
                
                {dispute.companyEvidence.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-3">
                      Supporting Documents
                    </p>
                    <div className="space-y-2">
                      {dispute.companyEvidence.map((evidence) => (
                        <div
                          key={evidence.id}
                          className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#64748B]" />
                            <span className="text-sm text-[#334155]">{evidence.name}</span>
                          </div>
                          <Button size="sm" variant="ghost">View</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Resolution */}
          <Card>
            <CardHeader>
              <CardTitle>Resolution</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                label="Resolution Notes"
                placeholder="Document your decision and reasoning..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={6}
                helperText="This will be sent to both parties."
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                    Project Name
                  </p>
                  <button
                    onClick={() => onNavigate(`/projects/${dispute.project.id}`)}
                    className="text-sm text-[#1E3A8A] hover:text-[#1D4ED8]"
                  >
                    {dispute.project.name}
                  </button>
                </div>
                
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                    Total Budget
                  </p>
                  <p className="text-sm text-[#334155] font-medium">
                    ${dispute.project.budget.toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                    Escrow Balance
                  </p>
                  <p className="text-sm text-[#334155] font-medium">
                    ${dispute.project.escrowBalance.toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                    Disputed Amount
                  </p>
                  <p className="text-sm text-[#334155] font-medium">
                    ${dispute.milestone.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B] mb-2">
                    Client
                  </p>
                  <p className="text-sm text-[#334155] font-medium mb-1">
                    {dispute.client.name}
                  </p>
                  <p className="text-xs text-[#64748B] mb-0.5">{dispute.client.email}</p>
                  <p className="text-xs text-[#64748B]">{dispute.client.phone}</p>
                </div>
                
                <div className="pt-4 border-t border-[#E5E7EB]">
                  <p className="text-xs uppercase tracking-wide text-[#64748B] mb-2">
                    Company
                  </p>
                  <p className="text-sm text-[#334155] font-medium mb-1">
                    {dispute.company.name}
                  </p>
                  <p className="text-xs text-[#64748B] mb-0.5">{dispute.company.email}</p>
                  <p className="text-xs text-[#64748B]">{dispute.company.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Resolution Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  fullWidth
                  onClick={() => setReleaseModalOpen(true)}
                >
                  Release to Company
                </Button>
                
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => setRefundModalOpen(true)}
                >
                  Refund to Client
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Release Modal */}
      <Modal
        isOpen={releaseModalOpen}
        onClose={() => setReleaseModalOpen(false)}
        title="Release Funds to Company"
        primaryAction={{
          label: 'Release Funds',
          onClick: handleRelease,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setReleaseModalOpen(false),
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-[#64748B]">
            You are about to release{' '}
            <strong className="text-[#334155]">${dispute.milestone.amount.toLocaleString()}</strong>{' '}
            to <strong className="text-[#334155]">{dispute.company.name}</strong>.
          </p>
          
          <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E5E7EB]">
            <p className="text-sm text-[#334155] mb-2">
              <strong>This action will:</strong>
            </p>
            <ul className="space-y-1 text-sm text-[#64748B]">
              <li>• Transfer funds from escrow to company</li>
              <li>• Mark milestone as approved</li>
              <li>• Close this dispute</li>
              <li>• Notify both parties</li>
            </ul>
          </div>
          
          <Textarea
            label="Resolution Notes (Required)"
            placeholder="Explain your decision..."
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            rows={4}
            required
          />
        </div>
      </Modal>
      
      {/* Refund Modal */}
      <Modal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        title="Refund to Client"
        size="lg"
        primaryAction={{
          label: 'Process Refund',
          onClick: handleRefund,
          variant: 'danger',
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setRefundModalOpen(false),
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-[#64748B]">
            Process a refund to <strong className="text-[#334155]">{dispute.client.name}</strong>.
          </p>
          
          <CurrencyInput
            label="Refund Amount"
            placeholder="0.00"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            helperText={`Maximum: $${dispute.milestone.amount.toLocaleString()}`}
            required
          />
          
          <Textarea
            label="Resolution Notes (Required)"
            placeholder="Explain your decision..."
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            rows={4}
            required
          />
          
          <div className="bg-[#FEE2E2] rounded-lg p-4 border border-[#DC2626]/20">
            <p className="text-sm text-[#334155]">
              <strong>This action will:</strong>
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[#64748B]">
              <li>• Return specified amount to client</li>
              <li>• Mark milestone as rejected</li>
              <li>• Close this dispute</li>
              <li>• Notify both parties</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}
