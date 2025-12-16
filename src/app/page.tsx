'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { BookCopy } from 'lucide-react'

export default function LoginPage() {
  const [rfc, setRfc] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = () => {
    if (rfc.trim()) {
      // For now, any RFC is valid, ADMIN is a special user
      localStorage.setItem('userRfc', rfc.toUpperCase())
      router.push('/dashboard')
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, introduce tu RFC.",
      })
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
           <div className="mx-auto bg-primary text-primary-foreground rounded-full h-24 w-24 flex items-center justify-center">
            <BookCopy className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-bold mt-4">CCT Asistencia</CardTitle>
          <CardDescription>Inicia sesión con tu RFC para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rfc">RFC</Label>
              <Input
                id="rfc"
                placeholder="Introduce tu RFC"
                value={rfc}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleLogin}>
            Iniciar Sesión
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
