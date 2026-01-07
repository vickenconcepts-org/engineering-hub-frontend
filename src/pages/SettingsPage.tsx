import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Building2, Upload, X, Plus, AlertCircle, CheckCircle, CreditCard, Trash2, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { StatusBadge } from '../components/StatusBadge';
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
  
  const [licenseFiles, setLicenseFiles] = useState<File[]>([]);
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
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Validate file types and sizes
      const validFiles = files.filter(file => {
        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        const isValidType = validTypes.includes(file.type);
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
        
        if (!isValidType) {
          toast.error(`${file.name} is not a valid file type. Please upload PDF, JPG, or PNG files.`);
          return false;
        }
        if (!isValidSize) {
          toast.error(`${file.name} exceeds 5MB limit.`);
          return false;
        }
        return true;
      });
      
      setLicenseFiles(prev => [...prev, ...validFiles]);
    }
  };
  
  const removeFile = (index: number) => {
    setLicenseFiles(prev => prev.filter((_, i) => i !== index));
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
        if (licenseFiles.length > 0) {
          profileData.license_documents = licenseFiles;
        }
      } else {
        console.log('Company is approved - only sending consultation_fee');
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
      setLicenseFiles([]);
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Accounts
          </CardTitle>
          {!showAccountForm && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAccountForm(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Account
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showAccountForm && (
          <form onSubmit={handleAddAccount} className="mb-6 p-4 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
            <h3 className="text-sm font-medium text-[#334155] mb-4">Add Payment Account</h3>
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
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="payment-account-number"
                    label="Account Number"
                    placeholder="0123456789"
                    value={accountFormData.account_number}
                    onChange={(e) => {
                      setAccountFormData(prev => ({ ...prev, account_number: e.target.value }));
                    }}
                    required
                  />
                </div>
                <div className="flex items-end pb-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleVerifyAccount}
                    disabled={!accountFormData.account_number || !accountFormData.bank_code || isVerifyingAccount}
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
              <Button type="submit" variant="primary" size="sm" disabled={!accountFormData.account_name}>
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
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-[#64748B] mx-auto mb-2" />
            <p className="text-sm text-[#64748B] mb-4">No payment accounts added yet</p>
            {!showAccountForm && (
              <Button variant="secondary" size="sm" onClick={() => setShowAccountForm(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Your First Account
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {paymentAccounts.map((account) => (
              <div
                key={account.id}
                className={`p-4 rounded-lg border ${
                  account.is_default
                    ? 'border-[#1E3A8A] bg-[#DBEAFE]'
                    : 'border-[#E5E7EB] bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-[#334155]">{account.account_name}</p>
                      {account.is_default && (
                        <span className="px-2 py-0.5 bg-[#1E3A8A] text-white text-xs rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Default
                        </span>
                      )}
                      {account.is_verified && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#64748B]">
                      {account.account_number} • {account.bank_name || `Bank Code: ${account.bank_code}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!account.is_default && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSetDefault(account.id)}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDeleteAccount(account.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Client/Admin settings
  if (userRole !== 'company') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155] mb-2">Settings</h1>
          <p className="text-sm text-[#64748B]">Manage your account settings</p>
        </div>
        
        {paymentAccountsJSX}
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155] mb-2">Company Profile</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
          <p className="text-sm text-[#64748B]">Loading profile...</p>
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
      default:
        return 'gray';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#334155] mb-2">Company Profile</h1>
        <p className="text-sm text-[#64748B]">
          {profile 
            ? 'Update your company profile information'
            : 'Create your company profile to start receiving consultation requests'}
        </p>
      </div>
      
      {/* Profile Status Banner */}
      {profile && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {profile.is_approved ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-[#334155]">
                    Status: <StatusBadge status={profile.status} color={getStatusColor(profile.status)} />
                  </p>
                  <p className="text-xs text-[#64748B] mt-1">
                    {profile.is_approved 
                      ? 'Your profile is verified and active'
                      : profile.is_verified
                      ? 'Your profile is verified and awaiting approval'
                      : 'Your profile is pending admin review'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Profile Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                Registration Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.registration_number}
                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                placeholder="Enter registration number (e.g., RC123456)"
                required
                disabled={profile?.is_approved}
              />
              <p className="text-xs text-[#64748B] mt-1">
                Your official company registration number
              </p>
            </div>
            
            {/* Consultation Fee */}
            <div>
              <Input
                label="Consultation Fee (NGN)"
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
                helperText="Set your default consultation fee. Clients can override this when booking."
              />
            </div>
            
            {/* License Documents */}
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-2">
                License Documents
              </label>
              <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
                <p className="text-sm text-[#64748B] mb-2">
                  Upload license documents (PDF, JPG, PNG - Max 5MB each)
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  disabled={profile?.is_approved}
                  className="hidden"
                  id="license-upload"
                />
                <label htmlFor="license-upload">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={profile?.is_approved}
                    className="cursor-pointer"
                  >
                    Choose Files
                  </Button>
                </label>
              </div>
              
              {/* Selected Files */}
              {licenseFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {licenseFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-[#F8FAFC] rounded border border-[#E5E7EB]"
                    >
                      <span className="text-sm text-[#334155]">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        disabled={profile?.is_approved}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Existing License Documents */}
              {profile?.license_documents && profile.license_documents.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-[#334155] mb-2">Current Documents:</p>
                  <div className="space-y-2">
                    {profile.license_documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-[#F8FAFC] rounded border border-[#E5E7EB]"
                      >
                        <span className="text-sm text-[#334155]">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
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
                        className="text-sm text-[#1E3A8A] hover:underline"
                      >
                        {link}
                      </a>
                      <button
                        type="button"
                        onClick={() => removePortfolioLink(index)}
                        disabled={profile?.is_approved}
                        className="text-red-600 hover:text-red-700"
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
            
            {/* Submit Button */}
            <div className="pt-4 border-t border-[#E5E7EB]">
              {profile?.is_approved ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Your profile has been approved. Contact admin to make changes.
                  </p>
                </div>
              ) : (
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-[#1E3A8A] text-white"
                >
                  {isSaving ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
      
      {/* Payment Accounts Section */}
      {paymentAccountsJSX}
    </div>
  );
}

