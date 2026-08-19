
'use client'
import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { schoolsDirectory, type SchoolInfo } from '@/lib/schools-directory'
import { type VisitSchedule } from '@/lib/planning-data'
import { Calendar, UserCog, Search, PlusCircle, Trash2, CheckCircle2, Clock, Circle, Bell, X, AlertCircle, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

type VisitSchedulerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  areaId: string;
  areaName: string;
}

const PURPOSE_MAPPING: Record<string, string[]> = {
  soporte: [
    "Mantenimiento Equipo de Computo",
    "Mantenimiento Red Local",
    "Mantenimiento Red Edusat",
    "Teleplanteles",
    "Instalación Red Local",
    "Instalación Equipo de Computo",
    "Promoción"
  ],
  capacitacion: [
    "Capacitación al Curso/Diplomado",
    "Asesoría",
    "Diseño de Curso",
    "Promoción"
  ],
  programas: [
    "Cuenta Institucional: Creación",
    "Cuenta Institucional: Restructuración",
    "Cuenta Institucional: Contraseña",
    "Biblioteca Digital",
    "Curso Biblioteca Digital",
    "Promoción",
    "Mantenimiento Equipo",
    "Mantenimiento Red Local",
    "ATRES",
    "Geoposición",
    "Conoce mi Escuela"
  ]
};

export function VisitSchedulerDialog({ open, onOpenChange, areaId, areaName }: VisitSchedulerDialogProps) {
  const { toast } = useToast()
  const [visits, setVisits] = useState<VisitSchedule[]>([])
  const [listSearchTerm, setListSearchTerm] = useState('')
  const [cctSearchTerm, setCctSearchTerm] = useState('')
  const [filterCritical, setFilterCritical] = useState(false)
  const [mounted, setMounted] = useState(false)

  // CCT Dynamic Logic
  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([])
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddForm, setQuickAddForm] = useState<SchoolInfo>({
    region: '', valle: 'MEXICO', municipio: '', subsistema: 'FEDERALIZADO', control: 'OFICIAL',
    nivel: 'SECUNDARIA', servicioEducativo: 'SECUNDARIA GENERAL', cct: '', turno: 'MATUTINO',
    nombre: '', domicilio: '', localidad: '', telefono: '', zonaEscolar: '', sector: '',
    director: '', hombres: 0, mujeres: 0, alumnos: 0, grupos: 0, maestros: 0, administrativos: 0,
    aulasExistentes: 0, aulasEnUso: 0, modalidad: 'DES'
  })

  const today = format(new Date(), 'yyyy-MM-dd')

  const initialForm: Omit<VisitSchedule, 'id'> = {
    areaId: areaId,
    cct: '',
    schoolName: '',
    date: today,
    purpose: '',
    technicians: '',
    status: 'pendiente',
    observaciones: ''
  }

  const [formData, setFormData] = useState(initialForm)

  useEffect(() => {
    setMounted(true)
    const stored = JSON.parse(localStorage.getItem('coees_visits_v1') || '[]')
    setVisits(stored)

    const storedSchools = JSON.parse(localStorage.getItem('schools_master_full_v21') || '[]')
    if (storedSchools.length > 0) {
      setAllSchools(storedSchools)
    } else {
      setAllSchools(schoolsDirectory)
    }
  }, [])

  useEffect(() => {
    setFormData(prev => ({ ...prev, areaId: areaId, purpose: '' }))
  }, [areaId])

  useEffect(() => {
    if (open && mounted) {
      const criticalCount = visits.filter(v => 
        v.areaId === areaId && 
        (v.status === 'pendiente' || v.status === 'en proceso') && 
        v.date <= today
      ).length;

      if (criticalCount > 0) {
        toast({
          title: "¡Atención Operativa!",
          description: `Existen ${criticalCount} visitas pendientes con fecha crítica.`,
          variant: "destructive"
        })
      }
    }
  }, [open, mounted, visits, areaId, today, toast])

  const handleCctChange = (val: string) => {
    const cleanVal = val.toUpperCase()
    setFormData(prev => ({ ...prev, cct: cleanVal }))
    if (cleanVal.length === 10) {
      const match = allSchools.find(s => s.cct.toUpperCase() === cleanVal)
      if (match) {
        setFormData(prev => ({ ...prev, schoolName: match.nombre }))
      } else {
        setFormData(prev => ({ ...prev, schoolName: '' }))
      }
    } else {
      setFormData(prev => ({ ...prev, schoolName: '' }))
    }
  }

  const handleQuickAddCct = () => {
    if (!quickAddForm.cct || !quickAddForm.nombre || !quickAddForm.municipio) {
      toast({ variant: "destructive", title: "Faltan datos" }); return;
    }
    const newSchool = { ...quickAddForm, cct: quickAddForm.cct.toUpperCase(), nombre: quickAddForm.nombre.toUpperCase(), municipio: quickAddForm.municipio.toUpperCase() };
    const updated = [newSchool, ...allSchools];
    setAllSchools(updated);
    localStorage.setItem('schools_master_full_v21', JSON.stringify(updated));
    handleCctChange(newSchool.cct);
    setIsQuickAddOpen(false);
    setCctSearchTerm('');
    toast({ title: "CCT Registrado en Base Maestra" });
  }

  const handleResetForm = () => {
    setFormData({ ...initialForm, areaId })
  }

  const handleSave = () => {
    if (!formData.cct || !formData.date || !formData.purpose) {
      toast({ variant: "destructive", title: "Datos Incompletos", description: "CCT, Fecha y Propósito son obligatorios." })
      return
    }

    const newVisit: VisitSchedule = {
      ...formData,
      id: `VISIT-${Date.now()}`
    }

    const updated = [newVisit, ...visits]
    setVisits(updated)
    localStorage.setItem('coees_visits_v1', JSON.stringify(updated))
    
    handleResetForm()
    toast({ title: "Visita Creada" })
  }

  const handleDelete = (id: string) => {
    const updated = visits.filter(v => v.id !== id)
    setVisits(updated)
    localStorage.setItem('coees_visits_v1', JSON.stringify(updated))
    toast({ title: "Registro eliminado" })
  }

  const handleUpdateStatus = (id: string, newStatus: VisitSchedule['status']) => {
    const updated = visits.map(v => v.id === id ? { ...v, status: newStatus } : v)
    setVisits(updated)
    localStorage.setItem('coees_visits_v1', JSON.stringify(updated))
    toast({ title: "Estatus Actualizado" })
  }

  const schoolSearchResults = useMemo(() => {
    if (!cctSearchTerm || cctSearchTerm.length < 3) return [];
    const term = cctSearchTerm.toUpperCase();
    return allSchools.filter(s => s.cct.includes(term) || s.nombre.includes(term)).slice(0, 5);
  }, [allSchools, cctSearchTerm]);

  const areaVisits = useMemo(() => {
    let filtered = visits.filter(v => v.areaId === areaId)
    if (listSearchTerm) {
      filtered = filtered.filter(v => 
        (v.cct || '').toUpperCase().includes(listSearchTerm.toUpperCase()) ||
        (v.schoolName || '').toUpperCase().includes(listSearchTerm.toUpperCase())
      )
    }
    if (filterCritical) {
      filtered = filtered.filter(v => (v.status === 'pendiente' || v.status === 'en proceso') && v.date <= today)
    }
    return filtered.sort((a, b) => b.date.localeCompare(a.date))
  }, [visits, areaId, listSearchTerm, filterCritical, today])

  const currentPurposeOptions = PURPOSE_MAPPING[areaId] || PURPOSE_MAPPING['soporte'];

  if (!mounted) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1300px] h-[95vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
        <DialogHeader className="p-4 pb-2 bg-slate-50 border-b shrink-0 flex flex-row justify-between items-center pr-12">
          <div className="space-y-1">
            <DialogTitle className="uppercase font-black text-primary text-xl flex items-center gap-3">
              <Calendar className="h-6 w-6 text-accent" /> Agenda de Visitas: {areaName}
            </DialogTitle>
          </div>
          {filterCritical && <Badge className="bg-rose-600 text-white">Viendo Alertas Críticas</Badge>}
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="w-full md:w-[320px] border-r bg-white flex flex-col shrink-0 overflow-hidden">
            <div className="p-3 space-y-2 flex-1 overflow-hidden">
              <div className="space-y-1 relative">
                <Label className="text-[8px] font-black uppercase text-primary">Localizar Plantel (CCT o Nombre)</Label>
                <div className="relative">
                  <Input 
                      placeholder="BUSCAR..." 
                      className="h-7 border-primary/10 bg-slate-50 pl-7 text-[9px] uppercase font-bold" 
                      value={cctSearchTerm} 
                      onChange={e => setCctSearchTerm(e.target.value)} 
                  />
                  <Search className="absolute left-2 top-2 h-3 w-3 text-slate-300" />
                  {cctSearchTerm.length > 2 && (
                    <div className="absolute left-0 right-0 top-8 max-h-40 overflow-auto bg-white border rounded-xl shadow-2xl z-50 divide-y">
                      {schoolSearchResults.map(s => (
                        <div key={`sch-${s.cct}-${s.turno}`} className="p-2 hover:bg-primary/5 cursor-pointer flex justify-between items-center" onClick={() => { handleCctChange(s.cct); setCctSearchTerm('') }}>
                          <span className="text-[9px] font-black uppercase truncate max-w-[150px]">{s.nombre}</span>
                          <Badge className="text-[7px] font-mono">{s.cct}</Badge>
                        </div>
                      ))}
                      {schoolSearchResults.length === 0 && (
                        <div className="p-3 text-center">
                          <Button size="sm" variant="ghost" className="h-6 text-[8px] font-black uppercase text-primary" onClick={() => { setQuickAddForm({...quickAddForm, cct: cctSearchTerm.toUpperCase()}); setIsQuickAddOpen(true); }}>
                            <Plus className="h-3 w-3 mr-1" /> Registrar Nuevo CCT
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {formData.cct && (
                  <div className="flex items-center gap-1 p-1 bg-emerald-50 rounded mt-1 border border-emerald-100">
                      <CheckCircle2 className="h-2 w-2 text-emerald-600" />
                      <p className="text-[7px] font-black text-emerald-700 uppercase leading-none truncate">{formData.schoolName} ({formData.cct})</p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-primary">Fecha de Visita</Label>
                <Input type="date" className="h-7 border-primary/10 font-bold bg-slate-50 text-[9px]" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>

              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-primary">Propósito</Label>
                <Select value={formData.purpose} onValueChange={val => setFormData({...formData, purpose: val})}>
                  <SelectTrigger className="h-7 border-primary/10 font-bold uppercase text-[8px] bg-slate-50"><SelectValue placeholder="SELECCIONAR..." /></SelectTrigger>
                  <SelectContent>
                    {currentPurposeOptions.map(opt => (<SelectItem key={opt} value={opt} className="text-[8px] font-bold uppercase">{opt}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-primary">Personal Comisionado</Label>
                <Input className="h-7 border-primary/10 font-bold uppercase text-[8px] bg-slate-50" placeholder="NOMBRES..." value={formData.technicians} onChange={e => setFormData({...formData, technicians: e.target.value.toUpperCase()})} />
              </div>

              <div className="pt-2">
                <Button onClick={handleSave} className="w-full btn-institutional h-10 text-[9px] shadow-lg">GUARDAR VISITA</Button>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-slate-50/30 p-4 flex flex-col overflow-hidden">
             <div className="flex flex-col md:flex-row justify-between items-center gap-3 mb-3 shrink-0">
                <div className="flex items-center gap-2">
                   <h3 className="text-[9px] font-black uppercase text-slate-700 tracking-[0.15em]">Bitácora de Salidas</h3>
                   <Badge variant="outline" className="text-[8px] border-primary/20 text-primary">{areaVisits.length} Registros</Badge>
                </div>
                <div className="relative w-full md:w-64 group">
                   <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
                   <Input placeholder="FILTRAR POR CCT..." className="h-8 pl-9 rounded-xl border-primary/10 bg-white text-[8px] font-black uppercase" value={listSearchTerm} onChange={(e) => setListSearchTerm(e.target.value)} />
                </div>
             </div>

             <div className="flex-1 border rounded-[2rem] bg-white shadow-inner overflow-hidden">
                <ScrollArea className="h-full">
                   <Table>
                      <TableHeader className="bg-slate-50 sticky top-0 z-10"><TableRow><TableHead className="text-[8px] font-black uppercase h-10 pl-6">Fecha</TableHead><TableHead className="text-[8px] font-black uppercase h-10">CCT / Plantel</TableHead><TableHead className="text-[8px] font-black uppercase h-10 text-center">Estatus</TableHead><TableHead className="w-10 h-10"></TableHead></TableRow></TableHeader>
                      <TableBody>
                        {areaVisits.map((v) => (
                          <TableRow key={v.id} className="hover:bg-slate-50 group">
                            <TableCell className="pl-6 font-black text-[8px] text-primary">{v.date}</TableCell>
                            <TableCell><div className="flex flex-col"><span className="text-[9px] font-black text-slate-700 leading-none">{v.cct}</span><span className="text-[7px] font-bold text-muted-foreground uppercase truncate mt-1">{v.schoolName}</span></div></TableCell>
                            <TableCell className="text-center"><Select defaultValue={v.status} onValueChange={(val: any) => handleUpdateStatus(v.id, val)}><SelectTrigger className={cn("h-7 w-28 text-[7px] font-black uppercase border-2 rounded-full mx-auto", v.status === 'atendido' ? 'bg-emerald-50 text-emerald-700 border-emerald-500/30' : v.status === 'en proceso' ? 'bg-amber-50 text-amber-700 border-amber-500/30' : 'bg-rose-50 text-rose-700 border-rose-500/30')}><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="pendiente" className="text-[8px] font-black">🔴 PENDIENTE</SelectItem><SelectItem value="en proceso" className="text-[8px] font-black">🟡 EN PROCESO</SelectItem><SelectItem value="atendido" className="text-[8px] font-black">🟢 ATENDIDO</SelectItem></SelectContent></Select></TableCell>
                            <TableCell className="pr-4"><Button variant="ghost" size="icon" className="h-6 w-6 text-rose-300 hover:text-rose-600" onClick={() => handleDelete(v.id)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                   </Table>
                </ScrollArea>
             </div>
          </div>
        </div>

        {/* Diálogo de Alta Rápida de CCT */}
        <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
          <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
            <DialogHeader className="p-6 bg-[#B38E5D] text-white">
              <DialogTitle className="uppercase font-black text-lg flex items-center gap-3"><PlusCircle className="h-6 w-6" /> Registro de Nuevo CCT</DialogTitle>
            </DialogHeader>
            <div className="p-8 space-y-4">
               <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">CCT (10 Dígitos)</Label><Input value={quickAddForm.cct} onChange={e => setQuickAddForm({...quickAddForm, cct: e.target.value.toUpperCase()})} maxLength={10} className="font-mono font-black" /></div>
               <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Nombre del Plantel</Label><Input value={quickAddForm.nombre} onChange={e => setQuickAddForm({...quickAddForm, nombre: e.target.value.toUpperCase()})} className="font-black" /></div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Turno</Label><Select value={quickAddForm.turno} onValueChange={v => setQuickAddForm({...quickAddForm, turno: v})}><SelectTrigger className="text-[10px] font-bold uppercase"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MATUTINO">MATUTINO</SelectItem><SelectItem value="VESPERTINO">VESPERTINO</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Valle</Label><Select value={quickAddForm.valle} onValueChange={v => setQuickAddForm({...quickAddForm, valle: v})}><SelectTrigger className="text-[10px] font-bold uppercase"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MEXICO">MÉXICO</SelectItem><SelectItem value="TOLUCA">TOLUCA</SelectItem></SelectContent></Select></div>
               </div>
               <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Municipio</Label><Input value={quickAddForm.municipio} onChange={e => setQuickAddForm({...quickAddForm, municipio: e.target.value.toUpperCase()})} className="font-bold uppercase" /></div>
            </div>
            <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-3"><Button variant="ghost" onClick={() => setIsQuickAddOpen(false)} className="h-10 text-[9px] font-black uppercase">Cancelar</Button><Button onClick={handleQuickAddCct} className="bg-primary text-white h-10 px-8 rounded-xl text-[9px] font-black uppercase shadow-lg">Registrar y Sumar</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <DialogFooter className="p-3 bg-slate-50 border-t flex justify-end shrink-0"><Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-9 px-6 text-[8px] font-black uppercase border-slate-200">Cerrar Agenda</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
