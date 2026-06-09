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
    <div className="space-y-2 animate-in fade-in duration-700 max-w-full overflow-hidden">
      {/* Header Institucional - Ultra Compacto */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 border-b border-primary/5 pb-1.5">
        <div className="space-y-0">
          <h2 className="text-base font-black tracking-tight text-primary uppercase leading-none">Módulos Técnicos COEES</h2>
          <div className="flex items-center gap-1.5 bg-white/50 backdrop-blur-sm px-2 py-0.5 rounded-full border border-primary/5 shadow-sm inline-flex">
            <Activity className="h-2 w-2 text-accent" /> 
            <p className="text-[6px] font-black uppercase text-muted-foreground tracking-[0.05em]">Auditoría 2026</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 w-full lg:w-auto">
          {activeTab === 'ATRES' && (
            <Button 
              onClick={() => setIsHelpDeskOpen(true)} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-2.5 rounded-md shadow-sm font-black uppercase text-[6px] gap-1 transition-all active:scale-95"
            >
              <Headset className="h-2.5 w-2.5" /> Mesa ATRES
            </Button>
          )}
          <Button 
            onClick={() => { setFormData({...initialFormState, name: activeTab}); setEditingId(null); setIsDialogOpen(true); setDialogSearchTerm(''); }} 
            className="btn-institutional h-7 px-3 rounded-md shadow-sm text-[6px] flex items-center justify-center tracking-wider"
          >
            <PlusCircle className="h-2.5 w-2.5 mr-1" /> Nuevo Registro
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSearchTerm(''); }} className="space-y-2">
        <div className="w-full overflow-x-auto">
          <TabsList className="min-w-max h-7 bg-white/50 backdrop-blur-md border border-slate-200 p-0.5 rounded-md shadow-sm gap-0.5">
            {PROGRAM_RUBROS.map(rubro => (
              <TabsTrigger 
                key={rubro} 
                value={rubro} 
                className="h-full px-2 text-[6px] font-black uppercase rounded-sm data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
              >
                {rubro}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {activeTab === 'ATRES' && (
          <Card className="executive-card p-2 bg-emerald-50/20 border-emerald-100 border overflow-hidden relative max-w-full">
            <div className="flex items-center gap-3 relative z-10">
               <div className="bg-white p-1.5 rounded-lg shadow-md border border-emerald-100 shrink-0">
                  <div className="relative h-12 w-12 flex items-center justify-center bg-slate-50 rounded-md">
                     {helpDeskUrl ? (
                       <div className="relative h-10 w-10">
                         <Image src={qrCodeApiUrl} alt="QR Acceso" fill className="object-contain" />
                       </div>
                     ) : (
                       <Circle className="h-6 w-6 text-slate-200 animate-pulse" />
                     )}
                  </div>
               </div>
               
               <div className="flex-1 space-y-1 min-w-0">
                  <div className="space-y-0">
                    <Badge className="bg-emerald-600 text-white font-black uppercase text-[5px] px-1 py-0 rounded-sm">Oficial</Badge>
                    <h3 className="text-[10px] font-black text-emerald-900 uppercase leading-none">Acceso Directo para Docentes</h3>
                    <p className="text-[6px] font-semibold text-emerald-700/80 leading-none">Escanee para soporte técnico remoto.</p>
                  </div>
                  
                  <div className="flex gap-1.5 items-center w-full max-w-md">
                    <div className="flex-1 h-6 bg-white rounded-md border border-emerald-100 flex items-center px-2 gap-1.5 shadow-inner overflow-hidden">
                       <ExternalLink className="h-2 w-2 text-emerald-600 shrink-0" />
                       <span className="font-mono text-[6px] font-bold text-emerald-800 flex-1 truncate">
                         {helpDeskUrl}
                       </span>
                       <Button variant="ghost" size="sm" onClick={copyHelpDeskUrl} className="h-4 px-1 rounded-sm text-emerald-600 hover:bg-emerald-50 gap-0.5 shrink-0">
                          <Copy className="h-2 w-2" /> <span className="text-[5px] font-black uppercase">Copiar</span>
                       </Button>
                    </div>
                    <Button onClick={() => window.open('/helpdesk', '_blank')} className="h-6 px-2 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[6px] gap-1 shadow-sm shrink-0">
                       Portal <ExternalLink className="h-2 w-2" />
                    </Button>
                  </div>
               </div>
            </div>
          </Card>
        )}

        {/* Barra Operativa de Filtros - Compacta */}
        <Card className="executive-card p-1.5 bg-white/80 border-none shadow-md border-t-2 border-t-primary max-w-full overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-1.5">
             <div className="relative flex-1 w-full min-w-0">
                <Input 
                  placeholder="CCT O NOMBRE..." 
                  className="h-7 rounded-md bg-slate-50 border-primary/5 pl-7 text-[7px] font-bold uppercase shadow-inner focus:bg-white transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-2 top-2 h-3 w-3 text-slate-300" />
             </div>

             <div className="flex items-center gap-1.5 w-full md:w-auto shrink-0">
                <Select value={officeFilter} onValueChange={setOfficeFilter}>
                  <SelectTrigger className="h-7 w-[110px] rounded-md border-primary/5 bg-white text-[7px] font-black uppercase shadow-sm">
                      <SelectValue placeholder="OFICINA..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-md border-slate-200">
                    <SelectItem value="all" className="text-[7px] font-black uppercase">Todas</SelectItem>
                    {REGIONAL_OFFICES.map(off => (
                      <SelectItem key={off} value={off} className="text-[7px] font-black uppercase">{off.replace("Oficina de Tecnóloga Educativa ", "").replace("Oficina de ", "")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" className="h-7 px-2 border-primary/10 text-primary font-black uppercase text-[6px] gap-1 rounded-md hover:bg-primary/5 shadow-sm" onClick={() => setIsSchedulerOpen(true)}>
                  <CalendarDays className="h-3 w-3" /> Agenda
                </Button>
             </div>
          </div>
        </Card>

        <TabsContent value={activeTab} className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none max-w-full overflow-hidden">
          <Card className="executive-card p-0 shadow-lg border-none overflow-hidden bg-white max-w-full">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80 backdrop-blur-sm border-b">
                   <TableRow className="h-7">
                      <TableHead className="w-6 text-[7px] font-black uppercase text-center pl-2 text-primary/60">#</TableHead>
                      <TableHead className="text-[7px] font-black uppercase text-primary tracking-widest">{activeTab === 'ATRES' ? 'Folio' : 'CCT'}</TableHead>
                      <TableHead className="text-[7px] font-black uppercase text-primary tracking-widest">
                        {activeTab === 'Geoposición' ? 'Longitud' : 'Plantel'}
                      </TableHead>
                      <TableHead className="text-[7px] font-black uppercase text-primary tracking-widest">
                        {activeTab === 'Geoposición' ? 'Latitud' : activeTab === 'ATRES' ? 'Incidencia' : 'Estatus'}
                      </TableHead>
                      <TableHead className="text-[7px] font-black uppercase text-center text-primary tracking-widest">
                        {activeTab === 'Geoposición' ? 'Edo' : activeTab === 'Biblioteca Digital' ? 'Eq' : activeTab === 'ATRES' ? 'Est' : 'Email'}
                      </TableHead>
                      {(activeTab === 'Biblioteca Digital' || activeTab === 'ATRES' || activeTab === 'Cuentas Institucionales' || activeTab === 'Conoce mi Escuela') && (
                        <TableHead className="text-[7px] font-black uppercase text-center text-primary tracking-widest">Pers</TableHead>
                      )}
                      <TableHead className="text-right text-[7px] font-black uppercase pr-2 text-primary/60">Gestión</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length > 0 ? filteredRecords.map((rec, idx) => (
                    <TableRow key={rec.id} className="hover:bg-primary/[0.01] transition-all duration-300 group border-b border-slate-50 last:border-0 h-8">
                      <TableCell className="text-center font-black text-[7px] text-muted-foreground/60 pl-2">{idx + 1}.</TableCell>
                      <TableCell className="font-black text-[8px] text-primary">{activeTab === 'ATRES' ? rec.id : rec.cct}</TableCell>
                      <TableCell className="py-0.5">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold text-slate-800 uppercase leading-none truncate max-w-[100px]">
                            {activeTab === 'Geoposición' ? rec.longitud : rec.schoolName}
                          </span>
                          {activeTab !== 'Geoposición' && (
                            <span className="text-[5px] font-black text-muted-foreground uppercase opacity-60 truncate max-w-[100px]">
                              {rec.municipio}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {activeTab === 'Geoposición' ? <span className="text-[7px] font-mono text-slate-600">{rec.latitud}</span> : 
                         activeTab === 'ATRES' ? <Badge variant="outline" className="text-[5px] font-black uppercase border-primary/10 bg-primary/5 text-primary py-0 px-1 rounded-full">{rec.tipoIncidencia?.split(' ')[0] || 'mante'}</Badge> :
                         <Badge variant="outline" className={cn("text-[5px] font-black uppercase py-0 px-1 rounded-full", rec.status === 'activo' || rec.status === 'pendiente' ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-emerald-200 text-emerald-700 bg-emerald-50')}>
                           {rec.status?.toUpperCase() || 'ACTIVO'}
                         </Badge>}
                      </TableCell>
                      <TableCell className="text-center">
                         {activeTab === 'Biblioteca Digital' ? (
                          <span className="text-[7px] font-black text-primary bg-primary/5 px-1 py-0 rounded-full">{rec.numeroEquipos || 0}</span>
                        ) : activeTab === 'ATRES' ? (
                          <div className={cn("h-4 inline-flex items-center justify-center px-1 rounded-sm text-[5px] font-black uppercase border", rec.status === 'atendido' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100')}>
                            {rec.status?.replace('activo', 'atendido').substring(0, 3) || 'PEN'}
                          </div>
                        ) : (
                          <span className="text-[6px] font-mono lowercase truncate block max-w-[60px] mx-auto">{rec.email || 'S/D'}</span>
                        )}
                      </TableCell>
                      {(activeTab === 'Biblioteca Digital' || activeTab === 'ATRES' || activeTab === 'Cuentas Institucionales' || activeTab === 'Conoce mi Escuela') && (
                        <TableCell className="text-center">
                          <span className="text-[7px] font-black text-accent">{rec.asistentes?.length || 0}</span>
                        </TableCell>
                      )}
                      <TableCell className="text-right pr-2">
                         <div className="flex justify-end gap-0.5">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(rec)} className="h-5 w-5 text-slate-400 hover:text-primary"><Pencil className="h-2 w-2" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteRecord(rec.id)} className="h-5 w-5 text-rose-300 hover:text-rose-600"><Trash2 className="h-2 w-2" /></Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 bg-slate-50/20">
                         <p className="text-[6px] font-black uppercase text-slate-400">Sin registros.</p>
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
        <DialogContent className="sm:max-w-[800px] rounded-2xl h-[80vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-4 bg-slate-50 border-b">
            <DialogTitle className="uppercase font-black text-primary text-sm flex items-center gap-2">
              <Target className="h-4 w-4" /> Gestión de {activeTab}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="auditoria" className="flex-1 flex flex-col overflow-hidden">
             <div className="px-4 border-b bg-white">
                <TabsList className="bg-transparent h-9 p-0 gap-4">
                  <TabsTrigger value="auditoria" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-0 py-2 text-[8px] font-black uppercase">1. Auditoría</TabsTrigger>
                  {(activeTab === 'Biblioteca Digital' || activeTab === 'Cuentas Institucionales' || activeTab === 'Conoce mi Escuela' || activeTab === 'ATRES') && (
                    <TabsTrigger value="asistentes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-0 py-2 text-[8px] font-black uppercase">2. Personal</TabsTrigger>
                  )}
                </TabsList>
             </div>

             <div className="flex-1 overflow-hidden bg-slate-50/20">
                <TabsContent value="auditoria" className="h-full m-0 p-4 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-4">
                      <div className="p-4 bg-white rounded-xl border border-primary/5 space-y-2">
                        <Label className="text-[8px] font-black uppercase text-primary flex items-center gap-1.5">
                          <Search className="h-3 w-3 text-accent" /> Localizador de Planteles
                        </Label>
                        <Input 
                          placeholder="CCT o Nombre..." 
                          className="h-8 rounded-lg bg-slate-50 border-primary/10 text-[10px] uppercase px-3" 
                          value={dialogSearchTerm} 
                          onChange={(e) => {
                            setDialogSearchTerm(e.target.value);
                            if (e.target.value.length === 10) handleCctChange(e.target.value);
                          }} 
                        />
                        
                        {dialogSearchTerm && dialogSearchTerm.length > 2 && (
                          <div className="max-h-40 overflow-auto bg-white border border-slate-200 rounded-lg shadow-xl divide-y divide-slate-50 mt-1">
                            {schoolsDirectory.filter(s => 
                              (s.nombre || '').toUpperCase().includes(dialogSearchTerm.toUpperCase()) || 
                              (s.cct || '').toUpperCase().includes(dialogSearchTerm.toUpperCase())
                            ).slice(0, 5).map(s => (
                              <div key={`${s.cct}-${s.turno}`} className="p-2 hover:bg-primary/5 cursor-pointer flex justify-between items-center" onClick={() => { populateWithSchool(s); setDialogSearchTerm(''); }}>
                                <span className="text-[8px] font-black uppercase truncate max-w-[200px]">{s.nombre}</span>
                                <Badge className="text-[6px] py-0">{s.cct}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1">
                            <Label className="text-[7px] font-black uppercase text-slate-500 pl-1">ID / Folio</Label>
                            <Input className="h-8 text-[9px] uppercase font-bold" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} />
                         </div>
                         <div className="space-y-1">
                            <Label className="text-[7px] font-black uppercase text-slate-500 pl-1">Oficina</Label>
                            <Select value={formData.oficinaRegionalAtencion} onValueChange={(val) => setFormData({...formData, oficinaRegionalAtencion: val})}>
                              <SelectTrigger className="h-8 text-[8px] uppercase font-bold"><SelectValue placeholder="..." /></SelectTrigger>
                              <SelectContent>
                                {REGIONAL_OFFICES.map(off => <SelectItem key={off} value={off} className="text-[8px] uppercase">{off.replace("Oficina de ", "")}</SelectItem>)}
                              </SelectContent>
                            </Select>
                         </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[7px] font-black uppercase text-slate-500 pl-1">Observaciones</Label>
                        <Textarea className="min-h-[60px] text-[9px]" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} />
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="asistentes" className="h-full m-0 p-4 flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[7px] font-black text-blue-900 uppercase">Censo de Personal</p>
                    <Button onClick={() => { setAssistantForm({nombres: '', paterno: '', materno: '', rfc: '', funcion: '', email: ''}); setIsAssistantDialogOpen(true); }} className="h-6 px-2 text-[6px] gap-1">
                      <UserPlus className="h-2.5 w-2.5" /> Añadir
                    </Button>
                  </div>
                  <div className="flex-1 overflow-hidden border border-slate-100 rounded-lg bg-white">
                    <ScrollArea className="h-full">
                      <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b">
                          <TableRow className="h-6">
                            <TableHead className="text-[6px] font-black uppercase pl-4">Nombre</TableHead>
                            <TableHead className="text-[6px] font-black uppercase">RFC</TableHead>
                            <TableHead className="text-right text-[6px] font-black uppercase pr-4">Acción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.asistentes?.length === 0 ? (
                            <TableRow><TableCell colSpan={3} className="text-center py-4 text-[6px]">Sin personal.</TableCell></TableRow>
                          ) : formData.asistentes?.map((ast: any, idx: number) => (
                            <TableRow key={idx} className="h-7">
                              <TableCell className="pl-4 text-[8px] font-bold uppercase truncate max-w-[150px]">{ast.nombres} {ast.paterno}</TableCell>
                              <TableCell className="font-mono text-[8px]">{ast.rfc}</TableCell>
                              <TableCell className="text-right pr-4">
                                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => { setFormData({...formData, asistentes: formData.asistentes?.filter((_, i) => i !== idx)}); }}><Trash2 className="h-2 w-2 text-rose-400" /></Button>
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
          
          <DialogFooter className="p-3 gap-2 border-t bg-slate-50 flex items-center justify-end">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-8 px-4 text-[7px] font-black uppercase">Cancelar</Button>
              <Button onClick={handleSave} className="btn-institutional h-8 px-6 text-[7px]">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VisitSchedulerDialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen} areaId="programas" areaName="Programas" />
    </div>
  )
}
