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
  Info,
  Globe,
  AlertTriangle,
  Settings2
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
    }
  }, [])

  const helpDeskUrl = `${publicBaseUrl}/helpdesk`
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(helpDeskUrl)}`

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
    <div className="space-y-4 animate-in fade-in duration-700 w-full max-w-full overflow-x-hidden">
      {/* Header Institucional Compacto */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-primary/5 pb-4">
        <div className="space-y-0.5">
          <h2 className="text-xl font-black tracking-tight text-primary uppercase leading-tight">Módulos Técnicos COEES</h2>
          <div className="flex items-center gap-2">
            <Activity className="h-3 w-3 text-accent" /> 
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.1em]">Control de Programas y Auditoría 2026</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {activeTab === 'ATRES' && (
            <Button 
              onClick={() => setIsHelpDeskOpen(true)} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-5 rounded-xl shadow-md font-black uppercase text-[9px] gap-2 flex-1 sm:flex-none"
            >
              <Headset className="h-4 w-4" /> Mesa de Ayuda ATRES
            </Button>
          )}
          <Button 
            onClick={() => { setFormData({...initialFormState, name: activeTab}); setEditingId(null); setIsDialogOpen(true); setDialogSearchTerm(''); }} 
            className="btn-institutional h-10 px-6 rounded-xl shadow-md text-[9px] flex-1 sm:flex-none"
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Nuevo Registro
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSearchTerm(''); }} className="space-y-4">
        <div className="w-full">
          <TabsList className="w-full justify-start h-10 bg-white/60 backdrop-blur-md border border-slate-200 p-1 rounded-xl shadow-sm gap-1 overflow-x-auto no-scrollbar">
            {PROGRAM_RUBROS.map(rubro => (
              <TabsTrigger 
                key={rubro} 
                value={rubro} 
                className="h-full px-4 text-[9px] font-black uppercase rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap"
              >
                {rubro}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {activeTab === 'ATRES' && (
          <div className="animate-in slide-in-from-top-3 duration-500">
            <Card className="executive-card p-4 bg-white border border-primary/5 shadow-lg">
              <div className="flex flex-col md:flex-row items-center gap-6">
                 <div className="bg-slate-50 p-3 rounded-2xl shadow-md border-2 border-white shrink-0">
                    <div className="relative h-20 w-20 flex items-center justify-center bg-white rounded-lg overflow-hidden shadow-inner">
                      {helpDeskUrl ? (
                        <Image src={qrCodeApiUrl} alt="Acceso Docentes QR" width={80} height={80} className="object-contain" priority />
                      ) : (
                        <Circle className="h-6 w-6 text-slate-200 animate-pulse" />
                      )}
                    </div>
                 </div>
                 
                 <div className="flex-1 space-y-3 w-full min-w-0">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-600 text-white font-black uppercase text-[8px] px-2 py-0.5 rounded-full">ACCESO DIRECTO</Badge>
                        {publicBaseUrl.includes('cloudworkstations') && (
                          <Badge variant="destructive" className="animate-pulse flex gap-1 font-black text-[8px] py-0.5 rounded-full">
                            <AlertTriangle className="h-2 w-2" /> ENTORNO PRIVADO
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-base font-black text-slate-900 uppercase">Vínculo de Asistencia para Docentes</h3>
                      <p className="text-[10px] font-semibold text-slate-500 leading-tight">
                        Comparta este link o código QR para soporte técnico remoto inmediato.
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 items-center w-full">
                      <div className="flex-1 h-9 bg-slate-50 rounded-lg border border-slate-100 flex items-center px-3 gap-2 shadow-inner overflow-hidden w-full">
                         <Globe className="h-3 w-3 text-primary shrink-0" />
                         <span className="font-mono text-[9px] font-black text-slate-500 flex-1 truncate">
                           {helpDeskUrl}
                         </span>
                         <Button variant="ghost" size="sm" onClick={copyHelpDeskUrl} className="h-7 px-2 rounded-md text-primary hover:bg-primary/5 gap-1.5 shrink-0">
                            <Copy className="h-3 w-3" /> <span className="text-[8px] font-black uppercase">Copiar</span>
                         </Button>
                      </div>
                      <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                        <Button onClick={() => window.open('/helpdesk', '_blank')} className="h-9 px-4 rounded-lg bg-primary text-white font-black text-[9px] gap-2 shadow-md flex-1 sm:flex-none">
                           PROBAR PORTAL <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setShowUrlSettings(!showUrlSettings)} className="h-9 w-9 rounded-lg border-slate-200">
                           <Settings2 className={cn("h-4 w-4 text-slate-400 transition-transform", showUrlSettings && "rotate-90")} />
                        </Button>
                      </div>
                    </div>

                    {showUrlSettings && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 animate-in slide-in-from-top-2 duration-300">
                         <Label className="text-[8px] font-black uppercase text-slate-500 mb-1.5 block">Configuración de URL Pública</Label>
                         <div className="flex gap-2">
                            <Input 
                              value={publicBaseUrl} 
                              onChange={e => setPublicBaseUrl(e.target.value)} 
                              placeholder="https://su-dominio-publico.com"
                              className="bg-white font-mono text-[10px] h-8"
                            />
                            <Button onClick={handleSavePublicUrl} className="bg-primary text-white font-black uppercase text-[8px] h-8 px-4 rounded-lg">Guardar</Button>
                         </div>
                      </div>
                    )}
                 </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filtros Operativos Compactos */}
        <Card className="executive-card p-3 bg-white/80 border-none shadow-md">
          <div className="flex flex-col md:flex-row items-end gap-3">
             <div className="relative flex-1 w-full min-w-0">
                <Label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Localizador Operativo</Label>
                <div className="relative">
                  <Input 
                    placeholder="BUSCAR CCT O PLANTEL..." 
                    className="h-10 rounded-lg bg-slate-50 border-primary/5 pl-9 text-[10px] font-black uppercase shadow-inner w-full focus:bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                </div>
             </div>

             <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <div className="space-y-1 min-w-[180px]">
                  <Label className="text-[9px] font-black uppercase text-slate-400 ml-1 block">Oficina Regional</Label>
                  <Select value={officeFilter} onValueChange={setOfficeFilter}>
                    <SelectTrigger className="h-10 w-full rounded-lg border-primary/5 bg-white text-[9px] font-black uppercase">
                        <SelectValue placeholder="TODAS" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="all" className="text-[9px] font-black uppercase">Todas las Oficinas</SelectItem>
                      {REGIONAL_OFFICES.map(off => (
                        <SelectItem key={off} value={off} className="text-[9px] font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" className="h-10 px-4 border-primary/20 text-primary font-black uppercase text-[9px] gap-2 rounded-lg hover:bg-primary/5 shadow-sm mt-auto" onClick={() => setIsSchedulerOpen(true)}>
                  <CalendarDays className="h-3.5 w-3.5" /> Agenda
                </Button>
             </div>
          </div>
        </Card>

        <TabsContent value={activeTab} className="space-y-4 outline-none">
          <Card className="executive-card p-0 shadow-lg border-none overflow-hidden bg-white">
            <div className="overflow-x-auto w-full">
              <Table className="w-full">
                <TableHeader className="bg-slate-50 border-b">
                   <TableRow className="h-11">
                      <TableHead className="w-10 text-[8px] font-black uppercase text-center pl-4">#</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-primary tracking-widest min-w-[90px]">{activeTab === 'ATRES' ? 'Folio' : 'CCT'}</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-primary tracking-widest min-w-[140px]">Identificación</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-primary tracking-widest min-w-[90px]">Estatus / Dato</TableHead>
                      {(activeTab === 'Biblioteca Digital' || activeTab === 'ATRES' || activeTab === 'Cuentas Institucionales') && (
                        <TableHead className="text-[9px] font-black uppercase text-center text-primary tracking-widest w-16">Censo</TableHead>
                      )}
                      <TableHead className="text-right text-[8px] font-black uppercase pr-6">Acción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length > 0 ? filteredRecords.map((rec, idx) => (
                    <TableRow key={rec.id} className="hover:bg-primary/[0.01] transition-all border-b border-slate-50 h-14 group">
                      <TableCell className="text-center font-black text-[9px] text-slate-300 pl-4">{idx + 1}</TableCell>
                      <TableCell className="font-black text-[10px] text-primary">{activeTab === 'ATRES' ? rec.id : rec.cct}</TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-col min-w-0 max-w-[200px]">
                          <span className="text-[10px] font-black text-slate-700 uppercase leading-tight truncate">
                            {activeTab === 'Geoposición' ? `Lon: ${rec.longitud}` : rec.schoolName}
                          </span>
                          <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-70 truncate">
                            {rec.municipio} • {rec.valle}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {activeTab === 'Geoposición' ? <span className="text-[9px] font-mono font-black text-slate-500">Lat: {rec.latitud}</span> : 
                         activeTab === 'ATRES' ? <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/10 bg-primary/5 text-primary py-0 px-2 rounded-full">{rec.tipoIncidencia || 'Soporte'}</Badge> :
                         <Badge variant="outline" className={cn("text-[8px] font-black uppercase py-0 px-2 rounded-full", rec.status === 'activo' || rec.status === 'pendiente' ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-emerald-200 text-emerald-700 bg-emerald-50')}>
                           {rec.status?.toUpperCase() || 'ACTIVO'}
                         </Badge>}
                      </TableCell>
                      {(activeTab === 'Biblioteca Digital' || activeTab === 'ATRES' || activeTab === 'Cuentas Institucionales') && (
                        <TableCell className="text-center">
                          <span className="text-[11px] font-black text-accent">{rec.asistentes?.length || 0}</span>
                        </TableCell>
                      )}
                      <TableCell className="text-right pr-6">
                         <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(rec)} className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg"><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteRecord(rec.id)} className="h-8 w-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-20 opacity-20">
                         <div className="flex flex-col items-center gap-2">
                            <Monitor className="h-10 w-10 text-slate-400" />
                            <p className="text-[9px] font-black uppercase tracking-[0.2em]">Sin registros operativos</p>
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

      {/* Dialogo de Gestión Compacto */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[2rem] h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white flex flex-row items-center justify-between shrink-0">
            <div className="space-y-0.5">
              <DialogTitle className="uppercase font-black text-white text-xl flex items-center gap-3">
                <Target className="h-6 w-6 text-white/40" /> Gestión de {activeTab}
              </DialogTitle>
              <DialogDescription className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/60">Auditoría y Seguimiento Operativo</DialogDescription>
            </div>
          </DialogHeader>

          <Tabs defaultValue="auditoria" className="flex-1 flex flex-col overflow-hidden">
             <div className="px-6 border-b bg-white">
                <TabsList className="bg-transparent h-12 p-0 gap-6">
                  <TabsTrigger value="auditoria" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-3 text-[10px] font-black uppercase tracking-wider">1. Auditoría Técnica</TabsTrigger>
                  {(activeTab === 'Biblioteca Digital' || activeTab === 'Cuentas Institucionales' || activeTab === 'ATRES') && (
                    <TabsTrigger value="asistentes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-3 text-[10px] font-black uppercase tracking-wider">2. Censo Institucional</TabsTrigger>
                  )}
                </TabsList>
             </div>

             <div className="flex-1 overflow-hidden">
                <TabsContent value="auditoria" className="h-full m-0 p-6 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-6">
                      <div className="p-6 bg-slate-50 rounded-2xl border border-primary/5 space-y-4 shadow-inner relative">
                        <Label className="text-[10px] font-black uppercase text-primary flex items-center gap-2 pl-1">
                          <Search className="h-4 w-4 text-accent" /> Localizador Institucional CCT
                        </Label>
                        <Input 
                          placeholder="TECLEAR CCT O NOMBRE..." 
                          className="h-11 rounded-xl bg-white border-primary/10 text-xs font-black uppercase px-6" 
                          value={dialogSearchTerm} 
                          onChange={(e) => {
                            setDialogSearchTerm(e.target.value);
                            if (e.target.value.length === 10) handleCctChange(e.target.value);
                          }} 
                        />
                        
                        {dialogSearchTerm && dialogSearchTerm.length > 2 && (
                          <div className="absolute left-6 right-6 top-24 max-h-48 overflow-auto bg-white border border-slate-100 rounded-xl shadow-2xl z-50 divide-y">
                            {schoolsDirectory.filter(s => 
                              (s.nombre || '').toUpperCase().includes(dialogSearchTerm.toUpperCase()) || 
                              (s.cct || '').toUpperCase().includes(dialogSearchTerm.toUpperCase())
                            ).slice(0, 8).map(s => (
                              <div key={`${s.cct}-${s.turno}`} className="p-3 hover:bg-primary/5 cursor-pointer flex justify-between items-center" onClick={() => { populateWithSchool(s); setDialogSearchTerm(''); }}>
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-black uppercase text-slate-800">{s.nombre}</span>
                                  <span className="text-[9px] font-mono text-muted-foreground">{s.cct} • {s.municipio}</span>
                                </div>
                                <Badge variant="secondary" className="text-[8px] font-black uppercase bg-primary/10 text-primary">{s.modalidad}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {formData.cct && (
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-1.5">
                              <Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Folio de Control</Label>
                              <Input className="h-10 rounded-lg bg-white border-slate-200 font-mono text-xs font-black uppercase" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} />
                           </div>
                           <div className="space-y-1.5">
                              <Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Oficina Regional</Label>
                              <Select value={formData.oficinaRegionalAtencion} onValueChange={(val) => setFormData({...formData, oficinaRegionalAtencion: val})}>
                                <SelectTrigger className="h-10 rounded-lg bg-white border-slate-200 text-[9px] font-black uppercase"><SelectValue placeholder="SELECCIONAR..." /></SelectTrigger>
                                <SelectContent>
                                  {REGIONAL_OFFICES.map(off => <SelectItem key={off} value={off} className="text-[10px] font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>)}
                                </SelectContent>
                              </Select>
                           </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Diagnóstico Técnico y Observaciones</Label>
                        <Textarea className="min-h-[120px] rounded-2xl p-4 bg-slate-50 border border-slate-200 text-xs font-semibold" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder="Detalle los hallazgos técnicos..." />
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="asistentes" className="h-full m-0 p-6 flex flex-col">
                  <div className="flex justify-between items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3 flex-1">
                      <Info className="h-4 w-4 text-blue-600" />
                      <p className="text-[9px] font-black text-blue-900 uppercase">Censo Institucional: Registre al personal asignado.</p>
                    </div>
                    <Button onClick={() => { setAssistantForm({nombres: '', paterno: '', materno: '', rfc: '', funcion: '', email: ''}); setIsAssistantDialogOpen(true); }} className="h-9 px-5 rounded-lg text-[9px] gap-2 font-black uppercase shadow-md bg-primary text-white">
                      <UserPlus className="h-4 w-4" /> Registrar
                    </Button>
                  </div>
                  <div className="flex-1 overflow-hidden border border-slate-100 rounded-xl bg-white shadow-inner">
                    <ScrollArea className="h-full">
                      <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b">
                          <TableRow className="h-10">
                            <TableHead className="text-[9px] font-black uppercase pl-6">Servidor Público</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-center">RFC</TableHead>
                            <TableHead className="text-right text-[8px] font-black uppercase pr-6">Acción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.asistentes?.length === 0 ? (
                            <TableRow><TableCell colSpan={3} className="text-center py-20 text-[10px] font-black uppercase text-slate-300">Sin personal censado.</TableCell></TableRow>
                          ) : formData.asistentes?.map((ast: any, idx: number) => (
                            <TableRow key={idx} className="h-12 hover:bg-slate-50/50">
                              <TableCell className="pl-6 text-[10px] font-black uppercase text-slate-700">{ast.nombres} {ast.paterno}</TableCell>
                              <TableCell className="font-mono text-[10px] font-black text-primary text-center">{ast.rfc}</TableCell>
                              <TableCell className="text-right pr-6">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-300 hover:text-rose-600" onClick={() => { setFormData({...formData, asistentes: formData.asistentes?.filter((_, i) => i !== idx)}); }}><Trash2 className="h-3.5 w-3.5" /></Button>
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
          
          <DialogFooter className="p-6 gap-3 border-t bg-slate-50 flex items-center justify-end shrink-0">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-11 px-6 text-[9px] font-black uppercase border-slate-300 hover:bg-white">Cancelar</Button>
              <Button onClick={handleSave} className="btn-institutional h-11 px-10 text-[9px]">Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssistantDialogOpen} onOpenChange={setIsAssistantDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[1.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-[#9f2241] text-white">
            <DialogTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-3"><UserPlus className="h-4 w-4 text-white/40" /> Alta de Servidor</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400">Nombres</Label><Input value={assistantForm.nombres} onChange={e => setAssistantForm({...assistantForm, nombres: e.target.value.toUpperCase()})} className="h-9 rounded-lg bg-slate-50 text-[11px] font-black" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400">Paterno</Label><Input value={assistantForm.paterno} onChange={e => setAssistantForm({...assistantForm, paterno: e.target.value.toUpperCase()})} className="h-9 rounded-lg bg-slate-50 text-[11px] font-black" /></div>
              <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400">Materno</Label><Input value={assistantForm.materno} onChange={e => setAssistantForm({...assistantForm, materno: e.target.value.toUpperCase()})} className="h-9 rounded-lg bg-slate-50 text-[11px] font-black" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400">RFC Oficial</Label><Input value={assistantForm.rfc} onChange={e => setAssistantForm({...assistantForm, rfc: e.target.value.toUpperCase()})} className="h-9 rounded-lg bg-slate-50 font-mono font-black text-[11px]" maxLength={13} /></div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400">Función</Label>
              <Select value={assistantForm.funcion} onValueChange={val => setAssistantForm({...assistantForm, funcion: val})}>
                <SelectTrigger className="h-9 rounded-lg bg-slate-50 font-black uppercase text-[9px]"><SelectValue placeholder="SELECCIONAR..." /></SelectTrigger>
                <SelectContent>
                  {['DOCENTE', 'DIRECTOR', 'SUBDIRECTOR', 'ADMINISTRATIVO'].map(f => <SelectItem key={f} value={f} className="text-[10px] font-black uppercase">{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t gap-3">
             <Button variant="ghost" onClick={() => setIsAssistantDialogOpen(false)} className="font-black uppercase text-[9px] h-9 px-4">Cancelar</Button>
             <Button onClick={() => { if(assistantForm.nombres && assistantForm.rfc) { setFormData({...formData, asistentes: [...(formData.asistentes || []), assistantForm]}); setIsAssistantDialogOpen(false); } }} className="bg-primary text-white h-9 px-6 rounded-lg font-black uppercase text-[9px]">Añadir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
