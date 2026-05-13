
'use client'
import { useEffect, useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { 
  LayoutDashboard,
  Wrench, 
  Users, 
  CheckCircle2, 
  Filter, 
  RefreshCcw,
  GraduationCap,
  Briefcase,
  TrendingUp,
  Target,
  Zap,
  Calendar,
  MonitorCheck,
  Activity,
  AlertCircle,
  BarChart3,
  Search
} from 'lucide-react'
import { 
  BarChart as RechartsBarChart, 
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
import { supportData, type SupportTicket, type TrainingRecord, type ProgramStatus, programsData } from '@/lib/planning-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TOTAL_UNIVERSE = 830;
const TRAINING_GOAL_2026 = 5600;

const PROGRAM_RUBROS = [
  'Biblioteca Digital',
  'Cuentas Institucionales',
  'Geoposición',
  'Conoce mi Escuela',
  'Mesa de Ayuda Técnica'
];

type DashboardGoals = {
  periodType: 'Ciclo Escolar' | 'Año Fiscal';
  periodName: string;
  supportGoal: number;
  trainingGoal: number;
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [activeReport, setActiveReport] = useState('soporte')
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [trainings, setTrainings] = useState<TrainingRecord[]>([])
  const [programs, setPrograms] = useState<ProgramStatus[]>([])
  
  const [goals, setGoals] = useState<DashboardGoals>({
    periodType: 'Año Fiscal',
    periodName: '2026',
    supportGoal: 500,
    trainingGoal: TRAINING_GOAL_2026
  })

  const [valleFilter, setValleFilter] = useState('all')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')

  useEffect(() => {
    setMounted(true)
    const storedTickets = JSON.parse(localStorage.getItem('support_tickets_full') || '[]')
    setTickets(storedTickets.length > 0 ? storedTickets : supportData)

    const storedTrainings = JSON.parse(localStorage.getItem('training_records_full') || '[]')
    setTrainings(storedTrainings)

    const storedPrograms = JSON.parse(localStorage.getItem('programs_full') || '[]')
    setPrograms(storedPrograms.length > 0 ? storedPrograms : programsData)

    const storedGoals = JSON.parse(localStorage.getItem('dashboard_goals') || 'null')
    if (storedGoals) setGoals(storedGoals)
  }, [])

  // Filtrado de datos para Soporte
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchValle = valleFilter === 'all' || (t.valle && t.valle.toUpperCase() === valleFilter.toUpperCase());
      const matchDateStart = !dateStart || t.fechaEntrada >= dateStart;
      const matchDateEnd = !dateEnd || t.fechaEntrada <= dateEnd;
      return matchValle && matchDateStart && matchDateEnd;
    });
  }, [tickets, valleFilter, dateStart, dateEnd]);

  // Filtrado de datos para Capacitación
  const filteredTrainings = useMemo(() => {
    return trainings.filter(tr => {
      const matchValle = valleFilter === 'all' || (tr.asistenteValle && tr.asistenteValle.toUpperCase() === valleFilter.toUpperCase());
      const matchDateStart = !dateStart || tr.fechaInicio >= dateStart;
      const matchDateEnd = !dateEnd || tr.fechaTermino <= dateEnd;
      return matchValle && matchDateStart && matchDateEnd;
    });
  }, [trainings, valleFilter, dateStart, dateEnd]);

  // Estadísticas de Soporte
  const supportStats = useMemo(() => {
    const atendidos = filteredTickets.filter(t => t.status === 'atendido').length;
    const proceso = filteredTickets.filter(t => t.status === 'en proceso').length;
    const pendientes = filteredTickets.filter(t => t.status === 'pendiente').length;
    
    const totalEquipos = filteredTickets.reduce((acc, t) => acc + (t.numeroEquipos || 0), 0);
    const beneficiados = filteredTickets.reduce((acc, t) => acc + (t.alumnosBeneficiados || 0) + (t.docentesBeneficiados || 0), 0);
    
    const serviciosMP = filteredTickets.reduce((acc, t) => acc + (t.serviciosMP || 0), 0);
    const serviciosMC = filteredTickets.reduce((acc, t) => acc + (t.serviciosMC || 0), 0);

    const typesData = [
      { name: 'RED EDUSAT', value: filteredTickets.filter(t => t.tipoIncidencia === 'red edusat').length, fill: '#621132' },
      { name: 'RED LOCAL', value: filteredTickets.filter(t => t.tipoIncidencia === 'red local').length, fill: '#B38E5D' },
      { name: 'INST. RED', value: filteredTickets.filter(t => t.tipoIncidencia === 'instalación red local').length, fill: '#475569' },
      { name: 'MANT. PREV.', value: filteredTickets.filter(t => t.tipoIncidencia === 'mantenimiento preventivo').length, fill: '#059669' },
      { name: 'MANT. CORR.', value: filteredTickets.filter(t => t.tipoIncidencia === 'mantenimiento correctivo').length, fill: '#dc2626' },
    ];

    return {
      statusData: [
        { name: 'ATENDIDOS', value: atendidos, fill: '#621132' },
        { name: 'EN PROCESO', value: proceso, fill: '#B38E5D' },
        { name: 'PENDIENTES', value: pendientes, fill: '#f43f5e' },
      ],
      typesData,
      totalEquipos,
      beneficiados,
      serviciosMP,
      serviciosMC,
      total: filteredTickets.length
    };
  }, [filteredTickets]);

  // Estadísticas de Capacitación
  const trainingStats = useMemo(() => {
    const total = filteredTrainings.length;
    const progress = Math.min(100, Math.round((total / goals.trainingGoal) * 100));
    
    // Valle
    const byValle = [
      { name: 'VALLE DE MÉXICO', value: filteredTrainings.filter(tr => tr.asistenteValle === 'MEXICO').length, fill: '#621132' },
      { name: 'VALLE DE TOLUCA', value: filteredTrainings.filter(tr => tr.asistenteValle === 'TOLUCA').length, fill: '#B38E5D' },
    ];

    // Genero
    const byGender = [
      { name: 'MASCULINO', value: filteredTrainings.filter(tr => tr.asistenteGenero === 'MASCULINO').length, fill: '#621132' },
      { name: 'FEMENINO', value: filteredTrainings.filter(tr => tr.asistenteGenero === 'FEMENINO').length, fill: '#B38E5D' },
    ];

    // Helper for top items
    const getTopItems = (field: keyof TrainingRecord, limit = 5) => {
      const counts: Record<string, number> = {};
      filteredTrainings.forEach(tr => {
        const val = (tr[field] as string) || 'SIN DATO';
        counts[val] = (counts[val] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit)
        .map((item, idx) => ({
          ...item,
          fill: idx % 2 === 0 ? '#621132' : '#B38E5D'
        }));
    };

    const bySector = getTopItems('asistenteSector');
    const byModality = getTopItems('asistenteModalidad');
    const byZE = getTopItems('asistenteZE');

    return { total, progress, byValle, byGender, bySector, byModality, byZE };
  }, [filteredTrainings, goals.trainingGoal]);

  // Estadísticas de Programas
  const programCoverage = useMemo(() => {
    return PROGRAM_RUBROS.map(name => {
      const records = programs.filter(p => p.name === name);
      const uniqueCcts = new Set(records.map(p => p.cct)).size;
      return { 
        name: name.split(' ')[0], 
        fullName: name,
        value: uniqueCcts,
        percentage: Math.round((uniqueCcts / TOTAL_UNIVERSE) * 100),
        fill: name === 'Conoce mi Escuela' ? '#621132' : '#B38E5D'
      };
    });
  }, [programs]);

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/5">
                <LayoutDashboard className="h-6 w-6 text-primary" />
             </div>
             <div>
               <h2 className="text-3xl font-black tracking-tight text-primary uppercase leading-none">Panel Ejecutivo</h2>
               <p className="text-muted-foreground font-black text-[10px] tracking-[0.2em] uppercase mt-1">Análisis Técnico Operativo COEES</p>
             </div>
          </div>
        </div>
        
        <Tabs value={activeReport} onValueChange={setActiveReport} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-3 w-full md:w-[450px] h-12 bg-white/50 backdrop-blur-md border border-slate-200 p-1 rounded-2xl shadow-sm">
            <TabsTrigger value="soporte" className="gap-2 text-[10px] font-black uppercase rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <Wrench className="h-4 w-4" /> Soporte
            </TabsTrigger>
            <TabsTrigger value="capacitacion" className="gap-2 text-[10px] font-black uppercase rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <GraduationCap className="h-4 w-4" /> Capacitación
            </TabsTrigger>
            <TabsTrigger value="programas" className="gap-2 text-[10px] font-black uppercase rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <Briefcase className="h-4 w-4" /> Programas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="executive-card p-4 bg-white/80 border-none shadow-lg">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filtros Operativos:</span>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <Calendar className="h-4 w-4 text-slate-400" />
            <Input type="date" className="h-8 text-[10px] font-black border-none focus-visible:ring-0 bg-transparent" value={dateStart} onChange={e => setDateStart(e.target.value)} />
            <span className="text-[9px] font-black text-slate-300">A</span>
            <Input type="date" className="h-8 text-[10px] font-black border-none focus-visible:ring-0 bg-transparent" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
          </div>

          <Select value={valleFilter} onValueChange={setValleFilter}>
            <SelectTrigger className="h-10 text-[10px] font-black w-[180px] rounded-xl border-slate-200 bg-white">
              <SelectValue placeholder="VALLE" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[10px] font-black uppercase">Todos los Valles</SelectItem>
              <SelectItem value="MEXICO" className="text-[10px] font-black uppercase">Valle de México</SelectItem>
              <SelectItem value="TOLUCA" className="text-[10px] font-black uppercase">Valle de Toluca</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="sm" className="h-10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all" onClick={() => {setValleFilter('all'); setDateStart(''); setDateEnd('')}}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Reiniciar Tablero
          </Button>
        </div>
      </Card>

      {activeReport === 'soporte' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="executive-card md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Distribución Operativa de Servicios
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-[9px] font-black border-primary/20 text-primary">ANÁLISIS DE ESTATUS</Badge>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={supportStats.statusData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} />
                    <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 900 }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={50}>
                      {supportStats.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6">
              <Card className="executive-card p-6 bg-primary text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                   <Wrench className="h-20 w-20" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Folios Registrados</p>
                 <h3 className="text-5xl font-black mt-2 leading-none">{supportStats.total}</h3>
                 <div className="mt-4 flex items-center gap-2">
                   <Badge className="bg-white/20 text-white border-none text-[9px] font-black">Ciclo 2025-2026</Badge>
                 </div>
              </Card>

              <Card className="executive-card p-6 border-l-4 border-emerald-500">
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Mantenimiento Preventivo</p>
                     <h3 className="text-4xl font-black mt-2 text-emerald-600">{supportStats.serviciosMP}</h3>
                   </div>
                   <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-sm">
                     <CheckCircle2 className="h-6 w-6" />
                   </div>
                 </div>
                 <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Equipos en óptimo estado</p>
              </Card>

              <Card className="executive-card p-6 border-l-4 border-rose-500">
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Mantenimiento Correctivo</p>
                     <h3 className="text-4xl font-black mt-2 text-rose-600">{supportStats.serviciosMC}</h3>
                   </div>
                   <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm">
                     <AlertCircle className="h-6 w-6" />
                   </div>
                 </div>
                 <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Atención de fallas críticas</p>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="executive-card">
              <CardHeader>
                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Análisis por Tipo de Incidencia
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart layout="vertical" data={supportStats.typesData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} />
                    <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px', fontWeight: 900 }} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={25}>
                      {supportStats.typesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="executive-card p-6">
               <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                     <MonitorCheck className="h-4 w-4" /> Impacto en Infraestructura
                  </CardTitle>
               </CardHeader>
               <div className="space-y-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase text-slate-500">Equipos Atendidos</span>
                        <Badge className="bg-primary text-white font-black text-[9px]">{supportStats.totalEquipos}</Badge>
                     </div>
                     <Progress value={Math.min(100, (supportStats.totalEquipos / 200) * 100)} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:shadow-md transition-all">
                       <Users className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                       <span className="text-[9px] font-black text-slate-400 uppercase">Beneficiados Alumnos</span>
                       <span className="text-2xl font-black text-primary">{supportStats.beneficiados.toLocaleString()}</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:shadow-md transition-all">
                       <GraduationCap className="h-6 w-6 text-accent mb-2 group-hover:scale-110 transition-transform" />
                       <span className="text-[9px] font-black text-slate-400 uppercase">Impacto Docente</span>
                       <span className="text-2xl font-black text-accent">{(supportStats.total * 2.5).toFixed(0)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-primary">Capacidad de Respuesta</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">Folios con atención prioritaria 24/48hrs</p>
                    </div>
                  </div>
               </div>
            </Card>
          </div>
        </div>
      )}

      {activeReport === 'capacitacion' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="executive-card md:col-span-2 p-6 flex flex-col justify-center text-center bg-white shadow-xl border-t-4 border-primary">
               <div className="mx-auto h-40 w-40 rounded-full border-[12px] border-primary/10 border-t-primary flex items-center justify-center shadow-inner relative">
                  <span className="text-4xl font-black text-primary">{trainingStats.progress}%</span>
                  <Target className="absolute -top-1 -right-1 h-10 w-10 text-accent bg-white rounded-full p-2 shadow-lg border-2 border-accent/20" />
               </div>
               <div className="mt-8 space-y-1">
                 <h3 className="text-2xl font-black uppercase text-slate-900 leading-none">Meta Institucional 2026</h3>
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2">Cumplimiento sobre meta de {goals.trainingGoal} servidores</p>
               </div>
               <div className="mt-10 grid grid-cols-2 gap-6">
                  <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner group hover:bg-white hover:shadow-md transition-all">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Real Capturado</p>
                     <p className="text-3xl font-black text-primary">{trainingStats.total}</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner group hover:bg-white hover:shadow-md transition-all">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Restante Meta</p>
                     <p className="text-3xl font-black text-accent">{Math.max(0, goals.trainingGoal - trainingStats.total)}</p>
                  </div>
               </div>
            </Card>

            <Card className="executive-card md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Users className="h-4 w-4" /> Distribución por Valle y Género
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 h-[350px]">
                 <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black uppercase text-slate-400 mb-4 tracking-widest">Por Región</span>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie data={trainingStats.byValle} innerRadius={50} outerRadius={85} paddingAngle={5} dataKey="value">
                            {trainingStats.byValle.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px', fontWeight: 900 }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black uppercase text-slate-400 mb-4 tracking-widest">Por Género</span>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie data={trainingStats.byGender} innerRadius={50} outerRadius={85} paddingAngle={5} dataKey="value">
                            {trainingStats.byGender.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px', fontWeight: 900 }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                 </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="executive-card">
              <CardHeader>
                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Top 5 Sectores Atendidos
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart layout="vertical" data={trainingStats.bySector} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} width={80} />
                    <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px', fontWeight: 900 }} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                      {trainingStats.bySector.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="executive-card">
              <CardHeader>
                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <MonitorCheck className="h-4 w-4" /> Distribución por Modalidad
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart layout="vertical" data={trainingStats.byModality} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} width={100} />
                    <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px', fontWeight: 900 }} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                      {trainingStats.byModality.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="executive-card">
              <CardHeader>
                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Search className="h-4 w-4" /> Top 5 Zonas Escolares (ZE)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart layout="vertical" data={trainingStats.byZE} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} width={80} />
                    <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px', fontWeight: 900 }} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                      {trainingStats.byZE.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeReport === 'programas' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {programCoverage.slice(0, 4).map((prog) => (
              <Card key={prog.fullName} className="executive-card p-6 border-l-4 group hover:scale-[1.02] transition-all" style={{ borderLeftColor: prog.fill }}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{prog.name}</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{prog.value}</h3>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shadow-inner">
                    <span className="text-[10px] font-black text-primary">{prog.percentage}%</span>
                  </div>
                </div>
                <Progress value={prog.percentage} className="h-1.5 mt-4" />
                <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">Cobertura sobre {TOTAL_UNIVERSE} planteles federales</p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="executive-card p-6">
                <CardHeader className="px-0 pt-0">
                   <CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Target className="h-4 w-4" /> Universo de Atención Sectorial
                   </CardTitle>
                </CardHeader>
                <div className="space-y-4 mt-2">
                   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-md transition-all border border-slate-100">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-primary text-white font-black px-3">DES</Badge>
                        <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Secundarias Generales</span>
                      </div>
                      <span className="text-sm font-black text-primary">252 CTs</span>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-md transition-all border border-slate-100">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-accent text-white font-black px-3">DST</Badge>
                        <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Secundarias Técnicas</span>
                      </div>
                      <span className="text-sm font-black text-accent">240 CTs</span>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-md transition-all border border-slate-100">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-slate-900 text-white font-black px-3">DTV</Badge>
                        <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Telesecundarias</span>
                      </div>
                      <span className="text-sm font-black text-slate-900">338 CTs</span>
                   </div>
                </div>
             </Card>

             <Card className="executive-card bg-slate-900 text-white p-6 relative overflow-hidden group">
                <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                   <MonitorCheck className="h-48 w-48 text-white" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Cuentas Institucionales</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-[0.2em]">Migración a dominios @coees.edu.mx</p>
                <div className="mt-8 space-y-4 relative z-10">
                   <div>
                      <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                        <span className="tracking-widest">Avance de Migración</span>
                        <span>{Math.round(TOTAL_UNIVERSE * 0.85)} / {TOTAL_UNIVERSE} CTs</span>
                      </div>
                      <Progress value={85} className="h-2 bg-white/10" />
                   </div>
                   <div className="pt-6 border-t border-white/10 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent shadow-sm">
                        <Zap className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase text-white tracking-widest">Próxima Auditoría Masiva</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Septiembre 2026 • Lineamientos COEES</p>
                      </div>
                   </div>
                </div>
             </Card>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 p-4 bg-accent/5 border border-accent/10 rounded-2xl animate-pulse">
         <AlertCircle className="h-5 w-5 text-accent" />
         <p className="text-[10px] font-black uppercase tracking-[0.15em] text-accent">
            Reporte ejecutivo actualizado en tiempo real conforme a la captura operativa del sistema integral COEES.
         </p>
      </div>
    </div>
  )
}
