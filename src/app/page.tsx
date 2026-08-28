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
      toast({ variant: "destructive", title: "Campos vacíos" })
      return
    }

    setIsLoading(true)
    try {
      // Usuarios Maestros con Prioridad Forzada
      if (cleanRfc === 'COEES' && password === '123456') {
        localStorage.setItem('userRfc', cleanRfc)
        toast({ title: "Acceso Maestro", description: "Bienvenido al Sistema Integral COEES." })
        router.push('/dashboard/programas') 
        return
      }

      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('rfc', '==', cleanRfc), where('password', '==', password))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as AppUser
        localStorage.setItem('userRfc', cleanRfc)
        toast({ title: "Acceso concedido", description: `Bienvenido, ${userData.name}.` })
        
        const privs = userData.privileges || []
        
        // REDIRECCIÓN FORZADA: Jerarquía de aterrizaje obligatoria
        if (privs.includes('programas') || privs.includes('bitacora-atres')) {
          router.push('/dashboard/programas')
        } else if (privs.includes('soporte')) {
          router.push('/dashboard/soporte')
        } else if (privs.includes('capacitacion')) {
          router.push('/dashboard/capacitacion')
        } else if (privs.includes('planeacion')) {
          router.push('/dashboard')
        } else {
          router.push('/dashboard/base-cct')
        }
      } else {
        toast({ variant: "destructive", title: "Credenciales incorrectas" })
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({ variant: "destructive", title: "Error de conexión", description: "Verifique su acceso a internet." })
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
            <CardTitle className="text-3xl font-black tracking-tighter text-[#9f2241] uppercase leading-[0.9]">Portal <br /> Integral</CardTitle>
            <CardDescription className="text-slate-500 font-black text-[8px] uppercase tracking-[0.15em]">COMPUTACIÓN ELECTRÓNICA EN LA EDUCACIÓN SECUNDARIA</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-8 pb-6">
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase text-slate-400 pl-2">Identificador Operativo</Label>
              <Input placeholder="INGRESAR USUARIO" className="h-12 rounded-xl bg-slate-50 border-slate-200 text-xs font-black uppercase px-6" value={rfc} onChange={(e) => setRfc(e.target.value.toUpperCase())} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase text-slate-400 pl-2">Contraseña Oficial</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="h-12 rounded-xl bg-slate-50 pr-12 border-slate-200 text-xs font-bold px-6" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1.5 h-9 w-9 text-slate-400" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full h-14 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl bg-[#9f2241] hover:bg-[#801a34] text-white shadow-2xl transition-all">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar al Portal"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="pt-0 pb-6 px-8 text-center">
           <div className="w-full py-3 bg-slate-50/60 rounded-xl border border-slate-100 flex items-center justify-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">SISTEMA SEGURO • EDOMÉX 2026</span></div>
        </CardFooter>
      </Card>
    </div>
  )
}
