import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-black/10"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 outline-none transition-colors hover:bg-slate-200/60 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Corps scrollable : garde l'en-tête figé et les actions toujours
            atteignables même sur un formulaire long (ex. object_ar). */}
        <div className="min-h-0 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}
