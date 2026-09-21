'use client';
/**
 * @fileOverview Interfaz dual de Mesa de Ayuda ATRES.
 * - Modo Analista: Gestión de múltiples sesiones y control remoto.
 * - Modo Público: Chat interactivo para docentes y captura de ID AnyDesk.
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, 
  Bot, 
  MessageSquare,
  Clock,
  Loader2,
  Monitor,
  Laptop,
  Power,
  Lock,
  FileUp,
  History,
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
  Info
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
  const [isJoining, setIsJoining] = useState(false);
  
  // User Registration State
  const [userData, setUserData] = useState({ name: '', cct: '', anydeskId: '' });
  const [hasJoined, setHasJoined] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (!isPublic) {
      setTechName(localStorage.getItem('userRfc') || 'ANALISTA TÉCNICO');
      const q = query(collection(db, 'support_queue'), where('status', '!=', 'closed'), orderBy('lastActivity', 'desc'), limit(20));
      return onSnapshot(q, (snap) => {
        setQueue(snap.docs.map(d => ({ ...d.data(), id: d.id })) as SupportRequest[]);
      });
    }
  }, [isPublic]);

  // Load messages for selected request (analyst or joined user)
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

  const handleJoinSupport = async () => {
    if (!userData.name || !userData.cct) {
      toast({ variant: "destructive", title: "Campos incompletos", description: "Ingrese su nombre y CCT para continuar." });
      return;
    }
    setIsJoining(true);
    try {
      const newRequest = {
        userName: userData.name.toUpperCase(),
        cct: userData.cct.toUpperCase(),
        status: 'pending',
        lastActivity: serverTimestamp(),
        lastMessage: 'Sesión iniciada por el usuario',
        ticketNumber: `TK-${Date.now().toString().slice(-6)}`
      };
      const docRef = await addDoc(collection(db, 'support_queue'), newRequest);
      const reqWithId = { ...newRequest, id: docRef.id } as SupportRequest;
      setSelectedRequest(reqWithId);
      setHasJoined(true);
      
      // Send welcome message
      await addDoc(collection(db, 'chat_messages'), {
        chatId: docRef.id,
        role: 'bot',
        content: `Hola ${userData.name.toUpperCase()}, bienvenido a la Mesa de Ayuda COEES. Un analista se conectará pronto para atender su solicitud.`,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Error de conexión", description: "No se pudo iniciar la sesión de soporte." });
    } finally {
      setIsJoining(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedRequest) return;
    setIsSending(true);
    const chatId = selectedRequest.id;

    try {
      await setDoc(doc(db, 'support_queue', chatId), { 
        lastActivity: serverTimestamp(), 
        lastMessage: input.substring(0, 50),
        status: isPublic ? 'pending' : 'attending'
      }, { merge: true });

      await addDoc(collection(db, 'chat_messages'), {
        chatId,
        role: isPublic ? 'user' : 'tech',
        content: input,
        timestamp: serverTimestamp(),
        senderName: isPublic ? userData.name : techName
      });

      setInput('');
    } catch (e) {
      toast({ variant: "destructive", title: "Error al enviar", description: "Revise su conexión a internet." });
    } finally {
      setIsSending(false);
    }
  };

  if (!mounted) return null;

  // --- VISTA PÚBLICA (USUARIO) ---
  if (isPublic) {
    if (!hasJoined) {
      return (
        <div className="h-full w-full bg-[#f0f2f5] flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
          <Card className="w-full max-w-[500px] rounded-[2.5rem] border-none shadow-2xl overflow-hidden animate-in zoom-in-95">
             <div className="p-10 bg-[#9f2241] text-white text-center space-y-4">
                <div className="h-20 w-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                   <Monitor className="h-10 w-10 text-white" />
                </div>
                <div>
                   <h2 className="text-2xl font-black uppercase tracking-tighter">Iniciar Soporte</h2>
                   <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Mesa de Ayuda ATRES • Estado de México</p>
                </div>
             </div>
             <div className="p-10 bg-white space-y-6">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Nombre Completo del Solicitante</Label>
                   <Input 
                      placeholder="EJ. PROF. JUAN PÉREZ" 
                      className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold uppercase" 
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
                   {isJoining ? <Loader2 className="animate-spin" /> : "CONECTAR CON UN TÉCNICO"}
                </Button>
             </div>
             <div className="p-6 bg-slate-50 border-t flex items-center justify-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Conexión Segura Encriptada</span>
             </div>
          </Card>
        </div>
      );
    }

    return (
      <div className="flex h-full w-full bg-white overflow-hidden">
        {/* Columna Izquierda: Apoyo Remoto */}
        <aside className="w-80 bg-slate-50 border-r flex flex-col shrink-0">
           <div className="p-6 bg-white border-b">
              <h3 className="text-lg font-black text-[#9f2241] uppercase tracking-tighter">Apoyo Remoto</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pasos para la conexión</p>
           </div>
           <ScrollArea className="flex-1">
              <div className="p-6 space-y-8">
                 <div className="space-y-4">
                    {[
                      { step: 1, text: 'Descargar AnyDesk en su equipo.', icon: Download },
                      { step: 2, text: 'Localizar y copiar su ID de 9 dígitos.', icon: Info },
                      { step: 3, text: 'Pegar el ID en el campo inferior.', icon: Paperclip },
                    ].map(s => (
                      <div key={s.step} className="flex gap-4 items-start">
                         <div className="h-6 w-6 rounded-lg bg-[#9f2241] text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg">{s.step}</div>
                         <p className="text-[11px] font-semibold text-slate-600 leading-tight pt-1">{s.text}</p>
                      </div>
                    ))}
                 </div>

                 <div className="p-6 bg-[#EFE7DD] rounded-[2rem] border-2 border-[#B38E5D]/30 space-y-4 shadow-inner">
                    <Label className="text-[9px] font-black uppercase text-[#B38E5D] text-center block">ID ANYDESK / TEAMVIEWER</Label>
                    <Input 
                      placeholder="000 000 000" 
                      className="h-12 bg-white rounded-xl border-none shadow-xl text-center font-mono font-black text-xl text-primary" 
                      value={userData.anydeskId}
                      onChange={e => setUserData({...userData, anydeskId: e.target.value})}
                    />
                    <Button className="w-full bg-[#B38E5D] hover:bg-[#a08252] text-white h-11 rounded-xl text-[10px] font-black shadow-lg">SOLICITAR SOPORTE</Button>
                 </div>

                 <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
                    <p className="text-[9px] font-bold text-blue-900 uppercase leading-relaxed">Espere a que un analista tome su turno. No cierre esta ventana.</p>
                 </div>
              </div>
           </ScrollArea>
        </aside>

        {/* Columna Derecha: Chat de Soporte */}
        <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden">
           <header className="h-16 bg-white border-b px-8 flex items-center justify-between shrink-0 shadow-sm z-30">
              <div className="flex items-center gap-4">
                 <Avatar className="h-10 w-10 border-2 border-emerald-500">
                    <AvatarFallback className="bg-slate-100 text-slate-400"><Bot /></AvatarFallback>
                 </Avatar>
                 <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase leading-none">Asistente Técnico</h4>
                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Conectado • Listo para ayudar
                    </p>
                 </div>
              </div>
           </header>

           <ScrollArea className="flex-1 px-8 py-8 bg-[#efe7dd] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
              <div className="max-w-4xl mx-auto space-y-4">
                 {messages.map((m, i) => (
                   <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2", m.role === 'user' ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[80%] p-5 rounded-[1.8rem] text-sm font-semibold shadow-lg", m.role === 'user' ? "bg-[#e7ffdb] rounded-tr-none border border-emerald-100" : "bg-white rounded-tl-none border border-slate-200")}>
                         <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                         <div className="text-[8px] font-black uppercase opacity-30 text-right mt-2 flex items-center justify-end gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {m.timestamp?.seconds ? format(new Date(m.timestamp.seconds * 1000), 'HH:mm') : '...'}
                         </div>
                      </div>
                   </div>
                 ))}
                 <div ref={scrollRef} />
              </div>
           </ScrollArea>

           <footer className="p-6 bg-white border-t shrink-0">
              <div className="max-w-4xl mx-auto flex items-center gap-4">
                 <Input 
                   value={input} 
                   onChange={e => setInput(e.target.value)} 
                   onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                   placeholder="DESCRIBA SU DUDA TÉCNICA AQUÍ..." 
                   className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner px-8 font-bold text-sm uppercase focus:ring-2 focus:ring-emerald-500/20"
                 />
                 <Button onClick={handleSendMessage} disabled={isSending || !input.trim()} className="h-14 w-14 rounded-2xl bg-[#128c7e] hover:bg-[#075e54] shadow-xl p-0 shrink-0">
                    <Send className="h-6 w-6" />
                 </Button>
              </div>
           </footer>
        </div>
      </div>
    );
  }

  // --- VISTA ANALISTA (CALL CENTER) ---
  return (
    <div className="flex h-full w-full bg-white overflow-hidden font-sans">
      {/* 1. Sidebar Táctico */}
      <aside className="w-16 bg-[#0b4135] flex flex-col items-center py-6 gap-6 shrink-0 z-50 border-r border-white/5">
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

      {/* 2. Lista de Sesiones */}
      <div className="w-80 bg-slate-50 border-r border-slate-100 flex flex-col shrink-0 z-40">
        <div className="p-6 bg-white border-b space-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Sesiones Activas</h2>
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
                 className={cn("w-full p-4 rounded-3xl text-left transition-all flex items-center gap-4 border-2", selectedRequest?.id === req.id ? "bg-white border-emerald-500 shadow-xl" : "bg-transparent border-transparent hover:bg-white/80")}
               >
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    <AvatarFallback className="bg-slate-200 text-slate-500 font-black text-xs">{req.userName?.slice(0, 2) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[12px] font-black text-slate-700 uppercase truncate">{req.userName}</span>
                        {req.status === 'pending' && <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
                     </div>
                     <p className="text-[10px] font-semibold text-slate-400 truncate uppercase">{req.lastMessage || 'Solicitud entrante...'}</p>
                  </div>
               </button>
             ))}
           </div>
        </ScrollArea>
      </div>

      {/* 3. Panel de Atención */}
      <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden">
        {selectedRequest ? (
          <>
            <header className="h-16 bg-white border-b px-8 flex items-center justify-between shrink-0 shadow-sm z-30">
               <div className="flex flex-col">
                  <h3 className="text-sm font-black text-slate-800 uppercase leading-none">{selectedRequest.userName}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                     <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">En línea • Soporte en progreso</span>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <Button onClick={() => setActiveView('remote')} variant={activeView === 'remote' ? 'default' : 'ghost'} className="h-9 px-4 rounded-xl text-[10px] font-black gap-2"><Monitor className="h-4 w-4" /> REMOTO</Button>
                  <Button onClick={() => setActiveView('chat')} variant={activeView === 'chat' ? 'default' : 'ghost'} className="h-9 px-4 rounded-xl text-[10px] font-black gap-2"><MessageSquare className="h-4 w-4" /> CHAT</Button>
                  <div className="h-6 w-px bg-slate-200 mx-2" />
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-500 hover:bg-rose-50"><Power className="h-4 w-4" /></Button>
               </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
               <div className="flex-1 flex flex-col overflow-hidden">
                  {activeView === 'remote' ? (
                    <div className="flex-1 p-6 relative">
                       <div className="w-full h-full bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 shadow-2xl relative overflow-hidden flex items-center justify-center">
                          <Image src="https://picsum.photos/seed/desktop/1200/800" alt="Remote" fill className="object-cover opacity-50 grayscale" />
                          <div className="z-10 text-center space-y-4">
                             <div className="h-16 w-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                                <Activity className="text-emerald-400 h-8 w-8" />
                             </div>
                             <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Stream de video activo • 256-bit AES</p>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <>
                      <ScrollArea className="flex-1 px-10 py-10 bg-[#efe7dd] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                         <div className="max-w-4xl mx-auto space-y-4 flex flex-col">
                            {messages.map((m, i) => (
                              <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2", m.role === 'tech' ? "justify-end" : "justify-start")}>
                                <div className={cn("max-w-[75%] p-5 rounded-[1.8rem] text-sm font-semibold shadow-lg", m.role === 'tech' ? "bg-[#e7ffdb] border border-emerald-100 rounded-tr-none text-slate-800" : "bg-white border border-slate-200 rounded-tl-none text-slate-800")}>
                                   <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                                   <div className="text-[8px] font-black uppercase opacity-30 text-right mt-2 flex items-center justify-end gap-1"><Clock className="h-2.5 w-2.5" />{m.timestamp?.seconds ? format(new Date(m.timestamp.seconds * 1000), 'HH:mm') : '...'}</div>
                                </div>
                              </div>
                            ))}
                            <div ref={scrollRef}/>
                         </div>
                      </ScrollArea>
                      <footer className="p-6 bg-white border-t flex gap-4 shrink-0">
                         <div className="max-w-4xl mx-auto flex w-full items-center gap-4">
                            <button className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100"><Paperclip className="h-5 w-5" /></button>
                            <Input 
                               value={input} 
                               onChange={e => setInput(e.target.value)} 
                               onKeyDown={e => e.key === 'Enter' && handleSendMessage()} 
                               className="rounded-2xl bg-slate-50 border-none h-12 px-6 font-bold text-sm uppercase shadow-inner" 
                               placeholder="ESCRIBIR RESPUESTA TÉCNICA..." 
                            />
                            <Button onClick={handleSendMessage} className="bg-[#128c7e] hover:bg-[#075e54] h-12 w-12 rounded-2xl shadow-xl p-0 shrink-0"><Send className="h-5 w-5" /></Button>
                         </div>
                      </footer>
                    </>
                  )}
               </div>
               
               <aside className="w-80 bg-white border-l p-6 space-y-8 overflow-y-auto shrink-0 hidden xl:block">
                  <div className="space-y-6">
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><HardDrive className="h-4 w-4 text-primary" /> Info Dispositivo</h4>
                     <div className="space-y-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                        <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase">OS</span><span className="text-[10px] font-black text-slate-700">WINDOWS 11 PRO</span></div>
                        <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase">RAM</span><span className="text-[10px] font-black text-slate-700">16 GB DDR4</span></div>
                        <div className="flex justify-between items-center pt-2 border-t"><span className="text-[10px] font-bold text-slate-500 uppercase">IP</span><span className="text-[10px] font-black font-mono text-primary">192.168.1.104</span></div>
                     </div>
                  </div>
                  <div className="space-y-6 pt-6 border-t">
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Navigation className="h-4 w-4 text-primary" /> Ubicación CCT</h4>
                     <div className="p-5 bg-slate-50 rounded-[2rem] space-y-3 border border-slate-100 shadow-inner">
                        <p className="text-[11px] font-black text-slate-700 uppercase leading-none">ESC. SEC. FED. 115</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">TOLUCA, EDOMÉX</p>
                        <Badge className="bg-primary/5 text-primary border-none text-[8px] font-black px-3 h-5 rounded-full mt-2">CCT: 15DES0001R</Badge>
                     </div>
                  </div>
               </aside>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-30 text-center">
             <div className="h-40 w-40 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center mb-10 shadow-inner">
                <Laptop className="h-20 w-20 text-slate-300" />
             </div>
             <h3 className="text-3xl font-black uppercase text-slate-800 tracking-tighter">CENTRAL DE SOPORTE ATRES</h3>
             <p className="text-sm font-bold uppercase tracking-[0.4em] text-slate-500 mt-6 border-y border-slate-300 py-4 px-12">Seleccione una sesión activa para iniciar el soporte técnico</p>
          </div>
        )}
      </div>
    </div>
  );
}
