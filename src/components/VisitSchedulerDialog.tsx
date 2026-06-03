
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
import { Calendar, MapPin, UserCog, Search, PlusCircle, Trash2, CheckCircle2, Clock, School, LayoutGrid, Circle } from 'lucide-react'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [listSearchTerm, setListSearchTerm] = useState('') // Filtro para la tabla
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
      }
    }
  }

  const handleSave = () => {
    if (!formData.cct || !formData.date) {
      toast({ variant: "destructive", title: "Datos Incompletos", description: "CCT y Fecha son obligatorios." })
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
    setSearchTerm('')
    toast({ title: "Visita Programada", description: "Se ha registrado la salida técnica correctamente." })
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
            <h3 className="text-[11px] font-black uppercase text-accent border-b-2 border-accent/10 pb-2 tracking-[0.2em] flex items-center gap-2">
              <PlusCircle className="h-4 w-4" /> Nueva Salida
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary">CCT del Plantel</Label>
                <div className="relative">
                   <Input 
                      placeholder="15DES0000X" 
                      className="h-11 font-mono uppercase border-primary/10 bg-slate-50 pl-10" 
                      value={formData.cct} 
                      onChange={e => handleCctChange(e.target.value)} 
                      maxLength={10}
                   />
                   <Search className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                </div>
                {formData.schoolName && (
                   <p className="text-[9px] font-bold text-emerald-600 uppercase px-2">✓ {formData.schoolName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary">Fecha de Visita</Label>
                <Input type="date" className="h-11 border-primary/10 font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary">Propósito / Motivo</Label>
                <Select value={formData.purpose} onValueChange={val => setFormData({...formData, purpose: val})}>
                  <SelectTrigger className="h-11 border-primary/10 font-bold uppercase text-[10px]"><SelectValue placeholder="SELECCIONAR..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANTENIMIENTO" className="text-[10px] font-bold">MANTENIMIENTO</SelectItem>
                    <SelectItem value="AUDITORIA" className="text-[10px] font-bold">AUDITORÍA TÉCNICA</SelectItem>
                    <SelectItem value="CAPACITACION" className="text-[10px] font-bold">CAPACITACIÓN</SelectItem>
                    <SelectItem value="DIAGNOSTICO" className="text-[10px] font-bold">DIAGNÓSTICO</SelectItem>
                    <SelectItem value="SUPERVISION" className="text-[10px] font-bold">SUPERVISIÓN</SelectItem>
                    <SelectItem value="ENTREGA" className="text-[10px] font-bold">ENTREGA DE EQUIPO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary">Personal Comisionado</Label>
                <Input className="h-11 border-primary/10 font-bold uppercase text-[10px]" placeholder="NOMBRES..." value={formData.technicians} onChange={e => setFormData({...formData, technicians: e.target.value.toUpperCase()})} />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary">Estatus Inicial</Label>
                <Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val})}>
                  <SelectTrigger className="h-11 border-primary/10 font-bold uppercase text-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente" className="text-[10px] font-bold text-rose-600">🔴 PENDIENTE</SelectItem>
                    <SelectItem value="en proceso" className="text-[10px] font-bold text-amber-600">🟡 EN PROCESO</SelectItem>
                    <SelectItem value="atendido" className="text-[10px] font-bold text-emerald-600">🟢 ATENDIDO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSave} className="w-full btn-institutional h-14 mt-4 shadow-xl">
                Agendar Visita
              </Button>
            </div>
          </div>

          {/* Listado de Visitas */}
          <div className="flex-1 bg-slate-50/50 p-8 flex flex-col overflow-hidden">
             <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
                <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Agenda de Salidas ({areaVisits.length})
                </h3>
                
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
                            <TableHead className="text-[10px] font-black uppercase">Fecha</TableHead>
                            <TableHead className="text-[10px] font-black uppercase">CCT / Plantel</TableHead>
                            <TableHead className="text-[10px] font-black uppercase">Propósito</TableHead>
                            <TableHead className="text-[10px] font-black uppercase">Personal</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-center">Estatus Operativo</TableHead>
                            <TableHead className="w-16"></TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                        {areaVisits.length > 0 ? areaVisits.map((v) => (
                          <TableRow key={v.id} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="font-black text-[10px] text-primary">{v.date}</TableCell>
                            <TableCell>
                               <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-slate-700">{v.cct}</span>
                                  <span className="text-[8px] font-bold text-muted-foreground uppercase truncate max-w-[180px]">{v.schoolName}</span>
                               </div>
                            </TableCell>
                            <TableCell>
                               <Badge variant="outline" className="text-[8px] font-black border-primary/10 text-accent">{v.purpose}</Badge>
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
                            <TableCell>
                               <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50" onClick={() => handleDelete(v.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                             <TableCell colSpan={6} className="text-center py-24 opacity-30">
                                <div className="flex flex-col items-center gap-4">
                                   <Search className="h-12 w-12" />
                                   <p className="text-[10px] font-black uppercase tracking-widest">
                                      {listSearchTerm ? 'No se encontraron visitas que coincidan con el CCT.' : 'No hay visitas programadas en la bitácora.'}
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

        <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end">
           <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-10 px-8 text-[10px] font-black uppercase">Cerrar Agenda</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
