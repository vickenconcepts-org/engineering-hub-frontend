import React, { useState } from 'react';
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
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
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
      { label: 'Disputes', icon: <AlertCircle className="w-5 h-5" />, path: '/admin/disputes', adminOnly: true }
    );
  }
  
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-[#64748B] hover:text-[#334155] transition-colors"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="text-xl font-semibold text-[#334155]">BuildTrust</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-[#334155]">{userName}</p>
              <p className="text-xs text-[#64748B] capitalize">{userRole}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-[#64748B] hover:text-[#334155] transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`bg-white border-r border-[#E5E7EB] transition-all duration-300 ${
            isSidebarOpen ? 'w-64' : 'w-0'
          } overflow-hidden`}
        >
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPath === item.path || currentPath.startsWith(item.path + '/')
                    ? 'bg-[#1E3A8A] text-white'
                    : 'text-[#64748B] hover:bg-[#F8FAFC]'
                }`}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
