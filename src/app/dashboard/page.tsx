"use client";

import { useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { attendanceRecords as initialRecords, courses, users } from "@/lib/data";
import type { AttendanceRecord } from "@/lib/data";

// Assuming a user is logged in. In a real app, this would come from session.
const currentUser = users[1];

export default function DashboardPage() {
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [userRecords, setUserRecords] = useState<AttendanceRecord[]>(
    initialRecords.filter(r => r.rfc === currentUser.rfc).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  );
  const { toast } = useToast();

  const handleAttendance = (type: "entrada" | "salida") => {
    if (!selectedCourse) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, selecciona un curso.",
      });
      return;
    }
    const newRecord: AttendanceRecord = {
      id: (userRecords.length + 1).toString(),
      rfc: currentUser.rfc,
      userName: currentUser.name,
      course: courses.find(c => c.id === selectedCourse)?.name || 'Curso Desconocido',
      timestamp: new Date(),
      type,
    };
    
    setUserRecords(prev => [newRecord, ...prev]);

    toast({
      title: "Registro Exitoso",
      description: `Se ha registrado tu ${type} a las ${format(newRecord.timestamp, 'HH:mm:ss')}.`,
      action: <span className="p-2 rounded-full bg-green-500/20">{type === 'entrada' ? <LogIn className="h-5 w-5 text-green-700"/> : <LogOut className="h-5 w-5 text-red-700" />}</span>
    });
  };

  return (
    <div className="grid gap-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Registrar Asistencia</CardTitle>
          <CardDescription>
            Selecciona el curso y registra tu entrada o salida.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <Select onValueChange={setSelectedCourse} value={selectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un curso..." />
              </SelectTrigger>
              <SelectContent>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => handleAttendance("entrada")} className="w-full sm:w-auto" variant="outline">
              <LogIn className="mr-2 h-4 w-4" /> Registrar Entrada
            </Button>
            <Button onClick={() => handleAttendance("salida")} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
              <LogOut className="mr-2 h-4 w-4" /> Registrar Salida
            </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Mi Actividad Reciente</CardTitle>
          <CardDescription>
            Tus últimos 5 registros de asistencia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead className="text-right">Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRecords.slice(0, 5).map(record => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.course}</TableCell>
                  <TableCell>{format(record.timestamp, "d 'de' MMMM, yyyy", { locale: es })}</TableCell>
                  <TableCell>{format(record.timestamp, "HH:mm:ss")}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={record.type === "entrada" ? "default" : "secondary"} className={record.type === "entrada" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {userRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No hay registros de asistencia.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
