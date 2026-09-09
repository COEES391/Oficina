'use client';
/**
 * @fileOverview Interfaz de Mesa de Ayuda ATRES de Alta Fidelidad.
 * Rediseñada para implementar el sistema de 3 columnas (Navegación, Lista, Chat).
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  ListFilter
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
  const [remoteId, setRemoteId] = useState(''); 
  const [queue, setQueue] = useState<SupportRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [techName, setTechName] = useState('');
  const [mounted, setMounted] = useState(false);
  const [sessionKey, setSessionKey] = useState<string>('');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<'conversaciones' | 'mias' | 'no-asignadas' | 'cerradas'>('conversaciones');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeChatId = useMemo(() => {
    if (isPublic) return sessionKey;
    return selectedRequest?.ticketNumber || null;
  }, [isPublic, sessionKey, selectedRequest]);

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

  // Escuchar Cola Live
  useEffect(() => {
    if (!mounted || isPublic) return;
    const q = query(collection(db, 'atres_support_queue'), orderBy('lastActivity', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQueue(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as SupportRequest[]);
    });
    return () => unsubscribe();
  }, [mounted, isPublic]);

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
    if (!chatId) return;

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
      toast({ variant: "destructive", title: "Error al enviar mensaje" });
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

  if (!mounted) return null;

  // Renderizado para Usuario Público
  if (isPublic) {
    return (
      <div className="flex flex-col h-full bg-[#f8f5f0] overflow-hidden rounded-[3rem] shadow-2xl border border-white/40">
        <header className="px-8 py-6 bg-white border-b flex justify-between items-center shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#B38E5D] text-white flex items-center justify-center shadow-xl">
              <Bot className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase leading-none">Asistente COEES</h2>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">En línea • Chat Seguro</p>
            </div>
          </div>
        </header>
        <ScrollArea className="flex-1 px-8 py-10">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2", msg.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] p-4 rounded-3xl text-sm font-semibold shadow-md", 
                  msg.role === 'user' ? "bg-[#B38E5D] text-white rounded-tr-none" : "bg-white text-slate-700 rounded-tl-none")}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <div className="text-[8px] mt-2 font-black uppercase opacity-40 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {msg.timestamp?.seconds ? format(new Date(msg.timestamp.seconds * 1000), 'HH:mm') : '--:--'}
                  </div>
                </div>
              </div>
            ))}
            {isBotThinking && <div className="flex justify-start animate-pulse"><div className="bg-white/50 px-4 py-2 rounded-full text-[9px] font-black text-slate-400 uppercase">Analizando...</div></div>}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
        <footer className="p-6 bg-white/50 backdrop-blur-md border-t border-white/20 shrink-0">
          <div className="max-w-4xl mx-auto flex gap-3">
            <Input 
              placeholder="Escriba su duda técnica aquí..." 
              className="h-12 rounded-2xl bg-white border-2 border-slate-100 px-6 font-semibold"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={() => handleSendMessage()} disabled={!input.trim() || isSending} className="h-12 w-12 rounded-2xl bg-[#9f2241] shadow-xl">
              {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </footer>
      </div>
    );
  }

  // Renderizado para Analista (3 Columnas)
  return (
    <div className="flex h-full w-full overflow-hidden bg-white">
      {/* Columna 1: Navegación Táctica (Verde Oscuro) */}
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

      {/* Columna 2: Listado de Chats (Gris Claro) */}
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

      {/* Columna 3: Ventana de Chat (Blanco/Beige) */}
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
                    return (
                      <div key={i} className={cn("flex w-full animate-in slide-in-from-bottom-2", isTech ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[70%] p-3.5 rounded-2xl text-sm font-semibold shadow-xl border relative", 
                          isTech ? "bg-[#e7ffdb] text-slate-700 rounded-tr-none border-emerald-100" : "bg-white text-slate-700 rounded-tl-none border-slate-100")}>
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
    </div>
  );
}
