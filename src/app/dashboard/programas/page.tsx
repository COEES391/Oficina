
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  Settings,
  RotateCcw,
  RotateCw,
  LayoutGrid,
  Phone,
  MonitorCheck,
  Server,
  QrCode,
  ExternalLink,
  Headphones,
  MessageSquare,
  Clock,
  Circle,
  Terminal,
  Power,
  Lock,
  MoreVertical,
  Paperclip,
  HardDrive,
  Network,
  RefreshCcw,
  FileUp,
  Laptop
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
  where,
  setDoc,
  limit
} from 'firebase/firestore'
import { type ProgramStatus } from '@/lib/planning-data'
import { schoolsDirectory, type SchoolInfo } from "@/lib/schools-directory"
import { format } from 'date-fns'

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
  
  // ATRES Specific State
  const [atresView, setAtresView] = useState<'chat' | 'remote' | 'files' | 'stats'>('chat')
  const [queue, setQueue] = useState<any[]>([])
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

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
    
    // ATRES Queue listener
    const qAtres = query(collection(db, 'support_queue'), orderBy('lastActivity', 'desc'), limit(20));
    const unsubscribeAtres = onSnapshot(qAtres, (snap) => {
      setQueue(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    const storedSchools = JSON.parse(localStorage.getItem('schools_master_full_v21') || '[]');
    setAllSchools(storedSchools.length > 0 ? storedSchools : schoolsDirectory);
    
    return () => { unsubscribe(); unsubscribeAtres(); }
  }, [])

  useEffect(() => {
    if (!selectedRequest) { setMessages([]); return; }
    const q = query(collection(db, 'chat_messages'), where('chatId', '==', selectedRequest.id));
    return onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      setMessages(msgs.sort((a: any, b: any) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)));
    });
  }, [selectedRequest]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const libData = useMemo(() => {
    const libRecs = records.filter(r => r.name === 'Biblioteca Digital');
    return { 
      totalCct: libRecs.length, 
      concluidos: libRecs.filter(r => r.progress === 100).length, 
      evidencesCount: libRecs.reduce((acc, r) => acc + (r.evidencePhotos?.length || 0), 0) 
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

  const schoolSearchResults = useMemo(() => {
    if (!dialogSearchTerm || dialogSearchTerm.length < 3) return [];
    const term = dialogSearchTerm.toUpperCase();
    return allSchools.filter(s => s.cct.includes(term) || s.nombre.includes(term)).slice(0, 5);
  }, [allSchools, dialogSearchTerm]);

  const handleCctChange = (value: string) => {
    const cleanValue = value.toUpperCase().trim()
    setFormData(prev => ({ ...prev, cct: cleanValue }))
    const match = allSchools.find(s => s.cct.toUpperCase() === cleanValue)
    if (match) {
      setFormData(prev => ({ 
        ...prev, 
        cct: match.cct, 
        schoolName: match.nombre, 
        municipio: match.municipio, 
        valle: match.valle, 
        region: match.region, 
        zonaEscolar: match.zonaEscolar, 
        sector: match.sector, 
        modalidad: match.modalidad 
      }))
      setDialogSearchTerm(match.cct);
      setShowSearchResults(false);
    }
  }

  const handleSave = () => {
    const currentCct = (formData.cct || dialogSearchTerm || '').toUpperCase().trim();
    if (!currentCct && activeTab !== 'Cuentas Institucionales') return toast({ variant: "destructive", title: "CCT Requerido" });
    
    setIsSaving(true);
    const docBody: any = { 
      name: String(activeTab), 
      cct: String(currentCct), 
      schoolName: formData.schoolName || '', 
      municipio: formData.municipio || '', 
      valle: formData.valle || '', 
      region: formData.region || '', 
      zonaEscolar: formData.zonaEscolar || '', 
      sector: formData.sector || '', 
      modalidad: formData.modalidad || '', 
      progress: Number(activeTab === 'Biblioteca Digital' ? (BIBLIOTECA_FASES_LABELS.filter(f => (formData.bibliotecaFases as any)?.[f.id]).reduce((max, f) => Math.max(max, f.progress), 0)) : formData.progress || 0),
      status: formData.status || 'activo', 
      observaciones: formData.observaciones || '', 
      updatedAt: serverTimestamp(),
    };

    if (activeTab === 'Cuentas Institucionales') { 
      docBody.userName = formData.userName || ''; 
      docBody.departamento = formData.departamento || ''; 
      docBody.email = `${userPart.toLowerCase().trim()}${domainPart}`; 
    }
    
    if (activeTab === 'Biblioteca Digital') { 
      docBody.bibliotecaFases = formData.bibliotecaFases; 
      docBody.asistentes = asistentes.filter(a => a.rfc); 
      docBody.reportPdf = formData.reportPdf || ''; 
      docBody.evidencePhotos = formData.evidencePhotos || []; 
    }

    if (editingId) {
      updateDoc(doc(db, 'programs', editingId), docBody).finally(() => { setIsSaving(false); setIsDialogOpen(false); resetForm(); toast({ title: "Registro Actualizado" }); });
    } else {
      addDoc(collection(db, 'programs'), { ...docBody, createdAt: serverTimestamp() }).finally(() => { setIsSaving(false); setIsDialogOpen(false); resetForm(); toast({ title: "Registro Guardado" }); });
    }
  }

  const resetForm = () => { 
    setFormData(initialFormState); 
    setEditingId(null); 
    setDialogSearchTerm(''); 
    setUserPart(''); 
    setShowSearchResults(false); 
    setAsistentes([{ paterno: '', materno: '', nombres: '', rfc: '', funcion: '', cct: '', nombreCT: '' }]); 
  }

  const handleEdit = (rec: ProgramStatus) => { 
    setFormData({...rec}); 
    setEditingId(rec.id!); 
    setDialogSearchTerm(rec.cct); 
    if (rec.name === 'Cuentas Institucionales') { 
      setUserPart(rec.email?.split('@')[0] || ''); 
      setDomainPart('@' + (rec.email?.split('@')[1] || 'desysa.edu.mx')); 
    } 
    setIsDialogOpen(true); 
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Eliminar este registro permanentemente?")) {
      deleteDoc(doc(db, 'programs', id)).then(() => toast({ title: "Registro Eliminado" }));
    }
  }

  const handleSendMessage = () => {
    if (!chatInput.trim() || !selectedRequest) return;
    const chatId = selectedRequest.id;
    
    setDoc(doc(db, 'support_queue', chatId), { 
      lastActivity: serverTimestamp(), 
      lastMessage: chatInput.substring(0, 50),
      status: 'attending'
    }, { merge: true });

    addDoc(collection(db, 'chat_messages'), {
      chatId,
      role: 'tech',
      content: chatInput,
      timestamp: serverTimestamp(),
      senderName: localStorage.getItem('userRfc') || 'ANALISTA'
    });

    setChatInput('');
  };

  const handleQuickAddCct = () => {
    if (!quickAddForm.cct || !quickAddForm.nombre || !quickAddForm.municipio) {
      toast({ variant: "destructive", title: "Faltan datos", description: "CCT, Nombre y Municipio son obligatorios." }); 
      return;
    }
    const newSchool = { 
      ...quickAddForm, 
      cct: quickAddForm.cct.toUpperCase(), 
      nombre: quickAddForm.nombre.toUpperCase(), 
      municipio: quickAddForm.municipio.toUpperCase()
    };
    const updated = [newSchool, ...allSchools];
    setAllSchools(updated);
    localStorage.setItem('schools_master_full_v21', JSON.stringify(updated));
    handleCctChange(newSchool.cct);
    setIsQuickAddOpen(false);
    toast({ title: "Plantel Sumado a Base Maestra" });
  }

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 w-full min-w-0 h-[calc(100vh-140px)] flex flex-col">
      {/* Header Táctico */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-primary leading-none uppercase">Gestión de Módulos COEES</h2>
          <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Auditoría Técnica y Soporte 2026</p>
        </div>
        <div className="flex gap-3">
          {activeTab !== 'ATRES' && (
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="btn-institutional h-10 px-6 rounded-xl text-[10px] font-bold shadow-lg uppercase text-white">
               <PlusCircle className="h-5 w-5 mr-2" /> Nuevo Registro
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Institucionales */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 shrink-0">
        {['Cuentas Institucionales', 'Biblioteca Digital', 'Geoposición', 'Conoce mi Escuela', 'ATRES'].map(rubro => (
          <button 
            key={rubro} 
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

      {/* Contenido Dinámico */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'Cuentas Institucionales' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full animate-in slide-in-from-bottom-4">
             {/* Formulario de Alta */}
             <Card className="lg:col-span-5 border-none shadow-xl rounded-[2.5rem] bg-white p-10 flex flex-col space-y-8">
                <div className="flex items-center gap-5">
                   <div className="h-14 w-14 rounded-3xl bg-primary text-white flex items-center justify-center shadow-2xl">
                      <Mail className="h-8 w-8" />
                   </div>
                   <div className="space-y-1">
                      <h3 className="text-2xl font-black uppercase leading-none">Alta de Cuenta</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Correo Institucional Seguro</p>
                   </div>
                </div>

                <div className="space-y-6 flex-1">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-500 uppercase pl-1">Responsable / Servidor Público</Label>
                      <Input className="h-12 rounded-xl bg-slate-50 border-none shadow-inner uppercase font-bold" value={formData.userName} onChange={e => setFormData({...formData, userName: e.target.value.toUpperCase()})} placeholder="NOMBRE COMPLETO..." />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-500 uppercase pl-1">Departamento de Adscripción</Label>
                      <Input className="h-12 rounded-xl bg-slate-50 border-none shadow-inner uppercase font-bold" value={formData.departamento} onChange={e => setFormData({...formData, departamento: e.target.value.toUpperCase()})} placeholder="EJ. TECNOLOGÍA EDUCATIVA..." />
                   </div>
                   <div className="p-6 bg-slate-50 rounded-3xl border border-primary/5 shadow-inner space-y-4">
                      <Label className="text-[10px] font-black text-primary uppercase pl-1">Estructura del Correo</Label>
                      <div className="flex gap-2">
                         <Input className="h-11 rounded-xl bg-white border-slate-200 text-xs font-bold" value={userPart} onChange={e => setUserPart(e.target.value)} placeholder="usuario" />
                         <Select value={domainPart} onValueChange={setDomainPart}>
                            <SelectTrigger className="h-11 rounded-xl w-44 bg-white font-black"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl">
                               {DOMINIOS.map(d => <SelectItem key={d} value={d} className="font-black text-[10px]">{d}</SelectItem>)}
                            </SelectContent>
                         </Select>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 shrink-0">
                  <Button onClick={handleSave} disabled={isSaving || !userPart} className="btn-institutional h-14 rounded-2xl text-[11px] gap-3 shadow-2xl">
                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} GUARDAR
                  </Button>
                  <Button variant="outline" onClick={resetForm} className="h-14 rounded-2xl border-slate-200 text-slate-500 font-black text-[11px] gap-2 uppercase hover:bg-slate-50">
                    <RotateCcw className="h-4 w-4" /> LIMPIAR
                  </Button>
                </div>
             </Card>

             {/* Historial de Cuentas */}
             <Card className="lg:col-span-7 border-none shadow-xl rounded-[2.5rem] bg-white flex flex-col overflow-hidden">
                <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <History className="h-5 w-5 text-primary" />
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-700">Historial de Registros</h4>
                   </div>
                   <div className="relative w-64">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
                      <Input placeholder="FILTRAR..." className="h-9 pl-9 rounded-xl border-none bg-white text-[10px] font-black uppercase shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                   </div>
                </div>
                <ScrollArea className="flex-1">
                   <Table>
                      <TableHeader className="bg-slate-50/50 sticky top-0 z-10 border-b">
                         <TableRow className="h-12">
                            <TableHead className="pl-8 text-[9px] font-black uppercase">Servidor Público</TableHead>
                            <TableHead className="text-[9px] font-black uppercase">Correo Registrado</TableHead>
                            <TableHead className="text-right pr-10 text-[9px] font-black uppercase">Acciones</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {filteredRecords.map((rec, i) => (
                           <TableRow key={rec.id || i} className="h-16 hover:bg-slate-50 transition-colors">
                              <TableCell className="pl-8">
                                 <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-slate-700 uppercase leading-none">{rec.userName}</span>
                                    <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase truncate max-w-[200px]">{rec.departamento}</span>
                                 </div>
                              </TableCell>
                              <TableCell className="font-mono text-[10px] font-bold text-primary">{rec.email}</TableCell>
                              <TableCell className="text-right pr-8">
                                 <div className="flex justify-end gap-1">
                                    <button onClick={() => handleEdit(rec)} className="h-8 w-8 text-slate-400 hover:text-primary transition-all"><Eye className="h-4 w-4" /></button>
                                    <button onClick={() => handleDelete(rec.id!)} className="h-8 w-8 text-rose-300 hover:text-rose-600 transition-all"><Trash2 className="h-4 w-4" /></button>
                                 </div>
                              </TableCell>
                           </TableRow>
                         ))}
                      </TableBody>
                   </Table>
                </ScrollArea>
             </Card>
          </div>
        ) : activeTab === 'Biblioteca Digital' ? (
          <ScrollArea className="h-full">
            <div className="space-y-8 pb-10">
               {/* KPI GRID */}
               <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {[ 
                    { label: 'CCT REGISTRADOS', value: libData.totalCct, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' }, 
                    { label: 'VISITAS TOTALES', value: 0, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' }, 
                    { label: 'EVIDENCIAS', value: libData.evidencesCount, icon: ImageIcon, color: 'text-orange-500', bg: 'bg-orange-50' }, 
                    { label: 'CONCLUIDOS', value: libData.concluidos, icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'PENDIENTES', value: libData.totalCct - libData.concluidos, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'CAPACITADOS', value: 0, icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                  ].map((k, i) => (
                    <Card key={i} className="border-none shadow-sm rounded-2xl p-4 bg-white flex items-center gap-4 animate-in zoom-in duration-500" style={{ animationDelay: `${i * 50}ms` }}>
                       <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", k.bg, k.color)}><k.icon className="h-5 w-5" /></div>
                       <div><p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">{k.label}</p><h4 className="text-lg font-black leading-none">{k.value}</h4></div>
                    </Card>
                  ))}
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Listado Principal */}
                  <Card className="lg:col-span-8 border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                     <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-3">
                           <ClipboardCheck className="h-5 w-5 text-primary" />
                           <h3 className="text-sm font-black uppercase text-slate-700 tracking-widest">Estatus de Fases por CCT</h3>
                        </div>
                        <div className="relative w-48">
                           <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-300" />
                           <Input placeholder="FILTRAR CCT..." className="h-7 pl-8 text-[9px] rounded-lg border-slate-200" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                     </div>
                     <Table>
                        <TableHeader className="bg-slate-100/50">
                           <TableRow className="h-10">
                              <TableHead className="pl-8 text-[9px] font-black uppercase">CCT</TableHead>
                              <TableHead className="text-[9px] font-black uppercase">Nombre del Plantel</TableHead>
                              <TableHead className="text-[9px] font-black uppercase">Auditoría</TableHead>
                              <TableHead className="text-right pr-8"></TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {filteredRecords.map((r, i) => (
                             <TableRow key={i} className="h-16 hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => setSelectedLibCct(r.cct)}>
                                <TableCell className="pl-8 font-mono font-black text-[10px] text-primary">{r.cct}</TableCell>
                                <TableCell className="font-bold text-[10px] uppercase text-slate-700 truncate max-w-[200px]">{r.schoolName}</TableCell>
                                <TableCell>
                                   <div className="flex items-center gap-3">
                                      <Progress value={r.progress} className="h-1.5 flex-1" />
                                      <span className="text-[10px] font-black text-slate-600">{r.progress}%</span>
                                   </div>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                   <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={(e) => { e.stopPropagation(); handleEdit(r); }} className="h-8 w-8 rounded-lg text-primary hover:bg-primary/5 flex items-center justify-center"><Pencil className="h-4 w-4" /></button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id!); }} className="h-8 w-8 rounded-lg text-rose-300 hover:text-rose-600 flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
                                   </div>
                                </TableCell>
                             </TableRow>
                           ))}
                        </TableBody>
                     </Table>
                  </Card>

                  {/* Panel de Detalle de Auditoría */}
                  <Card className="lg:col-span-4 border-none shadow-xl rounded-[2.5rem] bg-white p-8 space-y-6">
                     <div className="flex items-center gap-3 border-b pb-4">
                        <Activity className="h-5 w-5 text-accent" />
                        <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest">Protocolo de Fases</h3>
                     </div>
                     <div className="space-y-5">
                        {BIBLIOTECA_FASES_LABELS.map((f, i) => {
                          const isComplete = selectedLibCct && filteredRecords.find(r => r.cct === selectedLibCct)?.bibliotecaFases?.[f.id as keyof typeof initialFormState.bibliotecaFases];
                          return (
                            <div key={f.id} className="flex gap-4 relative">
                               <div className={cn("h-7 w-7 rounded-full border-2 flex items-center justify-center text-[10px] font-black shrink-0 transition-all", isComplete ? "bg-emerald-500 border-emerald-500 text-white shadow-lg" : "bg-white border-slate-200 text-slate-300")}>
                                  {isComplete ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                               </div>
                               <div className={cn("flex-1 p-3 rounded-xl border transition-all", isComplete ? "bg-emerald-50 border-emerald-100 shadow-sm" : "bg-slate-50 border-slate-100 opacity-60")}>
                                  <p className="text-[9px] font-bold text-slate-600 uppercase leading-tight">{f.label}</p>
                               </div>
                            </div>
                          );
                        })}
                     </div>
                     {!selectedLibCct && (
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3 animate-pulse">
                           <Info className="h-4 w-4 text-blue-500" />
                           <p className="text-[8px] font-black text-blue-700 uppercase tracking-widest">Seleccione un CCT para ver detalle</p>
                        </div>
                     )}
                  </Card>
               </div>
            </div>
          </ScrollArea>
        ) : activeTab === 'Geoposición' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full animate-in slide-in-from-bottom-4">
             {/* Mapa Táctico */}
             <div className="lg:col-span-8 bg-slate-100 rounded-[2.5rem] overflow-hidden relative shadow-2xl border-4 border-white">
                <Image src="https://picsum.photos/seed/geosat/1200/800" alt="Mapa Institucional" fill className="object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-1000" />
                <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                <div className="absolute top-6 left-6 p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border flex items-center gap-3">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                   <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">Monitor de Posicionamiento Global 2026</h4>
                </div>
                {/* Marcadores Simulados */}
                <div className="absolute top-1/2 left-1/3 h-8 w-8 text-primary animate-bounce"><MapPin className="h-8 w-8 drop-shadow-lg" /></div>
                <div className="absolute top-1/4 right-1/4 h-8 w-8 text-accent"><MapPin className="h-8 w-8 drop-shadow-lg" /></div>
             </div>

             {/* Panel de Captura */}
             <Card className="lg:col-span-4 border-none shadow-xl rounded-[2.5rem] bg-white p-8 space-y-8 flex flex-col">
                <div className="flex items-center gap-4 border-b pb-4">
                   <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                      <Navigation className="h-7 w-7" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black uppercase leading-none">Captura Geo</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Auditoría Geográfica de CCT</p>
                   </div>
                </div>

                <div className="space-y-6 flex-1">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase pl-1">CCT Plantel</Label>
                      <Input 
                        className="h-11 rounded-xl bg-slate-50 border-none font-black text-lg uppercase shadow-inner" 
                        value={dialogSearchTerm} 
                        onChange={e => handleCctChange(e.target.value)} 
                        placeholder="15DES0000X"
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black text-slate-400 uppercase pl-1">Latitud</Label>
                         <Input className="h-11 rounded-xl bg-slate-50 border-none font-bold shadow-inner" value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} placeholder="19.4326" />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black text-slate-400 uppercase pl-1">Longitud</Label>
                         <Input className="h-11 rounded-xl bg-slate-50 border-none font-bold shadow-inner" value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} placeholder="-99.1332" />
                      </div>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase text-center">Referencia del Plantel</p>
                      <h5 className="text-xs font-black text-slate-600 text-center uppercase">{formData.schoolName || 'SIN SELECCIONAR'}</h5>
                   </div>
                </div>

                <Button onClick={handleSave} className="btn-institutional w-full h-14 rounded-2xl text-[11px] shadow-2xl flex items-center justify-center gap-3">
                   <LocateFixed className="h-5 w-5" /> GUARDAR POSICIÓN
                </Button>
             </Card>
          </div>
        ) : activeTab === 'Conoce mi Escuela' ? (
          <div className="space-y-8 h-full flex flex-col animate-in slide-in-from-bottom-4">
             {/* Buscador Superior */}
             <Card className="executive-card p-6 bg-white/80 backdrop-blur-md shrink-0">
                <div className="flex flex-col lg:flex-row gap-6 items-end">
                   <div className="grid grid-cols-2 gap-4 flex-1 w-full">
                      <div className="space-y-1.5">
                         <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Identificador del Plantel</Label>
                         <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                            <Input placeholder="EJ. 15DES..." className="h-10 pl-10 rounded-xl bg-slate-50 border-none shadow-inner uppercase font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                         </div>
                      </div>
                      <div className="space-y-1.5">
                         <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Nombre Comercial / Oficial</Label>
                         <Input placeholder="EJ. DR. MANUEL..." className="h-10 rounded-xl bg-slate-50 border-none shadow-inner uppercase font-bold" />
                      </div>
                   </div>
                   <Button className="btn-institutional h-10 px-10 rounded-xl text-xs shadow-lg gap-2">
                      <Search className="h-4 w-4" /> LOCALIZAR
                   </Button>
                </div>
             </Card>

             {/* KPIs de Resumen */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 shrink-0">
                {[ 
                  { l: 'Registradas', v: '0', i: Building2, c: 'text-blue-600', b: 'bg-blue-50' }, 
                  { l: 'Directores', v: '0', i: Users, c: 'text-emerald-600', b: 'bg-emerald-50' }, 
                  { l: 'Municipios', v: '0', i: MapPin, c: 'text-orange-500', b: 'bg-orange-50' }, 
                  { l: 'Auditados', v: '0', i: FileText, c: 'text-indigo-600', b: 'bg-indigo-50' } 
                ].map((k, i) => (
                  <Card key={i} className="rounded-2xl border-none shadow-md bg-white p-6 flex flex-col items-center gap-3 animate-in slide-in-from-right duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", k.b, k.c)}><k.i className="h-6 w-6" /></div>
                    <h4 className="text-2xl font-black">{k.v}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{k.l}</p>
                  </Card>
                ))}
             </div>

             {/* Vista Previa de Escuela */}
             <div className="flex-1 min-h-0 bg-white rounded-[2.5rem] overflow-hidden relative shadow-inner border-2 border-slate-50 flex">
                <div className="w-1/3 border-r p-8 bg-slate-50/30 space-y-6">
                   <div className="h-40 w-full rounded-2xl bg-slate-200 animate-pulse flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-slate-300" />
                   </div>
                   <div className="space-y-4">
                      <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse" />
                      <div className="h-3 bg-slate-100 rounded w-2/3 animate-pulse" />
                   </div>
                </div>
                <div className="flex-1 relative">
                   <Image src="https://picsum.photos/seed/edomexsch/1200/900" alt="Vista del Plantel" fill className="object-cover opacity-40 grayscale" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="p-10 bg-white/90 backdrop-blur-md rounded-[3rem] shadow-2xl border text-center space-y-4 max-w-md">
                         <Monitor className="h-16 w-16 text-primary mx-auto opacity-20" />
                         <h3 className="text-xl font-black uppercase text-slate-400 tracking-tighter">CENTRO DE EXPLORACIÓN ESCOLAR</h3>
                         <p className="text-[10px] font-bold uppercase text-slate-400">Ingrese un CCT para visualizar la ficha técnica e identidad del plantel federalizado</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          /* ATRES - CALL CENTER TÉCNICO PRO */
          <div className="flex h-full w-full bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-slate-50 animate-in zoom-in-95 duration-500">
             {/* 1. Sidebar Táctico */}
             <aside className="w-16 bg-[#0b4135] flex flex-col items-center py-6 gap-6 shrink-0 border-r border-white/5">
                <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400 shadow-inner">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="flex-1 flex flex-col gap-4">
                   {[ 
                     { id: 'chat', icon: MessageSquare, label: 'Buzón' }, 
                     { id: 'remote', icon: Monitor, label: 'Remoto' }, 
                     { id: 'files', icon: FileUp, label: 'Archivos' },
                     { id: 'stats', icon: Activity, label: 'Métricas' }
                   ].map(item => (
                     <button 
                       key={item.id} 
                       onClick={() => setAtresView(item.id as any)}
                       className={cn("h-11 w-11 rounded-2xl flex items-center justify-center transition-all group relative", atresView === item.id ? "bg-emerald-500 text-white shadow-lg" : "text-white/30 hover:bg-white/5 hover:text-white")}
                     >
                       <item.icon className="h-5 w-5" />
                       {item.id === 'chat' && queue.filter(q => q.status === 'pending').length > 0 && (
                          <div className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 rounded-full border-2 border-[#0b4135] flex items-center justify-center text-[8px] font-black text-white">{queue.filter(q => q.status === 'pending').length}</div>
                       )}
                     </button>
                   ))}
                </div>
                <button className="h-11 w-11 rounded-2xl flex items-center justify-center text-white/30 hover:text-white transition-all"><Settings className="h-5 w-5" /></button>
             </aside>

             {/* 2. Lista de Sesiones / Chats */}
             <div className="w-80 bg-slate-50 border-r border-slate-100 flex flex-col shrink-0">
                <div className="p-6 bg-white border-b space-y-4">
                   <div className="flex items-center justify-between">
                      <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Cola Soporte</h2>
                      <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] px-2 h-5">{queue.length}</Badge>
                   </div>
                   <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
                      <Input placeholder="FILTRAR CASO..." className="h-9 pl-9 rounded-xl bg-slate-50 border-none shadow-inner text-[10px] font-bold uppercase" />
                   </div>
                </div>
                <ScrollArea className="flex-1">
                   <div className="p-2 space-y-1">
                     {queue.map((req) => (
                       <button 
                         key={req.id} 
                         onClick={() => setSelectedRequest(req)}
                         className={cn("w-full p-4 rounded-3xl text-left transition-all flex items-center gap-4 border-2 group relative", selectedRequest?.id === req.id ? "bg-white border-emerald-500 shadow-xl scale-[1.02]" : "bg-transparent border-transparent hover:bg-white/80")}
                       >
                          <div className="relative shrink-0">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                              <AvatarFallback className="bg-slate-200 text-slate-500 font-black text-xs">{req.userName?.slice(0, 2) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className={cn("absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white shadow-sm", req.status === 'pending' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500')} />
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-center mb-0.5">
                                <span className="text-[12px] font-black text-slate-700 uppercase truncate">{req.userName}</span>
                                <span className="text-[8px] font-black text-slate-300 font-mono">#{req.id.split('-').at(-1)}</span>
                             </div>
                             <p className="text-[10px] font-semibold text-slate-400 truncate uppercase">{req.lastMessage || 'Nueva conexión...'}</p>
                          </div>
                       </button>
                     ))}
                   </div>
                </ScrollArea>
                <div className="p-6 bg-white border-t space-y-3">
                   <div className="flex justify-between items-center"><span className="text-[9px] font-black text-slate-400 uppercase">Capacidad Agente</span><span className="text-[9px] font-black text-emerald-600">85%</span></div>
                   <Progress value={85} className="h-1.5 bg-slate-100" />
                </div>
             </div>

             {/* 3. Panel Operativo Central */}
             <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden">
                {selectedRequest ? (
                  <>
                    <header className="h-16 bg-white border-b px-8 flex items-center justify-between shrink-0 shadow-sm z-30">
                       <div className="flex items-center gap-5">
                          <div className="flex flex-col">
                             <h3 className="text-sm font-black text-slate-800 uppercase leading-none">{selectedRequest.userName}</h3>
                             <div className="flex items-center gap-2 mt-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">En línea • {selectedRequest.deviceInfo?.os || 'Windows 11'}</span>
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <Button onClick={() => setAtresView('remote')} variant={atresView === 'remote' ? 'default' : 'outline'} className="h-9 px-4 rounded-xl text-[10px] font-black gap-2"><Monitor className="h-4 w-4" /> REMOTO</Button>
                          <Button onClick={() => setAtresView('chat')} variant={atresView === 'chat' ? 'default' : 'outline'} className="h-9 px-4 rounded-xl text-[10px] font-black gap-2"><MessageSquare className="h-4 w-4" /> CHAT</Button>
                          <div className="h-6 w-px bg-slate-100 mx-2" />
                          <Button variant="ghost" className="h-9 w-9 p-0 text-rose-500 hover:bg-rose-50"><Power className="h-4 w-4" /></Button>
                          <Button variant="ghost" className="h-9 w-9 p-0 text-amber-500 hover:bg-amber-50"><Lock className="h-4 w-4" /></Button>
                       </div>
                    </header>

                    <div className="flex-1 flex overflow-hidden">
                       <div className="flex-1 flex flex-col overflow-hidden">
                          {atresView === 'remote' ? (
                            <div className="flex-1 p-6 flex flex-col">
                               <div className="flex-1 bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 shadow-2xl relative overflow-hidden group">
                                  <Image src="https://picsum.photos/seed/desktop/1200/800" alt="Remote" fill className="object-cover opacity-60" />
                                  <div className="absolute inset-0 bg-black/20" />
                                  <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md p-5 rounded-[2rem] shadow-2xl space-y-4 border">
                                     <h4 className="text-[10px] font-black uppercase flex items-center gap-2 border-b pb-2"><Activity className="h-4 w-4 text-emerald-500" /> Rendimiento</h4>
                                     <div className="space-y-3">
                                        <div className="space-y-1.5"><div className="flex justify-between text-[8px] font-black text-slate-400"><span>CPU</span><span>14%</span></div><Progress value={14} className="h-1" /></div>
                                        <div className="space-y-1.5"><div className="flex justify-between text-[8px] font-black text-slate-400"><span>RAM</span><span>4.2 GB</span></div><Progress value={40} className="h-1" /></div>
                                     </div>
                                  </div>
                                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4">
                                     <Button className="bg-slate-800 text-white rounded-2xl h-14 px-8 font-black gap-3 shadow-2xl hover:scale-105 transition-transform"><Terminal className="h-5 w-5" /> TERMINAL</Button>
                                     <Button className="bg-slate-800 text-white rounded-2xl h-14 px-8 font-black gap-3 shadow-2xl hover:scale-105 transition-transform"><LayoutGrid className="h-5 w-5" /> PROCESOS</Button>
                                  </div>
                               </div>
                            </div>
                          ) : (
                            <>
                              <ScrollArea className="flex-1 px-10 py-10 bg-[#efe7dd] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                                 <div className="max-w-4xl mx-auto space-y-4 flex flex-col">
                                    {messages.map((msg, i) => (
                                      <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2", msg.role === 'tech' ? "justify-end" : "justify-start")}>
                                        <div className={cn("max-w-[75%] p-5 rounded-[1.8rem] text-sm font-semibold shadow-lg", msg.role === 'tech' ? "bg-[#e7ffdb] border-emerald-100 rounded-tr-none" : "bg-white border-slate-200 rounded-tl-none")}>
                                           <p className="whitespace-pre-wrap leading-relaxed text-slate-800">{msg.content}</p>
                                           <div className="text-[8px] font-black uppercase opacity-30 text-right mt-2">{msg.timestamp?.seconds ? format(new Date(msg.timestamp.seconds * 1000), 'HH:mm') : '...'}</div>
                                        </div>
                                      </div>
                                    ))}
                                    <div ref={scrollRef} />
                                 </div>
                              </ScrollArea>
                              <footer className="p-6 bg-white border-t shrink-0">
                                 <div className="max-w-4xl mx-auto flex items-center gap-4">
                                    <button className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-emerald-500 flex items-center justify-center transition-all"><Paperclip className="h-5 w-5" /></button>
                                    <Input 
                                      placeholder="ESCRIBIR RESPUESTA TÉCNICA..." 
                                      className="h-12 rounded-2xl bg-slate-50 border-none shadow-inner px-6 font-bold text-sm uppercase focus:ring-2 focus:ring-emerald-500/20" 
                                      value={chatInput} 
                                      onChange={e => setChatInput(e.target.value)} 
                                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <Button onClick={handleSendMessage} className="bg-[#128c7e] hover:bg-[#075e54] h-12 w-12 rounded-2xl shadow-xl p-0 shrink-0"><Send className="h-5 w-5" /></Button>
                                 </div>
                              </footer>
                            </>
                          )}
                       </div>

                       {/* Panel de Info / Notas */}
                       <aside className="w-80 bg-white border-l border-slate-100 flex flex-col shrink-0">
                          <ScrollArea className="flex-1">
                             <div className="p-6 space-y-10">
                                <div className="space-y-6">
                                   <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><HardDrive className="h-4 w-4 text-primary" /> Info Dispositivo</h4>
                                   <div className="space-y-4 bg-slate-50 p-4 rounded-2xl">
                                      <div className="flex justify-between"><span className="text-[10px] font-bold text-slate-500 uppercase">Procesador</span><span className="text-[10px] font-black text-slate-700">i7 12TH GEN</span></div>
                                      <div className="flex justify-between"><span className="text-[10px] font-bold text-slate-500 uppercase">RAM</span><span className="text-[10px] font-black text-slate-700">16 GB DDR4</span></div>
                                      <div className="flex justify-between"><span className="text-[10px] font-bold text-slate-500 uppercase">IP Pública</span><span className="text-[10px] font-black text-primary">192.168.1.104</span></div>
                                   </div>
                                </div>

                                <div className="space-y-6 pt-6 border-t">
                                   <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Navigation className="h-4 w-4 text-primary" /> Ubicación CCT</h4>
                                   <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border">
                                      <p className="text-[10px] font-black text-slate-700 uppercase leading-none">ESC. SEC. FED. 115</p>
                                      <Badge className="bg-primary/5 text-primary border-none text-[8px] font-black mt-2">CCT: 15DES0001R</Badge>
                                   </div>
                                </div>

                                <div className="space-y-6 pt-6 border-t">
                                   <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> Notas Técnicas</h4>
                                   <Textarea className="min-h-[150px] rounded-2xl bg-slate-50 border-none p-4 text-[10px] font-semibold uppercase shadow-inner" placeholder="DOCUMENTAR SESIÓN..." />
                                </div>
                             </div>
                          </ScrollArea>
                          <div className="p-6 bg-slate-50 border-t flex flex-col gap-3">
                             <Button className="w-full bg-[#B38E5D] text-white rounded-xl h-11 text-[10px] font-black gap-2 shadow-lg"><FileUp className="h-4 w-4" /> ENVIAR ARCHIVO</Button>
                             <Button variant="outline" className="w-full border-rose-200 text-rose-600 rounded-xl h-11 text-[10px] font-black gap-2 hover:bg-rose-50"><X className="h-4 w-4" /> CERRAR CASO</Button>
                          </div>
                       </aside>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-30">
                     <div className="h-40 w-40 rounded-full bg-slate-200 flex items-center justify-center mb-10 shadow-inner border-4 border-white animate-pulse">
                        <Laptop className="h-20 w-20 text-slate-400" />
                     </div>
                     <h3 className="text-3xl font-black uppercase text-slate-800 tracking-tighter">CENTRAL TÁCTICA ATRES</h3>
                     <p className="text-sm font-bold uppercase tracking-[0.4em] text-slate-500 mt-6 border-y border-slate-300 py-3 px-10 text-center">Seleccione una sesión del buzón para iniciar el soporte técnico en vivo</p>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>

      {/* DIÁLOGO DE GESTIÓN TÉCNICA (GLOBAL) */}
      <Dialog open={isDialogOpen} onOpenChange={(o) => { if(!isSaving) setIsDialogOpen(o); if(!o) resetForm(); }}>
        <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white">
          <DialogHeader className="p-8 bg-primary text-white shrink-0">
             <DialogTitle className="font-black text-2xl uppercase flex items-center gap-4">
                <Settings className="h-8 w-8 text-accent" /> Gestión Técnica: {activeTab}
             </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
             <ScrollArea className="h-full p-10">
                <div className="space-y-10 max-w-4xl mx-auto">
                   {/* Identificación CCT */}
                   <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-primary/10 shadow-inner space-y-6">
                      <Label className="text-[11px] font-black text-primary uppercase pl-2">Identificación del Centro de Trabajo</Label>
                      <div className="relative">
                         <Search className="absolute left-4 top-4.5 h-5 w-5 text-slate-300" />
                         <Input 
                           placeholder="BUSCAR CCT O NOMBRE..." 
                           className="h-14 rounded-2xl bg-white border-primary/20 font-bold text-xl uppercase shadow-lg pl-12" 
                           value={dialogSearchTerm} 
                           onChange={(e) => { setDialogSearchTerm(e.target.value); handleCctChange(e.target.value); setShowSearchResults(true); }} 
                         />
                         {showSearchResults && dialogSearchTerm.length > 2 && (
                           <div className="absolute top-16 left-0 right-0 max-h-60 overflow-auto bg-white border rounded-2xl shadow-2xl z-[100] divide-y">
                             {schoolSearchResults.map((s, i) => (
                               <div key={i} className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center group" onClick={() => handleCctChange(s.cct)}>
                                 <div className="flex flex-col"><span className="text-sm font-bold uppercase truncate group-hover:text-primary">{s.nombre}</span><span className="text-[10px] font-mono text-muted-foreground">{s.cct} • {s.municipio}</span></div>
                                 <ChevronRight className="h-5 w-5 text-slate-300" />
                               </div>
                             ))}
                             {schoolSearchResults.length === 0 && (
                               <div className="p-6 text-center">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">CCT no registrado en la base maestra</p>
                                  <Button onClick={() => setIsQuickAddOpen(true)} variant="outline" className="h-10 px-6 rounded-xl text-[9px] font-black uppercase border-primary/20 text-primary hover:bg-primary/5">
                                     <Plus className="h-4 w-4 mr-2" /> Alta Rápida de Plantel
                                  </Button>
                               </div>
                             )}
                           </div>
                         )}
                      </div>
                      {formData.cct && (
                        <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 animate-in zoom-in-95">
                           <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm"><School className="h-6 w-6" /></div>
                           <div><h5 className="text-sm font-black text-emerald-800 uppercase">{formData.schoolName}</h5><p className="text-[10px] font-mono text-emerald-600 font-bold">{formData.cct} • {formData.municipio} • ZE: {formData.zonaEscolar}</p></div>
                        </div>
                      )}
                   </div>

                   {/* Campos Específicos por Rubro */}
                   {activeTab === 'Biblioteca Digital' && (
                     <div className="space-y-10 animate-in fade-in duration-500">
                        <div className="grid grid-cols-2 gap-8 bg-slate-50 p-6 rounded-3xl border border-primary/5 shadow-inner">
                           <div className="space-y-2">
                              <Label className="text-[11px] font-black text-primary uppercase pl-2">Equipos Habilitados</Label>
                              <Input type="number" className="h-14 font-black text-2xl text-center bg-white border-none rounded-2xl shadow-sm" value={formData.bibliotecaFases?.equiposHabilitados || 0} onChange={e => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, equiposHabilitados: parseInt(e.target.value) || 0}})} />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[11px] font-black text-primary uppercase pl-2">Personal Capacitado</Label>
                              <Input type="number" className="h-14 font-black text-2xl text-center bg-white border-none rounded-2xl shadow-sm" value={formData.bibliotecaFases?.personalCapacitado || 0} onChange={e => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, personalCapacitado: parseInt(e.target.value) || 0}})} />
                           </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {BIBLIOTECA_FASES_LABELS.map(f => (
                             <div key={f.id} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 hover:border-primary/30 transition-all cursor-pointer shadow-sm" onClick={() => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, [f.id]: !(formData.bibliotecaFases as any)?.[f.id]}})}>
                                <Checkbox checked={(formData.bibliotecaFases as any)?.[f.id]} onCheckedChange={() => {}} id={`check-${f.id}`} className="h-5 w-5" />
                                <Label htmlFor={`check-${f.id}`} className="text-[9px] font-bold text-slate-600 uppercase cursor-pointer leading-tight">{f.label}</Label>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}

                   <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 pl-2 uppercase">Observaciones Operativas</Label>
                      <Textarea value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value.toUpperCase()})} className="min-h-[140px] bg-slate-50 border-none rounded-[2rem] p-8 font-bold uppercase shadow-inner text-xs focus:bg-white transition-all" placeholder="NOTAS DE AUDITORÍA..." />
                   </div>
                </div>
             </ScrollArea>
          </div>

          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4 shadow-inner shrink-0">
             <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-12 px-8 text-xs font-bold uppercase text-slate-400">CANCELAR</Button>
             <Button onClick={handleSave} className="btn-institutional h-12 px-16 text-xs shadow-2xl flex items-center gap-3">
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} GUARDAR REGISTRO
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE ALTA RÁPIDA CCT */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-[#B38E5D] text-white shrink-0">
            <DialogTitle className="uppercase font-black text-lg flex items-center gap-3"><PlusCircle className="h-6 w-6" /> Registro de Nuevo CCT</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase">CCT (10 Dígitos)</Label><Input value={quickAddForm.cct} onChange={e => setQuickAddForm({...quickAddForm, cct: e.target.value.toUpperCase()})} maxLength={10} className="font-mono font-black" /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Nombre del Plantel</Label><Input value={quickAddForm.nombre} onChange={e => setQuickAddForm({...quickAddForm, nombre: e.target.value.toUpperCase()})} className="font-black" /></div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Municipio</Label><Input value={quickAddForm.municipio} onChange={e => setQuickAddForm({...quickAddForm, municipio: e.target.value.toUpperCase()})} /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Valle</Label><Select value={quickAddForm.valle} onValueChange={v => setQuickAddForm({...quickAddForm, valle: v})}><SelectTrigger className="font-bold"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MEXICO">MÉXICO</SelectItem><SelectItem value="TOLUCA">TOLUCA</SelectItem></SelectContent></Select></div>
             </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-3"><Button variant="ghost" onClick={() => setIsQuickAddOpen(false)} className="h-12 px-8 text-[10px] font-black uppercase">Cancelar</Button><Button onClick={handleQuickAddCct} className="btn-institutional bg-[#B38E5D] h-12 px-12 rounded-xl text-[10px] font-black uppercase">Registrar Plantel</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
