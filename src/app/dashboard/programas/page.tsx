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
    <div className="space-y-6 animate-in fade-in duration-700 w-full max-w-full overflow-x-hidden">
      {/* Header Institucional - Ajustado para evitar desbordamiento */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-primary uppercase leading-tight">Módulos Técnicos COEES</h2>
          <div className="flex items-center gap-2 bg-white/80 px-4 py-1.5 rounded-full border border-primary/10 shadow-sm inline-flex">
            <Activity className="h-4 w-4 text-accent" /> 
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.1em]">Control de Programas y Auditoría 2026</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          {activeTab === 'ATRES' && (
            <Button 
              onClick={() => setIsHelpDeskOpen(true)} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-6 rounded-2xl shadow-lg font-black uppercase text-[10px] gap-2 transition-all flex-1 sm:flex-none"
            >
              <Headset className="h-5 w-5" /> Mesa de Ayuda ATRES
            </Button>
          )}
          <Button 
            onClick={() => { setFormData({...initialFormState, name: activeTab}); setEditingId(null); setIsDialogOpen(true); setDialogSearchTerm(''); }} 
            className="btn-institutional h-12 px-8 rounded-2xl shadow-lg text-[10px] flex-1 sm:flex-none"
          >
            <PlusCircle className="h-5 w-5 mr-2" /> Nuevo Registro
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSearchTerm(''); }} className="space-y-6">
        <div className="w-full">
          <TabsList className="w-full justify-start h-12 bg-white/60 backdrop-blur-md border border-slate-200 p-1 rounded-2xl shadow-sm gap-1 overflow-x-auto">
            {PROGRAM_RUBROS.map(rubro => (
              <TabsTrigger 
                key={rubro} 
                value={rubro} 
                className="h-full px-6 text-[10px] font-black uppercase rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap"
              >
                {rubro}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {activeTab === 'ATRES' && (
          <div className="animate-in slide-in-from-top-3 duration-500">
            <Card className="executive-card p-6 bg-white border border-primary/5 shadow-xl relative overflow-hidden">
              <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
                 <div className="space-y-2 shrink-0">
                    <div className="bg-slate-50 p-4 rounded-3xl shadow-lg border-2 border-white">
                        <div className="relative h-28 w-28 flex items-center justify-center bg-white rounded-xl overflow-hidden shadow-inner">
                          {helpDeskUrl ? (
                            <Image src={qrCodeApiUrl} alt="Acceso Docentes QR" width={110} height={110} className="object-contain" priority />
                          ) : (
                            <Circle className="h-8 w-8 text-slate-200 animate-pulse" />
                          )}
                        </div>
                    </div>
                 </div>
                 
                 <div className="flex-1 space-y-4 w-full">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-600 text-white font-black uppercase text-[9px] px-2.5 py-0.5 rounded-full">Acceso Directo</Badge>
                        {publicBaseUrl.includes('cloudworkstations') && (
                          <Badge variant="destructive" className="animate-pulse flex gap-1 font-black text-[9px] py-0.5 rounded-full">
                            <AlertTriangle className="h-3 w-3" /> Entorno de Desarrollo
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-black text-slate-900 uppercase">Vínculo de Asistencia para Docentes</h3>
                      <p className="text-xs font-semibold text-slate-600 leading-snug">
                        Comparta este acceso con docentes y coordinadores para brindar soporte técnico remoto y asistencia inmediata mediante el chatbot con IA.
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row gap-2 items-center w-full">
                        <div className="flex-1 h-11 bg-slate-50 rounded-xl border border-slate-100 flex items-center px-4 gap-3 shadow-inner overflow-hidden w-full">
                           <Globe className="h-4 w-4 text-primary shrink-0" />
                           <span className="font-mono text-[10px] font-black text-slate-500 flex-1 truncate">
                             {helpDeskUrl}
                           </span>
                           <Button variant="ghost" size="sm" onClick={copyHelpDeskUrl} className="h-8 px-3 rounded-lg text-primary hover:bg-primary/5 gap-2 shrink-0">
                              <Copy className="h-3.5 w-3.5" /> <span className="text-[9px] font-black uppercase">Copiar</span>
                           </Button>
                        </div>
                        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                          <Button onClick={() => window.open('/helpdesk', '_blank')} className="h-11 px-5 rounded-xl bg-primary text-white font-black text-[10px] gap-2 shadow-lg flex-1 sm:flex-none">
                             Probar Portal <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => setShowUrlSettings(!showUrlSettings)} className="h-11 w-11 rounded-xl border-slate-200">
                             <Settings2 className={cn("h-5 w-5 text-slate-400 transition-transform", showUrlSettings && "rotate-90")} />
                          </Button>
                        </div>
                      </div>

                      {showUrlSettings && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 animate-in slide-in-from-top-2 duration-300">
                           <Label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Configuración de URL Pública (Para el código QR)</Label>
                           <div className="flex gap-2">
                              <Input 
                                value={publicBaseUrl} 
                                onChange={e => setPublicBaseUrl(e.target.value)} 
                                placeholder="https://mi-dominio-publico.com"
                                className="bg-white font-mono text-[11px] h-10"
                              />
                              <Button onClick={handleSavePublicUrl} className="bg-primary text-white font-black uppercase text-[10px] h-10 px-6 rounded-lg">Guardar</Button>
                           </div>
                           <p className="text-[9px] font-bold text-slate-400 mt-2 flex items-center gap-2">
                             <Info className="h-4 w-4 text-accent" />
                             Si usa un túnel (ngrok), ingrese la dirección aquí para que el QR funcione en teléfonos externos.
                           </p>
                        </div>
                      )}
                    </div>
                 </div>
              </div>
            </Card>
          </div>
        )}

        <Card className="executive-card p-4 bg-white/80 border-none shadow-md border-t-4 border-t-primary">
          <div className="flex flex-col md:flex-row items-end gap-4">
             <div className="relative flex-1 w-full">
                <Label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 ml-1 block">Localizador Operativo</Label>
                <div className="relative">
                  <Input 
                    placeholder="BUSCAR CCT O PLANTEL..." 
                    className="h-11 rounded-xl bg-slate-50 border-primary/5 pl-12 text-[11px] font-black uppercase shadow-inner focus:bg-white transition-all w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                </div>
             </div>

             <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                <div className="space-y-1.5 min-w-[200px]">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 block">Oficina Regional</Label>
                  <Select value={officeFilter} onValueChange={setOfficeFilter}>
                    <SelectTrigger className="h-11 w-full rounded-xl border-primary/5 bg-white text-[10px] font-black uppercase shadow-sm">
                        <SelectValue placeholder="TODAS LAS OFICINAS" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="all" className="text-[10px] font-black uppercase py-2">Todas las Oficinas</SelectItem>
                      {REGIONAL_OFFICES.map(off => (
                        <SelectItem key={off} value={off} className="text-[10px] font-black uppercase py-2">{off.replace("Oficina de Tecnóloga Educativa ", "").replace("Oficina de ", "")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" className="h-11 px-5 border-primary/20 text-primary font-black uppercase text-[10px] gap-2 rounded-xl hover:bg-primary/5 shadow-sm mt-auto" onClick={() => setIsSchedulerOpen(true)}>
                  <CalendarDays className="h-4 w-4" /> Agenda
                </Button>
             </div>
          </div>
        </Card>

        <TabsContent value={activeTab} className="space-y-4 outline-none">
          <Card className="executive-card p-0 shadow-xl border-none overflow-hidden bg-white">
            <div className="overflow-x-auto w-full">
              <Table className="w-full">
                <TableHeader className="bg-slate-50 border-b">
                   <TableRow className="h-14">
                      <TableHead className="w-12 text-[9px] font-black uppercase text-center pl-6 text-primary/60">#</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-primary tracking-widest min-w-[100px]">{activeTab === 'ATRES' ? 'Folio' : 'CCT'}</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-primary tracking-widest min-w-[150px]">
                        {activeTab === 'Geoposición' ? 'Longitud' : 'Identificación del C.T.'}
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-primary tracking-widest min-w-[100px]">
                        {activeTab === 'Geoposición' ? 'Latitud' : activeTab === 'ATRES' ? 'Incidencia' : 'Estatus'}
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-center text-primary tracking-widest min-w-[100px]">
                        {activeTab === 'Geoposición' ? 'Estado' : activeTab === 'Biblioteca Digital' ? 'Equipos' : activeTab === 'ATRES' ? 'Atención' : 'Correo'}
                      </TableHead>
                      {(activeTab === 'Biblioteca Digital' || activeTab === 'ATRES' || activeTab === 'Cuentas Institucionales' || activeTab === 'Conoce mi Escuela') && (
                        <TableHead className="text-[10px] font-black uppercase text-center text-primary tracking-widest w-20">Censo</TableHead>
                      )}
                      <TableHead className="text-right text-[9px] font-black uppercase pr-10 text-primary/60">Acción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length > 0 ? filteredRecords.map((rec, idx) => (
                    <TableRow key={rec.id} className="hover:bg-primary/[0.01] transition-all border-b border-slate-50 last:border-0 h-16 group">
                      <TableCell className="text-center font-black text-[10px] text-slate-300 pl-6">{idx + 1}</TableCell>
                      <TableCell className="font-black text-[11px] text-primary tracking-tight">{activeTab === 'ATRES' ? rec.id : rec.cct}</TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col min-w-0 max-w-[250px]">
                          <span className="text-[11px] font-black text-slate-700 uppercase leading-tight truncate">
                            {activeTab === 'Geoposición' ? rec.longitud : rec.schoolName}
                          </span>
                          {activeTab !== 'Geoposición' && (
                            <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-70 flex items-center gap-1.5 mt-1">
                              <Target className="h-2.5 w-2.5 text-accent" /> {rec.municipio}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {activeTab === 'Geoposición' ? <span className="text-[11px] font-mono font-black text-slate-600">{rec.latitud}</span> : 
                         activeTab === 'ATRES' ? <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/10 bg-primary/5 text-primary py-0.5 px-3 rounded-full">{rec.tipoIncidencia || 'Soporte'}</Badge> :
                         <Badge variant="outline" className={cn("text-[9px] font-black uppercase py-0.5 px-3 rounded-full", rec.status === 'activo' || rec.status === 'pendiente' ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-emerald-200 text-emerald-700 bg-emerald-50')}>
                           {rec.status?.toUpperCase() || 'ACTIVO'}
                         </Badge>}
                      </TableCell>
                      <TableCell className="text-center">
                         {activeTab === 'Biblioteca Digital' ? (
                          <span className="inline-flex items-center justify-center h-8 w-12 rounded-xl bg-primary/5 text-primary text-[11px] font-black border border-primary/5">{rec.numeroEquipos || 0}</span>
                        ) : activeTab === 'ATRES' ? (
                          <div className={cn("h-7 inline-flex items-center justify-center px-4 rounded-lg text-[9px] font-black uppercase border shadow-sm", rec.status === 'atendido' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100')}>
                            {rec.status === 'atendido' ? 'RESUELTO' : 'ESPERA'}
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono font-black lowercase text-slate-500 truncate block max-w-[130px] mx-auto opacity-70">{rec.email || 'S/D'}</span>
                        )}
                      </TableCell>
                      {(activeTab === 'Biblioteca Digital' || activeTab === 'ATRES' || activeTab === 'Cuentas Institucionales' || activeTab === 'Conoce mi Escuela') && (
                        <TableCell className="text-center">
                          <span className="text-[12px] font-black text-accent">{rec.asistentes?.length || 0}</span>
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
                         <div className="flex flex-col items-center gap-3 opacity-20">
                            <Monitor className="h-12 w-12 text-slate-400" />
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Sin registros operativos</p>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[850px] rounded-[2.5rem] h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white flex flex-row items-center justify-between shrink-0 pr-12">
            <div className="space-y-1">
              <DialogTitle className="uppercase font-black text-white text-2xl flex items-center gap-4">
                <Target className="h-8 w-8 text-white/40" /> Gestión de {activeTab}
              </DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-[0.1em] text-white/60">Portal de Auditoría y Seguimiento COEES</DialogDescription>
            </div>
          </DialogHeader>

          <Tabs defaultValue="auditoria" className="flex-1 flex flex-col overflow-hidden">
             <div className="px-8 border-b bg-white">
                <TabsList className="bg-transparent h-16 p-0 gap-10">
                  <TabsTrigger value="auditoria" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-5 text-[11px] font-black uppercase tracking-wider transition-all">1. Auditoría Técnica</TabsTrigger>
                  {(activeTab === 'Biblioteca Digital' || activeTab === 'Cuentas Institucionales' || activeTab === 'Conoce mi Escuela' || activeTab === 'ATRES') && (
                    <TabsTrigger value="asistentes" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-5 text-[11px] font-black uppercase tracking-wider transition-all">2. Censo Institucional</TabsTrigger>
                  )}
                </TabsList>
             </div>

             <div className="flex-1 overflow-hidden">
                <TabsContent value="auditoria" className="h-full m-0 p-8 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-10">
                      <div className="p-8 bg-slate-50 rounded-[2rem] border border-primary/5 space-y-6 shadow-inner relative">
                        <Label className="text-[11px] font-black uppercase text-primary flex items-center gap-3 pl-1 tracking-widest">
                          <Search className="h-5 w-5 text-accent" /> Localizador Institucional CCT
                        </Label>
                        <Input 
                          placeholder="TECLEAR CCT O NOMBRE DEL PLANTEL..." 
                          className="h-14 rounded-2xl bg-white border-primary/10 text-sm font-black uppercase px-8 shadow-sm focus:ring-4 focus:ring-primary/5 transition-all" 
                          value={dialogSearchTerm} 
                          onChange={(e) => {
                            setDialogSearchTerm(e.target.value);
                            if (e.target.value.length === 10) handleCctChange(e.target.value);
                          }} 
                        />
                        
                        {dialogSearchTerm && dialogSearchTerm.length > 2 && (
                          <div className="absolute left-8 right-8 top-28 max-h-60 overflow-auto bg-white border border-slate-100 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 divide-y divide-slate-50 z-50">
                            {schoolsDirectory.filter(s => 
                              (s.nombre || '').toUpperCase().includes(dialogSearchTerm.toUpperCase()) || 
                              (s.cct || '').toUpperCase().includes(dialogSearchTerm.toUpperCase())
                            ).slice(0, 10).map(s => (
                              <div 
                                key={`${s.cct}-${s.turno}`} 
                                className="p-5 hover:bg-primary/5 cursor-pointer flex justify-between items-center group transition-colors" 
                                onClick={() => { populateWithSchool(s); setDialogSearchTerm(''); }}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                    <School className="h-6 w-6" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[13px] font-black uppercase text-slate-800">{s.nombre}</span>
                                    <span className="text-[10px] font-mono font-bold text-muted-foreground">{s.cct} • {s.municipio}</span>
                                  </div>
                                </div>
                                <Badge variant="secondary" className="text-[9px] font-black uppercase bg-primary/10 text-primary px-3 py-1 rounded-full">{s.modalidad}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {formData.cct && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-400">
                           <div className="space-y-2">
                              <Label className="text-[11px] font-black uppercase text-slate-500 pl-1 tracking-widest">Folio de Control</Label>
                              <Input className="h-12 rounded-xl bg-white border-slate-200 font-mono text-sm font-black uppercase px-5" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[11px] font-black uppercase text-slate-500 pl-1 tracking-widest">Oficina de Seguimiento</Label>
                              <Select value={formData.oficinaRegionalAtencion} onValueChange={(val) => setFormData({...formData, oficinaRegionalAtencion: val})}>
                                <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 text-xs font-black uppercase px-5"><SelectValue placeholder="SELECCIONAR..." /></SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                  {REGIONAL_OFFICES.map(off => <SelectItem key={off} value={off} className="text-[11px] font-black uppercase py-3">{off.replace("Oficina de ", "")}</SelectItem>)}
                                </SelectContent>
                              </Select>
                           </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase text-slate-500 pl-1 tracking-widest">Diagnóstico Técnico y Observaciones</Label>
                        <Textarea className="min-h-[160px] rounded-3xl p-8 bg-slate-50 border border-slate-200 text-[14px] font-semibold shadow-inner focus:bg-white transition-all" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder="Detalle los hallazgos técnicos y acuerdos tomados..." />
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="asistentes" className="h-full m-0 p-10 flex flex-col">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                    <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center gap-4 flex-1">
                      <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                        <Info className="h-6 w-6" />
                      </div>
                      <p className="text-[11px] font-black text-blue-900 uppercase leading-relaxed tracking-wide">
                        Censo Institucional: Registre al personal y las cuentas <br /> institucionales asignadas a este centro de trabajo.
                      </p>
                    </div>
                    <Button onClick={() => { setAssistantForm({nombres: '', paterno: '', materno: '', rfc: '', funcion: '', email: ''}); setIsAssistantDialogOpen(true); }} className="h-12 px-8 rounded-2xl text-[11px] gap-3 font-black uppercase shadow-xl bg-primary text-white">
                      <UserPlus className="h-5 w-5" /> Registrar Personal
                    </Button>
                  </div>
                  <div className="flex-1 overflow-hidden border border-slate-100 rounded-[2rem] bg-white shadow-2xl">
                    <ScrollArea className="h-full">
                      <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b">
                          <TableRow className="h-14">
                            <TableHead className="text-[10px] font-black uppercase pl-8">Servidor Público</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-center">RFC</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-center">Función</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase pr-10">Acción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.asistentes?.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-28 opacity-30 text-xs font-black uppercase text-slate-400">Sin personal censado en este módulo.</TableCell></TableRow>
                          ) : formData.asistentes?.map((ast: any, idx: number) => (
                            <TableRow key={idx} className="h-14 hover:bg-slate-50/50 transition-colors">
                              <TableCell className="pl-8 text-[12px] font-black uppercase text-slate-700">{ast.nombres} {ast.paterno}</TableCell>
                              <TableCell className="font-mono text-[12px] font-black text-primary text-center">{ast.rfc}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-300 px-3 py-1 rounded-full">{ast.funcion}</Badge>
                              </TableCell>
                              <TableCell className="text-right pr-10">
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-rose-300 hover:text-rose-600 rounded-xl" onClick={() => { setFormData({...formData, asistentes: formData.asistentes?.filter((_, i) => i !== idx)}); }}><Trash2 className="h-4 w-4" /></Button>
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
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-14 px-10 text-[11px] font-black uppercase border-slate-300 hover:bg-white rounded-2xl">Cancelar</Button>
              <Button onClick={handleSave} className="btn-institutional h-14 px-14 text-[11px] rounded-2xl shadow-primary/20">Guardar Cambios Operativos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssistantDialogOpen} onOpenChange={setIsAssistantDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-[#9f2241] text-white">
            <DialogTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-4"><UserPlus className="h-6 w-6 text-white/40" /> Alta de Servidor Público</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombres</Label><Input value={assistantForm.nombres} onChange={e => setAssistantForm({...assistantForm, nombres: e.target.value.toUpperCase()})} className="h-12 rounded-xl bg-slate-50 border-none font-black text-sm px-5 shadow-inner" /></div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Paterno</Label><Input value={assistantForm.paterno} onChange={e => setAssistantForm({...assistantForm, paterno: e.target.value.toUpperCase()})} className="h-12 rounded-xl bg-slate-50 border-none font-black text-sm px-5 shadow-inner" /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Materno</Label><Input value={assistantForm.materno} onChange={e => setAssistantForm({...assistantForm, materno: e.target.value.toUpperCase()})} className="h-12 rounded-xl bg-slate-50 border-none font-black text-sm px-5 shadow-inner" /></div>
              </div>
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">RFC Oficial</Label><Input value={assistantForm.rfc} onChange={e => setAssistantForm({...assistantForm, rfc: e.target.value.toUpperCase()})} className="h-12 rounded-xl bg-slate-50 border-none font-mono font-black text-sm px-5 shadow-inner" maxLength={13} /></div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Función Institucional</Label>
                <Select value={assistantForm.funcion} onValueChange={val => setAssistantForm({...assistantForm, funcion: val})}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-black uppercase text-[10px] px-5 shadow-inner"><SelectValue placeholder="SELECCIONAR..." /></SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {['DOCENTE', 'DIRECTOR', 'SUBDIRECTOR', 'ADMINISTRATIVO', 'AUXILIAR', 'JEFE DE ENSEÑANZA', 'SUPERVISOR'].map(f => <SelectItem key={f} value={f} className="text-[11px] font-black uppercase py-3">{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t gap-4">
             <Button variant="ghost" onClick={() => setIsAssistantDialogOpen(false)} className="font-black uppercase text-[10px] h-12 px-6">Cancelar</Button>
             <Button onClick={() => { if(assistantForm.nombres && assistantForm.rfc) { setFormData({...formData, asistentes: [...(formData.asistentes || []), assistantForm]}); setIsAssistantDialogOpen(false); } }} className="bg-primary text-white h-12 px-8 rounded-xl font-black uppercase text-[10px] shadow-lg shadow-primary/10">Añadir al Censo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
