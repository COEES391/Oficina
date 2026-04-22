'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { placeholderImages } from '@/lib/placeholder-images'

export default function LoginPage() {
  const [rfc, setRfc] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  const logoData = placeholderImages.find(img => img.id === 'desysa-logo') || placeholderImages[0]

  const handleLogin = () => {
    if (rfc.trim()) {
      localStorage.setItem('userRfc', rfc.toUpperCase())
      router.push('/dashboard')
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, introduce tu RFC para acceder.",
      })
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto relative h-28 w-28 overflow-hidden rounded-xl border-2 border-primary/10 bg-white flex items-center justify-center p-2 shadow-sm">
            <Image 
              src={logoData.imageUrl} 
              alt="Logo DESySA" 
              fill
              className="object-contain"
              data-ai-hint="planning logo"
            />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-primary">Oficina de Planeación</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
              Soporte, Capacitación y Programas Educativos
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rfc" className="text-sm font-semibold">RFC de Usuario</Label>
              <Input
                id="rfc"
                placeholder="Ingresa tu RFC"
                className="h-11 uppercase font-mono"
                value={rfc}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full h-11 text-base font-semibold" onClick={handleLogin}>
            Ingresar al Sistema
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
