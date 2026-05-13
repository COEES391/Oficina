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
  Star,
  Zap
} from 'lucide-react'
import Image from 'next/image'
import { placeholderImages } from '@/lib/placeholder-images'
import { Badge } from '@/components/ui/badge'

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
    { name: 'Panel Ejecutivo', path: '/dashboard', icon: <LayoutDashboard className="h-6 w-6" /> },
    { name: 'Soporte Técnico', path: '/dashboard/soporte', icon: <LifeBuoy className="h-6 w-6" /> },
    { name: 'Capacitación', path: '/dashboard/capacitacion', icon: <GraduationCap className="h-6 w-6" /> },
    { name: 'Programas', path: '/dashboard/programas', icon: <Briefcase className="h-6 w-6" /> },
  ]

  if (!mounted) return null

  return (
    <SidebarProvider>
      <Sidebar className="border-r-2 border-primary/5 bg-white/80 backdrop-blur-3xl">
        <SidebarHeader className="border-b-2 border-primary/5 pt-10 pb-8 mb-6">
          <div className="flex flex-col items-center gap-6 px-4">
            <div className="relative h-24 w-24 bg-white rounded-[2.5rem] p-4 shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-primary/5 transition-transform hover:scale-110 duration-500">
              <Image 
                src={logoData.imageUrl} 
                alt="DESySA" 
                fill 
                className="object-contain p-4"
                data-ai-hint="education logo"
              />
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="text-2xl font-black text-primary uppercase tracking-tighter leading-none">COEES</span>
              <div className="flex items-center gap-2 mt-2">
                <span className="h-1 w-4 bg-accent/30 rounded-full" />
                <span className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.2em] opacity-70">Edoméx 2026</span>
                <span className="h-1 w-4 bg-accent/30 rounded-full" />
              </div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-6">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.path} className="mb-4">
                <SidebarMenuButton 
                  onClick={() => router.push(item.path)}
                  isActive={pathname === item.path}
                  className={`h-16 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] transition-all px-6 ${
                    pathname === item.path 
                      ? 'sidebar-item-active' 
                      : 'text-slate-400 hover:bg-primary/5 hover:text-primary'
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
        <SidebarFooter className="border-t-2 border-primary/5 pt-8 px-6 pb-10">
          <div className="flex flex-col gap-6">
            <div className="p-6 bg-slate-50/80 rounded-[2rem] border border-primary/5 shadow-inner backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl">
                  <User className="h-6 w-6" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[11px] font-black truncate uppercase text-primary leading-none mb-2">{userRfc}</span>
                  <Badge className="bg-accent/10 text-accent border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full w-fit">
                    Analista Senior
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                <span className="text-[8px] text-emerald-700 uppercase font-black tracking-widest">Sincronizado</span>
              </div>
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="text-rose-600 font-black uppercase text-[10px] tracking-[0.25em] hover:bg-rose-50 border-2 border-rose-50 h-14 rounded-2xl flex items-center justify-center gap-3 bg-white shadow-sm"
                >
                  <LogOut className="h-4 w-4" /> Salir
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-transparent">
        <header className="flex h-24 items-center justify-between border-b-2 border-primary/5 px-10 bg-white/70 backdrop-blur-3xl sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-8">
            <SidebarTrigger className="lg:hidden text-primary h-12 w-12 hover:bg-primary/5 rounded-2xl border-2 border-slate-100">
              <PanelLeft className="h-6 w-6" />
            </SidebarTrigger>
            <div className="flex flex-col">
              <div className="flex items-center gap-4">
                <Badge className="bg-primary text-white border-none text-[10px] font-black uppercase px-4 py-1.5 rounded-xl shadow-lg shadow-primary/20">
                  COEES
                </Badge>
                <h1 className="text-[12px] font-black text-slate-800 uppercase tracking-[0.4em] leading-none">
                  Computación Electrónica
                </h1>
              </div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2 ml-1 opacity-60">Gestión Técnica en Educación Secundaria</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md border-2 border-slate-50 px-6 py-3 rounded-[1.5rem] shadow-sm">
               <Star className="h-4 w-4 text-accent fill-accent animate-pulse" />
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Periodo Vigente 2026</span>
             </div>
             <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl hover:rotate-12 transition-transform cursor-pointer">
               <Zap className="h-5 w-5" />
             </div>
          </div>
        </header>
        <main className="flex-1 p-10 md:p-14 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}