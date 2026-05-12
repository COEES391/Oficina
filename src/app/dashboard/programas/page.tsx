
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts'
import { programsData, type ProgramStatus, type ProgramAssistant } from "@/lib/planning-data"
import { schoolsDirectory } from "@/lib/schools-directory"
import { 
  PlusCircle, 
  Pencil, 
  Zap, 
  Table as TableIcon, 
  UserPlus, 
  Mail, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  Ban, 
  MessageSquare, 
  Lock, 
  Eye, 
  Building2, 
  Monitor, 
  Trash2,
  Plus,
  RefreshCw,
  Key
} from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { cn } from '@/lib/utils'

const PROGRAM_RUBROS = [
  'Biblioteca Digital',
  'Cuentas Institucionales (@desysa.gob.mx, @desysa.edu.mx, @coees.edu.mx)',
  'Geoposición',
  'Conoce mi Escuela',
  'Mesa de Ayuda Técnica'
];

const DB_VERSION = "1709_records_official_v3";

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [userRfc, setUserRfc] = useState<string | null>(null)
  const [isEditorialUser, setIsEditorialUser] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [activeTab, setActiveTab] = useState(PROGRAM_RUBROS[0])
  
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' })
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [selectedCctForAction, setSelectedCctForAction] = useState<string | null>(null)
  const [generatedPass, setGeneratedPass] = useState('')

  const [isObservationsDialogOpen, setIsObservationsDialogOpen] = useState(false)
  const [observationsText, setObservationsText] = useState('')

  // Filters for CI Dashboard
  const [modalidadSubFilter, setModalidadSubFilter] = useState('all')
  const [sectorSubFilter, setSectorSubFilter] = useState('all')
  const [areaSubFilter, setAreaSubFilter] = useState('all')
  const [valleSubFilter, setValleSubFilter] = useState('all')

  const initialAssistant: ProgramAssistant = {
    paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: 'DOCENTE', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '', departamento: ''
  };

  const initialFormState: ProgramStatus = {
    id: '', name: '', progress: 0, status: 'planeacion', date: '', cct: '', schoolName: '', zonaEscolar: '', sector: '', modalidad: '', municipio: '', region: '', valle: '',
    numeroEquipos: 0, descripcionEquipo: '', fechaEntrada: '', fechaSalida: '', responsables: ['', '', ''], numeroOficio: '', setes: 'N', observaciones: '', reportPdf: '', evidencePhotos: [],
    capacitacion: 'N', totalParticipantes: 0, asistentes: [initialAssistant], cursoFolio: '', cursoGrupo: '', cursoNombre: '', duracionHoras: 0, fechaInicio: '', fechaTermino: '', instructores: ['', '', ''], cctSede: ''
  }

  const [formData, setFormData] = useState<ProgramStatus>(initialFormState)

  useEffect(() => {
    setMounted(true)
    const rfc = localStorage.getItem('userRfc')
    setUserRfc(rfc)
    if (rfc === 'CEDITORIAL') setIsEditorialUser(true);
    
    const stored = JSON.parse(localStorage.getItem('programs_full') || '[]')
    const storedVersion = localStorage.getItem('programs_db_version')
    
    if (storedVersion !== DB_VERSION || stored.length < 500) {
      setRecords(programsData)
      localStorage.setItem('programs_full', JSON.stringify(programsData))
      localStorage.setItem('programs_db_version', DB_VERSION)
    } else {
      setRecords(stored)
    }
  }, [])

  const handleEditorialLogin = () => {
    if (loginForm.user.toUpperCase() === 'CEDITORIAL' && loginForm.pass === 'SEIEM') {
      setIsEditorialUser(true)
      localStorage.setItem('userRfc', 'CEDITORIAL')
      setUserRfc('CEDITORIAL')
      setIsLoginDialogOpen(false)
      toast({ title: "Acceso Editorial Concedido", description: "Bienvenido al panel de revisión WebEscuela." })
    } else {
      toast({ variant: "destructive", title: "Acceso Denegado", description: "Credenciales de edición incorrectas." })
    }
  }

  const norm = (s: string | undefined) => (s || '').trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Dashboard calculations for CI
  const ciRecordsAll = useMemo(() => {
    return records.filter(r => r.name?.includes('Cuentas') || r.id?.startsWith('PROG-CI'));
  }, [records]);

  const dynamicOptions = useMemo(() => {
    const mods = Array.from(new Set(ciRecordsAll.map(r => r.modalidad).filter(Boolean))).sort();
    const secs = Array.from(new Set(ciRecordsAll.map(r => r.sector).filter(Boolean))).sort();
    const areas = Array.from(new Set(ciRecordsAll.map(r => r.asistentes?.[0]?.departamento).filter(Boolean))).sort();
    const valles = Array.from(new Set(ciRecordsAll.map(r => r.valle).filter(Boolean))).sort();
    return { mods, secs, areas, valles };
  }, [ciRecordsAll]);

  const filteredCuentasRecords = useMemo(() => {
    return ciRecordsAll.filter(r => {
      const matchModalidad = modalidadSubFilter === 'all' || norm(r.modalidad) === norm(modalidadSubFilter);
      const matchSector = sectorSubFilter === 'all' || norm(r.sector) === norm(sectorSubFilter);
      const matchArea = areaSubFilter === 'all' || norm(r.asistentes?.[0]?.departamento) === norm(areaSubFilter);
      const matchValle = valleSubFilter === 'all' || norm(r.valle) === norm(valleSubFilter);
      return matchModalidad && matchSector && matchArea && matchValle;
    });
  }, [ciRecordsAll, modalidadSubFilter, sectorSubFilter, areaSubFilter, valleSubFilter]);

  const cuentasStats = useMemo(() => {
    const total = filteredCuentasRecords.length;
    const term = filteredCuentasRecords.filter(r => r.status === 'concluido').length;
    const act = filteredCuentasRecords.filter(r => r.status === 'activo').length;
    const plan = filteredCuentasRecords.filter(r => r.status === 'planeacion').length;
    const usage = total > 0 ? Math.round((term / total) * 100) : 0;

    return {
      total,
      usage,
      statusData: [
        { name: 'APROBADO', value: term, fill: '#10b981' },
        { name: 'EN PROCESO', value: act, fill: '#f59e0b' },
        { name: 'PLANEACIÓN', value: plan, fill: '#ef4444' },
      ],
      usageData: [
        { name: 'EN USO', value: term, fill: '#621132' },
        { name: 'PENDIENTE', value: total - term, fill: '#cbd5e1' },
      ]
    };
  }, [filteredCuentasRecords]);

  const handleSave = () => {
    if (!formData.id || !formData.cct) {
      toast({ variant: "destructive", title: "ID y CCT obligatorios" });
      return;
    }
    const updated = editingId ? records.map(r => r.id === editingId ? formData : r) : [formData, ...records];
    setRecords(updated)
    localStorage.setItem('programs_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    setEditingId(null)
    toast({ title: "Registro sincronizado exitosamente" })
  }

  const resetForm = (rubro: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setFormData({ 
      ...initialFormState, 
      name: rubro, 
      date: today, 
      fechaEntrada: today, 
      fechaInicio: today, 
      fechaTermino: today,
      id: rubro.startsWith('Biblioteca') ? `PROG-BD-${Date.now()}` : `PROG-${Date.now()}`
    })
    setEditingId(null)
  }

  const addAssistantRow = () => {
    setFormData(prev => ({
      ...prev,
      asistentes: [...(prev.asistentes || []), { ...initialAssistant }]
    }))
  }

  const updateAssistant = (idx: number, field: keyof ProgramAssistant, val: string) => {
    const updated = [...(formData.asistentes || [])];
    updated[idx] = { ...updated[idx], [field]: val };
    
    if (field === 'cct' && val.length === 10) {
      const school = schoolsDirectory.find(s => s.cct === val.toUpperCase());
      if (school) {
        updated[idx] = {
          ...updated[idx],
          nombreCT: school.nombre,
          ze: school.zonaEscolar,
          sector: school.sectorNum,
          modalidad: school.modalidad,
          municipio: school.municipio,
          region: school.region,
          valle: school.valle
        };
      }
    }
    setFormData(prev => ({ ...prev, asistentes: updated }));
  }

  const handleCCTLookup = (val: string) => {
    const clean = val.toUpperCase();
    setFormData(prev => ({ ...prev, cct: clean }));
    if (clean.length === 10) {
      const school = schoolsDirectory.find(s => s.cct === clean);
      if (school) {
        setFormData(prev => ({
          ...prev,
          schoolName: school.nombre,
          valle: school.valle,
          modalidad: school.modalidad,
          sector: school.sectorNum,
          zonaEscolar: school.zonaEscolar,
          municipio: school.municipio,
          region: school.region
        }));
      }
    }
  }

  const generatePassword = (cct: string) => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let pass = "";
    for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setGeneratedPass(pass);
    setSelectedCctForAction(cct);
    setIsPasswordDialogOpen(true);
  }

  const handleEditorialTabClick = (rubro: string) => {
    if (rubro === 'editorial' && !isEditorialUser) {
      setIsLoginDialogOpen(true);
    } else {
      setActiveTab(rubro);
    }
  }

  if (!mounted) return null

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tighter text-primary uppercase leading-none">Gestión Integral de Programas</h2>
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
             <p className="text-muted-foreground font-black text-[11px] uppercase tracking-[0.3em]">Auditoría y Seguimiento • Oficina de Planeación</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleEditorialTabClick} className="space-y-8">
        <TabsList className="w-full h-auto flex flex-wrap bg-slate-100/50 p-1.5 rounded-3xl shadow-inner border border-primary/5">
          {PROGRAM_RUBROS.map(rubro => (
            <TabsTrigger key={rubro} value={rubro} className="flex-1 min-w-[200px] h-14 text-[10px] font-black uppercase tracking-[0.1em] rounded-2xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xl">
              {rubro.includes('(') ? rubro.split('(')[0] : rubro}
            </TabsTrigger>
          ))}
          <TabsTrigger value="editorial" className="flex-1 min-w-[200px] h-14 text-[10px] font-black uppercase tracking-[0.1em] rounded-2xl bg-primary/5 data-[state=active]:bg-primary data-[state=active]:text-white">
            Sección Editorial WebEscuela
          </TabsTrigger>
        </TabsList>

        <TabsContent value="Biblioteca Digital" className="space-y-6">
          <div className="flex justify-between items-center">
             <h3 className="text-xl font-black uppercase text-primary flex items-center gap-3">
               <Monitor className="h-6 w-6" /> Equipamiento de Bibliotecas Digitales
             </h3>
             <Button onClick={() => { resetForm('Biblioteca Digital'); setIsDialogOpen(true); }} className="gap-2 font-black uppercase shadow-lg">
                <PlusCircle className="h-4 w-4" /> Iniciar Captura Técnica
             </Button>
          </div>
          <Card className="executive-card">
            <CardContent className="p-0">
               <Table>
                 <TableHeader className="bg-slate-50/50">
                    <TableRow>
                       <TableHead className="font-black text-[10px] uppercase pl-8">ID / CCT</TableHead>
                       <TableHead className="font-black text-[10px] uppercase">MODALIDAD / VALLE</TableHead>
                       <TableHead className="font-black text-[10px] uppercase text-center">EQUIPOS</TableHead>
                       <TableHead className="font-black text-[10px] uppercase text-center">CAPACITACIÓN</TableHead>
                       <TableHead className="font-black text-[10px] uppercase text-right pr-8">ESTATUS</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {records.filter(r => r.name === 'Biblioteca Digital').map(rec => (
                      <TableRow key={rec.id}>
                         <TableCell className="pl-8 font-black text-slate-700">{rec.cct || rec.id}</TableCell>
                         <TableCell>
                            <div className="flex flex-col">
                               <span className="text-[10px] font-bold uppercase">{rec.modalidad}</span>
                               <span className="text-[9px] text-muted-foreground uppercase">{rec.valle}</span>
                            </div>
                         </TableCell>
                         <TableCell className="text-center font-black">{rec.numeroEquipos || 0}</TableCell>
                         <TableCell className="text-center">
                            <Badge variant={rec.capacitacion === 'S' ? 'default' : 'outline'} className="text-[9px] font-black">
                               {rec.capacitacion === 'S' ? 'REALIZADA' : 'PENDIENTE'}
                            </Badge>
                         </TableCell>
                         <TableCell className="text-right pr-8">
                            <Button variant="ghost" size="icon" onClick={() => { setFormData(rec); setEditingId(rec.id); setIsDialogOpen(true); }}>
                               <Pencil className="h-4 w-4" />
                            </Button>
                         </TableCell>
                      </TableRow>
                    ))}
                 </TableBody>
               </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Cuentas Institucionales (@desysa.gob.mx, @desysa.edu.mx, @coees.edu.mx)" className="space-y-10">
          <div className="space-y-10">
             <div className="flex items-center gap-6">
                <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center shadow-xl"><Zap className="h-8 w-8 text-white" /></div>
                <div>
                   <h2 className="text-3xl font-black text-primary uppercase tracking-tighter leading-none">Herramienta de Monitoreo CI</h2>
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-1">Control Analítico Institucional ({filteredCuentasRecords.length} Registros Filtrados)</p>
                </div>
             </div>
             
             <div className="grid grid-cols-12 gap-8">
                <div className="col-span-3 space-y-6">
                   <Card className="executive-card p-6 bg-slate-50/50 border-2 border-white shadow-inner">
                      <Label className="text-[10px] font-black uppercase text-primary mb-4 block tracking-widest">MODALIDAD</Label>
                      <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                         <Button variant={modalidadSubFilter === 'all' ? 'default' : 'outline'} className="h-10 text-[10px] font-black" onClick={() => setModalidadSubFilter('all')}>TODAS</Button>
                         {dynamicOptions.mods.map(m => (
                            <Button key={m} variant={modalidadSubFilter === m ? 'default' : 'outline'} className="h-10 text-[10px] font-black uppercase" onClick={() => setModalidadSubFilter(m)}>{m || 'N/A'}</Button>
                         ))}
                      </div>
                   </Card>
                </div>

                <div className="col-span-4 flex flex-col gap-8">
                   <Card className="w-full executive-card p-10 flex flex-col items-center justify-center bg-white shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full" />
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">Total Cuentas Filtradas</span>
                      <div className="text-7xl font-black text-slate-800 tracking-tighter relative z-10">{cuentasStats.total}</div>
                   </Card>
                   
                   <Card className="executive-card p-8 flex flex-col items-center">
                      <Label className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-[0.2em]">% CORREO ACTIVO (APROBADO)</Label>
                      <div className="relative h-[220px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie data={cuentasStats.usageData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value">
                                  {cuentasStats.usageData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                               </Pie>
                            </PieChart>
                         </ResponsiveContainer>
                         <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                            <span className="text-4xl font-black text-primary leading-none">{cuentasStats.usage}%</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Avance</span>
                         </div>
                      </div>
                   </Card>
                </div>

                <div className="col-span-5 space-y-8">
                   <Card className="executive-card p-8 h-full bg-white">
                      <div className="flex items-center justify-between mb-8">
                         <CardTitle className="text-xs font-black uppercase text-slate-700 tracking-widest">Estatus Operativo Filtrado</CardTitle>
                         <Badge className="bg-primary/5 text-primary border-none text-[8px] font-black uppercase px-4 py-1">Auditoría SIP</Badge>
                      </div>
                      <div className="h-[350px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cuentasStats.statusData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                               <XAxis dataKey="name" tick={{ fontSize: 9, fontStyle: 'italic', fontWeight: 900 }} axisLine={false} tickLine={false} />
                               <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                               <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                               <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={45}>
                                  {cuentasStats.statusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                               </Bar>
                            </BarChart>
                         </ResponsiveContainer>
                      </div>
                   </Card>
                </div>
             </div>

             <div className="flex justify-between items-center px-4">
                <h4 className="text-lg font-black uppercase text-primary tracking-tighter">Listado Detallado de Registros</h4>
                <Button onClick={() => { resetForm('Cuentas Institucionales'); setIsDialogOpen(true); }} className="gap-2 font-black uppercase shadow-md bg-emerald-600 hover:bg-emerald-700">
                   <UserPlus className="h-4 w-4" /> Agregar Nueva Cuenta
                </Button>
             </div>

             <Card className="executive-card overflow-hidden">
                <div className="overflow-x-auto">
                   <Table>
                      <TableHeader className="bg-slate-100/50">
                         <TableRow>
                            <TableHead className="font-black text-[9px] uppercase pl-8 py-6">USUARIO / CCT</TableHead>
                            <TableHead className="font-black text-[9px] uppercase">MODALIDAD / VALLE</TableHead>
                            <TableHead className="font-black text-[9px] uppercase">CORREO INSTITUCIONAL</TableHead>
                            <TableHead className="font-black text-[9px] uppercase text-right pr-8">ESTATUS</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {filteredCuentasRecords.slice(0, 50).map((rec, i) => (
                            <TableRow key={i} className="text-[10px] font-bold hover:bg-slate-50 transition-colors">
                               <TableCell className="pl-8 py-4 text-primary font-black uppercase">{rec.cct || rec.id}</TableCell>
                               <TableCell>
                                  <div className="flex flex-col">
                                     <span className="uppercase text-[9px] font-black text-slate-700">{rec.modalidad}</span>
                                     <span className="uppercase text-[8px] text-slate-400">{rec.valle}</span>
                                  </div>
                               </TableCell>
                               <TableCell className="font-mono text-blue-600">{rec.asistentes?.[0]?.email}</TableCell>
                               <TableCell className="text-right pr-8">
                                  <Badge className={cn("text-[8px] font-black uppercase px-4", rec.status === 'concluido' ? 'bg-emerald-500 text-white' : rec.status === 'activo' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white')}>
                                     {rec.status === 'concluido' ? 'APROBADO' : rec.status === 'activo' ? 'EN PROCESO' : 'PLANEACIÓN'}
                                  </Badge>
                               </TableCell>
                            </TableRow>
                         ))}
                      </TableBody>
                   </Table>
                </div>
             </Card>
          </div>
        </TabsContent>

        <TabsContent value="Conoce mi Escuela" className="space-y-10">
          <div className="grid md:grid-cols-2 gap-10">
             <Card className="executive-card p-10 border-l-8 border-l-primary group">
                <div className="space-y-6">
                   <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
                      <Building2 className="h-8 w-8" />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-2xl font-black uppercase text-primary leading-tight">Portal Escolar Oficial WebEscuela SEIEM</h3>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Plataforma Digital de Identidad Institucional</p>
                   </div>
                   <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      "Conoce mi Escuela" es la vertiente oficial de SEIEM encargada de proyectar la identidad de cada plantel ante la comunidad. 
                      Permite a los directores gestionar la información técnica, fotos de evidencia, misión, visión y servicios educativos 
                      para la publicación automática del sitio web institucional de su plantel.
                   </p>
                </div>
             </Card>

             <Card className="executive-card p-10 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                <div className="relative z-10 space-y-8">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                         <Zap className="h-6 w-6 text-accent" />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-[0.3em]">Lineamientos de Publicación</h4>
                   </div>
                   <div className="space-y-6">
                      {[
                        { step: "01", title: "CAPTURA DE DATOS", desc: "El CCT ingresa con su usuario para alimentar el portal." },
                        { step: "02", title: "REVISIÓN EDITORIAL", desc: "El equipo de Planeación valida la calidad de la información." },
                        { step: "03", title: "PUBLICACIÓN WEB", desc: "Se genera automáticamente el dominio público bajo SEIEM." }
                      ].map((item, i) => (
                        <div key={i} className="flex gap-6 items-start">
                           <span className="text-2xl font-black text-primary">{item.step}</span>
                           <div>
                              <h5 className="text-[11px] font-black uppercase tracking-wider mb-1">{item.title}</h5>
                              <p className="text-[10px] text-slate-400 font-bold leading-normal uppercase">{item.desc}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </Card>
          </div>
        </TabsContent>

        <TabsContent value="editorial" className="space-y-8">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center shadow-lg"><Lock className="h-6 w-6 text-white" /></div>
                 <div>
                    <h3 className="text-xl font-black uppercase text-primary leading-none">Bienvenido a la Sección Editorial</h3>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Revisión Técnica y Publicación Oficial de Portales WebEscuela</p>
                 </div>
              </div>
           </div>

           <Card className="executive-card shadow-2xl border-t-8 border-t-primary">
              <div className="overflow-x-auto">
                 <Table>
                    <TableHeader className="bg-slate-100">
                       <TableRow>
                          <TableHead className="font-black text-[9px] uppercase pl-8">No.</TableHead>
                          <TableHead className="font-black text-[9px] uppercase">CCT</TableHead>
                          <TableHead className="font-black text-[9px] uppercase">Vertiente</TableHead>
                          <TableHead className="font-black text-[9px] uppercase">Sector</TableHead>
                          <TableHead className="font-black text-[9px] uppercase">Zona</TableHead>
                          <TableHead className="font-black text-[9px] uppercase">F. Alta</TableHead>
                          <TableHead className="font-black text-[9px] uppercase text-right pr-8">Acciones</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {records.filter(r => r.name?.includes('Conoce') || r.id?.startsWith('WEB-')).map((rec, i) => (
                          <TableRow key={rec.id} className="text-[10px] font-bold hover:bg-slate-50">
                             <TableCell className="pl-8 text-slate-400">{i + 1}</TableCell>
                             <TableCell className="text-primary font-black uppercase">{rec.cct || '-'}</TableCell>
                             <TableCell className="uppercase">{rec.modalidad || '-'}</TableCell>
                             <TableCell className="text-center">{rec.sector || '-'}</TableCell>
                             <TableCell className="text-center">{rec.zonaEscolar || '-'}</TableCell>
                             <TableCell className="text-slate-500">{rec.date || '-'}</TableCell>
                             <TableCell className="text-right pr-8">
                                <div className="flex justify-end gap-2">
                                   <Button variant="outline" size="sm" className="h-8 text-[8px] font-black uppercase border-blue-200 text-blue-600 gap-1">
                                      <Eye className="h-3.5 w-3.5" /> Revisar
                                   </Button>
                                   <Button variant="outline" size="sm" className="h-8 text-[8px] font-black uppercase border-emerald-200 text-emerald-600 gap-1">
                                      <CheckCircle2 className="h-3.5 w-3.5" /> Publicar
                                   </Button>
                                   <Button variant="outline" size="icon" className="h-8 w-8 border-amber-200 text-amber-600" onClick={() => generatePassword(rec.cct || 'N/A')}>
                                      <Key className="h-3.5 w-3.5" />
                                   </Button>
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

      {/* Login Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="hidden"><DialogTitle>Acceso Editorial</DialogTitle></DialogHeader>
          <div className="bg-primary p-8 text-white text-center">
             <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><ShieldCheck className="h-10 w-10" /></div>
             <h3 className="text-xl font-black uppercase tracking-tighter">Acceso Editorial</h3>
          </div>
          <div className="p-8 space-y-6 bg-white">
             <Input placeholder="USUARIO" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value.toUpperCase()})} className="h-14 rounded-2xl bg-slate-50 border-none font-black px-6" />
             <Input type="password" placeholder="CONTRASEÑA" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none font-black px-6" />
             <Button onClick={handleEditorialLogin} className="w-full h-14 rounded-2xl font-black uppercase bg-primary text-white">Ingresar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Capture Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[1200px] h-[90vh] flex flex-col p-0 rounded-[2.5rem] overflow-hidden">
          <DialogHeader className="p-8 border-b bg-slate-50">
             <DialogTitle className="text-2xl font-black uppercase text-primary tracking-tighter">
                Captura Técnica - {formData.name}
             </DialogTitle>
             <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground tracking-widest">
                Sincronización de registros institucionales SEIEM
             </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 p-8 bg-white">
             <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-primary ml-2">CCT / Clave de Plantel</Label>
                      <Input placeholder="15XXXXXX" value={formData.cct} onChange={e => handleCCTLookup(e.target.value)} maxLength={10} className="h-14 rounded-2xl bg-white border-2 border-slate-100 font-black px-6 uppercase" />
                   </div>
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-primary ml-2">Estatus Administrativo</Label>
                      <Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val})}>
                        <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-black px-6"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                           <SelectItem value="planeacion" className="text-[10px] font-black">PENDIENTE / PLANEACIÓN</SelectItem>
                           <SelectItem value="activo" className="text-[10px] font-black">EN PROCESO / ACTIVO</SelectItem>
                           <SelectItem value="concluido" className="text-[10px] font-black">APROBADO / CONCLUIDO</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                </div>

                {formData.name === 'Biblioteca Digital' && (
                   <div className="space-y-8">
                      <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border-2 border-white">
                         <div>
                            <h5 className="text-xs font-black uppercase text-slate-700">Capacitación Institucional</h5>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">¿Se realizó curso de capacitación al personal?</p>
                         </div>
                         <Switch checked={formData.capacitacion === 'S'} onCheckedChange={checked => setFormData({...formData, capacitacion: checked ? 'S' : 'N'})} />
                      </div>

                      {formData.capacitacion === 'S' && (
                         <div className="space-y-10 pt-6 border-t animate-in slide-in-from-top-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div className="space-y-3">
                                  <Label className="text-[10px] font-black uppercase text-primary ml-2">Nombre del Curso</Label>
                                  <Input value={formData.cursoNombre} onChange={e => setFormData({...formData, cursoNombre: e.target.value})} className="h-14 rounded-2xl bg-white border-2 border-slate-100 font-black px-6" />
                               </div>
                               <div className="space-y-3">
                                  <Label className="text-[10px] font-black uppercase text-primary ml-2">Folio de Registro</Label>
                                  <Input value={formData.cursoFolio} onChange={e => setFormData({...formData, cursoFolio: e.target.value})} className="h-14 rounded-2xl bg-white border-2 border-slate-100 font-black px-6" />
                               </div>
                            </div>
                            
                            <div className="space-y-6">
                               <div className="flex justify-between items-center">
                                  <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Personal Capacitado</h5>
                                  <Button variant="outline" size="sm" onClick={addAssistantRow} className="h-10 px-6 rounded-xl border-primary text-primary font-black uppercase text-[9px]">
                                     <Plus className="h-4 w-4 mr-2" /> Añadir Fila
                                  </Button>
                               </div>

                               <div className="border-2 border-slate-50 rounded-[2rem] overflow-hidden">
                                  <ScrollArea className="w-full">
                                     <Table>
                                        <TableHeader className="bg-slate-50">
                                           <TableRow>
                                              <TableHead className="w-10 text-[9px] font-black uppercase">#</TableHead>
                                              <TableHead className="min-w-[200px] text-[9px] font-black uppercase">Nombre(s) y Apellidos</TableHead>
                                              <TableHead className="min-w-[150px] text-[9px] font-black uppercase">RFC</TableHead>
                                              <TableHead className="min-w-[120px] text-[9px] font-black uppercase">Función</TableHead>
                                              <TableHead className="text-right pr-6 w-10"></TableHead>
                                           </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                           {(formData.asistentes || []).map((ast, idx) => (
                                              <TableRow key={idx} className="hover:bg-slate-50/50">
                                                 <TableCell className="text-[10px] font-black text-slate-300 pl-6">{idx + 1}</TableCell>
                                                 <TableCell className="p-4">
                                                    <div className="flex gap-2">
                                                       <Input placeholder="Nombres" className="h-9 rounded-lg text-[10px] font-black" value={ast.nombres} onChange={e => updateAssistant(idx, 'nombres', e.target.value)} />
                                                       <Input placeholder="Apellidos" className="h-9 rounded-lg text-[10px]" value={ast.paterno} onChange={e => updateAssistant(idx, 'paterno', e.target.value)} />
                                                    </div>
                                                 </TableCell>
                                                 <TableCell className="p-4">
                                                    <Input placeholder="RFC" className="h-10 rounded-lg text-[10px] font-mono uppercase" value={ast.rfc} onChange={e => updateAssistant(idx, 'rfc', e.target.value.toUpperCase())} />
                                                 </TableCell>
                                                 <TableCell className="p-4">
                                                    <Select value={ast.funcion} onValueChange={v => updateAssistant(idx, 'funcion', v)}>
                                                       <SelectTrigger className="h-10 rounded-lg text-[10px] font-bold"><SelectValue /></SelectTrigger>
                                                       <SelectContent>
                                                          <SelectItem value="DOCENTE" className="text-[10px]">DOCENTE</SelectItem>
                                                          <SelectItem value="DIRECTIVO" className="text-[10px]">DIRECTIVO</SelectItem>
                                                          <SelectItem value="ADMINISTRATIVO" className="text-[10px]">ADMINISTRATIVO</SelectItem>
                                                       </SelectContent>
                                                    </Select>
                                                 </TableCell>
                                                 <TableCell className="text-right pr-6">
                                                    <Button variant="ghost" size="icon" className="text-rose-500" onClick={() => setFormData(prev => ({ ...prev, asistentes: prev.asistentes?.filter((_, i) => i !== idx) }))}>
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
                         </div>
                      )}
                   </div>
                )}

                <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase text-primary ml-2">Observaciones Técnicas / Operativas</Label>
                   <Textarea value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder="Detalles adicionales del registro..." className="min-h-[120px] rounded-[1.5rem] border-2 border-slate-100 p-6 font-medium text-slate-600 focus:border-primary transition-all" />
                </div>
             </div>
          </ScrollArea>

          <DialogFooter className="p-8 border-t bg-slate-50 flex justify-end gap-4">
             <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-14 px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-white">Cancelar</Button>
             <Button onClick={handleSave} className="h-14 px-14 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] bg-primary hover:bg-primary/90 text-white shadow-2xl transition-all hover:scale-105 active:scale-95">
                Guardar Registro
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Action Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
         <DialogContent className="sm:max-w-[450px] rounded-3xl p-8 border-none shadow-2xl">
            <DialogHeader>
               <DialogTitle className="text-xl font-black uppercase text-primary flex items-center gap-3">
                  <Key className="h-6 w-6" /> Gestión de Acceso CCT
               </DialogTitle>
               <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground mt-2">
                  Credenciales de acceso para captura WebEscuela
               </DialogDescription>
            </DialogHeader>
            <div className="py-10 space-y-6">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Contraseña Generada para {selectedCctForAction}</Label>
                  <div className="h-20 rounded-2xl bg-primary/5 flex items-center justify-center border-2 border-dashed border-primary/20">
                     <span className="text-4xl font-black text-primary tracking-[0.2em] font-mono">{generatedPass}</span>
                  </div>
               </div>
               <p className="text-[10px] font-bold text-slate-500 uppercase text-center italic">Comparta esta clave con el Director del plantel para iniciar su captura oficial.</p>
            </div>
            <DialogFooter>
               <Button onClick={() => setIsPasswordDialogOpen(false)} className="w-full h-14 rounded-2xl font-black uppercase bg-primary text-white shadow-xl">Entendido y Finalizar</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  )
}
