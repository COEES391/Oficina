
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
  FileUp,
  Laptop,
  Send,
  Users,
  GraduationCap,
  AlertCircle
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
  
  // States for Cuentas Section
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
      updateDoc(doc(db, 'programs', editingId), body).finally(() => { 
        setIsSaving(false); 
        resetForm(); 
        toast({ title: "Registro Actualizado" }); 
      });
    } else {
      addDoc(collection(db, 'programs'), { ...body, createdAt: serverTimestamp() }).finally(() => { 
        setIsSaving(false); 
        resetForm(); 
        toast({ title: "Registro Guardado" }); 
      });
    }
  }

  const resetForm = () => { 
    setFormData(initialFormState); 
    setEditingId(null); 
    setUserPart(''); 
    setDomainPart(DOMINIOS[0]); 
  }

  const handleEdit = (rec: ProgramStatus) => { 
    setFormData({...rec}); 
    setEditingId(rec.id!); 
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
          /* ATRES CALL CENTER TACTICO */
          <div className="flex h-full w-full bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-slate-50 animate-in zoom-in-95 duration-500 min-h-[600px]">
             {/* Sidebar Táctico */}
             <aside className="w-16 bg-[#0b4135] flex flex-col items-center py-6 gap-6 shrink-0 border-r border-white/5">
                <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400 shadow-inner"><ShieldCheck className="h-6 w-6" /></div>
                <div className="flex-1 flex flex-col gap-4">
                   {[{id:'chat', icon: MessageSquare}, {id:'remote', icon: Monitor}, {id:'files', icon: FileUp}, {id:'stats', icon: Activity}].map(item => (
                     <button key={item.id} onClick={() => setAtresView(item.id as any)} className={cn("h-11 w-11 rounded-2xl flex items-center justify-center transition-all", atresView === item.id ? "bg-emerald-500 text-white shadow-lg" : "text-white/30 hover:bg-white/5")}><item.icon className="h-5 w-5" /></button>
                   ))}
                </div>
                <button className="h-11 w-11 rounded-2xl flex items-center justify-center text-white/30 hover:text-white"><Settings className="h-5 w-5" /></button>
             </aside>

             {/* Lista de Sesiones */}
             <div className="w-80 bg-slate-50 border-r flex flex-col shrink-0">
                <div className="p-6 bg-white border-b space-y-4">
                   <div className="flex items-center justify-between">
                      <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Buzón</h2>
                      <Badge className="bg-emerald-50 text-emerald-600 border-none">{queue.length}</Badge>
                   </div>
                   <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" /><Input placeholder="BUSCAR..." className="h-9 pl-9 rounded-xl bg-slate-50 border-none text-[10px] font-bold uppercase" />
                   </div>
                </div>
                <ScrollArea className="flex-1">
                   <div className="p-2 space-y-1">
                     {queue.map(req => (
                       <button 
                         key={req.id} 
                         onClick={() => setSelectedRequest(req)} 
                         className={cn("w-full p-4 rounded-3xl text-left transition-all flex items-center gap-4 border-2 relative", selectedRequest?.id === req.id ? "bg-white border-emerald-500 shadow-xl" : "bg-transparent border-transparent hover:bg-white/80")}
                       >
                          <Avatar className="h-12 w-12 border-2 border-white shadow-md"><AvatarFallback>{req.userName?.slice(0,2) || 'U'}</AvatarFallback></Avatar>
                          <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-center mb-0.5">
                                <span className="text-[12px] font-black text-slate-700 uppercase truncate">{req.userName}</span>
                                {req.status === 'pending' && <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
                             </div>
                             <p className="text-[10px] font-semibold text-slate-400 truncate uppercase">{req.lastMessage || 'Conexión entrante...'}</p>
                          </div>
                       </button>
                     ))}
                   </div>
                </ScrollArea>
             </div>

             {/* Visor de Interacción */}
             <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden">
                {selectedRequest ? (
                  <>
                    <header className="h-16 bg-white border-b px-8 flex items-center justify-between shadow-sm z-30 shrink-0">
                       <div className="flex flex-col">
                          <h3 className="text-sm font-black text-slate-800 uppercase">{selectedRequest.userName}</h3>
                          <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Atendiendo en tiempo real</p>
                       </div>
                       <div className="flex gap-2">
                          <Button onClick={() => setAtresView('remote')} size="sm" variant={atresView === 'remote' ? 'default' : 'outline'} className="rounded-xl text-[10px] font-black h-9"><Monitor className="h-3 w-3 mr-2" /> REMOTO</Button>
                          <Button onClick={() => setAtresView('chat')} size="sm" variant={atresView === 'chat' ? 'default' : 'outline'} className="rounded-xl text-[10px] font-black h-9"><MessageSquare className="h-3 w-3 mr-2" /> CHAT</Button>
                       </div>
                    </header>
                    
                    <div className="flex-1 overflow-hidden flex">
                       <div className="flex-1 flex flex-col overflow-hidden">
                          {atresView === 'remote' ? (
                            <div className="flex-1 p-6 relative">
                               <div className="w-full h-full bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 shadow-2xl relative overflow-hidden flex items-center justify-center">
                                  <Image src="https://picsum.photos/seed/anydesk/1200/800" alt="Remote" fill className="object-cover opacity-50 grayscale" />
                                  <div className="z-10 text-center space-y-4">
                                     <div className="h-16 w-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse"><Activity className="text-emerald-400 h-8 w-8" /></div>
                                     <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Stream de video encriptado • Auditoría 2026</p>
                                  </div>
                               </div>
                            </div>
                          ) : (
                            <>
                              <ScrollArea className="flex-1 p-8">
                                 <div className="max-w-3xl mx-auto space-y-4">
                                    {messages.map((m, i) => (
                                      <div key={i} className={cn("flex", m.role === 'tech' ? "justify-end" : "justify-start")}>
                                         <div className={cn("max-w-[70%] p-4 rounded-2xl shadow-sm text-sm font-semibold", m.role === 'tech' ? "bg-emerald-100 text-slate-800" : "bg-white text-slate-800")}>
                                            <p>{m.content}</p>
                                            <p className="text-[8px] font-black uppercase opacity-30 mt-2 text-right">{m.timestamp?.seconds ? format(new Date(m.timestamp.seconds * 1000), 'HH:mm') : '...'}</p>
                                         </div>
                                      </div>
                                    ))}
                                    <div ref={scrollRef}/>
                                 </div>
                              </ScrollArea>
                              <footer className="p-4 bg-white border-t flex gap-3 shrink-0">
                                 <Input 
                                    value={chatInput} 
                                    onChange={e => setChatInput(e.target.value)} 
                                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()} 
                                    className="rounded-2xl bg-slate-50 border-none h-12 px-6 font-bold" 
                                    placeholder="Escribir respuesta técnica..." 
                                 />
                                 <Button onClick={handleSendMessage} className="bg-emerald-600 hover:bg-emerald-700 h-12 w-12 rounded-2xl p-0 shadow-xl"><Send className="h-5 w-5" /></Button>
                              </footer>
                            </>
                          )}
                       </div>
                       
                       {/* Panel de Info Adicional */}
                       <aside className="w-80 bg-white border-l p-6 space-y-8 overflow-y-auto shrink-0 hidden xl:block">
                          <div className="space-y-4">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><QrCode className="h-4 w-4" /> Compartir Acceso</h4>
                             <div className="p-6 bg-slate-50 rounded-[2rem] flex flex-col items-center gap-4 border-2 border-dashed border-slate-200">
                                <div className="h-32 w-32 bg-white rounded-2xl flex items-center justify-center p-2 shadow-xl">
                                   <Image src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://6000-firebase-planeacin-1776866447103.cluster-gizzoza7hzhfyxzo5d76y3flkw.cloudworkstations.dev/helpdesk" alt="QR" width={120} height={120} />
                                </div>
                                <div className="text-center">
                                   <p className="text-[9px] font-black text-slate-400 uppercase">Liga de Atención:</p>
                                   <p className="text-[9px] font-bold text-primary truncate max-w-[200px] mt-1">/helpdesk</p>
                                   <Button size="sm" variant="ghost" className="text-[8px] font-black uppercase text-emerald-600 mt-2 hover:bg-emerald-50">Copiar Liga</Button>
                                </div>
                             </div>
                          </div>
                          <div className="space-y-4">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><HardDrive className="h-4 w-4" /> Especificaciones</h4>
                             <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border">
                                <div className="flex justify-between"><span className="text-[9px] font-bold text-slate-500 uppercase">CPU</span><span className="text-[9px] font-black">Intel i7 12th Gen</span></div>
                                <div className="flex justify-between"><span className="text-[9px] font-bold text-slate-500 uppercase">RAM</span><span className="text-[9px] font-black">16 GB DDR4</span></div>
                                <div className="flex justify-between"><span className="text-[9px] font-bold text-slate-500 uppercase">IP</span><span className="text-[9px] font-black font-mono text-primary">192.168.1.104</span></div>
                             </div>
                          </div>
                       </aside>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-30 text-center">
                     <Laptop className="h-24 w-24 mb-6 text-slate-400" />
                     <h3 className="text-3xl font-black uppercase text-slate-800 tracking-tighter">Central de Soporte ATRES</h3>
                     <p className="text-xs font-bold uppercase tracking-[0.4em] mt-2">Seleccione una sesión activa del buzón izquierdo</p>
                  </div>
                )}
             </div>
          </div>
        ) : activeTab === 'Biblioteca Digital' ? (
          /* BIBLIOTECA DIGITAL CON KPIs EN 0 */
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             {/* KPIs Tácticos */}
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

             <Card className="executive-card p-0 shadow-2xl border-none overflow-hidden bg-white min-h-[400px]">
                <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><History className="h-6 w-6" /></div>
                      <div><h3 className="text-sm font-black uppercase text-slate-800">Bitácora de Auditoría</h3><p className="text-[9px] font-bold text-slate-400 uppercase">Seguimiento institucional de 9 fases</p></div>
                   </div>
                   <Button onClick={() => setIsDialogOpen(true)} className="btn-institutional h-10 px-8 rounded-xl text-[10px]"><PlusCircle className="h-4 w-4 mr-2" /> NUEVO REGISTRO</Button>
                </div>
                <ScrollArea className="h-[500px]">
                   <Table>
                      <TableHeader className="bg-slate-50 sticky top-0 z-10"><TableRow><TableHead className="pl-8 text-[9px] font-black uppercase">Centro de Trabajo</TableHead><TableHead className="text-[9px] font-black uppercase">Progreso</TableHead><TableHead className="text-[9px] font-black uppercase">Estatus</TableHead><TableHead className="text-[9px] font-black uppercase text-center">Docs</TableHead><TableHead className="text-right pr-10"></TableHead></TableRow></TableHeader>
                      <TableBody>
                         {records.filter(r => r.name === 'Biblioteca Digital').map((rec) => (
                           <TableRow key={rec.id} className="h-20 hover:bg-slate-50 transition-colors">
                              <TableCell className="pl-8"><div className="flex flex-col"><span className="text-[11px] font-black text-slate-700 uppercase leading-none">{rec.schoolName}</span><span className="text-[9px] font-mono font-bold text-primary mt-1 uppercase">{rec.cct} • {rec.municipio}</span></div></TableCell>
                              <TableCell className="w-48"><div className="space-y-1.5"><div className="flex justify-between text-[8px] font-black"><span>{rec.progress}%</span></div><Progress value={rec.progress} className="h-1 bg-slate-100" /></div></TableCell>
                              <TableCell><Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20 text-primary">{rec.status}</Badge></TableCell>
                              <TableCell className="text-center"><div className="flex items-center justify-center gap-1">{rec.reportPdf && <FileText className="h-4 w-4 text-rose-500" />}{rec.evidencePhotos?.length ? <ImageIcon className="h-4 w-4 text-emerald-500" /> : null}</div></TableCell>
                              <TableCell className="text-right pr-8"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => handleEdit(rec)} className="h-8 w-8 text-primary"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(rec.id!)} className="h-8 w-8 text-rose-300 hover:text-rose-600"><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                           </TableRow>
                         ))}
                         {records.filter(r => r.name === 'Biblioteca Digital').length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-32 opacity-30 text-xs font-black uppercase">Sin registros de auditoría</TableCell></TableRow>}
                      </TableBody>
                   </Table>
                </ScrollArea>
             </Card>
          </div>
        ) : activeTab === 'Geoposición' ? (
          /* GEOPOSICION TACTICA */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[600px] animate-in slide-in-from-bottom-4 duration-500">
             <div className="lg:col-span-8 bg-slate-100 rounded-[2.5rem] overflow-hidden relative border-4 border-white shadow-2xl">
                <Image src="https://picsum.photos/seed/geosat/1200/800" alt="Map" fill className="object-cover opacity-50 grayscale" />
                <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                <div className="absolute top-6 left-6 p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border flex items-center gap-3">
                   <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                   <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Monitor Global COEES 2026</h4>
                </div>
             </div>
             <Card className="lg:col-span-4 border-none shadow-xl rounded-[2.5rem] bg-white p-8 flex flex-col">
                <div className="flex items-center gap-4 mb-8 border-b pb-4"><Navigation className="h-7 w-7 text-accent" /><h3 className="text-lg font-black uppercase text-primary">Captura UTM</h3></div>
                <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                   <LocateFixed className="h-16 w-16 text-primary" />
                   <p className="text-xs font-black uppercase text-slate-800">Inicie un "Nuevo Registro" para vincular coordenadas UTM al CCT auditado</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="btn-institutional w-full h-14 rounded-2xl text-[11px] gap-3 shadow-2xl mt-8"><PlusCircle className="h-5 w-5" /> REGISTRAR COORDENADAS</Button>
             </Card>
          </div>
        ) : (
          /* CONOCE MI ESCUELA CON KPIs EN 0 */
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                   { label: 'MAPA ESCOLAR', value: 0, icon: MapPin, color: 'text-primary' },
                   { label: 'FICHAS TÉCNICAS', value: 0, icon: ClipboardList, color: 'text-accent' },
                   { label: 'VISITAS GUIADAS', value: 0, icon: Navigation, color: 'text-emerald-600' },
                   { label: 'PLANTELES VINCULADOS', value: 0, icon: School, color: 'text-blue-600' }
                ].map((k, i) => (
                  <Card key={i} className="border-none shadow-sm rounded-2xl p-6 bg-white flex flex-col items-center text-center space-y-2">
                     <k.icon className={cn("h-8 w-8 mb-2", k.color)} />
                     <h4 className="text-2xl font-black leading-none">{k.value}</h4>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{k.label}</p>
                  </Card>
                ))}
             </div>
             <Card className="executive-card p-6 bg-white/80 shrink-0">
                <div className="flex gap-4">
                   <div className="relative flex-1">
                      <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
                      <Input placeholder="BUSCAR POR CCT O NOMBRE DEL PLANTEL..." className="h-11 pl-12 rounded-xl bg-slate-50 border-none font-bold uppercase text-xs shadow-inner" />
                   </div>
                   <Button className="btn-institutional h-11 px-10 text-[10px] shadow-xl">LOCALIZAR</Button>
                </div>
             </Card>
             <div className="flex-1 min-h-[400px] bg-white rounded-[2.5rem] border-2 border-slate-50 shadow-inner relative overflow-hidden flex items-center justify-center opacity-20">
                <div className="text-center space-y-4"><Monitor className="h-24 w-24 mx-auto text-primary" /><h3 className="text-3xl font-black uppercase text-primary tracking-tighter">Visor de Identidad Escolar</h3></div>
             </div>
          </div>
        )}
      </div>

      {/* Botón Global de Acción (para Biblioteca, Geo, Conoce) */}
      {['Biblioteca Digital', 'Geoposición', 'Conoce mi Escuela'].includes(activeTab) && (
        <Button onClick={() => setIsDialogOpen(true)} className="fixed bottom-10 right-10 btn-institutional h-14 w-14 rounded-full shadow-2xl p-0 flex items-center justify-center z-50">
           <Plus className="h-8 w-8" />
        </Button>
      )}

      {/* DIÁLOGO DE GESTIÓN TÉCNICA (BIBLIOTECA, GEO, ETC) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] h-[85vh] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden flex flex-col bg-white">
          <DialogHeader className="p-8 bg-primary text-white shrink-0">
             <DialogTitle className="uppercase font-black text-xl flex items-center gap-3"><Settings className="h-7 w-7 text-accent" /> Gestión Técnica: {activeTab}</DialogTitle>
             <DialogDescription className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Auditoría y Seguimiento de Infraestructura</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 p-8">
             <div className="space-y-8">
                <div className="space-y-2 relative">
                   <Label className="text-xs font-black uppercase text-primary pl-2">Identificación CCT Plantel</Label>
                   <div className="relative">
                      <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
                      <Input 
                         value={dialogSearchTerm} 
                         onChange={e => { setDialogSearchTerm(e.target.value.toUpperCase()); handleCctChange(e.target.value); }} 
                         className="h-12 bg-slate-50 border-none shadow-inner rounded-xl pl-12 font-black text-lg text-primary" 
                         placeholder="BUSCAR CCT..." 
                      />
                   </div>
                   {dialogSearchTerm.length > 2 && allSchools.filter(s => s.cct.includes(dialogSearchTerm) || s.nombre.includes(dialogSearchTerm)).length === 0 && (
                      <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 flex flex-col items-center gap-3 mt-4">
                         <p className="text-[10px] font-black text-rose-700 uppercase">El plantel no se encuentra en la base maestra</p>
                         <Button variant="outline" size="sm" className="h-9 px-6 rounded-xl text-[9px] font-black uppercase border-rose-200 text-rose-600 hover:bg-rose-100">Registrar Plantel</Button>
                      </div>
                   )}
                </div>

                {formData.schoolName && (
                  <div className="p-6 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100 flex items-center gap-5 shadow-sm animate-in zoom-in-95">
                     <div className="h-14 w-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600"><School className="h-8 w-8" /></div>
                     <div><p className="text-sm font-black uppercase text-slate-800 leading-none">{formData.schoolName}</p><p className="text-[10px] font-bold text-emerald-600 mt-1">{formData.municipio} • ZE: {formData.zonaEscolar} • Valle {formData.valle}</p></div>
                  </div>
                )}

                {activeTab === 'Biblioteca Digital' && (
                  <div className="space-y-6 pt-4 border-t">
                     <div className="flex items-center gap-3 mb-4"><ClipboardCheck className="h-5 w-5 text-accent" /><h4 className="text-xs font-black uppercase text-accent tracking-widest">Protocolo de 9 Fases</h4></div>
                     <div className="grid grid-cols-1 gap-3">
                        {BIBLIOTECA_FASES_LABELS.map(f => (
                          <div key={f.id} className={cn("flex items-center gap-4 p-4 rounded-2xl border transition-all", (formData.bibliotecaFases as any)?.[f.id] ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100")}>
                             <Checkbox 
                                checked={(formData.bibliotecaFases as any)?.[f.id]} 
                                onCheckedChange={(val) => {
                                   const updatedFases = { ...formData.bibliotecaFases!, [f.id]: !!val };
                                   const progress = Math.round((Object.values(updatedFases).filter(v => v === true).length / 9) * 100);
                                   setFormData({ ...formData, bibliotecaFases: updatedFases, progress });
                                }} 
                                id={`chk-${f.id}`} 
                                className="h-5 w-5 rounded-md border-primary"
                             />
                             <Label htmlFor={`chk-${f.id}`} className="text-[11px] font-black uppercase text-slate-700 cursor-pointer flex-1">{f.label}</Label>
                             <Badge variant="outline" className="text-[8px] font-black text-slate-400 bg-white">{f.progress}%</Badge>
                          </div>
                        ))}
                     </div>
                  </div>
                )}

                {activeTab === 'Geoposición' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t">
                     <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Coordenada Latitud (N)</Label><Input value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} className="h-12 bg-slate-50 font-mono text-primary text-lg" placeholder="19.000000" /></div>
                     <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Coordenada Longitud (W)</Label><Input value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} className="h-12 bg-slate-50 font-mono text-primary text-lg" placeholder="-99.000000" /></div>
                  </div>
                )}

                <div className="space-y-2 pt-4 border-t">
                   <Label className="text-[10px] font-black uppercase text-primary">Observaciones de Auditoría</Label>
                   <Textarea value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value.toUpperCase()})} className="min-h-[120px] bg-slate-50 border-none rounded-[1.5rem] p-6 font-bold text-xs shadow-inner uppercase" placeholder="NOTAS TÉCNICAS..." />
                </div>
             </div>
          </ScrollArea>
          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4 shrink-0">
             <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="uppercase text-xs font-black px-8">Cancelar</Button>
             <Button onClick={handleSave} disabled={isSaving || !formData.cct} className="btn-institutional px-12 text-xs shadow-2xl h-14 rounded-2xl min-w-[200px]">
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />} GUARDAR REGISTRO
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
