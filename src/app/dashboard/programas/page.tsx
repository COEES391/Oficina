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
  Info,
  Globe,
  AlertTriangle,
  Settings2,
  Bell
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
  
  // Alerta de Soporte Pendiente
  const [hasPendingRequest, setHasPendingRequest] = useState(false)

  // Custom URL for QR
  const [publicBaseUrl, setPublicBaseUrl] = useState('')
  const [showUrlSettings, setShowUrlSettings] = useState(false)

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

  const checkSupportRequests = useCallback(() => {
    const request = localStorage.getItem('atres_support_request')
    if (request) {
      setHasPendingRequest(true)
    } else {
      setHasPendingRequest(false)
    }
  }, [])

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

    if (typeof window !== 'undefined') {
      const storedUrl = localStorage.getItem('coees_public_url')
      setPublicBaseUrl(storedUrl || window.location.origin)
      
      checkSupportRequests()
      window.addEventListener('storage', checkSupportRequests)
      return () => window.removeEventListener('storage', checkSupportRequests)
    }
  }, [checkSupportRequests])

  const helpDeskUrl = `${publicBaseUrl}/helpdesk`
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(helpDeskUrl)}`

  const handleOpenHelpDesk = () => {
    setIsHelpDeskOpen(true)
    setHasPendingRequest(false)
    localStorage.removeItem('atres_support_request')
  }

  const handleSavePublicUrl = () => {
    localStorage.setItem('coees_public_url', publicBaseUrl)
    toast({ title: "URL Pública Actualizada", description: "El QR ahora apunta a la nueva dirección." })
    setShowUrlSettings(false)
  }

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

  const copyHelpDeskUrl = () => {
    navigator.clipboard.writeText(helpDeskUrl)
    toast({ title: "Link copiado", description: "La URL ha sido copiada al portapapeles." })
  }

  if (!mounted) return null

  return (
    <div className="space-y-4 animate-in fade-in duration-700 w-full max-w-full overflow-x-hidden pr-2">
      {/* Header Institucional Compacto y Adaptativo */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-primary/5 pb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-primary uppercase leading-none">Módulos Técnicos COEES</h2>
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-accent" /> 
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.1em]">Control de Programas y Auditoría 2026</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {activeTab === 'ATRES' && (
            <div className="relative flex-1 sm:flex-none">
              <Button 
                onClick={handleOpenHelpDesk} 
                className={cn(
                  "h-11 px-6 rounded-xl shadow-md font-black uppercase text-[10px] gap-2 w-full transition-all duration-500",
                  hasPendingRequest ? "bg-rose-600 hover:bg-rose-700 ring-4 ring-rose-100 scale-105" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                )}
              >
                <Headset className={cn("h-4 w-4", hasPendingRequest && "animate-bounce")} /> 
                {hasPendingRequest ? "ATENDER SOLICITUD" : "Mesa de Ayuda ATRES"}
              </Button>
              {hasPendingRequest && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white"></span>
                </span>
              )}
            </div>
          )}
          <Button 
            onClick={() => { setFormData({...initialFormState, name: activeTab}); setEditingId(null); setIsDialogOpen(true); setDialogSearchTerm(''); }} 
            className="btn-institutional h-11 px-8 rounded-xl shadow-md text-[10px] flex-1 sm:flex-none"
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Nuevo Registro
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSearchTerm(''); }} className="space-y-4">
        <div className="w-full">
          <TabsList className="w-full justify-start h-11 bg-white/60 backdrop-blur-md border border-slate-200 p-1 rounded-xl shadow-sm gap-1 overflow-x-auto no-scrollbar">
            {PROGRAM_RUBROS.map(rubro => (
              <TabsTrigger 
                key={rubro} 
                value={rubro} 
                className="h-full px-5 text-[10px] font-black uppercase rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap"
              >
                {rubro}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {activeTab === 'ATRES' && (
          <div className="animate-in slide-in-from-top-3 duration-500">
            <Card className="executive-card p-5 bg-white border border-primary/5 shadow-xl max-w-5xl">
              <div className="flex flex-col md:flex-row items-center gap-8">
                 <div className="bg-slate-50 p-4 rounded-3xl shadow-lg border-4 border-white shrink-0">
                    <div className="relative h-24 w-24 flex items-center justify-center bg-white rounded-xl overflow-hidden shadow-inner">
                      {helpDeskUrl ? (
                        <Image src={qrCodeApiUrl} alt="Acceso Docentes QR" width={96} height={96} className="object-contain" priority />
                      ) : (
                        <Circle className="h-8 w-8 text-slate-200 animate-pulse" />
                      )}
                    </div>
                 </div>
                 
                 <div className="flex-1 space-y-4 w-full min-w-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-emerald-600 text-white font-black uppercase text-[9px] px-3 py-1 rounded-full shadow-sm">ACCESO DIRECTO</Badge>
                        {publicBaseUrl.includes('cloudworkstations') && (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full text-rose-600">
                            <AlertTriangle className="h-3 w-3 animate-pulse" />
                            <span className="text-[8px] font-black uppercase">Modo Desarrollador (Privado)</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Vínculo de Asistencia para Docentes</h3>
                      <p className="text-[11px] font-semibold text-slate-500 leading-tight">
                        Comparta este link o código QR para soporte técnico remoto inmediato.
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
                      <div className="flex-1 h-11 bg-slate-50 rounded-xl border border-slate-200 flex items-center px-4 gap-3 shadow-inner overflow-hidden w-full">
                         <Globe className="h-4 w-4 text-primary shrink-0" />
                         <span className="font-mono text-[10px] font-black text-slate-600 flex-1 truncate">
                           {helpDeskUrl}
                         </span>
                         <Button variant="ghost" size="sm" onClick={copyHelpDeskUrl} className="h-8 px-3 rounded-lg text-primary hover:bg-primary/5 gap-2 shrink-0">
                            <Copy className="h-3.5 w-3.5" /> <span className="text-[9px] font-black uppercase">Copiar</span>
                         </Button>
                      </div>
                      <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                        <Button onClick={() => window.open('/helpdesk', '_blank')} className="h-11 px-6 rounded-xl bg-primary text-white font-black text-[10px] gap-2 shadow-lg flex-1 sm:flex-none hover:scale-105 transition-transform">
                           PROBAR PORTAL <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setShowUrlSettings(!showUrlSettings)} className="h-11 w-11 rounded-xl border-slate-200 hover:bg-slate-50 transition-colors">
                           <Settings2 className={cn("h-5 w-5 text-slate-400 transition-transform duration-500", showUrlSettings && "rotate-90 text-primary")} />
                        </Button>
                      </div>
                    </div>

                    {showUrlSettings && (
                      <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 animate-in slide-in-from-top-2 duration-300">
                         <Label className="text-[9px] font-black uppercase text-slate-500 mb-2 block pl-1">Configuración de URL Pública (Para que el QR funcione fuera de este entorno)</Label>
                         <div className="flex gap-3">
                            <Input 
                              value={publicBaseUrl} 
                              onChange={e => setPublicBaseUrl(e.target.value)} 
                              placeholder="https://su-dominio-público.com"
                              className="bg-white font-mono text-xs h-10 rounded-lg shadow-sm"
                            />
                            <Button onClick={handleSavePublicUrl} className="bg-primary text-white font-black uppercase text-[10px] h-10 px-6 rounded-lg shadow-md">Guardar URL</Button>
                         </div>
                      </div>
                    )}
                 </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filtros Operativos Compactos */}
        <Card className="executive-card p-4 bg-white/80 border-none shadow-lg">
          <div className="flex flex-col md:flex-row items-end gap-4">
             <div className="relative flex-1 w-full min-w-0">
                <Label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 ml-1 block">Localizador Operativo</Label>
                <div className="relative">
                  <Input 
                    placeholder="BUSCAR CCT O PLANTEL..." 
                    className="h-11 rounded-xl bg-slate-50 border-primary/5 pl-10 text-xs font-black uppercase shadow-inner w-full focus:bg-white transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                </div>
             </div>

             <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                <div className="space-y-1.5 min-w-[220px]">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 block">Oficina Regional</Label>
                  <Select value={officeFilter} onValueChange={setOfficeFilter}>
                    <SelectTrigger className="h-11 w-full rounded-xl border-primary/5 bg-white text-[10px] font-black uppercase shadow-sm">
                        <SelectValue placeholder="TODAS LAS OFICINAS" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="all" className="text-[10px] font-black uppercase">Todas las Oficinas</SelectItem>
                      {REGIONAL_OFFICES.map(off => (
                        <SelectItem key={off} value={off} className="text-[10px] font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" className="h-11 px-5 border-primary/20 text-primary font-black uppercase text-[10px] gap-2 rounded-xl hover:bg-primary/5 shadow-sm mt-auto transition-all active:scale-95" onClick={() => setIsSchedulerOpen(true)}>
                  <CalendarDays className="h-4 w-4" /> Agenda
                </Button>
             </div>
          </div>
        </Card>

        <TabsContent value={activeTab} className="space-y-4 outline-none">
          <Card className="executive-card p-0 shadow-2xl border-none overflow-hidden bg-white">
            <div className="overflow-x-auto w-full">
              <Table className="w-full">
                <TableHeader className="bg-slate-50 border-b">
                   <TableRow className="h-12">
                      <TableHead className="w-12 text-[9px] font-black uppercase text-center pl-4 text-slate-400">#</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-primary tracking-widest min-w-[100px]">{activeTab === 'ATRES' ? 'Folio' : 'CCT'}</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-primary tracking-widest min-w-[200px]">Identificación del Plantel</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-primary tracking-widest min-w-[120px]">Estatus / Dato</TableHead>
                      {(activeTab === 'Biblioteca Digital' || activeTab === 'ATRES' || activeTab === 'Cuentas Institucionales') && (
                        <TableHead className="text-[10px] font-black uppercase text-center text-primary tracking-widest w-24">Censo</TableHead>
                      )}
                      <TableHead className="text-right text-[9px] font-black uppercase pr-10 text-slate-400">Acción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length > 0 ? filteredRecords.map((rec, idx) => (
                    <TableRow key={rec.id} className="hover:bg-primary/[0.01] transition-all border-b border-slate-50 h-16 group">
                      <TableCell className="text-center font-black text-xs text-slate-300 pl-4">{idx + 1}</TableCell>
                      <TableCell className="font-black text-[11px] text-primary tracking-tight">{activeTab === 'ATRES' ? rec.id : rec.cct}</TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col min-w-0 max-w-[300px]">
                          <span className="text-[11px] font-black text-slate-700 uppercase leading-tight truncate">
                            {activeTab === 'Geoposición' ? `Longitud: ${rec.longitud}` : rec.schoolName}
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-70 truncate mt-1">
                            {rec.municipio} • {rec.valle}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {activeTab === 'Geoposición' ? <span className="text-[10px] font-mono font-black text-slate-500">Lat: {rec.latitud}</span> : 
                         activeTab === 'ATRES' ? <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/10 bg-primary/5 text-primary py-0.5 px-3 rounded-full">{rec.tipoIncidencia || 'Soporte'}</Badge> :
                         <Badge variant="outline" className={cn("text-[9px] font-black uppercase py-0.5 px-3 rounded-full", (rec.status === 'activo' || rec.status === 'pendiente') ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-emerald-200 text-emerald-700 bg-emerald-50')}>
                           {rec.status?.toUpperCase() || 'ACTIVO'}
                         </Badge>}
                      </TableCell>
                      {(activeTab === 'Biblioteca Digital' || activeTab === 'ATRES' || activeTab === 'Cuentas Institucionales') && (
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center h-7 w-12 rounded-lg bg-primary/5 text-primary text-[12px] font-black border border-primary/10">
                            {rec.asistentes?.length || 0}
                          </span>
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
                      <TableCell colSpan={8} className="text-center py-28 bg-slate-50/20">
                         <div className="flex flex-col items-center gap-4 opacity-30">
                            <Monitor className="h-16 w-16 text-slate-400" />
                            <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-500">Sin registros operativos disponibles</p>
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

      {/* Modals */}
      <HelpDeskDialog open={isHelpDeskOpen} onOpenChange={setIsHelpDeskOpen} />
      <VisitSchedulerDialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen} areaId="programas" areaName="Programas" />

      {/* Dialogo de Gestión Adaptativo */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[850px] rounded-[2.5rem] h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white flex flex-row items-center justify-between shrink-0">
            <div className="space-y-1">
              <DialogTitle className="uppercase font-black text-white text-2xl flex items-center gap-4">
                <Target className="h-8 w-8 text-white/40" /> Gestión de {activeTab}
              </DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Auditoría y Seguimiento Operativo COEES 2026</DialogDescription>
            </div>
          </DialogHeader>

          <Tabs defaultValue="auditoria" className="flex-1 flex flex-col overflow-hidden">
             <div className="px-8 border-b bg-white">
                <TabsList className="bg-transparent h-14 p-0 gap-10">
                  <TabsTrigger value="auditoria" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-xs font-black uppercase tracking-wider transition-all">1. Auditoría Técnica</TabsTrigger>
                  {(activeTab === 'Biblioteca Digital' || activeTab === 'Cuentas Institucionales' || activeTab === 'ATRES') && (
                    <TabsTrigger value="asistentes" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-xs font-black uppercase tracking-wider transition-all">2. Censo Institucional</TabsTrigger>
                  )}
                </TabsList>
             </div>

             <div className="flex-1 overflow-hidden">
                <TabsContent value="auditoria" className="h-full m-0 p-8 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-8 pb-10">
                      <div className="p-8 bg-slate-50 rounded-[2rem] border-2 border-primary/5 space-y-6 shadow-inner relative">
                        <Label className="text-xs font-black uppercase text-primary flex items-center gap-3 pl-1 tracking-widest">
                          <Search className="h-5 w-5 text-accent" /> Localizador Institucional CCT
                        </Label>
                        <Input 
                          placeholder="TECLEAR CCT O NOMBRE DEL PLANTEL..." 
                          className="h-14 rounded-2xl bg-white border-primary/10 text-sm font-black uppercase px-8 shadow-sm focus:ring-4 focus:ring-primary/10" 
                          value={dialogSearchTerm} 
                          onChange={(e) => {
                            setDialogSearchTerm(e.target.value);
                            if (e.target.value.length === 10) handleCctChange(e.target.value);
                          }} 
                        />
                        
                        {dialogSearchTerm && dialogSearchTerm.length > 2 && (
                          <div className="absolute left-8 right-8 top-28 max-h-60 overflow-auto bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 divide-y">
                            {schoolsDirectory.filter(s => 
                              (s.nombre || '').toUpperCase().includes(dialogSearchTerm.toUpperCase()) || 
                              (s.cct || '').toUpperCase().includes(dialogSearchTerm.toUpperCase())
                            ).slice(0, 10).map(s => (
                              <div key={`${s.cct}-${s.turno}`} className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center transition-colors group" onClick={() => { populateWithSchool(s); setDialogSearchTerm(''); }}>
                                <div className="flex flex-col">
                                  <span className="text-[12px] font-black uppercase text-slate-800 group-hover:text-primary">{s.nombre}</span>
                                  <span className="text-[10px] font-mono text-muted-foreground">{s.cct} • {s.municipio} • {s.turno}</span>
                                </div>
                                <Badge variant="secondary" className="text-[10px] font-black uppercase bg-primary/10 text-primary">{s.modalidad}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {formData.cct && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4">
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-slate-400 pl-1 tracking-widest">Folio de Control Operativo</Label>
                              <Input className="h-12 rounded-xl bg-white border-slate-200 font-mono text-sm font-black uppercase shadow-sm" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-slate-400 pl-1 tracking-widest">Oficina Regional Responsable</Label>
                              <Select value={formData.oficinaRegionalAtencion} onValueChange={(val) => setFormData({...formData, oficinaRegionalAtencion: val})}>
                                <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 text-xs font-black uppercase shadow-sm"><SelectValue placeholder="SELECCIONAR OFICINA..." /></SelectTrigger>
                                <SelectContent>
                                  {REGIONAL_OFFICES.map(off => <SelectItem key={off} value={off} className="text-xs font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>)}
                                </SelectContent>
                              </Select>
                           </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase text-slate-400 pl-1 tracking-widest flex items-center gap-2">
                           <Info className="h-4 w-4 text-primary" /> Diagnóstico Técnico y Observaciones de Auditoría
                        </Label>
                        <Textarea className="min-h-[160px] rounded-[2rem] p-6 bg-slate-50 border-2 border-slate-200 text-sm font-semibold shadow-inner focus:bg-white transition-all" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder="Detalle nítidamente los hallazgos técnicos, estado de los equipos y acuerdos logrados en el plantel..." />
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="asistentes" className="h-full m-0 p-8 flex flex-col">
                  <div className="flex justify-between items-center gap-6 mb-6">
                    <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center gap-4 flex-1">
                      <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                        <Info className="h-6 w-6" />
                      </div>
                      <p className="text-[11px] font-black text-blue-900 uppercase leading-relaxed tracking-wide">
                        Censo Institucional: Registre al personal y las cuentas <br /> institucionales asignadas a este centro de trabajo.
                      </p>
                    </div>
                    <Button onClick={() => { setAssistantForm({nombres: '', paterno: '', materno: '', rfc: '', funcion: '', email: ''}); setIsAssistantDialogOpen(true); }} className="h-12 px-8 rounded-xl text-xs gap-3 font-black uppercase shadow-lg bg-primary text-white hover:scale-105 transition-all">
                      <UserPlus className="h-5 w-5" /> Registrar Servidor
                    </Button>
                  </div>
                  <div className="flex-1 overflow-hidden border-2 border-slate-100 rounded-[2rem] bg-white shadow-inner">
                    <ScrollArea className="h-full">
                      <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b">
                          <TableRow className="h-14">
                            <TableHead className="text-xs font-black uppercase pl-10">Servidor Público Censado</TableHead>
                            <TableHead className="text-xs font-black uppercase text-center">RFC Oficial</TableHead>
                            <TableHead className="text-xs font-black uppercase text-center">Función</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase pr-10">Acción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.asistentes?.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-24 text-sm font-black uppercase text-slate-300">Sin personal censado en este plantel.</TableCell></TableRow>
                          ) : formData.asistentes?.map((ast: any, idx: number) => (
                            <TableRow key={idx} className="h-16 hover:bg-slate-50/50 transition-colors">
                              <TableCell className="pl-10">
                                 <div className="flex flex-col">
                                   <span className="text-sm font-black uppercase text-slate-700">{ast.nombres} {ast.paterno} {ast.materno}</span>
                                   <span className="text-[10px] font-bold text-slate-400">{ast.email || 'SIN EMAIL'}</span>
                                 </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm font-black text-primary text-center tracking-tighter">{ast.rfc}</TableCell>
                              <TableCell className="text-center">
                                 <Badge variant="secondary" className="text-[9px] font-black uppercase bg-slate-100 text-slate-500">{ast.funcion}</Badge>
                              </TableCell>
                              <TableCell className="text-right pr-10">
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => { setFormData({...formData, asistentes: formData.asistentes?.filter((_, i) => i !== idx)}); }}><Trash2 className="h-5 w-5" /></Button>
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
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-12 px-8 text-xs font-black uppercase border-slate-300 hover:bg-white shadow-sm">Cancelar</Button>
              <Button onClick={handleSave} className="btn-institutional h-12 px-14 text-xs">Guardar Cambios Operativos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssistantDialogOpen} onOpenChange={setIsAssistantDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-[#9f2241] text-white">
            <DialogTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-4"><UserPlus className="h-6 w-6 text-white/40" /> Alta de Servidor Público</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-5 bg-white">
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre(s)</Label><Input value={assistantForm.nombres} onChange={e => setAssistantForm({...assistantForm, nombres: e.target.value.toUpperCase()})} className="h-11 rounded-xl bg-slate-50 text-sm font-black shadow-inner" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Apellido Paterno</Label><Input value={assistantForm.paterno} onChange={e => setAssistantForm({...assistantForm, paterno: e.target.value.toUpperCase()})} className="h-11 rounded-xl bg-slate-50 text-sm font-black shadow-inner" /></div>
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Apellido Materno</Label><Input value={assistantForm.materno} onChange={e => setAssistantForm({...assistantForm, materno: e.target.value.toUpperCase()})} className="h-11 rounded-xl bg-slate-50 text-sm font-black shadow-inner" /></div>
            </div>
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">RFC Oficial (13 Dígitos)</Label><Input value={assistantForm.rfc} onChange={e => setAssistantForm({...assistantForm, rfc: e.target.value.toUpperCase()})} className="h-11 rounded-xl bg-slate-50 font-mono font-black text-sm shadow-inner" maxLength={13} /></div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Función Institucional</Label>
              <Select value={assistantForm.funcion} onValueChange={val => setAssistantForm({...assistantForm, funcion: val})}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 font-black uppercase text-xs shadow-sm"><SelectValue placeholder="SELECCIONAR..." /></SelectTrigger>
                <SelectContent>
                  {['DOCENTE', 'DIRECTOR', 'SUBDIRECTOR', 'ADMINISTRATIVO', 'A.T.P.'].map(f => <SelectItem key={f} value={f} className="text-xs font-black uppercase">{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t gap-4">
             <Button variant="ghost" onClick={() => setIsAssistantDialogOpen(false)} className="font-black uppercase text-[10px] h-11 px-6 shadow-sm">Cancelar</Button>
             <Button onClick={() => { if(assistantForm.nombres && assistantForm.rfc) { setFormData({...formData, asistentes: [...(formData.asistentes || []), assistantForm]}); setIsAssistantDialogOpen(false); } }} className="bg-primary text-white h-11 px-8 rounded-xl font-black uppercase text-[10px] shadow-lg hover:scale-105 transition-all">Añadir al Censo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
