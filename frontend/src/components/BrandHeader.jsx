import { MapPin } from 'lucide-react'

/**
 * En-tête de marque : carré bleu avec pin + nom de l'application.
 */
export default function BrandHeader() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/30">
        <MapPin className="h-7 w-7 text-white" />
      </div>
      <span className="text-lg font-bold text-brand-600">VisitAR Benin</span>
    </div>
  )
}
