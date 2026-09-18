
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
  Server,
  QrCode,
  ExternalLink,
  Headphones
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
  serverTimestamp
} from 'firebase/firestore'
import { type ProgramStatus } from '@/lib/planning-data'
import { schoolsDirectory, type SchoolInfo } from "@/lib/schools-directory"
import { HelpDeskInterface } from '@/components/HelpDeskInterface'

const DOMINIOS = ['@coees.edu.mx', '@desysa.edu.mx', '@edomex.gob.mx'];
const FUNCIONES = ["PAAE", "DOCENTE", "DIRECTIVO", "JEFE DE ENSEÑANZA", "SUPERVISOR", "ASESOR TECNICO PEDAGOGICO"];

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

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [activeTab, setActiveTab] = useState('Cuentas Institucionales')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogSearchTerm, setDialogSearchTerm] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [municipioFilter, setMunicipioFilter] = useState('all')
  const [estatusFilter, setEstatusFilter] = useState('all')
  const [selectedLibCct, setSelectedLibCct] = useState<string | null>(null)
  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([])
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [userPart, setUserPart] = useState('')
  const [domainPart, setDomainPart] = useState(DOMINIOS[0])
  const [asistentes, setAsistentes] = useState<any[]>([{ paterno: '', materno: '', nombres: '', rfc: '', funcion: '', cct: '', nombreCT: '' }])
  const [verifiedAccount, setVerifiedAccount] = useState<ProgramStatus | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyInput, setVerifyInput] = useState('')

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
  const [quickAddForm, setQuickAddForm] = useState<SchoolInfo>({
    region: '', valle: 'MEXICO', municipio: '', subsistema: 'FEDERALIZADO', control: 'OFICIAL',
    nivel: 'SECUNDARIA', servicioEducativo: 'SECUNDARIA GENERAL', cct: '', turno: 'MATUTINO',
    nombre: '', domicilio: '', localidad: '', telefono: '', zonaEscolar: '', sector: '',
    director: '', hombres: 0, mujeres: 0, alumnos: 0, grupos: 0, maestros: 0, administrativos: 0,
    aulasExistentes: 0, aulasEnUso: 0, modalidad: 'DES'
  })

  useEffect(() => {
    setMounted(true)
    const q = query(collection(db, 'programs'), orderBy('updatedAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as ProgramStatus[]
      setRecords(fetched)
    })
    setAllSchools(JSON.parse(localStorage.getItem('schools_master_full_v21') || '[]').length > 0 ? JSON.parse(localStorage.getItem('schools_master_full_v21') || '[]') : schoolsDirectory)
    return () => unsubscribe()
  }, [])

  const libData = useMemo(() => {
    const libRecs = records.filter(r => r.name === 'Biblioteca Digital');
    return { libRecs, totalCct: libRecs.length, concluidos: libRecs.filter(r => r.progress === 100).length, evidencesCount: libRecs.reduce((acc, r) => acc + (r.evidencePhotos?.length || 0), 0) };
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

  const handleCctChange = (value: string) => {
    const cleanValue = value.toUpperCase().trim()
    setFormData(prev => ({ ...prev, cct: cleanValue }))
    const match = allSchools.find(s => s.cct.toUpperCase() === cleanValue)
    if (match) {
      setFormData(prev => ({ ...prev, cct: match.cct, schoolName: match.nombre, municipio: match.municipio, valle: match.valle, region: match.region, zonaEscolar: match.zonaEscolar, sector: match.sector, modalidad: match.modalidad }))
      setDialogSearchTerm(match.cct); setShowSearchResults(false);
    }
  }

  const handleSave = () => {
    const currentCct = (formData.cct || dialogSearchTerm || '').toUpperCase().trim();
    if (!currentCct && activeTab !== 'Cuentas Institucionales') return toast({ variant: "destructive", title: "CCT Requerido" });
    setIsSaving(true);
    const docBody: any = { 
      name: String(activeTab), cct: String(currentCct), schoolName: formData.schoolName || '', municipio: formData.municipio || '', valle: formData.valle || '', region: formData.region || '', 
      zonaEscolar: formData.zonaEscolar || '', sector: formData.sector || '', modalidad: formData.modalidad || '', progress: Number(activeTab === 'Biblioteca Digital' ? (BIBLIOTECA_FASES_LABELS.filter(f => (formData.bibliotecaFases as any)?.[f.id]).reduce((max, f) => Math.max(max, f.progress), 0)) : formData.progress || 0),
      status: formData.status || 'activo', observaciones: formData.observaciones || '', updatedAt: serverTimestamp(),
    };
    if (activeTab === 'Cuentas Institucionales') { docBody.userName = formData.userName || ''; docBody.departamento = formData.departamento || ''; docBody.email = `${userPart.toLowerCase().trim()}${domainPart}`; }
    if (activeTab === 'Biblioteca Digital') { docBody.bibliotecaFases = formData.bibliotecaFases; docBody.asistentes = asistentes.filter(a => a.rfc); docBody.reportPdf = formData.reportPdf || ''; docBody.evidencePhotos = formData.evidencePhotos || []; }
    if (editingId) updateDoc(doc(db, 'programs', editingId), docBody).then(() => { setIsSaving(false); setIsDialogOpen(false); resetForm(); toast({ title: "Actualizado" }); });
    else addDoc(collection(db, 'programs'), { ...docBody, createdAt: serverTimestamp() }).then(() => { setIsSaving(false); setIsDialogOpen(false); resetForm(); toast({ title: "Guardado" }); });
  }

  const resetForm = () => { setFormData(initialFormState); setEditingId(null); setDialogSearchTerm(''); setUserPart(''); setShowSearchResults(false); setAsistentes([{ paterno: '', materno: '', nombres: '', rfc: '', funcion: '', cct: '', nombreCT: '' }]); }

  const handleEdit = (rec: ProgramStatus) => { setFormData({...rec}); setEditingId(rec.id!); setDialogSearchTerm(rec.cct); if (rec.name === 'Cuentas Institucionales') { setUserPart(rec.email?.split('@')[0] || ''); setDomainPart('@' + (rec.email?.split('@')[1] || 'desysa.edu.mx')); } setIsDialogOpen(true); }

  const handleVerifyAccount = async () => {
    if (!verifyInput.trim()) return;
    setIsVerifying(true);
    const match = records.find(r => r.name === 'Cuentas Institucionales' && r.email?.toLowerCase() === verifyInput.toLowerCase());
    setVerifiedAccount(match || null);
    if (!match) toast({ variant: "destructive", title: "Sin registros" });
    setIsVerifying(false);
  }

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 w-full min-w-0 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-primary leading-none uppercase">Módulos Técnicos COEES</h2>
          <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Auditoría Institucional 2026</p>
        </div>
        <div className="flex gap-3">
          {activeTab !== 'ATRES' && (
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 h-10 px-6 rounded-xl text-[10px] font-bold shadow-lg uppercase text-white">
               <PlusCircle className="h-5 w-5 mr-2" /> Nuevo Registro
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 shrink-0">
        {['Cuentas Institucionales', 'Biblioteca Digital', 'Geoposición', 'Conoce mi Escuela', 'ATRES'].map(rubro => (
          <button key={rubro} onClick={() => { setActiveTab(rubro); setSearchTerm(''); }} className={cn("px-6 h-11 text-[10px] font-black rounded-xl transition-all border shadow-sm shrink-0 whitespace-nowrap uppercase tracking-wider", activeTab === rubro ? "bg-primary text-white border-primary shadow-xl scale-105" : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50")}>{rubro}</button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'ATRES' ? (
          <div className="h-full flex flex-col gap-6 animate-in slide-in-from-bottom-4">
             <div className="flex-1 overflow-hidden bg-white rounded-[3rem] shadow-2xl border-4 border-slate-50">
                <HelpDeskInterface />
             </div>
             <Card className="executive-card p-6 bg-[#0b4135] text-white shrink-0 border-none">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="flex items-center gap-6">
                      <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center p-1 shadow-2xl"><QrCode className="h-10 w-10 text-emerald-600" /></div>
                      <div className="space-y-1">
                         <h4 className="text-lg font-black uppercase tracking-tighter flex items-center gap-2"><Headphones className="h-5 w-5 text-emerald-400" /> COMPARTIR ACCESO A USUARIOS</h4>
                         <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">LIGA DE ATENCIÓN DIRECTA PARA DOCENTES Y COORDINADORES</p>
                      </div>
                   </div>
                   <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                      <div className="bg-black/20 px-6 py-3 rounded-xl border border-white/10 flex items-center gap-4 flex-1">
                         <span className="text-[10px] font-black text-emerald-400 font-mono">URL:</span>
                         <span className="text-[11px] font-bold text-white/80 select-all truncate max-w-[200px]">{typeof window !== 'undefined' ? window.location.origin : ''}/helpdesk</span>
                      </div>
                      <Button onClick={() => window.open('/helpdesk', '_blank')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] h-12 px-8 rounded-xl shadow-xl gap-2 shrink-0"><ExternalLink className="h-4 w-4" /> ABRIR PORTAL</Button>
                   </div>
                </div>
             </Card>
          </div>
        ) : activeTab === 'Biblioteca Digital' ? (
          <ScrollArea className="h-full">
            <div className="space-y-8 pb-10">
               <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {[ { label: 'CCT REGISTRADOS', value: libData.totalCct, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' }, { label: 'VISITAS TOTALES', value: 0, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' }, { label: 'EVIDENCIAS', value: libData.evidencesCount, icon: ImageIcon, color: 'text-orange-500', bg: 'bg-orange-50' }, { label: 'CONCLUIDOS', value: libData.concluidos, icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' } ].map((k, i) => (
                    <Card key={i} className="border-none shadow-sm rounded-2xl p-4 bg-white flex items-center gap-4">
                       <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", k.bg, k.color)}><k.icon className="h-5 w-5" /></div>
                       <div><p className="text-[8px] font-black text-slate-400 uppercase">{k.label}</p><h4 className="text-lg font-black">{k.value}</h4></div>
                    </Card>
                  ))}
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <Card className="lg:col-span-8 border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                     <div className="p-6 border-b flex justify-between items-center"><h3 className="text-sm font-black uppercase text-slate-700 tracking-widest">Estatus de Fases por CCT</h3><Badge variant="secondary" className="text-[9px] font-bold">{filteredRecords.length} REGISTROS</Badge></div>
                     <Table><TableHeader className="bg-slate-50/50"><TableRow><TableHead className="pl-8 text-[9px] font-black uppercase">CCT</TableHead><TableHead className="text-[9px] font-black uppercase">Escuela</TableHead><TableHead className="text-[9px] font-black uppercase">Avance</TableHead><TableHead className="text-[9px] font-black uppercase text-right pr-8">Acción</TableHead></TableRow></TableHeader><TableBody>{filteredRecords.map((r, i) => (
                       <TableRow key={i} className="h-16 hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedLibCct(r.cct)}>
                          <TableCell className="pl-8 font-mono font-black text-[10px] text-primary">{r.cct}</TableCell>
                          <TableCell className="font-bold text-[10px] uppercase text-slate-700 truncate max-w-[200px]">{r.schoolName}</TableCell>
                          <TableCell><div className="flex items-center gap-3"><Progress value={r.progress} className="h-1.5 flex-1" /><span className="text-[10px] font-black text-slate-600">{r.progress}%</span></div></TableCell>
                          <TableCell className="text-right pr-6"><div className="flex justify-end gap-1"><button onClick={(e) => { e.stopPropagation(); handleEdit(r); }} className="h-8 w-8 rounded-lg text-primary hover:bg-primary/5 flex items-center justify-center"><Pencil className="h-4 w-4" /></button></div></TableCell>
                       </TableRow>
                     ))}</TableBody></Table>
                  </Card>
                  <Card className="lg:col-span-4 border-none shadow-xl rounded-[2.5rem] bg-white p-8 space-y-6">
                     <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest">Detalle de Auditoría</h3>
                     <div className="space-y-6">
                        {BIBLIOTECA_FASES_LABELS.map((f, i) => (
                          <div key={f.id} className="flex gap-4 relative">
                             <div className={cn("h-7 w-7 rounded-full border-2 flex items-center justify-center text-[10px] font-black shrink-0", i < 5 ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-200 text-slate-300")}>{i < 5 ? <CheckCircle2 className="h-4 w-4" /> : i + 1}</div>
                             <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[9px] font-bold text-slate-600 uppercase leading-tight">{f.label}</p></div>
                          </div>
                        ))}
                     </div>
                  </Card>
               </div>
            </div>
          </ScrollArea>
        ) : activeTab === 'Geoposición' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full animate-in slide-in-from-bottom-4">
             <div className="lg:col-span-8 bg-slate-100 rounded-[2.5rem] overflow-hidden relative shadow-2xl"><Image src="https://picsum.photos/seed/map/1200/800" alt="Mapa" fill className="object-cover opacity-60" /><div className="absolute top-6 left-6 p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border"><h4 className="text-[10px] font-black uppercase text-primary">Monitor Geográfico 2026</h4></div></div>
             <Card className="lg:col-span-4 border-none shadow-xl rounded-[2.5rem] bg-white p-8 space-y-8 flex flex-col"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner"><Navigation className="h-7 w-7" /></div><h3 className="text-xl font-black uppercase">Captura de Ubicación</h3></div><div className="space-y-6 flex-1"><div className="space-y-2"><Label className="text-[10px] font-black text-slate-400 uppercase">CCT Plantel</Label><Input className="h-11 rounded-xl bg-slate-50 border-none font-black text-lg uppercase" value={dialogSearchTerm} onChange={e => handleCctChange(e.target.value)} /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-[10px] font-black text-slate-400 uppercase">Latitud</Label><Input className="h-11 rounded-xl bg-slate-50 border-none font-bold" value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} /></div><div className="space-y-2"><Label className="text-[10px] font-black text-slate-400 uppercase">Longitud</Label><Input className="h-11 rounded-xl bg-slate-50 border-none font-bold" value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} /></div></div></div><Button onClick={handleSave} className="btn-institutional w-full h-14 rounded-2xl text-[11px] shadow-2xl">GUARDAR POSICIÓN</Button></Card>
          </div>
        ) : activeTab === 'Conoce mi Escuela' ? (
          <div className="space-y-8 h-full flex flex-col animate-in slide-in-from-bottom-4">
             <Card className="executive-card p-6 bg-white/80 backdrop-blur-md shrink-0"><div className="flex flex-col lg:flex-row gap-6 items-end"><div className="grid grid-cols-2 gap-4 flex-1 w-full"><div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Tipo de Búsqueda</Label><Select defaultValue="CCT"><SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none shadow-inner"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="CCT">CCT</SelectItem><SelectItem value="NOM">NOMBRE</SelectItem></SelectContent></Select></div><div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Identificador</Label><Input placeholder="EJ. 15DES..." className="h-10 rounded-xl bg-slate-50 border-none shadow-inner uppercase font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div></div><Button className="btn-institutional h-10 px-10 rounded-xl text-xs shadow-lg"><Search className="h-4 w-4 mr-2" /> BUSCAR PLANTEL</Button></div></Card>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 shrink-0">{[ { l: 'Registradas', v: '0', i: Building2, c: 'text-blue-600', b: 'bg-blue-50' }, { l: 'Directores', v: '0', i: Users, c: 'text-emerald-600', b: 'bg-emerald-50' }, { l: 'Municipios', v: '0', i: MapPin, c: 'text-orange-500', b: 'bg-orange-50' }, { l: 'Auditados', v: '0', i: FileText, c: 'text-indigo-600', b: 'bg-indigo-50' } ].map((k, i) => (
               <Card key={i} className="rounded-2xl border-none shadow-md bg-white p-6 flex flex-col items-center gap-3"><div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", k.b, k.c)}><k.i className="h-6 w-6" /></div><h4 className="text-2xl font-black">{k.v}</h4><p className="text-[9px] font-bold text-slate-400 uppercase">{k.l}</p></Card>
             ))}</div>
             <div className="flex-1 min-h-0 bg-slate-100 rounded-[2.5rem] overflow-hidden relative shadow-inner"><Image src="https://picsum.photos/seed/conoce/1200/900" alt="Vista" fill className="object-cover opacity-50" /></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full animate-in slide-in-from-bottom-4">
             <Card className="lg:col-span-5 border-none shadow-xl rounded-[2.5rem] bg-white p-10 flex flex-col space-y-8"><div className="flex items-center gap-5"><div className="h-14 w-14 rounded-3xl bg-primary text-white flex items-center justify-center shadow-2xl"><Mail className="h-8 w-8" /></div><h3 className="text-2xl font-black uppercase">Alta de Cuenta</h3></div><div className="space-y-6 flex-1"><div className="space-y-2"><Label className="text-[10px] font-black text-slate-500 uppercase">Responsable / Servidor</Label><Input className="h-12 rounded-xl bg-slate-50 border-none shadow-inner uppercase font-bold" value={formData.userName} onChange={e => setFormData({...formData, userName: e.target.value.toUpperCase()})} /></div><div className="space-y-2"><Label className="text-[10px] font-black text-slate-500 uppercase">Departamento</Label><Input className="h-12 rounded-xl bg-slate-50 border-none shadow-inner uppercase font-bold" value={formData.departamento} onChange={e => setFormData({...formData, departamento: e.target.value.toUpperCase()})} /></div><div className="p-6 bg-slate-50 rounded-3xl border border-primary/5 shadow-inner space-y-4"><Label className="text-[10px] font-black text-primary uppercase">Estructura del Correo</Label><div className="flex gap-2"><Input className="h-11 rounded-xl bg-white border-slate-200 text-xs font-bold" value={userPart} onChange={e => setUserPart(e.target.value)} /><Select value={domainPart} onValueChange={setDomainPart}><SelectTrigger className="h-11 rounded-xl w-44 bg-white font-black"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl">{DOMINIOS.map(d => <SelectItem key={d} value={d} className="font-black text-[10px]">{d}</SelectItem>)}</SelectContent></Select></div></div></div><Button onClick={handleSave} disabled={isSaving || !userPart} className="btn-institutional w-full h-14 rounded-2xl shadow-2xl">GUARDAR REGISTRO</Button></Card>
             <Card className="lg:col-span-7 border-none shadow-xl rounded-[2.5rem] bg-white flex flex-col overflow-hidden"><div className="p-8 border-b bg-slate-50/50 flex justify-between items-center"><h4 className="text-sm font-black uppercase tracking-widest text-slate-700">Historial de Cuentas</h4><div className="relative w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" /><Input placeholder="FILTRAR..." className="h-9 pl-9 rounded-xl border-none bg-white text-[10px] font-black uppercase shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div></div><ScrollArea className="flex-1"><Table><TableHeader className="bg-slate-50/50 sticky top-0 z-10"><TableRow><TableHead className="pl-8 text-[9px] font-black uppercase">Servidor Público</TableHead><TableHead className="text-[9px] font-black uppercase">Correo</TableHead><TableHead className="text-right pr-10 text-[9px] font-black uppercase">Acciones</TableHead></TableRow></TableHeader><TableBody>{records.filter(r => r.name === 'Cuentas Institucionales').map((rec, i) => (
               <TableRow key={i} className="h-16 hover:bg-slate-50"><TableCell className="pl-8"><div className="flex flex-col"><span className="text-[11px] font-black text-slate-700 uppercase leading-none">{rec.userName}</span><span className="text-[8px] font-bold text-slate-400 mt-1 uppercase truncate max-w-[180px]">{rec.departamento}</span></div></TableCell><TableCell className="font-mono text-[10px] font-bold text-primary">{rec.email}</TableCell><TableCell className="text-right pr-8"><div className="flex justify-end gap-1"><button onClick={() => handleEdit(rec)} className="h-8 w-8 text-slate-400 hover:text-primary"><Eye className="h-4 w-4" /></button></div></TableCell></TableRow>
             ))}</TableBody></Table></ScrollArea></Card>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(o) => { if(!isSaving) setIsDialogOpen(o); if(!o) resetForm(); }}>
        <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white shrink-0"><DialogTitle className="font-black text-2xl uppercase">Gestión Técnica: {activeTab}</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-hidden">
             <ScrollArea className="h-full p-10"><div className="space-y-10 max-w-4xl mx-auto">
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-primary/10 shadow-inner space-y-6">
                   <Label className="text-[11px] font-black text-primary uppercase">Identificación CCT</Label>
                   <div className="relative">
                      <Input placeholder="BUSCAR CCT..." className="h-14 rounded-2xl bg-white border-primary/20 font-bold text-xl uppercase shadow-lg pl-6" value={dialogSearchTerm} onChange={(e) => { setDialogSearchTerm(e.target.value); handleCctChange(e.target.value); setShowSearchResults(true); }} />
                      {showSearchResults && dialogSearchTerm.length > 2 && (
                        <div className="absolute top-18 left-0 right-0 max-h-60 overflow-auto bg-white border rounded-2xl shadow-2xl z-[100] divide-y">{schoolSearchResults.map((s, i) => (<div key={i} className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center group" onClick={() => handleCctChange(s.cct)}><div className="flex flex-col"><span className="text-sm font-bold uppercase truncate group-hover:text-primary">{s.nombre}</span><span className="text-[10px] font-mono text-muted-foreground">{s.cct}</span></div><ChevronRight className="h-5 w-5 text-slate-300" /></div>))}
                        {schoolSearchResults.length === 0 && <div className="p-6 text-center"><Button onClick={() => setIsQuickAddOpen(true)} variant="outline" className="h-10 px-6 rounded-xl text-[9px] font-black uppercase"><Plus className="h-4 w-4 mr-2" /> Alta Rápida</Button></div>}</div>
                      )}
                   </div>
                </div>
                {activeTab === 'Biblioteca Digital' && (
                  <div className="space-y-8 animate-in fade-in">
                     <div className="grid grid-cols-2 gap-8 bg-slate-50 p-6 rounded-3xl border border-primary/5 shadow-inner">
                        <div className="space-y-2"><Label className="text-[11px] font-black text-primary uppercase pl-2"># Equipos Habilitados</Label><Input type="number" className="h-14 font-black text-2xl text-center bg-white border-none rounded-2xl" value={formData.bibliotecaFases?.equiposHabilitados || 0} onChange={e => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, equiposHabilitados: parseInt(e.target.value) || 0}})} /></div>
                        <div className="space-y-2"><Label className="text-[11px] font-black text-primary uppercase pl-2"># Personal Capacitado</Label><Input type="number" className="h-14 font-black text-2xl text-center bg-white border-none rounded-2xl" value={formData.bibliotecaFases?.personalCapacitado || 0} onChange={e => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, personalCapacitado: parseInt(e.target.value) || 0}})} /></div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        {BIBLIOTECA_FASES_LABELS.map(f => (
                          <div key={f.id} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200">
                             <Checkbox checked={(formData.bibliotecaFases as any)?.[f.id]} onCheckedChange={(val) => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, [f.id]: !!val}})} id={`check-${f.id}`} />
                             <Label htmlFor={`check-${f.id}`} className="text-[9px] font-bold text-slate-600 uppercase cursor-pointer">{f.label}</Label>
                          </div>
                        ))}
                     </div>
                  </div>
                )}
                <div className="space-y-2"><Label className="text-[10px] font-black text-slate-400 pl-1 uppercase">Observaciones Operativas</Label><Textarea value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value.toUpperCase()})} className="min-h-[120px] bg-slate-50 border-none rounded-2xl p-6 font-bold uppercase shadow-inner" /></div>
             </div></ScrollArea>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4 shadow-inner"><Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-12 px-8 text-xs font-bold uppercase">CANCELAR</Button><Button onClick={handleSave} className="btn-institutional h-12 px-16 text-xs shadow-2xl">{isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />} GUARDAR</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
