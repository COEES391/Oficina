
'use client'
import { useState, useEffect, useMemo } from 'react'
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
import { Progress } from "@/components/ui/progress"
import { programsData, type ProgramStatus } from "@/lib/planning-data"
import { schoolsDirectory } from "@/lib/schools-directory"
import { 
  PlusCircle, 
  Briefcase, 
  FileText, 
  Image as ImageIcon, 
  X, 
  Circle, 
  Search, 
  Eye, 
  Pencil, 
  ExternalLink, 
  School, 
  Settings2, 
  Zap,
  Calendar,
  ChevronRight,
  MonitorCheck,
  History
} from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import Image from 'next/image'
import { cn } from '@/lib/utils'

const TOTAL_UNIVERSE = 830; 

const PROGRAM_RUBROS = [
  'Biblioteca Digital',
  'Cuentas Institucionales (@desysa.gob.mx, @desysa.edu.mx, @coees.edu.mx)',
  'Geoposición',
  'Conoce mi Escuela',
  'Mesa de Ayuda Técnica'
];

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
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
    date: '',
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
    fechaEntrada: '',
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
    setMounted(true)
    const stored = JSON.parse(localStorage.getItem('programs_full') || '[]')
    setRecords(stored)
    
    setFormData(prev => ({ 
      ...prev, 
      date: format(new Date(), 'yyyy-MM-dd'),
      fechaEntrada: format(new Date(), 'yyyy-MM-dd')
    }))
  }, [])

  const rubroStats = useMemo(() => {
    return PROGRAM_RUBROS.map(name => {
      const rubroRecords = records.filter(r => r.name === name);
      const uniqueSchools = new Set(rubroRecords.map(r => r.cct)).size;
      const progress = Math.min(100, Math.round((uniqueSchools / TOTAL_UNIVERSE) * 100));
      const lastUpdate = rubroRecords.length > 0 
        ? rubroRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date 
        : format(new Date(), 'yyyy-MM-dd');
      
      let status: 'planeacion' | 'activo' | 'concluido' = 'planeacion';
      if (progress > 0) status = 'activo';
      if (progress >= 100) status = 'concluido';

      const totalEquiposRehabilitados = rubroRecords.reduce((acc, curr) => acc + (curr.numeroEquipos || 0), 0);

      return { name, progress, status, lastUpdate, count: uniqueSchools, totalEquipos: totalEquiposRehabilitados, records: rubroRecords };
    });
  }, [records]);

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
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'photo') => {
    const files = e.target.files
    if (!files) return
    if (type === 'pdf') {
      const file = files[0]
      const reader = new FileReader()
      reader.onloadend = () => setFormData(prev => ({ ...prev, reportPdf: reader.result as string }))
      reader.readAsDataURL(file)
    } else {
      const newPhotos = Array.from(files)
      newPhotos.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => setFormData(prev => ({
          ...prev,
          evidencePhotos: [...(prev.evidencePhotos || []), reader.result as string]
        }))
        reader.readAsDataURL(file)
      })
    }
  }

  const handleSave = () => {
    if (!formData.id || !formData.name || !formData.cct) {
      toast({ variant: "destructive", title: "Faltan datos", description: "Folio, Rubro y CCT son obligatorios." })
      return
    }
    const updated = editingId 
      ? records.map(r => r.id === editingId ? formData : r)
      : [formData, ...records];
    
    setRecords(updated)
    localStorage.setItem('programs_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    resetForm()
    toast({ title: "Registro exitoso", description: "La intervención ha sido guardada." })
  }

  const resetForm = () => {
    setFormData({
      ...initialFormState,
      date: format(new Date(), 'yyyy-MM-dd'),
      fechaEntrada: format(new Date(), 'yyyy-MM-dd')
    })
    setEditingId(null)
  }

  if (!mounted) return null

  return (
    <div className="space-y-8 pb-20">
      <div className="space-y-1">
        <h2 className="text-4xl font-black tracking-tighter text-primary uppercase">Gestión de Programas Institucionales</h2>
        <p className="text-muted-foreground font-bold text-sm uppercase tracking-[0.2em]">Seguimiento Transversal de Rubros Estratégicos</p>
      </div>

      <div className="grid gap-6">
        {rubroStats.map((rubro) => (
          <Card key={rubro.name} className="overflow-hidden border-2 border-primary/10 shadow-lg hover:border-primary/30 transition-all group bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5">
                  <div className="h-14 w-14 rounded-xl bg-primary/5 flex items-center justify-center border-2 border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
                    {rubro.name === 'Biblioteca Digital' ? <MonitorCheck className="h-7 w-7" /> : <Briefcase className="h-7 w-7" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-black uppercase tracking-tight">{rubro.name}</h3>
                      <Badge variant={rubro.status === 'concluido' ? 'default' : 'outline'} className="uppercase font-black text-[9px] px-2 h-5">
                        {rubro.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground">
                       <span className="text-[10px] font-bold uppercase flex items-center gap-1.5">
                         <Calendar className="h-3 w-3" /> Actualizado: {rubro.lastUpdate}
                       </span>
                       <span className="text-[10px] font-bold uppercase text-primary">
                         Escuelas Atendidas: {rubro.count} {rubro.name !== 'Biblioteca Digital' && `/ ${TOTAL_UNIVERSE}`}
                       </span>
                       {rubro.name === 'Biblioteca Digital' && (
                         <span className="text-[10px] font-black uppercase text-emerald-600 flex items-center gap-1.5">
                           <MonitorCheck className="h-3 w-3" /> Equipos Rehabilitados: {rubro.totalEquipos}
                         </span>
                       )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                   <div className="flex items-center gap-3">
                      {rubro.name !== 'Biblioteca Digital' && (
                        <div className="text-right">
                          <p className="text-[10px] font-black text-muted-foreground uppercase leading-none">Avance</p>
                          <p className="text-2xl font-black text-primary leading-none">{rubro.progress}%</p>
                        </div>
                      )}
                      <Button 
                        onClick={() => {
                          resetForm();
                          setFormData(prev => ({ ...prev, name: rubro.name }));
                          setIsDialogOpen(true);
                        }}
                        className="bg-primary hover:bg-primary/90 font-black uppercase text-xs h-11 px-6 shadow-lg shadow-primary/20 gap-2"
                      >
                        <Zap className="h-4 w-4 fill-current" /> Gestionar Rubro
                      </Button>
                   </div>
                </div>
              </div>

              {rubro.name === 'Biblioteca Digital' ? (
                <div className="mt-6 border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[11px] font-black uppercase text-slate-500 flex items-center gap-2">
                       <History className="h-3.5 w-3.5" /> Detalle de Atención por Modalidad
                    </h4>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] font-black uppercase">Enfoque Operativo</Badge>
                  </div>
                  <div className="rounded-xl border bg-slate-50/50 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-100">
                        <TableRow>
                          <TableHead className="text-[9px] font-black uppercase">Modalidad</TableHead>
                          <TableHead className="text-[9px] font-black uppercase">CCT Atendido</TableHead>
                          <TableHead className="text-[9px] font-black uppercase text-center">Sector</TableHead>
                          <TableHead className="text-[9px] font-black uppercase text-center">Zona (ZE)</TableHead>
                          <TableHead className="text-[9px] font-black uppercase text-center">Estatus</TableHead>
                          <TableHead className="text-[9px] font-black uppercase text-right">Equipos Rehab.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rubro.records.length > 0 ? rubro.records.map((rec, idx) => (
                          <TableRow key={idx} className="hover:bg-white transition-colors">
                            <TableCell className="text-[10px] font-bold text-primary uppercase">{rec.modalidad}</TableCell>
                            <TableCell className="text-[10px] font-mono font-black">{rec.cct}</TableCell>
                            <TableCell className="text-[10px] font-bold text-center">{rec.sector}</TableCell>
                            <TableCell className="text-[10px] font-bold text-center">{rec.zonaEscolar}</TableCell>
                            <TableCell className="text-center">
                               <div className="flex justify-center">
                                  <Circle className={cn("h-3 w-3 fill-current", 
                                    rec.status === 'concluido' ? 'text-emerald-500' : 
                                    rec.status === 'activo' ? 'text-amber-500' : 'text-rose-500'
                                  )} />
                               </div>
                            </TableCell>
                            <TableCell className="text-[10px] font-black text-right text-emerald-600">
                               <div className="flex items-center justify-end gap-1.5">
                                 {rec.numeroEquipos} <MonitorCheck className="h-3 w-3" />
                               </div>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-[9px] font-bold text-muted-foreground uppercase">
                              Sin registros de atención técnica disponibles.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="mt-6 space-y-2">
                  <Progress value={rubro.progress} className="h-2.5 bg-slate-100" />
                  <div className="flex justify-between text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                    <span>0% Inicio</span>
                    <span>50% Proceso</span>
                    <span>100% Meta</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-t-4 border-t-primary shadow-xl">
        <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between py-4">
           <div>
             <CardTitle className="text-lg font-black uppercase text-primary flex items-center gap-2">
               <FileText className="h-5 w-5" /> Historial Operativo de Programas
             </CardTitle>
             <CardDescription className="text-[10px] font-bold uppercase">Auditoría de intervenciones por centro de trabajo</CardDescription>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100/50">
              <TableRow>
                <TableHead className="text-[10px] font-black uppercase">Folio / Fecha</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Rubro</TableHead>
                <TableHead className="text-[10px] font-black uppercase">CCT / Plantel</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Intervención</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">Evidencias</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length > 0 ? records.map(r => (
                <TableRow key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-black text-primary text-xs">{r.id}</span>
                      <span className="text-[9px] font-bold text-muted-foreground">{r.date}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <span className="text-[10px] font-black text-slate-700 uppercase leading-tight line-clamp-1">{r.name}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-700">{r.cct}</span>
                      <span className="text-[9px] text-muted-foreground font-bold truncate max-w-[150px]">{r.schoolName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-[8px] font-black border-blue-200 text-blue-700 bg-blue-50">MC: {r.serviciosMC}</Badge>
                      <Badge variant="outline" className="text-[8px] font-black border-emerald-200 text-emerald-700 bg-emerald-50">MP: {r.serviciosMP}</Badge>
                      {r.numeroEquipos > 0 && <Badge variant="outline" className="text-[8px] font-black border-purple-200 text-purple-700 bg-purple-50">EQ: {r.numeroEquipos}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1.5">
                      {r.reportPdf && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => setEvidenceToView({ type: 'pdf', data: r.reportPdf!, title: r.name })}>
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      {r.evidencePhotos && r.evidencePhotos.length > 0 && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-pink-600" onClick={() => setEvidenceToView({ type: 'gallery', data: r.evidencePhotos!, title: r.name })}>
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setFormData(r); setEditingId(r.id); setIsDialogOpen(true); }}>
                       <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 opacity-40">
                    <p className="text-[10px] font-black uppercase">Sin registros en este rubro</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[900px] h-[95vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2 bg-slate-50 border-b">
            <DialogTitle className="uppercase font-black text-primary text-xl flex items-center gap-3">
              <Settings2 className="h-6 w-6" /> Ficha Técnica de Programa: {formData.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 px-6">
            <div className="grid gap-8 py-6 pb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-primary">Folio de Registro</Label>
                  <Input value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} placeholder="P-001" className="font-black" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-primary">Rubro del Programa</Label>
                  <Select value={formData.name} onValueChange={v => setFormData({...formData, name: v})}>
                    <SelectTrigger className="font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>{PROGRAM_RUBROS.map(r => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-5 bg-primary/5 rounded-2xl space-y-4 border border-primary/10">
                <Label className="text-xs font-black uppercase flex items-center gap-2 text-primary">
                  <Search className="h-4 w-4" /> Localización del Centro de Trabajo
                </Label>
                <div className="relative">
                  <Input 
                    placeholder="Escribe CCT o Nombre para autocompletar..." 
                    className="bg-white h-11 font-mono uppercase font-black" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                  />
                  {searchTerm.length > 2 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-xl shadow-2xl max-h-60 overflow-auto">
                      {schoolsDirectory.filter(s => s.cct.includes(searchTerm.toUpperCase()) || s.nombre.includes(searchTerm.toUpperCase())).slice(0, 10).map(s => (
                        <div key={s.cct} className="p-3 hover:bg-primary/5 cursor-pointer text-xs border-b last:border-0 flex justify-between items-center font-bold" onClick={() => { handleSelectSchool(s.cct); setSearchTerm('') }}>
                          <span><span className="text-primary font-black">{s.cct}</span> - {s.nombre}</span>
                          <Badge variant="outline" className="text-[8px]">{s.valle}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {formData.cct && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
                    <div className="col-span-2 md:col-span-3 p-3 bg-white rounded-xl border flex items-center gap-3">
                       <School className="h-5 w-5 text-primary" />
                       <div className="flex-1 overflow-hidden">
                          <p className="text-[9px] font-black text-muted-foreground uppercase leading-none">Nombre CT</p>
                          <p className="text-xs font-black truncate uppercase">{formData.schoolName}</p>
                       </div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border">
                        <p className="text-[9px] font-black text-muted-foreground uppercase leading-none">Z.E.</p>
                        <p className="text-xs font-black">{formData.zonaEscolar}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border">
                        <p className="text-[9px] font-black text-muted-foreground uppercase leading-none">Sector</p>
                        <p className="text-xs font-black">{formData.sector}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border">
                        <p className="text-[9px] font-black text-muted-foreground uppercase leading-none">Municipio</p>
                        <p className="text-xs font-black truncate uppercase">{formData.municipio}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border">
                        <p className="text-[9px] font-black text-muted-foreground uppercase leading-none">Modalidad</p>
                        <p className="text-xs font-black truncate uppercase">{formData.modalidad}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border">
                        <p className="text-[9px] font-black text-muted-foreground uppercase leading-none">Valle</p>
                        <p className="text-xs font-black uppercase">{formData.valle}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-primary border-b pb-1 flex items-center gap-2"><Zap className="h-4 w-4" /> Control Técnico y de Servicios</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   <div className="space-y-1"><Label className="text-[10px] font-black uppercase">No. Equipos</Label><Input type="number" value={formData.numeroEquipos} onChange={e => setFormData({...formData, numeroEquipos: parseInt(e.target.value) || 0})} /></div>
                   <div className="col-span-3 space-y-1"><Label className="text-[10px] font-black uppercase">Descripción del Equipo</Label><Input value={formData.descripcionEquipo} onChange={e => setFormData({...formData, descripcionEquipo: e.target.value})} placeholder="Ej: Laptops, Servidores, etc." /></div>
                   <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Servicios M.C.</Label><Input type="number" className="font-black text-blue-600" value={formData.serviciosMC} onChange={e => setFormData({...formData, serviciosMC: parseInt(e.target.value) || 0})} /></div>
                   <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Servicios M.P.</Label><Input type="number" className="font-black text-emerald-600" value={formData.serviciosMP} onChange={e => setFormData({...formData, serviciosMP: parseInt(e.target.value) || 0})} /></div>
                   <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Fecha Entrada</Label><Input type="date" value={formData.fechaEntrada} onChange={e => setFormData({...formData, fechaEntrada: e.target.value})} /></div>
                   <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Fecha Salida</Label><Input type="date" value={formData.fechaSalida} onChange={e => setFormData({...formData, fechaSalida: e.target.value})} /></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase">No. de Oficio</Label><Input value={formData.numeroOficio} onChange={e => setFormData({...formData, numeroOficio: e.target.value})} /></div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase">Atención SETES (S/N)</Label>
                  <Select value={formData.setes} onValueChange={v => setFormData({...formData, setes: v as any})}>
                    <SelectTrigger className="font-black"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="S">SÍ</SelectItem><SelectItem value="N">NO</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase">Estatus Intervención</Label>
                  <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v as any})}>
                    <SelectTrigger className="font-black"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planeacion">Planeación</SelectItem>
                      <SelectItem value="activo">En Proceso</SelectItem>
                      <SelectItem value="concluido">Concluido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-xs font-black uppercase text-primary">Gestión de Evidencias Digitales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border-2 border-dashed rounded-2xl bg-slate-50 space-y-2">
                    <Label className="text-[10px] font-black uppercase flex items-center gap-2"><FileText className="h-4 w-4 text-blue-600" /> Reporte PDF</Label>
                    <Input type="file" accept=".pdf" className="bg-white" onChange={e => handleFileChange(e, 'pdf')} />
                  </div>
                  <div className="p-4 border-2 border-dashed rounded-2xl bg-slate-50 space-y-2">
                    <Label className="text-[10px] font-black uppercase flex items-center gap-2"><ImageIcon className="h-4 w-4 text-pink-600" /> Fotos (Máx 5)</Label>
                    <Input type="file" multiple accept="image/*" className="bg-white" onChange={e => handleFileChange(e, 'photo')} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-primary">Observaciones Operativas</Label>
                <Textarea className="min-h-[120px] rounded-xl" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 border-t bg-slate-50">
             <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="font-black uppercase text-xs">Cancelar</Button>
             <Button onClick={handleSave} className="font-black uppercase text-xs px-12 shadow-lg">Guardar Registro Técnico</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!evidenceToView} onOpenChange={() => setEvidenceToView(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-slate-50 border-b">
            <DialogTitle className="uppercase font-black text-primary flex items-center gap-2">
              {evidenceToView?.title} <ExternalLink className="h-4 w-4" />
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 bg-slate-100 p-4">
             {evidenceToView?.type === 'pdf' ? (
                <iframe src={evidenceToView.data as string} className="w-full h-full border-none rounded-xl shadow-inner" title="PDF Viewer" />
             ) : (
                <div className="grid grid-cols-2 gap-4">
                   {(evidenceToView?.data as string[])?.map((img, i) => (
                      <div key={i} className="relative aspect-video rounded-xl overflow-hidden border-4 border-white shadow-lg">
                        <Image src={img} alt="ev" fill className="object-cover" />
                      </div>
                   ))}
                </div>
             )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
