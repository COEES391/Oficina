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
  BarChart3
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
import { supportData, type SupportTicket } from '@/lib/planning-data'
import { schoolsDirectory } from '@/lib/schools-directory'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Image from 'next/image'

// Metas del Universo según imagen proporcionada
const TARGET_UNIVERSE_DATA = [
  { modalidad: 'SECUNDARIA GENERAL', valle: 'MEXICO', total: 175, codes: ['DES', 'DSN'] },
  { modalidad: 'SECUNDARIA GENERAL', valle: 'TOLUCA', total: 77, codes: ['DES', 'DSN'] },
  { modalidad: 'SECUNDARIA TECNICA', valle: 'MEXICO', total: 128, codes: ['DST'] },
  { modalidad: 'SECUNDARIA TECNICA', valle: 'TOLUCA', total: 112, codes: ['DST'] },
  { modalidad: 'TELESECUNDARIA', valle: 'MEXICO', total: 144, codes: ['DTV', 'FTV'] },
  { modalidad: 'TELESECUNDARIA', valle: 'TOLUCA', total: 194, codes: ['DTV', 'FTV'] },
];

export default function DashboardPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [cctSearch, setCctSearch] = useState('')
  const [filteredEvidence, setFilteredEvidence] = useState<SupportTicket[]>([])
  
  // Filtros
  const [valleFilter, setValleFilter] = useState('all')
  const [municipioFilter, setMunicipioFilter] = useState('all')
  const [modalidadFilter, setModalidadFilter] = useState('all')
  const [cctFilter, setCctFilter] = useState('')

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('support_tickets_full') || '[]')
    setTickets(stored.length > 0 ? stored : supportData)
  }, [])

  // Opciones de filtros dinámicas basadas en el catálogo con lógica en cascada
  const filterOptions = useMemo(() => {
    // 1. Valles únicos
    const valles = Array.from(new Set(schoolsDirectory.map(s => s.valle))).sort();

    // 2. Modalidades según Valle seleccionado
    const listByValle = valleFilter === 'all' 
      ? schoolsDirectory 
      : schoolsDirectory.filter(s => s.valle.toUpperCase() === valleFilter.toUpperCase());
    
    const modalidades = Array.from(new Set(listByValle.map(s => s.modalidad))).sort();
    
    // 3. Municipios según Valle y Modalidad seleccionados
    const listByModalidad = modalidadFilter === 'all'
      ? listByValle
      : listByValle.filter(s => s.modalidad.toUpperCase() === modalidadFilter.toUpperCase());
    
    const municipios = Array.from(new Set(listByModalidad.map(s => s.municipio))).sort();
    
    return { valles, modalidades, municipios };
  }, [valleFilter, modalidadFilter]);

  // Resetear filtros dependientes
  useEffect(() => {
    if (modalidadFilter !== 'all' && !filterOptions.modalidades.includes(modalidadFilter)) {
      setModalidadFilter('all');
    }
    if (municipioFilter !== 'all' && !filterOptions.municipios.includes(municipioFilter)) {
      setMunicipioFilter('all');
    }
  }, [filterOptions.modalidades, filterOptions.municipios, modalidadFilter, municipioFilter]);

  // Datos filtrados para el informe ejecutivo
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchValle = valleFilter === 'all' || t.valle.toUpperCase() === valleFilter.toUpperCase();
      const matchMunicipio = municipioFilter === 'all' || t.municipio.toUpperCase() === municipioFilter.toUpperCase();
      const matchModalidad = modalidadFilter === 'all' || t.modalidad.toUpperCase() === modalidadFilter.toUpperCase();
      const matchCCT = cctFilter === '' || t.cct.toUpperCase().includes(cctFilter.toUpperCase());
      return matchValle && matchMunicipio && matchModalidad && matchCCT;
    });
  }, [tickets, valleFilter, municipioFilter, modalidadFilter, cctFilter]);

  // Estadísticas para Gráficos
  const stats = useMemo(() => {
    const totalEdusat = filteredTickets.filter(t => t.tipoIncidencia === 'red edusat').length
    const totalLocal = filteredTickets.filter(t => t.tipoIncidencia === 'red local' || t.tipoIncidencia === 'instalación red local').length
    const totalPrev = filteredTickets.filter(t => t.tipoIncidencia === 'mantenimiento preventivo').length
    const totalCorr = filteredTickets.filter(t => t.tipoIncidencia === 'mantenimiento correctivo').length

    const resueltos = filteredTickets.filter(t => t.status === 'resuelto').length
    const enProceso = filteredTickets.filter(t => t.status === 'en proceso').length
    const pendientes = filteredTickets.filter(t => t.status === 'pendiente').length

    const ticketsMexico = filteredTickets.filter(t => t.valle.toUpperCase() === 'MEXICO' || t.valle.toUpperCase() === 'M').length
    const ticketsToluca = filteredTickets.filter(t => t.valle.toUpperCase() === 'TOLUCA' || t.valle.toUpperCase() === 'T').length

    return {
      serviceData: [
        { name: 'Edusat', value: totalEdusat, fill: '#3b82f6' },
        { name: 'Red Local', value: totalLocal, fill: '#10b981' },
        { name: 'M. Prev', value: totalPrev, fill: '#eab308' },
        { name: 'M. Corr', value: totalCorr, fill: '#ef4444' },
      ],
      statusData: [
        { name: 'Resueltos', value: resueltos, fill: '#10b981' },
        { name: 'Proceso', value: enProceso, fill: '#eab308' },
        { name: 'Pendiente', value: pendientes, fill: '#ef4444' },
      ],
      valleData: [
        { name: 'MÉXICO', value: ticketsMexico, fill: '#6366f1' },
        { name: 'TOLUCA', value: ticketsToluca, fill: '#ec4899' },
      ]
    }
  }, [filteredTickets]);

  const totalAlumnos = filteredTickets.reduce((acc, curr) => acc + (curr.alumnosBeneficiados || 0), 0)
  const totalDocentes = filteredTickets.reduce((acc, curr) => acc + (curr.docentesBeneficiados || 0), 0)

  const handleSearchEvidence = () => {
    const results = tickets.filter(t => t.cct.toUpperCase().includes(cctSearch.toUpperCase()) && (t.reportPdf || (t.evidencePhotos && t.evidencePhotos.length > 0)))
    setFilteredEvidence(results)
  }

  // Análisis dinámico basado en las metas del universo escolar (830 planteles)
  const UNIVERSE_STATS = useMemo(() => {
    return TARGET_UNIVERSE_DATA.map(target => {
      // Filtrar tickets que coincidan con los códigos de esta categoría y el valle
      const atendidas = tickets.filter(t => {
        const matchValle = (target.valle === 'MEXICO' && (t.valle.toUpperCase() === 'MEXICO' || t.valle.toUpperCase() === 'M')) ||
                          (target.valle === 'TOLUCA' && (t.valle.toUpperCase() === 'TOLUCA' || t.valle.toUpperCase() === 'T'));
        const matchModalidad = target.codes.some(code => t.modalidad.toUpperCase() === code.toUpperCase());
        return matchValle && matchModalidad;
      }).length;

      return {
        modalidad: target.modalidad,
        valle: target.valle,
        total: target.total,
        atendidas: atendidas
      };
    });
  }, [tickets]);

  const clearFilters = () => {
    setValleFilter('all');
    setMunicipioFilter('all');
    setCctFilter('');
    setModalidadFilter('all');
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase">Informe Ejecutivo de Soporte</h2>
          <p className="text-muted-foreground font-bold text-xs tracking-widest uppercase">
            Oficina de Planeación • Cobertura y Operatividad
          </p>
        </div>
        
        <Card className="p-3 border-primary/20 bg-primary/5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase text-primary">Filtrar por:</span>
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
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">Municipio (Todos)</SelectItem>
                {filterOptions.municipios.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input 
              placeholder="Escribir CCT..." 
              className="h-9 text-xs w-[180px] bg-white border-primary/20 font-mono uppercase"
              value={cctFilter}
              onChange={(e) => setCctFilter(e.target.value.toUpperCase())}
            />

            <Button variant="outline" size="sm" className="h-9 px-3 text-[10px] font-black bg-white" onClick={clearFilters}>
              <RefreshCcw className="h-3 w-3 mr-1" /> REINICIAR
            </Button>
          </div>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Redes Atendidas</span>
              <Network className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-black">{filteredTickets.filter(t => ['red edusat', 'red local', 'instalación red local'].includes(t.tipoIncidencia)).length}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase">Casos Registrados</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mantenimientos</span>
              <Wrench className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-black">{filteredTickets.filter(t => ['mantenimiento preventivo', 'mantenimiento correctivo'].includes(t.tipoIncidencia)).length}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase">Servicios Técnicos</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Impacto Alumnos</span>
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-2xl font-black">{totalAlumnos.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase">Beneficiados</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Impacto Docentes</span>
              <CheckCircle2 className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-2xl font-black">{totalDocentes.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase">Atendidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Analíticos */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-md border-t-2 border-t-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black flex items-center gap-2 uppercase">
              <PieChartIcon className="h-4 w-4 text-primary" /> Estatus Operativo
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md border-t-2 border-t-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black flex items-center gap-2 uppercase">
              <LayoutGrid className="h-4 w-4 text-primary" /> Servicios por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.serviceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fontWeight: 700 }} />
                <RechartsTooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md border-t-2 border-t-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black flex items-center gap-2 uppercase">
              <BarChart3 className="h-4 w-4 text-primary" /> Atención por Valle
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.valleData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RechartsTooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                   {stats.valleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Universo Escolar y Cobertura (Basado en 830 planteles) */}
      <Card className="shadow-lg border-t-4 border-t-primary">
        <CardHeader className="bg-slate-50/50 pb-4">
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-xl font-black uppercase">Universo Escolar y Cobertura (Ciclo Actual)</CardTitle>
              <CardDescription className="text-xs font-bold uppercase">Metas institucionales por Valle y Modalidad</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100">
              <TableRow>
                <TableHead className="font-black text-xs uppercase">Modalidad</TableHead>
                <TableHead className="font-black text-xs uppercase">Valle</TableHead>
                <TableHead className="font-black text-xs uppercase text-center">Meta Universo</TableHead>
                <TableHead className="font-black text-xs uppercase text-center">Atendidas</TableHead>
                <TableHead className="font-black text-xs uppercase w-[200px]">Avance Operativo (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {UNIVERSE_STATS.map((row, idx) => {
                const percent = row.total > 0 ? Math.min(Math.round((row.atendidas / row.total) * 100), 100) : 0;
                return (
                  <TableRow key={idx} className="hover:bg-slate-50/50">
                    <TableCell className="font-bold text-xs py-3">{row.modalidad}</TableCell>
                    <TableCell className="text-xs font-medium">{row.valle}</TableCell>
                    <TableCell className="text-center font-black">{row.total}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={row.atendidas > 0 ? "default" : "outline"} className="font-mono">{row.atendidas}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span>{percent}%</span>
                          <span className="text-muted-foreground">{row.atendidas}/{row.total}</span>
                        </div>
                        <Progress value={percent} className="h-1.5" />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              <TableRow className="bg-primary/5 font-black">
                <TableCell colSpan={2} className="text-right uppercase">Total Universo Programado</TableCell>
                <TableCell className="text-center text-lg">830</TableCell>
                <TableCell className="text-center text-lg">{tickets.length}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                     <div className="flex justify-between text-[10px]">
                        <span>{Math.round((tickets.length / 830) * 100)}% Cobertura Global</span>
                     </div>
                     <Progress value={(tickets.length / 830) * 100} className="h-2" />
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Expedientes Digitales */}
      <Card className="shadow-md border-none overflow-hidden">
        <CardHeader className="bg-slate-900 text-white">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-400" /> Auditoría de Expedientes por CCT
          </CardTitle>
          <CardDescription className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">
            Consulta de reportes técnicos y evidencias fotográficas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-2">
            <Input 
              placeholder="Ingrese CCT para buscar evidencias..." 
              value={cctSearch} 
              onChange={e => setCctSearch(e.target.value.toUpperCase())}
              className="uppercase font-mono border-2 focus:border-primary h-11"
            />
            <Button onClick={handleSearchEvidence} className="gap-2 bg-primary hover:bg-primary/90 px-6 font-bold uppercase">
              <Eye className="h-4 w-4" /> Consultar
            </Button>
          </div>

          <Separator className="my-6" />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvidence.length > 0 ? filteredEvidence.map((item, idx) => (
              <Card key={idx} className="group hover:border-primary transition-all shadow-sm bg-slate-50/50">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <FileText className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" className="text-[9px] font-mono bg-white">{item.fechaEntrada}</Badge>
                    </div>
                    <div>
                      <h4 className="font-black text-xs text-primary truncate uppercase">{item.cct}</h4>
                      <p className="text-[10px] font-bold truncate text-muted-foreground uppercase">{item.schoolName}</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full h-8 text-[10px] font-black uppercase mt-2 group-hover:bg-primary group-hover:text-white">
                          Abrir Documentación
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[900px] h-[85vh] flex flex-col p-0">
                        <DialogHeader className="p-6 pb-2 border-b bg-slate-50">
                          <DialogTitle className="uppercase font-black flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" /> 
                            Expediente Digital: {item.id}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-auto px-8 py-6 space-y-8">
                          {item.reportPdf && (
                            <div className="space-y-3">
                              <h4 className="text-xs font-black uppercase text-primary border-l-4 border-primary pl-2">Reporte Oficial PDF</h4>
                              <iframe src={item.reportPdf} className="w-full h-[500px] border rounded-xl shadow-inner" />
                            </div>
                          )}
                          {item.evidencePhotos && item.evidencePhotos.length > 0 && (
                            <div className="space-y-3 pb-8">
                              <h4 className="text-xs font-black uppercase text-primary border-l-4 border-primary pl-2">Galería Fotográfica</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {item.evidencePhotos.map((foto, fIdx) => (
                                  <div key={fIdx} className="relative aspect-video border rounded-xl overflow-hidden shadow-md">
                                    <Image src={foto} alt={`evidencia-${fIdx}`} fill className="object-cover" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full text-center py-16 border-2 border-dashed rounded-2xl bg-slate-50/50">
                <Search className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase text-sm">
                  {cctSearch ? 'No hay evidencias para este CCT.' : 'Ingrese una CCT para consultar su expediente.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
