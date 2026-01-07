import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Table, Pagination } from '../components/Table';
import { StatusBadge } from '../components/StatusBadge';
import { transactionService, Transaction } from '../services/transaction.service';
import { Receipt, DollarSign, ArrowDownCircle, ArrowUpCircle, CreditCard, XCircle } from 'lucide-react';

interface TransactionsPageProps {
  onNavigate: (path: string) => void;
  userRole?: 'client' | 'company' | 'admin' | null;
}

export function TransactionsPage({ onNavigate, userRole }: TransactionsPageProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState<'all' | 'escrow' | 'consultation'>('all');
  const [perPage] = useState(20);

  useEffect(() => {
    loadTransactions();
  }, [currentPage, typeFilter]);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await transactionService.list({
        per_page: perPage,
        page: currentPage,
        type: typeFilter === 'all' ? undefined : typeFilter,
      });
      setTransactions(Array.isArray(response.transactions) ? response.transactions : []);
      setTotalPages(response.meta?.last_page || 1);
      setTotal(response.meta?.total || 0);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'escrow_deposit':
        return <ArrowDownCircle className="w-4 h-4 text-blue-600" />;
      case 'escrow_release':
        return <ArrowUpCircle className="w-4 h-4 text-green-600" />;
      case 'escrow_refund':
        return <ArrowDownCircle className="w-4 h-4 text-orange-600" />;
      case 'consultation_payment':
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      case 'platform_fee':
        return <DollarSign className="w-4 h-4 text-yellow-600" />;
      default:
        return <Receipt className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'escrow_deposit':
        return 'Escrow Deposit';
      case 'escrow_release':
        return 'Escrow Release';
      case 'escrow_refund':
        return 'Escrow Refund';
      case 'consultation_payment':
        return 'Consultation Payment';
      case 'platform_fee':
        return 'Platform Fee';
      default:
        return type;
    }
  };

  const getAmountColor = (type: string) => {
    // For clients: deposits and consultation payments are outgoing (red), refunds are incoming (green)
    // For companies: releases are incoming (green), refunds are outgoing (red)
    // For admins: show all with appropriate colors
    if (userRole === 'client') {
      switch (type) {
        case 'escrow_deposit':
        case 'consultation_payment':
          return 'text-red-600'; // Money going out
        case 'escrow_release':
          return 'text-orange-600'; // Money released (was held, now gone)
        case 'escrow_refund':
          return 'text-green-600'; // Money coming back
        default:
          return 'text-gray-600';
      }
    } else if (userRole === 'company') {
      switch (type) {
        case 'escrow_release':
        case 'consultation_payment':
          return 'text-green-600'; // Money coming in
        case 'escrow_refund':
          return 'text-red-600'; // Money not received (refunded)
        case 'escrow_deposit':
          return 'text-blue-600'; // Not directly relevant but shown for context
        default:
          return 'text-gray-600';
      }
    } else {
      // Admin view
      switch (type) {
        case 'escrow_deposit':
        case 'consultation_payment':
          return 'text-blue-600'; // Client payment
        case 'escrow_release':
          return 'text-green-600'; // Company received
        case 'escrow_refund':
          return 'text-orange-600'; // Refunded
        case 'platform_fee':
          return 'text-yellow-600'; // Platform fee received
        default:
          return 'text-gray-600';
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateTotal = () => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return 0;
    }
    return transactions.reduce((sum, t) => {
      if (userRole === 'client') {
        // Client: deposits and consultation payments are outgoing (negative), refunds are incoming (positive)
        if (t.type === 'escrow_deposit' || t.type === 'consultation_payment') {
          return sum - t.amount;
        } else if (t.type === 'escrow_refund') {
          return sum + t.amount;
        } else {
          return sum; // escrow_release doesn't change balance for client
        }
      } else if (userRole === 'company') {
        // Company: releases are incoming (positive), refunds are outgoing (negative)
        if (t.type === 'escrow_release') {
          return sum + t.amount;
        } else if (t.type === 'escrow_refund') {
          return sum - t.amount;
        } else {
          return sum; // deposits don't change balance for company
        }
      } else {
        // Admin: just show net (not meaningful for admin view)
        return sum;
      }
    }, 0);
  };

  const columns = [
    {
      header: 'Type',
      accessor: (transaction: Transaction) => (
        <div className="flex items-center gap-2">
          {getTransactionTypeIcon(transaction.type)}
          <span className="text-sm font-medium text-[#334155]">
            {getTransactionTypeLabel(transaction.type)}
          </span>
        </div>
      ),
    },
    {
      header: 'Description',
      accessor: (transaction: Transaction) => (
        <div>
          <p className="text-sm text-[#334155]">{transaction.description}</p>
          {transaction.project && (
            <p className="text-xs text-[#64748B]">Project: {transaction.project.title}</p>
          )}
          {transaction.milestone && (
            <p className="text-xs text-[#64748B]">Milestone: {transaction.milestone.title}</p>
          )}
          {userRole === 'admin' && transaction.client && (
            <p className="text-xs text-[#64748B]">Client: {transaction.client.name}</p>
          )}
          {userRole === 'admin' && transaction.company && (
            <p className="text-xs text-[#64748B]">Company: {transaction.company.name}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Amount',
      accessor: (transaction: Transaction) => {
        // Determine if it's incoming or outgoing based on user role and transaction type
        let isOutgoing = false;
        if (userRole === 'client') {
          // Client: deposits and consultation payments are outgoing, refunds are incoming
          isOutgoing = transaction.type === 'escrow_deposit' || transaction.type === 'consultation_payment';
        } else if (userRole === 'company') {
          // Company: releases are incoming, refunds are outgoing
          isOutgoing = transaction.type === 'escrow_refund';
        } else {
          // Admin: show with + for releases/refunds/platform fees, - for deposits/payments
          isOutgoing = transaction.type === 'escrow_deposit' || transaction.type === 'consultation_payment';
        }
        
        // Show breakdown if available
        const showBreakdown = (transaction.platform_fee && transaction.platform_fee > 0) || 
                             (transaction.total_amount && transaction.total_amount !== transaction.amount);
        
        return (
          <div className="flex flex-col gap-1">
            <span className={`font-semibold ${getAmountColor(transaction.type)}`}>
              {isOutgoing ? '-' : '+'}₦{transaction.amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {showBreakdown && transaction.total_amount && (
              <div className="text-xs text-[#64748B]">
                {transaction.type === 'platform_fee' ? (
                  <span>From: ₦{transaction.total_amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                ) : transaction.platform_fee && transaction.platform_fee > 0 ? (
                  <span>
                    Total: ₦{transaction.total_amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • 
                    Fee: ₦{transaction.platform_fee.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: (transaction: Transaction) => (
        <StatusBadge 
          status={transaction.status === 'success' ? 'approved' : transaction.status === 'pending' ? 'pending' : 'rejected'} 
        />
      ),
    },
    {
      header: 'Date',
      accessor: (transaction: Transaction) => (
        <span className="text-sm text-[#64748B]">
          {formatDate(transaction.created_at)}
        </span>
      ),
    },
    {
      header: 'Reference',
      accessor: (transaction: Transaction) => (
        <div>
          {transaction.payment_reference ? (
            <span className="text-xs text-[#64748B] font-mono">
              {transaction.payment_reference.substring(0, 20)}...
            </span>
          ) : (
            <span className="text-xs text-[#64748B]">N/A</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#334155] mb-2">Transaction History</h1>
        <p className="text-sm text-[#64748B]">
          {userRole === 'admin' 
            ? 'View all transactions in the system'
            : 'View your transaction history'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">Total Transactions</p>
                <p className="text-2xl font-semibold text-[#334155]">{total}</p>
              </div>
              <Receipt className="w-8 h-8 text-[#334155]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">Net Amount</p>
                <p className={`text-2xl font-semibold ${calculateTotal() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {calculateTotal() >= 0 ? '+' : ''}₦{Math.abs(calculateTotal()).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-[#334155]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">Successful</p>
                <p className="text-2xl font-semibold text-green-600">
                  {transactions.filter(t => t.status === 'success').length}
                </p>
              </div>
              <Receipt className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-[#334155]">Filter by Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as 'all' | 'escrow' | 'consultation');
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="all">All Transactions</option>
              <option value="escrow">Escrow Only</option>
              <option value="consultation">Consultations Only</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
              <p className="text-sm text-[#64748B]">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <XCircle className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
              <p className="text-sm text-[#64748B]">No transactions found</p>
            </div>
          ) : (
            <>
              <Table columns={columns} data={transactions} />
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
        </CardContent>
      </Card>
    </div>
  );
}

