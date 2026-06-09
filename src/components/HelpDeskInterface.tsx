'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { chatWithHelpDesk } from '@/ai/flows/help-desk-flow'
import { 
  Send, 
  Bot, 
  User, 
  MonitorOff, 
  MonitorDot, 
  Loader2, 
  Wifi,
  Headset,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

type Message = {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export function HelpDeskInterface({ isPublic = false }: { isPublic?: boolean }) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [remoteId, setRemoteId] = useState('')
  const [isRemoteRequested, setIsRemoteRequested] = useState(false)
  const [pendingRemoteId, setPendingRemoteId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    setMessages([
      { 
        role: 'bot', 
        content: '¡Hola! Soy tu Asistente Virtual COEES. ¿En qué puedo apoyarte con el sistema ATRES o soporte técnico hoy?', 
        timestamp: new Date() 
      }
    ])

    // Si es analista (no publico), buscar solicitudes pendientes
    if (!isPublic) {
      const pending = localStorage.getItem('atres_support_request_details')
      if (pending) {
        const data = JSON.parse(pending)
        setPendingRemoteId(data.remoteId)
      }
    }
  }, [isPublic])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMsg: Message = { role: 'user', content: input, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      await chatWithHelpDesk({ message: input })
      const botMsg: Message = { 
        role: 'bot', 
        content: `Instrucciones: Por favor, sigue los pasos de la columna de Apoyo Remoto a mi izquierda para que un analista te asista.`, 
        timestamp: new Date() 
      }
      setMessages(prev => [...prev, botMsg])
    } catch (error) {
      const botMsg: Message = { 
        role: 'bot', 
        content: `Instrucciones: Por favor, sigue los pasos de la columna de Apoyo Remoto a mi izquierda para que un analista te asista.`, 
        timestamp: new Date() 
      }
      setMessages(prev => [...prev, botMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const handleRequestRemote = () => {
    if (!remoteId) return
    setIsRemoteRequested(true)
    
    // Guardar detalles de la solicitud para el técnico
    localStorage.setItem('atres_support_request', Date.now().toString())
    localStorage.setItem('atres_support_request_details', JSON.stringify({
      remoteId,
      timestamp: Date.now()
    }))
    
    setTimeout(() => {
      const botMsg: Message = { 
        role: 'bot', 
        content: `He recibido tu solicitud de soporte remoto para el ID: ${remoteId}. He vinculado esta información con nuestros técnicos. Por favor, mantén AnyDesk abierto y acepta la conexión en cuanto aparezca el aviso en tu pantalla.`, 
        timestamp: new Date() 
      }
      setMessages(prev => [...prev, botMsg])
    }, 1500)
  }

  const copyPendingId = () => {
    if (!pendingRemoteId) return
    navigator.clipboard.writeText(pendingRemoteId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "ID Copiado", description: "El ID de soporte ha sido copiado al portapapeles." })
  }

  const clearPendingRequest = () => {
    localStorage.removeItem('atres_support_request')
    localStorage.removeItem('atres_support_request_details')
    setPendingRemoteId(null)
    toast({ title: "Solicitud Finalizada", description: "La alerta ha sido limpiada del sistema." })
  }

  return (
    <div className={cn(
      "flex h-full flex-col md:flex-row bg-white overflow-hidden", 
      isPublic && "rounded-[2rem] shadow-2xl border border-primary/10"
    )}>
      {/* Sidebar de Soporte Remoto */}
      <div className="w-full md:w-[300px] bg-slate-50 border-r p-5 space-y-6 shrink-0 flex flex-col overflow-y-auto">
        <div className="space-y-1">
          <Badge className="bg-primary text-white text-[8px] font-black uppercase px-2 py-0.5">SERVICIO OFICIAL</Badge>
          <h3 className="text-lg font-black text-primary uppercase leading-tight">APOYO REMOTO</h3>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">CONEXIÓN DIRECTA COEES.</p>
        </div>

        {!isPublic && pendingRemoteId ? (
          <div className="p-5 bg-[#9f2241] rounded-2xl shadow-xl space-y-4 border-2 border-white/20 animate-in zoom-in-95 duration-500">
            <div className="flex items-center gap-2">
               <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
               <span className="text-[10px] font-black uppercase text-white tracking-widest">SOLICITUD ENTRANTE</span>
            </div>
            <div className="space-y-1">
               <p className="text-[8px] font-black text-white/60 uppercase">ID DEL DOCENTE:</p>
               <div className="flex items-center justify-between bg-white/10 rounded-xl p-3 border border-white/5">
                  <span className="text-xl font-mono font-black text-white tracking-widest">{pendingRemoteId}</span>
                  <Button variant="ghost" size="icon" onClick={copyPendingId} className="text-white hover:bg-white/20 h-8 w-8">
                     {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
               </div>
            </div>
            <Button onClick={clearPendingRequest} className="w-full bg-white text-primary hover:bg-slate-100 font-black text-[9px] uppercase h-10 rounded-xl shadow-lg">
               FINALIZAR ATENCIÓN
            </Button>
          </div>
        ) : (
          <div className="p-4 bg-white rounded-2xl border shadow-sm space-y-4 border-primary/5">
            <div className="flex items-center gap-2">
              <div className={cn("h-2 w-2 rounded-full animate-pulse", isRemoteRequested ? "bg-emerald-500" : "bg-amber-500")} />
              <span className="text-[9px] font-black uppercase text-slate-700">{isRemoteRequested ? "Esperando Técnico" : "Sin Conexión"}</span>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-[7px] font-black uppercase text-slate-400 pl-1">ID ANYDESK / TEAMVIEWER</Label>
              <Input 
                placeholder="000 000 000" 
                className="h-10 text-center font-mono font-black border-primary/10 text-base bg-slate-50 rounded-xl focus:ring-4 focus:ring-primary/5" 
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
          <h4 className="text-[8px] font-black uppercase text-accent tracking-[0.2em] border-b pb-1.5">INSTRUCCIONES</h4>
          <ul className="space-y-3">
            {[
              "Descargue AnyDesk en su equipo.",
              "Copie su ID personal de 9 dígitos.",
              "Péguelo arriba y haga clic en enviar.",
              "Acepte la conexión al solicitarse."
            ].map((step, i) => (
              <li key={i} className="flex gap-2.5 text-[10px] font-bold text-slate-600 items-start">
                <span className="h-5 w-5 rounded-full bg-white border border-primary/10 flex items-center justify-center text-primary shrink-0 font-black text-[9px] shadow-sm">{i+1}</span>
                <span className="leading-tight pt-0.5 uppercase">{step}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-auto pt-4 opacity-30">
           <div className="flex items-center gap-2 text-primary">
              <Wifi className="h-3 w-3" />
              <span className="text-[6px] font-black uppercase tracking-[0.2em]">SERVIDOR CENTRAL COEES</span>
           </div>
        </div>
      </div>

      {/* Área de Chatbot */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden min-w-0">
        <header className="p-4 border-b flex flex-row justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner border border-primary/5">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-primary uppercase leading-none">Asistente Virtual ATRES</h2>
              <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-[0.2em] mt-1">Soporte Especializado 24/7</p>
            </div>
          </div>
          <Badge variant="outline" className="hidden sm:flex text-[8px] font-black uppercase border-primary/20 py-1.5 px-4 rounded-full bg-white shadow-sm">
            <Headset className="h-3.5 w-3.5 mr-2 text-primary" /> SOPORTE OFICIAL
          </Badge>
        </header>

        <ScrollArea className="flex-1 bg-slate-50/30">
          <div className="p-6 space-y-6 max-w-3xl mx-auto">
            {messages.map((msg, i) => (
              <div key={i} className={cn(
                "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-400", 
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}>
                <div className={cn(
                  "flex gap-3 max-w-[85%]",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}>
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-md",
                    msg.role === 'user' ? "bg-accent text-white" : "bg-primary text-white"
                  )}>
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-[1.5rem] text-[12px] font-semibold shadow-sm border leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-accent text-white rounded-tr-none border-accent/20" 
                      : "bg-white text-slate-700 rounded-tl-none border-slate-100"
                  )}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className={cn(
                      "text-[8px] mt-2 font-black uppercase tracking-widest",
                      msg.role === 'user' ? "text-white/60" : "text-slate-300"
                    )}>
                      {mounted ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-pulse">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-white border border-slate-100 p-3 rounded-[1.5rem] rounded-tl-none shadow-sm flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">ANALIZANDO...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <footer className="p-4 bg-white border-t border-slate-100">
          <div className="max-w-3xl mx-auto flex gap-3">
            <Input 
              placeholder="Describa su duda técnica aquí..." 
              className="h-12 rounded-xl bg-slate-50 border-primary/5 px-6 font-bold text-sm shadow-inner focus:ring-4 focus:ring-primary/5 transition-all"
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
      </div>
    </div>
  )
}
