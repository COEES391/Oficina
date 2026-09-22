'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Send, 
  Bot, 
  MessageSquare,
  Loader2,
  Monitor,
  ShieldCheck,
  Bell,
  Volume2,
  ChevronRight,
  MonitorCheck,
  CheckCircle2,
  BarChart3,
  Users,
  Star,
  RotateCcw,
  X,
  Paperclip,
  Clock,
  LayoutDashboard,
  FileText,
  HelpCircle,
  User,
  LogOut,
  Plus,
  Filter,
  MoreVertical,
  Activity,
  History,
  MoreHorizontal,
  Calendar,
  Settings,
  Search
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
  limit,
  updateDoc
} from 'firebase/firestore';
import { type SupportRequestLive } from '@/lib/planning-data';

type Message = {
  id?: string;
  chatId: string;
  role: 'user' | 'tech' | 'bot';
  content: string;
  timestamp: any;
  senderName?: string;
};

export function HelpDeskInterface({ isPublic = false }: { isPublic?: boolean }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [queue, setQueue] = useState<SupportRequestLive[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequestLive | null>(null);
  const [activeSidebar, setActiveSidebar] = useState('tickets');
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

  useEffect(() => {
    setMounted(true);
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.load();
    audioRef.current = audio;
  }, []);

  // ANALISTA: Monitor de solicitudes
  useEffect(() => {
    if (!mounted || isPublic) return;
    
    const q = query(
      collection(db, 'support_queue'), 
      where('status', 'in', ['pending', 'attending']),
      orderBy('lastActivity', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const activeQueue = snap.docs.map(d => ({ ...d.data(), id: d.id } as SupportRequestLive));
      setQueue(activeQueue);
    });

    return () => unsubscribe();
  }, [isPublic, mounted]);

  // ESCUCHA DE MENSAJES
  useEffect(() => {
    if (!mounted || !selectedRequest?.id) {
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
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [mounted, selectedRequest?.id]);

  const handleJoinSupport = async () => {
    if (!userData.name.trim() || !userData.cct.trim()) {
      toast({ variant: "destructive", title: "Faltan datos" });
      return;
    }
    
    setIsJoining(true);
    const requestId = `REQ-${Date.now()}`;
    const ticketNum = `TK-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    
    try {
      const requestData = {
        userName: userData.name.toUpperCase(),
        cct: userData.cct.toUpperCase(),
        status: 'pending',
        priority: 'medium',
        category: 'Correo Institucional',
        department: 'Soporte Técnico',
        lastActivity: serverTimestamp(),
        createdAt: serverTimestamp(),
        lastMessage: '🔔 Usuario inició sesión...',
        lastSenderRole: 'bot',
        ticketNumber: ticketNum,
        assignedTo: 'Por asignar'
      };
      
      await setDoc(doc(db, 'support_queue', requestId), requestData);
      await addDoc(collection(db, 'chat_messages'), {
        chatId: requestId,
        role: 'bot',
        content: `Hola ${userData.name.toUpperCase()}. Tu folio es: ${ticketNum}. Un analista te atenderá pronto.`,
        timestamp: serverTimestamp()
      });

      setSelectedRequest({ ...requestData, id: requestId } as any);
      setHasJoined(true);
    } catch (error) {
      toast({ variant: "destructive", title: "Error de conexión" });
    } finally {
      setIsJoining(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedRequest?.id) return;
    setIsSending(true);

    const msgContent = input;
    const chatId = selectedRequest.id;
    setInput('');

    try {
      await addDoc(collection(db, 'chat_messages'), {
        chatId: chatId,
        role: isPublic ? 'user' : 'tech',
        content: msgContent,
        senderName: isPublic ? userData.name : 'Analista',
        timestamp: serverTimestamp()
      });

      await updateDoc(doc(db, 'support_queue', chatId), { 
        lastActivity: serverTimestamp(), 
        lastMessage: msgContent.substring(0, 80),
        lastSenderRole: isPublic ? 'user' : 'tech'
      });

    } catch (error) {
      setInput(msgContent);
    } finally {
      setIsSending(false);
    }
  };

  const updateTicketMeta = async (field: string, value: string) => {
    if (!selectedRequest?.id) return;
    try {
      await updateDoc(doc(db, 'support_queue', selectedRequest.id), { [field]: value });
      toast({ title: "Cambio guardado" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al actualizar" });
    }
  };

  if (!mounted) return null;

  // --- VISTA USUARIO FINAL ---
  if (isPublic) {
    if (!hasJoined) {
      return (
        <div className="h-full w-full bg-slate-100 flex items-center justify-center p-6">
          <Card className="w-full max-w-[450px] rounded-[2.5rem] border-none shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700">
             <div className="p-10 bg-[#9f2241] text-white text-center space-y-4">
                <div className="h-20 w-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto border border-white/10">
                   <Monitor className="h-10 w-10 text-white" />
                </div>
                <div>
                   <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Mesa de Ayuda ATRES</h2>
                   <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Plataforma Oficial de Soporte</p>
                </div>
             </div>
             <div className="p-10 bg-white space-y-6">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Tu Nombre Completo</Label>
                   <Input 
                      placeholder="ESCRIBA AQUÍ..." 
                      className="h-12 rounded-xl bg-slate-50 border-none font-bold uppercase shadow-inner" 
                      value={userData.name} 
                      onChange={e => setUserData({...userData, name: e.target.value})} 
                      disabled={isJoining} 
                   />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">CCT del Plantel</Label>
                   <Input 
                      placeholder="15DESXXXXX" 
                      className="h-12 rounded-xl bg-slate-50 border-none font-mono font-black uppercase text-primary shadow-inner" 
                      value={userData.cct} 
                      onChange={e => setUserData({...userData, cct: e.target.value})} 
                      maxLength={10} 
                      disabled={isJoining} 
                   />
                </div>
                <Button onClick={handleJoinSupport} disabled={isJoining} className="w-full btn-institutional h-14 shadow-2xl mt-4">
                   {isJoining ? <><Loader2 className="animate-spin h-5 w-5 mr-2" /> CONECTANDO...</> : "INICIAR SOPORTE EN VIVO"}
                </Button>
             </div>
          </Card>
        </div>
      );
    }

    return (
      <div className="h-full w-full bg-[#f4f7fe] flex overflow-hidden font-sans">
        {/* Sidebar Usuario */}
        <aside className="w-[280px] bg-white border-r flex flex-col shrink-0 z-40">
           <div className="p-8 pb-4 flex items-center gap-3">
              <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg"><Bot className="h-6 w-6" /></div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">HelpDesk</h2>
           </div>
           <nav className="flex-1 px-4 py-6 space-y-2">
              {[
                { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
                { id: 'tickets', label: 'Mis Tickets', icon: FileText },
                { id: 'nuevo', label: 'Nuevo Ticket', icon: Plus },
                { id: 'chat', label: 'Conversaciones', icon: MessageSquare },
                { id: 'notif', label: 'Notificaciones', icon: Bell, badge: '2' },
                { id: 'base', label: 'Base de conocimiento', icon: HelpCircle },
                { id: 'perfil', label: 'Perfil', icon: User },
              ].map(item => (
                <button 
                  key={item.id} 
                  className={cn(
                    "w-full h-11 px-4 rounded-xl flex items-center justify-between text-xs font-bold uppercase transition-all",
                    activeSidebar === item.id ? "bg-primary/5 text-primary" : "text-slate-400 hover:bg-slate-50"
                  )}
                  onClick={() => setActiveSidebar(item.id)}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && <Badge className="bg-rose-500 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">{item.badge}</Badge>}
                </button>
              ))}
           </nav>
           <div className="p-8 border-t">
              <button className="w-full flex items-center gap-3 text-rose-500 font-bold text-xs uppercase" onClick={() => window.location.reload()}><LogOut className="h-4 w-4" /> Cerrar sesión</button>
           </div>
        </aside>

        {/* Central Chat */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white border-x">
           <header className="h-20 bg-white border-b px-8 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                 <div className="space-y-0.5">
                    <div className="flex items-center gap-3">
                       <h3 className="text-lg font-black text-slate-800 uppercase">{selectedRequest?.ticketNumber}</h3>
                       <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[9px] uppercase px-3 h-5">En Proceso</Badge>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duda técnica ATRES live</p>
                 </div>
              </div>
              <Button variant="outline" className="h-10 rounded-xl text-[10px] font-black uppercase gap-2 border-slate-100">Ver detalles <MoreVertical className="h-4 w-4" /></Button>
           </header>

           <ScrollArea className="flex-1 p-8 bg-[#f8fafc]">
              <div className="max-w-4xl mx-auto space-y-6">
                 {messages.map((m, i) => (
                   <div key={i} className={cn("flex w-full", m.role === 'user' ? "justify-end" : "justify-start")}>
                      {m.role !== 'user' && (
                        <Avatar className="h-9 w-9 mr-3 mt-1 shadow-sm">
                           <AvatarFallback className="bg-slate-200 text-slate-500"><Bot className="h-5 w-5" /></AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn(
                        "max-w-[75%] p-5 rounded-[1.8rem] shadow-sm relative",
                        m.role === 'user' ? "bg-emerald-50 text-emerald-900 rounded-tr-none" : "bg-white text-slate-700 rounded-tl-none border"
                      )}>
                         <p className="text-sm font-semibold leading-relaxed">{m.content}</p>
                         <div className="flex items-center justify-end gap-2 mt-2 opacity-30">
                            <span className="text-[8px] font-black uppercase">{m.timestamp instanceof Timestamp ? format(m.timestamp.toDate(), 'HH:mm') : '...'}</span>
                            {m.role === 'user' && <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />}
                         </div>
                      </div>
                   </div>
                 ))}
                 <div ref={scrollRef} />
              </div>
           </ScrollArea>

           <footer className="p-6 bg-white border-t space-y-4">
              <div className="flex gap-4 items-center">
                 <Button variant="ghost" size="icon" className="text-slate-400 hover:bg-slate-50 rounded-xl"><Paperclip className="h-5 w-5" /></Button>
                 <Input 
                   value={input} 
                   onChange={e => setInput(e.target.value)} 
                   onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                   placeholder="Escribe un mensaje..." 
                   className="flex-1 h-12 bg-slate-50 border-none rounded-2xl px-6 font-bold text-sm shadow-inner"
                 />
                 <Button onClick={handleSendMessage} disabled={isSending || !input.trim()} className="h-12 w-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 shadow-xl">
                    <Send className="h-5 w-5 text-white" />
                 </Button>
              </div>
           </footer>
        </main>

        {/* Sidebar Detalles */}
        <aside className="w-[320px] bg-white flex flex-col shrink-0 p-8 space-y-8 animate-in slide-in-from-right duration-500">
           <div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Detalles del Ticket</h3>
           </div>

           <div className="space-y-6">
              <div className="space-y-1">
                 <Label className="text-[10px] font-black text-slate-400 uppercase">ID del Ticket</Label>
                 <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <span className="font-mono font-black text-xs text-primary">{selectedRequest?.ticketNumber}</span>
                    <RotateCcw className="h-3 w-3 text-slate-300" />
                 </div>
              </div>

              <div className="space-y-1">
                 <Label className="text-[10px] font-black text-slate-400 uppercase">Estado</Label>
                 <div className="p-3 bg-amber-50 rounded-xl flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[10px] font-black text-amber-700 uppercase">En Proceso</span>
                 </div>
              </div>

              <div className="space-y-1">
                 <Label className="text-[10px] font-black text-slate-400 uppercase">Prioridad</Label>
                 <Badge className="w-full justify-center h-9 bg-rose-50 text-rose-600 font-black uppercase text-[10px] rounded-xl border-none">Media</Badge>
              </div>

              <div className="space-y-1">
                 <Label className="text-[10px] font-black text-slate-400 uppercase">Categoría</Label>
                 <div className="p-3 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold uppercase">{selectedRequest?.category}</div>
              </div>

              <div className="pt-6 border-t space-y-4">
                 <div className="flex items-center justify-between text-[10px] font-black uppercase">
                    <span className="text-slate-400">Creado el</span>
                    <span className="text-slate-700">24/05/2026 10:24 AM</span>
                 </div>
                 <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Asignado a</span>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                       <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-white text-[10px] font-black">CT</AvatarFallback></Avatar>
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-700 uppercase">Carlos Técnico</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">Técnico Soporte</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </aside>
      </div>
    );
  }

  // --- VISTA TÉCNICO AGENTE ---
  return (
    <div className="h-full w-full bg-[#111827] flex overflow-hidden font-sans">
       {/* Sidebar Agente */}
       <aside className="w-[280px] bg-[#1a2234] border-r border-white/5 flex flex-col shrink-0 z-40">
          <div className="p-8 pb-4 flex items-center gap-3">
             <div className="h-10 w-10 bg-[#3b82f6] rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20"><Bot className="h-6 w-6" /></div>
             <h2 className="text-xl font-black text-white uppercase tracking-tighter">HelpDesk</h2>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1">
             {[
               { id: 'dash', label: 'Dashboard', icon: BarChart3 },
               { id: 'tickets', label: 'Tickets', icon: FileText, badge: '8' },
               { id: 'convs', label: 'Conversaciones', icon: MessageSquare, badge: '3' },
               { id: 'cal', label: 'Calendario', icon: Calendar },
               { id: 'base', label: 'Base de conocimiento', icon: HelpCircle },
               { id: 'reps', label: 'Reportes', icon: BarChart3 },
               { id: 'usrs', label: 'Usuarios', icon: Users },
               { id: 'conf', label: 'Configuración', icon: Settings },
             ].map(item => (
               <button 
                 key={item.id} 
                 className={cn(
                   "w-full h-11 px-4 rounded-xl flex items-center justify-between text-xs font-bold uppercase transition-all",
                   activeSidebar === item.id ? "bg-[#3b82f6] text-white shadow-lg shadow-blue-500/20" : "text-slate-500 hover:bg-white/5 hover:text-white"
                 )}
                 onClick={() => setActiveSidebar(item.id)}
               >
                 <div className="flex items-center gap-3">
                   <item.icon className="h-4 w-4" />
                   <span>{item.label}</span>
                 </div>
                 {item.badge && <Badge className="bg-[#6366f1] text-white h-5 px-2 rounded-full text-[10px]">{item.badge}</Badge>}
               </button>
             ))}
          </nav>
          <div className="p-8 border-t border-white/5 space-y-6">
             <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">En línea</span>
             </div>
             <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-white/10"><AvatarFallback className="bg-slate-700 text-white text-[10px] font-black">CT</AvatarFallback></Avatar>
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-white uppercase">Carlos Técnico</span>
                   <span className="text-[8px] font-bold text-slate-500 uppercase">Técnico Soporte</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-600 ml-auto" />
             </div>
          </div>
       </aside>

       {/* Listado Tickets Agente */}
       <div className="w-[360px] bg-[#1a2234] border-r border-white/5 flex flex-col shrink-0">
          <header className="p-8 bg-[#1f2937] border-b border-white/5 flex flex-col gap-6">
             <div>
                <h3 className="text-xl font-black text-white uppercase">Tickets</h3>
                <div className="flex gap-4 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                   {['Todos 16', 'Abiertos 6', 'En Proceso 5', 'Pendientes 2', 'Cerrados 3'].map((f, i) => (
                     <button key={i} className={cn("whitespace-nowrap text-[9px] font-black uppercase transition-all px-1", i === 0 ? "text-blue-400 border-b-2 border-blue-400 pb-1" : "text-slate-500 hover:text-slate-300")}>{f}</button>
                   ))}
                </div>
             </div>
             <div className="relative group">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
                <Input placeholder="BUSCAR TICKET..." className="h-9 bg-[#111827] border-none rounded-xl pl-9 text-[10px] font-bold text-white shadow-inner uppercase" />
                <Filter className="absolute right-3 top-2.5 h-4 w-4 text-slate-600 hover:text-white cursor-pointer" />
             </div>
          </header>
          <ScrollArea className="flex-1 bg-[#111827]">
             <div className="p-3 space-y-2">
                {queue.map(req => (
                  <button 
                    key={req.id} 
                    onClick={() => setSelectedRequest(req)}
                    className={cn(
                      "w-full p-5 rounded-[2.2rem] text-left transition-all border-2 flex flex-col gap-3 group relative overflow-hidden",
                      selectedRequest?.id === req.id ? "bg-[#1f2937] border-blue-500 shadow-2xl" : "border-transparent hover:bg-white/5"
                    )}
                  >
                     {selectedRequest?.id === req.id && <div className="absolute left-0 top-0 w-2 h-full bg-blue-500" />}
                     <div className="flex justify-between items-start">
                        <span className="font-mono text-[10px] font-black text-blue-400 uppercase tracking-tighter">#{req.ticketNumber}</span>
                        <span className="text-[8px] font-bold text-slate-500 uppercase">{req.lastActivity instanceof Timestamp ? format(req.lastActivity.toDate(), 'HH:mm') : ''}</span>
                     </div>
                     <p className="text-xs font-bold text-slate-300 uppercase leading-tight line-clamp-2">{req.lastMessage || 'SIN MENSAJES'}</p>
                     <div className="flex items-center justify-between mt-1">
                        <Badge className={cn("text-[7px] font-black border-none px-2 h-4 uppercase", req.status === 'attending' ? "bg-amber-500/20 text-amber-500" : "bg-blue-500/20 text-blue-500")}>{req.status === 'attending' ? 'En Proceso' : 'Abierto'}</Badge>
                        <Avatar className="h-6 w-6"><AvatarFallback className="bg-slate-700 text-white text-[8px]">{req.userName?.slice(0, 2)}</AvatarFallback></Avatar>
                     </div>
                  </button>
                ))}
             </div>
          </ScrollArea>
       </div>

       {/* Chat Central Agente */}
       <main className="flex-1 flex flex-col overflow-hidden bg-[#f4f7fe]">
          {selectedRequest ? (
            <>
              <header className="h-20 bg-white border-b px-10 flex items-center justify-between shrink-0 shadow-sm z-30">
                 <div className="flex items-center gap-4">
                    <h3 className="text-lg font-black text-slate-800 uppercase">{selectedRequest.ticketNumber}</h3>
                    <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[9px] uppercase px-3 h-5">En Proceso</Badge>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight ml-4">{selectedRequest.lastMessage}</p>
                 </div>
                 <div className="flex gap-2">
                    <Select defaultValue="acciones">
                       <SelectTrigger className="h-10 w-36 bg-primary/5 border-none rounded-xl text-[10px] font-black text-primary uppercase shadow-sm"><SelectValue placeholder="ACCIONES" /></SelectTrigger>
                       <SelectContent className="rounded-xl"><SelectItem value="trans" className="text-[10px] font-bold">TRANSFERIR</SelectItem><SelectItem value="close" className="text-[10px] font-bold">RESOLVER</SelectItem></SelectContent>
                    </Select>
                 </div>
              </header>

              <ScrollArea className="flex-1 p-10 bg-[#f8fafc] relative">
                 <div className="max-w-4xl mx-auto space-y-6">
                    {messages.map((m, i) => (
                      <div key={i} className={cn("flex w-full animate-in slide-in-from-bottom-2", m.role === 'tech' ? "justify-end" : "justify-start")}>
                         {m.role !== 'tech' && (
                           <Avatar className="h-10 w-10 mr-4 mt-1 border-2 border-white shadow-md">
                              <AvatarFallback className="bg-slate-100 text-slate-400 text-xs font-bold">{selectedRequest.userName?.at(0)}</AvatarFallback>
                           </Avatar>
                         )}
                         <div className={cn(
                           "max-w-[70%] p-6 rounded-[2.2rem] shadow-sm relative",
                           m.role === 'tech' ? "bg-blue-600 text-white rounded-tr-none shadow-blue-500/10" : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                         )}>
                            {m.role === 'tech' && <p className="text-[9px] font-black uppercase opacity-60 mb-2">Carlos Técnico</p>}
                            <p className="text-sm font-semibold leading-relaxed whitespace-pre-wrap">{m.content}</p>
                            <div className="text-[8px] font-black uppercase opacity-40 text-right mt-3">
                               {m.timestamp instanceof Timestamp ? format(m.timestamp.toDate(), 'HH:mm') : '...'}
                            </div>
                         </div>
                         {m.role === 'tech' && (
                            <Avatar className="h-10 w-10 ml-4 mt-1 border-2 border-white shadow-md">
                               <AvatarFallback className="bg-primary text-white text-xs font-black">CT</AvatarFallback>
                            </Avatar>
                         )}
                      </div>
                    ))}
                    <div ref={scrollRef}/>
                 </div>
              </ScrollArea>
              
              <footer className="p-8 bg-white border-t flex gap-5 z-30 shadow-2xl">
                 <Button variant="ghost" size="icon" className="h-14 w-14 rounded-3xl text-slate-400 hover:bg-slate-50"><Paperclip className="h-6 w-6" /></Button>
                 <Button variant="ghost" size="icon" className="h-14 w-14 rounded-3xl text-slate-400 hover:bg-slate-50"><Star className="h-6 w-6" /></Button>
                 <Input 
                   value={input} 
                   onChange={e => setInput(e.target.value)} 
                   onKeyDown={e => e.key === 'Enter' && handleSendMessage()} 
                   className="rounded-[1.8rem] bg-slate-50 border-none h-14 px-10 font-bold text-sm shadow-inner focus:bg-white flex-1" 
                   placeholder="Escribe un mensaje..." 
                 />
                 <Button onClick={handleSendMessage} disabled={isSending || !input.trim()} className="bg-blue-600 hover:bg-blue-700 h-14 w-14 rounded-3xl shadow-xl transition-all active:scale-90 shadow-blue-500/30">
                    <Send className="h-6 w-6 text-white" />
                 </Button>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white text-center space-y-8 animate-in fade-in duration-1000">
               <div className="h-32 w-32 rounded-[3.5rem] bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner mb-4">
                  <MonitorCheck className="h-16 w-16" />
               </div>
               <h3 className="text-5xl font-black uppercase text-slate-800 tracking-tighter leading-none">Mesa de Ayuda ATRES</h3>
               <p className="text-lg font-bold uppercase tracking-[0.3em] text-slate-400">Seleccione un ticket para comenzar</p>
            </div>
          )}
       </main>

       {/* Sidebar Info Agente */}
       <aside className="w-[340px] bg-white flex flex-col shrink-0 overflow-hidden border-l">
          <ScrollArea className="flex-1">
             <div className="p-8 space-y-10">
                <div>
                   <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Información del Ticket</h3>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</Label>
                      <Select defaultValue={selectedRequest?.status} onValueChange={v => updateTicketMeta('status', v)}>
                        <SelectTrigger className="h-12 rounded-2xl bg-amber-50 border-none font-black text-amber-700 text-xs uppercase"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-2xl z-[500]"><SelectItem value="pending">Abierto</SelectItem><SelectItem value="attending">En Proceso</SelectItem><SelectItem value="closed">Cerrado</SelectItem></SelectContent>
                      </Select>
                   </div>

                   <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prioridad</Label>
                      <Select defaultValue={selectedRequest?.priority} onValueChange={v => updateTicketMeta('priority', v)}>
                        <SelectTrigger className="h-12 rounded-2xl bg-rose-50 border-none font-black text-rose-600 text-xs uppercase"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-2xl z-[500]"><SelectItem value="low">Baja</SelectItem><SelectItem value="medium">Media</SelectItem><SelectItem value="high">Alta</SelectItem><SelectItem value="critical">Crítica</SelectItem></SelectContent>
                      </Select>
                   </div>

                   <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</Label>
                      <Select defaultValue={selectedRequest?.category} onValueChange={v => updateTicketMeta('category', v)}>
                        <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-black text-slate-700 text-xs uppercase"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-2xl z-[500]"><SelectItem value="atres">Sistema ATRES</SelectItem><SelectItem value="accounts">Cuentas Institucionales</SelectItem><SelectItem value="network">Redes</SelectItem></SelectContent>
                      </Select>
                   </div>

                   <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Departamento</Label>
                      <Select defaultValue="tech">
                        <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-black text-slate-700 text-xs uppercase"><SelectValue placeholder="Soporte Técnico" /></SelectTrigger>
                        <SelectContent className="rounded-2xl z-[500]"><SelectItem value="tech">Soporte Técnico</SelectItem><SelectItem value="cap">Capacitación</SelectItem><SelectItem value="progs">Programas</SelectItem></SelectContent>
                      </Select>
                   </div>

                   <div className="space-y-3 pt-6 border-t border-slate-100">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</Label>
                      <div className="flex items-center gap-4 p-4 rounded-3xl bg-[#f8fafc] border border-slate-100">
                         <Avatar className="h-12 w-12 shadow-md border-2 border-white"><AvatarFallback className="bg-blue-600 text-white font-black">{selectedRequest?.userName?.at(0)}</AvatarFallback></Avatar>
                         <div className="flex flex-col min-w-0">
                            <span className="text-xs font-black text-slate-800 uppercase truncate">{selectedRequest?.userName}</span>
                            <span className="text-[9px] font-bold text-slate-400 truncate">{selectedRequest?.cct}@desysa.edu.mx</span>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-3 pt-6 border-t border-slate-100">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actividad del Ticket</Label>
                      <div className="space-y-6 pl-4 border-l-2 border-slate-100 py-2">
                         {[
                           { t: 'Ticket creado', u: 'Por Juan Pérez', d: '24/05/2026 10:24 AM', icon: CheckCircle2, c: 'text-blue-500' },
                           { t: 'Asignado a técnico', u: 'Por Sistema', d: '24/05/2026 10:24 AM', icon: Users, c: 'text-indigo-500' },
                           { t: 'Estado cambiado a En Proceso', u: 'Por Carlos Técnico', d: '24/05/2026 10:25 AM', icon: Activity, c: 'text-amber-500' },
                           { t: 'Mensaje enviado', u: 'Por Juan Pérez', d: '24/05/2026 10:28 AM', icon: MessageSquare, c: 'text-emerald-500' },
                         ].map((act, idx) => (
                           <div key={idx} className="relative">
                              <div className={cn("absolute -left-[25px] top-0 h-4 w-4 rounded-full bg-white border-2 flex items-center justify-center shadow-sm", act.c)}>
                                 <act.icon className="h-2 w-2" />
                              </div>
                              <div className="space-y-1">
                                 <h5 className="text-[10px] font-black text-slate-800 leading-none">{act.t}</h5>
                                 <p className="text-[8px] font-bold text-slate-400 uppercase">{act.u}</p>
                                 <p className="text-[8px] font-black text-slate-300">{act.d}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                      <Button className="w-full h-11 rounded-2xl bg-primary text-white font-black uppercase text-[10px] shadow-xl shadow-primary/20 mt-6">Ver historial completo</Button>
                   </div>
                </div>
             </div>
          </ScrollArea>
       </aside>
    </div>
  );
}
