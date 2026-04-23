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
import { LayoutDashboard, LifeBuoy, GraduationCap, Briefcase, LogOut, PanelLeft, User, ShieldCheck } from 'lucide-react'
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
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { name: 'Soporte Técnico', path: '/dashboard/soporte', icon: <LifeBuoy className="h-4 w-4" /> },
    { name: 'Capacitación', path: '/dashboard/capacitacion', icon: <GraduationCap className="h-4 w-4" /> },
    { name: 'Programas', path: '/dashboard/programas', icon: <Briefcase className="h-4 w-4" /> },
  ]

  if (!mounted) return null

  return (
    <SidebarProvider>
      <Sidebar className="border-r-2 border-primary/5">
        <SidebarHeader className="border-b-2 border-primary/5 pb-4 mb-2">
          <div className="flex items-center gap-3 px-2 py-4">
            <div className="relative h-12 w-12 flex-shrink-0 bg-white rounded-xl p-1 shadow-md border border-primary/10">
              <Image 
                src={logoData.imageUrl} 
                alt="DESySA" 
                fill 
                className="object-contain"
                data-ai-hint="office logo"
              />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-black leading-none text-primary truncate uppercase tracking-tighter">Planeación</span>
              <span className="text-[9px] text-muted-foreground truncate uppercase font-bold tracking-widest mt-1">Edoméx</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.path} className="mb-1">
                <SidebarMenuButton 
                  onClick={() => router.push(item.path)}
                  isActive={pathname === item.path}
                  leftIcon={item.icon}
                  className={`font-black uppercase text-[10px] tracking-widest transition-all ${pathname === item.path ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90' : 'hover:bg-primary/5 hover:text-primary'}`}
                >
                  {item.name}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t-2 border-primary/5 pt-4 px-2 pb-6">
          <div className="flex items-center gap-3 p-3 mb-4 bg-primary/[0.03] rounded-xl border border-primary/10">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
               <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-black truncate uppercase text-primary leading-none mb-1">{userRfc}</span>
              <span className="text-[8px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1">
                <ShieldCheck className="h-2 w-2 text-primary" /> Analista
              </span>
            </div>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                variant="outline"
                className="text-destructive font-black uppercase text-[10px] tracking-widest hover:text-destructive hover:bg-destructive/10 border-destructive/20 h-10"
                leftIcon={<LogOut className="h-4 w-4" />}
              >
                Cerrar Sesión
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b-2 border-primary/5 px-6 bg-white sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden text-primary">
              <PanelLeft className="h-6 w-6" />
            </SidebarTrigger>
            <h1 className="text-sm font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="bg-primary text-white px-2 py-0.5 rounded text-[10px]">EDOMÉX</span>
              Sistema de Gestión Integral
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:block">
               Estado de México • Oficina de Planeación
             </div>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8 bg-slate-50/30">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}