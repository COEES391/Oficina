'use client';
/**
 * @fileOverview Interfaz de Mesa de Ayuda ATRES de Alta Fidelidad.
 * Sistema de 3 columnas para analistas y Dashboard de servicios para usuarios públicos.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  UserCog,
  MessageSquare,
  CheckCircle2,
  Paperclip,
  FileText,
  Clock,
  Activity,
  Monitor,
  X,
  Search,
  User,
  History,
  Circle,
  Copy,
  Loader2,
  QrCode,
  Users,
  UserPlus,
  Zap,
  Tag,
  BarChart3,
  Settings,
  MoreVertical,
  Star,
  Mic,
  Smile,
  ChevronDown,
  ListFilter,
  PlusCircle,
  ExternalLink,
  Share2,
  Menu,
  Bell,
  BookOpen,
  HelpCircle,
  Lock,
  Mail,
  Laptop,
  GraduationCap,
  MoreHorizontal,
  ShieldCheck,
  Headphones
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
  updateDoc, 
  setDoc,
  deleteDoc,
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
  fileData?: string; 
  fileName?: string;
  fileType?: string;
};

type SupportRequest = {
  id: string;
  remoteId: string;
  ticketNumber: string;
  timestamp: any;
  status: 'pending' | 'attending';
  requestType?: 'remote' | 'chat';
  chatKey: string;
  userName?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
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
  const [currentFilter, setCurrentFilter] = useState<'conversaciones' | 'mias' | 'no-asignadas' | 'cerradas'>('conversaciones');
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeChatId = useMemo(() => {
    if (isPublic) return sessionKey;
    return selectedRequest?.ticketNumber || null;
  }, [isPublic, sessionKey, selectedRequest]);

  const supportUrl = "https://6000-firebase-planeacin-1776866447103.cluster-gizzoza7hzhfyxzo5d76y3flkw.cloudworkstations.dev/helpdesk";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(supportUrl)}`;

  const generateTurnSessionId = useCallback(() => {
    const now = new Date();
    const dateStr = format(now, 'yyyyMMdd');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `USER-${dateStr}-${random}`;
  }, []);

  useEffect(() => {
    setMounted(true);
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
            lastActivity: serverTimestamp(),
            userName: `Usuario ${sKey.split('-').at(-1)}`
          }, { merge: true });
        } catch (e) { console.error(e); }
      };
      initQueue();
    } else {
      const savedTechName = localStorage.getItem('atres_tech_name') || 'Laura Gómez';
      setTechName(savedTechName);
    }
  }, [isPublic, generateTurnSessionId]);

  useEffect(() => {
    if (!mounted || isPublic) return;
    const q = query(collection(db, 'atres_support_queue'), orderBy('lastActivity', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQueue(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as SupportRequest[]);
    });
    return () => unsubscribe();
  }, [mounted, isPublic]);

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
  }, [mounted, activeChatId, isPublic]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (msgData?: { content?: string, fileData?: { data: string, name: string, type: string } }) => {
    const textToSend = msgData?.content ?? input;
    if (!textToSend.trim() && !msgData?.fileData) return;
    
    const chatId = activeChatId || sessionKey;
    if (!chatId) {
      toast({ variant: "destructive", title: "Error de sesión", description: "Iniciando conexión segura..." });
      return;
    }

    setIsSending(true);
    try {
      const queueRef = doc(db, 'atres_support_queue', chatId);
      await updateDoc(queueRef, { 
        lastActivity: serverTimestamp(), 
        lastMessage: textToSend.substring(0, 40),
        status: isPublic ? 'pending' : 'attending' 
      });

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
      toast({ variant: "destructive", title: "Error al enviar mensaje", description: "Verifique su conexión a internet." });
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseChat = async () => {
    if (!selectedRequest) return;
    if (confirm("¿Desea finalizar esta conversación?")) {
      await deleteDoc(doc(db, 'atres_support_queue', selectedRequest.id));
      setSelectedRequest(null);
      toast({ title: "Conversación cerrada" });
    }
  };

  const copySupportLink = () => {
    navigator.clipboard.writeText(supportUrl);
    toast({ title: "Liga copiada", description: "Enlace de soporte listo para compartir." });
  };

  if (!mounted) return null;

  if (isPublic) {
    return (
      <div className="flex h-full w-full bg-[#f4f7f9] overflow-hidden">
        {/* Sidebar Public View */}
        <aside className="hidden lg:flex w-[260px] bg-[#1a2b4b] flex-col shrink-0 p-6">
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
            <Button variant="ghost" className="w-full justify-start text-white bg-white/10 hover:bg-white/20 rounded-xl h-11 text-xs font-bold gap-3 mb-4">
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

          <div className="mt-auto space-y-6">
             <div className="bg-[#2a3c5d] p-5 rounded-[1.8rem] space-y-4">
                <p className="text-[10px] font-black text-white uppercase tracking-wider leading-relaxed">¿Necesitas ayuda inmediata?</p>
                <p className="text-[9px] text-white/50 leading-relaxed">Si tu problema es urgente, conéctate con un técnico.</p>
                <Button className="w-full bg-[#0052cc] hover:bg-[#0047b3] text-white rounded-xl h-10 text-[10px] font-black gap-2">
                   <Headphones className="h-4 w-4" /> Hablar con un técnico
                </Button>
                <div className="flex items-center gap-2 mt-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">En línea: 2 técnicos disponibles</span>
                </div>
             </div>

             <div className="flex items-center gap-3 opacity-40 px-2">
                <ShieldCheck className="h-4 w-4 text-white" />
                <div className="space-y-0.5">
                   <p className="text-[8px] font-black text-white uppercase leading-none">Soporte confiable</p>
                   <p className="text-[7px] text-white font-bold leading-tight">Tu solicitud será atendida y daremos seguimiento hasta su solución.</p>
                </div>
             </div>
          </div>
        </aside>

        {/* Main Content Public View */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0 relative z-20">
             <div className="flex items-center gap-4">
                <Menu className="h-5 w-5 text-slate-400 lg:hidden" />
                <div className="flex items-center gap-3">
                   <h2 className="text-sm font-black text-slate-700 uppercase tracking-tight">Mesa de Ayuda ATRES</h2>
                   <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase px-2 h-5 rounded-full">
                      <Circle className="h-1.5 w-1.5 fill-current mr-1.5" /> En línea
                   </Badge>
                </div>
             </div>

             <div className="flex items-center gap-8">
                <div className="hidden md:flex items-center gap-2">
                   <Clock className="h-4 w-4 text-slate-300" />
                   <div className="space-y-0">
                      <p className="text-[8px] font-black text-slate-400 uppercase leading-none">Horario de atención</p>
                      <p className="text-[10px] font-bold text-slate-600 mt-0.5">8:00 a.m. - 4:00 p.m.</p>
                   </div>
                </div>
                <div className="flex items-center gap-3 pl-8 border-l">
                   <Avatar className="h-8 w-8 shadow-sm">
                      <AvatarFallback className="bg-slate-100 text-slate-400 font-bold text-[10px]">IN</AvatarFallback>
                   </Avatar>
                   <div className="hidden sm:flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-700 uppercase">Invitado</span>
                      <ChevronDown className="h-4 w-4 text-slate-300" />
                   </div>
                </div>
             </div>
          </header>

          <ScrollArea className="flex-1 bg-[#f4f7f9] p-8">
             <div className="max-w-4xl mx-auto space-y-10 pb-20">
                {/* Hero Section */}
                <div className="bg-[#eef4ff] rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10 shadow-sm border border-white relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                   <div className="relative shrink-0">
                      <div className="h-32 w-32 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-[#e1ebff]">
                         <Bot className="h-16 w-16 text-[#0052cc]" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-white shadow-lg animate-bounce">
                         <Smile className="h-5 w-5" />
                      </div>
                   </div>
                   <div className="space-y-4 text-center md:text-left flex-1 relative z-10">
                      <h3 className="text-2xl font-black text-[#1a2b4b] uppercase leading-tight tracking-tighter">¡Hola! 👋 Soy el Asistente Virtual de COEES</h3>
                      <p className="text-sm font-semibold text-slate-600 leading-relaxed max-w-lg">Estoy aquí para ayudarte. Describe tu problema y lo canalizaremos con un técnico de soporte que te dará seguimiento hasta su solución.</p>
                      <div className="flex flex-wrap items-center gap-6 pt-2">
                         <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-[#0052cc]"><FileText className="h-5 w-5" /></div>
                            <div><p className="text-[9px] font-black text-slate-800 uppercase leading-none">Crea tu solicitud</p><p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">En segundos</p></div>
                         </div>
                         <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600"><Users className="h-5 w-5" /></div>
                            <div><p className="text-[9px] font-black text-slate-800 uppercase leading-none">Un técnico te atenderá</p><p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">De forma personalizada</p></div>
                         </div>
                         <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600"><Clock className="h-5 w-5" /></div>
                            <div><p className="text-[9px] font-black text-slate-800 uppercase leading-none">Damos seguimiento</p><p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Hasta resolver tu caso</p></div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Categories */}
                <div className="space-y-8 pt-4">
                   <h4 className="text-base font-black text-slate-800 uppercase tracking-widest text-center md:text-left">¿En qué podemos ayudarte hoy?</h4>
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {[
                        { id: 'pass', label: 'Restablecer contraseña', icon: Lock, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'Problemas para iniciar sesión.' },
                        { id: 'mail', label: 'Correo institucional', icon: Mail, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Acceso, envío o configuración.' },
                        { id: 'tech', label: 'Soporte técnico', icon: Laptop, color: 'text-orange-500', bg: 'bg-orange-50', sub: 'Fallas en equipos, impresoras, red, etc.' },
                        { id: 'lib', label: 'Biblioteca Digital', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50', sub: 'Acceso, errores o contenidos.' },
                        { id: 'edu', label: 'Moodle / Plataforma Educativa', icon: GraduationCap, color: 'text-cyan-600', bg: 'bg-cyan-50', sub: 'Acceso, actividades o calificaciones.' },
                        { id: 'other', label: 'Otro problema', icon: MoreHorizontal, color: 'text-rose-500', bg: 'bg-rose-50', sub: 'Otro tipo de consulta o incidencia.' },
                      ].map((cat) => (
                        <button 
                          key={cat.id} 
                          onClick={() => setSelectedCategory(cat.label)}
                          className={cn(
                            "flex flex-col items-center text-center p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:scale-105 group",
                            selectedCategory === cat.label && "border-[#0052cc] ring-2 ring-blue-500/20 shadow-xl"
                          )}
                        >
                           <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-5 shadow-inner transition-transform group-hover:rotate-6", cat.bg, cat.color)}>
                              <cat.icon className="h-6 w-6" />
                           </div>
                           <h5 className="text-[10px] font-black text-slate-800 uppercase leading-tight mb-2 min-h-[2.5rem] flex items-center justify-center">{cat.label}</h5>
                           <p className="text-[8px] font-bold text-slate-400 uppercase leading-relaxed tracking-wider">{cat.sub}</p>
                        </button>
                      ))}
                   </div>
                </div>

                <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                   <Info className="h-5 w-5 text-[#0052cc] shrink-0" />
                   <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">Si no encuentras la opción que necesitas, escríbenos tu problema en el cuadro de abajo y te ayudaremos.</p>
                </div>

                {/* Messages if any */}
                {messages.length > 0 && (
                   <div className="space-y-6 pt-10 border-t">
                      {messages.map((msg, i) => (
                        <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2", msg.role === 'user' ? "justify-end" : "justify-start")}>
                          <div className={cn("max-w-[85%] p-5 rounded-3xl text-sm font-semibold shadow-md", 
                            msg.role === 'user' ? "bg-[#0052cc] text-white rounded-tr-none" : "bg-white text-slate-700 rounded-tl-none")}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <div className="text-[8px] mt-2 font-black uppercase opacity-40 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {msg.timestamp?.seconds ? format(new Date(msg.timestamp.seconds * 1000), 'HH:mm') : '--:--'}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isBotThinking && <div className="flex justify-start animate-pulse"><div className="bg-white/50 px-5 py-2.5 rounded-full text-[9px] font-black text-slate-400 uppercase">El asistente está analizando...</div></div>}
                      <div ref={scrollRef} />
                   </div>
                )}
             </div>
          </ScrollArea>

          {/* Input Area Public View */}
          <footer className="p-8 bg-white border-t border-slate-100 shrink-0 relative z-30">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] px-6 focus-within:border-blue-500/30 focus-within:bg-white transition-all shadow-inner">
                <button className="h-10 w-10 text-slate-400 hover:text-[#0052cc] transition-colors"><Paperclip className="h-6 w-6" /></button>
                <Input 
                  placeholder={selectedCategory ? `Dinos más sobre ${selectedCategory.toLowerCase()}...` : "Describe tu incidencia o escribe tu mensaje para comunicarte con un técnico..."}
                  className="h-14 bg-transparent border-none font-bold text-sm text-slate-700 focus:ring-0 px-0"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                />
                <Button 
                  onClick={() => handleSendMessage()} 
                  disabled={!input.trim() || isSending} 
                  className="bg-[#0052cc] hover:bg-[#0047b3] text-white font-black uppercase text-[11px] h-10 px-8 rounded-xl shadow-xl gap-2 transition-all active:scale-95"
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Enviar
                </Button>
              </div>
              <div className="flex justify-center items-center gap-2 opacity-30">
                 <ShieldCheck className="h-3 w-3 text-slate-500" />
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Tu información está segura. Consulta nuestro aviso de privacidad.</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-white">
      {/* Analist View Sidebar (Left) */}
      <div className="w-[280px] bg-[#0b4135] flex flex-col shrink-0 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-8">
             <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-emerald-400 shadow-inner">
                <Bot className="h-6 w-6" />
             </div>
             <div className="min-w-0">
                <h3 className="text-white font-black uppercase text-sm leading-none truncate">Mesa de Ayuda</h3>
                <div className="flex items-center gap-1.5 mt-1.5">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">En línea</span>
                   <ChevronDown className="h-3 w-3 text-white/40" />
                </div>
             </div>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'conversaciones', label: 'Conversaciones', icon: MessageSquare, badge: queue.length },
              { id: 'mias', label: 'Mías', icon: User, badge: 5 },
              { id: 'no-asignadas', label: 'No asignadas', icon: UserPlus, badge: queue.filter(q => q.status === 'pending').length },
              { id: 'asignadas', label: 'Asignadas', icon: Users, badge: 18 },
              { id: 'cerradas', label: 'Cerradas', icon: CheckCircle2, badge: null },
              { id: 'todas', label: 'Todas', icon: ListFilter, badge: 42 },
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => setCurrentFilter(item.id as any)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group",
                  currentFilter === item.id ? "bg-[#128c7e] text-white shadow-lg shadow-black/20" : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-wider">{item.label}</span>
                </div>
                {item.badge !== null && (
                  <Badge className={cn(
                    "h-5 min-w-5 flex items-center justify-center rounded-full text-[9px] font-black border-none",
                    currentFilter === item.id ? "bg-white text-[#128c7e]" : "bg-white/10 text-white/60"
                  )}>{item.badge}</Badge>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-10 space-y-4">
             <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-4">Herramientas</p>
             <nav className="space-y-1">
                <button onClick={() => setIsQrDialogOpen(true)} className="w-full flex items-center gap-3 px-4 py-2.5 text-emerald-400 hover:text-white transition-colors bg-emerald-500/10 rounded-xl mb-4">
                   <QrCode className="h-4 w-4" />
                   <span className="text-[11px] font-bold uppercase tracking-wide">Acceso Usuarios (QR)</span>
                </button>
                {[
                  { label: 'Respuestas rápidas', icon: Zap },
                  { label: 'Etiquetas', icon: Tag },
                  { label: 'Contactos', icon: User },
                  { label: 'Reportes', icon: BarChart3 },
                  { label: 'Configuración', icon: Settings },
                ].map((item, idx) => (
                  <button key={idx} className="w-full flex items-center gap-3 px-4 py-2.5 text-white/60 hover:text-white transition-colors">
                     <item.icon className="h-4 w-4" />
                     <span className="text-[11px] font-bold uppercase tracking-wide">{item.label}</span>
                  </button>
                ))}
             </nav>
          </div>
        </div>

        <div className="mt-auto p-6 bg-black/20">
           <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-emerald-500 shadow-xl">
                 <AvatarImage src="https://picsum.photos/seed/laura/100/100" />
                 <AvatarFallback>LG</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                 <p className="text-xs font-black text-white uppercase leading-none truncate">{techName}</p>
                 <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">Agente Analista</p>
              </div>
              <button className="ml-auto text-white/20 hover:text-white transition-colors"><MoreVertical className="h-4 w-4" /></button>
           </div>
        </div>
      </div>

      {/* Analist View Middle Column (Conversation List) */}
      <div className="w-[340px] flex flex-col bg-slate-50 border-r border-slate-200 shrink-0">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
             <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Conversaciones</h2>
             <button className="h-8 w-8 rounded-lg bg-white shadow-sm border flex items-center justify-center text-slate-400 hover:text-primary transition-all"><PlusCircle className="h-4 w-4" /></button>
          </div>
          <div className="relative group">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            <Input 
              placeholder="Buscar conversaciones..." 
              className="h-11 pl-10 rounded-2xl bg-white border-none shadow-sm text-xs font-bold"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
           <div className="px-3 pb-6 space-y-1">
             {queue.map((chat) => (
               <button 
                 key={chat.id}
                 onClick={() => setSelectedRequest(chat)}
                 className={cn(
                   "w-full p-4 rounded-[1.8rem] text-left transition-all duration-300 flex items-center gap-4 relative group",
                   selectedRequest?.id === chat.id ? "bg-emerald-50 shadow-md border border-emerald-100" : "hover:bg-white/80"
                 )}
               >
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12 shadow-md border-2 border-white">
                      <AvatarImage src={`https://picsum.photos/seed/${chat.id}/100/100`} />
                      <AvatarFallback className="bg-[#B38E5D] text-white font-black">{chat.userName?.slice(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                       <span className="text-[13px] font-black text-slate-800 uppercase leading-none truncate">{chat.userName || 'Usuario'}</span>
                       <span className="text-[9px] font-bold text-slate-400">11:45</span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-400 truncate leading-tight">
                      {chat.lastMessage || 'Hola, necesito ayuda con mi cuenta...'}
                    </p>
                  </div>
                  {(chat.unreadCount || 0) > 0 && (
                    <Badge className="bg-[#25d366] text-white border-none h-5 min-w-5 flex items-center justify-center rounded-full text-[9px] font-black">{chat.unreadCount}</Badge>
                  )}
               </button>
             ))}
             {queue.length === 0 && (
               <div className="py-20 text-center opacity-30 px-10">
                  <MessageSquare className="h-10 w-10 mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Sin chats activos en este momento</p>
               </div>
             )}
           </div>
        </ScrollArea>
      </div>

      {/* Analist View Chat Window (Right) */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#f0f2f5] relative">
        {selectedRequest ? (
          <>
            <header className="px-8 py-4 bg-white/95 backdrop-blur-md border-b flex justify-between items-center z-10 shrink-0">
              <div className="flex items-center gap-5">
                <Avatar className="h-12 w-12 shadow-lg border-2 border-white">
                   <AvatarImage src={`https://picsum.photos/seed/${selectedRequest.id}/100/100`} />
                   <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div>
                   <h2 className="text-base font-black text-slate-800 uppercase leading-none">{selectedRequest.userName}</h2>
                   <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[8px] font-black uppercase h-5 px-2">Asignada a ti</Badge>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">• {selectedRequest.ticketNumber}</span>
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <button className="h-10 w-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all"><Tag className="h-5 w-5" /></button>
                 <button className="h-10 w-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all"><Star className="h-5 w-5" /></button>
                 <button className="h-10 w-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all mr-2"><MoreVertical className="h-5 w-5" /></button>
                 <Button onClick={handleCloseChat} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] h-10 px-6 rounded-xl shadow-lg flex items-center gap-2">
                    Cerrar conversación <ChevronDown className="h-4 w-4" />
                 </Button>
              </div>
            </header>

            <ScrollArea className="flex-1 px-10 py-10 bg-[#efe7dd] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
               <div className="max-w-5xl mx-auto flex flex-col space-y-6">
                  <div className="self-center bg-white/40 backdrop-blur-md px-6 py-1.5 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest shadow-sm">Hoy</div>
                  
                  {messages.map((msg, i) => {
                    const isTech = msg.role === 'tech';
                    const isBot = msg.role === 'bot';
                    return (
                      <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2", isTech ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[70%] p-3.5 rounded-2xl text-sm font-semibold shadow-xl border relative", 
                          isTech ? "bg-[#e7ffdb] text-slate-700 rounded-tr-none border-emerald-100" : 
                          isBot ? "bg-slate-800 text-white border-none" :
                          "bg-white text-slate-700 rounded-tl-none border-slate-100")}>
                           <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                           <div className="flex items-center justify-end gap-1.5 mt-2 opacity-40">
                              <span className="text-[8px] font-black uppercase">11:41</span>
                              {isTech && <div className="flex"><CheckCircle2 className="h-3 w-3 text-blue-500" /><CheckCircle2 className="h-3 w-3 text-blue-500 -ml-1.5" /></div>}
                           </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={scrollRef} />
               </div>
            </ScrollArea>

            <footer className="p-6 bg-[#f0f2f5] border-t shrink-0">
               <div className="max-w-5xl mx-auto flex items-center gap-4">
                  <div className="flex gap-2">
                     <button className="h-10 w-10 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all"><Smile className="h-6 w-6" /></button>
                     <button onClick={() => fileInputRef.current?.click()} className="h-10 w-10 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all"><Paperclip className="h-6 w-6" /></button>
                     <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={(e) => {}} />
                  </div>
                  <div className="flex-1 relative group">
                    <Input 
                      placeholder="Escribe un mensaje..." 
                      className="h-12 rounded-2xl bg-white border-none shadow-sm px-6 font-semibold text-sm focus:ring-0"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    />
                  </div>
                  <button className="h-10 w-10 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all"><Mic className="h-6 w-6" /></button>
               </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6 opacity-30 animate-in zoom-in-95">
             <div className="h-40 w-40 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 shadow-inner">
                <MessageSquare className="h-20 w-20" />
             </div>
             <div className="space-y-2">
                <h3 className="text-3xl font-black uppercase text-slate-800 tracking-tighter">Centro de Atención Técnica</h3>
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500 max-w-md mx-auto">Seleccione una conversación del listado izquierdo para iniciar el proceso de soporte remoto.</p>
             </div>
          </div>
        )}
      </div>

      {/* QR Code Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="sm:max-w-[450px] w-[95vw] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-[#0b4135] text-white">
          <DialogHeader className="p-8 pb-0 text-center">
            <DialogTitle className="uppercase font-black text-xl flex items-center justify-center gap-3">
              <QrCode className="h-7 w-7 text-emerald-400" /> Acceso Móvil ATRES
            </DialogTitle>
            <DialogDescription className="text-emerald-400/60 text-[10px] font-bold uppercase tracking-widest mt-1">
              Liga oficial de soporte técnico remoto
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-8 text-center flex flex-col items-center">
            <div className="relative group p-4 bg-white rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-500 w-full max-w-[280px]">
               <div className="aspect-square relative overflow-hidden rounded-[2rem] border-4 border-slate-50">
                  <Image 
                    src={qrUrl} 
                    alt="QR Soporte" 
                    fill 
                    className="object-contain p-2"
                    unoptimized
                  />
               </div>
               <div className="absolute inset-0 bg-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem] flex items-center justify-center pointer-events-none">
                  <Share2 className="h-8 w-8 text-emerald-600" />
               </div>
            </div>

            <div className="space-y-4 w-full">
               <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">Enlace Directo</p>
                  <div className="flex items-center gap-2">
                     <div className="flex-1 min-w-0 bg-black/20 px-3 py-2 rounded-lg border border-white/5 text-[9px] font-mono text-white/40 truncate text-left">
                        {supportUrl}
                     </div>
                     <Button onClick={copySupportLink} className="h-10 w-10 rounded-lg bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 shrink-0 p-0">
                        <Copy className="h-4 w-4" />
                     </Button>
                  </div>
               </div>
               <Button onClick={() => window.open(supportUrl, '_blank')} className="w-full h-12 rounded-xl bg-white text-[#0b4135] font-black uppercase text-[10px] gap-2 shadow-xl hover:bg-slate-100">
                  <ExternalLink className="h-4 w-4" /> Probar en nueva pestaña
               </Button>
            </div>
          </div>
          <DialogFooter className="p-5 bg-black/20 border-t border-white/5 flex justify-center">
             <button onClick={() => setIsQrDialogOpen(false)} className="text-[9px] font-black uppercase text-white/30 hover:text-white transition-colors">Cerrar Generador</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
