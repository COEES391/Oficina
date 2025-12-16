import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Bienvenido al Panel de Asistencia</CardTitle>
          <CardDescription>
            Desde aquí puedes gestionar la asistencia a los cursos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Selecciona una opción del menú de la izquierda para comenzar.</p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/dashboard/crear">Ver Cursos</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
