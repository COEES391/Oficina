'use client'
import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { LifeBuoy, GraduationCap, Briefcase, TrendingUp, AlertCircle, FileText, Image as ImageIcon, Eye } from 'lucide-react'
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
import { supportData, trainingRecords, programsData, type SupportTicket, type TrainingRecord, type ProgramStatus } from '@/lib/planning-data'
import { schoolsDirectory } from '@/lib/schools-directory'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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

  // Universo a Atender (Cálculo de Cobertura)
  const totalSchools = schoolsDirectory.length
  const attendedSchoolsCcts = new Set([
    ...supportTickets.map(s => s.cct),
    ...trainingList.map(t => t.asistenteCCT)
  ])
  const schoolsAttendedCount = Array.from(attendedSchoolsCcts).filter(cct => schoolsDirectory.some(s => s.cct === cct)).length
  const coveragePercent = totalSchools > 0 ? Math.round((schoolsAttendedCount / totalSchools) * 100) : 0

  // Distribución por Modalidad (Universo vs Atendidos)
  const modalities = Array.from(new Set(schoolsDirectory.map(s => s.modalidad)))
  const universeByModality = modalities.map(mod => {
    const totalInMod = schoolsDirectory.filter(s => s.modalidad === mod).length
    const attendedInMod = Array.from(attendedSchoolsCcts).filter(cct => 
      schoolsDirectory.some(s => s.cct === cct && s.modalidad === mod)
    ).length
    return { name: mod, total: totalInMod, atendidos: attendedInMod }
  })

  // Estadísticas de Soporte
  const pendingSupport = supportTickets.filter(s => s.status === 'pendiente').length
  const resolvedSupport = supportTickets.filter(s => s.status === 'resuelto').length
  
  // Evidencias Recientes (Soporte y Capacitación)
  const recentEvidence = [
    ...supportTickets.filter(s => s.reportPdf || (s.evidencePhotos && s.evidencePhotos.length > 0)).map(s => ({
      id: s.id,
      tipo: 'Soporte',
      nombre: s.schoolName,
      fecha: s.fechaEntrada,
      pdf: s.reportPdf,
      fotos: s.evidencePhotos || []
    })),
    ...trainingList.filter(t => t.reportPdf || (t.evidencePhotos && t.evidencePhotos.length > 0)).map(t => ({
      id: t.id,
      tipo: 'Capacitación',
      nombre: t.cursoNombre,
      fecha: t.fechaInicio,
      pdf: t.reportPdf,
      fotos: t.evidencePhotos || []
    }))
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 5)

  const stats = [
    { title: 'Cobertura Universo', value: `${coveragePercent}%`, icon: <TrendingUp className="h-6 w-6 text-emerald-500" />, desc: `${schoolsAttendedCount} de ${totalSchools} CCT atendidos` },
    { title: 'Soporte Pendiente', value: pendingSupport, icon: <AlertCircle className="h-6 w-6 text-red-500" />, desc: 'Casos críticos' },
    { title: 'Personal Capacitado', value: trainingList.length, icon: <GraduationCap className="h-6 w-6 text-blue-500" />, desc: 'Registros ciclo escolar' },
    { title: 'Programas Activos', value: programsList.filter(p => p.status === 'activo').length, icon: <Briefcase className="h-6 w-6 text-purple-500" />, desc: 'En ejecución' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Panel de Control Estadístico</h2>
        <p className="text-muted-foreground">Monitoreo de universo de atención y cumplimiento institucional.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-all border-l-4 border-l-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{stat.value}</div>
              <p className="text-[10px] text-muted-foreground mt-1 font-semibold uppercase">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Universo por Modalidad */}
        <Card className="lg:col-span-4 shadow-sm border-t-4 border-t-emerald-500">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Cobertura por Modalidad Educativa
            </CardTitle>
            <CardDescription>Comparativa entre el Universo total vs. CCT atendidos.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={universeByModality} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Legend verticalAlign="top" height={36}/>
                  <RechartsTooltip />
                  <Bar dataKey="total" name="Universo Total" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="atendidos" name="CCT Atendidos" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Consultar Evidencias Recientes */}
        <Card className="lg:col-span-3 shadow-sm border-t-4 border-t-blue-500">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" /> Consulta de Evidencias Recientes
            </CardTitle>
            <CardDescription>Últimos reportes con respaldo digital.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentEvidence.length > 0 ? recentEvidence.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50 hover:bg-white transition-colors">
                <div className="flex flex-col max-w-[180px]">
                  <span className="text-[10px] font-bold text-primary uppercase">{item.tipo} - {item.id}</span>
                  <span className="text-xs font-bold truncate">{item.nombre}</span>
                  <span className="text-[9px] text-muted-foreground">{item.fecha}</span>
                </div>
                <div className="flex gap-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
                      <DialogHeader>
                        <DialogTitle>Evidencias: {item.nombre}</DialogTitle>
                      </DialogHeader>
                      <div className="flex-1 overflow-auto space-y-6 py-4">
                        {item.pdf && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-bold flex items-center gap-2">
                              <FileText className="h-4 w-4" /> Reporte Oficial PDF
                            </h4>
                            <iframe src={item.pdf} className="w-full h-[400px] border rounded" />
                          </div>
                        )}
                        {item.fotos.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-bold flex items-center gap-2">
                              <ImageIcon className="h-4 w-4" /> Galería de Fotos
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {item.fotos.map((foto, fIdx) => (
                                <div key={fIdx} className="relative aspect-video border rounded overflow-hidden">
                                  <Image src={foto} alt="ev" fill className="object-cover" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  {item.pdf && <FileText className="h-4 w-4 text-slate-400 mt-2" />}
                  {item.fotos.length > 0 && <span className="text-[10px] font-bold text-slate-400 mt-2">{item.fotos.length}</span>}
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-muted-foreground italic text-xs">
                No hay evidencias recientes cargadas.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Avance Crítico de Programas */}
      <Card className="shadow-sm border-t-4 border-t-purple-500">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-purple-500" /> Avance Crítico de Programas
          </CardTitle>
          <CardDescription>Cumplimiento de metas estratégicas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {programsList.map((program) => (
              <div key={program.id} className="p-4 border rounded-xl bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 truncate">{program.name}</span>
                  <Badge variant={program.progress === 100 ? 'default' : 'secondary'} className="text-[9px]">
                    {program.progress}%
                  </Badge>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${program.progress === 100 ? 'bg-emerald-500' : 'bg-purple-500'}`}
                    style={{ width: `${program.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
