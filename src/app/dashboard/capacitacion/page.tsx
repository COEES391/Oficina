'use client'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { trainingRecords, type TrainingRecord } from "@/lib/planning-data"
import { PlusCircle, GraduationCap, FileSpreadsheet, Users, BookOpen, MapPin, FileText, Image as ImageIcon, X } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from 'xlsx'
import Image from 'next/image'

export default function TrainingPage() {
  const { toast } = useToast()
  const [records, setRecords] = useState<TrainingRecord[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const initialFormState: Omit<TrainingRecord, 'status'> = {
    id: '',
    cursoGrupo: '',
    cursoNombre: '',
    duracionHoras: 0,
    fechaInicio: format(new Date(), 'yyyy-MM-dd'),
    fechaTermino: format(new Date(), 'yyyy-MM-dd'),
    instructores: ['', '', ''],
    numeroOficio: '',
    materialUtilizado: '',
    asistentePaterno: '',
    asistenteMaterno: '',
    asistenteNombres: '',
    asistenteRFC: '',
    asistenteFuncion: '',
    asistenteEmail: '',
    asistenteCCT: '',
    asistenteNombreCT: '',
    asistenteZE: '',
    asistenteSector: '',
    asistenteModalidad: '',
    asistenteMunicipio: '',
    asistenteRegion: '',
    asistenteValle: '',
    cctSede: '',
    setes: 'N',
    observaciones: '',
    reportPdf: '',
    evidencePhotos: [],
  }

  const [formData, setFormData] = useState(initialFormState)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('training_records_full') || '[]')
    if (stored.length === 0) {
      setRecords(trainingRecords)
      localStorage.setItem('training_records_full', JSON.stringify(trainingRecords))
    } else {
      setRecords(stored)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'photo') => {
    const files = e.target.files
    if (!files) return

    if (type === 'pdf') {
      const file = files[0]
      if (file.type !== 'application/pdf') {
        toast({ variant: "destructive", title: "Error", description: "Solo se permiten archivos PDF." })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => setFormData({ ...formData, reportPdf: reader.result as string })
      reader.readAsDataURL(file)
    } else {
      const newPhotos = Array.from(files)
      if ((formData.evidencePhotos?.length || 0) + newPhotos.length > 5) {
        toast({ variant: "destructive", title: "Límite excedido", description: "Máximo 5 fotos de evidencia." })
        return
      }

      newPhotos.forEach(file => {
        if (!file.type.startsWith('image/')) return
        const reader = new FileReader()
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            evidencePhotos: [...(prev.evidencePhotos || []), reader.result as string]
          }))
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evidencePhotos: prev.evidencePhotos?.filter((_, i) => i !== index)
    }))
  }

  const handleSave = () => {
    if (!formData.id || !formData.cursoNombre || !formData.asistenteRFC) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "El No., Nombre del Curso y RFC del Asistente son obligatorios.",
      })
      return
    }

    const newRecord: TrainingRecord = {
      ...formData,
    }

    const updated = [newRecord, ...records]
    setRecords(updated)
    localStorage.setItem('training_records_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    setFormData(initialFormState)
    
    toast({
      title: "Registro exitoso",
      description: `Capacitación con ID ${newRecord.id} guardada correctamente.`,
    })
  }

  const exportToExcel = () => {
    const dataToExport = records.map(r => ({
      'No.': r.id,
      'Grupo (Procedencia)': r.cursoGrupo,
      'Nombre del Curso': r.cursoNombre,
      'Duración (Horas)': r.duracionHoras,
      'Fecha Inicio': r.fechaInicio,
      'Fecha Término': r.fechaTermino,
      'Instructor 1': r.instructores[0],
      'Instructor 2': r.instructores[1],
      'Instructor 3': r.instructores[2],
      'No. de Oficio': r.numeroOficio,
      'Material Utilizado': r.materialUtilizado,
      'Apellido Paterno': r.asistentePaterno,
      'Apellido Materno': r.asistenteMaterno,
      'Nombre(s)': r.asistenteNombres,
      'RFC': r.asistenteRFC,
      'Función': r.asistenteFuncion,
      'Correo Electrónico': r.asistenteEmail,
      'CCT Plantel': r.asistenteCCT,
      'Nombre CT': r.asistenteNombreCT,
      'Z.E.': r.asistenteZE,
      'Sector': r.asistenteSector,
      'Modalidad': r.asistenteModalidad,
      'Municipio': r.asistenteMunicipio,
      'Región': r.asistenteRegion,
      'Valle': r.asistenteValle,
      'CCT Sede': r.cctSede,
      'SETES (S/N)': r.setes,
      'Observaciones': r.observaciones
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Capacitación");
    XLSX.writeFile(workbook, `Reporte_Capacitacion_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Capacitación</h2>
          <p className="text-muted-foreground">Control y seguimiento de cursos y talleres impartidos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Exportar Reporte
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" /> Registrar Asistente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col p-0">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle>Formato Oficial de Capacitación</DialogTitle>
                <DialogDescription>
                  Capture los datos del curso y del asistente conforme al formato de planeación.
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="curso" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 border-b">
                  <TabsList className="w-full justify-start rounded-none bg-transparent h-auto p-0">
                    <TabsTrigger value="curso" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2">Datos del Curso</TabsTrigger>
                    <TabsTrigger value="asistente" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2">Datos del Asistente</TabsTrigger>
                    <TabsTrigger value="evidencia" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2">Evidencias</TabsTrigger>
                  </TabsList>
                </div>
                
                <ScrollArea className="flex-1 px-6">
                  <div className="py-6">
                    <TabsContent value="curso" className="space-y-6 mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="id" className="text-primary font-bold">No. (Folio/ID)</Label>
                          <Input id="id" placeholder="001" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="grupo">Grupo (Procedencia)</Label>
                          <Input id="grupo" value={formData.cursoGrupo} onChange={e => setFormData({...formData, cursoGrupo: e.target.value})} />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <Label htmlFor="nombreCurso">Nombre del Curso</Label>
                          <Input id="nombreCurso" value={formData.cursoNombre} onChange={e => setFormData({...formData, cursoNombre: e.target.value})} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="horas">Duración (Horas)</Label>
                          <Input type="number" id="horas" value={formData.duracionHoras} onChange={e => setFormData({...formData, duracionHoras: parseInt(e.target.value) || 0})} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="fInicio">Fecha Inicio</Label>
                          <Input type="date" id="fInicio" value={formData.fechaInicio} onChange={e => setFormData({...formData, fechaInicio: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="fTermino">Fecha Término</Label>
                          <Input type="date" id="fTermino" value={formData.fechaTermino} onChange={e => setFormData({...formData, fechaTermino: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="oficio">No. de Oficio</Label>
                          <Input id="oficio" value={formData.numeroOficio} onChange={e => setFormData({...formData, numeroOficio: e.target.value})} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-1 text-primary">
                          <Users className="h-4 w-4" /> Instructor(es)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[0, 1, 2].map((idx) => (
                            <div key={idx} className="space-y-1">
                              <Label htmlFor={`inst-${idx}`}>Instructor {idx + 1}</Label>
                              <Input 
                                id={`inst-${idx}`} 
                                value={formData.instructores[idx]} 
                                onChange={e => {
                                  const newInst = [...formData.instructores];
                                  newInst[idx] = e.target.value;
                                  setFormData({...formData, instructores: newInst});
                                }} 
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-1">
                          <Label htmlFor="material">Material Utilizado</Label>
                          <Input id="material" value={formData.materialUtilizado} onChange={e => setFormData({...formData, materialUtilizado: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="setes">SETES (S/N)</Label>
                          <Select value={formData.setes} onValueChange={(val) => setFormData({...formData, setes: val as 'S' | 'N'})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="S">Sí (S)</SelectItem>
                              <SelectItem value="N">No (N)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor="sede">CCT Sede</Label>
                        <Input id="sede" value={formData.cctSede} onChange={e => setFormData({...formData, cctSede: e.target.value.toUpperCase()})} />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="obs">Observaciones</Label>
                        <Textarea id="obs" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} />
                      </div>
                    </TabsContent>

                    <TabsContent value="asistente" className="space-y-6 mt-0">
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-1 text-primary">
                          <Users className="h-4 w-4" /> Identificación del Asistente
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <Label htmlFor="apPaterno">Apellido Paterno</Label>
                            <Input id="apPaterno" value={formData.asistentePaterno} onChange={e => setFormData({...formData, asistentePaterno: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="apMaterno">Apellido Materno</Label>
                            <Input id="apMaterno" value={formData.asistenteMaterno} onChange={e => setFormData({...formData, asistenteMaterno: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="nombres">Nombre(s)</Label>
                            <Input id="nombres" value={formData.asistenteNombres} onChange={e => setFormData({...formData, asistenteNombres: e.target.value})} />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <Label htmlFor="rfc" className="font-bold">RFC</Label>
                            <Input id="rfc" value={formData.asistenteRFC} className="uppercase font-mono" onChange={e => setFormData({...formData, asistenteRFC: e.target.value.toUpperCase()})} />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="funcion">Función</Label>
                            <Input id="funcion" value={formData.asistenteFuncion} onChange={e => setFormData({...formData, asistenteFuncion: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input id="email" type="email" value={formData.asistenteEmail} onChange={e => setFormData({...formData, asistenteEmail: e.target.value})} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-1 text-primary">
                          <MapPin className="h-4 w-4" /> Centro de Trabajo del Asistente
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <Label htmlFor="asistCCT">CCT del Plantel</Label>
                            <Input id="asistCCT" value={formData.asistenteCCT} onChange={e => setFormData({...formData, asistenteCCT: e.target.value.toUpperCase()})} />
                          </div>
                          <div className="md:col-span-2 space-y-1">
                            <Label htmlFor="asistCTNombre">Nombre del C.T.</Label>
                            <Input id="asistCTNombre" value={formData.asistenteNombreCT} onChange={e => setFormData({...formData, asistenteNombreCT: e.target.value})} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <Label htmlFor="aze">Z.E.</Label>
                            <Input id="aze" value={formData.asistenteZE} onChange={e => setFormData({...formData, asistenteZE: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="asector">Sector</Label>
                            <Input id="asector" value={formData.asistenteSector} onChange={e => setFormData({...formData, asistenteSector: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="amod">Modalidad</Label>
                            <Input id="amod" value={formData.asistenteModalidad} onChange={e => setFormData({...formData, asistenteModalidad: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="amun">Municipio</Label>
                            <Input id="amun" value={formData.asistenteMunicipio} onChange={e => setFormData({...formData, asistenteMunicipio: e.target.value})} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label htmlFor="areg">Región</Label>
                            <Input id="areg" value={formData.asistenteRegion} onChange={e => setFormData({...formData, asistenteRegion: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="avalle">Valle</Label>
                            <Input id="avalle" value={formData.asistenteValle} onChange={e => setFormData({...formData, asistenteValle: e.target.value})} />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="evidencia" className="space-y-6 mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2"><FileText className="h-4 w-4" /> Reporte PDF</Label>
                          <Input type="file" accept=".pdf" onChange={e => handleFileChange(e, 'pdf')} />
                          {formData.reportPdf && <p className="text-xs text-green-600 font-bold">✓ PDF Cargado</p>}
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Fotos (Máx. 5)</Label>
                          <Input type="file" multiple accept="image/*" onChange={e => handleFileChange(e, 'photo')} disabled={formData.evidencePhotos!.length >= 5} />
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.evidencePhotos?.map((p, i) => (
                              <div key={i} className="relative w-20 h-20 border rounded overflow-hidden">
                                <Image src={p} alt="evidencia" fill className="object-cover" />
                                <button onClick={() => removePhoto(i)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5"><X className="h-3 w-3"/></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>

              <DialogFooter className="p-6 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar Registro Completo</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-md border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Personal Capacitado y Cursos Impartidos
          </CardTitle>
          <CardDescription>Resumen del historial de capacitación ciclo escolar actual.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[80px]">No.</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Asistente</TableHead>
                  <TableHead>RFC</TableHead>
                  <TableHead>Sede</TableHead>
                  <TableHead className="text-center">Evidencias</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length > 0 ? records.map((record) => (
                  <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-bold text-xs">{record.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{record.cursoNombre}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{record.cursoGrupo}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {record.asistenteNombres} {record.asistentePaterno} {record.asistenteMaterno}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{record.asistenteRFC}</TableCell>
                    <TableCell className="text-xs">{record.cctSede}</TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        {record.reportPdf && <FileText className="h-4 w-4 text-blue-500" />}
                        {record.evidencePhotos && record.evidencePhotos.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold">
                            <ImageIcon className="h-3 w-3" /> {record.evidencePhotos.length}
                          </span>
                        )}
                        {!record.reportPdf && (!record.evidencePhotos || record.evidencePhotos.length === 0) && (
                          <span className="text-[10px] text-muted-foreground italic">Sin archivos</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                      No hay registros de capacitación para mostrar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
