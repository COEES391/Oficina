'use client'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { programsData, type ProgramStatus } from "@/lib/planning-data"
import { schoolsDirectory } from "@/lib/schools-directory"
import { cn } from "@/lib/utils"
import Image from 'next/image'
import { 
  PlusCircle, 
  Pencil, 
  Activity,
  Target,
  Search,
  Trash2,
  UserPlus,
  Monitor,
  School,
  CalendarDays,
  Headset,
  Copy,
  ExternalLink,
  Circle,
  Info
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { VisitSchedulerDialog } from '@/components/VisitSchedulerDialog'
import { HelpDeskDialog } from '@/components/HelpDeskDialog'

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
  const [officeFilter, setOfficeFilter] = useState('all')
  const [dialogSearchTerm, setDialogSearchTerm] = useState('')

  // Assistant Sub-Dialog State
  const [isAssistantDialogOpen, setIsAssistantDialogOpen] = useState(false)
  const [assistantForm, setAssistantForm] = useState({
    nombres: '',
    paterno: '',
    materno: '',
    rfc: '',
    funcion: '',
    email: ''
  })

  const initialFormState: ProgramStatus = {
    id: '', name: '', progress: 0, status: 'activo', date: new Date().toISOString().split('T')[0], cct: '', schoolName: '', 
    zonaEscolar: '', sector: '', modalidad: '', municipio: '', region: '', valle: '',
    numeroEquipos: 0, observaciones: '', capacitacion: 'N', asistentes: [], email: '',
    latitud: '', longitud: '',
    tecnicos: '',
    tipoIncidencia: 'mantenimiento',
    oficinaRegionalAtencion: '',
    numeroOficio: '',
    alumnosBeneficiados: 0,
    docentesBeneficiados: 0,
    serviciosMC: 0,
    serviciosMP: 0,
    reportPdf: '',
    evidencePhotos: [],
    mantenimientoDetalle: {
      equipoTecnologico: '',
      equipoTecnologicoOtro: '',
      equipos: Array(10).fill({ equipo: '', marca: '', serie: '', censal: '' }),
      fallaIdentificada: '',
      servicioRealizado: ''
    },
    edusatDetalle: {
      micropak: [],
      antena: [],
      decodificadorAcciones: [],
      cableado: [],
      preventivo: [],
      numCensal: '',
      numSerie: '',
      calidadSeñal: '',
      materiales: Array(8).fill({ material: '', cantidad: '', actividades: '' })
    }
  }

  const [formData, setFormData] = useState<ProgramStatus>(initialFormState)

  useEffect(() => {
    setMounted(true)
    const currentVersion = 'programs_full_v24'
    const storedV24 = localStorage.getItem(currentVersion)
    
    if (storedV24) {
      setRecords(JSON.parse(storedV24))
    } else {
      setRecords(programsData)
      localStorage.setItem(currentVersion, JSON.stringify(programsData))
    }
  }, [])

  const handleCctChange = (val: string) => {
    const cleanVal = val.toUpperCase();
    setFormData(prev => ({ ...prev, cct: cleanVal }));
    if (cleanVal.length === 10) {
      const school = schoolsDirectory.find(s => s.cct.toUpperCase() === cleanVal);
      if (school) {
        populateWithSchool(school);
      }
    }
  }

  const populateWithSchool = (school: any) => {
    setFormData(prev => ({
      ...prev,
      cct: school.cct,
      schoolName: school.nombre,
      zonaEscolar: school.zonaEscolar,
      sector: school.sector,
      modalidad: school.modalidad,
      municipio: school.municipio,
      valle: school.valle,
      region: school.region,
      email: `${school.cct.toLowerCase()}@desysa.gob.mx`
    }));
    toast({
      title: "Plantel Identificado",
      description: `${school.nombre} cargado correctamente.`,
    });
  }

  const handleSave = () => {
    if (!formData.cct) {
      toast({ variant: "destructive", title: "Datos Incompletos", description: "El CCT es obligatorio." });
      return;
    }
    const updated = editingId 
      ? records.map(r => r.id === editingId ? formData : r) 
      : [{...formData, id: `SOL-${Date.now()}`}, ...records];
    setRecords(updated)
    localStorage.setItem('programs_full_v24', JSON.stringify(updated))
    setIsDialogOpen(false)
    setEditingId(null)
    setFormData(initialFormState)
    setDialogSearchTerm('')
    toast({ title: "Registro guardado con éxito" })
  }

  const filteredRecords = useMemo(() => {
    let filtered = records.filter(r => r.name === activeTab);
    
    if (searchTerm) {
      const term = searchTerm.toUpperCase();
      filtered = filtered.filter(r => 
        (r.cct || '').toUpperCase().includes(term) || 
        (r.schoolName || '').toUpperCase().includes(term)
      );
    }

    if (officeFilter !== 'all') {
      filtered = filtered.filter(r => r.oficinaRegionalAtencion === officeFilter);
    }

    return [...filtered].sort((a, b) => (a.cct || '').localeCompare(b.cct || ''));
  }, [records, activeTab, searchTerm, officeFilter]);

  const handleEdit = (rec: ProgramStatus) => {
    setFormData({
      ...initialFormState,
      ...rec,
    });
    setEditingId(rec.id);
    setIsDialogOpen(true);
  }

  const handleDeleteRecord = (id: string) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    localStorage.setItem('programs_full_v24', JSON.stringify(updated));
    toast({ title: "Registro eliminado" });
  }

  const helpDeskUrl = mounted ? `${window.location.origin}/helpdesk` : '';
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(helpDeskUrl)}`;

  const copyHelpDeskUrl = () => {
    navigator.clipboard.writeText(helpDeskUrl)
    toast({ title: "Link copiado", description: "La URL ha sido copiada al portapapeles." })
  }

  if (!mounted) return null

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header Institucional - Legible y Espaciado */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-primary uppercase leading-none">Módulos Técnicos COEES</h2>
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full border border-primary/5 shadow-sm inline-flex">
            <Activity className="h-3 w-3 text-accent" /> 
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Control de Programas y Auditoría 2026</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          {activeTab === 'ATRES' && (
            <Button 
              onClick={() => setIsHelpDeskOpen(true)} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-6 rounded-xl shadow-lg font-black uppercase text-xs gap-2 transition-all active:scale-95"
            >
              <Headset className="h-5 w-5" /> Mesa de Ayuda ATRES
            </Button>
          )}
          <Button 
            onClick={() => { setFormData({...initialFormState, name: activeTab}); setEditingId(null); setIsDialogOpen(true); setDialogSearchTerm(''); }} 
            className="btn-institutional h-11 px-8 rounded-xl shadow-lg text-xs flex items-center justify-center tracking-[0.2em]"
          >
            <PlusCircle className="h-5 w-5 mr-2" /> Nuevo Registro
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSearchTerm(''); }} className="space-y-4">
        <div className="w-full">
          <TabsList className="w-full justify-start h-12 bg-white/50 backdrop-blur-md border border-slate-200 p-1 rounded-2xl shadow-sm gap-1 overflow-x-auto">
            {PROGRAM_RUBROS.map(rubro => (
              <TabsTrigger 
                key={rubro} 
                value={rubro} 
                className="h-full px-6 text-[10px] font-black uppercase rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
              >
                {rubro}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {activeTab === 'ATRES' && (
          <Card className="executive-card p-6 bg-emerald-50/10 border-emerald-100 border overflow-hidden relative">
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
               <div className="bg-white p-4 rounded-3xl shadow-xl border border-emerald-50 shrink-0">
                  <div className="relative h-28 w-28 flex items-center justify-center bg-slate-50 rounded-2xl">
                     {helpDeskUrl ? (
                       <Image src={qrCodeApiUrl} alt="Acceso Docentes QR" width={110} height={110} className="object-contain" />
                     ) : (
                       <Circle className="h-10 w-10 text-slate-200 animate-pulse" />
                     )}
                  </div>
               </div>
               
               <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <Badge className="bg-emerald-600 text-white font-black uppercase text-[10px] px-3 py-1 rounded-full mb-2">Canal Oficial</Badge>
                    <h3 className="text-xl font-black text-emerald-900 uppercase leading-none">Acceso Directo para Docentes</h3>
                    <p className="text-sm font-semibold text-emerald-700/80">Comparta este link o código QR para soporte técnico remoto inmediato.</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 items-center w-full max-w-2xl">
                    <div className="flex-1 h-12 bg-white rounded-xl border border-emerald-100 flex items-center px-4 gap-3 shadow-inner overflow-hidden w-full">
                       <ExternalLink className="h-4 w-4 text-emerald-600 shrink-0" />
                       <span className="font-mono text-xs font-bold text-emerald-800 flex-1 truncate">
                         {helpDeskUrl}
                       </span>
                       <Button variant="ghost" size="sm" onClick={copyHelpDeskUrl} className="h-8 px-3 rounded-lg text-emerald-600 hover:bg-emerald-50 gap-2 shrink-0">
                          <Copy className="h-3.5 w-3.5" /> <span className="text-[10px] font-black uppercase">Copiar</span>
                       </Button>
                    </div>
                    <Button onClick={() => window.open('/helpdesk', '_blank')} className="h-12 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[10px] gap-2 shadow-lg w-full sm:w-auto">
                       Abrir Portal <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
               </div>
            </div>
          </Card>
        )}

        {/* Barra Operativa de Filtros */}
        <Card className="executive-card p-4 bg-white/80 border-none shadow-md border-t-4 border-t-primary">
          <div className="flex flex-col md:flex-row items-center gap-4">
             <div className="relative flex-1 w-full">
                <Input 
                  placeholder="BUSCAR POR CCT O NOMBRE DE PLANTEL..." 
                  className="h-12 rounded-xl bg-slate-50 border-primary/5 pl-12 text-sm font-bold uppercase shadow-inner focus:bg-white transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-4 top-4 h-4 w-4 text-slate-300" />
             </div>

             <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                <Select value={officeFilter} onValueChange={setOfficeFilter}>
                  <SelectTrigger className="h-12 w-[220px] rounded-xl border-primary/5 bg-white text-[10px] font-black uppercase shadow-sm">
                      <SelectValue placeholder="FILTRAR OFICINA..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    <SelectItem value="all" className="text-[10px] font-black uppercase">Todas las Oficinas</SelectItem>
                    {REGIONAL_OFFICES.map(off => (
                      <SelectItem key={off} value={off} className="text-[10px] font-black uppercase">{off.replace("Oficina de Tecnóloga Educativa ", "").replace("Oficina de ", "")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" className="h-12 px-6 border-primary/20 text-primary font-black uppercase text-[10px] gap-2 rounded-xl hover:bg-primary/5 shadow-sm" onClick={() => setIsSchedulerOpen(true)}>
                  <CalendarDays className="h-5 w-5" /> Agenda de Visitas
                </Button>
             </div>
          </div>
        </Card>

        <TabsContent value={activeTab} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
          <Card className="executive-card p-0 shadow-xl border-none overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80 backdrop-blur-sm border-b">
                   <TableRow className="h-14">
                      <TableHead className="w-12 text-[10px] font-black uppercase text-center pl-6 text-primary/60">#</TableHead>
                      <TableHead className="text-[11px] font-black uppercase text-primary tracking-widest">{activeTab === 'ATRES' ? 'Folio de Solicitud' : 'CCT Oficial'}</TableHead>
                      <TableHead className="text-[11px] font-black uppercase text-primary tracking-widest">
                        {activeTab === 'Geoposición' ? 'Longitud' : 'Nombre del Plantel Educativo'}
                      </TableHead>
                      <TableHead className="text-[11px] font-black uppercase text-primary tracking-widest">
                        {activeTab === 'Geoposición' ? 'Latitud' : activeTab === 'ATRES' ? 'Tipo Incidencia' : 'Estatus Operativo'}
                      </TableHead>
                      <TableHead className="text-[11px] font-black uppercase text-center text-primary tracking-widest">
                        {activeTab === 'Geoposición' ? 'Estado' : activeTab === 'Biblioteca Digital' ? 'Equipos' : activeTab === 'ATRES' ? 'Estatus' : 'Correo Institucional'}
                      </TableHead>
                      {(activeTab === 'Biblioteca Digital' || activeTab === 'ATRES' || activeTab === 'Cuentas Institucionales' || activeTab === 'Conoce mi Escuela') && (
                        <TableHead className="text-[11px] font-black uppercase text-center text-primary tracking-widest">Personal</TableHead>
                      )}
                      <TableHead className="text-right text-[11px] font-black uppercase pr-10 text-primary/60">Gestión</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length > 0 ? filteredRecords.map((rec, idx) => (
                    <TableRow key={rec.id} className="hover:bg-primary/[0.02] transition-all duration-300 group border-b border-slate-50 last:border-0 h-16">
                      <TableCell className="text-center font-black text-xs text-muted-foreground/60 pl-6">{idx + 1}.</TableCell>
                      <TableCell className="font-black text-sm text-primary tracking-tight">{activeTab === 'ATRES' ? rec.id : rec.cct}</TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black text-slate-800 uppercase leading-tight truncate max-w-[320px]">
                            {activeTab === 'Geoposición' ? rec.longitud : rec.schoolName}
                          </span>
                          {activeTab !== 'Geoposición' && (
                            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70 mt-1 flex items-center gap-1">
                              <Target className="h-2.5 w-2.5" /> {rec.municipio}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {activeTab === 'Geoposición' ? <span className="text-xs font-mono font-bold text-slate-600">{rec.latitud}</span> : 
                         activeTab === 'ATRES' ? <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/20 bg-primary/5 text-primary py-1 px-3 rounded-full">{rec.tipoIncidencia || 'Soporte'}</Badge> :
                         <Badge variant="outline" className={cn("text-[10px] font-black uppercase py-1 px-3 rounded-full", rec.status === 'activo' || rec.status === 'pendiente' ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-emerald-200 text-emerald-700 bg-emerald-50')}>
                           {rec.status?.toUpperCase() || 'ACTIVO'}
                         </Badge>}
                      </TableCell>
                      <TableCell className="text-center">
                         {activeTab === 'Biblioteca Digital' ? (
                          <span className="inline-flex items-center justify-center h-8 w-12 rounded-xl bg-primary/5 text-primary text-xs font-black border border-primary/10">{rec.numeroEquipos || 0}</span>
                        ) : activeTab === 'ATRES' ? (
                          <div className={cn("h-7 inline-flex items-center justify-center px-4 rounded-lg text-[10px] font-black uppercase border", rec.status === 'atendido' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100')}>
                            {rec.status === 'atendido' ? 'RESUELTO' : 'PENDIENTE'}
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono font-bold lowercase text-slate-500 truncate block max-w-[150px] mx-auto">{rec.email || 'S/D'}</span>
                        )}
                      </TableCell>
                      {(activeTab === 'Biblioteca Digital' || activeTab === 'ATRES' || activeTab === 'Cuentas Institucionales' || activeTab === 'Conoce mi Escuela') && (
                        <TableCell className="text-center">
                          <span className="text-sm font-black text-accent">{rec.asistentes?.length || 0}</span>
                        </TableCell>
                      )}
                      <TableCell className="text-right pr-10">
                         <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(rec)} className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteRecord(rec.id)} className="h-9 w-9 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="h-4 w-4" /></Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-24 bg-slate-50/20">
                         <div className="flex flex-col items-center gap-3 opacity-30">
                            <Monitor className="h-12 w-12 text-slate-400" />
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Sin registros disponibles en esta categoría</p>
                         </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals y Diálogos */}
      <HelpDeskDialog open={isHelpDeskOpen} onOpenChange={setIsHelpDeskOpen} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[850px] rounded-[2.5rem] h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-slate-50 border-b flex flex-row items-center justify-between shrink-0 pr-12">
            <div className="space-y-1">
              <DialogTitle className="uppercase font-black text-primary text-xl flex items-center gap-3">
                <Target className="h-6 w-6 text-accent" /> Gestión de {activeTab}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Panel de Control y Seguimiento Institucional</DialogDescription>
            </div>
          </DialogHeader>

          <Tabs defaultValue="auditoria" className="flex-1 flex flex-col overflow-hidden">
             <div className="px-8 border-b bg-white">
                <TabsList className="bg-transparent h-14 p-0 gap-8">
                  <TabsTrigger value="auditoria" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary px-2 py-4 text-[11px] font-black uppercase tracking-widest transition-all">1. Auditoría Técnica</TabsTrigger>
                  {(activeTab === 'Biblioteca Digital' || activeTab === 'Cuentas Institucionales' || activeTab === 'Conoce mi Escuela' || activeTab === 'ATRES') && (
                    <TabsTrigger value="asistentes" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary px-2 py-4 text-[11px] font-black uppercase tracking-widest transition-all">2. Censo de Personal</TabsTrigger>
                  )}
                </TabsList>
             </div>

             <div className="flex-1 overflow-hidden bg-slate-50/10">
                <TabsContent value="auditoria" className="h-full m-0 p-8 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-8">
                      <div className="p-6 bg-white rounded-3xl border border-primary/5 space-y-4 shadow-sm">
                        <Label className="text-[11px] font-black uppercase text-primary flex items-center gap-2 pl-1">
                          <Search className="h-4 w-4 text-accent" /> Buscador de Planteles Oficiales
                        </Label>
                        <Input 
                          placeholder="Teclear CCT (10 dígitos) o Nombre del Plantel..." 
                          className="h-14 rounded-2xl bg-slate-50 border-primary/10 text-sm font-bold uppercase px-6 shadow-inner focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all" 
                          value={dialogSearchTerm} 
                          onChange={(e) => {
                            setDialogSearchTerm(e.target.value);
                            if (e.target.value.length === 10) handleCctChange(e.target.value);
                          }} 
                        />
                        
                        {dialogSearchTerm && dialogSearchTerm.length > 2 && (
                          <div className="max-h-52 overflow-auto bg-white border border-slate-100 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 divide-y divide-slate-50 mt-2 border-t-4 border-t-primary">
                            {schoolsDirectory.filter(s => 
                              (s.nombre || '').toUpperCase().includes(dialogSearchTerm.toUpperCase()) || 
                              (s.cct || '').toUpperCase().includes(dialogSearchTerm.toUpperCase())
                            ).slice(0, 8).map(s => (
                              <div 
                                key={`${s.cct}-${s.turno}`} 
                                className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center group transition-colors" 
                                onClick={() => { populateWithSchool(s); setDialogSearchTerm(''); }}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                    <School className="h-5 w-5" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-black uppercase text-slate-700">{s.nombre}</span>
                                    <span className="text-[9px] font-mono font-bold text-muted-foreground">{s.cct} • {s.municipio}</span>
                                  </div>
                                </div>
                                <Badge variant="secondary" className="text-[9px] font-black uppercase bg-primary/5 text-primary">{s.turno}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-slate-500 pl-2">Folio de Registro</Label>
                            <Input className="h-12 rounded-xl bg-white border-slate-200 font-mono text-sm font-black uppercase px-5" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-slate-500 pl-2">Oficina de Seguimiento</Label>
                            <Select value={formData.oficinaRegionalAtencion} onValueChange={(val) => setFormData({...formData, oficinaRegionalAtencion: val})}>
                              <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 text-xs font-black uppercase px-5"><SelectValue placeholder="SELECCIONAR OFICINA..." /></SelectTrigger>
                              <SelectContent className="rounded-xl border-slate-200 shadow-2xl">
                                {REGIONAL_OFFICES.map(off => <SelectItem key={off} value={off} className="text-[10px] font-black uppercase py-3">{off.replace("Oficina de ", "")}</SelectItem>)}
                              </SelectContent>
                            </Select>
                         </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 pl-2">Observaciones y Hallazgos Técnicos</Label>
                        <Textarea className="min-h-[120px] rounded-3xl p-6 bg-white border-slate-200 text-sm font-semibold shadow-inner focus:ring-4 focus:ring-primary/5 transition-all" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder="Ingrese los detalles relevantes del seguimiento..." />
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="asistentes" className="h-full m-0 p-8 flex flex-col">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center gap-4 flex-1">
                      <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                        <Info className="h-6 w-6" />
                      </div>
                      <p className="text-[11px] font-black text-blue-900 uppercase leading-relaxed tracking-wide">
                        Censo Institucional: Registre al personal y las cuentas <br /> institucionales asignadas a este centro de trabajo.
                      </p>
                    </div>
                    <Button onClick={() => { setAssistantForm({nombres: '', paterno: '', materno: '', rfc: '', funcion: '', email: ''}); setIsAssistantDialogOpen(true); }} className="h-12 px-6 rounded-xl text-xs gap-2 font-black uppercase shadow-lg hover:scale-105 transition-all">
                      <UserPlus className="h-5 w-5" /> Añadir Personal
                    </Button>
                  </div>
                  <div className="flex-1 overflow-hidden border-2 border-slate-100 rounded-3xl bg-white shadow-2xl">
                    <ScrollArea className="h-full">
                      <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b">
                          <TableRow className="h-12">
                            <TableHead className="text-[10px] font-black uppercase pl-8">Nombre Completo</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-center">RFC Oficial</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-center">Función</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase pr-8">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.asistentes?.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-20 opacity-30 text-xs font-black uppercase text-slate-400">Sin personal registrado.</TableCell></TableRow>
                          ) : formData.asistentes?.map((ast: any, idx: number) => (
                            <TableRow key={idx} className="h-14 hover:bg-slate-50 transition-colors">
                              <TableCell className="pl-8 text-xs font-black uppercase text-slate-700">{ast.nombres} {ast.paterno} {ast.materno}</TableCell>
                              <TableCell className="font-mono text-xs font-black text-primary text-center">{ast.rfc}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200">{ast.funcion}</Badge>
                              </TableCell>
                              <TableCell className="text-right pr-8">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" onClick={() => { setFormData({...formData, asistentes: formData.asistentes?.filter((_, i) => i !== idx)}); }}><Trash2 className="h-4 w-4" /></Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </TabsContent>
             </div>
          </Tabs>
          
          <DialogFooter className="p-8 gap-4 border-t bg-slate-50 flex items-center justify-end shrink-0">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-14 px-10 text-[10px] font-black uppercase border-slate-200 hover:bg-white">Cancelar</Button>
              <Button onClick={handleSave} className="btn-institutional h-14 px-16 text-[10px]">Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssistantDialogOpen} onOpenChange={setIsAssistantDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white">
            <DialogTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3"><UserPlus className="h-6 w-6" /> Registro de Personal</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-5">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1"><Label className="text-[10px] font-black uppercase text-slate-400">Nombres</Label><Input value={assistantForm.nombres} onChange={e => setAssistantForm({...assistantForm, nombres: e.target.value.toUpperCase()})} className="h-11 rounded-xl bg-slate-50 border-none font-bold" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase text-slate-400">Paterno</Label><Input value={assistantForm.paterno} onChange={e => setAssistantForm({...assistantForm, paterno: e.target.value.toUpperCase()})} className="h-11 rounded-xl bg-slate-50 border-none font-bold" /></div>
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase text-slate-400">Materno</Label><Input value={assistantForm.materno} onChange={e => setAssistantForm({...assistantForm, materno: e.target.value.toUpperCase()})} className="h-11 rounded-xl bg-slate-50 border-none font-bold" /></div>
              </div>
              <div className="space-y-1"><Label className="text-[10px] font-black uppercase text-slate-400">RFC (13 Dígitos)</Label><Input value={assistantForm.rfc} onChange={e => setAssistantForm({...assistantForm, rfc: e.target.value.toUpperCase()})} className="h-11 rounded-xl bg-slate-50 border-none font-mono font-black" maxLength={13} /></div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Función Oficial</Label>
                <Select value={assistantForm.funcion} onValueChange={val => setAssistantForm({...assistantForm, funcion: val})}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold uppercase text-[10px]"><SelectValue placeholder="..." /></SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    {['DOCENTE', 'DIRECTOR', 'SUBDIRECTOR', 'ADMINISTRATIVO', 'AUXILIAR'].map(f => <SelectItem key={f} value={f} className="text-[10px] font-black uppercase py-2.5">{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t gap-3">
             <Button variant="ghost" onClick={() => setIsAssistantDialogOpen(false)} className="font-black uppercase text-[10px]">Cancelar</Button>
             <Button onClick={() => { if(assistantForm.nombres && assistantForm.rfc) { setFormData({...formData, asistentes: [...(formData.asistentes || []), assistantForm]}); setIsAssistantDialogOpen(false); } }} className="bg-primary text-white h-11 px-8 rounded-xl font-black uppercase text-[10px] shadow-lg">Añadir a Lista</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VisitSchedulerDialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen} areaId="programas" areaName="Programas" />
    </div>
  )
}
