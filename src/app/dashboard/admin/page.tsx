'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { teachers, type Teacher, type Student } from '@/lib/data'
import { Pencil, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  const { toast } = useToast()
  const [attendance, setAttendance] = useState<StudentAttendanceRecord[]>([])
  const [teacherData] = useState<Teacher[]>(teachers)
  const [editingRecord, setEditingRecord] = useState<StudentAttendanceRecord | null>(null)

  useEffect(() => {
    const rfc = localStorage.getItem('userRfc')
    if (rfc !== 'ADMIN' && rfc !== 'COEES') {
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

  const handleDelete = (studentId: string, date: string) => {
    const updated = attendance.filter(rec => !(rec.studentId === studentId && rec.date === date))
    setAttendance(updated)
    localStorage.setItem('student_attendance', JSON.stringify(updated))
    toast({ title: "Registro eliminado", description: "La asistencia ha sido borrada." })
  }

  const handleUpdateStatus = () => {
    if (!editingRecord) return;
    const updated = attendance.map(rec => 
      (rec.studentId === editingRecord.studentId && rec.date === editingRecord.date) ? editingRecord : rec
    );
    setAttendance(updated)
    localStorage.setItem('student_attendance', JSON.stringify(updated))
    setEditingRecord(null)
    toast({ title: "Registro actualizado" })
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="uppercase font-black text-primary">Panel de Administrador - Asistencia de Alumnos</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-widest">
            Aquí puedes ver, descargar y gestionar todos los registros de asistencia de los alumnos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadExcel} className="mb-6 btn-institutional h-10 px-8">
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Descargar Reporte Completo en Excel
          </Button>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase">Profesor</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Grupo</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Alumno</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Fecha</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Estatus</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase pr-8">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.length > 0 ? attendance.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((rec) => (
                  <TableRow key={`${rec.studentId}-${rec.date}`} className="hover:bg-slate-50 transition-colors group">
                    <TableCell className="text-[11px] font-black text-slate-700 uppercase">{getTeacherName(rec.teacherRfc)}</TableCell>
                    <TableCell className="text-[11px] font-bold text-slate-500">{rec.grade}° {rec.group}</TableCell>
                    <TableCell className="text-[11px] font-black text-primary uppercase">{rec.studentName}</TableCell>
                    <TableCell className="text-[11px] font-mono">{format(new Date(rec.timestamp), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                       <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-full ${rec.status === 'presente' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {rec.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg transition-all" onClick={() => setEditingRecord(rec)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" onClick={() => handleDelete(rec.studentId, rec.date)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 opacity-30 text-xs font-black uppercase">
                      No hay registros de asistencia.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-[2.5rem]">
           <DialogHeader>
              <DialogTitle className="uppercase font-black text-primary">Corregir Estatus</DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-widest">Cambie el estatus de asistencia del alumno.</DialogDescription>
           </DialogHeader>
           {editingRecord && (
             <div className="py-6 space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border">
                   <p className="text-[10px] font-black text-slate-400 uppercase">Alumno:</p>
                   <p className="text-sm font-black text-slate-800 uppercase">{editingRecord.studentName}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Estatus de Asistencia</Label>
                  <Select value={editingRecord.status} onValueChange={(val: any) => setEditingRecord({...editingRecord, status: val})}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="presente" className="text-xs font-black text-emerald-600 uppercase">PRESENTE</SelectItem>
                       <SelectItem value="ausente" className="text-xs font-black text-rose-600 uppercase">AUSENTE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>
           )}
           <DialogFooter>
              <Button variant="ghost" onClick={() => setEditingRecord(null)} className="h-12 px-8 text-xs font-black uppercase">Cancelar</Button>
              <Button onClick={handleUpdateStatus} className="btn-institutional h-12 px-10 text-xs">Guardar Cambios</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
