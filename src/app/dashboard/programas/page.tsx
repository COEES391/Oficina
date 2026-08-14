
'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
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
import { schoolsDirectory } from "@/lib/schools-directory"
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
  ClipboardCheck
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

  const initialFormState: ProgramStatus = {
    id: '', name: '', progress: 0, status: 'activo', date: new Date().toISOString().split('T')[0], cct: '', schoolName: '', 
    zonaEscolar: '', sector: '', modalidad: '', municipio: '', region: '', valle: '',
    numeroEquipos: 0, observaciones: '', capacitacion: 'N', asistentes: [], email: '',
    oficinaRegionalAtencion: '',
    bibliotecaFases: {
      fase1: false, fase2: false, fase3: false, fase4: false, fase5: false, fase6: false, fase7: false,
      personalCapacitado: 0, equiposHabilitados: 0
    },
    mantenimientoDetalle: {
      equipoTecnologico: '',
      equipoTecnologicoOtro: '',
      equipos: Array(10).fill({ equipo: '', marca: '', serie: '', censal: '' }),
      fallaIdentificada: '',
      servicioRealizado: ''
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
  }, [])

  useEffect(() => {
    setMounted(true)
    syncData()
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'atres_support_queue' || e.key === 'programs_full_v24') {
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
      const match = schoolsDirectory.find(s => s.cct.toUpperCase() === cleanValue)
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
      const school = schoolsDirectory.find(s => s.cct.toUpperCase() === value.toUpperCase());
      if (school) updated[index].valle = school.valle;
    }
    
    setFormData({ ...formData, asistentes: updated });
  }

  const handleSave = () => {
    const recordToSave = { ...formData };
    if (!recordToSave.cct && recordToSave.asistentes && recordToSave.asistentes.length > 0) {
      const first = recordToSave.asistentes[0];
      recordToSave.cct = first.cct;
      const school = schoolsDirectory.find(s => s.cct === first.cct);
      if (school) {
        recordToSave.schoolName = school.nombre;
        recordToSave.municipio = school.municipio;
        recordToSave.valle = school.valle;
      }
    }

    const updated = editingId 
      ? records.map(r => r.id === editingId ? recordToSave : r) 
      : [{...recordToSave, id: recordToSave.id || `SOL-${Date.now()}`}, ...records];
    
    setRecords(updated)
    localStorage.setItem('programs_full_v24', JSON.stringify(updated))
    setIsDialogOpen(false)
    setEditingId(null)
    setFormData(initialFormState)
    toast({ title: "Cambios guardados correctamente" })
  }

  const handleDeleteRow = (recordId: string, assistantIndex?: number) => {
    const updated = records.map(r => {
      if (r.id === recordId) {
        if (assistantIndex !== undefined && r.asistentes) {
          const newAsistentes = r.asistentes.filter((_, idx) => idx !== assistantIndex);
          return { ...r, asistentes: newAsistentes };
        }
        return null; // Registro completo marcado para eliminación
      }
      return r;
    }).filter(r => {
      if (r === null) return false;
      // Si eliminamos todos los usuarios de un registro de censo, eliminamos el registro
      if (['Cuentas Institucionales', 'ATRES'].includes(r.name) && r.asistentes && r.asistentes.length === 0) return false;
      return true;
    }) as ProgramStatus[];

    setRecords(updated);
    localStorage.setItem('programs_full_v24', JSON.stringify(updated));
    toast({ title: "Registro eliminado con éxito" });
  };

  const isCensoTab = useMemo(() => ['Cuentas Institucionales', 'ATRES'].includes(activeTab), [activeTab]);
  const isBibliotecaTab = useMemo(() => activeTab === 'Biblioteca Digital', [activeTab]);

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
      toast({ variant: "destructive", title: "Sin datos", description: "No hay registros para exportar." })
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
        'Personal': r.bibliotecaFases?.personalCapacitado, 'Fecha': r.date
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
    toast({ title: "Exportación Exitosa" });
  };

  if (!mounted) return null

  return (
    <div className="space-y-4 animate-in fade-in duration-700 w-full max-w-[1450px] mx-auto overflow-hidden px-2">
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
            if (isCensoTab) f.asistentes = [{ nombreUsuario: '', cct: '', correo: '', funcion: '', dominio: DOMINIOS[0], valle: '', departamento: '', estatus: 'ACTIVA' }];
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
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
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
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900 }} />
                          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px', fontWeight: '900' }} />
                          <Bar dataKey="progreso" radius={[4, 4, 0, 0]} barSize={25}>
                             {dashboardData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.progreso === 100 ? '#621132' : '#B38E5D'} />
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
        <DialogContent className="sm:max-w-[1000px] rounded-[2rem] h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white shrink-0">
             <DialogTitle className="uppercase font-black text-white text-xl flex items-center gap-4">
                <Target className="h-7 w-7 text-white/40" /> Gestión de {activeTab}
             </DialogTitle>
             <DialogDescription className="text-white/60 font-bold text-[10px] uppercase tracking-widest mt-1">
                {isBibliotecaTab ? "Seguimiento técnico de instalación por fases." : "Captura de censo de personal institucional."}
             </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden bg-white">
            <ScrollArea className="h-full">
              <div className="p-8 space-y-6">
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-primary/10 relative space-y-4">
                   <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                      <Search className="h-4 w-4 text-accent" /> Identificación del Centro de Trabajo
                   </Label>
                   <div className="relative">
                      <Input placeholder="BUSCAR CCT O NOMBRE..." className="h-12 rounded-xl bg-white border-primary/5 font-bold uppercase shadow-sm" value={dialogSearchTerm} onChange={(e) => setDialogSearchTerm(e.target.value)} />
                      {dialogSearchTerm.length > 2 && (
                        <div className="absolute top-13 left-0 right-0 bg-white border rounded-xl shadow-2xl z-50 max-h-40 overflow-y-auto divide-y">
                          {schoolsDirectory.filter(s => s.cct.includes(dialogSearchTerm.toUpperCase()) || s.nombre.includes(dialogSearchTerm.toUpperCase())).slice(0, 5).map(s => (
                            <div key={`s-diag-${s.cct}-${s.turno}`} className="p-3 hover:bg-primary/5 cursor-pointer flex justify-between items-center" onClick={() => { handleCctChange(s.cct); setDialogSearchTerm(''); }}>
                              <span className="text-[10px] font-black uppercase">{s.nombre}</span>
                              <Badge className="text-[8px] font-mono">{s.cct}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                   {formData.cct && (
                     <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-emerald-100 animate-in zoom-in-95"><School className="h-8 w-8 text-emerald-600" /><div><h4 className="text-xs font-black uppercase text-slate-800">{formData.schoolName}</h4><p className="text-[9px] font-bold text-slate-400">{formData.cct} • {formData.municipio} • {formData.valle}</p></div></div>
                   )}
                </div>

                {isBibliotecaTab ? (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="space-y-4">
                       <div className="flex items-center gap-3 border-b-2 border-primary/10 pb-2"><CheckSquare className="h-5 w-5 text-primary" /><h3 className="text-sm font-black uppercase text-primary">Fases de Instalación y Seguimiento</h3></div>
                       <div className="grid grid-cols-1 gap-3 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                          {BIBLIOTECA_FASES.map((fase) => (
                            <div key={fase.id} className="flex items-center space-x-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm group hover:border-primary/20 transition-all"><Checkbox id={fase.id} checked={(formData.bibliotecaFases as any)?.[fase.id]} onCheckedChange={(checked) => handleUpdateFase(fase.id as any, !!checked)} className="h-6 w-6 border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-600" /><Label htmlFor={fase.id} className="text-[11px] font-black uppercase text-slate-600 cursor-pointer group-hover:text-primary transition-colors flex-1">{fase.label}</Label></div>
                          ))}
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary pl-1">Fecha de Atención</Label><Input type="date" className="h-12 rounded-xl bg-slate-50 border-none font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                       <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary pl-1">Personal Capacitado</Label><Input type="number" className="h-12 rounded-xl bg-slate-50 border-none font-black text-center text-lg" value={formData.bibliotecaFases?.personalCapacitado} onChange={e => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, personalCapacitado: parseInt(e.target.value) || 0}})} /></div>
                       <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary pl-1">Equipos Habilitados</Label><Input type="number" className="h-12 rounded-xl bg-slate-50 border-none font-black text-center text-lg" value={formData.bibliotecaFases?.equiposHabilitados} onChange={e => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, equiposHabilitados: parseInt(e.target.value) || 0}})} /></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b-2 border-primary/10 pb-2"><div className="flex items-center gap-3"><Users className="h-5 w-5 text-primary" /><h3 className="text-sm font-black uppercase text-primary">Censo de Personal del Módulo</h3></div></div>
                    <div className="border-2 border-slate-100 rounded-[1.5rem] bg-white overflow-hidden shadow-inner min-h-[150px]">
                      <ScrollArea className="h-full">
                        <Table>
                          <TableHeader className="bg-slate-50 sticky top-0 z-20 shadow-sm">
                              <TableRow>
                                <TableHead className="w-12 text-[9px] font-black uppercase text-center">#</TableHead>
                                <TableHead className="min-w-[180px] text-[9px] font-black uppercase">Nombre del Usuario</TableHead>
                                <TableHead className="min-w-[120px] text-[9px] font-black uppercase">CCT</TableHead>
                                <TableHead className="min-w-[140px] text-[9px] font-black uppercase">Correo</TableHead>
                                <TableHead className="min-w-[140px] text-[9px] font-black uppercase">Función</TableHead>
                                <TableHead className="min-w-[150px] text-[9px] font-black uppercase">Dominio</TableHead>
                                <TableHead className="min-w-[120px] text-[9px] font-black uppercase text-center">Valle</TableHead>
                                <TableHead className="min-w-[140px] text-[9px] font-black uppercase">Departamento</TableHead>
                                <TableHead className="min-w-[140px] text-[9px] font-black uppercase">Estatus</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {(formData.asistentes || []).map((ast, idx) => (
                                <TableRow key={`ast-${idx}`} className="hover:bg-slate-50/50 group border-b border-slate-50">
                                    <TableCell className="text-center font-black text-[10px] text-muted-foreground">{idx + 1}</TableCell>
                                    <TableCell className="p-2"><Input placeholder="APELLIDOS NOMBRE..." className="h-9 text-[10px] uppercase font-bold border-primary/5 bg-primary/[0.02]" value={ast.nombreUsuario} onChange={e => handleUpdateAssistantField(idx, 'nombreUsuario', e.target.value.toUpperCase())} /></TableCell>
                                    <TableCell className="p-2"><Input placeholder="15DES0000X" className="h-9 text-[10px] font-mono font-black uppercase" value={ast.cct} onChange={e => handleUpdateAssistantField(idx, 'cct', e.target.value.toUpperCase())} maxLength={10} /></TableCell>
                                    <TableCell className="p-2"><Input placeholder="usuario.ejemplo" className="h-9 text-[10px] font-semibold border-accent/20 bg-accent/[0.02] pl-2" value={ast.correo} onChange={e => handleUpdateAssistantField(idx, 'correo', e.target.value.toLowerCase())} /></TableCell>
                                    <TableCell className="p-2"><Select value={ast.funcion} onValueChange={v => handleUpdateAssistantField(idx, 'funcion', v)}><SelectTrigger className="h-9 text-[10px] font-bold uppercase"><SelectValue placeholder="FUNCIÓN..." /></SelectTrigger><SelectContent className="rounded-xl">{FUNCIONES.map(f => <SelectItem key={`f-${f}`} value={f} className="text-[10px] font-bold uppercase">{f}</SelectItem>)}</SelectContent></Select></TableCell>
                                    <TableCell className="p-2"><Select value={ast.dominio} onValueChange={v => handleUpdateAssistantField(idx, 'dominio', v)}><SelectTrigger className="h-9 text-[10px] font-black uppercase border-slate-200"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl">{DOMINIOS.map(d => <SelectItem key={`dom-${d}`} value={d} className="text-[10px] font-bold">@{d}</SelectItem>)}</SelectContent></Select></TableCell>
                                    <TableCell className="p-2"><Select value={ast.valle} onValueChange={v => handleUpdateAssistantField(idx, 'valle', v)}><SelectTrigger className="h-9 text-center text-[10px] font-black uppercase border-slate-200"><SelectValue placeholder="VALLE..." /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="TOLUCA" className="text-[10px] font-bold uppercase">TOLUCA</SelectItem><SelectItem value="MEXICO" className="text-[10px] font-bold uppercase">MÉXICO</SelectItem></SelectContent></Select></TableCell>
                                    <TableCell className="p-2"><Input placeholder="OFICINA / DEPTO..." className="h-9 text-[10px] font-bold uppercase border-slate-200" value={ast.departamento} onChange={e => handleUpdateAssistantField(idx, 'departamento', e.target.value.toUpperCase())} /></TableCell>
                                    <TableCell className="p-2"><Select value={ast.estatus || 'ACTIVA'} onValueChange={v => handleUpdateAssistantField(idx, 'estatus', v)}><SelectTrigger className={cn("h-9 text-[10px] font-black uppercase border-2", ast.estatus === 'ACTIVA' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : ast.estatus === 'INACTIVA' ? 'border-slate-200 text-slate-500 bg-slate-50' : 'border-rose-200 text-rose-700 bg-rose-50')}><SelectValue /></SelectTrigger><SelectContent className="rounded-xl">{ESTATUS_OPCIONES.map(e => (<SelectItem key={`est-${e}`} value={e} className={cn("text-[10px] font-black", e === 'ACTIVA' ? 'text-emerald-600' : e === 'INACTIVA' ? 'text-slate-500' : 'text-rose-600')}>{e}</SelectItem>))}</SelectContent></Select></TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-3 border-b-2 border-primary/10 pb-2"><Info className="h-5 w-5 text-primary" /><h3 className="text-sm font-black uppercase text-primary">Observaciones Técnicas</h3></div>
                  <Textarea className="min-h-[120px] rounded-xl p-5 bg-slate-50 border-2 border-slate-200 text-xs font-semibold shadow-inner focus:bg-white" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder="Detalle técnico o acuerdos del módulo..." />
                </div>
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="p-6 gap-3 border-t bg-slate-50 flex items-center justify-end shrink-0"><Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-11 px-6 text-[10px] font-black uppercase">Cancelar</Button><Button onClick={handleSave} className="btn-institutional h-11 px-10 text-[10px]">Guardar Cambios</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
