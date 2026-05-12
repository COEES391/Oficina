
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
  ShieldCheck, 
  Lock, 
  Eye, 
  Monitor, 
  Trash2,
  Key,
  LayoutDashboard,
  GraduationCap,
  Activity,
  FileText,
  MapPin,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const PROGRAM_RUBROS = [
  'Biblioteca Digital',
  'Cuentas Institucionales',
  'Conoce mi Escuela'
];

const DB_VERSION = "1709_records_official_v12";

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
  const [generatedPass, setGeneratedPass] = useState('')

  // Dashboard state
  const [modFilter, setModFilter] = useState('all')
  const [secFilter, setSecFilter] = useState('all')
  const [valFilter, setValFilter] = useState('all')

  const initialAssistant: ProgramAssistant = {
    paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: 'DOCENTE', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '', departamento: ''
  };

  const initialFormState: ProgramStatus = {
    id: '', name: '', progress: 0, status: 'planeacion', date: new Date().toISOString(), cct: '', schoolName: '', zonaEscolar: '', sector: '', modalidad: '', municipio: '', region: '', valle: '',
    numeroEquipos: 0, descripcionEquipo: '', responsables: ['', '', ''], setes: 'N', observaciones: '', capacitacion: 'N', asistentes: [initialAssistant],
    cursoGrupo: '', cursoNombre: '', duracionHoras: 0, fechaInicio: '', fechaTermino: '', instructores: ['', '', ''], cctSede: ''
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
      toast({ title: "Acceso Editorial Concedido" })
    } else {
      toast({ variant: "destructive", title: "Acceso Denegado" })
    }
  }

  // CI Filtered Logic
  const ciRecords = useMemo(() => {
    return records.filter(r => r.id.startsWith('PROG-CI') || (r.name?.includes('Cuentas')));
  }, [records]);

  const dashboardData = useMemo(() => {
    const filtered = ciRecords.filter(r => {
      const mMatch = modFilter === 'all' || r.modalidad === modFilter;
      const sMatch = secFilter === 'all' || r.sector === secFilter;
      const vMatch = valFilter === 'all' || r.valle === valFilter;
      return mMatch && sMatch && vMatch;
    });

    const approved = filtered.filter(r => r.status === 'concluido').length;
    const pending = filtered.length - approved;
    const usagePercent = filtered.length > 0 ? Math.round((approved / filtered.length) * 100) : 0;

    return {
      filtered,
      total: filtered.length,
      usagePercent,
      pieData: [
        { name: 'APROBADO', value: approved, fill: '#10b981' },
        { name: 'PLANEACIÓN', value: pending, fill: '#f43f5e' }
      ],
      barData: [
        { name: 'TERMINADO', value: approved, fill: '#621132' },
        { name: 'EN PROCESO', value: Math.floor(pending * 0.3), fill: '#f59e0b' },
        { name: 'NO INICIADO', value: Math.ceil(pending * 0.7), fill: '#cbd5e1' }
      ],
      options: {
        mods: Array.from(new Set(ciRecords.map(r => r.modalidad))).sort(),
        sectors: Array.from(new Set(ciRecords.map(r => r.sector))).filter(Boolean).sort((a,b) => parseInt(a!) - parseInt(b!))
      }
    };
  }, [ciRecords, modFilter, secFilter, valFilter]);

  const handleEdit = (rec: ProgramStatus) => {
    setFormData({
      ...rec,
      instructores: rec.instructores || ['', '', ''],
      asistentes: rec.asistentes || [initialAssistant]
    });
    setEditingId(rec.id);
    setIsDialogOpen(true);
  }

  const handleDelete = (id: string) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    localStorage.setItem('programs_full', JSON.stringify(updated));
    toast({ title: "Registro eliminado" });
  }

  const handleSave = () => {
    if (!formData.id || !formData.cct) {
      toast({ variant: "destructive", title: "Folio y CCT obligatorios" });
      return;
    }
    const updated = editingId ? records.map(r => r.id === editingId ? formData : r) : [formData, ...records];
    setRecords(updated)
    localStorage.setItem('programs_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    setEditingId(null)
    setFormData(initialFormState)
    toast({ title: "Registro guardado correctamente" })
  }

  if (!mounted) return null

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase">Módulos de Planeación</h2>
          <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Activity className="h-3 w-3 text-accent" /> Control de Programas Estratégicos
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="w-full h-auto flex flex-wrap bg-slate-100/50 p-1 rounded-2xl shadow-inner border border-primary/5">
          {PROGRAM_RUBROS.map(rubro => (
            <TabsTrigger key={rubro} value={rubro} className="flex-1 min-w-[150px] h-12 text-[10px] font-black uppercase rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">
              {rubro}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="Biblioteca Digital" className="space-y-6">
          <div className="flex justify-between items-center">
             <h3 className="text-xl font-black uppercase text-primary flex items-center gap-3">
               <Monitor className="h-6 w-6" /> Equipamiento y Capacitación
             </h3>
             <Button onClick={() => { setFormData({...initialFormState, name: 'Biblioteca Digital', id: `PROG-BD-${Date.now()}`}); setEditingId(null); setIsDialogOpen(true); }} className="gap-2 font-black uppercase shadow-lg">
                <PlusCircle className="h-4 w-4" /> Iniciar Captura Técnica
             </Button>
          </div>
          <Card className="executive-card">
            <CardContent className="p-0">
               <Table>
                 <TableHeader className="bg-slate-50/50">
                    <TableRow>
                       <TableHead className="font-black text-[10px] uppercase pl-8 py-5">ID / CCT</TableHead>
                       <TableHead className="font-black text-[10px] uppercase">MODALIDAD / VALLE</TableHead>
                       <TableHead className="font-black text-[10px] uppercase text-center">EQUIPOS</TableHead>
                       <TableHead className="font-black text-[10px] uppercase text-center">CAPACITACIÓN</TableHead>
                       <TableHead className="font-black text-[10px] uppercase text-right pr-8">ACCIÓN</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {records.filter(r => r.name === 'Biblioteca Digital').map(rec => (
                      <TableRow key={rec.id} className="hover:bg-slate-50 transition-colors">
                         <TableCell className="pl-8 font-black text-slate-700">{rec.cct || rec.id}</TableCell>
                         <TableCell>
                            <div className="flex flex-col">
                               <span className="text-[10px] font-bold uppercase">{rec.modalidad}</span>
                               <span className="text-[9px] text-muted-foreground uppercase">{rec.valle}</span>
                            </div>
                         </TableCell>
                         <TableCell className="text-center font-black">{rec.numeroEquipos || 0}</TableCell>
                         <TableCell className="text-center">
                            <Badge variant={rec.capacitacion === 'S' ? 'default' : 'outline'} className="text-[9px] font-black uppercase">
                               {rec.capacitacion === 'S' ? 'REALIZADA' : 'PENDIENTE'}
                            </Badge>
                         </TableCell>
                         <TableCell className="text-right pr-8">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(rec)}>
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

        <TabsContent value="Cuentas Institucionales" className="space-y-8">
           <div className="space-y-6">
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center shadow-lg"><LayoutDashboard className="h-6 w-6 text-white" /></div>
                <div>
                   <h2 className="text-2xl font-black text-primary uppercase leading-none">Monitoreo de Cuentas Institucionales</h2>
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Sincronización con {ciRecords.length} Registros Oficiales</p>
                </div>
             </div>
             
             {/* Slicers Row */}
             <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-3 space-y-4">
                   <Card className="p-5 bg-slate-50 border-2 border-white shadow-inner rounded-2xl">
                      <Label className="text-[9px] font-black uppercase text-primary mb-3 block">MODALIDAD</Label>
                      <div className="flex flex-wrap gap-1.5">
                         <Button variant={modFilter === 'all' ? 'default' : 'outline'} size="sm" className="h-8 text-[9px] font-black" onClick={() => setModFilter('all')}>TODAS</Button>
                         {dashboardData.options.mods.map(m => (
                            <Button key={m} variant={modFilter === m ? 'default' : 'outline'} size="sm" className="h-8 text-[9px] font-black uppercase" onClick={() => setModFilter(m || 'all')}>{m}</Button>
                         ))}
                      </div>
                   </Card>
                   <Card className="p-5 bg-slate-50 border-2 border-white shadow-inner rounded-2xl">
                      <Label className="text-[9px] font-black uppercase text-primary mb-3 block">SECTOR</Label>
                      <div className="grid grid-cols-5 gap-1.5">
                         <Button variant={secFilter === 'all' ? 'default' : 'outline'} size="sm" className="h-8 text-[9px] font-black" onClick={() => setSecFilter('all')}>T</Button>
                         {dashboardData.options.sectors.map(s => (
                            <Button key={s} variant={secFilter === s ? 'default' : 'outline'} size="sm" className="h-8 text-[9px] font-black" onClick={() => setSecFilter(s || 'all')}>{s}</Button>
                         ))}
                      </div>
                   </Card>
                   <Card className="p-5 bg-slate-50 border-2 border-white shadow-inner rounded-2xl">
                      <Label className="text-[9px] font-black uppercase text-primary mb-3 block">VALLE</Label>
                      <div className="flex gap-1.5">
                         <Button variant={valFilter === 'all' ? 'default' : 'outline'} size="sm" className="flex-1 h-8 text-[9px] font-black" onClick={() => setValFilter('all')}>AMBOS</Button>
                         <Button variant={valFilter === 'MÉXICO' ? 'default' : 'outline'} size="sm" className="flex-1 h-8 text-[9px] font-black" onClick={() => setValFilter('MÉXICO')}>MÉXICO</Button>
                         <Button variant={valFilter === 'TOLUCA' ? 'default' : 'outline'} size="sm" className="flex-1 h-8 text-[9px] font-black" onClick={() => setValFilter('TOLUCA')}>TOLUCA</Button>
                      </div>
                   </Card>
                </div>

                {/* Main Stats */}
                <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-6">
                   <Card className="p-8 flex flex-col items-center justify-center bg-white shadow-xl relative overflow-hidden rounded-[2.5rem] border-none group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Cuentas Filtradas</span>
                      <div className="text-7xl font-black text-slate-800 tracking-tighter">{dashboardData.total}</div>
                   </Card>

                   <Card className="p-6 flex flex-col items-center bg-white shadow-xl rounded-[2.5rem] border-none">
                      <Label className="text-[10px] font-black text-slate-400 mb-4 uppercase">% CORREO ACTIVO (USO)</Label>
                      <div className="relative h-[200px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie data={dashboardData.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                                  {dashboardData.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                               </Pie>
                            </PieChart>
                         </ResponsiveContainer>
                         <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-primary leading-none">{dashboardData.usagePercent}%</span>
                         </div>
                      </div>
                   </Card>

                   <Card className="p-6 bg-white shadow-xl rounded-[2.5rem] border-none">
                      <Label className="text-[10px] font-black text-slate-400 mb-6 uppercase block">ESTATUS OPERATIVO (DESYSA - COEES)</Label>
                      <div className="h-[220px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dashboardData.barData}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                               <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                               <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9 }} hide />
                               <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                                  {dashboardData.barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                               </Bar>
                            </BarChart>
                         </ResponsiveContainer>
                      </div>
                   </Card>
                </div>
             </div>

             <div className="flex justify-between items-center px-2">
                <h4 className="text-lg font-black uppercase text-primary">Listado Detallado de Registros</h4>
                <Button onClick={() => { setFormData({...initialFormState, name: 'Cuentas Institucionales', id: `PROG-CI-${Date.now()}`}); setEditingId(null); setIsDialogOpen(true); }} className="gap-2 font-black uppercase shadow-md bg-emerald-600 hover:bg-emerald-700">
                   <PlusCircle className="h-4 w-4" /> Agregar Nueva Cuenta
                </Button>
             </div>

             <Card className="executive-card">
                <div className="overflow-x-auto">
                   <Table>
                      <TableHeader className="bg-slate-100/50">
                         <TableRow>
                            <TableHead className="font-black text-[9px] uppercase pl-8 py-5"># USUARIO / CCT</TableHead>
                            <TableHead className="font-black text-[9px] uppercase">MODALIDAD / VALLE</TableHead>
                            <TableHead className="font-black text-[9px] uppercase">ÁREA / ZONA</TableHead>
                            <TableHead className="font-black text-[9px] uppercase">CORREO INSTITUCIONAL</TableHead>
                            <TableHead className="font-black text-[9px] uppercase text-right pr-8">ESTATUS</TableHead>
                            <TableHead className="font-black text-[9px] uppercase text-right pr-8">ACCIÓN</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {dashboardData.filtered.slice(0, 100).map((rec, i) => (
                            <TableRow key={rec.id} className="text-[10px] font-bold hover:bg-slate-50 transition-colors border-slate-100">
                               <TableCell className="pl-8 py-4 text-primary font-black uppercase">{rec.id.split('-').pop() || i+1} | {rec.cct || 'N/A'}</TableCell>
                               <TableCell>
                                  <div className="flex flex-col">
                                     <span className="uppercase text-[9px] font-black text-slate-700">{rec.modalidad}</span>
                                     <span className="uppercase text-[8px] text-slate-400">{rec.valle}</span>
                                  </div>
                               </TableCell>
                               <TableCell>
                                  <div className="flex flex-col">
                                     <span className="uppercase text-[9px]">{rec.asistentes?.[0]?.departamento || 'PLANTEL'}</span>
                                     <span className="text-[8px] text-muted-foreground">ZONA: {rec.zonaEscolar || 'S/Z'}</span>
                                  </div>
                               </TableCell>
                               <TableCell className="font-mono text-blue-600">{rec.asistentes?.[0]?.email}</TableCell>
                               <TableCell className="text-right pr-8">
                                  <Badge className={cn("text-[8px] font-black uppercase px-3", rec.status === 'concluido' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white')}>
                                     {rec.status === 'concluido' ? 'APROBADO' : 'PLANEACIÓN'}
                                  </Badge>
                               </TableCell>
                               <TableCell className="text-right pr-8">
                                  <div className="flex justify-end gap-2">
                                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(rec)}><Pencil className="h-4 w-4" /></Button>
                                     <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => handleDelete(rec.id)}><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                               </TableCell>
                            </TableRow>
                         ))}
                      </TableBody>
                   </Table>
                </div>
             </Card>
          </div>
        </TabsContent>

        <TabsContent value="Conoce mi Escuela" className="animate-in fade-in duration-500">
           <div className="bg-white shadow-2xl border border-slate-200 rounded-lg overflow-hidden max-w-5xl mx-auto font-sans">
              {/* Portal Header */}
              <div className="bg-white p-8 border-b-8 border-primary relative">
                 <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-bold text-emerald-800 uppercase tracking-tight">Dirección de Educación Secundaria y Servicios de Apoyo</h1>
                    <p className="text-sm font-medium text-slate-500">Servicios Educativos Integrados al Estado de México</p>
                 </div>
                 <div className="flex justify-center mt-4">
                    <div className="h-1 bg-slate-200 w-1/2 rounded-full" />
                 </div>
              </div>

              {/* Portal Body */}
              <div className="p-12 space-y-10 relative">
                 <div className="flex justify-end">
                    <p className="text-xs font-bold text-rose-800">
                       {format(new Date(), "eeee d 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                 </div>

                 <div className="flex items-center gap-4 mb-8">
                    <div className="h-6 w-10 flex flex-col border border-slate-200">
                       <div className="flex-1 bg-emerald-700" />
                       <div className="flex-1 bg-white" />
                       <div className="flex-1 bg-rose-700" />
                    </div>
                    <h2 className="text-xl font-bold text-rose-800">Conoce mi escuela</h2>
                 </div>

                 <div className="space-y-6 text-sm leading-relaxed text-slate-800 text-justify">
                    <p>
                       <span className="font-bold">Conoce mi Escuela</span>, es un programa creado y administrado por el <span className="font-bold">Departamento de Computación Electrónica en la Educación Secundaria (COEES)</span>, el cual inició en el 2006 y a la fecha se perfila como la única vía autorizada para que las escuelas cuenten con un espacio Web para compartir información de interés general para proyectar su trabajo hacia la comunidad, padres de familia y autoridades educativas.
                    </p>
                    <p>
                       A través de Conoce mi Escuela, los directores escolares tienen la oportunidad de dar a conocer, los detalles e información que caracterizan y diferencian a su escuela: historia de la institución, infraestructura, actividades que emprenden a lo largo de cada ciclo escolar, logros y reconocimientos a los que se han hecho acreedores por el buen desempeño docente, así como su participación en concursos académicos, deportivos o culturales; a nivel zona o sector, o a nivel estado.
                    </p>
                    <p>
                       Con este programa, se aspira a que todos los centros de trabajo sean reconocidos por la comunidad, dando a conocer información cuantitativa y cualitativa de nuestras escuelas, coadyuvando al aumento de la matrícula escolar.
                    </p>
                 </div>

                 <div className="pt-10 space-y-4 max-w-md">
                    <div className="group flex items-center gap-3 cursor-pointer">
                       <div className="h-2 w-2 rounded-full border border-slate-400 group-hover:bg-primary transition-colors" />
                       <span className="text-sm font-bold text-slate-700 underline underline-offset-4 group-hover:text-primary">Incorporación</span>
                    </div>
                    <div className="group flex items-center gap-3 cursor-pointer" onClick={() => setIsLoginDialogOpen(true)}>
                       <div className="h-2 w-2 rounded-full border border-slate-400 group-hover:bg-primary transition-colors" />
                       <span className="text-sm font-bold text-slate-700 underline underline-offset-4 group-hover:text-primary">Escuelas incorporadas</span>
                    </div>
                    <div className="group flex items-center gap-3 cursor-pointer">
                       <div className="h-2 w-2 rounded-full border border-slate-400 group-hover:bg-primary transition-colors" />
                       <span className="text-sm font-bold text-slate-700 underline underline-offset-4 group-hover:text-primary">Consulta tu escuela</span>
                    </div>
                 </div>

                 {isEditorialUser && (
                    <div className="mt-12 p-6 bg-slate-50 border-2 border-dashed border-primary/20 rounded-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                           <h3 className="font-black text-primary uppercase text-sm">Panel Editorial Activo</h3>
                           <Badge className="bg-primary text-white">SESIÓN SEIEM</Badge>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-[9px] font-black">CCT</TableHead>
                                    <TableHead className="text-[9px] font-black">ZONA</TableHead>
                                    <TableHead className="text-[9px] font-black">VALLE</TableHead>
                                    <TableHead className="text-[9px] font-black text-right">AUDITORÍA</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records.filter(r => r.id.startsWith('WEB-') || r.id.startsWith('PROG-CE-')).map(r => (
                                    <TableRow key={r.id} className="text-[10px]">
                                        <TableCell className="font-bold">{r.cct}</TableCell>
                                        <TableCell>{r.zonaEscolar}</TableCell>
                                        <TableCell>{r.valle}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" className="h-7 text-[8px]" onClick={() => handleEdit(r)}>REVISAR</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                 )}
              </div>

              {/* Portal Footer */}
              <div className="bg-white border-t p-10 flex flex-col items-center text-center space-y-6">
                 <div className="space-y-1 text-[11px] font-bold text-slate-600 uppercase leading-tight">
                    <p>Gobierno del Estado de México</p>
                    <p>Secretaría de Educación</p>
                    <p>Servicios Educativos Integrados al Estado de México</p>
                    <p>Dirección de Educación Secundaria y Servicios de Apoyo</p>
                 </div>
                 
                 <div className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    <p>Profesor Agripín García Estrada No. 1306, Santa Cruz Atzcapotzaltongo</p>
                    <p>Toluca, Estado de México, C.P. 50030</p>
                    <p>Tel.: (722) 265-1200 ext. 9099 y 9021</p>
                    <p className="text-rose-800 font-bold mt-1">www.seiem.gob.mx</p>
                 </div>
              </div>
           </div>
        </TabsContent>
      </Tabs>

      {/* Login Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-primary p-8 text-white text-center">
             <DialogTitle className="text-xl font-black uppercase tracking-tighter">Acceso Editorial</DialogTitle>
             <DialogDescription className="text-white/70 font-bold text-[10px] uppercase">Requiere credenciales SEIEM</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6 bg-white">
             <div className="space-y-4">
                <Input placeholder="USUARIO" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value.toUpperCase()})} className="h-14 rounded-2xl bg-slate-50 border-none font-black px-6" />
                <Input type="password" placeholder="CONTRASEÑA" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none font-black px-6" />
             </div>
             <Button onClick={handleEditorialLogin} className="w-full h-14 rounded-2xl font-black uppercase bg-primary text-white shadow-xl">Ingresar al Panel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Capture Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[1200px] h-[90vh] flex flex-col p-0 rounded-[2.5rem] overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 border-b bg-slate-50">
             <DialogTitle className="text-2xl font-black uppercase text-primary tracking-tighter">
                {editingId ? 'Editar Registro Técnico' : 'Nueva Captura Técnica'}
             </DialogTitle>
             <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground tracking-widest mt-1">Gestión Estratégica de Programas</DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 p-8 bg-white">
             <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-primary ml-2">CCT / Clave de Plantel</Label>
                      <Input placeholder="15XXXXXX" value={formData.cct} onChange={e => setFormData({...formData, cct: e.target.value.toUpperCase()})} maxLength={10} className="h-14 rounded-2xl bg-white border-2 border-slate-100 font-black px-6" />
                   </div>
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-primary ml-2">Valle</Label>
                      <Select value={formData.valle} onValueChange={v => setFormData({...formData, valle: v})}>
                         <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-black px-6"><SelectValue placeholder="VALLE" /></SelectTrigger>
                         <SelectContent>
                            <SelectItem value="MÉXICO" className="font-black">MÉXICO</SelectItem>
                            <SelectItem value="TOLUCA" className="font-black">TOLUCA</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-primary ml-2">Estatus</Label>
                      <Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val})}>
                        <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-black px-6"><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="planeacion" className="text-[10px] font-black">PENDIENTE / PLANEACIÓN</SelectItem>
                           <SelectItem value="concluido" className="text-[10px] font-black">APROBADO / CONCLUIDO</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                </div>

                {formData.name === 'Biblioteca Digital' && (
                  <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-primary ml-2">Número de Equipos</Label>
                          <Input type="number" value={formData.numeroEquipos} onChange={e => setFormData({...formData, numeroEquipos: parseInt(e.target.value) || 0})} className="h-14 rounded-2xl bg-white border-2 border-slate-100 font-black px-6" />
                       </div>
                       <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-primary/5">
                          <div className="space-y-1">
                             <Label className="text-[11px] font-black uppercase text-primary">¿Se realizó capacitación?</Label>
                             <p className="text-[9px] font-bold text-muted-foreground">Habilitar panel de asistentes y curso</p>
                          </div>
                          <Switch checked={formData.capacitacion === 'S'} onCheckedChange={(checked) => setFormData({...formData, capacitacion: checked ? 'S' : 'N'})} />
                       </div>
                    </div>

                    {formData.capacitacion === 'S' && (
                      <div className="space-y-8 p-8 border-2 border-primary/10 rounded-3xl bg-primary/5">
                        <div className="flex items-center gap-3 border-b-2 border-primary/10 pb-4">
                           <GraduationCap className="h-6 w-6 text-primary" />
                           <h4 className="text-sm font-black uppercase text-primary tracking-widest">Gestión de Curso e Instructores</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-60">Folio del Curso</Label><Input value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} /></div>
                           <div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-60">Nombre del Curso</Label><Input value={formData.cursoNombre} onChange={e => setFormData({...formData, cursoNombre: e.target.value})} /></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase text-primary ml-2">Observaciones Técnicas</Label>
                   <Textarea value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder="Detalles adicionales..." className="min-h-[120px] rounded-[1.5rem] border-2 border-slate-100 p-6" />
                </div>
             </div>
          </ScrollArea>

          <DialogFooter className="p-8 border-t bg-slate-50 flex justify-end gap-4">
             <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-14 px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-white">Cancelar</Button>
             <Button onClick={handleSave} className="h-14 px-14 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] bg-primary hover:bg-primary/90 text-white shadow-2xl transition-all">
                Guardar Cambios
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
