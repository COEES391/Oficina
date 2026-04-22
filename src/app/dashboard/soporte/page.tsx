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
    responsables: ['', '', ''],
    oficinaRegionalAtencion: '',
    numeroOficio: '',
    alumnosBeneficiados: 0,
    docentesBeneficiados: 0,
    numeroEquipos: 0,
    tipoIncidencia: 'mantenimiento preventivo',
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
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, reportPdf: reader.result as string })
      }
      reader.readAsDataURL(file)
    } else {
      const newPhotos = Array.from(files)
      if ((formData.evidencePhotos?.length || 0) + newPhotos.length > 5) {
        toast({ variant: "destructive", title: "Límite", description: "Máximo 5 fotos." })
        return
      }
      newPhotos.forEach(file => {
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

  const handleSave = () => {
    if (!formData.id || !formData.cct) {
      toast({ variant: "destructive", title: "Faltan datos", description: "Folio y CCT son obligatorios." })
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
    toast({ title: "Registro exitoso" })
  }

  const updateTicketStatus = (id: string, newStatus: any) => {
    const updated = tickets.map(t => t.id === id ? { ...t, status: newStatus } : t);
    setTickets(updated);
    localStorage.setItem('support_tickets_full', JSON.stringify(updated));
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Soporte Técnico</h2>
          <p className="text-muted-foreground">Gestión de incidencias y mantenimiento.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><PlusCircle className="h-4 w-4" /> Nuevo Registro</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>Formato de Reporte Técnico</DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 px-6">
              <div className="grid gap-6 py-4">
                <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                  <Label>Buscar Plantel</Label>
                  <Input placeholder="CCT o Nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  {searchTerm && (
                    <div className="max-h-32 overflow-auto bg-white border rounded">
                      {schoolsDirectory.filter(s => s.nombre.includes(searchTerm.toUpperCase()) || s.cct.includes(searchTerm.toUpperCase())).map(s => (
                        <div key={s.cct} className="p-2 hover:bg-muted cursor-pointer text-xs" onClick={() => { handleSelectSchool(s.cct); setSearchTerm('') }}>
                          {s.cct} - {s.nombre}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>Folio</Label><Input value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} /></div>
                  <div className="space-y-1">
                    <Label>Tipo de Incidencia</Label>
                    <Select value={formData.tipoIncidencia} onValueChange={(val: any) => setFormData({...formData, tipoIncidencia: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="red edusat">Red Edusat</SelectItem>
                        <SelectItem value="red local">Red Local</SelectItem>
                        <SelectItem value="instalación red local">Instalación Red Local</SelectItem>
                        <SelectItem value="mantenimiento preventivo">Mantenimiento Preventivo</SelectItem>
                        <SelectItem value="mantenimiento correctivo">Mantenimiento Correctivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>Alumnos Beneficiados</Label><Input type="number" value={formData.alumnosBeneficiados} onChange={e => setFormData({...formData, alumnosBeneficiados: parseInt(e.target.value) || 0})} /></div>
                  <div className="space-y-1"><Label>Docentes Beneficiados</Label><Input type="number" value={formData.docentesBeneficiados} onChange={e => setFormData({...formData, docentesBeneficiados: parseInt(e.target.value) || 0})} /></div>
                </div>
                <div className="space-y-1">
                  <Label>Oficina Regional</Label>
                  <Select value={formData.oficinaRegionalAtencion} onValueChange={(val) => setFormData({...formData, oficinaRegionalAtencion: val})}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Oficina de Tecnóloga Educativa Ecatepec">Ecatepec</SelectItem>
                      <SelectItem value="Oficina de Tecnóloga Educativa Naucalpan">Naucalpan</SelectItem>
                      <SelectItem value="Oficina de Tecnóloga Educativa Nezahualcóyotl">Nezahualcóyotl</SelectItem>
                      <SelectItem value="Oficina de Tecnóloga Educativa Toluca">Toluca</SelectItem>
                      <SelectItem value="Oficina de COEES Tultitlan">Tultitlán</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>M.C. (Servicios)</Label><Input type="number" value={formData.serviciosMC} onChange={e => setFormData({...formData, serviciosMC: parseInt(e.target.value) || 0})} /></div>
                  <div className="space-y-1"><Label>M.P. (Servicios)</Label><Input type="number" value={formData.serviciosMP} onChange={e => setFormData({...formData, serviciosMP: parseInt(e.target.value) || 0})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>Reporte PDF</Label><Input type="file" accept=".pdf" onChange={e => handleFileChange(e, 'pdf')} /></div>
                  <div className="space-y-1"><Label>Fotos (Evidencia)</Label><Input type="file" multiple accept="image/*" onChange={e => handleFileChange(e, 'photo')} /></div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="p-6 border-t">
              <Button onClick={handleSave}>Guardar Reporte</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Folio</TableHead>
                <TableHead>CCT / Plantel</TableHead>
                <TableHead>Incidencia</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-bold">{t.id}</TableCell>
                  <TableCell><div className="flex flex-col"><span className="text-xs font-bold">{t.cct}</span><span className="text-xs truncate max-w-[150px]">{t.schoolName}</span></div></TableCell>
                  <TableCell className="capitalize text-xs">{t.tipoIncidencia}</TableCell>
                  <TableCell>
                    <Badge className={cn("text-[10px] uppercase", t.status === 'resuelto' ? 'bg-green-500' : t.status === 'en proceso' ? 'bg-yellow-500' : 'bg-red-500')}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Select defaultValue={t.status} onValueChange={(val) => updateTicketStatus(t.id, val)}>
                      <SelectTrigger className="h-8 w-24 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="en proceso">Proceso</SelectItem>
                        <SelectItem value="resuelto">Resuelto</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}