import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, 
  Calendar, 
  FolderKanban, 
  MessageSquare, 
  Settings, 
  Building2, 
  Shield, 
  AlertCircle,
  Menu,
  X,
  LogOut,
  Receipt,
  Home,
  ChevronDown,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  adminOnly?: boolean;
}

interface AuthLayoutProps {
  children: React.ReactNode;
  userRole?: 'client' | 'company' | 'admin';
  userName?: string;
}

export function AuthLayout({ 
  children, 
  userRole = 'client',
  userName = 'User',
}: AuthLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(73);
  const [isMobile, setIsMobile] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };
    
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);
  
  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };
  
  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/dashboard' },
    { label: 'Consultations', icon: <Calendar className="w-5 h-5" />, path: '/consultations' },
    { label: 'Projects', icon: <FolderKanban className="w-5 h-5" />, path: '/projects' },
    { label: 'Transactions', icon: <Receipt className="w-5 h-5" />, path: '/transactions' },
    { label: 'Messages', icon: <MessageSquare className="w-5 h-5" />, path: '/messages' },
    { label: 'Settings', icon: <Settings className="w-5 h-5" />, path: '/settings' },
  ];
  
  if (userRole === 'admin') {
    navItems.push(
      { label: 'Companies', icon: <Building2 className="w-5 h-5" />, path: '/admin/companies', adminOnly: true },
      { label: 'Escrow', icon: <Shield className="w-5 h-5" />, path: '/admin/escrow', adminOnly: true },
      { label: 'Disputes', icon: <AlertCircle className="w-5 h-5" />, path: '/admin/disputes', adminOnly: true },
      { label: 'Platform Settings', icon: <Settings className="w-5 h-5" />, path: '/admin/platform-settings', adminOnly: true }
    );
  }
  
  return (
    <div className="h-screen bg-gradient-to-br from-[#F0F4F8] via-[#F8FAFC] to-[#F0F7FF] overflow-hidden">
      {/* Top Navigation Bar - Fixed */}
      <header 
        ref={headerRef} 
        className="fixed top-0 left-0 right-0 w-full bg-white/95 backdrop-blur-sm border-b border-[#E0E7FF] z-40 shadow-sm"
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (isMobile) {
                  setIsMobileSidebarOpen(!isMobileSidebarOpen);
                } else {
                  setIsSidebarOpen(!isSidebarOpen);
                }
              }}
              className="text-[#64748B] hover:text-[#1E3A8A] hover:bg-[#EFF6FF] transition-all p-2 rounded-lg"
            >
              {(isMobile ? isMobileSidebarOpen : isSidebarOpen) ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] flex items-center justify-center shadow-md">
                <Home className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] bg-clip-text text-transparent">
                BuildTrust
              </h1>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#F0F7FF] transition-colors cursor-pointer group">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] flex items-center justify-center text-white text-sm font-bold shadow-md">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-[#1E3A8A]">{userName}</p>
                <p className="text-xs text-[#64748B] capitalize">{userRole}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-[#64748B] group-hover:text-[#1E3A8A] transition-colors" />
            </div>
            <button
              onClick={handleLogout}
              className="text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-all p-2 rounded-lg"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Mobile Overlay */}
      {isMobile && isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          style={{ top: `${headerHeight}px` }}
        />
      )}

      {/* Sidebar - Fixed Position */}
      <aside
        style={{
          top: `${headerHeight}px`,
          height: `calc(100vh - ${headerHeight}px)`,
        }}
        className={`fixed left-0 bg-white border-r border-[#E0E7FF] transition-all duration-300 overflow-hidden shadow-sm z-50 ${
          isMobile
            ? isMobileSidebarOpen
              ? 'w-64 translate-x-0'
              : '-translate-x-full w-64'
            : isSidebarOpen
            ? 'w-64 translate-x-0'
            : 'w-16 translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Navigation */}
          <nav className={`flex-1 overflow-y-auto ${
            (isMobile ? isMobileSidebarOpen : isSidebarOpen) ? 'p-4' : 'p-2'
          } space-y-1 pt-4`}>
            {navItems.map((item) => {
              const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
              const sidebarExpanded = isMobile ? isMobileSidebarOpen : isSidebarOpen;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) {
                      setIsMobileSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center rounded-xl transition-all duration-200 ${
                    sidebarExpanded 
                      ? 'gap-3 px-4 py-3' 
                      : 'justify-center px-2 py-3'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] text-white shadow-lg font-semibold'
                      : 'text-[#64748B] hover:bg-gradient-to-r hover:from-[#EFF6FF] hover:to-[#DBEAFE] hover:text-[#1E3A8A] font-medium'
                  }`}
                  title={!sidebarExpanded ? item.label : undefined}
                >
                  <span className={isActive ? 'text-white' : ''}>{item.icon}</span>
                  {sidebarExpanded && (
                    <span className={`text-sm ${isActive ? 'text-white' : 'text-[#64748B]'}`}>
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          
          {/* Logout Button at Bottom */}
          <div className={`border-t border-[#E0E7FF] ${
            (isMobile ? isMobileSidebarOpen : isSidebarOpen) ? 'p-4' : 'p-2'
          }`}>
            <button
              onClick={() => {
                handleLogout();
                if (isMobile) {
                  setIsMobileSidebarOpen(false);
                }
              }}
              className={`w-full flex items-center rounded-xl transition-all duration-200 text-[#DC2626] hover:bg-[#FEF2F2] hover:text-[#B91C1C] font-medium ${
                (isMobile ? isMobileSidebarOpen : isSidebarOpen)
                  ? 'gap-3 px-4 py-3' 
                  : 'justify-center px-2 py-3'
              }`}
              title={!(isMobile ? isMobileSidebarOpen : isSidebarOpen) ? 'Logout' : undefined}
            >
              <LogOut className="w-5 h-5" />
              {(isMobile ? isMobileSidebarOpen : isSidebarOpen) && (
                <span className="text-sm">Log Out</span>
              )}
            </button>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main 
        style={{
          marginTop: `${headerHeight}px`,
          marginLeft: isMobile ? '0' : isSidebarOpen ? '16rem' : '4rem',
          height: `calc(100vh - ${headerHeight}px)`,
        }}
        className="overflow-y-auto transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
