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
  User,
  Monitor,
  ShieldCheck
} from 'lucide-react'
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
      <Sidebar className="border-r border-slate-100 bg-white/95 backdrop-blur-md">
        <SidebarHeader className="pt-10 pb-6">
          <div className="flex flex-col items-center gap-4 px-6">
            <div className="relative h-20 w-20 bg-primary/5 rounded-[2rem] flex items-center justify-center border border-primary/10 shadow-sm overflow-hidden group">
               <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors duration-500" />
               <Monitor className="w-10 h-10 text-primary opacity-80 relative z-10" />
            </div>
            <div className="text-center">
              <span className="text-xl font-black text-primary uppercase tracking-tighter block leading-none">COEES</span>
              <p className="text-[8px] text-muted-foreground uppercase font-black tracking-[0.3em] mt-2 opacity-60">Edoméx 2026</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-6 py-6">
          <SidebarMenu className="gap-3">
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton 
                  onClick={() => router.push(item.path)}
                  isActive={pathname === item.path}
                  className={`h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest px-6 transition-all duration-500 ${
                    pathname === item.path 
                      ? 'bg-primary text-white shadow-2xl shadow-primary/30 scale-105' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-primary'
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
        <header className="flex h-20 items-center justify-between border-b border-slate-100 px-10 bg-white/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <SidebarTrigger className="lg:hidden text-primary" />
            <div className="flex items-center gap-3">
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
               <h1 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Sistema de Gestión Integral COEES</h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100 shadow-inner group transition-all hover:bg-white hover:shadow-md">
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-primary leading-none">{userRfc}</span>
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">Analista Operativo Senior</span>
              </div>
            </div>

            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="h-10 px-5 rounded-2xl text-rose-600 font-black uppercase text-[9px] tracking-widest hover:bg-rose-50 flex items-center gap-3 transition-all active:scale-95"
            >
              <LogOut className="h-4 w-4" /> 
              Salir del Portal
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-10 max-w-[1800px] mx-auto w-full">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
