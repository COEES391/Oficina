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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar'
import { 
  LayoutDashboard, 
  GraduationCap, 
  LogOut, 
  Monitor,
  ShieldCheck,
  Database,
  Users,
  History,
  FileText,
  Wrench,
  ChevronRight,
  Home,
  Target,
  BarChart3,
  Briefcase,
  FileStack
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type AppUser } from '@/lib/planning-data'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { cn } from '@/lib/utils'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const rfc = localStorage.getItem('userRfc')
    if (!rfc) {
      router.push('/')
      return
    }

    const fetchUserData = async () => {
      if (rfc === 'COEES') {
        setCurrentUser({
          id: 'master',
          rfc: rfc,
          name: 'Administrador Maestro',
          password: '',
          role: 'admin',
          privileges: ['planeacion', 'soporte', 'capacitacion', 'programas', 'base-cct', 'base-participantes', 'usuarios']
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
    // GRUPO PLANEACIÓN
    { privilege: 'planeacion', name: 'Dashboard', path: '/dashboard', icon: <Home className="h-4 w-4" />, group: 'planeacion_header' },
    { privilege: 'planeacion', name: 'Objetivos y Metas', path: '#', icon: <FileText className="h-4 w-4" />, group: 'planeacion_header' },
    { privilege: 'planeacion', name: 'Proyectos', path: '#', icon: <FileStack className="h-4 w-4" />, group: 'planeacion_header' },
    { privilege: 'planeacion', name: 'Indicadores', path: '#', icon: <BarChart3 className="h-4 w-4" />, group: 'planeacion_header' },

    // GRUPO OFICINAS
    { privilege: 'programas', name: 'Programas', path: '/dashboard/programas', icon: <FileText className="h-4 w-4" />, group: 'oficinas', color: 'bg-purple-600' },
    { privilege: 'capacitacion', name: 'Capacitación', path: '/dashboard/capacitacion', icon: <GraduationCap className="h-4 w-4" />, group: 'oficinas', color: 'bg-emerald-600' },
    { privilege: 'soporte', name: 'Soporte técnico', path: '/dashboard/soporte', icon: <Wrench className="h-4 w-4" />, group: 'oficinas', color: 'bg-orange-500' },
    
    // GRUPO ADMIN
    { privilege: 'base-cct', name: 'Base CCT', path: '/dashboard/base-cct', icon: <Database className="h-4 w-4" />, group: 'admin' },
    { privilege: 'base-participantes', name: 'Base participantes', path: '/dashboard/base-participantes', icon: <Users className="h-4 w-4" />, group: 'admin' },
    { privilege: 'usuarios', name: 'Usuarios', path: '/dashboard/usuarios', icon: <ShieldCheck className="h-4 w-4" />, group: 'admin' },
  ]

  const allowedItems = useMemo(() => {
    if (!currentUser) return []
    return menuConfig.filter(item => currentUser.privileges.includes(item.privilege))
  }, [currentUser])

  const planeacionItems = allowedItems.filter(i => i.group === 'planeacion_header')
  const oficinaItems = allowedItems.filter(i => i.group === 'oficinas')
  const adminItems = allowedItems.filter(i => i.group === 'admin')

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

        <SidebarContent className="px-2 py-4 space-y-6">
          {/* GRUPO PLANEACIÓN */}
          {planeacionItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-white/80 font-black text-[11px] uppercase tracking-[0.1em] px-4 mb-3 group-data-[collapsible=icon]:hidden flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-accent" /> Planeación
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {planeacionItems.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton 
                        onClick={() => item.path !== '#' && router.push(item.path)}
                        isActive={pathname === item.path}
                        className={cn(
                          "h-11 rounded-xl font-bold text-[11px] tracking-wide px-4 transition-all duration-300",
                          pathname === item.path ? 'bg-white text-primary shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'
                        )}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className={cn(
                            "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                            pathname === item.path ? 'text-primary' : 'text-white/50'
                          )}>
                            {item.icon}
                          </div>
                          <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* GRUPO OFICINAS */}
          {oficinaItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-white/40 font-black text-[9px] uppercase tracking-[0.2em] px-5 mb-2 group-data-[collapsible=icon]:hidden">
                Oficinas
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-2">
                  {oficinaItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton 
                        onClick={() => router.push(item.path)}
                        isActive={pathname === item.path}
                        className={cn(
                          "h-12 rounded-xl font-bold text-[11px] tracking-wide px-3 transition-all duration-300",
                          pathname === item.path ? 'bg-white/10 ring-1 ring-white/20 shadow-xl' : 'hover:bg-white/5'
                        )}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg transition-transform group-hover:scale-110",
                            item.color || 'bg-slate-600'
                          )}>
                            {item.icon}
                          </div>
                          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                            <span className="text-white font-black leading-none">{item.name}</span>
                            {pathname === item.path && <span className="text-[7px] text-white/40 uppercase mt-1">En curso</span>}
                          </div>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* GRUPO ADMINISTRACIÓN */}
          {adminItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-white/40 font-black text-[9px] uppercase tracking-[0.2em] px-5 mb-2 group-data-[collapsible=icon]:hidden">
                Administración
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton 
                        onClick={() => router.push(item.path)}
                        isActive={pathname === item.path}
                        className={cn(
                          "h-11 rounded-xl font-bold text-[10px] tracking-wide px-4 transition-all duration-300",
                          pathname === item.path ? 'bg-white text-primary shadow-lg' : 'text-white/60 hover:bg-white/10 hover:text-white'
                        )}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className={cn(
                            "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                            pathname === item.path ? 'bg-primary/5 text-primary' : 'bg-white/5 text-white/30'
                          )}>
                            {item.icon}
                          </div>
                          <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
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
               <h1 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Sistema Integral Coees</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden xs:flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shadow-inner group transition-all hover:bg-white">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-primary leading-none">{currentUser?.rfc}</span>
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
