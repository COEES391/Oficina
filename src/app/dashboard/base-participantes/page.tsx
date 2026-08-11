'use client'
import { useState, useMemo, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { schoolsDirectory } from "@/lib/schools-directory"
import { Search, UserPlus, Users, Pencil, Trash2, School, Mail, BadgeCheck, Building2, Fingerprint } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type ParticipantInfo = {
  id: string;
  rfc: string;
  curp: string;
  nombres: string;
  paterno: string;
  materno: string;
  genero: 'MASCULINO' | 'FEMENINO' | '';
  funcion: string;
  email: string;
  cct: string;
  nombreCT: string;
  municipio: string;
  valle: string;
  region: string;
  zonaEscolar: string;
  sector: string;
  modalidad: string;
}

const FUNCIONES = [
  "PAAE",
  "DOCENTE",
  "DIRECTIVO",
  "JEFE DE ENSEÑANZA",
  "SUPERVISOR",
  "ASESOR TECNICO PEDAGOGICO"
]

export default function BaseParticipantesPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [participants, setParticipants] = useState<ParticipantInfo[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const initialFormState: ParticipantInfo = {
    id: '', rfc: '', curp: '', nombres: '', paterno: '', materno: '', genero: '',
    funcion: '', email: '', cct: '', nombreCT: '', municipio: '', valle: '',
    region: '', zonaEscolar: '', sector: '', modalidad: ''
  }

  const [formData, setFormData] = useState<ParticipantInfo>(initialFormState)

  useEffect(() => {
    setMounted(true)
    const stored = JSON.parse(localStorage.getItem('participants_master_v1') || '[]')
    setParticipants(stored)
  }, [])

  const filteredParticipants = useMemo(() => {
    if (!searchTerm) return participants;
    const term = searchTerm.toUpperCase();
    return participants.filter(p => {
      const rfcMatch = (p.rfc || '').toUpperCase().includes(term);
      const curpMatch = (p.curp || '').toUpperCase().includes(term);
      const nameMatch = `${p.nombres} ${p.paterno} ${p.materno}`.toUpperCase().includes(term);
      const cctMatch = (p.cct || '').toUpperCase().includes(term);
      const schoolMatch = (p.nombreCT || '').toUpperCase().includes(term);
      return rfcMatch || curpMatch || nameMatch || cctMatch || schoolMatch;
    });
  }, [searchTerm, participants]);

  const handleCctChange = (val: string) => {
    const cleanVal = val.toUpperCase()
    setFormData(prev => ({ ...prev, cct: cleanVal }))
    if (cleanVal.length === 10) {
      const school = schoolsDirectory.find(s => s.cct.toUpperCase() === cleanVal)
      if (school) {
        setFormData(prev => ({
          ...prev,
          nombreCT: school.nombre,
          municipio: school.municipio,
          valle: school.valle,
          region: school.region,
          zonaEscolar: school.zonaEscolar,
          sector: school.sector,
          modalidad: school.modalidad
        }))
      }
    }
  }

  const handleSave = () => {
    if (!formData.rfc || !formData.nombres || !formData.paterno) {
      toast({ variant: "destructive", title: "Faltan datos", description: "RFC y nombre completo son necesarios." })
      return
    }

    if (formData.curp && formData.curp.length !== 18) {
      toast({ variant: "destructive", title: "CURP Inválida", description: "La CURP debe tener exactamente 18 caracteres." })
      return
    }

    const participantToSave: ParticipantInfo = {
      ...formData,
      id: editingId || `PART-${Date.now()}`,
      rfc: formData.rfc.toUpperCase(),
      curp: formData.curp.toUpperCase(),
      nombres: formData.nombres.toUpperCase(),
      paterno: formData.paterno.toUpperCase(),
      materno: formData.materno.toUpperCase(),
      email: formData.email.toLowerCase()
    }

    let updated;
    if (editingId) {
      updated = participants.map(p => p.id === editingId ? participantToSave : p)
      toast({ title: "Participante Actualizado" })
    } else {
      updated = [participantToSave, ...participants]
      toast({ title: "Participante Registrado" })
    }

    setParticipants(updated)
    localStorage.setItem('participants_master_v1', JSON.stringify(updated))
    setIsDialogOpen(false)
    setFormData(initialFormState)
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    const updated = participants.filter(p => p.id !== id)
    setParticipants(updated)
    localStorage.setItem('participants_master_v1', JSON.stringify(updated))
    toast({ title: "Registro eliminado" })
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase leading-none">Base Maestra de Participantes</h2>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2 mt-1">
            <Users className="h-4 w-4 text-accent" /> Catálogo de Servidores Públicos • Control de Capacitación y Apoyo
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setFormData(initialFormState);
            setEditingId(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="btn-institutional h-12 px-8 rounded-xl shadow-lg">
              <UserPlus className="h-5 w-5 mr-2" /> Nuevo Participante
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem]">
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="uppercase font-black text-primary text-2xl">
                {editingId ? 'Editar Participante' : 'Alta de Participante'}
              </DialogTitle>
              <DialogDescription className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">
                Ingrese los datos oficiales del servidor público para su seguimiento en el sistema.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                <div className="md:col-span-2 border-b border-slate-100 pb-2">
                   <h3 className="text-[11px] font-black uppercase text-accent flex items-center gap-2">
                     <BadgeCheck className="h-4 w-4" /> Datos de Identidad
                   </h3>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">RFC (13 Caracteres)</Label>
                  <Input maxLength={13} className="font-mono font-black uppercase h-11" value={formData.rfc} onChange={e => setFormData({...formData, rfc: e.target.value.toUpperCase()})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">CURP (18 Caracteres)</Label>
                  <Input maxLength={18} className="font-mono font-black uppercase h-11 border-primary/20" value={formData.curp} onChange={e => setFormData({...formData, curp: e.target.value.toUpperCase()})} placeholder="INGRESAR CURP..." />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Correo Electrónico</Label>
                  <Input type="email" className="h-11 border-primary/10" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value.toLowerCase()})} placeholder="ejemplo@desysa.edu.mx" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-primary">Género</Label>
                   <Select value={formData.genero} onValueChange={(val: any) => setFormData({...formData, genero: val})}>
                      <SelectTrigger className="h-11 font-bold"><SelectValue placeholder="SELECCIONAR..." /></SelectTrigger>
                      <SelectContent>
                         <SelectItem value="MASCULINO">MASCULINO</SelectItem>
                         <SelectItem value="FEMENINO">FEMENINO</SelectItem>
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Apellido Paterno</Label>
                  <Input className="font-bold uppercase h-11" value={formData.paterno} onChange={e => setFormData({...formData, paterno: e.target.value.toUpperCase()})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Apellido Materno</Label>
                  <Input className="font-bold uppercase h-11" value={formData.materno} onChange={e => setFormData({...formData, materno: e.target.value.toUpperCase()})} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Nombre(s)</Label>
                  <Input className="font-bold uppercase h-11" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value.toUpperCase()})} />
                </div>

                <div className="md:col-span-2 border-b border-slate-100 pb-2 mt-4">
                   <h3 className="text-[11px] font-black uppercase text-accent flex items-center gap-2">
                     <Building2 className="h-4 w-4" /> Adscripción Laboral
                   </h3>
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-primary">Función</Label>
                   <Select value={formData.funcion} onValueChange={val => setFormData({...formData, funcion: val})}>
                      <SelectTrigger className="h-11 font-bold uppercase"><SelectValue placeholder="ELEGIR FUNCIÓN..." /></SelectTrigger>
                      <SelectContent>
                         {FUNCIONES.map(f => <SelectItem key={f} value={f} className="text-[10px] font-bold uppercase">{f}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">CCT Adscripción</Label>
                  <Input maxLength={10} className="font-mono font-black uppercase h-11 border-primary/20" value={formData.cct} onChange={e => handleCctChange(e.target.value)} />
                </div>

                {formData.cct.length === 10 && (
                   <div className="md:col-span-2 bg-slate-50 p-6 rounded-2xl border-2 border-primary/5 animate-in zoom-in-95">
                      <div className="flex items-center gap-4 mb-4">
                         <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg"><School className="h-5 w-5" /></div>
                         <div>
                            <p className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mb-1">Plantel Identificado</p>
                            <h4 className="text-sm font-black text-slate-800 uppercase leading-none">{formData.nombreCT}</h4>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase">Municipio</p>
                            <p className="text-[10px] font-bold text-slate-700">{formData.municipio}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase">ZE</p>
                            <p className="text-[10px] font-bold text-slate-700">{formData.zonaEscolar}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase">Sector</p>
                            <p className="text-[10px] font-bold text-slate-700">{formData.sector}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase">Región</p>
                            <p className="text-[10px] font-bold text-slate-700">{formData.region}</p>
                         </div>
                      </div>
                   </div>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="p-8 border-t bg-slate-50">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-12 px-8 rounded-xl font-bold uppercase text-xs">Cancelar</Button>
              <Button onClick={handleSave} className="btn-institutional h-12 px-12 rounded-xl text-xs">
                {editingId ? 'Actualizar Datos' : 'Registrar Participante'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="executive-card p-6 bg-white/80 border-none shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Search className="h-5 w-5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buscador Personal:</span>
          </div>
          
          <div className="relative flex-1 w-full">
            <Input 
              placeholder="Buscar por RFC, CURP, Nombre o CCT..." 
              className="h-12 rounded-xl bg-slate-50 border-primary/10 pl-12 text-sm font-bold uppercase shadow-inner focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
          </div>

          <Badge variant="outline" className="h-12 px-6 rounded-xl border-primary/20 text-primary font-black text-[10px] uppercase">
            Participantes: {filteredParticipants.length}
          </Badge>
        </div>
      </Card>

      <Card className="executive-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b">
              <TableRow>
                <TableHead className="w-12 text-[10px] font-black uppercase text-center">#</TableHead>
                <TableHead className="text-[10px] font-black uppercase min-w-[250px]">Nombre Completo</TableHead>
                <TableHead className="text-[10px] font-black uppercase">RFC / CURP</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Función / Puesto</TableHead>
                <TableHead className="text-[10px] font-black uppercase min-w-[200px]">CCT de Adscripción</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Municipio</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase pr-10">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParticipants.length > 0 ? filteredParticipants.map((p, idx) => (
                <TableRow key={p.id} className="hover:bg-slate-50 transition-colors group">
                  <TableCell className="text-center font-black text-[10px] text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-700 uppercase leading-none">{p.paterno} {p.materno} {p.nombres}</span>
                        <span className="text-[8px] text-muted-foreground font-bold flex items-center gap-1 mt-1">
                           <Mail className="h-2.5 w-2.5" /> {p.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono font-black text-[9px] text-primary">{p.rfc}</span>
                      <span className="font-mono font-bold text-[8px] text-accent">{p.curp}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                     <Badge variant="secondary" className="text-[8px] font-black uppercase bg-slate-100 text-slate-600 border-none">
                        {p.funcion}
                     </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-primary leading-none">{p.cct}</span>
                          <span className="text-[8px] text-muted-foreground font-bold uppercase truncate max-w-[180px] mt-1">{p.nombreCT}</span>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[10px] font-bold text-slate-500 uppercase">{p.municipio}</TableCell>
                  <TableCell className="text-right pr-8">
                     <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg" onClick={() => { setFormData(p); setEditingId(p.id); setIsDialogOpen(true); }}>
                           <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg" onClick={() => handleDelete(p.id)}>
                           <Trash2 className="h-4 w-4" />
                        </Button>
                     </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-24 opacity-30">
                    <div className="flex flex-col items-center gap-3">
                       <Users className="h-10 w-10 text-slate-300" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sin registros de participantes disponibles</p>
                    </div>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
