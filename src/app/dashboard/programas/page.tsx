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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { programsData, type ProgramStatus, type ProgramAssistant } from "@/lib/planning-data"
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
  MonitorCheck,
  History,
  Users,
  Trash2,
  Plus,
  Layers
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

const FUNCIONES = [
  "ADMINISTRATIVO",
  "DOCENTE",
  "DIRECTIVO",
  "JEFE DE ENSEÑANZA",
  "SUPERVISOR",
  "ASESOR TECNICO PEDAGOGICO"
]

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [activeTab, setActiveTab] = useState(PROGRAM_RUBROS[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [evidenceToView, setEvidenceToView] = useState<{ type: 'pdf' | 'gallery', data: string | string[], title: string } | null>(null)

  const initialAssistant: ProgramAssistant = {
    paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: ''
  };

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
    capacitacion: 'N',
    totalParticipantes: 0,
    asistentes: [initialAssistant]
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

  const filteredHistory = useMemo(() => {
    return records.filter(r => r.name === activeTab);
  }, [records, activeTab]);

  const currentStats = useMemo(() => {
    return rubroStats.find(s => s.name === activeTab);
  }, [rubroStats, activeTab]);

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

  const handleAddAssistant = () => {
    setFormData(prev => ({
      ...prev,
      asistentes: [...(prev.asistentes || []), initialAssistant]
    }))
  }

  const handleRemoveAssistant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      asistentes: prev.asistentes?.filter((_, i) => i !== index)
    }))
  }

  const updateAssistant = (index: number, field: keyof ProgramAssistant, value: string) => {
    const newAsistentes = [...(formData.asistentes || [])]
    newAsistentes[index] = { ...newAsistentes[index], [field]: value }

    if (field === 'cct' && value.length === 10) {
      const school = schoolsDirectory.find(s => s.cct.toUpperCase() === value.toUpperCase())
      if (school) {
        newAsistentes[index] = {
          ...newAsistentes[index],
          nombreCT: school.nombre,
          ze: school.zonaEscolar,
          sector: school.sector,
          modalidad: school.modalidad,
          municipio: school.municipio,
          region: school.region,
          valle: school.valle
        }
      }
    }
    setFormData(prev => ({ ...prev, asistentes: newAsistentes, totalParticipantes: newAsistentes.filter(a => a.rfc).length }))
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
      name: activeTab,
      date: format(new Date(), 'yyyy-MM-dd'),
      fechaEntrada: format(new Date(), 'yyyy-MM-dd')
    })
    setEditingId(null)
  }

  if (!mounted) return null

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter text-primary uppercase">Gestión de Programas Institucionales</h2>
          <p className="text-muted-foreground font-bold text-sm uppercase tracking-[0.2em]">Seguimiento Transversal de Rubros Estratégicos</p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="bg-primary hover:bg-primary/90 font-black uppercase text-xs h-11 px-6 shadow-lg shadow-primary/20 gap-2"
        >
          <PlusCircle className="h-5 w-5" /> Nueva Intervención
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="w-full h-auto flex flex-wrap bg-slate-100 p-1 rounded-xl shadow-inner">
          {PROGRAM_RUBROS.map(rubro => (
            <TabsTrigger 
              key={rubro} 
              value={rubro}
              className="flex-1 min-w-[200px] h-12 text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md transition-all"
            >
              {rubro.includes('(') ? rubro.split('(')[0] : rubro}
            </TabsTrigger>
          ))}
        </TabsList>

        {currentStats && (
          <TabsContent value={activeTab} className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <Card className="overflow-hidden border-2 border-primary/10 shadow-lg bg-white">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-2xl bg-primary/5 flex items-center justify-center border-2 border-primary/10 shadow-inner">
                      {activeTab === 'Biblioteca Digital' ? <MonitorCheck className="h-10 w-10 text-primary" /> : <Layers className="h-10 w-10 text-primary" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-3xl font-black uppercase tracking-tight text-slate-800">{activeTab}</h3>
                        <Badge variant={currentStats.status === 'concluido' ? 'default' : 'outline'} className="uppercase font-black text-[10px] px-3 h-6">
                          {currentStats.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-6 text-muted-foreground pt-2">
                         <span className="text-xs font-bold uppercase flex items-center gap-2">
                           <Calendar className="h-4 w-4 text-primary" /> Última Actualización: {currentStats.lastUpdate}
                         </span>
                         <span className="text-xs font-bold uppercase flex items-center gap-2">
                           <School className="h-4 w-4 text-primary" /> Planteles Atendidos: <span className="text-primary font-black">{currentStats.count}</span> {activeTab !== 'Biblioteca Digital' && `/ ${TOTAL_UNIVERSE}`}
                         </span>
                         {activeTab === 'Biblioteca Digital' && (
                           <span className="text-xs font-black uppercase text-emerald-600 flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                             <MonitorCheck className="h-4 w-4" /> Equipos Rehabilitados: {currentStats.totalEquipos}
                           </span>
                         )}
                      </div>
                    </div>
                  </div>

                  {activeTab !== 'Biblioteca Digital' && (
                    <div className="text-right bg-slate-50 p-6 rounded-2xl border min-w-[180px]">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Avance Global</p>
                      <p className="text-5xl font-black text-primary leading-none">{currentStats.progress}%</p>
                    </div>
                  )}
                </div>

                {activeTab === 'Biblioteca Digital' ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black uppercase text-slate-500 flex items-center gap-2 tracking-widest">
                         <History className="h-4 w-4" /> Detalle Operativo por Modalidad
                      </h4>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] font-black uppercase px-4 py-1.5 shadow-sm">Vista de Rendición de Cuentas</Badge>
                    </div>
                    <div className="rounded-2xl border bg-slate-50/50 overflow-hidden shadow-sm">
                      <Table>
                        <TableHeader className="bg-slate-100/80">
                          <TableRow>
                            <TableHead className="text-[10px] font-black uppercase py-4 pl-6">Modalidad</TableHead>
                            <TableHead className="text-[10px] font-black uppercase">CCT Atendido</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-center">Sector</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-center">Zona (ZE)</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-center">Estatus</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-right pr-6">Equipos Rehab.</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentStats.records.length > 0 ? currentStats.records.map((rec, idx) => (
                            <TableRow key={idx} className="hover:bg-white transition-colors">
                              <TableCell className="text-xs font-bold text-primary uppercase py-4 pl-6">{rec.modalidad}</TableCell>
                              <TableCell className="text-xs font-mono font-black">{rec.cct}</TableCell>
                              <TableCell className="text-xs font-bold text-center">{rec.sector}</TableCell>
                              <TableCell className="text-xs font-bold text-center">{rec.zonaEscolar}</TableCell>
                              <TableCell className="text-center">
                                 <div className="flex justify-center">
                                    <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border shadow-sm">
                                      <Circle className={cn("h-3 w-3 fill-current", 
                                        rec.status === 'concluido' ? 'text-emerald-500' : 
                                        rec.status === 'activo' ? 'text-amber-500' : 'text-rose-500'
                                      )} />
                                      <span className="text-[9px] font-black uppercase text-slate-500">{rec.status}</span>
                                    </div>
                                 </div>
                              </TableCell>
                              <TableCell className="text-xs font-black text-right pr-6">
                                 <div className="flex items-center justify-end gap-2 text-emerald-600">
                                   {rec.numeroEquipos} <MonitorCheck className="h-4 w-4" />
                                 </div>
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-12 text-xs font-bold text-muted-foreground uppercase opacity-40 italic">
                                No se han registrado intervenciones técnicas en este rubro aún.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 space-y-4">
                    <div className="flex justify-between items-end">
                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Barra de Progreso Institucional</span>
                       <span className="text-xs font-black text-primary uppercase">{currentStats.count} Escuelas de {TOTAL_UNIVERSE}</span>
                    </div>
                    <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200">
                       <div 
                        className="absolute inset-y-0 left-0 bg-primary transition-all duration-1000 ease-out"
                        style={{ width: `${currentStats.progress}%` }}
                       />
                       <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[8px] font-black text-slate-800 drop-shadow-sm uppercase mix-blend-difference">Avance: {currentStats.progress}%</span>
                       </div>
                    </div>
                    <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] pt-1">
                      <span>0% Inicio</span>
                      <span>50% Proceso</span>
                      <span>100% Meta</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-primary shadow-xl overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between py-6 px-8 border-b">
                 <div className="space-y-1">
                   <CardTitle className="text-xl font-black uppercase text-primary flex items-center gap-3">
                     <History className="h-6 w-6" /> Historial de Intervenciones: {activeTab}
                   </CardTitle>
                   <CardDescription className="text-xs font-bold uppercase tracking-wider">Auditoría pormenorizada de registros técnicos en centros de trabajo</CardDescription>
                 </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-100/50">
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase py-4 pl-8">Folio / Fecha</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">CCT / Plantel</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Tipo de Intervención</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-center">Evidencias</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase pr-8">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.length > 0 ? filteredHistory.map(r => (
                      <TableRow key={r.id} className="hover:bg-slate-50/80 transition-colors border-b last:border-0">
                        <TableCell className="py-4 pl-8">
                          <div className="flex flex-col">
                            <span className="font-black text-primary text-xs">{r.id}</span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">{r.date}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-700">{r.cct}</span>
                            <span className="text-[10px] text-muted-foreground font-bold truncate max-w-[200px] uppercase">{r.schoolName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-[9px] font-black border-blue-200 text-blue-700 bg-blue-50/50">MC: {r.serviciosMC}</Badge>
                            <Badge variant="outline" className="text-[9px] font-black border-emerald-200 text-emerald-700 bg-emerald-50/50">MP: {r.serviciosMP}</Badge>
                            {r.numeroEquipos > 0 && <Badge variant="outline" className="text-[9px] font-black border-purple-200 text-purple-700 bg-purple-50/50">EQ: {r.numeroEquipos}</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-3">
                            {r.reportPdf && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => setEvidenceToView({ type: 'pdf', data: r.reportPdf!, title: r.name })}>
                                <FileText className="h-5 w-5" />
                              </Button>
                            )}
                            {r.evidencePhotos && r.evidencePhotos.length > 0 && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-pink-600 hover:bg-pink-50" onClick={() => setEvidenceToView({ type: 'gallery', data: r.evidencePhotos!, title: r.name })}>
                                <ImageIcon className="h-5 w-5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Button variant="ghost" size="icon" className="h-10 w-10 hover:text-primary transition-transform hover:scale-110" onClick={() => { setFormData(r); setEditingId(r.id); setIsDialogOpen(true); }}>
                             <Pencil className="h-5 w-5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-20 opacity-40">
                          <div className="flex flex-col items-center gap-4">
                            <Briefcase className="h-12 w-12 text-slate-300" />
                            <p className="text-xs font-black uppercase tracking-widest">Sin registros históricos en este rubro</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[1200px] h-[95vh] flex flex-col p-0 border-none shadow-2xl">
          <DialogHeader className="p-8 pb-4 bg-slate-50 border-b relative">
            <div className="absolute right-12 top-8 h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
               <Settings2 className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="uppercase font-black text-primary text-2xl tracking-tighter flex items-center gap-4">
              Ficha Técnica de Programa: {activeTab}
            </DialogTitle>
            <DialogDescription className="font-bold text-xs uppercase text-slate-400 tracking-widest pt-1">Actualización de registro operativo y seguimiento técnico</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 px-8">
            <div className="grid gap-10 py-8 pb-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-primary tracking-widest">Folio de Registro</Label>
                  <Input value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} placeholder="P-001" className="h-12 font-black border-primary/20 focus:border-primary shadow-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-primary tracking-widest">Rubro del Programa</Label>
                  <Select value={formData.name} onValueChange={v => setFormData({...formData, name: v})}>
                    <SelectTrigger className="h-12 font-bold border-primary/20 shadow-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="font-bold">{PROGRAM_RUBROS.map(r => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-6 bg-primary/[0.03] rounded-3xl space-y-6 border-2 border-primary/5 shadow-inner">
                <Label className="text-xs font-black uppercase flex items-center gap-3 text-primary tracking-widest">
                  <Search className="h-5 w-5" /> Búsqueda y Localización del Centro de Trabajo
                </Label>
                <div className="relative">
                  <Input 
                    placeholder="Escribe CCT o Nombre para autocompletar información geográfica..." 
                    className="bg-white h-14 font-mono uppercase font-black px-6 rounded-2xl border-primary/20 shadow-sm focus:ring-primary/20" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                  />
                  {searchTerm.length > 2 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border rounded-2xl shadow-2xl max-h-72 overflow-auto p-2">
                      {schoolsDirectory.filter(s => s.cct.includes(searchTerm.toUpperCase()) || s.nombre.includes(searchTerm.toUpperCase())).slice(0, 10).map(s => (
                        <div key={s.cct} className="p-4 hover:bg-primary/5 cursor-pointer text-xs border-b last:border-0 flex justify-between items-center font-bold rounded-xl transition-colors" onClick={() => { handleSelectSchool(s.cct); setSearchTerm('') }}>
                          <div className="flex flex-col gap-1">
                            <span className="text-primary font-black text-sm">{s.cct}</span>
                            <span className="text-slate-500 uppercase">{s.nombre}</span>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter px-3">{s.valle}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {formData.cct && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="col-span-2 md:col-span-3 p-4 bg-white rounded-2xl border border-primary/10 flex items-center gap-4 shadow-sm">
                       <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <School className="h-6 w-6 text-primary" />
                       </div>
                       <div className="flex-1 overflow-hidden">
                          <p className="text-[10px] font-black text-muted-foreground uppercase leading-none mb-1.5 tracking-widest">Nombre del Plantel</p>
                          <p className="text-sm font-black truncate uppercase text-slate-800">{formData.schoolName}</p>
                       </div>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-primary/10 shadow-sm">
                        <p className="text-[10px] font-black text-muted-foreground uppercase leading-none mb-1.5 tracking-widest">Zona (ZE)</p>
                        <p className="text-sm font-black text-slate-800">{formData.zonaEscolar}</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-primary/10 shadow-sm">
                        <p className="text-[10px] font-black text-muted-foreground uppercase leading-none mb-1.5 tracking-widest">Sector</p>
                        <p className="text-sm font-black text-slate-800">{formData.sector}</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-primary/10 shadow-sm">
                        <p className="text-[10px] font-black text-muted-foreground uppercase leading-none mb-1.5 tracking-widest">Municipio</p>
                        <p className="text-sm font-black truncate uppercase text-slate-800">{formData.municipio}</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-primary/10 shadow-sm">
                        <p className="text-[10px] font-black text-muted-foreground uppercase leading-none mb-1.5 tracking-widest">Modalidad</p>
                        <p className="text-sm font-black truncate uppercase text-slate-800">{formData.modalidad}</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-primary/10 shadow-sm">
                        <p className="text-[10px] font-black text-muted-foreground uppercase leading-none mb-1.5 tracking-widest">Valle</p>
                        <p className="text-sm font-black uppercase text-slate-800">{formData.valle}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase text-primary border-b-2 border-primary/10 pb-2 flex items-center gap-3 tracking-widest">
                  <Zap className="h-5 w-5" /> Control Técnico y Métricas de Servicios
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                   <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">No. Equipos</Label><Input type="number" value={formData.numeroEquipos} onChange={e => setFormData({...formData, numeroEquipos: parseInt(e.target.value) || 0})} className="h-11 font-black" /></div>
                   <div className="col-span-3 space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción Detallada del Equipo</Label><Input value={formData.descripcionEquipo} onChange={e => setFormData({...formData, descripcionEquipo: e.target.value})} placeholder="Ej: Servidor ProLiant, 20 Laptops HP G8, Switch 24p..." className="h-11 font-bold" /></div>
                   <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Servicios M.C.</Label><Input type="number" className="h-11 font-black text-blue-600 border-blue-200 bg-blue-50/30" value={formData.serviciosMC} onChange={e => setFormData({...formData, serviciosMC: parseInt(e.target.value) || 0})} /></div>
                   <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Servicios M.P.</Label><Input type="number" className="h-11 font-black text-emerald-600 border-emerald-200 bg-emerald-50/30" value={formData.serviciosMP} onChange={e => setFormData({...formData, serviciosMP: parseInt(e.target.value) || 0})} /></div>
                   <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha Entrada</Label><Input type="date" value={formData.fechaEntrada} onChange={e => setFormData({...formData, fechaEntrada: e.target.value})} className="h-11 font-bold" /></div>
                   <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha Salida</Label><Input type="date" value={formData.fechaSalida} onChange={e => setFormData({...formData, fechaSalida: e.target.value})} className="h-11 font-bold" /></div>
                </div>
              </div>

              {formData.name === 'Biblioteca Digital' && (
                <div className="space-y-8 p-8 bg-emerald-50/30 rounded-3xl border-2 border-emerald-100/50 shadow-inner animate-in fade-in slide-in-from-top-4 duration-700">
                   <h3 className="text-sm font-black uppercase text-emerald-700 border-b-2 border-emerald-100 pb-3 flex items-center gap-3 tracking-widest">
                     <Users className="h-6 w-6" /> Seguimiento Pedagógico: Capacitación
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">¿Se brindó Capacitación Técnica?</Label>
                        <Select value={formData.capacitacion} onValueChange={(val: any) => setFormData({...formData, capacitacion: val})}>
                          <SelectTrigger className="h-12 font-black border-emerald-200 bg-white shadow-sm">
                            <SelectValue placeholder="Seleccionar estatus..." />
                          </SelectTrigger>
                          <SelectContent className="font-bold">
                            <SelectItem value="S">SÍ, SE BRINDÓ CAPACITACIÓN</SelectItem>
                            <SelectItem value="N">NO SE BRINDÓ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.capacitacion === 'S' && (
                         <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Total Participantes (Calculado)</Label>
                          <div className="h-12 flex items-center px-4 font-black border-2 border-emerald-300 bg-emerald-100/50 rounded-xl text-emerald-800">
                            {formData.asistentes?.filter(a => a.rfc).length || 0} PERSONAS
                          </div>
                        </div>
                      )}
                   </div>

                   {formData.capacitacion === 'S' && (
                      <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-black uppercase text-emerald-800 tracking-widest">Lista de Asistencia y Registro de RFC</h4>
                          <Button variant="outline" size="sm" onClick={handleAddAssistant} className="gap-3 font-black uppercase text-[10px] border-emerald-600 text-emerald-700 hover:bg-emerald-50 bg-white h-10 px-5 shadow-sm rounded-xl">
                            <Plus className="h-4 w-4" /> Añadir Asistente
                          </Button>
                        </div>

                        <div className="border-2 border-emerald-100 rounded-3xl overflow-hidden bg-white shadow-xl">
                           <ScrollArea className="w-full">
                              <Table>
                                <TableHeader className="bg-emerald-50">
                                  <TableRow>
                                    <TableHead className="w-12 text-[10px] font-black uppercase py-4 pl-6 text-emerald-800">#</TableHead>
                                    <TableHead className="min-w-[180px] text-[10px] font-black uppercase text-emerald-800">Apellido Paterno</TableHead>
                                    <TableHead className="min-w-[180px] text-[10px] font-black uppercase text-emerald-800">Apellido Materno</TableHead>
                                    <TableHead className="min-w-[180px] text-[10px] font-black uppercase text-emerald-800">Nombre(s)</TableHead>
                                    <TableHead className="min-w-[150px] text-[10px] font-black uppercase text-emerald-800">RFC (13 car.)</TableHead>
                                    <TableHead className="min-w-[120px] text-[10px] font-black uppercase text-emerald-800">Género</TableHead>
                                    <TableHead className="min-w-[180px] text-[10px] font-black uppercase text-emerald-800">Función</TableHead>
                                    <TableHead className="min-w-[150px] text-[10px] font-black uppercase text-emerald-800 text-center">Procedencia (CCT)</TableHead>
                                    <TableHead className="w-12 sticky right-0 bg-emerald-50"></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {formData.asistentes?.map((ast, idx) => (
                                    <TableRow key={idx} className="hover:bg-emerald-50/30 border-b border-emerald-50 last:border-0 transition-colors">
                                      <TableCell className="text-center font-black text-xs text-emerald-400 pl-6">{idx + 1}</TableCell>
                                      <TableCell className="p-2"><Input className="h-10 text-[10px] uppercase font-bold rounded-lg border-emerald-100" value={ast.paterno} onChange={e => updateAssistant(idx, 'paterno', e.target.value.toUpperCase())} /></TableCell>
                                      <TableCell className="p-2"><Input className="h-10 text-[10px] uppercase font-bold rounded-lg border-emerald-100" value={ast.materno} onChange={e => updateAssistant(idx, 'materno', e.target.value.toUpperCase())} /></TableCell>
                                      <TableCell className="p-2"><Input className="h-10 text-[10px] font-black uppercase rounded-lg border-emerald-100 text-emerald-900" value={ast.nombres} onChange={e => updateAssistant(idx, 'nombres', e.target.value.toUpperCase())} /></TableCell>
                                      <TableCell className="p-2"><Input className="h-10 text-[10px] font-mono uppercase font-black rounded-lg border-emerald-300 text-primary" value={ast.rfc} onChange={e => updateAssistant(idx, 'rfc', e.target.value.toUpperCase())} maxLength={13} /></TableCell>
                                      <TableCell className="p-2">
                                        <Select value={ast.genero} onValueChange={v => updateAssistant(idx, 'genero', v)}>
                                          <SelectTrigger className="h-10 text-[10px] font-black rounded-lg border-emerald-100"><SelectValue /></SelectTrigger>
                                          <SelectContent className="font-bold">
                                            <SelectItem value="MASCULINO" className="text-[10px]">MASCULINO</SelectItem>
                                            <SelectItem value="FEMENINO" className="text-[10px]">FEMENINO</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell className="p-2">
                                        <Select value={ast.funcion} onValueChange={v => updateAssistant(idx, 'funcion', v)}>
                                          <SelectTrigger className="h-10 text-[10px] font-bold rounded-lg border-emerald-100"><SelectValue /></SelectTrigger>
                                          <SelectContent className="font-bold">
                                            {FUNCIONES.map(f => <SelectItem key={f} value={f} className="text-[10px]">{f}</SelectItem>)}
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell className="p-2">
                                        <div className="flex flex-col gap-1">
                                          <Input className="h-10 text-[10px] font-mono uppercase font-black border-emerald-300 bg-emerald-50/50" value={ast.cct} onChange={e => updateAssistant(idx, 'cct', e.target.value.toUpperCase())} maxLength={10} placeholder="CCT ORIGEN" />
                                          {ast.nombreCT && <span className="text-[8px] font-black text-muted-foreground uppercase truncate max-w-[140px] px-1">{ast.nombreCT}</span>}
                                        </div>
                                      </TableCell>
                                      <TableCell className="p-2 sticky right-0 bg-white/95 backdrop-blur-sm border-l border-emerald-50">
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all" onClick={() => handleRemoveAssistant(idx)} disabled={formData.asistentes?.length === 1}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                              <ScrollBar orientation="horizontal" />
                           </ScrollArea>
                        </div>
                      </div>
                   )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">No. de Oficio Oficial</Label><Input value={formData.numeroOficio} onChange={e => setFormData({...formData, numeroOficio: e.target.value})} placeholder="DESySA/PL/001/2024" className="h-11 font-bold" /></div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">¿Atención en Semana SETES?</Label>
                  <Select value={formData.setes} onValueChange={v => setFormData({...formData, setes: v as any})}>
                    <SelectTrigger className="h-11 font-black border-purple-200 focus:ring-purple-200"><SelectValue /></SelectTrigger>
                    <SelectContent className="font-bold"><SelectItem value="S">SÍ, ES SEMANA SETES</SelectItem><SelectItem value="N">NO, ATENCIÓN REGULAR</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estatus de la Intervención</Label>
                  <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v as any})}>
                    <SelectTrigger className="h-11 font-black shadow-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="font-bold">
                      <SelectItem value="planeacion">🔴 PLANEACIÓN / INICIO</SelectItem>
                      <SelectItem value="activo">🟡 EN PROCESO TÉCNICO</SelectItem>
                      <SelectItem value="concluido">🟢 CONCLUIDO / CERRADO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-6 pt-8 border-t-2 border-slate-100">
                <h3 className="text-xs font-black uppercase text-primary tracking-widest">Respaldo Digital y Evidencias</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 border-2 border-dashed rounded-3xl bg-slate-50/50 space-y-4 hover:bg-slate-50 transition-colors border-slate-200">
                    <Label className="text-xs font-black uppercase flex items-center gap-3 text-slate-600">
                      <FileText className="h-5 w-5 text-blue-600" /> Carga de Reporte Técnico (PDF)
                    </Label>
                    <Input type="file" accept=".pdf" className="bg-white h-11 py-2 cursor-pointer border-slate-200 shadow-sm" onChange={e => handleFileChange(e, 'pdf')} />
                    {formData.reportPdf && <p className="text-[10px] font-black text-emerald-600 flex items-center gap-2">✓ DOCUMENTO CARGADO Y LISTO</p>}
                  </div>
                  <div className="p-6 border-2 border-dashed rounded-3xl bg-slate-50/50 space-y-4 hover:bg-slate-50 transition-colors border-slate-200">
                    <Label className="text-xs font-black uppercase flex items-center gap-3 text-slate-600">
                      <ImageIcon className="h-5 w-5 text-pink-600" /> Galería Fotográfica (Máximo 5 imágenes)
                    </Label>
                    <Input type="file" multiple accept="image/*" className="bg-white h-11 py-2 cursor-pointer border-slate-200 shadow-sm" onChange={e => handleFileChange(e, 'photo')} />
                    {formData.evidencePhotos && formData.evidencePhotos.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {formData.evidencePhotos.map((_, i) => (
                           <div key={i} className="h-8 w-8 bg-pink-100 rounded-lg flex items-center justify-center text-[10px] font-black text-pink-600 border border-pink-200">#{i+1}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-primary tracking-widest">Bitácora y Observaciones Operativas</Label>
                <Textarea className="min-h-[160px] rounded-3xl p-6 border-slate-200 focus:border-primary shadow-inner bg-slate-50/30 font-medium" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder="Detalle cronológico de la intervención, inconvenientes técnicos o acuerdos con el plantel..." />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-8 border-t bg-slate-50/80 backdrop-blur-md">
             <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="font-black uppercase text-xs h-12 px-8 rounded-xl border-slate-300">Cancelar</Button>
             <Button onClick={handleSave} className="font-black uppercase text-xs h-12 px-14 rounded-xl shadow-xl shadow-primary/20">Finalizar y Guardar Registro Técnico</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!evidenceToView} onOpenChange={() => setEvidenceToView(null)}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
          <DialogHeader className="p-8 bg-slate-900 border-b border-slate-800 text-white">
            <DialogTitle className="uppercase font-black text-2xl flex items-center gap-4 tracking-tighter">
              {evidenceToView?.title} <ExternalLink className="h-6 w-6 text-primary" />
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-bold text-xs uppercase tracking-widest">Visor Ejecutivo de Evidencias Oficina de Planeación</DialogDescription>
          </DialogHeader>
          <div className="flex-1 bg-slate-100 p-8 overflow-hidden relative">
             {evidenceToView?.type === 'pdf' ? (
                <iframe src={evidenceToView.data as string} className="w-full h-full border-none rounded-2xl shadow-2xl bg-white" title="PDF Viewer" />
             ) : (
                <ScrollArea className="h-full">
                  <div className="grid grid-cols-2 gap-8">
                     {(evidenceToView?.data as string[])?.map((img, i) => (
                        <div key={i} className="relative aspect-video rounded-3xl overflow-hidden border-8 border-white shadow-2xl group cursor-zoom-in">
                          <Image src={img} alt="evidencia" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <Search className="h-10 w-10 text-white" />
                          </div>
                        </div>
                     ))}
                  </div>
                </ScrollArea>
             )}
          </div>
          <div className="p-6 bg-slate-900 flex justify-end">
             <Button onClick={() => setEvidenceToView(null)} className="font-black uppercase text-xs h-11 px-8 rounded-xl">Cerrar Visor</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
