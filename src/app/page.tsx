'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { placeholderImages } from '@/lib/placeholder-images'
import { User, KeyRound, Loader2, GraduationCap, ShieldCheck } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { type AppUser } from '@/lib/planning-data'

export default function LoginPage() {
  const [mounted, setMounted] = useState(false)
  const [rfc, setRfc] = useState('')
  const [password, setPassword] = useState('')
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
      if (cleanRfc === 'COEES' && password === '123456') {
        localStorage.setItem('userRfc', cleanRfc)
        router.push('/dashboard/programas') 
        return
      }
      
      if (cleanRfc === 'CISF840114L34' && password === 'Chimal12') {
        localStorage.setItem('userRfc', cleanRfc)
        router.push('/dashboard/programas')
        return
      }

      if (cleanRfc === 'HEAS740508Q23' && password === 'Soporte12') {
        localStorage.setItem('userRfc', cleanRfc)
        router.push('/dashboard/soporte')
        return
      }
      
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('rfc', '==', cleanRfc), where('password', '==', password))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as AppUser
        localStorage.setItem('userRfc', cleanRfc)
        
        const privs = userData.privileges || []
        if (privs.includes('programas')) {
          router.push('/dashboard/programas')
        } else if (privs.includes('soporte')) {
          router.push('/dashboard/soporte')
        } else if (privs.includes('capacitacion')) {
          router.push('/dashboard/capacitacion')
        } else {
          router.push('/dashboard')
        }
      } else {
        toast({ variant: "destructive", title: "Acceso denegado", description: "Credenciales incorrectas." })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error de sistema", description: "No se pudo conectar con el servidor." })
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#f4f4f4] font-sans p-4">
      <Card className="w-full max-w-[850px] shadow-[0_30px_90px_rgba(0,0,0,0.15)] border-none rounded-none overflow-hidden flex flex-col md:flex-row relative z-10 animate-in fade-in zoom-in-95 duration-700">
        {/* Lado Izquierdo: Identidad */}
        <div className="w-full md:w-[35%] bg-[#9f2241] p-10 flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative h-24 w-24 mb-2">
            <GraduationCap className="w-full h-full text-white/90" strokeWidth={1.5} />
          </div>
          <div className="h-0.5 w-12 bg-[#B38E5D] mb-4" />
          <h2 className="text-white text-lg font-bold leading-tight px-2">
            Plataforma Integral de Gestión Técnica COEES
          </h2>
          <p className="text-white/50 text-[9px] font-black uppercase tracking-[0.2em]">
            Estado de México 2026
          </p>
        </div>

        {/* Lado Derecho: Formulario */}
        <div className="flex-1 bg-white p-8 md:p-14 flex flex-col justify-center">
          <div className="mb-10 flex justify-center">
             <div className="relative h-14 w-48 grayscale opacity-80 contrast-125">
                <Image 
                  src={logoData.imageUrl} 
                  alt="Educación Logo" 
                  fill 
                  className="object-contain"
                />
             </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-6">
            <div className="relative group">
              <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Usuario (RFC)" 
                className="h-12 pl-12 rounded-lg bg-slate-50 border-slate-200 text-sm font-bold shadow-inner focus:bg-white transition-all" 
                value={rfc} 
                onChange={(e) => setRfc(e.target.value.toUpperCase())} 
                disabled={isLoading} 
              />
            </div>

            <div className="relative group">
              <KeyRound className="absolute left-4 top-3.5 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
              <Input 
                type="password" 
                placeholder="Contraseña" 
                className="h-12 pl-12 rounded-lg bg-slate-50 border-slate-200 text-sm font-bold shadow-inner focus:bg-white transition-all" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                disabled={isLoading} 
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="w-40 h-11 text-xs font-black uppercase tracking-widest rounded-lg bg-[#B38E5D] hover:bg-[#a08252] text-white shadow-xl transition-all"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ingresar"}
              </Button>
            </div>
          </form>

          <div className="mt-12 pt-6 border-t border-slate-100 flex items-center justify-center gap-3">
             <ShieldCheck className="h-4 w-4 text-emerald-500" />
             <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
               Acceso Oficial Seguro
             </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
