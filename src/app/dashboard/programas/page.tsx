
'use client'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { programsData, type ProgramStatus } from "@/lib/planning-data"
import { schoolsDirectory } from "@/lib/schools-directory"
import { cn } from "@/lib/utils"
import Image from 'next/image'
import { 
  PlusCircle, 
  Pencil, 
  Activity,
  Target,
  CheckCircle2,
  Plus,
  Search,
  Trash2,
  UserPlus,
  UserCog,
  GraduationCap,
  Circle,
  FileText,
  ImageIcon,
  Eye,
  Tv,
  Radio,
  Network,
  Monitor,
  X
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const PROGRAM_RUBROS = [
  'Cuentas Institucionales',
  'Biblioteca Digital',
  'Geoposición',
  'Conoce mi Escuela',
  'ATRES'
];

const FUNCIONES = [
  "ADMINISTRATIVO",
  "DOCENTE",
  "DIRECTIVO",
  "SUBDIRECTOR",
  "JEFE DE ENSEÑANZA",
  "SUPERVISOR",
  "ASESOR TECNICO PEDAGOGICO",
  "INTENDENTE",
  "PREFECTO",
  "TRABAJADOR SOCIAL",
  "BIBLIOTECARIO",
  "CONTRALOR"
]

const REGIONAL_OFFICES = [
  "Oficina de Tecnóloga Educativa Ecatepec",
  "Oficina de Tecnóloga Educativa Naucalpan",
  "Oficina de Tecnóloga Educativa Nezahualcóyotl",
  "Oficina de Tecnóloga Educativa Toluca",
  "Oficina de COEES Tultitlan"
];

const MAINTENANCE_CHECKLIST = [
  "SUSTITUCIÓN DE CONECTORES",
  "SUSTITUCIÓN DE CORDONES DE PARCHEO",
  "SUSTITUCIÓN DE CABLE UTP",
  "SUSTITUCIÓN DE ROSETAS",
  "SUSTITUCIÓN DE CANALETAS",
  "CONFIGURACIÓN DE RED"
];

const EDUSAT_MICROPAK = ['REVISIÓN', 'POLARIZACIÓN', 'PRUEBA', 'CAMBIO'];
const EDUSAT_ANTENA = ['ORIENTACIÓN', 'REPARACIÓN', 'REUBICACIÓN', 'CAMBIO'];
const EDUSAT_DECO_ACCIONES = ['CONFIGURACIÓN', 'REUBICACIÓN', 'CAMBIO'];
const EDUSAT_CABLEADO = ['CAMBIO DE CAMPANAS', 'CAMBIO DE DIVISOR', 'CAMBIO DE CABLE'];
const EDUSAT_PREVENTIVO = ['REVISIÓN GENERAL', 'LIMPIEZA GENERAL', 'CUIDADO PREVENTIVO'];

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [activeTab, setActiveTab] = useState(PROGRAM_RUBROS[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [evidenceToView, setEvidenceToView] = useState<{ type: 'pdf' | 'gallery', data: string | string[], title: string } | null>(null)

  // Assistant Sub-Dialog State
  const [isAssistantDialogOpen, setIsAssistantDialogOpen] = useState(false)
  const [editingAssistantIndex, setEditingAssistantIndex] = useState<number | null>(null)
  const [assistantForm, setAssistantForm] = useState({
    nombres: '',
    paterno: '',
    materno: '',
    rfc: '',
    funcion: '',
    email: ''
  })

  const initialFormState: ProgramStatus = {
    id: '', name: '', progress: 0, status: 'activo', date: new Date().toISOString().split('T')[0], cct: '', schoolName: '', 
    zonaEscolar: '', sector: '', modalidad: '', municipio: '', region: '', valle: '',
    numeroEquipos: 0, observaciones: '', capacitacion: 'N', asistentes: [], email: '',
    latitud: '', longitud: '',
    tecnicos: '',
    tipoIncidencia: 'mantenimiento',
    oficinaRegionalAtencion: '',
    numeroOficio: '',
    alumnosBeneficiados: 0,
    docentesBeneficiados: 0,
    serviciosMC: 0,
    serviciosMP: 0,
    reportPdf: '',
    evidencePhotos: [],
    mantenimientoDetalle: {
      equipoTecnologico: '',
      equipoTecnologicoOtro: '',
      equipos: Array(10).fill({ equipo: '', marca: '', serie: '', censal: '' }),
      fallaIdentificada: '',
      servicioRealizado: ''
    },
    edusatDetalle: {
      micropak: [],
      antena: [],
      decodificadorAcciones: [],
      cableado: [],
      preventivo: [],
      numCensal: '',
      numSerie: '',
      calidadSeñal: '',
      materiales: Array(8).fill({ material: '', cantidad: '', actividades: '' })
    }
  }

  const [formData, setFormData] = useState<ProgramStatus>(initialFormState)

  useEffect(() => {
    setMounted(true)
    const currentVersion = 'programs_full_v24'
    const storedV24 = localStorage.getItem(currentVersion)
    
    if (storedV24) {
      setRecords(JSON.parse(storedV24))
    } else {
      const v23 = localStorage.getItem('programs_full_v23')
      const v22 = localStorage.getItem('programs_full_v22')
      const v21 = localStorage.getItem('programs_full_v21')
      
      let initialSet: ProgramStatus[] = []
      if (v23) initialSet = JSON.parse(v23)
      else if (v22) initialSet = JSON.parse(v22)
      else if (v21) initialSet = JSON.parse(v21)

      const masterData = programsData
      const finalSet = [...initialSet]
      masterData.forEach(master => {
        const exists = finalSet.find(e => (e.id === master.id) || (e.cct === master.cct && e.name === master.name))
        if (!exists) finalSet.push(master)
      })
      setRecords(finalSet)
      localStorage.setItem(currentVersion, JSON.stringify(finalSet))
    }
  }, [])

  const handleCctChange = (val: string) => {
    const cleanVal = val.toUpperCase();
    setFormData(prev => ({ ...prev, cct: cleanVal }));
    if (cleanVal.length === 10) {
      const school = schoolsDirectory.find(s => s.cct.toUpperCase() === cleanVal);
      if (school) {
        setFormData(prev => ({
          ...prev,
          schoolName: school.nombre,
          zonaEscolar: school.zonaEscolar,
          sector: school.sector,
          modalidad: school.modalidad,
          municipio: school.municipio,
          valle: school.valle,
          region: school.region,
          email: `${school.cct.toLowerCase()}@desysa.gob.mx`
        }));
      }
    }
  }

  const handleSave = () => {
    if (!formData.cct) {
      toast({ variant: "destructive", title: "Datos Incompletos", description: "El CCT es obligatorio." });
      return;
    }
    const updated = editingId 
      ? records.map(r => r.id === editingId ? formData : r) 
      : [{...formData, id: `SOL-${Date.now()}`}, ...records];
    setRecords(updated)
    localStorage.setItem('programs_full_v24', JSON.stringify(updated))
    setIsDialogOpen(false)
    setEditingId(null)
    setFormData(initialFormState)
    toast({ title: "Registro guardado con éxito" })
  }

  const filteredRecords = useMemo(() => {
    let filtered = records.filter(r => r.name === activeTab);
    if (searchTerm) {
      const term = searchTerm.toUpperCase();
      filtered = filtered.filter(r => 
        (r.cct || '').toUpperCase().includes(term) || 
        (r.schoolName || '').toUpperCase().includes(term)
      );
    }
    return [...filtered].sort((a, b) => (a.cct || '').localeCompare(b.cct || ''));
  }, [records, activeTab, searchTerm]);

  const handleEdit = (rec: ProgramStatus) => {
    setFormData({
      ...initialFormState,
      ...rec,
      mantenimientoDetalle: rec.mantenimientoDetalle || initialFormState.mantenimientoDetalle,
      edusatDetalle: rec.edusatDetalle || initialFormState.edusatDetalle
    });
    setEditingId(rec.id);
    setIsDialogOpen(true);
  }

  const handleDeleteRecord = (id: string) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    localStorage.setItem('programs_full_v24', JSON.stringify(updated));
    toast({ title: "Registro eliminado" });
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'photo') => {
    const files = e.target.files
    if (!files) return
    if (type === 'pdf') {
      const file = files[0]
      const reader = new FileReader()
      reader.onloadend = () => setFormData({ ...formData, reportPdf: reader.result as string })
      reader.readAsDataURL(file)
    } else {
      const newPhotos = Array.from(files)
      newPhotos.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => setFormData(prev => ({ ...prev, evidencePhotos: [...(prev.evidencePhotos || []), reader.result as string] }))
        reader.readAsDataURL(file)
      })
    }
  }

  const handleMantenimientoTableChange = (index: number, field: string, value: string) => {
    const current = formData.mantenimientoDetalle || initialFormState.mantenimientoDetalle!;
    const newEquipos = [...current.equipos];
    newEquipos[index] = { ...newEquipos[index], [field]: value };
    setFormData({ ...formData, mantenimientoDetalle: { ...current, equipos: newEquipos } });
  }

  const handleEdusatChecklistToggle = (category: keyof NonNullable<ProgramStatus['edusatDetalle']>, item: string) => {
    const current = (formData.edusatDetalle?.[category] as string[]) || [];
    const updated = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
    setFormData({ ...formData, edusatDetalle: { ...formData.edusatDetalle!, [category]: updated } });
  }

  const handleMantenimientoToggle = (item: string) => {
    const current = formData.mantenimientoChecklist || [];
    const updated = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
    setFormData({ ...formData, mantenimientoChecklist: updated });
  }

  // Assistant Logic
  const handleSaveAssistant = () => {
    if (!assistantForm.nombres || !assistantForm.rfc) return;
    const newAsistentes = [...(formData.asistentes || [])]
    if (editingAssistantIndex !== null) newAsistentes[editingAssistantIndex] = { ...assistantForm }
    else newAsistentes.push({ ...assistantForm })
    setFormData({ ...formData, asistentes: newAsistentes })
    setIsAssistantDialogOpen(false)
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase leading-none">Módulos Técnicos COEES</h2>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2 mt-1">
            <Activity className="h-4 w-4 text-accent" /> Control de Programas y Auditoría 2026
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSearchTerm(''); }} className="space-y-6">
        <TabsList className="w-full h-12 bg-white border border-slate-100 p-1 rounded-xl shadow-sm">
          {PROGRAM_RUBROS.map(rubro => (
            <TabsTrigger key={rubro} value={rubro} className="flex-1 h-full text-[10px] font-black uppercase rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              {rubro}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 animate-in fade-in duration-500">
          <Card className="executive-card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                 <Target className="h-6 w-6" />
               </div>
               <div>
                 <h3 className="text-xl font-black uppercase text-slate-900 leading-none">{activeTab}</h3>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Registros de Auditoría Técnica</p>
               </div>
             </div>
             <div className="flex flex-1 max-md:w-full relative">
               <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
               <Input placeholder="Filtrar registros..." className="pl-10 h-10 rounded-xl border-primary/10 bg-slate-50 text-[10px] font-bold uppercase shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
             </div>
             <Button onClick={() => { setFormData({...initialFormState, name: activeTab}); setEditingId(null); setIsDialogOpen(true); }} className="btn-institutional px-8 text-[11px] h-10">
                <PlusCircle className="h-5 w-5 mr-2" /> Nuevo Registro
             </Button>
          </Card>

          <Card className="executive-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                   <TableRow>
                      <TableHead className="w-12 text-[10px] font-black uppercase text-center">#</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">{activeTab === 'ATRES' ? 'Folio' : 'CCT'}</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">
                        {activeTab === 'Geoposición' ? 'Longitud' : (activeTab === 'ATRES' ? 'CCT / Plantel' : 'Plantel')}
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase">
                        {activeTab === 'Geoposición' ? 'Latitud' : (activeTab === 'Biblioteca Digital' ? 'Estatus Operativo' : (activeTab === 'ATRES' ? 'Tipo de Servicio' : 'Contacto / Email'))}
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-center">
                        {activeTab === 'Geoposición' ? 'Estado' : (activeTab === 'Biblioteca Digital' ? 'Equipos' : (activeTab === 'ATRES' ? 'Estatus Operativo' : 'Cuentas'))}
                      </TableHead>
                      {activeTab === 'ATRES' && <TableHead className="text-[10px] font-black uppercase text-center">Evidencias</TableHead>}
                      <TableHead className="text-right text-[10px] font-black uppercase pr-8">Acción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((rec, idx) => (
                    <TableRow key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="text-center font-black text-[10px] text-muted-foreground">{idx + 1}.-</TableCell>
                      <TableCell className="font-black text-[10px] text-primary">{activeTab === 'ATRES' ? rec.id : rec.cct}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-700 uppercase">
                        {activeTab === 'Geoposición' ? rec.longitud : (activeTab === 'ATRES' ? `${rec.cct} - ${rec.schoolName}` : rec.schoolName)}
                      </TableCell>
                      <TableCell>
                        {activeTab === 'Geoposición' ? <span className="text-[10px] font-mono font-bold">{rec.latitud}</span> : 
                         activeTab === 'ATRES' ? <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20">{rec.tipoIncidencia || 'mantenimiento'}</Badge> :
                         <span className="text-[10px] font-mono lowercase">{rec.email || 'S/D'}</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {activeTab === 'ATRES' ? (
                          <div className={cn("h-8 flex items-center justify-center gap-2 rounded-xl text-[9px] font-black uppercase", rec.status === 'atendido' ? 'bg-emerald-50 text-emerald-700' : (rec.status === 'en proceso' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'))}>
                            <Circle className={cn("h-2 w-2 fill-current", rec.status === 'atendido' ? 'text-emerald-500' : (rec.status === 'en proceso' ? 'text-amber-500' : 'text-rose-500'))} />
                            {rec.status?.replace('activo', 'atendido') || 'PENDIENTE'}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[9px] font-black">{rec.status === 'activo' ? 'ACTIVO' : 'CONCLUIDO'}</Badge>
                        )}
                      </TableCell>
                      {activeTab === 'ATRES' && (
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                             {rec.reportPdf && <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => setEvidenceToView({ type: 'pdf', data: rec.reportPdf!, title: `Documento ${rec.id}` })}><FileText className="h-4 w-4" /></Button>}
                             {rec.evidencePhotos && rec.evidencePhotos.length > 0 && <Button variant="ghost" size="icon" className="h-8 w-8 text-pink-600" onClick={() => setEvidenceToView({ type: 'gallery', data: rec.evidencePhotos!, title: `Galería ${rec.id}` })}><ImageIcon className="h-4 w-4" /></Button>}
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="text-right pr-8">
                         <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(rec)} className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteRecord(rec.id)} className="h-8 w-8 text-rose-600"><Trash2 className="h-4 w-4" /></Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[1400px] rounded-[2rem] h-[95vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="uppercase font-black text-primary text-2xl flex items-center gap-3">
              <Target className="h-7 w-7 text-accent" /> Gestión de {activeTab}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="auditoria" className="flex-1 flex flex-col overflow-hidden">
             <div className="px-8 border-b bg-slate-50/50">
                <TabsList className="bg-transparent h-12 p-0 gap-6">
                  <TabsTrigger value="auditoria" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-0 py-3 text-[11px] font-black uppercase transition-all">1. Datos de Auditoría</TabsTrigger>
                  {activeTab !== 'ATRES' && (
                    <TabsTrigger value="asistentes" disabled={activeTab === 'Biblioteca Digital' && formData.capacitacion === 'N'} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-0 py-3 text-[11px] font-black uppercase transition-all">2. Lista de Cuentas / Personal</TabsTrigger>
                  )}
                </TabsList>
             </div>

             <div className="flex-1 overflow-hidden">
                <TabsContent value="auditoria" className="h-full m-0 p-0 overflow-hidden">
                  <ScrollArea className="h-full px-8">
                    <div className="grid gap-8 py-6">
                      {activeTab === 'ATRES' ? (
                        <div className="space-y-8 animate-in fade-in">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase">Tipo de Incidencia</Label>
                              <Select value={formData.tipoIncidencia} onValueChange={(val: any) => setFormData({...formData, tipoIncidencia: val})}>
                                <SelectTrigger className="h-12 bg-slate-50"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {['red edusat', 'red local', 'mantenimiento', 'teleplanteles'].map(t => <SelectItem key={t} value={t} className="uppercase font-bold text-[10px]">{t}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase">Estatus Operativo</Label>
                              <Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val})}>
                                <SelectTrigger className="h-12 bg-slate-50"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {['pendiente', 'en proceso', 'atendido'].map(s => <SelectItem key={s} value={s} className="uppercase font-bold text-[10px]">{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                               <Label className="text-[10px] font-black uppercase">CCT del Plantel</Label>
                               <Input placeholder="EJ: 15DES0001X" className="h-12 uppercase font-black" value={formData.cct} onChange={e => handleCctChange(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                               <Label className="text-[10px] font-black uppercase">Nombre Institucional</Label>
                               <Input value={formData.schoolName} readOnly className="h-12 font-bold bg-slate-100 border-none" />
                            </div>
                          </div>

                          {formData.tipoIncidencia === 'mantenimiento' && (
                            <div className="p-6 bg-slate-50 rounded-[2rem] border-2 space-y-6">
                               <div className="flex items-center gap-3 border-b pb-3">
                                  <Monitor className="h-5 w-5 text-primary" />
                                  <h3 className="text-xs font-black uppercase">Módulo de Mantenimiento Detallado</h3>
                               </div>
                               <div className="border rounded-xl overflow-hidden bg-white">
                                  <Table>
                                    <TableHeader className="bg-slate-100">
                                      <TableRow>
                                        <TableHead className="w-12 text-[9px] font-black uppercase text-center">N.P.</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase">Equipo</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase">Marca</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase">No. Serie</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {Array.from({ length: 5 }).map((_, idx) => (
                                        <TableRow key={idx}>
                                          <TableCell className="text-center font-bold text-[10px]">{idx + 1}</TableCell>
                                          <TableCell className="p-1"><Input className="h-8 text-[10px] uppercase" value={formData.mantenimientoDetalle?.equipos[idx]?.equipo || ''} onChange={e => handleMantenimientoTableChange(idx, 'equipo', e.target.value.toUpperCase())} /></TableCell>
                                          <TableCell className="p-1"><Input className="h-8 text-[10px] uppercase" value={formData.mantenimientoDetalle?.equipos[idx]?.marca || ''} onChange={e => handleMantenimientoTableChange(idx, 'marca', e.target.value.toUpperCase())} /></TableCell>
                                          <TableCell className="p-1"><Input className="h-8 text-[10px] uppercase" value={formData.mantenimientoDetalle?.equipos[idx]?.serie || ''} onChange={e => handleMantenimientoTableChange(idx, 'serie', e.target.value.toUpperCase())} /></TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                               </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-8">
                             <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase text-primary">Archivo Digital y Reportes</Label>
                                <div className="p-4 border-dashed border-2 rounded-2xl bg-slate-50 text-center space-y-2">
                                   <FileText className="mx-auto h-8 w-8 text-blue-500" />
                                   <Input type="file" accept=".pdf" className="h-9 bg-white" onChange={e => handleFileChange(e, 'pdf')} />
                                   {formData.reportPdf && <p className="text-[8px] text-emerald-600 font-black">✓ ARCHIVO PDF CARGADO</p>}
                                </div>
                             </div>
                             <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase text-primary">Galería de Evidencias (Max 5)</Label>
                                <div className="p-4 border-dashed border-2 rounded-2xl bg-slate-50 text-center space-y-2">
                                   <ImageIcon className="mx-auto h-8 w-8 text-pink-500" />
                                   <Input type="file" multiple accept="image/*" className="h-9 bg-white" onChange={e => handleFileChange(e, 'photo')} />
                                   <div className="flex gap-2 justify-center mt-2">
                                      {formData.evidencePhotos?.map((p, i) => <div key={i} className="h-8 w-8 rounded border overflow-hidden"><Image src={p} alt="ev" width={32} height={32} className="object-cover" /></div>)}
                                   </div>
                                </div>
                             </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                              <Label className="text-[11px] font-black uppercase text-primary"># Solicitud</Label>
                              <Input className="h-12 font-mono uppercase bg-slate-50" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} />
                            </div>
                            <div className="space-y-2">
                               <Label className="text-[11px] font-black uppercase text-primary">CCT del Plantel</Label>
                               <Input placeholder="EJ: 15DES0001X" className="h-12 uppercase font-black" value={formData.cct} onChange={e => handleCctChange(e.target.value)} />
                            </div>
                            {activeTab === 'Geoposición' && (
                              <>
                                <Input value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} placeholder="Latitud" />
                                <Input value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} placeholder="Longitud" />
                              </>
                            )}
                            <div className="col-span-2">
                              <Label className="text-[11px] font-black uppercase">Observaciones Técnicas</Label>
                              <Textarea className="min-h-[120px] bg-slate-50 mt-2" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} />
                            </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="asistentes" className="h-full m-0 p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-[10px] font-bold text-blue-800 uppercase">Personal y cuentas asociadas a este centro de trabajo.</p>
                    <Button onClick={() => { setAssistantForm({nombres: '', paterno: '', materno: '', rfc: '', funcion: '', email: ''}); setIsAssistantDialogOpen(true); }} className="gap-2 font-black uppercase text-[10px] h-10 px-6"><UserPlus className="h-4 w-4" /> Añadir Registro</Button>
                  </div>
                  <div className="flex-1 overflow-hidden border rounded-[2rem] bg-white">
                    <ScrollArea className="h-full">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="text-[10px] font-black uppercase">Nombre del Servidor</TableHead>
                            <TableHead className="text-[10px] font-black uppercase">RFC</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase pr-8">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.asistentes?.map((ast: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="p-4 font-black text-xs uppercase">{ast.nombres} {ast.paterno}</TableCell>
                              <TableCell className="p-4 font-mono text-xs">{ast.rfc}</TableCell>
                              <TableCell className="p-4 text-right pr-6">
                                <Button variant="ghost" size="icon" onClick={() => { setAssistantForm(ast); setEditingAssistantIndex(idx); setIsAssistantDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </TabsContent>
             </div>
          </Tabs>
          
          <DialogFooter className="p-8 gap-4 border-t bg-slate-50/50">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-14 px-10 text-[10px] font-black uppercase">Cerrar</Button>
            <Button onClick={handleSave} className="btn-institutional px-16 text-[10px] h-14">Guardar Cambios Institucionales</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!evidenceToView} onOpenChange={() => setEvidenceToView(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem]">
          <DialogHeader className="p-8 border-b bg-slate-50">
            <DialogTitle className="uppercase font-black text-primary text-xl flex items-center gap-4">
              {evidenceToView?.type === 'pdf' ? <FileText className="h-6 w-6 text-blue-600" /> : <ImageIcon className="h-6 w-6 text-pink-600" />}
              {evidenceToView?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 bg-slate-100 relative">
             {evidenceToView?.type === 'pdf' ? <iframe src={evidenceToView.data as string} className="w-full h-full" /> : 
                <ScrollArea className="h-full p-8">
                  <div className="grid grid-cols-2 gap-8">
                    {(evidenceToView?.data as string[])?.map((img, i) => <div key={i} className="relative aspect-video rounded-3xl overflow-hidden border-8 border-white shadow-2xl"><Image src={img} alt="ev" fill className="object-cover" /></div>)}
                  </div>
                </ScrollArea>}
          </div>
          <div className="p-6 border-t bg-white flex justify-end"><Button variant="secondary" onClick={() => setEvidenceToView(null)} className="font-black uppercase text-[10px] h-12 px-8">Cerrar Visor</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssistantDialogOpen} onOpenChange={setIsAssistantDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-8">
          <DialogHeader><DialogTitle className="uppercase font-black">Registro de Personal</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <Input placeholder="Nombres" value={assistantForm.nombres} onChange={e => setAssistantForm({...assistantForm, nombres: e.target.value.toUpperCase()})} />
            <Input placeholder="Ap. Paterno" value={assistantForm.paterno} onChange={e => setAssistantForm({...assistantForm, pathero: e.target.value.toUpperCase()})} />
            <Input placeholder="RFC" value={assistantForm.rfc} onChange={e => setAssistantForm({...assistantForm, rfc: e.target.value.toUpperCase()})} maxLength={13} />
          </div>
          <DialogFooter><Button onClick={handleSaveAssistant} className="btn-institutional w-full">Actualizar Lista</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
