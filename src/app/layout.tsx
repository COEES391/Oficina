
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import Image from 'next/image'
import { placeholderImages } from '@/lib/placeholder-images'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SIP - Sistema Integral de Planeación',
  description: 'Portal de Gestión de Educación Secundaria - Edoméx',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const bgImage = placeholderImages.find(img => img.id === 'education-bg') || placeholderImages[0]

  return (
    <html lang="es">
      <body className={`${inter.className} relative min-h-screen overflow-x-hidden`}>
        {/* Background Image Layer */}
        <div className="fixed inset-0 z-[-1] pointer-events-none opacity-[0.04] scale-110">
          <Image 
            src={bgImage.imageUrl} 
            alt="Education Background" 
            fill 
            className="object-cover grayscale brightness-50"
            priority
            data-ai-hint="secondary school"
          />
        </div>
        
        {/* Subtle Gradient Overlay */}
        <div className="fixed inset-0 z-[-1] pointer-events-none bg-gradient-to-br from-white via-transparent to-slate-100" />
        
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  )
}
