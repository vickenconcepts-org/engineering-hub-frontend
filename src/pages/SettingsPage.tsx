import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Building2, Upload, X, Plus, AlertCircle, CheckCircle, CreditCard, Trash2, Star, Settings } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { StatusBadge } from '../components/StatusBadge';
import { FilePreviewInput } from '../components/FilePreviewInput';
import { companyProfileService, CompanyProfile, CreateCompanyProfileData } from '../services/company-profile.service';
import { paymentAccountService, PaymentAccount, CreatePaymentAccountData } from '../services/payment-account.service';

interface SettingsPageProps {
  onNavigate: (path: string) => void;
  userRole?: 'client' | 'company' | 'admin' | null;
}

export function SettingsPage({ onNavigate, userRole }: SettingsPageProps) {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    company_name: '',
    registration_number: '',
    portfolio_links: [] as string[],
    specialization: [] as string[],
    consultation_fee: 0,
  });
  
  const [cacCertificate, setCacCertificate] = useState<File | null>(null);
  const [memart, setMemart] = useState<File | null>(null);
  const [applicationForRegistration, setApplicationForRegistration] = useState<File | null>(null);
  const [removeCacCertificate, setRemoveCacCertificate] = useState(false);
  const [removeMemart, setRemoveMemart] = useState(false);
  const [removeApplicationForRegistration, setRemoveApplicationForRegistration] = useState(false);
  const [newPortfolioLink, setNewPortfolioLink] = useState('');
  const [newSpecialization, setNewSpecialization] = useState('');
  
  useEffect(() => {
    if (userRole === 'company') {
      loadProfile();
    } else {
      setIsLoading(false);
    }
  }, [userRole]);
  
  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const fetchedProfile = await companyProfileService.get();
      if (fetchedProfile) {
        setProfile(fetchedProfile);
        setFormData({
          company_name: fetchedProfile.company_name || '',
          registration_number: fetchedProfile.registration_number || '',
          portfolio_links: fetchedProfile.portfolio_links || [],
          specialization: fetchedProfile.specialization || [],
          consultation_fee: fetchedProfile.consultation_fee ?? 0,
        });
        setRemoveCacCertificate(false);
        setRemoveMemart(false);
        setRemoveApplicationForRegistration(false);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  
  const addPortfolioLink = () => {
    if (newPortfolioLink.trim() && isValidUrl(newPortfolioLink)) {
      setFormData(prev => ({
        ...prev,
        portfolio_links: [...prev.portfolio_links, newPortfolioLink.trim()],
      }));
      setNewPortfolioLink('');
    } else {
      toast.error('Please enter a valid URL');
    }
  };
  
  const removePortfolioLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      portfolio_links: prev.portfolio_links.filter((_, i) => i !== index),
    }));
  };
  
  const addSpecialization = () => {
    if (newSpecialization.trim()) {
      setFormData(prev => ({
        ...prev,
        specialization: [...prev.specialization, newSpecialization.trim()],
      }));
      setNewSpecialization('');
    }
  };
  
  const removeSpecialization = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specialization: prev.specialization.filter((_, i) => i !== index),
    }));
  };
  
  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSaving(true);
    
    try {
      const profileData: any = {};
      
      // Only include fields that can be updated (or consultation_fee which can always be updated)
      // If company is approved, don't send core fields
      // Check both is_approved and status === 'approved'
      const isApproved = profile?.is_approved || profile?.status === 'approved';
      console.log('Profile approval status:', { 
        is_approved: profile?.is_approved, 
        status: profile?.status, 
        isApproved 
      });
      
      if (!isApproved) {
        if (!formData.company_name || !formData.registration_number) {
          toast.error('Company name and registration number are required');
          setIsSaving(false);
          return;
        }
        profileData.company_name = formData.company_name;
        profileData.registration_number = formData.registration_number;
        if (formData.portfolio_links.length > 0) {
          profileData.portfolio_links = formData.portfolio_links;
        }
        if (formData.specialization.length > 0) {
          profileData.specialization = formData.specialization;
        }
      } else {
        console.log('Company is approved - only sending consultation_fee');
      }
      
      if (cacCertificate) {
        profileData.cac_certificate = cacCertificate;
      }
      if (memart) {
        profileData.memart = memart;
      }
      if (applicationForRegistration) {
        profileData.application_for_registration = applicationForRegistration;
      }
      if (removeCacCertificate) {
        profileData.remove_cac_certificate = true;
      }
      if (removeMemart) {
        profileData.remove_memart = true;
      }
      if (removeApplicationForRegistration) {
        profileData.remove_application_for_registration = true;
      }
      
      // Always include consultation_fee if it's defined (even if 0) - can be updated anytime
      // consultation_fee can be 0, so we check for undefined/null specifically, not falsy
      if (formData.consultation_fee !== undefined && formData.consultation_fee !== null) {
        // Ensure it's a number, not a string
        const feeValue = typeof formData.consultation_fee === 'string' 
          ? (formData.consultation_fee === '' ? null : parseFloat(formData.consultation_fee))
          : formData.consultation_fee;
        
        if (feeValue !== null && !isNaN(feeValue)) {
          profileData.consultation_fee = feeValue;
        }
      }
      
      // If no data to update, show message
      if (Object.keys(profileData).length === 0) {
        toast.error('No changes to save');
        setIsSaving(false);
        return;
      }
      
      // Debug log
      console.log('Sending profile data:', profileData);
      console.log('Form data consultation_fee:', formData.consultation_fee, typeof formData.consultation_fee);
      
      if (profile) {
        // Update existing profile
        await companyProfileService.update(profileData);
        toast.success('Company profile updated successfully!');
      } else {
        // Create new profile
        await companyProfileService.create(profileData);
        toast.success('Company profile created successfully! Awaiting admin approval.');
      }
      
      // Reload profile
      await loadProfile();
      
      // Clear form
      setCacCertificate(null);
      setMemart(null);
      setApplicationForRegistration(null);
      setRemoveCacCertificate(false);
      setRemoveMemart(false);
      setRemoveApplicationForRegistration(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      // Error already handled by API client interceptor
    } finally {
      setIsSaving(false);
    }
  };
  
  // Payment accounts state (for all users)
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [banks, setBanks] = useState<Array<{ code: string; name: string }>>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [accountFormData, setAccountFormData] = useState<CreatePaymentAccountData>({
    account_name: '',
    account_number: '',
    bank_code: '',
    bank_name: '',
    is_default: false,
  });

  useEffect(() => {
    loadPaymentAccounts();
    loadBanks();
  }, []);

  const loadPaymentAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const accounts = await paymentAccountService.list();
      setPaymentAccounts(accounts);
    } catch (error) {
      console.error('Failed to load payment accounts:', error);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const loadBanks = async () => {
    try {
      setIsLoadingBanks(true);
      const bankList = await paymentAccountService.getBanks();
      setBanks(bankList);
    } catch (error) {
      console.error('Failed to load banks:', error);
      toast.error('Failed to load banks list');
    } finally {
      setIsLoadingBanks(false);
    }
  };

  const handleVerifyAccount = async () => {
    if (!accountFormData.account_number || !accountFormData.bank_code) {
      toast.error('Please enter account number and select a bank');
      return;
    }

    try {
      setIsVerifyingAccount(true);
      const verified = await paymentAccountService.verifyAccount(
        accountFormData.account_number,
        accountFormData.bank_code
      );
      
      setAccountFormData(prev => ({
        ...prev,
        account_name: verified.account_name,
      }));
      
      toast.success('Account verified successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to verify account. Please check the account number and bank.');
    } finally {
      setIsVerifyingAccount(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await paymentAccountService.create(accountFormData);
      toast.success('Payment account added successfully');
      setShowAccountForm(false);
      setAccountFormData({
        account_name: '',
        account_number: '',
        bank_code: '',
        bank_name: '',
        is_default: false,
      });
      loadPaymentAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add payment account');
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment account?')) return;
    try {
      await paymentAccountService.delete(id);
      toast.success('Payment account deleted successfully');
      loadPaymentAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete payment account');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await paymentAccountService.setDefault(id);
      toast.success('Default account updated');
      loadPaymentAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to set default account');
    }
  };

  // Memoize bank options to prevent unnecessary re-renders
  // Use a Map to ensure unique bank codes (in case of duplicates)
  const bankOptions = useMemo(() => {
    const bankMap = new Map();
    banks.forEach(bank => {
      if (!bankMap.has(bank.code)) {
        bankMap.set(bank.code, {
          value: bank.code,
          label: bank.name,
        });
      }
    });
    return Array.from(bankMap.values());
  }, [banks]);

  // Payment Accounts JSX (inline to prevent re-creation on every render)
  const paymentAccountsJSX = (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg overflow-hidden">
      <div className="p-6 border-b border-[#E5E7EB]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1E3A8A]/10 to-[#2563EB]/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#1E3A8A]" />
            </div>
            <h2 className="text-lg font-semibold text-[#334155]">Payment Accounts</h2>
          </div>
          {!showAccountForm && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAccountForm(true)}
              className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Account
            </Button>
          )}
        </div>
      </div>
      <div className="p-6">
        {showAccountForm && (
          <form onSubmit={handleAddAccount} className="mb-6 p-6 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
            <h3 className="text-sm font-semibold text-[#334155] mb-4">Add Payment Account</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wide text-[#64748B] mb-2">
                  Bank <span className="text-red-500">*</span>
                </label>
                <Select
                  value={accountFormData.bank_code}
                  onChange={(e) => {
                    const value = e.target.value;
                    const selectedBank = banks.find(b => b.code === value);
                    setAccountFormData(prev => ({
                      ...prev,
                      bank_code: value,
                      bank_name: selectedBank?.name || '',
                    }));
                  }}
                  options={bankOptions}
                  placeholder={isLoadingBanks ? 'Loading banks...' : 'Select a bank'}
                  disabled={isLoadingBanks}
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-wide text-[#64748B] mb-2">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      id="payment-account-number"
                      type="text"
                      placeholder="0123456789"
                      value={accountFormData.account_number}
                      onChange={(e) => {
                        setAccountFormData(prev => ({ ...prev, account_number: e.target.value }));
                      }}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none transition-colors text-sm text-[#334155] placeholder:text-[#64748B]"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleVerifyAccount}
                    disabled={!accountFormData.account_number || !accountFormData.bank_code || isVerifyingAccount}
                    className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 self-end"
                  >
                    {isVerifyingAccount ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>
              </div>
              
              <Input
                label="Account Name"
                placeholder="Will be auto-filled after verification"
                value={accountFormData.account_name}
                onChange={(e) => {
                  setAccountFormData(prev => ({ ...prev, account_name: e.target.value }));
                }}
                required
                disabled={!!accountFormData.account_name}
              />
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={accountFormData.is_default}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setAccountFormData(prev => ({ ...prev, is_default: checked }));
                  }}
                  className="w-4 h-4 rounded border-[#E5E7EB]"
                />
                <label htmlFor="is_default" className="text-sm text-[#64748B]">
                  Set as default account
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                type="submit" 
                variant="primary" 
                size="sm" 
                disabled={!accountFormData.account_name}
                className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all"
              >
                Add Account
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowAccountForm(false);
                  setAccountFormData({
                    account_name: '',
                    account_number: '',
                    bank_code: '',
                    bank_name: '',
                    is_default: false,
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {isLoadingAccounts ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A] mx-auto mb-2"></div>
            <p className="text-sm text-[#64748B]">Loading accounts...</p>
          </div>
        ) : paymentAccounts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-[#64748B]" />
            </div>
            <p className="text-sm font-medium text-[#334155] mb-1">No payment accounts added yet</p>
            <p className="text-xs text-[#64748B] mb-4">Add a payment account to receive payments</p>
            {!showAccountForm && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setShowAccountForm(true)}
                className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Your First Account
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentAccounts.map((account) => (
              <div
                key={account.id}
                className={`relative p-5 rounded-xl border transition-all duration-200 hover:shadow-lg ${
                  account.is_default
                    ? 'border-[#1E3A8A] bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white shadow-lg'
                    : 'border-[#E5E7EB] bg-white hover:border-[#1E3A8A]/30'
                }`}
              >
                {/* Default Badge */}
                {account.is_default && (
                  <div className="absolute top-3 right-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Star className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  {/* Bank Icon and Name */}
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      account.is_default
                        ? 'bg-white/20 backdrop-blur-sm'
                        : 'bg-gradient-to-br from-[#1E3A8A]/10 to-[#2563EB]/10'
                    }`}>
                      <CreditCard className={`w-6 h-6 ${account.is_default ? 'text-white' : 'text-[#1E3A8A]'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-base mb-1 truncate ${
                        account.is_default ? 'text-white' : 'text-[#334155]'
                      }`}>
                        {account.account_name}
                      </p>
                      <p className={`text-xs ${
                        account.is_default ? 'text-white/80' : 'text-[#64748B]'
                      }`}>
                        {account.bank_name || `Bank: ${account.bank_code}`}
                      </p>
                    </div>
                  </div>
                  
                  {/* Account Number */}
                  <div className={`pt-3 border-t ${
                    account.is_default ? 'border-white/20' : 'border-[#E5E7EB]'
                  }`}>
                    <p className={`text-xs uppercase tracking-wide mb-1 ${
                      account.is_default ? 'text-white/70' : 'text-[#64748B]'
                    }`}>
                      Account Number
                    </p>
                    <p className={`font-mono text-sm font-semibold ${
                      account.is_default ? 'text-white' : 'text-[#334155]'
                    }`}>
                      {account.account_number}
                    </p>
                  </div>
                  
                  {/* Status Badge */}
                  {account.is_verified && (
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        account.is_default
                          ? 'bg-white/20 text-white border border-white/30'
                          : 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]'
                      }`}>
                        ✓ Verified
                      </span>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    {!account.is_default && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSetDefault(account.id)}
                        className="flex-1 bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all text-xs"
                      >
                        Set Default
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteAccount(account.id)}
                      className={`p-1.5 rounded transition-all ${
                        account.is_default
                          ? 'text-white/70 hover:text-white hover:bg-white/10'
                          : 'text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEE2E2]/50'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Client/Admin settings
  if (userRole !== 'company') {
    return (
      <div className="min-h-screen">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-[#334155] mb-2">Settings</h1>
            <p className="text-sm text-[#64748B]">Manage your account settings</p>
          </div>
          
          {paymentAccountsJSX}
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-[#334155] mb-2">Company Profile</h1>
          </div>
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
              <p className="text-sm text-[#64748B]">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
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
  
  return (
    <div className="min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#334155] mb-2">Company Profile</h1>
          <p className="text-sm text-[#64748B]">
            {profile 
              ? 'Update your company profile information'
              : 'Create your company profile to start receiving consultation requests'}
          </p>
        </div>
        
        {/* Profile Status Banner */}
        {profile && (
          <>
            {/* Rejection Warning Banner */}
            {profile.status === 'rejected' && (
              <div className="bg-gradient-to-r from-[#DC2626] to-[#EF4444] rounded-xl border border-[#B91C1C] shadow-lg p-6 text-white mb-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Company Profile Rejected</h3>
                    <p className="text-sm opacity-90 mb-4">
                      Your company profile has been rejected. You cannot receive consultations or projects until your profile is approved.
                      <strong className="block mt-2">Please review your information and reapply for approval.</strong>
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          // Update profile to set status back to pending
                          await companyProfileService.update({});
                          await companyProfileService.appealSuspension('I would like to reapply for company profile approval.');
                          toast.success('Reapplication submitted successfully. Our admin team will review your profile and contact you soon.');
                          loadProfile();
                        } catch (error: any) {
                          toast.error(error.response?.data?.message || 'Failed to submit reapplication');
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors px-4 py-2 text-sm bg-white text-[#DC2626] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DC2626]"
                    >
                      Reapply for Approval
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Suspension Warning Banner */}
            {profile.status === 'suspended' && (
              <div className="bg-gradient-to-r from-[#DC2626] to-[#EF4444] rounded-xl border border-[#B91C1C] shadow-lg p-6 text-white mb-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Account Suspended</h3>
                    {profile.suspension_reason && (
                      <div className="bg-white/10 rounded-lg p-3 mb-4">
                        <p className="text-xs font-medium mb-1 opacity-90">Suspension Reason:</p>
                        <p className="text-sm">{profile.suspension_reason}</p>
                      </div>
                    )}
                    <p className="text-sm opacity-90 mb-4">
                      Your company account has been suspended. You cannot receive new consultations or projects, create milestones, or submit work until the suspension is lifted.
                      <strong className="block mt-2">To appeal, please contact support. Do not submit multiple appeals.</strong>
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          await companyProfileService.appealSuspension();
                          toast.success('Appeal submitted successfully. Our support team will review your request and contact you soon.');
                          loadProfile();
                        } catch (error: any) {
                          toast.error(error.response?.data?.message || 'Failed to submit appeal');
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors px-4 py-2 text-sm bg-white text-[#DC2626] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DC2626]"
                    >
                      Contact Support / Appeal Suspension
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Regular Status Banner */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  profile.is_approved 
                    ? 'bg-gradient-to-br from-[#16A34A]/10 to-[#22C55E]/10' 
                    : profile.status === 'suspended'
                    ? 'bg-gradient-to-br from-[#DC2626]/10 to-[#EF4444]/10'
                    : 'bg-gradient-to-br from-[#F59E0B]/10 to-[#FBBF24]/10'
                }`}>
                  {profile.is_approved ? (
                    <CheckCircle className="w-6 h-6 text-[#16A34A]" />
                  ) : profile.status === 'suspended' ? (
                    <AlertCircle className="w-6 h-6 text-[#DC2626]" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-[#F59E0B]" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#334155] mb-1">
                    Status: <StatusBadge status={profile.status} color={getStatusColor(profile.status)} />
                  </p>
                  <p className="text-xs text-[#64748B]">
                    {profile.is_approved 
                      ? 'Your profile is verified and active'
                      : profile.status === 'suspended'
                      ? 'Your account has been suspended'
                      : profile.is_verified
                      ? 'Your profile is verified and awaiting approval'
                      : 'Your profile is pending admin review'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      
        {/* Profile Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg overflow-hidden">
            <div className="p-6 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1E3A8A]/10 to-[#2563EB]/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#1E3A8A]" />
                </div>
                <h2 className="text-lg font-semibold text-[#334155]">Company Information</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
            {/* Company Name and Registration Number - Two Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Enter company name"
                  required
                  disabled={profile?.is_approved}
                />
              </div>
              
              {/* Registration Number */}
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-2">
                  Company Registration Number <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  placeholder="Enter your official company registration number (e.g., RC123456)"
                  required
                  disabled={profile?.is_approved}
                />
                <p className="text-xs text-[#64748B] mt-1">
                  Your official company registration number issued by the corporate affairs commission
                </p>
              </div>
            </div>
            
            {/* Consultation Fee */}
            <div>
              <label className="block text-sm font-semibold text-[#334155] mb-2">
                Consultation Fee (NGN) <span className="text-xs font-normal text-[#64748B]">(Optional)</span>
              </label>
              <Input
                type="number"
                value={formData.consultation_fee === 0 ? 0 : (formData.consultation_fee || '')}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  // Convert to number, default to 0 if empty
                  const numValue = inputValue === '' ? 0 : (parseFloat(inputValue) || 0);
                  setFormData({ ...formData, consultation_fee: numValue });
                }}
                placeholder="e.g., 25000"
                min={0}
                step="100"
              />
              <p className="text-xs text-[#334155] mt-2 font-medium">
                Set your default consultation fee. Clients can override this when booking.
              </p>
            </div>
            
            {/* CAC Documents - CAC Certificate on its own, MEMART and Application side by side */}
            <div className="space-y-6">
              {/* CAC Certificate - Full Width */}
              <FilePreviewInput
                label="CAC Certificate"
                value={removeCacCertificate ? null : (cacCertificate || profile?.cac_certificate || null)}
                onChange={(file) => {
                  setCacCertificate(file);
                  if (file) {
                    setRemoveCacCertificate(false);
                  } else if (profile?.cac_certificate) {
                    setRemoveCacCertificate(true);
                  }
                }}
                disabled={profile?.status === 'suspended'}
              />
              
              {/* MEMART and Application For Registration - Two Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FilePreviewInput
                  label="MEMART"
                  value={removeMemart ? null : (memart || profile?.memart || null)}
                  onChange={(file) => {
                    setMemart(file);
                    if (file) {
                      setRemoveMemart(false);
                    } else if (profile?.memart) {
                      setRemoveMemart(true);
                    }
                  }}
                  disabled={profile?.status === 'suspended'}
                />
                
                <FilePreviewInput
                  label="Application For Registration of Company"
                  value={removeApplicationForRegistration ? null : (applicationForRegistration || profile?.application_for_registration || null)}
                  onChange={(file) => {
                    setApplicationForRegistration(file);
                    if (file) {
                      setRemoveApplicationForRegistration(false);
                    } else if (profile?.application_for_registration) {
                      setRemoveApplicationForRegistration(true);
                    }
                  }}
                  disabled={profile?.status === 'suspended'}
                />
              </div>
            </div>
            
            {/* Portfolio Links and Specialization - Two Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Portfolio Links */}
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-2">
                  Portfolio Links
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    type="url"
                    value={newPortfolioLink}
                    onChange={(e) => setNewPortfolioLink(e.target.value)}
                    placeholder="https://example.com/portfolio"
                    disabled={profile?.is_approved}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addPortfolioLink();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addPortfolioLink}
                    disabled={profile?.is_approved}
                    variant="outline"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {formData.portfolio_links.length > 0 && (
                  <div className="space-y-2">
                    {formData.portfolio_links.map((link, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-[#F8FAFC] rounded border border-[#E5E7EB]"
                      >
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#1E3A8A] hover:underline truncate pr-2"
                        >
                          {link}
                        </a>
                        <button
                          type="button"
                          onClick={() => removePortfolioLink(index)}
                          disabled={profile?.is_approved}
                          className="text-red-600 hover:text-red-700 flex-shrink-0"
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
                <label className="block text-sm font-medium text-[#334155] mb-2">
                  Specialization
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    type="text"
                    value={newSpecialization}
                    onChange={(e) => setNewSpecialization(e.target.value)}
                    placeholder="e.g., Residential, Commercial"
                    disabled={profile?.is_approved}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSpecialization();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addSpecialization}
                    disabled={profile?.is_approved}
                    variant="outline"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {formData.specialization.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.specialization.map((spec, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 px-3 py-1 bg-[#DBEAFE] text-[#1E40AF] rounded-full text-sm"
                      >
                        <span>{spec}</span>
                        <button
                          type="button"
                          onClick={() => removeSpecialization(index)}
                          disabled={profile?.is_approved}
                          className="text-[#1E40AF] hover:text-[#1E3A8A]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
              {/* Submit Button */}
              <div className="pt-4 border-t border-[#E5E7EB]">
                {profile?.is_approved ? (
                  <div className="bg-[#FEF3C7] border border-[#FCD34D] rounded-lg p-4">
                    <p className="text-sm text-[#92400E]">
                      Your profile has been approved. Contact admin to make changes.
                    </p>
                  </div>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all"
                  >
                    {isSaving ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
        
        {/* Payment Accounts Section */}
        {paymentAccountsJSX}
      </div>
    </div>
  );
}

