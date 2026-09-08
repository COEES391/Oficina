
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
  MonitorCheck
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { HelpDeskDialog } from '@/components/HelpDeskDialog'
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

const FUNCIONES_BIBLIOTECA = [
  "PAAE",
  "DOCENTE",
  "DIRECTIVO",
  "JEFE DE ENSEÑANZA",
  "SUPERVISOR",
  "ASESOR TECNICO PEDAGOGICO"
]

const TrafficLight = ({ status }: { status: BitacoraEntry['status'] }) => {
  return (
    <div className="inline-flex flex-col gap-0.5 bg-slate-900 p-0.5 rounded-md shadow-lg border border-slate-700/50 w-5">
      <div className={cn(
        "h-2 w-2 rounded-full transition-all duration-500 border border-black/20 mx-auto",
        status === 'pendiente' 
          ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" 
          : "bg-rose-900/30 grayscale"
      )} />
      <div className={cn(
        "h-2 w-2 rounded-full transition-all duration-500 border border-black/20 mx-auto",
        status === 'proceso' 
          ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" 
          : "bg-amber-900/30 grayscale"
      )} />
      <div className={cn(
        "h-2 w-2 rounded-full transition-all duration-500 border border-black/20 mx-auto", status === 'atendido' 
          ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" 
          : "bg-emerald-900/30 grayscale"
      )} />
    </div>
  );
}

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState(PROGRAM_RUBROS[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isHelpDeskOpen, setIsHelpDeskOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogSearchTerm, setDialogSearchTerm] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  
  const [selectedBibliotecaRecord, setSelectedBibliotecaRecord] = useState<ProgramStatus | null>(null)

  const [bitacoraRecords, setBitacoraRecords] = useState<BitacoraEntry[]>([])
  const [isBitacoraEditDialogOpen, setIsBitacoraEditDialogOpen] = useState(false)
  const [bitacoraEditingRecord, setBitacoraEditingRecord] = useState<BitacoraEntry | null>(null)
  const [bitacoraPdfToPreview, setBitacoraPdfToPreview] = useState<string | null>(null)

  const [userPart, setUserPart] = useState('')
  const [domainPart, setDomainPart] = useState(DOMINIOS[0])
  const [verifyInput, setVerifyInput] = useState('')
  const [verifiedAccount, setVerifiedAccount] = useState<any>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([])
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddForm, setQuickAddForm] = useState<SchoolInfo>({
    region: '', valle: 'MEXICO', municipio: '', subsistema: 'FEDERALIZADO', control: 'OFICIAL',
    nivel: 'SECUNDARIA', servicioEducativo: 'SECUNDARIA GENERAL', cct: '', turno: 'MATUTINO',
    nombre: '', domicilio: '', localidad: '', telefono: '', zonaEscolar: '', sector: '',
    director: '', hombres: 0, mujeres: 0, alumnos: 0, grupos: 0, maestros: 0, administrativos: 0,
    aulasExistentes: 0, aulasEnUso: 0, modalidad: 'DES'
  })

  // State for dynamic assistants in Biblioteca Digital
  const [asistentesLib, setAsistentesLib] = useState<any[]>([
    { rfc: '', nombres: '', paterno: '', materno: '', funcion: '', email: '', cct: '', schoolName: '' }
  ])

  const initialFormState: ProgramStatus = {
    name: '', progress: 0, status: 'activo', date: new Date().toISOString().split('T')[0], 
    cct: '', schoolName: '', userName: '', puesto: '', departamento: '',
    email: '', emails: [''], zonaEscolar: '', sector: '', modalidad: '', municipio: '', region: '', valle: '',
    latitud: '', longitud: '', observaciones: '', evidencePhotos: [],
    asistentes: [],
    bibliotecaFases: {
      fase1: false, fase2: false, fase3: false, fase4: false, fase4_1: false, fase4_2: false,
      fase5: false, fase6: false, fase7: false, fase7_1: false, fase8: false, fase9: false,
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

    const bQ = query(collection(db, 'atres_bitacora'), orderBy('fecha', 'desc'))
    const bUnsubscribe = onSnapshot(bQ, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as BitacoraEntry[]
      setBitacoraRecords(fetched)
    })

    const storedSchools = JSON.parse(localStorage.getItem('schools_master_full_v21') || '[]')
    setAllSchools(storedSchools.length > 0 ? storedSchools : schoolsDirectory)

    return () => { unsubscribe(); bUnsubscribe(); }
  }, [selectedBibliotecaRecord])

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

  const filteredBitacora = useMemo(() => {
    if (!searchTerm) return bitacoraRecords;
    const term = searchTerm.toUpperCase();
    return bitacoraRecords.filter(r => 
      (r.cct || '').toUpperCase().includes(term) ||
      (r.schoolName || '').toUpperCase().includes(term) ||
      (r.folio || '').toUpperCase().includes(term) ||
      (r.tecnico || '').toUpperCase().includes(term) ||
      (r.status || '').toUpperCase().includes(term)
    );
  }, [bitacoraRecords, searchTerm]);

  const bitacoraPendingCount = useMemo(() => bitacoraRecords.filter(r => r.status === 'pendiente').length, [bitacoraRecords]);

  const handleVerifyAccount = async () => {
    if (!verifyInput.includes('@')) {
      toast({ variant: "destructive", title: "Formato inválido", description: "Ingrese un correo completo institucional." });
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      const match = records.find(r => r.name === 'Cuentas Institucionales' && r.email?.toLowerCase() === verifyInput.toLowerCase());
      if (match) {
        setVerifiedAccount(match);
        toast({ title: "Cuenta Localizada", description: `El correo pertenece a: ${match.userName}` });
      } else {
        setVerifiedAccount(null);
        toast({ variant: "destructive", title: "Sin Registro", description: "El correo no se encuentra en la base de datos oficial." });
      }
      setIsVerifying(false);
    }, 800);
  }

  const statsBiblioteca = useMemo(() => {
    const libRecs = records.filter(r => r.name === 'Biblioteca Digital');
    return {
      totalCct: libRecs.length,
      concluidos: libRecs.filter(r => r.progress === 100).length,
      enProceso: libRecs.filter(r => r.progress > 0 && r.progress < 100).length,
      personalTotal: libRecs.reduce((acc, r) => acc + (r.bibliotecaFases?.personalCapacitado || 0), 0),
      equiposTotal: libRecs.reduce((acc, r) => acc + (r.bibliotecaFases?.equiposHabilitados || 0), 0)
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

  const handleQuickAddCct = () => {
    if (!quickAddForm.cct || !quickAddForm.nombre || !quickAddForm.municipio) {
      toast({ variant: "destructive", title: "Faltan datos", description: "CCT, Nombre y Municipio son obligatorios." }); return;
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

  const addAsistenteRow = () => {
    setAsistentesLib([...asistentesLib, { rfc: '', nombres: '', paterno: '', materno: '', funcion: '', email: '', cct: '', schoolName: '' }])
  }

  const removeAsistenteRow = (index: number) => {
    if (asistentesLib.length === 1) return
    setAsistentesLib(asistentesLib.filter((_, i) => i !== index))
  }

  const updateAsistente = (index: number, field: string, value: string) => {
    const newList = [...asistentesLib]
    newList[index] = { ...newList[index], [field]: value.toUpperCase() }
    
    if (field === 'cct') {
      const match = allSchools.find(s => s.cct.toUpperCase() === value.toUpperCase().trim())
      if (match) {
        newList[index].schoolName = match.nombre
      }
    }
    setAsistentesLib(newList)
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
      toast({ title: "Sincronización Exitosa", description: "Datos registrados en la nube." });
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
      const newFases = { 
        ...selectedBibliotecaRecord.bibliotecaFases!, 
        [phaseId]: value 
      };
      
      const activePhases = Object.entries(newFases).filter(([k, v]) => k.startsWith('fase') && v === true);
      const newProgress = Math.round((activePhases.length / BIBLIOTECA_FASES_LABELS.length) * 100);
      
      await updateDoc(doc(db, 'programs', selectedBibliotecaRecord.id), {
        bibliotecaFases: newFases,
        progress: newProgress,
        updatedAt: serverTimestamp()
      });

      setSelectedBibliotecaRecord({
        ...selectedBibliotecaRecord,
        bibliotecaFases: newFases,
        progress: newProgress
      });
      
    } catch (e) {
      toast({ variant: "destructive", title: "Error al actualizar fase" });
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar permanentemente?")) return;
    await deleteDoc(doc(db, 'programs', id));
    toast({ title: "Registro Removido" });
  }

  const handleBitacoraEdit = (record: BitacoraEntry) => { setBitacoraEditingRecord({ ...record }); setIsBitacoraEditDialogOpen(true); }
  const handleBitacoraDelete = async (id: string) => { if (!confirm("¿Eliminar permanentemente este folio?")) return; await deleteDoc(doc(db, 'atres_bitacora', id)); toast({ title: "Folio Eliminado" }); }
  const saveBitacoraEdits = async () => { if (!bitacoraEditingRecord?.id) return; setIsSaving(true); try { await updateDoc(doc(db, 'atres_bitacora', bitacoraEditingRecord.id), { status: bitacoraEditingRecord.status, tecnico: bitacoraEditingRecord.tecnico, servicio: bitacoraEditingRecord.servicio, updatedAt: serverTimestamp() }); setIsBitacoraEditDialogOpen(false); setBitacoraEditingRecord(null); toast({ title: "Bitácora Actualizada" }); } catch (e) { toast({ variant: "destructive", title: "Error al actualizar" }); } finally { setIsSaving(false); } }

  const downloadExcelBitacora = () => {
    const data = filteredBitacora.map(r => ({ Folio: r.folio, Fecha: r.fecha, CCT: r.cct, Plantel: r.schoolName, Servicio: r.servicio, Analista: r.tecnico, Estatus: r.status }));
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Bitacora ATRES"); XLSX.writeFile(wb, `Bitacora_ATRES_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
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
          {activeTab === 'ATRES' && (
             <HelpDeskDialog open={isHelpDeskOpen} onOpenChange={setIsHelpDeskOpen} />
          )}
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="btn-institutional h-10 px-6 rounded-xl text-[10px] font-bold shadow-lg uppercase">
             <PlusCircle className="h-5 w-5 mr-2" /> Nuevo Registro
          </Button>
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
        <div className="space-y-8 animate-in fade-in duration-700">
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'CCT Registrados', value: statsBiblioteca.totalCct.toString(), sub: 'Planteles', icon: School, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Visitas Totales', value: '128', sub: 'En el periodo', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Atenciones', value: '96', sub: 'En el periodo', icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Evidencias', value: '243', sub: 'Fotos / Docs', icon: Camera, color: 'text-orange-500', bg: 'bg-orange-50' },
                { label: 'Personal Capacitado', value: statsBiblioteca.personalTotal.toString(), sub: 'Sincronizado', icon: UserCheck, color: 'text-cyan-600', bg: 'bg-cyan-50' },
                { label: 'Proyectos Concluidos', value: statsBiblioteca.concluidos.toString(), sub: 'Meta 2026', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50' },
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
                    <div className="flex gap-4">
                       <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-300" />
                          <Input placeholder="FILTRAR CCT..." className="h-8 pl-9 rounded-xl border-slate-200 text-[10px] font-bold bg-white w-48 shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                       </div>
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
                                       <Progress value={row.progress} className={cn("h-1.5", row.progress >= 100 ? "bg-emerald-100" : "bg-blue-100")} />
                                       <span className="text-[9px] font-black text-slate-600">{row.progress}%</span>
                                    </div>
                                 </TableCell>
                                 <TableCell className="text-right pr-8">
                                    <div className="flex justify-end gap-1">
                                       <button onClick={(e) => { e.stopPropagation(); setFormData({...row}); setEditingId(row.id!); setDialogSearchTerm(row.cct); setAsistentesLib(row.asistentes && row.asistentes.length > 0 ? row.asistentes : [{ rfc: '', nombres: '', paterno: '', materno: '', funcion: '', email: '', cct: '', schoolName: '' }]); setIsDialogOpen(true); }} className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-primary transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                                       <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id!); }} className="h-7 w-7 flex items-center justify-center text-rose-300 hover:text-rose-600 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
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
                    <CardDescription className="text-[10px] font-bold text-slate-400 uppercase mt-2">Seguimiento técnico individual</CardDescription>
                 </CardHeader>
                 <div className="p-8 space-y-6 flex-1 flex flex-col">
                    {!selectedBibliotecaRecord ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 space-y-4">
                        <ClipboardCheck className="h-12 w-12" />
                        <p className="text-[10px] font-black uppercase">Seleccione una escuela para ver su avance</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                           <p className="text-[9px] font-black text-primary uppercase">Plantel Seleccionado:</p>
                           <h4 className="text-sm font-black text-slate-800 uppercase leading-tight">{selectedBibliotecaRecord.schoolName}</h4>
                           <Badge className="bg-primary text-white text-[8px] font-mono">{selectedBibliotecaRecord.cct}</Badge>
                        </div>

                        <div className="flex-1 space-y-4 pt-4 overflow-y-auto pr-2 custom-scrollbar">
                           {BIBLIOTECA_FASES_LABELS.map((f, i) => {
                             const isCompleted = (selectedBibliotecaRecord.bibliotecaFases as any)?.[f.id];
                             return (
                               <div 
                                 key={f.id} 
                                 onClick={() => handleUpdatePhase(f.id, !isCompleted)}
                                 className={cn(
                                   "flex items-start gap-4 p-3 rounded-2xl border-2 transition-all cursor-pointer group",
                                   isCompleted ? "bg-emerald-50/30 border-emerald-100" : "bg-white border-slate-50 hover:border-primary/20"
                                 )}
                               >
                                  <div className={cn(
                                    "h-7 w-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all",
                                    isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-200 text-slate-300 group-hover:border-primary group-hover:text-primary"
                                  )}>
                                     {isCompleted ? <CheckCircle className="h-4 w-4" /> : <span className="text-[10px] font-black">{i + 1}</span>}
                                  </div>
                                  <p className={cn(
                                    "text-[9px] font-black uppercase leading-tight pt-1",
                                    isCompleted ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-600"
                                  )}>{f.label}</p>
                               </div>
                             )
                           })}
                        </div>
                      </>
                    )}
                 </div>
              </Card>
           </div>
        </div>
      ) : activeTab === 'ATRES' ? (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
           {bitacoraPendingCount > 0 && (
            <div className="bg-rose-600 text-white p-1 rounded-xl shadow-lg flex flex-row items-center justify-between gap-3 max-w-[240px] ml-auto mb-2 animate-bounce">
               <div className="flex items-center gap-2 pl-3">
                  <Bell className="h-3 w-3 text-white" />
                  <p className="text-[8px] font-black uppercase tracking-widest leading-none">{bitacoraPendingCount} PENDIENTES</p>
               </div>
               <Button onClick={() => setSearchTerm('pendiente')} className="bg-white text-rose-600 hover:bg-slate-100 font-black uppercase text-[7px] h-6 px-3 rounded-lg border-none">ATENDER</Button>
            </div>
           )}

           <Card className="executive-card p-6 bg-white border-none shadow-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><RotateCcw className="h-6 w-6" /></div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 uppercase">Bitácora de Solicitudes ATRES</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Histórico de Atención Técnica en la Nube</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="relative w-64 group">
                       <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-all" />
                       <Input placeholder="Buscar CCT o Folio..." className="h-11 pl-10 rounded-xl bg-slate-50 border-none shadow-inner text-xs font-bold uppercase" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <Button onClick={downloadExcelBitacora} variant="outline" className="h-11 px-6 rounded-xl border-emerald-200 text-emerald-700 font-black uppercase text-[10px] gap-2 hover:bg-emerald-50 shadow-md">
                      <FileSpreadsheet className="h-4 w-4" /> Exportar
                    </Button>
                 </div>
              </div>
           </Card>

           <Card className="executive-card p-0 shadow-2xl border-none overflow-hidden bg-white">
              <div className="overflow-x-auto w-full">
                <Table>
                  <TableHeader className="bg-slate-50 border-b">
                     <TableRow className="h-12">
                        <TableHead className="w-10 text-center pl-8"></TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-primary">Folio</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-primary">Fecha</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-primary">Plantel / CCT</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-primary min-w-[200px]">Acciones Técnicas</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-primary text-center">Analista</TableHead>
                        <TableHead className="text-right pr-10 text-[10px] font-black uppercase">Docs</TableHead>
                        <TableHead className="w-16"></TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBitacora.length > 0 ? filteredBitacora.map((r, idx) => (
                      <TableRow key={r.id || idx} className="h-16 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <TableCell className="pl-8 text-center"><TrafficLight status={r.status} /></TableCell>
                        <TableCell className="font-mono font-black text-[11px] text-primary">#{r.folio}</TableCell>
                        <TableCell className="text-[10px] font-bold text-slate-400">{r.fecha}</TableCell>
                        <TableCell>
                           <div className="flex flex-col">
                              <span className="text-[11px] font-black text-slate-700 uppercase leading-none truncate max-w-[180px]">{r.schoolName}</span>
                              <span className="text-[8px] font-mono text-primary mt-1">{r.cct}</span>
                           </div>
                        </TableCell>
                        <TableCell className="text-[10px] font-semibold text-slate-500 uppercase leading-tight line-clamp-2 max-w-[250px]">{r.servicio}</TableCell>
                        <TableCell className="text-center font-black text-[9px] text-slate-700 uppercase">{r.tecnico}</TableCell>
                        <TableCell className="text-right pr-4">
                           <div className="flex justify-end gap-1">
                              {r.pdfData && (
                                <button onClick={() => setBitacoraPdfToPreview(r.pdfData!)} className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-all"><FileText className="h-4 w-4" /></button>
                              )}
                           </div>
                        </TableCell>
                        <TableCell className="pr-10">
                           <div className="flex gap-1">
                              <button onClick={() => handleBitacoraEdit(r)} className="text-slate-400 hover:text-primary transition-all"><Pencil className="h-4 w-4" /></button>
                              <button onClick={() => handleBitacoraDelete(r.id!)} className="text-rose-300 hover:text-rose-600 transition-all"><Trash2 className="h-4 w-4" /></button>
                           </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={8} className="text-center py-24 opacity-30 text-xs font-black uppercase">Sin registros en bitácora</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
           </Card>
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
                      <Input placeholder="EJ. MARIA.LOPEZ" className="h-11 rounded-xl bg-white border-slate-200 font-bold lowercase pl-4" value={userPart} onChange={e => setUserPart(e.target.value)} />
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
      ) : activeTab === 'Geoposición' ? (
        <div className="space-y-6 animate-in fade-in duration-700 w-full min-h-[850px] flex flex-col">
          <Card className="p-5 rounded-[2.5rem] bg-white border-none shadow-xl flex flex-wrap items-end gap-6 shrink-0">
            <div className="flex-1 min-w-[200px] space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Rango de fechas</Label>
              <div className="relative group">
                <Input value="01/04/2025 - 15/04/2025" readOnly className="h-10 rounded-xl bg-slate-50 border-none shadow-inner font-bold text-xs pl-10" />
                <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-300" />
              </div>
            </div>
            <Button className="h-10 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] gap-2 shadow-lg"><RotateCcw className="h-4 w-4" /> Actualizar</Button>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden min-h-0">
            <Card className="lg:col-span-8 rounded-[3rem] border-none shadow-2xl overflow-hidden flex flex-col relative bg-slate-100">
               <div className="absolute inset-0 z-0">
                  <Image src="https://picsum.photos/seed/map-rastreo-v5/1200/800" alt="Mapa Rastreo" fill className="object-cover grayscale-[0.3] brightness-90" />
                  <div className="absolute top-[40%] left-[45%] h-8 w-8 bg-emerald-500 rounded-full border-4 border-white shadow-2xl flex items-center justify-center animate-bounce z-20"><div className="h-2 w-2 bg-white rounded-full" /></div>
               </div>
            </Card>

            <div className="lg:col-span-4 space-y-6 overflow-y-auto pr-2 custom-scrollbar flex flex-col">
               <Card className="p-8 rounded-[3rem] bg-white border-none shadow-2xl shrink-0">
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
                     <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><MapPin className="h-5 w-5" /></div>
                     <CardTitle className="text-base font-black text-slate-800 uppercase">Registrar Coordenadas</CardTitle>
                  </div>
                  <div className="space-y-6">
                     <div className="space-y-2 relative">
                        <Label className="text-[10px] font-black text-primary uppercase pl-1">CCT del Plantel *</Label>
                        <Input placeholder="15DES0000X" className="h-11 rounded-xl bg-slate-50 border-none shadow-inner font-mono font-black text-primary pl-10 uppercase" value={dialogSearchTerm} onChange={e => { setDialogSearchTerm(e.target.value); handleCctChange(e.target.value); setShowSearchResults(true); }} />
                        <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-300" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><Label className="text-[10px] font-black text-slate-400 pl-1 uppercase">Latitud</Label><Input placeholder="19.4326" className="h-10 bg-slate-50 border-none rounded-xl font-bold text-center" value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} /></div>
                        <div className="space-y-1"><Label className="text-[10px] font-black text-slate-400 pl-1 uppercase">Longitud</Label><Input placeholder="-99.1332" className="h-10 bg-slate-50 border-none rounded-xl font-bold text-center" value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} /></div>
                     </div>
                     <Button onClick={handleSave} className="w-full btn-institutional h-12 rounded-xl shadow-xl text-[10px] gap-2"><Save className="h-4 w-4" /> GUARDAR UBICACIÓN</Button>
                  </div>
               </Card>
            </div>
          </div>
        </div>
      ) : activeTab === 'Conoce mi Escuela' ? (
        <div className="flex flex-col flex-1 w-full h-[850px] overflow-hidden bg-white rounded-[3rem] shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-700">
           <div className="px-8 py-5 bg-slate-50 border-b flex flex-col md:flex-row items-center gap-6 shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 w-full">
                 <div className="space-y-1">
                    <Label className="text-[9px] font-black text-slate-400 uppercase pl-1">Identificador CCT</Label>
                    <Input placeholder="EJ. 15DES0000X" className="h-11 bg-white border-slate-200 rounded-xl font-mono font-bold uppercase text-xs shadow-sm" />
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[9px] font-black text-slate-400 uppercase pl-1">Zona / Municipio</Label>
                    <Select><SelectTrigger className="h-11 bg-white rounded-xl border-slate-200 text-xs font-bold uppercase"><SelectValue placeholder="FILTRAR..." /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="z1">ZONA 01</SelectItem><SelectItem value="m1">TOLUCA</SelectItem></SelectContent></Select>
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[9px] font-black text-slate-400 uppercase pl-1">Estado / Región</Label>
                    <Select><SelectTrigger className="h-11 bg-white rounded-xl border-slate-200 text-xs font-bold uppercase"><SelectValue placeholder="FILTRAR..." /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="e1">MÉXICO</SelectItem></SelectContent></Select>
                 </div>
                 <Button className="h-11 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] mt-5 shadow-lg gap-2">
                    <Search className="h-4 w-4" /> BUSCAR PLANTEL
                 </Button>
              </div>
           </div>

           <div className="flex-1 flex overflow-hidden">
              <div className="w-16 md:w-56 border-r bg-white flex flex-col p-4 shrink-0 overflow-y-auto custom-scrollbar">
                 <div className="space-y-2">
                    {[
                      { id: 'inicio', label: 'Inicio', icon: Home, active: true },
                      { id: 'buscar', label: 'Buscar escuela', icon: Search },
                      { id: 'mapa', label: 'Mapa Interactivo', icon: MapPin },
                      { id: 'stats', label: 'Analítica', icon: BarChart3 },
                      { id: 'config', label: 'Configuración', icon: Settings },
                    ].map(item => (
                      <button key={item.id} className={cn(
                        "w-full flex items-center gap-4 px-4 h-12 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest",
                        item.active ? "bg-primary/5 text-primary shadow-sm" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                      )}>
                         <item.icon className={cn("h-5 w-5", item.active ? "text-primary" : "text-slate-300")} />
                         <span className="hidden md:block">{item.label}</span>
                      </button>
                    ))}
                 </div>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30">
                 <div className="px-8 pt-8 grid grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
                    {[
                      { label: 'Escuelas registradas', value: '1,248', icon: School, color: 'text-blue-600', dot: 'bg-blue-600' },
                      { label: 'Directores / Responsables', value: '856', icon: UserCheck, color: 'text-emerald-600', dot: 'bg-emerald-600' },
                      { label: 'Municipios', value: '125', icon: MapPin, color: 'text-rose-900', dot: 'bg-rose-900' },
                      { label: 'Datos actualizados', value: '3,482', icon: FileText, color: 'text-cyan-600', dot: 'bg-cyan-600' },
                    ].map((stat, idx) => (
                      <Card key={idx} className="p-5 rounded-[2.5rem] bg-white border-none shadow-xl hover:scale-105 transition-all">
                         <div className="flex items-center gap-4 mb-4">
                            <div className={cn("h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shadow-inner", stat.color)}><stat.icon className="h-5 w-5" /></div>
                            <div>
                               <h4 className="text-xl font-black text-slate-800 leading-none">{stat.value}</h4>
                               <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-1">{stat.label}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", stat.dot)} />
                            <span className="text-[7px] font-black uppercase text-slate-400">Sincronizado</span>
                         </div>
                      </Card>
                    ))}
                 </div>

                 <div className="flex-1 p-8 overflow-hidden flex flex-col">
                    <Card className="flex-1 rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white flex flex-col relative group">
                       <div className="px-8 py-4 bg-white/90 backdrop-blur-md border-b flex justify-between items-center z-10">
                          <div className="flex items-center gap-3">
                             <Globe className="h-4 w-4 text-primary" />
                             <span className="text-[10px] font-black uppercase text-slate-700 tracking-widest">Vista Satelital Coees</span>
                          </div>
                          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl shadow-inner">
                             <button className="px-4 py-1.5 bg-white rounded-lg shadow-sm text-[8px] font-black uppercase text-primary">Mapa</button>
                             <button className="px-4 py-1.5 text-[8px] font-black uppercase text-slate-400 hover:text-slate-600">Lista</button>
                          </div>
                       </div>
                       
                       <div className="absolute inset-0 z-0">
                          <Image src="https://picsum.photos/seed/sat-map-v8/1200/800" alt="Mapa" fill className="object-cover brightness-105" />
                          <div className="absolute top-[40%] left-[45%] h-8 w-8 bg-emerald-500 rounded-full border-4 border-white shadow-2xl flex items-center justify-center animate-bounce z-20"><div className="h-2 w-2 bg-white rounded-full" /></div>
                          <div className="absolute top-[35%] left-[40%] bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-white z-30 animate-in fade-in zoom-in duration-700">
                             <div className="flex items-center gap-2 mb-1">
                                <Badge className="bg-emerald-500 text-white text-[7px] font-mono h-4 px-1.5">15DES0065B</Badge>
                                <span className="text-[8px] font-black text-emerald-600 uppercase">En línea</span>
                             </div>
                             <p className="text-[9px] font-black text-slate-800 uppercase leading-tight">Esc. Sec. Gral. Dr. Manuel Sandoval Vallarta</p>
                             <button className="text-[7px] font-black text-primary uppercase mt-2 flex items-center gap-1 hover:underline">Ver ficha técnica <ChevronRight className="h-2 w-2" /></button>
                          </div>
                       </div>

                       <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl p-4 rounded-[2rem] shadow-2xl border border-white/50 z-20 flex flex-wrap items-center justify-between gap-6">
                          <div className="flex items-center gap-8">
                             {[
                               { label: 'En línea', color: 'bg-emerald-500' },
                               { label: 'Sin geoposición', color: 'bg-rose-500' },
                               { label: 'En movimiento', color: 'bg-amber-500' },
                               { label: 'Atención técnica', color: 'bg-blue-600' },
                             ].map((l, idx) => (
                               <div key={idx} className="flex items-center gap-2">
                                  <div className={cn("h-2.5 w-2.5 rounded-full", l.color)} />
                                  <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">{l.label}</span>
                               </div>
                             ))}
                          </div>
                          <div className="flex items-center gap-4 border-l pl-6">
                             <p className="text-[8px] font-bold text-slate-400 uppercase">Coordenadas Actuales:</p>
                             <code className="text-[10px] font-mono font-black text-primary bg-primary/5 px-3 py-1 rounded-lg">19.4326° N, 99.1332° W</code>
                          </div>
                       </div>
                    </Card>
                 </div>
              </div>

              <div className="w-16 lg:w-[450px] border-l bg-white flex flex-col shrink-0 overflow-y-auto custom-scrollbar p-8 space-y-10">
                 <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b pb-2">
                       <Pencil className="h-5 w-5 text-accent" />
                       <h4 className="text-xs font-black text-accent tracking-widest uppercase">Captura Técnica de Plantel</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1 col-span-2">
                          <Label className="text-[9px] font-black text-slate-400 uppercase pl-1">Nombre de la escuela</Label>
                          <Input className="h-10 bg-slate-50 border-none rounded-xl font-bold uppercase" placeholder="EJ. ESCUELA SECUNDARIA 100" />
                       </div>
                       <div className="space-y-1">
                          <Label className="text-[9px] font-black text-slate-400 uppercase pl-1">CCT</Label>
                          <Input className="h-10 bg-slate-50 border-none rounded-xl font-mono font-black text-primary" placeholder="15DES0000X" />
                       </div>
                       <div className="space-y-1">
                          <Label className="text-[9px] font-black text-slate-400 uppercase pl-1">Zona Escolar</Label>
                          <Input className="h-10 bg-slate-50 border-none rounded-xl font-bold" placeholder="EJ. 01" />
                       </div>
                       <div className="space-y-1">
                          <Label className="text-[9px] font-black text-slate-400 uppercase pl-1">Municipio</Label>
                          <Input className="h-10 bg-slate-50 border-none rounded-xl font-bold uppercase" placeholder="TOLUCA" />
                       </div>
                       <div className="space-y-1">
                          <Label className="text-[9px] font-black text-slate-400 uppercase pl-1">Teléfono</Label>
                          <Input className="h-10 bg-slate-50 border-none rounded-xl font-mono" placeholder="722 000 0000" />
                       </div>
                       <div className="space-y-1 col-span-2">
                          <Label className="text-[9px] font-black text-slate-400 uppercase pl-1">Correo Electrónico Oficial</Label>
                          <Input className="h-10 bg-slate-50 border-none rounded-xl font-bold" placeholder="escuela@desysa.edu.mx" />
                       </div>
                       <div className="space-y-1">
                          <Label className="text-[9px] font-black text-slate-400 uppercase pl-1">Latitud</Label>
                          <Input className="h-10 bg-slate-50 border-none rounded-xl font-bold text-center" placeholder="19.4326" />
                       </div>
                       <div className="space-y-1">
                          <Label className="text-[9px] font-black text-slate-400 uppercase pl-1">Longitud</Label>
                          <Input className="h-10 bg-slate-50 border-none rounded-xl font-bold text-center" placeholder="-99.1332" />
                       </div>
                    </div>
                    <div className="flex gap-4 pt-2">
                       <Button className="flex-1 btn-institutional h-11 text-[10px] shadow-xl">Guardar escuela</Button>
                       <Button variant="outline" className="h-11 px-6 rounded-xl border-slate-200 text-slate-400 font-black text-[10px]">Limpiar</Button>
                    </div>
                 </div>

                 <div className="space-y-6 pt-10 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <ClipboardCheck className="h-5 w-5 text-primary" />
                          <h4 className="text-xs font-black text-primary tracking-widest uppercase">Datos de la Escuela</h4>
                       </div>
                       <Badge className="bg-emerald-100 text-emerald-700 border-none text-[8px] font-black uppercase px-3 h-5 rounded-full">En línea</Badge>
                    </div>

                    <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-slate-50 group">
                       <Image src="https://picsum.photos/seed/school-fachada-v3/800/600" alt="Escuela Fachada" fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                          <h5 className="text-white text-sm font-black uppercase leading-tight">Dr. Manuel Sandoval Vallarta</h5>
                          <p className="text-white/70 text-[9px] font-bold uppercase tracking-widest mt-1">Amecameca de Juárez, Méx.</p>
                       </div>
                    </div>

                    <div className="space-y-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                       {[
                         { label: 'Clave CCT:', value: '15DES0065B', icon: Tag },
                         { label: 'Dirección:', value: 'Calle Xicotencatl s/n, Centro', icon: MapPin },
                         { label: 'Teléfono:', value: '597 978 0731', icon: Phone },
                         { label: 'E-mail:', value: 'sandoval.vallarta@desysa.edu.mx', icon: Mail },
                       ].map((item, idx) => (
                         <div key={idx} className="flex items-start gap-4">
                            <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm shrink-0 mt-0.5"><item.icon className="h-3.5 w-3.5" /></div>
                            <div className="flex flex-col">
                               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                               <span className="text-[10px] font-bold text-slate-700 uppercase leading-tight mt-0.5">{item.value}</span>
                            </div>
                         </div>
                       ))}
                    </div>

                    <Button variant="ghost" className="w-full text-[9px] font-black uppercase text-slate-400 hover:text-primary gap-2 transition-all">Ver reporte completo de auditoría <ChevronRight className="h-3 w-3" /></Button>
                 </div>
              </div>
           </div>
        </div>
      ) : (
        <Card className="executive-card p-0 shadow-2xl border-none overflow-hidden bg-white animate-in slide-in-from-bottom-4 duration-500 w-full min-h-[400px]">
          <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50/50">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Briefcase className="h-5 w-5" /></div>
                <div><h3 className="text-sm font-black uppercase text-slate-800">{activeTab}</h3><p className="text-[9px] font-bold text-slate-400 uppercase">Gestión de Rubro Técnico</p></div>
             </div>
             <div className="flex items-center gap-4">
                <div className="relative w-full sm:w-64">
                   <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
                   <Input placeholder="Buscar..." className="h-9 pl-9 rounded-xl border-slate-200 text-xs font-bold bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
             </div>
          </div>
          <div className="overflow-x-auto w-full">
            <Table className="w-full">
              <TableHeader className="bg-slate-50 border-b">
                 <TableRow className="h-12">
                    <TableHead className="w-12 text-[10px] font-bold pl-8 uppercase">#</TableHead>
                    <TableHead className="text-[10px] font-bold text-primary w-[110px] uppercase">CCT</TableHead>
                    <TableHead className="text-[10px] font-bold text-primary min-w-[200px] uppercase">Identificación Oficial</TableHead>
                    <TableHead className="text-[10px] font-bold text-primary w-[100px] uppercase text-center">Estatus</TableHead>
                    <TableHead className="text-right text-[10px] font-bold pr-10 w-24 uppercase">Acción</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 opacity-30"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /><p className="text-[10px] font-black uppercase">Sincronizando...</p></TableCell></TableRow>
                ) : filteredRecords.length > 0 ? filteredRecords.map((rec, idx) => (
                  <TableRow key={rec.id || idx} className="hover:bg-slate-50 border-b border-slate-50 h-14 transition-colors">
                    <TableCell className="pl-8 font-bold text-[10px] text-slate-300">{idx + 1}</TableCell>
                    <TableCell className="font-mono font-bold text-[11px] text-primary">{rec.cct}</TableCell>
                    <TableCell className="py-2 min-w-0"><div className="flex flex-col"><span className="text-[12px] font-bold text-slate-700 leading-tight truncate uppercase">{rec.schoolName || rec.userName}</span><span className="text-[9px] font-bold text-muted-foreground opacity-70 truncate uppercase">{rec.municipio} • {rec.valle}</span></div></TableCell>
                    <TableCell className="text-center">
                       <Badge variant="outline" className={cn("text-[8px] font-bold px-2 h-5 rounded-full border-2 uppercase", rec.status === 'activo' || rec.status === 'Activa' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200")}>{rec.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setFormData({...rec}); setEditingId(rec.id!); setDialogSearchTerm(rec.cct); setAsistentesLib(rec.asistentes && rec.asistentes.length > 0 ? rec.asistentes : [{ rfc: '', nombres: '', paterno: '', materno: '', funcion: '', email: '', cct: '', schoolName: '' }]); setShowSearchResults(false); setIsDialogOpen(true); }} className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(rec.id!)} className="h-8 w-8 flex items-center justify-center text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (<TableRow><TableCell colSpan={6} className="text-center py-20 opacity-30 text-xs font-bold uppercase">Sin registros oficiales</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Diálogo de Formulario Principal */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!isSaving) { setIsDialogOpen(open); if(!open) resetForm(); } }}>
        <DialogContent className="w-[98vw] lg:max-w-[1200px] h-[92vh] rounded-[2.5rem] p-0 overflow-hidden bg-white flex flex-col border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white shrink-0 flex flex-row justify-between items-center pr-10">
             <DialogTitle className="font-black text-lg uppercase">Gestión Técnica: {activeTab}</DialogTitle>
             <button onClick={() => setIsDialogOpen(false)} className="h-10 w-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-all"><X className="h-6 w-6" /></button>
          </DialogHeader>

          {activeTab === 'Biblioteca Digital' ? (
            <Tabs defaultValue="datos" className="flex-1 flex flex-col overflow-hidden">
               <div className="px-8 border-b bg-slate-50/50">
                  <TabsList className="bg-transparent h-14 p-0 gap-8">
                     <TabsTrigger value="datos" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all">1. Datos del Plantel y Fases</TabsTrigger>
                     <TabsTrigger 
                        value="asistentes" 
                        disabled={(formData.bibliotecaFases?.personalCapacitado || 0) < 1}
                        className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all disabled:opacity-30"
                      >
                        2. Captura de Personal {(formData.bibliotecaFases?.personalCapacitado || 0) >= 1 && <Badge className="ml-2 bg-primary text-white text-[8px]">{asistentesLib.filter(a => a.rfc).length}</Badge>}
                     </TabsTrigger>
                  </TabsList>
               </div>

               <div className="flex-1 overflow-hidden">
                  <TabsContent value="datos" className="h-full m-0 p-0">
                     <ScrollArea className="h-full">
                        <div className="p-10 space-y-10 max-w-5xl mx-auto">
                           <div className={cn("bg-slate-50 p-8 rounded-[2.5rem] border-2 transition-all space-y-6 shadow-inner", !formData.cct ? "border-rose-200" : "border-primary/10")}>
                              <Label className="text-[11px] font-black text-primary tracking-widest block pl-1 uppercase">Buscador de Plantel (CCT)</Label>
                              <div className="relative">
                                 <input placeholder="INGRESAR CCT..." className="h-14 w-full rounded-2xl bg-white border border-primary/20 font-bold text-xl uppercase shadow-lg pl-6 focus:outline-none focus:ring-2 focus:ring-primary/20" value={dialogSearchTerm} onChange={(e) => { setDialogSearchTerm(e.target.value); handleCctChange(e.target.value); setShowSearchResults(true); }} />
                                 {showSearchResults && dialogSearchTerm.length > 2 && (
                                    <div className="absolute top-18 left-0 right-0 max-h-60 overflow-auto bg-white border rounded-2xl shadow-2xl z-[100] divide-y">
                                       {schoolSearchResults.map((s, sidx) => (
                                          <div key={`${s.cct}-${s.turno}-${sidx}`} className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center group transition-all" onClick={() => handleCctChange(s.cct)}>
                                             <div className="flex flex-col"><span className="text-sm font-bold uppercase truncate group-hover:text-primary transition-colors">{s.nombre}</span><span className="text-[10px] font-mono text-muted-foreground">{s.cct} • {s.municipio} • {s.turno}</span></div>
                                             <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-all" />
                                          </div>
                                       ))}
                                       {schoolSearchResults.length === 0 && (
                                          <div className="p-6 text-center">
                                             <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">CCT NO REGISTRADO EN BASE MAESTRA</p>
                                             <Button onClick={() => { setQuickAddForm({...quickAddForm, cct: dialogSearchTerm.toUpperCase()}); setIsQuickAddOpen(true); }} variant="outline" className="h-10 px-8 rounded-xl text-[10px] font-black uppercase border-primary/20 text-primary hover:bg-primary/5">
                                                <Plus className="h-4 w-4 mr-2" /> Alta Rápida de CCT
                                             </Button>
                                          </div>
                                       )}
                                    </div>
                                 )}
                              </div>
                              {formData.cct && (
                                 <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-emerald-100 shadow-sm animate-in zoom-in-95">
                                    <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner"><School className="h-6 w-6" /></div>
                                    <div className="flex-1 min-w-0"><h4 className="text-sm font-black uppercase text-slate-800 truncate">{formData.schoolName}</h4><p className="text-[9px] font-mono font-bold text-emerald-700">{formData.cct} • {formData.municipio}</p></div>
                                 </div>
                              )}
                           </div>

                           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 space-y-8">
                              <div className="flex items-center gap-3 border-b pb-2"><ClipboardCheck className="h-5 w-5 text-accent" /><h4 className="text-xs font-black uppercase text-accent tracking-widest">Fases de Implementación</h4></div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 bg-slate-50 p-6 rounded-[2rem] border">
                                 {BIBLIOTECA_FASES_LABELS.map((fase) => (
                                    <div key={fase.id} className="flex items-center space-x-3 group cursor-pointer" onClick={() => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, [fase.id]: !((formData.bibliotecaFases as any)[fase.id])}})}>
                                       <Checkbox id={fase.id} checked={(formData.bibliotecaFases as any)?.[fase.id]} onCheckedChange={() => {}} className="h-5 w-5 border-primary/30" />
                                       <Label className="text-[10px] font-bold text-slate-600 uppercase group-hover:text-primary transition-colors cursor-pointer leading-tight">{fase.label}</Label>
                                    </div>
                                 ))}
                              </div>
                              <div className="grid grid-cols-2 gap-8 pt-4">
                                 <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-primary">Personal Capacitado</Label>
                                    <Input type="number" className="h-12 bg-slate-50 border-none rounded-xl font-black text-center text-xl" value={formData.bibliotecaFases?.personalCapacitado} onChange={e => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, personalCapacitado: parseInt(e.target.value) || 0}})} />
                                 </div>
                                 <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-primary">Equipos Habilitados</Label>
                                    <Input type="number" className="h-12 bg-slate-50 border-none rounded-xl font-black text-center text-xl" value={formData.bibliotecaFases?.equiposHabilitados} onChange={e => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, equiposHabilitados: parseInt(e.target.value) || 0}})} />
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-2">
                              <Label className="text-[10px] font-black text-primary pl-1 uppercase">Observaciones Técnicas</Label>
                              <Textarea className="min-h-[140px] bg-slate-50 border-none rounded-[1.5rem] p-6 text-sm font-semibold shadow-inner focus:bg-white transition-all uppercase" value={formData.observaciones || ''} onChange={e => setFormData({...formData, observaciones: e.target.value.toUpperCase()})} />
                           </div>
                        </div>
                     </ScrollArea>
                  </TabsContent>
                  <TabsContent value="asistentes" className="h-full m-0 p-8 flex flex-col">
                     <div className="flex justify-between items-center mb-6">
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4 shadow-sm">
                           <CheckCircle2 className="h-6 w-6 text-blue-600" />
                           <p className="text-[10px] font-black text-blue-800 uppercase leading-relaxed">Registro de Asistentes: Ingrese los datos oficiales del personal que recibió la capacitación técnica.</p>
                        </div>
                        <Button onClick={addAsistenteRow} className="gap-2 font-black uppercase text-[11px] h-12 px-8 shadow-md"><Plus className="h-5 w-5" /> Añadir Servidor Público</Button>
                     </div>
                     <div className="flex-1 overflow-hidden border-2 border-slate-100 rounded-[2rem] shadow-2xl bg-white">
                        <ScrollArea className="h-full">
                           <div className="w-full overflow-x-auto">
                              <Table className="min-w-[1000px]">
                                 <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                    <TableRow>
                                       <TableHead className="w-12 text-[10px] font-black uppercase text-center">#</TableHead>
                                       <TableHead className="w-[300px] text-[10px] font-black uppercase">Apellidos y Nombre(s)</TableHead>
                                       <TableHead className="w-[150px] text-[10px] font-black uppercase">RFC Oficial</TableHead>
                                       <TableHead className="w-[200px] text-[10px] font-black uppercase">Función</TableHead>
                                       <TableHead className="w-[150px] text-[10px] font-black uppercase">CCT de Origen</TableHead>
                                       <TableHead className="w-16 sticky right-0 bg-slate-50"></TableHead>
                                    </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                    {asistentesLib.map((ast, idx) => (
                                       <TableRow key={idx} className="hover:bg-slate-50/50">
                                          <TableCell className="text-center font-black text-xs text-muted-foreground">{idx + 1}</TableCell>
                                          <TableCell className="p-2">
                                             <div className="grid grid-cols-1 gap-1">
                                                <Input placeholder="PATERNO" className="h-8 text-[9px] uppercase" value={ast.paterno} onChange={e => updateAsistente(idx, 'paterno', e.target.value)} />
                                                <Input placeholder="MATERNO" className="h-8 text-[9px] uppercase" value={ast.materno} onChange={e => updateAsistente(idx, 'materno', e.target.value)} />
                                                <Input placeholder="NOMBRE(S)" className="h-8 text-[10px] uppercase font-black text-primary border-primary/20 bg-primary/5" value={ast.nombres} onChange={e => updateAsistente(idx, 'nombres', e.target.value)} />
                                             </div>
                                          </TableCell>
                                          <TableCell className="p-2"><Input placeholder="13 DÍGITOS" className="h-9 text-[11px] font-mono uppercase font-black" value={ast.rfc} onChange={e => updateAsistente(idx, 'rfc', e.target.value)} maxLength={13} /></TableCell>
                                          <TableCell className="p-2">
                                             <Select value={ast.funcion} onValueChange={(val: any) => updateAsistente(idx, 'funcion', val)}>
                                                <SelectTrigger className="h-9 text-[9px] font-bold uppercase"><SelectValue placeholder="FUNCIÓN..." /></SelectTrigger>
                                                <SelectContent>{FUNCIONES_BIBLIOTECA.map(f => (<SelectItem key={f} value={f} className="text-[10px] font-bold uppercase">{f}</SelectItem>))}</SelectContent>
                                             </Select>
                                          </TableCell>
                                          <TableCell className="p-2">
                                             <Input placeholder="15DES0000X" className="h-9 text-[11px] font-mono font-black uppercase border-primary/30" value={ast.cct} onChange={e => updateAsistente(idx, 'cct', e.target.value)} maxLength={10} />
                                             {ast.schoolName && <p className="text-[7px] font-black text-emerald-600 mt-1 uppercase truncate">{ast.schoolName}</p>}
                                          </TableCell>
                                          <TableCell className="p-2 sticky right-0 bg-white shadow-l"><Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600" onClick={() => removeAsistenteRow(idx)} disabled={asistentesLib.length === 1}><Trash2 className="h-4 w-4" /></Button></TableCell>
                                       </TableRow>
                                    ))}
                                 </TableBody>
                              </Table>
                           </div>
                        </ScrollArea>
                     </div>
                  </TabsContent>
               </div>
            </Tabs>
          ) : (
            <div className="flex-1 overflow-hidden">
               <ScrollArea className="h-full">
                  <div className="p-10 space-y-10 max-w-4xl mx-auto">
                     <div className={cn("bg-slate-50 p-8 rounded-[2.5rem] border-2 transition-all space-y-6 shadow-inner", !formData.cct ? "border-rose-200" : "border-primary/10")}>
                        <Label className="text-[11px] font-black text-primary tracking-widest block pl-1 uppercase">Buscador de Plantel (CCT)</Label>
                        <div className="relative">
                           <input placeholder="INGRESAR CCT..." className="h-14 w-full rounded-2xl bg-white border border-primary/20 font-bold text-xl uppercase shadow-lg pl-6 focus:outline-none focus:ring-2 focus:ring-primary/20" value={dialogSearchTerm} onChange={(e) => { setDialogSearchTerm(e.target.value); handleCctChange(e.target.value); setShowSearchResults(true); }} />
                           {showSearchResults && dialogSearchTerm.length > 2 && (
                              <div className="absolute top-18 left-0 right-0 max-h-60 overflow-auto bg-white border rounded-2xl shadow-2xl z-[100] divide-y">
                                 {schoolSearchResults.map((s, sidx) => (
                                    <div key={`${s.cct}-${s.turno}-${sidx}`} className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center group transition-all" onClick={() => handleCctChange(s.cct)}>
                                       <div className="flex flex-col"><span className="text-sm font-bold uppercase truncate group-hover:text-primary transition-colors">{s.nombre}</span><span className="text-[10px] font-mono text-muted-foreground">{s.cct} • {s.municipio} • {s.turno}</span></div>
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
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black text-primary pl-1 uppercase">Observaciones Técnicas</Label>
                        <Textarea className="min-h-[140px] bg-white border-slate-200 rounded-[1.5rem] p-6 text-sm font-semibold shadow-sm focus:ring-4 focus:ring-primary/5 transition-all uppercase" value={formData.observaciones || ''} onChange={e => setFormData({...formData, observaciones: e.target.value.toUpperCase()})} />
                     </div>
                  </div>
               </ScrollArea>
            </div>
          )}

          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4 shrink-0">
             <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSaving} className="h-12 px-8 rounded-xl font-bold text-xs uppercase">Cancelar</Button>
             <Button onClick={handleSave} disabled={isSaving} className="btn-institutional h-12 px-12 text-xs gap-3 rounded-xl shadow-2xl">
               {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5" />} GUARDAR
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Alta Rápida de CCT */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white z-[300]">
          <DialogHeader className="p-6 bg-[#B38E5D] text-white">
            <DialogTitle className="uppercase font-black text-lg flex items-center gap-3"><PlusCircle className="h-6 w-6" /> Registro de Nuevo CCT</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">CCT (10 Dígitos)</Label>
                  <Input value={quickAddForm.cct} onChange={e => setQuickAddForm({...quickAddForm, cct: e.target.value.toUpperCase()})} maxLength={10} className="font-mono font-black border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Nombre del Plantel</Label>
                  <Input value={quickAddForm.nombre} onChange={e => setQuickAddForm({...quickAddForm, nombre: e.target.value.toUpperCase()})} className="font-black border-slate-200" />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Municipio</Label>
                  <Input value={quickAddForm.municipio} onChange={e => setQuickAddForm({...quickAddForm, municipio: e.target.value.toUpperCase()})} className="font-bold uppercase border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Valle</Label>
                  <Select value={quickAddForm.valle} onValueChange={v => setQuickAddForm({...quickAddForm, valle: v})}>
                    <SelectTrigger className="font-bold border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEXICO">MÉXICO</SelectItem>
                      <SelectItem value="TOLUCA">TOLUCA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-3"><Button variant="ghost" onClick={() => setIsQuickAddOpen(false)} className="h-12 px-8 text-[10px] font-black uppercase">Cancelar</Button><Button onClick={handleQuickAddCct} className="bg-primary text-white h-12 px-12 rounded-xl text-[10px] font-black uppercase shadow-lg">Registrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visor de PDF para Bitácora */}
      <Dialog open={!!bitacoraPdfToPreview} onOpenChange={() => setBitacoraPdfToPreview(null)}>
        <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white shrink-0">
             <DialogTitle className="uppercase font-black">Documento Digital</DialogTitle>
          </DialogHeader>
          <div className="flex-1 bg-slate-800 p-1">
             <iframe src={bitacoraPdfToPreview || ''} className="w-full h-full border-none rounded-xl bg-white" title="PDF Preview" />
          </div>
          <DialogFooter className="p-4 bg-slate-50 border-t shrink-0">
             <Button variant="ghost" onClick={() => setBitacoraPdfToPreview(null)} className="h-10 px-10 font-black uppercase text-[10px]">CERRAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
