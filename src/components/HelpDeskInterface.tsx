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
  User,
  History,
  Library,
  Calendar
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

const FILE_SIZE_LIMIT = 500 * 1024; // 500KB strict

export function HelpDeskInterface({ isPublic = false }: { isPublic?: boolean }) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [remoteId, setRemoteId] = useState('') 
  const [activeTicketNumber, setActiveTicketNumber] = useState<string | null>(null)
  const [queue, setQueue] = useState<SupportRequest[]>([])
  const [formalRequests, setFormalRequests] = useState<BitacoraEntry[]>([])
  const [attendanceHistory, setAttendanceHistory] = useState<BitacoraEntry[]>([])
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null)
  const [selectedFormal, setSelectedFormal] = useState<BitacoraEntry | null>(null)
  const [showHistory, setShowHistory] = useState(false)
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
    
    // Unified history sync - ensuring all records are shown
    const today = format(new Date(), 'yyyy-MM-dd');
    const progs = JSON.parse(localStorage.getItem('programs_full_v24') || '[]');
    const todayAtres = progs.filter((p: any) => p.name === 'ATRES' && p.date === today);
    
    const mappedHistory: BitacoraEntry[] = todayAtres.map((p: any, idx: number) => {
      // Find extra info in bitacora if exists
      const inBitacora = bitacora.find(b => p.id.startsWith(b.folio));
      return {
        id: p.id || `HIST-${idx}`,
        folio: p.id?.split('-')[0] || inBitacora?.folio || 'S/F',
        cct: p.cct || inBitacora?.cct || '',
        schoolName: p.schoolName || inBitacora?.schoolName || 'PLANTEL NO IDENTIFICADO',
        servicio: p.observaciones || inBitacora?.servicio || '',
        oficina: p.oficinaRegionalAtencion || inBitacora?.oficina || '',
        fecha: p.date,
        tecnico: p.tecnicos || inBitacora?.tecnico || '',
        status: 'atendido',
        tipo: 'FORMAL'
      };
    });
    
    setAttendanceHistory(mappedHistory)
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
      const initial: Message[] = [{ role: 'bot', content: '¡Hola! Soy tu Asistente Virtual COEES. ¿En qué puedo apoyarte hoy con el sistema ATRES o soporte técnico?', timestamp: Date.now() }]
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
      if (e.key === 'atres_bitacora' || e.key === 'programs_full_v24') {
        syncFormalRequests()
        updateAttendedCount()
      }
      if (activeChatId && e.key === `atres_chat_${activeChatId}`) syncChat()
    };
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [syncQueue, syncChat, activeChatId, isPublic, updateAttendedCount, syncFormalRequests])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const safeSaveNewEntry = (newEntry: BitacoraEntry): boolean => {
    const rawBitacora = localStorage.getItem('atres_bitacora') || '[]';
    let bitacora: BitacoraEntry[] = JSON.parse(rawBitacora);
    bitacora = [newEntry, ...bitacora];

    while (bitacora.length > 0) {
      try {
        localStorage.setItem('atres_bitacora', JSON.stringify(bitacora));
        return true;
      } catch (e) {
        if (bitacora.length > 1) {
          bitacora = bitacora.slice(0, bitacora.length - 1);
        } else {
          return false;
        }
      }
    }
    return false;
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
      }

      // Keyword Trigger Logic: Office or Windows
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes('office') || lowerInput.includes('windows')) {
        setIsRemoteHelpRequested(true);
        // Automatic Bot Reply
        setTimeout(() => {
          const botResponse: Message = {
            role: 'bot',
            content: 'He detectado que tienes un problema relacionado con Office o Windows. Para brindarte una mejor atención técnica, he activado el panel de "Apoyo Remoto" a tu izquierda. Por favor, descarga AnyDesk, localiza tu ID de 9 dígitos y solicítame el soporte para que un analista se conecte a tu equipo.',
            timestamp: Date.now()
          };
          const historyKey = `atres_chat_${updatedActiveChatId}`
          const current = JSON.parse(localStorage.getItem(historyKey) || '[]')
          const updated = [...current, botResponse]
          localStorage.setItem(historyKey, JSON.stringify(updated))
          setMessages(updated)
          window.dispatchEvent(new StorageEvent('storage', { key: historyKey, newValue: JSON.stringify(updated), storageArea: localStorage }))
        }, 1000);
      }
    }

    const newMessage: Message = { role: isPublic ? 'user' : 'tech', content: input, timestamp: Date.now(), senderName: !isPublic ? techName : undefined, fileData: fileData?.data, fileName: fileData?.name, fileType: fileData?.type }
    const historyKey = `atres_chat_${updatedActiveChatId}`
    const currentMessages = JSON.parse(localStorage.getItem(historyKey) || '[]')
    const updatedMessages = [...currentMessages, newMessage]
    
    try {
      localStorage.setItem(historyKey, JSON.stringify(updatedMessages))
      setMessages(updatedMessages)
      window.dispatchEvent(new StorageEvent('storage', { key: historyKey, newValue: JSON.stringify(updatedMessages), storageArea: localStorage }))
    } catch (e) {
      const purged = updatedMessages.slice(Math.floor(updatedMessages.length / 2));
      localStorage.setItem(historyKey, JSON.stringify(purged));
      setMessages(purged);
    }
    input && setInput('')
  }

  const handleRequestRemoteSupport = () => {
    if (remoteId.length < 9) { toast({ variant: "destructive", title: "ID Inválido", description: "Ingrese su ID de 9 dígitos." }); return; }
    const turn = generateTurnSessionId();
    const newReq: SupportRequest = { remoteId, ticketNumber: turn, timestamp: Date.now(), status: 'pending', requestType: 'remote', chatKey: sessionKey }
    const rawQueue = localStorage.getItem('atres_support_queue'); const currentQueue = JSON.parse(rawQueue || '[]');
    localStorage.setItem('atres_support_queue', JSON.stringify([...currentQueue, newReq]));
    setActiveTicketNumber(turn);
    toast({ title: "Soporte Solicitado", description: `Su turno es el: ${turn}` });
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > FILE_SIZE_LIMIT) { toast({ variant: "destructive", title: "Archivo Excedido", description: "Máximo 500KB permitido." }); return; }
    const reader = new FileReader();
    reader.onload = (ev) => handleSendMessage({ data: ev.target?.result as string, name: file.name, type: file.type })
    reader.readAsDataURL(file); e.target.value = '';
  }

  const handleTrackFolio = () => {
    if (!trackFolioInput) return;
    const inBitacora = JSON.parse(localStorage.getItem('atres_bitacora') || '[]').find((b: any) => b.folio === trackFolioInput.toUpperCase());
    if (inBitacora) { setTrackedTicket({ ...inBitacora, id: inBitacora.folio, displayStatus: inBitacora.status === 'atendido' ? 'Atendida' : 'En Proceso' }); return; }
    toast({ variant: "destructive", title: "Folio no encontrado" });
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
      if (pdfFile) pdfContent = await readFileAsDataURL(pdfFile);
      if (excelFile) excelContent = await readFileAsDataURL(excelFile);
      
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

      const saved = safeSaveNewEntry(bitacoraEntry);
      if (!saved) throw new Error("Memoria insuficiente");

      setLastGeneratedFolio(folio);
      setIsConfirmationOpen(true);
      setIsNewTicketDialogOpen(false);
      resetRequestForm();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  }

  const resetRequestForm = () => {
    setPdfFile(null); setExcelFile(null);
    setRequesterName(''); setRequesterEmail(''); setHelpTopic(''); setTicketCct(''); setTicketDetail('');
  }

  const handleFinishConfirm = () => {
    if (!finishForm.cct || !finishForm.servicio || !finishForm.oficinaRegionalAtencion) { toast({ variant: "destructive", title: "Faltan datos" }); return; }
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
    
    localStorage.setItem('atres_bitacora', JSON.stringify(updatedBitacora));

    const progs = JSON.parse(localStorage.getItem('programs_full_v24') || '[]')
    const newRec = { 
      id: `${folio}-${Date.now()}`, 
      name: 'ATRES', 
      cct: finishForm.cct, 
      schoolName: finishForm.schoolName, 
      municipio: finishForm.municipio, 
      valle: finishForm.valle, 
      status: 'concluido', 
      date: format(new Date(), 'yyyy-MM-dd'), 
      progress: 100, 
      observaciones: finishForm.servicio, 
      tecnicos: techName, 
      oficinaRegionalAtencion: finishForm.oficinaRegionalAtencion 
    }
    localStorage.setItem('programs_full_v24', JSON.stringify([newRec, ...progs]))

    if (selectedRequest) {
      const rawQueue = localStorage.getItem('atres_support_queue')
      const updatedQueue = JSON.parse(rawQueue || '[]').filter((r: any) => r.ticketNumber !== folio);
      localStorage.setItem('atres_support_queue', JSON.stringify(updatedQueue))
    }

    setIsFinishDialogOpen(false); setSelectedRequest(null); setSelectedFormal(null); syncQueue(); syncFormalRequests(); updateAttendedCount();
    toast({ title: "Atención Finalizada" });
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-rose-500" />
    if (type.includes('excel') || type.includes('spreadsheet')) return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
    return <FileCode className="h-4 w-4 text-slate-400" />
  }

  const downloadFile = (data: string, name: string) => { const link = document.createElement('a'); link.href = data; link.download = name; link.click(); }
  const printFile = (data: string) => { const win = window.open(); if (!win) return; win.document.write(`<iframe src="${data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`); }

  const showLeftColumn = !isPublic || (isPublic && isRemoteHelpRequested);

  if (!mounted) return null

  return (
    <div className={cn(
      "flex flex-1 w-full flex-col md:flex-row border border-white/40 overflow-hidden transition-all duration-700", 
      isPublic ? "rounded-[3rem] shadow-2xl bg-white/40 h-[calc(100vh-140px)]" : "bg-[#f8f5f0] h-full"
    )}>
      {showLeftColumn && (
        <div className="w-full md:w-[320px] flex flex-col p-4 shrink-0 transition-all duration-500 relative z-20 overflow-hidden bg-white border-r border-slate-100 shadow-xl animate-in slide-in-from-left duration-500">
           {isPublic ? (
             <div className="flex-1 flex flex-col gap-6">
                <div className="bg-[#9f2241] p-6 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Monitor className="h-20 w-20" /></div>
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Apoyo Remoto</Label>
                  <h3 className="text-lg font-black uppercase mt-1 leading-none">AnyDesk / TeamViewer</h3>
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-white/60 pl-1">ID de 9 Dígitos</Label>
                      <Input placeholder="000 000 000" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 font-mono text-center text-xl h-12 rounded-2xl" value={remoteId} onChange={e => setRemoteId(e.target.value.replace(/\D/g,''))} maxLength={9} />
                    </div>
                    <Button onClick={handleRequestRemoteSupport} className="w-full bg-white text-[#9f2241] hover:bg-[#f8f8f8] font-black uppercase text-[11px] h-12 rounded-2xl shadow-xl transition-all">Solicitar Soporte</Button>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                   <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><ArrowRightCircle className="h-4 w-4 text-[#B38E5D]" /> Guía de Soporte</div>
                   <div className="space-y-3">
                      {[
                        { step: "1", text: "Descargue AnyDesk en su equipo." },
                        { step: "2", text: "Copie su ID personal de 9 dígitos." },
                        { step: "3", text: "Péguelo en el campo superior." },
                        { step: "4", text: "Haga clic en 'Solicitar Soporte'." }
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-start">
                          <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center text-[9px] font-black text-[#9f2241] shadow-sm shrink-0">{item.step}</div>
                          <div className="text-[10px] font-bold text-slate-600 leading-tight uppercase pt-0.5">{item.text}</div>
                        </div>
                      ))}
                   </div>
                </div>
                <Button variant="ghost" onClick={() => setIsRemoteHelpRequested(false)} className="mt-auto text-[10px] font-black uppercase text-slate-400 gap-2"><X className="h-4 w-4" /> Cerrar Panel</Button>
             </div>
           ) : (
             <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                <div 
                  onClick={() => { setShowHistory(true); setSelectedFormal(null); setSelectedRequest(null); }}
                  className="bg-primary p-4 rounded-[1.5rem] text-white shadow-xl relative overflow-hidden shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all group"
                >
                  <div className="absolute -right-2 -top-2 opacity-10 rotate-12 group-hover:rotate-45 transition-transform"><Activity className="h-16 w-16" /></div>
                  <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Servicios de Hoy</p>
                  <div className="flex items-end justify-between mt-1">
                      <div className="flex items-end gap-2">
                        <span className="text-4xl font-black leading-none">{attendedTodayCount}</span>
                        <Target className="h-4 w-4 mb-1 text-accent" />
                      </div>
                      <Badge variant="secondary" className="bg-white/20 text-white border-none text-[8px] font-black uppercase px-2 h-5">VER LISTA</Badge>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-6 overflow-hidden min-h-0">
                   <div className="space-y-3 flex flex-col h-[50%] overflow-hidden">
                     <Label className="text-[11px] font-black uppercase text-primary border-b-2 border-primary/10 pb-1 flex items-center justify-between">
                       Solicitudes de Servicio
                       <Badge className="bg-primary text-white text-[10px] px-2 h-5 rounded-full">{formalRequests.length}</Badge>
                     </Label>
                     <ScrollArea className="flex-1">
                       <div className="space-y-2 pr-3">
                         {formalRequests.map((req, idx) => (
                           <button key={`${req.id}-${idx}`} onClick={() => { setSelectedFormal(req); setSelectedRequest(null); setShowHistory(false); }} className={cn("w-full p-3 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between group", selectedFormal?.id === req.id ? "bg-primary border-primary shadow-lg" : "bg-white border-slate-100 hover:bg-slate-50 shadow-sm")}>
                             <div className="flex flex-col">
                               <span className={cn("text-[9px] font-black", selectedFormal?.id === req.id ? "text-white/60" : "text-primary")}>{req.folio}</span>
                               <span className={cn("text-[11px] font-black truncate max-w-[140px]", selectedFormal?.id === req.id ? "text-white" : "text-slate-700")}>{req.schoolName}</span>
                             </div>
                             <FilePlus className={cn("h-4 w-4", selectedFormal?.id === req.id ? "text-white" : "text-slate-300")} />
                           </button>
                         ))}
                       </div>
                     </ScrollArea>
                   </div>

                   <div className="space-y-3 flex flex-col h-[50%] overflow-hidden">
                     <Label className="text-[11px] font-black uppercase text-accent border-b-2 border-primary/10 pb-1 flex items-center justify-between">
                       Mesa Operativa (Live)
                       <Badge className="bg-accent text-white text-[10px] px-2 h-5 rounded-full">{queue.length}</Badge>
                     </Label>
                     <ScrollArea className="flex-1">
                       <div className="space-y-2 pr-3">
                         {queue.map((req, idx) => (
                           <button key={`${req.ticketNumber}-${idx}`} onClick={() => { setSelectedRequest(req); setSelectedFormal(null); setShowHistory(false); }} className={cn("w-full p-3 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between group", selectedRequest?.ticketNumber === req.ticketNumber ? "bg-accent border-accent shadow-lg" : "bg-white border-slate-100 hover:bg-slate-50 shadow-sm")}>
                             <div className="flex flex-col">
                               <span className={cn("text-[9px] font-black", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white/60" : "text-accent")}>{req.ticketNumber}</span>
                               <span className={cn("text-[11px] font-black", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white" : "text-slate-700")}>{req.requestType === 'chat' ? 'LIVE CHAT' : 'REMOTO'}</span>
                             </div>
                             <ChevronRight className={cn("h-4 w-4", selectedRequest?.ticketNumber === req.ticketNumber ? "text-white" : "text-slate-300")} />
                           </button>
                         ))}
                       </div>
                     </ScrollArea>
                   </div>
                </div>
                
                <div className="mt-auto space-y-3 shrink-0">
                  <Label className="text-[11px] font-black uppercase text-slate-400 border-b-2 border-slate-100 pb-1 flex items-center gap-2">
                    <Library className="h-4 w-4" /> Biblioteca
                  </Label>
                  <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center opacity-60">
                     <p className="text-[9px] font-black uppercase text-slate-400">Sin Archivos Recientes</p>
                  </div>
                </div>
             </div>
           )}
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden relative bg-white">
        {!isPublic && showHistory ? (
          <div className="flex-1 flex flex-col p-8 animate-in fade-in slide-in-from-right duration-500 overflow-hidden bg-slate-50/30">
             <div className="max-w-5xl mx-auto w-full flex flex-col h-full space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                   <div className="space-y-1">
                      <h2 className="text-2xl font-black text-primary uppercase flex items-center gap-3">
                        <History className="h-8 w-8 text-accent" /> Servicios Atendidos Hoy
                      </h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Listado oficial de atenciones concluidas en el Centro Operativo.
                      </p>
                   </div>
                   <Button variant="outline" onClick={() => setShowHistory(false)} className="h-10 px-6 rounded-xl font-black text-[10px] uppercase gap-2 border-slate-200 shadow-sm">
                     <X className="h-4 w-4" /> CERRAR VISTA
                   </Button>
                </div>

                <div className="flex-1 border rounded-[2.5rem] bg-white shadow-2xl overflow-hidden">
                   <ScrollArea className="h-full">
                      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                         {attendanceHistory.length > 0 ? attendanceHistory.map((hist, idx) => (
                           <div key={`${hist.id}-${idx}`} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col gap-4 group hover:-translate-y-1">
                              <div className="flex justify-between items-start">
                                 <div className="bg-primary/5 text-primary font-mono text-xs px-4 py-1.5 rounded-xl font-black border border-primary/10 shadow-sm">{hist.folio}</div>
                                 <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-300 uppercase">
                                    <Calendar className="h-3.5 w-3.5" /> {hist.fecha}
                                 </div>
                              </div>
                              <div className="space-y-2">
                                 <h4 className="text-[13px] font-black text-slate-800 uppercase leading-none tracking-tight">{hist.schoolName}</h4>
                                 <div className="text-[10px] font-bold text-slate-400 mt-1.5 flex items-center gap-2">
                                   <Badge variant="outline" className="text-[8px] border-slate-200">{hist.cct}</Badge>
                                   <span className="truncate">{hist.oficina?.replace("Oficina de ", "")}</span>
                                 </div>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                                 <p className="text-[11px] font-semibold text-slate-600 italic leading-relaxed">"{hist.servicio}"</p>
                              </div>
                              <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                 <div className="flex items-center gap-2.5">
                                    <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                                      <UserCog className="h-4 w-4 text-accent" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">{hist.tecnico}</span>
                                 </div>
                                 <div className="flex items-center gap-2 text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span className="text-[8px] font-black uppercase">Finalizado</span>
                                 </div>
                              </div>
                           </div>
                         )) : (
                           <div className="col-span-full py-40 text-center opacity-30 flex flex-col items-center gap-6">
                              <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center">
                                <History className="h-12 w-12" />
                              </div>
                              <p className="text-base font-black uppercase tracking-[0.3em] text-slate-400">Sin registros concluidos el día de hoy</p>
                           </div>
                         )}
                      </div>
                   </ScrollArea>
                </div>
             </div>
          </div>
        ) : !isPublic && !selectedRequest && !selectedFormal ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6">
            <div className="h-24 w-24 rounded-[3rem] bg-slate-50 shadow-inner flex items-center justify-center text-primary/10 animate-pulse"><MessageSquare className="h-12 w-12" /></div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Panel de Analista</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] max-w-xs mx-auto">Seleccione una solicitud activa para iniciar la gestión técnica.</p>
            </div>
            <div className="pt-4 flex flex-col items-center gap-2 opacity-50">
               <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">O haga clic en servicios de hoy para ver la bitácora</div>
               <Activity className="h-5 w-5 text-primary animate-bounce" />
            </div>
          </div>
        ) : !isPublic && selectedFormal ? (
          <div className="flex-1 flex flex-col p-6 animate-in fade-in duration-700 overflow-hidden">
             <ScrollArea className="flex-1">
               <div className="max-w-4xl mx-auto w-full space-y-8 pb-12">
                  <div className="flex justify-between items-center border-b-4 border-primary pb-4">
                     <div className="space-y-1">
                        <div className="flex items-center gap-3">
                           <div className="bg-primary text-white font-mono text-xl px-4 py-1 rounded-xl shadow-lg">{selectedFormal.folio}</div>
                           <Badge variant="outline" className="border-accent text-accent font-black uppercase text-[10px] px-3">FORMAL</Badge>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase mt-2">{selectedFormal.schoolName}</h2>
                        <div className="flex items-center gap-2">
                           <Clock className="h-4 w-4 text-slate-400" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">INGRESADO: {selectedFormal.fecha}</span>
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
                     }} className="btn-institutional h-12 px-10 text-[11px] gap-2 shadow-2xl">
                        <CheckCircle2 className="h-5 w-5" /> CONCLUIR ATENCIÓN
                     </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                        <div className="text-[11px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-3">
                          <User className="h-5 w-5 text-primary" /> Datos del Solicitante
                        </div>
                        <div className="space-y-4">
                           <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Docente / Coordinador:</p>
                              <p className="text-sm font-black text-slate-700 uppercase">{selectedFormal.requesterName || 'N/A'}</p>
                           </div>
                           <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Institucional:</p>
                              <p className="text-sm font-bold text-primary">{selectedFormal.requesterEmail || 'N/A'}</p>
                           </div>
                        </div>
                     </div>

                     <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                        <div className="text-[11px] font-black uppercase text-accent tracking-[0.2em] flex items-center gap-3">
                          <Tag className="h-5 w-5 text-accent" /> Clasificación Técnica
                        </div>
                        <div className="space-y-4">
                           <Badge variant="outline" className="bg-white text-xs font-black uppercase border-accent text-accent px-4 py-1">{selectedFormal.helpTopic || 'GENERAL'}</Badge>
                           <div className="p-4 bg-white rounded-2xl border shadow-sm">
                              <p className="text-[11px] font-semibold text-slate-600 leading-relaxed uppercase">{selectedFormal.ticketDetail || selectedFormal.servicio}</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2rem] shadow-2xl border-2 border-primary/5 space-y-6">
                     <div className="text-[11px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-3">
                       <FileBox className="h-6 w-6 text-primary" /> Expediente Digital Recibido
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedFormal.pdfData ? (
                          <div className="p-5 bg-rose-50 rounded-[2rem] border-2 border-rose-100 space-y-4 shadow-sm hover:shadow-md transition-all">
                             <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-lg text-rose-600"><FileText className="h-7 w-7" /></div>
                                <div>
                                   <p className="text-[11px] font-black text-slate-800 uppercase">Documento PDF</p>
                                   <p className="text-[9px] font-bold text-rose-400 uppercase">REPORTE TÉCNICO OFICIAL</p>
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                                <Button onClick={() => setPdfToPreview(selectedFormal.pdfData!)} className="bg-primary text-white hover:bg-primary/95 font-black text-[10px] rounded-xl h-10 shadow-xl">VISTA PREVIA</Button>
                                <div className="flex gap-2">
                                  <Button variant="outline" onClick={() => downloadFile(selectedFormal.pdfData!, selectedFormal.pdfName || 'solicitud.pdf')} className="flex-1 h-10 border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl"><Download className="h-4 w-4" /></Button>
                                  <Button variant="outline" onClick={() => printFile(selectedFormal.pdfData!)} className="flex-1 h-10 border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl"><Printer className="h-4 w-4" /></Button>
                                </div>
                             </div>
                          </div>
                        ) : (
                          <div className="p-8 border-2 border-dashed rounded-[2rem] border-slate-200 text-center opacity-40">
                            <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                            <p className="text-[10px] font-black uppercase">SIN ARCHIVO PDF</p>
                          </div>
                        )}

                        {selectedFormal.excelData ? (
                          <div className="p-5 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100 space-y-4 shadow-sm hover:shadow-md transition-all">
                             <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-lg text-emerald-600"><FileSpreadsheet className="h-7 w-7" /></div>
                                <div>
                                   <p className="text-[11px] font-black text-slate-800 uppercase">Base de Datos</p>
                                   <p className="text-[9px] font-bold text-emerald-400 uppercase">FORMATO EXCEL ADJUNTO</p>
                                </div>
                             </div>
                             <Button onClick={() => downloadFile(selectedFormal.excelData!, selectedFormal.excelName || 'base.xlsx')} className="w-full bg-emerald-600 text-white hover:bg-emerald-700 font-black text-[10px] rounded-xl h-10 shadow-xl gap-2">
                                <Download className="h-4 w-4" /> DESCARGAR EXCEL
                             </Button>
                          </div>
                        ) : (
                          <div className="p-8 border-2 border-dashed rounded-[2rem] border-slate-200 text-center opacity-40">
                            <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                            <p className="text-[10px] font-black uppercase">SIN ARCHIVO EXCEL</p>
                          </div>
                        )}
                     </div>
                  </div>
               </div>
             </ScrollArea>
          </div>
        ) : (
          <>
            <header className={cn("px-8 py-4 flex justify-between items-center z-10 shrink-0 border-b", isPublic ? "bg-white/60 backdrop-blur-3xl" : "bg-white shadow-sm")}>
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-2xl bg-[#9f2241] text-white flex items-center justify-center shadow-2xl relative overflow-hidden group">
                  {isPublic ? <Bot className="h-7 w-7 relative z-10" /> : <UserCog className="h-7 w-7 relative z-10" />}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase leading-none tracking-tight">{isPublic ? "Mesa de Ayuda ATRES" : "Centro de Control Operativo"}</h2>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1.5">
                       <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                       <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">En Línea</div>
                    </div>
                    {activeChatId && <Badge variant="outline" className="text-[9px] font-mono border-primary/20 text-primary bg-primary/5 px-2">{activeChatId}</Badge>}
                    {isPublic && (
                      <div className="flex gap-2 ml-2">
                         <button onClick={() => setIsNewTicketDialogOpen(true)} className="flex items-center gap-2 bg-[#B38E5D] hover:bg-[#a67d4a] px-4 h-9 rounded-xl shadow-lg transition-all text-white font-black uppercase text-[9px] tracking-widest">
                           <FilePlus className="h-4 w-4" /> Solicitar Soporte
                         </button>
                         <button onClick={() => setIsTrackTicketDialogOpen(true)} className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-inner"><Search className="h-4 w-4" /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {!isPublic && selectedRequest && <Button onClick={() => setIsFinishDialogOpen(true)} className="btn-institutional h-11 px-8 text-[11px] gap-2 shadow-2xl"><CheckCircle2 className="h-5 w-5" /> CONCLUIR</Button>}
            </header>
            <ScrollArea className="flex-1 px-8 py-10">
              <div className="max-w-4xl mx-auto space-y-8 min-h-full flex flex-col justify-end pb-8">
                {messages.map((msg, i) => {
                  const isMe = (isPublic && msg.role === 'user') || (!isPublic && msg.role === 'tech');
                  return (
                    <div key={`${activeChatId}-msg-${i}`} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-4 duration-500", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn("flex gap-4 max-w-[80%]", isMe ? "flex-row-reverse" : "flex-row")}>
                        <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xl border-4 border-white", msg.role === 'user' ? "bg-[#B38E5D] text-white" : msg.role === 'tech' ? "bg-[#9f2241] text-white" : "bg-slate-800 text-white")}>
                          {msg.role === 'user' ? <GraduationCap className="h-5 w-5" /> : msg.role === 'tech' ? <UserCog className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                        </div>
                        <div className="space-y-1.5">
                          {msg.senderName && <span className={cn("text-[8px] font-black uppercase tracking-widest block px-1", isMe ? "text-right text-[#B38E5D]" : "text-left text-slate-400")}>{msg.senderName}</span>}
                          <div className={cn("p-4 rounded-3xl text-sm font-semibold shadow-2xl border leading-relaxed relative", isMe ? (msg.role === 'user' ? "bg-[#B38E5D] text-white rounded-tr-none border-transparent" : "bg-[#9f2241] text-white rounded-tr-none border-transparent") : msg.role === 'bot' ? "bg-slate-800 text-white rounded-tl-none border-transparent" : "bg-white text-slate-700 rounded-tl-none border-slate-100")}>
                            {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                            {msg.fileData && (
                              <div className={cn("mt-4 p-4 rounded-2xl border flex items-center gap-4 cursor-pointer transition-all hover:scale-[1.02]", isMe ? "bg-white/20 border-white/30" : "bg-slate-50 border-slate-100")} onClick={() => downloadFile(msg.fileData!, msg.fileName!)}>
                                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-lg">{getFileIcon(msg.fileType || '')}</div>
                                <div className="flex-1 min-w-0"><p className={cn("text-[10px] font-black truncate uppercase", isMe ? "text-white" : "text-slate-800")}>{msg.fileName}</p></div>
                                <Download className={cn("h-4 w-4", isMe ? "text-white/60" : "text-slate-300")} />
                              </div>
                            )}
                            <div className={cn("text-[8px] mt-3 font-black uppercase flex items-center gap-2 opacity-50", isMe ? "justify-end" : "justify-start")}>
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
            <footer className="p-6 bg-white/40 backdrop-blur-3xl border-t border-white/40 shrink-0">
              <div className="max-w-4xl mx-auto flex gap-4">
                <div className="relative flex-1 group">
                  <Input placeholder={isPublic ? "Describa su problema técnico..." : "Escriba una respuesta oficial..."} className="h-14 rounded-2xl bg-white border-2 border-slate-100 px-8 pr-14 font-semibold shadow-inner focus:ring-8 focus:ring-[#9f2241]/5 focus:border-[#9f2241]/20 text-sm transition-all" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
                  <button onClick={() => fileInputRef.current?.click()} className="absolute right-5 top-3.5 h-7 w-7 text-slate-300 hover:text-primary transition-all flex items-center justify-center rounded-xl hover:bg-slate-50"><Paperclip className="h-5 w-5" /></button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                </div>
                <button onClick={() => handleSendMessage()} disabled={!input.trim()} className="h-14 w-14 rounded-2xl bg-[#9f2241] hover:bg-[#801a34] text-white shadow-2xl shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center group"><Send className="h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></button>
              </div>
            </footer>
          </>
        )}
      </div>

      <Dialog open={isNewTicketDialogOpen} onOpenChange={setIsNewTicketDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[95vh] flex flex-col">
          <DialogHeader className="p-8 bg-[#9f2241] text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><FilePlus className="h-24 w-24" /></div>
            <DialogTitle className="uppercase font-black text-2xl flex items-center gap-4 relative z-10">Solicitud de Servicio ATRES</DialogTitle>
            <DialogDescription className="text-white/60 font-bold text-[10px] uppercase tracking-widest mt-2 relative z-10">Capture los datos técnicos para el folio oficial.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-10 space-y-8">
             <div className="space-y-6">
                <h4 className="text-xs font-black uppercase text-accent border-b-2 border-accent/10 pb-2 flex items-center gap-3"><User className="h-4 w-4" /> Datos de Identificación</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Nombre Completo del Servidor Público</Label>
                    <Input placeholder="PATERNO MATERNO NOMBRES..." className="h-12 bg-slate-50 border-none rounded-xl text-xs font-black uppercase shadow-inner" value={requesterName} onChange={e => setRequesterName(e.target.value.toUpperCase())} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Correo Institucional</Label>
                      <Input placeholder="ejemplo@desysa.edu.mx" className="h-12 bg-slate-50 border-none rounded-xl text-xs font-bold shadow-inner" value={requesterEmail} onChange={e => setRequesterEmail(e.target.value.toLowerCase())} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Tema del Soporte</Label>
                      <Select value={helpTopic} onValueChange={val => setHelpTopic(val)} >
                        <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl text-xs font-black uppercase shadow-inner"><SelectValue placeholder="ELEGIR..." /></SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="cuenta" className="text-xs font-bold uppercase">Cuentas institucionales</SelectItem>
                          <SelectItem value="atres" className="text-xs font-bold uppercase">Sistema ATRES</SelectItem>
                          <SelectItem value="hardware" className="text-xs font-bold uppercase">Soporte Hardware</SelectItem>
                          <SelectItem value="redes" className="text-xs font-bold uppercase">Red Local / Edusat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
             </div>

             <div className="space-y-6">
                <h4 className="text-xs font-black uppercase text-accent border-b-2 border-accent/10 pb-2 flex items-center gap-3"><Monitor className="h-4 w-4" /> Especificación Técnica</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 pl-1">CCT del Plantel</Label><Input placeholder="15DES0000X" className="h-12 bg-slate-50 border-none rounded-xl text-sm font-mono font-black uppercase shadow-inner" value={ticketCct} onChange={e => setTicketCct(e.target.value.toUpperCase())} maxLength={10} /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Asunto Resumido</Label><Input placeholder="RESUMEN..." className="h-12 bg-slate-50 border-none rounded-xl text-xs font-semibold uppercase shadow-inner" value={ticketDetail} onChange={e => setTicketDetail(e.target.value.toUpperCase())} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={cn("flex items-center gap-4 bg-slate-50 rounded-2xl p-4 border-2 border-dashed h-16 relative transition-all", pdfFile ? "border-rose-400 bg-rose-50" : "border-slate-200")}>
                      <FileText className={cn("h-6 w-6", pdfFile ? "text-rose-600" : "text-rose-400")} />
                      <div className="flex-1 min-w-0"><span className={cn("text-[9px] font-black uppercase truncate block", pdfFile && "text-rose-700")}>{pdfFile ? pdfFile.name : "Reporte Oficial (PDF)"}</span></div>
                      <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
                  </div>
                  <div className={cn("flex items-center gap-4 bg-slate-50 rounded-2xl p-4 border-2 border-dashed h-16 relative transition-all", excelFile ? "border-emerald-400 bg-emerald-50" : "border-slate-200")}>
                      <FileSpreadsheet className={cn("h-6 w-6", excelFile ? "text-emerald-600" : "text-emerald-400")} />
                      <div className="flex-1 min-w-0"><span className={cn("text-[9px] font-black uppercase truncate block", excelFile && "text-emerald-700")}>{excelFile ? excelFile.name : "Base de Datos (Excel)"}</span></div>
                      <input type="file" accept=".xlsx, .xls" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setExcelFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
             </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4 shrink-0"><Button variant="ghost" onClick={() => setIsNewTicketDialogOpen(false)} className="h-12 px-8 text-xs font-black uppercase text-slate-400">Cancelar</Button><Button onClick={handleSendNewTicketRequest} className="btn-institutional h-12 px-12 text-xs">Enviar Solicitud</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[3rem] border-none shadow-2xl p-10 overflow-hidden bg-white text-center">
            <DialogHeader className="flex flex-col items-center">
              <div className="h-20 w-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner"><CheckCircle2 className="h-10 w-10 text-emerald-500" /></div>
              <DialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tight">Folio Generado</DialogTitle>
              <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed mt-2 mb-8">
                  Su solicitud ha sido ingresada al sistema oficial de atención COEES.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-primary/10 shadow-inner mb-8">
               <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">FOLIO ATRES</p>
               <h4 className="text-3xl font-black text-slate-800 font-mono tracking-tighter">{lastGeneratedFolio}</h4>
            </div>
            <Button onClick={() => setIsConfirmationOpen(false)} className="w-full btn-institutional h-14 rounded-2xl text-xs">Aceptar</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isTrackTicketDialogOpen} onOpenChange={setIsTrackTicketDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] border-none shadow-2xl p-8 overflow-hidden bg-white">
          <DialogHeader>
            <DialogTitle className="uppercase font-black text-xl flex items-center gap-3"><Search className="h-6 w-6 text-accent" /> Seguimiento de Folio</DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-1">Verifique el estatus operativo de su solicitud.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-6">
             <div className="flex gap-3">
                <Input placeholder="COEES-00001" className="h-12 bg-slate-50 border-none rounded-2xl text-sm font-mono font-black uppercase flex-1 shadow-inner px-6" value={trackFolioInput} onChange={e => setTrackFolioInput(e.target.value.toUpperCase())} />
                <Button onClick={handleTrackFolio} className="h-12 w-12 p-0 rounded-2xl bg-primary text-white shadow-xl hover:scale-105 transition-all"><Search className="h-5 w-5" /></Button>
             </div>
             {trackedTicket && (
               <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-accent/20 animate-in zoom-in-95 shadow-lg">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-4">
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Estatus del Folio:</p>
                        <h4 className="text-xl font-black text-primary font-mono">{trackedTicket.id || trackedTicket.folio}</h4>
                     </div>
                     <Badge className={cn("text-[10px] font-black uppercase py-1.5 px-4 rounded-full shadow-md", trackedTicket.displayStatus === 'Atendida' ? 'bg-emerald-50' : 'bg-amber-500')}>
                        {trackedTicket.displayStatus}
                     </Badge>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase">Plantel:</p>
                     <p className="text-sm font-black text-slate-700 uppercase leading-tight">{trackedTicket.schoolName || 'EN PROCESO'}</p>
                  </div>
               </div>
             )}
          </div>
          <DialogFooter className="pt-8"><Button variant="ghost" onClick={() => { setIsTrackTicketDialogOpen(false); setTrackedTicket(null); setTrackFolioInput(''); }} className="w-full h-12 text-xs font-black uppercase text-slate-400">Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-primary text-white shrink-0">
            <DialogTitle className="uppercase font-black text-lg flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-accent" /> Concluir Turno</DialogTitle>
            <DialogDescription className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Cierre oficial del folio operativo.</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-1">Identificar Plantel</Label>
              <div className="relative">
                 <Input placeholder="CCT O NOMBRE..." className="h-10 bg-slate-50 border-none rounded-xl text-[11px] font-black uppercase px-4 shadow-inner" value={finishSearchTerm} onChange={e => setFinishSearchTerm(e.target.value)} />
                 {finishSearchTerm.length > 2 && (
                  <div className="absolute left-0 right-0 top-11 max-h-40 overflow-y-auto bg-white border border-slate-100 rounded-xl shadow-2xl divide-y z-50">
                    {schoolsDirectory.filter(s => s.cct.includes(finishSearchTerm.toUpperCase()) || s.nombre.includes(finishSearchTerm.toUpperCase())).slice(0, 5).map(s => (
                      <div key={`${s.cct}-${s.turno}`} className="p-3 hover:bg-primary/5 cursor-pointer flex justify-between items-center transition-colors" onClick={() => { setFinishForm({...finishForm, cct: s.cct, schoolName: s.nombre, municipio: s.municipio, valle: s.valle}); setFinishSearchTerm('') }}>
                        <div className="flex flex-col"><span className="text-[11px] font-black uppercase">{s.nombre}</span><span className="text-[8px] font-mono text-slate-400">{s.cct}</span></div>
                      </div>
                    ))}
                  </div>
                 )}
              </div>
              {finishForm.cct && <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 shadow-sm animate-in zoom-in-95"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><div className="flex-1 min-w-0"><h4 className="text-[10px] font-black text-slate-800 uppercase truncate">{finishForm.schoolName}</h4></div></div>}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Oficina</Label><Select value={finishForm.oficinaRegionalAtencion} onValueChange={v => setFinishForm({...finishForm, oficinaRegionalAtencion: v})}><SelectTrigger className="h-10 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase shadow-inner"><SelectValue placeholder="ELEGIR..." /></SelectTrigger><SelectContent className="rounded-2xl">{REGIONAL_OFFICES.map(off => <SelectItem key={off} value={off} className="text-[10px] font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Folio</Label><div className="h-10 bg-slate-100 rounded-xl flex items-center px-4 font-mono font-black text-primary shadow-inner text-sm">{activeChatId}</div></div>
            </div>
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary pl-1">Servicio Realizado</Label><Textarea placeholder="Describa brevemente las acciones técnicas..." className="h-24 bg-slate-50 border-none rounded-2xl p-4 text-[11px] font-semibold shadow-inner resize-none focus:bg-white transition-all" value={finishForm.servicio} onChange={e => setFinishForm({...finishForm, servicio: e.target.value.toUpperCase()})} /></div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-4"><Button variant="ghost" onClick={() => setIsFinishDialogOpen(false)} className="h-12 px-8 text-xs font-black uppercase text-slate-400">Cancelar</Button><Button onClick={handleFinishConfirm} className="btn-institutional h-12 px-10 text-[11px] gap-2"><Save className="h-5 w-5" /> Registrar Cierre</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pdfToPreview} onOpenChange={() => setPdfToPreview(null)}>
        <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white shrink-0 flex flex-row justify-between items-center pr-12">
            <div className="space-y-1">
              <DialogTitle className="uppercase font-black text-white text-xl flex items-center gap-4">
                <FileText className="h-6 w-6 text-accent" /> VISOR COEES
              </DialogTitle>
              <DialogDescription className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Documento Digital</DialogDescription>
            </div>
            <Button onClick={() => pdfToPreview && printFile(pdfToPreview)} className="bg-white text-primary hover:bg-slate-100 font-black text-[10px] uppercase h-10 px-8 rounded-xl gap-2 shadow-xl">
               <Printer className="h-4 w-4" /> Imprimir
            </Button>
          </DialogHeader>
          <div className="flex-1 bg-slate-800 p-1">
             <iframe src={pdfToPreview || ''} className="w-full h-full border-none rounded-xl bg-white" title="PDF Preview" />
          </div>
          <DialogFooter className="p-4 bg-slate-50 border-t shrink-0">
             <Button variant="ghost" onClick={() => setPdfToPreview(null)} className="h-11 px-10 font-black uppercase text-xs">Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
