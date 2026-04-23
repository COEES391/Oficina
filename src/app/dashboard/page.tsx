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
  Calendar
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

const REGIONAL_OFFICES = [
  "Oficina de Tecnóloga Educativa Ecatepec",
  "Oficina de Tecnóloga Educativa Naucalpan",
  "Oficina de Tecnóloga Educativa Nezahualcóyotl",
  "Oficina de Tecnóloga Educativa Toluca",
  "Oficina de COEES Tultitlan"
];

type DashboardGoals = {
  periodType: 'Ciclo Escolar' | 'Año Fiscal';
  periodName: string;
  supportGoal: number;
  trainingGoal: number;
}

export default function DashboardPage() {
  const [activeReport, setActiveReport] = useState('soporte')
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [trainings, setTrainings] = useState<TrainingRecord[]>([])
  const [programs, setPrograms] = useState<ProgramStatus[]>([])
  
  const [evidenceToView, setEvidenceToView] = useState<{ type: 'pdf' | 'gallery', data: string | string[], title: string } | null>(null)

  // Meta Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [goals, setGoals] = useState<DashboardGoals>({
    periodType: 'Ciclo Escolar',
    periodName: '2024-2025',
    supportGoal: 100,
    trainingGoal: 50
  })

  // Filters
  const [valleFilter, setValleFilter] = useState('all')
  const [municipioFilter, setMunicipioFilter] = useState('all')
  const [modalidadFilter, setModalidadFilter] = useState('all')
  const [oficinaFilter, setOficinaFilter] = useState('all')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')

  useEffect(() => {
    const storedTickets = JSON.parse(localStorage.getItem('support_tickets_full') || '[]')
    setTickets(storedTickets.length > 0 ? storedTickets : supportData)

    const storedTrainings = JSON.parse(localStorage.getItem('training_records_full') || '[]')
    setTrainings(storedTrainings)

    const storedPrograms = JSON.parse(localStorage.getItem('programs_full') || '[]')
    setPrograms(storedPrograms.length > 0 ? storedPrograms : programsData)

    const storedGoals = JSON.parse(localStorage.getItem('dashboard_goals') || 'null')
    if (storedGoals) {
      setGoals(storedGoals)
    }
  }, [])

  const saveGoals = () => {
    localStorage.setItem('dashboard_goals', JSON.stringify(goals))
    setIsSettingsOpen(false)
  }

  const filterOptions = useMemo(() => {
    const valles = Array.from(new Set(schoolsDirectory.map(s => s.valle))).sort();
    const listByValle = valleFilter === 'all' ? schoolsDirectory : schoolsDirectory.filter(s => (s.valle || '').toUpperCase() === valleFilter.toUpperCase());
    const modalidades = Array.from(new Set(listByValle.map(s => s.modalidad))).sort();
    const listByModalidad = modalidadFilter === 'all' ? listByValle : listByValle.filter(s => s.modalidad === modalidadFilter);
    const municipios = Array.from(new Set(listByModalidad.map(s => s.municipio))).sort();
    return { valles, modalidades, municipios };
  }, [valleFilter, modalidadFilter]);

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

    const groupBy = (arr: any[], key: string) => {
      return Object.entries(arr.reduce((acc, obj) => {
        const val = obj[key] || 'Sin Dato';
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)).map(([name, value]) => ({ name, value }));
    };

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
      serviceData: [
        { name: 'Red Edusat', value: filteredTickets.filter(t => (t.tipoIncidencia || '').includes('red edusat')).length },
        { name: 'Red Local', value: filteredTickets.filter(t => (t.tipoIncidencia || '').includes('red local')).length },
        { name: 'Mantenimiento', value: filteredTickets.filter(t => (t.tipoIncidencia || '').includes('mantenimiento')).length },
      ],
      trainingByValle: [
        { name: 'MEXICO', value: filteredTrainings.filter(tr => tr.asistenteValle === 'MEXICO').length, fill: '#6366f1' },
        { name: 'TOLUCA', value: filteredTrainings.filter(tr => tr.asistenteValle === 'TOLUCA').length, fill: '#ec4899' },
      ],
      trainingByGender: [
        { name: 'MASCULINO', value: filteredTrainings.filter(tr => tr.asistenteGenero === 'MASCULINO').length, fill: '#0ea5e9' },
        { name: 'FEMENINO', value: filteredTrainings.filter(tr => tr.asistenteGenero === 'FEMENINO').length, fill: '#f43f5e' },
      ],
      trainingBySetes: [
        { name: 'SETES', value: filteredTrainings.filter(tr => tr.setes === 'S').length, fill: '#8b5cf6' },
        { name: 'OTRO', value: filteredTrainings.filter(tr => tr.setes === 'N').length, fill: '#94a3b8' },
      ],
      trainingBySector: groupBy(filteredTrainings, 'asistenteSector').sort((a, b) => b.value - a.value).slice(0, 8),
      trainingByZE: groupBy(filteredTrainings, 'asistenteZE').sort((a, b) => b.value - a.value).slice(0, 8),
      trainingByCourse: groupBy(filteredTrainings, 'cursoNombre').sort((a, b) => b.value - a.value).slice(0, 5),
      trainingByCCT: groupBy(filteredTrainings, 'asistenteCCT').sort((a, b) => b.value - a.value).slice(0, 8),
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

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight text-primary uppercase">Centro de Mando Ejecutivo</h2>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground font-bold text-xs tracking-widest uppercase">
                Oficina de Planeación • {goals.periodType}: {goals.periodName}
              </p>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsSettingsOpen(true)}>
                <Settings2 className="h-3.5 w-3.5 text-primary" />
              </Button>
            </div>
          </div>
          
          <Tabs value={activeReport} onValueChange={setActiveReport} className="w-full md:w-auto">
            <TabsList className="grid grid-cols-3 w-full md:w-[450px] bg-slate-200/50 p-1 h-11">
              <TabsTrigger value="soporte" className="gap-2 text-[10px] font-black uppercase">
                <Wrench className="h-3 w-3" /> Soporte
              </TabsTrigger>
              <TabsTrigger value="capacitacion" className="gap-2 text-[10px] font-black uppercase">
                <GraduationCap className="h-3 w-3" /> Capacitación
              </TabsTrigger>
              <TabsTrigger value="programas" className="gap-2 text-[10px] font-black uppercase">
                <Briefcase className="h-3 w-3" /> Programas
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card className="p-4 border-primary/20 bg-primary/5 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase text-primary">Filtros Avanzados:</span>
            </div>

            <div className="flex items-center gap-2 bg-white p-1 rounded-md border border-primary/10">
               <Calendar className="h-3.5 w-3.5 text-muted-foreground ml-1" />
               <Input 
                  type="date" 
                  className="h-8 text-[10px] border-none focus-visible:ring-0 w-[120px]" 
                  value={dateStart} 
                  onChange={(e) => setDateStart(e.target.value)}
                />
                <span className="text-[10px] font-bold text-muted-foreground">AL</span>
                <Input 
                  type="date" 
                  className="h-8 text-[10px] border-none focus-visible:ring-0 w-[120px]" 
                  value={dateEnd} 
                  onChange={(e) => setDateEnd(e.target.value)}
                />
            </div>

            <Select value={valleFilter} onValueChange={setValleFilter}>
              <SelectTrigger className="h-9 text-xs w-[120px] bg-white border-primary/20">
                <SelectValue placeholder="Valle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Valles (Todos)</SelectItem>
                {filterOptions.valles.map(v => (
                  <SelectItem key={v} value={v}>{v === 'T' ? 'TOLUCA' : v === 'M' ? 'MÉXICO' : v}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={modalidadFilter} onValueChange={setModalidadFilter}>
              <SelectTrigger className="h-9 text-xs w-[160px] bg-white border-primary/20">
                <SelectValue placeholder="Modalidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Modalidades</SelectItem>
                {filterOptions.modalidades.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeReport === 'soporte' && (
              <Select value={oficinaFilter} onValueChange={setOficinaFilter}>
                <SelectTrigger className="h-9 text-xs w-[180px] bg-white border-primary/20">
                  <SelectValue placeholder="Oficina Regional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Oficinas</SelectItem>
                  {REGIONAL_OFFICES.map(off => (
                    <SelectItem key={off} value={off}>{off.replace("Oficina de ", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button variant="ghost" size="sm" className="h-9 px-3 text-[10px] font-black" onClick={clearFilters}>
              <RefreshCcw className="h-3 w-3 mr-1" /> REINICIAR
            </Button>
          </div>
        </Card>
      </div>

      <div className="w-full">
        {activeReport === 'soporte' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5">
              <Card className="shadow-sm border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Redes Atendidas</span>
                  <div className="text-2xl font-black">{filteredTickets.filter(t => (t.tipoIncidencia || '').includes('red')).length}</div>
                  <Progress value={(filteredTickets.filter(t => t.status === 'atendido').length / goals.supportGoal) * 100} className="h-1 mt-2" />
                  <Network className="h-4 w-4 text-blue-500 mt-2" />
                </CardContent>
              </Card>
              <Card className="shadow-sm border-l-4 border-l-emerald-500">
                <CardContent className="p-6">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mantenimientos</span>
                  <div className="text-2xl font-black">{filteredTickets.filter(t => (t.tipoIncidencia || '').includes('mantenimiento')).length}</div>
                  <Wrench className="h-4 w-4 text-emerald-500 mt-1" />
                </CardContent>
              </Card>
              <Card className="shadow-sm border-l-4 border-l-purple-600">
                <CardContent className="p-6">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Semana de SETES</span>
                  <div className="text-2xl font-black">{filteredTickets.filter(t => t.setes === 'S').length}</div>
                  <Zap className="h-4 w-4 text-purple-600 mt-1 fill-purple-600" />
                </CardContent>
              </Card>
              <Card className="shadow-sm border-l-4 border-l-cyan-500">
                <CardContent className="p-6">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Beneficiarios</span>
                  <div className="text-2xl font-black">{(filteredTickets.reduce((a, b) => a + (b.alumnosBeneficiados || 0), 0)).toLocaleString()}</div>
                  <Users className="h-4 w-4 text-cyan-500 mt-1" />
                </CardContent>
              </Card>
              <Card className="shadow-sm border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Eficiencia</span>
                  <div className="text-2xl font-black">
                    {Math.round((filteredTickets.filter(t => t.status === 'atendido').length / (filteredTickets.length || 1)) * 100)}%
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-orange-500 mt-1" />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
               <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                        <Zap className="h-4 w-4 text-purple-600 fill-purple-600" /> Atención Semana de SETES
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={stats.supportSetesData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {stats.supportSetesData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                          </Pie>
                          <RechartsTooltip />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-black uppercase">Estatus Operativo de Folios</CardTitle></CardHeader>
                    <CardContent className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {stats.statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                          </Pie>
                          <RechartsTooltip />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
               </div>
              <Card>
                <CardHeader><CardTitle className="text-sm font-black uppercase">Universo Escolar y Cobertura</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50"><TableRow>
                      <TableHead className="text-[10px] font-black">Modalidad</TableHead>
                      <TableHead className="text-[10px] font-black">Valle</TableHead>
                      <TableHead className="text-[10px] font-black text-center">Universo</TableHead>
                      <TableHead className="text-[10px] font-black text-center">Atención</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {UNIVERSE_STATS.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-[10px] font-bold">{row.modalidad}</TableCell>
                          <TableCell className="text-[10px] font-medium">{row.valle}</TableCell>
                          <TableCell className="text-center text-[10px] font-black">{row.total}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={row.atendidas > 0 ? "default" : "outline"} className="text-[9px]">{row.atendidas}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase">Reporte Detallado de Servicios y Evidencias</CardTitle>
                <CardDescription>Auditoría de intervenciones técnicas con acceso a documentación oficial.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-[10px] font-black">Folio</TableHead>
                      <TableHead className="text-[10px] font-black">CCT / Plantel</TableHead>
                      <TableHead className="text-[10px] font-black text-center">SETES</TableHead>
                      <TableHead className="text-[10px] font-black">Servicio</TableHead>
                      <TableHead className="text-[10px] font-black">Estatus</TableHead>
                      <TableHead className="text-[10px] font-black text-center">Evidencias</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.slice(0, 15).map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-[10px] font-bold">{t.id}</TableCell>
                        <TableCell>
                           <div className="flex flex-col">
                              <span className="text-[10px] font-mono font-bold">{t.cct}</span>
                              <span className="text-[9px] text-muted-foreground truncate max-w-[180px]">{t.schoolName}</span>
                           </div>
                        </TableCell>
                        <TableCell className="text-center">
                           {t.setes === 'S' ? <Zap className="h-3.5 w-3.5 text-purple-600 fill-purple-600 mx-auto" /> : <span className="text-[8px] text-muted-foreground font-bold">REGULAR</span>}
                        </TableCell>
                        <TableCell className="text-[10px] font-semibold capitalize text-primary">
                          {t.tipoIncidencia || 'Sin especificar'}
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-1.5">
                              <Circle className={cn("h-2 w-2 fill-current", 
                                t.status === 'atendido' ? 'text-emerald-500' : 
                                t.status === 'en proceso' ? 'text-amber-500' : 'text-rose-500'
                              )} />
                              <span className="text-[10px] font-bold uppercase">{t.status}</span>
                           </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            {t.reportPdf && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEvidenceToView({ type: 'pdf', data: t.reportPdf!, title: `Reporte Soporte - ${t.id} (${t.tipoIncidencia})` })}>
                                <FileText className="h-3.5 w-3.5 text-blue-500" />
                              </Button>
                            )}
                            {t.evidencePhotos && t.evidencePhotos.length > 0 && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEvidenceToView({ type: 'gallery', data: t.evidencePhotos!, title: `Galería Soporte - ${t.id} (${t.tipoIncidencia})` })}>
                                <ImageIcon className="h-3.5 w-3.5 text-pink-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTickets.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-10 text-[10px]">Sin registros encontrados en el periodo.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeReport === 'capacitacion' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="shadow-sm border-l-4 border-l-blue-600">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Personal Capacitado</span>
                      <div className="text-2xl font-black">{filteredTrainings.length}</div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-bold text-primary uppercase">Meta: {goals.trainingGoal}</span>
                      <span className="text-xs font-black">{Math.round((filteredTrainings.length / goals.trainingGoal) * 100)}%</span>
                    </div>
                  </div>
                  <Progress value={(filteredTrainings.length / goals.trainingGoal) * 100} className="h-1 mt-2" />
                  <Users className="h-4 w-4 text-blue-600 mt-2" />
                </CardContent>
              </Card>
              <Card className="shadow-sm border-l-4 border-l-indigo-600">
                <CardContent className="p-6">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cursos Únicos</span>
                  <div className="text-2xl font-black">
                    {new Set(filteredTrainings.map(t => t.cursoNombre)).size}
                  </div>
                  <GraduationCap className="h-4 w-4 text-indigo-600 mt-1" />
                </CardContent>
              </Card>
              <Card className="shadow-sm border-l-4 border-l-pink-600">
                <CardContent className="p-6">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Horas</span>
                  <div className="text-2xl font-black">
                    {filteredTrainings.reduce((a, b) => a + (b.duracionHoras || 0), 0)}
                  </div>
                  <Clock className="h-4 w-4 text-pink-600 mt-1" />
                </CardContent>
              </Card>
              <Card className="shadow-sm border-l-4 border-l-amber-600">
                <CardContent className="p-6">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Planteles Sede</span>
                  <div className="text-2xl font-black">
                    {new Set(filteredTrainings.map(t => t.cctSede)).size}
                  </div>
                  <Building2 className="h-4 w-4 text-amber-600 mt-1" />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xs font-black uppercase flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-primary" /> Distribución por Género
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="flex w-full justify-around items-center mb-4 pt-2">
                    <div className="flex flex-col items-center gap-1 group">
                       <div className="h-14 w-14 rounded-full bg-pink-50 border-2 border-pink-100 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500">
                            <path d="M12 14c2.5 0 4.5-2 4.5-4.5S14.5 5 12 5 7.5 7 7.5 9.5 9.5 14 12 14zM8 21h8l-1.5-7h-5z"/>
                          </svg>
                       </div>
                       <span className="text-[10px] font-black uppercase text-pink-600">Mujeres</span>
                       <span className="text-sm font-black">{stats.trainingByGender.find(g => g.name === 'FEMENINO')?.value || 0}</span>
                    </div>
                    
                    <div className="h-[120px] w-[120px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={stats.trainingByGender} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={35} 
                            outerRadius={50} 
                            paddingAngle={5} 
                            dataKey="value"
                          >
                            {stats.trainingByGender.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex flex-col items-center gap-1 group">
                       <div className="h-14 w-14 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                          </svg>
                       </div>
                       <span className="text-[10px] font-black uppercase text-blue-600">Hombres</span>
                       <span className="text-sm font-black">{stats.trainingByGender.find(g => g.name === 'MASCULINO')?.value || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xs font-black uppercase flex items-center gap-2 text-purple-600">
                    <Zap className="h-4 w-4 fill-current" /> Atención a SETES
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.trainingBySetes} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                        {stats.trainingBySetes.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                      </Pie>
                      <RechartsTooltip />
                      <Legend 
                        iconType="star" 
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'black' }} 
                        formatter={(val) => val === 'SETES' ? 'ATENCIÓN SETES' : 'PERSONAL REGULAR'}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute bottom-6 right-6">
                     <Badge className="bg-purple-600 text-white border-none text-[9px] font-black uppercase px-3 py-1">
                        {Math.round((stats.trainingBySetes.find(s => s.name === 'SETES')?.value || 0) / (filteredTrainings.length || 1) * 100)}% Cobertura
                     </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xs font-black uppercase flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" /> Capacitación por Valle
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.trainingByValle}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <RechartsTooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                        {stats.trainingByValle.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeReport === 'programas' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="shadow-sm border-l-4 border-l-cyan-600">
                <CardContent className="p-6">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Programas en Periodo</span>
                  <div className="text-2xl font-black">{filteredPrograms.length}</div>
                  <Briefcase className="h-4 w-4 text-cyan-600 mt-1" />
                </CardContent>
              </Card>
              <Card className="shadow-sm border-l-4 border-l-green-600">
                <CardContent className="p-6">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Avance Promedio</span>
                  <div className="text-2xl font-black">
                    {Math.round(filteredPrograms.reduce((a, b) => a + (b.progress || 0), 0) / (filteredPrograms.length || 1))}%
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-600 mt-1" />
                </CardContent>
              </Card>
              <Card className="shadow-sm border-l-4 border-l-indigo-600">
                <CardContent className="p-6">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Concluidos</span>
                  <div className="text-2xl font-black">
                    {filteredPrograms.filter(p => p.status === 'concluido').length}
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-indigo-600 mt-1" />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase">Estatus de Metas por Programa y Evidencias</CardTitle>
                <CardDescription>Seguimiento detallado de proyectos transversales de la oficina.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {filteredPrograms.map(p => (
                  <div key={p.id} className="space-y-2 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-black uppercase w-48">{p.name}</span>
                        <Badge className="text-[9px] uppercase">{p.status}</Badge>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{p.date}</span>
                        <div className="flex gap-2 ml-4">
                          {p.reportPdf && (
                            <Button variant="outline" size="sm" className="h-7 gap-1 text-[9px]" onClick={() => setEvidenceToView({ type: 'pdf', data: p.reportPdf!, title: p.name })}>
                              <FileText className="h-3 w-3" /> PDF
                            </Button>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold">{p.progress}%</span>
                    </div>
                    <Progress value={p.progress} className="h-2" />
                  </div>
                ))}
                {filteredPrograms.length === 0 && <p className="text-center py-10 text-[10px] font-bold uppercase text-muted-foreground">Sin programas registrados en este rango de fechas.</p>}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Settings Dialog (Goals) */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 uppercase font-black">
              <Settings2 className="h-5 w-5 text-primary" />
              Configuración de Metas
            </DialogTitle>
            <DialogDescription className="font-bold text-xs">
              Defina los objetivos institucionales para el periodo vigente (Soporte y Capacitación).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Tipo de Periodo</Label>
                <Select value={goals.periodType} onValueChange={(val: any) => setGoals({...goals, periodType: val})}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ciclo Escolar">Ciclo Escolar</SelectItem>
                    <SelectItem value="Año Fiscal">Año Fiscal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Nombre del Periodo</Label>
                <Input 
                  className="h-9 text-xs font-bold" 
                  value={goals.periodName} 
                  onChange={e => setGoals({...goals, periodName: e.target.value})}
                  placeholder="Ej: 2024-2025"
                />
              </div>
            </div>
            
            <div className="space-y-4 border-t pt-4">
               <Label className="text-xs font-black uppercase text-primary flex items-center gap-2">
                 <Target className="h-4 w-4" /> Metas Numéricas (Cantidades)
               </Label>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label className="text-[10px] font-bold uppercase">Soporte</Label>
                   <Input 
                      type="number" 
                      className="h-9 text-xs" 
                      value={goals.supportGoal} 
                      onChange={e => setGoals({...goals, supportGoal: parseInt(e.target.value) || 0})}
                    />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-[10px] font-bold uppercase">Capacitación</Label>
                   <Input 
                      type="number" 
                      className="h-9 text-xs" 
                      value={goals.trainingGoal} 
                      onChange={e => setGoals({...goals, trainingGoal: parseInt(e.target.value) || 0})}
                    />
                 </div>
               </div>
               <p className="text-[10px] text-muted-foreground font-bold italic">
                 * La oficina de Programas no tiene meta numérica directa ya que apoya transversalmente a las demás oficinas.
               </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(false)} className="font-bold uppercase text-[10px]">Cancelar</Button>
            <Button size="sm" onClick={saveGoals} className="font-black uppercase text-[10px]">Guardar Configuración</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evidence Viewer Dialog */}
      <Dialog open={!!evidenceToView} onOpenChange={() => setEvidenceToView(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2 border-b bg-slate-50">
            <DialogTitle className="uppercase font-black text-primary flex items-center gap-2">
              {evidenceToView?.type === 'pdf' ? <FileText className="h-5 w-5 text-blue-600" /> : <ImageIcon className="h-5 w-5 text-pink-600" />}
              {evidenceToView?.title}
              <ExternalLink className="h-3 w-3 text-muted-foreground ml-2" />
            </DialogTitle>
            <DialogDescription className="font-bold text-xs uppercase text-slate-500">Documentación de Respaldo Oficina de Planeación</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-slate-100 relative">
             {evidenceToView?.type === 'pdf' ? (
                <iframe src={evidenceToView.data as string} className="w-full h-full border-none shadow-inner" />
             ) : (
                <ScrollArea className="h-full w-full p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(evidenceToView?.data as string[])?.map((img, idx) => (
                      <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border-4 border-white shadow-xl group">
                        <Image src={img} alt={`Evidencia ${idx}`} fill className="object-cover transition-transform group-hover:scale-105" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
             )}
          </div>
          <div className="p-4 border-t bg-white flex justify-end">
            <Button variant="secondary" onClick={() => setEvidenceToView(null)} className="font-black uppercase text-xs">Cerrar Visor Ejecutivo</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
