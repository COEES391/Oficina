
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
  WifiOff
} from "lucide-react"
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
  writeBatch
} from 'firebase/firestore'
import { type ProgramStatus } from '@/lib/planning-data'
import { format } from 'date-fns'

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

const FILE_SIZE_LIMIT = 2 * 1024 * 1024;

const BIBLIOTECA_FASES_LABELS = [
  { id: 'fase1', label: 'Fase 1. Solicitud de instalación de biblioteca digital', color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { id: 'fase2', label: 'Fase 2. Atención al CCT', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  { id: 'fase3', label: 'Fase 3. Diagnóstico del equipo de cómputo existente', color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { id: 'fase4', label: 'Fase 4. Instalación total de los contenidos del proyecto', color: 'text-amber-600 bg-amber-50 border-amber-100' },
  { id: 'fase5', label: 'Fase 5. Funcionalidad (pruebas de uso y manejo)', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { id: 'fase5_guia', label: 'Fase 5.- Guía orientación de uso y manejo de la herramienta', color: 'text-purple-600 bg-purple-50 border-purple-100' },
  { id: 'fase6', label: 'Fase 6.- Envió vía correo al CCT el formulario de seguimiento', color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
  { id: 'fase7', label: 'Fase 7.- Seguimiento técnico al CCT', color: 'text-orange-600 bg-orange-50 border-orange-100' },
  { id: 'fase8', label: 'Fase 8- Total de personal capacitado', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { id: 'fase9', label: 'Fase 9.- Total de equipos habilitados', color: 'text-blue-600 bg-blue-50 border-blue-100' }
];

const FUNCIONES = [
  "PAAE",
  "DOCENTE",
  "DIRECTIVO",
  "JEFE DE ENSEÑANZA",
  "SUPERVISOR",
  "ASESOR TECNICO PEDAGOGICO"
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
  
  // States for Cuentas Institucionales
  const [verifyInput, setVerifyInput] = useState('')
  const [verifiedAccount, setVerifiedAccount] = useState<ProgramStatus | null>(null)
  const [userPart, setUserPart] = useState('')
  const [domainPart, setDomainPart] = useState(DOMINIOS[0])
  
  const [selectedBibliotecaRecord, setSelectedBibliotecaRecord] = useState<ProgramStatus | null>(null)

  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([])
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddForm, setQuickAddForm] = useState<SchoolInfo>({
    region: '', valle: 'MEXICO', municipio: '', subsistema: 'FEDERALIZADO', control: 'OFICIAL',
    nivel: 'SECUNDARIA', servicioEducativo: 'SECUNDARIA GENERAL', cct: '', turno: 'MATUTINO',
    nombre: '', domicilio: '', localidad: '', telefono: '', zonaEscolar: '', sector: '',
    director: '', hombres: 0, mujeres: 0, alumnos: 0, grupos: 0, maestros: 0, administrativos: 0,
    aulasExistentes: 0, aulasEnUso: 0, modalidad: 'DES'
  })

  const [asistentesLib, setAsistentesLib] = useState<any[]>([
    { rfc: '', nombres: '', paterno: '', materno: '', funcion: '', email: '', cct: '', schoolName: '' }
  ])

  const pdfInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const initialFormState: ProgramStatus = {
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
  }

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
      if (libRecs.length > 0 && !selectedBibliotecaRecord) {
        setSelectedBibliotecaRecord(libRecs[0]);
      }
    }, (error) => {
      console.error("Firestore error:", error)
      setIsLoading(false)
    })

    const storedSchools = JSON.parse(localStorage.getItem('schools_master_full_v21') || '[]')
    setAllSchools(storedSchools.length > 0 ? storedSchools : schoolsDirectory)

    return () => { unsubscribe(); }
  }, [selectedBibliotecaRecord, toast])

  const handleVerifyAccount = async () => {
    const searchVal = verifyInput.trim().toLowerCase();
    if (!searchVal.includes('@')) {
      toast({ variant: "destructive", title: "Formato inválido", description: "Ingrese un correo completo institucional." });
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      const match = records.find(r => r.name === 'Cuentas Institucionales' && r.email?.toLowerCase() === searchVal);
      if (match) {
        setVerifiedAccount(match);
        toast({ title: "Cuenta Localizada", description: "Se ha encontrado el registro." });
      } else {
        setVerifiedAccount(null);
        toast({ variant: "destructive", title: "Sin Registro", description: "El correo no se encuentra en el sistema." });
      }
      setIsVerifying(false);
    }, 600);
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
      valle: quickAddForm.valle.toUpperCase(),
      region: quickAddForm.region.toUpperCase(),
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

  const statsBiblioteca = useMemo(() => {
    const libRecs = records.filter(r => r.name === 'Biblioteca Digital');
    const evidencias = libRecs.reduce((acc, r) => acc + (r.evidencePhotos?.length || 0) + (r.reportPdf ? 1 : 0), 0);
    return { totalCct: libRecs.length, concluidos: libRecs.filter(r => r.progress === 100).length, personalTotal: libRecs.reduce((acc, r) => acc + (r.asistentes?.length || 0), 0), evidenciasTotal: evidencias };
  }, [records]);

  const fullEmailPreview = useMemo(() => {
    if (!userPart) return '';
    return `${userPart.toLowerCase().trim()}${domainPart}`;
  }, [userPart, domainPart]);

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

  const handleSave = async () => {
    const currentCct = (formData.cct || dialogSearchTerm || '').toUpperCase().trim();
    if (!currentCct && activeTab !== 'Conoce mi Escuela' && activeTab !== 'Cuentas Institucionales') {
      toast({ variant: "destructive", title: "CCT Requerido" });
      return;
    }

    setIsSaving(true);
    try {
      const finalData: Record<string, any> = {
        name: String(activeTab),
        cct: String(currentCct),
        schoolName: String(formData.schoolName || 'PLANTEL EXTERNO'),
        municipio: String(formData.municipio || 'S/D'),
        valle: String(formData.valle || 'S/D'),
        status: String(formData.status || 'activo'),
        date: String(formData.date || new Date().toISOString().split('T')[0]),
        observaciones: String(formData.observaciones || ''),
        updatedAt: serverTimestamp()
      };

      if (activeTab === 'Cuentas Institucionales') {
        finalData.userName = String(formData.userName || 'S/R');
        finalData.departamento = String(formData.departamento || 'S/R');
        finalData.email = fullEmailPreview || formData.email || '';
      } 
      else if (activeTab === 'Biblioteca Digital') {
        finalData.bibliotecaFases = formData.bibliotecaFases || initialFormState.bibliotecaFases;
        finalData.asistentes = asistentesLib.filter(a => a.rfc && a.nombres);
      }
      else if (activeTab === 'Geoposición') {
        finalData.latitud = String(formData.latitud || '');
        finalData.longitud = String(formData.longitud || '');
      }

      if (editingId) {
        await updateDoc(doc(db, 'programs', editingId), finalData);
      } else {
        await addDoc(collection(db, 'programs'), finalData);
      }
      
      setIsDialogOpen(false);
      setEditingId(null);
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
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar registro?")) return;
    await deleteDoc(doc(db, 'programs', id));
    toast({ title: "Registro Removido" });
  }

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
          {!['ATRES', 'Geoposición', 'Conoce mi Escuela', 'Cuentas Institucionales'].includes(activeTab) && (
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="btn-institutional h-10 px-6 rounded-xl text-[10px] font-bold shadow-lg uppercase">
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

      {activeTab === 'ATRES' ? (
        <div className="h-[calc(100vh-220px)] w-full overflow-hidden border border-slate-200 rounded-[3rem] shadow-2xl bg-white">
           <HelpDeskInterface />
        </div>
      ) : activeTab === 'Geoposición' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500 w-full h-[calc(100vh-220px)] min-h-[650px]">
           {/* LADO IZQUIERDO: MAPA DE ALTA FIDELIDAD */}
           <div className="lg:col-span-7 flex flex-col h-full space-y-4">
              <Card className="flex-1 rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden relative group">
                 <Image src="https://picsum.photos/seed/mapa-toluca-2026/1200/900" alt="Mapa Institucional" fill className="object-cover" />
                 
                 {/* Controles de Mapa Flotantes */}
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

                 {/* Marcadores de Prueba Simulares */}
                 <div className="absolute top-[35%] left-[40%] group/pin cursor-pointer z-10">
                    <div className="h-10 w-10 bg-emerald-500 rounded-full border-4 border-white shadow-2xl flex items-center justify-center animate-bounce">
                       <Circle className="h-2 w-2 fill-white text-white" />
                    </div>
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white min-w-[220px] opacity-0 group-hover/pin:opacity-100 transition-all pointer-events-none">
                       <p className="text-[10px] font-black text-slate-800 uppercase leading-none">Dispositivo: COEES-001</p>
                       <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Última ubicación: 15/04/2025 10:24</p>
                       <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          <span className="text-[8px] font-black text-emerald-600 uppercase">Estado: En línea</span>
                       </div>
                    </div>
                 </div>

                 <div className="absolute top-[45%] left-[60%] z-10">
                    <div className="h-8 w-8 bg-slate-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center opacity-70">
                       <Circle className="h-1.5 w-1.5 fill-white text-white" />
                    </div>
                 </div>

                 <div className="absolute top-[60%] left-[50%] z-10">
                    <div className="h-9 w-9 bg-blue-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center">
                       <Navigation2 className="h-4 w-4 text-white fill-current" />
                    </div>
                 </div>

                 {/* Leyenda del Mapa */}
                 <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-[1.5rem] shadow-2xl border border-white z-10 flex gap-6">
                    <div className="flex items-center gap-2">
                       <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
                       <span className="text-[9px] font-black text-slate-600 uppercase">En línea</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="h-3 w-3 rounded-full bg-blue-500 shadow-sm shadow-blue-200" />
                       <span className="text-[9px] font-black text-slate-600 uppercase">En movimiento</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="h-3 w-3 rounded-full bg-rose-500 shadow-sm shadow-rose-200" />
                       <span className="text-[9px] font-black text-slate-600 uppercase">Sin señal</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="h-3 w-3 rounded-full bg-slate-500 shadow-sm shadow-slate-200" />
                       <span className="text-[9px] font-black text-slate-600 uppercase">Desconectado</span>
                    </div>
                 </div>
              </Card>
           </div>

           {/* LADO DERECHO: FORMULARIO Y BITÁCORA */}
           <div className="lg:col-span-5 flex flex-col h-full space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 space-y-6 shrink-0">
                 <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                       <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-800 uppercase leading-none tracking-tighter">Registrar coordenadas de ubicación</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Ingresa el CCT y las coordenadas para registrar la ubicación de la escuela.</p>
                    </div>
                 </div>

                 <div className="space-y-5 pt-2">
                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-black text-slate-500 uppercase pl-1">CCT *</Label>
                       <div className="relative">
                          <School className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
                          <Input placeholder="Ej. 15DES0001R" className="h-12 rounded-xl bg-slate-50 border-slate-100 pl-12 text-sm font-bold uppercase" value={dialogSearchTerm} onChange={e => { setDialogSearchTerm(e.target.value); handleCctChange(e.target.value); setShowSearchResults(true); }} />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-1.5">
                          <Label className="text-[10px] font-black text-slate-500 uppercase pl-1">Latitud *</Label>
                          <div className="relative">
                             <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
                             <Input placeholder="Ej. 19.6289" className="h-12 rounded-xl bg-slate-50 border-slate-100 pl-12 text-sm font-bold" value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} />
                          </div>
                       </div>
                       <div className="space-y-1.5">
                          <Label className="text-[10px] font-black text-slate-500 uppercase pl-1">Longitud *</Label>
                          <div className="relative">
                             <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
                             <Input placeholder="Ej. -99.3128" className="h-12 rounded-xl bg-slate-50 border-slate-100 pl-12 text-sm font-bold" value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} />
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                       <Button onClick={handleSave} disabled={isSaving} className="flex-1 btn-institutional h-12 rounded-xl text-[11px] gap-3 shadow-xl">
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5" />} GUARDAR UBICACIÓN
                       </Button>
                       <Button variant="outline" onClick={resetForm} className="flex-1 h-12 rounded-xl border-slate-200 text-slate-500 font-black text-[11px] gap-2 uppercase">
                          <RotateCcw className="h-4 w-4" /> LIMPIAR
                       </Button>
                    </div>

                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-4">
                       <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                       <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed">Asegúrate de ingresar el CCT y las coordenadas en formato decimal (latitud y longitud) para registrar correctamente la ubicación de la escuela.</p>
                    </div>
                 </div>
              </Card>

              <Card className="flex-1 rounded-[2.5rem] border-none shadow-xl bg-white flex flex-col overflow-hidden">
                 <div className="p-6 border-b flex items-center gap-3">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest">Últimas ubicaciones registradas</h4>
                 </div>
                 <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                       <Table>
                          <TableHeader className="bg-slate-50/50 sticky top-0 z-10 border-b">
                             <TableRow className="h-10">
                                <TableHead className="text-[9px] font-black uppercase text-slate-400 pl-6">Fecha y hora</TableHead>
                                <TableHead className="text-[9px] font-black uppercase text-slate-400">CCT</TableHead>
                                <TableHead className="text-[9px] font-black uppercase text-slate-400">Latitud</TableHead>
                                <TableHead className="text-[9px] font-black uppercase text-slate-400">Longitud</TableHead>
                                <TableHead className="text-[9px] font-black uppercase text-slate-400">Estado</TableHead>
                                <TableHead className="text-right pr-6 text-[9px] font-black uppercase text-slate-400">Acciones</TableHead>
                             </TableRow>
                          </TableHeader>
                          <TableBody>
                             {records.filter(r => r.name === 'Geoposición').map((rec, i) => (
                               <TableRow key={rec.id || i} className="h-12 border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                  <TableCell className="pl-6 text-[9px] font-bold text-slate-400">{rec.date}</TableCell>
                                  <TableCell className="font-mono font-black text-[10px] text-primary">{rec.cct}</TableCell>
                                  <TableCell className="text-[10px] font-bold text-slate-600">{rec.latitud}</TableCell>
                                  <TableCell className="text-[10px] font-bold text-slate-600">{rec.longitud}</TableCell>
                                  <TableCell>
                                     <Badge className={cn("text-[7px] font-black border-none uppercase h-4 px-1.5", 
                                        i === 0 ? "bg-emerald-100 text-emerald-700" : 
                                        i === 1 ? "bg-blue-100 text-blue-700" :
                                        i === 3 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700")}>
                                        {i === 0 ? 'En línea' : i === 1 ? 'En movimiento' : i === 3 ? 'Sin señal' : 'Desconectado'}
                                     </Badge>
                                  </TableCell>
                                  <TableCell className="text-right pr-6">
                                     <div className="flex justify-end gap-1">
                                        <button onClick={() => { setFormData({...rec}); setEditingId(rec.id!); setDialogSearchTerm(rec.cct); }} className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-primary transition-all"><Eye className="h-3.5 w-3.5" /></button>
                                        <button onClick={() => handleDelete(rec.id!)} className="h-7 w-7 flex items-center justify-center text-rose-300 hover:text-rose-600 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                                     </div>
                                  </TableCell>
                               </TableRow>
                             ))}
                             {records.filter(r => r.name === 'Geoposición').length === 0 && (
                               <TableRow><TableCell colSpan={6} className="text-center py-20 opacity-20 text-[10px] font-black uppercase">Sin registros operativos</TableCell></TableRow>
                             )}
                          </TableBody>
                       </Table>
                    </ScrollArea>
                 </div>
                 <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Mostrando 1 - 5 de {records.filter(r => r.name === 'Geoposición').length} registros</p>
                    <div className="flex items-center gap-1">
                       <Button size="icon" variant="outline" className="h-6 w-6 rounded-md p-0 border-slate-200"><ChevronLeft className="h-3 w-3" /></Button>
                       <Button size="sm" className="h-6 w-6 text-[9px] font-black bg-primary rounded-md p-0">1</Button>
                       <Button size="sm" variant="ghost" className="h-6 w-6 text-[9px] font-black text-slate-400 rounded-md p-0">2</Button>
                       <Button size="icon" variant="outline" className="h-6 w-6 rounded-md p-0 border-slate-200"><ChevronRight className="h-3 w-3" /></Button>
                    </div>
                 </div>
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
          <DialogHeader className="p-8 bg-primary text-white shrink-0 flex flex-row justify-between items-center pr-10">
             <DialogTitle className="font-black text-2xl uppercase flex items-center gap-4">
               <Settings className="h-8 w-8 text-accent" /> Gestión Técnica: {activeTab}
             </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-10 space-y-10 max-w-5xl mx-auto">
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
                            <div className="flex flex-col">
                              <span className="text-sm font-bold uppercase truncate group-hover:text-primary">{s.nombre}</span>
                              <span className="text-[10px] font-mono text-muted-foreground">{s.cct} • {s.municipio}</span>
                            </div>
                            <ChevronRightIcon className="h-5 w-5 text-slate-300" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

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

                   {activeTab === 'Cuentas Institucionales' && (
                     <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2"><Label className="text-[10px] font-black text-slate-400 pl-1 uppercase">Responsable</Label><Input value={formData.userName} onChange={e => setFormData({...formData, userName: e.target.value.toUpperCase()})} className="h-12 rounded-xl bg-slate-50 border-none font-bold uppercase" /></div>
                        <div className="space-y-2"><Label className="text-[10px] font-black text-slate-400 pl-1 uppercase">Correo</Label><Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value.toLowerCase()})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div>
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
            <Button onClick={handleSave} disabled={isSaving} className="btn-institutional h-12 px-16 text-xs gap-3 rounded-xl shadow-2xl">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5" />} GUARDAR REGISTRO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-[#B38E5D] text-white shrink-0">
            <DialogTitle className="uppercase font-black text-lg flex items-center gap-3"><PlusCircle className="h-6 w-6" /> Registro Rápido de CCT</DialogTitle>
          </DialogHeader>
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
