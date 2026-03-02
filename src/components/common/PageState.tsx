import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageLoadingProps {
  message?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({ message = '불러오는 중...' }) => (
  <div className="p-12 text-center">
    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C7FB]"></div>
    <p className="mt-2 text-gray-600">{message}</p>
  </div>
);

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = 'p-12 text-center',
}) => (
  <div className={className}>
    <Icon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
    <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
    {action}
  </div>
);
