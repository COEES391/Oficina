
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
  Building2,
  Plus,
  ShieldCheck,
  GraduationCap,
  ListFilter
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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
    
    const stored = JSON.parse(localStorage.getItem('programs_full') || '[]')
    setRecords(stored.length > 0 ? stored : programsData)
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
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-4">
            <h2 className="text-5xl font-black tracking-tighter text-primary uppercase leading-none">Módulos Técnicos</h2>
            <div className="flex items-center gap-4">
              <span className="h-1.5 w-16 bg-accent/30 rounded-full" />
              <p className="text-muted-foreground font-black text-[11px] uppercase tracking-[0.4em] flex items-center gap-3">
                <Activity className="h-4 w-4 text-accent" /> Control de Programas COEES
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
          <TabsList className="w-full h-20 flex bg-white border border-slate-100 p-2 rounded-[2rem] shadow-sm">
            {PROGRAM_RUBROS.map(rubro => (
              <TabsTrigger 
                key={rubro} 
                value={rubro} 
                className="flex-1 h-full text-[11px] font-black uppercase rounded-[1.5rem] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-2xl transition-all duration-500"
              >
                {rubro}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="Biblioteca Digital" className="space-y-10 animate-in fade-in duration-500">
            <Card className="executive-card p-12 flex items-center justify-between border-4 border-white">
               <div className="flex items-center gap-8">
                 <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                   <Monitor className="h-8 w-8" />
                 </div>
                 <div>
                   <h3 className="text-3xl font-black uppercase text-slate-900 leading-none">Infraestructura Digital</h3>
                   <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-3">Monitoreo de Equipamiento y Capacitación</p>
                 </div>
               </div>
               <Button onClick={() => { setFormData({...initialFormState, name: 'Biblioteca Digital', id: `PROG-BD-${Date.now()}`}); setEditingId(null); setIsDialogOpen(true); }} className="btn-institutional px-12">
                  <PlusCircle className="h-5 w-5 mr-3" /> Iniciar Registro
               </Button>
            </Card>

            <Card className="executive-card p-0">
              <div className="overflow-x-auto">
                <table className="table-institutional">
                  <thead>
                    <tr>
                      <th className="pl-12 text-left">Centro de Trabajo</th>
                      <th className="text-left">Modalidad / Valle</th>
                      <th>Equipos</th>
                      <th>Estatus Capacitación</th>
                      <th className="pr-12 text-right">Gestión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bdRecords.map(rec => (
                      <TableRow key={rec.id} className="hover:bg-slate-50 transition-all">
                        <TableCell className="pl-12 text-left font-black text-slate-800 text-sm">{rec.cct || rec.id}</TableCell>
                        <TableCell className="text-left">
                          <div className="flex flex-col gap-1.5">
                            <Badge className="bg-slate-900 text-white border-none text-[9px] font-black w-fit uppercase px-3">{rec.modalidad}</Badge>
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{rec.valle}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                           <span className="h-12 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-primary mx-auto text-lg shadow-inner">{rec.numeroEquipos}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "text-[10px] font-black uppercase px-4 py-1.5 rounded-full border-none shadow-sm",
                            rec.capacitacion === 'S' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                          )}>
                            {rec.capacitacion === 'S' ? 'COMPLETADA' : 'SIN REGISTRO'}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-12 text-right">
                          <div className="flex justify-end gap-3">
                             <Button variant="outline" size="icon" onClick={() => {setFormData(rec); setEditingId(rec.id); setIsDialogOpen(true);}} className="h-10 w-10 rounded-2xl shadow-sm"><Pencil className="h-4 w-4" /></Button>
                             <Button variant="outline" size="icon" onClick={() => setRecords(records.filter(r => r.id !== rec.id))} className="h-10 w-10 rounded-2xl text-rose-500 border-rose-100 hover:bg-rose-50 shadow-sm"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="Cuentas Institucionales" className="space-y-10 animate-in fade-in duration-500">
             <Card className="executive-card p-12 flex items-center justify-between border-4 border-white bg-slate-900 text-white">
               <div className="flex items-center gap-8">
                 <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center shadow-2xl">
                   <Globe className="h-8 w-8 text-white" />
                 </div>
                 <div>
                   <h3 className="text-3xl font-black uppercase tracking-tight leading-none">Gestión de Identidad COEES</h3>
                   <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mt-3">Auditoría de Cuentas por Dominio y Modalidad</p>
                 </div>
               </div>
               <Button onClick={() => { setFormData({...initialFormState, name: 'Cuentas Institucionales', id: `PROG-CI-${Date.now()}`}); setEditingId(null); setIsDialogOpen(true); }} className="bg-white hover:bg-slate-100 text-primary font-black uppercase text-[11px] h-14 px-12 rounded-2xl transition-all shadow-2xl tracking-widest">
                  <PlusCircle className="h-5 w-5 mr-3" /> Registrar Cuenta
               </Button>
             </Card>

             <Tabs value={ciActiveInternalTab} onValueChange={setCiActiveInternalTab} className="w-full">
                <TabsList className="bg-white border border-slate-100 p-1.5 rounded-2xl mb-8 shadow-sm inline-flex h-14">
                   <TabsTrigger value="analitica" className="gap-3 text-[10px] font-black uppercase px-8 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">Analítica Digital</TabsTrigger>
                   <TabsTrigger value="registros" className="gap-3 text-[10px] font-black uppercase px-8 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">Listado de Registros</TabsTrigger>
                </TabsList>

                <TabsContent value="analitica" className="space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                      <Card className="md:col-span-3 p-10 space-y-10 bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[3rem] shadow-xl">
                         <div className="space-y-5">
                            <Label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest ml-2">Valle Territorial</Label>
                            <div className="flex flex-col gap-3">
                               {['all', 'MÉXICO', 'TOLUCA'].map(v => (
                                 <button key={v} onClick={() => setValFilter(v)} className={cn("text-[10px] font-black py-3.5 px-6 rounded-2xl text-left transition-all border-2", valFilter === v ? "bg-primary text-white border-primary shadow-xl scale-[1.03]" : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50")}>
                                    {v === 'all' ? 'AMBOS VALLES' : v}
                                 </button>
                               ))}
                            </div>
                         </div>
                         <div className="space-y-5 pt-8 border-t">
                            <Label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest ml-2">Filtrar por Dominio</Label>
                            <Select value={domFilter} onValueChange={setDomFilter}>
                               <SelectTrigger className="h-12 text-[10px] font-black rounded-2xl border-2"><SelectValue placeholder="DOMINIO" /></SelectTrigger>
                               <SelectContent className="rounded-2xl">
                                  <SelectItem value="all" className="text-[10px] font-black">TODOS</SelectItem>
                                  <SelectItem value="desysa.gob.mx" className="text-[10px] font-black">@desysa.gob.mx</SelectItem>
                                  <SelectItem value="desysa.edu.mx" className="text-[10px] font-black">@desysa.edu.mx</SelectItem>
                                  <SelectItem value="coees.edu.mx" className="text-[10px] font-black">@coees.edu.mx</SelectItem>
                                </SelectContent>
                            </Select>
                         </div>
                      </Card>

                      <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-10">
                         <Card className="executive-card p-12 flex flex-col items-center justify-center">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Universo de Cuentas</span>
                            <div className="text-7xl font-black text-primary tracking-tighter">{ciDashboardData.total}</div>
                         </Card>

                         <Card className="executive-card p-10 flex flex-col items-center">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8">Eficiencia Operativa</span>
                            <div className="h-[200px] w-full relative">
                               <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                     <Pie data={ciDashboardData.pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={10} dataKey="value">
                                        {ciDashboardData.pieData.map((e, i) => <Cell key={i} fill={e.fill} stroke="none" />)}
                                     </Pie>
                                  </PieChart>
                               </ResponsiveContainer>
                               <div className="absolute inset-0 flex items-center justify-center flex-col">
                                  <span className="text-4xl font-black text-slate-800">{ciDashboardData.usagePercent}%</span>
                                  <span className="text-[9px] font-black uppercase text-slate-400">Activo</span>
                               </div>
                            </div>
                         </Card>

                         <Card className="executive-card p-10">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-10 block">Distribución de Estatus</span>
                            <div className="h-[220px]">
                               <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={ciDashboardData.barData}>
                                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                     <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                     <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={45}>
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
                   <Card className="executive-card p-0">
                      <table className="table-institutional">
                         <thead>
                            <tr>
                               <th className="pl-12 text-left">Centro de Trabajo</th>
                               <th className="text-left">Titular de la Cuenta</th>
                               <th>Correo Institucional</th>
                               <th>Estatus</th>
                               <th className="pr-12 text-right">Acción</th>
                            </tr>
                         </thead>
                         <tbody>
                            {ciDashboardData.filtered.map(rec => (
                              <TableRow key={rec.id} className="hover:bg-slate-50 transition-all">
                                 <TableCell className="pl-12 text-left font-black text-slate-800 text-sm">{rec.cct}</TableCell>
                                 <TableCell className="text-left font-bold text-slate-600 uppercase text-[10px]">{rec.asistentes?.[0]?.nombres || 'PENDIENTE'}</TableCell>
                                 <TableCell className="font-mono text-primary text-[10px] font-black">{rec.asistentes?.[0]?.email || '-'}</TableCell>
                                 <TableCell>
                                    <Badge className={cn("text-[9px] font-black uppercase px-4 py-1.5 rounded-full border-none shadow-sm", rec.status === 'activo' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white")}>
                                       {rec.status}
                                    </Badge>
                                 </TableCell>
                                 <TableCell className="pr-12 text-right">
                                    <Button variant="ghost" size="icon" onClick={() => {setFormData(rec); setEditingId(rec.id); setIsDialogOpen(true);}} className="h-10 w-10 rounded-2xl"><Pencil className="h-4 w-4" /></Button>
                                 </TableCell>
                              </TableRow>
                            ))}
                         </tbody>
                      </table>
                   </Card>
                </TabsContent>
             </Tabs>
          </TabsContent>

          <TabsContent value="Conoce mi Escuela" className="animate-in fade-in duration-500">
             {!isEditorialUser ? (
               <Card className="executive-card max-w-4xl mx-auto border-4 border-white shadow-2xl overflow-hidden">
                  <div className="bg-primary p-16 text-center text-white space-y-8">
                     <h1 className="text-4xl font-black uppercase tracking-tight">Portal Editorial WebEscuela</h1>
                     <p className="text-xs font-bold text-white/50 uppercase tracking-[0.4em]">Auditoría Técnica de 827 Registros Oficiales</p>
                  </div>
                  <div className="p-20 space-y-12 text-center">
                     <p className="text-xl text-slate-600 leading-relaxed font-medium">Inicie sesión en el servidor central para gestionar la base de datos de los 827 portales escolares de Educación Secundaria.</p>
                     <Button onClick={() => setIsLoginDialogOpen(true)} className="btn-institutional px-20 h-16 text-lg">Acceder al Sistema Editorial</Button>
                  </div>
               </Card>
             ) : (
               <div className="space-y-10 animate-in fade-in duration-700">
                  <div className="flex justify-between items-center bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] border-2 border-white shadow-xl">
                     <div className="flex items-center gap-8">
                        <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20"><ShieldCheck className="h-8 w-8" /></div>
                        <div>
                           <h2 className="text-3xl font-black text-slate-900 uppercase leading-none">Servidor Editorial</h2>
                           <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Monitoreo Técnico Estratégico COEES</p>
                        </div>
                     </div>
                     <Button variant="destructive" onClick={() => {setIsEditorialUser(false); localStorage.removeItem('userRfc');}} className="h-14 px-12 rounded-2xl font-black uppercase text-[11px] tracking-widest">Cerrar Sesión Editorial</Button>
                  </div>

                  <Card className="executive-card p-0 shadow-2xl h-[750px] border-4 border-white">
                     <ScrollArea className="h-full w-full">
                        <table className="table-institutional min-w-[3200px]">
                           <thead className="sticky top-0 z-30 bg-slate-100/95 backdrop-blur-md shadow-md">
                              <tr>
                                 <th className="p-6 w-20">No.</th>
                                 <th className="p-6 text-left cursor-pointer hover:bg-slate-200" onClick={() => setSortConfig(p => ({ key: 'cct', direction: p.direction === 'asc' ? 'desc' : 'asc' }))}>CENTRO DE TRABAJO</th>
                                 <th className="p-6">AGRUPADO</th>
                                 <th className="p-6">VERTIENTE</th>
                                 <th className="p-6">SECTOR</th>
                                 <th className="p-6">ZONA</th>
                                 <th className="p-6">ALTA</th>
                                 <th className="p-6">MODIF</th>
                                 <th className="p-6">REVISIÓN</th>
                                 <th className="p-6">PUBL</th>
                                 <th className="p-6 bg-primary text-white min-w-[280px]">FECHA DE SUSPENSIÓN / ACCIONES</th>
                                 <th className="p-6 min-w-[800px]">OBSERVACIONES HISTÓRICAS</th>
                                 <th className="p-6 text-left">ECONTACTO</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {editorialRecords.map((rec, idx) => (
                                <tr key={rec.id} className="hover:bg-slate-50 transition-colors align-top">
                                   <td className="p-6 text-center font-black text-slate-400">{idx + 1}</td>
                                   <td className="p-6 font-black uppercase text-slate-900 text-sm tracking-tighter text-left">{rec.cct}</td>
                                   <td className="p-6 font-mono text-slate-500 uppercase text-xs text-left">{rec.agrupado || '-'}</td>
                                   <td className="p-6 text-center uppercase font-black text-[10px]">{rec.vertiente || '-'}</td>
                                   <td className="p-6 text-center font-black text-sm">{rec.sector || '-'}</td>
                                   <td className="p-6 text-center font-black text-sm">{rec.zonaEscolar || '-'}</td>
                                   <td className="p-6 text-slate-400 text-center text-[10px] tabular-nums">{rec.fechaAlta || '-'}</td>
                                   <td className="p-6 text-slate-400 text-center text-[10px] tabular-nums">{rec.fechaModif || '-'}</td>
                                   <td className="p-6 text-slate-600 font-black text-center text-[10px] tabular-nums">{rec.fechaRevision || '-'}</td>
                                   <td className="p-6 text-emerald-600 font-black text-center text-[10px] tabular-nums">{rec.date || '-'}</td>
                                   <td className="p-6 bg-white/90 backdrop-blur-sm shadow-inner min-w-[280px]">
                                      <div className="flex flex-col gap-3 font-black text-primary underline underline-offset-4 text-left text-[10px] uppercase">
                                         {rec.fechaSuspension && <span className="text-rose-600 mb-2 no-underline font-black bg-rose-50 px-4 py-1.5 rounded-xl text-center shadow-sm">{rec.fechaSuspension}</span>}
                                         <button onClick={() => toast({title: "Auditoría", description: `Iniciando revisión de ${rec.cct}`})} className="hover:text-primary/70 transition-colors">REVISAR</button>
                                         <button onClick={() => toast({title: "Producción", description: `Sincronizando ${rec.cct} con servidor Edoméx 2026`})} className="hover:text-primary/70 transition-colors">PUBLICAR</button>
                                         <button onClick={() => toast({title: "Seguridad", description: `Desactivando portal de ${rec.cct}`})} className="hover:text-primary/70 transition-colors">SUSPENDER</button>
                                         <button onClick={() => toast({title: "Bitácora", description: "Cargando histórico de observaciones..."})} className="hover:text-primary/70 transition-colors">OBSERVACIONES</button>
                                         <button onClick={() => toast({title: "Contacto", description: `Canal de comunicación: ${rec.email}`})} className="hover:text-primary/70 transition-colors">ECONTACTO</button>
                                         <button onClick={() => toast({title: "Soporte", description: "Restableciendo credenciales del plantel..."})} className="hover:text-primary/70 transition-colors text-rose-600">CONTRASEÑA</button>
                                      </div>
                                   </td>
                                   <td className="p-8 text-slate-600 text-[11px] italic font-medium leading-relaxed bg-slate-50/50 text-justify">
                                      <div className="max-h-[350px] overflow-y-auto pr-8">{rec.observaciones || 'NO SE REGISTRAN OBSERVACIONES TÉCNICAS EN EL CICLO ACTUAL.'}</div>
                                   </td>
                                   <td className="p-8 font-mono text-primary font-bold lowercase text-xs">{rec.email || ''}</td>
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
          <DialogContent className="sm:max-w-[500px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="bg-primary p-16 text-white text-center">
               <DialogTitle className="text-3xl font-black uppercase tracking-tighter">Acceso Editorial</DialogTitle>
               <DialogDescription className="text-white/50 font-black text-[11px] uppercase mt-3">Autenticación Servidor COEES</DialogDescription>
            </DialogHeader>
            <div className="p-12 space-y-10 bg-white">
               <div className="space-y-8">
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Identificador de Usuario</Label>
                     <Input placeholder="INGRESE USUARIO" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value.toUpperCase()})} className="h-16 rounded-2xl bg-slate-50 border-none font-black px-8 shadow-inner" />
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Clave de Acceso</Label>
                     <Input type="password" placeholder="••••••••" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} className="h-16 rounded-2xl bg-slate-50 border-none font-black px-8 shadow-inner" />
                  </div>
               </div>
               <Button onClick={handleEditorialLogin} className="w-full h-16 text-lg font-black uppercase rounded-[1.5rem] shadow-2xl transition-all hover:scale-[1.03]">Validar Credenciales</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[1300px] h-[90vh] flex flex-col p-0 rounded-[3rem] overflow-hidden border-none shadow-2xl bg-white">
            <DialogHeader className="p-12 pb-8 border-b bg-slate-50 relative">
               <div className="absolute right-12 top-12 h-20 w-20 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary shadow-inner">
                 <ShieldCheck className="h-10 w-10" />
               </div>
               <DialogTitle className="text-4xl font-black uppercase text-primary tracking-tighter">
                  {formData.name === 'Cuentas Institucionales' ? 'Gestión de Identidad COEES' : (editingId ? 'Actualización Técnica' : 'Captura Estratégica')}
               </DialogTitle>
               <DialogDescription className="font-black text-[11px] uppercase text-muted-foreground mt-3 tracking-widest">Integración Servidor Edoméx 2026</DialogDescription>
            </DialogHeader>

            <Tabs value={activeDialogTab} onValueChange={setActiveDialogTab} className="flex-1 flex flex-col overflow-hidden">
              {formData.name !== 'Cuentas Institucionales' && (
                <div className="px-12 border-b bg-white">
                  <TabsList className="bg-transparent h-20 p-0 gap-12">
                    <TabsTrigger value="datos" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-8 text-[12px] font-black uppercase tracking-widest">
                      1. Ficha Técnica Operativa
                    </TabsTrigger>
                    <TabsTrigger 
                        value="asistentes" 
                        disabled={formData.capacitacion !== 'S'}
                        className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-8 text-[12px] font-black uppercase tracking-widest disabled:opacity-20"
                    >
                        2. Lista de Asistentes (Captura Directa)
                    </TabsTrigger>
                  </TabsList>
                </div>
              )}

              <div className="flex-1 overflow-hidden bg-slate-50/50">
                <TabsContent value="datos" className="h-full m-0 p-12">
                  <ScrollArea className="h-full">
                     <div className="max-w-5xl mx-auto space-y-12 pb-12">
                        {formData.name === 'Cuentas Institucionales' ? (
                          <div className="space-y-12 animate-in fade-in duration-700">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="space-y-4">
                                   <Label className="text-[11px] font-black uppercase text-primary ml-4 tracking-widest">CCT de Plantel</Label>
                                   <Input placeholder="15XXXXXX" value={formData.cct} onChange={e => {
                                      const v = e.target.value.toUpperCase();
                                      setFormData({...formData, cct: v});
                                      if(v.length === 10) {
                                         const s = schoolsDirectory.find(sh => sh.cct === v);
                                         if(s) setFormData(p => ({...p, valle: s.valle, modalidad: s.modalidad, sector: s.sectorNum, zonaEscolar: s.zonaEscolar, schoolName: s.nombre}));
                                      }
                                   }} maxLength={10} className="h-16 rounded-2xl font-black px-8 bg-white border-2 shadow-sm" />
                                </div>
                                <div className="space-y-4">
                                   <Label className="text-[11px] font-black uppercase text-primary ml-4 tracking-widest">Correo Institucional</Label>
                                   <Input value={formData.asistentes?.[0]?.email || ''} onChange={e => updateAssistantField(0, 'email', e.target.value.toLowerCase())} className="h-16 rounded-2xl font-mono text-primary px-8 bg-white border-2 shadow-sm font-black" placeholder="usuario@desysa.gob.mx" />
                                </div>
                                <div className="space-y-4">
                                   <Label className="text-[11px] font-black uppercase text-primary ml-4 tracking-widest">Titular de la Cuenta</Label>
                                   <Input value={formData.asistentes?.[0]?.nombres || ''} onChange={e => updateAssistantField(0, 'nombres', e.target.value.toUpperCase())} className="h-16 rounded-2xl font-black px-8 bg-white border-2 shadow-sm" />
                                </div>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                                <div className="space-y-4"><Label className="text-[11px] font-black text-primary ml-4 uppercase tracking-widest">Modalidad</Label><Input value={formData.modalidad} readOnly className="h-16 rounded-2xl font-black px-8 bg-slate-100 border-none" /></div>
                                <div className="space-y-4"><Label className="text-[11px] font-black text-primary ml-4 uppercase tracking-widest">Valle</Label><Input value={formData.valle} readOnly className="h-16 rounded-2xl font-black px-8 bg-slate-100 border-none" /></div>
                                <div className="space-y-4"><Label className="text-[11px] font-black text-primary ml-4 uppercase tracking-widest">Sector</Label><Input value={formData.sector} readOnly className="h-16 rounded-2xl font-black px-8 bg-slate-100 border-none" /></div>
                                <div className="space-y-4"><Label className="text-[11px] font-black text-primary ml-4 uppercase tracking-widest">Zona</Label><Input value={formData.zonaEscolar} readOnly className="h-16 rounded-2xl font-black px-8 bg-slate-100 border-none" /></div>
                             </div>
                             <div className="space-y-4">
                                <Label className="text-[11px] font-black uppercase text-primary ml-4 tracking-widest">Estatus Operativo</Label>
                                <Select value={formData.status} onValueChange={(v:any) => setFormData({...formData, status: v})}>
                                    <SelectTrigger className="h-16 rounded-2xl font-black px-8 bg-slate-900 text-white border-none shadow-2xl"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-2xl"><SelectItem value="activo" className="font-black">ACTIVO</SelectItem><SelectItem value="inactivo" className="font-black">INACTIVO</SelectItem></SelectContent>
                                </Select>
                             </div>
                          </div>
                        ) : (
                          <div className="space-y-12">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="space-y-4"><Label className="text-[11px] font-black uppercase text-primary ml-4">CCT Plantel</Label><Input placeholder="15XXXXXX" value={formData.cct} onChange={e => setFormData({...formData, cct: e.target.value.toUpperCase()})} maxLength={10} className="h-16 rounded-2xl font-black px-8 bg-white border-2 shadow-sm" /></div>
                                <div className="space-y-4"><Label className="text-[11px] font-black uppercase text-primary ml-4">Valle Territorial</Label><Select value={formData.valle} onValueChange={v => setFormData({...formData, valle: v})}><SelectTrigger className="h-16 rounded-2xl font-black px-8"><SelectValue /></SelectTrigger><SelectContent className="rounded-2xl"><SelectItem value="MÉXICO" className="font-black">MÉXICO</SelectItem><SelectItem value="TOLUCA" className="font-black">TOLUCA</SelectItem></SelectContent></Select></div>
                                <div className="space-y-4">
                                   <Label className="text-[11px] font-black uppercase text-primary ml-4">Estatus Operativo</Label>
                                   <Select value={formData.status} onValueChange={(v:any) => setFormData({...formData, status: v})}>
                                      <SelectTrigger className="h-16 rounded-2xl font-black px-8 bg-slate-900 text-white border-none shadow-2xl"><SelectValue /></SelectTrigger>
                                      <SelectContent className="rounded-2xl"><SelectItem value="activo" className="font-black">ACTIVO</SelectItem><SelectItem value="planeacion" className="font-black">PLANEACIÓN</SelectItem><SelectItem value="concluido" className="font-black">CONCLUIDO</SelectItem></SelectContent>
                                   </Select>
                                </div>
                             </div>

                             <div className="p-12 bg-primary/5 rounded-[3rem] border-4 border-primary/10 shadow-inner flex items-center justify-between">
                                <div>
                                   <h4 className="text-2xl font-black uppercase text-primary tracking-tighter">Capacitación Técnica</h4>
                                   <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-2">¿Se requiere registro nominal de personal capacitado?</p>
                                </div>
                                <div className="flex items-center gap-8">
                                   <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{formData.capacitacion === 'S' ? 'REGISTRO ACTIVO' : 'SIN CAPACITACIÓN'}</span>
                                   <Switch className="data-[state=checked]:bg-primary scale-125" checked={formData.capacitacion === 'S'} onCheckedChange={(v) => {
                                      setFormData({...formData, capacitacion: v ? 'S' : 'N'});
                                      if(!v) setActiveDialogTab('datos');
                                   }} />
                                </div>
                             </div>

                             {formData.capacitacion === 'S' && (
                                <div className="space-y-12 p-12 bg-white rounded-[3rem] border-4 border-slate-50 shadow-2xl animate-in slide-in-from-top-12 duration-700">
                                   <h4 className="text-xl font-black uppercase text-primary flex items-center gap-5 border-b-2 pb-6"><GraduationCap className="h-8 w-8" /> Gestión de Programa Formativo</h4>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                      <div className="space-y-4"><Label className="text-[11px] font-black uppercase text-slate-400 ml-4">Nombre del Curso</Label><Input value={formData.cursoNombre} onChange={e => setFormData({...formData, cursoNombre: e.target.value})} className="h-16 rounded-2xl bg-slate-50 border-none font-black px-8 shadow-inner" /></div>
                                      <div className="space-y-4"><Label className="text-[11px] font-black uppercase text-slate-400 ml-4">Duración (Horas)</Label><Input type="number" value={formData.duracionHoras} onChange={e => setFormData({...formData, duracionHoras: parseInt(e.target.value) || 0})} className="h-16 rounded-2xl bg-slate-50 border-none font-black px-8 shadow-inner" /></div>
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                      <div className="space-y-4"><Label className="text-[11px] font-black uppercase text-slate-400 ml-4">Fecha Inicio</Label><Input type="date" value={formData.fechaInicio} onChange={e => setFormData({...formData, fechaInicio: e.target.value})} className="h-16 rounded-2xl bg-slate-50 border-none font-black px-8 shadow-inner" /></div>
                                      <div className="space-y-4"><Label className="text-[11px] font-black uppercase text-slate-400 ml-4">Fecha Término</Label><Input type="date" value={formData.fechaTermino} onChange={e => setFormData({...formData, fechaTermino: e.target.value})} className="h-16 rounded-2xl bg-slate-50 border-none font-black px-8 shadow-inner" /></div>
                                      <div className="space-y-4"><Label className="text-[11px] font-black uppercase text-slate-400 ml-4">CCT Sede</Label><Input value={formData.cctSede} onChange={e => setFormData({...formData, cctSede: e.target.value.toUpperCase()})} className="h-16 rounded-2xl bg-slate-50 border-none font-black px-8 font-mono shadow-inner" placeholder="15DESXXXXX" maxLength={10} /></div>
                                   </div>
                                </div>
                             )}
                          </div>
                        )}
                        <div className="space-y-4 pt-10 border-t-2">
                           <Label className="text-[11px] font-black uppercase text-primary ml-4 tracking-widest flex items-center gap-3"><ListFilter className="h-5 w-5" /> Observaciones Técnicas Históricas</Label>
                           <Textarea value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} className="min-h-[180px] rounded-[2.5rem] p-10 border-4 border-slate-50 shadow-inner text-sm font-medium leading-relaxed" placeholder="Detalle técnico de auditoría y seguimiento operativo..." />
                        </div>
                     </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="asistentes" className="h-full m-0 bg-white">
                  <div className="h-full flex flex-col">
                    <div className="p-12 pb-8 border-b flex justify-between items-center bg-slate-50/50">
                       <div className="flex items-center gap-6 bg-white p-8 rounded-[1.5rem] border-2 border-primary/5 flex-1 mr-12 shadow-sm">
                          <div className="h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg"><Activity className="h-7 w-7" /></div>
                          <p className="text-[12px] font-black uppercase tracking-widest text-slate-700 leading-tight">Captura nominal masiva. El CCT de origen autocompletará sector, zona y municipio del personal.</p>
                       </div>
                       <Button onClick={handleAddAssistantRow} className="btn-institutional px-14 h-16"><Plus className="h-5 w-5 mr-3" /> Añadir Fila</Button>
                    </div>
                    <ScrollArea className="flex-1">
                       <table className="table-institutional min-w-[1400px]">
                          <thead className="sticky top-0 z-20 bg-slate-900 text-white shadow-2xl">
                             <tr>
                                <th className="w-20 py-8">#</th>
                                <th className="min-w-[350px] text-left px-10 py-8">Nombre Completo del Capacitado</th>
                                <th className="min-w-[200px] py-8">RFC Oficial</th>
                                <th className="min-w-[220px] py-8">Función Operativa</th>
                                <th className="min-w-[200px] py-8">CCT de Adscripción</th>
                                <th className="min-w-[300px] text-left px-10 py-8">Datos Geográficos</th>
                                <th className="w-24"></th>
                             </tr>
                          </thead>
                          <tbody>
                             {(formData.asistentes || []).map((ast, idx) => (
                               <TableRow key={idx} className="hover:bg-slate-50 transition-all border-b border-slate-50">
                                  <TableCell className="text-center font-black text-slate-400 border-r">{idx + 1}</TableCell>
                                  <TableCell className="p-6 border-r">
                                     <div className="flex flex-col gap-3">
                                        <Input placeholder="Apellidos" className="h-12 text-[11px] font-bold rounded-xl shadow-sm" value={`${ast.paterno} ${ast.materno}`} onChange={e => {
                                           const parts = e.target.value.split(' ');
                                           updateAssistantField(idx, 'paterno', parts[0] || '');
                                           updateAssistantField(idx, 'materno', parts.slice(1).join(' ') || '');
                                        }} />
                                        <Input placeholder="Nombre(s)" className="h-12 text-[11px] font-black text-primary rounded-xl shadow-sm" value={ast.nombres} onChange={e => updateAssistantField(idx, 'nombres', e.target.value.toUpperCase())} />
                                     </div>
                                  </TableCell>
                                  <TableCell className="p-6 border-r"><Input placeholder="RFC" className="h-14 text-[11px] font-mono font-black text-center uppercase rounded-xl shadow-sm" value={ast.rfc} onChange={e => updateAssistantField(idx, 'rfc', e.target.value.toUpperCase())} maxLength={13} /></TableCell>
                                  <TableCell className="p-6 border-r"><Select value={ast.funcion} onValueChange={(v:any) => updateAssistantField(idx, 'funcion', v)}><SelectTrigger className="h-14 text-[11px] font-black rounded-xl"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl">{FUNCIONES.map(f => (<SelectItem key={f} value={f} className="text-[11px] font-black">{f}</SelectItem>))}</SelectContent></Select></TableCell>
                                  <TableCell className="p-6 border-r"><Input placeholder="15DESXXXXX" className="h-14 text-[11px] font-mono font-black text-center uppercase border-primary/20 rounded-xl shadow-inner bg-slate-50" value={ast.cct} onChange={e => updateAssistantField(idx, 'cct', e.target.value.toUpperCase())} maxLength={10} /></TableCell>
                                  <TableCell className="p-6 px-10 text-left">
                                     <div className="flex flex-col gap-3">
                                        <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[9px] uppercase px-4 py-1.5 rounded-xl truncate max-w-[250px]">{ast.nombreCT || 'PLANEL PENDIENTE'}</Badge>
                                        <div className="flex gap-2">
                                            <Badge className="bg-primary/5 text-primary border-none font-black text-[9px] uppercase px-4 py-1.5 rounded-xl">ZE: {ast.ze || 'S/Z'}</Badge>
                                            <Badge className="bg-accent/5 text-accent border-none font-black text-[9px] uppercase px-4 py-1.5 rounded-xl">{ast.municipio || 'S/M'}</Badge>
                                        </div>
                                     </div>
                                  </TableCell>
                                  <TableCell className="p-6"><Button variant="ghost" size="icon" onClick={() => handleRemoveAssistantRow(idx)} disabled={(formData.asistentes?.length || 0) <= 1} className="h-12 w-12 text-rose-500 hover:bg-rose-50 rounded-[1rem]"><Trash2 className="h-6 w-6" /></Button></TableCell>
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

            <DialogFooter className="p-12 border-t-2 border-slate-50 flex items-center justify-between bg-white">
               <div className="flex items-center gap-5">
                  <div className="h-4 w-4 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Servidor Activo • Edoméx 2026 • Auditoría COEES</span>
               </div>
               <div className="flex gap-8">
                  <Button variant="outline" onClick={() => { setIsDialogOpen(false); setFormData(initialFormState); setActiveDialogTab('datos'); }} className="h-16 px-16 rounded-2xl font-black uppercase text-[12px] tracking-widest border-4 border-slate-50 bg-white">Cancelar</Button>
                  <Button onClick={handleSave} className="h-16 px-24 rounded-2xl font-black uppercase text-[12px] bg-primary text-white shadow-2xl shadow-primary/30 tracking-[0.3em] transition-all hover:scale-[1.04]">Guardar Registro</Button>
               </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
