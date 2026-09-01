'use client'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
import { supportData, type SupportTicket, type TrainingRecord, type ProgramStatus, programsData, type AppUser } from '@/lib/planning-data'
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
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

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
  const router = useRouter()
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
    const rawTickets = localStorage.getItem('support_tickets_full');
    setTickets(rawTickets ? JSON.parse(rawTickets) : supportData);
    const rawTrainings = localStorage.getItem('training_records_full');
    setTrainings(rawTrainings ? JSON.parse(rawTrainings) : []);
    const rawPrograms = localStorage.getItem('programs_full_v24');
    setPrograms(rawPrograms ? JSON.parse(rawPrograms) : programsData);
    const storedGoals = localStorage.getItem('dashboard_goals');
    if (storedGoals) setGoals(JSON.parse(storedGoals));
  }, []);

  useEffect(() => {
    setMounted(true)
    syncData()

    const rfc = localStorage.getItem('userRfc')
    if (!rfc) {
      router.push('/')
      return
    }

    const checkAccess = async () => {
      if (rfc === 'COEES' || rfc === 'CEDITORIAL') return;
      try {
        const q = query(collection(db, 'users'), where('rfc', '==', rfc))
        const querySnapshot = await getDocs(q)
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data() as AppUser
          const privs = userData.privileges || []
          if (!privs.includes('planeacion')) {
            if (privs.includes('programas')) router.push('/dashboard/programas')
            else if (privs.includes('soporte')) router.push('/dashboard/soporte')
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
    checkAccess()
  }, [syncData, router])

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

  const supportStats = useMemo(() => {
    const atendidos = filteredTickets.filter(t => t.status === 'atendido').length;
    const proceso = filteredTickets.filter(t => t.status === 'en proceso').length;
    const pendientes = filteredTickets.filter(t => t.status === 'pendiente').length;
    const redEscolarCount = filteredTickets.filter(t => t.tipoIncidencia === 'red local').length;
    const redEdusatCount = filteredTickets.filter(t => t.tipoIncidencia === 'red edusat').length;
    const alcanzadoC = redEscolarCount + redEdusatCount;
    const porcentajeC = goals.supportGoal > 0 ? Math.min(100, parseFloat(((alcanzadoC / goals.supportGoal) * 100).toFixed(2))) : 0;

    return {
      statusData: [
        { name: 'ATENDIDOS', value: atendidos, fill: '#621132' },
        { name: 'PROCESO', value: proceso, fill: '#B38E5D' },
        { name: 'PENDIENTES', value: pendientes, fill: '#f43f5e' },
      ],
      total: filteredTickets.length,
      indicadorC: { alcanzado: alcanzadoC, meta: goals.supportGoal, porcentaje: porcentajeC, redEscolar: redEscolarCount, redEdusat: redEdusatCount }
    };
  }, [filteredTickets, goals.supportGoal]);

  if (!mounted) return null;

  return (
    <div className="space-y-4 animate-in fade-in duration-700 w-full">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
           <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><LayoutDashboard className="h-5 w-5 text-primary" /></div>
           <div><h2 className="text-xl font-black text-primary uppercase leading-none">PLANEACIÓN</h2><p className="text-muted-foreground font-black text-[8px] uppercase tracking-widest">Auditoría COEES</p></div>
        </div>
        <Tabs value={activeReport} onValueChange={setActiveReport} className="w-full lg:w-auto">
          <TabsList className="grid grid-cols-3 w-full lg:w-[360px] h-9 bg-white/50 backdrop-blur-md border rounded-xl p-1">
            <TabsTrigger value="soporte" className="text-[9px] font-black uppercase">Soporte</TabsTrigger>
            <TabsTrigger value="capacitacion" className="text-[9px] font-black uppercase">Capacitación</TabsTrigger>
            <TabsTrigger value="programas" className="text-[9px] font-black uppercase">Programas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="executive-card p-4 bg-white border-none shadow-lg">
        <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[150px] space-y-1"><Label className="text-[7px] font-black uppercase text-slate-400">CCT</Label><Input placeholder="BUSCAR CCT..." className="h-9 text-[10px] font-black uppercase" value={cctFilter} onChange={e => setCctFilter(e.target.value)} /></div>
            <div className="flex-1 min-w-[120px] space-y-1"><Label className="text-[7px] font-black uppercase text-slate-400">Valle</Label><Select value={valleFilter} onValueChange={setValleFilter}><SelectTrigger className="h-9 text-[10px] font-black"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all" className="text-[10px]">TODOS</SelectItem><SelectItem value="MEXICO" className="text-[10px]">MÉXICO</SelectItem><SelectItem value="TOLUCA" className="text-[10px]">TOLUCA</SelectItem></SelectContent></Select></div>
            <div className="shrink-0"><Button variant="ghost" size="sm" className="h-9 text-[8px] font-black uppercase text-rose-600" onClick={() => {setValleFilter('all'); setCctFilter(''); setDateStart(''); setDateEnd('')}}><RefreshCcw className="h-3 w-3 mr-1" /> REINICIAR</Button></div>
        </div>
      </Card>

      {activeReport === 'soporte' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4">
          <Card className="md:col-span-3 executive-card border-l-4 border-l-primary p-6">
             <div className="flex justify-between items-center mb-6"><h3 className="text-sm font-black uppercase text-primary">Indicador C: Acciones de Soporte</h3><Badge className="bg-primary">{supportStats.indicadorC.porcentaje}%</Badge></div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                   <div className="flex justify-between items-end"><p className="text-[8px] font-black text-slate-400 uppercase">Meta: {supportStats.indicadorC.meta}</p><p className="text-2xl font-black text-primary">{supportStats.indicadorC.alcanzado}</p></div>
                   <Progress value={supportStats.indicadorC.porcentaje} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4"><div className="bg-slate-50 p-3 rounded-xl border"><p className="text-[7px] font-black text-slate-400 uppercase">Red Local</p><h4 className="text-lg font-black">{supportStats.indicadorC.redEscolar}</h4></div><div className="bg-slate-50 p-3 rounded-xl border"><p className="text-[7px] font-black text-slate-400 uppercase">Red Edusat</p><h4 className="text-lg font-black">{supportStats.indicadorC.redEdusat}</h4></div></div>
             </div>
          </Card>
          <Card className="executive-card p-6 bg-primary text-white text-center flex flex-col justify-center gap-2"><p className="text-[9px] font-black uppercase opacity-60">Folios Totales</p><h3 className="text-5xl font-black">{supportStats.total}</h3></Card>
        </div>
      )}
      
      <div className="flex items-center gap-2 p-3 bg-accent/5 border border-accent/10 rounded-xl"><AlertCircle className="h-3.5 w-3.5 text-accent" /><p className="text-[8px] font-black uppercase tracking-widest text-accent">Información auditada en tiempo real • COEES 2026</p></div>
    </div>
  )
}