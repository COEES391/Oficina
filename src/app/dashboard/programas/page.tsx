
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
      toast({ variant: "destructive", title: "Faltan datos", description: "CCT, Nombre y Municipio son obligatorios." }); return;
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
        title: "Error de Almacenamiento", 
        description: "La memoria del navegador está llena. Por favor reduzca el tamaño de las evidencias." 
      })
    }
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
    }).filter(r => r !== null) as ProgramStatus[];

    setRecords(updated);
    localStorage.setItem('programs_full_v24', JSON.stringify(updated));
    toast({ title: "Registro eliminado" });
  };

  const isCensoTab = useMemo(() => ['Cuentas Institucionales', 'ATRES', 'Conoce mi Escuela'].includes(activeTab), [activeTab]);
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
          <Button onClick={() => { 
            const f = {...initialFormState, name: activeTab};
            if (isCensoTab) {
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
          
          <div className="flex-1 overflow-hidden bg-white">
            <ScrollArea className="h-full">
              <div className="p-8 space-y-10">
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-primary/10 relative space-y-6 shadow-inner">
                  <Label className="text-[11px] font-black uppercase text-primary tracking-widest flex items-center gap-2 pl-2">
                      <Search className="h-5 w-5 text-accent" /> Identificación del Centro de Trabajo
                  </Label>
                  <div className="relative">
                      <Input placeholder="BUSCAR CCT O NOMBRE DEL PLANTEL..." className="h-16 rounded-2xl bg-white border-primary/10 font-black text-lg uppercase shadow-sm" value={dialogSearchTerm} onChange={(e) => setDialogSearchTerm(e.target.value)} />
                      {dialogSearchTerm.length > 2 && (
                        <div className="absolute top-18 left-0 right-0 bg-white border rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto divide-y">
                          {schoolSearchResults.map(s => (
                            <div key={`s-diag-${s.cct}-${s.turno}`} className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center transition-colors" onClick={() => { handleCctChange(s.cct); setDialogSearchTerm(''); }}>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-black uppercase text-slate-800">{s.nombre}</span>
                                <span className="text-[9px] font-mono text-slate-400">{s.municipio} • {s.valle}</span>
                              </div>
                              <Badge className="text-[9px] font-mono bg-primary">{s.cct}</Badge>
                            </div>
                          ))}
                          {schoolSearchResults.length === 0 && (
                            <div className="p-6 text-center">
                              <p className="text-[11px] font-black text-slate-400 uppercase mb-4">CCT No Registrado en la Base Maestra</p>
                              <Button onClick={() => { setQuickAddForm({...quickAddForm, cct: ''}); setIsQuickAddOpen(true); }} variant="outline" className="h-10 px-8 rounded-xl border-primary/20 text-primary font-black uppercase text-[10px] gap-2 hover:bg-primary/5 shadow-sm">
                                <Plus className="h-4 w-4" /> Alta Rápida de Plantel
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                  {formData.cct && (
                    <div className="flex items-center gap-6 p-6 bg-white rounded-[2rem] border-2 border-emerald-100 animate-in slide-in-from-top-4 shadow-sm">
                       <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                         <School className="h-9 w-9" />
                       </div>
                       <div>
                         <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] leading-none mb-2">Plantel Vinculado</p>
                         <h4 className="text-xl font-black uppercase text-slate-800 leading-tight">{formData.schoolName}</h4>
                         <p className="text-[11px] font-mono font-bold text-muted-foreground mt-1 bg-slate-50 px-3 py-1 rounded-full inline-block">
                           {formData.cct} • {formData.municipio} • {formData.valle}
                         </p>
                       </div>
                    </div>
                  )}
                </div>

                {isGeoposicionTab && (
                  <div className="space-y-4 animate-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-3 border-b-2 border-primary/10 pb-2">
                      <Navigation className="h-6 w-6 text-primary" />
                      <h3 className="text-sm font-black uppercase text-primary tracking-wider">Coordenadas Técnicas de Geoposición</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-primary pl-2 tracking-widest">Latitud Geográfica</Label>
                        <Input placeholder="EJ: 19.345678" className="h-14 bg-white border-none rounded-xl text-lg font-black shadow-sm px-6" value={formData.latitud || ''} onChange={e => setFormData({...formData, latitud: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-primary pl-2 tracking-widest">Longitud Geográfica</Label>
                        <Input placeholder="EJ: -99.456789" className="h-14 bg-white border-none rounded-xl text-lg font-black shadow-sm px-6" value={formData.longitud || ''} onChange={e => setFormData({...formData, longitud: e.target.value})} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b-2 border-primary/10 pb-2">
                    <div className="flex items-center gap-3">
                      <Users className="h-6 w-6 text-primary" />
                      <h3 className="text-sm font-black uppercase text-primary tracking-wider">Censo de Personal del Módulo</h3>
                    </div>
                    <Button onClick={handleAddAssistant} className="h-10 px-8 rounded-xl bg-primary text-white font-black uppercase text-[10px] shadow-lg hover:scale-105 transition-all">
                      <Plus className="h-4 w-4 mr-2" /> Vincular Servidor Público
                    </Button>
                  </div>
                  
                  <div className="border-2 border-slate-100 rounded-[2.5rem] bg-white overflow-hidden shadow-2xl min-h-[300px]">
                    <div className="w-full overflow-x-auto custom-scrollbar">
                        <Table className="border-collapse w-full">
                          <TableHeader className="bg-slate-50 sticky top-0 z-20 shadow-sm border-b">
                              <TableRow className="h-10">
                                <TableHead className="w-10 text-[9px] font-black uppercase text-center pl-4 text-slate-800">#</TableHead>
                                <TableHead className="w-[220px] text-[9px] font-black uppercase text-slate-800">Nombre Completo del Usuario</TableHead>
                                <TableHead className="w-[100px] text-[9px] font-black uppercase text-slate-800">CCT Adscripción</TableHead>
                                <TableHead className="w-[160px] text-[9px] font-black uppercase text-slate-800">Correo Electrónico</TableHead>
                                <TableHead className="w-[140px] text-[9px] font-black uppercase text-slate-800">Función</TableHead>
                                <TableHead className="w-[90px] text-[9px] font-black uppercase text-center text-slate-800">Valle</TableHead>
                                <TableHead className="w-[160px] text-[9px] font-black uppercase text-slate-800">Departamento / Oficina</TableHead>
                                <TableHead className="w-[110px] text-[9px] font-black uppercase text-slate-800">Estatus</TableHead>
                                <TableHead className="w-16 pr-6"></TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {(formData.asistentes || []).length > 0 ? (formData.asistentes || []).map((ast, idx) => (
                                <TableRow key={`ast-edit-${idx}`} className="hover:bg-slate-50 transition-colors group border-b border-slate-50 h-12">
                                    <TableCell className="text-center font-black text-[10px] text-slate-300 pl-4">{idx + 1}</TableCell>
                                    <TableCell className="p-1.5">
                                      <Input placeholder="APELLIDOS NOMBRE..." className="h-8 text-[9px] uppercase font-black border-primary/10 bg-primary/[0.02] shadow-inner px-2 rounded-lg" value={ast.nombreUsuario} onChange={e => handleUpdateAssistantField(idx, 'nombreUsuario', e.target.value.toUpperCase())} />
                                    </TableCell>
                                    <TableCell className="p-1.5">
                                      <Input placeholder="15DES0000X" className="h-8 text-[9px] font-mono font-black uppercase shadow-inner text-center rounded-lg" value={ast.cct} onChange={e => handleUpdateAssistantField(idx, 'cct', e.target.value.toUpperCase())} maxLength={10} />
                                    </TableCell>
                                    <TableCell className="p-1.5">
                                      <Input placeholder="usuario.ejemplo" className="h-8 text-[9px] font-bold border-accent/20 bg-accent/[0.02] shadow-inner px-2 rounded-lg" value={ast.correo} onChange={e => handleUpdateAssistantField(idx, 'correo', e.target.value.toLowerCase())} />
                                    </TableCell>
                                    <TableCell className="p-1.5">
                                      <Select value={ast.funcion} onValueChange={v => handleUpdateAssistantField(idx, 'funcion', v)}>
                                        <SelectTrigger className="h-8 text-[8px] font-black uppercase shadow-inner rounded-lg px-2"><SelectValue placeholder="FUNCIÓN..." /></SelectTrigger>
                                        <SelectContent className="rounded-xl">{FUNCIONES.map(f => <SelectItem key={`f-edit-${f}`} value={f} className="text-[9px] font-bold uppercase">{f}</SelectItem>)}</SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell className="p-1.5">
                                      <Select value={ast.valle} onValueChange={v => handleUpdateAssistantField(idx, 'valle', v)}>
                                        <SelectTrigger className="h-8 text-center text-[8px] font-black uppercase border-slate-200 shadow-inner rounded-lg px-2"><SelectValue placeholder="VALLE..." /></SelectTrigger>
                                        <SelectContent className="rounded-xl"><SelectItem value="TOLUCA" className="text-[9px] font-bold uppercase">TOLUCA</SelectItem><SelectItem value="MEXICO" className="text-[9px] font-bold uppercase">MÉXICO</SelectItem></SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell className="p-1.5">
                                      <Input placeholder="ÁREA ESPECÍFICA..." className="h-8 text-[9px] font-bold uppercase border-slate-200 shadow-inner px-2 rounded-lg" value={ast.departamento} onChange={e => handleUpdateAssistantField(idx, 'departamento', e.target.value.toUpperCase())} />
                                    </TableCell>
                                    <TableCell className="p-1.5">
                                      <Select value={ast.estatus || 'ACTIVA'} onValueChange={v => handleUpdateAssistantField(idx, 'estatus', v)}>
                                        <SelectTrigger className={cn("h-8 text-[8px] font-black uppercase border-2 shadow-inner rounded-lg px-2", ast.estatus === 'ACTIVA' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : ast.estatus === 'INACTIVA' ? 'border-slate-200 text-slate-500 bg-slate-50' : 'border-rose-200 text-rose-700 bg-rose-50')}><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-xl">{ESTATUS_OPCIONES.map(e => (<SelectItem key={`est-edit-${e}`} value={e} className={cn("text-[9px] font-black", e === 'ACTIVA' ? 'text-emerald-600' : e === 'INACTIVA' ? 'text-slate-500' : 'text-rose-600')}>{e}</SelectItem>))}</SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell className="p-1.5 pr-4 text-right">
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" onClick={() => handleRemoveAssistant(idx)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </TableCell>
                                </TableRow>
                              )) : (
                                <TableRow>
                                  <TableCell colSpan={9} className="py-24 text-center opacity-30">
                                    <div className="flex flex-col items-center gap-4">
                                      <Users className="h-10 w-10 text-slate-200" />
                                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sin personal vinculado</p>
                                      <Button onClick={handleAddAssistant} variant="outline" className="h-8 px-6 rounded-xl border-primary/20 text-primary font-black uppercase text-[9px]">Añadir Registro</Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                          </TableBody>
                        </Table>
                    </div>
                  </div>
                </div>

                {activeTab === 'Conoce mi Escuela' && (
                  <div className="space-y-6 pt-10 border-t-4 border-primary/5 animate-in slide-in-from-bottom-4 duration-700">
                      <div className="flex items-center gap-4 border-b-2 border-primary/10 pb-4">
                         <div className="h-14 w-14 rounded-2xl bg-accent text-white flex items-center justify-center shadow-xl relative overflow-hidden">
                           <ImageIcon className="h-8 w-8 relative z-10" />
                           <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                         </div>
                         <div>
                            <h3 className="text-lg font-black uppercase text-primary leading-none">Evidencia de Infraestructura</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Carga obligatoria de 3 capturas del plantel (Fachada, Aulas, Laboratorios)</p>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                         <div className="space-y-4">
                            <div className="p-12 rounded-[3rem] border-4 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-6 group hover:border-primary/40 transition-all relative shadow-inner overflow-hidden">
                                <div className="h-20 w-20 rounded-3xl bg-white shadow-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                                  <Upload className="h-10 w-10" />
                                </div>
                                <div className="text-center">
                                  <p className="text-sm font-black uppercase text-slate-700">Subir Fotografías del Plantel</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Límite de Captura: 3 fotos • Formato JPG/PNG</p>
                                  <Badge className="bg-rose-50 text-rose-600 border-rose-200 text-[9px] font-black uppercase mt-3">Máx 2.0 MB por archivo</Badge>
                                </div>
                                <Button 
                                  size="lg"
                                  disabled={(formData.evidencePhotos?.length || 0) >= 3}
                                  onClick={() => imageInputRef.current?.click()} 
                                  className="h-12 px-10 rounded-2xl text-[11px] font-black uppercase shadow-2xl active:scale-95 transition-all"
                                >
                                  {(formData.evidencePhotos?.length || 0) >= 3 ? 'Capacidad de Fotos Completa' : 'Seleccionar Imágenes'}
                                </Button>
                                <input type="file" accept=".jpg, .jpeg, .png" className="hidden" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} />
                            </div>
                         </div>
                         
                         <div className="grid grid-cols-3 gap-6 items-center">
                            {(formData.evidencePhotos || []).map((img, idx) => (
                              <div key={`photo-edit-${idx}`} className="relative aspect-square rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl group animate-in zoom-in-95 duration-500">
                                 <Image src={img} alt={`Captura ${idx + 1}`} fill className="object-cover" unoptimized />
                                 <button onClick={() => removeImage(idx)} className="absolute top-4 right-4 h-10 w-10 bg-rose-600 text-white rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl z-20 hover:scale-110">
                                   <X className="h-6 w-6" />
                                 </button>
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Vista {idx + 1}</p>
                                 </div>
                              </div>
                            ))}
                            {Array.from({ length: Math.max(0, 3 - (formData.evidencePhotos?.length || 0)) }).map((_, i) => (
                              <div key={`empty-edit-${i}`} className="aspect-square rounded-[2rem] border-2 border-dashed border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center text-slate-200 gap-3 grayscale opacity-50">
                                 <ImageIcon className="h-12 w-12" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">Espacio Libre</span>
                              </div>
                            ))}
                         </div>
                      </div>
                  </div>
                )}

                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 border-b-2 border-primary/10 pb-2">
                    <Info className="h-6 w-6 text-primary" />
                    <h3 className="text-sm font-black uppercase text-primary tracking-wider">Observaciones Técnicas y Bitácora</h3>
                  </div>
                  <Textarea className="min-h-[160px] rounded-[2rem] p-8 bg-slate-50 border-2 border-slate-200 text-xs font-semibold shadow-inner focus:bg-white focus:ring-8 focus:ring-primary/5 transition-all" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder="Detalle técnico relevante, acuerdos del módulo o incidencias identificadas durante el levantamiento..." />
                </div>
              </div>
            </ScrollArea>
          </div>
          
          <DialogFooter className="p-8 gap-4 border-t bg-slate-50 flex items-center justify-end shrink-0">
             <Button variant="ghost" onClick={() => { setIsDialogOpen(false); setEditingId(null); setFormData(initialFormState); }} className="h-14 px-10 text-[11px] font-black uppercase text-slate-400 rounded-2xl hover:bg-slate-100">Cerrar Ventana</Button>
             <Button onClick={handleSave} className="btn-institutional h-14 px-16 text-[11px] shadow-2xl flex items-center gap-3">
               <Save className="h-5 w-5" /> Guardar Cambios en Sistema
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Alta Rápida de CCT */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-[850px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-[#B38E5D] text-white shrink-0 relative">
            <div className="absolute top-0 right-0 p-8 opacity-10"><PlusCircle className="h-24 w-24" /></div>
            <DialogTitle className="uppercase font-black text-2xl flex items-center gap-4 relative z-10">Registro de Nuevo CCT</DialogTitle>
            <DialogDescription className="text-white/80 text-[10px] font-bold uppercase mt-2 tracking-widest relative z-10">Alta instantánea en la base maestra institucional.</DialogDescription>
          </DialogHeader>
          <div className="p-10 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary pl-2">Clave CCT (10 Dígitos)</Label>
                  <Input value={quickAddForm.cct} onChange={e => setQuickAddForm({...quickAddForm, cct: e.target.value.toUpperCase()})} maxLength={10} className="font-mono font-black border-slate-200 h-14 bg-slate-50 shadow-inner text-lg px-6 rounded-2xl" placeholder="15DES0000X" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary pl-2">Nombre Oficial del Plantel</Label>
                  <Input value={quickAddForm.nombre} onChange={e => setQuickAddForm({...quickAddForm, nombre: e.target.value.toUpperCase()})} className="font-black border-slate-200 h-14 bg-slate-50 shadow-inner px-6 rounded-2xl" placeholder="NOMBRE COMPLETO..." />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary pl-2">Municipio</Label>
                  <Input value={quickAddForm.municipio} onChange={e => setQuickAddForm({...quickAddForm, municipio: e.target.value.toUpperCase()})} className="font-bold border-slate-200 h-14 bg-slate-50 shadow-inner px-6 rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary pl-2">Valle de Adscripción</Label>
                  <Select value={quickAddForm.valle} onValueChange={v => setQuickAddForm({...quickAddForm, valle: v})}>
                    <SelectTrigger className="h-14 font-black bg-slate-50 border-none shadow-inner rounded-2xl px-6"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="MEXICO" className="font-bold">MÉXICO</SelectItem>
                      <SelectItem value="TOLUCA" className="font-bold">TOLUCA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary pl-2">Sector</Label><Input value={quickAddForm.sector} onChange={e => setQuickAddForm({...quickAddForm, sector: e.target.value})} className="h-12 bg-slate-50 border-none shadow-inner rounded-xl" /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary pl-2">ZE</Label><Input value={quickAddForm.zonaEscolar} onChange={e => setQuickAddForm({...quickAddForm, zonaEscolar: e.target.value})} className="h-12 bg-slate-50 border-none shadow-inner rounded-xl" /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary pl-2">Modalidad</Label><Input value={quickAddForm.modalidad} onChange={e => setQuickAddForm({...quickAddForm, modalidad: e.target.value.toUpperCase()})} className="h-12 bg-slate-50 border-none shadow-inner rounded-xl" /></div>
             </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4">
            <Button variant="ghost" onClick={() => setIsQuickAddOpen(false)} className="h-14 px-10 text-[11px] font-black uppercase text-slate-400">Cancelar</Button>
            <Button onClick={handleQuickAddCct} className="bg-primary text-white h-14 px-16 rounded-2xl text-[11px] font-black uppercase shadow-2xl">Registrar y Vincular</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visor de Evidencia Digital */}
      <Dialog open={!!evidenceToView} onOpenChange={(open) => !open && setEvidenceToView(null)}>
        <DialogContent className="sm:max-w-[1100px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[3rem] border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white shrink-0 flex flex-row justify-between items-center pr-12">
            <div className="space-y-1">
              <DialogTitle className="uppercase font-black text-white text-xl flex items-center gap-4">
                <Archive className="h-8 w-8 text-accent" /> {evidenceToView?.title}
              </DialogTitle>
              <DialogDescription className="text-white/60 font-bold text-[10px] uppercase tracking-widest mt-1">Expediente de Auditoría COEES 2026</DialogDescription>
            </div>
            <div className="flex gap-4">
               {evidenceToView?.pdfData && <Button onClick={() => printFile(evidenceToView.pdfData!)} className="bg-white text-primary hover:bg-slate-100 font-black text-[10px] uppercase h-10 px-8 rounded-xl gap-2 shadow-xl"><Printer className="h-4 w-4" /> Imprimir</Button>}
               <button onClick={() => setEvidenceToView(null)} className="h-10 w-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all"><X className="h-5 w-5" /></button>
            </div>
          </DialogHeader>
          <div className="flex-1 bg-slate-100/50 p-8 overflow-hidden">
             <ScrollArea className="h-full">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
                  {evidenceToView?.images?.map((img, idx) => (
                    <div key={`view-img-${idx}`} className="group relative aspect-video bg-white rounded-3xl overflow-hidden border-4 border-white shadow-2xl transition-all hover:scale-[1.03] cursor-zoom-in">
                       <Image src={img} alt={`Captura ${idx + 1}`} fill className="object-cover" unoptimized />
                       <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="h-10 w-10 text-white" />
                       </div>
                    </div>
                  ))}
               </div>
               {evidenceToView?.pdfData && (
                 <div className="w-full h-[600px] rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl mb-10">
                   <iframe src={evidenceToView.pdfData} className="w-full h-full border-none" title="PDF Viewer" />
                 </div>
               )}
             </ScrollArea>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t shrink-0 flex justify-end">
            <Button variant="outline" onClick={() => setEvidenceToView(null)} className="h-12 px-12 rounded-2xl font-black uppercase text-[11px] border-slate-200">Cerrar Visor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
