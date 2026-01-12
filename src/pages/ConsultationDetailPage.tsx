import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Calendar, Clock, Video, FileText, ArrowLeft, DollarSign, CheckCircle, Building2 } from 'lucide-react';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { consultationService, Consultation } from '../services/consultation.service';
import { projectService } from '../services/project.service';
import { formatAmountWithCurrency, parseFormattedAmount } from '../lib/money-utils';

interface ConsultationDetailPageProps {
  consultationId: string; // UUID
  userRole?: 'client' | 'company' | 'admin' | null;
}

export function ConsultationDetailPage({ consultationId, userRole }: ConsultationDetailPageProps) {
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    location: '',
    budget_min: '',
    budget_max: '',
  });
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (consultationId) {
      loadConsultation();
    }
  }, [consultationId, userRole]);
  
  const loadConsultation = async () => {
    try {
      setIsLoading(true);
      // Use role-specific endpoints
      let fetchedConsultation: Consultation;
      if (userRole === 'company') {
        fetchedConsultation = await consultationService.getForCompany(consultationId);
      } else {
        fetchedConsultation = await consultationService.get(consultationId);
      }
      setConsultation(fetchedConsultation);
      
      // Debug: Log consultation data for company users
      if (userRole === 'company') {
        console.log('Consultation data for company:', {
          status: fetchedConsultation.status,
          is_paid: fetchedConsultation.is_paid,
          payment_status: fetchedConsultation.payment_status,
          is_completed: fetchedConsultation.is_completed,
          userRole,
        });
      }
    } catch (error) {
      console.error('Failed to load consultation:', error);
      toast.error('Failed to load consultation details');
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };
  
  const getStatusBadgeStatus = (status: string): 'pending' | 'approved' | 'rejected' | 'scheduled' | 'completed' | 'active' => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'scheduled';
      case 'completed':
        return 'completed';
      case 'active':
      case 'in_progress':
        return 'active';
      case 'pending':
        return 'pending';
      case 'approved':
        return 'approved';
      case 'rejected':
      case 'cancelled':
        return 'rejected';
      default:
        return 'pending';
    }
  };
  
  const getPaymentStatusBadgeStatus = (status: string): 'pending' | 'approved' | 'rejected' => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'approved';
      case 'pending':
      case 'unpaid':
        return 'pending';
      case 'refunded':
        return 'rejected';
      default:
        return 'pending';
    }
  };
  
  const handlePay = async () => {
    if (!consultation) return;
    
    try {
      const payment = await consultationService.pay(consultation.id);
      window.location.href = payment.payment_url;
    } catch (error) {
      console.error('Payment error:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6 min-h-screen">
        <button
          onClick={() => navigate('/consultations')}
          className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#334155] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Consultations
        </button>
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
            <p className="text-sm text-[#64748B]">Loading consultation...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!consultation) {
    return (
      <div className="space-y-6 min-h-screen">
        <button
          onClick={() => navigate('/consultations')}
          className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#334155] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Consultations
        </button>
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-8">
          <div className="text-center py-12">
            <p className="text-sm text-[#64748B]">Consultation not found</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 min-h-screen">
      {/* Back Button */}
      <button
        onClick={() => navigate('/consultations')}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#334155] transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Consultations
      </button>
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[#334155] mb-1">
                Consultation with {consultation.company?.company_name || 'Company'}
              </h1>
              <p className="text-sm text-[#64748B]">
                Consultation ID: {consultation.id.slice(0, 8)}...
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={getStatusBadgeStatus(consultation.status)} />
            <StatusBadge 
              status={getPaymentStatusBadgeStatus(consultation.payment_status)} 
            />
          </div>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session Details */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg">
            <div className="border-b border-[#E5E7EB] pb-4 px-6 pt-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#1E3A8A]" />
                <h3 className="text-lg font-semibold text-[#334155]">Session Details</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-[#1E3A8A]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B] mb-1">Scheduled Date</p>
                      <p className="text-sm font-medium text-[#334155]">{formatDate(consultation.scheduled_at)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
                      <Clock className="w-5 h-5 text-[#1E3A8A]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B] mb-1">Time & Duration</p>
                      <p className="text-sm font-medium text-[#334155]">
                        {formatTime(consultation.scheduled_at)} ({consultation.duration_minutes} min)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-[#1E3A8A]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-[#64748B] mb-1">Consultation Fee</p>
                      <p className="text-sm font-medium text-[#334155]">{formatAmountWithCurrency(consultation.price)}</p>
                      {/* Platform fee breakdown only visible to companies */}
                      {userRole !== 'client' && consultation.platform_fee && consultation.platform_fee > 0 && consultation.is_paid && (
                        <div className="mt-2 pt-2 border-t border-[#E5E7EB] space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-[#64748B]">
                              Platform Fee ({consultation.platform_fee_percentage || 0}%)
                            </span>
                            <span className="text-xs font-medium text-[#F97316]">
                              -{formatAmountWithCurrency(consultation.platform_fee)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-xs font-medium text-[#334155]">
                              Amount You'll Receive
                            </span>
                            <span className="text-xs font-bold text-[#334155]">
                              {formatAmountWithCurrency(consultation.net_amount || (parseFormattedAmount(consultation.price) - parseFormattedAmount(consultation.platform_fee)))}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
                      <FileText className="w-5 h-5 text-[#1E3A8A]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B] mb-1">Payment Status</p>
                      <StatusBadge 
                        status={getPaymentStatusBadgeStatus(consultation.payment_status)} 
                      />
                    </div>
                  </div>
                </div>
                
                {consultation.meeting_link && (
                  <div className="pt-4 border-t border-[#E5E7EB]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
                        <Video className="w-5 h-5 text-[#1E3A8A]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-[#64748B] mb-2">Meeting Link</p>
                        <a
                          href={consultation.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#1E3A8A] hover:text-[#1D4ED8] underline break-all"
                        >
                          {consultation.meeting_link}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {consultation.status === 'scheduled' && consultation.is_paid && consultation.meeting_link && (
                <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
                  <Button 
                    fullWidth
                    onClick={() => window.open(consultation.meeting_link!, '_blank')}
                    className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Join Meeting
                  </Button>
                </div>
              )}
              
              {userRole === 'client' && consultation.status === 'scheduled' && !consultation.is_paid && consultation.payment_status !== 'paid' && (
                <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
                  <Button 
                    fullWidth 
                    onClick={handlePay}
                    className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Pay Consultation Fee ({formatAmountWithCurrency(consultation.price)})
                  </Button>
                </div>
              )}
              {userRole === 'client' && (consultation.is_paid || consultation.payment_status === 'paid') && (
                <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
                  <div className="bg-[#D1FAE5] rounded-lg p-4 text-center border border-[#A7F3D0]">
                    <p className="text-sm font-medium text-[#065F46]">✓ Payment Completed</p>
                  </div>
                </div>
              )}
              
              {userRole === 'company' && 
               consultation.status === 'scheduled' && 
               (consultation.is_paid || consultation.payment_status === 'paid') && 
               consultation.status !== 'completed' && 
               !consultation.is_completed && (
                <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
                  <Button 
                    fullWidth 
                    onClick={async () => {
                      try {
                        await consultationService.complete(consultation.id);
                        toast.success('Consultation marked as completed');
                        loadConsultation();
                      } catch (error: any) {
                        console.error('Failed to complete consultation:', error);
                        toast.error(error.response?.data?.message || 'Failed to mark consultation as completed');
                      }
                    }}
                    className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Completed
                  </Button>
                </div>
              )}

              {userRole === 'client' && consultation.status === 'completed' && (consultation.is_paid || consultation.payment_status === 'paid') && (
                <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
                  <Button 
                    fullWidth 
                    onClick={() => setShowCreateProjectModal(true)}
                    className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Create Project from Consultation
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Next Steps */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg">
            <div className="border-b border-[#E5E7EB] pb-4 px-6 pt-6">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#1E3A8A]" />
                <h3 className="text-lg font-semibold text-[#334155]">After the Consultation</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#334155]">Define Project Scope</p>
                    <p className="text-sm text-[#64748B] mt-1">
                      Work with the company to outline your project requirements and timeline.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#334155]">Review Proposal</p>
                    <p className="text-sm text-[#64748B] mt-1">
                      Company will provide detailed proposal with milestones and pricing.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#334155]">Fund Escrow</p>
                    <p className="text-sm text-[#64748B] mt-1">
                      Once approved, fund the project escrow to begin construction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Info */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg">
            <div className="border-b border-[#E5E7EB] pb-4 px-6 pt-6">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#1E3A8A]" />
                <h3 className="text-lg font-semibold text-[#334155]">Company Contact</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Company Name</p>
                  <p className="text-sm text-[#334155] font-semibold">
                    {consultation.company?.company_name || 'N/A'}
                  </p>
                </div>
                
                {consultation.company?.user && (
                  <>
                    <div>
                      <p className="text-xs text-[#64748B] mb-1">Contact Person</p>
                      <p className="text-sm text-[#334155] font-medium">{consultation.company.user.name}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-[#64748B] mb-1">Email</p>
                      <a
                        href={`mailto:${consultation.company.user.email}`}
                        className="text-sm text-[#1E3A8A] hover:text-[#1D4ED8] font-medium"
                      >
                        {consultation.company.user.email}
                      </a>
                    </div>
                  </>
                )}
                
                {consultation.company?.registration_number && (
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Registration Number</p>
                    <p className="text-sm text-[#334155] font-medium">{consultation.company.registration_number}</p>
                  </div>
                )}
                
                {consultation.company?.specialization && consultation.company.specialization.length > 0 && (
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Specialization</p>
                    <div className="flex flex-wrap gap-2">
                      {consultation.company.specialization.map((spec, idx) => (
                        <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#F8FAFC] text-[#64748B] border border-[#E5E7EB]">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Payment Info */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg">
            <div className="border-b border-[#E5E7EB] pb-4 px-6 pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#1E3A8A]" />
                <h3 className="text-lg font-semibold text-[#334155]">Payment</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#64748B]">Consultation Fee</span>
                    <span className="text-sm font-medium text-[#334155]">
                      ₦{consultation.price.toLocaleString()}
                    </span>
                  </div>
                  {/* Platform fee breakdown only visible to companies */}
                  {userRole !== 'client' && consultation.platform_fee && consultation.platform_fee > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#64748B]">
                          Platform Fee ({consultation.platform_fee_percentage || 0}%)
                        </span>
                        <span className="text-xs font-medium text-[#F97316]">
                          -₦{consultation.platform_fee.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-[#E5E7EB]">
                        <span className="text-sm font-medium text-[#334155]">
                          Amount You'll Receive
                        </span>
                        <span className="text-sm font-bold text-[#334155]">
                          ₦{(consultation.net_amount || (consultation.price - consultation.platform_fee)).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-[#64748B] mt-1">
                  {userRole === 'client' 
                    ? `Consultation fee for ${consultation.company?.company_name || 'the company'}`
                    : `Paid by client for consultation services`}
                </p>
                
                <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
                  <span className="text-sm font-medium text-[#334155]">Payment Status</span>
                  <StatusBadge 
                    status={getPaymentStatusBadgeStatus(consultation.payment_status)} 
                  />
                </div>
                
                {userRole === 'client' && !consultation.is_paid && consultation.payment_status !== 'paid' && (
                  <div className="pt-4 border-t border-[#E5E7EB]">
                    <Button 
                      fullWidth 
                      onClick={handlePay}
                      className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all"
                    >
                      Pay Now
                    </Button>
                  </div>
                )}
                {userRole === 'client' && (consultation.is_paid || consultation.payment_status === 'paid') && (
                  <div className="pt-4 border-t border-[#E5E7EB]">
                    <div className="bg-[#D1FAE5] rounded-lg p-3 text-center border border-[#A7F3D0]">
                      <p className="text-sm font-medium text-[#065F46]">✓ Payment Completed</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        title="Create New Project"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-1">
              Project Title *
            </label>
            <Input
              value={projectForm.title}
              onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
              placeholder="e.g., 3-Bedroom House Construction"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#334155] mb-1">
              Description
            </label>
            <Textarea
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              placeholder="Describe your project requirements..."
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#334155] mb-1">
              Location *
            </label>
            <Input
              value={projectForm.location}
              onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })}
              placeholder="e.g., Lagos, Nigeria"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">
                Budget Min (₦)
              </label>
              <Input
                type="number"
                value={projectForm.budget_min}
                onChange={(e) => setProjectForm({ ...projectForm, budget_min: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">
                Budget Max (₦)
              </label>
              <Input
                type="number"
                value={projectForm.budget_max}
                onChange={(e) => setProjectForm({ ...projectForm, budget_max: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowCreateProjectModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!projectForm.title || !projectForm.location) {
                  toast.error('Please fill in all required fields');
                  return;
                }

                try {
                  setIsCreatingProject(true);
                  const project = await projectService.create({
                    consultation_id: consultation!.id,
                    title: projectForm.title,
                    description: projectForm.description || undefined,
                    location: projectForm.location,
                    budget_min: projectForm.budget_min ? parseFloat(projectForm.budget_min) : undefined,
                    budget_max: projectForm.budget_max ? parseFloat(projectForm.budget_max) : undefined,
                  });
                  
                  toast.success('Project created successfully!');
                  setShowCreateProjectModal(false);
                  navigate(`/projects/${project.id}`);
                } catch (error: any) {
                  console.error('Failed to create project:', error);
                  toast.error(error.response?.data?.message || 'Failed to create project');
                } finally {
                  setIsCreatingProject(false);
                }
              }}
              disabled={isCreatingProject}
              className="flex-1"
            >
              {isCreatingProject ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
