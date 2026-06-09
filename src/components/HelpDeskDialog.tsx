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
        <DialogHeader className="sr-only">
          <DialogTitle>Mesa de Ayuda ATRES</DialogTitle>
          <DialogDescription>Asistente virtual y soporte remoto para usuarios de ATRES.</DialogDescription>
        </DialogHeader>

        <HelpDeskInterface />
      </DialogContent>
    </Dialog>
  )
}
