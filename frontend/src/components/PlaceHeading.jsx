import { Navigation } from 'lucide-react'

/**
 * Titre du lieu : nom (navy, gras) + ville avec icône de navigation.
 */
export default function PlaceHeading({ place }) {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-slate-800">{place.name}</h1>
      <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-slate-500">
        <Navigation className="h-4 w-4" />
        {place.city}
      </p>
    </div>
  )
}
