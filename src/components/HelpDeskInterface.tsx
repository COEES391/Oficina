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
  Headset
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Message = {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export function HelpDeskInterface({ isPublic = false }: { isPublic?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [remoteId, setRemoteId] = useState('')
  const [isRemoteRequested, setIsRemoteRequested] = useState(false)
  const [mounted, setMounted] = useState(false)
  
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
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMsg: Message = { role: 'user', content: input, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    const userQuery = input
    setInput('')
    setIsTyping(true)

    try {
      const response = await chatWithHelpDesk({ message: userQuery })
      const botMsg: Message = { 
        role: 'bot', 
        content: `Instrucciones: Por favor, sigue los pasos de la columna de Apoyo Remoto a mi izquierda para que un analista te asista.\n\n${response.response}`, 
        timestamp: new Date() 
      }
      setMessages(prev => [...prev, botMsg])
    } catch (error) {
      const errorMsg: Message = { 
        role: 'bot', 
        content: 'Instrucciones: Por favor, sigue los pasos de la columna de Apoyo Remoto a mi izquierda para que un analista te asista.', 
        timestamp: new Date() 
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const handleRequestRemote = () => {
    if (!remoteId) return
    setIsRemoteRequested(true)
    
    // Notificar al Dashboard vía localStorage
    localStorage.setItem('atres_support_request', Date.now().toString())
    
    setTimeout(() => {
      const botMsg: Message = { 
        role: 'bot', 
        content: `He recibido tu solicitud de soporte remoto para el ID: ${remoteId}. He vinculado esta información con nuestros técnicos. Por favor, mantén AnyDesk abierto y acepta la conexión en cuanto aparezca el aviso en tu pantalla.`, 
        timestamp: new Date() 
      }
      setMessages(prev => [...prev, botMsg])
    }, 1500)
  }

  return (
    <div className={cn(
      "flex h-full flex-col md:flex-row bg-white overflow-hidden", 
      isPublic && "rounded-[2rem] shadow-2xl border border-primary/10"
    )}>
      {/* Sidebar de Soporte Remoto */}
      <div className="w-full md:w-[280px] bg-slate-50 border-r p-5 space-y-6 shrink-0 flex flex-col overflow-y-auto">
        <div className="space-y-1">
          <Badge className="bg-primary text-white text-[8px] font-black uppercase px-2 py-0.5">SERVICIO ACTIVO</Badge>
          <h3 className="text-lg font-black text-primary uppercase leading-tight">APOYO REMOTO</h3>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">CONEXIÓN DIRECTA COEES.</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border shadow-sm space-y-4 border-primary/5">
          <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full animate-pulse", isRemoteRequested ? "bg-emerald-500" : "bg-amber-500")} />
            <span className="text-[9px] font-black uppercase text-slate-700">{isRemoteRequested ? "Esperando Técnico" : "Sin Conexión"}</span>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-[7px] font-black uppercase text-slate-400 pl-1">ID ANYDESK / TEAMVIEWER</Label>
            <Input 
              placeholder="000 000 000" 
              className="h-9 text-center font-mono font-black border-primary/10 text-sm bg-slate-50 rounded-xl" 
              value={remoteId}
              onChange={(e) => setRemoteId(e.target.value)}
              disabled={isRemoteRequested}
            />
          </div>

          <Button 
            onClick={handleRequestRemote}
            disabled={!remoteId || isRemoteRequested}
            className="w-full btn-institutional h-10 text-[8px] gap-2 rounded-xl"
          >
            {isRemoteRequested ? <MonitorDot className="h-4 w-4" /> : <MonitorOff className="h-4 w-4" />}
            {isRemoteRequested ? "SOLICITUD ENVIADA" : "SOLICITAR SOPORTE"}
          </Button>
        </div>

        <div className="space-y-3">
          <h4 className="text-[8px] font-black uppercase text-accent tracking-[0.2em] border-b pb-1.5">INSTRUCCIONES</h4>
          <ul className="space-y-3">
            {[
              "Descargue AnyDesk en su equipo.",
              "Copie su ID personal de 9 dígitos.",
              "Péguelo arriba y haga clic en enviar.",
              "Acepte la conexión al solicitarse."
            ].map((step, i) => (
              <li key={i} className="flex gap-2.5 text-[9px] font-bold text-slate-600 items-start">
                <span className="h-4 w-4 rounded-full bg-white border border-primary/10 flex items-center justify-center text-primary shrink-0 font-black text-[8px] shadow-sm">{i+1}</span>
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
        <header className="p-3 border-b flex flex-row justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner border border-primary/5">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-primary uppercase leading-none">Asistente Virtual ATRES</h2>
              <p className="text-[7px] font-bold text-emerald-600 uppercase tracking-[0.2em] mt-1">Soporte Especializado 24/7</p>
            </div>
          </div>
          <Badge variant="outline" className="hidden sm:flex text-[7px] font-black uppercase border-primary/20 py-1 px-3 rounded-full bg-white shadow-sm">
            <Headset className="h-3 w-3 mr-2 text-primary" /> SOPORTE OFICIAL
          </Badge>
        </header>

        <ScrollArea className="flex-1 bg-slate-50/30">
          <div className="p-4 space-y-6 max-w-3xl mx-auto">
            {messages.map((msg, i) => (
              <div key={i} className={cn(
                "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-400", 
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}>
                <div className={cn(
                  "flex gap-2.5 max-w-[85%]",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}>
                  <div className={cn(
                    "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 shadow-md",
                    msg.role === 'user' ? "bg-accent text-white" : "bg-primary text-white"
                  )}>
                    {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-[1.5rem] text-[11px] font-semibold shadow-sm border leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-accent text-white rounded-tr-none border-accent/20" 
                      : "bg-white text-slate-700 rounded-tl-none border-slate-100"
                  )}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className={cn(
                      "text-[7px] mt-2 font-black uppercase tracking-widest",
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
                <div className="flex gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="bg-white border border-slate-100 p-3 rounded-[1.5rem] rounded-tl-none shadow-sm flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">ANALIZANDO...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <footer className="p-3 bg-white border-t border-slate-100">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Input 
              placeholder="Describa su duda técnica aquí..." 
              className="h-11 rounded-xl bg-slate-50 border-primary/5 px-5 font-bold text-xs shadow-inner focus:ring-4 focus:ring-primary/5 transition-all"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isTyping}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!input.trim() || isTyping}
              className="h-11 w-11 rounded-xl btn-institutional shrink-0 shadow-lg"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}
