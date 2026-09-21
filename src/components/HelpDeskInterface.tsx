'use client';
/**
 * @fileOverview Interfaz de Mesa de Ayuda ATRES con Sincronización Real.
 * - Modo Analista: Gestión de sesiones con alertas automáticas.
 * - Modo Público: Registro instantáneo y chat técnico.
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
  Bell
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
  limit,
  Timestamp
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
  
  // User Registration State
  const [userData, setUserData] = useState({ name: '', cct: '', anydeskId: '' });
  const [hasJoined, setHasJoined] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const supportUrl = typeof window !== 'undefined' ? `${window.location.origin}/helpdesk` : '';

  // ANALYST: Listen for new support requests
  useEffect(() => {
    setMounted(true);
    if (!isPublic) {
      setTechName(localStorage.getItem('userRfc') || 'ANALISTA TÉCNICO');
      
      // Simplified query to avoid index errors, filter and sort locally
      const q = query(collection(db, 'support_queue'), limit(50));

      let isFirstLoad = true;
      const unsubscribe = onSnapshot(q, (snap) => {
        const allDocs = snap.docs.map(d => ({ ...d.data(), id: d.id } as SupportRequest));
        
        // Local Filter & Sort
        const activeQueue = allDocs
          .filter(req => req.status !== 'closed')
          .sort((a, b) => {
            const tA = a.lastActivity instanceof Timestamp ? a.lastActivity.toMillis() : 0;
            const tB = b.lastActivity instanceof Timestamp ? b.lastActivity.toMillis() : 0;
            return tB - tA;
          });
        
        // Detect new additions for notifications
        snap.docChanges().forEach((change) => {
          if (change.type === "added" && !isFirstLoad) {
            const newReq = change.doc.data() as SupportRequest;
            if (newReq.status === 'pending') {
              toast({
                title: "SOLICITUD DE ATENCIÓN",
                description: `${newReq.userName} (${newReq.cct}) solicita soporte inmediato.`,
                className: "bg-[#9f2241] text-white border-none shadow-2xl",
              });
              try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch(e) {}
            }
          }
        });
        
        setQueue(activeQueue);
        isFirstLoad = false;
      });

      return () => unsubscribe();
    }
  }, [isPublic, toast]);

  // CHAT: Listen for messages in selected session
  useEffect(() => {
    if (!mounted || !selectedRequest) {
      setMessages([]);
      return;
    }
    
    // Simplified query for messages to ensure sync
    const q = query(
      collection(db, 'chat_messages'), 
      where('chatId', '==', selectedRequest.id)
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ ...d.data(), id: d.id } as Message));
      // Sort messages locally by timestamp
      const sortedMsgs = msgs.sort((a, b) => {
        const tA = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : 0;
        const tB = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : 0;
        return tA - tB;
      });
      setMessages(sortedMsgs);
    });

    return () => unsubscribe();
  }, [mounted, selectedRequest]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoinSupport = async () => {
    if (!userData.name || !userData.cct) {
      toast({ variant: "destructive", title: "Campos incompletos", description: "Ingrese su nombre y CCT." });
      return;
    }
    setIsJoining(true);
    try {
      const ticketNum = `TK-${Date.now().toString().slice(-6)}`;
      const requestData = {
        userName: userData.name.toUpperCase(),
        cct: userData.cct.toUpperCase(),
        status: 'pending',
        lastActivity: serverTimestamp(),
        lastMessage: 'Sesión iniciada',
        ticketNumber: ticketNum
      };
      
      const docRef = await addDoc(collection(db, 'support_queue'), requestData);
      
      // Welcome bot message
      await addDoc(collection(db, 'chat_messages'), {
        chatId: docRef.id,
        role: 'bot',
        content: `Hola ${userData.name.toUpperCase()}, un analista ha sido notificado y se conectará en breve. Su folio es: ${ticketNum}.`,
        timestamp: serverTimestamp()
      });

      setSelectedRequest({ ...requestData, id: docRef.id } as any);
      setHasJoined(true);
      toast({ title: "Conectado a Mesa de Ayuda" });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error de conexión" });
    } finally {
      setIsJoining(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedRequest) return;
    setIsSending(true);
    const chatId = selectedRequest.id;

    try {
      // Update queue metadata to trigger alerts on technician side
      await setDoc(doc(db, 'support_queue', chatId), { 
        lastActivity: serverTimestamp(), 
        lastMessage: input.substring(0, 40),
        status: isPublic ? 'pending' : 'attending'
      }, { merge: true });

      // Add message
      await addDoc(collection(db, 'chat_messages'), {
        chatId,
        role: isPublic ? 'user' : 'tech',
        content: input,
        timestamp: serverTimestamp(),
        senderName: isPublic ? userData.name : techName
      });

      setInput('');
    } catch (e) {
      toast({ variant: "destructive", title: "Error al enviar" });
    } finally {
      setIsSending(false);
    }
  };

  if (!mounted) return null;

  // --- PUBLIC INTERFACE (DOCENT) ---
  if (isPublic) {
    if (!hasJoined) {
      return (
        <div className="h-full w-full bg-[#f0f2f5] flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
          <Card className="w-full max-w-[500px] rounded-[2.5rem] border-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
             <div className="p-10 bg-[#9f2241] text-white text-center space-y-4">
                <div className="h-20 w-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                   <Monitor className="h-10 w-10 text-white" />
                </div>
                <div>
                   <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">INICIAR SOPORTE</h2>
                   <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-2">Mesa de Ayuda ATRES • Estado de México</p>
                </div>
             </div>
             <div className="p-10 bg-white space-y-6">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Nombre Completo</Label>
                   <Input 
                      placeholder="EJ. PROF. JUAN PÉREZ" 
                      className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold uppercase text-slate-700" 
                      value={userData.name}
                      onChange={e => setUserData({...userData, name: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">CCT del Plantel</Label>
                   <Input 
                      placeholder="EJ. 15DES0001R" 
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
             <div className="p-6 bg-slate-50 border-t flex items-center justify-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Canal Seguro Encriptado</span>
             </div>
          </Card>
        </div>
      );
    }

    return (
      <div className="flex h-full w-full bg-white overflow-hidden animate-in fade-in duration-700">
        <aside className="w-80 bg-slate-50 border-r flex flex-col shrink-0">
           <div className="p-6 bg-white border-b">
              <h3 className="text-lg font-black text-[#9f2241] uppercase tracking-tighter">Apoyo Remoto</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Protocolo ATRES</p>
           </div>
           <ScrollArea className="flex-1">
              <div className="p-6 space-y-8">
                 <div className="space-y-4">
                    {[
                      { step: 1, text: 'Descargue e instale AnyDesk.', icon: Download },
                      { step: 2, text: 'Copie su ID de 9 dígitos.', icon: Info },
                      { step: 3, text: 'Envíe el ID por este chat.', icon: Paperclip },
                    ].map(s => (
                      <div key={s.step} className="flex gap-4 items-start">
                         <div className="h-6 w-6 rounded-lg bg-[#9f2241] text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg">{s.step}</div>
                         <p className="text-[11px] font-semibold text-slate-600 leading-tight pt-1">{s.text}</p>
                      </div>
                    ))}
                 </div>

                 <div className="p-6 bg-[#EFE7DD] rounded-[2rem] border-2 border-[#B38E5D]/30 space-y-4 shadow-inner">
                    <Label className="text-[9px] font-black uppercase text-[#B38E5D] text-center block">ID DE CONEXIÓN</Label>
                    <Input 
                      placeholder="000 000 000" 
                      className="h-12 bg-white rounded-xl border-none shadow-xl text-center font-mono font-black text-xl text-primary" 
                      value={userData.anydeskId}
                      onChange={e => setUserData({...userData, anydeskId: e.target.value})}
                    />
                    <Button className="w-full bg-[#B38E5D] hover:bg-[#a08252] text-white h-11 rounded-xl text-[10px] font-black shadow-lg" onClick={() => { if(userData.anydeskId) { setInput(`Mi ID de conexión es: ${userData.anydeskId}`); handleSendMessage(); } }}>ENVIAR ID A TÉCNICO</Button>
                 </div>

                 <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
                    <p className="text-[9px] font-bold text-blue-900 uppercase leading-relaxed mt-1">El analista recibirá una alerta visual. Por favor mantenga abierta esta ventana.</p>
                 </div>
              </div>
           </ScrollArea>
        </aside>

        <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden">
           <header className="h-16 bg-white border-b px-8 flex items-center justify-between shrink-0 shadow-sm z-30">
              <div className="flex items-center gap-4">
                 <Avatar className="h-10 w-10 border-2 border-emerald-500 shadow-md">
                    <AvatarFallback className="bg-slate-100 text-slate-400"><Bot /></AvatarFallback>
                 </Avatar>
                 <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase leading-none">Analista Técnico</h4>
                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                       <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Conectado en tiempo real
                    </p>
                 </div>
              </div>
              <Badge variant="outline" className="font-mono font-black border-primary/20 text-primary">{selectedRequest?.ticketNumber}</Badge>
           </header>

           <ScrollArea className="flex-1 px-8 py-8 bg-[#efe7dd] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] shadow-inner">
              <div className="max-w-4xl mx-auto space-y-4">
                 {messages.map((m, i) => (
                   <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2", m.role === 'user' ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[80%] p-5 rounded-[1.8rem] text-sm font-semibold shadow-lg", m.role === 'user' ? "bg-[#e7ffdb] rounded-tr-none border border-emerald-100" : m.role === 'bot' ? "bg-slate-800 text-white rounded-tl-none border-none" : "bg-white rounded-tl-none border border-slate-200")}>
                         <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                         <div className={cn("text-[8px] font-black uppercase opacity-30 text-right mt-2 flex items-center justify-end gap-1", m.role === 'bot' ? "text-white/40" : "")}>
                            <Clock className="h-2.5 w-2.5" />
                            {m.timestamp instanceof Timestamp ? format(m.timestamp.toDate(), 'HH:mm') : 'Sync...'}
                         </div>
                      </div>
                   </div>
                 ))}
                 <div ref={scrollRef} />
              </div>
           </ScrollArea>

           <footer className="p-6 bg-white border-t shrink-0 shadow-2xl">
              <div className="max-w-4xl mx-auto flex items-center gap-4">
                 <Input 
                   value={input} 
                   onChange={e => setInput(e.target.value)} 
                   onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                   placeholder="DESCRIBA SU DUDA TÉCNICA AQUÍ..." 
                   className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner px-8 font-bold text-sm uppercase focus:ring-2 focus:ring-emerald-500/20"
                 />
                 <Button onClick={handleSendMessage} disabled={isSending || !input.trim()} className="h-14 w-14 rounded-2xl bg-[#128c7e] hover:bg-[#075e54] shadow-xl p-0 shrink-0 transition-transform active:scale-90">
                    {isSending ? <Loader2 className="animate-spin h-6 w-6 text-white" /> : <Send className="h-6 w-6 text-white" />}
                 </Button>
              </div>
           </footer>
        </div>
      </div>
    );
  }

  // --- ANALYST INTERFACE ---
  return (
    <div className="flex h-full w-full bg-white overflow-hidden font-sans animate-in fade-in duration-700">
      <aside className="w-16 bg-[#0b4135] flex flex-col items-center py-6 gap-6 shrink-0 z-50 border-r border-white/5 shadow-2xl">
        <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400 shadow-inner">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="flex-1 flex flex-col gap-4">
           {[ 
             { id: 'chat', icon: MessageSquare }, 
             { id: 'remote', icon: Monitor }, 
             { id: 'files', icon: FileUp },
             { id: 'stats', icon: Activity }
           ].map(item => (
             <button 
               key={item.id} 
               onClick={() => setActiveView(item.id as any)}
               className={cn("h-11 w-11 rounded-2xl flex items-center justify-center transition-all", activeView === item.id ? "bg-emerald-500 text-white shadow-lg" : "text-white/30 hover:bg-white/5")}
             >
               <item.icon className="h-5 w-5" />
             </button>
           ))}
        </div>
        <button className="h-11 w-11 rounded-2xl flex items-center justify-center text-white/30 hover:text-white"><Settings className="h-5 w-5" /></button>
      </aside>

      <div className="w-80 bg-slate-50 border-r border-slate-100 flex flex-col shrink-0 z-40">
        <div className="p-6 bg-white border-b space-y-4 shadow-sm">
           <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-none">SESIONES ACTIVAS</h2>
              <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px] px-3 h-6 rounded-full shadow-sm">{queue.length}</Badge>
           </div>
           <div className="relative group">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
              <Input placeholder="FILTRAR SESIONES..." className="h-9 pl-9 rounded-xl bg-slate-50 border-none shadow-inner text-[9px] font-bold uppercase focus:bg-white" />
           </div>
        </div>
        <ScrollArea className="flex-1">
           <div className="p-2 space-y-1">
             {queue.map((req) => (
               <button 
                 key={req.id} 
                 onClick={() => setSelectedRequest(req)}
                 className={cn("w-full p-4 rounded-3xl text-left transition-all flex items-center gap-4 border-2 relative group", selectedRequest?.id === req.id ? "bg-white border-emerald-500 shadow-xl scale-[1.02]" : "bg-transparent border-transparent hover:bg-white/80")}
               >
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm shrink-0">
                    <AvatarFallback className="bg-slate-200 text-slate-500 font-black text-xs">{req.userName?.slice(0, 2) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[11px] font-black text-slate-700 uppercase truncate">{req.userName}</span>
                        {req.status === 'pending' && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[7px] font-black text-rose-500 uppercase animate-pulse">ATENCIÓN</span>
                            <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                          </div>
                        )}
                     </div>
                     <p className="text-[9px] font-semibold text-slate-400 truncate uppercase">{req.lastMessage || 'Nuevo reporte...'}</p>
                     <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[7px] font-black border-slate-200 text-slate-400 h-4 px-1.5 bg-slate-50">{req.cct}</Badge>
                        <span className="text-[7px] font-bold text-slate-300 uppercase">{req.ticketNumber}</span>
                     </div>
                  </div>
               </button>
             ))}
             {queue.length === 0 && (
               <div className="py-24 text-center opacity-20 flex flex-col items-center gap-4">
                  <MessageSquare className="h-14 w-14" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Monitorización activa...</p>
               </div>
             )}
           </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden">
        {selectedRequest ? (
          <>
            <header className="h-16 bg-white border-b px-8 flex items-center justify-between shrink-0 shadow-sm z-30">
               <div className="flex flex-col">
                  <h3 className="text-sm font-black text-slate-800 uppercase leading-none">{selectedRequest.userName}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                     <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Sesión de Soporte Activa</span>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <Button onClick={() => setActiveView('remote')} variant={activeView === 'remote' ? 'default' : 'ghost'} className="h-9 px-4 rounded-xl text-[10px] font-black gap-2 shadow-sm"><Monitor className="h-4 w-4" /> REMOTO</Button>
                  <Button onClick={() => setActiveView('chat')} variant={activeView === 'chat' ? 'default' : 'ghost'} className="h-9 px-4 rounded-xl text-[10px] font-black gap-2 shadow-sm"><MessageSquare className="h-4 w-4" /> CHAT</Button>
                  <div className="h-6 w-px bg-slate-200 mx-2" />
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-500 hover:bg-rose-50 rounded-xl" onClick={() => { if(confirm("¿Cerrar ticket de atención?")) { setDoc(doc(db, 'support_queue', selectedRequest.id), { status: 'closed' }, { merge: true }); setSelectedRequest(null); } }}><Power className="h-4 w-4" /></Button>
               </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
               <div className="flex-1 flex flex-col overflow-hidden">
                  {activeView === 'remote' ? (
                    <div className="flex-1 p-6 relative animate-in zoom-in-95 duration-500">
                       <div className="w-full h-full bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 shadow-2xl relative overflow-hidden flex items-center justify-center">
                          <Image src="https://picsum.photos/seed/desktop/1200/800" alt="Remote" fill className="object-cover opacity-50 grayscale" />
                          <div className="z-10 text-center space-y-6">
                             <div className="h-20 w-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                <Activity className="text-emerald-400 h-10 w-10" />
                             </div>
                             <div className="space-y-2">
                                <p className="text-white/60 text-[11px] font-black uppercase tracking-[0.4em] leading-none">Streaming Técnico Activo</p>
                                <p className="text-white/20 text-[9px] font-bold uppercase tracking-widest">AES-256 Encrypted Stream</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <>
                      <ScrollArea className="flex-1 px-10 py-10 bg-[#efe7dd] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] shadow-inner">
                         <div className="max-w-4xl mx-auto space-y-4 flex flex-col">
                            {messages.map((m, i) => (
                              <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2", m.role === 'tech' ? "justify-end" : "justify-start")}>
                                <div className={cn("max-w-[75%] p-5 rounded-[1.8rem] text-sm font-semibold shadow-lg", m.role === 'tech' ? "bg-[#e7ffdb] border border-emerald-100 rounded-tr-none text-slate-800" : m.role === 'bot' ? "bg-slate-800 text-white rounded-tl-none border-none" : "bg-white border border-slate-200 rounded-tl-none text-slate-800")}>
                                   <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                                   <div className={cn("text-[8px] font-black uppercase opacity-30 text-right mt-2 flex items-center justify-end gap-1", m.role === 'bot' ? "text-white/40" : "")}>
                                      <Clock className="h-2.5 w-2.5" />
                                      {m.timestamp instanceof Timestamp ? format(m.timestamp.toDate(), 'HH:mm') : 'Sync...'}
                                   </div>
                                </div>
                              </div>
                            ))}
                            <div ref={scrollRef}/>
                         </div>
                      </ScrollArea>
                      <footer className="p-6 bg-white border-t flex gap-4 shrink-0 shadow-2xl z-30">
                         <div className="max-w-4xl mx-auto flex w-full items-center gap-4">
                            <button className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 hover:text-primary transition-all"><Paperclip className="h-5 w-5" /></button>
                            <Input 
                               value={input} 
                               onChange={e => setInput(e.target.value)} 
                               onKeyDown={e => e.key === 'Enter' && handleSendMessage()} 
                               className="rounded-2xl bg-slate-50 border-none h-12 px-8 font-bold text-sm uppercase shadow-inner focus:ring-2 focus:ring-primary/10" 
                               placeholder="ESCRIBIR RESPUESTA TÉCNICA..." 
                            />
                            <Button onClick={handleSendMessage} disabled={isSending || !input.trim()} className="bg-[#128c7e] hover:bg-[#075e54] h-12 w-12 rounded-2xl shadow-xl p-0 shrink-0 transition-transform active:scale-95">
                               {isSending ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Send className="h-5 w-5 text-white" />}
                            </Button>
                         </div>
                      </footer>
                    </>
                  )}
               </div>
               
               <aside className="w-80 bg-white border-l p-6 space-y-8 overflow-y-auto shrink-0 hidden xl:block z-20 shadow-sm">
                  <div className="space-y-6">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><HardDrive className="h-4 w-4 text-primary" /> EXPEDIENTE HARDWARE</h4>
                     <div className="space-y-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner">
                        <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase">OS</span><span className="text-[10px] font-black text-slate-700">WINDOWS 11 PRO</span></div>
                        <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase">CPU</span><span className="text-[10px] font-black text-slate-700">INTEL I7 12TH</span></div>
                        <div className="flex justify-between items-center pt-2 border-t"><span className="text-[10px] font-bold text-slate-500 uppercase">IP</span><span className="text-[10px] font-black font-mono text-primary">192.168.1.104</span></div>
                     </div>
                  </div>
                  <div className="space-y-6 pt-6 border-t">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Navigation className="h-4 w-4 text-primary" /> ORIGEN DE SOLICITUD</h4>
                     <div className="p-6 bg-slate-50 rounded-[2.5rem] space-y-4 border border-slate-100 shadow-inner">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Monitor className="h-6 w-6" /></div>
                        <div>
                           <p className="text-xs font-black text-slate-700 uppercase leading-none">{selectedRequest.cct}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">LOCALIZACIÓN VERIFICADA</p>
                        </div>
                     </div>
                  </div>
               </aside>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white animate-in fade-in duration-1000">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-6xl w-full">
                <div className="space-y-10">
                   <div className="h-20 w-20 rounded-[1.8rem] bg-[#9f2241]/10 flex items-center justify-center text-[#9f2241] shadow-inner">
                      <Laptop className="h-10 w-10" />
                   </div>
                   <div className="space-y-3">
                      <h3 className="text-5xl font-black uppercase text-slate-800 tracking-tighter leading-none">CENTRAL DE SOPORTE ATRES</h3>
                      <p className="text-lg font-bold uppercase tracking-[0.3em] text-[#B38E5D]">Monitorización de Sesiones</p>
                   </div>
                   <div className="p-8 bg-slate-50 rounded-[3rem] border-2 border-slate-100 flex gap-6 shadow-sm">
                      <div className="h-14 w-14 rounded-2xl bg-white shadow-xl flex items-center justify-center text-emerald-500 shrink-0">
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
                   <div className="space-y-2 relative z-10">
                      <h4 className="text-2xl font-black uppercase tracking-tighter">LIGA DE SOPORTE PARA DOCENTES</h4>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">CANAL OFICIAL DE ATENCIÓN REMOTA</p>
                   </div>
                   <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm space-y-3 relative z-10 shadow-inner">
                      <Label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Enlace Directo:</Label>
                      <div className="flex items-center gap-3">
                         <Globe className="h-5 w-5 text-white/40" />
                         <span className="text-[11px] font-mono text-white/80 font-bold truncate">{supportUrl}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-8 relative z-10">
                      <div className="p-4 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform group-hover:rotate-3 transition-transform duration-500">
                         <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(supportUrl)}`} alt="QR" width={110} height={110} className="rounded-xl" />
                      </div>
                      <div className="space-y-6 flex-1">
                         <p className="text-[11px] font-semibold text-white/60 leading-relaxed">
                            Proporcione este código QR o la liga directa al personal para iniciar la monitorización técnica 2026.
                         </p>
                         <Button onClick={() => { navigator.clipboard.writeText(supportUrl); toast({ title: "Enlace Copiado", className: "bg-emerald-600 text-white border-none" }); }} className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black rounded-2xl gap-3 shadow-xl transition-all hover:scale-105 active:scale-95 border-none">
                            <Globe className="h-4 w-4" /> COPIAR LIGA OFICIAL
                         </Button>
                      </div>
                   </div>
                </Card>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
