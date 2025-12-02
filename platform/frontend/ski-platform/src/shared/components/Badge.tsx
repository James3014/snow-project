/**
 * Badge Component - Supports both traditional and Glacial Futurism styles
 * 徽章组件 - 支持傳統和冰川未來主義樣式
 */
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'beginner' | 'intermediate' | 'advanced' | 'default' | 'success' | 'warning' | 'danger' | 'info' | 'ice' | 'accent' | 'pink';
  size?: 'sm' | 'md' | 'lg';
}

export default function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  const variants = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-blue-100 text-blue-800',
    advanced: 'bg-black text-white',
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    ice: 'bg-gradient-to-r from-ice-primary/20 to-ice-secondary/20 border border-ice-primary/30 text-ice-accent',
    accent: 'bg-gradient-to-r from-ice-accent/20 to-neon-purple/20 border border-ice-accent/30 text-ice-accent',
    pink: 'bg-gradient-to-r from-neon-pink/20 to-red-500/20 border border-neon-pink/30 text-neon-pink',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </span>
  );
}
