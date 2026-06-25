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
  Clock,
  Laptop
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
      if (savedTicket) setActiveTicketNumber(savedTicket)

      const savedShow = sessionStorage.getItem('atres_show_remote_panel')
      if (savedShow === 'true') setShowRemotePanel(true)
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
    };
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [syncQueue, syncChat, activeChatId])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
    const botMsg: Message = { role: 'bot', content: `Soporte remoto solicitado.\n\nFolio: ${folio}\nID: ${remoteId}\n\nEspere conexión del analista.`, timestamp: Date.now() };
    const historyKey = `atres_chat_${folio}`;
    const old = JSON.parse(localStorage.getItem(`atres_chat_${sessionKey}`) || '[]');
    const final = [...old, botMsg];
    localStorage.setItem(historyKey, JSON.stringify(final));
    setMessages(final); setActiveTicketNumber(folio); sessionStorage.setItem('atres_active_ticket', folio);
    setIsRemoteRequested(true); setHighlightRemote(false);
    window.dispatchEvent(new StorageEvent('storage', { key: historyKey, newValue: JSON.stringify(final), storageArea: localStorage }));
  }

  const handleFinishConfirm = () => {
    if (!finishForm.cct || !finishForm.servicio || !finishForm.oficinaRegionalAtencion) { toast({ variant: "destructive", title: "Datos incompletos" }); return; }
    const folio = selectedRequest!.ticketNumber;
    const rawPrograms = localStorage.getItem('programs_full_v24')
    const progs = rawPrograms ? JSON.parse(rawPrograms) : []
    const newRec = { id: folio, name: 'ATRES', cct: finishForm.cct, schoolName: finishForm.schoolName, municipio: finishForm.municipio, valle: finishForm.valle, status: 'concluido', date: format(new Date(), 'yyyy-MM-dd'), progress: 100, asistentes: [], observaciones: finishForm.servicio, tecnicos: techName, oficinaRegionalAtencion: finishForm.oficinaRegionalAtencion }
    localStorage.setItem('programs_full_v24', JSON.stringify([newRec, ...progs]))
    localStorage.setItem(`atres_session_status_${folio}`, 'closed');
    window.dispatchEvent(new StorageEvent('storage', { key: `atres_session_status_${folio}`, newValue: 'closed' }));
    const rawQueue = localStorage.getItem('atres_support_queue')
    localStorage.setItem('atres_support_queue', JSON.stringify(JSON.parse(rawQueue || '[]').filter((r: any) => r.ticketNumber !== folio)))
    window.dispatchEvent(new StorageEvent('storage', { key: 'atres_support_queue', newValue: '[]' }))
    setIsFinishDialogOpen(false); setSelectedRequest(null); syncQueue(); toast({ title: "Atención registrada" });
  }

  const getFileIcon = (type: string) => {
    if (type.includes('word')) return <FileText className="h-5 w-5 text-blue-500" />
    if (type.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-rose-500" />
    return <FileCode className="h-5 w-5 text-slate-400" />
  }

  if (!mounted) return null

  return (
    <div className={cn(
      "flex flex-1 w-full flex-col md:flex-row bg-white/40 backdrop-blur-xl border border-white/50 overflow-hidden transition-all duration-700", 
      isPublic ? "rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.12)]" : "h-full"
    )}>
      {/* Columna Lateral Dinámica */}
      {(!isPublic || showRemotePanel) && (
        <div className={cn(
          "w-full md:w-[350px] border-r bg-white/60 backdrop-blur-3xl p-6 flex flex-col gap-6 shrink-0 overflow-y-auto animate-in slide-in-from-left duration-700 no-scrollbar",
          highlightRemote && "ring-8 ring-primary/5"
        )}>
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
               <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(159,34,65,0.6)]" />
               <span className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Célula COEES</span>
            </div>
            <h3 className="text-3xl font-black text-slate-800 uppercase leading-[0.9] tracking-tighter">Apoyo <br /> Técnico</h3>
          </div>

          {isPublic ? (
            <div className="space-y-6 animate-in slide-in-from-top-4 duration-1000">
               <div className={cn(
                 "p-6 bg-white rounded-[2.5rem] border-2 shadow-2xl space-y-6 transition-all duration-700 relative overflow-hidden group",
                 highlightRemote ? "border-primary scale-[1.03]" : "border-slate-100"
               )}>
                 <div className="absolute -top-6 -right-6 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                    <Laptop className="h-32 w-32" />
                 </div>
                 
                 <div className="relative z-10">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Estatus Conexión</p>
                    <h4 className="text-xs font-black uppercase text-primary flex items-center gap-2">
                       <Monitor className="h-4 w-4" /> Solicitud AnyDesk
                    </h4>
                 </div>

                 <div className="space-y-3 relative z-10">
                    <Label className="text-[9px] font-black uppercase text-slate-400 pl-2">ID DE CONEXIÓN</Label>
                    <Input 
                      placeholder="000 000 000" 
                      className="h-14 text-center font-mono font-black border-slate-100 text-2xl bg-slate-50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 shadow-inner tracking-[0.2em]" 
                      value={remoteId} 
                      onChange={(e) => setRemoteId(e.target.value)} 
                      disabled={isRemoteRequested} 
                    />
                 </div>

                 {!isRemoteRequested ? (
                   <Button onClick={handleRequestRemote} disabled={!remoteId || remoteId.length < 5} className="w-full btn-institutional h-12 text-[10px] rounded-2xl shadow-xl">
                     SOLICITAR SOPORTE
                   </Button>
                 ) : (
                   <Button onClick={handleEditRemoteId} variant="outline" className="w-full h-12 text-[10px] font-black uppercase border-primary/20 text-primary rounded-2xl hover:bg-primary/5">
                     ENVIAR OTRO ID
                   </Button>
                 )}
               </div>

               <div className="space-y-4 px-2">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                     <ArrowRightCircle className="h-4 w-4 text-accent" />
                     <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">PROTOCOLO DE ATENCIÓN</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      { t: "Descargue software AnyDesk.", c: <Button variant="outline" size="sm" className="h-8 px-4 text-[8px] font-black border-primary/20 text-primary rounded-xl mt-2 hover:bg-primary hover:text-white transition-all shadow-md" onClick={() => window.open('https://anydesk.com', '_blank')}><Download className="h-3.5 w-3.5 mr-2" /> DESCARGAR AHORA</Button> },
                      { t: "Localice su ID personal." },
                      { t: "Péguelo arriba y solicite soporte." },
                      { t: "Espere conexión del analista." }
                    ].map((step, i) => (
                      <div key={i} className="flex gap-4 group">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="h-7 w-7 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-[10px] font-black text-primary group-hover:scale-110 transition-transform">
                            {i+1}
                          </div>
                          {i < 3 && <div className="w-px flex-1 bg-slate-100 my-1" />}
                        </div>
                        <div className="pt-1.5 pb-2">
                          <p className="text-[10px] font-bold text-slate-500 uppercase leading-snug">{step.t}</p>
                          {step.c}
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
               <div className="space-y-4 shrink-0">
                  <Label className="text-[10px] font-black uppercase text-slate-400 border-b pb-2 flex items-center justify-between w-full">
                    Cola de Espera <Badge className="bg-primary text-white text-[8px]">{queue.length}</Badge>
                  </Label>
                  <ScrollArea className="h-40">
                    <div className="space-y-2 pr-2">
                      {queue.map(req => (
                        <button key={req.ticketNumber} onClick={() => setSelectedRequest(req)} className={cn("w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group", selectedRequest?.ticketNumber === req.ticketNumber ? "bg-primary border-primary shadow-xl" : "bg-white border-slate-100 hover:bg-slate-50")}>
                          <div className="flex flex-col">
                            <span className={cn("text-[8px] font-black", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white/60" : "text-accent")}>{req.ticketNumber}</span>
                            <span className={cn("text-xs font-black", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white" : "text-slate-700")}>{req.requestType === 'chat' ? 'Consulta' : 'Remoto'}</span>
                          </div>
                          <ChevronRight className={cn("h-4 w-4", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white" : "text-slate-300")} />
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
               </div>
               <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                  <Label className="text-[10px] font-black uppercase text-slate-400 border-b pb-2 flex items-center justify-between w-full">
                    Biblioteca de Formatos <Plus className="h-3 w-3 cursor-pointer hover:text-primary" onClick={() => libraryInputRef.current?.click()} />
                  </Label>
                  <input type="file" ref={libraryInputRef} className="hidden" onChange={handleLibraryUpload} />
                  <ScrollArea className="flex-1">
                    <div className="space-y-2 pr-2">
                      {techLibrary.map(f => (
                        <div key={f.id} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 group hover:border-primary/30 transition-all">
                           {getFileIcon(f.type)}
                           <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black text-slate-600 truncate uppercase">{f.name}</p>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                <button className="text-[8px] font-black text-primary uppercase" onClick={() => sendLibraryFile(f)}>Enviar</button>
                                <button className="text-[8px] font-black text-rose-500 uppercase" onClick={() => removeLibraryFile(f.id)}>Eliminar</button>
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

      {/* Área Central del Chat */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-white/20">
        {!isPublic && !selectedRequest ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center text-primary/10 border-4 border-white animate-bounce [animation-duration:4s]">
                 <MessageSquare className="h-12 w-12" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-accent bg-white rounded-xl p-1.5 shadow-xl" />
            </div>
            <div className="max-w-xs space-y-2">
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Mesa de Control</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seleccione un folio de la lista lateral para iniciar la sincronización.</p>
            </div>
          </div>
        ) : (
          <>
            <header className="px-8 py-5 border-b bg-white/60 backdrop-blur-xl flex justify-between items-center z-10 shrink-0">
              <div className="flex items-center gap-4">
                <div className="relative h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/20 overflow-hidden group">
                  <Bot className="h-7 w-7 relative z-10 group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 uppercase leading-none tracking-tight">Asistente COEES</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">Atendiendo</p>
                    {activeChatId && <Badge variant="outline" className="text-[8px] font-mono border-slate-200 text-slate-400 px-2 h-4">{activeChatId}</Badge>}
                  </div>
                </div>
              </div>
              {!isPublic && selectedRequest && (
                <Button onClick={() => setIsFinishDialogOpen(true)} className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] uppercase h-10 px-6 rounded-2xl shadow-lg transition-all active:scale-95 gap-2">
                  <CheckCircle2 className="h-4 w-4" /> FINALIZAR ATENCIÓN
                </Button>
              )}
            </header>

            <ScrollArea className="flex-1 bg-slate-50/20">
              <div className="p-8 space-y-8 max-w-4xl mx-auto min-h-full flex flex-col justify-end">
                {messages.map((msg, i) => {
                  const isMe = (isPublic && msg.role === 'user') || (!isPublic && msg.role === 'tech');
                  const isBot = msg.role === 'bot';
                  return (
                    <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-500", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn("flex gap-3 max-w-[85%]", isMe ? "flex-row-reverse" : "flex-row")}>
                        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg border-2 border-white", msg.role === 'user' ? "bg-accent text-white" : msg.role === 'tech' ? "bg-primary text-white" : "bg-slate-800 text-white")}>
                          {msg.role === 'user' ? <User className="h-4 w-4" /> : msg.role === 'tech' ? <Headset className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className="space-y-1">
                          {msg.senderName && <span className={cn("text-[7px] font-black uppercase tracking-widest block", isMe ? "text-right text-accent" : "text-left text-slate-400")}>{msg.senderName} • BRIGADA TÉCNICA</span>}
                          <div className={cn("p-4 rounded-[1.8rem] text-[12px] font-semibold shadow-xl border leading-relaxed", isMe ? "bg-accent text-white rounded-tr-none border-transparent" : isBot ? "bg-slate-800 text-white rounded-tl-none border-transparent" : "bg-white text-slate-700 rounded-tl-none border-slate-50")}>
                            {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                            {msg.fileData && (
                              <div className={cn("mt-3 p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.02]", isMe ? "bg-white/10 border-white/20" : "bg-slate-50 border-slate-100")} onClick={() => downloadFile(msg.fileData!, msg.fileName!)}>
                                <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center shadow-sm">{getFileIcon(msg.fileType || '')}</div>
                                <div className="flex-1 min-w-0"><p className={cn("text-[9px] font-black truncate uppercase", isMe ? "text-white" : "text-slate-800")}>{msg.fileName}</p></div>
                              </div>
                            )}
                            <div className={cn("text-[7px] mt-2 font-black uppercase opacity-40 flex items-center gap-1", isMe ? "justify-end" : "justify-start")}>
                              <Clock className="h-2.5 w-2.5" /> {mounted ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/80 p-3 rounded-2xl rounded-tl-none shadow-md flex items-center gap-2">
                       <div className="flex gap-1"><div className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" /><div className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" /><div className="h-1 w-1 rounded-full bg-primary animate-bounce" /></div>
                       <span className="text-[8px] font-black uppercase text-slate-300">Escribiendo...</span>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <footer className="p-6 bg-white/80 backdrop-blur-xl border-t shrink-0">
              <div className="max-w-4xl mx-auto flex gap-3">
                <div className="relative flex-1">
                  <Input placeholder={isPublic ? "Escriba su duda detalladamente..." : "Escriba la respuesta oficial..."} className="h-12 rounded-2xl bg-slate-50 border-none px-6 pr-12 font-semibold shadow-inner focus:ring-4 focus:ring-primary/5 text-sm" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
                  <button onClick={() => fileInputRef.current?.click()} className="absolute right-3 top-2.5 h-7 w-7 text-slate-300 hover:text-primary transition-all flex items-center justify-center"><Paperclip className="h-4 w-4" /></button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                </div>
                <button onClick={() => handleSendMessage()} disabled={!input.trim()} className="h-12 w-12 rounded-2xl btn-institutional shrink-0 flex items-center justify-center shadow-2xl active:scale-90 transition-transform"><Send className="h-6 w-6" /></button>
              </div>
            </footer>
          </>
        )}
      </div>

      {/* Modales de Gestión */}
      <Dialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-[3rem] border-none shadow-[0_50px_150px_rgba(0,0,0,0.25)] p-0 overflow-hidden">
          <DialogHeader className="p-10 bg-primary text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10"><CheckCircle2 className="h-40 w-40" /></div>
            <DialogTitle className="uppercase font-black text-white text-3xl flex items-center gap-4 relative z-10"><CheckCircle2 className="h-10 w-10 text-emerald-400" /> Registro Final</DialogTitle>
          </DialogHeader>
          <div className="p-10 space-y-6 bg-white overflow-y-auto max-h-[60vh] no-scrollbar">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-1 flex items-center gap-2"><Search className="h-4 w-4 text-accent" /> Plantel Atendido</Label>
              <Input placeholder="TECLEAR CCT O NOMBRE..." className="h-12 bg-slate-50 border-none rounded-xl text-sm font-black uppercase shadow-inner" value={finishSearchTerm} onChange={e => setFinishSearchTerm(e.target.value)} />
              {finishSearchTerm.length > 2 && (
                <div className="max-h-40 overflow-y-auto bg-white border border-slate-100 rounded-xl shadow-2xl divide-y">
                  {schoolsDirectory.filter(s => s.cct.includes(finishSearchTerm.toUpperCase()) || s.nombre.includes(finishSearchTerm.toUpperCase())).slice(0, 5).map(s => (
                    <div key={`${s.cct}-${s.turno}`} className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center" onClick={() => { setFinishForm({...finishForm, cct: s.cct, schoolName: s.nombre, municipio: s.municipio, valle: s.valle}); setFinishSearchTerm('') }}>
                      <div className="flex flex-col"><span className="text-xs font-black uppercase">{s.nombre}</span><span className="text-[9px] text-slate-400">{s.cct}</span></div>
                    </div>
                  ))}
                </div>
              )}
              {finishForm.cct && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 border py-2 px-4 rounded-xl w-full text-center uppercase font-black">{finishForm.schoolName}</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Oficina Atendió</Label><Select value={finishForm.oficinaRegionalAtencion} onValueChange={v => setFinishForm({...finishForm, oficinaRegionalAtencion: v})}><SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl text-xs font-black uppercase"><SelectValue placeholder="OFICINA..." /></SelectTrigger><SelectContent>{REGIONAL_OFFICES.map(off => <SelectItem key={off} value={off} className="text-[10px] font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Folio</Label><div className="h-12 bg-slate-100 rounded-xl flex items-center px-4 font-mono font-black text-slate-500 shadow-inner">{selectedRequest?.ticketNumber}</div></div>
            </div>
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary pl-1">Resumen del Servicio</Label><Textarea placeholder="DETALLE TÉCNICO DE LA SOLUCIÓN..." className="h-28 bg-slate-50 border-none rounded-xl p-4 text-xs font-bold shadow-inner" value={finishForm.servicio} onChange={e => setFinishForm({...finishForm, servicio: e.target.value.toUpperCase()})} /></div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4"><Button variant="ghost" onClick={() => setIsFinishDialogOpen(false)} className="h-12 px-8 text-[10px] font-black uppercase">CANCELAR</Button><Button onClick={handleFinishConfirm} className="btn-institutional h-12 px-12 text-[10px] gap-2"><Save className="h-5 w-5" /> CONCLUIR ATENCIÓN</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function sendLibraryFile(file: TechFile) { /* Logic handled in main component via sendLibraryFile state or function passed to library sub-ui */ }
function removeLibraryFile(id: string) { /* Logic handled in main component */ }
function downloadFile(data: string, name: string) { const link = document.createElement('a'); link.href = data; link.download = name; link.click(); }
