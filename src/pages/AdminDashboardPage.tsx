import React from 'react';
import { Building2, AlertCircle, DollarSign, Users, Clock, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';

interface AdminDashboardPageProps {
  onNavigate: (path: string) => void;
}

export function AdminDashboardPage({ onNavigate }: AdminDashboardPageProps) {
  // Mock data
  const stats = [
    {
      label: 'Pending Verifications',
      value: '3',
      icon: <Clock className="w-5 h-5" />,
      color: 'text-[#F59E0B]',
      bgColor: 'bg-[#FEF3C7]',
    },
    {
      label: 'Open Disputes',
      value: '2',
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'text-[#DC2626]',
      bgColor: 'bg-[#FEE2E2]',
    },
    {
      label: 'Escrow Awaiting Release',
      value: '$68,750',
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-[#1E3A8A]',
      bgColor: 'bg-[#DBEAFE]',
    },
    {
      label: 'Active Projects',
      value: '24',
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'text-[#16A34A]',
      bgColor: 'bg-[#D1FAE5]',
    },
  ];
  
  const pendingCompanies = [
    {
      id: 1,
      name: 'BuildRight Construction',
      location: 'Abuja, Nigeria',
      submittedDate: 'Jan 5, 2026',
    },
    {
      id: 2,
      name: 'Skyline Builders',
      location: 'Kumasi, Ghana',
      submittedDate: 'Jan 6, 2026',
    },
    {
      id: 3,
      name: 'Heritage Homes',
      location: 'Mombasa, Kenya',
      submittedDate: 'Jan 7, 2026',
    },
  ];
  
  const openDisputes = [
    {
      id: 1,
      project: 'Residential Home - Lagos',
      client: 'John Doe',
      company: 'AfricaBuild Ltd',
      reason: 'Quality concerns with foundation work',
      openedDate: 'Jan 8, 2026',
    },
    {
      id: 2,
      project: 'Commercial Building - Accra',
      client: 'Jane Smith',
      company: 'Premier Construction',
      reason: 'Delay in milestone completion',
      openedDate: 'Jan 9, 2026',
    },
  ];
  
  const recentActivity = [
    { id: 1, action: 'Company verified', details: 'AfricaBuild Ltd approved', time: '2 hours ago' },
    { id: 2, action: 'Escrow released', details: '$25,000 for Milestone #1', time: '5 hours ago' },
    { id: 3, action: 'Dispute resolved', details: 'Project #145 - Partial refund', time: '1 day ago' },
    { id: 4, action: 'New registration', details: 'Elite Builders submitted docs', time: '1 day ago' },
  ];
  
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
              {pendingCompanies.map((company) => (
                <div
                  key={company.id}
                  onClick={() => onNavigate(`/admin/companies/${company.id}`)}
                  className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg hover:bg-[#E5E7EB] cursor-pointer transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-[#334155]">{company.name}</p>
                    <p className="text-xs text-[#64748B] mt-1">{company.location}</p>
                    <p className="text-xs text-[#64748B] mt-1">Submitted: {company.submittedDate}</p>
                  </div>
                  <Button size="sm">Review</Button>
                </div>
              ))}
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
              {openDisputes.map((dispute) => (
                <div
                  key={dispute.id}
                  onClick={() => onNavigate(`/admin/disputes/${dispute.id}`)}
                  className="p-4 bg-[#FEF3C7] rounded-lg border border-[#F59E0B]/20 hover:bg-[#FEF3C7]/80 cursor-pointer transition-colors"
                >
                  <p className="text-sm font-medium text-[#334155] mb-1">{dispute.project}</p>
                  <p className="text-xs text-[#64748B] mb-2">{dispute.reason}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#64748B]">Opened: {dispute.openedDate}</p>
                    <Button size="sm">Resolve</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 bg-[#F8FAFC] rounded-lg"
              >
                <div className="w-2 h-2 bg-[#1E3A8A] rounded-full mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#334155]">{activity.action}</p>
                  <p className="text-sm text-[#64748B] mt-1">{activity.details}</p>
                </div>
                <span className="text-xs text-[#64748B]">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
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
