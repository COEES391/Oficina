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
import { schoolsDirectory } from '@/lib/schools-directory'
import { type VisitSchedule } from '@/lib/planning-data'
import { Calendar, MapPin, UserCog, Search, PlusCircle, Trash2, CheckCircle2, Clock, School, LayoutGrid, Circle, Eraser } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type VisitSchedulerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  areaId: string;
  areaName: string;
}

export function VisitSchedulerDialog({ open, onOpenChange, areaId, areaName }: VisitSchedulerDialogProps) {
  const { toast } = useToast()
  const [visits, setVisits] = useState<VisitSchedule[]>([])
  const [listSearchTerm, setListSearchTerm] = useState('')
  const [mounted, setMounted] = useState(false)

  const initialForm: Omit<VisitSchedule, 'id'> = {
    areaId: areaId,
    cct: '',
    schoolName: '',
    date: new Date().toISOString().split('T')[0],
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
  }, [])

  useEffect(() => {
    setFormData(prev => ({ ...prev, areaId: areaId }))
  }, [areaId])

  const handleCctChange = (val: string) => {
    const cleanVal = val.toUpperCase()
    setFormData(prev => ({ ...prev, cct: cleanVal }))
    if (cleanVal.length === 10) {
      const match = schoolsDirectory.find(s => s.cct.toUpperCase() === cleanVal)
      if (match) {
        setFormData(prev => ({ ...prev, schoolName: match.nombre }))
      } else {
        setFormData(prev => ({ ...prev, schoolName: '' }))
      }
    } else {
      setFormData(prev => ({ ...prev, schoolName: '' }))
    }
  }

  const handleResetForm = () => {
    setFormData({ ...initialForm, areaId })
    toast({
      description: "Formulario restablecido para nueva captura.",
      className: "bg-slate-800 text-white border-none",
    })
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
    
    // Limpiar después de crear
    setFormData({ ...initialForm, areaId })
    toast({ 
      title: "Visita Creada", 
      description: "El registro se ha añadido a la bitácora de la derecha.",
    })
  }

  const handleDelete = (id: string) => {
    const updated = visits.filter(v => v.id !== id)
    setVisits(updated)
    localStorage.setItem('coees_visits_v1', JSON.stringify(updated))
    toast({ title: "Registro eliminado" })
  }

  const areaVisits = useMemo(() => {
    let filtered = visits.filter(v => v.areaId === areaId)
    if (listSearchTerm) {
      filtered = filtered.filter(v => 
        (v.cct || '').toUpperCase().includes(listSearchTerm.toUpperCase()) ||
        (v.schoolName || '').toUpperCase().includes(listSearchTerm.toUpperCase())
      )
    }
    return filtered.sort((a, b) => b.date.localeCompare(a.date))
  }, [visits, areaId, listSearchTerm])

  if (!mounted) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1300px] h-[95vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
        <DialogHeader className="p-8 pb-4 bg-slate-50 border-b">
          <DialogTitle className="uppercase font-black text-primary text-2xl flex items-center gap-4">
            <Calendar className="h-8 w-8 text-accent" /> Programación de Visitas: {areaName}
          </DialogTitle>
          <DialogDescription className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
            Agenda de salidas técnicas y supervisión institucional COEES 2026.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Formulario de Captura */}
          <div className="w-full md:w-[380px] border-r bg-white p-8 space-y-6">
            <div className="flex items-center justify-between border-b-2 border-accent/10 pb-2">
               <button 
                onClick={handleResetForm}
                className="text-[11px] font-black uppercase text-accent hover:text-primary transition-colors flex items-center gap-2 group"
               >
                 <PlusCircle className="h-4 w-4 group-hover:scale-110 transition-transform" /> 
                 Nueva Salida
               </button>
               <Badge variant="outline" className="text-[8px] font-black border-none text-slate-300">MODO CAPTURA</Badge>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary">CCT del Plantel</Label>
                <div className="relative">
                   <Input 
                      placeholder="15DES0000X" 
                      className="h-11 font-mono uppercase border-primary/10 bg-slate-50 pl-10 focus:bg-white transition-colors" 
                      value={formData.cct} 
                      onChange={e => handleCctChange(e.target.value)} 
                      maxLength={10}
                   />
                   <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-300" />
                </div>
                {formData.schoolName && (
                   <div className="flex items-center gap-1.5 p-2 bg-emerald-50 rounded-lg animate-in slide-in-from-left-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <p className="text-[9px] font-black text-emerald-700 uppercase leading-none">{formData.schoolName}</p>
                   </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary">Fecha de Visita</Label>
                <Input type="date" className="h-11 border-primary/10 font-bold bg-slate-50 focus:bg-white" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary">Propósito / Motivo</Label>
                <Select value={formData.purpose} onValueChange={val => setFormData({...formData, purpose: val})}>
                  <SelectTrigger className="h-11 border-primary/10 font-bold uppercase text-[10px] bg-slate-50"><SelectValue placeholder="SELECCIONAR..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mantenimiento Equipo de Computo" className="text-[10px] font-bold">MANTENIMIENTO EQUIPO DE COMPUTO</SelectItem>
                    <SelectItem value="Mantenimiento Red Local" className="text-[10px] font-bold">MANTENIMIENTO RED LOCAL</SelectItem>
                    <SelectItem value="Mantenimiento Red Edusat" className="text-[10px] font-bold">MANTENIMIENTO RED EDUSAT</SelectItem>
                    <SelectItem value="Teleplanteles" className="text-[10px] font-bold">TELEPLANTELES</SelectItem>
                    <SelectItem value="Instalación Red Local" className="text-[10px] font-bold">INSTALACIÓN RED LOCAL</SelectItem>
                    <SelectItem value="Instalación Equipo de Computo" className="text-[10px] font-bold">INSTALACIÓN EQUIPO DE COMPUTO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary">Personal Comisionado</Label>
                <div className="relative">
                   <Input 
                      className="h-11 border-primary/10 font-bold uppercase text-[10px] bg-slate-50 pl-10 focus:bg-white" 
                      placeholder="NOMBRES..." 
                      value={formData.technicians} 
                      onChange={e => setFormData({...formData, technicians: e.target.value.toUpperCase()})} 
                   />
                   <UserCog className="absolute left-3 top-3.5 h-4 w-4 text-slate-300" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary">Estatus Inicial</Label>
                <Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val})}>
                  <SelectTrigger className="h-11 border-primary/10 font-bold uppercase text-[10px] bg-slate-50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente" className="text-[10px] font-bold text-rose-600">🔴 PENDIENTE</SelectItem>
                    <SelectItem value="en proceso" className="text-[10px] font-bold text-amber-600">🟡 EN PROCESO</SelectItem>
                    <SelectItem value="atendido" className="text-[10px] font-bold text-emerald-600">🟢 ATENDIDO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSave} className="w-full btn-institutional h-16 mt-6 shadow-xl text-[11px] group">
                <CheckCircle2 className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                Crear Registro de Visita
              </Button>
              
              <p className="text-[8px] text-slate-400 font-bold uppercase text-center mt-4">
                El registro aparecerá automáticamente <br /> en la bitácora de la derecha.
              </p>
            </div>
          </div>

          {/* Listado de Visitas */}
          <div className="flex-1 bg-slate-50/50 p-8 flex flex-col overflow-hidden">
             <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400">
                      <Clock className="h-5 w-5" />
                   </div>
                   <div>
                      <h3 className="text-[11px] font-black uppercase text-slate-700 tracking-[0.2em] leading-none">Agenda de Salidas</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Registros vigentes: {areaVisits.length}</p>
                   </div>
                </div>
                
                <div className="relative w-full md:w-80 group">
                   <Search className="absolute left-4 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                   <Input 
                      placeholder="FILTRAR POR CCT O PLANTEL..." 
                      className="h-10 pl-11 rounded-2xl border-primary/10 bg-white text-[10px] font-black uppercase shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
                      value={listSearchTerm}
                      onChange={(e) => setListSearchTerm(e.target.value)}
                   />
                </div>
             </div>

             <div className="flex-1 border rounded-[2rem] bg-white shadow-inner overflow-hidden">
                <ScrollArea className="h-full">
                   <Table>
                      <TableHeader className="bg-slate-50 sticky top-0 z-10">
                         <TableRow>
                            <TableHead className="text-[10px] font-black uppercase h-14 pl-8">Fecha</TableHead>
                            <TableHead className="text-[10px] font-black uppercase h-14">CCT / Plantel</TableHead>
                            <TableHead className="text-[10px] font-black uppercase h-14">Propósito</TableHead>
                            <TableHead className="text-[10px] font-black uppercase h-14">Personal</TableHead>
                            <TableHead className="text-[10px] font-black uppercase h-14 text-center">Estatus Operativo</TableHead>
                            <TableHead className="w-16 h-14"></TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                        {areaVisits.length > 0 ? areaVisits.map((v) => (
                          <TableRow key={v.id} className="hover:bg-slate-50 transition-colors group">
                            <TableCell className="font-black text-[10px] text-primary pl-8">{v.date}</TableCell>
                            <TableCell>
                               <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-slate-700">{v.cct}</span>
                                  <span className="text-[8px] font-bold text-muted-foreground uppercase truncate max-w-[180px]">{v.schoolName}</span>
                               </div>
                            </TableCell>
                            <TableCell>
                               <Badge variant="outline" className="text-[8px] font-black border-primary/10 text-accent uppercase bg-accent/5">{v.purpose}</Badge>
                            </TableCell>
                            <TableCell className="text-[9px] font-bold text-slate-500 uppercase truncate max-w-[120px]">{v.technicians}</TableCell>
                            <TableCell className="text-center">
                               <div className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase shadow-sm border", 
                                  v.status === 'atendido' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                  v.status === 'en proceso' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                  'bg-rose-50 text-rose-700 border-rose-100'
                               )}>
                                  <Circle className={cn("h-2.5 w-2.5 fill-current", 
                                    v.status === 'atendido' ? 'text-emerald-500' : 
                                    v.status === 'en proceso' ? 'text-amber-500' : 
                                    'text-rose-500'
                                  )} />
                                  {v.status}
                               </div>
                            </TableCell>
                            <TableCell className="pr-8">
                               <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all" onClick={() => handleDelete(v.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                             <TableCell colSpan={6} className="text-center py-32 opacity-30">
                                <div className="flex flex-col items-center gap-6">
                                   <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center border-4 border-dashed border-slate-200">
                                      <Search className="h-10 w-10 text-slate-300" />
                                   </div>
                                   <div className="space-y-1">
                                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">Bitácora de Agenda Vacía</p>
                                      <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">
                                         {listSearchTerm ? 'No hay coincidencias para el CCT buscado.' : 'Use el panel izquierdo para agendar una nueva salida.'}
                                      </p>
                                   </div>
                                </div>
                             </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                   </Table>
                </ScrollArea>
             </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end">
           <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-12 px-10 text-[10px] font-black uppercase border-slate-200 hover:bg-white shadow-sm">Cerrar Agenda Operativa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
