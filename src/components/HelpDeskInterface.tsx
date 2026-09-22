
'use client';
/**
 * @fileOverview Interfaz de Mesa de Ayuda ATRES Live.
 * - Chat en tiempo real, Transferencia de técnicos, SLA, Gestión de evidencias y Reportes.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Send, 
  Bot, 
  MessageSquare,
  Clock,
  Loader2,
  Monitor,
  Laptop,
  Power,
  FileUp,
  Activity,
  User,
  Settings,
  Paperclip,
  Navigation,
  Search,
  X,
  ShieldCheck,
  AlertCircle,
  Download,
  Globe,
  Bell,
  Volume2,
  ChevronRight,
  MonitorCheck,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Users,
  FileText,
  Star,
  RefreshCw,
  Share2,
  ArrowRightLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { db } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  doc, 
  setDoc,
  serverTimestamp,
  Timestamp,
  where,
  addDoc,
  orderBy,
  deleteDoc,
  limit
} from 'firebase/firestore';
import Image from 'next/image';
import { type SupportRequestLive } from '@/lib/planning-data';

type Message = {
  id?: string;
  role: 'user' | 'tech' | 'bot';
  content: string;
  timestamp: any;
  senderName?: string;
  fileUrl?: string;
  fileName?: string;
};

const PRIORITIES = [
  { id: 'low', label: 'Baja', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'medium', label: 'Media', color: 'bg-blue-100 text-blue-700' },
  { id: 'high', label: 'Alta', color: 'bg-amber-100 text-amber-700' },
  { id: 'critical', label: 'Crítica', color: 'bg-rose-100 text-rose-700 animate-pulse' }
];

const CATEGORIES = [
  { id: 'atres', label: 'Sistema ATRES' },
  { id: 'accounts', label: 'Cuentas @desysa' },
  { id: 'network', label: 'Red Local / Edusat' },
  { id: 'hardware', label: 'Mantenimiento' }
];

export function HelpDeskInterface({ isPublic = false }: { isPublic?: boolean }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [queue, setQueue] = useState<SupportRequestLive[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequestLive | null>(null);
  const [activeView, setActiveView] = useState<'chat' | 'remote' | 'dashboard' | 'reports'>('chat');
  const [techName, setTechName] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // User Registration State
  const [userData, setUserData] = useState({ name: '', cct: '' });
  const [hasJoined, setHasJoined] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [rating, setRating] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alertedIds = useRef(new Set<string>());
  const isInitialLoad = useRef(true);
  
  const supportUrl = typeof window !== 'undefined' ? `${window.location.origin}/helpdesk` : '';

  useEffect(() => {
    setMounted(true);
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.load();
    audioRef.current = audio;
  }, []);

  // ANALYST: Listen for all support requests
  useEffect(() => {
    if (!mounted || isPublic) return;
    
    setTechName(localStorage.getItem('userRfc') || 'ANALISTA TÉCNICO');
    
    const q = query(collection(db, 'support_queue'), orderBy('lastActivity', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const activeQueue = snap.docs
        .map(d => ({ ...d.data(), id: d.id } as SupportRequestLive))
        .filter(req => req.status !== 'closed');
      
      setQueue(activeQueue);

      // Manejo de Alertas para el Técnico
      if (isInitialLoad.current) {
        snap.docs.forEach(d => alertedIds.current.add(d.id));
        isInitialLoad.current = false;
        return;
      }

      snap.docChanges().forEach((change) => {
        const data = change.doc.data() as SupportRequestLive;
        const id = change.doc.id;

        if (change.type === "added" && data.status === 'pending') {
          if (!alertedIds.current.has(id)) {
            alertedIds.current.add(id);
            
            toast({
              title: "⚠️ SOLICITUD ENTRANTE",
              description: `${data.userName} - ${data.cct}`,
              className: "bg-[#9f2241] text-white border-none shadow-2xl font-black rounded-[2rem] p-6 ring-4 ring-white/20",
              duration: 20000,
              action: (
                <Button 
                  onClick={() => setSelectedRequest({ ...data, id } as any)} 
                  className="bg-white text-[#9f2241] hover:bg-slate-100 font-black uppercase text-[10px] rounded-xl px-6 h-10 shadow-xl"
                >
                  ATENDER AHORA
                </Button>
              )
            });

            if (audioRef.current && soundEnabled) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => {
                console.log("Audio play blocked by browser policies.");
              });
            }
          }
        }
      });
    }, (error) => {
      console.error("Queue listen error:", error);
    });

    return () => unsubscribe();
  }, [isPublic, toast, mounted, soundEnabled]);

  // CHAT: Listen for messages
  useEffect(() => {
    if (!mounted || !selectedRequest) {
      setMessages([]);
      return;
    }
    
    const q = query(
      collection(db, 'chat_messages'), 
      where('chatId', '==', selectedRequest.id)
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ ...d.data(), id: d.id } as Message));
      setMessages(msgs.sort((a, b) => {
        const tA = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : Date.now();
        const tB = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : Date.now();
        return tA - tB;
      }));
    }, (error) => {
      console.error("Messages listen error:", error);
    });

    return () => unsubscribe();
  }, [mounted, selectedRequest]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoinSupport = async () => {
    if (!userData.name.trim() || !userData.cct.trim()) {
      toast({ variant: "destructive", title: "Campos incompletos", description: "Por favor ingrese su nombre y CCT oficial." });
      return;
    }
    
    setIsJoining(true);
    const requestId = `REQ-${Date.now()}`;
    const ticketNum = `ATRES-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const requestData: any = {
      userName: userData.name.toUpperCase(),
      cct: userData.cct.toUpperCase(),
      status: 'pending',
      priority: 'medium',
      category: 'atres',
      lastActivity: serverTimestamp(),
      createdAt: serverTimestamp(),
      lastMessage: '🔔 Nueva solicitud entrante...',
      ticketNumber: ticketNum,
      slaLimit: 30
    };
    
    try {
      // Intentar una escritura pequeña para validar conexión antes de cambiar el estado de la UI
      await setDoc(doc(db, 'support_queue', requestId), requestData);
      
      await addDoc(collection(db, 'chat_messages'), {
        chatId: requestId,
        role: 'bot',
        content: `Hola ${userData.name.toUpperCase()}, bienvenido a ATRES Live. Su ticket es ${ticketNum}. Un analista técnico ha sido notificado y se conectará en breve.`,
        timestamp: serverTimestamp()
      });

      setSelectedRequest({ ...requestData, id: requestId, lastActivity: new Date(), createdAt: new Date() } as any);
      setHasJoined(true);
      toast({ title: "Central Notificada", description: "Iniciando comunicación segura..." });
    } catch (error: any) {
      console.error("Join Support Error:", error);
      setIsJoining(false); // Liberar spinner en caso de error
      toast({ 
        variant: "destructive", 
        title: "Falla de Comunicación", 
        description: "El sistema no pudo conectar con el servidor. Intente refrescar la página o verifique su conexión." 
      });
    }
  };

  const handleSendMessage = async (fileData?: { url: string, name: string }) => {
    if ((!input.trim() && !fileData) || !selectedRequest) return;
    setIsSending(true);

    try {
      await setDoc(doc(db, 'support_queue', selectedRequest.id), { 
        lastActivity: serverTimestamp(), 
        lastMessage: fileData ? `📎 Archivo: ${fileData.name}` : input.substring(0, 50),
        status: isPublic ? 'pending' : 'attending'
      }, { merge: true });

      await addDoc(collection(db, 'chat_messages'), {
        chatId: selectedRequest.id,
        role: isPublic ? 'user' : 'tech',
        content: input,
        timestamp: serverTimestamp(),
        senderName: isPublic ? userData.name : techName,
        fileUrl: fileData?.url,
        fileName: fileData?.name
      });

      setInput('');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error al enviar mensaje" });
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedRequest) return;
    if (confirm("¿Confirmar resolución del ticket?")) {
      try {
        await setDoc(doc(db, 'support_queue', selectedRequest.id), { 
          status: 'closed',
          lastActivity: serverTimestamp()
        }, { merge: true });
        
        if (isPublic) setShowSurvey(true);
        else setSelectedRequest(null);
        
        toast({ title: "Ticket Cerrado Correctamente" });
      } catch (error: any) {
        toast({ variant: "destructive", title: "Error al cerrar ticket" });
      }
    }
  };

  const handleTransfer = async () => {
    const tech = prompt("Ingrese RFC del técnico a transferir:");
    if (tech && selectedRequest) {
      try {
        await setDoc(doc(db, 'support_queue', selectedRequest.id), { 
          assignedTo: tech.toUpperCase(),
          lastMessage: `🔄 Transferido a ${tech.toUpperCase()}`
        }, { merge: true });
        toast({ title: "Ticket Transferido" });
        setSelectedRequest(null);
      } catch (error: any) {
        toast({ variant: "destructive", title: "Error en la transferencia" });
      }
    }
  };

  const statsSLA = useMemo(() => {
    if (queue.length === 0) return { pending: 0, critical: 0 };
    return {
      pending: queue.filter(r => r.status === 'pending').length,
      critical: queue.filter(r => r.priority === 'critical').length
    };
  }, [queue]);

  if (!mounted) return null;

  // PUBLIC VIEW
  if (isPublic) {
    if (!hasJoined) {
      return (
        <div className="h-full w-full bg-slate-100 flex items-center justify-center p-6">
          <Card className="w-full max-w-[450px] rounded-[3rem] border-none shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700">
             <div className="p-10 bg-[#9f2241] text-white text-center space-y-4">
                <div className="h-20 w-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto border border-white/10 shadow-inner">
                   <Monitor className="h-10 w-10 text-white" />
                </div>
                <div>
                   <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">ATRES LIVE</h2>
                   <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Mesa de Ayuda • Edoméx 2026</p>
                </div>
             </div>
             <div className="p-10 bg-white space-y-6">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Nombre Completo</Label>
                   <Input 
                      placeholder="EJ. JUAN PÉREZ..." 
                      className="h-12 rounded-xl bg-slate-50 border-none font-bold uppercase focus:ring-2 focus:ring-primary/20 transition-all" 
                      value={userData.name} 
                      onChange={e => setUserData({...userData, name: e.target.value})} 
                      disabled={isJoining} 
                   />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">CCT del Plantel</Label>
                   <Input 
                      placeholder="15DESXXXXX" 
                      className="h-12 rounded-xl bg-slate-50 border-none font-mono font-black uppercase text-primary focus:ring-2 focus:ring-primary/20 transition-all" 
                      value={userData.cct} 
                      onChange={e => setUserData({...userData, cct: e.target.value})} 
                      maxLength={10} 
                      disabled={isJoining} 
                   />
                </div>
                <Button onClick={handleJoinSupport} disabled={isJoining} className="w-full btn-institutional h-14 shadow-2xl mt-4">
                   {isJoining ? (
                     <div className="flex items-center gap-3">
                        <Loader2 className="animate-spin h-5 w-5" />
                        <span>SINCRONIZANDO...</span>
                     </div>
                   ) : "INICIAR SOPORTE EN VIVO"}
                </Button>
                <p className="text-[8px] font-bold text-slate-400 text-center uppercase tracking-widest leading-relaxed">Conexión cifrada de extremo a extremo • Central de Soporte COEES</p>
             </div>
          </Card>
        </div>
      );
    }

    if (showSurvey) {
      return (
        <div className="h-full w-full bg-white flex flex-col items-center justify-center p-10 text-center space-y-8 animate-in zoom-in-95 duration-500">
           <div className="h-24 w-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl"><CheckCircle2 className="h-14 w-14" /></div>
           <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Soporte Concluido</h2>
              <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">Su opinión es fundamental para mejorar nuestra atención técnica.</p>
           </div>
           <div className="flex gap-4 justify-center">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} className={cn("h-16 w-16 rounded-2xl flex items-center justify-center transition-all shadow-lg", rating >= s ? "bg-amber-400 text-white scale-110" : "bg-slate-100 text-slate-300 hover:bg-slate-200")}>
                   <Star className={cn("h-8 w-8", rating >= s ? "fill-current" : "")} />
                </button>
              ))}
           </div>
           {rating > 0 && (
             <Button onClick={() => window.location.reload()} className="btn-institutional h-14 px-12 animate-in slide-in-from-bottom-4">ENVIAR Y FINALIZAR</Button>
           )}
        </div>
      );
    }

    return (
      <div className="flex h-full w-full bg-[#efe7dd] overflow-hidden">
        <aside className="w-80 bg-white border-r flex flex-col shrink-0">
           <div className="p-8 bg-slate-50 border-b flex flex-col gap-4">
              <div>
                 <h3 className="text-lg font-black text-[#9f2241] uppercase leading-none">Ticket Activo</h3>
                 <p className="text-[10px] font-black text-primary/40 mt-1 uppercase tracking-widest">{selectedRequest?.ticketNumber}</p>
              </div>
              <Badge className="bg-emerald-500 text-white w-fit px-3 h-5 rounded-full animate-pulse border-none shadow-md">En línea</Badge>
           </div>
           <div className="p-8 space-y-6">
              <div className="space-y-4">
                 <Label className="text-[10px] font-black uppercase text-slate-400">Guía de Conexión</Label>
                 {[
                   "Descargue AnyDesk en su PC.",
                   "Localice su ID de 9 dígitos.",
                   "Envíelo por este chat.",
                   "No cierre esta ventana."
                 ].map((t, i) => (
                   <div key={i} className="flex gap-3 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="h-6 w-6 rounded-lg bg-[#9f2241] text-white flex items-center justify-center text-[10px] font-black shadow-lg">{i+1}</div>
                      <p className="text-[11px] font-bold text-slate-600 uppercase">{t}</p>
                   </div>
                 ))}
              </div>
              <Button onClick={handleCloseTicket} variant="outline" className="w-full h-12 border-rose-200 text-rose-600 font-black rounded-xl hover:bg-rose-50 uppercase text-[10px]">Solicitar Cierre</Button>
           </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
           <header className="h-16 bg-white/95 backdrop-blur-md border-b px-8 flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-4">
                 <Avatar className="h-10 w-10 border-2 border-emerald-500 shadow-sm">
                    <AvatarFallback className="bg-slate-100 text-slate-400"><Bot /></AvatarFallback>
                 </Avatar>
                 <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase leading-none">Central ATRES</h4>
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-1">Analista en Línea</span>
                 </div>
              </div>
           </header>

           <ScrollArea className="flex-1 px-8 py-8">
              <div className="max-w-4xl mx-auto space-y-4">
                 <div className="flex justify-center mb-8"><Badge className="bg-white/50 text-slate-500 border-none font-bold text-[9px] uppercase px-6 h-6 rounded-full shadow-sm">Sesión técnica iniciada • {format(new Date(), "d 'de' MMMM", { locale: es })}</Badge></div>
                 {messages.map((m, i) => (
                   <div key={i} className={cn("flex w-full animate-in fade-in", m.role === 'user' ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[75%] p-5 rounded-[1.8rem] shadow-lg relative", m.role === 'user' ? "bg-[#dcf8c6] rounded-tr-none border-emerald-100" : m.role === 'bot' ? "bg-slate-800 text-white rounded-tl-none border-none" : "bg-white rounded-tl-none border-slate-200")}>
                         {m.fileUrl ? (
                            <div className="space-y-3">
                               <div className="h-40 w-full relative rounded-xl overflow-hidden bg-slate-100"><Image src={m.fileUrl} alt="Adjunto" fill className="object-cover" /></div>
                               <Button size="sm" variant="ghost" className="h-7 text-[9px] font-black uppercase w-full bg-black/5" onClick={() => window.open(m.fileUrl)}><Download className="h-3 w-3 mr-2" /> Descargar</Button>
                            </div>
                         ) : <p className="text-sm font-semibold leading-relaxed">{m.content}</p>}
                         <div className="text-[8px] font-black uppercase opacity-30 text-right mt-2">{m.timestamp instanceof Timestamp ? format(m.timestamp.toDate(), 'HH:mm') : '...'}</div>
                      </div>
                   </div>
                 ))}
                 <div ref={scrollRef} />
              </div>
           </ScrollArea>

           <footer className="p-6 bg-white border-t flex gap-4">
              <div className="relative flex-1">
                 <Input 
                   value={input} 
                   onChange={e => setInput(e.target.value)} 
                   onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                   placeholder="Escriba su duda técnica o pegue su ID..." 
                   className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner px-8 font-bold text-sm uppercase focus:bg-white"
                 />
                 <button className="absolute right-4 top-4 text-slate-300 hover:text-primary transition-colors"><Paperclip className="h-6 w-6" /></button>
              </div>
              <Button onClick={() => handleSendMessage()} disabled={isSending || !input.trim()} className="h-14 w-14 rounded-2xl bg-[#128c7e] hover:bg-[#075e54] shadow-xl p-0 transition-transform active:scale-90">
                 {isSending ? <Loader2 className="animate-spin h-6 w-6" /> : <Send className="h-6 w-6 text-white" />}
              </Button>
           </footer>
        </div>
      </div>
    );
  }

  // ANALYST VIEW
  return (
    <div className="flex h-full w-full bg-white overflow-hidden font-sans">
      <aside className="w-16 bg-[#0b4135] flex flex-col items-center py-8 gap-6 shrink-0 z-50 shadow-2xl">
        <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-white/10 shadow-inner group overflow-hidden">
           <ShieldCheck className="h-7 w-7 transition-transform group-hover:scale-110" />
        </div>
        <div className="flex-1 flex flex-col gap-4">
           {[ 
             { id: 'chat', icon: MessageSquare, label: 'Chat' }, 
             { id: 'dashboard', icon: BarChart3, label: 'Panel' },
             { id: 'reports', icon: FileText, label: 'Reportes' }
           ].map(item => (
             <button 
               key={item.id} 
               onClick={() => setActiveView(item.id as any)}
               className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all relative group", activeView === item.id ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "text-white/30 hover:bg-white/5")}
               title={item.label}
             >
               <item.icon className="h-6 w-6" />
               <span className="absolute left-16 bg-slate-800 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] whitespace-nowrap shadow-2xl">{item.label}</span>
             </button>
           ))}
        </div>
        <button 
           onClick={() => { 
             setSoundEnabled(!soundEnabled); 
             if (!soundEnabled) {
               audioRef.current?.play().catch(() => null); // Force unlock on interaction
             }
           }} 
           className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all", soundEnabled ? "bg-amber-500 text-white animate-pulse" : "text-white/20 bg-white/5")}
        >
          {soundEnabled ? <Volume2 className="h-6 w-6" /> : <Bell className="h-6 w-6" />}
        </button>
      </aside>

      <div className="w-[380px] bg-slate-50 border-r flex flex-col shrink-0">
        <div className="p-8 bg-white border-b flex items-center justify-between">
           <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Bandeja de Entrada</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sesiones Activas</p>
           </div>
           <Badge className="bg-[#9f2241] text-white text-[11px] font-black h-7 px-3 rounded-xl shadow-lg">{queue.length}</Badge>
        </div>
        <div className="p-4 border-b bg-white">
           <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
              <Input placeholder="BUSCAR DOCENTE O CCT..." className="h-10 pl-10 rounded-xl bg-slate-50 border-none shadow-inner text-[10px] font-black uppercase" />
           </div>
        </div>
        <ScrollArea className="flex-1">
           <div className="p-3 space-y-2">
             {queue.map((req) => (
               <button 
                 key={req.id} 
                 onClick={() => { setSelectedRequest(req); if (alertedIds.current.has(req.id)) alertedIds.current.add(req.id); }}
                 className={cn("w-full p-5 rounded-[2.5rem] text-left transition-all flex items-center gap-5 border-2 group", selectedRequest?.id === req.id ? "bg-white border-[#9f2241] shadow-2xl scale-[1.02]" : "border-transparent hover:bg-white hover:shadow-xl")}
               >
                  <div className="relative">
                    <Avatar className="h-14 w-14 border-4 border-white shadow-xl">
                      <AvatarFallback className={cn("text-white font-black text-sm", req.status === 'pending' ? "bg-rose-500 animate-pulse" : "bg-slate-400")}>
                         {req.userName?.slice(0, 2) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn("absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white", req.status === 'pending' ? "bg-rose-500" : "bg-emerald-500")} />
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-700 uppercase truncate">{req.userName}</span>
                        <span className="text-[8px] font-bold text-slate-300">{req.lastActivity instanceof Timestamp ? format(req.lastActivity.toDate(), 'HH:mm') : '...'}</span>
                     </div>
                     <p className="text-[10px] font-bold text-slate-400 truncate uppercase mt-1">{req.lastMessage || 'Esperando respuesta...'}</p>
                     <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[7px] font-black border-slate-200 text-primary h-4 px-1.5 uppercase">{req.cct}</Badge>
                        {PRIORITIES.map(p => p.id === req.priority && <div key={p.id} className={cn("h-1.5 w-1.5 rounded-full", p.color.split(' ')[0])} />)}
                     </div>
                  </div>
               </button>
             ))}
             {queue.length === 0 && (
               <div className="py-20 text-center opacity-20"><MessageSquare className="h-12 w-12 mx-auto mb-4" /><p className="text-[10px] font-black uppercase">Sin sesiones activas</p></div>
             )}
           </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden">
        {selectedRequest ? (
          activeView === 'chat' ? (
            <>
              <header className="h-20 bg-white/95 backdrop-blur-md border-b px-10 flex items-center justify-between shrink-0 shadow-sm z-30">
                 <div className="flex items-center gap-6">
                    <Avatar className="h-12 w-12 shadow-xl border-2 border-emerald-500"><AvatarFallback className="bg-slate-100 text-slate-400">{selectedRequest.userName?.at(0)}</AvatarFallback></Avatar>
                    <div className="flex flex-col">
                       <h3 className="text-base font-black text-slate-800 uppercase leading-none tracking-tight">{selectedRequest.userName}</h3>
                       <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Activo</span>
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">•</span>
                          <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest">{selectedRequest.ticketNumber}</span>
                       </div>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="flex bg-slate-50 p-1.5 rounded-2xl border gap-1">
                       {PRIORITIES.map(p => (
                         <button 
                           key={p.id} 
                           onClick={() => setDoc(doc(db, 'support_queue', selectedRequest.id), { priority: p.id }, { merge: true })}
                           className={cn("h-8 px-4 rounded-xl text-[9px] font-black uppercase transition-all", selectedRequest.priority === p.id ? p.color + " shadow-md scale-105" : "text-slate-400 hover:text-slate-600")}
                         >
                           {p.label}
                         </button>
                       ))}
                    </div>
                    <div className="h-10 w-px bg-slate-200 mx-2" />
                    <Button onClick={handleTransfer} variant="outline" className="h-11 px-6 rounded-2xl text-[10px] font-black gap-2 border-slate-200"><ArrowRightLeft className="h-4 w-4" /> TRANSFERIR</Button>
                    <Button onClick={handleCloseTicket} className="btn-institutional h-11 px-8 rounded-2xl text-[10px] gap-2 shadow-xl"><CheckCircle2 className="h-4 w-4" /> RESOLVER</Button>
                 </div>
              </header>

              <ScrollArea className="flex-1 px-10 py-10 bg-[#efe7dd] shadow-inner relative">
                 <div className="max-w-5xl mx-auto space-y-4">
                    <div className="flex justify-center mb-8"><Badge className="bg-white/50 text-slate-500 border-none font-bold text-[9px] uppercase px-6 h-6 rounded-full shadow-sm">Sesión técnica iniciada • {format(new Date(), "d 'de' MMMM", { locale: es })}</Badge></div>
                    {messages.map((m, i) => (
                      <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2", m.role === 'tech' ? "justify-end" : "justify-start")}>
                         <div className={cn("max-w-[70%] p-6 rounded-[2.2rem] shadow-xl relative group", m.role === 'tech' ? "bg-[#e1ffc7] rounded-tr-none border-emerald-100" : m.role === 'bot' ? "bg-slate-800 text-white rounded-tl-none border-none" : "bg-white rounded-tl-none border-slate-200")}>
                            {m.fileUrl ? (
                              <div className="space-y-4">
                                 <div className="aspect-video w-full relative rounded-2xl overflow-hidden shadow-inner group-hover:scale-[1.02] transition-transform duration-500"><Image src={m.fileUrl} alt="Evidencia" fill className="object-cover" /></div>
                                 <div className="flex justify-between items-center gap-4 bg-black/5 p-3 rounded-xl"><span className="text-[10px] font-black uppercase truncate flex-1">{m.fileName}</span><Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => window.open(m.fileUrl)}><Download className="h-4 w-4" /></Button></div>
                              </div>
                            ) : <p className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">{m.content}</p>}
                            <div className="flex items-center justify-end gap-2 mt-3 opacity-40">
                               <span className="text-[9px] font-black uppercase">{m.timestamp instanceof Timestamp ? format(m.timestamp.toDate(), 'HH:mm') : '...'}</span>
                               {m.role === 'tech' && <MonitorCheck className="h-3 w-3 text-emerald-600" />}
                            </div>
                         </div>
                      </div>
                    ))}
                    <div ref={scrollRef}/>
                 </div>
              </ScrollArea>
              
              <footer className="p-8 bg-white border-t flex gap-5 shadow-2xl relative z-30">
                 <div className="relative flex-1 group">
                    <Input 
                      value={input} 
                      onChange={e => setInput(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()} 
                      className="rounded-3xl bg-slate-50 border-none h-16 px-10 font-bold text-base shadow-inner focus:bg-white transition-all pr-20" 
                      placeholder="Escribir respuesta técnica oficial..." 
                    />
                    <div className="absolute right-6 top-4 flex gap-2">
                       <button className="h-8 w-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors"><Paperclip className="h-5 w-5" /></button>
                    </div>
                 </div>
                 <Button onClick={() => handleSendMessage()} disabled={isSending || !input.trim()} className="bg-[#128c7e] hover:bg-[#075e54] h-16 w-16 rounded-3xl shadow-2xl p-0 transition-transform active:scale-90">
                    {isSending ? <Loader2 className="animate-spin h-7 w-7" /> : <Send className="h-7 w-7 text-white" />}
                 </Button>
              </footer>
            </>
          ) : activeView === 'dashboard' ? (
            <div className="flex-1 p-10 overflow-auto bg-slate-50 space-y-10">
               <div className="flex justify-between items-end border-b-4 border-primary/10 pb-6">
                  <div><h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter leading-none">Dashboard Operativo</h2><p className="text-lg font-bold text-slate-400 uppercase tracking-widest mt-2">Métricas SLA y Control de Calidad</p></div>
                  <Button variant="outline" className="h-12 px-8 rounded-2xl font-black text-[11px] gap-2"><RefreshCw className="h-5 w-5" /> ACTUALIZAR DATOS</Button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {[
                    { l: 'Tickets Activos', v: queue.length, i: MessageSquare, c: 'text-blue-600', b: 'bg-blue-50' },
                    { l: 'Alertas Críticas', v: statsSLA.critical, i: AlertCircle, c: 'text-rose-600', b: 'bg-rose-50' },
                    { l: 'Tiempo Promedio', v: '12 min', i: Clock, c: 'text-amber-600', b: 'bg-amber-50' },
                    { l: 'Satisfacción', v: '4.8/5', i: Star, c: 'text-emerald-600', b: 'bg-emerald-50' }
                  ].map((s, idx) => (
                    <Card key={idx} className="p-8 rounded-[3rem] border-none shadow-xl bg-white flex flex-col items-center text-center gap-4 group hover:scale-105 transition-all">
                       <div className={cn("h-16 w-16 rounded-[1.5rem] flex items-center justify-center shadow-inner", s.b, s.c)}><s.i className="h-8 w-8" /></div>
                       <div><h4 className="text-3xl font-black text-slate-800 leading-none">{s.v}</h4><p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-3">{s.l}</p></div>
                    </Card>
                  ))}
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="p-10 rounded-[3.5rem] border-none shadow-2xl bg-white space-y-8">
                     <div className="flex items-center gap-4 border-b pb-4"><TrendingUp className="h-6 w-6 text-primary" /><h3 className="text-sm font-black uppercase text-slate-700 tracking-widest">Capacidad de Respuesta (SLA)</h3></div>
                     <div className="space-y-6">
                        {['Nivel 1 (Inmediato)', 'Nivel 2 (Escalado)', 'Nivel 3 (Especializado)'].map((l, i) => (
                          <div key={l} className="space-y-3">
                             <div className="flex justify-between items-end"><span className="text-[10px] font-black uppercase text-slate-500">{l}</span><span className="text-xs font-black text-primary">{[85, 92, 78][i]}%</span></div>
                             <div className="h-3 bg-slate-100 rounded-full overflow-hidden"><div className={cn("h-full transition-all duration-1000", i === 0 ? "bg-emerald-500" : i === 1 ? "bg-blue-500" : "bg-amber-500")} style={{ width: `${[85, 92, 78][i]}%` }} /></div>
                          </div>
                        ))}
                     </div>
                  </Card>
                  <Card className="p-10 rounded-[3.5rem] border-none shadow-2xl bg-white flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-10 opacity-[0.03] scale-150 rotate-12"><Globe className="h-64 w-64" /></div>
                     <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-inner"><Activity className="h-12 w-12" /></div>
                     <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Estado de la Red</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monitorización Global de Servicios</p>
                     </div>
                     <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] px-6 h-8 rounded-full shadow-lg shadow-emerald-500/20">SISTEMAS OPERATIVOS</Badge>
                  </Card>
               </div>
            </div>
          ) : null
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white relative">
             <div className="absolute inset-0 bg-[#efe7dd]/20 pointer-events-none" />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-20 max-w-7xl w-full relative z-10">
                <div className="space-y-12 animate-in slide-in-from-left-10 duration-1000">
                   <div className="h-24 w-24 rounded-[2rem] bg-[#9f2241]/10 flex items-center justify-center text-[#9f2241] shadow-inner border border-primary/5">
                      <MonitorCheck className="h-12 w-12" />
                   </div>
                   <div className="space-y-4">
                      <h3 className="text-7xl font-black uppercase text-slate-800 tracking-tighter leading-none">ATRES LIVE</h3>
                      <p className="text-2xl font-bold uppercase tracking-[0.3em] text-[#B38E5D]">Central de Soporte Remoto</p>
                   </div>
                   <div className="grid grid-cols-1 gap-4">
                      {[
                        "Chat tipo WhatsApp en tiempo real",
                        "Tickets de soporte y prioridades",
                        "Transferencia entre técnicos",
                        "Adjunto de evidencias PDF/IMG",
                        "Dashboard ejecutivo y métricas SLA",
                        "Compatible con Laravel, PHP, Node, Firebase"
                      ].map((f, i) => (
                        <div key={i} className="flex items-center gap-4 group">
                           <div className="h-6 w-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><CheckCircle2 className="h-4 w-4" /></div>
                           <span className="text-sm font-black text-slate-600 uppercase tracking-wider">{f}</span>
                        </div>
                      ))}
                   </div>
                   <div className="p-8 bg-slate-50/80 backdrop-blur-md rounded-[3rem] border-2 border-slate-100 flex gap-6 shadow-2xl">
                      <div className="h-16 w-16 rounded-2xl bg-white shadow-xl flex items-center justify-center text-rose-600 shrink-0 border border-rose-50 animate-pulse">
                         <Bell className="h-9 w-9" />
                      </div>
                      <p className="text-xs font-bold text-slate-600 uppercase leading-relaxed mt-1">
                         Sistema de alerta temprana: Notificaciones automáticas visuales y sonoras por cada nueva solicitud de docente o coordinador.
                      </p>
                   </div>
                </div>

                <Card className="rounded-[4rem] border-none shadow-[0_50px_100px_rgba(0,0,0,0.1)] p-12 bg-slate-900 text-white relative overflow-hidden flex flex-col justify-center gap-10 group animate-in slide-in-from-right-10 duration-1000">
                   <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity duration-1000 scale-150 rotate-12"><Share2 className="h-64 w-64" /></div>
                   <div className="space-y-3 relative z-10 text-center">
                      <h4 className="text-3xl font-black uppercase tracking-tighter">LIGA DE SOPORTE</h4>
                      <p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.4em]">CANAL OFICIAL DE ATENCIÓN LIVE</p>
                   </div>
                   <div className="p-5 bg-white rounded-[3rem] shadow-2xl transform group-hover:rotate-2 group-hover:scale-105 transition-all duration-700 w-fit mx-auto relative z-10 border-[12px] border-slate-800">
                      <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(supportUrl)}`} alt="QR" width={180} height={180} className="rounded-2xl" />
                   </div>
                   <div className="space-y-6 relative z-10">
                      <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md space-y-3 text-center shadow-inner">
                         <Label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Enlace de acceso rápido:</Label>
                         <p className="text-[10px] font-mono text-white/60 font-bold truncate px-4">{supportUrl}</p>
                      </div>
                      <Button onClick={() => { navigator.clipboard.writeText(supportUrl); toast({ title: "Enlace Copiado al Portapapeles" }); }} className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black rounded-3xl gap-4 shadow-[0_20px_50px_rgba(16,185,129,0.3)] transition-all active:scale-95">
                         <Globe className="h-5 w-5" /> COPIAR LIGA INSTITUCIONAL
                      </Button>
                   </div>
                </Card>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
