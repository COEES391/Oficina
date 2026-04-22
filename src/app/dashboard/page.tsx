'use client'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LifeBuoy, GraduationCap, Briefcase, TrendingUp } from 'lucide-react';
import { supportData, trainingData, programsData } from '@/lib/planning-data';

export default function DashboardPage() {
  const pendingSupport = supportData.filter(s => s.status !== 'resuelto').length;
  const totalTrained = trainingData.reduce((acc, curr) => acc + curr.attendees, 0);
  const activePrograms = programsData.filter(p => p.status === 'activo').length;

  const stats = [
    { title: 'Soporte Pendiente', value: pendingSupport, icon: <LifeBuoy className="h-8 w-8 text-orange-500" />, desc: 'Reportes por atender' },
    { title: 'Docentes Capacitados', value: totalTrained, icon: <GraduationCap className="h-8 w-8 text-blue-500" />, desc: 'Total acumulado ciclo' },
    { title: 'Programas Activos', value: activePrograms, icon: <Briefcase className="h-8 w-8 text-green-500" />, desc: 'En fase de ejecución' },
    { title: 'Eficiencia Planeación', value: '92%', icon: <TrendingUp className="h-8 w-8 text-purple-500" />, desc: 'Metas alcanzadas' },
  ];

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado de Movimientos Actuales</CardTitle>
          <CardDescription>Resumen ejecutivo de la operación de planeación.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-white">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <LifeBuoy className="h-4 w-4" /> Soporte Reciente
              </h3>
              <p className="text-sm text-muted-foreground">Se han detectado incrementos en reportes de conectividad en la zona norte.</p>
            </div>
            <div className="p-4 border rounded-lg bg-white">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <GraduationCap className="h-4 w-4" /> Próxima Capacitación
              </h3>
              <p className="text-sm text-muted-foreground">Taller de Ciberseguridad programado para el 25 de mayo para directivos.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
