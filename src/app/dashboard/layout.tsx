
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { Download, Home, LogOut, PanelLeft, User } from 'lucide-react'
import Image from 'next/image'
import { placeholderImages } from '@/lib/placeholder-images'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
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

  const isAdmin = userRfc === 'ADMIN'

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border/50 pb-4 mb-2">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="relative h-10 w-10 flex-shrink-0 bg-white rounded-md p-1 shadow-sm">
              <Image 
                src={logoData.imageUrl} 
                alt="DESySA" 
                fill 
                className="object-contain"
                data-ai-hint="education logo"
              />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold leading-none text-primary truncate">DESySA</span>
              <span className="text-[10px] text-muted-foreground truncate uppercase font-semibold">CCT Asistencia</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => router.push('/dashboard')}
                leftIcon={<Home className="h-4 w-4" />}
              >
                Inicio
              </SidebarMenuButton>
            </SidebarMenuItem>
            {isAdmin && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => router.push('/dashboard/admin')}
                  leftIcon={<Download className="h-4 w-4" />}
                >
                  Reportes Administrador
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border/50 pt-2">
          <div className="flex items-center gap-2 p-2 mb-2 bg-muted/50 rounded-md">
            <User className="h-5 w-5 text-primary" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold truncate">{userRfc}</span>
              <span className="text-[10px] text-muted-foreground">Sesión Activa</span>
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
        <header className="flex h-14 items-center justify-between border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden">
              <PanelLeft className="h-5 w-5" />
            </SidebarTrigger>
            <h1 className="text-lg font-bold text-primary hidden sm:block">
              Control de Asistencia - Secundarias Edomex
            </h1>
            <h1 className="text-lg font-bold text-primary sm:hidden">
              CCT Asistencia
            </h1>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 bg-gray-50/30">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
