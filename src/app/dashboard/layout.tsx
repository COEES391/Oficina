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
  Users
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
      const storedUsers: AppUser[] = JSON.parse(localStorage.getItem('app_users_v1') || '[]')
      const user = storedUsers.find(u => u.rfc.toUpperCase() === rfc.toUpperCase())
      
      if (rfc === 'COEES' || rfc === 'CEDITORIAL') {
        setCurrentUser({
          id: 'master',
          rfc: rfc,
          name: rfc === 'COEES' ? 'Administrador Maestro' : 'Admin Editorial',
          password: '',
          role: 'admin',
          privileges: ['planeacion', 'soporte', 'capacitacion', 'programas', 'bitacora-atres', 'base-cct', 'base-participantes', 'usuarios']
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

  // Mapeo de privilegios a items de menú
  const menuConfig = [
    { privilege: 'bitacora-atres', name: 'Programas', path: '/dashboard/programas', icon: <Briefcase className="h-5 w-5" /> },
    { privilege: 'planeacion', name: 'PLANEACIÓN', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { privilege: 'soporte', name: 'Soporte Técnico', path: '/dashboard/soporte', icon: <LifeBuoy className="h-5 w-5" /> },
    { privilege: 'capacitacion', name: 'Capacitación', path: '/dashboard/capacitacion', icon: <GraduationCap className="h-5 w-5" /> },
    { privilege: 'programas', name: 'Programas', path: '/dashboard/programas', icon: <Briefcase className="h-5 w-5" /> },
    { privilege: 'base-cct', name: 'BASE CCT', path: '/dashboard/base-cct', icon: <Database className="h-5 w-5" /> },
    { privilege: 'base-participantes', name: 'BASE PARTICIPANTES', path: '/dashboard/base-participantes', icon: <Users className="h-5 w-5" /> },
    { privilege: 'usuarios', name: 'Usuarios', path: '/dashboard/usuarios', icon: <ShieldCheck className="h-5 w-5" /> },
  ]

  const allowedMenuItems = useMemo(() => {
    if (!currentUser) return []
    const seenPaths = new Set();
    return menuConfig.filter(item => {
      if (currentUser.privileges.includes(item.privilege)) {
        // Evitar duplicados si tiene bitacora-atres y programas (ambos van a la misma ruta)
        if (seenPaths.has(item.path)) return false;
        seenPaths.add(item.path);
        return true;
      }
      return false;
    })
  }, [currentUser])

  if (!mounted) return null

  return (
    <SidebarProvider>
      <Sidebar className="border-none bg-[#9f2241] shadow-2xl overflow-hidden">
        <SidebarHeader className="pt-8 pb-4">
          <div className="flex flex-col items-center gap-3 px-4">
            <div className="relative h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner group overflow-hidden">
               <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-500" />
               <Monitor className="w-8 h-8 text-white relative z-10" />
            </div>
            <div className="text-center">
              <span className="text-xl font-black text-white uppercase tracking-tighter block leading-none">COEES</span>
              <p className="text-[8px] text-white/50 uppercase font-black tracking-[0.3em] mt-1">Edoméx 2026</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-4 py-2">
          <SidebarMenu className="gap-2">
            {allowedMenuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton 
                  onClick={() => router.push(item.path)}
                  isActive={pathname === item.path}
                  className={`h-11 rounded-xl font-black uppercase text-[9px] tracking-widest px-4 transition-all duration-300 ${
                    pathname === item.path 
                      ? 'bg-white text-[#9f2241] shadow-xl shadow-black/10' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={pathname === item.path ? 'text-[#9f2241]' : 'text-white/50'}>
                      {item.icon}
                    </div>
                    <span>{item.name}</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <div className="mt-auto p-6 opacity-30">
           <div className="h-px bg-white/20 w-full mb-4" />
           <p className="text-[7px] text-white font-black uppercase tracking-[0.2em] text-center leading-tight">
             Dirección de Educación Secundaria
           </p>
        </div>
      </Sidebar>
      <SidebarInset className="bg-transparent overflow-x-hidden">
        <header className="flex h-16 items-center justify-between border-b border-slate-100 px-4 md:px-8 bg-white/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-3 md:gap-6">
            <SidebarTrigger className="lg:hidden text-primary" />
            <div className="flex items-center gap-3">
               <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <h1 className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Sistema Integral COEES</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:flex items-center gap-3 bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-100 shadow-inner group transition-all hover:bg-white">
              <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-primary leading-none">{userRfc}</span>
                <span className="text-[6px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {currentUser?.role === 'admin' ? 'Administrador' : 'Analista'}
                </span>
              </div>
            </div>

            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="h-8 px-2 md:px-4 rounded-xl text-rose-600 font-black uppercase text-[8px] tracking-widest hover:bg-rose-50 flex items-center gap-2 transition-all active:scale-95"
            >
              <LogOut className="h-3.5 w-3.5" /> 
              <span className="hidden xs:inline">Salir</span>
            </Button>
          </div>
        </header>
        <main className="flex-1">
          <div className="p-4 md:p-8 max-w-full mx-auto w-full">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
