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
import { Book, BookCopy, Download, Home, LogOut, PanelLeft, User } from 'lucide-react'
import Image from 'next/image'
import { placeholderImages } from '@/lib/placeholder-images'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [userRfc, setUserRfc] = useState<string | null>(null)

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
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground rounded-md h-8 w-8 flex items-center justify-center">
              <BookCopy className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">CCT Asistencia</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton href="/dashboard" leftIcon={<Home />}>
                Inicio
              </SidebarMenuButton>
            </SidebarMenuItem>
            {isAdmin && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  href="/dashboard/admin"
                  leftIcon={<Download />}
                >
                  Administrador
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-2 p-2">
            <User className="h-6 w-6" />
            <span>{userRfc}</span>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                leftIcon={<LogOut />}
              >
                Cerrar Sesión
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between border-b px-4 lg:justify-end">
           <SidebarTrigger className="lg:hidden">
            <PanelLeft />
          </SidebarTrigger>
          <h1 className="text-xl font-semibold">Panel de Asistencia - Secundarias Edomex</h1>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
