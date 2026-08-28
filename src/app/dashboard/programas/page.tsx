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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  programsData, 
  type ProgramStatus, 
  type BitacoraEntry
} from "@/lib/planning-data"
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
  Headset,
  CheckCircle2,
  Circle,
  Tag,
  Info,
  Users,
  Plus,
  FilePlus,
  FileBox,
  User,
  History,
  QrCode,
  Copy,
  X,
  AlertCircle,
  Navigation,
  Save,
  Clock,
  Layers,
  Monitor,
  Upload,
  ImageIcon,
  Eye,
  Printer,
  Download,
  Building2,
  ChevronRight,
  Archive,
  Link as LinkIcon,
  FileText,
  FileCheck,
  Zap,
  MousePointer2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { VisitSchedulerDialog } from '@/components/VisitSchedulerDialog'
import { HelpDeskDialog } from '@/components/HelpDeskDialog'
import { format } from 'date-fns'

const PROGRAM_RUBROS = [
  'Cuentas Institucionales',
  'Biblioteca Digital',
  'Geoposición',
  'Conoce mi Escuela',
  'ATRES'
];

const DOMINIOS = [
  'desysa.edu.mx',
  'edomex.gob.mx',
  'google.com'
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

const FILE_SIZE_LIMIT = 2 * 1024 * 1024;

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
              unoptimized
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
  const [bitacoraRecords, setBitacoraRecords] = useState<BitacoraEntry[]>([])
  const [activeTab, setActiveTab] = useState(PROGRAM_RUBROS[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false)
  const [isHelpDeskOpen, setIsHelpDeskOpen] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogSearchTerm, setDialogSearchTerm] = useState('')
  const [officeFilter, setOficinaFilter] = useState('all')
  const [pendingCount, setPendingRequestsCount] = useState(0)
  
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const reportRef = useRef<HTMLDivElement>(null)
  
  const [evidenceToView, setEvidenceToView] = useState<{ 
    pdfData?: string, 
    images?: string[], 
    title: string 
  } | null>(null)

  const [selectedReport, setSelectedReport] = useState<ProgramStatus | null>(null)

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
      fase1: false, fase2: false, fase3: false, fase4: false, 
      fase4_1: false, fase4_2: false,
      fase5: false, fase6: false, fase7: false,
      fase7_1: false, fase7_formsUrl: '',
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

    const storedBitacora = localStorage.getItem('atres_bitacora')
    if (storedBitacora) {
      setBitacoraRecords(JSON.parse(storedBitacora))
    }

    const rawQueue = localStorage.getItem('atres_support_queue')
    const queue = rawQueue ? JSON.parse(rawQueue) : []
    setPendingRequestsCount(queue.length)

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
      if (e.key === 'atres_support_queue' || e.key === 'programs_full_v24' || e.key === 'schools_master_full_v21' || e.key === 'atres_bitacora') {
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
      toast({ variant: "destructive", title: "Faltan datos" }); return;
    }
    const newSchool: SchoolInfo = { 
      ...quickAddForm, 
      cct: quickAddForm.cct.toUpperCase(), 
      nombre: quickAddForm.nombre.toUpperCase(), 
      municipio: quickAddForm.municipio.toUpperCase(),
      domicilio: (quickAddForm.domicilio || '').toUpperCase(),
      localidad: (quickAddForm.localidad || '').toUpperCase(),
      sector: (quickAddForm.sector || '').toUpperCase(),
      zonaEscolar: (quickAddForm.zonaEscolar || '').toUpperCase(),
      modalidad: (quickAddForm.modalidad || 'DES').toUpperCase(),
      valle: quickAddForm.valle.toUpperCase(),
      turno: quickAddForm.turno.toUpperCase()
    };
    const updated = [newSchool, ...allSchools];
    setAllSchools(updated);
    localStorage.setItem('schools_master_full_v21', JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: 'schools_master_full_v21' }));
    
    setFormData(prev => ({
      ...prev,
      cct: newSchool.cct,
      schoolName: newSchool.nombre,
      municipio: newSchool.municipio,
      valle: newSchool.valle,
      zonaEscolar: newSchool.zonaEscolar,
      sector: newSchool.sector,
      modalidad: newSchool.modalidad
    }));
    
    setIsQuickAddOpen(false);
    setDialogSearchTerm('');
    toast({ title: "CCT Sumado a la Base Maestra" });
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'image') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > FILE_SIZE_LIMIT) {
      toast({ variant: "destructive", title: "Archivo demasiado pesado" })
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
    
    if (activeTab === 'Biblioteca Digital' && formData.bibliotecaFases) {
      const f = formData.bibliotecaFases;
      const phases = [f.fase1, f.fase2, f.fase3, f.fase4, f.fase5, f.fase6, f.fase7];
      const count = phases.filter(v => v).length;
      recordToSave.progress = Math.round((count / 7) * 100);
      recordToSave.status = recordToSave.progress === 100 ? 'concluido' : 'activo';
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
      toast({ title: "Cambios guardados" })
    } catch (e) {
      toast({ variant: "destructive", title: "Falla de Memoria" })
    }
  }

  const handleUpdateAssistantField = (index: number, field: string, value: string) => {
    const updated = [...(formData.asistentes || [])];
    updated[index] = { ...updated[index], [field]: value };
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

  const isCensoTab = useMemo(() => ['Cuentas Institucionales', 'Conoce mi Escuela'].includes(activeTab), [activeTab]);
  const isAtresTab = useMemo(() => activeTab === 'ATRES', [activeTab]);
  const isGeoposicionTab = useMemo(() => activeTab === 'Geoposición', [activeTab]);
  const isBibliotecaTab = useMemo(() => activeTab === 'Biblioteca Digital', [activeTab]);

  const filteredRecords = useMemo(() => {
    let filtered = records.filter(r => r.name === activeTab);
    if (searchTerm) {
      const term = searchTerm.toUpperCase();
      filtered = filtered.filter(r => (r.cct || '').toUpperCase().includes(term) || (r.schoolName || '').toUpperCase().includes(term));
    }
    return [...filtered].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [records, activeTab, searchTerm]);

  const filteredBitacora = useMemo(() => {
    if (activeTab !== 'ATRES') return [];
    if (!searchTerm) return bitacoraRecords;
    const term = searchTerm.toUpperCase();
    return bitacoraRecords.filter(r => (r.cct || '').toUpperCase().includes(term) || (r.schoolName || '').toUpperCase().includes(term) || (r.folio || '').toUpperCase().includes(term));
  }, [bitacoraRecords, activeTab, searchTerm]);

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

  const schoolSearchResults = useMemo(() => {
    if (!dialogSearchTerm || dialogSearchTerm.length < 3) return [];
    const term = dialogSearchTerm.toUpperCase();
    return allSchools.filter(s => s.cct.includes(term) || s.nombre.includes(term)).slice(0, 5);
  }, [allSchools, dialogSearchTerm]);

  const printFile = (data: string) => {
    const win = window.open();
    if (!win) return;
    win.document.write(`<iframe src="${data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
  }

  const handlePrintReport = () => {
    window.print();
  }

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
          <Button onClick={() => { setFormData({...initialFormState, name: activeTab}); setEditingId(null); setIsDialogOpen(true); setSearchTerm(''); }} className="btn-institutional h-10 px-8 rounded-xl shadow-md text-[10px]"><PlusCircle className="h-4 w-4 mr-2" /> Nuevo Registro</Button>
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

      <Card className="executive-card p-0 shadow-2xl border-none overflow-hidden bg-white mt-4">
        <div className="overflow-x-auto w-full">
          <Table className="w-full">
            <TableHeader className="bg-slate-50 border-b">
               <TableRow className="h-12">
                  <TableHead className="w-10 text-[9px] font-black uppercase text-center pl-4">#</TableHead>
                  {isAtresTab ? (
                    <>
                      <TableHead className="w-10 text-[8px] font-black uppercase text-center">Status</TableHead>
                      <TableHead className="w-20 text-[8px] font-black uppercase text-center text-primary">Folio</TableHead>
                      <TableHead className="w-24 text-[8px] font-black uppercase">Fecha</TableHead>
                      <TableHead className="min-w-[150px] text-[8px] font-black uppercase">Plantel</TableHead>
                      <TableHead className="min-w-[180px] text-[8px] font-black uppercase">Resumen Operativo</TableHead>
                      <TableHead className="w-24 text-[8px] font-black uppercase text-center">Analista</TableHead>
                      <TableHead className="w-20 text-[8px] font-black uppercase text-center">Docs</TableHead>
                    </>
                  ) : isCensoTab ? (
                    <>
                      <TableHead className="text-[9px] font-black uppercase text-primary min-w-[180px]">Usuario</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-primary w-[110px]">CCT</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-primary min-w-[140px]">Correo / Dominio</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-primary w-[110px]">Función</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-primary w-[90px]">Valle</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-primary min-w-[130px]">Departamento</TableHead>
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
              {isAtresTab ? (
                filteredBitacora.length > 0 ? filteredBitacora.map((r, idx) => (
                  <TableRow key={`${r.id}-${idx}`} className="hover:bg-slate-50 transition-colors border-b border-slate-50 h-12 group">
                    <TableCell className="text-center font-black text-[10px] text-slate-300 pl-4">{idx + 1}</TableCell>
                    <TableCell className="text-center py-0.5"><TrafficLight status={r.status} /></TableCell>
                    <TableCell className="text-center py-0.5"><span className="font-mono font-black text-[9px] text-primary">{r.folio}</span></TableCell>
                    <TableCell className="py-0.5"><div className="flex items-center gap-1"><Clock className="h-2.5 w-2.5 text-accent opacity-50" /><span className="text-[8px] font-bold text-slate-500">{r.fecha}</span></div></TableCell>
                    <TableCell className="py-0.5"><div className="flex flex-col min-w-0"><span className="text-[9px] font-black text-slate-700 uppercase leading-none truncate max-w-[160px]">{r.schoolName}</span><div className="flex items-center gap-1 mt-0.5"><Badge variant="outline" className="bg-primary/5 text-primary text-[7px] font-black border-none h-3 px-1">{r.cct}</Badge></div></div></TableCell>
                    <TableCell className="py-0.5"><div className="text-[8px] font-semibold text-slate-600 leading-tight line-clamp-2 max-w-[200px]">{r.servicio}</div></TableCell>
                    <TableCell className="text-center py-0.5"><span className="text-[8px] font-black text-slate-700 uppercase truncate max-w-[80px]">{r.tecnico}</span></TableCell>
                    <TableCell className="py-0.5">
                       <div className="flex items-center justify-center gap-1">
                          {r.pdfData ? (
                             <Button size="icon" variant="ghost" className="h-6 w-6 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg" onClick={() => setEvidenceToView({ pdfData: r.pdfData, title: `Reporte Folio: ${r.folio}` })}>
                                <Eye className="h-3 w-3" />
                             </Button>
                          ) : <span className="text-[7px] font-black text-slate-300 uppercase italic">S/PDF</span>}
                       </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setFormData({...initialFormState, ...r} as any); setEditingId(r.id); setIsDialogOpen(true); }} className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg"><Pencil className="h-3.5 w-3.5" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={9} className="text-center py-24 opacity-30 text-xs font-black uppercase tracking-widest">Sin folios registrados</TableCell></TableRow>
              ) : displayRows.length > 0 ? displayRows.map((row, idx) => {
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
                    <TableCell><Badge variant="outline" className={cn("text-[8px] font-black uppercase py-0.5 px-2 rounded-full", (rec.status === 'activo' || rec.status === 'pendiente') ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-emerald-200 text-emerald-700 bg-emerald-50')}>{rec.status?.toUpperCase() || 'ACTIVO'}</Badge></TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        {isBibliotecaTab && (
                          <button onClick={() => { setSelectedReport(rec); setIsReportDialogOpen(true); }} className="h-7 w-7 flex items-center justify-center text-accent hover:bg-accent/5 rounded-lg" title="Informe Ejecutivo">
                            <FileBox className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={() => { setFormData({...rec}); setEditingId(rec.id); setIsDialogOpen(true); }} className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg">
                          <Pencil className="h-3.5 w-3.5" />
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

      {/* Informe Ejecutivo de Biblioteca Digital */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-[900px] h-[95vh] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white flex flex-col print:h-auto print:shadow-none">
           <DialogHeader className="p-8 bg-slate-50 border-b shrink-0 flex flex-row justify-between items-center pr-12 print:bg-white print:border-none">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white"><Layers className="h-6 w-6" /></div>
                  <DialogTitle className="uppercase font-black text-primary text-xl">Informe Ejecutivo de Implementación</DialogTitle>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Biblioteca Digital • Sistema Integral COEES 2026</p>
              </div>
              <Button onClick={handlePrintReport} variant="outline" className="h-10 px-6 rounded-xl border-primary/20 text-primary font-black uppercase text-[10px] gap-2 hover:bg-primary/5 shadow-sm print:hidden">
                <Printer className="h-4 w-4" /> Imprimir Informe
              </Button>
           </DialogHeader>

           <ScrollArea className="flex-1 print:overflow-visible">
              <div ref={reportRef} className="p-10 space-y-10 print:p-0">
                 <div className="space-y-4">
                    <div className="bg-primary/5 border-l-4 border-primary px-4 py-2 inline-block"><h3 className="text-xs font-black text-primary uppercase tracking-widest">I. Identificación Institucional</h3></div>
                    <div className="grid grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                       <div className="space-y-3">
                          <div><p className="text-[9px] font-black text-slate-400 uppercase">Nombre del Centro de Trabajo</p><h4 className="text-base font-black text-slate-800 uppercase">{selectedReport?.schoolName}</h4></div>
                          <div className="flex gap-4">
                             <div><p className="text-[9px] font-black text-slate-400 uppercase">CCT Oficial</p><p className="text-sm font-mono font-black text-primary">{selectedReport?.cct}</p></div>
                             <div><p className="text-[9px] font-black text-slate-400 uppercase">Municipio</p><p className="text-sm font-black text-slate-700 uppercase">{selectedReport?.municipio}</p></div>
                          </div>
                       </div>
                       <div className="space-y-3">
                          <div><p className="text-[9px] font-black text-slate-400 uppercase">Valle / Región</p><p className="text-sm font-black text-slate-700 uppercase">{selectedReport?.valle} • {selectedReport?.region}</p></div>
                          <div><p className="text-[9px] font-black text-slate-400 uppercase">Sector / Zona Escolar</p><p className="text-sm font-black text-slate-700 uppercase">{selectedReport?.sector} / {selectedReport?.zonaEscolar}</p></div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="bg-accent/5 border-l-4 border-accent px-4 py-2 inline-block"><h3 className="text-xs font-black text-accent uppercase tracking-widest">II. Estatus de Implementación</h3></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                       <div className="md:col-span-1 text-center space-y-3">
                          <div className="relative h-32 w-32 mx-auto">
                            <div className="absolute inset-0 rounded-full border-[10px] border-slate-100 shadow-inner" />
                            <div className="absolute inset-0 rounded-full border-[10px] border-primary transition-all duration-700" style={{ clipPath: `inset(0 ${100 - (selectedReport?.progress || 0)}% 0 0)` }} />
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                               <span className="text-3xl font-black text-primary leading-none">{selectedReport?.progress}%</span>
                               <span className="text-[8px] font-black uppercase text-slate-400">Avance</span>
                            </div>
                          </div>
                          <Badge className={cn("px-4 py-1 rounded-full text-[10px] font-black uppercase shadow-lg", selectedReport?.status === 'concluido' ? 'bg-emerald-500' : 'bg-amber-500')}>
                             {selectedReport?.status === 'concluido' ? 'PROYECTO CONCLUIDO' : 'EN PROCESO TÉCNICO'}
                          </Badge>
                       </div>
                       <div className="md:col-span-2">
                          <div className="grid grid-cols-2 gap-3">
                             {[
                               { f: selectedReport?.bibliotecaFases?.fase1, l: 'F1: Diagnóstico' },
                               { f: selectedReport?.bibliotecaFases?.fase2, l: 'F2: Conectividad' },
                               { f: selectedReport?.bibliotecaFases?.fase3, l: 'F3: Mobiliario' },
                               { f: selectedReport?.bibliotecaFases?.fase4, l: 'F4: Instalación' },
                               { f: selectedReport?.bibliotecaFases?.fase4_1, l: '4.1 32 bits' },
                               { f: selectedReport?.bibliotecaFases?.fase4_2, l: '4.2 64 bits' },
                               { f: selectedReport?.bibliotecaFases?.fase5, l: 'F5: Capacitación' },
                               { f: selectedReport?.bibliotecaFases?.fase6, l: 'F6: Puesta en Marcha' },
                               { f: selectedReport?.bibliotecaFases?.fase7, l: 'F7: Auditoría' },
                               { f: selectedReport?.bibliotecaFases?.fase7_1, l: '7.1 Cuestionario' }
                             ].map((item, i) => (
                               <div key={`rep-fase-${i}`} className={cn("flex items-center gap-3 p-3 rounded-2xl border transition-all", item.f ? "bg-white border-emerald-100 shadow-sm" : "bg-slate-50 border-slate-100 opacity-40")}>
                                  {item.f ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-slate-300" />}
                                  <span className="text-[9px] font-black uppercase text-slate-700">{item.l}</span>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="bg-[#4a90e2]/5 border-l-4 border-[#4a90e2] px-4 py-2 inline-block"><h3 className="text-xs font-black text-[#4a90e2] uppercase tracking-widest">III. Auditoría de Recursos</h3></div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl">
                          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><Monitor className="h-20 w-20" /></div>
                          <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase text-white/50 tracking-widest">Equipo de Computo</p>
                            <h4 className="text-5xl font-black mt-2 leading-none">{selectedReport?.bibliotecaFases?.equiposHabilitados || 0}</h4>
                            <div className="mt-6 flex items-center gap-2">
                               <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                               <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Habilitados en Red Local</p>
                            </div>
                          </div>
                          <div className="mt-8 flex gap-4">
                             <div className={cn("px-4 py-2 rounded-xl text-[9px] font-black uppercase", selectedReport?.bibliotecaFases?.fase4_1 ? "bg-accent text-white" : "bg-white/5 text-white/20")}>32 BITS {selectedReport?.bibliotecaFases?.fase4_1 && '✓'}</div>
                             <div className={cn("px-4 py-2 rounded-xl text-[9px] font-black uppercase", selectedReport?.bibliotecaFases?.fase4_2 ? "bg-accent text-white" : "bg-white/5 text-white/20")}>64 BITS {selectedReport?.bibliotecaFases?.fase4_2 && '✓'}</div>
                          </div>
                       </div>
                       
                       <div className="bg-white rounded-[2.5rem] p-8 border-2 border-primary/10 shadow-xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Users className="h-20 w-20 text-primary" /></div>
                          <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Capital Humano</p>
                            <h4 className="text-5xl font-black mt-2 leading-none text-primary">{selectedReport?.bibliotecaFases?.personalCapacitado || 0}</h4>
                            <div className="mt-6 space-y-4">
                               <div className="p-4 bg-primary/5 rounded-2xl border border-primary/5">
                                  <div className="flex justify-between items-center mb-1">
                                     <span className="text-[10px] font-black text-primary uppercase">Asistencia Registrada</span>
                                     <span className="text-[9px] font-bold text-slate-400">{selectedReport?.asistentes?.length || 0} de {selectedReport?.bibliotecaFases?.personalCapacitado || 0}</span>
                                  </div>
                                  <Progress value={selectedReport?.bibliotecaFases?.personalCapacitado ? ((selectedReport?.asistentes?.length || 0) / selectedReport.bibliotecaFases.personalCapacitado) * 100 : 0} className="h-1.5" />
                               </div>
                            </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 {(selectedReport?.bibliotecaFases?.fase7_formsUrl || selectedReport?.observaciones) && (
                   <div className="space-y-4">
                      <div className="bg-slate-200/40 border-l-4 border-slate-400 px-4 py-2 inline-block"><h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">IV. Observaciones y Enlaces de Control</h3></div>
                      <div className="space-y-4">
                         {selectedReport?.bibliotecaFases?.fase7_formsUrl && (
                           <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="flex items-center gap-4">
                                 <div className="h-10 w-10 bg-white rounded-xl shadow-md flex items-center justify-center text-primary"><LinkIcon className="h-5 w-5" /></div>
                                 <div><p className="text-[10px] font-black text-slate-800 uppercase">Cuestionario de Auditoría</p><p className="text-[9px] font-mono text-primary truncate max-w-[400px]">{selectedReport.bibliotecaFases.fase7_formsUrl}</p></div>
                              </div>
                              <Badge className="bg-emerald-500 text-white font-black text-[9px] uppercase px-4 h-8 rounded-xl shadow-lg">DOCUMENTADO</Badge>
                           </div>
                         )}
                         {selectedReport?.observaciones && (
                           <div className="p-6 bg-white rounded-[2rem] border-2 border-slate-50 italic text-[11px] font-semibold text-slate-600 leading-relaxed shadow-inner">
                              "{selectedReport.observaciones}"
                           </div>
                         )}
                      </div>
                   </div>
                 )}

                 <div className="pt-20 grid grid-cols-2 gap-20 print:pt-40">
                    <div className="text-center space-y-2">
                       <div className="h-px bg-slate-300 w-full mb-4" />
                       <p className="text-[10px] font-black uppercase text-slate-800">Analista Responsable</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Departamento de Tecnología Educativa</p>
                    </div>
                    <div className="text-center space-y-2">
                       <div className="h-px bg-slate-300 w-full mb-4" />
                       <p className="text-[10px] font-black uppercase text-slate-800">Dirección del Plantel</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sello y Firma Institucional</p>
                    </div>
                 </div>
              </div>
           </ScrollArea>

           <DialogFooter className="p-6 bg-slate-50 border-t print:hidden">
              <Button variant="ghost" onClick={() => setIsReportDialogOpen(false)} className="h-12 px-10 font-black uppercase text-slate-400 text-xs">Cerrar Informe</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      <HelpDeskDialog open={isHelpDeskOpen} onOpenChange={setIsHelpDeskOpen} />
      <VisitSchedulerDialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen} areaId="programas" areaName="Programas" />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[95vw] lg:max-w-[1400px] rounded-[3rem] h-[95vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white shrink-0 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Target className="h-40 w-40" /></div>
             <DialogTitle className="uppercase font-black text-white text-2xl flex items-center gap-4 relative z-10">
                <Target className="h-8 w-8 text-white/40" /> Gestión de {activeTab}
             </DialogTitle>
             <DialogDescription className="text-white/60 font-bold text-[10px] uppercase tracking-widest mt-1 relative z-10">
                Administración integral del módulo técnico institucional COEES 2026.
             </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="datos" className="flex-1 flex flex-col overflow-hidden bg-white">
            <div className="px-8 border-b bg-slate-50/50">
              <TabsList className="bg-transparent h-14 p-0 gap-8">
                <TabsTrigger value="datos" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all">1. Datos Técnicos</TabsTrigger>
                {(!isBibliotecaTab || (formData.bibliotecaFases?.personalCapacitado || 0) > 0) && (
                  <TabsTrigger value="censo" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all">2. Censo de Personal</TabsTrigger>
                )}
                {activeTab === 'Conoce mi Escuela' && (
                  <TabsTrigger value="evidencia" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all">3. Evidencia Fotográfica</TabsTrigger>
                )}
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
               <TabsContent value="datos" className="h-full m-0 p-0">
                  <ScrollArea className="h-full">
                    <div className="p-8 space-y-10">
                      <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-primary/10 relative space-y-6 shadow-inner">
                        <Label className="text-[11px] font-black uppercase text-primary tracking-widest flex items-center gap-2 pl-2">
                            <Search className="h-5 w-5 text-accent" /> Identificación del Plantel
                        </Label>
                        <div className="relative">
                            <Input placeholder="BUSCAR POR CCT O NOMBRE..." className="h-16 rounded-2xl bg-white border-primary/10 font-black text-lg uppercase shadow-sm" value={dialogSearchTerm} onChange={(e) => setDialogSearchTerm(e.target.value)} />
                            {dialogSearchTerm.length > 2 && (
                              <div className="absolute top-18 left-0 right-0 bg-white border rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto divide-y">
                                {schoolSearchResults.map(s => (
                                  <div key={`s-diag-${s.cct}-${s.turno}`} className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center" onClick={() => { handleCctChange(s.cct); setDialogSearchTerm(''); }}>
                                    <div className="flex flex-col"><span className="text-[11px] font-black uppercase">{s.nombre}</span><span className="text-[9px] font-mono text-slate-400">{s.cct}</span></div>
                                    <Badge className="text-[9px] font-mono bg-primary">{s.cct}</Badge>
                                  </div>
                                ))}
                                {schoolSearchResults.length === 0 && (
                                  <div className="p-6 text-center">
                                    <Button onClick={() => { setQuickAddForm({...quickAddForm, cct: ''}); setIsQuickAddOpen(true); }} variant="outline" className="h-10 px-8 rounded-xl border-primary/20 text-primary font-black uppercase text-[10px] gap-2 hover:bg-primary/5 shadow-sm"><Plus className="h-4 w-4" /> Alta Rápida de Plantel</Button>
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                        {formData.cct && (
                          <div className="flex items-center gap-6 p-6 bg-white rounded-[2rem] border-2 border-emerald-100 animate-in slide-in-from-top-4 shadow-sm">
                             <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner"><School className="h-9 w-9" /></div>
                             <div>
                               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">Plantel Vinculado</p>
                               <h4 className="text-xl font-black uppercase text-slate-800 leading-tight">{formData.schoolName}</h4>
                               <p className="text-[11px] font-mono font-bold text-muted-foreground mt-1 bg-slate-50 px-3 py-1 rounded-full inline-block">{formData.cct} • {formData.municipio}</p>
                             </div>
                          </div>
                        )}
                      </div>

                      {isGeoposicionTab && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
                           <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary pl-2">Latitud Geográfica</Label><Input placeholder="EJ: 19.345678" className="h-14 bg-white border-none rounded-xl text-lg font-black shadow-sm px-6" value={formData.latitud || ''} onChange={e => setFormData({...formData, latitud: e.target.value})} /></div>
                           <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary pl-2">Longitud Geográfica</Label><Input placeholder="EJ: -99.456789" className="h-14 bg-white border-none rounded-xl text-lg font-black shadow-sm px-6" value={formData.longitud || ''} onChange={e => setFormData({...formData, longitud: e.target.value})} /></div>
                        </div>
                      )}

                      {isBibliotecaTab && (
                        <div className="space-y-10 animate-in zoom-in-95 duration-500">
                          <div className="flex items-center gap-3 border-b-2 border-primary/10 pb-2"><Layers className="h-6 w-6 text-primary" /><h3 className="text-sm font-black uppercase text-primary tracking-wider">Seguimiento de Biblioteca Digital</h3></div>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <div className="lg:col-span-2 space-y-4">
                              <div className="bg-[#4a90e2] text-white px-4 py-1.5 rounded-lg inline-block text-[10px] font-black uppercase tracking-widest mb-2 shadow-md">
                                Fases de Implementación
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                                {[
                                  { id: 'fase1', label: 'Fase 1: Diagnóstico' },
                                  { id: 'fase2', label: 'Fase 2: Conectividad' },
                                  { id: 'fase3', label: 'Fase 3: Mobiliario' },
                                  { id: 'fase4', label: 'Fase 4: Instalación' },
                                  { id: 'fase4_1', label: '4.1 32 bits', indent: true },
                                  { id: 'fase4_2', label: '4.2 64 bits', indent: true },
                                  { id: 'fase5', label: 'Fase 5: Capacitación' },
                                  { id: 'fase6', label: 'Fase 6: Puesta en Marcha' },
                                  { id: 'fase7', label: 'Fase 7: Auditoría' },
                                  { id: 'fase7_1', label: '7.1 Cuestionario', indent: true },
                                ].map((fase) => (
                                  <div key={fase.id} className={cn(
                                    "flex items-center space-x-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm transition-all hover:border-primary/20",
                                    fase.indent && "ml-6 scale-95 border-l-4 border-l-accent"
                                  )}>
                                    <Checkbox 
                                      id={fase.id} 
                                      checked={formData.bibliotecaFases?.[fase.id as keyof typeof formData.bibliotecaFases] as boolean} 
                                      onCheckedChange={(checked) => setFormData({
                                        ...formData,
                                        bibliotecaFases: {
                                          ...formData.bibliotecaFases!,
                                          [fase.id]: checked === true
                                        }
                                      })}
                                    />
                                    <Label htmlFor={fase.id} className="text-[8px] font-black uppercase cursor-pointer leading-tight">{fase.label}</Label>
                                  </div>
                                ))}
                              </div>

                              {formData.bibliotecaFases?.fase7_1 && (
                                <div className="mt-4 p-5 bg-white rounded-[2rem] border-2 border-accent/20 shadow-xl animate-in slide-in-from-top-4">
                                   <Label className="text-[10px] font-black uppercase text-accent flex items-center gap-2 mb-3">
                                      <LinkIcon className="h-4 w-4" /> Enlace Cuestionario (Forms)
                                   </Label>
                                   <Input 
                                      placeholder="https://forms.gle/..." 
                                      className="h-12 bg-slate-50 border-none rounded-xl text-[11px] font-bold shadow-inner"
                                      value={formData.bibliotecaFases?.fase7_formsUrl || ''}
                                      onChange={e => setFormData({
                                        ...formData,
                                        bibliotecaFases: {
                                          ...formData.bibliotecaFases!,
                                          fase7_formsUrl: e.target.value
                                        }
                                      })}
                                   />
                                </div>
                              )}
                            </div>

                            <div className="space-y-6 pt-10">
                              <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-primary pl-2">Personal Capacitado</Label>
                                <div className="relative">
                                  <Users className="absolute left-4 top-4 h-5 w-5 text-slate-300" />
                                  <Input type="number" className="h-14 pl-12 bg-slate-50 border-none rounded-2xl text-lg font-black shadow-inner" value={formData.bibliotecaFases?.personalCapacitado || 0} onChange={e => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, personalCapacitado: parseInt(e.target.value) || 0}})} />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-primary pl-2">Equipos Habilitados</Label>
                                <div className="relative">
                                  <Monitor className="absolute left-4 top-4 h-5 w-5 text-slate-300" />
                                  <Input type="number" className="h-14 pl-12 bg-slate-50 border-none rounded-2xl text-lg font-black shadow-inner" value={formData.bibliotecaFases?.equiposHabilitados || 0} onChange={e => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, equiposHabilitados: parseInt(e.target.value) || 0}})} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-3 border-b-2 border-primary/10 pb-2"><Info className="h-6 w-6 text-primary" /><h3 className="text-sm font-black uppercase text-primary tracking-wider">Observaciones Generales</h3></div>
                        <Textarea className="min-h-[160px] rounded-[2rem] p-8 bg-slate-50 border-2 border-slate-200 text-xs font-semibold shadow-inner focus:bg-white transition-all" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder="Detalle técnico relevante o incidencias..." />
                      </div>
                    </div>
                  </ScrollArea>
               </TabsContent>

               <TabsContent value="censo" className="h-full m-0 p-8 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3"><Users className="h-7 w-7 text-primary" /><h3 className="text-lg font-black uppercase text-primary">Censo de Personal Vinculado</h3></div>
                    <Button onClick={handleAddAssistant} className="h-10 px-8 rounded-xl bg-primary text-white font-black uppercase text-[10px] shadow-lg"><Plus className="h-4 w-4 mr-2" /> Añadir Servidor Público</Button>
                  </div>
                  
                  <div className="flex-1 overflow-hidden border-2 border-slate-100 rounded-[2.5rem] bg-white shadow-2xl">
                    <ScrollArea className="h-full">
                        <Table className="border-collapse w-full min-w-[1150px]">
                          <TableHeader className="bg-slate-50 sticky top-0 z-20 shadow-sm border-b">
                              <TableRow className="h-10">
                                <TableHead className="w-10 text-[9px] font-black uppercase text-center pl-4">#</TableHead>
                                <TableHead className="w-[220px] text-[9px] font-black uppercase">Usuario</TableHead>
                                <TableHead className="w-[100px] text-[9px] font-black uppercase text-center">CCT</TableHead>
                                <TableHead className="w-[160px] text-[9px] font-black uppercase">Email / Dominio</TableHead>
                                <TableHead className="w-[140px] text-[9px] font-black uppercase">Función</TableHead>
                                <TableHead className="w-[90px] text-[9px] font-black uppercase text-center">Valle</TableHead>
                                <TableHead className="w-[160px] text-[9px] font-black uppercase">Departamento</TableHead>
                                <TableHead className="w-[110px] text-[9px] font-black uppercase">Estatus</TableHead>
                                <TableHead className="w-16 pr-6"></TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {(formData.asistentes || []).length > 0 ? (formData.asistentes || []).map((ast, idx) => (
                                <TableRow key={`ast-edit-${idx}`} className="hover:bg-slate-50 transition-colors border-b border-slate-50 h-12">
                                    <TableCell className="text-center font-black text-[10px] text-slate-300 pl-4">{idx + 1}</TableCell>
                                    <TableCell className="p-1.5"><Input className="h-8 text-[9px] uppercase font-black" value={ast.nombreUsuario} onChange={e => handleUpdateAssistantField(idx, 'nombreUsuario', e.target.value.toUpperCase())} /></TableCell>
                                    <TableCell className="p-1.5"><Input className="h-8 text-[9px] font-mono text-center" value={ast.cct} onChange={e => handleUpdateAssistantField(idx, 'cct', e.target.value.toUpperCase())} maxLength={10} /></TableCell>
                                    <TableCell className="p-1.5"><Input className="h-8 text-[9px] font-bold" value={ast.correo} onChange={e => handleUpdateAssistantField(idx, 'correo', e.target.value.toLowerCase())} /></TableCell>
                                    <TableCell className="p-1.5">
                                      <Select value={ast.funcion} onValueChange={v => handleUpdateAssistantField(idx, 'funcion', v)}>
                                        <SelectTrigger className="h-8 text-[8px] font-black uppercase"><SelectValue placeholder="FUNC..." /></SelectTrigger>
                                        <SelectContent className="rounded-xl">{FUNCIONES.map(f => <SelectItem key={f} value={f} className="text-[9px] font-bold uppercase">{f}</SelectItem>)}</SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell className="p-1.5"><Select value={ast.valle} onValueChange={v => handleUpdateAssistantField(idx, 'valle', v)}><SelectTrigger className="h-8 text-center text-[8px] font-black uppercase"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="TOLUCA" className="text-[9px] font-bold uppercase">TOLUCA</SelectItem><SelectItem value="MEXICO" className="text-[9px] font-bold uppercase">MÉXICO</SelectItem></SelectContent></Select></TableCell>
                                    <TableCell className="p-1.5"><Input className="h-8 text-[9px] font-bold uppercase" value={ast.departamento} onChange={e => handleUpdateAssistantField(idx, 'departamento', e.target.value.toUpperCase())} /></TableCell>
                                    <TableCell className="p-1.5">
                                      <Select value={ast.estatus || 'ACTIVA'} onValueChange={v => handleUpdateAssistantField(idx, 'estatus', v)}>
                                        <SelectTrigger className={cn("h-8 text-[8px] font-black uppercase border-2", ast.estatus === 'ACTIVA' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-rose-200 text-rose-700 bg-rose-50')}><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-xl">{ESTATUS_OPCIONES.map(e => (<SelectItem key={e} value={e} className="text-[9px] font-black">{e}</SelectItem>))}</SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell className="p-1.5 text-right pr-6"><Button variant="ghost" size="icon" className="h-7 w-7 text-rose-300 hover:text-rose-600" onClick={() => handleRemoveAssistant(idx)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                                </TableRow>
                              )) : (<TableRow><TableCell colSpan={9} className="py-24 text-center opacity-30 text-xs font-black uppercase">Sin personal vinculado</TableCell></TableRow>)}
                          </TableBody>
                        </Table>
                    </ScrollArea>
                  </div>
               </TabsContent>

               <TabsContent value="evidencia" className="h-full m-0 p-8">
                  <div className="space-y-8">
                      <div className="flex items-center gap-4 border-b-2 border-primary/10 pb-4"><ImageIcon className="h-8 w-8 text-accent" /><div><h3 className="text-lg font-black uppercase text-primary leading-none">Capturas de Infraestructura</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Carga de 3 fotos obligatorias del plantel</p></div></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         <div className="p-12 rounded-[3rem] border-4 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-6 group hover:border-primary/40 transition-all relative">
                            <Upload className="h-10 w-10 text-slate-300 group-hover:scale-110 transition-transform" />
                            <div className="text-center"><p className="text-sm font-black uppercase text-slate-700">Subir Fotografías</p><Badge className="bg-rose-50 text-rose-600 border-rose-200 text-[9px] font-black uppercase mt-2">Máximo 3 fotos • 2.0 MB c/u</Badge></div>
                            <Button disabled={(formData.evidencePhotos?.length || 0) >= 3} onClick={() => imageInputRef.current?.click()} className="h-12 px-10 rounded-2xl text-[11px] font-black uppercase">Seleccionar Imágenes</Button>
                            <input type="file" accept=".jpg, .jpeg, .png" className="hidden" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} />
                         </div>
                         <div className="grid grid-cols-3 gap-6 items-center">
                            {(formData.evidencePhotos || []).map((img, idx) => (
                              <div key={idx} className="relative aspect-square rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl group animate-in zoom-in-95">
                                 <Image src={img} alt={`Captura ${idx + 1}`} fill className="object-cover" unoptimized />
                                 <button onClick={() => removeImage(idx)} className="absolute top-2 right-2 h-8 w-8 bg-rose-600 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20"><X className="h-4 w-4" /></button>
                              </div>
                            ))}
                            {Array.from({ length: Math.max(0, 3 - (formData.evidencePhotos?.length || 0)) }).map((_, i) => (<div key={i} className="aspect-square rounded-[2rem] border-2 border-dashed border-slate-100 bg-slate-50/50 flex items-center justify-center text-slate-200"><ImageIcon className="h-8 w-8 opacity-20" /></div>))}
                         </div>
                      </div>
                  </div>
               </TabsContent>
            </div>
          </Tabs>
          
          <DialogFooter className="p-8 gap-4 border-t bg-slate-50 flex items-center justify-end shrink-0">
             <Button variant="ghost" onClick={() => { setIsDialogOpen(false); setEditingId(null); setFormData(initialFormState); }} className="h-14 px-10 text-[11px] font-black uppercase text-slate-400">Cerrar</Button>
             <Button onClick={handleSave} className="btn-institutional h-14 px-16 text-[11px] shadow-2xl flex items-center gap-3"><Save className="h-5 w-5" /> Guardar Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-[850px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
          <DialogHeader className="p-8 bg-[#B38E5D] text-white shrink-0 relative">
            <div className="absolute top-0 right-0 p-8 opacity-10"><PlusCircle className="h-24 w-24" /></div>
            <DialogTitle className="uppercase font-black text-2xl flex items-center gap-4 relative z-10">Registro Institucional de CCT</DialogTitle>
            <DialogDescription className="text-white/60 font-bold text-[10px] uppercase tracking-widest mt-2 tracking-widest relative z-10">Alta inmediata en la base maestra del sistema.</DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1">
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary pl-2">CCT (10 Dígitos)</Label>
                  <Input value={quickAddForm.cct} onChange={e => setQuickAddForm({...quickAddForm, cct: e.target.value.toUpperCase()})} maxLength={10} className="font-mono font-black border-slate-200 h-12 bg-slate-50 shadow-inner px-6 rounded-xl" placeholder="15DES0000X" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary pl-2">Nombre del Plantel</Label>
                  <Input value={quickAddForm.nombre} onChange={e => setQuickAddForm({...quickAddForm, nombre: e.target.value.toUpperCase()})} className="font-black border-slate-200 h-12 bg-slate-50 shadow-inner px-6 rounded-xl" placeholder="NOMBRE OFICIAL..." />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary pl-2">Domicilio (Calle y Número)</Label>
                  <Input value={quickAddForm.domicilio} onChange={e => setQuickAddForm({...quickAddForm, domicilio: e.target.value})} className="font-bold border-slate-200 h-12 bg-slate-50 shadow-inner px-6 rounded-xl" placeholder="CALLE, NÚMERO, COLONIA..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary pl-2">Teléfono</Label>
                  <Input value={quickAddForm.telefono} onChange={e => setQuickAddForm({...quickAddForm, telefono: e.target.value})} className="font-mono font-black border-slate-200 h-12 bg-slate-50 shadow-inner px-6 rounded-xl" placeholder="10 DÍGITOS..." />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary pl-2">Localidad</Label>
                  <Input value={quickAddForm.localidad} onChange={e => setQuickAddForm({...quickAddForm, localidad: e.target.value})} className="font-bold border-slate-200 h-12 bg-slate-50 shadow-inner px-6 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary pl-2">Municipio</Label>
                  <Input value={quickAddForm.municipio} onChange={e => setQuickAddForm({...quickAddForm, municipio: e.target.value.toUpperCase()})} className="font-bold border-slate-200 h-12 bg-slate-50 shadow-inner px-6 rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary pl-2">Sector</Label>
                  <Input value={quickAddForm.sector} onChange={e => setQuickAddForm({...quickAddForm, sector: e.target.value})} className="h-12 bg-slate-50 border-none shadow-inner rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary pl-2">Zona Escolar</Label>
                  <Input value={quickAddForm.zonaEscolar} onChange={e => setQuickAddForm({...quickAddForm, zonaEscolar: e.target.value})} className="h-12 bg-slate-50 border-none shadow-inner rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary pl-2">Modalidad</Label>
                  <Select value={quickAddForm.modalidad} onValueChange={v => setQuickAddForm({...quickAddForm, modalidad: v})}>
                    <SelectTrigger className="h-12 bg-slate-50 border-none shadow-inner rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DES" className="text-[10px] font-bold">DES (GENERAL)</SelectItem>
                      <SelectItem value="DST" className="text-[10px] font-bold">DST (TÉCNICA)</SelectItem>
                      <SelectItem value="DTV" className="text-[10px] font-bold">DTV (TELESECUNDARIA)</SelectItem>
                      <SelectItem value="ADG" className="text-[10px] font-bold">ADG (DEPARTAMENTO)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary pl-2">Turno</Label>
                  <Select value={quickAddForm.turno} onValueChange={v => setQuickAddForm({...quickAddForm, turno: v})}>
                    <SelectTrigger className="h-12 bg-slate-50 border-none shadow-inner rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MATUTINO" className="text-[10px] font-bold">MATUTINO</SelectItem>
                      <SelectItem value="VESPERTINO" className="text-[10px] font-bold">VESPERTINO</SelectItem>
                      <SelectItem value="MIXTO" className="text-[10px] font-bold">MIXTO</SelectItem>
                      <SelectItem value="DISCONTINUO" className="text-[10px] font-bold">DISCONTINUO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary pl-2">Valle</Label>
                  <Select value={quickAddForm.valle} onValueChange={v => setQuickAddForm({...quickAddForm, valle: v})}>
                    <SelectTrigger className="h-12 bg-slate-50 border-none shadow-inner rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEXICO" className="text-[10px] font-bold">MÉXICO</SelectItem>
                      <SelectItem value="TOLUCA" className="text-[10px] font-bold">TOLUCA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4 shrink-0 mt-auto">
            <Button variant="ghost" onClick={() => setIsQuickAddOpen(false)} className="h-14 px-10 text-[11px] font-black uppercase text-slate-400">Cancelar</Button>
            <Button onClick={handleQuickAddCct} className="bg-[#9f2241] text-white h-14 px-16 rounded-2xl text-[11px] font-black uppercase shadow-2xl">Registrar y Seleccionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!evidenceToView} onOpenChange={(open) => !open && setEvidenceToView(null)}>
        <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white shrink-0 flex flex-row justify-between items-center pr-12">
            <div className="space-y-1">
              <DialogTitle className="uppercase font-black text-white text-xl flex items-center gap-4">
                <FileText className="h-6 w-6 text-accent" /> VISOR COEES
              </DialogTitle>
              <DialogDescription className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Documento Digital</DialogDescription>
            </div>
            <div className="flex gap-4">
               {evidenceToView?.pdfData && (
                 <Button onClick={() => evidenceToView?.pdfData && printFile(evidenceToView.pdfData)} className="bg-white text-primary hover:bg-slate-100 font-black text-[10px] uppercase h-10 px-8 rounded-xl gap-2 shadow-xl">
                    <Printer className="h-4 w-4" /> Imprimir
                 </Button>
               )}
               <button onClick={() => setEvidenceToView(null)} className="text-white hover:bg-white/10 h-10 w-10 p-0 rounded-full border border-white/20 flex items-center justify-center"><X className="h-5 w-5" /></button>
            </div>
          </DialogHeader>
          <div className="flex-1 bg-slate-800 p-1">
             <iframe src={evidenceToView?.pdfData || ''} className="w-full h-full border-none rounded-xl bg-white" title="PDF Preview" />
          </div>
          <DialogFooter className="p-4 bg-slate-50 border-t shrink-0">
             <Button variant="ghost" onClick={() => setEvidenceToView(null)} className="h-11 px-10 font-black uppercase text-xs">Cerrar Visor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
