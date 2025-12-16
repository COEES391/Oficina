'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'

type Registration = {
  rfc: string;
  course: string;
  registrationDate: string;
  checkIn: string | null;
  checkOut: string | null;
  id: string;
};

export default function AdminPage() {
  const router = useRouter()
  const [registrations, setRegistrations] = useState<Registration[]>([])

  useEffect(() => {
    const rfc = localStorage.getItem('userRfc')
    if (rfc !== 'ADMIN') {
      router.push('/dashboard')
    } else {
      const storedRegistrations = JSON.parse(localStorage.getItem('registrations') || '[]')
      setRegistrations(storedRegistrations)
    }
  }, [router])

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      registrations.map(reg => ({
        RFC: reg.rfc,
        Curso: reg.course,
        'Fecha de Inscripción': format(new Date(reg.registrationDate), 'yyyy-MM-dd HH:mm:ss'),
        'Hora de Entrada': reg.checkIn ? format(new Date(reg.checkIn), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        'Hora de Salida': reg.checkOut ? format(new Date(reg.checkOut), 'yyyy-MM-dd HH:mm:ss') : 'N/A'
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");
    XLSX.writeFile(workbook, "reporte_asistencia_completo.xlsx");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Panel de Administrador</CardTitle>
        <CardDescription>
          Aquí puedes ver y descargar todos los registros de asistencia.
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
                <TableHead>RFC</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Salida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.length > 0 ? registrations.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell className="font-medium">{reg.rfc}</TableCell>
                  <TableCell>{reg.course}</TableCell>
                  <TableCell>{reg.checkIn ? format(new Date(reg.checkIn), 'dd/MM/yy HH:mm') : '-'}</TableCell>
                  <TableCell>{reg.checkOut ? format(new Date(reg.checkOut), 'dd/MM/yy HH:mm') : '-'}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No hay registros.
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
