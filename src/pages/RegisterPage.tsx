import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, Shield, CheckCircle, Zap, ArrowRight } from 'lucide-react';
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
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden md:block space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] flex items-center justify-center shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#334155]">BuildTrust</h1>
                <p className="text-sm text-[#64748B]">Secure construction platform</p>
              </div>
            </div>
            <h2 className="text-4xl font-bold text-[#334155] leading-tight">
              Start Your Journey
            </h2>
            <p className="text-lg text-[#64748B] leading-relaxed">
              Create your account and begin building your dream home in Africa with complete trust and security. Join thousands of satisfied customers.
            </p>
          </div>
          
          {/* Features List */}
          <div className="space-y-4 pt-8">
            {[
              { icon: Shield, text: 'Secure Escrow System', color: 'text-[#1E3A8A]' },
              { icon: CheckCircle, text: 'Verified Companies', color: 'text-[#16A34A]' },
              { icon: Zap, text: 'Real-time Updates', color: 'text-[#F59E0B]' },
              { icon: Building2, text: 'Trusted Platform', color: 'text-[#8B5CF6]' },
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                  feature.color === 'text-[#1E3A8A]' ? 'from-[#1E3A8A]/10 to-transparent' :
                  feature.color === 'text-[#16A34A]' ? 'from-[#16A34A]/10 to-transparent' :
                  feature.color === 'text-[#F59E0B]' ? 'from-[#F59E0B]/10 to-transparent' :
                  'from-[#8B5CF6]/10 to-transparent'
                } flex items-center justify-center`}>
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <span className="text-sm font-medium text-[#334155]">{feature.text}</span>
              </div>
            ))}
          </div>
          
          {/* Stats */}
          <div className="pt-8 border-t border-[#E5E7EB]">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-[#1E3A8A]/10 to-transparent rounded-xl p-4">
                <div className="text-2xl font-bold text-[#1E3A8A] mb-1">1000+</div>
                <div className="text-xs text-[#64748B]">Happy Clients</div>
              </div>
              <div className="bg-gradient-to-br from-[#16A34A]/10 to-transparent rounded-xl p-4">
                <div className="text-2xl font-bold text-[#16A34A] mb-1">150+</div>
                <div className="text-xs text-[#64748B]">Verified Companies</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Side - Registration Form */}
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="md:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#334155]">BuildTrust</h1>
            </div>
          </div>
          
          {/* Registration Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#334155] mb-2">Create Account</h2>
              <p className="text-sm text-[#64748B]">Fill in your details to get started</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wide text-[#64748B] mb-2">
                  Account Type <span className="text-red-500">*</span>
                </label>
                <Select
                  options={[
                    { value: 'client', label: '👤 Client' },
                    { value: 'company', label: '🏗️ Construction Company' },
                  ]}
                  placeholder="Select account type"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Input
                  type="text"
                  label="Full Name"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Input
                  type="email"
                  label="Email Address"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Input
                  type="tel"
                  label="Phone Number (Optional)"
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              
              <div>
                <Input
                  type="password"
                  label="Password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  helperText="Minimum 8 characters"
                  required
                />
              </div>
              
              <div>
                <Input
                  type="password"
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  fullWidth 
                  size="lg" 
                  disabled={isLoading}
                  className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#3B82F6] text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                  {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
                </Button>
              </div>
            </form>
            
            <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
              <p className="text-center text-sm text-[#64748B] mb-4">
                Already have an account?{' '}
                <button
                  onClick={() => onNavigate('/login')}
                  className="text-[#1E3A8A] hover:text-[#1D4ED8] font-semibold transition-colors"
                >
                  Sign in
                </button>
              </p>
              
              <button
                onClick={() => onNavigate('/')}
                className="w-full flex items-center justify-center gap-2 text-sm text-[#64748B] hover:text-[#334155] transition-colors"
              >
                ← Back to home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
