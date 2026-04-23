'use client'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { programsData as initialData, type ProgramStatus } from "@/lib/planning-data"
import { schoolsDirectory } from "@/lib/schools-directory"
import { FileText, Image as ImageIcon, Upload, X, Briefcase, Calendar, Search, School, Settings2, Users, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from 'next/image'

export default function ProgramsPage() {
  const { toast } = useToast()
  const [programs, setPrograms] = useState<ProgramStatus[]>([])
  const [selectedProgram, setSelectedProgram] = useState<ProgramStatus | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('programs_full') || '[]')
    if (stored.length === 0) {
      setPrograms(initialData)
      localStorage.setItem('programs_full', JSON.stringify(initialData))
    } else {
      const merged = initialData.map(initialProg => {
        const found = stored.find((s: ProgramStatus) => s.id === initialProg.id)
        return found ? found : initialProg
      })
      setPrograms(merged)
    }
  }, [])

  const handleSelectSchool = (cct: string) => {
    const school = schoolsDirectory.find(s => s.cct === cct);
    if (school && selectedProgram) {
      setSelectedProgram({
        ...selectedProgram,
        cct: school.cct,
        schoolName: school.nombre,
        zonaEscolar: school.zonaEscolar,
        sector: school.sector,
        modalidad: school.modalidad,
        municipio: school.municipio,
        region: school.region,
        valle: school.valle
      });
      setSearchTerm('');
      toast({ title: "Plantel Vinculado", description: `${school.nombre} cargado con éxito.` });
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'photo') => {
    if (!selectedProgram) return
    const files = e.target.files
    if (!files) return

    const updatedProgram = { ...selectedProgram }

    if (type === 'pdf') {
      const file = files[0]
      const reader = new FileReader()
      reader.onloadend = () => {
        updatedProgram.reportPdf = reader.result as string
        setSelectedProgram(updatedProgram)
      }
      reader.readAsDataURL(file)
    } else {
      const newPhotos = Array.from(files)
      if ((updatedProgram.evidencePhotos?.length || 0) + newPhotos.length > 5) {
        toast({ variant: "destructive", title: "Límite superado", description: "Máximo 5 fotos por rubro." })
        return
      }
      newPhotos.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setSelectedProgram(prev => {
            if (!prev) return null
            return {
              ...prev,
              evidencePhotos: [...(prev.evidencePhotos || []), reader.result as string]
            }
          })
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const saveProgramChanges = () => {
    if (!selectedProgram) return
    const updated = programs.map(p => p.id === selectedProgram.id ? selectedProgram : p)
    setPrograms(updated)
    localStorage.setItem('programs_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    toast({ title: "Información Actualizada", description: `Se han guardado los cambios en el rubro: ${selectedProgram.name}` })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-primary uppercase">Gestión de Programas Institucionales</h2>
        <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Seguimiento Transversal de Rubros Estratégicos</p>
      </div>

      <div className="grid gap-6">
        {programs.map((program) => (
          <Card key={program.id} className="shadow-md border-l-4 border-l-primary hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-black text-lg text-slate-800 uppercase">{program.name}</span>
                    <Badge variant={program.status === 'concluido' ? 'default' : program.status === 'activo' ? 'secondary' : 'outline'} className="uppercase text-[10px] font-black">
                      {program.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase ml-10">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Actualizado: {program.date}</span>
                    {program.reportPdf && <span className="flex items-center gap-1 text-emerald-600"><FileText className="h-3 w-3" /> PDF Cargado</span>}
                    {program.evidencePhotos && program.evidencePhotos.length > 0 && <span className="flex items-center gap-1 text-emerald-600"><ImageIcon className="h-3 w-3" /> {program.evidencePhotos.length} Evidencias</span>}
                    {program.cct && <span className="flex items-center gap-1 text-blue-600"><School className="h-3 w-3" /> {program.cct}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                   <div className="flex flex-col items-end mr-4">
                    <span className="text-[10px] font-black text-muted-foreground uppercase">Avance</span>
                    <span className="text-xl font-black text-primary">{program.progress}%</span>
                  </div>
                  <Dialog open={isDialogOpen && selectedProgram?.id === program.id} onOpenChange={(open) => {
                    setIsDialogOpen(open)
                    if (open) setSelectedProgram({ ...program })
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="default" className="gap-2 font-black uppercase text-xs h-10 shadow-sm">
                        <Upload className="h-4 w-4" /> Gestionar Rubro
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[1000px] h-[95vh] flex flex-col p-0">
                      <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="uppercase font-black text-primary text-xl flex items-center gap-2">
                          <Settings2 className="h-6 w-6" /> Gestión Técnica: {program.name}
                        </DialogTitle>
                        <DialogDescription className="font-bold text-xs uppercase">Complete la ficha técnica oficial y cargue la documentación de respaldo.</DialogDescription>
                      </DialogHeader>
                      
                      <ScrollArea className="flex-1 px-6 py-4">
                        <div className="space-y-8 pb-10">
                          {/* Sección 1: Datos Geográficos y del C.T. */}
                          <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase text-primary border-b pb-1 flex items-center gap-2">
                              <School className="h-4 w-4" /> 1. Información del Centro de Trabajo (C.T.)
                            </h3>
                            
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                              <div className="relative">
                                <Label className="text-[10px] font-black uppercase mb-1.5 block">Buscar Plantel por CCT o Nombre</Label>
                                <div className="flex gap-2">
                                  <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                      placeholder="Escriba 10 dígitos del CCT o nombre..." 
                                      className="pl-10 font-bold h-11" 
                                      value={searchTerm} 
                                      onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                                    />
                                  </div>
                                </div>
                                {searchTerm && (
                                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-xl max-h-60 overflow-auto">
                                    {schoolsDirectory.filter(s => s.cct.includes(searchTerm) || s.nombre.toUpperCase().includes(searchTerm)).slice(0, 8).map(s => (
                                      <div key={s.cct} className="p-3 hover:bg-primary/5 cursor-pointer border-b last:border-0" onClick={() => handleSelectSchool(s.cct)}>
                                        <p className="text-xs font-black text-primary">{s.cct}</p>
                                        <p className="text-[10px] font-bold uppercase">{s.nombre}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-1 md:col-span-2">
                                  <Label className="text-[10px] font-bold uppercase">Nombre C.T.</Label>
                                  <Input value={selectedProgram?.schoolName || ''} readOnly className="bg-white font-black text-xs uppercase" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold uppercase">C.C.T.</Label>
                                  <Input value={selectedProgram?.cct || ''} readOnly className="bg-white font-mono font-black text-xs" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold uppercase">Z.E.</Label>
                                  <Input value={selectedProgram?.zonaEscolar || ''} readOnly className="bg-white text-center font-bold" />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold uppercase">Sector</Label>
                                  <Input value={selectedProgram?.sector || ''} readOnly className="bg-white text-center" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold uppercase">Modalidad</Label>
                                  <Input value={selectedProgram?.modalidad || ''} readOnly className="bg-white text-xs uppercase" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold uppercase">Municipio</Label>
                                  <Input value={selectedProgram?.municipio || ''} readOnly className="bg-white text-xs uppercase" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold uppercase">Región</Label>
                                  <Input value={selectedProgram?.region || ''} readOnly className="bg-white text-xs uppercase" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold uppercase">Valle</Label>
                                  <Input value={selectedProgram?.valle || ''} readOnly className="bg-white text-xs uppercase" />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Sección 2: Equipamiento y Servicios */}
                          <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase text-primary border-b pb-1 flex items-center gap-2">
                              <Zap className="h-4 w-4" /> 2. Control de Equipos y Servicios
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-4 md:col-span-2">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase">No. de Equipos</Label>
                                    <Input type="number" value={selectedProgram?.numeroEquipos || 0} onChange={e => setSelectedProgram(prev => prev ? {...prev, numeroEquipos: parseInt(e.target.value) || 0} : null)} />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase">No. de Oficio</Label>
                                    <Input placeholder="EJ: OF-001/2024" value={selectedProgram?.numeroOficio || ''} onChange={e => setSelectedProgram(prev => prev ? {...prev, numeroOficio: e.target.value} : null)} />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold uppercase">Descripción del Equipo</Label>
                                  <Input placeholder="Marcas, modelos, características..." value={selectedProgram?.descripcionEquipo || ''} onChange={e => setSelectedProgram(prev => prev ? {...prev, descripcionEquipo: e.target.value} : null)} />
                                </div>
                              </div>
                              <div className="space-y-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <Label className="text-[10px] font-black uppercase text-blue-700">No. de Servicios Realizados</Label>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <Label className="text-[9px] font-bold uppercase">M.C. (Correctivos)</Label>
                                    <Input type="number" className="h-10 text-lg font-black text-center" value={selectedProgram?.serviciosMC || 0} onChange={e => setSelectedProgram(prev => prev ? {...prev, serviciosMC: parseInt(e.target.value) || 0} : null)} />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] font-bold uppercase">M.P. (Preventivos)</Label>
                                    <Input type="number" className="h-10 text-lg font-black text-center" value={selectedProgram?.serviciosMP || 0} onChange={e => setSelectedProgram(prev => prev ? {...prev, serviciosMP: parseInt(e.target.value) || 0} : null)} />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase">Fecha de Entrada</Label>
                                <Input type="date" value={selectedProgram?.fechaEntrada || ''} onChange={e => setSelectedProgram(prev => prev ? {...prev, fechaEntrada: e.target.value} : null)} />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase">Fecha de Salida</Label>
                                <Input type="date" value={selectedProgram?.fechaSalida || ''} onChange={e => setSelectedProgram(prev => prev ? {...prev, fechaSalida: e.target.value} : null)} />
                              </div>
                              <div className="space-y-1 md:col-span-2">
                                <Label className="text-[10px] font-bold uppercase">Responsable(s)</Label>
                                <Input placeholder="Nombres del personal encargado..." value={selectedProgram?.responsables?.join(', ') || ''} onChange={e => setSelectedProgram(prev => prev ? {...prev, responsables: [e.target.value]} : null)} />
                              </div>
                            </div>
                          </div>

                          {/* Sección 3: Estatus, SETES y Evidencias */}
                          <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase text-primary border-b pb-1 flex items-center gap-2">
                              <Users className="h-4 w-4" /> 3. Estatus Operativo y Evidencias
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-4">
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-black uppercase">Estatus del Rubro</Label>
                                  <Select value={selectedProgram?.status} onValueChange={(val: any) => setSelectedProgram(prev => prev ? { ...prev, status: val } : null)}>
                                    <SelectTrigger className="font-bold uppercase"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="planeacion" className="uppercase font-bold">Planeación</SelectItem>
                                      <SelectItem value="activo" className="uppercase font-bold text-blue-600">Activo / Proceso</SelectItem>
                                      <SelectItem value="concluido" className="uppercase font-bold text-emerald-600">Concluido / Meta</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-black uppercase">Avance (% {selectedProgram?.progress})</Label>
                                  <Input type="number" value={selectedProgram?.progress || 0} onChange={e => setSelectedProgram(prev => prev ? { ...prev, progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) } : null)} />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-black uppercase">SETES (S/N)</Label>
                                  <Select value={selectedProgram?.setes || 'N'} onValueChange={(val: any) => setSelectedProgram(prev => prev ? {...prev, setes: val} : null)}>
                                    <SelectTrigger className="font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="S">SÍ (Atención SETES)</SelectItem>
                                      <SelectItem value="N">NO (Regular)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="md:col-span-2 space-y-4">
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-black uppercase">Observaciones Operativas</Label>
                                  <Textarea 
                                    className="min-h-[120px] text-xs" 
                                    placeholder="Detalles adicionales, incidencias o notas relevantes..." 
                                    value={selectedProgram?.observaciones || ''} 
                                    onChange={e => setSelectedProgram(prev => prev ? {...prev, observaciones: e.target.value} : null)}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2 p-4 border border-dashed rounded-xl bg-slate-50">
                                <Label className="flex items-center gap-2 text-[11px] font-black uppercase"><FileText className="h-4 w-4 text-blue-600" /> Reporte Oficial (PDF)</Label>
                                <Input type="file" accept=".pdf" className="bg-white" onChange={e => handleFileUpload(e, 'pdf')} />
                                {selectedProgram?.reportPdf && (
                                  <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-100 rounded text-[10px] font-black text-emerald-700">
                                    <span>✓ PDF CARGADO</span>
                                    <button className="ml-auto text-rose-500" onClick={() => setSelectedProgram(prev => prev ? { ...prev, reportPdf: undefined } : null)}><X className="h-3 w-3" /></button>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2 p-4 border border-dashed rounded-xl bg-slate-50">
                                <Label className="flex items-center gap-2 text-[11px] font-black uppercase"><ImageIcon className="h-4 w-4 text-pink-600" /> Evidencias (MÁX 5)</Label>
                                <Input type="file" multiple accept="image/*" className="bg-white" onChange={e => handleFileUpload(e, 'photo')} disabled={(selectedProgram?.evidencePhotos?.length || 0) >= 5} />
                                <div className="flex gap-2 flex-wrap mt-2">
                                  {selectedProgram?.evidencePhotos?.map((p, i) => (
                                    <div key={i} className="relative h-14 w-14 border-2 border-white rounded shadow-sm overflow-hidden group">
                                      <Image src={p} alt="ev" fill className="object-cover" />
                                      <button className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white" onClick={() => setSelectedProgram(prev => prev ? { ...prev, evidencePhotos: prev.evidencePhotos?.filter((_, idx) => idx !== i) } : null)}><X className="h-4 w-4" /></button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </ScrollArea>

                      <DialogFooter className="p-6 border-t bg-slate-50 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">
                           Rubro: {selectedProgram?.id} • Actualización: {new Date().toLocaleDateString()}
                        </p>
                        <div className="flex gap-3">
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="font-bold uppercase text-xs">Cancelar</Button>
                          <Button onClick={saveProgramChanges} className="font-black uppercase text-xs px-10 shadow-md">Guardar Reporte y Avance</Button>
                        </div>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="space-y-2">
                <Progress value={program.progress} className="h-3 shadow-inner" />
                <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
                  <span>0% Inicio</span>
                  <span>50% Proceso</span>
                  <span>100% Meta</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
