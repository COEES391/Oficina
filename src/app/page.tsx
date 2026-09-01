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
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { type AppUser } from '@/lib/planning-data'

export default function LoginPage() {
  const [mounted, setMounted] = useState(false)
  const [rfc, setRfc] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoData = placeholderImages.find(img => img.id === 'desysa-logo') || placeholderImages[0]

  const handleLogin = async () => {
    const cleanRfc = rfc.trim().toUpperCase()
    if (!cleanRfc || !password) {
      toast({ variant: "destructive", title: "Campos incompletos", description: "Ingrese su RFC y contraseña oficial." })
      return
    }

    setIsLoading(true)
    try {
      // Acceso Maestro
      if (cleanRfc === 'COEES' && password === '123456') {
        localStorage.setItem('userRfc', cleanRfc)
        toast({ title: "Acceso maestro", description: "Bienvenido al Centro de Control Integral." })
        router.push('/dashboard/programas') 
        return
      }
      
      // Usuario Programas: CISF840114L34 / Chimal12
      if (cleanRfc === 'CISF840114L34' && password === 'Chimal12') {
        localStorage.setItem('userRfc', cleanRfc)
        toast({ title: "Identidad validada", description: "Bienvenido al Módulo de Programas." })
        router.push('/dashboard/programas')
        return
      }

      // Usuario Soporte: HEAS740508Q23 / Soporte12
      if (cleanRfc === 'HEAS740508Q23' && password === 'Soporte12') {
        localStorage.setItem('userRfc', cleanRfc)
        toast({ title: "Identidad validada", description: "Bienvenido al Módulo de Soporte Técnico." })
        router.push('/dashboard/soporte')
        return
      }
      
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('rfc', '==', cleanRfc), where('password', '==', password))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as AppUser
        localStorage.setItem('userRfc', cleanRfc)
        toast({ title: "Identidad validada", description: `Bienvenido al sistema, ${userData.name}.` })
        
        const privs = userData.privileges || []
        if (privs.includes('programas')) {
          router.push('/dashboard/programas')
        } else if (privs.includes('soporte')) {
          router.push('/dashboard/soporte')
        } else if (privs.includes('capacitacion')) {
          router.push('/dashboard/capacitacion')
        } else if (privs.includes('planeacion')) {
          router.push('/dashboard')
        } else {
          router.push('/dashboard/' + privs[0])
        }
      } else {
        toast({ 
          variant: "destructive", 
          title: "Acceso denegado", 
          description: "Las credenciales ingresadas no son correctas." 
        })
      }
    } catch (error: any) {
      console.error("Login error:", error)
      toast({ 
        variant: "destructive", 
        title: "Error de sistema", 
        description: "No se pudo establecer conexión con el servidor de seguridad." 
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#ddc8a4] overflow-hidden p-4 font-sans">
      <div className="absolute top-0 left-0 w-full h-full opacity-15 pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] rounded-full bg-[#9f2241] blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] rounded-full bg-[#B38E5D] blur-[160px]" />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-none bg-white/95 backdrop-blur-2xl rounded-[3.5rem] overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <CardHeader className="text-center pt-10 pb-4 space-y-6">
          <div className="mx-auto relative h-32 w-32 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white transition-transform duration-700 hover:scale-110 bg-white">
            <Image src={logoData.imageUrl} alt="COEES Logo" fill className="object-cover" priority />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black tracking-tighter text-[#9f2241]">Portal Integral</CardTitle>
            <CardDescription className="text-slate-500 font-bold text-xs tracking-widest uppercase">Gestión Técnica Coees Edoméx</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-10 pb-8">
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-400 pl-2">Identificador de acceso (RFC)</Label>
              <Input 
                placeholder="Ingresar RFC" 
                className="h-14 rounded-2xl bg-slate-50 border-slate-200 text-base font-black px-6 shadow-inner" 
                value={rfc} 
                onChange={(e) => setRfc(e.target.value.toUpperCase())} 
                disabled={isLoading} 
                maxLength={13}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-400 pl-2">Contraseña oficial</Label>
              <div className="relative group">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="h-14 rounded-2xl bg-slate-50 pr-14 border-slate-200 text-base font-bold px-6 shadow-inner" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  disabled={isLoading} 
                />
                <button 
                  type="button" 
                  className="absolute right-4 top-4 h-6 w-6 text-slate-400 hover:text-primary transition-colors" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full h-16 text-sm font-black uppercase tracking-[0.2em] rounded-2xl bg-[#9f2241] hover:bg-[#801a34] text-white shadow-2xl mt-4"
            >
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Iniciar Sesión Oficial"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="pt-0 pb-10 px-10">
           <div className="w-full py-4 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-center gap-3">
             <ShieldCheck className="h-4 w-4 text-emerald-500" />
             <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Acceso Seguro Ciclo 2025-2026</span>
           </div>
        </CardFooter>
      </Card>
    </div>
  )
}
