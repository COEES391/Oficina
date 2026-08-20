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
import { schoolsDirectory, type SchoolInfo } from "@/lib/schools-directory"
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
  FolderOpen,
  AlertCircle,
  Plus,
  PlusCircle,
  MapPin,
  Phone,
  LayoutGrid,
  Info
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

  // CCT Dynamic Logic
  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([])
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddForm, setQuickAddForm] = useState<SchoolInfo>({
    region: '', valle: 'MEXICO', municipio: '', subsistema: 'FEDERALIZADO', control: 'OFICIAL',
    nivel: 'SECUNDARIA', servicioEducativo: 'SECUNDARIA GENERAL', cct: '', turno: 'MATUTINO',
    nombre: '', domicilio: '', localidad: '', telefono: '', zonaEscolar: '', sector: '',
    director: '', hombres: 0, mujeres: 0, alumnos: 0, grupos: 0, maestros: 0, administrativos: 0,
    aulasExistentes: 0, aulasEnUso: 0, modalidad: 'DES'
  })

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
    const migrated = stored.map((p: any) => ({
      ...p,
      certificates: p.certificates || []
    }))
    setParticipants(migrated)

    // Sync Schools
    const storedSchools = JSON.parse(localStorage.getItem('schools_master_full_v21') || '[]')
    if (storedSchools.length > 0) {
      setAllSchools(storedSchools)
    } else {
      setAllSchools(schoolsDirectory)
    }
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
      const school = allSchools.find(s => s.cct.toUpperCase() === cleanVal)
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
      } else {
        // If not found, offer quick add
        setQuickAddForm({...quickAddForm, cct: ''})
        setIsQuickAddOpen(true)
      }
    }
  }

  const handleQuickAddCct = () => {
    if (!quickAddForm.cct || !quickAddForm.nombre || !quickAddForm.municipio) {
      toast({ variant: "destructive", title: "Faltan datos", description: "CCT, Nombre y Municipio son requeridos." }); return;
    }
    const newSchool = { 
      ...quickAddForm, 
      cct: quickAddForm.cct.toUpperCase(), 
      nombre: quickAddForm.nombre.toUpperCase(), 
      municipio: quickAddForm.municipio.toUpperCase(),
      domicilio: quickAddForm.domicilio.toUpperCase(),
      localidad: quickAddForm.localidad.toUpperCase(),
      sector: quickAddForm.sector.toUpperCase(),
      zonaEscolar: quickAddForm.zonaEscolar.toUpperCase(),
      modalidad: quickAddForm.modalidad.toUpperCase()
    };
    const updated = [newSchool, ...allSchools];
    setAllSchools(updated);
    localStorage.setItem('schools_master_full_v21', JSON.stringify(updated));
    handleCctChange(newSchool.cct);
    setIsQuickAddOpen(false);
    toast({ title: "CCT Sumado a la Base Maestra" });
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > FILE_SIZE_LIMIT) {
      toast({ 
        variant: "destructive", 
        title: "Archivo demasiado pesado", 
        description: "El PDF excede los 400KB permitidos por seguridad." 
      })
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
      toast({ title: editingId ? "Participante Actualizado" : "Participante Registrado" })
    } catch (e) {
      toast({ variant: "destructive", title: "Error de Memoria", description: "No se pudo guardar por el tamaño acumulado de los PDFs. Intente reduciendo el peso de los archivos." })
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
                    <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 group hover:border-primary/40 transition-all relative">
                       <div className="h-12 w-12 rounded-2xl bg-white shadow-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <Upload className="h-6 w-6" />
                       </div>
                       <div className="text-center">
                          <div className="text-[10px] font-black uppercase text-slate-700">Subir Constancia en PDF</div>
                          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center justify-center gap-2">
                             Haga clic o arrastre el archivo aquí <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 text-[7px] px-1 h-4">MÁX. 400KB</Badge>
                          </div>
                       </div>
                       <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                       <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-9 px-6 rounded-xl text-[9px] font-black uppercase border-primary/20 hover:bg-primary/5">Seleccionar Archivo</Button>
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
                         <p className="text-[9px] font-bold text-slate-400 uppercase text-center py-4 border rounded-xl border-slate-50 italic">Sin documentos adjuntos</p>
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
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" group-focus-within:text-primary transition-colors" />
          </div>

          <div className="flex items-center gap-3">
             <Button 
                onClick={() => searchTerm && setIsResultsDialogOpen(true)} 
                disabled={!searchTerm}
                className="btn-institutional h-12 px-6 rounded-xl shadow-md text-[10px] gap-2 disabled:opacity-50"
              >
               <ListFilter className="h-4 w-4" /> Ver Resultados ({filteredParticipants.length})
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
                <TableHead className="text-[10px] font-black uppercase text-center">Exp.</TableHead>
                <TableHead className="text-[10px] font-black uppercase">CCT de Origen</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase pr-10">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParticipants.length > 0 ? filteredParticipants.map((p, idx) => (
                <TableRow key={`${p.id}-${idx}`} className="hover:bg-slate-50 transition-colors group">
                  <TableCell className="text-center font-black text-[10px] text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <button onClick={() => handleViewCertificates(p)} className="flex items-center gap-3 text-left hover:scale-[1.02] transition-transform group/btn">
                      <div className="h-9 w-9 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover/btn:bg-primary group-hover/btn:text-white transition-colors">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-700 uppercase leading-none border-b border-transparent group-hover/btn:border-primary group-hover/btn:text-primary transition-all">{p.paterno} {p.materno} {p.nombres}</span>
                        <span className="text-[8px] text-muted-foreground font-bold flex items-center gap-1 mt-1"><FilePlus2 className="h-2.5 w-2.5" /> Ver Expediente Digital</span>
                      </div>
                    </button>
                  </TableCell>
                  <TableCell><span className="font-mono font-black text-[9px] text-primary">{p.rfc}</span></TableCell>
                  <TableCell><span className="font-mono font-bold text-[9px] text-accent">{p.curp}</span></TableCell>
                  <TableCell><Badge variant="secondary" className="text-[8px] font-black uppercase bg-slate-100 text-slate-600">{p.funcion}</Badge></TableCell>
                  <TableCell className="text-center"><Badge className={cn("text-[8px] font-black h-5", p.constancia === 'SI' ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400")}>{p.constancia} {p.constancia === 'SI' && <CheckCircle2 className="h-2 w-2 ml-1" />}</Badge></TableCell>
                  <TableCell><div className="flex flex-col"><span className="text-[10px] font-black text-primary leading-none">{p.cct}</span><span className="text-[8px] text-muted-foreground font-bold uppercase truncate max-w-[150px] mt-1">{p.nombreCT}</span></div></TableCell>
                  <TableCell className="text-right pr-8">
                     <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg" onClick={() => { setFormData(p); setEditingId(p.id); setIsDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                     </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={11} className="text-center py-24 opacity-30 text-[10px] font-black uppercase">Sin registros disponibles</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Visor de Expediente Digital */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[3rem] h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white shrink-0">
             <div className="space-y-1 relative z-10">
                <DialogTitle className="uppercase font-black text-2xl flex items-center gap-4">Expediente Digital: {selectedParticipant?.nombres} {selectedParticipant?.paterno}</DialogTitle>
                <div className="flex items-center gap-3 mt-2">
                   <Badge className="bg-white/20 text-white font-mono text-[10px] px-3">{selectedParticipant?.rfc}</Badge>
                   <Badge variant="outline" className="border-white/20 text-white/80 font-black uppercase text-[9px]">{selectedParticipant?.cct}</Badge>
                </div>
             </div>
          </DialogHeader>
          <div className="flex-1 flex overflow-hidden">
             <div className="w-[280px] border-r bg-slate-50 flex flex-col shrink-0">
                <div className="p-4 bg-slate-100/50 border-b flex items-center justify-between"><span className="text-[10px] font-black uppercase text-slate-500">Documentos ({selectedParticipant?.certificates?.length || 0})</span></div>
                <ScrollArea className="flex-1"><div className="p-3 space-y-2">{selectedParticipant?.certificates?.map((cert) => (<button key={cert.id} onClick={() => setPdfToPreview(cert.data)} className={cn("w-full p-4 rounded-2xl border text-left transition-all", pdfToPreview === cert.data ? "bg-primary border-primary text-white shadow-lg" : "bg-white border-slate-100 hover:bg-slate-50")}><div className="flex items-center gap-3"><FileText className={cn("h-5 w-5", pdfToPreview === cert.data ? "text-white" : "text-primary")} /><div className="flex flex-col min-w-0"><span className="text-[10px] font-black uppercase truncate">{cert.name}</span><span className={cn("text-[8px] font-bold", pdfToPreview === cert.data ? "text-white/60" : "text-slate-400")}>{cert.date}</span></div></div></button>))}</div></ScrollArea>
             </div>
             <div className="flex-1 bg-slate-900 p-2 flex flex-col relative">
                {pdfToPreview ? (
                  <><iframe src={pdfToPreview} className="w-full h-full rounded-2xl bg-white" title="PDF Preview" /><div className="absolute top-6 right-6 flex flex-col gap-2"><Button onClick={() => downloadFile(pdfToPreview, "constancia.pdf")} className="h-10 w-10 rounded-xl bg-primary text-white shadow-2xl hover:scale-110 p-0"><Download className="h-5 w-5" /></Button><Button onClick={() => printFile(pdfToPreview)} className="h-10 w-10 rounded-xl bg-[#B38E5D] text-white shadow-2xl hover:scale-110 p-0"><Printer className="h-5 w-5" /></Button></div></>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4"><div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center animate-pulse"><Eye className="h-8 w-8 text-white/10" /></div><p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Seleccione un documento para visualizar</p></div>
                )}
             </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end shrink-0"><Button onClick={() => { setIsViewerOpen(false); setPdfToPreview(null); }} className="btn-institutional h-12 px-10 text-[10px]">Cerrar Visor</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Alta Rápida de CCT */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-[#B38E5D] text-white">
            <DialogTitle className="uppercase font-black text-lg flex items-center gap-3"><PlusCircle className="h-6 w-6" /> Registro de Nuevo CCT</DialogTitle>
            <DialogDescription className="text-white/80 text-[10px] font-bold uppercase mt-1">Sume un nuevo plantel a la base maestra del sistema.</DialogDescription>
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
                  <Label className="text-[10px] font-black uppercase text-primary">Domicilio (Calle y Número)</Label>
                  <Input value={quickAddForm.domicilio} onChange={e => setQuickAddForm({...quickAddForm, domicilio: e.target.value})} className="font-bold border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Teléfono</Label>
                  <Input value={quickAddForm.telefono} onChange={e => setQuickAddForm({...quickAddForm, telefono: e.target.value})} className="font-mono font-black border-slate-200" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Localidad</Label>
                  <Input value={quickAddForm.localidad} onChange={e => setQuickAddForm({...quickAddForm, localidad: e.target.value})} className="font-bold border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Municipio</Label>
                  <Input value={quickAddForm.municipio} onChange={e => setQuickAddForm({...quickAddForm, municipio: e.target.value.toUpperCase()})} className="font-bold uppercase border-slate-200" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Sector</Label>
                  <Input value={quickAddForm.sector} onChange={e => setQuickAddForm({...quickAddForm, sector: e.target.value})} className="font-black border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Zona Escolar</Label>
                  <Input value={quickAddForm.zonaEscolar} onChange={e => setQuickAddForm({...quickAddForm, zonaEscolar: e.target.value})} className="font-black border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Modalidad</Label>
                  <Select value={quickAddForm.modalidad} onValueChange={v => setQuickAddForm({...quickAddForm, modalidad: v})}>
                    <SelectTrigger className="text-[10px] font-bold uppercase border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DES" className="text-[10px] font-bold">DES (GENERAL)</SelectItem>
                      <SelectItem value="DST" className="text-[10px] font-bold">DST (TÉCNICA)</SelectItem>
                      <SelectItem value="DTV" className="text-[10px] font-bold">DTV (TELESECUNDARIA)</SelectItem>
                      <SelectItem value="ADG" className="text-[10px] font-bold">ADG (DEPARTAMENTO)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Turno</Label>
                  <Select value={quickAddForm.turno} onValueChange={v => setQuickAddForm({...quickAddForm, turno: v})}><SelectTrigger className="text-[10px] font-bold uppercase border-slate-200"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MATUTINO">MATUTINO</SelectItem><SelectItem value="VESPERTINO">VESPERTINO</SelectItem><SelectItem value="MIXTO">MIXTO</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Valle</Label>
                  <Select value={quickAddForm.valle} onValueChange={v => setQuickAddForm({...quickAddForm, valle: v})}><SelectTrigger className="text-[10px] font-bold uppercase border-slate-200"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MEXICO">MÉXICO</SelectItem><SelectItem value="TOLUCA">TOLUCA</SelectItem></SelectContent></Select>
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
