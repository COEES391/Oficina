'use client'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  programsData, 
  type ProgramStatus
} from "@/lib/planning-data"
import { schoolsDirectory, type SchoolInfo } from "@/lib/schools-directory"
import { cn } from "@/lib/utils"
import { 
  PlusCircle, 
  Pencil, 
  Activity,
  Search,
  School,
  Headset,
  CheckCircle2,
  Circle,
  Users,
  Plus,
  FilePlus,
  FileBox,
  Clock,
  Save,
  Layers,
  Archive,
  FileText,
  X,
  ShieldCheck,
  MailCheck,
  UserCheck,
  Trash2,
  ChevronRight,
  Monitor,
  MapPin,
  Navigation,
  Mail,
  Upload,
  ImageIcon
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { HelpDeskDialog } from '@/components/HelpDeskDialog'
import Image from 'next/image'

const PROGRAM_RUBROS = [
  'Cuentas Institucionales',
  'Biblioteca Digital',
  'Geoposición',
  'Conoce mi Escuela',
  'ATRES'
];

const FUNCIONES = [
  "PAAE",
  "DOCENTE",
  "DIRECTIVO",
  "JEFE DE ENSEÑANZA",
  "SUPERVISOR",
  "ASESOR TECNICO PEDAGOGICO"
]

type AssistantEntry = {
  paterno: string;
  materno: string;
  nombres: string;
  rfc: string;
  curp: string;
  genero: 'MASCULINO' | 'FEMENINO' | '';
  funcion: string;
  email: string;
  cct: string;
  nombreCT: string;
  ze: string;
  sector: string;
  modalidad: string;
  municipio: string;
  region: string;
  valle: string;
}

const StatusLight = ({ status }: { status: string }) => {
  return (
    <div className="inline-flex flex-col gap-0.5 bg-slate-900 p-0.5 rounded-md shadow-lg border border-slate-700/50 w-5">
      <div className={cn(
        "h-2 w-2 rounded-full border border-black/20 mx-auto",
        status === 'activo' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-emerald-900/30 grayscale"
      )} />
      <div className={cn(
        "h-2 w-2 rounded-full border border-black/20 mx-auto",
        status === 'suspendida' ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" : "bg-amber-900/30 grayscale"
      )} />
      <div className={cn(
        "h-2 w-2 rounded-full border border-black/20 mx-auto",
        status === 'inactivo' ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" : "bg-emerald-900/30 grayscale"
      )} />
    </div>
  );
}

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [activeTab, setActiveTab] = useState(PROGRAM_RUBROS[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isHelpDeskOpen, setIsHelpDeskOpen] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogSearchTerm, setDialogSearchTerm] = useState('')
  
  const [verifySearch, setVerifySearch] = useState('')
  const [verifiedAccount, setVerifiedAccount] = useState<any>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const [selectedReport, setSelectedReport] = useState<ProgramStatus | null>(null)
  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([])

  const pdfInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const [assistants, setAssistants] = useState<AssistantEntry[]>([
    { paterno: '', materno: '', nombres: '', rfc: '', curp: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '' }
  ])

  const initialFormState: ProgramStatus = {
    id: '', name: '', progress: 0, status: 'activo', date: new Date().toISOString().split('T')[0], cct: '', schoolName: '', 
    userName: '', email: '',
    zonaEscolar: '', sector: '', modalidad: '', municipio: '', region: '', valle: '',
    asistentes: [],
    latitud: '',
    longitud: '',
    observaciones: '',
    reportPdf: '',
    evidencePhotos: [] as string[],
    bibliotecaFases: {
      fase1: false, fase2: false, fase3: false, fase4: false, fase4_1: false, fase4_2: false,
      fase5: false, fase6: false, fase7: false, fase7_1: false, personalCapacitado: 0, equiposHabilitados: 0
    }
  }

  const [formData, setFormData] = useState<ProgramStatus>(initialFormState)

  const syncData = useCallback(() => {
    const storedV24 = localStorage.getItem('programs_full_v24')
    setRecords(storedV24 ? JSON.parse(storedV24) : [])
    const storedSchools = JSON.parse(localStorage.getItem('schools_master_full_v21') || '[]')
    setAllSchools(storedSchools.length > 0 ? storedSchools : schoolsDirectory)
  }, [])

  useEffect(() => {
    setMounted(true)
    syncData()
  }, [syncData])

  const handleCctChange = (value: string) => {
    const cleanValue = value.toUpperCase()
    setFormData(prev => ({ ...prev, cct: cleanValue }))
    if (cleanValue.length === 10) {
      const match = allSchools.find(s => s.cct.toUpperCase() === cleanValue)
      if (match) {
        setFormData(prev => ({ 
          ...prev, 
          schoolName: match.nombre, 
          municipio: match.municipio, 
          valle: match.valle, 
          region: match.region, 
          zonaEscolar: match.zonaEscolar, 
          sector: match.sector, 
          modalidad: match.modalidad 
        }))
      } else {
        setFormData(prev => ({ ...prev, schoolName: '', municipio: '', valle: '', region: '', zonaEscolar: '', sector: '', modalidad: '' }))
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'image') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) { // 2.0 MB
      toast({ variant: "destructive", title: "Archivo demasiado pesado", description: "Límite: 2.0 MB" })
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      if (type === 'pdf') {
        setFormData(prev => ({ ...prev, reportPdf: base64 }))
      } else {
        setFormData(prev => ({ ...prev, evidencePhotos: [...(prev.evidencePhotos || []), base64] }))
      }
      toast({ title: "Evidencia añadida" })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evidencePhotos: (prev.evidencePhotos || []).filter((_, i) => i !== index)
    }))
  }

  const handleAddAssistantRow = () => {
    setAssistants([...assistants, { paterno: '', materno: '', nombres: '', rfc: '', curp: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '' }])
  }

  const handleRemoveAssistantRow = (index: number) => {
    if (assistants.length === 1) return
    setAssistants(assistants.filter((_, i) => i !== index))
  }

  const updateAssistant = (index: number, field: keyof AssistantEntry, value: string) => {
    const newAssistants = [...assistants]
    newAssistants[index] = { ...newAssistants[index], [field]: value }

    if (field === 'cct') {
      const cleanValue = value.trim().toUpperCase()
      if (cleanValue.length === 10) {
        const school = allSchools.find(s => s.cct.toUpperCase() === cleanValue)
        if (school) {
          newAssistants[index] = {
            ...newAssistants[index],
            cct: school.cct,
            nombreCT: school.nombre,
            ze: school.zonaEscolar,
            sector: school.sector,
            modalidad: school.modalidad,
            municipio: school.municipio,
            region: school.region,
            valle: school.valle
          }
        }
      }
    }
    setAssistants(newAssistants)
  }

  const handleSave = () => {
    if (!formData.cct) {
      toast({ variant: "destructive", title: "CCT Obligatorio" });
      return;
    }

    const recordToSave = { ...formData, name: activeTab, asistentes: assistants.filter(a => a.rfc && a.nombres) };
    
    if (activeTab === 'Biblioteca Digital' && formData.bibliotecaFases) {
      const f = formData.bibliotecaFases;
      const phases = [f.fase1, f.fase2, f.fase3, f.fase4, f.fase5, f.fase6, f.fase7];
      recordToSave.progress = Math.round((phases.filter(v => v).length / 7) * 100);
      recordToSave.status = recordToSave.progress === 100 ? 'concluido' : 'activo';
    }

    const updated = editingId ? records.map(r => r.id === editingId ? recordToSave : r) : [{...recordToSave, id: `SOL-${Date.now()}`}, ...records];
    localStorage.setItem('programs_full_v24', JSON.stringify(updated))
    setRecords(updated); setIsDialogOpen(false); setEditingId(null); setFormData(initialFormState);
    toast({ title: "Registro guardado" })
  }

  const handleDelete = (id: string) => {
    if (!confirm("¿Desea eliminar este registro?")) return;
    const updated = records.filter(r => r.id !== id);
    localStorage.setItem('programs_full_v24', JSON.stringify(updated));
    setRecords(updated);
    toast({ title: "Registro eliminado" });
  }

  const handleVerifyAccount = () => {
    if (!verifySearch) return;
    setIsVerifying(true);
    setTimeout(() => {
      const term = verifySearch.toUpperCase();
      let found = null;
      for (const rec of records.filter(r => r.name === 'Cuentas Institucionales')) {
        if ((rec.rfc || '').toUpperCase() === term || 
            (rec.email || '').toUpperCase().includes(term) ||
            (rec.userName || '').toUpperCase().includes(term)) {
          found = { ...rec };
          break;
        }
      }
      setVerifiedAccount(found);
      setIsVerifying(false);
      if (!found) toast({ variant: "destructive", title: "No encontrada" });
    }, 800);
  }

  const filteredRecords = records.filter(r => r.name === activeTab && (!searchTerm || (r.cct && r.cct.includes(searchTerm.toUpperCase())) || (r.schoolName && r.schoolName.includes(searchTerm.toUpperCase()))));

  const schoolSearchResults = useMemo(() => {
    if (!dialogSearchTerm || dialogSearchTerm.length < 3) return [];
    const term = dialogSearchTerm.toUpperCase();
    return allSchools.filter(s => s.cct.includes(term) || s.nombre.includes(term)).slice(0, 5);
  }, [allSchools, dialogSearchTerm]);

  if (!mounted) return null

  const showAssistantsTab = activeTab === 'Biblioteca Digital' && (formData.bibliotecaFases?.personalCapacitado || 0) >= 1;

  return (
    <div className="space-y-4 animate-in fade-in duration-700 w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-primary uppercase leading-none">Módulos Técnicos COEES</h2>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.1em]">Auditoría 2026</p>
        </div>
      </div>

      <Card className="executive-card p-4 sm:p-6 bg-white border-none shadow-xl mt-4">
        <div className="grid grid-cols-12 items-end gap-4">
           <div className="col-span-12 lg:col-span-5 space-y-2 min-w-0">
              <Label className="text-[9px] font-black uppercase text-slate-400 block pl-1">Módulo Institucional</Label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {PROGRAM_RUBROS.map(rubro => (
                  <button 
                    key={`rubro-${rubro}`} 
                    onClick={() => { setActiveTab(rubro); setSearchTerm(''); }} 
                    className={cn(
                      "px-4 h-10 text-[9px] font-black uppercase rounded-xl transition-all border shadow-sm shrink-0 whitespace-nowrap", 
                      activeTab === rubro ? "bg-primary text-white border-primary" : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
                    )}
                  >
                    {rubro}
                  </button>
                ))}
              </div>
           </div>
           
           <div className="col-span-12 lg:col-span-2 flex justify-center pb-2">
             {activeTab === 'Cuentas Institucionales' && (
               <Button onClick={() => setIsVerifyDialogOpen(true)} className="h-12 px-6 rounded-xl bg-accent hover:bg-accent/90 text-white font-black uppercase text-[9px] gap-2 shadow-lg w-full">
                 <ShieldCheck className="h-5 w-5" /> VERIFICADOR
               </Button>
             )}
             {activeTab === 'ATRES' && (
               <Button onClick={() => setIsHelpDeskOpen(true)} className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[9px] gap-2 shadow-lg w-full">
                 <Headset className="h-5 w-5" /> MESA AYUDA
               </Button>
             )}
           </div>

           <div className="col-span-12 lg:col-span-5 flex items-center gap-3 pb-2">
             <div className="relative flex-1">
                <Input placeholder="FILTRAR..." className="h-12 rounded-xl bg-slate-50 border-primary/5 pl-10 text-[10px] font-black uppercase w-full shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <Search className="absolute left-3.5 top-4 h-4 w-4 text-slate-300" />
             </div>
             
             <Button onClick={() => { setFormData({...initialFormState, name: activeTab}); setAssistants([{ paterno: '', materno: '', nombres: '', rfc: '', curp: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '' }]); setEditingId(null); setIsDialogOpen(true); }} className="btn-institutional h-12 px-6 rounded-xl text-[9px] font-black uppercase shadow-xl flex-shrink-0 min-w-fit">
                <PlusCircle className="h-5 w-5 mr-2" /> NUEVO REGISTRO
             </Button>
           </div>
        </div>
      </Card>

      <div className="executive-card p-0 shadow-2xl border-none overflow-hidden bg-white mt-4 animate-in slide-in-from-bottom-4 duration-500 w-full">
        <div className="overflow-x-auto w-full">
          <Table className="w-full">
            <TableHeader className="bg-slate-50 border-b">
               <TableRow className="h-12">
                  <TableHead className="w-12 text-[9px] font-black uppercase text-center pl-4">#</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-primary w-[110px]">CCT</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-primary min-w-[200px]">Identificación</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-primary w-[100px]">Estatus</TableHead>
                  <TableHead className="text-right text-[9px] font-black uppercase pr-6 w-24">Acción</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? filteredRecords.map((rec, idx) => (
                <TableRow key={rec.id || idx} className="hover:bg-slate-50 border-b border-slate-50 h-14">
                  <TableCell className="text-center font-black text-[10px] text-slate-300 pl-4">{idx + 1}</TableCell>
                  <TableCell className="font-black text-[10px] text-primary">{rec.cct}</TableCell>
                  <TableCell className="py-2 min-w-0"><div className="flex flex-col"><span className="text-[10px] font-black text-slate-700 uppercase leading-tight truncate">{rec.schoolName || rec.userName}</span><span className="text-[8px] font-bold text-muted-foreground uppercase opacity-70 truncate">{rec.municipio}</span></div></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       {activeTab === 'Cuentas Institucionales' ? <StatusLight status={rec.status} /> : <Badge variant="outline" className="text-[7px] font-black uppercase">{rec.status}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-1">
                      {activeTab === 'Biblioteca Digital' && (<button onClick={() => { setSelectedReport(rec); setIsReportDialogOpen(true); }} className="h-7 w-7 flex items-center justify-center text-accent hover:bg-accent/5 rounded-lg"><FileBox className="h-3.5 w-3.5" /></button>)}
                      <button onClick={() => { setFormData({...rec}); setAssistants(rec.asistentes || []); setEditingId(rec.id!); setIsDialogOpen(true); }} className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(rec.id!)} className="h-7 w-7 flex items-center justify-center text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (<TableRow><TableCell colSpan={5} className="text-center py-20 opacity-30 text-xs font-black uppercase">Sin registros</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </div>
      </div>

      <HelpDeskDialog open={isHelpDeskOpen} onOpenChange={setIsHelpDeskOpen} />

      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[500px] rounded-[2rem] p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-primary text-white">
             <DialogTitle className="uppercase font-black text-lg">Verificador Oficial</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">ID Servidor (RFC/CURP)</Label>
              <div className="flex gap-2">
                <Input placeholder="INGRESAR DATO..." className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-mono font-black text-center uppercase" value={verifySearch} onChange={e => setVerifySearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleVerifyAccount()} />
                <Button onClick={handleVerifyAccount} disabled={isVerifying || !verifySearch} className="h-12 w-12 rounded-xl bg-accent shadow-lg p-0"><Search className={cn("h-5 w-5", isVerifying && "animate-spin")} /></Button>
              </div>
            </div>
            {verifiedAccount ? (
              <div className="p-5 rounded-[1.5rem] bg-slate-900 text-white shadow-2xl animate-in zoom-in-95">
                <div className="flex items-center gap-3 border-b border-white/10 pb-3 mb-3">
                   <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center"><UserCheck className="h-5 w-5 text-accent" /></div>
                   <div className="min-w-0"><h4 className="text-[10px] font-black uppercase leading-none truncate">{verifiedAccount.userName}</h4><p className="text-[8px] font-bold text-white/50 uppercase mt-1">{verifiedAccount.cct}</p></div>
                </div>
                <div className="space-y-2">
                   <p className="text-[7px] font-black uppercase text-white/40 leading-none">Correo Institucional</p>
                   <p className="text-[9px] font-mono font-black text-accent truncate">{verifiedAccount.email || 'S/D'}</p>
                   <div className="flex items-center gap-2 pt-1">
                      <StatusLight status={verifiedAccount.status} />
                      <Badge className="text-[7px] font-black h-4 px-2 uppercase bg-emerald-500">{verifiedAccount.status}</Badge>
                   </div>
                </div>
              </div>
            ) : (<div className="p-8 border-2 border-dashed rounded-[2rem] text-center opacity-20"><p className="text-[10px] font-black uppercase tracking-widest">Ingrese un ID para validar</p></div>)}
          </div>
          <DialogFooter className="p-4 bg-slate-50 border-t"><Button variant="ghost" onClick={() => setIsVerifyDialogOpen(false)} className="w-full h-11 font-black text-[10px]">CERRAR</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setFormData(initialFormState); }}>
        <DialogContent className="w-[98vw] lg:max-w-[1400px] h-[95vh] rounded-[2.5rem] p-0 overflow-hidden bg-white flex flex-col border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white shrink-0 flex flex-row justify-between items-center pr-10">
             <DialogTitle className="uppercase font-black text-lg">Gestión de {activeTab}</DialogTitle>
             {activeTab === 'Cuentas Institucionales' && (
                <div className="flex items-center gap-3 bg-white/10 p-2 rounded-xl border border-white/20">
                   <StatusLight status={formData.status} />
                   <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                      <SelectTrigger className="h-8 w-32 bg-transparent border-none text-white font-black uppercase text-[9px]"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-2xl">
                         <SelectItem value="activo" className="font-black text-[9px] text-emerald-600">ACTIVO</SelectItem>
                         <SelectItem value="suspendida" className="font-black text-[9px] text-amber-600">SUSPENDIDA</SelectItem>
                         <SelectItem value="inactivo" className="font-black text-[9px] text-rose-600">INACTIVO</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
             )}
          </DialogHeader>
          
          <Tabs defaultValue="datos" className="flex-1 flex flex-col overflow-hidden">
             {showAssistantsTab && (
               <div className="px-6 border-b bg-slate-50/50 shrink-0">
                  <TabsList className="bg-transparent h-14 p-0 gap-8">
                    <TabsTrigger value="datos" className="text-[11px] font-black uppercase border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent transition-all rounded-none px-4">1. Fases Técnicas</TabsTrigger>
                    <TabsTrigger value="asistentes" className="text-[11px] font-black uppercase border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent transition-all rounded-none px-4">2. LISTA DE PARTICIPANTES</TabsTrigger>
                  </TabsList>
               </div>
             )}

             <div className="flex-1 overflow-hidden">
                <TabsContent value="datos" className="h-full m-0 p-0">
                  <ScrollArea className="h-full">
                    <div className="p-8 space-y-8 w-full">
                      {activeTab === 'Cuentas Institucionales' ? (
                         <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-primary/10 space-y-8 shadow-inner max-w-6xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div className="md:col-span-2 space-y-2">
                                  <Label className="text-[10px] font-black uppercase text-primary pl-1">1. Nombre Completo del Usuario</Label>
                                  <Input className="h-14 font-black uppercase text-lg border-primary/10 bg-white rounded-xl shadow-sm" value={formData.userName || ''} onChange={e => setFormData({...formData, userName: e.target.value.toUpperCase()})} />
                               </div>
                               <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase text-primary pl-1">2. CCT</Label>
                                  <Input className="h-12 font-mono font-black uppercase border-primary/10 bg-white rounded-xl" value={formData.cct || ''} onChange={e => handleCctChange(e.target.value)} maxLength={10} />
                               </div>
                               <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase text-primary pl-1">7. Correo Institucional</Label>
                                  <Input className="h-12 font-bold lowercase border-primary/10 bg-white rounded-xl" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value.toLowerCase()})} placeholder="usuario@desysa.edu.mx" />
                               </div>
                               <div className="grid grid-cols-2 gap-4 md:col-span-2">
                                 <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-primary pl-1">3. Sector</Label>
                                    <Input className="h-11 uppercase font-black bg-white rounded-xl" value={formData.sector || ''} onChange={e => setFormData({...formData, sector: e.target.value.toUpperCase()})} />
                                 </div>
                                 <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-primary pl-1">4. Zona</Label>
                                    <Input className="h-11 uppercase font-black bg-white rounded-xl" value={formData.zonaEscolar || ''} onChange={e => setFormData({...formData, zonaEscolar: e.target.value.toUpperCase()})} />
                                 </div>
                                 <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-primary pl-1">5. Modalidad</Label>
                                    <Input className="h-11 uppercase font-black bg-white rounded-xl" value={formData.modalidad || ''} onChange={e => setFormData({...formData, modalidad: e.target.value.toUpperCase()})} />
                                 </div>
                                 <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-primary pl-1">6. Valle</Label>
                                    <Select value={formData.valle} onValueChange={(val) => setFormData({...formData, valle: val})}>
                                       <SelectTrigger className="h-11 font-black uppercase text-[10px] bg-white rounded-xl"><SelectValue /></SelectTrigger>
                                       <SelectContent className="rounded-xl"><SelectItem value="MEXICO" className="text-[10px]">MÉXICO</SelectItem><SelectItem value="TOLUCA" className="text-[10px]">TOLUCA</SelectItem></SelectContent>
                                    </Select>
                                 </div>
                               </div>
                            </div>
                         </div>
                      ) : (
                        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-primary/10 space-y-6 shadow-inner max-w-6xl mx-auto">
                          <Label className="text-[11px] font-black uppercase text-primary tracking-widest block pl-1">Identificación del Plantel</Label>
                          <div className="relative">
                            <Input placeholder="INGRESAR CCT O NOMBRE DEL PLANTEL..." className="h-16 rounded-2xl bg-white border-primary/20 font-black text-xl uppercase shadow-lg pl-6" value={dialogSearchTerm} onChange={(e) => setDialogSearchTerm(e.target.value)} />
                            {dialogSearchTerm.length > 2 && (
                              <div className="absolute top-18 left-0 right-0 max-h-60 overflow-auto bg-white border rounded-2xl shadow-2xl z-50 divide-y">
                                {schoolSearchResults.map(s => (
                                  <div key={`sede-res-${s.cct}-${s.turno}`} className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center group transition-all" onClick={() => { handleCctChange(s.cct); setDialogSearchTerm(''); }}>
                                    <div className="flex flex-col min-w-0"><span className="text-xs font-black uppercase truncate group-hover:text-primary transition-colors">{s.nombre}</span><span className="text-[10px] font-mono text-muted-foreground">{s.cct} • {s.municipio}</span></div>
                                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-all" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {formData.cct && (
                            <div className="flex items-center gap-6 p-6 bg-white rounded-[2rem] border-2 border-emerald-100 shadow-sm animate-in zoom-in-95">
                              <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><School className="h-10 w-10" /></div>
                              <div className="min-w-0"><h4 className="text-xl font-black uppercase truncate leading-tight text-slate-800">{formData.schoolName}</h4><p className="text-[11px] font-mono font-bold text-emerald-700 tracking-widest mt-1">CCT OFICIAL: {formData.cct}</p></div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                        {activeTab === 'Biblioteca Digital' && (
                          <>
                            <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-6 shadow-inner border border-slate-100">
                                <h3 className="text-xs font-black uppercase text-primary border-b border-primary/10 pb-3 tracking-widest">Fases Técnicas de Implementación</h3>
                                <div className="space-y-3">
                                  {[
                                    { id: 'fase1', label: 'FASE 1: DIAGNÓSTICO INTEGRAL' },
                                    { id: 'fase2', label: 'FASE 2: CONECTIVIDAD Y RED' },
                                    { id: 'fase3', label: 'FASE 3: MOBILIARIO Y ESPACIO' },
                                    { id: 'fase4', label: 'FASE 4: INSTALACIÓN HARDWARE' },
                                    { id: 'fase5', label: 'FASE 5: CAPACITACIÓN SETES' },
                                    { id: 'fase6', label: 'FASE 6: OPERACIÓN ESCOLAR' },
                                    { id: 'fase7', label: 'FASE 7: AUDITORÍA COEES' },
                                  ].map(fase => (
                                    <div key={fase.id} className={cn("flex items-center gap-4 p-3 rounded-2xl border transition-all cursor-pointer group", formData.bibliotecaFases?.[fase.id as keyof typeof formData.bibliotecaFases] ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-100 hover:border-primary/20")} onClick={() => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases, [fase.id]: !formData.bibliotecaFases?.[fase.id as keyof typeof formData.bibliotecaFases]} as any})}>
                                      <Checkbox id={fase.id} checked={formData.bibliotecaFases?.[fase.id as keyof typeof formData.bibliotecaFases] as boolean} onCheckedChange={(val) => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases, [fase.id]: !!val} as any})} className="h-6 w-6 rounded-lg border-primary data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-600" />
                                      <Label htmlFor={fase.id} className="text-[10px] font-black uppercase cursor-pointer group-hover:text-primary transition-colors">{fase.label}</Label>
                                    </div>
                                  ))}
                                </div>
                            </div>
                            <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-8 shadow-inner border border-slate-100">
                                <h3 className="text-xs font-black uppercase text-primary border-b border-primary/10 pb-3 tracking-widest">Métricas y Estadística</h3>
                                <div className="grid grid-cols-1 gap-6">
                                  <div className="space-y-2 bg-white p-6 rounded-[2rem] border shadow-sm"><Label className="text-[10px] font-black text-slate-400 uppercase pl-1">Equipos Habilitados</Label><Input type="number" className="h-14 text-center font-black text-3xl border-none bg-slate-50 shadow-inner" value={formData.bibliotecaFases?.equiposHabilitados} onChange={e => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases, equiposHabilitados: parseInt(e.target.value) || 0} as any})} /></div>
                                  <div className="space-y-2 bg-white p-6 rounded-[2rem] border shadow-sm"><Label className="text-[10px] font-black text-slate-400 uppercase pl-1">Personal Capacitado (SETES)</Label><Input type="number" className="h-14 text-center font-black text-3xl border-none bg-slate-50 shadow-inner" value={formData.bibliotecaFases?.personalCapacitado} onChange={e => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases, personalCapacitado: parseInt(e.target.value) || 0} as any})} /></div>
                                </div>
                                <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 flex items-center justify-between"><span className="text-[11px] font-black uppercase text-primary">Avance del Proyecto</span><Badge className="text-xl font-black h-12 w-24 flex items-center justify-center rounded-xl bg-primary text-white">{formData.progress}%</Badge></div>
                            </div>

                            <div className="md:col-span-2 space-y-6 pt-6 border-t-2 border-primary/5 max-w-6xl mx-auto w-full">
                                <h3 className="text-sm font-black uppercase text-primary tracking-wider flex items-center gap-2">
                                  <Archive className="h-5 w-5" /> Evidencia Digital (PDF e imágenes PNG)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="p-6 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3 relative group transition-all hover:border-primary/30">
                                    {formData.reportPdf ? (
                                      <div className="flex flex-col items-center gap-3">
                                        <div className="h-14 w-14 rounded-2xl bg-white shadow-xl flex items-center justify-center text-emerald-600">
                                          <FileText className="h-8 w-8" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-emerald-700">REPORTE CARGADO</p>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="absolute top-4 right-4 h-8 w-8 text-rose-500 rounded-full hover:bg-rose-50" 
                                          onClick={() => setFormData(prev => ({...prev, reportPdf: ''}))}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <>
                                        <Upload className="h-8 w-8 text-slate-300 group-hover:text-primary transition-colors" />
                                        <p className="text-[10px] font-black uppercase text-slate-700">Subir Formato PDF (Máx 2.0MB)</p>
                                        <Button variant="outline" size="sm" onClick={() => pdfInputRef.current?.click()} className="h-9 px-6 rounded-xl text-[9px] font-black uppercase border-primary/20 hover:bg-primary/5">Seleccionar</Button>
                                      </>
                                    )}
                                    <input type="file" accept=".pdf" className="hidden" ref={pdfInputRef} onChange={(e) => handleFileChange(e, 'pdf')} />
                                  </div>
                                  <div className="p-6 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3 relative transition-all hover:border-primary/30">
                                    <ImageIcon className="h-8 w-8 text-slate-300" />
                                    <p className="text-[10px] font-black uppercase text-slate-700">Adjuntar Imágenes PNG (Máx 2.0MB)</p>
                                    <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} className="h-9 px-6 rounded-xl text-[9px] font-black uppercase border-primary/20 hover:bg-primary/5">Añadir Imagen</Button>
                                    <input type="file" accept=".png,.jpg,.jpeg" className="hidden" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} />
                                    
                                    {formData.evidencePhotos && formData.evidencePhotos.length > 0 && (
                                      <div className="grid grid-cols-4 gap-3 mt-4 w-full">
                                        {formData.evidencePhotos.map((img, idx) => (
                                          <div key={`ev-img-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-white shadow-md group">
                                            <Image src={img} alt={`Evidencia ${idx}`} fill className="object-cover" />
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); removeImage(idx); }} 
                                              className="absolute top-1 right-1 h-5 w-5 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                              <X className="h-3 w-3" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                            </div>
                          </>
                        )}

                        {activeTab === 'Geoposición' && (
                          <div className="md:col-span-2 p-8 bg-slate-50 rounded-[2.5rem] space-y-6 shadow-inner border border-slate-100">
                             <h3 className="text-xs font-black uppercase text-primary border-b border-primary/10 pb-3 tracking-widest">Coordenadas de Ubicación</h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-2"><Label className="text-[10px] font-black uppercase pl-1">Latitud</Label><Input placeholder="19.000000" className="h-14 font-mono font-black text-xl rounded-2xl bg-white shadow-sm" value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} /></div>
                                <div className="space-y-2"><Label className="text-[10px] font-black uppercase pl-1">Longitud</Label><Input placeholder="-99.000000" className="h-14 font-mono font-black text-xl rounded-2xl bg-white shadow-sm" value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} /></div>
                             </div>
                          </div>
                        )}

                        {(activeTab === 'Conoce mi Escuela' || activeTab === 'ATRES') && (
                          <div className="md:col-span-2 p-8 bg-slate-50 rounded-[2.5rem] space-y-6 shadow-inner border border-slate-100">
                             <div className="space-y-2"><Label className="text-[10px] font-black uppercase pl-1">Estatus de Operación</Label><Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val})}><SelectTrigger className="h-12 font-black uppercase text-[11px] bg-white rounded-xl shadow-sm"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="activo" className="text-[11px] font-black text-emerald-600">ACTIVO</SelectItem><SelectItem value="planeacion" className="text-[11px] font-black text-amber-600">EN PLANEACIÓN</SelectItem><SelectItem value="concluido" className="text-[11px] font-black text-primary">CONCLUIDO</SelectItem></SelectContent></Select></div>
                             <div className="space-y-2"><Label className="text-[10px] font-black uppercase pl-1">Observaciones Operativas</Label><Textarea placeholder="DETALLES TÉCNICOS Y ADMINISTRATIVOS..." className="min-h-[160px] rounded-[1.5rem] p-6 text-[12px] font-semibold bg-white shadow-sm resize-none" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value.toUpperCase()})} /></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                {showAssistantsTab && (
                   <TabsContent value="asistentes" className="h-full m-0 p-0 flex flex-col overflow-hidden">
                      <div className="p-6 bg-slate-50 border-b flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 shadow-sm">
                         <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Users className="h-6 w-6" /></div>
                           <p className="text-sm font-black uppercase text-primary tracking-widest">LISTA DE PARTICIPANTES (SETES)</p>
                         </div>
                         <Button onClick={handleAddAssistantRow} className="btn-institutional h-12 px-10 text-[11px] shadow-xl"><Plus className="h-5 w-5 mr-2" /> AÑADIR SERVIDOR</Button>
                      </div>
                      <div className="flex-1 overflow-x-auto">
                        <div className="p-8" style={{ width: '1800px' }}>
                           <Table className="w-full border-separate border-spacing-y-2">
                              <TableHeader className="bg-slate-100/50 sticky top-0 z-20">
                                <TableRow className="h-12 border-none">
                                  <TableHead className="w-[60px] text-[10px] font-black uppercase text-center rounded-l-xl">#</TableHead>
                                  <TableHead className="w-[400px] text-[10px] font-black uppercase">Apellidos y Nombre(s)</TableHead>
                                  <TableHead className="w-[180px] text-[10px] font-black uppercase">RFC Oficial</TableHead>
                                  <TableHead className="w-[220px] text-[10px] font-black uppercase">CURP Oficial</TableHead>
                                  <TableHead className="w-[200px] text-[10px] font-black uppercase">Función</TableHead>
                                  <TableHead className="w-[180px] text-[10px] font-black uppercase text-center">CCT Adscripción</TableHead>
                                  <TableHead className="w-[250px] text-[10px] font-black uppercase">Plantel (Base Maestra)</TableHead>
                                  <TableHead className="w-[140px] text-[10px] font-black uppercase text-center">Sector</TableHead>
                                  <TableHead className="w-[300px] text-[10px] font-black uppercase">Email Institucional</TableHead>
                                  <TableHead className="w-[80px] rounded-r-xl"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {assistants.map((ast, idx) => (
                                <TableRow key={`ast-${idx}`} className="h-24 hover:bg-slate-50 transition-all border-none group bg-white shadow-sm rounded-xl overflow-hidden">
                                   <TableCell className="text-center font-black text-sm text-slate-300 rounded-l-xl">{idx+1}</TableCell>
                                   <TableCell className="p-2">
                                     <div className="grid grid-cols-1 gap-2">
                                       <Input placeholder="APELLIDOS..." className="h-10 text-[11px] uppercase font-bold border-slate-100 shadow-inner px-4 bg-slate-50/50" value={`${ast.paterno} ${ast.materno}`.trim()} onChange={e => {
                                         const parts = e.target.value.split(' ');
                                         updateAssistant(idx, 'paterno', parts[0]?.toUpperCase() || '');
                                         updateAssistant(idx, 'materno', parts.slice(1).join(' ').toUpperCase() || '');
                                       }} />
                                       <Input placeholder="NOMBRE(S)..." className="h-10 text-[12px] uppercase font-black text-primary border-primary/20 bg-primary/5 shadow-sm px-4" value={ast.nombres} onChange={e => updateAssistant(idx, 'nombres', e.target.value.toUpperCase())} />
                                     </div>
                                   </TableCell>
                                   <TableCell className="p-2">
                                     <Input placeholder="RFC (13)" className="h-12 text-sm font-mono font-black uppercase border-slate-200 bg-slate-50 text-center shadow-inner" value={ast.rfc} onChange={e => updateAssistant(idx, 'rfc', e.target.value.toUpperCase())} maxLength={13} />
                                   </TableCell>
                                   <TableCell className="p-2">
                                     <Input placeholder="CURP (18)" className="h-12 text-sm font-mono font-bold uppercase border-slate-200 bg-slate-50 text-center shadow-inner" value={ast.curp} onChange={e => updateAssistant(idx, 'curp', e.target.value.toUpperCase())} maxLength={18} />
                                   </TableCell>
                                   <TableCell className="p-2">
                                     <Select value={ast.funcion} onValueChange={(val: any) => updateAssistant(idx, 'funcion', val)}>
                                       <SelectTrigger className="h-12 text-[11px] font-black uppercase border-slate-200 bg-white shadow-sm px-4"><SelectValue placeholder="ELEGIR..." /></SelectTrigger>
                                       <SelectContent className="rounded-xl shadow-2xl">{FUNCIONES.map(f => (<SelectItem key={f} value={f} className="text-[11px] font-black uppercase">{f}</SelectItem>))}</SelectContent>
                                     </Select>
                                   </TableCell>
                                   <TableCell className="p-2">
                                      <Input placeholder="CCT..." className="h-12 text-sm font-mono font-black uppercase border-primary/20 bg-white text-center shadow-sm" value={ast.cct} onChange={e => updateAssistant(idx, 'cct', e.target.value.toUpperCase())} maxLength={10} />
                                   </TableCell>
                                   <TableCell className="p-2">
                                      <div className="flex flex-col gap-1 min-w-0">
                                         <Input value={ast.nombreCT} readOnly className="h-9 text-[10px] bg-slate-100 border-none font-black text-slate-600 truncate" />
                                         <span className="text-[7px] font-black uppercase text-slate-400 pl-1">{ast.municipio || 'UBICACIÓN'}</span>
                                      </div>
                                   </TableCell>
                                   <TableCell className="p-2 text-center">
                                      <Input value={ast.sector} readOnly className="h-12 text-center text-sm bg-slate-100 border-none font-black text-slate-600 rounded-xl" />
                                   </TableCell>
                                   <TableCell className="p-2">
                                      <div className="relative group/mail">
                                        <Input placeholder="usuario@desysa.edu.mx" className="h-12 pl-12 text-sm font-bold border-slate-200 bg-white rounded-xl shadow-sm" value={ast.email} onChange={e => updateAssistant(idx, 'email', e.target.value.toLowerCase())} />
                                        <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-300 group-focus-within/mail:text-primary transition-colors" />
                                      </div>
                                   </TableCell>
                                   <TableCell className="p-2 text-right rounded-r-xl">
                                     <Button variant="ghost" size="icon" className="h-12 w-12 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all" onClick={() => handleRemoveAssistantRow(idx)} disabled={assistants.length === 1}>
                                       <Trash2 className="h-6 w-6" />
                                     </Button>
                                   </TableCell>
                                </TableRow>
                                ))}</TableBody>
                           </Table>
                        </div>
                      </div>
                   </TabsContent>
                )}
             </div>
          </Tabs>

          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-6 shrink-0 shadow-inner">
             <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-14 px-10 rounded-2xl font-black text-[11px] uppercase text-slate-400 hover:text-primary transition-all">CANCELAR</Button>
             <Button onClick={handleSave} className="btn-institutional h-14 px-16 text-[11px] gap-3 rounded-2xl shadow-2xl"><Save className="h-6 w-6" /> GUARDAR REGISTRO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="w-[95vw] lg:max-w-[800px] h-[85vh] rounded-[2rem] p-0 overflow-hidden flex flex-col bg-white">
           <DialogHeader className="p-6 bg-slate-50 border-b shrink-0"><DialogTitle className="uppercase font-black text-lg">Informe de Implementación</DialogTitle></DialogHeader>
           <ScrollArea className="flex-1 p-6">
              {selectedReport && (
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border"><div className="space-y-1"><p className="text-[8px] font-black text-slate-400 uppercase">Plantel</p><h4 className="text-xs font-black uppercase truncate">{selectedReport.schoolName}</h4></div><div className="space-y-1"><p className="text-[8px] font-black text-slate-400 uppercase">CCT</p><p className="text-xs font-mono font-black">{selectedReport.cct}</p></div></div>
                   <div className="flex items-center gap-6 p-6 bg-primary/5 rounded-[1.5rem] border border-primary/10">
                      <div className="flex flex-col items-center"><span className="text-2xl font-black text-primary">{selectedReport.progress}%</span><span className="text-[7px] font-black uppercase text-slate-400">AVANCE</span></div>
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['fase1','fase2','fase3','fase4','fase5','fase6','fase7'].map((f, i) => (<div key={i} className={cn("h-6 flex items-center justify-center rounded-lg border text-[7px] font-black uppercase", selectedReport.bibliotecaFases?.[f as keyof typeof selectedReport.bibliotecaFases] ? "bg-emerald-500 text-white border-emerald-600" : "bg-white text-slate-300 border-slate-100 opacity-50")}>F{i+1}</div>))}
                      </div>
                   </div>
                </div>
              )}
           </ScrollArea>
           <DialogFooter className="p-4 bg-slate-50 border-t shrink-0"><Button variant="ghost" onClick={() => setIsReportDialogOpen(false)} className="w-full text-[10px] font-black">CERRAR</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
