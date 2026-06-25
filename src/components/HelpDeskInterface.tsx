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
      "flex h-[calc(100vh-160px)] md:h-[calc(100vh-200px)] w-full flex-col md:flex-row bg-white overflow-hidden transition-all duration-700", 
      isPublic && "rounded-[2.5rem] shadow-[0_48px_100px_rgba(0,0,0,0.15)] border border-white/40"
    )}>
      {(!isPublic || showRemotePanel) && (
        <div className={cn(
          "w-full md:w-[360px] border-r p-6 space-y-6 shrink-0 flex flex-col overflow-y-auto animate-in slide-in-from-left duration-700",
          isPublic ? "bg-slate-50/70 backdrop-blur-xl" : "bg-slate-50"
        )}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
               <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(159,34,65,0.6)]" />
               <span className="text-[10px] font-black uppercase text-primary tracking-widest">SOPORTE COEES</span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 uppercase leading-none tracking-tight">Apoyo <br /> Remoto</h3>
          </div>

          {!isPublic ? (
            <div className="flex-1 space-y-6 flex flex-col min-h-0">
               <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                     <Users className="h-4 w-4 text-accent" />
                     <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Solicitudes ({queue.length})</span>
                  </div>
                  <ScrollArea className="max-h-[220px]">
                    <div className="space-y-2 pr-2">
                      {queue.map((req) => (
                        <button key={req.ticketNumber} onClick={() => setSelectedRequest(req)} className={cn("w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group transform active:scale-95", selectedRequest?.ticketNumber === req.ticketNumber ? "bg-primary border-primary shadow-lg" : "bg-white hover:bg-slate-100 border-slate-100 shadow-sm")}>
                          <div className="flex flex-col gap-0.5">
                            <span className={cn("text-[8px] font-black uppercase flex items-center gap-1", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white/60" : "text-accent")}><Ticket className="h-2.5 w-2.5" /> {req.ticketNumber}</span>
                            <span className={cn("text-xs font-mono font-black", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white" : "text-primary")}>{req.requestType === 'chat' ? 'Consulta Chat' : (req.remoteId || 'Sin ID')}</span>
                          </div>
                          <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center", selectedRequest?.ticketNumber === req.ticketNumber ? "bg-white/10 text-white" : "bg-slate-50 text-slate-300")}>
                            <ChevronRight className="h-3 w-3" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
               </div>
               <div className="space-y-4 flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                     <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-accent" /><span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Formatos Oficiales</span></div>
                     <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10 rounded-lg" onClick={() => libraryInputRef.current?.click()}><Plus className="h-4 w-4" /></Button>
                     <input type="file" ref={libraryInputRef} className="hidden" onChange={handleLibraryUpload} />
                  </div>
                  <ScrollArea className="flex-1">
                     <div className="space-y-2 pr-2">
                        {techLibrary.map(file => (
                          <div key={file.id} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm space-y-2 group hover:border-primary/30 transition-all">
                             <div className="flex items-center gap-3">{getFileIcon(file.type)}<div className="flex-1 min-w-0"><p className="text-[10px] font-black text-slate-700 truncate uppercase leading-none">{file.name}</p></div></div>
                             <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="outline" className="flex-1 h-7 text-[8px] font-black uppercase text-primary border-primary/20 rounded-lg" onClick={() => sendLibraryFile(file)} disabled={!selectedRequest}>Enviar</Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-accent p-0" onClick={() => replaceLibraryFile(file.id)}><RefreshCcw className="h-3 w-3" /></Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-rose-600 p-0" onClick={() => removeLibraryFile(file.id)}><Trash2 className="h-3 w-3" /></Button>
                             </div>
                          </div>
                        ))}
                     </div>
                  </ScrollArea>
               </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-top-4 duration-1000">
              <div className={cn(
                "p-6 bg-white rounded-[2rem] border-2 shadow-xl space-y-6 transition-all duration-700 relative overflow-hidden",
                highlightRemote ? "border-primary ring-[10px] ring-primary/5 scale-[1.02] animate-pulse" : "border-slate-100"
              )}>
                <div className="absolute -top-4 -right-4 p-4 opacity-5 pointer-events-none">
                   <Monitor className="h-24 w-24" />
                </div>

                <div className="space-y-1 relative z-10">
                   <div className="flex items-center gap-2 mb-1">
                      <div className={cn("h-2.5 w-2.5 rounded-full", isRemoteRequested ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] animate-pulse" : "bg-slate-300")} />
                      <span className="text-[10px] font-black uppercase text-slate-700 tracking-widest">Servidor Activo</span>
                   </div>
                   <h4 className="text-[11px] font-black uppercase text-primary leading-tight">Solicitud de Conexión</h4>
                </div>

                {activeTicketNumber && (
                   <div className="bg-primary/5 p-3 rounded-2xl border border-primary/10 text-center shadow-inner group">
                      <p className="text-[8px] font-black text-primary/50 uppercase tracking-widest mb-1">Folio de Atención</p>
                      <p className="text-xl font-black text-primary tracking-tight">{activeTicketNumber}</p>
                   </div>
                )}

                <div className="space-y-3 relative z-10">
                  <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-2">ID ANYDESK / TEAMVIEWER</Label>
                  <div className="relative">
                    <Input 
                      placeholder="000 000 000" 
                      className="h-14 text-center font-mono font-black border-slate-100 text-2xl bg-slate-50/50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all shadow-inner tracking-widest" 
                      value={remoteId} 
                      onChange={(e) => setRemoteId(e.target.value)} 
                      disabled={isRemoteRequested} 
                    />
                  </div>
                </div>

                {!isRemoteRequested ? (
                  <Button onClick={handleRequestRemote} disabled={!remoteId || remoteId.length < 5} className="w-full btn-institutional h-12 text-[10px] rounded-2xl shadow-lg shadow-primary/20 group">
                    <MonitorOff className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" /> SOLICITAR SOPORTE
                  </Button>
                ) : (
                  <Button onClick={handleEditRemoteId} variant="outline" className="w-full h-12 text-[10px] font-black uppercase border-primary/20 text-primary rounded-2xl hover:bg-primary/5 shadow-md">
                    <RefreshCcw className="h-4 w-4 mr-3" /> CAMBIAR ID
                  </Button>
                )}
              </div>

              <div className="space-y-4 px-2">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                   <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent shadow-sm">
                      <HelpCircle className="h-5 w-5" />
                   </div>
                   <h4 className="text-[10px] font-black uppercase text-slate-600 tracking-widest">PASOS DE ATENCIÓN</h4>
                </div>
                
                <div className="space-y-4">
                  {[
                    { title: "Instalar software AnyDesk.", content: <Button variant="outline" size="sm" className="h-8 px-4 text-[8px] font-black border-primary/20 text-primary rounded-xl mt-1.5 hover:bg-primary hover:text-white transition-all shadow-sm" onClick={() => window.open('https://anydesk.com/en/downloads/windows', '_blank')}><Download className="h-3.5 w-3.5 mr-2" /> DESCARGAR</Button> },
                    { title: "Localizar ID de 9 dígitos." },
                    { title: "Capturarlo en el campo superior." },
                    { title: "Hacer clic en Solicitar Soporte." }
                  ].map((step, i) => (
                    <div key={i} className="flex gap-4 items-start group">
                      <div className="flex flex-col items-center shrink-0">
                        <span className="h-7 w-7 rounded-xl bg-white border-2 border-primary/10 flex items-center justify-center text-primary font-black text-xs shadow-sm group-hover:scale-110 transition-all">
                          {i+1}
                        </span>
                        {i < 3 && <div className="w-px h-6 bg-slate-200 my-1" />}
                      </div>
                      <div className="pt-1.5 flex-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase leading-snug">
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
            <div className="p-5 bg-white rounded-[2rem] border-2 border-primary/10 space-y-4 shadow-xl mt-auto animate-in slide-in-from-bottom duration-500">
               <div className="flex justify-between items-center"><p className="text-[10px] font-black uppercase text-slate-400">Canal de Atención:</p><Badge className="bg-emerald-500 text-white border-none text-[7px] font-black px-2 py-0.5">ACTIVO</Badge></div>
               <div className="relative">
                 <Input placeholder="NOMBRE DEL TÉCNICO..." className="h-10 text-[10px] font-black uppercase border-primary/5 bg-slate-50 rounded-xl px-4 focus:bg-white shadow-inner" value={techName} onChange={(e) => handleTechNameChange(e.target.value)} />
               </div>
               {selectedRequest.remoteId && (
                 <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-primary/5">
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">ID AnyDesk</span>
                       <span className="text-base font-mono font-black text-primary">{selectedRequest.remoteId}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => copyId(selectedRequest.remoteId)} className="h-10 w-10 text-primary hover:bg-primary/5 rounded-xl bg-white">
                      {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5 opacity-30" />}
                    </Button>
                 </div>
               )}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        {!isPublic && !selectedRequest ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/20">
            <div className="relative mb-8">
              <div className="h-32 w-32 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center text-primary/10 border-4 border-white animate-bounce [animation-duration:4s]">
                 <MessageSquare className="h-16 w-16" />
              </div>
              <div className="absolute -top-2 -right-2 h-10 w-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-xl">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <div className="text-center space-y-3 max-w-xs">
               <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Mesa de <br /> Control</h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Seleccione un folio de la lista lateral para iniciar la sincronización técnica.</p>
            </div>
          </div>
        ) : (
          <>
            <header className={cn(
              "p-6 border-b flex flex-row justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20 shadow-sm",
              isPublic && "bg-white/60"
            )}>
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/20 overflow-hidden relative">
                    <Bot className="h-7 w-7 relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-lg font-black text-slate-800 uppercase leading-none tracking-tight">Asistente COEES</h2>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                       <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">En Línea</p>
                    </div>
                    {activeChatId && (
                       <Badge variant="outline" className="text-[9px] font-mono font-black border-slate-100 text-slate-400 bg-slate-50 px-2 py-0 h-4">
                         REF: {activeChatId}
                       </Badge>
                    )}
                  </div>
                </div>
              </div>

              {!isPublic && selectedRequest && (
                <Button 
                  onClick={() => setIsFinishDialogOpen(true)} 
                  className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] uppercase h-10 px-6 rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" /> FINALIZAR SESIÓN
                </Button>
              )}
            </header>

            <ScrollArea className="flex-1 bg-[#f8fafc]">
              <div className="p-6 md:p-10 space-y-8 max-w-4xl mx-auto min-h-full flex flex-col justify-end">
                {messages.map((msg, i) => { 
                  const isMe = (isPublic && msg.role === 'user') || (!isPublic && msg.role === 'tech'); 
                  const isBot = msg.role === 'bot';
                  
                  return (
                    <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-500", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "flex gap-4 max-w-[85%]", 
                        isMe ? "flex-row-reverse" : "flex-row"
                      )}>
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg border-2 border-white", 
                          msg.role === 'user' ? "bg-accent text-white" : 
                          msg.role === 'tech' ? "bg-primary text-white" : 
                          "bg-slate-800 text-white"
                        )}>
                          {msg.role === 'user' ? <User className="h-5 w-5" /> : 
                           msg.role === 'tech' ? <Headset className="h-5 w-5" /> : 
                           <Bot className="h-5 w-5" />}
                        </div>
                        
                        <div className="flex flex-col gap-1.5 min-w-0">
                          {msg.senderName && (
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-[0.15em] px-1.5",
                              isMe ? "text-right text-accent" : "text-left text-slate-400"
                            )}>
                              {msg.senderName} • BRIGADA TÉCNICA
                            </span>
                          )}
                          
                          <div className={cn(
                            "p-5 rounded-[2rem] text-[13px] font-semibold shadow-md border relative transition-all duration-300 leading-relaxed", 
                            isMe ? "bg-accent text-white rounded-tr-none border-transparent" : 
                            isBot ? "bg-slate-800 text-white rounded-tl-none border-transparent" :
                            "bg-white text-slate-700 rounded-tl-none border-slate-50"
                          )}>
                            {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                            
                            {msg.fileData && (
                              <div className={cn(
                                "mt-4 p-4 rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition-all active:scale-95 group", 
                                isMe ? "bg-white/10 border-white/20 hover:bg-white/20" : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                              )} onClick={() => downloadFile(msg.fileData!, msg.fileName!)}>
                                <div className={cn(
                                  "h-10 w-10 rounded-xl flex items-center justify-center shadow-md bg-white transition-transform group-hover:scale-110"
                                )}>
                                  {getFileIcon(msg.fileType || '')}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn("text-[10px] font-black uppercase truncate tracking-widest", isMe ? "text-white" : "text-slate-800")}>
                                    {msg.fileName}
                                  </p>
                                  <div className={cn(
                                    "flex items-center gap-2 mt-1 text-[9px] font-black uppercase opacity-60",
                                    isMe ? "text-white" : "text-primary"
                                  )}>
                                    <Download className="h-3.5 w-3.5" /> Descargar
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div className={cn(
                              "text-[8px] mt-3 font-black uppercase tracking-widest opacity-30 flex items-center gap-1.5",
                              isMe ? "justify-end" : "justify-start"
                            )}>
                              <Clock className="h-2.5 w-2.5" />
                              {mounted ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) 
                })} 
                
                {isTyping && (
                  <div className="flex justify-start animate-in slide-in-from-left-2 duration-500">
                    <div className="bg-white border border-slate-50 p-4 rounded-[1.5rem] rounded-tl-none flex items-center gap-4 shadow-lg">
                      <div className="flex gap-1.5">
                         <div className="h-1.5 w-1.5 rounded-full bg-primary/20 animate-bounce [animation-delay:-0.3s]" />
                         <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
                         <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                      </div>
                      <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Tecleando respuesta...</span>
                    </div>
                  </div>
                )} 
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <footer className="p-6 bg-white border-t border-slate-100 z-20">
              <div className="max-w-4xl mx-auto flex gap-4">
                <div className="relative flex-1">
                  <Input 
                    placeholder={isPublic ? "Escriba su duda detalladamente..." : "Escriba la respuesta oficial..."} 
                    className="h-14 rounded-2xl bg-slate-50 border-primary/5 px-6 pr-14 font-semibold shadow-inner focus:bg-white transition-all text-sm focus:ring-4 focus:ring-primary/5" 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="absolute right-4 top-3.5 h-7 w-7 text-slate-300 hover:text-primary transition-all flex items-center justify-center"
                    title="Adjuntar archivo"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                </div>
                <button 
                  onClick={() => handleSendMessage()} 
                  disabled={!input.trim() && !messages.length} 
                  className="h-14 w-14 rounded-2xl btn-institutional shrink-0 shadow-lg shadow-primary/20 flex items-center justify-center active:scale-90 transform transition-all duration-300"
                >
                  <Send className="h-7 w-7" />
                </button>
              </div>
            </footer>
          </>
        )}
      </div>

      <Dialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-10 bg-primary text-white shrink-0 relative">
            <div className="absolute top-0 right-0 p-8 opacity-10"><CheckCircle2 className="h-40 w-40" /></div>
            <DialogTitle className="uppercase font-black text-white text-3xl flex items-center gap-4 relative z-10">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" /> Registro Final
            </DialogTitle>
            <DialogDescription className="text-white/60 font-black text-[10px] uppercase tracking-widest mt-2 relative z-10">
               Consolidación del Servicio ATRES
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[50vh]">
            <div className="p-10 space-y-8 bg-white">
              <div className="space-y-4">
                <Label className="text-[11px] font-black uppercase text-primary flex items-center gap-3 pl-1 tracking-widest">
                  <Search className="h-4 w-4 text-accent" /> Buscar Plantel por CCT
                </Label>
                <div className="relative">
                  <Input 
                    placeholder="INGRESAR CCT O NOMBRE..." 
                    className="h-14 rounded-xl bg-slate-50 border-primary/10 text-sm font-black uppercase px-6 shadow-inner focus:bg-white transition-all" 
                    value={finishSearchTerm} 
                    onChange={(e) => setFinishSearchTerm(e.target.value)} 
                  />
                  {finishSearchTerm.length > 2 && (
                    <div className="absolute left-0 right-0 top-16 max-h-56 overflow-auto bg-white border border-slate-200 rounded-xl shadow-2xl z-50 divide-y animate-in fade-in duration-300">
                      {schoolsDirectory.filter(s => s.cct.includes(finishSearchTerm.toUpperCase()) || s.nombre.includes(finishSearchTerm.toUpperCase())).slice(0, 5).map(s => (
                        <div key={`${s.cct}-${s.turno}`} className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center transition-colors group" onClick={() => handleSchoolSelect(s)}>
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase text-slate-800">{s.nombre}</span>
                            <span className="text-[9px] font-mono text-slate-400">{s.cct} • {s.municipio}</span>
                          </div>
                          <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20 text-primary">ELEGIR</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {finishForm.cct && (
                  <div className="p-6 bg-emerald-50 rounded-2xl border-2 border-emerald-100 flex items-center gap-6 animate-in zoom-in-95">
                    <div className="h-14 w-14 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-md">
                      <School className="h-8 w-8" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase leading-none">{finishForm.schoolName}</h4>
                      <p className="text-[10px] font-mono font-bold text-slate-500 mt-1">{finishForm.cct} • {finishForm.municipio}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-primary flex items-center gap-3 pl-1 tracking-widest">
                    <Building2 className="h-4 w-4 text-accent" /> Oficina Atendió
                  </Label>
                  <Select value={finishForm.oficinaRegionalAtencion} onValueChange={(val) => setFinishForm({...finishForm, oficinaRegionalAtencion: val})}>
                    <SelectTrigger className="h-14 bg-slate-50 rounded-xl text-xs font-black uppercase border-primary/10 shadow-inner px-4">
                      <SelectValue placeholder="ELEGIR OFICINA..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      {REGIONAL_OFFICES.map(off => (
                        <SelectItem key={off} value={off} className="text-[10px] font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                   <Label className="text-[11px] font-black uppercase text-primary flex items-center gap-3 pl-1 tracking-widest">
                    <Ticket className="h-4 w-4 text-accent" /> Folio Concluido
                  </Label>
                  <div className="h-14 bg-slate-100 rounded-xl border-2 border-slate-200 flex items-center px-6 font-mono font-black text-slate-500 shadow-inner text-base">
                     {selectedRequest?.ticketNumber}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase text-primary pl-1 tracking-widest">Resumen del Soporte Brindado</Label>
                <Textarea 
                  placeholder="DETALLE TÉCNICO DE LA SOLUCIÓN..." 
                  className="h-32 rounded-xl bg-slate-50 border-primary/10 p-6 text-xs font-bold shadow-inner focus:bg-white transition-all" 
                  value={finishForm.servicio} 
                  onChange={(e) => setFinishForm({...finishForm, servicio: e.target.value.toUpperCase()})} 
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4 shrink-0">
            <Button variant="ghost" onClick={() => setIsFinishDialogOpen(false)} className="h-12 px-8 text-[10px] font-black uppercase tracking-widest">CANCELAR</Button>
            <Button onClick={handleFinishConfirm} className="btn-institutional h-12 px-12 text-[10px] gap-3">
              <Save className="h-5 w-5" /> CONCLUIR ATENCIÓN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
