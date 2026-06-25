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
  Headset,
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
  Laptop,
  Activity,
  Sparkles
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
  }

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

  const handleFinishConfirm = () => {
    if (!finishForm.cct || !finishForm.servicio || !finishForm.oficinaRegionalAtencion) { toast({ variant: "destructive", title: "Faltan datos obligatorios" }); return; }
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
    setIsFinishDialogOpen(false); setSelectedRequest(null); syncQueue();
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
      "flex flex-1 w-full flex-col md:flex-row bg-white/40 backdrop-blur-xl border border-white/50 overflow-hidden transition-all duration-500", 
      isPublic ? "rounded-[2.5rem] shadow-2xl h-full" : "h-full"
    )}>
      {/* Columna Izquierda Ejecutiva y Compacta */}
      {(!isPublic || showRemotePanel) && (
        <div className={cn(
          "w-full md:w-[320px] border-r bg-white/70 p-5 flex flex-col gap-4 shrink-0 transition-all relative z-20 overflow-hidden",
          highlightRemote && "ring-8 ring-primary/5"
        )}>
          {/* Header de Columna Compacto */}
          <div className="space-y-0.5 shrink-0">
             <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[8px] font-black uppercase text-primary tracking-[0.2em]">Célula COEES</span>
             </div>
             <h3 className="text-xl font-black text-[#9f2241] uppercase leading-tight tracking-tighter">Apoyo Técnico</h3>
             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="h-2.5 w-2.5" /> Estatus Conexión
             </p>
          </div>

          {isPublic ? (
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
               {/* Sección Solicitud AnyDesk Compacta */}
               <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-lg space-y-3 relative overflow-hidden shrink-0">
                  <div className="relative z-10">
                     <Label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Solicitud AnyDesk / TeamViewer</Label>
                     <div className="mt-2 space-y-3">
                        <div className="space-y-1">
                           <span className="text-[7px] font-black text-primary uppercase ml-0.5">ID de Conexión</span>
                           <Input 
                             placeholder="000 000 000" 
                             className="h-10 text-center font-mono font-black border-slate-100 text-lg bg-slate-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/5 shadow-inner" 
                             value={remoteId} 
                             onChange={(e) => setRemoteId(e.target.value)} 
                             disabled={isRemoteRequested} 
                           />
                        </div>
                        
                        {!isRemoteRequested ? (
                          <Button onClick={handleRequestRemote} disabled={!remoteId || remoteId.length < 5} className="w-full btn-institutional h-9 text-[8px] rounded-lg">
                            SOLICITAR SOPORTE
                          </Button>
                        ) : (
                          <Button onClick={handleEditRemoteId} variant="outline" className="w-full h-9 text-[8px] font-black uppercase border-primary/20 text-primary rounded-lg">
                            ENVIAR OTRO ID
                          </Button>
                        )}
                     </div>
                  </div>
               </div>

               {/* Protocolo de Atención Compacto */}
               <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 shrink-0">
                     <ArrowRightCircle className="h-3.5 w-3.5 text-accent" />
                     <span className="text-[9px] font-black uppercase text-slate-600 tracking-[0.1em]">Protocolo de Atención</span>
                  </div>
                  
                  <div className="space-y-2.5 overflow-y-auto no-scrollbar pr-1">
                     {[
                        { 
                          n: "1", 
                          t: "Descargue software AnyDesk.", 
                          c: <Button variant="outline" size="sm" className="h-6 px-2 text-[7px] font-black border-primary/20 text-primary rounded-md mt-1 hover:bg-primary hover:text-white transition-all" onClick={() => window.open('https://anydesk.com', '_blank')}><Download className="h-2.5 w-2.5 mr-1.5" /> DESCARGAR AHORA</Button> 
                        },
                        { n: "2", t: "Localice su ID personal de 9 dígitos." },
                        { n: "3", t: "Péguelo arriba y solicite soporte." },
                        { n: "4", t: "Espere conexión del analista." }
                     ].map((step, i) => (
                        <div key={i} className="flex gap-3 items-start group">
                           <div className="flex flex-col items-center shrink-0">
                              <div className="h-5 w-5 rounded-md bg-[#B38E5D] text-white flex items-center justify-center text-[9px] font-black shadow-md">
                                 {step.n}
                              </div>
                              {i < 3 && <div className="w-px flex-1 bg-slate-100 my-0.5 min-h-[10px]" />}
                           </div>
                           <div className="pt-0.5">
                              <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight">{step.t}</p>
                              {step.c}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
               <div className="space-y-2 shrink-0">
                  <Label className="text-[9px] font-black uppercase text-slate-400 border-b pb-1 flex items-center justify-between w-full">
                    Cola de Espera <Badge className="bg-primary text-white text-[7px]">{queue.length}</Badge>
                  </Label>
                  <ScrollArea className="h-32">
                    <div className="space-y-1.5 pr-2">
                      {queue.map(req => (
                        <button key={req.ticketNumber} onClick={() => setSelectedRequest(req)} className={cn("w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group", selectedRequest?.ticketNumber === req.ticketNumber ? "bg-primary border-primary shadow-md" : "bg-white border-slate-100 hover:bg-slate-50")}>
                          <div className="flex flex-col"><span className={cn("text-[7px] font-black", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white/60" : "text-accent")}>{req.ticketNumber}</span><span className={cn("text-[10px] font-black", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white" : "text-slate-700")}>{req.requestType === 'chat' ? 'Consulta' : 'Remoto'}</span></div>
                          <ChevronRight className={cn("h-3 w-3", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white" : "text-slate-300")} />
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
               </div>
               <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                  <Label className="text-[9px] font-black uppercase text-slate-400 border-b pb-1 flex items-center justify-between w-full">
                    Biblioteca <Plus className="h-2.5 w-2.5 cursor-pointer hover:text-primary" onClick={() => libraryInputRef.current?.click()} />
                  </Label>
                  <input type="file" ref={libraryInputRef} className="hidden" onChange={handleLibraryUpload} />
                  <ScrollArea className="flex-1">
                    <div className="space-y-1.5 pr-2">
                      {techLibrary.map(f => (
                        <div key={f.id} className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm flex items-center gap-2 group hover:border-primary/20 transition-all">
                           {getFileIcon(f.type)}
                           <div className="flex-1 min-w-0">
                              <p className="text-[8px] font-black text-slate-600 truncate uppercase">{f.name}</p>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="text-[7px] font-black text-primary uppercase" onClick={() => sendLibraryFile(f)}>Enviar</button>
                                <button className="text-[7px] font-black text-rose-500 uppercase" onClick={() => removeLibraryFile(f.id)}>Borrar</button>
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

      {/* Área de Chat */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!isPublic && !selectedRequest ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-white shadow-xl flex items-center justify-center text-primary/10 border-2 border-white animate-pulse">
               <MessageSquare className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Mesa de Control</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Seleccione un folio de la lista lateral.</p>
            </div>
          </div>
        ) : (
          <>
            <header className="px-6 py-4 border-b bg-white/60 backdrop-blur-xl flex justify-between items-center z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg relative overflow-hidden group">
                  <Bot className="h-6 w-6 relative z-10 group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase leading-none tracking-tight">Asistente COEES</h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">En Línea</p>
                    {activeChatId && <Badge variant="outline" className="text-[7px] font-mono border-slate-200 text-slate-400 px-1.5 h-3.5">{activeChatId}</Badge>}
                  </div>
                </div>
              </div>
              {!isPublic && selectedRequest && (
                <Button onClick={() => setIsFinishDialogOpen(true)} className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[8px] uppercase h-8 px-4 rounded-xl shadow-md transition-all active:scale-95 gap-2">
                  <CheckCircle2 className="h-3 w-3" /> FINALIZAR
                </Button>
              )}
            </header>

            <ScrollArea className="flex-1 bg-slate-50/10">
              <div className="p-6 space-y-4 max-w-4xl mx-auto min-h-full flex flex-col justify-end">
                {messages.map((msg, i) => {
                  const isMe = (isPublic && msg.role === 'user') || (!isPublic && msg.role === 'tech');
                  const isBot = msg.role === 'bot';
                  return (
                    <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-1 duration-300", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn("flex gap-2.5 max-w-[85%]", isMe ? "flex-row-reverse" : "flex-row")}>
                        <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-white", msg.role === 'user' ? "bg-[#B38E5D] text-white" : msg.role === 'tech' ? "bg-primary text-white" : "bg-slate-800 text-white")}>
                          {msg.role === 'user' ? <User className="h-3 w-3" /> : msg.role === 'tech' ? <Headset className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                        </div>
                        <div className="space-y-0.5">
                          {msg.senderName && <span className={cn("text-[6px] font-black uppercase tracking-widest block", isMe ? "text-right text-accent" : "text-left text-slate-400")}>{msg.senderName}</span>}
                          <div className={cn("p-3 rounded-2xl text-[11px] font-semibold shadow-md border leading-relaxed", isMe ? "bg-[#B38E5D] text-white rounded-tr-none border-transparent" : isBot ? "bg-slate-800 text-white rounded-tl-none border-transparent" : "bg-white text-slate-700 rounded-tl-none border-slate-100")}>
                            {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                            {msg.fileData && (
                              <div className={cn("mt-2 p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-all hover:bg-black/5", isMe ? "bg-white/10 border-white/20" : "bg-slate-50 border-slate-100")} onClick={() => downloadFile(msg.fileData!, msg.fileName!)}>
                                <div className="h-6 w-6 bg-white rounded-md flex items-center justify-center shadow-sm">{getFileIcon(msg.fileType || '')}</div>
                                <div className="flex-1 min-w-0"><p className={cn("text-[8px] font-black truncate uppercase", isMe ? "text-white" : "text-slate-800")}>{msg.fileName}</p></div>
                              </div>
                            )}
                            <div className={cn("text-[6px] mt-1.5 font-black uppercase opacity-40 flex items-center gap-1", isMe ? "justify-end" : "justify-start")}>
                              <Clock className="h-2 w-2" /> {mounted ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/80 p-2 rounded-xl rounded-tl-none shadow-sm flex items-center gap-2">
                       <div className="flex gap-0.5"><div className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" /><div className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" /><div className="h-1 w-1 rounded-full bg-primary animate-bounce" /></div>
                       <span className="text-[7px] font-black uppercase text-slate-300">Analista escribiendo...</span>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <footer className="p-4 bg-white/80 backdrop-blur-xl border-t shrink-0 relative z-10">
              <div className="max-w-4xl mx-auto flex gap-2">
                <div className="relative flex-1">
                  <Input placeholder={isPublic ? "Escriba su duda..." : "Respuesta oficial..."} className="h-10 rounded-xl bg-slate-50 border-none px-4 pr-10 font-semibold shadow-inner focus:ring-2 focus:ring-primary/5 text-xs" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
                  <button onClick={() => fileInputRef.current?.click()} className="absolute right-2 top-2 h-6 w-6 text-slate-300 hover:text-primary transition-all flex items-center justify-center"><Paperclip className="h-3 w-3" /></button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                </div>
                <button onClick={() => handleSendMessage()} disabled={!input.trim()} className="h-10 w-10 rounded-xl btn-institutional shrink-0 flex items-center justify-center shadow-lg active:scale-90 transition-transform"><Send className="h-5 w-5" /></button>
              </div>
            </footer>
          </>
        )}
      </div>

      {/* Modales de Gestión */}
      <Dialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-primary text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><CheckCircle2 className="h-32 w-32" /></div>
            <DialogTitle className="uppercase font-black text-white text-2xl flex items-center gap-4 relative z-10"><CheckCircle2 className="h-8 w-8 text-emerald-400" /> Registro Final</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-4 bg-white">
            <div className="space-y-3">
              <Label className="text-[9px] font-black uppercase text-primary tracking-widest pl-1 flex items-center gap-2">Plantel Atendido</Label>
              <Input placeholder="TECLEAR CCT O NOMBRE..." className="h-10 bg-slate-50 border-none rounded-lg text-xs font-black uppercase shadow-inner" value={finishSearchTerm} onChange={e => setFinishSearchTerm(e.target.value)} />
              {finishSearchTerm.length > 2 && (
                <div className="max-h-32 overflow-y-auto bg-white border border-slate-100 rounded-lg shadow-xl divide-y">
                  {schoolsDirectory.filter(s => s.cct.includes(finishSearchTerm.toUpperCase()) || s.nombre.includes(finishSearchTerm.toUpperCase())).slice(0, 5).map(s => (
                    <div key={`${s.cct}-${s.turno}`} className="p-2.5 hover:bg-slate-50 cursor-pointer flex justify-between items-center" onClick={() => { setFinishForm({...finishForm, cct: s.cct, schoolName: s.nombre, municipio: s.municipio, valle: s.valle}); setFinishSearchTerm('') }}>
                      <div className="flex flex-col"><span className="text-[10px] font-black uppercase">{s.nombre}</span><span className="text-[8px] text-slate-400">{s.cct}</span></div>
                    </div>
                  ))}
                </div>
              )}
              {finishForm.cct && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 border py-1.5 px-3 rounded-lg w-full text-center uppercase font-black text-[9px]">{finishForm.schoolName}</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Oficina Atendió</Label><Select value={finishForm.oficinaRegionalAtencion} onValueChange={v => setFinishForm({...finishForm, oficinaRegionalAtencion: v})}><SelectTrigger className="h-10 bg-slate-50 border-none rounded-lg text-[10px] font-black uppercase"><SelectValue placeholder="OFICINA..." /></SelectTrigger><SelectContent>{REGIONAL_OFFICES.map(off => <SelectItem key={off} value={off} className="text-[10px] font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Folio</Label><div className="h-10 bg-slate-100 rounded-lg flex items-center px-4 font-mono font-black text-slate-500 shadow-inner text-xs">{selectedRequest?.ticketNumber}</div></div>
            </div>
            <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-primary pl-1">Resumen del Servicio</Label><Textarea placeholder="DETALLE TÉCNICO..." className="h-20 bg-slate-50 border-none rounded-lg p-3 text-[10px] font-bold shadow-inner" value={finishForm.servicio} onChange={e => setFinishForm({...finishForm, servicio: e.target.value.toUpperCase()})} /></div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-3"><Button variant="ghost" onClick={() => setIsFinishDialogOpen(false)} className="h-10 px-6 text-[9px] font-black uppercase">CANCELAR</Button><Button onClick={handleFinishConfirm} className="btn-institutional h-10 px-10 text-[9px] gap-2"><Save className="h-4 w-4" /> CONCLUIR</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
