
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
  Headset,
  Printer,
  Eye,
  FileBox,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { schoolsDirectory } from '@/lib/schools-directory'
import { format } from 'date-fns'
import { type BitacoraEntry } from '@/lib/planning-data'

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

const REGIONAL_OFFICES = [
  "Oficina de Tecnóloga Educativa Ecatepec",
  "Oficina de Tecnóloga Educativa Naucalpan",
  "Oficina de Tecnóloga Educativa Nezahualcóyotl",
  "Oficina de Tecnóloga Educativa Toluca",
  "Oficina de COEES Tultitlan"
];

const FILE_SIZE_LIMIT = 1.5 * 1024 * 1024; // 1.5MB to be safe with Base64

export function HelpDeskInterface({ isPublic = false }: { isPublic?: boolean }) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [remoteId, setRemoteId] = useState('') 
  const [activeTicketNumber, setActiveTicketNumber] = useState<string | null>(null)
  const [queue, setQueue] = useState<SupportRequest[]>([])
  const [formalRequests, setFormalRequests] = useState<BitacoraEntry[]>([])
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null)
  const [selectedFormal, setSelectedFormal] = useState<BitacoraEntry | null>(null)
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
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    const bitacora: BitacoraEntry[] = JSON.parse(localStorage.getItem('atres_bitacora') || '[]')
    setFormalRequests(bitacora.filter(b => b.status === 'pendiente' || b.status === 'proceso'))
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
      updateAttendedCount();
      syncFormalRequests();
    }
  }, [isPublic, generateTurnSessionId, updateAttendedCount, syncFormalRequests])

  useEffect(() => {
    setMounted(true)
    syncQueue()
    syncChat()
    if (!isPublic) {
      syncFormalRequests()
    }
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'atres_support_queue') syncQueue()
      if (e.key === 'atres_bitacora') syncFormalRequests()
      if (activeChatId && e.key === `atres_chat_${activeChatId}`) syncChat()
      if (e.key === 'programs_full_v24' && !isPublic) updateAttendedCount()
    };
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [syncQueue, syncChat, activeChatId, isPublic, updateAttendedCount, syncFormalRequests])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Helper to save with auto-cleanup of oldest entries if quota is exceeded
  const safeSaveBitacora = (entries: BitacoraEntry[]) => {
    try {
      localStorage.setItem('atres_bitacora', JSON.stringify(entries));
      return true;
    } catch (e) {
      if (e instanceof DOMException && (e.code === 22 || e.name === 'QuotaExceededError')) {
        if (entries.length > 5) {
          const reduced = [...entries];
          reduced.splice(-10); // Purge oldest 10 entries to make space
          return safeSaveBitacora(reduced);
        }
      }
      return false;
    }
  }

  const handleSendMessage = async (fileData?: { data: string, name: string, type: string }) => {
    if (!input.trim() && !fileData) return
    let updatedActiveChatId = activeChatId || sessionKey;

    if (isPublic) {
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
        localStorage.setItem('atres_support_queue', JSON.stringify([...currentQueue, newReq]));
        window.dispatchEvent(new StorageEvent('storage', { key: 'atres_support_queue', newValue: JSON.stringify([...currentQueue, newReq]), storageArea: localStorage }));
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
    const turn = generateTurnSessionId();
    const newReq: SupportRequest = { remoteId, ticketNumber: turn, timestamp: Date.now(), status: 'pending', requestType: 'remote', chatKey: sessionKey }
    const rawQueue = localStorage.getItem('atres_support_queue'); const currentQueue = JSON.parse(rawQueue || '[]');
    localStorage.setItem('atres_support_queue', JSON.stringify([...currentQueue, newReq]));
    window.dispatchEvent(new StorageEvent('storage', { key: 'atres_support_queue', newValue: JSON.stringify([...currentQueue, newReq]), storageArea: localStorage }))
    setActiveTicketNumber(turn);
    toast({ title: "Soporte Solicitado", description: `Su turno es el: ${turn}` });
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > FILE_SIZE_LIMIT) {
      toast({ variant: "destructive", title: "Archivo demasiado grande", description: "El límite es de 1.5MB para proteger el sistema." });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => handleSendMessage({ data: ev.target?.result as string, name: file.name, type: file.type })
    reader.readAsDataURL(file); e.target.value = '';
  }

  const handleTrackFolio = () => {
    if (!trackFolioInput) return;
    const progs = JSON.parse(localStorage.getItem('programs_full_v24') || '[]');
    const liveQueue = JSON.parse(localStorage.getItem('atres_support_queue') || '[]');
    const bitacoraStored = JSON.parse(localStorage.getItem('atres_bitacora') || '[]');
    
    const concluded = progs.find((p: any) => p.id === trackFolioInput.toUpperCase());
    if (concluded) { setTrackedTicket({ ...concluded, displayStatus: 'Atendida' }); return; }

    const inBitacora = bitacoraStored.find((b: any) => b.folio === trackFolioInput.toUpperCase());
    if (inBitacora) { setTrackedTicket({ ...inBitacora, id: inBitacora.folio, displayStatus: inBitacora.status === 'atendido' ? 'Atendida' : (inBitacora.status === 'proceso' ? 'En Proceso' : 'Pendiente') }); return; }
    
    const inQueue = liveQueue.find((r: any) => r.ticketNumber === trackFolioInput.toUpperCase());
    if (inQueue) { setTrackedTicket({ ...inQueue, displayStatus: inQueue.status === 'attending' ? 'En Proceso' : 'Recibida' }); return; }
    
    toast({ variant: "destructive", title: "Folio no encontrado" });
    setTrackedTicket(null);
  }

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSendNewTicketRequest = async () => {
    if (!requesterName || !requesterEmail || !helpTopic || !ticketCct || !ticketDetail) {
      toast({ variant: "destructive", title: "Datos Incompletos", description: "Todos los campos son obligatorios." });
      return;
    }
    
    try {
      const folio = generateSequentialFolio();
      let pdfContent, excelContent;
      
      if (pdfFile) {
        if (pdfFile.size > FILE_SIZE_LIMIT) throw new Error("PDF demasiado grande. Límite: 1.5MB.");
        pdfContent = await readFileAsDataURL(pdfFile);
      }
      if (excelFile) {
        if (excelFile.size > FILE_SIZE_LIMIT) throw new Error("Excel demasiado grande. Límite: 1.5MB.");
        excelContent = await readFileAsDataURL(excelFile);
      }
      
      const school = schoolsDirectory.find(s => s.cct === ticketCct.toUpperCase());
      const bitacoraEntry: BitacoraEntry = {
        id: `BIT-${Date.now()}`,
        folio: folio,
        cct: ticketCct.toUpperCase(),
        schoolName: school?.nombre || "CCT NO IDENTIFICADO",
        servicio: `${helpTopic.toUpperCase()}: ${ticketDetail}`,
        oficina: "MESA DE AYUDA",
        fecha: format(new Date(), 'dd/MM/yyyy HH:mm'),
        tecnico: "POR ASIGNAR",
        tipo: 'FORMAL',
        status: 'pendiente',
        pdfData: pdfContent,
        pdfName: pdfFile?.name,
        excelData: excelContent,
        excelName: excelFile?.name,
        requesterName: requesterName,
        requesterEmail: requesterEmail,
        helpTopic: helpTopic,
        ticketDetail: ticketDetail
      };

      const currentBitacora: BitacoraEntry[] = JSON.parse(localStorage.getItem('atres_bitacora') || '[]');
      const saved = safeSaveBitacora([bitacoraEntry, ...currentBitacora]);

      if (!saved) throw new Error("Error de almacenamiento local persistente.");

      window.dispatchEvent(new StorageEvent('storage', { key: 'atres_bitacora', newValue: localStorage.getItem('atres_bitacora'), storageArea: localStorage }));

      setLastGeneratedFolio(folio);
      setIsConfirmationOpen(true);
      setIsNewTicketDialogOpen(false);
      setPdfFile(null); setExcelFile(null);
      setRequesterName(''); setRequesterEmail(''); setHelpTopic(''); setTicketCct(''); setTicketDetail('');
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error al enviar", description: e.message });
    }
  }

  const handleFinishConfirm = () => {
    if (!finishForm.cct || !finishForm.servicio || !finishForm.oficinaRegionalAtencion) { toast({ variant: "destructive", title: "Faltan datos obligatorios" }); return; }
    const folio = selectedRequest?.ticketNumber || selectedFormal?.folio;
    if (!folio) return;

    const currentBitacora: BitacoraEntry[] = JSON.parse(localStorage.getItem('atres_bitacora') || '[]');
    const updatedBitacora = currentBitacora.map(b => b.folio === folio ? {
      ...b,
      status: 'atendido' as const,
      servicio: finishForm.servicio,
      tecnico: techName || 'Analista COEES',
      oficina: finishForm.oficinaRegionalAtencion,
      schoolName: finishForm.schoolName
    } : b);
    safeSaveBitacora(updatedBitacora);

    const progs = JSON.parse(localStorage.getItem('programs_full_v24') || '[]')
    const newRec = { 
      id: folio, name: 'ATRES', cct: finishForm.cct, schoolName: finishForm.schoolName, municipio: finishForm.municipio, valle: finishForm.valle, 
      status: 'concluido', date: format(new Date(), 'yyyy-MM-dd'), progress: 100, observaciones: finishForm.servicio, tecnicos: techName, oficinaRegionalAtencion: finishForm.oficinaRegionalAtencion 
    }
    localStorage.setItem('programs_full_v24', JSON.stringify([newRec, ...progs]))

    if (selectedRequest) {
      const rawQueue = localStorage.getItem('atres_support_queue')
      const updatedQueue = JSON.parse(rawQueue || '[]').filter((r: any) => r.ticketNumber !== folio);
      localStorage.setItem('atres_support_queue', JSON.stringify(updatedQueue))
    }

    window.dispatchEvent(new StorageEvent('storage', { key: 'programs_full_v24', newValue: JSON.stringify([newRec, ...progs]), storageArea: localStorage }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'atres_bitacora', newValue: JSON.stringify(updatedBitacora), storageArea: localStorage }));
    
    setIsFinishDialogOpen(false); setSelectedRequest(null); setSelectedFormal(null); syncQueue(); syncFormalRequests(); updateAttendedCount();
    toast({ title: "Atención Registrada en ATRES" });
  }

  const getFileIcon = (type: string) => {
    if (type.includes('word')) return <FileText className="h-4 w-4 text-blue-500" />
    if (type.includes('excel')) return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-rose-500" />
    return <FileCode className="h-4 w-4 text-slate-400" />
  }

  const downloadFile = (data: string, name: string) => { const link = document.createElement('a'); link.href = data; link.download = name; link.click(); }
  const printFile = (data: string) => { const win = window.open(); if (!win) return; win.document.write(`<iframe src="${data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`); }

  const showLeftColumn = !isPublic || (isPublic && isRemoteHelpRequested);

  if (!mounted) return null

  return (
    <div className={cn(
      "flex flex-1 w-full flex-col md:flex-row border border-white/40 overflow-hidden transition-all duration-700", 
      isPublic ? "rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.15)] bg-white/40 h-[calc(100vh-140px)]" : "bg-[#f8f5f0] h-full"
    )}>
      {showLeftColumn && (
        <div className="w-full md:w-[300px] flex flex-col p-4 shrink-0 transition-all duration-500 relative z-20 overflow-hidden bg-slate-50 border-r border-slate-200/60 animate-in slide-in-from-left duration-500">
           {isPublic ? (
             <div className="flex-1 flex flex-col gap-4">
                <div className="space-y-4">
                  <div className="bg-[#9f2241] p-5 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Monitor className="h-16 w-16" /></div>
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Soporte Remoto</Label>
                    <h3 className="text-base font-black uppercase mt-1 leading-none">AnyDesk / TeamViewer</h3>
                    <div className="mt-4 space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-white/60 pl-1">ID de Conexión</Label>
                        <Input placeholder="000 000 000" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 font-mono text-center text-lg h-10 rounded-xl shadow-inner" value={remoteId} onChange={e => setRemoteId(e.target.value.replace(/\D/g,''))} maxLength={9} />
                      </div>
                      <Button onClick={handleRequestRemoteSupport} className="w-full bg-white text-[#9f2241] hover:bg-[#f8f8f8] font-black uppercase text-[10px] tracking-widest h-11 rounded-xl shadow-xl active:scale-95 transition-all">Solicitar Soporte</Button>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[2rem] border border-slate-200 shadow-xl space-y-3">
                    <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><ArrowRightCircle className="h-3.5 w-3.5 text-[#B38E5D]" /> Apoyo Remoto</p>
                    <div className="space-y-2">
                      {[
                        { step: "1", text: "Descargue software AnyDesk." },
                        { step: "2", text: "Localice su ID personal." },
                        { step: "3", text: "Péguelo arriba y solicite soporte." },
                        { step: "4", text: "Espere conexión del analista." }
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-3 items-start group">
                          <div className="h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-[#9f2241] shrink-0 shadow-sm group-hover:bg-[#9f2241] group-hover:text-white transition-colors">{item.step}</div>
                          <p className="text-[9px] font-semibold text-slate-600 leading-tight uppercase pt-0.5">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => setIsRemoteHelpRequested(false)} className="mt-auto text-[9px] font-black uppercase text-slate-400 gap-2"><X className="h-3 w-3" /> Ocultar Panel</Button>
             </div>
           ) : (
             <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="bg-primary p-3 rounded-[1.5rem] text-white shadow-xl relative overflow-hidden shrink-0">
                  <div className="absolute -right-2 -top-2 opacity-10 rotate-12"><Activity className="h-12 w-12" /></div>
                  <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Atendidos Hoy</p>
                  <div className="flex items-end gap-2 mt-1">
                      <span className="text-3xl font-black leading-none">{attendedTodayCount}</span>
                      <Target className="h-3.5 w-3.5 mb-1 text-accent" />
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
                   <div className="space-y-2 flex flex-col h-[50%] overflow-hidden">
                     <Label className="text-[10px] font-black uppercase text-primary border-b-2 border-primary/10 pb-1 flex items-center justify-between w-full shrink-0">
                       Solicitudes de Servicio 
                       <Badge className="bg-primary text-white text-[9px] px-2 h-4 rounded-full">{formalRequests.length}</Badge>
                     </Label>
                     <ScrollArea className="flex-1">
                       <div className="space-y-1.5 pr-2 pb-4">
                         {formalRequests.map(req => (
                           <button key={req.id} onClick={() => { setSelectedFormal(req); setSelectedRequest(null); }} className={cn("w-full p-2.5 rounded-xl border text-left transition-all duration-300 flex items-center justify-between group", selectedFormal?.id === req.id ? "bg-primary border-primary shadow-lg" : "bg-white border-slate-100 hover:bg-slate-50 shadow-sm")}>
                             <div className="flex flex-col">
                               <span className={cn("text-[8px] font-black", selectedFormal?.id === req.id ? "text-white/60" : "text-primary")}>{req.folio}</span>
                               <span className={cn("text-[10px] font-black truncate max-w-[130px]", selectedFormal?.id === req.id ? "text-white" : "text-slate-700")}>{req.schoolName}</span>
                             </div>
                             <FilePlus className={cn("h-4 w-4", selectedFormal?.id === req.id ? "text-white" : "text-slate-300")} />
                           </button>
                         ))}
                       </div>
                     </ScrollArea>
                   </div>

                   <div className="space-y-2 flex flex-col h-[50%] overflow-hidden">
                     <Label className="text-[10px] font-black uppercase text-accent border-b-2 border-primary/10 pb-1 flex items-center justify-between w-full shrink-0">
                       Mesa Operativa (Live) 
                       <Badge className="bg-accent text-white text-[9px] px-2 h-4 rounded-full">{queue.length}</Badge>
                     </Label>
                     <ScrollArea className="flex-1">
                       <div className="space-y-1.5 pr-2 pb-4">
                         {queue.map(req => (
                           <button key={req.ticketNumber} onClick={() => { setSelectedRequest(req); setSelectedFormal(null); }} className={cn("w-full p-2.5 rounded-xl border text-left transition-all duration-300 flex items-center justify-between group", selectedRequest?.ticketNumber === req.ticketNumber ? "bg-accent border-accent shadow-lg" : "bg-white border-slate-100 hover:bg-slate-50 shadow-sm")}>
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
           )}
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!isPublic && !selectedRequest && !selectedFormal ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6 bg-slate-50/50">
            <div className="h-24 w-24 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center text-primary/10 border-4 border-white animate-pulse"><MessageSquare className="h-12 w-12" /></div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">CENTRO OPERATIVO</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] max-w-xs mx-auto">Seleccione una Solicitud o un Turno para iniciar.</p>
            </div>
          </div>
        ) : !isPublic && selectedFormal ? (
          <div className="flex-1 flex flex-col p-4 md:p-6 bg-[#fdfaf5] animate-in fade-in duration-700 overflow-hidden">
             <ScrollArea className="flex-1">
               <div className="max-w-5xl mx-auto w-full space-y-6 pb-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-primary pb-3 gap-4">
                     <div className="space-y-1">
                        <div className="flex items-center gap-3">
                           <div className="bg-primary text-white font-mono text-lg px-3 py-1 rounded-xl shadow-lg border-2 border-white/20">{selectedFormal.folio}</div>
                           <Badge variant="outline" className="border-accent text-accent font-black uppercase text-[8px] px-3 h-5 tracking-widest bg-white shadow-sm">SOLICITUD FORMAL</Badge>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">{selectedFormal.schoolName}</h2>
                        <div className="flex items-center gap-2">
                           <Clock className="h-3 w-3 text-slate-400" />
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">RECIBIDO: {selectedFormal.fecha}</span>
                        </div>
                     </div>
                     <Button onClick={() => {
                        setFinishForm({
                           ...finishForm,
                           cct: selectedFormal.cct,
                           schoolName: selectedFormal.schoolName,
                           municipio: schoolsDirectory.find(s => s.cct === selectedFormal.cct)?.municipio || "",
                           valle: schoolsDirectory.find(s => s.cct === selectedFormal.cct)?.valle || ""
                        });
                        setIsFinishDialogOpen(true);
                     }} className="btn-institutional h-10 px-8 text-[10px] gap-2 shadow-xl hover:scale-105 transition-all">
                        <CheckCircle2 className="h-4 w-4" /> REGISTRAR ATENCIÓN FINAL
                     </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     <div className="lg:col-span-2 space-y-6">
                        {/* Datos del Solicitante */}
                        <div className="bg-white p-5 rounded-[2rem] shadow-xl border border-slate-100 space-y-4">
                           <Label className="text-[10px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-3 border-b pb-2">
                             <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><User className="h-4 w-4" /></div>
                             Información del Solicitante
                           </Label>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Servidor Público:</p>
                                 <p className="text-xs font-black text-slate-700 uppercase">{selectedFormal.requesterName || 'SIN REGISTRO'}</p>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Correo Institucional:</p>
                                 <p className="text-xs font-bold text-primary lowercase">{selectedFormal.requesterEmail || 'SIN REGISTRO'}</p>
                              </div>
                           </div>
                        </div>

                        {/* Detalle del Problema */}
                        <div className="bg-white p-5 rounded-[2rem] shadow-xl border border-slate-100 space-y-4">
                           <Label className="text-[10px] font-black uppercase text-accent tracking-[0.2em] flex items-center gap-3 border-b pb-2">
                             <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent shadow-sm"><MessageSquare className="h-4 w-4" /></div>
                             Detalle Técnico de la Solicitud
                           </Label>
                           <div className="space-y-4">
                              <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                 <Tag className="h-3 w-3 text-accent" />
                                 <span className="text-[10px] font-black text-slate-500 uppercase">TEMA: {selectedFormal.helpTopic || 'GENERAL'}</span>
                              </div>
                              <div className="p-4 bg-slate-50/50 rounded-[1.5rem] border-2 border-dashed border-slate-200">
                                 <p className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedFormal.ticketDetail || selectedFormal.servicio}</p>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        {/* Resumen Plantel */}
                        <div className="bg-primary p-5 rounded-[2rem] shadow-xl border-4 border-white flex flex-col gap-2 relative overflow-hidden group">
                           <div className="absolute -top-4 -right-4 opacity-10 group-hover:rotate-12 transition-transform duration-700"><School className="h-24 w-24" /></div>
                           <div>
                              <p className="text-[8px] font-black uppercase text-white/60 tracking-[0.2em] leading-none mb-1">CCT Identificado</p>
                              <h4 className="text-2xl font-black text-white font-mono tracking-tighter drop-shadow-lg">{selectedFormal.cct}</h4>
                           </div>
                           <p className="text-[10px] font-bold text-white/80 uppercase leading-tight line-clamp-2">{selectedFormal.schoolName}</p>
                        </div>

                        {/* Expediente Digital */}
                        <div className="bg-white p-5 rounded-[2rem] shadow-xl border border-primary/5 space-y-4">
                           <Label className="text-[10px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-3 border-b pb-2">
                             <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><FileBox className="h-4 w-4" /></div>
                             Expediente Digital
                           </Label>
                           
                           <div className="space-y-3">
                              {selectedFormal.pdfData ? (
                                <div className="p-3 bg-rose-50 rounded-[1.5rem] border-2 border-rose-200 flex flex-col gap-3 group transition-all hover:bg-rose-100 shadow-md">
                                   <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-lg text-rose-600 border border-rose-50"><FileText className="h-6 w-6" /></div>
                                      <div className="flex-1 min-w-0">
                                         <p className="text-[10px] font-black text-slate-800 uppercase truncate">Reporte Técnico</p>
                                         <p className="text-[8px] font-bold text-rose-400 uppercase">Documento PDF</p>
                                      </div>
                                   </div>
                                   <div className="flex flex-col gap-2">
                                      <Button onClick={() => setPdfToPreview(selectedFormal.pdfData!)} className="w-full h-9 rounded-xl text-[9px] font-black uppercase bg-primary text-white hover:bg-primary/95 transition-all gap-2 shadow-xl border border-white/20"><Eye className="h-4 w-4" /> VISTA PREVIA</Button>
                                      <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" onClick={() => downloadFile(selectedFormal.pdfData!, selectedFormal.pdfName || 'solicitud.pdf')} className="h-9 rounded-xl text-[8px] font-black uppercase border-rose-200 text-rose-600 bg-white hover:bg-rose-600 hover:text-white transition-all shadow-md"><Download className="h-4 w-4" /></Button>
                                        <Button variant="outline" onClick={() => printFile(selectedFormal.pdfData!)} className="h-9 rounded-xl text-[8px] font-black uppercase border-rose-200 text-rose-600 bg-white hover:bg-rose-600 hover:text-white transition-all shadow-md"><Printer className="h-4 w-4" /></Button>
                                      </div>
                                   </div>
                                </div>
                              ) : (
                                <div className="p-6 bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200 text-center opacity-40 flex flex-col items-center gap-2">
                                  <FileText className="h-6 w-6 text-slate-300" />
                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">SIN PDF ANEXO</p>
                                </div>
                              )}

                              {selectedFormal.excelData ? (
                                <div className="p-3 bg-emerald-50 rounded-[1.5rem] border-2 border-emerald-200 flex flex-col gap-3 group transition-all hover:bg-emerald-100 shadow-md">
                                   <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-lg text-emerald-600 border border-emerald-50"><FileSpreadsheet className="h-6 w-6" /></div>
                                      <div className="flex-1 min-w-0">
                                         <p className="text-[10px] font-black text-slate-800 uppercase truncate">Base de Datos</p>
                                         <p className="text-[8px] font-bold text-emerald-400 uppercase">Anexo Excel</p>
                                      </div>
                                   </div>
                                   <Button variant="outline" size="sm" onClick={() => downloadFile(selectedFormal.excelData!, selectedFormal.excelName || 'base.xlsx')} className="w-full h-10 rounded-xl text-[9px] font-black uppercase border-emerald-200 text-emerald-600 bg-white hover:bg-emerald-600 hover:text-white transition-all gap-2 shadow-md"><Download className="h-4 w-4" /> DESCARGAR BASE</Button>
                                </div>
                              ) : (
                                <div className="p-6 bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200 text-center opacity-40 flex flex-col items-center gap-2">
                                  <FileSpreadsheet className="h-6 w-6 text-slate-300" />
                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">SIN EXCEL ANEXO</p>
                                </div>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
             </ScrollArea>
          </div>
        ) : (
          <>
            <header className={cn("px-6 py-3 flex justify-between items-center z-10 shrink-0 shadow-sm border-b", isPublic ? "bg-white/60 backdrop-blur-3xl border-white/40" : "bg-white/80 backdrop-blur-2xl border-slate-200/60")}>
              <div className="flex items-center gap-4">
                <div className="xs:flex h-12 w-12 rounded-xl bg-[#9f2241] text-white items-center justify-center shadow-2xl relative overflow-hidden group">
                  {isPublic ? <Bot className="h-6 w-6 relative z-10 group-hover:scale-110 transition-transform duration-500" /> : <UserCog className="h-6 w-6 relative z-10 group-hover:scale-110 transition-transform duration-500" />}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base md:text-lg font-black text-slate-800 uppercase leading-none tracking-tight truncate">{isPublic ? "ASISTENTE COEES" : "MESA OPERATIVA LIVE"}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-1.5 shrink-0">
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <p className="text-[7px] md:text-[8px] font-black text-emerald-600 uppercase tracking-widest">CANAL SEGURO</p>
                    </div>
                    {activeChatId && <Badge className="text-[7px] md:text-[8px] font-mono bg-[#B38E5D] text-white px-2 h-4 rounded-lg border-none">{activeChatId}</Badge>}
                    {isPublic && (
                      <div className="flex gap-2 items-center ml-1">
                         <button onClick={() => setIsNewTicketDialogOpen(true)} className="flex items-center gap-2 bg-white hover:bg-primary px-3 h-8 rounded-lg shadow-lg border border-primary/20 transition-all group">
                           <div className="h-5 w-5 rounded bg-primary/10 group-hover:bg-white/20 flex items-center justify-center text-primary group-hover:text-white transition-colors"><FilePlus className="h-3.5 w-3.5" /></div>
                           <div className="flex flex-col text-left"><span className="text-[8px] font-black text-primary group-hover:text-white uppercase leading-none">Solicitud de Servicio</span></div>
                         </button>
                         <button onClick={() => setIsTrackTicketDialogOpen(true)} className="h-8 w-8 rounded-lg bg-white shadow-lg border border-accent/20 flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-all" title="Seguimiento de Folio"><Search className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {!isPublic && selectedRequest && <Button onClick={() => setIsFinishDialogOpen(true)} size="sm" className="bg-[#9f2241] hover:bg-[#801a34] text-white font-black text-[9px] uppercase h-9 px-6 rounded-xl shadow-2xl transition-all active:scale-95 gap-2"><CheckCircle2 className="h-3.5 w-3.5" /> FINALIZAR</Button>}
            </header>
            <ScrollArea className="flex-1 px-6 py-8">
              <div className="max-w-4xl mx-auto space-y-6 min-h-full flex flex-col justify-end pb-8">
                {messages.map((msg, i) => {
                  const isMe = (isPublic && msg.role === 'user') || (!isPublic && msg.role === 'tech');
                  return (
                    <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-500", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn("flex gap-3 max-w-[85%]", isMe ? "flex-row-reverse" : "flex-row")}>
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-lg border border-white", msg.role === 'user' ? "bg-[#B38E5D] text-white" : msg.role === 'tech' ? "bg-[#9f2241] text-white" : "bg-slate-800 text-white")}>
                          {msg.role === 'user' ? <GraduationCap className="h-4 w-4" /> : msg.role === 'tech' ? <UserCog className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className="space-y-1">
                          {msg.senderName && <span className={cn("text-[7px] font-black uppercase tracking-widest block", isMe ? "text-right text-[#B38E5D]" : "text-left text-slate-400")}>{msg.senderName}</span>}
                          <div className={cn("p-3.5 rounded-2xl text-xs font-semibold shadow-xl border leading-relaxed relative", isMe ? (msg.role === 'user' ? "bg-[#B38E5D] text-white rounded-tr-none border-transparent" : "bg-[#9f2241] text-white rounded-tr-none border-transparent") : msg.role === 'bot' ? "bg-slate-800 text-white rounded-tl-none border-transparent" : "bg-white text-slate-700 rounded-tl-none border-slate-100")}>
                            {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                            {msg.fileData && (
                              <div className={cn("mt-3 p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all hover:brightness-95", isMe ? "bg-white/15 border-white/20" : "bg-slate-50 border-slate-100")} onClick={() => downloadFile(msg.fileData!, msg.fileName!)}>
                                <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center shadow-lg">{getFileIcon(msg.fileType || '')}</div>
                                <div className="flex-1 min-w-0"><p className={cn("text-[9px] font-black truncate uppercase", isMe ? "text-white" : "text-slate-800")}>{msg.fileName}</p></div>
                                <Download className={cn("h-3.5 w-3.5", isMe ? "text-white/60" : "text-slate-300")} />
                              </div>
                            )}
                            <div className={cn("text-[7px] mt-2 font-black uppercase flex items-center gap-1.5", isMe ? "justify-end" : "justify-start")}>
                              <Clock className="h-2.5 w-2.5" /> {mounted ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
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
            <footer className="p-4 md:p-6 bg-white/40 backdrop-blur-3xl border-t border-white/40 shrink-0 relative z-10">
              <div className="max-w-4xl mx-auto flex gap-4">
                <div className="relative flex-1 group">
                  <Input placeholder={isPublic ? "DESCRIBA SU DUDA O FALLA TÉCNICA..." : "ESCRIBA LA RESPUESTA OFICIAL..."} className="h-12 rounded-xl bg-white border-2 border-slate-100 px-6 pr-12 font-semibold shadow-inner focus:ring-4 focus:ring-[#9f2241]/5 focus:border-[#9f2241]/20 text-xs transition-all" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
                  <button onClick={() => fileInputRef.current?.click()} className="absolute right-4 top-2.5 h-7 w-7 text-slate-300 hover:text-primary transition-all flex items-center justify-center rounded-lg hover:bg-slate-50"><Paperclip className="h-4 w-4" /></button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                </div>
                <button onClick={() => handleSendMessage()} disabled={!input.trim()} className="h-12 w-12 rounded-xl bg-[#9f2241] hover:bg-[#801a34] text-white shadow-2xl shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center group"><Send className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></button>
              </div>
            </footer>
          </>
        )}
      </div>

      {/* DIÁLOGOS DE SOLICITUD Y SEGUIMIENTO */}
      <Dialog open={isNewTicketDialogOpen} onOpenChange={setIsNewTicketDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
          <DialogHeader className="p-6 bg-[#9f2241] text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><FilePlus className="h-16 w-16" /></div>
            <DialogTitle className="uppercase font-black text-lg flex items-center gap-3 relative z-10 leading-none">SOLICITUD DE SERVICIO</DialogTitle>
            <DialogDescription className="text-white/60 font-bold text-[9px] uppercase tracking-widest mt-2 relative z-10">Complete el formulario técnico oficial.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
             <div className="max-w-[420px] mx-auto space-y-5">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-accent border-b pb-1">Información del Solicitante</h4>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Nombre Completo</Label>
                    <Input placeholder="PATERNO MATERNO NOMBRES..." className="h-10 bg-slate-50 border-none rounded-xl text-xs font-black uppercase shadow-inner" value={requesterName} onChange={e => setRequesterName(e.target.value.toUpperCase())} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Correo Institucional</Label>
                      <Input placeholder="ejemplo@desysa.edu.mx" className="h-10 bg-slate-50 border-none rounded-xl text-[10px] font-bold shadow-inner" value={requesterEmail} onChange={e => setRequesterEmail(e.target.value.toLowerCase())} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Tema de Ayuda</Label>
                      <Select value={helpTopic} onValueChange={val => setHelpTopic(val)} >
                        <SelectTrigger className="h-10 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase shadow-inner"><SelectValue placeholder="ELEGIR..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cuenta" className="text-[10px] font-bold uppercase">Cuenta institucional</SelectItem>
                          <SelectItem value="transmision" className="text-[10px] font-bold uppercase">Transmisión</SelectItem>
                          <SelectItem value="soporte" className="text-[10px] font-bold uppercase">Soporte Técnico</SelectItem>
                          <SelectItem value="capacitacion" className="text-[10px] font-bold uppercase">Capacitación</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-accent border-b pb-1">Datos del Servicio Técnico</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-slate-400 pl-1">CCT del Plantel</Label><Input placeholder="15DES0000X" className="h-10 bg-slate-50 border-none rounded-xl text-xs font-mono font-black uppercase" value={ticketCct} onChange={e => setTicketCct(e.target.value.toUpperCase())} maxLength={10} /></div>
                    <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Detalle Breve</Label><Input placeholder="DESCRIBA LA NECESIDAD..." className="h-10 bg-slate-50 border-none rounded-xl text-xs font-semibold" value={ticketDetail} onChange={e => setTicketDetail(e.target.value.toUpperCase())} /></div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 mt-2">
                    <div className={cn("flex items-center gap-3 bg-slate-50 rounded-xl p-3 border-2 border-dashed h-12 relative transition-all", pdfFile ? "border-rose-400 bg-rose-50" : "border-slate-200")}>
                        <FileText className={cn("h-4 w-4", pdfFile ? "text-rose-600" : "text-rose-400")} />
                        <div className="flex-1 min-w-0"><span className={cn("text-[8px] font-black uppercase truncate block", pdfFile && "text-rose-700")}>{pdfFile ? pdfFile.name : "1. Subir Solicitud PDF (Máx 1.5MB)"}</span></div>
                        <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setPdfFile(e.target.files?.[0] || null)} title="Subir PDF" />
                    </div>
                    <div className={cn("flex items-center gap-3 bg-slate-50 rounded-xl p-3 border-2 border-dashed h-12 relative transition-all", excelFile ? "border-emerald-400 bg-emerald-50" : "border-slate-200")}>
                        <FileSpreadsheet className={cn("h-4 w-4", excelFile ? "text-emerald-600" : "text-emerald-400")} />
                        <div className="flex-1 min-w-0"><span className={cn("text-[8px] font-black uppercase truncate block", excelFile && "text-emerald-700")}>{excelFile ? excelFile.name : "2. Subir Base Excel (Máx 1.5MB)"}</span></div>
                        <input type="file" accept=".xlsx, .xls" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setExcelFile(e.target.files?.[0] || null)} title="Subir Excel" />
                    </div>
                  </div>
                </div>
             </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-3 shrink-0"><Button variant="ghost" onClick={() => setIsNewTicketDialogOpen(false)} className="h-11 px-6 text-[10px] font-black uppercase">CANCELAR</Button><Button onClick={handleSendNewTicketRequest} className="btn-institutional h-11 px-10 text-[10px]">ENVIAR SOLICITUD</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-[2rem] border-none shadow-2xl p-8 overflow-hidden bg-white text-center">
            <DialogHeader className="flex flex-col items-center">
              <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto mb-4" />
              <DialogTitle className="text-lg font-black text-slate-800 uppercase tracking-tight">Solicitud Registrada</DialogTitle>
              <DialogDescription className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mt-1 mb-6">
                  Su solicitud ha sido recibida correctamente en la Bitácora de Solicitudes.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-slate-50 p-5 rounded-[1.5rem] border-2 border-primary/10 shadow-inner mb-6">
               <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mb-1">FOLIO DE SEGUIMIENTO</p>
               <h4 className="text-2xl font-black text-slate-800 font-mono tracking-tighter">{lastGeneratedFolio}</h4>
            </div>
            <Button onClick={() => setIsConfirmationOpen(false)} className="w-full btn-institutional h-12 rounded-xl shadow-xl">ENTENDIDO</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isTrackTicketDialogOpen} onOpenChange={setIsTrackTicketDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[1.5rem] border-none shadow-2xl p-6 overflow-hidden bg-white">
          <DialogHeader>
            <DialogTitle className="uppercase font-black text-sm flex items-center gap-2"><Search className="h-4 w-4" /> SEGUIMIENTO COEES</DialogTitle>
            <DialogDescription className="text-[9px] font-bold uppercase text-slate-400">Verifique el estatus de su folio institucional.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
             <div className="flex gap-2">
                <Input placeholder="COEES-00001" className="h-10 bg-slate-50 border-none rounded-lg text-xs font-mono font-black uppercase flex-1 shadow-inner" value={trackFolioInput} onChange={e => setTrackFolioInput(e.target.value.toUpperCase())} />
                <Button onClick={handleTrackFolio} className="h-10 w-10 p-0 rounded-lg bg-primary text-white"><Search className="h-4 w-4" /></Button>
             </div>
             {trackedTicket && (
               <div className="p-4 bg-slate-50 rounded-2xl border-2 border-accent/20 animate-in zoom-in-95">
                  <div className="flex justify-between items-start border-b pb-2 mb-3">
                     <div><p className="text-[8px] font-black text-slate-400 uppercase">FOLIO:</p><h4 className="text-lg font-black text-primary leading-none">{trackedTicket.id || trackedTicket.ticketNumber || trackedTicket.folio}</h4></div>
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
        <DialogContent className="sm:max-w-[400px] rounded-[1.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
          <DialogHeader className="p-4 bg-primary text-white shrink-0">
            <DialogTitle className="uppercase font-black text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#B38E5D]" /> CONCLUIR SERVICIO</DialogTitle>
            <DialogDescription className="text-white/60 text-[8px] font-bold uppercase tracking-widest mt-1">Registre el cierre oficial de la atención técnica.</DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-primary tracking-widest pl-1">Plantel Atendido</Label>
              <div className="relative">
                 <Input placeholder="CCT O NOMBRE..." className="h-8 bg-slate-50 border-none rounded-lg text-[10px] font-black uppercase px-4 shadow-inner" value={finishSearchTerm} onChange={e => setFinishSearchTerm(e.target.value)} />
                 {finishSearchTerm.length > 2 && (
                  <div className="absolute left-0 right-0 top-9 max-h-32 overflow-y-auto bg-white border border-slate-100 rounded-lg shadow-xl divide-y z-50">
                    {schoolsDirectory.filter(s => s.cct.includes(finishSearchTerm.toUpperCase()) || s.nombre.includes(finishSearchTerm.toUpperCase())).slice(0, 5).map(s => (
                      <div key={`${s.cct}-${s.turno}`} className="p-2 hover:bg-primary/5 cursor-pointer flex justify-between items-center transition-colors" onClick={() => { setFinishForm({...finishForm, cct: s.cct, schoolName: s.nombre, municipio: s.municipio, valle: s.valle}); setFinishSearchTerm('') }}>
                        <div className="flex flex-col"><span className="text-[9px] font-black uppercase">{s.nombre}</span><span className="text-[7px] font-mono text-slate-400">{s.cct}</span></div>
                      </div>
                    ))}
                  </div>
                 )}
              </div>
              {finishForm.cct && <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2"><div className="h-5 w-5 rounded bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckCircle2 className="h-3 w-3" /></div><div className="flex-1 min-w-0"><h4 className="text-[9px] font-black text-slate-800 uppercase truncate">{finishForm.schoolName}</h4></div></div>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label className="text-[9px] font-black uppercase text-slate-400 pl-1">OFICINA</Label><Select value={finishForm.oficinaRegionalAtencion} onValueChange={v => setFinishForm({...finishForm, oficinaRegionalAtencion: v})}><SelectTrigger className="h-8 bg-slate-50 border-none rounded-lg text-[9px] font-black uppercase shadow-inner"><SelectValue placeholder="ELEGIR..." /></SelectTrigger><SelectContent className="rounded-lg">{REGIONAL_OFFICES.map(off => <SelectItem key={off} value={off} className="text-[9px] font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label className="text-[9px] font-black uppercase text-slate-400 pl-1">FOLIO COEES</Label><div className="h-8 bg-slate-100 rounded-lg flex items-center px-3 font-mono font-black text-primary shadow-inner text-[9px]">{selectedRequest?.ticketNumber || selectedFormal?.folio}</div></div>
            </div>
            <div className="space-y-1"><Label className="text-[9px] font-black uppercase text-primary pl-1">Resumen Operativo</Label><Textarea placeholder="ACCIONES REALIZADAS..." className="h-20 bg-slate-50 border-none rounded-lg p-3 text-[10px] font-semibold shadow-inner resize-none" value={finishForm.servicio} onChange={e => setFinishForm({...finishForm, servicio: e.target.value.toUpperCase()})} /></div>
          </div>
          <DialogFooter className="p-3 bg-slate-50 border-t"><Button variant="ghost" onClick={() => setIsFinishDialogOpen(false)} className="h-9 px-6 text-[9px] font-black uppercase text-slate-400">CANCELAR</Button><Button onClick={handleFinishConfirm} className="btn-institutional h-10 px-8 text-[9px] gap-2"><Save className="h-4 w-4" /> REGISTRAR ATENCIÓN FINAL</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pdfToPreview} onOpenChange={() => setPdfToPreview(null)}>
        <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
          <DialogHeader className="p-5 bg-primary text-white shrink-0 flex flex-row justify-between items-center pr-12">
            <div className="space-y-1">
              <DialogTitle className="uppercase font-black text-white text-lg flex items-center gap-3">
                <FileText className="h-5 w-5 text-accent" /> VISOR OFICIAL COEES
              </DialogTitle>
              <DialogDescription className="text-white/60 text-[9px] font-bold uppercase tracking-widest">Documento de Solicitud de Servicio Técnico</DialogDescription>
            </div>
            <Button onClick={() => pdfToPreview && printFile(pdfToPreview)} className="bg-white text-primary hover:bg-slate-100 font-black text-[9px] uppercase h-9 px-5 rounded-lg gap-2 shadow-xl">
               <Printer className="h-3.5 w-3.5" /> Imprimir Documento
            </Button>
          </DialogHeader>
          <div className="flex-1 bg-slate-800 p-1">
             <iframe src={pdfToPreview || ''} className="w-full h-full border-none rounded-xl bg-white" title="PDF Preview" />
          </div>
          <DialogFooter className="p-3 bg-slate-50 border-t shrink-0">
             <Button variant="ghost" onClick={() => setPdfToPreview(null)} className="h-9 px-8 font-black uppercase text-[9px]">CERRAR VISOR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
