'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { schoolsDirectory } from "@/lib/schools-directory"
import { 
  Search, 
  UserPlus, 
  Users, 
  Pencil, 
  Trash2, 
  School, 
  Mail, 
  BadgeCheck, 
  Building2, 
  FileSpreadsheet, 
  GraduationCap, 
  CheckCircle2, 
  ListFilter, 
  X, 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Printer, 
  FilePlus2,
  FolderOpen
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

type Certificate = {
  id: string;
  name: string;
  data: string; // base64
  date: string;
}

type ParticipantInfo = {
  id: string;
  rfc: string;
  curp: string;
  nombres: string;
  paterno: string;
  materno: string;
  genero: 'MASCULINO' | 'FEMENINO' | '';
  funcion: string;
  email: string;
  cct: string;
  nombreCT: string;
  municipio: string;
  valle: string;
  region: string;
  zonaEscolar: string;
  sector: string;
  modalidad: string;
  cursosAcreditados: string;
  constancia: 'SI' | 'NO' | '';
  cicloEscolar: string;
  certificates: Certificate[];
}

const FUNCIONES = [
  "PAAE",
  "DOCENTE",
  "DIRECTIVO",
  "JEFE DE ENSEÑANZA",
  "SUPERVISOR",
  "ASESOR TECNICO PEDAGOGICO"
]

const FILE_SIZE_LIMIT = 400 * 1024; // 400KB limit for localStorage safety

export default function BaseParticipantesPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [participants, setParticipants] = useState<ParticipantInfo[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantInfo | null>(null)
  const [pdfToPreview, setPdfToPreview] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const initialFormState: ParticipantInfo = {
    id: '', rfc: '', curp: '', nombres: '', paterno: '', materno: '', genero: '',
    funcion: '', email: '', cct: '', nombreCT: '', municipio: '', valle: '',
    region: '', zonaEscolar: '', sector: '', modalidad: '',
    cursosAcreditados: '', constancia: '', cicloEscolar: '',
    certificates: []
  }

  const [formData, setFormData] = useState<ParticipantInfo>(initialFormState)

  useEffect(() => {
    setMounted(true)
    const stored = JSON.parse(localStorage.getItem('participants_master_v1') || '[]')
    // Migración para registros antiguos que no tengan el campo certificates
    const migrated = stored.map((p: any) => ({
      ...p,
      certificates: p.certificates || []
    }))
    setParticipants(migrated)
  }, [])

  const filteredParticipants = useMemo(() => {
    if (!searchTerm) return participants;
    const term = searchTerm.toUpperCase();
    return participants.filter(p => {
      const rfcMatch = (p.rfc || '').toUpperCase().includes(term);
      const curpMatch = (p.curp || '').toUpperCase().includes(term);
      const nameMatch = `${p.nombres} ${p.paterno} ${p.materno}`.toUpperCase().includes(term);
      const cctMatch = (p.cct || '').toUpperCase().includes(term);
      const schoolMatch = (p.nombreCT || '').toUpperCase().includes(term);
      return rfcMatch || curpMatch || nameMatch || cctMatch || schoolMatch;
    });
  }, [searchTerm, participants]);

  const handleCctChange = (val: string) => {
    const cleanVal = val.toUpperCase()
    setFormData(prev => ({ ...prev, cct: cleanVal }))
    if (cleanVal.length === 10) {
      const school = schoolsDirectory.find(s => s.cct.toUpperCase() === cleanVal)
      if (school) {
        setFormData(prev => ({
          ...prev,
          nombreCT: school.nombre,
          municipio: school.municipio,
          valle: school.valle,
          region: school.region,
          zonaEscolar: school.zonaEscolar,
          sector: school.sector,
          modalidad: school.modalidad
        }))
      }
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > FILE_SIZE_LIMIT) {
      toast({ variant: "destructive", title: "Archivo demasiado pesado", description: "El PDF excede los 400KB recomendados." })
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const newCert: Certificate = {
        id: `CERT-${Date.now()}`,
        name: file.name,
        data: ev.target?.result as string,
        date: format(new Date(), 'dd/MM/yyyy HH:mm')
      }
      setFormData(prev => ({
        ...prev,
        certificates: [...(prev.certificates || []), newCert]
      }))
      toast({ title: "Constancia añadida al expediente" })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removeCertificate = (id: string) => {
    setFormData(prev => ({
      ...prev,
      certificates: (prev.certificates || []).filter(c => c.id !== id)
    }))
  }

  const handleSave = () => {
    if (!formData.rfc || !formData.nombres || !formData.paterno) {
      toast({ variant: "destructive", title: "Faltan datos", description: "RFC y nombre completo son necesarios." })
      return
    }

    const participantToSave: ParticipantInfo = {
      ...formData,
      id: editingId || `PART-${Date.now()}`,
      rfc: formData.rfc.toUpperCase(),
      curp: formData.curp.toUpperCase(),
      nombres: formData.nombres.toUpperCase(),
      paterno: formData.paterno.toUpperCase(),
      materno: formData.materno.toUpperCase(),
      email: (formData.email || '').toLowerCase(),
      cursosAcreditados: (formData.cursosAcreditados || '').toUpperCase(),
      cicloEscolar: (formData.cicloEscolar || '').toUpperCase(),
      certificates: formData.certificates || []
    }

    let updated;
    if (editingId) {
      updated = participants.map(p => p.id === editingId ? participantToSave : p)
    } else {
      updated = [participantToSave, ...participants]
    }

    try {
      localStorage.setItem('participants_master_v1', JSON.stringify(updated))
      setParticipants(updated)
      setIsDialogOpen(false)
      setFormData(initialFormState)
      setEditingId(null)
      toast({ title: initialFormState.id ? "Participante Actualizado" : "Participante Registrado" })
    } catch (e) {
      toast({ variant: "destructive", title: "Error de Memoria", description: "No se pudo guardar por el tamaño de los PDFs. Intente reduciendo el peso de los archivos." })
    }
  }

  const handleDelete = (id: string) => {
    const updated = participants.filter(p => p.id !== id)
    setParticipants(updated)
    localStorage.setItem('participants_master_v1', JSON.stringify(updated))
    toast({ title: "Registro eliminado" })
  }

  const downloadExcel = () => {
    if (participants.length === 0) {
      toast({ variant: "destructive", title: "Sin datos", description: "No hay registros para exportar." })
      return
    }

    const dataToExport = participants.map(p => ({
      'Paterno': p.paterno,
      'Materno': p.materno,
      'Nombre(s)': p.nombres,
      'RFC': p.rfc,
      'CURP': p.curp,
      'Función': p.funcion,
      'Cursos Acreditados': p.cursosAcreditados,
      'Constancia': p.constancia,
      'Ciclo Escolar': p.cicloEscolar,
      'Correo Electrónico': p.email,
      'CCT Adscripción': p.cct,
      'Nombre CT': p.nombreCT,
      'Municipio': p.municipio,
      'ZE': p.zonaEscolar,
      'Sector': p.sector,
      'Región': p.region,
      'Valle': p.valle,
      'Modalidad': p.modalidad
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Base de Participantes");
    
    const fileName = `Base_Participantes_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast({ title: "Exportación Exitosa" })
  };

  const handleViewCertificates = (p: ParticipantInfo) => {
    setSelectedParticipant(p)
    setIsViewerOpen(true)
  }

  const downloadFile = (data: string, name: string) => {
    const link = document.createElement('a'); link.href = data; link.download = name; link.click();
  }

  const printFile = (data: string) => {
    const win = window.open();
    if (!win) return;
    win.document.write(`<iframe src="${data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase leading-none">Base Maestra de Participantes</h2>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2 mt-1">
            <Users className="h-4 w-4 text-accent" /> Catálogo de Servidores Públicos • Expediente Digital de Constancias
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            onClick={downloadExcel} 
            variant="outline" 
            className="h-12 px-6 rounded-xl border-emerald-200 text-emerald-700 font-black uppercase text-[10px] gap-2 hover:bg-emerald-50 shadow-md"
          >
            <FileSpreadsheet className="h-5 w-5" /> Exportar a Excel
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setFormData(initialFormState);
              setEditingId(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="btn-institutional h-12 px-8 rounded-xl shadow-lg">
                <UserPlus className="h-5 w-5 mr-2" /> Nuevo Participante
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px] h-[95vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
              <DialogHeader className="p-8 pb-4 bg-primary text-white">
                <DialogTitle className="uppercase font-black text-white text-2xl flex items-center gap-4">
                  <UserPlus className="h-8 w-8 text-accent" /> {editingId ? 'Editar Perfil del Servidor' : 'Alta de Servidor Público'}
                </DialogTitle>
                <DialogDescription className="font-bold text-[10px] uppercase tracking-widest text-white/60">
                  Gestión integral de identidad, adscripción y expediente académico.
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                  <div className="md:col-span-2 border-b border-slate-100 pb-2">
                     <h3 className="text-[11px] font-black uppercase text-accent flex items-center gap-2">
                       <BadgeCheck className="h-4 w-4" /> Datos de Identidad Oficial
                     </h3>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">RFC (13 Caracteres)</Label>
                    <Input maxLength={13} className="font-mono font-black uppercase h-11 bg-slate-50 border-none shadow-inner" value={formData.rfc} onChange={e => setFormData({...formData, rfc: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">CURP (18 Caracteres)</Label>
                    <Input maxLength={18} className="font-mono font-black uppercase h-11 bg-slate-50 border-none shadow-inner" value={formData.curp} onChange={e => setFormData({...formData, curp: e.target.value.toUpperCase()})} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Apellido Paterno</Label>
                    <Input className="font-bold uppercase h-11 bg-slate-50 border-none shadow-inner" value={formData.paterno} onChange={e => setFormData({...formData, paterno: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Apellido Materno</Label>
                    <Input className="font-bold uppercase h-11 bg-slate-50 border-none shadow-inner" value={formData.materno} onChange={e => setFormData({...formData, materno: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Nombre(s)</Label>
                    <Input className="font-bold uppercase h-11 bg-slate-50 border-none shadow-inner" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value.toUpperCase()})} />
                  </div>

                  <div className="md:col-span-2 border-b border-slate-100 pb-2 mt-4">
                     <h3 className="text-[11px] font-black uppercase text-accent flex items-center gap-2">
                       <Building2 className="h-4 w-4" /> Adscripción Laboral y Contacto
                     </h3>
                  </div>

                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-primary">Función Desempeñada</Label>
                     <Select value={formData.funcion} onValueChange={val => setFormData({...formData, funcion: val})}>
                        <SelectTrigger className="h-11 font-bold bg-slate-50 border-none shadow-inner uppercase"><SelectValue placeholder="ELEGIR FUNCIÓN..." /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                           {FUNCIONES.map(f => <SelectItem key={f} value={f} className="text-[10px] font-bold uppercase">{f}</SelectItem>)}
                        </SelectContent>
                     </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">CCT Adscripción</Label>
                    <Input maxLength={10} className="font-mono font-black uppercase h-11 bg-slate-50 border-none shadow-inner" value={formData.cct} onChange={e => handleCctChange(e.target.value)} />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Correo Electrónico</Label>
                    <Input type="email" className="h-11 bg-slate-50 border-none shadow-inner" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value.toLowerCase()})} placeholder="ejemplo@desysa.edu.mx" />
                  </div>

                  <div className="md:col-span-2 border-b border-slate-100 pb-2 mt-4">
                     <h3 className="text-[11px] font-black uppercase text-accent flex items-center gap-2">
                       <GraduationCap className="h-4 w-4" /> Seguimiento Académico y Ciclo
                     </h3>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Cursos Acreditados</Label>
                    <Input className="font-bold uppercase h-11 bg-slate-50 border-none shadow-inner" value={formData.cursosAcreditados} onChange={e => setFormData({...formData, cursosAcreditados: e.target.value.toUpperCase()})} placeholder="EJ: TICCAD 2026, IA APLICADA..." />
                  </div>

                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-primary">Constancia / Diploma</Label>
                     <Select value={formData.constancia} onValueChange={(val: any) => setFormData({...formData, constancia: val})}>
                        <SelectTrigger className="h-11 font-bold bg-slate-50 border-none shadow-inner"><SelectValue placeholder="¿CUENTA CON DOCUMENTO?..." /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                           <SelectItem value="SI">SÍ (ACREDITADO)</SelectItem>
                           <SelectItem value="NO">NO (PENDIENTE)</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Ciclo Escolar</Label>
                    <Input className="font-black uppercase h-11 bg-slate-50 border-none shadow-inner" value={formData.cicloEscolar} onChange={e => setFormData({...formData, cicloEscolar: e.target.value.toUpperCase()})} placeholder="EJ: 2025-2026" />
                  </div>

                  <div className="md:col-span-2 border-b border-slate-100 pb-2 mt-6">
                     <h3 className="text-[11px] font-black uppercase text-primary flex items-center gap-2">
                       <FilePlus2 className="h-4 w-4" /> Expediente Digital (Constancias PDF)
                     </h3>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 group hover:border-primary/40 transition-all">
                       <div className="h-12 w-12 rounded-2xl bg-white shadow-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <Upload className="h-6 w-6" />
                       </div>
                       <div className="text-center">
                          <p className="text-[10px] font-black uppercase text-slate-700">Subir Constancia en PDF</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Haga clic o arrastre el archivo aquí (Máx. 400KB)</p>
                       </div>
                       <Input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                       <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-9 px-6 rounded-xl text-[9px] font-black uppercase">Seleccionar Archivo</Button>
                    </div>

                    <div className="space-y-2">
                       {(formData.certificates || []).map((cert) => (
                         <div key={cert.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm animate-in slide-in-from-left">
                            <div className="flex items-center gap-3">
                               <div className="h-8 w-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center shadow-inner">
                                  <FileText className="h-4 w-4" />
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-slate-700 uppercase leading-none truncate max-w-[200px]">{cert.name}</span>
                                  <span className="text-[8px] font-bold text-slate-400 mt-1">{cert.date}</span>
                               </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg" onClick={() => removeCertificate(cert.id)}>
                               <X className="h-4 w-4" />
                            </Button>
                         </div>
                       ))}
                       {(!formData.certificates || formData.certificates.length === 0) && (
                         <p className="text-[9px] font-bold text-slate-400 uppercase text-center py-4 border rounded-xl border-slate-50 italic">Sin documentos adjuntos en este expediente</p>
                       )}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter className="p-8 border-t bg-slate-50">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-12 px-8 rounded-xl font-bold uppercase text-xs">Cancelar</Button>
                <Button onClick={handleSave} className="btn-institutional h-12 px-12 rounded-xl text-xs">
                  {editingId ? 'Actualizar Datos' : 'Registrar Participante'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="executive-card p-6 bg-white/80 border-none shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Search className="h-5 w-5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buscador Personal:</span>
          </div>
          
          <div className="relative flex-1 w-full group">
            <Input 
              placeholder="Buscar por RFC, CURP, Nombre o CCT..." 
              className="h-12 rounded-xl bg-slate-50 border-primary/10 pl-12 pr-4 text-sm font-bold uppercase shadow-inner focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchTerm && setIsResultsDialogOpen(true)}
            />
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
          </div>

          <div className="flex items-center gap-3">
             <Button 
                onClick={() => searchTerm && setIsResultsDialogOpen(true)} 
                disabled={!searchTerm}
                className="btn-institutional h-12 px-6 rounded-xl shadow-md text-[10px] gap-2 disabled:opacity-50"
              >
               <ListFilter className="h-4 w-4" /> Ver Resultados en Ventana ({filteredParticipants.length})
             </Button>
             <Badge variant="outline" className="h-12 px-6 rounded-xl border-primary/20 text-primary font-black text-[10px] uppercase">
               Total: {participants.length}
             </Badge>
          </div>
        </div>
      </Card>

      <Card className="executive-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b">
              <TableRow>
                <TableHead className="w-12 text-[10px] font-black uppercase text-center">#</TableHead>
                <TableHead className="text-[10px] font-black uppercase min-w-[220px]">Nombre Completo del Servidor</TableHead>
                <TableHead className="text-[10px] font-black uppercase">RFC</TableHead>
                <TableHead className="text-[10px] font-black uppercase">CURP</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Función</TableHead>
                <TableHead className="text-[10px] font-black uppercase min-w-[150px]">Cursos Acreditados</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">Exp.</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">Ciclo</TableHead>
                <TableHead className="text-[10px] font-black uppercase">CCT de Origen</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase pr-10">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParticipants.length > 0 ? filteredParticipants.map((p, idx) => (
                <TableRow key={`${p.id}-${idx}`} className="hover:bg-slate-50 transition-colors group">
                  <TableCell className="text-center font-black text-[10px] text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <button 
                      onClick={() => handleViewCertificates(p)}
                      className="flex items-center gap-3 text-left hover:scale-[1.02] transition-transform group/btn"
                    >
                      <div className="h-9 w-9 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover/btn:bg-primary group-hover/btn:text-white transition-colors">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-700 uppercase leading-none border-b border-transparent group-hover/btn:border-primary group-hover/btn:text-primary transition-all">
                           {p.paterno} {p.materno} {p.nombres}
                        </span>
                        <span className="text-[8px] text-muted-foreground font-bold flex items-center gap-1 mt-1">
                           <FilePlus2 className="h-2.5 w-2.5" /> Ver Expediente Digital
                        </span>
                      </div>
                    </button>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-black text-[9px] text-primary">{p.rfc}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-bold text-[9px] text-accent">{p.curp}</span>
                  </TableCell>
                  <TableCell>
                     <Badge variant="secondary" className="text-[8px] font-black uppercase bg-slate-100 text-slate-600 border-none px-2">
                        {p.funcion}
                     </Badge>
                  </TableCell>
                  <TableCell>
                     <div className="text-[9px] font-bold text-slate-600 uppercase leading-tight max-w-[150px] truncate" title={p.cursosAcreditados}>
                        {p.cursosAcreditados || 'SIN REGISTRO'}
                     </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(
                      "text-[8px] font-black h-5 border-none shadow-sm",
                      p.constancia === 'SI' ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400"
                    )}>
                       {p.constancia} {p.constancia === 'SI' && <CheckCircle2 className="h-2 w-2 ml-1" />}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                     <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">{p.cicloEscolar || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-primary leading-none tracking-tighter">{p.cct}</span>
                       <span className="text-[8px] text-muted-foreground font-bold uppercase truncate max-w-[150px] mt-1">{p.nombreCT}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                     <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg" onClick={() => { setFormData(p); setEditingId(p.id); setIsDialogOpen(true); }}>
                           <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg" onClick={() => handleDelete(p.id)}>
                           <Trash2 className="h-4 w-4" />
                        </Button>
                     </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-24 opacity-30">
                    <div className="flex flex-col items-center gap-3">
                       <Users className="h-10 w-10 text-slate-300" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sin registros de participantes disponibles</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Visor de Expediente Digital */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[3rem] h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white shrink-0 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><FolderOpen className="h-24 w-24 text-white" /></div>
             <div className="space-y-1 relative z-10">
                <DialogTitle className="uppercase font-black text-2xl flex items-center gap-4">
                  Expediente Digital: {selectedParticipant?.nombres} {selectedParticipant?.paterno}
                </DialogTitle>
                <div className="flex items-center gap-3 mt-2">
                   <Badge className="bg-white/20 text-white font-mono text-[10px] px-3 border-none">{selectedParticipant?.rfc}</Badge>
                   <Badge variant="outline" className="border-white/20 text-white/80 font-black uppercase text-[9px]">{selectedParticipant?.cct}</Badge>
                </div>
             </div>
          </DialogHeader>

          <div className="flex-1 flex overflow-hidden">
             <div className="w-[300px] border-r bg-slate-50 flex flex-col shrink-0">
                <div className="p-4 bg-slate-100/50 border-b flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase text-slate-500">Documentos ({selectedParticipant?.certificates?.length || 0})</span>
                </div>
                <ScrollArea className="flex-1">
                   <div className="p-3 space-y-2">
                      {selectedParticipant?.certificates?.map((cert) => (
                        <button key={cert.id} onClick={() => setPdfToPreview(cert.data)} className={cn("w-full p-4 rounded-2xl border text-left transition-all group relative overflow-hidden", pdfToPreview === cert.data ? "bg-primary border-primary shadow-lg" : "bg-white border-slate-100 hover:bg-white hover:shadow-md")}>
                           <div className="flex items-center gap-3 relative z-10">
                              <FileText className={cn("h-5 w-5", pdfToPreview === cert.data ? "text-white" : "text-primary")} />
                              <div className="flex flex-col min-w-0">
                                 <span className={cn("text-[10px] font-black uppercase truncate", pdfToPreview === cert.data ? "text-white" : "text-slate-700")}>{cert.name}</span>
                                 <span className={cn("text-[8px] font-bold", pdfToPreview === cert.data ? "text-white/60" : "text-slate-400")}>{cert.date}</span>
                              </div>
                           </div>
                           {pdfToPreview === cert.data && <div className="absolute right-0 top-0 p-2"><CheckCircle2 className="h-3 w-3 text-white" /></div>}
                        </button>
                      ))}
                      {(!selectedParticipant?.certificates || selectedParticipant.certificates.length === 0) && (
                        <div className="py-20 text-center opacity-30 flex flex-col items-center gap-2">
                           <FileText className="h-10 w-10 text-slate-300" />
                           <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sin archivos adjuntos</p>
                        </div>
                      )}
                   </div>
                </ScrollArea>
             </div>

             <div className="flex-1 bg-primary/5 p-2 flex flex-col relative">
                {pdfToPreview ? (
                  <>
                    <iframe src={pdfToPreview} className="w-full h-full rounded-2xl bg-white shadow-2xl border-none" title="PDF Preview" />
                    <div className="absolute top-6 right-6 flex flex-col gap-2">
                       <Button onClick={() => downloadFile(pdfToPreview, "constancia.pdf")} className="h-10 w-10 rounded-xl bg-primary text-white shadow-2xl hover:scale-110 transition-all p-0">
                          <Download className="h-5 w-5" />
                       </Button>
                       <Button onClick={() => printFile(pdfToPreview)} className="h-10 w-10 rounded-xl bg-accent text-white shadow-2xl hover:scale-110 transition-all p-0">
                          <Printer className="h-5 w-5" />
                       </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                     <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center animate-pulse"><Eye className="h-10 w-10 text-primary/10" /></div>
                     <p className="text-primary/30 text-[11px] font-black uppercase tracking-[0.3em]">Seleccione un documento del listado <br /> para su visualización técnica</p>
                  </div>
                )}
             </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-between items-center">
             <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Dirección de Educación Secundaria • Servicios de Apoyo</p>
             <Button onClick={() => { setIsViewerOpen(false); setPdfToPreview(null); }} className="btn-institutional h-12 px-10 text-[10px] shadow-lg">Cerrar Visor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ventana Emergente de Resultados de Búsqueda */}
      <Dialog open={isResultsDialogOpen} onOpenChange={setIsResultsDialogOpen}>
        <DialogContent className="sm:max-w-[1200px] h-[85vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <DialogHeader className="p-8 bg-slate-50 border-b shrink-0 flex flex-row justify-between items-center pr-12">
            <div className="space-y-1">
              <DialogTitle className="uppercase font-black text-primary text-xl flex items-center gap-3">
                <Search className="h-7 w-7 text-accent" /> Resultados de Búsqueda
              </DialogTitle>
              <DialogDescription className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">
                Coincidencias encontradas para: <span className="text-primary font-black">"{searchTerm.toUpperCase()}"</span>
              </DialogDescription>
            </div>
            <div className="flex items-center gap-4">
               <Badge className="bg-primary text-white font-black px-4 h-8 rounded-xl shadow-lg uppercase text-[10px]">
                 {filteredParticipants.length} Registros Encontrados
               </Badge>
               <Button variant="ghost" size="icon" onClick={() => setIsResultsDialogOpen(false)} className="rounded-full h-10 w-10 hover:bg-slate-200">
                  <X className="h-5 w-5" />
               </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden p-6">
             <ScrollArea className="h-full border-2 border-slate-100 rounded-[2rem] shadow-inner bg-white">
                <Table>
                   <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b shadow-sm">
                      <TableRow>
                         <TableHead className="text-[9px] font-black uppercase pl-8 py-4">Servidor Público</TableHead>
                         <TableHead className="text-[9px] font-black uppercase">RFC / CURP</TableHead>
                         <TableHead className="text-[9px] font-black uppercase">Función</TableHead>
                         <TableHead className="text-[9px] font-black uppercase">Seguimiento Académico</TableHead>
                         <TableHead className="text-[9px] font-black uppercase">CCT de Origen</TableHead>
                         <TableHead className="text-right pr-10 text-[9px] font-black uppercase">Acciones</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {filteredParticipants.map((p, idx) => (
                        <TableRow key={`res-${p.id}-${idx}`} className="hover:bg-slate-50 transition-colors h-16 group">
                           <TableCell className="pl-8 py-4">
                              <button 
                                onClick={() => { setIsResultsDialogOpen(false); handleViewCertificates(p); }}
                                className="flex items-center gap-3 text-left hover:translate-x-1 transition-transform"
                              >
                                 <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                    <Users className="h-5 w-5" />
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-700 uppercase leading-none">{p.paterno} {p.materno} {p.nombres}</span>
                                    <span className="text-[8px] font-bold text-primary mt-1 uppercase flex items-center gap-1"><FolderOpen className="h-2.5 w-2.5" /> VER EXPEDIENTE</span>
                                 </div>
                              </button>
                           </TableCell>
                           <TableCell>
                              <div className="flex flex-col">
                                 <span className="font-mono text-[9px] font-black text-primary leading-none">{p.rfc}</span>
                                 <span className="font-mono text-[8px] font-bold text-accent mt-1">{p.curp}</span>
                              </div>
                           </TableCell>
                           <TableCell>
                              <Badge variant="secondary" className="text-[8px] font-black uppercase bg-slate-100 text-slate-600 border-none px-3">
                                 {p.funcion}
                              </Badge>
                           </TableCell>
                           <TableCell>
                              <div className="flex flex-col gap-1.5">
                                 <div className="text-[8px] font-bold text-slate-500 uppercase truncate max-w-[120px]">{p.cursosAcreditados || 'SIN CURSOS'}</div>
                                 <div className="flex items-center gap-2">
                                    {p.constancia === 'SI' ? <Badge className="bg-emerald-50 text-emerald-700 text-[7px] font-black h-4 px-2">SÍ</Badge> : <Badge variant="outline" className="text-[7px] h-4 px-2">NO</Badge>}
                                    <span className="text-[8px] font-black text-primary">{p.cicloEscolar}</span>
                                 </div>
                              </div>
                           </TableCell>
                           <TableCell>
                              <div className="flex flex-col">
                                 <span className="text-[10px] font-black text-primary leading-none">{p.cct}</span>
                                 <span className="text-[8px] font-bold text-muted-foreground truncate max-w-[150px] uppercase mt-1">{p.nombreCT}</span>
                              </div>
                           </TableCell>
                           <TableCell className="text-right pr-10">
                              <div className="flex justify-end gap-1.5">
                                 <Button variant="outline" size="sm" onClick={() => { setFormData(p); setEditingId(p.id); setIsResultsDialogOpen(false); setIsDialogOpen(true); }} className="h-8 rounded-lg border-slate-200 text-primary font-black uppercase text-[8px] gap-2 hover:bg-primary/5">
                                    <Pencil className="h-3.5 w-3.5" /> Editar
                                 </Button>
                                 <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="h-8 w-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                                    <Trash2 className="h-4 w-4" />
                                 </Button>
                              </div>
                           </TableCell>
                        </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </ScrollArea>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-between items-center shrink-0">
             <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
               Fin de resultados • Sistema de Auditoría COEES 2026
             </p>
             <Button variant="secondary" onClick={() => setIsResultsDialogOpen(false)} className="rounded-xl h-12 px-10 text-[10px] font-black uppercase shadow-lg">
               Cerrar Búsqueda
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
