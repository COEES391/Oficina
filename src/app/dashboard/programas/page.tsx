
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
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
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
  MapPin,
  ClipboardCheck,
  X,
  Building2,
  UserPlus,
  Eye,
  History,
  Navigation,
  PieChart as PieChartIcon,
  ChevronLeft,
  Info,
  RefreshCw,
  ImageIcon,
  Archive,
  Upload,
  FileText,
  Activity,
  LocateFixed,
  TrendingUp,
  Monitor,
  ClipboardList,
  Users,
  Settings,
  RotateCcw,
  RotateCw,
  LayoutGrid,
  Phone,
  MonitorCheck,
  Server
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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
  where
} from 'firebase/firestore'
import { type ProgramStatus } from '@/lib/planning-data'
import { schoolsDirectory, type SchoolInfo } from "@/lib/schools-directory"
import { HelpDeskInterface } from '@/components/HelpDeskInterface'

const DOMINIOS = [
  '@coees.edu.mx',
  '@desysa.edu.mx',
  '@edomex.gob.mx'
];

const BIBLIOTECA_FASES_LABELS = [
  { id: 'fase1', label: 'Fase 1. Solicitud de instalación de biblioteca digital', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', progress: 11 },
  { id: 'fase2', label: 'Fase 2. Atención al CCT', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', progress: 22 },
  { id: 'fase3', label: 'Fase 3. Diagnóstico del equipo de cómputo existente', color: 'text-blue-600 bg-blue-50 border-blue-100', progress: 33 },
  { id: 'fase4', label: 'Fase 4. Instalación total de los contenidos del proyecto', color: 'text-amber-600 bg-amber-50 border-amber-100', progress: 44 },
  { id: 'fase5', label: 'Fase 5. Funcionalidad (pruebas de uso y manejo)', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', progress: 56 },
  { id: 'fase6', label: 'Fase 6. Guía orientación de uso y manejo de la herramienta', color: 'text-purple-600 bg-purple-50 border-purple-100', progress: 67 },
  { id: 'fase7', label: 'Fase 7. Seguimiento técnico al CCT', color: 'text-cyan-600 bg-cyan-50 border-cyan-100', progress: 78 },
  { id: 'fase8', label: 'Fase 8. Total de personal capacitado', color: 'text-orange-600 bg-orange-50 border-orange-100', progress: 89 },
  { id: 'fase9', label: 'Fase 9. Total de equipos habilitados', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', progress: 100 }
];

const FUNCIONES = ["PAAE", "DOCENTE", "DIRECTIVO", "JEFE DE ENSEÑANZA", "SUPERVISOR", "ASESOR TECNICO PEDAGOGICO"];

const VISIT_DATA = [
  { name: 'Lun', visits: 0 },
  { name: 'Mar', visits: 0 },
  { name: 'Mie', visits: 0 },
  { name: 'Jue', visits: 0 },
  { name: 'Vie', visits: 0 },
  { name: 'Sab', visits: 0 },
  { name: 'Dom', visits: 0 },
];

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [activeTab, setActiveTab] = useState('Cuentas Institucionales')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogSearchTerm, setDialogSearchTerm] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  
  const [municipioFilter, setMunicipioFilter] = useState('all')
  const [estatusFilter, setEstatusFilter] = useState('all')

  const pdfInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  
  const [verifyInput, setVerifyInput] = useState('')
  const [verifiedAccount, setVerifiedAccount] = useState<ProgramStatus | null>(null)
  const [userPart, setUserPart] = useState('')
  const [domainPart, setDomainPart] = useState(DOMINIOS[0])
  
  const [selectedLibCct, setSelectedLibCct] = useState<string | null>(null)
  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([])

  const initialFormState: ProgramStatus = {
    name: '', progress: 0, status: 'activo', date: new Date().toISOString().split('T')[0], 
    cct: '', schoolName: '', userName: '', rfc: '', puesto: '', departamento: '',
    email: '', emails: [''], zonaEscolar: '', sector: '', modalidad: '', municipio: '', region: '', valle: '',
    latitud: '', longitud: '', observaciones: '', evidencePhotos: [], reportPdf: '',
    asistentes: [],
    bibliotecaFases: {
      fase1: false, fase2: false, fase3: false, fase4: false, fase5: false,
      fase6: false, fase7: false, fase8: false, fase9: false,
      personalCapacitado: 0, equiposHabilitados: 0
    }
  }

  const [formData, setFormData] = useState<ProgramStatus>(initialFormState)
  const [asistentes, setAsistentes] = useState<any[]>([{ paterno: '', materno: '', nombres: '', rfc: '', funcion: '', cct: '', nombreCT: '' }])

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

  const libData = useMemo(() => {
    const libRecs = records.filter(r => r.name === 'Biblioteca Digital');
    const concluidos = libRecs.filter(r => r.progress === 100).length;
    const evidencesCount = libRecs.reduce((acc, r) => acc + (r.evidencePhotos?.length || 0), 0);
    
    return { 
      libRecs, 
      totalCct: libRecs.length, 
      concluidos, 
      evidencesCount,
      visitasTotales: 0, 
      atenciones: 0,
      tecnicosActivos: 0
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const base = records.filter(r => r.name === activeTab);
    return base.filter(r => {
      const matchSearch = !searchTerm || (r.cct || '').toUpperCase().includes(searchTerm.toUpperCase()) || (r.schoolName || '').toUpperCase().includes(searchTerm.toUpperCase());
      const matchMunicipio = municipioFilter === 'all' || r.municipio === municipioFilter;
      const matchEstatus = estatusFilter === 'all' || (estatusFilter === 'Concluido' ? r.progress === 100 : r.progress < 100);
      return matchSearch && matchMunicipio && matchEstatus;
    });
  }, [records, activeTab, searchTerm, municipioFilter, estatusFilter]);

  const selectedLibRecord = useMemo(() => libData.libRecs.find(r => r.cct === selectedLibCct) || null, [libData.libRecs, selectedLibCct]);

  const statusPieData = useMemo(() => {
    const total = libData.libRecs.length || 1;
    const conc = libData.concluidos;
    const proc = libData.libRecs.length - conc;
    return [
      { name: 'En proceso', value: proc, fill: '#0052cc' },
      { name: 'Concluidos', value: conc, fill: '#10b981' },
      { name: 'Pendientes', value: 0, fill: '#cbd5e1' },
    ];
  }, [libData]);

  const handleCctChange = (value: string) => {
    const cleanValue = value.toUpperCase().trim()
    setFormData(prev => ({ ...prev, cct: cleanValue }))
    const match = allSchools.find(s => s.cct.toUpperCase() === cleanValue)
    if (match) {
      setFormData(prev => ({ 
        ...prev, 
        cct: match.cct, schoolName: match.nombre, municipio: match.municipio, 
        valle: match.valle, region: match.region, zonaEscolar: match.zonaEscolar, 
        sector: match.sector, modalidad: match.modalidad,
        telefono: match.telefono, email: match.email || ''
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
        toast({ title: "Cuenta Identificada" });
      } else {
        setVerifiedAccount(null);
        toast({ variant: "destructive", title: "Sin registros" });
      }
    } finally { setIsVerifying(false); }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'image') => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      if (type === 'pdf') { setFormData(prev => ({ ...prev, reportPdf: base64 })) }
      else { setFormData(prev => ({ ...prev, evidencePhotos: [...(prev.evidencePhotos || []), base64] })) }
      toast({ title: "Evidencia añadida" })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleAddAssistant = () => {
    setAsistentes([...asistentes, { paterno: '', materno: '', nombres: '', rfc: '', funcion: '', cct: '', nombreCT: '' }]);
  };

  const handleRemoveAssistant = (index: number) => {
    if (asistentes.length === 1) return;
    setAsistentes(asistentes.filter((_, i) => i !== index));
  };

  const updateAssistant = (index: number, field: string, value: string) => {
    const newAsistentes = [...asistentes];
    newAsistentes[index] = { ...newAsistentes[index], [field]: value.toUpperCase() };

    if (field === 'cct') {
      const cleanValue = value.trim().toUpperCase();
      if (cleanValue.length === 10) {
        const school = allSchools.find(s => s.cct.toUpperCase() === cleanValue);
        if (school) {
          newAsistentes[index].nombreCT = school.nombre;
        }
      }
    }
    setAsistentes(newAsistentes);
  };

  const handleSave = async () => {
    const currentCct = (formData.cct || dialogSearchTerm || '').toUpperCase().trim();
    if (!currentCct && activeTab !== 'Cuentas Institucionales') {
      toast({ variant: "destructive", title: "CCT Requerido" }); return;
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
        asistentes: activeTab === 'Biblioteca Digital' ? asistentes.filter(a => a.rfc && a.nombres) : (formData.asistentes || []),
        updatedAt: serverTimestamp()
      };
      if (editingId) { await updateDoc(doc(db, 'programs', editingId), finalData); }
      else { await addDoc(collection(db, 'programs'), { ...finalData, createdAt: serverTimestamp() }); }
      setIsDialogOpen(false); resetForm(); toast({ title: "Registro Guardado" });
    } catch (e: any) { toast({ variant: "destructive", title: "Error", description: e.message }); }
    finally { setIsSaving(false); }
  }

  const resetForm = () => {
    setFormData(initialFormState); setEditingId(null); setDialogSearchTerm(''); setUserPart(''); setShowSearchResults(false); setVerifiedAccount(null);
    setAsistentes([{ paterno: '', materno: '', nombres: '', rfc: '', funcion: '', cct: '', nombreCT: '' }]);
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar registro?")) return;
    await deleteDoc(doc(db, 'programs', id));
    toast({ title: "Registro Removido" });
  }

  const handleEdit = (rec: ProgramStatus) => {
    setFormData({...rec});
    setEditingId(rec.id!);
    setDialogSearchTerm(rec.cct);
    if (rec.name === 'Cuentas Institucionales') { setUserPart(rec.email?.split('@')[0] || ''); setDomainPart('@' + (rec.email?.split('@')[1] || 'desysa.edu.mx')); }
    if (rec.name === 'Biblioteca Digital') { setAsistentes(rec.asistentes && rec.asistentes.length > 0 ? rec.asistentes : [{ paterno: '', materno: '', nombres: '', rfc: '', funcion: '', cct: '', nombreCT: '' }]); }
    setIsDialogOpen(true);
  }

  const fullEmailPreview = useMemo(() => userPart ? `${userPart.toLowerCase().trim()}${domainPart}` : '', [userPart, domainPart]);
  const schoolSearchResults = useMemo(() => { 
    if (!dialogSearchTerm || dialogSearchTerm.length < 3) return []; 
    const term = dialogSearchTerm.toUpperCase(); 
    return allSchools.filter(s => s.cct.includes(term) || s.nombre.includes(term)).slice(0, 5); 
  }, [allSchools, dialogSearchTerm]);

  if (!mounted) return null

  return (
    <div className="space-y-6 animate-in fade-in duration-700 w-full min-w-0 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
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

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 shrink-0">
        {['Cuentas Institucionales', 'Biblioteca Digital', 'Geoposición', 'Conoce mi Escuela', 'ATRES'].map(rubro => (
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

      <div className="flex-1 overflow-hidden flex flex-col">
      {activeTab === 'Biblioteca Digital' ? (
        <ScrollArea className="h-full">
        <div className="space-y-6 pb-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
             {[
               { label: 'CCT Registrados', value: libData.totalCct, sub: 'Escuelas', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
               { label: 'Visitas Totales', value: 0, sub: 'En el periodo', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
               { label: 'Atenciones', value: 0, sub: 'En el periodo', icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-50' },
               { label: 'Evidencias', value: libData.evidencesCount, sub: 'Fotografías / Reportes', icon: ImageIcon, color: 'text-orange-500', bg: 'bg-orange-50' },
               { label: 'Técnicos Activos', value: 0, sub: 'Asignados', icon: UserCheck, color: 'text-cyan-600', bg: 'bg-cyan-50' },
               { label: 'Proyectos Concluidos', value: libData.concluidos, sub: 'Escuelas', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
             ].map((kpi, idx) => (
               <Card key={idx} className="border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow bg-white">
                  <CardContent className="p-4 flex items-center gap-4">
                     <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner", kpi.bg, kpi.color)}><kpi.icon className="h-6 w-6" /></div>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 w-full">
                   <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Municipio</Label>
                      <Select value={municipioFilter} onValueChange={setMunicipioFilter}>
                         <SelectTrigger className="h-9 rounded-xl bg-slate-50 border-none shadow-inner text-[10px] font-bold uppercase"><SelectValue placeholder="TODOS" /></SelectTrigger>
                         <SelectContent className="rounded-xl">
                            <SelectItem value="all">TODOS</SelectItem>
                            {Array.from(new Set(allSchools.map(s => s.municipio))).sort().map(m => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Estatus</Label>
                      <Select value={estatusFilter} onValueChange={setEstatusFilter}>
                         <SelectTrigger className="h-9 rounded-xl bg-slate-50 border-none shadow-inner text-[10px] font-bold uppercase"><SelectValue placeholder="TODOS" /></SelectTrigger>
                         <SelectContent className="rounded-xl">
                            <SelectItem value="all">TODOS</SelectItem>
                            <SelectItem value="Concluido">CONCLUIDO</SelectItem>
                            <SelectItem value="En proceso">EN PROCESO</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-1 relative group">
                      <Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Búsqueda rápida</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                        <Input placeholder="CCT O ESCUELA..." className="h-9 pl-9 rounded-xl bg-slate-50 border-none shadow-inner text-xs font-bold uppercase focus:bg-white transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                      </div>
                   </div>
                </div>
                <div className="flex gap-2">
                   <Button className="h-9 px-6 bg-[#0b4135] hover:bg-[#082e26] text-white rounded-xl text-[10px] font-black uppercase shadow-lg">Buscar</Button>
                   <Button variant="ghost" className="h-9 px-6 rounded-xl text-[10px] font-black uppercase text-slate-400" onClick={() => { setSearchTerm(''); setMunicipioFilter('all'); setEstatusFilter('all'); }}>Limpiar</Button>
                </div>
             </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
             <Card className="lg:col-span-8 border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                <div className="p-6 border-b flex items-center justify-between"><h3 className="text-sm font-black uppercase text-slate-800 tracking-widest">Fases del Proyecto por CCT</h3><Badge className="bg-primary/5 text-primary border-none font-black text-[9px] px-3">{filteredRecords.length} Planteles Encontrados</Badge></div>
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
                            <TableHead className="text-right pr-8 text-[9px] font-black uppercase">Acción</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {filteredRecords.map((rec, i) => {
                            const currentFase = BIBLIOTECA_FASES_LABELS.find(f => f.progress >= rec.progress) || BIBLIOTECA_FASES_LABELS[0];
                            return (
                               <TableRow key={rec.id || i} className={cn("h-16 border-b border-slate-50 hover:bg-slate-50/50 transition-all cursor-pointer", selectedLibCct === rec.cct && "bg-blue-50/30")} onClick={() => setSelectedLibCct(rec.cct)}>
                                  <TableCell className="pl-8 font-mono font-black text-[10px] text-primary">{rec.cct}</TableCell>
                                  <TableCell className="font-bold text-[11px] text-slate-700 uppercase truncate max-w-[150px]">{rec.schoolName}</TableCell>
                                  <TableCell className="text-[9px] font-black text-slate-400 uppercase">{rec.municipio}</TableCell>
                                  <TableCell>
                                     <div className={cn("px-3 py-1 rounded-lg border text-[8px] font-black uppercase w-fit leading-tight", currentFase.color)}>
                                        {currentFase.label.split('.')[0]}<br/>
                                        <span className="opacity-70 text-[7px]">{currentFase.label.split('.')[1]}</span>
                                     </div>
                                  </TableCell>
                                  <TableCell>
                                     <div className="flex items-center gap-3 min-w-[100px]">
                                        <Progress value={rec.progress} className={cn("h-1.5 flex-1 rounded-full", rec.progress >= 100 ? "bg-emerald-100" : rec.progress >= 50 ? "bg-blue-100" : "bg-orange-100")} />
                                        <span className="text-[10px] font-black text-slate-600">{rec.progress}%</span>
                                     </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                     <Badge className={cn("text-[8px] font-black border-none uppercase px-3 h-5 rounded-full shadow-sm", rec.progress === 100 ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}>
                                        {rec.progress === 100 ? 'Concluido' : 'En proceso'}
                                     </Badge>
                                  </TableCell>
                                  <TableCell className="text-right pr-6">
                                     <div className="flex justify-end gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(rec); }} className="h-8 w-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary/5 transition-all"><Pencil className="h-4 w-4" /></button>
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
                      <div className="h-10 w-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner"><ClipboardCheck className="h-6 w-6" /></div>
                      <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest leading-none">Detalle de Fases</h3>
                   </div>
                   <div className="space-y-1.5">
                      <Label className="text-[8px] font-black uppercase text-slate-400 pl-1">CCT:</Label>
                      <Select value={selectedLibCct || ''} onValueChange={setSelectedLibCct}>
                         <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none shadow-inner text-[10px] font-bold uppercase"><SelectValue placeholder="SELECCIONAR PLANTEL..." /></SelectTrigger>
                         <SelectContent className="rounded-2xl max-h-[300px]">
                            {libData.libRecs.map(r => (
                              <SelectItem key={r.cct} value={r.cct} className="text-[10px] font-bold uppercase">{r.cct} - {r.schoolName}</SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                   </div>
                </div>
                <div className="flex-1 overflow-hidden">
                   <ScrollArea className="h-full">
                      <div className="p-8 space-y-6">
                         {BIBLIOTECA_FASES_LABELS.map((fase, i) => {
                            const isCompleted = selectedLibRecord ? (selectedLibRecord.progress >= fase.progress) : false;
                            const isActive = selectedLibRecord ? (selectedLibRecord.progress < fase.progress && (i === 0 || selectedLibRecord.progress >= BIBLIOTECA_FASES_LABELS[i-1].progress)) : false;
                            
                            return (
                               <div key={fase.id} className="flex gap-4 relative group">
                                  {i !== BIBLIOTECA_FASES_LABELS.length - 1 && (
                                    <div className={cn("absolute left-4 top-8 w-0.5 h-12 transition-colors", isCompleted ? "bg-emerald-50" : "bg-slate-100")} />
                                  )}
                                  <div className={cn(
                                    "h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-all duration-500", 
                                    isCompleted ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200" : 
                                    isActive ? "bg-white border-primary text-primary shadow-lg shadow-primary/10 scale-110" :
                                    "bg-white border-slate-200 text-slate-300"
                                  )}>
                                     {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-[10px] font-black">{i + 1}</span>}
                                  </div>
                                  <div className={cn(
                                    "flex-1 p-3 rounded-2xl border transition-all duration-300",
                                    isCompleted ? "bg-emerald-50/30 border-emerald-100" : 
                                    isActive ? "bg-primary/5 border-primary/20 shadow-md" : 
                                    "bg-white border-slate-100 opacity-50"
                                  )}>
                                     <p className={cn("text-[10px] font-black uppercase leading-tight", isCompleted ? "text-emerald-700" : isActive ? "text-primary" : "text-slate-400")}>{fase.label}</p>
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                   </ScrollArea>
                </div>
             </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-10">
             <Card className="lg:col-span-4 border-none shadow-xl rounded-[2.5rem] bg-white p-8 space-y-6">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner"><Activity className="h-6 w-6" /></div>
                   <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest">Visitas por día</h3>
                </div>
                <div className="h-[240px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={VISIT_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                         <defs>
                            <linearGradient id="colorVisits" x1="0" x2="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#0052cc" stopOpacity={0.1}/>
                               <stop offset="95%" stopColor="#0052cc" stopOpacity={0}/>
                            </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                         <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                         <RechartsTooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                         <Area type="monotone" dataKey="visits" stroke="#0052cc" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" dot={{ r: 4, fill: '#0052cc', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </Card>

             <Card className="lg:col-span-4 border-none shadow-xl rounded-[2.5rem] bg-white p-8 space-y-6">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner"><PieChartIcon className="h-6 w-6" /></div>
                   <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest">Estatus del Proyecto</h3>
                </div>
                <div className="h-[240px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {statusPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                         </Pie>
                         <RechartsTooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                         <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', paddingLeft: '20px' }} />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
             </Card>

             <Card className="lg:col-span-4 border-none shadow-xl rounded-[2.5rem] bg-white p-8 space-y-6 flex flex-col overflow-hidden">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-inner"><ImageIcon className="h-6 w-6" /></div>
                   <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest">Evidencias recientes</h3>
                </div>
                <div className="grid grid-cols-3 gap-3 flex-1">
                   {libData.libRecs.filter(r => r.evidencePhotos && r.evidencePhotos.length > 0).slice(0, 3).map((r, idx) => (
                     <div key={`recent-ev-${idx}`} className="space-y-2 group">
                        <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-slate-50 shadow-sm transition-all group-hover:scale-[1.05] group-hover:shadow-lg">
                           <Image src={r.evidencePhotos![0]} alt="Evidencia" fill className="object-cover" />
                        </div>
                        <p className="text-[8px] font-black text-slate-700 uppercase leading-none truncate">{r.schoolName}</p>
                     </div>
                   ))}
                </div>
             </Card>
          </div>
        </div>
        </ScrollArea>
      ) : activeTab === 'Geoposición' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in slide-in-from-bottom-4 duration-500 w-full min-h-[700px]">
           <div className="lg:col-span-7 flex flex-col space-y-4 h-full min-h-[600px]">
              <div className="flex-1 rounded-3xl border border-slate-200 shadow-2xl overflow-hidden relative group bg-slate-100">
                 <Image src="https://picsum.photos/seed/toluca-map-2026/1200/900" alt="Mapa Institucional" fill className="object-cover opacity-80" />
                 <div className="absolute top-6 left-6 flex flex-col gap-3 z-30">
                    <Button size="icon" className="h-12 w-12 bg-white text-primary rounded-2xl shadow-2xl border-4 border-white hover:scale-110 transition-transform"><LocateFixed className="h-6 w-6" /></Button>
                 </div>
                 <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center group/marker">
                    <div className="bg-white px-4 py-2 rounded-2xl shadow-2xl border border-slate-100 mb-2 flex items-center gap-3 animate-bounce shadow-primary/20">
                       <div className="space-y-0.5">
                          <p className="text-[10px] font-black text-slate-800 uppercase leading-none">Dispositivo: COEES-001</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Sincronizado hoy</p>
                       </div>
                    </div>
                    <div className="relative">
                       <div className="h-6 w-6 rounded-full bg-blue-500/20 animate-ping absolute inset-0" />
                       <MapPin className="h-10 w-10 text-emerald-500 fill-current drop-shadow-2xl relative z-10" />
                    </div>
                 </div>
                 <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md p-4 rounded-[1.8rem] shadow-2xl border z-30 flex flex-wrap gap-6 items-center">
                    {[ { label: 'En línea', color: 'bg-emerald-500' }, { label: 'En movimiento', color: 'bg-blue-500' }, { label: 'Sin señal', color: 'bg-rose-500' } ].map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                         <div className={cn("h-3 w-3 rounded-full", item.color)} />
                         <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{item.label}</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
           <div className="lg:col-span-5 space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 space-y-6 shrink-0 border-t-4 border-t-primary">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner"><Navigation className="h-7 w-7" /></div>
                  <h3 className="text-xl font-black text-slate-800 leading-none uppercase">Capturar Ubicación</h3>
                </div>
                <div className="space-y-5">
                   <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-500 uppercase ml-1">CCT *</Label><Input placeholder="Ej. 15DES0001R" className="h-11 rounded-xl bg-slate-50 border-slate-100 font-mono font-black uppercase text-primary text-sm shadow-inner" value={dialogSearchTerm} onChange={e => { setDialogSearchTerm(e.target.value); handleCctChange(e.target.value); }} /></div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Latitud *</Label><Input placeholder="Ej. 19.6289" className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold text-xs" value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} /></div>
                      <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Longitud *</Label><Input placeholder="Ej. -99.3128" className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold text-xs" value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} /></div>
                   </div>
                   <div className="grid grid-cols-2 gap-4 pt-2">
                      <Button onClick={handleSave} disabled={isSaving || !formData.cct} className="btn-institutional h-11 rounded-xl text-[10px] gap-2 shadow-xl bg-blue-600 hover:bg-blue-700">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} GUARDAR</Button>
                      <Button variant="outline" onClick={resetForm} className="h-11 px-6 rounded-xl border-slate-200 text-slate-500 font-black text-[10px] gap-2 uppercase hover:bg-slate-100 shadow-sm"><RefreshCw className="h-4 w-4" /> LIMPIAR</Button>
                   </div>
                   <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-3 shadow-inner">
                      <div className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg"><Info className="h-4 w-4" /></div>
                      <div className="space-y-0.5">
                         <h5 className="text-[10px] font-black text-blue-800 uppercase">Información</h5>
                         <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed">Asegúrate de ingresar el CCT y las coordenadas en formato decimal (latitud y longitud) para registrar correctamente la ubicación de la escuela.</p>
                      </div>
                   </div>
                </div>
              </Card>
              <Card className="flex-1 rounded-[2.5rem] border-none shadow-xl bg-white flex flex-col overflow-hidden">
                <div className="p-6 border-b flex items-center gap-3 bg-slate-50/50"><History className="h-5 w-5 text-slate-600" /><h4 className="text-sm font-black text-slate-700 uppercase tracking-widest">Últimas ubicaciones</h4></div>
                <div className="flex-1 overflow-hidden"><ScrollArea className="h-full"><Table><TableHeader className="bg-slate-50/50 sticky top-0 z-10 border-b"><TableRow className="h-10"><TableHead className="pl-6 text-[9px] font-black uppercase text-slate-400">Fecha</TableHead><TableHead className="text-[9px] font-black uppercase text-slate-400">CCT</TableHead><TableHead className="text-[9px] font-black uppercase text-slate-400 text-center">Estatus</TableHead><TableHead className="text-right pr-8 text-[9px] font-black uppercase text-slate-400">Acción</TableHead></TableRow></TableHeader><TableBody>{records.filter(r => r.name === 'Geoposición').map((rec, idx) => (<TableRow key={rec.id || idx} className="h-14 border-b border-slate-50 hover:bg-slate-50 transition-colors"><TableCell className="pl-6 font-bold text-[10px] text-slate-500">{rec.date}</TableCell><TableCell className="font-mono text-[10px] font-black text-slate-700">{rec.cct}</TableCell><TableCell className="text-center"><Badge className="bg-emerald-50 text-emerald-700 border-none text-[8px] font-black px-2 h-5 rounded-full uppercase">En línea</Badge></TableCell><TableCell className="text-right pr-6"><div className="flex justify-end gap-1"><button onClick={() => handleEdit(rec)} className="h-7 w-7 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-all"><Eye className="h-4 w-4" /></button><button onClick={() => handleDelete(rec.id!)} className="h-7 w-7 rounded-lg flex items-center justify-center text-rose-300 hover:text-rose-600 transition-all"><Trash2 className="h-4 w-4" /></button></div></TableCell></TableRow>))}</TableBody></Table></ScrollArea></div>
              </Card>
           </div>
        </div>
      ) : activeTab === 'Conoce mi Escuela' ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 w-full min-h-[800px]">
           <Card className="rounded-[1.5rem] border-none shadow-lg bg-white p-4">
              <div className="flex flex-col lg:flex-row items-end gap-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 w-full">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Buscar por:</Label><Select defaultValue="CCT"><SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none shadow-inner text-xs font-bold"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="CCT">CCT</SelectItem><SelectItem value="Nombre">Nombre de la escuela</SelectItem></SelectContent></Select></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Identificador:</Label><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-300" /><Input placeholder="Ej. 15DES0001R" className="h-10 pl-9 rounded-xl bg-slate-50 border-none shadow-inner text-xs font-bold uppercase" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div></div>
                 </div>
                 <Button className="bg-[#0052cc] hover:bg-[#0047b3] text-white h-10 px-10 rounded-xl text-xs font-black uppercase shadow-lg gap-2 shrink-0"><Search className="h-4 w-4" /> Buscar</Button>
              </div>
           </Card>
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                 <Card className="rounded-[1.5rem] border-none shadow-xl bg-white overflow-hidden flex flex-col h-[450px]">
                    <div className="flex-1 relative bg-slate-100">
                       <Image src="https://picsum.photos/seed/toluca-conoce/1200/900" alt="Mapa Conoce mi Escuela" fill className="object-cover opacity-80" />
                       <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center">
                          <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 mb-2 min-w-[220px] animate-in zoom-in-95">
                             <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-black text-primary uppercase">CCT: 15DES0001R</span><ChevronRight className="h-4 w-4 text-slate-300" /></div>
                             <p className="text-[11px] font-bold text-slate-700 uppercase leading-none">Escuela Secundaria Técnica No. 15</p>
                          </div>
                          <div className="relative"><div className="h-8 w-8 rounded-full bg-blue-500/20 animate-ping absolute inset-0 -m-1" /><MapPin className="h-8 w-8 text-emerald-500 fill-current drop-shadow-2xl relative z-10" /></div>
                       </div>
                    </div>
                 </Card>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[ { label: 'Escuelas registradas', value: '0', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' }, { label: 'Directores / Responsables', value: '0', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' }, { label: 'Municipios', value: '0', icon: MapPin, color: 'text-orange-500', bg: 'bg-orange-50' }, { label: 'Datos actualizados', value: '0', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' } ].map((kpi, i) => (
                      <Card key={i} className="rounded-2xl border-none shadow-md bg-white p-5 flex flex-col items-center text-center gap-3">
                         <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner", kpi.bg, kpi.color)}><kpi.icon className="h-6 w-6" /></div>
                         <h4 className="text-2xl font-black text-slate-800 leading-none">{kpi.value}</h4>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight leading-tight">{kpi.label}</p>
                      </Card>
                    ))}
                 </div>
              </div>
              <div className="lg:col-span-4 space-y-6">
                 <Card className="rounded-[1.5rem] border-none shadow-xl bg-white p-8 space-y-6">
                    <div className="flex items-start gap-4">
                       <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner"><School className="h-7 w-7" /></div>
                       <h3 className="text-xl font-black text-slate-800 leading-none uppercase">Registrar Escuela</h3>
                    </div>
                    <div className="space-y-4">
                       <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-500 uppercase ml-1">CCT *</Label><Input placeholder="Ej. 15DES0001R" className="h-10 rounded-xl bg-slate-50 border-slate-100 font-mono font-black uppercase text-xs" value={formData.cct} onChange={e => handleCctChange(e.target.value)} /></div>
                       <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nombre de la escuela *</Label><Input placeholder="Ej. Escuela Secundaria..." className="h-10 rounded-xl bg-slate-50 border-slate-100 text-[10px] font-bold uppercase" value={formData.schoolName} onChange={e => setFormData({...formData, schoolName: e.target.value.toUpperCase()})} /></div>
                       <div className="grid grid-cols-2 gap-4 pt-4">
                          <Button onClick={handleSave} className="bg-[#0052cc] hover:bg-[#0047b3] text-white h-11 rounded-xl text-xs font-black uppercase shadow-lg gap-2"><Save className="h-4 w-4" /> Guardar</Button>
                          <Button variant="outline" onClick={resetForm} className="h-11 rounded-xl border-slate-200 text-slate-500 font-black text-[10px] gap-2 uppercase hover:bg-slate-100 shadow-sm"><RefreshCw className="h-4 w-4" /> Limpiar</Button>
                       </div>
                    </div>
                 </Card>
                 <Card className="rounded-[1.5rem] border-none shadow-lg bg-[#eef4ff] p-5 flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-[140px] aspect-square relative rounded-2xl overflow-hidden border-4 border-white shadow-xl shrink-0"><Image src="https://picsum.photos/seed/school-facade/400/400" alt="Fachada" fill className="object-cover" /></div>
                    <div className="flex-1 space-y-2.5">
                       <div className="flex gap-4"><span className="text-[9px] font-black text-slate-400 uppercase w-20">CCT:</span><span className="text-[10px] font-black text-primary font-mono">15DES0001R</span></div>
                       <div className="flex gap-4"><span className="text-[9px] font-black text-slate-400 uppercase w-20">Nombre:</span><span className="text-[10px] font-black text-slate-700 uppercase leading-none">Secundaria Técnica 15</span></div>
                    </div>
                 </Card>
              </div>
           </div>
        </div>
      ) : activeTab === 'ATRES' ? (
        <div className="flex-1 overflow-hidden bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col">
          <HelpDeskInterface />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500 w-full min-h-[600px]">
           <div className="lg:col-span-5 space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-10 space-y-8 h-full flex flex-col shadow-primary/5">
                 <div className="flex items-start gap-5">
                    <div className="h-14 w-14 rounded-3xl bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/30"><Mail className="h-8 w-8" /></div>
                    <div className="space-y-1">
                       <h3 className="text-2xl font-black text-slate-800 leading-none uppercase tracking-tighter">Registro Técnico</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Creación y Restructuración de Cuentas</p>
                    </div>
                 </div>
                 <div className="space-y-6 flex-1">
                    <div className="space-y-2"><Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Servidor Público (Responsable) *</Label><Input placeholder="NOMBRE COMPLETO..." className="h-12 rounded-xl bg-slate-50 border-slate-100 px-4 text-xs font-bold uppercase shadow-inner" value={formData.userName} onChange={e => setFormData({...formData, userName: e.target.value.toUpperCase()})} /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Departamento / Área *</Label><Input placeholder="NOMBRE DE LA OFICINA O ÁREA..." className="h-12 rounded-xl bg-slate-50 border-slate-100 px-4 text-xs font-bold uppercase shadow-inner" value={formData.departamento} onChange={e => setFormData({...formData, departamento: e.target.value.toUpperCase()})} /></div>
                    <div className="space-y-4 p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                       <Label className="text-[10px] font-black text-primary uppercase ml-1">Construcción del Correo Institucional</Label>
                       <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1 relative">
                             <Input placeholder="usuario..." className="h-11 rounded-xl bg-white border-slate-200 text-xs font-bold" value={userPart} onChange={e => setUserPart(e.target.value.toLowerCase())} />
                             <span className="absolute right-3 top-3.5 text-[10px] font-black text-slate-300">@</span>
                          </div>
                          <Select value={domainPart} onValueChange={setDomainPart}>
                             <SelectTrigger className="h-11 rounded-xl w-full sm:w-[180px] bg-white border-slate-200 text-[10px] font-black uppercase"><SelectValue /></SelectTrigger>
                             <SelectContent className="rounded-xl">{DOMINIOS.map(d => (<SelectItem key={d} value={d} className="text-[10px] font-black">{d}</SelectItem>))}</SelectContent>
                          </Select>
                       </div>
                       <div className="mt-4 p-4 bg-white rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-2">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Vista previa del correo:</span>
                          <span className="text-sm font-black text-primary lowercase tracking-tight">{fullEmailPreview || 'esperando datos...'}</span>
                       </div>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4 pt-4 shrink-0">
                    <Button onClick={handleSave} disabled={isSaving || !userPart} className="btn-institutional h-14 rounded-2xl text-[11px] gap-3 shadow-2xl">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5" />} GUARDAR</Button>
                    <Button variant="outline" onClick={resetForm} className="h-14 rounded-2xl border-slate-200 text-slate-500 font-black text-[11px] gap-2 uppercase hover:bg-slate-50"><RotateCcw className="h-4 w-4" /> LIMPIAR</Button>
                 </div>
              </Card>
           </div>
           <div className="lg:col-span-7 flex flex-col space-y-8">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 space-y-8 shrink-0 shadow-primary/5">
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner"><ShieldCheck className="h-7 w-7" /></div>
                    <div><h3 className="text-xl font-black text-slate-800 leading-none uppercase">Verificar existencia</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Validador Oficial de Correos en la Auditoría 2026</p></div>
                 </div>
                 <div className="flex gap-4">
                    <div className="relative flex-1 group">
                       <Search className="absolute left-4 top-4 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                       <Input placeholder="INGRESAR CORREO COMPLETO..." className="h-14 rounded-2xl bg-slate-50 border-none pl-12 text-sm font-bold shadow-inner focus:bg-white transition-all ring-1 ring-slate-100 focus:ring-emerald-500/20" value={verifyInput} onChange={e => setVerifyInput(e.target.value.toLowerCase())} onKeyDown={e => e.key === 'Enter' && handleVerifyAccount()} />
                    </div>
                    <Button onClick={handleVerifyAccount} disabled={isVerifying} className={cn("h-14 px-8 rounded-2xl font-black text-[11px] uppercase transition-all shadow-xl", isVerifying ? "bg-slate-200" : "bg-emerald-600 hover:bg-emerald-700 text-white")}>{isVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : "VALIDAR"}</Button>
                 </div>
                 {verifiedAccount && (
                   <div className="bg-emerald-50 p-6 rounded-[2.5rem] border-2 border-emerald-100 flex items-center gap-6 animate-in zoom-in-95 duration-500 shadow-sm">
                      <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-xl border border-emerald-100"><CheckCircle2 className="h-8 w-8" /></div>
                      <div className="flex-1 space-y-1">
                         <Badge className="bg-emerald-600 text-white border-none text-[8px] font-black uppercase mb-1">CUENTA ACTIVA</Badge>
                         <h4 className="text-xl font-black text-emerald-900 uppercase leading-none">{verifiedAccount.userName}</h4>
                         <p className="text-[10px] font-bold text-emerald-700/60 uppercase">{verifiedAccount.departamento} • Alta: {verifiedAccount.date}</p>
                      </div>
                      <div className="hidden sm:block text-right px-4 border-l border-emerald-100">
                         <span className="text-[10px] font-black text-emerald-800 uppercase block leading-none">Sistema Auditor</span>
                         <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Edoméx 2026</span>
                      </div>
                   </div>
                 )}
              </Card>
              <Card className="flex-1 rounded-[2.5rem] border-none shadow-xl bg-white flex flex-col overflow-hidden shadow-primary/5">
                 <div className="p-8 border-b flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner"><ClipboardList className="h-6 w-6" /></div>
                       <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest">Historial de registros</h4>
                    </div>
                 </div>
                 <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                       <Table>
                          <TableHeader className="bg-slate-50/50 sticky top-0 z-10 border-b">
                             <TableRow className="h-12">
                                <TableHead className="pl-8 text-[9px] font-black uppercase">Responsable / Servidor</TableHead>
                                <TableHead className="text-[9px] font-black uppercase">Correo Registrado</TableHead>
                                <TableHead className="text-[9px] font-black uppercase text-center">Estatus</TableHead>
                                <TableHead className="text-right pr-10 text-[9px] font-black uppercase">Acciones</TableHead>
                             </TableRow>
                          </TableHeader>
                          <TableBody>
                             {records.filter(r => r.name === 'Cuentas Institucionales').map((rec, idx) => (
                               <TableRow key={rec.id || idx} className="h-16 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                  <TableCell className="pl-8">
                                     <div className="flex flex-col">
                                        <span className="text-[11px] font-black text-slate-700 uppercase leading-none">{rec.userName}</span>
                                        <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase truncate max-w-[150px]">{rec.departamento}</span>
                                     </div>
                                  </TableCell>
                                  <TableCell className="font-mono text-[10px] font-bold text-primary">{rec.email}</TableCell>
                                  <TableCell className="text-center">
                                     <Badge variant="outline" className={cn("text-[8px] font-black px-3 h-5 rounded-full border-2 uppercase", rec.status === 'activo' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100")}>{rec.status}</Badge>
                                  </TableCell>
                                  <TableCell className="text-right pr-8">
                                     <div className="flex justify-end gap-1">
                                        <button onClick={() => { handleEdit(rec); }} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary transition-all"><Eye className="h-4 w-4" /></button>
                                        <button onClick={() => handleDelete(rec.id!)} className="h-8 w-8 rounded-lg flex items-center justify-center text-rose-300 hover:text-rose-600 transition-all"><Trash2 className="h-4 w-4" /></button>
                                     </div>
                                  </TableCell>
                               </TableRow>
                             ))}
                          </TableBody>
                       </Table>
                    </ScrollArea>
                 </div>
              </Card>
           </div>
        </div>
      )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!isSaving) { setIsDialogOpen(open); if(!open) resetForm(); } }}>
        <DialogContent className="w-[98vw] lg:max-w-[1200px] h-[92vh] rounded-[2.5rem] p-0 overflow-hidden bg-white flex flex-col border-none shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white shrink-0">
             <DialogTitle className="font-black text-2xl uppercase flex items-center gap-4"><Settings className="h-8 w-8 text-accent" /> Gestión Técnica: {activeTab}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="datos" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-8 border-b bg-slate-50/50 shrink-0">
              <TabsList className="bg-transparent h-14 p-0 gap-8">
                <TabsTrigger value="datos" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all focus-visible:outline-none">1. Datos del Proyecto</TabsTrigger>
                {activeTab === 'Biblioteca Digital' && (
                  <TabsTrigger value="asistentes" disabled={(formData.bibliotecaFases?.personalCapacitado || 0) <= 0} className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all disabled:opacity-30 focus-visible:outline-none">2. Lista de Asistentes</TabsTrigger>
                )}
              </TabsList>
            </div>
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-10 space-y-10 max-w-5xl mx-auto">
                  <TabsContent value="datos" className="m-0 space-y-10 focus-visible:outline-none">
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-primary/10 shadow-inner space-y-6">
                      <Label className="text-[11px] font-black text-primary uppercase pl-1">Identificación CCT</Label>
                      <div className="relative">
                        <Input placeholder="BUSCAR CCT..." className="h-14 w-full rounded-2xl bg-white border border-primary/20 font-bold text-xl uppercase shadow-lg pl-6" value={dialogSearchTerm} onChange={(e) => { setDialogSearchTerm(e.target.value); handleCctChange(e.target.value); setShowSearchResults(true); }} />
                        {showSearchResults && dialogSearchTerm.length > 2 && (
                          <div className="absolute top-18 left-0 right-0 max-h-60 overflow-auto bg-white border rounded-2xl shadow-2xl z-[100] divide-y">
                            {schoolSearchResults.map((s, sidx) => (
                              <div key={sidx} className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center group" onClick={() => handleCctChange(s.cct)}>
                                <div className="flex flex-col"><span className="text-sm font-bold uppercase truncate group-hover:text-primary">{s.nombre}</span><span className="text-[10px] font-mono text-muted-foreground">{s.cct}</span></div>
                                <ChevronRight className="h-5 w-5 text-slate-300" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {activeTab === 'Biblioteca Digital' && (
                       <div className="space-y-10">
                          <div className="grid grid-cols-2 gap-8 bg-slate-50 p-6 rounded-3xl border border-primary/5 shadow-inner">
                             <div className="space-y-2"><Label className="text-[11px] font-black text-primary uppercase pl-2"># Equipos Habilitados</Label><Input type="number" className="h-14 font-black text-2xl text-center bg-white border-2 border-primary/10 rounded-2xl" value={formData.bibliotecaFases?.equiposHabilitados || 0} onChange={e => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, equiposHabilitados: parseInt(e.target.value) || 0}})} /></div>
                             <div className="space-y-2"><Label className="text-[11px] font-black text-primary uppercase pl-2"># Personal Capacitado</Label><Input type="number" className="h-14 font-black text-2xl text-center bg-white border-2 border-primary/10 rounded-2xl" value={formData.bibliotecaFases?.personalCapacitado || 0} onChange={e => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, personalCapacitado: parseInt(e.target.value) || 0}})} /></div>
                          </div>
                          <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                             <h4 className="text-[11px] font-black text-primary uppercase flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Fases del Proyecto</h4>
                             <div className="grid grid-cols-2 gap-4">
                                {BIBLIOTECA_FASES_LABELS.map(f => (
                                  <div key={f.id} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200">
                                     <Checkbox checked={(formData.bibliotecaFases as any)?.[f.id]} onCheckedChange={(val) => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, [f.id]: !!val}})} id={`check-${f.id}`} />
                                     <Label htmlFor={`check-${f.id}`} className="text-[9px] font-bold text-slate-600 uppercase cursor-pointer">{f.label}</Label>
                                  </div>
                                ))}
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-primary/5">
                             <div className="p-8 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-4 relative group">
                                {formData.reportPdf ? (
                                  <div className="flex flex-col items-center gap-3"><FileText className="h-10 w-10 text-emerald-600" /><p className="text-[10px] font-black uppercase text-emerald-700">REPORTE CARGADO (PDF)</p><Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8 text-rose-500 rounded-full" onClick={() => setFormData(prev => ({...prev, reportPdf: ''}))}><X className="h-4 w-4" /></Button></div>
                                ) : (
                                  <><Upload className="h-10 w-10 text-slate-300" /><div className="text-center"><p className="text-[10px] font-black uppercase text-slate-700">Subir Formato PDF</p></div><Button variant="outline" size="sm" onClick={() => pdfInputRef.current?.click()} className="h-9 px-6 rounded-xl text-[9px] font-black uppercase border-primary/20">Seleccionar</Button></>
                                )}
                                <input type="file" accept=".pdf" className="hidden" ref={pdfInputRef} onChange={(e) => handleFileChange(e, 'pdf')} />
                             </div>
                             <div className="p-8 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-4 relative group">
                                <ImageIcon className="h-10 w-10 text-slate-300" /><p className="text-[10px] font-black uppercase text-slate-700">Evidencias Fotográficas</p>
                                <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} className="h-9 px-6 rounded-xl text-[9px] font-black uppercase border-primary/20">Añadir Imagen</Button>
                                <input type="file" accept="image/*" className="hidden" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} />
                                <div className="grid grid-cols-4 gap-3 mt-4 w-full">
                                   {(formData.evidencePhotos || []).map((img, idx) => (<div key={idx} className="relative aspect-square rounded-xl overflow-hidden border-2 border-white shadow-md group"><Image src={img} alt={`Evidencia ${idx}`} fill className="object-cover" /><button onClick={() => setFormData(prev => ({...prev, evidencePhotos: prev.evidencePhotos?.filter((_, i) => i !== idx)}))} className="absolute top-1 right-1 h-5 w-5 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button></div>))}
                                </div>
                             </div>
                          </div>
                       </div>
                    )}
                    <div className="space-y-2 pt-4">
                       <Label className="text-[10px] font-black text-slate-400 pl-1 uppercase">Observaciones Operativas</Label>
                       <Textarea value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value.toUpperCase()})} className="min-h-[100px] bg-slate-50 border-none rounded-2xl p-6 font-bold uppercase shadow-inner" />
                    </div>
                  </TabsContent>
                  <TabsContent value="asistentes" className="m-0 focus-visible:outline-none">
                    <div className="space-y-6">
                       <div className="flex justify-between items-center"><div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4"><CheckCircle2 className="h-6 w-6 text-blue-600" /><p className="text-[10px] font-black text-blue-800 uppercase leading-relaxed">Sincronización Maestra: El sistema jala automáticamente el Nombre C.T. desde la base oficial.</p></div><Button onClick={handleAddAssistant} className="gap-2 font-black uppercase text-[11px] h-12 px-8 shadow-md"><Plus className="h-5 w-5" /> Añadir Servidor Público</Button></div>
                       <div className="border-2 border-slate-100 rounded-[2rem] shadow-2xl bg-white overflow-hidden"><Table><TableHeader className="bg-slate-50"><TableRow><TableHead className="w-12 text-[10px] font-black uppercase text-center">#</TableHead><TableHead className="w-[280px] text-[10px] font-black uppercase">Apellidos y Nombre(s)</TableHead><TableHead className="w-[140px] text-[10px] font-black uppercase">RFC Oficial</TableHead><TableHead className="w-[180px] text-[10px] font-black uppercase">Función</TableHead><TableHead className="w-[130px] text-[10px] font-black uppercase">CCT Origen</TableHead><TableHead className="w-[200px] text-[10px] font-black uppercase">Plantel</TableHead><TableHead className="w-16"></TableHead></TableRow></TableHeader><TableBody>{asistentes.map((ast, idx) => (<TableRow key={idx} className="hover:bg-slate-50"><TableCell className="text-center font-black text-xs text-muted-foreground">{idx + 1}</TableCell><TableCell className="p-2"><div className="grid grid-cols-1 gap-1"><Input placeholder="PATERNO" className="h-8 text-[9px] uppercase" value={ast.paterno} onChange={e => updateAssistant(idx, 'paterno', e.target.value)} /><Input placeholder="MATERNO" className="h-8 text-[9px] uppercase" value={ast.materno} onChange={e => updateAssistant(idx, 'materno', e.target.value)} /><Input placeholder="NOMBRE(S)" className="h-8 text-[10px] uppercase font-black text-primary border-primary/20 bg-primary/5" value={ast.nombres} onChange={e => updateAssistant(idx, 'nombres', e.target.value)} /></div></TableCell><TableCell className="p-2"><Input placeholder="13 DÍGITOS" className="h-9 text-[11px] font-mono uppercase font-black" value={ast.rfc} onChange={e => updateAssistant(idx, 'rfc', e.target.value)} maxLength={13} /></TableCell><TableCell className="p-2"><Select value={ast.funcion} onValueChange={(v) => updateAssistant(idx, 'funcion', v)}><SelectTrigger className="h-9 text-[9px] font-bold uppercase"><SelectValue placeholder="FUNCIÓN..." /></SelectTrigger><SelectContent>{FUNCIONES.map(f => (<SelectItem key={f} value={f} className="text-[10px] font-bold uppercase">{f}</SelectItem>))}</SelectContent></Select></TableCell><TableCell className="p-2"><Input placeholder="15DES0000X" className="h-9 text-[11px] font-mono font-black uppercase" value={ast.cct} onChange={e => updateAssistant(idx, 'cct', e.target.value)} maxLength={10} /></TableCell><TableCell className="p-2"><Input value={ast.nombreCT} readOnly className="h-9 text-[10px] bg-slate-100 border-none font-black uppercase text-slate-600 truncate" /></TableCell><TableCell className="p-2 text-center"><Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600" onClick={() => handleRemoveAssistant(idx)} disabled={asistentes.length === 1}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>))}</TableBody></Table></div>
                    </div>
                  </TabsContent>
                </div>
              </ScrollArea>
            </div>
          </Tabs>
          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4 shrink-0 shadow-inner"><Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSaving} className="h-12 px-8 rounded-xl font-bold text-xs uppercase">Cancelar</Button><Button onClick={handleSave} disabled={isSaving} className="btn-institutional h-12 px-16 text-xs gap-3 rounded-xl shadow-2xl">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5" />} GUARDAR</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
