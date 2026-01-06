import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Calendar, Clock, Video, FileText, ArrowLeft, DollarSign, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { consultationService, Consultation } from '../services/consultation.service';

interface ConsultationDetailPageProps {
  consultationId: number;
  userRole?: 'client' | 'company' | 'admin' | null;
}

export function ConsultationDetailPage({ consultationId, userRole }: ConsultationDetailPageProps) {
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      <div className="space-y-6">
        <button
          onClick={() => navigate('/consultations')}
          className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#334155]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Consultations
        </button>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
          <p className="text-sm text-[#64748B]">Loading consultation...</p>
        </div>
      </div>
    );
  }
  
  if (!consultation) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/consultations')}
          className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#334155]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Consultations
        </button>
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-sm text-[#64748B]">Consultation not found</p>
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
        onClick={() => onNavigate('/consultations')}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#334155]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Consultations
      </button>
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155] mb-2">
            Consultation with {consultation.company?.company_name || 'Company'}
          </h1>
          <p className="text-sm text-[#64748B]">
            Consultation ID: #{consultation.id}
          </p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={consultation.status} />
          <StatusBadge 
            status={consultation.payment_status} 
            color={consultation.is_paid ? 'green' : 'yellow'} 
          />
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session Details */}
          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-[#64748B] mt-0.5" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                        Scheduled Date
                      </p>
                      <p className="text-sm text-[#334155]">{formatDate(consultation.scheduled_at)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#64748B] mt-0.5" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                        Time & Duration
                      </p>
                      <p className="text-sm text-[#334155]">
                        {formatTime(consultation.scheduled_at)} ({consultation.duration_minutes} min)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-[#64748B] mt-0.5" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                        Consultation Fee
                      </p>
                      <p className="text-sm text-[#334155]">₦{consultation.price.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-[#64748B] mt-0.5" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                        Payment Status
                      </p>
                      <StatusBadge 
                        status={consultation.payment_status} 
                        color={consultation.is_paid ? 'green' : 'yellow'} 
                      />
                    </div>
                  </div>
                </div>
                
                {consultation.meeting_link && (
                  <div className="flex items-start gap-3 pt-4 border-t border-[#E5E7EB]">
                    <Video className="w-5 h-5 text-[#64748B] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-2">
                        Meeting Link
                      </p>
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
                )}
              </div>
              
              {consultation.status === 'scheduled' && consultation.is_paid && consultation.meeting_link && (
                <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
                  <Button 
                    fullWidth
                    onClick={() => window.open(consultation.meeting_link!, '_blank')}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Join Meeting
                  </Button>
                </div>
              )}
              
              {userRole === 'client' && consultation.status === 'scheduled' && !consultation.is_paid && (
                <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
                  <Button fullWidth onClick={handlePay}>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Pay Consultation Fee (₦{consultation.price.toLocaleString()})
                  </Button>
                </div>
              )}
              
              {userRole === 'company' && consultation.status === 'scheduled' && consultation.is_paid && !consultation.is_completed && (
                <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
                  <Button 
                    fullWidth 
                    onClick={async () => {
                      try {
                        await consultationService.complete(consultation.id);
                        toast.success('Consultation marked as completed');
                        loadConsultation();
                      } catch (error) {
                        console.error('Failed to complete consultation:', error);
                      }
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Completed
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>After the Consultation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#334155]">Define Project Scope</p>
                    <p className="text-sm text-[#64748B] mt-1">
                      Work with the company to outline your project requirements and timeline.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#334155]">Review Proposal</p>
                    <p className="text-sm text-[#64748B] mt-1">
                      Company will provide detailed proposal with milestones and pricing.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#334155]">Fund Escrow</p>
                    <p className="text-sm text-[#64748B] mt-1">
                      Once approved, fund the project escrow to begin construction.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle>Company Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                    Company Name
                  </p>
                  <p className="text-sm text-[#334155] font-medium">
                    {consultation.company?.company_name || 'N/A'}
                  </p>
                </div>
                
                {consultation.company?.user && (
                  <>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                        Contact Person
                      </p>
                      <p className="text-sm text-[#334155]">{consultation.company.user.name}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                        Email
                      </p>
                      <a
                        href={`mailto:${consultation.company.user.email}`}
                        className="text-sm text-[#1E3A8A] hover:text-[#1D4ED8]"
                      >
                        {consultation.company.user.email}
                      </a>
                    </div>
                  </>
                )}
                
                {consultation.company?.registration_number && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                      Registration Number
                    </p>
                    <p className="text-sm text-[#334155]">{consultation.company.registration_number}</p>
                  </div>
                )}
                
                {consultation.company?.specialization && consultation.company.specialization.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                      Specialization
                    </p>
                    <p className="text-sm text-[#334155]">
                      {consultation.company.specialization.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748B]">Consultation Fee</span>
                  <span className="text-sm font-medium text-[#334155]">
                    ₦{consultation.price.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
                  <span className="text-sm font-medium text-[#334155]">Payment Status</span>
                  <StatusBadge 
                    status={consultation.payment_status} 
                    color={consultation.is_paid ? 'green' : 'yellow'} 
                  />
                </div>
                
                {!consultation.is_paid && (
                  <div className="pt-3 border-t border-[#E5E7EB]">
                    <Button fullWidth onClick={handlePay}>
                      Pay Now
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
