'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import * as XLSX from 'xlsx'

type Registration = {
  rfc: string
  courses: string[]
  date: string
}

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
        Cursos: reg.courses.join(', '),
        Fecha: reg.date
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");
    XLSX.writeFile(workbook, "reporte_asistencia.xlsx");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Panel de Administrador</CardTitle>
        <CardDescription>
          Aquí puedes ver y descargar los registros de asistencia.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={downloadExcel} className="mb-4">
          Descargar Reporte en Excel
        </Button>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RFC</TableHead>
                <TableHead>Cursos</TableHead>
                <TableHead>Fecha de Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((reg, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{reg.rfc}</TableCell>
                  <TableCell>{reg.courses.join(', ')}</TableCell>
                  <TableCell>{reg.date}</TableCell>
                </TableRow>
              ))}
              {registrations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
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
