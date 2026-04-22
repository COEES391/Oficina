'use client'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { supportData, type SupportTicket } from "@/lib/planning-data"
import { PlusCircle, LifeBuoy } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

export default function SupportPage() {
  const { toast } = useToast()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    cct: '',
    sector: '',
    zona: '',
    school: '',
    issue: '' as SupportTicket['issue'] | '',
  })

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('support_tickets') || '[]')
    if (stored.length === 0) {
      setTickets(supportData)
      localStorage.setItem('support_tickets', JSON.stringify(supportData))
    } else {
      setTickets(stored)
    }
  }, [])

  const handleSave = () => {
    if (!formData.cct || !formData.sector || !formData.zona || !formData.school || !formData.issue) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Por favor llena todos los campos del reporte.",
      })
      return
    }

    const newTicket: SupportTicket = {
      id: `S${Math.floor(1000 + Math.random() * 9000)}`,
      cct: formData.cct.toUpperCase(),
      sector: formData.sector,
      zona: formData.zona,
      school: formData.school,
      issue: formData.issue as SupportTicket['issue'],
      status: 'pendiente',
      date: format(new Date(), 'yyyy-MM-dd'),
    }

    const updated = [newTicket, ...tickets]
    setTickets(updated)
    localStorage.setItem('support_tickets', JSON.stringify(updated))
    setIsDialogOpen(false)
    setFormData({ cct: '', sector: '', zona: '', school: '', issue: '' })
    
    toast({
      title: "Reporte registrado",
      description: `El folio ${newTicket.id} ha sido creado exitosamente.`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Soporte Técnico</h2>
          <p className="text-muted-foreground">Gestión de incidencias y mantenimiento tecnológico.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" /> Nuevo Reporte
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Incidencia</DialogTitle>
              <DialogDescription>
                Ingresa los datos del plantel y el tipo de soporte requerido.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cct">CCT</Label>
                  <Input 
                    id="cct" 
                    placeholder="Ej. 15EES..." 
                    value={formData.cct} 
                    onChange={(e) => setFormData({...formData, cct: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school">Nombre de la Escuela</Label>
                  <Input 
                    id="school" 
                    placeholder="Nombre oficial" 
                    value={formData.school} 
                    onChange={(e) => setFormData({...formData, school: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sector">Sector</Label>
                  <Input 
                    id="sector" 
                    placeholder="00" 
                    value={formData.sector} 
                    onChange={(e) => setFormData({...formData, sector: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zona">Zona</Label>
                  <Input 
                    id="zona" 
                    placeholder="00" 
                    value={formData.zona} 
                    onChange={(e) => setFormData({...formData, zona: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue">Incidencia</Label>
                <Select onValueChange={(val) => setFormData({...formData, issue: val as SupportTicket['issue']})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de falla" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Red Local">Red Local</SelectItem>
                    <SelectItem value="Instalación de Red Local">Instalación de Red Local</SelectItem>
                    <SelectItem value="Red Edusat">Red Edusat</SelectItem>
                    <SelectItem value="Mantenimiento Preventivo">Mantenimiento Equipo de Cómputo (Preventivo)</SelectItem>
                    <SelectItem value="Mantenimiento Corrective">Mantenimiento Equipo de Cómputo (Correctivo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Guardar Reporte</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-primary" />
            <CardTitle>Historial de Movimientos</CardTitle>
          </div>
          <CardDescription>Seguimiento detallado por CCT, Sector y Zona.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Folio</TableHead>
                <TableHead>CCT</TableHead>
                <TableHead>Sec/Zona</TableHead>
                <TableHead>Escuela</TableHead>
                <TableHead>Incidencia</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length > 0 ? tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-xs font-bold">{ticket.id}</TableCell>
                  <TableCell className="font-mono text-xs">{ticket.cct}</TableCell>
                  <TableCell>{ticket.sector} / {ticket.zona}</TableCell>
                  <TableCell className="max-w-[150px] truncate" title={ticket.school}>{ticket.school}</TableCell>
                  <TableCell className="text-xs font-medium">{ticket.issue}</TableCell>
                  <TableCell>
                    <Badge variant={ticket.status === 'resuelto' ? 'default' : ticket.status === 'pendiente' ? 'destructive' : 'outline'}>
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{ticket.date}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No hay registros de soporte técnico.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
