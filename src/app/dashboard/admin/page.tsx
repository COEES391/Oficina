'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { teachers, type Teacher } from '@/lib/data'

type AttendanceRecord = {
  id: string
  teacherRfc: string
  grade: string
  group: string
  checkIn: string | null
  checkOut: string | null
}

export default function AdminPage() {
  const router = useRouter()
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [teacherData] = useState<Teacher[]>(teachers)

  useEffect(() => {
    const rfc = localStorage.getItem('userRfc')
    if (rfc !== 'ADMIN') {
      router.push('/dashboard')
    } else {
      const storedAttendance = JSON.parse(localStorage.getItem('attendance') || '[]')
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
        'Hora de Entrada': rec.checkIn ? format(new Date(rec.checkIn), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        'Hora de Salida': rec.checkOut ? format(new Date(rec.checkOut), 'yyyy-MM-dd HH:mm:ss') : 'N/A'
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registros de Asistencia");
    XLSX.writeFile(workbook, "reporte_asistencia_completo.xlsx");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Panel de Administrador</CardTitle>
        <CardDescription>
          Aquí puedes ver y descargar todos los registros de asistencia de los profesores.
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
                <TableHead>Entrada</TableHead>
                <TableHead>Salida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.length > 0 ? attendance.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell className="font-medium">{getTeacherName(rec.teacherRfc)}</TableCell>
                  <TableCell>{rec.grade}° {rec.group}</TableCell>
                  <TableCell>{rec.checkIn ? format(new Date(rec.checkIn), 'dd/MM/yy HH:mm') : '-'}</TableCell>
                  <TableCell>{rec.checkOut ? format(new Date(rec.checkOut), 'dd/MM/yy HH:mm') : '-'}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
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
