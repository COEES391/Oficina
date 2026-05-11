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
  
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [inlineFormData, setInlineFormData] = useState<any>(null)
  
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const webFotoRef = useRef<HTMLInputElement>(null);

  const isAdminEditorial = userRfc?.toUpperCase() === 'CEDITORIAL' || userRfc?.toUpperCase() === 'CEDTORIAL';

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
      toast({ title: "Sesión Editorial Iniciada", description: "Bienvenido al portal de revisión de SEIEM." });
      loadSubmissions();
    } else {
      toast({ variant: "destructive", title: "Credenciales Incorrectas", description: "Verifique su usuario y contraseña editorial." });
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
    toast({ title: "Acceso Generado", description: `Se ha creado la contraseña para ${cleanCct}: ${pass}` })
  }

  const handleReviewSubmission = (cct: string) => {
    setIncCct(cct);
    const stored = localStorage.getItem(`web_school_data_${cct}`);
    if (stored) {
      setWebSchoolData(JSON.parse(stored));
      setShowWebAssistant(true);
      setAssistantStep('preview');
    }
  }

  const handleAction = (type: 'publicar' | 'suspender' | 'observaciones', cct: string) => {
    toast({ 
      title: type.toUpperCase(), 
      description: `Acción ejecutada para el plantel ${cct}. Sincronizando con el servidor central.` 
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
    return schoolsDirectory.filter(s => {
      const matchValle = mapValleFilter === 'all' || s.valle === mapValleFilter;
      const matchModalidad = mapModalidadFilter === 'all' || s.modalidad === mapModalidadFilter;
      const matchSearch = !geoSearchTerm || 
        s.cct.toUpperCase().includes(geoSearchTerm.toUpperCase()) || 
        s.nombre.toUpperCase().includes(geoSearchTerm.toUpperCase());
      return matchValle && matchModalidad && matchSearch;
    });
  }, [mapValleFilter, mapModalidadFilter, geoSearchTerm]);

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

                 <Tabs value={conoceSubTab} onValueChange={handleEditorialTabClick} className="space-y-8">
                    <TabsList className="bg-slate-100 p-1.5 rounded-2xl h-14 w-full flex overflow-x-auto justify-start">
                       <TabsTrigger value="info" className="rounded-xl px-8 font-black uppercase text-[10px] gap-2"><Info className="h-4 w-4" /> Información</TabsTrigger>
                       <TabsTrigger value="incorp" className="rounded-xl px-8 font-black uppercase text-[10px] gap-2"><UserPlus className="h-4 w-4" /> Incorporación</TabsTrigger>
                       <TabsTrigger value="editorial" className="rounded-xl px-8 font-black uppercase text-[10px] gap-2 bg-amber-50 text-amber-700 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                           <ClipboardCheck className="h-4 w-4" /> Sección Editorial de WebEscuela
                       </TabsTrigger>
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

                    <TabsContent value="editorial" className="animate-in fade-in slide-in-from-bottom-4">
                       <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
                          <div className="bg-slate-50 p-8 border-b">
                             <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-black uppercase text-primary tracking-tighter">Bienvenido a la Sección Editorial de WebEscuela</h3>
                                <Button variant="ghost" size="sm" className="h-10 px-6 rounded-xl font-black uppercase text-[9px] bg-white border border-slate-200" onClick={() => setConoceSubTab('info')}><ArrowLeft className="h-4 w-4 mr-2" /> Cerrar</Button>
                             </div>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                               En esta página se encuentra la lista de las escuelas que han colocado su información en WebEscuela, Ud. puede revisar la información de cada una de ellas, editarla y, posteriormente, publicarla en el Servidor o suspenderla.
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
                                  <TableHead className="min-w-[100px] font-black text-[9px] uppercase border-r text-center">Fecha de Alta</TableHead>
                                  <TableHead className="min-w-[100px] font-black text-[9px] uppercase border-r text-center">Fecha de Modificación</TableHead>
                                  <TableHead className="min-w-[100px] font-black text-[9px] uppercase border-r text-center text-emerald-600">Fecha de Revisión</TableHead>
                                  <TableHead className="min-w-[100px] font-black text-[9px] uppercase border-r text-center">Fecha de Publicación</TableHead>
                                  <TableHead className="min-w-[100px] font-black text-[9px] uppercase border-r text-center">Fecha de Suspensión</TableHead>
                                  <TableHead className="min-w-[300px] font-black text-[9px] uppercase border-r">Observaciones</TableHead>
                                  <TableHead className="min-w-[180px] font-black text-[9px] uppercase border-r">eContacto</TableHead>
                                  <TableHead className="min-w-[140px] font-black text-[9px] uppercase text-right pr-6 bg-slate-100 sticky right-0 z-10 shadow-[-10px_0_15px_rgba(0,0,0,0.02)]">Acciones a Realizar</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {savedSubmissions.map((sub, i) => {
                                  const school = schoolsDirectory.find(s => s.cct === sub.cct);
                                  return (
                                   <TableRow key={i} className="hover:bg-slate-50 transition-all border-b text-[10px]">
                                      <TableCell className="text-center font-bold text-slate-400 border-r">{i + 1}</TableCell>
                                      <TableCell className="font-black text-primary border-r">{sub.cct}</TableCell>
                                      <TableCell className="font-bold text-slate-500 uppercase border-r">DESMEXICO{school?.sectorNum || '00'}{school?.zonaEscolar || '000'}</TableCell>
                                      <TableCell className="text-center font-bold text-slate-700 border-r">{school?.modalidad || '-'}</TableCell>
                                      <TableCell className="text-center font-black text-slate-800 border-r">{school?.sectorNum || '-'}</TableCell>
                                      <TableCell className="text-center font-black text-slate-800 border-r">{school?.zonaEscolar || 'S/Z'}</TableCell>
                                      <TableCell className="text-center text-slate-500 border-r font-medium">2022/10/19</TableCell>
                                      <TableCell className="text-center text-slate-500 border-r font-medium">2022/10/20</TableCell>
                                      <TableCell className="text-center text-emerald-600 border-r font-black">{sub.date}</TableCell>
                                      <TableCell className="text-center text-slate-500 border-r font-medium">2023/04/19</TableCell>
                                      <TableCell className="text-center text-slate-300 border-r">-</TableCell>
                                      <TableCell className="p-4 border-r max-w-[400px]">
                                         <p className="line-clamp-4 leading-relaxed text-slate-500 italic font-medium">
                                            Información recibida para auditoría 2025. Se requiere validar la fotografía y los logros académicos reportados por el centro de trabajo.
                                         </p>
                                      </TableCell>
                                      <TableCell className="font-bold text-blue-600 lowercase border-r underline decoration-blue-200">{sub.cct.toLowerCase()}@desysa.gob.mx</TableCell>
                                      <TableCell className="text-right pr-6 sticky right-0 z-10 bg-white/95 backdrop-blur-md shadow-[-10px_0_15px_rgba(0,0,0,0.02)]">
                                         <div className="flex flex-col gap-1 items-end py-2">
                                            <button onClick={() => handleReviewSubmission(sub.cct)} className="text-[9px] font-black uppercase text-blue-600 hover:text-blue-800 underline">Revisar</button>
                                            <button onClick={() => handleAction('publicar', sub.cct)} className="text-[9px] font-black uppercase text-emerald-600 hover:text-emerald-800 underline">Publicar</button>
                                            <button onClick={() => handleAction('suspender', sub.cct)} className="text-[9px] font-black uppercase text-rose-600 hover:text-rose-800 underline">Suspender</button>
                                            <button onClick={() => handleAction('observaciones', sub.cct)} className="text-[9px] font-black uppercase text-slate-500 hover:text-slate-800 underline">Observaciones</button>
                                            <button className="text-[9px] font-black uppercase text-slate-500 hover:text-slate-800 underline">eContacto</button>
                                            <button onClick={() => handleGeneratePass(sub.cct)} className="text-[9px] font-black uppercase text-slate-500 hover:text-slate-800 underline">Contraseña</button>
                                         </div>
                                      </TableCell>
                                   </TableRow>
                                  )
                                })}
                                {savedSubmissions.length === 0 && (
                                   <TableRow><TableCell colSpan={14} className="text-center py-20 font-black uppercase text-slate-300">No hay capturas de escuelas para revisión editorial</TableCell></TableRow>
                                )}
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
                                         
                                         <Button onClick={() => setAssistantStep('capture')} className="h-16 px-20 rounded-2xl font-black uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 text-white shadow-2xl transition-all hover:scale-105">
                                            Empezar <ArrowRight className="h-5 w-5 ml-4" />
                                         </Button>
                                      </div>
                                   </div>
                                </Card>
                             )}

                             {assistantStep === 'capture' && (
                                <Card className="p-0 bg-white shadow-2xl rounded-[3rem] border-none overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-500">
                                   <div className="bg-primary/5 p-8 border-b flex justify-between items-center">
                                      <div className="flex items-center gap-6">
                                         <Button variant="ghost" size="icon" onClick={() => setAssistantStep('welcome')} className="rounded-full h-12 w-12 text-primary">
                                            <ArrowLeft className="h-6 w-6" />
                                         </Button>
                                         <div>
                                            <h3 className="font-black text-2xl uppercase text-primary tracking-tighter">Captura de Información Institucional</h3>
                                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Paso 2 de 3: Registro de Contenidos</p>
                                         </div>
                                      </div>
                                      <div className="flex gap-4">
                                         <Button variant="outline" onClick={() => setAssistantStep('preview')} className="rounded-xl h-12 px-8 font-black uppercase text-[10px] gap-3">
                                            <Eye className="h-4 w-4" /> Vista Previa
                                         </Button>
                                         <Button onClick={handleSaveWebProgress} className="rounded-xl h-12 px-8 font-black uppercase text-[10px] gap-3 bg-primary text-white shadow-lg shadow-primary/20">
                                            <Save className="h-4 w-4" /> Guardar Avance
                                         </Button>
                                      </div>
                                   </div>

                                   <ScrollArea className="h-[70vh]">
                                      <div className="p-12 max-w-5xl mx-auto space-y-12">
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                               <Label className="text-[11px] font-black uppercase text-primary flex items-center gap-2"><BookOpen className="h-4 w-4" /> Breve presentación de la escuela</Label>
                                               <Textarea 
                                                  className="min-h-[150px] rounded-2xl bg-slate-50 focus:bg-white border-slate-100 transition-all font-medium text-sm" 
                                                  placeholder="Escriba aquí la introducción de su escuela..."
                                                  value={webSchoolData.presentacion || ''}
                                                  onChange={e => setWebSchoolData({...webSchoolData, presentacion: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-4">
                                               <Label className="text-[11px] font-black uppercase text-primary flex items-center gap-2"><Camera className="h-4 w-4" /> Fotografía Digital Representativa</Label>
                                               <div className="h-[150px] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 relative group cursor-pointer" onClick={() => webFotoRef.current?.click()}>
                                                  {webSchoolData.foto ? (
                                                     <Image src={webSchoolData.foto} alt="Foto Escuela" fill className="object-cover rounded-2xl" />
                                                  ) : (
                                                     <>
                                                        <ImageIcon className="h-10 w-10 text-slate-300 mb-2" />
                                                        <span className="text-[9px] font-black text-slate-400 uppercase">Haga clic para cargar (300x200)</span>
                                                     </>
                                                  )}
                                                  <input type="file" ref={webFotoRef} hidden accept="image/*" onChange={handleWebFotoChange} />
                                               </div>
                                            </div>
                                         </div>

                                         <div className="space-y-4">
                                            <Label className="text-[11px] font-black uppercase text-primary flex items-center gap-2"><History className="h-4 w-4" /> Breve reseña histórica de la escuela</Label>
                                            <Textarea 
                                               className="min-h-[150px] rounded-2xl bg-slate-50 focus:bg-white border-slate-100 transition-all font-medium text-sm" 
                                               placeholder="Hitos importantes desde la fundación..."
                                               value={webSchoolData.resenaHistorica || ''}
                                               onChange={e => setWebSchoolData({...webSchoolData, resenaHistorica: e.target.value})}
                                             />
                                         </div>

                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                               <Label className="text-[11px] font-black uppercase text-primary flex items-center gap-2"><Target className="h-4 w-4" /> Enunciado de Misión</Label>
                                               <Textarea 
                                                  className="min-h-[100px] rounded-2xl bg-slate-50 focus:bg-white border-slate-100 font-medium text-sm" 
                                                  placeholder="Propósito educativo central..."
                                                  value={webSchoolData.mision || ''}
                                                  onChange={e => setWebSchoolData({...webSchoolData, mision: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-4">
                                               <Label className="text-[11px] font-black uppercase text-primary flex items-center gap-2"><Globe className="h-4 w-4" /> Enunciado de Visión</Label>
                                               <Textarea 
                                                  className="min-h-[100px] rounded-2xl bg-slate-50 focus:bg-white border-slate-100 font-medium text-sm" 
                                                  placeholder="Aspiraciones a largo plazo..."
                                                  value={webSchoolData.vision || ''}
                                                  onChange={e => setWebSchoolData({...webSchoolData, vision: e.target.value})}
                                                />
                                            </div>
                                         </div>

                                         <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                            <div className="space-y-4">
                                               <Label className="text-[11px] font-black uppercase text-primary flex items-center gap-2"><Building className="h-4 w-4" /> Infraestructura</Label>
                                               <Textarea 
                                                  className="min-h-[120px] rounded-2xl bg-slate-50 border-slate-100 text-xs" 
                                                  placeholder="Aulas, laboratorios, talleres..."
                                                  value={webSchoolData.infraestructura || ''}
                                                  onChange={e => setWebSchoolData({...webSchoolData, infraestructura: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-4">
                                               <Label className="text-[11px] font-black uppercase text-primary flex items-center gap-2"><Trophy className="h-4 w-4" /> Logros</Label>
                                               <Textarea 
                                                  className="min-h-[120px] rounded-2xl bg-slate-50 border-slate-100 text-xs" 
                                                  placeholder="Académicos, culturales, deportivos..."
                                                  value={webSchoolData.logros || ''}
                                                  onChange={e => setWebSchoolData({...webSchoolData, logros: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-4">
                                               <Label className="text-[11px] font-black uppercase text-primary flex items-center gap-2"><Users className="h-4 w-4" /> Alumnos Distinguidos</Label>
                                               <Textarea 
                                                  className="min-h-[120px] rounded-2xl bg-slate-50 border-slate-100 text-xs" 
                                                  placeholder="Relación de méritos..."
                                                  value={webSchoolData.alumnosDistinguidos || ''}
                                                  onChange={e => setWebSchoolData({...webSchoolData, alumnosDistinguidos: e.target.value})}
                                                />
                                            </div>
                                         </div>

                                         <div className="pb-12 flex justify-center">
                                            <Button onClick={() => setAssistantStep('preview')} size="lg" className="h-16 px-16 rounded-2xl font-black uppercase tracking-[0.2em] bg-primary text-white shadow-xl transition-all hover:scale-105">
                                               Siguiente: Vista Previa <ArrowRight className="h-5 w-5 ml-4" />
                                            </Button>
                                         </div>
                                      </div>
                                   </ScrollArea>
                                </Card>
                             )}

                             {assistantStep === 'preview' && (
                                <Card className="p-0 bg-white shadow-2xl rounded-[3rem] border-none overflow-hidden animate-in zoom-in-95 duration-700">
                                   <div className="bg-slate-900 p-6 border-b flex justify-between items-center">
                                      <div className="flex items-center gap-6">
                                         <Button variant="ghost" size="icon" onClick={() => setAssistantStep('capture')} className="rounded-full h-12 w-12 text-white hover:bg-white/10">
                                            <ArrowLeft className="h-6 w-6" />
                                         </Button>
                                         <div>
                                            <h3 className="font-black text-xl uppercase text-white tracking-tighter">Simulador de Portal Escolar Web</h3>
                                            <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Así verán su página los padres de familia y la comunidad</p>
                                         </div>
                                      </div>
                                      {isAdminEditorial && (
                                        <Button onClick={() => toast({ title: "Portal Publicado", description: "La página web ha sido generada exitosamente." })} className="rounded-xl h-12 px-10 font-black uppercase text-[10px] gap-3 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-900/20">
                                           <Globe className="h-4 w-4" /> Publicar Página Web Oficial
                                        </Button>
                                      )}
                                   </div>

                                   <ScrollArea className="h-[75vh] bg-slate-100 p-10">
                                      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-t-3xl overflow-hidden min-h-[1000px] border">
                                         <div className="bg-slate-200 p-4 border-b flex items-center gap-3">
                                            <div className="flex gap-1.5">
                                               <div className="h-3 w-3 rounded-full bg-rose-400" />
                                               <div className="h-3 w-3 rounded-full bg-amber-400" />
                                               <div className="h-3 w-3 rounded-full bg-emerald-400" />
                                            </div>
                                            <div className="bg-white rounded-lg px-4 py-1.5 flex-1 text-[10px] font-bold text-slate-400">
                                               www.seiem.gob.mx/escuelas/{incCct}
                                            </div>
                                         </div>

                                         <header className="bg-primary p-8 text-white">
                                            <div className="flex justify-between items-center mb-8">
                                               <span className="text-2xl font-black tracking-tighter">SEIEM</span>
                                               <nav className="flex gap-6 text-[10px] font-black uppercase tracking-widest opacity-80">
                                                  <span>Inicio</span>
                                                  <span>Nosotros</span>
                                                  <span>Logros</span>
                                                  <span>Contacto</span>
                                               </nav>
                                            </div>
                                            <div className="space-y-3">
                                               <h1 className="text-4xl font-black uppercase tracking-tighter">{(schoolsDirectory.find(s => s.cct === incCct))?.nombre || 'Centro de Trabajo'}</h1>
                                               <Badge className="bg-accent text-white border-none uppercase font-black text-[10px] px-4 py-1">CCT: {incCct}</Badge>
                                            </div>
                                         </header>

                                         <div className="p-12 space-y-12">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                                               <div className="relative aspect-[3/2] bg-slate-100 rounded-2xl overflow-hidden shadow-xl">
                                                  {webSchoolData.foto ? (
                                                     <Image src={webSchoolData.foto} alt="Hero" fill className="object-cover" />
                                                  ) : (
                                                     <div className="flex items-center justify-center h-full"><ImageIcon className="h-16 w-16 text-slate-300" /></div>
                                                  )}
                                               </div>
                                               <div className="space-y-6">
                                                  <h2 className="text-2xl font-black uppercase text-primary border-l-4 border-l-accent pl-6">Bienvenida</h2>
                                                  <p className="text-slate-600 leading-relaxed font-medium text-sm">
                                                     {webSchoolData.presentacion || 'Información de bienvenida no disponible.'}
                                                  </p>
                                               </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                               <Card className="p-8 space-y-4 border-none shadow-lg bg-slate-50">
                                                  <h3 className="font-black uppercase text-sm text-primary flex items-center gap-2"><History className="h-5 w-5 text-accent" /> Nuestra Historia</h3>
                                                  <p className="text-xs text-slate-500 leading-relaxed font-bold">{webSchoolData.resenaHistorica || 'Reseña en actualización...'}</p>
                                               </Card>
                                               <Card className="p-8 space-y-4 border-none shadow-lg bg-primary/5">
                                                  <h3 className="font-black uppercase text-sm text-primary flex items-center gap-2"><Target className="h-5 w-5 text-accent" /> Misión y Visión</h3>
                                                  <div className="space-y-4">
                                                     <div>
                                                        <span className="text-[9px] font-black uppercase text-accent tracking-widest">Misión:</span>
                                                        <p className="text-xs text-slate-600 font-bold">{webSchoolData.mision || 'Definiendo misión...'}</p>
                                                     </div>
                                                     <div>
                                                        <span className="text-[9px] font-black uppercase text-accent tracking-widest">Visión:</span>
                                                        <p className="text-xs text-slate-600 font-bold">{webSchoolData.vision || 'Definiendo visión...'}</p>
                                                     </div>
                                                  </div>
                                               </Card>
                                            </div>
                                            <footer className="border-t pt-10 pb-20 text-center space-y-4">
                                               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">© 2024 SEIEM - Portal de Gestión Escolar</p>
                                            </footer>
                                         </div>
                                      </div>
                                   </ScrollArea>
                                </Card>
                             )}
                          </div>
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
                                      <input 
                                         className="flex h-16 w-full rounded-2xl font-black text-lg text-center uppercase tracking-[0.2em] bg-slate-50 shadow-inner border border-input px-3 py-2" 
                                         placeholder="15DES0000X" 
                                         maxLength={10}
                                         value={incCct || ''}
                                         onChange={(e) => setIncCct(e.target.value.toUpperCase())}
                                       />
                                      <Button onClick={() => handleGeneratePass()} className="h-16 px-10 rounded-2xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-xl">
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
                             <Badge className="bg-primary/5 text-primary border-none text-[10px] font-black uppercase px-6 py-2 rounded-xl shadow-inner">Consolidado Oficial 2024</Badge>
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
                                      <SelectContent className="font-black"><SelectItem value="all">TODAS</SelectItem><SelectItem value="DES">GENERAL</SelectItem><SelectItem value="DST">TÉCNICA</SelectItem><SelectItem value="DTV">TELESECUNDARIAS</SelectItem></SelectContent>
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
                        <input 
                          placeholder="BUSCAR CCT O ESCUELA..." 
                          className="flex h-12 w-64 rounded-xl font-black text-[10px] uppercase pl-10 border border-slate-200 bg-white px-3 py-2"
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
                          <div className="flex flex-wrap items-center gap-8 pt-3">
                              <div className="flex items-center gap-2.5 text-[11px] font-black uppercase text-slate-400">
                                  <Calendar className="h-4 w-4 text-primary" /> Act: {currentStats?.lastUpdate ?? ''}
                              </div>
                              <div className="flex items-center gap-2.5 text-[11px] font-black uppercase text-slate-400">
                                  <School className="h-4 w-4 text-primary" /> Planteles: <span className="text-primary">{currentStats?.count}</span>
                              </div>
                          </div>
                       </div>
                    </div>
                    <div className="text-right bg-slate-50 p-8 rounded-[2rem] border-2 border-white shadow-inner min-w-[220px]">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Avance Global</p>
                      <p className="text-6xl font-black text-primary leading-none tracking-tighter">{currentStats?.progress}<span className="text-2xl text-accent ml-1">%</span></p>
                    </div>
                 </div>

                 {isLibraryTab && (
                   <div className="mt-12 space-y-8">
                      <div className="flex items-center justify-between border-b-2 border-slate-50 pb-6">
                         <h4 className="text-[12px] font-black uppercase text-slate-500 flex items-center gap-3 tracking-[0.2em]">
                            <History className="h-5 w-5" /> Detalle Operativo por Modalidad
                         </h4>
                         <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} size="sm" className="h-10 px-6 rounded-xl font-black uppercase text-[10px] gap-2 shadow-md">
                            <PlusCircle className="h-4 w-4" /> Nueva Ficha
                         </Button>
                      </div>
                      <div className="rounded-3xl border border-slate-100 bg-slate-50/50 overflow-x-auto shadow-sm">
                         <Table className="min-w-[1000px]">
                            <TableHeader className="bg-white/80">
                               <TableRow className="border-none">
                                  <TableHead className="text-[10px] font-black uppercase py-6 pl-10">Folio / Oficio</TableHead>
                                  <TableHead className="text-[10px] font-black uppercase">Centro de Trabajo (CCT)</TableHead>
                                  <TableHead className="text-[10px] font-black uppercase text-center">ZE/SEC</TableHead>
                                  <TableHead className="text-[10px] font-black uppercase text-center">Estatus</TableHead>
                                  <TableHead className="text-[10px] font-black uppercase text-right pr-10">Acción</TableHead>
                               </TableRow>
                            </TableHeader>
                            <TableBody>
                               {currentStats?.records.map((rec, idx) => (
                                 <TableRow key={idx} className="hover:bg-white transition-all border-slate-100 group">
                                    <TableCell className="py-6 pl-10">
                                       <span className="text-xs font-black text-primary">{rec.id}</span>
                                    </TableCell>
                                    <TableCell>
                                       <span className="text-xs font-black text-slate-700">{rec.cct}</span>
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
                                    <TableCell className="text-right pr-10">
                                       <div className="flex justify-end gap-2">
                                          <button className="h-10 w-10 bg-white shadow-sm border border-slate-100 text-primary hover:bg-primary hover:text-white rounded-xl transition-all flex items-center justify-center" onClick={() => { setFormData(rec); setEditingId(rec.id); setIsDialogOpen(true); }}>
                                             <Pencil className="h-4 w-4" />
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
              </Card>
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
          </DialogHeader>
          <ScrollArea className="flex-1 px-10">
            <div className="grid gap-12 py-12 pb-20">
              <div className="space-y-3">
                  <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2">Folio de Registro (Oficial)</Label>
                  <input value={formData.id || ''} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} placeholder="P-001" className="flex h-16 w-full rounded-[1.5rem] font-black text-lg border-primary/10 bg-slate-50/50 shadow-inner px-8 border" disabled={!!editingId} />
              </div>
              {formData.cct && (
                  <div className="p-6 bg-white rounded-3xl border border-primary/5 shadow-sm">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Centro de Trabajo</p>
                    <p className="text-lg font-black text-slate-800 uppercase">{formData.schoolName} ({formData.cct})</p>
                  </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Estatus Ejecutivo</Label>
                  <Select value={formData.status || 'planeacion'} onValueChange={v => setFormData({...formData, status: v as any})}>
                    <SelectTrigger className="h-16 rounded-[1.5rem] font-black shadow-lg bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="font-black rounded-2xl">
                      <SelectItem value="planeacion" className="text-rose-600">PLANEACIÓN</SelectItem>
                      <SelectItem value="activo" className="text-amber-600">ACTIVO</SelectItem>
                      <SelectItem value="concluido" className="text-emerald-600">CONCLUIDO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-10 bg-slate-50/80 backdrop-blur-md border-t flex justify-end gap-6">
             <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="h-16 px-12 rounded-2xl font-black uppercase text-[11px] tracking-widest border-slate-300 bg-white">Cancelar</Button>
             <Button onClick={handleSave} className="h-16 px-16 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] bg-primary hover:bg-primary/90 text-white shadow-xl transition-all hover:scale-105 active:scale-95">Sincronizar Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditorialAuthOpen} onOpenChange={setIsEditorialAuthOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white/95 backdrop-blur-2xl">
          <div className="bg-amber-600 p-8 text-white text-center space-y-4">
             <div className="mx-auto h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <ShieldCheck className="h-10 w-10 text-white" />
             </div>
             <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Acceso Editorial</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Módulo de Revisión y Publicación</p>
             </div>
          </div>
          <div className="p-10 space-y-6">
             <div className="space-y-4">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 pl-2">Usuario</Label>
                   <Input className="h-12 rounded-xl bg-slate-50 border-none font-black uppercase" value={editorialCredentials.user} onChange={e => setEditorialCredentials({...editorialCredentials, user: e.target.value.toUpperCase()})} placeholder="CEDITORIAL" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 pl-2">Contraseña</Label>
                   <Input type="password" className="h-12 rounded-xl bg-slate-50 border-none font-bold" value={editorialCredentials.pass} onChange={e => setEditorialCredentials({...editorialCredentials, pass: e.target.value})} placeholder="••••••••" />
                </div>
             </div>
             <Button onClick={handleEditorialLogin} className="w-full h-14 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-[0.1em] shadow-lg">Autenticar Acceso <ArrowRight className="h-5 w-5 ml-2" /></Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
         <DialogContent className="sm:max-w-[550px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-white/95 backdrop-blur-2xl">
            <div className="p-12 text-center space-y-8">
               <div className="mx-auto h-24 w-24 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                  <CheckCircle2 className="h-12 w-12 text-emerald-600" />
               </div>
               <div className="space-y-4">
                  <h3 className="text-2xl font-black uppercase text-primary tracking-tighter">Información Recibida</h3>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                     <p className="text-sm font-bold text-slate-600 leading-relaxed uppercase">Se procederá a su revisión por el grupo editorial. Si hay cambios, el grupo se contactará para su corrección. Si no, lo verá publicado en 3 días hábiles.</p>
                  </div>
               </div>
               <Button onClick={() => { setShowSuccessDialog(false); setShowWebAssistant(false); setAssistantStep('welcome'); setIncCct(''); setGeneratedPass(null); }} className="h-16 px-12 rounded-2xl font-black uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 text-white shadow-2xl transition-all hover:scale-105">Finalizar y Cerrar</Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  )
}
