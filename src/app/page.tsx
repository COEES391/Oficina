'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { placeholderImages } from '@/lib/placeholder-images'
import { Eye, EyeOff, Lock, User, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const [mounted, setMounted] = useState(false)
  const [rfc, setRfc] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoData = placeholderImages.find(img => img.id === 'desysa-logo') || placeholderImages[0]

  const handleLogin = () => {
    const cleanRfc = rfc.trim().toUpperCase()
    if (cleanRfc === 'BENG8009206U6' && password === 'Coees2026') {
      localStorage.setItem('userRfc', cleanRfc)
      toast({ title: "Acceso concedido", description: "Bienvenido al Sistema de Gestión de Planeación." })
      router.push('/dashboard')
    } else {
      toast({ variant: "destructive", title: "Credenciales incorrectas", description: "El RFC o la contraseña son inválidos." })
    }
  }

  if (!mounted) return null

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#f0f2f5] overflow-hidden p-4">
      {/* Background patterns for a more attractive look */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent blur-[120px]" />
      </div>

      <Card className="w-full max-w-md shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border-none bg-white/90 backdrop-blur-xl rounded-[2.5rem] overflow-hidden relative z-10">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-primary" />
        <CardHeader className="text-center pt-12 pb-8 space-y-6">
          <div className="mx-auto relative h-32 w-32 group">
            <div className="absolute inset-0 bg-primary/10 rounded-3xl rotate-6 group-hover:rotate-12 transition-transform duration-500" />
            <div className="absolute inset-0 bg-white rounded-3xl border-2 border-primary/5 flex items-center justify-center p-3 shadow-sm relative z-10">
              <Image 
                src={logoData.imageUrl} 
                alt="Logo DESySA" 
                fill
                className="object-contain p-4"
                data-ai-hint="planning logo"
              />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black tracking-tighter text-primary uppercase leading-tight">
              Sistema de Gestión <br /> Integral
            </CardTitle>
            <div className="flex items-center justify-center gap-2">
              <span className="h-px w-8 bg-accent" />
              <CardDescription className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.3em]">
                Planeación Edoméx
              </CardDescription>
              <span className="h-px w-8 bg-accent" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-10">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="rfc" className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 tracking-widest pl-1">
                <User className="h-3 w-3 text-primary" /> RFC de Usuario
              </Label>
              <Input
                id="rfc"
                placeholder="Ingresa tu RFC"
                className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 focus:border-primary focus:ring-primary/20 text-sm font-bold uppercase transition-all"
                value={rfc}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 tracking-widest pl-1">
                <Lock className="h-3 w-3 text-primary" /> Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-14 rounded-2xl bg-slate-50/50 pr-12 border-slate-200 focus:border-primary focus:ring-primary/20 text-sm font-bold transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-10 w-10 text-slate-400 hover:text-primary rounded-xl"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-4 pb-12 px-10">
          <Button className="w-full h-16 text-xs font-black uppercase tracking-[0.2em] rounded-2xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95" onClick={handleLogin}>
            Ingresar al Portal
          </Button>
        </CardFooter>
      </Card>
      
      <div className="absolute bottom-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        Gobierno del Estado de México • Dirección de Educación Secundaria
      </div>
    </div>
  )
}