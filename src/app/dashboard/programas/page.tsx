
'use client'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { cn } from "@/lib/utils"
import Image from 'next/image'
import { 
  PlusCircle, 
  Pencil, 
  Search,
  School,
  CheckCircle2,
  Plus,
  Save,
  Trash2,
  ChevronRight,
  Mail,
  Loader2,
  ShieldCheck,
  Building2,
  Eye,
  History,
  Navigation,
  RotateCcw,
  ImageIcon,
  Archive,
  Upload,
  FileText,
  TrendingUp,
  Monitor,
  ClipboardCheck,
  Settings,
  MonitorCheck,
  Server,
  QrCode,
  Globe,
  Info,
  LayoutGrid,
  User,
  Settings2,
  Users,
  GraduationCap,
  AlertCircle,
  Clock,
  FileDown,
  TrendingDown,
  LayoutDashboard,
  CheckCircle,
  XCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { db } from '@/lib/firebase'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  where
} from 'firebase/firestore'
import { type ProgramStatus } from '@/lib/planning-data'
import { schoolsDirectory, type SchoolInfo } from "@/lib/schools-directory"
import { HelpDeskInterface } from '@/components/HelpDeskInterface'

const BIBLIOTECA_FASES = [
  { id: 'fase1', label: 'Fase 1. Solicitud de instalación de biblioteca digital', progress: 11, color: 'bg-blue-100 text-blue-700' },
  { id: 'fase2', label: 'Fase 2. Atención al CCT', progress: 22, color: 'bg-emerald-100 text-emerald-700' },
  { id: 'fase3', label: 'Fase 3. Diagnóstico del equipo de cómputo existente', progress: 33, color: 'bg-indigo-100 text-indigo-700' },
  { id: 'fase4', label: 'Fase 4. Instalación total de los contenidos del proyecto', progress: 44, color: 'bg-amber-100 text-amber-700' },
  { id: 'fase5', label: 'Fase 5. Funcionalidad (pruebas de uso y manejo)', progress: 56, color: 'bg-green-100 text-green-700' },
  { id: 'fase6', label: 'Fase 6. Guía orientación de uso y manejo de la herramienta', progress: 67, color: 'bg-violet-100 text-violet-700' },
  { id: 'fase7', label: 'Fase 7. Seguimiento técnico al CCT', progress: 78, color: 'bg-sky-100 text-sky-700' },
  { id: 'fase8', label: 'Fase 8. Total de personal capacitado', progress: 89, color: 'bg-orange-100 text-orange-700' },
  { id: 'fase9', label: 'Fase 9. Total de equipos habilitados', progress: 100, color: 'bg-emerald-600 text-white' }
];

const visitData = [
  { name: '15 May', visits: 12 },
  { name: '16 May', visits: 18 },
  { name: '17 May', visits: 20 },
  { name: '18 May', visits: 15 },
  { name: '19 May', visits: 17 },
  { name: '20 May', visits: 22 },
  { name: '21 May', visits: 24 },
];

const statusColors = ['#621132', '#B38E5D', '#94a3b8'];

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [activeTab, setActiveTab] = useState('Biblioteca Digital')
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogSearchTerm, setDialogSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [selectedCctId, setSelectedCctId] = useState<string | null>(null)
  
  // Account Form State
  const [accountForm, setAccountForm] = useState({
    name: '', username: '', domain: '@coees.edu.mx', area: '', notes: ''
  })
  const [verifyEmail, setVerifyEmail] = useState('')

  const initialFormState: ProgramStatus = {
    name: '', progress: 0, status: 'activo', date: new Date().toISOString().split('T')[0], 
    cct: '', schoolName: '', userName: '', rfc: '', puesto: '', departamento: '',
    email: '', emails: [''], zonaEscolar: '', sector: '', modalidad: '', municipio: '', region: '', valle: '',
    latitud: '', longitud: '', observaciones: '', evidencePhotos: [], reportPdf: '',
    asistentes: [],
    bibliotecaFases: {
      fase1: false, fase2: false, fase3: false, fase4: false, fase5: false,
      fase6: false, fase7: false, fase8: false, fase9: false,
      personalCapacitado: 0, equiposHabilitados: 0
    }
  }

  const [formData, setFormData] = useState<ProgramStatus>(initialFormState)
  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([])
  const [quickAddForm, setQuickAddForm] = useState<SchoolInfo>({
    region: '', valle: 'MEXICO', municipio: '', subsistema: 'FEDERALIZADO', control: 'OFICIAL',
    nivel: 'SECUNDARIA', servicioEducativo: 'SECUNDARIA GENERAL', cct: '', turno: 'MATUTINO',
    nombre: '', domicilio: '', localidad: '', telefono: '', zonaEscolar: '', sector: '',
    director: '', hombres: 0, mujeres: 0, alumnos: 0, grupos: 0, maestros: 0, administrativos: 0,
    aulasExistentes: 0, aulasEnUso: 0, modalidad: 'DES'
  })

  useEffect(() => {
    setMounted(true)
    const q = query(collection(db, 'programs'), orderBy('updatedAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as ProgramStatus[];
      setRecords(data)
      if (data.length > 0 && !selectedCctId) {
        setSelectedCctId(data[0].id!);
      }
    })
    
    const storedSchools = JSON.parse(localStorage.getItem('schools_master_full_v21') || '[]');
    setAllSchools(storedSchools.length > 0 ? storedSchools : schoolsDirectory);
    
    return () => unsubscribe();
  }, [selectedCctId])

  const bibliotecaRecords = useMemo(() => 
    records.filter(r => r.name === 'Biblioteca Digital'), 
  [records]);

  const selectedRecord = useMemo(() => 
    bibliotecaRecords.find(r => r.id === selectedCctId) || bibliotecaRecords[0],
  [bibliotecaRecords, selectedCctId]);

  const stats = useMemo(() => {
    const total = bibliotecaRecords.length;
    const concluidos = bibliotecaRecords.filter(r => r.progress === 100).length;
    const proceso = total - concluidos;
    return { total, concluidos, proceso };
  }, [bibliotecaRecords]);

  const pieData = [
    { name: 'En proceso', value: stats.proceso },
    { name: 'Concluidos', value: stats.concluidos },
    { name: 'Pendientes', value: 0 },
  ];

  const handleCctChange = (value: string) => {
    const cleanValue = value.toUpperCase().trim()
    setFormData(prev => ({ ...prev, cct: cleanValue }))
    const match = allSchools.find(s => s.cct.toUpperCase() === cleanValue)
    if (match) {
      setFormData(prev => ({ 
        ...prev, 
        cct: match.cct, schoolName: match.nombre, municipio: match.municipio, 
        valle: match.valle, region: match.region, zonaEscolar: match.zonaEscolar, 
        sector: match.sector, modalidad: match.modalidad 
      }))
    }
  }

  const handleSave = () => {
    setIsSaving(true);
    const body: any = { 
      name: activeTab,
      userName: formData.userName || accountForm.name || '',
      departamento: formData.departamento || accountForm.area || '',
      cct: formData.cct || '',
      schoolName: formData.schoolName || '',
      municipio: formData.municipio || '',
      valle: formData.valle || '',
      region: formData.region || '',
      zonaEscolar: formData.zonaEscolar || '',
      sector: formData.sector || '',
      modalidad: formData.modalidad || '',
      progress: formData.progress || 0,
      status: formData.status || 'activo',
      date: formData.date || new Date().toISOString().split('T')[0],
      email: formData.email || (accountForm.username ? `${accountForm.username}${accountForm.domain}` : ''),
      updatedAt: serverTimestamp(),
      bibliotecaFases: formData.bibliotecaFases || null
    };

    if (editingId) {
      updateDoc(doc(db, 'programs', editingId), body).then(() => {
        toast({ title: "Registro Actualizado" });
        setIsSaving(false); setIsDialogOpen(false); resetForm();
      });
    } else {
      addDoc(collection(db, 'programs'), { ...body, createdAt: serverTimestamp() }).then(() => {
        toast({ title: "Registro Guardado" });
        setIsSaving(false); setIsDialogOpen(false); resetForm();
      });
    }
  }

  const resetForm = () => { 
    setFormData(initialFormState); 
    setAccountForm({ name: '', username: '', domain: '@coees.edu.mx', area: '', notes: '' });
    setEditingId(null); 
    setDialogSearchTerm('');
  }

  const handleEdit = (rec: ProgramStatus) => { 
    setFormData({...rec}); 
    setEditingId(rec.id!); 
    setIsDialogOpen(true);
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Eliminar registro?")) deleteDoc(doc(db, 'programs', id));
  }

  const getFaseActual = (fases: any) => {
    if (!fases) return BIBLIOTECA_FASES[0];
    for (let i = BIBLIOTECA_FASES.length - 1; i >= 0; i--) {
      if (fases[BIBLIOTECA_FASES[i].id]) return BIBLIOTECA_FASES[i];
    }
    return BIBLIOTECA_FASES[0];
  }

  const schoolSearchResults = useMemo(() => {
    if (!dialogSearchTerm || dialogSearchTerm.length < 3) return [];
    const term = dialogSearchTerm.toUpperCase();
    return allSchools.filter(s => s.cct.includes(term) || s.nombre.includes(term)).slice(0, 5);
  }, [allSchools, dialogSearchTerm]);

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 w-full min-h-screen bg-[#f8fafc] p-2 md:p-4 rounded-[2rem]">
      {/* Header Tabs Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-2xl shadow-sm border">
          {['Cuentas Institucionales', 'Biblioteca Digital', 'Geoposición', 'Conoce mi Escuela', 'ATRES'].map(tab => (
            <button 
              key={tab} 
              onClick={() => { setActiveTab(tab); resetForm(); }}
              className={cn(
                "px-5 h-10 text-[10px] font-black rounded-xl transition-all uppercase tracking-wider",
                activeTab === tab ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
           <Button onClick={() => setIsDialogOpen(true)} className="btn-institutional h-11 px-8 rounded-xl shadow-xl">
             <PlusCircle className="h-4 w-4 mr-2" /> Nuevo Registro
           </Button>
        </div>
      </div>

      <div className="flex-1">
        {activeTab === 'Cuentas Institucionales' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white p-8">
                 <h3 className="text-xl font-black text-primary uppercase mb-6 flex items-center gap-3">
                   <Mail className="h-6 w-6" /> Registro de Correo
                 </h3>
                 <div className="space-y-4">
                    <div className="space-y-1"><Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Nombre Completo</Label><Input className="h-11 rounded-xl bg-slate-50 border-none font-bold" value={accountForm.name} onChange={e => setAccountForm({...accountForm, name: e.target.value})} /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Usuario</Label><Input className="h-11 rounded-xl bg-slate-50 border-none font-mono" value={accountForm.username} onChange={e => setAccountForm({...accountForm, username: e.target.value.toLowerCase()})} /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Dominio</Label>
                      <Select value={accountForm.domain} onValueChange={v => setAccountForm({...accountForm, domain: v})}>
                        <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="@coees.edu.mx">@coees.edu.mx</SelectItem><SelectItem value="@desysa.edu.mx">@desysa.edu.mx</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleSave} className="w-full btn-institutional h-12 mt-4"><Save className="h-5 w-5 mr-2" /> Guardar Cuenta</Button>
                 </div>
              </Card>
            </div>
            <div className="lg:col-span-8">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden flex flex-col min-h-[600px]">
                <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
                   <h3 className="text-lg font-black uppercase text-slate-700">Correos Registrados</h3>
                   <div className="relative w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input placeholder="BUSCAR CORREO..." className="h-9 pl-9 rounded-xl border-slate-200 text-[10px] font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                </div>
                <ScrollArea className="flex-1">
                  <Table>
                    <TableHeader className="bg-slate-50"><TableRow><TableHead className="pl-8 text-[9px] font-black uppercase">Fecha</TableHead><TableHead className="text-[9px] font-black uppercase">Correo Institucional</TableHead><TableHead className="text-right pr-8"></TableHead></TableRow></TableHeader>
                    <TableBody>
                      {records.filter(r => r.name === 'Cuentas Institucionales').map((rec) => (
                        <TableRow key={rec.id} className="h-16 hover:bg-slate-50 border-b border-slate-50 transition-colors group">
                           <TableCell className="pl-8 text-[11px] font-bold text-slate-400">{rec.date}</TableCell>
                           <TableCell className="font-black text-sm text-slate-700">{rec.email}</TableCell>
                           <TableCell className="text-right pr-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-500 rounded-xl" onClick={() => handleEdit(rec)}><Eye className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-300 hover:text-rose-600 rounded-xl" onClick={() => handleDelete(rec.id!)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                           </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </Card>
            </div>
          </div>
        ) : activeTab === 'Biblioteca Digital' ? (
          <div className="space-y-8 pb-10">
            {/* Upper Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { label: 'CCT Registrados', value: stats.total, sub: 'Escuelas', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Visitas Totales', value: 128, sub: 'En el periodo', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Atenciones', value: 96, sub: 'En el periodo', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Evidencias', value: 243, sub: 'Fotografías / Reportes', icon: ImageIcon, color: 'text-orange-500', bg: 'bg-orange-50' },
                { label: 'Técnicos Activos', value: 8, sub: 'Asignados', icon: User, color: 'text-teal-600', bg: 'bg-teal-50' },
                { label: 'Proyectos Concluidos', value: stats.concluidos, sub: 'Escuelas', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' }
              ].map((m, i) => (
                <Card key={i} className="border-none shadow-md rounded-[1.8rem] p-5 flex items-center gap-4 bg-white transition-all hover:scale-105">
                  <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner", m.bg, m.color)}><m.icon className="h-6 w-6" /></div>
                  <div>
                    <h4 className="text-2xl font-black leading-none">{m.value}</h4>
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-1.5">{m.label}</p>
                    <p className="text-[7px] font-bold text-slate-300 uppercase">{m.sub}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Fases del Proyecto por CCT Table */}
              <Card className="lg:col-span-8 border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col">
                <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
                   <h3 className="text-lg font-black uppercase text-slate-700">Fases del Proyecto por CCT</h3>
                </div>
                <ScrollArea className="flex-1 min-h-[400px]">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="h-12">
                        <TableHead className="pl-10 text-[9px] font-black uppercase">CCT</TableHead>
                        <TableHead className="text-[9px] font-black uppercase">Escuela</TableHead>
                        <TableHead className="text-[9px] font-black uppercase">Municipio</TableHead>
                        <TableHead className="text-[9px] font-black uppercase">Fase Actual</TableHead>
                        <TableHead className="text-[9px] font-black uppercase">Avance</TableHead>
                        <TableHead className="text-[9px] font-black uppercase">Estatus</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bibliotecaRecords.map((rec) => {
                        const faseActual = getFaseActual(rec.bibliotecaFases);
                        return (
                          <TableRow key={rec.id} onClick={() => setSelectedCctId(rec.id!)} className={cn("h-16 hover:bg-slate-50 transition-colors cursor-pointer", selectedCctId === rec.id && "bg-primary/5")}>
                            <TableCell className="pl-10 font-mono text-[10px] font-black text-primary">{rec.cct}</TableCell>
                            <TableCell className="text-[11px] font-bold text-slate-700 uppercase">{rec.schoolName}</TableCell>
                            <TableCell className="text-[10px] font-bold text-slate-400 uppercase">{rec.municipio}</TableCell>
                            <TableCell>
                              <Badge className={cn("text-[8px] font-black border-none px-3 h-8 flex flex-col items-start justify-center leading-tight max-w-[140px]", faseActual.color)}>
                                <span className="uppercase">{faseActual.label.split('.')[0]}</span>
                                <span className="text-[6px] opacity-70 truncate w-full">{faseActual.label.split('.')[1]}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="w-32">
                               <div className="flex items-center gap-3">
                                  <Progress value={rec.progress} className="h-1.5 flex-1" />
                                  <span className="text-[10px] font-black text-slate-500">{rec.progress}%</span>
                               </div>
                            </TableCell>
                            <TableCell>
                               <Badge className={cn("text-[8px] font-black border-none px-3 h-6", rec.progress === 100 ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}>
                                  {rec.progress === 100 ? 'CONCLUIDO' : 'EN PROCESO'}
                               </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {bibliotecaRecords.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-20 opacity-30 uppercase font-black text-xs">Sin registros de auditoría</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </Card>

              {/* Right Column: Detalle de Fases Checklist */}
              <Card className="lg:col-span-4 border-none shadow-2xl rounded-[2.5rem] bg-white p-8 flex flex-col gap-6">
                 <div>
                   <h3 className="text-sm font-black uppercase text-slate-800">Detalle de Fases del Proyecto</h3>
                   <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">(Por CCT seleccionado)</p>
                 </div>
                 
                 <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-primary">CCT Seleccionado:</Label>
                    <Select value={selectedCctId || ''} onValueChange={setSelectedCctId}>
                       <SelectTrigger className="h-12 rounded-xl border-slate-200 font-black text-[10px] uppercase">
                          <SelectValue placeholder="SELECCIONAR PLANTEL..." />
                       </SelectTrigger>
                       <SelectContent className="z-[300]">
                          {bibliotecaRecords.map(r => <SelectItem key={r.id} value={r.id!} className="text-[10px] font-black uppercase">{r.cct} - {r.schoolName}</SelectItem>)}
                       </SelectContent>
                    </Select>
                 </div>

                 <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                       {BIBLIOTECA_FASES.map((f, i) => {
                         const isCompleted = selectedRecord?.bibliotecaFases?.[f.id as keyof typeof selectedRecord.bibliotecaFases];
                         const isCurrent = getFaseActual(selectedRecord?.bibliotecaFases).id === f.id;
                         
                         return (
                           <div key={f.id} className={cn(
                             "flex items-start gap-4 p-4 rounded-2xl border transition-all",
                             isCompleted ? "bg-emerald-50/50 border-emerald-100" : isCurrent ? "bg-blue-50 border-blue-200 ring-2 ring-blue-100" : "bg-white border-slate-100"
                           )}>
                              <div className={cn(
                                "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border-2",
                                isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : isCurrent ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 text-slate-300"
                              )}>
                                 {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className={cn("text-[10px] font-black uppercase leading-tight", isCompleted ? "text-emerald-700" : isCurrent ? "text-blue-800" : "text-slate-400")}>{f.label}</p>
                              </div>
                           </div>
                         )
                       })}
                    </div>
                 </ScrollArea>
              </Card>
            </div>

            {/* Bottom Analysis Section */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
               {/* Visits Chart */}
               <Card className="md:col-span-4 border-none shadow-xl rounded-[2.5rem] bg-white p-8">
                  <h3 className="text-sm font-black uppercase text-slate-800 mb-8">Visitas por día <span className="text-[9px] font-bold text-slate-400 ml-2">(últimos 7 días)</span></h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={visitData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                        <ChartTooltip 
                          contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase'}}
                        />
                        <Line type="monotone" dataKey="visits" stroke="#9f2241" strokeWidth={4} dot={{r: 6, fill: '#9f2241', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8, strokeWidth: 0}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
               </Card>

               {/* Status Donut Chart */}
               <Card className="md:col-span-3 border-none shadow-xl rounded-[2.5rem] bg-white p-8 flex flex-col items-center">
                  <h3 className="text-sm font-black uppercase text-slate-800 w-full mb-6">Estatus del Proyecto</h3>
                  <div className="h-[220px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />
                          ))}
                        </Pie>
                        <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={8} wrapperStyle={{fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', paddingTop: '20px'}} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                       <span className="text-2xl font-black text-slate-800">{stats.total}</span>
                       <span className="text-[8px] font-black text-slate-400 uppercase">Total CCT</span>
                    </div>
                  </div>
               </Card>

               {/* Evidencias Recientes */}
               <Card className="md:col-span-5 border-none shadow-xl rounded-[2.5rem] bg-white p-8 overflow-hidden">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black uppercase text-slate-800">Evidencias recientes</h3>
                    <Button variant="link" className="text-primary font-black text-[9px] uppercase h-auto p-0">Ver todas las evidencias <ChevronRight className="h-3 w-3 ml-1" /></Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 h-full">
                    {[
                      { id: '1', school: 'Primaria Miguel Hidalgo', date: '20/05/2024', img: 'https://picsum.photos/seed/ev1/400/300' },
                      { id: '2', school: 'Secundaria Técnica No. 8', date: '20/05/2024', img: 'https://picsum.photos/seed/ev2/400/300' },
                      { id: '3', school: 'Secundaria Gral. No. 5', date: '20/05/2024', img: 'https://picsum.photos/seed/ev3/400/300' },
                    ].map((ev) => (
                      <div key={ev.id} className="space-y-3 group cursor-pointer">
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden relative border shadow-sm">
                           <Image src={ev.img} alt="Evidencia" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div>
                           <p className="text-[8px] font-black text-slate-800 uppercase leading-tight truncate">{ev.school}</p>
                           <div className="flex justify-between items-center mt-1">
                              <span className="text-[7px] font-bold text-slate-400">{ev.date}</span>
                              <FileDown className="h-3.5 w-3.5 text-rose-500" />
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
               </Card>
            </div>
          </div>
        ) : activeTab === 'ATRES' ? (
           <div className="flex-1 h-full min-h-[600px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-slate-50">
             <HelpDeskInterface />
           </div>
        ) : null}
      </div>

      {/* Dialog for New Audit / Edit */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[1000px] h-[85vh] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden flex flex-col bg-white">
          <DialogHeader className="p-8 bg-[#9f2241] text-white shrink-0">
             <DialogTitle className="uppercase font-black text-xl flex items-center gap-3">
               <Settings className="h-7 w-7 text-accent" /> 
               {editingId ? 'EDITAR AUDITORÍA TÉCNICA' : 'NUEVA AUDITORÍA INSTITUCIONAL'}
             </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col">
             <ScrollArea className="flex-1 p-10">
                <div className="space-y-12">
                   {/* Step 1: Identification */}
                   <div className="space-y-6">
                      <div className="flex items-center gap-3 border-b pb-2"><Search className="h-5 w-5 text-primary" /><h4 className="text-xs font-black uppercase text-primary tracking-widest">Localización del Centro de Trabajo</h4></div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         <div className="space-y-2 relative">
                            <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">CCT (10 Dígitos)</Label>
                            <Input 
                              value={dialogSearchTerm} 
                              onChange={e => { setDialogSearchTerm(e.target.value.toUpperCase()); handleCctChange(e.target.value); }} 
                              className="h-12 bg-slate-50 border-none rounded-xl font-black text-primary uppercase shadow-inner" 
                              placeholder="BUSCAR CCT..." 
                            />
                            {dialogSearchTerm.length > 2 && schoolSearchResults.length > 0 && (
                              <div className="absolute top-20 left-0 right-0 max-h-48 overflow-auto bg-white border rounded-xl shadow-2xl z-50 divide-y">
                                {schoolSearchResults.map(s => (
                                  <div key={s.cct} className="p-3 hover:bg-primary/5 cursor-pointer flex flex-col" onClick={() => { handleCctChange(s.cct); setDialogSearchTerm(''); }}>
                                    <span className="text-[10px] font-black uppercase">{s.nombre}</span>
                                    <span className="text-[8px] font-bold text-slate-400">{s.cct}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                         </div>
                         <div className="md:col-span-2 space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Nombre del Plantel</Label>
                            <div className="h-12 bg-slate-50 rounded-xl flex items-center px-4 font-black uppercase text-slate-600 text-xs shadow-inner truncate">{formData.schoolName || 'S/D'}</div>
                         </div>
                      </div>
                   </div>

                   {/* Step 2: Phase Tracking */}
                   {activeTab === 'Biblioteca Digital' && (
                     <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b pb-2"><ClipboardCheck className="h-5 w-5 text-primary" /><h4 className="text-xs font-black uppercase text-primary tracking-widest">Seguimiento de Fases Técnicas</h4></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {BIBLIOTECA_FASES.map(f => (
                             <div key={f.id} className={cn("flex items-center gap-4 p-5 rounded-[1.8rem] border transition-all", (formData.bibliotecaFases as any)?.[f.id] ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100 shadow-inner")}>
                                <Checkbox 
                                  checked={(formData.bibliotecaFases as any)?.[f.id]} 
                                  onCheckedChange={(val) => { 
                                     const updatedFases = { ...formData.bibliotecaFases!, [f.id]: !!val }; 
                                     const totalWeight = BIBLIOTECA_FASES.length;
                                     const completedCount = BIBLIOTECA_FASES.filter(ph => updatedFases[ph.id as keyof typeof updatedFases]).length;
                                     const progress = Math.round((completedCount / totalWeight) * 100); 
                                     setFormData({ ...formData, bibliotecaFases: updatedFases, progress }); 
                                  }} 
                                  className="h-6 w-6 rounded-lg border-2 border-primary" 
                                />
                                <Label className="text-[11px] font-black uppercase text-slate-600 cursor-pointer flex-1 leading-tight">{f.label}</Label>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                </div>
             </ScrollArea>
          </div>

          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-between items-center shrink-0">
             <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase text-slate-400">Progreso Total:</span>
                <div className="w-48"><Progress value={formData.progress} className="h-2" /></div>
                <span className="text-sm font-black text-primary">{formData.progress}%</span>
             </div>
             <div className="flex gap-4">
               <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-12 px-8 font-black uppercase text-xs">Cancelar</Button>
               <Button onClick={handleSave} disabled={isSaving || !formData.cct} className="btn-institutional h-12 px-14 shadow-2xl">
                  {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5 mr-2" />} GUARDAR AUDITORÍA
               </Button>
             </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
