'use client'
import { HelpDeskInterface } from '@/components/HelpDeskInterface'
import Image from 'next/image'
import { placeholderImages } from '@/lib/placeholder-images'
import { ShieldCheck } from 'lucide-react'

export default function ExternalHelpDeskPage() {
  const logoData = placeholderImages.find(img => img.id === 'desysa-logo') || placeholderImages[0]

  return (
    <div className="min-h-screen bg-[#ddc8a4] p-4 md:p-8 flex flex-col gap-6">
      {/* Header Institucional Público */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-6xl mx-auto w-full bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl border border-white/50">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-2xl overflow-hidden shadow-lg border-2 border-white bg-white">
            <Image 
              src={logoData.imageUrl} 
              alt="COEES Logo" 
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#9f2241] uppercase leading-none">Mesa de Ayuda ATRES</h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Servicios de Apoyo a la Educación Secundaria</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-primary/5 px-6 py-2.5 rounded-full border border-primary/10">
           <ShieldCheck className="h-5 w-5 text-primary" />
           <span className="text-[10px] font-black text-primary uppercase tracking-widest">Portal de Asistencia Oficial • Edoméx 2026</span>
        </div>
      </header>

      {/* Contenedor Principal del Chat */}
      <main className="flex-1 max-w-6xl mx-auto w-full overflow-hidden flex flex-col">
        <HelpDeskInterface isPublic />
      </main>

      {/* Footer */}
      <footer className="text-center pb-4">
        <p className="text-[9px] font-black text-[#9f2241]/40 uppercase tracking-[0.4em]">
          DIRECCIÓN DE EDUCACIÓN SECUNDARIA • DEPARTAMENTO DE TECNOLOGÍA EDUCATIVA
        </p>
      </footer>
    </div>
  )
}
