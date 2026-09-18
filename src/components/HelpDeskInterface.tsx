'use client';
/**
 * @fileOverview Interfaz de Mesa de Ayuda ATRES de Alta Fidelidad.
 * Comunicación bidireccional en tiempo real entre Analistas y Usuarios.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, 
  Bot, 
  MessageSquare,
  CheckCircle2,
  Clock,
  Circle,
  Loader2,
  Users,
  UserPlus,
  PlusCircle,
  BookOpen,
  HelpCircle,
  Lock,
  Mail,
  Laptop,
  GraduationCap,
  MoreHorizontal,
  Headphones,
  Info,
  RefreshCcw,
  Bell,
  Paperclip,
  Smile,
  Archive,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  setDoc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { chatWithHelpDesk } from '@/ai/flows/help-desk-flow';

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
  timestamp: any;
  status: 'pending' | 'attending' | 'closed';
  userName?: string;
  lastMessage?: string;
  lastActivity: any;
};

export function HelpDeskInterface({ isPublic = false }: { isPublic?: boolean }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [queue, setQueue] = useState<SupportRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [techName, setTechName] = useState('');
  const [mounted, setMounted] = useState(false);
  const [sessionKey, setSessionKey] = useState<string>('');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<'conversaciones' | 'mias' | 'no-asignadas' | 'cerradas' | 'todas'>('conversaciones');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeChatId = useMemo(() => {
    if (isPublic) return sessionKey;
    return selectedRequest?.id || null;
  }, [isPublic, sessionKey, selectedRequest]);

  const generateTurnSessionId = useCallback(() => {
    const now = new Date();
    const dateStr = format(now, 'yyyyMMdd');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `USER-${dateStr}-${random}`;
  }, []);

  // Inicializar sesión y heartbeat (Vista de Usuario)
  useEffect(() => {
    setMounted(true);
    if (!isPublic) return;

    let sKey = localStorage.getItem('atres_session_v2026');
    if (!sKey) {
      sKey = generateTurnSessionId();
      localStorage.setItem('atres_session_v2026', sKey);
    }
    setSessionKey(sKey);

    const initSupportSession = async () => {
      try {
        const queueRef = doc(db, 'support_queue', sKey);
        await setDoc(queueRef, {
          id: sKey,
          ticketNumber: sKey,
          timestamp: serverTimestamp(),
          status: 'pending',
          userName: `Usuario ${sKey.split('-').at(-1)}`,
          lastActivity: serverTimestamp(),
          lastMessage: 'Conectado a la Mesa de Ayuda'
        }, { merge: true });
      } catch (e) {
        console.error("Error al registrar sesión de ayuda:", e);
      }
    };

    initSupportSession();
  }, [isPublic, generateTurnSessionId]);

  // Obtener nombre del técnico (Vista Analista)
  useEffect(() => {
    if (!isPublic) {
      setTechName(localStorage.getItem('userRfc') || 'ANALISTA COEES');
    }
  }, [isPublic]);

  // Escuchar la cola de solicitudes en tiempo real (Vista Analista)
  useEffect(() => {
    if (!mounted || isPublic) return;

    const q = query(
      collection(db, 'support_queue'),
      orderBy('lastActivity', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedQueue = snapshot.docs.map(doc => ({ 
        ...doc.data(), 
        id: doc.id 
      })) as SupportRequest[];
      setQueue(updatedQueue);
    }, (err) => {
      console.error("Error en listener de cola:", err);
    });

    return () => unsubscribe();
  }, [mounted, isPublic]);

  // Escuchar mensajes del chat activo en tiempo real (Ambas Vistas)
  useEffect(() => {
    if (!mounted || !activeChatId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'chat_messages'), 
      where('chatId', '==', activeChatId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ 
        ...doc.data(), 
        id: doc.id 
      })) as Message[];
      
      const sortedMsgs = msgs.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeA - timeB;
      });
      setMessages(sortedMsgs);
    });

    return () => unsubscribe();
  }, [mounted, activeChatId]);

  // Auto-scroll al fondo
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (msgContent?: string) => {
    const textToSend = msgContent || input;
    if (!textToSend.trim()) return;
    const chatId = activeChatId;
    if (!chatId) return;

    setIsSending(true);
    try {
      const queueRef = doc(db, 'support_queue', chatId);
      await setDoc(queueRef, { 
        lastActivity: serverTimestamp(), 
        lastMessage: textToSend.substring(0, 80),
        status: isPublic ? 'pending' : 'attending'
      }, { merge: true });

      await addDoc(collection(db, 'chat_messages'), {
        chatId,
        role: isPublic ? 'user' : 'tech',
        content: textToSend,
        timestamp: serverTimestamp(),
        senderName: !isPublic ? techName : 'Usuario'
      });

      if (!msgContent) setInput('');

      if (isPublic && !textToSend.includes("Solicitud de apoyo")) {
        setIsBotThinking(true);
        try {
          const aiRes = await chatWithHelpDesk({ message: textToSend });
          if (aiRes?.response) {
            await addDoc(collection(db, 'chat_messages'), {
              chatId,
              role: 'bot',
              content: aiRes.response,
              timestamp: serverTimestamp()
            });
          }
        } catch (e) {
          console.error("AI Error:", e);
        } finally {
          setIsBotThinking(false);
        }
      }
    } catch (e: any) {
      console.error("Error al enviar mensaje:", e);
      toast({ variant: "destructive", title: "Falla de red", description: "No se pudo enviar el mensaje." });
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseChat = async () => {
    if (!selectedRequest) return;
    try {
      await setDoc(doc(db, 'support_queue', selectedRequest.id), { 
        status: 'closed', 
        lastActivity: serverTimestamp() 
      }, { merge: true });
      setSelectedRequest(null);
      toast({ title: "Atención finalizada" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al cerrar chat" });
    }
  };

  const filteredQueue = useMemo(() => {
    if (isPublic) return [];
    if (currentFilter === 'cerradas') return queue.filter(q => q.status === 'closed');
    if (currentFilter === 'no-asignadas') return queue.filter(q => q.status === 'pending');
    if (currentFilter === 'mias') return queue.filter(q => q.status === 'attending');
    return queue.filter(q => q.status !== 'closed');
  }, [queue, currentFilter, isPublic]);

  const pendingCount = useMemo(() => queue.filter(q => q.status === 'pending').length, [queue]);

  if (!mounted) return null;

  if (isPublic) {
    return (
      <div className="flex h-full w-full bg-[#f4f7f9] overflow-hidden">
        <aside className="hidden lg:flex w-[280px] bg-[#1a2b4b] flex-col shrink-0 p-6 shadow-2xl z-30">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10"><Bot className="h-6 w-6 text-white" /></div>
            <div className="space-y-0">
               <h1 className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em] leading-none">Mesa de Ayuda</h1>
               <p className="text-sm font-black text-white uppercase leading-none mt-1">ATRES <span className="text-white/40">COEES</span></p>
            </div>
          </div>
          <nav className="space-y-1">
            <Button onClick={() => { localStorage.removeItem('atres_session_v2026'); window.location.reload(); }} variant="ghost" className="w-full justify-start text-white bg-white/10 hover:bg-white/20 rounded-xl h-11 text-xs font-bold gap-3 mb-4"><PlusCircle className="h-4 w-4" /> Nueva conversación</Button>
            {[ { label: 'Mis solicitudes', icon: Clock }, { label: 'Anuncios', icon: Bell }, { label: 'Conocimiento', icon: BookOpen }, { label: 'Ayuda', icon: HelpCircle } ].map((item, idx) => (
              <button key={idx} className="w-full flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl text-xs font-bold transition-all"><item.icon className="h-4 w-4" />{item.label}</button>
            ))}
          </nav>
          <div className="mt-auto">
             <div className="bg-[#2a3c5d] p-5 rounded-[1.8rem] border border-white/5 space-y-4 shadow-xl">
                <p className="text-[10px] font-black text-white uppercase">¿Apoyo inmediato?</p>
                <Button onClick={() => handleSendMessage("Solicitud de apoyo humano urgente.")} className="w-full bg-[#0052cc] hover:bg-[#0047b3] text-white rounded-xl h-10 text-[10px] font-black gap-2 shadow-lg"><Headphones className="h-4 w-4" /> Hablar con técnico</Button>
                <div className="flex items-center gap-2 mt-2"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Analistas en línea</span></div>
             </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden relative">
          <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0 z-20 shadow-sm">
             <div className="flex items-center gap-3"><h2 className="text-sm font-black text-slate-700 uppercase">Asistente COEES</h2><Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase px-2 h-5 rounded-full"><Circle className="h-1.5 w-1.5 fill-current mr-1.5" /> Canal Seguro</Badge></div>
             <div className="flex items-center gap-6"><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-slate-300" /><div><p className="text-[8px] font-black text-slate-400 uppercase">Horario</p><p className="text-[10px] font-bold text-slate-600">8:00 - 4:00 p.m.</p></div></div><div className="h-8 w-px bg-slate-100" /><p className="text-[9px] font-black text-primary uppercase font-mono">Folio: {sessionKey.split('-').at(-1)}</p></div>
          </header>

          <ScrollArea className="flex-1 bg-[#f4f7f9] p-8">
             <div className="max-w-4xl mx-auto space-y-10 pb-24">
                <div className="bg-[#eef4ff] rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10 shadow-sm border border-white animate-in zoom-in-95 duration-500">
                   <div className="relative shrink-0"><div className="h-32 w-32 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-[#e1ebff]"><Bot className="h-16 w-16 text-[#0052cc]" /></div><div className="absolute -bottom-2 -right-2 h-10 w-10 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-white shadow-lg"><CheckCircle2 className="h-5 w-5" /></div></div>
                   <div className="space-y-4 text-center md:text-left flex-1"><h3 className="text-2xl font-black text-[#1a2b4b] uppercase tracking-tighter">¡Buen día! Soy tu Asistente Virtual</h3><p className="text-sm font-semibold text-slate-600 leading-relaxed">Describe tu problema técnico en el chat o selecciona una de las categorías rápidas para que un analista te atienda en vivo.</p></div>
                </div>

                <div className="space-y-8 pt-4">
                   <h4 className="text-base font-black text-slate-800 uppercase tracking-widest text-center">CANALES DE ATENCIÓN INMEDIATA</h4>
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {[ 
                        { id: 'pass', label: 'Contraseña', icon: Lock, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'Acceso' }, 
                        { id: 'mail', label: 'Correo', icon: Mail, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Institucional' }, 
                        { id: 'tech', label: 'Soporte', icon: Laptop, color: 'text-orange-500', bg: 'bg-orange-50', sub: 'Técnico' }, 
                        { id: 'lib', label: 'Biblioteca', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50', sub: 'Digital' }, 
                        { id: 'edu', label: 'Plataforma', icon: GraduationCap, color: 'text-cyan-600', bg: 'bg-cyan-50', sub: 'Capacitación' }, 
                        { id: 'other', label: 'Otro', icon: MoreHorizontal, color: 'text-rose-500', bg: 'bg-orange-50', sub: 'Consulta' } 
                      ].map((cat) => (
                        <button key={cat.id} onClick={() => handleSendMessage(`Solicitud de apoyo: ${cat.label.toUpperCase()}`)} className="flex flex-col items-center text-center p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:scale-105 transition-all group">
                           <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-5 shadow-inner", cat.bg, cat.color)}><cat.icon className="h-6 w-6" /></div>
                           <h5 className="text-[10px] font-black text-slate-800 uppercase leading-tight mb-1">{cat.label}</h5>
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{cat.sub}</p>
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-6 pt-10 border-t border-slate-100">
                  {messages.map((msg, i) => (
                    <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2", msg.role === 'user' ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[85%] p-5 rounded-3xl text-sm font-semibold shadow-md", msg.role === 'user' ? "bg-[#0052cc] text-white rounded-tr-none" : msg.role === 'bot' ? "bg-slate-800 text-white rounded-tl-none" : "bg-white text-slate-700 rounded-tl-none border border-slate-100")}>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <div className="text-[8px] mt-2 font-black uppercase opacity-40 text-right flex items-center justify-end gap-1"><Clock className="h-2.5 w-2.5" />{msg.timestamp?.seconds ? format(new Date(msg.timestamp.seconds * 1000), 'HH:mm') : '...'}</div>
                      </div>
                    </div>
                  ))}
                  {isBotThinking && <div className="flex justify-start animate-pulse"><div className="bg-white/50 px-5 py-2 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest border">Analizando...</div></div>}
                  <div ref={scrollRef} />
                </div>
             </div>
          </ScrollArea>
          <footer className="p-8 bg-white border-t z-30 shadow-lg"><div className="max-w-4xl mx-auto flex items-center gap-4 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] px-6 py-2 shadow-inner"><button className="h-10 w-10 text-slate-300 hover:text-blue-500 transition-colors"><Paperclip className="h-5 w-5" /></button><Input placeholder="Escribe tu duda técnica aquí..." className="h-12 bg-transparent border-none font-bold text-sm text-slate-700 focus:ring-0 px-0 placeholder:text-slate-300" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} disabled={isSending} /><button className="h-10 w-10 text-slate-300 hover:text-blue-500 mr-2"><Smile className="h-5 w-5" /></button><Button onClick={() => handleSendMessage()} disabled={!input.trim() || isSending} className="bg-[#0052cc] hover:bg-[#0047b3] text-white font-black uppercase text-[11px] h-10 px-8 rounded-xl shadow-xl gap-2">{isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Enviar</Button></div></footer>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-white">
      <div className="w-[280px] bg-[#0b4135] flex flex-col shrink-0 overflow-hidden shadow-2xl z-40">
        <div className="p-6 flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-4 mb-8"><div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/5"><Bot className="h-7 w-7" /></div><div className="min-w-0"><h3 className="text-white font-black uppercase text-sm leading-none tracking-tighter">Mesa Operativa</h3><div className="flex items-center gap-1.5 mt-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">En Línea</span></div></div></div>
          <nav className="space-y-1">
            {[ 
              { id: 'conversaciones', label: 'Buzón Soporte', icon: MessageSquare, badge: pendingCount }, 
              { id: 'mias', label: 'Mis casos', icon: User, badge: null }, 
              { id: 'no-asignadas', label: 'No asignadas', icon: UserPlus, badge: pendingCount }, 
              { id: 'cerradas', label: 'Historial', icon: Archive, badge: null } 
            ].map(item => (
              <button key={item.id} onClick={() => setCurrentFilter(item.id as any)} className={cn("w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group", currentFilter === item.id ? "bg-[#128c7e] text-white shadow-xl scale-[1.02]" : "text-white/60 hover:bg-white/5")}>
                <div className="flex items-center gap-3"><item.icon className="h-4 w-4" /><span className="text-xs font-black uppercase tracking-wider">{item.label}</span></div>
                {item.badge !== null && item.badge > 0 && <Badge className="h-5 min-w-5 bg-emerald-400 text-[#0b4135] border-none text-[9px] font-black rounded-full shadow-lg ring-1 ring-white/20 animate-in zoom-in">{item.badge}</Badge>}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6 bg-black/20 flex items-center gap-4 border-t border-white/5"><Avatar className="h-10 w-10 border-2 border-emerald-500 shadow-lg"><AvatarFallback className="bg-emerald-800 text-white font-black text-xs">AN</AvatarFallback></Avatar><div className="min-w-0"><p className="text-xs font-black text-white uppercase truncate">{techName}</p><p className="text-[9px] font-bold text-white/30 uppercase mt-1">Técnico Analista</p></div></div>
      </div>

      <div className="w-[340px] flex flex-col bg-slate-50 border-r border-slate-200 shrink-0 z-30">
        <div className="p-6 space-y-6 bg-white border-b flex items-center justify-between"><h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Conversaciones</h2><button onClick={() => window.location.reload()} className="h-8 w-8 rounded-lg bg-white border flex items-center justify-center text-slate-400 hover:text-primary transition-all"><RefreshCcw className="h-4 w-4" /></button></div>
        <ScrollArea className="flex-1">
           <div className="px-3 py-6 space-y-2">
             {filteredQueue.map((chat) => (
               <button key={chat.id} onClick={() => setSelectedRequest(chat)} className={cn("w-full p-4 rounded-[2rem] text-left transition-all duration-300 flex items-center gap-4 border-2 group relative", selectedRequest?.id === chat.id ? "bg-emerald-50 border-emerald-200 shadow-lg scale-[1.02]" : "bg-transparent border-transparent hover:bg-white/80 shadow-sm")}>
                  <div className="relative shrink-0"><Avatar className="h-12 w-12 shadow-md border-2 border-white"><AvatarFallback className="bg-primary text-white font-black text-sm uppercase">{chat.userName?.slice(0, 2) || 'U'}</AvatarFallback></Avatar><div className={cn("absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white shadow-sm transition-all", chat.status === 'pending' ? 'bg-rose-500 animate-pulse scale-110' : 'bg-emerald-500')} /></div>
                  <div className="flex-1 min-w-0"><div className="flex justify-between items-center mb-1"><span className="text-[12px] font-black text-slate-800 uppercase truncate">{chat.userName}</span><span className="text-[8px] font-black text-slate-400 font-mono">#{chat.id.split('-').at(-1)}</span></div><p className="text-[10px] font-semibold text-slate-400 truncate uppercase mt-1">{chat.lastMessage || 'Nueva solicitud...'}</p></div>
                  {chat.status === 'pending' && <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />}
               </button>
             ))}
             {filteredQueue.length === 0 && <div className="text-center py-20 opacity-20"><MessageSquare className="h-12 w-12 mx-auto mb-4" /><p className="text-[10px] font-black uppercase tracking-widest">Sin chats activos</p></div>}
           </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-[#f0f2f5] z-20">
        {selectedRequest ? (
          <>
            <header className="px-8 py-4 bg-white border-b flex justify-between items-center shrink-0 shadow-sm z-10"><div className="flex items-center gap-5"><Avatar className="h-12 w-12 border-2 border-slate-100 shadow-sm"><AvatarFallback className="bg-slate-200 text-slate-500 font-black uppercase">{selectedRequest.userName?.slice(0, 1) || 'U'}</AvatarFallback></Avatar><div><h2 className="text-base font-black text-slate-800 uppercase leading-none">{selectedRequest.userName}</h2><div className="flex items-center gap-2 mt-1.5"><Badge className={cn("border-none text-[8px] font-black uppercase px-2 h-5 rounded-full shadow-sm", selectedRequest.status === 'pending' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700')}>{selectedRequest.status === 'pending' ? 'En espera' : 'Atendiendo'}</Badge><span className="text-[9px] font-mono text-slate-300 uppercase">{selectedRequest.id}</span></div></div></div><div className="flex items-center gap-3"><Button onClick={handleCloseChat} className="bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] h-10 px-8 rounded-xl shadow-xl transition-all">Finalizar Atención</Button></div></header>
            <ScrollArea className="flex-1 px-10 py-10 bg-[#efe7dd] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
               <div className="max-w-5xl mx-auto flex flex-col space-y-4">
                  <div className="self-center bg-white/50 backdrop-blur-md px-6 py-2 rounded-full border border-white text-[9px] font-black uppercase text-slate-400 shadow-sm mb-6">Seguridad ATRES: Comunicación Sincronizada</div>
                  {messages.map((msg, i) => (
                    <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2", msg.role === 'tech' ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[75%] p-5 rounded-3xl text-sm font-semibold shadow-lg", msg.role === 'tech' ? "bg-[#e7ffdb] border border-emerald-100 rounded-tr-none text-slate-800" : msg.role === 'bot' ? "bg-slate-800 text-white rounded-tl-none" : "bg-white border border-slate-200 rounded-tl-none text-slate-800")}>
                         <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                         <div className="text-[8px] font-black uppercase opacity-30 text-right mt-2 flex items-center justify-end gap-1"><Clock className="h-2.5 w-2.5" />{msg.timestamp?.seconds ? format(new Date(msg.timestamp.seconds * 1000), 'HH:mm') : '...'}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
               </div>
            </ScrollArea>
            <footer className="p-6 bg-slate-50 border-t shrink-0 shadow-lg"><div className="max-w-5xl mx-auto flex items-center gap-4"><button className="h-12 w-12 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-500 flex items-center justify-center shadow-sm"><Paperclip className="h-5 w-5" /></button><Input placeholder="Escribir respuesta técnica..." className="h-12 rounded-2xl bg-white border-none shadow-inner px-6 font-bold text-sm text-slate-700 uppercase focus:ring-2 focus:ring-emerald-500/20" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} disabled={isSending} /><Button onClick={() => handleSendMessage()} disabled={!input.trim() || isSending} className="bg-[#128c7e] hover:bg-[#075e54] h-12 w-12 rounded-2xl shadow-xl p-0 shrink-0 flex items-center justify-center">{isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</Button></div></footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-20 animate-in fade-in duration-1000"><div className="h-40 w-40 rounded-full bg-slate-200 flex items-center justify-center mb-8 shadow-inner border-4 border-white"><MessageSquare className="h-20 w-20 text-slate-400" /></div><h3 className="text-3xl font-black uppercase text-slate-800 tracking-tighter leading-none">Mesa de Ayuda Operativa</h3><p className="text-sm font-bold uppercase tracking-[0.4em] text-slate-500 mt-6 border-y border-slate-300 py-2 px-6">Seleccione una conversación para iniciar la atención</p></div>
        )}
      </div>
    </div>
  );
}
