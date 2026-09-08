'use client'
/**
 * @fileOverview Interfaz de Mesa de Ayuda ATRES de Alta Fidelidad.
 * Maneja la comunicación en tiempo real entre usuarios externos y analistas internos.
 * Incluye generación dinámica de QR e integración con Genkit para IA.
 */

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
  ArrowRightCircle,
  Clock,
  Activity,
  Monitor,
  X,
  Target,
  FilePlus,
  Search,
  User,
  History,
  Circle,
  Copy,
  Wifi,
  Loader2,
  QrCode
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { schoolsDirectory, type SchoolInfo } from '@/lib/schools-directory'
import { format } from 'date-fns'
import { type BitacoraEntry } from '@/lib/planning-data'
import { db } from '@/lib/firebase'
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where, 
  doc, 
  updateDoc, 
  setDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore'
import { chatWithHelpDesk } from '@/ai/flows/help-desk-flow'
import Image from 'next/image'

type Message = {
  id?: string;
  role: 'user' | 'tech' | 'bot';
  content: string;
  timestamp: any;
  senderName?: string;
  fileData?: string; 
  fileName?: string;
  fileType?: string;
}

type SupportRequest = {
  id: string;
  remoteId: string;
  ticketNumber: string;
  timestamp: any;
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

const FILE_SIZE_LIMIT = 2 * 1024 * 1024;

export function HelpDeskInterface({ isPublic = false }: { isPublic?: boolean }) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [remoteId, setRemoteId] = useState('') 
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
  const [currentOrigin, setCurrentOrigin] = useState('')
  const [isBotThinking, setIsBotThinking] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isSystemOnline, setIsSystemOnline] = useState(false)
  
  const [isNewTicketDialogOpen, setIsNewTicketDialogOpen] = useState(false)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [lastGeneratedFolio, setLastGeneratedFolio] = useState('')
  
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [requesterName, setRequesterName] = useState('')
  const [helpTopic, setHelpTopic] = useState('')
  const [ticketCct, setTicketCct] = useState('')
  const [ticketDetail, setTicketDetail] = useState('')

  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false)
  const [finishForm, setFinishForm] = useState({
    cct: '',
    schoolName: '',
    servicio: '',
    municipio: '',
    valle: '',
    oficinaRegionalAtencion: ''
  })
  
  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeChatId = useMemo(() => {
    if (isPublic) return sessionKey;
    return selectedRequest?.ticketNumber || selectedFormal?.folio || null;
  }, [isPublic, sessionKey, selectedRequest, selectedFormal]);

  const qrUrl = useMemo(() => {
    if (!currentOrigin) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentOrigin + '/helpdesk')}`;
  }, [currentOrigin]);

  const generateTurnSessionId = useCallback(() => {
    const now = new Date();
    const dateStr = format(now, 'yyyyMMdd');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `USER-${dateStr}-${random}`;
  }, []);

  const generateSequentialFolio = () => {
    const now = new Date();
    const year = now.getFullYear();
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `COEES-${year}-${randomSuffix}`;
  }

  const downloadFile = (data: string, name: string) => {
    const link = document.createElement('a'); link.href = data; link.download = name; link.click();
  }

  // Inicialización de Sesión y Conexión
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setCurrentOrigin(window.location.origin);
    }
    const storedSchools = JSON.parse(localStorage.getItem('schools_master_full_v21') || '[]');
    setAllSchools(storedSchools.length > 0 ? storedSchools : schoolsDirectory);

    if (isPublic) {
      let sKey = sessionStorage.getItem('atres_session_id');
      if (!sKey) {
        sKey = generateTurnSessionId();
        sessionStorage.setItem('atres_session_id', sKey);
      }
      setSessionKey(sKey);
      
      const initQueue = async () => {
        try {
          const queueRef = doc(db, 'atres_support_queue', sKey);
          await setDoc(queueRef, {
            ticketNumber: sKey,
            timestamp: serverTimestamp(),
            status: 'pending',
            requestType: 'chat',
            chatKey: sKey,
            lastActivity: serverTimestamp()
          }, { merge: true });
          setIsSystemOnline(true);
        } catch (e) {
          console.error("Queue Init Error:", e);
        }
      }
      initQueue();
    } else {
      const savedTechName = localStorage.getItem('atres_tech_name') || 'Analista COEES';
      setTechName(savedTechName);
      setIsSystemOnline(true);
    }
  }, [isPublic, generateTurnSessionId]);

  // Escuchar Bitácora
  useEffect(() => {
    if (!mounted) return;
    const q = query(collection(db, 'atres_bitacora'), orderBy('fecha', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allEntries = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as BitacoraEntry[];
      setFormalRequests(allEntries.filter(b => b.status === 'pendiente' || b.status === 'proceso'));
      const today = format(new Date(), 'dd/MM/yyyy');
      const history = allEntries.filter(b => b.status === 'atendido' && b.fecha.includes(today));
      setAttendanceHistory(history);
      setAttendedTodayCount(history.length);
    });
    return () => unsubscribe();
  }, [mounted]);

  // Escuchar Cola Live
  useEffect(() => {
    if (!mounted) return;
    const q = query(collection(db, 'atres_support_queue'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQueue(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as SupportRequest[]);
    });
    return () => unsubscribe();
  }, [mounted]);

  // Escuchar Mensajes
  useEffect(() => {
    if (!mounted || !activeChatId) {
      setMessages([]);
      return;
    }
    const q = query(
      collection(db, 'chat_messages'), 
      where('chatId', '==', activeChatId),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatMsgs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Message[];
      if (chatMsgs.length === 0 && isPublic) {
        setMessages([{ 
          role: 'bot', 
          content: '¡Hola! Soy tu Asistente Virtual COEES. ¿En qué puedo apoyarte hoy con el sistema ATRES o soporte técnico?', 
          timestamp: { seconds: Date.now()/1000 } 
        }]);
      } else {
        setMessages(chatMsgs);
      }
    });
    return () => unsubscribe();
  }, [mounted, activeChatId, isPublic]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (msgData?: { content?: string, fileData?: { data: string, name: string, type: string } }) => {
    const textToSend = msgData?.content ?? input;
    if (!textToSend.trim() && !msgData?.fileData) return;
    
    const chatId = activeChatId || sessionKey;
    if (!chatId) {
      toast({ variant: "destructive", title: "Iniciando sesión...", description: "Espere un momento y reintente." });
      return;
    }

    setIsSending(true);
    try {
      if (isPublic) {
        const queueRef = doc(db, 'atres_support_queue', sessionKey);
        await updateDoc(queueRef, { lastActivity: serverTimestamp(), status: 'pending' });
      }

      await addDoc(collection(db, 'chat_messages'), {
        chatId,
        role: isPublic ? 'user' : 'tech',
        content: textToSend,
        timestamp: serverTimestamp(),
        senderName: !isPublic ? techName : undefined,
        fileData: msgData?.fileData?.data || null,
        fileName: msgData?.fileData?.name || null,
        fileType: msgData?.fileData?.type || null
      });

      if (!msgData?.content) setInput('');

      if (isPublic && !msgData?.fileData) {
        setIsBotThinking(true);
        chatWithHelpDesk({ message: textToSend }).then(async (aiRes) => {
          if (aiRes?.response) {
            await addDoc(collection(db, 'chat_messages'), {
              chatId,
              role: 'bot',
              content: aiRes.response,
              timestamp: serverTimestamp()
            });
          }
        }).catch(() => {}).finally(() => setIsBotThinking(false));
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Falla de red", description: "Verifique su conexión e intente nuevamente." });
    } finally {
      setIsSending(false);
    }
  }

  const handleRequestRemoteSupport = async () => {
    if (remoteId.length < 9) {
      toast({ variant: "destructive", title: "ID AnyDesk Inválido" });
      return;
    }
    try {
      const queueRef = doc(db, 'atres_support_queue', sessionKey);
      await setDoc(queueRef, {
        remoteId,
        ticketNumber: sessionKey,
        timestamp: serverTimestamp(),
        status: 'pending',
        requestType: 'remote',
        chatKey: sessionKey,
        lastActivity: serverTimestamp()
      }, { merge: true });
      
      await handleSendMessage({ content: `SOLICITUD DE APOYO REMOTO - ID ANYDESK: ${remoteId}` });
      toast({ title: "Soporte Solicitado", description: "Un analista se conectará pronto." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error en solicitud" });
    }
  }

  const handleSendNewTicketRequest = async () => {
    if (!requesterName || !helpTopic || !ticketCct || !ticketDetail) {
      toast({ variant: "destructive", title: "Faltan datos obligatorios" });
      return;
    }
    setIsSending(true);
    try {
      const folio = generateSequentialFolio();
      let pdfBase64 = "";
      if (pdfFile) {
        pdfBase64 = await new Promise((res) => {
          const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(pdfFile);
        });
      }

      const school = allSchools.find(s => s.cct === ticketCct.toUpperCase());
      await addDoc(collection(db, 'atres_bitacora'), {
        folio,
        cct: ticketCct.toUpperCase(),
        schoolName: school?.nombre || "CCT EXTERNO",
        servicio: `${helpTopic.toUpperCase()}: ${ticketDetail}`,
        oficina: "MESA DE AYUDA",
        fecha: format(new Date(), 'dd/MM/yyyy HH:mm'),
        tecnico: "POR ASIGNAR",
        status: 'pendiente',
        pdfData: pdfBase64 || null,
        pdfName: pdfFile?.name || null,
        updatedAt: serverTimestamp()
      });

      setLastGeneratedFolio(folio);
      setIsConfirmationOpen(true);
      setIsNewTicketDialogOpen(false);
      setPdfFile(null); setRequesterName(''); setHelpTopic(''); setTicketCct(''); setTicketDetail('');
    } catch (e: any) {
      toast({ variant: "destructive", title: "Falla de envío", description: e.message });
    } finally {
      setIsSending(false);
    }
  }

  const handleFinishConfirm = async () => {
    if (!finishForm.cct || !finishForm.servicio || !finishForm.oficinaRegionalAtencion) {
      toast({ variant: "destructive", title: "Faltan datos de cierre" }); return;
    }
    setIsSending(true);
    try {
      const target = selectedFormal || formalRequests.find(b => b.folio === activeChatId);
      if (target?.id) {
        await updateDoc(doc(db, 'atres_bitacora', target.id), {
          status: 'atendido',
          servicio: finishForm.servicio,
          tecnico: techName,
          oficina: finishForm.oficinaRegionalAtencion,
          schoolName: finishForm.schoolName,
          updatedAt: serverTimestamp()
        });
      }
      if (selectedRequest?.id) {
        await deleteDoc(doc(db, 'atres_support_queue', selectedRequest.id));
      }
      setIsFinishDialogOpen(false); setSelectedRequest(null); setSelectedFormal(null);
      toast({ title: "Atención Concluida" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al cerrar folio" });
    } finally {
      setIsSending(false);
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > FILE_SIZE_LIMIT) { toast({ variant: "destructive", title: "PDF demasiado pesado (Máx 2MB)" }); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      handleSendMessage({ fileData: { data: ev.target?.result as string, name: file.name, type: file.type } });
    }
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  const copySupportLink = () => {
    if (currentOrigin) {
      navigator.clipboard.writeText(`${currentOrigin}/helpdesk`);
      toast({ title: "Enlace Copiado", description: "Llamada a soporte lista." });
    }
  }

  if (!mounted) return null;

  return (
    <div className={cn(
      "flex flex-1 w-full flex-col md:flex-row border border-white/40 overflow-hidden transition-all duration-700", 
      isPublic ? "rounded-[3rem] shadow-2xl bg-white/40 h-[calc(100vh-140px)]" : "bg-[#f8f5f0] h-full"
    )}>
      {/* Columna Izquierda (Queue / QR) */}
      <div className="w-full md:w-[320px] flex flex-col p-4 shrink-0 bg-white border-r border-slate-100 shadow-xl z-20 overflow-hidden animate-in slide-in-from-left duration-500">
         {isPublic ? (
           <div className="flex-1 flex flex-col gap-6">
              <div className="bg-[#9f2241] p-6 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Monitor className="h-20 w-20" /></div>
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Apoyo Remoto</Label>
                <h3 className="text-lg font-black uppercase mt-1 leading-none">AnyDesk / TeamViewer</h3>
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-white/60 pl-1">ID de 9 Dígitos</Label>
                    <Input 
                      placeholder="000 000 000" 
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30 font-mono text-center text-xl h-12 rounded-2xl focus:ring-accent" 
                      value={remoteId} 
                      onChange={e => setRemoteId(e.target.value.replace(/\D/g,''))} 
                      maxLength={9} 
                    />
                  </div>
                  <Button 
                    onClick={handleRequestRemoteSupport} 
                    disabled={remoteId.length < 9}
                    className="w-full bg-white text-[#9f2241] hover:bg-[#f8f8f8] font-black uppercase text-[11px] h-12 rounded-2xl shadow-xl transition-all"
                  >
                    Solicitar Soporte
                  </Button>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center space-y-4 shadow-inner">
                 <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><QrCode className="h-4 w-4 text-[#B38E5D]" /> Acceso Móvil</div>
                 <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-100 group hover:scale-105 transition-transform duration-500">
                    <img src={qrUrl} alt="QR Soporte" className="w-32 h-32" />
                 </div>
                 <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight px-4">Escanee para continuar el chat en su dispositivo móvil.</p>
                 <Button variant="outline" size="sm" onClick={copySupportLink} className="h-8 rounded-xl text-[8px] font-black gap-2 border-slate-200">
                    <Copy className="h-3 w-3" /> COPIAR ENLACE
                 </Button>
              </div>

              <div className="mt-auto p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                 <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Sistema Sincronizado</span>
              </div>
           </div>
         ) : (
           <div className="flex-1 flex flex-col gap-5 overflow-hidden">
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
                    <Badge variant="secondary" className="bg-white/20 text-white border-none text-[8px] font-black uppercase px-2 h-5">HISTORIAL</Badge>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-6 overflow-hidden min-h-0 pt-2">
                 <div className="space-y-3 flex flex-col h-[50%] overflow-hidden">
                   <div className="text-[11px] font-black uppercase text-primary border-b-2 border-primary/10 pb-1 flex items-center justify-between">
                     Solicitudes (Bitácora)
                     <Badge className="bg-primary text-white text-[10px] px-2 h-5 rounded-full">{formalRequests.length}</Badge>
                   </div>
                   <ScrollArea className="flex-1">
                     <div className="space-y-2 pr-3">
                       {formalRequests.map((req) => (
                         <button key={`formal-${req.id}`} onClick={() => { setSelectedFormal(req); setSelectedRequest(null); setShowHistory(false); }} className={cn("w-full p-3 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between group", selectedFormal?.id === req.id ? "bg-primary border-primary shadow-lg" : "bg-white border-slate-100 hover:bg-slate-50 shadow-sm")}>
                           <div className="flex flex-col">
                             <span className={cn("text-[9px] font-black", selectedFormal?.id === req.id ? "text-white/60" : "text-primary")}>{req.folio}</span>
                             <span className={cn("text-[11px] font-black truncate max-w-[140px]", selectedFormal?.id === req.id ? "text-white" : "text-slate-700")}>{req.schoolName}</span>
                           </div>
                         </button>
                       ))}
                     </div>
                   </ScrollArea>
                 </div>

                 <div className="space-y-3 flex flex-col h-[50%] overflow-hidden">
                   <div className="text-[11px] font-black uppercase text-accent border-b-2 border-primary/10 pb-1 flex items-center justify-between">
                     Mesa Operativa (Live)
                     <Badge className="bg-accent text-white text-[10px] px-2 h-5 rounded-full">{queue.length}</Badge>
                   </div>
                   <ScrollArea className="flex-1">
                     <div className="space-y-2 pr-3">
                       {queue.map((req) => (
                         <button key={`queue-${req.id}`} onClick={() => { setSelectedRequest(req); setSelectedFormal(null); setShowHistory(false); }} className={cn("w-full p-3 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between group", selectedRequest?.id === req.id ? "bg-accent border-accent shadow-lg" : "bg-white border-slate-100 hover:bg-slate-50 shadow-sm")}>
                           <div className="flex flex-col">
                             <span className={cn("text-[9px] font-black", selectedRequest?.id === req.id ? "text-white/60" : "text-accent")}>{req.ticketNumber}</span>
                             <span className={cn("text-[11px] font-black truncate max-w-[140px]", selectedRequest?.id === req.id ? "text-white" : "text-slate-700")}>{req.requestType === 'remote' ? 'REMOTA' : 'CHAT LIVE'}</span>
                           </div>
                           {req.remoteId && <Monitor className={cn("h-4 w-4", selectedRequest?.id === req.id ? "text-white" : "text-primary")} />}
                         </button>
                       ))}
                     </div>
                   </ScrollArea>
                 </div>
              </div>
           </div>
         )}
      </div>

      {/* Area de Chat Principal */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-white">
        {!isPublic && showHistory ? (
          <div className="flex-1 flex flex-col p-8 bg-slate-50/30 animate-in fade-in duration-500">
             <div className="max-w-5xl mx-auto w-full flex flex-col h-full space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                   <h2 className="text-2xl font-black text-primary uppercase flex items-center gap-3"><History className="h-8 w-8 text-accent" /> Servicios de Hoy</h2>
                   <button onClick={() => setShowHistory(false)} className="px-6 h-10 rounded-xl font-black text-[10px] uppercase border shadow-sm hover:bg-slate-50">CERRAR</button>
                </div>
                <ScrollArea className="flex-1 border rounded-[2.5rem] bg-white shadow-2xl">
                   <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {attendanceHistory.map((hist) => (
                        <div key={hist.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all">
                           <div className="flex justify-between items-start mb-4">
                              <Badge className="bg-primary/5 text-primary border-primary/10 font-mono text-[10px]">{hist.folio}</Badge>
                              <span className="text-[9px] font-black text-slate-300">{hist.fecha}</span>
                           </div>
                           <h4 className="text-[13px] font-black text-slate-800 uppercase">{hist.schoolName}</h4>
                           <div className="bg-slate-50 p-4 rounded-2xl border my-4 text-[11px] font-semibold text-slate-600">"{hist.servicio}"</div>
                           <div className="flex items-center gap-2"><UserCog className="h-3 w-3 text-emerald-500" /><span className="text-[9px] font-black uppercase text-slate-400">Atendido por: {hist.tecnico}</span></div>
                        </div>
                      ))}
                   </div>
                </ScrollArea>
             </div>
          </div>
        ) : !isPublic && !selectedRequest && !selectedFormal ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6 opacity-30 animate-in zoom-in-95">
            <div className="h-32 w-32 rounded-full bg-slate-100 flex items-center justify-center"><MessageSquare className="h-16 w-16" /></div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black uppercase">Panel de Analista</h3>
              <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Seleccione un turno o folio para iniciar la atención técnica en tiempo real.</p>
            </div>
          </div>
        ) : (
          <>
            <header className={cn("px-8 py-4 flex justify-between items-center z-10 shrink-0 border-b", isPublic ? "bg-white/60 backdrop-blur-3xl" : "bg-white shadow-sm")}>
              <div className="flex items-center gap-5">
                <div className={cn("h-14 w-14 rounded-2xl text-white flex items-center justify-center shadow-2xl transition-all", isPublic ? "bg-[#B38E5D]" : "bg-primary")}>
                  {isPublic ? <Bot className="h-7 w-7" /> : <UserCog className="h-7 w-7" />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase leading-none">{isPublic ? "Mesa de Ayuda ATRES" : "Centro de Control Operativo"}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline" className="text-[9px] font-mono border-primary/20 text-primary bg-primary/5 uppercase">SESIÓN: {activeChatId}</Badge>
                    {isPublic && (
                      <button onClick={() => setIsNewTicketDialogOpen(true)} className="flex items-center gap-2 bg-[#B38E5D] hover:bg-[#a67d4a] px-4 h-9 rounded-xl shadow-lg text-white font-black uppercase text-[9px] transition-all">
                        <FilePlus className="h-4 w-4" /> Solicitar Folio
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {!isPublic && (
                <Button onClick={() => {
                  setFinishForm({
                    cct: selectedFormal?.cct || selectedRequest?.remoteId || '',
                    schoolName: selectedFormal?.schoolName || 'ATENCION LIVE',
                    servicio: selectedFormal?.servicio || '',
                    municipio: '', valle: '', oficinaRegionalAtencion: ''
                  });
                  setIsFinishDialogOpen(true);
                }} className="btn-institutional h-11 px-8 text-[11px] gap-2 shadow-2xl">
                  <CheckCircle2 className="h-5 w-5" /> CONCLUIR ATENCIÓN
                </Button>
              )}
            </header>

            <ScrollArea className="flex-1 px-8 py-10">
              <div className="max-w-4xl mx-auto space-y-8 min-h-full flex flex-col justify-end pb-8">
                {messages.map((msg, i) => {
                  const isMe = (isPublic && msg.role === 'user') || (!isPublic && msg.role === 'tech');
                  return (
                    <div key={msg.id || i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-4", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn("flex gap-4 max-w-[85%]", isMe ? "flex-row-reverse" : "flex-row")}>
                        <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xl", msg.role === 'user' ? "bg-[#B38E5D] text-white" : msg.role === 'tech' ? "bg-[#9f2241] text-white" : "bg-slate-800 text-white")}>
                          {msg.role === 'user' ? <GraduationCap className="h-5 w-5" /> : msg.role === 'tech' ? <UserCog className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                        </div>
                        <div className={cn("p-4 rounded-3xl text-sm font-semibold shadow-2xl border leading-relaxed", isMe ? "bg-primary text-white rounded-tr-none border-transparent" : "bg-white text-slate-700 rounded-tl-none border-slate-100")}>
                          {msg.senderName && <p className="text-[8px] font-black uppercase mb-1 opacity-60">{msg.senderName}</p>}
                          {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                          {msg.fileData && (
                            <div className="mt-4 p-4 rounded-2xl border flex items-center gap-4 cursor-pointer bg-black/5 hover:bg-black/10 transition-colors" onClick={() => downloadFile(msg.fileData!, msg.fileName!)}>
                               <FileText className="h-5 w-5 text-rose-500" />
                               <div className="flex-1 min-w-0"><p className="text-[10px] font-black truncate uppercase">{msg.fileName}</p></div>
                               <Download className="h-4 w-4 opacity-50" />
                            </div>
                          )}
                          <div className="text-[8px] mt-3 font-black uppercase flex items-center gap-2 opacity-50">
                            <Clock className="h-3 w-3" /> {msg.timestamp?.seconds ? format(new Date(msg.timestamp.seconds * 1000), 'HH:mm') : '--:--'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {isBotThinking && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-slate-100 px-6 py-3 rounded-full flex gap-2 items-center">
                      <Bot className="h-4 w-4 text-slate-400" />
                      <span className="text-[10px] font-black uppercase text-slate-400">Analizando requerimiento...</span>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <footer className="p-6 bg-white/40 backdrop-blur-3xl border-t border-white/40 shrink-0">
              <div className="max-w-4xl mx-auto flex gap-4">
                <div className="relative flex-1 group">
                  <Input 
                    placeholder={isPublic ? "Describa su incidencia técnica..." : "Escriba su respuesta oficial..." } 
                    className="h-14 rounded-2xl bg-white border-2 border-slate-100 px-8 pr-14 font-semibold shadow-inner focus:ring-8 focus:ring-[#9f2241]/5 text-sm transition-all" 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()} 
                    disabled={isSending} 
                  />
                  <button onClick={() => fileInputRef.current?.click()} className="absolute right-5 top-3.5 h-7 w-7 text-slate-300 hover:text-primary transition-all flex items-center justify-center rounded-xl hover:bg-slate-50" disabled={isSending}>
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileUpload} />
                </div>
                <button 
                  onClick={() => handleSendMessage()} 
                  disabled={!input.trim() || isSending} 
                  className="h-14 w-14 rounded-2xl bg-[#9f2241] hover:bg-[#801a34] text-white shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center group"
                >
                  {isSending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6 group-hover:rotate-12 transition-transform" />}
                </button>
              </div>
            </footer>
          </>
        )}
      </div>

      {/* Diálogos de Soporte */}
      <Dialog open={isNewTicketDialogOpen} onOpenChange={setIsNewTicketDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[3rem] p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col border-none shadow-2xl">
          <DialogHeader className="p-8 bg-[#9f2241] text-white">
            <DialogTitle className="uppercase font-black text-2xl">Nuevo Folio de Atención</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-10 space-y-8">
             <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase text-slate-400">Identificación del Solicitante</Label>
               <Input placeholder="NOMBRE COMPLETO..." className="h-12 bg-slate-50 border-none rounded-xl text-xs font-black uppercase" value={requesterName} onChange={e => setRequesterName(e.target.value.toUpperCase())} />
               <Input placeholder="CCT DEL PLANTEL (10 DÍGITOS)..." className="h-12 bg-slate-50 border-none rounded-xl text-sm font-mono font-black" value={ticketCct} onChange={e => setTicketCct(e.target.value.toUpperCase())} maxLength={10} />
             </div>
             <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase text-slate-400">Motivo del Reporte</Label>
               <Select value={helpTopic} onValueChange={setHelpTopic}>
                 <SelectTrigger className="h-12 bg-slate-50 rounded-xl border-none font-black text-xs">
                   <SelectValue placeholder="SELECCIONAR TEMA..." />
                 </SelectTrigger>
                 <SelectContent className="rounded-2xl z-[300]">
                   <SelectItem value="cuenta" className="font-black text-[10px] uppercase">Cuentas Institucionales</SelectItem>
                   <SelectItem value="atres" className="font-black text-[10px] uppercase">Sistema de Seguimiento ATRES</SelectItem>
                   <SelectItem value="hardware" className="font-black text-[10px] uppercase">Soporte Hardware / Equipo</SelectItem>
                   <SelectItem value="redes" className="font-black text-[10px] uppercase">Red Local / Conectividad</SelectItem>
                 </SelectContent>
               </Select>
               <Textarea placeholder="DETALLES TÉCNICOS ADICIONALES..." className="h-32 bg-slate-50 border-none rounded-xl p-6 text-xs font-semibold shadow-inner resize-none" value={ticketDetail} onChange={e => setTicketDetail(e.target.value.toUpperCase())} />
             </div>
             <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center gap-2">
                <FileText className="h-8 w-8 text-slate-300" />
                <p className="text-[10px] font-black uppercase text-slate-500">{pdfFile ? pdfFile.name : "Adjuntar Oficio de Solicitud (PDF)"}</p>
                <Button variant="outline" size="sm" onClick={() => document.getElementById('ticket-pdf')?.click()} className="h-9 px-6 rounded-xl text-[9px] font-black uppercase border-slate-300">{pdfFile ? "Cambiar Archivo" : "Seleccionar Archivo"}</Button>
                <input type="file" id="ticket-pdf" className="hidden" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
             </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t shrink-0">
            <Button onClick={handleSendNewTicketRequest} disabled={isSending} className="w-full btn-institutional h-14">
              {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />} GENERAR SOLICITUD OFICIAL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[3rem] p-10 bg-white text-center border-none shadow-2xl">
            <div className="h-20 w-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="h-10 w-10 text-emerald-500" /></div>
            <DialogTitle className="text-2xl font-black uppercase text-primary">Folio Registrado</DialogTitle>
            <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-primary/10 shadow-inner my-8">
               <p className="text-[10px] font-black text-primary uppercase mb-2">FOLIO ASIGNADO</p>
               <h4 className="text-3xl font-black text-slate-800 font-mono tracking-tighter">{lastGeneratedFolio}</h4>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed mb-8 px-4">Utilice este número para cualquier aclaración posterior. Su reporte ya se encuentra en la bitácora oficial.</p>
            <Button onClick={() => setIsConfirmationOpen(false)} className="w-full btn-institutional h-14 shadow-2xl">ENTENDIDO</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-0 overflow-hidden bg-white border-none shadow-2xl">
          <DialogHeader className="p-8 bg-[#9f2241] text-white">
            <DialogTitle className="uppercase font-black text-lg">Concluir Atención Técnica</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Oficina Regional Responsable</Label>
              <Select value={finishForm.oficinaRegionalAtencion} onValueChange={v => setFinishForm({...finishForm, oficinaRegionalAtencion: v})} disabled={isSending}>
                <SelectTrigger className="h-10 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase shadow-inner">
                  <SelectValue placeholder="ELEGIR OFICINA..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl z-[300]">
                  {REGIONAL_OFFICES.map(off => <SelectItem key={`off-${off}`} value={off} className="text-[10px] font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>)}
                </SelectContent>
              </Select>
              <Label className="text-[10px] font-black uppercase text-primary pl-1">Resumen del Servicio Realizado</Label>
              <Textarea placeholder="DETALLE LAS ACCIONES TÉCNICAS..." className="h-24 bg-slate-50 border-none rounded-2xl p-4 text-[11px] font-semibold shadow-inner focus:bg-white transition-all resize-none uppercase" value={finishForm.servicio} onChange={e => setFinishForm({...finishForm, servicio: e.target.value.toUpperCase()})} disabled={isSending} />
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4 shrink-0">
            <Button onClick={handleFinishConfirm} disabled={isSending} className="btn-institutional h-12 px-10 text-[10px] gap-2 shadow-2xl">
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5" />} REGISTRAR CIERRE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
