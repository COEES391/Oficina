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
  Plus,
  ArrowRightCircle,
  Clock,
  Activity,
  Monitor,
  ShieldCheck,
  Circle,
  School,
  X,
  Target,
  FilePlus,
  Search,
  Mail,
  Tag,
  Headset
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { schoolsDirectory } from '@/lib/schools-directory'
import { format } from 'date-fns'

type Message = {
  role: 'user' | 'tech' | 'bot';
  content: string;
  timestamp: number;
  senderName?: string;
  fileData?: string; 
  fileName?: string;
  fileType?: string;
}

type SupportRequest = {
  remoteId: string;
  ticketNumber: string;
  timestamp: number;
  status: 'pending' | 'attending';
  requestType?: 'remote' | 'chat';
  chatKey: string;
}

type FormalRequest = {
  id: string;
  requesterName: string;
  requesterEmail: string;
  helpTopic: string;
  cct: string;
  detail: string;
  timestamp: number;
  status: 'recibida' | 'en proceso' | 'atendida';
}

type TechFile = {
  id: string;
  name: string;
  data: string;
  type: string;
  lastUpdated: number;
}

const REGIONAL_OFFICES = [
  "Oficina de Tecnóloga Educativa Ecatepec",
  "Oficina de Tecnóloga Educativa Naucalpan",
  "Oficina de Tecnóloga Educativa Nezahualcóyotl",
  "Oficina de Tecnóloga Educativa Toluca",
  "Oficina de COEES Tultitlan"
];

export function HelpDeskInterface({ isPublic = false }: { isPublic?: boolean }) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [remoteId, setRemoteId] = useState('') 
  const [activeTicketNumber, setActiveTicketNumber] = useState<string | null>(null)
  const [queue, setQueue] = useState<SupportRequest[]>([])
  const [formalRequests, setFormalRequests] = useState<FormalRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null)
  const [selectedFormal, setSelectedFormal] = useState<FormalRequest | null>(null)
  const [techName, setTechName] = useState('')
  const [mounted, setMounted] = useState(false)
  const [sessionKey, setSessionKey] = useState<string>('')
  const [attendedTodayCount, setAttendedTodayCount] = useState(0)
  
  const [isRemoteHelpRequested, setIsRemoteHelpRequested] = useState(false)

  const [isNewTicketDialogOpen, setIsNewTicketDialogOpen] = useState(false)
  const [isResponsivaOpen, setIsResponsivaOpen] = useState(false)
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
  
  const [techLibrary, setTechLibrary] = useState<TechFile[]>([])
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
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)

  const activeChatId = useMemo(() => {
    if (isPublic) return activeTicketNumber || sessionKey;
    return selectedRequest?.ticketNumber || null;
  }, [isPublic, activeTicketNumber, sessionKey, selectedRequest]);

  const generateTurnSessionId = useCallback(() => {
    const now = new Date();
    const dateStr = format(now, 'yyyyMMdd');
    const counterKey = `atres_user_counter_${dateStr}`;
    const lastCounter = parseInt(localStorage.getItem(counterKey) || '0', 10);
    const nextCounter = lastCounter + 1;
    localStorage.setItem(counterKey, nextCounter.toString());
    return `USER-${nextCounter.toString().padStart(6, '0')}`;
  }, []);

  const generateSequentialFolio = () => {
    const now = new Date();
    const year = now.getFullYear();
    const cycle = now.getMonth() >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    const counterKey = `coees_folio_counter_${cycle}`;
    const lastCounter = parseInt(localStorage.getItem(counterKey) || '0', 10);
    const nextCounter = lastCounter + 1;
    localStorage.setItem(counterKey, nextCounter.toString());
    return `COEES-${nextCounter.toString().padStart(5, '0')}`;
  }

  const updateAttendedCount = useCallback(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const progs = JSON.parse(localStorage.getItem('programs_full_v24') || '[]');
    const count = progs.filter((p: any) => p.name === 'ATRES' && p.date === today).length;
    setAttendedTodayCount(count);
  }, []);

  const syncFormalRequests = useCallback(() => {
    const stored = localStorage.getItem('coees_formal_requests')
    setFormalRequests(stored ? JSON.parse(stored) : [])
  }, [])

  const syncQueue = useCallback(() => {
    const rawQueue = localStorage.getItem('atres_support_queue')
    const currentQueue: SupportRequest[] = rawQueue ? JSON.parse(rawQueue) : []
    setQueue(currentQueue)
  }, [])

  const syncChat = useCallback(() => {
    if (!activeChatId) {
      setMessages([])
      return
    }
    const historyKey = `atres_chat_${activeChatId}`
    const history = localStorage.getItem(historyKey)
    if (history) {
      setMessages(JSON.parse(history))
    } else {
      const initial: Message[] = [{ role: 'bot', content: '¡Hola! Soy tu Asistente Virtual COEES. ¿En qué puedo apoyarte con el sistema ATRES o soporte técnico hoy?', timestamp: Date.now() }]
      setMessages(initial)
      localStorage.setItem(historyKey, JSON.stringify(initial))
    }
  }, [activeChatId])

  useEffect(() => {
    if (isPublic) {
      let sKey = sessionStorage.getItem('atres_session_id')
      if (!sKey) {
        sKey = generateTurnSessionId()
        sessionStorage.setItem('atres_session_id', sKey)
      }
      setSessionKey(sKey)
    } else {
      const savedTechName = localStorage.getItem('atres_tech_name')
      if (savedTechName) setTechName(savedTechName)
      const savedLibrary = localStorage.getItem('atres_tech_library')
      if (savedLibrary) setTechLibrary(JSON.parse(savedLibrary))
      updateAttendedCount();
      syncFormalRequests();
    }
  }, [isPublic, generateTurnSessionId, updateAttendedCount, syncFormalRequests])

  useEffect(() => {
    setMounted(true)
    syncQueue()
    syncChat()
    if (!isPublic) syncFormalRequests()
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'atres_support_queue') syncQueue()
      if (e.key === 'coees_formal_requests') syncFormalRequests()
      if (activeChatId && e.key === `atres_chat_${activeChatId}`) syncChat()
      if (e.key === 'programs_full_v24' && !isPublic) updateAttendedCount()
    };
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [syncQueue, syncChat, activeChatId, isPublic, updateAttendedCount, syncFormalRequests])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isPublic && !isRemoteHelpRequested) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === 'user') {
        const text = lastMsg.content.toLowerCase();
        if (text.includes('office') || text.includes('windows')) {
          setIsRemoteHelpRequested(true);
        }
      }
    }
  }, [messages, isPublic, isRemoteHelpRequested]);

  const handleSendMessage = async (fileData?: { data: string, name: string, type: string }) => {
    if (!input.trim() && !fileData) return
    let updatedActiveChatId = activeChatId || sessionKey;

    if (isPublic) {
      if (input.toLowerCase().includes('office') || input.toLowerCase().includes('windows')) {
        setIsRemoteHelpRequested(true);
      }
      
      const rawQueue = localStorage.getItem('atres_support_queue');
      const currentQueue: SupportRequest[] = JSON.parse(rawQueue || '[]');
      const alreadyInQueue = currentQueue.find(r => r.chatKey === sessionKey);
      
      if (!alreadyInQueue) {
        const newReq: SupportRequest = {
          remoteId: '',
          ticketNumber: sessionKey,
          timestamp: Date.now(),
          status: 'pending',
          requestType: 'chat',
          chatKey: sessionKey
        };
        const updatedQueue = [...currentQueue, newReq];
        localStorage.setItem('atres_support_queue', JSON.stringify(updatedQueue));
        window.dispatchEvent(new StorageEvent('storage', { key: 'atres_support_queue', newValue: JSON.stringify(updatedQueue), storageArea: localStorage }));
      }
    }

    const newMessage: Message = { role: isPublic ? 'user' : 'tech', content: input, timestamp: Date.now(), senderName: !isPublic ? techName : undefined, fileData: fileData?.data, fileName: fileData?.name, fileType: fileData?.type }
    const historyKey = `atres_chat_${updatedActiveChatId}`
    const currentMessages = JSON.parse(localStorage.getItem(historyKey) || '[]')
    const updatedMessages = [...currentMessages, newMessage]
    localStorage.setItem(historyKey, JSON.stringify(updatedMessages))
    setMessages(updatedMessages)
    window.dispatchEvent(new StorageEvent('storage', { key: historyKey, newValue: JSON.stringify(updatedMessages), storageArea: localStorage }))

    input && setInput('')
  }

  const handleRequestRemoteSupport = () => {
    if (remoteId.length < 9) { toast({ variant: "destructive", title: "ID Inválido", description: "Ingrese su ID de 9 dígitos." }); return; }
    const turn = generateSequentialFolio();
    const newReq: SupportRequest = { remoteId, ticketNumber: turn, timestamp: Date.now(), status: 'pending', requestType: 'remote', chatKey: sessionKey }
    const rawQueue = localStorage.getItem('atres_support_queue'); const currentQueue = JSON.parse(rawQueue || '[]');
    localStorage.setItem('atres_support_queue', JSON.stringify([...currentQueue, newReq]));
    window.dispatchEvent(new StorageEvent('storage', { key: 'atres_support_queue', newValue: JSON.stringify([...currentQueue, newReq]), storageArea: localStorage }))
    setActiveTicketNumber(turn);
    toast({ title: "Soporte Solicitado", description: `Su turno es el: ${turn}` });
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleSendMessage({ data: ev.target?.result as string, name: file.name, type: file.type })
    reader.readAsDataURL(file); e.target.value = '';
  }

  const handleLibraryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const newFile: TechFile = { id: `FILE-${Date.now()}`, name: file.name, data: ev.target?.result as string, type: file.type, lastUpdated: Date.now() }
      const updated = [newFile, ...techLibrary]; setTechLibrary(updated); localStorage.setItem('atres_tech_library', JSON.stringify(updated))
    }
    reader.readAsDataURL(file); e.target.value = '';
  }

  const handleTrackFolio = () => {
    if (!trackFolioInput) return;
    const progs = JSON.parse(localStorage.getItem('programs_full_v24') || '[]');
    const liveQueue = JSON.parse(localStorage.getItem('atres_support_queue') || '[]');
    const formal = JSON.parse(localStorage.getItem('coees_formal_requests') || '[]');
    
    const concluded = progs.find((p: any) => p.id === trackFolioInput.toUpperCase());
    if (concluded) { setTrackedTicket({ ...concluded, displayStatus: 'Atendida' }); return; }
    
    const inQueue = liveQueue.find((r: any) => r.ticketNumber === trackFolioInput.toUpperCase());
    if (inQueue) { setTrackedTicket({ ...inQueue, displayStatus: inQueue.status === 'attending' ? 'En Proceso' : 'Recibida / Pendiente' }); return; }
    
    const inFormal = formal.find((f: any) => f.id === trackFolioInput.toUpperCase());
    if (inFormal) { setTrackedTicket({ ...inFormal, displayStatus: inFormal.status === 'en proceso' ? 'En Proceso' : 'Recibida (Observación)' }); return; }

    toast({ variant: "destructive", title: "Folio no encontrado" });
    setTrackedTicket(null);
  }

  const handleSendNewTicketRequest = () => {
    if (!requesterName || !requesterEmail || !helpTopic || !ticketCct || !ticketDetail) {
      toast({ variant: "destructive", title: "Datos Incompletos", description: "Todos los campos son obligatorios." });
      return;
    }
    const folio = generateSequentialFolio();
    
    const newFormalReq: FormalRequest = {
      id: folio, requesterName, requesterEmail, helpTopic, cct: ticketCct, detail: ticketDetail, timestamp: Date.now(), status: 'recibida'
    }

    const stored = JSON.parse(localStorage.getItem('coees_formal_requests') || '[]')
    const updated = [newFormalReq, ...stored]
    localStorage.setItem('coees_formal_requests', JSON.stringify(updated))
    window.dispatchEvent(new StorageEvent('storage', { key: 'coees_formal_requests', newValue: JSON.stringify(updated), storageArea: localStorage }))

    setLastGeneratedFolio(folio);
    setIsConfirmationOpen(true);
    setIsNewTicketDialogOpen(false);
    
    setPdfFile(null); setExcelFile(null);
    setRequesterName(''); setRequesterEmail(''); setHelpTopic(''); setTicketCct(''); setTicketDetail('');
  }

  const handleFinishConfirm = () => {
    if (!finishForm.cct || !finishForm.servicio || !finishForm.oficinaRegionalAtencion) { toast({ variant: "destructive", title: "Faltan datos obligatorios" }); return; }
    const folio = selectedRequest?.ticketNumber || selectedFormal?.id;
    if (!folio) return;

    const progs = JSON.parse(localStorage.getItem('programs_full_v24') || '[]')
    const newRec = { id: folio, name: 'ATRES', cct: finishForm.cct, schoolName: finishForm.schoolName, municipio: finishForm.municipio, valle: finishForm.valle, status: 'concluido', date: format(new Date(), 'yyyy-MM-dd'), progress: 100, asistentes: [], observaciones: finishForm.servicio, tecnicos: techName, oficinaRegionalAtencion: finishForm.oficinaRegionalAtencion }
    const updatedProgs = [newRec, ...progs];
    localStorage.setItem('programs_full_v24', JSON.stringify(updatedProgs))
    window.dispatchEvent(new StorageEvent('storage', { key: 'programs_full_v24', newValue: JSON.stringify(updatedProgs), storageArea: localStorage }));
    
    if (selectedRequest) {
      const rawQueue = localStorage.getItem('atres_support_queue')
      const updatedQueue = JSON.parse(rawQueue || '[]').filter((r: any) => r.ticketNumber !== folio);
      localStorage.setItem('atres_support_queue', JSON.stringify(updatedQueue))
      window.dispatchEvent(new StorageEvent('storage', { key: 'atres_support_queue', newValue: JSON.stringify(updatedQueue), storageArea: localStorage }))
    } else if (selectedFormal) {
      const formal = JSON.parse(localStorage.getItem('coees_formal_requests') || '[]')
      const updatedFormal = formal.filter((f: any) => f.id !== folio);
      localStorage.setItem('coees_formal_requests', JSON.stringify(updatedFormal))
      window.dispatchEvent(new StorageEvent('storage', { key: 'coees_formal_requests', newValue: JSON.stringify(updatedFormal), storageArea: localStorage }))
    }

    setIsFinishDialogOpen(false); setSelectedRequest(null); setSelectedFormal(null); syncQueue(); syncFormalRequests(); updateAttendedCount();
    toast({ title: "Atención Registrada" });
  }

  const getFileIcon = (type: string) => {
    if (type.includes('word')) return <FileText className="h-4 w-4 text-blue-500" />
    if (type.includes('excel')) return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-rose-500" />
    return <FileCode className="h-4 w-4 text-slate-400" />
  }

  const downloadFile = (data: string, name: string) => { const link = document.createElement('a'); link.href = data; link.download = name; link.click(); }

  const showLeftColumn = !isPublic || (isPublic && isRemoteHelpRequested);

  if (!mounted) return null

  return (
    <div className={cn(
      "flex flex-1 w-full flex-col md:flex-row border border-white/40 overflow-hidden transition-all duration-700", 
      isPublic ? "rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.15)] bg-white/40 h-[calc(100vh-140px)]" : "bg-[#f8f5f0] h-full"
    )}>
      {showLeftColumn && (
        <div className="w-full md:w-[320px] flex flex-col p-6 shrink-0 transition-all duration-500 relative z-20 overflow-hidden bg-slate-50 border-r border-slate-200/60 animate-in slide-in-from-left duration-500">
           {isPublic ? (
             <div className="flex-1 flex flex-col gap-4">
                <div className="space-y-4">
                  <div className="bg-[#9f2241] p-6 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Monitor className="h-20 w-20" /></div>
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Soporte Remoto</Label>
                    <h3 className="text-xl font-black uppercase mt-1 leading-none">AnyDesk / TeamViewer</h3>
                    <div className="mt-6 space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-white/60 pl-1">ID de Conexión</Label>
                        <Input placeholder="000 000 000" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 font-mono text-center text-lg h-12 rounded-2xl shadow-inner" value={remoteId} onChange={e => setRemoteId(e.target.value.replace(/\D/g,''))} maxLength={9} />
                      </div>
                      <Button onClick={handleRequestRemoteSupport} className="w-full bg-white text-[#9f2241] hover:bg-[#f8f8f8] font-black uppercase text-[10px] tracking-widest h-14 rounded-2xl shadow-xl active:scale-95 transition-all">Solicitar Soporte</Button>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-5">
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><ArrowRightCircle className="h-4 w-4 text-[#B38E5D]" /> Apoyo Remoto</p>
                    <div className="space-y-4">
                      {[
                        { step: "1", text: "Descargue software AnyDesk." },
                        { step: "2", text: "Localice su ID personal." },
                        { step: "3", text: "Péguelo arriba y solicite soporte." },
                        { step: "4", text: "Espere conexión del analista." }
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-start group">
                          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-[#9f2241] shrink-0 shadow-sm group-hover:bg-[#9f2241] group-hover:text-white transition-colors">{item.step}</div>
                          <p className="text-[11px] font-semibold text-slate-600 leading-tight uppercase pt-1">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => setIsRemoteHelpRequested(false)} className="mt-auto text-[9px] font-black uppercase text-slate-400 gap-2"><X className="h-3 w-3" /> Ocultar Panel</Button>
             </div>
           ) : (
             <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                <div className="space-y-4 shrink-0">
                   <div className="bg-primary p-4 rounded-[1.5rem] text-white shadow-xl relative overflow-hidden">
                      <div className="absolute -right-2 -top-2 opacity-10 rotate-12"><Activity className="h-16 w-16" /></div>
                      <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Atendidos Hoy</p>
                      <div className="flex items-end gap-2 mt-1">
                         <span className="text-4xl font-black leading-none">{attendedTodayCount}</span>
                         <Target className="h-4 w-4 mb-1 text-accent" />
                      </div>
                   </div>
                </div>

                <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                   <div className="flex flex-col gap-4 overflow-hidden h-full">
                     <div className="space-y-3 flex flex-col h-1/2">
                       <Label className="text-[10px] font-black uppercase text-primary border-b-2 border-primary/10 pb-2 flex items-center justify-between w-full shrink-0">
                         Solicitudes de Servicio 
                         <Badge className="bg-primary text-white text-[9px] px-3 rounded-full">{formalRequests.length}</Badge>
                       </Label>
                       <ScrollArea className="flex-1">
                         <div className="space-y-2 pr-4 pb-4">
                           {formalRequests.map(req => (
                             <button key={req.id} onClick={() => { setSelectedFormal(req); setSelectedRequest(null); }} className={cn("w-full p-3 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between group", selectedFormal?.id === req.id ? "bg-primary border-primary shadow-lg scale-[1.02]" : "bg-white border-slate-100 hover:bg-slate-50 shadow-sm")}>
                               <div className="flex flex-col">
                                 <span className={cn("text-[8px] font-black", selectedFormal?.id === req.id ? "text-white/60" : "text-primary")}>{req.id}</span>
                                 <span className={cn("text-[9px] font-black truncate max-w-[150px]", selectedFormal?.id === req.id ? "text-white" : "text-slate-700")}>{req.requesterName}</span>
                               </div>
                               <FilePlus className={cn("h-4 w-4", selectedFormal?.id === req.id ? "text-white" : "text-slate-300")} />
                             </button>
                           ))}
                         </div>
                       </ScrollArea>
                     </div>

                     <div className="space-y-3 flex flex-col h-1/2">
                       <Label className="text-[10px] font-black uppercase text-accent border-b-2 border-accent/10 pb-2 flex items-center justify-between w-full shrink-0">
                         Mesa Operativa (Live) 
                         <Badge className="bg-accent text-white text-[9px] px-3 rounded-full">{queue.length}</Badge>
                       </Label>
                       <ScrollArea className="flex-1">
                         <div className="space-y-2 pr-4 pb-4">
                           {queue.map(req => (
                             <button key={req.ticketNumber} onClick={() => { setSelectedRequest(req); setSelectedFormal(null); }} className={cn("w-full p-3 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between group", selectedRequest?.ticketNumber === req.ticketNumber ? "bg-accent border-accent shadow-lg scale-[1.02]" : "bg-white border-slate-100 hover:bg-slate-50 shadow-sm")}>
                               <div className="flex flex-col">
                                 <span className={cn("text-[8px] font-black", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white/60" : "text-accent")}>{req.ticketNumber}</span>
                                 <span className={cn("text-[10px] font-black", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white" : "text-slate-700")}>{req.requestType === 'chat' ? 'CONSULTA LIVE' : 'ACCESO REMOTO'}</span>
                               </div>
                               <ChevronRight className={cn("h-4 w-4", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white" : "text-slate-300")} />
                             </button>
                           ))}
                         </div>
                       </ScrollArea>
                     </div>
                   </div>
                </div>

                <div className="space-y-2 shrink-0 pt-2 border-t">
                   <Label className="text-[10px] font-black uppercase text-slate-400 border-b pb-2 flex items-center justify-between w-full">Biblioteca Soporte <Plus className="h-4 w-4 cursor-pointer hover:text-primary" onClick={() => libraryInputRef.current?.click()} /></Label>
                   <input type="file" ref={libraryInputRef} className="hidden" onChange={handleLibraryUpload} />
                   <ScrollArea className="h-24">
                     <div className="space-y-2 pr-4">
                       {techLibrary.map(f => (
                         <div key={f.id} className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-2 group hover:border-primary/20 transition-all">
                            <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">{getFileIcon(f.type)}</div>
                            <div className="flex-1 min-w-0">
                               <p className="text-[8px] font-black text-slate-600 truncate uppercase">{f.name}</p>
                               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="text-[7px] font-black text-primary uppercase" onClick={() => handleSendMessage({ data: f.data, name: f.name, type: f.type })}>Enviar</button>
                                 <button className="text-[7px] font-black text-rose-500 uppercase" onClick={() => { const updated = techLibrary.filter(lib => lib.id !== f.id); setTechLibrary(updated); localStorage.setItem('atres_tech_library', JSON.stringify(updated)) }}>Borrar</button>
                               </div>
                            </div>
                         </div>
                       ))}
                     </div>
                   </ScrollArea>
                </div>
             </div>
           )}
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!isPublic && !selectedRequest && !selectedFormal ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6 bg-slate-50/50">
            <div className="h-28 w-28 rounded-[3rem] bg-white shadow-2xl flex items-center justify-center text-primary/10 border-4 border-white animate-pulse"><MessageSquare className="h-14 w-14" /></div>
            <div className="space-y-3">
              <h3 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">CENTRO OPERATIVO</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] max-w-xs mx-auto">Seleccione una Solicitud de Servicio o un turno de Mesa Operativa en la columna izquierda para iniciar la atención.</p>
            </div>
          </div>
        ) : !isPublic && selectedFormal ? (
          <div className="flex-1 flex flex-col p-10 bg-[#fdfaf5] animate-in fade-in duration-700 overflow-hidden">
             <ScrollArea className="flex-1">
               <div className="max-w-4xl mx-auto w-full space-y-8 pb-10">
                  <div className="flex justify-between items-center border-b-4 border-primary pb-6">
                     <div className="space-y-2">
                        <div className="flex items-center gap-3">
                           <Badge className="bg-primary text-white font-mono text-base px-4 py-1 rounded-lg shadow-md">{selectedFormal.id}</Badge>
                           <Badge variant="outline" className="border-accent text-accent font-black uppercase text-xs px-4">SOLICITUD FORMAL</Badge>
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">{selectedFormal.requesterName}</h2>
                     </div>
                     <Button onClick={() => setIsFinishDialogOpen(true)} className="btn-institutional h-14 px-12 text-[11px] gap-3 shadow-2xl">
                        <CheckCircle2 className="h-5 w-5" /> REGISTRAR ATENCIÓN
                     </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden group">
                           <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contacto Institucional</Label>
                           <p className="text-lg font-black text-slate-700 mt-1 flex items-center gap-3"><Mail className="h-5 w-5 text-primary/40" /> {selectedFormal.requesterEmail}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden group">
                           <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tema del Requerimiento</Label>
                           <p className="text-lg font-black text-primary uppercase mt-1 leading-tight flex items-center gap-3"><Tag className="h-5 w-5 text-accent/40" /> {selectedFormal.helpTopic}</p>
                        </div>
                     </div>
                     <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border-2 border-primary/5 flex flex-col gap-4 relative overflow-hidden group">
                        <div className="absolute -top-4 -right-4 opacity-5 group-hover:rotate-12 transition-transform duration-700"><School className="h-32 w-32" /></div>
                        <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                          <School className="h-4 w-4" /> Plantel de Adscripción
                        </Label>
                        <h4 className="text-4xl font-black text-slate-800 font-mono tracking-tighter">{selectedFormal.cct}</h4>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest border-t pt-4">Sincronización COEES Activa</p>
                     </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 space-y-4">
                     <Label className="text-[11px] font-black uppercase text-accent tracking-[0.2em] flex items-center gap-3">
                       <MessageSquare className="h-5 w-5" /> Detalle Técnico del Reporte
                     </Label>
                     <div className="p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <p className="text-base font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedFormal.detail}</p>
                     </div>
                  </div>
               </div>
             </ScrollArea>
          </div>
        ) : (
          <>
            <header className={cn("px-6 md:px-10 py-4 flex justify-between items-center z-10 shrink-0 shadow-sm border-b", isPublic ? "bg-white/60 backdrop-blur-3xl border-white/40" : "bg-white/80 backdrop-blur-2xl border-slate-200/60")}>
              <div className="flex items-center gap-6">
                <div className="hidden xs:flex h-14 w-14 rounded-2xl bg-[#9f2241] text-white items-center justify-center shadow-2xl relative overflow-hidden group">
                  {isPublic ? <Bot className="h-8 w-8 relative z-10 group-hover:scale-110 transition-transform duration-500" /> : <UserCog className="h-8 w-8 relative z-10 group-hover:scale-110 transition-transform duration-500" />}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase leading-none tracking-tight truncate">{isPublic ? "ASISTENTE COEES" : "MESA OPERATIVA LIVE"}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <div className="flex items-center gap-1.5 shrink-0">
                       <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                       <p className="text-[8px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest">CANAL SEGURO</p>
                    </div>
                    {activeChatId && <Badge className="text-[8px] md:text-[9px] font-mono bg-[#B38E5D] text-white px-3 h-5 rounded-xl border-none">{activeChatId}</Badge>}
                    {isPublic && (
                      <div className="flex gap-2 items-center ml-1">
                         <button onClick={() => setIsNewTicketDialogOpen(true)} className="flex items-center gap-2 bg-white hover:bg-primary pl-3 pr-4 h-10 rounded-xl shadow-xl border-2 border-primary/20 transition-all group animate-pulse hover:animate-none">
                           <div className="h-7 w-7 rounded-lg bg-primary/10 group-hover:bg-white/20 flex items-center justify-center text-primary group-hover:text-white transition-colors"><FilePlus className="h-5 w-5" /></div>
                           <div className="flex flex-col text-left"><span className="text-[8px] font-black text-primary group-hover:text-white uppercase leading-none">Solicitud de Servicio</span><span className="text-[6px] font-bold text-slate-400 group-hover:text-white/80 uppercase tracking-tight leading-none mt-0.5">Haz clic aquí para solicitar tu atención de servicio</span></div>
                         </button>
                         <button onClick={() => setIsTrackTicketDialogOpen(true)} className="h-10 w-10 rounded-xl bg-white shadow-lg border border-accent/20 flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-all" title="Seguimiento de Folio"><Search className="h-4 w-4" /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {!isPublic && selectedRequest && <Button onClick={() => setIsFinishDialogOpen(true)} size="sm" className="bg-[#9f2241] hover:bg-[#801a34] text-white font-black text-[9px] uppercase h-10 px-4 md:px-8 rounded-xl shadow-2xl transition-all active:scale-95 gap-2"><CheckCircle2 className="h-4 w-4" /> FINALIZAR</Button>}
            </header>
            <ScrollArea className="flex-1 px-6 py-10">
              <div className="max-w-4xl mx-auto space-y-8 min-h-full flex flex-col justify-end pb-12">
                {messages.map((msg, i) => {
                  const isMe = (isPublic && msg.role === 'user') || (!isPublic && msg.role === 'tech');
                  return (
                    <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-500", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn("flex gap-5 max-w-[85%]", isMe ? "flex-row-reverse" : "flex-row")}>
                        <div className={cn("h-10 w-10 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-xl border-2 border-white", msg.role === 'user' ? "bg-[#B38E5D] text-white" : msg.role === 'tech' ? "bg-[#9f2241] text-white" : "bg-slate-800 text-white")}>
                          {msg.role === 'user' ? <GraduationCap className="h-5 w-5" /> : msg.role === 'tech' ? <UserCog className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                        </div>
                        <div className="space-y-1.5">
                          {msg.senderName && <span className={cn("text-[8px] font-black uppercase tracking-widest block", isMe ? "text-right text-[#B38E5D]" : "text-left text-slate-400")}>{msg.senderName}</span>}
                          <div className={cn("p-5 rounded-[2.25rem] text-[13px] font-semibold shadow-2xl border leading-relaxed relative", isMe ? (msg.role === 'user' ? "bg-[#B38E5D] text-white rounded-tr-none border-transparent" : "bg-[#9f2241] text-white rounded-tr-none border-transparent") : msg.role === 'bot' ? "bg-slate-800 text-white rounded-tl-none border-transparent" : "bg-white text-slate-700 rounded-tl-none border-slate-100")}>
                            {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                            {msg.fileData && (
                              <div className={cn("mt-4 p-4 rounded-2xl border flex items-center gap-4 cursor-pointer transition-all hover:brightness-95", isMe ? "bg-white/15 border-white/20" : "bg-slate-50 border-slate-100")} onClick={() => downloadFile(msg.fileData!, msg.fileName!)}>
                                <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center shadow-lg">{getFileIcon(msg.fileType || '')}</div>
                                <div className="flex-1 min-w-0"><p className={cn("text-[11px] font-black truncate uppercase", isMe ? "text-white" : "text-slate-800")}>{msg.fileName}</p></div>
                                <Download className={cn("h-4 w-4", isMe ? "text-white/60" : "text-slate-300")} />
                              </div>
                            )}
                            <div className={cn("text-[8px] mt-3 font-black uppercase opacity-60 flex items-center gap-2", isMe ? "justify-end" : "justify-start")}>
                              <Clock className="h-3 w-3" /> {mounted ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
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
            <footer className="p-8 bg-white/40 backdrop-blur-3xl border-t border-white/40 shrink-0 relative z-10">
              <div className="max-w-4xl mx-auto flex gap-5">
                <div className="relative flex-1 group">
                  <Input placeholder={isPublic ? "DESCRIBA SU DUDA O FALLA TÉCNICA..." : "ESCRIBA LA RESPUESTA OFICIAL..."} className="h-16 rounded-[1.5rem] bg-white border-2 border-slate-100 px-8 pr-16 font-semibold shadow-inner focus:ring-4 focus:ring-[#9f2241]/5 focus:border-[#9f2241]/20 text-sm transition-all" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
                  <button onClick={() => fileInputRef.current?.click()} className="absolute right-6 top-4 h-8 w-8 text-slate-300 hover:text-primary transition-all flex items-center justify-center rounded-xl hover:bg-slate-50"><Paperclip className="h-5 w-5" /></button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                </div>
                <button onClick={() => handleSendMessage()} disabled={!input.trim()} className="h-16 w-16 rounded-[1.5rem] bg-[#9f2241] hover:bg-[#801a34] text-white shadow-2xl shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center group"><Send className="h-7 w-7 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></button>
              </div>
            </footer>
          </>
        )}
      </div>

      {/* DIÁLOGOS DE SOLICITUD Y SEGUIMIENTO */}
      <Dialog open={isNewTicketDialogOpen} onOpenChange={setIsNewTicketDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[98vh] flex flex-col">
          <DialogHeader className="p-4 bg-[#9f2241] text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 rotate-12"><FilePlus className="h-12 w-12" /></div>
            <DialogTitle className="uppercase font-black text-base flex items-center gap-2 relative z-10 leading-none"><FilePlus className="h-5 w-5 text-accent" /> SOLICITUD DE SERVICIO</DialogTitle>
            <DialogDescription className="sr-only">Complete el formulario oficial para solicitar atención técnica institucional.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-4 space-y-4">
             <div className="space-y-2">
                <h4 className="text-[9px] font-black uppercase text-accent border-b pb-0.5">Información del Solicitante</h4>
                <div className="space-y-1">
                  <Label className="text-[8px] font-black uppercase text-slate-400 pl-1">Nombre Completo</Label>
                  <Input placeholder="PATERNO MATERNO NOMBRES..." className="h-9 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase shadow-inner" value={requesterName} onChange={e => setRequesterName(e.target.value.toUpperCase())} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[8px] font-black uppercase text-slate-400 pl-1">Correo Institucional</Label>
                    <Input placeholder="ejemplo@desysa.edu.mx" className="h-9 bg-slate-50 border-none rounded-xl text-[9px] font-bold shadow-inner" value={requesterEmail} onChange={e => setRequesterEmail(e.target.value.toLowerCase())} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[8px] font-black uppercase text-slate-400 pl-1">Tema de Ayuda</Label>
                    <Select value={helpTopic} onValueChange={val => { setHelpTopic(val); if (val === 'cuenta') setIsResponsivaOpen(true); }} >
                      <SelectTrigger className="h-9 bg-slate-50 border-none rounded-xl text-[8px] font-black uppercase shadow-inner"><SelectValue placeholder="ELEGIR..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cuenta" className="text-[9px] font-bold uppercase">Cuenta institucional (crear, restablecer, eliminar)</SelectItem>
                        <SelectItem value="transmision" className="text-[9px] font-bold uppercase">Transmisión</SelectItem>
                        <SelectItem value="soporte" className="text-[9px] font-bold uppercase">Soporte Técnico</SelectItem>
                        <SelectItem value="capacitacion" className="text-[9px] font-bold uppercase">Capacitación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
             </div>
             <div className="space-y-2">
                <h4 className="text-[9px] font-black uppercase text-accent border-b pb-0.5">Datos del Servicio</h4>
                <div className="grid grid-cols-2 gap-2">
                   <div className="space-y-1"><Label className="text-[8px] font-black uppercase text-slate-400 pl-1">CCT</Label><Input placeholder="15DES0000X" className="h-9 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase" value={ticketCct} onChange={e => setTicketCct(e.target.value.toUpperCase())} maxLength={10} /></div>
                   <div className="space-y-1"><Label className="text-[8px] font-black uppercase text-slate-400 pl-1">Detalle</Label><Input placeholder="DESCRIPCIÓN..." className="h-9 bg-slate-50 border-none rounded-xl text-[10px] font-semibold" value={ticketDetail} onChange={e => setTicketDetail(e.target.value.toUpperCase())} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                   <div className={cn("flex items-center gap-2 bg-slate-50 rounded-xl p-2 border-2 border-dashed h-12 relative", pdfFile ? "border-rose-300" : "border-slate-200")}>
                      <FileText className="h-4 w-4 text-rose-500" />
                      <span className="text-[7px] font-black uppercase truncate">{pdfFile ? pdfFile.name : "1. Solicitud en PDF"}</span>
                      <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
                   </div>
                   <div className={cn("flex items-center gap-2 bg-slate-50 rounded-xl p-2 border-2 border-dashed h-12 relative", excelFile ? "border-emerald-300" : "border-slate-200")}>
                      <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                      <span className="text-[7px] font-black uppercase truncate">{excelFile ? excelFile.name : "2. Archivo Excel"}</span>
                      <input type="file" accept=".xlsx, .xls" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setExcelFile(e.target.files?.[0] || null)} />
                   </div>
                </div>
             </div>
          </div>
          <DialogFooter className="p-3 bg-slate-50 border-t flex justify-end gap-3 shrink-0"><Button variant="ghost" onClick={() => setIsNewTicketDialogOpen(false)} className="h-8 px-4 text-[9px] font-black uppercase">CANCELAR</Button><Button onClick={handleSendNewTicketRequest} className="btn-institutional h-10 px-8 text-[10px]">ENVIAR SOLICITUD</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isResponsivaOpen} onOpenChange={setIsResponsivaOpen}>
        <DialogContent className="sm:max-w-[620px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white h-[85vh] flex flex-col">
          <DialogHeader className="p-6 bg-[#9f2241] text-white shrink-0">
            <DialogTitle className="uppercase font-black text-white text-lg">CARTA RESPONSIVA INSTITUCIONAL</DialogTitle>
            <DialogDescription className="text-white/60 text-[9px] font-bold uppercase tracking-widest">REGLAS DE OPERACIÓN DEL CORREO ELECTRÓNICO</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 bg-[#fdfaf5]">
            <div className="p-8 space-y-6 text-[11px] leading-relaxed text-slate-700 text-justify font-medium">
               <p className="font-bold text-[#9f2241] border-b border-primary/10 pb-4 uppercase tracking-tighter">Las cláusulas aquí definidas aplican a todas las personas que tienen acceso a una cuenta de correo con dominio @desysa.gob.mx, @desysa.edu.mx y @aulamexiquense.mx.</p>
               
               <div className="grid grid-cols-1 gap-4">
                  {[
                    "El servicio de correo electrónico deberá usarse exclusivamente para asuntos relacionados con el organismo y sus instituciones.",
                    "Las cuentas de correo son personales. Por lo cual, los titulares de las cuentas son responsables directos del buen uso de las mismas.",
                    "Las claves de acceso son para uso exclusivo de la persona usuaria titular y su custodia y correcta utilización son de su responsabilidad. Queda prohibido permitir su utilización a personas no autorizadas.",
                    "Los usuarios de este servicio deberán realizar el cambio de contraseña al recibir por primera vez su cuenta, cuando sea requerido por el sistema o cuando considere que la cuenta esté en riesgo por mal uso.",
                    "Queda prohibido enviar correo electrónico no solicitado o cadenas (spamming), con fines comerciales, informativos, publicitarios, políticos y religiosos entre otros; así mismo se deberá respetar la privacidad de otros usuarios.",
                    "Queda prohibido el uso de cuentas de correo electrónico por parte de personas distintas al titular de la misma, por lo que las cuentas y contraseñas son intransferibles.",
                    "Es responsabilidad de los titulares de las cuentas de correo electrónico, respaldar la información (mensajes) en medios magnéticos u ópticos, para su restauración en caso de pérdida o destrucción parcial o total.",
                    "Estas cuentas son un medio de comunicación de la estructura de la DESySA, por lo que el titular está obligado a consultarla y realizar revisiones periódicas al buzón con la finalidad de depurarlo y asegurar la buena recepción de mensajes."
                  ].map((text, i) => (
                    <div key={i} className="flex gap-4 items-start bg-white/50 p-4 rounded-2xl border border-primary/5 shadow-sm">
                       <div className="h-6 w-6 rounded-full bg-[#B38E5D] text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-md">{i+1}</div>
                       <p className="pt-0.5">{text}</p>
                    </div>
                  ))}
               </div>
               <p className="font-black text-center text-[9px] uppercase text-slate-400 py-4 italic">Acepto que he leído cada una de las cláusulas y las aceptaciones de conformidad con las políticas establecidas.</p>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 bg-slate-50 border-t shrink-0">
             <Button onClick={() => setIsResponsivaOpen(false)} className="btn-institutional w-full h-14 text-[11px]">ACEPTO Y CONTINUAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] border-none shadow-2xl p-10 overflow-hidden bg-white text-center">
            <DialogHeader className="sr-only">
               <DialogTitle>Solicitud Registrada Exitosamente</DialogTitle>
               <DialogDescription>Aviso de generación de folio institucional COEES.</DialogDescription>
            </DialogHeader>
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-6" />
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Solicitud Registrada</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mt-2 mb-8">Su solicitud ha sido recibida correctamente. Use el siguiente número para consultar el estatus.</p>
            <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-primary/10 shadow-inner mb-6">
               <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-2">FOLIO DE SEGUIMIENTO</p>
               <h4 className="text-3xl font-black text-slate-800 font-mono tracking-tighter">{lastGeneratedFolio}</h4>
            </div>
            <Button onClick={() => setIsConfirmationOpen(false)} className="w-full btn-institutional h-14 rounded-2xl shadow-xl">ENTENDIDO</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isTrackTicketDialogOpen} onOpenChange={setIsTrackTicketDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[1.5rem] border-none shadow-2xl p-4 overflow-hidden bg-white">
          <DialogHeader>
            <DialogTitle className="uppercase font-black text-sm flex items-center gap-2"><Search className="h-4 w-4" /> SEGUIMIENTO COEES</DialogTitle>
            <DialogDescription className="sr-only">Ingrese su número de folio para consultar el estatus operativo de su servicio.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
             <div className="flex gap-2">
                <Input placeholder="COEES-00001" className="h-10 bg-slate-50 border-none rounded-lg text-xs font-mono font-black uppercase flex-1 shadow-inner" value={trackFolioInput} onChange={e => setTrackFolioInput(e.target.value.toUpperCase())} />
                <Button onClick={handleTrackFolio} className="h-10 w-10 p-0 rounded-lg bg-primary text-white"><Search className="h-4 w-4" /></Button>
             </div>
             {trackedTicket && (
               <div className="p-4 bg-slate-50 rounded-2xl border-2 border-accent/20 animate-in zoom-in-95">
                  <div className="flex justify-between items-start border-b pb-2 mb-3">
                     <div><p className="text-[8px] font-black text-slate-400 uppercase">FOLIO:</p><h4 className="text-lg font-black text-primary leading-none">{trackedTicket.id || trackedTicket.ticketNumber}</h4></div>
                     <Badge className="text-[9px] font-black uppercase py-1 px-3 rounded-full">{trackedTicket.displayStatus || 'REGISTRADA'}</Badge>
                  </div>
                  <p className="text-[9px] font-bold text-slate-600 uppercase"><span className="text-accent">Plantel:</span> {trackedTicket.schoolName || trackedTicket.cct || 'En Proceso'}</p>
               </div>
             )}
          </div>
          <DialogFooter className="pt-4"><Button variant="ghost" onClick={() => { setIsTrackTicketDialogOpen(false); setTrackedTicket(null); setTrackFolioInput(''); }} className="w-full h-10 text-[9px] font-black uppercase">CERRAR</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[95vh] flex flex-col">
          <DialogHeader className="p-4 bg-primary text-white shrink-0">
            <DialogTitle className="uppercase font-black text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#B38E5D]" /> CONCLUIR SERVICIO</DialogTitle>
            <DialogDescription className="sr-only">Registrar el fin de la atención técnica para auditoría y archivo histórico.</DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-primary tracking-widest pl-1">Plantel Atendido</Label>
              <div className="relative">
                 <Input placeholder="CCT O NOMBRE..." className="h-9 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase px-4 shadow-inner" value={finishSearchTerm} onChange={e => setFinishSearchTerm(e.target.value)} />
                 {finishSearchTerm.length > 2 && (
                  <div className="absolute left-0 right-0 top-10 max-h-32 overflow-y-auto bg-white border border-slate-100 rounded-lg shadow-xl divide-y z-50">
                    {schoolsDirectory.filter(s => s.cct.includes(finishSearchTerm.toUpperCase()) || s.nombre.includes(finishSearchTerm.toUpperCase())).slice(0, 5).map(s => (
                      <div key={`${s.cct}-${s.turno}`} className="p-2 hover:bg-primary/5 cursor-pointer flex justify-between items-center transition-colors" onClick={() => { setFinishForm({...finishForm, cct: s.cct, schoolName: s.nombre, municipio: s.municipio, valle: s.valle}); setFinishSearchTerm('') }}>
                        <div className="flex flex-col"><span className="text-[9px] font-black uppercase">{s.nombre}</span><span className="text-[7px] font-mono text-slate-400">{s.cct}</span></div>
                      </div>
                    ))}
                  </div>
                 )}
              </div>
              {finishForm.cct && <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2"><div className="h-6 w-6 rounded bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckCircle2 className="h-3 w-3" /></div><div className="flex-1 min-w-0"><h4 className="text-[10px] font-black text-slate-800 uppercase truncate">{finishForm.schoolName}</h4></div></div>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label className="text-[9px] font-black uppercase text-slate-400 pl-1">OFICINA</Label><Select value={finishForm.oficinaRegionalAtencion} onValueChange={v => setFinishForm({...finishForm, oficinaRegionalAtencion: v})}><SelectTrigger className="h-9 bg-slate-50 border-none rounded-xl text-[9px] font-black uppercase shadow-inner"><SelectValue placeholder="ELEGIR..." /></SelectTrigger><SelectContent className="rounded-lg">{REGIONAL_OFFICES.map(off => <SelectItem key={off} value={off} className="text-[9px] font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label className="text-[9px] font-black uppercase text-slate-400 pl-1">FOLIO COEES</Label><div className="h-9 bg-slate-100 rounded-xl flex items-center px-3 font-mono font-black text-primary shadow-inner text-[10px]">{selectedRequest?.ticketNumber || selectedFormal?.id}</div></div>
            </div>
            <div className="space-y-1"><Label className="text-[9px] font-black uppercase text-primary pl-1">Resumen Operativo</Label><Textarea placeholder="ACCIONES REALIZADAS..." className="h-20 bg-slate-50 border-none rounded-xl p-3 text-[10px] font-semibold shadow-inner resize-none" value={finishForm.servicio} onChange={e => setFinishForm({...finishForm, servicio: e.target.value.toUpperCase()})} /></div>
          </div>
          <DialogFooter className="p-3 bg-slate-50 border-t"><Button variant="ghost" onClick={() => setIsFinishDialogOpen(false)} className="h-10 px-6 text-[9px] font-black uppercase text-slate-400">CANCELAR</Button><Button onClick={handleFinishConfirm} className="btn-institutional h-12 px-10 text-[10px] gap-2"><Save className="h-4 w-4" /> REGISTRAR</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
