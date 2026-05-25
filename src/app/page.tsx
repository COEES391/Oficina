
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
    
    if (cleanRfc === 'COEES' && password === '123456') {
      localStorage.setItem('userRfc', cleanRfc)
      toast({ title: "Acceso concedido", description: "Bienvenido al Sistema Integral COEES." })
      router.push('/dashboard')
    } else if (cleanRfc === 'CEDITORIAL' && password === 'SEIEM') {
      localStorage.setItem('userRfc', cleanRfc)
      toast({ title: "Acceso Administrativo", description: "Bienvenido, Administrador Editorial COEES." })
      router.push('/dashboard')
    } else {
      toast({ variant: "destructive", title: "Credenciales incorrectas", description: "El usuario o la contraseña son inválidos." })
    }
  }

  if (!mounted) return null

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-transparent overflow-hidden p-4">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary blur-[160px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent blur-[160px]" />
      </div>

      <Card className="w-full max-w-md shadow-[0_48px_96px_-12px_rgba(98,17,50,0.2)] border-none bg-white/80 backdrop-blur-2xl rounded-[3.5rem] overflow-hidden relative z-10 border-t-8 border-t-primary">
        <CardHeader className="text-center pt-12 pb-6 space-y-6">
          {/* Logo Container - Styled to match the requested look */}
          <div className="mx-auto relative h-24 w-full flex items-center justify-center group">
            <div className="relative h-20 w-48 transition-transform duration-500 group-hover:scale-105">
              <Image 
                src={logoData.imageUrl} 
                alt="Logo COEES Edoméx 2026" 
                fill
                className="object-contain filter contrast-125 saturate-150"
                data-ai-hint="green technology logo education"
                priority
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col items-center">
               <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.4em] mb-1">COEES 2026</span>
               <CardTitle className="text-4xl font-black tracking-tighter text-primary uppercase leading-[0.9]">
                 Portal <br /> Integral
               </CardTitle>
            </div>
            
            <div className="flex flex-col items-center justify-center gap-3">
              <span className="h-0.5 w-16 bg-accent/30 rounded-full" />
              <CardDescription className="text-slate-500 font-black text-[9px] uppercase tracking-[0.15em] text-center leading-tight max-w-[300px]">
                COMPUTACIÓN ELECTRÓNICA EN LA EDUCACIÓN SECUNDARIA
              </CardDescription>
              <span className="h-0.5 w-16 bg-accent/30 rounded-full" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-10 pb-8">
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-5">
            <div className="space-y-2.5">
              <Label htmlFor="rfc" className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 tracking-widest pl-2">
                <User className="h-3.5 w-3.5 text-primary" /> Identificador Operativo
              </Label>
              <Input
                id="rfc"
                placeholder="INGRESAR USUARIO"
                className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus:border-primary focus:ring-primary/20 text-sm font-black uppercase px-6 shadow-inner transition-all"
                value={rfc || ''}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 tracking-widest pl-2">
                <Lock className="h-3.5 w-3.5 text-primary" /> Contraseña Oficial
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-14 rounded-2xl bg-slate-50 pr-14 border-slate-200 focus:border-primary focus:ring-primary/20 text-sm font-bold px-6 shadow-inner transition-all"
                  value={password || ''}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-2 h-10 w-10 text-slate-400 hover:text-primary rounded-xl"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full h-16 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl bg-primary hover:bg-primary/95 shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 text-white">
              Entrar al Portal
            </Button>
          </form>
        </CardContent>

        <CardFooter className="pt-0 pb-10 px-10">
           <div className="w-full py-4 bg-slate-50/60 rounded-2xl border border-slate-100 flex items-center justify-center gap-3 shadow-inner">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">SISTEMA SEGURO • ESTADO DE MÉXICO 2026</span>
           </div>
        </CardFooter>
      </Card>
      
      <div className="absolute bottom-6 text-center w-full">
        <p className="text-[9px] font-black text-primary/40 uppercase tracking-[0.5em] opacity-80">
          DIRECCIÓN DE EDUCACIÓN SECUNDARIA • SERVICIOS DE APOYO
        </p>
      </div>
    </div>
  )
}
