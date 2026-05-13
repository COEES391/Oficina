
'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { 
  LayoutDashboard, 
  LifeBuoy, 
  GraduationCap, 
  Briefcase, 
  LogOut, 
  User 
} from 'lucide-react'
import Image from 'next/image'
import { placeholderImages } from '@/lib/placeholder-images'
import { Button } from '@/components/ui/button'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [userRfc, setUserRfc] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const logoData = placeholderImages.find(img => img.id === 'desysa-logo') || placeholderImages[0]

  useEffect(() => {
    setMounted(true)
    const rfc = localStorage.getItem('userRfc')
    if (!rfc) {
      router.push('/')
    } else {
      setUserRfc(rfc)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('userRfc')
    router.push('/')
  }

  const menuItems = [
    { name: 'Panel Ejecutivo', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: 'Soporte Técnico', path: '/dashboard/soporte', icon: <LifeBuoy className="h-5 w-5" /> },
    { name: 'Capacitación', path: '/dashboard/capacitacion', icon: <GraduationCap className="h-5 w-5" /> },
    { name: 'Programas', path: '/dashboard/programas', icon: <Briefcase className="h-5 w-5" /> },
  ]

  if (!mounted) return null

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-primary/10 bg-white/95 backdrop-blur-xl">
        <SidebarHeader className="pt-8 pb-6">
          <div className="flex flex-col items-center gap-4 px-4">
            <div className="relative h-28 w-28 bg-white rounded-[2.5rem] p-1 shadow-2xl border-4 border-primary/5 group overflow-hidden">
              <Image 
                src={logoData.imageUrl} 
                alt="COEES Tech" 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                data-ai-hint="tech education"
              />
              <div className="absolute inset-0 bg-primary/10 mix-blend-multiply opacity-20" />
            </div>
            <div className="text-center">
              <span className="text-2xl font-black text-primary uppercase tracking-tighter">COEES</span>
              <p className="text-[8px] text-muted-foreground uppercase font-black tracking-[0.3em] mt-1.5 opacity-60">Edoméx 2026</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-4 py-2">
          <SidebarMenu className="gap-3">
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton 
                  onClick={() => router.push(item.path)}
                  isActive={pathname === item.path}
                  className={`h-12 rounded-2xl font-black uppercase text-[9px] tracking-widest px-5 transition-all duration-500 ${
                    pathname === item.path 
                      ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' 
                      : 'text-slate-500 hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="bg-transparent">
        <header className="flex h-20 items-center justify-between border-b border-slate-100 px-10 bg-white/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-6">
            <SidebarTrigger className="lg:hidden text-primary" />
            <div className="flex flex-col">
              <h1 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] leading-none">
                Computación Electrónica
              </h1>
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.15em] mt-1.5 opacity-50">Educación Secundaria • Edoméx</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 bg-slate-50/80 px-5 py-2.5 rounded-2xl border border-slate-100">
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-primary leading-none">{userRfc}</span>
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">Usuario Activo</span>
              </div>
            </div>

            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="group h-10 px-6 rounded-xl text-rose-600 font-black uppercase text-[9px] tracking-widest hover:bg-rose-50 border border-rose-100 transition-all flex items-center gap-2"
            >
              <LogOut className="h-3.5 w-3.5" /> 
              Salir
            </Button>
          </div>
        </header>
        <main className="flex-1">
          <div className="p-8 md:p-12 max-w-[1600px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
