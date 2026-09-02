'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supportData, type SupportTicket } from "@/lib/planning-data";
import { schoolsDirectory, type SchoolInfo } from "@/lib/schools-directory";
import { 
  PlusCircle, 
  LifeBuoy, 
  Pencil, 
  Trash2,
  History,
  Save,
  Search,
  X,
  Wrench,
  Wifi,
  Settings,
  ClipboardCheck,
  Monitor,
  Activity,
  UserCheck,
  Building2,
  CalendarDays,
  Target,
  Layers,
  Archive,
  Plus,
  Radio,
  Navigation,
  Database
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { VisitSchedulerDialog } from '@/components/VisitSchedulerDialog';
import { cn } from '@/lib/utils';

const OFICINAS = [
  "Oficina de Tecnología Educativa Ecatepec",
  "Oficina de Tecnología Educativa Naucalpan",
  "Oficina de Tecnología Educativa Nezahualcóyotl",
  "Oficina de Tecnología Educativa Toluca",
  "Oficina de COEES Tultitlan"
];

export default function SupportPage() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  
  const [listSearchTerm, setListSearchTerm] = useState(''); 
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);

  const initialFormState: SupportTicket = {
    id: '',
    cct: '',
    schoolName: '',
    tecnicos: '',
    fechaEntrada: format(new Date(), 'yyyy-MM-dd'),
    tipoIncidencia: 'mantenimiento',
    tipoIncidencias: ['mantenimiento'],
    status: 'pendiente',
    semana: '',
    periodoReportado: '',
    oficina: '',
    ze: '',
    sector: '',
    modalidad: '',
    municipio: '',
    region: '',
    valle: '',
    alumnosBeneficiados: 0,
    numEquipos: 0,
    descripcionEquipo: '',
    fechaSalida: format(new Date(), 'yyyy-MM-dd'),
    serviciosMC: 0,
    serviciosMP: 0,
    redEdusatInst: false,
    redEdusatMant: false,
    redLocalInst: false,
    redLocalMant: false,
    observaciones1: '',
    responsablesList: [''],
    edusatFicha: {
      mikropak: { revision: false, polarizacion: false, prueba: false, cambio: false },
      antena: { orientacion: false, reparacion: false, reubicacion: false, cambio: false },
      decodificador: { configuracion: false, reubicacion: false, cambio: false },
      cableado: { cambioCampanas: false, cambioDivisor: false, cambioCable: false },
      preventivo: { revisionGeneral: false, limpiezaGeneral: false, cuidadosPreventivos: false },
      numCensalDeco: '',
      numSerieDeco: '',
      calidadSenal: '',
      operaciones: [{ material: '', cantidad: '', actividad: '' }]
    },
    fases: {
      diagnostico: false,
      cableado: false,
      conectores: false,
      pastaTermica: false,
      limpieza: false,
      configuracion: false,
      pruebas: false
    }
  };

  const [formData, setFormData] = useState<SupportTicket>(initialFormState);

  useEffect(() => {
    setMounted(true);
    const stored = JSON.parse(localStorage.getItem('support_tickets_full') || '[]');
    setTickets(stored.length === 0 ? supportData : stored);
    const storedSchools = JSON.parse(localStorage.getItem('schools_master_full_v21') || '[]');
    setAllSchools(storedSchools.length > 0 ? storedSchools : schoolsDirectory);
  }, []);

  const handleCctChange = (value: string) => {
    const cleanValue = value.toUpperCase();
    setFormData(prev => ({ ...prev, cct: cleanValue }));
    if (cleanValue.length === 10) {
      const match = allSchools.find(s => s.cct.toUpperCase() === cleanValue);
      if (match) {
        setFormData(prev => ({ 
          ...prev, 
          schoolName: match.nombre,
          ze: match.zonaEscolar,
          sector: match.sector,
          modalidad: match.modalidad,
          municipio: match.municipio,
          region: match.region,
          valle: match.valle
        }));
        toast({ title: "Plantel identificado", description: match.nombre });
      }
    }
  };

  const handleSave = () => {
    if (!formData.id || !formData.cct) {
      toast({ variant: "destructive", title: "Datos incompletos", description: "El folio y CCT son obligatorios." });
      return;
    }
    const updated = editingTicketId 
      ? tickets.map(t => t.id === editingTicketId ? { ...formData } : t)
      : [formData, ...tickets];
    
    localStorage.setItem('support_tickets_full', JSON.stringify(updated));
    setTickets(updated);
    setIsDialogOpen(false);
    setEditingTicketId(null);
    setFormData(initialFormState);
    toast({ title: "Registro guardado exitosamente" });
  }

  const handleDeleteTicket = (id: string) => {
    if (!confirm("¿Desea eliminar este reporte de servicio?")) return;
    const updated = tickets.filter(t => t.id !== id);
    setTickets(updated);
    localStorage.setItem('support_tickets_full', JSON.stringify(updated));
    toast({ title: "Reporte eliminado" });
  }

  const handleEdit = (ticket: SupportTicket) => {
    setFormData({
      ...initialFormState,
      ...ticket,
      tipoIncidencias: ticket.tipoIncidencias || [ticket.tipoIncidencia],
      fases: ticket.fases || initialFormState.fases,
      responsablesList: ticket.responsablesList || [ticket.responsable1 || '', ticket.responsable2 || ''].filter(r => r),
      edusatFicha: ticket.edusatFicha || initialFormState.edusatFicha
    });
    setEditingTicketId(ticket.id!);
    setIsDialogOpen(true);
  }

  const toggleTipoIncidencia = (tipo: string) => {
    const current = formData.tipoIncidencias || [];
    let updated;
    if (current.includes(tipo)) {
      updated = current.filter(t => t !== tipo);
    } else {
      updated = [...current, tipo];
    }
    setFormData({ 
      ...formData, 
      tipoIncidencias: updated,
      tipoIncidencia: updated.length > 0 ? updated[0] : ''
    });
  }

  const toggleEdusatField = (section: keyof NonNullable<SupportTicket['edusatFicha']>, field: string) => {
    if (!formData.edusatFicha) return;
    const currentSection = formData.edusatFicha[section] as any;
    setFormData({
      ...formData,
      edusatFicha: {
        ...formData.edusatFicha,
        [section]: {
          ...currentSection,
          [field]: !currentSection[field]
        }
      }
    });
  }

  const addEdusatOperacion = () => {
    if (!formData.edusatFicha) return;
    setFormData({
      ...formData,
      edusatFicha: {
        ...formData.edusatFicha,
        operaciones: [...formData.edusatFicha.operaciones, { material: '', cantidad: '', actividad: '' }]
      }
    });
  }

  const removeEdusatOperacion = (index: number) => {
    if (!formData.edusatFicha || formData.edusatFicha.operaciones.length <= 1) return;
    setFormData({
      ...formData,
      edusatFicha: {
        ...formData.edusatFicha,
        operaciones: formData.edusatFicha.operaciones.filter((_, i) => i !== index)
      }
    });
  }

  const updateEdusatOperacion = (index: number, field: string, value: string) => {
    if (!formData.edusatFicha) return;
    const ops = [...formData.edusatFicha.operaciones];
    ops[index] = { ...ops[index], [field]: value.toUpperCase() };
    setFormData({
      ...formData,
      edusatFicha: { ...formData.edusatFicha, operaciones: ops }
    });
  }

  const filteredTickets = tickets.filter(t => {
    const matchSearch = (t.cct || '').toUpperCase().includes(listSearchTerm.toUpperCase()) ||
      (t.schoolName || '').toUpperCase().includes(listSearchTerm.toUpperCase()) ||
      (t.id || '').toUpperCase().includes(listSearchTerm.toUpperCase());
    return matchSearch;
  });

  const updateResponsable = (index: number, value: string) => {
    const list = [...(formData.responsablesList || [])];
    list[index] = value.toUpperCase();
    setFormData({ ...formData, responsablesList: list });
  }

  const addResponsable = () => {
    const list = [...(formData.responsablesList || [])];
    if (list.length < 6) {
      list.push('');
      setFormData({ ...formData, responsablesList: list });
    }
  }

  const removeResponsable = (index: number) => {
    const list = [...(formData.responsablesList || [])];
    if (list.length > 1) {
      list.splice(index, 1);
      setFormData({ ...formData, responsablesList: list });
    }
  }

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-primary">Soporte técnico</h2>
          <p className="text-xs font-bold text-muted-foreground flex items-center gap-2">
            <LifeBuoy className="h-4 w-4 text-accent" /> Centro de control operativo institucional
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button onClick={() => setIsSchedulerOpen(true)} variant="outline" className="h-12 px-6 rounded-xl border-primary/20 text-primary font-bold text-[11px] gap-2 shadow-md hover:bg-primary/5">
            <CalendarDays className="h-5 w-5" /> Agenda de visitas
          </Button>
          <Button onClick={() => { setEditingTicketId(null); setFormData(initialFormState); setIsDialogOpen(true); }} className="btn-institutional h-12 px-8 shadow-xl text-[11px]">
            <PlusCircle className="h-5 w-5 mr-2" /> Nuevo reporte de servicio
          </Button>
        </div>
      </div>

      <Card className="executive-card p-0 shadow-xl border-t-8 border-t-primary">
        <CardHeader className="bg-slate-50/50 p-6 border-b">
           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <History className="h-6 w-6" />
                 </div>
                 <div>
                    <CardTitle className="text-base font-black">Historial de servicios</CardTitle>
                    <CardDescription className="text-xs font-bold text-slate-400">Seguimiento de folios de atención técnica</CardDescription>
                 </div>
              </div>
              <div className="relative w-full md:w-64">
                 <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                 <Input 
                   placeholder="Buscar CCT o folio..." 
                   className="h-9 pl-10 rounded-xl border-slate-200 text-xs font-bold bg-white"
                   value={listSearchTerm}
                   onChange={e => setListSearchTerm(e.target.value)}
                 />
              </div>
           </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-100/30">
              <TableRow>
                <TableHead className="w-24 text-xs font-bold pl-6">Folio</TableHead>
                <TableHead className="min-w-[200px] text-xs font-bold">Centro de trabajo</TableHead>
                <TableHead className="text-xs font-bold">Incidencias</TableHead>
                <TableHead className="text-xs font-bold">Fecha</TableHead>
                <TableHead className="text-xs font-bold text-center">Estatus</TableHead>
                <TableHead className="text-right text-xs font-bold pr-10">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length > 0 ? filteredTickets.map((ticket) => (
                <TableRow key={ticket.id} className="hover:bg-slate-50 transition-colors h-16 group">
                  <TableCell className="text-center pl-6 font-mono font-black text-sm text-primary">#{ticket.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700 leading-none">{ticket.schoolName}</span>
                      <span className="text-[10px] font-bold text-muted-foreground mt-1">{ticket.cct}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(ticket.tipoIncidencias || [ticket.tipoIncidencia]).map(t => (
                        <Badge key={t} variant="outline" className="text-[9px] font-bold border-primary/20 text-primary capitalize px-1.5 h-4">{t}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-500">{ticket.fechaEntrada}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn("text-[10px] font-bold px-3 h-5 rounded-full border-none", 
                      ticket.status === 'atendido' ? "bg-emerald-500 text-white" : 
                      ticket.status === 'en proceso' ? "bg-amber-500 text-white" : 
                      "bg-rose-500 text-white")}>
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                     <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5 rounded-xl" onClick={() => handleEdit(ticket)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => ticket.id && handleDeleteTicket(ticket.id)}><Trash2 className="h-4 w-4" /></Button>
                     </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={6} className="text-center py-24 opacity-30 text-sm font-bold uppercase tracking-widest">Sin reportes registrados</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingTicketId(null); }}>
        <DialogContent className="sm:max-w-[1100px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white flex flex-col h-[95vh]">
          <DialogHeader className="p-8 bg-primary text-white shrink-0 flex flex-row justify-between items-center pr-12">
            <div className="space-y-1">
              <DialogTitle className="font-black text-2xl flex items-center gap-4">
                <PlusCircle className="h-8 w-8 text-accent" /> {editingTicketId ? 'Editar reporte de servicio' : 'Alta de reporte de servicio'}
              </DialogTitle>
              <DialogDescription className="text-white/60 font-bold text-[10px] tracking-widest mt-1">Hoja de servicio técnica oficial Coees</DialogDescription>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="p-8 space-y-10">
               {/* Encabezado del Informe */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-[2.5rem] border border-primary/5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-primary pl-1">Folio de solicitud</Label>
                    <Input className="h-11 bg-white font-mono font-black uppercase text-primary border-primary/10" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-primary pl-1">Oficina regional</Label>
                    <Select value={formData.oficina} onValueChange={v => setFormData({...formData, oficina: v})}>
                      <SelectTrigger className="h-11 bg-white border-primary/10 font-bold text-xs"><SelectValue placeholder="Elegir oficina..." /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {OFICINAS.map(o => <SelectItem key={o} value={o} className="text-xs font-bold">{o.replace("Oficina de ", "")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-primary pl-1">Semana</Label>
                      <Input placeholder="Ej. 24" className="h-11 bg-white text-center font-bold border-primary/10" value={formData.semana} onChange={e => setFormData({...formData, semana: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-primary pl-1">Fecha</Label>
                      <Input type="date" className="h-11 bg-white font-bold border-primary/10" value={formData.fechaEntrada} onChange={e => setFormData({...formData, fechaEntrada: e.target.value})} />
                    </div>
                  </div>
               </div>

               {/* Identificación del Plantel */}
               <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b pb-2">
                     <Building2 className="h-5 w-5 text-accent" />
                     <h4 className="text-xs font-black text-accent tracking-widest uppercase">Identificación del centro de trabajo</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 pl-1">CCT (10 caracteres)</Label>
                      <Input className="h-11 bg-slate-50 border-primary/10 font-mono font-black uppercase text-lg" value={formData.cct} onChange={e => handleCctChange(e.target.value)} maxLength={10} />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 pl-1">Nombre del plantel</Label>
                      <Input readOnly className="h-11 bg-slate-100 border-none font-black text-slate-600 uppercase" value={formData.schoolName} />
                    </div>
                  </div>
               </div>

               {/* Servicios Realizados (Selección Múltiple) */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b pb-2">
                       <Layers className="h-5 w-5 text-accent" />
                       <h4 className="text-xs font-black text-accent tracking-widest uppercase">Servicios realizados</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                       <div className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer", formData.tipoIncidencias?.includes('red edusat') ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100")} onClick={() => toggleTipoIncidencia('red edusat')}>
                          <Checkbox checked={formData.tipoIncidencias?.includes('red edusat')} onCheckedChange={() => toggleTipoIncidencia('red edusat')} />
                          <Label className="text-[11px] font-bold cursor-pointer">Red Edusat (F5)</Label>
                       </div>
                       <div className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer", formData.tipoIncidencias?.includes('red local') ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100")} onClick={() => toggleTipoIncidencia('red local')}>
                          <Checkbox checked={formData.tipoIncidencias?.includes('red local')} onCheckedChange={() => toggleTipoIncidencia('red local')} />
                          <Label className="text-[11px] font-bold cursor-pointer">Red local (F5)</Label>
                       </div>
                       <div className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer", formData.tipoIncidencias?.includes('mantenimiento') ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100")} onClick={() => toggleTipoIncidencia('mantenimiento')}>
                          <Checkbox checked={formData.tipoIncidencias?.includes('mantenimiento')} onCheckedChange={() => toggleTipoIncidencia('mantenimiento')} />
                          <Label className="text-[11px] font-bold cursor-pointer">Mantenimiento (F4)</Label>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b pb-2">
                       <Target className="h-5 w-5 text-accent" />
                       <h4 className="text-xs font-black text-accent tracking-widest uppercase">Estadística de impacto</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 bg-slate-50 p-4 rounded-2xl">
                         <Label className="text-[9px] font-black text-primary uppercase">Alumnos beneficiados</Label>
                         <Input type="number" className="h-10 font-black text-center bg-white border-none shadow-inner" value={formData.alumnosBeneficiados} onChange={e => setFormData({...formData, alumnosBeneficiados: parseInt(e.target.value) || 0})} />
                      </div>
                      <div className="space-y-2 bg-slate-50 p-4 rounded-2xl">
                         <Label className="text-[9px] font-black text-primary uppercase">Equipos atendidos</Label>
                         <Input type="number" className="h-10 font-black text-center bg-white border-none shadow-inner" value={formData.numEquipos} onChange={e => setFormData({...formData, numEquipos: parseInt(e.target.value) || 0})} />
                      </div>
                    </div>
                  </div>
               </div>

               {/* Ficha Técnica de Atención Red Edusat */}
               {formData.tipoIncidencias?.includes('red edusat') && (
                 <div className="space-y-6 animate-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-3 border-b-2 border-primary/20 pb-3">
                       <Archive className="h-6 w-6 text-primary" />
                       <h4 className="text-sm font-black text-primary uppercase tracking-widest">Ficha técnica de atención red Edusat</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                          <p className="text-[9px] font-black bg-primary text-white px-2 py-1 rounded-md text-center uppercase">Micropak (LNB)</p>
                          <div className="space-y-2">
                            {['revision', 'polarizacion', 'prueba', 'cambio'].map(f => (
                              <div key={f} className="flex items-center justify-between gap-2" onClick={() => toggleEdusatField('mikropak', f)}>
                                <span className="text-[8px] font-bold text-slate-600 uppercase">{f}</span>
                                <Checkbox checked={(formData.edusatFicha?.mikropak as any)?.[f]} onCheckedChange={() => toggleEdusatField('mikropak', f)} className="h-4 w-4" />
                              </div>
                            ))}
                          </div>
                       </div>

                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                          <p className="text-[9px] font-black bg-primary text-white px-2 py-1 rounded-md text-center uppercase">Ant. Parabólica</p>
                          <div className="space-y-2">
                            {['orientacion', 'reparacion', 'reubicacion', 'cambio'].map(f => (
                              <div key={f} className="flex items-center justify-between gap-2" onClick={() => toggleEdusatField('antena', f)}>
                                <span className="text-[8px] font-bold text-slate-600 uppercase">{f}</span>
                                <Checkbox checked={(formData.edusatFicha?.antena as any)?.[f]} onCheckedChange={() => toggleEdusatField('antena', f)} className="h-4 w-4" />
                              </div>
                            ))}
                          </div>
                       </div>

                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                          <p className="text-[9px] font-black bg-primary text-white px-2 py-1 rounded-md text-center uppercase">Decodificador</p>
                          <div className="space-y-2">
                            {['configuracion', 'reubicacion', 'cambio'].map(f => (
                              <div key={f} className="flex items-center justify-between gap-2" onClick={() => toggleEdusatField('decodificador', f)}>
                                <span className="text-[8px] font-bold text-slate-600 uppercase">{f}</span>
                                <Checkbox checked={(formData.edusatFicha?.decodificador as any)?.[f]} onCheckedChange={() => toggleEdusatField('decodificador', f)} className="h-4 w-4" />
                              </div>
                            ))}
                          </div>
                       </div>

                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                          <p className="text-[9px] font-black bg-primary text-white px-2 py-1 rounded-md text-center uppercase">Cableado</p>
                          <div className="space-y-2">
                            {['cambioCampanas', 'cambioDivisor', 'cambioCable'].map(f => (
                              <div key={f} className="flex items-center justify-between gap-2" onClick={() => toggleEdusatField('cableado', f)}>
                                <span className="text-[8px] font-bold text-slate-600 uppercase">{f.replace('cambio', 'cambio ')}</span>
                                <Checkbox checked={(formData.edusatFicha?.cableado as any)?.[f]} onCheckedChange={() => toggleEdusatField('cableado', f)} className="h-4 w-4" />
                              </div>
                            ))}
                          </div>
                       </div>

                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                          <p className="text-[9px] font-black bg-primary text-white px-2 py-1 rounded-md text-center uppercase">M. Preventivo</p>
                          <div className="space-y-2">
                            {['revisionGeneral', 'limpiezaGeneral', 'cuidadosPreventivos'].map(f => (
                              <div key={f} className="flex items-center justify-between gap-2" onClick={() => toggleEdusatField('preventivo', f)}>
                                <span className="text-[8px] font-bold text-slate-600 uppercase">{f.replace('General', '').replace('Preventivos', '')}</span>
                                <Checkbox checked={(formData.edusatFicha?.preventivo as any)?.[f]} onCheckedChange={() => toggleEdusatField('preventivo', f)} className="h-4 w-4" />
                              </div>
                            ))}
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-100/50 p-6 rounded-3xl border">
                       <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-primary">No. Censal de Decodificador</Label>
                          <Input className="h-10 bg-white font-mono font-bold" value={formData.edusatFicha?.numCensalDeco} onChange={e => setFormData({...formData, edusatFicha: {...formData.edusatFicha!, numCensalDeco: e.target.value.toUpperCase()}})} />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-primary">No. de Serie de Decodificador</Label>
                          <Input className="h-10 bg-white font-mono font-bold" value={formData.edusatFicha?.numSerieDeco} onChange={e => setFormData({...formData, edusatFicha: {...formData.edusatFicha!, numSerieDeco: e.target.value.toUpperCase()}})} />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-primary">Calidad de Señal</Label>
                          <Input placeholder="Ej. 85%" className="h-10 bg-white font-black text-center" value={formData.edusatFicha?.calidadSenal} onChange={e => setFormData({...formData, edusatFicha: {...formData.edusatFicha!, calidadSenal: e.target.value}})} />
                       </div>
                    </div>

                    <div className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-inner overflow-hidden">
                       <Table>
                          <TableHeader className="bg-slate-50">
                             <TableRow className="h-10">
                                <TableHead className="text-[9px] font-black uppercase w-[250px]">Mat. Utilizado</TableHead>
                                <TableHead className="text-[9px] font-black uppercase w-[100px] text-center">Cantidad</TableHead>
                                <TableHead className="text-[9px] font-black uppercase">Actividades Realizadas por la Brigada</TableHead>
                                <TableHead className="w-12"></TableHead>
                             </TableRow>
                          </TableHeader>
                          <TableBody>
                             {formData.edusatFicha?.operaciones.map((op, idx) => (
                               <TableRow key={`ed-op-${idx}`} className="h-12">
                                  <TableCell className="p-2"><Input className="h-8 text-[10px] font-bold" value={op.material} onChange={e => updateEdusatOperacion(idx, 'material', e.target.value)} /></TableCell>
                                  <TableCell className="p-2"><Input className="h-8 text-[10px] font-black text-center" value={op.cantidad} onChange={e => updateEdusatOperacion(idx, 'cantidad', e.target.value)} /></TableCell>
                                  <TableCell className="p-2"><Input className="h-8 text-[10px] font-semibold" value={op.actividad} onChange={e => updateEdusatOperacion(idx, 'actividad', e.target.value)} /></TableCell>
                                  <TableCell className="p-2">
                                     <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-400" onClick={() => removeEdusatOperacion(idx)} disabled={formData.edusatFicha!.operaciones.length <= 1}><X className="h-3.5 w-3.5" /></Button>
                                  </TableCell>
                               </TableRow>
                             ))}
                          </TableBody>
                       </Table>
                       <div className="p-3 bg-slate-50 border-t flex justify-center">
                          <Button variant="outline" size="sm" onClick={addEdusatOperacion} className="h-8 px-6 rounded-xl border-primary/20 text-primary font-black text-[9px] gap-2"><Plus className="h-3.5 w-3.5" /> Añadir Fila de Operación</Button>
                       </div>
                    </div>
                 </div>
               )}

               {/* Personal Responsable (Comisionados) - Dinámico */}
               <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                     <div className="flex items-center gap-3">
                        <UserCheck className="h-5 w-5 text-accent" />
                        <h4 className="text-xs font-black text-accent tracking-widest uppercase">Personal responsable (Comisionados)</h4>
                     </div>
                     <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addResponsable}
                        disabled={(formData.responsablesList || []).length >= 6}
                        className="h-8 rounded-lg border-primary/20 text-primary font-bold text-[10px] gap-2 hover:bg-primary/5"
                     >
                        <Plus className="h-3 w-3" /> Añadir responsable
                     </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(formData.responsablesList || ['']).map((resp, idx) => (
                      <div key={`resp-${idx}`} className="space-y-2 relative group">
                        <Label className="text-[10px] font-black text-primary">
                          {idx === 0 ? 'Responsable 1 (Líder)' : `Responsable ${idx + 1}`}
                        </Label>
                        <div className="flex gap-2">
                           <Input 
                             className="h-10 bg-slate-50 border-none rounded-xl font-bold text-xs uppercase flex-1 shadow-inner focus:bg-white transition-all" 
                             value={resp} 
                             onChange={e => updateResponsable(idx, e.target.value)} 
                             placeholder="NOMBRE COMPLETO..."
                           />
                           {idx > 0 && (
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeResponsable(idx)} 
                                className="h-10 w-10 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                             >
                                <X className="h-4 w-4" />
                             </Button>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="space-y-2">
                  <Label className="text-[10px] font-black text-primary pl-1">Observaciones generales</Label>
                  <Textarea className="min-h-[100px] bg-slate-50 border-none rounded-2xl p-4 text-xs font-semibold shadow-inner uppercase" value={formData.observaciones1} onChange={e => setFormData({...formData, observaciones1: e.target.value.toUpperCase()})} />
               </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-6 shrink-0 shadow-inner">
             <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-14 px-10 rounded-2xl font-bold text-xs text-slate-400 hover:text-primary transition-all">Cancelar</Button>
             <Button onClick={handleSave} className="btn-institutional h-14 px-16 text-xs gap-3 rounded-2xl shadow-2xl"><Save className="h-6 w-6" /> Guardar reporte de servicio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VisitSchedulerDialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen} areaId="soporte" areaName="Soporte técnico" />
    </div>
  );
}
