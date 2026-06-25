'use client'
import { HelpDeskInterface } from '@/components/HelpDeskInterface'
import Image from 'next/image'
import { placeholderImages } from '@/lib/placeholder-images'
import { ShieldCheck, Activity } from 'lucide-react'

export default function ExternalHelpDeskPage() {
  const logoData = placeholderImages.find(img => img.id === 'desysa-logo') || placeholderImages[0]

  return (
    <div className="h-screen w-full bg-[#ddc8a4] flex flex-col p-2 md:p-3 font-sans overflow-hidden relative">
      {/* Fondo Decorativo Estático */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#9f2241] rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#B38E5D] rounded-full blur-[150px]" />
      </div>

      {/* Header Institucional Compacto */}
      <header className="flex flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full bg-white/95 backdrop-blur-2xl px-6 py-2 rounded-full shadow-xl border border-white/50 relative z-30 shrink-0 mb-2 transition-all">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 md:h-10 md:w-10 rounded-lg overflow-hidden shadow-md border border-slate-100 bg-white group">
            <Image 
              src={logoData.imageUrl} 
              alt="COEES Logo" 
              fill
              className="object-cover"
            />
          </div>
          <div className="space-y-0">
            <h1 className="text-sm md:text-base font-black text-[#9f2241] uppercase leading-none tracking-tighter">Mesa de Ayuda ATRES</h1>
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-0.5">Departamento de Tecnología Educativa • Edoméx</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
             <ShieldCheck className="h-3 w-3 text-emerald-600" />
             <span className="text-[8px] font-black text-primary uppercase tracking-widest">Atención Segura</span>
          </div>
          <div className="flex items-center gap-2 bg-[#9f2241] text-white px-4 py-1 rounded-full shadow-lg">
             <Activity className="h-2.5 w-2.5 animate-pulse" />
             <span className="text-[8px] font-black uppercase tracking-widest">Ciclo 2025-2026</span>
          </div>
        </div>
      </header>

      {/* Contenedor Principal Adaptado */}
      <main className="flex-1 max-w-7xl mx-auto w-full overflow-hidden flex flex-col relative z-20 animate-in fade-in duration-700">
        <HelpDeskInterface isPublic />
      </main>

      {/* Footer Minimalista */}
      <footer className="text-center py-1 relative z-30 shrink-0">
        <p className="text-[6px] font-black text-[#9f2241]/60 uppercase tracking-[0.3em] opacity-70">
          DIRECCIÓN DE EDUCACIÓN SECUNDARIA • DEPARTAMENTO DE TECNOLOGÍA EDUCATIVA
        </p>
      </footer>
    </div>
  )
}
