import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import Image from 'next/image'
import { placeholderImages } from '@/lib/placeholder-images'

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
})

export const metadata: Metadata = {
  title: 'COEES - Sistema Integral de Gestión Técnica',
  description: 'Portal de Computación Electrónica en la Educación Secundaria - Edoméx',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const bgImage = placeholderImages.find(img => img.id === 'education-bg') || placeholderImages[0]

  return (
    <html lang="es">
      <body className={`${montserrat.variable} font-sans relative min-h-screen overflow-x-hidden bg-background`}>
        {/* Background Image Layer */}
        <div className="fixed inset-0 z-[-2] pointer-events-none opacity-[0.03] scale-110">
          <Image 
            src={bgImage.imageUrl} 
            alt="Education Background" 
            fill 
            className="object-cover grayscale"
            priority
            data-ai-hint="secondary school"
          />
        </div>
        
        {/* Subtle Background Base */}
        <div className="fixed inset-0 z-[-1] pointer-events-none bg-background opacity-95" />
        
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  )
}
