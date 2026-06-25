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
  DialogDescription,
  DialogFooter
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
  User, 
  MonitorOff, 
  Loader2, 
  Headset,
  Copy,
  Check,
  Users,
  ChevronRight,
  MessageSquare,
  RefreshCcw,
  Ticket,
  Search,
  CheckCircle2,
  Save,
  School,
  Building2,
  Download,
  Paperclip,
  FileText,
  FileSpreadsheet,
  FileCode,
  Plus,
  Trash2,
  BookOpen,
  Monitor,
  ArrowRightCircle,
  HelpCircle,
  Sparkles,
  Clock
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
  const [copied, setCopied] = useState(false)
  const [sessionKey, setSessionKey] = useState<string>('')
  
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

  useEffect(() => {
    if (isPublic) {
      let sKey = sessionStorage.getItem('atres_session_id')
      if (!sKey) {
        sKey = `USER-${Date.now()}`
        sessionStorage.setItem('atres_session_id', sKey)
      }
      setSessionKey(sKey)
      
      const savedTicket = sessionStorage.getItem('atres_active_ticket')
      if (savedTicket) {
        setActiveTicketNumber(savedTicket)
      }

      const savedShow = sessionStorage.getItem('atres_show_remote_panel')
      if (savedShow === 'true') {
        setShowRemotePanel(true)
      }
    } else {
      const savedTechName = localStorage.getItem('atres_tech_name')
      if (savedTechName) setTechName(savedTechName)
      
      const savedLibrary = localStorage.getItem('atres_tech_library')
      if (savedLibrary) setTechLibrary(JSON.parse(savedLibrary))
    }
  }, [isPublic])

  const resetForNewRequest = useCallback(() => {
    setRemoteId('')
    setIsRemoteRequested(false)
    setActiveTicketNumber(null)
    setHighlightRemote(false)
    setShowRemotePanel(false)
    sessionStorage.removeItem('atres_active_ticket')
    sessionStorage.removeItem('atres_show_remote_panel')
    const newSKey = `USER-${Date.now()}`
    sessionStorage.setItem('atres_session_id', newSKey)
    setSessionKey(newSKey)
    setMessages([])
  }, [])

  const handleEditRemoteId = () => {
    setIsRemoteRequested(false)
    setHighlightRemote(true)
    toast({ title: "Modo Edición", description: "Ahora puede ingresar un nuevo ID." })
  }

  useEffect(() => {
    if (!isPublic || !activeTicketNumber) return;

    const handleSessionStatus = (e: StorageEvent) => {
      if (e.key === `atres_session_status_${activeTicketNumber}` && e.newValue === 'closed') {
        toast({ title: "Atención Finalizada", description: "El técnico ha concluido y registrado el servicio." });
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
      const initial: Message[] = [
        { 
          role: 'bot', 
          content: '¡Hola! Soy tu Asistente Virtual COEES. ¿En qué puedo apoyarte con el sistema ATRES o soporte técnico hoy?', 
          timestamp: Date.now() 
        }
      ]
      setMessages(initial)
      localStorage.setItem(historyKey, JSON.stringify(initial))
    }
  }, [activeChatId])

  useEffect(() => {
    setMounted(true)
    syncQueue()
    syncChat()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'atres_support_queue') {
        syncQueue()
      }
      if (activeChatId && e.key === `atres_chat_${activeChatId}`) {
        syncChat()
      }
    };

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [syncQueue, syncChat, activeChatId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleTechNameChange = (val: string) => {
    const upperVal = val.toUpperCase()
    setTechName(upperVal)
    localStorage.setItem('atres_tech_name', upperVal)
  }

  const generateSequentialFolio = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const cycle = month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    const counterKey = `atres_folio_counter_${cycle}`;
    const lastCounter = parseInt(localStorage.getItem(counterKey) || '0', 10);
    const nextCounter = lastCounter + 1;
    localStorage.setItem(counterKey, nextCounter.toString());
    const formattedNum = nextCounter.toString().padStart(5, '0');
    return `ATRES-${formattedNum}`;
  }

  const handleSendMessage = async (fileData?: { data: string, name: string, type: string }) => {
    if (!input.trim() && !fileData) return

    let currentFolio = activeTicketNumber;
    let updatedActiveChatId = activeChatId;

    const lowerInput = input.toLowerCase();
    const isRemoteIssue = lowerInput.includes('office') || lowerInput.includes('windows') || lowerInput.includes('impresora') || lowerInput.includes('activar');

    if (isPublic && !currentFolio) {
      currentFolio = generateSequentialFolio();
      setActiveTicketNumber(currentFolio);
      sessionStorage.setItem('atres_active_ticket', currentFolio);
      
      const newRequest: SupportRequest = { 
        remoteId: '', 
        ticketNumber: currentFolio,
        timestamp: Date.now(), 
        status: 'pending' as const,
        requestType: isRemoteIssue ? 'remote' : 'chat',
        chatKey: sessionKey
      }

      const rawQueue = localStorage.getItem('atres_support_queue')
      const currentQueue = rawQueue ? JSON.parse(rawQueue) : []
      const newQueue = [newRequest, ...currentQueue]
      localStorage.setItem('atres_support_queue', JSON.stringify(newQueue))
      window.dispatchEvent(new StorageEvent('storage', { key: 'atres_support_queue', newValue: JSON.stringify(newQueue) }))
      
      const oldHistory = localStorage.getItem(`atres_chat_${sessionKey}`);
      if (oldHistory) {
        localStorage.setItem(`atres_chat_${currentFolio}`, oldHistory);
        updatedActiveChatId = currentFolio;
      }
    }

    const myRole = isPublic ? 'user' : 'tech'
    const newMessage: Message = { 
      role: myRole, 
      content: input, 
      timestamp: Date.now(),
      senderName: !isPublic ? techName : undefined,
      fileData: fileData?.data,
      fileName: fileData?.name,
      fileType: fileData?.type
    }

    const historyKey = `atres_chat_${updatedActiveChatId}`
    const currentMessages = JSON.parse(localStorage.getItem(historyKey) || '[]')
    const updatedMessages = [...currentMessages, newMessage]
    
    localStorage.setItem(historyKey, JSON.stringify(updatedMessages))
    setMessages(updatedMessages)
    window.dispatchEvent(new StorageEvent('storage', {
      key: historyKey,
      newValue: JSON.stringify(updatedMessages),
      storageArea: localStorage
    }))

    if (isPublic && myRole === 'user' && !fileData) {
      if (isRemoteIssue) {
        setShowRemotePanel(true);
        sessionStorage.setItem('atres_show_remote_panel', 'true');
        setHighlightRemote(true);
        setIsTyping(true);
        setTimeout(() => {
          const botReply: Message = {
            role: 'bot',
            content: 'He detectado que tu consulta requiere soporte remoto. He activado el panel izquierdo para que ingreses tu ID de AnyDesk y podamos ayudarte.',
            timestamp: Date.now()
          };
          const finalMessages = [...updatedMessages, botReply];
          localStorage.setItem(historyKey, JSON.stringify(finalMessages));
          setMessages(finalMessages);
          window.dispatchEvent(new StorageEvent('storage', { key: historyKey, newValue: JSON.stringify(finalMessages), storageArea: localStorage }));
          setIsTyping(false);
        }, 1000);
      } else if (currentMessages.length === 1) {
        setIsTyping(true);
        setTimeout(() => {
          const botReply: Message = {
            role: 'bot',
            content: `Tu solicitud ha sido registrada con el folio ${currentFolio}. Un técnico se unirá a este chat en breve.`,
            timestamp: Date.now()
          };
          const finalMessages = [...updatedMessages, botReply];
          localStorage.setItem(historyKey, JSON.stringify(finalMessages));
          setMessages(finalMessages);
          window.dispatchEvent(new StorageEvent('storage', { key: historyKey, newValue: JSON.stringify(finalMessages), storageArea: localStorage }));
          setIsTyping(false);
        }, 1000);
      }
    }

    setInput('')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64Data = event.target?.result as string
      handleSendMessage({ data: base64Data, name: file.name, type: file.type })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleLibraryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64Data = event.target?.result as string
      const newFile: TechFile = {
        id: `FILE-${Date.now()}`,
        name: file.name,
        data: base64Data,
        type: file.type,
        lastUpdated: Date.now()
      }
      const updatedLib = [newFile, ...techLibrary]
      setTechLibrary(updatedLib)
      localStorage.setItem('atres_tech_library', JSON.stringify(updatedLib))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const replaceLibraryFile = (id: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = (e: any) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64Data = event.target?.result as string
        const updatedLib = techLibrary.map(f => f.id === id ? {
          ...f,
          name: file.name,
          data: base64Data,
          type: file.type,
          lastUpdated: Date.now()
        } : f)
        setTechLibrary(updatedLib)
        localStorage.setItem('atres_tech_library', JSON.stringify(updatedLib))
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const removeLibraryFile = (id: string) => {
    const updatedLib = techLibrary.filter(f => f.id !== id)
    setTechLibrary(updatedLib)
    localStorage.setItem('atres_tech_library', JSON.stringify(updatedLib))
  }

  const sendLibraryFile = (file: TechFile) => {
    handleSendMessage({ data: file.data, name: file.name, type: file.type })
  }

  const downloadFile = (data: string, name: string) => {
    const link = document.createElement('a')
    link.href = data
    link.download = name
    link.click()
  }

  const handleRequestRemote = () => {
    if (!remoteId || remoteId.length < 5) {
      toast({ variant: "destructive", title: "ID Inválido", description: "Ingrese un ID de AnyDesk válido." })
      return
    }
    let currentFolio = activeTicketNumber || generateSequentialFolio();
    const rawQueue = localStorage.getItem('atres_support_queue')
    const currentQueue: SupportRequest[] = rawQueue ? JSON.parse(rawQueue) : []
    const existingIndex = currentQueue.findIndex(r => r.ticketNumber === currentFolio || r.chatKey === sessionKey);
    const newRequest: SupportRequest = { 
      remoteId, 
      ticketNumber: currentFolio,
      timestamp: Date.now(), 
      status: 'pending' as const,
      requestType: 'remote',
      chatKey: sessionKey
    }
    let newQueue = existingIndex >= 0 ? [...currentQueue] : [newRequest, ...currentQueue];
    if (existingIndex >= 0) newQueue[existingIndex] = newRequest;
    localStorage.setItem('atres_support_queue', JSON.stringify(newQueue))
    window.dispatchEvent(new StorageEvent('storage', { key: 'atres_support_queue', newValue: JSON.stringify(newQueue) }))
    
    const botMsg: Message = { 
      role: 'bot', 
      content: `Solicitud de soporte remoto vinculada.\n\nFOLIO: ${currentFolio}\nID DE CONEXIÓN: ${remoteId}\n\nAnalista en camino.`, 
      timestamp: Date.now() 
    };
    const historyKey = `atres_chat_${currentFolio}`
    const oldMsgs = JSON.parse(localStorage.getItem(`atres_chat_${sessionKey}`) || '[]');
    const finalMsgs = [...oldMsgs, botMsg];
    localStorage.setItem(historyKey, JSON.stringify(finalMsgs));
    setMessages(finalMsgs);
    setActiveTicketNumber(currentFolio);
    sessionStorage.setItem('atres_active_ticket', currentFolio);
    setIsRemoteRequested(true);
    setHighlightRemote(false);
    window.dispatchEvent(new StorageEvent('storage', { key: historyKey, newValue: JSON.stringify(finalMsgs), storageArea: localStorage }));
  }

  const copyId = (idToCopy: string) => {
    navigator.clipboard.writeText(idToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "ID Copiado" })
  }

  const handleFinishConfirm = () => {
    if (!finishForm.cct || !finishForm.servicio || !finishForm.oficinaRegionalAtencion) {
      toast({ variant: "destructive", title: "Campos Incompletos", description: "Seleccione un plantel, oficina y describa el servicio." })
      return
    }
    const folio = selectedRequest!.ticketNumber;
    const rawPrograms = localStorage.getItem('programs_full_v24')
    const programs = rawPrograms ? JSON.parse(rawPrograms) : []
    const newAtresRecord = {
      id: folio,
      name: 'ATRES',
      cct: finishForm.cct,
      schoolName: finishForm.schoolName,
      municipio: finishForm.municipio,
      valle: finishForm.valle,
      status: 'concluido',
      date: format(new Date(), 'yyyy-MM-dd'),
      progress: 100,
      asistentes: [],
      observaciones: finishForm.servicio, 
      tecnicos: techName,
      oficinaRegionalAtencion: finishForm.oficinaRegionalAtencion
    }
    const updatedPrograms = [newAtresRecord, ...programs]
    localStorage.setItem('programs_full_v24', JSON.stringify(updatedPrograms))
    window.dispatchEvent(new StorageEvent('storage', { key: 'programs_full_v24', newValue: JSON.stringify(updatedPrograms) }))

    localStorage.setItem(`atres_session_status_${folio}`, 'closed');
    window.dispatchEvent(new StorageEvent('storage', { key: `atres_session_status_${folio}`, newValue: 'closed' }));

    const rawQueue = localStorage.getItem('atres_support_queue')
    const currentQueue: SupportRequest[] = rawQueue ? JSON.parse(rawQueue) : []
    const newQueue = currentQueue.filter(r => r.ticketNumber !== folio)
    localStorage.setItem('atres_support_queue', JSON.stringify(newQueue))
    window.dispatchEvent(new StorageEvent('storage', { key: 'atres_support_queue', newValue: JSON.stringify(newQueue) }))
    
    setIsFinishDialogOpen(false)
    setSelectedRequest(null)
    setFinishForm({ cct: '', schoolName: '', servicio: '', municipio: '', valle: '', oficinaRegionalAtencion: '' })
    setFinishSearchTerm('')
    syncQueue()
    toast({ title: "Sesión Finalizada" })
  }

  const handleSchoolSelect = (s: any) => {
    setFinishForm({ ...finishForm, cct: s.cct, schoolName: s.nombre, municipio: s.municipio, valle: s.valle })
    setFinishSearchTerm('')
  }

  const getFileIcon = (type: string) => {
    if (type.includes('word')) return <FileText className="h-6 w-6 text-blue-600" />
    if (type.includes('excel') || type.includes('spreadsheet')) return <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
    if (type.includes('pdf')) return <FileText className="h-6 w-6 text-rose-600" />
    return <FileCode className="h-6 w-6 text-slate-400" />
  }

  if (!mounted) return null

  return (
    <div className={cn(
      "flex h-full flex-col md:flex-row bg-white overflow-hidden", 
      isPublic && "rounded-[2.5rem] shadow-[0_48px_100px_rgba(0,0,0,0.1)] border border-primary/5"
    )}>
      {(!isPublic || showRemotePanel) && (
        <div className={cn(
          "w-full md:w-[380px] border-r p-8 space-y-8 shrink-0 flex flex-col overflow-y-auto animate-in slide-in-from-left duration-700",
          isPublic ? "bg-slate-50/50 backdrop-blur-3xl" : "bg-slate-50"
        )}>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
               <Badge className="bg-primary/10 text-primary text-[8px] font-black uppercase px-2 py-0.5 tracking-tighter border border-primary/20">SOPORTE COEES</Badge>
            </div>
            <h3 className="text-3xl font-black text-primary uppercase leading-[0.9] tracking-tighter">Asistencia <br /> Remota</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Protocolo ATRES 2026</p>
          </div>

          {!isPublic ? (
            <div className="flex-1 space-y-8 flex flex-col min-h-0">
               <div className="space-y-5">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                     <Users className="h-4 w-4 text-accent" />
                     <span className="text-[11px] font-black uppercase text-slate-700 tracking-widest">Cola de Espera ({queue.length})</span>
                  </div>
                  <div className="space-y-3">
                     {queue.map((req) => (
                       <button key={req.ticketNumber} onClick={() => setSelectedRequest(req)} className={cn("w-full p-5 rounded-3xl border text-left transition-all flex items-center justify-between group transform active:scale-95", selectedRequest?.ticketNumber === req.ticketNumber ? "bg-primary border-primary shadow-2xl shadow-primary/20" : "bg-white hover:bg-slate-100 border-slate-200 shadow-sm")}>
                         <div className="flex flex-col gap-1">
                           <span className={cn("text-[9px] font-black uppercase flex items-center gap-1.5", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white/60" : "text-accent")}><Ticket className="h-3 w-3" /> {req.ticketNumber}</span>
                           <span className={cn("text-base font-mono font-black", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white" : "text-primary")}>{req.requestType === 'chat' ? 'Consulta Chat' : (req.remoteId || 'Sin ID')}</span>
                         </div>
                         <div className={cn("h-8 w-8 rounded-2xl flex items-center justify-center transition-colors", selectedRequest?.ticketNumber === req.ticketNumber ? "bg-white/10 text-white" : "bg-slate-50 text-slate-300")}>
                           <ChevronRight className="h-4 w-4" />
                         </div>
                       </button>
                     ))}
                  </div>
               </div>
               <div className="space-y-5 flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                     <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-accent" /><span className="text-[11px] font-black uppercase text-slate-700 tracking-widest">Biblioteca Técnica</span></div>
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 rounded-xl" onClick={() => libraryInputRef.current?.click()}><Plus className="h-5 w-5" /></Button>
                     <input type="file" ref={libraryInputRef} className="hidden" onChange={handleLibraryUpload} />
                  </div>
                  <ScrollArea className="flex-1">
                     <div className="space-y-3 pr-4">
                        {techLibrary.map(file => (
                          <div key={file.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 group hover:border-primary/30 transition-all">
                             <div className="flex items-center gap-4">{getFileIcon(file.type)}<div className="flex-1 min-w-0"><p className="text-[11px] font-black text-slate-700 truncate uppercase leading-none">{file.name}</p><p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Formato Oficial</p></div></div>
                             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="outline" className="flex-1 h-8 text-[9px] font-black uppercase text-primary border-primary/20 rounded-xl hover:bg-primary hover:text-white" onClick={() => sendLibraryFile(file)} disabled={!selectedRequest}>Enviar al Chat</Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-accent rounded-xl" onClick={() => replaceLibraryFile(file.id)}><RefreshCcw className="h-4 w-4" /></Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-rose-600 rounded-xl" onClick={() => removeLibraryFile(file.id)}><Trash2 className="h-4 w-4" /></Button>
                             </div>
                          </div>
                        ))}
                     </div>
                  </ScrollArea>
               </div>
            </div>
          ) : (
            <div className="space-y-10 animate-in slide-in-from-top-6 duration-1000">
              <div className={cn(
                "p-8 bg-white rounded-[3rem] border-2 shadow-[0_32px_64px_rgba(0,0,0,0.06)] space-y-8 transition-all duration-700 relative overflow-hidden",
                highlightRemote ? "border-primary ring-[12px] ring-primary/5 scale-[1.03] animate-pulse" : "border-slate-100"
              )}>
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                   <Monitor className="h-32 w-32" />
                </div>

                <div className="space-y-2 relative z-10">
                   <div className="flex items-center gap-2 mb-2">
                      <div className={cn("h-3 w-3 rounded-full", isRemoteRequested ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse" : "bg-slate-300")} />
                      <span className="text-[11px] font-black uppercase text-slate-800 tracking-widest">Enlace Remoto Activo</span>
                   </div>
                   <h4 className="text-sm font-black uppercase text-primary leading-tight">Solicitud Cuenta institucional/Windows</h4>
                </div>

                {activeTicketNumber && (
                   <div className="bg-primary/5 p-5 rounded-[2rem] border border-primary/10 text-center shadow-inner group transition-all hover:bg-primary/10">
                      <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest mb-1">Folio de Atención</p>
                      <div className="flex items-center justify-center gap-3">
                         <Ticket className="h-5 w-5 text-primary opacity-30" />
                         <p className="text-3xl font-black text-primary tracking-tighter">{activeTicketNumber}</p>
                      </div>
                   </div>
                )}

                <div className="space-y-4 relative z-10">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">ID ANYDESK / TEAMVIEWER</Label>
                  <div className="relative">
                    <Input 
                      placeholder="000 000 000" 
                      className="h-20 text-center font-mono font-black border-slate-200 text-4xl bg-slate-50/50 rounded-[2rem] focus:bg-white focus:ring-8 focus:ring-primary/5 transition-all shadow-inner tracking-widest" 
                      value={remoteId} 
                      onChange={(e) => setRemoteId(e.target.value)} 
                      disabled={isRemoteRequested} 
                    />
                    <div className="absolute left-6 top-7 opacity-10"><Monitor className="h-6 w-6" /></div>
                  </div>
                </div>

                {!isRemoteRequested ? (
                  <Button onClick={handleRequestRemote} disabled={!remoteId || remoteId.length < 5} className="w-full btn-institutional h-16 text-[12px] rounded-[2rem] shadow-2xl shadow-primary/20 group">
                    <MonitorOff className="h-6 w-6 mr-4 group-hover:scale-110 transition-transform" /> SOLICITAR SOPORTE
                  </Button>
                ) : (
                  <Button onClick={handleEditRemoteId} variant="outline" className="w-full h-16 text-[11px] font-black uppercase border-primary/20 text-primary rounded-[2rem] hover:bg-primary/5 shadow-xl group">
                    <RefreshCcw className="h-5 w-5 mr-4 group-hover:rotate-180 transition-transform duration-1000" /> ENVIAR OTRO ID
                  </Button>
                )}
              </div>

              <div className="space-y-8 px-4">
                <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                   <div className="h-10 w-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-sm">
                      <HelpCircle className="h-6 w-6" />
                   </div>
                   <h4 className="text-[12px] font-black uppercase text-slate-700 tracking-[0.2em]">PASOS A SEGUIR</h4>
                </div>
                
                <div className="space-y-8">
                  {[
                    { title: "Descargue AnyDesk en su equipo.", content: <Button variant="outline" size="sm" className="h-10 px-6 text-[10px] font-black border-primary/20 text-primary rounded-2xl mt-3 hover:bg-primary hover:text-white transition-all shadow-md group" onClick={() => window.open('https://anydesk.com/en/downloads/windows', '_blank')}><Download className="h-4 w-4 mr-3 group-hover:translate-y-0.5 transition-transform" /> DESCARGAR AHORA</Button> },
                    { title: "Copie su ID personal de 9 dígitos." },
                    { title: "Péguelo arriba y haga clic en Solicitar Soporte." },
                    { title: "Esperar unos minutos a que un técnico le atienda." }
                  ].map((step, i) => (
                    <div key={i} className="flex gap-6 items-start group">
                      <div className="flex flex-col items-center shrink-0">
                        <span className="h-10 w-10 rounded-2xl bg-white border-2 border-primary/10 flex items-center justify-center text-primary font-black text-sm shadow-sm group-hover:border-primary/40 transition-all group-hover:scale-110">
                          {i+1}
                        </span>
                        {i < 3 && <div className="w-0.5 h-10 bg-slate-100 my-2" />}
                      </div>
                      <div className="pt-2 flex-1">
                        <p className="text-[12px] font-bold text-slate-500 uppercase leading-snug tracking-tight">
                          {step.title}
                        </p>
                        {step.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!isPublic && selectedRequest && (
            <div className="p-6 bg-white rounded-[2.5rem] border-2 border-primary/10 space-y-5 shadow-2xl mt-auto animate-in slide-in-from-bottom duration-500">
               <div className="flex justify-between items-center"><p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Atendiendo como:</p><Badge className="bg-emerald-500 text-white border-none text-[8px] font-black shadow-lg shadow-emerald-200 px-3">CONECTADO</Badge></div>
               <div className="relative group">
                 <Input placeholder="TU NOMBRE OFICIAL..." className="h-12 text-[11px] font-black uppercase border-primary/10 bg-slate-50 shadow-inner rounded-2xl px-6 focus:bg-white transition-all" value={techName} onChange={(e) => handleTechNameChange(e.target.value)} />
                 <User className="absolute right-4 top-3.5 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
               </div>
               {selectedRequest.remoteId && (
                 <div className="flex items-center justify-between bg-slate-50 rounded-[1.5rem] p-5 border border-primary/5 shadow-inner">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1.5">ID Solicitado</span>
                       <span className="text-xl font-mono font-black text-primary tracking-tighter">{selectedRequest.remoteId}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => copyId(selectedRequest.remoteId)} className="h-12 w-12 text-primary hover:bg-primary/10 rounded-2xl transition-all shadow-sm bg-white">
                      {copied ? <Check className="h-6 w-6 text-emerald-500" /> : <Copy className="h-6 w-6 opacity-30" />}
                    </Button>
                 </div>
               )}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        {!isPublic && !selectedRequest ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/40">
            <div className="relative">
              <div className="h-40 w-40 rounded-[3rem] bg-white shadow-2xl flex items-center justify-center text-primary/10 border-8 border-white mb-10 group overflow-hidden animate-bounce [animation-duration:3s]">
                 <MessageSquare className="h-20 w-20 group-hover:scale-110 transition-transform duration-1000" />
              </div>
              <div className="absolute -top-4 -right-4 h-12 w-12 rounded-2xl bg-accent text-white flex items-center justify-center shadow-xl animate-pulse">
                <Sparkles className="h-6 w-6" />
              </div>
            </div>
            <div className="text-center space-y-5 max-w-sm">
               <h3 className="text-4xl font-black text-slate-800 uppercase tracking-tighter leading-[0.85]">Centro de <br /> Operaciones</h3>
               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Seleccione un folio de la lista lateral para iniciar la sincronización técnica oficial.</p>
            </div>
          </div>
        ) : (
          <>
            <header className={cn(
              "p-8 border-b flex flex-row justify-between items-center bg-white/90 backdrop-blur-2xl sticky top-0 z-20 shadow-[0_10px_40px_rgba(0,0,0,0.02)]",
              isPublic && "bg-white/80"
            )}>
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="h-16 w-16 rounded-[1.5rem] bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/30 group-hover:scale-105 transition-transform duration-500 overflow-hidden relative">
                    <Bot className="h-9 w-9 relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-4 border-white animate-pulse shadow-lg" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-primary uppercase leading-none tracking-tighter">Mesa de Ayuda ATRES</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                       <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Sincronizado</p>
                    </div>
                    {activeChatId && (
                       <Badge variant="outline" className="text-[10px] font-mono font-black border-accent/20 text-accent bg-accent/5 px-3 py-1 rounded-lg">
                         REF: {activeChatId}
                       </Badge>
                    )}
                  </div>
                </div>
              </div>

              {!isPublic && selectedRequest && (
                <Button 
                  onClick={() => setIsFinishDialogOpen(true)} 
                  className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] uppercase h-14 px-10 rounded-[1.5rem] shadow-2xl shadow-rose-200 flex items-center gap-4 active:scale-95 transition-all group"
                >
                  <CheckCircle2 className="h-5 w-5 group-hover:scale-110 transition-transform" /> FINALIZAR ATENCIÓN
                </Button>
              )}
            </header>

            <ScrollArea className="flex-1 bg-[#f1f3f5]">
              <div className="p-10 space-y-10 max-w-5xl mx-auto min-h-full flex flex-col justify-end">
                {messages.map((msg, i) => { 
                  const isMe = (isPublic && msg.role === 'user') || (!isPublic && msg.role === 'tech'); 
                  const isBot = msg.role === 'bot';
                  
                  return (
                    <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-4 duration-700", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "flex gap-5 max-w-[80%]", 
                        isMe ? "flex-row-reverse" : "flex-row"
                      )}>
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xl border-4 border-white transition-all hover:scale-110", 
                          msg.role === 'user' ? "bg-accent text-white" : 
                          msg.role === 'tech' ? "bg-primary text-white" : 
                          "bg-slate-800 text-white"
                        )}>
                          {msg.role === 'user' ? <User className="h-6 w-6" /> : 
                           msg.role === 'tech' ? <Headset className="h-6 w-6" /> : 
                           <Bot className="h-6 w-6" />}
                        </div>
                        
                        <div className="flex flex-col gap-2 min-w-0">
                          {msg.senderName && (
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-[0.2em] px-2",
                              isMe ? "text-right text-accent" : "text-left text-slate-500"
                            )}>
                              {msg.senderName} • BRIGADA TÉCNICA
                            </span>
                          )}
                          
                          <div className={cn(
                            "p-6 rounded-[2.5rem] text-[14px] font-medium shadow-xl border relative transition-all duration-500", 
                            isMe ? "bg-accent text-white rounded-tr-none border-transparent shadow-accent/10" : 
                            isBot ? "bg-slate-800 text-white rounded-tl-none border-transparent shadow-slate-900/10" :
                            "bg-white text-slate-700 rounded-tl-none border-slate-100 shadow-slate-200/50"
                          )}>
                            {msg.content && <p className="whitespace-pre-wrap leading-relaxed tracking-tight">{msg.content}</p>}
                            
                            {msg.fileData && (
                              <div className={cn(
                                "mt-5 p-5 rounded-[2rem] border-2 flex items-center gap-5 group cursor-pointer transition-all active:scale-95", 
                                isMe ? "bg-white/10 border-white/20 hover:bg-white/20" : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                              )} onClick={() => downloadFile(msg.fileData!, msg.fileName!)}>
                                <div className={cn(
                                  "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6", 
                                  isMe ? "bg-white/20" : "bg-white"
                                )}>
                                  {getFileIcon(msg.fileType || '')}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn("text-[11px] font-black uppercase truncate tracking-widest", isMe ? "text-white" : "text-slate-800")}>
                                    {msg.fileName}
                                  </p>
                                  <div className={cn(
                                    "flex items-center gap-2 mt-2 text-[10px] font-black uppercase opacity-60",
                                    isMe ? "text-white" : "text-primary"
                                  )}>
                                    <Download className="h-4 w-4" /> Bajar Documento
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div className={cn(
                              "text-[9px] mt-4 font-black uppercase tracking-widest opacity-40 flex items-center gap-2",
                              isMe ? "justify-end" : "justify-start"
                            )}>
                              <Clock className="h-3 w-3" />
                              {mounted ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) 
                })} 
                
                {isTyping && (
                  <div className="flex justify-start animate-in slide-in-from-left-4 duration-500">
                    <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] rounded-tl-none flex items-center gap-5 shadow-2xl">
                      <div className="flex gap-2">
                         <div className="h-2 w-2 rounded-full bg-primary/20 animate-bounce [animation-delay:-0.3s]" />
                         <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
                         <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                      </div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Analista procesando respuesta...</span>
                    </div>
                  </div>
                )} 
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <footer className="p-8 bg-white border-t border-slate-100 z-20">
              <div className="max-w-5xl mx-auto flex gap-6">
                <div className="relative flex-1 group">
                  <Input 
                    placeholder={isPublic ? "Describa su duda técnica detalladamente..." : "Escribir respuesta oficial de la brigada..."} 
                    className="h-20 rounded-[2.5rem] bg-slate-50 border-primary/5 px-10 pr-20 font-semibold shadow-inner focus:bg-white transition-all text-[15px] focus:ring-8 focus:ring-primary/5" 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="absolute right-6 top-5 h-10 w-10 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all flex items-center justify-center group/clip"
                    title="Adjuntar evidencia"
                  >
                    <Paperclip className="h-6 w-6 group-hover/clip:rotate-45 transition-transform" />
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                </div>
                <button 
                  onClick={() => handleSendMessage()} 
                  disabled={!input.trim() && !messages.length} 
                  className="h-20 w-20 rounded-[2.5rem] btn-institutional shrink-0 shadow-2xl shadow-primary/30 flex items-center justify-center active:scale-90 group transform transition-all duration-300"
                >
                  <Send className="h-9 w-9 group-hover:translate-x-1.5 group-hover:-translate-y-1.5 transition-transform" />
                </button>
              </div>
            </footer>
          </>
        )}
      </div>

      <Dialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-12 bg-primary text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10"><CheckCircle2 className="h-56 w-56" /></div>
            <DialogTitle className="uppercase font-black text-white text-4xl flex items-center gap-6 relative z-10 leading-none">
              <CheckCircle2 className="h-14 w-14 text-emerald-400" /> Registro <br /> de Atención
            </DialogTitle>
            <DialogDescription className="text-white/60 font-black text-[12px] uppercase tracking-[0.4em] mt-4 relative z-10">
               Consolidación del Servicio Técnico ATRES
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="p-12 space-y-10 bg-white">
              <div className="space-y-5">
                <Label className="text-[12px] font-black uppercase text-primary flex items-center gap-4 pl-1 tracking-[0.2em]">
                  <Search className="h-5 w-5 text-accent" /> Localizador Institucional de Plantel
                </Label>
                <div className="relative">
                  <Input 
                    placeholder="INGRESAR CCT O NOMBRE DEL PLANTEL..." 
                    className="h-16 rounded-[1.5rem] bg-slate-50 border-primary/10 text-base font-black uppercase px-8 shadow-inner focus:bg-white transition-all" 
                    value={finishSearchTerm} 
                    onChange={(e) => setFinishSearchTerm(e.target.value)} 
                  />
                  {finishSearchTerm.length > 2 && (
                    <div className="absolute left-0 right-0 top-18 max-h-72 overflow-auto bg-white border border-slate-200 rounded-[2rem] shadow-2xl z-50 divide-y animate-in fade-in duration-300">
                      {schoolsDirectory.filter(s => s.cct.includes(finishSearchTerm.toUpperCase()) || s.nombre.includes(finishSearchTerm.toUpperCase())).slice(0, 5).map(s => (
                        <div key={`${s.cct}-${s.turno}`} className="p-6 hover:bg-primary/5 cursor-pointer flex justify-between items-center transition-colors group" onClick={() => handleSchoolSelect(s)}>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-black uppercase text-slate-800 group-hover:text-primary transition-colors">{s.nombre}</span>
                            <span className="text-[11px] font-mono font-bold text-slate-400 tracking-widest">{s.cct} • {s.municipio} • {s.turno}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/20 text-primary px-4 py-1">SELECCIONAR</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {finishForm.cct && (
                  <div className="p-8 bg-emerald-50/50 rounded-[2.5rem] border-2 border-emerald-100 flex items-center gap-8 animate-in zoom-in-95 shadow-sm">
                    <div className="h-20 w-20 rounded-3xl bg-white flex items-center justify-center text-emerald-600 shadow-xl border border-emerald-100">
                      <School className="h-10 w-10" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase mb-2 tracking-[0.3em]">VINCULACIÓN EXITOSA</p>
                      <h4 className="text-lg font-black text-slate-800 uppercase leading-none tracking-tight">{finishForm.schoolName}</h4>
                      <p className="text-[12px] font-mono font-bold text-slate-500 mt-2 tracking-widest">{finishForm.cct} • {finishForm.valle} • {finishForm.municipio}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <Label className="text-[12px] font-black uppercase text-primary flex items-center gap-4 pl-1 tracking-[0.2em]">
                    <Building2 className="h-5 w-5 text-accent" /> Oficina Responsable
                  </Label>
                  <Select value={finishForm.oficinaRegionalAtencion} onValueChange={(val) => setFinishForm({...finishForm, oficinaRegionalAtencion: val})}>
                    <SelectTrigger className="h-16 bg-slate-50 rounded-[1.5rem] text-[13px] font-black uppercase border-primary/10 shadow-inner px-6 focus:bg-white transition-all">
                      <SelectValue placeholder="ELEGIR OFICINA..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200">
                      {REGIONAL_OFFICES.map(off => (
                        <SelectItem key={off} value={off} className="text-[11px] font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                   <Label className="text-[12px] font-black uppercase text-primary flex items-center gap-4 pl-1 tracking-[0.2em]">
                    <CheckCircle2 className="h-5 w-5 text-accent" /> Folio Concluido
                  </Label>
                  <div className="h-16 bg-slate-100 rounded-[1.5rem] border-2 border-slate-200 flex items-center px-8 font-mono font-black text-slate-500 shadow-inner text-lg tracking-widest">
                     {selectedRequest?.ticketNumber}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[12px] font-black uppercase text-primary pl-1 tracking-[0.2em]">Diagnóstico y Solución Técnica</Label>
                <Textarea 
                  placeholder="DETALLE EL SOPORTE BRINDADO, HALLAZGOS Y COMPONENTES REVISADOS..." 
                  className="h-40 rounded-[2rem] bg-slate-50 border-primary/10 p-8 text-[13px] font-bold shadow-inner focus:bg-white focus:ring-8 focus:ring-primary/5 transition-all" 
                  value={finishForm.servicio} 
                  onChange={(e) => setFinishForm({...finishForm, servicio: e.target.value.toUpperCase()})} 
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-12 bg-slate-50 border-t flex justify-end gap-6 shrink-0">
            <Button variant="ghost" onClick={() => setIsFinishDialogOpen(false)} className="h-16 px-12 text-[12px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-slate-200 transition-all">CANCELAR</Button>
            <Button onClick={handleFinishConfirm} className="btn-institutional h-16 px-20 text-[12px] gap-4 shadow-2xl">
              <Save className="h-6 w-6" /> GUARDAR Y CERRAR ATENCIÓN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
