
'use client'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
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
import { schoolsDirectory, type SchoolInfo } from "@/lib/schools-directory"
import { cn } from "@/lib/utils"
import Image from 'next/image'
import { 
  PlusCircle, 
  Pencil, 
  Search,
  School,
  Headset,
  CheckCircle2,
  Plus,
  Save,
  Trash2,
  ChevronRight,
  Mail,
  Loader2,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  MapPin,
  ClipboardCheck,
  Info,
  X,
  Briefcase,
  Building2,
  User,
  RotateCcw,
  ClipboardList,
  Eye,
  Map,
  Navigation,
  Activity,
  Clock,
  Globe,
  Calendar,
  Send,
  History,
  Monitor,
  Phone,
  LayoutGrid,
  FileText,
  BookOpen,
  Download,
  Users,
  Eraser,
  MinusCircle,
  Home,
  BarChart3,
  Settings,
  LayoutDashboard
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { HelpDeskDialog } from '@/components/HelpDeskDialog'
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
  serverTimestamp 
} from 'firebase/firestore'
import { type ProgramStatus } from '@/lib/planning-data'

const PROGRAM_RUBROS = [
  'Cuentas Institucionales',
  'Biblioteca Digital',
  'Geoposición',
  'Conoce mi Escuela',
  'ATRES'
];

const DOMINIOS = [
  '@coees.edu.mx',
  '@desysa.edu.mx',
  '@edomex.gob.mx'
];

const BIBLIOTECA_FASES_LABELS = [
  { id: 'fase1', label: '1. Diagnóstico de Infraestructura' },
  { id: 'fase2', label: '2. Cableado y Canalización' },
  { id: 'fase3', label: '3. Conectividad y Red' },
  { id: 'fase4', label: '4. Habilitación de Servidor' },
  { id: 'fase5', label: '5. Carga de Acervo Digital' },
  { id: 'fase6', label: '6. Pruebas de Funcionamiento' },
  { id: 'fase7', label: '7. Entrega y Capacitación' }
];

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState(PROGRAM_RUBROS[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isHelpDeskOpen, setIsHelpDeskOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogSearchTerm, setDialogSearchTerm] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  
  const [userPart, setUserPart] = useState('')
  const [domainPart, setDomainPart] = useState(DOMINIOS[0])
  const [verifyInput, setVerifySearch] = useState('')
  const [verifiedAccount, setVerifiedAccount] = useState<any>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([])
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddForm, setQuickAddForm] = useState<SchoolInfo>({
    region: '', valle: 'MEXICO', municipio: '', subsistema: 'FEDERALIZADO', control: 'OFICIAL',
    nivel: 'SECUNDARIA', servicioEducativo: 'SECUNDARIA GENERAL', cct: '', turno: 'MATUTINO',
    nombre: '', domicilio: '', localidad: '', telefono: '', zonaEscolar: '', sector: '',
    director: '', hombres: 0, mujeres: 0, alumnos: 0, grupos: 0, maestros: 0, administrativos: 0,
    aulasExistentes: 0, aulasEnUso: 0, modalidad: 'DES'
  })

  const initialFormState: ProgramStatus = {
    name: '', progress: 0, status: 'Activa', date: new Date().toISOString().split('T')[0], 
    cct: '', schoolName: '', userName: '', puesto: '', departamento: '',
    email: '', emails: [''], zonaEscolar: '', sector: '', modalidad: '', municipio: '', region: '', valle: '',
    latitud: '', longitud: '', observaciones: '', evidencePhotos: [],
    bibliotecaFases: {
      fase1: false, fase2: false, fase3: false, fase4: false, fase4_1: false, fase4_2: false,
      fase5: false, fase6: false, fase7: false, fase7_1: false, personalCapacitado: 0, equiposHabilitados: 0
    }
  }

  const [formData, setFormData] = useState<ProgramStatus>(initialFormState)

  useEffect(() => {
    setMounted(true)
    setIsLoading(true)
    
    const q = query(collection(db, 'programs'), orderBy('updatedAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as ProgramStatus[]
      setRecords(fetched)
      setIsLoading(false)
    }, (error) => {
      console.error("Firestore error:", error)
      setIsLoading(false)
    })

    const storedSchools = JSON.parse(localStorage.getItem('schools_master_full_v21') || '[]')
    setAllSchools(storedSchools.length > 0 ? storedSchools : schoolsDirectory)

    return () => unsubscribe()
  }, [])

  const filteredRecords = useMemo(() => {
    const list = records.filter(r => r.name === activeTab);
    if (!searchTerm) return list;
    const term = searchTerm.toUpperCase();
    return list.filter(r => 
      (r.cct || '').toUpperCase().includes(term) ||
      (r.schoolName || '').toUpperCase().includes(term) ||
      (r.userName || '').toUpperCase().includes(term) ||
      (r.email || '').toUpperCase().includes(term)
    );
  }, [records, searchTerm, activeTab]);

  const fullEmailPreview = useMemo(() => {
    if (!userPart) return '';
    return `${userPart.toLowerCase()}${domainPart}`;
  }, [userPart, domainPart]);

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
      setDialogSearchTerm(match.cct)
      setShowSearchResults(false)
    }
  }

  const handleQuickAddCct = () => {
    if (!quickAddForm.cct || !quickAddForm.nombre || !quickAddForm.municipio) {
      toast({ variant: "destructive", title: "Faltan datos" }); return;
    }
    const newSchool: SchoolInfo = { 
      ...quickAddForm, 
      cct: quickAddForm.cct.toUpperCase(), 
      nombre: quickAddForm.nombre.toUpperCase(), 
      municipio: quickAddForm.municipio.toUpperCase(),
      domicilio: (quickAddForm.domicilio || '').toUpperCase(),
      localidad: (quickAddForm.localidad || '').toUpperCase(),
      sector: (quickAddForm.sector || '').toUpperCase(),
      zonaEscolar: (quickAddForm.zonaEscolar || '').toUpperCase(),
      modalidad: (quickAddForm.modalidad || 'DES').toUpperCase()
    };
    const updated = [newSchool, ...allSchools];
    setAllSchools(updated);
    localStorage.setItem('schools_master_full_v21', JSON.stringify(updated));
    handleCctChange(newSchool.cct);
    setIsQuickAddOpen(false);
    setDialogSearchTerm(newSchool.cct);
    toast({ title: "Plantel Registrado" });
  }

  const handleSave = async () => {
    const currentCct = (formData.cct || dialogSearchTerm || '').toUpperCase().trim();
    if (!currentCct && activeTab !== 'Conoce mi Escuela' && activeTab !== 'Cuentas Institucionales') {
      alert("ERROR: Identificación de CCT requerida."); return;
    }

    setIsSaving(true);
    try {
      const finalData: Record<string, any> = {
        name: String(activeTab),
        cct: String(currentCct),
        schoolName: String(formData.schoolName || 'PLANTEL EXTERNO'),
        municipio: String(formData.municipio || 'S/D'),
        valle: String(formData.valle || 'S/D'),
        status: String(formData.status || 'Activa'),
        date: String(formData.date || new Date().toISOString().split('T')[0]),
        observaciones: String(formData.observaciones || ''),
        updatedAt: serverTimestamp()
      };

      if (activeTab === 'Cuentas Institucionales') {
        finalData.userName = String(formData.userName || 'S/R');
        finalData.puesto = String(formData.puesto || 'S/R');
        finalData.departamento = String(formData.departamento || 'S/R');
        finalData.email = fullEmailPreview || formData.email || '';
      } 
      else if (activeTab === 'Biblioteca Digital') {
        const bf = formData.bibliotecaFases || initialFormState.bibliotecaFases!;
        finalData.bibliotecaFases = { ...bf };
        const phases = [bf.fase1, bf.fase2, bf.fase3, bf.fase4, bf.fase5, bf.fase6, bf.fase7];
        finalData.progress = Math.round((phases.filter(v => v).length / 7) * 100);
      }
      else if (activeTab === 'Geoposición') {
        finalData.latitud = String(formData.latitud || '');
        finalData.longitud = String(formData.longitud || '');
      }

      if (editingId) {
        await updateDoc(doc(db, 'programs', editingId), finalData);
      } else {
        await addDoc(collection(db, 'programs'), finalData);
      }
      
      alert("✅ REGISTRO GUARDADO CON ÉXITO EN LA NUBE.");
      if (activeTab !== 'Cuentas Institucionales' && activeTab !== 'Conoce mi Escuela') {
        setIsDialogOpen(false);
      } else {
        resetEmailForm();
      }
      setEditingId(null);
    } catch (e: any) {
      alert("❌ ERROR AL GUARDAR: " + e.message);
    } finally {
      setIsSaving(false);
    }
  }

  const resetEmailForm = () => {
    setFormData(initialFormState);
    setUserPart('');
    setDialogSearchTerm('');
  }

  const handleVerifyAccount = async () => {
    if (!verifyInput) return;
    setIsVerifying(true);
    const term = verifyInput.toLowerCase();
    
    const found = records.find((rec: any) => 
      rec.name === 'Cuentas Institucionales' && (
      (rec.userName || '').toLowerCase().includes(term) ||
      (rec.cct || '').toLowerCase() === term ||
      (rec.email || '').toLowerCase() === term
    ));

    setVerifiedAccount(found);
    if (!found) toast({ variant: "destructive", title: "Sin Resultados" });
    setIsVerifying(false);
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar permanentemente?")) return;
    await deleteDoc(doc(db, 'programs', id));
    toast({ title: "Registro Removido" });
  }

  const schoolSearchResults = useMemo(() => {
    if (!dialogSearchTerm || dialogSearchTerm.length < 3) return [];
    const term = dialogSearchTerm.toUpperCase();
    return allSchools.filter(s => s.cct.includes(term) || s.nombre.includes(term)).slice(0, 5);
  }, [allSchools, dialogSearchTerm]);

  if (!mounted) return null

  return (
    <div className="space-y-6 animate-in fade-in duration-700 w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-primary leading-none uppercase">Módulos Técnicos COEES</h2>
          <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Sistema Integral de Auditoría 2026</p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'ATRES' && (
             <Button onClick={() => setIsHelpDeskOpen(true)} className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] gap-2 shadow-lg uppercase">
               <Headset className="h-5 w-5" /> Mesa de ayuda
             </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {PROGRAM_RUBROS.map(rubro => (
          <button 
            key={`rubro-${rubro}`} 
            onClick={() => { setActiveTab(rubro); setSearchTerm(''); }} 
            className={cn(
              "px-6 h-11 text-[10px] font-black rounded-xl transition-all border shadow-sm shrink-0 whitespace-nowrap uppercase tracking-wider", 
              activeTab === rubro ? "bg-primary text-white border-primary shadow-xl scale-105" : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
            )}
          >
            {rubro}
          </button>
        ))}
      </div>

      {activeTab === 'Cuentas Institucionales' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500">
          <Card className="lg:col-span-5 executive-card bg-white border-none shadow-2xl flex flex-col h-fit">
            <CardHeader className="p-8 border-b border-slate-50">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><Mail className="h-6 w-6" /></div>
                  <div>
                    <CardTitle className="text-lg font-black text-slate-800 uppercase">Registrar correo institucional</CardTitle>
                    <CardDescription className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase">Complete el formulario para dar de alta un nuevo acceso oficial.</CardDescription>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
               <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black text-slate-400 pl-1 uppercase">Estatus de la Cuenta (Semáforo)</Label>
                    <Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val})}>
                      <SelectTrigger className={cn(
                        "h-11 rounded-xl border-none shadow-inner font-black uppercase text-[10px] focus:ring-2 focus:ring-primary/20",
                        formData.status === 'Activa' ? "bg-emerald-100 text-emerald-700" :
                        formData.status === 'Inactiva' ? "bg-slate-100 text-slate-400" :
                        formData.status === 'Bloqueada' ? "bg-amber-100 text-amber-700" :
                        "bg-rose-100 text-rose-700"
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-2xl">
                        <SelectItem value="Activa" className="text-[10px] font-black text-emerald-600">🟢 ACTIVA</SelectItem>
                        <SelectItem value="Inactiva" className="text-[10px] font-black text-slate-400">⚪ INACTIVA</SelectItem>
                        <SelectItem value="Bloqueada" className="text-[10px] font-black text-amber-600">🟡 BLOQUEADA</SelectItem>
                        <SelectItem value="Eliminada" className="text-[10px] font-black text-rose-600">🔴 ELIMINADA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 relative">
                    <Label className="text-[10px] font-black text-slate-400 pl-1 uppercase">Identificar Plantel (CCT)</Label>
                    <div className="relative">
                      <Input placeholder="ESCRIBIR CCT..." className="h-11 rounded-xl bg-slate-50 border-slate-100 shadow-inner font-bold uppercase pl-10" value={dialogSearchTerm} onChange={e => { setDialogSearchTerm(e.target.value); handleCctChange(e.target.value); setShowSearchResults(true); }} />
                      <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-300" />
                      {showSearchResults && dialogSearchTerm.length > 2 && (
                        <div className="absolute top-12 left-0 right-0 bg-white border rounded-xl shadow-2xl z-50 divide-y max-h-40 overflow-auto">
                           {schoolSearchResults.map(s => (
                             <div key={`${s.cct}-${s.turno}`} className="p-3 hover:bg-primary/5 cursor-pointer flex justify-between items-center group" onClick={() => handleCctChange(s.cct)}>
                                <span className="text-[10px] font-black uppercase text-slate-700">{s.nombre}</span>
                                <Badge className="text-[8px] font-mono">{s.cct}</Badge>
                             </div>
                           ))}
                        </div>
                      )}
                    </div>
                    {formData.cct && (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 mt-2 animate-in zoom-in-95">
                         <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                         <span className="text-[10px] font-black uppercase text-emerald-800 truncate">{formData.schoolName}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black text-slate-400 pl-1 uppercase">Nombre del Responsable *</Label>
                    <div className="relative">
                      <Input placeholder="EJ. MARÍA LÓPEZ GARCÍA" className="h-11 rounded-xl bg-white border-slate-200 font-bold uppercase pl-10" value={formData.userName} onChange={e => setFormData({...formData, userName: e.target.value.toUpperCase()})} />
                      <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-300" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black text-slate-400 pl-1 uppercase">Usuario (sin dominio) *</Label>
                      <div className="relative">
                        <Input placeholder="EJ. MARIA.LOPEZ" className="h-11 rounded-xl bg-white border-slate-200 font-bold lowercase pl-10" value={userPart} onChange={e => setUserPart(e.target.value)} />
                        <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-300" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black text-slate-400 pl-1 uppercase">Dominio *</Label>
                      <Select value={domainPart} onValueChange={setDomainPart}>
                        <SelectTrigger className="h-11 rounded-xl border-slate-200 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {DOMINIOS.map(d => <SelectItem key={d} value={d} className="text-xs font-bold">{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black text-slate-400 pl-1 uppercase">Puesto</Label>
                    <div className="relative">
                      <Input placeholder="EJ. COORDINADOR TÉCNICO" className="h-11 rounded-xl bg-white border-slate-200 font-bold uppercase pl-10" value={formData.puesto} onChange={e => setFormData({...formData, puesto: e.target.value.toUpperCase()})} />
                      <ShieldCheck className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-300" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black text-slate-400 pl-1 uppercase">Departamento</Label>
                    <div className="relative">
                      <Input placeholder="EJ. CAPACITACIÓN" className="h-11 rounded-xl bg-white border-slate-200 font-bold uppercase pl-10" value={formData.departamento} onChange={e => setFormData({...formData, departamento: e.target.value.toUpperCase()})} />
                      <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-300" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black text-slate-400 pl-1 uppercase">Observaciones (opcional)</Label>
                    <Textarea placeholder="AGREGAR ALGUNA OBSERVACIÓN..." className="min-h-[80px] rounded-xl bg-white border-slate-200 font-medium uppercase text-[10px]" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value.toUpperCase()})} />
                  </div>
               </div>

               <div className="flex gap-4 pt-4">
                  <Button onClick={handleSave} disabled={isSaving} className="flex-1 btn-institutional h-12 rounded-xl text-[11px] gap-2 shadow-xl">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5" />} GUARDAR
                  </Button>
                  <Button variant="outline" onClick={resetEmailForm} className="px-6 h-12 rounded-xl border-slate-200 text-slate-500 font-black uppercase text-[10px] gap-2 hover:bg-slate-50">
                    <RotateCcw className="h-4 w-4" /> LIMPIAR
                  </Button>
               </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-7 space-y-8 flex flex-col">
            <Card className="executive-card bg-white border-none shadow-xl">
              <CardHeader className="p-8 border-b border-slate-50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-inner"><Search className="h-6 w-6" /></div>
                  <CardTitle className="text-lg font-black text-slate-800 uppercase">Verificar existencia de correo</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex gap-2">
                   <div className="relative flex-1">
                      <Input placeholder="EJ. USUARIO@COEES.EDU.MX" className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold lowercase pl-10" value={verifyInput} onChange={e => setVerifySearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleVerifyAccount()} />
                      <Mail className="absolute left-3.5 top-4 h-4 w-4 text-slate-300" />
                   </div>
                   <Button onClick={handleVerifyAccount} disabled={isVerifying} className="h-12 px-8 rounded-xl bg-primary text-white font-black text-[10px] uppercase shadow-lg gap-2">
                     <Search className={cn("h-4 w-4", isVerifying && "animate-spin")} /> VERIFICAR
                   </Button>
                </div>

                {verifiedAccount ? (
                  <div className="p-6 rounded-[2rem] bg-emerald-50 border-2 border-emerald-100 flex items-start gap-6 animate-in zoom-in-95 duration-300 shadow-sm">
                    <div className="h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg"><CheckCircle2 className="h-6 w-6" /></div>
                    <div className="space-y-3 flex-1">
                       <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none">Resultado de la verificación</p>
                       <h4 className="text-2xl font-black text-slate-800 lowercase leading-none">{verifiedAccount.email}</h4>
                       <Badge className={cn("text-[9px] font-black px-3 h-5 rounded-full uppercase border-none", 
                         verifiedAccount.status === 'Activa' ? "bg-emerald-500 text-white" : 
                         verifiedAccount.status === 'Inactiva' ? "bg-slate-400 text-white" :
                         verifiedAccount.status === 'Bloqueada' ? "bg-amber-500 text-white" :
                         "bg-rose-500 text-white"
                       )}>
                         Cuenta {verifiedAccount.status}
                       </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed border-slate-100 rounded-[2rem] text-center opacity-30">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ingrese el correo para comprobar estatus oficial</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="executive-card bg-white border-none shadow-xl flex-1 overflow-hidden">
               <CardHeader className="p-8 border-b border-slate-50">
                 <div className="flex items-center gap-3">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm font-black uppercase text-slate-700">Historial de registros</CardTitle>
                 </div>
               </CardHeader>
               <div className="overflow-x-auto">
                 <Table>
                   <TableHeader className="bg-slate-50 border-b">
                     <TableRow className="h-10">
                        <TableHead className="pl-8 text-[9px] font-black uppercase">Fecha de registro</TableHead>
                        <TableHead className="text-[9px] font-black uppercase">Correo institucional</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-center">Estado</TableHead>
                        <TableHead className="text-right pr-10 text-[9px] font-black uppercase">Acciones</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {records.filter(r => r.name === 'Cuentas Institucionales').slice(0, 10).map(rec => (
                       <TableRow key={rec.id} className="h-12 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <TableCell className="pl-8 text-[10px] font-bold text-slate-400">{rec.date}</TableCell>
                          <TableCell className="text-[11px] font-mono font-black text-slate-700 lowercase">{rec.email}</TableCell>
                          <TableCell className="text-center">
                             <Badge className={cn("text-[8px] font-black border-none uppercase px-2 h-4", 
                               rec.status === 'Activa' ? "bg-emerald-100 text-emerald-700" : 
                               rec.status === 'Inactiva' ? "bg-slate-100 text-slate-400" :
                               rec.status === 'Bloqueada' ? "bg-amber-100 text-amber-700" :
                               "bg-rose-100 text-rose-700"
                             )}>
                                {rec.status}
                             </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                             <div className="flex justify-end gap-1">
                                <button onClick={() => { setFormData({...rec}); setEditingId(rec.id!); setDialogSearchTerm(rec.cct); setIsDialogOpen(true); }} className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-primary transition-all"><Pencil className="h-4 w-4" /></button>
                                <button onClick={() => handleDelete(rec.id!)} className="h-7 w-7 flex items-center justify-center text-rose-300 hover:text-rose-600 transition-all"><Trash2 className="h-4 w-4" /></button>
                             </div>
                          </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
            </Card>
          </div>
        </div>
      ) : activeTab === 'Geoposición' ? (
        <div className="space-y-6 animate-in fade-in duration-700 w-full min-h-[850px]">
          <Card className="p-5 rounded-[2.5rem] bg-white border-none shadow-xl flex flex-wrap items-end gap-6">
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Rango de fechas</Label>
              <div className="relative group">
                <Input value="01/04/2025 - 15/04/2025" readOnly className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold pl-12 focus:bg-white transition-all" />
                <Calendar className="absolute left-4 top-3.5 h-5 w-5 text-slate-300 group-focus-within:text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-[180px] space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Tipo de dispositivo</Label>
              <Select defaultValue="todos">
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent className="rounded-xl"><SelectItem value="todos" className="text-xs font-bold">Todos</SelectItem><SelectItem value="laptop" className="text-xs font-bold">Laptop</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[180px] space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Estado</Label>
              <Select defaultValue="todos">
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent className="rounded-xl"><SelectItem value="todos" className="text-xs font-bold">Todos</SelectItem><SelectItem value="online" className="text-xs font-bold">En línea</SelectItem></SelectContent>
              </Select>
            </div>
            <Button className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] gap-3 shadow-xl">
               <Map className="h-5 w-5" /> Actualizar mapa
            </Button>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <Card className="lg:col-span-7 rounded-[3rem] border-none shadow-2xl overflow-hidden min-h-[600px] flex flex-col relative group">
              <div className="absolute top-6 left-6 z-10 flex gap-2">
                <Button variant="secondary" className="h-10 px-6 rounded-xl bg-white shadow-xl text-[10px] font-black uppercase border">Mapa</Button>
                <Button variant="ghost" className="h-10 px-6 rounded-xl bg-white/60 backdrop-blur-md shadow-xl text-[10px] font-black uppercase">Satélite</Button>
              </div>
              <div className="flex-1 relative bg-slate-100">
                 <Image src="https://picsum.photos/seed/map-toluca-v2/1200/800" alt="Mapa" fill className="object-cover opacity-80" />
                 <div className="absolute top-[45%] left-[50%] h-8 w-8 bg-emerald-500 rounded-full border-4 border-white shadow-2xl flex items-center justify-center animate-bounce">
                    <div className="h-2 w-2 bg-white rounded-full" />
                 </div>
                 <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md p-4 rounded-[2rem] shadow-2xl border border-white/50 flex flex-wrap gap-5">
                    <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-emerald-500" /><span className="text-[9px] font-black uppercase text-slate-600">En línea</span></div>
                    <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-blue-500" /><span className="text-[9px] font-black uppercase text-slate-600">En movimiento</span></div>
                    <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-rose-500" /><span className="text-[9px] font-black uppercase text-slate-600">Sin señal</span></div>
                    <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-slate-400" /><span className="text-[9px] font-black uppercase text-slate-600">Desconectado</span></div>
                 </div>
              </div>
            </Card>

            <div className="lg:col-span-5 space-y-8 flex flex-col">
               <Card className="p-8 rounded-[3rem] bg-white border-none shadow-2xl relative overflow-hidden">
                  <div className="flex items-center gap-4 mb-6 border-b border-slate-50 pb-4 relative z-10">
                     <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><MapPin className="h-6 w-6" /></div>
                     <CardTitle className="text-lg font-black text-slate-800 uppercase">Registrar coordenadas</CardTitle>
                  </div>
                  <div className="space-y-6 relative z-10">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black text-primary uppercase pl-1">CCT *</Label>
                        <div className="relative group">
                          <Input placeholder="Ej. 15DES0001R" className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-mono font-black text-primary pl-12 uppercase" value={dialogSearchTerm} onChange={e => { setDialogSearchTerm(e.target.value); handleCctChange(e.target.value); setShowSearchResults(true); }} />
                          <Building2 className="absolute left-4 top-3.5 h-5 w-5 text-slate-300" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black text-primary uppercase pl-1">Latitud *</Label>
                           <Input placeholder="Ej. 19.6289" className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold" value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black text-primary uppercase pl-1">Longitud *</Label>
                           <Input placeholder="Ej. -99.3128" className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold" value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} />
                        </div>
                     </div>
                     <div className="flex gap-4 pt-4">
                        <Button onClick={handleSave} className="flex-1 btn-institutional h-14 rounded-2xl shadow-xl text-xs gap-3"><Save className="h-5 w-5" /> Guardar</Button>
                        <Button variant="outline" onClick={() => setFormData(initialFormState)} className="px-8 h-14 rounded-2xl border-slate-200 text-slate-500 font-black uppercase text-xs gap-2"><RotateCcw className="h-4 w-4" /> Limpiar</Button>
                     </div>
                  </div>
               </Card>

               <Card className="executive-card bg-white border-none shadow-2xl flex-1 overflow-hidden flex flex-col">
                  <div className="p-6 border-b flex items-center gap-3 bg-slate-50/50">
                     <ClipboardList className="h-5 w-5 text-primary" />
                     <h4 className="text-sm font-black uppercase text-slate-700 tracking-wider">Últimas ubicaciones</h4>
                  </div>
                  <div className="flex-1 overflow-hidden">
                     <ScrollArea className="h-full">
                        <Table>
                           <TableHeader className="bg-slate-50 border-b">
                              <TableRow className="h-10">
                                 <TableHead className="text-[8px] font-black uppercase pl-6">Fecha</TableHead>
                                 <TableHead className="text-[8px] font-black uppercase text-center">CCT</TableHead>
                                 <TableHead className="text-[8px] font-black uppercase text-center">Estado</TableHead>
                                 <TableHead className="text-right pr-8 text-[8px] font-black uppercase">Acción</TableHead>
                              </TableRow>
                           </TableHeader>
                           <TableBody>
                              {records.filter(r => r.name === 'Geoposición').slice(0, 8).map((rec, idx) => (
                                <TableRow key={rec.id || idx} className="h-14 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                   <TableCell className="text-[9px] font-bold text-slate-400 pl-6">{rec.date}</TableCell>
                                   <TableCell className="text-center font-mono font-black text-[9px] text-primary">{rec.cct}</TableCell>
                                   <TableCell className="text-center"><Badge className="bg-emerald-100 text-emerald-700 text-[7px] font-black px-2 h-4 border-none uppercase">En línea</Badge></TableCell>
                                   <TableCell className="text-right pr-8">
                                      <div className="flex justify-end gap-1">
                                         <button onClick={() => { setFormData({...rec}); setEditingId(rec.id!); }} className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-primary transition-all"><Eye className="h-4 w-4" /></button>
                                         <button onClick={() => handleDelete(rec.id!)} className="h-7 w-7 flex items-center justify-center text-rose-300 hover:text-rose-600 transition-all"><Trash2 className="h-4 w-4" /></button>
                                      </div>
                                   </TableCell>
                                </TableRow>
                              ))}
                           </TableBody>
                        </Table>
                     </ScrollArea>
                  </div>
               </Card>
            </div>
          </div>
        </div>
      ) : activeTab === 'Conoce mi Escuela' ? (
        <div className="min-h-[850px] flex flex-col md:flex-row bg-[#f0f4f9] rounded-[3rem] overflow-hidden shadow-2xl border border-white/50 animate-in fade-in duration-700">
           {/* Sidebar Interno de Navegación */}
           <div className="w-full md:w-[240px] bg-[#1e293b] text-white p-6 flex flex-col shrink-0">
              <div className="flex items-center gap-3 mb-10 px-2">
                 <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-white shadow-inner">
                    <School className="h-6 w-6" />
                 </div>
                 <div className="leading-none">
                    <h3 className="text-sm font-black uppercase">Conoce Mi Escuela</h3>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">DESYSA - COEES</p>
                 </div>
              </div>

              <div className="space-y-1">
                 {[
                   { label: 'Inicio', icon: Home, active: true },
                   { label: 'Buscar escuela', icon: Search },
                   { label: 'Mapa de escuelas', icon: MapPin },
                   { label: 'Estadísticas', icon: BarChart3 },
                   { label: 'Reportes', icon: FileText },
                   { label: 'Configuración', icon: Settings },
                 ].map((item, idx) => (
                   <button key={idx} className={cn("w-full flex items-center gap-4 px-4 h-11 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all", item.active ? "bg-primary text-white shadow-xl" : "text-slate-400 hover:bg-white/5 hover:text-white")}>
                      <item.icon className={cn("h-4 w-4", item.active ? "text-white" : "text-slate-500")} />
                      {item.label}
                   </button>
                 ))}
              </div>

              <div className="mt-auto p-4 bg-white/5 rounded-[1.5rem] border border-white/5">
                 <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg"><UserCheck className="h-4 w-4" /></div>
                    <div className="min-w-0">
                       <p className="text-[9px] font-black uppercase truncate">Soporte Técnico</p>
                       <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Analista en línea</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Área Principal de Contenido */}
           <div className="flex-1 overflow-hidden flex flex-col">
              {/* Header con Buscador */}
              <div className="p-8 bg-white border-b shadow-sm z-10 shrink-0">
                 <div className="flex flex-col lg:flex-row gap-6 items-end">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
                       <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Buscar por:</Label>
                          <Select defaultValue="CCT">
                             <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 shadow-inner font-black text-[10px]"><div className="flex items-center gap-2"><School className="h-3.5 w-3.5 text-primary" /><SelectValue /></div></SelectTrigger>
                             <SelectContent className="rounded-xl"><SelectItem value="CCT" className="text-[10px] font-black">CCT</SelectItem><SelectItem value="Nombre" className="text-[10px] font-black">NOMBRE</SelectItem></SelectContent>
                          </Select>
                       </div>
                       <div className="md:col-span-1 space-y-2 relative group">
                          <Label className="text-[9px] font-black uppercase text-slate-400 pl-1 opacity-0">Input</Label>
                          <Input placeholder="Ej. 15DES0001R" className="h-11 rounded-xl bg-slate-50 border-slate-100 shadow-inner pl-10 font-bold uppercase text-xs" />
                          <Search className="absolute left-3.5 top-[2.4rem] h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Zona / Municipio</Label>
                          <Select defaultValue="todos">
                             <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 shadow-inner font-black text-[10px]"><div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-primary" /><SelectValue /></div></SelectTrigger>
                             <SelectContent className="rounded-xl"><SelectItem value="todos" className="text-[10px] font-black">TODOS</SelectItem></SelectContent>
                          </Select>
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Estado</Label>
                          <Select defaultValue="todos">
                             <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 shadow-inner font-black text-[10px]"><div className="flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-primary" /><SelectValue /></div></SelectTrigger>
                             <SelectContent className="rounded-xl"><SelectItem value="todos" className="text-[10px] font-black">TODOS</SelectItem></SelectContent>
                          </Select>
                       </div>
                    </div>
                    <Button className="h-11 px-10 bg-primary hover:bg-primary/90 rounded-xl text-[10px] font-black uppercase gap-3 shadow-xl shadow-primary/20"><Search className="h-4 w-4" /> Buscar</Button>
                 </div>
              </div>

              {/* Grid de Dashboard Interno con ScrollArea */}
              <ScrollArea className="flex-1">
                 <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                    {/* Columna Izquierda: Mapa y Stats */}
                    <div className="lg:col-span-2 space-y-8">
                       <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
                          <div className="p-4 bg-slate-50 border-b flex gap-4">
                             <Button variant="secondary" className="h-10 px-8 rounded-xl bg-primary text-white font-black text-[10px] gap-3 uppercase shadow-lg"><Map className="h-4 w-4" /> Mapa</Button>
                             <Button variant="ghost" className="h-10 px-8 rounded-xl font-black text-[10px] gap-3 uppercase text-slate-500 hover:bg-slate-100"><LayoutGrid className="h-4 w-4" /> Lista</Button>
                          </div>
                          <div className="aspect-video relative bg-slate-100 min-h-[450px]">
                             <Image src="https://picsum.photos/seed/school-map-final/1200/800" alt="Mapa" fill className="object-cover opacity-90" />
                             
                             <div className="absolute top-[40%] left-[30%] h-6 w-6 bg-blue-600 rounded-full border-2 border-white shadow-xl cursor-pointer" />
                             <div className="absolute top-[60%] left-[55%] h-6 w-6 bg-rose-600 rounded-full border-2 border-white shadow-xl cursor-pointer" />
                             <div className="absolute top-[35%] left-[45%] h-8 w-8 bg-emerald-500 rounded-full border-4 border-white shadow-2xl flex items-center justify-center animate-bounce z-20">
                                <div className="h-2 w-2 bg-white rounded-full" />
                             </div>

                             <div className="absolute top-[35%] left-[48%] bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 min-w-[260px] animate-in zoom-in-95 duration-500 z-30">
                                <div className="flex justify-between items-start mb-2">
                                   <div className="leading-tight">
                                      <p className="text-[10px] font-black text-primary uppercase">CCT: 15DES0001R</p>
                                      <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Escuela Secundaria Técnica No. 15</p>
                                   </div>
                                   <ChevronRight className="h-5 w-5 text-primary" />
                                </div>
                                <div className="h-1 bg-primary/10 rounded-full mt-2"><div className="h-full bg-primary rounded-full w-full" /></div>
                             </div>

                             <div className="absolute bottom-6 right-6 flex flex-col gap-2">
                                <button className="h-10 w-10 bg-white rounded-xl shadow-xl flex items-center justify-center font-black text-lg hover:bg-slate-50">+</button>
                                <button className="h-10 w-10 bg-white rounded-xl shadow-xl flex items-center justify-center font-black text-lg hover:bg-slate-50">-</button>
                                <button className="h-10 w-10 bg-white rounded-xl shadow-xl flex items-center justify-center font-black text-lg hover:bg-slate-50 mt-4"><Navigation className="h-5 w-5 text-slate-600" /></button>
                             </div>

                             <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md p-4 rounded-[2rem] shadow-2xl border border-white/50 flex flex-wrap gap-5">
                                <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><span className="text-[8px] font-black uppercase text-slate-600">En línea</span></div>
                                <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-blue-500" /><span className="text-[8px] font-black uppercase text-slate-600">En movimiento</span></div>
                                <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-rose-500" /><span className="text-[8px] font-black uppercase text-slate-600">Sin señal</span></div>
                                <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-slate-400" /><span className="text-[8px] font-black uppercase text-slate-600">Desconectado</span></div>
                             </div>
                          </div>
                       </Card>

                       <div className="space-y-4">
                          <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest pl-2">Resumen general</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                             {[
                               { label: 'Escuelas registradas', value: '1,248', icon: School, color: 'bg-primary/5 text-primary border-primary/10' },
                               { label: 'Directores / Responsables', value: '856', icon: Users, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                               { label: 'Municipios', value: '125', icon: MapPin, color: 'bg-blue-50 text-blue-600 border-blue-100' },
                               { label: 'Datos actualizados', value: '3,482', icon: FileText, color: 'bg-amber-50 text-amber-600 border-amber-100' },
                             ].map((stat, idx) => (
                               <Card key={idx} className={cn("p-5 rounded-[2rem] border shadow-sm transition-all hover:shadow-xl hover:translate-y-[-4px]", stat.color)}>
                                  <div className="flex flex-col items-center text-center gap-3">
                                     <div className="h-10 w-10 rounded-xl bg-white/80 flex items-center justify-center shadow-inner"><stat.icon className="h-5 w-5" /></div>
                                     <div className="space-y-0.5">
                                        <h4 className="text-2xl font-black leading-none">{stat.value}</h4>
                                        <p className="text-[8px] font-bold uppercase tracking-widest opacity-60 leading-tight">{stat.label}</p>
                                     </div>
                                  </div>
                               </Card>
                             ))}
                          </div>
                       </div>
                    </div>

                    {/* Columna Derecha: Formulario y Ficha */}
                    <div className="space-y-8">
                       <Card className="p-8 rounded-[3rem] bg-white border-none shadow-2xl relative overflow-hidden">
                          <div className="flex items-center gap-4 mb-8 border-b border-slate-50 pb-4 relative z-10">
                             <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><PlusCircle className="h-6 w-6" /></div>
                             <div>
                                <CardTitle className="text-lg font-black text-slate-800 uppercase">Registrar / Editar Escuela</CardTitle>
                                <CardDescription className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ingresa la información oficial del plantel.</CardDescription>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                             <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 pl-1">CCT *</Label><div className="relative"><Input placeholder="Ej. 15DES0001R" className="h-11 bg-slate-50 border-none rounded-xl text-xs font-black pl-10 uppercase" /><School className="absolute left-3 top-3.5 h-4 w-4 text-slate-300" /></div></div>
                             <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Nombre de la escuela *</Label><div className="relative"><Input placeholder="Ej. Técnica No. 15" className="h-11 bg-slate-50 border-none rounded-xl text-xs font-black pl-10 uppercase" /><Building2 className="absolute left-3 top-3.5 h-4 w-4 text-slate-300" /></div></div>
                             <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Zona *</Label><Select><SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl text-xs font-bold uppercase"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="001" className="text-xs font-bold">001</SelectItem></SelectContent></Select></div>
                             <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Municipio *</Label><Select><SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl text-xs font-bold uppercase"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="Toluca" className="text-xs font-bold">TOLUCA</SelectItem></SelectContent></Select></div>
                             <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Teléfono</Label><div className="relative"><Input placeholder="722 123 4567" className="h-11 bg-slate-50 border-none rounded-xl text-xs font-bold pl-10" /><Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-300" /></div></div>
                             <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Correo electrónico</Label><div className="relative"><Input placeholder="escuela@edugem.gob.mx" className="h-11 bg-slate-50 border-none rounded-xl text-xs font-bold pl-10" /><Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-300" /></div></div>
                             <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Latitud *</Label><div className="relative"><Input placeholder="19.6289" className="h-11 bg-slate-50 border-none rounded-xl text-xs font-bold pl-10" /><MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-300" /></div></div>
                             <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Longitud *</Label><div className="relative"><Input placeholder="-99.1332" className="h-11 bg-slate-50 border-none rounded-xl text-xs font-bold pl-10" /><Navigation className="absolute left-3 top-3.5 h-4 w-4 text-slate-300" /></div></div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-10 relative z-10">
                             <Button onClick={handleSave} className="h-12 rounded-2xl bg-primary text-white font-black text-[10px] uppercase shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Guardar escuela</Button>
                             <Button variant="outline" className="h-12 rounded-2xl border-slate-200 text-slate-500 font-black text-[10px] uppercase gap-2 hover:bg-slate-50 transition-all"><RotateCcw className="h-4 w-4" /> Limpiar</Button>
                          </div>
                       </Card>

                       <Card className="rounded-[3rem] bg-white border-none shadow-2xl overflow-hidden animate-in slide-in-from-right duration-500">
                          <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
                             <div className="flex items-center gap-3"><School className="h-5 w-5 text-primary" /><h4 className="text-[11px] font-black uppercase text-slate-700">Datos de la escuela</h4></div>
                             <Badge className="bg-emerald-500 text-white font-black text-[8px] px-3 h-5 rounded-full uppercase border-none">En línea</Badge>
                          </div>
                          <div className="p-6 space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative aspect-video rounded-2xl overflow-hidden border shadow-sm">
                                   <Image src="https://picsum.photos/seed/school-card-v1/600/400" alt="Foto Escuela" fill className="object-cover" />
                                </div>
                                <div className="space-y-3">
                                   {[
                                     { label: 'CCT:', value: '15DES0001R' },
                                     { label: 'Nombre:', value: 'Escuela Secundaria Técnica No. 15' },
                                     { label: 'Zona:', value: '001' },
                                     { label: 'Municipio:', value: 'Toluca' },
                                     { label: 'Dirección:', value: 'Av. Independencia No. 123, Col. Centro, Toluca, Estado de México.' },
                                   ].map((item, idx) => (
                                     <div key={idx} className="flex gap-2">
                                        <span className="text-[8px] font-black text-slate-400 uppercase w-16 shrink-0 pt-0.5">{item.label}</span>
                                        <span className="text-[10px] font-bold text-slate-700 leading-tight">{item.value}</span>
                                     </div>
                                   ))}
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-slate-300" /><span className="text-[10px] font-bold text-slate-600">722 123 4567</span></div>
                                <div className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-primary" /><span className="text-[10px] font-bold text-slate-600 truncate lowercase">esc15@edugem.gob.mx</span></div>
                             </div>
                             <div className="grid grid-cols-2 gap-4 pt-6">
                                <Button variant="outline" className="h-10 rounded-xl border-primary/20 text-primary font-black text-[9px] uppercase gap-2 hover:bg-primary/5 shadow-md"><Map className="h-4 w-4" /> Ver en mapa</Button>
                                <Button className="h-10 rounded-xl bg-primary text-white font-black text-[9px] uppercase gap-2 shadow-xl shadow-primary/20"><FileText className="h-4 w-4" /> Ver más información</Button>
                             </div>
                          </div>
                       </Card>
                    </div>
                 </div>
              </ScrollArea>
           </div>
        </div>
      ) : (
        <Card className="executive-card p-0 shadow-2xl border-none overflow-hidden bg-white animate-in slide-in-from-bottom-4 duration-500 w-full min-h-[400px]">
          <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50/50">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Briefcase className="h-5 w-5" /></div>
                <div><h3 className="text-sm font-black uppercase text-slate-800">{activeTab}</h3><p className="text-[9px] font-bold text-slate-400 uppercase">Gestión de Rubro Técnico</p></div>
             </div>
             <div className="flex items-center gap-4">
                <div className="relative w-full sm:w-64">
                   <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
                   <Input placeholder="Buscar..." className="h-9 pl-9 rounded-xl border-slate-200 text-xs font-bold bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <Button onClick={() => { setFormData({...initialFormState, name: activeTab}); setEditingId(null); setDialogSearchTerm(''); setShowSearchResults(false); setIsDialogOpen(true); }} className="btn-institutional h-10 px-6 rounded-xl text-[10px] font-bold shadow-lg uppercase">
                    <PlusCircle className="h-5 w-5 mr-2" /> Nuevo Registro
                </Button>
             </div>
          </div>
          <div className="overflow-x-auto w-full">
            <Table className="w-full">
              <TableHeader className="bg-slate-50 border-b">
                 <TableRow className="h-12">
                    <TableHead className="w-12 text-[10px] font-bold pl-8 uppercase">#</TableHead>
                    <TableHead className="text-[10px] font-bold text-primary w-[110px] uppercase">CCT</TableHead>
                    <TableHead className="text-[10px] font-bold text-primary min-w-[200px] uppercase">Identificación Oficial</TableHead>
                    <TableHead className="text-[10px] font-bold text-primary w-[100px] uppercase text-center">Estatus</TableHead>
                    <TableHead className="text-right text-[10px] font-bold pr-10 w-24 uppercase">Acción</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 opacity-30"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /><p className="text-[10px] font-black uppercase">Sincronizando...</p></TableCell></TableRow>
                ) : filteredRecords.length > 0 ? filteredRecords.map((rec, idx) => (
                  <TableRow key={rec.id || idx} className="hover:bg-slate-50 border-b border-slate-50 h-14 transition-colors">
                    <TableCell className="pl-8 font-bold text-[10px] text-slate-300">{idx + 1}</TableCell>
                    <TableCell className="font-mono font-bold text-[11px] text-primary">{rec.cct}</TableCell>
                    <TableCell className="py-2 min-w-0"><div className="flex flex-col"><span className="text-[12px] font-bold text-slate-700 leading-tight truncate uppercase">{rec.schoolName || rec.userName}</span><span className="text-[9px] font-bold text-muted-foreground opacity-70 truncate uppercase">{rec.municipio} • {rec.valle}</span></div></TableCell>
                    <TableCell className="text-center">
                       <Badge variant="outline" className={cn("text-[8px] font-bold px-2 h-5 rounded-full border-2 uppercase", 
                         rec.status === 'activo' || rec.status === 'concluido' || rec.status === 'Activa' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                         rec.status === 'inactivo' || rec.status === 'Eliminada' ? "bg-rose-50 text-rose-700 border-rose-200" : 
                         "bg-amber-50 text-amber-700 border-amber-200"
                       )}>{rec.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setFormData({...rec}); setEditingId(rec.id!); setDialogSearchTerm(rec.cct); setShowSearchResults(false); setIsDialogOpen(true); }} className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(rec.id!)} className="h-8 w-8 flex items-center justify-center text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (<TableRow><TableCell colSpan={5} className="text-center py-20 opacity-30 text-xs font-bold uppercase">Sin registros oficiales</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <HelpDeskDialog open={isHelpDeskOpen} onOpenChange={setIsHelpDeskOpen} />

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!isSaving) { setIsDialogOpen(open); if(!open) { setFormData(initialFormState); setEditingId(null); setShowSearchResults(false); } } }}>
        <DialogContent className="w-[98vw] lg:max-w-[1000px] h-[90vh] rounded-[2.5rem] p-0 overflow-hidden bg-white flex flex-col border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white shrink-0 flex flex-row justify-between items-center pr-10">
             <DialogTitle className="font-black text-lg uppercase">Gestión Técnica: {activeTab}</DialogTitle>
             <button onClick={() => setIsDialogOpen(false)} className="h-10 w-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-all"><X className="h-6 w-6" /></button>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-10 space-y-10 max-w-4xl mx-auto">
                 <div className={cn("bg-slate-50 p-8 rounded-[2.5rem] border-2 transition-all space-y-6 shadow-inner", !formData.cct ? "border-rose-200" : "border-primary/10")}>
                    <Label className="text-[11px] font-black text-primary tracking-widest block pl-1 uppercase">Buscador de Plantel (CCT)</Label>
                    <div className="relative">
                      <Input placeholder="INGRESAR CCT..." className="h-14 rounded-2xl bg-white border-primary/20 font-bold text-xl uppercase shadow-lg pl-6" value={dialogSearchTerm} onChange={(e) => { setDialogSearchTerm(e.target.value); handleCctChange(e.target.value); setShowSearchResults(true); }} />
                      {showSearchResults && dialogSearchTerm.length > 2 && (
                        <div className="absolute top-18 left-0 right-0 max-h-60 overflow-auto bg-white border rounded-2xl shadow-2xl z-[100] divide-y">
                          {schoolSearchResults.map(s => (
                            <div key={`${s.cct}-${s.turno}`} className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center group transition-all" onClick={() => handleCctChange(s.cct)}>
                              <div className="flex flex-col"><span className="text-sm font-bold uppercase truncate group-hover:text-primary transition-colors">{s.nombre}</span><span className="text-[10px] font-mono text-muted-foreground">{s.cct} • {s.municipio} • {s.turno}</span></div>
                              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-all" />
                            </div>
                          ))}
                          {schoolSearchResults.length === 0 && (
                            <div className="p-6 text-center">
                               <Button onClick={() => { setQuickAddForm({...quickAddForm, cct: dialogSearchTerm.toUpperCase()}); setIsQuickAddOpen(true); }} variant="outline" className="h-10 px-6 rounded-xl text-[9px] font-black uppercase border-primary/20 text-primary">
                                 <Plus className="h-4 w-4 mr-2" /> Registrar Nuevo CCT
                               </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {!formData.cct ? (
                      <div className="p-4 bg-rose-50 rounded-xl flex items-center gap-3 border border-rose-100">
                         <AlertCircle className="h-5 w-5 text-rose-500" />
                         <p className="text-[10px] font-black text-rose-600 uppercase">Identificación requerida para habilitar sincronización</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-6 p-6 bg-white rounded-[2rem] border-2 border-emerald-100 shadow-sm animate-in zoom-in-95">
                        <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><School className="h-10 w-10" /></div>
                        <div className="min-w-0"><h4 className="text-xl font-bold uppercase truncate leading-tight text-slate-800">{formData.schoolName}</h4><p className="text-[11px] font-mono font-bold text-emerald-700 tracking-widest mt-1 uppercase">CCT: {formData.cct}</p></div>
                      </div>
                    )}
                 </div>

                 {activeTab === 'Biblioteca Digital' && (
                   <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 space-y-8 animate-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-3 border-b pb-2"><ClipboardCheck className="h-5 w-5 text-accent" /><h4 className="text-xs font-black uppercase text-accent tracking-widest">Fases de Implementación</h4></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 bg-slate-50 p-6 rounded-[2rem] border">
                        {BIBLIOTECA_FASES_LABELS.map((fase) => (
                          <div key={fase.id} className="flex items-center space-x-3 group cursor-pointer" onClick={() => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, [fase.id]: !((formData.bibliotecaFases as any)[fase.id])}})}>
                            <Checkbox id={fase.id} checked={(formData.bibliotecaFases as any)?.[fase.id]} onCheckedChange={() => {}} className="h-5 w-5 border-primary/30" />
                            <Label className="text-xs font-bold text-slate-600 uppercase group-hover:text-primary transition-colors cursor-pointer">{fase.label}</Label>
                          </div>
                        ))}
                      </div>
                   </div>
                 )}

                 {activeTab === 'Geoposición' && (
                   <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 space-y-8 animate-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-3 border-b pb-2"><MapPin className="h-5 w-5 text-accent" /><h4 className="text-xs font-black uppercase text-accent tracking-widest">Coordenadas del Centro de Trabajo</h4></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-2"><Label className="text-[10px] font-black text-primary uppercase">Latitud</Label><Input className="h-12 font-mono font-bold bg-slate-50 border-slate-200 rounded-xl" value={formData.latitud || ''} onChange={e => setFormData({...formData, latitud: e.target.value})} placeholder="Ej. 19.4326" /></div>
                         <div className="space-y-2"><Label className="text-[10px] font-black text-primary uppercase">Longitud</Label><Input className="h-12 font-mono font-bold bg-slate-50 border-slate-200 rounded-xl" value={formData.longitud || ''} onChange={e => setFormData({...formData, longitud: e.target.value})} placeholder="Ej. -99.1332" /></div>
                      </div>
                   </div>
                 )}

                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-primary pl-1 uppercase">Observaciones Técnicas</Label>
                    <Textarea className="min-h-[140px] bg-white border-slate-200 rounded-[1.5rem] p-6 text-sm font-semibold shadow-sm focus:ring-4 focus:ring-primary/5 transition-all uppercase" value={formData.observaciones || ''} onChange={e => setFormData({...formData, observaciones: e.target.value.toUpperCase()})} />
                 </div>
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4 shrink-0">
             <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSaving} className="h-12 px-8 rounded-xl font-bold text-xs uppercase">Cancelar</Button>
             <Button onClick={handleSave} disabled={isSaving} className="btn-institutional h-12 px-12 text-xs gap-3 rounded-xl shadow-2xl">
               {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5" />} GUARDAR
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-[#B38E5D] text-white">
            <DialogTitle className="uppercase font-black text-lg flex items-center gap-3"><PlusCircle className="h-6 w-6" /> Registro de Nuevo CCT</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">CCT (10 Dígitos)</Label>
                  <Input value={quickAddForm.cct} onChange={e => setQuickAddForm({...quickAddForm, cct: e.target.value.toUpperCase()})} maxLength={10} className="font-mono font-black border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Nombre del Plantel</Label>
                  <Input value={quickAddForm.nombre} onChange={e => setQuickAddForm({...quickAddForm, nombre: e.target.value.toUpperCase()})} className="font-black border-slate-200" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Municipio</Label>
                  <Input value={quickAddForm.municipio} onChange={e => setQuickAddForm({...quickAddForm, municipio: e.target.value.toUpperCase()})} className="font-bold uppercase border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Valle</Label>
                  <Select value={quickAddForm.valle} onValueChange={v => setQuickAddForm({...quickAddForm, valle: v})}><SelectTrigger className="font-bold border-slate-200"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="MEXICO">MÉXICO</SelectItem><SelectItem value="TOLUCA">TOLUCA</SelectItem></SelectContent></Select>
                </div>
             </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsQuickAddOpen(false)} className="h-12 px-8 text-[10px] font-black uppercase">Cancelar</Button>
            <Button onClick={handleQuickAddCct} className="bg-primary text-white h-12 px-12 rounded-xl text-[10px] font-black uppercase shadow-lg">Registrar y Sumar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
