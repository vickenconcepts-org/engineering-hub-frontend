import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { Table, Pagination } from '../components/Table';
import { Modal } from '../components/Modal';
import { Select } from '../components/Select';
import { adminService, MilestoneForRelease } from '../services/admin.service';
import { paymentAccountService, PaymentAccount } from '../services/payment-account.service';
import { DollarSign, Eye, CheckCircle, XCircle, Clock, Shield, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminEscrowPage() {
  const navigate = useNavigate();
  const [milestones, setMilestones] = useState<MilestoneForRelease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'held' | 'released' | 'all'>('held');
  const [perPage] = useState(15);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneForRelease | null>(null);
  const [companyAccounts, setCompanyAccounts] = useState<PaymentAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [adminOverride, setAdminOverride] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadMilestones();
  }, [currentPage, statusFilter]);

  const loadMilestones = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.listEscrowMilestones({
        per_page: perPage,
        page: currentPage,
        status: statusFilter,
      });
      setMilestones(response.milestones || []);
      setTotalPages(response.meta?.last_page || 1);
      setTotal(response.meta?.total || 0);
    } catch (error) {
      console.error('Failed to load escrow milestones:', error);
      toast.error('Failed to load escrow milestones');
    } finally {
      setIsLoading(false);
    }
  };

  const getEscrowStatusBadge = (status: string | undefined): 'pending' | 'approved' | 'rejected' | 'funded' | 'released' | 'disputed' | 'completed' | 'active' | 'scheduled' => {
    if (!status) return 'pending';
    switch (status.toLowerCase()) {
      case 'released':
        return 'released';
      case 'held':
        return 'funded';
      case 'refunded':
        return 'rejected';
      default:
        return 'pending';
    }
  };

  const getMilestoneStatusBadge = (status: string | undefined): 'pending' | 'approved' | 'rejected' | 'funded' | 'released' | 'disputed' | 'completed' | 'active' | 'scheduled' => {
    if (!status) return 'pending';
    switch (status.toLowerCase()) {
      case 'approved':
        return 'approved';
      case 'submitted':
        return 'pending';
      case 'funded':
        return 'funded';
      case 'pending':
        return 'pending';
      case 'rejected':
        return 'rejected';
      case 'released':
        return 'released';
      default:
        return 'pending';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateTotalHeld = () => {
    return milestones
      .filter(m => m.escrow?.status === 'held')
      .reduce((sum, m) => {
        const amount = m.escrow?.amount || m.amount || 0;
        return sum + parseFloat(amount.toString());
      }, 0);
  };

  const calculateTotalReleased = () => {
    return milestones
      .filter(m => m.escrow?.status === 'released')
      .reduce((sum, m) => {
        const amount = m.escrow?.amount || m.amount || 0;
        return sum + parseFloat(amount.toString());
      }, 0);
  };

  const loadCompanyAccounts = async (milestone: MilestoneForRelease) => {
    const companyUserId = milestone.project?.company?.user_id || milestone.project?.company?.user?.id;
    if (!companyUserId) {
      toast.error('Company user information not available');
      return;
    }

    try {
      setIsLoadingAccounts(true);
      const accounts = await paymentAccountService.getUserAccounts(companyUserId);
      setCompanyAccounts(accounts);
      const defaultAccount = accounts.find(acc => acc.is_default);
      if (defaultAccount) {
        setSelectedAccountId(defaultAccount.id);
      } else if (accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
      }
    } catch (error: any) {
      console.error('Failed to load company accounts:', error);
      toast.error('Failed to load company payment accounts');
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const handleRelease = async () => {
    if (!selectedMilestone || !selectedMilestone.escrow) return;

    if (companyAccounts.length === 0) {
      toast.error('Company has no payment accounts. Please ask them to add one first.');
      return;
    }

    const selectedAccount = companyAccounts.find(acc => acc.id === selectedAccountId);
    if (!selectedAccount) {
      toast.error('Please select a payment account');
      return;
    }

    setIsProcessing(true);
    try {
      await adminService.releaseEscrow(selectedMilestone.id, {
        override: adminOverride,
        recipient_account: {
          account_number: selectedAccount.account_number,
          bank_code: selectedAccount.bank_code,
          name: selectedAccount.account_name,
        },
      });
      toast.success('Escrow funds released successfully!');
      setReleaseModalOpen(false);
      setSelectedMilestone(null);
      setSelectedAccountId('');
      setAdminOverride(false);
      loadMilestones();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to release escrow funds');
    } finally {
      setIsProcessing(false);
    }
  };

  const columns = [
    {
      header: 'Milestone',
      accessor: (milestone: MilestoneForRelease) => {
        const projectTitle = milestone.project?.title || (milestone.project_id ? `Project ID: ${milestone.project_id}` : 'N/A');
        const milestoneTitle = milestone.title || `Milestone #${milestone.id}`;
        
        return (
        <div>
            <p className="font-medium text-[#334155]">{milestoneTitle}</p>
            <p className="text-xs text-[#64748B]">Project: {projectTitle}</p>
        </div>
        );
      },
    },
    {
      header: 'Amount',
      accessor: (milestone: MilestoneForRelease) => {
        // Get amount from escrow first, then fallback to milestone amount
        const amount = milestone.escrow?.amount || milestone.amount || 0;
        
        return (
        <span className="font-semibold text-[#334155]">
            ₦{parseFloat(amount.toString()).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        );
      },
    },
    {
      header: 'Milestone Status',
      accessor: (milestone: MilestoneForRelease) => {
        const status = milestone.status || '';
        return <StatusBadge status={getMilestoneStatusBadge(status)} />;
      },
    },
    {
      header: 'Escrow Status',
      accessor: (milestone: MilestoneForRelease) => {
        const escrowStatus = milestone.escrow?.status || '';
        return <StatusBadge status={getEscrowStatusBadge(escrowStatus)} />;
      },
    },
    {
      header: 'Actions',
      accessor: (milestone: MilestoneForRelease) => {
        const projectId = milestone.project?.id || milestone.project_id;
        if (!projectId) {
          return <span className="text-sm text-[#64748B]">N/A</span>;
        }
        const canRelease = milestone.escrow?.status === 'held' && 
                          (milestone.status === 'approved' || milestone.status === 'submitted');
        return (
          <div className="flex gap-2">
          <Button
              variant="secondary"
            size="sm"
              onClick={() => navigate(`/projects/${projectId}?milestone=${milestone.id}&project_id=${projectId}`)}
              className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all"
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
            {canRelease && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedMilestone(milestone);
                  setReleaseModalOpen(true);
                  loadCompanyAccounts(milestone);
                }}
                className="bg-gradient-to-r from-[#16A34A] to-[#22C55E] hover:from-[#15803D] hover:to-[#16A34A] text-white shadow-md hover:shadow-lg transition-all"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Release
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  // Table component expects the original data array, not transformed data
  // It will call the accessor functions with the original milestone objects

  const totalHeld = calculateTotalHeld();
  const totalReleased = calculateTotalReleased();

  return (
    <div className="bg-[#F5F5F5] min-h-screen p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#334155] mb-2">Escrow Management</h1>
          <p className="text-sm text-[#64748B]">Manage milestone escrow funds and releases</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* First Card - Blue Gradient */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#1E40AF] shadow-lg">
            <div className="p-6 text-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium mb-2 opacity-90">Total Held</p>
                  <p className="text-4xl font-bold mb-1">₦{totalHeld.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-xs opacity-80 mt-2">Funds in escrow</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Second Card - White with Green */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E5E7EB]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[#1E3A8A] mb-2">Total Released</p>
                <p className="text-3xl font-bold mb-1 text-[#16A34A]">
                  ₦{totalReleased.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-[#64748B] mt-1">Released to companies</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#16A34A]/10 to-[#22C55E]/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-[#16A34A]" />
              </div>
            </div>
          </div>

          {/* Third Card - White with Blue */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E5E7EB]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[#1E3A8A] mb-2">Total Milestones</p>
                <p className="text-3xl font-bold mb-1 text-[#334155]">{total}</p>
                <p className="text-xs text-[#64748B] mt-1">All milestones</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1E3A8A]/10 to-[#2563EB]/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#1E3A8A]" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-[#334155]">Filter by Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'held' | 'released' | 'all');
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white"
            >
              <option value="held">Held</option>
              <option value="released">Released</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>

        {/* Milestones Table */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg overflow-hidden">
          <div className="p-6 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1E3A8A]/10 to-[#2563EB]/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#1E3A8A]" />
              </div>
              <h2 className="text-lg font-semibold text-[#334155]">Escrow Milestones</h2>
            </div>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
                <p className="text-sm text-[#64748B]">Loading escrow milestones...</p>
              </div>
            ) : milestones.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-[#64748B]" />
                </div>
                <p className="text-sm font-medium text-[#334155] mb-1">No milestones with escrow found</p>
                <p className="text-xs text-[#64748B]">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <Table columns={columns} data={milestones} />
                {totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      {/* Release Escrow Modal */}
      <Modal
        isOpen={releaseModalOpen}
        onClose={() => !isProcessing && setReleaseModalOpen(false)}
        title="Release Escrow Funds"
        size="lg"
        primaryAction={{
          label: isProcessing ? 'Releasing...' : 'Release Funds',
          onClick: handleRelease,
          disabled: isProcessing || companyAccounts.length === 0 || !selectedAccountId,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => {
            setReleaseModalOpen(false);
            setSelectedMilestone(null);
            setSelectedAccountId('');
            setAdminOverride(false);
          },
          disabled: isProcessing,
        }}
      >
        <div className="space-y-4">
          <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E5E7EB]">
            <p className="text-sm text-[#334155] mb-2">
              <strong>Release Details:</strong>
            </p>
            <div className="space-y-1 text-sm text-[#64748B]">
              <p>Milestone: {selectedMilestone?.title}</p>
              <p>Amount: ₦{selectedMilestone?.escrow?.amount.toLocaleString()}</p>
              <p>Status: {selectedMilestone?.status}</p>
            </div>
          </div>

          {selectedMilestone?.status !== 'approved' && (
            <div className="bg-[#FEF3C7] rounded-lg p-3 border border-[#F59E0B]/20">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={adminOverride}
                  onChange={(e) => setAdminOverride(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#E5E7EB] text-[#1E3A8A] focus:ring-[#1E3A8A]"
                />
                <span className="text-xs text-[#334155]">
                  Override client approval requirement
                </span>
              </label>
            </div>
          )}

          {isLoadingAccounts ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A] mx-auto mb-2"></div>
              <p className="text-sm text-[#64748B]">Loading company payment accounts...</p>
            </div>
          ) : companyAccounts.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 mb-2">
                Company has no payment accounts linked. Please ask them to add a payment account in their settings.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-2">
                Select Company Payment Account <span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                options={companyAccounts.map(acc => ({
                  value: acc.id,
                  label: `${acc.account_name} - ${acc.account_number}${acc.is_default ? ' (Default)' : ''}`,
                }))}
                placeholder="Select payment account"
                required
              />
              {selectedAccountId && (
                <div className="mt-3 p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
                  {(() => {
                    const account = companyAccounts.find(acc => acc.id === selectedAccountId);
                    return account ? (
                      <div className="text-sm text-[#64748B]">
                        <p><strong>Account:</strong> {account.account_name}</p>
                        <p><strong>Number:</strong> {account.account_number}</p>
                        <p><strong>Bank:</strong> {account.bank_name || `Code: ${account.bank_code}`}</p>
                        {account.is_verified && (
                          <p className="text-green-600 mt-1">✓ Verified</p>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          )}

          <div className="bg-[#D1FAE5] rounded-lg p-4 border border-[#16A34A]/20">
            <p className="text-sm text-[#334155] mb-2">
              <strong>This action will:</strong>
            </p>
            <ul className="space-y-1 text-sm text-[#64748B]">
              <li>• Transfer funds from escrow to company account</li>
              <li>• Mark milestone as released</li>
              <li>• Update escrow status</li>
              <li>• Notify both parties</li>
            </ul>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
}

