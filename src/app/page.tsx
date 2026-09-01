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
import { Eye, EyeOff, Loader2 } from 'lucide-react'
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
      toast({ variant: "destructive", title: "Campos vacíos", description: "Ingrese su identificador y contraseña." })
      return
    }

    setIsLoading(true)
    try {
      // 1. Verificación de Usuarios Maestros Locales (Alta Prioridad)
      if (cleanRfc === 'COEES' && password === '123456') {
        localStorage.setItem('userRfc', cleanRfc)
        toast({ title: "Acceso Maestro COEES", description: "Identidad verificada. Bienvenido al Sistema Integral." })
        router.push('/dashboard/programas') 
        return
      }
      
      if (cleanRfc === 'CEDITORIAL' && password === '123456') {
        localStorage.setItem('userRfc', cleanRfc)
        toast({ title: "Acceso Editorial", description: "Bienvenido al área de gestión editorial." })
        router.push('/dashboard/programas') 
        return
      }

      // 2. Consulta en Tiempo Real a la Nube (Usuarios Registrados)
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('rfc', '==', cleanRfc), where('password', '==', password))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as AppUser
        localStorage.setItem('userRfc', cleanRfc)
        toast({ title: "Identidad Validada", description: `Bienvenido, ${userData.name}.` })
        
        const privs = userData.privileges || []
        
        // REDIRECCIÓN INTELIGENTE BASADA EN PRIVILEGIOS
        if (privs.includes('programas') || privs.includes('bitacora-atres')) {
          router.push('/dashboard/programas')
        } else if (privs.includes('soporte')) {
          router.push('/dashboard/soporte')
        } else if (privs.includes('capacitacion')) {
          router.push('/dashboard/capacitacion')
        } else if (privs.includes('planeacion')) {
          router.push('/dashboard')
        } else if (privs.includes('base-cct') || privs.includes('base-participantes')) {
          router.push('/dashboard/base-cct')
        } else {
          router.push('/dashboard/base-cct')
        }
      } else {
        toast({ 
          variant: "destructive", 
          title: "Acceso Denegado", 
          description: "Las credenciales ingresadas no coinciden con nuestros registros oficiales." 
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({ 
        variant: "destructive", 
        title: "Error de Sincronización", 
        description: "No se pudo conectar con la red de autenticación. Verifique su acceso a internet." 
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#ddc8a4] overflow-hidden p-4 font-sans">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#9f2241] blur-[160px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#B38E5D] blur-[160px]" />
      </div>

      <Card className="w-full max-w-md shadow-[0_48px_96px_-12px_rgba(98,17,50,0.2)] border-none bg-white/95 backdrop-blur-2xl rounded-[3rem] overflow-hidden relative z-10">
        <CardHeader className="text-center pt-8 pb-4 space-y-6">
          <div className="mx-auto relative h-32 w-32 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white transition-transform duration-700 hover:scale-110 bg-white">
            <Image src={logoData.imageUrl} alt="COEES Logo" fill className="object-cover" priority />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black tracking-tighter text-[#9f2241] leading-[0.9]">Portal <br /> Integral</CardTitle>
            <CardDescription className="text-slate-500 font-bold text-[10px] tracking-widest uppercase">Computación Electrónica en la Educación Secundaria</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-8 pb-6">
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 pl-2 uppercase">Identificador de Usuario (RFC)</Label>
              <Input 
                placeholder="Ingresar RFC..." 
                className="h-14 rounded-2xl bg-slate-50 border-slate-200 text-sm font-black uppercase px-6 focus:ring-4 focus:ring-primary/5 transition-all" 
                value={rfc} 
                onChange={(e) => setRfc(e.target.value.toUpperCase())} 
                disabled={isLoading} 
                maxLength={13}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 pl-2 uppercase">Contraseña Institucional</Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="h-14 rounded-2xl bg-slate-50 pr-14 border-slate-200 text-sm font-bold px-6 focus:ring-4 focus:ring-primary/5 transition-all" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  disabled={isLoading} 
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-2 top-2 h-10 w-10 text-slate-400 hover:bg-transparent" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full h-16 text-xs font-black uppercase tracking-[0.2em] rounded-2xl bg-[#9f2241] hover:bg-[#801a34] text-white shadow-2xl transition-all active:scale-[0.98]"
            >
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="pt-0 pb-8 px-8 text-center">
           <div className="w-full py-4 bg-slate-50/60 rounded-2xl border border-slate-100 flex items-center justify-center gap-3">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sistema de Acceso Seguro • Edoméx 2026</span>
           </div>
        </CardFooter>
      </Card>
    </div>
  )
}
