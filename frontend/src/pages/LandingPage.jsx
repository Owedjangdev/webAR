import { Link } from 'react-router-dom'
import {
  Award,
  BookOpen,
  Box,
  Camera,
  Compass,
  DoorOpen,
  Image as ImageIcon,
  LogIn,
  MapPin,
  ScanLine,
  Share2,
  Sparkles,
  Users,
  Wand2,
} from 'lucide-react'

// Les 7 expériences AR (vitrine). Icône + libellé + accroche courte.
const EXPERIENCES = [
  { icon: Camera, name: 'Selfie Souvenir', desc: 'Un selfie avec l’habillage du lieu.' },
  { icon: Award, name: 'Badge de lieu', desc: 'Débloquez un badge à collectionner.' },
  { icon: Box, name: 'Objet 3D', desc: 'Faites tourner un objet en relief.' },
  { icon: Compass, name: 'Chasse au trésor', desc: 'Un parcours d’indices d’étape en étape.' },
  { icon: BookOpen, name: 'Guide narratif', desc: 'Un personnage raconte l’histoire.' },
  { icon: Users, name: 'Capsule collective', desc: 'La photo de groupe avec un cadre commun.' },
  { icon: DoorOpen, name: 'Portail AR', desc: 'Une porte vers une autre scène.' },
]

const STEPS = [
  {
    icon: ScanLine,
    title: 'Scannez le QR code',
    desc: 'Sur place, avec l’appareil photo de votre téléphone. Aucune application à installer.',
  },
  {
    icon: Sparkles,
    title: 'Vivez l’expérience',
    desc: 'La caméra s’active et la réalité augmentée prend vie devant vous, dans le décor réel.',
  },
  {
    icon: Share2,
    title: 'Repartez avec un souvenir',
    desc: 'Capturez une photo et partagez-la d’un geste sur WhatsApp ou téléchargez-la.',
  },
]

/**
 * Page d'accueil publique (route `/`). Présente le projet et donne l'accès
 * connexion (admin / partenaire). Évite que la racine tombe sur la page d'erreur
 * « Expérience introuvable ». 100 % statique (aucun appel API).
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-body text-slate-800">
      <Nav />
      <Hero />
      <HowItWorks />
      <Experiences />
      <PartnerCta />
      <Footer />
    </div>
  )
}

/** Logo provisoire (à remplacer par le vrai) : pastille indigo + mot-symbole. */
function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-lg shadow-brand-600/25">
        <ScanLine className="h-5 w-5" />
      </span>
      <span className="font-display text-lg font-extrabold tracking-tight text-slate-900">
        VisitAR <span className="text-brand-600">Benin</span>
      </span>
    </span>
  )
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-900/5 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
          <a
            href="#comment"
            className="rounded-md outline-none transition-colors hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
          >
            Comment ça marche ?
          </a>
          <a
            href="#experiences"
            className="rounded-md outline-none transition-colors hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
          >
            Expériences
          </a>
        </nav>
        <Link
          to="/login"
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white outline-none transition hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          <LogIn className="h-4 w-4" />
          Connexion
        </Link>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Reflet lumineux premium : halo neutre très subtil en haut (effet « sheen »
          sur le blanc, sans couleur). GPU-friendly. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem]"
        style={{
          background: 'radial-gradient(55% 60% at 50% 0%, rgba(226,232,240,0.6), transparent 72%)',
        }}
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-24">
        {/* Colonne texte */}
        <div className="motion-safe:animate-rise-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">
            <Wand2 className="h-3.5 w-3.5" />
            Réalité augmentée · sans installation
          </span>

          <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl">
            Scannez.<br />
            Vivez.<br />
            <span className="text-brand-600">Partagez.</span>
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-slate-600">
            VisitAR Benin transforme chaque lieu du patrimoine béninois en une expérience de réalité
            augmentée. Un simple <strong className="font-semibold text-slate-800">QR code</strong>{' '}
            suffit — directement dans le navigateur.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#comment"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-semibold text-white shadow-lg shadow-brand-600/30 outline-none transition hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Comment ça marche
              <Sparkles className="h-4 w-4" />
            </a>
            <Link
              to="/login"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-900 outline-none transition hover:border-slate-400 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              Espace partenaire
            </Link>
          </div>

          <p className="mt-6 flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4 text-brand-500" />
            Conçu pour le patrimoine, le tourisme et la culture au Bénin.
          </p>
        </div>

        {/* Colonne visuelle : maquette téléphone (fictive, 100 % CSS). */}
        <div className="flex justify-center md:justify-end">
          <PhoneMockup />
        </div>
      </div>
    </section>
  )
}

/** Maquette de téléphone en CSS montrant une scène AR + cadre de scan + QR. */
function PhoneMockup() {
  return (
    <div className="relative motion-safe:animate-float">
      {/* Téléphone */}
      <div className="relative h-[30rem] w-60 rounded-[2.75rem] bg-slate-900 p-3 shadow-2xl ring-1 ring-black/10">
        {/* Encoche */}
        <span className="absolute left-1/2 top-3 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-white/25" />
        {/* Écran : scène AR */}
        <div className="relative h-full w-full overflow-hidden rounded-[2.1rem] bg-gradient-to-b from-brand-400 via-brand-600 to-brand-900">
          {/* Élément AR « flottant » (médaillon + halo). */}
          <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2">
            <span className="absolute -inset-5 rounded-full bg-white/40 blur-xl" aria-hidden="true" />
            <span className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white shadow-xl backdrop-blur-sm">
              <Sparkles className="h-10 w-10" strokeWidth={1.5} />
            </span>
          </div>

          {/* Coins de visée (scan). */}
          <ScanCorners />

          {/* Puce d'identité du lieu (bas). */}
          <div className="absolute inset-x-3 bottom-3">
            <div className="flex items-center gap-2 rounded-2xl bg-black/35 px-3 py-2 text-white backdrop-blur">
              <MapPin className="h-4 w-4 shrink-0 text-white/80" />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold leading-tight">Palais Royal d’Abomey</p>
                <p className="truncate text-[10px] text-white/70">Souvenir en réalité augmentée</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badge QR flottant à côté du téléphone. */}
      <div className="absolute -bottom-5 -left-6 rotate-[-8deg] rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl">
        <QrGlyph />
        <p className="mt-1 text-center text-[10px] font-bold tracking-wide text-slate-600">SCANNEZ-MOI</p>
      </div>
    </div>
  )
}

/** Quatre coins d'un cadre de visée façon scanner. */
function ScanCorners() {
  const base = 'absolute h-7 w-7 border-white/80'
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-6">
      <span className={`${base} left-0 top-0 rounded-tl-lg border-l-[3px] border-t-[3px]`} />
      <span className={`${base} right-0 top-0 rounded-tr-lg border-r-[3px] border-t-[3px]`} />
      <span className={`${base} bottom-0 left-0 rounded-bl-lg border-b-[3px] border-l-[3px]`} />
      <span className={`${base} bottom-0 right-0 rounded-br-lg border-b-[3px] border-r-[3px]`} />
    </div>
  )
}

/** Petit QR stylisé (purement décoratif, dessiné en grille). */
function QrGlyph() {
  // Motif fixe lisible comme un QR (décoratif, non scannable).
  const cells = [
    1, 1, 1, 0, 1, 0, 1,
    1, 0, 1, 0, 0, 1, 1,
    1, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0,
    1, 0, 1, 1, 0, 0, 1,
    1, 1, 0, 0, 1, 1, 0,
    1, 0, 1, 0, 1, 0, 1,
  ]
  return (
    <div className="grid h-14 w-14 grid-cols-7 gap-px rounded-md bg-white p-1">
      {cells.map((on, i) => (
        <span key={i} className={on ? 'rounded-[1px] bg-slate-900' : 'bg-transparent'} />
      ))}
    </div>
  )
}

function HowItWorks() {
  return (
    <section id="comment" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16 md:py-24">
      <SectionHeading
        eyebrow="En 3 étapes"
        title="Du QR code au souvenir"
        subtitle="Une boucle simple, pensée pour fonctionner sur tout téléphone Android, sans rien installer."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="relative rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <span className="font-display text-5xl font-extrabold text-slate-100">{i + 1}</span>
            <span className="absolute right-7 top-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <step.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-display text-xl font-bold text-slate-900">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Experiences() {
  return (
    <section id="experiences" className="scroll-mt-20 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="7 façons d’émerveiller"
          title="Une expérience pour chaque lieu"
          subtitle="Chaque QR code peut déclencher l’un de ces sept formats de réalité augmentée."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXPERIENCES.map((exp) => (
            <div
              key={exp.name}
              className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-md"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-md shadow-brand-600/20 transition group-hover:scale-105">
                <exp.icon className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">{exp.name}</h3>
                <p className="mt-1 text-sm leading-snug text-slate-600">{exp.desc}</p>
              </div>
            </div>
          ))}
          {/* Carte « capture » qui clôt la grille. */}
          <div className="flex items-center gap-4 rounded-2xl border border-dashed border-brand-300 bg-brand-50/60 p-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
              <ImageIcon className="h-6 w-6" />
            </span>
            <p className="text-sm font-medium text-brand-800">
              … et toujours un <strong>souvenir</strong> à capturer et partager.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function PartnerCta() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-8 py-12 text-center shadow-xl md:px-16 md:py-16">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/20 blur-2xl"
        />
        <h2 className="relative font-display text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          Un lieu à faire vivre autrement ?
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-brand-100">
          Restaurants, musées, monuments, événements… Donnez à vos visiteurs un souvenir augmenté et
          partageable. Gérez vos expériences depuis votre espace partenaire.
        </p>
        <Link
          to="/login"
          className="relative mt-8 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-7 py-3 font-semibold text-brand-700 shadow-lg outline-none transition hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-white"
        >
          <LogIn className="h-4 w-4" />
          Accéder à mon espace
        </Link>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-slate-900/5 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
        <Logo />
        <p className="text-sm text-slate-600">© 2025 VisitAR Benin · Réalité augmentée par QR code</p>
      </div>
    </footer>
  )
}

/** Titre de section réutilisable (eyebrow + titre + sous-titre), centré. */
function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-sm font-bold uppercase tracking-widest text-brand-600">{eyebrow}</span>
      <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-slate-600">{subtitle}</p>
    </div>
  )
}
