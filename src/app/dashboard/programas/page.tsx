
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
  type ProgramStatus, 
  type BitacoraEntry
} from "@/lib/planning-data"
import { schoolsDirectory, type SchoolInfo } from "@/lib/schools-directory"
import { cn } from "@/lib/utils"
import Image from 'next/image'
import { 
  PlusCircle, 
  Pencil, 
  Activity,
  Target,
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
  Monitor,
  Upload,
  ImageIcon,
  Eye,
  Printer,
  Archive,
  Link as LinkIcon,
  FileText,
  X,
  ShieldCheck,
  MailCheck,
  Key,
  AlertCircle,
  UserCheck,
  Smartphone,
  Trash2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { HelpDeskDialog } from '@/components/HelpDeskDialog'
import { format } from 'date-fns'

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

const TrafficLight = ({ status }: { status: BitacoraEntry['status'] }) => {
  return (
    <div className="inline-flex flex-col gap-0.5 bg-slate-900 p-0.5 rounded-md shadow-lg border border-slate-700/50 w-5">
      <div className={cn("h-2 w-2 rounded-full border border-black/20 mx-auto", status === 'pendiente' ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" : "bg-rose-900/30 grayscale")} />
      <div className={cn("h-2 w-2 rounded-full border border-black/20 mx-auto", status === 'proceso' ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" : "bg-amber-900/30 grayscale")} />
      <div className={cn("h-2 w-2 rounded-full border border-black/20 mx-auto", status === 'atendido' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-emerald-900/30 grayscale")} />
    </div>
  );
}

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [bitacoraRecords, setBitacoraRecords] = useState<BitacoraEntry[]>([])
  const [activeTab, setActiveTab] = useState(PROGRAM_RUBROS[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isHelpDeskOpen, setIsHelpDeskOpen] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogSearchTerm, setDialogSearchTerm] = useState('')
  
  // Verificación de Cuentas
  const [verifySearch, setVerifySearch] = useState('')
  const [verifiedAccount, setVerifiedAccount] = useState<any>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const pdfInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  
  const [evidenceToView, setEvidenceToView] = useState<{ 
    pdfData?: string, 
    images?: string[], 
    title: string 
  } | null>(null)

  const [selectedReport, setSelectedReport] = useState<ProgramStatus | null>(null)
  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([])

  const initialFormState: ProgramStatus = {
    id: '', name: '', progress: 0, status: 'activo', date: new Date().toISOString().split('T')[0], cct: '', schoolName: '', 
    zonaEscolar: '', sector: '', modalidad: '', municipio: '', region: '', valle: '',
    asistentes: [],
    bibliotecaFases: {
      fase1: false, fase2: false, fase3: false, fase4: false, fase4_1: false, fase4_2: false,
      fase5: false, fase6: false, fase7: false, fase7_1: false, personalCapacitado: 0, equiposHabilitados: 0
    }
  }

  const [formData, setFormData] = useState<ProgramStatus>(initialFormState)

  const syncData = useCallback(() => {
    const storedV24 = localStorage.getItem('programs_full_v24')
    setRecords(storedV24 ? JSON.parse(storedV24) : programsData)
    const storedBitacora = localStorage.getItem('atres_bitacora')
    setBitacoraRecords(storedBitacora ? JSON.parse(storedBitacora) : [])
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
      }
    }
  }

  const handleSave = () => {
    const recordToSave = { ...formData };
    if (activeTab === 'Biblioteca Digital' && formData.bibliotecaFases) {
      const f = formData.bibliotecaFases;
      const phases = [f.fase1, f.fase2, f.fase3, f.fase4, f.fase5, f.fase6, f.fase7];
      recordToSave.progress = Math.round((phases.filter(v => v).length / 7) * 100);
      recordToSave.status = recordToSave.progress === 100 ? 'concluido' : 'activo';
    }
    const updated = editingId ? records.map(r => r.id === editingId ? recordToSave : r) : [{...recordToSave, id: `SOL-${Date.now()}`}, ...records];
    localStorage.setItem('programs_full_v24', JSON.stringify(updated))
    setRecords(updated); setIsDialogOpen(false); setEditingId(null); setFormData(initialFormState);
    toast({ title: "Registro exitoso" })
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
    
    // Simulación de búsqueda en base de datos de cuentas
    setTimeout(() => {
      const term = verifySearch.toUpperCase();
      const accounts = records.filter(r => r.name === 'Cuentas Institucionales');
      
      // Buscamos en los asistentes de los registros de cuentas
      let found = null;
      for (const rec of accounts) {
        const assistant = rec.asistentes?.find(a => 
          (a.rfc || '').toUpperCase() === term || 
          (a.curp || '').toUpperCase() === term ||
          (a.email || '').toUpperCase().includes(term)
        );
        if (assistant) {
          found = {
            ...assistant,
            cct: rec.cct,
            schoolName: rec.schoolName,
            status: rec.status,
            date: rec.date
          };
          break;
        }
      }

      setVerifiedAccount(found);
      setIsVerifying(false);
      if (!found) {
        toast({ 
          variant: "destructive", 
          title: "Cuenta no localizada", 
          description: "No se encontró registro asociado a este identificador." 
        });
      }
    }, 800);
  }

  const filteredRecords = records.filter(r => r.name === activeTab && (!searchTerm || (r.cct && r.cct.includes(searchTerm.toUpperCase())) || (r.schoolName && r.schoolName.includes(searchTerm.toUpperCase()))));

  const openEvidenceViewer = (record: ProgramStatus) => {
    setEvidenceToView({
      pdfData: record.reportPdf,
      images: record.evidencePhotos || [],
      title: `Evidencia: ${record.schoolName}`
    });
  }

  const printFile = (data: string) => {
    const win = window.open();
    if (!win) return;
    win.document.write(`<iframe src="${data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
  }

  if (!mounted) return null

  return (
    <div className="space-y-4 animate-in fade-in duration-700 w-full max-w-[1550px] mx-auto overflow-hidden px-2">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-primary/5 pb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-primary uppercase leading-none">Módulos Técnicos COEES</h2>
          <div className="flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-accent" /><p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.1em]">Control de Programas y Auditoría 2026</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {activeTab === 'ATRES' && (<Button onClick={() => setIsHelpDeskOpen(true)} className="h-10 px-6 rounded-xl bg-emerald-600 font-black uppercase text-[10px] gap-2"><Headset className="h-4 w-4" /> Mesa de Ayuda ATRES</Button>)}
          <Button onClick={() => { setFormData({...initialFormState, name: activeTab}); setEditingId(null); setIsDialogOpen(true); }} className="btn-institutional h-10 px-8 rounded-xl text-[10px]"><PlusCircle className="h-4 w-4 mr-2" /> Nuevo Registro</Button>
        </div>
      </div>

      <Card className="executive-card p-4 bg-white/80 border-none shadow-lg mt-4">
        <div className="flex flex-col md:flex-row items-end gap-4">
           <div className="flex-1 w-full space-y-1">
              <Label className="text-[9px] font-black uppercase text-slate-400 mb-1 block pl-1">Seleccionar Módulo Institucional</Label>
              <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                {PROGRAM_RUBROS.map(rubro => (
                  <button key={`rubro-${rubro}`} onClick={() => { setActiveTab(rubro); setSearchTerm(''); setVerifiedAccount(null); }} className={cn("px-5 h-10 text-[10px] font-black uppercase rounded-xl transition-all border shadow-sm", activeTab === rubro ? "bg-primary text-white border-primary" : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50")}>{rubro}</button>
                ))}
              </div>
           </div>
           <div className="relative flex-1 w-full md:max-w-[300px]">
              <div className="relative"><Input placeholder="CCT, PLANTEL O USUARIO..." className="h-10 rounded-xl bg-slate-50 border-primary/5 pl-9 text-[10px] font-black uppercase w-full shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><Search className="absolute left-3 top-3 h-4 w-4 text-slate-300" /></div>
           </div>
        </div>
      </Card>

      {activeTab === 'Cuentas Institucionales' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 animate-in slide-in-from-bottom-4 duration-500">
          <Card className="lg:col-span-4 executive-card border-t-8 border-t-accent bg-white">
            <CardHeader className="bg-slate-50/50 p-6 border-b">
              <CardTitle className="text-sm font-black uppercase text-primary flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-accent" /> Verificador de Cuenta Oficial
              </CardTitle>
              <CardDescription className="text-[9px] font-bold uppercase tracking-widest">Validación de identidad digital @desysa.edu.mx</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Identificador del Servidor (RFC/CURP)</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="INGRESAR DATO..." 
                      className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-mono font-black text-center uppercase"
                      value={verifySearch}
                      onChange={e => setVerifySearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleVerifyAccount()}
                    />
                    <Button 
                      onClick={handleVerifyAccount} 
                      disabled={isVerifying || !verifySearch}
                      className="h-12 w-12 rounded-xl bg-accent hover:bg-accent/90 shadow-lg p-0"
                    >
                      <Search className={cn("h-5 w-5", isVerifying && "animate-spin")} />
                    </Button>
                  </div>
                </div>

                {verifiedAccount ? (
                  <div className="p-6 rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><MailCheck className="h-20 w-20" /></div>
                    <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-4">
                       <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                          <UserCheck className="h-6 w-6 text-accent" />
                       </div>
                       <div>
                          <h4 className="text-xs font-black uppercase leading-none">{verifiedAccount.nombres} {verifiedAccount.paterno}</h4>
                          <p className="text-[8px] font-bold text-white/50 uppercase tracking-widest mt-1">{verifiedAccount.rfc}</p>
                       </div>
                    </div>
                    
                    <div className="space-y-3">
                       <div className="space-y-1">
                          <p className="text-[7px] font-black uppercase text-white/40">Correo Institucional</p>
                          <p className="text-[10px] font-mono font-black text-accent">{verifiedAccount.email || 'SIN CORREO ASIGNADO'}</p>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-[7px] font-black uppercase text-white/40">CCT Adscripción</p>
                            <p className="text-[9px] font-black">{verifiedAccount.cct}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[7px] font-black uppercase text-white/40">Estatus Global</p>
                            <Badge className="bg-emerald-500 text-white text-[7px] font-black h-4 px-2 uppercase">{verifiedAccount.status}</Badge>
                          </div>
                       </div>
                    </div>
                    
                    <div className="mt-6 flex gap-2">
                       <Button variant="outline" className="flex-1 h-9 bg-white/5 border-white/10 text-white font-black uppercase text-[8px] hover:bg-white/10">
                          <Key className="h-3 w-3 mr-2" /> Reset Pass
                       </Button>
                       <Button variant="outline" className="flex-1 h-9 bg-white/5 border-white/10 text-white font-black uppercase text-[8px] hover:bg-white/10">
                          <Smartphone className="h-3 w-3 mr-2" /> Vincular
                       </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                     <AlertCircle className="h-10 w-10" />
                     <p className="text-[10px] font-black uppercase tracking-widest">Ingrese un identificador para validar estatus de cuenta</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-8 space-y-4">
            <Card className="executive-card p-0 shadow-2xl border-none overflow-hidden bg-white">
              <div className="overflow-x-auto w-full">
                <Table>
                  <TableHeader className="bg-slate-50 border-b">
                    <TableRow className="h-12">
                        <TableHead className="w-10 text-[9px] font-black uppercase text-center pl-4">#</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-primary w-[110px]">CCT</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-primary min-w-[200px]">Identificación del Plantel</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-primary w-[100px]">Estatus</TableHead>
                        <TableHead className="text-right text-[9px] font-black uppercase pr-6 w-24">Acción</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.length > 0 ? filteredRecords.map((rec, idx) => (
                      <TableRow key={rec.id} className="hover:bg-slate-50 border-b border-slate-50 h-14 group">
                        <TableCell className="text-center font-black text-[10px] text-slate-300 pl-4">{idx + 1}</TableCell>
                        <TableCell className="font-black text-[10px] text-primary tracking-tight">{rec.cct}</TableCell>
                        <TableCell className="py-2"><div className="flex flex-col min-w-0"><span className="text-[10px] font-black text-slate-700 uppercase leading-tight truncate max-w-[180px]">{rec.schoolName}</span><span className="text-[8px] font-bold text-muted-foreground uppercase opacity-70 truncate max-w-[180px]">{rec.municipio}</span></div></TableCell>
                        <TableCell><Badge variant="outline" className={cn("text-[8px] font-black uppercase", rec.status === 'concluido' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{rec.status}</Badge></TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => { setFormData({...rec}); setEditingId(rec.id!); setIsDialogOpen(true); }} className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => handleDelete(rec.id!)} className="h-7 w-7 flex items-center justify-center text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (<TableRow><TableCell colSpan={5} className="text-center py-24 opacity-30 text-xs font-black uppercase">Sin registros</TableCell></TableRow>)}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab !== 'Cuentas Institucionales' && (
        <Card className="executive-card p-0 shadow-2xl border-none overflow-hidden bg-white mt-4">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader className="bg-slate-50 border-b">
                 <TableRow className="h-12">
                    <TableHead className="w-10 text-[9px] font-black uppercase text-center pl-4">#</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-primary w-[110px]">CCT</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-primary min-w-[200px]">Identificación del Plantel</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-primary w-[100px]">Estatus</TableHead>
                    <TableHead className="text-right text-[9px] font-black uppercase pr-6 w-24">Acción</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length > 0 ? filteredRecords.map((rec, idx) => (
                  <TableRow key={rec.id} className="hover:bg-slate-50 border-b border-slate-50 h-14 group">
                    <TableCell className="text-center font-black text-[10px] text-slate-300 pl-4">{idx + 1}</TableCell>
                    <TableCell className="font-black text-[10px] text-primary tracking-tight">{rec.cct}</TableCell>
                    <TableCell className="py-2"><div className="flex flex-col min-w-0"><span className="text-[10px] font-black text-slate-700 uppercase leading-tight truncate max-w-[180px]">{rec.schoolName}</span><span className="text-[8px] font-bold text-muted-foreground uppercase opacity-70 truncate max-w-[180px]">{rec.municipio}</span></div></TableCell>
                    <TableCell><Badge variant="outline" className={cn("text-[8px] font-black uppercase", rec.status === 'concluido' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{rec.status}</Badge></TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        {activeTab === 'Biblioteca Digital' && (<button onClick={() => { setSelectedReport(rec); setIsReportDialogOpen(true); }} className="h-7 w-7 flex items-center justify-center text-accent hover:bg-accent/5 rounded-lg"><FileBox className="h-3.5 w-3.5" /></button>)}
                        <button onClick={() => { setFormData({...rec}); setEditingId(rec.id!); setIsDialogOpen(true); }} className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(rec.id!)} className="h-7 w-7 flex items-center justify-center text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (<TableRow><TableCell colSpan={5} className="text-center py-24 opacity-30 text-xs font-black uppercase">Sin registros</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-[900px] h-[95vh] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white flex flex-col">
           <DialogHeader className="p-8 bg-slate-50 border-b shrink-0 flex flex-row justify-between items-center pr-12">
              <div className="space-y-1"><div className="flex items-center gap-3"><div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white"><Layers className="h-6 w-6" /></div><DialogTitle className="uppercase font-black text-primary text-xl">Informe Ejecutivo de Implementación</DialogTitle></div><p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Biblioteca Digital • Sistema Integral COEES 2026</p></div>
           </DialogHeader>
           <ScrollArea className="flex-1">
              <div className="p-10 space-y-10">
                 <div className="space-y-4"><div className="bg-primary/5 border-l-4 border-primary px-4 py-2 inline-block"><h3 className="text-xs font-black text-primary uppercase">I. Identificación Institucional</h3></div><div className="grid grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100"><div className="space-y-3"><div><p className="text-[9px] font-black text-slate-400 uppercase">Plantel</p><h4 className="text-base font-black text-slate-800 uppercase">{selectedReport?.schoolName}</h4></div><div><p className="text-[9px] font-black text-slate-400 uppercase">CCT</p><p className="text-sm font-mono font-black text-primary">{selectedReport?.cct}</p></div></div><div className="space-y-3"><div><p className="text-[9px] font-black text-slate-400 uppercase">Ubicación</p><p className="text-sm font-black text-slate-700 uppercase">{selectedReport?.municipio} • {selectedReport?.valle}</p></div></div></div></div>
                 <div className="space-y-4">
                    <div className="bg-accent/5 border-l-4 border-accent px-4 py-2 inline-block"><h3 className="text-xs font-black text-accent uppercase">II. Estatus de Implementación</h3></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                       <div className="md:col-span-1 text-center space-y-3">
                          <div className="relative h-32 w-32 mx-auto"><div className="absolute inset-0 rounded-full border-[10px] border-slate-100 shadow-inner" /><div className="absolute inset-0 flex items-center justify-center flex-col"><span className="text-3xl font-black text-primary">{selectedReport?.progress}%</span><span className="text-[8px] font-black uppercase text-slate-400">Avance</span></div></div>
                          <Badge className={cn("px-4 py-1 rounded-full text-[10px] font-black uppercase", selectedReport?.status === 'concluido' ? 'bg-emerald-500' : 'bg-amber-500')}>{selectedReport?.status?.toUpperCase()}</Badge>
                       </div>
                       <div className="md:col-span-2"><div className="grid grid-cols-2 gap-3">
                        {[
                          { f: selectedReport?.bibliotecaFases?.fase1, l: 'F1: Diagnóstico' },
                          { f: selectedReport?.bibliotecaFases?.fase2, l: 'F2: Conectividad' },
                          { f: selectedReport?.bibliotecaFases?.fase3, l: 'F3: Mobiliario' },
                          { f: selectedReport?.bibliotecaFases?.fase4, l: 'F4: Instalación' },
                          { f: selectedReport?.bibliotecaFases?.fase5, l: 'F5: Capacitación' },
                          { f: selectedReport?.bibliotecaFases?.fase6, l: 'F6: Puesta en Marcha' },
                          { f: selectedReport?.bibliotecaFases?.fase7, l: 'F7: Auditoría' }
                        ].map((item, i) => (
                          <div key={`rep-fase-${i}`} className={cn("flex items-center gap-3 p-3 rounded-2xl border transition-all", item.f ? "bg-white border-emerald-100 shadow-sm" : "bg-slate-50 border-slate-100 opacity-40")}>
                            {item.f ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-slate-300" />}
                            <span className="text-[9px] font-black uppercase text-slate-700">{item.l}</span>
                          </div>
                        ))}
                       </div></div>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="bg-[#4a90e2]/5 border-l-4 border-[#4a90e2] px-4 py-2 inline-block"><h3 className="text-xs font-black text-[#4a90e2] uppercase">III. Equipo de Computo</h3></div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                          <div className="absolute top-0 right-0 p-6 opacity-10"><Monitor className="h-20 w-20" /></div>
                          <p className="text-[10px] font-black uppercase text-white/50 tracking-widest">Equipos Habilitados</p>
                          <h4 className="text-5xl font-black mt-2">{selectedReport?.bibliotecaFases?.equiposHabilitados || 0}</h4>
                       </div>
                       <div className="bg-white rounded-[2.5rem] p-8 border-2 border-primary/10 shadow-xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-6 opacity-5"><Users className="h-20 w-20 text-primary" /></div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Personal Capacitado</p>
                          <h4 className="text-5xl font-black mt-2 text-primary">{selectedReport?.bibliotecaFases?.personalCapacitado || 0}</h4>
                       </div>
                    </div>
                 </div>
              </div>
           </ScrollArea>
           <DialogFooter className="p-6 bg-slate-50 border-t"><Button variant="ghost" onClick={() => setIsReportDialogOpen(false)} className="h-12 px-10 font-black uppercase text-slate-400 text-xs">Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <HelpDeskDialog open={isHelpDeskOpen} onOpenChange={setIsHelpDeskOpen} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[1400px] rounded-[3rem] h-[95vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl bg-white">
          <DialogHeader className="p-8 bg-primary text-white shrink-0">
             <DialogTitle className="uppercase font-black text-white text-2xl">Gestión de {activeTab}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="datos" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-8 border-b bg-slate-50/50"><TabsList className="bg-transparent h-14 p-0 gap-8"><TabsTrigger value="datos" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase transition-all">1. Datos Técnicos</TabsTrigger><TabsTrigger value="censo" className={cn("rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase transition-all", (formData.bibliotecaFases?.personalCapacitado || 0) === 0 && activeTab === 'Biblioteca Digital' ? "hidden" : "block")}>2. Censo de Personal</TabsTrigger></TabsList></div>
            <div className="flex-1 overflow-hidden">
               <TabsContent value="datos" className="h-full m-0 p-8"><ScrollArea className="h-full space-y-10"><div className="p-8 bg-slate-50 rounded-[2.5rem] border border-primary/10 space-y-6"><Label className="text-[11px] font-black uppercase text-primary flex items-center gap-2"><Search className="h-5 w-5 text-accent" /> Identificación del Plantel</Label><Input placeholder="CCT O NOMBRE..." className="h-16 rounded-2xl bg-white border-primary/10 font-black text-lg uppercase shadow-sm" value={dialogSearchTerm} onChange={(e) => setDialogSearchTerm(e.target.value)} />{formData.cct && (<div className="flex items-center gap-6 p-6 bg-white rounded-[2rem] border-2 border-emerald-100"><div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><School className="h-9 w-9" /></div><div><h4 className="text-xl font-black uppercase text-slate-800 leading-tight">{formData.schoolName}</h4><p className="text-[11px] font-mono font-bold text-muted-foreground mt-1">{formData.cct}</p></div></div>)}</div></ScrollArea></TabsContent>
               <TabsContent value="censo" className="h-full m-0 p-8"><div className="flex-1 overflow-hidden border-2 border-slate-100 rounded-[2.5rem] bg-white shadow-2xl flex flex-col items-center justify-center opacity-30"><Users className="h-12 w-12" /><p className="text-xs font-black uppercase mt-4">Módulo de Censo en Desarrollo</p></div></TabsContent>
            </div>
          </Tabs>
          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4"><Button onClick={handleSave} className="btn-institutional h-14 px-16 text-[11px] flex items-center gap-3"><Save className="h-5 w-5" /> Guardar Registro</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!evidenceToView} onOpenChange={(open) => !open && setEvidenceToView(null)}>
        <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white shrink-0 flex flex-row justify-between items-center pr-12">
            <div className="space-y-1">
              <DialogTitle className="uppercase font-black text-white text-xl flex items-center gap-4">
                <Archive className="h-7 w-7 text-accent" /> VISOR COEES
              </DialogTitle>
            </div>
            <button onClick={() => setEvidenceToView(null)} className="text-white hover:bg-white/10 h-10 w-10 p-0 rounded-full border border-white/20 flex items-center justify-center">
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>
          <div className="flex-1 bg-slate-800 p-1">
            {evidenceToView?.pdfData ? (
              <iframe src={evidenceToView.pdfData} className="w-full h-full border-none rounded-xl bg-white" title="PDF Preview" />
            ) : (
              <div className="h-full flex items-center justify-center opacity-20">
                <FileText className="h-20 w-20" />
              </div>
            )}
          </div>
          <DialogFooter className="p-4 bg-slate-50 border-t shrink-0">
            <Button variant="ghost" onClick={() => setEvidenceToView(null)} className="h-11 px-10 font-black uppercase text-xs">Cerrar Visor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
