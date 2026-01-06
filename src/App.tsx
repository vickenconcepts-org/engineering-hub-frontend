import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { AuthLayout } from './components/AuthLayout';
import { authService, User } from './services/auth.service';
import { isAuthenticated as checkAuthCookie } from './lib/cookies';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ConsultationsPage } from './pages/ConsultationsPage';
import { ConsultationDetailPage } from './pages/ConsultationDetailPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { MilestoneDetailPage } from './pages/MilestoneDetailPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminCompanyReviewPage } from './pages/AdminCompanyReviewPage';
import { AdminDisputePage } from './pages/AdminDisputePage';

type UserRole = 'client' | 'company' | 'admin' | null;

export default function App() {
  const [currentPath, setCurrentPath] = useState('/');
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (checkAuthCookie()) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          setUserRole(currentUser.role as UserRole);
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, clear state
          setUser(null);
          setUserRole(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);
  
  const navigate = (path: string) => {
    setCurrentPath(path);
  };
  
  const handleLogin = (role: UserRole, userData: User) => {
    setUser(userData);
    setUserRole(role);
    setIsAuthenticated(true);
  };
  
  const handleRegister = (role: 'client' | 'company', userData: User) => {
    setUser(userData);
    setUserRole(role);
    setIsAuthenticated(true);
  };
  
  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setUserRole(null);
      setIsAuthenticated(false);
      setCurrentPath('/');
    }
  };
  
  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
          <p className="text-sm text-[#64748B]">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Render unauthenticated pages
  if (!isAuthenticated) {
    if (currentPath === '/login') {
      return <LoginPage onNavigate={navigate} onLogin={handleLogin} />;
    }
    
    if (currentPath === '/register') {
      return <RegisterPage onNavigate={navigate} onRegister={handleRegister} />;
    }
    
    return <LandingPage onNavigate={navigate} />;
  }
  
  // Render authenticated pages
  const renderPage = () => {
    // Client/Company Pages
    if (currentPath === '/dashboard') {
      return <DashboardPage onNavigate={navigate} />;
    }
    
    if (currentPath === '/consultations') {
      return <ConsultationsPage onNavigate={navigate} />;
    }
    
    if (currentPath.startsWith('/consultations/')) {
      return <ConsultationDetailPage onNavigate={navigate} />;
    }
    
    if (currentPath === '/projects') {
      return <ProjectsPage onNavigate={navigate} />;
    }
    
    if (currentPath.startsWith('/projects/')) {
      return <ProjectDetailPage onNavigate={navigate} />;
    }
    
    if (currentPath.startsWith('/milestones/')) {
      return <MilestoneDetailPage onNavigate={navigate} />;
    }
    
    if (currentPath === '/messages') {
      return (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-[#334155] mb-2">Messages</h2>
          <p className="text-sm text-[#64748B]">Coming soon</p>
        </div>
      );
    }
    
    if (currentPath === '/settings') {
      return (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-[#334155] mb-2">Settings</h2>
          <p className="text-sm text-[#64748B]">Coming soon</p>
        </div>
      );
    }
    
    // Admin Pages
    if (currentPath === '/admin' || currentPath === '/admin/dashboard') {
      return <AdminDashboardPage onNavigate={navigate} />;
    }
    
    if (currentPath === '/admin/companies') {
      return (
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold text-[#334155]">Company Verifications</h1>
          <p className="text-sm text-[#64748B]">
            Click on a company from the dashboard to review details.
          </p>
        </div>
      );
    }
    
    if (currentPath.startsWith('/admin/companies/')) {
      return <AdminCompanyReviewPage onNavigate={navigate} />;
    }
    
    if (currentPath === '/admin/escrow') {
      return (
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold text-[#334155]">Escrow Overview</h1>
          <p className="text-sm text-[#64748B]">Escrow management coming soon</p>
        </div>
      );
    }
    
    if (currentPath === '/admin/disputes') {
      return (
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold text-[#334155]">Disputes</h1>
          <p className="text-sm text-[#64748B]">
            Click on a dispute from the dashboard to review details.
          </p>
        </div>
      );
    }
    
    if (currentPath.startsWith('/admin/disputes/')) {
      return <AdminDisputePage onNavigate={navigate} />;
    }
    
    // Default to dashboard
    return <DashboardPage onNavigate={navigate} />;
  };
  
  return (
    <AuthLayout
      userRole={userRole || 'client'}
      userName={user?.name || 'User'}
      currentPath={currentPath}
      onNavigate={navigate}
      onLogout={handleLogout}
    >
      {renderPage()}
    </AuthLayout>
  );
}
