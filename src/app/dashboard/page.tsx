'use client'
import { useEffect, useState, useMemo, useCallback } from 'react'
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
import { Label } from '@/components/ui/label'
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

  const syncData = useCallback(() => {
    // SOPORTE
    const rawTickets = localStorage.getItem('support_tickets_full');
    if (rawTickets) {
      setTickets(JSON.parse(rawTickets));
    } else {
      setTickets(supportData);
      localStorage.setItem('support_tickets_full', JSON.stringify(supportData));
    }

    // CAPACITACIÓN
    const rawTrainings = localStorage.getItem('training_records_full');
    setTrainings(rawTrainings ? JSON.parse(rawTrainings) : []);

    // PROGRAMAS
    const rawPrograms = localStorage.getItem('programs_full_v24');
    if (rawPrograms) {
      setPrograms(JSON.parse(rawPrograms));
    } else {
      setPrograms(programsData);
      localStorage.setItem('programs_full_v24', JSON.stringify(programsData));
    }

    // METAS
    const storedGoals = localStorage.getItem('dashboard_goals');
    if (storedGoals) setGoals(JSON.parse(storedGoals));
  }, []);

  useEffect(() => {
    setMounted(true)
    syncData()

    window.addEventListener('storage', syncData)
    window.addEventListener('focus', syncData)
    
    return () => {
      window.removeEventListener('storage', syncData)
      window.removeEventListener('focus', syncData)
    }
  }, [syncData])

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
      const matchOficina = oficinaFilter === 'all' || (tr.asistenteValle && tr.asistenteValle.toUpperCase() === oficinaFilter.toUpperCase()) || (tr.asistenteMunicipio && tr.asistenteMunicipio.toUpperCase() === oficinaFilter.toUpperCase());
      const matchDateStart = !dateStart || tr.fechaInicio >= dateStart;
      const matchDateEnd = !dateEnd || tr.fechaInicio <= dateEnd;
      const matchCct = !cctFilter || (tr.asistenteCCT && tr.asistenteCCT.toUpperCase().includes(cctFilter.toUpperCase()));
      return matchValle && matchOficina && matchDateStart && matchDateEnd && matchCct;
    });
  }, [trainings, valleFilter, oficinaFilter, dateStart, dateEnd, cctFilter]);

  const supportStats = useMemo(() => {
    const atendidos = filteredTickets.filter(t => t.status === 'atendido').length;
    const proceso = filteredTickets.filter(t => t.status === 'en proceso').length;
    const pendientes = filteredTickets.filter(t => t.status === 'pendiente').length;
    
    const serviciosMP = filteredTickets.reduce((acc, t) => acc + (t.serviciosMP || 0), 0);
    const serviciosMC = filteredTickets.reduce((acc, t) => acc + (t.serviciosMC || 0), 0);

    const redEscolarCount = filteredTickets.filter(t => t.tipoIncidencia === 'red local').length;
    const redEdusatCount = filteredTickets.filter(t => t.tipoIncidencia === 'red edusat').length;
    const teleplantelesCount = filteredTickets.filter(t => t.tipoIncidencia === 'teleplanteles').length;

    const alcanzadoC = redEscolarCount + redEdusatCount;
    const porcentajeC = goals.supportGoal > 0 ? Math.min(100, parseFloat(((alcanzadoC / goals.supportGoal) * 100).toFixed(2))) : 0;

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
        meta: goals.supportGoal,
        porcentaje: porcentajeC,
        faltante: Math.max(0, goals.supportGoal - alcanzadoC),
        redEscolar: redEscolarCount,
        redEdusat: redEdusatCount
      }
    };
  }, [filteredTickets, goals.supportGoal]);

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
    <div className="space-y-4 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
             <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/5">
                <LayoutDashboard className="h-5 w-5 text-primary" />
             </div>
             <div>
               <h2 className="text-2xl font-black tracking-tight text-primary uppercase leading-none">PLANEACIÓN</h2>
               <p className="text-muted-foreground font-black text-[8px] tracking-[0.2em] uppercase">Análisis Técnico Operativo COEES</p>
             </div>
          </div>
        </div>
        
        <Tabs value={activeReport} onValueChange={setActiveReport} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-3 w-full md:w-[400px] h-10 bg-white/50 backdrop-blur-md border border-slate-200 p-1 rounded-xl shadow-sm">
            <TabsTrigger value="soporte" className="gap-1.5 text-[9px] font-black uppercase rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <Wrench className="h-3.5 w-3.5" /> Soporte
            </TabsTrigger>
            <TabsTrigger value="capacitacion" className="gap-1.5 text-[9px] font-black uppercase rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <GraduationCap className="h-3.5 w-3.5" /> Capacitación
            </TabsTrigger>
            <TabsTrigger value="programas" className="gap-1.5 text-[9px] font-black uppercase rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <Briefcase className="h-3.5 w-3.5" /> Programas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="executive-card p-3 bg-white border-none shadow-lg">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
            <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <Filter className="h-3 w-3" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Filtros de Análisis</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-[7px] font-black uppercase text-slate-400 ml-1">Periodo</Label>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shadow-inner">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <Input type="date" className="h-6 w-28 text-[9px] font-black border-none focus-visible:ring-0 bg-transparent p-0" value={dateStart} onChange={e => setDateStart(e.target.value)} />
                <span className="text-[8px] font-black text-slate-300">/</span>
                <Input type="date" className="h-6 w-28 text-[9px] font-black border-none focus-visible:ring-0 bg-transparent p-0" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[7px] font-black uppercase text-slate-400 ml-1">Localizador CCT</Label>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shadow-inner min-w-[160px]">
                <Search className="h-3.5 w-3.5 text-slate-400" />
                <Input 
                  placeholder="INGRESAR CCT..." 
                  className="h-6 w-full text-[9px] font-black border-none focus-visible:ring-0 bg-transparent uppercase shadow-none p-0" 
                  value={cctFilter} 
                  onChange={e => setCctFilter(e.target.value)} 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[7px] font-black uppercase text-slate-400 ml-1">Valle</Label>
              <Select value={valleFilter} onValueChange={setValleFilter}>
                <SelectTrigger className="h-9 text-[9px] font-black w-[130px] rounded-xl border-slate-100 bg-slate-50 shadow-inner">
                  <SelectValue placeholder="VALLE" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-[9px] font-black uppercase">Todos los Valles</SelectItem>
                  <SelectItem value="MEXICO" className="text-[9px] font-black uppercase">V. de México</SelectItem>
                  <SelectItem value="TOLUCA" className="text-[9px] font-black uppercase">V. de Toluca</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[7px] font-black uppercase text-slate-400 ml-1">Oficina</Label>
              <Select value={oficinaFilter} onValueChange={setOficinaFilter}>
                <SelectTrigger className="h-9 text-[9px] font-black w-[170px] rounded-xl border-slate-100 bg-slate-50 shadow-inner">
                   <div className="flex items-center gap-2">
                     <Building2 className="h-3 w-3 text-primary" />
                     <SelectValue placeholder="OFICINA REGIONAL" />
                   </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-[9px] font-black uppercase">Todas</SelectItem>
                  <SelectItem value="Toluca" className="text-[9px] font-black uppercase">Toluca</SelectItem>
                  <SelectItem value="Ecatepec" className="text-[9px] font-black uppercase">Ecatepec</SelectItem>
                  <SelectItem value="Naucalpan" className="text-[9px] font-black uppercase">Naucalpan</SelectItem>
                  <SelectItem value="Nezahualcóyotl" className="text-[9px] font-black uppercase">Nezahualcóyotl</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end h-full pt-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 px-3 text-[8px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 rounded-xl transition-all" 
                onClick={() => {setValleFilter('all'); setOficinaFilter('all'); setCctFilter(''); setDateStart(''); setDateEnd('')}}
              >
                <RefreshCcw className="h-3 w-3 mr-1.5" /> Reiniciar
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {activeReport === 'soporte' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 space-y-4">
              <Card className="executive-card border-l-4 border-l-primary">
                <CardHeader className="bg-slate-50/50 p-4 flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <CardTitle className="text-sm font-black uppercase text-primary">Indicador C: Acciones de Soporte</CardTitle>
                    <CardDescription className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">Actualización técnica de infraestructura</CardDescription>
                  </div>
                  <Badge className="bg-primary text-white text-[9px] font-black px-3 py-0.5">{supportStats.indicadorC.porcentaje}% Logro</Badge>
                </CardHeader>
                <CardContent className="p-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-primary shadow-sm">
                          <Navigation className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase">Red Escolar</p>
                          <h4 className="text-sm font-black text-slate-700">{supportStats.indicadorC.redEscolar}</h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-accent shadow-sm">
                          <Radio className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase">Red Edusat</p>
                          <h4 className="text-sm font-black text-slate-700">{supportStats.indicadorC.redEdusat}</h4>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-inner">
                       <div className="flex justify-between items-end mb-1.5">
                          <p className="text-[8px] font-black uppercase text-slate-400">Meta Anual: {supportStats.indicadorC.meta}</p>
                          <p className="text-lg font-black text-primary leading-none">{supportStats.indicadorC.alcanzado}</p>
                       </div>
                       <Progress value={supportStats.indicadorC.porcentaje} className="h-2 bg-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="executive-card">
                  <CardHeader className="p-4 pb-1">
                    <CardTitle className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5" /> Servicios por Tipo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[200px] p-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart layout="vertical" data={supportStats.typesData} margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 7, fontBold: 900 }} width={80} />
                          <RechartsTooltip contentStyle={{ borderRadius: '0.5rem', border: 'none', fontSize: '9px', fontWeight: '900' }} />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={15}>
                              {supportStats.typesData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                          </Bar>
                        </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="executive-card">
                  <CardHeader className="p-4 pb-1">
                    <CardTitle className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5" /> Distribución Territorial
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                     <Tabs defaultValue="municipio" className="w-full">
                        <TabsList className="grid grid-cols-2 w-full mb-2 bg-slate-50 h-7 p-0.5">
                           <TabsTrigger value="municipio" className="text-[8px] font-black uppercase h-6">Muns</TabsTrigger>
                           <TabsTrigger value="oficina" className="text-[8px] font-black uppercase h-6">Ofis</TabsTrigger>
                        </TabsList>
                        <TabsContent value="municipio" className="h-[160px]">
                           <ResponsiveContainer width="100%" height="100%">
                              <RechartsBarChart data={supportStats.redLocalMunData}>
                                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 6, fontWeight: 900 }} />
                                 <RechartsTooltip contentStyle={{ borderRadius: '0.5rem', border: 'none', fontSize: '8px', fontWeight: '900' }} />
                                 <Bar dataKey="value" fill="#B38E5D" radius={[2, 2, 0, 0]} barSize={15} />
                              </RechartsBarChart>
                           </ResponsiveContainer>
                        </TabsContent>
                        <TabsContent value="oficina" className="h-[160px]">
                           <ResponsiveContainer width="100%" height="100%">
                              <RechartsBarChart data={supportStats.redLocalOfiData}>
                                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 6, fontWeight: 900 }} />
                                 <RechartsTooltip contentStyle={{ borderRadius: '0.5rem', border: 'none', fontSize: '8px', fontWeight: '900' }} />
                                 <Bar dataKey="value" fill="#621132" radius={[2, 2, 0, 0]} barSize={15} />
                              </RechartsBarChart>
                           </ResponsiveContainer>
                        </TabsContent>
                     </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Card className="executive-card p-4 bg-primary text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform duration-500">
                   <Wrench className="h-14 w-14" />
                 </div>
                 <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80">Folios Totales</p>
                 <h3 className="text-3xl font-black mt-1 leading-none">{supportStats.total}</h3>
                 <Badge className="bg-white/20 text-white border-none text-[7px] font-black mt-2">Ciclo 2026</Badge>
              </Card>

              <Card className="executive-card p-4 border-l-4 border-emerald-500 bg-white">
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">Mantenimientos</p>
                     <h3 className="text-2xl font-black mt-1 text-emerald-600">{supportStats.serviciosMP + supportStats.serviciosMC}</h3>
                   </div>
                   <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                 </div>
                 <div className="flex gap-3 mt-2 border-t border-slate-50 pt-1.5">
                    <span className="text-[7px] font-black text-slate-500 uppercase">P: <b className="text-emerald-600">{supportStats.serviciosMP}</b></span>
                    <span className="text-[7px] font-black text-slate-500 uppercase">C: <b className="text-emerald-600">{supportStats.serviciosMC}</b></span>
                 </div>
              </Card>

              <Card className="executive-card p-4 border-l-4 border-rose-500 bg-white">
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">Pendientes</p>
                     <h3 className="text-2xl font-black mt-1 text-rose-600">{supportStats.statusData.find(s => s.name === 'PENDIENTES')?.value || 0}</h3>
                   </div>
                   <AlertCircle className="h-5 w-5 text-rose-500" />
                 </div>
              </Card>
              
              <Card className="executive-card p-4 border-l-4 border-slate-400 bg-white">
                 <div className="flex justify-between items-start mb-2">
                   <div>
                     <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">Beneficiarios</p>
                     <h3 className="text-xl font-black mt-0.5 text-slate-700">{supportStats.beneficiados}</h3>
                   </div>
                   <Users className="h-5 w-5 text-slate-400" />
                 </div>
                 <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
                    <div>
                      <p className="text-[6px] font-black text-slate-400 uppercase">Alums</p>
                      <p className="text-sm font-black text-primary">{supportStats.alumnos}</p>
                    </div>
                    <div className="border-l pl-2 border-slate-100">
                      <p className="text-[6px] font-black text-slate-400 uppercase">Docs</p>
                      <p className="text-sm font-black text-accent">{supportStats.docentes}</p>
                    </div>
                 </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {activeReport === 'capacitacion' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="executive-card p-4 flex flex-col justify-center text-center bg-white shadow-lg border-t-4 border-primary">
               <div className="mx-auto h-28 w-28 rounded-full border-[8px] border-primary/10 border-t-primary flex items-center justify-center relative">
                  <span className="text-xl font-black text-primary">{trainingStats.progressTotal}%</span>
                  <Target className="absolute -top-1 -right-1 h-6 w-6 text-accent bg-white rounded-full p-1 shadow-md border border-accent/20" />
               </div>
               <div className="mt-4 space-y-1">
                 <h3 className="text-base font-black uppercase text-slate-900 leading-none">Meta 2026</h3>
                 <p className="text-[7px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">Avance sobre {goals.trainingGoal} servidores</p>
               </div>
               <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                     <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Real</p>
                     <p className="text-xl font-black text-primary">{trainingStats.total}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                     <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Faltante</p>
                     <p className="text-xl font-black text-accent">{Math.max(0, goals.trainingGoal - trainingStats.total)}</p>
                  </div>
               </div>
            </Card>

            <Card className="md:col-span-3 executive-card">
              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <ClipboardList className="h-3.5 w-3.5" /> Planeación Anual por Región
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={trainingStats.byRegionalOffice} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 900, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 900, fill: '#64748b' }} />
                    <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '0.5rem', border: 'none', fontSize: '9px', fontWeight: '900' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '8px', fontWeight: 'bold' }} />
                    <Bar name="Real" dataKey="actual" radius={[2, 2, 0, 0]} barSize={30} fill="#621132" />
                    <Bar name="Meta" dataKey="goal" radius={[2, 2, 0, 0]} barSize={30} fill="#B38E5D" fillOpacity={0.2} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="executive-card border-l-4 border-l-primary">
              <CardHeader className="bg-slate-50/50 p-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-black uppercase text-primary">Indicador A: TICCAD</CardTitle>
                  <Badge className="bg-primary text-white text-[8px] font-black px-2">{trainingStats.indicadorA.porcentaje}% Trimestral</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {trainingStats.indicadorA.cursos.slice(0, 3).map((curso, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-600">
                      <span className="truncate max-w-[70%]">{idx + 1}. {curso.name}</span>
                      <span className="text-primary">{curso.value} Asists</span>
                    </div>
                    <Progress value={trainingStats.indicadorA.alcanzado > 0 ? (curso.value / trainingStats.indicadorA.alcanzado) * 100 : 0} className="h-1 bg-slate-100" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="executive-card border-l-4 border-l-accent">
              <CardHeader className="bg-slate-50/50 p-4">
                <CardTitle className="text-sm font-black uppercase text-accent">Indicador B: Territorio</CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 p-3 bg-accent/5 rounded-xl border border-accent/10">
                  <p className="text-[9px] font-semibold text-slate-700 leading-tight">
                    Cobertura en <strong>{trainingStats.indicadorB.total}</strong> centros únicos diagnosticados.
                  </p>
                </div>
                <div className="h-16 w-16 rounded-full border-4 border-emerald-100 flex items-center justify-center bg-white shadow-md relative shrink-0">
                  <span className="text-xs font-black text-emerald-600">{trainingStats.indicadorB.porcentaje}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeReport === 'programas' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {['Biblioteca Digital', 'Cuentas Institucionales', 'Geoposición', 'Conoce mi Escuela', 'ATRES'].map((name) => {
              const records = filteredPrograms.filter(p => p.name === name);
              const value = new Set(records.map(p => p.cct)).size;
              const percentage = Math.min(100, Math.round((value / TOTAL_UNIVERSE) * 100));
              return (
                <Card key={name} className="executive-card p-3 border-l-4 border-l-slate-200 bg-white group hover:scale-105 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[7px] font-black uppercase text-muted-foreground tracking-widest truncate max-w-[80px]">{name}</p>
                      <h3 className="text-xl font-black text-slate-900 mt-0.5">{value}</h3>
                    </div>
                    <span className="text-[8px] font-black text-primary bg-primary/5 px-1.5 rounded">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="h-1 mt-2 bg-slate-50" />
                </Card>
              )
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="executive-card md:col-span-2 border-l-4 border-l-primary bg-white">
              <CardHeader className="bg-slate-50/50 p-4 flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <CardTitle className="text-sm font-black uppercase text-primary">Cuentas Institucionales</CardTitle>
                    <CardDescription className="text-[8px] font-bold uppercase text-muted-foreground">Identidad Digital Consolidada</CardDescription>
                  </div>
                  <div className="bg-white px-4 py-1.5 rounded-xl shadow-sm border border-slate-100 text-center">
                    <p className="text-[7px] font-black text-slate-400 uppercase leading-none">Total</p>
                    <h4 className="text-lg font-black text-primary mt-0.5">{accountStats.totalAccounts}</h4>
                  </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {Object.entries(accountStats.modalityCounts).map(([mod, count]) => (
                    <div key={mod} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden group">
                      <p className="text-[7px] font-black text-slate-400 uppercase leading-none">{mod === 'DES' ? 'Grales' : mod === 'DST' ? 'Técs' : 'Teles'}</p>
                      <h4 className="text-xl font-black text-slate-800 mt-1">{count}</h4>
                      <Badge variant="outline" className="mt-1.5 text-[6px] font-black border-primary/10 text-primary h-4">{mod}</Badge>
                    </div>
                  ))}
                </div>

                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={accountStats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900 }} />
                      <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '0.5rem', border: 'none', fontSize: '9px', fontWeight: '900' }} />
                      <Bar name="Cuentas" dataKey="value" radius={[4, 4, 0, 0]} barSize={35}>
                        {accountStats.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="executive-card bg-white">
              <CardHeader className="p-4">
                <CardTitle className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5" /> Cobertura Módulos
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[350px] p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={['Biblioteca Digital', 'Cuentas Institucionales', 'Geoposición', 'Conoce mi Escuela', 'ATRES'].map(name => ({ name: name.split(' ')[0], value: new Set(filteredPrograms.filter(p => p.name === name).map(p => p.cct)).size }))} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 900 }} />
                    <YAxis dataKey="value" axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 900 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: '0.5rem', border: 'none', fontSize: '9px', fontWeight: '900' }} />
                    <Bar dataKey="value" radius={[2, 2, 0, 0]} barSize={25} fill="#621132" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 p-2 bg-accent/5 border border-accent/10 rounded-xl">
         <AlertCircle className="h-3 w-3 text-accent" />
         <p className="text-[8px] font-black uppercase tracking-[0.1em] text-accent">
            Información operativa auditada en tiempo real. Sistema Integral COEES 2026.
         </p>
      </div>
    </div>
  )
}
