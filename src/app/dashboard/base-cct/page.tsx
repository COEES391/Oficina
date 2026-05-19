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
import { Database, Search, School, Users, GraduationCap, PlusCircle, LayoutGrid, MapPin, Building2, ClipboardList, Pencil, User, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function BaseCctPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [schools, setSchools] = useState<SchoolInfo[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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
    // Usamos v14 para asegurar la carga completa de los 385+ registros con los nuevos campos de dirección y director
    const stored = JSON.parse(localStorage.getItem('schools_master_full_v14') || '[]')
    if (stored.length === 0) {
      setSchools(schoolsDirectory)
      localStorage.setItem('schools_master_full_v14', JSON.stringify(schoolsDirectory))
    } else {
      setSchools(stored)
    }
  }, [])

  const filteredSchools = useMemo(() => {
    if (!searchTerm) return schools;
    const term = searchTerm.toUpperCase();
    return schools.filter(s => {
      const cctMatch = s.cct?.toUpperCase().includes(term);
      const nameMatch = s.nombre?.toUpperCase().includes(term);
      const dirMatch = s.director?.toUpperCase().includes(term);
      const telMatch = s.telefono?.toUpperCase().includes(term);
      const munMatch = s.municipio?.toUpperCase().includes(term);
      return cctMatch || nameMatch || dirMatch || telMatch || munMatch;
    });
  }, [searchTerm, schools]);

  const handleEdit = (school: SchoolInfo) => {
    setFormData(school)
    setEditingId(`${school.cct}-${school.turno}`)
    setIsDialogOpen(true)
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
    localStorage.setItem('schools_master_full_v14', JSON.stringify(updated))
    setIsDialogOpen(false)
    setFormData(initialFormState)
    setEditingId(null)
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase leading-none">Base Maestra CCT</h2>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2 mt-1">
            <Database className="h-4 w-4 text-accent" /> Catálogo Institucional Edoméx 2026 - Datos Estadísticos
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setFormData(initialFormState);
            setEditingId(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="btn-institutional h-12 px-8 rounded-xl shadow-lg">
              <PlusCircle className="h-5 w-5 mr-2" /> Nuevo Registro CCT
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[1100px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem]">
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
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Zona Escolar</Label>
                  <Input className="h-11 border-primary/10" value={formData.zonaEscolar} onChange={e => setFormData({...formData, zonaEscolar: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Sector</Label>
                  <Input className="h-11 border-primary/10" value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value})} />
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
                  <Label className="text-[10px] font-black uppercase text-primary">Aulas en Uso</Label>
                  <Input type="number" className="h-11 border-primary/10" value={formData.aulasEnUso} onChange={e => setFormData({...formData, aulasEnUso: parseInt(e.target.value) || 0})} />
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="p-8 border-t bg-slate-50/50">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-14 px-10 rounded-xl font-bold uppercase text-xs">Cancelar</Button>
              <Button onClick={handleSave} className="btn-institutional h-14 px-16 rounded-xl text-xs">
                {editingId ? 'Actualizar Plantel' : 'Guardar Plantel'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="executive-card p-6 bg-white/80 border-none shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Search className="h-5 w-5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buscador Operativo:</span>
          </div>
          
          <div className="relative flex-1 w-full">
            <Input 
              placeholder="Buscar por CCT, Escuela, Director o Teléfono..." 
              className="h-12 rounded-xl bg-slate-50 border-primary/10 pl-12 text-sm font-bold uppercase shadow-inner focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
          </div>

          <Badge variant="outline" className="h-12 px-6 rounded-xl border-primary/20 text-primary font-black text-[10px] uppercase">
            Registros: {filteredSchools.length}
          </Badge>
        </div>
      </Card>

      <Card className="executive-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-12 text-[10px] font-black uppercase text-center">#</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Región / Valle</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Municipio</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Turno</TableHead>
                <TableHead className="text-[10px] font-black uppercase">CCT</TableHead>
                <TableHead className="text-[10px] font-black uppercase min-w-[200px]">Nombre del Centro</TableHead>
                <TableHead className="text-[10px] font-black uppercase min-w-[200px]">Director(a)</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Teléfono</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center"><Users className="h-3 w-3 inline mr-1" /> Alums</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center"><ClipboardList className="h-3 w-3 inline mr-1" /> Gpos</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">DSR</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase pr-10">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchools.length > 0 ? filteredSchools.map((s, idx) => (
                <TableRow key={`${s.cct}-${s.turno}-${idx}`} className="hover:bg-slate-50 transition-colors group">
                  <TableCell className="text-center font-black text-[10px] text-muted-foreground">{idx + 1}.-</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-700">{s.region}</span>
                      <span className="text-[8px] font-bold text-accent uppercase tracking-widest">Valle de {s.valle}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[10px] font-bold text-slate-500 uppercase">{s.municipio}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[8px] font-black", s.turno === 'MATUTINO' ? 'border-emerald-200 text-emerald-600' : 'border-amber-200 text-amber-600')}>
                      {s.turno}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-black text-[10px] text-primary group-hover:scale-105 transition-transform">{s.cct}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <School className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-700 uppercase leading-tight max-w-[200px]">
                          {s.nombre}
                        </span>
                        <span className="text-[8px] text-muted-foreground font-bold">{s.servicioEducativo}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <User className="h-3 w-3 text-accent" />
                       <span className="text-[10px] font-bold uppercase text-slate-600">{s.director || 'POR ASIGNAR'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Phone className="h-3 w-3 text-emerald-500" />
                       <span className="text-[10px] font-mono font-bold text-slate-600">{s.telefono || 'S/D'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-black text-primary text-[11px]">{s.alumnos}</TableCell>
                  <TableCell className="text-center font-black text-slate-600 text-[11px]">{s.grupos}</TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-slate-100 text-slate-600 text-[10px] font-black">{s.dsr}</Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg transition-colors" onClick={() => handleEdit(s)}>
                        <Pencil className="h-4 w-4" />
                     </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-20 bg-slate-50/20">
                    <div className="flex flex-col items-center gap-3 opacity-40">
                      <Search className="h-10 w-10 text-primary" />
                      <p className="text-[10px] font-black uppercase text-muted-foreground">No se encontraron planteles con los criterios de búsqueda.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
