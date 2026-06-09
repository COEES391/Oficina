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
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: '¡Hola! Soy tu Asistente Virtual COEES. ¿En qué puedo apoyarte con el sistema ATRES o soporte técnico hoy?', timestamp: new Date() }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [remoteId, setRemoteId] = useState('')
  const [isRemoteRequested, setIsRemoteRequested] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMsg: Message = { role: 'user', content: input, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const response = await chatWithHelpDesk({ message: input })
      const botMsg: Message = { role: 'bot', content: response.response, timestamp: new Date() }
      setMessages(prev => [...prev, botMsg])
    } catch (error) {
      const errorMsg: Message = { role: 'bot', content: 'Lo siento, tuve un problema al procesar tu solicitud. Por favor, intenta de nuevo.', timestamp: new Date() }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const handleRequestRemote = () => {
    if (!remoteId) return
    setIsRemoteRequested(true)
    setTimeout(() => {
      const botMsg: Message = { 
        role: 'bot', 
        content: `He recibido tu solicitud de soporte remoto para el ID: ${remoteId}. Un técnico se pondrá en contacto contigo a través de este chat en unos minutos. Por favor, mantén AnyDesk abierto.`, 
        timestamp: new Date() 
      }
      setMessages(prev => [...prev, botMsg])
    }, 1500)
  }

  return (
    <div className={cn("flex h-full flex-col md:flex-row bg-white overflow-hidden", isPublic && "rounded-[2.5rem] shadow-2xl border")}>
      {/* Sidebar de Soporte Remoto */}
      <div className="w-full md:w-[320px] bg-slate-50 border-r p-8 space-y-8 shrink-0 flex flex-col">
        <div className="space-y-2">
          <Badge className="bg-primary text-white text-[10px] font-black uppercase px-3 py-1">Servicio Activo</Badge>
          <h3 className="text-2xl font-black text-primary uppercase leading-tight">Apoyo Remoto</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Conexión directa con analistas COEES.</p>
        </div>

        <div className="p-6 bg-white rounded-[2rem] border shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className={cn("h-3 w-3 rounded-full animate-pulse", isRemoteRequested ? "bg-emerald-500" : "bg-amber-500")} />
            <span className="text-[11px] font-black uppercase text-slate-700">{isRemoteRequested ? "Esperando Técnico" : "Sin Conexión"}</span>
          </div>
          
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase text-slate-400 pl-1">ID AnyDesk / TeamViewer</Label>
            <Input 
              placeholder="9 DÍGITOS..." 
              className="h-12 text-center font-mono font-black border-primary/10 text-lg bg-slate-50 rounded-xl" 
              value={remoteId}
              onChange={(e) => setRemoteId(e.target.value)}
              disabled={isRemoteRequested}
            />
          </div>

          <Button 
            onClick={handleRequestRemote}
            disabled={!remoteId || isRemoteRequested}
            className="w-full btn-institutional h-12 text-[10px] gap-2 rounded-xl"
          >
            {isRemoteRequested ? <MonitorDot className="h-5 w-5" /> : <MonitorOff className="h-5 w-5" />}
            {isRemoteRequested ? "SOLICITUD ENVIADA" : "SOLICITAR SOPORTE"}
          </Button>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase text-accent tracking-[0.2em] border-b pb-2">Instrucciones</h4>
          <ul className="space-y-3">
            {[
              "Descargue AnyDesk en su equipo.",
              "Copie su ID personal de 9 dígitos.",
              "Péguelo arriba y haga clic en enviar.",
              "Acepte la conexión cuando se le solicite."
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-[10px] font-bold text-slate-600">
                <span className="h-5 w-5 rounded-full bg-white border flex items-center justify-center text-primary shrink-0 font-black">{i+1}</span>
                <span className="leading-tight">{step}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-auto pt-8">
           <div className="flex items-center gap-3 text-primary/30">
              <Wifi className="h-5 w-5" />
              <span className="text-[8px] font-black uppercase tracking-[0.2em]">Servidor Central COEES • Edoméx 2026</span>
           </div>
        </div>
      </div>

      {/* Área de Chatbot */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        <header className="p-6 border-b flex justify-between items-center bg-white/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <Bot className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-primary uppercase leading-none">Asistente Virtual ATRES</h2>
              <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Soporte Técnico Especializado 24/7</p>
            </div>
          </div>
          <Badge variant="outline" className="hidden sm:flex text-[9px] font-black uppercase border-primary/20 py-1.5 px-4 rounded-full">
            <Headset className="h-3.5 w-3.5 mr-2 text-primary" /> Soporte Nivel 1
          </Badge>
        </header>

        <ScrollArea className="flex-1 p-8 bg-slate-50/20">
          <div className="space-y-8 max-w-4xl mx-auto">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300", msg.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "flex gap-4 max-w-[85%]",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}>
                  <div className={cn(
                    "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md",
                    msg.role === 'user' ? "bg-accent text-white" : "bg-primary text-white"
                  )}>
                    {msg.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                  </div>
                  <div className={cn(
                    "p-5 rounded-[2rem] text-sm font-semibold shadow-sm border",
                    msg.role === 'user' 
                      ? "bg-accent text-white rounded-tr-none border-accent/20" 
                      : "bg-white text-slate-700 rounded-tl-none border-slate-100"
                  )}>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className={cn(
                      "text-[9px] mt-3 font-black uppercase tracking-widest",
                      msg.role === 'user' ? "text-white/60" : "text-slate-400"
                    )}>
                      {mounted ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-pulse">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="bg-white border border-slate-100 p-5 rounded-[2rem] rounded-tl-none shadow-sm flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Analizando consulta...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <footer className="p-8 bg-white border-t">
          <div className="max-w-4xl mx-auto flex gap-4">
            <Input 
              placeholder="Describa su duda técnica o problema aquí..." 
              className="h-16 rounded-[1.5rem] bg-slate-50 border-primary/10 px-8 font-bold text-base shadow-inner focus:ring-4 focus:ring-primary/10 transition-all"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!input.trim() || isTyping}
              className="h-16 w-16 rounded-[1.5rem] btn-institutional shrink-0"
            >
              <Send className="h-8 w-8" />
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}
