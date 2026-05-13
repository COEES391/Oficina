
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
        <SidebarHeader className="pt-6 pb-4">
          <div className="flex flex-col items-center gap-4 px-4">
            <div className="relative h-20 w-20 bg-white rounded-[1.5rem] p-1 shadow-xl border-2 border-primary/5 group overflow-hidden">
              <Image 
                src={logoData.imageUrl} 
                alt="COEES Tech" 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                data-ai-hint="tech computer"
              />
              <div className="absolute inset-0 bg-primary/10 mix-blend-multiply opacity-20" />
            </div>
            <div className="text-center">
              <span className="text-xl font-black text-primary uppercase tracking-tighter">COEES</span>
              <p className="text-[7px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-1 opacity-60">Edoméx 2026</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-4 py-2">
          <SidebarMenu className="gap-2">
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton 
                  onClick={() => router.push(item.path)}
                  isActive={pathname === item.path}
                  className={`h-11 rounded-xl font-black uppercase text-[9px] tracking-widest px-4 transition-all duration-500 ${
                    pathname === item.path 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
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
      </Sidebar>
      <SidebarInset className="bg-transparent">
        <header className="flex h-16 items-center justify-between border-b border-slate-100 px-8 bg-white/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden text-primary" />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-50/80 px-4 py-2 rounded-xl border border-slate-100">
              <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-primary leading-none">{userRfc}</span>
                <span className="text-[6px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Usuario Activo</span>
              </div>
            </div>

            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="group h-9 px-4 rounded-xl text-rose-600 font-black uppercase text-[8px] tracking-widest hover:bg-rose-50 border border-rose-100 transition-all flex items-center gap-2"
            >
              <LogOut className="h-3 w-3" /> 
              Salir
            </Button>
          </div>
        </header>
        <main className="flex-1">
          <div className="p-4 md:p-6 max-w-[1400px] mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-700">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
