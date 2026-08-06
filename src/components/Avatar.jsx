import { User } from 'lucide-react';

const sizeStyles = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
};

const iconStyles = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
};

export default function Avatar({ size = 'md' }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm ring-2 ring-white ${sizeStyles[size]}`}
    >
      <User className={iconStyles[size]} />
    </span>
  );
}
