"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookMarked,
  FilePlus,
  Home,
} from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <SidebarTrigger />
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <BookMarked className="h-6 w-6 text-primary" />
            <span className="sr-only">Planeación NEM</span>
        </Link>
      </div>
      <div className="flex w-full items-center justify-end">
        <h1 className="text-lg font-semibold">Panel de Planeación Didáctica</h1>
      </div>
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <BookMarked className="h-7 w-7 text-primary" />
            <span className="font-semibold text-lg">Planeación NEM</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/dashboard"}
                onClick={() => router.push("/dashboard")}
                tooltip={{ children: "Mis Planeaciones", side: "right" }}
              >
                <Home />
                Mis Planeaciones
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/dashboard/crear")}
                onClick={() => router.push("/dashboard/crear")}
                tooltip={{ children: "Nueva Planeación", side: "right" }}
              >
                <FilePlus />
                Nueva Planeación
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter/>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
