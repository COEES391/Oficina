'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { teachers, type Teacher, type Student } from '@/lib/data'

type StudentAttendanceRecord = {
  studentId: string
  studentName: string
  teacherRfc: string
  grade: string
  group: string
  date: string // YYYY-MM-DD
  status: 'presente' | 'ausente'
  timestamp: string
}

export default function AdminPage() {
  const router = useRouter()
  const [attendance, setAttendance] = useState<StudentAttendanceRecord[]>([])
  const [teacherData] = useState<Teacher[]>(teachers)

  useEffect(() => {
    const rfc = localStorage.getItem('userRfc')
    if (rfc !== 'ADMIN') {
      router.push('/dashboard')
    } else {
      const storedAttendance = JSON.parse(localStorage.getItem('student_attendance') || '[]')
      setAttendance(storedAttendance)
    }
  }, [router])

  const getTeacherName = (rfc: string) => {
    const teacher = teacherData.find(t => t.rfc === rfc);
    return teacher ? teacher.name : rfc;
  }

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      attendance.map(rec => ({
        Profesor: getTeacherName(rec.teacherRfc),
        RFC: rec.teacherRfc,
        Grado: rec.grade,
        Grupo: rec.group,
        Alumno: rec.studentName,
        Fecha: rec.date,
        Estatus: rec.status,
        'Hora de Registro': format(new Date(rec.timestamp), 'HH:mm:ss'),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Asistencia de Alumnos");
    XLSX.writeFile(workbook, "reporte_asistencia_alumnos.xlsx");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Panel de Administrador - Asistencia de Alumnos</CardTitle>
        <CardDescription>
          Aquí puedes ver y descargar todos los registros de asistencia de los alumnos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={downloadExcel} className="mb-4">
          Descargar Reporte Completo en Excel
        </Button>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profesor</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Alumno</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estatus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.length > 0 ? attendance.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((rec) => (
                <TableRow key={`${rec.studentId}-${rec.date}`}>
                  <TableCell className="font-medium">{getTeacherName(rec.teacherRfc)}</TableCell>
                  <TableCell>{rec.grade}° {rec.group}</TableCell>
                  <TableCell>{rec.studentName}</TableCell>
                  <TableCell>{format(new Date(rec.timestamp), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                     <span className={`px-2 py-1 text-xs rounded-full ${rec.status === 'presente' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {rec.status}
                    </span>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No hay registros de asistencia.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
