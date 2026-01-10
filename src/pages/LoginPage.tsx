import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, ArrowRight, Shield, CheckCircle, Zap } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { authService } from '../services/auth.service';

interface LoginPageProps {
  onNavigate: (path: string) => void;
  onLogin: (role: 'client' | 'company' | 'admin', user: any) => void;
}

export function LoginPage({ onNavigate, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });
      toast.success(response.user.name ? `Welcome back, ${response.user.name}!` : 'Login successful');
      
      // Call onLogin with user role and user data
      onLogin(response.user.role as 'client' | 'company' | 'admin', response.user);
      onNavigate('/dashboard');
    } catch (error: any) {
      // Error is already handled by API client interceptor
      console.error('Login error:', error);
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
              Welcome Back!
            </h2>
            <p className="text-lg text-[#64748B] leading-relaxed">
              Sign in to continue building your dream home in Africa with complete trust and security.
            </p>
          </div>
          
          {/* Features List */}
          <div className="space-y-4 pt-8">
            {[
              { icon: Shield, text: '100% Secure Escrow System', color: 'text-[#1E3A8A]' },
              { icon: CheckCircle, text: 'Verified Construction Companies', color: 'text-[#16A34A]' },
              { icon: Zap, text: 'Real-time Project Updates', color: 'text-[#F59E0B]' },
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-${feature.color === 'text-[#1E3A8A]' ? '[#1E3A8A]/10' : feature.color === 'text-[#16A34A]' ? '[#16A34A]/10' : '[#F59E0B]/10'} to-transparent flex items-center justify-center`}>
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <span className="text-sm font-medium text-[#334155]">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Right Side - Login Form */}
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
          
          {/* Login Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#334155] mb-2">Sign In</h2>
              <p className="text-sm text-[#64748B]">Enter your credentials to access your account</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  type="email"
                  label="Email Address"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Input
                  type="password"
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-[#E5E7EB] text-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A] focus:ring-offset-2"
                  />
                  <span className="text-sm text-[#64748B]">Remember me</span>
                </label>
                
                <button
                  type="button"
                  className="text-sm font-medium text-[#1E3A8A] hover:text-[#1D4ED8] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              
              <Button 
                type="submit" 
                fullWidth 
                size="lg" 
                disabled={isLoading}
                className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#3B82F6] text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
                {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
              </Button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
              <p className="text-center text-sm text-[#64748B] mb-4">
                Don't have an account?{' '}
                <button
                  onClick={() => onNavigate('/register')}
                  className="text-[#1E3A8A] hover:text-[#1D4ED8] font-semibold transition-colors"
                >
                  Sign up
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
