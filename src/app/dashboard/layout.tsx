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
  SidebarFooter,
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
  PanelLeft, 
  User, 
  ShieldCheck,
  Star
} from 'lucide-react'
import Image from 'next/image'
import { placeholderImages } from '@/lib/placeholder-images'

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
      <Sidebar className="border-r-2 border-primary/5 bg-white/90 backdrop-blur-xl">
        <SidebarHeader className="border-b-2 border-primary/5 pb-6 mb-4">
          <div className="flex items-center gap-4 px-4 py-6">
            <div className="relative h-14 w-14 flex-shrink-0 bg-white rounded-2xl p-1.5 shadow-[0_8px_16px_rgba(0,0,0,0.08)] border border-primary/5">
              <Image 
                src={logoData.imageUrl} 
                alt="DESySA" 
                fill 
                className="object-contain"
                data-ai-hint="education logo"
              />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[14px] font-black leading-tight text-primary truncate uppercase tracking-tighter">COEES</span>
              <span className="text-[9px] text-muted-foreground truncate uppercase font-black tracking-widest mt-1 opacity-70">Estado de México</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-4">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.path} className="mb-2">
                <SidebarMenuButton 
                  onClick={() => router.push(item.path)}
                  isActive={pathname === item.path}
                  className={`h-12 rounded-2xl font-black uppercase text-[10px] tracking-[0.15em] transition-all px-4 ${
                    pathname === item.path 
                      ? 'bg-primary text-white shadow-xl shadow-primary/30' 
                      : 'text-slate-500 hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t-2 border-primary/5 pt-6 px-4 pb-8">
          <div className="flex items-center gap-4 p-4 mb-6 bg-slate-50/50 rounded-3xl border border-primary/5 shadow-inner backdrop-blur-sm">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/5 text-primary">
               <User className="h-5 w-5" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-black truncate uppercase text-primary leading-none mb-1.5">{userRfc}</span>
              <div className="flex items-center gap-1.5 bg-accent/10 px-2 py-0.5 rounded-full w-fit">
                <ShieldCheck className="h-2.5 w-2.5 text-accent" />
                <span className="text-[8px] text-accent uppercase font-black tracking-[0.1em]">Analista Senior</span>
              </div>
            </div>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                variant="outline"
                className="text-rose-600 font-black uppercase text-[10px] tracking-widest hover:bg-rose-50 border-rose-100 h-12 rounded-2xl flex items-center justify-center gap-3 bg-white"
              >
                <LogOut className="h-4 w-4" /> Cerrar Sesión
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-transparent">
        <header className="flex h-20 items-center justify-between border-b-2 border-primary/5 px-8 bg-white/70 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-6">
            <SidebarTrigger className="lg:hidden text-primary h-10 w-10 hover:bg-primary/5 rounded-xl">
              <PanelLeft className="h-6 w-6" />
            </SidebarTrigger>
            <div className="flex flex-col">
              <h1 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-3">
                <span className="bg-primary text-white px-2.5 py-1 rounded-lg text-[9px] shadow-lg shadow-primary/20">EDOMÉX</span>
                Computación Electrónica (COEES)
              </h1>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Gestión Técnica en Educación Secundaria</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md border px-4 py-2 rounded-2xl shadow-inner">
               <Star className="h-3.5 w-3.5 text-accent fill-accent" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Periodo Vigente</span>
             </div>
          </div>
        </header>
        <main className="flex-1 p-8 md:p-12 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}