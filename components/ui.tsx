import React, { useEffect, useRef, useState } from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' }> = ({ 
  children, variant = 'primary', className = '', ...props 
}) => {
  const baseStyle = "px-4 py-2 rounded-xl font-medium transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 shadow-sm";
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-emerald-500/30 hover:shadow-lg border border-transparent",
    secondary: "bg-slate-800 text-white hover:bg-slate-700 hover:shadow-slate-500/30 hover:shadow-lg border border-transparent",
    outline: "bg-white border-2 border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50",
    danger: "bg-rose-500 text-white hover:bg-rose-600 hover:shadow-rose-500/30 hover:shadow-lg border border-transparent",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 border-transparent shadow-none"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; hoverEffect?: boolean }> = ({ children, className = '', hoverEffect = false }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${hoverEffect ? 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1' : ''} ${className}`}>
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; color?: string; className?: string }> = ({ children, color = 'bg-slate-100 text-slate-800', className = '' }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${color} ${className}`}>
    {children}
  </span>
);

export const LoadingSpinner = ({ size = 'sm', color = 'current' }: { size?: 'sm' | 'md' | 'lg', color?: string }) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className={`animate-spin rounded-full border-2 border-b-transparent ${sizes[size]} ${color === 'current' ? 'border-current' : `border-${color}-500`}`}></div>
  );
};

export const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = '' }) => (
  <div className={`animate-slide-up ${className}`} style={{ animationDelay: `${delay}ms`, opacity: 0, animationFillMode: 'forwards' }}>
    {children}
  </div>
);

export const ScrollReveal: React.FC<{ children: React.ReactNode; className?: string; direction?: 'up' | 'left' | 'right'; delay?: number }> = ({ children, className = '', direction = 'up', delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const getTransform = () => {
    switch (direction) {
      case 'up': return 'translate-y-12';
      case 'left': return '-translate-x-12';
      case 'right': return 'translate-x-12';
      default: return 'translate-y-12';
    }
  };

  return (
    <div 
      ref={ref} 
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) ${isVisible ? 'opacity-100 translate-y-0 translate-x-0' : `opacity-0 ${getTransform()}`} ${className}`}
    >
      {children}
    </div>
  );
};