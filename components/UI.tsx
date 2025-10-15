import React, { ReactNode } from 'react';
import { XIcon } from './Icons';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';
  const variantClasses = {
    primary: 'bg-accent hover:bg-sky-400 text-primary',
    secondary: 'bg-secondary hover:bg-slate-600 text-light',
    danger: 'bg-red-600 hover:bg-red-700 text-light',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-secondary p-6 rounded-lg shadow-lg ${className}`} {...props}>
      {children}
    </div>
  );
};


interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({label, ...props}, ref) => {
    const id = React.useId();
    return (
        <div>
            {label && <label htmlFor={id} className="block text-sm font-medium text-dark-text mb-1">{label}</label>}
            <input id={id} {...props} ref={ref} className={`w-full bg-primary border border-slate-600 rounded-md px-3 py-2 text-light placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent ${props.className}`} />
        </div>
    )
});
Input.displayName = 'Input';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
      <div className="bg-secondary rounded-lg shadow-xl p-6 w-full max-w-md mx-4 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-light">{title}</h2>
          <button onClick={onClose} className="text-dark-text hover:text-light">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};