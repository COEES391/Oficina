'use client'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supportData, type SupportTicket } from "@/lib/planning-data"
import { PlusCircle, LifeBuoy, FileSpreadsheet, Users, Monitor, Calendar, FileText, Image as ImageIcon, X, Circle } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from 'xlsx'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export default function SupportPage() {
  const { toast } = useToast()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const initialFormState: Omit<SupportTicket, 'id' | 'status'> = {
    cct: '',
    schoolName: '',
    zonaEscolar: '',
    sector: '',
    modalidad: '',
    municipio: '',
    region: '',
    valle: '',
    responsables: ['', '', '', '', '', ''],
    numeroOficio: '',
    alumnosBeneficiados: 0,
    numeroEquipos: 0,
    materialUtilizado: '',
    setes: 'N',
    observaciones: '',
    descripcionEquipo: '',
    fechaEntrada: format(new Date(), 'yyyy-MM-dd'),
    fechaSalida: '',
    serviciosMC: 0,
    serviciosMP: 0,
    reportPdf: '',
    evidencePhotos: [],
  }

  const [formData, setFormData] = useState(initialFormState)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('support_tickets_full') || '[]')
    if (stored.length === 0) {
      setTickets(supportData)
      localStorage.setItem('support_tickets_full', JSON.stringify(supportData))
    } else {
      setTickets(stored)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'photo') => {
    const files = e.target.files
    if (!files) return

    if (type === 'pdf') {
      const file = files[0]
      if (file.type !== 'application/pdf') {
        toast({ variant: "destructive", title: "Error", description: "Solo se permiten archivos PDF." })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, reportPdf: reader.result as string })
      }
      reader.readAsDataURL(file)
    } else {
      const newPhotos = Array.from(files)
      if (formData.evidencePhotos!.length + newPhotos.length > 5) {
        toast({ variant: "destructive", title: "Límite excedido", description: "Máximo 5 fotos de evidencia." })
        return
      }

      newPhotos.forEach(file => {
        if (!file.type.startsWith('image/')) return
        const reader = new FileReader()
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            evidencePhotos: [...(prev.evidencePhotos || []), reader.result as string]
          }))
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evidencePhotos: prev.evidencePhotos?.filter((_, i) => i !== index)
    }))
  }

  const handleSave = () => {
    if (!formData.cct || !formData.schoolName) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "El CCT y el Nombre de la Escuela son obligatorios.",
      })
      return
    }

    const newTicket: SupportTicket = {
      ...formData,
      id: `S${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'pendiente',
      responsables: formData.responsables.filter(r => r.trim() !== ''),
    }

    const updated = [newTicket, ...tickets]
    setTickets(updated)
    localStorage.setItem('support_tickets_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    setFormData(initialFormState)
    
    toast({
      title: "Registro exitoso",
      description: `Folio ${newTicket.id} guardado correctamente.`,
    })
  }

  const updateTicketStatus = (id: string, newStatus: 'pendiente' | 'en proceso' | 'resuelto') => {
    const updated = tickets.map(t => t.id === id ? { ...t, status: newStatus } : t);
    setTickets(updated);
    localStorage.setItem('support_tickets_full', JSON.stringify(updated));
    toast({ title: "Estatus Actualizado", description: `El reporte ${id} ahora está ${newStatus}.` });
  }

  const exportToExcel = () => {
    const dataToExport = tickets.map(t => ({
      'Folio': t.id,
      'CCT': t.cct,
      'Nombre CT': t.schoolName,
      'Z.E.': t.zonaEscolar,
      'Sector': t.sector,
      'Modalidad': t.modalidad,
      'Municipio': t.municipio,
      'Región': t.region,
      'Valle': t.valle,
      'Responsables': t.responsables.join(', '),
      'No. Oficio': t.numeroOficio,
      'Alumnos Beneficiados': t.alumnosBeneficiados,
      'No. Equipos': t.numeroEquipos,
      'Material Utilizado': t.materialUtilizado,
      'SETES (S/N)': t.setes,
      'Observaciones': t.observaciones,
      'Descripción Equipo': t.descripcionEquipo,
      'Fecha Entrada': t.fechaEntrada,
      'Fecha Salida': t.fechaSalida,
      'M.C.': t.serviciosMC,
      'M.P.': t.serviciosMP,
      'Estatus': t.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Soporte Técnico");
    XLSX.writeFile(workbook, `Reporte_Soporte_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resuelto': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'en proceso': return 'bg-yellow-500 hover:bg-yellow-600 text-black font-semibold';
      case 'pendiente': return 'bg-red-500 hover:bg-red-600 text-white';
      default: return 'bg-gray-500';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Soporte Técnico</h2>
          <p className="text-muted-foreground">Gestión de incidencias y mantenimiento de infraestructura.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Exportar a Excel
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" /> Nuevo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle>Formato de Reporte Técnico</DialogTitle>
                <DialogDescription>
                  Capture todos los campos del formato oficial de planeación.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="flex-1 px-6">
                <div className="grid gap-6 py-4">
                  {/* Sección 1: Datos del Centro de Trabajo */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-1 text-primary">
                      <LifeBuoy className="h-4 w-4" /> Datos del Plantel (C.T.)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cct">C.C.T.</Label>
                        <Input id="cct" value={formData.cct} onChange={(e) => setFormData({...formData, cct: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <Label htmlFor="schoolName">Nombre del C.T.</Label>
                        <Input id="schoolName" value={formData.schoolName} onChange={(e) => setFormData({...formData, schoolName: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="ze">Z.E.</Label>
                        <Input id="ze" value={formData.zonaEscolar} onChange={(e) => setFormData({...formData, zonaEscolar: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="sector">Sector</Label>
                        <Input id="sector" value={formData.sector} onChange={(e) => setFormData({...formData, sector: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="modalidad">Modalidad</Label>
                        <Input id="modalidad" value={formData.modalidad} onChange={(e) => setFormData({...formData, modalidad: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="municipio">Municipio</Label>
                        <Input id="municipio" value={formData.municipio} onChange={(e) => setFormData({...formData, municipio: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  {/* Sección Responsables */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-1 text-primary">
                      <Users className="h-4 w-4" /> Responsable(s) (Técnicos)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                      {formData.responsables.map((resp, idx) => (
                        <div key={idx} className="space-y-1">
                          <Label htmlFor={`resp-${idx}`}>Responsable {idx + 1}</Label>
                          <Input 
                            id={`resp-${idx}`} 
                            value={resp} 
                            onChange={(e) => {
                              const newResp = [...formData.responsables];
                              newResp[idx] = e.target.value;
                              setFormData({...formData, responsables: newResp});
                            }} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sección Detalles */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-1 text-primary">
                      <Monitor className="h-4 w-4" /> Detalles Técnicos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="oficio">No. de Oficio</Label>
                        <Input id="oficio" value={formData.numeroOficio} onChange={(e) => setFormData({...formData, numeroOficio: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="alumnos">Alumnos Beneficiados</Label>
                        <Input type="number" id="alumnos" value={formData.alumnosBeneficiados} onChange={(e) => setFormData({...formData, alumnosBeneficiados: parseInt(e.target.value) || 0})} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="setes">SETES (S/N)</Label>
                        <Select value={formData.setes} onValueChange={(val) => setFormData({...formData, setes: val as 'S' | 'N'})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="S">Sí (S)</SelectItem>
                            <SelectItem value="N">No (N)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Evidencia */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-1 text-primary">
                      <FileText className="h-4 w-4" /> Evidencias y Documentación
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="pdfReport" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Reporte en PDF
                        </Label>
                        <Input 
                          id="pdfReport" 
                          type="file" 
                          accept=".pdf" 
                          onChange={(e) => handleFileChange(e, 'pdf')}
                          className="cursor-pointer"
                        />
                        {formData.reportPdf && (
                          <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                            ✓ PDF cargado correctamente
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="photos" className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" /> Fotos de Evidencia (Máx. 5)
                        </Label>
                        <Input 
                          id="photos" 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          onChange={(e) => handleFileChange(e, 'photo')}
                          disabled={formData.evidencePhotos!.length >= 5}
                          className="cursor-pointer"
                        />
                        <div className="grid grid-cols-5 gap-2 mt-2">
                          {formData.evidencePhotos?.map((photo, idx) => (
                            <div key={idx} className="relative aspect-square rounded-md overflow-hidden border">
                              <Image src={photo} alt={`Evidencia ${idx + 1}`} fill className="object-cover" />
                              <button 
                                onClick={() => removePhoto(idx)}
                                className="absolute top-0 right-0 bg-destructive text-white p-0.5 rounded-bl-md"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="obs">Observaciones Finales</Label>
                    <Textarea id="obs" className="h-20" value={formData.observaciones} onChange={(e) => setFormData({...formData, observaciones: e.target.value})} />
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter className="p-6 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar Reporte Oficial</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-md border-t-4 border-t-primary">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Historial Detallado de Solicitudes
            </CardTitle>
            <CardDescription>Seguimiento en tiempo real con semáforo de atención.</CardDescription>
          </div>
          <div className="flex gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1"><Circle className="h-3 w-3 fill-red-500 text-red-500" /> Pendiente</div>
            <div className="flex items-center gap-1"><Circle className="h-3 w-3 fill-yellow-500 text-yellow-500" /> En Proceso</div>
            <div className="flex items-center gap-1"><Circle className="h-3 w-3 fill-green-500 text-green-500" /> Resuelto</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">Folio</TableHead>
                  <TableHead className="w-[110px]">C.C.T.</TableHead>
                  <TableHead>Escuela</TableHead>
                  <TableHead>Municipio</TableHead>
                  <TableHead>Evidencias</TableHead>
                  <TableHead className="w-[150px]">Semáforo Estatus</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length > 0 ? tickets.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs font-bold text-primary">{ticket.id}</TableCell>
                    <TableCell className="font-mono text-xs">{ticket.cct}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm truncate max-w-[200px]">{ticket.schoolName}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">Sector: {ticket.sector} | Zona: {ticket.zonaEscolar}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{ticket.municipio}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {ticket.reportPdf && <FileText className="h-4 w-4 text-blue-500" />}
                        {ticket.evidencePhotos && ticket.evidencePhotos.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                            <ImageIcon className="h-3 w-3" /> {ticket.evidencePhotos.length}
                          </span>
                        )}
                        {!ticket.reportPdf && (!ticket.evidencePhotos || ticket.evidencePhotos.length === 0) && (
                          <span className="text-[10px] text-muted-foreground italic">Sin archivos</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("uppercase text-[10px] px-2 py-0.5", getStatusColor(ticket.status))}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select 
                        onValueChange={(val) => updateTicketStatus(ticket.id, val as any)}
                        defaultValue={ticket.status}
                      >
                        <SelectTrigger className="h-8 w-32 text-[10px]">
                          <SelectValue placeholder="Cambiar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="en proceso">En Proceso</SelectItem>
                          <SelectItem value="resuelto">Resuelto</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground italic">
                      No se han encontrado registros de atención técnica.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
