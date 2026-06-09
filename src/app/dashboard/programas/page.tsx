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
      {/* Header Institucional - Compacto para evitar desbordamiento */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-primary uppercase leading-tight">Módulos Técnicos COEES</h2>
          <div className="flex items-center gap-2 bg-white/80 px-3 py-1 rounded-full border border-primary/10 shadow-sm inline-flex">
            <Activity className="h-3.5 w-3.5 text-accent" /> 
            <p className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-[0.1em]">Programas y Auditoría 2026</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {activeTab === 'ATRES' && (
            <Button 
              onClick={() => setIsHelpDeskOpen(true)} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-4 md:px-6 rounded-xl shadow-lg font-black uppercase text-[10px] gap-2 transition-all flex-1 sm:flex-none"
            >
              <Headset className="h-4 w-4" /> Mesa de Ayuda ATRES
            </Button>
          )}
          <Button 
            onClick={() => { setFormData({...initialFormState, name: activeTab}); setEditingId(null); setIsDialogOpen(true); setDialogSearchTerm(''); }} 
            className="btn-institutional h-11 px-6 md:px-8 rounded-xl shadow-lg text-[10px] flex-1 sm:flex-none tracking-[0.1em]"
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Nuevo Registro
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSearchTerm(''); }} className="space-y-4">
        <div className="w-full">
          <TabsList className="w-full justify-start h-11 bg-white/60 backdrop-blur-md border border-slate-200 p-1 rounded-2xl shadow-sm gap-1 overflow-x-auto">
            {PROGRAM_RUBROS.map(rubro => (
              <TabsTrigger 
                key={rubro} 
                value={rubro} 
                className="h-full px-4 text-[9px] md:text-[10px] font-black uppercase rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap"
              >
                {rubro}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {activeTab === 'ATRES' && (
          <div className="animate-in slide-in-from-top-2 duration-500 max-w-full overflow-x-hidden">
            <Card className="executive-card p-4 md:p-6 bg-white border border-primary/5 shadow-xl relative overflow-hidden">
              <div className="flex flex-col lg:flex-row items-center gap-6 md:gap-8 relative z-10">
                 {/* QR Panel - Responsivo */}
                 <div className="space-y-2 shrink-0 text-center">
                    <div className="bg-slate-50 p-3 rounded-3xl shadow-lg border-2 border-white inline-block">
                        <div className="relative h-24 w-24 md:h-28 md:w-28 flex items-center justify-center bg-white rounded-xl overflow-hidden shadow-inner">
                          {helpDeskUrl ? (
                            <Image 
                              src={qrCodeApiUrl} 
                              alt="Acceso Docentes QR" 
                              width={110} 
                              height={110} 
                              className="object-contain" 
                              priority 
                            />
                          ) : (
                            <Circle className="h-8 w-8 text-slate-200 animate-pulse" />
                          )}
                        </div>
                    </div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Escanee soporte</p>
                 </div>
                 
                 {/* Info Panel - Liquid Layout */}
                 <div className="flex-1 space-y-3 w-full min-w-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-emerald-600 text-white font-black uppercase text-[8px] md:text-[9px] px-2 py-0.5 rounded-full">Oficial</Badge>
                        {publicBaseUrl.includes('cloudworkstations') && (
                          <Badge variant="destructive" className="animate-pulse flex gap-1 font-black text-[8px] md:text-[9px] py-0.5 rounded-full">
                            <AlertTriangle className="h-3 w-3" /> Modo Desarrollo
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">Acceso Directo para Docentes</h3>
                      <p className="text-[10px] md:text-xs font-semibold text-slate-600 leading-snug max-w-3xl">
                        Comparta este acceso con docentes y coordinadores para brindar soporte técnico remoto y asistencia inmediata mediante el chatbot con IA.
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col sm:flex-row gap-2 items-center w-full">
                        <div className="flex-1 h-10 bg-slate-50 rounded-xl border border-slate-100 flex items-center px-4 gap-2 shadow-inner overflow-hidden w-full group hover:bg-white transition-all min-w-0">
                           <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                           <span className="font-mono text-[9px] md:text-[10px] font-black text-slate-500 flex-1 truncate">
                             {helpDeskUrl}
                           </span>
                           <Button variant="ghost" size="sm" onClick={copyHelpDeskUrl} className="h-7 px-2 rounded-lg text-primary hover:bg-primary/5 gap-1.5 shrink-0">
                              <Copy className="h-3 w-3" /> <span className="text-[8px] font-black uppercase">Copiar</span>
                           </Button>
                        </div>
                        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                          <Button onClick={() => window.open('/helpdesk', '_blank')} className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/95 text-white font-black text-[9px] gap-2 shadow-lg flex-1 sm:flex-none whitespace-nowrap">
                             Probar Portal <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => setShowUrlSettings(!showUrlSettings)} className="h-10 w-10 rounded-xl border-slate-200 hover:bg-slate-50 shrink-0">
                             <Settings2 className={cn("h-4 w-4 text-slate-400 transition-transform", showUrlSettings && "rotate-90")} />
                          </Button>
                        </div>
                      </div>

                      {showUrlSettings && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 animate-in slide-in-from-top-2 duration-300 shadow-inner">
                           <Label className="text-[9px] font-black uppercase text-slate-500 mb-1.5 block pl-1">Configuración de Link Público (Para QR)</Label>
                           <div className="flex gap-2">
                              <Input 
                                value={publicBaseUrl} 
                                onChange={e => setPublicBaseUrl(e.target.value)} 
                                placeholder="https://mi-portal.com"
                                className="bg-white font-mono text-[10px] h-9 border-slate-200"
                              />
                              <Button onClick={handleSavePublicUrl} className="bg-[#9f2241] text-white font-black uppercase text-[9px] h-9 px-4 rounded-lg">Actualizar</Button>
                           </div>
                           <p className="text-[8px] font-bold text-slate-400 mt-2 flex items-start gap-1.5 italic">
                             <Info className="h-3 w-3 text-accent shrink-0" />
                             Si usa un túnel público, ingrese la dirección aquí para que el QR sea funcional en celulares.
                           </p>
                        </div>
                      )}
                    </div>
                 </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filtros Operativos - Alineación Dinámica */}
        <Card className="executive-card p-4 bg-white/80 border-none shadow-md border-t-4 border-t-primary">
          <div className="flex flex-col md:flex-row items-end gap-3 w-full">
             <div className="relative flex-1 w-full min-w-0">
                <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 mb-1 ml-1 block">Localizador Operativo</Label>
                <div className="relative">
                  <Input 
                    placeholder="BUSCAR CCT O PLANTEL..." 
                    className="h-10 rounded-xl bg-slate-50 border-primary/5 pl-10 text-[11px] font-black uppercase shadow-inner focus:bg-white transition-all w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
                </div>
             </div>

             <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0 justify-between sm:justify-end">
                <div className="space-y-1 min-w-[180px]">
                  <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1 block">Oficina Regional</Label>
                  <Select value={officeFilter} onValueChange={setOfficeFilter}>
                    <SelectTrigger className="h-10 w-full rounded-xl border-primary/5 bg-white text-[9px] md:text-[10px] font-black uppercase shadow-sm">
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

                <Button variant="outline" className="h-10 px-4 border-primary/20 text-primary font-black uppercase text-[9px] md:text-[10px] gap-2 rounded-xl hover:bg-primary/5 shadow-sm whitespace-nowrap" onClick={() => setIsSchedulerOpen(true)}>
                  <CalendarDays className="h-4 w-4" /> Agenda
                </Button>
             </div>
          </div>
        </Card>

        {/* Tabla de Datos - Optimizada para no cortarse */}
        <TabsContent value={activeTab} className="space-y-4 outline-none w-full">
          <Card className="executive-card p-0 shadow-xl border-none overflow-hidden bg-white">
            <div className="overflow-x-auto w-full">
              <Table className="w-full">
                <TableHeader className="bg-slate-50 border-b">
                   <TableRow className="h-12">
                      <TableHead className="w-10 text-[9px] font-black uppercase text-center pl-4 text-primary/60">#</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-primary tracking-widest min-w-[120px]">{activeTab === 'ATRES' ? 'Folio' : 'CCT'}</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-primary tracking-widest min-w-[200px]">
                        {activeTab === 'Geoposición' ? 'Longitud' : 'Identificación del C.T.'}
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-primary tracking-widest min-w-[110px]">
                        {activeTab === 'Geoposición' ? 'Latitud' : activeTab === 'ATRES' ? 'Incidencia' : 'Estatus'}
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-center text-primary tracking-widest min-w-[120px]">
                        {activeTab === 'Geoposición' ? 'Estado' : activeTab === 'Biblioteca Digital' ? 'Equipos' : activeTab === 'ATRES' ? 'Atención' : 'Correo'}
                      </TableHead>
                      {(activeTab === 'Biblioteca Digital' || activeTab === 'ATRES' || activeTab === 'Cuentas Institucionales' || activeTab === 'Conoce mi Escuela') && (
                        <TableHead className="text-[10px] font-black uppercase text-center text-primary tracking-widest w-16">Censo</TableHead>
                      )}
                      <TableHead className="text-right text-[9px] font-black uppercase pr-10 text-primary/60">Acción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length > 0 ? filteredRecords.map((rec, idx) => (
                    <TableRow key={rec.id} className="hover:bg-primary/[0.01] transition-all border-b border-slate-50 last:border-0 h-14 group">
                      <TableCell className="text-center font-black text-[10px] text-slate-300 pl-4">{idx + 1}</TableCell>
                      <TableCell className="font-black text-[11px] text-primary tracking-tight">{activeTab === 'ATRES' ? rec.id : rec.cct}</TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-col min-w-0 max-w-[300px]">
                          <span className="text-[12px] font-black text-slate-700 uppercase leading-tight truncate">
                            {activeTab === 'Geoposición' ? rec.longitud : rec.schoolName}
                          </span>
                          {activeTab !== 'Geoposición' && (
                            <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-70 flex items-center gap-1.5 mt-0.5">
                              <Target className="h-2.5 w-2.5 text-accent" /> {rec.municipio}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {activeTab === 'Geoposición' ? <span className="text-[10px] font-mono font-black text-slate-600">{rec.latitud}</span> : 
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
                          <span className="text-[10px] font-mono font-black lowercase text-slate-500 truncate block max-w-[150px] mx-auto opacity-70">{rec.email || 'S/D'}</span>
                        )}
                      </TableCell>
                      {(activeTab === 'Biblioteca Digital' || activeTab === 'ATRES' || activeTab === 'Cuentas Institucionales' || activeTab === 'Conoce mi Escuela') && (
                        <TableCell className="text-center">
                          <span className="text-[13px] font-black text-accent">{rec.asistentes?.length || 0}</span>
                        </TableCell>
                      )}
                      <TableCell className="text-right pr-10">
                         <div className="flex justify-end gap-1.5">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(rec)} className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteRecord(rec.id)} className="h-8 w-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="h-3.5 w-3.5" /></Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-20 bg-slate-50/20">
                         <div className="flex flex-col items-center gap-3 opacity-20">
                            <Monitor className="h-10 w-10 text-slate-400" />
                            <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-500">Sin registros operativos</p>
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
        <DialogContent className="sm:max-w-[850px] rounded-[2rem] h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white flex flex-row items-center justify-between shrink-0 pr-12">
            <div className="space-y-0.5">
              <DialogTitle className="uppercase font-black text-white text-xl flex items-center gap-3">
                <Target className="h-6 w-6 text-white/40" /> Gestión de {activeTab}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/60">Portal de Auditoría y Seguimiento COEES</DialogDescription>
            </div>
          </DialogHeader>

          <Tabs defaultValue="auditoria" className="flex-1 flex flex-col overflow-hidden">
             <div className="px-6 border-b bg-white">
                <TabsList className="bg-transparent h-14 p-0 gap-8">
                  <TabsTrigger value="auditoria" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-4 text-[10px] font-black uppercase tracking-wider transition-all">1. Auditoría Técnica</TabsTrigger>
                  {(activeTab === 'Biblioteca Digital' || activeTab === 'Cuentas Institucionales' || activeTab === 'Conoce mi Escuela' || activeTab === 'ATRES') && (
                    <TabsTrigger value="asistentes" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-4 text-[10px] font-black uppercase tracking-wider transition-all">2. Censo Institucional</TabsTrigger>
                  )}
                </TabsList>
             </div>

             <div className="flex-1 overflow-hidden">
                <TabsContent value="auditoria" className="h-full m-0 p-8 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-8">
                      <div className="p-6 bg-slate-50 rounded-3xl border border-primary/5 space-y-4 shadow-inner relative">
                        <Label className="text-[10px] font-black uppercase text-primary flex items-center gap-2 pl-1 tracking-[0.1em]">
                          <Search className="h-4 w-4 text-accent" /> Localizador Institucional CCT
                        </Label>
                        <Input 
                          placeholder="TECLEAR CCT O NOMBRE DEL PLANTEL..." 
                          className="h-12 rounded-xl bg-white border-primary/10 text-xs font-black uppercase px-6 shadow-sm focus:ring-2 focus:ring-primary/10 transition-all" 
                          value={dialogSearchTerm} 
                          onChange={(e) => {
                            setDialogSearchTerm(e.target.value);
                            if (e.target.value.length === 10) handleCctChange(e.target.value);
                          }} 
                        />
                        
                        {dialogSearchTerm && dialogSearchTerm.length > 2 && (
                          <div className="absolute left-6 right-6 top-24 max-h-52 overflow-auto bg-white border border-slate-100 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 divide-y divide-slate-50 z-50">
                            {schoolsDirectory.filter(s => 
                              (s.nombre || '').toUpperCase().includes(dialogSearchTerm.toUpperCase()) || 
                              (s.cct || '').toUpperCase().includes(dialogSearchTerm.toUpperCase())
                            ).slice(0, 8).map(s => (
                              <div 
                                key={`${s.cct}-${s.turno}`} 
                                className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center group transition-colors" 
                                onClick={() => { populateWithSchool(s); setDialogSearchTerm(''); }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                    <School className="h-5 w-5" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-black uppercase text-slate-800">{s.nombre}</span>
                                    <span className="text-[9px] font-mono font-bold text-muted-foreground">{s.cct} • {s.municipio}</span>
                                  </div>
                                </div>
                                <Badge variant="secondary" className="text-[8px] font-black uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s.modalidad}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {formData.cct && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-3 duration-400">
                           <div className="space-y-1.5">
                              <Label className="text-[10px] font-black uppercase text-slate-500 pl-1 tracking-wider">Folio de Control</Label>
                              <Input className="h-11 rounded-lg bg-white border-slate-200 font-mono text-[11px] font-black uppercase px-4" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} />
                           </div>
                           <div className="space-y-1.5">
                              <Label className="text-[10px] font-black uppercase text-slate-500 pl-1 tracking-wider">Oficina de Seguimiento</Label>
                              <Select value={formData.oficinaRegionalAtencion} onValueChange={(val) => setFormData({...formData, oficinaRegionalAtencion: val})}>
                                <SelectTrigger className="h-11 rounded-lg bg-white border-slate-200 text-[10px] font-black uppercase px-4"><SelectValue placeholder="SELECCIONAR..." /></SelectTrigger>
                                <SelectContent className="rounded-xl">
                                  {REGIONAL_OFFICES.map(off => <SelectItem key={off} value={off} className="text-[10px] font-black uppercase py-2.5">{off.replace("Oficina de ", "")}</SelectItem>)}
                                </SelectContent>
                              </Select>
                           </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 pl-1 tracking-wider">Diagnóstico Técnico y Observaciones</Label>
                        <Textarea className="min-h-[140px] rounded-2xl p-6 bg-slate-50 border border-slate-200 text-[13px] font-semibold shadow-inner focus:bg-white transition-all" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder="Detalle los hallazgos técnicos..." />
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="asistentes" className="h-full m-0 p-8 flex flex-col">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center gap-3 flex-1">
                      <Info className="h-5 w-5 text-blue-600 shrink-0" />
                      <p className="text-[10px] font-black text-blue-900 uppercase leading-snug">
                        Censo Institucional: Registre al personal y las cuentas asignadas.
                      </p>
                    </div>
                    <Button onClick={() => { setAssistantForm({nombres: '', paterno: '', materno: '', rfc: '', funcion: '', email: ''}); setIsAssistantDialogOpen(true); }} className="h-11 px-6 rounded-xl text-[10px] gap-2 font-black uppercase shadow-lg bg-primary text-white">
                      <UserPlus className="h-4 w-4" /> Registrar Personal
                    </Button>
                  </div>
                  <div className="flex-1 overflow-hidden border border-slate-100 rounded-3xl bg-white shadow-xl">
                    <ScrollArea className="h-full">
                      <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b">
                          <TableRow className="h-11">
                            <TableHead className="text-[9px] font-black uppercase pl-6">Servidor Público</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-center">RFC</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-center">Función</TableHead>
                            <TableHead className="text-right text-[9px] font-black uppercase pr-8">Acción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.asistentes?.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-20 opacity-30 text-[10px] font-black uppercase text-slate-400">Sin personal censado.</TableCell></TableRow>
                          ) : formData.asistentes?.map((ast: any, idx: number) => (
                            <TableRow key={idx} className="h-12 hover:bg-slate-50/50 transition-colors">
                              <TableCell className="pl-6 text-[11px] font-black uppercase text-slate-700">{ast.nombres} {ast.paterno}</TableCell>
                              <TableCell className="font-mono text-[11px] font-black text-primary text-center">{ast.rfc}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="text-[8px] font-black uppercase border-slate-300 px-2 py-0.5 rounded-full">{ast.funcion}</Badge>
                              </TableCell>
                              <TableCell className="text-right pr-8">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300 hover:text-rose-600 rounded-lg" onClick={() => { setFormData({...formData, asistentes: formData.asistentes?.filter((_, i) => i !== idx)}); }}><Trash2 className="h-3.5 w-3.5" /></Button>
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
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-11 px-8 text-[10px] font-black uppercase border-slate-300 hover:bg-white rounded-xl">Cancelar</Button>
              <Button onClick={handleSave} className="btn-institutional h-11 px-10 text-[10px] rounded-xl shadow-primary/20">Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssistantDialogOpen} onOpenChange={setIsAssistantDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[1.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-[#9f2241] text-white">
            <DialogTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-3"><UserPlus className="h-5 w-5 text-white/40" /> Alta de Servidor</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Nombres</Label><Input value={assistantForm.nombres} onChange={e => setAssistantForm({...assistantForm, nombres: e.target.value.toUpperCase()})} className="h-10 rounded-lg bg-slate-50 border-none font-black text-[11px] px-4 shadow-inner" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Paterno</Label><Input value={assistantForm.paterno} onChange={e => setAssistantForm({...assistantForm, paterno: e.target.value.toUpperCase()})} className="h-10 rounded-lg bg-slate-50 border-none font-black text-[11px] px-4 shadow-inner" /></div>
                <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Materno</Label><Input value={assistantForm.materno} onChange={e => setAssistantForm({...assistantForm, materno: e.target.value.toUpperCase()})} className="h-10 rounded-lg bg-slate-50 border-none font-black text-[11px] px-4 shadow-inner" /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 ml-1">RFC Oficial</Label><Input value={assistantForm.rfc} onChange={e => setAssistantForm({...assistantForm, rfc: e.target.value.toUpperCase()})} className="h-10 rounded-lg bg-slate-50 border-none font-mono font-black text-[11px] px-4 shadow-inner" maxLength={13} /></div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Función Institucional</Label>
                <Select value={assistantForm.funcion} onValueChange={val => setAssistantForm({...assistantForm, funcion: val})}>
                  <SelectTrigger className="h-10 rounded-lg bg-slate-50 border-none font-black uppercase text-[9px] px-4 shadow-inner"><SelectValue placeholder="SELECCIONAR..." /></SelectTrigger>
                  <SelectContent>
                    {['DOCENTE', 'DIRECTOR', 'SUBDIRECTOR', 'ADMINISTRATIVO', 'AUXILIAR', 'JEFE DE ENSEÑANZA', 'SUPERVISOR'].map(f => <SelectItem key={f} value={f} className="text-[10px] font-black uppercase py-2.5">{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t gap-3">
             <Button variant="ghost" onClick={() => setIsAssistantDialogOpen(false)} className="font-black uppercase text-[9px] h-10 px-5">Cancelar</Button>
             <Button onClick={() => { if(assistantForm.nombres && assistantForm.rfc) { setFormData({...formData, asistentes: [...(formData.asistentes || []), assistantForm]}); setIsAssistantDialogOpen(false); } }} className="bg-primary text-white h-10 px-6 rounded-lg font-black uppercase text-[9px] shadow-lg shadow-primary/10">Añadir al Censo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
