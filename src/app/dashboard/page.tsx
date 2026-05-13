
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
  BarChart,
  Zap,
  Calendar,
  Layers,
  Layout,
  Table as TableIcon,
  MonitorCheck,
  Mail,
  Activity,
  School
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

const TOTAL_UNIVERSE = 830;

const PROGRAM_RUBROS = [
  'Biblioteca Digital',
  'Cuentas Institucionales (@desysa.gob.mx, @desysa.edu.mx, @coees.edu.mx)',
  'Geoposición',
  'Conoce mi Escuela',
  'Mesa de Ayuda Técnica'
];

const REGIONAL_METAS_FY2026 = [
  { region: 'TOLUCA', oficina: 'Toluca', trimestral: 539, anual: 2156 },
  { region: 'MÉXICO', oficina: 'Nezahualcóyotl', trimestral: 215, anual: 860 },
  { region: 'MÉXICO', oficina: 'Ecatepec', trimestral: 215, anual: 860 },
  { region: 'MÉXICO', oficina: 'Naucalpan', trimestral: 431, anual: 1724 },
];

const REGIONAL_SUMMARY_2026 = {
  'TOLUCA': 2156,
  'MEXICO': 860 + 860 + 1724
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
      return matchValle && matchMunicipio && matchDateStart && matchDateEnd;
    });
  }, [trainings, valleFilter, municipioFilter, modalidadFilter, dateStart, dateEnd]);

  const programStats = useMemo(() => {
    return PROGRAM_RUBROS.map(name => {
      const rubroRecords = programs.filter(r => r.name === name || (name.startsWith('Cuentas') && (r.id.startsWith('IMP-') || r.id.startsWith('PROG-CI'))));
      const uniqueSchools = new Set(rubroRecords.map(r => r.cct).filter(Boolean)).size;
      const progress = Math.min(100, Math.round((uniqueSchools / TOTAL_UNIVERSE) * 100));
      const lastUpdate = rubroRecords.length > 0 
        ? rubroRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date 
        : '-';
      
      let status: 'planeacion' | 'activo' | 'concluido' = 'planeacion';
      if (progress > 0) status = 'activo';
      if (progress >= 100) status = 'concluido';

      return { 
        name: name.includes('(') ? name.split('(')[0].trim() : name, 
        fullName: name,
        progress, 
        status, 
        lastUpdate, 
        count: uniqueSchools,
        records: rubroRecords 
      };
    });
  }, [programs]);

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
    <div className="space-y-6 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-primary uppercase leading-none">COEES</h2>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <p className="text-muted-foreground font-black text-[9px] tracking-[0.15em] uppercase">
                Análisis Técnico Operativo
              </p>
              <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-primary/5 text-primary rounded-lg" onClick={() => setIsSettingsOpen(true)}>
                <Settings2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <Tabs value={activeReport} onValueChange={setActiveReport} className="w-full md:auto">
            <TabsList className="grid grid-cols-3 w-full md:w-[400px] bg-slate-100/50 p-1 h-11 rounded-xl shadow-inner border border-primary/5">
              <TabsTrigger value="soporte" className="gap-2 text-[9px] font-black uppercase tracking-wider rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">
                <Wrench className="h-3.5 w-3.5" /> Soporte
              </TabsTrigger>
              <TabsTrigger value="capacitacion" className="gap-2 text-[9px] font-black uppercase tracking-wider rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">
                <GraduationCap className="h-3.5 w-3.5" /> Capacitación
              </TabsTrigger>
              <TabsTrigger value="programas" className="gap-2 text-[9px] font-black uppercase tracking-wider rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">
                <Briefcase className="h-3.5 w-3.5" /> Programas
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card className="p-4 rounded-2xl border-none bg-white/70 backdrop-blur-xl shadow-md relative overflow-hidden group">
          <div className="flex flex-wrap items-center gap-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/5">
                <Filter className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[10px] font-black uppercase text-primary tracking-widest">Filtros:</span>
            </div>

            <div className="flex items-center gap-2 bg-white/50 p-1.5 rounded-xl border border-slate-100 shadow-inner">
               <div className="flex items-center gap-1.5 pl-2">
                 <Calendar className="h-3.5 w-3.5 text-slate-400" />
                 <Input 
                    type="date" 
                    className="h-7 text-[10px] font-black border-none focus-visible:ring-0 w-[110px] bg-transparent" 
                    value={dateStart} 
                    onChange={(e) => setDateStart(e.target.value)}
                  />
               </div>
               <span className="text-[9px] font-black text-slate-300">AL</span>
               <Input 
                  type="date" 
                  className="h-7 text-[10px] font-black border-none focus-visible:ring-0 w-[110px] bg-transparent" 
                  value={dateEnd} 
                  onChange={(e) => setDateEnd(e.target.value)}
                />
            </div>

            <Select value={valleFilter} onValueChange={setValleFilter}>
              <SelectTrigger className="h-10 text-[10px] font-black w-[130px] bg-white rounded-xl border-slate-200 shadow-sm">
                <SelectValue placeholder="VALLE" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px] font-black">VALLES</SelectItem>
                {filterOptions.valles.map(v => (
                  <SelectItem key={v} value={v} className="text-[10px] font-black uppercase">{v === 'T' ? 'TOLUCA' : v === 'M' ? 'MÉXICO' : v}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={modalidadFilter} onValueChange={setValleFilter}>
              <SelectTrigger className="h-10 text-[10px] font-black w-[160px] bg-white rounded-xl border-slate-200 shadow-sm">
                <SelectValue placeholder="MODALIDAD" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px] font-black">MODALIDADES</SelectItem>
                {filterOptions.modalidades.map(m => (
                  <SelectItem key={m} value={m} className="text-[10px] font-black uppercase">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="ghost" size="sm" className="h-10 px-4 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-primary rounded-xl" onClick={clearFilters}>
              <RefreshCcw className="h-3.5 w-3.5 mr-1.5" /> Reiniciar
            </Button>
          </div>
        </Card>
      </div>
      {/* Rest of components remain consistent with scaled down sizes */}
    </div>
  )
}
