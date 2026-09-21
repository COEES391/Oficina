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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  AlertCircle
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

const BIBLIOTECA_FASES_LABELS = [
  { id: 'fase1', label: 'Fase 1. Solicitud de instalación de biblioteca digital', progress: 11 },
  { id: 'fase2', label: 'Fase 2. Atención al CCT', progress: 22 },
  { id: 'fase3', label: 'Fase 3. Diagnóstico del equipo de cómputo existente', progress: 33 },
  { id: 'fase4', label: 'Fase 4. Instalación total de los contenidos del proyecto', progress: 44 },
  { id: 'fase5', label: 'Fase 5. Funcionalidad (pruebas de uso y manejo)', progress: 56 },
  { id: 'fase6', label: 'Fase 6. Guía orientación de uso y manejo de la herramienta', progress: 67 },
  { id: 'fase7', label: 'Fase 7. Seguimiento técnico al CCT', progress: 78 },
  { id: 'fase8', label: 'Fase 8. Total de personal capacitado', progress: 89 },
  { id: 'fase9', label: 'Fase 9. Total de equipos habilitados', progress: 100 }
];

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [activeTab, setActiveTab] = useState('Cuentas Institucionales')
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogSearchTerm, setDialogSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  
  // Account Form State
  const [accountForm, setAccountForm] = useState({
    name: '',
    username: '',
    domain: '@coees.edu.mx',
    area: '',
    notes: ''
  })
  const [verifyEmail, setVerifyEmail] = useState('')
  const [verifyResult, setVerifyResult] = useState<any>(null)

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
      setRecords(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as ProgramStatus[])
    })
    
    const storedSchools = JSON.parse(localStorage.getItem('schools_master_full_v21') || '[]');
    setAllSchools(storedSchools.length > 0 ? storedSchools : schoolsDirectory);
    
    return () => { unsubscribe(); }
  }, [])

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

  const handleQuickAddCct = () => {
    if (!quickAddForm.cct || !quickAddForm.nombre || !quickAddForm.municipio) {
      toast({ variant: "destructive", title: "Faltan datos técnicos" }); return;
    }
    const newSchool: SchoolInfo = { 
      ...quickAddForm, 
      cct: quickAddForm.cct.toUpperCase(), 
      nombre: quickAddForm.nombre.toUpperCase(), 
      municipio: quickAddForm.municipio.toUpperCase(),
      valle: (quickAddForm.valle || 'MEXICO').toUpperCase(),
      region: (quickAddForm.region || '').toUpperCase(),
      zonaEscolar: (quickAddForm.zonaEscolar || '').toUpperCase(),
      sector: (quickAddForm.sector || '').toUpperCase(),
      modalidad: (quickAddForm.modalidad || 'DES').toUpperCase(),
      domicilio: (quickAddForm.domicilio || '').toUpperCase(),
      localidad: (quickAddForm.localidad || '').toUpperCase(),
      telefono: quickAddForm.telefono || 'S/D'
    };
    const updated = [newSchool, ...allSchools];
    setAllSchools(updated);
    localStorage.setItem('schools_master_full_v21', JSON.stringify(updated));
    handleCctChange(newSchool.cct);
    setIsQuickAddOpen(false);
    setDialogSearchTerm('');
    toast({ title: "Plantel Registrado en Base Maestra" });
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
      latitud: formData.latitud || '',
      longitud: formData.longitud || '',
      observaciones: formData.observaciones || accountForm.notes || '',
      bibliotecaFases: formData.bibliotecaFases || null,
      updatedAt: serverTimestamp() 
    };

    const cleanup = () => {
      setIsSaving(false);
      resetForm();
      setIsDialogOpen(false);
    }

    if (editingId) {
      updateDoc(doc(db, 'programs', editingId), body)
        .then(() => { toast({ title: "Registro Actualizado" }); })
      cleanup();
    } else {
      addDoc(collection(db, 'programs'), { ...body, createdAt: serverTimestamp() })
        .then(() => { toast({ title: "Registro Guardado" }); })
      cleanup();
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
    if (rec.name === 'Cuentas Institucionales') {
      const emailParts = (rec.email || '').split('@');
      setAccountForm({
        name: rec.userName || '',
        username: emailParts[0] || '',
        domain: emailParts[1] ? `@${emailParts[1]}` : '@coees.edu.mx',
        area: rec.departamento || '',
        notes: rec.observaciones || ''
      });
    }
    setEditingId(rec.id!); 
    setIsDialogOpen(true);
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Eliminar registro?")) deleteDoc(doc(db, 'programs', id));
  }

  const handleVerify = () => {
    const found = records.find(r => r.name === 'Cuentas Institucionales' && r.email?.toLowerCase() === verifyEmail.toLowerCase());
    if (found) {
      setVerifyResult(found);
      toast({ title: "Verificación Exitosa" });
    } else {
      setVerifyResult({ error: true });
      toast({ variant: "destructive", title: "Cuenta no encontrada" });
    }
  }

  const schoolSearchResults = useMemo(() => {
    if (!dialogSearchTerm || dialogSearchTerm.length < 3) return [];
    const term = dialogSearchTerm.toUpperCase();
    return allSchools.filter(s => s.cct.includes(term) || s.nombre.includes(term)).slice(0, 5);
  }, [allSchools, dialogSearchTerm]);

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 w-full min-h-screen flex flex-col">
      <div className="shrink-0 space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black text-primary leading-none uppercase">Módulos Técnicos COEES</h2>
            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mt-1">Auditoría Institucional 2026</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {['Cuentas Institucionales', 'Biblioteca Digital', 'Geoposición', 'Conoce mi Escuela', 'ATRES'].map(rubro => (
            <button 
              key={rubro} 
              onClick={() => { setActiveTab(rubro); resetForm(); }}
              className={cn(
                "px-6 h-10 text-[10px] font-black rounded-xl transition-all border shadow-sm uppercase tracking-wider", 
                activeTab === rubro ? "bg-primary text-white border-primary shadow-xl" : "bg-white text-primary border-primary/20 hover:bg-slate-50"
              )}
            >
              {rubro}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === 'Cuentas Institucionales' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-10">
            <div className="lg:col-span-4">
              <Card className="rounded-[2rem] border-none shadow-2xl bg-white overflow-hidden h-fit">
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="flex items-center gap-3 text-blue-700 uppercase font-black text-lg">
                    <Mail className="h-5 w-5" /> Registro de Correo
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-4 space-y-4">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-primary ml-1">Nombre completo *</Label>
                    <Input className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs" value={accountForm.name} onChange={e => setAccountForm({...accountForm, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-primary ml-1">Usuario *</Label>
                    <Input className="h-10 rounded-xl bg-slate-50 border-none font-mono text-xs" value={accountForm.username} onChange={e => setAccountForm({...accountForm, username: e.target.value.toLowerCase()})} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-primary ml-1">Dominio *</Label>
                    <Select value={accountForm.domain} onValueChange={v => setAccountForm({...accountForm, domain: v})}>
                      <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="@coees.edu.mx">@coees.edu.mx</SelectItem><SelectItem value="@desysa.edu.mx">@desysa.edu.mx</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-primary ml-1">Área / Departamento</Label>
                    <Input className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs" value={accountForm.area} onChange={e => setAccountForm({...accountForm, area: e.target.value})} />
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0 grid grid-cols-2 gap-3">
                  <Button onClick={handleSave} className="btn-institutional h-10 text-[10px]"><Save className="h-4 w-4 mr-2" /> Guardar</Button>
                  <Button variant="outline" onClick={resetForm} className="h-10 rounded-xl text-[10px] uppercase font-black">Limpiar</Button>
                </CardFooter>
              </Card>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <Card className="rounded-[2rem] border-none shadow-xl bg-white p-6">
                 <div className="flex items-center gap-3 mb-4">
                    <Search className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-black uppercase text-primary">Verificador de Cuentas</h3>
                 </div>
                 <div className="flex gap-3">
                    <Input placeholder="usuario@coees.edu.mx" className="h-10 rounded-xl bg-slate-50 border-none shadow-inner" value={verifyEmail} onChange={e => setVerifyEmail(e.target.value.toLowerCase())} />
                    <Button onClick={handleVerify} className="bg-blue-600 hover:bg-blue-700 h-10 px-8 rounded-xl font-black text-[10px]">VERIFICAR</Button>
                 </div>
              </Card>

              <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden flex flex-col min-h-[400px]">
                 <div className="p-6 border-b bg-slate-50 flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-widest">Historial de Correos</h4>
                 </div>
                 <ScrollArea className="flex-1">
                    <Table>
                       <TableHeader className="bg-slate-50"><TableRow><TableHead className="pl-8 text-[8px] font-black uppercase">Fecha</TableHead><TableHead className="text-[8px] font-black uppercase">Correo</TableHead><TableHead className="text-right pr-8"></TableHead></TableRow></TableHeader>
                       <TableBody>
                          {records.filter(r => r.name === 'Cuentas Institucionales').map((rec, i) => (
                             <TableRow key={i} className="h-14 border-b border-slate-50 hover:bg-slate-50 group">
                                <TableCell className="pl-8 text-[10px] font-bold text-slate-400">{rec.date}</TableCell>
                                <TableCell className="font-black text-xs text-slate-700">{rec.email}</TableCell>
                                <TableCell className="text-right pr-8">
                                   <div className="flex justify-end gap-1">
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" onClick={() => handleEdit(rec)}><Eye className="h-4 w-4" /></Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300 hover:text-rose-600" onClick={() => handleDelete(rec.id!)}><Trash2 className="h-4 w-4" /></Button>
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
          <div className="space-y-8 pb-20">
             <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                {[
                  { label: 'CCT REGISTRADOS', value: records.filter(r => r.name === 'Biblioteca Digital').length, icon: Building2, color: 'text-blue-600' },
                  { label: 'VISITAS TOTALES', value: 0, icon: Users, color: 'text-emerald-600' },
                  { label: 'EVIDENCIAS', value: 0, icon: ImageIcon, color: 'text-orange-500' },
                  { label: 'CONCLUIDOS', value: 0, icon: TrendingUp, color: 'text-rose-600' },
                  { label: 'PENDIENTES', value: 0, icon: AlertCircle, color: 'text-amber-500' },
                  { label: 'CAPACITADOS', value: 0, icon: GraduationCap, color: 'text-indigo-600' }
                ].map((k, i) => (
                  <Card key={i} className="border-none shadow-md rounded-3xl p-5 bg-white flex flex-col items-center text-center gap-4">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center bg-slate-50 shadow-inner", k.color)}><k.icon className="h-6 w-6" /></div>
                    <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.label}</p><h4 className="text-2xl font-black text-slate-800">{k.value}</h4></div>
                  </Card>
                ))}
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <Card className="lg:col-span-8 border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden flex flex-col min-h-[500px]">
                   <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
                      <h3 className="text-lg font-black uppercase text-slate-700 tracking-tighter">Fases del proyecto por CCT</h3>
                      <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="btn-institutional h-10 px-6 text-[10px]"><PlusCircle className="h-4 w-4 mr-2" /> Nueva Auditoría</Button>
                   </div>
                   <ScrollArea className="flex-1">
                      <Table>
                         <TableHeader className="bg-slate-50 border-b">
                            <TableRow className="h-14">
                               <TableHead className="pl-10 text-[10px] font-black uppercase text-slate-400">Plantel / CCT</TableHead>
                               <TableHead className="text-[10px] font-black uppercase text-slate-400">Progreso</TableHead>
                               <TableHead className="text-right pr-10"></TableHead>
                            </TableRow>
                         </TableHeader>
                         <TableBody>
                            {records.filter(r => r.name === 'Biblioteca Digital').map(rec => (
                              <TableRow key={rec.id} className="h-20 hover:bg-slate-50 transition-colors group">
                                 <TableCell className="pl-10">
                                    <div className="flex flex-col">
                                       <span className="text-sm font-black uppercase text-slate-700">{rec.schoolName}</span>
                                       <Badge className="bg-primary/5 text-primary border-none text-[8px] font-black px-2 h-4 w-fit mt-1">CCT: {rec.cct}</Badge>
                                    </div>
                                 </TableCell>
                                 <TableCell className="w-64">
                                    <div className="space-y-2">
                                       <div className="flex justify-between items-end"><span className="text-[9px] font-black text-primary">{rec.progress}% COMPLETADO</span></div>
                                       <Progress value={rec.progress} className="h-1.5" />
                                    </div>
                                 </TableCell>
                                 <TableCell className="text-right pr-10">
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100">
                                       <Button variant="ghost" size="icon" onClick={() => handleEdit(rec)} className="h-9 w-9 rounded-xl text-primary hover:bg-primary/5"><Pencil className="h-4 w-4" /></Button>
                                       <Button variant="ghost" size="icon" onClick={() => handleDelete(rec.id!)} className="h-9 w-9 rounded-xl text-rose-300 hover:text-rose-600"><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                 </TableCell>
                              </TableRow>
                            ))}
                         </TableBody>
                      </Table>
                   </ScrollArea>
                </Card>

                <Card className="lg:col-span-4 border-none shadow-2xl rounded-[3rem] bg-white p-10 flex flex-col space-y-8">
                   <div className="flex items-center gap-4 border-b pb-5">
                      <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-inner"><ClipboardCheck className="h-7 w-7" /></div>
                      <div>
                         <h3 className="text-lg font-black uppercase text-slate-800 tracking-tighter">Checklist de Auditoría</h3>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sincronización Central</p>
                      </div>
                   </div>
                   <ScrollArea className="flex-1">
                      <div className="space-y-5">
                         {BIBLIOTECA_FASES_LABELS.map(f => (
                           <div key={f.id} className="flex items-center gap-5 p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                              <Checkbox id={`bit-${f.id}`} className="h-6 w-6 rounded-lg border-2 border-primary" checked={formData.name === 'Biblioteca Digital' && (formData.bibliotecaFases as any)?.[f.id]} />
                              <div className="flex-1 space-y-1">
                                 <Label htmlFor={`bit-${f.id}`} className="text-[11px] font-black uppercase text-slate-600 leading-tight block">{f.label}</Label>
                                 <span className="text-[8px] font-black text-slate-400 uppercase">PESO: {f.progress}%</span>
                              </div>
                           </div>
                         ))}
                      </div>
                   </ScrollArea>
                </Card>
             </div>
          </div>
        ) : activeTab === 'ATRES' ? (
           <div className="flex-1 h-full min-h-[600px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-slate-50">
             <HelpDeskInterface />
           </div>
        ) : null}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[1000px] h-[85vh] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden flex flex-col bg-white">
          <DialogHeader className="p-6 bg-[#9f2241] text-white shrink-0">
             <DialogTitle className="uppercase font-black text-xl flex items-center gap-3"><Settings className="h-7 w-7 text-accent" /> GESTIÓN TÉCNICA: {activeTab.toUpperCase()}</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="proyecto" className="flex-1 flex flex-col overflow-hidden">
             <div className="px-8 border-b bg-slate-50/50">
                <TabsList className="bg-transparent h-14 p-0 gap-8">
                  <TabsTrigger value="proyecto" className="rounded-none border-b-4 border-transparent data-[state=active]:border-[#9f2241] px-2 py-4 text-[11px] font-black uppercase transition-all">DATOS DEL PROYECTO</TabsTrigger>
                </TabsList>
             </div>
             
             <div className="flex-1 overflow-hidden">
                <TabsContent value="proyecto" className="h-full m-0 p-8">
                   <ScrollArea className="h-full">
                      <div className="space-y-10">
                         <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm space-y-6">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">IDENTIFICACIÓN CCT</h4>
                            <div className="max-w-2xl mx-auto space-y-4">
                               <div className="relative">
                                  <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-300" />
                                  <Input 
                                    value={dialogSearchTerm} 
                                    onChange={e => { setDialogSearchTerm(e.target.value.toUpperCase()); handleCctChange(e.target.value); }} 
                                    className="h-14 bg-white border-2 border-slate-100 rounded-2xl pl-12 font-black text-xl text-primary text-center" 
                                    placeholder="INGRESAR CCT..." 
                                  />
                               </div>
                               {formData.schoolName && (
                                 <div className="p-5 bg-emerald-50 rounded-2xl border-2 border-emerald-100 flex items-center justify-center gap-4 animate-in fade-in">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                    <p className="text-xs font-black uppercase text-emerald-800">{formData.schoolName}</p>
                                 </div>
                               )}
                            </div>
                         </div>
                         {activeTab === 'Biblioteca Digital' && (
                           <div className="space-y-6">
                              <div className="flex items-center gap-3 border-b pb-2"><ClipboardCheck className="h-5 w-5 text-[#9f2241]" /><h4 className="text-xs font-black uppercase text-[#9f2241] tracking-widest">FASES DEL PROYECTO</h4></div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {BIBLIOTECA_FASES_LABELS.map(f => (
                                   <div key={f.id} className={cn("flex items-center gap-4 p-4 rounded-2xl border transition-all", (formData.bibliotecaFases as any)?.[f.id] ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-100 shadow-sm")}>
                                      <Checkbox 
                                        checked={(formData.bibliotecaFases as any)?.[f.id]} 
                                        onCheckedChange={(val) => { 
                                           const updatedFases = { ...formData.bibliotecaFases!, [f.id]: !!val }; 
                                           const progress = Math.round((Object.values(updatedFases).filter(v => typeof v === 'boolean' && v === true).length / 9) * 100); 
                                           setFormData({ ...formData, bibliotecaFases: updatedFases, progress }); 
                                        }} 
                                        id={`chk-${f.id}`} className="h-5 w-5 rounded-md border-primary" 
                                      />
                                      <Label htmlFor={`chk-${f.id}`} className="text-[10px] font-black uppercase text-slate-600 cursor-pointer flex-1 leading-tight">{f.label}</Label>
                                   </div>
                                 ))}
                              </div>
                           </div>
                         )}
                      </div>
                   </ScrollArea>
                </TabsContent>
             </div>
          </Tabs>

          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-4 shrink-0">
             <Button onClick={handleSave} disabled={isSaving} className="bg-[#9f2241] hover:bg-[#8a1d38] text-white px-12 text-xs shadow-2xl h-12 rounded-xl font-black gap-2">
                {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />} GUARDAR REGISTRO
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-[850px] rounded-[1.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-[#B38E5D] text-white shrink-0">
            <DialogTitle className="uppercase font-black text-lg flex items-center gap-3"><PlusCircle className="h-6 w-6" /> REGISTRO DE NUEVO CCT</DialogTitle>
          </DialogHeader>
          <div className="p-10 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">CCT</Label>
                  <Input value={quickAddForm.cct} onChange={e => setQuickAddForm({...quickAddForm, cct: e.target.value.toUpperCase()})} maxLength={10} className="h-11 font-mono font-black border-none bg-[#EFE7DD] rounded-xl shadow-inner text-primary" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Nombre del Plantel</Label>
                  <Input value={quickAddForm.nombre} onChange={e => setQuickAddForm({...quickAddForm, nombre: e.target.value.toUpperCase()})} className="h-11 font-black border-none bg-[#EFE7DD] rounded-xl shadow-inner uppercase" />
                </div>
             </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-6 shrink-0">
            <Button onClick={handleQuickAddCct} className="bg-[#9f2241] hover:bg-[#8a1d38] text-white h-12 px-14 rounded-xl text-[11px] font-black uppercase shadow-2xl">REGISTRAR Y SUMAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
