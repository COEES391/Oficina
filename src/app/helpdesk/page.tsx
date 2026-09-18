
'use client'
import { HelpDeskInterface } from '@/components/HelpDeskInterface'
import Image from 'next/image'
import { placeholderImages } from '@/lib/placeholder-images'
import { ShieldCheck, Activity } from 'lucide-react'

export default function ExternalHelpDeskPage() {
  const logoData = placeholderImages.find(img => img.id === 'desysa-logo') || placeholderImages[0]

  return (
    <div className="h-screen w-full bg-[#f0f2f5] flex flex-col font-sans overflow-hidden relative">
      {/* Header Institucional */}
      <header className="h-16 bg-[#0b4135] flex items-center justify-between px-6 shrink-0 z-30 shadow-xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="relative h-10 w-10 bg-white/10 rounded-xl overflow-hidden shadow-inner border border-white/10 flex items-center justify-center">
             <Image src={logoData.imageUrl} alt="Logo" fill className="object-cover opacity-80" />
          </div>
          <div className="space-y-0">
            <h1 className="text-sm font-black text-white uppercase leading-none tracking-tighter">Mesa de Ayuda ATRES</h1>
            <p className="text-[7px] font-bold text-white/40 uppercase tracking-[0.1em] mt-1">Edoméx 2026 • Soporte Técnico</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6">
          <div className="flex items-center gap-2">
             <ShieldCheck className="h-4 w-4 text-emerald-400" />
             <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">Canal Oficial Seguro</span>
          </div>
          <div className="bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
             <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Técnicos en Línea</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Interface */}
      <main className="flex-1 overflow-hidden">
        <HelpDeskInterface isPublic />
      </main>

      {/* Minimalist Footer */}
      <footer className="bg-white border-t py-1 text-center shrink-0 z-30">
        <p className="text-[6px] font-black text-primary/40 uppercase tracking-[0.4em]">
          Dirección de Educación Secundaria • Departamento de Tecnología Educativa
        </p>
      </footer>
    </div>
  )
}
