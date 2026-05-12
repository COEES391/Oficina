
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
import Image from 'next/image'

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

const DB_VERSION = "827_full_sync_v42_final_filters";

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

  // Cuentas Institucionales Filters
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
    
    const storedVersion = localStorage.getItem('programs_db_version_v42')
    if (storedVersion !== DB_VERSION) {
      setRecords(programsData)
      localStorage.setItem('programs_full', JSON.stringify(programsData))
      localStorage.setItem('programs_db_version_v42', DB_VERSION)
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
      toast({ title: "Acceso Concedido", description: "Bienvenido a la Sección Editorial." })
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
  const ciRecords = useMemo(() => records.filter(r => r.name === 'Cuentas Institucionales' || r.id.startsWith('PROG-CI') || r.name?.includes('Cuentas')), [records]);
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
    const approved = filtered.filter(r => r.status === 'concluido').length;
    return {
      filtered,
      total: filtered.length,
      usagePercent: filtered.length > 0 ? Math.round((approved / filtered.length) * 100) : 0,
      pieData: [
        { name: 'ACTIVO', value: approved, fill: '#10b981' },
        { name: 'PLANEACIÓN', value: Math.max(0, filtered.length - approved), fill: '#f43f5e' }
      ],
      barData: [
        { name: 'APROBADO', value: approved, fill: '#621132' },
        { name: 'PENDIENTE', value: Math.max(0, filtered.length - approved), fill: '#cbd5e1' }
      ]
    };
  }, [ciRecords, valFilter, modFilter, domFilter]);

  if (!mounted) return null

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase">Módulos de Planeación</h2>
          <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Activity className="h-3 w-3 text-accent" /> Programas Estratégicos COEES
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="w-full h-auto flex flex-wrap bg-slate-100/50 p-1 rounded-2xl shadow-inner border border-primary/5">
          {PROGRAM_RUBROS.map(rubro => (
            <TabsTrigger key={rubro} value={rubro} className="flex-1 min-w-[150px] h-12 text-[10px] font-black uppercase rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">
              {rubro === 'Geoposición' && <MapPin className="h-3.5 w-3.5 mr-2" />}
              {rubro === 'Biblioteca Digital' && <Monitor className="h-3.5 w-3.5 mr-2" />}
              {rubro === 'Cuentas Institucionales' && <Globe className="h-3.5 w-3.5 mr-2" />}
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
                <PlusCircle className="h-4 w-4" /> Nueva Captura de Programa
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
                       <TableHead className="font-black text-[10px] uppercase text-right pr-8">ACCIONES</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {bdRecords.length > 0 ? bdRecords.map(rec => (
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
                            <div className="flex justify-end gap-2">
                               <button onClick={() => {setFormData(rec); setEditingId(rec.id); setIsDialogOpen(true);}} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><Pencil className="h-4 w-4" /></button>
                               <button onClick={() => setRecords(records.filter(r => r.id !== rec.id))} className="p-2 hover:bg-rose-50 rounded-lg text-rose-500"><Trash2 className="h-4 w-4" /></button>
                            </div>
                         </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground font-black uppercase text-[10px]">Sin registros en Biblioteca Digital</TableCell></TableRow>
                    )}
                 </TableBody>
               </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Cuentas Institucionales" className="space-y-8">
           <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center shadow-lg"><Globe className="h-6 w-6 text-white" /></div>
                   <div>
                      <h2 className="text-2xl font-black text-primary uppercase leading-none">Herramienta de Monitoreo</h2>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Análisis Integral de Cuentas SEIEM</p>
                   </div>
                </div>
                <Button onClick={() => { setFormData({...initialFormState, name: 'Cuentas Institucionales', id: `PROG-CI-${Date.now()}`}); setEditingId(null); setIsDialogOpen(true); }} className="gap-2 font-black uppercase shadow-md bg-primary">
                   <PlusCircle className="h-4 w-4" /> Agregar Nueva Cuenta
                </Button>
             </div>

             <Tabs value={ciActiveInternalTab} onValueChange={setCiActiveInternalTab} className="w-full">
                <TabsList className="bg-slate-100/50 p-1 rounded-xl mb-6">
                   <TabsTrigger value="analitica" className="gap-2 text-[10px] font-black uppercase"><BarChart3 className="h-3.5 w-3.5" /> Analítica</TabsTrigger>
                   <TabsTrigger value="registros" className="gap-2 text-[10px] font-black uppercase"><ListFilter className="h-3.5 w-3.5" /> Listado de Registros</TabsTrigger>
                </TabsList>

                <TabsContent value="analitica" className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-3">
                         <Card className="p-5 bg-white border rounded-2xl shadow-sm space-y-6">
                            <div>
                               <Label className="text-[9px] font-black uppercase text-primary mb-3 block">VALLE</Label>
                               <div className="flex flex-col gap-1.5">
                                  <Button variant={valFilter === 'all' ? 'default' : 'outline'} size="sm" className="h-9 text-[9px] font-black justify-start" onClick={() => setValFilter('all')}>AMBOS VALLES</Button>
                                  <Button variant={valFilter === 'MÉXICO' ? 'default' : 'outline'} size="sm" className="h-9 text-[9px] font-black justify-start" onClick={() => setValFilter('MÉXICO')}>VALLE DE MÉXICO</Button>
                                  <Button variant={valFilter === 'TOLUCA' ? 'default' : 'outline'} size="sm" className="h-9 text-[9px] font-black justify-start" onClick={() => setValFilter('TOLUCA')}>VALLE DE TOLUCA</Button>
                               </div>
                            </div>
                            
                            <div>
                               <Label className="text-[9px] font-black uppercase text-primary mb-3 block">MODALIDAD</Label>
                               <Select value={modFilter} onValueChange={setModFilter}>
                                  <SelectTrigger className="h-10 text-[10px] font-black"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                     <SelectItem value="all" className="text-[10px] font-black">TODAS</SelectItem>
                                     <SelectItem value="DES" className="text-[10px] font-black">DES (GENERAL)</SelectItem>
                                     <SelectItem value="DST" className="text-[10px] font-black">DST (TÉCNICA)</SelectItem>
                                     <SelectItem value="DTV" className="text-[10px] font-black">DTV (TELESEC.)</SelectItem>
                                  </SelectContent>
                               </Select>
                            </div>

                            <div>
                               <Label className="text-[9px] font-black uppercase text-primary mb-3 block">DOMINIO</Label>
                               <Select value={domFilter} onValueChange={setDomFilter}>
                                  <SelectTrigger className="h-10 text-[10px] font-black"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                     <SelectItem value="all" className="text-[10px] font-black">TODOS</SelectItem>
                                     <SelectItem value="@desysa.gob.mx" className="text-[10px] font-black">@desysa.gob.mx</SelectItem>
                                     <SelectItem value="@desysa.edu.mx" className="text-[10px] font-black">@desysa.edu.mx</SelectItem>
                                     <SelectItem value="@coees.edu.mx" className="text-[10px] font-black">@coees.edu.mx</SelectItem>
                                  </SelectContent>
                               </Select>
                            </div>
                         </Card>
                      </div>

                      <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-6">
                         <Card className="p-8 flex flex-col items-center justify-center bg-white shadow-sm rounded-2xl border">
                            <span className="text-[10px] font-black text-slate-400 uppercase mb-2">Cuentas Filtradas</span>
                            <div className="text-6xl font-black text-slate-800 tracking-tighter">{ciDashboardData.total}</div>
                         </Card>

                         <Card className="p-6 flex flex-col items-center bg-white shadow-sm rounded-2xl border">
                            <Label className="text-[10px] font-black text-slate-400 mb-4 uppercase">% USO ACTIVO</Label>
                            <div className="relative h-[160px] w-full">
                               <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                     <Pie data={ciDashboardData.pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value">
                                        {ciDashboardData.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                     </Pie>
                                  </PieChart>
                               </ResponsiveContainer>
                               <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-2xl font-black text-primary">{ciDashboardData.usagePercent}%</span>
                               </div>
                            </div>
                         </Card>

                         <Card className="p-6 bg-white shadow-sm rounded-2xl border">
                            <Label className="text-[10px] font-black text-slate-400 mb-6 uppercase block">ESTATUS OPERATIVO</Label>
                            <div className="h-[180px]">
                               <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={ciDashboardData.barData}>
                                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                     <XAxis dataKey="name" tick={{ fontSize: 8, fontWeight: 900 }} axisLine={false} tickLine={false} />
                                     <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={35}>
                                        {ciDashboardData.barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                     </Bar>
                                  </BarChart>
                               </ResponsiveContainer>
                            </div>
                         </Card>
                      </div>
                   </div>
                </TabsContent>

                <TabsContent value="registros" className="animate-in fade-in duration-300">
                   <Card className="executive-card">
                      <div className="overflow-x-auto">
                         <Table>
                            <TableHeader className="bg-slate-100/50">
                               <TableRow>
                                  <TableHead className="font-black text-[9px] uppercase pl-8 py-5"># / CCT</TableHead>
                                  <TableHead className="font-black text-[9px] uppercase">MODALIDAD / VALLE</TableHead>
                                  <TableHead className="font-black text-[9px] uppercase">CORREO INSTITUCIONAL</TableHead>
                                  <TableHead className="font-black text-[9px] uppercase text-right pr-8">ACCIONES</TableHead>
                               </TableRow>
                            </TableHeader>
                            <TableBody>
                               {ciDashboardData.filtered.length > 0 ? ciDashboardData.filtered.map((rec) => (
                                  <TableRow key={rec.id} className="text-[10px] font-bold hover:bg-slate-50 border-slate-100">
                                     <TableCell className="pl-8 py-4 text-primary font-black uppercase">{rec.cct || rec.id}</TableCell>
                                     <TableCell>
                                        <div className="flex flex-col">
                                           <span className="uppercase text-[9px] font-black text-slate-700">{rec.modalidad}</span>
                                           <span className="uppercase text-[8px] text-slate-400">{rec.valle}</span>
                                        </div>
                                     </TableCell>
                                     <TableCell className="font-mono text-blue-600 lowercase">{rec.asistentes?.[0]?.email || '-'}</TableCell>
                                     <TableCell className="text-right pr-8">
                                        <div className="flex justify-end gap-2">
                                           <button onClick={() => {setFormData(rec); setEditingId(rec.id); setIsDialogOpen(true);}} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><Pencil className="h-4 w-4" /></button>
                                           <button onClick={() => setRecords(records.filter(r => r.id !== rec.id))} className="p-2 hover:bg-rose-50 rounded-lg text-rose-500"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                     </TableCell>
                                  </TableRow>
                               )) : (
                                 <TableRow><TableCell colSpan={4} className="text-center py-10 font-black uppercase text-[10px]">No se encontraron cuentas con los filtros seleccionados</TableCell></TableRow>
                               )}
                            </TableBody>
                         </Table>
                      </div>
                   </Card>
                </TabsContent>
             </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="Geoposición" className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { title: 'Geocodificados', value: geoRecords.length.toLocaleString(), icon: <MapPin className="h-6 w-6" />, color: 'bg-orange-500' },
                { title: 'Cobertura', value: '82%', icon: <Activity className="h-6 w-6" />, color: 'bg-emerald-500' },
                { title: 'Zonas Auditadas', value: '45', icon: <Building2 className="h-6 w-6" />, color: 'bg-blue-500' },
                { title: 'Alertas', value: '0', icon: <Activity className="h-6 w-6" />, color: 'bg-rose-500' },
              ].map((item, i) => (
                <Card key={i} className="executive-card p-8">
                  <div className={`h-12 w-12 ${item.color} text-white rounded-2xl flex items-center justify-center shadow-lg mb-4`}>
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.title}</span>
                  <div className="text-4xl font-black text-slate-800 mt-2">{item.value}</div>
                </Card>
              ))}
           </div>
           
           <Card className="executive-card overflow-hidden">
              <CardHeader className="p-8 border-b bg-slate-50/50">
                 <CardTitle className="text-sm font-black uppercase text-primary flex items-center gap-3">
                   <MapPin className="h-5 w-5" /> Auditoría Territorial por Centro de Trabajo
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                 <Table>
                    <TableHeader className="bg-slate-100/50">
                       <TableRow>
                          <TableHead className="font-black text-[9px] pl-8">CCT / NOMBRE</TableHead>
                          <TableHead className="font-black text-[9px]">VALLE</TableHead>
                          <TableHead className="font-black text-[9px]">COORDENADAS (LAT/LON)</TableHead>
                          <TableHead className="font-black text-[9px] text-right pr-8">ESTATUS GEO</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {geoRecords.map(rec => (
                          <TableRow key={rec.id} className="text-[10px] font-bold border-slate-100">
                             <TableCell className="pl-8">
                                <div className="flex flex-col">
                                   <span className="text-primary font-black uppercase">{rec.cct}</span>
                                   <span className="text-slate-400 text-[9px] uppercase">{rec.schoolName || '-'}</span>
                                </div>
                             </TableCell>
                             <TableCell className="uppercase">{rec.valle}</TableCell>
                             <TableCell className="font-mono text-slate-600">{rec.observaciones?.split('Lat:')[1] || 'PENDIENTE'}</TableCell>
                             <TableCell className="text-right pr-8">
                                <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black">VERIFICADO</Badge>
                             </TableCell>
                          </TableRow>
                       ))}
                    </TableBody>
                 </Table>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="Conoce mi Escuela" className="animate-in fade-in duration-500">
           {!isEditorialUser ? (
             <div className="bg-white shadow-2xl border border-slate-200 rounded-lg overflow-hidden max-w-5xl mx-auto font-sans">
              <div className="bg-white p-8 border-b-8 border-primary relative">
                 <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-bold text-emerald-800 uppercase tracking-tight leading-tight">Dirección de Educación Secundaria y Servicios de Apoyo</h1>
                    <p className="text-sm font-medium text-slate-500">Servicios Educativos Integrados al Estado de México</p>
                 </div>
              </div>

              <div className="p-12 space-y-10 relative">
                 <div className="flex justify-end">
                    <p className="text-[11px] font-bold text-rose-800 uppercase">
                       {format(new Date(), "eeee d 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                 </div>

                 <div className="flex items-center gap-4 mb-8">
                    <div className="h-8 w-12 flex flex-col border border-slate-300">
                       <div className="flex-1 bg-[#006847]" />
                       <div className="flex-1 bg-white" />
                       <div className="flex-1 bg-[#CE1126]" />
                    </div>
                    <h2 className="text-2xl font-bold text-rose-800 uppercase tracking-tighter">Conoce mi escuela</h2>
                 </div>

                 <div className="space-y-6 text-[15px] leading-relaxed text-slate-800 text-justify">
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

                 <div className="pt-10 space-y-5 max-w-md">
                    <div className="group flex items-center gap-4 cursor-pointer" onClick={() => setIsLoginDialogOpen(true)}>
                       <div className="h-2.5 w-2.5 rounded-full border-2 border-slate-400 group-hover:bg-primary group-hover:border-primary transition-colors" />
                       <span className="text-[15px] font-bold text-slate-700 underline underline-offset-4 group-hover:text-primary transition-colors">Incorporación</span>
                    </div>
                 </div>
              </div>

              <div className="bg-slate-50 border-t p-10 flex flex-col items-center text-center space-y-4">
                 <div className="space-y-1 text-[11px] font-bold text-slate-600 uppercase leading-tight tracking-wide">
                    <p>Gobierno del Estado de México</p>
                    <p>Secretaría de Educación</p>
                    <p>Servicios Educativos Integrados al Estado de México</p>
                    <p>Dirección de Educación Secundaria y Servicios de Apoyo</p>
                 </div>
              </div>
           </div>
           ) : (
             <div className="space-y-4 animate-in fade-in duration-500 bg-white min-h-screen p-10 border shadow-inner rounded-3xl">
                <div className="text-center py-6 border-b-2 border-slate-100">
                   <h1 className="text-xl font-bold text-[#4a773c] uppercase leading-tight">Dirección de Educación Secundaria y Servicios de Apoyo</h1>
                   <p className="text-sm text-slate-600 font-semibold">Servicios Educativos Integrados al Estado de México</p>
                </div>

                <div className="py-6">
                   <div className="flex justify-between items-start mb-6">
                      <div className="space-y-2 max-w-3xl">
                        <h2 className="text-lg font-bold text-slate-800">Bienvenido a la Sección Editorial de WebEscuela</h2>
                        <p className="text-[11px] text-slate-600 leading-relaxed text-justify">
                           En esta página se encuentra la lista de las escuelas que han colocado su información en WebEscuela, Ud. puede revisar la información de cada una de ellas, editarla y, posteriormente, publicarla en el Servidor o suspenderla.
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                         <button 
                            onClick={() => { setIsEditorialUser(false); localStorage.removeItem('userRfc'); setUserRfc(null); setActiveDialogTab('datos'); }}
                            className="bg-slate-100 border-2 border-slate-300 px-8 py-2 text-[11px] font-black uppercase rounded shadow-sm hover:bg-slate-200 transition-colors"
                         >
                            Cerrar
                         </button>
                         <Badge variant="outline" className="text-[9px] font-black border-primary/20 text-primary uppercase">Registros en Servidor: {editorialRecords.length}</Badge>
                      </div>
                   </div>
                   
                   <div className="border border-black w-full h-[650px] relative overflow-hidden">
                      <ScrollArea className="h-full w-full">
                         <Table className="border-collapse text-[10px] min-w-[3500px]">
                            <TableHeader className="bg-slate-100">
                               <TableRow className="border-b border-black">
                                  <TableHead className="border-r border-black p-2 w-10 text-center font-black">No.</TableHead>
                                  <TableHead 
                                    className="border-r border-black p-2 cursor-pointer hover:bg-slate-200 transition-colors group select-none font-black"
                                    onClick={() => setSortConfig(p => ({ key: 'cct', direction: p.direction === 'asc' ? 'desc' : 'asc' }))}
                                  >
                                    <div className="flex items-center gap-2 uppercase">
                                       Centro de Trabajo
                                       {sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : sortConfig.direction === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                    </div>
                                  </TableHead>
                                  <TableHead className="border-r border-black p-2 font-black uppercase">Agrupado</TableHead>
                                  <TableHead className="border-r border-black p-2 font-black uppercase text-center">Vertiente</TableHead>
                                  <TableHead className="border-r border-black p-2 font-black uppercase text-center">Sector</TableHead>
                                  <TableHead className="border-r border-black p-2 font-black uppercase text-center">Zona</TableHead>
                                  <TableHead className="border-r border-black p-2 font-black uppercase text-center whitespace-nowrap">Fecha de Alta</TableHead>
                                  <TableHead className="border-r border-black p-2 font-black uppercase text-center whitespace-nowrap">Fecha de Modificación</TableHead>
                                  <TableHead className="border-r border-black p-2 font-black uppercase text-center whitespace-nowrap">Fecha de Revisión</TableHead>
                                  <TableHead className="border-r border-black p-2 font-black uppercase text-center whitespace-nowrap">Fecha de Publicación</TableHead>
                                  <TableHead className="border-r border-black p-2 font-black uppercase text-center whitespace-nowrap bg-rose-50 text-rose-800">Fecha de Suspensión / ACCIONES</TableHead>
                                  <TableHead className="border-r border-black p-2 min-w-[600px] font-black uppercase">Observaciones</TableHead>
                                  <TableHead className="p-2 font-black uppercase">eContacto</TableHead>
                               </TableRow>
                            </TableHeader>
                            <TableBody>
                               {editorialRecords.map((rec, idx) => (
                                  <TableRow key={rec.id} className="border-b border-black hover:bg-slate-50 align-top">
                                     <TableCell className="border-r border-black p-2 text-center font-bold">{idx + 1}</TableCell>
                                     <TableCell className="border-r border-black p-2 font-black uppercase text-slate-800">{rec.cct}</TableCell>
                                     <TableCell className="border-r border-black p-2 font-mono text-slate-500 uppercase">{rec.agrupado || '-'}</TableCell>
                                     <TableCell className="border-r border-black p-2 text-center uppercase">{rec.vertiente || '-'}</TableCell>
                                     <TableCell className="border-r border-black p-2 text-center font-bold">{rec.sector || '-'}</TableCell>
                                     <TableCell className="border-r border-black p-2 text-center font-bold">{rec.zonaEscolar || '-'}</TableCell>
                                     <TableCell className="border-r border-black p-2 text-slate-400 tabular-nums text-center">{rec.fechaAlta || '-'}</TableCell>
                                     <TableCell className="border-r border-black p-2 text-slate-400 tabular-nums text-center">{rec.fechaModif || '-'}</TableCell>
                                     <TableCell className="border-r border-black p-2 font-black text-slate-700 tabular-nums text-center">{rec.fechaRevision || '-'}</TableCell>
                                     <TableCell className="border-r border-black p-2 text-emerald-700 font-black tabular-nums text-center">{rec.date || '-'}</TableCell>
                                     <TableCell className="border-r border-black p-2 bg-rose-50/30 min-w-[180px]">
                                        <div className="flex flex-col gap-1 font-black text-blue-700 underline underline-offset-2 text-left text-[10px] uppercase">
                                           <button onClick={() => toast({title: "Revisar", description: `Iniciando revisión de ${rec.cct}`})} className="text-left hover:text-blue-900 w-fit">Revisar</button>
                                           <button onClick={() => toast({title: "Publicar", description: `Publicando ${rec.cct} en el servidor...`})} className="text-left hover:text-blue-900 w-fit">Publicar</button>
                                           <button onClick={() => toast({title: "Suspender", description: `Suspendiendo portal de ${rec.cct}`})} className="text-left hover:text-blue-900 w-fit">Suspender</button>
                                           <button onClick={() => toast({title: "Observaciones", description: "Abriendo bitácora técnica..."})} className="text-left hover:text-blue-900 w-fit">Observaciones</button>
                                           <button onClick={() => toast({title: "eContacto", description: `Email: ${rec.email}`})} className="text-left hover:text-blue-900 w-fit">eContacto</button>
                                           <button onClick={() => toast({title: "Contraseña", description: "Generando nueva clave institucional..."})} className="text-left hover:text-blue-900 w-fit">Contraseña</button>
                                           {rec.fechaSuspension && <span className="text-rose-600 mt-1 pt-1 border-t border-rose-200 block no-underline">{rec.fechaSuspension}</span>}
                                        </div>
                                     </TableCell>
                                     <TableCell className="border-r border-black p-2 text-slate-600 leading-tight text-justify pr-4 text-[9px]">
                                        <div className="max-h-[150px] overflow-y-auto italic">
                                           {rec.observaciones || ''}
                                        </div>
                                     </TableCell>
                                     <TableCell className="p-2 font-mono text-blue-800 lowercase">{rec.email || ''}</TableCell>
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
        </TabsContent>
      </Tabs>

      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-primary p-8 text-white text-center">
             <DialogTitle className="text-xl font-black uppercase tracking-tighter">Acceso Editorial WebEscuela</DialogTitle>
             <DialogDescription className="text-white/70 font-bold text-[10px] uppercase">Sección de Incorporación y Auditoría Técnica</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6 bg-white">
             <div className="space-y-4">
                <div className="space-y-2">
                   <Label className="text-[9px] font-black uppercase text-slate-400 pl-2">Usuario Administrador</Label>
                   <Input placeholder="USUARIO" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value.toUpperCase()})} className="h-14 rounded-2xl bg-slate-50 border-none font-black px-6 shadow-inner" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[9px] font-black uppercase text-slate-400 pl-2">Clave Institucional</Label>
                   <Input type="password" placeholder="CONTRASEÑA" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none font-black px-6 shadow-inner" />
                </div>
             </div>
             <button onClick={handleEditorialLogin} className="w-full h-16 rounded-2xl font-black uppercase bg-primary text-white shadow-xl hover:scale-[1.02] transition-transform tracking-widest text-[11px]">
                Validar Credenciales
             </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[1400px] h-[90vh] flex flex-col p-0 rounded-[2.5rem] overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 pb-4 border-b bg-slate-50">
             <DialogTitle className="text-2xl font-black uppercase text-primary tracking-tighter">
                {editingId ? 'Actualización de Registro Técnico' : 'Nueva Captura de Programa'}
             </DialogTitle>
             <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground tracking-widest mt-1">Gestión de Información y Capacitación Institucional</DialogDescription>
          </DialogHeader>

          <Tabs value={activeDialogTab} onValueChange={setActiveDialogTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-8 border-b bg-white">
              <TabsList className="bg-transparent h-12 p-0 gap-8">
                <TabsTrigger value="datos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-4 text-[11px] font-black uppercase tracking-wider">1. Datos del Programa / Curso</TabsTrigger>
                <TabsTrigger 
                  value="asistentes" 
                  disabled={formData.capacitacion !== 'S'}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-4 text-[11px] font-black uppercase tracking-wider disabled:opacity-30 disabled:grayscale"
                >
                  2. Lista de Asistentes (Captura Directa)
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="datos" className="h-full m-0">
                <ScrollArea className="h-full p-8">
                   <div className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-primary ml-2">CCT / Clave de Plantel</Label>
                            <Input placeholder="15XXXXXX" value={formData.cct} onChange={e => setFormData({...formData, cct: e.target.value.toUpperCase()})} maxLength={10} className="h-14 rounded-2xl bg-white border-2 border-slate-100 font-black px-6" />
                         </div>
                         <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-primary ml-2">Valle de Atención</Label>
                            <Select value={formData.valle} onValueChange={v => setFormData({...formData, valle: v})}>
                               <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-black px-6"><SelectValue placeholder="VALLE" /></SelectTrigger>
                               <SelectContent>
                                  <SelectItem value="MÉXICO" className="font-black uppercase">MÉXICO</SelectItem>
                                  <SelectItem value="TOLUCA" className="font-black uppercase">TOLUCA</SelectItem>
                               </SelectContent>
                            </Select>
                         </div>
                         <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-primary ml-2">Estatus Operativo</Label>
                            <Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val})}>
                              <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-black px-6"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="planeacion" className="text-[10px] font-black uppercase">PLANEACIÓN</SelectItem>
                                 <SelectItem value="activo" className="text-[10px] font-black uppercase">ACTIVO</SelectItem>
                                 <SelectItem value="concluido" className="text-[10px] font-black uppercase">CONCLUIDO</SelectItem>
                              </SelectContent>
                            </Select>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-50 rounded-3xl border-2 border-slate-100">
                         <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-primary ml-2">Número de Oficio</Label>
                            <Input value={formData.numeroOficio} onChange={e => setFormData({...formData, numeroOficio: e.target.value})} className="h-12 bg-white" placeholder="DESySA/PL/000/2024" />
                         </div>
                         <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-primary ml-2">Semana SETES</Label>
                            <Select value={formData.setes} onValueChange={v => setFormData({...formData, setes: v as 'S' | 'N'})}>
                               <SelectTrigger className="h-12 bg-white font-black px-6"><SelectValue /></SelectTrigger>
                               <SelectContent>
                                  <SelectItem value="S" className="font-black uppercase">SÍ</SelectItem>
                                  <SelectItem value="N" className="font-black uppercase">NO</SelectItem>
                               </SelectContent>
                            </Select>
                         </div>
                      </div>

                      <div className="flex items-center space-x-4 p-6 bg-slate-50 rounded-2xl border-2 border-slate-100">
                         <div className="flex-1">
                            <Label className="text-sm font-black uppercase text-primary">Capacitación Técnica</Label>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">¿Se realizó curso de capacitación para este rubro?</p>
                         </div>
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase">{formData.capacitacion === 'S' ? 'SÍ' : 'NO'}</span>
                            <Switch 
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
                        <div className="space-y-8 animate-in slide-in-from-top-4 duration-500 p-6 border-2 border-dashed border-primary/20 rounded-3xl">
                           <h4 className="text-lg font-black uppercase text-primary border-b-2 border-primary/10 pb-2 flex items-center gap-3">
                              <Activity className="h-5 w-5" /> Gestión de Curso e Instructores
                           </h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-3">
                                 <Label className="text-[10px] font-black uppercase text-slate-500">Nombre del Curso / Taller</Label>
                                 <Input value={formData.cursoNombre} onChange={e => setFormData({...formData, cursoNombre: e.target.value})} className="bg-slate-50" />
                              </div>
                              <div className="space-y-3">
                                 <Label className="text-[10px] font-black uppercase text-slate-500">Grupo de Asistencia</Label>
                                 <Input value={formData.cursoGrupo} onChange={e => setFormData({...formData, cursoGrupo: e.target.value})} className="bg-slate-50" />
                              </div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                              <div className="space-y-3">
                                 <Label className="text-[10px] font-black uppercase text-slate-500">Horas</Label>
                                 <div className="relative">
                                   <Input type="number" value={formData.duracionHoras} onChange={e => setFormData({...formData, duracionHoras: parseInt(e.target.value) || 0})} className="bg-slate-50 pl-10" />
                                   <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                 </div>
                              </div>
                              <div className="space-y-3">
                                 <Label className="text-[10px] font-black uppercase text-slate-500">Fecha Inicio</Label>
                                 <div className="relative">
                                   <Input type="date" value={formData.fechaInicio} onChange={e => setFormData({...formData, fechaInicio: e.target.value})} className="bg-slate-50 pl-10" />
                                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                 </div>
                              </div>
                              <div className="space-y-3">
                                 <Label className="text-[10px] font-black uppercase text-slate-500">Fecha Término</Label>
                                 <div className="relative">
                                   <Input type="date" value={formData.fechaTermino} onChange={e => setFormData({...formData, fechaTermino: e.target.value})} className="bg-slate-50 pl-10" />
                                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                 </div>
                              </div>
                              <div className="space-y-3">
                                 <Label className="text-[10px] font-black uppercase text-slate-500">CCT Sede</Label>
                                 <Input value={formData.cctSede} onChange={e => setFormData({...formData, cctSede: e.target.value.toUpperCase()})} className="bg-slate-50 font-mono" placeholder="15DESXXXXX" maxLength={10} />
                              </div>
                           </div>
                        </div>
                      )}

                      <div className="space-y-3">
                         <Label className="text-[10px] font-black uppercase text-primary ml-2">Observaciones Técnicas / Bitácora</Label>
                         <Textarea value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} className="min-h-[120px] rounded-[1.5rem] border-2 border-slate-100 p-6" />
                      </div>
                   </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="asistentes" className="h-full m-0 flex flex-col">
                <div className="p-8 pb-4 flex justify-between items-center bg-white border-b">
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-4 flex-1 mr-4">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                    <p className="text-[11px] font-bold text-slate-700 uppercase leading-relaxed">
                      Capture la lista de asistentes. Al ingresar el CCT de 10 dígitos, se autocompletarán los datos geográficos automáticamente.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleAddAssistantRow} className="gap-2 font-black uppercase h-14 px-8 rounded-2xl border-primary text-primary hover:bg-primary/5 shadow-sm">
                    <Plus className="h-5 w-5" /> Añadir Asistente
                  </Button>
                </div>

                <div className="flex-1 overflow-hidden border-t">
                  <ScrollArea className="h-full">
                    <Table className="border-collapse">
                      <TableHeader className="bg-slate-100 sticky top-0 z-20 shadow-sm">
                        <TableRow>
                          <TableHead className="w-12 text-[10px] font-black uppercase text-center py-4 border-r border-slate-200">#</TableHead>
                          <TableHead className="min-w-[220px] text-[10px] font-black uppercase py-4 border-r border-slate-200">Apellidos y Nombre(s)</TableHead>
                          <TableHead className="min-w-[150px] text-[10px] font-black uppercase py-4 border-r border-slate-200">RFC</TableHead>
                          <TableHead className="min-w-[180px] text-[10px] font-black uppercase py-4 border-r border-slate-200">Función</TableHead>
                          <TableHead className="min-w-[140px] text-[10px] font-black uppercase py-4 border-r border-slate-200">CCT Plantel</TableHead>
                          <TableHead className="min-w-[250px] text-[10px] font-black uppercase py-4 border-r border-slate-200">Nombre C.T. / Zona</TableHead>
                          <TableHead className="w-16 sticky right-0 bg-slate-100 py-4"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(formData.asistentes || []).map((ast, idx) => (
                          <TableRow key={idx} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="text-center font-black text-xs text-muted-foreground border-r border-slate-100">{idx + 1}</TableCell>
                            <TableCell className="p-3 border-r border-slate-100">
                              <div className="flex flex-col gap-2">
                                <Input placeholder="Ap. Paterno" className="h-9 text-[10px] font-bold" value={ast.paterno} onChange={e => updateAssistantField(idx, 'paterno', e.target.value)} />
                                <Input placeholder="Ap. Materno" className="h-9 text-[10px] font-bold" value={ast.materno} onChange={e => updateAssistantField(idx, 'materno', e.target.value)} />
                                <Input placeholder="Nombre(s)" className="h-9 text-[10px] font-black text-primary" value={ast.nombres} onChange={e => updateAssistantField(idx, 'nombres', e.target.value)} />
                              </div>
                            </TableCell>
                            <TableCell className="p-3 border-r border-slate-100">
                              <Input placeholder="RFC" className="h-10 text-[10px] font-mono font-black uppercase" value={ast.rfc} onChange={e => updateAssistantField(idx, 'rfc', e.target.value.toUpperCase())} maxLength={13} />
                            </TableCell>
                            <TableCell className="p-3 border-r border-slate-100">
                              <Select value={ast.funcion} onValueChange={(val: any) => updateAssistantField(idx, 'funcion', val)}>
                                <SelectTrigger className="h-10 text-[10px] font-bold">
                                  <SelectValue placeholder="Función..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {FUNCIONES.map(f => (
                                    <SelectItem key={f} value={f} className="text-[10px] font-bold">{f}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="p-3 border-r border-slate-100">
                              <Input placeholder="15DESXXXXX" className="h-10 text-[10px] font-mono font-black uppercase border-primary/30" value={ast.cct} onChange={e => updateAssistantField(idx, 'cct', e.target.value.toUpperCase())} maxLength={10} />
                            </TableCell>
                            <TableCell className="p-3 border-r border-slate-100">
                              <div className="flex flex-col gap-2">
                                <Input value={ast.nombreCT} readOnly className="h-9 text-[9px] bg-slate-50 font-black uppercase" placeholder="Nombre C.T." />
                                <Input value={ast.ze} readOnly className="h-9 text-[9px] bg-slate-50 text-center" placeholder="ZE" />
                              </div>
                            </TableCell>
                            <TableCell className="p-3 sticky right-0 bg-white shadow-[-10px_0_15px_rgba(0,0,0,0.03)] text-center">
                              <Button variant="ghost" size="icon" className="h-10 w-10 text-rose-500 hover:bg-rose-50 rounded-xl" onClick={() => handleRemoveAssistantRow(idx)} disabled={(formData.asistentes?.length || 0) <= 1}>
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

          <DialogFooter className="p-8 border-t bg-slate-50">
             <Button variant="outline" onClick={() => { setIsDialogOpen(false); setFormData(initialFormState); setActiveDialogTab('datos'); }} className="h-14 px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</Button>
             <Button onClick={handleSave} className="h-14 px-14 rounded-2xl font-black uppercase text-[10px] bg-primary text-white shadow-xl shadow-primary/20 tracking-[0.1em]">Finalizar Captura</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
