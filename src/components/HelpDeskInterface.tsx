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
  BookOpen
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

  // Nueva función para permitir re-ingresar el ID sin ocultar la columna
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
          setIsRemoteRequested(true);
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
    const isRemoteIssue = lowerInput.includes('office') || lowerInput.includes('windows') || lowerInput.includes('impresora');

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
            content: 'He detectado que tu problema requiere soporte remoto (Office/Windows/Impresora). He habilitado la columna izquierda ("Solicitud Cuenta institucional/Windows") para que ingreses tu ID de AnyDesk y podamos conectarnos.',
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
            content: `He recibido tu duda y generado el folio ${currentFolio}. Un técnico se pondrá en contacto contigo en breve a través de este chat.`,
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
      content: `He recibido tu solicitud de soporte remoto.\n\n# DE ATENCIÓN: ${currentFolio}\nID CONEXIÓN: ${remoteId}\n\nPor favor, mantén AnyDesk abierto.`, 
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
    <div className={cn("flex h-full flex-col md:flex-row bg-white overflow-hidden", isPublic && "rounded-[2.5rem] shadow-2xl border border-primary/10")}>
      {(!isPublic || showRemotePanel) && (
        <div className="w-full md:w-[340px] bg-slate-50 border-r p-6 space-y-6 shrink-0 flex flex-col overflow-y-auto animate-in slide-in-from-left duration-500">
          <div className="space-y-1">
            <Badge className="bg-primary text-white text-[9px] font-black uppercase px-2.5 py-1">CENTRO DE APOYO</Badge>
            <h3 className="text-xl font-black text-primary uppercase leading-tight">Mesa de Ayuda</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SOPORTE TÉCNICO COEES</p>
          </div>

          {!isPublic ? (
            <div className="flex-1 space-y-6 flex flex-col min-h-0">
               <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                     <Users className="h-4 w-4 text-accent" />
                     <span className="text-[10px] font-black uppercase text-slate-700">Cola de Espera ({queue.length})</span>
                  </div>
                  <div className="space-y-2">
                     {queue.map((req) => (
                       <button key={req.ticketNumber} onClick={() => setSelectedRequest(req)} className={cn("w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group", selectedRequest?.ticketNumber === req.ticketNumber ? "bg-primary border-primary shadow-lg" : "bg-white hover:bg-slate-100 border-slate-100")}>
                         <div className="flex flex-col">
                           <span className={cn("text-[9px] font-black uppercase flex items-center gap-1 mb-1", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white/70" : "text-accent")}><Ticket className="h-2.5 w-2.5" /> {req.ticketNumber}</span>
                           <span className={cn("text-sm font-mono font-black", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white" : "text-primary")}>{req.requestType === 'chat' ? 'Consulta Chat' : (req.remoteId || 'Sin ID')}</span>
                         </div>
                         <ChevronRight className={cn("h-4 w-4", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white" : "text-slate-300")} />
                       </button>
                     ))}
                  </div>
               </div>
               <div className="space-y-4 flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                     <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-accent" /><span className="text-[10px] font-black uppercase text-slate-700">Biblioteca de Archivos</span></div>
                     <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/10 rounded-full" onClick={() => libraryInputRef.current?.click()}><Plus className="h-4 w-4" /></Button>
                     <input type="file" ref={libraryInputRef} className="hidden" onChange={handleLibraryUpload} />
                  </div>
                  <ScrollArea className="flex-1">
                     <div className="space-y-2 pr-4">
                        {techLibrary.map(file => (
                          <div key={file.id} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm space-y-2">
                             <div className="flex items-center gap-3">{getFileIcon(file.type)}<div className="flex-1 min-w-0"><p className="text-[10px] font-black text-slate-700 truncate uppercase leading-none">{file.name}</p></div></div>
                             <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="flex-1 h-7 text-[8px] font-black uppercase text-primary border-primary/10" onClick={() => sendLibraryFile(file)} disabled={!selectedRequest}>Enviar</Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 text-slate-400" onClick={() => replaceLibraryFile(file.id)}><RefreshCcw className="h-3 w-3" /></Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 text-slate-400" onClick={() => removeLibraryFile(file.id)}><Trash2 className="h-3 w-3" /></Button>
                             </div>
                          </div>
                        ))}
                     </div>
                  </ScrollArea>
               </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className={cn(
                "p-5 bg-white rounded-[2rem] border-2 shadow-xl space-y-5 transition-all duration-500",
                highlightRemote ? "border-primary ring-4 ring-primary/10 animate-pulse" : "border-primary/5"
              )}>
                <div className="flex items-center gap-2"><div className={cn("h-2.5 w-2.5 rounded-full", isRemoteRequested ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} /><span className="text-[10px] font-black uppercase text-slate-700">Solicitud Cuenta institucional/Windows</span></div>
                {activeTicketNumber && <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center"><p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Folio de Atención</p><p className="text-lg font-black text-emerald-700">{activeTicketNumber}</p></div>}
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-slate-400">ID ANYDESK / TEAMVIEWER</Label>
                  <Input 
                    placeholder="000 000 000" 
                    className="h-12 text-center font-mono font-black border-primary/20 text-xl bg-slate-50 rounded-2xl focus:bg-white transition-colors" 
                    value={remoteId} 
                    onChange={(e) => setRemoteId(e.target.value)} 
                    disabled={isRemoteRequested} 
                  />
                </div>
                {!isRemoteRequested ? (
                  <Button onClick={handleRequestRemote} disabled={!remoteId || remoteId.length < 5} className="w-full btn-institutional h-12 text-[10px] rounded-2xl">
                    <MonitorOff className="h-5 w-5 mr-2" /> SOLICITAR SOPORTE
                  </Button>
                ) : (
                  <Button onClick={handleEditRemoteId} variant="outline" className="w-full h-12 text-[9px] font-black uppercase border-primary/20 text-primary rounded-2xl group">
                    <RefreshCcw className="h-5 w-5 mr-2 group-hover:rotate-180 transition-transform duration-500" /> ENVIAR OTRO ID
                  </Button>
                )}
              </div>
              <div className="space-y-4 pt-2"><h4 className="text-[10px] font-black uppercase text-accent border-b pb-2">PASOS A SEGUIR</h4><ul className="space-y-4">{["Descargue AnyDesk en su equipo.","Copie su ID personal de 9 dígitos.","Péguelo arriba y haga clic en Solicitar Soporte.","Esperar unos minutos a que un técnico le atienda."].map((step, i) => (<li key={i} className="flex gap-3 text-[11px] font-bold text-slate-600 items-start"><span className="h-6 w-6 rounded-full bg-white border-2 border-primary/10 flex items-center justify-center text-primary shrink-0 font-black text-[10px]">{i+1}</span><div className="flex flex-col gap-2"><span className="leading-tight pt-1 uppercase">{step}</span>{i === 0 && <Button variant="outline" size="sm" className="h-7 px-3 text-[8px] font-black border-primary/20 text-primary" onClick={() => window.open('https://anydesk.com/en/downloads/windows', '_blank')}><Download className="h-3 w-3 mr-1.5" /> DESCARGAR AHORA</Button>}</div></li>))}</ul></div>
            </div>
          )}

          {!isPublic && selectedRequest && (
            <div className="p-5 bg-white rounded-[2rem] border-2 border-primary/10 space-y-4 shadow-2xl mt-auto">
               <div className="flex justify-between items-center"><p className="text-[10px] font-black uppercase text-slate-400">Analista Responsable:</p><Badge className="bg-emerald-500 text-white border-none text-[8px] font-black">SESIÓN ACTIVA</Badge></div>
               <Input placeholder="TU NOMBRE..." className="h-10 text-[10px] font-black uppercase border-primary/10 bg-slate-50" value={techName} onChange={(e) => handleTechNameChange(e.target.value)} />
               {selectedRequest.remoteId && <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border"><span className="text-base font-mono font-black text-primary truncate mr-2">{selectedRequest.remoteId}</span><Button variant="ghost" size="icon" onClick={() => copyId(selectedRequest.remoteId)} className="h-10 w-10">{copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5 text-slate-400" />}</Button></div>}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {!isPublic && !selectedRequest ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 bg-slate-50/50"><div className="h-28 w-28 rounded-full bg-white shadow-2xl flex items-center justify-center text-primary/10 border-8 border-white mb-6"><MessageSquare className="h-14 w-12" /></div><div className="text-center space-y-3"><h3 className="text-2xl font-black text-slate-800 uppercase">Centro de Operaciones</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-[350px]">Seleccione un usuario de la lista lateral para iniciar el protocolo de asistencia técnica.</p></div></div>
        ) : (
          <>
            <header className="p-5 border-b flex flex-row justify-between items-center bg-white/90 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4"><div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><Bot className="h-7 w-7" /></div><div><h2 className="text-lg font-black text-primary uppercase leading-none">Mesa de Ayuda ATRES</h2><div className="flex items-center gap-2 mt-1"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /><p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Atención en Tiempo Real</p>{activeChatId && <span className="text-[10px] font-black text-accent ml-2"># {activeChatId}</span>}</div></div></div>
              {!isPublic && selectedRequest && <Button onClick={() => setIsFinishDialogOpen(true)} className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] uppercase h-9 px-6 rounded-xl shadow-lg flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" /> FINALIZAR ATENCIÓN</Button>}
            </header>

            <ScrollArea className="flex-1 bg-slate-50/20">
              <div className="p-8 space-y-6 max-w-4xl mx-auto">
                {messages.map((msg, i) => { 
                  const isMe = (isPublic && msg.role === 'user') || (!isPublic && msg.role === 'tech'); 
                  return (
                    <div key={i} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn("flex gap-3 max-w-[80%]", isMe ? "flex-row-reverse" : "flex-row")}>
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg border-2 border-white", msg.role === 'user' ? "bg-accent text-white" : msg.role === 'tech' ? "bg-primary text-white" : "bg-slate-400 text-white")}>
                          {msg.role === 'user' ? <User className="h-5 w-5" /> : msg.role === 'tech' ? <Headset className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                        </div>
                        <div className={cn("p-5 rounded-[2rem] text-[13px] font-semibold shadow-md border", isMe ? "bg-[#B38E5D] text-white rounded-tr-none" : "bg-white text-slate-700 rounded-tl-none")}>
                          {msg.senderName && <p className="text-[9px] font-black uppercase opacity-70 mb-1">Analista: {msg.senderName}</p>}
                          {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                          {msg.fileData && (
                            <div className={cn("mt-3 p-4 rounded-2xl border flex items-center gap-4", isMe ? "bg-black/10 border-white/20" : "bg-slate-50 border-slate-200")}>
                              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", isMe ? "bg-white/20" : "bg-white")}>{getFileIcon(msg.fileType || '')}</div>
                              <div className="flex-1 min-w-0">
                                <p className={cn("text-[10px] font-black uppercase truncate", isMe ? "text-white" : "text-slate-700")}>{msg.fileName}</p>
                                <button onClick={() => downloadFile(msg.fileData!, msg.fileName!)} className={cn("text-[9px] font-black uppercase flex items-center gap-1 mt-1", isMe ? "text-white/80" : "text-primary")}><Download className="h-3 w-3" /> Descargar</button>
                              </div>
                            </div>
                          )}
                          <p className={cn("text-[9px] mt-2 font-black uppercase", isMe ? "text-white/60" : "text-slate-300")}>{mounted ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                        </div>
                      </div>
                    </div>
                  ) 
                })} 
                {isTyping && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-white border p-4 rounded-[1.5rem] rounded-tl-none flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-[10px] font-black uppercase text-slate-400">Procesando...</span>
                    </div>
                  </div>
                )} 
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <footer className="p-6 bg-white border-t border-slate-100"><div className="max-w-4xl mx-auto flex gap-4"><div className="relative flex-1"><Input placeholder={isPublic ? "Describa su duda técnica aquí..." : "Escribir respuesta oficial..."} className="h-14 rounded-2xl bg-slate-50 border-primary/5 px-8 pr-16 font-bold" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} /><button onClick={() => fileInputRef.current?.click()} className="absolute right-4 top-3 h-8 w-8 text-slate-400 hover:text-primary transition-colors flex items-center justify-center"><Paperclip className="h-5 w-5" /></button><input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} /></div><button onClick={() => handleSendMessage()} disabled={!input.trim() && !messages.length} className="h-14 w-14 rounded-2xl btn-institutional shrink-0 shadow-2xl flex items-center justify-center"><Send className="h-6 w-6" /></button></div></footer>
          </>
        )}
      </div>

      <Dialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <DialogContent className="sm:max-w-[650px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-primary text-white shrink-0"><DialogTitle className="uppercase font-black text-white text-xl flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-emerald-400" /> Resumen de Atención ATRES</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[60vh]"><div className="p-8 space-y-6 bg-white"><div className="space-y-4"><Label className="text-[10px] font-black uppercase text-primary flex items-center gap-2 pl-1"><Search className="h-4 w-4 text-accent" /> Localizador de Plantel (CCT)</Label><div className="relative"><Input placeholder="TECLEAR CCT O NOMBRE..." className="h-12 rounded-xl bg-slate-50 border-primary/10 text-xs font-black uppercase" value={finishSearchTerm} onChange={(e) => setFinishSearchTerm(e.target.value)} />{finishSearchTerm.length > 2 && (<div className="absolute left-0 right-0 top-14 max-h-48 overflow-auto bg-white border border-slate-200 rounded-xl shadow-2xl z-50 divide-y">{schoolsDirectory.filter(s => s.cct.includes(finishSearchTerm.toUpperCase()) || s.nombre.includes(finishSearchTerm.toUpperCase())).slice(0, 5).map(s => (<div key={`${s.cct}-${s.turno}`} className="p-3 hover:bg-primary/5 cursor-pointer flex justify-between items-center transition-colors" onClick={() => handleSchoolSelect(s)}><div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-800">{s.nombre}</span><span className="text-[8px] font-mono text-muted-foreground">{s.cct} • {s.municipio}</span></div><Badge variant="outline" className="text-[7px] font-black uppercase border-primary/20 text-primary">Elegir</Badge></div>))}</div>)}</div>{finishForm.cct && (<div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-100 flex items-center gap-4"><div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm"><School className="h-6 w-6" /></div><div><p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Plantel Vinculado</p><h4 className="text-xs font-black text-slate-800 uppercase">{finishForm.schoolName}</h4><p className="text-[9px] font-mono font-bold text-slate-400">{finishForm.cct}</p></div></div>)}</div><div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary flex items-center gap-2 pl-1"><Building2 className="h-4 w-4 text-accent" /> Oficina que Atendió</Label><Select value={finishForm.oficinaRegionalAtencion} onValueChange={(val) => setFinishForm({...finishForm, oficinaRegionalAtencion: val})}><SelectTrigger className="h-12 bg-slate-50 rounded-xl text-xs font-black uppercase"><SelectValue placeholder="SELECCIONAR OFICINA..." /></SelectTrigger><SelectContent>{REGIONAL_OFFICES.map(off => (<SelectItem key={off} value={off} className="text-[10px] font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>))}</SelectContent></Select></div><div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary pl-1">Servicio Realizado</Label><Textarea placeholder="DETALLE TÉCNICO DE LA SOLUCIÓN..." className="h-24 rounded-2xl bg-slate-50 border-primary/10 p-4 text-xs font-bold" value={finishForm.servicio} onChange={(e) => setFinishForm({...finishForm, servicio: e.target.value.toUpperCase()})} /></div></div></ScrollArea>
          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-3"><Button variant="ghost" onClick={() => setIsFinishDialogOpen(false)} className="h-12 px-6 text-[10px] font-black">Cancelar</Button><Button onClick={handleFinishConfirm} className="btn-institutional h-12 px-10 text-[10px] gap-2"><Save className="h-4 w-4" /> Finalizar y Registrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
