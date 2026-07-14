import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export function Card({ children, className = '', padding = 'md', hover = false }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={`
        rounded-lg shadow-sm
        ${paddingClasses[padding]}
        ${hover ? 'transition-all hover:shadow-md' : ''}
        ${className}
      `}
      style={{ 
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        color: 'var(--card-foreground)',
        ...(hover && { cursor: 'pointer' })
      }}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function CardHeader({ children, className = '', onClick }: CardHeaderProps) {
  return (
    <div
      className={`pb-4 mb-4 transition-colors ${className}`}
      style={{ borderBottom: '1px solid var(--border)', ...(onClick ? { cursor: 'pointer' } : {}) }}
      onClick={onClick}
      onMouseEnter={onClick ? (e) => { e.currentTarget.style.backgroundColor = 'var(--muted)'; } : undefined}
      onMouseLeave={onClick ? (e) => { e.currentTarget.style.backgroundColor = ''; } : undefined}
    >
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold ${className}`} style={{ color: 'var(--foreground)' }}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={className}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`pt-4 mt-4 ${className}`} style={{ borderTop: '1px solid var(--border)' }}>
      {children}
    </div>
  );
}
