
'use client'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users, UserPlus, Pencil, Trash2, ShieldCheck, Lock, Shield, Save, KeyRound, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { type AppUser } from '@/lib/planning-data'
import { cn } from "@/lib/utils"

const SECTIONS = [
  { id: 'bitacora-atres', name: 'Bitácora ATRES' },
  { id: 'planeacion', name: 'PLANEACIÓN' },
  { id: 'soporte', name: 'Soporte Técnico' },
  { id: 'capacitacion', name: 'Capacitación' },
  { id: 'programas', name: 'Programas' },
  { id: 'base-cct', name: 'BASE CCT' },
  { id: 'base-participantes', name: 'BASE PARTICIPANTES' },
  { id: 'usuarios', name: 'Usuarios' },
]

export default function UsersPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [users, setUsers] = useState<AppUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const initialFormState: AppUser = {
    id: '',
    rfc: '',
    name: '',
    password: '',
    role: 'user',
    privileges: ['programas'] // Por defecto programas
  }

  const [formData, setFormData] = useState<AppUser>(initialFormState)

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const q = query(collection(db, 'users'), orderBy('name', 'asc'))
      const querySnapshot = await getDocs(q)
      const fetchedUsers = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as AppUser[]
      setUsers(fetchedUsers)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({ variant: "destructive", title: "Error al cargar usuarios" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchUsers()
  }, [])

  const handleSave = async () => {
    if (!formData.rfc || !formData.password || !formData.name) {
      toast({ variant: "destructive", title: "Faltan datos obligatorios" })
      return
    }

    setIsSaving(true)
    try {
      const userData = {
        rfc: formData.rfc.trim().toUpperCase(),
        name: formData.name.trim().toUpperCase(),
        password: formData.password,
        role: 'user',
        privileges: formData.privileges || []
      }

      if (editingId) {
        const userRef = doc(db, 'users', editingId)
        await updateDoc(userRef, userData)
        toast({ title: "Usuario actualizado", description: "Los cambios se sincronizaron en la nube." })
      } else {
        await addDoc(collection(db, 'users'), userData)
        toast({ title: "Acceso registrado", description: "El servidor público ya puede ingresar al sistema." })
      }
      
      setIsDialogOpen(false)
      fetchUsers()
      setFormData(initialFormState)
      setEditingId(null)
    } catch (error) {
      console.error("Error saving user:", error)
      toast({ variant: "destructive", title: "Error de sincronización", description: "No se pudo guardar en la base de datos central." })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTogglePrivilege = (sectionId: string) => {
    const current = formData.privileges || []
    if (current.includes(sectionId)) {
      setFormData({ ...formData, privileges: current.filter(p => p !== sectionId) })
    } else {
      setFormData({ ...formData, privileges: [...current, sectionId] })
    }
  }

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let pass = ""
    for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length))
    setFormData({ ...formData, password: pass })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este acceso? Se perderá la sincronización global.")) return
    try {
      await deleteDoc(doc(db, 'users', id))
      toast({ title: "Acceso eliminado de la nube" })
      fetchUsers()
    } catch (error) {
      toast({ variant: "destructive", title: "Error al eliminar" })
    }
  }

  if (!mounted) return null

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase leading-none">Gestión de Accesos Global</h2>
          <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" /> Control de Privilegios Multi-Equipo
          </p>
        </div>
        <button onClick={() => { setFormData(initialFormState); setEditingId(null); setIsDialogOpen(true); }} className="btn-institutional h-12 px-8 flex items-center gap-2">
          <UserPlus className="h-5 w-5" /> NUEVO ACCESO
        </button>
      </div>

      <Card className="executive-card p-0 overflow-hidden border-t-8 border-t-primary shadow-2xl">
        <CardHeader className="bg-slate-50/50 p-8">
          <CardTitle className="flex items-center gap-4 text-primary uppercase font-black text-2xl">
            <Users className="h-10 w-10 text-accent" />
            Usuarios del Sistema
          </CardTitle>
          <CardDescription className="font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground mt-2">Personal con credenciales activas en la red institucional</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100/50">
              <TableRow>
                <TableHead className="font-black text-[10px] uppercase pl-10">Nombre del Usuario</TableHead>
                <TableHead className="font-black text-[10px] uppercase">Identificador (RFC)</TableHead>
                <TableHead className="font-black text-[10px] uppercase">Secciones Permitidas</TableHead>
                <TableHead className="text-right font-black text-[10px] uppercase pr-10">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-20 font-black uppercase opacity-50 flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Sincronizando con la nube...
                </TableCell></TableRow>
              ) : users.length > 0 ? users.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <TableCell className="pl-10">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Users className="h-5 w-5" />
                      </div>
                      <span className="font-black text-xs text-slate-700 uppercase">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs uppercase font-black text-primary">{user.rfc}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(user.privileges || []).map(p => (
                        <Badge key={p} variant="outline" className="text-[8px] font-black uppercase border-slate-200 bg-white">
                          {SECTIONS.find(s => s.id === p)?.name || p}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5 rounded-xl" onClick={() => { setFormData(user); setEditingId(user.id!); setIsDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => handleDelete(user.id!)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={4} className="text-center py-20 opacity-30 font-black uppercase text-[10px]">No hay usuarios registrados en la base central.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) { setFormData(initialFormState); setEditingId(null); } }}>
        <DialogContent className="sm:max-w-[750px] h-[90vh] rounded-[3rem] border-none shadow-2xl p-0 flex flex-col overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-slate-50 border-b shrink-0">
            <DialogTitle className="uppercase font-black text-primary text-2xl flex items-center gap-4">
              <Shield className="h-8 w-8 text-accent" /> {editingId ? 'Editar Perfil Institucional' : 'Nuevo Acceso Institucional'}
            </DialogTitle>
            <DialogDescription className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground mt-2">Configure las credenciales y el nivel de acceso para este servidor público.</DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-1">Nombre Completo del Servidor</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} className="h-12 rounded-2xl bg-slate-50 border-none shadow-inner px-6 text-xs font-black uppercase" placeholder="APELLIDOS Y NOMBRE(S)..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-1">Identificador Operativo (RFC/Usuario)</Label>
                  <Input value={formData.rfc} onChange={e => setFormData({...formData, rfc: e.target.value.toUpperCase()})} className="h-12 rounded-2xl bg-slate-50 border-none shadow-inner px-6 font-mono text-sm text-primary" placeholder="13 CARACTERES..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-1">Contraseña de Acceso</Label>
                  <div className="flex gap-2">
                    <Input value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="h-12 rounded-2xl bg-slate-50 border-none shadow-inner px-6 text-sm flex-1" />
                    <Button onClick={generateRandomPassword} variant="outline" className="h-12 w-12 rounded-2xl border-primary/20 text-primary">
                      <KeyRound className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-[11px] font-black uppercase text-accent tracking-widest">Privilegios de Sección</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SECTIONS.map(section => (
                    <div key={section.id} className={cn("flex items-center space-x-4 p-4 rounded-2xl border transition-all cursor-pointer group", formData.privileges.includes(section.id) ? "bg-primary/[0.03] border-primary/20" : "bg-white border-slate-100 hover:border-primary/10")} onClick={() => handleTogglePrivilege(section.id)}>
                        <Checkbox id={`section-${section.id}`} checked={formData.privileges.includes(section.id)} onCheckedChange={() => handleTogglePrivilege(section.id)} className="h-5 w-5" />
                        <Label className="text-[10px] font-black uppercase cursor-pointer group-hover:text-primary transition-colors">{section.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4 shrink-0">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSaving} className="font-black text-[10px] uppercase h-12 px-10 text-slate-400">Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving} className="btn-institutional h-12 px-14 text-[10px] flex items-center gap-3">
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} 
              {editingId ? 'ACTUALIZAR' : 'REGISTRAR'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
