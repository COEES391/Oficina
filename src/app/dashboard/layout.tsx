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
import { LayoutDashboard, LifeBuoy, GraduationCap, Briefcase, LogOut, PanelLeft, User } from 'lucide-react'
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

  const logoData = placeholderImages.find(img => img.id === 'desysa-logo') || placeholderImages[0]

  useEffect(() => {
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

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b pb-4 mb-2">
          <div className="flex items-center gap-3 px-2 py-4">
            <div className="relative h-10 w-10 flex-shrink-0 bg-white rounded-md p-1 shadow-sm border">
              <Image 
                src={logoData.imageUrl} 
                alt="DESySA" 
                fill 
                className="object-contain"
                data-ai-hint="office logo"
              />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold leading-none text-primary truncate uppercase">Planeación</span>
              <span className="text-[10px] text-muted-foreground truncate uppercase font-semibold">DESySA Edomex</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton 
                  onClick={() => router.push(item.path)}
                  isActive={pathname === item.path}
                  leftIcon={item.icon}
                >
                  {item.name}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t pt-2">
          <div className="flex items-center gap-2 p-2 mb-2 bg-muted/50 rounded-md">
            <User className="h-5 w-5 text-primary" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold truncate">{userRfc}</span>
              <span className="text-[10px] text-muted-foreground">Analista</span>
            </div>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                variant="outline"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                leftIcon={<LogOut className="h-4 w-4" />}
              >
                Cerrar Sesión
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between border-b px-4 bg-background sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden">
              <PanelLeft className="h-5 w-5" />
            </SidebarTrigger>
            <h1 className="text-lg font-bold text-primary">
              Sistema de Gestión - Oficina de Planeación
            </h1>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 bg-slate-50/50">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
