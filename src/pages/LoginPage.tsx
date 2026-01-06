import React, { useState } from 'react';
import toast from 'react-hot-toast';
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
      // But we can add additional handling here if needed
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[#334155] mb-2">BuildTrust</h1>
          <p className="text-sm text-[#64748B]">Sign in to your account</p>
        </div>
        
        {/* Login Form */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <Input
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-[#E5E7EB] text-[#1E3A8A] focus:ring-[#1E3A8A]"
                />
                <span className="text-sm text-[#64748B]">Remember me</span>
              </label>
              
              <button
                type="button"
                className="text-sm text-[#1E3A8A] hover:text-[#1D4ED8]"
              >
                Forgot password?
              </button>
            </div>
            
            <Button type="submit" fullWidth size="lg" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <span className="text-sm text-[#64748B]">Don't have an account? </span>
            <button
              onClick={() => onNavigate('/register')}
              className="text-sm text-[#1E3A8A] hover:text-[#1D4ED8] font-medium"
            >
              Sign up
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
