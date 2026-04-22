'use client'
import { useEffect, useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { 
  Network, 
  Wrench, 
  Users, 
  CheckCircle2, 
  Globe, 
  LayoutGrid, 
  Search, 
  FileText, 
  Eye, 
  Filter, 
  RefreshCcw,
  PieChart as PieChartIcon,
  BarChart3,
  Building2,
  GraduationCap,
  Briefcase,
  TrendingUp,
  Clock
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Image from 'next/image'

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

export default function DashboardPage() {
  const [activeReport, setActiveReport] = useState('soporte')
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [trainings, setTrainings] = useState<TrainingRecord[]>([])
  const [programs, setPrograms] = useState<ProgramStatus[]>([])
  const [cctSearch, setCctSearch] = useState('')
  const [filteredEvidence, setFilteredEvidence] = useState<SupportTicket[]>([])
  
  // Filtros Globales
  const [valleFilter, setValleFilter] = useState('all')
  const [municipioFilter, setMunicipioFilter] = useState('all')
  const [modalidadFilter, setModalidadFilter] = useState('all')
  const [oficinaFilter, setOficinaFilter] = useState('all')
  const [cctFilter, setCctFilter] = useState('')

  useEffect(() => {
    const storedTickets = JSON.parse(localStorage.getItem('support_tickets_full') || '[]')
    setTickets(storedTickets.length > 0 ? storedTickets : supportData)

    const storedTrainings = JSON.parse(localStorage.getItem('training_records_full') || '[]')
    setTrainings(storedTrainings)

    const storedPrograms = JSON.parse(localStorage.getItem('programs_full') || '[]')
    setPrograms(storedPrograms.length > 0 ? storedPrograms : programsData)
  }, [])

  const filterOptions = useMemo(() => {
    const valles = Array.from(new Set(schoolsDirectory.map(s => s.valle))).sort();
    const listByValle = valleFilter === 'all' ? schoolsDirectory : schoolsDirectory.filter(s => s.valle.toUpperCase() === valleFilter.toUpperCase());
    const modalidades = Array.from(new Set(listByValle.map(s => s.modalidad))).sort();
    const listByModalidad = modalidadFilter === 'all' ? listByValle : listByValle.filter(s => s.modalidad.toUpperCase() === modalidadFilter.toUpperCase());
    const municipios = Array.from(new Set(listByModalidad.map(s => s.municipio))).sort();
    return { valles, modalidades, municipios };
  }, [valleFilter, modalidadFilter]);

  // Filtrado de Soporte
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchValle = valleFilter === 'all' || t.valle.toUpperCase() === valleFilter.toUpperCase();
      const matchMunicipio = municipioFilter === 'all' || t.municipio.toUpperCase() === municipioFilter.toUpperCase();
      const matchModalidad = modalidadFilter === 'all' || t.modalidad.toUpperCase() === modalidadFilter.toUpperCase();
      const matchOficina = oficinaFilter === 'all' || t.oficinaRegionalAtencion === oficinaFilter;
      const matchCCT = cctFilter === '' || t.cct.toUpperCase().includes(cctFilter.toUpperCase());
      return matchValle && matchMunicipio && matchModalidad && matchOficina && matchCCT;
    });
  }, [tickets, valleFilter, municipioFilter, modalidadFilter, oficinaFilter, cctFilter]);

  // Filtrado de Capacitación
  const filteredTrainings = useMemo(() => {
    return trainings.filter(tr => {
      const matchValle = valleFilter === 'all' || tr.asistenteValle.toUpperCase() === valleFilter.toUpperCase();
      const matchMunicipio = municipioFilter === 'all' || tr.asistenteMunicipio.toUpperCase() === municipioFilter.toUpperCase();
      const matchModalidad = modalidadFilter === 'all' || tr.asistenteModalidad.toUpperCase() === modalidadFilter.toUpperCase();
      const matchCCT = cctFilter === '' || tr.asistenteCCT.toUpperCase().includes(cctFilter.toUpperCase());
      return matchValle && matchMunicipio && matchModalidad && matchCCT;
    });
  }, [trainings, valleFilter, municipioFilter, modalidadFilter, cctFilter]);

  const stats = useMemo(() => {
    const resueltos = filteredTickets.filter(t => t.status === 'resuelto').length
    const enProceso = filteredTickets.filter(t => t.status === 'en proceso').length
    const pendientes = filteredTickets.filter(t => t.status === 'pendiente').length

    return {
      statusData: [
        { name: 'Resueltos', value: resueltos, fill: '#10b981' },
        { name: 'Proceso', value: enProceso, fill: '#eab308' },
        { name: 'Pendiente', value: pendientes, fill: '#ef4444' },
      ],
      serviceData: [
        { name: 'Red Edusat', value: filteredTickets.filter(t => t.tipoIncidencia === 'red edusat').length },
        { name: 'Red Local', value: filteredTickets.filter(t => t.tipoIncidencia === 'red local').length },
        { name: 'Mantenimiento', value: filteredTickets.filter(t => t.tipoIncidencia.includes('mantenimiento')).length },
      ],
      trainingByValle: [
        { name: 'MEXICO', value: filteredTrainings.filter(tr => tr.asistenteValle === 'MEXICO').length, fill: '#6366f1' },
        { name: 'TOLUCA', value: filteredTrainings.filter(tr => tr.asistenteValle === 'TOLUCA').length, fill: '#ec4899' },
      ]
    }
  }, [filteredTickets, filteredTrainings]);

  const UNIVERSE_STATS = useMemo(() => {
    return TARGET_UNIVERSE_DATA.map(target => {
      const atendidas = filteredTickets.filter(t => {
        const matchValle = (target.valle === 'MEXICO' && (t.valle.toUpperCase() === 'MEXICO' || t.valle.toUpperCase() === 'M')) ||
                          (target.valle === 'TOLUCA' && (t.valle.toUpperCase() === 'TOLUCA' || t.valle.toUpperCase() === 'T'));
        const matchModalidad = target.codes.some(code => t.modalidad.toUpperCase() === code.toUpperCase());
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
    setCctFilter('');
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header y Selector de Reporte Principal */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight text-primary uppercase">Centro de Mando Ejecutivo</h2>
            <p className="text-muted-foreground font-bold text-xs tracking-widest uppercase">
              Oficina de Planeación • Gestión de Datos e Impacto
            </p>
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

        {/* Barra de Filtros Globales */}
        <Card className="p-3 border-primary/20 bg-primary/5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase text-primary">Filtrar Todo por:</span>
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

            <Select value={municipioFilter} onValueChange={setMunicipioFilter}>
              <SelectTrigger className="h-9 text-xs w-[180px] bg-white border-primary/20">
                <SelectValue placeholder="Municipio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Municipios</SelectItem>
                {filterOptions.municipios.map(m => (
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

            <Input 
              placeholder="CCT..." 
              className="h-9 text-xs w-[120px] bg-white border-primary/20 font-mono uppercase"
              value={cctFilter}
              onChange={(e) => setCctFilter(e.target.value.toUpperCase())}
            />

            <Button variant="ghost" size="sm" className="h-9 px-3 text-[10px] font-black" onClick={clearFilters}>
              <RefreshCcw className="h-3 w-3 mr-1" /> REINICIAR
            </Button>
          </div>
        </Card>
      </div>

      {/* Contenido Dinámico por Reporte */}
      <Tabs value={activeReport} onValueChange={setActiveReport} className="w-full">
        {/* REPORTE DE SOPORTE TÉCNICO */}
        <TabsContent value="soporte" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="shadow-sm border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Redes Atendidas</span>
                <div className="text-2xl font-black">{filteredTickets.filter(t => t.tipoIncidencia.includes('red')).length}</div>
                <Network className="h-4 w-4 text-blue-500 mt-1" />
              </CardContent>
            </Card>
            <Card className="shadow-sm border-l-4 border-l-emerald-500">
              <CardContent className="p-6">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mantenimientos</span>
                <div className="text-2xl font-black">{filteredTickets.filter(t => t.tipoIncidencia.includes('mantenimiento')).length}</div>
                <Wrench className="h-4 w-4 text-emerald-500 mt-1" />
              </CardContent>
            </Card>
            <Card className="shadow-sm border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Beneficiarios</span>
                <div className="text-2xl font-black">{(filteredTickets.reduce((a, b) => a + (b.alumnosBeneficiados || 0), 0)).toLocaleString()}</div>
                <Users className="h-4 w-4 text-purple-500 mt-1" />
              </CardContent>
            </Card>
            <Card className="shadow-sm border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Eficiencia</span>
                <div className="text-2xl font-black">
                  {Math.round((filteredTickets.filter(t => t.status === 'resuelto').length / (filteredTickets.length || 1)) * 100)}%
                </div>
                <CheckCircle2 className="h-4 w-4 text-orange-500 mt-1" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm font-black uppercase">Estatus de Incidencias</CardTitle></CardHeader>
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
            <Card>
              <CardHeader><CardTitle className="text-sm font-black uppercase">Universo Escolar y Cobertura</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50"><TableRow>
                    <TableHead className="text-[10px] font-black">Modalidad</TableHead>
                    <TableHead className="text-[10px] font-black">Valle</TableHead>
                    <TableHead className="text-[10px] font-black text-center">Meta</TableHead>
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
        </TabsContent>

        {/* REPORTE DE CAPACITACIÓN */}
        <TabsContent value="capacitacion" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="shadow-sm border-l-4 border-l-blue-600">
              <CardContent className="p-6">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Personal Capacitado</span>
                <div className="text-2xl font-black">{filteredTrainings.length}</div>
                <Users className="h-4 w-4 text-blue-600 mt-1" />
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
            <Card className="md:col-span-1">
              <CardHeader><CardTitle className="text-sm font-black uppercase">Capacitación por Valle</CardTitle></CardHeader>
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
            <Card className="md:col-span-2">
              <CardHeader><CardTitle className="text-sm font-black uppercase">Últimos Registros de Capacitación</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50"><TableRow>
                    <TableHead className="text-[10px] font-black">Folio</TableHead>
                    <TableHead className="text-[10px] font-black">Curso</TableHead>
                    <TableHead className="text-[10px] font-black">Participante</TableHead>
                    <TableHead className="text-[10px] font-black">Plantel</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredTrainings.slice(0, 5).map((tr) => (
                      <TableRow key={tr.id}>
                        <TableCell className="text-[10px] font-bold">{tr.id}</TableCell>
                        <TableCell className="text-[10px] truncate max-w-[150px]">{tr.cursoNombre}</TableCell>
                        <TableCell className="text-[10px]">{tr.asistenteNombres} {tr.asistentePaterno}</TableCell>
                        <TableCell className="text-[10px] font-mono">{tr.asistenteCCT}</TableCell>
                      </TableRow>
                    ))}
                    {filteredTrainings.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-[10px] py-4">No hay datos para estos filtros.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* REPORTE DE PROGRAMAS */}
        <TabsContent value="programas" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-sm border-l-4 border-l-cyan-600">
              <CardContent className="p-6">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Programas Totales</span>
                <div className="text-2xl font-black">{programs.length}</div>
                <Briefcase className="h-4 w-4 text-cyan-600 mt-1" />
              </CardContent>
            </Card>
            <Card className="shadow-sm border-l-4 border-l-green-600">
              <CardContent className="p-6">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Avance Promedio</span>
                <div className="text-2xl font-black">
                  {Math.round(programs.reduce((a, b) => a + (b.progress || 0), 0) / (programs.length || 1))}%
                </div>
                <TrendingUp className="h-4 w-4 text-green-600 mt-1" />
              </CardContent>
            </Card>
            <Card className="shadow-sm border-l-4 border-l-indigo-600">
              <CardContent className="p-6">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Concluidos</span>
                <div className="text-2xl font-black">
                  {programs.filter(p => p.status === 'concluido').length}
                </div>
                <CheckCircle2 className="h-4 w-4 text-indigo-600 mt-1" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm font-black uppercase">Estatus de Metas por Programa</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {programs.map(p => (
                <div key={p.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase">{p.name}</span>
                      <Badge className="text-[9px] uppercase">{p.status}</Badge>
                    </div>
                    <span className="text-xs font-bold">{p.progress}%</span>
                  </div>
                  <Progress value={p.progress} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
