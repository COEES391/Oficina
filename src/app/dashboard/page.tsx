'use client'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type Registration = {
  rfc: string;
  course: string;
  registrationDate: string;
  checkIn: string | null;
  checkOut: string | null;
  id: string;
};

const allCourses = [
  'ChatGPT: En el Aprendizaje',
  'ChatPDF: El asistente Virtual para tu Material Educativo',
  'Kahoot! Diviertete evaluando',
  'Canva: Presentaciones visuales y creativas',
  'Excel en línea para la gestión educativa',
  'Recursos Tecnologicos para transformar la evaluación y creatividad en el aula',
  'Potencia tu procuntividad digital con Microsoft Office 365',
  'Microsoft 365: operaciones básicas',
  'Tic y Tac: usando las herramientas clave',
]

export default function DashboardPage() {
  const [userRegistrations, setUserRegistrations] = useState<Registration[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [userRfc, setUserRfc] = useState<string | null>(null);
  const { toast } = useToast();

  const loadUserData = () => {
    const rfc = localStorage.getItem('userRfc');
    setUserRfc(rfc);
    if (rfc) {
      const allRegistrations: Registration[] = JSON.parse(localStorage.getItem('registrations') || '[]');
      const filteredRegistrations = allRegistrations.filter(reg => reg.rfc === rfc);
      setUserRegistrations(filteredRegistrations);
    }
  };

  useEffect(() => {
    loadUserData();
    const handleStorageChange = () => loadUserData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleTimeRecord = (registrationId: string, type: 'checkIn' | 'checkOut') => {
    const allRegistrations: Registration[] = JSON.parse(localStorage.getItem('registrations') || '[]');
    const now = new Date().toISOString();
    
    const updatedRegistrations = allRegistrations.map(reg => {
      if (reg.id === registrationId) {
        if (type === 'checkIn' && reg.checkIn) {
            toast({ variant: 'destructive', title: 'Error', description: 'Ya has registrado tu entrada.' });
            return reg;
        }
        if (type === 'checkOut' && reg.checkOut) {
            toast({ variant: 'destructive', title: 'Error', description: 'Ya has registrado tu salida.' });
            return reg;
        }
        if (type === 'checkOut' && !reg.checkIn) {
          toast({ variant: 'destructive', title: 'Error', description: 'Debes registrar tu entrada primero.' });
          return reg;
        }
        
        toast({ title: 'Éxito', description: `Registro de ${type === 'checkIn' ? 'entrada' : 'salida'} exitoso.` });
        return { ...reg, [type]: now };
      }
      return reg;
    });

    localStorage.setItem('registrations', JSON.stringify(updatedRegistrations));
    window.dispatchEvent(new Event('storage'));
  };

  const handleCheckboxChange = (course: string) => {
    setSelectedCourses((prev) =>
      prev.includes(course)
        ? prev.filter((c) => c !== course)
        : [...prev, course]
    );
  };

  const handleRegister = () => {
    if (selectedCourses.length > 0 && userRfc) {
      const existingRegistrations: Registration[] = JSON.parse(localStorage.getItem('registrations') || '[]');
      const newRegistrations: Registration[] = [];

      selectedCourses.forEach(course => {
        const isAlreadyRegistered = existingRegistrations.some(reg => reg.rfc === userRfc && reg.course === course);
        if (!isAlreadyRegistered) {
          newRegistrations.push({
            rfc: userRfc,
            course: course,
            registrationDate: new Date().toISOString(),
            checkIn: null,
            checkOut: null,
            id: `${userRfc}-${course}-${new Date().getTime()}`
          });
        }
      });
      
      if(newRegistrations.length > 0) {
        const allRegistrations = [...existingRegistrations, ...newRegistrations];
        localStorage.setItem('registrations', JSON.stringify(allRegistrations));
        
        toast({
          title: 'Registro Exitoso',
          description: `Te has inscrito a ${newRegistrations.length} nuevo(s) curso(s).`,
        });
        setSelectedCourses([]);
        window.dispatchEvent(new Event('storage'));
      } else {
         toast({
            title: 'Información',
            description: `Ya estabas inscrito en los cursos seleccionados.`,
          })
      }
    }
  };

  const availableCourses = allCourses.filter(course => !userRegistrations.some(reg => reg.course === course));

  return (
    <div className="grid gap-6">
       <Card>
        <CardHeader>
          <CardTitle>Mis Cursos - Registro de Asistencia</CardTitle>
          <CardDescription>
            Registra tu entrada y salida a los cursos en los que te has inscrito.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userRegistrations.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userRegistrations.map(reg => (
                <Card key={reg.id}>
                  <CardHeader>
                    <CardTitle className="text-xl">{reg.course}</CardTitle>
                    <CardDescription>Inscrito el: {format(new Date(reg.registrationDate), 'dd/MM/yyyy')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold">Entrada:</h4>
                      <p>{reg.checkIn ? format(new Date(reg.checkIn), 'dd/MM/yy HH:mm:ss') : 'Pendiente'}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Salida:</h4>
                      <p>{reg.checkOut ? format(new Date(reg.checkOut), 'dd/MM/yy HH:mm:ss') : 'Pendiente'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleTimeRecord(reg.id, 'checkIn')} disabled={!!reg.checkIn} className="w-full">
                        Entrada
                      </Button>
                      <Button onClick={() => handleTimeRecord(reg.id, 'checkOut')} disabled={!reg.checkIn || !!reg.checkOut} className="w-full" variant="outline">
                        Salida
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">Aún no estás inscrito en ningún curso.</p>
          )}
        </CardContent>
      </Card>
      
      {availableCourses.length > 0 && (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle>Inscripción a Cursos Disponibles</CardTitle>
              <CardDescription>Selecciona los cursos a los que deseas inscribirte. Aparecerán en la sección "Mis Cursos".</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {availableCourses.map((course) => (
                <div key={course} className="flex items-center space-x-3">
                  <Checkbox
                    id={course}
                    checked={selectedCourses.includes(course)}
                    onCheckedChange={() => handleCheckboxChange(course)}
                  />
                  <Label htmlFor={course} className="text-sm font-medium leading-none">
                    {course}
                  </Label>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button onClick={handleRegister} disabled={selectedCourses.length === 0}>
                Inscribirse a cursos seleccionados
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}
