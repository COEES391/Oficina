
'use client';
/**
 * @fileOverview Plataforma de Call Center Técnico ATRES "Pro Edition".
 * Fusiona mensajería tipo WhatsApp Web con control remoto tipo AnyDesk.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Send, 
  Bot, 
  MessageSquare,
  CheckCircle2,
  Clock,
  Circle,
  Loader2,
  Monitor,
  Laptop,
  Terminal,
  Power,
  Lock,
  FileUp,
  History,
  Activity,
  User,
  Settings,
  MoreVertical,
  Paperclip,
  HardDrive,
  Cpu,
  Network,
  Navigation,
  RefreshCcw,
  LayoutGrid,
  ClipboardList,
  Phone,
  Search,
  X,
  ShieldCheck,
  AlertCircle,
  FolderOpen
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
  lastMessage?: string;
  lastActivity: any;
  deviceInfo?: {
    os: string;
    cpu: string;
    ram: string;
    storage: string;
    ip: string;
  };
};

export function HelpDeskInterface({ isPublic = false }: { isPublic?: boolean }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [queue, setQueue] = useState<SupportRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [activeView, setActiveView] = useState<'chat' | 'remote' | 'files'>('chat');
  const [techName, setTechName] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (!isPublic) {
      setTechName(localStorage.getItem('userRfc') || 'ANALISTA TÉCNICO');
      const q = query(collection(db, 'support_queue'), orderBy('lastActivity', 'desc'), limit(20));
      return onSnapshot(q, (snap) => {
        setQueue(snap.docs.map(d => ({ ...d.data(), id: d.id })) as SupportRequest[]);
      });
    }
  }, [isPublic]);

  useEffect(() => {
    if (!mounted || !selectedRequest) {
      setMessages([]);
      return;
    }
    const q = query(collection(db, 'chat_messages'), where('chatId', '==', selectedRequest.id));
    return onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ ...d.data(), id: d.id })) as Message[];
      setMessages(msgs.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)));
    });
  }, [mounted, selectedRequest]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedRequest) return;
    setIsSending(true);
    const chatId = selectedRequest.id;

    setDoc(doc(db, 'support_queue', chatId), { 
      lastActivity: serverTimestamp(), 
      lastMessage: input.substring(0, 50),
      status: 'attending'
    }, { merge: true });

    addDoc(collection(db, 'chat_messages'), {
      chatId,
      role: 'tech',
      content: input,
      timestamp: serverTimestamp(),
      senderName: techName
    });

    setInput('');
    setIsSending(false);
  };

  const handleQuickAction = (action: string) => {
    toast({ title: "Acción Ejecutada", description: `Enviando comando: ${action.toUpperCase()} al equipo remoto.` });
  };

  if (!mounted) return null;

  // Interfaz de Call Center para el Analista
  return (
    <div className="flex h-full w-full bg-white overflow-hidden font-sans">
      {/* 1. Sidebar Táctico (Delgado) */}
      <aside className="w-16 bg-[#0b4135] flex flex-col items-center py-6 gap-6 shrink-0 z-50 border-r border-white/5">
        <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400 shadow-inner">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="flex-1 flex flex-col gap-4">
           {[ 
             { id: 'chat', icon: MessageSquare, label: 'Buzón' }, 
             { id: 'remote', icon: Monitor, label: 'Remoto' }, 
             { id: 'files', icon: FileUp, label: 'Archivos' },
             { id: 'stats', icon: Activity, label: 'Métricas' }
           ].map(item => (
             <button 
               key={item.id} 
               onClick={() => setActiveView(item.id as any)}
               className={cn("h-11 w-11 rounded-2xl flex items-center justify-center transition-all group", activeView === item.id ? "bg-emerald-500 text-white shadow-lg" : "text-white/30 hover:bg-white/5 hover:text-white")}
             >
               <item.icon className="h-5 w-5" />
             </button>
           ))}
        </div>
        <button className="h-11 w-11 rounded-2xl flex items-center justify-center text-white/30 hover:text-white transition-all"><Settings className="h-5 w-5" /></button>
      </aside>

      {/* 2. Lista de Sesiones / Chats (WhatsApp Style) */}
      <div className="w-80 bg-slate-50 border-r border-slate-100 flex flex-col shrink-0 z-40">
        <div className="p-6 bg-white border-b space-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-none">Sesiones Vivas</h2>
              <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] px-2 h-5">{queue.length}</Badge>
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
              <Input placeholder="FILTRAR..." className="h-9 pl-9 rounded-xl bg-slate-50 border-none shadow-inner text-[10px] font-bold uppercase" />
           </div>
        </div>
        <ScrollArea className="flex-1">
           <div className="p-2 space-y-1">
             {queue.map((req) => (
               <button 
                 key={req.id} 
                 onClick={() => setSelectedRequest(req)}
                 className={cn("w-full p-4 rounded-3xl text-left transition-all flex items-center gap-4 border-2 group relative", selectedRequest?.id === req.id ? "bg-white border-emerald-500 shadow-xl scale-[1.02]" : "bg-transparent border-transparent hover:bg-white/80")}
               >
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                      <AvatarFallback className="bg-slate-200 text-slate-500 font-black text-xs">{req.userName?.slice(0, 2) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className={cn("absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white shadow-sm", req.status === 'pending' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500')} />
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[12px] font-black text-slate-700 uppercase truncate">{req.userName}</span>
                        <span className="text-[8px] font-black text-slate-300 font-mono">#{req.id.split('-').at(-1)}</span>
                     </div>
                     <p className="text-[10px] font-semibold text-slate-400 truncate uppercase">{req.lastMessage || 'Nueva conexión...'}</p>
                  </div>
               </button>
             ))}
           </div>
        </ScrollArea>
        <div className="p-6 bg-white border-t space-y-3">
           <div className="flex justify-between items-center"><span className="text-[9px] font-black text-slate-400 uppercase">Capacidad Agente</span><span className="text-[9px] font-black text-emerald-600">85%</span></div>
           <Progress value={85} className="h-1.5 bg-slate-100" />
        </div>
      </div>

      {/* 3. Panel Principal (Control Remoto / Chat) */}
      <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden">
        {selectedRequest ? (
          <>
            <header className="h-16 bg-white border-b px-8 flex items-center justify-between shrink-0 shadow-sm z-30">
               <div className="flex items-center gap-5">
                  <div className="flex flex-col">
                     <h3 className="text-sm font-black text-slate-800 uppercase leading-none">{selectedRequest.userName}</h3>
                     <div className="flex items-center gap-2 mt-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">En línea • Windows 11 Business</span>
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <Button onClick={() => setActiveView('remote')} variant={activeView === 'remote' ? 'default' : 'outline'} className="h-9 px-4 rounded-xl text-[10px] font-black gap-2"><Monitor className="h-4 w-4" /> CONTROL REMOTO</Button>
                  <Button onClick={() => setActiveView('chat')} variant={activeView === 'chat' ? 'default' : 'outline'} className="h-9 px-4 rounded-xl text-[10px] font-black gap-2"><MessageSquare className="h-4 w-4" /> CHAT</Button>
                  <div className="h-6 w-px bg-slate-100 mx-2" />
                  <Button onClick={() => handleQuickAction('restart')} variant="ghost" className="h-9 w-9 p-0 text-rose-500 hover:bg-rose-50"><Power className="h-4 w-4" /></Button>
                  <Button onClick={() => handleQuickAction('lock')} variant="ghost" className="h-9 w-9 p-0 text-amber-500 hover:bg-amber-50"><Lock className="h-4 w-4" /></Button>
               </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
               {/* Vista de Chat / Remoto */}
               <div className="flex-1 flex flex-col overflow-hidden">
                  {activeView === 'remote' ? (
                    <div className="flex-1 p-6 flex flex-col">
                       <div className="flex-1 bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 shadow-2xl relative overflow-hidden group">
                          <Image src="https://picsum.photos/seed/desktop/1200/800" alt="Remote Desktop" fill className="object-cover opacity-60" />
                          <div className="absolute inset-0 bg-black/20" />
                          {/* Overlay de Control */}
                          <div className="absolute top-6 left-6 flex flex-col gap-3 z-30">
                             <div className="bg-white/95 backdrop-blur-md p-5 rounded-[2rem] shadow-2xl border border-white space-y-4">
                                <h4 className="text-[10px] font-black text-slate-800 uppercase flex items-center gap-2 border-b pb-2"><Activity className="h-4 w-4 text-emerald-500" /> Rendimiento Live</h4>
                                <div className="space-y-3">
                                   <div className="space-y-1.5"><div className="flex justify-between text-[8px] font-black uppercase text-slate-400"><span>CPU Usage</span><span>14%</span></div><Progress value={14} className="h-1 bg-slate-100" /></div>
                                   <div className="space-y-1.5"><div className="flex justify-between text-[8px] font-black uppercase text-slate-400"><span>RAM Usage</span><span>4.2 GB</span></div><Progress value={40} className="h-1 bg-slate-100" /></div>
                                </div>
                             </div>
                          </div>
                          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                             <Button onClick={() => handleQuickAction('terminal')} className="bg-slate-800 text-white rounded-2xl h-14 px-8 font-black gap-3 shadow-2xl"><Terminal className="h-5 w-5" /> TERMINAL</Button>
                             <Button onClick={() => handleQuickAction('taskmgr')} className="bg-slate-800 text-white rounded-2xl h-14 px-8 font-black gap-3 shadow-2xl"><LayoutGrid className="h-5 w-5" /> PROCESOS</Button>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <>
                      <ScrollArea className="flex-1 px-10 py-10 bg-[#efe7dd] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                         <div className="max-w-4xl mx-auto space-y-4 flex flex-col">
                            {messages.map((msg, i) => (
                              <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2", msg.role === 'tech' ? "justify-end" : "justify-start")}>
                                <div className={cn("max-w-[75%] p-5 rounded-[1.8rem] text-sm font-semibold shadow-lg", msg.role === 'tech' ? "bg-[#e7ffdb] border border-emerald-100 rounded-tr-none text-slate-800" : "bg-white border border-slate-200 rounded-tl-none text-slate-800")}>
                                   <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                   <div className="text-[8px] font-black uppercase opacity-30 text-right mt-2 flex items-center justify-end gap-1"><Clock className="h-2.5 w-2.5" />{msg.timestamp?.seconds ? format(new Date(msg.timestamp.seconds * 1000), 'HH:mm') : '...'}</div>
                                </div>
                              </div>
                            ))}
                            <div ref={scrollRef} />
                         </div>
                      </ScrollArea>
                      <footer className="p-6 bg-white border-t shrink-0">
                         <div className="max-w-4xl mx-auto flex items-center gap-4">
                            <button className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-emerald-500 flex items-center justify-center transition-all"><Paperclip className="h-5 w-5" /></button>
                            <Input 
                              placeholder="ESCRIBIR RESPUESTA TÉCNICA..." 
                              className="h-12 rounded-2xl bg-slate-50 border-none shadow-inner px-6 font-bold text-sm uppercase focus:ring-2 focus:ring-emerald-500/20" 
                              value={input} 
                              onChange={e => setInput(e.target.value)} 
                              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            />
                            <Button onClick={handleSendMessage} className="bg-[#128c7e] hover:bg-[#075e54] h-12 w-12 rounded-2xl shadow-xl p-0 shrink-0"><Send className="h-5 w-5" /></Button>
                         </div>
                      </footer>
                    </>
                  )}
               </div>

               {/* Panel de Info / Notas (Derecha) */}
               <aside className="w-80 bg-white border-l border-slate-100 flex flex-col shrink-0">
                  <ScrollArea className="flex-1">
                     <div className="p-6 space-y-10">
                        <div className="space-y-6">
                           <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><HardDrive className="h-4 w-4 text-primary" /> Información del Equipo</h4>
                           <div className="space-y-4">
                              <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase">Procesador</span><span className="text-[10px] font-black text-slate-700">INTEL i7 12TH GEN</span></div>
                              <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase">Memoria RAM</span><span className="text-[10px] font-black text-slate-700">16 GB DDR4</span></div>
                              <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase">Almacenamiento</span><span className="text-[10px] font-black text-slate-700">512 GB SSD</span></div>
                              <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase">Dirección IP</span><span className="text-[10px] font-black text-primary font-mono">192.168.1.104</span></div>
                           </div>
                        </div>

                        <div className="space-y-6 pt-6 border-t">
                           <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Navigation className="h-4 w-4 text-primary" /> Ubicación CCT</h4>
                           <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                              <p className="text-[10px] font-black text-slate-700 uppercase leading-none">ESC. SEC. FED. 115</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">TOLUCA, ESTADO DE MÉXICO</p>
                              <Badge className="bg-primary/5 text-primary border-none text-[8px] font-black mt-2">CCT: 15DES0001R</Badge>
                           </div>
                        </div>

                        <div className="space-y-6 pt-6 border-t">
                           <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> Notas Técnicas</h4>
                           <Textarea 
                             className="min-h-[150px] rounded-2xl bg-slate-50 border-none p-4 text-[10px] font-semibold uppercase shadow-inner" 
                             placeholder="AÑADIR NOTAS SOBRE LA SESIÓN..."
                           />
                        </div>
                     </div>
                  </ScrollArea>
                  <div className="p-6 bg-slate-50 border-t flex flex-col gap-3">
                     <Button className="w-full bg-[#B38E5D] text-white rounded-xl h-11 text-[10px] font-black gap-2 shadow-lg"><FileUp className="h-4 w-4" /> ENVIAR ARCHIVO</Button>
                     <Button variant="outline" className="w-full border-rose-200 text-rose-600 rounded-xl h-11 text-[10px] font-black gap-2"><X className="h-4 w-4" /> CERRAR SESIÓN</Button>
                  </div>
               </aside>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-30">
             <div className="h-40 w-40 rounded-full bg-slate-200 flex items-center justify-center mb-10 shadow-inner border-4 border-white">
                <Laptop className="h-20 w-20 text-slate-400" />
             </div>
             <h3 className="text-3xl font-black uppercase text-slate-800 tracking-tighter">CENTRAL TÁCTICA ATRES</h3>
             <p className="text-sm font-bold uppercase tracking-[0.4em] text-slate-500 mt-6 border-y border-slate-300 py-3 px-10">Seleccione una sesión para iniciar el soporte técnico</p>
          </div>
        )}
      </div>
    </div>
  );
}

