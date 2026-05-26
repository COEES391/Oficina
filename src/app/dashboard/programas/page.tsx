
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { programsData, type ProgramStatus } from "@/lib/planning-data"
import { schoolsDirectory } from "@/lib/schools-directory"
import { cn } from "@/lib/utils"
import { 
  PlusCircle, 
  Pencil, 
  Activity,
  Target,
  CheckCircle2,
  Plus,
  Search,
  Trash2,
  UserPlus,
  UserCog,
  GraduationCap
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const PROGRAM_RUBROS = [
  'Cuentas Institucionales',
  'Biblioteca Digital',
  'Geoposición',
  'Conoce mi Escuela',
  'ATRES'
];

const FUNCIONES = [
  "ADMINISTRATIVO",
  "DOCENTE",
  "DIRECTIVO",
  "SUBDIRECTOR",
  "JEFE DE ENSEÑANZA",
  "SUPERVISOR",
  "ASESOR TECNICO PEDAGOGICO",
  "INTENDENTE",
  "PREFECTO",
  "TRABAJADOR SOCIAL",
  "BIBLIOTECARIO",
  "CONTRALOR"
]

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [activeTab, setActiveTab] = useState(PROGRAM_RUBROS[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Assistant Sub-Dialog State
  const [isAssistantDialogOpen, setIsAssistantDialogOpen] = useState(false)
  const [editingAssistantIndex, setEditingAssistantIndex] = useState<number | null>(null)
  const [assistantForm, setAssistantForm] = useState({
    nombres: '',
    paterno: '',
    materno: '',
    rfc: '',
    funcion: '',
    email: ''
  })

  useEffect(() => {
    setMounted(true)
    const storedV23 = localStorage.getItem('programs_full_v23')
    
    if (storedV23) {
      setRecords(JSON.parse(storedV23))
    } else {
      const storedV22 = localStorage.getItem('programs_full_v22')
      let initialSet: ProgramStatus[] = []
      
      if (storedV22) {
        initialSet = JSON.parse(storedV22)
      }

      const masterData = programsData
      const finalSet = [...initialSet]

      masterData.forEach(master => {
        const exists = finalSet.find(e => (e.id === master.id) || (e.cct === master.cct && e.name === master.name))
        if (!exists) {
          finalSet.push(master)
        }
      })

      setRecords(finalSet)
      localStorage.setItem('programs_full_v23', JSON.stringify(finalSet))
    }
  }, [])

  const handleCctChange = (val: string) => {
    const cleanVal = val.toUpperCase();
    setFormData(prev => ({ ...prev, cct: cleanVal }));
    
    if (cleanVal.length === 10) {
      const school = schoolsDirectory.find(s => s.cct.toUpperCase() === cleanVal);
      if (school) {
        setFormData(prev => ({
          ...prev,
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

  const initialFormState: ProgramStatus = {
    id: '', name: '', progress: 0, status: 'activo', date: new Date().toISOString().split('T')[0], cct: '', schoolName: '', 
    zonaEscolar: '', sector: '', modalidad: '', municipio: '', region: '', valle: '',
    numeroEquipos: 0, observaciones: '', capacitacion: 'N', asistentes: [], email: '',
    latitud: '', longitud: '',
    tecnicos: ''
  }

  const [formData, setFormData] = useState<ProgramStatus>(initialFormState)

  const handleSave = () => {
    if (!formData.cct) {
      toast({ variant: "destructive", title: "Datos Incompletos", description: "El CCT es obligatorio." });
      return;
    }
    
    const updated = editingId 
      ? records.map(r => r.id === editingId ? formData : r) 
      : [{...formData, id: `SOL-${Date.now()}`}, ...records];
    
    setRecords(updated)
    localStorage.setItem('programs_full_v23', JSON.stringify(updated))
    setIsDialogOpen(false)
    setEditingId(null)
    setFormData(initialFormState)
    toast({ title: "Registro guardado con éxito" })
  }

  const handleDeleteRecord = (id: string) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    localStorage.setItem('programs_full_v23', JSON.stringify(updated));
    toast({ title: "Registro eliminado", description: "El registro ha sido borrado de la base maestra." });
  }

  const filteredRecords = useMemo(() => {
    let filtered = records.filter(r => r.name === activeTab);
    if (searchTerm) {
      const term = searchTerm.toUpperCase();
      filtered = filtered.filter(r => 
        (r.cct || '').toUpperCase().includes(term) || 
        (r.schoolName || '').toUpperCase().includes(term) ||
        (r.email || '').toUpperCase().includes(term) ||
        (r.asistentes?.some((a: any) => 
          (a.nombres || '').toUpperCase().includes(term) || 
          (a.paterno || '').toUpperCase().includes(term) || 
          (a.rfc || '').toUpperCase().includes(term) ||
          (a.email || '').toUpperCase().includes(term)
        ))
      );
    }
    return [...filtered].sort((a, b) => (a.cct || '').localeCompare(b.cct || ''));
  }, [records, activeTab, searchTerm]);

  const handleEdit = (rec: ProgramStatus) => {
    setFormData(rec);
    setEditingId(rec.id);
    setIsDialogOpen(true);
  }

  // Assistant Logic
  const handleOpenAddAssistant = () => {
    setEditingAssistantIndex(null)
    setAssistantForm({ nombres: '', paterno: '', materno: '', rfc: '', funcion: '', email: '' })
    setIsAssistantDialogOpen(true)
  }

  const handleOpenEditAssistant = (index: number) => {
    setEditingAssistantIndex(index)
    const ast = formData.asistentes![index]
    setAssistantForm({
      nombres: ast.nombres || '',
      paterno: ast.paterno || '',
      materno: ast.materno || '',
      rfc: ast.rfc || '',
      funcion: ast.funcion || '',
      email: ast.email || ''
    })
    setIsAssistantDialogOpen(true)
  }

  const handleSaveAssistant = () => {
    if (!assistantForm.nombres || !assistantForm.rfc) {
      toast({ variant: "destructive", title: "Faltan datos", description: "Nombre y RFC son obligatorios." })
      return
    }

    const newAsistentes = [...(formData.asistentes || [])]
    if (editingAssistantIndex !== null) {
      newAsistentes[editingAssistantIndex] = { ...assistantForm }
    } else {
      newAsistentes.push({ ...assistantForm })
    }

    setFormData({ ...formData, asistentes: newAsistentes })
    setIsAssistantDialogOpen(false)
    toast({ title: "Personal actualizado en la lista" })
  }

  const handleRemoveAssistant = (index: number) => {
    const newAsistentes = formData.asistentes?.filter((_, i) => i !== index)
    setFormData({ ...formData, asistentes: newAsistentes })
    toast({ title: "Registro eliminado de la lista" })
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase leading-none">Módulos Técnicos COEES</h2>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2 mt-1">
            <Activity className="h-4 w-4 text-accent" /> Control de Programas y Auditoría 2026
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSearchTerm(''); }} className="space-y-6">
        <TabsList className="w-full h-12 bg-white border border-slate-100 p-1 rounded-xl shadow-sm">
          {PROGRAM_RUBROS.map(rubro => (
            <TabsTrigger 
              key={rubro} 
              value={rubro} 
              className="flex-1 h-full text-[10px] font-black uppercase rounded-lg tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
            >
              {rubro}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 animate-in fade-in duration-500">
          <Card className="executive-card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                 <Target className="h-6 w-6" />
               </div>
               <div>
                 <h3 className="text-xl font-black uppercase text-slate-900 leading-none">{activeTab}</h3>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Registros de Auditoría Técnica</p>
               </div>
             </div>

             <div className="flex flex-1 max-md:w-full relative">
               <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
               <Input 
                 placeholder="Filtrar por CCT, Plantel, Nombre de trabajador o Correo..." 
                 className="pl-10 h-10 rounded-xl border-primary/10 bg-slate-50 text-[10px] font-bold uppercase shadow-inner focus:bg-white transition-all"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>

             <Button onClick={() => { setFormData({...initialFormState, name: activeTab}); setEditingId(null); setIsDialogOpen(true); }} className="btn-institutional px-8 text-[11px] h-10">
                <PlusCircle className="h-5 w-5 mr-2" /> Nuevo Registro
             </Button>
          </Card>

          <Card className="executive-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                   <TableRow>
                      <TableHead className="w-12 text-[10px] font-black uppercase text-center">#</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">CCT</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">
                        {activeTab === 'Geoposición' ? 'Longitud' : 'Plantel'}
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase">
                        {activeTab === 'Geoposición' ? 'Latitud' : (activeTab === 'Biblioteca Digital' ? 'Estatus Operativo' : 'Contacto Principal / Email')}
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-center">
                        {activeTab === 'Geoposición' ? 'Estado (Activo/Inactivo)' : (activeTab === 'Biblioteca Digital' ? 'Equipos' : 'Cuentas')}
                      </TableHead>
                      {activeTab === 'Biblioteca Digital' && (
                        <TableHead className="text-[10px] font-black uppercase text-center"># Capacitados</TableHead>
                      )}
                      <TableHead className="text-right text-[10px] font-black uppercase pr-8">Acción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length > 0 ? filteredRecords.map((rec, idx) => (
                    <TableRow key={rec.id} className="hover:bg-slate-50 transition-colors group">
                      <TableCell className="text-center font-black text-[10px] text-muted-foreground">{idx + 1}.-</TableCell>
                      <TableCell className="font-black text-[10px] text-primary">{rec.cct}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-700 uppercase">
                        {activeTab === 'Geoposición' ? (rec.longitud || 'S/D') : rec.schoolName}
                      </TableCell>
                      <TableCell>
                        {activeTab === 'Geoposición' ? (
                          <span className="text-[10px] font-mono font-bold text-primary">{rec.latitud || 'S/D'}</span>
                        ) : activeTab === 'Biblioteca Digital' ? (
                           <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 text-primary">
                             {rec.status?.toUpperCase() || 'ACTIVO'}
                           </Badge>
                        ) : (
                          <div className="flex flex-col">
                             <span className="text-[10px] font-mono lowercase text-primary font-bold">
                                {rec.email || (rec.asistentes && rec.asistentes[0]?.email) || 'S/D'}
                             </span>
                             {rec.asistentes && rec.asistentes.length > 1 && (
                               <span className="text-[8px] font-black uppercase text-muted-foreground">+{rec.asistentes.length - 1} cuentas adicionales</span>
                             )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {activeTab === 'Geoposición' ? (
                          <Badge variant={rec.status === 'activo' ? 'default' : 'outline'} className={cn("text-[9px] font-black uppercase", rec.status === 'activo' ? "bg-emerald-500 hover:bg-emerald-600" : "")}>
                            {rec.status?.toUpperCase() || 'INACTIVO'}
                          </Badge>
                        ) : activeTab === 'Biblioteca Digital' ? (
                           <span className="font-black text-xs text-primary">{rec.numeroEquipos || 0}</span>
                        ) : (
                          rec.asistentes && rec.asistentes.length > 0 ? (
                             <Badge variant="secondary" className="text-[9px] font-black">{rec.asistentes.length} SERVIDORES</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] font-black opacity-30">0</Badge>
                          )
                        )}
                      </TableCell>
                      {activeTab === 'Biblioteca Digital' && (
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-[9px] font-black bg-accent/10 text-accent border-accent/20">
                            {rec.asistentes?.length || 0} PERSONAL
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell className="text-right pr-8">
                         <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(rec)} className="h-8 w-8 hover:text-primary transition-colors">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteRecord(rec.id)} className="h-8 w-8 text-slate-400 hover:text-rose-600 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={activeTab === 'Biblioteca Digital' ? 7 : 6} className="text-center py-20 bg-slate-50/20">
                         <div className="flex flex-col items-center gap-2 opacity-40">
                            <Search className="h-10 w-10 text-primary" />
                            <p className="text-[10px] font-black uppercase text-muted-foreground">Sin resultados para la búsqueda.</p>
                         </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[1400px] rounded-[2rem] border-none shadow-2xl h-[95vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="uppercase font-black text-primary text-2xl flex items-center gap-3">
              <Target className="h-7 w-7 text-accent" /> Gestión de {activeTab}
            </DialogTitle>
            <DialogDescription className="font-bold text-[10px] uppercase tracking-widest">
              Identificador Operativo: {formData.id || 'Nuevo Registro'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="auditoria" className="flex-1 flex flex-col overflow-hidden">
             <div className="px-8 border-b bg-slate-50/50">
                <TabsList className="bg-transparent h-12 p-0 gap-6">
                  <TabsTrigger value="auditoria" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-[11px] font-black uppercase tracking-wider transition-all">
                    1. Datos de Auditoría
                  </TabsTrigger>
                  <TabsTrigger 
                    value="asistentes" 
                    disabled={activeTab === 'Biblioteca Digital' && formData.capacitacion === 'N'}
                    className={cn(
                      "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-[11px] font-black uppercase tracking-wider transition-all",
                      activeTab === 'Biblioteca Digital' && formData.capacitacion === 'N' && "opacity-30"
                    )}
                  >
                    2. Lista de Cuentas / Personal
                  </TabsTrigger>
                </TabsList>
             </div>

             <div className="flex-1 overflow-hidden">
                <TabsContent value="auditoria" className="h-full m-0 p-0 overflow-hidden">
                  <ScrollArea className="h-full px-8">
                    <div className="grid gap-8 py-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2"># Solicitud</Label>
                            <Input className="h-14 font-mono uppercase border-primary/10 text-lg bg-slate-50 focus:bg-white shadow-inner" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-primary tracking-widest">Estatus Operativo</Label>
                            <Select value={formData.status} onValueChange={(val:any) => setFormData({...formData, status: val})}>
                              <SelectTrigger className="h-14 border-primary/10 font-black text-[11px] bg-slate-50 uppercase shadow-inner"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="activo" className="text-[11px] font-black uppercase">ACTIVO</SelectItem>
                                <SelectItem value="concluido" className="text-[11px] font-black uppercase">CONCLUIDO</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2">CCT del Plantel</Label>
                            <Input placeholder="EJ: 15DES0001X" className="h-12 font-mono uppercase border-primary/10 bg-slate-50 shadow-inner" value={formData.cct} onChange={e => handleCctChange(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-primary tracking-widest">Nombre Institucional</Label>
                            <Input value={formData.schoolName} readOnly className="h-12 font-bold bg-slate-100 uppercase border-none" />
                          </div>

                          {activeTab === 'Biblioteca Digital' && (
                             <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 items-end bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                                <div className="space-y-2">
                                  <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2">Número de Equipos</Label>
                                  <Input type="number" className="h-12 font-black text-lg bg-white border-primary/10" value={formData.numeroEquipos} onChange={e => setFormData({...formData, numeroEquipos: parseInt(e.target.value) || 0})} />
                                </div>
                                <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-primary/10 shadow-sm">
                                   <Checkbox 
                                     id="toggle-cap"
                                     checked={formData.capacitacion === 'S'}
                                     onCheckedChange={(checked) => setFormData({...formData, capacitacion: checked ? 'S' : 'N'})}
                                     className="h-6 w-6 border-primary/30 data-[state=checked]:bg-primary"
                                   />
                                   <div className="space-y-0.5">
                                      <Label htmlFor="toggle-cap" className="text-[10px] font-black uppercase text-primary cursor-pointer flex items-center gap-2">
                                        <GraduationCap className="h-3 w-3" /> ¿Brindar Capacitación?
                                      </Label>
                                      <p className="text-[8px] font-bold text-muted-foreground uppercase leading-none">Habilita registro de asistentes</p>
                                   </div>
                                </div>
                             </div>
                          )}

                          {activeTab === 'Geoposición' && (
                            <>
                              <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-primary tracking-widest">Latitud</Label>
                                <Input className="h-12 font-mono bg-slate-50 border-primary/10" value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} placeholder="EJ: 19.818" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-primary tracking-widest">Longitud</Label>
                                <Input className="h-12 font-mono bg-slate-50 border-primary/10" value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} placeholder="EJ: -99.146" />
                              </div>
                            </>
                          )}

                          <div className="col-span-1 md:col-span-2 space-y-4 pt-4 border-t">
                             <Label className="text-[11px] font-black uppercase text-primary">Observaciones Técnicas</Label>
                             <Textarea className="min-h-[120px] bg-slate-50 border-primary/10 rounded-2xl p-5 shadow-inner" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} />
                          </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="asistentes" className="h-full m-0 p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      <p className="text-[10px] font-bold text-blue-800 uppercase">Personal y cuentas asociadas a este centro de trabajo para auditoría.</p>
                    </div>
                    <Button onClick={handleOpenAddAssistant} className="gap-2 font-black uppercase text-[10px] h-10 px-6">
                      <UserPlus className="h-4 w-4" /> Añadir Registro de Personal
                    </Button>
                  </div>

                  <div className="flex-1 overflow-hidden border rounded-[2rem] shadow-lg bg-white">
                    <ScrollArea className="h-full">
                      <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10">
                          <TableRow>
                            <TableHead className="w-12 text-[10px] font-black uppercase text-center">#</TableHead>
                            <TableHead className="min-w-[280px] text-[10px] font-black uppercase">Nombre del Servidor Público</TableHead>
                            <TableHead className="min-w-[150px] text-[10px] font-black uppercase">RFC</TableHead>
                            <TableHead className="min-w-[180px] text-[10px] font-black uppercase">Función</TableHead>
                            <TableHead className="min-w-[250px] text-[10px] font-black uppercase">Correo @desysa.edu.mx</TableHead>
                            <TableHead className="w-24 text-right text-[10px] font-black uppercase pr-8">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.asistentes && formData.asistentes.length > 0 ? formData.asistentes.map((ast: any, idx: number) => (
                            <TableRow key={idx} className="hover:bg-slate-50/50 group">
                              <TableCell className="text-center font-bold text-xs text-muted-foreground">{idx + 1}</TableCell>
                              <TableCell className="p-4 font-black text-xs uppercase text-slate-700">
                                {ast.nombres} {ast.paterno} {ast.materno}
                              </TableCell>
                              <TableCell className="p-4 font-mono text-xs uppercase font-bold text-primary">{ast.rfc}</TableCell>
                              <TableCell className="p-4 text-[10px] font-black uppercase text-slate-500">
                                <Badge variant="outline" className="border-slate-200">{ast.funcion || 'NO ASIGNADA'}</Badge>
                              </TableCell>
                              <TableCell className="p-4 text-[10px] font-mono lowercase text-primary font-bold">
                                {ast.email}
                              </TableCell>
                              <TableCell className="p-4 text-right pr-6">
                                <div className="flex justify-end gap-1">
                                   <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => handleOpenEditAssistant(idx)}>
                                      <Pencil className="h-4 w-4" />
                                   </Button>
                                   <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={() => handleRemoveAssistant(idx)}>
                                      <Trash2 className="h-4 w-4" />
                                   </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-20 opacity-30">
                                 <p className="text-[10px] font-black uppercase">No hay personal registrado en este plantel.</p>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                </TabsContent>
             </div>
          </Tabs>
          
          <DialogFooter className="p-8 gap-4 border-t bg-slate-50/50">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-[1.2rem] h-14 text-[10px] font-black uppercase px-10 border-slate-200">Cerrar</Button>
            <Button onClick={handleSave} className="btn-institutional px-16 text-[10px] h-14 rounded-[1.2rem]">Guardar Cambios Institucionales</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sub-Dialog for Assistant Edit/Add */}
      <Dialog open={isAssistantDialogOpen} onOpenChange={setIsAssistantDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-slate-50 border-b">
            <DialogTitle className="uppercase font-black text-primary text-xl flex items-center gap-3">
              <UserCog className="h-6 w-6 text-accent" /> {editingAssistantIndex !== null ? 'Editar Personal' : 'Nuevo Registro de Personal'}
            </DialogTitle>
          </DialogHeader>

          <div className="p-8 grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-1">Nombre(s)</Label>
                <Input value={assistantForm.nombres} onChange={e => setAssistantForm({...assistantForm, nombres: e.target.value.toUpperCase()})} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-1">Ap. Paterno</Label>
                <Input value={assistantForm.paterno} onChange={e => setAssistantForm({...assistantForm, paterno: e.target.value.toUpperCase()})} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-1">Ap. Materno</Label>
                <Input value={assistantForm.materno} onChange={e => setAssistantForm({...assistantForm, materno: e.target.value.toUpperCase()})} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-1">RFC Oficial</Label>
                <Input value={assistantForm.rfc} onChange={e => setAssistantForm({...assistantForm, rfc: e.target.value.toUpperCase()})} className="h-11 rounded-xl font-mono uppercase" maxLength={13} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-1">Función Institucional</Label>
              <Select value={assistantForm.funcion} onValueChange={val => setAssistantForm({...assistantForm, funcion: val})}>
                <SelectTrigger className="h-11 rounded-xl font-bold uppercase text-[10px]"><SelectValue placeholder="SELECCIONAR FUNCIÓN..." /></SelectTrigger>
                <SelectContent>
                  {FUNCIONES.map(f => <SelectItem key={f} value={f} className="text-[10px] font-bold uppercase">{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-1">Correo Electrónico @desysa.edu.mx</Label>
              <Input value={assistantForm.email} onChange={e => setAssistantForm({...assistantForm, email: e.target.value.toLowerCase()})} className="h-11 rounded-xl font-mono" placeholder="ejemplo@desysa.edu.mx" />
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-3">
             <Button variant="ghost" onClick={() => setIsAssistantDialogOpen(false)} className="font-black text-[10px] uppercase h-12 px-8">Cancelar</Button>
             <Button onClick={handleSaveAssistant} className="btn-institutional h-12 px-12 text-[10px]">Actualizar Lista</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
