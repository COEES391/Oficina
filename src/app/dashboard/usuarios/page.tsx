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
import { Users, UserPlus, Pencil, Trash2, ShieldCheck, Shield, Save, KeyRound, Loader2, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore'
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
    privileges: ['programas']
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
      toast({ 
        variant: "destructive", 
        title: "Campos incompletos", 
        description: "Nombre, Identificador y Contraseña son obligatorios." 
      })
      return
    }

    setIsSaving(true)
    try {
      const cleanRfc = formData.rfc.trim().toUpperCase()
      const cleanName = formData.name.trim().toUpperCase()
      const cleanPassword = formData.password.trim()

      const userData = {
        rfc: cleanRfc,
        name: cleanName,
        password: cleanPassword,
        role: 'user',
        privileges: formData.privileges || [],
        updatedAt: serverTimestamp()
      }

      if (editingId) {
        const userRef = doc(db, 'users', editingId)
        await updateDoc(userRef, userData)
        toast({ title: "Actualización Exitosa", description: "Las credenciales se han sincronizado en la nube." })
      } else {
        await addDoc(collection(db, 'users'), {
          ...userData,
          createdAt: serverTimestamp()
        })
        toast({ title: "Usuario Registrado", description: "Acceso global activado correctamente." })
      }
      
      setIsDialogOpen(false)
      setEditingId(null)
      setFormData(initialFormState)
      await fetchUsers()
    } catch (error: any) {
      console.error("Error saving user:", error)
      toast({ 
        variant: "destructive", 
        title: "Fallo de Conexión", 
        description: "No se pudo sincronizar con la base de datos central." 
      })
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
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    let pass = ""
    for (let i = 0; i < 6; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length))
    setFormData({ ...formData, password: pass })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este acceso?")) return
    try {
      await deleteDoc(doc(db, 'users', id))
      toast({ title: "Acceso eliminado" })
      fetchUsers()
    } catch (error) {
      toast({ variant: "destructive", title: "Error al eliminar" })
    }
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase leading-none">Gestión de Accesos Global</h2>
          <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" /> Credenciales globales para acceso multi-equipo
          </p>
        </div>
        <Button onClick={() => { setFormData(initialFormState); setEditingId(null); setIsDialogOpen(true); }} className="btn-institutional h-12 px-10 shadow-xl">
          <UserPlus className="h-5 w-5 mr-2" /> NUEVO ACCESO
        </Button>
      </div>

      <Card className="executive-card p-0 overflow-hidden border-t-8 border-t-primary shadow-2xl">
        <CardHeader className="bg-slate-50/50 p-8">
          <CardTitle className="flex items-center gap-4 text-primary uppercase font-black text-2xl">
            <Users className="h-10 w-10 text-accent" /> Usuarios del Sistema
          </CardTitle>
          <CardDescription className="font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground mt-2">Base de datos centralizada en la nube</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100/50">
              <TableRow>
                <TableHead className="font-black text-[10px] uppercase pl-10 h-12">Nombre del Servidor</TableHead>
                <TableHead className="font-black text-[10px] uppercase h-12">ID (RFC)</TableHead>
                <TableHead className="font-black text-[10px] uppercase h-12">Privilegios</TableHead>
                <TableHead className="text-right font-black text-[10px] uppercase pr-10 h-12">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-20 font-black uppercase opacity-50"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Sincronizando...</TableCell></TableRow>
              ) : users.length > 0 ? users.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50 transition-colors h-16">
                  <TableCell className="pl-10">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                        <User className="h-5 w-5" />
                      </div>
                      <span className="font-black text-xs text-slate-700 uppercase">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs uppercase font-black text-primary">{user.rfc}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[300px]">
                      {(user.privileges || []).map(p => (
                        <Badge key={p} variant="outline" className="text-[8px] font-black uppercase border-slate-200 bg-white px-2">
                          {SECTIONS.find(s => s.id === p)?.name || p}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-primary" onClick={() => { setFormData(user); setEditingId(user.id!); setIsDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-600" onClick={() => handleDelete(user.id!)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={4} className="text-center py-24 opacity-30 font-black uppercase text-xs">Sin usuarios registrados</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!open && !isSaving) { setIsDialogOpen(false); setEditingId(null); setFormData(initialFormState); } }}>
        <DialogContent className="sm:max-w-[700px] h-[90vh] rounded-[3rem] p-0 flex flex-col overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-slate-50 border-b shrink-0">
            <DialogTitle className="uppercase font-black text-primary text-2xl flex items-center gap-4">
              <Shield className="h-8 w-8 text-accent" /> {editingId ? 'Editar Perfil' : 'Nuevo Acceso Institucional'}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="p-8 space-y-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary pl-1">Nombre Completo</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner px-6 text-sm font-black uppercase" placeholder="APELLIDOS Y NOMBRES..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary pl-1">RFC / Usuario</Label>
                    <Input value={formData.rfc} onChange={e => setFormData({...formData, rfc: e.target.value.toUpperCase()})} className="h-12 rounded-2xl bg-slate-50 border-none shadow-inner px-6 font-mono text-primary font-black uppercase" placeholder="13 CARACTERES..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary pl-1">Contraseña</Label>
                    <div className="flex gap-2">
                      <Input value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="h-12 rounded-2xl bg-slate-50 border-none shadow-inner px-6 text-sm font-bold flex-1" placeholder="MÍN. 6 CARACT." />
                      <Button type="button" onClick={generateRandomPassword} variant="outline" className="h-12 w-12 rounded-2xl border-primary/20 text-primary shadow-sm"><KeyRound className="h-5 w-5" /></Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h4 className="text-[11px] font-black uppercase text-accent tracking-widest mb-4">Privilegios de Sección</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {SECTIONS.map(section => (
                    <div key={section.id} className={cn("flex items-center space-x-4 p-5 rounded-2xl border transition-all cursor-pointer group shadow-sm", formData.privileges.includes(section.id) ? "bg-primary/[0.04] border-primary/30" : "bg-white border-slate-100 hover:border-primary/20")} onClick={() => handleTogglePrivilege(section.id)}>
                        <Checkbox id={`section-${section.id}`} checked={formData.privileges.includes(section.id)} onCheckedChange={() => handleTogglePrivilege(section.id)} className="h-5 w-5 border-primary" />
                        <Label className="text-[10px] font-black uppercase cursor-pointer group-hover:text-primary transition-colors leading-tight">{section.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4 shrink-0">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSaving} className="font-black text-[10px] uppercase h-12 px-10 text-slate-400">Cancelar</Button>
            <Button type="button" onClick={handleSave} disabled={isSaving} className="btn-institutional h-14 px-16 text-[11px] flex items-center gap-3 shadow-2xl">
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} 
              {editingId ? 'ACTUALIZAR' : 'REGISTRAR'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
