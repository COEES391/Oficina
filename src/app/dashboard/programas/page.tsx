'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
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
import { 
  PlusCircle, 
  Pencil, 
  Zap,
  Table as TableIcon,
  UserPlus,
  Mail,
  BarChart3,
  Search,
  ShieldCheck
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

const DB_VERSION = "1709_records_official_v1";

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [userRfc, setUserRfc] = useState<string | null>(null)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [activeTab, setActiveTab] = useState(PROGRAM_RUBROS[0])
  const [cuentasSubTab, setCuentasSubTab] = useState('dashboard')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [modalidadSubFilter, setModalidadSubFilter] = useState('all')
  const [sectorSubFilter, setSectorSubFilter] = useState('all')
  const [areaSubFilter, setAreaSubFilter] = useState('all')
  const [valleSubFilter, setValleSubFilter] = useState('all')

  const initialAssistant: ProgramAssistant = {
    paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '', departamento: ''
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
    
    const stored = JSON.parse(localStorage.getItem('programs_full') || '[]')
    const storedVersion = localStorage.getItem('programs_db_version')
    
    if (storedVersion !== DB_VERSION || stored.length < 1000) {
      setRecords(programsData)
      localStorage.setItem('programs_full', JSON.stringify(programsData))
      localStorage.setItem('programs_db_version', DB_VERSION)
    } else {
      setRecords(stored)
    }
  }, [])

  const norm = (s: string | undefined) => (s || '').trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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
    const totalCuentas = filteredCuentasRecords.length;
    const terminados = filteredCuentasRecords.filter(r => r.status === 'concluido').length;
    const enProceso = filteredCuentasRecords.filter(r => r.status === 'activo').length;
    const planeacion = filteredCuentasRecords.filter(r => r.status === 'planeacion').length;
    
    const usagePercent = totalCuentas > 0 ? Math.round((terminados / totalCuentas) * 100) : 0;

    const desysaCoeesData = [
      { name: 'Aprobado', value: terminados, fill: '#22C55E' },
      { name: 'En proceso', value: enProceso, fill: '#EAB308' },
      { name: 'Planeación', value: planeacion, fill: '#EF4444' },
    ];

    const accountsData = [
      { name: 'En Uso', value: usagePercent, fill: '#621132' },
      { name: 'Libre', value: 100 - usagePercent, fill: '#cbd5e1' },
    ];

    return { totalCuentas, usagePercent, desysaCoeesData, accountsData };
  }, [filteredCuentasRecords]);

  const handleSave = () => {
    if (!formData.id) {
      toast({ variant: "destructive", title: "ID obligatorio" });
      return;
    }
    const updated = editingId ? records.map(r => r.id === editingId ? formData : r) : [formData, ...records];
    setRecords(updated)
    localStorage.setItem('programs_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    setEditingId(null)
    toast({ title: "Registro guardado exitosamente" })
  }

  const resetForm = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setFormData({ 
      ...initialFormState, 
      name: activeTab, 
      date: today, 
      fechaEntrada: today, 
      fechaInicio: today, 
      fechaTermino: today,
      id: isCuentasTab ? `PROG-CI-${records.length + 1}` : `PROG-${Date.now()}`
    })
    setEditingId(null)
  }

  const activeTabClean = activeTab.includes('(') ? activeTab.split('(')[0].trim() : activeTab;
  const isCuentasTab = activeTabClean === 'Cuentas Institucionales';

  const filteredRecords = useMemo(() => {
    return records.filter(r => r.name === activeTab || (isCuentasTab && (r.name?.includes('Cuentas') || r.id?.startsWith('PROG-CI'))));
  }, [records, activeTab, isCuentasTab]);

  if (!mounted) return null

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tighter text-primary uppercase leading-none">Gestión de Programas</h2>
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
             <p className="text-muted-foreground font-black text-[11px] uppercase tracking-[0.3em]">Seguimiento Estratégico Oficina de Planeación</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
        <TabsList className="w-full h-auto flex flex-wrap bg-slate-100/50 p-1.5 rounded-3xl shadow-inner border border-primary/5">
          {PROGRAM_RUBROS.map(rubro => (
            <TabsTrigger key={rubro} value={rubro} className="flex-1 min-w-[200px] h-14 text-[10px] font-black uppercase tracking-[0.1em] rounded-2xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xl">
              {rubro.includes('(') ? rubro.split('(')[0] : rubro}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-10 animate-in zoom-in-95 duration-500">
           {isCuentasTab ? (
             <div className="space-y-10">
                <Tabs value={cuentasSubTab} onValueChange={setCuentasSubTab} className="space-y-8">
                   <TabsList className="bg-slate-100 p-1 rounded-2xl h-12">
                      <TabsTrigger value="dashboard" className="rounded-xl px-6 font-black uppercase text-[10px] gap-2"><BarChart3 className="h-4 w-4" /> Dashboard de Monitoreo</TabsTrigger>
                      <TabsTrigger value="listado" className="rounded-xl px-6 font-black uppercase text-[10px] gap-2"><TableIcon className="h-4 w-4" /> Listado Detallado</TabsTrigger>
                   </TabsList>

                   <TabsContent value="dashboard" className="animate-in fade-in zoom-in-95 duration-700">
                      <div className="space-y-10">
                        <div className="flex items-center gap-6">
                           <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center shadow-xl"><Zap className="h-8 w-8 text-white" /></div>
                           <div>
                              <h2 className="text-3xl font-black text-primary uppercase tracking-tighter leading-none">Herramienta de Monitoreo</h2>
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-1">Control Analítico de Cuentas Institucionales (1,709 Registros)</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-12 gap-8">
                           <div className="col-span-3 space-y-8">
                              <Card className="executive-card p-6 bg-slate-50/50">
                                 <Label className="text-[10px] font-black uppercase text-primary mb-4 block">MODALIDAD</Label>
                                 <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    <Button variant={modalidadSubFilter === 'all' ? 'default' : 'outline'} className="h-10 text-[10px] font-black uppercase" onClick={() => setModalidadSubFilter('all')}>TODAS</Button>
                                    {dynamicOptions.mods.map(m => (
                                       <Button key={m} variant={modalidadSubFilter === m ? 'default' : 'outline'} className="h-10 text-[10px] font-black uppercase" onClick={() => setModalidadSubFilter(m)}>{m || 'N/A'}</Button>
                                    ))}
                                 </div>
                              </Card>

                              <Card className="executive-card p-6 bg-slate-50/50">
                                 <Label className="text-[10px] font-black uppercase text-primary mb-4 block">SECTOR</Label>
                                 <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    <Button variant={sectorSubFilter === 'all' ? 'default' : 'outline'} className="col-span-3 h-10 text-[10px] font-black" onClick={() => setSectorSubFilter('all')}>TODOS</Button>
                                    {dynamicOptions.secs.map(s => (
                                       <Button key={s} variant={sectorSubFilter === s ? 'default' : 'outline'} className="h-10 text-[10px] font-black" onClick={() => setSectorSubFilter(s)}>{s || 'N/A'}</Button>
                                    ))}
                                 </div>
                              </Card>
                           </div>

                           <div className="col-span-4 flex flex-col items-center gap-8">
                              <Card className="w-full executive-card p-10 flex flex-col items-center justify-center bg-white shadow-2xl">
                                 <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Total de Cuentas Filtradas</span>
                                 <div className="text-6xl font-black text-slate-800 tracking-tighter">{cuentasStats.totalCuentas}</div>
                              </Card>

                              <div className="relative h-[250px] w-full flex flex-col items-center">
                                 <Label className="text-[10px] font-black uppercase text-slate-400 mb-6">% CORREO ACTIVO (APROBADO)</Label>
                                 <ResponsiveContainer width={200} height={200}>
                                    <PieChart>
                                       <Pie data={cuentasStats.accountsData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                          {cuentasStats.accountsData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                       </Pie>
                                    </PieChart>
                                 </ResponsiveContainer>
                                 <div className="absolute inset-0 flex items-center justify-center pt-10"><span className="text-3xl font-black text-primary">{cuentasStats.usagePercent}%</span></div>
                              </div>
                           </div>

                           <div className="col-span-5 space-y-8">
                              <div className="grid grid-cols-2 gap-4">
                                 <Card className="executive-card p-4">
                                    <Label className="text-[9px] font-black uppercase text-orange-600 mb-4 block">AREA</Label>
                                    <div className="space-y-1 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                                       <div className={cn("p-2 rounded-lg text-[9px] font-black uppercase cursor-pointer", areaSubFilter === 'all' ? 'bg-orange-600 text-white' : 'bg-white')} onClick={() => setAreaSubFilter('all')}>TODAS</div>
                                       {dynamicOptions.areas.map(a => <div key={a} className={cn("p-2 rounded-lg text-[9px] font-black uppercase cursor-pointer", areaSubFilter === a ? 'bg-orange-600 text-white' : 'bg-white')} onClick={() => setAreaSubFilter(a)}>{a || 'N/A'}</div>)}
                                    </div>
                                 </Card>
                                 <Card className="executive-card p-4">
                                    <Label className="text-[9px] font-black uppercase text-amber-600 mb-4 block">VALLE</Label>
                                    <div className="space-y-1 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                                       <div className={cn("p-2 rounded-lg text-[9px] font-black uppercase cursor-pointer", valleSubFilter === 'all' ? 'bg-amber-600 text-white' : 'bg-white')} onClick={() => setValleSubFilter('all')}>TODOS</div>
                                       {dynamicOptions.valles.map(v => <div key={v} className={cn("p-2 rounded-lg text-[9px] font-black uppercase cursor-pointer", valleSubFilter === v ? 'bg-amber-600 text-white' : 'bg-white')} onClick={() => setValleSubFilter(v)}>{v || 'N/A'}</div>)}
                                    </div>
                                 </Card>
                              </div>

                              <Card className="executive-card p-6 h-[300px]">
                                 <CardTitle className="text-xs font-black uppercase text-slate-700 mb-6">ESTATUS OPERATIVO FILTRADO</CardTitle>
                                 <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={cuentasStats.desysaCoeesData}>
                                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                       <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                                       <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={35}>
                                          {cuentasStats.desysaCoeesData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                       </Bar>
                                    </BarChart>
                                 </ResponsiveContainer>
                              </Card>
                           </div>
                        </div>

                        <Card className="executive-card overflow-hidden">
                           <CardHeader className="bg-slate-50 border-b p-6 flex flex-row items-center justify-between">
                              <CardTitle className="text-sm font-black uppercase text-primary">Auditoría de Geoposicionamiento (Filtros Activos)</CardTitle>
                           </CardHeader>
                           <div className="overflow-x-auto">
                              <Table>
                                 <TableHeader className="bg-slate-100/50">
                                    <TableRow>
                                       <TableHead className="font-black text-[9px] uppercase pl-8">USUARIO / CCT</TableHead>
                                       <TableHead className="font-black text-[9px] uppercase">MODALIDAD</TableHead>
                                       <TableHead className="font-black text-[9px] uppercase">ZONA</TableHead>
                                       <TableHead className="font-black text-[9px] uppercase">CORREO DESYSA</TableHead>
                                       <TableHead className="font-black text-[9px] uppercase text-right pr-8">ESTATUS</TableHead>
                                    </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                    {filteredCuentasRecords.slice(0, 100).map((rec, i) => (
                                       <TableRow key={i} className="text-[10px] font-bold">
                                          <TableCell className="pl-8 text-primary font-black uppercase">{rec.cct}</TableCell>
                                          <TableCell className="uppercase text-[9px]">{rec.modalidad}</TableCell>
                                          <TableCell className="text-center">{rec.zonaEscolar}</TableCell>
                                          <TableCell className="font-mono text-blue-600">{rec.asistentes?.[0]?.email}</TableCell>
                                          <TableCell className="text-right pr-8">
                                             <Badge className={cn("text-[8px] font-black uppercase", rec.status === 'concluido' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white')}>
                                                {rec.status === 'concluido' ? 'APROBADO' : 'PENDIENTE'}
                                             </Badge>
                                          </TableCell>
                                       </TableRow>
                                    ))}
                                    {filteredCuentasRecords.length > 100 && (
                                       <TableRow><TableCell colSpan={5} className="text-center py-4 text-[10px] font-black text-muted-foreground uppercase italic">Se muestran los primeros 100 de {filteredCuentasRecords.length} registros...</TableCell></TableRow>
                                    )}
                                 </TableBody>
                              </Table>
                           </div>
                        </Card>
                      </div>
                   </TabsContent>

                   <TabsContent value="listado" className="animate-in slide-in-from-right-10 duration-700">
                      <div className="space-y-6">
                        <div className="flex justify-end">
                           <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="gap-2 font-black uppercase shadow-lg">
                              <UserPlus className="h-4 w-4" /> Agregar Nueva Cuenta
                           </Button>
                        </div>
                        <Card className="executive-card">
                          <CardHeader className="bg-slate-50/50 p-8 border-b">
                            <CardTitle className="text-xl font-black uppercase text-primary">Listado Detallado de Cuentas (Vigencia 2024-2025)</CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            <Table>
                              <TableHeader className="bg-slate-100/50">
                                <TableRow>
                                  <TableHead className="font-black text-[10px] uppercase pl-8"># USUARIO / CCT</TableHead>
                                  <TableHead className="font-black text-[10px] uppercase">MODALIDAD / VALLE</TableHead>
                                  <TableHead className="font-black text-[10px] uppercase text-center">ZONA / SECTOR</TableHead>
                                  <TableHead className="font-black text-[10px] uppercase">CORREO INSTITUCIONAL</TableHead>
                                  <TableHead className="font-black text-[10px] uppercase text-center">ESTATUS</TableHead>
                                  <TableHead className="font-black text-[10px] uppercase text-right pr-8">ACCIONES</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredCuentasRecords.slice(0, 300).map((rec) => (
                                  <TableRow key={rec.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="pl-8 font-black text-slate-700">{rec.cct}</TableCell>
                                    <TableCell>
                                      <div className="flex flex-col">
                                         <span className="text-[10px] font-black text-slate-700">{rec.modalidad}</span>
                                         <span className="text-[9px] text-slate-400 font-bold uppercase">{rec.valle}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                       <div className="flex flex-col">
                                          <span className="text-[10px] font-black text-primary">Zona {rec.zonaEscolar || 'S/Z'}</span>
                                          <span className="text-[9px] font-bold text-slate-400">Sector {rec.sector || 'S/S'}</span>
                                       </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-[10px] text-blue-600">{rec.asistentes?.[0]?.email}</TableCell>
                                    <TableCell className="text-center">
                                       <Badge className={cn("text-[9px] font-black px-4", rec.status === 'concluido' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white')}>
                                          {rec.status === 'concluido' ? 'APROBADO' : 'PENDIENTE'}
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
                      </div>
                   </TabsContent>
                </Tabs>
             </div>
           ) : (
             <Card className="executive-card">
               <CardHeader className="bg-slate-50/50 p-8 border-b">
                 <CardTitle className="text-xl font-black uppercase text-primary">{activeTabClean}</CardTitle>
               </CardHeader>
               <CardContent className="p-0">
                 <Table>
                   <TableHeader className="bg-slate-100/50">
                     <TableRow>
                       <TableHead className="font-black text-[10px] uppercase pl-8">CCT / Escuela</TableHead>
                       <TableHead className="font-black text-[10px] uppercase text-center">Estatus</TableHead>
                       <TableHead className="font-black text-[10px] uppercase text-right pr-8">Acciones</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {filteredRecords.length > 0 ? filteredRecords.map((rec) => (
                       <TableRow key={rec.id} className="hover:bg-slate-50">
                         <TableCell className="pl-8 font-black">{rec.cct}</TableCell>
                         <TableCell className="text-center">
                            <Badge className={cn("text-[9px] font-black", rec.status === 'concluido' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white')}>
                               {rec.status}
                            </Badge>
                         </TableCell>
                         <TableCell className="text-right pr-8">
                            <Button variant="ghost" size="icon" onClick={() => { setFormData(rec); setEditingId(rec.id); setIsDialogOpen(true); }}>
                               <Pencil className="h-4 w-4" />
                            </Button>
                         </TableCell>
                       </TableRow>
                     )) : (
                       <TableRow><TableCell colSpan={3} className="text-center py-20 font-black">Sin registros.</TableCell></TableRow>
                     )}
                   </TableBody>
                 </Table>
               </CardContent>
             </Card>
           )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-8 border-b bg-slate-50">
            <DialogTitle className="text-2xl font-black uppercase text-primary">{editingId ? 'Editar Registro' : 'Nueva Captura'} - {activeTabClean}</DialogTitle>
            <DialogDescription className="font-bold text-[10px] uppercase tracking-widest">Sincronización oficial de cuentas institucionales Edoméx.</DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 p-8">
            <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-primary">Folio / ID</Label>
                     <Input value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} readOnly={!!editingId} className="font-black uppercase" />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-primary">CCT / Clave</Label>
                     <Input value={formData.cct} onChange={e => setFormData({...formData, cct: e.target.value.toUpperCase()})} className="font-black" placeholder="15XXXXXX" />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-primary">Estatus Administrativo</Label>
                     <Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val})}>
                        <SelectTrigger className="font-black uppercase"><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="planeacion">PENDIENTE / PLANEACIÓN</SelectItem>
                           <SelectItem value="activo">EN PROCESO / ACTIVO</SelectItem>
                           <SelectItem value="concluido">APROBADO / CONCLUIDO</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-primary">Valle Operativo</Label>
                     <Select value={formData.valle} onValueChange={v => setFormData({...formData, valle: v})}>
                        <SelectTrigger className="font-black uppercase"><SelectValue placeholder="Seleccionar Valle" /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="MÉXICO">MÉXICO</SelectItem>
                           <SelectItem value="TOLUCA">TOLUCA</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-primary">Modalidad / Vertiente</Label>
                     <Input value={formData.modalidad} onChange={e => setFormData({...formData, modalidad: e.target.value.toUpperCase()})} className="font-bold" placeholder="PES GOB / PST / COEES / etc." />
                  </div>
               </div>

               {isCuentasTab && (
                  <div className="space-y-6 pt-6 border-t border-slate-100">
                     <h4 className="text-[11px] font-black uppercase text-primary flex items-center gap-2"><Mail className="h-4 w-4" /> Datos de la Cuenta</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-primary">Correo Institucional Oficial</Label>
                           <Input 
                              value={formData.asistentes?.[0]?.email || ''} 
                              onChange={e => {
                                 const updatedAsistentes = [...(formData.asistentes || [initialAssistant])];
                                 updatedAsistentes[0] = { ...updatedAsistentes[0], email: e.target.value };
                                 setFormData({...formData, asistentes: updatedAsistentes});
                              }} 
                              className="font-mono text-blue-600" 
                              placeholder="ejemplo@desysa.gob.mx"
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-primary">Área / Departamento / Plantel</Label>
                           <Input 
                              value={formData.asistentes?.[0]?.departamento || ''} 
                              onChange={e => {
                                 const updatedAsistentes = [...(formData.asistentes || [initialAssistant])];
                                 updatedAsistentes[0] = { ...updatedAsistentes[0], departamento: e.target.value.toUpperCase() };
                                 setFormData({...formData, asistentes: updatedAsistentes});
                              }} 
                              className="font-bold" 
                              placeholder="PLANTEL / OFICINA ADM."
                           />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-primary">Número de Sector</Label>
                           <Input value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value})} className="text-center font-black" placeholder="0" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-primary">Número de Zona</Label>
                           <Input value={formData.zonaEscolar} onChange={e => setFormData({...formData, zonaEscolar: e.target.value})} className="text-center font-black" placeholder="0" />
                        </div>
                     </div>
                  </div>
               )}

               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Observaciones Operativas</Label>
                  <Textarea value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder="Detalles técnicos o administrativos del registro..." />
               </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 border-t bg-slate-50 flex justify-end gap-4">
             <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="font-bold uppercase text-[10px] h-12 px-8">Cancelar</Button>
             <Button onClick={handleSave} className="font-black uppercase text-[10px] h-12 px-12 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20">Sincronizar Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
