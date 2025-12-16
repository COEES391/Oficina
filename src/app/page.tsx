"use client";

import { useRouter } from "next/navigation";
import { BookMarked } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center justify-center text-center mb-8">
        <div className="bg-primary/20 text-primary p-3 rounded-full mb-4">
            <BookMarked className="h-12 w-12" />
        </div>
        <h1 className="text-4xl font-bold tracking-tighter text-foreground sm:text-5xl">
          Planeación Didáctica NEM
        </h1>
        <p className="text-muted-foreground mt-3 max-w-md md:text-lg">
          Crea tus planeaciones didácticas para secundaria siguiendo los lineamientos de la Nueva Escuela Mexicana.
        </p>
      </div>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Bienvenido, Docente</CardTitle>
          <CardDescription>
            Comienza a estructurar tus proyectos y secuencias didácticas de forma sencilla e intuitiva.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/dashboard')} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            Ir al Panel de Planeación
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
