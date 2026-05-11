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
  Globe,
  Filter,
  Activity,
  Info,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  Download,
  X,
  Circle,
  HelpCircle,
  BookOpen,
  Image as ImageIcon,
  Target,
  Building,
  Trophy,
  ArrowLeft,
  Save,
  Eye,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Lock
} from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { cn } from '@/lib/utils'
import Image from 'next/image'

const TOTAL_UNIVERSE = 830; 

const PROGRAM_RUBROS = [
  'Biblioteca Digital',
  'Cuentas Institucionales (@desysa.gob.mx, @desysa.edu.mx, @coees.edu.mx)',
  'Geoposición',
  'Conoce mi Escuela',
  'Mesa de Ayuda Técnica'
];

type WebSchoolData = {
  presentacion: string;
  foto: string;
  resenaHistorica: string;
  mision: string;
  vision: string;
  infraestructura: string;
  logros: string;
  alumnosDistinguidos: string;
}

const initialWebData: WebSchoolData = {
  presentacion: '',
  foto: '',
  resenaHistorica: '',
  mision: '',
  vision: '',
  infraestructura: '',
  logros: '',
  alumnosDistinguidos: ''
}

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [userRfc, setUserRfc] = useState<string | null>(null)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [activeTab, setActiveTab] = useState(PROGRAM_RUBROS[0])
  const [conoceSubTab, setConoceSubTab] = useState('info')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [mapValleFilter, setMapValleFilter] = useState('all')
  const [mapModalidadFilter, setMapModalidadFilter] = useState('all')
  const [geoSearchTerm, setGeoSearchTerm] = useState('')

  const [conoceValle, setConoceValle] = useState('all')
  const [conoceMod, setConoceMod] = useState('all')
  const [conoceSector, setConoceSector] = useState('all')
  const [conoceMun, setConoceMun] = useState('all')

  const [incCct, setIncCct] = useState('')
  const [generatedPass, setGeneratedPass] = useState<string | null>(null)
  const [showWebAssistant, setShowWebAssistant] = useState(false)
  const [assistantStep, setAssistantStep] = useState<'welcome' | 'capture' | 'preview'>('welcome')
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  
  // Editorial Auth State
  const [isEditorialAuthOpen, setIsEditorialAuthOpen] = useState(false)
  const [editorialCredentials, setEditorialCredentials] = useState({ user: '', pass: '' })

  const [webSchoolData, setWebSchoolData] = useState<WebSchoolData>(initialWebData)
  const [savedSubmissions, setSavedSubmissions] = useState<{cct: string, name: string, date: string}[]>([])

  const webFotoRef = useRef<HTMLInputElement>(null);

  const isAdminEditorial = userRfc?.toUpperCase() === 'CEDITORIAL';

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
    const rfc = localStorage.getItem('userRfc')
    setUserRfc(rfc)
    const stored = JSON.parse(localStorage.getItem('programs_full') || '[]')
    if (stored.length > 0) {
      setRecords(stored)
    } else {
      setRecords(programsData)
    }
    loadSubmissions()
  }, [])

  const loadSubmissions = () => {
    const subs: {cct: string, name: string, date: string}[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('web_school_data_')) {
        const cct = key.replace('web_school_data_', '');
        const school = schoolsDirectory.find(s => s.cct === cct);
        subs.push({ 
          cct, 
          name: school?.nombre || 'Escuela Desconocida',
          date: format(new Date(), 'yyyy/MM/dd')
        });
      }
    }
    setSavedSubmissions(subs);
  }

  const handleEditorialTabClick = (val: string) => {
    if (val === 'editorial' && !isAdminEditorial) {
      setIsEditorialAuthOpen(true);
    } else {
      setConoceSubTab(val);
    }
  }

  const handleEditorialLogin = () => {
    if (editorialCredentials.user.toUpperCase() === 'CEDITORIAL' && editorialCredentials.pass === 'SEIEM') {
      localStorage.setItem('userRfc', 'CEDITORIAL');
      setUserRfc('CEDITORIAL');
      setConoceSubTab('editorial');
      setIsEditorialAuthOpen(false);
      toast({ title: "Acceso Editorial Concedido", description: "Iniciando panel de auditoría." });
      loadSubmissions();
    } else {
      toast({ variant: "destructive", title: "Error", description: "Usuario o contraseña editorial incorrectos." });
    }
  }

  const handleGeneratePass = (targetCct?: string) => {
    const cctToUse = targetCct || incCct;
    const cleanCct = cctToUse.trim().toUpperCase();
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
    toast({ title: "Contraseña Generada", description: `Acceso para ${cleanCct} creado exitosamente.` })
  }

  const handleReviewSubmission = (cct: string) => {
    setIncCct(cct);
    const stored = localStorage.getItem(`web_school_data_${cct}`);
    if (stored) {
      setWebSchoolData(JSON.parse(stored));
      setShowWebAssistant(true);
      setAssistantStep('preview');
      toast({ title: "Cargando Vista de Revisión", description: `Auditoría para el plantel ${cct}.` });
    } else {
      toast({ variant: "destructive", title: "Sin datos", description: "No hay captura previa para este CCT." });
    }
  }

  const handleAction = (type: 'publicar' | 'suspender' | 'observaciones', cct: string) => {
    toast({ 
      title: type.toUpperCase(), 
      description: `Acción aplicada al plantel ${cct} de forma satisfactoria.` 
    });
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

      return { name, progress, status, lastUpdate, count: uniqueSchools, records: rubroRecords };
    });
  }, [records]);

  const activeTabClean = activeTab.includes('(') ? activeTab.split('(')[0].trim() : activeTab;
  const isLibraryTab = activeTabClean === 'Biblioteca Digital';
  const isCuentasTab = activeTabClean === 'Cuentas Institucionales';
  const isGeoTab = activeTabClean === 'Geoposición';
  const isConoceTab = activeTabClean === 'Conoce mi Escuela';
  
  const currentStats = useMemo(() => rubroStats.find(s => s.name === activeTab), [rubroStats, activeTab]);

  const geoSchools = useMemo(() => {
    return schoolsDirectory.filter(s => {
      const matchValle = mapValleFilter === 'all' || s.valle === mapValleFilter;
      const matchModalidad = mapModalidadFilter === 'all' || s.modalidad === mapModalidadFilter;
      const matchSearch = !geoSearchTerm || 
        s.cct.toUpperCase().includes(geoSearchTerm.toUpperCase()) || 
        s.nombre.toUpperCase().includes(geoSearchTerm.toUpperCase());
      return matchValle && matchModalidad && matchSearch;
    });
  }, [mapValleFilter, mapModalidadFilter, geoSearchTerm]);

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

  const handleWebFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setWebSchoolData(prev => ({ ...prev, foto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveWebProgress = () => {
    if (!incCct) return;
    localStorage.setItem(`web_school_data_${incCct}`, JSON.stringify(webSchoolData));
    setShowSuccessDialog(true);
    loadSubmissions();
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
                             <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] mt-2">COEES - Departamento de Computación Electrónica</p>
                          </div>
                       </div>
                       <div className="space-y-6 text-slate-600 font-medium leading-relaxed">
                          <p>
                            <strong>Conoce mi Escuela</strong> es un programa creado y administrado por el Departamento de Computación Electrónica en la Educación Secundaria (COEES), el cual inició en el 2006. Se perfila como la única vía autorizada para que las escuelas cuenten con un espacio Web para proyectar su trabajo hacia la comunidad y autoridades educativas.
                          </p>
                       </div>
                    </div>
                 </Card>

                 <Tabs value={conoceSubTab} onValueChange={handleEditorialTabClick} className="space-y-8">
                    <TabsList className="bg-slate-100 p-1.5 rounded-2xl h-14 w-full flex overflow-x-auto justify-start">
                       <TabsTrigger value="info" className="rounded-xl px-8 font-black uppercase text-[10px] gap-2"><Info className="h-4 w-4" /> Información</TabsTrigger>
                       <TabsTrigger value="incorp" className="rounded-xl px-8 font-black uppercase text-[10px] gap-2"><UserPlus className="h-4 w-4" /> Incorporación</TabsTrigger>
                       <TabsTrigger value="editorial" className="rounded-xl px-8 font-black uppercase text-[10px] gap-2 bg-amber-50 text-amber-700 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                           <ClipboardCheck className="h-4 w-4" /> SECCIÓN EDITORIAL DE WEBESCUELA
                       </TabsTrigger>
                       <TabsTrigger value="list" className="rounded-xl px-8 font-black uppercase text-[10px] gap-2"><TableIcon className="h-4 w-4" /> Escuelas Incorporadas</TabsTrigger>
                       <TabsTrigger value="search" className="rounded-xl px-8 font-black uppercase text-[10px] gap-2"><Search className="h-4 w-4" /> Consulta tu Escuela</TabsTrigger>
                    </TabsList>

                    <TabsContent value="editorial" className="animate-in fade-in slide-in-from-bottom-4">
                       <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
                          <div className="bg-slate-50 p-8 border-b">
                             <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-black uppercase text-primary tracking-tighter">Bienvenido a la Sección Editorial de WebEscuela</h3>
                                <Button variant="ghost" size="sm" className="h-10 px-6 rounded-xl font-black uppercase text-[9px] bg-white border border-slate-200" onClick={() => setConoceSubTab('info')}><ArrowLeft className="h-4 w-4 mr-2" /> Cerrar</Button>
                             </div>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                               Ud. puede revisar la información de cada una de ellas, editarla y, posteriormente, publicarla en el Servidor o suspenderla.
                             </p>
                          </div>
                          <div className="overflow-x-auto">
                            <Table className="min-w-[1500px]">
                              <TableHeader className="bg-slate-100/50">
                                <TableRow>
                                  <TableHead className="w-10 text-center font-black text-[9px] uppercase border-r py-4">No.</TableHead>
                                  <TableHead className="min-w-[120px] font-black text-[9px] uppercase border-r">Centro de Trabajo</TableHead>
                                  <TableHead className="min-w-[140px] font-black text-[9px] uppercase border-r">Agrupado</TableHead>
                                  <TableHead className="w-20 font-black text-[9px] uppercase border-r text-center">Vertiente</TableHead>
                                  <TableHead className="w-16 font-black text-[9px] uppercase border-r text-center">Sector</TableHead>
                                  <TableHead className="w-16 font-black text-[9px] uppercase border-r text-center">Zona</TableHead>
                                  <TableHead className="min-w-[100px] font-black text-[9px] uppercase border-r text-center">Alta</TableHead>
                                  <TableHead className="min-w-[100px] font-black text-[9px] uppercase border-r text-center">Mod.</TableHead>
                                  <TableHead className="min-w-[100px] font-black text-[9px] uppercase border-r text-center text-emerald-600">Revisión</TableHead>
                                  <TableHead className="min-w-[100px] font-black text-[9px] uppercase border-r text-center">Pub.</TableHead>
                                  <TableHead className="min-w-[100px] font-black text-[9px] uppercase border-r text-center">Susp.</TableHead>
                                  <TableHead className="min-w-[300px] font-black text-[9px] uppercase border-r">Observaciones</TableHead>
                                  <TableHead className="min-w-[180px] font-black text-[9px] uppercase border-r">eContacto</TableHead>
                                  <TableHead className="min-w-[140px] font-black text-[9px] uppercase text-right pr-6 bg-slate-100 sticky right-0 z-10">Acciones</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {savedSubmissions.map((sub, i) => {
                                  const school = schoolsDirectory.find(s => s.cct === sub.cct);
                                  return (
                                   <TableRow key={i} className="hover:bg-slate-50 transition-all border-b text-[10px]">
                                      <TableCell className="text-center font-bold text-slate-400 border-r">{i + 1}</TableCell>
                                      <TableCell className="font-black text-primary border-r">{sub.cct}</TableCell>
                                      <TableCell className="font-bold text-slate-500 uppercase border-r">DESMEXICO{school?.sectorNum || '00'}</TableCell>
                                      <TableCell className="text-center font-bold text-slate-700 border-r">{school?.modalidad || '-'}</TableCell>
                                      <TableCell className="text-center font-black text-slate-800 border-r">{school?.sectorNum || '-'}</TableCell>
                                      <TableCell className="text-center font-black text-slate-800 border-r">{school?.zonaEscolar || 'S/Z'}</TableCell>
                                      <TableCell className="text-center text-slate-500 border-r">2022/10/19</TableCell>
                                      <TableCell className="text-center text-slate-500 border-r">2022/10/20</TableCell>
                                      <TableCell className="text-center text-emerald-600 border-r font-black">{sub.date}</TableCell>
                                      <TableCell className="text-center text-slate-500 border-r">2023/04/19</TableCell>
                                      <TableCell className="text-center text-slate-300 border-r">-</TableCell>
                                      <TableCell className="p-4 border-r max-w-[400px]">Auditoría 2025: Validación de contenido pendiente.</TableCell>
                                      <TableCell className="font-bold text-blue-600 lowercase border-r underline">{sub.cct.toLowerCase()}@desysa.gob.mx</TableCell>
                                      <TableCell className="text-right pr-6 sticky right-0 z-10 bg-white/95 shadow-[-10px_0_15px_rgba(0,0,0,0.02)]">
                                         <div className="flex flex-col gap-1 items-end py-2">
                                            <button onClick={() => handleReviewSubmission(sub.cct)} className="text-[9px] font-black uppercase text-blue-600 hover:underline">Revisar</button>
                                            <button onClick={() => handleAction('publicar', sub.cct)} className="text-[9px] font-black uppercase text-emerald-600 hover:underline">Publicar</button>
                                            <button onClick={() => handleAction('suspender', sub.cct)} className="text-[9px] font-black uppercase text-rose-600 hover:underline">Suspender</button>
                                            <button className="text-[9px] font-black uppercase text-slate-500 hover:underline">Observaciones</button>
                                            <button className="text-[9px] font-black uppercase text-slate-500 hover:underline">eContacto</button>
                                            <button onClick={() => handleGeneratePass(sub.cct)} className="text-[9px] font-black uppercase text-slate-500 hover:underline">Contraseña</button>
                                         </div>
                                      </TableCell>
                                   </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </div>
                       </Card>
                    </TabsContent>

                    <TabsContent value="incorp" className="animate-in fade-in slide-in-from-bottom-4">
                       {showWebAssistant ? (
                          <div className="animate-in slide-in-from-right-10 duration-700">
                             {assistantStep === 'welcome' && (
                                <Card className="p-0 bg-white shadow-2xl rounded-[3rem] border-none overflow-hidden">
                                   <div className="bg-primary/5 p-6 border-b flex justify-between items-center">
                                      <div className="flex items-center gap-4">
                                         <Button variant="ghost" size="icon" onClick={() => setShowWebAssistant(false)} className="rounded-full h-10 w-10 text-primary">
                                            <ArrowLeft className="h-5 w-5" />
                                         </Button>
                                         <h4 className="font-black uppercase text-sm text-primary">Construya la Página de su Escuela</h4>
                                      </div>
                                   </div>
                                   <div className="p-12 max-w-4xl mx-auto space-y-12 text-center">
                                      <div className="space-y-6">
                                         <h3 className="text-3xl font-black text-slate-800 tracking-tight">Bienvenido al Asistente de WebEscuela</h3>
                                         <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-2xl mx-auto">
                                            Este Asistente lo guiará a través del proceso de construcción de su Página Web oficial. Le tomará entre 10 y 15 minutos.
                                         </p>
                                      </div>
                                      <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 text-left space-y-8">
                                         <h5 className="font-black uppercase text-xs text-primary">Tenga a la mano la siguiente información:</h5>
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {["Presentación", "Foto 300x200", "Reseña histórica", "Misión y Visión", "Infraestructura", "Logros", "Alumnos Distinguidos"].map(t => (
                                               <div key={t} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-50">
                                                  <div className="h-2 w-2 rounded-full bg-primary" />
                                                  <span className="text-[11px] font-bold text-slate-600">{t}</span>
                                               </div>
                                            ))}
                                         </div>
                                      </div>
                                      <Button onClick={() => setAssistantStep('capture')} className="h-16 px-20 rounded-2xl font-black uppercase bg-primary text-white shadow-2xl transition-all">
                                         Empezar <ArrowRight className="h-5 w-5 ml-4" />
                                      </Button>
                                   </div>
                                </Card>
                             )}

                             {assistantStep === 'capture' && (
                                <Card className="p-0 bg-white shadow-2xl rounded-[3rem] border-none overflow-hidden">
                                   <div className="bg-primary/5 p-8 border-b flex justify-between items-center">
                                      <div className="flex items-center gap-6">
                                         <Button variant="ghost" size="icon" onClick={() => setAssistantStep('welcome')} className="rounded-full h-12 w-12 text-primary">
                                            <ArrowLeft className="h-6 w-6" />
                                         </Button>
                                         <h3 className="font-black text-2xl uppercase text-primary">Captura de Información</h3>
                                      </div>
                                      <div className="flex gap-4">
                                         <Button variant="outline" onClick={() => setAssistantStep('preview')} className="rounded-xl h-12 px-8 font-black uppercase text-[10px]">VISTA PREVIA</Button>
                                         <Button onClick={handleSaveWebProgress} className="rounded-xl h-12 px-8 font-black uppercase text-[10px] bg-primary text-white">GUARDAR AVANCE</Button>
                                      </div>
                                   </div>
                                   <ScrollArea className="h-[70vh] p-12">
                                      <div className="max-w-5xl mx-auto space-y-12 pb-20">
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                               <Label className="text-[11px] font-black uppercase text-primary">Presentación</Label>
                                               <Textarea className="min-h-[150px]" value={webSchoolData.presentacion} onChange={e => setWebSchoolData({...webSchoolData, presentacion: e.target.value})} />
                                            </div>
                                            <div className="space-y-4">
                                               <Label className="text-[11px] font-black uppercase text-primary">Foto (300x200)</Label>
                                               <div className="h-[150px] rounded-2xl border-2 border-dashed flex items-center justify-center relative cursor-pointer" onClick={() => webFotoRef.current?.click()}>
                                                  {webSchoolData.foto ? <Image src={webSchoolData.foto} alt="Foto" fill className="object-cover rounded-2xl" /> : <ImageIcon className="h-10 w-10 text-slate-300" />}
                                                  <input type="file" ref={webFotoRef} hidden accept="image/*" onChange={handleWebFotoChange} />
                                               </div>
                                            </div>
                                         </div>
                                         <div className="space-y-4">
                                            <Label className="text-[11px] font-black uppercase text-primary">Reseña Histórica</Label>
                                            <Textarea className="min-h-[150px]" value={webSchoolData.resenaHistorica} onChange={e => setWebSchoolData({...webSchoolData, resenaHistorica: e.target.value})} />
                                         </div>
                                      </div>
                                   </ScrollArea>
                                </Card>
                             )}

                             {assistantStep === 'preview' && (
                                <Card className="p-0 bg-white shadow-2xl rounded-[3rem] border-none overflow-hidden">
                                   <div className="bg-slate-900 p-6 flex justify-between items-center">
                                      <Button variant="ghost" size="icon" onClick={() => setAssistantStep('capture')} className="text-white">
                                         <ArrowLeft className="h-6 w-6" />
                                      </Button>
                                      <h3 className="font-black text-xl uppercase text-white">Simulador Portal Escolar</h3>
                                      {isAdminEditorial && (
                                        <Button onClick={() => toast({ title: "Portal Publicado" })} className="bg-emerald-600 text-white font-black px-10 rounded-xl">PUBLICAR PÁGINA WEB</Button>
                                      )}
                                   </div>
                                   <ScrollArea className="h-[75vh] bg-slate-100 p-10">
                                      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl p-12 min-h-[800px]">
                                         <header className="bg-primary p-8 rounded-2xl text-white mb-10">
                                            <h1 className="text-3xl font-black">{(schoolsDirectory.find(s => s.cct === incCct))?.nombre || 'Centro de Trabajo'}</h1>
                                            <p className="text-xs opacity-80">CCT: {incCct}</p>
                                         </header>
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="relative aspect-video bg-slate-100 rounded-2xl">
                                               {webSchoolData.foto && <Image src={webSchoolData.foto} alt="Hero" fill className="object-cover rounded-2xl" />}
                                            </div>
                                            <div className="space-y-4">
                                               <h2 className="text-xl font-black text-primary">Bienvenida</h2>
                                               <p className="text-sm text-slate-600 leading-relaxed">{webSchoolData.presentacion}</p>
                                            </div>
                                         </div>
                                      </div>
                                   </ScrollArea>
                                </Card>
                             )}
                          </div>
                       ) : (
                          <Card className="p-10 bg-white shadow-2xl rounded-[3rem] border-none">
                             <div className="max-w-xl mx-auto space-y-10 text-center">
                                <h3 className="text-3xl font-black uppercase text-primary">Incorporación al Programa</h3>
                                <div className="space-y-4">
                                   <Label className="text-[11px] font-black uppercase text-slate-600">CCT de la Escuela</Label>
                                   <div className="flex gap-4">
                                      <input className="flex h-16 w-full rounded-2xl font-black text-lg text-center uppercase tracking-widest bg-slate-50 border px-3" placeholder="15DES0000X" maxLength={10} value={incCct} onChange={(e) => setIncCct(e.target.value.toUpperCase())} />
                                      <Button onClick={() => handleGeneratePass()} className="h-16 px-10 rounded-2xl font-black uppercase bg-primary text-white shadow-xl">GENERAR ACCESO</Button>
                                   </div>
                                </div>
                                {generatedPass && (
                                   <div className="p-10 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100 space-y-6">
                                      <div className="text-5xl font-black text-emerald-900 tracking-widest font-mono">{generatedPass}</div>
                                      <Button onClick={() => setShowWebAssistant(true)} className="w-full bg-primary text-white rounded-xl h-14 font-black">CONSTRUIR ESPACIO WEB</Button>
                                   </div>
                                )}
                             </div>
                          </Card>
                       )}
                    </TabsContent>
                 </Tabs>
              </div>
           ) : (
             <Card className="p-10 text-center text-slate-300 font-black uppercase">Módulo en construcción: {activeTab}</Card>
           )}
        </TabsContent>
      </Tabs>

      <Dialog open={isEditorialAuthOpen} onOpenChange={setIsEditorialAuthOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white">
          <div className="bg-amber-600 p-8 text-white text-center">
             <ShieldCheck className="h-12 w-12 mx-auto mb-4" />
             <h3 className="text-xl font-black uppercase">Acceso Editorial</h3>
          </div>
          <div className="p-10 space-y-6">
             <div className="space-y-4">
                <Input className="h-12 font-black uppercase" value={editorialCredentials.user} onChange={e => setEditorialCredentials({...editorialCredentials, user: e.target.value.toUpperCase()})} placeholder="USUARIO" />
                <Input type="password" className="h-12 font-bold" value={editorialCredentials.pass} onChange={e => setEditorialCredentials({...editorialCredentials, pass: e.target.value})} placeholder="CONTRASEÑA" />
             </div>
             <Button onClick={handleEditorialLogin} className="w-full h-14 bg-amber-600 text-white font-black uppercase">AUTENTICAR</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
         <DialogContent className="sm:max-w-[550px] rounded-[3rem] p-12 text-center bg-white">
            <CheckCircle2 className="h-16 w-16 text-emerald-600 mx-auto mb-8" />
            <h3 className="text-2xl font-black uppercase text-primary mb-6">Información Recibida</h3>
            <p className="text-sm font-bold text-slate-600 leading-relaxed uppercase mb-10">
               Se procederá a su revisión por el grupo editorial. Si hay cambios se le contactará. Si no, lo verá publicado en 3 días hábiles.
            </p>
            <Button onClick={() => { setShowSuccessDialog(false); setShowWebAssistant(false); }} className="h-16 px-16 rounded-2xl font-black uppercase bg-primary text-white shadow-2xl">FINALIZAR Y CERRAR</Button>
         </DialogContent>
      </Dialog>
    </div>
  )
}
