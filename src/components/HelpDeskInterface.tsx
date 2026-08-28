'use client'
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Send, 
  Bot, 
  UserCog,
  GraduationCap,
  ChevronRight,
  MessageSquare,
  CheckCircle2,
  Save,
  Download,
  Paperclip,
  FileText,
  FileSpreadsheet,
  FileCode,
  ArrowRightCircle,
  Clock,
  Activity,
  Monitor,
  X,
  Target,
  FilePlus,
  Search,
  Tag,
  Printer,
  FileBox,
  User,
  History,
  Circle,
  PlusCircle,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { schoolsDirectory, type SchoolInfo } from '@/lib/schools-directory'
import { format } from 'date-fns'
import { type BitacoraEntry } from '@/lib/planning-data'
import { db } from '@/lib/firebase'
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where, 
  doc, 
  updateDoc, 
  setDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore'

type Message = {
  id?: string;
  role: 'user' | 'tech' | 'bot';
  content: string;
  timestamp: any;
  senderName?: string;
  fileData?: string; 
  fileName?: string;
  fileType?: string;
}

type SupportRequest = {
  id: string;
  remoteId: string;
  ticketNumber: string;
  timestamp: any;
  status: 'pending' | 'attending';
  requestType?: 'remote' | 'chat';
  chatKey: string;
}

const REGIONAL_OFFICES = [
  "Oficina de Tecnóloga Educativa Ecatepec",
  "Oficina de Tecnóloga Educativa Naucalpan",
  "Oficina de Tecnóloga Educativa Nezahualcóyotl",
  "Oficina de Tecnóloga Educativa Toluca",
  "Oficina de COEES Tultitlan"
];

const FILE_SIZE_LIMIT = 2 * 1024 * 1024; // 2.0 MB

export function HelpDeskInterface({ isPublic = false }: { isPublic?: boolean }) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [remoteId, setRemoteId] = useState('') 
  const [activeTicketNumber, setActiveTicketNumber] = useState<string | null>(null)
  const [queue, setQueue] = useState<SupportRequest[]>([])
  const [formalRequests, setFormalRequests] = useState<BitacoraEntry[]>([])
  const [attendanceHistory, setAttendanceHistory] = useState<BitacoraEntry[]>([])
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null)
  const [selectedFormal, setSelectedFormal] = useState<BitacoraEntry | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [techName, setTechName] = useState('')
  const [mounted, setMounted] = useState(false)
  const [sessionKey, setSessionKey] = useState<string>('')
  const [attendedTodayCount, setAttendedTodayCount] = useState(0)
  
  const [isRemoteHelpRequested, setIsRemoteHelpRequested] = useState(false)
  const [isNewTicketDialogOpen, setIsNewTicketDialogOpen] = useState(false)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [lastGeneratedFolio, setLastGeneratedFolio] = useState('')
  
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [excelFile, setExcelFile] = useState<File | null>(null)
  
  const [requesterName, setRequesterName] = useState('')
  const [requesterEmail, setRequesterEmail] = useState('')
  const [helpTopic, setHelpTopic] = useState('')
  const [ticketCct, setTicketCct] = useState('')
  const [ticketDetail, setTicketDetail] = useState('')

  const [isTrackTicketDialogOpen, setIsTrackTicketDialogOpen] = useState(false)
  const [trackFolioInput, setTrackFolioInput] = useState('')
  const [trackedTicket, setTrackedTicket] = useState<any>(null)
  
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false)
  const [finishSearchTerm, setFinishSearchTerm] = useState('')
  const [finishForm, setFinishForm] = useState({
    cct: '',
    schoolName: '',
    servicio: '',
    municipio: '',
    valle: '',
    oficinaRegionalAtencion: ''
  })
  
  const [pdfToPreview, setPdfToPreview] = useState<string | null>(null)
  
  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([])
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddForm, setQuickAddForm] = useState<SchoolInfo>({
    region: '', valle: 'MEXICO', municipio: '', subsistema: 'FEDERALIZADO', control: 'OFICIAL',
    nivel: 'SECUNDARIA', servicioEducativo: 'SECUNDARIA GENERAL', cct: '', turno: 'MATUTINO',
    nombre: '', domicilio: '', localidad: '', telefono: '', zonaEscolar: '', sector: '',
    director: '', hombres: 0, mujeres: 0, alumnos: 0, grupos: 0, maestros: 0, administrativos: 0,
    aulasExistentes: 0, aulasEnUso: 0, modalidad: 'DES'
  })

  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeChatId = useMemo(() => {
    if (isPublic) return activeTicketNumber || sessionKey;
    return selectedRequest?.ticketNumber || null;
  }, [isPublic, activeTicketNumber, sessionKey, selectedRequest]);

  const generateTurnSessionId = useCallback(() => {
    const now = new Date();
    const dateStr = format(now, 'yyyyMMdd');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `USER-${dateStr}-${random}`;
  }, []);

  const generateSequentialFolio = () => {
    const now = new Date();
    const year = now.getFullYear();
    const cycle = now.getMonth() >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `COEES-${year}-${randomSuffix}`;
  }

  useEffect(() => {
    setMounted(true);
    // Cargar escuelas
    const storedSchools = JSON.parse(localStorage.getItem('schools_master_full_v21') || '[]');
    setAllSchools(storedSchools.length > 0 ? storedSchools : schoolsDirectory);

    if (isPublic) {
      let sKey = sessionStorage.getItem('atres_session_id');
      if (!sKey) {
        sKey = generateTurnSessionId();
        sessionStorage.setItem('atres_session_id', sKey);
      }
      setSessionKey(sKey);
    } else {
      const savedTechName = localStorage.getItem('atres_tech_name') || 'Analista COEES';
      setTechName(savedTechName);
    }
  }, [isPublic, generateTurnSessionId]);

  // Suscribirse a la Bitácora (Nube)
  useEffect(() => {
    if (!mounted) return;
    const q = query(collection(db, 'atres_bitacora'), orderBy('fecha', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allEntries = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as BitacoraEntry[];
      setFormalRequests(allEntries.filter(b => b.status === 'pendiente' || b.status === 'proceso'));
      
      const today = format(new Date(), 'dd/MM/yyyy');
      setAttendanceHistory(allEntries.filter(b => b.status === 'atendido' && b.fecha.includes(today)));
      setAttendedTodayCount(allEntries.filter(b => b.status === 'atendido' && b.fecha.includes(today)).length);
    });
    return () => unsubscribe();
  }, [mounted]);

  // Suscribirse a la Cola de Soporte (Nube)
  useEffect(() => {
    if (!mounted) return;
    const q = query(collection(db, 'atres_support_queue'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const currentQueue = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as SupportRequest[];
      setQueue(currentQueue);
      
      if (isPublic && sessionKey) {
        const myReq = currentQueue.find(r => r.chatKey === sessionKey);
        if (myReq) setActiveTicketNumber(myReq.ticketNumber);
      }
    });
    return () => unsubscribe();
  }, [mounted, isPublic, sessionKey]);

  // Suscribirse al Chat Activo (Nube)
  useEffect(() => {
    if (!mounted || !activeChatId) {
      setMessages([]);
      return;
    }
    const q = query(
      collection(db, 'chat_messages'), 
      where('chatId', '==', activeChatId),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatMsgs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Message[];
      if (chatMsgs.length === 0 && isPublic) {
        setMessages([{ role: 'bot', content: '¡Hola! Soy tu Asistente Virtual COEES. ¿En qué puedo apoyarte hoy con el sistema ATRES o soporte técnico?', timestamp: Date.now() }]);
      } else {
        setMessages(chatMsgs);
      }
    });
    return () => unsubscribe();
  }, [mounted, activeChatId, isPublic]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (msgData?: { content?: string, fileData?: { data: string, name: string, type: string } }) => {
    const textToSend = msgData?.content ?? input;
    if (!textToSend.trim() && !msgData?.fileData) return;
    const chatId = activeChatId || sessionKey;

    // Si es público y no está en la cola, agregarlo
    if (isPublic) {
      const alreadyInQueue = queue.find(r => r.chatKey === sessionKey);
      if (!alreadyInQueue) {
        await addDoc(collection(db, 'atres_support_queue'), {
          remoteId: '',
          ticketNumber: sessionKey,
          timestamp: serverTimestamp(),
          status: 'pending',
          requestType: 'chat',
          chatKey: sessionKey
        });
      }
      
      const lowerInput = textToSend.toLowerCase();
      if (['office', 'windows', 'controlador', 'driver', 'impresora', 'imprimir'].some(word => lowerInput.includes(word))) {
        setIsRemoteHelpRequested(true);
      }
    }

    await addDoc(collection(db, 'chat_messages'), {
      chatId,
      role: isPublic ? 'user' : 'tech',
      content: textToSend,
      timestamp: serverTimestamp(),
      senderName: !isPublic ? techName : undefined,
      fileData: msgData?.fileData?.data || null,
      fileName: msgData?.fileData?.name || null,
      fileType: msgData?.fileData?.type || null
    });

    !msgData?.content && setInput('');
  }

  const handleRequestRemoteSupport = async () => {
    if (remoteId.length < 9) {
      toast({ variant: "destructive", title: "ID Inválido" });
      return;
    }
    
    const turn = activeTicketNumber || generateTurnSessionId();
    const existing = queue.find(r => r.chatKey === sessionKey);

    if (existing) {
      await updateDoc(doc(db, 'atres_support_queue', existing.id), {
        remoteId,
        requestType: 'remote',
        status: 'pending'
      });
    } else {
      await addDoc(collection(db, 'atres_support_queue'), {
        remoteId,
        ticketNumber: turn,
        timestamp: serverTimestamp(),
        status: 'pending',
        requestType: 'remote',
        chatKey: sessionKey
      });
    }

    await handleSendMessage({ content: `SOLICITUD DE APOYO REMOTO - ID ANYDESK: ${remoteId}` });
    toast({ title: "Soporte Solicitado", description: `Turno: ${turn}` });
  }

  const handleSendNewTicketRequest = async () => {
    if (!requesterName || !requesterEmail || !helpTopic || !ticketCct || !ticketDetail) {
      toast({ variant: "destructive", title: "Datos Incompletos" });
      return;
    }
    
    try {
      const folio = generateSequentialFolio();
      let pdfContent = "";
      let excelContent = "";
      
      if (pdfFile) pdfContent = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(pdfFile); });
      if (excelFile) excelContent = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(excelFile); });
      
      const school = allSchools.find(s => s.cct === ticketCct.toUpperCase());
      await addDoc(collection(db, 'atres_bitacora'), {
        folio,
        cct: ticketCct.toUpperCase(),
        schoolName: school?.nombre || "CCT NO IDENTIFICADO",
        servicio: `${helpTopic.toUpperCase()}: ${ticketDetail}`,
        oficina: "MESA DE AYUDA",
        fecha: format(new Date(), 'dd/MM/yyyy HH:mm'),
        tecnico: "POR ASIGNAR",
        status: 'pendiente',
        pdfData: pdfContent || null,
        pdfName: pdfFile?.name || null,
        excelData: excelContent || null,
        excelName: excelFile?.name || null,
        requesterName,
        requesterEmail,
        helpTopic,
        ticketDetail
      });

      setLastGeneratedFolio(folio);
      setIsConfirmationOpen(true);
      setIsNewTicketDialogOpen(false);
      resetRequestForm();
      toast({ title: "Solicitud enviada a la nube" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error al enviar", description: e.message });
    }
  }

  const resetRequestForm = () => {
    setPdfFile(null); setExcelFile(null);
    setRequesterName(''); setRequesterEmail(''); setHelpTopic(''); setTicketCct(''); setTicketDetail('');
  }

  const handleFinishConfirm = async () => {
    if (!finishForm.cct || !finishForm.servicio || !finishForm.oficinaRegionalAtencion) {
      toast({ variant: "destructive", title: "Faltan datos" });
      return;
    }
    
    const folio = selectedRequest?.ticketNumber || selectedFormal?.folio;
    if (!folio) return;

    // Actualizar Bitácora
    const targetBitacora = selectedFormal || formalRequests.find(b => b.folio === folio);
    if (targetBitacora?.id) {
      await updateDoc(doc(db, 'atres_bitacora', targetBitacora.id), {
        status: 'atendido',
        servicio: finishForm.servicio,
        tecnico: techName,
        oficina: finishForm.oficinaRegionalAtencion,
        schoolName: finishForm.schoolName
      });
    }

    // Eliminar de la cola si existe
    if (selectedRequest?.id) {
      await deleteDoc(doc(db, 'atres_support_queue', selectedRequest.id));
    }

    setIsFinishDialogOpen(false); setSelectedRequest(null); setSelectedFormal(null);
    toast({ title: "Atención Finalizada en la Nube" });
  }

  const getFileIcon = (type: string) => {
    if (type?.includes('pdf')) return <FileText className="h-4 w-4 text-rose-500" />
    if (type?.includes('excel') || type?.includes('spreadsheet')) return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
    return <FileCode className="h-4 w-4 text-slate-400" />
  }

  const downloadFile = (data: string, name: string) => { const link = document.createElement('a'); link.href = data; link.download = name; link.click(); }
  const printFile = (data: string) => { const win = window.open(); if (!win) return; win.document.write(`<iframe src="${data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`); }

  const showLeftColumn = !isPublic || (isPublic && isRemoteHelpRequested);

  if (!mounted) return null;

  return (
    <div className={cn(
      "flex flex-1 w-full flex-col md:flex-row border border-white/40 overflow-hidden transition-all duration-700", 
      isPublic ? "rounded-[3rem] shadow-2xl bg-white/40 h-[calc(100vh-140px)]" : "bg-[#f8f5f0] h-full"
    )}>
      {showLeftColumn && (
        <div className="w-full md:w-[320px] flex flex-col p-4 shrink-0 transition-all duration-500 relative z-20 overflow-hidden bg-white border-r border-slate-100 shadow-xl animate-in slide-in-from-left duration-500">
           {isPublic ? (
             <div className="flex-1 flex flex-col gap-6">
                <div className="bg-[#9f2241] p-6 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Monitor className="h-20 w-20" /></div>
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Apoyo Remoto</Label>
                  <h3 className="text-lg font-black uppercase mt-1 leading-none">AnyDesk / TeamViewer</h3>
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-white/60 pl-1">ID de 9 Dígitos</Label>
                      <Input 
                        placeholder="000 000 000" 
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 font-mono text-center text-xl h-12 rounded-2xl" 
                        value={remoteId} 
                        onChange={e => setRemoteId(e.target.value.replace(/\D/g,''))} 
                        maxLength={9} 
                      />
                    </div>
                    <Button 
                      onClick={handleRequestRemoteSupport} 
                      disabled={remoteId.length < 9}
                      className="w-full bg-white text-[#9f2241] hover:bg-[#f8f8f8] font-black uppercase text-[11px] h-12 rounded-2xl shadow-xl transition-all"
                    >
                      Solicitar Soporte
                    </Button>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                   <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><ArrowRightCircle className="h-4 w-4 text-[#B38E5D]" /> Guía de Soporte</div>
                   <div className="space-y-3">
                      {["Descargue AnyDesk en su equipo.", "Copie su ID personal de 9 dígitos.", "Péguelo en el campo superior.", "Haga clic en 'Solicitar Soporte'."].map((text, idx) => (
                        <div key={`guide-${idx}`} className="flex gap-4 items-start">
                          <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center text-[9px] font-black text-[#9f2241] shadow-sm shrink-0">{idx + 1}</div>
                          <div className="text-[10px] font-bold text-slate-600 leading-tight uppercase pt-0.5">{text}</div>
                        </div>
                      ))}
                   </div>
                </div>
                <Button variant="ghost" onClick={() => setIsRemoteHelpRequested(false)} className="mt-auto text-[10px] font-black uppercase text-slate-400 gap-2"><X className="h-4 w-4" /> Cerrar Panel</Button>
             </div>
           ) : (
             <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                <div 
                  onClick={() => { setShowHistory(true); setSelectedFormal(null); setSelectedRequest(null); }}
                  className="bg-primary p-4 rounded-[1.5rem] text-white shadow-xl relative overflow-hidden shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all group"
                >
                  <div className="absolute -right-2 -top-2 opacity-10 rotate-12 group-hover:rotate-45 transition-transform"><Activity className="h-16 w-16" /></div>
                  <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Servicios de Hoy</p>
                  <div className="flex items-end justify-between mt-1">
                      <div className="flex items-end gap-2">
                        <span className="text-4xl font-black leading-none">{attendedTodayCount}</span>
                        <Target className="h-4 w-4 mb-1 text-accent" />
                      </div>
                      <Badge variant="secondary" className="bg-white/20 text-white border-none text-[8px] font-black uppercase px-2 h-5">VER LISTA</Badge>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-6 overflow-hidden min-h-0">
                   <div className="space-y-3 flex flex-col h-[50%] overflow-hidden">
                     <div className="text-[11px] font-black uppercase text-primary border-b-2 border-primary/10 pb-1 flex items-center justify-between">
                       Solicitudes (Bitácora)
                       <Badge className="bg-primary text-white text-[10px] px-2 h-5 rounded-full">{formalRequests.length}</Badge>
                     </div>
                     <ScrollArea className="flex-1">
                       <div className="space-y-2 pr-3">
                         {formalRequests.map((req) => (
                           <button key={`formal-${req.id}`} onClick={() => { setSelectedFormal(req); setSelectedRequest(null); setShowHistory(false); }} className={cn("w-full p-3 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between group", selectedFormal?.id === req.id ? "bg-primary border-primary shadow-lg" : "bg-white border-slate-100 hover:bg-slate-50 shadow-sm")}>
                             <div className="flex flex-col">
                               <span className={cn("text-[9px] font-black", selectedFormal?.id === req.id ? "text-white/60" : "text-primary")}>{req.folio}</span>
                               <span className={cn("text-[11px] font-black truncate max-w-[140px]", selectedFormal?.id === req.id ? "text-white" : "text-slate-700")}>{req.schoolName}</span>
                             </div>
                             <FilePlus className={cn("h-4 w-4", selectedFormal?.id === req.id ? "text-white" : "text-slate-300")} />
                           </button>
                         ))}
                       </div>
                     </ScrollArea>
                   </div>

                   <div className="space-y-3 flex flex-col h-[50%] overflow-hidden">
                     <div className="text-[11px] font-black uppercase text-accent border-b-2 border-primary/10 pb-1 flex items-center justify-between">
                       Mesa Operativa (Live)
                       <Badge className="bg-accent text-white text-[10px] px-2 h-5 rounded-full">{queue.length}</Badge>
                     </div>
                     <ScrollArea className="flex-1">
                       <div className="space-y-2 pr-3">
                         {queue.map((req) => (
                           <button key={`queue-${req.id}`} onClick={() => { setSelectedRequest(req); setSelectedFormal(null); setShowHistory(false); }} className={cn("w-full p-3 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between group", selectedRequest?.id === req.id ? "bg-accent border-accent shadow-lg" : "bg-white border-slate-100 hover:bg-slate-50 shadow-sm")}>
                             <div className="flex flex-col">
                               <span className={cn("text-[9px] font-black", selectedRequest?.id === req.id ? "text-white/60" : "text-accent")}>{req.ticketNumber}</span>
                               <span className={cn("text-[11px] font-black", selectedRequest?.id === req.id ? "text-white" : "text-slate-700")}>{req.requestType?.toUpperCase() || 'LIVE'}</span>
                             </div>
                             <ChevronRight className={cn("h-4 w-4", selectedRequest?.id === req.id ? "text-white" : "text-slate-300")} />
                           </button>
                         ))}
                       </div>
                     </ScrollArea>
                   </div>
                </div>
             </div>
           )}
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden relative bg-white">
        {!isPublic && showHistory ? (
          <div className="flex-1 flex flex-col p-8 animate-in fade-in duration-500 bg-slate-50/30">
             <div className="max-w-5xl mx-auto w-full flex flex-col h-full space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                   <h2 className="text-2xl font-black text-primary uppercase flex items-center gap-3"><History className="h-8 w-8 text-accent" /> Servicios de Hoy</h2>
                   <button onClick={() => setShowHistory(false)} className="px-6 h-10 rounded-xl font-black text-[10px] uppercase border shadow-sm hover:bg-slate-50 transition-all">CERRAR</button>
                </div>
                <ScrollArea className="flex-1 border rounded-[2.5rem] bg-white shadow-2xl">
                   <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {attendanceHistory.map((hist) => (
                        <div key={hist.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                           <div className="flex justify-between items-start mb-4">
                              <Badge className="bg-primary/5 text-primary border-primary/10 font-mono">{hist.folio}</Badge>
                              <span className="text-[9px] font-black text-slate-300">{hist.fecha}</span>
                           </div>
                           <h4 className="text-[13px] font-black text-slate-800 uppercase truncate">{hist.schoolName}</h4>
                           <div className="bg-slate-50 p-4 rounded-2xl border my-4 italic text-[11px] font-semibold text-slate-600">"{hist.servicio}"</div>
                           <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                              <span className="text-[10px] font-black text-slate-500 uppercase">{hist.tecnico}</span>
                              <div className="flex items-center gap-1 text-emerald-500 text-[8px] font-black uppercase"><CheckCircle2 className="h-3.5 w-3.5" /> FINALIZADO</div>
                           </div>
                        </div>
                      ))}
                   </div>
                </ScrollArea>
             </div>
          </div>
        ) : !isPublic && !selectedRequest && !selectedFormal ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6 opacity-30">
            <MessageSquare className="h-16 w-16" />
            <h3 className="text-3xl font-black uppercase">Panel de Analista</h3>
          </div>
        ) : (
          <>
            <header className={cn("px-8 py-4 flex justify-between items-center z-10 shrink-0 border-b", isPublic ? "bg-white/60 backdrop-blur-3xl" : "bg-white shadow-sm")}>
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-2xl bg-[#9f2241] text-white flex items-center justify-center shadow-2xl relative overflow-hidden group">
                  {isPublic ? <Bot className="h-7 w-7 relative z-10" /> : <UserCog className="h-7 w-7 relative z-10" />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase leading-none">{isPublic ? "Mesa de Ayuda ATRES" : "Centro de Control Operativo"}</h2>
                  <div className="flex items-center gap-3 mt-1.5">
                    <Badge variant="outline" className="text-[9px] font-mono border-primary/20 text-primary bg-primary/5">{activeChatId}</Badge>
                    {isPublic && (
                      <button onClick={() => setIsNewTicketDialogOpen(true)} className="flex items-center gap-2 bg-[#B38E5D] hover:bg-[#a67d4a] px-4 h-9 rounded-xl shadow-lg text-white font-black uppercase text-[9px]">
                        <FilePlus className="h-4 w-4" /> Solicitar Soporte
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {!isPublic && (selectedRequest || selectedFormal) && (
                <Button onClick={() => {
                  setFinishForm({
                    cct: selectedFormal?.cct || '',
                    schoolName: selectedFormal?.schoolName || '',
                    servicio: selectedFormal?.servicio || '',
                    municipio: '', valle: '', oficinaRegionalAtencion: ''
                  });
                  setIsFinishDialogOpen(true);
                }} className="btn-institutional h-11 px-8 text-[11px] gap-2 shadow-2xl"><CheckCircle2 className="h-5 w-5" /> CONCLUIR</Button>
              )}
            </header>
            <ScrollArea className="flex-1 px-8 py-10">
              <div className="max-w-4xl mx-auto space-y-8 min-h-full flex flex-col justify-end pb-8">
                {messages.map((msg, i) => {
                  const isMe = (isPublic && msg.role === 'user') || (!isPublic && msg.role === 'tech');
                  return (
                    <div key={msg.id || i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-4 duration-500", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn("flex gap-4 max-w-[80%]", isMe ? "flex-row-reverse" : "flex-row")}>
                        <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xl border-4 border-white", msg.role === 'user' ? "bg-[#B38E5D] text-white" : msg.role === 'tech' ? "bg-[#9f2241] text-white" : "bg-slate-800 text-white")}>
                          {msg.role === 'user' ? <GraduationCap className="h-5 w-5" /> : msg.role === 'tech' ? <UserCog className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                        </div>
                        <div className="space-y-1.5">
                          <div className={cn("p-4 rounded-3xl text-sm font-semibold shadow-2xl border leading-relaxed", isMe ? (msg.role === 'user' ? "bg-[#B38E5D] text-white rounded-tr-none border-transparent" : "bg-[#9f2241] text-white rounded-tr-none border-transparent") : msg.role === 'bot' ? "bg-slate-800 text-white rounded-tl-none border-transparent" : "bg-white text-slate-700 rounded-tl-none border-slate-100")}>
                            {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                            {msg.fileData && (
                              <div className="mt-4 p-4 rounded-2xl border flex items-center gap-4 cursor-pointer bg-black/5" onClick={() => downloadFile(msg.fileData!, msg.fileName!)}>
                                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-lg">{getFileIcon(msg.fileType || '')}</div>
                                <div className="flex-1 min-w-0"><p className="text-[10px] font-black truncate uppercase">{msg.fileName}</p></div>
                                <Download className="h-4 w-4 opacity-50" />
                              </div>
                            )}
                            <div className="text-[8px] mt-3 font-black uppercase flex items-center gap-2 opacity-50">
                              <Clock className="h-3 w-3" /> {msg.timestamp?.seconds ? format(new Date(msg.timestamp.seconds * 1000), 'HH:mm') : '--:--'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
            <footer className="p-6 bg-white/40 backdrop-blur-3xl border-t border-white/40 shrink-0">
              <div className="max-w-4xl mx-auto flex gap-4">
                <div className="relative flex-1 group">
                  <Input placeholder={isPublic ? "Describa su problema técnico..." : "Escriba una respuesta oficial..."} className="h-14 rounded-2xl bg-white border-2 border-slate-100 px-8 pr-14 font-semibold shadow-inner focus:ring-8 focus:ring-[#9f2241]/5 focus:border-[#9f2241]/20 text-sm transition-all" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
                  <button onClick={() => fileInputRef.current?.click()} className="absolute right-5 top-3.5 h-7 w-7 text-slate-300 hover:text-primary transition-all flex items-center justify-center rounded-xl hover:bg-slate-50"><Paperclip className="h-5 w-5" /></button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                </div>
                <button onClick={() => handleSendMessage()} disabled={!input.trim()} className="h-14 w-14 rounded-2xl bg-[#9f2241] hover:bg-[#801a34] text-white shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center"><Send className="h-6 w-6" /></button>
              </div>
            </footer>
          </>
        )}
      </div>

      <Dialog open={isNewTicketDialogOpen} onOpenChange={setIsNewTicketDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[3rem] p-0 overflow-hidden bg-white max-h-[95vh] flex flex-col">
          <DialogHeader className="p-8 bg-[#9f2241] text-white">
            <DialogTitle className="uppercase font-black text-2xl">Solicitud de Servicio ATRES</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-10 space-y-8">
             <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase text-slate-400">Datos de Identificación</Label>
               <Input placeholder="NOMBRE COMPLETO..." className="h-12 bg-slate-50 border-none rounded-xl text-xs font-black uppercase shadow-inner" value={requesterName} onChange={e => setRequesterName(e.target.value.toUpperCase())} />
               <Input placeholder="CORREO INSTITUCIONAL..." className="h-12 bg-slate-50 border-none rounded-xl text-xs font-bold shadow-inner" value={requesterEmail} onChange={e => setRequesterEmail(e.target.value.toLowerCase())} />
               <Input placeholder="CCT DEL PLANTEL..." className="h-12 bg-slate-50 border-none rounded-xl text-sm font-mono font-black uppercase shadow-inner" value={ticketCct} onChange={e => setTicketCct(e.target.value.toUpperCase())} maxLength={10} />
             </div>
             <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase text-slate-400">Detalles Técnicos</Label>
               <Select value={helpTopic} onValueChange={setHelpTopic}><SelectTrigger className="h-12 bg-slate-50 rounded-xl text-xs font-black"><SelectValue placeholder="TEMA DEL SOPORTE..." /></SelectTrigger><SelectContent><SelectItem value="cuenta">Cuentas Institucionales</SelectItem><SelectItem value="atres">Sistema ATRES</SelectItem><SelectItem value="hardware">Soporte Hardware</SelectItem><SelectItem value="redes">Red Local / Edusat</SelectItem></SelectContent></Select>
               <Textarea placeholder="DESCRIBA SU SOLICITUD..." className="h-24 bg-slate-50 border-none rounded-xl p-4 text-xs font-semibold shadow-inner" value={ticketDetail} onChange={e => setTicketDetail(e.target.value.toUpperCase())} />
             </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4"><Button variant="ghost" onClick={() => setIsNewTicketDialogOpen(false)}>CANCELAR</Button><Button onClick={handleSendNewTicketRequest} className="btn-institutional h-12 px-12">ENVIAR SOLICITUD</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[3rem] p-10 bg-white text-center">
            <div className="h-20 w-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="h-10 w-10 text-emerald-500" /></div>
            <DialogTitle className="text-2xl font-black uppercase">Folio Generado</DialogTitle>
            <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-primary/10 shadow-inner my-8">
               <p className="text-[10px] font-black text-primary uppercase mb-2">FOLIO ATRES</p>
               <h4 className="text-3xl font-black text-slate-800 font-mono tracking-tighter">{lastGeneratedFolio}</h4>
            </div>
            <Button onClick={() => setIsConfirmationOpen(false)} className="w-full btn-institutional h-14">ACEPTAR</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-[#9f2241] text-white">
            <DialogTitle className="uppercase font-black text-lg">Concluir Turno</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary">Identificar Plantel</Label>
              <Input placeholder="CCT O NOMBRE..." className="h-10 bg-slate-50 border-none rounded-xl text-[11px] font-black uppercase px-4 shadow-inner" value={finishSearchTerm} onChange={e => setFinishSearchTerm(e.target.value)} />
              {finishForm.cct && <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 animate-in zoom-in-95"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><div className="flex-1 min-w-0"><h4 className="text-[10px] font-black text-slate-800 uppercase truncate">{finishForm.schoolName}</h4><p className="text-[8px] font-mono text-emerald-700">{finishForm.cct}</p></div></div>}
            </div>
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase text-slate-400">Oficina Regional</Label>
              <Select value={finishForm.oficinaRegionalAtencion} onValueChange={v => setFinishForm({...finishForm, oficinaRegionalAtencion: v})}><SelectTrigger className="h-10 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase shadow-inner"><SelectValue placeholder="ELEGIR..." /></SelectTrigger><SelectContent>{REGIONAL_OFFICES.map(off => <SelectItem key={`off-${off}`} value={off} className="text-[10px] font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>)}</SelectContent></Select>
              <Label className="text-[10px] font-black uppercase text-primary">Servicio Realizado</Label>
              <Textarea placeholder="ACCIONES TÉCNICAS..." className="h-24 bg-slate-50 border-none rounded-2xl p-4 text-[11px] font-semibold shadow-inner focus:bg-white transition-all" value={finishForm.servicio} onChange={e => setFinishForm({...finishForm, servicio: e.target.value.toUpperCase()})} />
            </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-4"><Button variant="ghost" onClick={() => setIsFinishDialogOpen(false)}>CANCELAR</Button><Button onClick={handleFinishConfirm} className="btn-institutional h-12 px-10 text-[11px] gap-2"><Save className="h-5 w-5" /> REGISTRAR CIERRE</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
