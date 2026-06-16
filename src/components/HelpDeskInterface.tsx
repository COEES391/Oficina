'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
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
  MonitorDot, 
  Loader2, 
  Headset,
  Copy,
  Check,
  Users,
  ChevronRight,
  MessageSquare,
  X,
  RefreshCcw,
  UserCog,
  Ticket,
  Search,
  CheckCircle2,
  Save,
  School,
  Building2,
  Download
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
}

type SupportRequest = {
  remoteId: string;
  ticketNumber: string;
  timestamp: number;
  status: 'pending' | 'attending';
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
  const [queue, setQueue] = useState<SupportRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null)
  const [techName, setTechName] = useState('')
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sessionKey, setSessionKey] = useState<string>('')
  
  // Finish Support State
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

  useEffect(() => {
    if (isPublic) {
      let sKey = sessionStorage.getItem('atres_session_id')
      if (!sKey) {
        sKey = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        sessionStorage.setItem('atres_session_id', sKey)
      }
      setSessionKey(sKey)
      
      const savedTicket = sessionStorage.getItem('atres_active_ticket')
      if (savedTicket) {
        setActiveTicketNumber(savedTicket)
        setIsRemoteRequested(true)
      }
    } else {
      const savedTechName = localStorage.getItem('atres_tech_name')
      if (savedTechName) setTechName(savedTechName)
    }
  }, [isPublic])

  const syncQueue = useCallback(() => {
    const rawQueue = localStorage.getItem('atres_support_queue')
    const currentQueue: SupportRequest[] = rawQueue ? JSON.parse(rawQueue) : []
    setQueue(currentQueue)

    if (isPublic && remoteId) {
      const myReq = currentQueue.find(r => r.remoteId === remoteId);
      setIsRemoteRequested(!!myReq);
      if (myReq) {
        setActiveTicketNumber(myReq.ticketNumber);
        sessionStorage.setItem('atres_active_ticket', myReq.ticketNumber);
      }
    }
  }, [isPublic, remoteId])

  const syncChat = useCallback(() => {
    const activeId = isPublic ? (remoteId || sessionKey) : selectedRequest?.remoteId
    
    if (!activeId) {
      setMessages([])
      return
    }

    const historyKey = `atres_chat_${activeId}`
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
  }, [isPublic, remoteId, sessionKey, selectedRequest])

  useEffect(() => {
    setMounted(true)
    syncQueue()
    syncChat()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'atres_support_queue') syncQueue()
      if (e.key?.startsWith('atres_chat_')) syncChat()
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [syncQueue, syncChat])

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

  const saveAndSyncChat = (newMessages: Message[]) => {
    const activeId = isPublic ? (remoteId || sessionKey) : selectedRequest?.remoteId
    if (!activeId) return

    const historyKey = `atres_chat_${activeId}`
    setMessages(newMessages)
    localStorage.setItem(historyKey, JSON.stringify(newMessages))
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: historyKey,
      newValue: JSON.stringify(newMessages)
    }))
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const myRole = isPublic ? 'user' : 'tech'
    const newMessage: Message = { 
      role: myRole, 
      content: input, 
      timestamp: Date.now(),
      senderName: !isPublic ? techName : undefined
    }

    const updatedMessages = [...messages, newMessage]
    saveAndSyncChat(updatedMessages)
    setInput('')

    if (isPublic && !messages.some(m => m.role === 'tech')) {
      const alreadySentInst = messages.some(m => m.content.includes('Instrucciones'));
      if (!alreadySentInst) {
        setIsTyping(true)
        setTimeout(() => {
          const botMsg: Message = { 
            role: 'bot', 
            content: 'Instrucciones: Por favor, sigue los pasos de la columna de Apoyo Remoto a mi izquierda para que un analista te asista.', 
            timestamp: Date.now() 
          }
          saveAndSyncChat([...updatedMessages, botMsg])
          setIsTyping(false)
        }, 1000);
      }
    }
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

  const handleRequestRemote = () => {
    if (!remoteId || remoteId.length < 5) {
      toast({ variant: "destructive", title: "ID Inválido", description: "Ingrese un ID de AnyDesk válido." })
      return
    }
    
    const rawQueue = localStorage.getItem('atres_support_queue')
    const currentQueue: SupportRequest[] = rawQueue ? JSON.parse(rawQueue) : []
    
    if (currentQueue.some(r => r.remoteId === remoteId)) {
      setIsRemoteRequested(true)
      toast({ title: "Solicitud ya en curso", description: "Ya estás en la lista de espera." })
      return
    }

    const newTicketNumber = generateSequentialFolio();
    const newRequest: SupportRequest = { 
      remoteId, 
      ticketNumber: newTicketNumber,
      timestamp: Date.now(), 
      status: 'pending' as const 
    }

    const newQueue = [...currentQueue, newRequest]
    localStorage.setItem('atres_support_queue', JSON.stringify(newQueue))
    window.dispatchEvent(new StorageEvent('storage', { key: 'atres_support_queue', newValue: JSON.stringify(newQueue) }))

    const currentHistory = localStorage.getItem(`atres_chat_${sessionKey}`)
    if (currentHistory) {
      localStorage.setItem(`atres_chat_${remoteId}`, currentHistory)
    }

    const botMsg: Message = { 
      role: 'bot', 
      content: `He recibido tu solicitud de soporte remoto. \n\n# DE ATENCIÓN: ${newTicketNumber}\nID CONEXIÓN: ${remoteId}\n\nNuestros técnicos han sido notificados. Por favor, mantén AnyDesk abierto.`, 
      timestamp: Date.now() 
    }
    
    saveAndSyncChat([...messages, botMsg])
    setIsRemoteRequested(true)
    setActiveTicketNumber(newTicketNumber)
    sessionStorage.setItem('atres_active_ticket', newTicketNumber)
    toast({ title: "Soporte Solicitado", description: `Folio: ${newTicketNumber}` })
  }

  const resetForNewRequest = () => {
    setRemoteId('')
    setIsRemoteRequested(false)
    setActiveTicketNumber(null)
    sessionStorage.removeItem('atres_active_ticket')
    const newSKey = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('atres_session_id', newSKey)
    setSessionKey(newSKey)
    
    const initial: Message[] = [
      { 
        role: 'bot', 
        content: '¡Hola! Soy tu Asistente Virtual COEES. ¿En qué puedo apoyarte con el sistema ATRES o soporte técnico hoy?', 
        timestamp: Date.now() 
      }
    ]
    setMessages(initial)
    localStorage.setItem(`atres_chat_${newSKey}`, JSON.stringify(initial))
  }

  const copyId = (idToCopy: string) => {
    navigator.clipboard.writeText(idToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "ID Copiado" })
  }

  const handleFinishConfirm = () => {
    if (!finishForm.cct || !finishForm.servicio || !finishForm.oficinaRegionalAtencion) {
      toast({ variant: "destructive", title: "Campos Incompletos", description: "Debe seleccionar un plantel, la oficina y describir el servicio." })
      return
    }

    // 1. Create Program Record
    const rawPrograms = localStorage.getItem('programs_full_v24')
    const programs = rawPrograms ? JSON.parse(rawPrograms) : []
    
    const newAtresRecord = {
      id: selectedRequest!.ticketNumber,
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

    // 2. Remove from Queue
    const rawQueue = localStorage.getItem('atres_support_queue')
    const currentQueue: SupportRequest[] = rawQueue ? JSON.parse(rawQueue) : []
    const newQueue = currentQueue.filter(r => r.remoteId !== selectedRequest!.remoteId)
    localStorage.setItem('atres_support_queue', JSON.stringify(newQueue))
    window.dispatchEvent(new StorageEvent('storage', { key: 'atres_support_queue', newValue: JSON.stringify(newQueue) }))
    
    // 3. Reset States
    setIsFinishDialogOpen(false)
    setSelectedRequest(null)
    setFinishForm({ cct: '', schoolName: '', servicio: '', municipio: '', valle: '', oficinaRegionalAtencion: '' })
    setFinishSearchTerm('')
    syncQueue()
    toast({ title: "Atención Finalizada", description: "El registro se guardó en la bitácora de ATRES." })
  }

  const handleSchoolSelect = (s: any) => {
    setFinishForm({
      ...finishForm,
      cct: s.cct,
      schoolName: s.nombre,
      municipio: s.municipio,
      valle: s.valle
    })
    setFinishSearchTerm('')
  }

  return (
    <div className={cn(
      "flex h-full flex-col md:flex-row bg-white overflow-hidden", 
      isPublic && "rounded-[2.5rem] shadow-2xl border border-primary/10"
    )}>
      {/* Sidebar de Gestión */}
      <div className="w-full md:w-[320px] bg-slate-50 border-r p-6 space-y-6 shrink-0 flex flex-col overflow-y-auto">
        <div className="space-y-1">
          <Badge className="bg-primary text-white text-[9px] font-black uppercase px-2.5 py-1">CENTRO DE APOYO</Badge>
          <h3 className="text-xl font-black text-primary uppercase leading-tight">Apoyo Remoto</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SOPORTE TÉCNICO COEES</p>
        </div>

        {!isPublic ? (
          <div className="space-y-4">
             <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Users className="h-4 w-4 text-accent" />
                <span className="text-[10px] font-black uppercase text-slate-700">Cola de Espera ({queue.length})</span>
             </div>
             {queue.length === 0 ? (
               <div className="p-10 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                  <MonitorOff className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Sin solicitudes</p>
               </div>
             ) : (
               <div className="space-y-2">
                  {queue.map((req) => (
                    <button 
                      key={req.remoteId}
                      onClick={() => setSelectedRequest(req)}
                      className={cn(
                        "w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group",
                        selectedRequest?.remoteId === req.remoteId ? "bg-primary border-primary shadow-lg" : "bg-white hover:bg-slate-100 border-slate-100"
                      )}
                    >
                      <div className="flex flex-col">
                        <span className={cn("text-[9px] font-black uppercase flex items-center gap-1 mb-1", selectedRequest?.remoteId === req.remoteId ? "text-white/70" : "text-accent")}>
                           <Ticket className="h-2.5 w-2.5" /> {req.ticketNumber}
                        </span>
                        <span className={cn("text-sm font-mono font-black", selectedRequest?.remoteId === req.remoteId ? "text-white" : "text-primary")}>{req.remoteId}</span>
                      </div>
                      <ChevronRight className={cn("h-4 w-4", selectedRequest?.remoteId === req.remoteId ? "text-white" : "text-slate-300")} />
                    </button>
                  ))}
               </div>
             )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-5 bg-white rounded-[2rem] border-2 border-primary/5 shadow-xl space-y-5">
              <div className="flex items-center gap-2">
                <div className={cn("h-2.5 w-2.5 rounded-full shadow-sm", isRemoteRequested ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                <span className="text-[10px] font-black uppercase text-slate-700">{isRemoteRequested ? "CONEXIÓN SOLICITADA" : "NUEVA SOLICITUD"}</span>
              </div>
              
              {isRemoteRequested && activeTicketNumber && (
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center animate-in zoom-in-95">
                   <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Folio de Atención</p>
                   <p className="text-lg font-black text-emerald-700">{activeTicketNumber}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-slate-400 pl-1">ID ANYDESK / TEAMVIEWER</Label>
                <Input 
                  placeholder="000 000 000" 
                  className="h-12 text-center font-mono font-black border-primary/20 text-xl bg-slate-50 rounded-2xl focus:ring-4 focus:ring-primary/5 transition-all" 
                  value={remoteId}
                  onChange={(e) => setRemoteId(e.target.value)}
                  disabled={isRemoteRequested}
                  autoFocus
                />
              </div>

              {!isRemoteRequested ? (
                <Button 
                  onClick={handleRequestRemote}
                  disabled={!remoteId || remoteId.length < 5}
                  className="w-full btn-institutional h-12 text-[10px] gap-2 rounded-2xl"
                >
                  <MonitorOff className="h-5 w-5" /> SOLICITAR SOPORTE
                </Button>
              ) : (
                <Button 
                  onClick={resetForNewRequest}
                  variant="outline"
                  className="w-full h-12 text-[9px] font-black uppercase border-primary/20 text-primary hover:bg-primary/5 gap-2 rounded-2xl shadow-sm"
                >
                  <RefreshCcw className="h-5 w-5" /> ENVIAR OTRO ID
                </Button>
              )}
            </div>

            <div className="space-y-4 pt-2">
              <h4 className="text-[10px] font-black uppercase text-accent tracking-[0.2em] border-b pb-2">PASOS A SEGUIR</h4>
              <ul className="space-y-4">
                {[
                  "Descargue AnyDesk en su equipo.",
                  "Copie su ID personal de 9 dígitos.",
                  "Péguelo arriba y haga clic en Solicitar Soporte.",
                  "Esperar unos minutos a que un técnico le atienda."
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-[11px] font-bold text-slate-600 items-start">
                    <span className="h-6 w-6 rounded-full bg-white border-2 border-primary/10 flex items-center justify-center text-primary shrink-0 font-black text-[10px] shadow-sm">{i+1}</span>
                    <div className="flex flex-col gap-2">
                      <span className="leading-tight pt-1 uppercase">{step}</span>
                      {i === 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 px-3 text-[8px] font-black uppercase border-primary/20 text-primary hover:bg-primary/5 rounded-lg w-fit shadow-sm"
                          onClick={() => window.open('https://anydesk.com/en/downloads/windows', '_blank')}
                        >
                          <Download className="h-3 w-3 mr-1.5" /> DESCARGAR AHORA
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {!isPublic && selectedRequest && (
          <div className="mt-auto p-5 bg-white rounded-[2rem] border-2 border-primary/10 space-y-4 shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="flex justify-between items-center">
                <p className="text-[10px] font-black uppercase text-slate-400">Atendiendo a:</p>
                <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black animate-pulse">SESIÓN ACTIVA</Badge>
             </div>

             <div className="bg-primary/5 p-2 rounded-lg border border-primary/10 flex items-center gap-2">
                <Ticket className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-black text-primary uppercase">FOLIO: {selectedRequest.ticketNumber}</span>
             </div>

             <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-primary flex items-center gap-2 pl-1">
                   <UserCog className="h-3 w-3" /> Analista Responsable
                </Label>
                <Input 
                   placeholder="TU NOMBRE..." 
                   className="h-10 text-[10px] font-black uppercase border-primary/10 bg-slate-50 rounded-xl shadow-inner focus:bg-white transition-all"
                   value={techName}
                   onChange={(e) => handleTechNameChange(e.target.value)}
                />
             </div>

             <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border shadow-inner">
                <span className="text-base font-mono font-black text-primary truncate mr-2">{selectedRequest.remoteId}</span>
                <Button variant="ghost" size="icon" onClick={() => copyId(selectedRequest.remoteId)} className="h-10 w-10 hover:bg-white shrink-0 shadow-sm rounded-xl">
                   {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5 text-slate-400" />}
                </Button>
             </div>

             <Button onClick={() => setIsFinishDialogOpen(true)} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase h-12 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
                <X className="h-4 w-4" /> FINALIZAR ATENCIÓN
             </Button>
          </div>
        )}
      </div>

      {/* Chat de Soporte */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {!isPublic && !selectedRequest ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 bg-slate-50/50">
             <div className="h-28 w-28 rounded-full bg-white shadow-2xl flex items-center justify-center text-primary/10 border-8 border-white mb-6">
                <MessageSquare className="h-14 w-12" />
             </div>
             <div className="text-center space-y-3">
                <h3 className="text-2xl font-black text-slate-800 uppercase">Centro de Operaciones</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-[350px] leading-relaxed">Seleccione un usuario de la lista lateral para iniciar el protocolo de asistencia.</p>
             </div>
          </div>
        ) : (
          <>
            <header className="p-5 border-b flex flex-row justify-between items-center bg-white/90 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                  <Bot className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-primary uppercase leading-none">Mesa de Ayuda ATRES</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Soporte Técnico en Vivo</p>
                    {(!isPublic && selectedRequest) && (
                      <span className="text-[9px] font-black text-accent ml-2"># {selectedRequest.ticketNumber}</span>
                    )}
                  </div>
                </div>
              </div>
            </header>

            <ScrollArea className="flex-1 bg-slate-50/20">
              <div className="p-8 space-y-6 max-w-4xl mx-auto">
                {messages.map((msg, i) => {
                  const isMe = (isPublic && msg.role === 'user') || (!isPublic && msg.role === 'tech')
                  return (
                    <div key={i} className={cn("flex w-full animate-in slide-in-from-bottom-2 duration-300", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn("flex gap-3 max-w-[80%]", isMe ? "flex-row-reverse" : "flex-row")}>
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg border-2 border-white",
                          msg.role === 'user' ? "bg-accent text-white" : msg.role === 'tech' ? "bg-primary text-white" : "bg-slate-400 text-white"
                        )}>
                          {msg.role === 'user' ? <User className="h-5 w-5" /> : msg.role === 'tech' ? <Headset className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                        </div>
                        <div className={cn("p-5 rounded-[2rem] text-[13px] font-semibold shadow-md border leading-relaxed",
                          isMe ? "bg-[#B38E5D] text-white rounded-tr-none border-[#B38E5D]/10" : "bg-white text-slate-700 rounded-tl-none border-slate-100"
                        )}>
                          {msg.senderName && <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-70">Analista: {msg.senderName}</p>}
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <p className={cn("text-[9px] mt-2 font-black uppercase tracking-widest", isMe ? "text-white/60" : "text-slate-300")}>
                            {mounted ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {isTyping && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-white border border-slate-100 p-4 rounded-[1.5rem] rounded-tl-none shadow-sm flex items-center gap-3">
                       <Loader2 className="h-5 w-5 animate-spin text-primary" />
                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Analista escribiendo...</span>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <footer className="p-6 bg-white border-t border-slate-100">
              <div className="max-w-4xl mx-auto flex gap-4">
                <Input 
                  placeholder={isPublic ? "Describa su duda técnica aquí..." : "Escribir respuesta oficial..."}
                  className="h-14 rounded-2xl bg-slate-50 border-primary/5 px-8 font-bold text-sm shadow-inner focus:ring-4 focus:ring-primary/5 transition-all focus:bg-white"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isTyping}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isTyping}
                  className="h-14 w-14 rounded-2xl btn-institutional shrink-0 shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                >
                  <Send className="h-6 w-6" />
                </button>
              </div>
            </footer>
          </>
        )}
      </div>

      {/* Finishing Dialog */}
      <Dialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <DialogContent className="sm:max-w-[650px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-primary text-white shrink-0">
            <DialogTitle className="uppercase font-black text-white text-xl flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" /> Resumen de Atención ATRES
            </DialogTitle>
            <DialogDescription className="text-white/60 font-bold text-[10px] uppercase tracking-widest">
              Capture el plantel, oficina regional y el servicio realizado para el registro oficial.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="p-8 space-y-6 bg-white">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2 pl-1">
                  <Search className="h-4 w-4 text-accent" /> Localizador de Plantel (CCT)
                </Label>
                <div className="relative">
                  <Input 
                    placeholder="TECLEAR CCT O NOMBRE..." 
                    className="h-12 rounded-xl bg-slate-50 border-primary/10 text-xs font-black uppercase shadow-inner"
                    value={finishSearchTerm}
                    onChange={(e) => setFinishSearchTerm(e.target.value)}
                  />
                  {finishSearchTerm.length > 2 && (
                    <div className="absolute left-0 right-0 top-14 max-h-48 overflow-auto bg-white border border-slate-200 rounded-xl shadow-2xl z-50 divide-y">
                      {schoolsDirectory.filter(s => 
                          s.cct.includes(finishSearchTerm.toUpperCase()) || 
                          s.nombre.includes(finishSearchTerm.toUpperCase())
                      ).slice(0, 5).map(s => (
                          <div key={s.cct} className="p-3 hover:bg-primary/5 cursor-pointer flex justify-between items-center transition-colors" onClick={() => handleSchoolSelect(s)}>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-slate-800">{s.nombre}</span>
                              <span className="text-[8px] font-mono text-muted-foreground">{s.cct} • {s.municipio}</span>
                            </div>
                            <Badge variant="outline" className="text-[7px] font-black uppercase border-primary/20 text-primary">Elegir</Badge>
                          </div>
                      ))}
                    </div>
                  )}
                </div>

                {finishForm.cct && (
                  <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-100 flex items-center gap-4 animate-in zoom-in-95">
                      <div className="h-10 w-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                        <School className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Plantel Vinculado</p>
                        <h4 className="text-xs font-black text-slate-800 uppercase leading-none">{finishForm.schoolName}</h4>
                        <p className="text-[9px] font-mono font-bold text-slate-400 mt-1">{finishForm.cct}</p>
                      </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2 pl-1">
                  <Building2 className="h-4 w-4 text-accent" /> Oficina que Atendió
                </Label>
                <Select value={finishForm.oficinaRegionalAtencion} onValueChange={(val) => setFinishForm({...finishForm, oficinaRegionalAtencion: val})}>
                  <SelectTrigger className="h-12 bg-slate-50 border-primary/10 rounded-xl text-xs font-black uppercase shadow-inner">
                    <SelectValue placeholder="SELECCIONAR OFICINA..." />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONAL_OFFICES.map(off => (
                      <SelectItem key={off} value={off} className="text-[10px] font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-1">Servicio Realizado</Label>
                <Textarea 
                  placeholder="DETALLE TÉCNICO DE LA SOLUCIÓN..." 
                  className="h-24 rounded-2xl bg-slate-50 border-primary/10 p-4 text-xs font-bold shadow-inner focus:bg-white transition-all"
                  value={finishForm.servicio}
                  onChange={(e) => setFinishForm({...finishForm, servicio: e.target.value.toUpperCase()})}
                />
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <UserCog className="h-4 w-4" />
                </div>
                <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Analista Responsable</p>
                    <p className="text-[10px] font-black text-primary uppercase">{techName || 'SIN IDENTIFICAR'}</p>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-3">
             <Button variant="ghost" onClick={() => setIsFinishDialogOpen(false)} className="h-12 px-6 text-[10px] font-black uppercase">Cancelar</Button>
             <Button onClick={handleFinishConfirm} className="btn-institutional h-12 px-10 text-[10px] gap-2">
                <Save className="h-4 w-4" /> Finalizar y Registrar
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
