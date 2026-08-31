import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    let variantClass = 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800';
    if (variant === 'outline') variantClass = 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700';
    if (variant === 'ghost') variantClass = 'hover:bg-slate-100 text-slate-700';
    if (variant === 'secondary') variantClass = 'bg-slate-100 text-slate-900 hover:bg-slate-200';
    if (variant === 'destructive') variantClass = 'bg-rose-600 text-white hover:bg-rose-700';

    let sizeClass = 'h-9 px-4 py-2 text-xs font-semibold rounded-xl';
    if (size === 'sm') sizeClass = 'h-8 px-3 text-xs rounded-lg';
    if (size === 'lg') sizeClass = 'h-10 px-6 rounded-xl';
    if (size === 'icon') sizeClass = 'h-9 w-9 p-0 flex items-center justify-center rounded-xl';

    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          variantClass,
          sizeClass,
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
