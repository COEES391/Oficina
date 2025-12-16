'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { teachers, type Teacher } from '@/lib/data';
import { School } from 'lucide-react';

export default function DashboardPage() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const router = useRouter();

  useEffect(() => {
    const rfc = localStorage.getItem('userRfc');
    if (rfc) {
      const currentTeacher = teachers.find(t => t.rfc.toUpperCase() === rfc.toUpperCase());
      setTeacher(currentTeacher || null);
    }
  }, []);

  if (!teacher) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando datos del profesor...</CardTitle>
          <CardDescription>
            Por favor, espera un momento.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  if (teacher.rfc !== 'ADMIN' && teacher.groups.length === 0) {
     return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso no autorizado</CardTitle>
          <CardDescription>
            Tu RFC no está asignado a ningún grupo. Por favor, contacta al administrador.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
       <Card>
        <CardHeader>
          <CardTitle>Mis Grupos Asignados</CardTitle>
          <CardDescription>
            Hola, {teacher.name}. Selecciona un grupo para pasar lista.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teacher.groups.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teacher.groups.map(g => (
                  <Card 
                    key={`${g.grade}-${g.group}`} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push(`/dashboard/attendance/${g.grade}/${g.group}`)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-2xl font-bold">
                        {g.grade}° {g.group}
                      </CardTitle>
                      <School className="h-6 w-6 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        {g.students.length} alumnos en este grupo.
                      </p>
                    </CardContent>
                  </Card>
              ))}
            </div>
          ) : (
             <p className="text-center text-muted-foreground py-4">
              {teacher.rfc === 'ADMIN' 
                ? 'Como administrador, puedes ver los reportes en la sección "Administrador".' 
                : 'No tienes grupos asignados.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
