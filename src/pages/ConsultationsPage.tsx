import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Building2, MapPin, Calendar, Clock, DollarSign } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { companyService, Company } from '../services/company.service';
import { consultationService, Consultation, PaginationMeta } from '../services/consultation.service';

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
  const [consultationsMeta, setConsultationsMeta] = useState<PaginationMeta | null>(null);
  const [consultationsPage, setConsultationsPage] = useState(1);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [isLoadingConsultations, setIsLoadingConsultations] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  
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
    setConsultationsPage(1);
  }, [userRole]);

  useEffect(() => {
    if (!userRole) {
      return;
    }
    loadConsultations(consultationsPage);
  }, [consultationsPage, userRole]);
  
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
  
  const consultationsPerPage = 10;

  const loadConsultations = async (page = consultationsPage) => {
    if (!userRole) {
      return;
    }
    
    try {
      setIsLoadingConsultations(true);
      // Use role-specific endpoints
      if (userRole === 'company') {
        const { consultations: fetchedConsultations, meta } = await consultationService.listForCompany({
          per_page: consultationsPerPage,
          page,
        });
        setConsultations(fetchedConsultations);
        setConsultationsMeta(meta);
      } else if (userRole === 'client') {
        const { consultations: fetchedConsultations, meta } = await consultationService.list({
          per_page: consultationsPerPage,
          page,
        });
        setConsultations(fetchedConsultations);
        setConsultationsMeta(meta);
      } else {
        // For other roles, set empty array
        setConsultations([]);
        setConsultationsMeta(null);
      }
    } catch (error: any) {
      console.error('Failed to load consultations:', error);
      // Don't show toast here - API interceptor already handles it
      // Just set empty array to prevent crashes
      setConsultations([]);
      setConsultationsMeta(null);
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

  const formatDateValue = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA');
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

  const filteredConsultations = consultations.filter((consultation) => {
    const displayName = userRole === 'company'
      ? (consultation.client?.name || 'Client')
      : (consultation.company?.company_name || 'Company');
    const matchesQuery = filterQuery
      ? displayName.toLowerCase().includes(filterQuery.trim().toLowerCase())
      : true;
    const matchesStatus = filterStatus === 'all'
      ? true
      : consultation.status?.toLowerCase() === filterStatus;
    const matchesPayment = filterPaymentStatus === 'all'
      ? true
      : consultation.payment_status?.toLowerCase() === filterPaymentStatus;
    const matchesDate = filterDate
      ? formatDateValue(consultation.scheduled_at) === filterDate
      : true;

    return matchesQuery && matchesStatus && matchesPayment && matchesDate;
  });

  const renderConsultationFilters = () => (
    <div className="bg-white rounded-t-xl border border-[#E5E7EB] shadow-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#64748B] mb-1">Search Name</label>
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search by name"
            className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#64748B] mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none text-sm bg-white"
          >
            <option value="all">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#64748B] mb-1">Payment</label>
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none text-sm bg-white"
          >
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#64748B] mb-1">Date</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none text-sm"
          />
        </div>
      </div>
    </div>
  );

  const renderConsultationsTable = () => (
    <div className="bg-white rounded-b-xl border border-t-0 border-[#E5E7EB] shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F8FAFC] text-[#64748B]">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Payment</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Time & Duration</th>
              <th className="px-4 py-3 text-left font-medium">Amount</th>
              <th className="px-4 py-3 text-left font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {filteredConsultations.map((consultation) => (
              <tr key={consultation.id} className="hover:bg-[#F8FAFC]">
                <td className="px-4 py-3">
                  <div className="font-medium text-[#334155]">
                    {userRole === 'company'
                      ? (consultation.client?.name || 'Client')
                      : (consultation.company?.company_name || 'Company')}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={getStatusBadgeStatus(consultation.status)} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={getPaymentStatusBadgeStatus(consultation.payment_status)} />
                </td>
                <td className="px-4 py-3 text-[#334155] whitespace-nowrap">
                  {formatDate(consultation.scheduled_at)}
                </td>
                <td className="px-4 py-3 text-[#334155] whitespace-nowrap">
                  {formatTime(consultation.scheduled_at)} ({consultation.duration_minutes} min)
                </td>
                <td className="px-4 py-3 text-[#334155] whitespace-nowrap">
                  ₦{consultation.price.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/consultations/${consultation.id}`)}
                      className="whitespace-nowrap"
                    >
                      View Details
                    </Button>
                    {userRole === 'client' && !consultation.is_paid && consultation.payment_status !== 'paid' && (
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            const payment = await consultationService.pay(consultation.id);
                            window.location.href = payment.payment_url;
                          } catch (error) {
                            console.error('Payment error:', error);
                          }
                        }}
                        className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all whitespace-nowrap"
                      >
                        Pay Now
                      </Button>
                    )}
                    {userRole === 'client' && (consultation.is_paid || consultation.payment_status === 'paid') && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]">
                        <span className="text-xs font-medium">✓ Paid</span>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderConsultationsPagination = () => {
    if (!consultationsMeta || consultationsMeta.last_page <= 1) {
      return null;
    }

    return (
      <div className="bg-white rounded-b-xl border border-t-0 border-[#E5E7EB] shadow-lg px-4 py-3 flex items-center justify-between">
        <p className="text-xs text-[#64748B]">
          Page {consultationsMeta.current_page} of {consultationsMeta.last_page}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setConsultationsPage((prev) => Math.max(1, prev - 1))}
            disabled={consultationsMeta.current_page <= 1}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setConsultationsPage((prev) => Math.min(consultationsMeta.last_page, prev + 1))}
            disabled={consultationsMeta.current_page >= consultationsMeta.last_page}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };
  
  // Show loading state while userRole is not available
  if (!userRole) {
    return (
      <div className="space-y-6  min-h-screen ">
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
            <p className="text-sm text-[#64748B]">Loading...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6  min-h-screen ">
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
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-1">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('companies')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-all rounded-lg ${
                activeTab === 'companies'
                  ? 'bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] text-white shadow-md'
                  : 'text-[#64748B] hover:text-[#334155] hover:bg-[#F8FAFC]'
              }`}
            >
              Browse Companies
            </button>
            <button
              onClick={() => setActiveTab('consultations')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-all rounded-lg ${
                activeTab === 'consultations'
                  ? 'bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] text-white shadow-md'
                  : 'text-[#64748B] hover:text-[#334155] hover:bg-[#F8FAFC]'
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
            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1E3A8A]/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-[#1E3A8A]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-[#334155]">Browse Verified Companies</h2>
                      <p className="text-xs text-[#64748B] mt-1">Find and book consultations with verified construction companies</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={loadCompanies}
                    disabled={isLoadingCompanies}
                  >
                    Refresh
                  </Button>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                  <input
                    type="text"
                    placeholder="Search companies by name, specialization..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        loadCompanies();
                      }
                    }}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none text-sm"
                  />
                </div>
              </div>
              
              {/* Companies List */}
              {isLoadingCompanies ? (
                <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-8">
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
                    <p className="text-sm text-[#64748B]">Loading companies...</p>
                  </div>
                </div>
              ) : companies.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-8">
                  <div className="text-center py-12">
                    <Building2 className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
                    <p className="text-sm text-[#64748B]">No verified companies found.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-[#F8FAFC] text-[#64748B]">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Company</th>
                          <th className="px-4 py-3 text-left font-medium">Registration</th>
                          <th className="px-4 py-3 text-left font-medium">Portfolio</th>
                          <th className="px-4 py-3 text-left font-medium">Consultation Fee</th>
                          <th className="px-4 py-3 text-left font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {companies.map((company) => (
                          <tr key={company.id} className="hover:bg-[#F8FAFC]">
                            <td className="px-4 py-3">
                              <div className="font-medium text-[#334155]">
                                {company.company_name}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {company.is_verified && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE]">
                                    ✓ Verified
                                  </span>
                                )}
                                {company.specialization && company.specialization.length > 0 && (
                                  <>
                                    {company.specialization.slice(0, 2).map((spec, idx) => (
                                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[#F8FAFC] text-[#64748B] border border-[#E5E7EB]">
                                        {spec}
                                      </span>
                                    ))}
                                    {company.specialization.length > 2 && (
                                      <span className="text-xs text-[#64748B]">+{company.specialization.length - 2}</span>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[#334155] whitespace-nowrap">
                              {company.registration_number || '—'}
                            </td>
                            <td className="px-4 py-3 text-[#334155] whitespace-nowrap">
                              {company.portfolio_links && company.portfolio_links.length > 0 ? 'Available' : '—'}
                            </td>
                            <td className="px-4 py-3 text-[#334155] whitespace-nowrap">
                              {((company as any).consultation_fee && (company as any).consultation_fee > 0) ? (
                                <span className="font-semibold text-[#1E3A8A]">
                                  ₦{(company as any).consultation_fee.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-xs text-[#F59E0B] font-medium">Not set</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleBookConsultation(company)}
                                className="whitespace-nowrap bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white"
                                disabled={!((company as any).consultation_fee && (company as any).consultation_fee > 0)}
                              >
                                Book Consultation
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Consultations Tab */}
          {activeTab === 'consultations' && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1E3A8A]/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#1E3A8A]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#334155]">My Consultations</h2>
                    <p className="text-xs text-[#64748B] mt-1">View and manage your consultation bookings</p>
                  </div>
                </div>
              </div>
              
        {isLoadingConsultations ? (
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
              <p className="text-sm text-[#64748B]">Loading consultations...</p>
            </div>
          </div>
        ) : consultations.length > 0 ? (
          <>
            <div>
              {renderConsultationFilters()}
              {filteredConsultations.length > 0 ? (
                <>
                  {renderConsultationsTable()}
                  {renderConsultationsPagination()}
                </>
              ) : (
                <div className="bg-white rounded-b-xl border border-t-0 border-[#E5E7EB] shadow-lg p-8">
                  <div className="text-center py-8">
                    <p className="text-sm text-[#64748B]">No consultations match your filters</p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-8">
            <div className="text-center py-12">
              <p className="text-sm text-[#64748B]">No consultations found</p>
            </div>
          </div>
        )}
            </div>
          )}
        </>
      ) : (
        /* Company/Admin view - No tabs, just show consultations */
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1E3A8A]/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#1E3A8A]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#334155]">
                  {userRole === 'company' ? 'Consultation Requests' : 'My Consultations'}
                </h2>
                <p className="text-xs text-[#64748B] mt-1">
                  {userRole === 'company' 
                    ? 'Manage consultation requests from clients'
                    : 'View and manage your consultation bookings'}
                </p>
              </div>
            </div>
          </div>
          
          {isLoadingConsultations ? (
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-8">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
                <p className="text-sm text-[#64748B]">Loading consultations...</p>
              </div>
            </div>
          ) : consultations.length > 0 ? (
            <>
              <div>
                {renderConsultationFilters()}
                {filteredConsultations.length > 0 ? (
                  <>
                    {renderConsultationsTable()}
                    {renderConsultationsPagination()}
                  </>
                ) : (
                  <div className="bg-white rounded-b-xl border border-t-0 border-[#E5E7EB] shadow-lg p-8">
                    <div className="text-center py-8">
                      <p className="text-sm text-[#64748B]">No consultations match your filters</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-8">
              <div className="text-center py-12">
                <p className="text-sm text-[#64748B]">No consultations found</p>
              </div>
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
        <div className="space-y-3">
          {selectedCompany && (
            <div className="bg-gradient-to-br from-[#1E3A8A]/5 to-[#2563EB]/5 rounded-xl p-4 border border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Booking with</p>
                  <p className="text-sm font-semibold text-[#334155]">
                    {selectedCompany.company_name}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Preferred Date"
                type="date"
                value={bookingForm.scheduledDate}
                onChange={(e) => setBookingForm({ ...bookingForm, scheduledDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            
            <div>
              <Input
                label="Preferred Time"
                type="time"
                value={bookingForm.scheduledTime}
                onChange={(e) => setBookingForm({ ...bookingForm, scheduledTime: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div>
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
          </div>
          
          {/* Display consultation fee - read-only, set by company */}
          {selectedCompany && (selectedCompany as any).consultation_fee && (selectedCompany as any).consultation_fee > 0 ? (
            <div className="bg-gradient-to-br from-[#1E3A8A]/5 to-[#2563EB]/5 rounded-xl p-5 border border-[#E5E7EB]">
              <label className="block text-sm font-medium text-[#334155] mb-3">
                Consultation Fee
              </label>
              <div className="flex items-baseline gap-2 mb-2">
                <p className="text-3xl font-bold text-[#1E3A8A]">
                  ₦{(selectedCompany as any).consultation_fee.toLocaleString()}
                </p>
              </div>
              <p className="text-xs text-[#64748B]">
                This fee is set by the company and cannot be changed
              </p>
            </div>
          ) : (
            <div className="px-4 py-4 bg-[#FEF3C7] border border-[#FCD34D] rounded-xl">
              <p className="text-sm text-[#92400E] font-medium">
                ⚠️ This company has not set a consultation fee. Please contact them before booking.
              </p>
            </div>
          )}
          
          {selectedCompany && (selectedCompany as any).consultation_fee && (selectedCompany as any).consultation_fee > 0 && (
            <div className="bg-[#F8FAFC] rounded-xl p-5 border border-[#E5E7EB]">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#64748B]">Consultation Fee</span>
                  <span className="font-medium text-[#334155]">
                    ₦{(selectedCompany as any).consultation_fee.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-[#E5E7EB] pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#334155]">Total</span>
                    <span className="text-xl font-bold text-[#1E3A8A]">
                      ₦{(selectedCompany as any).consultation_fee.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
