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
import { schoolsDirectory } from "@/lib/schools-directory"
import { PlusCircle, LifeBuoy, FileSpreadsheet, Users, Monitor, Calendar, FileText, Image as ImageIcon, X, Circle, Search, MapPin } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from 'xlsx'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export default function SupportPage() {
  const { toast } = useToast()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const initialFormState: Omit<SupportTicket, 'status'> = {
    id: '',
    cct: '',
    schoolName: '',
    zonaEscolar: '',
    sector: '',
    modalidad: '',
    municipio: '',
    region: '',
    valle: '',
    responsables: ['', '', '', '', '', ''],
    oficinaRegionalAtencion: '',
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

  const handleSelectSchool = (cct: string) => {
    const school = schoolsDirectory.find(s => s.cct === cct);
    if (school) {
      setFormData({
        ...formData,
        cct: school.cct,
        schoolName: school.nombre,
        zonaEscolar: school.zonaEscolar,
        sector: school.sector,
        modalidad: school.modalidad,
        municipio: school.municipio,
        region: school.region,
        valle: school.valle
      });
      toast({
        title: "Plantel seleccionado",
        description: `Se han autocompletado los datos para ${school.nombre}`,
      });
    }
  }

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
      if ((formData.evidencePhotos?.length || 0) + newPhotos.length > 5) {
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
    if (!formData.id || !formData.cct || !formData.schoolName) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "El Folio, CCT y el Nombre de la Escuela son obligatorios.",
      })
      return
    }

    if (tickets.some(t => t.id === formData.id)) {
      toast({
        variant: "destructive",
        title: "Folio duplicado",
        description: "Este número de folio ya ha sido registrado anteriormente.",
      })
      return
    }

    const newTicket: SupportTicket = {
      ...formData,
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
      'Oficina que Atendió': t.oficinaRegionalAtencion,
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

  const filteredSchools = schoolsDirectory.filter(s => 
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.cct.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  Capture todos los campos. Puede buscar el plantel por CCT o Nombre para autocompletar.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="flex-1 px-6">
                <div className="grid gap-6 py-4">
                  {/* Buscador de Planteles */}
                  <div className="p-4 bg-muted/30 rounded-lg border border-primary/20 space-y-3">
                    <Label className="flex items-center gap-2 text-primary font-bold"><Search className="h-4 w-4" /> Buscador de Planteles (Catálogo Oficial)</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Buscar por Nombre o CCT..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    {searchTerm && (
                      <div className="max-h-40 overflow-auto border rounded bg-white shadow-sm mt-1">
                        {filteredSchools.map(school => (
                          <div 
                            key={school.cct} 
                            className="p-2 hover:bg-primary/5 cursor-pointer text-xs border-b last:border-0"
                            onClick={() => {
                              handleSelectSchool(school.cct);
                              setSearchTerm('');
                            }}
                          >
                            <span className="font-bold">{school.cct}</span> - {school.nombre}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-1 text-primary">
                      <FileText className="h-4 w-4" /> Identificación del Reporte
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="folio" className="text-primary font-bold">No. de Folio</Label>
                        <Input 
                          id="folio" 
                          placeholder="Ejem: S-2024-001"
                          className="border-primary/50 focus:border-primary uppercase font-bold"
                          value={formData.id} 
                          onChange={(e) => setFormData({...formData, id: e.target.value.toUpperCase()})} 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="oficinaRegional" className="text-primary font-bold">Oficina Regional que atendió</Label>
                        <Select value={formData.oficinaRegionalAtencion} onValueChange={(val) => setFormData({...formData, oficinaRegionalAtencion: val})}>
                          <SelectTrigger className="border-primary/50">
                            <SelectValue placeholder="Seleccionar oficina..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Oficina de Tecnóloga Educativa Ecatepec">Oficina de Tecnóloga Educativa Ecatepec</SelectItem>
                            <SelectItem value="Oficina de Tecnóloga Educativa Naucalpan">Oficina de Tecnóloga Educativa Naucalpan</SelectItem>
                            <SelectItem value="Oficina de Tecnóloga Educativa Nezahualcóyotl">Oficina de Tecnóloga Educativa Nezahualcóyotl</SelectItem>
                            <SelectItem value="Oficina de Tecnóloga Educativa Toluca">Oficina de Tecnóloga Educativa Toluca</SelectItem>
                            <SelectItem value="Oficina de COEES Tultitlan">Oficina de COEES Tultitlan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="oficio">No. de Oficio</Label>
                        <Input id="oficio" value={formData.numeroOficio} onChange={(e) => setFormData({...formData, numeroOficio: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="fechaEntrada">Fecha de Entrada</Label>
                        <Input type="date" id="fechaEntrada" value={formData.fechaEntrada} onChange={(e) => setFormData({...formData, fechaEntrada: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-1 text-primary">
                      <LifeBuoy className="h-4 w-4" /> Datos del Plantel (C.T.)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cct">C.C.T.</Label>
                        <Input id="cct" value={formData.cct} readOnly className="bg-muted/50" />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <Label htmlFor="schoolName">Nombre del C.T.</Label>
                        <Input id="schoolName" value={formData.schoolName} readOnly className="bg-muted/50" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="ze">Z.E.</Label>
                        <Input id="ze" value={formData.zonaEscolar} readOnly className="bg-muted/50" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="sector">Sector</Label>
                        <Input id="sector" value={formData.sector} readOnly className="bg-muted/50" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="modalidad">Modalidad</Label>
                        <Input id="modalidad" value={formData.modalidad} readOnly className="bg-muted/50" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="municipio">Municipio</Label>
                        <Input id="municipio" value={formData.municipio} readOnly className="bg-muted/50" />
                      </div>
                    </div>
                  </div>

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

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-1 text-primary">
                      <Monitor className="h-4 w-4" /> Detalles Técnicos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        />
                        {formData.reportPdf && (
                          <div className="text-xs text-green-600 font-medium flex items-center gap-1">✓ PDF cargado</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="photos" className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" /> Fotos (Máx. 5)
                        </Label>
                        <Input 
                          id="photos" 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          onChange={(e) => handleFileChange(e, 'photo')}
                          disabled={(formData.evidencePhotos?.length || 0) >= 5}
                        />
                        <div className="grid grid-cols-5 gap-2 mt-2">
                          {formData.evidencePhotos?.map((photo, idx) => (
                            <div key={idx} className="relative aspect-square rounded overflow-hidden border">
                              <Image src={photo} alt={`Evidencia ${idx + 1}`} fill className="object-cover" />
                              <button onClick={() => removePhoto(idx)} className="absolute top-0 right-0 bg-destructive text-white p-0.5"><X className="h-3 w-3" /></button>
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
                  <TableHead className="w-[120px]">Folio</TableHead>
                  <TableHead>Atendido por</TableHead>
                  <TableHead>Escuela / CCT</TableHead>
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
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-2 w-2" /> Regional
                        </span>
                        <span className="text-[10px] font-medium max-w-[150px] leading-tight">
                          {ticket.oficinaRegionalAtencion || 'No asignada'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm truncate max-w-[200px]">{ticket.schoolName}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-mono">{ticket.cct}</span>
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