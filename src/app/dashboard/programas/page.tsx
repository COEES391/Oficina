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
  ListFilter
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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

const DB_VERSION = "coees_institutional_redesign_v48";

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
    id: '', name: '', progress: 0, status: 'planeacion', date: new Date().toISOString(), cct: '', schoolName: '', zonaEscolar: '', sector: '', modalidad: '', municipio: '', region: '', valle: '',
    numeroEquipos: 0, descripcionEquipo: '', responsables: ['', '', ''], setes: 'N', observaciones: '', capacitacion: 'N', asistentes: [initialAssistant],
    cursoGrupo: '', cursoNombre: '', duracionHoras: 0, fechaInicio: '', fechaTermino: '', instructores: ['', '', ''], cctSede: '', numeroOficio: ''
  }

  const [formData, setFormData] = useState<ProgramStatus>(initialFormState)

  useEffect(() => {
    setMounted(true)
    const rfc = localStorage.getItem('userRfc')
    setUserRfc(rfc)
    if (rfc === 'CEDITORIAL') setIsEditorialUser(true);
    
    const storedVersion = localStorage.getItem('programs_db_version_v48')
    if (storedVersion !== DB_VERSION) {
      setRecords(programsData)
      localStorage.setItem('programs_full', JSON.stringify(programsData))
      localStorage.setItem('programs_db_version_v48', DB_VERSION)
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
    const approved = filtered.filter(r => r.status === 'activo' || r.status === 'concluido').length;
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
            <h2 className="text-5xl font-black tracking-tighter text-primary uppercase leading-none">COEES</h2>
            <div className="flex items-center gap-4">
              <span className="h-1 w-12 bg-accent/30 rounded-full" />
              <p className="text-muted-foreground font-black text-[12px] uppercase tracking-[0.4em] flex items-center gap-3">
                <Activity className="h-4 w-4 text-accent" /> Módulos Técnicos Operativos
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
          <TabsList className="w-full h-20 flex bg-white/50 backdrop-blur-xl p-2 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.03)] border-2 border-white">
            {PROGRAM_RUBROS.map(rubro => (
              <TabsTrigger 
                key={rubro} 
                value={rubro} 
                className="flex-1 h-full text-[11px] font-black uppercase rounded-[1.5rem] tracking-[0.1em] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:shadow-primary/30 transition-all"
              >
                {rubro === 'Geoposición' && <MapPin className="h-4 w-4 mr-3" />}
                {rubro === 'Biblioteca Digital' && <Monitor className="h-4 w-4 mr-3" />}
                {rubro === 'Cuentas Institucionales' && <Globe className="h-4 w-4 mr-3" />}
                {rubro}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="Biblioteca Digital" className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
            <div className="flex justify-between items-center bg-white/40 p-8 rounded-[2.5rem] border-2 border-white backdrop-blur-md shadow-sm">
               <div className="space-y-1">
                 <h3 className="text-2xl font-black uppercase text-primary flex items-center gap-4">
                   <Monitor className="h-8 w-8" /> Equipamiento y Capacitación
                 </h3>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-12">Monitoreo de Infraestructura Tecnológica</p>
               </div>
               <Button onClick={() => { setFormData({...initialFormState, name: 'Biblioteca Digital', id: `PROG-BD-${Date.now()}`}); setEditingId(null); setIsDialogOpen(true); }} className="btn-institutional px-10">
                  <PlusCircle className="h-5 w-5 mr-3" /> Iniciar Captura
               </Button>
            </div>
            <Card className="executive-card">
              <CardContent className="p-0">
                 <div className="overflow-x-auto">
                   <table className="table-institutional">
                     <thead>
                        <tr>
                           <th className="pl-10 text-left">ID / CCT</th>
                           <th className="text-left">Modalidad y Valle</th>
                           <th>Equipos</th>
                           <th>Capacitación</th>
                           <th className="pr-10 text-right">Gestión</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {bdRecords.length > 0 ? bdRecords.map(rec => (
                          <TableRow key={rec.id} className="hover:bg-slate-50/50 transition-all group">
                             <TableCell className="pl-10 text-left">
                               <div className="flex items-center gap-4">
                                 <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                   <Building2 className="h-5 w-5" />
                                 </div>
                                 <span className="font-black text-slate-700 text-sm tracking-tight">{rec.cct || rec.id}</span>
                               </div>
                             </TableCell>
                             <TableCell className="text-left">
                                <div className="flex flex-col gap-1">
                                   <Badge className="bg-slate-900 text-white border-none text-[8px] font-black w-fit uppercase">{rec.modalidad}</Badge>
                                   <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{rec.valle}</span>
                                </div>
                             </TableCell>
                             <TableCell>
                               <div className="flex items-center justify-center">
                                 <div className="h-10 w-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-lg text-primary shadow-inner">
                                   {rec.numeroEquipos || 0}
                                 </div>
                               </div>
                             </TableCell>
                             <TableCell>
                                <Badge className={cn(
                                  "text-[9px] font-black uppercase px-4 py-1.5 rounded-full border-none shadow-sm",
                                  rec.capacitacion === 'S' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                                )}>
                                   {rec.capacitacion === 'S' ? 'REALIZADA' : 'PENDIENTE'}
                                </Badge>
                             </TableCell>
                             <TableCell className="pr-10">
                                <div className="flex justify-end gap-3">
                                   <button onClick={() => {setFormData(rec); setEditingId(rec.id); setIsDialogOpen(true);}} className="h-10 w-10 flex items-center justify-center hover:bg-primary hover:text-white rounded-xl text-slate-400 transition-all border border-slate-100 bg-white shadow-sm"><Pencil className="h-4 w-4" /></button>
                                   <button onClick={() => setRecords(records.filter(r => r.id !== rec.id))} className="h-10 w-10 flex items-center justify-center hover:bg-rose-500 hover:text-white rounded-xl text-rose-500 transition-all border border-rose-50 bg-white shadow-sm"><Trash2 className="h-4 w-4" /></button>
                                </div>
                             </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground font-black uppercase text-[12px] opacity-30">Sin registros en Biblioteca Digital</TableCell></TableRow>
                        )}
                     </tbody>
                   </table>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="Cuentas Institucionales" className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
             <div className="space-y-10">
               <div className="flex items-center justify-between bg-white/40 p-10 rounded-[2.5rem] border-2 border-white backdrop-blur-md shadow-sm">
                  <div className="flex items-center gap-6">
                     <div className="h-16 w-16 bg-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30"><Globe className="h-8 w-8 text-white" /></div>
                     <div>
                        <h2 className="text-3xl font-black text-primary uppercase leading-none tracking-tighter">Monitoreo de Identidades</h2>
                        <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-3">Análisis Integral de Cuentas @COEES</p>
                     </div>
                  </div>
                  <Button onClick={() => { setFormData({...initialFormState, name: 'Cuentas Institucionales', id: `PROG-CI-${Date.now()}`}); setEditingId(null); setIsDialogOpen(true); }} className="btn-institutional px-12">
                     <PlusCircle className="h-5 w-5 mr-3" /> Registrar Cuenta
                  </Button>
               </div>

               <Tabs value={ciActiveInternalTab} onValueChange={setCiActiveInternalTab} className="w-full">
                  <TabsList className="bg-white/50 backdrop-blur-lg p-1.5 rounded-2xl mb-10 border border-white shadow-inner inline-flex h-14">
                     <TabsTrigger value="analitica" className="gap-3 text-[10px] font-black uppercase px-8 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white shadow-sm"><BarChart3 className="h-4 w-4" /> Analítica</TabsTrigger>
                     <TabsTrigger value="registros" className="gap-3 text-[10px] font-black uppercase px-8 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white shadow-sm"><ListFilter className="h-4 w-4" /> Registros</TabsTrigger>
                  </TabsList>

                  <TabsContent value="analitica" className="space-y-10 animate-in fade-in duration-500">
                     <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                        <div className="md:col-span-3">
                           <Card className="p-8 bg-white/90 backdrop-blur-3xl border-2 border-white rounded-[2.5rem] shadow-xl space-y-10">
                              <div className="space-y-4">
                                 <Label className="text-[10px] font-black uppercase text-primary mb-4 block tracking-widest flex items-center gap-2">
                                   <MapPin className="h-3 w-3" /> Valle Territorial
                                 </Label>
                                 <div className="flex flex-col gap-3">
                                    {['all', 'MÉXICO', 'TOLUCA'].map(v => (
                                      <Button 
                                        key={v}
                                        variant={valFilter === v ? 'default' : 'outline'} 
                                        size="sm" 
                                        className={`h-12 text-[10px] font-black justify-start rounded-xl px-6 ${valFilter === v ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-white border-slate-100'}`} 
                                        onClick={() => setValFilter(v)}
                                      >
                                        {v === 'all' ? 'AMBOS VALLES' : `VALLE DE ${v}`}
                                      </Button>
                                    ))}
                                 </div>
                              </div>
                              
                              <div className="space-y-4 pt-6 border-t border-slate-50">
                                 <Label className="text-[10px] font-black uppercase text-primary mb-4 block tracking-widest flex items-center gap-2">
                                   <Briefcase className="h-3 w-3" /> Modalidad
                                 </Label>
                                 <Select value={modFilter} onValueChange={setModFilter}>
                                    <SelectTrigger className="h-12 text-[10px] font-black rounded-xl border-slate-100 bg-white"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-xl border-none shadow-2xl">
                                       <SelectItem value="all" className="text-[10px] font-black">TODAS</SelectItem>
                                       <SelectItem value="DES" className="text-[10px] font-black">DES (GENERAL)</SelectItem>
                                       <SelectItem value="DST" className="text-[10px] font-black">DST (TÉCNICA)</SelectItem>
                                       <SelectItem value="DTV" className="text-[10px] font-black">DTV (TELESEC.)</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </div>

                              <div className="space-y-4 pt-6 border-t border-slate-50">
                                 <Label className="text-[10px] font-black uppercase text-primary mb-4 block tracking-widest flex items-center gap-2">
                                   <Globe className="h-3 w-3" /> Dominio Institucional
                                 </Label>
                                 <Select value={domFilter} onValueChange={setDomFilter}>
                                    <SelectTrigger className="h-12 text-[10px] font-black rounded-xl border-slate-100 bg-white"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-xl border-none shadow-2xl">
                                       <SelectItem value="all" className="text-[10px] font-black">TODOS</SelectItem>
                                       <SelectItem value="@desysa.gob.mx" className="text-[10px] font-black">@desysa.gob.mx</SelectItem>
                                       <SelectItem value="@desysa.edu.mx" className="text-[10px] font-black">@desysa.edu.mx</SelectItem>
                                       <SelectItem value="@coees.edu.mx" className="text-[10px] font-black">@coees.edu.mx</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </div>
                           </Card>
                        </div>

                        <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-10">
                           <Card className="executive-card p-10 flex flex-col items-center justify-center group">
                              <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                <Users className="h-8 w-8" />
                              </div>
                              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Total Identidades</span>
                              <div className="text-7xl font-black text-slate-800 tracking-tighter tabular-nums">{ciDashboardData.total}</div>
                           </Card>

                           <Card className="executive-card p-8 flex flex-col items-center">
                              <span className="text-[11px] font-black text-slate-400 mb-6 uppercase tracking-[0.2em]">Eficiencia de Uso</span>
                              <div className="relative h-[180px] w-full">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                       <Pie data={ciDashboardData.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value">
                                          {ciDashboardData.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />)}
                                       </Pie>
                                    </PieChart>
                                 </ResponsiveContainer>
                                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black text-primary tracking-tighter">{ciDashboardData.usagePercent}%</span>
                                    <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Activo</span>
                                 </div>
                              </div>
                           </Card>

                           <Card className="executive-card p-8 bg-slate-900 text-white border-none">
                              <span className="text-[11px] font-black text-slate-400 mb-10 uppercase tracking-[0.2em] block">Disponibilidad Operativa</span>
                              <div className="h-[200px]">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ciDashboardData.barData}>
                                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                       <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 900, fill: '#fff' }} axisLine={false} tickLine={false} />
                                       <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40}>
                                          {ciDashboardData.barData.map((e, i) => <Cell key={i} fill={e.name === 'ACTIVO' ? '#10b981' : 'rgba(255,255,255,0.1)'} />)}
                                       </Bar>
                                    </BarChart>
                                 </ResponsiveContainer>
                              </div>
                           </Card>
                        </div>
                     </div>
                  </TabsContent>

                  <TabsContent value="registros" className="animate-in fade-in duration-500">
                     <Card className="executive-card">
                        <div className="overflow-x-auto">
                           <table className="table-institutional">
                              <thead>
                                 <tr>
                                    <th className="pl-10 text-left">Referencia CCT</th>
                                    <th className="text-left">Identidad Territorial</th>
                                    <th>Correo Institucional</th>
                                    <th className="pr-10 text-right">Gestión</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                 {ciDashboardData.filtered.length > 0 ? ciDashboardData.filtered.map((rec, idx) => (
                                    <TableRow key={rec.id} className="hover:bg-slate-50/50 transition-all group">
                                       <TableCell className="pl-10 py-6 text-left">
                                         <div className="flex items-center gap-4">
                                           <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                             <Building2 className="h-5 w-5" />
                                           </div>
                                           <span className="text-primary font-black text-sm tracking-tighter uppercase">{rec.cct || rec.id}</span>
                                         </div>
                                       </TableCell>
                                       <TableCell className="text-left">
                                          <div className="flex flex-col gap-1">
                                             <Badge className="bg-slate-900 text-white border-none text-[8px] font-black w-fit uppercase">{rec.modalidad}</Badge>
                                             <span className="uppercase text-[9px] font-black text-slate-400 tracking-[0.1em]">{rec.valle}</span>
                                          </div>
                                       </TableCell>
                                       <TableCell>
                                         <div className="flex items-center justify-center">
                                           <Badge variant="outline" className="px-4 py-2 rounded-xl border-primary/10 text-primary font-mono lowercase text-xs bg-primary/5">
                                             {rec.asistentes?.[0]?.email || '-'}
                                           </Badge>
                                         </div>
                                       </TableCell>
                                       <TableCell className="text-right pr-10">
                                          <div className="flex justify-end gap-3">
                                             <button onClick={() => {setFormData(rec); setEditingId(rec.id); setIsDialogOpen(true);}} className="h-10 w-10 flex items-center justify-center hover:bg-primary hover:text-white rounded-xl text-slate-400 transition-all border border-slate-100 bg-white"><Pencil className="h-4 w-4" /></button>
                                             <button onClick={() => setRecords(records.filter(r => r.id !== rec.id))} className="h-10 w-10 flex items-center justify-center hover:bg-rose-500 hover:text-white rounded-xl text-rose-500 transition-all border border-rose-50 bg-white"><Trash2 className="h-4 w-4" /></button>
                                          </div>
                                       </TableCell>
                                    </TableRow>
                                 )) : (
                                   <TableRow><TableCell colSpan={4} className="text-center py-20 font-black uppercase text-[12px] opacity-30">No se encontraron cuentas con los filtros seleccionados</TableCell></TableRow>
                                 )}
                              </tbody>
                           </table>
                        </div>
                     </Card>
                  </TabsContent>
               </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="Geoposición" className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                  { title: 'Geocodificados', value: geoRecords.length.toLocaleString(), icon: <MapPin className="h-7 w-7" />, color: 'bg-orange-500' },
                  { title: 'Cobertura Global', value: '82%', icon: <Activity className="h-7 w-7" />, color: 'bg-emerald-500' },
                  { title: 'Zonas Auditadas', value: '45', icon: <Building2 className="h-7 w-7" />, color: 'bg-blue-600' },
                  { title: 'Alertas COEES', value: '0', icon: <Activity className="h-7 w-7" />, color: 'bg-rose-600' },
                ].map((item, i) => (
                  <Card key={i} className="executive-card p-10 group">
                    <div className={`h-16 w-16 ${item.color} text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-slate-200 mb-8 group-hover:scale-110 transition-transform duration-500`}>
                      {item.icon}
                    </div>
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.title}</span>
                    <div className="text-5xl font-black text-slate-800 mt-4 tracking-tighter">{item.value}</div>
                  </Card>
                ))}
             </div>
             
             <Card className="executive-card">
                <CardHeader className="p-10 border-b bg-slate-50/50">
                   <CardTitle className="text-lg font-black uppercase text-primary flex items-center gap-4">
                     <MapPin className="h-6 w-6" /> Auditoría Territorial por Centro de Trabajo
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="overflow-x-auto">
                     <table className="table-institutional">
                        <thead>
                           <tr>
                              <th className="pl-10 text-left">CCT / Identificador</th>
                              <th className="text-left">Localización</th>
                              <th>Coordenadas (Lat / Lon)</th>
                              <th className="pr-10 text-right">Auditoría Geo</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {geoRecords.map(rec => (
                              <TableRow key={rec.id} className="hover:bg-slate-50/50 transition-all">
                                 <TableCell className="pl-10 text-left">
                                    <div className="flex flex-col gap-1">
                                       <span className="text-primary font-black uppercase text-sm tracking-tighter">{rec.cct}</span>
                                       <span className="text-slate-400 text-[10px] font-bold uppercase truncate max-w-[250px]">{rec.schoolName || '-'}</span>
                                    </div>
                                 </TableCell>
                                 <TableCell className="text-left uppercase font-black text-[10px] text-slate-600">{rec.valle}</TableCell>
                                 <TableCell className="font-mono text-slate-500 text-xs bg-slate-50 py-2 rounded-xl border border-slate-100/50 mx-4 block mt-4">
                                   {rec.observaciones?.split('Lat:')[1] || 'PENDIENTE DE CAPTURA'}
                                 </TableCell>
                                 <TableCell className="text-right pr-10">
                                    <Badge className="bg-emerald-500 text-white border-none text-[9px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg shadow-emerald-100">VERIFICADO</Badge>
                                 </TableCell>
                              </TableRow>
                           ))}
                        </tbody>
                     </table>
                   </div>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="Conoce mi Escuela" className="animate-in fade-in duration-1000">
             {!isEditorialUser ? (
               <div className="executive-card max-w-6xl mx-auto shadow-2xl border-2 border-white overflow-hidden bg-white">
                <div className="bg-primary p-12 text-center text-white relative">
                   <div className="absolute inset-0 opacity-10 bg-[url('https://picsum.photos/seed/bg/1000/1000')] bg-cover mix-blend-overlay" />
                   <div className="relative z-10 space-y-4">
                      <h1 className="text-3xl font-black uppercase tracking-tight leading-tight max-w-4xl mx-auto">Dirección de Educación Secundaria y Servicios de Apoyo</h1>
                      <div className="flex items-center justify-center gap-4">
                        <span className="h-1 w-12 bg-white/30 rounded-full" />
                        <p className="text-sm font-black text-white/80 uppercase tracking-[0.3em]">Servicios Educativos Integrados al Estado de México</p>
                        <span className="h-1 w-12 bg-white/30 rounded-full" />
                      </div>
                   </div>
                </div>

                <div className="p-16 space-y-12 relative bg-white">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-14 flex flex-col border-2 border-slate-100 shadow-sm rounded-lg overflow-hidden">
                           <div className="flex-1 bg-[#006847]" />
                           <div className="flex-1 bg-white" />
                           <div className="flex-1 bg-[#CE1126]" />
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Conoce mi escuela</h2>
                      </div>
                      <Badge className="bg-slate-50 text-slate-400 border-2 border-slate-100 font-black text-[11px] uppercase px-6 py-3 rounded-2xl">
                         {format(new Date(), "eeee d 'de' MMMM 'de' yyyy", { locale: es })}
                      </Badge>
                   </div>

                   <div className="space-y-10 text-[18px] leading-relaxed text-slate-700 text-justify font-medium max-w-5xl mx-auto">
                      <p>
                         <span className="font-black text-primary text-xl">Conoce mi Escuela</span>, es un programa estratégico creado y administrado por el <span className="font-black text-slate-900">Departamento de Computación Electrónica en la Educación Secundaria (COEES)</span>. Desde su inicio en 2006, se ha consolidado como la plataforma oficial de vinculación digital entre el plantel y la sociedad mexiquense.
                      </p>
                      <p>
                         A través de este portal, la comunidad educativa tiene acceso a la identidad profunda de cada plantel: su historia, logros académicos, infraestructura tecnológica y los reconocimientos que avalan la excelencia docente en el Estado de México.
                      </p>
                   </div>

                   <div className="pt-10 border-t-2 border-slate-50 flex justify-center">
                      <button 
                        onClick={() => setIsLoginDialogOpen(true)}
                        className="group flex items-center gap-6 px-12 py-6 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl hover:bg-primary transition-all duration-500 scale-105"
                      >
                         <span className="text-xl font-black uppercase tracking-[0.2em]">Acceso a Auditoría Técnica</span>
                         <div className="h-10 w-10 bg-white/20 rounded-2xl flex items-center justify-center group-hover:rotate-45 transition-transform">
                            <Plus className="h-6 w-6" />
                         </div>
                      </button>
                   </div>
                </div>

                <div className="bg-slate-50/80 p-12 flex flex-col items-center text-center space-y-6 border-t-2 border-slate-100">
                   <div className="flex gap-8 items-center opacity-30">
                     <Building2 className="h-10 w-10" />
                     <Globe className="h-10 w-10" />
                     <Activity className="h-10 w-10" />
                   </div>
                   <div className="space-y-2 text-[10px] font-black text-slate-400 uppercase leading-relaxed tracking-widest">
                      <p>Gobierno del Estado de México • Secretaría de Educación</p>
                      <p>Departamento de Computación Electrónica (COEES)</p>
                   </div>
                </div>
             </div>
             ) : (
               <div className="space-y-8 animate-in fade-in duration-700 bg-white/80 backdrop-blur-3xl min-h-screen p-12 border-4 border-white shadow-2xl rounded-[3rem]">
                  <div className="text-center py-10 border-b-4 border-slate-50 relative">
                     <div className="absolute left-0 top-1/2 -translate-y-1/2 h-16 w-16 bg-primary/5 rounded-2xl flex items-center justify-center">
                       <Monitor className="h-8 w-8 text-primary" />
                     </div>
                     <h1 className="text-2xl font-black text-primary uppercase tracking-tight leading-tight">Dirección de Educación Secundaria y Servicios de Apoyo</h1>
                     <p className="text-[12px] text-slate-400 font-black uppercase tracking-[0.4em] mt-3 opacity-60">SEIEM • Sección Editorial COEES</p>
                  </div>

                  <div className="py-8">
                     <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-10">
                        <div className="space-y-4 max-w-3xl">
                          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-4">
                            Auditoría de Portales WebEscuela
                          </h2>
                          <p className="text-[12px] text-slate-500 leading-relaxed font-bold uppercase tracking-wide">
                             Ud. se encuentra en el entorno de validación técnica de COEES. Desde este panel podrá revisar, publicar o suspender los portales oficiales de acuerdo a los lineamientos de incorporación vigentes.
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-6 bg-white p-8 rounded-[2rem] border-2 border-slate-50 shadow-sm">
                           <button 
                              onClick={() => { setIsEditorialUser(false); localStorage.removeItem('userRfc'); setUserRfc(null); setActiveDialogTab('datos'); }}
                              className="bg-rose-600 text-white px-10 py-4 text-[11px] font-black uppercase rounded-[1.2rem] shadow-2xl shadow-rose-200 hover:scale-105 transition-all tracking-widest"
                           >
                              Cerrar Portal
                           </button>
                           <Badge className="bg-primary/5 text-primary border-none text-[10px] font-black uppercase px-6 py-2.5 rounded-xl">Registros en Servidor: {editorialRecords.length}</Badge>
                        </div>
                     </div>
                     
                     <div className="executive-card p-0 shadow-2xl border-4 border-white h-[750px] relative">
                        <ScrollArea className="h-full w-full">
                           <table className="table-institutional min-w-[3200px] border-black">
                              <thead className="sticky top-0 z-30 shadow-md">
                                 <tr>
                                    <th className="border-r border-black p-4 w-16 text-center bg-slate-100 text-black">No.</th>
                                    <th 
                                      className="border-r border-black p-4 cursor-pointer hover:bg-slate-200 transition-colors bg-slate-100 text-black text-left"
                                      onClick={() => setSortConfig(p => ({ key: 'cct', direction: p.direction === 'asc' ? 'desc' : 'asc' }))}
                                    >
                                      <div className="flex items-center gap-3 uppercase">
                                         Centro de Trabajo
                                         {sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : sortConfig.direction === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4 opacity-30" />}
                                      </div>
                                    </th>
                                    <th className="border-r border-black p-4 bg-slate-100 text-black text-left">Agrupado</th>
                                    <th className="border-r border-black p-4 bg-slate-100 text-black">Vertiente</th>
                                    <th className="border-r border-black p-4 bg-slate-100 text-black">Sector</th>
                                    <th className="border-r border-black p-4 bg-slate-100 text-black">Zona</th>
                                    <th className="border-r border-black p-4 bg-slate-100 text-black">Fecha de Alta</th>
                                    <th className="border-r border-black p-4 bg-slate-100 text-black">Modificación</th>
                                    <th className="border-r border-black p-4 bg-slate-100 text-black">Revisión</th>
                                    <th className="border-r border-black p-4 bg-slate-100 text-black">Publicación</th>
                                    <th className="border-r border-black p-4 bg-primary text-white sticky right-0 z-40 shadow-[-10px_0_30px_rgba(0,0,0,0.15)] min-w-[220px]">
                                       Fecha de Suspensión / ACCIONES A REALIZAR
                                    </th>
                                    <th className="border-r border-black p-4 min-w-[800px] bg-slate-100 text-black text-left">Observaciones Históricas</th>
                                    <th className="p-4 bg-slate-100 text-black text-left">eContacto</th>
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
                                       <td className="border-r border-black p-4 text-slate-400 tabular-nums text-center text-[11px]">{rec.fechaAlta || '-'}</td>
                                       <td className="border-r border-black p-4 text-slate-400 tabular-nums text-center text-[11px]">{rec.fechaModif || '-'}</td>
                                       <td className="border-r border-black p-4 font-black text-slate-700 tabular-nums text-center text-[11px]">{rec.fechaRevision || '-'}</td>
                                       <td className="border-r border-black p-4 text-emerald-600 font-black tabular-nums text-center text-[11px]">{rec.date || '-'}</td>
                                       <td className="border-r border-black p-4 bg-white sticky right-0 z-30 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] backdrop-blur-md">
                                          <div className="flex flex-col gap-2 font-black text-primary underline underline-offset-4 text-left text-[10px] uppercase">
                                             {rec.fechaSuspension && <span className="text-rose-600 mb-2 no-underline font-black bg-rose-50 px-3 py-1 rounded-lg text-center">{rec.fechaSuspension}</span>}
                                             <button onClick={() => toast({title: "Revisar", description: `Validando integridad de ${rec.cct}`})} className="text-left hover:text-primary/70 transition-colors">Revisar</button>
                                             <button onClick={() => toast({title: "Publicar", description: `Migrando ${rec.cct} a producción...`})} className="text-left hover:text-primary/70 transition-colors">Publicar</button>
                                             <button onClick={() => toast({title: "Suspender", description: `Desactivando servicio para ${rec.cct}`})} className="text-left hover:text-primary/70 transition-colors">Suspender</button>
                                             <button onClick={() => toast({title: "Observaciones", description: "Cargando bitácora técnica..."})} className="text-left hover:text-primary/70 transition-colors">Observaciones</button>
                                             <button onClick={() => toast({title: "eContacto", description: `Vínculo: ${rec.email}`})} className="text-left hover:text-primary/70 transition-colors">eContacto</button>
                                             <button onClick={() => toast({title: "Contraseña", description: "Restableciendo accesos..."})} className="text-left hover:text-primary/70 transition-colors">Contraseña</button>
                                          </div>
                                       </td>
                                       <td className="border-r border-black p-6 text-slate-600 leading-relaxed text-justify text-[11px] italic font-medium bg-slate-50/30">
                                          <div className="max-h-[300px] overflow-y-auto pr-6">
                                             {rec.observaciones || 'SIN OBSERVACIONES REGISTRADAS EN EL CICLO VIGENTE.'}
                                          </div>
                                       </td>
                                       <td className="p-6 font-mono text-primary lowercase text-xs text-left font-bold">{rec.email || ''}</td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                           <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                     </div>
                  </div>
               </div>
             )}
          </TabsContent>
        </Tabs>

        <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
          <DialogContent className="sm:max-w-[450px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="bg-primary p-12 text-white text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
               <DialogTitle className="text-2xl font-black uppercase tracking-tighter relative z-10">Validación COEES</DialogTitle>
               <DialogDescription className="text-white/60 font-black text-[11px] uppercase tracking-[0.2em] mt-3 relative z-10">Auditoría de Incorporación Técnica</DialogDescription>
            </DialogHeader>
            <div className="p-10 space-y-8 bg-white">
               <div className="space-y-6">
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-slate-400 pl-4 tracking-widest">Identificador de Usuario</Label>
                     <Input placeholder="USUARIO" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value.toUpperCase()})} className="h-16 rounded-2xl bg-slate-50 border-none font-black px-8 shadow-inner" />
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-slate-400 pl-4 tracking-widest">Clave de Auditoría</Label>
                     <Input type="password" placeholder="••••••••" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} className="h-16 rounded-2xl bg-slate-50 border-none font-black px-8 shadow-inner" />
                  </div>
               </div>
               <button onClick={handleEditorialLogin} className="w-full h-20 rounded-[1.5rem] font-black uppercase bg-primary text-white shadow-2xl hover:scale-105 transition-all tracking-[0.3em] text-[12px]">
                  Acceder al Servidor
               </button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[1400px] h-[92vh] flex flex-col p-0 rounded-[3rem] overflow-hidden border-none shadow-[0_50px_100px_rgba(0,0,0,0.2)] bg-slate-50">
            <DialogHeader className="p-10 pb-6 border-b bg-white relative">
               <div className="absolute right-12 top-10 flex gap-4">
                  <div className="h-16 w-16 bg-primary/5 rounded-[1.5rem] flex items-center justify-center text-primary shadow-inner">
                     <Zap className="h-8 w-8" />
                  </div>
               </div>
               <DialogTitle className="text-3xl font-black uppercase text-primary tracking-tighter leading-none">
                  {formData.name === 'Cuentas Institucionales' ? 'Gestión de Identidad COEES' : (editingId ? 'Actualización Técnica' : 'Captura Estratégica')}
               </DialogTitle>
               <DialogDescription className="font-black text-[11px] uppercase text-muted-foreground tracking-[0.3em] mt-3">Sincronización de Datos en Tiempo Real</DialogDescription>
            </DialogHeader>

            <Tabs value={activeDialogTab} onValueChange={setActiveDialogTab} className="flex-1 flex flex-col overflow-hidden bg-white">
              <div className="px-10 border-b bg-white">
                <TabsList className="bg-transparent h-16 p-0 gap-10">
                  <TabsTrigger value="datos" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-6 text-[12px] font-black uppercase tracking-widest">
                    1. Ficha Técnica Operativa
                  </TabsTrigger>
                  {formData.name !== 'Cuentas Institucionales' && (
                    <TabsTrigger 
                      value="asistentes" 
                      disabled={formData.capacitacion !== 'S'}
                      className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-6 text-[12px] font-black uppercase tracking-widest disabled:opacity-20"
                    >
                      2. Registro de Asistentes (SIP)
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden bg-slate-50/50">
                <TabsContent value="datos" className="h-full m-0">
                  <ScrollArea className="h-full p-10">
                     <div className="max-w-6xl mx-auto space-y-12">
                        {formData.name === 'Cuentas Institucionales' ? (
                          <div className="space-y-12 animate-in fade-in duration-700">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="space-y-4">
                                   <Label className="text-[11px] font-black uppercase text-primary ml-4 tracking-widest">Centro de Trabajo (CCT)</Label>
                                   <Input 
                                      placeholder="15XXXXXX" 
                                      value={formData.cct} 
                                      onChange={e => {
                                         const val = e.target.value.toUpperCase();
                                         setFormData({...formData, cct: val});
                                         if (val.length === 10) {
                                            const s = schoolsDirectory.find(sh => sh.cct === val);
                                            if (s) {
                                               setFormData(prev => ({
                                                  ...prev,
                                                  cct: val,
                                                  valle: s.valle,
                                                  modalidad: s.modalidad,
                                                  sector: s.sectorNum,
                                                  zonaEscolar: s.zonaEscolar
                                               }));
                                            }
                                         }
                                      }} 
                                      maxLength={10} 
                                      className="h-16 rounded-2xl bg-white border-2 border-slate-100 font-black px-8 shadow-sm focus:border-primary" 
                                   />
                                </div>
                                <div className="space-y-4">
                                   <Label className="text-[11px] font-black uppercase text-primary ml-4 tracking-widest">Valle Territorial</Label>
                                   <Select value={formData.valle} onValueChange={v => setFormData({...formData, valle: v})}>
                                      <SelectTrigger className="h-16 rounded-2xl bg-white border-2 border-slate-100 font-black px-8"><SelectValue placeholder="VALLE" /></SelectTrigger>
                                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                                         <SelectItem value="MÉXICO" className="font-black uppercase">VALLE DE MÉXICO</SelectItem>
                                         <SelectItem value="TOLUCA" className="font-black uppercase">VALLE DE TOLUCA</SelectItem>
                                      </SelectContent>
                                   </Select>
                                </div>
                                <div className="space-y-4">
                                   <Label className="text-[11px] font-black uppercase text-primary ml-4 tracking-widest">Modalidad</Label>
                                   <Select value={formData.modalidad} onValueChange={v => setFormData({...formData, modalidad: v})}>
                                      <SelectTrigger className="h-16 rounded-2xl bg-white border-2 border-slate-100 font-black px-8"><SelectValue placeholder="MODALIDAD" /></SelectTrigger>
                                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                                         <SelectItem value="DES" className="font-black uppercase">DES (GENERAL)</SelectItem>
                                         <SelectItem value="DST" className="font-black uppercase">DST (TÉCNICA)</SelectItem>
                                         <SelectItem value="DTV" className="font-black uppercase">DTV (TELESEC.)</SelectItem>
                                      </SelectContent>
                                   </Select>
                                </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-10 bg-white rounded-[2.5rem] border-2 border-white shadow-xl">
                                <div className="space-y-4">
                                   <Label className="text-[11px] font-black uppercase text-primary ml-4 tracking-widest">Correo Institucional @COEES</Label>
                                   <Input 
                                      value={formData.asistentes?.[0]?.email || ''} 
                                      onChange={e => updateAssistantField(0, 'email', e.target.value.toLowerCase())} 
                                      className="h-16 bg-slate-50 border-none font-mono lowercase text-primary text-lg px-8 shadow-inner" 
                                      placeholder="ejemplo@desysa.gob.mx" 
                                   />
                                </div>
                                <div className="space-y-4">
                                   <Label className="text-[11px] font-black uppercase text-primary ml-4 tracking-widest">Nombre Completo del Titular</Label>
                                   <Input 
                                      value={formData.asistentes?.[0]?.nombres || ''} 
                                      onChange={e => updateAssistantField(0, 'nombres', e.target.value.toUpperCase())} 
                                      className="h-16 bg-slate-50 border-none font-black text-slate-800 px-8 shadow-inner" 
                                      placeholder="NOMBRE DEL RESPONSABLE" 
                                   />
                                </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="space-y-4">
                                   <Label className="text-[11px] font-black uppercase text-primary ml-4 tracking-widest">Sector</Label>
                                   <Input value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value})} className="h-16 rounded-2xl bg-white border-2 border-slate-100 font-black px-8" />
                                </div>
                                <div className="space-y-4">
                                   <Label className="text-[11px] font-black uppercase text-primary ml-4 tracking-widest">Zona Escolar</Label>
                                   <Input value={formData.zonaEscolar} onChange={e => setFormData({...formData, zonaEscolar: e.target.value})} className="h-16 rounded-2xl bg-white border-2 border-slate-100 font-black px-8" />
                                </div>
                                <div className="space-y-4">
                                   <Label className="text-[11px] font-black uppercase text-primary ml-4 tracking-widest">Estatus de Auditoría</Label>
                                   <Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val})}>
                                      <SelectTrigger className="h-16 rounded-2xl bg-slate-900 border-none font-black px-8 text-white shadow-2xl"><SelectValue /></SelectTrigger>
                                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                                         <SelectItem value="activo" className="text-[11px] font-black uppercase">ACTIVO</SelectItem>
                                         <SelectItem value="inactivo" className="text-[11px] font-black uppercase">INACTIVO</SelectItem>
                                      </SelectContent>
                                   </Select>
                                </div>
                             </div>
                          </div>
                        ) : (
                          <div className="space-y-12">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="space-y-4">
                                   <Label className="text-[11px] font-black uppercase text-primary ml-4 tracking-widest">CCT de Plantel</Label>
                                   <Input placeholder="15XXXXXX" value={formData.cct} onChange={e => setFormData({...formData, cct: e.target.value.toUpperCase()})} maxLength={10} className="h-16 rounded-2xl bg-white border-2 border-slate-100 font-black px-8 shadow-sm" />
                                </div>
                                <div className="space-y-4">
                                   <Label className="text-[11px] font-black uppercase text-primary ml-4 tracking-widest">Valle</Label>
                                   <Select value={formData.valle} onValueChange={v => setFormData({...formData, valle: v})}>
                                      <SelectTrigger className="h-16 rounded-2xl bg-white border-2 border-slate-100 font-black px-8"><SelectValue placeholder="VALLE" /></SelectTrigger>
                                      <SelectContent>
                                         <SelectItem value="MÉXICO" className="font-black uppercase">MÉXICO</SelectItem>
                                         <SelectItem value="TOLUCA" className="font-black uppercase">TOLUCA</SelectItem>
                                      </SelectContent>
                                   </Select>
                                </div>
                                <div className="space-y-4">
                                   <Label className="text-[11px] font-black uppercase text-primary ml-4 tracking-widest">Estatus Operativo</Label>
                                   <Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val})}>
                                      <SelectTrigger className="h-16 rounded-2xl bg-slate-900 border-none font-black px-8 text-white shadow-2xl"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                         <SelectItem value="planeacion" className="text-[11px] font-black uppercase">PLANEACIÓN</SelectItem>
                                         <SelectItem value="activo" className="text-[11px] font-black uppercase">ACTIVO</SelectItem>
                                         <SelectItem value="concluido" className="text-[11px] font-black uppercase">CONCLUIDO</SelectItem>
                                      </SelectContent>
                                   </Select>
                                </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-10 bg-white rounded-[2.5rem] border-2 border-white shadow-xl">
                                <div className="space-y-4">
                                   <Label className="text-[11px] font-black uppercase text-primary ml-4 tracking-widest">Número de Oficio SIP</Label>
                                   <Input value={formData.numeroOficio} onChange={e => setFormData({...formData, numeroOficio: e.target.value})} className="h-16 bg-slate-50 border-none font-black px-8 shadow-inner" placeholder="COEES/PL/000/2026" />
                                </div>
                                <div className="space-y-4">
                                   <Label className="text-[11px] font-black uppercase text-primary ml-4 tracking-widest">Semanas SETES</Label>
                                   <Select value={formData.setes} onValueChange={v => setFormData({...formData, setes: v as 'S' | 'N'})}>
                                      <SelectTrigger className="h-16 bg-slate-50 border-none font-black px-8 shadow-inner"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                         <SelectItem value="S" className="font-black uppercase">SÍ (PROGRAMADO)</SelectItem>
                                         <SelectItem value="N" className="font-black uppercase">NO (REGULAR)</SelectItem>
                                      </SelectContent>
                                   </Select>
                                </div>
                             </div>

                             <div className="flex items-center space-x-6 p-8 bg-primary/5 rounded-[2rem] border-2 border-primary/10 shadow-inner">
                                <div className="flex-1 space-y-2">
                                   <Label className="text-lg font-black uppercase text-primary tracking-tight">Capacitación Institucional</Label>
                                   <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">¿Este registro requiere validación de personal capacitado?</p>
                                </div>
                                <div className="flex items-center gap-6">
                                   <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{formData.capacitacion === 'S' ? 'ACTIVO' : 'INACTIVO'}</span>
                                   <Switch 
                                      className="data-[state=checked]:bg-primary"
                                      checked={formData.capacitacion === 'S'} 
                                      onCheckedChange={(val) => {
                                         const newVal = val ? 'S' : 'N';
                                         setFormData({...formData, capacitacion: newVal});
                                         if (!val) setActiveDialogTab('datos');
                                      }} 
                                   />
                                </div>
                             </div>

                             {formData.capacitacion === 'S' && (
                                <div className="space-y-10 animate-in slide-in-from-top-10 duration-700 p-10 bg-white rounded-[3rem] border-4 border-slate-50 shadow-2xl">
                                   <h4 className="text-xl font-black uppercase text-primary border-b-4 border-primary/10 pb-4 flex items-center gap-4">
                                      <GraduationCap className="h-8 w-8" /> Gestión de Curso e Instructores Ponentes
                                   </h4>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                      <div className="space-y-4">
                                         <Label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-4">Nombre del Programa Formativo</Label>
                                         <Input value={formData.cursoNombre} onChange={e => setFormData({...formData, cursoNombre: e.target.value})} className="h-14 bg-slate-50 border-none px-8 font-black" />
                                      </div>
                                      <div className="space-y-4">
                                         <Label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-4">Grupo de Atención</Label>
                                         <Input value={formData.cursoGrupo} onChange={e => setFormData({...formData, cursoGrupo: e.target.value})} className="h-14 bg-slate-50 border-none px-8 font-black" />
                                      </div>
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                      <div className="space-y-4">
                                         <Label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-4">Duración (Horas)</Label>
                                         <div className="relative">
                                         <Input type="number" value={formData.duracionHoras} onChange={e => setFormData({...formData, duracionHoras: parseInt(e.target.value) || 0})} className="h-14 bg-slate-50 border-none pl-12 font-black" />
                                         <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                                         </div>
                                      </div>
                                      <div className="space-y-4">
                                         <Label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-4">Fecha Inicio</Label>
                                         <div className="relative">
                                         <Input type="date" value={formData.fechaInicio} onChange={e => setFormData({...formData, fechaInicio: e.target.value})} className="h-14 bg-slate-50 border-none pl-12 font-black" />
                                         <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                                         </div>
                                      </div>
                                      <div className="space-y-4">
                                         <Label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-4">Fecha Término</Label>
                                         <div className="relative">
                                         <Input type="date" value={formData.fechaTermino} onChange={e => setFormData({...formData, fechaTermino: e.target.value})} className="h-14 bg-slate-50 border-none pl-12 font-black" />
                                         <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                                         </div>
                                      </div>
                                      <div className="space-y-4">
                                         <Label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-4">CCT Sede</Label>
                                         <Input value={formData.cctSede} onChange={e => setFormData({...formData, cctSede: e.target.value.toUpperCase()})} className="h-14 bg-slate-50 border-none px-8 font-mono font-black" placeholder="15DESXXXXX" maxLength={10} />
                                      </div>
                                   </div>
                                </div>
                             )}
                          </div>
                        )}

                        <div className="space-y-4 pt-10 border-t-2 border-slate-100">
                           <Label className="text-[11px] font-black uppercase text-primary ml-4 tracking-widest flex items-center gap-3">
                             <ListFilter className="h-4 w-4" /> Bitácora Técnica de Observaciones
                           </Label>
                           <Textarea value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} className="min-h-[160px] rounded-[2rem] border-2 border-slate-100 p-8 text-sm font-medium focus:border-primary shadow-sm" placeholder="Escriba aquí los detalles técnicos del servicio..." />
                        </div>
                     </div>
                  </ScrollArea>
                </TabsContent>

                {formData.name !== 'Cuentas Institucionales' && (
                  <TabsContent value="asistentes" className="h-full m-0 flex flex-col bg-white">
                    <div className="p-10 pb-6 flex justify-between items-center bg-slate-50 border-b">
                      <div className="p-6 bg-white border-2 border-primary/10 rounded-[2rem] flex items-center gap-6 flex-1 mr-10 shadow-xl shadow-slate-100">
                        <div className="h-12 w-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <p className="text-[12px] font-black text-slate-700 uppercase tracking-widest leading-relaxed">
                          Captura nominal de asistentes. El sistema autocompleta los datos geográficos mediante el CCT.
                        </p>
                      </div>
                      <Button onClick={handleAddAssistantRow} className="btn-institutional px-10">
                        <Plus className="h-5 w-5 mr-3" /> Añadir Asistente
                      </Button>
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <ScrollArea className="h-full">
                        <table className="table-institutional min-w-[1200px]">
                          <thead className="sticky top-0 z-20 bg-slate-900 text-white shadow-xl">
                            <tr>
                              <th className="w-16 py-6 border-r border-white/10">#</th>
                              <th className="min-w-[250px] text-left px-8 py-6 border-r border-white/10">Personal Capacitado</th>
                              <th className="min-w-[180px] py-6 border-r border-white/10">RFC</th>
                              <th className="min-w-[220px] py-6 border-r border-white/10">Función Oficial</th>
                              <th className="min-w-[160px] py-6 border-r border-white/10">CCT de Origen</th>
                              <th className="min-w-[280px] text-left px-8 py-6">Datos de Plantel / Zona</th>
                              <th className="w-20"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(formData.asistentes || []).map((ast, idx) => (
                              <TableRow key={idx} className="hover:bg-slate-50 transition-all bg-white">
                                <TableCell className="text-center font-black text-xs text-muted-foreground border-r border-slate-50">{idx + 1}</TableCell>
                                <TableCell className="p-4 border-r border-slate-50">
                                  <div className="flex flex-col gap-2">
                                    <Input placeholder="Apellidos" className="h-10 text-[11px] font-bold rounded-xl" value={`${ast.paterno} ${ast.materno}`} onChange={e => {
                                      const parts = e.target.value.split(' ');
                                      updateAssistantField(idx, 'paterno', parts[0] || '');
                                      updateAssistantField(idx, 'materno', parts.slice(1).join(' ') || '');
                                    }} />
                                    <Input placeholder="Nombre(s)" className="h-10 text-[11px] font-black text-primary rounded-xl" value={ast.nombres} onChange={e => updateAssistantField(idx, 'nombres', e.target.value)} />
                                  </div>
                                </TableCell>
                                <TableCell className="p-4 border-r border-slate-50">
                                  <Input placeholder="RFC" className="h-12 text-[11px] font-mono font-black uppercase text-center rounded-xl" value={ast.rfc} onChange={e => updateAssistantField(idx, 'rfc', e.target.value.toUpperCase())} maxLength={13} />
                                </TableCell>
                                <TableCell className="p-4 border-r border-slate-50">
                                  <Select value={ast.funcion} onValueChange={(val: any) => updateAssistantField(idx, 'funcion', val)}>
                                    <SelectTrigger className="h-12 text-[11px] font-black rounded-xl">
                                      <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-none shadow-2xl">
                                      {FUNCIONES.map(f => (
                                        <SelectItem key={f} value={f} className="text-[11px] font-black">{f}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell className="p-4 border-r border-slate-50">
                                  <Input placeholder="15DESXXXXX" className="h-12 text-[11px] font-mono font-black uppercase text-center border-primary/20 rounded-xl" value={ast.cct} onChange={e => updateAssistantField(idx, 'cct', e.target.value.toUpperCase())} maxLength={10} />
                                </TableCell>
                                <TableCell className="p-4 px-8 text-left">
                                  <div className="flex flex-col gap-2">
                                    <Badge className="bg-slate-50 text-slate-400 border-none font-black text-[9px] uppercase px-4 py-1.5 rounded-lg truncate max-w-[200px]">{ast.nombreCT || 'PLANEL PENDIENTE'}</Badge>
                                    <Badge className="bg-accent/5 text-accent border-none font-black text-[9px] uppercase px-4 py-1.5 rounded-lg w-fit">Zona: {ast.ze || 'S/Z'}</Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="p-4">
                                  <Button variant="ghost" size="icon" className="h-12 w-12 text-rose-500 hover:bg-rose-50 rounded-2xl" onClick={() => handleRemoveAssistantRow(idx)} disabled={(formData.asistentes?.length || 0) <= 1}>
                                    <Trash2 className="h-6 w-6" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </tbody>
                        </table>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    </div>
                  </TabsContent>
                )}
              </div>
            </Tabs>

            <DialogFooter className="p-10 bg-white border-t-2 border-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Servidor Activo • Edoméx 2026</span>
               </div>
               <div className="flex gap-6">
                 <Button variant="outline" onClick={() => { setIsDialogOpen(false); setFormData(initialFormState); setActiveDialogTab('datos'); }} className="h-16 px-12 rounded-2xl font-black uppercase text-[11px] tracking-widest border-2 border-slate-100 bg-white hover:bg-slate-50">Cancelar</Button>
                 <Button onClick={handleSave} className="h-16 px-16 rounded-2xl font-black uppercase text-[11px] bg-primary text-white shadow-2xl shadow-primary/30 tracking-[0.2em] transition-all hover:scale-[1.03]">Finalizar Captura</Button>
               </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}