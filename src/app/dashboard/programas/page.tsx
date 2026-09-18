
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  ShieldCheck,
  UserCheck,
  MapPin,
  ClipboardCheck,
  X,
  Building2,
  Eye,
  History,
  Navigation,
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
  LayoutGrid,
  Phone,
  MonitorCheck,
  Server,
  QrCode,
  MessageSquare,
  Clock,
  HardDrive,
  FileUp,
  Laptop,
  Send,
  Users,
  GraduationCap,
  AlertCircle,
  BarChart3,
  Globe,
  Info,
  PieChart as PieChartIcon
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

const BIBLIOTECA_FASES_LABELS = [
  { id: 'fase1', label: 'Fase 1. Solicitud de instalación de biblioteca digital', progress: 11 },
  { id: 'fase2', label: 'Fase 2. Atención al CCT', progress: 22 },
  { id: 'fase3', label: 'Fase 3. Diagnóstico del equipo de cómputo existente', progress: 33 },
  { id: 'fase4', label: 'Fase 4. Instalación total de los contenidos del proyecto', progress: 44 },
  { id: 'fase5', label: 'Fase 5. Funcionalidad (pruebas de uso y manejo)', progress: 56 },
  { id: 'fase6', label: 'Fase 6. Guía orientación de uso y manejo de la herramienta', progress: 67 },
  { id: 'fase7', label: 'Fase 7. Seguimiento técnico al CCT', progress: 78 },
  { id: 'fase8', label: 'Fase 8. Total de personal capacitado', progress: 89 },
  { id: 'fase9', label: 'Fase 9. Total de equipos habilitados', progress: 100 }
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
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  
  // Cuentas States
  const [userPart, setUserPart] = useState('')
  const [domainPart, setDomainPart] = useState(DOMINIOS[0])
  const [verifyEmail, setVerifyEmail] = useState('')

  // ATRES State
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
  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([])
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
      setRecords(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as ProgramStatus[])
    })
    
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
      valle: (quickAddForm.valle || 'MEXICO').toUpperCase(),
      region: (quickAddForm.region || '').toUpperCase(),
      zonaEscolar: (quickAddForm.zonaEscolar || '').toUpperCase(),
      sector: (quickAddForm.sector || '').toUpperCase(),
      modalidad: (quickAddForm.modalidad || 'DES').toUpperCase()
    };
    const updated = [newSchool, ...allSchools];
    setAllSchools(updated);
    localStorage.setItem('schools_master_full_v21', JSON.stringify(updated));
    handleCctChange(newSchool.cct);
    setIsQuickAddOpen(false);
    setDialogSearchTerm('');
    toast({ title: "Plantel Registrado" });
  }

  const handleSave = () => {
    setIsSaving(true);
    const body: any = { 
      name: activeTab,
      userName: formData.userName || '',
      departamento: formData.departamento || '',
      cct: formData.cct || '',
      schoolName: formData.schoolName || '',
      municipio: formData.municipio || '',
      valle: formData.valle || '',
      region: formData.region || '',
      zonaEscolar: formData.zonaEscolar || '',
      sector: formData.sector || '',
      modalidad: formData.modalidad || '',
      progress: formData.progress || 0,
      status: formData.status || 'activo',
      date: formData.date || new Date().toISOString().split('T')[0],
      email: activeTab === 'Cuentas Institucionales' ? `${userPart.toLowerCase().trim()}${domainPart}` : formData.email || '',
      latitud: formData.latitud || '',
      longitud: formData.longitud || '',
      observaciones: formData.observaciones || '',
      bibliotecaFases: formData.bibliotecaFases || null,
      updatedAt: serverTimestamp() 
    };

    const cleanup = () => {
      setIsSaving(false);
      resetForm();
      setIsDialogOpen(false);
    }

    if (editingId) {
      updateDoc(doc(db, 'programs', editingId), body)
        .then(() => { toast({ title: "Registro Actualizado" }); })
      cleanup();
    } else {
      addDoc(collection(db, 'programs'), { ...body, createdAt: serverTimestamp() })
        .then(() => { toast({ title: "Registro Guardado" }); })
      cleanup();
    }
  }

  const resetForm = () => { 
    setFormData(initialFormState); 
    setEditingId(null); 
    setUserPart(''); 
    setDomainPart(DOMINIOS[0]); 
    setDialogSearchTerm('');
  }

  const handleEdit = (rec: ProgramStatus) => { 
    setFormData({...rec}); 
    setEditingId(rec.id!); 
    if (rec.name === 'Cuentas Institucionales') { 
      setUserPart(rec.email?.split('@')[0] || ''); 
      setDomainPart('@' + (rec.email?.split('@')[1] || 'coees.edu.mx')); 
    } 
    setIsDialogOpen(true);
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Eliminar registro?")) deleteDoc(doc(db, 'programs', id));
  }

  const handleSendMessage = () => {
    if (!chatInput.trim() || !selectedRequest) return;
    setDoc(doc(db, 'support_queue', selectedRequest.id), { 
      lastActivity: serverTimestamp(), 
      lastMessage: chatInput.substring(0, 50), 
      status: 'attending' 
    }, { merge: true });
    addDoc(collection(db, 'chat_messages'), { 
      chatId: selectedRequest.id, 
      role: 'tech', 
      content: chatInput, 
      timestamp: serverTimestamp(), 
      senderName: localStorage.getItem('userRfc') || 'ANALISTA' 
    });
    setChatInput('');
  };

  const schoolSearchResults = useMemo(() => {
    if (!dialogSearchTerm || dialogSearchTerm.length < 3) return [];
    const term = dialogSearchTerm.toUpperCase();
    return allSchools.filter(s => s.cct.includes(term) || s.nombre.includes(term)).slice(0, 5);
  }, [allSchools, dialogSearchTerm]);

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 w-full min-h-screen flex flex-col">
      <div className="shrink-0 space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black text-primary leading-none uppercase">Módulos Técnicos COEES</h2>
            <p className="text-xs font-bold text-slate-800 uppercase tracking-widest mt-1">Auditoría Institucional 2026</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {['Cuentas Institucionales', 'Biblioteca Digital', 'Geoposición', 'Conoce mi Escuela', 'ATRES'].map(rubro => (
            <button 
              key={rubro} 
              onClick={() => { setActiveTab(rubro); resetForm(); }}
              className={cn(
                "px-6 h-10 text-[10px] font-black rounded-xl transition-all border shadow-sm uppercase tracking-wider", 
                activeTab === rubro ? "bg-primary text-white border-primary shadow-xl" : "bg-white text-primary border-primary/20 hover:bg-slate-50"
              )}
            >
              {rubro}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === 'Cuentas Institucionales' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full animate-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-10 flex flex-col space-y-8">
               <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-3xl bg-primary text-white flex items-center justify-center shadow-2xl"><Mail className="h-9 w-9" /></div>
                  <div><h3 className="text-2xl font-black uppercase text-primary leading-none">Registro Técnico</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Creación y Restructuración de Cuentas</p></div>
               </div>
               <div className="space-y-6 flex-1">
                  <div className="space-y-2"><Label className="text-[10px] font-black text-slate-500 uppercase pl-1">Servidor Público *</Label><Input className="h-12 rounded-xl bg-slate-50 border-none shadow-inner uppercase font-bold" value={formData.userName} onChange={e => setFormData({...formData, userName: e.target.value.toUpperCase()})} /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black text-slate-500 uppercase pl-1">Departamento / Área *</Label><Input className="h-12 rounded-xl bg-slate-50 border-none shadow-inner uppercase font-bold" value={formData.departamento} onChange={e => setFormData({...formData, departamento: e.target.value.toUpperCase()})} /></div>
                  <div className="space-y-4">
                     <Label className="text-[10px] font-black text-primary uppercase pl-1">Constructor de Correo</Label>
                     <div className="flex gap-2"><Input className="h-11 rounded-xl bg-slate-50 border-none shadow-inner text-xs font-bold flex-1" value={userPart} onChange={e => setUserPart(e.target.value)} /><Select value={domainPart} onValueChange={setDomainPart}><SelectTrigger className="h-11 rounded-xl w-48 bg-slate-50 border-none font-black text-xs"><SelectValue /></SelectTrigger><SelectContent className="z-[300]">{DOMINIOS.map(d => <SelectItem key={d} value={d} className="font-black text-[10px]">{d}</SelectItem>)}</SelectContent></Select></div>
                     <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Vista previa:</p><p className={cn("text-xs font-black uppercase", userPart ? "text-primary" : "text-rose-600")}>{userPart ? `${userPart.toLowerCase()}${domainPart}` : 'esperando datos...'}</p></div>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4"><Button onClick={handleSave} disabled={isSaving || !userPart} className="btn-institutional h-14 rounded-2xl text-[11px] gap-3 shadow-2xl">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5" />} GUARDAR</Button><Button variant="outline" onClick={resetForm} className="h-14 rounded-2xl border-slate-200 text-slate-500 font-black text-[11px] gap-2 uppercase hover:bg-slate-50"><RotateCcw className="h-4 w-4" /> LIMPIAR</Button></div>
            </Card>
            <div className="flex flex-col gap-8 h-full">
               <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8 space-y-4 shrink-0"><div className="flex items-center gap-4"><CheckCircle2 className="h-5 w-5 text-emerald-500" /><div><h4 className="text-sm font-black uppercase text-slate-700">Verificar Existencia</h4></div></div><div className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" /><Input className="h-9 pl-9 rounded-xl bg-slate-50 text-[10px] font-bold" value={verifyEmail} onChange={e => setVerifyEmail(e.target.value)} /></div><Button className="bg-emerald-600 h-9 px-6 rounded-xl text-[9px] uppercase font-black">Validar</Button></div></Card>
               <Card className="border-none shadow-xl rounded-[2.5rem] bg-white flex flex-col flex-1 overflow-hidden"><div className="p-8 border-b bg-slate-50/50 flex items-center gap-3"><Archive className="h-5 w-5 text-primary" /><h4 className="text-sm font-black uppercase tracking-widest text-slate-700">Historial</h4></div><ScrollArea className="flex-1"><Table><TableHeader className="bg-slate-50 sticky top-0"><TableRow><TableHead className="pl-8 text-[9px] font-black uppercase">Responsable</TableHead><TableHead className="text-[9px] font-black uppercase">Correo</TableHead><TableHead className="text-right pr-10"></TableHead></TableRow></TableHeader><TableBody>{records.filter(r => r.name === 'Cuentas Institucionales').map(rec => (<TableRow key={rec.id} className="h-16 border-b border-slate-50 hover:bg-slate-50/50 transition-colors"><TableCell className="pl-8 font-black text-xs uppercase">{rec.userName}</TableCell><TableCell className="font-mono text-[10px] text-primary">{rec.email}</TableCell><TableCell className="text-right pr-8"><div className="flex justify-end gap-1"><button onClick={() => handleEdit(rec)} className="h-8 w-8 text-primary/40 hover:text-primary transition-all"><Eye className="h-4 w-4" /></button><button onClick={() => handleDelete(rec.id!)} className="h-8 w-8 text-rose-300 hover:text-rose-600 transition-all"><Trash2 className="h-4 w-4" /></button></div></TableCell></TableRow>))}</TableBody></Table></ScrollArea></Card>
            </div>
          </div>
        ) : activeTab === 'Biblioteca Digital' ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {[
                  { label: 'CCT REGISTRADOS', value: records.filter(r => r.name === 'Biblioteca Digital').length, icon: Building2, bg: 'bg-blue-50', color: 'text-blue-600' },
                  { label: 'VISITAS TOTALES', value: 0, icon: Users, bg: 'bg-emerald-50', color: 'text-emerald-600' },
                  { label: 'EVIDENCIAS', value: 0, icon: ImageIcon, bg: 'bg-orange-50', color: 'text-orange-500' },
                  { label: 'CONCLUIDOS', value: 0, icon: TrendingUp, bg: 'bg-rose-50', color: 'text-rose-600' },
                  { label: 'PENDIENTES', value: 0, icon: AlertCircle, bg: 'bg-amber-50', color: 'text-amber-500' },
                  { label: 'CAPACITADOS', value: 0, icon: GraduationCap, bg: 'bg-indigo-50', color: 'text-indigo-600' }
                ].map((k, i) => (
                  <Card key={i} className="border-none shadow-sm rounded-2xl p-4 bg-white flex items-center gap-4">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", k.bg, k.color)}><k.icon className="h-5 w-5" /></div>
                    <div><p className="text-[8px] font-black text-slate-400 uppercase">{k.label}</p><h4 className="text-lg font-black">{k.value}</h4></div>
                  </Card>
                ))}
             </div>

             <Card className="p-4 bg-white/80 border-none shadow-lg rounded-2xl">
                <div className="flex gap-4"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" /><Input placeholder="BUSCAR CCT..." className="h-9 pl-10 rounded-xl bg-slate-50 border-none text-[10px]" /></div><Select defaultValue="all"><SelectTrigger className="h-9 w-40 text-[10px] font-bold"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="all">TODOS</SelectItem></SelectContent></Select><Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="btn-institutional h-9 px-6 text-[9px] uppercase shadow-lg"><Plus className="h-3 w-3 mr-2" /> NUEVO REGISTRO</Button></div>
             </Card>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-8 border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col min-h-[450px]">
                   <div className="p-6 border-b bg-slate-50/50 flex items-center gap-3"><Monitor className="h-5 w-5 text-primary" /><h3 className="text-sm font-black uppercase text-slate-700">Fase del proyecto por CCT</h3></div>
                   <ScrollArea className="flex-1">
                      <Table>
                         <TableHeader className="bg-slate-50"><TableRow><TableHead className="pl-8 text-[9px] font-black">CCT / PLANTEL</TableHead><TableHead className="text-[9px] font-black">PROGRESO</TableHead><TableHead className="text-[9px] font-black">ESTATUS</TableHead><TableHead className="text-right pr-10"></TableHead></TableRow></TableHeader>
                         <TableBody>
                            {records.filter(r => r.name === 'Biblioteca Digital').map(rec => (
                              <TableRow key={rec.id} className="h-16 hover:bg-slate-50 transition-colors">
                                 <TableCell className="pl-8"><div className="flex flex-col"><span className="text-xs font-black uppercase">{rec.schoolName}</span><span className="text-[9px] font-mono text-primary">{rec.cct}</span></div></TableCell>
                                 <TableCell className="w-48"><div className="space-y-1"><div className="flex justify-between text-[8px] font-black"><span>{rec.progress}%</span></div><Progress value={rec.progress} className="h-1" /></div></TableCell>
                                 <TableCell><Badge variant="outline" className="text-[8px] font-black uppercase h-5 px-2 border-primary/20 text-primary">{rec.status}</Badge></TableCell>
                                 <TableCell className="text-right pr-8"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => handleEdit(rec)} className="h-8 w-8 rounded-lg text-primary/40 hover:text-primary"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(rec.id!)} className="h-8 w-8 rounded-lg text-rose-300 hover:text-rose-600"><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                              </TableRow>
                            ))}
                         </TableBody>
                      </Table>
                   </ScrollArea>
                </Card>

                <Card className="lg:col-span-4 border-none shadow-xl rounded-[2.5rem] bg-white p-8 flex flex-col space-y-6">
                   <div className="flex items-center gap-3 border-b pb-3"><ClipboardCheck className="h-6 w-6 text-accent" /><h3 className="text-sm font-black uppercase text-slate-800">Bitácora de Avance</h3></div>
                   <ScrollArea className="flex-1">
                      <div className="space-y-4">
                         {BIBLIOTECA_FASES_LABELS.map(f => (
                           <div key={f.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md">
                              <Checkbox id={`bit-${f.id}`} className="h-5 w-5 rounded-md" checked={formData.name === 'Biblioteca Digital' && (formData.bibliotecaFases as any)?.[f.id]} />
                              <div className="flex-1"><Label htmlFor={`bit-${f.id}`} className="text-[10px] font-black uppercase text-slate-600 leading-tight block">{f.label}</Label><span className="text-[8px] font-bold text-slate-400">Impacto: {f.progress}%</span></div>
                           </div>
                         ))}
                      </div>
                   </ScrollArea>
                   <div className="p-4 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-center gap-2"><Info className="h-4 w-4 text-primary" /><p className="text-[8px] font-black text-primary uppercase">Inicie una captura para activar el checklist interactivo de auditoría.</p></div>
                </Card>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
                <Card className="p-6 border-none shadow-xl rounded-[2.5rem] bg-white space-y-4">
                   <h4 className="text-[10px] font-black uppercase text-primary flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Resumen por Meta</h4>
                   <div className="h-48 w-full bg-slate-50 rounded-2xl flex flex-col items-center justify-center opacity-30 gap-3"><MonitorCheck className="h-10 w-10" /><p className="text-[8px] font-black">AUDITORÍA 2026</p></div>
                </Card>
                <Card className="p-6 border-none shadow-xl rounded-[2.5rem] bg-white space-y-4">
                   <h4 className="text-[10px] font-black uppercase text-primary flex items-center gap-2"><PieChartIcon className="h-4 w-4" /> Estatus de Bibliotecas</h4>
                   <div className="h-48 w-full bg-slate-50 rounded-2xl flex flex-col items-center justify-center opacity-30 gap-3"><Archive className="h-10 w-10" /><p className="text-[8px] font-black">CONTROL GLOBAL</p></div>
                </Card>
                <Card className="p-6 border-none shadow-xl rounded-[2.5rem] bg-white space-y-4">
                   <h4 className="text-[10px] font-black uppercase text-primary flex items-center gap-2"><Activity className="h-4 w-4" /> Estadística de Atención</h4>
                   <div className="h-48 w-full bg-slate-50 rounded-2xl flex flex-col items-center justify-center opacity-30 gap-3"><Settings className="h-10 w-10" /><p className="text-[8px] font-black">SOPORTE NIVEL 1</p></div>
                </Card>
             </div>
          </div>
        ) : activeTab === 'Geoposición' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full animate-in slide-in-from-bottom-4 duration-500 min-h-[600px] pb-10">
             <div className="lg:col-span-8 bg-slate-100 rounded-[2.5rem] overflow-hidden relative border-4 border-white shadow-2xl flex flex-col">
                <div className="flex-1 relative">
                   <Image src="https://picsum.photos/seed/geosat/1200/800" alt="Map" fill className="object-cover opacity-60 grayscale" />
                   <div className="absolute top-6 left-6 flex flex-col gap-2">
                      <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-xl flex flex-col border">
                         <button className="h-10 px-6 text-[9px] font-black uppercase hover:bg-slate-50 border-b">MAPA</button>
                         <button className="h-10 px-6 text-[9px] font-black uppercase hover:bg-slate-50">SATELITE</button>
                      </div>
                      <div className="h-10 w-10 bg-white/95 backdrop-blur-md rounded-xl shadow-xl flex items-center justify-center border text-primary">
                         <LocateFixed className="h-5 w-5" />
                      </div>
                   </div>
                </div>
                <div className="bg-white/90 backdrop-blur-md p-6 flex flex-wrap items-center justify-center gap-8 border-t">
                   <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" /><span className="text-[9px] font-black uppercase text-slate-600">EN LÍNEA</span></div>
                   <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" /><span className="text-[9px] font-black uppercase text-slate-600">EN MOVIMIENTO</span></div>
                   <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" /><span className="text-[9px] font-black uppercase text-slate-600">SIN SEÑAL</span></div>
                   <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-slate-400" /><span className="text-[9px] font-black uppercase text-slate-600">DESCONECTADO</span></div>
                </div>
             </div>
             
             <div className="lg:col-span-4 flex flex-col gap-6">
                <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8 space-y-6">
                   <div className="flex items-center gap-4 border-b pb-4"><Navigation className="h-6 w-6 text-accent" /><h3 className="text-lg font-black uppercase text-primary">CAPTURAR UBICACIÓN</h3></div>
                   <div className="space-y-4">
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">CCT *</Label><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" /><Input placeholder="Ej. 15DES0001R" className="h-10 pl-10 rounded-xl bg-slate-50 border-none shadow-inner font-mono font-black uppercase text-primary" value={formData.cct} onChange={e => handleCctChange(e.target.value)} /></div></div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">LATITUD *</Label><div className="relative"><Navigation className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" /><Input placeholder="Ej. 19.4284" className="h-10 pl-10 rounded-xl bg-slate-50 border-none shadow-inner font-mono font-black" value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} /></div></div>
                         <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">LONGITUD *</Label><div className="relative"><MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" /><Input placeholder="Ej. -99.1276" className="h-10 pl-10 rounded-xl bg-slate-50 border-none shadow-inner font-mono font-black" value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} /></div></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2"><Button onClick={handleSave} disabled={isSaving || !formData.cct} className="btn-institutional h-12 rounded-xl text-[10px] gap-2 shadow-xl">{isSaving ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4" />} GUARDAR</Button><Button variant="outline" onClick={resetForm} className="h-12 rounded-xl border-slate-200 text-slate-400 font-black uppercase text-[10px] gap-2 hover:bg-slate-50"><RotateCcw className="h-4 w-4" /> LIMPIAR</Button></div>
                   </div>
                   <div className="p-5 bg-blue-50/50 rounded-2xl border-2 border-dashed border-blue-100 flex gap-4"><Info className="h-6 w-6 text-blue-600 shrink-0" /><p className="text-[9px] font-bold text-blue-800 uppercase leading-relaxed">Asegúrate de ingresar el CCT y las coordenadas en formato decimal (Latitud y Longitud) para registrar correctamente la ubicación de la escuela.</p></div>
                </Card>

                <Card className="border-none shadow-xl rounded-[2.5rem] bg-white flex flex-col flex-1 overflow-hidden min-h-[300px]">
                   <div className="p-6 border-b bg-slate-50/50 flex items-center gap-3"><History className="h-5 w-5 text-primary" /><h4 className="text-xs font-black uppercase tracking-widest text-slate-700">ÚLTIMAS UBICACIONES</h4></div>
                   <ScrollArea className="flex-1">
                      <Table>
                         <TableHeader className="bg-slate-50"><TableRow><TableHead className="pl-6 text-[8px] font-black uppercase">FECHA</TableHead><TableHead className="text-[8px] font-black uppercase">CCT</TableHead><TableHead className="text-[8px] font-black uppercase">ESTATUS</TableHead><TableHead className="text-right pr-6"></TableHead></TableRow></TableHeader>
                         <TableBody>
                            {records.filter(r => r.name === 'Geoposición').slice(0, 10).map(rec => (
                              <TableRow key={rec.id} className="h-12 border-b border-slate-50 hover:bg-slate-50/50 transition-colors"><TableCell className="pl-6 text-[9px] font-bold text-slate-400">{rec.date}</TableCell><TableCell className="font-mono text-[10px] font-black text-primary">{rec.cct}</TableCell><TableCell><Badge variant="outline" className="text-[7px] font-black uppercase border-emerald-200 text-emerald-600 bg-emerald-50 px-1.5 h-4">POSICIÓN OK</Badge></TableCell><TableCell className="text-right pr-6"><button onClick={() => handleDelete(rec.id!)} className="h-7 w-7 text-rose-300 hover:text-rose-600 transition-all"><Trash2 className="h-3.5 w-3.5" /></button></TableCell></TableRow>
                            ))}
                            {records.filter(r => r.name === 'Geoposición').length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-10 opacity-20 text-[10px] font-black uppercase">Sin registros</TableCell></TableRow>}
                         </TableBody>
                      </Table>
                   </ScrollArea>
                </Card>
             </div>
          </div>
        ) : activeTab === 'Conoce mi Escuela' ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
             <Card className="p-6 bg-white/80 border-none shadow-lg rounded-[2.5rem]">
                <div className="flex flex-col md:flex-row items-center gap-6">
                   <div className="space-y-1 w-full md:w-64">
                      <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">BUSCAR POR:</Label>
                      <Select defaultValue="cct"><SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none shadow-inner font-bold text-[10px]"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="cct">CCT</SelectItem><SelectItem value="nombre">NOMBRE</SelectItem><SelectItem value="municipio">MUNICIPIO</SelectItem></SelectContent></Select>
                   </div>
                   <div className="space-y-1 flex-1">
                      <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">IDENTIFICACIÓN:</Label>
                      <div className="relative group">
                         <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
                         <Input placeholder="EJ. 15DES0001R" className="h-10 pl-10 rounded-xl bg-slate-50 border-none shadow-inner text-sm font-black uppercase" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                      </div>
                   </div>
                   <div className="pt-4">
                      <Button className="bg-[#1e40af] hover:bg-blue-900 text-white h-10 px-10 rounded-xl font-black text-[10px] gap-2 shadow-xl"><Search className="h-4 w-4" /> BUSCAR</Button>
                   </div>
                </div>
             </Card>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                   <Card className="border-none shadow-xl rounded-[3rem] overflow-hidden relative min-h-[400px] bg-slate-100 group">
                      <Image src="https://picsum.photos/seed/school-front/1200/600" alt="Escuela" fill className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-6 left-6 flex gap-2">
                         <Badge className="bg-primary text-white border-none font-black text-[9px] h-6 px-3">NUEVO</Badge>
                         <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] h-6 px-3">ACTIVO</Badge>
                      </div>
                      <div className="absolute bottom-10 left-10 right-10">
                         <div className="flex justify-between items-end">
                            <div className="text-white space-y-2">
                               <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Vista Exterior de Plantel</p>
                               <h3 className="text-4xl font-black uppercase leading-none tracking-tighter">ESCUELA SECUNDARIA FEDERALIZADA</h3>
                            </div>
                            <div className="flex items-center gap-4 text-white/60">
                               <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-400" /><span className="text-[9px] font-black uppercase">EN LÍNEA</span></div>
                               <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-slate-400" /><span className="text-[9px] font-black uppercase">SIN SEÑAL</span></div>
                            </div>
                         </div>
                      </div>
                   </Card>

                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'ESCUELAS REGISTRADAS', value: 0, icon: School, color: 'text-blue-600' },
                        { label: 'DIRECTIVOS Y RESPONSABLES', value: 0, icon: UserCheck, color: 'text-emerald-600' },
                        { label: 'MUNICIPIOS', value: 0, icon: MapPin, color: 'text-orange-500' },
                        { label: 'DATOS ACTUALIZADOS', value: 0, icon: ClipboardList, color: 'text-indigo-600' }
                      ].map((k, i) => (
                        <Card key={i} className="border-none shadow-md rounded-[1.8rem] bg-white p-6 flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all">
                           <div className={cn("h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center", k.color)}><k.icon className="h-5 w-5" /></div>
                           <div><h4 className="text-2xl font-black text-slate-800 leading-none">{k.value}</h4><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2">{k.label}</p></div>
                        </Card>
                      ))}
                   </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                   <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8 space-y-8">
                      <div className="flex items-center gap-4 border-b pb-4"><Building2 className="h-7 w-7 text-primary" /><h3 className="text-xl font-black uppercase text-primary">REGISTRAR ESCUELA</h3></div>
                      <div className="space-y-6">
                         <div className="space-y-1.5"><Label className="text-[9px] font-black text-slate-400 uppercase pl-1">CCT *</Label><div className="relative"><School className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" /><Input placeholder="EJ. 15DES0001R" className="h-10 pl-10 rounded-xl bg-slate-50 border-none shadow-inner font-mono font-black uppercase text-primary" value={formData.cct} onChange={e => handleCctChange(e.target.value)} /></div></div>
                         <div className="space-y-1.5"><Label className="text-[9px] font-black text-slate-400 uppercase pl-1">NOMBRE DE LA ESCUELA *</Label><Input placeholder="EJ. ESCUELA SECUNDARIA..." className="h-11 rounded-xl bg-slate-50 border-none shadow-inner font-bold uppercase text-xs" value={formData.schoolName} onChange={e => setFormData({...formData, schoolName: e.target.value.toUpperCase()})} /></div>
                         <div className="grid grid-cols-2 gap-4 pt-4"><Button onClick={handleSave} className="btn-institutional h-12 rounded-xl text-[10px] gap-2 shadow-xl shadow-primary/20"><Save className="h-4 w-4" /> GUARDAR</Button><Button variant="outline" onClick={resetForm} className="h-12 rounded-xl border-slate-200 text-slate-400 font-black uppercase text-[10px] gap-2 hover:bg-slate-50"><RotateCcw className="h-4 w-4" /> LIMPIAR</Button></div>
                      </div>
                   </Card>

                   <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col p-6 space-y-6">
                      <div className="flex items-center gap-4 border-b pb-4"><LayoutGrid className="h-6 w-6 text-accent" /><h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Vista previa de identidad</h4></div>
                      <div className="flex gap-6">
                         <div className="h-24 w-24 rounded-2xl bg-slate-100 overflow-hidden relative shadow-md shrink-0"><Image src="https://picsum.photos/seed/school-thumb/200/200" alt="Thumb" fill className="object-cover" /></div>
                         <div className="flex-1 space-y-4">
                            <div className="flex flex-col"><Badge className="bg-rose-500 text-white border-none text-[8px] font-black w-fit mb-1">CCT: {formData.cct || '15DESXXXXX'}</Badge><h5 className="text-sm font-black text-slate-800 uppercase leading-tight">{formData.schoolName || 'NOMBRE DEL PLANTEL'}</h5></div>
                            <div className="space-y-1.5 border-t pt-3">
                               <div className="flex justify-between items-center"><span className="text-[8px] font-black text-slate-400 uppercase">DIRECTOR:</span><span className="text-[8px] font-bold text-slate-600 uppercase">POR ASIGNAR</span></div>
                               <div className="flex justify-between items-center"><span className="text-[8px] font-black text-slate-400 uppercase">TELEFONO:</span><span className="text-[8px] font-bold text-slate-600 uppercase">S/D</span></div>
                               <div className="flex flex-col mt-2"><span className="text-[7px] font-black text-slate-300 uppercase">UBICACIÓN:</span><span className="text-[8px] font-bold text-slate-500 uppercase leading-none">{formData.municipio || 'SELECCIONAR PLANTEL'}</span></div>
                            </div>
                            <div className="flex gap-4 pt-2 border-t text-slate-300">
                               <Phone className="h-4 w-4 hover:text-primary transition-colors cursor-pointer" /><Mail className="h-4 w-4 hover:text-primary transition-colors cursor-pointer" /><Globe className="h-4 w-4 hover:text-primary transition-colors cursor-pointer" />
                            </div>
                         </div>
                      </div>
                   </Card>
                </div>
             </div>
          </div>
        ) : activeTab === 'ATRES' ? (
          <div className="flex h-full w-full bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-slate-50 animate-in zoom-in-95 min-h-[600px]">
             <aside className="w-16 bg-[#0b4135] flex flex-col items-center py-6 gap-6 shrink-0 border-r border-white/5">
                <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400 shadow-inner"><ShieldCheck className="h-6 w-6" /></div>
                <div className="flex-1 flex flex-col gap-4">
                   {[{id:'chat', icon: MessageSquare}, {id:'remote', icon: Monitor}, {id:'files', icon: FileUp}, {id:'stats', icon: Activity}].map(item => (
                     <button key={item.id} onClick={() => setAtresView(item.id as any)} className={cn("h-11 w-11 rounded-2xl flex items-center justify-center transition-all", atresView === item.id ? "bg-emerald-500 text-white shadow-lg" : "text-white/30 hover:bg-white/5")}><item.icon className="h-5 w-5" /></button>
                   ))}
                </div>
                <button className="h-11 w-11 rounded-2xl flex items-center justify-center text-white/30 hover:text-white"><Settings className="h-5 w-5" /></button>
             </aside>
             <div className="w-80 bg-slate-50 border-r flex flex-col shrink-0">
                <div className="p-6 bg-white border-b space-y-4">
                   <div className="flex items-center justify-between"><h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Sesiones</h2><Badge className="bg-emerald-50 text-emerald-600 border-none">{queue.length}</Badge></div>
                   <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" /><Input placeholder="FILTRAR..." className="h-9 pl-9 rounded-xl bg-slate-50 border-none shadow-inner text-[10px] font-bold uppercase" /></div>
                </div>
                <ScrollArea className="flex-1">
                   <div className="p-2 space-y-1">
                     {queue.map(req => (
                       <button key={req.id} onClick={() => setSelectedRequest(req)} className={cn("w-full p-4 rounded-3xl text-left transition-all flex items-center gap-4 border-2 relative", selectedRequest?.id === req.id ? "bg-white border-emerald-500 shadow-xl" : "bg-transparent border-transparent hover:bg-white/80")}>
                          <Avatar className="h-12 w-12"><AvatarFallback>{req.userName?.slice(0,2) || 'U'}</AvatarFallback></Avatar>
                          <div className="flex-1 min-w-0"><div className="flex justify-between items-center mb-0.5"><span className="text-[12px] font-black text-slate-700 uppercase truncate">{req.userName}</span>{req.status === 'pending' && <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}</div><p className="text-[10px] font-semibold text-slate-400 truncate uppercase">{req.lastMessage || 'Solicitud de soporte...'}</p></div>
                       </button>
                     ))}
                   </div>
                </ScrollArea>
                <div className="p-6 border-t bg-white space-y-4">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><QrCode className="h-4 w-4" /> Compartir Acceso</h4>
                   <div className="p-6 bg-slate-50 rounded-[2rem] flex flex-col items-center gap-4 border-2 border-dashed border-slate-200">
                      <div className="h-24 w-24 bg-white rounded-xl flex items-center justify-center p-2 shadow-lg"><Image src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/helpdesk')}`} alt="QR" width={80} height={80} /></div>
                      <div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase">URL de Atención:</p><p className="text-[8px] font-bold text-primary truncate max-w-[150px] mt-1">/helpdesk</p></div>
                   </div>
                </div>
             </div>
             <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden">
                {selectedRequest ? (
                  <>
                    <header className="h-16 bg-white border-b px-8 flex items-center justify-between shrink-0 shadow-sm z-30">
                       <div className="flex flex-col"><h3 className="text-sm font-black text-slate-800 uppercase">{selectedRequest.userName}</h3><p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">En línea • Soporte Activo</p></div>
                       <div className="flex gap-2"><Button onClick={() => setAtresView('remote')} size="sm" variant={atresView === 'remote' ? 'default' : 'outline'} className="rounded-xl text-[10px] font-black"><Monitor className="h-3 w-3 mr-2" /> REMOTO</Button><Button onClick={() => setAtresView('chat')} size="sm" variant={atresView === 'chat' ? 'default' : 'outline'} className="rounded-xl text-[10px] font-black"><MessageSquare className="h-3 w-3 mr-2" /> CHAT</Button></div>
                    </header>
                    <div className="flex-1 overflow-hidden flex">
                       <div className="flex-1 flex flex-col overflow-hidden">
                          {atresView === 'remote' ? (
                            <div className="flex-1 p-6 relative"><div className="w-full h-full bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 shadow-2xl relative overflow-hidden flex items-center justify-center"><Image src="https://picsum.photos/seed/desktop/1200/800" alt="Remote" fill className="object-cover opacity-50 grayscale" /><div className="z-10 text-center space-y-4"><div className="h-16 w-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse"><Activity className="text-emerald-400 h-8 w-8" /></div><p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Stream seguro de video • 256-bit AES</p></div></div></div>
                          ) : (
                            <><ScrollArea className="flex-1 p-8"><div className="max-w-4xl mx-auto space-y-4 flex flex-col">{messages.map((m, i) => (<div key={i} className={cn("flex w-full", m.role === 'tech' ? "justify-end" : "justify-start")}><div className={cn("max-w-[75%] p-5 rounded-[1.8rem] text-sm font-semibold shadow-lg", m.role === 'tech' ? "bg-emerald-100 border border-emerald-100 rounded-tr-none text-slate-800" : "bg-white border border-slate-200 rounded-tl-none text-slate-800")}><p>{m.content}</p><div className="text-[8px] font-black uppercase opacity-30 text-right mt-2 flex items-center justify-end gap-1"><Clock className="h-2.5 w-2.5" />{m.timestamp?.seconds ? format(new Date(m.timestamp.seconds * 1000), 'HH:mm') : '...'}</div></div></div>))}<div ref={scrollRef}/></div></ScrollArea><footer className="p-4 bg-white border-t flex gap-3 shrink-0"><Input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} className="rounded-2xl bg-slate-50 border-none h-12 px-6 font-bold" placeholder="ESCRIBIR RESPUESTA..." /><Button onClick={handleSendMessage} className="bg-emerald-600 hover:bg-emerald-700 h-12 w-12 rounded-2xl p-0 shadow-xl"><Send className="h-5 w-5" /></Button></footer></>
                          )}
                       </div>
                       <aside className="w-80 bg-white border-l p-6 space-y-8 overflow-y-auto shrink-0 hidden xl:block"><div className="space-y-4"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><HardDrive className="h-4 w-4 text-primary" /> Info Dispositivo</h4><div className="space-y-3 bg-slate-50 p-4 rounded-2xl border"><div className="flex justify-between"><span className="text-[9px] font-bold text-slate-500 uppercase">OS</span><span className="text-[9px] font-black">Windows 11</span></div><div className="flex justify-between"><span className="text-[9px] font-bold text-slate-500 uppercase">RAM</span><span className="text-[9px] font-black">16 GB</span></div><div className="flex justify-between"><span className="text-[9px] font-bold text-slate-500 uppercase">IP</span><span className="text-[9px] font-black font-mono text-primary">192.168.1.104</span></div></div></div><div className="space-y-4 pt-6 border-t"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Navigation className="h-4 w-4 text-primary" /> Ubicación CCT</h4><div className="p-4 bg-slate-50 rounded-2xl space-y-2"><p className="text-[10px] font-black text-slate-700 uppercase leading-none">ESC. SEC. FED. 115</p><p className="text-[9px] font-bold text-slate-400 uppercase">TOLUCA, EDOMÉX</p><Badge className="bg-primary/5 text-primary border-none text-[8px] font-black mt-2">CCT: 15DES0001R</Badge></div></div></aside>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-30 text-center"><Laptop className="h-24 w-24 mb-6 text-slate-400" /><h3 className="text-3xl font-black uppercase text-slate-800 tracking-tighter">Panel de Soporte ATRES</h3><p className="text-xs font-bold uppercase tracking-[0.4em] mt-2">Seleccione una sesión para interactuar</p></div>
                )}
             </div>
          </div>
        ) : null}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[1000px] h-[85vh] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden flex flex-col bg-white">
          <DialogHeader className="p-6 bg-[#9f2241] text-white shrink-0">
             <DialogTitle className="uppercase font-black text-xl flex items-center gap-3"><Settings className="h-7 w-7 text-accent" /> GESTIÓN TÉCNICA: {activeTab.toUpperCase()}</DialogTitle>
             <DialogDescription className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Auditoría y Seguimiento 2026</DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="proyecto" className="flex-1 flex flex-col overflow-hidden">
             <div className="px-8 border-b bg-slate-50/50">
                <TabsList className="bg-transparent h-14 p-0 gap-8">
                  <TabsTrigger value="proyecto" className="rounded-none border-b-4 border-transparent data-[state=active]:border-[#9f2241] data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all">1. DATOS DEL PROYECTO</TabsTrigger>
                  <TabsTrigger value="asistentes" className="rounded-none border-b-4 border-transparent data-[state=active]:border-[#9f2241] data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all">2. LISTA DE ASISTENTES</TabsTrigger>
                </TabsList>
             </div>
             
             <div className="flex-1 overflow-hidden">
                <TabsContent value="proyecto" className="h-full m-0 p-8">
                   <ScrollArea className="h-full">
                      <div className="space-y-10">
                         {/* Bloque de Identificación según imagen */}
                         <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm space-y-6">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">IDENTIFICACIÓN CCT</h4>
                            <div className="max-w-2xl mx-auto space-y-4">
                               <div className="relative group">
                                  <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-300" />
                                  <Input 
                                    value={dialogSearchTerm} 
                                    onChange={e => { setDialogSearchTerm(e.target.value.toUpperCase()); handleCctChange(e.target.value); }} 
                                    className="h-14 bg-white border-2 border-slate-100 rounded-2xl pl-12 font-black text-xl text-primary shadow-inner text-center" 
                                    placeholder="INGRESAR CCT..." 
                                  />
                               </div>
                               
                               {/* Bloque CCT NO ENCONTRADO según imagen */}
                               {dialogSearchTerm.length >= 5 && schoolSearchResults.length === 0 && !formData.schoolName && (
                                 <div className="flex flex-col items-center gap-3 animate-in zoom-in-95 duration-300">
                                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">CCT NO ENCONTRADO</p>
                                    <Button 
                                      onClick={() => { setQuickAddForm({...quickAddForm, cct: dialogSearchTerm}); setIsQuickAddOpen(true); }} 
                                      className="bg-[#EFE7DD] hover:bg-[#e5dbc9] text-[#B38E5D] border-2 border-[#B38E5D] rounded-xl h-10 px-8 font-black text-[10px] gap-2 shadow-md"
                                    >
                                       <Plus className="h-4 w-4" /> ALTA RÁPIDA DE PLANTEL
                                    </Button>
                                 </div>
                               )}

                               {formData.schoolName && (
                                 <div className="p-5 bg-emerald-50 rounded-2xl border-2 border-emerald-100 flex items-center justify-center gap-4 shadow-sm animate-in fade-in">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                    <p className="text-xs font-black uppercase text-emerald-800">{formData.schoolName} - {formData.municipio}</p>
                                 </div>
                               )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                               <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 pl-2">LATITUD</Label><Input value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} className="h-10 rounded-xl bg-slate-50 border-none shadow-inner text-center font-mono font-bold" /></div>
                               <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 pl-2">LONGITUD</Label><Input value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} className="h-10 rounded-xl bg-slate-50 border-none shadow-inner text-center font-mono font-bold" /></div>
                            </div>
                         </div>

                         {/* Checklist de Fases según imagen */}
                         <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b pb-2"><ClipboardCheck className="h-5 w-5 text-[#9f2241]" /><h4 className="text-xs font-black uppercase text-[#9f2241] tracking-widest">FASES DEL PROYECTO</h4></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {BIBLIOTECA_FASES_LABELS.map(f => (
                                 <div key={f.id} className={cn("flex items-center gap-4 p-4 rounded-2xl border transition-all", (formData.bibliotecaFases as any)?.[f.id] ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-100 shadow-sm")}>
                                    <Checkbox 
                                      checked={(formData.bibliotecaFases as any)?.[f.id]} 
                                      onCheckedChange={(val) => { 
                                         const updatedFases = { ...formData.bibliotecaFases!, [f.id]: !!val }; 
                                         const progress = Math.round((Object.values(updatedFases).filter(v => typeof v === 'boolean' && v === true).length / 9) * 100); 
                                         setFormData({ ...formData, bibliotecaFases: updatedFases, progress }); 
                                      }} 
                                      id={`chk-${f.id}`} className="h-5 w-5 rounded-md border-primary" 
                                    />
                                    <Label htmlFor={`chk-${f.id}`} className="text-[10px] font-black uppercase text-slate-600 cursor-pointer flex-1 leading-tight">{f.label}</Label>
                                    <Badge variant="outline" className="text-[8px] font-black text-slate-400 bg-white">{f.progress}%</Badge>
                                 </div>
                               ))}
                            </div>
                         </div>

                         <div className="space-y-2 pt-4 border-t">
                            <Label className="text-[10px] font-black uppercase text-primary">Observaciones de Auditoría</Label>
                            <Textarea value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value.toUpperCase()})} className="min-h-[120px] bg-slate-50 border-none rounded-[1.5rem] p-6 font-bold text-xs shadow-inner uppercase" placeholder="NOTAS TÉCNICAS..." />
                         </div>
                      </div>
                   </ScrollArea>
                </TabsContent>
                
                <TabsContent value="asistentes" className="h-full m-0 p-8">
                   <div className="flex flex-col h-full items-center justify-center opacity-30 text-center">
                      <Users className="h-20 w-20 mb-4" />
                      <h4 className="text-xl font-black uppercase">Módulo de Asistentes</h4>
                      <p className="text-sm font-bold uppercase tracking-widest mt-2">Registre al personal capacitado en esta sección.</p>
                   </div>
                </TabsContent>
             </div>
          </Tabs>

          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-4 shrink-0">
             <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="uppercase text-xs font-black px-8 h-12">CANCELAR</Button>
             <Button onClick={handleSave} disabled={isSaving || !formData.cct} className="bg-[#9f2241] hover:bg-[#8a1d38] text-white px-12 text-xs shadow-2xl h-12 rounded-xl min-w-[200px] font-black gap-2">
                {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />} GUARDAR REGISTRO
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-[#B38E5D] text-white">
            <DialogTitle className="uppercase font-black text-lg flex items-center gap-3"><PlusCircle className="h-6 w-6" /> Registro Rápido de CCT</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">CCT</Label><Input value={quickAddForm.cct} onChange={e => setQuickAddForm({...quickAddForm, cct: e.target.value.toUpperCase()})} maxLength={10} className="font-mono font-black" /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Nombre del Plantel</Label><Input value={quickAddForm.nombre} onChange={e => setQuickAddForm({...quickAddForm, nombre: e.target.value.toUpperCase()})} className="font-black" /></div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Municipio</Label><Input value={quickAddForm.municipio} onChange={e => setQuickAddForm({...quickAddForm, municipio: e.target.value.toUpperCase()})} /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Valle</Label><Select value={quickAddForm.valle} onValueChange={v => setQuickAddForm({...quickAddForm, valle: v})}><SelectTrigger className="font-bold"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MEXICO">MÉXICO</SelectItem><SelectItem value="TOLUCA">TOLUCA</SelectItem></SelectContent></Select></div>
             </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-3"><Button variant="ghost" onClick={() => setIsQuickAddOpen(false)} className="h-12 px-8 text-[10px] font-black uppercase">Cancelar</Button><Button onClick={handleQuickAddCct} className="bg-primary text-white h-12 px-12 rounded-xl text-[10px] font-black uppercase shadow-lg">Registrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
