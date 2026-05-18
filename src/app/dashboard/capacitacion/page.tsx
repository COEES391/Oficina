'use client'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { trainingRecords, type TrainingRecord } from "@/lib/planning-data"
import { schoolsDirectory } from "@/lib/schools-directory"
import { PlusCircle, GraduationCap, Users, Pencil, Trash2, CheckCircle2, Plus, School } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

type AssistantEntry = {
  paterno: string;
  materno: string;
  nombres: string;
  rfc: string;
  genero: 'MASCULINO' | 'FEMENINO' | '';
  funcion: string;
  email: string;
  cct: string;
  nombreCT: string;
  ze: string;
  sector: string;
  modalidad: string;
  municipio: string;
  region: string;
  valle: string;
}

const FUNCIONES = [
  "ADMINISTRATIVO",
  "DOCENTE",
  "DIRECTIVO",
  "JEFE DE ENSEÑANZA",
  "SUPERVISOR",
  "ASESOR TECNICO PEDAGOGICO"
]

export default function TrainingPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<TrainingRecord[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const initialCourseData = {
    id: '',
    cursoGrupo: '',
    cursoNombre: '',
    duracionHoras: 0,
    fechaInicio: '',
    fechaTermino: '',
    instructores: ['', '', ''],
    numeroOficio: '',
    materialUtilizado: '',
    cctSede: '',
    setes: 'N' as 'S' | 'N',
    observaciones: '',
    alumnosBeneficiados: 0,
    docentesBeneficiados: 0,
  }

  const [courseData, setCourseData] = useState(initialCourseData)
  const [assistants, setAssistants] = useState<AssistantEntry[]>([
    { paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '' }
  ])

  useEffect(() => {
    setMounted(true)
    const stored = JSON.parse(localStorage.getItem('training_records_full') || '[]')
    if (stored.length === 0) {
      setRecords(trainingRecords)
      localStorage.setItem('training_records_full', JSON.stringify(trainingRecords))
    } else {
      setRecords(stored)
    }
    
    // Set initial dates after mounting
    const today = format(new Date(), 'yyyy-MM-dd')
    setCourseData(prev => ({
      ...prev,
      fechaInicio: today,
      fechaTermino: today
    }))
  }, [])

  const handleAddRow = () => {
    setAssistants([...assistants, { paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '' }])
  }

  const handleRemoveRow = (index: number) => {
    if (assistants.length === 1) return
    setAssistants(assistants.filter((_, i) => i !== index))
  }

  const updateAssistant = (index: number, field: keyof AssistantEntry, value: string) => {
    const newAssistants = [...assistants]
    newAssistants[index] = { ...newAssistants[index], [field]: value }

    if (field === 'cct') {
      const cleanValue = value.trim().toUpperCase()
      if (cleanValue.length === 10) {
        const school = schoolsDirectory.find(s => s.cct.toUpperCase() === cleanValue)
        if (school) {
          newAssistants[index] = {
            ...newAssistants[index],
            cct: school.cct,
            nombreCT: school.nombre,
            ze: school.zonaEscolar,
            sector: school.sector,
            modalidad: school.modalidad,
            municipio: school.municipio,
            region: school.region,
            valle: school.valle
          }
        } else {
          newAssistants[index].nombreCT = ''
          newAssistants[index].ze = ''
          newAssistants[index].sector = ''
          newAssistants[index].modalidad = ''
          newAssistants[index].municipio = ''
          newAssistants[index].region = ''
          newAssistants[index].valle = ''
        }
      }
    }
    setAssistants(newAssistants)
  }

  const handleSave = () => {
    if (!courseData.id || !courseData.cursoNombre) {
      toast({ variant: "destructive", title: "Datos del curso incompletos", description: "Folio y Nombre del curso son obligatorios." })
      return
    }

    const validAssistants = assistants.filter(a => a.rfc && a.nombres)
    if (validAssistants.length === 0) {
      toast({ variant: "destructive", title: "Sin asistentes", description: "Debe registrar al menos un asistente con RFC y Nombre." })
      return
    }

    const newRecords: TrainingRecord[] = validAssistants.map((ast, idx) => ({
      ...courseData,
      id: editingId ? (editingId.includes('-') ? editingId.split('-')[0] + `-${idx}-${Date.now()}` : `${editingId}-${idx}-${Date.now()}`) : `${courseData.id}-${idx}-${Date.now()}`,
      asistentePaterno: ast.paterno,
      asistenteMaterno: ast.materno,
      asistenteNombres: ast.nombres,
      asistenteRFC: ast.rfc.toUpperCase(),
      asistenteGenero: ast.genero,
      asistenteFuncion: ast.funcion,
      asistenteEmail: ast.email,
      asistenteCCT: ast.cct.toUpperCase(),
      asistenteNombreCT: ast.nombreCT,
      asistenteZE: ast.ze,
      asistenteSector: ast.sector,
      asistenteModalidad: ast.modalidad,
      asistenteMunicipio: ast.municipio,
      asistenteRegion: ast.region,
      asistenteValle: ast.valle,
      evidencePhotos: [],
    }))

    let updated;
    if (editingId) {
      updated = [...newRecords, ...records.filter(r => !r.id.startsWith(editingId.split('-')[0]))]
    } else {
      updated = [...newRecords, ...records]
    }

    setRecords(updated)
    localStorage.setItem('training_records_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    resetForm()
    toast({ title: "Registro exitoso", description: `Se han guardado ${newRecords.length} registros de capacitación.` })
  }

  const resetForm = () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    setCourseData({
      ...initialCourseData,
      fechaInicio: today,
      fechaTermino: today
    })
    setAssistants([{ paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '' }])
    setEditingId(null)
  }

  const handleEdit = (record: TrainingRecord) => {
    const folio = record.id.split('-')[0];
    setCourseData({
      id: folio,
      cursoGrupo: record.cursoGrupo,
      cursoNombre: record.cursoNombre,
      duracionHoras: record.duracionHoras,
      fechaInicio: record.fechaInicio,
      fechaTermino: record.fechaTermino,
      instructores: record.instructores,
      numeroOficio: record.numeroOficio,
      materialUtilizado: record.materialUtilizado,
      cctSede: record.cctSede,
      setes: record.setes,
      observaciones: record.observaciones,
      alumnosBeneficiados: record.alumnosBeneficiados || 0,
      docentesBeneficiados: record.docentesBeneficiados || 0,
    })
    
    const relatedAssistants = records.filter(r => r.id.startsWith(folio)).map(r => ({
      paterno: r.asistentePaterno,
      materno: r.asistenteMaterno,
      nombres: r.asistenteNombres,
      rfc: r.asistenteRFC,
      genero: (r.asistenteGenero || '') as 'MASCULINO' | 'FEMENINO' | '',
      funcion: r.asistenteFuncion,
      email: r.asistenteEmail,
      cct: r.asistenteCCT,
      nombreCT: r.asistenteNombreCT,
      ze: r.asistenteZE,
      sector: r.asistenteSector,
      modalidad: r.asistenteModalidad,
      municipio: r.asistenteMunicipio,
      region: r.asistenteRegion,
      valle: r.asistenteValle,
    }));

    setAssistants(relatedAssistants.length > 0 ? relatedAssistants : [{
      paterno: record.asistentePaterno,
      materno: record.asistenteMaterno,
      nombres: record.asistenteNombres,
      rfc: record.asistenteRFC,
      genero: (record.asistenteGenero || '') as 'MASCULINO' | 'FEMENINO' | '',
      funcion: record.asistenteFuncion,
      email: record.asistenteEmail,
      cct: record.asistenteCCT,
      nombreCT: record.asistenteNombreCT,
      ze: record.asistenteZE,
      sector: record.asistenteSector,
      modalidad: record.asistenteModalidad,
      municipio: record.asistenteMunicipio,
      region: record.asistenteRegion,
      valle: record.asistenteValle,
    }]);

    setEditingId(record.id)
    setIsDialogOpen(true)
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase">Capacitación Institucional</h2>
          <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Control y Seguimiento de Personal Capacitado</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-black uppercase px-8 h-12 shadow-lg">
              <PlusCircle className="h-5 w-5" /> Iniciar Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[1400px] h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="uppercase font-black text-primary text-xl">Gestión de Curso y Asistentes</DialogTitle>
              <DialogDescription className="font-bold text-xs">Complete la información del curso y capture la lista de asistentes en la cuadrícula.</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="curso" className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 border-b bg-slate-50/50">
                <TabsList className="bg-transparent h-12 p-0 gap-6">
                  <TabsTrigger value="curso" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-[11px] font-black uppercase tracking-wider">1. Datos del Curso</TabsTrigger>
                  <TabsTrigger value="asistentes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-[11px] font-black uppercase tracking-wider">2. Lista de Asistentes (Captura Directa)</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="curso" className="h-full m-0 p-6 space-y-8 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="space-y-2"><Label className="text-xs font-black uppercase text-primary">Folio Registro</Label><Input className="font-bold border-primary/20" value={courseData.id} onChange={e => setCourseData({...courseData, id: e.target.value.toUpperCase()})} /></div>
                      <div className="space-y-2"><Label className="text-xs font-black uppercase text-primary">Grupo</Label><Input value={courseData.cursoGrupo} onChange={e => setCourseData({...courseData, cursoGrupo: e.target.value})} /></div>
                      <div className="md:col-span-2 space-y-2"><Label className="text-xs font-black uppercase text-primary">Nombre del Curso</Label><Input value={courseData.cursoNombre} onChange={e => setCourseData({...courseData, cursoNombre: e.target.value})} /></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="space-y-2"><Label className="text-xs font-black uppercase text-primary">Horas</Label><Input type="number" value={courseData.duracionHoras} onChange={e => setCourseData({...courseData, duracionHoras: parseInt(e.target.value) || 0})} /></div>
                      <div className="space-y-2"><Label className="text-xs font-black uppercase text-primary">Fecha Inicio</Label><Input type="date" value={courseData.fechaInicio} onChange={e => setCourseData({...courseData, fechaInicio: e.target.value})} /></div>
                      <div className="space-y-2"><Label className="text-xs font-black uppercase text-primary">Fecha Término</Label><Input type="date" value={courseData.fechaTermino} onChange={e => setCourseData({...courseData, fechaTermino: e.target.value})} /></div>
                      <div className="space-y-2"><Label className="text-xs font-black uppercase text-primary">No. Oficio</Label><Input value={courseData.numeroOficio} onChange={e => setCourseData({...courseData, numeroOficio: e.target.value})} /></div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-[11px] font-black uppercase text-primary border-b-2 border-primary/10 pb-1">Instructores Ponentes</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[0, 1, 2].map(idx => (
                          <div key={idx} className="space-y-2">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Instructor {idx + 1}</Label>
                            <Input value={courseData.instructores[idx]} onChange={e => {
                              const newInst = [...courseData.instructores];
                              newInst[idx] = e.target.value;
                              setCourseData({...courseData, instructores: newInst});
                            }} />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-slate-100">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase text-primary">Alumnos Ben.</Label>
                        <Input type="number" className="font-bold border-primary/20" value={courseData.alumnosBeneficiados} onChange={e => setCourseData({...courseData, alumnosBeneficiados: parseInt(e.target.value) || 0})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase text-primary">Docentes Ben.</Label>
                        <Input type="number" className="font-bold border-primary/20" value={courseData.docentesBeneficiados} onChange={e => setCourseData({...courseData, docentesBeneficiados: parseInt(e.target.value) || 0})} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 space-y-2"><Label className="text-xs font-black uppercase text-primary">CCT Sede</Label><Input className="font-mono uppercase border-primary/20" value={courseData.cctSede} onChange={e => setCourseData({...courseData, cctSede: e.target.value.toUpperCase()})} /></div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase text-primary">SETES</Label>
                        <Select value={courseData.setes} onValueChange={(val:any) => setCourseData({...courseData, setes: val})}>
                          <SelectTrigger className="border-primary/20"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="S">Sí</SelectItem><SelectItem value="N">No</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                </TabsContent>

                <TabsContent value="asistentes" className="h-full m-0 p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      <p className="text-[10px] font-bold text-blue-800 uppercase">Al ingresar el CCT de 10 dígitos, se autocompletarán Nombre C.T., ZE y datos geográficos.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleAddRow} className="gap-2 font-black uppercase text-[10px] border-primary text-primary hover:bg-primary/5">
                      <Plus className="h-4 w-4" /> Añadir Fila
                    </Button>
                  </div>

                  <div className="flex-1 overflow-hidden border rounded-xl shadow-sm">
                    <ScrollArea className="h-full">
                      <Table>
                        <TableHeader className="bg-slate-100 sticky top-0 z-10">
                          <TableRow>
                            <TableHead className="w-10 text-[10px] font-black uppercase">#</TableHead>
                            <TableHead className="min-w-[200px] text-[10px] font-black uppercase">Apellidos y Nombre(s)</TableHead>
                            <TableHead className="min-w-[150px] text-[10px] font-black uppercase">RFC</TableHead>
                            <TableHead className="min-w-[180px] text-[10px] font-black uppercase">Función</TableHead>
                            <TableHead className="min-w-[120px] text-[10px] font-black uppercase">Género</TableHead>
                            <TableHead className="min-w-[140px] text-[10px] font-black uppercase">CCT Plantel</TableHead>
                            <TableHead className="min-w-[200px] text-[10px] font-black uppercase">Nombre C.T.</TableHead>
                            <TableHead className="min-w-[60px] text-[10px] font-black uppercase">ZE</TableHead>
                            <TableHead className="min-w-[60px] text-[10px] font-black uppercase">Sector</TableHead>
                            <TableHead className="min-w-[120px] text-[10px] font-black uppercase">Modalidad</TableHead>
                            <TableHead className="min-w-[150px] text-[10px] font-black uppercase">Municipio</TableHead>
                            <TableHead className="min-w-[120px] text-[10px] font-black uppercase">Región</TableHead>
                            <TableHead className="min-w-[100px] text-[10px] font-black uppercase">Valle</TableHead>
                            <TableHead className="w-10 sticky right-0 bg-slate-100"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assistants.map((ast, idx) => (
                            <TableRow key={idx} className="hover:bg-slate-50/50">
                              <TableCell className="text-center font-bold text-xs text-muted-foreground">{idx + 1}</TableCell>
                              <TableCell className="p-2">
                                <div className="space-y-1">
                                  <Input placeholder="Ap. Paterno" className="h-8 text-[10px]" value={ast.paterno} onChange={e => updateAssistant(idx, 'paterno', e.target.value)} />
                                  <Input placeholder="Ap. Materno" className="h-8 text-[10px]" value={ast.materno} onChange={e => updateAssistant(idx, 'materno', e.target.value)} />
                                  <Input placeholder="Nombre(s)" className="h-8 text-[10px] font-bold" value={ast.nombres} onChange={e => updateAssistant(idx, 'nombres', e.target.value)} />
                                </div>
                              </TableCell>
                              <TableCell className="p-2">
                                <Input placeholder="RFC" className="h-8 text-[10px] font-mono uppercase" value={ast.rfc} onChange={e => updateAssistant(idx, 'rfc', e.target.value.toUpperCase())} />
                              </TableCell>
                              <TableCell className="p-2">
                                <Select value={ast.funcion} onValueChange={(val: any) => updateAssistant(idx, 'funcion', val)}>
                                  <SelectTrigger className="h-8 text-[10px]">
                                    <SelectValue placeholder="Seleccionar función..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {FUNCIONES.map(f => (
                                      <SelectItem key={f} value={f} className="text-[10px]">{f}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="p-2">
                                <Select value={ast.genero} onValueChange={(val: any) => updateAssistant(idx, 'genero', val)}>
                                  <SelectTrigger className="h-8 text-[10px]">
                                    <SelectValue placeholder="Género" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="MASCULINO" className="text-[10px]">MASCULINO</SelectItem>
                                    <SelectItem value="FEMENINO" className="text-[10px]">FEMENINO</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="p-2">
                                <Input placeholder="15DESXXXXX" className="h-8 text-[10px] font-mono font-black uppercase border-primary/30" value={ast.cct} onChange={e => updateAssistant(idx, 'cct', e.target.value.toUpperCase())} maxLength={10} />
                              </TableCell>
                              <TableCell className="p-2">
                                <Input value={ast.nombreCT} readOnly className="h-8 text-[10px] bg-slate-50 font-bold uppercase" />
                              </TableCell>
                              <TableCell className="p-2">
                                <Input value={ast.ze} readOnly className="h-8 text-[10px] bg-slate-50 text-center" />
                              </TableCell>
                              <TableCell className="p-2">
                                <Input value={ast.sector} readOnly className="h-8 text-[10px] bg-slate-50 text-center" />
                              </TableCell>
                              <TableCell className="p-2">
                                <Input value={ast.modalidad} readOnly className="h-8 text-[10px] bg-slate-50 uppercase text-[9px]" />
                              </TableCell>
                              <TableCell className="p-2">
                                <Input value={ast.municipio} readOnly className="h-8 text-[10px] bg-slate-50 uppercase" />
                              </TableCell>
                              <TableCell className="p-2">
                                <Input value={ast.region} readOnly className="h-8 text-[10px] bg-slate-50 uppercase" />
                              </TableCell>
                              <TableCell className="p-2">
                                <Input value={ast.valle} readOnly className="h-8 text-[10px] bg-slate-50 uppercase" />
                              </TableCell>
                              <TableCell className="p-2 sticky right-0 bg-white/80 backdrop-blur-sm shadow-l">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveRow(idx)} disabled={assistants.length === 1}>
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
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="p-6 border-t bg-slate-50 flex items-center justify-between">
              <div className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Asistentes en lista: {assistants.filter(a => a.rfc && a.nombres).length}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="font-bold uppercase text-xs">Cancelar</Button>
                <Button onClick={handleSave} className="font-black uppercase text-xs px-10 shadow-md">
                  {editingId ? 'Actualizar Capacitación' : 'Guardar y Finalizar Registro'}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-md border-t-4 border-t-primary overflow-hidden">
        <CardHeader className="bg-slate-50/50">
          <CardTitle className="flex items-center gap-2 text-primary uppercase font-black text-lg">
            <GraduationCap className="h-6 w-6" />
            Control de Personal Capacitado
          </CardTitle>
          <CardDescription className="font-bold text-xs uppercase tracking-tight">Historial de registros de capacitación institucional.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100">
                <TableRow>
                  <TableHead className="font-black text-[10px] uppercase">ID</TableHead>
                  <TableHead className="font-black text-[10px] uppercase">Curso / Grupo</TableHead>
                  <TableHead className="font-black text-[10px] uppercase">Asistente Capacitado</TableHead>
                  <TableHead className="font-black text-[10px] uppercase">RFC</TableHead>
                  <TableHead className="font-black text-[10px] uppercase">Género</TableHead>
                  <TableHead className="font-black text-[10px] uppercase">Función</TableHead>
                  <TableHead className="font-black text-[10px] uppercase">Plantel de Origen</TableHead>
                  <TableHead className="text-right font-black text-[10px] uppercase">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length > 0 ? records.map((record) => (
                  <TableRow key={record.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="font-black text-xs text-primary">{record.id.split('-')[0]}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-slate-700">{record.cursoNombre}</span>
                        <span className="text-[9px] text-muted-foreground uppercase">{record.cursoGrupo}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {record.asistenteNombres} {record.asistentePaterno} {record.asistenteMaterno}
                    </TableCell>
                    <TableCell className="font-mono text-xs uppercase text-muted-foreground">{record.asistenteRFC}</TableCell>
                    <TableCell className="text-[10px] font-bold uppercase">{record.asistenteGenero || '-'}</TableCell>
                    <TableCell className="text-[10px] font-bold text-slate-600">{record.asistenteFuncion || '-'}</TableCell>
                    <TableCell className="text-[10px] font-bold">
                       <div className="flex flex-col">
                          <span>{record.asistenteCCT}</span>
                          <span className="text-[9px] text-muted-foreground truncate max-w-[150px]">{record.asistenteNombreCT}</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => handleEdit(record)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-20 bg-slate-50/20">
                      <div className="flex flex-col items-center gap-2 opacity-50">
                        <GraduationCap className="h-10 w-10 text-primary" />
                        <p className="font-black text-xs uppercase">Sin registros de capacitación disponibles.</p>
                      </div>
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
