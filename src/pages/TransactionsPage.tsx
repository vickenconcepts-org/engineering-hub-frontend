import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Table, Pagination } from '../components/Table';
import { StatusBadge } from '../components/StatusBadge';
import { transactionService, Transaction } from '../services/transaction.service';
import { Receipt, DollarSign, ArrowDownCircle, ArrowUpCircle, CreditCard, XCircle, TrendingUp, CheckCircle2, Copy, Check } from 'lucide-react';
import { formatAmountWithCurrency, parseFormattedAmount } from '../lib/money-utils';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

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
      // Parse formatted amount (handles K, M, B notation from backend)
      const amount = parseFormattedAmount(t.amount);
      const validAmount = isNaN(amount) || !isFinite(amount) ? 0 : amount;
      
      if (userRole === 'client') {
        // Client: deposits and consultation payments are outgoing (negative), refunds are incoming (positive)
        if (t.type === 'escrow_deposit' || t.type === 'consultation_payment') {
          return sum - validAmount;
        } else if (t.type === 'escrow_refund') {
          return sum + validAmount;
        } else {
          return sum; // escrow_release doesn't change balance for client
        }
      } else if (userRole === 'company') {
        // Company: releases are incoming (positive), refunds are outgoing (negative)
        if (t.type === 'escrow_release') {
          return sum + validAmount;
        } else if (t.type === 'escrow_refund') {
          return sum - validAmount;
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
        
        // Show breakdown if available (parse amounts to check values)
        const platformFeeAmount = parseFormattedAmount(transaction.platform_fee);
        const totalAmount = parseFormattedAmount(transaction.total_amount);
        const transactionAmount = parseFormattedAmount(transaction.amount);
        const showBreakdown = (platformFeeAmount > 0) || 
                             (totalAmount && totalAmount !== transactionAmount);
        
        return (
          <div className="flex flex-col gap-1">
            <span className={`font-semibold ${getAmountColor(transaction.type)}`}>
              {isOutgoing ? '-' : '+'}{formatAmountWithCurrency(transaction.amount)}
            </span>
            {showBreakdown && transaction.total_amount && (
              <div className="text-xs text-[#64748B]">
                {transaction.type === 'platform_fee' ? (
                  <span>From: {formatAmountWithCurrency(transaction.total_amount)}</span>
                ) : platformFeeAmount > 0 ? (
                  <span>
                    Total: {formatAmountWithCurrency(transaction.total_amount)} • 
                    Fee: {formatAmountWithCurrency(transaction.platform_fee)}
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
      accessor: (transaction: Transaction) => {
        const handleCopy = async () => {
          if (transaction.payment_reference) {
            try {
              await navigator.clipboard.writeText(transaction.payment_reference);
              setCopiedRef(transaction.payment_reference);
              toast.success('Reference copied to clipboard');
              setTimeout(() => setCopiedRef(null), 2000);
            } catch (error) {
              toast.error('Failed to copy reference');
            }
          }
        };

        return (
          <div className="flex items-center gap-2">
            {transaction.payment_reference ? (
              <>
                <span className="text-xs text-[#64748B] font-mono">
                  {transaction.payment_reference}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1 hover:bg-[#F1F5F9] rounded transition-colors group"
                  title="Copy reference"
                >
                  {copiedRef === transaction.payment_reference ? (
                    <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#1E3A8A]" />
                  )}
                </button>
              </>
            ) : (
              <span className="text-xs text-[#64748B]">N/A</span>
            )}
          </div>
        );
      },
    },
  ];

  const netAmount = calculateTotal();
  const successfulCount = transactions.filter(t => t.status === 'success').length;
  
  // Ensure netAmount is a valid number
  const validNetAmount = isNaN(netAmount) || !isFinite(netAmount) ? 0 : netAmount;

  return (
    <div className="min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#334155] mb-2">Transaction History</h1>
          <p className="text-sm text-[#64748B]">
            {userRole === 'admin' 
              ? 'View all transactions in the system'
              : 'View your transaction history'}
          </p>
        </div>

        {/* Stats Cards and Chart */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* First Card - Blue Gradient */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#1E40AF] shadow-lg self-start">
            <div className="p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium mb-2 opacity-90">Total Transactions</p>
                  <p className="text-4xl font-bold mb-1">{total}</p>
                  <div className="flex items-center gap-2 text-xs opacity-80 mt-2">
                    <TrendingUp className="w-3 h-3" />
                    <span>All time</span>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <Receipt className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Second Card - White with Blue */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E5E7EB] self-start">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[#1E3A8A] mb-2">Net Amount</p>
                <p className={`text-3xl font-bold mb-1 ${validNetAmount >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                  {validNetAmount >= 0 ? '+' : ''}{formatAmountWithCurrency(Math.abs(validNetAmount))}
                </p>
                <p className="text-xs text-[#64748B] mt-1">Total balance</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1E3A8A]/10 to-[#2563EB]/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#1E3A8A]" />
              </div>
            </div>
          </div>

          {/* Transaction Chart */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[#334155] mb-1">Transaction Trends</h3>
              <p className="text-xs text-[#64748B]">Activity overview</p>
            </div>
            {useMemo(() => {
            // Group transactions by date
            const transactionsByDate = transactions.reduce((acc, transaction) => {
              const date = new Date(transaction.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
              
              if (!acc[date]) {
                acc[date] = {
                  date,
                  amount: 0,
                  count: 0,
                };
              }
              
              // Parse formatted amount (handles K, M, B notation from backend)
              const amount = parseFormattedAmount(transaction.amount);
              
              if (userRole === 'client') {
                if (transaction.type === 'escrow_deposit' || transaction.type === 'consultation_payment') {
                  acc[date].amount -= amount;
                } else if (transaction.type === 'escrow_refund') {
                  acc[date].amount += amount;
                }
              } else if (userRole === 'company') {
                if (transaction.type === 'escrow_release' || transaction.type === 'consultation_payment') {
                  acc[date].amount += amount;
                } else if (transaction.type === 'escrow_refund') {
                  acc[date].amount -= amount;
                }
              } else {
                acc[date].amount += amount;
              }
              
              acc[date].count += 1;
              return acc;
            }, {} as Record<string, { date: string; amount: number; count: number }>);
            
            type ChartDataPoint = { date: string; amount: number; count: number };
            const chartDataArray: ChartDataPoint[] = Object.values(transactionsByDate);
            const chartData = chartDataArray
              .sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateA.getTime() - dateB.getTime();
              })
              .slice(-30); // Last 30 days
            
            if (chartData.length === 0) {
              return (
                <div className="h-48 flex items-center justify-center text-[#64748B]">
                  <p className="text-xs">No data available</p>
                </div>
              );
            }
            
            return (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748B"
                    style={{ fontSize: '10px' }}
                    tick={{ fill: '#64748B' }}
                  />
                  <YAxis 
                    stroke="#64748B"
                    style={{ fontSize: '10px' }}
                    tick={{ fill: '#64748B' }}
                    tickFormatter={(value) => {
                      if (Math.abs(value) >= 1000000) return `₦${(value / 1000000).toFixed(1)}M`;
                      if (Math.abs(value) >= 1000) return `₦${(value / 1000).toFixed(1)}K`;
                      return `₦${value}`;
                    }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [
                      formatAmountWithCurrency(value),
                      'Amount'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#1E3A8A" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            );
          }, [transactions, userRole])}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg overflow-hidden">
          <div className="p-6 border-b border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#334155]">Transaction History</h2>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-[#64748B]">Filter:</label>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value as 'all' | 'escrow' | 'consultation');
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white text-[#334155] hover:border-[#1E3A8A] transition-colors"
                >
                  <option value="all">All Transactions</option>
                  <option value="escrow">Escrow Only</option>
                  <option value="consultation">Consultations Only</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
                <p className="text-sm text-[#64748B]">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-[#64748B]" />
                </div>
                <p className="text-sm font-medium text-[#334155] mb-1">No transactions found</p>
                <p className="text-xs text-[#64748B]">Try adjusting your filters</p>
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
          </div>
        </div>
      </div>
    </div>
  );
}

