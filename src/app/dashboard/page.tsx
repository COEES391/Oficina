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
  Layout,
  Table as TableIcon
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

// Metas regionales 2026 basadas en la tabla proporcionada por el usuario
const REGIONAL_METAS_FY2026 = [
  { region: 'TOLUCA', oficina: 'Toluca', trimestral: 539, anual: 2156 },
  { region: 'MÉXICO', oficina: 'Nezahualcóyotl', trimestral: 215, anual: 860 },
  { region: 'MÉXICO', oficina: 'Ecatepec', trimestral: 215, anual: 860 },
  { region: 'MÉXICO', oficina: 'Naucalpan', trimestral: 431, anual: 1724 },
];

const REGIONAL_SUMMARY_2026 = {
  'TOLUCA': 2156,
  'MEXICO': 860 + 860 + 1724 // Neza + Ecatepec + Naucalpan
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
          goal: REGIONAL_SUMMARY_2026['MEXICO'],
          fill: '#6366f1' 
        },
        { 
          name: 'TOLUCA', 
          value: filteredTrainings.filter(tr => tr.asistenteValle === 'TOLUCA').length, 
          goal: REGIONAL_SUMMARY_2026['TOLUCA'],
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
            <TabsList className="grid grid-cols-3 w-full md:w-[500px] bg-slate-100/50 p-1.5 h-14 rounded-2xl shadow-inner border border-primary/5">
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

        <Card className="p-6 rounded-[2rem] border-none bg-white/70 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
            <Filter className="h-24 w-24 text-primary" />
          </div>
          <div className="flex flex-wrap items-center gap-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/5">
                <Filter className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[11px] font-black uppercase text-primary tracking-widest">Filtros Operativos:</span>
            </div>

            <div className="flex items-center gap-3 bg-white/50 p-2 rounded-2xl border border-slate-100 shadow-inner">
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

            <Select value={modalidadFilter} onValueChange={setModalidadFilter}>
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

            <div className="grid gap-8 md:grid-cols-2">
               <Card className="executive-card p-0">
                  <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                     <CardTitle className="text-sm font-black uppercase text-primary flex items-center gap-3">
                        <TableIcon className="h-5 w-5" /> Plan Regional de Metas (Año Fiscal)
                     </CardTitle>
                     <Badge className="bg-primary/5 text-primary border-none font-black text-[9px] uppercase px-4 py-1.5 rounded-full">Referencia Oficial 2026</Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-none">
                          <TableHead className="text-[10px] font-black py-4 pl-8 uppercase">Región</TableHead>
                          <TableHead className="text-[10px] font-black py-4 uppercase text-center">Oficina</TableHead>
                          <TableHead className="text-[10px] font-black py-4 uppercase text-center">Meta Trimestral</TableHead>
                          <TableHead className="text-[10px] font-black py-4 uppercase text-right pr-8">Meta Anual</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {REGIONAL_METAS_FY2026.map((row, idx) => (
                          <TableRow key={idx} className="hover:bg-slate-50/80 transition-colors border-slate-50">
                            <TableCell className="text-[11px] font-black text-slate-600 pl-8 uppercase">{row.region}</TableCell>
                            <TableCell className="text-[11px] font-bold text-slate-500 text-center uppercase">{row.oficina}</TableCell>
                            <TableCell className="text-[11px] font-black text-slate-800 text-center">{row.trimestral.toLocaleString()}</TableCell>
                            <TableCell className="text-[11px] font-black text-primary text-right pr-8">{row.anual.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-primary/5 border-none">
                           <TableCell colSpan={2} className="text-[11px] font-black text-primary pl-8 uppercase py-4">Total Planeado 2026</TableCell>
                           <TableCell className="text-[11px] font-black text-primary text-center py-4">1,400</TableCell>
                           <TableCell className="text-[11px] font-black text-primary text-right pr-8 py-4">5,600</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
               </Card>

               <Card className="executive-card p-8">
                <CardHeader className="p-0 mb-8"><CardTitle className="text-sm font-black uppercase text-primary flex items-center gap-3"><BarChart3 className="h-5 w-5" /> Meta Regional (Actual vs Plan Anual)</CardTitle></CardHeader>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.trainingByValle}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} 
                        cursor={{ fill: 'rgba(98, 17, 50, 0.05)', radius: 10 }}
                        formatter={(value: any, name: any, props: any) => [value, name === 'value' ? 'Real' : 'Meta Anual']}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }} />
                      <Bar dataKey="goal" name="Meta Planeada Anual" fill="#cbd5e1" radius={[10, 10, 0, 0]} barSize={40} />
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
      </div>

      {/* Settings Dialog (Goals) */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white/95 backdrop-blur-2xl">
          <DialogHeader className="p-10 bg-slate-50 border-b relative">
            <div className="absolute right-10 top-10 h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/5">
              <Settings2 className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="uppercase font-black text-primary text-2xl tracking-tight">Metas Institucionales</DialogTitle>
            <DialogDescription className="font-bold text-[10px] uppercase text-slate-400 tracking-widest mt-2">Plan Maestro de Objetivos Estratégicos SIP</DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="p-10 space-y-10">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Tipo de Periodo Operativo</Label>
                  <Select value={goals.periodType} onValueChange={(val: any) => setGoals({...goals, periodType: val})}>
                    <SelectTrigger className="h-14 rounded-2xl font-black bg-white shadow-inner border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl"><SelectItem value="Ciclo Escolar" className="font-black">CICLO ESCOLAR</SelectItem><SelectItem value="Año Fiscal" className="font-black">AÑO FISCAL</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Identificador del Periodo</Label>
                  <Input className="h-14 rounded-2xl font-black bg-white shadow-inner border-slate-200 uppercase px-6" value={goals.periodName} onChange={e => setGoals({...goals, periodName: e.target.value.toUpperCase()})} placeholder="EJ: 2026" />
                </div>
              </div>
              
              <div className="space-y-8 pt-8 border-t-2 border-slate-50">
                 <Label className="text-[11px] font-black uppercase text-primary flex items-center gap-3 tracking-[0.2em]">
                   <Target className="h-5 w-5" /> Objetivos de Productividad Anual
                 </Label>
                 <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Meta de Soporte Técnico</Label>
                     <div className="relative">
                        <Input type="number" className="h-14 rounded-2xl font-black bg-white shadow-inner border-slate-200 pl-12" value={goals.supportGoal} onChange={e => setGoals({...goals, supportGoal: parseInt(e.target.value) || 0})} />
                        <Wrench className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                     </div>
                   </div>
                   <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Meta de Capacitación</Label>
                     <div className="relative">
                        <Input type="number" className="h-14 rounded-2xl font-black bg-white shadow-inner border-slate-200 pl-12" value={goals.trainingGoal} onChange={e => setGoals({...goals, trainingGoal: parseInt(e.target.value) || 0})} />
                        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                     </div>
                   </div>
                 </div>

                 {goals.periodType === 'Año Fiscal' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 bg-slate-50 p-8 rounded-[2rem] border-2 border-white shadow-inner">
                        <div className="flex items-center justify-between mb-2">
                           <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-widest">Referencia Plan FY 2026 (Capacitación)</h4>
                           <Badge className="bg-primary text-white border-none text-[8px] font-black uppercase px-3 py-1 rounded-full">Oficial</Badge>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                          <Table>
                            <TableHeader className="bg-slate-100">
                              <TableRow className="border-none">
                                <TableHead className="text-[9px] font-black py-2 pl-4 uppercase">Región</TableHead>
                                <TableHead className="text-[9px] font-black py-2 uppercase">Oficina</TableHead>
                                <TableHead className="text-[9px] font-black py-2 text-center uppercase">Trim.</TableHead>
                                <TableHead className="text-[9px] font-black py-2 text-right pr-4 uppercase">Anual</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {REGIONAL_METAS_FY2026.map((m, i) => (
                                <TableRow key={i} className="border-slate-100">
                                  <TableCell className="text-[10px] font-bold py-2 pl-4 uppercase">{m.region}</TableCell>
                                  <TableCell className="text-[10px] font-medium py-2 uppercase">{m.oficina}</TableCell>
                                  <TableCell className="text-[10px] font-black text-center py-2">{m.trimestral}</TableCell>
                                  <TableCell className="text-[10px] font-black text-primary text-right pr-4 py-2">{m.anual}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 italic text-center mt-2">Nota: Se omite cálculo por días laborables por lineamiento estratégico.</p>
                    </div>
                 )}
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="p-10 bg-slate-50 border-t flex justify-end gap-6">
            <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(false)} className="h-14 px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-white border-slate-200">Cancelar</Button>
            <Button size="sm" onClick={saveGoals} className="h-14 px-12 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">Sincronizar Planeación</Button>
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
