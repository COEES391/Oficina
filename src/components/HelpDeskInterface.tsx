'use client';
/**
 * @fileOverview Interfaz de Mesa de Ayuda ATRES con Sincronización Real y Alertas Críticas.
 * - Analista: Monitorización agresiva con alertas visuales (Toasts) y sonoras.
 * - Usuario: Conexión instantánea y chat bidireccional.
 */

import { useState, useRef, useEffect } from 'react';
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
  HardDrive,
  Navigation,
  Search,
  X,
  ShieldCheck,
  AlertCircle,
  Download,
  Info,
  QrCode,
  Globe,
  Bell,
  Volume2,
  ChevronRight,
  MonitorCheck,
  Server,
  Terminal,
  Cpu,
  CheckCircle2
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

type Message = {
  id?: string;
  role: 'user' | 'tech' | 'bot';
  content: string;
  timestamp: any;
  senderName?: string;
};

type SupportRequest = {
  id: string;
  ticketNumber: string;
  status: 'pending' | 'attending' | 'closed';
  userName?: string;
  cct?: string;
  lastMessage?: string;
  lastActivity: any;
};

export function HelpDeskInterface({ isPublic = false }: { isPublic?: boolean }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [queue, setQueue] = useState<SupportRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [activeView, setActiveView] = useState<'chat' | 'remote' | 'files' | 'stats'>('chat');
  const [techName, setTechName] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  // User Registration State
  const [userData, setUserData] = useState({ name: '', cct: '' });
  const [hasJoined, setHasJoined] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alertedIds = useRef(new Set<string>());
  
  const supportUrl = typeof window !== 'undefined' ? `${window.location.origin}/helpdesk` : '';

  // Initialize Audio & Mounting
  useEffect(() => {
    setMounted(true);
    // Sonido institucional de campana
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.load();
    audioRef.current = audio;
  }, []);

  // ANALYST: Listen for all support requests
  useEffect(() => {
    if (!mounted || isPublic) return;
    
    setTechName(localStorage.getItem('userRfc') || 'ANALISTA TÉCNICO');
    
    // Escuchamos la cola completa
    const q = query(collection(db, 'support_queue'));

    const unsubscribe = onSnapshot(q, (snap) => {
      const activeQueue = snap.docs
        .map(d => ({ ...d.data(), id: d.id } as SupportRequest))
        .filter(req => req.status !== 'closed')
        .sort((a, b) => {
          const tA = a.lastActivity instanceof Timestamp ? a.lastActivity.toMillis() : Date.now();
          const tB = b.lastActivity instanceof Timestamp ? b.lastActivity.toMillis() : Date.now();
          return tB - tA;
        });
      
      setQueue(activeQueue);

      // ALERTA DE ALTA PRIORIDAD
      snap.docChanges().forEach((change) => {
        const data = change.doc.data() as SupportRequest;
        const id = change.doc.id;

        if ((change.type === "added" || change.type === "modified") && data.status === 'pending') {
          if (!alertedIds.current.has(id)) {
            alertedIds.current.add(id);
            
            // Notificación Visual con Botón de Atención
            toast({
              title: "⚠️ ALERTA DE SOPORTE ATRES",
              description: `DOCENTE: ${data.userName} | CCT: ${data.cct}`,
              className: "bg-[#9f2241] text-white border-none shadow-2xl font-black rounded-3xl p-6",
              duration: 20000,
              action: (
                <Button 
                  onClick={() => setSelectedRequest({ ...data, id } as any)} 
                  className="bg-white text-[#9f2241] hover:bg-slate-100 font-black uppercase text-[10px]"
                >
                  ATENDER AHORA
                </Button>
              )
            });

            // Notificación Sonora
            if (audioRef.current && soundEnabled) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(e => console.log("Habilite sonido interactivo"));
            }
          }
        }
      });
    }, (error) => {
      console.error("Error en cola soporte:", error);
    });

    return () => unsubscribe();
  }, [isPublic, toast, mounted, soundEnabled]);

  // CHAT: Listen for messages in real time
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
      const sortedMsgs = msgs.sort((a, b) => {
        const tA = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : Date.now();
        const tB = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : Date.now();
        return tA - tB;
      });
      setMessages(sortedMsgs);
    }, (error) => {
      console.error("Error en chat:", error);
    });

    return () => unsubscribe();
  }, [mounted, selectedRequest]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoinSupport = async () => {
    if (!userData.name || !userData.cct) {
      toast({ variant: "destructive", title: "Datos incompletos" });
      return;
    }
    
    setIsJoining(true);
    const ticketNum = `TK-${Math.floor(100000 + Math.random() * 900000)}`;
    const requestId = `REQ-${Date.now()}`;
    
    const requestData = {
      userName: userData.name.toUpperCase(),
      cct: userData.cct.toUpperCase(),
      status: 'pending',
      lastActivity: serverTimestamp(),
      lastMessage: 'Sincronizando con Central ATRES...',
      ticketNumber: ticketNum
    };
    
    try {
      // 1. Registro Instantáneo
      await setDoc(doc(db, 'support_queue', requestId), requestData);
      
      // 2. Mensaje de bienvenida
      await addDoc(collection(db, 'chat_messages'), {
        chatId: requestId,
        role: 'bot',
        content: `Hola ${userData.name.toUpperCase()}, bienvenido a la Mesa de Ayuda ATRES. Se ha enviado una ALERTA CRÍTICA a la Central de Soporte. Su Folio es: ${ticketNum}. Mantenga esta ventana abierta, un técnico se conectará en breve.`,
        timestamp: serverTimestamp()
      });

      setSelectedRequest({ ...requestData, id: requestId, lastActivity: new Date() } as any);
      setHasJoined(true);
    } catch (e) {
      toast({ variant: "destructive", title: "Error de servidor", description: "Verifique su conexión a internet." });
    } finally {
      setIsJoining(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedRequest) return;
    setIsSending(true);
    const chatId = selectedRequest.id;

    try {
      // Actualizamos estado de la cola
      setDoc(doc(db, 'support_queue', chatId), { 
        lastActivity: serverTimestamp(), 
        lastMessage: input.substring(0, 40) + (input.length > 40 ? '...' : ''),
        status: isPublic ? 'pending' : 'attending'
      }, { merge: true });

      // Guardamos mensaje
      await addDoc(collection(db, 'chat_messages'), {
        chatId,
        role: isPublic ? 'user' : 'tech',
        content: input,
        timestamp: serverTimestamp(),
        senderName: isPublic ? userData.name : techName
      });

      setInput('');
    } finally {
      setIsSending(false);
    }
  };

  if (!mounted) return null;

  if (isPublic) {
    if (!hasJoined) {
      return (
        <div className="h-full w-full bg-[#f0f2f5] flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
          <Card className="w-full max-w-[500px] rounded-[3rem] border-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
             <div className="p-10 bg-[#9f2241] text-white text-center space-y-4">
                <div className="h-20 w-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-white/10">
                   <Monitor className="h-10 w-10 text-white" />
                </div>
                <div>
                   <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">MESA DE AYUDA</h2>
                   <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-2">Soporte Técnico ATRES • Edoméx 2026</p>
                </div>
             </div>
             <div className="p-10 bg-white space-y-6">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Identificación del Solicitante</Label>
                   <Input 
                      placeholder="NOMBRE COMPLETO..." 
                      className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold uppercase" 
                      value={userData.name}
                      onChange={e => setUserData({...userData, name: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">CCT del Plantel</Label>
                   <Input 
                      placeholder="15DESXXXXX" 
                      className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-mono font-black uppercase text-primary" 
                      value={userData.cct}
                      onChange={e => setUserData({...userData, cct: e.target.value})}
                      maxLength={10}
                   />
                </div>
                <Button onClick={handleJoinSupport} disabled={isJoining} className="w-full btn-institutional h-14 shadow-2xl mt-4">
                   {isJoining ? <Loader2 className="animate-spin h-5 w-5" /> : "CONECTAR CON TÉCNICO"}
                </Button>
             </div>
          </Card>
        </div>
      );
    }

    return (
      <div className="flex h-full w-full bg-white overflow-hidden animate-in fade-in duration-700">
        <aside className="w-80 bg-slate-50 border-r flex flex-col shrink-0">
           <div className="p-6 bg-white border-b flex items-center justify-between">
              <div>
                 <h3 className="text-lg font-black text-[#9f2241] uppercase tracking-tighter">Apoyo Remoto</h3>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Conexión Segura</p>
              </div>
           </div>
           <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                 {[
                   { step: 1, text: 'Descargue AnyDesk en su equipo.' },
                   { step: 2, text: 'Localice su ID de 9 dígitos.' },
                   { step: 3, text: 'Envíe su ID por este chat.' },
                 ].map(s => (
                   <div key={s.step} className="flex gap-4 items-start bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="h-6 w-6 rounded-lg bg-[#9f2241] text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg">{s.step}</div>
                      <p className="text-[11px] font-semibold text-slate-600 leading-tight pt-0.5">{s.text}</p>
                   </div>
                 ))}
                 <div className="p-5 bg-blue-50 border-2 border-dashed border-blue-100 rounded-[1.8rem] flex gap-3 shadow-inner">
                    <Info className="h-5 w-5 text-blue-600 shrink-0" />
                    <p className="text-[9px] font-bold text-blue-900 uppercase leading-relaxed mt-1">Un técnico está analizando su caso. La sincronización es en tiempo real.</p>
                 </div>
              </div>
           </ScrollArea>
        </aside>

        <div className="flex-1 flex flex-col bg-[#efe7dd] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] overflow-hidden">
           <header className="h-16 bg-white border-b px-8 flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-4">
                 <Avatar className="h-10 w-10 border-2 border-emerald-500">
                    <AvatarFallback className="bg-slate-100 text-slate-400"><Bot /></AvatarFallback>
                 </Avatar>
                 <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase leading-none">Asistente Virtual</h4>
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                       <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" /> Sincronizado con Central
                    </span>
                 </div>
              </div>
           </header>

           <ScrollArea className="flex-1 px-8 py-8">
              <div className="max-w-4xl mx-auto space-y-4">
                 {messages.map((m, i) => (
                   <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2", m.role === 'user' ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[80%] p-5 rounded-[1.8rem] text-sm font-semibold shadow-lg", m.role === 'user' ? "bg-[#e7ffdb] rounded-tr-none border-emerald-100" : m.role === 'bot' ? "bg-slate-800 text-white rounded-tl-none border-none" : "bg-white rounded-tl-none border-slate-200")}>
                         <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                         <div className="text-[8px] font-black uppercase opacity-30 text-right mt-2">{m.timestamp instanceof Timestamp ? format(m.timestamp.toDate(), 'HH:mm') : '...'}</div>
                      </div>
                   </div>
                 ))}
                 <div ref={scrollRef} />
              </div>
           </ScrollArea>

           <footer className="p-6 bg-white border-t flex gap-4">
              <Input 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="ESCRIBIR MENSAJE O PEGAR ID ANYDESK..." 
                className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner px-8 font-bold text-sm uppercase flex-1"
              />
              <Button onClick={handleSendMessage} disabled={isSending || !input.trim()} className="h-14 w-14 rounded-2xl bg-[#128c7e] hover:bg-[#075e54] shadow-xl p-0">
                 {isSending ? <Loader2 className="animate-spin" /> : <Send className="h-6 w-6 text-white" />}
              </Button>
           </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-white overflow-hidden animate-in fade-in duration-700">
      <aside className="w-16 bg-[#0b4135] flex flex-col items-center py-6 gap-6 shrink-0 z-50 shadow-2xl">
        <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400"><ShieldCheck className="h-6 w-6" /></div>
        <div className="flex-1 flex flex-col gap-4">
           {[ { id: 'chat', icon: MessageSquare }, { id: 'remote', icon: Monitor } ].map(item => (
             <button 
               key={item.id} 
               onClick={() => setActiveView(item.id as any)}
               className={cn("h-11 w-11 rounded-2xl flex items-center justify-center transition-all", activeView === item.id ? "bg-emerald-500 text-white" : "text-white/30 hover:bg-white/5")}
             >
               <item.icon className="h-5 w-5" />
             </button>
           ))}
        </div>
        <button 
           onClick={() => { setSoundEnabled(!soundEnabled); if(!soundEnabled) audioRef.current?.play(); }} 
           className={cn("h-11 w-11 rounded-2xl flex items-center justify-center transition-all", soundEnabled ? "bg-amber-500 text-white shadow-lg animate-pulse" : "text-white/20 bg-white/5")}
           title="Alertas Sonoras"
        >
          {soundEnabled ? <Volume2 className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        </button>
      </aside>

      <div className="w-80 bg-slate-50 border-r flex flex-col shrink-0">
        <div className="p-6 bg-white border-b flex items-center justify-between">
           <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Sesiones Activas</h2>
           <Badge className="bg-[#9f2241] text-white text-[10px] px-2 h-6 rounded-full">{queue.length}</Badge>
        </div>
        <ScrollArea className="flex-1">
           <div className="p-2 space-y-1">
             {queue.map((req) => (
               <button 
                 key={req.id} 
                 onClick={() => setSelectedRequest(req)}
                 className={cn("w-full p-4 rounded-3xl text-left transition-all flex items-center gap-4 border-2", selectedRequest?.id === req.id ? "bg-white border-[#9f2241] shadow-xl" : "border-transparent hover:bg-white/50")}
               >
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    <AvatarFallback className={cn("text-white font-black text-xs", req.status === 'pending' ? "bg-rose-500 animate-pulse" : "bg-slate-400")}>
                       {req.userName?.slice(0, 2) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-center"><span className="text-[11px] font-black text-slate-700 uppercase truncate">{req.userName}</span>{req.status === 'pending' && <Badge className="bg-rose-500 text-white text-[6px] h-3 px-1 animate-pulse">ALERTA</Badge>}</div>
                     <p className="text-[9px] font-semibold text-slate-400 truncate uppercase mt-0.5">{req.lastMessage || '...'}</p>
                     <Badge variant="outline" className="text-[7px] font-black border-slate-200 text-slate-400 h-4 px-1.5 mt-2">{req.cct}</Badge>
                  </div>
               </button>
             ))}
           </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden">
        {selectedRequest ? (
          <>
            <header className="h-16 bg-white border-b px-8 flex items-center justify-between shrink-0 shadow-sm">
               <div className="flex flex-col">
                  <h3 className="text-sm font-black text-slate-800 uppercase leading-none">{selectedRequest.userName}</h3>
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1.5 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Conectado en Tiempo Real</span>
               </div>
               <div className="flex items-center gap-4">
                  <Button onClick={() => setActiveView('remote')} variant={activeView === 'remote' ? 'default' : 'ghost'} className="h-9 px-4 rounded-xl text-[10px] font-black"><Monitor className="h-4 w-4 mr-2" /> REMOTO</Button>
                  <Button onClick={() => setActiveView('chat')} variant={activeView === 'chat' ? 'default' : 'ghost'} className="h-9 px-4 rounded-xl text-[10px] font-black"><MessageSquare className="h-4 w-4 mr-2" /> CHAT</Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-500" onClick={() => { if(confirm("¿Finalizar?")) { setDoc(doc(db, 'support_queue', selectedRequest.id), { status: 'closed' }, { merge: true }); setSelectedRequest(null); } }}><Power className="h-4 w-4" /></Button>
               </div>
            </header>

            {activeView === 'chat' ? (
              <>
                <ScrollArea className="flex-1 px-10 py-10 bg-[#efe7dd] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] shadow-inner">
                   <div className="max-w-4xl mx-auto space-y-4 flex flex-col">
                      {messages.map((m, i) => (
                        <div key={i} className={cn("flex w-full animate-in fade-in", m.role === 'tech' ? "justify-end" : "justify-start")}>
                           <div className={cn("max-w-[75%] p-5 rounded-[1.8rem] text-sm font-semibold shadow-lg", m.role === 'tech' ? "bg-[#e7ffdb] border-emerald-100 rounded-tr-none" : "bg-white border-slate-200 rounded-tl-none")}>
                              <p className="whitespace-pre-wrap">{m.content}</p>
                              <div className="text-[8px] font-black uppercase opacity-30 text-right mt-2">{m.timestamp instanceof Timestamp ? format(m.timestamp.toDate(), 'HH:mm') : '...'}</div>
                           </div>
                        </div>
                      ))}
                      <div ref={scrollRef}/>
                   </div>
                </ScrollArea>
                <footer className="p-6 bg-white border-t flex gap-4 shadow-2xl">
                   <Input 
                      value={input} 
                      onChange={e => setInput(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()} 
                      className="rounded-2xl bg-slate-50 border-none h-12 px-8 font-bold text-sm uppercase flex-1 shadow-inner" 
                      placeholder="ESCRIBIR RESPUESTA TÉCNICA..." 
                   />
                   <Button onClick={handleSendMessage} disabled={isSending || !input.trim()} className="bg-[#128c7e] hover:bg-[#075e54] h-12 w-12 rounded-2xl shadow-xl">
                      {isSending ? <Loader2 className="animate-spin" /> : <Send className="h-5 w-5 text-white" />}
                   </Button>
                </footer>
              </>
            ) : (
              <div className="flex-1 p-6 relative animate-in zoom-in-95 duration-500">
                <div className="w-full h-full bg-slate-900 rounded-[3rem] border-4 border-slate-800 shadow-2xl relative overflow-hidden flex items-center justify-center">
                  <Image src="https://picsum.photos/seed/desk/1200/800" alt="Remote" fill className="object-cover opacity-50 grayscale" />
                  <div className="z-10 text-center space-y-6">
                    <div className="h-20 w-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                      <Activity className="text-emerald-400 h-10 w-10" />
                    </div>
                    <p className="text-white/60 text-[11px] font-black uppercase tracking-[0.4em]">Visualización de Escritorio Activa</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white animate-in fade-in duration-1000">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-6xl w-full">
                <div className="space-y-10">
                   <div className="h-20 w-20 rounded-[1.8rem] bg-[#9f2241]/10 flex items-center justify-center text-[#9f2241] shadow-inner border border-primary/5">
                      <Laptop className="h-10 w-10" />
                   </div>
                   <div className="space-y-3">
                      <h3 className="text-5xl font-black uppercase text-slate-800 tracking-tighter leading-none">CENTRAL DE SOPORTE ATRES</h3>
                      <p className="text-lg font-bold uppercase tracking-[0.3em] text-[#B38E5D]">Monitorización de Sesiones en Vivo</p>
                   </div>
                   <div className="p-8 bg-slate-50 rounded-[3rem] border-2 border-slate-100 flex gap-6 shadow-sm">
                      <div className="h-14 w-14 rounded-2xl bg-white shadow-xl flex items-center justify-center text-rose-600 shrink-0">
                         <Bell className="h-8 w-8" />
                      </div>
                      <p className="text-xs font-bold text-slate-600 uppercase leading-relaxed mt-1">
                         El sistema le notificará automáticamente con alertas visuales y sonoras cuando un docente inicie una nueva solicitud de soporte técnico en la nube.
                      </p>
                   </div>
                </div>

                <Card className="rounded-[4rem] border-none shadow-2xl p-12 bg-slate-900 text-white relative overflow-hidden flex flex-col justify-center gap-8 group">
                   <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                      <QrCode className="h-64 w-64" />
                   </div>
                   <div className="space-y-2 relative z-10 text-center">
                      <h4 className="text-2xl font-black uppercase tracking-tighter">LIGA DE SOPORTE</h4>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">CANAL OFICIAL DE ATENCIÓN REMOTA</p>
                   </div>
                   <div className="p-4 bg-white rounded-[2.5rem] shadow-2xl transform group-hover:rotate-3 transition-transform duration-500 w-fit mx-auto relative z-10">
                      <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(supportUrl)}`} alt="QR" width={140} height={140} className="rounded-xl" />
                   </div>
                   <div className="space-y-6 relative z-10">
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm space-y-2 text-center">
                         <Label className="text-[9px] font-black text-emerald-400 uppercase">Enlace Directo:</Label>
                         <p className="text-[9px] font-mono text-white/80 font-bold truncate">{supportUrl}</p>
                      </div>
                      <Button onClick={() => { navigator.clipboard.writeText(supportUrl); toast({ title: "Enlace Copiado", className: "bg-emerald-600 text-white" }); }} className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black rounded-2xl gap-3 shadow-xl transition-all">
                         <Globe className="h-4 w-4" /> COPIAR LIGA OFICIAL
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