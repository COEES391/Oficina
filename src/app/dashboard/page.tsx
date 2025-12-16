'use client'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, isToday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { teachers, type Teacher, type Group } from '@/lib/data';

type AttendanceRecord = {
  id: string; // Unique ID for the record, e.g., 'RFC-1-A-2023-10-27'
  teacherRfc: string;
  grade: string;
  group: string;
  checkIn: string | null;
  checkOut: string | null;
};

export default function DashboardPage() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const { toast } = useToast();

  const loadTeacherData = () => {
    const rfc = localStorage.getItem('userRfc');
    if (rfc) {
      const currentTeacher = teachers.find(t => t.rfc.toUpperCase() === rfc.toUpperCase());
      setTeacher(currentTeacher || null);
      
      const allAttendance: AttendanceRecord[] = JSON.parse(localStorage.getItem('attendance') || '[]');
      // Filter records for the current teacher and for today only
      const todayRecords = allAttendance.filter(rec => rec.teacherRfc === rfc && isToday(new Date(rec.checkIn || new Date())));
      setAttendanceRecords(todayRecords);
    }
  };
  
  useEffect(() => {
    loadTeacherData();
    // Listen for storage changes to update UI across tabs
    const handleStorageChange = () => loadTeacherData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getRecordForGroup = (grade: string, group: string) => {
    return attendanceRecords.find(rec => rec.grade === grade && rec.group === group);
  };

  const handleTimeRecord = (grade: string, group: string, type: 'checkIn' | 'checkOut') => {
    if (!teacher) return;

    const allAttendance: AttendanceRecord[] = JSON.parse(localStorage.getItem('attendance') || '[]');
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const recordId = `${teacher.rfc}-${grade}-${group}-${todayStr}`;
    
    let existingRecord = allAttendance.find(rec => rec.id === recordId);

    if (type === 'checkIn') {
      if (existingRecord?.checkIn) {
        toast({ variant: 'destructive', title: 'Error', description: 'Ya has registrado tu entrada para este grupo hoy.' });
        return;
      }
      if (!existingRecord) {
        existingRecord = {
            id: recordId,
            teacherRfc: teacher.rfc,
            grade,
            group,
            checkIn: today.toISOString(),
            checkOut: null
        };
        allAttendance.push(existingRecord);
      } else {
        existingRecord.checkIn = today.toISOString();
      }
      toast({ title: 'Éxito', description: `Entrada registrada para el grupo ${grade}° ${group}.` });

    } else { // checkOut
      if (!existingRecord?.checkIn) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debes registrar tu entrada primero.' });
        return;
      }
      if (existingRecord.checkOut) {
        toast({ variant: 'destructive', title: 'Error', description: 'Ya has registrado tu salida para este grupo hoy.' });
        return;
      }
      existingRecord.checkOut = today.toISOString();
      toast({ title: 'Éxito', description: `Salida registrada para el grupo ${grade}° ${group}.` });
    }
    
    const updatedAttendance = existingRecord.checkIn ? allAttendance.map(rec => rec.id === recordId ? existingRecord! : rec) : [...allAttendance];

    localStorage.setItem('attendance', JSON.stringify(updatedAttendance));
    window.dispatchEvent(new Event('storage')); // Notify other tabs
  };


  if (!teacher) {
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
          <CardTitle>Mis Grupos - Registro de Asistencia</CardTitle>
          <CardDescription>
            Hola, {teacher.name}. Registra tu entrada y salida para cada uno de tus grupos asignados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teacher.groups.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teacher.groups.map(g => {
                const record = getRecordForGroup(g.grade, g.group);
                return (
                  <Card key={`${g.grade}-${g.group}`}>
                    <CardHeader>
                      <CardTitle className="text-xl">Grupo: {g.grade}° {g.group}</CardTitle>
                      <CardDescription>Asistencia para hoy: {format(new Date(), 'dd/MM/yyyy')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold">Entrada:</h4>
                        <p>{record?.checkIn ? format(new Date(record.checkIn), 'HH:mm:ss') : 'Pendiente'}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold">Salida:</h4>
                        <p>{record?.checkOut ? format(new Date(record.checkOut), 'HH:mm:ss') : 'Pendiente'}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleTimeRecord(g.grade, g.group, 'checkIn')} disabled={!!record?.checkIn} className="w-full">
                          Registrar Entrada
                        </Button>
                        <Button onClick={() => handleTimeRecord(g.grade, g.group, 'checkOut')} disabled={!record?.checkIn || !!record?.checkOut} className="w-full" variant="outline">
                          Registrar Salida
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No tienes grupos asignados.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
