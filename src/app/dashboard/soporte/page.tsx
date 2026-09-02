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
  Archive
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { VisitSchedulerDialog } from '@/components/VisitSchedulerDialog';
import { cn } from '@/lib/utils';

const OFICINAS = [
  "Oficina de Tecnóloga Educativa Ecatepec",
  "Oficina de Tecnóloga Educativa Naucalpan",
  "Oficina de Tecnóloga Educativa Nezahualcóyotl",
  "Oficina de Tecnóloga Educativa Toluca",
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
    responsable1: '',
    responsable2: '',
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
        toast({ title: "Plantel Identificado", description: match.nombre });
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
      ...ticket,
      tipoIncidencias: ticket.tipoIncidencias || [ticket.tipoIncidencia],
      fases: ticket.fases || initialFormState.fases
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

  const filteredTickets = tickets.filter(t => {
    const matchSearch = (t.cct || '').toUpperCase().includes(listSearchTerm.toUpperCase()) ||
      (t.schoolName || '').toUpperCase().includes(listSearchTerm.toUpperCase()) ||
      (t.id || '').toUpperCase().includes(listSearchTerm.toUpperCase());
    return matchSearch;
  });

  const toggleFase = (faseKey: keyof NonNullable<SupportTicket['fases']>) => {
    if (!formData.fases) return;
    setFormData({
      ...formData,
      fases: {
        ...formData.fases,
        [faseKey]: !formData.fases[faseKey]
      }
    });
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
            <ClipboardCheck className="h-5 w-5" /> Agenda de visitas
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
        <DialogContent className="sm:max-w-[850px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white flex flex-col h-[95vh]">
          <DialogHeader className="p-8 bg-primary text-white shrink-0 flex flex-row justify-between items-center pr-12">
            <div className="space-y-1">
              <DialogTitle className="font-black text-2xl flex items-center gap-4">
                <PlusCircle className="h-8 w-8 text-accent" /> {editingTicketId ? 'Editar reporte de servicio' : 'Alta de reporte de servicio'}
              </DialogTitle>
              <DialogDescription className="text-white/60 font-bold text-[10px] uppercase tracking-widest mt-1">Hoja de servicio técnica oficial Coees</DialogDescription>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="p-8 space-y-10">
               {/* Encabezado del Informe */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-[2.5rem] border border-primary/5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-primary pl-1">Folio oficial</Label>
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

               {/* Detalles de Red (Formato F5) - Visible si se selecciona Red Local o Edusat */}
               {(formData.tipoIncidencias?.includes('red edusat') || formData.tipoIncidencias?.includes('red local')) && (
                 <div className="p-8 bg-primary/[0.03] rounded-[2.5rem] border border-primary/10 space-y-6 animate-in zoom-in-95">
                    <h4 className="text-xs font-black text-primary uppercase flex items-center gap-3"><Wifi className="h-5 w-5" /> Detalle de servicios a redes (F5)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="flex items-center gap-3"><Checkbox checked={formData.redEdusatInst} onCheckedChange={(v) => setFormData({...formData, redEdusatInst: !!v})} /><Label className="text-[10px] font-bold">Edusat: Instalación</Label></div>
                      <div className="flex items-center gap-3"><Checkbox checked={formData.redEdusatMant} onCheckedChange={(v) => setFormData({...formData, redEdusatMant: !!v})} /><Label className="text-[10px] font-bold">Edusat: Mantenimiento</Label></div>
                      <div className="flex items-center gap-3"><Checkbox checked={formData.redLocalInst} onCheckedChange={(v) => setFormData({...formData, redLocalInst: !!v})} /><Label className="text-[10px] font-bold">Local: Instalación</Label></div>
                      <div className="flex items-center gap-3"><Checkbox checked={formData.redLocalMant} onCheckedChange={(v) => setFormData({...formData, redLocalMant: !!v})} /><Label className="text-[10px] font-bold">Local: Mantenimiento</Label></div>
                    </div>
                 </div>
               )}

               {/* Detalles de Mantenimiento (Formato F4) - Visible si se selecciona Mantenimiento */}
               {formData.tipoIncidencias?.includes('mantenimiento') && (
                 <div className="p-8 bg-accent/[0.03] rounded-[2.5rem] border border-accent/10 space-y-8 animate-in zoom-in-95">
                    <h4 className="text-xs font-black text-accent uppercase flex items-center gap-3"><Monitor className="h-5 w-5" /> Detalle de mantenimiento a equipo (F4)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2"><Label className="text-[10px] font-black text-slate-500">Descripción técnica del equipo</Label><Textarea placeholder="Marca, modelo, serie y estado..." className="h-20 bg-white border-slate-200 rounded-xl text-xs font-semibold uppercase" value={formData.descripcionEquipo} onChange={e => setFormData({...formData, descripcionEquipo: e.target.value.toUpperCase()})} /></div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label className="text-[10px] font-black text-slate-500">Servicios M.C.</Label><Input type="number" className="h-10 text-center font-black text-lg bg-white border-slate-200" value={formData.serviciosMC} onChange={e => setFormData({...formData, serviciosMC: parseInt(e.target.value) || 0})} /></div>
                          <div className="space-y-2"><Label className="text-[10px] font-black text-slate-500">Servicios M.P.</Label><Input type="number" className="h-10 text-center font-black text-lg bg-white border-slate-200" value={formData.serviciosMP} onChange={e => setFormData({...formData, serviciosMP: parseInt(e.target.value) || 0})} /></div>
                          <div className="col-span-2 space-y-2"><Label className="text-[10px] font-black text-slate-500">Fecha de salida</Label><Input type="date" className="h-10 font-bold bg-white border-slate-200" value={formData.fechaSalida} onChange={e => setFormData({...formData, fechaSalida: e.target.value})} /></div>
                       </div>
                    </div>
                 </div>
               )}

               {/* Ficha Técnica / Fases de Atención */}
               <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                     <Wrench className="h-5 w-5 text-accent" />
                     <h4 className="text-xs font-black text-accent tracking-widest uppercase">Ficha técnica: fases de atención</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                     {[
                       { id: 'diagnostico', label: 'Diagnóstico inicial', icon: <Search className="h-4 w-4" /> },
                       { id: 'cableado', label: 'Revisión de cableado', icon: <Wifi className="h-4 w-4" /> },
                       { id: 'conectores', label: 'Ponchado RJ45', icon: <Settings className="h-4 w-4" /> },
                       { id: 'pastaTermica', label: 'Pasta térmica', icon: <Settings className="h-4 w-4" /> },
                       { id: 'limpieza', label: 'Limpieza interna', icon: <Wrench className="h-4 w-4" /> },
                       { id: 'configuracion', label: 'Configuración lógica', icon: <Monitor className="h-4 w-4" /> },
                       { id: 'pruebas', label: 'Pruebas de señal', icon: <ClipboardCheck className="h-4 w-4" /> },
                     ].map(fase => (
                       <div 
                         key={fase.id} 
                         className={cn(
                           "flex items-center space-x-3 p-4 rounded-2xl border transition-all cursor-pointer group shadow-sm", 
                           formData.fases?.[fase.id as keyof NonNullable<SupportTicket['fases']>] ? "bg-emerald-50 border-emerald-300" : "bg-white border-slate-100 hover:border-primary/20"
                         )} 
                         onClick={() => toggleFase(fase.id as keyof NonNullable<SupportTicket['fases']>)}
                       >
                          <Checkbox 
                            checked={formData.fases?.[fase.id as keyof NonNullable<SupportTicket['fases']>] || false} 
                            onCheckedChange={() => toggleFase(fase.id as keyof NonNullable<SupportTicket['fases']>)} 
                            className="h-5 w-5 border-primary data-[state=checked]:bg-emerald-500 rounded-lg" 
                          />
                          <Label className="text-[10px] font-bold cursor-pointer group-hover:text-primary leading-tight">{fase.label}</Label>
                       </div>
                     ))}
                  </div>
               </div>

               {/* Responsables de la Comisión */}
               <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                     <UserCheck className="h-5 w-5 text-accent" />
                     <h4 className="text-xs font-black text-accent tracking-widest uppercase">Personal responsable (Comisionados)</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label className="text-[10px] font-black text-primary">Responsable 1 (Líder)</Label><Input className="h-10 bg-slate-50 border-none rounded-xl font-bold text-xs uppercase" value={formData.responsable1} onChange={e => setFormData({...formData, responsable1: e.target.value.toUpperCase()})} /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black text-primary">Responsable 2</Label><Input className="h-10 bg-slate-50 border-none rounded-xl font-bold text-xs uppercase" value={formData.responsable2} onChange={e => setFormData({...formData, responsable2: e.target.value.toUpperCase()})} /></div>
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