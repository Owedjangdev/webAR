import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

const ToastContext = createContext(null)
const AUTO_DISMISS_MS = 3500
let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (type, message) => {
      const id = (nextId += 1)
      setToasts((current) => [...current, { id, type, message }])
      setTimeout(() => remove(id), AUTO_DISMISS_MS)
    },
    [remove],
  )

  const value = {
    success: (message) => push('success', message),
    error: (message) => push('error', message),
    info: (message) => push('info', message),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast doit être utilisé dans un <ToastProvider>.')
  }
  return context
}

const STYLES = {
  success: { icon: CheckCircle2, border: 'border-emerald-200', iconClass: 'text-emerald-500' },
  error: { icon: TriangleAlert, border: 'border-red-200', iconClass: 'text-red-500' },
  info: { icon: Info, border: 'border-brand-200', iconClass: 'text-brand-500' },
}

function ToastViewport({ toasts, onClose }) {
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2">
      {toasts.map(({ id, type, message }) => {
        const { icon: Icon, border, iconClass } = STYLES[type] ?? STYLES.info
        return (
          <div
            key={id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border bg-white px-4 py-3.5 text-sm font-medium text-slate-700 shadow-lg ${border} motion-safe:animate-rise-in`}
          >
            <Icon className={`h-5 w-5 shrink-0 ${iconClass}`} />
            <span className="flex-1">{message}</span>
            <button
              type="button"
              onClick={() => onClose(id)}
              aria-label="Fermer"
              className="shrink-0 cursor-pointer text-slate-300 transition-colors hover:text-slate-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
