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
  MessageSquare
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
  where
} from 'firebase/firestore'
import { type ProgramStatus, type BitacoraEntry } from '@/lib/planning-data'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'

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
  const [verifyInput, setVerifyInput] = useState('')
  const [verifiedAccount, setVerifiedAccount] = useState<ProgramStatus | null>(null)
  const [isVerifyResultDialogOpen, setIsVerifyResultDialogOpen] = useState(false)
  
  const [selectedBibliotecaRecord, setSelectedBibliotecaRecord] = useState<ProgramStatus | null>(null)

  const [userPart, setUserPart] = useState('')
  const [domainPart, setDomainPart] = useState(DOMINIOS[0])

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
  }, [selectedBibliotecaRecord])

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
        setIsVerifyResultDialogOpen(true);
      } else {
        setVerifiedAccount(null);
        toast({ variant: "destructive", title: "Sin Registro", description: "El correo no se encuentra en la base de datos oficial." });
      }
      setIsVerifying(false);
    }, 800);
  }

  const bitacoraPendingCount = useMemo(() => {
    return records.filter(r => r.name === 'ATRES' && r.status === 'pendiente').length;
  }, [records]);

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

  const statsConoceEscuela = useMemo(() => {
    const conoceRecs = records.filter(r => r.name === 'Conoce mi Escuela');
    return {
      totalEscuelas: conoceRecs.length,
      totalResponsables: new Set(conoceRecs.map(r => r.userName).filter(u => !!u)).size,
      totalMunicipios: new Set(conoceRecs.map(r => r.municipio).filter(m => !!m)).size,
      datosActualizados: conoceRecs.length
    };
  }, [records]);

  const fullEmailPreview = useMemo(() => {
    if (!userPart) return '';
    return `${userPart.toLowerCase()}${domainPart}`;
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'image') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > FILE_SIZE_LIMIT) {
      toast({ variant: "destructive", title: "Archivo demasiado pesado", description: "Límite: 2.0 MB" })
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      if (type === 'pdf') {
        setFormData(prev => ({ ...prev, reportPdf: base64 }))
      } else {
        setFormData(prev => ({ ...prev, evidencePhotos: [...(prev.evidencePhotos || []), base64] }))
      }
      toast({ title: "Evidencia añadida" })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evidencePhotos: (prev.evidencePhotos || []).filter((_, i) => i !== index)
    }))
  }

  const handleQuickAddCct = () => {
    if (!quickAddForm.cct || !quickAddForm.nombre || !quickAddForm.municipio) {
      toast({ variant: "destructive", title: "Faltan datos" }); return;
    }
    const newSchool: SchoolInfo = { 
      ...quickAddForm, 
      cct: quickAddForm.cct.toUpperCase(), 
      nombre: quickAddForm.nombre.toUpperCase(), 
      municipio: quickAddForm.municipio.toUpperCase(),
      valle: quickAddForm.valle.toUpperCase(),
      domicilio: (quickAddForm.domicilio || '').toUpperCase(),
      localidad: (quickAddForm.localidad || '').toUpperCase(),
      sector: (quickAddForm.sector || '').toUpperCase(),
      zonaEscolar: (quickAddForm.zonaEscolar || '').toUpperCase(),
      modalidad: (quickAddForm.modalidad || 'DES').toUpperCase()
    };
    const updated = [newSchool, ...allSchools];
    setAllSchools(updated);
    localStorage.setItem('schools_master_full_v21', JSON.stringify(updated));
    handleCctChange(newSchool.cct);
    setIsQuickAddOpen(false);
    setDialogSearchTerm(newSchool.cct);
    setShowSearchResults(false);
    toast({ title: "CCT Registrado" });
  }

  const handleSave = async () => {
    const currentCct = (formData.cct || dialogSearchTerm || '').toUpperCase().trim();
    if (!currentCct && activeTab !== 'Conoce mi Escuela' && activeTab !== 'Cuentas Institucionales') {
      alert("ERROR: Identificación de CCT requerida."); return;
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
        finalData.puesto = String(formData.puesto || 'S/R');
        finalData.departamento = String(formData.departamento || 'S/R');
        finalData.email = fullEmailPreview || formData.email || '';
      } 
      else if (activeTab === 'Biblioteca Digital') {
        const bf = formData.bibliotecaFases || initialFormState.bibliotecaFases!;
        finalData.bibliotecaFases = { ...bf };
        const activePhases = Object.entries(bf).filter(([k, v]) => k.startsWith('fase') && v === true);
        finalData.progress = Math.round((activePhases.length / BIBLIOTECA_FASES_LABELS.length) * 100);
        finalData.asistentes = asistentesLib.filter(a => a.rfc && a.nombres);
        finalData.reportPdf = formData.reportPdf || '';
        finalData.evidencePhotos = formData.evidencePhotos || [];
      }
      else if (activeTab === 'Geoposición') {
        finalData.latitud = String(formData.latitud || '');
        finalData.longitud = String(formData.longitud || '');
        finalData.status = ['En línea', 'En movimiento', 'Sin señal', 'Desconectado'][Math.floor(Math.random() * 4)];
      }

      if (editingId) {
        await updateDoc(doc(db, 'programs', editingId), finalData);
      } else {
        await addDoc(collection(db, 'programs'), finalData);
      }
      
      setIsDialogOpen(false);
      setEditingId(null);
      resetForm();
      toast({ title: "Sincronización Exitosa" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error al Guardar", description: e.message });
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
    setAsistentesLib([{ rfc: '', nombres: '', paterno: '', materno: '', funcion: '', email: '', cct: '', schoolName: '' }]);
  }

  const handleUpdatePhase = async (phaseId: string, value: boolean) => {
    if (!selectedBibliotecaRecord?.id) return;
    try {
      const newFases = { ...selectedBibliotecaRecord.bibliotecaFases!, [phaseId]: value };
      const activePhases = Object.entries(newFases).filter(([k, v]) => k.startsWith('fase') && v === true);
      const newProgress = Math.round((activePhases.length / BIBLIOTECA_FASES_LABELS.length) * 100);
      await updateDoc(doc(db, 'programs', selectedBibliotecaRecord.id), { bibliotecaFases: newFases, progress: newProgress, updatedAt: serverTimestamp() });
      setSelectedBibliotecaRecord({ ...selectedBibliotecaRecord, bibliotecaFases: newFases, progress: newProgress });
    } catch (e) { toast({ variant: "destructive", title: "Error al actualizar" }); }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar permanentemente?")) return;
    await deleteDoc(doc(db, 'programs', id));
    toast({ title: "Registro Removido" });
  }

  const schoolSearchResults = useMemo(() => { if (!dialogSearchTerm || dialogSearchTerm.length < 3) return []; const term = dialogSearchTerm.toUpperCase(); return allSchools.filter(s => s.cct.includes(term) || s.nombre.includes(term)).slice(0, 5); }, [allSchools, dialogSearchTerm]);

  if (!mounted) return null

  return (
    <div className="space-y-6 animate-in fade-in duration-700 w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-primary leading-none uppercase">Módulos Técnicos COEES</h2>
          <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Sistema Integral de Auditoría 2026</p>
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
        <div className="h-[calc(100vh-220px)] w-full overflow-hidden border border-slate-200 rounded-[3rem] shadow-2xl bg-white animate-in zoom-in-95 duration-500">
           <HelpDeskInterface />
        </div>
      ) : activeTab === 'Biblioteca Digital' ? (
        <div className="space-y-8 animate-in fade-in duration-700">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'CCT Registrados', value: statsBiblioteca.totalCct.toString(), sub: 'Planteles', icon: School, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Visitas Totales', value: '0', sub: 'En el periodo', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Atenciones', value: '0', sub: 'En el periodo', icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Evidencias', value: '0', sub: 'Fotos / Docs', icon: Camera, color: 'text-orange-500', bg: 'bg-orange-50' },
              ].map((stat, idx) => (
                <Card key={idx} className="p-4 rounded-[1.5rem] bg-white border-none shadow-sm hover:shadow-xl transition-all border-b-4 border-transparent hover:border-primary">
                   <div className="flex items-center gap-3">
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-inner", stat.bg, stat.color)}><stat.icon className="h-5 w-5" /></div>
                      <div className="min-w-0">
                         <p className="text-[10px] font-black text-slate-700 uppercase leading-none truncate">{stat.label}</p>
                         <h4 className="text-xl font-black text-slate-800 mt-1">{stat.value}</h4>
                         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{stat.sub}</p>
                      </div>
                   </div>
                </Card>
              ))}
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <Card className="lg:col-span-8 rounded-[2rem] border-none shadow-2xl bg-white overflow-hidden flex flex-col">
                 <div className="px-8 py-5 border-b flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Fases del Proyecto por CCT</h3>
                    <div className="relative">
                       <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-300" />
                       <Input placeholder="FILTRAR CCT..." className="h-8 pl-9 rounded-xl border-slate-200 text-[10px] font-bold bg-white w-48 shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                 </div>
                 <div className="flex-1 overflow-x-auto">
                    <Table>
                       <TableHeader className="bg-white sticky top-0 z-10 border-b">
                          <TableRow className="h-12">
                             <TableHead className="pl-8 text-[9px] font-black uppercase text-slate-400">CCT</TableHead>
                             <TableHead className="text-[9px] font-black uppercase text-slate-400">Escuela</TableHead>
                             <TableHead className="text-[9px] font-black uppercase text-slate-400">Fase Actual</TableHead>
                             <TableHead className="text-[9px] font-black uppercase text-slate-400 text-center">Avance</TableHead>
                             <TableHead className="text-right pr-10 text-[9px] font-black uppercase text-slate-400">Acción</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {records.filter(r => r.name === 'Biblioteca Digital').map((row) => {
                            const currentFaseObj = BIBLIOTECA_FASES_LABELS.findLast(f => (row.bibliotecaFases as any)?.[f.id]) || { label: 'Sin Avance', color: 'text-slate-400 bg-slate-50 border-slate-100' };
                            return (
                              <TableRow 
                                key={row.id} 
                                onClick={() => setSelectedBibliotecaRecord(row)}
                                className={cn(
                                  "h-14 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer",
                                  selectedBibliotecaRecord?.id === row.id && "bg-primary/5"
                                )}
                              >
                                 <TableCell className="pl-8 font-mono font-black text-[10px] text-primary">{row.cct}</TableCell>
                                 <TableCell className="text-[11px] font-bold text-slate-700 uppercase truncate max-w-[150px]">{row.schoolName}</TableCell>
                                 <TableCell>
                                    <div className={cn("px-3 py-1 rounded-lg border text-[8px] font-black uppercase inline-flex flex-col", currentFaseObj.color)}>
                                       <span>{currentFaseObj.label.split('.')[0]}</span>
                                       <span className="opacity-70 truncate max-w-[140px]">{currentFaseObj.label.split('.')[1]?.trim() || currentFaseObj.label}</span>
                                    </div>
                                 </TableCell>
                                 <TableCell>
                                    <div className="flex items-center gap-3 w-24 mx-auto">
                                       <Progress value={row.progress} className="h-1.5" />
                                       <span className="text-[9px] font-black text-slate-600">{row.progress}%</span>
                                    </div>
                                 </TableCell>
                                 <TableCell className="text-right pr-8">
                                    <div className="flex justify-end gap-1">
                                       <button onClick={(e) => { e.stopPropagation(); setFormData({...row}); setEditingId(row.id!); setIsDialogOpen(true); }} className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
                                       <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id!); }} className="h-7 w-7 flex items-center justify-center text-rose-300 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                                    </div>
                                 </TableCell>
                              </TableRow>
                            )
                          })}
                       </TableBody>
                    </Table>
                 </div>
              </Card>

              <Card className="lg:col-span-4 rounded-[2rem] border-none shadow-2xl bg-white flex flex-col overflow-hidden">
                 <CardHeader className="p-8 border-b bg-slate-50/50">
                    <CardTitle className="text-base font-black text-slate-800 uppercase tracking-widest leading-none">Detalle de Fases del Proyecto</CardTitle>
                 </CardHeader>
                 <div className="p-8 space-y-6 flex-1 flex flex-col">
                    {!selectedBibliotecaRecord ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                        <ClipboardCheck className="h-12 w-12" />
                        <p className="text-[10px] font-black uppercase">Seleccione una escuela</p>
                      </div>
                    ) : (
                      <ScrollArea className="flex-1 pr-2">
                        {BIBLIOTECA_FASES_LABELS.map((f, i) => {
                          const isCompleted = (selectedBibliotecaRecord.bibliotecaFases as any)?.[f.id];
                          return (
                            <div 
                              key={f.id} 
                              onClick={() => handleUpdatePhase(f.id, !isCompleted)}
                              className={cn(
                                "flex items-start gap-4 p-3 rounded-2xl border-2 transition-all cursor-pointer group mb-4",
                                isCompleted ? "bg-emerald-50/30 border-emerald-100" : "bg-white border-slate-50 hover:border-primary/20"
                              )}
                            >
                               <div className={cn(
                                 "h-7 w-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all",
                                 isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-200 text-slate-300 group-hover:border-primary group-hover:text-primary"
                               )}>
                                  {isCompleted ? <CheckCircle className="h-4 w-4" /> : <span className="text-[10px] font-black">{i + 1}</span>}
                               </div>
                               <p className={cn("text-[9px] font-black uppercase leading-tight pt-1", isCompleted ? "text-emerald-700" : "text-slate-400")}>{f.label}</p>
                            </div>
                          )
                        })}
                      </ScrollArea>
                    )}
                 </div>
              </Card>
           </div>
        </div>
      ) : activeTab === 'Geoposición' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-700 w-full">
          <div className="lg:col-span-7 flex flex-col gap-4">
            <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white flex flex-col relative h-[600px] border-4 border-white">
              <div className="absolute inset-0 z-0">
                <Image src="https://picsum.photos/seed/geoloc-edomex-v2/1200/900" alt="Mapa" fill className="object-cover" />
                <div className="absolute top-[40%] left-[45%] group/pin cursor-pointer">
                  <div className="h-10 w-10 bg-emerald-500 rounded-full border-4 border-white shadow-2xl flex items-center justify-center animate-bounce">
                    <div className="h-3 w-3 bg-white rounded-full" />
                  </div>
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white z-30 opacity-0 group-hover/pin:opacity-100 transition-all duration-300 min-w-[200px]">
                     <span className="text-[11px] font-black text-primary uppercase">Última ubicación: {format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-xl p-4 rounded-[2rem] shadow-2xl border border-white/50 z-20 flex items-center justify-between gap-6 overflow-x-auto no-scrollbar">
                 <div className="flex items-center gap-6 whitespace-nowrap">
                    <div className="flex items-center gap-2.5"><div className="h-3.5 w-3.5 rounded-full bg-emerald-500" /><span className="text-[10px] font-black uppercase text-slate-600">En línea</span></div>
                    <div className="flex items-center gap-2.5"><div className="h-3.5 w-3.5 rounded-full bg-blue-600" /><span className="text-[10px] font-black uppercase text-slate-600">En movimiento</span></div>
                    <div className="flex items-center gap-2.5"><div className="h-3.5 w-3.5 rounded-full bg-rose-500" /><span className="text-[10px] font-black uppercase text-slate-600">Sin señal</span></div>
                    <div className="flex items-center gap-2.5"><div className="h-3.5 w-3.5 rounded-full bg-slate-400" /><span className="text-[10px] font-black uppercase text-slate-600">Desconectado</span></div>
                 </div>
              </div>
            </Card>
          </div>
          <div className="lg:col-span-5 flex flex-col gap-6">
             <Card className="rounded-[2.5rem] bg-white border-none shadow-xl overflow-hidden p-8 space-y-6">
                <div className="flex items-center gap-4 border-b pb-4"><div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><MapPin className="h-6 w-6" /></div><h3 className="text-base font-black uppercase tracking-widest text-slate-800">Registrar Ubicación</h3></div>
                <div className="space-y-4">
                  <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-400 uppercase">CCT *</Label><Input value={dialogSearchTerm} onChange={e => { setDialogSearchTerm(e.target.value); handleCctChange(e.target.value); setShowSearchResults(true); }} className="h-11 rounded-xl bg-slate-50 border-none shadow-inner" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-400 uppercase">Latitud *</Label><Input value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} className="h-11 bg-slate-50 border-none rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-400 uppercase">Longitud *</Label><Input value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} className="h-11 bg-slate-50 border-none rounded-xl" /></div>
                  </div>
                  <Button onClick={handleSave} className="w-full btn-institutional h-12 text-[11px] gap-2 shadow-xl"><Save className="h-5 w-5" /> GUARDAR UBICACIÓN</Button>
                </div>
             </Card>
             <Card className="flex-1 rounded-[2.5rem] bg-white border-none shadow-xl overflow-hidden flex flex-col min-h-0">
                <div className="px-8 py-5 border-b bg-slate-50/50 flex items-center gap-4"><ClipboardList className="h-6 w-6 text-accent" /><h3 className="text-base font-black uppercase tracking-widest text-slate-800">Historial de rastreo</h3></div>
                <ScrollArea className="h-[250px]">
                   <Table>
                      <TableHeader className="bg-slate-50 sticky top-0 z-10">
                         <TableRow><TableHead className="pl-8 text-[9px] font-black uppercase">CCT</TableHead><TableHead className="text-[9px] font-black uppercase text-center">Estado</TableHead><TableHead className="text-right pr-10"></TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                         {records.filter(r => r.name === 'Geoposición').map(rec => (
                           <TableRow key={rec.id} className="h-14 border-b border-slate-50">
                              <TableCell className="pl-8 font-mono font-black text-primary text-[10px]">{rec.cct}</TableCell>
                              <TableCell className="text-center"><Badge className={cn("text-[8px] font-black border-none uppercase px-3 h-5 rounded-full", rec.status === 'En línea' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500")}><Circle className="h-1.5 w-1.5 fill-current mr-1.5" />{rec.status || 'En línea'}</Badge></TableCell>
                              <TableCell className="text-right pr-8"><button onClick={() => handleDelete(rec.id!)} className="text-rose-300 hover:text-rose-600 transition-all"><Trash2 className="h-4 w-4" /></button></TableCell>
                           </TableRow>
                         ))}
                      </TableBody>
                   </Table>
                </ScrollArea>
             </Card>
          </div>
        </div>
      ) : activeTab === 'Conoce mi Escuela' ? (
        <div className="space-y-6 animate-in fade-in duration-700 w-full">
          <Card className="rounded-[2rem] bg-white border-none shadow-2xl p-6 overflow-visible">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
              <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-400 uppercase">Buscar por:</Label><Select defaultValue="cct"><SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold uppercase text-[11px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cct">CCT</SelectItem><SelectItem value="nombre">Nombre</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-400 uppercase">Identificador:</Label><div className="relative group"><Input placeholder="Ej. 15DES0001R" className="h-12 pl-10 rounded-xl bg-slate-50 border-none font-bold uppercase text-xs" /><Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-300" /></div></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-400 uppercase">Zona / Municipio:</Label><Select defaultValue="todos"><SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold uppercase text-[11px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-400 uppercase">Estado:</Label><Select defaultValue="todos"><SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold uppercase text-[11px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem></SelectContent></Select></div>
              <Button className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[11px] rounded-xl gap-2"><Search className="h-5 w-5" /> Buscar</Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             <div className="lg:col-span-7 flex flex-col gap-6">
                <Card className="rounded-[2.5rem] bg-white border-none shadow-2xl overflow-hidden flex flex-col relative h-[450px] border-4 border-white">
                   <Image src="https://picsum.photos/seed/school-intel-v1/1200/800" alt="Mapa" fill className="object-cover" />
                   <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-white z-20 flex items-center gap-8 overflow-x-auto no-scrollbar">
                      <div className="flex items-center gap-2"><div className="h-3.5 w-3.5 rounded-full bg-emerald-500" /><span className="text-[10px] font-black uppercase text-slate-600">En línea</span></div>
                      <div className="flex items-center gap-2"><div className="h-3.5 w-3.5 rounded-full bg-blue-600" /><span className="text-[10px] font-black uppercase text-slate-600">En movimiento</span></div>
                      <div className="flex items-center gap-2"><div className="h-3.5 w-3.5 rounded-full bg-rose-500" /><span className="text-[10px] font-black uppercase text-slate-600">Sin señal</span></div>
                      <div className="flex items-center gap-2"><div className="h-3.5 w-3.5 rounded-full bg-slate-400" /><span className="text-[10px] font-black uppercase text-slate-600">Desconectado</span></div>
                   </div>
                </Card>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                   {[
                     { label: 'Escuelas registradas', value: statsConoceEscuela.totalEscuelas.toString(), icon: School, color: 'text-blue-600', bg: 'bg-blue-50' },
                     { label: 'Directores / Responsables', value: statsConoceEscuela.totalResponsables.toString(), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                     { label: 'Municipios', value: statsConoceEscuela.totalMunicipios.toString(), icon: MapPin, color: 'text-blue-700', bg: 'bg-blue-50' },
                     { label: 'Datos actualizados', value: statsConoceEscuela.datosActualizados.toString(), icon: FileText, color: 'text-blue-900', bg: 'bg-slate-50' },
                   ].map((stat, idx) => (
                     <Card key={idx} className="p-6 rounded-[2rem] bg-white border-none shadow-xl flex flex-col items-center text-center">
                        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-4 shadow-inner", stat.bg, stat.color)}><stat.icon className="h-6 w-6" /></div>
                        <h4 className="text-2xl font-black text-slate-800">{stat.value}</h4>
                        <p className="text-[9px] font-black uppercase text-slate-400 mt-2 leading-tight tracking-widest">{stat.label}</p>
                     </Card>
                   ))}
                </div>
             </div>
             <div className="lg:col-span-5 flex flex-col gap-8">
                <Card className="rounded-[2.5rem] bg-white border-none shadow-2xl p-8 space-y-6">
                   <div className="flex items-center gap-4 border-b pb-4"><Building2 className="h-6 w-6 text-primary" /><h3 className="text-base font-black uppercase tracking-widest text-slate-800">Registrar Escuela</h3></div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-400 uppercase">CCT *</Label><Input value={dialogSearchTerm} onChange={e => { setDialogSearchTerm(e.target.value); handleCctChange(e.target.value); setShowSearchResults(true); }} className="h-11 rounded-xl bg-slate-50 border-none font-bold uppercase text-xs" /></div>
                      <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-400 uppercase">Nombre *</Label><Input value={formData.schoolName} onChange={e => setFormData({...formData, schoolName: e.target.value.toUpperCase()})} className="h-11 rounded-xl bg-slate-50 border-none font-bold uppercase text-xs" /></div>
                      <div className="grid grid-cols-2 gap-4 col-span-2">
                        <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-400 uppercase">Latitud *</Label><Input value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} className="h-11 bg-slate-50 border-none rounded-xl" /></div>
                        <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-400 uppercase">Longitud *</Label><Input value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} className="h-11 bg-slate-50 border-none rounded-xl" /></div>
                   </div>
                   </div>
                   <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[11px] h-12 rounded-xl"><Save className="h-5 w-5 mr-2" /> Guardar escuela</Button>
                </Card>
                {records.filter(r => r.name === 'Conoce mi Escuela').slice(0, 3).map((item) => (
                   <Card key={item.id} className="rounded-[2.5rem] bg-white border-none shadow-xl overflow-hidden p-6 flex gap-6">
                      <div className="relative h-24 w-32 rounded-2xl overflow-hidden shadow-xl shrink-0"><Image src="https://picsum.photos/seed/school-prev-v1/400/300" alt="Vista Previa" fill className="object-cover" /></div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start mb-2"><Badge className="bg-emerald-500 text-white border-none text-[8px] font-black">En línea</Badge><span className="text-[10px] font-mono text-primary font-black">{item.cct}</span></div>
                         <h4 className="text-xs font-black text-slate-800 uppercase truncate">{item.schoolName}</h4>
                         <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 truncate">{item.municipio}</p>
                      </div>
                   </Card>
                ))}
             </div>
          </div>
        </div>
      ) : activeTab === 'Cuentas Institucionales' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500">
          <Card className="lg:col-span-5 executive-card bg-white border-none shadow-2xl flex flex-col h-fit">
            <CardHeader className="p-8 border-b border-slate-50">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><Mail className="h-6 w-6" /></div>
                  <div>
                    <CardTitle className="text-lg font-black text-slate-800 uppercase">Registrar correo institucional</CardTitle>
                    <CardDescription className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase">Alta de acceso oficial para servidores públicos.</CardDescription>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
               <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black text-slate-400 pl-1 uppercase">Estatus de la Cuenta (Semáforo)</Label>
                    <Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val})}>
                      <SelectTrigger className={cn(
                        "h-11 rounded-xl border-none shadow-inner font-black uppercase text-[10px] focus:ring-2 focus:ring-primary/20",
                        formData.status === 'activo' || formData.status === 'Activa' ? "bg-emerald-100 text-emerald-700" :
                        formData.status === 'inactivo' || formData.status === 'Inactiva' ? "bg-slate-100 text-slate-400" :
                        "bg-rose-100 text-rose-700"
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-2xl">
                        <SelectItem value="activo" className="text-[10px] font-black text-emerald-600">activa</SelectItem>
                        <SelectItem value="inactivo" className="text-[10px] font-black text-slate-400">inactiva</SelectItem>
                        <SelectItem value="suspendida" className="text-[10px] font-black text-amber-600">bloqueada</SelectItem>
                        <SelectItem value="Eliminada" className="text-[10px] font-black text-rose-600">eliminada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 relative">
                    <Label className="text-[10px] font-black text-slate-400 pl-1 uppercase">Identificar Plantel (CCT)</Label>
                    <div className="relative">
                      <Input placeholder="ESCRIBIR CCT..." className="h-11 rounded-xl bg-slate-50 border-slate-100 shadow-inner font-bold uppercase pl-10" value={dialogSearchTerm} onChange={e => { setDialogSearchTerm(e.target.value); handleCctChange(e.target.value); setShowSearchResults(true); }} />
                      <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-300" />
                      {showSearchResults && dialogSearchTerm.length > 2 && (
                        <div className="absolute top-12 left-0 right-0 bg-white border rounded-xl shadow-2xl z-50 divide-y max-h-40 overflow-auto">
                           {schoolSearchResults.map((s, sidx) => (
                             <div key={`${s.cct}-${s.turno}-${sidx}`} className="p-3 hover:bg-primary/5 cursor-pointer flex justify-between items-center group" onClick={() => handleCctChange(s.cct)}>
                                <span className="text-[10px] font-black uppercase text-slate-700">{s.nombre}</span>
                                <Badge className="text-[8px] font-mono">{s.cct}</Badge>
                             </div>
                           ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black text-slate-400 pl-1 uppercase">Nombre del Responsable *</Label>
                    <div className="relative">
                      <Input placeholder="NOMBRE COMPLETO..." className="h-11 rounded-xl bg-white border-slate-200 font-bold uppercase pl-10" value={formData.userName} onChange={e => setFormData({...formData, userName: e.target.value.toUpperCase()})} />
                      <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-300" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black text-slate-400 pl-1 uppercase">Usuario (sin dominio) *</Label>
                      <Input placeholder="ej. maria.lopez" className="h-11 rounded-xl bg-white border-slate-200 font-bold lowercase pl-4" value={userPart} onChange={e => setUserPart(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black text-slate-400 pl-1 uppercase">Dominio *</Label>
                      <Select value={domainPart} onValueChange={setDomainPart}>
                        <SelectTrigger className="h-11 rounded-xl border-slate-200 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {DOMINIOS.map(d => <SelectItem key={d} value={d} className="text-xs font-bold">{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
               </div>

               <div className="flex gap-4 pt-4">
                  <Button onClick={handleSave} disabled={isSaving} className="flex-1 btn-institutional h-12 rounded-xl text-[11px] gap-2 shadow-xl">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5" />} GUARDAR
                  </Button>
               </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-7 space-y-8 flex flex-col">
            <Card className="executive-card bg-white border-none shadow-xl">
              <CardHeader className="p-8 border-b border-slate-50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-inner"><Search className="h-6 w-6" /></div>
                  <CardTitle className="text-lg font-black text-slate-800 uppercase">Verificar existencia de correo</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex gap-2">
                   <div className="relative flex-1">
                      <Input placeholder="EJ. USUARIO@COEES.EDU.MX" className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold lowercase pl-10" value={verifyInput} onChange={e => setVerifyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleVerifyAccount()} />
                      <Mail className="absolute left-3.5 top-4 h-4 w-4 text-slate-300" />
                   </div>
                   <Button onClick={handleVerifyAccount} disabled={isVerifying} className="h-12 px-8 rounded-xl bg-primary text-white font-black text-[10px] uppercase shadow-lg gap-2">
                     <Search className={cn("h-4 w-4", isVerifying && "animate-spin")} /> VERIFICAR
                   </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="executive-card bg-white border-none shadow-xl flex-1 overflow-hidden flex flex-col">
               <CardHeader className="p-8 border-b border-slate-50">
                 <div className="flex items-center gap-3">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm font-black uppercase text-slate-700">Historial de registros</CardTitle>
                 </div>
               </CardHeader>
               <div className="overflow-x-auto">
                 <Table>
                   <TableHeader className="bg-slate-50 border-b">
                     <TableRow className="h-10">
                        <TableHead className="pl-8 text-[9px] font-black uppercase">Fecha de registro</TableHead>
                        <TableHead className="text-[9px] font-black uppercase">Correo institucional</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-center">Estado</TableHead>
                        <TableHead className="text-right pr-10 text-[9px] font-black uppercase">Acciones</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {records.filter(r => r.name === 'Cuentas Institucionales').slice(0, 10).map(rec => (
                       <TableRow key={rec.id} className="h-12 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <TableCell className="pl-8 text-[10px] font-bold text-slate-400">{rec.date}</TableCell>
                          <TableCell className="text-[11px] font-mono font-black text-slate-700 lowercase">{rec.email}</TableCell>
                          <TableCell className="text-center">
                             <Badge className={cn("text-[8px] font-black border-none uppercase px-2 h-4", rec.status === 'activo' || rec.status === 'Activa' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>{rec.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                             <div className="flex justify-end gap-1">
                                <button onClick={() => { setFormData({...rec}); setEditingId(rec.id!); setDialogSearchTerm(rec.cct); setIsDialogOpen(true); }} className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-primary transition-all"><Pencil className="h-4 w-4" /></button>
                                <button onClick={() => handleDelete(rec.id!)} className="h-7 w-7 flex items-center justify-center text-rose-300 hover:text-rose-600 transition-all"><Trash2 className="h-4 w-4" /></button>
                             </div>
                          </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
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
              <TableHeader className="bg-slate-50 border-b"><TableRow className="h-12"><TableHead className="w-12 text-[10px] font-bold pl-8 uppercase">#</TableHead><TableHead className="text-[10px] font-bold text-primary w-[110px] uppercase">CCT</TableHead><TableHead className="text-[10px] font-bold text-primary min-w-[200px] uppercase">Responsable / Escuela</TableHead><TableHead className="text-[10px] font-bold text-primary w-[100px] uppercase text-center">Estatus</TableHead><TableHead className="text-right text-[10px] font-bold pr-10 w-24 uppercase">Acción</TableHead></TableRow></TableHeader>
              <TableBody>{isLoading ? (<TableRow><TableCell colSpan={6} className="text-center py-20 opacity-30"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /><p className="text-[10px] font-black uppercase">Sincronizando...</p></TableCell></TableRow>) : filteredRecords.length > 0 ? filteredRecords.map((rec, idx) => (<TableRow key={rec.id || idx} className="hover:bg-slate-50 border-b border-slate-50 h-14 transition-colors"><TableCell className="pl-8 font-bold text-[10px] text-slate-300">{idx + 1}</TableCell><TableCell className="font-mono font-bold text-[11px] text-primary">{rec.cct}</TableCell><TableCell className="py-2 min-w-0"><div className="flex flex-col"><span className="text-[12px] font-bold text-slate-700 leading-tight truncate uppercase">{rec.schoolName || rec.userName}</span><span className="text-[9px] font-bold text-muted-foreground opacity-70 truncate uppercase">{rec.municipio} • {rec.valle}</span></div></TableCell><TableCell className="text-center"><Badge variant="outline" className={cn("text-[8px] font-bold px-2 h-5 rounded-full border-2 uppercase", rec.status === 'activo' || rec.status === 'Activa' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200")}>{rec.status}</Badge></TableCell><TableCell className="text-right pr-10"><div className="flex justify-end gap-1"><button onClick={() => { setFormData({...rec}); setEditingId(rec.id!); setDialogSearchTerm(rec.cct); setAsistentesLib(rec.asistentes && rec.asistentes.length > 0 ? rec.asistentes : [{ rfc: '', nombres: '', paterno: '', materno: '', funcion: '', email: '', cct: '', schoolName: '' }]); setShowSearchResults(false); setIsDialogOpen(true); }} className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg"><Pencil className="h-4 w-4" /></button><button onClick={() => handleDelete(rec.id!)} className="h-8 w-8 flex items-center justify-center text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="h-4 w-4" /></button></div></TableCell></TableRow>)) : (<TableRow><TableCell colSpan={6} className="text-center py-24 opacity-30 text-sm font-bold uppercase tracking-widest">Sin registros oficiales</TableCell></TableRow>)}</TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={isVerifyResultDialogOpen} onOpenChange={setIsVerifyResultDialogOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none rounded-3xl bg-[#f0f7ff] shadow-2xl">
          <DialogHeader className="p-8 pb-0">
             <DialogTitle className="uppercase font-black text-emerald-600 flex items-center gap-3">
               <CheckCircle2 className="h-6 w-6" /> Resultado de la verificación
             </DialogTitle>
             <DialogDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Muestra el estatus oficial de la cuenta institucional verificada.</DialogDescription>
          </DialogHeader>
          <div className="p-8 flex gap-6">
            <div className="shrink-0 pt-1">
              <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg">
                <CheckCircle2 className="h-7 w-7" />
              </div>
            </div>
            <div className="flex-1 space-y-6">
              <div className="space-y-1">
                <p className="text-[#003366] font-bold text-sm">Registro Localizado</p>
                <h3 className="text-2xl font-black text-emerald-600 truncate">{verifiedAccount?.email}</h3>
                <Badge className="bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/30 border-none px-4 py-1 rounded-full text-[10px] font-bold mt-2">
                  Cuenta activa
                </Badge>
              </div>
              
              <div className="space-y-2 pt-2">
                <div className="flex gap-8">
                  <span className="text-[#003366] font-bold text-sm w-24">Nombre:</span>
                  <span className="text-slate-600 font-semibold text-sm uppercase">{verifiedAccount?.userName}</span>
                </div>
                <div className="flex gap-8">
                  <span className="text-[#003366] font-bold text-sm w-24">Área:</span>
                  <span className="text-slate-600 font-semibold text-sm uppercase">{verifiedAccount?.puesto || verifiedAccount?.departamento || 'S/D'}</span>
                </div>
                <div className="flex gap-8">
                  <span className="text-slate-400 font-bold text-xs w-24">Fecha de alta:</span>
                  <span className="text-slate-400 font-semibold text-xs">{verifiedAccount?.date}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white/50 border-t flex justify-end">
             <Button onClick={() => setIsVerifyResultDialogOpen(false)} variant="ghost" className="text-[#003366] font-black uppercase text-[10px]">Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!isSaving) { setIsDialogOpen(open); if(!open) resetForm(); } }}>
        <DialogContent className="w-[98vw] lg:max-w-[1200px] h-[92vh] rounded-[2.5rem] p-0 overflow-hidden bg-white flex flex-col border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white shrink-0 flex flex-row justify-between items-center pr-10">
             <DialogTitle className="font-black text-lg uppercase">Gestión Técnica: {activeTab}</DialogTitle>
             <button onClick={() => setIsDialogOpen(false)} className="h-10 w-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-all"><X className="h-6 w-6" /></button>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-10 space-y-10 max-w-4xl mx-auto">
                <div className={cn("bg-slate-50 p-8 rounded-[2.5rem] border-2 transition-all space-y-6 shadow-inner", !formData.cct ? "border-rose-200" : "border-primary/10")}>
                  <Label className="text-[11px] font-black text-primary tracking-widest block pl-1 uppercase">Buscador de Plantel (CCT)</Label>
                  <div className="relative">
                    <input 
                      placeholder="INGRESAR CCT..." 
                      className="h-14 w-full rounded-2xl bg-white border border-primary/20 font-bold text-xl uppercase shadow-lg pl-6 focus:outline-none focus:ring-2 focus:ring-primary/20" 
                      value={dialogSearchTerm} 
                      onChange={(e) => { setDialogSearchTerm(e.target.value); handleCctChange(e.target.value); setShowSearchResults(true); }} 
                    />
                    {showSearchResults && dialogSearchTerm.length > 2 && (
                      <div className="absolute top-18 left-0 right-0 max-h-60 overflow-auto bg-white border rounded-2xl shadow-2xl z-[100] divide-y">
                        {schoolSearchResults.map((s, sidx) => (
                          <div key={`${s.cct}-${s.turno}-${sidx}`} className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center group transition-all" onClick={() => handleCctChange(s.cct)}>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold uppercase truncate group-hover:text-primary transition-colors">{s.nombre}</span>
                              <span className="text-[10px] font-mono text-muted-foreground">{s.cct} • {s.municipio}</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-all" />
                          </div>
                        ))}
                        {schoolSearchResults.length === 0 && (
                          <div className="p-6 text-center">
                            <Button onClick={() => { setQuickAddForm({...quickAddForm, cct: dialogSearchTerm.toUpperCase()}); setIsQuickAddOpen(true); }} variant="outline" className="h-10 px-8 rounded-xl text-[10px] font-black uppercase border-primary/20 text-primary hover:bg-primary/5">
                              <Plus className="h-4 w-4 mr-2" /> Alta Rápida
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4 shrink-0">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSaving} className="h-12 px-8 rounded-xl font-bold text-xs uppercase">Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving} className="btn-institutional h-12 px-12 text-xs gap-3 rounded-xl shadow-2xl">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5" />} GUARDAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
