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
import { programsData, type ProgramStatus } from "@/lib/planning-data"
import { schoolsDirectory } from "@/lib/schools-directory"
import { PlusCircle, Briefcase, FileText, Image as ImageIcon, X, Circle, Search, Eye, Pencil, ExternalLink, School, Settings2, Zap } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import Image from 'next/image'
import { cn } from '@/lib/utils'

const PROGRAM_RUBROS = [
  'Biblioteca Digital',
  'Cuentas Institucionales (@desysa.gob.mx, @desysa.edu.mx, @coees.edu.mx)',
  'Geoposición',
  'Conoce mi Escuela',
  'Mesa de Ayuda Técnica'
];

export default function ProgramsPage() {
  const { toast } = useToast()
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [evidenceToView, setEvidenceToView] = useState<{ type: 'pdf' | 'gallery', data: string | string[], title: string } | null>(null)

  const initialFormState: ProgramStatus = {
    id: '',
    name: '',
    progress: 0,
    status: 'planeacion',
    date: format(new Date(), 'yyyy-MM-dd'),
    cct: '',
    schoolName: '',
    zonaEscolar: '',
    sector: '',
    modalidad: '',
    municipio: '',
    region: '',
    valle: '',
    numeroEquipos: 0,
    descripcionEquipo: '',
    fechaEntrada: format(new Date(), 'yyyy-MM-dd'),
    fechaSalida: '',
    serviciosMC: 0,
    serviciosMP: 0,
    responsables: ['', '', ''],
    numeroOficio: '',
    setes: 'N',
    observaciones: '',
    reportPdf: '',
    evidencePhotos: [],
  }

  const [formData, setFormData] = useState<ProgramStatus>(initialFormState)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('programs_full') || '[]')
    if (stored.length === 0) {
      setRecords([]) 
    } else {
      setRecords(stored)
    }
  }, [])

  // Auto-lookup al escribir CCT (10 caracteres)
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
      setFormData(prev => ({
        ...prev,
        cct: school.cct,
        schoolName: school.nombre,
        zonaEscolar: school.zonaEscolar,
        sector: school.sector,
        modalidad: school.modalidad,
        municipio: school.municipio,
        region: school.region,
        valle: school.valle
      }));
      toast({
        title: "Plantel Vinculado",
        description: `${school.nombre} cargado correctamente con ZE ${school.zonaEscolar} y Sector ${school.sector}.`,
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
        setFormData(prev => ({ ...prev, reportPdf: reader.result as string }))
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
    if (!formData.id || !formData.name || !formData.cct) {
      toast({ variant: "destructive", title: "Faltan datos", description: "Folio, Rubro y CCT son obligatorios." })
      return
    }

    let updated: ProgramStatus[];
    const cleanedResponsables = (formData.responsables || []).filter(r => r.trim() !== '');

    if (editingId) {
      updated = records.map(r => r.id === editingId ? { ...formData, responsables: cleanedResponsables } : r);
      toast({ title: "Registro de programa actualizado" });
    } else {
      updated = [{ ...formData, responsables: cleanedResponsables }, ...records];
      toast({ title: "Reporte de programa guardado" });
    }

    setRecords(updated)
    localStorage.setItem('programs_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    setFormData(initialFormState)
    setEditingId(null)
    setSearchTerm('')
  }

  const handleEdit = (record: ProgramStatus) => {
    setFormData({
      ...record,
      responsables: [...(record.responsables || []), '', '', ''].slice(0, 3),
    });
    setEditingId(record.id);
    setIsDialogOpen(true);
  }

  const updateStatus = (id: string, newStatus: any) => {
    const updated = records.map(r => r.id === id ? { ...r, status: newStatus, progress: newStatus === 'concluido' ? 100 : r.progress } : r);
    setRecords(updated);
    localStorage.setItem('programs_full', JSON.stringify(updated));
    toast({ title: `Estatus: ${newStatus.toUpperCase()}` });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase">Gestión de Programas Institucionales</h2>
          <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Oficina de Planeación • Control de Rubros Estratégicos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setFormData(initialFormState);
            setEditingId(null);
            setSearchTerm('');
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-black uppercase shadow-lg"><PlusCircle className="h-4 w-4" /> Nuevo Reporte de Rubro</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] h-[95vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="uppercase font-black text-primary text-xl flex items-center gap-2">
                <Settings2 className="h-6 w-6" /> 
                {editingId ? `Editar Reporte: ${editingId}` : "Ficha Técnica de Programa"}
              </DialogTitle>
              <DialogDescription className="font-bold text-xs">Gestión técnica y administrativa de rubros transversales.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 px-6">
              <div className="grid gap-8 py-4 pb-10">
                {/* Rubro y Folio */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-primary">Folio de Registro</Label>
                    <Input 
                      value={formData.id} 
                      onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} 
                      placeholder="EJ: P-001" 
                      className="font-black border-primary/20"
                      disabled={!!editingId}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-xs font-black uppercase text-primary">Seleccionar Rubro Estratégico</Label>
                    <Select value={formData.name} onValueChange={(val) => setFormData({...formData, name: val})}>
                      <SelectTrigger className="font-bold"><SelectValue placeholder="Seleccione el rubro..." /></SelectTrigger>
                      <SelectContent>
                        {PROGRAM_RUBROS.map(r => (
                          <SelectItem key={r} value={r} className="text-xs font-bold">{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Buscador de Plantel (CCT y Datos Geográficos) */}
                <div className="p-4 bg-slate-50 rounded-xl space-y-4 border border-primary/10 shadow-sm">
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-black uppercase flex items-center gap-2 text-primary">
                      <Search className="h-4 w-4" /> 1. Información del Centro de Trabajo (C.T.)
                    </Label>
                    <div className="relative">
                      <Input 
                        placeholder="Escribir CCT o Nombre del Plantel para autocompletar..." 
                        className="bg-white font-mono uppercase font-bold h-11" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        maxLength={50}
                      />
                      {searchTerm && searchTerm.length > 2 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-xl max-h-60 overflow-auto">
                          {schoolsDirectory
                            .filter(s => s.cct.toUpperCase().includes(searchTerm.toUpperCase()) || s.nombre.toUpperCase().includes(searchTerm.toUpperCase()))
                            .slice(0, 10)
                            .map(s => (
                              <div 
                                key={s.cct} 
                                className="p-3 hover:bg-primary/5 cursor-pointer text-xs border-b last:border-0 flex justify-between items-center"
                                onClick={() => { handleSelectSchool(s.cct); setSearchTerm('') }}
                              >
                                <div>
                                  <span className="font-black text-primary">{s.cct}</span> - {s.nombre}
                                </div>
                                <Badge variant="outline" className="text-[9px] uppercase">{s.municipio}</Badge>
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {formData.cct && (
                    <div className="grid grid-cols-1 gap-4 animate-in fade-in zoom-in-95 duration-300">
                      <div className="flex items-center gap-4 p-3 bg-white rounded-lg border shadow-sm">
                        <div className="h-12 w-12 bg-primary/10 rounded-md flex items-center justify-center">
                          <School className="h-7 w-7 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-primary uppercase leading-none mb-1">Nombre del Centro de Trabajo</p>
                          <p className="text-sm font-black uppercase truncate">{formData.schoolName}</p>
                          <div className="flex gap-4 mt-1">
                             <span className="text-[10px] font-mono font-bold text-muted-foreground">CCT: {formData.cct}</span>
                             <span className="text-[10px] font-bold text-muted-foreground uppercase">ZE: {formData.zonaEscolar}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground">Sector</Label>
                          <Input value={formData.sector} readOnly className="h-8 text-xs font-bold bg-white text-center" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground">Modalidad</Label>
                          <Input value={formData.modalidad} readOnly className="h-8 text-xs font-bold bg-white text-center uppercase" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground">Municipio</Label>
                          <Input value={formData.municipio} readOnly className="h-8 text-xs font-bold bg-white text-center uppercase" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground">Región</Label>
                          <Input value={formData.region} readOnly className="h-8 text-xs font-bold bg-white text-center uppercase" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground">Valle</Label>
                          <Input value={formData.valle} readOnly className="h-8 text-xs font-bold bg-white text-center uppercase" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Control de Equipos y Servicios */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase text-primary border-b pb-1 flex items-center gap-2">
                    <Zap className="h-4 w-4" /> 2. Control de Equipos y Servicios
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                           <Label className="text-[10px] font-bold uppercase">No. de Equipos</Label>
                           <Input type="number" value={formData.numeroEquipos} onChange={e => setFormData({...formData, numeroEquipos: parseInt(e.target.value) || 0})} />
                         </div>
                         <div className="space-y-1">
                           <Label className="text-[10px] font-bold uppercase">No. de Oficio</Label>
                           <Input placeholder="EJ: OF-123/2024" value={formData.numeroOficio} onChange={e => setFormData({...formData, numeroOficio: e.target.value})} />
                         </div>
                      </div>
                      <div className="space-y-1">
                         <Label className="text-[10px] font-bold uppercase">Descripción del Equipo</Label>
                         <Input placeholder="Especificaciones técnicas..." value={formData.descripcionEquipo} onChange={e => setFormData({...formData, descripcionEquipo: e.target.value})} />
                      </div>
                    </div>
                    
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col justify-center">
                       <Label className="text-[10px] font-black uppercase text-blue-700 mb-3 text-center">Intervenciones Técnicas</Label>
                       <div className="grid grid-cols-2 gap-4">
                         <div className="text-center">
                           <Label className="text-[9px] font-bold uppercase text-slate-500">M.C.</Label>
                           <Input type="number" className="h-10 text-lg font-black text-center" value={formData.serviciosMC} onChange={e => setFormData({...formData, serviciosMC: parseInt(e.target.value) || 0})} />
                         </div>
                         <div className="text-center">
                           <Label className="text-[9px] font-bold uppercase text-slate-500">M.P.</Label>
                           <Input type="number" className="h-10 text-lg font-black text-center" value={formData.serviciosMP} onChange={e => setFormData({...formData, serviciosMP: parseInt(e.target.value) || 0})} />
                         </div>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase">Fecha Entrada</Label>
                      <Input type="date" value={formData.fechaEntrada} onChange={e => setFormData({...formData, fechaEntrada: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase">Fecha Salida</Label>
                      <Input type="date" value={formData.fechaSalida} onChange={e => setFormData({...formData, fechaSalida: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                       <Label className="text-[10px] font-bold uppercase">SETES (S/N)</Label>
                       <Select value={formData.setes} onValueChange={(val: any) => setFormData({...formData, setes: val})}>
                         <SelectTrigger className="font-bold"><SelectValue /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="S">SÍ (Atención SETES)</SelectItem>
                           <SelectItem value="N">NO (Regular)</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-1">
                       <Label className="text-[10px] font-bold uppercase text-primary">Avance (%)</Label>
                       <Input type="number" value={formData.progress} onChange={e => setFormData({...formData, progress: Math.min(100, parseInt(e.target.value) || 0)})} className="font-black" />
                    </div>
                  </div>
                </div>

                {/* Evidencias */}
                <div className="space-y-4">
                   <h3 className="text-xs font-black uppercase text-primary border-b pb-1">3. Gestión de Evidencias Digitales</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 p-4 border border-dashed rounded-xl bg-slate-50">
                        <Label className="flex items-center gap-2 text-xs font-black uppercase"><FileText className="h-4 w-4 text-blue-600" /> Reporte Oficial (PDF)</Label>
                        <Input type="file" accept=".pdf" className="bg-white" onChange={e => handleFileChange(e, 'pdf')} />
                        {formData.reportPdf && <p className="text-[10px] text-emerald-600 font-bold">✓ PDF Cargado</p>}
                      </div>
                      <div className="space-y-2 p-4 border border-dashed rounded-xl bg-slate-50">
                        <Label className="flex items-center gap-2 text-xs font-black uppercase"><ImageIcon className="h-4 w-4 text-pink-600" /> Evidencia en Fotos (MÁX 5)</Label>
                        <Input type="file" multiple accept="image/*" className="bg-white" onChange={e => handleFileChange(e, 'photo')} disabled={(formData.evidencePhotos?.length || 0) >= 5} />
                        <div className="flex gap-2 flex-wrap mt-2">
                          {formData.evidencePhotos?.map((p, i) => (
                            <div key={i} className="relative h-12 w-12 border-2 border-white rounded shadow-sm overflow-hidden group">
                              <Image src={p} alt="ev" fill className="object-cover" />
                              <button className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white" onClick={() => setFormData(prev => ({ ...prev, evidencePhotos: prev.evidencePhotos?.filter((_, idx) => idx !== i) }))}>
                                 <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-black uppercase text-primary">Observaciones Operativas</Label>
                  <Textarea className="min-h-[100px] text-xs" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder="Detalle adicional del cumplimiento del rubro..." />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="p-6 border-t bg-slate-50">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="font-bold uppercase text-xs">Cancelar</Button>
              <Button onClick={handleSave} className="font-black uppercase text-xs px-10 shadow-md">
                {editingId ? "Actualizar Rubro" : "Guardar Ficha Técnica"}
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
                <TableHead className="font-black text-[10px] uppercase w-[100px]">Folio</TableHead>
                <TableHead className="font-black text-[10px] uppercase">Rubro del Programa</TableHead>
                <TableHead className="font-black text-[10px] uppercase">CCT / Plantel</TableHead>
                <TableHead className="font-black text-[10px] uppercase">Estatus / Avance</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-center">Evidencias</TableHead>
                <TableHead className="text-right font-black text-[10px] uppercase">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map(r => (
                <TableRow key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-black text-primary text-sm">{r.id}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <span className="text-[11px] font-black text-slate-700 uppercase leading-tight line-clamp-2">
                      {r.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-700">{r.cct}</span>
                      <span className="text-[10px] text-muted-foreground font-bold truncate max-w-[180px]">{r.schoolName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1.5">
                       <Select defaultValue={r.status} onValueChange={(val) => updateStatus(r.id, val)}>
                          <SelectTrigger className={cn(
                            "h-7 w-32 text-[9px] font-black uppercase border-2",
                            r.status === 'concluido' ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : 
                            r.status === 'activo' ? 'border-blue-500 text-blue-700 bg-blue-50' : 
                            'border-slate-300 text-slate-600 bg-slate-50'
                          )}>
                            <div className="flex items-center gap-1.5">
                               <Circle className={cn("h-1.5 w-1.5 fill-current", 
                                  r.status === 'concluido' ? 'text-emerald-500' : 
                                  r.status === 'activo' ? 'text-blue-500' : 'text-slate-400'
                               )} />
                               <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planeacion" className="text-[10px] font-bold">PLANEACIÓN</SelectItem>
                            <SelectItem value="activo" className="text-[10px] font-bold text-blue-600">ACTIVO</SelectItem>
                            <SelectItem value="concluido" className="text-[10px] font-bold text-emerald-600">CONCLUIDO</SelectItem>
                          </SelectContent>
                       </Select>
                       <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-primary" style={{ width: `${r.progress}%` }} />
                          </div>
                          <span className="text-[9px] font-black">{r.progress}%</span>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      {r.reportPdf && (
                        <Button variant="outline" size="icon" className="h-7 w-7 border-blue-200" onClick={() => setEvidenceToView({ type: 'pdf', data: r.reportPdf!, title: `${r.name} - ${r.cct}` })}>
                          <FileText className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                      {r.evidencePhotos && r.evidencePhotos.length > 0 && (
                        <Button variant="outline" size="icon" className="h-7 w-7 border-pink-200" onClick={() => setEvidenceToView({ type: 'gallery', data: r.evidencePhotos!, title: `${r.name} - ${r.cct}` })}>
                          <ImageIcon className="h-4 w-4 text-pink-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => handleEdit(r)}>
                       <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 bg-slate-50/30">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <Briefcase className="h-10 w-10 text-primary" />
                      <p className="font-bold text-sm uppercase">Sin reportes de programas registrados.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Visor de Evidencias */}
      <Dialog open={!!evidenceToView} onOpenChange={() => setEvidenceToView(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2 border-b bg-slate-50">
            <DialogTitle className="uppercase font-black text-primary flex items-center gap-2">
              {evidenceToView?.type === 'pdf' ? <FileText className="h-5 w-5 text-blue-600" /> : <ImageIcon className="h-5 w-5 text-pink-600" />}
              {evidenceToView?.title}
              <ExternalLink className="h-3 w-3 text-muted-foreground ml-2" />
            </DialogTitle>
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
