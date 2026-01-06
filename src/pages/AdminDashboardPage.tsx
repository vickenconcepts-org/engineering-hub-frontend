import React, { useState, useEffect } from 'react';
import { Building2, AlertCircle, DollarSign, Users, Clock, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { adminService, AdminCompany, Dispute } from '../services/admin.service';

interface AdminDashboardPageProps {
  onNavigate: (path: string) => void;
}

export function AdminDashboardPage({ onNavigate }: AdminDashboardPageProps) {
  const [pendingCompanies, setPendingCompanies] = useState<AdminCompany[]>([]);
  const [openDisputes, setOpenDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingVerifications: 0,
    openDisputes: 0,
    escrowAwaitingRelease: 0,
    activeProjects: 0,
  });
  
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load pending companies
      const companiesData = await adminService.listCompanies({
        status: 'pending',
        per_page: 5,
      });
      setPendingCompanies(companiesData.companies);
      
      // Load open disputes
      const disputesData = await adminService.listDisputes({
        status: 'open',
        per_page: 5,
      });
      setOpenDisputes(disputesData.disputes);
      
      // Calculate stats
      const allCompanies = await adminService.listCompanies({ per_page: 100 });
      const allDisputes = await adminService.listDisputes({ per_page: 100 });
      
      setStats({
        pendingVerifications: allCompanies.companies.filter(c => c.status === 'pending').length,
        openDisputes: allDisputes.disputes.filter(d => d.status === 'open').length,
        escrowAwaitingRelease: 0, // TODO: Calculate from milestones with approved status
        activeProjects: 0, // TODO: Calculate from projects
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const dashboardStats = [
    {
      label: 'Pending Verifications',
      value: stats.pendingVerifications.toString(),
      icon: <Clock className="w-5 h-5" />,
      color: 'text-[#F59E0B]',
      bgColor: 'bg-[#FEF3C7]',
    },
    {
      label: 'Open Disputes',
      value: stats.openDisputes.toString(),
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'text-[#DC2626]',
      bgColor: 'bg-[#FEE2E2]',
    },
    {
      label: 'Escrow Awaiting Release',
      value: `₦${stats.escrowAwaitingRelease.toLocaleString()}`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-[#1E3A8A]',
      bgColor: 'bg-[#DBEAFE]',
    },
    {
      label: 'Active Projects',
      value: stats.activeProjects.toString(),
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'text-[#16A34A]',
      bgColor: 'bg-[#D1FAE5]',
    },
  ];
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#334155] mb-2">Admin Dashboard</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
          <p className="text-sm text-[#64748B]">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#334155] mb-2">Admin Dashboard</h1>
        <p className="text-sm text-[#64748B]">Platform overview and pending actions.</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl font-semibold text-[#334155]">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Company Verifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Company Verifications</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('/admin/companies')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingCompanies.length === 0 ? (
                <p className="text-sm text-[#64748B] text-center py-4">No pending verifications</p>
              ) : (
                pendingCompanies.map((company) => (
                  <div
                    key={company.id}
                    onClick={() => onNavigate(`/admin/companies/${company.id}`)}
                    className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg hover:bg-[#E5E7EB] cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#334155]">{company.company_name}</p>
                      <p className="text-xs text-[#64748B] mt-1">
                        {company.user?.email || 'No email'}
                      </p>
                      <p className="text-xs text-[#64748B] mt-1">
                        Submitted: {formatDate(company.created_at)}
                      </p>
                    </div>
                    <Button size="sm">Review</Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Open Disputes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Open Disputes</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('/admin/disputes')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {openDisputes.length === 0 ? (
                <p className="text-sm text-[#64748B] text-center py-4">No open disputes</p>
              ) : (
                openDisputes.map((dispute) => (
                  <div
                    key={dispute.id}
                    onClick={() => onNavigate(`/admin/disputes/${dispute.id}`)}
                    className="p-4 bg-[#FEF3C7] rounded-lg border border-[#F59E0B]/20 hover:bg-[#FEF3C7]/80 cursor-pointer transition-colors"
                  >
                    <p className="text-sm font-medium text-[#334155] mb-1">
                      {dispute.project?.title || 'Project'}
                    </p>
                    <p className="text-xs text-[#64748B] mb-2 line-clamp-2">{dispute.reason}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[#64748B]">
                        Opened: {formatDate(dispute.created_at)}
                      </p>
                      <Button size="sm">Resolve</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button
              variant="secondary"
              onClick={() => onNavigate('/admin/companies')}
            >
              <Building2 className="w-4 h-4" />
              Review Companies
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => onNavigate('/admin/disputes')}
            >
              <AlertCircle className="w-4 h-4" />
              Manage Disputes
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => onNavigate('/admin/escrow')}
            >
              <DollarSign className="w-4 h-4" />
              Escrow Overview
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
