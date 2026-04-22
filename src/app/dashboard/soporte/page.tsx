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
import { PlusCircle, LifeBuoy, FileSpreadsheet, Users, Monitor, Calendar, FileText, Image as ImageIcon, X, Circle, Search, MapPin, Eye, Pencil } from "lucide-react"
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
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null)
  
  // Estado para visor de evidencias
  const [evidenceToView, setEvidenceToView] = useState<{ type: 'pdf' | 'gallery', data: string | string[], title: string } | null>(null)

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

    if (editingTicketId) {
      const updated = tickets.map(t => t.id === editingTicketId ? { 
        ...formData, 
        responsables: formData.responsables.filter(r => r.trim() !== ''),
        status: t.status 
      } as SupportTicket : t);
      setTickets(updated);
      localStorage.setItem('support_tickets_full', JSON.stringify(updated));
      toast({ title: "Reporte actualizado con éxito" });
    } else {
      const newTicket: SupportTicket = {
        ...formData,
        status: 'pendiente',
        responsables: formData.responsables.filter(r => r.trim() !== ''),
      }
      const updated = [newTicket, ...tickets]
      setTickets(updated)
      localStorage.setItem('support_tickets_full', JSON.stringify(updated))
      toast({ title: "Registro exitoso" })
    }

    setIsDialogOpen(false)
    setFormData(initialFormState)
    setEditingTicketId(null)
  }

  const handleEdit = (ticket: SupportTicket) => {
    setFormData({
      ...ticket,
      responsables: [...ticket.responsables, '', '', ''].slice(0, 3) as string[],
    });
    setEditingTicketId(ticket.id);
    setIsDialogOpen(true);
  }

  const updateTicketStatus = (id: string, newStatus: any) => {
    const updated = tickets.map(t => t.id === id ? { ...t, status: newStatus } : t);
    setTickets(updated);
    localStorage.setItem('support_tickets_full', JSON.stringify(updated));
    toast({ title: `Estatus actualizado a ${newStatus.toUpperCase()}` });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary uppercase">Soporte Técnico</h2>
          <p className="text-muted-foreground font-semibold">Gestión de servicios y evidencias documentales.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setFormData(initialFormState);
            setEditingTicketId(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold uppercase"><PlusCircle className="h-4 w-4" /> Nuevo Reporte</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="uppercase font-black text-primary">
                {editingTicketId ? `Editando Reporte: ${editingTicketId}` : "Formato de Reporte Técnico"}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 px-6">
              <div className="grid gap-6 py-4">
                <div className="p-4 bg-muted/30 rounded-lg space-y-3 border border-primary/10">
                  <Label className="text-xs font-black uppercase">1. Búsqueda Geográfica de Plantel</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Escribir CCT o Nombre del Plantel..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  {searchTerm && (
                    <div className="max-h-40 overflow-auto bg-white border rounded shadow-lg">
                      {schoolsDirectory.filter(s => s.nombre.includes(searchTerm.toUpperCase()) || s.cct.includes(searchTerm.toUpperCase())).map(s => (
                        <div key={s.cct} className="p-3 hover:bg-primary/5 cursor-pointer text-xs border-b last:border-0 flex justify-between items-center" onClick={() => { handleSelectSchool(s.cct); setSearchTerm('') }}>
                          <div>
                            <span className="font-bold text-primary">{s.cct}</span> - {s.nombre}
                          </div>
                          <Badge variant="outline" className="text-[9px]">{s.municipio}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label className="text-xs font-bold uppercase">Folio de Reporte</Label><Input value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} placeholder="EJ: S-001" disabled={!!editingTicketId} /></div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase">Tipo de Servicio</Label>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase">Oficina Regional Responsable</Label>
                    <Select value={formData.oficinaRegionalAtencion} onValueChange={(val) => setFormData({...formData, oficinaRegionalAtencion: val})}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar oficina..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Oficina de Tecnóloga Educativa Ecatepec">Ecatepec</SelectItem>
                        <SelectItem value="Oficina de Tecnóloga Educativa Naucalpan">Naucalpan</SelectItem>
                        <SelectItem value="Oficina de Tecnóloga Educativa Nezahualcóyotl">Nezahualcóyotl</SelectItem>
                        <SelectItem value="Oficina de Tecnóloga Educativa Toluca">Toluca</SelectItem>
                        <SelectItem value="Oficina de COEES Tultitlan">Tultitlán</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label className="text-xs font-bold uppercase">Número de Oficio</Label><Input value={formData.numeroOficio} onChange={e => setFormData({...formData, numeroOficio: e.target.value})} placeholder="EJ: DESySA/PL/001/2024" /></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1"><Label className="text-xs font-bold">Alumnos Ben.</Label><Input type="number" value={formData.alumnosBeneficiados} onChange={e => setFormData({...formData, alumnosBeneficiados: parseInt(e.target.value) || 0})} /></div>
                  <div className="space-y-1"><Label className="text-xs font-bold">Docentes Ben.</Label><Input type="number" value={formData.docentesBeneficiados} onChange={e => setFormData({...formData, docentesBeneficiados: parseInt(e.target.value) || 0})} /></div>
                  <div className="space-y-1"><Label className="text-xs font-bold">M.C. (Servicios)</Label><Input type="number" value={formData.serviciosMC} onChange={e => setFormData({...formData, serviciosMC: parseInt(e.target.value) || 0})} /></div>
                  <div className="space-y-1"><Label className="text-xs font-bold">M.P. (Servicios)</Label><Input type="number" value={formData.serviciosMP} onChange={e => setFormData({...formData, serviciosMP: parseInt(e.target.value) || 0})} /></div>
                </div>

                <div className="space-y-4 pt-2 border-t">
                  <h3 className="text-xs font-black uppercase text-primary">Anexo de Evidencias Digitales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 p-4 border border-dashed rounded-lg bg-slate-50">
                      <Label className="flex items-center gap-2 text-xs font-bold"><FileText className="h-4 w-4 text-blue-600" /> REPORTE OFICIAL (PDF)</Label>
                      <Input type="file" accept=".pdf" className="bg-white" onChange={e => handleFileChange(e, 'pdf')} />
                      {formData.reportPdf && <p className="text-[10px] text-green-600 font-bold">✓ Archivo cargado correctamente</p>}
                    </div>
                    <div className="space-y-2 p-4 border border-dashed rounded-lg bg-slate-50">
                      <Label className="flex items-center gap-2 text-xs font-bold"><ImageIcon className="h-4 w-4 text-pink-600" /> EVIDENCIA FOTOGRÁFICA (MÁX 5)</Label>
                      <Input type="file" multiple accept="image/*" className="bg-white" onChange={e => handleFileChange(e, 'photo')} disabled={(formData.evidencePhotos?.length || 0) >= 5} />
                      <div className="flex gap-2 flex-wrap mt-2">
                        {formData.evidencePhotos?.map((p, i) => (
                          <div key={i} className="relative h-10 w-10 border rounded bg-white overflow-hidden shadow-sm">
                            <Image src={p} alt="ev" fill className="object-cover" />
                            <button className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5" onClick={() => setFormData(prev => ({ ...prev, evidencePhotos: prev.evidencePhotos?.filter((_, idx) => idx !== i) }))}>
                               <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase">Observaciones Técnicas</Label>
                  <Textarea className="min-h-[100px]" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder="Detalle los hallazgos y soluciones aplicadas..." />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="p-6 border-t bg-slate-50">
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); setFormData(initialFormState); setEditingTicketId(null); }} className="font-bold uppercase">Cancelar</Button>
              <Button onClick={handleSave} className="font-black uppercase px-10">
                {editingTicketId ? "Actualizar Reporte" : "Guardar Reporte Técnico"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-md border-t-4 border-t-primary">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-black text-[10px] uppercase">Folio</TableHead>
                <TableHead className="font-black text-[10px] uppercase">CCT / Plantel</TableHead>
                <TableHead className="font-black text-[10px] uppercase">Servicio</TableHead>
                <TableHead className="font-black text-[10px] uppercase">Estatus (Semáforo)</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-center">Evidencias</TableHead>
                <TableHead className="text-right font-black text-[10px] uppercase">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map(t => (
                <TableRow key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-black text-primary text-sm">{t.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-700">{t.cct}</span>
                      <span className="text-[10px] text-muted-foreground font-bold truncate max-w-[200px]">{t.schoolName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize text-[11px] font-semibold text-slate-600">{t.tipoIncidencia}</TableCell>
                  <TableCell>
                     <div className="flex flex-col gap-2">
                        <Badge className={cn("text-[9px] font-black uppercase tracking-wider w-fit", 
                          t.status === 'atendido' ? 'bg-emerald-500 hover:bg-emerald-600' : 
                          t.status === 'en proceso' ? 'bg-amber-500 hover:bg-amber-600' : 
                          'bg-rose-500 hover:bg-rose-600')}>
                          {t.status}
                        </Badge>
                        <Select defaultValue={t.status} onValueChange={(val) => updateTicketStatus(t.id, val)}>
                          <SelectTrigger className="h-7 w-32 text-[8px] font-black uppercase bg-white/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendiente" className="text-[9px] font-bold text-rose-600">
                               <div className="flex items-center gap-1.5"><Circle className="h-2 w-2 fill-rose-500" /> PENDIENTE</div>
                            </SelectItem>
                            <SelectItem value="en proceso" className="text-[9px] font-bold text-amber-600">
                               <div className="flex items-center gap-1.5"><Circle className="h-2 w-2 fill-amber-500" /> EN PROCESO</div>
                            </SelectItem>
                            <SelectItem value="atendido" className="text-[9px] font-bold text-emerald-600">
                               <div className="flex items-center gap-1.5"><Circle className="h-2 w-2 fill-emerald-500" /> ATENDIDO</div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                     </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      {t.reportPdf ? (
                        <Button variant="outline" size="icon" className="h-7 w-7 border-blue-200 hover:bg-blue-50" onClick={() => setEvidenceToView({ type: 'pdf', data: t.reportPdf!, title: `Reporte ${t.id} - ${t.cct}` })}>
                          <FileText className="h-3.5 w-3.5 text-blue-600" />
                        </Button>
                      ) : <Circle className="h-1.5 w-1.5 text-slate-200" />}
                      {t.evidencePhotos && t.evidencePhotos.length > 0 ? (
                        <Button variant="outline" size="icon" className="h-7 w-7 border-pink-200 hover:bg-pink-50" onClick={() => setEvidenceToView({ type: 'gallery', data: t.evidencePhotos!, title: `Galería ${t.id} - ${t.cct}` })}>
                          <ImageIcon className="h-3.5 w-3.5 text-pink-600" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEdit(t)}>
                          <Pencil className="h-4 w-4" />
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {tickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 bg-slate-50/30">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <LifeBuoy className="h-10 w-10 text-primary" />
                      <p className="font-bold text-sm uppercase">Sin registros de soporte técnico en la base de datos.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DIÁLOGO VISOR DE EVIDENCIAS */}
      <Dialog open={!!evidenceToView} onOpenChange={() => setEvidenceToView(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2 border-b bg-slate-50">
            <DialogTitle className="uppercase font-black text-primary flex items-center gap-2">
              {evidenceToView?.type === 'pdf' ? <FileText className="h-5 w-5 text-blue-600" /> : <ImageIcon className="h-5 w-5 text-pink-600" />}
              {evidenceToView?.title}
            </DialogTitle>
            <DialogDescription className="font-bold text-xs">Visor de evidencias documentales institucionales.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-slate-100 relative">
             {evidenceToView?.type === 'pdf' ? (
                <iframe src={evidenceToView.data as string} className="w-full h-full border-none shadow-inner" />
             ) : (
                <ScrollArea className="h-full w-full p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(evidenceToView?.data as string[])?.map((img, idx) => (
                      <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border-4 border-white shadow-xl group">
                        <Image src={img} alt={`Evidencia ${idx}`} fill className="object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <Eye className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
             )}
          </div>
          <div className="p-4 border-t bg-white flex justify-end">
            <Button variant="secondary" onClick={() => setEvidenceToView(null)} className="font-bold uppercase px-8">Cerrar Visor</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}