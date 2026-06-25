'use client'
import { HelpDeskInterface } from '@/components/HelpDeskInterface'
import Image from 'next/image'
import { placeholderImages } from '@/lib/placeholder-images'
import { ShieldCheck, HelpCircle } from 'lucide-react'

export default function ExternalHelpDeskPage() {
  const logoData = placeholderImages.find(img => img.id === 'desysa-logo') || placeholderImages[0]

  return (
    <div className="min-h-screen bg-[#ddc8a4] p-4 md:p-6 lg:p-10 flex flex-col gap-6 font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-accent rounded-full blur-[100px]" />
      </div>

      {/* Header Institucional Público */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-7xl mx-auto w-full bg-white/80 backdrop-blur-2xl p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/50 relative z-10">
        <div className="flex items-center gap-5">
          <div className="relative h-14 w-14 md:h-20 md:w-20 rounded-[1.5rem] overflow-hidden shadow-2xl border-4 border-white bg-white group">
            <Image 
              src={logoData.imageUrl} 
              alt="COEES Logo" 
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-black text-[#9f2241] uppercase leading-none tracking-tighter">Mesa de Ayuda ATRES</h1>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Departamento de Tecnología Educativa</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="hidden sm:flex items-center gap-3 bg-white/50 px-5 py-2.5 rounded-full border border-primary/10 shadow-inner">
             <ShieldCheck className="h-5 w-5 text-emerald-600" />
             <span className="text-[10px] font-black text-primary uppercase tracking-widest">Portal de Asistencia Seguro</span>
          </div>
          <div className="flex items-center gap-3 bg-primary text-white px-5 py-2.5 rounded-full shadow-lg shadow-primary/20">
             <HelpCircle className="h-4 w-4" />
             <span className="text-[10px] font-black uppercase tracking-widest">Soporte 2026</span>
          </div>
        </div>
      </header>

      {/* Contenedor Principal del Chat */}
      <main className="flex-1 max-w-7xl mx-auto w-full overflow-hidden flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <HelpDeskInterface isPublic />
      </main>

      {/* Footer */}
      <footer className="text-center pb-2 relative z-10">
        <p className="text-[8px] md:text-[10px] font-black text-[#9f2241]/30 uppercase tracking-[0.5em]">
          DIRECCIÓN DE EDUCACIÓN SECUNDARIA • Edoméx 2023-2029
        </p>
      </footer>
    </div>
  )
}
