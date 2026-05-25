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
  "ASESOR TECNICO PEDAGOGICO"
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
    
    const validAssistants = formData.capacitacion === 'S' ? assistants.filter(a => a.rfc && a.nombres) : [];

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
                  {activeTab === 'Biblioteca Digital' && formData.capacitacion === 'S' && (
                    <TabsTrigger value="asistentes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-[11px] font-black uppercase tracking-wider transition-all">
                      2. Lista de Asistentes (Captura Directa)
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
                            <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2">CCT</Label>
                            <Input placeholder="EJ: 15DESXXXXX" className="h-14 font-mono uppercase border-primary/10 text-lg bg-slate-50 focus:bg-white transition-colors" value={formData.cct} onChange={e => handleCctChange(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-primary tracking-widest">Estatus</Label>
                            <Select value={formData.status} onValueChange={(val:any) => setFormData({...formData, status: val})}>
                              <SelectTrigger className="h-14 border-primary/10 font-black text-[11px] bg-slate-50 uppercase"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="activo" className="text-[11px] font-black uppercase">ACTIVO</SelectItem>
                                <SelectItem value="inactivo" className="text-[11px] font-black uppercase">INACTIVO</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label className="text-[11px] font-black uppercase text-primary tracking-widest">Nombre del CCT / Titular Responsable</Label>
                            <Input value={formData.schoolName} onChange={e => setFormData({...formData, schoolName: e.target.value})} className="h-12 font-bold bg-slate-50" />
                          </div>

                          <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label className="text-[11px] font-black uppercase text-primary tracking-widest flex items-center gap-2 pl-2"><UserCog className="h-4 w-4 text-accent" /> Técnico Responsable</Label>
                            <Input className="h-12 bg-slate-50 font-bold uppercase" value={formData.tecnicos} onChange={e => setFormData({...formData, tecnicos: e.target.value.toUpperCase()})} />
                          </div>

                          <div className="col-span-1 md:col-span-2 space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-accent border-b border-accent/20 pb-2 tracking-[0.2em]">Ficha Técnica del Plantel</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 shadow-inner">
                              <div className="space-y-1"><Label className="text-[9px] font-black text-muted-foreground uppercase opacity-70">Zona Escolar</Label><Input value={formData.zonaEscolar} readOnly className="bg-white/50 text-[10px] h-9 font-black border-none" /></div>
                              <div className="space-y-1"><Label className="text-[9px] font-black text-muted-foreground uppercase opacity-70">Sector</Label><Input value={formData.sector} readOnly className="bg-white/50 text-[10px] h-9 font-black border-none" /></div>
                              <div className="space-y-1"><Label className="text-[9px] font-black text-muted-foreground uppercase opacity-70">Municipio</Label><Input value={formData.municipio} readOnly className="bg-white/50 text-[10px] h-9 font-black border-none" /></div>
                            </div>
                          </div>

                          <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-100">
                             {activeTab === 'ATRES' && (
                               <div className="space-y-8">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                     <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase text-primary">Tipo de Incidencia</Label>
                                        <Select value={formData.tipoIncidencia} onValueChange={(val: any) => setFormData({...formData, tipoIncidencia: val})}>
                                          <SelectTrigger className="h-12 bg-slate-50 uppercase font-bold text-[10px]"><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="red edusat" className="text-[10px] uppercase">Red Edusat</SelectItem>
                                            <SelectItem value="red local" className="text-[10px] uppercase">Red Local</SelectItem>
                                            <SelectItem value="mantenimiento" className="text-[10px] uppercase">Mantenimiento</SelectItem>
                                            <SelectItem value="teleplanteles" className="text-[10px] uppercase">Teleplanteles</SelectItem>
                                          </SelectContent>
                                        </Select>
                                     </div>
                                     <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase text-primary">Oficina Regional</Label>
                                        <Select value={formData.oficinaRegionalAtencion} onValueChange={(val) => setFormData({...formData, oficinaRegionalAtencion: val})}>
                                          <SelectTrigger className="h-12 bg-slate-50 text-[10px] font-bold"><SelectValue placeholder="Seleccionar oficina..." /></SelectTrigger>
                                          <SelectContent>{REGIONAL_OFFICES.map(off => <SelectItem key={off} value={off} className="text-[10px] uppercase">{off.replace("Oficina de ", "")}</SelectItem>)}</SelectContent>
                                        </Select>
                                     </div>
                                  </div>

                                  {formData.tipoIncidencia === 'red edusat' && (
                                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-primary/20 space-y-8 animate-in zoom-in-95 duration-300 shadow-xl">
                                      <div className="flex items-center gap-4 border-b border-primary/10 pb-4">
                                         <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg">
                                            <Radio className="h-7 w-7" />
                                         </div>
                                         <div>
                                           <h3 className="text-lg font-black uppercase text-primary tracking-wider leading-none">Módulo Técnico RED Edusat Avanzado</h3>
                                           <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Diagnóstico Institucional por Componentes</p>
                                         </div>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                         <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                            <Label className="text-[9px] font-black uppercase text-primary border-b pb-1 block">MICROPAK (LNB)</Label>
                                            {EDUSAT_MICROPAK.map(item => (
                                              <div key={item} className="flex items-center space-x-2">
                                                 <Checkbox id={`lnb-${item}`} checked={(formData.edusatDetalle?.micropak || []).includes(item)} onCheckedChange={() => handleEdusatChecklistToggle('micropak', item)} />
                                                 <label htmlFor={`lnb-${item}`} className="text-[8px] font-bold uppercase leading-none cursor-pointer">{item}</label>
                                              </div>
                                            ))}
                                         </div>
                                         <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                            <Label className="text-[9px] font-black uppercase text-primary border-b pb-1 block">ANT. PARABÓLICA</Label>
                                            {EDUSAT_ANTENA.map(item => (
                                              <div key={item} className="flex items-center space-x-2">
                                                 <Checkbox id={`ant-${item}`} checked={(formData.edusatDetalle?.antena || []).includes(item)} onCheckedChange={() => handleEdusatChecklistToggle('antena', item)} />
                                                 <label htmlFor={`ant-${item}`} className="text-[8px] font-bold uppercase leading-none cursor-pointer">{item}</label>
                                              </div>
                                            ))}
                                         </div>
                                         <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                            <Label className="text-[9px] font-black uppercase text-primary border-b pb-1 block">DECODIFICADOR</Label>
                                            {EDUSAT_DECO_ACCIONES.map(item => (
                                              <div key={item} className="flex items-center space-x-2">
                                                 <Checkbox id={`deco-acc-${item}`} checked={(formData.edusatDetalle?.decodificadorAcciones || []).includes(item)} onCheckedChange={() => handleEdusatChecklistToggle('decodificadorAcciones', item)} />
                                                 <label htmlFor={`deco-acc-${item}`} className="text-[8px] font-bold uppercase leading-none cursor-pointer">{item}</label>
                                              </div>
                                            ))}
                                         </div>
                                         <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                            <Label className="text-[9px] font-black uppercase text-primary border-b pb-1 block">CABLEADO</Label>
                                            {EDUSAT_CABLEADO.map(item => (
                                              <div key={item} className="flex items-center space-x-2">
                                                 <Checkbox id={`cab-${item}`} checked={(formData.edusatDetalle?.cableado || []).includes(item)} onCheckedChange={() => handleEdusatChecklistToggle('cableado', item)} />
                                                 <label htmlFor={`cab-${item}`} className="text-[8px] font-bold uppercase leading-none cursor-pointer">{item}</label>
                                              </div>
                                            ))}
                                         </div>
                                         <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                            <Label className="text-[9px] font-black uppercase text-primary border-b pb-1 block">M. PREVENTIVO</Label>
                                            {EDUSAT_PREVENTIVO.map(item => (
                                              <div key={item} className="flex items-center space-x-2">
                                                 <Checkbox id={`prev-${item}`} checked={(formData.edusatDetalle?.preventivo || []).includes(item)} onCheckedChange={() => handleEdusatChecklistToggle('preventivo', item)} />
                                                 <label htmlFor={`prev-${item}`} className="text-[8px] font-bold uppercase leading-none cursor-pointer">{item}</label>
                                              </div>
                                            ))}
                                         </div>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                                         <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase text-primary tracking-widest pl-1">Número Censal:</Label>
                                            <Input className="h-10 bg-white border-primary/20 font-mono font-black" value={formData.edusatDetalle?.numCensal} onChange={e => setFormData({...formData, edusatDetalle: {...formData.edusatDetalle!, numCensal: e.target.value.toUpperCase()}})} />
                                         </div>
                                         <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase text-primary tracking-widest pl-1">Número de Serie:</Label>
                                            <Input className="h-10 bg-white border-primary/20 font-mono font-black" value={formData.edusatDetalle?.numSerie} onChange={e => setFormData({...formData, edusatDetalle: {...formData.edusatDetalle!, numSerie: e.target.value.toUpperCase()}})} />
                                         </div>
                                         <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase text-primary tracking-widest pl-1">Calidad de la Señal:</Label>
                                            <Select value={formData.edusatDetalle?.calidadSeñal} onValueChange={val => setFormData({...formData, edusatDetalle: {...formData.edusatDetalle!, calidadSeñal: val}})}>
                                              <SelectTrigger className="h-10 bg-white font-black uppercase text-[10px] border-primary/20"><SelectValue placeholder="CALIDAD..." /></SelectTrigger>
                                              <SelectContent>
                                                 <SelectItem value="nulo" className="text-[10px] font-black text-rose-600">NULO</SelectItem>
                                                 <SelectItem value="bajo" className="text-[10px] font-black text-amber-600">BAJO</SelectItem>
                                                 <SelectItem value="óptimo" className="text-[10px] font-black text-emerald-600">ÓPTIMO</SelectItem>
                                                 <SelectItem value="excelente" className="text-[10px] font-black text-primary">EXCELENTE</SelectItem>
                                              </SelectContent>
                                            </Select>
                                         </div>
                                      </div>

                                      <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                                          <Monitor className="h-4 w-4" /> Materiales Utilizados y Actividades por la Brigada
                                        </Label>
                                        <div className="border rounded-2xl overflow-hidden shadow-md bg-white">
                                          <Table>
                                            <TableHeader className="bg-slate-100">
                                              <TableRow>
                                                <TableHead className="w-12 text-[9px] font-black uppercase text-center">#</TableHead>
                                                <TableHead className="text-[9px] font-black uppercase min-w-[200px]">Material Utilizado</TableHead>
                                                <TableHead className="text-[9px] font-black uppercase w-[100px]">Cantidad</TableHead>
                                                <TableHead className="text-[9px] font-black uppercase">Actividades Realizadas por la Brigada</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {Array.from({ length: 8 }).map((_, idx) => (
                                                <TableRow key={idx} className="hover:bg-slate-50/50">
                                                  <TableCell className="text-center font-bold text-[10px] text-muted-foreground">{idx + 1}</TableCell>
                                                  <TableCell className="p-1">
                                                    <Input className="h-9 text-[10px] uppercase border-none focus:ring-1" value={formData.edusatDetalle?.materiales[idx]?.material || ''} onChange={e => handleEdusatMaterialChange(idx, 'material', e.target.value.toUpperCase())} />
                                                  </TableCell>
                                                  <TableCell className="p-1">
                                                    <Input className="h-9 text-[10px] uppercase border-none focus:ring-1 text-center font-black" value={formData.edusatDetalle?.materiales[idx]?.cantidad || ''} onChange={e => handleEdusatMaterialChange(idx, 'cantidad', e.target.value)} />
                                                  </TableCell>
                                                  <TableCell className="p-1">
                                                    <Input className="h-9 text-[10px] uppercase border-none focus:ring-1" value={formData.edusatDetalle?.materiales[idx]?.actividades || ''} onChange={e => handleEdusatMaterialChange(idx, 'actividades', e.target.value.toUpperCase())} />
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                    <div className="space-y-2">
                                      <Label className="text-[10px] font-black uppercase text-primary">Número de Oficio COEES</Label>
                                      <Input className="h-12 bg-slate-50 font-mono uppercase" value={formData.numeroOficio} onChange={e => setFormData({...formData, numeroOficio: e.target.value})} placeholder="COEES/PL/..." />
                                    </div>
                                    <div className={cn("grid gap-4", formData.tipoIncidencia === 'red edusat' ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4")}>
                                      <div className="space-y-2"><Label className="text-[9px] font-black uppercase">Alumnos</Label><Input type="number" className="h-12 text-center" value={formData.alumnosBeneficiados} onChange={e => setFormData({...formData, alumnosBeneficiados: parseInt(e.target.value) || 0})} /></div>
                                      <div className="space-y-2"><Label className="text-[9px] font-black uppercase">Docentes</Label><Input type="number" className="h-12 text-center" value={formData.docentesBeneficiados} onChange={e => setFormData({...formData, docentesBeneficiados: parseInt(e.target.value) || 0})} /></div>
                                      {formData.tipoIncidencia !== 'red edusat' && (
                                        <>
                                          <div className="space-y-2"><Label className="text-[9px] font-black uppercase">Serv. M.C.</Label><Input type="number" className="h-12 text-center" value={formData.serviciosMC} onChange={e => setFormData({...formData, serviciosMC: parseInt(e.target.value) || 0})} /></div>
                                          <div className="space-y-2"><Label className="text-[9px] font-black uppercase">Serv. M.P.</Label><Input type="number" className="h-12 text-center" value={formData.serviciosMP} onChange={e => setFormData({...formData, serviciosMP: parseInt(e.target.value) || 0})} /></div>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  <div className="space-y-4 pt-6 border-t">
                                     <Label className="text-[11px] font-black uppercase text-primary">Observaciones Técnicas</Label>
                                     <Textarea className="min-h-[120px] bg-slate-50 border-primary/10 rounded-2xl" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} />
                                  </div>
                               </div>
                             )}
                          </div>
                      </div>
                    </div>
                  </ScrollArea>
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
