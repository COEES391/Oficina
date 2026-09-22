
'use client';
/**
 * @fileOverview Interfaz de Mesa de Ayuda ATRES Live.
 * - Chat en tiempo real, Transferencia de técnicos, SLA, Gestión de evidencias y Reportes.
 * - Optimizado para alta disponibilidad y alertas instantáneas ante mensajes del usuario.
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
  Paperclip,
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
  BarChart3,
  Users,
  FileText,
  Star,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
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

export function HelpDeskInterface({ isPublic = false }: { isPublic?: boolean }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [queue, setQueue] = useState<SupportRequestLive[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequestLive | null>(null);
  const [activeView, setActiveView] = useState<'chat' | 'dashboard'>('chat');
  const [techName, setTechName] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const [userData, setUserData] = useState({ name: '', cct: '' });
  const [hasJoined, setHasJoined] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [rating, setRating] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alertedIds = useRef(new Set<string>());
  const lastUpdateRef = useRef<Map<string, number>>(new Map());
  const isInitialLoad = useRef(true);

  // Inicialización de Audio y Montaje
  useEffect(() => {
    setMounted(true);
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.load();
    audioRef.current = audio;
  }, []);

  // ANALISTA: Escucha de solicitudes y mensajes nuevos
  useEffect(() => {
    if (!mounted || isPublic) return;
    
    setTechName(localStorage.getItem('userRfc') || 'ANALISTA TÉCNICO');
    
    // Consulta optimizada para tiempo real
    const q = query(
      collection(db, 'support_queue'), 
      where('status', 'in', ['pending', 'attending']),
      orderBy('lastActivity', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const activeQueue = snap.docs.map(d => ({ ...d.data(), id: d.id } as SupportRequestLive));
      setQueue(activeQueue);

      if (isInitialLoad.current) {
        snap.docs.forEach(d => {
          const data = d.data();
          const time = data.lastActivity instanceof Timestamp ? data.lastActivity.toMillis() : Date.now();
          lastUpdateRef.current.set(d.id, time);
          alertedIds.current.add(d.id);
        });
        isInitialLoad.current = false;
        return;
      }

      snap.docChanges().forEach((change) => {
        const data = change.doc.data() as SupportRequestLive;
        const id = change.doc.id;
        const currentTime = data.lastActivity instanceof Timestamp ? data.lastActivity.toMillis() : Date.now();
        const lastKnownTime = lastUpdateRef.current.get(id) || 0;

        // Caso 1: Solicitud Nueva
        if (change.type === "added" && !alertedIds.current.has(id)) {
          alertedIds.current.add(id);
          triggerNotification("🔔 NUEVA SOLICITUD", `${data.userName} - ${data.cct}`, data, id);
        }

        // Caso 2: Mensaje nuevo del usuario
        if (change.type === "modified" && data.lastSenderRole === 'user' && currentTime > lastKnownTime) {
          // Solo alertar si el chat no está abierto actualmente por el técnico
          if (selectedRequest?.id !== id) {
            triggerNotification("💬 MENSAJE NUEVO", `${data.userName}: ${data.lastMessage}`, data, id);
          } else if (audioRef.current && soundEnabled) {
            playAlertSound();
          }
        }

        lastUpdateRef.current.set(id, currentTime);
      });
    });

    return () => unsubscribe();
  }, [isPublic, mounted, soundEnabled, selectedRequest]);

  const playAlertSound = () => {
    if (audioRef.current && soundEnabled) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => null);
    }
  };

  const triggerNotification = (title: string, desc: string, data: any, id: string) => {
    toast({
      title,
      description: desc,
      className: "bg-[#9f2241] text-white border-none shadow-2xl font-black rounded-[2rem] p-6 ring-4 ring-white/20",
      duration: 10000,
      action: (
        <Button 
          onClick={() => setSelectedRequest({ ...data, id } as any)} 
          className="bg-white text-[#9f2241] hover:bg-slate-100 font-black uppercase text-[10px] rounded-xl px-6 h-10 shadow-xl"
        >
          ATENDER
        </Button>
      )
    });
    playAlertSound();
  };

  // CHAT: Escucha de mensajes del hilo seleccionado
  useEffect(() => {
    if (!mounted || !selectedRequest) {
      setMessages([]);
      return;
    }
    
    const q = query(
      collection(db, 'chat_messages'), 
      where('chatId', '==', selectedRequest.id),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ ...d.data(), id: d.id } as Message));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [mounted, selectedRequest]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoinSupport = async () => {
    if (!userData.name.trim() || !userData.cct.trim()) {
      toast({ variant: "destructive", title: "Faltan datos", description: "Ingrese su nombre y CCT oficial." });
      return;
    }
    
    setIsJoining(true);
    const requestId = `REQ-${Date.now()}`;
    const ticketNum = `ATRES-${Math.floor(1000 + Math.random() * 9000)}`;
    
    try {
      const requestData: any = {
        userName: userData.name.toUpperCase(),
        cct: userData.cct.toUpperCase(),
        status: 'pending',
        priority: 'medium',
        category: 'atres',
        lastActivity: serverTimestamp(),
        createdAt: serverTimestamp(),
        lastMessage: '🔔 Usuario esperando analista...',
        lastSenderRole: 'user',
        ticketNumber: ticketNum,
        slaLimit: 30
      };
      
      // Escritura en lote para consistencia
      await setDoc(doc(db, 'support_queue', requestId), requestData);
      await addDoc(collection(db, 'chat_messages'), {
        chatId: requestId,
        role: 'bot',
        content: `Bienvenido(a) ${userData.name.toUpperCase()}. Tu folio de atención es: ${ticketNum}. En un momento un analista técnico te atenderá.`,
        timestamp: serverTimestamp()
      });

      setSelectedRequest({ ...requestData, id: requestId, lastActivity: new Date() } as any);
      setHasJoined(true);
      toast({ title: "Conectado", description: "Tu solicitud ha sido enviada a central." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error de red", description: "No se pudo establecer conexión con central." });
    } finally {
      setIsJoining(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedRequest) return;
    setIsSending(true);

    try {
      const content = input;
      setInput('');

      // 1. Actualizar estado de la cola (para que el técnico reciba la alerta)
      await setDoc(doc(db, 'support_queue', selectedRequest.id), { 
        lastActivity: serverTimestamp(), 
        lastMessage: content.substring(0, 60),
        lastSenderRole: isPublic ? 'user' : 'tech',
        status: isPublic && selectedRequest.status === 'pending' ? 'pending' : 'attending'
      }, { merge: true });

      // 2. Registrar el mensaje en el historial
      await addDoc(collection(db, 'chat_messages'), {
        chatId: selectedRequest.id,
        role: isPublic ? 'user' : 'tech',
        content: content,
        timestamp: serverTimestamp(),
        senderName: isPublic ? userData.name : techName
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Mensaje no enviado" });
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedRequest) return;
    if (confirm("¿Confirmas la resolución de este ticket?")) {
      try {
        await setDoc(doc(db, 'support_queue', selectedRequest.id), { 
          status: 'closed',
          lastActivity: serverTimestamp()
        }, { merge: true });
        
        if (isPublic) setShowSurvey(true);
        else setSelectedRequest(null);
        toast({ title: "Servicio Finalizado" });
      } catch (error) {
        toast({ variant: "destructive", title: "Error al cerrar" });
      }
    }
  };

  const statsSLA = useMemo(() => {
    return {
      pending: queue.filter(r => r.status === 'pending').length,
      attending: queue.filter(r => r.status === 'attending').length
    };
  }, [queue]);

  if (!mounted) return null;

  // --- VISTA PÚBLICA (USUARIO) ---
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
                   <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Tu Nombre Completo</Label>
                   <Input 
                      placeholder="ESCRIBE AQUÍ..." 
                      className="h-12 rounded-xl bg-slate-50 border-none font-bold uppercase" 
                      value={userData.name} 
                      onChange={e => setUserData({...userData, name: e.target.value})} 
                      disabled={isJoining} 
                   />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">CCT del Plantel</Label>
                   <Input 
                      placeholder="15DESXXXXX" 
                      className="h-12 rounded-xl bg-slate-50 border-none font-mono font-black uppercase text-primary" 
                      value={userData.cct} 
                      onChange={e => setUserData({...userData, cct: e.target.value})} 
                      maxLength={10} 
                      disabled={isJoining} 
                   />
                </div>
                <Button onClick={handleJoinSupport} disabled={isJoining} className="w-full btn-institutional h-14 shadow-2xl mt-4">
                   {isJoining ? <><Loader2 className="animate-spin h-5 w-5 mr-2" /> CONECTANDO...</> : "INICIAR SOPORTE EN VIVO"}
                </Button>
                <p className="text-[8px] font-bold text-slate-400 text-center uppercase tracking-widest leading-relaxed">Conexión cifrada segura • Central COEES</p>
             </div>
          </Card>
        </div>
      );
    }

    if (showSurvey) {
      return (
        <div className="h-full w-full bg-white flex flex-col items-center justify-center p-10 text-center space-y-8 animate-in zoom-in-95 duration-500">
           <div className="h-24 w-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl"><CheckCircle2 className="h-14 w-14" /></div>
           <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Soporte Concluido</h2>
           <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Tu opinión es vital para mejorar el servicio técnico</p>
           <div className="flex gap-4 justify-center">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} className={cn("h-16 w-16 rounded-2xl flex items-center justify-center transition-all shadow-lg", rating >= s ? "bg-amber-400 text-white scale-110" : "bg-slate-100 text-slate-300 hover:bg-slate-200")}>
                   <Star className={cn("h-8 w-8", rating >= s ? "fill-current" : "")} />
                </button>
              ))}
           </div>
           {rating > 0 && <Button onClick={() => window.location.reload()} className="btn-institutional h-14 px-12">FINALIZAR SESIÓN</Button>}
        </div>
      );
    }

    return (
      <div className="flex h-full w-full bg-[#efe7dd] overflow-hidden">
        <aside className="w-80 bg-white border-r flex flex-col shrink-0">
           <div className="p-8 bg-slate-50 border-b flex flex-col gap-4">
              <h3 className="text-lg font-black text-[#9f2241] uppercase leading-none">Ticket Activo</h3>
              <Badge className="bg-emerald-500 text-white w-fit px-3 h-5 rounded-full animate-pulse border-none shadow-md uppercase text-[9px] font-black">Conectado</Badge>
              <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest">{selectedRequest?.ticketNumber}</p>
           </div>
           <div className="p-8 space-y-4">
              <Label className="text-[10px] font-black uppercase text-slate-400">Instrucciones</Label>
              {["Explique su duda técnica", "Mantenga esta ventana abierta", "Espere confirmación del analista"].map((t, i) => (
                <div key={i} className="flex gap-3 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                   <div className="h-6 w-6 rounded-lg bg-[#9f2241] text-white flex items-center justify-center text-[10px] font-black">{i+1}</div>
                   <p className="text-[11px] font-bold text-slate-600 uppercase">{t}</p>
                </div>
              ))}
              <Button onClick={handleCloseTicket} variant="outline" className="w-full h-12 border-rose-200 text-rose-600 font-black rounded-xl uppercase text-[10px] mt-6 hover:bg-rose-50">Cerrar Sesión</Button>
           </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
           <header className="h-16 bg-white/95 backdrop-blur-md border-b px-8 flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-4">
                 <Avatar className="h-10 w-10 border-2 border-emerald-500 shadow-sm"><AvatarFallback className="bg-emerald-50 text-emerald-600"><Bot className="h-6 w-6" /></AvatarFallback></Avatar>
                 <div><h4 className="text-sm font-black text-slate-800 uppercase leading-none">Mesa de Ayuda</h4><span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Soporte en línea disponible</span></div>
              </div>
           </header>

           <ScrollArea className="flex-1 px-8 py-8">
              <div className="max-w-4xl mx-auto space-y-4">
                 {messages.map((m, i) => (
                   <div key={i} className={cn("flex w-full animate-in fade-in", m.role === 'user' ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[75%] p-5 rounded-[1.8rem] shadow-lg relative", m.role === 'user' ? "bg-[#dcf8c6] rounded-tr-none" : m.role === 'bot' ? "bg-slate-800 text-white rounded-tl-none" : "bg-white rounded-tl-none border border-slate-100")}>
                         <p className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">{m.content}</p>
                         <div className="text-[8px] font-black uppercase opacity-30 text-right mt-2">{m.timestamp instanceof Timestamp ? format(m.timestamp.toDate(), 'HH:mm') : '...'}</div>
                      </div>
                   </div>
                 ))}
                 <div ref={scrollRef} />
              </div>
           </ScrollArea>

           <footer className="p-6 bg-white border-t flex gap-4">
              <input 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escriba su duda técnica aquí..." 
                className="flex h-14 flex-1 rounded-2xl bg-slate-50 border-none px-8 font-bold text-sm uppercase focus:bg-white outline-none shadow-inner"
              />
              <Button onClick={() => handleSendMessage()} disabled={isSending || !input.trim()} className="h-14 w-14 rounded-2xl bg-[#128c7e] hover:bg-[#075e54] p-0 shadow-xl transition-transform active:scale-90">
                 {isSending ? <Loader2 className="animate-spin h-6 w-6" /> : <Send className="h-6 w-6 text-white" />}
              </Button>
           </footer>
        </div>
      </div>
    );
  }

  // --- VISTA ANALISTA (TÉCNICO) ---
  return (
    <div className="flex h-full w-full bg-white overflow-hidden font-sans">
      {/* Sidebar de Iconos */}
      <aside className="w-16 bg-[#0b4135] flex flex-col items-center py-8 gap-6 shrink-0 z-50 shadow-2xl">
        <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-white/10 shadow-inner">
           <ShieldCheck className="h-7 w-7" />
        </div>
        <div className="flex-1 flex flex-col gap-4">
           {[ 
             { id: 'chat', icon: MessageSquare }, 
             { id: 'dashboard', icon: BarChart3 }
           ].map(item => (
             <button 
               key={item.id} 
               onClick={() => setActiveView(item.id as any)}
               className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all", activeView === item.id ? "bg-emerald-500 text-white" : "text-white/30 hover:bg-white/5")}
             >
               <item.icon className="h-6 w-6" />
             </button>
           ))}
        </div>
        <button 
           onClick={() => setSoundEnabled(!soundEnabled)} 
           className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all", soundEnabled ? "bg-amber-500 text-white" : "text-white/20")}
        >
          {soundEnabled ? <Volume2 className="h-6 w-6" /> : <Bell className="h-6 w-6" />}
        </button>
      </aside>

      {/* Bandeja de Solicitudes */}
      <div className="w-[380px] bg-slate-50 border-r flex flex-col shrink-0">
        <div className="p-8 bg-white border-b flex items-center justify-between shrink-0">
           <div><h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">Bandeja ATRES</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Solicitudes Activas</p></div>
           <Badge className="bg-[#9f2241] text-white text-[11px] font-black h-7 px-3 rounded-xl shadow-lg shadow-[#9f2241]/20">{queue.length}</Badge>
        </div>
        <ScrollArea className="flex-1">
           <div className="p-3 space-y-2">
             {queue.map((req) => (
               <button 
                 key={req.id} 
                 onClick={() => setSelectedRequest(req)}
                 className={cn("w-full p-5 rounded-[2.5rem] text-left transition-all flex items-center gap-5 border-2", selectedRequest?.id === req.id ? "bg-white border-[#9f2241] shadow-xl scale-[1.02]" : "border-transparent hover:bg-white hover:shadow-md")}
               >
                  <div className="relative">
                    <Avatar className="h-14 w-14 border-4 border-white shadow-lg">
                      <AvatarFallback className={cn("text-white font-black text-sm", req.status === 'pending' ? "bg-rose-500 animate-pulse" : "bg-slate-400")}>
                         {req.userName?.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn("absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white", req.status === 'pending' ? "bg-rose-500" : "bg-emerald-500")} />
                  </div>
                  <div className="flex-1 min-w-0">
                     <span className="text-xs font-black text-slate-700 uppercase truncate block">{req.userName}</span>
                     <p className={cn("text-[10px] font-bold truncate uppercase mt-1", req.lastSenderRole === 'user' ? "text-primary font-black" : "text-slate-400")}>{req.lastMessage || 'Nueva solicitud...'}</p>
                     <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[7px] font-black border-slate-200 text-primary h-4 px-1.5 uppercase">{req.cct}</Badge>
                        <span className="text-[8px] font-bold text-slate-300 ml-auto">{req.lastActivity instanceof Timestamp ? format(req.lastActivity.toDate(), 'HH:mm') : ''}</span>
                     </div>
                  </div>
               </button>
             ))}
             {queue.length === 0 && (
                <div className="py-20 text-center opacity-30">
                   <RotateCcw className="h-10 w-10 mx-auto mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Esperando solicitudes...</p>
                </div>
             )}
           </div>
        </ScrollArea>
      </div>

      {/* Área de Chat o Dashboard */}
      <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden">
        {selectedRequest ? (
          activeView === 'chat' ? (
            <>
              <header className="h-20 bg-white/95 backdrop-blur-md border-b px-10 flex items-center justify-between shrink-0 shadow-sm z-30">
                 <div className="flex items-center gap-6">
                    <Avatar className="h-12 w-12 shadow-xl border-2 border-emerald-500"><AvatarFallback className="bg-slate-100 text-slate-400">{selectedRequest.userName?.at(0)}</AvatarFallback></Avatar>
                    <div className="flex flex-col">
                       <h3 className="text-base font-black text-slate-800 uppercase leading-none">{selectedRequest.userName}</h3>
                       <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 mt-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Atendiendo • {selectedRequest.ticketNumber}</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">CCT Origen</p>
                       <p className="text-xs font-black text-primary uppercase">{selectedRequest.cct}</p>
                    </div>
                    <Button onClick={handleCloseTicket} className="btn-institutional h-11 px-8 rounded-2xl text-[10px] shadow-xl">RESOLVER Y CERRAR</Button>
                 </div>
              </header>

              <ScrollArea className="flex-1 px-10 py-10 bg-[#efe7dd] shadow-inner relative">
                 <div className="max-w-5xl mx-auto space-y-4">
                    {messages.map((m, i) => (
                      <div key={i} className={cn("flex w-full animate-in slide-in-from-bottom-2", m.role === 'tech' ? "justify-end" : "justify-start")}>
                         <div className={cn("max-w-[70%] p-6 rounded-[2.2rem] shadow-xl relative", m.role === 'tech' ? "bg-[#e1ffc7] rounded-tr-none" : m.role === 'bot' ? "bg-slate-800 text-white rounded-tl-none" : "bg-white rounded-tl-none border border-slate-100")}>
                            <p className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">{m.content}</p>
                            <div className="text-[8px] font-black uppercase opacity-30 text-right mt-3">
                               {m.timestamp instanceof Timestamp ? format(m.timestamp.toDate(), 'HH:mm') : '...'}
                            </div>
                         </div>
                      </div>
                    ))}
                    <div ref={scrollRef}/>
                 </div>
              </ScrollArea>
              
              <footer className="p-8 bg-white border-t flex gap-5 shadow-2xl relative z-30">
                 <Input 
                   value={input} 
                   onChange={e => setInput(e.target.value)} 
                   onKeyDown={e => e.key === 'Enter' && handleSendMessage()} 
                   className="rounded-3xl bg-slate-50 border-none h-16 px-10 font-bold text-base shadow-inner focus:bg-white flex-1" 
                   placeholder="Responder a usuario..." 
                 />
                 <Button onClick={() => handleSendMessage()} disabled={isSending || !input.trim()} className="bg-[#128c7e] hover:bg-[#075e54] h-16 w-16 rounded-3xl shadow-2xl p-0 transition-transform active:scale-90">
                    {isSending ? <Loader2 className="animate-spin h-7 w-7" /> : <Send className="h-7 w-7 text-white" />}
                 </Button>
              </footer>
            </>
          ) : (
            <div className="flex-1 p-10 bg-slate-50 space-y-10 animate-in fade-in">
               <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Resumen Operativo</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="p-8 rounded-[3rem] border-none shadow-xl bg-white flex flex-col items-center gap-4">
                     <div className="h-16 w-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600"><Bell className="h-8 w-8" /></div>
                     <h4 className="text-4xl font-black text-slate-800">{statsSLA.pending}</h4>
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Solicitudes Pendientes</p>
                  </Card>
                  <Card className="p-8 rounded-[3rem] border-none shadow-xl bg-white flex flex-col items-center gap-4">
                     <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600"><Users className="h-8 w-8" /></div>
                     <h4 className="text-4xl font-black text-slate-800">{statsSLA.attending}</h4>
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">En Atención Ahora</p>
                  </Card>
               </div>
            </div>
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white text-center space-y-8 animate-in fade-in duration-1000">
             <div className="h-24 w-24 rounded-[2.5rem] bg-[#9f2241]/10 flex items-center justify-center text-[#9f2241] shadow-inner mb-4">
                <MonitorCheck className="h-12 w-12" />
             </div>
             <h3 className="text-6xl font-black uppercase text-slate-800 tracking-tighter leading-none">ATRES LIVE</h3>
             <p className="text-xl font-bold uppercase tracking-[0.3em] text-[#B38E5D]">Central de Soporte Técnico</p>
             <div className="p-8 bg-slate-50 rounded-[3rem] border-2 border-slate-100 flex gap-6 shadow-xl max-w-xl text-left">
                <div className="h-16 w-16 rounded-2xl bg-white shadow-xl flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-50 animate-pulse"><Volume2 className="h-9 w-9" /></div>
                <div>
                   <p className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Sistema de Monitoreo Activo</p>
                   <p className="text-xs font-bold text-slate-400 uppercase leading-relaxed mt-2">Las notificaciones están configuradas para alertar instantáneamente ante cada duda que un docente envíe.</p>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
