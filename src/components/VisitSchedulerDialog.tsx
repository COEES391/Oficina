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
import { Calendar, UserCog, Search, PlusCircle, Trash2, CheckCircle2, Clock, Circle, Bell, AlertTriangle, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

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
  const [filterCritical, setFilterCritical] = useState(false)
  const [mounted, setMounted] = useState(false)

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
  }, [])

  useEffect(() => {
    setFormData(prev => ({ ...prev, areaId: areaId }))
  }, [areaId])

  // Reiniciar filtro al cerrar/abrir
  useEffect(() => {
    if (!open) setFilterCritical(false)
  }, [open])

  // Trigger alerts when dialog opens
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
          description: `Existen ${criticalCount} visitas pendientes o en proceso con fecha crítica.`,
          variant: "destructive"
        })
      }
    }
  }, [open, mounted, visits, areaId, today, toast])

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
    
    setFormData({ ...initialForm, areaId })
    toast({ 
      title: "Visita Creada", 
      description: "El registro se ha añadido a la bitácora.",
    })
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
    toast({ title: "Estatus Actualizado", description: `La visita ha sido marcada como ${newStatus.toUpperCase()}.` })
  }

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

  const criticalVisitsCount = useMemo(() => {
    return visits.filter(v => v.areaId === areaId && (v.status === 'pendiente' || v.status === 'en proceso') && v.date <= today).length;
  }, [visits, areaId, today]);

  if (!mounted) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1300px] h-[95vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
        <DialogHeader className="p-4 pb-2 bg-slate-50 border-b shrink-0 flex flex-row justify-between items-center pr-12">
          <div className="space-y-1">
            <DialogTitle className="uppercase font-black text-primary text-xl flex items-center gap-3">
              <Calendar className="h-6 w-6 text-accent" /> Agenda de Visitas: {areaName}
            </DialogTitle>
            <DialogDescription className="font-bold text-[9px] uppercase tracking-widest text-muted-foreground">
              Agenda de salidas técnicas y supervisión institucional COEES 2026.
            </DialogDescription>
          </div>
          {criticalVisitsCount > 0 && (
            <Button 
              onClick={() => setFilterCritical(!filterCritical)}
              className={cn(
                "h-10 px-6 border-none flex items-center gap-2 rounded-2xl transition-all duration-300 shadow-lg",
                filterCritical 
                  ? "bg-rose-700 text-white hover:bg-rose-800 scale-105 ring-4 ring-rose-200" 
                  : "bg-rose-600 text-white hover:bg-rose-700 animate-pulse"
              )}
            >
              {filterCritical ? <X className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              <span className="text-[10px] font-black uppercase">
                {filterCritical ? "Limpiar Filtro de Alertas" : `Alertas Críticas: ${criticalVisitsCount}`}
              </span>
            </Button>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Panel de Captura COMPACTO */}
          <div className="w-full md:w-[320px] border-r bg-white flex flex-col shrink-0 overflow-hidden">
            <div className="p-2 border-b bg-slate-50/50 flex items-center justify-between shrink-0">
               <button 
                onClick={handleResetForm}
                className="text-[8px] font-black uppercase text-accent hover:text-primary transition-colors flex items-center gap-2 group"
               >
                 <PlusCircle className="h-3 w-3 group-hover:scale-110 transition-transform" /> 
                 Nueva Salida
               </button>
               <Badge variant="outline" className="text-[6px] font-black border-none text-slate-300">CAPTURA DIRECTA</Badge>
            </div>
            
            <div className="p-3 space-y-2 flex-1 overflow-hidden">
              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-primary">CCT del Plantel</Label>
                <div className="relative">
                  <Input 
                      placeholder="15DES0000X" 
                      className="h-7 font-mono uppercase border-primary/10 bg-slate-50 pl-7 focus:bg-white text-[9px]" 
                      value={formData.cct} 
                      onChange={e => handleCctChange(e.target.value)} 
                      maxLength={10}
                  />
                  <Search className="absolute left-2 top-2 h-3 w-3 text-slate-300" />
                </div>
                {formData.schoolName && (
                  <div className="flex items-center gap-1 p-1 bg-emerald-50 rounded mt-1">
                      <CheckCircle2 className="h-2 w-2 text-emerald-600" />
                      <p className="text-[7px] font-black text-emerald-700 uppercase leading-none truncate">{formData.schoolName}</p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-primary">Fecha de Visita</Label>
                <Input type="date" className="h-7 border-primary/10 font-bold bg-slate-50 focus:bg-white text-[9px]" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>

              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-primary">Propósito / Motivo</Label>
                <Select value={formData.purpose} onValueChange={val => setFormData({...formData, purpose: val})}>
                  <SelectTrigger className="h-7 border-primary/10 font-bold uppercase text-[8px] bg-slate-50"><SelectValue placeholder="SELECCIONAR..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mantenimiento Equipo de Computo" className="text-[8px] font-bold">MANTENIMIENTO EQUIPO DE COMPUTO</SelectItem>
                    <SelectItem value="Mantenimiento Red Local" className="text-[8px] font-bold">MANTENIMIENTO RED LOCAL</SelectItem>
                    <SelectItem value="Mantenimiento Red Edusat" className="text-[8px] font-bold">MANTENIMIENTO RED EDUSAT</SelectItem>
                    <SelectItem value="Teleplanteles" className="text-[8px] font-bold">TELEPLANTELES</SelectItem>
                    <SelectItem value="Instalación Red Local" className="text-[8px] font-bold">INSTALACIÓN RED LOCAL</SelectItem>
                    <SelectItem value="Instalación Equipo de Computo" className="text-[8px] font-bold">INSTALACIÓN EQUIPO DE COMPUTO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-primary">Personal Comisionado</Label>
                <div className="relative">
                  <Input 
                      className="h-7 border-primary/10 font-bold uppercase text-[8px] bg-slate-50 pl-7 focus:bg-white" 
                      placeholder="NOMBRES..." 
                      value={formData.technicians} 
                      onChange={e => setFormData({...formData, technicians: e.target.value.toUpperCase()})} 
                  />
                  <UserCog className="absolute left-2 top-2 h-3 w-3 text-slate-300" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-primary">Estatus Inicial</Label>
                <Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val})}>
                  <SelectTrigger className="h-7 border-primary/10 font-bold uppercase text-[8px] bg-slate-50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente" className="text-[8px] font-bold text-rose-600">🔴 PENDIENTE</SelectItem>
                    <SelectItem value="en proceso" className="text-[8px] font-bold text-amber-600">🟡 EN PROCESO</SelectItem>
                    <SelectItem value="atendido" className="text-[8px] font-bold text-emerald-600">🟢 ATENDIDO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <Button onClick={handleSave} className="w-full btn-institutional h-10 shadow-lg text-[9px] group border-2 border-white/20">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-2 group-hover:scale-110 transition-transform" />
                  GUARDAR REGISTRO
                </Button>
                <p className="text-[6px] text-slate-400 font-bold uppercase text-center mt-1">LOS DATOS SE REFLEJARÁN EN LA BITÁCORA.</p>
              </div>
            </div>
          </div>

          {/* Listado de Visitas con Alertas */}
          <div className="flex-1 bg-slate-50/30 p-4 flex flex-col overflow-hidden">
             <div className="flex flex-col md:flex-row justify-between items-center gap-3 mb-3 shrink-0">
                <div className="flex items-center gap-2">
                   <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                   </div>
                   <div>
                      <h3 className="text-[9px] font-black uppercase text-slate-700 tracking-[0.15em] leading-none">
                        {filterCritical ? "Viendo Alertas Críticas" : "Bitácora de Salidas"}
                      </h3>
                      <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">Registros: {areaVisits.length}</p>
                   </div>
                </div>
                
                <div className="relative w-full md:w-64 group">
                   <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                   <Input 
                      placeholder="FILTRAR POR CCT..." 
                      className="h-8 pl-9 rounded-xl border-primary/10 bg-white text-[8px] font-black uppercase shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
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
                            <TableHead className="text-[8px] font-black uppercase h-10 pl-6">Fecha</TableHead>
                            <TableHead className="text-[8px] font-black uppercase h-10">CCT / Plantel</TableHead>
                            <TableHead className="text-[8px] font-black uppercase h-10">Propósito</TableHead>
                            <TableHead className="text-[8px] font-black uppercase h-10 text-center">Estatus</TableHead>
                            <TableHead className="w-10 h-10"></TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                        {areaVisits.length > 0 ? areaVisits.map((v) => {
                          const isAlert = (v.status === 'pendiente' || v.status === 'en proceso') && v.date <= today;
                          
                          return (
                            <TableRow key={v.id} className={cn(
                              "hover:bg-slate-50 transition-all group relative", 
                              isAlert && "bg-rose-50/50 border-l-4 border-l-rose-600"
                            )}>
                              <TableCell className="pl-6">
                                 <div className="flex items-center gap-2">
                                    {isAlert && <Bell className="h-3 w-3 text-rose-600 animate-bounce" />}
                                    <span className={cn("font-black text-[8px]", isAlert ? "text-rose-600" : "text-primary")}>
                                      {v.date}
                                    </span>
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-700 leading-none">{v.cct}</span>
                                    <span className="text-[7px] font-bold text-muted-foreground uppercase truncate max-w-[140px] mt-1">{v.schoolName}</span>
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <Badge variant="outline" className="text-[7px] font-black border-primary/5 text-accent uppercase bg-accent/5 py-0 px-2 h-5">{v.purpose}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                 <Select 
                                    defaultValue={v.status} 
                                    onValueChange={(val: any) => handleUpdateStatus(v.id, val)}
                                 >
                                    <SelectTrigger className={cn(
                                      "h-7 w-32 text-[7px] font-black uppercase border-2 rounded-full mx-auto transition-all",
                                      v.status === 'atendido' ? 'bg-emerald-50 text-emerald-700 border-emerald-500/30' :
                                      v.status === 'en proceso' ? 'bg-amber-50 text-amber-700 border-amber-500/30' :
                                      'bg-rose-50 text-rose-700 border-rose-500/30'
                                    )}>
                                      <div className="flex items-center gap-1">
                                        <Circle className={cn("h-1.5 w-1.5 fill-current", 
                                          v.status === 'atendido' ? 'text-emerald-500' : 
                                          v.status === 'en proceso' ? 'text-amber-500' : 
                                          'text-rose-500'
                                        )} />
                                        <SelectValue />
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200">
                                      <SelectItem value="pendiente" className="text-[8px] font-black text-rose-600">🔴 PENDIENTE</SelectItem>
                                      <SelectItem value="en proceso" className="text-[8px] font-black text-amber-600">🟡 EN PROCESO</SelectItem>
                                      <SelectItem value="atendido" className="text-[8px] font-black text-emerald-600">🟢 ATENDIDO</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </TableCell>
                              <TableCell className="pr-4">
                                 <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all" onClick={() => handleDelete(v.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                              </TableCell>
                            </TableRow>
                          )
                        }) : (
                          <TableRow>
                             <TableCell colSpan={5} className="text-center py-20 opacity-30">
                                <div className="flex flex-col items-center gap-2">
                                   <Search className="h-6 w-6 text-slate-300" />
                                   <p className="text-[8px] font-black uppercase">
                                     {filterCritical ? "No hay alertas críticas en esta área" : "Sin registros"}
                                   </p>
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

        <DialogFooter className="p-3 bg-slate-50 border-t flex justify-end shrink-0">
           <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-9 px-6 text-[8px] font-black uppercase border-slate-200 hover:bg-white shadow-sm">Cerrar Agenda</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
