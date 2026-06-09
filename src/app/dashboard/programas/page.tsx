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
import { Checkbox } from "@/components/ui/checkbox"
import { programsData, type ProgramStatus } from "@/lib/planning-data"
import { schoolsDirectory } from "@/lib/schools-directory"
import { cn } from "@/lib/utils"
import Image from 'next/image'
import { 
  PlusCircle, 
  Pencil, 
  Activity,
  Target,
  Plus,
  Search,
  Trash2,
  UserPlus,
  FileText,
  ImageIcon,
  Eye,
  Monitor,
  X,
  School,
  CalendarDays,
  Building2,
  Headset,
  Share2,
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
  const [evidenceToView, setEvidenceToView] = useState<{ type: 'pdf' | 'gallery', data: string | string[], title: string } | null>(null)

  // Assistant Sub-Dialog State
  const [isAssistantDialogOpen, setIsAssistantDialogOpen] = useState(false)
  const [editingAssistantIndex, setEditingAssistantIndex] = useState<number | null>(null)
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
      mantenimientoDetalle: rec.mantenimientoDetalle || initialFormState.mantenimientoDetalle,
      edusatDetalle: rec.edusatDetalle || initialFormState.edusatDetalle
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
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(helpDeskUrl)}`;

  const copyHelpDeskUrl = () => {
    navigator.clipboard.writeText(helpDeskUrl)
    toast({ title: "Link copiado", description: "La URL ha sido copiada al portapapeles." })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'photo') => {
    const files = e.target.files
    if (!files) return
    if (type === 'pdf') {
      const file = files[0]
      const reader = new FileReader()
      reader.onloadend = () => setFormData({ ...formData, reportPdf: reader.result as string })
      reader.readAsDataURL(file)
    } else {
      const newPhotos = Array.from(files)
      newPhotos.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => setFormData(prev => ({ ...prev, evidencePhotos: [...(prev.evidencePhotos || []), reader.result as string] }))
        reader.readAsDataURL(file)
      })
    }
  }

  const handleMantenimientoTableChange = (index: number, field: string, value: string) => {
    const current = formData.mantenimientoDetalle || initialFormState.mantenimientoDetalle!;
    const newEquipos = [...current.equipos];
    newEquipos[index] = { ...newEquipos[index], [field]: value };
    setFormData({ ...formData, mantenimientoDetalle: { ...current, equipos: newEquipos } });
  }

  const handleSaveAssistant = () => {
    if (!assistantForm.nombres || !assistantForm.rfc) return;
    const newAsistentes = [...(formData.asistentes || [])]
    if (editingAssistantIndex !== null) newAsistentes[editingAssistantIndex] = { ...assistantForm }
    else newAsistentes.push({ ...assistantForm })
    setFormData({ ...formData, asistentes: newAsistentes })
    setIsAssistantDialogOpen(false)
  }

  if (!mounted) return null

  return (
    <div className="space-y-3 animate-in fade-in duration-700 max-w-full overflow-hidden">
      {/* Header Institucional - Compacto */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 border-b border-primary/5 pb-2">
        <div className="space-y-0.5">
          <h2 className="text-lg font-black tracking-tight text-primary uppercase leading-none">Módulos Técnicos COEES</h2>
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-2 py-0.5 rounded-full border border-primary/5 shadow-sm inline-flex">
            <Activity className="h-2.5 w-2.5 text-accent" /> 
            <p className="text-[7px] font-black uppercase text-muted-foreground tracking-[0.1em]">Control de Programas y Auditoría 2026</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          {activeTab === 'ATRES' && (
            <Button 
              onClick={() => setIsHelpDeskOpen(true)} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 rounded-lg shadow-lg shadow-emerald-600/10 font-black uppercase text-[7px] gap-1.5 transition-all active:scale-95"
            >
              <Headset className="h-3 w-3" /> Mesa de Ayuda ATRES
            </Button>
          )}
          <Button 
            onClick={() => { setFormData({...initialFormState, name: activeTab}); setEditingId(null); setIsDialogOpen(true); setDialogSearchTerm(''); }} 
            className="btn-institutional h-8 px-4 rounded-lg shadow-lg text-[7px] flex items-center justify-center"
          >
            <PlusCircle className="h-3 w-3 mr-1.5" /> Nuevo Registro
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSearchTerm(''); }} className="space-y-3">
        <div className="w-full overflow-x-auto">
          <TabsList className="min-w-max h-8 bg-white/50 backdrop-blur-md border border-slate-200 p-0.5 rounded-lg shadow-sm gap-0.5">
            {PROGRAM_RUBROS.map(rubro => (
              <TabsTrigger 
                key={rubro} 
                value={rubro} 
                className="h-full px-3 text-[7px] font-black uppercase rounded-md data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
              >
                {rubro}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {activeTab === 'ATRES' && (
          <Card className="executive-card p-3 lg:p-4 bg-emerald-50/30 border-emerald-100 border-2 overflow-hidden relative max-w-full">
            <div className="absolute top-0 right-0 p-3 opacity-5 hidden lg:block">
               <Share2 className="h-16 w-16 text-emerald-900" />
            </div>
            <div className="flex flex-col lg:flex-row items-center gap-4 relative z-10">
               <div className="bg-white p-2 rounded-xl shadow-lg border border-emerald-100 shrink-0 transform transition-transform hover:scale-105 duration-500">
                  <div className="relative h-16 w-16 flex items-center justify-center bg-slate-50 rounded-lg group cursor-pointer hover:bg-white transition-colors">
                     {helpDeskUrl ? (
                       <div className="relative h-12 w-12">
                         <Image src={qrCodeApiUrl} alt="Acceso Docentes QR" fill className="object-contain" />
                       </div>
                     ) : (
                       <Circle className="h-8 w-8 text-slate-200 animate-pulse" />
                     )}
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/60 backdrop-blur-sm rounded-lg">
                        <Badge className="bg-emerald-600 font-black text-[6px] py-0 px-1.5">Escanea</Badge>
                     </div>
                  </div>
               </div>
               
               <div className="flex-1 space-y-2 text-center lg:text-left min-w-0">
                  <div className="space-y-0.5">
                    <Badge className="bg-emerald-600 text-white font-black uppercase text-[6px] px-1.5 py-0 rounded-full">Vinculación Institucional</Badge>
                    <h3 className="text-sm lg:text-base font-black text-emerald-900 uppercase tracking-tighter leading-none">Acceso Directo para Docentes</h3>
                    <p className="text-[8px] font-semibold text-emerald-700/80 leading-tight max-w-xl">
                      Comparta este link o código QR para soporte técnico remoto inmediato.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 items-center w-full max-w-3xl">
                    <div className="flex-1 w-full h-8 bg-white rounded-lg border border-emerald-100 flex items-center px-3 gap-2 shadow-inner overflow-hidden">
                       <ExternalLink className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                       <span className="font-mono text-[7px] font-bold text-emerald-800 flex-1 truncate select-all">
                         {helpDeskUrl}
                       </span>
                       <Button variant="ghost" size="sm" onClick={copyHelpDeskUrl} className="h-6 px-2 rounded-md text-emerald-600 hover:bg-emerald-50 gap-1 shrink-0 border border-emerald-50">
                          <Copy className="h-2.5 w-2.5" /> <span className="text-[6px] font-black">COPIAR</span>
                       </Button>
                    </div>
                    <Button onClick={() => window.open('/helpdesk', '_blank')} className="w-full sm:w-auto h-8 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[7px] gap-1.5 shadow-md transition-all active:scale-95 shrink-0">
                       PORTAL PÚBLICO <ExternalLink className="h-2.5 w-2.5" />
                    </Button>
                  </div>
               </div>
            </div>
          </Card>
        )}

        {/* Barra Operativa de Filtros - Compacta */}
        <Card className="executive-card p-2 lg:p-3 bg-white/80 border-none shadow-xl border-t-4 border-t-primary max-w-full overflow-hidden">
          <div className="flex flex-col xl:flex-row items-center gap-2 lg:gap-3">
             <div className="flex items-center gap-1.5 w-full xl:w-auto shrink-0 border-b xl:border-b-0 xl:border-r border-slate-100 pb-1.5 xl:pb-0 xl:pr-3">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <Search className="h-3 w-3" />
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">Buscador:</span>
             </div>
             
             <div className="relative flex-1 w-full min-w-0">
                <Input 
                  placeholder="CCT O NOMBRE DEL PLANTEL..." 
                  className="h-8 rounded-lg bg-slate-50 border-primary/5 pl-8 text-[8px] font-bold uppercase shadow-inner focus:bg-white transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-slate-300" />
             </div>

             <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto shrink-0">
                <Select value={officeFilter} onValueChange={setOfficeFilter}>
                  <SelectTrigger className="h-8 w-full sm:w-[150px] rounded-lg border-primary/5 bg-white text-[8px] font-black uppercase shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 text-primary opacity-60" />
                      <SelectValue placeholder="OFICINA..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-slate-200">
                    <SelectItem value="all" className="text-[8px] font-black uppercase">Todas las Oficinas</SelectItem>
                    {REGIONAL_OFFICES.map(off => (
                      <SelectItem key={off} value={off} className="text-[8px] font-black uppercase">{off.replace("Oficina de Tecnóloga Educativa ", "").replace("Oficina de ", "")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" className="h-8 w-full sm:w-auto px-3 border-primary/10 text-primary font-black uppercase text-[7px] gap-1.5 rounded-lg hover:bg-primary/5 shadow-sm" onClick={() => setIsSchedulerOpen(true)}>
                  <CalendarDays className="h-3 w-3" /> Agenda
                </Button>
             </div>
          </div>
        </Card>

        <TabsContent value={activeTab} className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none max-w-full overflow-hidden">
          <Card className="executive-card p-0 shadow-2xl border-none overflow-hidden bg-white max-w-full">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80 backdrop-blur-sm border-b">
                   <TableRow className="h-9">
                      <TableHead className="w-8 text-[8px] font-black uppercase text-center pl-3 text-primary/60">#</TableHead>
                      <TableHead className="text-[8px] font-black uppercase text-primary tracking-widest">{activeTab === 'ATRES' ? 'Folio' : 'CCT'}</TableHead>
                      <TableHead className="text-[8px] font-black uppercase text-primary tracking-widest">
                        {activeTab === 'Geoposición' ? 'Longitud' : 'Plantel'}
                      </TableHead>
                      <TableHead className="text-[8px] font-black uppercase text-primary tracking-widest">
                        {activeTab === 'Geoposición' ? 'Latitud' : 
                         activeTab === 'ATRES' ? 'Incidencia' : 
                         'Estatus'}
                      </TableHead>
                      <TableHead className="text-[8px] font-black uppercase text-center text-primary tracking-widest">
                        {activeTab === 'Geoposición' ? 'Estado' : 
                         activeTab === 'Biblioteca Digital' ? 'Equipos' : 
                         activeTab === 'ATRES' ? 'Estatus' : 
                         'Email'}
                      </TableHead>
                      {(activeTab === 'Biblioteca Digital' || activeTab === 'ATRES' || activeTab === 'Cuentas Institucionales' || activeTab === 'Conoce mi Escuela') && (
                        <TableHead className="text-[8px] font-black uppercase text-center text-primary tracking-widest">Personal</TableHead>
                      )}
                      {activeTab === 'ATRES' && (
                        <TableHead className="text-[8px] font-black uppercase text-center text-primary tracking-widest">Docs</TableHead>
                      )}
                      <TableHead className="text-right text-[8px] font-black uppercase pr-4 text-primary/60">Acción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length > 0 ? filteredRecords.map((rec, idx) => (
                    <TableRow key={rec.id} className="hover:bg-primary/[0.01] transition-all duration-300 group border-b border-slate-50 last:border-0 h-10">
                      <TableCell className="text-center font-black text-[8px] text-muted-foreground/60 pl-3">{idx + 1}.</TableCell>
                      <TableCell className="font-black text-[9px] text-primary">{activeTab === 'ATRES' ? rec.id : rec.cct}</TableCell>
                      <TableCell className="py-1">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-800 uppercase leading-tight truncate max-w-[120px]">
                            {activeTab === 'Geoposición' ? rec.longitud : rec.schoolName}
                          </span>
                          {activeTab !== 'Geoposición' && (
                            <span className="text-[6px] font-black text-muted-foreground uppercase tracking-wider opacity-60 truncate max-w-[120px]">
                              {rec.municipio}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {activeTab === 'Geoposición' ? <span className="text-[8px] font-mono font-black text-slate-600 bg-slate-100 px-1 py-0.5 rounded">{rec.latitud}</span> : 
                         activeTab === 'ATRES' ? <Badge variant="outline" className="text-[6px] font-black uppercase border-primary/10 bg-primary/5 text-primary py-0 px-1.5 rounded-full">{rec.tipoIncidencia || 'mantenimiento'}</Badge> :
                         <Badge variant="outline" className={cn("text-[6px] font-black uppercase py-0 px-1.5 rounded-full", rec.status === 'activo' || rec.status === 'pendiente' ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-emerald-200 text-emerald-700 bg-emerald-50')}>
                           {rec.status?.toUpperCase() || 'ACTIVO'}
                         </Badge>}
                      </TableCell>
                      <TableCell className="text-center">
                        {activeTab === 'Geoposición' ? (
                          <div className={cn("h-5 inline-flex items-center justify-center gap-1 px-2 rounded-md text-[7px] font-black uppercase border", rec.status === 'activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100')}>
                            <Circle className={cn("h-1 w-1 fill-current", rec.status === 'activo' ? 'text-emerald-500' : 'text-rose-500')} />
                            {rec.status?.toUpperCase() || 'ACTIVO'}
                          </div>
                        ) : activeTab === 'Biblioteca Digital' ? (
                          <span className="text-[8px] font-black text-primary bg-primary/5 px-1.5 py-0 rounded-full">{rec.numeroEquipos || 0} EQ.</span>
                        ) : activeTab === 'ATRES' ? (
                          <div className={cn("h-5 inline-flex items-center justify-center gap-1 px-2 rounded-md text-[7px] font-black uppercase border", rec.status === 'atendido' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : (rec.status === 'en proceso' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-rose-50 text-rose-700 border-rose-100'))}>
                            <Circle className={cn("h-1 w-1 fill-current", rec.status === 'atendido' ? 'text-emerald-500' : (rec.status === 'en proceso' ? 'text-amber-500' : 'text-rose-500'))} />
                            {rec.status?.replace('activo', 'atendido') || 'PENDIENTE'}
                          </div>
                        ) : (
                          <span className="text-[7px] font-mono lowercase bg-slate-50 px-1 py-0 rounded border border-slate-100 truncate block max-w-[100px] mx-auto">{rec.email || 'S/D'}</span>
                        )}
                      </TableCell>
                      {(activeTab === 'Biblioteca Digital' || activeTab === 'ATRES' || activeTab === 'Cuentas Institucionales' || activeTab === 'Conoce mi Escuela') && (
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-[7px] font-black bg-accent/5 border-accent/20 text-accent py-0 px-1.5 rounded-lg">
                            {rec.asistentes?.length || 0} PERS.
                          </Badge>
                        </TableCell>
                      )}
                      {activeTab === 'ATRES' && (
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-1">
                             {rec.reportPdf && <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600 bg-blue-50/50 hover:bg-blue-100 rounded-md" onClick={() => setEvidenceToView({ type: 'pdf', data: rec.reportPdf!, title: `Doc ${rec.id}` })}><FileText className="h-3 w-3" /></Button>}
                             {rec.evidencePhotos && rec.evidencePhotos.length > 0 && <Button variant="ghost" size="icon" className="h-6 w-6 text-pink-600 bg-pink-50/50 hover:bg-pink-100 rounded-md" onClick={() => setEvidenceToView({ type: 'gallery', data: rec.evidencePhotos!, title: `Fotos ${rec.id}` })}><ImageIcon className="h-3 w-3" /></Button>}
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="text-right pr-4">
                         <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(rec)} className="h-6 w-6 text-slate-400 hover:text-primary bg-slate-50/50 hover:bg-primary/5 rounded-md transition-all"><Pencil className="h-2.5 w-2.5" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteRecord(rec.id)} className="h-6 w-6 text-rose-300 hover:text-rose-600 bg-slate-50/50 hover:bg-rose-50 rounded-md transition-all"><Trash2 className="h-2.5 w-2.5" /></Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 bg-slate-50/20">
                        <div className="flex flex-col items-center gap-1.5 opacity-40">
                           <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                              <Search className="h-5 w-5 text-slate-400" />
                           </div>
                           <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">Sin registros.</p>
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
        <DialogContent className="sm:max-w-[1000px] rounded-[2rem] h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-3xl">
          <DialogHeader className="p-6 pb-3 bg-slate-50 border-b">
            <DialogTitle className="uppercase font-black text-primary text-xl flex items-center gap-3 tracking-tighter">
              <div className="h-10 w-10 rounded-lg bg-primary text-white flex items-center justify-center shadow-xl">
                <Target className="h-6 w-6" />
              </div>
              Gestión Integral de {activeTab}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="auditoria" className="flex-1 flex flex-col overflow-hidden">
             <div className="px-6 border-b bg-white">
                <TabsList className="bg-transparent h-12 p-0 gap-6">
                  <TabsTrigger value="auditoria" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-[10px] font-black uppercase tracking-wider transition-all">1. Auditoría Técnica</TabsTrigger>
                  {(activeTab === 'Biblioteca Digital' || activeTab === 'Cuentas Institucionales' || activeTab === 'Conoce mi Escuela' || activeTab === 'ATRES') && (
                    <TabsTrigger value="asistentes" disabled={activeTab === 'Biblioteca Digital' && formData.capacitacion === 'N'} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-[10px] font-black uppercase tracking-wider transition-all">2. Censo de Personal</TabsTrigger>
                  )}
                </TabsList>
             </div>

             <div className="flex-1 overflow-hidden bg-slate-50/30">
                <TabsContent value="auditoria" className="h-full m-0 p-0 overflow-hidden">
                  <ScrollArea className="h-full px-6">
                    <div className="grid gap-6 py-6">
                      <div className="p-6 bg-white rounded-3xl border border-primary/5 space-y-4 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.02]">
                          <School className="h-24 w-24" />
                        </div>
                        <div className="space-y-2 relative z-10">
                           <Label className="text-[10px] font-black uppercase text-primary tracking-[0.1em] flex items-center gap-2 pl-2">
                              <Search className="h-3.5 w-3.5 text-accent" /> Localizador de Planteles
                           </Label>
                           <Input 
                              placeholder="CCT o Nombre del Plantel..." 
                              className="h-11 rounded-xl bg-slate-50 border-primary/10 font-bold uppercase shadow-inner text-sm px-5 focus:bg-white transition-all" 
                              value={dialogSearchTerm} 
                              onChange={(e) => {
                                setDialogSearchTerm(e.target.value);
                                if (e.target.value.length === 10) handleCctChange(e.target.value);
                              }} 
                           />
                        </div>
                        
                        {dialogSearchTerm && dialogSearchTerm.length > 2 && (
                          <div className="absolute z-[100] left-6 right-6 top-[95px] max-h-60 overflow-auto bg-white border border-slate-200 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 divide-y divide-slate-50">
                            {schoolsDirectory.filter(s => 
                              (s.nombre || '').toUpperCase().includes(dialogSearchTerm.toUpperCase()) || 
                              (s.cct || '').toUpperCase().includes(dialogSearchTerm.toUpperCase())
                            ).slice(0, 6).map(s => (
                              <div 
                                key={`${s.cct}-${s.turno}`} 
                                className="p-3 hover:bg-primary/5 cursor-pointer transition-colors flex justify-between items-center group" 
                                onClick={() => { populateWithSchool(s); setDialogSearchTerm(''); }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                     <School className="h-4 w-4" />
                                  </div>
                                  <div className="flex flex-col">
                                     <span className="text-[10px] font-black text-slate-800 uppercase">{s.nombre}</span>
                                     <span className="text-[8px] font-mono text-muted-foreground font-black tracking-wider">{s.cct} • {s.municipio}</span>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-[7px] font-black uppercase border-primary/20 bg-primary/5 text-primary px-2 py-0.5 rounded-full">{s.modalidad}</Badge>
                              </div>
                            ))}
                          </div>
                        )}

                        {formData.cct && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 animate-in slide-in-from-top-2 duration-500">
                             <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 flex items-center gap-3">
                               <Building2 className="h-5 w-5 text-primary opacity-40" />
                               <div>
                                 <p className="text-[7px] font-black text-primary/60 uppercase tracking-widest leading-none mb-1">Municipio / Región</p>
                                 <p className="text-[9px] font-black text-primary uppercase">{formData.municipio} • {formData.region}</p>
                               </div>
                             </div>
                             <div className="p-3 bg-accent/5 rounded-lg border border-accent/10 flex items-center gap-3">
                               <Target className="h-5 w-5 text-accent opacity-40" />
                               <div>
                                 <p className="text-[7px] font-black text-accent/60 uppercase tracking-widest leading-none mb-1">ZE / Sector</p>
                                 <p className="text-[9px] font-black text-accent uppercase">ZE {formData.zonaEscolar} • Sector {formData.sector}</p>
                               </div>
                             </div>
                          </div>
                        )}
                      </div>

                      {activeTab === 'ATRES' ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest pl-2">Tipo de Incidencia</Label>
                              <Select value={formData.tipoIncidencia} onValueChange={(val: any) => setFormData({...formData, tipoIncidencia: val})}>
                                <SelectTrigger className="h-10 bg-white rounded-lg border-slate-200 shadow-sm font-bold text-[10px] uppercase"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-lg">
                                  {['red edusat', 'red local', 'mantenimiento', 'teleplanteles', 'cuenta institucional'].map(t => <SelectItem key={t} value={t} className="uppercase font-bold text-[9px]">{t}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest pl-2">Estatus Operativo</Label>
                              <Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val})}>
                                <SelectTrigger className="h-10 bg-white rounded-lg border-slate-200 shadow-sm font-bold text-[10px] uppercase"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-lg">
                                  {['pendiente', 'en proceso', 'atendido'].map(s => <SelectItem key={s} value={s} className="uppercase font-bold text-[9px]">{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest pl-2">Oficina de Atención</Label>
                              <Select value={formData.oficinaRegionalAtencion} onValueChange={(val) => setFormData({...formData, oficinaRegionalAtencion: val})}>
                                <SelectTrigger className="h-10 bg-white rounded-lg border-slate-200 shadow-sm font-bold text-[10px] uppercase"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                <SelectContent className="rounded-lg">
                                  {REGIONAL_OFFICES.map(off => (
                                    <SelectItem key={off} value={off} className="uppercase font-bold text-[9px]">{off.replace("Oficina de ", "")}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {formData.tipoIncidencia === 'mantenimiento' && (
                            <div className="p-5 bg-white rounded-3xl border border-slate-100 space-y-4 shadow-md">
                               <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                    <Monitor className="h-5 w-5" />
                                  </div>
                                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Módulo de Mantenimiento</h3>
                               </div>
                               <div className="border rounded-xl overflow-hidden shadow-sm bg-slate-50/50">
                                  <Table>
                                    <TableHeader className="bg-slate-100/80">
                                      <TableRow className="h-9">
                                        <TableHead className="w-10 text-[8px] font-black uppercase text-center">N.P.</TableHead>
                                        <TableHead className="text-[8px] font-black uppercase">Equipo</TableHead>
                                        <TableHead className="text-[8px] font-black uppercase">Marca</TableHead>
                                        <TableHead className="text-[8px] font-black uppercase">Serie</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {Array.from({ length: 4 }).map((_, idx) => (
                                        <TableRow key={idx} className="h-9 hover:bg-white transition-colors">
                                          <TableCell className="text-center font-black text-[9px] text-primary/40">{idx + 1}</TableCell>
                                          <TableCell className="p-1"><Input className="h-7 text-[9px] uppercase font-bold bg-white" value={formData.mantenimientoDetalle?.equipos[idx]?.equipo || ''} onChange={e => handleMantenimientoTableChange(idx, 'equipo', e.target.value.toUpperCase())} /></TableCell>
                                          <TableCell className="p-1"><Input className="h-7 text-[9px] uppercase font-bold bg-white" value={formData.mantenimientoDetalle?.equipos[idx]?.marca || ''} onChange={e => handleMantenimientoTableChange(idx, 'marca', e.target.value.toUpperCase())} /></TableCell>
                                          <TableCell className="p-1"><Input className="h-7 text-[9px] uppercase font-bold bg-white" value={formData.mantenimientoDetalle?.equipos[idx]?.serie || ''} onChange={e => handleMantenimientoTableChange(idx, 'serie', e.target.value.toUpperCase())} /></TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                               </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                             <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase text-primary tracking-widest pl-2">Reporte Oficial (PDF)</Label>
                                <div className="p-4 border-dashed border-2 rounded-xl bg-white text-center space-y-2 hover:border-primary/20 transition-all cursor-pointer">
                                   <Input type="file" accept=".pdf" className="h-8 bg-slate-50 border-none rounded-md text-[9px]" onChange={e => handleFileChange(e, 'pdf')} />
                                   {formData.reportPdf && <Badge className="bg-emerald-500 text-white font-black text-[7px] py-0.5 px-3">✓ VINCULADO</Badge>}
                                </div>
                             </div>
                             <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase text-primary tracking-widest pl-2">Evidencias Fotográficas</Label>
                                <div className="p-4 border-dashed border-2 rounded-xl bg-white text-center space-y-2 hover:border-accent/20 transition-all cursor-pointer">
                                   <Input type="file" multiple accept="image/*" className="h-8 bg-slate-50 border-none rounded-md text-[9px]" onChange={e => handleFileChange(e, 'photo')} />
                                   <div className="flex gap-1.5 justify-center flex-wrap mt-1">
                                      {formData.evidencePhotos?.map((p, i) => (
                                        <div key={i} className="h-8 w-8 rounded-md border border-slate-100 shadow-sm overflow-hidden relative">
                                          <Image src={p} alt="ev" fill className="object-cover" />
                                        </div>
                                      ))}
                                   </div>
                                </div>
                             </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-[9px] font-black uppercase text-primary tracking-widest pl-2"># Solicitud / Folio</Label>
                              <Input className="h-10 font-mono font-black uppercase bg-white border-slate-200 rounded-lg text-sm px-4" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[9px] font-black uppercase text-primary tracking-widest pl-2">Oficina Regional</Label>
                              <Select value={formData.oficinaRegionalAtencion} onValueChange={(val) => setFormData({...formData, oficinaRegionalAtencion: val})}>
                                <SelectTrigger className="h-10 bg-white rounded-lg border-slate-200 shadow-sm font-bold text-[10px] uppercase"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                <SelectContent className="rounded-lg">
                                  {REGIONAL_OFFICES.map(off => (
                                    <SelectItem key={off} value={off} className="uppercase font-bold text-[9px]">{off.replace("Oficina de ", "")}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {activeTab === 'Biblioteca Digital' && (
                               <div className="space-y-1.5">
                                  <Label className="text-[9px] font-black uppercase text-primary tracking-widest pl-2">Equipos Tecnológicos</Label>
                                  <Input type="number" className="h-10 font-black text-lg text-center bg-white border-slate-200 rounded-lg" value={formData.numeroEquipos} onChange={e => setFormData({...formData, numeroEquipos: parseInt(e.target.value) || 0})} />
                               </div>
                            )}
                            {activeTab === 'Biblioteca Digital' && (
                               <div className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm h-10 mt-auto">
                                  <Checkbox id="capacitacion" checked={formData.capacitacion === 'S'} onCheckedChange={(checked) => setFormData({...formData, capacitacion: checked ? 'S' : 'N'})} className="h-4 w-4 rounded" />
                                  <Label htmlFor="capacitacion" className="text-[9px] font-black uppercase text-primary cursor-pointer tracking-wider">¿Capacitación?</Label>
                               </div>
                            )}
                            <div className="col-span-2 space-y-1.5">
                              <Label className="text-[9px] font-black uppercase text-primary tracking-widest pl-2">Observaciones</Label>
                              <Textarea className="min-h-[80px] bg-white border-slate-200 rounded-xl p-4 text-xs font-semibold shadow-inner" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder="Detalle técnico..." />
                            </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="asistentes" className="h-full m-0 p-6 flex flex-col">
                  <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center gap-3 flex-1">
                      <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                        <Info className="h-4 w-4" />
                      </div>
                      <p className="text-[9px] font-black text-blue-900 uppercase leading-tight tracking-wide">
                        Censo Institucional: Registre al personal y las cuentas <br /> institucionales asignadas a este centro de trabajo.
                      </p>
                    </div>
                    <Button onClick={() => { setAssistantForm({nombres: '', paterno: '', materno: '', rfc: '', funcion: '', email: ''}); setIsAssistantDialogOpen(true); }} className="gap-2 font-black uppercase text-[9px] h-10 px-5 rounded-lg shadow-md hover:scale-105 transition-all">
                      <UserPlus className="h-3.5 w-3.5" /> Añadir Personal
                    </Button>
                  </div>
                  <div className="flex-1 overflow-hidden border border-slate-100 rounded-2xl bg-white shadow-lg">
                    <ScrollArea className="h-full">
                      <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b">
                          <TableRow className="h-10">
                            <TableHead className="text-[8px] font-black uppercase pl-6 text-primary">Nombre del Servidor</TableHead>
                            <TableHead className="text-[8px] font-black uppercase text-primary">RFC Oficial</TableHead>
                            <TableHead className="text-[8px] font-black uppercase text-primary text-center">Función</TableHead>
                            <TableHead className="text-right text-[8px] font-black uppercase pr-6 text-primary">Gestión</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.asistentes?.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-12 opacity-30 italic text-[9px]">No hay personal registrado.</TableCell>
                            </TableRow>
                          ) : formData.asistentes?.map((ast: any, idx: number) => (
                            <TableRow key={idx} className="h-11 hover:bg-slate-50 transition-colors">
                              <TableCell className="pl-6 font-black text-[10px] uppercase text-slate-700">{ast.nombres} {ast.paterno} {ast.materno}</TableCell>
                              <TableCell className="font-mono text-[10px] font-black text-primary">{ast.rfc}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="text-[7px] font-black bg-white border-slate-100">{ast.funcion || 'S/D'}</Badge>
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-primary rounded-md" onClick={() => { setAssistantForm(ast); setEditingAssistantIndex(idx); setIsAssistantDialogOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-300 hover:text-rose-600 rounded-md" onClick={() => { setFormData({...formData, asistentes: formData.asistentes?.filter((_, i) => i !== idx)}); }}><Trash2 className="h-3 w-3" /></Button>
                                </div>
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
          
          <DialogFooter className="p-6 gap-3 border-t bg-slate-50 flex items-center justify-between">
            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-inner flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary opacity-30" />
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase leading-none">Censo</p>
                <p className="text-[10px] font-black text-primary uppercase leading-none mt-0.5">{formData.asistentes?.length || 0} Reg.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-10 px-6 text-[9px] font-black uppercase tracking-widest rounded-lg">Cancelar</Button>
              <Button onClick={handleSave} className="btn-institutional h-10 px-8 text-[9px] shadow-xl">Guardar Registro</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visitas Scheduler Modal */}
      <VisitSchedulerDialog 
        open={isSchedulerOpen} 
        onOpenChange={setIsSchedulerOpen} 
        areaId="programas" 
        areaName="Programas" 
      />

      <Dialog open={!!evidenceToView} onOpenChange={() => setEvidenceToView(null)}>
        <DialogContent className="max-w-3xl h-[75vh] flex flex-col p-0 overflow-hidden rounded-[2rem] border-none shadow-3xl">
          <DialogHeader className="p-6 border-b bg-slate-50">
            <DialogTitle className="uppercase font-black text-primary text-lg flex items-center gap-4">
              {evidenceToView?.type === 'pdf' ? (
                <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-lg"><FileText className="h-5 w-5" /></div>
              ) : (
                <div className="h-8 w-8 rounded-lg bg-pink-600 text-white flex items-center justify-center shadow-lg"><ImageIcon className="h-5 w-5" /></div>
              )}
              {evidenceToView?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 bg-slate-200 relative">
             {evidenceToView?.type === 'pdf' ? <iframe src={evidenceToView.data as string} className="w-full h-full border-none" /> : 
                <ScrollArea className="h-full p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(evidenceToView?.data as string[])?.map((img, i) => (
                      <div key={i} className="relative aspect-video rounded-2xl overflow-hidden border-2 border-white shadow-lg transform transition-transform hover:scale-105 duration-500">
                        <Image src={img} alt="ev" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>}
          </div>
          <div className="p-4 border-t bg-white flex justify-end">
            <Button variant="secondary" onClick={() => setEvidenceToView(null)} className="font-black uppercase text-[9px] h-9 px-6 rounded-lg">Cerrar Visor</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssistantDialogOpen} onOpenChange={setIsAssistantDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 rounded-[1.5rem] overflow-hidden border-none shadow-3xl">
          <DialogHeader className="p-6 bg-slate-50 border-b">
            <DialogTitle className="uppercase font-black text-primary text-lg flex items-center gap-3">
              <UserPlus className="h-6 w-6 text-accent" /> Registro de Personal
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 p-6 bg-white">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-slate-400 pl-1">Nombres</Label>
                <Input className="h-9 bg-slate-50 border-none rounded-md font-bold uppercase text-[10px]" value={assistantForm.nombres} onChange={e => setAssistantForm({...assistantForm, nombres: e.target.value.toUpperCase()})} />
              </div>
              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-slate-400 pl-1">Ap. Paterno</Label>
                <Input className="h-9 bg-slate-50 border-none rounded-md font-bold uppercase text-[10px]" value={assistantForm.paterno} onChange={e => setAssistantForm({...assistantForm, pather: e.target.value.toUpperCase()})} />
              </div>
              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-slate-400 pl-1">RFC Oficial</Label>
                <Input className="h-9 bg-slate-50 border-none rounded-md font-mono font-black uppercase text-[10px]" maxLength={13} value={assistantForm.rfc} onChange={e => setAssistantForm({...assistantForm, rfc: e.target.value.toUpperCase()})} />
              </div>
              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-slate-400 pl-1">Función</Label>
                <Select value={assistantForm.funcion} onValueChange={(val) => setAssistantForm({...assistantForm, funcion: val})}>
                  <SelectTrigger className="h-9 bg-slate-50 border-none rounded-md font-black uppercase text-[9px]"><SelectValue placeholder="Elegir..." /></SelectTrigger>
                  <SelectContent className="rounded-md">
                    {['DOCENTE', 'DIRECTIVO', 'ADMINISTRATIVO', 'TÉCNICO', 'ATP'].map(f => <SelectItem key={f} value={f} className="text-[9px] font-black uppercase">{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t">
            <Button onClick={handleSaveAssistant} className="btn-institutional w-full h-11 rounded-lg text-[9px] shadow-xl">Actualizar Lista</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}