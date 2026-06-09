'use client'
import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { chatWithHelpDesk } from '@/ai/flows/help-desk-flow'
import { 
  Send, 
  Bot, 
  User, 
  MonitorOff, 
  MonitorDot, 
  Headset, 
  Loader2, 
  Wifi,
  ExternalLink,
  MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Message = {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export function HelpDeskDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: '¡Hola! Soy tu Asistente Virtual COEES. ¿En qué puedo apoyarte con el sistema ATRES o soporte técnico hoy?', timestamp: new Date() }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [remoteId, setRemoteId] = useState('')
  const [isRemoteRequested, setIsRemoteRequested] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] h-[85vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
        <div className="flex h-full flex-col md:flex-row">
          {/* Sidebar de Soporte Remoto */}
          <div className="w-full md:w-[300px] bg-slate-50 border-r p-8 space-y-8 shrink-0">
            <div className="space-y-2">
              <Badge className="bg-primary text-white text-[10px] font-black uppercase px-3 py-1">Servicio Activo</Badge>
              <h3 className="text-xl font-black text-primary uppercase leading-tight">Apoyo Remoto</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Conexión directa con analistas COEES.</p>
            </div>

            <div className="p-6 bg-white rounded-3xl border shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className={cn("h-3 w-3 rounded-full animate-pulse", isRemoteRequested ? "bg-emerald-500" : "bg-amber-500")} />
                <span className="text-[11px] font-black uppercase text-slate-700">{isRemoteRequested ? "Esperando Técnico" : "Sin Conexión"}</span>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-slate-400">ID de AnyDesk / TeamViewer</Label>
                <Input 
                  placeholder="9 DÍGITOS..." 
                  className="h-10 text-center font-mono font-black border-primary/10" 
                  value={remoteId}
                  onChange={(e) => setRemoteId(e.target.value)}
                  disabled={isRemoteRequested}
                />
              </div>

              <Button 
                onClick={handleRequestRemote}
                disabled={!remoteId || isRemoteRequested}
                className="w-full btn-institutional h-11 text-[10px] gap-2"
              >
                {isRemoteRequested ? <MonitorDot className="h-4 w-4" /> : <MonitorOff className="h-4 w-4" />}
                {isRemoteRequested ? "SOLICITUD ENVIADA" : "SOLICITAR REMOTO"}
              </Button>
            </div>

            <div className="space-y-4 pt-4">
              <h4 className="text-[10px] font-black uppercase text-accent tracking-widest border-b pb-2">Instrucciones</h4>
              <ul className="space-y-3">
                {[
                  "Descargue AnyDesk en su equipo.",
                  "Copie su ID personal de 9 dígitos.",
                  "Péguelo arriba y haga clic en enviar.",
                  "Acepte la conexión cuando se le solicite."
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-[10px] font-bold text-slate-600">
                    <span className="h-5 w-5 rounded-full bg-white border flex items-center justify-center text-primary shrink-0">{i+1}</span>
                    <span className="leading-tight">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-auto pt-8">
               <div className="flex items-center gap-2 text-primary/40">
                  <Wifi className="h-4 w-4" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em]">Servidor Central COEES</span>
               </div>
            </div>
          </div>

          {/* Área de Chatbot */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            <header className="p-6 border-b flex justify-between items-center bg-white/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                  <Bot className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-primary uppercase leading-none">Mesa de Ayuda ATRES</h2>
                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Asistente Virtual 24/7</p>
                </div>
              </div>
              <div className="flex gap-2">
                 <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20"><Headset className="h-3 w-3 mr-1" /> Soporte Nivel 1</Badge>
              </div>
            </header>

            <ScrollArea className="flex-1 p-8 bg-slate-50/30">
              <div className="space-y-6">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "flex gap-4 max-w-[80%]",
                      msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}>
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                        msg.role === 'user' ? "bg-accent text-white" : "bg-primary text-white"
                      )}>
                        {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div className={cn(
                        "p-4 rounded-3xl text-sm font-semibold shadow-sm",
                        msg.role === 'user' 
                          ? "bg-accent text-white rounded-tr-none" 
                          : "bg-white text-slate-700 border rounded-tl-none"
                      )}>
                        <p className="leading-relaxed">{msg.content}</p>
                        <p className={cn(
                          "text-[8px] mt-2 font-black uppercase",
                          msg.role === 'user' ? "text-white/60" : "text-slate-400"
                        )}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex gap-4">
                      <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-white border p-4 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Analizando...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <footer className="p-6 bg-white border-t">
              <div className="flex gap-4">
                <Input 
                  placeholder="Escriba su duda técnica aquí..." 
                  className="h-14 rounded-2xl bg-slate-50 border-primary/10 px-6 font-bold shadow-inner focus:ring-2 focus:ring-primary/20"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isTyping}
                  className="h-14 w-14 rounded-2xl btn-institutional shrink-0"
                >
                  <Send className="h-6 w-6" />
                </Button>
              </div>
            </footer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { Label } from './ui/label';
