'use client'
import { useEffect, useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { 
  Network, 
  Wrench, 
  Users, 
  CheckCircle2, 
  Filter, 
  RefreshCcw,
  GraduationCap,
  Briefcase,
  TrendingUp,
  Clock,
  Image as ImageIcon,
  FileText,
  Circle,
  ExternalLink,
  Search,
  Building2,
  Settings2,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Zap,
  Calendar,
  Layers,
  Layout
} from 'lucide-react'
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
import { supportData, type SupportTicket, type TrainingRecord, type ProgramStatus, programsData } from '@/lib/planning-data'
import { schoolsDirectory } from '@/lib/schools-directory'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const TARGET_UNIVERSE_DATA = [
  { modalidad: 'SECUNDARIA GENERAL', valle: 'MEXICO', total: 175, codes: ['DES', 'DSN'] },
  { modalidad: 'SECUNDARIA GENERAL', valle: 'TOLUCA', total: 77, codes: ['DES', 'DSN'] },
  { modalidad: 'SECUNDARIA TECNICA', valle: 'MEXICO', total: 128, codes: ['DST'] },
  { modalidad: 'SECUNDARIA TECNICA', valle: 'TOLUCA', total: 112, codes: ['DST'] },
  { modalidad: 'TELESECUNDARIA', valle: 'MEXICO', total: 144, codes: ['DTV', 'FTV'] },
  { modalidad: 'TELESECUNDARIA', valle: 'TOLUCA', total: 194, codes: ['DTV', 'FTV'] },
];

// Metas regionales 2026 basadas en la tabla proporcionada
const REGIONAL_METAS_2026 = {
  'TOLUCA': 2156, // 539 * 4 trimestres
  'MEXICO': 3444  // (215 Neza + 215 Ecatepec + 431 Naucalpan) * 4 trimestres
};

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
  
  const [evidenceToView, setEvidenceToView] = useState<{ type: 'pdf' | 'gallery', data: string | string[], title: string } | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
  // Default values set to Año Fiscal 2026 with 5600 total goal
  const [goals, setGoals] = useState<DashboardGoals>({
    periodType: 'Año Fiscal',
    periodName: '2026',
    supportGoal: 500,
    trainingGoal: 5600
  })

  // Filters
  const [valleFilter, setValleFilter] = useState('all')
  const [municipioFilter, setMunicipioFilter] = useState('all')
  const [modalidadFilter, setModalidadFilter] = useState('all')
  const [oficinaFilter, setOficinaFilter] = useState('all')
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

  const saveGoals = () => {
    localStorage.setItem('dashboard_goals', JSON.stringify(goals))
    setIsSettingsOpen(false)
  }

  const filterOptions = useMemo(() => {
    const valles = Array.from(new Set(schoolsDirectory.map(s => s.valle))).sort();
    const listByValle = valleFilter === 'all' ? schoolsDirectory : schoolsDirectory.filter(s => (s.valle || '').toUpperCase() === valleFilter.toUpperCase());
    const modalidades = Array.from(new Set(listByValle.map(s => s.modalidad))).sort();
    const municipios = Array.from(new Set(listByValle.map(s => s.municipio))).sort();
    return { valles, modalidades, municipios };
  }, [valleFilter]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchValle = valleFilter === 'all' || (t.valle && t.valle.toUpperCase() === valleFilter.toUpperCase());
      const matchMunicipio = municipioFilter === 'all' || (t.municipio && t.municipio.toUpperCase() === municipioFilter.toUpperCase());
      const matchModalidad = modalidadFilter === 'all' || (t.modalidad && t.modalidad.toUpperCase() === modalidadFilter.toUpperCase());
      const matchOficina = oficinaFilter === 'all' || t.oficinaRegionalAtencion === oficinaFilter;
      const matchDateStart = !dateStart || t.fechaEntrada >= dateStart;
      const matchDateEnd = !dateEnd || t.fechaEntrada <= dateEnd;
      return matchValle && matchMunicipio && matchModalidad && matchOficina && matchDateStart && matchDateEnd;
    });
  }, [tickets, valleFilter, municipioFilter, modalidadFilter, oficinaFilter, dateStart, dateEnd]);

  const filteredTrainings = useMemo(() => {
    return trainings.filter(tr => {
      const matchValle = valleFilter === 'all' || (tr.asistenteValle && tr.asistenteValle.toUpperCase() === valleFilter.toUpperCase());
      const matchMunicipio = municipioFilter === 'all' || (tr.asistenteMunicipio && tr.asistenteMunicipio.toUpperCase() === municipioFilter.toUpperCase());
      const matchModalidad = modalidadFilter === 'all' || (tr.asistenteModalidad && tr.asistenteModalidad.toUpperCase() === modalidadFilter.toUpperCase());
      const matchDateStart = !dateStart || tr.fechaInicio >= dateStart;
      const matchDateEnd = !dateEnd || tr.fechaInicio <= dateEnd;
      return matchValle && matchMunicipio && matchModalidad && matchDateStart && matchDateEnd;
    });
  }, [trainings, valleFilter, municipioFilter, modalidadFilter, dateStart, dateEnd]);

  const filteredPrograms = useMemo(() => {
    return programs.filter(p => {
      const matchDateStart = !dateStart || (p.date && p.date >= dateStart);
      const matchDateEnd = !dateEnd || (p.date && p.date <= dateEnd);
      return matchDateStart && matchDateEnd;
    });
  }, [programs, dateStart, dateEnd]);

  const stats = useMemo(() => {
    const atendidos = filteredTickets.filter(t => t.status === 'atendido').length
    const enProceso = filteredTickets.filter(t => t.status === 'en proceso').length
    const pendientes = filteredTickets.filter(t => t.status === 'pendiente').length
    const supportSetes = filteredTickets.filter(t => t.setes === 'S').length

    return {
      statusData: [
        { name: 'Atendidos', value: atendidos, fill: '#10b981' },
        { name: 'En Proceso', value: enProceso, fill: '#f59e0b' },
        { name: 'Pendientes', value: pendientes, fill: '#f43f5e' },
      ],
      supportSetesData: [
        { name: 'Semana SETES', value: supportSetes, fill: '#8b5cf6' },
        { name: 'Soporte Regular', value: filteredTickets.length - supportSetes, fill: '#cbd5e1' },
      ],
      trainingByValle: [
        { 
          name: 'MÉXICO', 
          value: filteredTrainings.filter(tr => tr.asistenteValle === 'MEXICO').length, 
          goal: REGIONAL_METAS_2026['MEXICO'],
          fill: '#6366f1' 
        },
        { 
          name: 'TOLUCA', 
          value: filteredTrainings.filter(tr => tr.asistenteValle === 'TOLUCA').length, 
          goal: REGIONAL_METAS_2026['TOLUCA'],
          fill: '#ec4899' 
        },
      ],
      trainingByGender: [
        { name: 'MASCULINO', value: filteredTrainings.filter(tr => tr.asistenteGenero === 'MASCULINO').length, fill: '#0ea5e9' },
        { name: 'FEMENINO', value: filteredTrainings.filter(tr => tr.asistenteGenero === 'FEMENINO').length, fill: '#f43f5e' },
      ],
      trainingBySetes: [
        { name: 'SETES', value: filteredTrainings.filter(tr => tr.setes === 'S').length, fill: '#8b5cf6' },
        { name: 'OTRO', value: filteredTrainings.filter(tr => tr.setes === 'N').length, fill: '#94a3b8' },
      ],
    }
  }, [filteredTickets, filteredTrainings]);

  const UNIVERSE_STATS = useMemo(() => {
    return TARGET_UNIVERSE_DATA.map(target => {
      const atendidas = filteredTickets.filter(t => {
        const matchValle = (target.valle === 'MEXICO' && (t.valle?.toUpperCase() === 'MEXICO' || t.valle?.toUpperCase() === 'M')) ||
                          (target.valle === 'TOLUCA' && (t.valle?.toUpperCase() === 'TOLUCA' || t.valle?.toUpperCase() === 'T'));
        const matchModalidad = target.codes.some(code => t.modalidad?.toUpperCase() === code.toUpperCase());
        return matchValle && matchModalidad;
      }).length;
      return { ...target, atendidas };
    });
  }, [filteredTickets]);

  const clearFilters = () => {
    setValleFilter('all');
    setMunicipioFilter('all');
    setModalidadFilter('all');
    setOficinaFilter('all');
    setDateStart('');
    setDateEnd('');
  };

  if (!mounted) return null

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-black tracking-tight text-primary uppercase leading-none">PLANEACIÓN</h2>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <p className="text-muted-foreground font-black text-[11px] tracking-[0.2em] uppercase">
                Análisis Operativo {goals.periodType}: {goals.periodName}
              </p>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/5 text-primary rounded-xl" onClick={() => setIsSettingsOpen(true)}>
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Tabs value={activeReport} onValueChange={setActiveReport} className="w-full md:auto">
            <TabsList className="grid grid-cols-3 w-full md:w-[500px] bg-slate-100 p-1.5 h-14 rounded-2xl shadow-inner border border-primary/5">
              <TabsTrigger value="soporte" className="gap-3 text-[10px] font-black uppercase tracking-wider rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg">
                <Wrench className="h-4 w-4" /> Soporte
              </TabsTrigger>
              <TabsTrigger value="capacitacion" className="gap-3 text-[10px] font-black uppercase tracking-wider rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg">
                <GraduationCap className="h-4 w-4" /> Capacitación
              </TabsTrigger>
              <TabsTrigger value="programas" className="gap-3 text-[10px] font-black uppercase tracking-wider rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg">
                <Briefcase className="h-4 w-4" /> Programas
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card className="p-6 rounded-[2rem] border-none bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
            <Filter className="h-24 w-24 text-primary" />
          </div>
          <div className="flex flex-wrap items-center gap-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/5">
                <Filter className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[11px] font-black uppercase text-primary tracking-widest">Filtros de Inteligencia:</span>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-inner">
               <div className="flex items-center gap-2 pl-3">
                 <Calendar className="h-4 w-4 text-slate-400" />
                 <Input 
                    type="date" 
                    className="h-9 text-[11px] font-black border-none focus-visible:ring-0 w-[130px] bg-transparent" 
                    value={dateStart} 
                    onChange={(e) => setDateStart(e.target.value)}
                  />
               </div>
               <span className="text-[10px] font-black text-slate-300">AL</span>
               <Input 
                  type="date" 
                  className="h-9 text-[11px] font-black border-none focus-visible:ring-0 w-[130px] bg-transparent" 
                  value={dateEnd} 
                  onChange={(e) => setDateEnd(e.target.value)}
                />
            </div>

            <Select value={valleFilter} onValueChange={setValleFilter}>
              <SelectTrigger className="h-12 text-[11px] font-black w-[150px] bg-white rounded-2xl border-slate-200 shadow-sm transition-all focus:ring-primary/20">
                <SelectValue placeholder="VALLE" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all" className="text-[11px] font-black">VALLES (TODOS)</SelectItem>
                {filterOptions.valles.map(v => (
                  <SelectItem key={v} value={v} className="text-[11px] font-black uppercase">{v === 'T' ? 'TOLUCA' : v === 'M' ? 'MÉXICO' : v}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={modalidadFilter} onValueChange={setValleFilter}>
              <SelectTrigger className="h-12 text-[11px] font-black w-[200px] bg-white rounded-2xl border-slate-200 shadow-sm transition-all focus:ring-primary/20">
                <SelectValue placeholder="MODALIDAD" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all" className="text-[11px] font-black">TODAS LAS MODALIDADES</SelectItem>
                {filterOptions.modalidades.map(m => (
                  <SelectItem key={m} value={m} className="text-[11px] font-black uppercase">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="ghost" size="sm" className="h-12 px-6 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl" onClick={clearFilters}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Reiniciar
            </Button>
          </div>
        </Card>
      </div>

      <div className="w-full">
        {activeReport === 'soporte' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
              {[
                { title: 'Redes Atendidas', value: filteredTickets.filter(t => (t.tipoIncidencia || '').includes('red')).length, icon: <Network className="h-6 w-6" />, color: 'bg-blue-500', bg: 'bg-blue-50' },
                { title: 'Mantenimientos', value: filteredTickets.filter(t => (t.tipoIncidencia || '').includes('mantenimiento')).length, icon: <Wrench className="h-6 w-6" />, color: 'bg-emerald-500', bg: 'bg-emerald-50' },
                { title: 'Atención SETES', value: filteredTickets.filter(t => t.setes === 'S').length, icon: <Zap className="h-6 w-6" />, color: 'bg-purple-600', bg: 'bg-purple-50' },
                { title: 'Beneficiarios', value: (filteredTickets.reduce((a, b) => a + (b.alumnosBeneficiados || 0), 0)).toLocaleString(), icon: <Users className="h-6 w-6" />, color: 'bg-cyan-500', bg: 'bg-cyan-50' },
                { title: 'Eficiencia %', value: `${Math.round((filteredTickets.filter(t => t.status === 'atendido').length / (filteredTickets.length || 1)) * 100)}%`, icon: <CheckCircle2 className="h-6 w-6" />, color: 'bg-orange-500', bg: 'bg-orange-50' },
              ].map((item, i) => (
                <Card key={i} className="executive-card p-8 group overflow-hidden relative">
                  <div className={`absolute top-0 right-0 w-24 h-24 ${item.bg} rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500 opacity-50`} />
                  <div className="relative z-10">
                    <div className={`h-12 w-12 ${item.color} text-white rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform`}>
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.title}</span>
                    <div className="text-4xl font-black text-slate-800 mt-2">{item.value}</div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
               <Card className="executive-card p-8">
                  <CardHeader className="p-0 mb-8"><CardTitle className="text-sm font-black uppercase flex items-center gap-3 text-primary"><Zap className="h-5 w-5 fill-current" /> Atención SETES</CardTitle></CardHeader>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats.supportSetesData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={10} dataKey="value">
                          {stats.supportSetesData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', paddingTop: '20px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
               </Card>
               
               <Card className="executive-card p-8">
                  <CardHeader className="p-0 mb-8"><CardTitle className="text-sm font-black uppercase flex items-center gap-3 text-primary"><Layout className="h-5 w-5" /> Estatus Operativo</CardTitle></CardHeader>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={10} dataKey="value">
                          {stats.statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', paddingTop: '20px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
               </Card>

              <Card className="executive-card lg:col-span-1">
                <CardHeader className="p-8 border-b border-slate-50"><CardTitle className="text-sm font-black uppercase text-primary">Universo y Cobertura</CardTitle></CardHeader>
                <div className="overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="border-none">
                        <TableHead className="text-[9px] font-black pl-8">MODALIDAD</TableHead>
                        <TableHead className="text-[9px] font-black text-center">UNIV.</TableHead>
                        <TableHead className="text-[9px] font-black text-right pr-8">ATN.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {UNIVERSE_STATS.map((row, idx) => (
                        <TableRow key={idx} className="hover:bg-slate-50/80 transition-colors border-slate-50">
                          <TableCell className="text-[10px] font-black text-slate-600 pl-8 uppercase">{row.modalidad} <span className="text-slate-300 font-bold ml-1">({row.valle})</span></TableCell>
                          <TableCell className="text-center text-[10px] font-black text-slate-800">{row.total}</TableCell>
                          <TableCell className="text-right pr-8">
                            <Badge className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border-none ${row.atendidas > 0 ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>{row.atendidas}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>

            <Card className="executive-card">
              <CardHeader className="p-8 flex flex-row items-center justify-between border-b border-slate-50">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-black uppercase text-primary flex items-center gap-3">
                    <Layers className="h-6 w-6" /> Detalle de Intervenciones Técnicas
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-9">Auditoría de evidencias y registros de campo</CardDescription>
                </div>
                <Button variant="outline" className="rounded-2xl font-black uppercase text-[10px] h-10 border-primary/20 text-primary hover:bg-primary hover:text-white">Descargar Auditoría</Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-none">
                      <TableHead className="text-[10px] font-black pl-8">FOLIO</TableHead>
                      <TableHead className="text-[10px] font-black">PLANETEL ATENDIDO</TableHead>
                      <TableHead className="text-[10px] font-black text-center">SETES</TableHead>
                      <TableHead className="text-[10px] font-black">SERVICIO TÉCNICO</TableHead>
                      <TableHead className="text-[10px] font-black">ESTATUS</TableHead>
                      <TableHead className="text-right text-[10px] font-black pr-8">EVIDENCIAS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.slice(0, 15).map((t) => (
                      <TableRow key={t.id} className="hover:bg-slate-50/80 transition-all border-slate-50">
                        <TableCell className="text-[11px] font-black text-primary pl-8">{t.id}</TableCell>
                        <TableCell>
                           <div className="flex flex-col">
                              <span className="text-[11px] font-mono font-black text-slate-700">{t.cct}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[200px]">{t.schoolName}</span>
                           </div>
                        </TableCell>
                        <TableCell className="text-center">
                           {t.setes === 'S' ? (
                             <div className="h-6 w-6 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                               <Zap className="h-3.5 w-3.5 text-purple-600 fill-purple-600" />
                             </div>
                           ) : (
                             <span className="text-[9px] text-slate-300 font-black">REG</span>
                           )}
                        </TableCell>
                        <TableCell className="text-[10px] font-black uppercase text-slate-600">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-full">{t.tipoIncidencia}</span>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                              <Circle className={cn("h-2.5 w-2.5 fill-current", 
                                t.status === 'atendido' ? 'text-emerald-500' : 
                                t.status === 'en proceso' ? 'text-amber-500' : 'text-rose-500'
                              )} />
                              <span className="text-[10px] font-black uppercase text-slate-600">{t.status}</span>
                           </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end gap-2">
                            {t.reportPdf && (
                              <Button variant="ghost" size="icon" className="h-10 w-10 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl shadow-sm" onClick={() => setEvidenceToView({ type: 'pdf', data: t.reportPdf!, title: `Reporte Soporte - ${t.id}` })}>
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}
                            {t.evidencePhotos && t.evidencePhotos.length > 0 && (
                              <Button variant="ghost" size="icon" className="h-10 w-10 text-pink-600 bg-pink-50 hover:bg-pink-600 hover:text-white rounded-xl shadow-sm" onClick={() => setEvidenceToView({ type: 'gallery', data: t.evidencePhotos!, title: `Galería Soporte - ${t.id}` })}>
                                <ImageIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTickets.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-20 text-[11px] font-black uppercase text-slate-300">No se encontraron registros en el periodo</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeReport === 'capacitacion' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="grid gap-6 md:grid-cols-4">
              {[
                { title: 'Personal Capacitado', value: filteredTrainings.length, icon: <Users className="h-6 w-6" />, color: 'bg-indigo-600', bg: 'bg-indigo-50', goal: goals.trainingGoal },
                { title: 'Cursos Únicos', value: new Set(filteredTrainings.map(t => t.cursoNombre)).size, icon: <GraduationCap className="h-6 w-6" />, color: 'bg-amber-600', bg: 'bg-amber-50' },
                { title: 'Total Horas', value: filteredTrainings.reduce((a, b) => a + (b.duracionHoras || 0), 0), icon: <Clock className="h-6 w-6" />, color: 'bg-rose-600', bg: 'bg-rose-50' },
                { title: 'Planteles Sede', value: new Set(filteredTrainings.map(t => t.cctSede)).size, icon: <Building2 className="h-6 w-6" />, color: 'bg-emerald-600', bg: 'bg-emerald-50' },
              ].map((item, i) => (
                <Card key={i} className="executive-card p-8 group">
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`h-12 w-12 ${item.color} text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform`}>
                        {item.icon}
                      </div>
                      {item.goal && (
                        <div className="text-right">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Meta: {item.goal}</span>
                          <div className="text-sm font-black text-primary">{Math.round((item.value / item.goal) * 100)}%</div>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.title}</span>
                    <div className="text-4xl font-black text-slate-800 mt-2">{item.value}</div>
                    {item.goal && <Progress value={(item.value / item.goal) * 100} className="h-2 mt-4 bg-slate-100" />}
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <Card className="executive-card p-8 relative overflow-hidden">
                <CardHeader className="p-0 mb-8"><CardTitle className="text-sm font-black uppercase text-primary flex items-center gap-3"><PieChartIcon className="h-5 w-5" /> Distribución por Género</CardTitle></CardHeader>
                <div className="flex justify-around items-center py-6">
                  <div className="text-center group">
                    <div className="h-20 w-20 rounded-[2rem] bg-pink-50 border-2 border-pink-100 flex items-center justify-center text-pink-500 mb-3 group-hover:scale-110 transition-transform">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 14c2.5 0 4.5-2 4.5-4.5S14.5 5 12 5 7.5 7 7.5 9.5 9.5 14 12 14zM8 21h8l-1.5-7h-5z"/></svg>
                    </div>
                    <p className="text-[11px] font-black uppercase text-pink-600">Mujeres</p>
                    <p className="text-2xl font-black">{stats.trainingByGender.find(g => g.name === 'FEMENINO')?.value || 0}</p>
                  </div>
                  <div className="h-[120px] w-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={stats.trainingByGender} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={8} dataKey="value">{stats.trainingByGender.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />)}</Pie></PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center group">
                    <div className="h-20 w-20 rounded-[2rem] bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-blue-500 mb-3 group-hover:scale-110 transition-transform">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <p className="text-[11px] font-black uppercase text-blue-600">Hombres</p>
                    <p className="text-2xl font-black">{stats.trainingByGender.find(g => g.name === 'MASCULINO')?.value || 0}</p>
                  </div>
                </div>
              </Card>

              <Card className="executive-card p-8">
                <CardHeader className="p-0 mb-8"><CardTitle className="text-sm font-black uppercase text-primary flex items-center gap-3"><Zap className="h-5 w-5 fill-current text-purple-600" /> Atención a SETES</CardTitle></CardHeader>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.trainingBySetes} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value">{stats.trainingBySetes.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />)}</Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 p-4 bg-purple-50 rounded-2xl border border-purple-100 text-center">
                   <span className="text-[10px] font-black text-purple-800 uppercase tracking-widest">Capacitación en SETES: {Math.round((stats.trainingBySetes.find(s => s.name === 'SETES')?.value || 0) / (filteredTrainings.length || 1) * 100)}%</span>
                </div>
              </Card>

              <Card className="executive-card p-8">
                <CardHeader className="p-0 mb-8"><CardTitle className="text-sm font-black uppercase text-primary flex items-center gap-3"><BarChart3 className="h-5 w-5" /> Meta Regional (Actual vs Plan)</CardTitle></CardHeader>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.trainingByValle}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} 
                        cursor={{ fill: 'rgba(98, 17, 50, 0.05)', radius: 10 }}
                        formatter={(value: any, name: any, props: any) => [value, name === 'value' ? 'Real' : 'Meta']}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }} />
                      <Bar dataKey="goal" name="Meta Planeada" fill="#cbd5e1" radius={[10, 10, 0, 0]} barSize={40} />
                      <Bar dataKey="value" name="Avance Real" radius={[10, 10, 0, 0]} barSize={40}>
                        {stats.trainingByValle.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeReport === 'programas' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { title: 'Programas Activos', value: filteredPrograms.length, icon: <Briefcase className="h-6 w-6" />, color: 'bg-cyan-600', bg: 'bg-cyan-50' },
                { title: 'Avance Promedio', value: `${Math.round(filteredPrograms.reduce((a, b) => a + (b.progress || 0), 0) / (filteredPrograms.length || 1))}%`, icon: <TrendingUp className="h-6 w-6" />, color: 'bg-emerald-600', bg: 'bg-emerald-50' },
                { title: 'Hitos Concluidos', value: filteredPrograms.filter(p => p.status === 'concluido').length, icon: <CheckCircle2 className="h-6 w-6" />, color: 'bg-indigo-600', bg: 'bg-indigo-50' },
              ].map((item, i) => (
                <Card key={i} className="executive-card p-8 group">
                  <div className={`h-12 w-12 ${item.color} text-white rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.title}</span>
                  <div className="text-4xl font-black text-slate-800 mt-2">{item.value}</div>
                </Card>
              ))}
            </div>

            <Card className="executive-card">
              <CardHeader className="p-8 border-b border-slate-50">
                <CardTitle className="text-lg font-black uppercase text-primary">Seguimiento de Programas Transversales</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-1">Monitoreo de hitos institucionales y rendición de cuentas</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {filteredPrograms.map(p => (
                  <div key={p.id} className="space-y-4 p-6 rounded-3xl bg-slate-50 hover:bg-white border border-transparent hover:border-primary/10 hover:shadow-xl transition-all duration-300">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-6">
                        <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary font-black text-xs border border-primary/5">
                           {p.id.split('-')[1]}
                        </div>
                        <div className="space-y-1">
                           <span className="text-sm font-black uppercase text-slate-700">{p.name}</span>
                           <div className="flex items-center gap-4">
                              <Badge className="text-[8px] font-black uppercase bg-primary text-white border-none px-3 py-1 rounded-full">{p.status}</Badge>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {p.date}</span>
                           </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{p.progress}%</span>
                        <div className="flex gap-3 mt-2">
                           {p.reportPdf && (
                             <Button variant="ghost" size="sm" className="h-8 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 gap-2 text-[9px] font-black uppercase tracking-widest" onClick={() => setEvidenceToView({ type: 'pdf', data: p.reportPdf!, title: p.name })}>
                               <FileText className="h-3 w-3" /> PDF
                             </Button>
                           )}
                        </div>
                      </div>
                    </div>
                    <Progress value={p.progress} className="h-2.5 rounded-full bg-slate-200" />
                  </div>
                ))}
                {filteredPrograms.length === 0 && <div className="text-center py-20 text-[11px] font-black text-slate-300 uppercase tracking-widest">Sin programas registrados en el periodo</div>}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Settings Dialog (Goals) */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-slate-50 border-b relative">
            <div className="absolute right-8 top-8 h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/5">
              <Settings2 className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="uppercase font-black text-primary text-xl tracking-tight">Metas Institucionales</DialogTitle>
            <DialogDescription className="font-bold text-[10px] uppercase text-slate-400 tracking-widest">Configuración de objetivos para el periodo vigente</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Tipo de Periodo</Label>
                <Select value={goals.periodType} onValueChange={(val: any) => setGoals({...goals, periodType: val})}>
                  <SelectTrigger className="h-12 rounded-2xl font-bold bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl"><SelectItem value="Ciclo Escolar">Ciclo Escolar</SelectItem><SelectItem value="Año Fiscal">Año Fiscal</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Nombre del Periodo</Label>
                <Input className="h-12 rounded-2xl font-black bg-slate-50 border-slate-200" value={goals.periodName} onChange={e => setGoals({...goals, periodName: e.target.value})} placeholder="2024-2025" />
              </div>
            </div>
            
            <div className="space-y-6 pt-6 border-t">
               <Label className="text-[11px] font-black uppercase text-primary flex items-center gap-3 tracking-widest">
                 <Target className="h-5 w-5" /> Objetivos Numéricos
               </Label>
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Meta Soporte</Label>
                   <Input type="number" className="h-12 rounded-2xl font-black bg-slate-50 border-slate-200" value={goals.supportGoal} onChange={e => setGoals({...goals, supportGoal: parseInt(e.target.value) || 0})} />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Meta Capacitación</Label>
                   <Input type="number" className="h-12 rounded-2xl font-black bg-slate-50 border-slate-200" value={goals.trainingGoal} onChange={e => setGoals({...goals, trainingGoal: parseInt(e.target.value) || 0})} />
                 </div>
               </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50/50 border-t flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(false)} className="h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</Button>
            <Button size="sm" onClick={saveGoals} className="h-12 px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evidence Viewer Dialog */}
      <Dialog open={!!evidenceToView} onOpenChange={() => setEvidenceToView(null)}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 border-none shadow-[0_50px_100px_rgba(0,0,0,0.3)] rounded-[3rem] overflow-hidden">
          <DialogHeader className="p-10 pb-6 border-b bg-white relative">
            <div className="absolute right-12 top-10 flex gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                   <Zap className="h-6 w-6" />
                </div>
            </div>
            <DialogTitle className="uppercase font-black text-primary text-3xl tracking-tight flex items-center gap-6">
              {evidenceToView?.type === 'pdf' ? <FileText className="h-8 w-8 text-blue-600" /> : <ImageIcon className="h-8 w-8 text-pink-600" />}
              {evidenceToView?.title}
            </DialogTitle>
            <DialogDescription className="font-black text-[11px] uppercase text-slate-400 tracking-[0.3em] mt-2">Visor Ejecutivo de Auditoría Edoméx</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-slate-100 p-10 relative">
             {evidenceToView?.type === 'pdf' ? (
                <iframe src={evidenceToView.data as string} className="w-full h-full border-none shadow-2xl rounded-[2rem] bg-white" title="PDF Viewer" />
             ) : (
                <ScrollArea className="h-full w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-10">
                    {(evidenceToView?.data as string[])?.map((img, idx) => (
                      <div key={idx} className="relative aspect-video rounded-[2.5rem] overflow-hidden border-[12px] border-white shadow-2xl group cursor-zoom-in">
                        <Image src={img} alt={`Evidencia ${idx}`} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <ExternalLink className="h-12 w-12 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
             )}
          </div>
          <div className="p-8 bg-white border-t flex justify-end">
            <Button variant="secondary" onClick={() => setEvidenceToView(null)} className="h-14 px-12 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200">Finalizar Revisión</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
