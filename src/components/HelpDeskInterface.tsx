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
  Sparkles,
  Monitor,
  ShieldCheck,
  Circle,
  School,
  X,
  Target,
  FilePlus,
  Search,
  AlertCircle,
  ImageIcon,
  User,
  Mail,
  Tag
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
  const [isTyping, setIsTyping] = useState(false)
  const [remoteId, setRemoteId] = useState('') 
  const [activeTicketNumber, setActiveTicketNumber] = useState<string | null>(null)
  const [isRemoteRequested, setIsRemoteRequested] = useState(false)
  const [showRemotePanel, setShowRemotePanel] = useState(false)
  const [highlightRemote, setHighlightRemote] = useState(false)
  const [queue, setQueue] = useState<SupportRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null)
  const [techName, setTechName] = useState('')
  const [mounted, setMounted] = useState(false)
  const [sessionKey, setSessionKey] = useState<string>('')
  const [attendedTodayCount, setAttendedTodayCount] = useState(0)
  
  // Solicitud Ticket State
  const [isNewTicketDialogOpen, setIsNewTicketDialogOpen] = useState(false)
  const [isResponsivaOpen, setIsResponsivaOpen] = useState(false)
  
  // File states for the 2 specific slots
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [excelFile, setExcelFile] = useState<File | null>(null)
  
  const [requesterName, setRequesterName] = useState('')
  const [requesterEmail, setRequesterEmail] = useState('')
  const [helpTopic, setHelpTopic] = useState('')
  const [ticketCct, setTicketCct] = useState('')
  const [ticketDetail, setTicketDetail] = useState('')

  // Seguimiento State
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
    if (isPublic) {
      return activeTicketNumber || sessionKey;
    }
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
    const counterKey = `atres_folio_counter_${cycle}`;
    const lastCounter = parseInt(localStorage.getItem(counterKey) || '0', 10);
    const nextCounter = lastCounter + 1;
    localStorage.setItem(counterKey, nextCounter.toString());
    return `ATRES-${nextCounter.toString().padStart(5, '0')}`;
  }

  const updateAttendedCount = useCallback(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const progs = JSON.parse(localStorage.getItem('programs_full_v24') || '[]');
    const count = progs.filter((p: any) => p.name === 'ATRES' && p.date === today).length;
    setAttendedTodayCount(count);
  }, []);

  useEffect(() => {
    if (isPublic) {
      let sKey = sessionStorage.getItem('atres_session_id')
      if (!sKey) {
        sKey = generateTurnSessionId()
        sessionStorage.setItem('atres_session_id', sKey)
      }
      setSessionKey(sKey)
      const savedTicket = sessionStorage.getItem('atres_active_ticket')
      if (savedTicket) setActiveTicketNumber(savedTicket)
      const savedShow = sessionStorage.getItem('atres_show_remote_panel')
      if (savedShow === 'true') setShowRemotePanel(true)
    } else {
      const savedTechName = localStorage.getItem('atres_tech_name')
      if (savedTechName) setTechName(savedTechName)
      const savedLibrary = localStorage.getItem('atres_tech_library')
      if (savedLibrary) setTechLibrary(JSON.parse(savedLibrary))
      updateAttendedCount();
    }
  }, [isPublic, generateTurnSessionId, updateAttendedCount])

  const resetForNewRequest = useCallback(() => {
    setRemoteId('')
    setIsRemoteRequested(false)
    setActiveTicketNumber(null)
    setHighlightRemote(false)
    setShowRemotePanel(false)
    sessionStorage.removeItem('atres_active_ticket')
    sessionStorage.removeItem('atres_show_remote_panel')
    const newSKey = generateTurnSessionId()
    sessionStorage.setItem('atres_session_id', newSKey)
    setSessionKey(newSKey)
    setMessages([])
  }, [generateTurnSessionId])

  useEffect(() => {
    if (!isPublic || !activeTicketNumber) return;
    const handleSessionStatus = (e: StorageEvent) => {
      if (e.key === `atres_session_status_${activeTicketNumber}` && e.newValue === 'closed') {
        toast({ title: "Atención Finalizada", description: "El técnico ha concluido el registro del servicio." });
        resetForNewRequest();
      }
    };
    window.addEventListener('storage', handleSessionStatus);
    return () => window.removeEventListener('storage', handleSessionStatus);
  }, [isPublic, activeTicketNumber, resetForNewRequest, toast]);

  const syncQueue = useCallback(() => {
    const rawQueue = localStorage.getItem('atres_support_queue')
    const currentQueue: SupportRequest[] = rawQueue ? JSON.parse(rawQueue) : []
    setQueue(currentQueue)
    if (isPublic) {
      const myReq = currentQueue.find(r => r.chatKey === sessionKey || r.ticketNumber === activeTicketNumber);
      if (myReq) {
        setActiveTicketNumber(myReq.ticketNumber);
        sessionStorage.setItem('atres_active_ticket', myReq.ticketNumber);
        if (myReq.requestType === 'remote') {
          setShowRemotePanel(true);
          sessionStorage.setItem('atres_show_remote_panel', 'true');
        }
      }
    }
  }, [isPublic, sessionKey, activeTicketNumber])

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
    setMounted(true)
    syncQueue()
    syncChat()
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'atres_support_queue') syncQueue()
      if (activeChatId && e.key === `atres_chat_${activeChatId}`) syncChat()
      if (e.key === 'programs_full_v24' && !isPublic) updateAttendedCount()
    };
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [syncQueue, syncChat, activeChatId, isPublic, updateAttendedCount])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (fileData?: { data: string, name: string, type: string }) => {
    if (!input.trim() && !fileData) return
    let currentFolio = activeTicketNumber;
    let updatedActiveChatId = activeChatId;
    const lowerInput = input.toLowerCase();
    const isRemoteIssue = lowerInput.includes('office') || lowerInput.includes('windows') || lowerInput.includes('impresora');

    if (isPublic && !currentFolio) {
      currentFolio = generateSequentialFolio();
      setActiveTicketNumber(currentFolio);
      sessionStorage.setItem('atres_active_ticket', currentFolio);
      const newRequest: SupportRequest = { remoteId: '', ticketNumber: currentFolio, timestamp: Date.now(), status: 'pending', requestType: isRemoteIssue ? 'remote' : 'chat', chatKey: sessionKey }
      const rawQueue = localStorage.getItem('atres_support_queue')
      const currentQueue = rawQueue ? JSON.parse(rawQueue) : []
      localStorage.setItem('atres_support_queue', JSON.stringify([newRequest, ...currentQueue]))
      window.dispatchEvent(new StorageEvent('storage', { key: 'atres_support_queue', newValue: JSON.stringify([newRequest, ...currentQueue]) }))
      const oldHistory = localStorage.getItem(`atres_chat_${sessionKey}`);
      if (oldHistory) { localStorage.setItem(`atres_chat_${currentFolio}`, oldHistory); updatedActiveChatId = currentFolio; }
    }

    const newMessage: Message = { role: isPublic ? 'user' : 'tech', content: input, timestamp: Date.now(), senderName: !isPublic ? techName : undefined, fileData: fileData?.data, fileName: fileData?.name, fileType: fileData?.type }
    const historyKey = `atres_chat_${updatedActiveChatId}`
    const currentMessages = JSON.parse(localStorage.getItem(historyKey) || '[]')
    const updatedMessages = [...currentMessages, newMessage]
    localStorage.setItem(historyKey, JSON.stringify(updatedMessages))
    setMessages(updatedMessages)
    window.dispatchEvent(new StorageEvent('storage', { key: historyKey, newValue: JSON.stringify(updatedMessages), storageArea: localStorage }))

    if (isPublic && newMessage.role === 'user' && !fileData) {
      if (isRemoteIssue) {
        setShowRemotePanel(true);
        sessionStorage.setItem('atres_show_remote_panel', 'true');
        setHighlightRemote(true);
        setIsTyping(true);
        setTimeout(() => {
          const botReply: Message = { role: 'bot', content: 'He detectado que tu falla requiere soporte remoto. He activado la sección de Apoyo Remoto para que ingreses tu ID de AnyDesk.', timestamp: Date.now() };
          const final = [...updatedMessages, botReply];
          localStorage.setItem(historyKey, JSON.stringify(final));
          setMessages(final);
          window.dispatchEvent(new StorageEvent('storage', { key: historyKey, newValue: JSON.stringify(final), storageArea: localStorage }));
          setIsTyping(false);
        }, 1000);
      } else if (currentMessages.length === 1) {
        setIsTyping(true);
        setTimeout(() => {
          const botReply: Message = { role: 'bot', content: `Tu solicitud ha sido registrada (Folio ${currentFolio}). Un analista se unirá al chat en breve.`, timestamp: Date.now() };
          const final = [...updatedMessages, botReply];
          localStorage.setItem(historyKey, JSON.stringify(final));
          setMessages(final);
          window.dispatchEvent(new StorageEvent('storage', { key: historyKey, newValue: JSON.stringify(final), storageArea: localStorage }));
          setIsTyping(false);
        }, 1000);
      }
    }
    setInput('')
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

  const handleRequestRemote = () => {
    if (!remoteId || remoteId.length < 5) { toast({ variant: "destructive", title: "ID Inválido" }); return; }
    let folio = activeTicketNumber || generateSequentialFolio();
    const rawQueue = localStorage.getItem('atres_support_queue')
    const currentQueue: SupportRequest[] = rawQueue ? JSON.parse(rawQueue) : []
    const newReq: SupportRequest = { remoteId, ticketNumber: folio, timestamp: Date.now(), status: 'pending', requestType: 'remote', chatKey: sessionKey }
    const exists = currentQueue.findIndex(r => r.ticketNumber === folio || r.chatKey === sessionKey);
    let nQueue = exists >= 0 ? [...currentQueue] : [newReq, ...currentQueue];
    if (exists >= 0) nQueue[exists] = newReq;
    localStorage.setItem('atres_support_queue', JSON.stringify(nQueue))
    window.dispatchEvent(new StorageEvent('storage', { key: 'atres_support_queue', newValue: JSON.stringify(nQueue) }))
    const botMsg: Message = { role: 'bot', content: `Solicitud de Soporte Remoto Enviada.\nFolio: ${folio}\nID: ${remoteId}`, timestamp: Date.now() };
    const historyKey = `atres_chat_${folio}`;
    const old = JSON.parse(localStorage.getItem(`atres_chat_${sessionKey}`) || '[]');
    const final = [...old, botMsg];
    localStorage.setItem(historyKey, JSON.stringify(final));
    setMessages(final); setActiveTicketNumber(folio); sessionStorage.setItem('atres_active_ticket', folio);
    setIsRemoteRequested(true); setHighlightRemote(false);
    window.dispatchEvent(new StorageEvent('storage', { key: historyKey, newValue: JSON.stringify(final), storageArea: localStorage }));
  }

  const handleTrackFolio = () => {
    if (!trackFolioInput) return;
    const progs = JSON.parse(localStorage.getItem('programs_full_v24') || '[]');
    const liveQueue = JSON.parse(localStorage.getItem('atres_support_queue') || '[]');
    const concluded = progs.find((p: any) => p.id === trackFolioInput.toUpperCase());
    if (concluded) {
      setTrackedTicket({ ...concluded, displayStatus: 'Atendida' });
      return;
    }
    const inQueue = liveQueue.find((r: any) => r.ticketNumber === trackFolioInput.toUpperCase());
    if (inQueue) {
      setTrackedTicket({ ...inQueue, displayStatus: inQueue.status === 'attending' ? 'En Proceso' : 'No Atendida' });
      return;
    }
    toast({ variant: "destructive", title: "Folio no encontrado" });
    setTrackedTicket(null);
  }

  const handleSendNewTicketRequest = () => {
    if (!requesterName || !requesterEmail || !helpTopic || !ticketCct || !ticketDetail) {
      toast({ variant: "destructive", title: "Datos Incompletos", description: "Todos los campos son obligatorios para enviar la solicitud." });
      return;
    }
    const folio = generateSequentialFolio();
    toast({ title: "Solicitud Enviada", description: `Su folio de seguimiento es: ${folio}` });
    setIsNewTicketDialogOpen(false);
    setPdfFile(null);
    setExcelFile(null);
    setRequesterName(''); setRequesterEmail(''); setHelpTopic(''); setTicketCct(''); setTicketDetail('');
  }

  const handleFinishConfirm = () => {
    if (!finishForm.cct || !finishForm.servicio || !finishForm.oficinaRegionalAtencion) { toast({ variant: "destructive", title: "Faltan datos obligatorios" }); return; }
    const folio = selectedRequest!.ticketNumber;
    const progs = JSON.parse(localStorage.getItem('programs_full_v24') || '[]')
    const newRec = { id: folio, name: 'ATRES', cct: finishForm.cct, schoolName: finishForm.schoolName, municipio: finishForm.municipio, valle: finishForm.valle, status: 'concluido', date: format(new Date(), 'yyyy-MM-dd'), progress: 100, asistentes: [], observaciones: finishForm.servicio, tecnicos: techName, oficinaRegionalAtencion: finishForm.oficinaRegionalAtencion }
    const updatedProgs = [newRec, ...progs];
    localStorage.setItem('programs_full_v24', JSON.stringify(updatedProgs))
    localStorage.setItem(`atres_session_status_${folio}`, 'closed');
    window.dispatchEvent(new StorageEvent('storage', { key: `atres_session_status_${folio}`, newValue: 'closed' }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'programs_full_v24', newValue: JSON.stringify(updatedProgs) }));
    const rawQueue = localStorage.getItem('atres_support_queue')
    const updatedQueue = JSON.parse(rawQueue || '[]').filter((r: any) => r.ticketNumber !== folio);
    localStorage.setItem('atres_support_queue', JSON.stringify(updatedQueue))
    window.dispatchEvent(new StorageEvent('storage', { key: 'atres_support_queue', newValue: JSON.stringify(updatedQueue) }))
    setIsFinishDialogOpen(false); setSelectedRequest(null); syncQueue(); updateAttendedCount();
    toast({ title: "Atención Registrada" });
  }

  const getFileIcon = (type: string) => {
    if (type.includes('word')) return <FileText className="h-4 w-4 text-blue-500" />
    if (type.includes('excel')) return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-rose-500" />
    return <FileCode className="h-4 w-4 text-slate-400" />
  }

  const sendLibraryFile = (file: TechFile) => { handleSendMessage({ data: file.data, name: file.name, type: file.type }) }
  const removeLibraryFile = (id: string) => { const updated = techLibrary.filter(f => f.id !== id); setTechLibrary(updated); localStorage.setItem('atres_tech_library', JSON.stringify(updated)) }
  const downloadFile = (data: string, name: string) => { const link = document.createElement('a'); link.href = data; link.download = name; link.click(); }

  if (!mounted) return null

  return (
    <div className={cn(
      "flex flex-1 w-full flex-col md:flex-row border border-white/40 overflow-hidden transition-all duration-700", 
      isPublic ? "rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.15)] bg-white/40 h-[calc(100vh-140px)]" : "bg-[#f8f5f0] h-full"
    )}>
      {(!isPublic || showRemotePanel) && (
        <div className={cn(
          "w-full md:w-[320px] flex flex-col p-6 shrink-0 transition-all duration-500 relative z-20 overflow-hidden",
          isPublic ? "bg-white/70 backdrop-blur-3xl border-r border-white/40" : "bg-slate-50 border-r border-slate-200/60"
        )}>
          {isPublic ? (
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
               <div className="bg-white/80 rounded-[2.5rem] border border-white p-6 shadow-2xl space-y-4 relative overflow-hidden shrink-0 group">
                  <div className="absolute -top-4 -right-4 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                    <Monitor className="h-24 w-24 text-[#9f2241]" />
                  </div>
                  <div className="relative z-10 space-y-4">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Solicitud AnyDesk</Label>
                        <div className="bg-[#f8f5f0] p-4 rounded-2xl border border-[#ddc8a4]/30 shadow-inner">
                           <span className="text-[9px] font-black text-[#9f2241] uppercase block mb-1">ID DE CONEXIÓN</span>
                           <Input placeholder="000 000 000" className="h-10 text-center font-mono font-black border-none text-2xl bg-transparent focus:ring-0 shadow-none transition-all p-0 text-[#9f2241]" value={remoteId} onChange={(e) => setRemoteId(e.target.value)} disabled={isRemoteRequested} />
                        </div>
                     </div>
                     {!isRemoteRequested ? (
                       <Button onClick={handleRequestRemote} disabled={!remoteId || remoteId.length < 5} className="w-full btn-institutional h-12 text-[10px] rounded-xl shadow-xl">SOLICITAR SOPORTE</Button>
                     ) : (
                       <Button onClick={() => setIsRemoteRequested(false)} variant="outline" className="w-full h-12 text-[9px] font-black uppercase border-primary/20 text-primary rounded-xl hover:bg-primary/5">ENVIAR OTRO ID</Button>
                     )}
                  </div>
               </div>
               <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                  <div className="flex items-center gap-3 border-b border-[#ddc8a4]/30 pb-3 shrink-0">
                     <div className="h-7 w-7 rounded-xl bg-[#B38E5D]/10 flex items-center justify-center"><ArrowRightCircle className="h-4 w-4 text-[#B38E5D]" /></div>
                     <span className="text-[11px] font-black uppercase text-[#9f2241] tracking-widest">Protocolo de Atención</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1 overflow-hidden">
                     {[
                        { n: "1", t: "Descargue software AnyDesk.", c: <Button variant="outline" size="sm" className="h-7 px-4 text-[8px] font-black border-[#9f2241]/20 text-[#9f2241] rounded-xl mt-1 hover:bg-[#9f2241] hover:text-white transition-all shadow-sm" onClick={() => window.open('https://anydesk.com', '_blank')}><Download className="h-3 w-3 mr-2" /> DESCARGAR</Button> },
                        { n: "2", t: "Localice su ID personal." },
                        { n: "3", t: "Péguelo arriba y solicite soporte." },
                        { n: "4", t: "Espere conexión del analista." }
                     ].map((step, i) => (
                        <div key={i} className="flex gap-4 items-start animate-in fade-in duration-1000" style={{ animationDelay: `${i * 100}ms` }}>
                           <div className="flex flex-col items-center shrink-0">
                              <div className="h-5 w-5 rounded-full bg-[#B38E5D] text-white flex items-center justify-center text-[9px] font-black shadow-lg">{step.n}</div>
                              {i < 3 && <div className="w-0.5 h-full bg-[#B38E5D]/20 my-0.5" />}
                           </div>
                           <div className="pt-0.5 flex-1 min-w-0"><p className="text-[10px] font-bold text-slate-500 uppercase leading-tight tracking-tight">{step.t}</p>{step.c}</div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
               <div className="space-y-4">
                  <div className="bg-primary p-4 rounded-[1.5rem] text-white shadow-xl relative overflow-hidden">
                     <div className="absolute -right-2 -top-2 opacity-10 rotate-12"><Activity className="h-16 w-16" /></div>
                     <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Atendidos Hoy</p>
                     <div className="flex items-end gap-2 mt-1">
                        <span className="text-4xl font-black leading-none">{attendedTodayCount}</span>
                        <Target className="h-4 w-4 mb-1 text-accent" />
                     </div>
                  </div>
               </div>
               <div className="space-y-4 shrink-0">
                  <Label className="text-[10px] font-black uppercase text-slate-400 border-b pb-2 flex items-center justify-between w-full">Cola de Atención <Badge className="bg-primary text-white text-[9px] px-3 rounded-full">{queue.length}</Badge></Label>
                  <ScrollArea className="h-48">
                    <div className="space-y-2 pr-4">
                      {queue.map(req => (
                        <button key={req.ticketNumber} onClick={() => setSelectedRequest(req)} className={cn("w-full p-3 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between group", selectedRequest?.ticketNumber === req.ticketNumber ? "bg-primary border-primary shadow-lg scale-[1.02]" : "bg-white border-slate-100 hover:bg-slate-50")}>
                          <div className="flex flex-col">
                            <span className={cn("text-[8px] font-black", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white/60" : "text-accent")}>{req.ticketNumber}</span>
                            <span className={cn("text-[10px] font-black", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white" : "text-slate-700")}>{req.requestType === 'chat' ? 'CONSULTA' : 'REMOTO'}</span>
                          </div>
                          <ChevronRight className={cn("h-4 w-4", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white" : "text-slate-300")} />
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
               </div>
               <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                  <Label className="text-[10px] font-black uppercase text-slate-400 border-b pb-2 flex items-center justify-between w-full">Biblioteca Soporte <Plus className="h-4 w-4 cursor-pointer hover:text-primary" onClick={() => libraryInputRef.current?.click()} /></Label>
                  <input type="file" ref={libraryInputRef} className="hidden" onChange={handleLibraryUpload} />
                  <ScrollArea className="flex-1">
                    <div className="space-y-2 pr-4">
                      {techLibrary.map(f => (
                        <div key={f.id} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 group hover:border-primary/20 transition-all">
                           <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">{getFileIcon(f.type)}</div>
                           <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-black text-slate-600 truncate uppercase">{f.name}</p>
                              <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                <button className="text-[8px] font-black text-primary uppercase" onClick={() => sendLibraryFile(f)}>Enviar</button>
                                <button className="text-[8px] font-black text-rose-500 uppercase" onClick={() => removeLibraryFile(f.id)}>Borrar</button>
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
        {!isPublic && !selectedRequest ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6 bg-slate-50/50">
            <div className="h-28 w-28 rounded-[3rem] bg-white shadow-2xl flex items-center justify-center text-primary/10 border-4 border-white animate-pulse"><MessageSquare className="h-14 w-14" /></div>
            <div className="space-y-3">
              <h3 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">MESA OPERATIVA</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] max-w-xs mx-auto">Seleccione una solicitud para iniciar la sesión de ayuda.</p>
            </div>
          </div>
        ) : (
          <>
            <header className={cn("px-10 py-6 flex justify-between items-center z-10 shrink-0 shadow-sm border-b", isPublic ? "bg-white/60 backdrop-blur-3xl border-white/40" : "bg-white/80 backdrop-blur-2xl border-slate-200/60")}>
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 rounded-2xl bg-[#9f2241] text-white flex items-center justify-center shadow-2xl relative overflow-hidden group">
                  {isPublic ? <Bot className="h-8 w-8 relative z-10 group-hover:scale-110 transition-transform duration-500" /> : <UserCog className="h-8 w-8 relative z-10 group-hover:scale-110 transition-transform duration-500" />}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase leading-none tracking-tight">{isPublic ? "ASISTENTE COEES" : "ATENCIÓN AL DOCENTE"}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2.5">
                    <div className="flex items-center gap-2">
                       <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                       <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">CANAL SEGURO EN LÍNEA</p>
                    </div>
                    {activeChatId && <Badge className="text-[9px] font-mono bg-[#B38E5D] text-white px-4 h-6 rounded-xl border-none">{activeChatId}</Badge>}
                    {isPublic && (
                      <div className="flex gap-2 ml-2">
                         <button onClick={() => { setIsNewTicketDialogOpen(true); setPdfFile(null); setExcelFile(null); }} className="h-7 w-7 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all group" title="Nueva Solicitud de Folio"><FilePlus className="h-4 w-4" /></button>
                         <button onClick={() => setIsTrackTicketDialogOpen(true)} className="h-7 w-7 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-all group" title="Seguimiento de Estatus"><Search className="h-4 w-4" /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {!isPublic && selectedRequest && <Button onClick={() => setIsFinishDialogOpen(true)} className="bg-[#9f2241] hover:bg-[#801a34] text-white font-black text-[11px] uppercase h-12 px-10 rounded-2xl shadow-2xl transition-all active:scale-95 gap-3"><CheckCircle2 className="h-5 w-5" /> FINALIZAR ATENCIÓN</Button>}
            </header>
            <ScrollArea className="flex-1 px-6 py-10">
              <div className="max-w-4xl mx-auto space-y-8 min-h-full flex flex-col justify-end pb-12">
                {messages.map((msg, i) => {
                  const isMe = (isPublic && msg.role === 'user') || (!isPublic && msg.role === 'tech');
                  const isBot = msg.role === 'bot';
                  const isTech = msg.role === 'tech';
                  const isUser = msg.role === 'user';
                  return (
                    <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-500", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn("flex gap-5 max-w-[85%]", isMe ? "flex-row-reverse" : "flex-row")}>
                        <div className={cn("h-10 w-10 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-xl border-2 border-white", isUser ? "bg-[#B38E5D] text-white" : isTech ? "bg-[#9f2241] text-white" : "bg-slate-800 text-white")}>
                          {isUser ? <GraduationCap className="h-5 w-5" /> : isTech ? <UserCog className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                        </div>
                        <div className="space-y-1.5">
                          {msg.senderName && <span className={cn("text-[8px] font-black uppercase tracking-widest block", isMe ? "text-right text-[#B38E5D]" : "text-left text-slate-400")}>{msg.senderName}</span>}
                          <div className={cn("p-5 rounded-[2.25rem] text-[13px] font-semibold shadow-2xl border leading-relaxed relative", isMe ? (isUser ? "bg-[#B38E5D] text-white rounded-tr-none border-transparent" : "bg-[#9f2241] text-white rounded-tr-none border-transparent") : isBot ? "bg-slate-800 text-white rounded-tl-none border-transparent" : "bg-white text-slate-700 rounded-tl-none border-slate-100")}>
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
                {isTyping && <div className="flex justify-start animate-pulse"><div className="bg-white p-4 rounded-3xl rounded-tl-none shadow-xl flex items-center gap-4 border border-slate-100"><div className="flex gap-1.5"><div className="h-2 w-2 rounded-full bg-[#9f2241] animate-bounce [animation-delay:-0.3s]" /><div className="h-2 w-2 rounded-full bg-[#9f2241] animate-bounce [animation-delay:-0.15s]" /><div className="h-2 w-2 rounded-full bg-[#9f2241] animate-bounce" /></div><span className="text-[9px] font-black uppercase text-slate-400">ANALISTA ESCRIBIENDO...</span></div></div>}
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

      {/* Modal Nueva Solicitud Técnica - COMPACTED FOR ZERO-SCROLL */}
      <Dialog open={isNewTicketDialogOpen} onOpenChange={setIsNewTicketDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[98vh] flex flex-col">
          <DialogHeader className="p-4 bg-[#9f2241] text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 rotate-12"><FilePlus className="h-12 w-12" /></div>
            <DialogTitle className="uppercase font-black text-base flex items-center gap-2 relative z-10 leading-none"><FilePlus className="h-5 w-5 text-accent" /> SOLICITUD TÉCNICA</DialogTitle>
            <DialogDescription className="text-white/60 text-[8px] uppercase font-bold mt-1 relative z-10">DEPARTAMENTO DE TECNOLOGÍA EDUCATIVA</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-4 space-y-2">
             <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center gap-3 shadow-inner">
                <AlertCircle className="h-5 w-5 text-primary shrink-0" />
                <p className="text-[8px] font-bold text-slate-600 uppercase leading-tight">Complete la información para generar su folio de seguimiento oficial.</p>
             </div>

             <div className="space-y-2 pt-1">
                <h4 className="text-[9px] font-black uppercase text-accent border-b pb-0.5 flex items-center gap-2"><User className="h-3 w-3" /> Información del Solicitante</h4>
                <div className="space-y-1">
                  <Label className="text-[8px] font-black uppercase text-slate-400 pl-1">Nombre Completo</Label>
                  <Input 
                    placeholder="PATERNO MATERNO NOMBRES..." 
                    className="h-9 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase shadow-inner focus:bg-white transition-all"
                    value={requesterName}
                    onChange={e => setRequesterName(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[8px] font-black uppercase text-slate-400 pl-1">Correo Institucional</Label>
                    <Input 
                      placeholder="ejemplo@desysa.edu.mx" 
                      className="h-9 bg-slate-50 border-none rounded-xl text-[9px] font-bold shadow-inner focus:bg-white transition-all"
                      value={requesterEmail}
                      onChange={e => setRequesterEmail(e.target.value.toLowerCase())}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[8px] font-black uppercase text-slate-400 pl-1">Tema de Ayuda</Label>
                    <Select 
                      value={helpTopic} 
                      onValueChange={val => {
                        setHelpTopic(val);
                        if (val === 'cuenta') setIsResponsivaOpen(true);
                      }}
                    >
                      <SelectTrigger className="h-9 bg-slate-50 border-none rounded-xl text-[8px] font-black uppercase shadow-inner">
                        <SelectValue placeholder="ELEGIR..." />
                      </SelectTrigger>
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

             <div className="space-y-2 pt-1">
                <h4 className="text-[9px] font-black uppercase text-accent border-b pb-0.5 flex items-center gap-2"><Monitor className="h-3 w-3" /> Datos del Servicio</h4>
                <div className="grid grid-cols-2 gap-2">
                   <div className="space-y-1">
                      <Label className="text-[8px] font-black uppercase text-slate-400 pl-1 flex items-center gap-2"><School className="h-3 w-3 text-primary" /> CCT del Plantel</Label>
                      <Input 
                         placeholder="15DES0000X" 
                         className="h-9 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase shadow-inner focus:bg-white transition-all"
                         value={ticketCct}
                         onChange={e => setTicketCct(e.target.value.toUpperCase())}
                         maxLength={10}
                      />
                   </div>
                   <div className="space-y-1">
                      <Label className="text-[8px] font-black uppercase text-slate-400 pl-1 flex items-center gap-2"><MessageSquare className="h-3 w-3 text-primary" /> Detalle Técnico</Label>
                      <Input 
                         placeholder="BREVE DESCRIPCIÓN..." 
                         className="h-9 bg-slate-50 border-none rounded-xl text-[10px] font-semibold shadow-inner focus:bg-white transition-all"
                         value={ticketDetail}
                         onChange={e => setTicketDetail(e.target.value.toUpperCase())}
                      />
                   </div>
                </div>

                <div className="space-y-2 pt-1">
                   <Label className="text-[8px] font-black uppercase text-slate-400 pl-1 flex items-center gap-2">
                      <Paperclip className="h-3 w-3 text-primary" /> Adjuntos Oficiales (Requeridos)
                   </Label>
                   
                   <div className="grid grid-cols-2 gap-3">
                      {/* PDF Upload Slot */}
                      <div className="relative group">
                         <div className={cn(
                            "flex items-center gap-2 bg-slate-50 rounded-xl p-2 border-2 border-dashed transition-all cursor-pointer relative shadow-inner h-12",
                            pdfFile ? "border-rose-300 bg-rose-50/50" : "border-slate-200 hover:border-primary/30"
                         )}>
                            <div className={cn(
                               "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                               pdfFile ? "bg-rose-500 text-white" : "bg-white text-slate-400"
                            )}>
                               <FileText className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-[8px] font-black uppercase text-slate-500 truncate">
                                  {pdfFile ? pdfFile.name : "1. SOLICITUD PDF"}
                               </p>
                            </div>
                            {pdfFile && <button onClick={(e) => { e.preventDefault(); setPdfFile(null); }} className="text-rose-400 hover:text-rose-600"><X className="h-3 w-3" /></button>}
                            <input 
                               type="file" 
                               accept=".pdf" 
                               className="absolute inset-0 opacity-0 cursor-pointer" 
                               onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) setPdfFile(file);
                                  e.target.value = '';
                               }}
                            />
                         </div>
                      </div>

                      {/* Excel Upload Slot */}
                      <div className="relative group">
                         <div className={cn(
                            "flex items-center gap-2 bg-slate-50 rounded-xl p-2 border-2 border-dashed transition-all cursor-pointer relative shadow-inner h-12",
                            excelFile ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200 hover:border-primary/30"
                         )}>
                            <div className={cn(
                               "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                               excelFile ? "bg-emerald-500 text-white" : "bg-white text-slate-400"
                            )}>
                               <FileSpreadsheet className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-[8px] font-black uppercase text-slate-500 truncate">
                                  {excelFile ? excelFile.name : "2. EXCEL"}
                               </p>
                            </div>
                            {excelFile && <button onClick={(e) => { e.preventDefault(); setExcelFile(null); }} className="text-emerald-400 hover:text-emerald-600"><X className="h-3 w-3" /></button>}
                            <input 
                               type="file" 
                               accept=".xlsx, .xls" 
                               className="absolute inset-0 opacity-0 cursor-pointer" 
                               onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) setExcelFile(file);
                                  e.target.value = '';
                               }}
                            />
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
          <DialogFooter className="p-3 bg-slate-50 border-t flex justify-end gap-3 shrink-0">
            <Button variant="ghost" onClick={() => { setIsNewTicketDialogOpen(false); setPdfFile(null); setExcelFile(null); }} className="h-8 px-4 text-[9px] font-black uppercase text-slate-400">CANCELAR</Button>
            <Button onClick={handleSendNewTicketRequest} className="btn-institutional h-10 px-8 text-[10px]">ENVIAR SOLICITUD</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Carta Responsiva */}
      <Dialog open={isResponsivaOpen} onOpenChange={setIsResponsivaOpen}>
        <DialogContent className="sm:max-w-[620px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white h-[85vh] flex flex-col">
          <DialogHeader className="p-6 bg-[#9f2241] text-white shrink-0 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><ShieldCheck className="h-20 w-20" /></div>
             <DialogTitle className="uppercase font-black text-white text-lg leading-tight relative z-10">CARTA RESPONSIVA SOBRE EL USO DEL CORREO ELECTRÓNICO INSTITUCIONAL</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-8 space-y-6 text-[11.5px] leading-relaxed text-slate-700 text-justify font-medium bg-[#fdfaf5]">
                <p className="font-bold text-[#9f2241] border-b-2 border-[#9f2241]/10 pb-4">
                  La presente carta tiene como objetivo la definición de las reglas de operación de las cuentas y contraseñas del correo electrónico institucional de la estructura de la Dirección de Educación Secundaria y Servicios de Apoyo (DESySA). Las cláusulas aquí definidas aplican a todas las personas que tienen acceso a una cuenta de correo con dominio @desysa.gob.mx, @desysa.edu.mx y @aulamexiquense.mx, creada por el Departamento de Computación Electrónica en la Educación Secundaria (COEES). El cumplimiento de estas reglas es responsabilidad del signatario.
                </p>
                
                <div className="space-y-5 pr-2">
                    <div className="flex gap-4 items-start">
                      <div className="h-5 w-5 rounded-full bg-[#B38E5D] text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-md">1</div>
                      <p>El servicio de correo electrónico deberá usarse exclusivamente para asuntos relacionados con el organismo y sus instituciones.</p>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="h-5 w-5 rounded-full bg-[#B38E5D] text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-md">2</div>
                      <p>Las cuentas de correo son personales. Por lo cual, los titulares de las cuentas son responsables directos del buen uso de las mismas.</p>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="h-5 w-5 rounded-full bg-[#B38E5D] text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-md">3</div>
                      <p>Las claves de acceso son para uso exclusivo de la persona usuaria titular y su custodia y correcta utilización son de su responsabilidad. Queda prohibido permitir su utilización a personas no autorizadas.</p>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="h-5 w-5 rounded-full bg-[#B38E5D] text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-md">4</div>
                      <p>Los usuarios de este servicio deberán realizar el cambio de contraseña al recibir por primera vez su cuenta, cuando sea requerido por el sistema o cuando considere que la cuenta esté en riesgo por mal uso.</p>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="h-5 w-5 rounded-full bg-[#B38E5D] text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-md">5</div>
                      <p>Queda prohibido enviar correo electrónico no solicitado o cadenas (spamming), con fines comerciales, informativos, publicitarios, políticos y religiosos entre otros; así mismo se deberá respetar la privacidad de otros usuarios.</p>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="h-5 w-5 rounded-full bg-[#B38E5D] text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-md">6</div>
                      <p>Queda prohibido el uso de cuentas de correo electrónico por parte de personas distintas al titular de la misma, por lo que las cuentas y contraseñas son intransferibles.</p>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="h-5 w-5 rounded-full bg-[#B38E5D] text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-md">7</div>
                      <p>Es responsabilidad de los titulares de las cuentas de correo electrónico, respaldar la información (mensajes) en medios magnéticos u ópticos, para su restauración en caso de pérdida o destrucción parcial o total.</p>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="h-5 w-5 rounded-full bg-[#B38E5D] text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-md">8</div>
                      <p>Estas cuentas son un medio de comunicación de la estructura de la DESySA, por lo que el titular está obligado a consultarla y realizar revisiones periódicas al buzón con la finalidad de depurarlo y asegurar la buena recepción de mensajes.</p>
                    </div>
                </div>

                <p className="font-black pt-6 border-t border-[#9f2241]/20 mt-6 text-slate-800 uppercase tracking-tighter">
                  Acepto que he leído cada una de las cláusulas y las aceptaciones de conformidad con las políticas establecidas.
                </p>
                <div className="h-10" />
              </div>
            </ScrollArea>
          </div>
          
          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-center shrink-0">
            <Button onClick={() => setIsResponsivaOpen(false)} className="btn-institutional w-full h-14 text-[11px] shadow-2xl hover:scale-[1.02] transition-transform">
               ACEPTO Y CONTINUAR CON LA SOLICITUD
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Seguimiento de Folio */}
      <Dialog open={isTrackTicketDialogOpen} onOpenChange={setIsTrackTicketDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[1.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-3 bg-[#B38E5D] text-white"><DialogTitle className="uppercase font-black text-sm flex items-center gap-2"><Search className="h-4 w-4 text-white" /> CONSULTAR ESTATUS</DialogTitle></DialogHeader>
          <div className="p-4 space-y-4">
             <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Número de Seguimiento</Label>
                <div className="flex gap-2">
                   <Input placeholder="ATRES-00000" className="h-9 bg-slate-50 border-none rounded-lg text-[11px] font-mono font-black uppercase flex-1 shadow-inner" value={trackFolioInput} onChange={e => setTrackFolioInput(e.target.value.toUpperCase())} />
                   <Button onClick={handleTrackFolio} className="h-9 w-9 p-0 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-lg"><Search className="h-4 w-4" /></Button>
                </div>
             </div>
             {trackedTicket && (
               <div className="p-4 bg-slate-50 rounded-2xl border-2 border-accent/20 animate-in zoom-in-95 duration-500">
                  <div className="flex justify-between items-start border-b border-accent/10 pb-2 mb-3">
                     <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">FOLIO IDENTIFICADO:</p><h4 className="text-lg font-black text-primary leading-none">{trackedTicket.id || trackedTicket.ticketNumber}</h4></div>
                     <Badge className={cn("text-[9px] font-black uppercase py-1 px-3 rounded-full shadow-sm", trackedTicket.displayStatus === 'Atendida' ? "bg-emerald-500" : trackedTicket.displayStatus === 'En Proceso' ? "bg-amber-500" : "bg-rose-500")}>{trackedTicket.displayStatus}</Badge>
                  </div>
                  <div className="space-y-2"><p className="text-[9px] font-bold text-slate-600 uppercase"><span className="text-accent">Plantel:</span> {trackedTicket.schoolName || 'En Proceso'}</p><p className="text-[9px] font-bold text-slate-600 uppercase"><span className="text-accent">Oficina:</span> {trackedTicket.oficinaRegionalAtencion || 'Pendiente'}</p>{trackedTicket.observaciones && <p className="text-[9px] font-semibold text-slate-500 italic mt-2 border-t pt-2">{trackedTicket.observaciones}</p>}</div>
               </div>
             )}
          </div>
          <DialogFooter className="p-3 bg-slate-50 border-t"><Button variant="ghost" onClick={() => { setIsTrackTicketDialogOpen(false); setTrackedTicket(null); setTrackFolioInput(''); }} className="w-full h-8 text-[9px] font-black uppercase text-slate-400">CERRAR CONSULTA</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Concluir Servicio Técnico (Analista) */}
      <Dialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[95vh] flex flex-col">
          <DialogHeader className="p-3 bg-[#9f2241] text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 rotate-12"><CheckCircle2 className="h-10 w-10" /></div>
            <DialogTitle className="uppercase font-black text-white text-base flex items-center gap-2 relative z-10 leading-none"><ShieldCheck className="h-4 w-4 text-[#B38E5D]" /> CONCLUIR SERVICIO</DialogTitle>
            <DialogDescription className="text-white/60 font-bold text-[7px] uppercase tracking-[0.2em] mt-0.5 relative z-10">REGISTRO OFICIAL ATRES</DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-primary tracking-widest pl-1 flex items-center gap-2"><School className="h-3 w-3 text-accent" /> Plantel Atendido</Label>
              <div className="relative">
                 <Input placeholder="BUSCAR POR CCT O NOMBRE..." className="h-8 bg-slate-50 border-none rounded-lg text-[10px] font-black uppercase px-3 shadow-inner focus:bg-white transition-all" value={finishSearchTerm} onChange={e => setFinishSearchTerm(e.target.value)} />
                 {finishSearchTerm.length > 2 && (
                  <div className="absolute left-0 right-0 top-9 max-h-24 overflow-y-auto bg-white border border-slate-100 rounded-lg shadow-xl divide-y z-50 animate-in fade-in zoom-in-95 duration-200">
                    {schoolsDirectory.filter(s => s.cct.includes(finishSearchTerm.toUpperCase()) || s.nombre.includes(finishSearchTerm.toUpperCase())).slice(0, 5).map(s => (
                      <div key={`${s.cct}-${s.turno}`} className="p-2 hover:bg-primary/5 cursor-pointer flex justify-between items-center transition-colors group" onClick={() => { setFinishForm({...finishForm, cct: s.cct, schoolName: s.nombre, municipio: s.municipio, valle: s.valle}); setFinishSearchTerm('') }}>
                        <div className="flex flex-col"><span className="text-[9px] font-black uppercase text-slate-800">{s.nombre}</span><span className="text-[7px] font-mono text-slate-400">{s.cct}</span></div>
                        <Badge variant="secondary" className="bg-primary/5 text-primary text-[6px] font-black px-1 rounded-full">{s.modalidad}</Badge>
                      </div>
                    ))}
                  </div>
                 )}
              </div>
              {finishForm.cct && (
                <div className="p-2 bg-emerald-50/50 border border-emerald-100 rounded-lg animate-in zoom-in-95 duration-500 flex items-center gap-2">
                   <div className="h-6 w-6 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckCircle2 className="h-3 w-3" /></div>
                   <div className="flex-1 min-w-0"><p className="text-[7px] font-black text-emerald-700 uppercase tracking-widest leading-none">SELECCIONADO:</p><h4 className="text-[10px] font-black text-slate-800 uppercase leading-none truncate mt-0.5">{finishForm.schoolName}</h4></div>
                   <button onClick={() => setFinishForm({...finishForm, cct: '', schoolName: ''})} className="text-slate-400 hover:text-rose-500"><X className="h-3 w-3" /></button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 pl-1">OFICINA REGIONAL</Label>
                <Select value={finishForm.oficinaRegionalAtencion} onValueChange={v => setFinishForm({...finishForm, oficinaRegionalAtencion: v})}>
                  <SelectTrigger className="h-8 bg-slate-50 border-none rounded-lg text-[9px] font-black uppercase shadow-inner"><SelectValue placeholder="ELEGIR..." /></SelectTrigger>
                  <SelectContent className="rounded-lg">{REGIONAL_OFFICES.map(off => <SelectItem key={off} value={off} className="text-[9px] font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-[9px] font-black uppercase text-slate-400 pl-1">ID DE TURNO</Label><div className="h-8 bg-slate-100 rounded-lg flex items-center px-3 font-mono font-black text-primary shadow-inner text-[10px]">{selectedRequest?.ticketNumber}</div></div>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase text-primary pl-1 flex items-center gap-2"><Sparkles className="h-3 w-3 text-accent" /> Resumen de Atención Técnica</Label>
              <Textarea placeholder="ACUERDOS Y HALLAZGOS..." className="h-16 bg-slate-50 border-none rounded-lg p-2 text-[10px] font-semibold shadow-inner focus:bg-white transition-all resize-none" value={finishForm.servicio} onChange={e => setFinishForm({...finishForm, servicio: e.target.value.toUpperCase()})} />
            </div>
          </div>
          <DialogFooter className="p-3 bg-slate-50 border-t flex justify-end gap-2 shrink-0"><Button variant="ghost" onClick={() => setIsFinishDialogOpen(false)} className="h-8 px-4 text-[8px] font-black uppercase tracking-widest text-slate-400">CANCELAR</Button><Button onClick={handleFinishConfirm} className="btn-institutional h-10 px-8 text-[10px] gap-2 shadow-xl"><Save className="h-4 w-4" /> REGISTRAR ATENCIÓN</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
