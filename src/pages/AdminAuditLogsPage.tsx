import React, { useState, useEffect } from 'react';
import { Activity, Filter, Search, Calendar, User, Building2, FolderKanban, Shield, AlertCircle, TrendingUp } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Pagination } from '../components/Table';
import { adminService, AuditLog } from '../services/admin.service';
import toast from 'react-hot-toast';

interface AdminAuditLogsPageProps {
  onNavigate: (path: string) => void;
}

export function AdminAuditLogsPage({ onNavigate }: AdminAuditLogsPageProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paginationMeta, setPaginationMeta] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filters
  const [filters, setFilters] = useState({
    action: '',
    entity_type: '',
    user_id: '',
    from_date: '',
    to_date: '',
  });
  
  // Statistics
  const [stats, setStats] = useState({
    totalActions: 0,
    todayActions: 0,
    mostActiveUser: null as { name: string; count: number } | null,
    mostActiveEntity: null as { type: string; count: number } | null,
  });

  useEffect(() => {
    loadAuditLogs();
  }, [currentPage, filters]);

  const loadAuditLogs = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        per_page: 50,
        page: currentPage,
      };

      if (filters.action) params.action = filters.action;
      if (filters.entity_type) params.entity_type = filters.entity_type;
      if (filters.user_id) params.user_id = filters.user_id;
      if (filters.from_date) params.from_date = filters.from_date;
      if (filters.to_date) params.to_date = filters.to_date;

      const response = await adminService.listAuditLogs(params);
      setLogs(response.logs);
      setPaginationMeta(response.meta);
      
      // Calculate statistics
      calculateStats(response.logs);
    } catch (error: any) {
      console.error('Failed to load audit logs:', error);
      toast.error(error.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (logsData: AuditLog[]) => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logsData.filter(log => log.created_at.startsWith(today));
    
    // Count actions by user
    const userCounts: Record<string, { name: string; count: number }> = {};
    logsData.forEach(log => {
      if (log.user) {
        const userId = log.user.id;
        if (!userCounts[userId]) {
          userCounts[userId] = { name: log.user.name, count: 0 };
        }
        userCounts[userId].count++;
      }
    });
    
    // Count actions by entity type
    const entityCounts: Record<string, number> = {};
    logsData.forEach(log => {
      entityCounts[log.entity_type] = (entityCounts[log.entity_type] || 0) + 1;
    });

    const mostActiveUser = Object.values(userCounts).reduce((max, user) => 
      user.count > max.count ? user : max, 
      { name: 'N/A', count: 0 }
    );

    const mostActiveEntity = Object.entries(entityCounts).reduce((max, [type, count]) => 
      count > max.count ? { type, count } : max, 
      { type: 'N/A', count: 0 }
    );

    setStats({
      totalActions: logsData.length,
      todayActions: todayLogs.length,
      mostActiveUser: mostActiveUser.count > 0 ? mostActiveUser : null,
      mostActiveEntity: mostActiveEntity.count > 0 ? mostActiveEntity : null,
    });
  };

  const getActionIcon = (action: string) => {
    if (action.includes('company')) return <Building2 className="w-4 h-4" />;
    if (action.includes('project')) return <FolderKanban className="w-4 h-4" />;
    if (action.includes('milestone')) return <Shield className="w-4 h-4" />;
    if (action.includes('escrow')) return <Shield className="w-4 h-4" />;
    if (action.includes('dispute')) return <AlertCircle className="w-4 h-4" />;
    if (action.includes('user')) return <User className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('approved') || action.includes('completed') || action.includes('released')) {
      return 'text-[#16A34A] bg-[#16A34A]/10';
    }
    if (action.includes('rejected') || action.includes('suspended') || action.includes('cancelled')) {
      return 'text-[#DC2626] bg-[#DC2626]/10';
    }
    if (action.includes('created') || action.includes('submitted')) {
      return 'text-[#2563EB] bg-[#2563EB]/10';
    }
    return 'text-[#64748B] bg-[#64748B]/10';
  };

  const formatAction = (action: string) => {
    return action
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      entity_type: '',
      user_id: '',
      from_date: '',
      to_date: '',
    });
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4F8] via-[#F8FAFC] to-[#F0F7FF] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#334155] mb-2 flex items-center gap-3">
                <Activity className="w-8 h-8 text-[#1E3A8A]" />
                Audit Logs & Activity
              </h1>
              <p className="text-sm text-[#64748B]">
                Track all system activities and user actions
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B] mb-1">Total Actions</p>
                <p className="text-2xl font-bold text-[#334155]">{stats.totalActions}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#1E3A8A]/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-[#1E3A8A]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B] mb-1">Today's Actions</p>
                <p className="text-2xl font-bold text-[#334155]">{stats.todayActions}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#16A34A]/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#16A34A]" />
              </div>
            </div>
          </div>

          {stats.mostActiveUser && (
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#64748B] mb-1">Most Active User</p>
                  <p className="text-lg font-semibold text-[#334155] truncate">{stats.mostActiveUser.name}</p>
                  <p className="text-xs text-[#64748B]">{stats.mostActiveUser.count} actions</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-[#2563EB]" />
                </div>
              </div>
            </div>
          )}

          {stats.mostActiveEntity && (
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#64748B] mb-1">Most Active Entity</p>
                  <p className="text-lg font-semibold text-[#334155] capitalize">{stats.mostActiveEntity.type}</p>
                  <p className="text-xs text-[#64748B]">{stats.mostActiveEntity.count} actions</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
                  {getActionIcon(`entity.${stats.mostActiveEntity.type}`)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-[#64748B]" />
            <h2 className="text-lg font-semibold text-[#334155]">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">Action</label>
              <Input
                type="text"
                placeholder="Search action..."
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">Entity Type</label>
              <Select
                value={filters.entity_type}
                onChange={(e) => handleFilterChange('entity_type', e.target.value)}
                options={[
                  { value: '', label: 'All Types' },
                  { value: 'company', label: 'Company' },
                  { value: 'project', label: 'Project' },
                  { value: 'milestone', label: 'Milestone' },
                  { value: 'escrow', label: 'Escrow' },
                  { value: 'dispute', label: 'Dispute' },
                  { value: 'user', label: 'User' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">User ID</label>
              <Input
                type="text"
                placeholder="User ID..."
                value={filters.user_id}
                onChange={(e) => handleFilterChange('user_id', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">From Date</label>
              <Input
                type="date"
                value={filters.from_date}
                onChange={(e) => handleFilterChange('from_date', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">To Date</label>
              <Input
                type="date"
                value={filters.to_date}
                onChange={(e) => handleFilterChange('to_date', e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="border-[#E5E7EB] hover:bg-[#F8FAFC]"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg overflow-hidden">
          <div className="p-6 border-b border-[#E5E7EB]">
            <h2 className="text-lg font-semibold text-[#334155]">Activity Log</h2>
          </div>
          
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
              <p className="mt-4 text-sm text-[#64748B]">Loading audit logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-12 h-12 text-[#64748B] mx-auto mb-4 opacity-50" />
              <p className="text-sm text-[#64748B]">No audit logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">Entity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#E5E7EB]">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#F8FAFC]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getActionColor(log.action)}`}>
                              {getActionIcon(log.action)}
                            </div>
                            <span className="text-sm font-medium text-[#334155]">{formatAction(log.action)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-[#334155]">
                            <span className="font-medium capitalize">{log.entity_type}</span>
                            {log.entity_id && (
                              <span className="text-[#64748B] ml-2 text-xs">({log.entity_id.substring(0, 8)}...)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {log.user ? (
                            <div className="text-sm text-[#334155]">
                              <div className="font-medium">{log.user.name}</div>
                              <div className="text-xs text-[#64748B]">{log.user.email}</div>
                            </div>
                          ) : (
                            <span className="text-sm text-[#64748B]">System</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {log.metadata && Object.keys(log.metadata).length > 0 ? (
                            <div className="text-sm text-[#64748B]">
                              <details className="cursor-pointer">
                                <summary className="text-[#334155] hover:text-[#1E3A8A]">View Details</summary>
                                <pre className="mt-2 p-2 bg-[#F8FAFC] rounded text-xs overflow-x-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </details>
                            </div>
                          ) : (
                            <span className="text-sm text-[#64748B]">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#64748B]">
                          {formatDate(log.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {paginationMeta && paginationMeta.last_page > 1 && (
                <div className="px-6 py-4 border-t border-[#E5E7EB]">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                    <div className="text-sm text-[#64748B]">
                      Showing {paginationMeta.from} to {paginationMeta.to} of {paginationMeta.total} results
                    </div>
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={paginationMeta.last_page}
                    onPageChange={setCurrentPage}
                    showInfo={false}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
