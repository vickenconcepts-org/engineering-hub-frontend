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
import { AdminCompaniesListPage } from './pages/AdminCompaniesListPage';
import { AdminCompanyReviewPage } from './pages/AdminCompanyReviewPage';
import { AdminDisputesListPage } from './pages/AdminDisputesListPage';
import { AdminDisputePage } from './pages/AdminDisputePage';
import { SettingsPage } from './pages/SettingsPage';

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
  return <ConsultationDetailPage consultationId={parseInt(id || '0')} userRole={userRole} />;
}

function ProjectDetailWrapper({ userRole }: { userRole?: UserRole }) {
  return <ProjectDetailPage userRole={userRole} />;
}

function CreateMilestonesWrapper({ userRole }: { userRole?: UserRole }) {
  const { id } = useParams<{ id: string }>();
  return <CreateMilestonesPage projectId={parseInt(id || '0')} userRole={userRole} />;
}

function MilestoneDetailWrapper({ userRole }: { userRole?: UserRole }) {
  const { id } = useParams<{ id: string }>();
  return <MilestoneDetailPage milestoneId={parseInt(id || '0')} userRole={userRole} />;
}

function AdminCompanyReviewWrapper() {
  const { id } = useParams<{ id: string }>();
  return <AdminCompanyReviewPage companyId={parseInt(id || '0')} />;
}

function AdminDisputeWrapper() {
  const { id } = useParams<{ id: string }>();
  return <AdminDisputePage disputeId={parseInt(id || '0')} />;
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
  return <LoginPage onLogin={handleLogin} />;
}

function RegisterWrapper() {
  const navigate = useNavigate();
  const handleRegister = () => navigate('/dashboard');
  return <RegisterPage onRegister={handleRegister} />;
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
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
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
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/messages" element={
          <ProtectedRoute>
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-[#334155] mb-2">Messages</h2>
              <p className="text-sm text-[#64748B]">Coming soon</p>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/companies" element={<ProtectedRoute><AdminCompaniesListPage /></ProtectedRoute>} />
        <Route path="/admin/companies/:id" element={<ProtectedRoute><AdminCompanyReviewWrapper /></ProtectedRoute>} />
        <Route path="/admin/escrow" element={
          <ProtectedRoute>
            <div className="space-y-6">
              <h1 className="text-2xl font-semibold text-[#334155]">Escrow Overview</h1>
              <p className="text-sm text-[#64748B]">Escrow management coming soon</p>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/admin/disputes" element={<ProtectedRoute><AdminDisputesListPage /></ProtectedRoute>} />
        <Route path="/admin/disputes/:id" element={<ProtectedRoute><AdminDisputeWrapper /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
