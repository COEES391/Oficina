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
import { PlusCircle, LifeBuoy, FileSpreadsheet, Users, Monitor, Calendar } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from 'xlsx'

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Soporte Técnico</h2>
          <p className="text-muted-foreground">Sistema Integral de Movimientos de la Oficina de Planeación.</p>
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
                    <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-1">
                      <LifeBuoy className="h-4 w-4 text-primary" /> Datos del Plantel (C.T.)
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="region">Región</Label>
                        <Input id="region" value={formData.region} onChange={(e) => setFormData({...formData, region: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="valle">Valle</Label>
                        <Input id="valle" value={formData.valle} onChange={(e) => setFormData({...formData, valle: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  {/* Sección 2: Responsables */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-1">
                      <Users className="h-4 w-4 text-primary" /> Responsable(s) (Técnicos)
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

                  {/* Sección 3: Detalles del Servicio */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-1">
                      <Monitor className="h-4 w-4 text-primary" /> Detalles Técnicos y Equipamiento
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
                        <Label htmlFor="equipos">No. de Equipos</Label>
                        <Input type="number" id="equipos" value={formData.numeroEquipos} onChange={(e) => setFormData({...formData, numeroEquipos: parseInt(e.target.value) || 0})} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="descEquipo">Descripción del Equipo</Label>
                      <Input id="descEquipo" value={formData.descripcionEquipo} onChange={(e) => setFormData({...formData, descripcionEquipo: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="material">Material Utilizado</Label>
                      <Textarea id="material" className="h-20" value={formData.materialUtilizado} onChange={(e) => setFormData({...formData, materialUtilizado: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="setes">SETES (S/N)</Label>
                        <Select value={formData.setes} onValueChange={(val) => setFormData({...formData, setes: val as 'S' | 'N'})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="S">Sí (S)</SelectItem>
                            <SelectItem value="N">No (N)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="mc">No. Servicios M.C.</Label>
                        <Input type="number" id="mc" value={formData.serviciosMC} onChange={(e) => setFormData({...formData, serviciosMC: parseInt(e.target.value) || 0})} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="mp">No. Servicios M.P.</Label>
                        <Input type="number" id="mp" value={formData.serviciosMP} onChange={(e) => setFormData({...formData, serviciosMP: parseInt(e.target.value) || 0})} />
                      </div>
                    </div>
                  </div>

                  {/* Sección 4: Observaciones y Fechas */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-1">
                      <Calendar className="h-4 w-4 text-primary" /> Seguimiento y Fechas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="fechaE">Fecha de Entrada</Label>
                        <Input type="date" id="fechaE" value={formData.fechaEntrada} onChange={(e) => setFormData({...formData, fechaEntrada: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="fechaS">Fecha de Salida</Label>
                        <Input type="date" id="fechaS" value={formData.fechaSalida} onChange={(e) => setFormData({...formData, fechaSalida: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="obs">Observaciones</Label>
                      <Textarea id="obs" className="h-20" value={formData.observaciones} onChange={(e) => setFormData({...formData, observaciones: e.target.value})} />
                    </div>
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-primary" />
            <CardTitle>Historial Detallado de Soporte</CardTitle>
          </div>
          <CardDescription>Resumen de movimientos técnicos por CCT y municipio.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] w-full border rounded-md">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[100px]">Folio</TableHead>
                  <TableHead className="w-[120px]">C.C.T.</TableHead>
                  <TableHead>Nombre CT</TableHead>
                  <TableHead>Municipio</TableHead>
                  <TableHead>Z.E./Sec</TableHead>
                  <TableHead>Oficio</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead className="text-center">M.C.</TableHead>
                  <TableHead className="text-center">M.P.</TableHead>
                  <TableHead>Estatus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length > 0 ? tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs font-bold">{ticket.id}</TableCell>
                    <TableCell className="font-mono text-xs">{ticket.cct}</TableCell>
                    <TableCell className="max-w-[180px] truncate" title={ticket.schoolName}>{ticket.schoolName}</TableCell>
                    <TableCell>{ticket.municipio}</TableCell>
                    <TableCell className="text-xs">{ticket.zonaEscolar} / {ticket.sector}</TableCell>
                    <TableCell className="text-xs">{ticket.numeroOficio}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{ticket.fechaEntrada}</TableCell>
                    <TableCell className="text-center font-bold text-orange-600">{ticket.serviciosMC}</TableCell>
                    <TableCell className="text-center font-bold text-blue-600">{ticket.serviciosMP}</TableCell>
                    <TableCell>
                      <Badge variant={ticket.status === 'resuelto' ? 'default' : ticket.status === 'pendiente' ? 'destructive' : 'outline'}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-20 text-muted-foreground">
                      No hay registros detallados de soporte técnico.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
