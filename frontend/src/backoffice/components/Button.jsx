import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary:
    'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-600/20 hover:shadow-lg hover:shadow-brand-500/30 hover:brightness-110 focus-visible:ring-brand-500',
  outline:
    'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-brand-500',
  ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-slate-300',
  danger:
    'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 hover:brightness-110 focus-visible:ring-red-400',
}

export default function Button({
  variant = 'primary',
  icon: Icon,
  loading = false,
  children,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={loading || props.disabled}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none transition-all duration-200 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  )
}
