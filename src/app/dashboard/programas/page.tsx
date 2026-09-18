
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
  Laptop,
  Send
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
  
  // States for Cuentas Section (Imagen Réplica)
  const [userPart, setUserPart] = useState('')
  const [domainPart, setDomainPart] = useState(DOMINIOS[0])
  const [verifyEmail, setVerifyEmail] = useState('')

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
  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([])

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

  const handleSave = () => {
    setIsSaving(true);
    const body: any = { 
      ...formData, 
      name: activeTab, 
      email: activeTab === 'Cuentas Institucionales' ? `${userPart.toLowerCase().trim()}${domainPart}` : formData.email || '',
      updatedAt: serverTimestamp() 
    };

    if (editingId) {
      updateDoc(doc(db, 'programs', editingId), body).finally(() => { setIsSaving(false); resetForm(); toast({ title: "Registro Actualizado" }); });
    } else {
      addDoc(collection(db, 'programs'), { ...body, createdAt: serverTimestamp() }).finally(() => { setIsSaving(false); resetForm(); toast({ title: "Registro Guardado" }); });
    }
  }

  const resetForm = () => { 
    setFormData(initialFormState); setEditingId(null); setUserPart(''); setDomainPart(DOMINIOS[0]); 
  }

  const handleEdit = (rec: ProgramStatus) => { 
    setFormData({...rec}); setEditingId(rec.id!); 
    if (rec.name === 'Cuentas Institucionales') { 
      setUserPart(rec.email?.split('@')[0] || ''); 
      setDomainPart('@' + (rec.email?.split('@')[1] || 'coees.edu.mx')); 
    } 
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Eliminar registro?")) deleteDoc(doc(db, 'programs', id));
  }

  const handleSendMessage = () => {
    if (!chatInput.trim() || !selectedRequest) return;
    setDoc(doc(db, 'support_queue', selectedRequest.id), { lastActivity: serverTimestamp(), lastMessage: chatInput.substring(0, 50), status: 'attending' }, { merge: true });
    addDoc(collection(db, 'chat_messages'), { chatId: selectedRequest.id, role: 'tech', content: chatInput, timestamp: serverTimestamp(), senderName: localStorage.getItem('userRfc') || 'ANALISTA' });
    setChatInput('');
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 w-full min-h-screen flex flex-col">
      {/* Header Institucional */}
      <div className="shrink-0 space-y-4">
        <div>
          <h2 className="text-3xl font-black text-primary leading-none uppercase">Módulos Técnicos COEES</h2>
          <p className="text-xs font-bold text-slate-800 uppercase tracking-widest mt-1">Auditoría Institucional 2026</p>
        </div>

        {/* Navigation Tabs */}
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

      {/* Contenido Dinámico */}
      <div className="flex-1 min-h-0">
        {activeTab === 'Cuentas Institucionales' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full animate-in slide-in-from-bottom-4 duration-500">
            {/* Columna Izquierda: Registro Técnico */}
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-10 flex flex-col space-y-8">
               <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-3xl bg-primary text-white flex items-center justify-center shadow-2xl">
                     <Mail className="h-9 w-9" />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black uppercase text-primary leading-none">Registro Técnico</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Creación y Restructuración de Cuentas</p>
                  </div>
               </div>

               <div className="space-y-6 flex-1">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black text-slate-500 uppercase pl-1">Servidor Público (Responsable) *</Label>
                     <Input className="h-12 rounded-xl bg-slate-50 border-none shadow-inner uppercase font-bold" value={formData.userName} onChange={e => setFormData({...formData, userName: e.target.value.toUpperCase()})} placeholder="NOMBRE COMPLETO..." />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black text-slate-500 uppercase pl-1">Departamento / Área *</Label>
                     <Input className="h-12 rounded-xl bg-slate-50 border-none shadow-inner uppercase font-bold" value={formData.departamento} onChange={e => setFormData({...formData, departamento: e.target.value.toUpperCase()})} placeholder="NOMBRE DE LA OFICINA O ÁREA..." />
                  </div>
                  <div className="space-y-4">
                     <Label className="text-[10px] font-black text-primary uppercase pl-1">Construcción del Correo Institucional</Label>
                     <div className="flex gap-2">
                        <Input className="h-11 rounded-xl bg-slate-50 border-none shadow-inner text-xs font-bold flex-1" value={userPart} onChange={e => setUserPart(e.target.value)} placeholder="usuario..." />
                        <Select value={domainPart} onValueChange={setDomainPart}>
                           <SelectTrigger className="h-11 rounded-xl w-48 bg-slate-50 border-none shadow-inner font-black text-xs"><SelectValue /></SelectTrigger>
                           <SelectContent className="rounded-xl">
                              {DOMINIOS.map(d => <SelectItem key={d} value={d} className="font-black text-[10px]">{d}</SelectItem>)}
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Vista previa del correo:</p>
                        <p className={cn("text-xs font-black uppercase tracking-tighter", userPart ? "text-primary" : "text-rose-600")}>
                          {userPart ? `${userPart.toLowerCase()}${domainPart}` : 'esperando datos...'}
                        </p>
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

            {/* Columna Derecha: Verificación e Historial */}
            <div className="flex flex-col gap-8 h-full">
               <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8 space-y-4 shrink-0">
                  <div className="flex items-center gap-4">
                     <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                     <div>
                        <h4 className="text-sm font-black uppercase text-slate-700 leading-none">Verificar Existencia</h4>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Validación oficial de correos en la auditoría 2026</p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
                        <Input placeholder="INGRESAR CORREO COMPLETO..." className="h-9 pl-9 rounded-xl border-slate-100 bg-slate-50 text-[10px] font-bold uppercase" value={verifyEmail} onChange={e => setVerifyEmail(e.target.value)} />
                     </div>
                     <Button className="bg-emerald-600 hover:bg-emerald-700 h-9 px-6 rounded-xl text-[9px] font-black uppercase shadow-lg">Validar</Button>
                  </div>
               </Card>

               <Card className="border-none shadow-xl rounded-[2.5rem] bg-white flex flex-col flex-1 overflow-hidden">
                  <div className="p-8 border-b bg-slate-50/50 flex items-center gap-3">
                     <Archive className="h-5 w-5 text-primary" />
                     <h4 className="text-sm font-black uppercase tracking-widest text-slate-700">Historial de Registros</h4>
                  </div>
                  <ScrollArea className="flex-1">
                     <Table>
                        <TableHeader className="bg-slate-50/50 sticky top-0 z-10 border-b">
                           <TableRow className="h-12">
                              <TableHead className="pl-8 text-[9px] font-black uppercase">Responsable / Servidor</TableHead>
                              <TableHead className="text-[9px] font-black uppercase">Correo Registrado</TableHead>
                              <TableHead className="text-[9px] font-black uppercase text-center">Estatus</TableHead>
                              <TableHead className="text-right pr-10 text-[9px] font-black uppercase">Acciones</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {records.filter(r => r.name === 'Cuentas Institucionales').map((rec, i) => (
                             <TableRow key={rec.id || i} className="h-16 hover:bg-slate-50 transition-colors">
                                <TableCell className="pl-8">
                                   <div className="flex flex-col">
                                      <span className="text-[11px] font-black text-slate-700 uppercase leading-none">{rec.userName}</span>
                                      <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase truncate max-w-[150px]">{rec.departamento}</span>
                                   </div>
                                </TableCell>
                                <TableCell className="font-mono text-[10px] font-bold text-primary">{rec.email}</TableCell>
                                <TableCell className="text-center">
                                   <Badge variant="outline" className="text-[8px] font-black px-2 h-4 border-emerald-200 text-emerald-600 bg-emerald-50">ACTIVO</Badge>
                                </TableCell>
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
          </div>
        ) : activeTab === 'ATRES' ? (
          /* ATRES CALL CENTER */
          <div className="flex h-full w-full bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-slate-50 animate-in zoom-in-95 duration-500">
             <aside className="w-16 bg-[#0b4135] flex flex-col items-center py-6 gap-6 shrink-0 border-r border-white/5">
                <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400 shadow-inner"><ShieldCheck className="h-6 w-6" /></div>
                <div className="flex-1 flex flex-col gap-4">
                   {[{id:'chat', icon: MessageSquare}, {id:'remote', icon: Monitor}, {id:'files', icon: FileUp}, {id:'stats', icon: Activity}].map(item => (
                     <button key={item.id} onClick={() => setAtresView(item.id as any)} className={cn("h-11 w-11 rounded-2xl flex items-center justify-center transition-all", atresView === item.id ? "bg-emerald-500 text-white shadow-lg" : "text-white/30 hover:bg-white/5")}><item.icon className="h-5 w-5" /></button>
                   ))}
                </div>
             </aside>
             <div className="w-80 bg-slate-50 border-r flex flex-col shrink-0">
                <div className="p-6 bg-white border-b space-y-4">
                   <div className="flex items-center justify-between"><h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Buzón</h2><Badge className="bg-emerald-50 text-emerald-600">{queue.length}</Badge></div>
                   <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" /><Input placeholder="BUSCAR..." className="h-9 pl-9 rounded-xl bg-slate-50 border-none text-[10px]" /></div>
                </div>
                <ScrollArea className="flex-1">
                   <div className="p-2 space-y-1">
                     {queue.map(req => (
                       <button key={req.id} onClick={() => setSelectedRequest(req)} className={cn("w-full p-4 rounded-3xl text-left transition-all flex items-center gap-4 border-2", selectedRequest?.id === req.id ? "bg-white border-emerald-500 shadow-xl" : "bg-transparent border-transparent hover:bg-white/80")}>
                          <Avatar className="h-12 w-12"><AvatarFallback>{req.userName?.slice(0,2)}</AvatarFallback></Avatar>
                          <div className="flex-1 min-w-0"><div className="flex justify-between items-center"><span className="text-xs font-black truncate">{req.userName}</span></div><p className="text-[10px] text-slate-400 truncate">{req.lastMessage || '...'}</p></div>
                       </button>
                     ))}
                   </div>
                </ScrollArea>
             </div>
             <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden">
                {selectedRequest ? (
                  <>
                    <header className="h-16 bg-white border-b px-8 flex items-center justify-between shadow-sm z-30">
                       <h3 className="text-sm font-black text-slate-800 uppercase">{selectedRequest.userName}</h3>
                       <div className="flex gap-2"><Button onClick={() => setAtresView('remote')} size="sm" className="rounded-xl text-[10px]"><Monitor className="h-3 w-3 mr-2" /> REMOTO</Button><Button onClick={() => setAtresView('chat')} size="sm" className="rounded-xl text-[10px]"><MessageSquare className="h-3 w-3 mr-2" /> CHAT</Button></div>
                    </header>
                    {/* Contenido Chat/Remoto */}
                    <div className="flex-1 overflow-hidden relative">
                       {/* Render Chat or Remote View... (Simplificado para espacio) */}
                       <ScrollArea className="h-full p-8"><div className="space-y-4">{messages.map((m, i) => (<div key={i} className={cn("flex", m.role === 'tech' ? "justify-end" : "justify-start")}><div className={cn("max-w-[70%] p-4 rounded-2xl text-sm shadow-sm", m.role === 'tech' ? "bg-emerald-100 text-slate-800" : "bg-white text-slate-800")}><p>{m.content}</p></div></div>))}</div><div ref={scrollRef}/></ScrollArea>
                    </div>
                    <footer className="p-4 bg-white border-t flex gap-2"><Input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} className="rounded-xl" placeholder="Escribir..." /><Button onClick={handleSendMessage} className="bg-emerald-600 rounded-xl px-4"><Send className="h-4 w-4" /></Button></footer>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-30 text-center"><Laptop className="h-20 w-20 mb-6" /><h3 className="text-2xl font-black uppercase">Central Táctica ATRES</h3><p className="text-xs font-bold uppercase mt-2">Seleccione una sesión del buzón</p></div>
                )}
             </div>
          </div>
        ) : activeTab === 'Biblioteca Digital' ? (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             {/* KPIs */}
             <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {[ 
                  { label: 'CCT REGISTRADOS', value: records.filter(r => r.name === 'Biblioteca Digital').length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' }, 
                  { label: 'VISITAS TOTALES', value: 0, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' }, 
                  { label: 'EVIDENCIAS', value: 0, icon: ImageIcon, color: 'text-orange-500', bg: 'bg-orange-50' }, 
                  { label: 'CONCLUIDOS', value: 0, icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
                  { label: 'PENDIENTES', value: 0, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
                  { label: 'CAPACITADOS', value: 0, icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                ].map((k, i) => (
                  <Card key={i} className="border-none shadow-sm rounded-2xl p-4 bg-white flex items-center gap-4">
                     <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", k.bg, k.color)}><k.icon className="h-5 w-5" /></div>
                     <div><p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">{k.label}</p><h4 className="text-lg font-black leading-none">{k.value}</h4></div>
                  </Card>
                ))}
             </div>
             <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-10 flex flex-col items-center justify-center opacity-30 text-center min-h-[400px]">
                <ClipboardCheck className="h-20 w-20 mb-6 text-primary" />
                <h3 className="text-2xl font-black uppercase text-primary">Panel de Auditoría de Biblioteca</h3>
                <p className="text-xs font-bold uppercase tracking-widest mt-2">Utilice el botón de "Nuevo Registro" para iniciar el protocolo de 9 fases</p>
             </Card>
          </div>
        ) : activeTab === 'Geoposición' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[600px] animate-in slide-in-from-bottom-4 duration-500">
             <div className="lg:col-span-8 bg-slate-100 rounded-[2.5rem] overflow-hidden relative border-4 border-white shadow-2xl">
                <Image src="https://picsum.photos/seed/geosat/1200/800" alt="Map" fill className="object-cover opacity-50 grayscale" />
                <div className="absolute top-6 left-6 p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border flex items-center gap-3">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                   <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">Monitor Global COEES 2026</h4>
                </div>
             </div>
             <Card className="lg:col-span-4 border-none shadow-xl rounded-[2.5rem] bg-white p-8 flex flex-col items-center justify-center opacity-30">
                <Navigation className="h-16 w-16 mb-4 text-primary" />
                <p className="text-xs font-black uppercase text-center">Capture las coordenadas UTM en el diálogo de gestión técnica</p>
             </Card>
          </div>
        ) : (
          /* Conoce mi Escuela */
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 h-full">
             <Card className="executive-card p-6 bg-white/80 shrink-0">
                <div className="flex gap-4"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-300" /><Input placeholder="BUSCAR POR CCT O NOMBRE..." className="h-10 pl-10 rounded-xl bg-slate-50 border-none font-bold uppercase" /></div><Button className="btn-institutional h-10 px-8 text-xs">LOCALIZAR</Button></div>
             </Card>
             <div className="flex-1 min-h-[400px] bg-white rounded-[2.5rem] border-2 border-slate-50 shadow-inner relative overflow-hidden flex items-center justify-center opacity-20">
                <div className="text-center space-y-4"><Monitor className="h-24 w-24 mx-auto text-primary" /><h3 className="text-3xl font-black uppercase text-primary">Visor de Identidad Escolar</h3></div>
             </div>
          </div>
        )}
      </div>

      {/* Botón Global de Acción (para otras pestañas) */}
      {activeTab !== 'ATRES' && activeTab !== 'Cuentas Institucionales' && (
        <Button onClick={() => setIsDialogOpen(true)} className="fixed bottom-10 right-10 btn-institutional h-14 w-14 rounded-full shadow-2xl p-0 flex items-center justify-center z-50">
           <Plus className="h-8 w-8" />
        </Button>
      )}

      {/* DIÁLOGO DE GESTIÓN (GLOBAL PARA BIBLIOTECA, GEO, ETC) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] h-[85vh] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden flex flex-col bg-white">
          <DialogHeader className="p-8 bg-primary text-white shrink-0"><DialogTitle className="uppercase font-black text-xl flex items-center gap-3"><Settings className="h-7 w-7" /> Gestión Técnica: {activeTab}</DialogTitle></DialogHeader>
          <ScrollArea className="flex-1 p-8"><div className="space-y-6">
            <div className="space-y-2"><Label className="text-xs font-black uppercase">CCT Plantel</Label><Input value={dialogSearchTerm} onChange={e => {setDialogSearchTerm(e.target.value.toUpperCase()); handleCctChange(e.target.value);}} className="h-12 bg-slate-50 font-black text-lg" placeholder="15DES0000X" /></div>
            {formData.schoolName && <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3"><School className="h-6 w-6 text-emerald-600" /><div><p className="text-xs font-black uppercase">{formData.schoolName}</p><p className="text-[10px] font-bold text-emerald-600">{formData.municipio} • ZE: {formData.zonaEscolar}</p></div></div>}
            {activeTab === 'Biblioteca Digital' && (<div className="space-y-4 pt-4 border-t">{BIBLIOTECA_FASES_LABELS.map(f => (<div key={f.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"><Checkbox checked={(formData.bibliotecaFases as any)?.[f.id]} onCheckedChange={(val) => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, [f.id]: !!val}})} id={`chk-${f.id}`} /><Label htmlFor={`chk-${f.id}`} className="text-[10px] font-bold uppercase">{f.label}</Label></div>))}</div>)}
            {activeTab === 'Geoposición' && (<div className="grid grid-cols-2 gap-4 pt-4 border-t"><div><Label className="text-[10px] font-black uppercase">Latitud</Label><Input value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} className="h-11" /></div><div><Label className="text-[10px] font-black uppercase">Longitud</Label><Input value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} className="h-11" /></div></div>)}
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Observaciones</Label><Textarea value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value.toUpperCase()})} className="min-h-[100px] uppercase font-bold text-xs" /></div>
          </div></ScrollArea>
          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-3"><Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="uppercase text-xs font-black">Cancelar</Button><Button onClick={handleSave} className="btn-institutional px-10 text-xs shadow-xl"><Save className="h-4 w-4 mr-2" /> GUARDAR REGISTRO</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
