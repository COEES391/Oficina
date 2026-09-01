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
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
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
      return
    }

    setUserRfc(rfc)

    const fetchUserData = async () => {
      if (rfc === 'COEES' || rfc === 'CEDITORIAL') {
        setCurrentUser({
          id: 'master',
          rfc: rfc,
          name: rfc === 'COEES' ? 'Administrador Maestro' : 'Admin Editorial',
          password: '',
          role: 'admin',
          privileges: ['planeacion', 'soporte', 'capacitacion', 'programas', 'bitacora-atres', 'base-cct', 'base-participantes', 'usuarios']
        })
        return
      }

      try {
        const q = query(collection(db, 'users'), where('rfc', '==', rfc))
        const querySnapshot = await getDocs(q)
        if (!querySnapshot.empty) {
          setCurrentUser({ ...querySnapshot.docs[0].data(), id: querySnapshot.docs[0].id } as AppUser)
        }
      } catch (e) {
        console.error("Error fetching layout user:", e)
      }
    }

    fetchUserData()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('userRfc')
    router.push('/')
  }

  const menuConfig = [
    { privilege: 'planeacion', name: 'Planeación', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { privilege: 'soporte', name: 'Soporte Técnico', path: '/dashboard/soporte', icon: <LifeBuoy className="h-5 w-5" /> },
    { privilege: 'capacitacion', name: 'Capacitación', path: '/dashboard/capacitacion', icon: <GraduationCap className="h-5 w-5" /> },
    { privilege: 'programas', name: 'Programas', path: '/dashboard/programas', icon: <Briefcase className="h-5 w-5" /> },
    { privilege: 'base-cct', name: 'Base CCT', path: '/dashboard/base-cct', icon: <Database className="h-5 w-5" /> },
    { privilege: 'base-participantes', name: 'Base Participantes', path: '/dashboard/base-participantes', icon: <Users className="h-5 w-5" /> },
    { privilege: 'usuarios', name: 'Usuarios', path: '/dashboard/usuarios', icon: <ShieldCheck className="h-5 w-5" /> },
  ]

  const allowedMenuItems = useMemo(() => {
    if (!currentUser) return []
    const seenPaths = new Set();
    return menuConfig.filter(item => {
      if (currentUser.privileges.includes(item.privilege)) {
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
      <Sidebar className="border-none bg-[#9f2241] shadow-2xl overflow-hidden" collapsible="icon">
        <SidebarHeader className="pt-8 pb-4">
          <div className="flex flex-col items-center gap-3 px-4">
            <div className="relative h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shadow-inner group overflow-hidden">
               <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-500" />
               <Monitor className="w-6 h-6 text-white relative z-10" />
            </div>
            <div className="text-center group-data-[collapsible=icon]:hidden">
              <span className="text-lg font-black text-white uppercase tracking-tighter block leading-none">COEES</span>
              <p className="text-[7px] text-white/50 uppercase font-black tracking-[0.2em] mt-1">Edoméx 2026</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2 py-2">
          <SidebarMenu className="gap-1">
            {allowedMenuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton 
                  onClick={() => router.push(item.path)}
                  isActive={pathname === item.path}
                  tooltip={item.name}
                  className={`h-11 rounded-xl font-bold text-[11px] tracking-wide px-4 transition-all duration-300 ${
                    pathname === item.path 
                      ? 'bg-white text-[#9f2241] shadow-lg' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={pathname === item.path ? 'text-[#9f2241]' : 'text-white/50'}>
                      {item.icon}
                    </div>
                    <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <div className="mt-auto p-4 opacity-30 group-data-[collapsible=icon]:hidden">
           <div className="h-px bg-white/20 w-full mb-3" />
           <p className="text-[7px] text-white font-bold uppercase tracking-[0.1em] text-center leading-tight">
             Dirección de Educación Secundaria
           </p>
        </div>
      </Sidebar>
      <SidebarInset className="bg-transparent flex flex-col min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-slate-100 px-4 md:px-8 bg-white/80 backdrop-blur-md sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-3 md:gap-6">
            <SidebarTrigger className="text-primary" />
            <div className="flex items-center gap-3">
               <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <h1 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Sistema Integral COEES</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden xs:flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shadow-inner group transition-all hover:bg-white">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-primary leading-none">{userRfc}</span>
              </div>
            </div>

            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="h-8 px-2 md:px-4 rounded-xl text-rose-600 font-bold text-[10px] tracking-wide hover:bg-rose-50 flex items-center gap-2 transition-all active:scale-95"
            >
              <LogOut className="h-3.5 w-3.5" /> 
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 md:p-6 lg:p-8 w-full">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
