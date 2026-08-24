'use client'
import { useState, useMemo, useEffect } from 'react'
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
import { cn } from "@/lib/utils"
import { 
  Database, 
  Search, 
  School, 
  Users, 
  PlusCircle, 
  LayoutGrid, 
  MapPin, 
  Building2, 
  ClipboardList, 
  Pencil, 
  Trash2,
  User, 
  Phone, 
  FileSpreadsheet,
  ListFilter,
  X
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from 'xlsx'

export default function BaseCctPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [schools, setSchools] = useState<SchoolInfo[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const initialFormState: SchoolInfo = {
    region: '', valle: 'MEXICO', dsr: '1', municipio: '', subsistema: 'FEDERALIZADO',
    control: 'OFICIAL', nivel: 'SECUNDARIA', servicioEducativo: 'SECUNDARIA GENERAL',
    cct: '', turno: 'MATUTINO', nombre: '', hombres: 0, mujeres: 0, alumnos: 0,
    grupos: 0, maestros: 0, administrativos: 0, aulasExistentes: 0, aulasEnUso: 0,
    modalidad: 'DES', zonaEscolar: '', sector: '', director: '', telefono: '',
    domicilio: '', localidad: ''
  }

  const [formData, setFormData] = useState<SchoolInfo>(initialFormState)

  useEffect(() => {
    setMounted(true)
    const stored = JSON.parse(localStorage.getItem('schools_master_full_v21') || '[]')
    if (stored.length === 0 || stored.length < 500) {
      setSchools(schoolsDirectory)
      localStorage.setItem('schools_master_full_v21', JSON.stringify(schoolsDirectory))
    } else {
      setSchools(stored)
    }
  }, [])

  const filteredSchools = useMemo(() => {
    if (!searchTerm) return schools;
    const term = searchTerm.toUpperCase();
    return schools.filter(s => {
      const cctMatch = (s.cct || '').toUpperCase().includes(term);
      const nameMatch = (s.nombre || '').toUpperCase().includes(term);
      const dirMatch = (s.director || '').toUpperCase().includes(term);
      const telMatch = (s.telefono || '').toUpperCase().includes(term);
      const munMatch = (s.municipio || '').toUpperCase().includes(term);
      return cctMatch || nameMatch || dirMatch || telMatch || munMatch;
    });
  }, [searchTerm, schools]);

  const downloadExcel = () => {
    if (filteredSchools.length === 0) {
      toast({ variant: "destructive", title: "Sin datos", description: "No hay registros para exportar." })
      return
    }

    const dataToExport = filteredSchools.map(s => ({
      'Región': s.region,
      'Valle': s.valle,
      'Municipio': s.municipio,
      'CCT': s.cct,
      'Turno': s.turno,
      'Nombre del Plantel': s.nombre,
      'Director(a)': s.director,
      'Teléfono': s.telefono,
      'Modalidad': s.modalidad,
      'Zona Escolar': s.zonaEscolar,
      'Sector': s.sector,
      'Alumnos': s.alumnos,
      'Hombres': s.hombres,
      'Mujeres': s.mujeres,
      'Grupos': s.grupos,
      'Maestros': s.maestros,
      'Administrativos': s.administrativos,
      'Aulas Existentes': s.aulasExistentes,
      'Aulas en Uso': s.aulasEnUso,
      'Domicilio': s.domicilio,
      'Localidad': s.localidad
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Base Maestra CCT");
    
    const fileName = `Base_Maestra_CCT_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast({ title: "Exportación Exitosa", description: "El catálogo de CCT se ha descargado correctamente." })
  };

  const handleEdit = (school: SchoolInfo) => {
    setFormData(school)
    setEditingId(`${school.cct}-${school.turno}`)
    setIsDialogOpen(true)
  }

  const handleDelete = (cct: string, turno: string) => {
    const updated = schools.filter(s => !(s.cct === cct && s.turno === turno))
    setSchools(updated)
    localStorage.setItem('schools_master_full_v21', JSON.stringify(updated))
    toast({ title: "Registro eliminado", description: `Se ha quitado ${cct} de la base maestra.` })
  }

  const handleSave = () => {
    if (!formData.cct || !formData.nombre) {
      toast({ variant: "destructive", title: "Campos obligatorios", description: "CCT y Nombre son necesarios." })
      return
    }

    const cctVal = formData.cct.toUpperCase()
    let mod = 'PES'
    if (cctVal.includes('DES')) mod = 'DES'
    else if (cctVal.includes('DST')) mod = 'DST'
    else if (cctVal.includes('DTV')) mod = 'DTV'

    const schoolToSave: SchoolInfo = {
      ...formData,
      cct: cctVal,
      nombre: formData.nombre.toUpperCase(),
      alumnos: (formData.hombres || 0) + (formData.mujeres || 0),
      modalidad: mod
    }

    let updated;
    if (editingId) {
      updated = schools.map(s => (`${s.cct}-${s.turno}` === editingId) ? schoolToSave : s)
      toast({ title: "Plantel Actualizado", description: `Se guardaron los cambios en ${schoolToSave.cct}.` })
    } else {
      updated = [schoolToSave, ...schools]
      toast({ title: "Plantel Registrado", description: `Se ha añadido ${schoolToSave.cct} a la base maestra.` })
    }

    setSchools(updated)
    localStorage.setItem('schools_master_full_v21', JSON.stringify(updated))
    setIsDialogOpen(false)
    setFormData(initialFormState)
    setEditingId(null)
  }

  if (!mounted) return null

  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-primary uppercase leading-none">Base Maestra CCT</h2>
          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2 mt-1">
            <Database className="h-3.5 w-3.5 text-accent" /> Catálogo Institucional Edoméx 2026 - Datos Estadísticos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={downloadExcel} 
            variant="outline" 
            className="h-10 px-6 rounded-xl border-emerald-200 text-emerald-700 font-black uppercase text-[9px] gap-2 hover:bg-emerald-50 shadow-md"
          >
            <FileSpreadsheet className="h-4 w-4" /> Exportar a Excel
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setFormData(initialFormState);
              setEditingId(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="btn-institutional h-10 px-8 rounded-xl shadow-lg text-[9px]">
                <PlusCircle className="h-4 w-4 mr-2" /> Nuevo Registro CCT
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem]">
              <DialogHeader className="p-8 pb-4">
                <DialogTitle className="uppercase font-black text-primary text-2xl">
                  {editingId ? 'Editar Centro de Trabajo' : 'Alta de Centro de Trabajo'}
                </DialogTitle>
                <DialogDescription className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">
                  Ingrese los datos estadísticos, geográficos y de contacto del plantel federalizado.
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6">
                  <div className="md:col-span-3 border-b border-slate-100 pb-2">
                    <h3 className="text-[11px] font-black uppercase text-accent flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4" /> Identificación Institucional
                    </h3>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">CCT (10 Caracteres)</Label>
                    <Input maxLength={10} className="font-mono uppercase h-11 border-primary/10" value={formData.cct} onChange={e => setFormData({...formData, cct: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Nombre del Centro de Trabajo</Label>
                    <Input className="font-bold h-11 border-primary/10" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value.toUpperCase()})} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Turno</Label>
                    <Select value={formData.turno} onValueChange={val => setFormData({...formData, turno: val})}>
                      <SelectTrigger className="h-11 border-primary/10 font-bold uppercase"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MATUTINO">MATUTINO</SelectItem>
                        <SelectItem value="VESPERTINO">VESPERTINO</SelectItem>
                        <SelectItem value="DISCONTINUO">DISCONTINUO</SelectItem>
                        <SelectItem value="NOCTURNO">NOCTURNO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Servicio Educativo</Label>
                    <Input className="h-11 border-primary/10" value={formData.servicioEducativo} onChange={e => setFormData({...formData, servicioEducativo: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">DSR</Label>
                    <Input className="h-11 border-primary/10" value={formData.dsr} onChange={e => setFormData({...formData, dsr: e.target.value})} />
                  </div>

                  <div className="md:col-span-3 border-b border-slate-100 pb-2 mt-4">
                    <h3 className="text-[11px] font-black uppercase text-accent flex items-center gap-2">
                      <User className="h-4 w-4" /> Información de Contacto y Referencia
                    </h3>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Nombre del Director(a)</Label>
                    <Input className="font-bold h-11 border-primary/10" value={formData.director} onChange={e => setFormData({...formData, director: e.target.value.toUpperCase()})} placeholder="NOMBRE COMPLETO..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Teléfono de Contacto</Label>
                    <Input className="font-mono h-11 border-primary/10" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} placeholder="10 DÍGITOS..." />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Domicilio (Calle y Número)</Label>
                    <Input className="h-11 border-primary/10" value={formData.domicilio} onChange={e => setFormData({...formData, domicilio: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Localidad</Label>
                    <Input className="h-11 border-primary/10" value={formData.localidad} onChange={e => setFormData({...formData, localidad: e.target.value})} />
                  </div>

                  <div className="md:col-span-3 border-b border-slate-100 pb-2 mt-4">
                    <h3 className="text-[11px] font-black uppercase text-accent flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Ubicación y Jurisdicción
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Región</Label>
                    <Input className="h-11 border-primary/10" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Valle</Label>
                    <Select value={formData.valle} onValueChange={val => setFormData({...formData, valle: val})}>
                      <SelectTrigger className="h-11 border-primary/10 font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEXICO">MEXICO</SelectItem>
                        <SelectItem value="TOLUCA">TOLUCA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Municipio</Label>
                    <Input className="h-11 border-primary/10" value={formData.municipio} onChange={e => setFormData({...formData, municipio: e.target.value.toUpperCase()})} />
                  </div>

                  <div className="md:col-span-3 border-b border-slate-100 pb-2 mt-4">
                    <h3 className="text-[11px] font-black uppercase text-accent flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Datos Estadísticos e Infraestructura
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Hombres</Label>
                    <Input type="number" className="h-11 border-primary/10" value={formData.hombres} onChange={e => setFormData({...formData, hombres: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Mujeres</Label>
                    <Input type="number" className="h-11 border-primary/10" value={formData.mujeres} onChange={e => setFormData({...formData, mujeres: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Grupos</Label>
                    <Input type="number" className="h-11 border-primary/10" value={formData.grupos} onChange={e => setFormData({...formData, grupos: parseInt(e.target.value) || 0})} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Maestros</Label>
                    <Input type="number" className="h-11 border-primary/10" value={formData.maestros} onChange={e => setFormData({...formData, maestros: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Administrativos</Label>
                    <Input type="number" className="h-11 border-primary/10" value={formData.administrativos} onChange={e => setFormData({...formData, administrativos: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Aulas Existentes</Label>
                    <Input type="number" className="h-11 border-primary/10" value={formData.aulasExistentes} onChange={e => setFormData({...formData, aulasExistentes: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Aulas en Uso</Label>
                    <Input type="number" className="h-11 border-primary/10" value={formData.aulasEnUso} onChange={e => setFormData({...formData, aulasEnUso: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter className="p-8 border-t bg-slate-50/50">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-12 px-10 rounded-xl font-bold uppercase text-xs">Cancelar</Button>
                <Button onClick={handleSave} className="btn-institutional h-12 px-16 rounded-xl text-xs">
                  {editingId ? 'Actualizar Plantel' : 'Guardar Plantel'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="executive-card p-4 bg-white/80 border-none shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Search className="h-4 w-4 text-primary" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Buscador:</span>
          </div>
          
          <div className="relative flex-1 w-full group">
            <Input 
              placeholder="BUSCAR POR CCT, ESCUELA, DIRECTOR O TELÉFONO..." 
              className="h-10 rounded-xl bg-slate-50 border-primary/10 pl-10 pr-4 text-[10px] font-bold uppercase shadow-inner focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchTerm && setIsResultsDialogOpen(true)}
            />
            <Search className="absolute left-4 top-3.5 h-3.5 w-3.5 text-slate-300 group-focus-within:text-primary transition-colors" />
          </div>

          <div className="flex items-center gap-2">
             <Button 
                onClick={() => searchTerm && setIsResultsDialogOpen(true)} 
                disabled={!searchTerm}
                className="btn-institutional h-10 px-4 rounded-xl shadow-md text-[8px] gap-2 disabled:opacity-50"
              >
               <ListFilter className="h-3 w-3" /> VER RESULTADOS ({filteredSchools.length})
             </Button>
             <Badge variant="outline" className="h-10 px-4 rounded-xl border-primary/20 text-primary font-black text-[9px] uppercase">
               TOTAL: {schools.length}
             </Badge>
          </div>
        </div>
      </Card>

      <Card className="executive-card p-0 overflow-hidden">
        <div className="w-full">
          <Table className="w-full border-collapse">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="h-10">
                <TableHead className="w-10 text-[8px] font-black uppercase text-center pl-4">#</TableHead>
                <TableHead className="text-[8px] font-black uppercase">Región / Valle</TableHead>
                <TableHead className="text-[8px] font-black uppercase">Municipio</TableHead>
                <TableHead className="text-[8px] font-black uppercase w-16 text-center">Turno</TableHead>
                <TableHead className="text-[8px] font-black uppercase w-20 text-center">CCT</TableHead>
                <TableHead className="text-[8px] font-black uppercase">Nombre del Centro</TableHead>
                <TableHead className="text-[8px] font-black uppercase">Director(a)</TableHead>
                <TableHead className="text-[8px] font-black uppercase w-20 text-center">Teléfono</TableHead>
                <TableHead className="text-[8px] font-black uppercase text-center w-12">Alums</TableHead>
                <TableHead className="text-[8px] font-black uppercase text-center w-12">Gpos</TableHead>
                <TableHead className="text-right text-[8px] font-black uppercase pr-6 w-16">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchools.length > 0 ? filteredSchools.slice(0, 100).map((s, idx) => (
                <TableRow key={`${s.cct}-${s.turno}-${idx}`} className="hover:bg-slate-50 transition-colors group h-14">
                  <TableCell className="text-center font-black text-[9px] text-muted-foreground pl-4">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-700 uppercase leading-none">{s.region}</span>
                      <span className="text-[7px] font-bold text-accent uppercase tracking-widest mt-0.5">Valle {s.valle}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[9px] font-bold text-slate-500 uppercase truncate max-w-[80px]">{s.municipio}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={cn("text-[7px] font-black py-0 px-1.5 h-4", s.turno === 'MATUTINO' ? 'border-emerald-200 text-emerald-600' : 'border-amber-200 text-amber-600')}>
                      {s.turno?.slice(0, 3)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-black text-[9px] text-primary text-center">{s.cct}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0">
                        <School className="h-3 w-3" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-black text-slate-700 uppercase leading-tight truncate max-w-[140px]">
                          {s.nombre}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 min-w-0">
                       <User className="h-2.5 w-2.5 text-accent shrink-0" />
                       <span className="text-[9px] font-bold uppercase text-slate-600 truncate max-w-[120px]">{s.director || 'POR ASIGNAR'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-[9px] font-mono font-bold text-slate-600">{s.telefono || 'S/D'}</span>
                  </TableCell>
                  <TableCell className="text-center font-black text-primary text-[10px]">{s.alumnos}</TableCell>
                  <TableCell className="text-center font-black text-slate-600 text-[10px]">{s.grupos}</TableCell>
                  <TableCell className="text-right pr-4">
                     <div className="flex justify-end gap-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10 rounded-lg transition-colors" onClick={() => handleEdit(s)}>
                            <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" onClick={() => handleDelete(s.cct, s.turno)}>
                            <Trash2 className="h-3 w-3" />
                        </Button>
                     </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-20 bg-slate-50/20">
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <Search className="h-8 w-8 text-primary" />
                      <p className="text-[9px] font-black uppercase text-muted-foreground">Sin planteles encontrados.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isResultsDialogOpen} onOpenChange={setIsResultsDialogOpen}>
        <DialogContent className="sm:max-w-[1200px] h-[85vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <DialogHeader className="p-8 bg-slate-50 border-b shrink-0 flex flex-row justify-between items-center pr-12">
            <div className="space-y-1">
              <DialogTitle className="uppercase font-black text-primary text-xl flex items-center gap-3">
                <Search className="h-7 w-7 text-accent" /> Resultados Catálogo CCT
              </DialogTitle>
              <DialogDescription className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">
                Coincidencias encontradas para: <span className="text-primary font-black">"{searchTerm.toUpperCase()}"</span>
              </DialogDescription>
            </div>
            <div className="flex items-center gap-4">
               <Badge className="bg-primary text-white font-black px-4 h-8 rounded-xl shadow-lg uppercase text-[10px]">
                 {filteredSchools.length} Registros Encontrados
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
                         <TableHead className="text-[9px] font-black uppercase pl-8 py-4">Centro de Trabajo</TableHead>
                         <TableHead className="text-[9px] font-black uppercase">CCT / Turno</TableHead>
                         <TableHead className="text-[9px] font-black uppercase">Ubicación Geográfica</TableHead>
                         <TableHead className="text-[9px] font-black uppercase">Director(a)</TableHead>
                         <TableHead className="text-[9px] font-black uppercase text-center">Estadística</TableHead>
                         <TableHead className="text-right pr-10 text-[9px] font-black uppercase">Acciones</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {filteredSchools.map((s, idx) => (
                        <TableRow key={`res-cct-${s.cct}-${s.turno}-${idx}`} className="hover:bg-slate-50 transition-colors h-16 group">
                           <TableCell className="pl-8 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                    <School className="h-5 w-5" />
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-700 uppercase leading-none truncate max-w-[200px]">{s.nombre}</span>
                                    <span className="text-[8px] font-bold text-muted-foreground mt-1 uppercase">{s.servicioEducativo}</span>
                                 </div>
                              </div>
                           </TableCell>
                           <TableCell>
                              <div className="flex flex-col">
                                 <span className="font-mono text-[10px] font-black text-primary leading-none">{s.cct}</span>
                                 <Badge variant="outline" className="text-[7px] font-black uppercase border-slate-200 mt-1 h-4 w-fit px-1">{s.turno}</Badge>
                              </div>
                           </TableCell>
                           <TableCell>
                              <div className="flex flex-col">
                                 <span className="text-[9px] font-black text-slate-600 uppercase">{s.municipio}</span>
                                 <span className="text-[8px] font-bold text-accent uppercase mt-0.5">{s.region} • Valle {s.valle}</span>
                              </div>
                           </TableCell>
                           <TableCell>
                              <div className="flex items-center gap-2">
                                 <User className="h-3 w-3 text-slate-300" />
                                 <span className="text-[9px] font-bold uppercase text-slate-600">{s.director}</span>
                              </div>
                           </TableCell>
                           <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                 <span className="text-[10px] font-black text-primary">{s.alumnos} Alums</span>
                                 <span className="text-[8px] font-bold text-slate-400">{s.grupos} Gpos</span>
                              </div>
                           </TableCell>
                           <TableCell className="text-right pr-10">
                              <div className="flex justify-end gap-1.5">
                                 <Button variant="outline" size="sm" onClick={() => { setFormData(s); setEditingId(`${s.cct}-${s.turno}`); setIsResultsDialogOpen(false); setIsDialogOpen(true); }} className="h-8 rounded-lg border-slate-200 text-primary font-black uppercase text-[8px] gap-2 hover:bg-primary/5">
                                    <Pencil className="h-3.5 w-3.5" /> Editar
                                 </Button>
                                 <Button variant="ghost" size="icon" onClick={() => handleDelete(s.cct, s.turno)} className="h-8 w-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
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
