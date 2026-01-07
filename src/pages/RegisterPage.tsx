import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { authService } from '../services/auth.service';

interface RegisterPageProps {
  onNavigate: (path: string) => void;
  onRegister: (role: 'client' | 'company', user: any) => void;
}

export function RegisterPage({ onNavigate, onRegister }: RegisterPageProps) {
  const [formData, setFormData] = useState({
    role: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!formData.role) {
      toast.error('Please select an account type');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.register({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
        role: formData.role as 'client' | 'company',
      });

      toast.success(`Account created successfully! Welcome, ${response.user.name}!`);
      
      // Call onRegister with user role and user data
      onRegister(response.user.role as 'client' | 'company', response.user);
    onNavigate('/dashboard');
    } catch (error: any) {
      // Error is already handled by API client interceptor
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[#334155] mb-2">BuildTrust</h1>
          <p className="text-sm text-[#64748B]">Create your account</p>
        </div>
        
        {/* Registration Form */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Select
              label="Account Type"
              options={[
                { value: 'client', label: 'Client (Diaspora)' },
                { value: 'company', label: 'Construction Company' },
              ]}
              placeholder="Select account type"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            />
            
            <Input
              type="text"
              label="Full Name"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
            
            <Input
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            
            <Input
              type="tel"
              label="Phone Number (Optional)"
              placeholder="+1234567890"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            
            <Input
              type="password"
              label="Password"
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              helperText="Minimum 8 characters"
              required
            />
            
            <Input
              type="password"
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
            
            <div className="pt-2">
              <Button type="submit" fullWidth size="lg" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <span className="text-sm text-[#64748B]">Already have an account? </span>
            <button
              onClick={() => onNavigate('/login')}
              className="text-sm text-[#1E3A8A] hover:text-[#1D4ED8] font-medium"
            >
              Sign in
            </button>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => onNavigate('/')}
            className="text-sm text-[#64748B] hover:text-[#334155]"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
