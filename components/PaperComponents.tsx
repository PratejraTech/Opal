import React, { ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

// --- Card ---
interface PaperCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const PaperCard: React.FC<PaperCardProps> = ({ children, className = '', title, action }) => (
  <div className={`bg-white border-2 border-ink shadow-hard rounded-none p-0 relative flex flex-col ${className}`}>
    {title && (
      <div className="border-b-2 border-ink px-6 py-4 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-sans font-bold text-lg tracking-tight text-ink flex items-center gap-2">
          {title}
        </h3>
        {action}
      </div>
    )}
    <div className="p-6 flex-1">
      {children}
    </div>
  </div>
);

// --- Button ---
interface PaperButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const PaperButton: React.FC<PaperButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  icon,
  size = 'md',
  ...props 
}) => {
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-3 text-base"
  };

  const baseStyles = "inline-flex items-center justify-center gap-2 font-bold uppercase tracking-wider transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-[2px] active:shadow-none";
  
  const variants = {
    primary: "bg-ink text-white border-2 border-ink shadow-hard hover:bg-accent hover:border-ink hover:text-ink",
    secondary: "bg-white text-ink border-2 border-ink shadow-hard hover:bg-gray-50",
    ghost: "bg-transparent text-ink hover:bg-gray-100 border-2 border-transparent",
    danger: "bg-red-50 text-red-600 border-2 border-red-600 shadow-hard hover:bg-red-600 hover:text-white"
  };

  return (
    <button className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
};

// --- Input ---
interface PaperInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const PaperInput: React.FC<PaperInputProps> = ({ label, error, className = '', ...props }) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</label>}
    <input 
      className={`w-full bg-white border-2 border-ink px-4 py-3 font-mono text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:border-accent focus:shadow-[4px_4px_0px_0px_#10b981] transition-all ${error ? 'border-red-500' : ''} ${className}`}
      {...props} 
    />
    {error && <span className="text-xs text-red-500 font-bold">{error}</span>}
  </div>
);

// --- Badge ---
export const PaperBadge: React.FC<{ children: React.ReactNode; color?: 'blue' | 'green' | 'red' | 'ink' }> = ({ children, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-700',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-700',
    red: 'bg-red-50 text-red-700 border-red-700',
    ink: 'bg-gray-100 text-ink border-ink'
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${colors[color]} shadow-sm`}>
      {children}
    </span>
  );
};