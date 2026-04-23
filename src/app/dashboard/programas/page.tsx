'use client'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { programsData as initialData, type ProgramStatus } from "@/lib/planning-data"
import { FileText, Image as ImageIcon, Upload, X, Briefcase, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from 'next/image'

export default function ProgramsPage() {
  const { toast } = useToast()
  const [programs, setPrograms] = useState<ProgramStatus[]>([])
  const [selectedProgram, setSelectedProgram] = useState<ProgramStatus | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('programs_full') || '[]')
    if (stored.length === 0) {
      setPrograms(initialData)
      localStorage.setItem('programs_full', JSON.stringify(initialData))
    } else {
      // Merge initialData with stored to ensure all required categories exist
      const merged = initialData.map(initialProg => {
        const found = stored.find((s: ProgramStatus) => s.id === initialProg.id)
        return found ? found : initialProg
      })
      setPrograms(merged)
    }
  }, [])

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
                    {program.reportPdf && <span className="flex items-center gap-1 text-emerald-600"><FileText className="h-3 w-3" /> Reporte PDF Cargado</span>}
                    {program.evidencePhotos && program.evidencePhotos.length > 0 && <span className="flex items-center gap-1 text-emerald-600"><ImageIcon className="h-3 w-3" /> {program.evidencePhotos.length} Evidencias</span>}
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
                    <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col p-0">
                      <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="uppercase font-black text-primary text-xl">Gestión de Rubro: {program.name}</DialogTitle>
                        <DialogDescription className="font-bold text-xs uppercase">Actualice el estatus, avance y cargue la documentación oficial del programa.</DialogDescription>
                      </DialogHeader>
                      <div className="flex-1 overflow-y-auto px-6 space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-primary">Estatus Operativo</Label>
                            <Select value={selectedProgram?.status} onValueChange={(val: any) => setSelectedProgram(prev => prev ? { ...prev, status: val } : null)}>
                              <SelectTrigger className="font-bold uppercase h-11"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="planeacion" className="uppercase font-bold">Planeación</SelectItem>
                                <SelectItem value="activo" className="uppercase font-bold text-blue-600">Activo / En Proceso</SelectItem>
                                <SelectItem value="concluido" className="uppercase font-bold text-emerald-600">Concluido / Meta Lograda</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-primary">Porcentaje de Avance (0-100)</Label>
                            <Input 
                              type="number" 
                              className="font-black text-lg h-11" 
                              value={selectedProgram?.progress} 
                              onChange={e => setSelectedProgram(prev => prev ? { ...prev, progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) } : null)} 
                            />
                          </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                          <h3 className="text-xs font-black uppercase text-primary">Documentación y Evidencia</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 p-4 border border-dashed rounded-xl bg-slate-50">
                              <Label className="flex items-center gap-2 text-[11px] font-black uppercase"><FileText className="h-4 w-4 text-blue-600" /> Reporte Oficial (PDF)</Label>
                              <Input type="file" accept=".pdf" className="bg-white" onChange={e => handleFileUpload(e, 'pdf')} />
                              {selectedProgram?.reportPdf && (
                                <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-100 rounded text-[10px] font-black text-emerald-700">
                                  <span>✓ ARCHIVO CARGADO</span>
                                  <button className="ml-auto text-rose-500" onClick={() => setSelectedProgram(prev => prev ? { ...prev, reportPdf: undefined } : null)}><X className="h-3 w-3" /></button>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2 p-4 border border-dashed rounded-xl bg-slate-50">
                              <Label className="flex items-center gap-2 text-[11px] font-black uppercase"><ImageIcon className="h-4 w-4 text-pink-600" /> Evidencia en Fotos (MÁX 5)</Label>
                              <Input type="file" multiple accept="image/*" className="bg-white" onChange={e => handleFileUpload(e, 'photo')} disabled={(selectedProgram?.evidencePhotos?.length || 0) >= 5} />
                              <div className="flex gap-2 flex-wrap mt-2">
                                {selectedProgram?.evidencePhotos?.map((p, i) => (
                                  <div key={i} className="relative h-14 w-14 border-2 border-white rounded shadow-sm overflow-hidden group">
                                    <Image src={p} alt="ev" fill className="object-cover" />
                                    <button 
                                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white" 
                                      onClick={() => setSelectedProgram(prev => {
                                        if (!prev) return null
                                        return { ...prev, evidencePhotos: prev.evidencePhotos?.filter((_, idx) => idx !== i) }
                                      })}
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase text-primary">Fecha de Actualización de Datos</Label>
                          <Input type="date" className="h-11 font-bold" value={selectedProgram?.date} onChange={e => setSelectedProgram(prev => prev ? { ...prev, date: e.target.value } : null)} />
                        </div>
                      </div>
                      <DialogFooter className="p-6 border-t bg-slate-50">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="font-bold uppercase text-xs">Cancelar</Button>
                        <Button onClick={saveProgramChanges} className="font-black uppercase text-xs px-10 shadow-md">Guardar Reporte y Avance</Button>
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
