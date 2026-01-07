import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Building2, MapPin, Calendar, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { companyService, Company } from '../services/company.service';
import { consultationService, Consultation } from '../services/consultation.service';

interface ConsultationsPageProps {
  userRole?: 'client' | 'company' | 'admin' | null;
}

export function ConsultationsPage({ userRole }: ConsultationsPageProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'companies' | 'consultations'>('companies');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [isLoadingConsultations, setIsLoadingConsultations] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    scheduledDate: '',
    scheduledTime: '',
    durationMinutes: 30,
    // Price is no longer in form - backend uses company's consultation_fee
  });
  
  // Fetch companies and consultations on mount
  useEffect(() => {
    if (!userRole) {
      // Wait for userRole to be available
      return;
    }
    
    if (userRole === 'client') {
      loadCompanies();
    }
    loadConsultations();
  }, [userRole]);
  
  const loadCompanies = async () => {
    try {
      setIsLoadingCompanies(true);
      const { companies: fetchedCompanies } = await companyService.listVerified({
        per_page: 20,
        ...(searchQuery && { search: searchQuery }),
      });
      setCompanies(fetchedCompanies);
    } catch (error: any) {
      console.error('Failed to load companies:', error);
      // Don't show toast here - API interceptor already handles it
      // Just set empty array to prevent crashes
      setCompanies([]);
    } finally {
      setIsLoadingCompanies(false);
    }
  };
  
  const loadConsultations = async () => {
    if (!userRole) {
      return;
    }
    
    try {
      setIsLoadingConsultations(true);
      // Use role-specific endpoints
      if (userRole === 'company') {
        const { consultations: fetchedConsultations } = await consultationService.listForCompany();
        setConsultations(fetchedConsultations);
      } else if (userRole === 'client') {
        const { consultations: fetchedConsultations } = await consultationService.list();
        setConsultations(fetchedConsultations);
      } else {
        // For other roles, set empty array
        setConsultations([]);
      }
    } catch (error: any) {
      console.error('Failed to load consultations:', error);
      // Don't show toast here - API interceptor already handles it
      // Just set empty array to prevent crashes
      setConsultations([]);
    } finally {
      setIsLoadingConsultations(false);
    }
  };
  
  const handleBookConsultation = (company: Company) => {
    setSelectedCompany(company);
    setBookingForm({
      scheduledDate: '',
      scheduledTime: '',
      durationMinutes: 30,
    });
    setBookingModalOpen(true);
  };
  
  const handleConfirmBooking = async () => {
    if (!selectedCompany) return;
    
    if (!bookingForm.scheduledDate || !bookingForm.scheduledTime) {
      toast.error('Please select date and time for consultation');
      return;
    }
    
    // Validate that company has set a consultation fee
    const companyFee = (selectedCompany as any).consultation_fee;
    if (!companyFee || companyFee <= 0) {
      toast.error('This company has not set a consultation fee. Please contact them before booking.');
      return;
    }
    
    setIsBooking(true);
    
    try {
      // Combine date and time into ISO datetime string
      const scheduledAt = new Date(`${bookingForm.scheduledDate}T${bookingForm.scheduledTime}`).toISOString();
      
      // Create consultation - price is set by backend from company's consultation_fee
      const consultation = await consultationService.create({
        company_id: selectedCompany.id,
        scheduled_at: scheduledAt,
        duration_minutes: bookingForm.durationMinutes,
        // Price is NOT sent - backend uses company's consultation_fee
      });
      
      toast.success('Consultation booked successfully!');
    setBookingModalOpen(false);
      
      // Initialize payment
      const payment = await consultationService.pay(consultation.id);
      
      // Redirect to payment URL
      window.location.href = payment.payment_url;
    } catch (error) {
      console.error('Booking error:', error);
      // Error already handled by API client interceptor
    } finally {
      setIsBooking(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
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
  
  // Show loading state while userRole is not available
  if (!userRole) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
          <p className="text-sm text-[#64748B]">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#334155] mb-2">Consultations</h1>
        <p className="text-sm text-[#64748B]">
          {userRole === 'company' 
            ? 'Manage your consultation bookings and meetings.'
            : 'Browse verified construction companies and manage your consultations.'}
        </p>
      </div>
      
      {/* Tabs - Only for clients */}
      {userRole === 'client' && (
        <div className="border-b border-[#E5E7EB]">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('companies')}
              className={`pb-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'companies'
                  ? 'border-[#1E3A8A] text-[#1E3A8A]'
                  : 'border-transparent text-[#64748B] hover:text-[#334155]'
              }`}
            >
              Browse Companies
            </button>
            <button
              onClick={() => setActiveTab('consultations')}
              className={`pb-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'consultations'
                  ? 'border-[#1E3A8A] text-[#1E3A8A]'
                  : 'border-transparent text-[#64748B] hover:text-[#334155]'
              }`}
            >
              My Consultations {consultations.length > 0 && `(${consultations.length})`}
            </button>
          </div>
        </div>
      )}
      
      {/* Tab Content */}
      {userRole === 'client' ? (
        <>
          {/* Companies Tab */}
          {activeTab === 'companies' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#334155]">Browse Verified Companies</h2>
                <Button
                  variant="outline"
                  onClick={loadCompanies}
                  disabled={isLoadingCompanies}
                >
                  Refresh
                </Button>
              </div>
              
              {/* Search */}
              <Card>
                <CardContent>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                    <input
                      type="text"
                      placeholder="Search companies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          loadCompanies();
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Companies List */}
              {isLoadingCompanies ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
                  <p className="text-sm text-[#64748B]">Loading companies...</p>
                </div>
              ) : companies.length === 0 ? (
                <Card>
                  <CardContent>
                    <div className="text-center py-12">
                      <Building2 className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
                      <p className="text-sm text-[#64748B]">No verified companies found.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {companies.map((company) => (
                    <Card key={company.id}>
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Company Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-medium text-[#334155]">
                                  {company.company_name}
                                </h3>
                                {company.is_verified && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#DBEAFE] text-[#1E40AF]">
                                    Verified
                                  </span>
                                )}
                              </div>
                              {company.specialization && company.specialization.length > 0 && (
                                <p className="text-sm text-[#64748B]">
                                  {company.specialization.join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {company.registration_number && (
                            <p className="text-sm text-[#64748B] mb-4">
                              Registration: {company.registration_number}
                            </p>
                          )}
                          
                          {company.portfolio_links && company.portfolio_links.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-[#64748B] mb-4">
                              <Building2 className="w-4 h-4" />
                              <span>Portfolio Available</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Booking Section */}
                        <div className="md:w-64 flex flex-col justify-between md:border-l md:border-[#E5E7EB] md:pl-6">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                              Consultation Fee
                            </p>
                            <p className="text-2xl font-semibold text-[#334155] mb-4">
                              ₦{((company as any).consultation_fee && (company as any).consultation_fee > 0 
                                ? (company as any).consultation_fee 
                                : 0).toLocaleString()}
                            </p>
                            {!((company as any).consultation_fee && (company as any).consultation_fee > 0) && (
                              <p className="text-xs text-[#64748B]">Fee not set by company</p>
                            )}
                          </div>
                          
                          <Button
                            fullWidth
                            onClick={() => handleBookConsultation(company)}
                          >
                            Book Consultation
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Consultations Tab */}
          {activeTab === 'consultations' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#334155]">My Consultations</h2>
        {isLoadingConsultations ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
            <p className="text-sm text-[#64748B]">Loading consultations...</p>
          </div>
        ) : consultations.length > 0 ? (
          <div className="grid gap-4">
            {consultations.map((consultation) => (
              <Card key={consultation.id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-[#334155]">
                        {userRole === 'company' 
                          ? (consultation.client?.name || 'Client')
                          : (consultation.company?.company_name || 'Company')}
                      </h3>
                      <StatusBadge status={getStatusBadgeStatus(consultation.status)} />
                      <StatusBadge 
                        status={getPaymentStatusBadgeStatus(consultation.payment_status)} 
                      />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#64748B]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(consultation.scheduled_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(consultation.scheduled_at)} ({consultation.duration_minutes} min)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>₦{consultation.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/consultations/${consultation.id}`)}
                    >
                      View Details
                    </Button>
                    {userRole === 'client' && !consultation.is_paid && consultation.payment_status !== 'paid' && (
                      <Button
                        onClick={async () => {
                          try {
                            const payment = await consultationService.pay(consultation.id);
                            window.location.href = payment.payment_url;
                          } catch (error) {
                            console.error('Payment error:', error);
                          }
                        }}
                      >
                        Pay Now
                      </Button>
                    )}
                    {userRole === 'client' && (consultation.is_paid || consultation.payment_status === 'paid') && (
                      <span className="text-sm text-[#16A34A] font-medium">Paid</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-[#64748B]">No consultations found</p>
          </div>
        )}
            </div>
          )}
        </>
      ) : (
        /* Company/Admin view - No tabs, just show consultations */
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#334155]">
            {userRole === 'company' ? 'Consultation Requests' : 'My Consultations'}
          </h2>
          {isLoadingConsultations ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
              <p className="text-sm text-[#64748B]">Loading consultations...</p>
            </div>
          ) : consultations.length > 0 ? (
            <div className="grid gap-4">
              {consultations.map((consultation) => (
                <Card key={consultation.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-[#334155]">
                          {userRole === 'company' 
                            ? (consultation.client?.name || 'Client')
                            : (consultation.company?.company_name || 'Company')}
                        </h3>
                        <StatusBadge status={getStatusBadgeStatus(consultation.status)} />
                        <StatusBadge 
                          status={getPaymentStatusBadgeStatus(consultation.payment_status)} 
                        />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#64748B]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(consultation.scheduled_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(consultation.scheduled_at)} ({consultation.duration_minutes} min)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>₦{consultation.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/consultations/${consultation.id}`)}
                      >
                        View Details
                      </Button>
                      {userRole === 'client' && !consultation.is_paid && consultation.payment_status !== 'paid' && (
                        <Button
                          onClick={async () => {
                            try {
                              const payment = await consultationService.pay(consultation.id);
                              window.location.href = payment.payment_url;
                            } catch (error) {
                              console.error('Payment error:', error);
                            }
                          }}
                        >
                          Pay Now
                        </Button>
                      )}
                      {userRole === 'client' && (consultation.is_paid || consultation.payment_status === 'paid') && (
                        <span className="text-sm text-[#16A34A] font-medium">Paid</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-[#64748B]">No consultations found</p>
            </div>
          )}
        </div>
      )}
      
      {/* Booking Modal */}
      <Modal
        isOpen={bookingModalOpen}
        onClose={() => !isBooking && setBookingModalOpen(false)}
        title="Book Consultation"
        primaryAction={{
          label: isBooking ? 'Processing...' : 'Confirm & Pay',
          onClick: handleConfirmBooking,
          disabled: isBooking,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setBookingModalOpen(false),
          disabled: isBooking,
        }}
      >
        <div className="space-y-4">
          {selectedCompany && (
          <p className="text-sm text-[#64748B]">
            You're about to book a consultation with{' '}
            <strong className="text-[#334155]">
                {selectedCompany.company_name}
            </strong>
          </p>
          )}
          
          <Input
            label="Preferred Date"
            type="date"
            value={bookingForm.scheduledDate}
            onChange={(e) => setBookingForm({ ...bookingForm, scheduledDate: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            required
          />
          
          <Input
            label="Preferred Time"
            type="time"
            value={bookingForm.scheduledTime}
            onChange={(e) => setBookingForm({ ...bookingForm, scheduledTime: e.target.value })}
            required
          />
          
          <Select
            label="Duration"
            options={[
              { value: '15', label: '15 minutes' },
              { value: '30', label: '30 minutes' },
              { value: '45', label: '45 minutes' },
              { value: '60', label: '60 minutes' },
            ]}
            value={bookingForm.durationMinutes.toString()}
            onChange={(e) => setBookingForm({ ...bookingForm, durationMinutes: parseInt(e.target.value) })}
            required
          />
          
          {/* Display consultation fee - read-only, set by company */}
          {selectedCompany && (selectedCompany as any).consultation_fee && (selectedCompany as any).consultation_fee > 0 ? (
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-2">
                Consultation Fee (NGN)
              </label>
              <div className="px-4 py-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg">
                <p className="text-lg font-semibold text-[#334155]">
                  ₦{(selectedCompany as any).consultation_fee.toLocaleString()}
                </p>
                <p className="text-xs text-[#64748B] mt-1">
                  This fee is set by the company and cannot be changed
                </p>
              </div>
            </div>
          ) : (
            <div className="px-4 py-3 bg-[#FEF3C7] border border-[#FCD34D] rounded-lg">
              <p className="text-sm text-[#92400E]">
                ⚠️ This company has not set a consultation fee. Please contact them before booking.
              </p>
            </div>
          )}
          
          {selectedCompany && (selectedCompany as any).consultation_fee && (selectedCompany as any).consultation_fee > 0 && (
            <div className="pt-4 border-t border-[#E5E7EB]">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[#64748B]">Consultation Fee</span>
                <span className="font-medium text-[#334155]">
                  ₦{(selectedCompany as any).consultation_fee.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#334155]">Total</span>
                <span className="text-lg font-semibold text-[#334155]">
                  ₦{(selectedCompany as any).consultation_fee.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
