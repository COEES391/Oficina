'use client'
import { useEffect, useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { 
  LifeBuoy, 
  Users, 
  Search, 
  FileText, 
  Image as ImageIcon, 
  Eye,
  CheckCircle2,
  Network,
  Wrench,
  Filter,
  Globe,
  LayoutGrid,
  RefreshCcw
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

// Datos del Universo proporcionados
const UNIVERSE_STATS = [
  { modalidad: 'GENERAL', valle: 'MEXICO', total: 175 },
  { modalidad: 'GENERAL', valle: 'TOLUCA', total: 77 },
  { modalidad: 'TECNICA', valle: 'MEXICO', total: 128 },
  { modalidad: 'TECNICA', valle: 'TOLUCA', total: 112 },
  { modalidad: 'TELESECUNDARIA', valle: 'MEXICO', total: 144 },
  { modalidad: 'TELESECUNDARIA', valle: 'TOLUCA', total: 194 },
];

export default function DashboardPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [cctSearch, setCctSearch] = useState('')
  const [filteredEvidence, setFilteredEvidence] = useState<SupportTicket[]>([])
  
  // Filtros
  const [municipioFilter, setMunicipioFilter] = useState('all')
  const [modalidadFilter, setModalidadFilter] = useState('all')
  const [cctFilter, setCctFilter] = useState('all')

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('support_tickets_full') || '[]')
    setTickets(stored.length > 0 ? stored : supportData)
  }, [])

  // Extraer opciones únicas del catálogo para los filtros (Cascada)
  const filterOptions = useMemo(() => {
    // Municipios únicos del catálogo para el selector principal
    const uniqueMunicipios = Array.from(new Set(schoolsDirectory.map(s => s.municipio))).sort();
    
    // Los CCT dependen de la Modalidad y el Municipio seleccionados
    const filteredForCCT = schoolsDirectory.filter(s => {
      const matchMunicipio = municipioFilter === 'all' || s.municipio === municipioFilter;
      const matchModalidad = modalidadFilter === 'all' || s.modalidad === modalidadFilter;
      return matchMunicipio && matchModalidad;
    });

    const uniqueCCTs = Array.from(new Set(filteredForCCT.map(s => s.cct))).sort();
    
    return { municipios: uniqueMunicipios, ccts: uniqueCCTs };
  }, [municipioFilter, modalidadFilter]);

  // Resetear CCT si deja de ser válido para los nuevos filtros
  useEffect(() => {
    if (cctFilter !== 'all' && !filterOptions.ccts.includes(cctFilter)) {
      setCctFilter('all');
    }
  }, [filterOptions.ccts, cctFilter]);

  // Datos filtrados para el informe ejecutivo
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchMunicipio = municipioFilter === 'all' || t.municipio.toUpperCase() === municipioFilter.toUpperCase();
      const matchModalidad = modalidadFilter === 'all' || t.modalidad.toUpperCase() === modalidadFilter.toUpperCase();
      const matchCCT = cctFilter === 'all' || t.cct === cctFilter;
      return matchMunicipio && matchModalidad && matchCCT;
    });
  }, [tickets, municipioFilter, modalidadFilter, cctFilter]);

  // Estadísticas del Informe Ejecutivo
  const totalEdusat = filteredTickets.filter(t => t.tipoIncidencia === 'red edusat').length
  const totalLocal = filteredTickets.filter(t => t.tipoIncidencia === 'red local' || t.tipoIncidencia === 'instalación red local').length
  const totalPrev = filteredTickets.filter(t => t.tipoIncidencia === 'mantenimiento preventivo').length
  const totalCorr = filteredTickets.filter(t => t.tipoIncidencia === 'mantenimiento correctivo').length
  
  const totalAlumnos = filteredTickets.reduce((acc, curr) => acc + (curr.alumnosBeneficiados || 0), 0)
  const totalDocentes = filteredTickets.reduce((acc, curr) => acc + (curr.docentesBeneficiados || 0), 0)

  const handleSearchEvidence = () => {
    const results = tickets.filter(t => t.cct.includes(cctSearch.toUpperCase()) && (t.reportPdf || (t.evidencePhotos && t.evidencePhotos.length > 0)))
    setFilteredEvidence(results)
  }

  const chartData = [
    { name: 'Edusat', value: totalEdusat, fill: '#3b82f6' },
    { name: 'Red Local', value: totalLocal, fill: '#10b981' },
    { name: 'M. Prev', value: totalPrev, fill: '#eab308' },
    { name: 'M. Corr', value: totalCorr, fill: '#ef4444' },
  ]

  // Función para obtener atendidos por modalidad y valle
  const getAtendidos = (modalidad: string, valle: string) => {
    return tickets.filter(t => 
      t.modalidad.toUpperCase() === modalidad.toUpperCase() && 
      t.valle.toUpperCase() === valle.toUpperCase()
    ).length;
  };

  const clearFilters = () => {
    setMunicipioFilter('all');
    setCctFilter('all');
    setModalidadFilter('all');
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase">Informe Ejecutivo: Soporte Técnico</h2>
          <p className="text-muted-foreground font-bold text-xs tracking-widest uppercase">
            Oficina de Planeación • Operatividad y Cobertura Estatal
          </p>
        </div>
        
        {/* Barra de Filtros Inteligentes con Desplegables */}
        <Card className="p-3 border-primary/20 bg-primary/5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase text-primary">Filtrar por:</span>
            </div>
            
            <Select value={modalidadFilter} onValueChange={setModalidadFilter}>
              <SelectTrigger className="h-9 text-xs w-[180px] bg-white border-primary/20">
                <SelectValue placeholder="Seleccionar Modalidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Modalidades</SelectItem>
                <SelectItem value="GENERAL">Secundaria General</SelectItem>
                <SelectItem value="TECNICA">Secundaria Técnica</SelectItem>
                <SelectItem value="TELESECUNDARIA">Telesecundaria</SelectItem>
              </SelectContent>
            </Select>

            <Select value={municipioFilter} onValueChange={setMunicipioFilter}>
              <SelectTrigger className="h-9 text-xs w-[180px] bg-white border-primary/20">
                <SelectValue placeholder="Seleccionar Municipio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Municipios ({filterOptions.municipios.length})</SelectItem>
                {filterOptions.municipios.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={cctFilter} onValueChange={setCctFilter}>
              <SelectTrigger className="h-9 text-xs w-[160px] bg-white border-primary/20 font-mono">
                <SelectValue placeholder="Seleccionar CCT" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las CCT ({filterOptions.ccts.length})</SelectItem>
                {filterOptions.ccts.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-3 text-[10px] font-black bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              onClick={clearFilters}
            >
              <RefreshCcw className="h-3 w-3 mr-1" /> REINICIAR
            </Button>
          </div>
        </Card>
      </div>

      {/* KPI GLOBALES */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-l-4 border-l-blue-500 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Redes Atendidas</span>
              <Network className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-black">{totalEdusat + totalLocal}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase">{totalEdusat} Edusat / {totalLocal} Locales</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-emerald-500 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mantenimientos</span>
              <Wrench className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-black">{totalPrev + totalCorr}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase">{totalPrev} Prev / {totalCorr} Corr</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-purple-500 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Alumnos Beneficiados</span>
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-2xl font-black">{totalAlumnos.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase">Impacto Estudiantil</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-orange-500 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Docentes Beneficiados</span>
              <CheckCircle2 className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-2xl font-black">{totalDocentes.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase">Impacto Magisterial</p>
          </CardContent>
        </Card>
      </div>

      {/* Universo de Atención */}
      <Card className="shadow-lg border-t-4 border-t-primary">
        <CardHeader className="bg-slate-50/50 pb-4">
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-xl font-black uppercase">Universo de Atención por Modalidad y Valle</CardTitle>
              <CardDescription className="text-xs font-bold uppercase">Cobertura Institucional vs Universo Programado (830 CCT)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-5 divide-x">
            <div className="lg:col-span-3">
              <Table>
                <TableHeader className="bg-slate-100">
                  <TableRow>
                    <TableHead className="font-black text-xs uppercase">Modalidad</TableHead>
                    <TableHead className="font-black text-xs uppercase">Valle</TableHead>
                    <TableHead className="font-black text-xs uppercase text-center">Universo CCT</TableHead>
                    <TableHead className="font-black text-xs uppercase text-center">Atendidos</TableHead>
                    <TableHead className="font-black text-xs uppercase w-[150px]">Avance (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {UNIVERSE_STATS.map((row, idx) => {
                    const atendidos = getAtendidos(row.modalidad, row.valle);
                    const percent = Math.min(Math.round((atendidos / row.total) * 100), 100);
                    return (
                      <TableRow key={idx} className="hover:bg-slate-50/50">
                        <TableCell className="font-bold text-xs py-3">{row.modalidad}</TableCell>
                        <TableCell className="text-xs font-medium">{row.valle}</TableCell>
                        <TableCell className="text-center font-black">{row.total}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={atendidos > 0 ? "default" : "outline"} className="font-mono">{atendidos}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span>{percent}%</span>
                              <span className="text-muted-foreground">{atendidos}/{row.total}</span>
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
            </div>
            
            <div className="lg:col-span-2 p-6 bg-slate-50/30">
              <h4 className="text-sm font-black uppercase mb-4 flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-primary" /> Eficiencia por Tipo de Servicio
              </h4>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} width={80} />
                    <RechartsTooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buscador de Evidencias */}
      <Card className="shadow-md border-none overflow-hidden">
        <CardHeader className="bg-slate-900 text-white">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-400" /> Consulta de Expedientes por CCT
          </CardTitle>
          <CardDescription className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">
            Auditoría de reportes y fotografías de mantenimiento
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-2">
            <Input 
              placeholder="Ingrese CCT (ejem: 15EES0001Z)" 
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
                    <div className="flex items-center gap-2 pt-2">
                      <div className="flex -space-x-2">
                        {item.reportPdf && (
                          <div className="h-6 w-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center" title="PDF Disponible">
                            <FileText className="h-3 w-3 text-blue-600" />
                          </div>
                        )}
                        {item.evidencePhotos && item.evidencePhotos.length > 0 && (
                          <div className="h-6 w-6 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center" title={`${item.evidencePhotos.length} Fotos`}>
                            <ImageIcon className="h-3 w-3 text-emerald-600" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Expediente Digital: {item.reportPdf ? 'PDF' : ''} {item.evidencePhotos?.length ? `+ ${item.evidencePhotos.length} FOTOS` : ''}</span>
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
                            Expediente: {item.id} - {item.cct}
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
                              <h4 className="text-xs font-black uppercase text-primary border-l-4 border-primary pl-2">Galería Fotográfica de Campo</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {item.evidencePhotos.map((foto, fIdx) => (
                                  <div key={fIdx} className="relative aspect-video border rounded-xl overflow-hidden shadow-md hover:scale-[1.02] transition-transform">
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
                  {cctSearch ? 'No se encontraron registros para este CCT.' : 'Ingrese una CCT para auditar evidencias digitales.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
