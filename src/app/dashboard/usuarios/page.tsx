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
import { Users, UserPlus, Pencil, Trash2, ShieldCheck, Shield, Save, KeyRound, Loader2, User, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { type AppUser } from '@/lib/planning-data'
import { cn } from "@/lib/utils"

const SECTIONS = [
  { id: 'bitacora-atres', name: 'Bitácora ATRES' },
  { id: 'planeacion', name: 'Planeación' },
  { id: 'soporte', name: 'Soporte Técnico' },
  { id: 'capacitacion', name: 'Capacitación' },
  { id: 'programas', name: 'Programas' },
  { id: 'base-cct', name: 'Base CCT' },
  { id: 'base-participantes', name: 'Base Participantes' },
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
    const cleanRfc = (formData.rfc || '').trim().toUpperCase()
    const cleanName = (formData.name || '').trim().toUpperCase()
    const cleanPassword = (formData.password || '').trim()

    if (!cleanRfc || !cleanPassword || !cleanName) {
      toast({ 
        variant: "destructive", 
        title: "Campos incompletos", 
        description: "Nombre, Identificador y Contraseña son obligatorios." 
      })
      return
    }

    setIsSaving(true)
    try {
      const userData = {
        rfc: cleanRfc,
        name: cleanName,
        password: cleanPassword,
        role: 'user' as const,
        privileges: formData.privileges || ['programas'],
        updatedAt: serverTimestamp()
      }

      if (editingId) {
        const userRef = doc(db, 'users', editingId)
        await updateDoc(userRef, userData)
        toast({ title: "Actualización Exitosa", description: `El usuario ${cleanRfc} ha sido actualizado.` })
      } else {
        await addDoc(collection(db, 'users'), {
          ...userData,
          createdAt: serverTimestamp()
        })
        toast({ title: "Usuario Registrado", description: `Acceso habilitado para ${cleanRfc}.` })
      }
      
      setIsDialogOpen(false)
      setEditingId(null)
      setFormData(initialFormState)
      fetchUsers()
    } catch (error: any) {
      console.error("Error saving user:", error)
      toast({ 
        variant: "destructive", 
        title: "Error de Guardado", 
        description: error.message || "No se pudo conectar con la base de datos." 
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
    if (!confirm("¿Está seguro de eliminar este acceso permanentemente?")) return
    try {
      await deleteDoc(doc(db, 'users', id))
      toast({ title: "Acceso eliminado de la red" })
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
          <h2 className="text-3xl font-black tracking-tight text-primary">Gestión de Accesos Global</h2>
          <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" /> Credenciales sincronizadas para acceso multi-equipo
          </p>
        </div>
        <Button onClick={() => { setFormData(initialFormState); setEditingId(null); setIsDialogOpen(true); }} className="btn-institutional h-12 px-10 shadow-xl">
          <UserPlus className="h-5 w-5 mr-2" /> Nuevo Acceso
        </Button>
      </div>

      <Card className="executive-card p-0 overflow-hidden border-t-8 border-t-primary shadow-2xl">
        <CardHeader className="bg-slate-50/50 p-8">
          <CardTitle className="flex items-center gap-4 text-primary font-black text-2xl">
            <Users className="h-10 w-10 text-accent" /> Usuarios del Sistema
          </CardTitle>
          <CardDescription className="font-bold text-xs uppercase tracking-widest text-muted-foreground mt-2">Base de datos centralizada en tiempo real</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100/50">
                <TableRow>
                  <TableHead className="font-bold text-[11px] uppercase pl-10 h-12">Nombre del Servidor</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase h-12">ID (RFC)</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase h-12">Privilegios</TableHead>
                  <TableHead className="text-right font-bold text-[11px] uppercase pr-10 h-12">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 font-bold opacity-50"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Sincronizando Nube...</TableCell></TableRow>
                ) : users.length > 0 ? users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50 transition-colors h-16">
                    <TableCell className="pl-10">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                          <User className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-[13px] text-slate-700">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs uppercase font-black text-primary">{user.rfc}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {(user.privileges || []).map(p => (
                          <Badge key={p} variant="outline" className="text-[9px] font-bold border-slate-200 bg-white px-2">
                            {SECTIONS.find(s => s.id === p)?.name || p}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5 rounded-lg" onClick={() => { setFormData(user); setEditingId(user.id!); setIsDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-600 hover:bg-rose-50 rounded-lg" onClick={() => handleDelete(user.id!)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={4} className="text-center py-24 opacity-30 font-bold uppercase text-xs tracking-widest">Sin usuarios en la red</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!open && !isSaving) { setIsDialogOpen(false); setEditingId(null); setFormData(initialFormState); } }}>
        <DialogContent className="sm:max-w-[750px] h-[90vh] rounded-[3rem] p-0 flex flex-col overflow-hidden bg-white border-none shadow-2xl">
          <DialogHeader className="p-8 bg-slate-50 border-b shrink-0 flex flex-row justify-between items-center pr-12">
            <div className="space-y-1">
              <DialogTitle className="font-black text-primary text-2xl flex items-center gap-4">
                <Shield className="h-8 w-8 text-accent" /> {editingId ? 'Editar Perfil Global' : 'Nuevo Acceso Institucional'}
              </DialogTitle>
              <DialogDescription className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Configure las credenciales y el nivel de acceso para este servidor público.</DialogDescription>
            </div>
            <button onClick={() => setIsDialogOpen(false)} className="h-10 w-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="p-8 space-y-10">
              <div className="space-y-8 bg-slate-50 p-8 rounded-[2.5rem] border border-primary/5 shadow-inner">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black text-primary pl-2 uppercase">Nombre Completo del Servidor</Label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} 
                    className="h-14 rounded-2xl bg-white border-primary/10 shadow-sm px-6 text-base font-bold placeholder:text-slate-300" 
                    placeholder="Apellidos y Nombres..." 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-black text-primary pl-2 uppercase">RFC / Identificador de Acceso</Label>
                    <Input 
                      value={formData.rfc} 
                      onChange={e => setFormData({...formData, rfc: e.target.value.toUpperCase()})} 
                      className="h-12 rounded-xl bg-white border-primary/10 shadow-sm px-6 font-mono text-primary font-black uppercase text-lg" 
                      placeholder="13 Caracteres..." 
                      maxLength={13}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-black text-primary pl-2 uppercase">Contraseña Oficial</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        className="h-12 rounded-xl bg-white border-primary/10 shadow-sm px-6 text-sm font-bold flex-1" 
                        placeholder="Mín. 6 caract." 
                      />
                      <Button type="button" onClick={generateRandomPassword} variant="outline" className="h-12 w-12 rounded-xl border-primary/20 text-primary shadow-sm hover:bg-primary/5">
                        <KeyRound className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-2">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                   <ShieldCheck className="h-5 w-5 text-accent" />
                   <h4 className="text-[11px] font-black text-accent tracking-widest uppercase">Privilegios de Sección</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {SECTIONS.map(section => (
                    <div 
                      key={section.id} 
                      className={cn(
                        "flex items-center space-x-4 p-5 rounded-[1.5rem] border transition-all cursor-pointer group shadow-sm", 
                        formData.privileges?.includes(section.id) 
                          ? "bg-primary/[0.04] border-primary/30 ring-1 ring-primary/10" 
                          : "bg-white border-slate-100 hover:border-primary/20"
                      )} 
                      onClick={() => handleTogglePrivilege(section.id)}
                    >
                        <Checkbox 
                          id={`section-${section.id}`} 
                          checked={formData.privileges?.includes(section.id)} 
                          onCheckedChange={() => handleTogglePrivilege(section.id)} 
                          className="h-5 w-5 border-primary data-[state=checked]:bg-primary" 
                        />
                        <Label className="text-[11px] font-bold cursor-pointer group-hover:text-primary transition-colors leading-tight">{section.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-6 shrink-0 shadow-inner">
            <Button 
              variant="ghost" 
              onClick={() => setIsDialogOpen(false)} 
              disabled={isSaving} 
              className="font-bold text-[11px] uppercase h-14 px-10 text-slate-400 hover:text-slate-600"
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleSave} 
              disabled={isSaving} 
              className="btn-institutional h-14 px-16 text-xs flex items-center gap-4 shadow-2xl min-w-[220px]"
            >
              {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />} 
              {editingId ? 'Actualizar Acceso' : 'Registrar Acceso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
