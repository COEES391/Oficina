
'use client'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import { HelpDeskInterface } from './HelpDeskInterface'

export function HelpDeskDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1100px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
        <DialogHeader className="p-6 bg-[#9f2241] text-white shrink-0">
          <DialogTitle className="uppercase font-black text-lg flex items-center gap-3">
             Mesa de Ayuda ATRES
          </DialogTitle>
          <DialogDescription className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
            Asistente virtual y soporte técnico remoto para el sistema de seguimiento ATRES.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <HelpDeskInterface />
        </div>
      </DialogContent>
    </Dialog>
  )
}
