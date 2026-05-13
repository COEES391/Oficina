
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
  Settings
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
    { name: 'Panel Ejecutivo', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { name: 'Soporte Técnico', path: '/dashboard/soporte', icon: <LifeBuoy className="h-4 w-4" /> },
    { name: 'Capacitación', path: '/dashboard/capacitacion', icon: <GraduationCap className="h-4 w-4" /> },
    { name: 'Programas', path: '/dashboard/programas', icon: <Briefcase className="h-4 w-4" /> },
  ]

  if (!mounted) return null

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-slate-100 bg-white/90 backdrop-blur-md">
        <SidebarHeader className="pt-8 pb-4">
          <div className="flex flex-col items-center gap-4 px-4">
            <div className="relative h-16 w-16 bg-white rounded-2xl p-3 shadow-lg border border-slate-100 overflow-hidden flex items-center justify-center">
               <Monitor className="w-8 h-8 text-primary opacity-80" />
            </div>
            <div className="text-center">
              <span className="text-lg font-black text-primary uppercase tracking-tighter">COEES</span>
              <p className="text-[7px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-1">Edoméx 2026</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-4 py-4">
          <SidebarMenu className="gap-2">
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton 
                  onClick={() => router.push(item.path)}
                  isActive={pathname === item.path}
                  className={`h-10 rounded-xl font-black uppercase text-[9px] tracking-widest px-4 transition-all duration-300 ${
                    pathname === item.path 
                      ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-primary'
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
      </Sidebar>
      <SidebarInset className="bg-transparent">
        <header className="flex h-14 items-center justify-between border-b border-slate-100 px-8 bg-white/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden text-primary" />
            <h1 className="text-xs font-black uppercase text-slate-400 tracking-widest">Sistema de Gestión Integral</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-100/50 px-3 py-1.5 rounded-xl border border-slate-100">
              <div className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <User className="h-3 w-3" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-primary leading-none">{userRfc}</span>
                <span className="text-[6px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Analista Senior</span>
              </div>
            </div>

            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="h-8 px-3 rounded-xl text-rose-600 font-black uppercase text-[8px] tracking-widest hover:bg-rose-50 flex items-center gap-2"
            >
              <LogOut className="h-3 w-3" /> 
              Salir
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-[1600px] mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
