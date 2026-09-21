
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
  Building2,
  Eye,
  ImageIcon,
  Archive,
  Upload,
  FileText,
  TrendingUp,
  Settings,
  MonitorCheck,
  ClipboardCheck,
  User,
  Settings2,
  Users,
  Laptop,
  X,
  RotateCcw,
  SearchCode,
  MapPin,
  Globe,
  Navigation,
  Activity,
  Info,
  Map as MapIcon,
  Layers,
  Circle,
  Table as TableIcon,
  Phone
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
  Timestamp,
} from 'firebase/firestore'
import { type ProgramStatus } from '@/lib/planning-data'
import { schoolsDirectory, type SchoolInfo } from "@/lib/schools-directory"
import { format } from 'date-fns'

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

const FUNCIONES = [
  "PAAE",
  "DOCENTE",
  "DIRECTIVO",
  "JEFE DE ENSEÑANZA",
  "SUPERVISOR",
  "ASESOR TECNICO PEDAGOGICO"
]

const BIBLIOTECA_FASES = [
  { id: 'fase1', label: 'Fase 1. Solicitud de instalación de biblioteca digital', progress: 11, color: 'bg-blue-100 text-blue-700' },
  { id: 'fase2', label: 'Fase 2. Atención al CCT', progress: 22, color: 'bg-emerald-100 text-emerald-700' },
  { id: 'fase3', label: 'Fase 3. Diagnóstico del equipo de cómputo existente', progress: 33, color: 'bg-indigo-100 text-indigo-700' },
  { id: 'fase4', label: 'Fase 4. Instalación total de los contenidos del proyecto', progress: 44, color: 'bg-amber-100 text-amber-700' },
  { id: 'fase5', label: 'Fase 5. Funcionalidad (pruebas de uso y manejo)', progress: 56, color: 'bg-green-100 text-green-700' },
  { id: 'fase6', label: 'Fase 6. Guía orientación de uso y manejo de la herramienta', progress: 67, color: 'bg-violet-100 text-violet-700' },
  { id: 'fase7', label: 'Fase 7. Seguimiento técnico al CCT', progress: 78, color: 'bg-sky-100 text-sky-700' },
  { id: 'fase8', label: 'Fase 8. Total de personal capacitado', progress: 89, color: 'bg-orange-100 text-orange-700' },
  { id: 'fase9', label: 'Fase 9. Total de equipos habilitados', progress: 100, color: 'bg-emerald-600 text-white' }
];

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [activeTab, setActiveTab] = useState('Cuentas Institucionales')
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogSearchTerm, setDialogSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCctId, setSelectedCctId] = useState<string | null>(null)
  
  // States for the searchable select in sidebar
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState('')
  const [isSidebarResultsOpen, setIsSidebarResultsOpen] = useState(false)

  const [verifyInput, setVerifyInput] = useState('')
  const [verificationResult, setVerificationResult] = useState<ProgramStatus | null>(null)

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddForm, setQuickAddForm] = useState<SchoolInfo>({
    region: '', valle: 'MEXICO', municipio: '', subsistema: 'FEDERALIZADO', control: 'OFICIAL',
    nivel: 'SECUNDARIA', servicioEducativo: 'SECUNDARIA GENERAL', cct: '', turno: 'MATUTINO',
    nombre: '', domicilio: '', localidad: '', telefono: '', zonaEscolar: '', sector: '',
    director: '', hombres: 0, mujeres: 0, alumnos: 0, grupos: 0, maestros: 0, administrativos: 0,
    aulasExistentes: 0, aulasEnUso: 0, modalidad: 'DES'
  })

  const [accountForm, setAccountForm] = useState({
    name: '', username: '', domain: '@coees.edu.mx', area: '', notes: ''
  })

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
    },
    mantenimientoFicha: {
      equipoTecnologico: { hdt: false, equipoComputo: false, otro: '' },
      equiposList: Array(10).fill({ equipo: '', marca: '', serie: '', censal: '' }),
      fallaIdentificada: '',
      servicioRealizado: '',
      observaciones: ''
    }
  }

  const [formData, setFormData] = useState<ProgramStatus>(initialFormState)
  const [assistants, setAssistants] = useState<AssistantEntry[]>([
    { paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '' }
  ])
  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([])

  useEffect(() => {
    setMounted(true)
    const q = query(collection(db, 'programs'), orderBy('updatedAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as ProgramStatus[];
      setRecords(data)
      if (data.length > 0 && !selectedCctId) {
        const firstBD = data.find(r => r.name === 'Biblioteca Digital');
        if (firstBD) {
          setSelectedCctId(firstBD.id!);
          setSidebarSearchTerm(firstBD.cct);
        }
      }
    })
    
    const storedSchools = JSON.parse(localStorage.getItem('schools_master_full_v21') || '[]');
    setAllSchools(storedSchools.length > 0 ? storedSchools : schoolsDirectory);
    
    return () => unsubscribe();
  }, [selectedCctId])

  const accountsRecords = useMemo(() => 
    records.filter(r => r.name === 'Cuentas Institucionales').sort((a, b) => {
      const dateA = a.updatedAt instanceof Timestamp ? a.updatedAt.toMillis() : 0;
      const dateB = b.updatedAt instanceof Timestamp ? b.updatedAt.toMillis() : 0;
      return dateB - dateA;
    }), 
  [records]);

  const bibliotecaRecords = useMemo(() => 
    records.filter(r => r.name === 'Biblioteca Digital'), 
  [records]);

  const geoRecords = useMemo(() => 
    records.filter(r => r.name === 'Geoposición'), 
  [records]);

  const selectedRecord = useMemo(() => 
    bibliotecaRecords.find(r => r.id === selectedCctId),
  [bibliotecaRecords, selectedCctId]);

  const stats = useMemo(() => {
    const totalBD = bibliotecaRecords.length;
    const concluidos = bibliotecaRecords.filter(r => r.progress === 100).length;
    const proceso = totalBD - concluidos;
    
    const atenciones = totalBD > 0 ? bibliotecaRecords.reduce((acc, r) => acc + (r.progress > 0 ? 1 : 0), 0) : 0;
    const evidencias = totalBD > 0 ? bibliotecaRecords.reduce((acc, r) => acc + (r.evidencePhotos?.length || 0) + (r.reportPdf ? 1 : 0), 0) : 0;
    const tecnicos = totalBD > 0 ? new Set(bibliotecaRecords.map(r => r.userName).filter(Boolean)).size : 0;

    return { total: totalBD, concluidos, proceso, visitas: totalBD, atenciones, evidencias, tecnicos };
  }, [bibliotecaRecords]);

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
    } else {
      setFormData(prev => ({ ...prev, schoolName: 'NOMBRE DEL PLANTEL' }))
    }
  }

  const handleQuickAddCct = () => {
    if (!quickAddForm.cct || !quickAddForm.nombre || !quickAddForm.municipio) {
      toast({ variant: "destructive", title: "Faltan datos", description: "CCT, Nombre y Municipio son obligatorios." }); 
      return;
    }
    const newSchool: SchoolInfo = { 
      ...quickAddForm, 
      cct: quickAddForm.cct.toUpperCase(), 
      nombre: quickAddForm.nombre.toUpperCase(), 
      municipio: quickAddForm.municipio.toUpperCase(),
      valle: quickAddForm.valle.toUpperCase(),
      region: quickAddForm.region.toUpperCase(),
      zonaEscolar: quickAddForm.zonaEscolar.toUpperCase(),
      sector: quickAddForm.sector.toUpperCase(),
      modalidad: quickAddForm.modalidad.toUpperCase()
    };
    const updated = [newSchool, ...allSchools];
    setAllSchools(updated);
    localStorage.setItem('schools_master_full_v21', JSON.stringify(updated));
    
    setFormData(prev => ({ 
      ...prev, 
      cct: newSchool.cct, 
      schoolName: newSchool.nombre, 
      municipio: newSchool.municipio, 
      valle: newSchool.valle, 
      region: newSchool.region, 
      zonaEscolar: newSchool.zonaEscolar, 
      sector: newSchool.sector, 
      modalidad: newSchool.modalidad 
    }))

    setIsQuickAddOpen(false);
    setDialogSearchTerm('');
    toast({ title: "Plantel Registrado", description: "El CCT ha sido añadido y cargado en el formulario." });
  }

  const handleSave = () => {
    setIsSaving(true);
    const isAccounts = activeTab === 'Cuentas Institucionales';
    const isGeo = activeTab === 'Geoposición';
    const isKnowledge = activeTab === 'Conoce mi Escuela';
    const validAssistants = assistants.filter(a => a.rfc && a.nombres);
    
    const body: any = { 
      name: activeTab,
      userName: isAccounts ? accountForm.name.toUpperCase() : (formData.userName || ''),
      departamento: isAccounts ? accountForm.area.toUpperCase() : (formData.departamento || ''),
      cct: isAccounts ? '' : (formData.cct || ''),
      schoolName: isAccounts ? '' : (formData.schoolName || ''),
      municipio: isAccounts ? '' : (formData.municipio || ''),
      valle: isAccounts ? '' : (formData.valle || ''),
      region: isAccounts ? '' : (formData.region || ''),
      zonaEscolar: isAccounts ? '' : (formData.zonaEscolar || ''),
      sector: isAccounts ? '' : (formData.sector || ''),
      modalidad: isAccounts ? '' : (formData.modalidad || ''),
      latitud: isGeo || isKnowledge ? formData.latitud : (formData.latitud || ''),
      longitud: isGeo || isKnowledge ? formData.longitud : (formData.longitud || ''),
      progress: isAccounts || isGeo || isKnowledge ? 100 : (formData.progress || 0),
      status: formData.status || 'activo',
      date: isAccounts || isGeo || isKnowledge ? format(new Date(), 'dd/MM/yyyy HH:mm') : (formData.date || new Date().toISOString().split('T')[0]),
      email: isAccounts ? `${accountForm.username.toLowerCase()}${accountForm.domain}` : (formData.email || ''),
      observaciones: isAccounts ? accountForm.notes.toUpperCase() : (formData.observaciones || ''),
      updatedAt: serverTimestamp(),
      bibliotecaFases: isAccounts || isGeo || isKnowledge ? null : (formData.bibliotecaFases || null),
      mantenimientoFicha: isAccounts || isGeo || isKnowledge ? null : (formData.mantenimientoFicha || null),
      asistentes: validAssistants
    };

    if (editingId) {
      updateDoc(doc(db, 'programs', editingId), body).then(() => {
        toast({ title: "Registro Actualizado" });
        setIsSaving(false); setIsDialogOpen(false); resetForm();
      });
    } else {
      addDoc(collection(db, 'programs'), { ...body, createdAt: serverTimestamp() }).then(() => {
        toast({ title: "Registro Guardado" });
        setIsSaving(false); setIsDialogOpen(false); resetForm();
      });
    }
  }

  const handleVerifyEmail = () => {
    if (!verifyInput.trim()) return;
    const found = accountsRecords.find(r => r.email?.toLowerCase() === verifyInput.toLowerCase());
    if (found) {
      setVerificationResult(found);
      toast({ title: "Correo Encontrado" });
    } else {
      setVerificationResult(null);
      toast({ variant: "destructive", title: "Sin resultados", description: "El correo no existe en la base de datos." });
    }
  }

  const resetForm = () => { 
    setFormData(initialFormState); 
    setAssistants([{ paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '' }]);
    setAccountForm({ name: '', username: '', domain: '@coees.edu.mx', area: '', notes: '' });
    setEditingId(null); 
    setDialogSearchTerm('');
    setVerifyInput('');
    setVerificationResult(null);
  }

  const handleEdit = (rec: ProgramStatus) => { 
    setFormData({...rec}); 
    if (rec.name === 'Cuentas Institucionales') {
      const emailParts = (rec.email || '').split('@');
      setAccountForm({
        name: rec.userName || '',
        username: emailParts[0] || '',
        domain: `@${emailParts[1]}` || '@coees.edu.mx',
        area: rec.departamento || '',
        notes: rec.observaciones || ''
      });
    }
    if (rec.asistentes && rec.asistentes.length > 0) {
      setAssistants(rec.asistentes);
    }
    setEditingId(rec.id!); 
    setIsDialogOpen(true);
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Eliminar registro?")) deleteDoc(doc(db, 'programs', id));
  }

  const getFaseActual = (fases: any) => {
    if (!fases) return BIBLIOTECA_FASES[0];
    for (let i = BIBLIOTECA_FASES.length - 1; i >= 0; i--) {
      if (fases[BIBLIOTECA_FASES[i].id]) return BIBLIOTECA_FASES[i];
    }
    return BIBLIOTECA_FASES[0];
  }

  const schoolSearchResults = useMemo(() => {
    if (!dialogSearchTerm || dialogSearchTerm.length < 3) return [];
    const term = dialogSearchTerm.toUpperCase();
    return allSchools.filter(s => s.cct.includes(term) || s.nombre.includes(term)).slice(0, 5);
  }, [allSchools, dialogSearchTerm]);

  const updateMantenimientoEquipo = (index: number, field: string, value: string) => {
    if (!formData.mantenimientoFicha) return;
    const list = [...formData.mantenimientoFicha.equiposList];
    (list[index] as any)[field] = value.toUpperCase();
    setFormData({
      ...formData,
      mantenimientoFicha: { ...formData.mantenimientoFicha, equiposList: list }
    });
  }

  const handleAddAssistantRow = () => {
    setAssistants([...assistants, { paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '' }])
  }

  const handleRemoveAssistantRow = (index: number) => {
    if (assistants.length === 1) return
    setAssistants(assistants.filter((_, i) => i !== index))
  }

  const updateAssistantField = (index: number, field: keyof AssistantEntry, value: string) => {
    const newAssistants = [...assistants]
    newAssistants[index] = { ...newAssistants[index], [field]: value.toUpperCase() }

    if (field === 'cct') {
      const cleanValue = value.trim().toUpperCase()
      if (cleanValue.length === 10) {
        const school = allSchools.find(s => s.cct.toUpperCase() === cleanValue)
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

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 w-full min-h-screen bg-[#f8fafc] p-2 md:p-4 rounded-[2rem]">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-2xl shadow-sm border">
          {['Cuentas Institucionales', 'Biblioteca Digital', 'Geoposición', 'Conoce mi Escuela'].map(tab => (
            <button 
              key={tab} 
              onClick={() => { setActiveTab(tab); resetForm(); }}
              className={cn(
                "px-5 h-10 text-[10px] font-black rounded-xl transition-all uppercase tracking-wider",
                activeTab === tab ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
           {activeTab !== 'Cuentas Institucionales' && activeTab !== 'Geoposición' && activeTab !== 'Conoce mi Escuela' && (
             <Button onClick={() => setIsDialogOpen(true)} className="btn-institutional h-11 px-8 rounded-xl shadow-xl">
               <PlusCircle className="h-4 w-4 mr-2" /> Nuevo Registro
             </Button>
           )}
        </div>
      </div>

      <div className="flex-1">
        {activeTab === 'Cuentas Institucionales' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4">
              <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white p-8 space-y-6 overflow-hidden relative">
                 <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Mail className="h-6 w-6" /></div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Registrar correo institucional</h3>
                 </div>
                 <p className="text-[11px] font-medium text-slate-400 leading-relaxed">Complete el formulario para dar de alta un nuevo correo institucional en el sistema.</p>
                 
                 <div className="space-y-5">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-600">Nombre completo *</Label>
                       <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                          <Input placeholder="Ej. María López García" className="h-11 pl-10 rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all font-bold" value={accountForm.name} onChange={e => setAccountForm({...accountForm, name: e.target.value})} />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-600">Usuario (sin dominio) *</Label>
                       <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                          <Input placeholder="Ej. maria.lopez" className="h-11 pl-10 rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all font-mono" value={accountForm.username} onChange={e => setAccountForm({...accountForm, username: e.target.value.toLowerCase()})} />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-600">Dominio *</Label>
                       <Select value={accountForm.domain} onValueChange={v => setAccountForm({...accountForm, domain: v})}>
                         <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold"><SelectValue /></SelectTrigger>
                         <SelectContent className="rounded-xl"><SelectItem value="@coees.edu.mx">@coees.edu.mx</SelectItem><SelectItem value="@desysa.edu.mx">@desysa.edu.mx</SelectItem></SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-600">Correo institucional completo</Label>
                       <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                          <Input readOnly className="h-11 pl-10 rounded-xl border-slate-100 bg-slate-100 font-mono text-slate-400" value={`${accountForm.username}${accountForm.domain}`} />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-600">Área / Departamento</Label>
                       <div className="relative">
                          <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                          <Input placeholder="Ej. Capacitación" className="h-11 pl-10 rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all font-bold" value={accountForm.area} onChange={e => setAccountForm({...accountForm, area: e.target.value})} />
                    </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-600">Observaciones (opcional)</Label>
                       <div className="relative">
                          <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                          <Textarea placeholder="Agregar alguna observación..." className="min-h-[100px] pl-10 rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all text-xs font-bold uppercase" value={accountForm.notes} onChange={e => setAccountForm({...accountForm, notes: e.target.value})} />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                       <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-black h-12 rounded-xl shadow-xl transition-all active:scale-95 flex items-center gap-2"><Save className="h-5 w-5" /> Guardar</Button>
                       <Button variant="outline" onClick={resetForm} className="h-12 rounded-xl border-slate-100 text-slate-600 font-black flex items-center gap-2 hover:bg-slate-50"><RotateCcw className="h-4 w-4" /> Limpiar</Button>
                    </div>
                 </div>
              </Card>
            </div>
            <div className="lg:col-span-8 space-y-8">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-10 overflow-hidden relative">
                 <div className="flex items-center gap-4 mb-4">
                    <Search className="h-6 w-6 text-blue-600" />
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Verificar existencia de correo</h3>
                 </div>
                 <p className="text-[11px] font-medium text-slate-400 mb-8 uppercase tracking-wider">Ingrese el correo institucional que desea verificar. El sistema comprobará si existe en la base de datos y mostrará su estado.</p>
                 
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-600 pl-1">Correo institucional *</Label>
                       <div className="flex gap-4">
                          <div className="relative flex-1">
                             <Mail className="absolute left-3 top-4 h-5 w-5 text-slate-300" />
                             <Input placeholder="ej. usuario@coees.edu.mx" className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50 font-mono text-lg focus:bg-white" value={verifyInput} onChange={e => setVerifyInput(e.target.value.toLowerCase())} onKeyDown={e => e.key === 'Enter' && handleVerifyEmail()} />
                          </div>
                          <Button onClick={handleVerifyEmail} className="h-14 px-8 bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xl font-black uppercase flex items-center gap-3"><Search className="h-5 w-5" /> Verificar</Button>
                       </div>
                    </div>

                    {verificationResult ? (
                      <div className="p-8 bg-blue-50/50 border-2 border-blue-100 rounded-[2.5rem] flex items-center gap-8 animate-in zoom-in-95 duration-500 shadow-sm">
                         <div className="h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl"><CheckCircle2 className="h-10 w-10" /></div>
                         <div className="space-y-3 flex-1">
                            <h4 className="text-[9px] font-black text-blue-800 uppercase tracking-[0.2em]">Resultado de la verificación</h4>
                            <div className="flex items-center gap-3">
                               <span className="text-2xl font-black text-slate-800 font-mono">{verificationResult.email}</span>
                               <Badge className="bg-emerald-500 text-white font-black text-[8px] px-3 h-5 rounded-full border-none">Cuenta activa</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                               <div className="flex gap-2"><span className="text-[10px] font-black text-slate-400 uppercase">Nombre:</span><span className="text-[10px] font-black text-slate-700 uppercase">{verificationResult.userName}</span></div>
                               <div className="flex gap-2"><span className="text-[10px] font-black text-slate-400 uppercase">Área:</span><span className="text-[10px] font-black text-slate-700 uppercase">{verificationResult.departamento}</span></div>
                               <div className="flex gap-2"><span className="text-[10px] font-black text-slate-400 uppercase">Fecha de alta:</span><span className="text-[10px] font-black text-slate-700 uppercase">{verificationResult.date}</span></div>
                            </div>
                         </div>
                      </div>
                    ) : verifyInput && (
                      <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                         <SearchCode className="h-12 w-12 text-slate-300" />
                         <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Esperando verificación...</p>
                      </div>
                    )}
                 </div>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden flex flex-col min-h-[400px]">
                <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Archive className="h-6 w-6 text-slate-700" />
                      <h3 className="text-lg font-black uppercase text-slate-700 tracking-tighter">Historial de registros</h3>
                   </div>
                   <div className="relative w-64 group">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                      <Input placeholder="FILTRAR REGISTROS..." className="h-9 pl-10 rounded-xl border-slate-100 text-[10px] font-black bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                   </div>
                </div>
                <ScrollArea className="flex-1">
                  <Table>
                    <TableHeader className="bg-slate-50"><TableRow className="h-12"><TableHead className="pl-10 text-[9px] font-black uppercase">Fecha de registro</TableHead><TableHead className="text-[9px] font-black uppercase">Correo institucional</TableHead><TableHead className="text-center text-[9px] font-black uppercase w-32">Estado</TableHead><TableHead className="text-right pr-10 text-[9px] font-black uppercase w-32">Acciones</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {accountsRecords.filter(r => !searchTerm || r.email?.toLowerCase().includes(searchTerm.toLowerCase())).map((rec) => (
                        <TableRow key={rec.id} className="h-16 hover:bg-slate-50 border-b border-slate-50 transition-colors group">
                           <TableCell className="pl-10 text-[11px] font-bold text-slate-400">{rec.date}</TableCell>
                           <TableCell className="font-black text-sm text-slate-700 font-mono">{rec.email}</TableCell>
                           <TableCell className="text-center">
                              <Badge className="bg-emerald-100 text-emerald-700 font-black text-[8px] px-3 h-5 rounded-full border-none">Activo</Badge>
                           </TableCell>
                           <TableCell className="text-right pr-10">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-500 rounded-xl hover:bg-blue-50" onClick={() => handleEdit(rec)}><Eye className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-300 hover:text-rose-600 rounded-xl hover:bg-rose-50" onClick={() => handleDelete(rec.id!)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                           </TableCell>
                        </TableRow>
                      ))}
                      {accountsRecords.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-20 opacity-30 text-[10px] font-black uppercase tracking-widest">Sin registros históricos</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </Card>
            </div>
          </div>
        ) : activeTab === 'Biblioteca Digital' ? (
          <div className="space-y-8 pb-10">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { label: 'CCT Registrados', value: stats.total, sub: 'Escuelas', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Visitas Totales', value: stats.visitas, sub: 'Auditadas', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Atenciones', value: stats.atenciones, sub: 'Activas', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Evidencias', value: stats.evidencias, sub: 'Docs/Fotos', icon: ImageIcon, color: 'text-orange-500', bg: 'bg-orange-50' },
                { label: 'Técnicos Activos', value: stats.tecnicos, sub: 'Personal', icon: User, color: 'text-teal-600', bg: 'bg-teal-50' },
                { label: 'Proyectos Concluidos', value: stats.concluidos, sub: '100% Avance', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' }
              ].map((m, i) => (
                <Card key={i} className="border-none shadow-md rounded-[1.8rem] p-5 flex items-center gap-4 bg-white transition-all hover:scale-105">
                  <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner", m.bg, m.color)}><m.icon className="h-6 w-6" /></div>
                  <div>
                    <h4 className="text-2xl font-black leading-none">{m.value}</h4>
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-1.5">{m.label}</p>
                    <p className="text-[7px] font-bold text-slate-300 uppercase">{m.sub}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <Card className="lg:col-span-8 border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col">
                <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
                   <h3 className="text-lg font-black uppercase text-slate-700">Fases del Proyecto por CCT</h3>
                </div>
                <ScrollArea className="flex-1 min-h-[400px]">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="h-12">
                        <TableHead className="pl-10 text-[9px] font-black uppercase">CCT</TableHead>
                        <TableHead className="text-[9px] font-black uppercase">Escuela</TableHead>
                        <TableHead className="text-[9px] font-black uppercase">Municipio</TableHead>
                        <TableHead className="text-[9px] font-black uppercase">Fase Actual</TableHead>
                        <TableHead className="text-[9px] font-black uppercase">Avance</TableHead>
                        <TableHead className="text-[9px] font-black uppercase">Estatus</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bibliotecaRecords.map((rec) => {
                        const faseActual = getFaseActual(rec.bibliotecaFases);
                        return (
                          <TableRow key={rec.id} onClick={() => { setSelectedCctId(rec.id!); setSidebarSearchTerm(rec.cct); }} className={cn("h-16 hover:bg-slate-50 transition-colors cursor-pointer", selectedCctId === rec.id && "bg-primary/5")}>
                            <TableCell className="pl-10 font-mono text-[10px] font-black text-primary">{rec.cct}</TableCell>
                            <TableCell className="text-[11px] font-bold text-slate-700 uppercase">{rec.schoolName}</TableCell>
                            <TableCell className="text-[10px] font-bold text-slate-400 uppercase">{rec.municipio}</TableCell>
                            <TableCell>
                              <Badge className={cn("text-[8px] font-black border-none px-3 h-8 flex flex-col items-start justify-center leading-tight max-w-[140px]", faseActual.color)}>
                                <span className="uppercase">{faseActual.label.split('.')[0]}</span>
                                <span className="text-[6px] opacity-70 truncate w-full">{faseActual.label.split('.')[1]}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="w-32">
                               <div className="flex items-center gap-3">
                                  <Progress value={rec.progress} className="h-1.5 flex-1" />
                                  <span className="text-[10px] font-black text-slate-500">{rec.progress}%</span>
                               </div>
                            </TableCell>
                            <TableCell>
                               <Badge className={cn("text-[8px] font-black border-none px-3 h-6", rec.progress === 100 ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}>
                                  {rec.progress === 100 ? 'CONCLUIDO' : 'EN PROCESO'}
                               </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {bibliotecaRecords.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-20 opacity-30 uppercase font-black text-xs">Sin registros de auditoría</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </Card>

              <Card className="lg:col-span-4 border-none shadow-2xl rounded-[2.5rem] bg-white p-8 flex flex-col gap-6">
                 <div>
                   <h3 className="text-sm font-black uppercase text-slate-800">Detalle de Fases del Proyecto</h3>
                   <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">(Buscador de auditoría)</p>
                 </div>
                 
                 <div className="space-y-2 relative">
                    <Label className="text-[9px] font-black uppercase text-primary">CCT Seleccionado:</Label>
                    <div className="relative group">
                       <Input 
                          placeholder="ESCRIBIR CCT O NOMBRE..." 
                          className="h-12 rounded-xl border-slate-200 font-black text-[10px] uppercase pl-10 pr-10 shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
                          value={sidebarSearchTerm}
                          onChange={(e) => {
                             setSidebarSearchTerm(e.target.value.toUpperCase());
                             setIsSidebarResultsOpen(true);
                          }}
                          onFocus={() => setIsSidebarResultsOpen(true)}
                       />
                       <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                       {sidebarSearchTerm && (
                          <button 
                             onClick={() => { setSelectedCctId(null); setSidebarSearchTerm(''); }}
                             className="absolute right-3 top-3.5 h-5 w-5 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                             <X className="h-4 w-4" />
                          </button>
                       )}
                       
                       {isSidebarResultsOpen && sidebarSearchTerm.length > 0 && (
                          <div className="absolute top-14 left-0 right-0 max-h-60 overflow-auto bg-white border rounded-xl shadow-2xl z-[400] divide-y animate-in fade-in zoom-in-95">
                             {bibliotecaRecords
                                .filter(r => 
                                   (r.cct || '').toUpperCase().includes(sidebarSearchTerm.toUpperCase()) || 
                                   (r.schoolName || '').toUpperCase().includes(sidebarSearchTerm.toUpperCase())
                                )
                                .map(r => (
                                   <div 
                                      key={r.id} 
                                      className="p-3 hover:bg-primary/5 cursor-pointer flex justify-between items-center group transition-all" 
                                      onClick={() => { 
                                         setSelectedCctId(r.id!); 
                                         setSidebarSearchTerm(r.cct); 
                                         setIsSidebarResultsOpen(false); 
                                      }}
                                   >
                                      <div className="flex flex-col min-w-0">
                                         <span className="text-[10px] font-black uppercase truncate group-hover:text-primary transition-colors">{r.schoolName}</span>
                                         <span className="text-[8px] font-bold text-slate-400 uppercase">{r.cct} • {r.municipio}</span>
                                      </div>
                                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-all" />
                                   </div>
                                ))
                             }
                             {bibliotecaRecords.filter(r => (r.cct || '').toUpperCase().includes(sidebarSearchTerm.toUpperCase()) || (r.schoolName || '').toUpperCase().includes(sidebarSearchTerm.toUpperCase())).length === 0 && (
                               <div className="p-4 text-center">
                                 <p className="text-[8px] font-bold text-slate-400 uppercase">Sin auditorías registradas para esta búsqueda</p>
                               </div>
                             )}
                          </div>
                       )}
                    </div>
                 </div>

                 <ScrollArea className="flex-1 pr-4">
                    {selectedRecord ? (
                      <div className="space-y-4">
                         {BIBLIOTECA_FASES.map((f, i) => {
                           const isCompleted = selectedRecord?.bibliotecaFases?.[f.id as keyof typeof selectedRecord.bibliotecaFases];
                           const isCurrent = getFaseActual(selectedRecord?.bibliotecaFases).id === f.id;
                           
                           return (
                             <div key={f.id} className={cn(
                               "flex items-start gap-4 p-4 rounded-2xl border transition-all",
                               isCompleted ? "bg-emerald-50/50 border-emerald-100" : isCurrent ? "bg-blue-50 border-blue-200 ring-2 ring-blue-100" : "bg-white border-slate-100"
                             )}>
                                <div className={cn(
                                  "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border-2",
                                  isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : i === 0 || isCurrent ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 text-slate-300"
                                )}>
                                   {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <p className={cn("text-[10px] font-black uppercase leading-tight", isCompleted ? "text-emerald-700" : isCurrent ? "text-blue-800" : "text-slate-400")}>{f.label}</p>
                                </div>
                             </div>
                           )
                         })}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-20 text-center gap-4 py-20">
                         <SearchCode className="h-16 w-16" />
                         <p className="text-[10px] font-black uppercase tracking-widest">Busque o seleccione un plantel para ver el detalle de fases</p>
                      </div>
                    )}
                 </ScrollArea>
                 
                 {selectedRecord && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 animate-in slide-in-from-bottom-2 duration-500">
                       <div className="bg-slate-50 p-4 rounded-2xl border flex flex-col items-center gap-2">
                          <Laptop className="h-5 w-5 text-primary" />
                          <span className="text-xl font-black text-slate-800">{selectedRecord.bibliotecaFases?.equiposHabilitados || 0}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase">Equipos</span>
                       </div>
                       <div className="bg-slate-50 p-4 rounded-2xl border flex flex-col items-center gap-2">
                          <Users className="h-5 w-5 text-emerald-600" />
                          <span className="text-xl font-black text-slate-800">{selectedRecord.bibliotecaFases?.personalCapacitado || 0}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase">Capacitados</span>
                       </div>
                    </div>
                 )}
              </Card>
            </div>
          </div>
        ) : activeTab === 'Geoposición' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-700">
            <div className="lg:col-span-7 h-full min-h-[600px]">
               <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden flex flex-col h-full">
                  <div className="p-6 bg-slate-50 border-b flex items-center justify-between">
                     <div className="flex gap-2">
                        <Button variant="secondary" size="sm" className="rounded-xl font-black text-[9px] uppercase shadow-sm">Mapa</Button>
                        <Button variant="ghost" size="sm" className="rounded-xl font-black text-[9px] uppercase text-slate-400">Satélite</Button>
                     </div>
                  </div>
                  <div className="flex-1 relative bg-slate-100 overflow-hidden">
                     <Image src="https://picsum.photos/seed/map/1200/800" alt="Mapa" fill className="object-cover opacity-60 grayscale-[0.5]" />
                     <div className="absolute top-[20%] left-[30%] animate-bounce"><MapPin className="h-8 w-8 text-rose-600 fill-rose-100" /></div>
                     <div className="absolute top-[40%] left-[60%]"><MapPin className="h-8 w-8 text-emerald-600 fill-emerald-100" /></div>
                     <div className="absolute top-[70%] left-[45%]"><MapPin className="h-8 w-8 text-blue-600 fill-blue-100" /></div>
                     <div className="absolute top-[35%] left-[20%] animate-in zoom-in-95 duration-500">
                        <div className="bg-white rounded-2xl shadow-2xl p-4 border flex items-center gap-4 group cursor-pointer hover:scale-105 transition-all">
                           <div className="space-y-1"><p className="text-[10px] font-black text-slate-800 uppercase">Dispositivo: COEES-001</p><p className="text-[8px] font-bold text-slate-400 uppercase">Última ubicación: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p></div>
                           <ChevronRight className="h-4 w-4 text-primary" />
                        </div>
                        <div className="w-0.5 h-10 bg-slate-400 mx-auto" /><MapPin className="h-10 w-10 text-primary fill-primary/20 mx-auto" />
                     </div>
                     <div className="absolute bottom-10 right-6 flex flex-col gap-2">
                        <Button size="icon" className="h-10 w-10 bg-white text-slate-700 rounded-xl shadow-xl hover:bg-slate-50 border-none font-black text-xl">+</Button>
                        <Button size="icon" className="h-10 w-10 bg-white text-slate-700 rounded-xl shadow-xl hover:bg-slate-50 border-none font-black text-xl">-</Button>
                        <Button size="icon" className="h-10 w-10 bg-white text-primary rounded-xl shadow-xl hover:bg-slate-50 border-none mt-4"><Navigation className="h-5 w-5" /></Button>
                     </div>
                  </div>
                  <div className="p-6 bg-white border-t flex flex-wrap gap-8 justify-center items-center">
                     {[{ label: 'En línea', color: 'text-emerald-500' }, { label: 'En movimiento', color: 'text-blue-500' }, { label: 'Sin señal', color: 'text-rose-500' }, { label: 'Desconectado', color: 'text-slate-400' }].map(l => (
                       <div key={l.label} className="flex items-center gap-2"><Circle className={cn("h-3 w-3 fill-current", l.color)} /><span className="text-[9px] font-black uppercase text-slate-600 tracking-wider">{l.label}</span></div>
                     ))}
                  </div>
               </Card>
            </div>
            <div className="lg:col-span-5 space-y-8 flex flex-col h-full">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 space-y-6">
                  <div className="flex items-center gap-4"><div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><MapPin className="h-6 w-6" /></div><h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Registrar coordenadas</h3></div>
                  <div className="space-y-6">
                     <div className="space-y-2 relative"><Label className="text-[10px] font-black uppercase text-slate-600 pl-1">CCT *</Label><Input placeholder="15DESXXXXX" className="h-11 pl-12 rounded-xl bg-slate-50 border-none font-mono font-black uppercase text-primary" value={formData.cct} onChange={e => { const val = e.target.value.toUpperCase(); setFormData({...formData, cct: val}); setDialogSearchTerm(val); handleCctChange(val); }} /><Search className="absolute left-4 top-10 h-4 w-4 text-slate-300" /></div>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-600 pl-1">Latitud *</Label><Input placeholder="Ej. 19.6289" className="h-11 rounded-xl bg-slate-50 border-none font-bold" value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} /></div>
                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-600 pl-1">Longitud *</Label><Input placeholder="Ej. -99.3128" className="h-11 rounded-xl bg-slate-50 border-none font-bold" value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} /></div>
                     </div>
                     <div className="grid grid-cols-2 gap-4"><Button onClick={handleSave} className="btn-institutional h-12 rounded-xl shadow-xl flex items-center gap-3"><Save className="h-5 w-5" /> Guardar ubicación</Button><Button variant="outline" onClick={resetForm} className="h-12 rounded-xl border-slate-100 text-slate-600 font-black flex items-center gap-2"><RotateCcw className="h-4 w-4" /> Limpiar</Button></div>
                  </div>
               </Card>
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden flex flex-col flex-1">
                  <div className="p-8 border-b bg-slate-50 flex items-center gap-3"><ClipboardCheck className="h-6 w-6 text-slate-700" /><h3 className="text-sm font-black uppercase text-slate-700">Bitácora de ubicaciones</h3></div>
                  <ScrollArea className="flex-1"><Table><TableHeader className="bg-slate-50"><TableRow className="h-12"><TableHead className="pl-8 text-[9px] font-black uppercase">Fecha</TableHead><TableHead className="text-[9px] font-black uppercase">CCT</TableHead><TableHead className="text-center text-[9px] font-black uppercase">Lat/Lon</TableHead><TableHead className="text-right pr-8 text-[9px] font-black uppercase">Acciones</TableHead></TableRow></TableHeader><TableBody>{geoRecords.map((rec) => (<TableRow key={rec.id} className="h-14 hover:bg-slate-50 border-b border-slate-50"><TableCell className="pl-8 text-[10px] font-bold text-slate-400">{rec.date}</TableCell><TableCell className="font-mono text-[10px] font-black text-primary">{rec.cct}</TableCell><TableCell className="text-center font-bold text-[10px] text-slate-600">{rec.latitud}, {rec.longitud}</TableCell><TableCell className="text-right pr-8"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" onClick={() => handleEdit(rec)}><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300" onClick={() => handleDelete(rec.id!)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>))}</TableBody></Table></ScrollArea>
               </Card>
            </div>
          </div>
        ) : activeTab === 'Conoce mi Escuela' ? (
          <div className="space-y-6 animate-in fade-in duration-700">
            {/* Buscador Superior */}
            <Card className="rounded-2xl border-none shadow-sm p-4 bg-white">
               <div className="flex flex-wrap items-end gap-4">
                  <div className="space-y-2 flex-1 min-w-[200px]">
                     <Label className="text-[10px] font-black uppercase text-slate-400">Buscar por:</Label>
                     <div className="flex gap-2">
                        <Select defaultValue="cct">
                           <SelectTrigger className="w-24 h-10 rounded-xl bg-slate-50 border-none font-bold text-xs"><SelectValue /></SelectTrigger>
                           <SelectContent className="z-[500]"><SelectItem value="cct">CCT</SelectItem><SelectItem value="nombre">Nombre</SelectItem></SelectContent>
                        </Select>
                        <div className="relative flex-1">
                           <Search className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                           <Input placeholder="Ej. 15DES0001R" className="h-10 pl-10 rounded-xl bg-slate-50 border-none font-bold text-xs uppercase" />
                        </div>
                     </div>
                  </div>
                  <div className="space-y-2 w-48">
                     <Label className="text-[10px] font-black uppercase text-slate-400">Zona / Municipio</Label>
                     <Select defaultValue="todos">
                        <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs"><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /><SelectValue /></div></SelectTrigger>
                        <SelectContent className="z-[500]"><SelectItem value="todos">Todos</SelectItem><SelectItem value="toluca">Toluca</SelectItem><SelectItem value="metepec">Metepec</SelectItem></SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-2 w-48">
                     <Label className="text-[10px] font-black uppercase text-slate-400">Estado</Label>
                     <Select defaultValue="todos">
                        <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-slate-400" /><SelectValue /></div></SelectTrigger>
                        <SelectContent className="z-[500]"><SelectItem value="todos">Todos</SelectItem><SelectItem value="activo">Activo</SelectItem><SelectItem value="pendiente">Pendiente</SelectItem></SelectContent>
                     </Select>
                  </div>
                  <Button className="h-10 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg font-black uppercase text-[10px] flex items-center gap-2"><Search className="h-4 w-4" /> Buscar</Button>
               </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
               {/* Columna Izquierda: Mapa e Indicadores */}
               <div className="lg:col-span-6 space-y-6">
                  <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden flex flex-col h-[500px]">
                     <div className="p-4 border-b flex gap-2 bg-slate-50/50">
                        <Button variant="default" className="bg-blue-600 rounded-xl text-[10px] font-black h-9 px-6"><MapIcon className="h-4 w-4 mr-2" /> Mapa</Button>
                        <Button variant="ghost" className="text-slate-400 rounded-xl text-[10px] font-black h-9 px-6"><TableIcon className="h-4 w-4 mr-2" /> Lista</Button>
                     </div>
                     <div className="flex-1 relative bg-slate-100">
                        <Image src="https://picsum.photos/seed/edomex-map/1200/800" alt="Mapa" fill className="object-cover opacity-60 grayscale-[0.3]" />
                        <div className="absolute top-4 left-4 flex gap-1 bg-white p-1 rounded-lg shadow-md border">
                           <Button variant="secondary" size="sm" className="h-7 text-[8px] font-black uppercase px-3 rounded-md">Mapa</Button>
                           <Button variant="ghost" size="sm" className="h-7 text-[8px] font-black uppercase px-3 text-slate-400">Satélite</Button>
                        </div>
                        
                        {/* Marcadores Simulados */}
                        <div className="absolute top-[35%] left-[65%]"><MapPin className="h-8 w-8 text-emerald-600 fill-emerald-100" /></div>
                        <div className="absolute top-[55%] left-[30%]"><MapPin className="h-8 w-8 text-blue-600 fill-blue-100" /></div>
                        <div className="absolute top-[75%] left-[55%]"><MapPin className="h-8 w-8 text-rose-600 fill-rose-100" /></div>
                        
                        {/* Marcador Activo con Tooltip Estilo Imagen */}
                        <div className="absolute top-[20%] left-[25%] animate-in zoom-in-95 duration-500">
                           <Card className="p-4 rounded-xl shadow-2xl border-none flex items-center gap-4 bg-white relative">
                              <div className="flex flex-col">
                                 <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">CCT: 15DES0001R</span>
                                 <span className="text-[8px] font-bold text-slate-500 uppercase">Escuela Secundaria Técnica No. 15</span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-blue-600" />
                           </Card>
                           <div className="w-0.5 h-6 bg-slate-400 mx-auto" />
                           <div className="h-4 w-4 rounded-full bg-blue-600 border-2 border-white mx-auto shadow-[0_0_15px_rgba(37,99,235,0.6)] animate-pulse" />
                        </div>

                        {/* Leyenda Inferior */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-6 py-2 rounded-full shadow-2xl border flex gap-6 border-slate-200">
                           {[{l: 'En línea', c: 'text-emerald-500'}, {l: 'En movimiento', c: 'text-blue-500'}, {l: 'Sin señal', c: 'text-rose-500'}, {l: 'Desconectado', c: 'text-slate-400'}].map(i => (
                             <div key={i.l} className="flex items-center gap-2"><div className={cn("h-2.5 w-2.5 rounded-full bg-current", i.c)}/><span className="text-[8px] font-black uppercase text-slate-600 tracking-wider">{i.l}</span></div>
                           ))}
                        </div>
                     </div>
                  </Card>

                  {/* Resumen Estadístico Estilo Imagen */}
                  <div className="space-y-4">
                     <h3 className="text-[11px] font-black uppercase text-slate-700 tracking-widest pl-2">Resumen general</h3>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { val: '1,248', lab: 'Escuelas registradas', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
                          { val: '856', lab: 'Directores / Responsables', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                          { val: '125', lab: 'Municipios', icon: MapPin, color: 'text-orange-500', bg: 'bg-orange-50' },
                          { val: '3,482', lab: 'Datos actualizados', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                        ].map((item, idx) => (
                          <Card key={idx} className="p-5 rounded-[1.8rem] border-none shadow-md bg-white flex flex-col items-center text-center gap-3 group hover:scale-105 transition-all">
                             <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center shadow-inner", item.bg, item.color)}><item.icon className="h-5 w-5" /></div>
                             <div>
                                <h4 className="text-xl font-black text-slate-800 leading-none">{item.val}</h4>
                                <p className="text-[7px] font-black uppercase text-slate-400 mt-2 leading-tight tracking-wide">{item.lab}</p>
                             </div>
                             <div className="flex gap-1 mt-1 w-full justify-center opacity-30">
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <div className="h-1 w-1 rounded-full bg-blue-500" />
                                <div className="h-1 w-1 rounded-full bg-rose-500" />
                             </div>
                          </Card>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Columna Derecha: Formulario y Detalle */}
               <div className="lg:col-span-6 space-y-6">
                  <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner"><School className="h-7 w-7" /></div>
                        <div>
                           <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Registrar / Editar Escuela</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ingresa la información para el censo escolar</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-slate-500 pl-1">CCT *</Label><div className="relative"><Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-300"/><Input placeholder="Ej. 15DES0001R" className="h-11 pl-10 rounded-xl bg-slate-50 border-none font-mono font-black uppercase text-primary" /></div></div>
                        <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-slate-500 pl-1">Nombre de la escuela *</Label><div className="relative"><FileText className="absolute left-3 top-3 h-4 w-4 text-slate-300"/><Input placeholder="Ej. Secundaria No. 15" className="h-11 pl-10 rounded-xl bg-slate-50 border-none font-bold text-xs uppercase" /></div></div>
                        <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-slate-500 pl-1">Zona *</Label><div className="relative"><MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-300"/><Select><SelectTrigger className="h-11 pl-10 rounded-xl bg-slate-50 border-none font-bold text-xs uppercase"><SelectValue placeholder="Selecciona una zona" /></SelectTrigger><SelectContent className="z-[500]"><SelectItem value="001">001</SelectItem><SelectItem value="002">002</SelectItem></SelectContent></Select></div></div>
                        <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-slate-500 pl-1">Municipio *</Label><div className="relative"><MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-300"/><Select><SelectTrigger className="h-11 pl-10 rounded-xl bg-slate-50 border-none font-bold text-xs uppercase"><SelectValue placeholder="Selecciona un municipio" /></SelectTrigger><SelectContent className="z-[500]"><SelectItem value="toluca">Toluca</SelectItem><SelectItem value="metepec">Metepec</SelectItem></SelectContent></Select></div></div>
                        <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-slate-500 pl-1">Teléfono</Label><div className="relative"><Phone className="absolute left-3 top-3 h-4 w-4 text-slate-300"/><Input placeholder="Ej. 722 123 4567" className="h-11 pl-10 rounded-xl bg-slate-50 border-none font-bold text-xs" /></div></div>
                        <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-slate-500 pl-1">Correo electrónico</Label><div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-slate-300"/><Input placeholder="Ej. escuela@edugem.gob.mx" className="h-11 pl-10 rounded-xl bg-slate-50 border-none font-bold text-xs lowercase" /></div></div>
                        <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-slate-500 pl-1">Latitud *</Label><div className="relative"><Navigation className="absolute left-3 top-3 h-4 w-4 text-slate-300"/><Input placeholder="Ej. 19.6289" className="h-11 pl-10 rounded-xl bg-slate-50 border-none font-mono font-bold" /></div></div>
                        <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-slate-500 pl-1">Longitud *</Label><div className="relative"><Navigation className="absolute left-3 top-3 h-4 w-4 text-slate-300"/><Input placeholder="Ej. -99.3128" className="h-11 pl-10 rounded-xl bg-slate-50 border-none font-mono font-bold" /></div></div>
                     </div>

                     <div className="grid grid-cols-2 gap-6 pt-2">
                        <Button className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl font-black uppercase text-[10px] flex items-center gap-3 transition-all active:scale-95"><Save className="h-5 w-5" /> Guardar escuela</Button>
                        <Button variant="outline" className="h-12 rounded-2xl border-slate-200 text-slate-400 font-black uppercase text-[10px] flex items-center gap-3 hover:bg-slate-50"><RotateCcw className="h-5 w-5" /> Limpiar</Button>
                     </div>
                  </Card>

                  {/* Ficha Técnica Detallada (Datos de la Escuela) */}
                  <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden flex flex-col group animate-in slide-in-from-right-4 duration-500">
                     <div className="p-6 border-b bg-slate-50/80 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="h-9 w-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><School className="h-5 w-5" /></div>
                           <h3 className="text-sm font-black uppercase text-slate-700 tracking-tight">Datos de la escuela</h3>
                        </div>
                        <Badge className="bg-emerald-500 text-white border-none font-black text-[8px] px-3 h-5 rounded-full shadow-lg shadow-emerald-500/20 animate-pulse">En línea</Badge>
                     </div>
                     <div className="p-8 flex flex-col md:flex-row gap-8 bg-gradient-to-br from-white to-blue-50/30">
                        <div className="w-full md:w-56 aspect-[4/3] rounded-3xl overflow-hidden relative border-8 border-white shadow-2xl transform group-hover:scale-105 transition-all duration-700">
                           <Image src="https://picsum.photos/seed/edomex-school/600/450" alt="Fachada de Escuela" fill className="object-cover" data-ai-hint="secondary school" />
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                           {[
                             { l: 'CCT:', v: '15DES0001R', c: 'font-mono text-primary font-black' },
                             { l: 'Nombre:', v: 'Escuela Secundaria Técnica No. 15', full: true },
                             { l: 'Zona:', v: '001' },
                             { l: 'Municipio:', v: 'Toluca' },
                             { l: 'Dirección:', v: 'Av. Independencia No. 123, Col. Centro, Toluca, Estado de México. C.P. 50000', full: true, vClass: 'text-[9px] italic' }
                           ].map(i => (
                             <div key={i.l} className={cn("flex flex-col gap-1", i.full ? "col-span-1 md:col-span-2" : "")}>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{i.l}</span>
                                <span className={cn("text-[10px] font-bold text-slate-700 uppercase leading-tight", i.c, i.vClass)}>{i.v}</span>
                             </div>
                           ))}
                           <div className="col-span-1 md:col-span-2 flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-slate-200/60">
                              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100"><Phone className="h-3 w-3 text-blue-600"/><span className="text-[9px] font-black text-slate-600">722 123 4567</span></div>
                              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100"><Mail className="h-3 w-3 text-blue-600"/><span className="text-[9px] font-black text-slate-600 lowercase">esc15@edugem.gob.mx</span></div>
                           </div>
                        </div>
                     </div>
                  </Card>
               </div>
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[1300px] h-[95vh] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden flex flex-col bg-white">
          <DialogHeader className="p-8 bg-[#9f2241] text-white shrink-0">
             <DialogTitle className="uppercase font-black text-xl flex items-center gap-3">
               <Settings className="h-7 w-7 text-accent" /> 
               {editingId ? 'EDITAR AUDITORÍA TÉCNICA' : 'NUEVA AUDITORÍA INSTITUCIONAL'}
             </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="auditoria" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-8 border-b bg-slate-50/50">
              <TabsList className="bg-transparent h-14 p-0 gap-8">
                <TabsTrigger value="auditoria" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all">1. Auditoría Técnica</TabsTrigger>
                {((formData.bibliotecaFases?.equiposHabilitados ?? 0) > 0) && (
                  <TabsTrigger value="mantenimiento" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all">2. Mantenimiento (F4)</TabsTrigger>
                )}
                {((formData.bibliotecaFases?.personalCapacitado ?? 0) > 0) && (
                  <TabsTrigger value="asistentes" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all">3. Lista de Asistentes</TabsTrigger>
                )}
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="auditoria" className="h-full m-0 p-0 overflow-hidden">
                <ScrollArea className="h-full p-10">
                   <div className="space-y-12">
                      <div className="space-y-6">
                         <div className="flex items-center gap-3 border-b pb-2"><Search className="h-5 w-5 text-primary" /><h4 className="text-xs font-black uppercase text-primary tracking-widest">Localización del Centro de Trabajo</h4></div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2 relative">
                               <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">CCT (10 Dígitos)</Label>
                               <div className="relative group">
                                 <Input 
                                   value={formData.cct} 
                                   onChange={e => {
                                     const val = e.target.value.toUpperCase();
                                     setFormData({...formData, cct: val});
                                     setDialogSearchTerm(val);
                                     handleCctChange(val);
                                   }} 
                                   className="h-12 bg-slate-50 border-none rounded-xl font-black text-primary uppercase shadow-inner pl-12" 
                                   placeholder="15DESXXXXX" 
                                 />
                                 <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-300" />
                                 
                                 {dialogSearchTerm.length > 2 && (
                                   <div className="absolute top-14 left-0 right-0 max-h-48 overflow-auto bg-white border rounded-xl shadow-2xl z-50 divide-y animate-in fade-in zoom-in-95">
                                     {schoolSearchResults.map(s => (
                                       <div 
                                         key={`${s.cct}-${s.turno}`} 
                                         className="p-3 hover:bg-primary/5 cursor-pointer flex justify-between items-center group" 
                                         onClick={() => { handleCctChange(s.cct); setDialogSearchTerm(''); }}
                                       >
                                         <div className="flex flex-col">
                                           <span className="text-[10px] font-black uppercase group-hover:text-primary transition-colors">{s.nombre}</span>
                                           <span className="text-[8px] font-bold text-slate-400">{s.cct} • {s.municipio}</span>
                                         </div>
                                         <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-all" />
                                       </div>
                                     ))}
                                     {schoolSearchResults.length === 0 && (
                                       <div className="p-4 text-center">
                                         <p className="text-[8px] font-bold text-slate-400 uppercase mb-3">No encontrado en la Base Maestra</p>
                                         <Button 
                                           onClick={() => { setQuickAddForm({...quickAddForm, cct: dialogSearchTerm.toUpperCase()}); setIsQuickAddOpen(true); }} 
                                           variant="outline" 
                                           className="h-8 px-4 rounded-lg text-[8px] font-black uppercase border-primary/20 text-primary hover:bg-primary/5"
                                         >
                                           <Plus className="h-3 w-3 mr-1" /> Alta Rápida de Plantel
                                         </Button>
                                       </div>
                                     )}
                                   </div>
                                 )}
                               </div>
                            </div>
                            <div className="space-y-2">
                               <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Nombre del Plantel</Label>
                               <Input 
                                  value={formData.schoolName}
                                  onChange={e => setFormData({...formData, schoolName: e.target.value.toUpperCase()})}
                                  className="h-12 bg-slate-50 border-none rounded-xl font-black uppercase text-slate-700 text-xs shadow-inner" 
                                  placeholder="NOMBRE DEL PLANTEL"
                               />
                            </div>
                         </div>
                      </div>

                      <div className="space-y-10">
                         <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b pb-2"><Settings2 className="h-5 w-5 text-primary" /><h4 className="text-xs font-black uppercase text-primary tracking-widest">Estadística de Impacto</h4></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Equipos Habilitados</Label>
                                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border shadow-inner">
                                     <Laptop className="h-6 w-6 text-primary" />
                                     <Input 
                                        type="number" 
                                        value={formData.bibliotecaFases?.equiposHabilitados || 0}
                                        onChange={e => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, equiposHabilitados: parseInt(e.target.value) || 0}})}
                                        className="h-10 bg-white border-none rounded-xl font-black text-lg text-center"
                                     />
                                  </div>
                               </div>
                               <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Personas Capacitadas</Label>
                                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border shadow-inner">
                                     <Users className="h-6 w-6 text-emerald-600" />
                                     <Input 
                                        type="number" 
                                        value={formData.bibliotecaFases?.personalCapacitado || 0}
                                        onChange={e => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, personalCapacitado: parseInt(e.target.value) || 0}})}
                                        className="h-10 bg-white border-none rounded-xl font-black text-lg text-center"
                                     />
                                  </div>
                               </div>
                            </div>
                         </div>

                         <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b pb-2"><ClipboardCheck className="h-5 w-5 text-primary" /><h4 className="text-xs font-black uppercase text-primary tracking-widest">Seguimiento de Fases Técnicas</h4></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {BIBLIOTECA_FASES.map(f => (
                                 <div key={f.id} className={cn("flex items-center gap-4 p-5 rounded-[1.8rem] border transition-all", (formData.bibliotecaFases as any)?.[f.id] ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100 shadow-inner")}>
                                    <Checkbox 
                                      checked={(formData.bibliotecaFases as any)?.[f.id]} 
                                      onCheckedChange={(val) => { 
                                         const updatedFases = { ...formData.bibliotecaFases!, [f.id]: !!val }; 
                                         const totalWeight = BIBLIOTECA_FASES.length;
                                         const completedCount = BIBLIOTECA_FASES.filter(ph => (updatedFases as any)[ph.id]).length;
                                         const progress = Math.round((completedCount / totalWeight) * 100); 
                                         setFormData({ ...formData, bibliotecaFases: updatedFases as any, progress }); 
                                      }} 
                                      className="h-6 w-6 rounded-lg border-2 border-primary" 
                                    />
                                    <Label className="text-[11px] font-black uppercase text-slate-600 cursor-pointer flex-1 leading-tight">{f.label}</Label>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="mantenimiento" className="h-full m-0 p-0 overflow-hidden">
                 <ScrollArea className="h-full p-10">
                    <div className="space-y-8 animate-in zoom-in-95 duration-500">
                       <div className="flex items-center gap-3 border-b-2 border-primary/20 pb-3">
                          <MonitorCheck className="h-6 w-6 text-primary" />
                          <h4 className="text-sm font-black text-primary uppercase tracking-widest">Ficha técnica de atención Mantenimiento</h4>
                       </div>

                       <div className="bg-slate-50 p-6 rounded-[2.5rem] border shadow-inner space-y-6">
                          <div className="flex flex-wrap items-center gap-8 border-b border-primary/10 pb-4">
                             <Label className="text-[10px] font-black uppercase text-primary">Equipo tecnológico:</Label>
                             <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                   <Checkbox id="hdt-check" checked={formData.mantenimientoFicha?.equipoTecnologico.hdt} onCheckedChange={(val) => setFormData({...formData, mantenimientoFicha: {...formData.mantenimientoFicha!, equipoTecnologico: {...formData.mantenimientoFicha!.equipoTecnologico, hdt: !!val}}})} />
                                   <Label htmlFor="hdt-check" className="text-[10px] font-bold cursor-pointer">HDT</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                   <Checkbox id="comp-check" checked={formData.mantenimientoFicha?.equipoTecnologico.equipoComputo} onCheckedChange={(val) => setFormData({...formData, mantenimientoFicha: {...formData.mantenimientoFicha!, equipoTecnologico: {...formData.mantenimientoFicha!.equipoTecnologico, equipoComputo: !!val}}})} />
                                   <Label htmlFor="comp-check" className="text-[10px] font-bold cursor-pointer">EQUIPO DE CÓMPUTO</Label>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                   <span className="text-[10px] font-bold uppercase text-slate-400">OTRO:</span>
                                   <Input className="h-8 w-40 bg-white text-[10px] font-bold border-primary/10" value={formData.mantenimientoFicha?.equipoTecnologico.otro} onChange={e => setFormData({...formData, mantenimientoFicha: {...formData.mantenimientoFicha!, equipoTecnologico: {...formData.mantenimientoFicha!.equipoTecnologico, otro: e.target.value.toUpperCase()}}})} />
                                </div>
                             </div>
                          </div>

                          <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
                             <Table>
                                <TableHeader className="bg-slate-100">
                                   <TableRow className="h-10">
                                      <TableHead className="w-12 text-[9px] font-black text-center pl-4">N.P.</TableHead>
                                      <TableHead className="text-[9px] font-black">EQUIPO</TableHead>
                                      <TableHead className="text-[9px] font-black">MARCA</TableHead>
                                      <TableHead className="text-[9px] font-black">NO. SERIE</TableHead>
                                      <TableHead className="text-[9px] font-black">NO. CENSAL</TableHead>
                                   </TableRow>
                                </TableHeader>
                                <TableBody>
                                   {formData.mantenimientoFicha?.equiposList.map((eq, idx) => (
                                     <TableRow key={idx} className="h-10">
                                        <TableCell className="text-center font-bold text-slate-400 pl-4">{idx + 1}</TableCell>
                                        <TableCell className="p-1"><Input className="h-8 bg-slate-50/50 border-none text-[10px] font-bold" value={eq.equipo} onChange={e => updateMantenimientoEquipo(idx, 'equipo', e.target.value)} /></TableCell>
                                        <TableCell className="p-1"><Input className="h-8 bg-slate-50/50 border-none text-[10px] font-bold" value={eq.marca} onChange={e => updateMantenimientoEquipo(idx, 'marca', e.target.value)} /></TableCell>
                                        <TableCell className="p-1"><Input className="h-8 bg-slate-50/50 border-none text-[10px] font-bold font-mono" value={eq.serie} onChange={e => updateMantenimientoEquipo(idx, 'serie', e.target.value)} /></TableCell>
                                        <TableCell className="p-1"><Input className="h-8 bg-slate-50/50 border-none text-[10px] font-bold font-mono" value={eq.censal} onChange={e => updateMantenimientoEquipo(idx, 'censal', e.target.value)} /></TableCell>
                                     </TableRow>
                                   ))}
                                </TableBody>
                             </Table>
                          </div>

                          <div className="space-y-6 pt-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="space-y-2">
                                  <Label className="text-[10px] font-black text-primary pl-1">Falla identificada:</Label>
                                  <Input className="h-11 bg-white border-primary/10 font-bold text-xs uppercase" value={formData.mantenimientoFicha?.fallaIdentificada} onChange={e => setFormData({...formData, mantenimientoFicha: {...formData.mantenimientoFicha!, fallaIdentificada: e.target.value.toUpperCase()}})} />
                               </div>
                               <div className="space-y-2">
                                  <Label className="text-[10px] font-black text-primary pl-1">Servicio realizado:</Label>
                                  <Input className="h-11 bg-white border-primary/10 font-bold text-xs uppercase" value={formData.mantenimientoFicha?.servicioRealizado} onChange={e => setFormData({...formData, mantenimientoFicha: {...formData.mantenimientoFicha!, servicioRealizado: e.target.value.toUpperCase()}})} />
                               </div>
                             </div>
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black text-primary pl-1 uppercase tracking-widest text-center block bg-slate-200 py-1 rounded-t-xl">Observaciones</Label>
                                <Textarea className="min-h-[120px] rounded-b-[1.5rem] rounded-t-none border-primary/10 p-4 text-[11px] font-medium bg-white uppercase shadow-inner" value={formData.mantenimientoFicha?.observaciones} onChange={e => setFormData({...formData, mantenimientoFicha: {...formData.mantenimientoFicha!, observaciones: e.target.value.toUpperCase()}})} />
                             </div>
                          </div>
                       </div>
                    </div>
                 </ScrollArea>
              </TabsContent>

              <TabsContent value="asistentes" className="h-full m-0 p-8 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                   <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4 shadow-sm">
                      <CheckCircle2 className="h-6 w-6 text-blue-600" />
                      <p className="text-[10px] font-black text-blue-800 uppercase leading-relaxed">Sincronización Maestra: El sistema jala automáticamente el Nombre C.T., ZE y Sector desde la base actualizada.</p>
                   </div>
                   <Button onClick={handleAddAssistantRow} className="gap-2 font-black uppercase text-[11px] h-12 px-8 shadow-md">
                      <Plus className="h-5 w-5" /> Añadir Servidor Público
                   </Button>
                </div>
                <div className="flex-1 overflow-hidden border-2 border-slate-100 rounded-[2rem] shadow-2xl bg-white">
                  <ScrollArea className="h-full">
                    <div className="w-full overflow-x-auto">
                      <Table className="min-w-[1300px]">
                        <TableHeader className="bg-slate-50 sticky top-0 z-10">
                          <TableRow>
                            <TableHead className="w-12 text-[10px] font-black uppercase text-center">#</TableHead>
                            <TableHead className="w-[280px] text-[10px] font-black uppercase">Apellidos y Nombre(s)</TableHead>
                            <TableHead className="w-[140px] text-[10px] font-black uppercase">RFC Oficial</TableHead>
                            <TableHead className="w-[180px] text-[10px] font-black uppercase">Función</TableHead>
                            <TableHead className="w-[130px] text-[10px] font-black uppercase">CCT Adscripción</TableHead>
                            <TableHead className="w-[250px] text-[10px] font-black uppercase">Plantel (Auto)</TableHead>
                            <TableHead className="w-[80px] text-[10px] font-black uppercase text-center">ZE</TableHead>
                            <TableHead className="w-[80px] text-[10px] font-black uppercase text-center">Sector</TableHead>
                            <TableHead className="w-16 sticky right-0 bg-slate-50"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assistants.map((ast, idx) => (
                            <TableRow key={idx} className="hover:bg-slate-50/50">
                              <TableCell className="text-center font-black text-xs text-muted-foreground">{idx + 1}</TableCell>
                              <TableCell className="p-2">
                                <div className="grid grid-cols-1 gap-1">
                                  <Input placeholder="PATERNO" className="h-8 text-[9px] uppercase" value={ast.paterno} onChange={e => updateAssistantField(idx, 'paterno', e.target.value)} />
                                  <Input placeholder="MATERNO" className="h-8 text-[9px] uppercase" value={ast.materno} onChange={e => updateAssistantField(idx, 'materno', e.target.value)} />
                                  <Input placeholder="NOMBRE(S)" className="h-8 text-[10px] uppercase font-black text-primary border-primary/20 bg-primary/5" value={ast.nombres} onChange={e => updateAssistantField(idx, 'nombres', e.target.value)} />
                                </div>
                              </TableCell>
                              <TableCell className="p-2"><Input placeholder="13 DÍGITOS" className="h-9 text-[11px] font-mono uppercase font-black" value={ast.rfc} onChange={e => updateAssistantField(idx, 'rfc', e.target.value)} maxLength={13} /></TableCell>
                              <TableCell className="p-2">
                                <Select value={ast.funcion} onValueChange={(val: any) => updateAssistantField(idx, 'funcion', val)}>
                                  <SelectTrigger className="h-9 text-[9px] font-bold uppercase"><SelectValue placeholder="FUNCIÓN..." /></SelectTrigger>
                                  <SelectContent className="z-[500]">{FUNCIONES.map(f => (<SelectItem key={f} value={f} className="text-[10px] font-bold uppercase">{f}</SelectItem>))}</SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="p-2"><Input placeholder="15DES0000X" className="h-9 text-[11px] font-mono font-black uppercase border-primary/30" value={ast.cct} onChange={e => updateAssistantField(idx, 'cct', e.target.value)} maxLength={10} /></TableCell>
                              <TableCell className="p-2">
                                <div className="space-y-1">
                                  <Input value={ast.nombreCT} readOnly className="h-8 text-[10px] bg-slate-100 border-none font-black uppercase text-slate-600" />
                                  <Input value={ast.municipio} readOnly className="h-6 text-[8px] bg-slate-100 border-none font-bold uppercase text-muted-foreground" />
                                </div>
                              </TableCell>
                              <TableCell className="p-2"><Input value={ast.ze} readOnly className="h-9 text-center text-[10px] bg-slate-100 border-none font-black" /></TableCell>
                              <TableCell className="p-2"><Input value={ast.sector} readOnly className="h-9 text-center text-[10px] bg-slate-100 border-none font-black" /></TableCell>
                              <TableCell className="p-2 sticky right-0 bg-white shadow-l">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600" onClick={() => handleRemoveAssistantRow(idx)} disabled={assistants.length === 1}>
                                   <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
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

          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-between items-center shrink-0">
             <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase text-slate-400">Progreso Total:</span>
                <div className="w-48"><Progress value={formData.progress} className="h-2" /></div>
                <span className="text-sm font-black text-primary">{formData.progress}%</span>
             </div>
             <div className="flex gap-4">
               <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-12 px-8 font-black uppercase text-xs">Cancelar</Button>
               <Button onClick={handleSave} disabled={isSaving || !formData.cct} className="btn-institutional h-12 px-14 shadow-2xl">
                  {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5 mr-2" />} GUARDAR AUDITORÍA
               </Button>
             </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-[#B38E5D] text-white shrink-0">
            <DialogTitle className="uppercase font-black text-lg flex items-center gap-3"><PlusCircle className="h-6 w-6" /> Registro de Nuevo CCT</DialogTitle>
            <DialogDescription className="text-white/80 text-[10px] font-bold uppercase mt-1">Sume un nuevo plantel a la base maestra para futuros registros.</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">CCT (10 Dígitos)</Label>
                  <Input value={quickAddForm.cct} onChange={e => setQuickAddForm({...quickAddForm, cct: e.target.value.toUpperCase()})} maxLength={10} className="font-mono font-black border-slate-200 h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Nombre del Plantel</Label>
                  <Input value={quickAddForm.nombre} onChange={e => setQuickAddForm({...quickAddForm, nombre: e.target.value.toUpperCase()})} className="font-black border-slate-200 h-12 rounded-xl" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Municipio</Label>
                  <Input value={quickAddForm.municipio} onChange={e => setQuickAddForm({...quickAddForm, municipio: e.target.value.toUpperCase()})} className="font-bold uppercase border-slate-200 h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Región</Label>
                  <Input value={quickAddForm.region} onChange={e => setQuickAddForm({...quickAddForm, region: e.target.value.toUpperCase()})} className="font-bold border-slate-200 h-12 rounded-xl" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Valle</Label>
                  <Select value={quickAddForm.valle} onValueChange={v => setQuickAddForm({...quickAddForm, valle: v})}>
                    <SelectTrigger className="font-bold border-slate-200 h-12 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[400]"><SelectItem value="MEXICO">MÉXICO</SelectItem><SelectItem value="TOLUCA">TOLUCA</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Sector</Label>
                  <Input value={quickAddForm.sector} onChange={e => setQuickAddForm({...quickAddForm, sector: e.target.value.toUpperCase()})} className="font-black border-slate-200 h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Zona Escolar</Label>
                  <Input value={quickAddForm.zonaEscolar} onChange={e => setQuickAddForm({...quickAddForm, zonaEscolar: e.target.value.toUpperCase()})} className="font-black border-slate-200 h-12 rounded-xl" />
                </div>
             </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsQuickAddOpen(false)} className="h-12 px-8 text-[10px] font-black uppercase">Cancelar</Button>
            <Button onClick={handleQuickAddCct} className="bg-primary text-white h-12 px-12 rounded-xl text-[10px] font-black uppercase shadow-lg">Registrar Plantel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
