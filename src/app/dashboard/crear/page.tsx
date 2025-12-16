'use client'
import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

const courses = [
  'ChatGPT: En el Aprendizaje',
  'ChatPDF: El asistente Virtual para tu Material Educativo',
  'Kahoot! Diviertete evaluando',
  'Canva: Presentaciones visuales y creativas',
  'Excel en línea para la gestión educativa',
  'Recursos Tecnologicos para transformar la evaluación y creatividad en el aula',
  'Potencia tu procuntividad digital con Microsoft Office 365',
  'Microsoft 365: operaciones básicas',
  'Tic y Tac: usando las herramientas clave',
]

export default function CoursesPage() {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const { toast } = useToast()

  const handleCheckboxChange = (course: string) => {
    setSelectedCourses((prev) =>
      prev.includes(course)
        ? prev.filter((c) => c !== course)
        : [...prev, course]
    )
  }

  const handleRegister = () => {
    const userRfc = localStorage.getItem('userRfc')
    if (selectedCourses.length > 0 && userRfc) {
      const registration = {
        rfc: userRfc,
        courses: selectedCourses,
        date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      }
      
      // Get existing registrations or initialize empty array
      const existingRegistrations = JSON.parse(localStorage.getItem('registrations') || '[]')
      
      // Add new registration
      existingRegistrations.push(registration)
      
      // Save back to localStorage
      localStorage.setItem('registrations', JSON.stringify(existingRegistrations))
      
      toast({
        title: 'Registro Exitoso',
        description: `Te has inscrito a ${selectedCourses.length} curso(s).`,
      })
      setSelectedCourses([])
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor, selecciona al menos un curso.',
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cursos Disponibles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {courses.map((course) => (
          <div key={course} className="flex items-center space-x-2">
            <Checkbox
              id={course}
              checked={selectedCourses.includes(course)}
              onCheckedChange={() => handleCheckboxChange(course)}
            />
            <Label htmlFor={course} className="text-sm font-medium leading-none">
              {course}
            </Label>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button onClick={handleRegister}>Inscribirse</Button>
      </CardFooter>
    </Card>
  )
}
