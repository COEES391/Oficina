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
import { programsData, type ProgramStatus } from "@/lib/planning-data"
import { schoolsDirectory } from "@/lib/schools-directory"
import { cn } from "@/lib/utils"
import { 
  PlusCircle, 
  Pencil, 
  Trash2,
  Activity,
  Target,
  MapPin,
  Calendar,
  Mail,
  CheckCircle2,
  Users,
  Plus,
  School,
  FileText,
  ImageIcon,
  X,
  ExternalLink,
  Eye,
  Info
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from 'next/image'

const PROGRAM_RUBROS = [
  'Biblioteca Digital',
  'Cuentas Institucionales',
  'Geoposición',
  'Conoce mi Escuela',
  'ATRES'
];

const FUNCIONES = [
  "ADMINISTRATIVO",
  "DOCENTE",
  "DIRECTIVO",
  "JEFE DE ENSEÑANZA",
  "SUPERVISOR",
  "ASESOR TECNICO PEDAGOGICO"
]

const REGIONAL_OFFICES = [
  "Oficina de Tecnóloga Educativa Ecatepec",
  "Oficina de Tecnóloga Educativa Naucalpan",
  "Oficina de Tecnóloga Educativa Nezahualcóyotl",
  "Oficina de Tecnóloga Educativa Toluca",
  "Oficina de COEES Tultitlan"
];

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

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [activeTab, setActiveTab] = useState(PROGRAM_RUBROS[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [evidenceToView, setEvidenceToView] = useState<{ type: 'pdf' | 'gallery', data: string | string[], title: string } | null>(null)

  const initialFormState: ProgramStatus = {
    id: '', name: '', progress: 0, status: 'activo', date: new Date().toISOString().split('T')[0], cct: '', schoolName: '', 
    zonaEscolar: '', sector: '', modalidad: '', municipio: '', region: '', valle: '',
    numeroEquipos: 0, observaciones: '', capacitacion: 'N', asistentes: [], email: '',
    latitud: '', longitud: '',
    tipoIncidencia: 'mantenimiento preventivo',
    oficinaRegionalAtencion: '',
    numeroOficio: '',
    alumnosBeneficiados: 0,
    docentesBeneficiados: 0,
    serviciosMC: 0,
    serviciosMP: 0,
    reportPdf: '',
    evidencePhotos: []
  }

  const [formData, setFormData] = useState<ProgramStatus>(initialFormState)
  const [assistants, setAssistants] = useState<AssistantEntry[]>([
    { paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '' }
  ])

  useEffect(() => {
    setMounted(true)
    const stored = JSON.parse(localStorage.getItem('programs_full') || '[]')
    
    const geoCount = stored.filter((r: any) => r.name === 'Geoposición').length;
    
    if (stored.length === 0 || geoCount < 337) {
      setRecords(programsData)
      localStorage.setItem('programs_full', JSON.stringify(programsData))
    } else {
      setRecords(stored)
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

  const handleAddAssistant = () => {
    setAssistants([...assistants, { paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '' }])
  }

  const handleRemoveAssistant = (index: number) => {
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
        }
      }
    }
    setAssistants(newAssistants)
  }

  const handleSave = () => {
    if (!formData.cct) {
      toast({ variant: "destructive", title: "Datos Incompletos", description: "El CCT es obligatorio." });
      return;
    }
    
    const validAssistants = formData.capacitacion === 'S' ? assistants.filter(a => a.rfc && a.nombres) : [];

    const finalData = {
      ...formData,
      id: editingId || `PROG-${formData.name.substring(0,2).toUpperCase()}-${Date.now()}`,
      asistentes: validAssistants
    };

    const updated = editingId ? records.map(r => r.id === editingId ? finalData : r) : [finalData, ...records];
    setRecords(updated)
    localStorage.setItem('programs_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    setEditingId(null)
    setFormData(initialFormState)
    setAssistants([{ paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '' }])
    toast({ title: "Registro guardado con éxito" })
  }

  const currentTabRecords = useMemo(() => {
    let filtered = records.filter(r => r.name === activeTab);
    
    if (activeTab === 'Conoce mi Escuela') {
       filtered = [...filtered].sort((a,b) => (a.cct||'').localeCompare(b.cct||''));
    }

    if (activeTab === 'Geoposición') {
      return filtered.map(rec => {
        const school = schoolsDirectory.find(s => s.cct.toUpperCase() === rec.cct?.toUpperCase());
        if (school) {
          return {
            ...rec,
            zonaEscolar: rec.zonaEscolar === 'S/Z' || !rec.zonaEscolar ? school.zonaEscolar : rec.zonaEscolar,
            sector: rec.sector === 'S/S' || !rec.sector ? school.sector : rec.sector,
            schoolName: rec.schoolName?.includes('PLANTEL') || !rec.schoolName ? school.nombre : rec.schoolName,
            valle: rec.valle === 'ESTADO DE MEXICO' || !rec.valle ? school.valle : rec.valle,
            municipio: rec.municipio === 'LOCALIDAD PENDIENTE' || !rec.municipio ? school.municipio : rec.municipio,
          };
        }
        return rec;
      });
    }
    return filtered;
  }, [records, activeTab]);

  const handleEdit = (rec: ProgramStatus) => {
    setFormData(rec);
    setEditingId(rec.id);
    if (rec.asistentes && rec.asistentes.length > 0) {
      setAssistants(rec.asistentes);
    } else {
      setAssistants([{ paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '' }]);
    }
    setIsDialogOpen(true);
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full h-12 bg-white border border-slate-100 p-1 rounded-xl shadow-sm">
          {PROGRAM_RUBROS.map(rubro => (
            <TabsTrigger 
              key={rubro} 
              value={rubro} 
              className="flex-1 h-full text-[10px] font-black uppercase rounded-lg tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
            >
              {rubro}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 animate-in fade-in duration-500">
          <Card className="executive-card p-6 flex items-center justify-between">
             <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                 {activeTab === 'Geoposición' ? <MapPin className="h-6 w-6" /> : <Target className="h-6 w-6" />}
               </div>
               <div>
                 <h3 className="text-xl font-black uppercase text-slate-900 leading-none">{activeTab}</h3>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Registros de Auditoría Técnica</p>
               </div>
             </div>
             <Button onClick={() => { setFormData({...initialFormState, name: activeTab}); setEditingId(null); setAssistants([{ paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '' }]); setIsDialogOpen(true); }} className="btn-institutional px-8 text-[11px]">
                <PlusCircle className="h-5 w-5 mr-2" /> Nuevo Registro
             </Button>
          </Card>

          <Card className="executive-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  {activeTab === 'Conoce mi Escuela' ? (
                    <TableRow>
                      <TableHead className="w-12 text-[10px] font-black uppercase text-center">#</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">CCT</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Agrupado</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Vert.</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Sect.</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Zona</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Alta</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Modif.</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Revisión</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Fecha</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Status</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-center">Acción</TableHead>
                    </TableRow>
                  ) : activeTab === 'Geoposición' ? (
                    <TableRow>
                      <TableHead className="w-12 text-[10px] font-black uppercase text-center">#</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">CCT</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Zona</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Sector</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Nombre Plantel</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Valle</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Municipio</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Latitud</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Longitud</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Estatus</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase pr-8">Acción</TableHead>
                    </TableRow>
                  ) : activeTab === 'ATRES' ? (
                    <TableRow>
                      <TableHead className="w-12 text-[10px] font-black uppercase text-center">#</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">CCT</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Plantel</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Servicio</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Oficio</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Benef.</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Estatus</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-center">Evidencias</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase pr-8">Acción</TableHead>
                    </TableRow>
                  ) : (
                    <TableRow>
                      <TableHead className="w-12 text-[10px] font-black uppercase text-center">#</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">CCT</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Plantel</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Modalidad</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Valle</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-center">Detalle</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Estatus</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase pr-8">Acción</TableHead>
                    </TableRow>
                  )}
                </TableHeader>
                <TableBody>
                  {currentTabRecords.length > 0 ? currentTabRecords.map((rec, idx) => (
                    <TableRow key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="text-center font-black text-[10px] text-muted-foreground">{idx + 1}.-</TableCell>
                      {activeTab === 'Conoce mi Escuela' ? (
                        <>
                          <TableCell className="font-black text-[10px] text-primary">{rec.cct}</TableCell>
                          <TableCell className="text-[9px] font-bold text-slate-500">{rec.agrupado}</TableCell>
                          <TableCell className="text-[10px] font-black">{rec.vertiente}</TableCell>
                          <TableCell className="text-[10px] text-center">{rec.sector}</TableCell>
                          <TableCell className="text-[10px] text-center">{rec.zonaEscolar}</TableCell>
                          <TableCell className="text-[9px]">{rec.fechaAlta}</TableCell>
                          <TableCell className="text-[9px]">{rec.fechaModif}</TableCell>
                          <TableCell className="text-[9px]">{rec.fechaRevision}</TableCell>
                          <TableCell className="text-[9px]">{rec.date}</TableCell>
                          <TableCell>
                             <Badge variant="outline" className={cn("text-[9px] font-black uppercase", rec.status === 'activo' || rec.status === 'concluido' ? 'border-emerald-500 text-emerald-600' : 'border-amber-500 text-amber-600')}>
                                {rec.status}
                             </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5" onClick={() => handleEdit(rec)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </>
                      ) : activeTab === 'Geoposición' ? (
                        <>
                          <TableCell className="font-black text-[10px] text-primary">{rec.cct}</TableCell>
                          <TableCell className="text-[10px] font-bold text-slate-600">{rec.zonaEscolar}</TableCell>
                          <TableCell className="text-[10px] font-bold text-slate-600">{rec.sector}</TableCell>
                          <TableCell className="text-[10px] font-black text-slate-700">{rec.schoolName}</TableCell>
                          <TableCell className="text-[10px] uppercase font-bold text-slate-500">{rec.valle}</TableCell>
                          <TableCell className="text-[10px] uppercase font-bold text-slate-500">{rec.municipio}</TableCell>
                          <TableCell className="text-[10px] font-mono text-primary font-bold">{rec.latitud}</TableCell>
                          <TableCell className="text-[10px] font-mono text-primary font-bold">{rec.longitud}</TableCell>
                          <TableCell>
                            <Badge className={cn("text-[9px] font-black uppercase px-2", rec.status === 'activo' ? 'bg-emerald-500' : 'bg-slate-200 text-slate-600')}>
                              {rec.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                             <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(rec)} className="h-8 w-8 hover:text-primary"><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => {
                                  const updated = records.filter(r => r.id !== rec.id);
                                  setRecords(updated);
                                  localStorage.setItem('programs_full', JSON.stringify(updated));
                                }} className="h-8 w-8 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></Button>
                             </div>
                          </TableCell>
                        </>
                      ) : activeTab === 'ATRES' ? (
                        <>
                          <TableCell className="font-black text-[10px] text-primary">{rec.cct}</TableCell>
                          <TableCell className="text-[10px] font-black text-slate-700">{rec.schoolName}</TableCell>
                          <TableCell className="capitalize text-[10px] font-bold text-slate-500">{rec.tipoIncidencia}</TableCell>
                          <TableCell className="text-[9px] font-mono">{rec.numeroOficio}</TableCell>
                          <TableCell className="text-[10px] font-bold">{(rec.alumnosBeneficiados || 0) + (rec.docentesBeneficiados || 0)}</TableCell>
                          <TableCell>
                            <Badge className={cn("text-[9px] font-black uppercase px-2", rec.status === 'activo' ? 'bg-emerald-500' : 'bg-slate-200 text-slate-600')}>
                              {rec.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              {rec.reportPdf && (
                                <Button variant="outline" size="icon" className="h-7 w-7 border-blue-200 hover:bg-blue-50" onClick={() => setEvidenceToView({ type: 'pdf', data: rec.reportPdf!, title: `Reporte ${rec.cct}` })}>
                                  <FileText className="h-4 w-4 text-blue-600" />
                                </Button>
                              )}
                              {rec.evidencePhotos && rec.evidencePhotos.length > 0 && (
                                <Button variant="outline" size="icon" className="h-7 w-7 border-pink-200 hover:bg-pink-50" onClick={() => setEvidenceToView({ type: 'gallery', data: rec.evidencePhotos!, title: `Evidencia ${rec.cct}` })}>
                                  <ImageIcon className="h-4 w-4 text-pink-600" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                             <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(rec)} className="h-8 w-8 hover:text-primary transition-colors"><Pencil className="h-4 w-4" /></Button>
                             </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-black text-[10px] text-primary">{rec.cct}</TableCell>
                          <TableCell className="text-sm font-bold text-slate-700">{rec.schoolName}</TableCell>
                          <TableCell><Badge className="bg-slate-900 text-white text-[10px] px-3">{rec.modalidad}</Badge></TableCell>
                          <TableCell className="text-[10px] font-black uppercase tracking-widest">{rec.valle}</TableCell>
                          <TableCell className="text-center">
                            {rec.name === 'Cuentas Institucionales' ? (
                               <span className="text-[10px] font-mono text-primary font-bold">{rec.email}</span>
                            ) : (
                               <span className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center font-black text-primary mx-auto text-sm">{rec.numeroEquipos}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("text-[10px] font-black uppercase px-4 py-1.5", rec.status === 'activo' || rec.status === 'concluido' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400')}>
                              {rec.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                             <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(rec)} className="h-8 w-8 hover:text-primary transition-colors"><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => {
                                  const updated = records.filter(r => r.id !== rec.id);
                                  setRecords(updated);
                                  localStorage.setItem('programs_full', JSON.stringify(updated));
                                  toast({ title: "Registro eliminado" });
                                }} className="h-8 w-8 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></Button>
                             </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={14} className="text-center py-20 bg-slate-50/20">
                         <p className="text-[10px] font-black uppercase text-muted-foreground opacity-50">Cargando base de datos técnica...</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[1400px] rounded-[2rem] border-none shadow-2xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="uppercase font-black text-primary text-2xl flex items-center gap-3">
              <Target className="h-7 w-7 text-accent" /> Gestión de {activeTab}
            </DialogTitle>
            <DialogDescription className="font-bold text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Ingrese los datos para la auditoría institucional COEES • Ciclo 2025-2026
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="auditoria" className="flex-1 flex flex-col overflow-hidden">
             <div className="px-8 border-b bg-slate-50/50">
                <TabsList className="bg-transparent h-12 p-0 gap-6">
                  <TabsTrigger value="auditoria" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-[11px] font-black uppercase tracking-wider transition-all">
                    1. Datos de Auditoría
                  </TabsTrigger>
                  {activeTab === 'Biblioteca Digital' && formData.capacitacion === 'S' && (
                    <TabsTrigger value="asistentes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-[11px] font-black uppercase tracking-wider transition-all">
                      2. Lista de Asistentes (Captura Directa)
                    </TabsTrigger>
                  )}
                </TabsList>
             </div>

             <div className="flex-1 overflow-hidden">
                <TabsContent value="auditoria" className="h-full m-0 p-0 overflow-hidden">
                  <ScrollArea className="h-full px-8">
                    <div className="grid gap-8 py-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                              CCT (Clave de Centro de Trabajo)
                            </Label>
                            <Input 
                              placeholder="EJ: 15DESXXXXX" 
                              className="h-14 font-mono uppercase border-primary/10 text-lg bg-slate-50 focus:bg-white transition-colors" 
                              value={formData.cct} 
                              onChange={e => handleCctChange(e.target.value)} 
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-primary tracking-widest">Estatus Auditoría</Label>
                            <Select value={formData.status} onValueChange={(val:any) => setFormData({...formData, status: val})}>
                              <SelectTrigger className="h-14 border-primary/10 font-black text-[11px] bg-slate-50 uppercase">
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="activo" className="text-[11px] font-black uppercase">ACTIVO</SelectItem>
                                <SelectItem value="inactivo" className="text-[11px] font-black uppercase">INACTIVO</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label className="text-[11px] font-black uppercase text-primary tracking-widest">Nombre del CCT / Titular Responsable</Label>
                            <Input value={formData.schoolName} onChange={e => setFormData({...formData, schoolName: e.target.value})} className="h-12 font-bold bg-slate-50" />
                          </div>

                          <div className="col-span-1 md:col-span-2 space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-accent border-b border-accent/20 pb-2 tracking-[0.2em]">Ficha Técnica del Plantel</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 shadow-inner">
                              <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-muted-foreground opacity-70">Zona Escolar</Label>
                                <Input value={formData.zonaEscolar} readOnly className="bg-white/50 text-[10px] h-9 font-black border-none" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-muted-foreground opacity-70">Sector</Label>
                                <Input value={formData.sector} readOnly className="bg-white/50 text-[10px] h-9 font-black border-none" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-muted-foreground opacity-70">Modalidad</Label>
                                <Input value={formData.modalidad} readOnly className="bg-white/50 text-[10px] h-9 font-black border-none" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-muted-foreground opacity-70">Valle</Label>
                                <Input value={formData.valle} readOnly className="bg-white/50 text-[10px] h-9 font-black border-none" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-muted-foreground opacity-70">Región</Label>
                                <Input value={formData.region} readOnly className="bg-white/50 text-[10px] h-9 font-black border-none" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-muted-foreground opacity-70">Municipio</Label>
                                <Input value={formData.municipio} readOnly className="bg-white/50 text-[10px] h-9 font-black border-none" />
                              </div>
                            </div>
                          </div>

                          <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                            <div className="space-y-2">
                              <Label className="text-[11px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-accent" /> Fecha de Auditoría
                              </Label>
                              <Input 
                                type="date" 
                                className="h-12 bg-slate-50" 
                                value={formData.date ? formData.date.split('T')[0] : ''} 
                                onChange={e => setFormData({...formData, date: e.target.value})} 
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-[11px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                                <Activity className="h-4 w-4 text-accent" /> Progreso de Implementación (%)
                              </Label>
                              <div className="flex items-center gap-4">
                                <Input 
                                  type="number" 
                                  min="0" max="100" 
                                  className="h-12 w-24 font-black text-center bg-slate-50" 
                                  value={formData.progress} 
                                  onChange={e => setFormData({...formData, progress: parseInt(e.target.value) || 0})} 
                                />
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                   <div className="h-full bg-primary transition-all" style={{ width: `${formData.progress}%` }} />
                                </div>
                              </div>
                            </div>

                            {activeTab === 'Geoposición' ? (
                              <>
                                <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary">Latitud</Label><Input placeholder="19.XXXX" className="h-12 border-primary/20 font-mono bg-slate-50" value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} /></div>
                                <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary">Longitud</Label><Input placeholder="-99.XXXX" className="h-12 border-primary/20 font-mono bg-slate-50" value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} /></div>
                              </>
                            ) : activeTab === 'ATRES' ? (
                              <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                  <Label className="text-[11px] font-black uppercase text-primary">Tipo de Servicio</Label>
                                  <Select value={formData.tipoIncidencia} onValueChange={(val: any) => setFormData({...formData, tipoIncidencia: val})}>
                                    <SelectTrigger className="h-12 bg-slate-50 uppercase font-bold text-[10px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="red edusat" className="text-[10px] uppercase">Red Edusat</SelectItem>
                                      <SelectItem value="red local" className="text-[10px] uppercase">Red Local</SelectItem>
                                      <SelectItem value="instalación red local" className="text-[10px] uppercase">Instalación Red Local</SelectItem>
                                      <SelectItem value="mantenimiento preventivo" className="text-[10px] uppercase">Mantenimiento Preventivo</SelectItem>
                                      <SelectItem value="mantenimiento correctivo" className="text-[10px] uppercase">Mantenimiento Correctivo</SelectItem>
                                      <SelectItem value="teleplanteles" className="text-[10px] uppercase">Teleplanteles</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[11px] font-black uppercase text-primary">Oficina Regional</Label>
                                  <Select value={formData.oficinaRegionalAtencion} onValueChange={(val) => setFormData({...formData, oficinaRegionalAtencion: val})}>
                                    <SelectTrigger className="h-12 bg-slate-50 text-[10px] font-bold"><SelectValue placeholder="Seleccionar oficina..." /></SelectTrigger>
                                    <SelectContent>
                                      {REGIONAL_OFFICES.map(off => (
                                        <SelectItem key={off} value={off} className="text-[10px] uppercase">{off.replace("Oficina de ", "")}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[11px] font-black uppercase text-primary">Número de Oficio</Label>
                                  <Input className="h-12 bg-slate-50 font-mono uppercase" value={formData.numeroOficio} onChange={e => setFormData({...formData, numeroOficio: e.target.value})} placeholder="DESySA/PL/..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Ben. Alumnos</Label><Input type="number" className="h-10 bg-slate-50" value={formData.alumnosBeneficiados} onChange={e => setFormData({...formData, alumnosBeneficiados: parseInt(e.target.value) || 0})} /></div>
                                  <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Ben. Docentes</Label><Input type="number" className="h-10 bg-slate-50" value={formData.docentesBeneficiados} onChange={e => setFormData({...formData, docentesBeneficiados: parseInt(e.target.value) || 0})} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Servicios MC</Label><Input type="number" className="h-10 bg-slate-50" value={formData.serviciosMC} onChange={e => setFormData({...formData, serviciosMC: parseInt(e.target.value) || 0})} /></div>
                                  <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Servicios MP</Label><Input type="number" className="h-10 bg-slate-50" value={formData.serviciosMP} onChange={e => setFormData({...formData, serviciosMP: parseInt(e.target.value) || 0})} /></div>
                                </div>

                                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-100/50 rounded-2xl border border-slate-200">
                                   <div className="space-y-2">
                                      <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-primary">
                                        <FileText className="h-4 w-4 text-blue-600" /> Reporte Oficial (PDF)
                                      </Label>
                                      <Input type="file" accept=".pdf" className="bg-white h-10 text-[10px]" onChange={e => handleFileChange(e, 'pdf')} />
                                      {formData.reportPdf && <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Archivo PDF configurado</p>}
                                   </div>
                                   <div className="space-y-2">
                                      <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-primary">
                                        <ImageIcon className="h-4 w-4 text-pink-600" /> Evidencias Foto (Máx 5)
                                      </Label>
                                      <Input type="file" multiple accept="image/*" className="bg-white h-10 text-[10px]" onChange={e => handleFileChange(e, 'photo')} disabled={(formData.evidencePhotos?.length || 0) >= 5} />
                                      <div className="flex gap-2 flex-wrap mt-2">
                                        {formData.evidencePhotos?.map((p, i) => (
                                          <div key={i} className="relative h-10 w-10 border border-white rounded shadow-sm overflow-hidden">
                                            <Image src={p} alt="ev" fill className="object-cover" />
                                            <button className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5" onClick={() => setFormData(prev => ({ ...prev, evidencePhotos: prev.evidencePhotos?.filter((_, idx) => idx !== i) }))}>
                                              <X className="h-2 w-2" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                   </div>
                                </div>
                              </div>
                            ) : activeTab === 'Cuentas Institucionales' || activeTab === 'Biblioteca Digital' ? (
                              <>
                                <div className="space-y-2">
                                  <Label className="text-[11px] font-black uppercase text-primary flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-accent" /> Email Institucional del Centro
                                  </Label>
                                  <Input className="h-12 font-mono lowercase bg-slate-50" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                </div>
                                {activeTab === 'Biblioteca Digital' && (
                                  <>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-primary">No. Equipos</Label>
                                        <Input type="number" className="h-12 border-primary/10 font-black text-center bg-slate-50" value={formData.numeroEquipos} onChange={e => setFormData({...formData, numeroEquipos: parseInt(e.target.value) || 0})} />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-primary">Capacitado</Label>
                                        <Select value={formData.capacitacion} onValueChange={(val:any) => setFormData({...formData, capacitacion: val})}>
                                          <SelectTrigger className="h-12 border-primary/10 font-black text-[10px] bg-slate-50">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="S" className="text-[10px] font-black">SÍ</SelectItem>
                                            <SelectItem value="N" className="text-[10px] font-black">NO</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-1">
                                        <Label className="text-[10px] font-black uppercase text-primary">Alumnos Ben.</Label>
                                        <Input type="number" className="h-12 bg-slate-50" value={formData.alumnosBeneficiados} onChange={e => setFormData({...formData, alumnosBeneficiados: parseInt(e.target.value) || 0})} />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-[10px] font-black uppercase text-primary">Docentes Ben.</Label>
                                        <Input type="number" className="h-12 bg-slate-50" value={formData.docentesBeneficiados} onChange={e => setFormData({...formData, docentesBeneficiados: parseInt(e.target.value) || 0})} />
                                      </div>
                                    </div>
                                  </>
                                )}
                              </>
                            ) : null}
                          </div>

                          <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label className="text-[11px] font-black uppercase text-primary tracking-widest">Observaciones Técnicas de la Auditoría</Label>
                            <Textarea className="min-h-[120px] border-primary/10 bg-slate-50 rounded-2xl p-4" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} />
                          </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="asistentes" className="h-full m-0 p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      <p className="text-[10px] font-bold text-blue-800 uppercase">Al ingresar el CCT de 10 dígitos, se autocompletarán los datos geográficos del asistente.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleAddAssistant} className="gap-2 font-black uppercase text-[10px] border-primary text-primary hover:bg-primary/5">
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
                                    <SelectValue placeholder="Seleccionar..." />
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
                              <TableCell className="p-2 sticky right-0 bg-white/80 backdrop-blur-sm shadow-l">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveAssistant(idx)} disabled={assistants.length === 1}>
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
          
          <DialogFooter className="p-8 gap-4 border-t bg-slate-50/50">
            {activeTab === 'Biblioteca Digital' && formData.capacitacion === 'S' && (
              <div className="flex-1 flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground">
                <Users className="h-4 w-4" /> Asistentes en lista: {assistants.filter(a => a.rfc && a.nombres).length}
              </div>
            )}
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-[1.2rem] h-14 text-[10px] font-black uppercase px-10 border-slate-200">Cancelar</Button>
            <Button onClick={handleSave} className="btn-institutional px-16 text-[10px] h-14 rounded-[1.2rem]">Guardar Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!evidenceToView} onOpenChange={() => setEvidenceToView(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2 border-b bg-slate-50">
            <DialogTitle className="uppercase font-black text-primary flex items-center gap-2">
              {evidenceToView?.type === 'pdf' ? <FileText className="h-5 w-5 text-blue-600" /> : <ImageIcon className="h-5 w-5 text-pink-600" />}
              {evidenceToView?.title}
              <ExternalLink className="h-3 w-3 text-muted-foreground ml-2" />
            </DialogTitle>
            <DialogDescription className="font-bold text-xs">Visor de evidencias oficiales Módulos Técnicos COEES.</DialogDescription>
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
