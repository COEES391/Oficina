'use client'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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

export default function DashboardPage() {
  const [userRegistrations, setUserRegistrations] = useState<Registration[]>([]);
  const [userRfc, setUserRfc] = useState<string | null>(null);
  const { toast } = useToast();

  const loadUserRegistrations = () => {
    const rfc = localStorage.getItem('userRfc');
    setUserRfc(rfc);
    if (rfc) {
      const allRegistrations: Registration[] = JSON.parse(localStorage.getItem('registrations') || '[]');
      const filteredRegistrations = allRegistrations.filter(reg => reg.rfc === rfc);
      setUserRegistrations(filteredRegistrations);
    }
  };

  useEffect(() => {
    loadUserRegistrations();
  }, []);
  
  // A effect to re-render component when registrations change in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      loadUserRegistrations();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  const handleTimeRecord = (registrationId: string, type: 'checkIn' | 'checkOut') => {
    const allRegistrations: Registration[] = JSON.parse(localStorage.getItem('registrations') || '[]');
    const now = new Date().toISOString();
    
    let registrationFound = false;
    const updatedRegistrations = allRegistrations.map(reg => {
      if (reg.id === registrationId) {
        registrationFound = true;
        // Prevent re-recording check-in
        if (type === 'checkIn' && reg.checkIn) {
            toast({ variant: 'destructive', title: 'Error', description: 'Ya has registrado tu entrada.' });
            return reg;
        }
        // Prevent re-recording check-out
        if (type === 'checkOut' && reg.checkOut) {
            toast({ variant: 'destructive', title: 'Error', description: 'Ya has registrado tu salida.' });
            return reg;
        }
        // Prevent checking out before checking in
        if (type === 'checkOut' && !reg.checkIn) {
          toast({ variant: 'destructive', title: 'Error', description: 'Debes registrar tu entrada primero.' });
          return reg;
        }
        
        toast({ title: 'Éxito', description: `Se ha registrado tu ${type === 'checkIn' ? 'entrada' : 'salida'}.` });
        return { ...reg, [type]: now };
      }
      return reg;
    });

    if (registrationFound) {
      localStorage.setItem('registrations', JSON.stringify(updatedRegistrations));
      window.dispatchEvent(new Event('storage')); // Trigger update
    }
  };

  return (
    <div className="grid gap-6">
       <Card>
        <CardHeader>
          <CardTitle>Bienvenido al Panel de Asistencia</CardTitle>
          <CardDescription>
            Aquí puedes registrar tu entrada y salida a los cursos en los que te has inscrito.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Si aún no te has inscrito a ningún curso, puedes hacerlo ahora.</p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/dashboard/crear">Ver e Inscribirse a Cursos</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {userRegistrations.length > 0 ? (
          userRegistrations.map(reg => (
            <Card key={reg.id}>
              <CardHeader>
                <CardTitle className="text-xl">{reg.course}</CardTitle>
                <CardDescription>Inscrito el: {format(new Date(reg.registrationDate), 'dd/MM/yyyy')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">Entrada:</h4>
                  <p>{reg.checkIn ? format(new Date(reg.checkIn), 'dd/MM/yyyy HH:mm:ss') : 'Pendiente'}</p>
                </div>
                 <div>
                  <h4 className="font-semibold">Salida:</h4>
                  <p>{reg.checkOut ? format(new Date(reg.checkOut), 'dd/MM/yyyy HH:mm:ss') : 'Pendiente'}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleTimeRecord(reg.id, 'checkIn')} disabled={!!reg.checkIn} className="w-full">
                    Registrar Entrada
                  </Button>
                  <Button onClick={() => handleTimeRecord(reg.id, 'checkOut')} disabled={!reg.checkIn || !!reg.checkOut} className="w-full" variant="outline">
                    Registrar Salida
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No estás inscrito en ningún curso todavía.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
