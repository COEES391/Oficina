'use client'
import { HelpDeskInterface } from '@/components/HelpDeskInterface'
import Image from 'next/image'
import { placeholderImages } from '@/lib/placeholder-images'
import { ShieldCheck, HelpCircle, Activity } from 'lucide-react'

export default function ExternalHelpDeskPage() {
  const logoData = placeholderImages.find(img => img.id === 'desysa-logo') || placeholderImages[0]

  return (
    <div className="h-screen w-full bg-[#ddc8a4] flex flex-col p-4 md:p-6 lg:p-8 font-sans overflow-hidden relative">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent rounded-full blur-[150px]" />
      </div>

      {/* Header Institucional Público - Más compacto */}
      <header className="flex flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full bg-white/90 backdrop-blur-2xl px-6 py-4 rounded-[2.5rem] shadow-[0_30px_100px_rgba(98,17,50,0.12)] border border-white/50 relative z-10 shrink-0 mb-4 transition-all hover:shadow-[0_40px_120px_rgba(98,17,50,0.18)]">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 md:h-14 md:w-14 rounded-2xl overflow-hidden shadow-2xl border-2 border-white bg-white group">
            <Image 
              src={logoData.imageUrl} 
              alt="COEES Logo" 
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
            />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-lg md:text-xl font-black text-[#9f2241] uppercase leading-none tracking-tighter">Mesa de Ayuda ATRES</h1>
            <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Departamento de Tecnología Educativa • Edoméx</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full border border-primary/5 shadow-inner">
             <ShieldCheck className="h-4 w-4 text-emerald-600" />
             <span className="text-[10px] font-black text-primary uppercase tracking-widest">Soporte Seguro</span>
          </div>
          <div className="flex items-center gap-2.5 bg-primary text-white px-5 py-2 rounded-full shadow-lg shadow-primary/20">
             <Activity className="h-3.5 w-3.5 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest">Edoméx 2026</span>
          </div>
        </div>
      </header>

      {/* Contenedor Principal - Ocupa todo el espacio restante */}
      <main className="flex-1 max-w-7xl mx-auto w-full overflow-hidden flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <HelpDeskInterface isPublic />
      </main>

      {/* Footer Minimalista - Pegado al borde */}
      <footer className="text-center pt-4 pb-0 relative z-10 shrink-0">
        <p className="text-[8px] font-black text-[#9f2241]/40 uppercase tracking-[0.5em] opacity-80">
          DIRECCIÓN DE EDUCACIÓN SECUNDARIA • SERVICIOS DE APOYO TÉCNICO
        </p>
      </footer>
    </div>
  )
}
