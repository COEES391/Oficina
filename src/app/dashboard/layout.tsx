
'use client'
import { useState, useEffect, useMemo } from 'react'
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
  Monitor,
  ShieldCheck,
  Database,
  Users as UsersIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type AppUser } from '@/lib/planning-data'

export default function DashboardLayout({
  children,
}: {
  children: React.Node
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [userRfc, setUserRfc] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const rfc = localStorage.getItem('userRfc')
    if (!rfc) {
      router.push('/')
    } else {
      setUserRfc(rfc)
      // Recuperar datos del usuario logueado para ver privilegios
      const storedUsers: AppUser[] = JSON.parse(localStorage.getItem('app_users_v1') || '[]')
      const user = storedUsers.find(u => u.rfc.toUpperCase() === rfc.toUpperCase())
      
      // Si es el usuario maestro original
      if (rfc === 'COEES' || rfc === 'CEDITORIAL') {
        setCurrentUser({
          id: 'master',
          rfc: rfc,
          name: rfc === 'COEES' ? 'Administrador Maestro' : 'Admin Editorial',
          password: '',
          role: 'admin',
          privileges: ['planeacion', 'soporte', 'capacitacion', 'programas', 'base-cct', 'usuarios']
        })
      } else if (user) {
        setCurrentUser(user)
      }
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('userRfc')
    router.push('/')
  }

  const allMenuItems = [
    { id: 'planeacion', name: 'PLANEACIÓN', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'soporte', name: 'Soporte Técnico', path: '/dashboard/soporte', icon: <LifeBuoy className="h-5 w-5" /> },
    { id: 'capacitacion', name: 'Capacitación', path: '/dashboard/capacitacion', icon: <GraduationCap className="h-5 w-5" /> },
    { id: 'programas', name: 'Programas', path: '/dashboard/programas', icon: <Briefcase className="h-5 w-5" /> },
    { id: 'base-cct', name: 'BASE CCT', path: '/dashboard/base-cct', icon: <Database className="h-5 w-5" /> },
    { id: 'usuarios', name: 'Usuarios', path: '/dashboard/usuarios', icon: <UsersIcon className="h-5 w-5" /> },
  ]

  const allowedMenuItems = useMemo(() => {
    if (!currentUser) return []
    return allMenuItems.filter(item => currentUser.privileges.includes(item.id))
  }, [currentUser])

  if (!mounted) return null

  return (
    <SidebarProvider>
      <Sidebar className="border-none bg-[#9f2241] shadow-2xl overflow-hidden">
        <SidebarHeader className="pt-12 pb-8">
          <div className="flex flex-col items-center gap-5 px-6">
            <div className="relative h-20 w-20 bg-white/10 rounded-[2rem] flex items-center justify-center border border-white/10 shadow-inner group overflow-hidden">
               <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-500" />
               <Monitor className="w-10 h-10 text-white relative z-10" />
            </div>
            <div className="text-center">
              <span className="text-2xl font-black text-white uppercase tracking-tighter block leading-none">COEES</span>
              <p className="text-[9px] text-white/60 uppercase font-black tracking-[0.3em] mt-3">Edoméx 2026</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-6 py-6">
          <SidebarMenu className="gap-4">
            {allowedMenuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton 
                  onClick={() => router.push(item.path)}
                  isActive={pathname === item.path}
                  className={`h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest px-6 transition-all duration-500 ${
                    pathname === item.path 
                      ? 'bg-white text-[#9f2241] shadow-2xl shadow-black/20 scale-105' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
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
        <div className="mt-auto p-8 opacity-40">
           <div className="h-px bg-white/20 w-full mb-6" />
           <p className="text-[8px] text-white font-black uppercase tracking-[0.2em] text-center leading-relaxed">
             Dirección de Educación Secundaria
           </p>
        </div>
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
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {currentUser?.role === 'admin' ? 'Administrador del Sistema' : 'Analista Operativo'}
                </span>
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
