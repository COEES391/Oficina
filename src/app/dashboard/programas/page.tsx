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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { programsData, type ProgramStatus } from "@/lib/planning-data"
import { schoolsDirectory } from "@/lib/schools-directory"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { 
  PlusCircle, 
  Pencil, 
  Trash2,
  Activity,
  Target,
  MapPin,
  Calendar,
  Mail,
  CheckCircle2,
  Users,
  Plus,
  School,
  FileText,
  ImageIcon,
  X,
  ExternalLink,
  Eye,
  Info,
  Search,
  Radio,
  UserCog,
  Network,
  Tv,
  Monitor
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from 'next/image'

const PROGRAM_RUBROS = [
  'Biblioteca Digital',
  'Cuentas Institucionales',
  'Geoposición',
  'Conoce mi Escuela',
  'ATRES'
];

const FUNCIONES = [
  "ADMINISTRATIVO",
  "DOCENTE",
  "DIRECTIVO",
  "JEFE DE ENSEÑANZA",
  "SUPERVISOR",
  "ASESOR TECNICO PEDAGOGICO",
  "INTENDENTE",
  "PREFECTO",
  "TRABAJADOR SOCIAL"
]

const REGIONAL_OFFICES = [
  "Oficina de Tecnóloga Educativa Ecatepec",
  "Oficina de Tecnóloga Educativa Naucalpan",
  "Oficina de Tecnóloga Educativa Nezahualcóyotl",
  "Oficina de Tecnóloga Educativa Toluca",
  "Oficina de COEES Tultitlan"
];

const MAINTENANCE_CHECKLIST = [
  "SUSTITUCIÓN DE CONECTORES",
  "SUSTITUCIÓN DE CORDONES DE PARCHEO",
  "SUSTITUCIÓN DE CABLE UTP",
  "SUSTITUCIÓN DE ROSETAS",
  "SUSTITUCIÓN DE CANALETAS",
  "CONFIGURACIÓN DE RED"
];

const EDUSAT_MICROPAK = ['REVISIÓN', 'POLARIZACIÓN', 'PRUEBA', 'CAMBIO'];
const EDUSAT_ANTENA = ['ORIENTACIÓN', 'REPARACIÓN', 'REUBICACIÓN', 'CAMBIO'];
const EDUSAT_DECO_ACCIONES = ['CONFIGURACIÓN', 'REUBICACIÓN', 'CAMBIO'];
const EDUSAT_CABLEADO = ['CAMBIO DE CAMPANAS', 'CAMBIO DE DIVISOR', 'CAMBIO DE CABLE'];
const EDUSAT_PREVENTIVO = ['REVISIÓN GENERAL', 'LIMPIEZA GENERAL', 'CUIDADO PREVENTIVO'];

type AssistantEntry = {
  paterno: string;
  materno: string;
  nombres: string;
  rfc: string;
  genero: 'MASCULINO' | 'FEMENINO' | '';
  funcion: string;
  email: string;
  cct: string;
  nombreCT: string;
  ze: string;
  sector: string;
  modalidad: string;
  municipio: string;
  region: string;
  valle: string;
}

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [activeTab, setActiveTab] = useState(PROGRAM_RUBROS[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [evidenceToView, setEvidenceToView] = useState<{ type: 'pdf' | 'gallery', data: string | string[], title: string } | null>(null)

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
    numCensal: '',
    serieDecodificador: '',
    calidadSeñal: '',
    materialesEdusat: [],
    numNodos: 0,
    switchModelo: '',
    materialesRedLocal: [],
    numDecodificadores: 0,
    numSerie: '',
    estatusSeñal: '',
    numReportes: 0,
    mantenimientoChecklist: [],
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
  const [assistants, setAssistants] = useState<AssistantEntry[]>([
    { paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '' }
  ])

  useEffect(() => {
    setMounted(true)
    const stored = JSON.parse(localStorage.getItem('programs_full') || '[]')
    if (stored.length === 0) {
      setRecords(programsData)
      localStorage.setItem('programs_full', JSON.stringify(programsData))
    } else {
      setRecords(stored)
    }
  }, [])

  const handleCctChange = (val: string) => {
    const cleanVal = val.toUpperCase();
    setFormData(prev => ({ ...prev, cct: cleanVal }));
    
    if (cleanVal.length === 10) {
      const school = schoolsDirectory.find(s => s.cct.toUpperCase() === cleanVal);
      if (school) {
        setFormData(prev => ({
          ...prev,
          schoolName: school.nombre,
          zonaEscolar: school.zonaEscolar,
          sector: school.sector,
          modalidad: school.modalidad,
          municipio: school.municipio,
          valle: school.valle,
          region: school.region,
          email: `${school.cct.toLowerCase()}@desysa.gob.mx`
        }));
      }
    }
  }

  const handleMantenimientoDetalleChange = (index: number, field: string, value: string) => {
    const current = formData.mantenimientoDetalle || initialFormState.mantenimientoDetalle!;
    const newEquipos = [...current.equipos];
    newEquipos[index] = { ...newEquipos[index], [field]: value };
    setFormData({
      ...formData,
      mantenimientoDetalle: { ...current, equipos: newEquipos }
    });
  }

  const handleEdusatChecklistToggle = (category: keyof NonNullable<ProgramStatus['edusatDetalle']>, item: string) => {
    const current = (formData.edusatDetalle?.[category] as string[]) || [];
    const exists = current.includes(item);
    const updated = exists ? current.filter(i => i !== item) : [...current, item];
    setFormData({
      ...formData,
      edusatDetalle: {
        ...formData.edusatDetalle!,
        [category]: updated
      }
    });
  }

  const handleEdusatMaterialChange = (index: number, field: string, value: string) => {
    const current = formData.edusatDetalle || initialFormState.edusatDetalle!;
    const newMaterials = [...current.materiales];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    setFormData({
      ...formData,
      edusatDetalle: { ...current, materiales: newMaterials }
    });
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'photo') => {
    const files = e.target.files
    if (!files) return

    if (type === 'pdf') {
      const file = files[0]
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, reportPdf: reader.result as string })
      }
      reader.readAsDataURL(file)
    } else {
      const newPhotos = Array.from(files)
      if ((formData.evidencePhotos?.length || 0) + newPhotos.length > 5) {
        toast({ variant: "destructive", title: "Límite", description: "Máximo 5 fotos." })
        return
      }
      newPhotos.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            evidencePhotos: [...(prev.evidencePhotos || []), reader.result as string]
          }))
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleSave = () => {
    if (!formData.cct) {
      toast({ variant: "destructive", title: "Datos Incompletos", description: "El CCT es obligatorio." });
      return;
    }
    
    const validAssistants = assistants.filter(a => a.rfc && a.nombres);

    const finalData = {
      ...formData,
      id: editingId || `PROG-${formData.name.substring(0,2).toUpperCase()}-${Date.now()}`,
      asistentes: validAssistants
    };

    const updated = editingId ? records.map(r => r.id === editingId ? finalData : r) : [finalData, ...records];
    setRecords(updated)
    localStorage.setItem('programs_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    setEditingId(null)
    setFormData(initialFormState)
    setAssistants([{ paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '' }])
    toast({ title: "Registro guardado con éxito" })
  }

  const currentTabRecords = useMemo(() => {
    let filtered = records.filter(r => r.name === activeTab);
    
    if (searchTerm) {
      const term = searchTerm.toUpperCase();
      filtered = filtered.filter(r => 
        (r.cct || '').toUpperCase().includes(term) || 
        (r.schoolName || '').toUpperCase().includes(term)
      );
    }
    return filtered;
  }, [records, activeTab, searchTerm]);

  const handleEdit = (rec: ProgramStatus) => {
    setFormData({
      ...rec,
      mantenimientoDetalle: rec.mantenimientoDetalle || initialFormState.mantenimientoDetalle,
      edusatDetalle: rec.edusatDetalle || initialFormState.edusatDetalle
    });
    setEditingId(rec.id);
    if (rec.asistentes && rec.asistentes.length > 0) {
      setAssistants(rec.asistentes);
    } else {
      setAssistants([{ paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '' }]);
    }
    setIsDialogOpen(true);
  }

  const handleAddAssistant = () => {
    setAssistants([...assistants, { paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '' }])
  }

  const handleRemoveAssistant = (index: number) => {
    if (assistants.length === 1) return
    setAssistants(assistants.filter((_, i) => i !== index))
  }

  const updateAssistant = (index: number, field: keyof AssistantEntry, value: string) => {
    const newAssistants = [...assistants]
    newAssistants[index] = { ...newAssistants[index], [field]: value }

    if (field === 'cct') {
      const cleanValue = value.trim().toUpperCase()
      if (cleanValue.length === 10) {
        const school = schoolsDirectory.find(s => s.cct.toUpperCase() === cleanValue)
        if (school) {
          newAssistants[index] = {
            ...newAssistants[index],
            cct: school.cct,
            nombreCT: school.nombre,
            ze: school.zonaEscolar,
            sector: school.sector,
            modalidad: school.modalidad,
            municipio: school.municipio,
            region: school.region,
            valle: school.valle
          }
        }
      }
    }
    setAssistants(newAssistants)
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase leading-none">Módulos Técnicos COEES</h2>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2 mt-1">
            <Activity className="h-4 w-4 text-accent" /> Control de Programas y Auditoría 2026
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSearchTerm(''); }} className="space-y-6">
        <TabsList className="w-full h-12 bg-white border border-slate-100 p-1 rounded-xl shadow-sm">
          {PROGRAM_RUBROS.map(rubro => (
            <TabsTrigger 
              key={rubro} 
              value={rubro} 
              className="flex-1 h-full text-[10px] font-black uppercase rounded-lg tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
            >
              {rubro}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 animate-in fade-in duration-500">
          <Card className="executive-card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                 {activeTab === 'Geoposición' ? <MapPin className="h-6 w-6" /> : <Target className="h-6 w-6" />}
               </div>
               <div>
                 <h3 className="text-xl font-black uppercase text-slate-900 leading-none">{activeTab}</h3>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Registros de Auditoría Técnica</p>
               </div>
             </div>

             <div className="flex flex-1 max-w-md w-full relative">
               <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
               <Input 
                 placeholder="Filtrar por CCT o Plantel..." 
                 className="pl-10 h-10 rounded-xl border-primary/10 bg-slate-50 text-[10px] font-bold uppercase shadow-inner focus:bg-white transition-all"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>

             <Button onClick={() => { setFormData({...initialFormState, name: activeTab}); setEditingId(null); setAssistants([{ paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '' }]); setIsDialogOpen(true); }} className="btn-institutional px-8 text-[11px] h-10">
                <PlusCircle className="h-5 w-5 mr-2" /> Nuevo Registro
             </Button>
          </Card>

          <Card className="executive-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                   <TableRow>
                      <TableHead className="w-12 text-[10px] font-black uppercase text-center">#</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">CCT</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Plantel</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Estatus</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase pr-8">Acción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTabRecords.length > 0 ? currentTabRecords.map((rec, idx) => (
                    <TableRow key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="text-center font-black text-[10px] text-muted-foreground">{idx + 1}.-</TableCell>
                      <TableCell className="font-black text-[10px] text-primary">{rec.cct}</TableCell>
                      <TableCell className="text-sm font-bold text-slate-700 uppercase">{rec.schoolName}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[10px] font-black uppercase px-4 py-1.5", rec.status === 'activo' || rec.status === 'concluido' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400')}>
                          {rec.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                         <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(rec)} className="h-8 w-8 hover:text-primary transition-colors"><Pencil className="h-4 w-4" /></Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={14} className="text-center py-20 bg-slate-50/20">
                         <p className="text-[10px] font-black uppercase text-muted-foreground opacity-50">Sin resultados para la búsqueda.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[1400px] rounded-[2rem] border-none shadow-2xl h-[95vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="uppercase font-black text-primary text-2xl flex items-center gap-3">
              <Target className="h-7 w-7 text-accent" /> Gestión de {activeTab}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="auditoria" className="flex-1 flex flex-col overflow-hidden">
             <div className="px-8 border-b bg-slate-50/50">
                <TabsList className="bg-transparent h-12 p-0 gap-6">
                  <TabsTrigger value="auditoria" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-[11px] font-black uppercase tracking-wider transition-all">
                    1. Datos de Auditoría
                  </TabsTrigger>
                  { (activeTab === 'Biblioteca Digital' || activeTab === 'Cuentas Institucionales') && (
                    <TabsTrigger value="asistentes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-[11px] font-black uppercase tracking-wider transition-all">
                      2. Lista de Cuentas / Personal
                    </TabsTrigger>
                  )}
                </TabsList>
             </div>

             <div className="flex-1 overflow-hidden">
                <TabsContent value="auditoria" className="h-full m-0 p-0 overflow-hidden">
                  <ScrollArea className="h-full px-8">
                    <div className="grid gap-8 py-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2"># Solicitud</Label>
                            <Input className="h-14 font-mono uppercase border-primary/10 text-lg bg-slate-50 focus:bg-white" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-primary tracking-widest">Estatus</Label>
                            <Select value={formData.status} onValueChange={(val:any) => setFormData({...formData, status: val})}>
                              <SelectTrigger className="h-14 border-primary/10 font-black text-[11px] bg-slate-50 uppercase"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="activo" className="text-[11px] font-black uppercase">ACTIVO</SelectItem>
                                <SelectItem value="inactivo" className="text-[11px] font-black uppercase">INACTIVO</SelectItem>
                                <SelectItem value="concluido" className="text-[11px] font-black uppercase">CONCLUIDO</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2">CCT</Label>
                            <Input placeholder="EJ: 15DESXXXXX" className="h-12 font-mono uppercase border-primary/10 bg-slate-50" value={formData.cct} onChange={e => handleCctChange(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-primary tracking-widest">Nombre del Plantel</Label>
                            <Input value={formData.schoolName} readOnly className="h-12 font-bold bg-slate-100" />
                          </div>

                          <div className="col-span-1 md:col-span-2 space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-accent border-b border-accent/20 pb-2 tracking-[0.2em]">Ficha Técnica del Plantel</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 shadow-inner">
                              <div className="space-y-1"><Label className="text-[9px] font-black text-muted-foreground uppercase opacity-70">Zona Escolar</Label><Input value={formData.zonaEscolar} readOnly className="bg-white/50 text-[10px] h-9 font-black border-none" /></div>
                              <div className="space-y-1"><Label className="text-[9px] font-black text-muted-foreground uppercase opacity-70">Sector</Label><Input value={formData.sector} readOnly className="bg-white/50 text-[10px] h-9 font-black border-none" /></div>
                              <div className="space-y-1"><Label className="text-[9px] font-black text-muted-foreground uppercase opacity-70">Municipio</Label><Input value={formData.municipio} readOnly className="bg-white/50 text-[10px] h-9 font-black border-none" /></div>
                            </div>
                          </div>

                          {activeTab === 'Geoposición' && (
                             <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary">Latitud</Label><Input value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} /></div>
                                <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary">Longitud</Label><Input value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} /></div>
                             </div>
                          )}

                          <div className="col-span-1 md:col-span-2 space-y-4 pt-4 border-t">
                             <Label className="text-[11px] font-black uppercase text-primary">Observaciones Generales</Label>
                             <Textarea className="min-h-[120px] bg-slate-50 border-primary/10 rounded-2xl" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} />
                          </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="asistentes" className="h-full m-0 p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      <p className="text-[10px] font-bold text-blue-800 uppercase">Gestión de personal y cuentas asociadas al plantel.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleAddAssistant} className="gap-2 font-black uppercase text-[10px] border-primary text-primary hover:bg-primary/5">
                      <Plus className="h-4 w-4" /> Añadir Cuenta
                    </Button>
                  </div>

                  <div className="flex-1 overflow-hidden border rounded-xl shadow-sm">
                    <ScrollArea className="h-full">
                      <Table>
                        <TableHeader className="bg-slate-100 sticky top-0 z-10">
                          <TableRow>
                            <TableHead className="w-10 text-[10px] font-black uppercase">#</TableHead>
                            <TableHead className="min-w-[250px] text-[10px] font-black uppercase">Nombre Completo</TableHead>
                            <TableHead className="min-w-[150px] text-[10px] font-black uppercase">RFC</TableHead>
                            <TableHead className="min-w-[180px] text-[10px] font-black uppercase">Función</TableHead>
                            <TableHead className="min-w-[250px] text-[10px] font-black uppercase">Correo Institucional</TableHead>
                            <TableHead className="w-10 sticky right-0 bg-slate-100"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assistants.map((ast, idx) => (
                            <TableRow key={idx} className="hover:bg-slate-50/50">
                              <TableCell className="text-center font-bold text-xs text-muted-foreground">{idx + 1}</TableCell>
                              <TableCell className="p-2">
                                <div className="grid grid-cols-3 gap-1">
                                  <Input placeholder="Paterno" className="h-8 text-[10px]" value={ast.paterno} onChange={e => updateAssistant(idx, 'paterno', e.target.value)} />
                                  <Input placeholder="Materno" className="h-8 text-[10px]" value={ast.materno} onChange={e => updateAssistant(idx, 'materno', e.target.value)} />
                                  <Input placeholder="Nombres" className="h-8 text-[10px] font-bold" value={ast.nombres} onChange={e => updateAssistant(idx, 'nombres', e.target.value)} />
                                </div>
                              </TableCell>
                              <TableCell className="p-2">
                                <Input placeholder="RFC" className="h-8 text-[10px] font-mono uppercase" value={ast.rfc} onChange={e => updateAssistant(idx, 'rfc', e.target.value.toUpperCase())} />
                              </TableCell>
                              <TableCell className="p-2">
                                <Select value={ast.funcion} onValueChange={(val: any) => updateAssistant(idx, 'funcion', val)}>
                                  <SelectTrigger className="h-8 text-[10px]">
                                    <SelectValue placeholder="Función..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {FUNCIONES.map(f => (
                                      <SelectItem key={f} value={f} className="text-[10px] uppercase font-bold">{f}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="p-2">
                                <Input placeholder="correo@desysa.edu.mx" className="h-8 text-[10px] font-mono lowercase" value={ast.email} onChange={e => updateAssistant(idx, 'email', e.target.value.toLowerCase())} />
                              </TableCell>
                              <TableCell className="p-2 sticky right-0 bg-white/80 backdrop-blur-sm shadow-l">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveAssistant(idx)} disabled={assistants.length === 1}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                </TabsContent>
             </div>
          </Tabs>
          
          <DialogFooter className="p-8 gap-4 border-t bg-slate-50/50">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-[1.2rem] h-14 text-[10px] font-black uppercase px-10 border-slate-200">Cancelar</Button>
            <Button onClick={handleSave} className="btn-institutional px-16 text-[10px] h-14 rounded-[1.2rem]">Guardar Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
