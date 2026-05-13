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
  Pie
} from 'recharts'
import { programsData, type ProgramStatus, type ProgramAssistant } from "@/lib/planning-data"
import { schoolsDirectory } from "@/lib/schools-directory"
import { 
  PlusCircle, 
  Pencil, 
  Monitor, 
  Trash2,
  Activity,
  MapPin,
  Globe,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Building2,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Plus,
  BarChart3,
  ListFilter,
  ShieldCheck
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const PROGRAM_RUBROS = [
  'Biblioteca Digital',
  'Cuentas Institucionales',
  'Geoposición',
  'Conoce mi Escuela'
];

const FUNCIONES = [
  "ADMINISTRATIVO",
  "DOCENTE",
  "DIRECTIVO",
  "JEFE DE ENSEÑANZA",
  "SUPERVISOR",
  "ASESOR TECNICO PEDAGOGICO"
]

const DB_VERSION = "coees_institutional_final_v55";

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
  const [activeDialogTab, setActiveDialogTab] = useState('datos')

  const [valFilter, setValFilter] = useState('all')
  const [modFilter, setModFilter] = useState('all')
  const [domFilter, setDomFilter] = useState('all')
  const [ciActiveInternalTab, setCiActiveInternalTab] = useState('analitica')

  const [sortConfig, setSortConfig] = useState<{ key: 'cct', direction: 'asc' | 'desc' | null }>({ key: 'cct', direction: 'asc' });

  const initialAssistant: ProgramAssistant = {
    paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: 'DOCENTE', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '', departamento: ''
  };

  const initialFormState: ProgramStatus = {
    id: '', name: '', progress: 0, status: 'activo', date: new Date().toISOString(), cct: '', schoolName: '', zonaEscolar: '', sector: '', modalidad: '', municipio: '', region: '', valle: '',
    numeroEquipos: 0, descripcionEquipo: '', responsables: ['', '', ''], setes: 'N', observaciones: '', capacitacion: 'N', asistentes: [initialAssistant],
    cursoGrupo: '', cursoNombre: '', duracionHoras: 0, fechaInicio: '', fechaTermino: '', instructores: ['', '', ''], cctSede: '', numeroOficio: ''
  }

  const [formData, setFormData] = useState<ProgramStatus>(initialFormState)

  useEffect(() => {
    setMounted(true)
    const rfc = localStorage.getItem('userRfc')
    setUserRfc(rfc)
    if (rfc === 'CEDITORIAL') setIsEditorialUser(true);
    
    const storedVersion = localStorage.getItem('programs_db_version_v55')
    if (storedVersion !== DB_VERSION) {
      setRecords(programsData)
      localStorage.setItem('programs_full', JSON.stringify(programsData))
      localStorage.setItem('programs_db_version_v55', DB_VERSION)
    } else {
      const stored = JSON.parse(localStorage.getItem('programs_full') || '[]')
      setRecords(stored.length > 0 ? stored : programsData)
    }
  }, [])

  const handleEditorialLogin = () => {
    if (loginForm.user.toUpperCase() === 'CEDITORIAL' && loginForm.pass.toUpperCase() === 'COEES') {
      setIsEditorialUser(true)
      localStorage.setItem('userRfc', 'CEDITORIAL')
      setUserRfc('CEDITORIAL')
      setIsLoginDialogOpen(false)
      toast({ title: "Acceso Concedido", description: "Bienvenido a la Sección Editorial COEES." })
    } else {
      toast({ variant: "destructive", title: "Error", description: "Credenciales inválidas." })
    }
  }

  const handleSave = () => {
    if (!formData.id || !formData.cct) {
      toast({ variant: "destructive", title: "Datos Incompletos", description: "Folio y CCT obligatorios." });
      return;
    }
    const updated = editingId ? records.map(r => r.id === editingId ? formData : r) : [formData, ...records];
    setRecords(updated)
    localStorage.setItem('programs_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    setEditingId(null)
    setFormData(initialFormState)
    setActiveDialogTab('datos')
    toast({ title: "Registro guardado" })
  }

  const handleAddAssistantRow = () => {
    setFormData(prev => ({
      ...prev,
      asistentes: [...(prev.asistentes || []), { ...initialAssistant }]
    }))
  }

  const handleRemoveAssistantRow = (index: number) => {
    if ((formData.asistentes?.length || 0) <= 1) return
    setFormData(prev => ({
      ...prev,
      asistentes: prev.asistentes?.filter((_, i) => i !== index)
    }))
  }

  const updateAssistantField = (index: number, field: keyof ProgramAssistant, value: string) => {
    const newAsistentes = [...(formData.asistentes || [])]
    newAsistentes[index] = { ...newAsistentes[index], [field]: value }

    if (field === 'cct') {
      const cleanValue = value.trim().toUpperCase()
      if (cleanValue.length === 10) {
        const school = schoolsDirectory.find(s => s.cct.toUpperCase() === cleanValue)
        if (school) {
          newAsistentes[index] = {
            ...newAsistentes[index],
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
    setFormData(prev => ({ ...prev, asistentes: newAsistentes }))
  }

  const bdRecords = useMemo(() => records.filter(r => r.name === 'Biblioteca Digital'), [records]);
  const ciRecords = useMemo(() => records.filter(r => r.name === 'Cuentas Institucionales' || r.id.startsWith('PROG-CI') || (r.name && r.name.includes('Cuentas'))), [records]);
  const geoRecords = useMemo(() => records.filter(r => r.name === 'Geoposición' || r.id.startsWith('PROG-GEO')), [records]);
  
  const editorialRecords = useMemo(() => {
    let filtered = records.filter(r => r.id.startsWith('ED-') || r.id.startsWith('WEB-') || r.name === 'Conoce mi Escuela');
    if (sortConfig.direction !== null) {
      filtered.sort((a, b) => {
        const valA = (a.cct || '').toUpperCase();
        const valB = (b.cct || '').toUpperCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [records, sortConfig]);

  const ciDashboardData = useMemo(() => {
    const filtered = ciRecords.filter(r => {
      const vMatch = valFilter === 'all' || (r.valle || '').toUpperCase() === valFilter.toUpperCase();
      const mMatch = modFilter === 'all' || (r.modalidad || '').includes(modFilter);
      const email = r.asistentes?.[0]?.email || '';
      const dMatch = domFilter === 'all' || email.toLowerCase().includes(domFilter.toLowerCase());
      return vMatch && mMatch && dMatch;
    });
    const approved = filtered.filter(r => r.status === 'activo').length;
    return {
      filtered,
      total: filtered.length,
      usagePercent: filtered.length > 0 ? Math.round((approved / filtered.length) * 100) : 0,
      pieData: [
        { name: 'ACTIVO', value: approved, fill: '#10b981' },
        { name: 'INACTIVO', value: Math.max(0, filtered.length - approved), fill: '#f43f5e' }
      ],
      barData: [
        { name: 'ACTIVO', value: approved, fill: '#621132' },
        { name: 'INACTIVO', value: Math.max(0, filtered.length - approved), fill: '#cbd5e1' }
      ]
    };
  }, [ciRecords, valFilter, modFilter, domFilter]);

  if (!mounted) return null

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-3">
            <h2 className="text-4xl font-black tracking-tighter text-primary uppercase leading-none">Módulos COEES</h2>
            <div className="flex items-center gap-4">
              <span className="h-1 w-12 bg-accent/30 rounded-full" />
              <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-2">
                <Activity className="h-3 w-3 text-accent" /> Control Técnico Operativo
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="w-full h-16 flex bg-white border border-slate-100 p-1.5 rounded-2xl shadow-sm">
            {PROGRAM_RUBROS.map(rubro => (
              <TabsTrigger 
                key={rubro} 
                value={rubro} 
                className="flex-1 h-full text-[10px] font-black uppercase rounded-xl tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
              >
                {rubro}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="Biblioteca Digital" className="space-y-8 animate-in fade-in duration-500">
            <Card className="executive-card p-10 flex items-center justify-between border-2 border-white">
               <div className="flex items-center gap-6">
                 <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                   <Monitor className="h-7 w-7" />
                 </div>
                 <div>
                   <h3 className="text-2xl font-black uppercase text-slate-800 leading-none">Infraestructura Digital</h3>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Monitoreo de Equipamiento y Personal</p>
                 </div>
               </div>
               <Button onClick={() => { setFormData({...initialFormState, name: 'Biblioteca Digital', id: `PROG-BD-${Date.now()}`}); setEditingId(null); setIsDialogOpen(true); }} className="btn-institutional px-10">
                  <PlusCircle className="h-5 w-5 mr-2" /> Iniciar Registro
               </Button>
            </Card>

            <Card className="executive-card">
              <div className="overflow-x-auto">
                <table className="table-institutional">
                  <thead>
                    <tr>
                      <th className="pl-10 text-left">Referencia CCT</th>
                      <th className="text-left">Modalidad / Valle</th>
                      <th>Equipos</th>
                      <th>Capacitación</th>
                      <th className="pr-10 text-right">Gestión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bdRecords.length > 0 ? bdRecords.map(rec => (
                      <TableRow key={rec.id} className="hover:bg-slate-50 transition-all">
                        <TableCell className="pl-10 text-left">
                          <span className="font-black text-slate-800 text-sm">{rec.cct || rec.id}</span>
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="flex flex-col gap-1">
                            <Badge className="bg-slate-900 text-white border-none text-[8px] font-black w-fit uppercase px-2">{rec.modalidad}</Badge>
                            <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{rec.valle}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                           <span className="h-10 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-primary mx-auto">{rec.numeroEquipos}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "text-[8px] font-black uppercase px-3 py-1 rounded-full border-none",
                            rec.capacitacion === 'S' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                          )}>
                            {rec.capacitacion === 'S' ? 'REALIZADA' : 'PENDIENTE'}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-10 text-right">
                          <div className="flex justify-end gap-2">
                             <Button variant="outline" size="icon" onClick={() => {setFormData(rec); setEditingId(rec.id); setIsDialogOpen(true);}} className="h-9 w-9 rounded-xl"><Pencil className="h-4 w-4" /></Button>
                             <Button variant="outline" size="icon" onClick={() => setRecords(records.filter(r => r.id !== rec.id))} className="h-9 w-9 rounded-xl text-rose-500 border-rose-100 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={5} className="py-20 text-slate-300 font-black uppercase">Sin registros en este rubro</TableCell></TableRow>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="Cuentas Institucionales" className="space-y-8 animate-in fade-in duration-500">
             <Card className="executive-card p-10 flex items-center justify-between border-2 border-white bg-slate-900 text-white">
               <div className="flex items-center gap-6">
                 <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center shadow-2xl">
                   <Globe className="h-7 w-7 text-white" />
                 </div>
                 <div>
                   <h3 className="text-2xl font-black uppercase tracking-tight leading-none">Gestión de Identidades @COEES</h3>
                   <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-2">Auditoría de Cuentas Institucionales</p>
                 </div>
               </div>
               <Button onClick={() => { setFormData({...initialFormState, name: 'Cuentas Institucionales', id: `PROG-CI-${Date.now()}`}); setEditingId(null); setIsDialogOpen(true); }} className="bg-white hover:bg-slate-100 text-primary font-black uppercase text-[10px] h-12 px-10 rounded-xl transition-all shadow-2xl">
                  <PlusCircle className="h-5 w-5 mr-2" /> Nueva Cuenta
               </Button>
             </Card>

             <Tabs value={ciActiveInternalTab} onValueChange={setCiActiveInternalTab} className="w-full">
                <TabsList className="bg-white border border-slate-100 p-1 rounded-xl mb-6 shadow-sm inline-flex h-12">
                   <TabsTrigger value="analitica" className="gap-2 text-[9px] font-black uppercase px-6 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Analítica</TabsTrigger>
                   <TabsTrigger value="registros" className="gap-2 text-[9px] font-black uppercase px-6 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Registros</TabsTrigger>
                </TabsList>

                <TabsContent value="analitica" className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                      <Card className="md:col-span-3 p-8 space-y-8 bg-white border border-slate-100 rounded-[2rem]">
                         <div className="space-y-4">
                            <Label className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Valle</Label>
                            <div className="flex flex-col gap-2">
                               {['all', 'MÉXICO', 'TOLUCA'].map(v => (
                                 <button key={v} onClick={() => setValFilter(v)} className={cn("text-[9px] font-black py-2.5 px-4 rounded-lg text-left transition-all border", valFilter === v ? "bg-primary text-white border-primary" : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50")}>
                                    {v === 'all' ? 'AMBOS' : v}
                                 </button>
                               ))}
                            </div>
                         </div>
                         <div className="space-y-4 pt-6 border-t">
                            <Label className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Modalidad</Label>
                            <Select value={modFilter} onValueChange={setModFilter}>
                               <SelectTrigger className="h-10 text-[9px] font-black rounded-lg"><SelectValue /></SelectTrigger>
                               <SelectContent>
                                  <SelectItem value="all" className="text-[9px] font-black">TODAS</SelectItem>
                                  <SelectItem value="DES" className="text-[9px] font-black">DES</SelectItem>
                                  <SelectItem value="DST" className="text-[9px] font-black">DST</SelectItem>
                                  <SelectItem value="DTV" className="text-[9px] font-black">DTV</SelectItem>
                                </SelectContent>
                            </Select>
                         </div>
                      </Card>

                      <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-8">
                         <Card className="executive-card p-10 flex flex-col items-center justify-center bg-white border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total de Cuentas</span>
                            <div className="text-6xl font-black text-primary tracking-tighter">{ciDashboardData.total}</div>
                         </Card>

                         <Card className="executive-card p-8 flex flex-col items-center bg-white border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Eficiencia Operativa</span>
                            <div className="h-[180px] w-full relative">
                               <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                     <Pie data={ciDashboardData.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value">
                                        {ciDashboardData.pieData.map((e, i) => <Cell key={i} fill={e.fill} stroke="none" />)}
                                     </Pie>
                                  </PieChart>
                               </ResponsiveContainer>
                               <div className="absolute inset-0 flex items-center justify-center flex-col">
                                  <span className="text-3xl font-black text-slate-800">{ciDashboardData.usagePercent}%</span>
                                  <span className="text-[8px] font-black uppercase text-slate-400">Activo</span>
                               </div>
                            </div>
                         </Card>

                         <Card className="executive-card p-8 bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 block">Distribución de Estatus</span>
                            <div className="h-[200px]">
                               <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={ciDashboardData.barData}>
                                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                     <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                     <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40}>
                                        {ciDashboardData.barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                     </Bar>
                                  </BarChart>
                               </ResponsiveContainer>
                            </div>
                         </Card>
                      </div>
                   </div>
                </TabsContent>

                <TabsContent value="registros">
                   <Card className="executive-card">
                      <table className="table-institutional">
                         <thead>
                            <tr>
                               <th className="pl-10 text-left">Centro de Trabajo</th>
                               <th className="text-left">Titular de la Cuenta</th>
                               <th>Correo Institucional</th>
                               <th>Estatus</th>
                               <th className="pr-10 text-right">Acción</th>
                            </tr>
                         </thead>
                         <tbody>
                            {ciDashboardData.filtered.map(rec => (
                              <TableRow key={rec.id} className="hover:bg-slate-50 transition-all">
                                 <TableCell className="pl-10 text-left font-black text-slate-800">{rec.cct}</TableCell>
                                 <TableCell className="text-left font-bold text-slate-600 uppercase text-[10px]">{rec.asistentes?.[0]?.nombres || 'PENDIENTE'}</TableCell>
                                 <TableCell className="font-mono text-primary text-[10px]">{rec.asistentes?.[0]?.email || '-'}</TableCell>
                                 <TableCell>
                                    <Badge className={cn("text-[8px] font-black uppercase px-3 py-1 rounded-full border-none", rec.status === 'activo' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white")}>
                                       {rec.status}
                                    </Badge>
                                 </TableCell>
                                 <TableCell className="pr-10 text-right">
                                    <Button variant="ghost" size="icon" onClick={() => {setFormData(rec); setEditingId(rec.id); setIsDialogOpen(true);}} className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                                 </TableCell>
                              </TableRow>
                            ))}
                         </tbody>
                      </table>
                   </Card>
                </TabsContent>
             </Tabs>
          </TabsContent>

          <TabsContent value="Geoposición" className="animate-in fade-in duration-500">
             <Card className="executive-card p-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
                <MapPin className="h-20 w-20 text-slate-200 mb-6" />
                <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Auditoría Geográfica</h3>
                <p className="text-[10px] font-bold text-slate-300 uppercase mt-4">Módulo en proceso de sincronización con servidor Edoméx 2026</p>
             </Card>
          </TabsContent>

          <TabsContent value="Conoce mi Escuela" className="animate-in fade-in duration-500">
             {!isEditorialUser ? (
               <Card className="executive-card max-w-4xl mx-auto border-2 border-white shadow-2xl overflow-hidden">
                  <div className="bg-primary p-12 text-center text-white space-y-6">
                     <h1 className="text-3xl font-black uppercase tracking-tight">Portal Editorial WebEscuela</h1>
                     <p className="text-sm font-bold text-white/60 uppercase tracking-[0.3em]">Validación e Incorporación Técnica</p>
                  </div>
                  <div className="p-16 space-y-10 text-center">
                     <p className="text-lg text-slate-600 leading-relaxed font-medium">Acceda al servidor central de auditoría para gestionar los 827 portales escolares del Estado de México.</p>
                     <Button onClick={() => setIsLoginDialogOpen(true)} className="btn-institutional px-16 h-16 text-lg">Iniciar Auditoría Técnica</Button>
                  </div>
               </Card>
             ) : (
               <div className="space-y-8 animate-in fade-in duration-700">
                  <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                     <div className="flex items-center gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20"><ShieldCheck className="h-8 w-8" /></div>
                        <div>
                           <h2 className="text-2xl font-black text-slate-800 uppercase leading-none">Servidor Editorial COEES</h2>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Monitoreo de 827 Registros Oficiales</p>
                        </div>
                     </div>
                     <Button variant="destructive" onClick={() => {setIsEditorialUser(false); setUserRfc(null); localStorage.removeItem('userRfc');}} className="h-12 px-10 rounded-xl font-black uppercase text-[10px] tracking-widest">Cerrar Sesión Editorial</Button>
                  </div>

                  <Card className="executive-card p-0 shadow-2xl border-4 border-white h-[700px]">
                     <ScrollArea className="h-full w-full">
                        <table className="table-institutional min-w-[3000px] border-black">
                           <thead className="sticky top-0 z-30 shadow-md">
                              <tr>
                                 <th className="border-r border-black p-4 w-16 bg-slate-100 text-black">No.</th>
                                 <th className="border-r border-black p-4 bg-slate-100 text-black text-left cursor-pointer hover:bg-slate-200" onClick={() => setSortConfig(p => ({ key: 'cct', direction: p.direction === 'asc' ? 'desc' : 'asc' }))}>CENTRO DE TRABAJO</th>
                                 <th className="border-r border-black p-4 bg-slate-100 text-black">AGRUPADO</th>
                                 <th className="border-r border-black p-4 bg-slate-100 text-black">VERTIENTE</th>
                                 <th className="border-r border-black p-4 bg-slate-100 text-black">SECTOR</th>
                                 <th className="border-r border-black p-4 bg-slate-100 text-black">ZONA</th>
                                 <th className="border-r border-black p-4 bg-slate-100 text-black">ALTA</th>
                                 <th className="border-r border-black p-4 bg-slate-100 text-black">MODIF</th>
                                 <th className="border-r border-black p-4 bg-slate-100 text-black">REVISIÓN</th>
                                 <th className="border-r border-black p-4 bg-slate-100 text-black">PUBLICACIÓN</th>
                                 <th className="border-r border-black p-4 bg-primary text-white min-w-[250px]">FECHA DE SUSPENSIÓN / ACCIONES</th>
                                 <th className="border-r border-black p-4 min-w-[800px] bg-slate-100 text-black">OBSERVACIONES HISTÓRICAS</th>
                                 <th className="p-4 bg-slate-100 text-black text-left">ECONTACTO</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-black">
                              {editorialRecords.map((rec, idx) => (
                                <tr key={rec.id} className="hover:bg-slate-50 transition-colors align-top border-b border-black">
                                   <td className="border-r border-black p-4 text-center font-black text-sm">{idx + 1}</td>
                                   <td className="border-r border-black p-4 font-black uppercase text-slate-900 text-sm tracking-tighter text-left">{rec.cct}</td>
                                   <td className="border-r border-black p-4 font-mono text-slate-500 uppercase text-xs text-left">{rec.agrupado || '-'}</td>
                                   <td className="border-r border-black p-4 text-center uppercase font-black text-[10px]">{rec.vertiente || '-'}</td>
                                   <td className="border-r border-black p-4 text-center font-black text-sm">{rec.sector || '-'}</td>
                                   <td className="border-r border-black p-4 text-center font-black text-sm">{rec.zonaEscolar || '-'}</td>
                                   <td className="border-r border-black p-4 text-slate-400 text-center text-[10px] tabular-nums">{rec.fechaAlta || '-'}</td>
                                   <td className="border-r border-black p-4 text-slate-400 text-center text-[10px] tabular-nums">{rec.fechaModif || '-'}</td>
                                   <td className="border-r border-black p-4 text-slate-600 font-black text-center text-[10px] tabular-nums">{rec.fechaRevision || '-'}</td>
                                   <td className="border-r border-black p-4 text-emerald-600 font-black text-center text-[10px] tabular-nums">{rec.date || '-'}</td>
                                   <td className="border-r border-black p-4 bg-white/90 backdrop-blur-sm shadow-inner min-w-[250px]">
                                      <div className="flex flex-col gap-2 font-black text-primary underline underline-offset-4 text-left text-[9px] uppercase">
                                         {rec.fechaSuspension && <span className="text-rose-600 mb-2 no-underline font-black bg-rose-50 px-3 py-1 rounded-lg text-center">{rec.fechaSuspension}</span>}
                                         <button onClick={() => toast({title: "Auditoría", description: `Validando integridad de ${rec.cct}`})} className="hover:text-primary/70 text-left">REVISAR</button>
                                         <button onClick={() => toast({title: "Producción", description: `Migrando ${rec.cct} a servidores públicos`})} className="hover:text-primary/70 text-left">PUBLICAR</button>
                                         <button onClick={() => toast({title: "Suspensión", description: `Desconectando servicios para ${rec.cct}`})} className="hover:text-primary/70 text-left">SUSPENDER</button>
                                         <button onClick={() => toast({title: "Bitácora", description: "Cargando histórico técnico..."})} className="hover:text-primary/70 text-left">OBSERVACIONES</button>
                                         <button onClick={() => toast({title: "Vínculo", description: `Canal oficial: ${rec.email}`})} className="hover:text-primary/70 text-left">ECONTACTO</button>
                                         <button onClick={() => toast({title: "Accesos", description: "Restableciendo credenciales de director..."})} className="hover:text-primary/70 text-left">CONTRASEÑA</button>
                                      </div>
                                   </td>
                                   <td className="border-r border-black p-6 text-slate-600 text-xs italic font-medium leading-relaxed bg-slate-50/50 text-justify">
                                      <div className="max-h-[300px] overflow-y-auto pr-6">{rec.observaciones || 'SIN OBSERVACIONES REGISTRADAS.'}</div>
                                   </td>
                                   <td className="p-6 font-mono text-primary font-bold lowercase text-xs">{rec.email || ''}</td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                        <ScrollBar orientation="horizontal" />
                     </ScrollArea>
                  </Card>
               </div>
             )}
          </TabsContent>
        </Tabs>

        <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
          <DialogContent className="sm:max-w-[450px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="bg-primary p-12 text-white text-center">
               <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Acceso Editorial</DialogTitle>
               <DialogDescription className="text-white/60 font-black text-[10px] uppercase mt-2">Servidor Central COEES</DialogDescription>
            </DialogHeader>
            <div className="p-10 space-y-8 bg-white">
               <div className="space-y-6">
                  <div className="space-y-2">
                     <Label className="text-[9px] font-black uppercase text-slate-400 ml-2">Usuario Administrador</Label>
                     <Input placeholder="INGRESE IDENTIFICADOR" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value.toUpperCase()})} className="h-14 rounded-xl bg-slate-50 border-none font-black px-6 shadow-inner" />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[9px] font-black uppercase text-slate-400 ml-2">Clave de Auditoría</Label>
                     <Input type="password" placeholder="••••••••" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} className="h-14 rounded-xl bg-slate-50 border-none font-black px-6 shadow-inner" />
                  </div>
               </div>
               <Button onClick={handleEditorialLogin} className="w-full h-16 text-lg font-black uppercase rounded-2xl shadow-2xl transition-all hover:scale-105">Validar Credenciales</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[1300px] h-[90vh] flex flex-col p-0 rounded-[3rem] overflow-hidden border-none shadow-2xl bg-white">
            <DialogHeader className="p-10 pb-6 border-b bg-slate-50 relative">
               <div className="absolute right-12 top-10 h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                 <ShieldCheck className="h-8 w-8" />
               </div>
               <DialogTitle className="text-3xl font-black uppercase text-primary tracking-tighter">
                  {formData.name === 'Cuentas Institucionales' ? 'Gestión de Identidad COEES' : (editingId ? 'Actualización Técnica' : 'Captura Estratégica')}
               </DialogTitle>
               <DialogDescription className="font-black text-[10px] uppercase text-muted-foreground mt-2 tracking-widest">Sincronización de Servidor Edoméx 2026</DialogDescription>
            </DialogHeader>

            <Tabs value={activeDialogTab} onValueChange={setActiveDialogTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-10 border-b bg-white">
                <TabsList className="bg-transparent h-16 p-0 gap-10">
                  <TabsTrigger value="datos" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-6 text-[11px] font-black uppercase tracking-widest">
                    1. Ficha Técnica Operativa
                  </TabsTrigger>
                  {formData.name !== 'Cuentas Institucionales' && (
                    <TabsTrigger 
                      value="asistentes" 
                      disabled={formData.capacitacion !== 'S'}
                      className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-6 text-[11px] font-black uppercase tracking-widest disabled:opacity-30"
                    >
                      2. Lista de Asistentes (Captura Directa)
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden bg-slate-50/30">
                <TabsContent value="datos" className="h-full m-0 p-10">
                  <ScrollArea className="h-full">
                     <div className="max-w-5xl mx-auto space-y-12">
                        {formData.name === 'Cuentas Institucionales' ? (
                          <div className="space-y-10 animate-in fade-in duration-700">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="space-y-3">
                                   <Label className="text-[10px] font-black uppercase text-primary ml-4 tracking-widest">CCT de Plantel</Label>
                                   <Input placeholder="15XXXXXX" value={formData.cct} onChange={e => {
                                      const v = e.target.value.toUpperCase();
                                      setFormData({...formData, cct: v});
                                      if(v.length === 10) {
                                         const s = schoolsDirectory.find(sh => sh.cct === v);
                                         if(s) setFormData(p => ({...p, valle: s.valle, modalidad: s.modalidad, sector: s.sectorNum, zonaEscolar: s.zonaEscolar}));
                                      }
                                   }} maxLength={10} className="h-16 rounded-2xl font-black px-8 bg-white border-2 border-slate-100 shadow-sm" />
                                </div>
                                <div className="space-y-3">
                                   <Label className="text-[10px] font-black uppercase text-primary ml-4 tracking-widest">Correo Institucional</Label>
                                   <Input value={formData.asistentes?.[0]?.email || ''} onChange={e => updateAssistantField(0, 'email', e.target.value.toLowerCase())} className="h-16 rounded-2xl font-mono text-primary px-8 bg-white border-2 border-slate-100 shadow-sm" placeholder="ejemplo@desysa.gob.mx" />
                                </div>
                                <div className="space-y-3">
                                   <Label className="text-[10px] font-black uppercase text-primary ml-4 tracking-widest">Nombre del Titular</Label>
                                   <Input value={formData.asistentes?.[0]?.nombres || ''} onChange={e => updateAssistantField(0, 'nombres', e.target.value.toUpperCase())} className="h-16 rounded-2xl font-black px-8 bg-white border-2 border-slate-100 shadow-sm" />
                                </div>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="space-y-3"><Label className="text-[10px] font-black text-primary ml-4 uppercase">Valle</Label>
                                <Select value={formData.valle} onValueChange={v => setFormData({...formData, valle: v})}><SelectTrigger className="h-16 rounded-2xl font-black px-8"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="MÉXICO" className="font-black">MÉXICO</SelectItem><SelectItem value="TOLUCA" className="font-black">TOLUCA</SelectItem></SelectContent></Select></div>
                                <div className="space-y-3"><Label className="text-[10px] font-black text-primary ml-4 uppercase">Modalidad</Label><Input value={formData.modalidad} readOnly className="h-16 rounded-2xl font-black px-8 bg-slate-50 border-none" /></div>
                                <div className="space-y-3">
                                   <Label className="text-[10px] font-black text-primary ml-4 uppercase">Estatus Auditoría</Label>
                                   <Select value={formData.status} onValueChange={(v:any) => setFormData({...formData, status: v})}>
                                      <SelectTrigger className="h-16 rounded-2xl font-black px-8 bg-slate-900 text-white border-none shadow-xl"><SelectValue /></SelectTrigger>
                                      <SelectContent><SelectItem value="activo" className="font-black">ACTIVO</SelectItem><SelectItem value="inactivo" className="font-black">INACTIVO</SelectItem></SelectContent>
                                   </Select>
                                </div>
                             </div>
                          </div>
                        ) : (
                          <div className="space-y-12">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="space-y-3"><Label className="text-[10px] font-black uppercase text-primary ml-4">CCT Plantel</Label><Input placeholder="15XXXXXX" value={formData.cct} onChange={e => setFormData({...formData, cct: e.target.value.toUpperCase()})} maxLength={10} className="h-16 rounded-2xl font-black px-8 bg-white border-2 border-slate-100 shadow-sm" /></div>
                                <div className="space-y-3"><Label className="text-[10px] font-black uppercase text-primary ml-4">Valle Territorial</Label><Select value={formData.valle} onValueChange={v => setFormData({...formData, valle: v})}><SelectTrigger className="h-16 rounded-2xl font-black px-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MÉXICO" className="font-black">MÉXICO</SelectItem><SelectItem value="TOLUCA" className="font-black">TOLUCA</SelectItem></SelectContent></Select></div>
                                <div className="space-y-3">
                                   <Label className="text-[10px] font-black uppercase text-primary ml-4">Estatus Operativo</Label>
                                   <Select value={formData.status} onValueChange={(v:any) => setFormData({...formData, status: v})}>
                                      <SelectTrigger className="h-16 rounded-2xl font-black px-8 bg-slate-900 text-white border-none shadow-xl"><SelectValue /></SelectTrigger>
                                      <SelectContent><SelectItem value="activo" className="font-black">ACTIVO</SelectItem><SelectItem value="planeacion" className="font-black">PLANEACIÓN</SelectItem><SelectItem value="concluido" className="font-black">CONCLUIDO</SelectItem></SelectContent>
                                   </Select>
                                </div>
                             </div>

                             <div className="p-10 bg-primary/5 rounded-[2.5rem] border-2 border-primary/10 shadow-inner flex items-center justify-between">
                                <div>
                                   <h4 className="text-xl font-black uppercase text-primary tracking-tight">Validación de Capacitación</h4>
                                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">¿Requiere registro de personal capacitado en este folio?</p>
                                </div>
                                <div className="flex items-center gap-6">
                                   <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{formData.capacitacion === 'S' ? 'SÍ (ACTIVO)' : 'NO (DESACTIVADO)'}</span>
                                   <Switch className="data-[state=checked]:bg-primary" checked={formData.capacitacion === 'S'} onCheckedChange={(v) => {
                                      setFormData({...formData, capacitacion: v ? 'S' : 'N'});
                                      if(!v) setActiveDialogTab('datos');
                                   }} />
                                </div>
                             </div>

                             {formData.capacitacion === 'S' && (
                                <div className="space-y-10 p-10 bg-white rounded-[3rem] border-4 border-slate-50 shadow-2xl animate-in slide-in-from-top-10 duration-700">
                                   <h4 className="text-lg font-black uppercase text-primary flex items-center gap-4 border-b pb-4"><GraduationCap className="h-7 w-7" /> Gestión de Programa Formativo</h4>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                      <div className="space-y-3"><Label className="text-[10px] font-black uppercase text-slate-400 ml-4">Nombre del Curso</Label><Input value={formData.cursoNombre} onChange={e => setFormData({...formData, cursoNombre: e.target.value})} className="h-14 rounded-xl bg-slate-50 border-none font-black px-6" /></div>
                                      <div className="space-y-3"><Label className="text-[10px] font-black uppercase text-slate-400 ml-4">Duración (Horas)</Label><Input type="number" value={formData.duracionHoras} onChange={e => setFormData({...formData, duracionHoras: parseInt(e.target.value) || 0})} className="h-14 rounded-xl bg-slate-50 border-none font-black px-6" /></div>
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                      <div className="space-y-3"><Label className="text-[10px] font-black uppercase text-slate-400 ml-4">Fecha Inicio</Label><Input type="date" value={formData.fechaInicio} onChange={e => setFormData({...formData, fechaInicio: e.target.value})} className="h-14 rounded-xl bg-slate-50 border-none font-black px-6" /></div>
                                      <div className="space-y-3"><Label className="text-[10px] font-black uppercase text-slate-400 ml-4">Fecha Término</Label><Input type="date" value={formData.fechaTermino} onChange={e => setFormData({...formData, fechaTermino: e.target.value})} className="h-14 rounded-xl bg-slate-50 border-none font-black px-6" /></div>
                                      <div className="space-y-3"><Label className="text-[10px] font-black uppercase text-slate-400 ml-4">CCT Sede</Label><Input value={formData.cctSede} onChange={e => setFormData({...formData, cctSede: e.target.value.toUpperCase()})} className="h-14 rounded-xl bg-slate-50 border-none font-black px-6 font-mono" placeholder="15DESXXXXX" maxLength={10} /></div>
                                   </div>
                                </div>
                             )}
                          </div>
                        )}
                        <div className="space-y-3 pt-6 border-t">
                           <Label className="text-[10px] font-black uppercase text-primary ml-4 tracking-widest flex items-center gap-2"><ListFilter className="h-4 w-4" /> Observaciones Técnicas</Label>
                           <Textarea value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} className="min-h-[150px] rounded-[2rem] p-8 border-2 border-slate-100 shadow-inner text-sm font-medium" placeholder="Ingrese detalles técnicos adicionales..." />
                        </div>
                     </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="asistentes" className="h-full m-0 bg-white">
                  <div className="h-full flex flex-col">
                    <div className="p-10 pb-6 border-b flex justify-between items-center bg-slate-50/50">
                       <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border-2 border-primary/5 flex-1 mr-10 shadow-sm">
                          <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg"><CheckCircle2 className="h-6 w-6" /></div>
                          <p className="text-[11px] font-black uppercase tracking-widest text-slate-700">Captura nominal de personal capacitado. El CCT autocompleta los datos geográficos.</p>
                       </div>
                       <Button onClick={handleAddAssistantRow} className="btn-institutional px-10 h-14"><Plus className="h-5 w-5 mr-2" /> Añadir Fila</Button>
                    </div>
                    <ScrollArea className="flex-1">
                       <table className="table-institutional min-w-[1200px]">
                          <thead className="sticky top-0 z-20 bg-slate-900 text-white shadow-xl">
                             <tr>
                                <th className="w-16 py-6 border-r border-white/10">#</th>
                                <th className="min-w-[300px] text-left px-8 py-6 border-r border-white/10">Nombre del Capacitado</th>
                                <th className="min-w-[180px] py-6 border-r border-white/10">RFC Oficial</th>
                                <th className="min-w-[200px] py-6 border-r border-white/10">Función</th>
                                <th className="min-w-[180px] py-6 border-r border-white/10">CCT de Origen</th>
                                <th className="min-w-[250px] text-left px-8 py-6">Datos de Plantel</th>
                                <th className="w-20"></th>
                             </tr>
                          </thead>
                          <tbody>
                             {(formData.asistentes || []).map((ast, idx) => (
                               <TableRow key={idx} className="hover:bg-slate-50 transition-all border-b">
                                  <TableCell className="text-center font-black text-slate-400 border-r">{idx + 1}</TableCell>
                                  <TableCell className="p-4 border-r">
                                     <div className="flex flex-col gap-2">
                                        <Input placeholder="Apellidos" className="h-10 text-[10px] font-bold rounded-lg" value={`${ast.paterno} ${ast.materno}`} onChange={e => {
                                           const parts = e.target.value.split(' ');
                                           updateAssistantField(idx, 'paterno', parts[0] || '');
                                           updateAssistantField(idx, 'materno', parts.slice(1).join(' ') || '');
                                        }} />
                                        <Input placeholder="Nombre(s)" className="h-10 text-[10px] font-black text-primary rounded-lg" value={ast.nombres} onChange={e => updateAssistantField(idx, 'nombres', e.target.value.toUpperCase())} />
                                     </div>
                                  </TableCell>
                                  <TableCell className="p-4 border-r"><Input placeholder="RFC" className="h-12 text-[10px] font-mono font-black text-center uppercase rounded-lg" value={ast.rfc} onChange={e => updateAssistantField(idx, 'rfc', e.target.value.toUpperCase())} maxLength={13} /></TableCell>
                                  <TableCell className="p-4 border-r"><Select value={ast.funcion} onValueChange={(v:any) => updateAssistantField(idx, 'funcion', v)}><SelectTrigger className="h-12 text-[10px] font-black rounded-lg"><SelectValue /></SelectTrigger><SelectContent>{FUNCIONES.map(f => (<SelectItem key={f} value={f} className="text-[10px] font-black">{f}</SelectItem>))}</SelectContent></Select></TableCell>
                                  <TableCell className="p-4 border-r"><Input placeholder="15DESXXXXX" className="h-12 text-[10px] font-mono font-black text-center uppercase border-primary/20 rounded-lg shadow-inner bg-slate-50" value={ast.cct} onChange={e => updateAssistantField(idx, 'cct', e.target.value.toUpperCase())} maxLength={10} /></TableCell>
                                  <TableCell className="p-4 px-8 text-left">
                                     <div className="flex flex-col gap-2">
                                        <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[8px] uppercase px-3 py-1 rounded-lg truncate max-w-[200px]">{ast.nombreCT || 'PLANEL NO ENCONTRADO'}</Badge>
                                        <Badge className="bg-primary/5 text-primary border-none font-black text-[8px] uppercase px-3 py-1 rounded-lg w-fit">Zona: {ast.ze || 'S/Z'}</Badge>
                                     </div>
                                  </TableCell>
                                  <TableCell className="p-4"><Button variant="ghost" size="icon" onClick={() => handleRemoveAssistantRow(idx)} disabled={(formData.asistentes?.length || 0) <= 1} className="h-10 w-10 text-rose-500 hover:bg-rose-50 rounded-xl"><Trash2 className="h-5 w-5" /></Button></TableCell>
                               </TableRow>
                             ))}
                          </tbody>
                       </table>
                       <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="p-10 border-t-2 border-slate-50 flex items-center justify-between bg-white">
               <div className="flex items-center gap-4">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Servidor Activo • Edoméx 2026</span>
               </div>
               <div className="flex gap-6">
                  <Button variant="outline" onClick={() => { setIsDialogOpen(false); setFormData(initialFormState); setActiveDialogTab('datos'); }} className="h-16 px-12 rounded-2xl font-black uppercase text-[11px] tracking-widest border-2 border-slate-100 bg-white">Cancelar</Button>
                  <Button onClick={handleSave} className="h-16 px-20 rounded-2xl font-black uppercase text-[11px] bg-primary text-white shadow-2xl shadow-primary/20 tracking-[0.2em] transition-all hover:scale-[1.03]">Finalizar Registro</Button>
               </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}