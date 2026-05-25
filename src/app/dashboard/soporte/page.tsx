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
import { PlusCircle, LifeBuoy, FileText, ImageIcon, X, Circle, Search, Eye, Pencil, ExternalLink, School } from "lucide-react"
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
    setFormData(prev => ({ ...prev, fechaEntrada: format(new Date(), 'yyyy-MM-dd') }))
  }, [])

  const handleSelectSchool = (cct: string, turno: string) => {
    const school = schoolsDirectory.find(s => s.cct === cct && s.turno === turno);
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
        title: "Plantel Identificado",
        description: `${school.nombre} (${school.turno}) cargado correctamente.`,
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
    } else {
      const newTicket: SupportTicket = {
        ...formData,
        status: 'pendiente',
        responsables: formData.responsables.filter(r => r.trim() !== ''),
      }
      updated = [newTicket, ...tickets]
    }

    setTickets(updated)
    localStorage.setItem('support_tickets_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    resetForm()
    setEditingTicketId(null)
    toast({ title: "Cambios guardados con éxito" })
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
      responsables: [...(ticket.responsables || []), '', '', ''].slice(0, 3) as string[],
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
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase leading-none">Gestión de Soporte Técnico</h2>
          <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
            <LifeBuoy className="h-4 w-4 text-accent" /> Centro de Control Operativo COEES
          </p>
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
            <Button className="btn-institutional h-12 px-8">
              <PlusCircle className="h-5 w-5 mr-2" /> Nuevo Reporte
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem]">
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="uppercase font-black text-primary text-2xl">
                {editingTicketId ? `Actualizar Reporte: ${editingTicketId}` : "Formato de Reporte Técnico"}
              </DialogTitle>
              <DialogDescription className="font-bold text-[11px] uppercase tracking-[0.2em]">
                Capture los datos del servicio y asocie las evidencias digitales correspondientes.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 px-8">
              <div className="grid gap-8 py-6">
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-primary/10 space-y-6 shadow-inner">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2 pl-2">
                      <Search className="h-4 w-4" /> Localizador Institucional CCT
                    </Label>
                    <Input 
                      placeholder="Teclear CCT o Nombre del Plantel para autocompletar..." 
                      className="h-14 rounded-2xl bg-white border-primary/10 font-bold uppercase shadow-sm focus:ring-2 focus:ring-primary/20" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                  </div>
                  
                  {searchTerm && (
                    <div className="max-h-60 overflow-auto bg-white border border-primary/5 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 divide-y divide-slate-50">
                      {schoolsDirectory.filter(s => 
                        (s.nombre || '').toUpperCase().includes(searchTerm.toUpperCase()) || 
                        (s.cct || '').toUpperCase().includes(searchTerm.toUpperCase())
                      ).slice(0, 10).map(s => (
                        <div 
                          key={`${s.cct}-${s.turno}`} 
                          className="p-4 hover:bg-primary/5 cursor-pointer transition-colors flex justify-between items-center group" 
                          onClick={() => { handleSelectSchool(s.cct, s.turno); setSearchTerm('') }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                               <School className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-xs font-black text-slate-800">{s.nombre}</span>
                               <span className="text-[10px] font-mono text-muted-foreground">{s.cct} • {s.turno}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/10">{s.municipio}</Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {formData.cct && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 animate-in slide-in-from-top-4">
                      <div className="md:col-span-3 flex items-center gap-4 p-5 bg-white rounded-2xl border shadow-sm border-emerald-100">
                        <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                          <School className="h-7 w-7" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">CCT Identificado</p>
                          <h4 className="text-sm font-black text-slate-800 uppercase leading-none">{formData.schoolName}</h4>
                          <p className="text-[10px] font-mono text-muted-foreground mt-1">{formData.cct} • {formData.municipio} • {formData.region}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary pl-2">Folio Reporte / ID</Label>
                    <Input className="h-12 rounded-xl bg-slate-50 border-primary/10 font-black uppercase" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} placeholder="EJ: S-001" disabled={!!editingTicketId} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary pl-2">Tipo de Incidencia</Label>
                    <Select value={formData.tipoIncidencia} onValueChange={(val: any) => setFormData({...formData, tipoIncidencia: val})}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-primary/10 font-bold uppercase text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="red edusat" className="text-[11px] uppercase font-bold">Red Edusat</SelectItem>
                        <SelectItem value="red local" className="text-[11px] uppercase font-bold">Red Local</SelectItem>
                        <SelectItem value="instalación red local" className="text-[11px] uppercase font-bold">Instalación Red Local</SelectItem>
                        <SelectItem value="mantenimiento preventivo" className="text-[11px] uppercase font-bold">Mantenimiento Preventivo</SelectItem>
                        <SelectItem value="mantenimiento correctivo" className="text-[11px] uppercase font-bold">Mantenimiento Correctivo</SelectItem>
                        <SelectItem value="teleplanteles" className="text-[11px] uppercase font-bold">Teleplanteles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary pl-2">Oficina de Atención</Label>
                    <Select value={formData.oficinaRegionalAtencion} onValueChange={(val) => setFormData({...formData, oficinaRegionalAtencion: val})}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-primary/10 font-bold uppercase text-[11px]"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {REGIONAL_OFFICES.map(off => (
                          <SelectItem key={off} value={off} className="text-[11px] uppercase font-bold">{off.replace("Oficina de ", "")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary pl-2">Número de Oficio DESySA</Label>
                    <Input className="h-12 rounded-xl bg-slate-50 border-primary/10 font-mono uppercase" value={formData.numeroOficio} onChange={e => setFormData({...formData, numeroOficio: e.target.value})} placeholder="DESySA/PL/..." />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Ben. Alumnos</Label><Input type="number" className="h-12 rounded-xl text-center font-black" value={formData.alumnosBeneficiados} onChange={e => setFormData({...formData, alumnosBeneficiados: parseInt(e.target.value) || 0})} /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Ben. Docentes</Label><Input type="number" className="h-12 rounded-xl text-center font-black" value={formData.docentesBeneficiados} onChange={e => setFormData({...formData, docentesBeneficiados: parseInt(e.target.value) || 0})} /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Serv. M.C.</Label><Input type="number" className="h-12 rounded-xl text-center font-black" value={formData.serviciosMC} onChange={e => setFormData({...formData, serviciosMC: parseInt(e.target.value) || 0})} /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Serv. M.P.</Label><Input type="number" className="h-12 rounded-xl text-center font-black" value={formData.serviciosMP} onChange={e => setFormData({...formData, serviciosMP: parseInt(e.target.value) || 0})} /></div>
                </div>

                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <h3 className="text-[11px] font-black uppercase text-accent tracking-[0.2em] border-b border-accent/20 pb-2">Archivo Digital y Evidencias</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3 p-6 border border-dashed rounded-[2rem] bg-slate-50/50 hover:bg-white transition-colors duration-300">
                      <Label className="flex items-center gap-3 text-[10px] font-black uppercase text-primary">
                        <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                          <FileText className="h-4 w-4" />
                        </div>
                        Reporte Oficial (Formato PDF)
                      </Label>
                      <Input type="file" accept=".pdf" className="bg-white rounded-xl h-10" onChange={e => handleFileChange(e, 'pdf')} />
                      {formData.reportPdf && <p className="text-[9px] text-emerald-600 font-black flex items-center gap-1 mt-2">✓ ARCHIVO CONFIGURADO</p>}
                    </div>
                    <div className="space-y-3 p-6 border border-dashed rounded-[2rem] bg-slate-50/50 hover:bg-white transition-colors duration-300">
                      <Label className="flex items-center gap-3 text-[10px] font-black uppercase text-primary">
                        <div className="h-8 w-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center shadow-sm">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                        Evidencias de Sitio (Máx 5)
                      </Label>
                      <Input type="file" multiple accept="image/*" className="bg-white rounded-xl h-10" onChange={e => handleFileChange(e, 'photo')} disabled={(formData.evidencePhotos?.length || 0) >= 5} />
                      <div className="flex gap-3 flex-wrap mt-3">
                        {formData.evidencePhotos?.map((p, i) => (
                          <div key={i} className="relative h-14 w-14 border-4 border-white rounded-xl shadow-md overflow-hidden group">
                            <Image src={p} alt="ev" fill className="object-cover" />
                            <button className="absolute inset-0 bg-rose-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" onClick={() => setFormData(prev => ({ ...prev, evidencePhotos: prev.evidencePhotos?.filter((_, idx) => idx !== i) }))}>
                               <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-2">Observaciones Técnicas del Servicio</Label>
                  <Textarea className="min-h-[120px] rounded-[1.5rem] p-5 bg-slate-50 border-primary/10 focus:bg-white transition-all shadow-inner" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder="Detalle técnico, hallazgos y trabajos realizados en el plantel..." />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="p-8 border-t bg-slate-50/50">
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); setEditingTicketId(null); }} className="rounded-xl h-14 px-10 text-[10px] font-black uppercase">Cancelar</Button>
              <Button onClick={handleSave} className="btn-institutional h-14 px-16 text-[10px]">
                {editingTicketId ? "Actualizar Registro" : "Guardar Servicio Técnico"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="executive-card p-0 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-black text-[10px] uppercase w-[100px] text-center">Folio</TableHead>
              <TableHead className="font-black text-[10px] uppercase min-w-[200px]">CCT / Nombre del Plantel</TableHead>
              <TableHead className="font-black text-[10px] uppercase">Tipo de Servicio</TableHead>
              <TableHead className="font-black text-[10px] uppercase">Estatus Operativo</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-center">Evidencias</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase pr-8">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map(t => (
              <TableRow key={t.id} className="hover:bg-slate-50 transition-colors group">
                <TableCell className="font-black text-primary text-sm text-center">{t.id}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-700">{t.cct}</span>
                    <span className="text-[10px] text-muted-foreground font-bold truncate max-w-[250px] uppercase">{t.schoolName}</span>
                  </div>
                </TableCell>
                <TableCell className="capitalize text-[10px] font-black text-slate-500">
                  <Badge variant="outline" className="text-[9px] font-black border-primary/20 text-primary uppercase">
                    {t.tipoIncidencia}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select defaultValue={t.status} onValueChange={(val) => updateTicketStatus(t.id, val)}>
                    <SelectTrigger className={cn(
                      "h-8 w-40 text-[9px] font-black uppercase border-2 rounded-xl transition-all",
                      t.status === 'atendido' ? 'border-emerald-500/30 text-emerald-700 bg-emerald-50' : 
                      t.status === 'en proceso' ? 'border-amber-500/30 text-amber-700 bg-amber-50' : 
                      'border-rose-500/30 text-rose-700 bg-rose-50'
                    )}>
                      <div className="flex items-center gap-2">
                        <Circle className={cn("h-2 w-2 fill-current", 
                          t.status === 'atendido' ? 'text-emerald-500' : 
                          t.status === 'en proceso' ? 'text-amber-500' : 'text-rose-500'
                        )} />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="pendiente" className="text-[10px] font-black text-rose-600">PENDIENTE</SelectItem>
                      <SelectItem value="en proceso" className="text-[10px] font-black text-amber-600">EN PROCESO</SelectItem>
                      <SelectItem value="atendido" className="text-[10px] font-black text-emerald-600">ATENDIDO</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-3">
                    {t.reportPdf && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-lg shadow-sm" onClick={() => setEvidenceToView({ type: 'pdf', data: t.reportPdf!, title: `Folio ${t.id} - Reporte Técnico` })}>
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                    {t.evidencePhotos && t.evidencePhotos.length > 0 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-pink-600 hover:bg-pink-50 rounded-lg shadow-sm" onClick={() => setEvidenceToView({ type: 'gallery', data: t.evidencePhotos!, title: `Folio ${t.id} - Galería de Sitio` })}>
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right pr-8">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" onClick={() => handleEdit(t)}>
                     <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!evidenceToView} onOpenChange={() => setEvidenceToView(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem]">
          <DialogHeader className="p-8 pb-4 border-b bg-slate-50">
            <DialogTitle className="uppercase font-black text-primary text-xl flex items-center gap-4">
              {evidenceToView?.type === 'pdf' ? <FileText className="h-6 w-6 text-blue-600" /> : <ImageIcon className="h-6 w-6 text-pink-600" />}
              {evidenceToView?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-slate-100 relative">
             {evidenceToView?.type === 'pdf' ? (
                <iframe src={evidenceToView.data as string} className="w-full h-full border-none" />
             ) : (
                <ScrollArea className="h-full w-full p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {(evidenceToView?.data as string[])?.map((img, idx) => (
                      <div key={idx} className="relative aspect-video rounded-3xl overflow-hidden border-8 border-white shadow-2xl group cursor-zoom-in">
                        <Image src={img} alt={`Evidencia ${idx}`} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <Eye className="h-10 w-10 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
             )}
          </div>
          <div className="p-6 border-t bg-white flex justify-end">
            <Button variant="secondary" onClick={() => setEvidenceToView(null)} className="font-black uppercase text-[10px] h-12 px-8 rounded-xl shadow-lg">Cerrar Visor Operativo</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
