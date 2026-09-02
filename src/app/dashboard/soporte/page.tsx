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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Database,
  ChevronRight,
  Server,
  Cpu,
  MonitorCheck,
  School,
  Box
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { VisitSchedulerDialog } from '@/components/VisitSchedulerDialog';
import { WarehouseSystemDialog } from '@/components/WarehouseSystemDialog';
import { cn } from '@/lib/utils';

const OFICINAS = [
  "Oficina de Tecnología Educativa Ecatepec",
  "Oficina de Tecnología Educativa Naucalpan",
  "Oficina de Tecnología Educativa Nezahualcóyotl",
  "Oficina de Tecnología Educativa Toluca",
  "Oficina de COEES Tultitlán"
];

export default function SupportPage() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  
  const [listSearchTerm, setListSearchTerm] = useState(''); 
  const [dialogSearchTerm, setDialogSearchTerm] = useState(''); 
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
    redLocalFicha: {
      nodos: '',
      cuentaRedLocal: '',
      requiereMantenimiento: '',
      electricaAdecuada: '',
      cuentaInternet: '',
      proveedorInternet: '',
      anchoBanda: '',
      ampliacionRed: '',
      nuevaRed: '',
      materiales: {
        canaleta: { coees: '', ct: '' },
        cableUTP: { coees: '', ct: '' },
        rosetas: { coees: '', ct: '' },
        conectores: { coees: '', ct: '' },
        pijas: { coees: '', ct: '' },
        cinturones: { coees: '', ct: '' },
        switch: { coees: '', ct: '' },
        conectoresRJ45: { coees: '', ct: '' }
      },
      mantenimientoAula: {
        conectores: false,
        parcheo: false,
        cableUTP: false,
        rosetas: false,
        canaletas: false,
        configuracion: false
      },
      mantenimientoEquipos: {
        formateo: false,
        windows: false,
        office: false,
        drivers: false,
        antivirus: false,
        software: false,
        hardware: false
      },
      ubicacionAula: {
        tallerComputo: false,
        aulaMedios: false,
        hdt: false,
        ofimatica: false,
        areaAdmin: false,
        otros: false
      }
    },
    mantenimientoFicha: {
      equipoTecnologico: { hdt: false, equipoComputo: false, otro: '' },
      equiposList: Array(10).fill({ equipo: '', marca: '', serie: '', censal: '' }),
      fallaIdentificada: '',
      servicioRealizado: '',
      observaciones: ''
    }
  };

  const [formData, setFormData] = useState<SupportTicket>(initialFormState);
  const [quickAddForm, setQuickAddForm] = useState<SchoolInfo>({
    region: '', valle: 'MEXICO', municipio: '', subsistema: 'FEDERALIZADO', control: 'OFICIAL',
    nivel: 'SECUNDARIA', servicioEducativo: 'SECUNDARIA GENERAL', cct: '', turno: 'MATUTINO',
    nombre: '', domicilio: '', localidad: '', telefono: '', zonaEscolar: '', sector: '',
    director: '', hombres: 0, mujeres: 0, alumnos: 0, grupos: 0, maestros: 0, administrativos: 0,
    aulasExistentes: 0, aulasEnUso: 0, modalidad: 'DES'
  });

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
  };

  const handleQuickAddCct = () => {
    if (!quickAddForm.cct || !quickAddForm.nombre || !quickAddForm.municipio) {
      toast({ variant: "destructive", title: "Faltan datos", description: "CCT, Nombre y Municipio son obligatorios." }); 
      return;
    }
    const newSchool: SchoolInfo = { 
      ...quickAddForm, 
      cct: quickAddForm.cct.toUpperCase(), 
      nombre: quickAddForm.nombre.toUpperCase(), 
      municipio: quickAddForm.municipio.toUpperCase(),
      valle: quickAddForm.valle.toUpperCase(),
      region: quickAddForm.region.toUpperCase(),
      zonaEscolar: quickAddForm.zonaEscolar.toUpperCase(),
      sector: quickAddForm.sector.toUpperCase(),
      modalidad: quickAddForm.modalidad.toUpperCase()
    };
    const updated = [newSchool, ...allSchools];
    setAllSchools(updated);
    localStorage.setItem('schools_master_full_v21', JSON.stringify(updated));
    handleCctChange(newSchool.cct);
    setIsQuickAddOpen(false);
    setDialogSearchTerm('');
    toast({ title: "Plantel Registrado", description: "El CCT ha sido añadido a la Base Maestra." });
  }

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
      responsablesList: ticket.responsablesList || [ticket.responsable1 || '', ticket.responsable2 || ''].filter(r => r),
      edusatFicha: ticket.edusatFicha || initialFormState.edusatFicha,
      redLocalFicha: ticket.redLocalFicha || initialFormState.redLocalFicha,
      mantenimientoFicha: ticket.mantenimientoFicha || initialFormState.mantenimientoFicha
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
    const currentSection = (formData.edusatFicha as any)[section];
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

  const toggleRedLocalField = (section: 'mantenimientoAula' | 'mantenimientoEquipos' | 'ubicacionAula', field: string) => {
    if (!formData.redLocalFicha) return;
    const currentSection = (formData.redLocalFicha as any)[section];
    setFormData({
      ...formData,
      redLocalFicha: {
        ...formData.redLocalFicha,
        [section]: {
          ...currentSection,
          [field]: !currentSection[field]
        }
      }
    });
  }

  const updateRedLocalMaterial = (item: string, column: 'coees' | 'ct', value: string) => {
    if (!formData.redLocalFicha) return;
    const mats = { ...formData.redLocalFicha.materiales } as any;
    mats[item] = { ...mats[item], [column]: value };
    setFormData({
      ...formData,
      redLocalFicha: { ...formData.redLocalFicha, materiales: mats }
    });
  }

  const updateMantenimientoEquipo = (index: number, field: string, value: string) => {
    if (!formData.mantenimientoFicha) return;
    const list = [...formData.mantenimientoFicha.equiposList];
    (list[index] as any)[field] = value.toUpperCase();
    setFormData({
      ...formData,
      mantenimientoFicha: { ...formData.mantenimientoFicha, equiposList: list }
    });
  }

  const filteredTickets = tickets.filter(t => {
    const matchSearch = (t.cct || '').toUpperCase().includes(listSearchTerm.toUpperCase()) ||
      (t.schoolName || '').toUpperCase().includes(listSearchTerm.toUpperCase()) ||
      (t.id || '').toUpperCase().includes(listSearchTerm.toUpperCase());
    return matchSearch;
  });

  const schoolSearchResults = useMemo(() => {
    if (!dialogSearchTerm || dialogSearchTerm.length < 3) return [];
    const term = dialogSearchTerm.toUpperCase();
    return allSchools.filter(s => s.cct.includes(term) || s.nombre.includes(term)).slice(0, 5);
  }, [allSchools, dialogSearchTerm]);

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
          <VisitSchedulerDialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen} areaId="soporte" areaName="Soporte técnico" />
          <WarehouseSystemDialog open={isWarehouseOpen} onOpenChange={setIsWarehouseOpen} />
          
          <Button onClick={() => setIsWarehouseOpen(true)} variant="outline" className="h-12 px-6 rounded-xl border-primary/20 text-primary font-bold text-[11px] gap-2 shadow-md hover:bg-primary/5">
            <Box className="h-5 w-5" /> Almacén
          </Button>

          <Button onClick={() => setIsSchedulerOpen(true)} variant="outline" className="h-12 px-6 rounded-xl border-primary/20 text-primary font-bold text-[11px] gap-2 shadow-md hover:bg-primary/5">
            <CalendarDays className="h-5 w-5" /> Agenda de visitas
          </Button>

          <Button onClick={() => { setEditingTicketId(null); setFormData(initialFormState); setDialogSearchTerm(''); setIsDialogOpen(true); }} className="btn-institutional h-12 px-8 shadow-xl text-[11px]">
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
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-[2.5rem] border border-primary/5 shadow-inner">
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

               <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b pb-2">
                     <Building2 className="h-5 w-5 text-accent" />
                     <h4 className="text-xs font-black text-accent tracking-widest uppercase">Identificación del centro de trabajo</h4>
                  </div>
                  <div className="space-y-6 bg-slate-50 p-6 rounded-[2.5rem] border border-primary/5 shadow-inner">
                    <div className="space-y-2 relative">
                      <Label className="text-[11px] font-black text-primary tracking-widest block pl-1 flex items-center gap-2">
                        <Search className="h-4 w-4 text-accent" /> Buscar Plantel (CCT o Nombre)
                      </Label>
                      <div className="relative group">
                        <Input 
                          placeholder="Ingresar CCT o nombre..." 
                          className="h-14 rounded-2xl bg-white border-primary/20 font-bold text-lg uppercase shadow-lg pl-12" 
                          value={dialogSearchTerm} 
                          onChange={(e) => setDialogSearchTerm(e.target.value)} 
                        />
                        <Search className="absolute left-4 top-4.5 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                        
                        {dialogSearchTerm.length > 2 && (
                          <div className="absolute top-16 left-0 right-0 max-h-60 overflow-auto bg-white border rounded-2xl shadow-2xl z-50 divide-y animate-in fade-in zoom-in-95 duration-200">
                            {schoolSearchResults.map((s, sidx) => (
                              <div 
                                key={`sede-res-${s.cct}-${s.turno}-${sidx}`} 
                                className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center group transition-all" 
                                onClick={() => { handleCctChange(s.cct); setDialogSearchTerm(''); }}
                              >
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-bold uppercase truncate group-hover:text-primary transition-colors">{s.nombre}</span>
                                  <span className="text-[10px] font-mono text-muted-foreground">{s.cct} • {s.municipio} • {s.turno}</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-all" />
                              </div>
                            ))}
                            {schoolSearchResults.length === 0 && (
                              <div className="p-6 text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest">CCT no encontrado en la Base Maestra</p>
                                <Button 
                                  onClick={() => { setQuickAddForm({...quickAddForm, cct: dialogSearchTerm.toUpperCase()}); setIsQuickAddOpen(true); }} 
                                  variant="outline" 
                                  className="h-10 px-6 rounded-xl text-[9px] font-black uppercase border-primary/20 text-primary hover:bg-primary/5"
                                >
                                  <Plus className="h-4 w-4 mr-2" /> Registrar Nuevo Plantel
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {formData.cct && (
                      <div className="flex items-center gap-6 p-6 bg-white rounded-[2rem] border-2 border-emerald-100 shadow-sm animate-in zoom-in-95">
                        <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                          <School className="h-10 w-10" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
                          <div className="min-w-0">
                            <h4 className="text-xl font-bold uppercase truncate leading-tight text-slate-800">{formData.schoolName}</h4>
                            <p className="text-[11px] font-mono font-bold text-emerald-700 tracking-widest mt-1 uppercase">CCT oficial: {formData.cct}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black text-slate-400 uppercase">Z.E.</span>
                              <span className="text-xs font-black text-slate-700 uppercase">{formData.ze || 'S/D'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black text-slate-400 uppercase">Sector</span>
                              <span className="text-xs font-black text-slate-700 uppercase">{formData.sector || 'S/D'}</span>
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase">Ubicación</span>
                            <span className="text-[10px] font-bold text-slate-700 uppercase truncate">{formData.municipio} • {formData.valle}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b pb-2">
                       <Layers className="h-5 w-5 text-accent" />
                       <h4 className="text-xs font-black text-accent tracking-widest uppercase">Servicios realizados</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                       <div className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer", formData.tipoIncidencias?.includes('red edusat') ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100 shadow-sm")} onClick={() => toggleTipoIncidencia('red edusat')}>
                          <Checkbox checked={formData.tipoIncidencias?.includes('red edusat')} onCheckedChange={() => toggleTipoIncidencia('red edusat')} />
                          <Label className="text-[11px] font-bold cursor-pointer">Red Edusat (F5)</Label>
                       </div>
                       <div className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer", formData.tipoIncidencias?.includes('red local') ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100 shadow-sm")} onClick={() => toggleTipoIncidencia('red local')}>
                          <Checkbox checked={formData.tipoIncidencias?.includes('red local')} onCheckedChange={() => toggleTipoIncidencia('red local')} />
                          <Label className="text-[11px] font-bold cursor-pointer">Red local (F5)</Label>
                       </div>
                       <div className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer", formData.tipoIncidencias?.includes('mantenimiento') ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100 shadow-sm")} onClick={() => toggleTipoIncidencia('mantenimiento')}>
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
                      <div className="space-y-2 bg-slate-50 p-4 rounded-2xl shadow-inner border border-primary/5">
                         <Label className="text-[9px] font-black text-primary uppercase">Alumnos beneficiados</Label>
                         <Input type="number" className="h-10 font-black text-center bg-white border-none shadow-sm" value={formData.alumnosBeneficiados} onChange={e => setFormData({...formData, alumnosBeneficiados: parseInt(e.target.value) || 0})} />
                      </div>
                      <div className="space-y-2 bg-slate-50 p-4 rounded-2xl shadow-inner border border-primary/5">
                         <Label className="text-[9px] font-black text-primary uppercase">Equipos atendidos</Label>
                         <Input type="number" className="h-10 font-black text-center bg-white border-none shadow-sm" value={formData.numEquipos} onChange={e => setFormData({...formData, numEquipos: parseInt(e.target.value) || 0})} />
                      </div>
                    </div>
                  </div>
               </div>

               {/* Ficha Técnica de Atención Mantenimiento (F4) */}
               {formData.tipoIncidencias?.includes('mantenimiento') && (
                 <div className="space-y-8 animate-in zoom-in-95 duration-500 pt-6">
                    <div className="flex items-center gap-3 border-b-2 border-primary/20 pb-3">
                       <MonitorCheck className="h-6 w-6 text-primary" />
                       <h4 className="text-sm font-black text-primary uppercase tracking-widest">Ficha técnica de atención Mantenimiento</h4>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-[2.5rem] border shadow-inner space-y-6">
                       <div className="flex flex-wrap items-center gap-8 border-b border-primary/10 pb-4">
                          <Label className="text-[10px] font-black uppercase text-primary">Equipo tecnológico:</Label>
                          <div className="flex items-center gap-4">
                             <div className="flex items-center gap-2">
                                <Checkbox id="hdt-check" checked={formData.mantenimientoFicha?.equipoTecnologico.hdt} onCheckedChange={(val) => setFormData({...formData, mantenimientoFicha: {...formData.mantenimientoFicha!, equipoTecnologico: {...formData.mantenimientoFicha!.equipoTecnologico, hdt: !!val}}})} />
                                <Label htmlFor="hdt-check" className="text-[10px] font-bold cursor-pointer">HDT</Label>
                             </div>
                             <div className="flex items-center gap-2">
                                <Checkbox id="comp-check" checked={formData.mantenimientoFicha?.equipoTecnologico.equipoComputo} onCheckedChange={(val) => setFormData({...formData, mantenimientoFicha: {...formData.mantenimientoFicha!, equipoTecnologico: {...formData.mantenimientoFicha!.equipoTecnologico, equipoComputo: !!val}}})} />
                                <Label htmlFor="comp-check" className="text-[10px] font-bold cursor-pointer">EQUIPO DE CÓMPUTO</Label>
                             </div>
                             <div className="flex items-center gap-2 ml-4">
                                <span className="text-[10px] font-bold uppercase text-slate-400">OTRO:</span>
                                <Input className="h-8 w-40 bg-white text-[10px] font-bold border-primary/10" value={formData.mantenimientoFicha?.equipoTecnologico.otro} onChange={e => setFormData({...formData, mantenimientoFicha: {...formData.mantenimientoFicha!, equipoTecnologico: {...formData.mantenimientoFicha!.equipoTecnologico, otro: e.target.value.toUpperCase()}}})} />
                             </div>
                          </div>
                       </div>

                       <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
                          <Table>
                             <TableHeader className="bg-slate-100">
                                <TableRow className="h-10">
                                   <TableHead className="w-12 text-[9px] font-black text-center pl-4">N.P.</TableHead>
                                   <TableHead className="text-[9px] font-black">EQUIPO</TableHead>
                                   <TableHead className="text-[9px] font-black">MARCA</TableHead>
                                   <TableHead className="text-[9px] font-black">NO. SERIE</TableHead>
                                   <TableHead className="text-[9px] font-black">NO. CENSAL</TableHead>
                                </TableRow>
                             </TableHeader>
                             <TableBody>
                                {formData.mantenimientoFicha?.equiposList.map((eq, idx) => (
                                  <TableRow key={idx} className="h-10">
                                     <TableCell className="text-center font-bold text-slate-400 pl-4">{idx + 1}</TableCell>
                                     <TableCell className="p-1"><Input className="h-8 bg-slate-50/50 border-none text-[10px] font-bold" value={eq.equipo} onChange={e => updateMantenimientoEquipo(idx, 'equipo', e.target.value)} /></TableCell>
                                     <TableCell className="p-1"><Input className="h-8 bg-slate-50/50 border-none text-[10px] font-bold" value={eq.marca} onChange={e => updateMantenimientoEquipo(idx, 'marca', e.target.value)} /></TableCell>
                                     <TableCell className="p-1"><Input className="h-8 bg-slate-50/50 border-none text-[10px] font-bold font-mono" value={eq.serie} onChange={e => updateMantenimientoEquipo(idx, 'serie', e.target.value)} /></TableCell>
                                     <TableCell className="p-1"><Input className="h-8 bg-slate-50/50 border-none text-[10px] font-bold font-mono" value={eq.censal} onChange={e => updateMantenimientoEquipo(idx, 'censal', e.target.value)} /></TableCell>
                                  </TableRow>
                                ))}
                             </TableBody>
                          </Table>
                       </div>

                       <div className="space-y-6 pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <Label className="text-[10px] font-black text-primary pl-1">Falla identificada:</Label>
                               <Input className="h-11 bg-white border-primary/10 font-bold text-xs uppercase" value={formData.mantenimientoFicha?.fallaIdentificada} onChange={e => setFormData({...formData, mantenimientoFicha: {...formData.mantenimientoFicha!, fallaIdentificada: e.target.value.toUpperCase()}})} />
                            </div>
                            <div className="space-y-2">
                               <Label className="text-[10px] font-black text-primary pl-1">Servicio realizado:</Label>
                               <Input className="h-11 bg-white border-primary/10 font-bold text-xs uppercase" value={formData.mantenimientoFicha?.servicioRealizado} onChange={e => setFormData({...formData, mantenimientoFicha: {...formData.mantenimientoFicha!, servicioRealizado: e.target.value.toUpperCase()}})} />
                            </div>
                          </div>
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black text-primary pl-1 uppercase tracking-widest text-center block bg-slate-200 py-1 rounded-t-xl">Observaciones</Label>
                             <Textarea className="min-h-[120px] rounded-b-[1.5rem] rounded-t-none border-primary/10 p-4 text-[11px] font-medium bg-white uppercase shadow-inner" value={formData.mantenimientoFicha?.observaciones} onChange={e => setFormData({...formData, mantenimientoFicha: {...formData.mantenimientoFicha!, observaciones: e.target.value.toUpperCase()}})} />
                          </div>
                       </div>
                    </div>
                 </div>
               )}

               {/* Ficha Técnica de Atención Red Local (F5) */}
               {formData.tipoIncidencias?.includes('red local') && (
                 <div className="space-y-8 animate-in zoom-in-95 duration-500 pt-6">
                    <div className="flex items-center gap-3 border-b-2 border-primary/20 pb-3">
                       <Server className="h-6 w-6 text-primary" />
                       <h4 className="text-sm font-black text-primary uppercase tracking-widest">Ficha técnica de atención Red Local</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-8">
                          <div className="bg-slate-50 p-6 rounded-[2.5rem] border shadow-inner space-y-6">
                             <div className="flex justify-between items-center">
                                <Label className="text-[10px] font-black uppercase text-primary"># de Nodos registrados</Label>
                                <Input className="h-10 w-24 bg-white text-center font-black border-primary/10" value={formData.redLocalFicha?.nodos} onChange={e => setFormData({...formData, redLocalFicha: {...formData.redLocalFicha!, nodos: e.target.value}})} />
                             </div>
                             
                             <div className="grid grid-cols-1 gap-4">
                                {[
                                  { id: 'cuentaRedLocal', label: '¿Cuenta con red local?' },
                                  { id: 'requiereMantenimiento', label: '¿Requiere mantenimiento?' },
                                  { id: 'electricaAdecuada', label: 'Instalación eléctrica adecuada' },
                                  { id: 'cuentaInternet', label: '¿Cuenta con internet?' },
                                ].map(q => (
                                  <div key={q.id} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-600 uppercase">{q.label}</span>
                                    <RadioGroup 
                                      value={(formData.redLocalFicha as any)[q.id]} 
                                      onValueChange={(val) => setFormData({...formData, redLocalFicha: {...formData.redLocalFicha!, [q.id]: val}})}
                                      className="flex gap-4"
                                    >
                                      <div className="flex items-center space-x-1">
                                        <RadioGroupItem value="si" id={`${q.id}-si`} className="h-4 w-4" /><Label htmlFor={`${q.id}-si`} className="text-[10px] font-black cursor-pointer">SÍ</Label>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <RadioGroupItem value="no" id={`${q.id}-no`} className="h-4 w-4" /><Label htmlFor={`${q.id}-no`} className="text-[10px] font-black cursor-pointer">NO</Label>
                                      </div>
                                    </RadioGroup>
                                  </div>
                                ))}
                             </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1"><Label className="text-[9px] font-black text-slate-400">Proveedor de internet</Label><Input className="h-9 bg-white border-primary/5 font-bold uppercase" value={formData.redLocalFicha?.proveedorInternet} onChange={e => setFormData({...formData, redLocalFicha: {...formData.redLocalFicha!, proveedorInternet: e.target.value.toUpperCase()}})} /></div>
                                <div className="space-y-1"><Label className="text-[9px] font-black text-slate-400">Ancho de banda</Label><Input className="h-9 bg-white border-primary/5 text-center font-black" value={formData.redLocalFicha?.anchoBanda} onChange={e => setFormData({...formData, redLocalFicha: {...formData.redLocalFicha!, anchoBanda: e.target.value}})} /></div>
                             </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[{id: 'ampliacionRed', label: 'Ampliación de red'}, {id: 'nuevaRed', label: 'Nueva red'}].map(q => (
                                  <div key={q.id} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                    <span className="text-[9px] font-bold text-slate-600 uppercase">{q.label}</span>
                                    <RadioGroup value={(formData.redLocalFicha as any)[q.id]} onValueChange={(val) => setFormData({...formData, redLocalFicha: {...formData.redLocalFicha!, [q.id]: val}})} className="flex gap-2">
                                      <div className="flex items-center space-x-1">
                                         <RadioGroupItem value="si" className="h-3 w-3" /><span className="text-[8px] font-black">SÍ</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                         <RadioGroupItem value="no" className="h-3 w-3" /><span className="text-[8px] font-black">NO</span>
                                      </div>
                                    </RadioGroup>
                                  </div>
                                ))}
                             </div>
                          </div>

                          <div className="space-y-4">
                             <div className="flex items-center gap-2 border-b pb-1"><Archive className="h-4 w-4 text-accent" /><h5 className="text-[10px] font-black uppercase text-accent">Aula donde se brinda el servicio</h5></div>
                             <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-[1.5rem] border">
                                {[
                                  { id: 'tallerComputo', label: 'Taller de cómputo' },
                                  { id: 'aulaMedios', label: 'Aula de medios' },
                                  { id: 'hdt', label: 'HDT' },
                                  { id: 'ofimatica', label: 'Ofimática' },
                                  { id: 'areaAdmin', label: 'Área administrativa' },
                                  { id: 'otros', label: 'Otros' },
                                ].map(item => (
                                  <div key={item.id} className="flex items-center gap-2" onClick={() => toggleRedLocalField('ubicacionAula', item.id)}>
                                    <Checkbox checked={(formData.redLocalFicha?.ubicacionAula as any)?.[item.id]} onCheckedChange={() => toggleRedLocalField('ubicacionAula', item.id)} />
                                    <Label className="text-[10px] font-bold cursor-pointer uppercase">{item.label}</Label>
                                  </div>
                                ))}
                             </div>
                          </div>
                       </div>

                       <div className="space-y-6">
                          <div className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-inner overflow-hidden">
                             <Table>
                                <TableHeader className="bg-slate-50">
                                   <TableRow className="h-8">
                                      <TableHead className="text-[9px] font-black uppercase">Materiales requeridos</TableHead>
                                      <TableHead className="text-[9px] font-black uppercase text-center w-16">COEES</TableHead>
                                      <TableHead className="text-[9px] font-black uppercase text-center w-16">C.T.</TableHead>
                                   </TableRow>
                                </TableHeader>
                                <TableBody>
                                   {[
                                     { id: 'canaleta', label: 'Canaleta' },
                                     { id: 'cableUTP', label: 'Cable UTP' },
                                     { id: 'rosetas', label: 'Rosetas' },
                                     { id: 'conectores', label: 'Conectores' },
                                     { id: 'pijas', label: 'Pijas y taquetes' },
                                     { id: 'cinturones', label: 'Cinturones' },
                                     { id: 'switch', label: 'Switch o Router' },
                                     { id: 'conectoresRJ45', label: 'Conectores RJ45' },
                                   ].map(item => (
                                     <TableRow key={item.id} className="h-10">
                                        <TableCell className="py-1 pl-4 text-[10px] font-bold uppercase text-slate-500">{item.label}</TableCell>
                                        <TableCell className="p-1"><Input className="h-8 bg-slate-50 text-center font-black text-[10px]" value={(formData.redLocalFicha?.materiales as any)?.[item.id]?.coees} onChange={e => updateRedLocalMaterial(item.id, 'coees', e.target.value)} /></TableCell>
                                        <TableCell className="p-1"><Input className="h-8 bg-slate-50 text-center font-black text-[10px]" value={(formData.redLocalFicha?.materiales as any)?.[item.id]?.ct} onChange={e => updateRedLocalMaterial(item.id, 'ct', e.target.value)} /></TableCell>
                                     </TableRow>
                                   ))}
                                </TableBody>
                             </Table>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b pb-1"><Wrench className="h-4 w-4 text-primary" /><h5 className="text-[9px] font-black uppercase text-primary">Mant. Aula</h5></div>
                                <div className="bg-slate-50 p-3 rounded-2xl border space-y-2">
                                  {[
                                    { id: 'conectores', label: 'Sustitución de conectores' },
                                    { id: 'parcheo', label: 'Cordones de parcheo' },
                                    { id: 'cableUTP', label: 'Sustitución cable UTP' },
                                    { id: 'rosetas', label: 'Sustitución rosetas' },
                                    { id: 'canaletas', label: 'Sustitución canaletas' },
                                    { id: 'configuracion', label: 'Configuración de red' },
                                  ].map(f => (
                                    <div key={f.id} className="flex items-center gap-2" onClick={() => toggleRedLocalField('mantenimientoAula', f.id)}>
                                      <Checkbox id={`aula-${f.id}`} checked={(formData.redLocalFicha?.mantenimientoAula as any)?.[f.id]} onCheckedChange={() => toggleRedLocalField('mantenimientoAula', f.id)} />
                                      <Label htmlFor={`aula-${f.id}`} className="text-[9px] font-bold uppercase text-slate-600 cursor-pointer">{f.label}</Label>
                                    </div>
                                  ))}
                                </div>
                             </div>

                             <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b pb-1"><Cpu className="h-4 w-4 text-primary" /><h5 className="text-[9px] font-black uppercase text-primary">Mant. Equipos</h5></div>
                                <div className="bg-slate-50 p-3 rounded-2xl border space-y-2">
                                  {[
                                    { id: 'formateo', label: 'Formateo a equipos' },
                                    { id: 'windows', label: 'Instalación de Windows' },
                                    { id: 'office', label: 'Instalación de Office' },
                                    { id: 'drivers', label: 'Instalación de Drivers' },
                                    { id: 'antivirus', label: 'Instalación Antivirus' },
                                    { id: 'software', label: 'Software a petición' },
                                    { id: 'hardware', label: 'Sustitución hardware' },
                                  ].map(f => (
                                    <div key={f.id} className="flex items-center gap-2" onClick={() => toggleRedLocalField('mantenimientoEquipos', f.id)}>
                                      <Checkbox id={`eq-${f.id}`} checked={(formData.redLocalFicha?.mantenimientoEquipos as any)?.[f.id]} onCheckedChange={() => toggleRedLocalField('mantenimientoEquipos', f.id)} />
                                      <Label htmlFor={`eq-${f.id}`} className="text-[9px] font-bold uppercase text-slate-600 cursor-pointer">{f.label}</Label>
                                    </div>
                                  ))}
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
               )}

               {/* Ficha Técnica de Atención Red Edusat */}
               {formData.tipoIncidencias?.includes('red edusat') && (
                 <div className="space-y-6 animate-in zoom-in-95 duration-500 pt-6">
                    <div className="flex items-center gap-3 border-b-2 border-primary/20 pb-3">
                       <Radio className="h-6 w-6 text-primary" />
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-100/50 p-6 rounded-3xl border shadow-inner">
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
                        className="h-8 rounded-lg border-primary/20 text-primary font-bold text-[10px] gap-2 hover:bg-primary/5 shadow-sm"
                     >
                        <Plus className="h-3 w-3" /> Añadir responsable
                     </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(formData.responsablesList || ['']).map((resp, idx) => (
                      <div key={`resp-${idx}`} className="space-y-2 relative group animate-in slide-in-from-left-2 duration-300">
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

      {/* Diálogo de Alta Rápida de CCT */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-[#B38E5D] text-white">
            <DialogTitle className="uppercase font-black text-lg flex items-center gap-3"><PlusCircle className="h-6 w-6" /> Registro de Nuevo CCT</DialogTitle>
            <DialogDescription className="text-white/80 text-[10px] font-bold uppercase mt-1">Sume un nuevo plantel a la base maestra para futuros reportes.</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">CCT (10 Dígitos)</Label>
                  <Input value={quickAddForm.cct} onChange={e => setQuickAddForm({...quickAddForm, cct: e.target.value.toUpperCase()})} maxLength={10} className="font-mono font-black border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Nombre del Plantel</Label>
                  <Input value={quickAddForm.nombre} onChange={e => setQuickAddForm({...quickAddForm, nombre: e.target.value.toUpperCase()})} className="font-black border-slate-200" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Municipio</Label>
                  <Input value={quickAddForm.municipio} onChange={e => setQuickAddForm({...quickAddForm, municipio: e.target.value.toUpperCase()})} className="font-bold uppercase border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Región</Label>
                  <Input value={quickAddForm.region} onChange={e => setQuickAddForm({...quickAddForm, region: e.target.value.toUpperCase()})} className="font-bold border-slate-200" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Valle</Label>
                  <Select value={quickAddForm.valle} onValueChange={v => setQuickAddForm({...quickAddForm, valle: v})}><SelectTrigger className="font-bold border-slate-200"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MEXICO">MÉXICO</SelectItem><SelectItem value="TOLUCA">TOLUCA</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Sector</Label>
                  <Input value={quickAddForm.sector} onChange={e => setQuickAddForm({...quickAddForm, sector: e.target.value.toUpperCase()})} className="font-black border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Zona Escolar</Label>
                  <Input value={quickAddForm.zonaEscolar} onChange={e => setQuickAddForm({...quickAddForm, zonaEscolar: e.target.value.toUpperCase()})} className="font-black border-slate-200" />
                </div>
             </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsQuickAddOpen(false)} className="h-12 px-8 text-[10px] font-black uppercase">Cancelar</Button>
            <Button onClick={handleQuickAddCct} className="bg-primary text-white h-12 px-12 rounded-xl text-[10px] font-black uppercase shadow-lg">Registrar Plantel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
