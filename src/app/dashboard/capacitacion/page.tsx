'use client'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { trainingData } from "@/lib/planning-data"
import { GraduationCap } from "lucide-react"

export default function TrainingPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="p-2 bg-blue-100 rounded-full">
            <GraduationCap className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <CardTitle>Registro de Capacitación</CardTitle>
            <CardDescription>Histórico de cursos y talleres impartidos al personal docente.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título del Curso</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead className="text-center">Asistentes</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainingData.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-semibold">{session.title}</TableCell>
                  <TableCell>{session.instructors}</TableCell>
                  <TableCell className="text-center">{session.attendees}</TableCell>
                  <TableCell>{session.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
