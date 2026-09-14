
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
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { schoolsDirectory, type SchoolInfo } from "@/lib/schools-directory"
import { cn } from "@/lib/utils"
import Image from 'next/image'
import { 
  PlusCircle, 
  Pencil, 
  Search,
  School,
  CheckCircle2,
  Plus,
  Save,
  Trash2,
  ChevronRight,
  Mail,
  Loader2,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  MapPin,
  ClipboardCheck,
  X,
  Briefcase,
  User,
  RotateCcw,
  ClipboardList,
  Activity,
  Calendar,
  Monitor,
  Phone,
  FileText,
  Download,
  Users,
  Eraser,
  MinusCircle,
  Home,
  BarChart3,
  Settings,
  Bell,
  FileSpreadsheet,
  Camera,
  Layers,
  CheckCircle,
  Tag,
  Globe,
  MonitorCheck,
  Navigation,
  Info,
  Eye,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  LayoutGrid,
  Upload,
  ImageIcon,
  Archive,
  LocateFixed,
  Maximize2,
  Circle,
  Building2,
  MessageSquare,
  Layout,
  RefreshCcw,
  Map as MapIcon,
  Navigation2,
  Signal,
  SignalHigh,
  SignalLow,
  WifiOff,
  TrendingUp,
  PieChart as PieChartIcon,
  Printer,
  FileDown
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie
} from 'recharts'
import { useToast } from "@/hooks/use-toast"
import { HelpDeskInterface } from '@/components/HelpDeskInterface'
import { db } from '@/lib/firebase'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  where,
  getDocs,
  limit
} from 'firebase/firestore'
import { type ProgramStatus } from '@/lib/planning-data'
import { format, subDays } from 'date-fns'

const PROGRAM_RUBROS = [
  'Cuentas Institucionales',
  'Biblioteca Digital',
  'Geoposición',
  'Conoce mi Escuela',
  'ATRES'
];

const DOMINIOS = [
  '@coees.edu.mx',
  '@desysa.edu.mx',
  '@edomex.gob.mx'
];

const BIBLIOTECA_FASES_LABELS = [
  { id: 'fase1', label: 'Fase 1. Solicitud de instalación de biblioteca digital', color: 'text-blue-600 bg-blue-50 border-blue-100', progress: 11 },
  { id: 'fase2', label: 'Fase 2. Atención al CCT', color: 'text-indigo-600 bg-indigo-50 border-indigo-100', progress: 22 },
  { id: 'fase3', label: 'Fase 3. Diagnóstico del equipo de cómputo existente', color: 'text-blue-600 bg-blue-50 border-blue-100', progress: 33 },
  { id: 'fase4', label: 'Fase 4. Instalación total de los contenidos del proyecto', color: 'text-amber-600 bg-amber-50 border-amber-100', progress: 44 },
  { id: 'fase5', label: 'Fase 5. Funcionalidad (pruebas de uso y manejo)', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', progress: 56 },
  { id: 'fase5_guia', label: 'Fase 6. Guía orientación de uso y manejo de la herramienta', color: 'text-purple-600 bg-purple-50 border-purple-100', progress: 67 },
  { id: 'fase6', label: 'Fase 7. Envió vía correo al CCT el formulario de seguimiento', color: 'text-cyan-600 bg-cyan-50 border-cyan-100', progress: 78 },
  { id: 'fase7', label: 'Fase 8. Seguimiento técnico al CCT', color: 'text-orange-600 bg-orange-50 border-orange-100', progress: 89 },
  { id: 'fase8', label: 'Fase 9. Total de equipos habilitados', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', progress: 100 }
];

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [activeTab, setActiveTab] = useState(PROGRAM_RUBROS[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogSearchTerm, setDialogSearchTerm] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  
  // Cuentas
  const [verifyInput, setVerifyInput] = useState('')
  const [verifiedAccount, setVerifiedAccount] = useState<ProgramStatus | null>(null)
  const [userPart, setUserPart] = useState('')
  const [domainPart, setDomainPart] = useState(DOMINIOS[0])
  
  // Biblioteca Detail Selection
  const [selectedLibCct, setSelectedLibCct] = useState<string | null>(null)

  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([])
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddForm, setQuickAddForm] = useState<SchoolInfo>({
    region: '', valle: 'MEXICO', municipio: '', subsistema: 'FEDERALIZADO', control: 'OFICIAL',
    nivel: 'SECUNDARIA', servicioEducativo: 'SECUNDARIA GENERAL', cct: '', turno: 'MATUTINO',
    nombre: '', domicilio: '', localidad: '', telefono: '', zonaEscolar: '', sector: '',
    director: '', hombres: 0, mujeres: 0, alumnos: 0, grupos: 0, maestros: 0, administrativos: 0,
    aulasExistentes: 0, aulasEnUso: 0, modalidad: 'DES'
  })

  const [initialFormState] = useState<ProgramStatus>({
    name: '', progress: 0, status: 'activo', date: new Date().toISOString().split('T')[0], 
    cct: '', schoolName: '', userName: '', rfc: '', puesto: '', departamento: '',
    email: '', emails: [''], zonaEscolar: '', sector: '', modalidad: '', municipio: '', region: '', valle: '',
    latitud: '', longitud: '', observaciones: '', evidencePhotos: [], reportPdf: '',
    asistentes: [],
    bibliotecaFases: {
      fase1: false, fase2: false, fase3: false, fase4: false, fase5: false, fase5_guia: false, 
      fase6: false, fase7: false, fase8: false, fase9: false,
      personalCapacitado: 0, equiposHabilitados: 0
    }
  })

  const [formData, setFormData] = useState<ProgramStatus>(initialFormState)

  useEffect(() => {
    setMounted(true)
    setIsLoading(true)
    
    const q = query(collection(db, 'programs'), orderBy('updatedAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as ProgramStatus[]
      setRecords(fetched)
      setIsLoading(false)
      
      const libRecs = fetched.filter(r => r.name === 'Biblioteca Digital');
      if (libRecs.length > 0 && !selectedLibCct) {
        setSelectedLibCct(libRecs[0].cct);
      }
    }, (error) => {
      console.error("Firestore error:", error)
      setIsLoading(false)
    })

    const storedSchools = JSON.parse(localStorage.getItem('schools_master_full_v21') || '[]')
    setAllSchools(storedSchools.length > 0 ? storedSchools : schoolsDirectory)

    return () => unsubscribe()
  }, [selectedLibCct])

  const filteredRecords = useMemo(() => {
    const list = records.filter(r => r.name === activeTab);
    if (!searchTerm) return list;
    const term = searchTerm.toUpperCase();
    return list.filter(r => 
      (r.cct || '').toUpperCase().includes(term) ||
      (r.schoolName || '').toUpperCase().includes(term) ||
      (r.userName || '').toUpperCase().includes(term) ||
      (r.email || '').toUpperCase().includes(term)
    );
  }, [records, searchTerm, activeTab]);

  // Biblioteca Stats & Charts
  const libData = useMemo(() => {
    const libRecs = records.filter(r => r.name === 'Biblioteca Digital');
    const concluidos = libRecs.filter(r => r.progress === 100).length;
    const enProceso = libRecs.filter(r => r.progress > 0 && r.progress < 100).length;
    const pendientes = libRecs.filter(r => r.progress === 0).length;
    
    const chartData = [
      { name: 'En proceso', value: enProceso, color: '#007bff' },
      { name: 'Concluidos', value: concluidos, color: '#28a745' },
      { name: 'Pendientes', value: pendientes, color: '#6c757d' },
    ];

    const visitsData = Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(new Date(), 6 - i), 'dd MMM');
      return { name: date, visitas: Math.floor(Math.random() * 15) + 10 };
    });

    const totalEvidencias = libRecs.reduce((acc, r) => acc + (r.evidencePhotos?.length || 0), 0);

    return { 
      libRecs, 
      totalCct: libRecs.length, 
      concluidos, 
      chartData, 
      visitsData, 
      totalEvidencias,
      tecnicos: 8 
    };
  }, [records]);

  const selectedLibRecord = useMemo(() => {
    return libData.libRecs.find(r => r.cct === selectedLibCct) || null;
  }, [libData.libRecs, selectedLibCct]);

  const handleCctChange = (value: string) => {
    const cleanValue = value.toUpperCase().trim()
    setFormData(prev => ({ ...prev, cct: cleanValue }))
    
    const match = allSchools.find(s => s.cct.toUpperCase() === cleanValue)
    if (match) {
      setFormData(prev => ({ 
        ...prev, 
        cct: match.cct, schoolName: match.nombre, municipio: match.municipio, 
        valle: match.valle, region: match.region, zonaEscolar: match.zonaEscolar, 
        sector: match.sector, modalidad: match.modalidad 
      }))
      setDialogSearchTerm(match.cct)
      setShowSearchResults(false)
    }
  }

  const handleVerifyAccount = async () => {
    if (!verifyInput.trim()) return;
    setIsVerifying(true);
    try {
      const match = records.find(r => r.name === 'Cuentas Institucionales' && r.email?.toLowerCase() === verifyInput.toLowerCase());
      if (match) {
        setVerifiedAccount(match);
        toast({ title: "Cuenta Identificada", description: "El correo existe en la base maestra." });
      } else {
        setVerifiedAccount(null);
        toast({ variant: "destructive", title: "Sin registros", description: "El correo no se encuentra registrado." });
      }
    } finally {
      setIsVerifying(false);
    }
  }

  const handleSave = async () => {
    const currentCct = (formData.cct || dialogSearchTerm || '').toUpperCase().trim();
    if (!currentCct && activeTab !== 'Cuentas Institucionales') {
      toast({ variant: "destructive", title: "CCT Requerido" });
      return;
    }

    setIsSaving(true);
    try {
      let currentProgress = formData.progress;
      if (activeTab === 'Biblioteca Digital') {
        currentProgress = BIBLIOTECA_FASES_LABELS.filter(f => (formData.bibliotecaFases as any)?.[f.id]).reduce((max, f) => Math.max(max, f.progress), 0);
      }

      const finalData: Record<string, any> = {
        ...formData,
        name: String(activeTab),
        cct: String(currentCct),
        progress: currentProgress,
        email: activeTab === 'Cuentas Institucionales' ? `${userPart.toLowerCase()}${domainPart}` : formData.email,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'programs', editingId), finalData);
      } else {
        await addDoc(collection(db, 'programs'), { ...finalData, createdAt: serverTimestamp() });
      }
      
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Registro Guardado" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSaving(false);
    }
  }

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setDialogSearchTerm('');
    setUserPart('');
    setShowSearchResults(false);
    setVerifiedAccount(null);
  }

  const handleQuickAddCct = async () => {
    if (!quickAddForm.cct || !quickAddForm.nombre || !quickAddForm.municipio) {
      toast({ variant: "destructive", title: "Faltan datos" }); 
      return;
    }
    const newSchool: SchoolInfo = { 
      ...quickAddForm, 
      cct: quickAddForm.cct.toUpperCase(), 
      nombre: quickAddForm.nombre.toUpperCase(), 
      municipio: quickAddForm.municipio.toUpperCase(),
      valle: (quickAddForm.valle || 'MEXICO').toUpperCase(),
      region: (quickAddForm.region || '').toUpperCase(),
      modalidad: (quickAddForm.modalidad || 'DES').toUpperCase()
    };
    const updated = [newSchool, ...allSchools];
    setAllSchools(updated);
    localStorage.setItem('schools_master_full_v21', JSON.stringify(updated));
    handleCctChange(newSchool.cct);
    setIsQuickAddOpen(false);
    setDialogSearchTerm(newSchool.cct);
    toast({ title: "Plantel Registrado" });
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar registro?")) return;
    await deleteDoc(doc(db, 'programs', id));
    toast({ title: "Registro Removido" });
  }

  const fullEmailPreview = useMemo(() => {
    if (!userPart) return '';
    return `${userPart.toLowerCase().trim()}${domainPart}`;
  }, [userPart, domainPart]);

  const schoolSearchResults = useMemo(() => { 
    if (!dialogSearchTerm || dialogSearchTerm.length < 3) return []; 
    const term = dialogSearchTerm.toUpperCase(); 
    return allSchools.filter(s => s.cct.includes(term) || s.nombre.includes(term)).slice(0, 5); 
  }, [allSchools, dialogSearchTerm]);

  if (!mounted) return null

  return (
    <div className="space-y-6 animate-in fade-in duration-700 w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-primary leading-none uppercase">Módulos Técnicos COEES</h2>
          <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Auditoría Institucional 2026</p>
        </div>
        <div className="flex gap-3">
          {activeTab !== 'ATRES' && activeTab !== 'Cuentas Institucionales' && (
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 h-10 px-6 rounded-xl text-[10px] font-bold shadow-lg uppercase text-white">
               <PlusCircle className="h-5 w-5 mr-2" /> Nuevo Registro
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {PROGRAM_RUBROS.map(rubro => (
          <button 
            key={`rubro-${rubro}`} 
            onClick={() => { setActiveTab(rubro); setSearchTerm(''); }} 
            className={cn(
              "px-6 h-11 text-[10px] font-black rounded-xl transition-all border shadow-sm shrink-0 whitespace-nowrap uppercase tracking-wider", 
              activeTab === rubro ? "bg-primary text-white border-primary shadow-xl scale-105" : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
            )}
          >
            {rubro}
          </button>
        ))}
      </div>

      {activeTab === 'Biblioteca Digital' ? (
        <div className="space-y-6">
          {/* KPI CARDS ROW */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
             {[
               { label: 'CCT Registrados', value: libData.totalCct, sub: 'Escuelas', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
               { label: 'Visitas Totales', value: 128, sub: 'En el periodo', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
               { label: 'Atenciones', value: 96, sub: 'En el periodo', icon: ClipboardCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
               { label: 'Evidencias', value: libData.totalEvidencias || 243, sub: 'Fotografías / Reportes', icon: ImageIcon, color: 'text-orange-500', bg: 'bg-orange-50' },
               { label: 'Técnicos Activos', value: libData.tecnicos, sub: 'Asignados', icon: UserCheck, color: 'text-cyan-600', bg: 'bg-cyan-50' },
               { label: 'Proyectos Concluidos', value: libData.concluidos, sub: 'Escuelas', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
             ].map((kpi, idx) => (
               <Card key={idx} className="border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                     <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner", kpi.bg, kpi.color)}>
                        <kpi.icon className="h-6 w-6" />
                     </div>
                     <div className="min-w-0">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight truncate">{kpi.label}</p>
                        <h4 className="text-xl font-black text-slate-800 leading-none mt-1">{kpi.value}</h4>
                        <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">{kpi.sub}</p>
                     </div>
                  </CardContent>
               </Card>
             ))}
          </div>

          <Card className="border-none shadow-sm rounded-2xl p-4 bg-white/80 backdrop-blur-md">
             <div className="flex flex-col lg:flex-row gap-4 items-end">
                <div className="flex-1 relative group w-full">
                   <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                   <Input 
                      placeholder="BUSCAR POR CCT O ESCUELA EN BIBLIOTECA..." 
                      className="h-9 pl-9 rounded-xl bg-slate-50 border-none shadow-inner text-xs font-bold uppercase focus:bg-white transition-all"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                   />
                </div>
                <div className="flex gap-2">
                   <Button variant="outline" className="h-9 px-4 border-rose-200 text-rose-700 bg-rose-50/50 rounded-xl text-[9px] font-black uppercase gap-2 hover:bg-rose-50"><FileDown className="h-3.5 w-3.5" /> Exportar CSV</Button>
                   <Button variant="outline" className="h-9 px-4 border-slate-200 text-slate-700 bg-slate-50/50 rounded-xl text-[9px] font-black uppercase gap-2 hover:bg-slate-100"><Printer className="h-3.5 w-3.5" /> Imprimir Reporte</Button>
                </div>
             </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
             <Card className="lg:col-span-8 border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                <div className="p-6 border-b flex items-center justify-between">
                   <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest">Fases del Proyecto por CCT</h3>
                   <Badge className="bg-primary/5 text-primary border-none font-black text-[9px] px-3">{libData.libRecs.length} Planteles</Badge>
                </div>
                <div className="overflow-x-auto">
                   <Table>
                      <TableHeader className="bg-slate-50/50">
                         <TableRow className="h-12">
                            <TableHead className="pl-8 text-[9px] font-black uppercase">CCT</TableHead>
                            <TableHead className="text-[9px] font-black uppercase">Escuela</TableHead>
                            <TableHead className="text-[9px] font-black uppercase">Municipio</TableHead>
                            <TableHead className="text-[9px] font-black uppercase">Fase Actual</TableHead>
                            <TableHead className="text-[9px] font-black uppercase">Avance</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-center">Estatus</TableHead>
                            <TableHead className="text-[9px] font-black uppercase">Analista</TableHead>
                            <TableHead className="text-right pr-8 text-[9px] font-black uppercase">Acción</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {filteredRecords.map((rec, i) => {
                           const currentFase = BIBLIOTECA_FASES_LABELS.find(f => f.progress === rec.progress) || BIBLIOTECA_FASES_LABELS[0];
                           return (
                             <TableRow key={rec.id || i} className={cn("h-16 border-b border-slate-50 hover:bg-slate-50/50 transition-all cursor-pointer", selectedLibCct === rec.cct && "bg-blue-50/30")} onClick={() => setSelectedLibCct(rec.cct)}>
                                <TableCell className="pl-8 font-mono font-black text-[10px] text-primary">{rec.cct}</TableCell>
                                <TableCell className="font-bold text-[11px] text-slate-700 uppercase truncate max-w-[150px]">{rec.schoolName}</TableCell>
                                <TableCell className="text-[9px] font-black text-slate-400 uppercase">{rec.municipio}</TableCell>
                                <TableCell>
                                   <div className={cn("px-3 py-1.5 rounded-lg border flex flex-col min-w-[140px]", currentFase.color)}>
                                      <span className="text-[8px] font-black uppercase leading-none truncate">{currentFase.label.split('.')[0]}</span>
                                      <span className="text-[7px] font-bold mt-1 opacity-70 truncate">{currentFase.label.split('.')[1]}</span>
                                   </div>
                                </TableCell>
                                <TableCell>
                                   <div className="flex items-center gap-3 min-w-[100px]">
                                      <Progress value={rec.progress} className={cn("h-1.5 flex-1", rec.progress === 100 ? "bg-emerald-100" : "bg-blue-100")} />
                                      <span className="text-[10px] font-black text-slate-600">{rec.progress}%</span>
                                   </div>
                                </TableCell>
                                <TableCell className="text-center">
                                   <Badge className={cn("text-[8px] font-black border-none uppercase px-3 h-5 rounded-full", rec.progress === 100 ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}>
                                      {rec.progress === 100 ? 'Concluido' : 'En proceso'}
                                   </Badge>
                                </TableCell>
                                <TableCell className="text-[10px] font-bold text-slate-500 uppercase">{rec.userName || 'ANALISTA'}</TableCell>
                                <TableCell className="text-right pr-6">
                                   <div className="flex justify-end gap-1">
                                      <button onClick={(e) => { e.stopPropagation(); setFormData({...rec}); setEditingId(rec.id!); setIsDialogOpen(true); }} className="h-8 w-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary/5 transition-all"><Pencil className="h-4 w-4" /></button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDelete(rec.id!); }} className="h-8 w-8 rounded-lg flex items-center justify-center text-rose-300 hover:text-rose-600 transition-all"><Trash2 className="h-4 w-4" /></button>
                                   </div>
                                </TableCell>
                             </TableRow>
                           );
                         })}
                      </TableBody>
                   </Table>
                </div>
             </Card>

             <Card className="lg:col-span-4 border-none shadow-xl rounded-[2.5rem] bg-white h-full flex flex-col overflow-hidden">
                <div className="p-6 border-b space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary"><ClipboardList className="h-6 w-6" /></div>
                      <div>
                         <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest leading-none">Detalle de Fases del Proyecto</h3>
                         <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">(CCT: {selectedLibCct || 'NINGUNO'})</p>
                      </div>
                   </div>
                </div>
                <div className="flex-1 overflow-hidden">
                   <ScrollArea className="h-full">
                      <div className="p-8 space-y-6">
                         {BIBLIOTECA_FASES_LABELS.map((fase, i) => {
                           const isCompleted = selectedLibRecord ? (selectedLibRecord.progress >= fase.progress) : false;
                           const isActive = selectedLibRecord ? (selectedLibRecord.progress === (BIBLIOTECA_FASES_LABELS[i-1]?.progress || 0)) : i === 0;
                           
                           return (
                             <div key={fase.id} className="flex gap-4 relative group">
                                {i !== BIBLIOTECA_FASES_LABELS.length - 1 && (
                                  <div className={cn("absolute left-4 top-8 w-0.5 h-12 transition-colors", isCompleted ? "bg-emerald-500" : "bg-slate-100")} />
                                )}
                                <div className={cn(
                                   "h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-all",
                                   isCompleted ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200" : 
                                   isActive ? "bg-white border-blue-500 text-blue-500 ring-4 ring-blue-50" : 
                                   "bg-white border-slate-200 text-slate-300"
                                )}>
                                   {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-[10px] font-black">{i + 1}</span>}
                                </div>
                                <div className={cn(
                                   "flex-1 p-3 rounded-2xl border transition-all",
                                   isActive ? "bg-blue-50/50 border-blue-100 shadow-sm translate-x-1" : "bg-transparent border-transparent"
                                )}>
                                   <p className={cn("text-[10px] font-black uppercase leading-tight", isCompleted ? "text-slate-700" : isActive ? "text-blue-600" : "text-slate-300")}>{fase.label.split('.')[0]}</p>
                                   <p className={cn("text-[9px] font-bold mt-0.5", isCompleted ? "text-slate-400" : isActive ? "text-blue-500/70" : "text-slate-200")}>{fase.label.split('.')[1]}</p>
                                </div>
                             </div>
                           );
                         })}
                      </div>
                   </ScrollArea>
                </div>
             </Card>
          </div>

          {/* CHARTS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden p-6">
                <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-blue-600" /><h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">Visitas por día</h4></div>
                </div>
                <div className="h-[240px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={libData.visitsData}>
                         <defs><linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#007bff" stopOpacity={0.1}/><stop offset="95%" stopColor="#007bff" stopOpacity={0}/></linearGradient></defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} dy={10} />
                         <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                         <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                         <Area type="monotone" dataKey="visitas" stroke="#007bff" strokeWidth={3} fillOpacity={1} fill="url(#colorVis)" />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </Card>

             <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden p-6">
                <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-3"><PieChartIcon className="h-5 w-5 text-emerald-600" /><h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">Estatus del Proyecto</h4></div>
                </div>
                <div className="h-[240px] w-full flex items-center justify-center relative">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie data={libData.chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                            {libData.chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                         </Pie>
                         <Tooltip />
                      </PieChart>
                   </ResponsiveContainer>
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black text-slate-800">{libData.totalCct}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase">Total CCT</span>
                   </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                   {libData.chartData.map((item, idx) => (
                     <div key={idx} className="flex flex-col items-center text-center">
                        <div className="flex items-center gap-1.5 mb-1"><div className="h-2 w-2 rounded-full" style={{backgroundColor: item.color}} /><span className="text-[9px] font-black text-slate-600 uppercase">{item.name}</span></div>
                        <span className="text-xs font-black text-slate-400">{item.value}</span>
                     </div>
                   ))}
                </div>
             </Card>

             <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6 shrink-0">
                   <div className="flex items-center gap-3"><ImageIcon className="h-5 w-5 text-orange-500" /><h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">Evidencias recientes</h4></div>
                </div>
                <div className="flex-1 overflow-hidden">
                   <div className="grid grid-cols-2 gap-4">
                      {libData.libRecs.slice(0, 4).map((rec, ridx) => (
                        <div key={ridx} className="relative group aspect-[4/3] rounded-2xl overflow-hidden shadow-sm border border-slate-100 bg-slate-50">
                           <Image src={`https://picsum.photos/seed/ev-${ridx+10}/400/300`} alt="Evidencia" fill className="object-cover transition-transform group-hover:scale-110" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-3 flex flex-col justify-end">
                              <p className="text-[8px] font-black text-white uppercase truncate">{rec.cct}</p>
                              <div className="absolute bottom-3 right-3"><div className="h-5 w-5 bg-rose-600 rounded-lg flex items-center justify-center text-white shadow-lg"><FileText className="h-3 w-3" /></div></div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </Card>
          </div>
        </div>
      ) : activeTab === 'ATRES' ? (
        <div className="h-[calc(100vh-220px)] w-full overflow-hidden border border-slate-200 rounded-[3rem] shadow-2xl bg-white">
           <HelpDeskInterface />
        </div>
      ) : activeTab === 'Geoposición' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500 w-full h-[calc(100vh-220px)] min-h-[650px]">
           <div className="lg:col-span-7 flex flex-col h-full space-y-4">
              <Card className="flex-1 rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden relative group">
                 <Image src="https://picsum.photos/seed/mapa-toluca-2026/1200/900" alt="Mapa Institucional" fill className="object-cover" />
                 <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
                    <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-2xl flex border border-white">
                       <Button size="sm" variant="ghost" className="h-8 px-4 text-[9px] font-black uppercase rounded-lg bg-slate-100">Mapa</Button>
                       <Button size="sm" variant="ghost" className="h-8 px-4 text-[9px] font-black uppercase rounded-lg text-slate-400">Satélite</Button>
                    </div>
                 </div>
                 <div className="absolute bottom-10 right-6 flex flex-col gap-2 z-10">
                    <Button size="icon" className="h-10 w-10 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-2xl border border-slate-100"><Plus className="h-5 w-5" /></Button>
                    <div className="h-px w-6 bg-slate-200 mx-auto" />
                    <Button size="icon" className="h-10 w-10 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-2xl border border-slate-100"><MinusCircle className="h-5 w-5" /></Button>
                    <Button size="icon" className="h-10 w-10 bg-primary text-white rounded-xl shadow-2xl mt-4 hover:scale-110 transition-transform"><LocateFixed className="h-5 w-5" /></Button>
                 </div>
                 <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-[1.5rem] shadow-2xl border border-white z-10 flex gap-6">
                    <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" /><span className="text-[9px] font-black text-slate-600 uppercase">En línea</span></div>
                    <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-blue-500 shadow-sm shadow-blue-200" /><span className="text-[9px] font-black text-slate-600 uppercase">En movimiento</span></div>
                    <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-rose-500 shadow-sm shadow-rose-200" /><span className="text-[9px] font-black text-slate-600 uppercase">Sin señal</span></div>
                 </div>
              </Card>
           </div>
           <div className="lg:col-span-5 flex flex-col h-full space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 space-y-6 shrink-0">
                 <div className="flex items-start gap-4"><div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><MapPin className="h-6 w-6" /></div><div><h3 className="text-xl font-black text-slate-800 uppercase leading-none tracking-tighter">Registrar coordenadas</h3><p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Ingresa el CCT y las coordenadas decimales.</p></div></div>
                 <div className="space-y-5 pt-2">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-500 uppercase pl-1">CCT *</Label><Input placeholder="Ej. 15DES0001R" className="h-12 rounded-xl bg-slate-50 border-slate-100 text-sm font-bold uppercase" value={dialogSearchTerm} onChange={e => { setDialogSearchTerm(e.target.value); handleCctChange(e.target.value); }} /></div>
                    <div className="grid grid-cols-2 gap-6"><div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-500 uppercase pl-1">Latitud *</Label><Input placeholder="Ej. 19.6289" className="h-12 rounded-xl bg-slate-50 border-slate-100 text-sm font-bold" value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} /></div><div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-500 uppercase pl-1">Longitud *</Label><Input placeholder="Ej. -99.3128" className="h-12 rounded-xl bg-slate-50 border-slate-100 text-sm font-bold" value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} /></div></div>
                    <div className="flex gap-4 pt-2"><Button onClick={handleSave} disabled={isSaving} className="flex-1 btn-institutional h-12 rounded-xl text-[11px] gap-3 shadow-xl">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5" />} GUARDAR</Button><Button variant="outline" onClick={resetForm} className="flex-1 h-12 rounded-xl border-slate-200 text-slate-500 font-black text-[11px] gap-2 uppercase"><RotateCcw className="h-4 w-4" /> LIMPIAR</Button></div>
                 </div>
              </Card>
              <Card className="flex-1 rounded-[2.5rem] border-none shadow-xl bg-white flex flex-col overflow-hidden">
                 <div className="p-6 border-b flex items-center gap-3"><ClipboardList className="h-5 w-5 text-primary" /><h4 className="text-sm font-black text-slate-700 uppercase tracking-widest">Bitácora Geográfica</h4></div>
                 <div className="flex-1 overflow-hidden"><ScrollArea className="h-full"><Table><TableHeader className="bg-slate-50/50 sticky top-0 z-10 border-b"><TableRow className="h-10"><TableHead className="text-[9px] font-black uppercase text-slate-400 pl-6">Fecha</TableHead><TableHead className="text-[9px] font-black uppercase text-slate-400">CCT</TableHead><TableHead className="text-right pr-6 text-[9px] font-black uppercase text-slate-400">Acciones</TableHead></TableRow></TableHeader><TableBody>{records.filter(r => r.name === 'Geoposición').map((rec, i) => (<TableRow key={rec.id || i} className="h-12 border-b border-slate-50 hover:bg-slate-50/50 transition-colors"><TableCell className="pl-6 text-[9px] font-bold text-slate-400">{rec.date}</TableCell><TableCell className="font-mono font-black text-[10px] text-primary">{rec.cct}</TableCell><TableCell className="text-right pr-6"><div className="flex justify-end gap-1"><button onClick={() => { setFormData({...rec}); setEditingId(rec.id!); setDialogSearchTerm(rec.cct); }} className="text-slate-400 hover:text-primary"><Eye className="h-3.5 w-3.5" /></button><button onClick={() => handleDelete(rec.id!)} className="text-rose-300 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button></div></TableCell></TableRow>))}</TableBody></Table></ScrollArea></div>
              </Card>
           </div>
        </div>
      ) : activeTab === 'Cuentas Institucionales' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500 w-full min-h-[600px]">
           <div className="lg:col-span-5 space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-10 space-y-8 h-full flex flex-col shadow-primary/5">
                 <div className="flex items-start gap-5"><div className="h-14 w-14 rounded-3xl bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/30"><Mail className="h-8 w-8" /></div><div className="space-y-1"><h3 className="text-2xl font-black text-slate-800 leading-none uppercase tracking-tighter">Registro Técnico</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Creación y Restructuración de Cuentas</p></div></div>
                 <div className="space-y-6 flex-1">
                    <div className="space-y-2"><Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Servidor Público (Responsable) *</Label><Input placeholder="NOMBRE COMPLETO..." className="h-12 rounded-xl bg-slate-50 border-slate-100 px-4 text-xs font-bold uppercase shadow-inner" value={formData.userName} onChange={e => setFormData({...formData, userName: e.target.value.toUpperCase()})} /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Departamento / Área *</Label><Input placeholder="NOMBRE DE LA OFICINA O ÁREA..." className="h-12 rounded-xl bg-slate-50 border-slate-100 px-4 text-xs font-bold uppercase shadow-inner" value={formData.departamento} onChange={e => setFormData({...formData, departamento: e.target.value.toUpperCase()})} /></div>
                    <div className="space-y-4 p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                       <Label className="text-[10px] font-black text-primary uppercase ml-1">Construcción del Correo Institucional</Label>
                       <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1 relative"><Input placeholder="usuario..." className="h-11 rounded-xl bg-white border-slate-200 text-xs font-bold" value={userPart} onChange={e => setUserPart(e.target.value.toLowerCase())} /><span className="absolute right-3 top-3.5 text-[10px] font-black text-slate-300">@</span></div>
                          <Select value={domainPart} onValueChange={setDomainPart}>
                            <SelectTrigger className="h-11 rounded-xl w-full sm:w-[180px] bg-white border-slate-200 text-[10px] font-black uppercase"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl">{DOMINIOS.map(d => (<SelectItem key={d} value={d} className="text-[10px] font-black">{d}</SelectItem>))}</SelectContent>
                          </Select>
                       </div>
                       <div className="mt-4 p-4 bg-white rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-2"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Vista previa del correo:</span><span className="text-sm font-black text-primary lowercase tracking-tight">{fullEmailPreview || 'esperando datos...'}</span></div>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4 pt-4 shrink-0"><Button onClick={handleSave} disabled={isSaving || !userPart} className="btn-institutional h-14 rounded-2xl text-[11px] gap-3 shadow-2xl">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5" />} GUARDAR</Button><Button variant="outline" onClick={resetForm} className="h-14 rounded-2xl border-slate-200 text-slate-500 font-black text-[11px] gap-2 uppercase hover:bg-slate-50"><RotateCcw className="h-4 w-4" /> LIMPIAR</Button></div>
              </Card>
           </div>
           <div className="lg:col-span-7 flex flex-col space-y-8">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 space-y-8 shrink-0 shadow-primary/5">
                 <div className="flex items-center gap-4"><div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner"><ShieldCheck className="h-7 w-7" /></div><div><h3 className="text-xl font-black text-slate-800 leading-none uppercase">Verificar existencia</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Validador Oficial de Correos en la Auditoría 2026</p></div></div>
                 <div className="flex gap-4"><div className="relative flex-1 group"><Search className="absolute left-4 top-4 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" /><Input placeholder="INGRESAR CORREO COMPLETO..." className="h-14 rounded-2xl bg-slate-50 border-none pl-12 text-sm font-bold shadow-inner focus:bg-white transition-all ring-1 ring-slate-100 focus:ring-emerald-500/20" value={verifyInput} onChange={e => setVerifyInput(e.target.value.toLowerCase())} onKeyDown={e => e.key === 'Enter' && handleVerifyAccount()} /></div><Button onClick={handleVerifyAccount} disabled={isVerifying} className={cn("h-14 px-8 rounded-2xl font-black text-[11px] uppercase transition-all shadow-xl", isVerifying ? "bg-slate-200" : "bg-emerald-600 hover:bg-emerald-700 text-white")}>{isVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : "VALIDAR"}</Button></div>
                 {verifiedAccount && (
                   <div className="bg-emerald-50 p-6 rounded-[2.5rem] border-2 border-emerald-100 flex items-center gap-6 animate-in zoom-in-95 duration-500 shadow-sm"><div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-xl border border-emerald-100"><CheckCircle2 className="h-8 w-8" /></div><div className="flex-1 space-y-1"><Badge className="bg-emerald-600 text-white border-none text-[8px] font-black uppercase mb-1">CUENTA ACTIVA</Badge><h4 className="text-xl font-black text-emerald-900 uppercase leading-none">{verifiedAccount.userName}</h4><p className="text-[10px] font-bold text-emerald-700/60 uppercase">{verifiedAccount.departamento} • Alta: {verifiedAccount.date}</p></div><div className="hidden sm:block text-right px-4 border-l border-emerald-100"><span className="text-[10px] font-black text-emerald-800 uppercase block leading-none">Sistema Auditor</span><span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Edoméx 2026</span></div></div>
                 )}
              </Card>
              <Card className="flex-1 rounded-[2.5rem] border-none shadow-xl bg-white flex flex-col overflow-hidden shadow-primary/5">
                 <div className="p-8 border-b flex items-center justify-between bg-slate-50/50"><div className="flex items-center gap-4"><div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner"><ClipboardList className="h-6 w-6" /></div><h4 className="text-sm font-black text-slate-700 uppercase tracking-widest">Historial de registros</h4></div></div>
                 <div className="flex-1 overflow-hidden"><ScrollArea className="h-full"><Table><TableHeader className="bg-slate-50/50 sticky top-0 z-10 border-b"><TableRow className="h-12"><TableHead className="pl-8 text-[9px] font-black uppercase">Responsable / Servidor</TableHead><TableHead className="text-[9px] font-black uppercase">Correo Registrado</TableHead><TableHead className="text-[9px] font-black uppercase text-center">Estatus</TableHead><TableHead className="text-right pr-10 text-[9px] font-black uppercase">Acciones</TableHead></TableRow></TableHeader><TableBody>{records.filter(r => r.name === 'Cuentas Institucionales').map((rec, idx) => (<TableRow key={rec.id || idx} className="h-16 border-b border-slate-50 hover:bg-slate-50 transition-colors"><TableCell className="pl-8"><div className="flex flex-col"><span className="text-[11px] font-black text-slate-700 uppercase leading-none">{rec.userName}</span><span className="text-[8px] font-bold text-slate-400 mt-1 uppercase truncate max-w-[150px]">{rec.departamento}</span></div></TableCell><TableCell className="font-mono text-[10px] font-bold text-primary">{rec.email}</TableCell><TableCell className="text-center"><Badge variant="outline" className={cn("text-[8px] font-black px-3 h-5 rounded-full border-2 uppercase", rec.status === 'activo' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100")}>{rec.status}</Badge></TableCell><TableCell className="text-right pr-8"><div className="flex justify-end gap-1"><button onClick={() => { setFormData({...rec}); setEditingId(rec.id!); setUserPart(rec.email?.split('@')[0] || ''); }} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary transition-all"><Eye className="h-4 w-4" /></button><button onClick={() => handleDelete(rec.id!)} className="h-8 w-8 rounded-lg flex items-center justify-center text-rose-300 hover:text-rose-600 transition-all"><Trash2 className="h-4 w-4" /></button></div></TableCell></TableRow>))}</TableBody></Table></ScrollArea></div>
              </Card>
           </div>
        </div>
      ) : (
        <Card className="executive-card p-0 shadow-2xl border-none overflow-hidden bg-white animate-in slide-in-from-bottom-4 duration-500 w-full min-h-[400px]">
          <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50/50">
             <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Briefcase className="h-5 w-5" /></div><div><h3 className="text-sm font-black uppercase text-slate-800">{activeTab}</h3><p className="text-[9px] font-bold text-slate-400 uppercase">Gestión Técnica</p></div></div>
             <div className="flex items-center gap-4"><div className="relative w-full sm:w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" /><Input placeholder="Buscar..." className="h-9 pl-9 rounded-xl border-slate-200 text-xs font-bold bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div></div>
          </div>
          <div className="overflow-x-auto w-full">
            <Table className="w-full">
              <TableHeader className="bg-slate-50 border-b"><TableRow className="h-12"><TableHead className="w-12 text-[10px] font-bold pl-8 uppercase">#</TableHead><TableHead className="text-[10px] font-bold text-primary w-[110px] uppercase">CCT</TableHead><TableHead className="text-[10px] font-bold text-primary min-w-[200px] uppercase">Nombre / Escuela</TableHead><TableHead className="text-[10px] font-bold text-primary w-[100px] uppercase text-center">Estatus</TableHead><TableHead className="text-right text-[10px] font-bold pr-10 w-24 uppercase">Acción</TableHead></TableRow></TableHeader>
              <TableBody>{isLoading ? (<TableRow><TableCell colSpan={5} className="text-center py-20 opacity-30"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /><p className="text-[10px] font-black uppercase">Sincronizando...</p></TableCell></TableRow>) : filteredRecords.length > 0 ? filteredRecords.map((rec, idx) => (<TableRow key={rec.id || idx} className="hover:bg-slate-50 border-b border-slate-50 h-14 transition-colors"><TableCell className="pl-8 font-bold text-[10px] text-slate-300">{idx + 1}</TableCell><TableCell className="font-mono font-bold text-[11px] text-primary">{rec.cct}</TableCell><TableCell className="py-2 min-w-0"><div className="flex flex-col"><span className="text-[12px] font-bold text-slate-700 leading-tight truncate uppercase">{rec.schoolName || rec.userName}</span><span className="text-[9px] font-bold text-muted-foreground opacity-70 truncate uppercase">{rec.municipio} • {rec.valle}</span></div></TableCell><TableCell className="text-center"><Badge variant="outline" className={cn("text-[8px] font-bold px-2 h-5 rounded-full border-2 uppercase", rec.status === 'activo' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200")}>{rec.status}</Badge></TableCell><TableCell className="text-right pr-10"><div className="flex justify-end gap-1"><button onClick={() => { setFormData({...rec}); setEditingId(rec.id!); setDialogSearchTerm(rec.cct); setIsDialogOpen(true); }} className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-primary"><Pencil className="h-4 w-4" /></button><button onClick={() => handleDelete(rec.id!)} className="h-8 w-8 flex items-center justify-center text-rose-300 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></div></TableCell></TableRow>)) : (<TableRow><TableCell colSpan={5} className="text-center py-24 opacity-30 text-sm font-bold uppercase tracking-widest">Sin registros oficiales</TableCell></TableRow>)}</TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!isSaving) { setIsDialogOpen(open); if(!open) resetForm(); } }}>
        <DialogContent className="w-[98vw] lg:max-w-[1200px] h-[92vh] rounded-[2.5rem] p-0 overflow-hidden bg-white flex flex-col border-none shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white shrink-0">
             <DialogTitle className="font-black text-2xl uppercase flex items-center gap-4"><Settings className="h-8 w-8 text-accent" /> Gestión Técnica: {activeTab}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-10 space-y-10 max-w-5xl mx-auto">
                {activeTab !== 'Cuentas Institucionales' && (
                  <div className={cn("bg-slate-50 p-8 rounded-[2.5rem] border-2 transition-all space-y-6 shadow-inner", !formData.cct ? "border-rose-200" : "border-primary/10")}>
                    <Label className="text-[11px] font-black text-primary tracking-widest block pl-1 uppercase">Identificación del Plantel (CCT)</Label>
                    <div className="relative">
                      <Input 
                        placeholder="INGRESAR CCT (MÍN. 3 CARACTERES)..." 
                        className="h-14 w-full rounded-2xl bg-white border border-primary/20 font-bold text-xl uppercase shadow-lg pl-6" 
                        value={dialogSearchTerm} 
                        onChange={(e) => { setDialogSearchTerm(e.target.value); handleCctChange(e.target.value); setShowSearchResults(true); }} 
                      />
                      {showSearchResults && dialogSearchTerm.length > 2 && (
                        <div className="absolute top-18 left-0 right-0 max-h-60 overflow-auto bg-white border rounded-2xl shadow-2xl z-[100] divide-y">
                          {schoolSearchResults.map((s, sidx) => (
                            <div key={`${s.cct}-${sidx}`} className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center group" onClick={() => handleCctChange(s.cct)}>
                              <div className="flex flex-col"><span className="text-sm font-bold uppercase truncate group-hover:text-primary">{s.nombre}</span><span className="text-[10px] font-mono text-muted-foreground">{s.cct} • {s.municipio}</span></div>
                              <ChevronRightIcon className="h-5 w-5 text-slate-300" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl space-y-8">
                   {activeTab === 'Biblioteca Digital' && (
                     <div className="space-y-10">
                        <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                           <h4 className="text-[11px] font-black text-primary uppercase flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Control de Fases</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {BIBLIOTECA_FASES_LABELS.map(f => (
                                <div key={f.id} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200">
                                   <Checkbox checked={(formData.bibliotecaFases as any)?.[f.id]} onCheckedChange={(val) => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, [f.id]: !!val}})} id={`check-${f.id}`} />
                                   <Label htmlFor={`check-${f.id}`} className="text-[9px] font-bold text-slate-600 uppercase cursor-pointer">{f.label}</Label>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                   )}

                   <div className="space-y-2 pt-4">
                      <Label className="text-[10px] font-black text-slate-400 pl-1 uppercase">Observaciones Operativas</Label>
                      <Textarea value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value.toUpperCase()})} className="min-h-[100px] bg-slate-50 border-none rounded-2xl p-6 font-bold uppercase shadow-inner" />
                   </div>
                </div>
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4 shrink-0">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSaving} className="h-12 px-8 rounded-xl font-bold text-xs uppercase">Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving} className="btn-institutional h-12 px-16 text-xs gap-3 rounded-xl shadow-2xl">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5" />} GUARDAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-[#B38E5D] text-white shrink-0"><DialogTitle className="uppercase font-black text-lg flex items-center gap-3"><PlusCircle className="h-6 w-6" /> Registro Rápido de CCT</DialogTitle></DialogHeader>
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">CCT</Label><Input value={quickAddForm.cct} onChange={e => setQuickAddForm({...quickAddForm, cct: e.target.value.toUpperCase()})} maxLength={10} className="font-mono font-black border-slate-200" /></div><div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Nombre del Plantel</Label><Input value={quickAddForm.nombre} onChange={e => setQuickAddForm({...quickAddForm, nombre: e.target.value.toUpperCase()})} className="font-black border-slate-200" /></div></div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Municipio</Label><Input value={quickAddForm.municipio} onChange={e => setQuickAddForm({...quickAddForm, municipio: e.target.value.toUpperCase()})} className="font-bold uppercase border-slate-200" /></div><div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Valle</Label><Select value={quickAddForm.valle} onValueChange={v => setQuickAddForm({...quickAddForm, valle: v})}><SelectTrigger className="font-bold border-slate-200"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MEXICO">MÉXICO</SelectItem><SelectItem value="TOLUCA">TOLUCA</SelectItem></SelectContent></Select></div></div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-3"><Button variant="ghost" onClick={() => setIsQuickAddOpen(false)} className="h-12 px-8 text-[10px] font-black uppercase">Cancelar</Button><Button onClick={handleQuickAddCct} className="bg-primary text-white h-12 px-12 rounded-xl text-[10px] font-black uppercase shadow-lg">Registrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
