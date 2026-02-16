import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
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
import { CreateMilestonesPage } from './pages/CreateMilestonesPage';
import { PaymentCallbackPage } from './pages/PaymentCallbackPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminUsersListPage } from './pages/AdminUsersListPage';
import { AdminCompaniesListPage } from './pages/AdminCompaniesListPage';
import { AdminCompanyReviewPage } from './pages/AdminCompanyReviewPage';
import { AdminDisputesListPage } from './pages/AdminDisputesListPage';
import { AdminDisputePage } from './pages/AdminDisputePage';
import { AdminEscrowPage } from './pages/AdminEscrowPage';
import { AdminPlatformSettingsPage } from './pages/AdminPlatformSettingsPage';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { NotificationsPage } from './pages/NotificationsPage';

type UserRole = 'client' | 'company' | 'admin' | null;

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      if (checkAuthCookie()) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          setUserRole(currentUser.role as UserRole);
    setIsAuthenticated(true);
        } catch (error) {
          setUser(null);
    setUserRole(null);
    setIsAuthenticated(false);
          navigate('/login');
        }
      } else {
        setIsAuthenticated(false);
        navigate('/login');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AuthLayout
      userRole={userRole || 'client'}
      userName={user?.name || 'User'}
    >
      {React.isValidElement(children) 
        ? React.cloneElement(children, { userRole, user })
        : children
      }
    </AuthLayout>
  );
    }
    
// Wrapper components for pages that need params
function ConsultationDetailWrapper({ userRole }: { userRole?: UserRole }) {
  const { id } = useParams<{ id: string }>();
  return <ConsultationDetailPage consultationId={id || ''} userRole={userRole} />;
  }
  
function ProjectDetailWrapper({ userRole }: { userRole?: UserRole }) {
  return <ProjectDetailPage userRole={userRole} />;
}

function CreateMilestonesWrapper({ userRole }: { userRole?: UserRole }) {
  const { id } = useParams<{ id: string }>();
  return <CreateMilestonesPage userRole={userRole} />;
    }
    
function MilestoneDetailWrapper({ userRole }: { userRole?: UserRole }) {
  const navigate = useNavigate();
  return <MilestoneDetailPage onNavigate={navigate} userRole={userRole} />;
    }
    
function AdminCompanyReviewWrapper() {
  const navigate = useNavigate();
  return <AdminCompanyReviewPage onNavigate={navigate} />;
    }
    
function AdminDisputesListWrapper() {
  const navigate = useNavigate();
  return <AdminDisputesListPage onNavigate={navigate} />;
    }
    
function AdminDisputeWrapper() {
  const navigate = useNavigate();
  return <AdminDisputePage onNavigate={navigate} />;
    }
    
function TransactionsWrapper({ userRole }: { userRole?: UserRole }) {
  const navigate = useNavigate();
  return <TransactionsPage onNavigate={navigate} userRole={userRole} />;
    }
    
function AdminPlatformSettingsWrapper() {
  return <AdminPlatformSettingsPage />;
    }

function AdminAuditLogsWrapper() {
  const navigate = useNavigate();
  return <AdminAuditLogsPage onNavigate={navigate} />;
    }
    
// Public route wrapper
function PublicRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      if (checkAuthCookie()) {
        try {
          await authService.getCurrentUser();
          setIsAuthenticated(true);
          navigate('/dashboard');
        } catch (error) {
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

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
    
  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
    }
    
function LoginWrapper() {
  const navigate = useNavigate();
  const handleLogin = () => navigate('/dashboard');
  return <LoginPage onNavigate={navigate} onLogin={handleLogin} />;
    }
    
function RegisterWrapper() {
  const navigate = useNavigate();
  const handleRegister = () => navigate('/dashboard');
  return <RegisterPage onNavigate={navigate} onRegister={handleRegister} />;
    }
    
function LandingPageWrapper() {
  const navigate = useNavigate();
  return <LandingPage onNavigate={navigate} />;
    }
    
// Context (not used in simplified version, but keeping for future)
const UserContext = React.createContext<{ user: User | null; userRole: UserRole }>({
  user: null,
  userRole: null,
});

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicRoute><LandingPageWrapper /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginWrapper /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterWrapper /></PublicRoute>} />
        <Route path="/payment/callback" element={<PaymentCallbackPage />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/consultations" element={<ProtectedRoute><ConsultationsPage /></ProtectedRoute>} />
        <Route path="/consultations/:id" element={<ProtectedRoute><ConsultationDetailWrapper /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailWrapper /></ProtectedRoute>} />
        <Route path="/projects/:id/create-milestones" element={<ProtectedRoute><CreateMilestonesWrapper /></ProtectedRoute>} />
        <Route path="/milestones/:id" element={<ProtectedRoute><MilestoneDetailWrapper /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><TransactionsWrapper /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/messages" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-[#F0F4F8] via-[#F8FAFC] to-[#E0E7FF] relative overflow-hidden">
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-[#1E3A8A]/10 to-[#2563EB]/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-[#3B82F6]/10 to-[#8B5CF6]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-[#2563EB]/5 to-[#1E3A8A]/5 rounded-full blur-3xl"></div>
              </div>
              
              {/* Content */}
              <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-20">
                <div className="max-w-4xl w-full">
                  <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] shadow-2xl mb-8 animate-scale-in">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] bg-clip-text text-transparent mb-6">
                      Messages Coming Soon
                    </h1>
                    <p className="text-sm text-[#64748B] max-w-2xl mx-auto leading-relaxed mb-8">
                      We're crafting an exceptional messaging experience that will allow you to communicate seamlessly with clients and companies directly on the platform.
                    </p>
                  </div>
                  
                  {/* Features Grid */}
                  <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1E3A8A]/10 to-[#2563EB]/10 flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-[#334155] mb-2">Real-time Chat</h3>
                      <p className="text-sm text-[#64748B]">Instant messaging with real-time notifications</p>
                    </div>
                    
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#16A34A]/10 to-[#22C55E]/10 flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-[#16A34A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-[#334155] mb-2">Secure & Private</h3>
                      <p className="text-sm text-[#64748B]">End-to-end encryption for all conversations</p>
                    </div>
                    
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F59E0B]/10 to-[#FBBF24]/10 flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-[#334155] mb-2">File Sharing</h3>
                      <p className="text-sm text-[#64748B]">Share documents and images effortlessly</p>
                    </div>
                  </div>
                  
                  {/* CTA Button */}
                  <div className="text-center">
                    <button
                      onClick={() => window.history.back()}
                      className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:ring-offset-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Go Back
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><AdminUsersListPage /></ProtectedRoute>} />
        <Route path="/admin/companies" element={<ProtectedRoute><AdminCompaniesListPage /></ProtectedRoute>} />
        <Route path="/admin/companies/:id" element={<ProtectedRoute><AdminCompanyReviewWrapper /></ProtectedRoute>} />
        <Route path="/admin/escrow" element={<ProtectedRoute><AdminEscrowPage /></ProtectedRoute>} />
        <Route path="/admin/disputes" element={<ProtectedRoute><AdminDisputesListWrapper /></ProtectedRoute>} />
        <Route path="/admin/disputes/:id" element={<ProtectedRoute><AdminDisputeWrapper /></ProtectedRoute>} />
        <Route path="/admin/platform-settings" element={<ProtectedRoute><AdminPlatformSettingsWrapper /></ProtectedRoute>} />
        <Route path="/admin/audit-logs" element={<ProtectedRoute><AdminAuditLogsWrapper /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
