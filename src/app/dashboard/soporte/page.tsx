
'use client'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { supportData, type SupportTicket } from "@/lib/planning-data"
import { schoolsDirectory } from "@/lib/schools-directory"
import { PlusCircle, LifeBuoy, FileText, Image as ImageIcon, X, Circle, Search, Eye, Pencil, ExternalLink, School } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import Image from 'next/image'
import { cn } from '@/lib/utils'

const REGIONAL_OFFICES = [
  "Oficina de Tecnóloga Educativa Ecatepec",
  "Oficina de Tecnóloga Educativa Naucalpan",
  "Oficina de Tecnóloga Educativa Nezahualcóyotl",
  "Oficina de Tecnóloga Educativa Toluca",
  "Oficina de COEES Tultitlan"
];

export default function SupportPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null)
  
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
    fechaEntrada: '',
    fechaSalida: '',
    serviciosMC: 0,
    serviciosMP: 0,
    reportPdf: '',
    evidencePhotos: [],
  }

  const [formData, setFormData] = useState(initialFormState)

  useEffect(() => {
    setMounted(true)
    const stored = JSON.parse(localStorage.getItem('support_tickets_full') || '[]')
    if (stored.length === 0) {
      setTickets(supportData)
      localStorage.setItem('support_tickets_full', JSON.stringify(supportData))
    } else {
      setTickets(stored)
    }
    
    // Set initial date after mounting
    setFormData(prev => ({ ...prev, fechaEntrada: format(new Date(), 'yyyy-MM-dd') }))
  }, [])

  // Auto-lookup when typing CCT
  useEffect(() => {
    if (searchTerm.length === 10) {
      const match = schoolsDirectory.find(s => s.cct.toUpperCase() === searchTerm.toUpperCase());
      if (match) {
        handleSelectSchool(match.cct);
        setSearchTerm('');
      }
    }
  }, [searchTerm]);

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
        title: "Datos del Plantel Autocompletados",
        description: `Se han configurado automáticamente: Sector ${school.sector}, Zona ${school.zonaEscolar}, Municipio ${school.municipio}, entre otros.`,
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
    if (!formData.id || !formData.cct || !formData.tipoIncidencia) {
      toast({ variant: "destructive", title: "Faltan datos", description: "Folio, CCT y Tipo de Servicio son obligatorios." })
      return
    }

    let updated: SupportTicket[];
    if (editingTicketId) {
      updated = tickets.map(t => t.id === editingTicketId ? { 
        ...formData, 
        responsables: formData.responsables.filter(r => r.trim() !== ''),
        status: t.status 
      } as SupportTicket : t);
      toast({ title: "Reporte actualizado con éxito" });
    } else {
      const newTicket: SupportTicket = {
        ...formData,
        status: 'pendiente',
        responsables: formData.responsables.filter(r => r.trim() !== ''),
      }
      updated = [newTicket, ...tickets]
      toast({ title: "Registro exitoso" })
    }

    setTickets(updated)
    localStorage.setItem('support_tickets_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    resetForm()
    setEditingTicketId(null)
  }

  const resetForm = () => {
    setFormData({
      ...initialFormState,
      fechaEntrada: format(new Date(), 'yyyy-MM-dd')
    })
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

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase">Gestión de Soporte Técnico</h2>
          <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Oficina de Planeación • Control de Servicios</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            resetForm();
            setEditingTicketId(null);
            setSearchTerm('');
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-black uppercase"><PlusCircle className="h-4 w-4" /> Nuevo Reporte</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="uppercase font-black text-primary">
                {editingTicketId ? `Editar Reporte: ${editingTicketId}` : "Nuevo Formato de Reporte Técnico"}
              </DialogTitle>
              <DialogDescription className="font-bold text-xs">Complete el CCT para autocompletar la información geográfica del plantel.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 px-6">
              <div className="grid gap-6 py-4">
                {/* School Lookup Section */}
                <div className="p-4 bg-muted/30 rounded-lg space-y-4 border border-primary/10">
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-black uppercase flex items-center gap-2">
                      <Search className="h-4 w-4 text-primary" /> Búsqueda por CCT o Nombre del Plantel
                    </Label>
                    <div className="relative">
                      <Input 
                        placeholder="Escribir CCT (10 caracteres) para autocompletar..." 
                        className="pl-4 bg-white font-mono uppercase" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        maxLength={10}
                      />
                    </div>
                  </div>
                  
                  {searchTerm && searchTerm.length < 10 && (
                    <div className="max-h-40 overflow-auto bg-white border rounded shadow-lg">
                      {schoolsDirectory.filter(s => s.nombre.toUpperCase().includes(searchTerm.toUpperCase()) || s.cct.includes(searchTerm.toUpperCase())).slice(0, 10).map(s => (
                        <div key={s.cct} className="p-3 hover:bg-primary/5 cursor-pointer text-xs border-b last:border-0 flex justify-between items-center" onClick={() => { handleSelectSchool(s.cct); setSearchTerm('') }}>
                          <div>
                            <span className="font-bold text-primary">{s.cct}</span> - {s.nombre}
                          </div>
                          <Badge variant="outline" className="text-[9px] uppercase">{s.municipio}</Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Auto-populated fields display */}
                  {formData.cct && (
                    <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-300">
                      <div className="flex items-center gap-3 p-3 bg-white rounded-md border shadow-sm">
                        <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center">
                          <School className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-primary uppercase leading-none mb-1">Plantel Seleccionado</p>
                          <p className="text-sm font-bold truncate max-w-[400px]">{formData.schoolName}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">{formData.cct}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground">Sector</Label>
                          <Input value={formData.sector} readOnly className="h-7 text-[10px] font-bold bg-white text-center" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground">Zona</Label>
                          <Input value={formData.zonaEscolar} readOnly className="h-7 text-[10px] font-bold bg-white text-center" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground">Región</Label>
                          <Input value={formData.region} readOnly className="h-7 text-[10px] font-bold bg-white text-center" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground">Municipio</Label>
                          <Input value={formData.municipio} readOnly className="h-7 text-[10px] font-bold bg-white text-center" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground">Valle</Label>
                          <Input value={formData.valle} readOnly className="h-7 text-[10px] font-bold bg-white text-center" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label className="text-xs font-bold uppercase">Folio Reporte</Label><Input value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} placeholder="EJ: S-001" disabled={!!editingTicketId} /></div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase">Tipo de Servicio</Label>
                    <Select value={formData.tipoIncidencia} onValueChange={(val: any) => setFormData({...formData, tipoIncidencia: val})}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
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
                    <Label className="text-xs font-bold uppercase">Oficina Regional</Label>
                    <Select value={formData.oficinaRegionalAtencion} onValueChange={(val) => setFormData({...formData, oficinaRegionalAtencion: val})}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar oficina..." /></SelectTrigger>
                      <SelectContent>
                        {REGIONAL_OFFICES.map(off => (
                          <SelectItem key={off} value={off}>{off.replace("Oficina de ", "")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label className="text-xs font-bold uppercase">Número de Oficio</Label><Input value={formData.numeroOficio} onChange={e => setFormData({...formData, numeroOficio: e.target.value})} placeholder="EJ: DESySA/PL/001/2024" /></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1"><Label className="text-xs font-bold">Alumnos Ben.</Label><Input type="number" value={formData.alumnosBeneficiados} onChange={e => setFormData({...formData, alumnosBeneficiados: parseInt(e.target.value) || 0})} /></div>
                  <div className="space-y-1"><Label className="text-xs font-bold">Docentes Ben.</Label><Input type="number" value={formData.docentesBeneficiados} onChange={e => setFormData({...formData, docentesBeneficiados: parseInt(e.target.value) || 0})} /></div>
                  <div className="space-y-1"><Label className="text-xs font-bold">M.C. Serv.</Label><Input type="number" value={formData.serviciosMC} onChange={e => setFormData({...formData, serviciosMC: parseInt(e.target.value) || 0})} /></div>
                  <div className="space-y-1"><Label className="text-xs font-bold">M.P. Serv.</Label><Input type="number" value={formData.serviciosMP} onChange={e => setFormData({...formData, serviciosMP: parseInt(e.target.value) || 0})} /></div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-xs font-black uppercase text-primary">Gestión de Evidencias Digitales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 p-4 border border-dashed rounded-lg bg-slate-50">
                      <Label className="flex items-center gap-2 text-xs font-black uppercase"><FileText className="h-4 w-4 text-blue-600" /> Reporte Oficial (PDF)</Label>
                      <Input type="file" accept=".pdf" className="bg-white" onChange={e => handleFileChange(e, 'pdf')} />
                      {formData.reportPdf && <p className="text-[10px] text-emerald-600 font-bold">✓ PDF listo para cargar</p>}
                    </div>
                    <div className="space-y-2 p-4 border border-dashed rounded-lg bg-slate-50">
                      <Label className="flex items-center gap-2 text-xs font-black uppercase"><ImageIcon className="h-4 w-4 text-pink-600" /> Evidencia en Fotos (MÁX 5)</Label>
                      <Input type="file" multiple accept="image/*" className="bg-white" onChange={e => handleFileChange(e, 'photo')} disabled={(formData.evidencePhotos?.length || 0) >= 5} />
                      <div className="flex gap-2 flex-wrap mt-2">
                        {formData.evidencePhotos?.map((p, i) => (
                          <div key={i} className="relative h-12 w-12 border-2 border-white rounded shadow-sm overflow-hidden">
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
                  <Label className="text-xs font-bold uppercase">Observaciones Operativas</Label>
                  <Textarea className="min-h-[100px]" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder="Detalle técnico del servicio realizado..." />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="p-6 border-t bg-slate-50">
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); setEditingTicketId(null); setSearchTerm(''); }} className="font-bold uppercase text-xs">Cancelar</Button>
              <Button onClick={handleSave} className="font-black uppercase text-xs px-10">
                {editingTicketId ? "Actualizar Servicio" : "Guardar Servicio Técnico"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-md border-t-4 border-t-primary overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-black text-[10px] uppercase w-[80px]">Folio</TableHead>
                <TableHead className="font-black text-[10px] uppercase">CCT / Plantel</TableHead>
                <TableHead className="font-black text-[10px] uppercase">Servicio</TableHead>
                <TableHead className="font-black text-[10px] uppercase">ESTATUS</TableHead>
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
                  <TableCell className="capitalize text-[11px] font-black text-slate-600">
                    <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">
                      {t.tipoIncidencia || 'Sin especificar'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select defaultValue={t.status} onValueChange={(val) => updateTicketStatus(t.id, val)}>
                      <SelectTrigger className={cn(
                        "h-8 w-36 text-[10px] font-black uppercase border-2 transition-colors",
                        t.status === 'atendido' ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : 
                        t.status === 'en proceso' ? 'border-amber-500 text-amber-700 bg-amber-50' : 
                        'border-rose-500 text-rose-700 bg-rose-50'
                      )}>
                        <div className="flex items-center gap-1.5">
                          <Circle className={cn("h-2 w-2 fill-current", 
                            t.status === 'atendido' ? 'text-emerald-500' : 
                            t.status === 'en proceso' ? 'text-amber-500' : 'text-rose-500'
                          )} />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente" className="text-[10px] font-bold text-rose-600">
                           <div className="flex items-center gap-1.5"><Circle className="h-2 w-2 fill-rose-500" /> PENDIENTE</div>
                        </SelectItem>
                        <SelectItem value="en proceso" className="text-[10px] font-bold text-amber-600">
                           <div className="flex items-center gap-1.5"><Circle className="h-2 w-2 fill-amber-500" /> EN PROCESO</div>
                        </SelectItem>
                        <SelectItem value="atendido" className="text-[10px] font-bold text-emerald-600">
                           <div className="flex items-center gap-1.5"><Circle className="h-2 w-2 fill-emerald-500" /> ATENDIDO</div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      {t.reportPdf && (
                        <Button variant="outline" size="icon" className="h-8 w-8 border-blue-200 hover:bg-blue-50" onClick={() => setEvidenceToView({ type: 'pdf', data: t.reportPdf!, title: `Reporte ${t.id} - ${t.tipoIncidencia}` })}>
                          <FileText className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                      {t.evidencePhotos && t.evidencePhotos.length > 0 && (
                        <Button variant="outline" size="icon" className="h-8 w-8 border-pink-200 hover:bg-pink-50" onClick={() => setEvidenceToView({ type: 'gallery', data: t.evidencePhotos!, title: `Galería ${t.id} - ${t.cct}` })}>
                          <ImageIcon className="h-4 w-4 text-pink-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEdit(t)}>
                       <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {tickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 bg-slate-50/30">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <LifeBuoy className="h-10 w-10 text-primary" />
                      <p className="font-bold text-sm uppercase">Sin registros de soporte técnico.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!evidenceToView} onOpenChange={() => setEvidenceToView(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2 border-b bg-slate-50">
            <DialogTitle className="uppercase font-black text-primary flex items-center gap-2">
              {evidenceToView?.type === 'pdf' ? <FileText className="h-5 w-5 text-blue-600" /> : <ImageIcon className="h-5 w-5 text-pink-600" />}
              {evidenceToView?.title}
              <ExternalLink className="h-3 w-3 text-muted-foreground ml-2" />
            </DialogTitle>
            <DialogDescription className="font-bold text-xs">Visor de evidencias oficiales Oficina de Planeación.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-slate-100 relative">
             {evidenceToView?.type === 'pdf' ? (
                <iframe src={evidenceToView.data as string} className="w-full h-full border-none" />
             ) : (
                <ScrollArea className="h-full w-full p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(evidenceToView?.data as string[])?.map((img, idx) => (
                      <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border-4 border-white shadow-xl group">
                        <Image src={img} alt={`Evidencia ${idx}`} fill className="object-cover" />
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
            <Button variant="secondary" onClick={() => setEvidenceToView(null)} className="font-black uppercase text-xs">Cerrar Visor</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
