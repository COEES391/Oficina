'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { programsData, type ProgramStatus, type ProgramAssistant } from "@/lib/planning-data"
import { schoolsDirectory } from "@/lib/schools-directory"
import * as XLSX from 'xlsx'
import { 
  PlusCircle, 
  Search, 
  Pencil, 
  School, 
  Settings2, 
  Zap,
  Calendar,
  MonitorCheck,
  History,
  Users,
  Trash2,
  Plus,
  Layers,
  Star,
  Mail,
  FileUp,
  Table as TableIcon,
  Eraser,
  Check,
  Navigation,
  Globe,
  Filter,
  Activity,
  LocateFixed,
  Info,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  Download,
  X,
  Circle,
  HelpCircle,
  ExternalLink,
  MessageSquare,
  BookOpen,
  Image as ImageIcon,
  Target,
  Building,
  Trophy,
  ArrowLeft
} from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { cn } from '@/lib/utils'

const TOTAL_UNIVERSE = 830; 

const PROGRAM_RUBROS = [
  'Biblioteca Digital',
  'Cuentas Institucionales (@desysa.gob.mx, @desysa.edu.mx, @coees.edu.mx)',
  'Geoposición',
  'Conoce mi Escuela',
  'Mesa de Ayuda Técnica'
];

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [activeTab, setActiveTab] = useState(PROGRAM_RUBROS[0])
  const [conoceSubTab, setConoceSubTab] = useState('info')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [inlineFormData, setInlineFormData] = useState<any>(null)
  
  const [mapValleFilter, setMapValleFilter] = useState('all')
  const [mapModalidadFilter, setMapModalidadFilter] = useState('all')
  const [geoSearchTerm, setGeoSearchTerm] = useState('')

  // "Conoce mi escuela" filters
  const [conoceValle, setConoceValle] = useState('all')
  const [conoceMod, setConoceMod] = useState('all')
  const [conoceSector, setConoceSector] = useState('all')
  const [conoceMun, setConoceMun] = useState('all')

  // "Incorporación" logic
  const [incCct, setIncCct] = useState('')
  const [generatedPass, setGeneratedPass] = useState<string | null>(null)
  const [showWebAssistant, setShowWebAssistant] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialAssistant: ProgramAssistant = {
    paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '', departamento: ''
  };

  const initialFormState: ProgramStatus = {
    id: '',
    name: '',
    progress: 0,
    status: 'planeacion',
    date: '',
    cct: '',
    schoolName: '',
    zonaEscolar: '',
    sector: '',
    modalidad: '',
    municipio: '',
    region: '',
    valle: '',
    numeroEquipos: 0,
    descripcionEquipo: '',
    fechaEntrada: '',
    fechaSalida: '',
    responsables: ['', '', ''],
    numeroOficio: '',
    setes: 'N',
    observaciones: '',
    reportPdf: '',
    evidencePhotos: [],
    capacitacion: 'N',
    totalParticipantes: 0,
    asistentes: [initialAssistant]
  }

  const [formData, setFormData] = useState<ProgramStatus>(initialFormState)

  useEffect(() => {
    setMounted(true)
    const stored = JSON.parse(localStorage.getItem('programs_full') || '[]')
    if (stored.length > 0) {
      setRecords(stored)
    } else {
      setRecords(programsData)
    }
  }, [])

  useEffect(() => {
    setFormData(prev => ({ 
      ...prev, 
      name: activeTab,
      date: format(new Date(), 'yyyy-MM-dd'),
      fechaEntrada: format(new Date(), 'yyyy-MM-dd')
    }))
  }, [activeTab])

  const handleGeneratePass = () => {
    const cleanCct = incCct.trim().toUpperCase();
    if (cleanCct.length < 10) {
      toast({ variant: "destructive", title: "CCT Inválido", description: "Ingrese los 10 caracteres del CCT." })
      return
    }
    const school = schoolsDirectory.find(s => s.cct === cleanCct)
    if (!school) {
      toast({ variant: "destructive", title: "No encontrado", description: "El CCT no existe en el directorio oficial." })
      return
    }
    const pass = Math.random().toString(36).substring(2, 10).toUpperCase()
    setGeneratedPass(pass)
    toast({ title: "Acceso Generado", description: `Se ha creado la contraseña para ${cleanCct}.` })
  }

  const consultaResults = useMemo(() => {
    return schoolsDirectory.filter(s => {
      const matchValle = conoceValle === 'all' || s.valle === conoceValle;
      const matchMod = conoceMod === 'all' || s.modalidad === conoceMod;
      const matchSec = conoceSector === 'all' || s.sectorNum === conoceSector;
      const matchMun = conoceMun === 'all' || s.municipio === conoceMun;
      return matchValle && matchMod && matchSec && matchMun;
    });
  }, [conoceValle, conoceMod, conoceSector, conoceMun]);

  const rubroStats = useMemo(() => {
    return PROGRAM_RUBROS.map(name => {
      const rubroRecords = records.filter(r => r.name === name || (name.startsWith('Cuentas') && (r.id.startsWith('IMP-') || r.id.startsWith('PROG-CI'))));
      const uniqueSchools = new Set(rubroRecords.map(r => r.cct).filter(Boolean)).size;
      const progress = Math.min(100, Math.round((uniqueSchools / TOTAL_UNIVERSE) * 100));
      const lastUpdate = rubroRecords.length > 0 
        ? rubroRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date 
        : format(new Date(), 'yyyy-MM-dd');
      
      let status: 'planeacion' | 'activo' | 'concluido' = 'planeacion';
      if (progress > 0) status = 'activo';
      if (progress >= 100) status = 'concluido';

      const totalEquiposRehabilitados = rubroRecords.reduce((acc, curr) => acc + (curr.numeroEquipos || 0), 0);

      return { name, progress, status, lastUpdate, count: uniqueSchools, totalEquipos: totalEquiposRehabilitados, records: rubroRecords };
    });
  }, [records]);

  const activeTabClean = activeTab.includes('(') ? activeTab.split('(')[0].trim() : activeTab;
  const isLibraryTab = activeTabClean === 'Biblioteca Digital';
  const isCuentasTab = activeTabClean === 'Cuentas Institucionales';
  const isGeoTab = activeTabClean === 'Geoposición';
  const isConoceTab = activeTabClean === 'Conoce mi Escuela';
  
  const currentStats = useMemo(() => rubroStats.find(s => s.name === activeTab), [rubroStats, activeTab]);

  const geoSchools = useMemo(() => {
    if (!isGeoTab) return [];
    return schoolsDirectory.filter(s => {
      const matchValle = mapValleFilter === 'all' || s.valle === mapValleFilter;
      const matchModalidad = mapModalidadFilter === 'all' || s.modalidad === mapModalidadFilter;
      const matchSearch = !geoSearchTerm || 
        s.cct.toUpperCase().includes(geoSearchTerm.toUpperCase()) || 
        s.nombre.toUpperCase().includes(geoSearchTerm.toUpperCase());
      return matchValle && matchModalidad && matchSearch;
    });
  }, [isGeoTab, mapValleFilter, mapModalidadFilter, geoSearchTerm]);

  const handleSelectSchool = (cct: string) => {
    const school = schoolsDirectory.find(s => s.cct === cct);
    if (school) {
      setFormData(prev => ({
        ...prev,
        cct: school.cct,
        schoolName: school.nombre,
        zonaEscolar: school.zonaEscolar,
        sector: school.sector,
        modalidad: school.modalidad,
        municipio: school.municipio,
        region: school.region,
        valle: school.valle
      }));
    }
  }

  const handleAddAssistant = () => setFormData(prev => ({ ...prev, asistentes: [...(prev.asistentes || []), initialAssistant] }))
  const handleRemoveAssistant = (index: number) => setFormData(prev => ({ ...prev, asistentes: prev.asistentes?.filter((_, i) => i !== index) }))

  const updateAssistant = (index: number, field: keyof ProgramAssistant, value: string) => {
    const newAsistentes = [...(formData.asistentes || [])]
    newAsistentes[index] = { ...newAsistentes[index], [field]: value }
    if (field === 'cct' && value.length === 10) {
      const school = schoolsDirectory.find(s => s.cct.toUpperCase() === value.toUpperCase())
      if (school) {
        newAsistentes[index] = { ...newAsistentes[index], nombreCT: school.nombre, ze: school.zonaEscolar, sector: school.sector, modalidad: school.modalidad, municipio: school.municipio, region: school.region, valle: school.valle }
      }
    }
    setFormData(prev => ({ ...prev, asistentes: newAsistentes, totalParticipantes: newAsistentes.filter(a => a.rfc).length }))
  }

  const handleSave = () => {
    if (!formData.id || (!formData.cct && !isCuentasTab)) { toast({ variant: "destructive", title: "Datos incompletos" }); return; }
    const updated = editingId ? records.map(r => r.id === editingId ? formData : r) : [formData, ...records];
    setRecords(updated)
    localStorage.setItem('programs_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    resetForm()
    toast({ title: "Registro guardado" })
  }

  const resetForm = () => {
    setFormData({ ...initialFormState, name: activeTab, date: format(new Date(), 'yyyy-MM-dd'), fechaEntrada: format(new Date(), 'yyyy-MM-dd') })
    setEditingId(null)
  }

  const startInlineEdit = (acc: any) => {
    setEditingRowId(acc.id);
    setInlineFormData({ ...acc });
  }

  const cancelInlineEdit = () => {
    setEditingRowId(null);
    setInlineFormData(null);
  }

  const saveInlineEdit = () => {
    if (!inlineFormData) return;
    const updatedRecords = records.map(r => {
      if (r.id === inlineFormData.id) {
        const updatedAsistentes = [...(r.asistentes || [])];
        if (updatedAsistentes.length > 0) {
          updatedAsistentes[0] = { ...updatedAsistentes[0], email: inlineFormData.email, cct: inlineFormData.cct };
        }
        return { ...r, status: inlineFormData.status, asistentes: updatedAsistentes, cct: inlineFormData.cct };
      }
      return r;
    });
    setRecords(updatedRecords);
    localStorage.setItem('programs_full', JSON.stringify(updatedRecords));
    setEditingRowId(null);
    setInlineFormData(null);
    toast({ title: "Cambios guardados" });
  }

  if (!mounted) return null

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tighter text-primary uppercase leading-none">Gestión de Programas</h2>
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
             <p className="text-muted-foreground font-black text-[11px] uppercase tracking-[0.3em]">Seguimiento Estratégico Oficina de Planeación</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
        <TabsList className="w-full h-auto flex flex-wrap bg-slate-100/50 p-1.5 rounded-3xl shadow-inner border border-primary/5">
          {PROGRAM_RUBROS.map(rubro => (
            <TabsTrigger 
              key={rubro} 
              value={rubro}
              className="flex-1 min-w-[200px] h-14 text-[10px] font-black uppercase tracking-[0.1em] rounded-2xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xl transition-all"
            >
              {rubro.includes('(') ? rubro.split('(')[0] : rubro}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-10 animate-in zoom-in-95 duration-500">
           {isConoceTab ? (
              <div className="space-y-10">
                 <Card className="executive-card p-10 relative overflow-hidden border-t-8 border-t-primary">
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                       <School className="h-48 w-48 text-primary" />
                    </div>
                    <div className="relative z-10 max-w-4xl space-y-8">
                       <div className="flex items-center gap-6">
                          <div className="h-20 w-20 rounded-2xl bg-primary text-white flex items-center justify-center shadow-2xl">
                             <School className="h-10 w-10" />
                          </div>
                          <div>
                             <h3 className="text-4xl font-black uppercase tracking-tighter text-primary leading-none">Conoce mi Escuela</h3>
                             <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] mt-2">Departamento de Computación Electrónica (COEES)</p>
                          </div>
                       </div>
                       <div className="space-y-6 text-slate-600 font-medium leading-relaxed">
                          <p>
                            <strong>Conoce mi Escuela</strong>, es un programa creado y administrado por el Departamento de Computación Electrónica en la Educación Secundaria (COEES), el cual inició en el 2006 y a la fecha se perfila como la única vía autorizada para que las escuelas cuenten con un espacio Web para compartir información de interés general para proyectar su trabajo hacia la comunidad, padres de familia y autoridades educativas.
                          </p>
                          <p>
                            A través de Conoce mi Escuela, los directores escolares tienen la oportunidad de dar a conocer, los detalles e información que caracterizan y diferencian a su escuela: historia de la institución, infraestructura, actividades que emprenden a lo largo de cada ciclo escolar, logros y reconocimientos a los que se han hecho acreedores por el buen desempeño docente, así como su participación en concursos académicos, deportivos o culturales; a nivel zona o sector, o a nivel estado.
                          </p>
                          <p className="bg-primary/5 p-6 rounded-2xl border-l-4 border-l-primary font-bold italic">
                            Con este programa, se aspira a que todos los centros de trabajo sean reconocidos por la comunidad, dando a conocer información cuantitativa y cualitativa de nuestras escuelas, coadyuvando al aumento de la matrícula escolar.
                          </p>
                       </div>
                    </div>
                 </Card>

                 <Tabs value={conoceSubTab} onValueChange={setConoceSubTab} className="space-y-8">
                    <TabsList className="bg-slate-100 p-1.5 rounded-2xl h-14">
                       <TabsTrigger value="info" className="rounded-xl px-8 font-black uppercase text-[10px] gap-2"><Info className="h-4 w-4" /> Información</TabsTrigger>
                       <TabsTrigger value="incorp" className="rounded-xl px-8 font-black uppercase text-[10px] gap-2"><UserPlus className="h-4 w-4" /> Incorporación</TabsTrigger>
                       <TabsTrigger value="list" className="rounded-xl px-8 font-black uppercase text-[10px] gap-2"><TableIcon className="h-4 w-4" /> Escuelas Incorporadas</TabsTrigger>
                       <TabsTrigger value="search" className="rounded-xl px-8 font-black uppercase text-[10px] gap-2"><Search className="h-4 w-4" /> Consulta tu Escuela</TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="animate-in fade-in slide-in-from-bottom-4">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {[
                             { t: "PROYECCIÓN COMUNITARIA", d: "Espacio web oficial para compartir logros e historia institucional.", i: <Globe className="h-6 w-6" /> },
                             { t: "GESTIÓN DIRECTIVA", d: "Herramienta autorizada para la actualización de infraestructura y servicios.", i: <ShieldCheck className="h-6 w-6" /> },
                             { t: "INCREMENTO DE MATRÍCULA", d: "Atracción de nuevos alumnos mediante transparencia y calidad educativa.", i: <Activity className="h-6 w-6" /> }
                          ].map((item, idx) => (
                             <Card key={idx} className="p-8 space-y-4 hover:shadow-xl transition-all border-none shadow-lg">
                                <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">{item.i}</div>
                                <h4 className="font-black text-sm uppercase text-slate-800">{item.t}</h4>
                                <p className="text-xs text-slate-500 leading-relaxed font-bold">{item.d}</p>
                             </Card>
                          ))}
                       </div>
                    </TabsContent>

                    <TabsContent value="incorp" className="animate-in fade-in slide-in-from-bottom-4">
                       {showWebAssistant ? (
                          <Card className="p-0 bg-white shadow-2xl rounded-[3rem] border-none overflow-hidden">
                             <div className="bg-primary/5 p-6 border-b flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                   <Button variant="ghost" size="icon" onClick={() => setShowWebAssistant(false)} className="rounded-full h-10 w-10 text-primary">
                                      <ArrowLeft className="h-5 w-5" />
                                   </Button>
                                   <h4 className="font-black uppercase text-sm text-primary tracking-tighter">Construya la Página de su Escuela</h4>
                                </div>
                                <div className="flex gap-6">
                                   <button className="text-[10px] font-black uppercase text-slate-500 hover:text-primary">Ejemplo</button>
                                   <button className="text-[10px] font-black uppercase text-slate-500 hover:text-primary">Enviar comentarios</button>
                                </div>
                             </div>
                             
                             <div className="p-12 max-w-4xl mx-auto space-y-12">
                                <div className="space-y-6 text-center">
                                   <div className="flex flex-col items-center gap-2">
                                      <span className="font-black text-4xl text-primary tracking-tighter">SEIEM</span>
                                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Servicios Educativos Integrados al Estado de México</p>
                                   </div>
                                   <div className="space-y-3">
                                      <h3 className="text-3xl font-black text-slate-800 tracking-tight">Bienvenido al Asistente de WebEscuela</h3>
                                      <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-2xl mx-auto">
                                         Este Asistente de WebEscuela lo guiará a través del proceso de construcción de la Página Web de su Escuela. Todo el proceso le tomará entre 10 y 15 minutos.
                                      </p>
                                   </div>
                                </div>

                                <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 space-y-8">
                                   <div className="flex items-center gap-3">
                                      <HelpCircle className="h-5 w-5 text-primary" />
                                      <h5 className="font-black uppercase text-xs text-primary tracking-widest">Por favor tenga a la mano la siguiente información:</h5>
                                   </div>
                                   
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      {[
                                         { t: "Breve presentación de la escuela", i: <BookOpen className="h-4 w-4" /> },
                                         { t: "Fotografía digital representativa (300x200)", i: <ImageIcon className="h-4 w-4" /> },
                                         { t: "Breve reseña histórica de la escuela", i: <History className="h-4 w-4" /> },
                                         { t: "Enunciados de la misión y visión", i: <Target className="h-4 w-4" /> },
                                         { t: "Lista de infraestructura (aulas, labs, etc.)", i: <Building className="h-4 w-4" /> },
                                         { t: "Logros académicos, culturales y deportivos", i: <Trophy className="h-4 w-4" /> },
                                         { t: "Relación de alumnos distinguidos", i: <Star className="h-4 w-4" /> }
                                      ].map((req, idx) => (
                                         <div key={idx} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-50">
                                            <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary">{req.i}</div>
                                            <span className="text-[11px] font-bold text-slate-600">{req.t}</span>
                                         </div>
                                      ))}
                                   </div>
                                </div>

                                <div className="flex flex-col items-center gap-8 pb-10">
                                   <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                      <span className="text-[10px] font-black uppercase tracking-widest">Se ha encontrado información previamente capturada</span>
                                   </div>
                                   
                                   <Button onClick={() => toast({ title: "Iniciando Asistente..." })} className="h-16 px-20 rounded-2xl font-black uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 text-white shadow-2xl transition-all hover:scale-105">
                                      Empezar <ArrowRight className="h-5 w-5 ml-4" />
                                   </Button>
                                </div>
                             </div>
                          </Card>
                       ) : (
                          <Card className="p-10 bg-white shadow-2xl rounded-[3rem] border-none">
                             <div className="max-w-xl mx-auto space-y-10 text-center">
                                <div className="space-y-2">
                                   <h3 className="text-3xl font-black uppercase text-primary tracking-tighter">Incorporación al Programa</h3>
                                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Generación de Acceso Seguro para Planteles</p>
                                </div>
                                <div className="space-y-4">
                                   <Label className="text-[11px] font-black uppercase text-slate-600 block text-left pl-2">Ingrese el CCT de la Escuela</Label>
                                   <div className="flex gap-4">
                                      <Input 
                                         className="h-16 rounded-2xl font-black text-lg text-center uppercase tracking-[0.2em] bg-slate-50 shadow-inner" 
                                         placeholder="15DES0000X" 
                                         maxLength={10}
                                         value={incCct || ''}
                                         onChange={(e) => setIncCct(e.target.value.toUpperCase())}
                                       />
                                      <Button onClick={handleGeneratePass} className="h-16 px-10 rounded-2xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-xl">
                                         Generar Acceso <ArrowRight className="h-5 w-5 ml-2" />
                                      </Button>
                                   </div>
                                </div>

                                {generatedPass && (
                                   <div className="p-10 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100 space-y-6 animate-in zoom-in-95 duration-500">
                                      <div className="flex justify-center"><Check className="h-12 w-12 text-emerald-600" /></div>
                                      <div className="space-y-2">
                                         <p className="text-[10px] font-black uppercase text-emerald-800 tracking-widest">Contraseña Generada para {incCct}</p>
                                         <div className="text-5xl font-black text-emerald-900 tracking-[0.2em] font-mono">{generatedPass}</div>
                                      </div>
                                      <div className="flex flex-col gap-4">
                                         <Button variant="outline" className="border-emerald-200 text-emerald-700 bg-white rounded-xl gap-2 font-black uppercase text-[10px] h-12">
                                            <Download className="h-4 w-4" /> Descargar Ficha de Acceso
                                         </Button>
                                         <Button onClick={() => setShowWebAssistant(true)} className="bg-primary text-white rounded-xl gap-2 font-black uppercase text-[10px] h-14 shadow-lg shadow-primary/20">
                                            <Globe className="h-4 w-4" /> Construir Espacio Web
                                         </Button>
                                      </div>
                                   </div>
                                )}
                             </div>
                          </Card>
                       )}
                    </TabsContent>

                    <TabsContent value="list" className="animate-in fade-in slide-in-from-bottom-4">
                       <Card className="executive-card border-none">
                          <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
                             <CardTitle className="text-lg font-black uppercase text-primary flex items-center gap-3">
                                <TableIcon className="h-6 w-6" /> Escuelas Incorporadas
                             </CardTitle>
                             <Badge className="bg-primary/5 text-primary border-none text-[10px] font-black uppercase px-6 py-2 rounded-xl">Consolidado Oficial 2024</Badge>
                          </CardHeader>
                          <ScrollArea className="h-[600px]">
                             <Table>
                                <TableHeader className="bg-white sticky top-0 z-10">
                                   <TableRow>
                                      <TableHead className="w-16 text-center font-black text-[10px] uppercase py-6">Núm.</TableHead>
                                      <TableHead className="w-32 font-black text-[10px] uppercase">Clave (CCT)</TableHead>
                                      <TableHead className="font-black text-[10px] uppercase">Nombre del Centro de Trabajo</TableHead>
                                      <TableHead className="font-black text-[10px] uppercase">Municipio</TableHead>
                                      <TableHead className="font-black text-[10px] uppercase">Localidad</TableHead>
                                      <TableHead className="font-black text-[10px] uppercase">Sector / Modalidad / Valle</TableHead>
                                   </TableRow>
                                </TableHeader>
                                <TableBody>
                                   {schoolsDirectory.map((school, i) => (
                                      <TableRow key={i} className="hover:bg-slate-50 transition-all border-slate-100">
                                         <TableCell className="text-center font-bold text-slate-400 py-4">{i + 1}</TableCell>
                                         <TableCell className="font-black text-xs text-primary">{school.cct}</TableCell>
                                         <TableCell className="font-black text-[11px] text-slate-700 uppercase">{school.nombre}</TableCell>
                                         <TableCell className="font-bold text-[10px] text-slate-500 uppercase">{school.municipio}</TableCell>
                                         <TableCell className="font-bold text-[10px] text-slate-500 uppercase">{school.localidad}</TableCell>
                                         <TableCell>
                                            <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{school.sector}</span>
                                         </TableCell>
                                      </TableRow>
                                   ))}
                                </TableBody>
                             </Table>
                          </ScrollArea>
                       </Card>
                    </TabsContent>

                    <TabsContent value="search" className="animate-in fade-in slide-in-from-bottom-4">
                       <div className="space-y-8">
                          <Card className="p-8 bg-white shadow-xl rounded-[2.5rem] border-none">
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                   <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-2">Valle</Label>
                                   <Select value={conoceValle} onValueChange={setConoceValle}>
                                      <SelectTrigger className="h-12 rounded-xl font-black bg-slate-50 border-none"><SelectValue placeholder="--Seleccione Valle--" /></SelectTrigger>
                                      <SelectContent className="font-black"><SelectItem value="all">TODOS</SelectItem><SelectItem value="MEXICO">VALLE DE MÉXICO</SelectItem><SelectItem value="TOLUCA">VALLE DE TOLUCA</SelectItem></SelectContent>
                                   </Select>
                                </div>
                                <div className="space-y-2">
                                   <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-2">Modalidad</Label>
                                   <Select value={conoceMod} onValueChange={setConoceMod}>
                                      <SelectTrigger className="h-12 rounded-xl font-black bg-slate-50 border-none"><SelectValue placeholder="--Seleccione Modalidad--" /></SelectTrigger>
                                      <SelectContent className="font-black"><SelectItem value="all">TODAS</SelectItem><SelectItem value="DES">GENERAL</SelectItem><SelectItem value="DST">TÉCNICA</SelectItem><SelectItem value="DTV">TELESECUNDARIA</SelectItem></SelectContent>
                                   </Select>
                                </div>
                                <div className="space-y-2">
                                   <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-2">Sector</Label>
                                   <Select value={conoceSector} onValueChange={setConoceSector}>
                                      <SelectTrigger className="h-12 rounded-xl font-black bg-slate-50 border-none"><SelectValue placeholder="--Seleccione Sector--" /></SelectTrigger>
                                      <SelectContent className="font-black">
                                         <SelectItem value="all">TODOS</SelectItem>
                                         {Array.from(new Set(schoolsDirectory.map(s => s.sectorNum))).sort().map(s => <SelectItem key={s} value={s}>SECTOR {s}</SelectItem>)}
                                      </SelectContent>
                                   </Select>
                                </div>
                                <div className="space-y-2">
                                   <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-2">Municipio</Label>
                                   <Select value={conoceMun} onValueChange={setConoceMun}>
                                      <SelectTrigger className="h-12 rounded-xl font-black bg-slate-50 border-none"><SelectValue placeholder="--Seleccione Municipio--" /></SelectTrigger>
                                      <SelectContent className="font-black">
                                         <SelectItem value="all">TODOS</SelectItem>
                                         {Array.from(new Set(schoolsDirectory.map(s => s.municipio))).sort().map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                      </SelectContent>
                                   </Select>
                                </div>
                             </div>
                             <div className="flex justify-end mt-6">
                                <Button variant="ghost" className="font-black uppercase text-[10px] text-rose-600" onClick={() => { setConoceValle('all'); setConoceMod('all'); setConoceSector('all'); setConoceMun('all'); }}>Reiniciar Filtros</Button>
                             </div>
                          </Card>

                          <Card className="executive-card">
                             <ScrollArea className="h-[500px]">
                                <Table>
                                   <TableHeader className="bg-slate-50">
                                      <TableRow>
                                         <TableHead className="font-black text-[10px] uppercase py-6 pl-10">Clave</TableHead>
                                         <TableHead className="font-black text-[10px] uppercase">Nombre</TableHead>
                                         <TableHead className="font-black text-[10px] uppercase">Localidad / Municipio</TableHead>
                                         <TableHead className="font-black text-[10px] uppercase text-right pr-10">Valle</TableHead>
                                      </TableRow>
                                   </TableHeader>
                                   <TableBody>
                                      {consultaResults.map((s, i) => (
                                         <TableRow key={i} className="hover:bg-primary/5 transition-all">
                                            <TableCell className="font-black text-xs text-primary py-4 pl-10">{s.cct}</TableCell>
                                            <TableCell className="font-black text-[11px] text-slate-700 uppercase">{s.nombre}</TableCell>
                                            <TableCell>
                                               <div className="flex flex-col">
                                                  <span className="font-bold text-[10px] text-slate-600">{s.localidad}</span>
                                                  <span className="text-[9px] text-slate-400 font-bold uppercase">{s.municipio}</span>
                                               </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-10 font-black text-[10px] text-slate-400 uppercase">{s.valle}</TableCell>
                                         </TableRow>
                                      ))}
                                      {consultaResults.length === 0 && (
                                         <TableRow><TableCell colSpan={4} className="text-center py-20 font-black uppercase text-slate-300">No hay resultados para los filtros seleccionados</TableCell></TableRow>
                                      )}
                                   </TableBody>
                                </Table>
                             </ScrollArea>
                          </Card>
                       </div>
                    </TabsContent>
                 </Tabs>
              </div>
           ) : isGeoTab ? (
             <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border-2 border-primary/5 shadow-lg">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><Filter className="h-5 w-5" /></div>
                      <span className="text-[11px] font-black uppercase text-primary tracking-widest">Auditoría Territorial (CCT):</span>
                   </div>
                   <div className="flex flex-wrap gap-4 flex-1 justify-end">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          placeholder="BUSCAR CCT O ESCUELA..." 
                          className="h-12 w-64 rounded-xl font-black text-[10px] uppercase pl-10 border-slate-200"
                          value={geoSearchTerm || ''}
                          onChange={(e) => setGeoSearchTerm(e.target.value)}
                        />
                      </div>
                      <Select value={mapValleFilter} onValueChange={setMapValleFilter}>
                        <SelectTrigger className="h-12 w-48 rounded-xl font-black text-[10px] uppercase border-slate-200"><SelectValue placeholder="VALLE" /></SelectTrigger>
                        <SelectContent className="font-black">
                           <SelectItem value="all">TODOS LOS VALLES</SelectItem>
                           <SelectItem value="MEXICO">VALLE DE MÉXICO</SelectItem>
                           <SelectItem value="TOLUCA">VALLE DE TOLUCA</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={mapModalidadFilter} onValueChange={setMapModalidadFilter}>
                        <SelectTrigger className="h-12 w-48 rounded-xl font-black text-[10px] uppercase border-slate-200"><SelectValue placeholder="MODALIDAD" /></SelectTrigger>
                        <SelectContent className="font-black">
                           <SelectItem value="all">TODAS LAS MODALIDADES</SelectItem>
                           <SelectItem value="DES">S. GENERALES</SelectItem>
                           <SelectItem value="DST">S. TÉCNICAS</SelectItem>
                           <SelectItem value="DTV">TELESECUNDARIAS</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                   <Card className="lg:col-span-2 rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white">
                      <CardHeader className="p-8 border-b bg-slate-50/50">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><TableIcon className="h-5 w-5" /></div>
                               <CardTitle className="text-sm font-black uppercase text-primary tracking-widest">Base de Datos de Planteles</CardTitle>
                            </div>
                            <Badge className="bg-primary/5 text-primary border-none text-[10px] font-black px-4 py-1.5 rounded-full">Mostrando {geoSchools.length} registros</Badge>
                         </div>
                      </CardHeader>
                      <ScrollArea className="h-[600px]">
                         <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 z-10">
                               <TableRow>
                                  <TableHead className="text-[10px] font-black uppercase py-4 pl-10">CCT</TableHead>
                                  <TableHead className="text-[10px] font-black uppercase">Nombre de la Escuela</TableHead>
                                  <TableHead className="text-[10px] font-black uppercase">Municipio</TableHead>
                                  <TableHead className="text-[10px] font-black uppercase">Modalidad</TableHead>
                                  <TableHead className="text-[10px] font-black uppercase text-right pr-10">Valle</TableHead>
                               </TableRow>
                            </TableHeader>
                            <TableBody>
                               {geoSchools.map((school, i) => (
                                  <TableRow key={i} className="hover:bg-slate-50 transition-colors border-slate-100">
                                     <TableCell className="py-4 pl-10 font-black text-xs text-primary">{school.cct}</TableCell>
                                     <TableCell className="font-bold text-[11px] text-slate-700 uppercase">{school.nombre}</TableCell>
                                     <TableCell className="font-bold text-[10px] text-slate-500 uppercase">{school.municipio}</TableCell>
                                     <TableCell>
                                        <Badge className={cn(
                                           "text-[9px] font-black border-none uppercase px-2 py-0.5",
                                           school.modalidad === 'DES' ? 'bg-primary text-white' : school.modalidad === 'DST' ? 'bg-accent text-white' : 'bg-slate-400 text-white'
                                        )}>
                                           {school.modalidad === 'DES' ? 'General' : school.modalidad === 'DST' ? 'Técnica' : 'Tele'}
                                        </Badge>
                                     </TableCell>
                                     <TableCell className="text-right pr-10">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">{school.valle}</span>
                                     </TableCell>
                                  </TableRow>
                               ))}
                            </TableBody>
                         </Table>
                      </ScrollArea>
                   </Card>

                   <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden flex flex-col">
                      <CardHeader className="p-8 border-b bg-slate-50/50">
                         <div className="flex items-center gap-4 mb-1">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><Activity className="h-5 w-5" /></div>
                            <CardTitle className="text-sm font-black uppercase text-primary tracking-widest">Impacto Municipal</CardTitle>
                         </div>
                      </CardHeader>
                      <div className="flex-1 overflow-hidden">
                         <ScrollArea className="h-[600px]">
                            <div className="p-8 space-y-4">
                               {Array.from(new Set(geoSchools.map(s => s.municipio))).sort().map((mun, i) => {
                                  const munSchools = geoSchools.filter(s => s.municipio === mun);
                                  return (
                                    <div key={i} className="p-5 bg-slate-50/50 rounded-2xl border border-primary/5 hover:bg-white hover:shadow-xl transition-all group">
                                       <div className="flex justify-between items-center mb-3">
                                          <span className="text-[11px] font-black text-slate-700 uppercase group-hover:text-primary transition-colors">{mun}</span>
                                          <Badge className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-xl shadow-lg">{munSchools.length}</Badge>
                                       </div>
                                       <div className="flex gap-2 flex-wrap">
                                          {munSchools.slice(0, 10).map((s, idx) => (
                                             <div key={idx} className={cn("h-1.5 w-4 rounded-full shadow-sm", s.modalidad === 'DTV' ? 'bg-slate-300' : s.modalidad === 'DST' ? 'bg-accent/60' : 'bg-primary/60')} />
                                          ))}
                                          {munSchools.length > 10 && <span className="text-[9px] font-black text-slate-300 ml-1">+{munSchools.length - 10}</span>}
                                       </div>
                                    </div>
                                  );
                               })}
                            </div>
                         </ScrollArea>
                      </div>
                   </Card>
                </div>
             </div>
           ) : (
            <>
              <Card className="executive-card p-10 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 relative z-10">
                    <div className="flex items-center gap-8">
                       <div className="h-24 w-24 rounded-3xl bg-primary/5 flex items-center justify-center border-2 border-primary/5 shadow-inner">
                          {isLibraryTab ? <MonitorCheck className="h-12 w-12 text-primary" /> : isCuentasTab ? <Mail className="h-12 w-12 text-primary" /> : <Layers className="h-12 w-12 text-primary" />}
                       </div>
                       <div className="space-y-2">
                          <div className="flex items-center gap-4">
                             <h3 className="text-3xl font-black uppercase tracking-tight text-slate-800 leading-none">
                               {isCuentasTab ? "Cuentas Institucionales" : activeTab}
                             </h3>
                             <Badge className="bg-accent/10 text-accent border-none uppercase font-black text-[9px] px-4 py-1.5 rounded-full tracking-widest">{currentStats?.status}</Badge>
                          </div>
                          
                          {!isCuentasTab && (
                            <div className="flex flex-wrap items-center gap-8 pt-3">
                              <div className="flex items-center gap-2.5 text-[11px] font-black uppercase text-slate-400">
                                  <Calendar className="h-4 w-4 text-primary" /> Act: {currentStats?.lastUpdate ?? ''}
                              </div>
                              <div className="flex items-center gap-2.5 text-[11px] font-black uppercase text-slate-400">
                                  <School className="h-4 w-4 text-primary" /> Planteles: <span className="text-primary">{currentStats?.count}</span> {(!isLibraryTab && !isCuentasTab) && `/ ${TOTAL_UNIVERSE}`}
                              </div>
                              {isLibraryTab && (
                                <div className="flex items-center gap-2.5 text-[11px] font-black uppercase text-emerald-600 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
                                    <MonitorCheck className="h-4 w-4" /> Equipos: {currentStats?.totalEquipos}
                                </div>
                              )}
                            </div>
                          )}

                          {isCuentasTab && (
                            <div className="space-y-4 pt-3">
                               <div className="flex flex-wrap items-center gap-4">
                                  <div className="flex items-center gap-2.5 text-[11px] font-black uppercase text-blue-600 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
                                      <Mail className="h-4 w-4" /> Cuentas Activas: {rubroStats.find(s => s.name.includes('Cuentas'))?.count}
                                  </div>
                               </div>
                            </div>
                          )}
                       </div>
                    </div>

                    {!isLibraryTab && !isCuentasTab && (
                      <div className="text-right bg-slate-50 p-8 rounded-[2rem] border-2 border-white shadow-inner min-w-[220px]">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Avance Global</p>
                        <p className="text-6xl font-black text-primary leading-none tracking-tighter">{currentStats?.progress}<span className="text-2xl text-accent ml-1">%</span></p>
                      </div>
                    )}
                 </div>

                 {isLibraryTab && (
                   <div className="mt-12 space-y-8">
                      <div className="flex items-center justify-between border-b-2 border-slate-50 pb-6">
                         <h4 className="text-[12px] font-black uppercase text-slate-500 flex items-center gap-3 tracking-[0.2em]">
                            <History className="h-5 w-5" /> Detalle Operativo por Modalidad
                         </h4>
                         <div className="flex items-center gap-4">
                            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} size="sm" className="h-10 px-6 rounded-xl font-black uppercase text-[10px] gap-2 shadow-md">
                               <PlusCircle className="h-4 w-4" /> Nueva Ficha
                            </Button>
                            <Badge className="bg-primary/5 text-primary border-none text-[10px] font-black uppercase px-6 py-2 rounded-xl shadow-inner">Auditoría Institucional</Badge>
                         </div>
                      </div>
                      <div className="rounded-3xl border border-slate-100 bg-slate-50/50 overflow-x-auto shadow-sm">
                         <Table className="min-w-[1000px]">
                            <TableHeader className="bg-white/80">
                               <TableRow className="border-none">
                                  <TableHead className="text-[10px] font-black uppercase py-6 pl-10">Folio / Oficio</TableHead>
                                  <TableHead className="text-[10px] font-black uppercase">Centro de Trabajo (CCT)</TableHead>
                                  <TableHead className="text-[10px] font-black uppercase text-center">ZE/SEC</TableHead>
                                  <TableHead className="text-[10px] font-black uppercase text-center">Estatus</TableHead>
                                  <TableHead className="text-[10px] font-black uppercase text-right">Equipos</TableHead>
                                  <TableHead className="text-[10px] font-black uppercase text-right pr-10">Acción</TableHead>
                               </TableRow>
                            </TableHeader>
                            <TableBody>
                               {currentStats?.records.map((rec, idx) => (
                                 <TableRow key={idx} className="hover:bg-white transition-all border-slate-100 group">
                                    <TableCell className="py-6 pl-10">
                                       <div className="flex flex-col">
                                          <span className="text-xs font-black text-primary">{rec.id}</span>
                                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{rec.numeroOficio || '-'}</span>
                                       </div>
                                    </TableCell>
                                    <TableCell>
                                       <div className="flex flex-col">
                                          <span className="text-xs font-black text-slate-700">{rec.cct}</span>
                                          <span className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[150px]">{rec.schoolName}</span>
                                       </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                       <div className="text-[10px] font-black text-slate-600 bg-white px-2 py-1 rounded-lg border shadow-sm">ZE:{rec.zonaEscolar} / S:{rec.sector}</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                       <div className="flex items-center justify-center gap-2 bg-white px-4 py-1.5 rounded-2xl border shadow-sm w-fit mx-auto">
                                          <Circle className={cn("h-2.5 w-2.5 fill-current", rec.status === 'concluido' ? 'text-emerald-500' : rec.status === 'activo' ? 'text-amber-500' : 'text-rose-500')} />
                                          <span className="text-[9px] font-black uppercase text-slate-500">{rec.status}</span>
                                       </div>
                                    </TableCell>
                                    <TableCell className="text-right text-xs font-black text-emerald-600 pr-4">
                                       {rec.numeroEquipos} <MonitorCheck className="h-3 w-3 inline ml-1" />
                                    </TableCell>
                                    <TableCell className="text-right pr-10">
                                       <div className="flex justify-end gap-2">
                                          <button className="h-10 w-10 bg-white shadow-sm border border-slate-100 text-primary hover:bg-primary hover:text-white rounded-xl transition-all flex items-center justify-center" onClick={() => { setFormData(rec); setEditingId(rec.id); setIsDialogOpen(true); }}>
                                             <Pencil className="h-4 w-4" />
                                          </button>
                                          <button className="h-10 w-10 bg-white shadow-sm border border-slate-100 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all flex items-center justify-center" onClick={() => { if(window.confirm('¿Eliminar registro?')) { const up = records.filter(r => r.id !== rec.id); setRecords(up); localStorage.setItem('programs_full', JSON.stringify(up)); toast({title:"Eliminado"}); } }}>
                                             <Trash2 className="h-4 w-4" />
                                          </button>
                                       </div>
                                    </TableCell>
                                 </TableRow>
                               ))}
                            </TableBody>
                         </Table>
                      </div>
                   </div>
                 )}

                 {isCuentasTab && (
                   <div className="mt-12 space-y-8">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-slate-50 pb-6 gap-4">
                         <h4 className="text-[12px] font-black uppercase text-slate-500 flex items-center gap-3 tracking-[0.2em]">
                            <Mail className="h-5 w-5" /> Progreso de Cobertura Institucional (Cuentas)
                         </h4>
                         <div className="flex flex-wrap gap-4">
                            <input type="file" className="hidden" ref={fileInputRef} accept=".xlsx, .xls" />
                            <Button variant="outline" size="sm" className="h-10 px-6 rounded-xl font-black uppercase text-[9px] border-primary/20 text-primary hover:bg-primary/5 gap-2 shadow-sm">
                               <FileUp className="h-4 w-4" /> Importar Auditoría
                            </Button>
                            <Button variant="outline" size="sm" className="h-10 px-6 rounded-xl font-black uppercase text-[9px] border-rose-200 text-rose-600 hover:bg-rose-50 gap-2 shadow-sm">
                               <Eraser className="h-4 w-4" /> Limpiar Auditoría
                            </Button>
                         </div>
                      </div>
                      <div className="rounded-3xl border border-slate-100 bg-slate-50/50 overflow-x-auto shadow-sm relative">
                         <Table className="min-w-[950px]">
                            <TableHeader className="bg-white/80 sticky top-0 z-20">
                               <TableRow className="border-none">
                                  <TableHead className="text-[10px] font-black uppercase py-6 pl-10 min-w-[280px]">Correo Institucional</TableHead>
                                  <TableHead className="text-[10px] font-black uppercase min-w-[140px]">CCT</TableHead>
                                  <TableHead className="text-[10px] font-black uppercase text-center min-w-[140px]">Estatus</TableHead>
                                  <TableHead className="text-[10px] font-black uppercase text-right pr-10 min-w-[140px] sticky right-0 bg-white/95 backdrop-blur-md shadow-[-10px_0_15px_rgba(0,0,0,0.03)] border-l z-30">Acción</TableHead>
                               </TableRow>
                            </TableHeader>
                            <TableBody>
                               {records.filter(r => r.name.includes('Cuentas')).map((rec, idx) => {
                                 const acc = (rec.asistentes && rec.asistentes.length > 0) ? rec.asistentes[0] : initialAssistant;
                                 const isEditing = editingRowId === rec.id;
                                 return (
                                 <TableRow key={idx} className={cn("transition-all border-slate-100 group relative", isEditing ? "bg-primary/[0.02]" : "hover:bg-white")}>
                                    <TableCell className="py-6 pl-10">
                                       {isEditing ? (
                                         <Input className="h-9 text-xs font-black lowercase text-primary w-full bg-white border-primary/20" value={inlineFormData?.email ?? ''} onChange={e => setInlineFormData({...inlineFormData, email: e.target.value})} />
                                       ) : (
                                         <div className="flex flex-col">
                                            <span className="text-xs font-black text-primary lowercase">{acc.email || '-'}</span>
                                            <Badge className="bg-blue-100 text-blue-700 border-none font-black text-[8px] w-fit mt-1">@desysa.edu.mx</Badge>
                                         </div>
                                       )}
                                    </TableCell>
                                    <TableCell>
                                       {isEditing ? (
                                         <Input className="h-9 text-xs font-black uppercase w-full bg-white border-primary/20" value={inlineFormData?.cct ?? ''} onChange={e => setInlineFormData({...inlineFormData, cct: e.target.value.toUpperCase()})} maxLength={10} />
                                       ) : (
                                         <span className="text-xs font-black text-slate-700 uppercase">{rec.cct || '-'}</span>
                                       )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                       {isEditing ? (
                                         <Select value={inlineFormData?.status ?? 'activo'} onValueChange={val => setInlineFormData({...inlineFormData, status: val})}>
                                            <SelectTrigger className="h-9 w-full text-[10px] font-black uppercase bg-white border-primary/20"><SelectValue /></SelectTrigger>
                                            <SelectContent className="font-black"><SelectItem value="activo">ACTIVO</SelectItem><SelectItem value="inactivo">INACTIVO</SelectItem></SelectContent>
                                         </Select>
                                       ) : (
                                         <div className="flex items-center justify-center gap-2 bg-white px-4 py-1.5 rounded-2xl border shadow-sm w-fit mx-auto">
                                            <Circle className={cn("h-2 w-2 fill-current", rec.status === 'activo' ? 'text-emerald-500' : 'text-rose-500')} />
                                            <span className="text-[9px] font-black uppercase text-slate-500">{rec.status}</span>
                                         </div>
                                       )}
                                    </TableCell>
                                    <TableCell className="text-right pr-10 sticky right-0 z-30 bg-white/95 backdrop-blur-md shadow-[-10px_0_15px_rgba(0,0,0,0.03)] border-l">
                                       <div className="flex justify-end gap-2">
                                          {isEditing ? (
                                            <>
                                              <button className="h-9 w-9 bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white rounded-xl transition-all flex items-center justify-center" onClick={saveInlineEdit}><Check className="h-4 w-4" /></button>
                                              <button className="h-9 w-9 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white rounded-xl transition-all flex items-center justify-center" onClick={cancelInlineEdit}><X className="h-4 w-4" /></button>
                                            </>
                                          ) : (
                                            <>
                                              <button className="h-9 w-9 bg-white shadow-sm border border-slate-100 text-primary hover:bg-primary hover:text-white rounded-xl transition-all flex items-center justify-center" onClick={() => startInlineEdit({id: rec.id, email: acc.email, cct: rec.cct, status: rec.status})}><Pencil className="h-4 w-4" /></button>
                                              <button className="h-9 w-9 bg-white shadow-sm border border-slate-100 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all flex items-center justify-center" onClick={() => { if(window.confirm('¿Eliminar registro?')) { const up = records.filter(r => r.id !== rec.id); setRecords(up); localStorage.setItem('programs_full', JSON.stringify(up)); toast({title:"Eliminado"}); } }}><Trash2 className="h-4 w-4" /></button>
                                            </>
                                          )}
                                       </div>
                                    </TableCell>
                                 </TableRow>
                               )})}
                            </TableBody>
                         </Table>
                      </div>
                   </div>
                 )}
              </Card>

              {(!isLibraryTab && !isCuentasTab && !isGeoTab) && (
                 <Card className="executive-card mt-10">
                    <CardHeader className="p-8 border-b border-slate-50">
                      <CardTitle className="text-lg font-black uppercase text-primary flex items-center gap-3">
                        <History className="h-6 w-6" /> Historial de Intervenciones
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table className="min-w-[900px]">
                          <TableHeader className="bg-slate-50/50">
                            <TableRow className="border-none">
                              <TableHead className="text-[10px] font-black uppercase py-6 pl-10">Folio</TableHead>
                              <TableHead className="text-[10px] font-black uppercase">Centro de Trabajo (CCT)</TableHead>
                              <TableHead className="text-[10px] font-black uppercase text-center">Estatus</TableHead>
                              <TableHead className="text-[10px] font-black uppercase text-right pr-10">Acción</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentStats?.records.map((rec, idx) => (
                              <TableRow key={idx} className="hover:bg-slate-50/50 transition-all border-slate-50 group">
                                <TableCell className="py-6 pl-10 text-xs font-black text-primary">{rec.id}</TableCell>
                                <TableCell>
                                   <div className="flex flex-col">
                                      <span className="text-xs font-black text-slate-700">{rec.cct || '-'}</span>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[200px]">{rec.schoolName || '-'}</span>
                                   </div>
                                </TableCell>
                                <TableCell className="text-center">
                                   <div className="flex items-center justify-center gap-2 bg-white px-4 py-1 rounded-full border shadow-sm w-fit mx-auto">
                                      <Circle className={cn("h-2 w-2 fill-current", rec.status === 'concluido' ? 'text-emerald-500' : rec.status === 'activo' ? 'text-amber-500' : 'text-rose-500')} />
                                      <span className="text-[9px] font-black uppercase text-slate-500">{rec.status}</span>
                                   </div>
                                </TableCell>
                                <TableCell className="text-right pr-10">
                                   <div className="flex justify-end gap-2">
                                      <button className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg flex items-center justify-center" onClick={() => { setFormData(rec); setEditingId(rec.id); setIsDialogOpen(true); }}><Pencil className="h-4 w-4" /></button>
                                   </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                 </Card>
              )}
            </>
           )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[1200px] h-[95vh] flex flex-col p-0 border-none shadow-[0_50px_100px_rgba(0,0,0,0.4)] rounded-[3rem] overflow-hidden">
          <DialogHeader className="p-10 pb-6 bg-slate-50 border-b relative">
            <div className="absolute right-12 top-10 h-16 w-16 bg-white rounded-3xl flex items-center justify-center border shadow-xl border-primary/5">
               <Settings2 className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="uppercase font-black text-primary text-4xl tracking-tighter flex items-center gap-6 leading-none">
              Ficha Técnica <br /> <span className="text-xl text-slate-400 font-bold">{activeTabClean}</span>
            </DialogTitle>
            <DialogDescription className="font-black text-[11px] uppercase text-slate-400 tracking-[0.4em] mt-3">Expediente de Registro Técnico Administrativo</DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 px-10">
            <div className="grid gap-12 py-12 pb-20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3 col-span-2">
                  <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2">Folio de Registro (Oficial)</Label>
                  <Input value={formData.id ?? ''} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} placeholder="P-001" className="h-16 rounded-[1.5rem] font-black text-lg border-primary/10 bg-slate-50/50 shadow-inner px-8" disabled={!!editingId} />
                </div>
              </div>

              {!isCuentasTab && (
                <div className="p-10 bg-primary/[0.03] rounded-[3rem] space-y-8 border-4 border-white shadow-xl shadow-slate-100">
                  <div className="flex items-center gap-4 border-b border-primary/5 pb-6">
                     <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg"><Search className="h-6 w-6" /></div>
                     <h3 className="text-sm font-black uppercase text-primary tracking-[0.2em]">Geolocalización del Centro de Trabajo</h3>
                  </div>
                  <div className="relative">
                    <Input 
                      placeholder="ESCRIBE CCT O NOMBRE PARA IDENTIFICAR PLANTEL..." 
                      className="bg-white h-16 font-black uppercase px-8 rounded-2xl border-primary/10 shadow-lg text-lg placeholder:text-slate-300" 
                      value={searchTerm ?? ''} 
                      onChange={e => setSearchTerm(e.target.value)} 
                    />
                    {searchTerm.length > 2 && (
                      <div className="absolute z-50 w-full mt-4 bg-white/90 backdrop-blur-xl border border-primary/5 rounded-[2rem] shadow-[0_32px_64px_rgba(0,0,0,0.15)] max-h-80 overflow-auto p-4 animate-in zoom-in-95 duration-200">
                        {schoolsDirectory.filter(s => s.cct.includes(searchTerm.toUpperCase()) || s.nombre.includes(searchTerm.toUpperCase())).slice(0, 10).map(s => (
                          <div key={s.cct} className="p-5 hover:bg-primary/5 cursor-pointer rounded-2xl border-b last:border-0 border-slate-50 transition-all flex justify-between items-center group" onClick={() => { handleSelectSchool(s.cct); setSearchTerm('') }}>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-primary font-black text-base group-hover:scale-105 transition-transform">{s.cct}</span>
                              <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">{s.nombre}</span>
                            </div>
                            <Badge className="bg-accent/10 text-accent font-black uppercase text-[9px] px-4 py-1.5 rounded-full">{s.valle}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {formData.cct && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 pt-4 animate-in slide-in-from-top-4 duration-500">
                      <div className="col-span-2 md:col-span-3 p-6 bg-white rounded-3xl border border-primary/5 flex items-center gap-6 shadow-sm">
                         <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner"><School className="h-8 w-8" /></div>
                         <div className="flex-1 overflow-hidden">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Nombre del Centro de Trabajo</p>
                            <p className="text-lg font-black text-slate-800 uppercase truncate">{formData.schoolName ?? ''}</p>
                         </div>
                      </div>
                      {[
                        { l: 'ZONA (ZE)', v: formData.zonaEscolar },
                        { l: 'SECTOR', v: formData.sector },
                        { l: 'MUNICIPIO', v: formData.municipio },
                        { l: 'MODALIDAD', v: formData.modalidad },
                        { l: 'VALLE', v: formData.valle }
                      ].map((item, i) => (
                        <div key={i} className="p-6 bg-white rounded-3xl border border-primary/5 shadow-sm">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">{item.l}</p>
                          <p className="text-sm font-black text-slate-800 uppercase">{item.v ?? ''}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {isLibraryTab && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4 border-b border-primary/5 pb-6">
                     <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg"><Zap className="h-6 w-6" /></div>
                     <h3 className="text-sm font-black uppercase text-primary tracking-[0.2em]">Especificaciones Técnicas</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                     <div className="space-y-3"><Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Equipos</Label><Input type="number" value={formData.numeroEquipos ?? 0} onChange={e => setFormData({...formData, numeroEquipos: parseInt(e.target.value) || 0})} className="h-14 rounded-2xl font-black bg-slate-50/50" /></div>
                     <div className="col-span-3 space-y-3"><Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Descripción del Equipamiento</Label><Input value={formData.descripcionEquipo ?? ''} onChange={e => setFormData({...formData, descripcionEquipo: e.target.value})} placeholder="EJ: SERVIDOR, 20 LAPTOPS, ROUTER..." className="h-14 rounded-2xl font-black bg-slate-50/50 px-8" /></div>
                  </div>
                </div>
              )}

              {(isLibraryTab || isCuentasTab) && (
                <div className={cn("space-y-10 p-10 rounded-[3rem] border-4 border-white shadow-xl", isLibraryTab ? "bg-emerald-50/30" : "bg-blue-50/30")}>
                   <div className={cn("flex items-center justify-between border-b pb-8", isLibraryTab ? "border-emerald-100" : "border-blue-100")}>
                      <div className="flex items-center gap-4">
                         <div className={cn("h-12 w-12 rounded-2xl text-white flex items-center justify-center shadow-lg", isLibraryTab ? "bg-emerald-600" : "bg-blue-600")}><Users className="h-6 w-6" /></div>
                         <h3 className={cn("text-sm font-black uppercase tracking-[0.2em]", isLibraryTab ? "text-emerald-800" : "text-blue-800")}>Registro de Usuarios y Capacitación</h3>
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                           <Star className={cn("h-5 w-5 fill-current", isLibraryTab ? "text-emerald-600" : "text-blue-600")} />
                           <h4 className={cn("text-[12px] font-black uppercase tracking-widest", isLibraryTab ? "text-emerald-800" : "text-blue-800")}>Lista de Asistentes y Cuentas</h4>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleAddAssistant} className="h-12 px-8 rounded-2xl font-black uppercase text-[10px] bg-white gap-3">
                           <Plus className="h-4 w-4" /> Añadir Registro
                        </Button>
                      </div>

                      <div className="rounded-[2.5rem] border-2 bg-white overflow-hidden shadow-2xl">
                         <ScrollArea className="w-full">
                            <Table>
                              <TableHeader className="bg-slate-50">
                                <TableRow className="border-none">
                                  <TableHead className="w-12 text-[10px] font-black uppercase py-6 pl-10">#</TableHead>
                                  <TableHead className="min-w-[200px] text-[10px] font-black uppercase">Nombre(s) y Apellidos</TableHead>
                                  <TableHead className="min-w-[150px] text-[10px] font-black uppercase">RFC</TableHead>
                                  <TableHead className="min-w-[200px] text-[10px] font-black uppercase">Correo Institucional</TableHead>
                                  <TableHead className="w-12 sticky right-0 bg-white/95"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {formData.asistentes?.map((ast, idx) => (
                                  <TableRow key={idx} className="transition-colors border-b">
                                    <TableCell className="text-center font-black text-xs pl-10 text-slate-300">{idx + 1}</TableCell>
                                    <TableCell className="p-4">
                                       <div className="flex gap-2">
                                          <Input className="h-10 text-[10px] font-black rounded-xl bg-slate-50 uppercase" value={ast.nombres ?? ''} onChange={e => updateAssistant(idx, 'nombres', e.target.value.toUpperCase())} placeholder="NOMBRES" />
                                          <Input className="h-10 text-[10px] font-black rounded-xl bg-slate-50 uppercase" value={ast.paterno ?? ''} onChange={e => updateAssistant(idx, 'paterno', e.target.value.toUpperCase())} placeholder="AP. PATERNO" />
                                       </div>
                                    </TableCell>
                                    <TableCell className="p-4"><Input className="h-10 text-[11px] font-mono font-black rounded-xl bg-white border-slate-300 uppercase" value={ast.rfc ?? ''} onChange={e => updateAssistant(idx, 'rfc', e.target.value.toUpperCase())} maxLength={13} /></TableCell>
                                    <TableCell className="p-4"><Input className="h-10 text-[11px] font-bold rounded-xl bg-white border-slate-300 text-blue-600 lowercase" value={ast.email ?? ''} onChange={e => updateAssistant(idx, 'email', e.target.value.toLowerCase())} placeholder="correo@desysa.edu.mx" /></TableCell>
                                    <TableCell className="p-4 sticky right-0 bg-white/95"><button className="h-10 w-10 text-rose-500 hover:bg-rose-50 rounded-xl flex items-center justify-center" onClick={() => handleRemoveAssistant(idx)} disabled={formData.asistentes?.length === 1}><Trash2 className="h-4 w-4" /></button></TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            <ScrollBar orientation="horizontal" />
                         </ScrollArea>
                      </div>
                   </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Estatus Ejecutivo</Label>
                  <Select value={formData.status ?? 'planeacion'} onValueChange={v => setFormData({...formData, status: v as any})}>
                    <SelectTrigger className="h-16 rounded-[1.5rem] font-black shadow-lg bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="font-black rounded-2xl">
                      <SelectItem value="planeacion" className="text-rose-600">PLANEACIÓN / INICIO</SelectItem>
                      <SelectItem value="activo" className="text-amber-600">EN PROCESO TÉCNICO</SelectItem>
                      <SelectItem value="concluido" className="text-emerald-600">CONCLUIDO / CERRADO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!isCuentasTab && (
                   <div className="space-y-3"><Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">No. de Oficio Oficial</Label><Input value={formData.numeroOficio ?? ''} onChange={e => setFormData({...formData, numeroOficio: e.target.value.toUpperCase()})} placeholder="EJ: DESYSA/PL/2024/001" className="h-16 rounded-[1.5rem] font-black bg-slate-50/50" /></div>
                )}
              </div>

              {!isCuentasTab && (
                <div className="space-y-4">
                  <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2">Bitácora de Observaciones Operativas</Label>
                  <Textarea className="min-h-[200px] rounded-[2.5rem] p-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-primary shadow-inner font-bold text-slate-600 text-base" value={formData.observaciones ?? ''} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder="ESCRIBE AQUÍ DETALLES RELEVANTES DE LA INTERVENCIÓN..." />
                </div>
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter className="p-10 bg-slate-50/80 backdrop-blur-md border-t flex justify-end gap-6">
             <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="h-16 px-12 rounded-2xl font-black uppercase text-[11px] tracking-widest border-slate-300 bg-white">Cancelar</Button>
             <Button onClick={handleSave} className="h-16 px-16 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] bg-primary hover:bg-primary/90 text-white shadow-[0_20px_40px_rgba(98,17,50,0.3)] transition-all hover:scale-105 active:scale-95">Sincronizar Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
