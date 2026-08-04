'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { programsData, type ProgramStatus } from "@/lib/planning-data"
import { schoolsDirectory } from "@/lib/schools-directory"
import { cn } from "@/lib/utils"
import Image from 'next/image'
import { 
  PlusCircle, 
  Pencil, 
  Activity,
  Target,
  Search,
  Trash2,
  Monitor,
  School,
  CalendarDays,
  Headset,
  Copy,
  ExternalLink,
  Check,
  QrCode,
  Info,
  Globe,
  Building2,
  Share2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { VisitSchedulerDialog } from '@/components/VisitSchedulerDialog'
import { HelpDeskDialog } from '@/components/HelpDeskDialog'
import { format } from 'date-fns'

const PROGRAM_RUBROS = [
  'Cuentas Institucionales',
  'Biblioteca Digital',
  'Geoposición',
  'Conoce mi Escuela',
  'ATRES'
];

const REGIONAL_OFFICES = [
  "Oficina de Tecnóloga Educativa Ecatepec",
  "Oficina de Tecnóloga Educativa Naucalpan",
  "Oficina de Tecnóloga Educativa Nezahualcóyotl",
  "Oficina de Tecnóloga Educativa Toluca",
  "Oficina de COEES Tultitlan"
];

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [activeTab, setActiveTab] = useState(PROGRAM_RUBROS[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false)
  const [isHelpDeskOpen, setIsHelpDeskOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [officeFilter, setOficinaFilter] = useState('all')
  const [dialogSearchTerm, setDialogSearchTerm] = useState('')
  const [pendingCount, setPendingRequestsCount] = useState(0)
  const [copied, setCopied] = useState(false)

  const initialFormState: ProgramStatus = {
    id: '', name: '', progress: 0, status: 'activo', date: new Date().toISOString().split('T')[0], cct: '', schoolName: '', 
    zonaEscolar: '', sector: '', modalidad: '', municipio: '', region: '', valle: '',
    numeroEquipos: 0, observaciones: '', capacitacion: 'N', asistentes: [], email: '',
    latitud: '', longitud: '',
    tecnicos: '',
    tipoIncidencia: 'mantenimiento',
    oficinaRegionalAtencion: '',
    numeroOficio: '',
    alumnosBeneficiados: 0,
    docentesBeneficiados: 0,
    serviciosMC: 0,
    serviciosMP: 0,
    reportPdf: '',
    evidencePhotos: [],
    mantenimientoDetalle: {
      equipoTecnologico: '',
      equipoTecnologicoOtro: '',
      equipos: Array(10).fill({ equipo: '', marca: '', serie: '', censal: '' }),
      fallaIdentificada: '',
      servicioRealizado: ''
    },
    edusatDetalle: {
      micropak: [],
      antena: [],
      decodificadorAcciones: [],
      cableado: [],
      preventivo: [],
      numCensal: '',
      numSerie: '',
      calidadSeñal: '',
      materiales: Array(8).fill({ material: '', cantidad: '', actividades: '' })
    }
  }

  const [formData, setFormData] = useState<ProgramStatus>(initialFormState)

  const syncData = useCallback(() => {
    const currentVersion = 'programs_full_v24'
    const storedV24 = localStorage.getItem(currentVersion)
    if (storedV24) {
      setRecords(JSON.parse(storedV24))
    } else {
      setRecords(programsData)
      localStorage.setItem(currentVersion, JSON.stringify(programsData))
    }

    const rawQueue = localStorage.getItem('atres_support_queue')
    const queue = rawQueue ? JSON.parse(rawQueue) : []
    setPendingRequestsCount(queue.length)
  }, [])

  useEffect(() => {
    setMounted(true)
    syncData()
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'atres_support_queue' || e.key === 'programs_full_v24') {
        syncData()
      }
    }
    window.addEventListener('storage', handleStorageEvent)
    return () => window.removeEventListener('storage', handleStorageEvent)
  }, [syncData])

  const publicUrl = mounted ? `${window.location.origin}/helpdesk` : '';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}`;

  const copyPublicLink = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    toast({ title: "Enlace Copiado", description: "La liga de la Mesa de Ayuda está lista para compartir." })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCctChange = (val: string) => {
    const cleanVal = val.toUpperCase();
    setFormData(prev => ({ ...prev, cct: cleanVal }));
    if (cleanVal.length === 10) {
      const school = schoolsDirectory.find(s => s.cct.toUpperCase() === cleanVal);
      if (school) {
        setFormData(prev => ({
          ...prev,
          cct: school.cct,
          schoolName: school.nombre,
          zonaEscolar: school.zonaEscolar,
          sector: school.sector,
          modalidad: school.modalidad,
          municipio: school.municipio,
          valle: school.valle,
          region: school.region,
          email: `${school.cct.toLowerCase()}@desysa.gob.mx`
        }));
      }
    }
  }

  const handleSave = () => {
    if (!formData.cct) {
      toast({ variant: "destructive", title: "Datos Incompletos", description: "El CCT es obligatorio." });
      return;
    }
    const updated = editingId 
      ? records.map(r => r.id === editingId ? formData : r) 
      : [{...formData, id: formData.id || `SOL-${Date.now()}`}, ...records];
    setRecords(updated)
    localStorage.setItem('programs_full_v24', JSON.stringify(updated))
    setIsDialogOpen(false)
    setEditingId(null)
    setFormData(initialFormState)
    setDialogSearchTerm('')
    toast({ title: "Registro guardado" })
  }

  const filteredRecords = useMemo(() => {
    let filtered = records.filter(r => r.name === activeTab);
    if (searchTerm) {
      const term = searchTerm.toUpperCase();
      filtered = filtered.filter(r => (r.cct || '').toUpperCase().includes(term) || (r.schoolName || '').toUpperCase().includes(term));
    }
    if (officeFilter !== 'all') {
      filtered = filtered.filter(r => r.oficinaRegionalAtencion === officeFilter);
    }
    return [...filtered].sort((a, b) => {
       const dateA = a.date || '';
       const dateB = b.date || '';
       return dateB.localeCompare(dateA);
    });
  }, [records, activeTab, searchTerm, officeFilter]);

  if (!mounted) return null

  return (
    <div className="space-y-4 animate-in fade-in duration-700 w-full max-w-[1450px] mx-auto overflow-hidden px-2">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-primary/5 pb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-primary uppercase leading-none">Módulos Técnicos COEES</h2>
          <div className="flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-accent" /><p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.1em]">Control de Programas y Auditoría 2026</p></div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {activeTab === 'ATRES' && (
            <div className="relative flex-1 sm:flex-none">
              <Button onClick={() => setIsHelpDeskOpen(true)} className={cn("h-10 px-6 rounded-xl shadow-md font-black uppercase text-[10px] gap-2 w-full transition-all duration-300", pendingCount > 0 ? "bg-rose-600 hover:bg-rose-700 ring-4 ring-rose-200 animate-pulse scale-105" : "bg-emerald-600 hover:bg-emerald-700 text-white")}>
                <Headset className={cn("h-4 w-4", pendingCount > 0 && "animate-bounce")} /> {pendingCount > 0 ? `${pendingCount} SOLICITUDES` : "Mesa de Ayuda ATRES"}
              </Button>
            </div>
          )}
          <Button variant="outline" className="h-10 px-6 border-primary/20 text-primary font-black uppercase text-[10px] gap-2 rounded-xl hover:bg-primary/5 shadow-md flex-1 sm:flex-none" onClick={() => setIsSchedulerOpen(true)}><CalendarDays className="h-4 w-4" /> Agenda</Button>
          <Button onClick={() => { setFormData({...initialFormState, name: activeTab}); setEditingId(null); setIsDialogOpen(true); setDialogSearchTerm(''); }} className="btn-institutional h-10 px-8 rounded-xl shadow-md text-[10px] flex-1 sm:flex-none"><PlusCircle className="h-4 w-4 mr-2" /> Nuevo Registro</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSearchTerm(''); }} className="space-y-4">
        <TabsList className="w-full justify-start h-11 bg-white/60 border border-slate-200 p-1 rounded-xl shadow-sm gap-1 overflow-x-auto no-scrollbar">
          {PROGRAM_RUBROS.map(rubro => (<TabsTrigger key={rubro} value={rubro} className="h-full px-5 text-[10px] font-black uppercase rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">{rubro}</TabsTrigger>))}
        </TabsList>

        {activeTab === 'ATRES' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-4 duration-500">
             <Card className="md:col-span-2 executive-card p-4 bg-white/80 border-none shadow-lg">
                <div className="flex flex-col md:flex-row items-end gap-4 h-full">
                   <div className="relative flex-1 w-full min-w-0">
                      <Label className="text-[9px] font-black uppercase text-slate-400 mb-1 block pl-1">Buscador Operativo de Soporte</Label>
                      <div className="relative"><Input placeholder="CCT, PLANTEL O TÉCNICO..." className="h-10 rounded-xl bg-slate-50 border-primary/5 pl-9 text-[10px] font-black uppercase shadow-inner w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /></div>
                   </div>
                   <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                      <div className="space-y-1 min-w-[200px]"><Label className="text-[9px] font-black uppercase text-slate-400 mb-1 block pl-1">Oficina Regional</Label><Select value={officeFilter} onValueChange={setOficinaFilter}><SelectTrigger className="h-10 w-full rounded-xl border-primary/5 bg-white text-[9px] font-black uppercase shadow-sm"><SelectValue placeholder="TODAS" /></SelectTrigger><SelectContent><SelectItem value="all" className="text-[9px] font-black uppercase">TODAS LAS OFICINAS</SelectItem>{REGIONAL_OFFICES.map(off => <SelectItem key={off} value={off} className="text-[9px] font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>)}</SelectContent></Select></div>
                   </div>
                </div>
             </Card>

             <Card className="executive-card p-4 bg-primary text-white border-none shadow-xl overflow-hidden relative group">
                <div className="absolute -right-4 -top-4 p-8 opacity-10 group-hover:scale-110 transition-transform">
                   <QrCode className="h-24 w-24" />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                   <div className="h-16 w-16 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-2xl shrink-0">
                      <Image src={qrCodeUrl} alt="QR Acceso Público" width={100} height={100} className="object-contain" />
                   </div>
                   <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/60 leading-none mb-1">Acceso para Planteles</p>
                        <h4 className="text-xs font-black uppercase truncate leading-none">Mesa de Ayuda ATRES</h4>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={copyPublicLink} className="h-7 px-3 text-[8px] font-black uppercase gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border-none">
                           {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} LIGA
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => window.open(publicUrl, '_blank')} className="h-7 px-3 text-[8px] font-black uppercase gap-1.5 rounded-lg bg-white text-primary border-none">
                           <ExternalLink className="h-3 w-3" /> VER
                        </Button>
                      </div>
                   </div>
                </div>
             </Card>
          </div>
        )}

        {activeTab !== 'ATRES' && (
          <Card className="executive-card p-4 bg-white/80 border-none shadow-lg">
            <div className="flex flex-col md:flex-row items-end gap-4">
               <div className="relative flex-1 w-full min-w-0">
                  <Label className="text-[9px] font-black uppercase text-slate-400 mb-1 block pl-1">Buscador Operativo</Label>
                  <div className="relative"><Input placeholder="CCT O PLANTEL..." className="h-10 rounded-xl bg-slate-50 border-primary/5 pl-9 text-[10px] font-black uppercase shadow-inner w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /></div>
               </div>
               <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                  <div className="space-y-1 min-w-[200px]"><Label className="text-[9px] font-black uppercase text-slate-400 mb-1 block pl-1">Oficina Regional</Label><Select value={officeFilter} onValueChange={setOficinaFilter}><SelectTrigger className="h-10 w-full rounded-xl border-primary/5 bg-white text-[9px] font-black uppercase shadow-sm"><SelectValue placeholder="TODAS" /></SelectTrigger><SelectContent><SelectItem value="all" className="text-[9px] font-black uppercase">TODAS</SelectItem>{REGIONAL_OFFICES.map(off => <SelectItem key={off} value={off} className="text-[9px] font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>)}</SelectContent></Select></div>
               </div>
            </div>
          </Card>
        )}

        <Card className="executive-card p-0 shadow-2xl border-none overflow-hidden bg-white">
          <div className="overflow-x-auto w-full">
            <Table className="w-full">
              <TableHeader className="bg-slate-50 border-b">
                 <TableRow className="h-12">
                    <TableHead className="w-10 text-[9px] font-black uppercase text-center pl-4 text-slate-400">#</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-primary tracking-widest w-[110px]">{activeTab === 'ATRES' ? 'Folio' : 'CCT'}</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-primary tracking-widest min-w-[150px]">Identificación del Plantel</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-primary tracking-widest w-[90px]">Estatus</TableHead>
                    {activeTab === 'ATRES' && (
                       <>
                         <TableHead className="text-[9px] font-black uppercase text-primary tracking-widest min-w-[140px]">Servicio Realizado</TableHead>
                         <TableHead className="text-[9px] font-black uppercase text-primary tracking-widest w-[110px]">Técnico</TableHead>
                         <TableHead className="text-[9px] font-black uppercase text-primary tracking-widest w-[120px]">Oficina Regional</TableHead>
                       </>
                    )}
                    <TableHead className="text-right text-[9px] font-black uppercase pr-6 text-slate-400 w-24">Acción</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length > 0 ? filteredRecords.map((rec, idx) => (
                  <TableRow key={`${rec.id}-${idx}`} className="hover:bg-primary/[0.01] transition-all border-b border-slate-50 h-14 group">
                    <TableCell className="text-center font-black text-[10px] text-slate-300 pl-4">{idx + 1}</TableCell>
                    <TableCell className="font-black text-[10px] text-primary tracking-tight">{rec.id || rec.cct}</TableCell>
                    <TableCell className="py-2">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-black text-slate-700 uppercase leading-tight truncate max-w-[180px]">{activeTab === 'Geoposición' ? `Lat: ${rec.latitud}` : rec.schoolName}</span>
                        <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-70 truncate max-w-[180px]">{rec.municipio} • {rec.valle}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       <Badge variant="outline" className={cn("text-[8px] font-black uppercase py-0.5 px-2 rounded-full", (rec.status === 'activo' || rec.status === 'pendiente' || rec.status === 'en proceso') ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-emerald-200 text-emerald-700 bg-emerald-50')}>{rec.status?.toUpperCase() || 'ACTIVO'}</Badge>
                    </TableCell>
                    {activeTab === 'ATRES' && (
                       <>
                         <TableCell><span className="text-[9px] font-bold text-slate-600 uppercase line-clamp-2 max-w-[160px] leading-tight">{rec.observaciones || '-'}</span></TableCell>
                         <TableCell><span className="text-[9px] font-black text-slate-500 uppercase truncate max-w-[100px] block">{rec.tecnicos || '-'}</span></TableCell>
                         <TableCell><div className="flex items-center gap-1"><Building2 className="h-2.5 w-2.5 text-accent shrink-0" /><span className="text-[9px] font-black text-primary uppercase truncate max-w-[110px]">{rec.oficinaRegionalAtencion?.replace("Oficina de Tecnóloga Educativa ", "").replace("Oficina de ", "") || '-'}</span></div></TableCell>
                       </>
                    )}
                    <TableCell className="text-right pr-6"><div className="flex justify-end gap-1"><button onClick={() => { setFormData({...initialFormState, ...rec}); setEditingId(rec.id); setIsDialogOpen(true); }} className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg"><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => { setRecords(records.filter(r => r.id !== rec.id)); localStorage.setItem('programs_full_v24', JSON.stringify(records.filter(r => r.id !== rec.id))); }} className="h-7 w-7 flex items-center justify-center text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button></div></TableCell>
                  </TableRow>
                )) : (<TableRow><TableCell colSpan={activeTab === 'ATRES' ? 12 : 8} className="text-center py-24 opacity-30 text-xs font-black uppercase tracking-widest">Sin registros disponibles</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
        </Card>
      </Tabs>

      <HelpDeskDialog open={isHelpDeskOpen} onOpenChange={setIsHelpDeskOpen} />
      <VisitSchedulerDialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen} areaId="programas" areaName="Programas" />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[2rem] h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white shrink-0">
             <DialogTitle className="uppercase font-black text-white text-xl flex items-center gap-4">
                <Target className="h-7 w-7 text-white/40" /> Gestión de {activeTab}
             </DialogTitle>
             <DialogDescription className="text-white/60 font-bold text-[10px] uppercase tracking-widest mt-1">
                Administración de datos técnicos y auditoría para el módulo institucional.
             </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="auditoria" className="flex-1 flex flex-col overflow-hidden">
             <div className="px-6 border-b bg-white"><TabsList className="bg-transparent h-12 p-0 gap-8"><TabsTrigger value="auditoria" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary px-2 py-4 text-xs font-black uppercase tracking-wider">Auditoría Técnica</TabsTrigger>{(activeTab === 'Biblioteca Digital' || activeTab === 'Cuentas Institucionales' || activeTab === 'ATRES') && (<TabsTrigger value="asistentes" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary px-2 py-4 text-xs font-black uppercase tracking-wider">Censo de Personal</TabsTrigger>)}</TabsList></div>
             <div className="flex-1 overflow-hidden"><TabsContent value="auditoria" className="h-full m-0 p-6"><ScrollArea className="h-full"><div className="space-y-6 pb-8"><div className="p-6 bg-slate-50 rounded-2xl border-2 border-primary/5 space-y-4 shadow-inner relative"><Label className="text-[10px] font-black uppercase text-primary flex items-center gap-3 pl-1"><Search className="h-4 w-4 text-accent" /> Localizador Institucional CCT</Label><Input placeholder="TECLEAR CCT O NOMBRE..." className="h-12 rounded-xl bg-white border-primary/10 text-xs font-black uppercase px-6 shadow-sm" value={dialogSearchTerm} onChange={(e) => { setDialogSearchTerm(e.target.value); if (e.target.value.length === 10) handleCctChange(e.target.value); }} />{dialogSearchTerm.length > 2 && (<div className="absolute left-6 right-6 top-24 max-h-56 overflow-auto bg-white border border-slate-100 rounded-xl shadow-2xl z-50 divide-y">{schoolsDirectory.filter(s => (s.nombre || '').toUpperCase().includes(dialogSearchTerm.toUpperCase()) || (s.cct || '').toUpperCase().includes(dialogSearchTerm.toUpperCase())).slice(0, 10).map(s => (<div key={`${s.cct}-${s.turno}`} className="p-3 hover:bg-primary/5 cursor-pointer flex justify-between items-center transition-colors group" onClick={() => { setFormData({...formData, cct: s.cct, schoolName: s.nombre, municipio: s.municipio, valle: s.valle, region: s.region}); setDialogSearchTerm(''); }}><div className="flex flex-col"><span className="text-[11px] font-black uppercase text-slate-800">{s.nombre}</span><span className="text-[9px] font-mono text-muted-foreground">{s.cct} • {s.municipio}</span></div><Badge variant="secondary" className="text-[8px] font-black uppercase bg-primary/10 text-primary">{s.modalidad}</Badge></div>))}</div>)}</div><div className="grid grid-cols-2 gap-6"><div className="space-y-2"><Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Folio Operativo</Label><Input className="h-11 rounded-lg bg-white border-slate-200 font-mono text-xs font-black uppercase" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} /></div><div className="space-y-2"><Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Oficina Regional</Label><Select value={formData.oficinaRegionalAtencion} onValueChange={(val) => setFormData({...formData, oficinaRegionalAtencion: val})}><SelectTrigger className="h-11 rounded-lg bg-white border-slate-200 text-[10px] font-black uppercase"><SelectValue placeholder="SELECCIONAR..." /></SelectTrigger><SelectContent>{REGIONAL_OFFICES.map(off => <SelectItem key={off} value={off} className="text-[10px] font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>)}</SelectContent></Select></div></div><div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 pl-1 flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> {activeTab === 'ATRES' ? 'Servicio Realizado' : 'Diagnóstico y Observaciones'}</Label><Textarea className="min-h-[140px] rounded-xl p-5 bg-slate-50 border-2 border-slate-200 text-xs font-semibold shadow-inner focus:bg-white" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder={activeTab === 'ATRES' ? "Describa el soporte técnico brindado..." : "Detalle técnico de la auditoría..."} /></div></div></ScrollArea></TabsContent></div>
          </Tabs>
          <DialogFooter className="p-6 gap-3 border-t bg-slate-50 flex items-center justify-end shrink-0"><Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-11 px-6 text-[10px] font-black uppercase">Cancelar</Button><Button onClick={handleSave} className="btn-institutional h-11 px-10 text-[10px]">Guardar Cambios</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
