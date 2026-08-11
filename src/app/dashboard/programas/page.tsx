
'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { programsData, type ProgramStatus } from "@/lib/planning-data"
import { schoolsDirectory } from "@/lib/schools-directory"
import { cn } from "@/lib/utils"
import { 
  PlusCircle, 
  Pencil, 
  Activity,
  Target,
  Search,
  Trash2,
  School,
  CalendarDays,
  Headset,
  CheckCircle2,
  Tag,
  Info,
  Building2,
  Users,
  Plus,
  Mail,
  FilePlus,
  FileBox,
  FileText,
  User,
  History,
  Circle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { VisitSchedulerDialog } from '@/components/VisitSchedulerDialog'
import { HelpDeskDialog } from '@/components/HelpDeskDialog'
import { format } from 'date-fns'

const PROGRAM_RUBROS = [
  'Cuentas Institucionales',
  'Biblioteca Digital',
  'Geoposición',
  'Conoce mi Escuela',
  'ATRES'
];

const REGIONAL_OFFICES = [
  "Oficina de Tecnóloga Educativa Ecatepec",
  "Oficina de Tecnóloga Educativa Naucalpan",
  "Oficina de Tecnóloga Educativa Nezahualcóyotl",
  "Oficina de Tecnóloga Educativa Toluca",
  "Oficina de COEES Tultitlan"
];

const DOMINIOS = [
  'desysa.edu',
  'desysa.gob.mx',
  'coees.edu.mx'
];

const FUNCIONES = [
  "PAAE",
  "DOCENTE",
  "DIRECTIVO",
  "JEFE DE ENSEÑANZA",
  "SUPERVISOR",
  "ASESOR TECNICO PEDAGOGICO"
]

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [activeTab, setActiveTab] = useState(PROGRAM_RUBROS[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false)
  const [isHelpDeskOpen, setIsHelpDeskOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [officeFilter, setOficinaFilter] = useState('all')
  const [pendingCount, setPendingRequestsCount] = useState(0)

  const initialFormState: ProgramStatus = {
    id: '', name: '', progress: 0, status: 'activo', date: new Date().toISOString().split('T')[0], cct: '', schoolName: '', 
    zonaEscolar: '', sector: '', modalidad: '', municipio: '', region: '', valle: '',
    numeroEquipos: 0, observaciones: '', capacitacion: 'N', asistentes: [], email: '',
    oficinaRegionalAtencion: '',
    mantenimientoDetalle: {
      equipoTecnologico: '',
      equipoTecnologicoOtro: '',
      equipos: Array(10).fill({ equipo: '', marca: '', serie: '', censal: '' }),
      fallaIdentificada: '',
      servicioRealizado: ''
    }
  }

  const [formData, setFormData] = useState<ProgramStatus>(initialFormState)

  const syncData = useCallback(() => {
    const currentVersion = 'programs_full_v24'
    const storedV24 = localStorage.getItem(currentVersion)
    if (storedV24) {
      setRecords(JSON.parse(storedV24))
    } else {
      setRecords(programsData)
      localStorage.setItem(currentVersion, JSON.stringify(programsData))
    }

    const rawQueue = localStorage.getItem('atres_support_queue')
    const queue = rawQueue ? JSON.parse(rawQueue) : []
    setPendingRequestsCount(queue.length)
  }, [])

  useEffect(() => {
    setMounted(true)
    syncData()
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'atres_support_queue' || e.key === 'programs_full_v24') {
        syncData()
      }
    }
    window.addEventListener('storage', handleStorageEvent)
    return () => window.removeEventListener('storage', handleStorageEvent)
  }, [syncData])

  const handleAddAssistant = () => {
    const newAssistant = {
      nombreUsuario: '',
      cct: '',
      correo: '',
      funcion: '',
      dominio: DOMINIOS[0],
      valle: '',
      departamento: ''
    };
    setFormData(prev => ({
      ...prev,
      asistentes: [...(prev.asistentes || []), newAssistant]
    }));
  }

  const handleRemoveAssistant = (index: number) => {
    const updated = (formData.asistentes || []).filter((_, i) => i !== index);
    setFormData({ ...formData, asistentes: updated });
  }

  const updateAssistantField = (index: number, field: string, value: string) => {
    const updated = [...(formData.asistentes || [])];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'cct' && value.length === 10) {
      const school = schoolsDirectory.find(s => s.cct.toUpperCase() === value.toUpperCase());
      if (school) {
        updated[index].valle = school.valle;
      }
    }
    
    setFormData({ ...formData, asistentes: updated });
  }

  const handleSave = () => {
    const updated = editingId 
      ? records.map(r => r.id === editingId ? formData : r) 
      : [{...formData, id: formData.id || `SOL-${Date.now()}`}, ...records];
    setRecords(updated)
    localStorage.setItem('programs_full_v24', JSON.stringify(updated))
    setIsDialogOpen(false)
    setEditingId(null)
    setFormData(initialFormState)
    toast({ title: "Registro guardado" })
  }

  const filteredRecords = useMemo(() => {
    let filtered = records.filter(r => r.name === activeTab);
    if (searchTerm) {
      const term = searchTerm.toUpperCase();
      filtered = filtered.filter(r => (r.cct || '').toUpperCase().includes(term) || (r.schoolName || '').toUpperCase().includes(term));
    }
    if (officeFilter !== 'all') {
      filtered = filtered.filter(r => r.oficinaRegionalAtencion === officeFilter);
    }
    return [...filtered].sort((a, b) => {
       const dateA = a.date || '';
       const dateB = b.date || '';
       return dateB.localeCompare(dateA);
    });
  }, [records, activeTab, searchTerm, officeFilter]);

  if (!mounted) return null

  return (
    <div className="space-y-4 animate-in fade-in duration-700 w-full max-w-[1450px] mx-auto overflow-hidden px-2">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-primary/5 pb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-primary uppercase leading-none">Módulos Técnicos COEES</h2>
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-accent" />
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.1em]">Control de Programas y Auditoría 2026</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {activeTab === 'ATRES' && (
            <div className="relative flex-1 sm:flex-none">
              <Button onClick={() => setIsHelpDeskOpen(true)} className={cn("h-10 px-6 rounded-xl shadow-md font-black uppercase text-[10px] gap-2 w-full transition-all duration-300", pendingCount > 0 ? "bg-rose-600 hover:bg-rose-700 ring-4 ring-rose-200 animate-pulse scale-105" : "bg-emerald-600 hover:bg-emerald-700 text-white")}>
                <Headset className={cn("h-4 w-4", pendingCount > 0 && "animate-bounce")} /> {pendingCount > 0 ? `${pendingCount} SOLICITUDES` : "Mesa de Ayuda ATRES"}
              </Button>
            </div>
          )}
          <Button variant="outline" className="h-10 px-6 border-primary/20 text-primary font-black uppercase text-[10px] gap-2 rounded-xl hover:bg-primary/5 shadow-md flex-1 sm:flex-none" onClick={() => setIsSchedulerOpen(true)}><CalendarDays className="h-4 w-4" /> Agenda</Button>
          <Button onClick={() => { 
            const f = {...initialFormState, name: activeTab};
            if (activeTab === 'Cuentas Institucionales' || activeTab === 'Biblioteca Digital' || activeTab === 'ATRES') {
              f.asistentes = [{ nombreUsuario: '', cct: '', correo: '', funcion: '', dominio: DOMINIOS[0], valle: '', departamento: '' }];
            }
            setFormData(f); 
            setEditingId(null); 
            setIsDialogOpen(true); 
          }} className="btn-institutional h-10 px-8 rounded-xl shadow-md text-[10px] flex-1 sm:flex-none"><PlusCircle className="h-4 w-4 mr-2" /> Nuevo Registro</Button>
        </div>
      </div>

      <Card className="executive-card p-4 bg-white/80 border-none shadow-lg mt-4">
        <div className="flex flex-col md:flex-row items-end gap-4">
           <div className="flex-1 w-full space-y-1">
              <Label className="text-[9px] font-black uppercase text-slate-400 mb-1 block pl-1">Seleccionar Módulo Institucional</Label>
              <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                {PROGRAM_RUBROS.map(rubro => (
                  <button 
                    key={`rubro-${rubro}`} 
                    onClick={() => { setActiveTab(rubro); setSearchTerm(''); }}
                    className={cn(
                      "px-5 h-10 text-[10px] font-black uppercase rounded-xl transition-all whitespace-nowrap border shadow-sm",
                      activeTab === rubro 
                        ? "bg-primary text-white border-primary shadow-primary/20" 
                        : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
                    )}
                  >
                    {rubro}
                  </button>
                ))}
              </div>
           </div>
           
           <div className="relative flex-1 w-full md:max-w-[300px]">
              <Label className="text-[9px] font-black uppercase text-slate-400 mb-1 block pl-1">Buscador Operativo</Label>
              <div className="relative">
                <Input placeholder="CCT O PLANTEL..." className="h-10 rounded-xl bg-slate-50 border-primary/5 pl-9 text-[10px] font-black uppercase shadow-inner w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
           </div>

           <div className="min-w-[200px] w-full md:w-auto">
              <Label className="text-[9px] font-black uppercase text-slate-400 mb-1 block pl-1">Oficina Regional</Label>
              <Select value={officeFilter} onValueChange={setOficinaFilter}>
                <SelectTrigger className="h-10 w-full rounded-xl border-primary/5 bg-white text-[9px] font-black uppercase shadow-sm"><SelectValue placeholder="TODAS" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[9px] font-black uppercase">TODAS LAS OFICINAS</SelectItem>
                  {REGIONAL_OFFICES.map(off => <SelectItem key={`off-filter-${off}`} value={off} className="text-[9px] font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>)}
                </SelectContent>
              </Select>
           </div>
        </div>
      </Card>

      <Card className="executive-card p-0 shadow-2xl border-none overflow-hidden bg-white mt-4">
        <div className="overflow-x-auto w-full">
          <Table className="w-full">
            <TableHeader className="bg-slate-50 border-b">
               <TableRow className="h-12">
                  <TableHead className="w-10 text-[9px] font-black uppercase text-center pl-4 text-slate-400">#</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-primary tracking-widest w-[110px]">{activeTab === 'ATRES' ? 'Folio' : 'CCT'}</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-primary tracking-widest min-w-[150px]">Identificación del Plantel</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-primary tracking-widest w-[90px]">Estatus</TableHead>
                  <TableHead className="text-right text-[9px] font-black uppercase pr-6 text-slate-400 w-24">Acción</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? filteredRecords.map((rec, idx) => (
                <TableRow key={`${rec.id}-${idx}`} className="hover:bg-primary/[0.01] transition-all border-b border-slate-50 h-14 group">
                  <TableCell className="text-center font-black text-[10px] text-slate-300 pl-4">{idx + 1}</TableCell>
                  <TableCell className="font-black text-[10px] text-primary tracking-tight">{rec.id || rec.cct}</TableCell>
                  <TableCell className="py-2">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-black text-slate-700 uppercase leading-tight truncate max-w-[180px]">{rec.schoolName}</span>
                      <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-70 truncate max-w-[180px]">{rec.municipio} • {rec.valle}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                     <Badge variant="outline" className={cn("text-[8px] font-black uppercase py-0.5 px-2 rounded-full", (rec.status === 'activo' || rec.status === 'pendiente' || rec.status === 'en proceso') ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-emerald-200 text-emerald-700 bg-emerald-50')}>{rec.status?.toUpperCase() || 'ACTIVO'}</Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setFormData({...initialFormState, ...rec}); setEditingId(rec.id); setIsDialogOpen(true); }} className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { setRecords(records.filter(r => r.id !== rec.id)); localStorage.setItem('programs_full_v24', JSON.stringify(records.filter(r => r.id !== rec.id))); }} className="h-7 w-7 flex items-center justify-center text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (<TableRow><TableCell colSpan={10} className="text-center py-24 opacity-30 text-xs font-black uppercase tracking-widest">Sin registros disponibles</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </div>
      </Card>

      <HelpDeskDialog open={isHelpDeskOpen} onOpenChange={setIsHelpDeskOpen} />
      <VisitSchedulerDialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen} areaId="programas" areaName="Programas" />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[1250px] rounded-[2rem] h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white shrink-0">
             <DialogTitle className="uppercase font-black text-white text-xl flex items-center gap-4">
                <Target className="h-7 w-7 text-white/40" /> Gestión de {activeTab}
             </DialogTitle>
             <DialogDescription className="text-white/60 font-bold text-[10px] uppercase tracking-widest mt-1">
                Captura de censo de personal para el módulo institucional.
             </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden bg-white">
            <ScrollArea className="h-full">
              <div className="p-8 space-y-10">
                {/* Sección: Censo de Personal */}
                {(activeTab === 'Biblioteca Digital' || activeTab === 'Cuentas Institucionales' || activeTab === 'ATRES') && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b-2 border-primary/10 pb-2">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-primary" />
                        <h3 className="text-sm font-black uppercase text-primary">Censo de Personal del Módulo</h3>
                      </div>
                      <Button onClick={handleAddAssistant} className="gap-2 font-black uppercase text-[10px] h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-md">
                        <Plus className="h-4 w-4" /> Añadir Usuario
                      </Button>
                    </div>

                    <div className="border-2 border-slate-100 rounded-[1.5rem] bg-white overflow-hidden shadow-inner min-h-[300px]">
                      <ScrollArea className="h-full">
                        <Table>
                          <TableHeader className="bg-slate-50 sticky top-0 z-20 shadow-sm">
                              <TableRow>
                                <TableHead className="w-12 text-[9px] font-black uppercase text-center">#</TableHead>
                                <TableHead className="min-w-[180px] text-[9px] font-black uppercase">Nombre del Usuario</TableHead>
                                <TableHead className="min-w-[120px] text-[9px] font-black uppercase">CCT</TableHead>
                                <TableHead className="min-w-[140px] text-[9px] font-black uppercase">Correo</TableHead>
                                <TableHead className="min-w-[140px] text-[9px] font-black uppercase">Función</TableHead>
                                <TableHead className="min-w-[150px] text-[9px] font-black uppercase">Dominio</TableHead>
                                <TableHead className="min-w-[120px] text-[9px] font-black uppercase text-center">Valle</TableHead>
                                <TableHead className="min-w-[140px] text-[9px] font-black uppercase">Departamento</TableHead>
                                <TableHead className="w-16 sticky right-0 bg-slate-50"></TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {(formData.asistentes || []).map((ast, idx) => (
                                <TableRow key={`ast-${idx}`} className="hover:bg-slate-50/50 group border-b border-slate-50">
                                    <TableCell className="text-center font-black text-[10px] text-muted-foreground">{idx + 1}</TableCell>
                                    <TableCell className="p-2">
                                      <Input 
                                          placeholder="APELLIDOS NOMBRE..." 
                                          className="h-9 text-[10px] uppercase font-bold border-primary/5 bg-primary/[0.02]" 
                                          value={ast.nombreUsuario} 
                                          onChange={e => updateAssistantField(idx, 'nombreUsuario', e.target.value.toUpperCase())} 
                                      />
                                    </TableCell>
                                    <TableCell className="p-2">
                                      <Input 
                                          placeholder="15DES0000X" 
                                          className="h-9 text-[10px] font-mono font-black uppercase" 
                                          value={ast.cct} 
                                          onChange={e => updateAssistantField(idx, 'cct', e.target.value.toUpperCase())} 
                                          maxLength={10} 
                                      />
                                    </TableCell>
                                    <TableCell className="p-2">
                                      <div className="relative group">
                                          <Input 
                                            placeholder="usuario.ejemplo" 
                                            className="h-9 text-[10px] font-semibold border-accent/20 bg-accent/[0.02] pl-8" 
                                            value={ast.correo} 
                                            onChange={e => updateAssistantField(idx, 'correo', e.target.value.toLowerCase())} 
                                          />
                                          <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-accent opacity-40" />
                                      </div>
                                    </TableCell>
                                    <TableCell className="p-2">
                                      <Select value={ast.funcion} onValueChange={v => updateAssistantField(idx, 'funcion', v)}>
                                          <SelectTrigger className="h-9 text-[10px] font-bold uppercase">
                                            <SelectValue placeholder="FUNCIÓN..." />
                                          </SelectTrigger>
                                          <SelectContent className="rounded-xl">
                                            {FUNCIONES.map(f => <SelectItem key={`f-${f}`} value={f} className="text-[10px] font-bold uppercase">{f}</SelectItem>)}
                                          </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell className="p-2">
                                      <Select value={ast.dominio} onValueChange={v => updateAssistantField(idx, 'dominio', v)}>
                                          <SelectTrigger className="h-9 text-[10px] font-black uppercase border-slate-200">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent className="rounded-xl">
                                            {DOMINIOS.map(d => <SelectItem key={`dom-${d}`} value={d} className="text-[10px] font-bold">@{d}</SelectItem>)}
                                          </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell className="p-2">
                                      <Select value={ast.valle} onValueChange={v => updateAssistantField(idx, 'valle', v)}>
                                          <SelectTrigger className="h-9 text-center text-[10px] font-black uppercase border-slate-200">
                                            <SelectValue placeholder="VALLE..." />
                                          </SelectTrigger>
                                          <SelectContent className="rounded-xl">
                                            <SelectItem value="TOLUCA" className="text-[10px] font-bold uppercase">TOLUCA</SelectItem>
                                            <SelectItem value="MEXICO" className="text-[10px] font-bold uppercase">MÉXICO</SelectItem>
                                          </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell className="p-2">
                                      <Input 
                                          placeholder="OFICINA / DEPTO..." 
                                          className="h-9 text-[10px] font-bold uppercase border-slate-200" 
                                          value={ast.departamento} 
                                          onChange={e => updateAssistantField(idx, 'departamento', e.target.value.toUpperCase())} 
                                      />
                                    </TableCell>
                                    <TableCell className="p-2 sticky right-0 bg-white shadow-l">
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg" onClick={() => handleRemoveAssistant(idx)}>
                                          <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    </div>
                  </div>
                )}

                {/* Sección: Diagnóstico Final */}
                <div className="space-y-4 pt-6">
                  <div className="flex items-center gap-3 border-b-2 border-primary/10 pb-2">
                    <Info className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-black uppercase text-primary">Observaciones Técnicas</h3>
                  </div>
                  <Textarea 
                    className="min-h-[140px] rounded-xl p-5 bg-slate-50 border-2 border-slate-200 text-xs font-semibold shadow-inner focus:bg-white" 
                    value={formData.observaciones} 
                    onChange={e => setFormData({...formData, observaciones: e.target.value})} 
                    placeholder="Detalle técnico o acuerdos del módulo..." 
                  />
                </div>
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="p-6 gap-3 border-t bg-slate-50 flex items-center justify-end shrink-0">
             <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-11 px-6 text-[10px] font-black uppercase">Cancelar</Button>
             <Button onClick={handleSave} className="btn-institutional h-11 px-10 text-[10px]">Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
