
'use client'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import { programsData, type ProgramStatus } from "@/lib/planning-data"
import { schoolsDirectory, type SchoolInfo } from "@/lib/schools-directory"
import { cn } from "@/lib/utils"
import Image from 'next/image'
import { 
  PlusCircle, 
  Pencil, 
  Activity,
  Target,
  Search,
  Trash2,
  School,
  CalendarDays,
  Headset,
  CheckCircle2,
  Tag,
  Info,
  Building2,
  Users,
  Plus,
  Mail,
  FilePlus,
  FileBox,
  User,
  History,
  Circle,
  FileSpreadsheet,
  QrCode,
  Copy,
  PieChart,
  LayoutDashboard,
  CheckSquare,
  ChevronRight,
  TrendingUp,
  ClipboardCheck,
  X,
  AlertCircle,
  MapPin,
  Phone,
  LayoutGrid,
  Upload,
  ImageIcon,
  FileText,
  Archive,
  Eye,
  Printer,
  Download,
  Navigation,
  Save
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { VisitSchedulerDialog } from '@/components/VisitSchedulerDialog'
import { HelpDeskDialog } from '@/components/HelpDeskDialog'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'

const PROGRAM_RUBROS = [
  'Cuentas Institucionales',
  'Biblioteca Digital',
  'Geoposición',
  'Conoce mi Escuela',
  'ATRES'
];

const REGIONAL_OFFICES = [
  "Oficina de Tecnóloga Educativa Ecatepec",
  "Oficina de Tecnóloga Educativa Naucalpan",
  "Oficina de Tecnóloga Educativa Nezahualcóyotl",
  "Oficina de Tecnóloga Educativa Toluca",
  "Oficina de COEES Tultitlan"
];

const DOMINIOS = [
  'desysa.edu',
  'desysa.gob.mx',
  'coees.edu.mx'
];

const FUNCIONES = [
  "PAAE",
  "DOCENTE",
  "DIRECTIVO",
  "JEFE DE ENSEÑANZA",
  "SUPERVISOR",
  "ASESOR TECNICO PEDAGOGICO"
]

const ESTATUS_OPCIONES = [
  "ACTIVA",
  "INACTIVA",
  "SUSPENDIDA"
]

const BIBLIOTECA_FASES = [
  { id: 'fase1', label: 'Fase 1: Solicitud de instalación de biblioteca digital' },
  { id: 'fase2', label: 'Fase 2: Atención al CCT' },
  { id: 'fase3', label: 'Fase 3: Diagnóstico del equipo de cómputo existente' },
  { id: 'fase4', label: 'Fase 4: Instalación total de los contenidos del proyecto' },
  { id: 'fase5', label: 'Fase 5: Funcionalidad (pruebas de uso y manejo)' },
  { id: 'fase6', label: 'Fase 6: Personal orientado en el uso y manejo de la herramienta' },
  { id: 'fase7', label: 'Fase 7: Envío vía correo al CCT el formulario de seguimiento' },
]

const FILE_SIZE_LIMIT = 2 * 1024 * 1024; // 2.0 MB

function HelpDeskAccessCard() {
  const [origin, setOrigin] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  if (!origin) return null
  const publicUrl = `${origin}/helpdesk`

  return (
    <Card className="executive-card p-3 bg-[#9f2241] text-white border-none shadow-xl relative overflow-hidden group max-w-2xl animate-in slide-in-from-top duration-500">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><QrCode className="h-16 w-16" /></div>
      <div className="flex items-center gap-4 relative z-10">
        <div className="h-16 w-16 bg-white p-1 rounded-xl shadow-lg flex items-center justify-center shrink-0">
          <div className="relative h-14 w-14">
            <Image 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(publicUrl)}`} 
              alt="QR Mesa de Ayuda" 
              fill
              className="rounded-md"
            />
          </div>
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-wider leading-none">Acceso Mesa de Ayuda ATRES</h3>
            <p className="text-[7px] font-bold uppercase tracking-widest text-white/60 mt-1 truncate">
              Vínculo oficial para atención técnica a usuarios externos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/10 backdrop-blur-md px-3 h-8 rounded-lg border border-white/20 flex-1 flex items-center overflow-hidden">
              <p className="text-[8px] font-mono font-black truncate text-white/90">{publicUrl}</p>
            </div>
            <Button 
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                toast({ title: "Copiado", description: "Enlace listo para compartir." });
              }}
              className="bg-[#B38E5D] hover:bg-[#a67d4a] text-white font-black uppercase text-[8px] h-8 px-3 rounded-lg shadow-lg transition-all active:scale-95 shrink-0"
            >
              <Copy className="h-3 w-3 mr-1" /> Copiar Link
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [activeTab, setActiveTab] = useState(PROGRAM_RUBROS[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false)
  const [isHelpDeskOpen, setIsHelpDeskOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogSearchTerm, setDialogSearchTerm] = useState('')
  const [officeFilter, setOficinaFilter] = useState('all')
  const [pendingCount, setPendingRequestsCount] = useState(0)
  
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  
  const [evidenceToView, setEvidenceToView] = useState<{ 
    pdfData?: string, 
    images?: string[], 
    title: string 
  } | null>(null)

  // CCT Dynamic Logic
  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([])
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddForm, setQuickAddForm] = useState<SchoolInfo>({
    region: '', valle: 'MEXICO', municipio: '', subsistema: 'FEDERALIZADO', control: 'OFICIAL',
    nivel: 'SECUNDARIA', servicioEducativo: 'SECUNDARIA GENERAL', cct: '', turno: 'MATUTINO',
    nombre: '', domicilio: '', localidad: '', telefono: '', zonaEscolar: '', sector: '',
    director: '', hombres: 0, mujeres: 0, alumnos: 0, grupos: 0, maestros: 0, administrativos: 0,
    aulasExistentes: 0, aulasEnUso: 0, modalidad: 'DES'
  })

  const initialFormState: ProgramStatus = {
    id: '', name: '', progress: 0, status: 'activo', date: new Date().toISOString().split('T')[0], requestDate: new Date().toISOString().split('T')[0], cct: '', schoolName: '', 
    zonaEscolar: '', sector: '', modalidad: '', municipio: '', region: '', valle: '', latitud: '', longitud: '',
    numeroEquipos: 0, observaciones: '', capacitacion: 'N', asistentes: [], email: '',
    oficinaRegionalAtencion: '',
    reportPdf: '',
    evidencePhotos: [],
    bibliotecaFases: {
      fase1: false, fase2: false, fase3: false, fase4: false, fase5: false, fase6: false, fase7: false,
      personalCapacitado: 0, equiposHabilitados: 0
    }
  }

  const [formData, setFormData] = useState<ProgramStatus>(initialFormState)

  const syncData = useCallback(() => {
    const currentVersion = 'programs_full_v24'
    const storedV24 = localStorage.getItem(currentVersion)
    if (storedV24) {
      setRecords(JSON.parse(storedV24))
    } else {
      setRecords(programsData)
      localStorage.setItem(currentVersion, JSON.stringify(programsData))
    }

    const rawQueue = localStorage.getItem('atres_support_queue')
    const queue = rawQueue ? JSON.parse(rawQueue) : []
    setPendingRequestsCount(queue.length)

    // Sync Schools
    const storedSchools = JSON.parse(localStorage.getItem('schools_master_full_v21') || '[]')
    if (storedSchools.length > 0) {
      setAllSchools(storedSchools)
    } else {
      setAllSchools(schoolsDirectory)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    syncData()
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'atres_support_queue' || e.key === 'programs_full_v24' || e.key === 'schools_master_full_v21') {
        syncData()
      }
    }
    window.addEventListener('storage', handleStorageEvent)
    return () => window.removeEventListener('storage', handleStorageEvent)
  }, [syncData])

  const handleCctChange = (value: string) => {
    const cleanValue = value.toUpperCase()
    setFormData(prev => ({ ...prev, cct: cleanValue }))
    if (cleanValue.length === 10) {
      const match = allSchools.find(s => s.cct.toUpperCase() === cleanValue)
      if (match) {
        setFormData(prev => ({
          ...prev,
          schoolName: match.nombre,
          municipio: match.municipio,
          valle: match.valle,
          region: match.region,
          zonaEscolar: match.zonaEscolar,
          sector: match.sector,
          modalidad: match.modalidad
        }))
      }
    }
  }

  const handleQuickAddCct = () => {
    if (!quickAddForm.cct || !quickAddForm.nombre || !quickAddForm.municipio) {
      toast({ variant: "destructive", title: "Faltan datos", description: "CCT, Nombre y Municipio son requeridos." }); return;
    }
    const newSchool: SchoolInfo = { 
      ...quickAddForm, 
      cct: quickAddForm.cct.toUpperCase(), 
      nombre: quickAddForm.nombre.toUpperCase(), 
      municipio: quickAddForm.municipio.toUpperCase(),
      domicilio: quickAddForm.domicilio.toUpperCase(),
      localidad: quickAddForm.localidad.toUpperCase(),
      sector: quickAddForm.sector.toUpperCase(),
      zonaEscolar: quickAddForm.zonaEscolar.toUpperCase(),
      modalidad: quickAddForm.modalidad.toUpperCase()
    };
    const updated = [newSchool, ...allSchools];
    setAllSchools(updated);
    localStorage.setItem('schools_master_full_v21', JSON.stringify(updated));
    handleCctChange(newSchool.cct);
    setIsQuickAddOpen(false);
    setDialogSearchTerm('');
    toast({ title: "CCT Registrado en Base Maestra" });
  }

  const handleUpdateFase = (faseId: keyof NonNullable<ProgramStatus['bibliotecaFases']>, value: boolean) => {
    if (!formData.bibliotecaFases) return;
    const updatedFases = { ...formData.bibliotecaFases, [faseId]: value };
    const faseKeys = ['fase1', 'fase2', 'fase3', 'fase4', 'fase5', 'fase6', 'fase7'];
    const completedCount = faseKeys.filter(key => (updatedFases as any)[key]).length;
    const newProgress = Math.round((completedCount / faseKeys.length) * 100);

    setFormData({ 
      ...formData, 
      bibliotecaFases: updatedFases,
      progress: newProgress,
      status: newProgress === 100 ? 'concluido' : 'en proceso'
    });
  }

  const handleUpdateAssistantField = (index: number, field: string, value: string) => {
    const updated = [...(formData.asistentes || [])];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'cct' && value.length === 10) {
      const school = allSchools.find(s => s.cct.toUpperCase() === value.toUpperCase());
      if (school) updated[index].valle = school.valle;
    }
    
    setFormData({ ...formData, asistentes: updated });
  }

  const handleAddAssistant = () => {
    const current = formData.asistentes || [];
    setFormData({
      ...formData,
      asistentes: [...current, { nombreUsuario: '', cct: '', correo: '', funcion: '', dominio: DOMINIOS[0], valle: '', departamento: '', estatus: 'ACTIVA' }]
    });
  }

  const handleRemoveAssistant = (index: number) => {
    const current = formData.asistentes || [];
    setFormData({
      ...formData,
      asistentes: current.filter((_, i) => i !== index)
    });
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'image') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > FILE_SIZE_LIMIT) {
      toast({ variant: "destructive", title: "Archivo demasiado pesado", description: "El límite es de 2.0 MB." })
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
      toast({ title: "Evidencia cargada" })
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

  const handleSave = () => {
    const recordToSave = { ...formData };
    if (!recordToSave.cct && recordToSave.asistentes && recordToSave.asistentes.length > 0) {
      const first = recordToSave.asistentes[0];
      recordToSave.cct = first.cct;
      const school = allSchools.find(s => s.cct === first.cct);
      if (school) {
        recordToSave.schoolName = school.nombre;
        recordToSave.municipio = school.municipio;
        recordToSave.valle = school.valle;
      }
    }
    
    const updated = editingId 
      ? records.map(r => r.id === editingId ? recordToSave : r) 
      : [{...recordToSave, id: recordToSave.id || `SOL-${Date.now()}`}, ...records];
    
    try {
      localStorage.setItem('programs_full_v24', JSON.stringify(updated))
      setRecords(updated)
      setIsDialogOpen(false)
      setEditingId(null)
      setFormData(initialFormState)
      toast({ title: "Cambios guardados correctamente" })
    } catch (e) {
      toast({ 
        variant: "destructive", 
        title: "Error de Memoria", 
        description: "El almacenamiento local está saturado. Elimine archivos adjuntos pesados para poder guardar." 
      })
    }
  }

  const handleDeleteRow = (recordId: string, assistantIndex?: number) => {
    const updated = records.map(r => {
      if (r.id === recordId) {
        if (assistantIndex !== undefined && r.asistentes) {
          const newAsistentes = r.asistentes.filter((_, idx) => idx !== assistantIndex);
          return { ...r, asistentes: newAsistentes };
        }
        return null;
      }
      return r;
    }).filter(r => {
      if (r === null) return false;
      if (['Cuentas Institucionales', 'ATRES'].includes(r.name) && r.asistentes && r.asistentes.length === 0) return false;
      return true;
    }) as ProgramStatus[];

    setRecords(updated);
    localStorage.setItem('programs_full_v24', JSON.stringify(updated));
    toast({ title: "Registro eliminado" });
  };

  const isCensoTab = useMemo(() => ['Cuentas Institucionales', 'ATRES', 'Geoposición'].includes(activeTab), [activeTab]);
  const isBibliotecaTab = useMemo(() => activeTab === 'Biblioteca Digital', [activeTab]);
  const isGeoposicionTab = useMemo(() => activeTab === 'Geoposición', [activeTab]);

  const filteredRecords = useMemo(() => {
    let filtered = records.filter(r => r.name === activeTab);
    if (searchTerm) {
      const term = searchTerm.toUpperCase();
      filtered = filtered.filter(r => 
        (r.cct || '').toUpperCase().includes(term) || 
        (r.schoolName || '').toUpperCase().includes(term) ||
        (r.asistentes || []).some(ast => (ast.nombreUsuario || '').toUpperCase().includes(term) || (ast.cct || '').toUpperCase().includes(term))
      );
    }
    if (officeFilter !== 'all') {
      filtered = filtered.filter(r => r.oficinaRegionalAtencion === officeFilter);
    }
    return [...filtered].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [records, activeTab, searchTerm, officeFilter]);

  const dashboardData = useMemo(() => {
    if (!isBibliotecaTab) return [];
    return filteredRecords.map(r => ({
      name: r.cct || 'S/D',
      progreso: r.progress || 0,
      fullName: r.schoolName
    })).slice(0, 15);
  }, [filteredRecords, isBibliotecaTab]);

  const displayRows = useMemo(() => {
    if (isCensoTab) {
      const flatList: any[] = [];
      filteredRecords.forEach(rec => {
        if (rec.asistentes && rec.asistentes.length > 0) {
          rec.asistentes.forEach((ast, astIdx) => {
            flatList.push({ ...ast, id: rec.id, parentRecord: rec, assistantIndex: astIdx });
          });
        }
      });
      return flatList;
    }
    return filteredRecords;
  }, [filteredRecords, isCensoTab]);

  const downloadExcel = () => {
    if (displayRows.length === 0) {
      toast({ variant: "destructive", title: "Sin datos" })
      return
    }

    let dataToExport: any[] = [];
    if (isCensoTab) {
      dataToExport = displayRows.map((row: any) => ({
        'Usuario': row.nombreUsuario, 'CCT': row.cct, 'Correo': row.correo, 'Dominio': row.dominio,
        'Función': row.funcion, 'Valle': row.valle, 'Departamento': row.departamento, 'Estatus': row.estatus || 'ACTIVA'
      }));
    } else if (isBibliotecaTab) {
      dataToExport = filteredRecords.map(r => ({
        'CCT': r.cct, 'Plantel': r.schoolName, 'Progreso %': r.progress, 'Equipos': r.bibliotecaFases?.equiposHabilitados,
        'Personal': r.bibliotecaFases?.personalCapacitado, 'Fecha Solicitud': r.requestDate, 'Fecha Atención': r.date
      }));
    } else if (isGeoposicionTab) {
      dataToExport = filteredRecords.map(r => ({
        'CCT': r.cct, 'Plantel': r.schoolName, 'Latitud': r.latitud, 'Longitud': r.longitud, 'Fecha': r.date
      }));
    } else {
      dataToExport = filteredRecords.map(rec => ({
        'ID': rec.id, 'CCT': rec.cct, 'Plantel': rec.schoolName, 'Estatus': rec.status, 'Fecha': rec.date
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
    XLSX.writeFile(workbook, `Reporte_${activeTab.replace(/ /g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const openEvidenceViewer = (record: ProgramStatus) => {
    if (!record.reportPdf && (!record.evidencePhotos || record.evidencePhotos.length === 0)) {
      toast({ title: "Sin evidencias" });
      return;
    }
    setEvidenceToView({
      pdfData: record.reportPdf,
      images: record.evidencePhotos,
      title: `Evidencia: ${record.schoolName}`
    });
  }

  const printFile = (data: string) => {
    const win = window.open();
    if (!win) return;
    win.document.write(`<iframe src="${data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
  }

  const schoolSearchResults = useMemo(() => {
    if (!dialogSearchTerm || dialogSearchTerm.length < 3) return [];
    const term = dialogSearchTerm.toUpperCase();
    return allSchools.filter(s => s.cct.includes(term) || s.nombre.includes(term)).slice(0, 5);
  }, [allSchools, dialogSearchTerm]);

  if (!mounted) return null

  return (
    <div className="space-y-4 animate-in fade-in duration-700 w-full max-w-[1550px] mx-auto overflow-hidden px-2">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-primary/5 pb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-primary uppercase leading-none">Módulos Técnicos COEES</h2>
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-accent" />
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.1em]">Control de Programas y Auditoría 2026</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {activeTab === 'ATRES' && (
            <Button onClick={() => setIsHelpDeskOpen(true)} className={cn("h-10 px-6 rounded-xl shadow-md font-black uppercase text-[10px] gap-2 transition-all duration-300", pendingCount > 0 ? "bg-rose-600 ring-4 ring-rose-200 animate-pulse scale-105" : "bg-emerald-600 text-white")}>
              <Headset className={cn("h-4 w-4", pendingCount > 0 && "animate-bounce")} /> {pendingCount > 0 ? `${pendingCount} SOLICITUDES` : "Mesa de Ayuda ATRES"}
            </Button>
          )}
          <Button onClick={downloadExcel} variant="outline" className="h-10 px-6 rounded-xl border-emerald-200 text-emerald-700 font-black uppercase text-[10px] gap-2 hover:bg-emerald-50 shadow-md">
            <FileSpreadsheet className="h-4 w-4" /> Exportar a Excel
          </Button>
          <Button variant="outline" className="h-10 px-6 border-primary/20 text-primary font-black uppercase text-[10px] gap-2 rounded-xl hover:bg-primary/5 shadow-md" onClick={() => setIsSchedulerOpen(true)}><CalendarDays className="h-4 w-4" /> Agenda</Button>
          <Button onClick={() => { 
            const f = {...initialFormState, name: activeTab};
            if (activeTab !== 'Biblioteca Digital') {
               f.asistentes = [{ nombreUsuario: '', cct: '', correo: '', funcion: '', dominio: DOMINIOS[0], valle: '', departamento: '', estatus: 'ACTIVA' }];
            }
            setFormData(f); setEditingId(null); setIsDialogOpen(true); setSearchTerm('');
          }} className="btn-institutional h-10 px-8 rounded-xl shadow-md text-[10px]"><PlusCircle className="h-4 w-4 mr-2" /> Nuevo Registro</Button>
        </div>
      </div>

      <Card className="executive-card p-4 bg-white/80 border-none shadow-lg mt-4">
        <div className="flex flex-col md:flex-row items-end gap-4">
           <div className="flex-1 w-full space-y-1">
              <Label className="text-[9px] font-black uppercase text-slate-400 mb-1 block pl-1">Seleccionar Módulo Institucional</Label>
              <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                {PROGRAM_RUBROS.map(rubro => (
                  <button key={`rubro-${rubro}`} onClick={() => { setActiveTab(rubro); setSearchTerm(''); }} className={cn("px-5 h-10 text-[10px] font-black uppercase rounded-xl transition-all whitespace-nowrap border shadow-sm", activeTab === rubro ? "bg-primary text-white border-primary" : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50")}>{rubro}</button>
                ))}
              </div>
           </div>
           
           <div className="relative flex-1 w-full md:max-w-[300px]">
              <Label className="text-[9px] font-black uppercase text-slate-400 mb-1 block pl-1">Buscador Operativo</Label>
              <div className="relative">
                <Input placeholder="CCT, PLANTEL O USUARIO..." className="h-10 rounded-xl bg-slate-50 border-primary/5 pl-9 text-[10px] font-black uppercase w-full shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
              </div>
           </div>
        </div>
      </Card>

      {activeTab === 'ATRES' && <HelpDeskAccessCard />}

      {isBibliotecaTab ? (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-700">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="executive-card p-6 border-l-8 border-l-primary flex flex-col justify-center">
                 <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Supervisión Biblioteca Digital</p>
                       <h3 className="text-3xl font-black text-slate-800">{filteredRecords.length} <span className="text-xs text-slate-400">Escuelas</span></h3>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                       <ClipboardCheck className="h-6 w-6" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between text-[8px] font-black uppercase">
                       <span>Avance Meta 2026</span>
                       <span>{Math.min(100, Math.round((filteredRecords.length / 150) * 100))}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-primary" style={{ width: `${Math.min(100, (filteredRecords.length / 150) * 100)}%` }} />
                    </div>
                 </div>
              </Card>

              <Card className="executive-card md:col-span-3 p-4">
                 <div className="flex items-center gap-3 mb-4 px-2">
                    <TrendingUp className="h-5 w-5 text-accent" />
                    <h4 className="text-[11px] font-black uppercase text-primary tracking-widest">Avance Comparativo por Centro de Trabajo</h4>
                 </div>
                 <div className="h-[140px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={dashboardData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900 }} />
                          <YAxis dataKey="progreso" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900 }} />
                          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px', fontWeight: '900' }} />
                          <Bar 
                            dataKey="progreso" 
                            radius={[4, 4, 0, 0]} 
                            barSize={25}
                            onClick={(data) => {
                              if (data && data.name) {
                                const record = filteredRecords.find(r => r.cct === data.name);
                                if (record) openEvidenceViewer(record);
                              }
                            }}
                          >
                             {dashboardData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={entry.progreso === 100 ? '#621132' : '#B38E5D'} 
                                  className="cursor-pointer hover:opacity-80 transition-opacity"
                                />
                             ))}
                          </Bar>
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </Card>
           </div>

           <Card className="executive-card p-0 shadow-2xl border-none overflow-hidden bg-white">
              <div className="bg-primary p-4 flex items-center justify-between">
                 <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                    <LayoutDashboard className="h-5 w-5 text-accent" /> BD Supervisión Escolar COEES 2026
                 </h3>
                 <Badge className="bg-white/20 text-white border-none font-black text-[9px]">VISTA MATRICIAL ACTIVA</Badge>
              </div>
              <div className="overflow-x-auto">
                 <Table className="border-collapse">
                    <TableHeader>
                       <TableRow className="bg-slate-50 border-b-2 border-slate-200">
                          <TableHead className="min-w-[320px] font-black uppercase text-[10px] text-slate-800 bg-slate-100/50 sticky left-0 z-20 border-r-2 shadow-r">Fases / Indicadores Técnicos</TableHead>
                          {filteredRecords.map((rec, idx) => (
                            <TableHead key={`head-${rec.cct}-${idx}`} className="min-w-[140px] text-center border-l border-slate-100">
                               <div className="flex flex-col items-center gap-1 py-2">
                                  <span className={cn("text-[11px] font-black", rec.progress === 100 ? "text-emerald-600" : "text-primary")}>{rec.progress}%</span>
                                  <span className="text-[10px] font-mono font-black text-slate-700 tracking-tighter">{rec.cct}</span>
                                  <div className="flex gap-1 mt-1">
                                    <button onClick={() => openEvidenceViewer(rec)} className={cn("h-6 w-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center transition-all", (rec.reportPdf || (rec.evidencePhotos && rec.evidencePhotos.length > 0)) ? "text-emerald-600 border-emerald-200" : "text-slate-300")}>
                                      <Archive className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={() => { setFormData({...rec}); setEditingId(rec.id); setIsDialogOpen(true); }} className="h-6 w-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all">
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={() => handleDeleteRow(rec.id)} className="h-6 w-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-rose-300 hover:text-rose-600 hover:border-rose-600 transition-all">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                               </div>
                            </TableHead>
                          ))}
                          {filteredRecords.length === 0 && <TableHead className="p-8 text-center italic text-slate-400 text-xs">Sin datos para la matriz</TableHead>}
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {BIBLIOTECA_FASES.map((fase) => (
                         <TableRow key={fase.id} className="hover:bg-slate-50/50 border-b border-slate-50 h-12">
                            <TableCell className="bg-slate-50/80 font-bold text-[10px] text-slate-600 uppercase pl-6 sticky left-0 z-10 border-r shadow-r">
                               {fase.label}
                            </TableCell>
                            {filteredRecords.map((rec, idx) => (
                              <TableCell key={`cell-${fase.id}-${rec.cct}-${idx}`} className="text-center border-l border-slate-50">
                                 <div className="flex justify-center">
                                    {(rec.bibliotecaFases as any)?.[fase.id] ? (
                                      <div className="h-5 w-5 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-sm"><CheckCircle2 className="h-3.5 w-3.5" /></div>
                                    ) : (
                                      <div className="h-5 w-5 rounded-lg border-2 border-slate-100 bg-slate-50/50" />
                                    )}
                                 </div>
                              </TableCell>
                            ))}
                         </TableRow>
                       ))}
                       <TableRow className="bg-primary/[0.02] border-t-2 border-primary/10">
                          <TableCell className="bg-slate-100/50 font-black text-[10px] text-primary uppercase pl-6 sticky left-0 z-10 border-r shadow-r">Fecha de Solicitud</TableCell>
                          {filteredRecords.map((rec, idx) => (
                            <TableCell key={`req-date-${idx}`} className="text-center font-bold text-[9px] text-accent border-l border-slate-50 uppercase">{rec.requestDate || 'S/D'}</TableCell>
                          ))}
                       </TableRow>
                       <TableRow className="bg-primary/[0.02]">
                          <TableCell className="bg-slate-100/50 font-black text-[10px] text-primary uppercase pl-6 sticky left-0 z-10 border-r shadow-r">Fecha de Atención</TableCell>
                          {filteredRecords.map((rec, idx) => (
                            <TableCell key={`date-${idx}`} className="text-center font-bold text-[9px] text-slate-500 border-l border-slate-50 uppercase">{rec.date}</TableCell>
                          ))}
                       </TableRow>
                       <TableRow className="bg-primary/[0.02]">
                          <TableCell className="bg-slate-100/50 font-black text-[10px] text-primary uppercase pl-6 sticky left-0 z-10 border-r shadow-r">Total de Personal Capacitado</TableCell>
                          {filteredRecords.map((rec, idx) => (
                            <TableCell key={`pers-${idx}`} className="text-center font-black text-xs text-slate-700 border-l border-slate-50">{rec.bibliotecaFases?.personalCapacitado || 0}</TableCell>
                          ))}
                       </TableRow>
                       <TableRow className="bg-primary/[0.02]">
                          <TableCell className="bg-slate-100/50 font-black text-[10px] text-primary uppercase pl-6 sticky left-0 z-10 border-r shadow-r">Total de Equipos Habilitados</TableCell>
                          {filteredRecords.map((rec, idx) => (
                            <TableCell key={`equip-${idx}`} className="text-center font-black text-xs text-slate-700 border-l border-slate-50">{rec.bibliotecaFases?.equiposHabilitados || 0}</TableCell>
                          ))}
                       </TableRow>
                    </TableBody>
                 </Table>
              </div>
           </Card>
        </div>
      ) : (
        <Card className="executive-card p-0 shadow-2xl border-none overflow-hidden bg-white mt-4">
          <div className="overflow-x-auto w-full">
            <Table className="w-full">
              <TableHeader className="bg-slate-50 border-b">
                 <TableRow className="h-12">
                    <TableHead className="w-10 text-[9px] font-black uppercase text-center pl-4">#</TableHead>
                    {isCensoTab ? (
                      <>
                        <TableHead className="text-[9px] font-black uppercase text-primary min-w-[180px]">Usuario</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-primary w-[110px]">CCT</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-primary min-w-[140px]">Correo / Dominio</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-primary w-[110px]">Función</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-primary w-[90px]">Valle</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-primary min-w-[130px]">Departamento</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-primary w-[100px]">Estatus</TableHead>
                      </>
                    ) : isGeoposicionTab ? (
                      <>
                        <TableHead className="text-[9px] font-black uppercase text-primary w-[110px]">CCT</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-primary min-w-[200px]">Identificación del Plantel</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-primary w-[120px] text-center">Latitud</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-primary w-[120px] text-center">Longitud</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-primary w-[100px]">Estatus</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead className="text-[9px] font-black uppercase text-primary w-[110px]">CCT</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-primary min-w-[200px]">Identificación del Plantel</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-primary w-[100px]">Estatus</TableHead>
                      </>
                    )}
                    <TableHead className="text-right text-[9px] font-black uppercase pr-6 w-24">Acción</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                {displayRows.length > 0 ? displayRows.map((row, idx) => {
                  if (isCensoTab) {
                    return (
                      <TableRow key={`census-${row.id}-${idx}`} className="hover:bg-slate-50 border-b border-slate-50 h-14 group">
                        <TableCell className="text-center font-black text-[10px] text-slate-300 pl-4">{idx + 1}</TableCell>
                        <TableCell className="font-black text-[10px] text-slate-700 uppercase">{row.nombreUsuario}</TableCell>
                        <TableCell className="font-black text-[10px] text-primary tracking-tight font-mono">{row.cct}</TableCell>
                        <TableCell><div className="flex flex-col"><span className="text-[9px] font-bold text-slate-600">{row.correo}</span><span className="text-[8px] font-black text-accent uppercase">@{row.dominio}</span></div></TableCell>
                        <TableCell><Badge variant="outline" className="text-[8px] font-black uppercase border-slate-200">{row.funcion}</Badge></TableCell>
                        <TableCell className="text-[9px] font-black text-slate-500">{row.valle}</TableCell>
                        <TableCell className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[120px]">{row.departamento}</TableCell>
                        <TableCell><Badge variant="outline" className={cn("text-[8px] font-black uppercase", row.estatus === 'ACTIVA' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : row.estatus === 'INACTIVA' ? 'border-slate-200 text-slate-500 bg-slate-50' : 'border-rose-200 text-rose-700 bg-rose-50')}>{row.estatus || 'ACTIVA'}</Badge></TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => { setFormData({...row.parentRecord}); setEditingId(row.parentRecord.id); setIsDialogOpen(true); }} className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDeleteRow(row.id, row.assistantIndex)} className="h-7 w-7 flex items-center justify-center text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }
                  const rec = row as ProgramStatus;
                  return (
                    <TableRow key={`${rec.id}-${idx}`} className="hover:bg-slate-50 border-b border-slate-50 h-14 group">
                      <TableCell className="text-center font-black text-[10px] text-slate-300 pl-4">{idx + 1}</TableCell>
                      <TableCell className="font-black text-[10px] text-primary tracking-tight">{rec.cct}</TableCell>
                      <TableCell className="py-2"><div className="flex flex-col min-w-0"><span className="text-[10px] font-black text-slate-700 uppercase leading-tight truncate max-w-[180px]">{rec.schoolName}</span><span className="text-[8px] font-bold text-muted-foreground uppercase opacity-70 truncate max-w-[180px]">{rec.municipio} • {rec.valle}</span></div></TableCell>
                      {isGeoposicionTab && (
                        <>
                          <TableCell className="text-center font-mono text-[9px] font-black text-emerald-600">{rec.latitud || 'S/C'}</TableCell>
                          <TableCell className="text-center font-mono text-[9px] font-black text-emerald-600">{rec.longitud || 'S/C'}</TableCell>
                        </>
                      )}
                      <TableCell><Badge variant="outline" className={cn("text-[8px] font-black uppercase py-0.5 px-2 rounded-full", (rec.status === 'activo' || rec.status === 'pendiente' || rec.status === 'en proceso') ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-emerald-200 text-emerald-700 bg-emerald-50')}>{rec.status?.toUpperCase() || 'ACTIVO'}</Badge></TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setFormData({...rec}); setEditingId(rec.id); setIsDialogOpen(true); }} className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDeleteRow(rec.id)} className="h-7 w-7 flex items-center justify-center text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }) : (<TableRow><TableCell colSpan={12} className="text-center py-24 opacity-30 text-xs font-black uppercase tracking-widest">Sin registros disponibles</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <HelpDeskDialog open={isHelpDeskOpen} onOpenChange={setIsHelpDeskOpen} />
      <VisitSchedulerDialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen} areaId="programas" areaName="Programas" />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[1200px] rounded-[3rem] h-[95vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white shrink-0 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Target className="h-40 w-40" /></div>
             <DialogTitle className="uppercase font-black text-white text-2xl flex items-center gap-4 relative z-10">
                <Target className="h-8 w-8 text-white/40" /> Gestión de {activeTab}
             </DialogTitle>
             <DialogDescription className="text-white/60 font-bold text-[10px] uppercase tracking-widest mt-1 relative z-10">
                Administración integral del módulo técnico institucional COEES 2026.
             </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden bg-white">
            {isBibliotecaTab ? (
              <Tabs defaultValue="seguimiento" className="h-full flex flex-col">
                <div className="px-8 border-b bg-slate-50/50">
                  <TabsList className="bg-transparent h-14 p-0 gap-8">
                    <TabsTrigger value="seguimiento" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider">1. Seguimiento Técnico</TabsTrigger>
                    {formData.bibliotecaFases && formData.bibliotecaFases.personalCapacitado > 0 && (
                      <TabsTrigger value="asistentes" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider animate-in slide-in-from-left">2. Lista de Asistentes (Captura Directa)</TabsTrigger>
                    )}
                  </TabsList>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <TabsContent value="seguimiento" className="p-8 space-y-6 m-0">
                      <div className="p-6 bg-slate-50 rounded-[2rem] border border-primary/10 relative space-y-4 shadow-inner">
                        <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                            <Search className="h-4 w-4 text-accent" /> Identificación del Centro de Trabajo
                        </Label>
                        <div className="relative">
                            <Input placeholder="BUSCAR CCT O NOMBRE..." className="h-12 rounded-xl bg-white border-primary/10 font-bold uppercase shadow-sm" value={dialogSearchTerm} onChange={(e) => setDialogSearchTerm(e.target.value)} />
                            {dialogSearchTerm.length > 2 && (
                              <div className="absolute top-13 left-0 right-0 bg-white border rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y">
                                {schoolSearchResults.map(s => (
                                  <div key={`s-diag-${s.cct}-${s.turno}`} className="p-3 hover:bg-primary/5 cursor-pointer flex justify-between items-center" onClick={() => { handleCctChange(s.cct); setDialogSearchTerm(''); }}>
                                    <span className="text-[10px] font-black uppercase">{s.nombre}</span>
                                    <Badge className="text-[8px] font-mono">{s.cct}</Badge>
                                  </div>
                                ))}
                                {schoolSearchResults.length === 0 && (
                                  <div className="p-4 text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">CCT No Registrado</p>
                                    <Button size="sm" variant="outline" className="h-8 text-[9px] font-black uppercase border-primary/20 text-primary" onClick={() => { setQuickAddForm({...quickAddForm, cct: ''}); setIsQuickAddOpen(true); }}>
                                      <Plus className="h-3 w-3 mr-1" /> Alta Rápida de Plantel
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                        {formData.cct && (
                          <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-emerald-100 animate-in zoom-in-95"><School className="h-8 w-8 text-emerald-600" /><div><h4 className="text-xs font-black uppercase text-slate-800">{formData.schoolName}</h4><p className="text-[9px] font-bold text-slate-400">{formData.cct} • {formData.municipio} • {formData.valle}</p></div></div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3 border-b-2 border-primary/10 pb-2"><CheckSquare className="h-5 w-5 text-primary" /><h3 className="text-sm font-black uppercase text-primary">Fases de Instalación y Seguimiento</h3></div>
                        <div className="grid grid-cols-1 gap-3 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                            {BIBLIOTECA_FASES.map((fase) => (
                              <div key={fase.id} className="flex items-center space-x-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm group hover:border-primary/20 transition-all"><Checkbox id={fase.id} checked={(formData.bibliotecaFases as any)?.[fase.id]} onCheckedChange={(checked) => handleUpdateFase(fase.id as any, !!checked)} className="h-6 w-6 border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-600" /><Label htmlFor={fase.id} className="text-[11px] font-black uppercase text-slate-600 cursor-pointer group-hover:text-primary transition-colors flex-1">{fase.label}</Label></div>
                            ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary pl-1">Fecha de Solicitud</Label><Input type="date" className="h-12 rounded-xl bg-slate-50 border-none font-bold" value={formData.requestDate} onChange={e => setFormData({...formData, requestDate: e.target.value})} /></div>
                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary pl-1">Fecha de Atención</Label><Input type="date" className="h-12 rounded-xl bg-slate-50 border-none font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-primary pl-1">Personal Capacitado</Label>
                          <Input 
                            type="number" 
                            className="h-12 rounded-xl bg-slate-50 border-none font-black text-center text-lg" 
                            value={formData.bibliotecaFases?.personalCapacitado} 
                            onChange={e => {
                              const val = parseInt(e.target.value) || 0;
                              setFormData({
                                ...formData, 
                                bibliotecaFases: {...formData.bibliotecaFases!, personalCapacitado: val},
                                asistentes: (val > 0 && (!formData.asistentes || formData.asistentes.length === 0)) ? [{ nombreUsuario: '', cct: '', correo: '', funcion: 'DOCENTE', dominio: DOMINIOS[0], valle: '', departamento: '', estatus: 'ACTIVA' }] : formData.asistentes
                              })
                            }} 
                          />
                        </div>
                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary pl-1">Equipos Habilitados</Label><Input type="number" className="h-12 rounded-xl bg-slate-50 border-none font-black text-center text-lg" value={formData.bibliotecaFases?.equiposHabilitados} onChange={e => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, equiposHabilitados: parseInt(e.target.value) || 0}})} /></div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3 border-b-2 border-primary/10 pb-2"><Info className="h-5 w-5 text-primary" /><h3 className="text-sm font-black uppercase text-primary">Observaciones Técnicas</h3></div>
                        <Textarea className="min-h-[120px] rounded-xl p-5 bg-slate-50 border-2 border-slate-200 text-xs font-semibold shadow-inner focus:bg-white" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder="Detalle técnico o acuerdos del módulo..." />
                      </div>

                      <div className="space-y-6 pt-6 border-t-2 border-primary/5">
                        <div className="flex items-center gap-3 border-b-2 border-primary/10 pb-2"><div className="h-10 w-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-lg"><Archive className="h-6 w-6" /></div><h3 className="text-sm font-black uppercase text-primary tracking-wider">Evidencia Digital (PDF e imágenes PNG)</h3></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                              <Label className="text-[10px] font-black uppercase text-slate-400 pl-2">Reporte Oficial Escaneado (PDF)</Label>
                              <div className={cn("p-6 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all relative group", formData.reportPdf ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200 hover:border-primary/40")}>
                                 {formData.reportPdf ? (
                                   <div className="flex flex-col items-center gap-3">
                                      <div className="h-14 w-14 rounded-2xl bg-white shadow-xl flex items-center justify-center text-emerald-600"><FileText className="h-8 w-8" /></div>
                                      <p className="text-[10px] font-black uppercase text-emerald-700">REPORTE CARGADO</p>
                                      <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8 text-rose-500 hover:bg-rose-100 rounded-full" onClick={() => setFormData(prev => ({...prev, reportPdf: ''}))}><X className="h-4 w-4" /></Button>
                                   </div>
                                 ) : (
                                   <>
                                      <Upload className="h-8 w-8 text-slate-300 group-hover:scale-110 transition-transform" />
                                      <div className="text-center"><p className="text-[10px] font-black uppercase text-slate-700">Subir Formato PDF</p><p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Límite: 2.0 MB</p></div>
                                      <Button variant="outline" size="sm" onClick={() => pdfInputRef.current?.click()} className="h-9 px-6 rounded-xl text-[9px] font-black uppercase border-primary/20 hover:bg-primary/5">Seleccionar</Button>
                                   </>
                                 )}
                                 <input type="file" accept=".pdf" className="hidden" ref={pdfInputRef} onChange={(e) => handleFileChange(e, 'pdf')} />
                              </div>
                           </div>

                           <div className="space-y-4">
                              <Label className="text-[10px] font-black uppercase text-slate-400 pl-2">Galería de Evidencias (PNG)</Label>
                              <div className="p-6 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3 group hover:border-primary/40 transition-all relative">
                                  <ImageIcon className="h-8 w-8 text-slate-300 group-hover:scale-110 transition-transform" />
                                  <div className="text-center"><p className="text-[10px] font-black uppercase text-slate-700">Adjuntar Imágenes PNG</p><p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Máximo 2.0 MB por archivo</p></div>
                                  <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} className="h-9 px-6 rounded-xl text-[9px] font-black uppercase border-primary/20 hover:bg-primary/5">Añadir Imagen</Button>
                                  <input type="file" accept=".png" className="hidden" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} />
                              </div>
                              
                              <div className="grid grid-cols-3 gap-3 mt-4">
                                 {(formData.evidencePhotos || []).map((img, idx) => (
                                   <div key={`ev-img-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-white shadow-md group">
                                      <Image src={img} alt={`Evidencia ${idx}`} fill className="object-cover" />
                                      <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 h-5 w-5 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                                   </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="asistentes" className="p-8 space-y-6 m-0">
                      <div className="flex justify-between items-center mb-4">
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4 shadow-sm">
                          <CheckCircle2 className="h-6 w-6 text-blue-600" />
                          <p className="text-[10px] font-black text-blue-800 uppercase leading-relaxed tracking-wide">
                            Registro de Servidores Públicos: Ingrese el CCT para autocompletar la información del plantel de origen.
                          </p>
                        </div>
                        <Button onClick={handleAddAssistant} className="gap-2 font-black uppercase text-[10px] h-10 px-6 shadow-md">
                          <Plus className="h-4 w-4" /> Añadir Asistente
                        </Button>
                      </div>

                      <div className="border-2 border-slate-100 rounded-[1.5rem] bg-white overflow-hidden shadow-inner">
                        <ScrollArea className="h-full">
                          <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 z-20 shadow-sm">
                                <TableRow>
                                  <TableHead className="w-12 text-[9px] font-black uppercase text-center">#</TableHead>
                                  <TableHead className="min-w-[200px] text-[9px] font-black uppercase">Nombre del Usuario</TableHead>
                                  <TableHead className="min-w-[120px] text-[9px] font-black uppercase">CCT Origen</TableHead>
                                  <TableHead className="min-w-[150px] text-[9px] font-black uppercase">Función</TableHead>
                                  <TableHead className="min-w-[120px] text-[9px] font-black uppercase text-center">Valle</TableHead>
                                  <TableHead className="w-16"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(formData.asistentes || []).map((ast, idx) => (
                                  <TableRow key={`ast-lib-${idx}`} className="hover:bg-slate-50/50 group border-b border-slate-50">
                                      <TableCell className="text-center font-black text-[10px] text-muted-foreground">{idx + 1}</TableCell>
                                      <TableCell className="p-2"><Input placeholder="APELLIDOS NOMBRE..." className="h-9 text-[10px] uppercase font-bold border-primary/5 bg-primary/[0.02]" value={ast.nombreUsuario} onChange={e => handleUpdateAssistantField(idx, 'nombreUsuario', e.target.value.toUpperCase())} /></TableCell>
                                      <TableCell className="p-2"><Input placeholder="15DES0000X" className="h-9 text-[10px] font-mono font-black uppercase" value={ast.cct} onChange={e => handleUpdateAssistantField(idx, 'cct', e.target.value.toUpperCase())} maxLength={10} /></TableCell>
                                      <TableCell className="p-2"><Select value={ast.funcion} onValueChange={v => handleUpdateAssistantField(idx, 'funcion', v)}><SelectTrigger className="h-9 text-[10px] font-bold uppercase"><SelectValue placeholder="FUNCIÓN..." /></SelectTrigger><SelectContent className="rounded-xl">{FUNCIONES.map(f => <SelectItem key={`f-lib-${f}`} value={f} className="text-[10px] font-bold uppercase">{f}</SelectItem>)}</SelectContent></Select></TableCell>
                                      <TableCell className="p-2"><Input value={ast.valle} readOnly className="h-9 text-center text-[10px] bg-slate-50 border-none font-black text-slate-500" /></TableCell>
                                      <TableCell className="p-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300 hover:text-rose-600 rounded-lg" onClick={() => handleRemoveAssistant(idx)}>
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                          <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                        {(!formData.asistentes || formData.asistentes.length === 0) && (
                          <div className="py-20 text-center opacity-30 flex flex-col items-center gap-2">
                            <Users className="h-10 w-10" />
                            <p className="text-[10px] font-black uppercase">Sin asistentes registrados</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </ScrollArea>
                </div>
              </Tabs>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-8 space-y-8">
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-primary/10 relative space-y-4 shadow-inner">
                    <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2 pl-2">
                        <Search className="h-4 w-4 text-accent" /> Identificación del Centro de Trabajo
                    </Label>
                    <div className="relative">
                        <Input placeholder="BUSCAR CCT O NOMBRE..." className="h-12 rounded-xl bg-white border-primary/10 font-bold uppercase shadow-sm" value={dialogSearchTerm} onChange={(e) => setDialogSearchTerm(e.target.value)} />
                        {dialogSearchTerm.length > 2 && (
                          <div className="absolute top-13 left-0 right-0 bg-white border rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y">
                            {schoolSearchResults.map(s => (
                              <div key={`s-diag-general-${s.cct}-${s.turno}`} className="p-3 hover:bg-primary/5 cursor-pointer flex justify-between items-center" onClick={() => { handleCctChange(s.cct); setDialogSearchTerm(''); }}>
                                <span className="text-[10px] font-black uppercase">{s.nombre}</span>
                                <Badge className="text-[8px] font-mono">{s.cct}</Badge>
                              </div>
                            ))}
                            {schoolSearchResults.length === 0 && (
                              <div className="p-4 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">CCT No Registrado</p>
                                <Button size="sm" variant="outline" className="h-8 text-[9px] font-black uppercase border-primary/20 text-primary" onClick={() => { setQuickAddForm({...quickAddForm, cct: ''}); setIsQuickAddOpen(true); }}>
                                  <Plus className="h-3 w-3 mr-1" /> Alta Rápida de Plantel
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                    {formData.cct && (
                      <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-emerald-100 animate-in zoom-in-95"><School className="h-8 w-8 text-emerald-600" /><div><h4 className="text-xs font-black uppercase text-slate-800">{formData.schoolName}</h4><p className="text-[9px] font-bold text-slate-400">{formData.cct} • {formData.municipio} • {formData.valle}</p></div></div>
                    )}
                  </div>

                  {isGeoposicionTab && (
                    <div className="space-y-4 animate-in slide-in-from-top-2">
                      <div className="flex items-center gap-3 border-b-2 border-primary/10 pb-2">
                        <Navigation className="h-5 w-5 text-primary" />
                        <h3 className="text-sm font-black uppercase text-primary">Coordenadas de Geoposición</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                        <div className="space-y-2">
                          <Label className="text-[11px] font-black uppercase text-primary pl-1">Latitud</Label>
                          <Input 
                            placeholder="EJ: 19.345678" 
                            className="h-12 bg-white border-none rounded-xl text-sm font-black shadow-sm" 
                            value={formData.latitud || ''} 
                            onChange={e => setFormData({...formData, latitud: e.target.value})} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[11px] font-black uppercase text-primary pl-1">Longitud</Label>
                          <Input 
                            placeholder="EJ: -99.456789" 
                            className="h-12 bg-white border-none rounded-xl text-sm font-black shadow-sm" 
                            value={formData.longitud || ''} 
                            onChange={e => setFormData({...formData, longitud: e.target.value})} 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b-2 border-primary/10 pb-2">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-primary" />
                        <h3 className="text-sm font-black uppercase text-primary">Censo de Personal del Módulo</h3>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleAddAssistant} className="h-8 rounded-lg border-primary/20 text-primary font-black uppercase text-[9px] hover:bg-primary/5 shadow-sm">
                        <Plus className="h-3 w-3 mr-1" /> Añadir Servidor
                      </Button>
                    </div>
                    
                    <div className="border-2 border-slate-100 rounded-[1.5rem] bg-white overflow-hidden shadow-inner min-h-[300px] flex flex-col">
                      <ScrollArea className="flex-1">
                        <div className="min-w-[1200px]">
                          <Table className="border-collapse w-full">
                            <TableHeader className="bg-slate-50 sticky top-0 z-20 shadow-sm border-b">
                                <TableRow>
                                  <TableHead className="w-14 text-[9px] font-black uppercase text-center pl-4">#</TableHead>
                                  <TableHead className="w-[250px] text-[9px] font-black uppercase">Nombre del Usuario</TableHead>
                                  <TableHead className="w-[130px] text-[9px] font-black uppercase">CCT</TableHead>
                                  <TableHead className="w-[180px] text-[9px] font-black uppercase">Correo</TableHead>
                                  <TableHead className="w-[180px] text-[9px] font-black uppercase">Función</TableHead>
                                  <TableHead className="w-[110px] text-[9px] font-black uppercase text-center">Valle</TableHead>
                                  <TableHead className="w-[180px] text-[9px] font-black uppercase">Departamento</TableHead>
                                  <TableHead className="w-[130px] text-[9px] font-black uppercase">Estatus</TableHead>
                                  <TableHead className="w-14 pr-4"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(formData.asistentes || []).length > 0 ? (formData.asistentes || []).map((ast, idx) => (
                                  <TableRow key={`ast-${idx}`} className="hover:bg-slate-50 transition-colors group border-b border-slate-50 h-16">
                                      <TableCell className="text-center font-black text-[10px] text-slate-300 pl-4">{idx + 1}</TableCell>
                                      <TableCell className="p-2">
                                        <Input placeholder="APELLIDOS NOMBRE..." className="h-10 text-[10px] uppercase font-black border-primary/5 bg-primary/[0.02] shadow-sm" value={ast.nombreUsuario} onChange={e => handleUpdateAssistantField(idx, 'nombreUsuario', e.target.value.toUpperCase())} />
                                      </TableCell>
                                      <TableCell className="p-2">
                                        <Input placeholder="15DES0000X" className="h-10 text-[10px] font-mono font-black uppercase shadow-sm" value={ast.cct} onChange={e => handleUpdateAssistantField(idx, 'cct', e.target.value.toUpperCase())} maxLength={10} />
                                      </TableCell>
                                      <TableCell className="p-2">
                                        <Input placeholder="usuario.ejemplo" className="h-10 text-[10px] font-semibold border-accent/20 bg-accent/[0.02] pl-2 shadow-sm" value={ast.correo} onChange={e => handleUpdateAssistantField(idx, 'correo', e.target.value.toLowerCase())} />
                                      </TableCell>
                                      <TableCell className="p-2">
                                        <Select value={ast.funcion} onValueChange={v => handleUpdateAssistantField(idx, 'funcion', v)}>
                                          <SelectTrigger className="h-10 text-[10px] font-bold uppercase shadow-sm"><SelectValue placeholder="FUNCIÓN..." /></SelectTrigger>
                                          <SelectContent className="rounded-xl">{FUNCIONES.map(f => <SelectItem key={`f-${f}`} value={f} className="text-[10px] font-bold uppercase">{f}</SelectItem>)}</SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell className="p-2">
                                        <Select value={ast.valle} onValueChange={v => handleUpdateAssistantField(idx, 'valle', v)}>
                                          <SelectTrigger className="h-10 text-center text-[10px] font-black uppercase border-slate-200 shadow-sm"><SelectValue placeholder="VALLE..." /></SelectTrigger>
                                          <SelectContent className="rounded-xl"><SelectItem value="TOLUCA" className="text-[10px] font-bold uppercase">TOLUCA</SelectItem><SelectItem value="MEXICO" className="text-[10px] font-bold uppercase">MÉXICO</SelectItem></SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell className="p-2">
                                        <Input placeholder="OFICINA / DEPTO..." className="h-10 text-[10px] font-bold uppercase border-slate-200 shadow-sm" value={ast.departamento} onChange={e => handleUpdateAssistantField(idx, 'departamento', e.target.value.toUpperCase())} />
                                      </TableCell>
                                      <TableCell className="p-2">
                                        <Select value={ast.estatus || 'ACTIVA'} onValueChange={v => handleUpdateAssistantField(idx, 'estatus', v)}>
                                          <SelectTrigger className={cn("h-10 text-[10px] font-black uppercase border-2 shadow-sm", ast.estatus === 'ACTIVA' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : ast.estatus === 'INACTIVA' ? 'border-slate-200 text-slate-500 bg-slate-50' : 'border-rose-200 text-rose-700 bg-rose-50')}><SelectValue /></SelectTrigger>
                                          <SelectContent className="rounded-xl">{ESTATUS_OPCIONES.map(e => (<SelectItem key={`est-${e}`} value={e} className={cn("text-[10px] font-black", e === 'ACTIVA' ? 'text-emerald-600' : e === 'INACTIVA' ? 'text-slate-500' : 'text-rose-600')}>{e}</SelectItem>))}</SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell className="p-2 pr-4 text-right">
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => handleRemoveAssistant(idx)}>
                                          <Trash2 className="h-4.5 w-4.5" />
                                        </Button>
                                      </TableCell>
                                  </TableRow>
                                )) : (
                                  <TableRow>
                                    <TableCell colSpan={9} className="py-20 text-center opacity-30">
                                      <div className="flex flex-col items-center gap-4">
                                        <div className="h-16 w-16 bg-slate-50 rounded-3xl flex items-center justify-center"><Users className="h-8 w-8 text-slate-400" /></div>
                                        <div className="space-y-1">
                                          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Sin personal registrado en el censo</p>
                                          <Button variant="link" onClick={handleAddAssistant} className="text-[10px] font-black uppercase text-primary">Haga clic aquí para añadir el primer servidor</Button>
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                            </TableBody>
                          </Table>
                        </div>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 border-b-2 border-primary/10 pb-2"><Info className="h-5 w-5 text-primary" /><h3 className="text-sm font-black uppercase text-primary">Observaciones Técnicas</h3></div>
                    <Textarea className="min-h-[120px] rounded-xl p-5 bg-slate-50 border-2 border-slate-200 text-xs font-semibold shadow-inner focus:bg-white" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder="Detalle técnico o acuerdos del módulo..." />
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>
          <DialogFooter className="p-8 gap-3 border-t bg-slate-50 flex items-center justify-end shrink-0">
             <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-12 px-8 text-[11px] font-black uppercase text-slate-400">Cancelar</Button>
             <Button onClick={handleSave} className="btn-institutional h-12 px-14 text-[11px] shadow-2xl">
               <Save className="h-5 w-5 mr-2" /> Guardar Cambios
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Alta Rápida de CCT */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-[#B38E5D] text-white">
            <DialogTitle className="uppercase font-black text-lg flex items-center gap-3">
              <PlusCircle className="h-6 w-6" /> Registro de Nuevo CCT
            </DialogTitle>
            <DialogDescription className="text-white/80 text-[10px] font-bold uppercase mt-1">
              Sume un nuevo plantel a la base maestra del sistema integral.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">CCT (10 Dígitos)</Label>
                  <Input value={quickAddForm.cct} onChange={e => setQuickAddForm({...quickAddForm, cct: e.target.value.toUpperCase()})} maxLength={10} className="font-mono font-black border-slate-200 h-12 bg-slate-50 shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Nombre del Plantel</Label>
                  <Input value={quickAddForm.nombre} onChange={e => setQuickAddForm({...quickAddForm, nombre: e.target.value.toUpperCase()})} className="font-black border-slate-200 h-12 bg-slate-50 shadow-inner" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Domicilio (Calle y Número)</Label>
                  <Input value={quickAddForm.domicilio} onChange={e => setQuickAddForm({...quickAddForm, domicilio: e.target.value})} className="font-bold border-slate-200 h-12 bg-slate-50 shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Teléfono</Label>
                  <Input value={quickAddForm.telefono} onChange={e => setQuickAddForm({...quickAddForm, telefono: e.target.value})} className="font-mono font-black border-slate-200 h-12 bg-slate-50 shadow-inner" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Localidad</Label>
                  <Input value={quickAddForm.localidad} onChange={e => setQuickAddForm({...quickAddForm, localidad: e.target.value})} className="font-bold border-slate-200 h-12 bg-slate-50 shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Municipio</Label>
                  <Input value={quickAddForm.municipio} onChange={e => setQuickAddForm({...quickAddForm, municipio: e.target.value.toUpperCase()})} className="font-bold uppercase border-slate-200 h-12 bg-slate-50 shadow-inner" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Sector</Label>
                  <Input value={quickAddForm.sector} onChange={e => setQuickAddForm({...quickAddForm, sector: e.target.value})} className="font-black border-slate-200 h-11 bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Zona Escolar</Label>
                  <Input value={quickAddForm.zonaEscolar} onChange={e => setQuickAddForm({...quickAddForm, zonaEscolar: e.target.value})} className="font-black border-slate-200 h-11 bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Modalidad</Label>
                  <Select value={quickAddForm.modalidad} onValueChange={v => setQuickAddForm({...quickAddForm, modalidad: v})}>
                    <SelectTrigger className="text-[10px] font-bold uppercase border-slate-200 h-11 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="DES" className="text-[10px] font-bold">DES (GENERAL)</SelectItem>
                      <SelectItem value="DST" className="text-[10px] font-bold">DST (TÉCNICA)</SelectItem>
                      <SelectItem value="DTV" className="text-[10px] font-bold">DTV (TELESECUNDARIA)</SelectItem>
                      <SelectItem value="ADG" className="text-[10px] font-bold">ADG (DEPARTAMENTO)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Turno</Label>
                  <Select value={quickAddForm.turno} onValueChange={v => setQuickAddForm({...quickAddForm, turno: v})}><SelectTrigger className="text-[10px] font-bold uppercase border-slate-200 h-11 bg-white"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="MATUTINO">MATUTINO</SelectItem><SelectItem value="VESPERTINO">VESPERTINO</SelectItem><SelectItem value="MIXTO">MIXTO</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Valle</Label>
                  <Select value={quickAddForm.valle} onValueChange={v => setQuickAddForm({...quickAddForm, valle: v})}><SelectTrigger className="text-[10px] font-bold uppercase border-slate-200 h-11 bg-white"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="MEXICO">MÉXICO</SelectItem><SelectItem value="TOLUCA">TOLUCA</SelectItem></SelectContent></Select>
                </div>
             </div>
             <div className="p-4 bg-amber-50 border border-amber-100 rounded-[1.5rem] flex items-center gap-4">
                <AlertCircle className="h-6 w-6 text-amber-600" />
                <p className="text-[9px] font-black text-amber-800 uppercase leading-none">Este registro se sincronizará con todos los módulos operativos del sistema integral.</p>
             </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4 shrink-0">
             <Button variant="ghost" onClick={() => setIsQuickAddOpen(false)} className="h-12 px-8 text-[11px] font-black uppercase text-slate-400">Cancelar</Button>
             <Button onClick={handleQuickAddCct} className="bg-primary text-white h-12 px-14 rounded-xl text-[11px] font-black uppercase shadow-2xl hover:scale-105 active:scale-95 transition-all">Registrar y Sumar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visor de Evidencia */}
      <Dialog open={!!evidenceToView} onOpenChange={(open) => !open && setEvidenceToView(null)}>
        <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white shrink-0 flex flex-row justify-between items-center pr-12">
            <div className="space-y-1">
              <DialogTitle className="uppercase font-black text-white text-xl flex items-center gap-4">
                <Archive className="h-7 w-7 text-accent" /> {evidenceToView?.title}
              </DialogTitle>
              <DialogDescription className="text-white/60 font-bold text-[10px] uppercase tracking-widest mt-1">
                Expediente Digital de Programas Técnicos COEES 2026
              </DialogDescription>
            </div>
            <div className="flex gap-4">
              {evidenceToView?.pdfData && (
                <Button onClick={() => printFile(evidenceToView.pdfData!)} className="bg-white text-primary hover:bg-slate-100 font-black text-[10px] uppercase h-10 px-6 rounded-xl gap-2 shadow-xl">
                  <Printer className="h-4 w-4" /> Imprimir Reporte
                </Button>
              )}
              <button onClick={() => setEvidenceToView(null)} className="h-10 w-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>
          </DialogHeader>

          <Tabs defaultValue={evidenceToView?.pdfData ? "pdf" : "gallery"} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-8 border-b bg-slate-50/50">
               <TabsList className="bg-transparent h-14 p-0 gap-8">
                  {evidenceToView?.pdfData && (
                    <TabsTrigger value="pdf" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Reporte Oficial PDF
                    </TabsTrigger>
                  )}
                  {evidenceToView?.images && evidenceToView.images.length > 0 && (
                    <TabsTrigger value="gallery" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" /> Galería de Evidencias ({evidenceToView.images.length})
                    </TabsTrigger>
                  )}
               </TabsList>
            </div>
            <div className="flex-1 overflow-hidden bg-slate-100/50">
               <TabsContent value="pdf" className="h-full m-0 p-0">
                  {evidenceToView?.pdfData ? (
                    <iframe src={evidenceToView.pdfData} className="w-full h-full border-none bg-white" title="PDF Viewer" />
                  ) : (
                    <div className="h-full flex items-center justify-center opacity-20">
                      <FileText className="h-20 w-20" />
                    </div>
                  )}
               </TabsContent>
               <TabsContent value="gallery" className="h-full m-0 overflow-hidden">
                  <ScrollArea className="h-full p-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {evidenceToView?.images?.map((img, idx) => (
                           <div key={`view-img-${idx}`} className="group relative aspect-video bg-white rounded-2xl overflow-hidden border-2 border-white shadow-lg transition-all hover:scale-[1.02] cursor-zoom-in">
                              <Image src={img} alt={`Evidencia ${idx + 1}`} fill className="object-cover" />
                              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="h-8 w-8 text-white" />
                              </div>
                           </div>
                        ))}
                     </div>
                  </ScrollArea>
               </TabsContent>
            </div>
          </Tabs>
          <DialogFooter className="p-4 bg-slate-50 border-t shrink-0">
            <Button variant="ghost" onClick={() => setEvidenceToView(null)} className="h-10 px-10 font-black uppercase text-[10px]">Cerrar Visor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
