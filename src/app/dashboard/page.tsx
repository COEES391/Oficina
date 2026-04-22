'use client'
import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { LifeBuoy, GraduationCap, Briefcase, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
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
  Pie
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { supportData, trainingRecords, programsData, type SupportTicket, type TrainingRecord, type ProgramStatus } from '@/lib/planning-data'

export default function DashboardPage() {
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([])
  const [trainingRecordsList, setTrainingRecordsList] = useState<TrainingRecord[]>([])
  const [programsList, setProgramsList] = useState<ProgramStatus[]>([])

  useEffect(() => {
    // Load from localStorage or fallback to defaults
    const storedSupport = JSON.parse(localStorage.getItem('support_tickets_full') || '[]')
    const storedTraining = JSON.parse(localStorage.getItem('training_records_full') || '[]')
    const storedPrograms = JSON.parse(localStorage.getItem('programs_full') || '[]')

    setSupportTickets(storedSupport.length > 0 ? storedSupport : supportData)
    setTrainingRecordsList(storedTraining.length > 0 ? storedTraining : trainingRecords)
    setProgramsList(storedPrograms.length > 0 ? storedPrograms : programsData)
  }, [])

  // Support Stats
  const pendingSupport = supportTickets.filter(s => s.status === 'pendiente').length
  const inProgressSupport = supportTickets.filter(s => s.status === 'en proceso').length
  const resolvedSupport = supportTickets.filter(s => s.status === 'resuelto').length
  
  const supportChartData = [
    { name: 'Pendientes', value: pendingSupport, color: '#ef4444' },
    { name: 'En Proceso', value: inProgressSupport, color: '#f59e0b' },
    { name: 'Resueltos', value: resolvedSupport, color: '#22c55e' },
  ]

  // Training Stats
  const totalTrained = trainingRecordsList.length
  const totalHours = trainingRecordsList.reduce((acc, curr) => acc + (curr.duracionHoras || 0), 0)
  
  // Programs Stats
  const activePrograms = programsList.filter(p => p.status === 'activo').length
  const avgProgress = programsList.length > 0 
    ? Math.round(programsList.reduce((acc, curr) => acc + curr.progress, 0) / programsList.length) 
    : 0

  const stats = [
    { title: 'Soporte Pendiente', value: pendingSupport, icon: <AlertCircle className="h-6 w-6 text-red-500" />, desc: 'Casos por atender' },
    { title: 'Personal Capacitado', value: totalTrained, icon: <GraduationCap className="h-6 w-6 text-blue-500" />, desc: 'Acumulado ciclo' },
    { title: 'Programas Activos', value: activePrograms, icon: <Briefcase className="h-6 w-6 text-green-500" />, desc: 'En ejecución' },
    { title: 'Avance General', value: `${avgProgress}%`, icon: <TrendingUp className="h-6 w-6 text-purple-500" />, desc: 'Meta institucional' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Panel de Control Estadístico</h2>
        <p className="text-muted-foreground">Monitoreo de indicadores de desempeño de la Oficina de Planeación.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-all border-l-4 border-l-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">{stat.title}</CardTitle>
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
        {/* Gráfica Soporte */}
        <Card className="lg:col-span-4 shadow-sm border-t-4 border-t-red-500">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-red-500" /> Semáforo de Soporte Técnico
            </CardTitle>
            <CardDescription>Distribución de estatus de reportes actuales.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supportChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-2 border rounded shadow-sm text-xs font-bold">
                            {`${payload[0].payload.name}: ${payload[0].value} reportes`}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {supportChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Resumen Capacitación */}
        <Card className="lg:col-span-3 shadow-sm border-t-4 border-t-blue-500">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-500" /> Eficiencia en Capacitación
            </CardTitle>
            <CardDescription>Horas hombre y alcance total.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-around items-center py-4">
              <div className="text-center">
                <div className="text-3xl font-black text-blue-600">{totalHours}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Horas Totales</div>
              </div>
              <div className="h-10 w-px bg-muted"></div>
              <div className="text-center">
                <div className="text-3xl font-black text-blue-600">{totalTrained}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Asistentes</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Meta Semestral</span>
                <span>{Math.min(100, Math.round((totalTrained/200)*100))}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (totalTrained/200)*100)}%` }}
                ></div>
              </div>
            </div>
            
            <p className="text-[10px] italic text-muted-foreground bg-blue-50 p-2 rounded border border-blue-100">
              * Datos basados en los últimos cursos registrados para el ciclo escolar vigente.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Avance de Programas */}
      <Card className="shadow-sm border-t-4 border-t-green-500">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-green-500" /> Avance Crítico de Programas Educativos
          </CardTitle>
          <CardDescription>Cumplimiento de metas por proyecto estratégico.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {programsList.map((program) => (
              <div key={program.id} className="p-4 border rounded-xl bg-slate-50/50 hover:bg-white transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{program.name}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${program.progress === 100 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {program.progress}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${program.progress === 100 ? 'bg-green-500' : 'bg-primary'}`}
                    style={{ width: `${program.progress}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                  {program.status === 'concluido' ? '✓ Meta alcanzada' : `En fase de ${program.status}`}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
