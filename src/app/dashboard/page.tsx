
'use client'
import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { 
  LifeBuoy, 
  GraduationCap, 
  Briefcase, 
  TrendingUp, 
  AlertCircle, 
  FileText, 
  Image as ImageIcon, 
  Eye,
  Map,
  CheckCircle2,
  Users
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
  Legend,
  LineChart,
  Line
} from 'recharts'
import { supportData, trainingRecords, programsData, type SupportTicket, type TrainingRecord, type ProgramStatus } from '@/lib/planning-data'
import { schoolsDirectory } from '@/lib/schools-directory'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'

export default function DashboardPage() {
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([])
  const [trainingList, setTrainingList] = useState<TrainingRecord[]>([])
  const [programsList, setProgramsList] = useState<ProgramStatus[]>([])

  useEffect(() => {
    const storedSupport = JSON.parse(localStorage.getItem('support_tickets_full') || '[]')
    const storedTraining = JSON.parse(localStorage.getItem('training_records_full') || '[]')
    const storedPrograms = JSON.parse(localStorage.getItem('programs_full') || '[]')

    setSupportTickets(storedSupport.length > 0 ? storedSupport : supportData)
    setTrainingList(storedTraining.length > 0 ? storedTraining : trainingRecords)
    setProgramsList(storedPrograms.length > 0 ? storedPrograms : programsData)
  }, [])

  // --- CÁLCULOS DE COBERTURA Y UNIVERSO ---
  const totalSchools = schoolsDirectory.length
  const attendedSchoolsCcts = new Set([
    ...supportTickets.map(s => s.cct),
    ...trainingList.map(t => t.asistenteCCT)
  ])
  const schoolsAttendedCount = Array.from(attendedSchoolsCcts).filter(cct => schoolsDirectory.some(s => s.cct === cct)).length
  const globalCoveragePercent = totalSchools > 0 ? Math.round((schoolsAttendedCount / totalSchools) * 100) : 0

  // --- ANÁLISIS POR OFICINAS REGIONALES ---
  const regions = Array.from(new Set(schoolsDirectory.map(s => s.region)))
  const regionalData = regions.map(reg => {
    const totalInReg = schoolsDirectory.filter(s => s.region === reg).length
    const attendedInReg = Array.from(attendedSchoolsCcts).filter(cct => 
      schoolsDirectory.some(s => s.cct === cct && s.region === reg)
    ).length
    const valle = schoolsDirectory.find(s => s.region === reg)?.valle || ''
    return { 
      name: `Región ${reg}`, 
      valle,
      total: totalInReg, 
      atendidos: attendedInReg,
      cobertura: totalInReg > 0 ? Math.round((attendedInReg / totalInReg) * 100) : 0
    }
  })

  // --- ESTADÍSTICAS POR OFICINA ---
  
  // Soporte
  const pendingSupport = supportTickets.filter(s => s.status === 'pendiente').length
  const inProcessSupport = supportTickets.filter(s => s.status === 'en proceso').length
  const resolvedSupport = supportTickets.filter(s => s.status === 'resuelto').length
  const totalIncidencias = supportTickets.length

  // Capacitación
  const totalCapacitados = trainingList.length
  const uniqueCourses = new Set(trainingList.map(t => t.cursoNombre)).size
  const totalHorasCapacitacion = trainingList.reduce((acc, curr) => acc + curr.duracionHoras, 0)

  // Programas
  const activePrograms = programsList.filter(p => p.status === 'activo').length
  const averageProgress = programsList.length > 0 
    ? Math.round(programsList.reduce((acc, curr) => acc + curr.progress, 0) / programsList.length)
    : 0

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter text-primary uppercase">Informe Ejecutivo</h2>
          <p className="text-muted-foreground font-medium uppercase text-sm tracking-widest">
            Oficina de Planeación • DESySA Edomex • Ciclo Escolar 2024-2025
          </p>
        </div>
        <div className="bg-primary/5 px-4 py-2 rounded-lg border border-primary/10 flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Cobertura Estatal</span>
            <span className="text-2xl font-black text-primary">{globalCoveragePercent}%</span>
          </div>
          <TrendingUp className="h-8 w-8 text-primary opacity-20" />
        </div>
      </div>

      {/* --- SECCIÓN 1: KPI GLOBALES --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Universo Atendido', value: schoolsAttendedCount, total: totalSchools, icon: <Map className="text-emerald-500" /> },
          { label: 'Incidencias Soporte', value: totalIncidencias, detail: `${pendingSupport} pendientes`, icon: <LifeBuoy className="text-red-500" /> },
          { label: 'Personal Capacitado', value: totalCapacitados, detail: `${uniqueCourses} cursos impartidos`, icon: <GraduationCap className="text-blue-500" /> },
          { label: 'Avance Programas', value: `${averageProgress}%`, detail: 'Promedio general', icon: <Briefcase className="text-purple-500" /> },
        ].map((kpi, i) => (
          <Card key={i} className="border-none shadow-md bg-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center">{kpi.icon}</div>
              </div>
              <div className="text-3xl font-black">{kpi.value}</div>
              {kpi.total ? (
                <div className="mt-2 flex flex-col gap-1">
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${Math.round((kpi.value as number / kpi.total) * 100)}%` }} />
                  </div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase text-right">Meta: {kpi.total} CCT</span>
                </div>
              ) : (
                <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1 inline-block">{kpi.detail}</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* --- SECCIÓN 2: DESGLOSE POR OFICINA --- */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Soporte Técnico */}
        <Card className="border-t-4 border-t-red-500 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-red-500" /> Soporte Técnico
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold">Resumen de Operatividad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Pendiente', value: pendingSupport, fill: '#ef4444' },
                      { name: 'En Proceso', value: inProcessSupport, fill: '#eab308' },
                      { name: 'Resuelto', value: resolvedSupport, fill: '#10b981' },
                    ]}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  />
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-red-50 rounded border border-red-100">
                <div className="text-xl font-black text-red-600">{pendingSupport}</div>
                <div className="text-[8px] font-bold uppercase text-red-400 leading-tight">Críticos</div>
              </div>
              <div className="p-2 bg-yellow-50 rounded border border-yellow-100">
                <div className="text-xl font-black text-yellow-600">{inProcessSupport}</div>
                <div className="text-[8px] font-bold uppercase text-yellow-400 leading-tight">En Ruta</div>
              </div>
              <div className="p-2 bg-green-50 rounded border border-green-100">
                <div className="text-xl font-black text-green-600">{resolvedSupport}</div>
                <div className="text-[8px] font-bold uppercase text-green-400 leading-tight">Listos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capacitación */}
        <Card className="border-t-4 border-t-blue-500 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-500" /> Capacitación
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold">Impacto de Formación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="text-xs font-bold uppercase">Personal Atendido</span>
                </div>
                <span className="text-xl font-black text-blue-700">{totalCapacitados}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="text-xs font-bold uppercase">Horas Impartidas</span>
                </div>
                <span className="text-xl font-black text-slate-700">{totalHorasCapacitacion} h</span>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-muted-foreground uppercase">Efectividad Regional</span>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionalData.map(r => ({ name: r.name, value: r.atendidos }))}>
                    <XAxis dataKey="name" hide />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Programas */}
        <Card className="border-t-4 border-t-purple-500 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-purple-500" /> Programas Estratégicos
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold">Avance de Metas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 pt-4">
              {programsList.map((prog, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                    <span className="truncate max-w-[150px]">{prog.name}</span>
                    <span>{prog.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${prog.progress === 100 ? 'bg-emerald-500' : 'bg-purple-500'}`}
                      style={{ width: `${prog.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-center">
              <span className="text-[9px] font-bold text-purple-400 uppercase">Programas Concluidos</span>
              <div className="text-3xl font-black text-purple-600">
                {programsList.filter(p => p.progress === 100).length} / {programsList.length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- SECCIÓN 3: INFORME POR OFICINAS REGIONALES --- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-xl border-none">
          <CardHeader>
            <CardTitle className="text-xl font-black text-primary flex items-center gap-2">
              <Map className="h-6 w-6" /> Cobertura por Oficina Regional
            </CardTitle>
            <CardDescription className="uppercase text-[10px] font-bold">Relación Universo de Atención vs Atendidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionalData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Legend verticalAlign="top" height={36}/>
                  <RechartsTooltip />
                  <Bar dataKey="total" name="Universo Regional" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="atendidos" name="CCT Atendidos" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4">
               {regionalData.map((reg, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-primary uppercase">{reg.name}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{reg.valle}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Atención</span>
                        <span className="text-lg font-black text-slate-700">{reg.atendidos}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Cobertura</span>
                        <Badge className="bg-emerald-500">{reg.cobertura}%</Badge>
                      </div>
                    </div>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>

        {/* --- CONSULTA DE EVIDENCIAS RECIENTES --- */}
        <Card className="shadow-xl border-none">
          <CardHeader>
            <CardTitle className="text-xl font-black text-primary flex items-center gap-2">
              <Eye className="h-6 w-6" /> Repositorio de Evidencias
            </CardTitle>
            <CardDescription className="uppercase text-[10px] font-bold">Últimos documentos con respaldo digital</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ...supportTickets.filter(s => s.reportPdf || (s.evidencePhotos && s.evidencePhotos.length > 0)).map(s => ({
                id: s.id, tipo: 'Soporte', nombre: s.schoolName, fecha: s.fechaEntrada, pdf: s.reportPdf, fotos: s.evidencePhotos || []
              })),
              ...trainingList.filter(t => t.reportPdf || (t.evidencePhotos && t.evidencePhotos.length > 0)).map(t => ({
                id: t.id, tipo: 'Capacitación', nombre: t.cursoNombre, fecha: t.fechaInicio, pdf: t.reportPdf, fotos: t.evidencePhotos || []
              }))
            ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 6).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/50 hover:bg-white transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${item.tipo === 'Soporte' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                    {item.tipo === 'Soporte' ? <LifeBuoy className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-primary uppercase">{item.tipo} - {item.id}</span>
                    <span className="text-xs font-bold truncate max-w-[200px]">{item.nombre}</span>
                    <span className="text-[9px] text-muted-foreground">{item.fecha}</span>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="outline" className="h-10 w-10 group-hover:bg-primary group-hover:text-white transition-colors">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px] h-[85vh] flex flex-col p-0">
                    <DialogHeader className="p-6 pb-0">
                      <DialogTitle className="text-2xl font-black text-primary uppercase">Expediente Digital</DialogTitle>
                      <CardDescription className="uppercase font-bold text-[10px]">{item.tipo} • Folio: {item.id} • {item.nombre}</CardDescription>
                    </DialogHeader>
                    <Separator className="my-2" />
                    <div className="flex-1 overflow-auto px-6 py-4 space-y-8">
                      {item.pdf && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-black uppercase flex items-center gap-2 text-slate-700">
                            <FileText className="h-4 w-4 text-blue-500" /> Reporte Oficial Validado
                          </h4>
                          <iframe src={item.pdf} className="w-full h-[500px] border rounded-xl shadow-inner" />
                        </div>
                      )}
                      {item.fotos.length > 0 && (
                        <div className="space-y-3 pb-6">
                          <h4 className="text-sm font-black uppercase flex items-center gap-2 text-slate-700">
                            <ImageIcon className="h-4 w-4 text-emerald-500" /> Acervo Fotográfico ({item.fotos.length})
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {item.fotos.map((foto, fIdx) => (
                              <div key={fIdx} className="relative aspect-video border rounded-xl overflow-hidden shadow-md group/img">
                                <Image src={foto} alt="ev" fill className="object-cover group-hover/img:scale-105 transition-transform" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
