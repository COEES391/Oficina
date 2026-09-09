
'use client';
/**
 * @fileOverview Interfaz de Mesa de Ayuda ATRES de Alta Fidelidad.
 * Sistema de 3 columnas para analistas y Dashboard de servicios para usuarios públicos.
 * Sincronización robusta con Firestore para comunicación bidireccional.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Send, 
  Bot, 
  MessageSquare,
  CheckCircle2,
  Clock,
  Activity,
  X,
  Search,
  User,
  Archive,
  Circle,
  Copy,
  Loader2,
  QrCode,
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
  ChevronLeft,
  ChevronRight,
  Printer,
  Bell,
  Paperclip,
  Smile
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
  orderBy, 
  where, 
  doc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { chatWithHelpDesk } from '@/ai/flows/help-desk-flow';
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
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeChatId = useMemo(() => {
    if (isPublic) return sessionKey;
    return selectedRequest?.id || null;
  }, [isPublic, sessionKey, selectedRequest]);

  const supportUrl = typeof window !== 'undefined' ? `${window.location.origin}/helpdesk` : "";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(supportUrl)}`;

  const generateTurnSessionId = useCallback(() => {
    const now = new Date();
    const dateStr = format(now, 'yyyyMMdd');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `USER-${dateStr}-${random}`;
  }, []);

  useEffect(() => {
    setMounted(true);
    
    const initSupportSession = async () => {
      if (isPublic) {
        let sKey = localStorage.getItem('atres_session_v2026');
        if (!sKey) {
          sKey = generateTurnSessionId();
          localStorage.setItem('atres_session_v2026', sKey);
        }
        setSessionKey(sKey);
        
        // Registrar presencia inicial en Firestore
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
          console.error("Falla inicialización:", e);
        }
      } else {
        setTechName(localStorage.getItem('userRfc') || 'ANALISTA COEES');
      }
    };

    initSupportSession();
  }, [isPublic, generateTurnSessionId]);

  // Listener Global de Conversaciones (Vista Técnico)
  useEffect(() => {
    if (!mounted || isPublic) return;
    
    const q = query(collection(db, 'support_queue'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedQueue = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as SupportRequest[];
      setQueue(updatedQueue.sort((a, b) => {
        const timeA = a.lastActivity?.seconds || Date.now() / 1000;
        const timeB = b.lastActivity?.seconds || Date.now() / 1000;
        return timeB - timeA;
      }));
    });
    return () => unsubscribe();
  }, [mounted, isPublic]);

  // Filtrado de la cola según la navegación lateral del técnico
  const filteredQueue = useMemo(() => {
    if (isPublic) return [];
    if (currentFilter === 'cerradas') return queue.filter(q => q.status === 'closed');
    if (currentFilter === 'no-asignadas') return queue.filter(q => q.status === 'pending');
    if (currentFilter === 'mias') return queue.filter(q => q.status === 'attending');
    return queue.filter(q => q.status !== 'closed');
  }, [queue, currentFilter, isPublic]);

  // Listener para los mensajes del chat activo
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
      setMessages(chatMsgs);
    });
    return () => unsubscribe();
  }, [mounted, activeChatId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (msgContent?: string) => {
    const textToSend = msgContent || input;
    if (!textToSend.trim()) return;
    
    const chatId = activeChatId || sessionKey;
    if (!chatId) {
      toast({ variant: "destructive", title: "Error de sesión", description: "Reinicie el chat por favor." });
      return;
    }

    setIsSending(true);
    try {
      // 1. Upsert en la cola para notificar al técnico
      const queueRef = doc(db, 'support_queue', chatId);
      await setDoc(queueRef, { 
        id: chatId,
        lastActivity: serverTimestamp(), 
        lastMessage: textToSend.substring(0, 60),
        status: isPublic ? 'pending' : 'attending',
        ...(isPublic ? { userName: `Usuario ${chatId.split('-').at(-1)}` } : {})
      }, { merge: true });

      // 2. Registro del mensaje en la base de datos
      await addDoc(collection(db, 'chat_messages'), {
        chatId,
        role: isPublic ? 'user' : 'tech',
        content: textToSend,
        timestamp: serverTimestamp(),
        senderName: !isPublic ? techName : 'Usuario Final'
      });

      if (!msgContent) setInput('');

      // 3. IA responde al usuario si es público
      if (isPublic) {
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
      console.error("Falla de envío:", e);
      toast({ variant: "destructive", title: "Sin conexión", description: "No se pudo entregar el mensaje." });
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseChat = async () => {
    if (!selectedRequest) return;
    try {
      await setDoc(doc(db, 'support_queue', selectedRequest.id), { status: 'closed', lastActivity: serverTimestamp() }, { merge: true });
      setSelectedRequest(null);
      toast({ title: "Atención Finalizada", description: "El caso ha sido archivado." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al cerrar" });
    }
  };

  if (!mounted) return null;

  // VISTA PÚBLICA (PORTAL DE USUARIO)
  if (isPublic) {
    return (
      <div className="flex h-full w-full bg-[#f4f7f9] overflow-hidden">
        <aside className="hidden lg:flex w-[280px] bg-[#1a2b4b] flex-col shrink-0 p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-0">
               <h1 className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em] leading-none">Mesa de Ayuda</h1>
               <p className="text-sm font-black text-white uppercase leading-none mt-1">ATRES <span className="text-white/40">COEES</span></p>
            </div>
          </div>

          <nav className="space-y-1">
            <Button onClick={() => setMessages([])} variant="ghost" className="w-full justify-start text-white bg-white/10 hover:bg-white/20 rounded-xl h-11 text-xs font-bold gap-3 mb-4">
              <PlusCircle className="h-4 w-4" /> Nueva conversación
            </Button>
            {[
              { label: 'Mis solicitudes', icon: Clock },
              { label: 'Anuncios', icon: Bell },
              { label: 'Base de conocimiento', icon: BookOpen },
              { label: 'Preguntas frecuentes', icon: HelpCircle },
            ].map((item, idx) => (
              <button key={idx} className="w-full flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 transition-all rounded-xl text-xs font-bold">
                 <item.icon className="h-4 w-4" />
                 {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto">
             <div className="bg-[#2a3c5d] p-5 rounded-[1.8rem] border border-white/5 space-y-4 shadow-xl">
                <p className="text-[10px] font-black text-white uppercase tracking-wider">¿Apoyo inmediato?</p>
                <p className="text-[9px] text-white/50 leading-relaxed">Contacta directamente con un analista de soporte técnico.</p>
                <Button className="w-full bg-[#0052cc] hover:bg-[#0047b3] text-white rounded-xl h-10 text-[10px] font-black gap-2 shadow-lg">
                   <Headphones className="h-4 w-4" /> Hablar con técnico
                </Button>
                <div className="flex items-center gap-2 mt-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">En línea ahora</span>
                </div>
             </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden relative">
          <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0 z-20 shadow-sm">
             <div className="flex items-center gap-3">
                <h2 className="text-sm font-black text-slate-700 uppercase tracking-tight">Asistente COEES</h2>
                <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase px-2 h-5 rounded-full">
                   <Circle className="h-1.5 w-1.5 fill-current mr-1.5" /> Chat Seguro
                </Badge>
             </div>
             <div className="hidden md:flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-300" />
                <div className="space-y-0">
                   <p className="text-[8px] font-black text-slate-400 uppercase leading-none">Atención Institucional</p>
                   <p className="text-[10px] font-bold text-slate-600 mt-0.5">8:00 a.m. - 4:00 p.m.</p>
                </div>
             </div>
          </header>

          <ScrollArea className="flex-1 bg-[#f4f7f9] p-8">
             <div className="max-w-4xl mx-auto space-y-10 pb-24">
                <div className="bg-[#eef4ff] rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10 shadow-sm border border-white animate-in zoom-in-95 duration-500">
                   <div className="relative shrink-0">
                      <div className="h-32 w-32 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-[#e1ebff]">
                         <Bot className="h-16 w-16 text-[#0052cc]" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-white shadow-lg">
                         <CheckCircle2 className="h-5 w-5" />
                      </div>
                   </div>
                   <div className="space-y-4 text-center md:text-left flex-1">
                      <h3 className="text-2xl font-black text-[#1a2b4b] uppercase tracking-tighter">¡Buen día! Soy tu Asistente Virtual</h3>
                      <p className="text-sm font-semibold text-slate-600 leading-relaxed">Escribe tu problema en el cuadro inferior o elige una categoría para canalizarte con un técnico analista en tiempo real.</p>
                   </div>
                </div>

                <div className="space-y-8 pt-4">
                   <h4 className="text-base font-black text-slate-800 uppercase tracking-widest">Canales de atención inmediata</h4>
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {[
                        { id: 'pass', label: 'Contraseña', icon: Lock, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'Acceso' },
                        { id: 'mail', label: 'Correo', icon: Mail, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Institucional' },
                        { id: 'tech', label: 'Soporte', icon: Laptop, color: 'text-orange-500', bg: 'bg-orange-50', sub: 'Técnico' },
                        { id: 'lib', label: 'Biblioteca', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50', sub: 'Digital' },
                        { id: 'edu', label: 'Plataforma', icon: GraduationCap, color: 'text-cyan-600', bg: 'bg-cyan-50', sub: 'Moodle' },
                        { id: 'other', label: 'Otro', icon: MoreHorizontal, color: 'text-rose-500', bg: 'bg-orange-50', sub: 'Consulta' },
                      ].map((cat) => (
                        <button 
                          key={cat.id} 
                          onClick={() => setInput(`Solicito apoyo en: ${cat.label} - `)}
                          className="flex flex-col items-center text-center p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:scale-105 group"
                        >
                           <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-5 shadow-inner transition-transform group-hover:rotate-12", cat.bg, cat.color)}>
                              <cat.icon className="h-6 w-6" />
                           </div>
                           <h5 className="text-[10px] font-black text-slate-800 uppercase leading-tight mb-1">{cat.label}</h5>
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{cat.sub}</p>
                        </button>
                      ))}
                   </div>
                </div>

                <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 shadow-inner">
                   <Info className="h-5 w-5 text-[#0052cc] shrink-0" />
                   <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">Si no encuentras la opción que necesitas, escríbenos tu problema en el cuadro de abajo y te ayudaremos.</p>
                </div>

                <div className="space-y-6 pt-10 border-t border-slate-100">
                  {messages.map((msg, i) => (
                    <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2", msg.role === 'user' ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[85%] p-5 rounded-3xl text-sm font-semibold shadow-md", 
                        msg.role === 'user' ? "bg-[#0052cc] text-white rounded-tr-none" : "bg-white text-slate-700 rounded-tl-none border border-slate-100")}>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <div className="text-[8px] mt-2 font-black uppercase opacity-40 text-right flex items-center justify-end gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {msg.timestamp?.seconds ? format(new Date(msg.timestamp.seconds * 1000), 'HH:mm') : '...'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isBotThinking && (
                    <div className="flex justify-start animate-pulse">
                      <div className="bg-white/50 px-5 py-2 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest border">IA Analizando problema...</div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>
             </div>
          </ScrollArea>

          <footer className="p-8 bg-white border-t border-slate-100 z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.03)]">
            <div className="max-w-4xl mx-auto flex items-center gap-4 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] px-6 py-2 focus-within:border-blue-500/30 focus-within:bg-white transition-all shadow-inner">
              <button className="h-10 w-10 text-slate-300 hover:text-blue-500 transition-colors shrink-0"><Paperclip className="h-5 w-5" /></button>
              <Input 
                placeholder="Describa su problema aquí..."
                className="h-12 bg-transparent border-none font-bold text-sm text-slate-700 focus:ring-0 px-0 placeholder:text-slate-300"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                disabled={isSending}
              />
              <button className="h-10 w-10 text-slate-300 hover:text-blue-500 transition-colors shrink-0 mr-2"><Smile className="h-5 w-5" /></button>
              <Button 
                onClick={() => handleSendMessage()} 
                disabled={!input.trim() || isSending} 
                className="bg-[#0052cc] hover:bg-[#0047b3] text-white font-black uppercase text-[11px] h-10 px-8 rounded-xl shadow-xl gap-2 transition-all active:scale-95"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar
              </Button>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  // VISTA TÉCNICO (DASHBOARD TRES COLUMNAS)
  return (
    <div className="flex h-full w-full overflow-hidden bg-white">
      {/* Columna 1: Navegación Táctica */}
      <div className="w-[280px] bg-[#0b4135] flex flex-col shrink-0 overflow-hidden">
        <div className="p-6 flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-4 mb-8">
             <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 shadow-inner">
                <Bot className="h-7 w-7" />
             </div>
             <div className="min-w-0">
                <h3 className="text-white font-black uppercase text-sm leading-none truncate">Mesa de Ayuda</h3>
                <div className="flex items-center gap-1.5 mt-1.5">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Sincronizado</span>
                </div>
             </div>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'conversaciones', label: 'Buzón Soporte', icon: MessageSquare, badge: queue.filter(q => q.status === 'pending').length },
              { id: 'mias', label: 'Mis casos', icon: User, badge: null },
              { id: 'no-asignadas', label: 'No asignadas', icon: UserPlus, badge: queue.filter(q => q.status === 'pending').length },
              { id: 'cerradas', label: 'Historial', icon: Archive, badge: null },
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => setCurrentFilter(item.id as any)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group",
                  currentFilter === item.id ? "bg-[#128c7e] text-white shadow-xl" : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                  <span className="text-xs font-black uppercase tracking-wider">{item.label}</span>
                </div>
                {item.badge !== null && item.badge > 0 && (
                  <Badge className="h-5 min-w-5 bg-emerald-400 text-[#0b4135] border-none text-[9px] font-black rounded-full shadow-lg">{item.badge}</Badge>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-3">
             <button onClick={() => setIsQrDialogOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 text-emerald-400 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/10 shadow-lg">
                <QrCode className="h-4 w-4" />
                <span className="text-[11px] font-black uppercase tracking-widest">Acceso Usuarios (QR)</span>
             </button>
          </div>
        </div>

        <div className="p-6 bg-black/20 flex items-center gap-4">
           <Avatar className="h-10 w-10 border-2 border-emerald-500 shadow-lg">
              <AvatarFallback className="bg-emerald-800 text-white font-black text-xs">AN</AvatarFallback>
           </Avatar>
           <div className="min-w-0">
              <p className="text-xs font-black text-white uppercase truncate">{techName}</p>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">Analista Auditor</p>
           </div>
        </div>
      </div>

      {/* Columna 2: Lista de Conversaciones */}
      <div className="w-[340px] flex flex-col bg-slate-50 border-r border-slate-200 shrink-0">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
             <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Conversaciones</h2>
             <button onClick={() => setQueue([])} className="h-8 w-8 rounded-lg bg-white shadow-sm border flex items-center justify-center text-slate-400 hover:text-primary transition-all"><RefreshCcw className="h-4 w-4" /></button>
          </div>
          <div className="relative group">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            <Input 
              placeholder="Buscar folio o usuario..." 
              className="h-11 pl-10 rounded-2xl bg-white border-none shadow-inner text-xs font-bold uppercase"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
           <div className="px-3 pb-6 space-y-1">
             {filteredQueue.map((chat) => (
               <button 
                 key={chat.id}
                 onClick={() => setSelectedRequest(chat)}
                 className={cn(
                   "w-full p-4 rounded-[2rem] text-left transition-all duration-300 flex items-center gap-4 relative border-2",
                   selectedRequest?.id === chat.id ? "bg-emerald-50 border-emerald-200 shadow-lg scale-[1.02]" : "bg-transparent border-transparent hover:bg-white/80"
                 )}
               >
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12 shadow-sm border-2 border-white">
                      <AvatarFallback className="bg-primary text-white font-black text-sm">{chat.userName?.slice(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className={cn("absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white shadow-sm", chat.status === 'pending' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-[12px] font-black text-slate-800 uppercase leading-none truncate">{chat.userName}</span>
                       <span className="text-[8px] font-black text-slate-400 font-mono">#{chat.id.split('-').at(-1)}</span>
                    </div>
                    <p className="text-[10px] font-semibold text-slate-400 truncate uppercase mt-1">
                      {chat.lastMessage || 'Nueva solicitud de soporte...'}
                    </p>
                  </div>
               </button>
             ))}
             {filteredQueue.length === 0 && (
               <div className="py-24 text-center opacity-30 px-10">
                  <MessageSquare className="h-14 w-14 mx-auto mb-4 text-slate-300" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sin folios activos en esta sección</p>
               </div>
             )}
           </div>
        </ScrollArea>
      </div>

      {/* Columna 3: Ventana de Chat Dinámica */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#f0f2f5]">
        {selectedRequest ? (
          <>
            <header className="px-8 py-4 bg-white border-b flex justify-between items-center shrink-0 shadow-sm z-10">
              <div className="flex items-center gap-5">
                <Avatar className="h-12 w-12 border-2 border-slate-100 shadow-sm">
                   <AvatarFallback className="bg-slate-200 text-slate-500 font-black">U</AvatarFallback>
                </Avatar>
                <div>
                   <h2 className="text-base font-black text-slate-800 uppercase leading-none">{selectedRequest.userName}</h2>
                   <div className="flex items-center gap-2 mt-1.5">
                      <Badge className={cn("border-none text-[8px] font-black uppercase px-2 h-5 rounded-full shadow-sm", 
                        selectedRequest.status === 'pending' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700')}>
                        {selectedRequest.status === 'pending' ? 'En espera' : 'Atendiendo'}
                      </Badge>
                      <span className="text-[9px] font-mono text-slate-300 tracking-tighter uppercase">{selectedRequest.id}</span>
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <Button variant="outline" className="rounded-xl h-10 px-4 border-slate-200 text-slate-400 hover:text-primary transition-all"><Printer className="h-4 w-4" /></Button>
                 <Button onClick={handleCloseChat} className="bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] h-10 px-8 rounded-xl shadow-xl transition-all active:scale-95">
                   Finalizar Atención
                 </Button>
              </div>
            </header>

            <ScrollArea className="flex-1 px-10 py-10 bg-[#efe7dd] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
               <div className="max-w-5xl mx-auto flex flex-col space-y-6">
                  <div className="self-center bg-white/50 backdrop-blur-md px-6 py-2 rounded-full border border-white text-[9px] font-black uppercase text-slate-400 tracking-widest shadow-sm">Hoy, {format(new Date(), 'dd MMMM yyyy')}</div>
                  {messages.map((msg, i) => {
                    const isTech = msg.role === 'tech';
                    const isBot = msg.role === 'bot';
                    return (
                      <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300", isTech ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[75%] p-5 rounded-3xl text-sm font-semibold shadow-lg transition-transform hover:scale-[1.01]", 
                          isTech ? "bg-[#e7ffdb] border border-emerald-100 rounded-tr-none text-slate-800" : 
                          isBot ? "bg-slate-800 text-white border-none rounded-tl-none" :
                          "bg-white border border-slate-200 rounded-tl-none text-slate-800")}>
                           <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                           <div className="text-[8px] font-black uppercase opacity-30 text-right mt-2 flex items-center justify-end gap-1">
                             <Clock className="h-2.5 w-2.5" />
                             {msg.timestamp?.seconds ? format(new Date(msg.timestamp.seconds * 1000), 'HH:mm') : 'Enviando...'}
                             {isTech && <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />}
                           </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={scrollRef} />
               </div>
            </ScrollArea>

            <footer className="p-6 bg-slate-50 border-t shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
               <div className="max-w-5xl mx-auto flex items-center gap-4">
                  <button className="h-12 w-12 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-500 transition-all flex items-center justify-center shadow-sm"><Paperclip className="h-5 w-5" /></button>
                  <Input 
                    placeholder="Escribir respuesta técnica..." 
                    className="h-12 rounded-2xl bg-white border-none shadow-inner px-6 font-bold text-sm text-slate-700 uppercase"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    disabled={isSending}
                  />
                  <Button onClick={() => handleSendMessage()} disabled={!input.trim() || isSending} className="bg-[#128c7e] hover:bg-[#075e54] h-12 w-12 rounded-2xl shadow-xl p-0 shrink-0 transition-all active:scale-90 flex items-center justify-center">
                    {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
               </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-20 animate-in fade-in duration-1000">
             <div className="h-40 w-40 rounded-full bg-slate-200 flex items-center justify-center mb-8 shadow-inner border-4 border-white">
                <MessageSquare className="h-20 w-20 text-slate-400" />
             </div>
             <h3 className="text-3xl font-black uppercase text-slate-800 tracking-tighter leading-none">Mesa de Ayuda Operativa</h3>
             <p className="text-sm font-bold uppercase tracking-[0.4em] text-slate-500 mt-6 border-y border-slate-300 py-2 px-6">Auditoría COEES • Ciclo 2025-2026</p>
          </div>
        )}
      </div>

      {/* Diálogo de Acceso Móvil (QR) */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="sm:max-w-[450px] w-[95vw] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-[#0b4135] text-white">
          <DialogHeader className="p-8 pb-4 text-center">
            <DialogTitle className="uppercase font-black text-xl flex items-center justify-center gap-3">
              <QrCode className="h-8 w-8 text-emerald-400" /> Acceso Móvil ATRES
            </DialogTitle>
            <DialogDescription className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mt-1">Sincronización segura con portal de usuario</DialogDescription>
          </DialogHeader>
          <div className="px-8 pb-8 space-y-6 flex flex-col items-center text-center">
            <div className="p-6 bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[260px] mx-auto border-4 border-emerald-500/20">
               <div className="aspect-square relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white">
                  <Image 
                    src={qrUrl} 
                    alt="Código QR de Soporte" 
                    fill 
                    className="object-contain p-4" 
                    unoptimized 
                  />
               </div>
            </div>
            <div className="space-y-4 w-full">
               <div className="p-4 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                     <div className="flex-1 min-w-0 bg-black/30 px-3 py-2.5 rounded-xl text-[9px] font-mono text-emerald-400/80 truncate text-left border border-white/5">{supportUrl}</div>
                     <Button onClick={() => { navigator.clipboard.writeText(supportUrl); toast({ title: "Enlace Copiado" }); }} className="h-10 w-10 rounded-xl bg-emerald-500 text-white shadow-xl p-0 hover:scale-105 transition-transform"><Copy className="h-4 w-4" /></Button>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-3 w-full">
                  <Button onClick={() => window.open(supportUrl, '_blank')} className="bg-white text-[#0b4135] font-black uppercase text-[9px] h-11 rounded-xl shadow-lg hover:bg-slate-50">PROBAR LIGA</Button>
                  <Button variant="ghost" onClick={() => setIsQrDialogOpen(false)} className="text-white/60 font-black uppercase text-[9px] border border-white/10 h-11 rounded-xl hover:bg-white/5">CERRAR</Button>
               </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

