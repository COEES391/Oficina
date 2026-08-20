
'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
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
import { schoolsDirectory, type SchoolInfo } from "@/lib/schools-directory"
import { 
  PlusCircle, 
  GraduationCap, 
  Users, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  Plus, 
  School, 
  Search, 
  MapPin, 
  LayoutGrid, 
  Info, 
  CalendarDays, 
  Building2,
  X,
  AlertCircle,
  ChevronRight,
  Upload,
  FileText,
  ImageIcon,
  Archive
} from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { Badge } from '@/components/ui/badge'
import { VisitSchedulerDialog } from '@/components/VisitSchedulerDialog'
import { cn } from '@/lib/utils'
import Image from 'next/image'

const FILE_SIZE_LIMIT = 2 * 1024 * 1024; // 2.0 MB

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
  "PAAE",
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
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedSedeInfo, setSelectedSedeInfo] = useState<SchoolInfo | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [officeFilter, setOficinaFilter] = useState('all')
  
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // CCT Dynamic Logic
  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([])
  const [dialogSearchTerm, setDialogSearchTerm] = useState('')
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddForm, setQuickAddForm] = useState<SchoolInfo>({
    region: '', valle: 'MEXICO', municipio: '', subsistema: 'FEDERALIZADO', control: 'OFICIAL',
    nivel: 'SECUNDARIA', servicioEducativo: 'SECUNDARIA GENERAL', cct: '', turno: 'MATUTINO',
    nombre: '', domicilio: '', localidad: '', telefono: '', zonaEscolar: '', sector: '',
    director: '', hombres: 0, mujeres: 0, alumnos: 0, grupos: 0, maestros: 0, administrativos: 0,
    aulasExistentes: 0, aulasEnUso: 0, modalidad: 'DES'
  })

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
    reportPdf: '',
    evidencePhotos: [] as string[]
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

    // Sync Schools Master
    const storedSchools = JSON.parse(localStorage.getItem('schools_master_full_v21') || '[]')
    if (storedSchools.length > 0) {
      setAllSchools(storedSchools)
    } else {
      setAllSchools(schoolsDirectory)
    }
    
    const today = format(new Date(), 'yyyy-MM-dd')
    setCourseData(prev => ({
      ...prev,
      fechaInicio: today,
      fechaTermino: today
    }))
  }, [])

  const filteredRecords = useMemo(() => {
    let filtered = records;
    if (searchTerm) {
      const term = searchTerm.toUpperCase();
      filtered = filtered.filter(r => {
        const cctMatch = (r.asistenteCCT || '').toUpperCase().includes(term) || (r.cctSede || '').toUpperCase().includes(term);
        const instructorMatch = r.instructores?.some(inst => (inst || '').toUpperCase().includes(term));
        const assistantNameMatch = `${r.asistenteNombres} ${r.asistentePaterno} ${r.asistenteMaterno}`.toUpperCase().includes(term);
        const courseMatch = (r.cursoNombre || '').toUpperCase().includes(term);
        const folioMatch = (r.id || '').toUpperCase().includes(term);
        return cctMatch || instructorMatch || assistantNameMatch || courseMatch || folioMatch;
      });
    }

    if (officeFilter !== 'all') {
      filtered = filtered.filter(r => 
        (r.asistenteValle || '').toUpperCase() === officeFilter.toUpperCase() ||
        (r.asistenteRegion || '').toUpperCase() === officeFilter.toUpperCase() ||
        (r.asistenteMunicipio || '').toUpperCase() === officeFilter.toUpperCase()
      );
    }

    return filtered;
  }, [searchTerm, records, officeFilter]);

  const handleCctSedeChange = (value: string) => {
    const cleanValue = value.toUpperCase()
    setCourseData(prev => ({ ...prev, cctSede: cleanValue }))

    if (cleanValue.length === 10) {
      const match = allSchools.find(s => s.cct.toUpperCase() === cleanValue)
      if (match) {
        setSelectedSedeInfo(match)
        toast({
          title: "Sede Identificada",
          description: `Se han jalado los datos de: ${match.nombre}`,
        })
      } else {
        setSelectedSedeInfo(null)
      }
    } else {
      setSelectedSedeInfo(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'image') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > FILE_SIZE_LIMIT) {
      toast({ variant: "destructive", title: "Archivo demasiado pesado", description: "El límite es de 2.0 MB por archivo." })
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      if (type === 'pdf') {
        setCourseData(prev => ({ ...prev, reportPdf: base64 }))
      } else {
        setCourseData(prev => ({ ...prev, evidencePhotos: [...(prev.evidencePhotos || []), base64] }))
      }
      toast({ title: "Evidencia cargada" })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setCourseData(prev => ({
      ...prev,
      evidencePhotos: (prev.evidencePhotos || []).filter((_, i) => i !== index)
    }))
  }

  const handleQuickAddCct = () => {
    if (!quickAddForm.cct || !quickAddForm.nombre || !quickAddForm.municipio) {
      toast({ variant: "destructive", title: "Faltan datos", description: "CCT, Nombre y Municipio son obligatorios." }); return;
    }
    const newSchool: SchoolInfo = { 
      ...quickAddForm, 
      cct: quickAddForm.cct.toUpperCase(), 
      nombre: quickAddForm.nombre.toUpperCase(), 
      municipio: quickAddForm.municipio.toUpperCase(),
      domicilio: quickAddForm.domicilio.toUpperCase(),
      localidad: quickAddForm.localidad.toUpperCase(),
      sector: quickAddForm.sector.toUpperCase(),
      zonaEscolar: quickAddForm.zonaEscolar.toUpperCase(),
      modalidad: quickAddForm.modalidad.toUpperCase()
    };
    const updated = [newSchool, ...allSchools];
    setAllSchools(updated);
    localStorage.setItem('schools_master_full_v21', JSON.stringify(updated));
    handleCctSedeChange(newSchool.cct);
    setIsQuickAddOpen(false);
    setDialogSearchTerm('');
    toast({ title: "CCT Registrado en Base Maestra" });
  }

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
        const school = allSchools.find(s => s.cct.toUpperCase() === cleanValue)
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
      toast({ variant: "destructive", title: "Datos del curso incompletos", description: "El # de Solicitud y Nombre del curso son obligatorios." })
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
      reportPdf: courseData.reportPdf,
      evidencePhotos: courseData.evidencePhotos || [],
      observaciones: courseData.observaciones || '',
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

  const handleDelete = (id: string) => {
    const updated = records.filter(r => r.id !== id)
    setRecords(updated)
    localStorage.setItem('training_records_full', JSON.stringify(updated))
    toast({ title: "Registro eliminado", description: "El asistente ha sido retirado de la base de capacitación." })
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
    setSelectedSedeInfo(null)
    setDialogSearchTerm('')
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
      observaciones: record.observaciones || '',
      alumnosBeneficiados: record.alumnosBeneficiados || 0,
      docentesBeneficiados: record.docentesBeneficiados || 0,
      reportPdf: record.reportPdf || '',
      evidencePhotos: record.evidencePhotos || []
    })

    if (record.cctSede) {
      const match = allSchools.find(s => s.cct.toUpperCase() === record.cctSede.toUpperCase())
      if (match) setSelectedSedeInfo(match)
    }
    
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

  const schoolSearchResults = useMemo(() => {
    if (!dialogSearchTerm || dialogSearchTerm.length < 3) return [];
    const term = dialogSearchTerm.toUpperCase();
    return allSchools.filter(s => s.cct.includes(term) || s.nombre.includes(term)).slice(0, 5);
  }, [allSchools, dialogSearchTerm]);

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase">Capacitación Institucional</h2>
          <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Control y Seguimiento de Personal Capacitado</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="btn-institutional h-12 px-10 rounded-xl shadow-lg">
              <PlusCircle className="h-5 w-5 mr-2" /> Iniciar Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[1400px] h-[95vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem]">
            <DialogHeader className="p-8 pb-2">
              <DialogTitle className="uppercase font-black text-primary text-2xl flex items-center gap-3">
                <GraduationCap className="h-8 w-8 text-accent" /> Gestión de Curso y Asistentes
              </DialogTitle>
              <DialogDescription className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Complete la información del curso y capture la lista de asistentes en la cuadrícula.</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="curso" className="flex-1 flex flex-col overflow-hidden">
              <div className="px-8 border-b bg-slate-50/50">
                <TabsList className="bg-transparent h-14 p-0 gap-8">
                  <TabsTrigger value="curso" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all">1. Datos del Curso</TabsTrigger>
                  <TabsTrigger value="asistentes" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all">2. Lista de Asistentes (Captura Directa)</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="curso" className="h-full m-0 p-0 overflow-hidden">
                  <ScrollArea className="h-full p-8">
                    <div className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="space-y-2">
                          <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2"># Solicitud</Label>
                          <Input className="h-14 font-mono uppercase border-primary/20 text-lg bg-slate-50 shadow-inner focus:bg-white transition-all" value={courseData.id} onChange={e => setCourseData({...courseData, id: e.target.value.toUpperCase()})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2">Grupo de Capacitación</Label>
                          <Input className="h-14 bg-slate-50 border-primary/10 focus:bg-white" value={courseData.cursoGrupo} onChange={e => setCourseData({...courseData, cursoGrupo: e.target.value})} />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2">Nombre Completo del Curso</Label>
                          <Input className="h-14 bg-slate-50 border-primary/10 focus:bg-white font-bold" value={courseData.cursoNombre} onChange={e => setCourseData({...courseData, cursoNombre: e.target.value})} />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="space-y-2">
                          <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2">Duración (Horas)</Label>
                          <Input type="number" className="h-14 bg-slate-50 border-primary/10 focus:bg-white text-center font-black text-xl" value={courseData.duracionHoras} onChange={e => setCourseData({...courseData, duracionHoras: parseInt(e.target.value) || 0})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2">Fecha de Inicio</Label>
                          <Input type="date" className="h-14 bg-slate-50 border-primary/10 focus:bg-white font-bold" value={courseData.fechaInicio} onChange={e => setCourseData({...courseData, fechaInicio: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2">Fecha de Término</Label>
                          <Input type="date" className="h-14 bg-slate-50 border-primary/10 focus:bg-white font-bold" value={courseData.fechaTermino} onChange={e => setCourseData({...courseData, fechaTermino: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2">Número de Oficio COEES</Label>
                          <Input className="h-14 bg-slate-50 border-primary/10 focus:bg-white font-mono" value={courseData.numeroOficio} onChange={e => setCourseData({...courseData, numeroOficio: e.target.value})} />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-[11px] font-black uppercase text-accent border-b-2 border-accent/10 pb-2 tracking-[0.2em] flex items-center gap-2">
                          <Users className="h-4 w-4" /> Instructores Ponentes Responsables
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {[0, 1, 2].map(idx => (
                            <div key={idx} className="space-y-2">
                              <Label className="text-[10px] font-black text-muted-foreground uppercase pl-2">Instructor {idx + 1}</Label>
                              <Input className="h-12 bg-white border-slate-200 shadow-sm" value={courseData.instructores[idx]} onChange={e => {
                                const newInst = [...courseData.instructores];
                                newInst[idx] = e.target.value;
                                setCourseData({...courseData, instructores: newInst});
                              }} />
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-6 border-t border-slate-100">
                        <div className="space-y-2">
                          <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2">Alumnos Beneficiados</Label>
                          <Input type="number" className="h-14 font-black border-primary/20 text-center text-xl bg-primary/5" value={courseData.alumnosBeneficiados} onChange={e => setCourseData({...courseData, alumnosBeneficiados: parseInt(e.target.value) || 0})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2">Docentes Beneficiados</Label>
                          <Input type="number" className="h-14 font-black border-primary/20 text-center text-xl bg-primary/5" value={courseData.docentesBeneficiados} onChange={e => setCourseData({...courseData, docentesBeneficiados: parseInt(e.target.value) || 0})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2">Asignación SETES</Label>
                          <Select value={courseData.setes} onValueChange={(val:any) => setCourseData({...courseData, setes: val})}>
                            <SelectTrigger className="border-primary/20 h-14 font-black text-lg bg-white shadow-sm transition-all"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="S" className="font-bold">SÍ (Asignado)</SelectItem>
                              <SelectItem value="N" className="font-bold">NO (Sin asignar)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-8 pt-8 border-t border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div className="md:col-span-2 space-y-2 relative">
                            <Label className="text-[11px] font-black uppercase text-primary tracking-widest flex items-center gap-2 pl-2">
                              <Search className="h-4 w-4 text-accent" /> CCT Sede (Lugar de Realización)
                            </Label>
                            <Input 
                              placeholder="Teclear CCT o Nombre del Plantel..."
                              className="font-mono uppercase border-primary/30 h-16 text-2xl shadow-inner bg-white focus:ring-4 focus:ring-primary/10" 
                              value={dialogSearchTerm} 
                              onChange={e => setDialogSearchTerm(e.target.value)} 
                            />
                            {dialogSearchTerm.length > 2 && (
                              <div className="absolute top-26 left-0 right-0 max-h-60 overflow-auto bg-white border border-primary/10 rounded-2xl shadow-2xl z-50 divide-y divide-slate-50">
                                {schoolSearchResults.map(s => (
                                  <div key={`sede-res-${s.cct}-${s.turno}`} className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center group" onClick={() => { handleCctSedeChange(s.cct); setDialogSearchTerm(''); }}>
                                    <div className="flex items-center gap-4">
                                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                        <School className="h-5 w-5" />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-800 uppercase">{s.nombre}</span>
                                        <span className="text-[10px] font-mono text-muted-foreground">{s.cct} • {s.turno}</span>
                                      </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                                  </div>
                                ))}
                                {schoolSearchResults.length === 0 && (
                                  <div className="p-6 text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">CCT no registrado en la base maestra</p>
                                    <Button onClick={() => { setQuickAddForm({...quickAddForm, cct: ''}); setIsQuickAddOpen(true); }} variant="outline" className="h-10 px-6 rounded-xl border-primary/20 text-primary font-black uppercase text-[9px] gap-2 hover:bg-primary/5 shadow-sm">
                                      <Plus className="h-4 w-4" /> Alta Rápida de Plantel
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {selectedSedeInfo ? (
                          <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-primary/20 shadow-2xl space-y-8 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                                <School className="h-40 w-40" />
                             </div>
                             
                             <div className="flex items-center gap-6 border-b border-primary/10 pb-6 relative z-10">
                                <div className="h-20 w-20 rounded-3xl bg-primary text-white flex items-center justify-center shadow-xl">
                                  <School className="h-10 w-10" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] leading-none mb-2">Información de la Sede (Autocompletado)</p>
                                  <h4 className="text-2xl font-black text-slate-800 uppercase leading-none tracking-tight">{selectedSedeInfo.nombre}</h4>
                                  <p className="text-xs font-mono font-bold text-muted-foreground mt-2 inline-block px-3 py-1 bg-white rounded-full shadow-sm">CCT: {selectedSedeInfo.cct} • {selectedSedeInfo.modalidad}</p>
                                </div>
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 relative z-10">
                                <div className="space-y-2 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 group hover:border-primary/30 transition-colors">
                                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <LayoutGrid className="h-3 w-3 text-accent" /> Sector
                                  </div>
                                  <p className="text-lg font-black text-slate-700 leading-none">{selectedSedeInfo.sector}</p>
                                </div>
                                <div className="space-y-2 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 group hover:border-primary/30 transition-colors">
                                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <Info className="h-3 w-3 text-accent" /> Zona Escolar
                                  </div>
                                  <p className="text-lg font-black text-slate-700 leading-none">{selectedSedeInfo.zonaEscolar}</p>
                                </div>
                                <div className="space-y-2 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 group hover:border-primary/30 transition-colors">
                                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <MapPin className="h-3 w-3 text-accent" /> Municipio
                                  </div>
                                  <p className="text-lg font-black text-slate-700 leading-none truncate">{selectedSedeInfo.municipio}</p>
                                </div>
                                <div className="space-y-2 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 group hover:border-primary/30 transition-colors">
                                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <MapPin className="h-3 w-3 text-accent" /> Región
                                  </div>
                                  <p className="text-lg font-black text-slate-700 leading-none">{selectedSedeInfo.region}</p>
                                </div>
                                <div className="space-y-2 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 group hover:border-primary/30 transition-colors">
                                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <MapPin className="h-3 w-3 text-accent" /> Valle
                                  </div>
                                  <p className="text-lg font-black text-slate-700 leading-none">Valle de {selectedSedeInfo.valle}</p>
                                </div>
                             </div>
                          </div>
                        ) : (
                          <div className="p-8 border-2 border-dashed rounded-[2.5rem] border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                             <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <Search className="h-8 w-8" />
                             </div>
                             <div>
                                <h5 className="text-sm font-black uppercase text-slate-500">Esperando CCT de Sede</h5>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Seleccione de la lista para jalar automáticamente los datos geográficos del plantel.</p>
                             </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 pt-4">
                        <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2">Observaciones Técnicas y Acuerdos</Label>
                        <Input value={courseData.observaciones} onChange={e => setCourseData({...courseData, observaciones: e.target.value})} className="h-16 bg-slate-50 border-primary/10 rounded-2xl px-6 shadow-inner" placeholder="Notas adicionales sobre la capacitación..." />
                      </div>

                      <div className="space-y-6 pt-6 border-t-2 border-primary/5">
                        <div className="flex items-center gap-3 border-b-2 border-primary/10 pb-2">
                          <div className="h-10 w-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-lg">
                            <Archive className="h-6 w-6" />
                          </div>
                          <h3 className="text-sm font-black uppercase text-primary tracking-wider">Evidencia Digital (PDF e imágenes PNG)</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase text-slate-400 pl-2">Reporte de Capacitación (PDF)</Label>
                            <div className={cn("p-6 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all relative group", courseData.reportPdf ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200 hover:border-primary/40")}>
                              {courseData.reportPdf ? (
                                <div className="flex flex-col items-center gap-3">
                                  <div className="h-14 w-14 rounded-2xl bg-white shadow-xl flex items-center justify-center text-emerald-600">
                                    <FileText className="h-8 w-8" />
                                  </div>
                                  <p className="text-[10px] font-black uppercase text-emerald-700">REPORTE CARGADO</p>
                                  <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8 text-rose-500 hover:bg-rose-100 rounded-full" onClick={() => setCourseData(prev => ({...prev, reportPdf: ''}))}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <Upload className="h-8 w-8 text-slate-300 group-hover:scale-110 transition-transform" />
                                  <div className="text-center">
                                    <p className="text-[10px] font-black uppercase text-slate-700">Subir Formato PDF</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Límite: 2.0 MB</p>
                                  </div>
                                  <Button variant="outline" size="sm" onClick={() => pdfInputRef.current?.click()} className="h-9 px-6 rounded-xl text-[9px] font-black uppercase border-primary/20 hover:bg-primary/5">Seleccionar</Button>
                                </>
                              )}
                              <input type="file" accept=".pdf" className="hidden" ref={pdfInputRef} onChange={(e) => handleFileChange(e, 'pdf')} />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase text-slate-400 pl-2">Galería Fotográfica (PNG)</Label>
                            <div className="p-6 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3 group hover:border-primary/40 transition-all relative">
                              <ImageIcon className="h-8 w-8 text-slate-300 group-hover:scale-110 transition-transform" />
                              <div className="text-center">
                                <p className="text-[10px] font-black uppercase text-slate-700">Adjuntar Imágenes PNG</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Máximo 2.0 MB por archivo</p>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} className="h-9 px-6 rounded-xl text-[9px] font-black uppercase border-primary/20 hover:bg-primary/5">Añadir Imagen</Button>
                              <input type="file" accept=".png" className="hidden" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} />
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3 mt-4">
                              {(courseData.evidencePhotos || []).map((img, idx) => (
                                <div key={`ev-img-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-white shadow-md group">
                                  <Image src={img} alt={`Evidencia ${idx}`} fill className="object-cover" />
                                  <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 h-5 w-5 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="asistentes" className="h-full m-0 p-8 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4 shadow-sm">
                      <CheckCircle2 className="h-6 w-6 text-blue-600" />
                      <p className="text-[10px] font-black text-blue-800 uppercase leading-relaxed tracking-wide">
                        Sincronización Maestra: Al ingresar el CCT de cualquier trabajador, <br /> el sistema jala automáticamente el Nombre C.T., ZE y Sector desde la base actualizada.
                      </p>
                    </div>
                    <Button onClick={handleAddRow} className="gap-2 font-black uppercase text-[11px] h-12 px-8 shadow-md hover:scale-105 transition-all">
                      <Plus className="h-5 w-5" /> Añadir Servidor Público
                    </Button>
                  </div>

                  <div className="flex-1 overflow-hidden border-2 border-slate-100 rounded-[2rem] shadow-2xl bg-white">
                    <ScrollArea className="h-full">
                      <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10">
                          <TableRow>
                            <TableHead className="w-12 text-[10px] font-black uppercase text-center">#</TableHead>
                            <TableHead className="min-w-[250px] text-[10px] font-black uppercase">Apellidos y Nombre(s)</TableHead>
                            <TableHead className="min-w-[150px] text-[10px] font-black uppercase">RFC Oficial</TableHead>
                            <TableHead className="min-w-[180px] text-[10px] font-black uppercase">Función</TableHead>
                            <TableHead className="min-w-[140px] text-[10px] font-black uppercase">CCT de Adscripción</TableHead>
                            <TableHead className="min-w-[250px] text-[10px] font-black uppercase">Plantel (Autocompletado)</TableHead>
                            <TableHead className="min-w-[80px] text-[10px] font-black uppercase text-center">ZE</TableHead>
                            <TableHead className="min-w-[80px] text-[10px] font-black uppercase text-center">Sector</TableHead>
                            <TableHead className="w-16 sticky right-0 bg-slate-50 shadow-l"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assistants.map((ast, idx) => (
                            <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors group">
                              <TableCell className="text-center font-black text-xs text-muted-foreground">{idx + 1}</TableCell>
                              <TableCell className="p-3">
                                <div className="grid grid-cols-1 gap-1">
                                  <Input placeholder="Paterno" className="h-9 text-[10px] uppercase font-bold" value={ast.paterno} onChange={e => updateAssistant(idx, 'paterno', e.target.value.toUpperCase())} />
                                  <Input placeholder="Materno" className="h-9 text-[10px] uppercase font-bold" value={ast.materno} onChange={e => updateAssistant(idx, 'materno', e.target.value.toUpperCase())} />
                                  <Input placeholder="Nombre(s)" className="h-9 text-[10px] uppercase font-black text-primary border-primary/20 bg-primary/5" value={ast.nombres} onChange={e => updateAssistant(idx, 'nombres', e.target.value.toUpperCase())} />
                                </div>
                              </TableCell>
                              <TableCell className="p-3">
                                <Input placeholder="13 DÍGITOS" className="h-10 text-[11px] font-mono uppercase font-black" value={ast.rfc} onChange={e => updateAssistant(idx, 'rfc', e.target.value.toUpperCase())} maxLength={13} />
                              </TableCell>
                              <TableCell className="p-3">
                                <Select value={ast.function} onValueChange={(val: any) => updateAssistant(idx, 'funcion', val)}>
                                  <SelectTrigger className="h-10 text-[10px] font-bold uppercase">
                                    <SelectValue placeholder="FUNCIÓN..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {FUNCIONES.map(f => (
                                      <SelectItem key={f} value={f} className="text-[10px] font-bold uppercase">{f}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="p-3">
                                <Input placeholder="15DES0000X" className="h-10 text-[11px] font-mono font-black uppercase border-primary/30 bg-white" value={ast.cct} onChange={e => updateAssistant(idx, 'cct', e.target.value.toUpperCase())} maxLength={10} />
                              </TableCell>
                              <TableCell className="p-3">
                                <div className="space-y-1">
                                  <Input value={ast.nombreCT} readOnly className="h-9 text-[10px] bg-slate-100 border-none font-black uppercase text-slate-600" />
                                  <Input value={ast.municipio} readOnly className="h-7 text-[8px] bg-slate-100 border-none font-bold uppercase text-muted-foreground" />
                                </div>
                              </TableCell>
                              <TableCell className="p-3">
                                <Input value={ast.ze} readOnly className="h-10 text-center text-[10px] bg-slate-100 border-none font-black text-slate-700" />
                              </TableCell>
                              <TableCell className="p-3">
                                <Input value={ast.sector} readOnly className="h-10 text-center text-[10px] bg-slate-100 border-none font-black text-slate-700" />
                              </TableCell>
                              <TableCell className="p-3 sticky right-0 bg-white/90 backdrop-blur-md shadow-l">
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => handleRemoveRow(idx)} disabled={assistants.length === 1}>
                                  <Trash2 className="h-5 w-5" />
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

            <DialogFooter className="p-8 border-t bg-slate-50 flex items-center justify-between">
              <div className="text-[11px] font-black uppercase text-primary flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
                <Users className="h-5 w-5 text-accent" /> Asistentes en lista: {assistants.filter(a => a.rfc && a.nombres).length}
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="font-bold uppercase text-xs rounded-xl h-14 px-10 border-slate-200">Cancelar</Button>
                <Button onClick={handleSave} className="btn-institutional px-16 h-14 text-xs rounded-xl">
                  {editingId ? 'Actualizar Capacitación' : 'Guardar y Finalizar Registro'}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="executive-card p-6 bg-white/80 border-none shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-6">
           <div className="flex items-center gap-3 w-full md:w-auto">
              <Search className="h-5 w-5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buscador Operativo:</span>
           </div>
           
           <div className="relative flex-1 w-full">
              <Input 
                placeholder="FILTRAR POR CCT, INSTRUCTOR O CURSO..." 
                className="h-12 rounded-xl bg-slate-50 border-primary/10 pl-12 text-sm font-bold uppercase shadow-inner focus:bg-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
           </div>

           <div className="flex items-center gap-4 w-full md:w-auto">
              <Select value={officeFilter} onValueChange={setOficinaFilter}>
                <SelectTrigger className="h-12 w-full md:w-[240px] rounded-xl border-primary/10 bg-white text-[10px] font-black uppercase shadow-sm">
                   <div className="flex items-center gap-2">
                     <Building2 className="h-4 w-4 text-primary" />
                     <SelectValue placeholder="OFICINA DE ATENCIÓN..." />
                   </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">
                  <SelectItem value="all" className="text-[10px] font-black uppercase">Todas las Oficinas</SelectItem>
                  <SelectItem value="TOLUCA" className="text-[10px] font-black uppercase">Toluca</SelectItem>
                  <SelectItem value="ECATEPEC" className="text-[10px] font-black uppercase">Ecatepec</SelectItem>
                  <SelectItem value="NAUCALPAN" className="text-[10px] font-black uppercase">Naucalpan</SelectItem>
                  <SelectItem value="NEZAHUALCOYOTL" className="text-[10px] font-black uppercase">Nezahualcóyotl</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="h-12 px-6 border-primary/20 text-primary font-black uppercase text-[10px] gap-2 rounded-xl hover:bg-primary/5 shadow-sm" onClick={() => setIsSchedulerOpen(true)}>
                <CalendarDays className="h-5 w-5" /> Agenda de Visitas
              </Button>
           </div>
        </div>
      </Card>

      <Card className="executive-card p-0 shadow-xl overflow-hidden border-t-8 border-t-primary">
        <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100">
          <CardTitle className="flex items-center gap-4 text-primary uppercase font-black text-2xl">
            <GraduationCap className="h-10 w-10 text-accent" />
            Control de Personal Capacitado
          </CardTitle>
          <CardDescription className="font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground mt-2">Bitácora Maestra de Actualización Docente y Administrativa</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100/50">
                <TableRow>
                  <TableHead className="font-black text-[10px] uppercase w-20 text-center">ID</TableHead>
                  <TableHead className="font-black text-[10px] uppercase min-w-[200px]">Curso / Grupo</TableHead>
                  <TableHead className="font-black text-[10px] uppercase min-w-[250px]">Asistente Capacitado</TableHead>
                  <TableHead className="font-black text-[10px] uppercase">RFC</TableHead>
                  <TableHead className="font-black text-[10px] uppercase">Función</TableHead>
                  <TableHead className="font-black text-[10px] uppercase">Plantel de Origen</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-center">SETES</TableHead>
                  <TableHead className="text-right font-black text-[10px] uppercase pr-10">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length > 0 ? filteredRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-slate-50 transition-colors group">
                    <TableCell className="font-black text-xs text-primary text-center">#{record.id.split('-')[0]}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-black text-xs text-slate-700 uppercase tracking-tight">{record.cursoNombre}</span>
                        <span className="text-[9px] font-muted-foreground font-black uppercase tracking-widest mt-1">{record.cursoGrupo}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold uppercase text-slate-600">
                      {record.asistenteNombres} {record.asistentePaterno} {record.asistenteMaterno}
                    </TableCell>
                    <TableCell className="font-mono text-xs uppercase font-black text-primary">{record.asistenteRFC}</TableCell>
                    <TableCell className="text-[10px] font-black uppercase">
                       <Badge variant="outline" className="border-slate-200 text-slate-500">{record.asistenteFuncion || '-'}</Badge>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-primary">{record.asistenteCCT}</span>
                          <span className="text-[9px] font-muted-foreground font-bold truncate max-w-[180px] uppercase">{record.asistenteNombreCT}</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-center">
                       <Badge variant={record.setes === 'S' ? 'default' : 'secondary'} className={record.setes === 'S' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                         {record.setes === 'S' ? 'SÍ' : 'NO'}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-10 w-10 hover:text-primary hover:bg-primary/5 rounded-xl transition-all" onClick={() => handleEdit(record)}>
                          <Pencil className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" onClick={() => handleDelete(record.id)}>
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-28 bg-slate-50/20">
                      <div className="flex flex-col items-center gap-4 opacity-40">
                        <GraduationCap className="h-16 w-16 text-primary" />
                        <p className="font-black text-sm uppercase tracking-[0.2em] text-muted-foreground">
                          {searchTerm || officeFilter !== 'all' ? 'No se encontraron registros que coincidan con la búsqueda.' : 'Sin registros de capacitación disponibles en el sistema.'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de Alta Rápida de CCT */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-[#B38E5D] text-white">
            <DialogTitle className="uppercase font-black text-lg flex items-center gap-3">
              <PlusCircle className="h-6 w-6" /> Registro de Nuevo CCT
            </DialogTitle>
            <DialogDescription className="text-white/80 text-[10px] font-bold uppercase mt-1">
              Sume un nuevo plantel a la base maestra del sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">CCT (10 Dígitos)</Label>
                  <Input value={quickAddForm.cct} onChange={e => setQuickAddForm({...quickAddForm, cct: e.target.value.toUpperCase()})} maxLength={10} className="font-mono font-black border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Nombre del Plantel</Label>
                  <Input value={quickAddForm.nombre} onChange={e => setQuickAddForm({...quickAddForm, nombre: e.target.value.toUpperCase()})} className="font-black border-slate-200" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Domicilio (Calle y Número)</Label>
                  <Input value={quickAddForm.domicilio} onChange={e => setQuickAddForm({...quickAddForm, domicilio: e.target.value})} className="font-bold border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Teléfono</Label>
                  <Input value={quickAddForm.telefono} onChange={e => setQuickAddForm({...quickAddForm, telefono: e.target.value})} className="font-mono font-black border-slate-200" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Localidad</Label>
                  <Input value={quickAddForm.localidad} onChange={e => setQuickAddForm({...quickAddForm, localidad: e.target.value})} className="font-bold border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Municipio</Label>
                  <Input value={quickAddForm.municipio} onChange={e => setQuickAddForm({...quickAddForm, municipio: e.target.value.toUpperCase()})} className="font-bold uppercase border-slate-200" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Sector</Label>
                  <Input value={quickAddForm.sector} onChange={e => setQuickAddForm({...quickAddForm, sector: e.target.value})} className="font-black border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Zona Escolar</Label>
                  <Input value={quickAddForm.zonaEscolar} onChange={e => setQuickAddForm({...quickAddForm, zonaEscolar: e.target.value})} className="font-black border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Modalidad</Label>
                  <Select value={quickAddForm.modalidad} onValueChange={v => setQuickAddForm({...quickAddForm, modalidad: v})}>
                    <SelectTrigger className="text-[10px] font-bold uppercase border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DES" className="text-[10px] font-bold">DES (GENERAL)</SelectItem>
                      <SelectItem value="DST" className="text-[10px] font-bold">DST (TÉCNICA)</SelectItem>
                      <SelectItem value="DTV" className="text-[10px] font-bold">DTV (TELESECUNDARIA)</SelectItem>
                      <SelectItem value="ADG" className="text-[10px] font-bold">ADG (DEPARTAMENTO)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Turno</Label>
                  <Select value={quickAddForm.turno} onValueChange={v => setQuickAddForm({...quickAddForm, turno: v})}><SelectTrigger className="text-[10px] font-bold uppercase border-slate-200"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MATUTINO">MATUTINO</SelectItem><SelectItem value="VESPERTINO">VESPERTINO</SelectItem><SelectItem value="MIXTO">MIXTO</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Valle</Label>
                  <Select value={quickAddForm.valle} onValueChange={v => setQuickAddForm({...quickAddForm, valle: v})}><SelectTrigger className="text-[10px] font-bold uppercase border-slate-200"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MEXICO">MÉXICO</SelectItem><SelectItem value="TOLUCA">TOLUCA</SelectItem></SelectContent></Select>
                </div>
             </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsQuickAddOpen(false)} className="h-12 px-8 text-[10px] font-black uppercase">Cancelar</Button>
            <Button onClick={handleQuickAddCct} className="bg-primary text-white h-12 px-12 rounded-xl text-[10px] font-black uppercase shadow-lg">Registrar y Sumar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visitas Scheduler Modal */}
      <VisitSchedulerDialog 
        open={isSchedulerOpen} 
        onOpenChange={setIsSchedulerOpen} 
        areaId="capacitacion" 
        areaName="Capacitación" 
      />
    </div>
  )
}
