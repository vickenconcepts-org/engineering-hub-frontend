import React from 'react';

export type BadgeStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'funded' 
  | 'released' 
  | 'disputed'
  | 'completed'
  | 'active'
  | 'suspended'
  | 'scheduled';

interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusConfig = {
    pending: {
      bg: 'bg-[#FEF3C7]',
      text: 'text-[#92400E]',
      label: 'Pending',
    },
    approved: {
      bg: 'bg-[#D1FAE5]',
      text: 'text-[#065F46]',
      label: 'Approved',
    },
    rejected: {
      bg: 'bg-[#FEE2E2]',
      text: 'text-[#991B1B]',
      label: 'Rejected',
    },
    funded: {
      bg: 'bg-[#DBEAFE]',
      text: 'text-[#1E40AF]',
      label: 'Funded',
    },
    released: {
      bg: 'bg-[#D1FAE5]',
      text: 'text-[#065F46]',
      label: 'Released',
    },
    disputed: {
      bg: 'bg-[#FEE2E2]',
      text: 'text-[#991B1B]',
      label: 'Disputed',
    },
    completed: {
      bg: 'bg-[#D1FAE5]',
      text: 'text-[#065F46]',
      label: 'Completed',
    },
    active: {
      bg: 'bg-[#DBEAFE]',
      text: 'text-[#1E40AF]',
      label: 'Active',
    },
    suspended: {
      bg: 'bg-[#FEE2E2]',
      text: 'text-[#991B1B]',
      label: 'Suspended',
    },
    scheduled: {
      bg: 'bg-[#E0E7FF]',
      text: 'text-[#3730A3]',
      label: 'Scheduled',
    },
  };
  
  const config = statusConfig[status];
  
  // Fallback to pending if status is invalid
  if (!config) {
    console.warn(`Invalid status badge status: ${status}. Falling back to 'pending'.`);
    const fallbackConfig = statusConfig.pending;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${fallbackConfig.bg} ${fallbackConfig.text} ${className}`}
      >
        {status || 'Unknown'}
      </span>
    );
  }
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} ${className}`}
    >
      {config.label}
    </span>
  );
}
