/**
 * Card Component - Supports both traditional and Glacial Futurism styles
 * 卡片组件 - 支持傳統和冰川未來主義樣式
 */
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  variant?: 'traditional' | 'glass';
}

export default function Card({ children, className = '', onClick, hover = false, variant = 'traditional' }: CardProps) {
  const baseClasses = variant === 'glass'
    ? 'glass-card rounded-xl overflow-hidden'
    : 'bg-white rounded-lg shadow-md';

  const hoverClasses = hover
    ? variant === 'glass'
      ? 'hover:border-ice-primary/50 hover:shadow-lg hover:shadow-ice-primary/20 transition-all cursor-pointer group'
      : 'hover:shadow-lg hover:scale-[1.02] transition-transform cursor-pointer'
    : '';

  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {variant === 'glass' && <div className="absolute inset-0 bg-gradient-to-br from-ice-primary/5 via-transparent to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />}
      <div className={variant === 'glass' ? 'relative z-10' : ''}>
        {children}
      </div>
    </div>
  );
}

Card.Header = function CardHeader({ children, className = '', variant = 'traditional' }: { children: ReactNode; className?: string; variant?: 'traditional' | 'glass' }) {
  const borderClass = variant === 'glass' ? 'border-glacier' : 'border-gray-200';
  return <div className={`px-6 py-4 border-b ${borderClass} ${className}`}>{children}</div>;
};

Card.Body = function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = '', variant = 'traditional' }: { children: ReactNode; className?: string; variant?: 'traditional' | 'glass' }) {
  const borderClass = variant === 'glass' ? 'border-glacier' : 'border-gray-200';
  return <div className={`px-6 py-4 border-t ${borderClass} ${className}`}>{children}</div>;
};
