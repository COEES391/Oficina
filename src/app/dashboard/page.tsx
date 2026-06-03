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
  Target,
  Zap,
  Calendar,
  Activity,
  AlertCircle,
  BarChart3,
  Search,
  ClipboardList,
  MapPin,
  Cpu,
  Globe,
  Radio,
  Navigation,
  Monitor,
  Building2,
  Table as TableIcon,
  UserCheck,
  PieChart
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
  Legend
} from 'recharts'
import { supportData, type SupportTicket, type TrainingRecord, type ProgramStatus, programsData } from '@/lib/planning-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const TOTAL_UNIVERSE = 830;
const TRAINING_GOAL_2026 = 5600;
const QUARTERLY_TRAINING_GOAL = 1400;

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
    supportGoal: 78,
    trainingGoal: TRAINING_GOAL_2026
  })

  const [valleFilter, setValleFilter] = useState('all')
  const [oficinaFilter, setOficinaFilter] = useState('all')
  const [cctFilter, setCctFilter] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')

  useEffect(() => {
    setMounted(true)
    const syncData = () => {
      const storedTickets = JSON.parse(localStorage.getItem('support_tickets_full') || '[]')
      setTickets(storedTickets.length > 0 ? storedTickets : supportData)

      const storedTrainings = JSON.parse(localStorage.getItem('training_records_full') || '[]')
      setTrainings(storedTrainings)

      const storedPrograms = JSON.parse(localStorage.getItem('programs_full_v24') || '[]')
      setPrograms(storedPrograms.length > 0 ? storedPrograms : programsData)

      const storedGoals = JSON.parse(localStorage.getItem('dashboard_goals') || 'null')
      if (storedGoals) setGoals(storedGoals)
    }

    syncData()
    window.addEventListener('storage', syncData)
    return () => window.removeEventListener('storage', syncData)
  }, [])

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchValle = valleFilter === 'all' || (t.valle && t.valle.toUpperCase() === valleFilter.toUpperCase());
      const matchOficina = oficinaFilter === 'all' || (t.oficinaRegionalAtencion && t.oficinaRegionalAtencion.toUpperCase().includes(oficinaFilter.toUpperCase()));
      const matchDateStart = !dateStart || t.fechaEntrada >= dateStart;
      const matchDateEnd = !dateEnd || t.fechaEntrada <= dateEnd;
      const matchCct = !cctFilter || (t.cct && t.cct.toUpperCase().includes(cctFilter.toUpperCase()));
      return matchValle && matchOficina && matchDateStart && matchDateEnd && matchCct;
    });
  }, [tickets, valleFilter, oficinaFilter, dateStart, dateEnd, cctFilter]);

  const filteredPrograms = useMemo(() => {
    return programs.filter(p => {
      const matchValle = valleFilter === 'all' || (p.valle && p.valle.toUpperCase() === valleFilter.toUpperCase());
      const matchOficina = oficinaFilter === 'all' || (p.oficinaRegionalAtencion && p.oficinaRegionalAtencion.toUpperCase().includes(oficinaFilter.toUpperCase()));
      const matchDateStart = !dateStart || p.date >= dateStart;
      const matchDateEnd = !dateEnd || p.date <= dateEnd;
      const matchCct = !cctFilter || (p.cct && p.cct.toUpperCase().includes(cctFilter.toUpperCase()));
      return matchValle && matchOficina && matchDateStart && matchDateEnd && matchCct;
    });
  }, [programs, valleFilter, oficinaFilter, dateStart, dateEnd, cctFilter]);

  const filteredTrainings = useMemo(() => {
    return trainings.filter(tr => {
      const matchValle = valleFilter === 'all' || (tr.asistenteValle && tr.asistenteValle.toUpperCase() === valleFilter.toUpperCase());
      const matchDateStart = !dateStart || tr.fechaInicio >= dateStart;
      const matchDateEnd = !dateEnd || tr.fechaInicio <= dateEnd;
      const matchCct = !cctFilter || (tr.asistenteCCT && tr.asistenteCCT.toUpperCase().includes(cctFilter.toUpperCase()));
      return matchValle && matchDateStart && matchDateEnd && matchCct;
    });
  }, [trainings, valleFilter, dateStart, dateEnd, cctFilter]);

  const supportStats = useMemo(() => {
    const atendidos = filteredTickets.filter(t => t.status === 'atendido').length;
    const proceso = filteredTickets.filter(t => t.status === 'en proceso').length;
    const pendientes = filteredTickets.filter(t => t.status === 'pendiente').length;
    
    const serviciosMP = filteredTickets.reduce((acc, t) => acc + (t.serviciosMP || 0), 0);
    const serviciosMC = filteredTickets.reduce((acc, t) => acc + (t.serviciosMC || 0), 0);

    const redEscolarCount = filteredTickets.filter(t => t.tipoIncidencia === 'red local').length;
    const redEdusatCount = filteredTickets.filter(t => t.tipoIncidencia === 'red edusat').length;
    const teleplantelesCount = filteredTickets.filter(t => t.tipoIncidencia === 'teleplanteles').length;

    const metaC = 78; 
    const alcanzadoC = redEscolarCount + redEdusatCount;
    const porcentajeC = metaC > 0 ? Math.min(100, parseFloat(((alcanzadoC / metaC) * 100).toFixed(2))) : 0;

    const typesData = [
      { name: 'RED EDUSAT', value: redEdusatCount, fill: '#621132' },
      { name: 'RED LOCAL', value: redEscolarCount, fill: '#B38E5D' },
      { name: 'MANT. PREVENTIVO', value: serviciosMP, fill: '#059669' },
      { name: 'MANT. CORRECTIVO', value: serviciosMC, fill: '#10b981' },
      { name: 'TELEPLANTEL', value: teleplantelesCount, fill: '#ec4899' },
    ];

    const redLocalByMunicipio: Record<string, number> = {};
    filteredTickets.filter(t => t.tipoIncidencia === 'red local').forEach(t => {
      if (t.municipio) redLocalByMunicipio[t.municipio] = (redLocalByMunicipio[t.municipio] || 0) + 1;
    });
    
    const redLocalByOficina: Record<string, number> = {};
    filteredTickets.filter(t => t.tipoIncidencia === 'red local').forEach(t => {
      if (t.oficinaRegionalAtencion) {
        const cleanOfi = t.oficinaRegionalAtencion.replace('Oficina de Tecnóloga Educativa ', '').replace('Oficina de ', '');
        redLocalByOficina[cleanOfi] = (redLocalByOficina[cleanOfi] || 0) + 1;
      }
    });

    const redLocalMunData = Object.entries(redLocalByMunicipio).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);
    const redLocalOfiData = Object.entries(redLocalByOficina).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    return {
      statusData: [
        { name: 'ATENDIDOS', value: atendidos, fill: '#621132' },
        { name: 'EN PROCESO', value: proceso, fill: '#B38E5D' },
        { name: 'PENDIENTES', value: pendientes, fill: '#f43f5e' },
      ],
      typesData,
      redLocalMunData,
      redLocalOfiData,
      serviciosMP,
      serviciosMC,
      beneficiados: filteredTickets.reduce((acc, t) => acc + (t.alumnosBeneficiados || 0) + (t.docentesBeneficiados || 0), 0),
      alumnos: filteredTickets.reduce((acc, t) => acc + (t.alumnosBeneficiados || 0), 0),
      docentes: filteredTickets.reduce((acc, t) => acc + (t.docentesBeneficiados || 0), 0),
      total: filteredTickets.length,
      indicadorC: {
        alcanzado: alcanzadoC,
        meta: metaC,
        porcentaje: porcentajeC,
        faltante: Math.max(0, metaC - alcanzadoC),
        redEscolar: redEscolarCount,
        redEdusat: redEdusatCount
      }
    };
  }, [filteredTickets]);

  const trainingStats = useMemo(() => {
    const total = filteredTrainings.length;
    const progressTotal = Math.min(100, Math.round((total / goals.trainingGoal) * 100));

    const courseCounts: Record<string, number> = {};
    filteredTrainings.forEach(tr => {
      const name = tr.cursoNombre || 'Curso sin nombre';
      courseCounts[name] = (courseCounts[name] || 0) + 1;
    });

    const sortedCourses = Object.entries(courseCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const indicadorA = {
      alcanzado: total,
      meta: QUARTERLY_TRAINING_GOAL,
      faltante: Math.max(0, QUARTERLY_TRAINING_GOAL - total),
      porcentaje: total > 0 ? Math.min(100, parseFloat(((total / QUARTERLY_TRAINING_GOAL) * 100).toFixed(2))) : 0,
      cursos: sortedCourses.length > 0 ? sortedCourses : [{ name: 'Sin registros aún', value: 0 }]
    };

    const uniqueSchools = new Set(filteredTrainings.map(t => t.asistenteCCT)).size;
    const indicadorB = {
      porcentaje: Math.min(100, Math.round((uniqueSchools / 150) * 100)),
      total: uniqueSchools
    };

    const regionsMapping = [
      { name: 'Toluca', goal: 2156, filter: 'TOLUCA' },
      { name: 'Nezahualcóyotl', goal: 860, filter: 'NEZAHUALCOYOTL' },
      { name: 'Ecatepec', goal: 860, filter: 'ECATEPEC' },
      { name: 'Naucalpan', goal: 1724, filter: 'NAUCALPAN' }
    ];

    const byRegionalOffice = regionsMapping.map(reg => {
      const actual = filteredTrainings.filter(tr => 
        tr.asistenteMunicipio?.toUpperCase() === reg.filter || 
        tr.asistenteRegion?.toUpperCase() === reg.filter ||
        tr.asistenteValle?.toUpperCase() === reg.filter
      ).length;
      return { name: reg.name, actual, goal: reg.goal };
    });

    const detailedAnalysis: {curso: string; modalidad: string; mes: string; oficina: string; total: number}[] = [];
    const groups: Record<string, number> = {};

    filteredTrainings.forEach(tr => {
      const date = new Date(tr.fechaInicio);
      const mes = format(date, 'MMMM', { locale: es }).toUpperCase();
      const oficina = tr.asistenteMunicipio?.toUpperCase() === 'TOLUCA' || tr.asistenteValle === 'TOLUCA' ? 'TOLUCA' : 
                      tr.asistenteMunicipio?.toUpperCase() === 'ECATEPEC' ? 'ECATEPEC' :
                      tr.asistenteMunicipio?.toUpperCase() === 'NAUCALPAN' ? 'NAUCALPAN' :
                      tr.asistenteMunicipio?.toUpperCase() === 'NEZAHUALCOYOTL' ? 'NEZAHUALCÓYOTL' : (tr.asistenteValle || 'S/D');
      
      const key = `${tr.cursoNombre}|${tr.asistenteModalidad}|${mes}|${oficina}`;
      groups[key] = (groups[key] || 0) + 1;
    });

    Object.entries(groups).forEach(([key, val]) => {
      const [curso, modalidad, mes, oficina] = key.split('|');
      detailedAnalysis.push({ curso, modalidad, mes, oficina, total: val });
    });

    return { 
      total, 
      progressTotal,
      indicadorA,
      indicadorB,
      byRegionalOffice,
      detailedAnalysis: detailedAnalysis.sort((a,b) => b.total - a.total)
    };
  }, [filteredTrainings, goals.trainingGoal]);

  const accountStats = useMemo(() => {
    const accountRecords = filteredPrograms.filter(p => p.name === 'Cuentas Institucionales');
    let totalAccounts = 0;
    const modalityCounts: Record<string, number> = { 'DES': 0, 'DST': 0, 'DTV': 0 };

    accountRecords.forEach(rec => {
      const accounts = rec.asistentes || [];
      totalAccounts += accounts.length;
      
      let mod = rec.modalidad || '';
      if (!mod && rec.cct) {
        if (rec.cct.includes('DES')) mod = 'DES';
        else if (rec.cct.includes('DST')) mod = 'DST';
        else if (rec.cct.includes('DTV')) mod = 'DTV';
      }
      
      if (mod && modalityCounts.hasOwnProperty(mod)) {
        modalityCounts[mod] += accounts.length;
      }
    });

    const chartData = Object.entries(modalityCounts).map(([name, value]) => ({ 
      name, 
      value,
      fill: name === 'DES' ? '#621132' : name === 'DST' ? '#B38E5D' : '#9f2241'
    }));

    return {
      totalAccounts,
      modalityCounts,
      chartData
    };
  }, [filteredPrograms]);

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
               <h2 className="text-3xl font-black tracking-tight text-primary uppercase leading-none">PLANEACIÓN</h2>
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

          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100 min-w-[150px]">
            <Search className="h-4 w-4 text-slate-400" />
            <Input 
              placeholder="CCT..." 
              className="h-8 w-full text-[10px] font-black border-none focus-visible:ring-0 bg-transparent uppercase shadow-none" 
              value={cctFilter} 
              onChange={e => setCctFilter(e.target.value)} 
            />
          </div>

          <Select value={valleFilter} onValueChange={setValleFilter}>
            <SelectTrigger className="h-10 text-[10px] font-black w-[150px] rounded-xl border-slate-200 bg-white">
              <SelectValue placeholder="VALLE" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[10px] font-black uppercase">Todos los Valles</SelectItem>
              <SelectItem value="MEXICO" className="text-[10px] font-black uppercase">Valle de México</SelectItem>
              <SelectItem value="TOLUCA" className="text-[10px] font-black uppercase">Valle de Toluca</SelectItem>
            </SelectContent>
          </Select>

          <Select value={oficinaFilter} onValueChange={setOficinaFilter}>
            <SelectTrigger className="h-10 text-[10px] font-black w-[180px] rounded-xl border-slate-200 bg-white">
               <Building2 className="h-3.5 w-3.5 mr-2 text-primary" />
               <SelectValue placeholder="OFICINA REGIONAL" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[10px] font-black uppercase">Todas las Oficinas</SelectItem>
              <SelectItem value="Toluca" className="text-[10px] font-black uppercase">Toluca</SelectItem>
              <SelectItem value="Ecatepec" className="text-[10px] font-black uppercase">Ecatepec</SelectItem>
              <SelectItem value="Naucalpan" className="text-[10px] font-black uppercase">Naucalpan</SelectItem>
              <SelectItem value="Nezahualcóyotl" className="text-[10px] font-black uppercase">Nezahualcóyotl</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="sm" className="h-10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all" onClick={() => {setValleFilter('all'); setOficinaFilter('all'); setCctFilter(''); setDateStart(''); setDateEnd('')}}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Reiniciar Tablero
          </Button>
        </div>
      </Card>

      {activeReport === 'soporte' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="executive-card border-l-8 border-l-primary">
                <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-black uppercase text-primary">Indicador C</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Acciones estratégicas de asesoría y actualización técnica</CardDescription>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-primary text-white text-xs px-4 py-1">{supportStats.indicadorC.porcentaje}% Eficiencia Real</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-primary shadow-sm">
                          <Navigation className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Servicios Red Escolar</p>
                          <h4 className="text-xl font-black text-slate-700">{supportStats.indicadorC.redEscolar} Servicios</h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-accent shadow-sm">
                          <Radio className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Servicios Red Edusat</p>
                          <h4 className="text-xl font-black text-slate-700">{supportStats.indicadorC.redEdusat} Servicios</h4>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-200 shadow-inner flex flex-col justify-center">
                       <div className="flex justify-between items-end mb-2">
                          <p className="text-[10px] font-black uppercase text-slate-400">Logro Real vs Meta: {supportStats.indicadorC.meta}</p>
                          <p className="text-2xl font-black text-primary">{supportStats.indicadorC.alcanzado}</p>
                       </div>
                       <Progress value={supportStats.indicadorC.porcentaje} className="h-3 bg-white" />
                       <div className="mt-4 grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-white rounded-xl shadow-sm">
                             <p className="text-[8px] font-black text-slate-400 uppercase">Faltante</p>
                             <p className="text-lg font-black text-rose-500">{supportStats.indicadorC.faltante}</p>
                          </div>
                          <div className="text-center p-3 bg-white rounded-xl shadow-sm">
                             <p className="text-[8px] font-black text-slate-400 uppercase">Estatus</p>
                             <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20 text-primary mt-1">Auditado</Badge>
                          </div>
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="executive-card">
                  <CardHeader>
                    <CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Activity className="h-4 w-4" /> Análisis por Tipo de Servicio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart layout="vertical" data={supportStats.typesData} margin={{ left: 30, right: 30, top: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontBold: 900 }} width={110} />
                          <RechartsTooltip contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px', fontWeight: '900' }} />
                          <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={25}>
                              {supportStats.typesData.map((entry, index) => (
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
                      <Building2 className="h-4 w-4" /> Red Local: Distribución Territorial
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <Tabs defaultValue="municipio" className="w-full">
                        <TabsList className="grid grid-cols-2 w-full mb-4 bg-slate-50 h-8">
                           <TabsTrigger value="municipio" className="text-[9px] font-black uppercase">Por Municipio</TabsTrigger>
                           <TabsTrigger value="oficina" className="text-[9px] font-black uppercase">Por Oficina</TabsTrigger>
                        </TabsList>
                        <TabsContent value="municipio" className="h-[220px]">
                           <ResponsiveContainer width="100%" height="100%">
                              <RechartsBarChart data={supportStats.redLocalMunData}>
                                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 900 }} />
                                 <RechartsTooltip contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px', fontWeight: '900' }} />
                                 <Bar dataKey="value" fill="#B38E5D" radius={[4, 4, 0, 0]} />
                              </RechartsBarChart>
                           </ResponsiveContainer>
                        </TabsContent>
                        <TabsContent value="oficina" className="h-[220px]">
                           <ResponsiveContainer width="100%" height="100%">
                              <RechartsBarChart data={supportStats.redLocalOfiData}>
                                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900 }} />
                                 <RechartsTooltip contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px', fontWeight: '900' }} />
                                 <Bar dataKey="value" fill="#621132" radius={[4, 4, 0, 0]} />
                              </RechartsBarChart>
                           </ResponsiveContainer>
                        </TabsContent>
                     </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>

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
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Mantenimiento Realizado</p>
                     <h3 className="text-4xl font-black mt-2 text-emerald-600">{supportStats.serviciosMP + supportStats.serviciosMC}</h3>
                   </div>
                   <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-sm">
                     <CheckCircle2 className="h-6 w-6" />
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="text-[9px] font-black text-slate-500 uppercase">Prev: <span className="text-emerald-600">{supportStats.serviciosMP}</span></div>
                    <div className="text-[9px] font-black text-slate-500 uppercase">Corr: <span className="text-emerald-600">{supportStats.serviciosMC}</span></div>
                 </div>
              </Card>

              <Card className="executive-card p-6 border-l-4 border-rose-500">
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Estatus Pendiente</p>
                     <h3 className="text-4xl font-black mt-2 text-rose-600">{supportStats.statusData.find(s => s.name === 'PENDIENTES')?.value || 0}</h3>
                   </div>
                   <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm">
                     <AlertCircle className="h-6 w-6" />
                   </div>
                 </div>
              </Card>
              
              <Card className="executive-card p-6 border-l-4 border-slate-400">
                 <div className="flex justify-between items-start mb-4">
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Beneficiarios Directos</p>
                     <h3 className="text-3xl font-black mt-1 text-slate-700">{supportStats.beneficiados}</h3>
                   </div>
                   <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-sm">
                     <Users className="h-6 w-6" />
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Alumnos</p>
                      <p className="text-xl font-black text-primary">{supportStats.alumnos}</p>
                    </div>
                    <div className="space-y-1 border-l pl-4 border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Docentes</p>
                      <p className="text-xl font-black text-accent">{supportStats.docentes}</p>
                    </div>
                 </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {activeReport === 'capacitacion' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="executive-card md:col-span-2 p-6 flex flex-col justify-center text-center bg-white shadow-xl border-t-4 border-primary">
               <div className="mx-auto h-40 w-40 rounded-full border-[12px] border-primary/10 border-t-primary flex items-center justify-center shadow-inner relative">
                  <span className="text-4xl font-black text-primary">{trainingStats.progressTotal}%</span>
                  <Target className="absolute -top-1 -right-1 h-10 w-10 text-accent bg-white rounded-full p-2 shadow-lg border-2 border-accent/20" />
               </div>
               <div className="mt-8 space-y-1">
                 <h3 className="text-2xl font-black uppercase text-slate-900 leading-none">Meta Institucional 2026</h3>
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2">Cumplimiento consolidado sobre meta de {goals.trainingGoal} servidores</p>
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

            <Card className="md:col-span-2 executive-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" /> Planeación Anual 2026 por Región
                </CardTitle>
                <CardDescription className="text-[9px] font-bold uppercase">Proyección de Alcance Territorial</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={trainingStats.byRegionalOffice} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#64748b' }} />
                    <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px', fontWeight: '900' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                    <Bar name="Logro Real" dataKey="actual" radius={[4, 4, 0, 0]} barSize={40} fill="#621132" />
                    <Bar name="Meta Programada" dataKey="goal" radius={[4, 4, 0, 0]} barSize={40} fill="#B38E5D" fillOpacity={0.3} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <Card className="executive-card border-l-8 border-l-primary">
              <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black uppercase text-primary">Indicador A</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Docentes capacitados sobre TICCAD (Datos Operativos)</CardDescription>
                </div>
                <div className="text-right">
                  <Badge className="bg-primary text-white text-xs px-4 py-1">{trainingStats.indicadorA.porcentaje}% Cumplimiento Trimestral</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="text-[11px] font-black uppercase text-accent border-b pb-1">Distribución por Curso Real</h4>
                    <div className="space-y-4">
                      {trainingStats.indicadorA.cursos.map((curso, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase">
                            <span className="text-slate-600 truncate max-w-[80%]">{idx + 1}. {curso.name}</span>
                            <span className="text-primary">{curso.value} Asistentes</span>
                          </div>
                          <Progress value={trainingStats.indicadorA.alcanzado > 0 ? (curso.value / trainingStats.indicadorA.alcanzado) * 100 : 0} className="h-1.5 bg-slate-100" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-primary/5 rounded-[2rem] p-6 flex flex-col justify-center items-center text-center space-y-4 border border-primary/10 shadow-inner">
                    <Cpu className="h-10 w-10 text-primary opacity-40" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Docentes Alcanzados</p>
                      <h4 className="text-4xl font-black text-primary">{trainingStats.indicadorA.alcanzado}</h4>
                    </div>
                    <div className="w-full h-px bg-primary/10" />
                    <div className="grid grid-cols-2 w-full gap-4">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Faltante</p>
                        <p className="text-sm font-black text-accent">{trainingStats.indicadorA.faltante}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Meta Trim.</p>
                        <p className="text-sm font-black text-slate-600">{trainingStats.indicadorA.meta}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="executive-card border-l-8 border-l-accent">
              <CardHeader className="bg-slate-50/50">
                <CardTitle className="text-lg font-black uppercase text-accent">Indicador B</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estrategia de vinculación territorial "Más territorio, menos escritorio"</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                 <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1 space-y-4">
                       <div className="p-5 bg-accent/5 rounded-2xl border border-accent/10">
                          <h4 className="text-[11px] font-black text-accent uppercase mb-2 flex items-center gap-2">
                             <Globe className="h-4 w-4" /> Cobertura Institucional de Diagnósticos
                          </h4>
                          <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                             Se han realizado diagnósticos específicos en <strong>{trainingStats.indicadorB.total}</strong> centros de trabajo únicos, alineados con el Plan de Desarrollo 2023-2029.
                          </p>
                       </div>
                    </div>
                    <div className="h-32 w-32 rounded-full border-8 border-emerald-100 flex items-center justify-center bg-white shadow-xl relative">
                       <span className="text-2xl font-black text-emerald-600">{trainingStats.indicadorB.porcentaje}%</span>
                       <Badge className="absolute -bottom-2 bg-emerald-500 text-white border-none text-[8px] font-black uppercase">En Tiempo</Badge>
                    </div>
                 </div>
              </CardContent>
            </Card>

            <Card className="executive-card border-t-4 border-primary">
              <CardHeader className="bg-slate-50/30">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                  <TableIcon className="h-4 w-4" /> Desglose Operativo de Atención Técnica
                </CardTitle>
                <CardDescription className="text-[9px] font-bold uppercase text-muted-foreground">Relación detallada: Nombre del Curso + Modalidad (Mes) + Oficina Regional</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader className="bg-slate-100/50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="text-[9px] font-black uppercase pl-8 h-12">Nombre del Curso / Taller</TableHead>
                        <TableHead className="text-[9px] font-black uppercase h-12">Modalidad</TableHead>
                        <TableHead className="text-[9px] font-black uppercase h-12">Mes Atención</TableHead>
                        <TableHead className="text-[9px] font-black uppercase h-12">Oficina que Atendió</TableHead>
                        <TableHead className="text-[9px] font-black uppercase h-12 text-center">Impacto (Servidores)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trainingStats.detailedAnalysis.length > 0 ? trainingStats.detailedAnalysis.map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-slate-50 transition-colors group">
                          <TableCell className="pl-8 py-4">
                            <span className="text-[10px] font-black text-slate-700 uppercase leading-tight">{item.curso}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[8px] font-black uppercase border-slate-200 bg-white">
                              {item.modalidad}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-[10px] font-bold text-accent uppercase">{item.mes}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                               <Building2 className="h-3 w-3 text-primary opacity-40" />
                               <span className="text-[9px] font-black text-slate-500 uppercase">{item.oficina}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center h-7 w-12 rounded-lg bg-primary/5 text-primary text-[11px] font-black border border-primary/10">
                              {item.total}
                            </span>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-20 opacity-30">
                            <div className="flex flex-col items-center gap-2">
                              <Search className="h-10 w-10 text-slate-300" />
                              <p className="text-[10px] font-black uppercase">Sin registros operativos para mostrar</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeReport === 'programas' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {['Biblioteca Digital', 'Cuentas Institucionales', 'Geoposición', 'Conoce mi Escuela', 'ATRES'].map((name) => {
              const records = filteredPrograms.filter(p => p.name === name);
              const value = new Set(records.map(p => p.cct)).size;
              const percentage = Math.min(100, Math.round((value / TOTAL_UNIVERSE) * 100));
              return (
                <Card key={name} className="executive-card p-6 border-l-4 group hover:scale-[1.02] transition-all" style={{ borderLeftColor: percentage > 50 ? '#621132' : '#B38E5D' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest truncate max-w-[80px]">{name}</p>
                      <h3 className="text-3xl font-black text-slate-900 mt-1">{value}</h3>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shadow-inner">
                      <span className="text-[10px] font-black text-primary">{percentage}%</span>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-1.5 mt-4" />
                </Card>
              )
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="executive-card md:col-span-2 border-l-8 border-l-[#9f2241]">
              <CardHeader className="bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-black uppercase text-primary flex items-center gap-3">
                       <UserCheck className="h-6 w-6" /> Estadística de Cuentas Institucionales
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Identidad Digital de Servidores Públicos</CardDescription>
                  </div>
                  <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Total Cuentas</p>
                    <h4 className="text-2xl font-black text-primary mt-1">{accountStats.totalAccounts}</h4>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                  {Object.entries(accountStats.modalityCounts).map(([mod, count]) => (
                    <div key={mod} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 shadow-inner group hover:bg-white transition-all relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <UserCheck className="h-12 w-12" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{mod === 'DES' ? 'Generales' : mod === 'DST' ? 'Técnicas' : 'Telesecundarias'}</p>
                      <h4 className="text-3xl font-black text-slate-800 mt-2">{count}</h4>
                      <Badge variant="outline" className="mt-3 text-[8px] font-black uppercase bg-white border-primary/10 text-primary">{mod}</Badge>
                    </div>
                  ))}
                </div>

                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={accountStats.chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900 }} />
                      <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '11px', fontWeight: '900' }} />
                      <Bar name="Cuentas Activas" dataKey="value" radius={[10, 10, 0, 0]} barSize={50}>
                        {accountStats.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="executive-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Cobertura Institucional
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={['Biblioteca Digital', 'Cuentas Institucionales', 'Geoposición', 'Conoce mi Escuela', 'ATRES'].map(name => ({ name, value: new Set(filteredPrograms.filter(p => p.name === name).map(p => p.cct)).size }))} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900 }} />
                    <YAxis dataKey="value" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px', fontWeight: 900 }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40} fill="#621132" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 p-4 bg-accent/5 border border-accent/10 rounded-2xl animate-pulse">
         <AlertCircle className="h-5 w-5 text-accent" />
         <p className="text-[10px] font-black uppercase tracking-[0.15em] text-accent">
            Reporte ejecutivo actualizado en tiempo real conforme a la captura operativa del sistema integral COEES. Planeación Anual 2026 Auditada.
         </p>
      </div>
    </div>
  )
}
