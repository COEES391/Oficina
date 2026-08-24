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
import { Users, UserPlus, Pencil, Trash2, ShieldCheck, Lock, Shield, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { type AppUser } from '@/lib/planning-data'

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
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const initialFormState: AppUser = {
    id: '',
    rfc: '',
    name: '',
    password: '',
    role: 'user',
    privileges: ['planeacion']
  }

  const [formData, setFormData] = useState<AppUser>(initialFormState)

  useEffect(() => {
    setMounted(true)
    const stored = JSON.parse(localStorage.getItem('app_users_v1') || '[]')
    setUsers(stored)
  }, [])

  const handleSave = () => {
    if (!formData.rfc || !formData.password || !formData.name) {
      toast({ variant: "destructive", title: "Faltan datos", description: "Usuario, Contraseña y Nombre son obligatorios." })
      return
    }

    const newUser = { ...formData, id: editingId || `user-${Date.now()}` }
    let updated;
    if (editingId) {
      updated = users.map(u => u.id === editingId ? newUser : u)
      toast({ title: "Usuario actualizado" })
    } else {
      updated = [newUser, ...users]
      toast({ title: "Usuario creado con éxito" })
    }

    setUsers(updated)
    localStorage.setItem('app_users_v1', JSON.stringify(updated))
    setIsDialogOpen(false)
    setFormData(initialFormState)
    setEditingId(null)
  }

  const handleTogglePrivilege = (sectionId: string) => {
    const current = formData.privileges
    if (current.includes(sectionId)) {
      setFormData({ ...formData, privileges: current.filter(p => p !== sectionId) })
    } else {
      setFormData({ ...formData, privileges: [...current, sectionId] })
    }
  }

  const handleDelete = (id: string) => {
    const updated = users.filter(u => u.id !== id)
    setUsers(updated)
    localStorage.setItem('app_users_v1', JSON.stringify(updated))
    toast({ title: "Usuario eliminado" })
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase leading-none">Gestión de Accesos</h2>
          <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" /> Control de Privilegios Administrativos
          </p>
        </div>
        <Button onClick={() => { setFormData(initialFormState); setEditingId(null); setIsDialogOpen(true); }} className="btn-institutional h-12 px-8">
          <UserPlus className="h-5 w-5 mr-2" /> Nuevo Usuario
        </Button>
      </div>

      <Card className="executive-card p-0 overflow-hidden border-t-8 border-t-primary">
        <CardHeader className="bg-slate-50/50 p-8">
          <CardTitle className="flex items-center gap-4 text-primary uppercase font-black text-2xl">
            <Users className="h-10 w-10 text-accent" />
            Usuarios del Sistema
          </CardTitle>
          <CardDescription className="font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground mt-2">Personal con acceso al portal integral COEES</CardDescription>
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
              {users.length > 0 ? users.map((user) => (
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
                      {user.privileges.map(p => (
                        <Badge key={p} variant="outline" className="text-[8px] font-black uppercase border-slate-200 bg-white">
                          {SECTIONS.find(s => s.id === p)?.name || p}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5 rounded-xl" onClick={() => { setFormData(user); setEditingId(user.id); setIsDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => handleDelete(user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 opacity-30">
                    <p className="text-[10px] font-black uppercase">No hay usuarios operativos registrados aparte del administrador maestro.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] rounded-[3rem] border-none shadow-2xl p-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-8 bg-slate-50 border-b shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Shield className="h-32 w-32" /></div>
            <DialogTitle className="uppercase font-black text-primary text-2xl flex items-center gap-4 relative z-10">
              <Shield className="h-8 w-8 text-accent" /> {editingId ? 'Editar Perfil Operativo' : 'Nuevo Acceso Institucional'}
            </DialogTitle>
            <DialogDescription className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground mt-2 relative z-10">
              Configure las credenciales y el nivel de acceso para este servidor público.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-1">Nombre Completo del Servidor</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} className="h-14 rounded-2xl bg-slate-50 border-primary/10 shadow-inner px-6 text-sm font-black uppercase" placeholder="PATERNO MATERNO NOMBRES" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-1 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Identificador (Usuario)
                  </Label>
                  <Input value={formData.rfc} onChange={e => setFormData({...formData, rfc: e.target.value.toUpperCase()})} className="h-14 rounded-2xl bg-slate-50 border-primary/10 font-mono font-black shadow-inner px-6 text-lg text-primary" placeholder="RFC O USUARIO" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-1 flex items-center gap-2">
                    <Lock className="h-4 w-4" /> Contraseña Oficial
                  </Label>
                  <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-primary/10 shadow-inner px-6 text-lg" placeholder="••••••••" />
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between">
                   <h4 className="text-[11px] font-black uppercase text-accent tracking-widest flex items-center gap-2">
                     <ShieldCheck className="h-5 w-5" /> Privilegios de Sección
                   </h4>
                   <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 font-black text-[9px] px-3">{formData.privileges.length} Secciones Permitidas</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SECTIONS.map(section => (
                    <div key={section.id} className={cn("flex items-center space-x-4 p-4 rounded-2xl border transition-all duration-300 group cursor-pointer", formData.privileges.includes(section.id) ? "bg-primary/[0.03] border-primary/20 shadow-sm" : "bg-white border-slate-100 hover:border-primary/10")} onClick={() => handleTogglePrivilege(section.id)}>
                        <Checkbox 
                          id={`section-${section.id}`} 
                          checked={formData.privileges.includes(section.id)}
                          onCheckedChange={() => handleTogglePrivilege(section.id)}
                          className="h-6 w-6 border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label htmlFor={`section-${section.id}`} className={cn("text-[10px] font-black uppercase cursor-pointer transition-colors", formData.privileges.includes(section.id) ? "text-primary" : "text-slate-500 group-hover:text-primary")}>
                          {section.name}
                        </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4 shrink-0">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-black text-[10px] uppercase h-14 px-10 text-slate-400 rounded-2xl hover:bg-slate-100">Cancelar</Button>
            <Button onClick={handleSave} className="btn-institutional h-14 px-16 text-[10px] shadow-2xl flex items-center gap-3">
              <Save className="h-5 w-5" /> {editingId ? 'Actualizar Usuario' : 'Crear Acceso Seguro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
