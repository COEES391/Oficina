'use client'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { programsData as initialData, type ProgramStatus } from "@/lib/planning-data"
import { FileText, Image as ImageIcon, Upload, X } from "lucide-react"
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
      setPrograms(stored)
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
        toast({ variant: "destructive", title: "Límite", description: "Máximo 5 fotos." })
        return
      }
      newPhotos.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          updatedProgram.evidencePhotos = [...(updatedProgram.evidencePhotos || []), reader.result as string]
          setSelectedProgram({ ...updatedProgram })
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
    toast({ title: "Actualizado", description: "Archivos guardados correctamente." })
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Programas de Desarrollo Educativo</CardTitle>
          <CardDescription>Seguimiento al cumplimiento de metas y evidencias.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {programs.map((program) => (
            <div key={program.id} className="space-y-4 p-4 border rounded-lg bg-card">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{program.name}</span>
                    <Badge variant={program.status === 'concluido' ? 'default' : 'outline'}>{program.status}</Badge>
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {program.reportPdf && <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Reporte PDF</span>}
                    {program.evidencePhotos && program.evidencePhotos.length > 0 && <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" /> {program.evidencePhotos.length} Fotos</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">{program.progress}%</span>
                  <Dialog open={isDialogOpen && selectedProgram?.id === program.id} onOpenChange={(open) => {
                    setIsDialogOpen(open)
                    if (open) setSelectedProgram(program)
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Upload className="h-4 w-4" /> Gestionar Evidencia
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Evidencias: {program.name}</DialogTitle>
                        <DialogDescription>Suba el reporte PDF y hasta 5 fotos de evidencia.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                          <Label>Reporte en PDF</Label>
                          <Input type="file" accept=".pdf" onChange={e => handleFileUpload(e, 'pdf')} />
                          {selectedProgram?.reportPdf && <p className="text-xs text-green-600">✓ PDF adjunto</p>}
                        </div>
                        <div className="space-y-2">
                          <Label>Fotos de Evidencia ({selectedProgram?.evidencePhotos?.length || 0}/5)</Label>
                          <Input type="file" multiple accept="image/*" onChange={e => handleFileUpload(e, 'photo')} disabled={(selectedProgram?.evidencePhotos?.length || 0) >= 5} />
                          <div className="flex gap-2 mt-2">
                            {selectedProgram?.evidencePhotos?.map((p, i) => (
                              <div key={i} className="relative w-16 h-16 border rounded">
                                <Image src={p} alt="ev" fill className="object-cover" />
                                <X className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-white rounded-full cursor-pointer p-0.5" onClick={() => {
                                  const updated = { ...selectedProgram }
                                  updated.evidencePhotos = updated.evidencePhotos?.filter((_, idx) => idx !== i)
                                  setSelectedProgram(updated)
                                }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={saveProgramChanges}>Guardar Archivos</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <Progress value={program.progress} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}