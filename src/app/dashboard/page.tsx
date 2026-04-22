'use client'
import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { 
  LifeBuoy, 
  Monitor, 
  Users, 
  Search, 
  FileText, 
  Image as ImageIcon, 
  Eye,
  CheckCircle2,
  AlertCircle,
  Network,
  Wrench
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
} from 'recharts'
import { supportData, type SupportTicket } from '@/lib/planning-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'

export default function DashboardPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [cctSearch, setCctSearch] = useState('')
  const [filteredEvidence, setFilteredEvidence] = useState<SupportTicket[]>([])

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('support_tickets_full') || '[]')
    setTickets(stored.length > 0 ? stored : supportData)
  }, [])

  // Estadísticas del Informe Ejecutivo
  const totalEdusat = tickets.filter(t => t.tipoIncidencia === 'red edusat').length
  const totalLocal = tickets.filter(t => t.tipoIncidencia === 'red local' || t.tipoIncidencia === 'instalación red local').length
  const totalPrev = tickets.filter(t => t.tipoIncidencia === 'mantenimiento preventivo').length
  const totalCorr = tickets.filter(t => t.tipoIncidencia === 'mantenimiento correctivo').length
  
  const totalAlumnos = tickets.reduce((acc, curr) => acc + (curr.alumnosBeneficiados || 0), 0)
  const totalDocentes = tickets.reduce((acc, curr) => acc + (curr.docentesBeneficiados || 0), 0)

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

  return (
    <div className="space-y-8 pb-10">
      <div className="space-y-1">
        <h2 className="text-3xl font-black tracking-tight text-primary uppercase">Informe Ejecutivo: Soporte Técnico</h2>
        <p className="text-muted-foreground font-medium text-sm tracking-widest uppercase">
          Oficina de Planeación • Resumen de Operatividad y Beneficio Educativo
        </p>
      </div>

      {/* KPI GLOBALES */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Redes Atendidas</span>
              <Network className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-black">{totalEdusat + totalLocal}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase">{totalEdusat} Edusat / {totalLocal} Locales</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mantenimientos</span>
              <Wrench className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-black">{totalPrev + totalCorr}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase">{totalPrev} Prev / {totalCorr} Corr</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Alumnos Beneficiados</span>
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-2xl font-black">{totalAlumnos.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase">Impacto Estudiantil</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-orange-500">
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Distribución de Servicios */}
        <Card className="shadow-md border-none">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Distribución de Incidencias Atendidas</CardTitle>
            <CardDescription className="text-xs uppercase">Desglose por tipo de servicio técnico</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Buscador de Evidencias */}
        <Card className="shadow-md border-none">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" /> Consulta de Evidencias por CCT
            </CardTitle>
            <CardDescription className="text-xs uppercase">Localice reportes y fotos mediante la Clave de Centro de Trabajo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="Ingrese CCT (ejem: 15EES0001Z)" 
                value={cctSearch} 
                onChange={e => setCctSearch(e.target.value.toUpperCase())}
                className="uppercase font-mono"
              />
              <Button onClick={handleSearchEvidence} className="gap-2">
                <Eye className="h-4 w-4" /> Consultar
              </Button>
            </div>

            <Separator className="my-4" />

            <div className="space-y-3 max-h-[300px] overflow-auto">
              {filteredEvidence.length > 0 ? filteredEvidence.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/50 hover:bg-white transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center">
                      <LifeBuoy className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-primary uppercase">{item.id} - {item.fechaEntrada}</span>
                      <span className="text-xs font-bold truncate max-w-[200px]">{item.schoolName}</span>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="outline" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col p-0">
                      <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="uppercase font-black">{item.id} - Expediente</DialogTitle>
                      </DialogHeader>
                      <div className="flex-1 overflow-auto px-6 py-4 space-y-6">
                        {item.reportPdf && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-500" /> Reporte Oficial PDF
                            </h4>
                            <iframe src={item.reportPdf} className="w-full h-[400px] border rounded shadow-inner" />
                          </div>
                        )}
                        {item.evidencePhotos && item.evidencePhotos.length > 0 && (
                          <div className="space-y-2 pb-6">
                            <h4 className="text-xs font-bold uppercase flex items-center gap-2">
                              <ImageIcon className="h-4 w-4 text-emerald-500" /> Evidencias Fotográficas
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {item.evidencePhotos.map((foto, fIdx) => (
                                <div key={fIdx} className="relative aspect-video border rounded overflow-hidden shadow-sm">
                                  <Image src={foto} alt="ev" fill className="object-cover" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )) : (
                <div className="text-center py-10 text-muted-foreground italic text-sm">
                  {cctSearch ? 'No se encontraron evidencias para este CCT.' : 'Ingrese un CCT para comenzar la búsqueda.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}