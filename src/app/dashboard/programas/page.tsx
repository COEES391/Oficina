'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
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
import { 
  PlusCircle, 
  Pencil, 
  Activity,
  Search,
  School,
  Headset,
  CheckCircle2,
  Users,
  Plus,
  FileBox,
  Save,
  Archive,
  FileText,
  X,
  ShieldCheck,
  UserCheck,
  Trash2,
  ChevronRight,
  Mail,
  Upload,
  ImageIcon,
  Loader2,
  MapPin,
  ClipboardCheck,
  Globe
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { HelpDeskDialog } from '@/components/HelpDeskDialog'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { type ProgramStatus } from '@/lib/planning-data'

const PROGRAM_RUBROS = [
  'Cuentas Institucionales',
  'Biblioteca Digital',
  'Geoposición',
  'Conoce mi Escuela',
  'ATRES'
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

const StatusLight = ({ status }: { status: string }) => (
  <div className="inline-flex flex-col gap-0.5 bg-slate-900 p-0.5 rounded-md shadow-lg border border-slate-700/50 w-5">
    <div className={cn("h-2 w-2 rounded-full border border-black/20 mx-auto", status === 'activo' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-emerald-900/30 grayscale")} />
    <div className={cn("h-2 w-2 rounded-full border border-black/20 mx-auto", status === 'suspendida' ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" : "bg-amber-900/30 grayscale")} />
    <div className={cn("h-2 w-2 rounded-full border border-black/20 mx-auto", status === 'inactivo' ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" : "bg-emerald-900/30 grayscale")} />
  </div>
);

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(PROGRAM_RUBROS[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isHelpDeskOpen, setIsHelpDeskOpen] = useState(false)
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogSearchTerm, setDialogSearchTerm] = useState('')
  
  const [verifySearch, setVerifySearch] = useState('')
  const [verifiedAccount, setVerifiedAccount] = useState<any>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([])

  const initialFormState: ProgramStatus = {
    name: activeTab, progress: 0, status: 'activo', date: new Date().toISOString().split('T')[0], cct: '', schoolName: '', 
    userName: '', rfc: '', email: '', emails: [''], zonaEscolar: '', sector: '', modalidad: '', municipio: '', region: '', valle: '',
    latitud: '', longitud: '', observaciones: '', evidencePhotos: [] as string[],
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
    })

    const storedSchools = JSON.parse(localStorage.getItem('schools_master_full_v21') || '[]')
    setAllSchools(storedSchools.length > 0 ? storedSchools : schoolsDirectory)

    return () => unsubscribe()
  }, [])

  const handleCctChange = (value: string) => {
    const cleanValue = value.toUpperCase()
    setFormData(prev => ({ ...prev, cct: cleanValue }))
    if (cleanValue.length === 10) {
      const match = allSchools.find(s => s.cct.toUpperCase() === cleanValue)
      if (match) {
        setFormData(prev => ({ 
          ...prev, schoolName: match.nombre, municipio: match.municipio, valle: match.valle, region: match.region, zonaEscolar: match.zonaEscolar, sector: match.sector, modalidad: match.modalidad 
        }))
      }
    }
  }

  const handleSave = async () => {
    if (!formData.cct) {
      toast({ variant: "destructive", title: "CCT obligatorio" });
      return;
    }

    const dataToSave = { 
      ...formData, 
      name: activeTab, 
      updatedAt: serverTimestamp() 
    };
    
    if (activeTab === 'Biblioteca Digital' && formData.bibliotecaFases) {
      const f = formData.bibliotecaFases;
      const phases = [f.fase1, f.fase2, f.fase3, f.fase4, f.fase5, f.fase6, f.fase7];
      dataToSave.progress = Math.round((phases.filter(v => v).length / 7) * 100);
      dataToSave.status = dataToSave.progress === 100 ? 'concluido' : 'activo';
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, 'programs', editingId), dataToSave);
      } else {
        await addDoc(collection(db, 'programs'), dataToSave);
      }
      setIsDialogOpen(false); setEditingId(null); setFormData(initialFormState);
      toast({ title: "Sincronizado", description: "El registro oficial se ha guardado en la nube." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error de conexión" });
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este registro oficial?")) return;
    try {
      await deleteDoc(doc(db, 'programs', id));
      toast({ title: "Removido" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al borrar" });
    }
  }

  const handleVerifyAccount = async () => {
    if (!verifySearch) return;
    setIsVerifying(true);
    const term = verifySearch.toUpperCase();
    const q = query(collection(db, 'programs'), where('name', '==', 'Cuentas Institucionales'));
    
    try {
      const snap = await getDocs(q);
      const allCuentas = snap.docs.map(d => d.data());
      const found = allCuentas.find((rec: any) => 
        (rec.rfc || '').toUpperCase() === term || 
        (rec.email || '').toUpperCase().includes(term) ||
        (rec.userName || '').toUpperCase().includes(term) ||
        (rec.cct || '').toUpperCase() === term ||
        (rec.emails || []).some((e: string) => e.toUpperCase().includes(term))
      );

      setVerifiedAccount(found);
      if (!found) toast({ variant: "destructive", title: "Cuenta no encontrada" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error de red" });
    } finally {
      setIsVerifying(false);
    }
  }

  const updateEmailList = (index: number, val: string) => {
    const newList = [...(formData.emails || [''])];
    newList[index] = val;
    setFormData({ ...formData, emails: newList });
  }

  const addEmailField = () => setFormData({ ...formData, emails: [...(formData.emails || []), ''] });
  const removeEmailField = (idx: number) => {
    const list = [...(formData.emails || [])];
    if (list.length > 1) {
      list.splice(idx, 1);
      setFormData({ ...formData, emails: list });
    }
  }

  const togglePhase = (phaseId: string) => {
    if (!formData.bibliotecaFases) return;
    setFormData({
      ...formData,
      bibliotecaFases: {
        ...formData.bibliotecaFases,
        [phaseId]: !((formData.bibliotecaFases as any)[phaseId])
      }
    });
  }

  const filteredRecords = records.filter(r => r.name === activeTab && (!searchTerm || (r.cct && r.cct.includes(searchTerm.toUpperCase())) || (r.schoolName && r.schoolName.includes(searchTerm.toUpperCase()))));

  const schoolSearchResults = useMemo(() => {
    if (!dialogSearchTerm || dialogSearchTerm.length < 3) return [];
    const term = dialogSearchTerm.toUpperCase();
    return allSchools.filter(s => s.cct.includes(term) || s.nombre.includes(term)).slice(0, 5);
  }, [allSchools, dialogSearchTerm]);

  if (!mounted) return null

  return (
    <div className="space-y-4 animate-in fade-in duration-700 w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-primary leading-none uppercase">Módulos Técnicos Coees</h2>
          <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Seguimiento de Programas 2026</p>
        </div>
      </div>

      <Card className="executive-card p-4 sm:p-6 bg-white border-none shadow-xl mt-4">
        <div className="grid grid-cols-12 items-end gap-6">
           <div className="col-span-12 lg:col-span-5 space-y-2 min-w-0">
              <Label className="text-[10px] font-black text-slate-400 block pl-1 uppercase">Módulo de Gestión Activo</Label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {PROGRAM_RUBROS.map(rubro => (
                  <button 
                    key={`rubro-${rubro}`} 
                    onClick={() => { setActiveTab(rubro); setSearchTerm(''); }} 
                    className={cn(
                      "px-5 h-11 text-[10px] font-bold rounded-xl transition-all border shadow-sm shrink-0 whitespace-nowrap", 
                      activeTab === rubro ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
                    )}
                  >
                    {rubro}
                  </button>
                ))}
              </div>
           </div>
           
           <div className="col-span-12 lg:col-span-2 flex justify-center pb-2">
             {activeTab === 'Cuentas Institucionales' && (
               <Button onClick={() => setIsVerifyDialogOpen(true)} className="h-12 px-6 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-[11px] gap-2 shadow-lg w-full uppercase">
                 <ShieldCheck className="h-5 w-5" /> Verificador Oficial
               </Button>
             )}
             {activeTab === 'ATRES' && (
               <Button onClick={() => setIsHelpDeskOpen(true)} className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] gap-2 shadow-lg w-full uppercase">
                 <Headset className="h-5 w-5" /> Mesa de ayuda
               </Button>
             )}
           </div>

           <div className="col-span-12 lg:col-span-5 flex items-center gap-3 pb-2">
             <div className="relative flex-1">
                <Input placeholder="Buscar CCT o Plantel..." className="h-12 rounded-xl bg-slate-50 border-primary/5 pl-10 text-sm font-bold w-full shadow-inner uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <Search className="absolute left-3.5 top-4 h-4 w-4 text-slate-300" />
             </div>
             
             <Button onClick={() => { setFormData({...initialFormState, name: activeTab}); setEditingId(null); setIsDialogOpen(true); }} className="btn-institutional h-12 px-8 rounded-xl text-[11px] font-bold shadow-xl flex-shrink-0 min-w-fit uppercase">
                <PlusCircle className="h-5 w-5 mr-2" /> Nuevo Registro
             </Button>
           </div>
        </div>
      </Card>

      <div className="executive-card p-0 shadow-2xl border-none overflow-hidden bg-white mt-4 animate-in slide-in-from-bottom-4 duration-500 w-full min-h-[400px]">
        <div className="overflow-x-auto w-full">
          <Table className="w-full">
            <TableHeader className="bg-slate-50 border-b">
               <TableRow className="h-12">
                  <TableHead className="w-12 text-[10px] font-bold pl-4 uppercase">#</TableHead>
                  <TableHead className="text-[10px] font-bold text-primary w-[110px] uppercase">CCT</TableHead>
                  <TableHead className="text-[10px] font-bold text-primary min-w-[200px] uppercase">Identificación Oficial</TableHead>
                  <TableHead className="text-[10px] font-bold text-primary w-[100px] uppercase">Estatus</TableHead>
                  <TableHead className="text-right text-[10px] font-bold pr-6 w-24 uppercase">Acción</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 opacity-30"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /><p className="text-[10px] font-black uppercase">Sincronizando con Firestore...</p></TableCell></TableRow>
              ) : filteredRecords.length > 0 ? filteredRecords.map((rec, idx) => (
                <TableRow key={rec.id || idx} className="hover:bg-slate-50 border-b border-slate-50 h-14 transition-colors">
                  <TableCell className="text-center font-bold text-[10px] text-slate-300 pl-4">{idx + 1}</TableCell>
                  <TableCell className="font-mono font-bold text-[11px] text-primary">{rec.cct}</TableCell>
                  <TableCell className="py-2 min-w-0"><div className="flex flex-col"><span className="text-[12px] font-bold text-slate-700 leading-tight truncate uppercase">{rec.schoolName || rec.userName}</span><span className="text-[9px] font-bold text-muted-foreground opacity-70 truncate uppercase">{rec.municipio} • {rec.valle}</span></div></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Badge variant="outline" className={cn("text-[8px] font-bold px-2 h-5 rounded-full border-2 uppercase", 
                         rec.status === 'activo' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                         rec.status === 'inactivo' ? "bg-rose-50 text-rose-700 border-rose-200" : 
                         "bg-amber-50 text-amber-700 border-amber-200"
                       )}>
                        {rec.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setFormData({...rec, emails: rec.emails || [rec.email || '']}); setEditingId(rec.id!); setIsDialogOpen(true); }} className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(rec.id!)} className="h-8 w-8 flex items-center justify-center text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (<TableRow><TableCell colSpan={5} className="text-center py-20 opacity-30 text-xs font-bold uppercase">Sin registros en la base de datos oficial</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </div>
      </div>

      <HelpDeskDialog open={isHelpDeskOpen} onOpenChange={setIsHelpDeskOpen} />

      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[500px] rounded-[2rem] p-0 overflow-hidden bg-white shadow-2xl border-none">
          <DialogHeader className="p-6 bg-primary text-white">
             <DialogTitle className="font-black text-lg flex items-center gap-3 uppercase"><ShieldCheck className="h-6 w-6" /> Verificador Oficial Coees</DialogTitle>
             <DialogDescription className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Validación en tiempo real de cuentas institucionales</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 pl-1 uppercase">Ingresar RFC, CCT o Correo Institucional</Label>
              <div className="flex gap-2">
                <Input placeholder="ESCRIBIR DATO..." className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold text-center uppercase" value={verifySearch} onChange={e => setVerifySearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleVerifyAccount()} />
                <Button onClick={handleVerifyAccount} disabled={isVerifying || !verifySearch} className="h-12 w-12 rounded-xl bg-accent shadow-lg p-0 transition-transform active:scale-95"><Search className={cn("h-5 w-5", isVerifying && "animate-spin")} /></Button>
              </div>
            </div>
            {verifiedAccount ? (
              <div className="p-5 rounded-[1.5rem] bg-slate-900 text-white shadow-2xl animate-in zoom-in-95">
                <div className="flex items-center gap-3 border-b border-white/10 pb-3 mb-3">
                   <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center"><UserCheck className="h-5 w-5 text-accent" /></div>
                   <div className="min-w-0"><h4 className="text-[11px] font-bold leading-none truncate uppercase">{verifiedAccount.userName}</h4><p className="text-[9px] font-bold text-white/50 mt-1 uppercase">{verifiedAccount.cct} • RFC: {verifiedAccount.rfc || 'S/R'}</p></div>
                </div>
                <div className="space-y-4">
                   <p className="text-[8px] font-bold text-white/40 leading-none uppercase tracking-widest">Cuentas vinculadas</p>
                   <div className="space-y-3">
                      {(verifiedAccount.emails || [verifiedAccount.email]).map((em: string, i: number) => (
                        <div key={i} className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10 animate-in slide-in-from-left-2" style={{ animationDelay: `${i * 100}ms` }}>
                           <StatusLight status={verifiedAccount.status} />
                           <p className="text-[10px] font-mono font-bold text-accent truncate flex-1">{em || 'SIN CORREO ASIGNADO'}</p>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            ) : (<div className="p-8 border-2 border-dashed border-slate-100 rounded-[2rem] text-center opacity-20"><p className="text-[11px] font-bold tracking-widest uppercase">Sistema de Auditoría Centralizado</p></div>)}
          </div>
          <DialogFooter className="p-4 bg-slate-50 border-t"><Button variant="ghost" onClick={() => { setIsVerifyDialogOpen(false); setVerifiedAccount(null); setVerifySearch(''); }} className="w-full h-11 font-bold text-xs uppercase">Cerrar Consulta</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) { setFormData(initialFormState); setEditingId(null); } }}>
        <DialogContent className="w-[98vw] lg:max-w-[1400px] h-[95vh] rounded-[2.5rem] p-0 overflow-hidden bg-white flex flex-col border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white shrink-0 flex flex-row justify-between items-center pr-10">
             <DialogTitle className="font-black text-lg uppercase">Sincronización Oficial: {activeTab}</DialogTitle>
             <div className="flex items-center gap-3 bg-white/10 p-2 rounded-xl border border-white/20">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                   <SelectTrigger className="h-8 w-32 bg-transparent border-none text-white font-bold text-[10px] uppercase"><SelectValue /></SelectTrigger>
                   <SelectContent className="rounded-xl border-none shadow-2xl"><SelectItem value="activo" className="font-bold text-[10px] text-emerald-600">Activo</SelectItem><SelectItem value="suspendida" className="font-bold text-[10px] text-amber-600">Suspendida</SelectItem><SelectItem value="inactivo" className="font-bold text-[10px] text-rose-600">Inactivo</SelectItem></SelectContent>
                </Select>
             </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-10 space-y-10 max-w-6xl mx-auto">
                 <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-primary/10 space-y-6 shadow-inner">
                    <Label className="text-[11px] font-black text-primary tracking-widest block pl-1 uppercase">Captura de Datos Institucionales</Label>
                    <div className="relative">
                      <Input placeholder="Buscar CCT o nombre del plantel..." className="h-16 rounded-2xl bg-white border-primary/20 font-bold text-xl uppercase shadow-lg pl-6" value={dialogSearchTerm} onChange={(e) => setDialogSearchTerm(e.target.value)} />
                      {dialogSearchTerm.length > 2 && (
                        <div className="absolute top-18 left-0 right-0 max-h-60 overflow-auto bg-white border rounded-2xl shadow-2xl z-50 divide-y">
                          {schoolSearchResults.map((s, sidx) => (
                            <div key={`sede-res-${s.cct}-${sidx}`} className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center group transition-all" onClick={() => { handleCctChange(s.cct); setDialogSearchTerm(''); }}>
                              <div className="flex flex-col min-w-0"><span className="text-sm font-bold uppercase truncate group-hover:text-primary transition-colors">{s.nombre}</span><span className="text-[10px] font-mono text-muted-foreground">{s.cct} • {s.municipio}</span></div>
                              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-all" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {formData.cct && (
                      <div className="flex items-center gap-6 p-6 bg-white rounded-[2rem] border-2 border-emerald-100 shadow-sm animate-in zoom-in-95">
                        <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><School className="h-10 w-10" /></div>
                        <div className="min-w-0"><h4 className="text-xl font-bold uppercase truncate leading-tight text-slate-800">{formData.schoolName}</h4><p className="text-[11px] font-mono font-bold text-emerald-700 tracking-widest mt-1 uppercase">Folio de auditoría: {formData.cct}</p></div>
                      </div>
                    )}
                 </div>

                 {activeTab === 'Cuentas Institucionales' && (
                   <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 space-y-8 animate-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-3 border-b pb-2"><ShieldCheck className="h-5 w-5 text-accent" /><h4 className="text-xs font-black uppercase text-accent tracking-widest">Credenciales y Responsable</h4></div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         <div className="space-y-2"><Label className="text-[10px] font-black text-primary pl-1 uppercase">RFC del Responsable</Label><Input className="h-12 font-mono font-black bg-slate-50 border-slate-200 rounded-xl shadow-inner uppercase" value={formData.rfc || ''} onChange={e => setFormData({...formData, rfc: e.target.value.toUpperCase()})} maxLength={13} /></div>
                         <div className="md:col-span-2 space-y-2"><Label className="text-[10px] font-black text-primary pl-1 uppercase">Servidor Público Responsable</Label><Input className="h-12 font-bold bg-slate-50 border-slate-200 rounded-xl shadow-inner uppercase" value={formData.userName || ''} onChange={e => setFormData({...formData, userName: e.target.value.toUpperCase()})} /></div>
                      </div>
                      <div className="space-y-6">
                         <div className="flex items-center justify-between border-b pb-2"><div className="flex items-center gap-3"><Mail className="h-5 w-5 text-accent" /><h4 className="text-xs font-black uppercase text-accent tracking-widest">Emails (@desysa.edu.mx)</h4></div><Button type="button" variant="outline" size="sm" onClick={addEmailField} className="h-8 rounded-lg border-primary/20 text-primary font-bold text-[10px] gap-2"><Plus className="h-3 w-3" /> Añadir Otro</Button></div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {(formData.emails || ['']).map((email, idx) => (
                             <div key={`email-${idx}`} className="flex gap-2 animate-in fade-in slide-in-from-left-2">
                               <Input className="h-11 font-bold bg-slate-50 border-slate-200 rounded-xl lowercase" value={email} onChange={e => updateEmailList(idx, e.target.value.toLowerCase())} placeholder="ejemplo@desysa.edu.mx" />
                               {idx > 0 && <Button variant="ghost" size="icon" onClick={() => removeEmailField(idx)} className="h-11 w-11 text-rose-300 hover:text-rose-600 rounded-xl"><Trash2 className="h-4 w-4" /></Button>}
                             </div>
                           ))}
                         </div>
                      </div>
                   </div>
                 )}

                 {activeTab === 'Biblioteca Digital' && (
                   <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 space-y-8 animate-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-3 border-b pb-2"><ClipboardCheck className="h-5 w-5 text-accent" /><h4 className="text-xs font-black uppercase text-accent tracking-widest">Seguimiento Técnico de Fases</h4></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 bg-slate-50 p-8 rounded-[2rem] border">
                        {BIBLIOTECA_FASES_LABELS.map((fase) => (
                          <div key={fase.id} className="flex items-center space-x-3 group cursor-pointer" onClick={() => togglePhase(fase.id)}>
                            <Checkbox id={fase.id} checked={(formData.bibliotecaFases as any)?.[fase.id]} onCheckedChange={() => togglePhase(fase.id)} className="h-6 w-6 border-primary/30" />
                            <Label htmlFor={fase.id} className="text-sm font-bold text-slate-600 uppercase group-hover:text-primary transition-colors cursor-pointer">{fase.label}</Label>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-2"><Label className="text-[10px] font-black text-primary uppercase">Personal Capacitado</Label><Input type="number" className="h-12 font-black text-center bg-slate-50 border-slate-200 rounded-xl" value={formData.bibliotecaFases?.personalCapacitado} onChange={e => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, personalCapacitado: parseInt(e.target.value) || 0}})} /></div>
                         <div className="space-y-2"><Label className="text-[10px] font-black text-primary uppercase">Equipos Habilitados</Label><Input type="number" className="h-12 font-black text-center bg-slate-50 border-slate-200 rounded-xl" value={formData.bibliotecaFases?.equiposHabilitados} onChange={e => setFormData({...formData, bibliotecaFases: {...formData.bibliotecaFases!, equiposHabilitados: parseInt(e.target.value) || 0}})} /></div>
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
                    <Label className="text-[10px] font-black text-primary pl-1 uppercase">Observaciones de Auditoría</Label>
                    <Textarea className="min-h-[140px] bg-white border-slate-200 rounded-[1.5rem] p-6 text-sm font-semibold shadow-sm focus:ring-4 focus:ring-primary/5 transition-all uppercase" value={formData.observaciones || ''} onChange={e => setFormData({...formData, observaciones: e.target.value.toUpperCase()})} placeholder="DETALLES TÉCNICOS ADICIONALES..." />
                 </div>
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-6 shrink-0">
             <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-14 px-10 rounded-2xl font-bold text-[11px] text-slate-400 hover:text-primary transition-all uppercase">Cancelar</Button>
             <Button onClick={handleSave} className="btn-institutional h-14 px-16 text-xs gap-3 rounded-2xl shadow-2xl uppercase"><Save className="h-6 w-6" /> Sincronizar en la Nube</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
