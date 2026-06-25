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
  User, 
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
  ArrowRight,
  Wrench,
  X
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
    const progs = JSON.parse(localStorage.getItem('programs_full_v24') || '[]')
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
      "flex flex-1 w-full flex-col md:flex-row border border-white/40 overflow-hidden transition-all duration-700", 
      isPublic ? "rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.15)] bg-white/40 h-[calc(100vh-140px)]" : "bg-[#f8f5f0] h-full"
    )}>
      {/* Columna Izquierda (Usuario Final - Zero Scroll) */}
      {(!isPublic || showRemotePanel) && (
        <div className={cn(
          "w-full md:w-[340px] flex flex-col p-6 shrink-0 transition-all duration-500 relative z-20 overflow-hidden",
          isPublic ? "bg-white/70 backdrop-blur-3xl border-r border-white/40" : "bg-slate-50 border-r border-slate-200/60"
        )}>
          {isPublic ? (
            <div className="flex-1 flex flex-col gap-8 overflow-hidden">
               {/* Consola AnyDesk */}
               <div className="bg-white/80 rounded-[2.5rem] border border-white p-6 shadow-2xl space-y-4 relative overflow-hidden shrink-0 group">
                  <div className="absolute -top-4 -right-4 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                    <Monitor className="h-24 w-24 text-[#9f2241]" />
                  </div>
                  <div className="relative z-10 space-y-4">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Solicitud AnyDesk</Label>
                        <div className="bg-[#f8f5f0] p-5 rounded-2xl border border-[#ddc8a4]/30 shadow-inner">
                           <span className="text-[9px] font-black text-[#9f2241] uppercase block mb-1">ID DE CONEXIÓN</span>
                           <Input 
                             placeholder="000 000 000" 
                             className="h-10 text-center font-mono font-black border-none text-2xl bg-transparent focus:ring-0 shadow-none transition-all p-0 text-[#9f2241]" 
                             value={remoteId} 
                             onChange={(e) => setRemoteId(e.target.value)} 
                             disabled={isRemoteRequested} 
                           />
                        </div>
                     </div>
                     
                     {!isRemoteRequested ? (
                       <Button onClick={handleRequestRemote} disabled={!remoteId || remoteId.length < 5} className="w-full btn-institutional h-12 text-[10px] rounded-xl shadow-xl">
                         SOLICITAR SOPORTE
                       </Button>
                     ) : (
                       <Button onClick={() => setIsRemoteRequested(false)} variant="outline" className="w-full h-12 text-[9px] font-black uppercase border-primary/20 text-primary rounded-xl hover:bg-primary/5">
                         ENVIAR OTRO ID
                       </Button>
                     )}
                  </div>
               </div>

               {/* Protocolo de Atención - Compacto Lineal */}
               <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                  <div className="flex items-center gap-3 border-b border-[#ddc8a4]/30 pb-3 shrink-0">
                     <div className="h-8 w-8 rounded-xl bg-[#B38E5D]/10 flex items-center justify-center">
                        <ArrowRightCircle className="h-5 w-5 text-[#B38E5D]" />
                     </div>
                     <span className="text-[12px] font-black uppercase text-[#9f2241] tracking-widest">Protocolo de Atención</span>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between py-2 overflow-hidden">
                     {[
                        { 
                          n: "1", 
                          t: "Descargue software AnyDesk.", 
                          c: <Button variant="outline" size="sm" className="h-8 px-5 text-[9px] font-black border-[#9f2241]/20 text-[#9f2241] rounded-xl mt-2 hover:bg-[#9f2241] hover:text-white transition-all shadow-sm" onClick={() => window.open('https://anydesk.com', '_blank')}><Download className="h-4 w-4 mr-2" /> DESCARGAR AHORA</Button> 
                        },
                        { n: "2", t: "Localice su ID personal de 9 dígitos." },
                        { n: "3", t: "Péguelo arriba y solicite soporte remoto." },
                        { n: "4", t: "Espere unos minutos a que un analista le atienda." }
                     ].map((step, i) => (
                        <div key={i} className="flex gap-5 items-start animate-in fade-in duration-1000" style={{ animationDelay: `${i * 150}ms` }}>
                           <div className="flex flex-col items-center shrink-0">
                              <div className="h-7 w-7 rounded-full bg-[#B38E5D] text-white flex items-center justify-center text-[11px] font-black shadow-lg">
                                 {step.n}
                              </div>
                              {i < 3 && <div className="w-0.5 h-full bg-[#B38E5D]/20 my-1" />}
                           </div>
                           <div className="pt-0.5 flex-1 min-w-0">
                              <p className="text-[12px] font-bold text-slate-500 uppercase leading-tight tracking-tight">{step.t}</p>
                              {step.c}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">SISTEMA ATRES</p>
                  <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">MESA DE CONTROL</h3>
               </div>

               <div className="space-y-4 shrink-0">
                  <Label className="text-[11px] font-black uppercase text-slate-400 border-b pb-3 flex items-center justify-between w-full">
                    Cola de Atención <Badge className="bg-primary text-white text-[9px] px-3 rounded-full">{queue.length}</Badge>
                  </Label>
                  <ScrollArea className="h-48">
                    <div className="space-y-3 pr-4">
                      {queue.map(req => (
                        <button key={req.ticketNumber} onClick={() => setSelectedRequest(req)} className={cn("w-full p-4 rounded-[1.75rem] border text-left transition-all duration-300 flex items-center justify-between group", selectedRequest?.ticketNumber === req.ticketNumber ? "bg-primary border-primary shadow-2xl scale-[1.02]" : "bg-white border-slate-100 hover:bg-slate-50")}>
                          <div className="flex flex-col">
                            <span className={cn("text-[9px] font-black", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white/60" : "text-accent")}>{req.ticketNumber}</span>
                            <span className={cn("text-[12px] font-black", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white" : "text-slate-700")}>{req.requestType === 'chat' ? 'CONSULTA' : 'SOPORTE REMOTO'}</span>
                          </div>
                          <ChevronRight className={cn("h-5 w-5", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white" : "text-slate-300")} />
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
               </div>

               <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                  <Label className="text-[11px] font-black uppercase text-slate-400 border-b pb-3 flex items-center justify-between w-full">
                    Biblioteca de Soporte <Plus className="h-4 w-4 cursor-pointer hover:text-primary transition-colors" onClick={() => libraryInputRef.current?.click()} />
                  </Label>
                  <input type="file" ref={libraryInputRef} className="hidden" onChange={handleLibraryUpload} />
                  <ScrollArea className="flex-1">
                    <div className="space-y-3 pr-4">
                      {techLibrary.map(f => (
                        <div key={f.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-primary/20 transition-all">
                           <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                              {getFileIcon(f.type)}
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black text-slate-600 truncate uppercase">{f.name}</p>
                              <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity mt-1.5">
                                <button className="text-[9px] font-black text-primary uppercase hover:underline" onClick={() => sendLibraryFile(f)}>Enviar</button>
                                <button className="text-[9px] font-black text-rose-500 uppercase hover:underline" onClick={() => removeLibraryFile(f.id)}>Borrar</button>
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

      {/* Área de Chat Principal */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!isPublic && !selectedRequest ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6 bg-slate-50/50">
            <div className="h-28 w-28 rounded-[3rem] bg-white shadow-2xl flex items-center justify-center text-primary/10 border-4 border-white animate-pulse">
               <MessageSquare className="h-14 w-14" />
            </div>
            <div className="space-y-3">
              <h3 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">MESA OPERATIVA</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] max-w-xs mx-auto">Seleccione una solicitud para iniciar la sesión de ayuda.</p>
            </div>
          </div>
        ) : (
          <>
            <header className={cn(
              "px-10 py-6 flex justify-between items-center z-10 shrink-0 shadow-sm border-b",
              isPublic ? "bg-white/60 backdrop-blur-3xl border-white/40" : "bg-white/80 backdrop-blur-2xl border-slate-200/60"
            )}>
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 rounded-2xl bg-[#9f2241] text-white flex items-center justify-center shadow-2xl relative overflow-hidden group">
                  {/* Icono de Cabecera: Si soy público, veo al Técnico. Si soy técnico, veo al Docente. */}
                  {isPublic ? (
                    <UserCog className="h-8 w-8 relative z-10 group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <GraduationCap className="h-8 w-8 relative z-10 group-hover:scale-110 transition-transform duration-500" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase leading-none tracking-tight">
                    {isPublic ? "ASISTENTE COEES" : "ATENCIÓN AL DOCENTE"}
                  </h2>
                  <div className="flex items-center gap-3 mt-2.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">CANAL SEGURO EN LÍNEA</p>
                    {activeChatId && <Badge className="text-[9px] font-mono bg-[#B38E5D] text-white px-4 h-6 rounded-xl border-none">{activeChatId}</Badge>}
                  </div>
                </div>
              </div>
              {!isPublic && selectedRequest && (
                <Button onClick={() => setIsFinishDialogOpen(true)} className="bg-[#9f2241] hover:bg-[#801a34] text-white font-black text-[11px] uppercase h-12 px-10 rounded-2xl shadow-2xl transition-all active:scale-95 gap-3">
                  <CheckCircle2 className="h-5 w-5" /> FINALIZAR ATENCIÓN
                </Button>
              )}
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
                        {/* Iconos de Mensaje Diferenciados */}
                        <div className={cn(
                          "h-10 w-10 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-xl border-2 border-white", 
                          isUser ? "bg-[#B38E5D] text-white" : 
                          isTech ? "bg-[#9f2241] text-white" : 
                          "bg-slate-800 text-white"
                        )}>
                          {isUser ? <GraduationCap className="h-5 w-5" /> : 
                           isTech ? <UserCog className="h-5 w-5" /> : 
                           <Bot className="h-5 w-5" />}
                        </div>
                        <div className="space-y-1.5">
                          {msg.senderName && <span className={cn("text-[8px] font-black uppercase tracking-widest block", isMe ? "text-right text-[#B38E5D]" : "text-left text-slate-400")}>{msg.senderName}</span>}
                          <div className={cn(
                            "p-5 rounded-[2.25rem] text-[13px] font-semibold shadow-2xl border leading-relaxed relative", 
                            isMe ? (isUser ? "bg-[#B38E5D] text-white rounded-tr-none border-transparent" : "bg-[#9f2241] text-white rounded-tr-none border-transparent") : 
                            isBot ? "bg-slate-800 text-white rounded-tl-none border-transparent" : 
                            "bg-white text-slate-700 rounded-tl-none border-slate-100"
                          )}>
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
                {isTyping && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-white p-4 rounded-3xl rounded-tl-none shadow-xl flex items-center gap-4 border border-slate-100">
                       <div className="flex gap-1.5">
                         <div className="h-2 w-2 rounded-full bg-[#9f2241] animate-bounce [animation-delay:-0.3s]" />
                         <div className="h-2 w-2 rounded-full bg-[#9f2241] animate-bounce [animation-delay:-0.15s]" />
                         <div className="h-2 w-2 rounded-full bg-[#9f2241] animate-bounce" />
                       </div>
                       <span className="text-[9px] font-black uppercase text-slate-400">ANALISTA ESCRIBIENDO...</span>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <footer className="p-8 bg-white/40 backdrop-blur-3xl border-t border-white/40 shrink-0 relative z-10">
              <div className="max-w-4xl mx-auto flex gap-5">
                <div className="relative flex-1 group">
                  <Input 
                    placeholder={isPublic ? "DESCRIBA SU DUDA O FALLA TÉCNICA..." : "ESCRIBA LA RESPUESTA OFICIAL..."} 
                    className="h-16 rounded-[1.5rem] bg-white border-2 border-slate-100 px-8 pr-16 font-semibold shadow-inner focus:ring-4 focus:ring-[#9f2241]/5 focus:border-[#9f2241]/20 text-sm transition-all" 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()} 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="absolute right-6 top-4 h-8 w-8 text-slate-300 hover:text-primary transition-all flex items-center justify-center rounded-xl hover:bg-slate-50"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                </div>
                <button 
                  onClick={() => handleSendMessage()} 
                  disabled={!input.trim()} 
                  className="h-16 w-16 rounded-[1.5rem] bg-[#9f2241] hover:bg-[#801a34] text-white shadow-2xl shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center group"
                >
                  <Send className="h-7 w-7 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
            </footer>
          </>
        )}
      </div>

      {/* Registro Final del Analista */}
      <Dialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-[#f8f5f0]">
          <DialogHeader className="p-12 bg-[#9f2241] text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><CheckCircle2 className="h-56 w-56" /></div>
            <DialogTitle className="uppercase font-black text-white text-4xl flex items-center gap-6 relative z-10 leading-none">
              <ShieldCheck className="h-12 w-12 text-[#B38E5D]" /> CONCLUIR SERVICIO
            </DialogTitle>
            <DialogDescription className="text-white/60 font-bold text-[10px] uppercase tracking-[0.4em] mt-4 relative z-10">REGISTRO OFICIAL DE ATENCIÓN ATRES</DialogDescription>
          </DialogHeader>
          <div className="p-12 space-y-8 bg-white/80 backdrop-blur-2xl">
            <div className="space-y-4">
              <Label className="text-[12px] font-black uppercase text-primary tracking-widest pl-2 flex items-center gap-4">
                 <School className="h-5 w-5 text-accent" /> Plantel Atendido
              </Label>
              <Input 
                placeholder="BUSCAR POR CCT O NOMBRE..." 
                className="h-14 bg-slate-50 border-none rounded-2xl text-base font-black uppercase px-8 shadow-inner focus:bg-white transition-all" 
                value={finishSearchTerm} 
                onChange={e => setFinishSearchTerm(e.target.value)} 
              />
              {finishSearchTerm.length > 2 && (
                <div className="max-h-56 overflow-y-auto bg-white border border-slate-100 rounded-3xl shadow-2xl divide-y animate-in fade-in zoom-in-95 duration-200">
                  {schoolsDirectory.filter(s => s.cct.includes(finishSearchTerm.toUpperCase()) || s.nombre.includes(finishSearchTerm.toUpperCase())).slice(0, 5).map(s => (
                    <div key={`${s.cct}-${s.turno}`} className="p-5 hover:bg-primary/5 cursor-pointer flex justify-between items-center transition-colors group" onClick={() => { setFinishForm({...finishForm, cct: s.cct, schoolName: s.nombre, municipio: s.municipio, valle: s.valle}); setFinishSearchTerm('') }}>
                      <div className="flex flex-col">
                        <span className="text-sm font-black uppercase text-slate-800">{s.nombre}</span>
                        <span className="text-[10px] font-mono text-slate-400 mt-1">{s.cct} • {s.municipio}</span>
                      </div>
                      <Badge variant="secondary" className="bg-primary/5 text-primary text-[9px] font-black px-3 rounded-full">{s.modalidad}</Badge>
                    </div>
                  ))}
                </div>
              )}
              {finishForm.cct && (
                <div className="p-6 bg-emerald-50/50 border-2 border-emerald-100 rounded-[2rem] animate-in zoom-in-95 duration-500 flex items-center gap-5">
                   <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckCircle2 className="h-6 w-6" /></div>
                   <div>
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-none mb-1.5">PLANTEL SELECCIONADO:</p>
                      <h4 className="text-base font-black text-slate-800 uppercase leading-none">{finishForm.schoolName}</h4>
                   </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-10">
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase text-slate-400 pl-2">OFICINA REGIONAL</Label>
                <Select value={finishForm.oficinaRegionalAtencion} onValueChange={v => setFinishForm({...finishForm, oficinaRegionalAtencion: v})}>
                  <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl text-sm font-black uppercase shadow-inner"><SelectValue placeholder="SELECCIONAR..." /></SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {REGIONAL_OFFICES.map(off => <SelectItem key={off} value={off} className="text-xs font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase text-slate-400 pl-2">FOLIO DE ATENCIÓN</Label>
                <div className="h-14 bg-slate-100 rounded-2xl flex items-center px-8 font-mono font-black text-primary shadow-inner text-base">{selectedRequest?.ticketNumber}</div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[12px] font-black uppercase text-primary pl-2 flex items-center gap-4">
                <Sparkles className="h-5 w-5 text-accent" /> Resumen Técnico del Servicio
              </Label>
              <Textarea 
                placeholder="DETALLE LOS TRABAJOS REALIZADOS, HALLAZGOS Y ACUERDOS CON EL PLANTEL..." 
                className="h-40 bg-slate-50 border-none rounded-[2rem] p-8 text-sm font-semibold shadow-inner focus:bg-white transition-all" 
                value={finishForm.servicio} 
                onChange={e => setFinishForm({...finishForm, servicio: e.target.value.toUpperCase()})} 
              />
            </div>
          </div>
          <DialogFooter className="p-12 bg-slate-50 border-t flex justify-end gap-8 shrink-0">
            <Button variant="ghost" onClick={() => setIsFinishDialogOpen(false)} className="h-16 px-12 text-[12px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all">CANCELAR</Button>
            <Button onClick={handleFinishConfirm} className="btn-institutional h-16 px-20 text-[12px] gap-4 shadow-2xl">
              <Save className="h-6 w-6" /> CONCLUIR Y REGISTRAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
