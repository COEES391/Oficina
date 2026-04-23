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
import { Eye, EyeOff, Lock, User } from 'lucide-react'

export default function LoginPage() {
  const [rfc, setRfc] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const logoData = placeholderImages.find(img => img.id === 'desysa-logo') || placeholderImages[0]

  const handleLogin = () => {
    const cleanRfc = rfc.trim().toUpperCase()
    
    if (cleanRfc === 'BENG8009206U6' && password === 'Coees2026') {
      localStorage.setItem('userRfc', cleanRfc)
      toast({
        title: "Acceso concedido",
        description: "Bienvenido al Sistema de Gestión de Planeación.",
      })
      router.push('/dashboard')
    } else {
      toast({
        variant: "destructive",
        title: "Credenciales incorrectas",
        description: "El RFC o la contraseña son inválidos. Por favor, intente de nuevo.",
      })
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary bg-white">
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
            <CardTitle className="text-2xl font-black tracking-tight text-primary uppercase">Oficina de Planeación</CardTitle>
            <CardDescription className="text-muted-foreground font-bold text-xs uppercase tracking-widest">
              Soporte, Capacitación y Programas
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rfc" className="text-xs font-black uppercase text-slate-600 flex items-center gap-2">
                <User className="h-3 w-3" /> RFC de Usuario
              </Label>
              <Input
                id="rfc"
                placeholder="Ingresa tu RFC"
                className="h-11 uppercase font-mono border-slate-200 focus:border-primary"
                value={rfc}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-black uppercase text-slate-600 flex items-center gap-2">
                <Lock className="h-3 w-3" /> Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-11 pr-10 border-slate-200 focus:border-primary"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-11 w-11 text-slate-400 hover:text-primary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full h-12 text-sm font-black uppercase tracking-widest shadow-lg" onClick={handleLogin}>
            Ingresar al Sistema
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
