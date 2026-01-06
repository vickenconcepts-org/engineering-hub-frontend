import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Building2, Upload, X, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { StatusBadge } from '../components/StatusBadge';
import { companyProfileService, CompanyProfile, CreateCompanyProfileData } from '../services/company-profile.service';

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
    
    if (!formData.company_name || !formData.registration_number) {
      toast.error('Company name and registration number are required');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const profileData: CreateCompanyProfileData = {
        company_name: formData.company_name,
        registration_number: formData.registration_number,
        portfolio_links: formData.portfolio_links.length > 0 ? formData.portfolio_links : undefined,
        specialization: formData.specialization.length > 0 ? formData.specialization : undefined,
        license_documents: licenseFiles.length > 0 ? licenseFiles : undefined,
      };
      
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
  
  // Client/Admin settings (simple for now)
  if (userRole !== 'company') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155] mb-2">Settings</h1>
          <p className="text-sm text-[#64748B]">Manage your account settings</p>
        </div>
        
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-sm text-[#64748B]">Account settings coming soon</p>
            </div>
          </CardContent>
        </Card>
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
    </div>
  );
}

