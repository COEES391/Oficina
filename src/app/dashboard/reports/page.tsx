"use client";

import { useState, useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { attendanceRecords, courses } from "@/lib/data";

export default function ReportsPage() {
  const [filterDate, setFilterDate] = useState<Date | undefined>();
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [filterRfc, setFilterRfc] = useState<string>("");

  const filteredRecords = useMemo(() => {
    return attendanceRecords
      .filter((record) => {
        const dateMatch = filterDate ? isSameDay(record.timestamp, filterDate) : true;
        const courseMatch = filterCourse === 'all' ? true : courses.find(c => c.name === record.course)?.id === filterCourse;
        const rfcMatch = filterRfc ? record.rfc.toLowerCase().includes(filterRfc.toLowerCase()) : true;
        return dateMatch && courseMatch && rfcMatch;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [filterDate, filterCourse, filterRfc]);

  return (
    <div className="grid gap-8">
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl">Reportes de Asistencia</CardTitle>
                <CardDescription>Filtra y visualiza los registros de asistencia.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <DatePicker date={filterDate} setDate={setFilterDate} className="w-full md:w-auto"/>
                    <Select value={filterCourse} onValueChange={setFilterCourse}>
                        <SelectTrigger className="w-full md:w-[280px]">
                            <SelectValue placeholder="Filtrar por curso..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los cursos</SelectItem>
                            {courses.map(course => (
                                <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input 
                        placeholder="Filtrar por RFC..." 
                        value={filterRfc}
                        onChange={(e) => setFilterRfc(e.target.value)}
                        className="w-full md:w-auto"
                    />
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Resultados</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>RFC</TableHead>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Curso</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Hora</TableHead>
                            <TableHead className="text-right">Tipo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRecords.length > 0 ? (
                            filteredRecords.map(record => (
                                <TableRow key={record.id}>
                                    <TableCell className="font-mono text-xs">{record.rfc}</TableCell>
                                    <TableCell className="font-medium">{record.userName}</TableCell>
                                    <TableCell>{record.course}</TableCell>
                                    <TableCell>{format(record.timestamp, "d MMM yyyy", { locale: es })}</TableCell>
                                    <TableCell>{format(record.timestamp, "HH:mm:ss")}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={record.type === "entrada" ? "default" : "secondary"} className={record.type === "entrada" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                            {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No se encontraron registros con los filtros seleccionados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  )
}
