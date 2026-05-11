
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
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts'
import { programsData, type ProgramStatus, type ProgramAssistant } from "@/lib/planning-data"
import { schoolsDirectory } from "@/lib/schools-directory"
import { 
  PlusCircle, 
  Search, 
  Pencil, 
  School, 
  ShieldCheck, 
  Zap,
  Calendar,
  MonitorCheck,
  Users,
  Trash2,
  Plus,
  Table as TableIcon,
  CheckCircle2,
  ClipboardCheck,
  Info,
  UserPlus,
  ArrowRight,
  Mail,
  ArrowLeft,
  ImageIcon,
  Circle,
  X,
  GraduationCap,
  Layout,
  BarChart3,
  MapPin
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

const MODALIDADES_GRID = [
  'COEES EDU', 'COEES GOB', 'DES GOB', 'DESYSA',
  'DESySA G...', 'DSN GOB', 'DST GOB', 'DTV GOB',
  'EM GOB', 'ET GOB', 'FIS', 'FIS GOB',
  'FISICA', 'FISICA GOB', 'FJE', 'FJE GOB',
  'FJT', 'FJT GOB', 'FTS', 'FTV',
  'FZF', 'FZF GOB', 'FZT', 'GM',
  'GM GOB', 'GT', 'GT GOB', 'PES'
];

const AREAS_PICKER = ['ADMIN', 'PLANTEL'];
const VALLES_PICKER = ['MEXICO', 'TOLUCA'];

const FUNCIONES = [
  "ADMINISTRATIVO",
  "DOCENTE",
  "DIRECTIVO",
  "JEFE DE ENSEÑANZA",
  "SUPERVISOR",
  "ASESOR TECNICO PEDAGOGICO"
]

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
  const [cuentasSubTab, setCuentasSubTab] = useState('dashboard')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Dashboard Filters
  const [modalidadSubFilter, setModalidadSubFilter] = useState('all')
  const [sectorSubFilter, setSectorSubFilter] = useState('all')
  const [areaSubFilter, setAreaSubFilter] = useState('all')
  const [valleSubFilter, setValleSubFilter] = useState('all')

  const [incCct, setIncCct] = useState('')
  const [generatedPass, setGeneratedPass] = useState<string | null>(null)
  const [showWebAssistant, setShowWebAssistant] = useState(false)
  const [assistantStep, setAssistantStep] = useState<'welcome' | 'capture' | 'preview'>('welcome')
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  
  const [isEditorialAuthOpen, setIsEditorialAuthOpen] = useState(false)
  const [editorialCredentials, setEditorialCredentials] = useState({ user: '', pass: '' })

  const [webSchoolData, setWebSchoolData] = useState<WebSchoolData>(initialWebData)
  const [savedSubmissions, setSavedSubmissions] = useState<{cct: string, name: string, date: string}[]>([])

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
    asistentes: [initialAssistant],
    cursoFolio: '',
    cursoGrupo: '',
    cursoNombre: '',
    duracionHoras: 0,
    fechaInicio: '',
    fechaTermino: '',
    instructores: ['', '', ''],
    cctSede: ''
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

  const handleSave = () => {
    if (!formData.id || (!formData.cct && !activeTab.startsWith('Cuentas'))) { 
      toast({ variant: "destructive", title: "Datos incompletos" }); 
      return; 
    }
    const updated = editingId ? records.map(r => r.id === editingId ? formData : r) : [formData, ...records];
    setRecords(updated)
    localStorage.setItem('programs_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    resetForm()
    toast({ title: "Registro guardado" })
  }

  const resetForm = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setFormData({ 
      ...initialFormState, 
      name: activeTab, 
      date: today, 
      fechaEntrada: today,
      fechaInicio: today,
      fechaTermino: today
    })
    setEditingId(null)
  }

  const updateAssistant = (index: number, field: keyof ProgramAssistant, value: string) => {
    const newAssistants = [...(formData.asistentes || [initialAssistant])]
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
    setFormData({ ...formData, asistentes: newAssistants })
  }

  const handleAddAssistant = () => {
    setFormData({ ...formData, asistentes: [...(formData.asistentes || []), initialAssistant] })
  }

  const handleRemoveAssistant = (index: number) => {
    const ast = [...(formData.asistentes || [])];
    if (ast.length === 1) return;
    setFormData({ ...formData, asistentes: ast.filter((_, i) => i !== index) })
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

  const activeTabClean = activeTab.includes('(') ? activeTab.split('(')[0].trim() : activeTab;
  const isLibraryTab = activeTabClean === 'Biblioteca Digital';
  const isCuentasTab = activeTabClean === 'Cuentas Institucionales';
  const isConoceTab = activeTabClean === 'Conoce mi Escuela';

  const filteredRecords = useMemo(() => {
    return records.filter(r => r.name === activeTab || (activeTabClean === 'Cuentas Institucionales' && (r.id.startsWith('PROG-CI') || r.name?.includes('Cuentas'))));
  }, [records, activeTab, activeTabClean]);

  // Dashboard calculations for Cuentas Institucionales
  const cuentasStats = useMemo(() => {
    const desysaCoeesData = [
      { name: 'En proceso', value: 33, fill: '#EAB308' },
      { name: 'No iniciado', value: 424, fill: '#EF4444' },
      { name: 'SIN PAGINA', value: 881, fill: '#3B82F6' },
      { name: 'Terminado', value: 370, fill: '#22C55E' },
    ];

    const conoceMiEscuelaChartData = [
      { name: 'No publicada', value: 378, fill: '#3B82F6' },
      { name: 'Publicada', value: 445, fill: '#6366F1' },
    ];

    const accountsData = [
      { name: 'En Uso', value: 72, fill: '#621132' },
      { name: 'Libre', value: 28, fill: '#cbd5e1' },
    ];

    return { desysaCoeesData, conoceMiEscuelaChartData, accountsData };
  }, []);

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
        <Button className="gap-2 font-black uppercase h-12 px-8 shadow-lg" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
           <PlusCircle className="h-5 w-5" /> Nuevo Registro {activeTabClean}
        </Button>
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
                            <strong>Conoce mi Escuela</strong> es un programa creado y administrado por el Departamento de Computación Electrónica en la Educación Secundaria (COEES). Se perfila como la única vía autorizada para que las escuelas cuenten con un espacio Web para proyectar su trabajo hacia la comunidad y autoridades educativas.
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
                                  <TableHead className="min-w-[100px] font-black text-[9px] uppercase border-r text-center text-emerald-600">Revisión</TableHead>
                                  <TableHead className="min-w-[300px] font-black text-[9px] uppercase border-r">Observaciones</TableHead>
                                  <TableHead className="min-w-[140px] font-black text-[9px] uppercase text-right pr-6 bg-slate-100 sticky right-0 z-10">Acciones a Realizar</TableHead>
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
                                      <TableCell className="text-center text-emerald-600 border-r font-black">{sub.date}</TableCell>
                                      <TableCell className="p-4 border-r max-w-[400px]">Auditoría 2025: Validación de contenido pendiente.</TableCell>
                                      <TableCell className="text-right pr-6 sticky right-0 z-10 bg-white/95 shadow-[-10px_0_15px_rgba(0,0,0,0.02)]">
                                         <div className="flex flex-col gap-1 items-end py-2">
                                            <button onClick={() => handleReviewSubmission(sub.cct)} className="text-[9px] font-black uppercase text-blue-600 hover:underline">Revisar</button>
                                            <button onClick={() => handleAction('publicar', sub.cct)} className="text-[9px] font-black uppercase text-emerald-600 hover:underline">Publicar</button>
                                            <button onClick={() => handleAction('suspender', sub.cct)} className="text-[9px] font-black uppercase text-rose-600 hover:underline">Suspender</button>
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
                                            Este Asistente de WebEscuela lo guiará a través del proceso de construcción de la Página Web de su Escuela. Todo el proceso le tomará entre 10 y 15 minutos.
                                         </p>
                                      </div>
                                      <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 text-left space-y-8">
                                         <h5 className="font-black uppercase text-xs text-primary">Tenga a la mano la siguiente información:</h5>
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {["Breve presentación de la escuela", "Fotografía digital (300x200)", "Reseña histórica", "Misión y Visión", "Infraestructura", "Logros Académicos/Deportivos", "Alumnos Distinguidos"].map(t => (
                                               <div key={t} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-50">
                                                  <div className="h-2 w-2 rounded-full bg-primary" />
                                                  <span className="text-[11px] font-bold text-slate-600">{t}</span>
                                               </div>
                                            ))}
                                         </div>
                                      </div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Se ha encontrado información previamente capturada.</p>
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
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-4"><Label className="text-[11px] font-black uppercase text-primary">Misión</Label><Textarea value={webSchoolData.mision} onChange={e => setWebSchoolData({...webSchoolData, mision: e.target.value})} /></div>
                                            <div className="space-y-4"><Label className="text-[11px] font-black uppercase text-primary">Visión</Label><Textarea value={webSchoolData.vision} onChange={e => setWebSchoolData({...webSchoolData, vision: e.target.value})} /></div>
                                         </div>
                                         <div className="space-y-4"><Label className="text-[11px] font-black uppercase text-primary">Infraestructura</Label><Textarea value={webSchoolData.infraestructura} onChange={e => setWebSchoolData({...webSchoolData, infraestructura: e.target.value})} /></div>
                                         <div className="space-y-4"><Label className="text-[11px] font-black uppercase text-primary">Logros</Label><Textarea value={webSchoolData.logros} onChange={e => setWebSchoolData({...webSchoolData, logros: e.target.value})} /></div>
                                         <div className="space-y-4"><Label className="text-[11px] font-black uppercase text-primary">Alumnos Distinguidos</Label><Textarea value={webSchoolData.alumnosDistinguidos} onChange={e => setWebSchoolData({...webSchoolData, alumnosDistinguidos: e.target.value})} /></div>
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
                                        <Button onClick={() => handleAction('publicar', incCct)} className="bg-emerald-600 text-white font-black px-10 rounded-xl">PUBLICAR PÁGINA WEB OFICIAL</Button>
                                      )}
                                   </div>
                                   <ScrollArea className="h-[75vh] bg-slate-100 p-10">
                                      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl p-12 min-h-[800px]">
                                         <header className="bg-primary p-8 rounded-2xl text-white mb-10 text-center">
                                            <h1 className="text-3xl font-black">{(schoolsDirectory.find(s => s.cct === incCct))?.nombre || 'Centro de Trabajo'}</h1>
                                            <p className="text-xs opacity-80 mt-2">CCT: {incCct}</p>
                                         </header>
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="relative aspect-video bg-slate-100 rounded-2xl overflow-hidden shadow-lg border-4 border-white">
                                               {webSchoolData.foto && <Image src={webSchoolData.foto} alt="Hero" fill className="object-cover" />}
                                            </div>
                                            <div className="space-y-6">
                                               <h2 className="text-2xl font-black text-primary border-b-2 border-primary/10 pb-2">Bienvenida</h2>
                                               <p className="text-sm text-slate-600 leading-relaxed italic">{webSchoolData.presentacion || 'Información de bienvenida pendiente...'}</p>
                                            </div>
                                         </div>
                                         <div className="mt-12 space-y-10">
                                            <section>
                                               <h3 className="text-xl font-black text-primary mb-4 uppercase tracking-tighter flex items-center gap-3"> Nuestra Historia</h3>
                                               <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">{webSchoolData.resenaHistorica}</p>
                                            </section>
                                            <div className="grid grid-cols-2 gap-10">
                                               <section className="bg-primary/5 p-6 rounded-2xl border border-primary/10"><h4 className="font-black text-primary uppercase text-xs mb-3">Misión</h4><p className="text-xs text-slate-600 leading-relaxed">{webSchoolData.mision}</p></section>
                                               <section className="bg-accent/5 p-6 rounded-2xl border border-accent/10"><h4 className="font-black text-accent uppercase text-xs mb-3">Visión</h4><p className="text-xs text-slate-600 leading-relaxed">{webSchoolData.vision}</p></section>
                                            </div>
                                            <section>
                                               <h3 className="text-xl font-black text-primary mb-4 uppercase tracking-tighter">Infraestructura y Logros</h3>
                                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                  <div className="space-y-3"><Label className="text-[10px] font-black uppercase text-slate-400">Instalaciones</Label><p className="text-xs font-medium">{webSchoolData.infraestructura}</p></div>
                                                  <div className="space-y-3"><Label className="text-[10px] font-black uppercase text-slate-400">Excelencia</Label><p className="text-xs font-medium">{webSchoolData.logros}</p></div>
                                               </div>
                                            </section>
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
           ) : isCuentasTab ? (
             <div className="space-y-10">
                <Tabs value={cuentasSubTab} onValueChange={setCuentasSubTab} className="space-y-8">
                   <div className="flex justify-between items-center">
                      <TabsList className="bg-slate-100 p-1 rounded-2xl h-12">
                        <TabsTrigger value="dashboard" className="rounded-xl px-6 font-black uppercase text-[10px] gap-2"><BarChart3 className="h-4 w-4" /> Dashboard de Monitoreo</TabsTrigger>
                        <TabsTrigger value="listado" className="rounded-xl px-6 font-black uppercase text-[10px] gap-2"><TableIcon className="h-4 w-4" /> Listado Detallado</TabsTrigger>
                      </TabsList>
                   </div>

                   <TabsContent value="dashboard" className="animate-in fade-in zoom-in-95 duration-700">
                      <div className="space-y-10">
                        {/* Header Monitor */}
                        <div className="flex items-center gap-6">
                           <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center shadow-xl">
                              <Zap className="h-8 w-8 text-white" />
                           </div>
                           <div>
                              <h2 className="text-3xl font-black text-primary uppercase tracking-tighter leading-none">Herramienta de Monitoreo</h2>
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-1">Control Analítico de Cuentas Institucionales</p>
                           </div>
                        </div>

                        {/* Top Filters and Stats */}
                        <div className="grid grid-cols-12 gap-8">
                           {/* Left Slicers */}
                           <div className="col-span-3 space-y-8">
                              <Card className="executive-card p-6 bg-slate-50/50 border-2 border-white">
                                 <Label className="text-[10px] font-black uppercase text-primary tracking-widest mb-4 block">MODALIDAD</Label>
                                 <div className="grid grid-cols-2 gap-2 h-[350px] overflow-y-auto pr-2 scrollbar-thin">
                                    {MODALIDADES_GRID.map(m => (
                                       <Button key={m} variant={modalidadSubFilter === m ? 'default' : 'outline'} className="h-10 text-[8px] font-black uppercase p-1 rounded-xl shadow-sm" onClick={() => setModalidadSubFilter(m)}>
                                          {m}
                                       </Button>
                                    ))}
                                 </div>
                              </Card>

                              <Card className="executive-card p-6 bg-slate-50/50 border-2 border-white">
                                 <Label className="text-[10px] font-black uppercase text-primary tracking-widest mb-4 block">Sector</Label>
                                 <div className="grid grid-cols-3 gap-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(s => (
                                       <Button key={s} variant={sectorSubFilter === s.toString() ? 'default' : 'outline'} className={cn("h-10 text-[10px] font-black rounded-xl", sectorSubFilter === s.toString() ? 'bg-emerald-600' : '')} onClick={() => setSectorSubFilter(s.toString())}>
                                          {s}
                                       </Button>
                                    ))}
                                 </div>
                              </Card>
                           </div>

                           {/* Center Gauges & KPI */}
                           <div className="col-span-4 space-y-8 flex flex-col items-center">
                              {/* Total Card */}
                              <Card className="w-full executive-card p-10 flex flex-col items-center justify-center relative bg-white shadow-2xl overflow-hidden">
                                 <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500" />
                                 <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Total de Cuentas @desysa.gob.mx</span>
                                 <div className="text-6xl font-black text-slate-800 tracking-tighter">1,709</div>
                              </Card>

                              {/* Donut Gauge */}
                              <div className="relative h-[250px] w-full flex flex-col items-center justify-center">
                                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">% CORREO EN USO @desysa.gob.mx</Label>
                                 <div className="relative">
                                    <ResponsiveContainer width={200} height={200}>
                                       <PieChart>
                                          <Pie data={cuentasStats.accountsData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                             {cuentasStats.accountsData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                          </Pie>
                                       </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                       <span className="text-3xl font-black text-primary">72%</span>
                                    </div>
                                 </div>
                              </div>

                              {/* Geoposition Battery */}
                              <div className="w-full flex flex-col items-center gap-4 mt-10">
                                 <Label className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Geoposición</Label>
                                 <div className="w-32 h-48 border-4 border-slate-300 rounded-[2rem] p-1.5 relative overflow-hidden bg-slate-100 shadow-inner">
                                    <div 
                                      className="absolute bottom-0 left-0 w-full bg-emerald-500 transition-all duration-1000 flex items-center justify-center shadow-[0_-10px_20px_rgba(16,185,129,0.3)]"
                                      style={{ height: '58%' }}
                                    >
                                       <span className="text-xl font-black text-white">58%</span>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           {/* Right Column Pickers & Charts */}
                           <div className="col-span-5 space-y-8">
                              <div className="grid grid-cols-2 gap-8">
                                 <Card className="executive-card p-6 bg-orange-50/50 border-2 border-white">
                                    <Label className="text-[10px] font-black uppercase text-orange-600 tracking-widest mb-4 block">AREA</Label>
                                    <div className="space-y-2">
                                       {AREAS_PICKER.map(a => (
                                          <div key={a} className={cn("p-3 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-all", areaSubFilter === a ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-orange-600 hover:bg-orange-100')} onClick={() => setAreaSubFilter(a)}>
                                             {a}
                                          </div>
                                       ))}
                                    </div>
                                 </Card>

                                 <Card className="executive-card p-6 bg-amber-50/50 border-2 border-white">
                                    <Label className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-4 block">VALLE</Label>
                                    <div className="space-y-2">
                                       {VALLES_PICKER.map(v => (
                                          <div key={v} className={cn("p-3 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-all", valleSubFilter === v ? 'bg-amber-600 text-white shadow-lg' : 'bg-white text-amber-600 hover:bg-amber-100')} onClick={() => setValleSubFilter(v)}>
                                             {v}
                                          </div>
                                       ))}
                                    </div>
                                 </Card>
                              </div>

                              <Card className="executive-card p-8 bg-white shadow-2xl relative overflow-hidden h-[350px]">
                                 <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <Layout className="h-24 w-24" />
                                 </div>
                                 <CardTitle className="text-sm font-black uppercase text-slate-700 mb-8">DESYSA - COEES</CardTitle>
                                 <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={cuentasStats.desysaCoeesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} />
                                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                                       <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                       <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40}>
                                          {cuentasStats.desysaCoeesData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                       </Bar>
                                    </BarChart>
                                 </ResponsiveContainer>
                                 <div className="flex justify-between mt-4">
                                    {cuentasStats.desysaCoeesData.map(d => (
                                       <div key={d.name} className="flex flex-col items-center">
                                          <span className="text-[10px] font-black text-slate-800">{d.value}</span>
                                       </div>
                                    ))}
                                 </div>
                              </Card>

                              <Card className="executive-card p-8 bg-white shadow-2xl relative h-[350px] flex flex-col items-center justify-center">
                                 <CardTitle className="text-sm font-black uppercase text-slate-700 mb-8 w-full">CONOCE MI ESCUELA - SEIEM</CardTitle>
                                 <div className="flex gap-20 items-end">
                                    {cuentasStats.conoceMiEscuelaChartData.map(d => (
                                       <div key={d.name} className="flex flex-col items-center group">
                                          <div className="relative">
                                             <div className="w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[180px] opacity-80 group-hover:opacity-100 transition-opacity" style={{ borderBottomColor: d.fill }}></div>
                                             <div className="absolute inset-0 flex items-center justify-center pt-20">
                                                <span className="text-2xl font-black text-white">{d.value}</span>
                                             </div>
                                          </div>
                                          <span className="text-[10px] font-black uppercase text-slate-500 mt-4">{d.name}</span>
                                       </div>
                                    ))}
                                 </div>
                              </Card>
                           </div>
                        </div>

                        {/* Audit Table Bottom */}
                        <Card className="executive-card overflow-hidden">
                           <CardHeader className="bg-slate-50 border-b p-6 flex flex-row items-center justify-between">
                              <CardTitle className="text-sm font-black uppercase text-primary flex items-center gap-3"><MapPin className="h-5 w-5" /> Auditoría de Geoposicionamiento</CardTitle>
                              <Badge className="bg-blue-600 text-white font-black text-[9px] uppercase px-4 py-1 rounded-full">Sincronizado SIP</Badge>
                           </CardHeader>
                           <Table>
                              <TableHeader className="bg-slate-100/50">
                                 <TableRow>
                                    <TableHead className="font-black text-[9px] uppercase pl-8">CCT / Escuela</TableHead>
                                    <TableHead className="font-black text-[9px] uppercase">LATITUD</TableHead>
                                    <TableHead className="font-black text-[9px] uppercase">LONGITUD</TableHead>
                                    <TableHead className="font-black text-[9px] uppercase text-right pr-8">Dominio Principal</TableHead>
                                 </TableRow>
                              </TableHeader>
                              <TableBody>
                                 {schoolsDirectory.slice(0, 10).map((school, i) => (
                                    <TableRow key={i} className="text-[10px] font-bold">
                                       <TableCell className="pl-8 text-primary font-black uppercase">{school.cct}</TableCell>
                                       <TableCell className="font-mono">{ (19.0 + Math.random()).toFixed(6) }</TableCell>
                                       <TableCell className="font-mono">{ (-99.0 - Math.random()).toFixed(6) }</TableCell>
                                       <TableCell className="text-right pr-8 text-blue-600">@desysa.gob.mx</TableCell>
                                    </TableRow>
                                 ))}
                              </TableBody>
                           </Table>
                        </Card>
                      </div>
                   </TabsContent>

                   <TabsContent value="listado" className="animate-in slide-in-from-right-10 duration-700">
                      <Card className="executive-card">
                        <CardHeader className="bg-slate-50/50 p-8 border-b">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-xl font-black uppercase text-primary">{activeTabClean}</CardTitle>
                              <CardDescription className="text-[10px] font-black uppercase tracking-widest">Control y Seguimiento de Implementación</CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="text-right">
                                  <span className="text-[9px] font-black text-slate-400 uppercase">Impacto Global</span>
                                  <div className="text-lg font-black text-primary">{filteredRecords.length} Escuelas</div>
                               </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader className="bg-slate-100/50">
                              <TableRow>
                                <TableHead className="font-black text-[10px] uppercase pl-8">CCT / Escuela</TableHead>
                                <TableHead className="font-black text-[10px] uppercase">Responsable / eContacto</TableHead>
                                <TableHead className="font-black text-[10px] uppercase">Dominio</TableHead>
                                <TableHead className="font-black text-[10px] uppercase text-center">Estatus</TableHead>
                                <TableHead className="font-black text-[10px] uppercase text-right pr-8">Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredRecords.length > 0 ? filteredRecords.map((rec) => (
                                <TableRow key={rec.id} className="hover:bg-slate-50 transition-colors">
                                  <TableCell className="pl-8">
                                     <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-700">{rec.cct}</span>
                                        <span className="text-[10px] text-muted-foreground font-bold">{rec.schoolName}</span>
                                     </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                       <span className="text-[10px] font-black text-slate-700">{rec.asistentes?.[0]?.nombres} {rec.asistentes?.[0]?.paterno}</span>
                                       <span className="text-[9px] text-blue-600 font-bold lowercase">{rec.asistentes?.[0]?.email}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                     <Badge variant="outline" className="text-[9px] font-black border-primary/20 text-primary">
                                        {rec.asistentes?.[0]?.email?.split('@')[1] || 'desysa.gob.mx'}
                                     </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                     <div className="flex items-center justify-center gap-2 bg-white px-4 py-1.5 rounded-2xl border shadow-sm w-fit mx-auto">
                                        <Circle className={cn("h-2.5 w-2.5 fill-current", rec.status === 'concluido' ? 'text-emerald-500' : rec.status === 'activo' ? 'text-amber-500' : 'text-rose-500')} />
                                        <span className="text-[9px] font-black uppercase text-slate-500">{rec.status}</span>
                                     </div>
                                  </TableCell>
                                  <TableCell className="text-right pr-8">
                                     <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => { setFormData(rec); setEditingId(rec.id); setIsDialogOpen(true); }}>
                                        <Pencil className="h-4 w-4" />
                                     </Button>
                                  </TableCell>
                                </TableRow>
                              )) : (
                                <TableRow>
                                  <TableCell colSpan={6} className="text-center py-20 bg-slate-50/50">
                                     <div className="flex flex-col items-center gap-2 opacity-30">
                                        <MonitorCheck className="h-10 w-10 text-primary" />
                                        <p className="font-black text-xs uppercase">Sin registros en este rubro para mostrar.</p>
                                     </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                   </TabsContent>
                </Tabs>
             </div>
           ) : (
             <Card className="executive-card">
               <CardHeader className="bg-slate-50/50 p-8 border-b">
                 <div className="flex items-center justify-between">
                   <div>
                     <CardTitle className="text-xl font-black uppercase text-primary">{activeTabClean}</CardTitle>
                     <CardDescription className="text-[10px] font-black uppercase tracking-widest">Control y Seguimiento de Implementación</CardDescription>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="text-right">
                         <span className="text-[9px] font-black text-slate-400 uppercase">Impacto Global</span>
                         <div className="text-lg font-black text-primary">{filteredRecords.length} Escuelas</div>
                      </div>
                   </div>
                 </div>
               </CardHeader>
               <CardContent className="p-0">
                 <Table>
                   <TableHeader className="bg-slate-100/50">
                     <TableRow>
                       <TableHead className="font-black text-[10px] uppercase pl-8">CCT / Escuela</TableHead>
                       {isLibraryTab && (
                         <>
                           <TableHead className="font-black text-[10px] uppercase text-center">Equipos</TableHead>
                           <TableHead className="font-black text-[10px] uppercase">Descripción Técnica</TableHead>
                           <TableHead className="font-black text-[10px] uppercase text-center">Capacitación</TableHead>
                         </>
                       )}
                       <TableHead className="font-black text-[10px] uppercase text-center">Estatus</TableHead>
                       <TableHead className="font-black text-[10px] uppercase text-right pr-8">Acciones</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {filteredRecords.length > 0 ? filteredRecords.map((rec) => (
                       <TableRow key={rec.id} className="hover:bg-slate-50 transition-colors">
                         <TableCell className="pl-8">
                            <div className="flex flex-col">
                               <span className="text-xs font-black text-slate-700">{rec.cct}</span>
                               <span className="text-[10px] text-muted-foreground font-bold">{rec.schoolName}</span>
                            </div>
                         </TableCell>
                         {isLibraryTab && (
                           <>
                             <TableCell className="text-center font-black text-primary">{rec.numeroEquipos || 0}</TableCell>
                             <TableCell className="text-[10px] font-bold text-slate-500 max-w-[200px] truncate">{rec.descripcionEquipo || 'Sin descripción'}</TableCell>
                             <TableCell className="text-center">
                                <Badge variant={rec.capacitacion === 'S' ? 'default' : 'outline'} className="text-[9px] font-black px-4">
                                   {rec.capacitacion === 'S' ? 'SÍ' : 'NO'}
                                </Badge>
                             </TableCell>
                           </>
                         )}
                         <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2 bg-white px-4 py-1.5 rounded-2xl border shadow-sm w-fit mx-auto">
                               <Circle className={cn("h-2.5 w-2.5 fill-current", rec.status === 'concluido' ? 'text-emerald-500' : rec.status === 'activo' ? 'text-amber-500' : 'text-rose-500')} />
                               <span className="text-[9px] font-black uppercase text-slate-500">{rec.status}</span>
                            </div>
                         </TableCell>
                         <TableCell className="text-right pr-8">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => { setFormData(rec); setEditingId(rec.id); setIsDialogOpen(true); }}>
                               <Pencil className="h-4 w-4" />
                            </Button>
                         </TableCell>
                       </TableRow>
                     )) : (
                       <TableRow>
                         <TableCell colSpan={6} className="text-center py-20 bg-slate-50/50">
                            <div className="flex flex-col items-center gap-2 opacity-30">
                               <MonitorCheck className="h-10 w-10 text-primary" />
                               <p className="font-black text-xs uppercase">Sin registros en este rubro para mostrar.</p>
                            </div>
                         </TableCell>
                       </TableRow>
                     )}
                   </TableBody>
                 </Table>
               </CardContent>
             </Card>
           )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent className="sm:max-w-[1200px] h-[90vh] rounded-[2.5rem] p-0 overflow-hidden flex flex-col">
            <DialogHeader className="p-8 bg-slate-50 border-b">
               <DialogTitle className="uppercase font-black text-primary">Captura Técnica - {activeTabClean}</DialogTitle>
               <DialogDescription className="text-xs font-bold">Complete la información del programa para el centro de trabajo.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 p-8">
               <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Folio Registro</Label><Input className="font-bold border-primary/20" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} /></div>
                     <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Estatus General</Label>
                        <Select value={formData.status} onValueChange={(val:any) => setFormData({...formData, status: val})}>
                           <SelectTrigger className="border-primary/20"><SelectValue /></SelectTrigger>
                           <SelectContent>
                              <SelectItem value="planeacion">PLANEACIÓN</SelectItem>
                              <SelectItem value="activo">ACTIVO</SelectItem>
                              <SelectItem value="concluido">CONCLUIDO</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-primary">CCT Centro de Trabajo</Label>
                        <Input className="font-mono uppercase border-primary/20" value={formData.cct} onChange={e => {
                           const val = e.target.value.toUpperCase();
                           const school = schoolsDirectory.find(s => s.cct === val);
                           if (school) {
                              setFormData({...formData, cct: val, schoolName: school.nombre, municipio: school.municipio, region: school.region, valle: school.valle});
                           } else {
                              setFormData({...formData, cct: val});
                           }
                        }} />
                     </div>
                  </div>

                  {isLibraryTab && (
                    <div className="space-y-8 animate-in fade-in">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">No. Equipos</Label><Input type="number" className="border-primary/20" value={formData.numeroEquipos} onChange={e => setFormData({...formData, numeroEquipos: parseInt(e.target.value) || 0})} /></div>
                          <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Descripción Técnica</Label><Input className="border-primary/20" value={formData.descripcionEquipo} onChange={e => setFormData({...formData, descripcionEquipo: e.target.value})} /></div>
                       </div>
                       
                       <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-primary/5 space-y-6">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <GraduationCap className="h-6 w-6 text-primary" />
                                <Label className="text-sm font-black uppercase text-primary">¿Se requiere registro de Capacitación?</Label>
                             </div>
                             <div className="flex items-center gap-3">
                                <span className={cn("text-[10px] font-black uppercase", formData.capacitacion === 'N' ? 'text-primary' : 'text-slate-300')}>NO</span>
                                <Switch checked={formData.capacitacion === 'S'} onCheckedChange={(val) => setFormData({...formData, capacitacion: val ? 'S' : 'N'})} />
                                <span className={cn("text-[10px] font-black uppercase", formData.capacitacion === 'S' ? 'text-primary' : 'text-slate-300')}>SÍ</span>
                             </div>
                          </div>

                          {formData.capacitacion === 'S' && (
                             <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                                <Separator />
                                <div className="space-y-4">
                                   <h3 className="text-xs font-black uppercase text-primary flex items-center gap-2"><Zap className="h-4 w-4" /> Gestión de Curso y Asistentes</h3>
                                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                      <div className="space-y-2"><Label className="text-[9px] font-black uppercase">Folio Curso</Label><Input className="h-9 text-xs" value={formData.cursoFolio} onChange={e => setFormData({...formData, cursoFolio: e.target.value.toUpperCase()})} /></div>
                                      <div className="space-y-2"><Label className="text-[9px] font-black uppercase">Grupo</Label><Input className="h-9 text-xs" value={formData.cursoGrupo} onChange={e => setFormData({...formData, cursoGrupo: e.target.value})} /></div>
                                      <div className="md:col-span-2 space-y-2"><Label className="text-[9px] font-black uppercase">Nombre del Curso</Label><Input className="h-9 text-xs" value={formData.cursoNombre} onChange={e => setFormData({...formData, cursoNombre: e.target.value})} /></div>
                                   </div>
                                   <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                      <div className="space-y-2"><Label className="text-[9px] font-black uppercase">Fecha Inicio</Label><Input type="date" className="h-9 text-xs" value={formData.fechaInicio} onChange={e => setFormData({...formData, fechaInicio: e.target.value})} /></div>
                                      <div className="space-y-2"><Label className="text-[9px] font-black uppercase">Fecha Término</Label><Input type="date" className="h-9 text-xs" value={formData.fechaTermino} onChange={e => setFormData({...formData, fechaTermino: e.target.value})} /></div>
                                      <div className="space-y-2"><Label className="text-[9px] font-black uppercase">Horas</Label><Input type="number" className="h-9 text-xs" value={formData.duracionHoras} onChange={e => setFormData({...formData, duracionHoras: parseInt(e.target.value) || 0})} /></div>
                                   </div>
                                </div>

                                <div className="space-y-4">
                                   <div className="flex justify-between items-center">
                                      <h4 className="text-[10px] font-black uppercase text-primary">Lista de Asistentes al Curso</h4>
                                      <Button variant="outline" size="sm" onClick={handleAddAssistant} className="h-8 gap-2 font-black uppercase text-[9px]"><Plus className="h-3 w-3" /> Añadir Asistente</Button>
                                   </div>
                                   <div className="border rounded-2xl bg-white overflow-hidden">
                                      <ScrollArea className="max-h-[300px]">
                                         <Table>
                                            <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                               <TableRow>
                                                  <TableHead className="w-10 text-[9px] font-black">#</TableHead>
                                                  <TableHead className="min-w-[150px] text-[9px] font-black">PATERNO</TableHead>
                                                  <TableHead className="min-w-[150px] text-[9px] font-black">MATERNO</TableHead>
                                                  <TableHead className="min-w-[150px] text-[9px] font-black">NOMBRE(S)</TableHead>
                                                  <TableHead className="min-w-[150px] text-[9px] font-black">RFC</TableHead>
                                                  <TableHead className="min-w-[120px] text-[9px] font-black">CCT ORIGEN</TableHead>
                                                  <TableHead className="min-w-[180px] text-[9px] font-black">FUNCIÓN</TableHead>
                                                  <TableHead className="w-10"></TableHead>
                                               </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                               {(formData.asistentes || []).map((ast, idx) => (
                                                  <TableRow key={idx}>
                                                     <TableCell className="text-center font-bold text-xs">{idx + 1}</TableCell>
                                                     <TableCell className="p-2"><Input className="h-8 text-[10px]" value={ast.paterno} onChange={e => updateAssistant(idx, 'paterno', e.target.value)} /></TableCell>
                                                     <TableCell className="p-2"><Input className="h-8 text-[10px]" value={ast.materno} onChange={e => updateAssistant(idx, 'materno', e.target.value)} /></TableCell>
                                                     <TableCell className="p-2"><Input className="h-8 text-[10px] font-bold" value={ast.nombres} onChange={e => updateAssistant(idx, 'nombres', e.target.value)} /></TableCell>
                                                     <TableCell className="p-2"><Input className="h-8 text-[10px] font-mono uppercase" value={ast.rfc} onChange={e => updateAssistant(idx, 'rfc', e.target.value.toUpperCase())} /></TableCell>
                                                     <TableCell className="p-2"><Input className="h-8 text-[10px] font-mono uppercase" value={ast.cct} onChange={e => updateAssistant(idx, 'cct', e.target.value.toUpperCase())} /></TableCell>
                                                     <TableCell className="p-2">
                                                        <Select value={ast.funcion} onValueChange={(val: any) => updateAssistant(idx, 'funcion', val)}>
                                                           <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                                                           <SelectContent>
                                                              {FUNCIONES.map(f => <SelectItem key={f} value={f} className="text-[10px]">{f}</SelectItem>)}
                                                           </SelectContent>
                                                        </Select>
                                                     </TableCell>
                                                     <TableCell className="p-2">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveAssistant(idx)} disabled={(formData.asistentes || []).length === 1}>
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
                                </div>
                             </div>
                          )}
                       </div>
                    </div>
                  )}

                  {isCuentasTab && (
                     <div className="space-y-4 p-8 bg-blue-50/50 rounded-[2rem] border border-blue-100">
                        <Label className="text-xs font-black uppercase text-blue-700 flex items-center gap-2"><Mail className="h-4 w-4" /> Datos del Responsable de eContacto</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <Input placeholder="Nombre Completo" className="bg-white" value={formData.asistentes?.[0]?.nombres} onChange={e => {
                              const ast = [...(formData.asistentes || [initialAssistant])];
                              ast[0] = {...ast[0], nombres: e.target.value};
                              setFormData({...formData, asistentes: ast});
                           }} />
                           <Input placeholder="Correo Institucional" className="bg-white" value={formData.asistentes?.[0]?.email} onChange={e => {
                              const ast = [...(formData.asistentes || [initialAssistant])];
                              ast[0] = {...ast[0], email: e.target.value};
                              setFormData({...formData, asistentes: ast});
                           }} />
                        </div>
                     </div>
                  )}

                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Observaciones Técnicas Generales</Label><Textarea className="min-h-[120px] rounded-2xl border-primary/20" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} /></div>
               </div>
            </ScrollArea>
            <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-6">
               <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-12 px-10 rounded-2xl font-bold uppercase text-[10px]">Cancelar</Button>
               <Button onClick={handleSave} className="h-12 px-12 rounded-2xl font-black uppercase text-[10px] bg-primary text-white shadow-xl shadow-primary/20">Guardar Información del Programa</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

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
