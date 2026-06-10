'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  Bot, 
  User, 
  MonitorOff, 
  MonitorDot, 
  Loader2, 
  Headset,
  Copy,
  Check,
  Users,
  ChevronRight,
  MessageSquare,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

type Message = {
  role: 'user' | 'tech' | 'bot';
  content: string;
  timestamp: number;
}

type SupportRequest = {
  remoteId: string;
  timestamp: number;
  status: 'pending' | 'attending';
}

export function HelpDeskInterface({ isPublic = false }: { isPublic?: boolean }) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [remoteId, setRemoteId] = useState('') 
  const [isRemoteRequested, setIsRemoteRequested] = useState(false)
  const [queue, setQueue] = useState<SupportRequest[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)

  const syncQueue = useCallback(() => {
    const rawQueue = localStorage.getItem('atres_support_queue')
    const currentQueue: SupportRequest[] = rawQueue ? JSON.parse(rawQueue) : []
    setQueue(currentQueue)

    if (isPublic) {
      const myId = localStorage.getItem('atres_active_session_id')
      if (myId) {
        setRemoteId(myId)
        setIsRemoteRequested(currentQueue.some(r => r.remoteId === myId))
      }
    }
  }, [isPublic])

  const syncChat = useCallback(() => {
    const activeId = isPublic ? (remoteId || 'docente_pre_session') : selectedId
    
    if (!activeId && !isPublic) {
      setMessages([])
      return
    }

    const historyKey = `atres_chat_${activeId}`
    const history = localStorage.getItem(historyKey)
    
    if (history) {
      setMessages(JSON.parse(history))
    } else {
      const initial: Message[] = [
        { 
          role: 'bot', 
          content: '¡Hola! Soy tu Asistente Virtual COEES. ¿En qué puedo apoyarte con el sistema ATRES o soporte técnico hoy?', 
          timestamp: Date.now() 
        }
      ]
      setMessages(initial)
      localStorage.setItem(historyKey, JSON.stringify(initial))
    }
  }, [isPublic, remoteId, selectedId])

  useEffect(() => {
    setMounted(true)
    syncQueue()
    syncChat()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'atres_support_queue') syncQueue()
      if (e.key?.startsWith('atres_chat_')) syncChat()
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [syncQueue, syncChat])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const saveAndSyncChat = (newMessages: Message[]) => {
    const activeId = isPublic ? (remoteId || 'docente_pre_session') : selectedId
    if (!activeId) return

    const historyKey = `atres_chat_${activeId}`
    setMessages(newMessages)
    localStorage.setItem(historyKey, JSON.stringify(newMessages))
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: historyKey,
      newValue: JSON.stringify(newMessages)
    }))
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const myRole = isPublic ? 'user' : 'tech'
    const newMessage: Message = { 
      role: myRole, 
      content: input, 
      timestamp: Date.now() 
    }

    const updatedMessages = [...messages, newMessage]
    saveAndSyncChat(updatedMessages)
    setInput('')

    // Bot responde instrucciones si es usuario público y no hay técnico atendiendo
    if (isPublic && !messages.some(m => m.role === 'tech')) {
      // Solo enviamos instrucciones si no se han enviado recientemente
      const lastBotMsg = [...messages].reverse().find(m => m.role === 'bot');
      const shouldSendInstructions = !lastBotMsg || !lastBotMsg.content.includes('Instrucciones');

      if (shouldSendInstructions) {
        setIsTyping(true)
        setTimeout(() => {
          const botMsg: Message = { 
            role: 'bot', 
            content: 'Instrucciones: Por favor, sigue los pasos de la columna de Apoyo Remoto a mi izquierda para que un analista te asista.', 
            timestamp: Date.now() 
          }
          saveAndSyncChat([...updatedMessages, botMsg])
          setIsTyping(false)
        }, 1000);
      }
    }
  }

  const handleRequestRemote = () => {
    if (!remoteId || remoteId.length < 5) {
      toast({ variant: "destructive", title: "ID Inválido", description: "Ingrese un ID de AnyDesk válido." })
      return
    }
    
    setIsRemoteRequested(true)
    localStorage.setItem('atres_active_session_id', remoteId)
    
    const rawQueue = localStorage.getItem('atres_support_queue')
    const currentQueue: SupportRequest[] = rawQueue ? JSON.parse(rawQueue) : []
    
    if (!currentQueue.some(r => r.remoteId === remoteId)) {
      const newQueue = [...currentQueue, { remoteId, timestamp: Date.now(), status: 'pending' as const }]
      localStorage.setItem('atres_support_queue', JSON.stringify(newQueue))
      window.dispatchEvent(new StorageEvent('storage', { key: 'atres_support_queue', newValue: JSON.stringify(newQueue) }))
    }

    // Migrar chat previo si existe
    const preHistory = localStorage.getItem('atres_chat_docente_pre_session')
    if (preHistory) {
      localStorage.setItem(`atres_chat_${remoteId}`, preHistory)
      localStorage.removeItem('atres_chat_docente_pre_session')
    }

    const botMsg: Message = { 
      role: 'bot', 
      content: `He recibido tu solicitud de soporte remoto para el ID: ${remoteId}. He vinculado esta información con nuestros técnicos. Por favor, mantén AnyDesk abierto y espera a que un analista se conecte.`, 
      timestamp: Date.now() 
    }
    
    saveAndSyncChat([...messages, botMsg])
  }

  const copyId = (idToCopy: string) => {
    navigator.clipboard.writeText(idToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "ID Copiado" })
  }

  const finishAttention = (idToFinish: string) => {
    const rawQueue = localStorage.getItem('atres_support_queue')
    const currentQueue: SupportRequest[] = rawQueue ? JSON.parse(rawQueue) : []
    const newQueue = currentQueue.filter(r => r.remoteId !== idToFinish)
    
    localStorage.setItem('atres_support_queue', JSON.stringify(newQueue))
    localStorage.removeItem(`atres_chat_${idToFinish}`)
    
    if (isPublic && idToFinish === remoteId) {
       localStorage.removeItem('atres_active_session_id')
       setRemoteId('')
       setIsRemoteRequested(false)
    }

    window.dispatchEvent(new StorageEvent('storage', { key: 'atres_support_queue', newValue: JSON.stringify(newQueue) }))
    
    if (selectedId === idToFinish) setSelectedId(null)
    syncQueue()
    syncChat()
    toast({ title: "Atención Finalizada" })
  }

  return (
    <div className={cn(
      "flex h-full flex-col md:flex-row bg-white overflow-hidden", 
      isPublic && "rounded-[2rem] shadow-2xl border border-primary/10"
    )}>
      {/* Sidebar de Soporte Remoto */}
      <div className="w-full md:w-[320px] bg-slate-50 border-r p-5 space-y-6 shrink-0 flex flex-col overflow-y-auto">
        <div className="space-y-1">
          <Badge className="bg-primary text-white text-[8px] font-black uppercase px-2 py-0.5">MÓDULO OFICIAL</Badge>
          <h3 className="text-lg font-black text-primary uppercase leading-tight">Apoyo Remoto</h3>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">ATENCIÓN TÉCNICA COEES</p>
        </div>

        {!isPublic ? (
          <div className="space-y-4">
             <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Users className="h-4 w-4 text-accent" />
                <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">Docentes en Espera ({queue.length})</span>
             </div>
             
             {queue.length === 0 ? (
               <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                  <MonitorOff className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight">Sin solicitudes activas en este momento</p>
               </div>
             ) : (
               <div className="space-y-2">
                  {queue.map((req) => (
                    <button 
                      key={req.remoteId}
                      onClick={() => setSelectedId(req.remoteId)}
                      className={cn(
                        "w-full p-4 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between group",
                        selectedId === req.remoteId 
                          ? "bg-primary border-primary shadow-lg scale-[1.02]" 
                          : "bg-white hover:bg-slate-100 border-slate-100"
                      )}
                    >
                      <div className="flex flex-col">
                        <span className={cn("text-xs font-mono font-black", selectedId === req.remoteId ? "text-white" : "text-primary")}>{req.remoteId}</span>
                        <span className={cn("text-[7px] font-black uppercase", selectedId === req.remoteId ? "text-white/60" : "text-slate-400")}>
                          En espera: {Math.floor((Date.now() - req.timestamp) / 60000)} min
                        </span>
                      </div>
                      <ChevronRight className={cn("h-4 w-4 transition-transform group-hover:translate-x-1", selectedId === req.remoteId ? "text-white" : "text-slate-300")} />
                    </button>
                  ))}
               </div>
             )}
          </div>
        ) : (
          <div className="p-4 bg-white rounded-2xl border shadow-sm space-y-4 border-primary/5">
            <div className="flex items-center gap-2">
              <div className={cn("h-2 w-2 rounded-full", isRemoteRequested ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
              <span className="text-[9px] font-black uppercase text-slate-700">{isRemoteRequested ? "Conexión Solicitada" : "Sin Vínculo Remoto"}</span>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-[7px] font-black uppercase text-slate-400 pl-1">ID ANYDESK / TEAMVIEWER</Label>
              <Input 
                placeholder="000 000 000" 
                className="h-10 text-center font-mono font-black border-primary/10 text-base bg-slate-50 rounded-xl focus:ring-4 focus:ring-primary/5 shadow-inner" 
                value={remoteId}
                onChange={(e) => setRemoteId(e.target.value)}
                disabled={isRemoteRequested}
              />
            </div>

            <Button 
              onClick={handleRequestRemote}
              disabled={!remoteId || isRemoteRequested}
              className="w-full btn-institutional h-11 text-[9px] gap-2 rounded-xl"
            >
              {isRemoteRequested ? <MonitorDot className="h-4 w-4" /> : <MonitorOff className="h-4 w-4" />}
              {isRemoteRequested ? "SOLICITUD ENVIADA" : "SOLICITAR SOPORTE"}
            </Button>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <h4 className="text-[8px] font-black uppercase text-accent tracking-[0.2em] border-b pb-1.5">PASOS A SEGUIR</h4>
          <ul className="space-y-3">
            {[
              "Descargue AnyDesk en su equipo.",
              "Copie su ID personal de 9 dígitos.",
              "Péguelo arriba y haga clic en Solicitar Soporte.",
              "Esperar unos minutos a que un técnico le atienda."
            ].map((step, i) => (
              <li key={i} className="flex gap-2.5 text-[10px] font-bold text-slate-600 items-start">
                <span className="h-5 w-5 rounded-full bg-white border border-primary/10 flex items-center justify-center text-primary shrink-0 font-black text-[9px] shadow-sm">{i+1}</span>
                <span className="leading-tight pt-0.5 uppercase">{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {!isPublic && selectedId && (
          <div className="mt-auto p-4 bg-white rounded-2xl border border-primary/10 space-y-3 shadow-xl">
             <div className="flex justify-between items-center">
                <p className="text-[9px] font-black uppercase text-slate-400">Atendiendo a:</p>
                <Badge variant="outline" className="text-[7px] font-black text-emerald-600 border-emerald-100 bg-emerald-50">SESIÓN ACTIVA</Badge>
             </div>
             <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border">
                <span className="text-base font-mono font-black text-primary">{selectedId}</span>
                <Button variant="ghost" size="icon" onClick={() => copyId(selectedId)} className="h-8 w-8 hover:bg-white">
                   {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-slate-400" />}
                </Button>
             </div>
             <Button onClick={() => finishAttention(selectedId)} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] uppercase h-10 rounded-xl shadow-lg flex items-center gap-2">
                <X className="h-3.5 w-3.5" /> FINALIZAR ATENCIÓN
             </Button>
          </div>
        )}
      </div>

      {/* Área de Chat */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden min-w-0">
        {!isPublic && !selectedId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 bg-slate-50/50 space-y-4">
             <div className="h-24 w-24 rounded-full bg-white shadow-2xl flex items-center justify-center text-primary/10 border-4 border-white">
                <MessageSquare className="h-12 w-12" />
             </div>
             <div className="text-center space-y-2">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Centro de Mensajería</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-[320px] leading-relaxed">Seleccione un usuario de la lista lateral para iniciar la comunicación técnica privada.</p>
             </div>
          </div>
        ) : (
          <>
            <header className="p-4 border-b flex flex-row justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner border border-primary/5">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-base font-black text-primary uppercase leading-none">Asistente Virtual ATRES</h2>
                  <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-[0.2em] mt-1">Línea de Asistencia Activa</p>
                </div>
              </div>
              {(isPublic ? remoteId : selectedId) && (
                <Badge variant="outline" className="hidden sm:flex text-[8px] font-black uppercase border-primary/20 py-1.5 px-4 rounded-full bg-white shadow-sm font-mono">
                  SESS: {isPublic ? remoteId : selectedId}
                </Badge>
              )}
            </header>

            <ScrollArea className="flex-1 bg-slate-50/30">
              <div className="p-6 space-y-6 max-w-3xl mx-auto">
                {messages.map((msg, i) => {
                  const isMe = (isPublic && msg.role === 'user') || (!isPublic && msg.role === 'tech')
                  return (
                    <div key={i} className={cn(
                      "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300", 
                      isMe ? "justify-end" : "justify-start"
                    )}>
                      <div className={cn(
                        "flex gap-3 max-w-[85%]",
                        isMe ? "flex-row-reverse" : "flex-row"
                      )}>
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-md border-2 border-white",
                          msg.role === 'user' ? "bg-accent text-white" : msg.role === 'tech' ? "bg-primary text-white" : "bg-slate-500 text-white"
                        )}>
                          {msg.role === 'user' ? <User className="h-4 w-4" /> : msg.role === 'tech' ? <Headset className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className={cn(
                          "p-4 rounded-[1.8rem] text-[12px] font-semibold shadow-sm border leading-relaxed",
                          isMe 
                            ? "bg-[#B38E5D] text-white rounded-tr-none border-[#B38E5D]/10" 
                            : "bg-white text-slate-700 rounded-tl-none border-slate-100"
                        )}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <p className={cn(
                            "text-[8px] mt-2 font-black uppercase tracking-widest",
                            isMe ? "text-white/60" : "text-slate-300"
                          )}>
                            {mounted ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {isTyping && (
                  <div className="flex justify-start animate-pulse">
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-white border border-slate-100 p-3 rounded-[1.5rem] rounded-tl-none shadow-sm flex items-center gap-3">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Escribiendo...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <footer className="p-4 bg-white border-t border-slate-100 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
              <div className="max-w-3xl mx-auto flex gap-3">
                <Input 
                  placeholder={isPublic ? "Describa su situación técnica aquí..." : "Escribir respuesta oficial..."}
                  className="h-12 rounded-xl bg-slate-50 border-primary/5 px-6 font-bold text-sm shadow-inner focus:ring-4 focus:ring-primary/5 transition-all focus:bg-white"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isTyping}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isTyping}
                  className="h-12 w-12 rounded-xl btn-institutional shrink-0 shadow-lg"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}
