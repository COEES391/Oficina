'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from '@/hooks/use-toast'
import { teachers, type Teacher, type Student, type Group } from '@/lib/data'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft } from 'lucide-react'

type StudentAttendanceRecord = {
  studentId: string;
  studentName: string;
  teacherRfc: string;
  grade: string;
  group: string;
  date: string; // YYYY-MM-DD
  status: 'presente' | 'ausente';
  timestamp: string; // ISO String
};

export default function AttendancePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const grade = Array.isArray(params.grade) ? params.grade[0] : params.grade
  const group = Array.isArray(params.group) ? params.group[0] : params.group

  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null)
  const [attendance, setAttendance] = useState<Record<string, StudentAttendanceRecord>>({})
  
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const loadData = useCallback(() => {
    const rfc = localStorage.getItem('userRfc')
    if (!rfc) {
      router.push('/')
      return
    }

    const foundTeacher = teachers.find(t => t.rfc.toUpperCase() === rfc.toUpperCase())
    if (!foundTeacher) {
      router.push('/dashboard')
      return
    }
    setTeacher(foundTeacher)

    const foundGroup = foundTeacher.groups.find(g => g.grade === grade && g.group === group)
    if (!foundGroup) {
      toast({ variant: "destructive", title: "Error", description: "Grupo no encontrado o no asignado a ti." })
      router.push('/dashboard')
      return
    }
    setCurrentGroup(foundGroup)

    // Load attendance from localStorage
    const allAttendance: StudentAttendanceRecord[] = JSON.parse(localStorage.getItem('student_attendance') || '[]')
    const todayGroupAttendance = allAttendance.filter(rec => rec.date === todayStr && rec.grade === grade && rec.group === group)
    
    const attendanceMap: Record<string, StudentAttendanceRecord> = {}
    todayGroupAttendance.forEach(rec => {
      attendanceMap[rec.studentId] = rec
    })
    setAttendance(attendanceMap)
  }, [grade, group, router, toast, todayStr])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSetAttendance = (student: Student, status: 'presente' | 'ausente') => {
    if (!teacher || !currentGroup) return

    const now = new Date()
    const record: StudentAttendanceRecord = {
      studentId: student.id,
      studentName: student.name,
      teacherRfc: teacher.rfc,
      grade: currentGroup.grade,
      group: currentGroup.group,
      date: todayStr,
      status,
      timestamp: now.toISOString(),
    }

    // Update state
    setAttendance(prev => ({ ...prev, [student.id]: record }))

    // Update localStorage
    const allAttendance: StudentAttendanceRecord[] = JSON.parse(localStorage.getItem('student_attendance') || '[]')
    const otherRecords = allAttendance.filter(rec => !(rec.studentId === student.id && rec.date === todayStr))
    const newAttendance = [...otherRecords, record]
    localStorage.setItem('student_attendance', JSON.stringify(newAttendance))
    
    toast({
      title: "Registro exitoso",
      description: `${student.name} marcado como ${status}.`,
    })
  }
  
  const getAttendanceStatus = (studentId: string) => {
    return attendance[studentId] || null;
  };

  if (!currentGroup || !teacher) {
    return <Card><CardContent>Cargando...</CardContent></Card>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
           <Button variant="outline" size="icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>Pase de Lista - Grupo {grade}° {group}</CardTitle>
            <CardDescription>
              Fecha: {format(new Date(), "eeee, d 'de' MMMM 'de' yyyy", { locale: es })}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del Alumno</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentGroup.students.sort((a,b) => a.name.localeCompare(b.name)).map(student => {
                const record = getAttendanceStatus(student.id);
                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>
                      {record ? (
                         <span className={`px-2 py-1 text-xs rounded-full ${record.status === 'presente' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {record.status} @ {format(new Date(record.timestamp), 'HH:mm')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Pendiente</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button 
                          size="sm" 
                          variant={record?.status === 'presente' ? 'default' : 'outline'}
                          onClick={() => handleSetAttendance(student, 'presente')}
                          disabled={record?.status === 'presente'}
                        >
                          Presente
                        </Button>
                        <Button 
                          size="sm" 
                          variant={record?.status === 'ausente' ? 'destructive' : 'outline'}
                          onClick={() => handleSetAttendance(student, 'ausente')}
                          disabled={record?.status === 'ausente'}
                        >
                          Ausente
                        </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
