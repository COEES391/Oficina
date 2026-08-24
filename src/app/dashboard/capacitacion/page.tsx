
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
  Archive,
  Eye,
  Printer,
  Download,
  Save
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
  
  const [evidenceToView, setEvidenceToView] = useState<{ 
    pdfData?: string, 
    images?: string[], 
    title: string 
  } | null>(null)

  const pdfInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

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
        toast({ title: "Sede Identificada", description: match.nombre })
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
      toast({ variant: "destructive", title: "Archivo demasiado pesado", description: "Límite: 2.0 MB" })
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
      toast({ title: "Evidencia añadida" })
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
      toast({ variant: "destructive", title: "Faltan datos" }); return;
    }
    const newSchool: SchoolInfo = { 
      ...quickAddForm, 
      cct: quickAddForm.cct.toUpperCase(), 
      nombre: quickAddForm.nombre.toUpperCase(), 
      municipio: quickAddForm.municipio.toUpperCase(),
      domicilio: (quickAddForm.domicilio || '').toUpperCase(),
      localidad: (quickAddForm.localidad || '').toUpperCase(),
      sector: (quickAddForm.sector || '').toUpperCase(),
      zonaEscolar: (quickAddForm.zonaEscolar || '').toUpperCase(),
      modalidad: (quickAddForm.modalidad || 'DES').toUpperCase()
    };
    const updated = [newSchool, ...allSchools];
    setAllSchools(updated);
    localStorage.setItem('schools_master_full_v21', JSON.stringify(updated));
    handleCctSedeChange(newSchool.cct);
    setIsQuickAddOpen(false);
    setDialogSearchTerm('');
    toast({ title: "CCT Registrado" });
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
        }
      }
    }
    setAssistants(newAssistants)
  }

  const handleSave = () => {
    if (!courseData.id || !courseData.cursoNombre) {
      toast({ variant: "destructive", title: "Faltan datos del curso" })
      return
    }

    const validAssistants = assistants.filter(a => a.rfc && a.nombres)
    if (validAssistants.length === 0) {
      toast({ variant: "destructive", title: "Registrar al menos un asistente" })
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
      reportPdf: idx === 0 ? courseData.reportPdf : '',
      evidencePhotos: idx === 0 ? (courseData.evidencePhotos || []) : [],
      observaciones: courseData.observaciones || '',
    }))

    let updated;
    const baseFolio = editingId ? editingId.split('-')[0] : courseData.id;
    if (editingId) {
      updated = [...newRecords, ...records.filter(r => !r.id.startsWith(baseFolio))]
    } else {
      updated = [...newRecords, ...records]
    }

    try {
      localStorage.setItem('training_records_full', JSON.stringify(updated))
      setRecords(updated)
      setIsDialogOpen(false)
      resetForm()
      toast({ title: "Guardado", description: `${newRecords.length} registros guardados.` })
    } catch (e) {
      toast({ variant: "destructive", title: "Error de Almacenamiento", description: "Por favor reduzca el tamaño de las fotos o PDF." })
    }
  }

  const handleDelete = (id: string) => {
    const updated = records.filter(r => r.id !== id)
    setRecords(updated)
    localStorage.setItem('training_records_full', JSON.stringify(updated))
    toast({ title: "Registro eliminado" })
  }

  const resetForm = () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    setCourseData({ ...initialCourseData, fechaInicio: today, fechaTermino: today })
    setAssistants([{ paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '' }])
    setEditingId(null)
    setSelectedSedeInfo(null)
    setDialogSearchTerm('')
  }

  const handleEdit = (record: TrainingRecord) => {
    const folio = record.id.split('-')[0];
    const masterRecord = records.find(r => r.id.startsWith(folio) && (r.reportPdf || (r.evidencePhotos && r.evidencePhotos.length > 0))) || record;

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
      reportPdf: masterRecord.reportPdf || '',
      evidencePhotos: masterRecord.evidencePhotos || []
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
      genero: (r.asistenteGenero || '') as any,
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

    setAssistants(relatedAssistants.length > 0 ? relatedAssistants : [{ paterno: record.asistentePaterno, materno: record.asistenteMaterno, nombres: record.asistenteNombres, rfc: record.asistenteRFC, genero: (record.asistenteGenero || '') as any, funcion: record.asistenteFuncion, email: record.asistenteEmail, cct: record.asistenteCCT, nombreCT: record.asistenteNombreCT, ze: record.asistenteZE, sector: record.asistenteSector, modalidad: record.asistenteModalidad, municipio: record.asistenteMunicipio, region: record.asistenteRegion, valle: record.asistenteValle }]);
    setEditingId(record.id)
    setIsDialogOpen(true)
  }

  const openEvidenceViewer = (record: TrainingRecord) => {
    const folio = record.id.split('-')[0];
    const masterRecord = records.find(r => r.id.startsWith(folio) && (r.reportPdf || (r.evidencePhotos && r.evidencePhotos.length > 0))) || record;
    if (!masterRecord.reportPdf && (!masterRecord.evidencePhotos || masterRecord.evidencePhotos.length === 0)) {
      toast({ title: "Sin evidencias" }); return;
    }
    setEvidenceToView({ pdfData: masterRecord.reportPdf, images: masterRecord.evidencePhotos, title: `Evidencia: ${masterRecord.cursoNombre}` });
  }

  const printFile = (data: string) => {
    const win = window.open();
    if (!win) return;
    win.document.write(`<iframe src="${data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
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
            <Button className="btn-institutional h-12 px-10 rounded-xl shadow-lg"><PlusCircle className="h-5 w-5 mr-2" /> Iniciar Registro</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[1400px] h-[95vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem]">
            <DialogHeader className="p-8 pb-2">
              <DialogTitle className="uppercase font-black text-primary text-2xl flex items-center gap-3"><GraduationCap className="h-8 w-8 text-accent" /> Gestión de Curso y Asistentes</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="curso" className="flex-1 flex flex-col overflow-hidden">
              <div className="px-8 border-b bg-slate-50/50">
                <TabsList className="bg-transparent h-14 p-0 gap-8">
                  <TabsTrigger value="curso" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all">1. Datos del Curso</TabsTrigger>
                  <TabsTrigger value="asistentes" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all">2. Lista de Asistentes</TabsTrigger>
                </TabsList>
              </div>
              <div className="flex-1 overflow-hidden">
                <TabsContent value="curso" className="h-full m-0 p-0 overflow-hidden">
                  <ScrollArea className="h-full p-8">
                    <div className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary pl-2"># Solicitud</Label><Input className="h-14 font-mono uppercase border-primary/20 text-lg bg-slate-50 shadow-inner" value={courseData.id} onChange={e => setCourseData({...courseData, id: e.target.value.toUpperCase()})} /></div>
                        <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary pl-2">Grupo</Label><Input className="h-14 bg-slate-50 border-primary/10" value={courseData.cursoGrupo} onChange={e => setCourseData({...courseData, cursoGrupo: e.target.value})} /></div>
                        <div className="md:col-span-2 space-y-2"><Label className="text-[11px] font-black uppercase text-primary pl-2">Nombre del Curso</Label><Input className="h-14 bg-slate-50 border-primary/10 font-bold" value={courseData.cursoNombre} onChange={e => setCourseData({...courseData, cursoNombre: e.target.value})} /></div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary pl-2">Duración (H)</Label><Input type="number" className="h-14 bg-slate-50 text-center font-black text-xl" value={courseData.duracionHoras} onChange={e => setCourseData({...courseData, duracionHoras: parseInt(e.target.value) || 0})} /></div>
                        <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary pl-2">Inicio</Label><Input type="date" className="h-14 bg-slate-50" value={courseData.fechaInicio} onChange={e => setCourseData({...courseData, fechaInicio: e.target.value})} /></div>
                        <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary pl-2">Término</Label><Input type="date" className="h-14 bg-slate-50" value={courseData.fechaTermino} onChange={e => setCourseData({...courseData, fechaTermino: e.target.value})} /></div>
                        <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary pl-2">Oficio</Label><Input className="h-14 bg-slate-50 font-mono" value={courseData.numeroOficio} onChange={e => setCourseData({...courseData, numeroOficio: e.target.value})} /></div>
                      </div>
                      <div className="space-y-8 pt-8 border-t border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div className="md:col-span-2 space-y-2 relative"><Label className="text-[11px] font-black uppercase text-primary flex items-center gap-2 pl-2"><Search className="h-4 w-4 text-accent" /> CCT Sede</Label><Input placeholder="Buscar CCT o Nombre..." className="font-mono uppercase border-primary/30 h-16 text-2xl shadow-inner bg-white" value={dialogSearchTerm} onChange={e => setDialogSearchTerm(e.target.value)} />
                            {dialogSearchTerm.length > 2 && (
                              <div className="absolute top-26 left-0 right-0 max-h-60 overflow-auto bg-white border rounded-2xl shadow-2xl z-50 divide-y">
                                {schoolSearchResults.map(s => (
                                  <div key={`sede-res-${s.cct}-${s.turno}`} className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center group" onClick={() => { handleCctSedeChange(s.cct); setDialogSearchTerm(''); }}>
                                    <div className="flex flex-col"><span className="text-xs font-black text-slate-800 uppercase">{s.nombre}</span><span className="text-[10px] font-mono text-muted-foreground">{s.cct}</span></div>
                                    <ChevronRight className="h-4 w-4 text-slate-300" />
                                  </div>
                                ))}
                                {schoolSearchResults.length === 0 && (<div className="p-6 text-center"><Button onClick={() => { setQuickAddForm({...quickAddForm, cct: ''}); setIsQuickAddOpen(true); }} variant="outline" className="h-10 px-6 rounded-xl text-[9px] font-black uppercase"><Plus className="h-4 w-4 mr-2" /> Alta Rápida</Button></div>)}
                              </div>
                            )}
                          </div>
                        </div>
                        {selectedSedeInfo && (
                          <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-primary/20 shadow-2xl relative animate-in zoom-in-95 duration-500">
                             <div className="flex items-center gap-6 border-b border-primary/10 pb-6">
                                <div className="h-20 w-20 rounded-3xl bg-primary text-white flex items-center justify-center shadow-xl"><School className="h-10 w-10" /></div>
                                <div><h4 className="text-2xl font-black text-slate-800 uppercase leading-none">{selectedSedeInfo.nombre}</h4><p className="text-xs font-mono font-bold text-muted-foreground mt-2 inline-block px-3 py-1 bg-white rounded-full">CCT: {selectedSedeInfo.cct}</p></div>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mt-8">
                                <div className="space-y-1 bg-white p-4 rounded-2xl border"><p className="text-[9px] font-black text-slate-400 uppercase">Sector</p><p className="text-lg font-black text-slate-700">{selectedSedeInfo.sector}</p></div>
                                <div className="space-y-1 bg-white p-4 rounded-2xl border"><p className="text-[9px] font-black text-slate-400 uppercase">Zona Escolar</p><p className="text-lg font-black text-slate-700">{selectedSedeInfo.zonaEscolar}</p></div>
                                <div className="space-y-1 bg-white p-4 rounded-2xl border"><p className="text-[9px] font-black text-slate-400 uppercase">Municipio</p><p className="text-lg font-black text-slate-700 truncate">{selectedSedeInfo.municipio}</p></div>
                                <div className="space-y-1 bg-white p-4 rounded-2xl border"><p className="text-[9px] font-black text-slate-400 uppercase">Región</p><p className="text-lg font-black text-slate-700">{selectedSedeInfo.region}</p></div>
                                <div className="space-y-1 bg-white p-4 rounded-2xl border"><p className="text-[9px] font-black text-slate-400 uppercase">Valle</p><p className="text-lg font-black text-slate-700">{selectedSedeInfo.valle}</p></div>
                             </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-6 pt-6 border-t-2 border-primary/5">
                        <h3 className="text-sm font-black uppercase text-primary tracking-wider">Evidencia Digital (PDF e imágenes PNG)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="p-6 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3 relative group">
                            {courseData.reportPdf ? (
                              <div className="flex flex-col items-center gap-3"><div className="h-14 w-14 rounded-2xl bg-white shadow-xl flex items-center justify-center text-emerald-600"><FileText className="h-8 w-8" /></div><p className="text-[10px] font-black uppercase text-emerald-700">REPORTE CARGADO</p><Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8 text-rose-500 rounded-full" onClick={() => setCourseData(prev => ({...prev, reportPdf: ''}))}><X className="h-4 w-4" /></Button></div>
                            ) : (
                              <><Upload className="h-8 w-8 text-slate-300" /><p className="text-[10px] font-black uppercase text-slate-700">Subir Formato PDF (Máx 2.0MB)</p><Button variant="outline" size="sm" onClick={() => pdfInputRef.current?.click()} className="h-9 px-6 rounded-xl text-[9px] font-black uppercase">Seleccionar</Button></>
                            )}
                            <input type="file" accept=".pdf" className="hidden" ref={pdfInputRef} onChange={(e) => handleFileChange(e, 'pdf')} />
                          </div>
                          <div className="p-6 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3 relative">
                            <ImageIcon className="h-8 w-8 text-slate-300" /><p className="text-[10px] font-black uppercase text-slate-700">Adjuntar Imágenes PNG (Máx 2.0MB)</p><Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} className="h-9 px-6 rounded-xl text-[9px] font-black uppercase">Añadir Imagen</Button>
                            <input type="file" accept=".png" className="hidden" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} />
                            <div className="grid grid-cols-4 gap-3 mt-4 w-full">
                              {(courseData.evidencePhotos || []).map((img, idx) => (<div key={`ev-img-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-white shadow-md group"><Image src={img} alt={`Evidencia ${idx}`} fill className="object-cover" /><button onClick={() => removeImage(idx)} className="absolute top-1 right-1 h-5 w-5 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"><X className="h-3 w-3" /></button></div>))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="asistentes" className="h-full m-0 p-8 flex flex-col">
                  <div className="flex justify-between items-center mb-6"><div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4 shadow-sm"><CheckCircle2 className="h-6 w-6 text-blue-600" /><p className="text-[10px] font-black text-blue-800 uppercase leading-relaxed">Sincronización Maestra: El sistema jala automáticamente el Nombre C.T., ZE y Sector desde la base actualizada.</p></div><Button onClick={handleAddRow} className="gap-2 font-black uppercase text-[11px] h-12 px-8 shadow-md"><Plus className="h-5 w-5" /> Añadir Servidor Público</Button></div>
                  <div className="flex-1 overflow-hidden border-2 border-slate-100 rounded-[2rem] shadow-2xl bg-white">
                    <ScrollArea className="h-full">
                      <div className="w-full overflow-x-auto">
                        <Table className="min-w-[1300px]">
                          <TableHeader className="bg-slate-50 sticky top-0 z-10"><TableRow><TableHead className="w-12 text-[10px] font-black uppercase text-center">#</TableHead><TableHead className="w-[280px] text-[10px] font-black uppercase">Apellidos y Nombre(s)</TableHead><TableHead className="w-[140px] text-[10px] font-black uppercase">RFC Oficial</TableHead><TableHead className="w-[180px] text-[10px] font-black uppercase">Función</TableHead><TableHead className="w-[130px] text-[10px] font-black uppercase">CCT Adscripción</TableHead><TableHead className="w-[250px] text-[10px] font-black uppercase">Plantel (Auto)</TableHead><TableHead className="w-[80px] text-[10px] font-black uppercase text-center">ZE</TableHead><TableHead className="w-[80px] text-[10px] font-black uppercase text-center">Sector</TableHead><TableHead className="w-16 sticky right-0 bg-slate-50"></TableHead></TableRow></TableHeader>
                          <TableBody>{assistants.map((ast, idx) => (
                            <TableRow key={idx} className="hover:bg-slate-50/50"><TableCell className="text-center font-black text-xs text-muted-foreground">{idx + 1}</TableCell>
                              <TableCell className="p-2"><div className="grid grid-cols-1 gap-1"><Input placeholder="PATERNO" className="h-8 text-[9px] uppercase" value={ast.paterno} onChange={e => updateAssistant(idx, 'paterno', e.target.value.toUpperCase())} /><Input placeholder="MATERNO" className="h-8 text-[9px] uppercase" value={ast.materno} onChange={e => updateAssistant(idx, 'materno', e.target.value.toUpperCase())} /><Input placeholder="NOMBRE(S)" className="h-8 text-[10px] uppercase font-black text-primary border-primary/20 bg-primary/5" value={ast.nombres} onChange={e => updateAssistant(idx, 'nombres', e.target.value.toUpperCase())} /></div></TableCell>
                              <TableCell className="p-2"><Input placeholder="13 DÍGITOS" className="h-9 text-[11px] font-mono uppercase font-black" value={ast.rfc} onChange={e => updateAssistant(idx, 'rfc', e.target.value.toUpperCase())} maxLength={13} /></TableCell>
                              <TableCell className="p-2"><Select value={ast.funcion} onValueChange={(val: any) => updateAssistant(idx, 'funcion', val)}><SelectTrigger className="h-9 text-[9px] font-bold uppercase"><SelectValue placeholder="FUNCIÓN..." /></SelectTrigger><SelectContent>{FUNCIONES.map(f => (<SelectItem key={f} value={f} className="text-[10px] font-bold uppercase">{f}</SelectItem>))}</SelectContent></Select></TableCell>
                              <TableCell className="p-2"><Input placeholder="15DES0000X" className="h-9 text-[11px] font-mono font-black uppercase border-primary/30" value={ast.cct} onChange={e => updateAssistant(idx, 'cct', e.target.value.toUpperCase())} maxLength={10} /></TableCell>
                              <TableCell className="p-2"><div className="space-y-1"><Input value={ast.nombreCT} readOnly className="h-8 text-[10px] bg-slate-100 border-none font-black uppercase text-slate-600" /><Input value={ast.municipio} readOnly className="h-6 text-[8px] bg-slate-100 border-none font-bold uppercase text-muted-foreground" /></div></TableCell>
                              <TableCell className="p-2"><Input value={ast.ze} readOnly className="h-9 text-center text-[10px] bg-slate-100 border-none font-black" /></TableCell>
                              <TableCell className="p-2"><Input value={ast.sector} readOnly className="h-9 text-center text-[10px] bg-slate-100 border-none font-black" /></TableCell>
                              <TableCell className="p-2 sticky right-0 bg-white shadow-l"><Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600" onClick={() => handleRemoveRow(idx)} disabled={assistants.length === 1}><Trash2 className="h-4 w-4" /></Button></TableCell>
                            </TableRow>
                          ))}</TableBody>
                        </Table>
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            <DialogFooter className="p-8 border-t bg-slate-50 flex items-center justify-between"><div className="text-[11px] font-black uppercase text-primary flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100"><Users className="h-5 w-5 text-accent" /> Asistentes vinculados: {assistants.filter(a => a.rfc && a.nombres).length}</div><div className="flex gap-4"><Button variant="outline" onClick={() => setIsDialogOpen(false)} className="font-bold uppercase text-xs rounded-xl h-14 px-10">Cancelar</Button><Button onClick={handleSave} className="btn-institutional px-16 h-14 text-xs rounded-xl"><Save className="h-5 w-5 mr-2" /> Guardar y Finalizar Registro</Button></div></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="executive-card p-6 bg-white/80 border-none shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-6">
           <div className="flex items-center gap-3 w-full md:w-auto"><Search className="h-5 w-5 text-primary" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buscador:</span></div>
           <div className="relative flex-1 w-full"><Input placeholder="FILTRAR POR CCT, INSTRUCTOR O CURSO..." className="h-12 rounded-xl bg-slate-50 border-primary/10 pl-12 text-sm font-bold uppercase shadow-inner focus:bg-white transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" /></div>
           <div className="flex items-center gap-4 w-full md:w-auto"><Select value={officeFilter} onValueChange={setOficinaFilter}><SelectTrigger className="h-12 w-full md:w-[240px] rounded-xl border-primary/10 bg-white text-[10px] font-black uppercase shadow-sm"><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /><SelectValue placeholder="OFICINA..." /></div></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="all" className="text-[10px] font-black uppercase">Todas las Oficinas</SelectItem><SelectItem value="TOLUCA" className="text-[10px] font-black uppercase">Toluca</SelectItem><SelectItem value="ECATEPEC" className="text-[10px] font-black uppercase">Ecatepec</SelectItem><SelectItem value="NAUCALPAN" className="text-[10px] font-black uppercase">Naucalpan</SelectItem><SelectItem value="NEZAHUALCOYOTL" className="text-[10px] font-black uppercase">Nezahualcóyotl</SelectItem></SelectContent></Select><Button variant="outline" className="h-12 px-6 border-primary/20 text-primary font-black uppercase text-[10px] gap-2 rounded-xl" onClick={() => setIsSchedulerOpen(true)}><CalendarDays className="h-5 w-5" /> Agenda</Button></div>
        </div>
      </Card>

      <Card className="executive-card p-0 shadow-xl overflow-hidden border-t-8 border-t-primary">
        <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100"><CardTitle className="flex items-center gap-4 text-primary uppercase font-black text-2xl"><GraduationCap className="h-10 w-10 text-accent" /> Control de Personal Capacitado</CardTitle><CardDescription className="font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground mt-2">Bitácora Maestra de Actualización Docente y Administrativa</CardDescription></CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-hidden">
            <Table className="w-full border-collapse">
              <TableHeader className="bg-slate-100/50">
                <TableRow>
                  <TableHead className="font-black text-[9px] uppercase w-[60px] text-center pl-4">ID</TableHead>
                  <TableHead className="font-black text-[9px] uppercase min-w-[200px]">Curso / Grupo</TableHead>
                  <TableHead className="font-black text-[9px] uppercase min-w-[200px]">Asistente Capacitado</TableHead>
                  <TableHead className="font-black text-[9px] uppercase w-[100px]">RFC</TableHead>
                  <TableHead className="font-black text-[9px] uppercase w-[110px]">Función</TableHead>
                  <TableHead className="font-black text-[9px] uppercase min-w-[180px]">Plantel de Origen</TableHead>
                  <TableHead className="font-black text-[9px] uppercase text-center w-[60px]">SETES</TableHead>
                  <TableHead className="text-right font-black text-[9px] uppercase pr-6 w-[80px]">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length > 0 ? filteredRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-slate-50 group border-b border-slate-50 h-14">
                    <TableCell className="text-center pl-4">
                      <span className="font-black text-[10px] text-primary">#{record.id.split('-')[0]}</span>
                    </TableCell>
                    <TableCell>
                      <button onClick={() => openEvidenceViewer(record)} className="flex flex-col text-left hover:scale-[1.01] transition-transform">
                        <span className="font-black text-[10px] text-slate-700 uppercase leading-tight group-hover:text-primary underline decoration-dotted decoration-primary/30 truncate max-w-[200px]">{record.cursoNombre}</span>
                        <span className="text-[8px] text-muted-foreground font-black uppercase tracking-tight mt-0.5">{record.cursoGrupo}</span>
                      </button>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-bold uppercase text-slate-600 truncate max-w-[200px] block">{record.asistenteNombres} {record.asistentePaterno} {record.asistenteMaterno}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-[9px] uppercase font-black text-primary">{record.asistenteRFC}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[8px] font-black uppercase border-slate-200 text-slate-500 bg-white px-1.5 h-5">{record.asistenteFuncion || '-'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-black text-primary leading-none truncate max-w-[180px]">{record.asistenteCCT}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase truncate max-w-[180px] mt-0.5">{record.asistenteNombreCT}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={record.setes === 'S' ? 'default' : 'secondary'} className={cn("text-[8px] font-black h-5 px-2", record.setes === 'S' ? 'bg-emerald-500 hover:bg-emerald-600' : '')}>{record.setes === 'S' ? 'SÍ' : 'NO'}</Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-primary hover:bg-primary/5 rounded-lg" onClick={() => handleEdit(record)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg" onClick={() => handleDelete(record.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-32 opacity-30">
                      <div className="flex flex-col items-center gap-4">
                        <GraduationCap className="h-16 w-16 text-slate-300" />
                        <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Sin registros operativos</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-[#B38E5D] text-white shrink-0"><DialogTitle className="uppercase font-black text-lg flex items-center gap-3"><PlusCircle className="h-6 w-6" /> Registro Rápido de CCT</DialogTitle></DialogHeader>
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">CCT</Label><Input value={quickAddForm.cct} onChange={e => setQuickAddForm({...quickAddForm, cct: e.target.value.toUpperCase()})} maxLength={10} className="font-mono font-black" /></div><div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Nombre del Plantel</Label><Input value={quickAddForm.nombre} onChange={e => setQuickAddForm({...quickAddForm, nombre: e.target.value.toUpperCase()})} className="font-black" /></div></div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Municipio</Label><Input value={quickAddForm.municipio} onChange={e => setQuickAddForm({...quickAddForm, municipio: e.target.value.toUpperCase()})} /></div><div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Valle</Label><Select value={quickAddForm.valle} onValueChange={v => setQuickAddForm({...quickAddForm, valle: v})}><SelectTrigger className="font-bold"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MEXICO">MÉXICO</SelectItem><SelectItem value="TOLUCA">TOLUCA</SelectItem></SelectContent></Select></div></div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-3"><Button variant="ghost" onClick={() => setIsQuickAddOpen(false)} className="h-12 px-8 text-[10px] font-black uppercase">Cancelar</Button><Button onClick={handleQuickAddCct} className="bg-primary text-white h-12 px-12 rounded-xl text-[10px] font-black uppercase shadow-lg">Registrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!evidenceToView} onOpenChange={(open) => !open && setEvidenceToView(null)}>
        <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white shrink-0 flex flex-row justify-between items-center pr-12"><div className="space-y-1"><DialogTitle className="uppercase font-black text-white text-xl flex items-center gap-4"><Archive className="h-7 w-7 text-accent" /> {evidenceToView?.title}</DialogTitle><DialogDescription className="text-white/60 font-bold text-[10px] uppercase tracking-widest mt-1">Expediente Digital de Capacitación COEES</DialogDescription></div><div className="flex gap-4">{evidenceToView?.pdfData && (<Button onClick={() => printFile(evidenceToView.pdfData!)} className="bg-white text-primary hover:bg-slate-100 font-black text-[10px] uppercase h-10 px-6 rounded-xl shadow-xl"><Printer className="h-4 w-4" /> Imprimir</Button>)}<button onClick={() => setEvidenceToView(null)} className="h-10 w-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all"><X className="h-5 w-5" /></button></div></DialogHeader>
          <Tabs defaultValue={evidenceToView?.pdfData ? "pdf" : "gallery"} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-8 border-b bg-slate-50/50"><TabsList className="bg-transparent h-14 p-0 gap-8">{evidenceToView?.pdfData && (<TabsTrigger value="pdf" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2"><FileText className="h-4 w-4" /> Reporte PDF</TabsTrigger>)}{evidenceToView?.images && evidenceToView.images.length > 0 && (<TabsTrigger value="gallery" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Galería ({evidenceToView.images.length})</TabsTrigger>)}</TabsList></div>
            <div className="flex-1 overflow-hidden bg-slate-100/50">
               <TabsContent value="pdf" className="h-full m-0 p-0">{evidenceToView?.pdfData ? (<iframe src={evidenceToView.pdfData} className="w-full h-full border-none bg-white" title="PDF Viewer" />) : (<div className="h-full flex items-center justify-center opacity-20"><FileText className="h-20 w-20" /></div>)}</TabsContent>
               <TabsContent value="gallery" className="h-full m-0 overflow-hidden"><ScrollArea className="h-full p-8"><div className="grid grid-cols-1 md:grid-cols-3 gap-6">{(evidenceToView?.images || []).map((img, idx) => (<div key={`view-img-${idx}`} className="group relative aspect-video bg-white rounded-2xl overflow-hidden border-2 border-white shadow-lg transition-all hover:scale-[1.02]"><Image src={img} alt={`Evidencia ${idx + 1}`} fill className="object-cover" /><div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Eye className="h-8 w-8 text-white" /></div></div>))}</div></ScrollArea></TabsContent>
            </div>
          </Tabs>
          <DialogFooter className="p-4 bg-slate-50 border-t shrink-0"><Button variant="ghost" onClick={() => setEvidenceToView(null)} className="h-10 px-10 font-black uppercase text-[10px]">Cerrar Visor</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <VisitSchedulerDialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen} areaId="capacitacion" areaName="Capacitación" />
    </div>
  )
}
