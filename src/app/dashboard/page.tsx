"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FilePlus, BookCopy } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="grid gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Planeaciones</h1>
          <p className="text-muted-foreground">
            Aquí encontrarás tus proyectos y secuencias didácticas guardadas.
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/crear')}>
          <FilePlus className="mr-2" />
          Crear Nueva Planeación
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary rounded-md">
                <BookCopy className="h-6 w-6 text-secondary-foreground" />
              </div>
              <CardTitle>Proyecto: El impacto ambiental</CardTitle>
            </div>
            <CardDescription className="pt-2">Campo Formativo: Ética, Naturaleza y Sociedades</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground">
              Un proyecto para analizar el impacto de las actividades humanas en el ecosistema local.
            </p>
          </CardContent>
          <div className="p-4 pt-0">
             <Button variant="outline" className="w-full">Ver Detalles</Button>
          </div>
        </Card>

        <Card className="border-2 border-dashed bg-muted/50 hover:border-primary transition-colors">
          <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Crear nueva planeación</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Comienza un nuevo proyecto o secuencia didáctica desde cero.
              </p>
            </div>
            <Button onClick={() => router.push('/dashboard/crear')}>
              <FilePlus className="mr-2" />
              Empezar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
