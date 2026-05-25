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
import { programsData, type ProgramStatus } from "@/lib/planning-data"
import { schoolsDirectory } from "@/lib/schools-directory"
import { cn } from "@/lib/utils"
import { 
  PlusCircle, 
  Pencil, 
  Activity,
  Target,
  MapPin,
  CheckCircle2,
  Plus,
  Search,
  School,
  Trash2
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
  "JEFE DE ENSEÑANZA",
  "SUPERVISOR",
  "ASESOR TECNICO PEDAGOGICO",
  "INTENDENTE",
  "PREFECTO",
  "TRABAJADOR SOCIAL"
]

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [activeTab, setActiveTab] = useState(PROGRAM_RUBROS[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setMounted(true)
    const stored = JSON.parse(localStorage.getItem('programs_full_v2') || '[]')
    if (stored.length === 0) {
      setRecords(programsData)
      localStorage.setItem('programs_full_v2', JSON.stringify(programsData))
    } else {
      setRecords(stored)
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
    
    const updated = editingId ? records.map(r => r.id === editingId ? formData : r) : [formData, ...records];
    setRecords(updated)
    localStorage.setItem('programs_full_v2', JSON.stringify(updated))
    setIsDialogOpen(false)
    setEditingId(null)
    setFormData(initialFormState)
    toast({ title: "Registro guardado con éxito" })
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
          (a.email || '').toUpperCase().includes(term)
        ))
      );
    }
    return filtered;
  }, [records, activeTab, searchTerm]);

  const handleEdit = (rec: ProgramStatus) => {
    setFormData(rec);
    setEditingId(rec.id);
    setIsDialogOpen(true);
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
                      <TableHead className="text-[10px] font-black uppercase">Plantel</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Contacto Principal / Email</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-center">Personal</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase pr-8">Acción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length > 0 ? filteredRecords.map((rec, idx) => (
                    <TableRow key={rec.id} className="hover:bg-slate-50 transition-colors group">
                      <TableCell className="text-center font-black text-[10px] text-muted-foreground">{idx + 1}.-</TableCell>
                      <TableCell className="font-black text-[10px] text-primary">{rec.cct}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-700 uppercase">{rec.schoolName}</TableCell>
                      <TableCell>
                        <span className="text-[10px] font-mono lowercase text-primary font-bold">
                          {rec.email || (rec.asistentes && rec.asistentes[0]?.email) || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {rec.asistentes && rec.asistentes.length > 0 ? (
                           <Badge variant="secondary" className="text-[9px] font-black">{rec.asistentes.length} SERVIDORES</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                         <Button variant="ghost" size="icon" onClick={() => handleEdit(rec)} className="h-8 w-8 hover:text-primary transition-colors"><Pencil className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 bg-slate-50/20">
                         <p className="text-[10px] font-black uppercase text-muted-foreground opacity-50">Sin resultados para la búsqueda.</p>
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
              Identificador Operativo: {editingId || 'Nuevo Registro'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="auditoria" className="flex-1 flex flex-col overflow-hidden">
             <div className="px-8 border-b bg-slate-50/50">
                <TabsList className="bg-transparent h-12 p-0 gap-6">
                  <TabsTrigger value="auditoria" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-[11px] font-black uppercase tracking-wider transition-all">
                    1. Datos de Auditoría
                  </TabsTrigger>
                  <TabsTrigger value="asistentes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-[11px] font-black uppercase tracking-wider transition-all">
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
                            <Input className="h-14 font-mono uppercase border-primary/10 text-lg bg-slate-50 focus:bg-white" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-primary tracking-widest">Estatus Operativo</Label>
                            <Select value={formData.status} onValueChange={(val:any) => setFormData({...formData, status: val})}>
                              <SelectTrigger className="h-14 border-primary/10 font-black text-[11px] bg-slate-50 uppercase"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="activo" className="text-[11px] font-black uppercase">ACTIVO</SelectItem>
                                <SelectItem value="concluido" className="text-[11px] font-black uppercase">CONCLUIDO</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2">CCT del Plantel</Label>
                            <Input placeholder="EJ: 15DESXXXXX" className="h-12 font-mono uppercase border-primary/10 bg-slate-50" value={formData.cct} onChange={e => handleCctChange(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-primary tracking-widest">Nombre Institucional</Label>
                            <Input value={formData.schoolName} readOnly className="h-12 font-bold bg-slate-100 uppercase" />
                          </div>

                          <div className="col-span-1 md:col-span-2 space-y-4 pt-4 border-t">
                             <Label className="text-[11px] font-black uppercase text-primary">Observaciones Técnicas</Label>
                             <Textarea className="min-h-[120px] bg-slate-50 border-primary/10 rounded-2xl p-5" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} />
                          </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="asistentes" className="h-full m-0 p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      <p className="text-[10px] font-bold text-blue-800 uppercase">Personal y cuentas asociadas a este centro de trabajo.</p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden border rounded-xl shadow-sm">
                    <ScrollArea className="h-full">
                      <Table>
                        <TableHeader className="bg-slate-100 sticky top-0 z-10">
                          <TableRow>
                            <TableHead className="w-10 text-[10px] font-black uppercase">#</TableHead>
                            <TableHead className="min-w-[250px] text-[10px] font-black uppercase">Nombre del Servidor Público</TableHead>
                            <TableHead className="min-w-[150px] text-[10px] font-black uppercase">RFC</TableHead>
                            <TableHead className="min-w-[180px] text-[10px] font-black uppercase">Función</TableHead>
                            <TableHead className="min-w-[250px] text-[10px] font-black uppercase">Correo @desysa.edu.mx</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.asistentes?.map((ast: any, idx: number) => (
                            <TableRow key={idx} className="hover:bg-slate-50/50">
                              <TableCell className="text-center font-bold text-xs text-muted-foreground">{idx + 1}</TableCell>
                              <TableCell className="p-4 font-bold text-xs uppercase">{ast.nombres} {ast.paterno} {ast.materno}</TableCell>
                              <TableCell className="p-4 font-mono text-xs uppercase">{ast.rfc}</TableCell>
                              <TableCell className="p-4 text-[10px] font-black uppercase text-slate-500">{ast.funcion}</TableCell>
                              <TableCell className="p-4 text-[10px] font-mono lowercase border-primary/20 text-primary font-bold">{ast.email}</TableCell>
                            </TableRow>
                          ))}
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
            <Button onClick={handleSave} className="btn-institutional px-16 text-[10px] h-14 rounded-[1.2rem]">Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
