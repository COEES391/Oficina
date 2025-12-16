'use client'
import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

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

type Registration = {
  rfc: string;
  course: string;
  registrationDate: string;
  checkIn: string | null;
  checkOut: string | null;
  id: string;
};

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
      
      const existingRegistrations: Registration[] = JSON.parse(localStorage.getItem('registrations') || '[]')
      const newRegistrations: Registration[] = [];

      selectedCourses.forEach(course => {
        // Check if user is already registered for this course
        const isAlreadyRegistered = existingRegistrations.some(reg => reg.rfc === userRfc && reg.course === course);

        if (!isAlreadyRegistered) {
          const registration: Registration = {
            rfc: userRfc,
            course: course,
            registrationDate: new Date().toISOString(),
            checkIn: null,
            checkOut: null,
            id: `${userRfc}-${course}-${new Date().getTime()}` // Unique ID
          }
          newRegistrations.push(registration);
        } else {
          toast({
            variant: 'destructive',
            title: 'Inscripción Omitida',
            description: `Ya estabas inscrito en el curso: ${course}.`,
          })
        }
      });
      
      if(newRegistrations.length > 0) {
        const allRegistrations = [...existingRegistrations, ...newRegistrations];
        localStorage.setItem('registrations', JSON.stringify(allRegistrations));
        
        toast({
          title: 'Registro Exitoso',
          description: `Te has inscrito a ${newRegistrations.length} nuevo(s) curso(s).`,
        })
        setSelectedCourses([])

        // Trigger storage event to update other tabs/components
        window.dispatchEvent(new Event('storage'));
      }

    } else if (!userRfc) {
       toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: 'No se ha encontrado tu RFC. Por favor, inicia sesión de nuevo.',
      })
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
        <CardTitle>Inscripción a Cursos</CardTitle>
        <CardDescription>Selecciona los cursos a los que deseas inscribirte.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {courses.map((course) => (
          <div key={course} className="flex items-center space-x-3">
            <Checkbox
              id={course}
              checked={selectedCourses.includes(course)}
              onCheckedChange={() => handleCheckboxChange(course)}
            />
            <Label htmlFor={course} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {course}
            </Label>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button onClick={handleRegister} disabled={selectedCourses.length === 0}>
          Inscribirse a cursos seleccionados
        </Button>
      </CardFooter>
    </Card>
  )
}
