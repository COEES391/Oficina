'use client'
import { HelpDeskInterface } from '@/components/HelpDeskInterface'
import Image from 'next/image'
import { placeholderImages } from '@/lib/placeholder-images'
import { ShieldCheck, HelpCircle, Activity, LayoutGrid } from 'lucide-react'

export default function ExternalHelpDeskPage() {
  const logoData = placeholderImages.find(img => img.id === 'desysa-logo') || placeholderImages[0]

  return (
    <div className="h-screen w-full bg-[#ddc8a4] flex flex-col p-3 md:p-4 font-sans overflow-hidden relative">
      {/* Fondo Decorativo Estático */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#9f2241] rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#B38E5D] rounded-full blur-[150px]" />
      </div>

      {/* Header Institucional Compacto */}
      <header className="flex flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full bg-white/95 backdrop-blur-2xl px-6 py-3 rounded-full shadow-[0_20px_60px_rgba(98,17,50,0.15)] border border-white/50 relative z-30 shrink-0 mb-3 transition-all hover:shadow-[0_30px_80px_rgba(98,17,50,0.2)]">
        <div className="flex items-center gap-4">
          <div className="relative h-10 w-10 md:h-12 md:w-12 rounded-xl overflow-hidden shadow-xl border-2 border-white bg-white group">
            <Image 
              src={logoData.imageUrl} 
              alt="COEES Logo" 
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
            />
          </div>
          <div className="space-y-0">
            <h1 className="text-base md:text-lg font-black text-[#9f2241] uppercase leading-none tracking-tighter">Mesa de Ayuda ATRES</h1>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Departamento de Tecnología Educativa • Edoméx</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 shadow-inner">
             <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
             <span className="text-[9px] font-black text-primary uppercase tracking-widest">Atención Segura</span>
          </div>
          <div className="flex items-center gap-2.5 bg-[#9f2241] text-white px-5 py-1.5 rounded-full shadow-lg">
             <Activity className="h-3 w-3 animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-widest">Ciclo 2025-2026</span>
          </div>
        </div>
      </header>

      {/* Contenedor Principal Adaptado */}
      <main className="flex-1 max-w-7xl mx-auto w-full overflow-hidden flex flex-col relative z-20 animate-in fade-in zoom-in-95 duration-700">
        <HelpDeskInterface isPublic />
      </main>

      {/* Footer Minimalista */}
      <footer className="text-center pt-2 pb-1 relative z-30 shrink-0">
        <p className="text-[7px] font-black text-[#9f2241]/60 uppercase tracking-[0.4em] opacity-80">
          DIRECCIÓN DE EDUCACIÓN SECUNDARIA • DEPARTAMENTO DE TECNOLOGÍA EDUCATIVA
        </p>
      </footer>
    </div>
  )
}
