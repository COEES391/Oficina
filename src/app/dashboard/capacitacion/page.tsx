
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
import { schoolsDirectory } from "@/lib/schools-directory"
import { PlusCircle, GraduationCap, FileSpreadsheet, Users, BookOpen, MapPin, FileText, Image as ImageIcon, X, Search } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from 'xlsx'
import Image from 'next/image'

export default function TrainingPage() {
  const { toast } = useToast()
  const [records, setRecords] = useState<TrainingRecord[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [targetType, setTargetType] = useState<'asistente' | 'sede'>('asistente')
  
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

  const handleSelectSchool = (cct: string) => {
    const school = schoolsDirectory.find(s => s.cct === cct);
    if (school) {
      if (targetType === 'asistente') {
        setFormData({
          ...formData,
          asistenteCCT: school.cct,
          asistenteNombreCT: school.nombre,
          asistenteZE: school.zonaEscolar,
          asistenteSector: school.sector,
          asistenteModalidad: school.modalidad,
          asistenteMunicipio: school.municipio,
          asistenteRegion: school.region,
          asistenteValle: school.valle
        });
        toast({ title: "Datos del Asistente autocompletados" });
      } else {
        setFormData({ ...formData, cctSede: school.cct });
        toast({ title: "CCT Sede actualizado" });
      }
      setSearchTerm('');
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'photo') => {
    const files = e.target.files
    if (!files) return

    if (type === 'pdf') {
      const file = files[0]
      const reader = new FileReader()
      reader.onloadend = () => setFormData({ ...formData, reportPdf: reader.result as string })
      reader.readAsDataURL(file)
    } else {
      const newPhotos = Array.from(files)
      newPhotos.forEach(file => {
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

  const handleSave = () => {
    if (!formData.id || !formData.cursoNombre || !formData.asistenteRFC) {
      toast({ variant: "destructive", title: "Campos incompletos" })
      return
    }
    const updated = [formData as TrainingRecord, ...records]
    setRecords(updated)
    localStorage.setItem('training_records_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    setFormData(initialFormState)
    toast({ title: "Registro exitoso" })
  }

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(records);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Capacitación");
    XLSX.writeFile(workbook, `Reporte_Capacitacion.xlsx`);
  }

  const filteredSchools = schoolsDirectory.filter(s => 
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.cct.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  Use el buscador de planteles para autocompletar la información geográfica.
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 py-2 bg-muted/20 border-b">
                 <div className="flex flex-col gap-2">
                    <Label className="text-xs font-bold text-primary flex items-center gap-1"><Search className="h-3 w-3"/> Autocompletar datos del catálogo:</Label>
                    <div className="flex gap-2">
                      <Select value={targetType} onValueChange={(val: any) => setTargetType(val)}>
                        <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asistente">Para Asistente</SelectItem>
                          <SelectItem value="sede">Para CCT Sede</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input 
                        placeholder="Buscar plantel..." 
                        className="h-8 text-xs" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                    </div>
                    {searchTerm && (
                      <div className="absolute z-50 bg-white border rounded shadow-lg max-h-40 overflow-auto w-[400px] mt-16 ml-44">
                        {filteredSchools.map(s => (
                          <div key={s.cct} className="p-2 hover:bg-muted text-xs cursor-pointer border-b" onClick={() => handleSelectSchool(s.cct)}>
                            <span className="font-bold">{s.cct}</span> - {s.nombre}
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
              </div>
              
              <Tabs defaultValue="curso" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 border-b">
                  <TabsList className="w-full justify-start rounded-none bg-transparent h-auto p-0">
                    <TabsTrigger value="curso" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-2">Datos del Curso</TabsTrigger>
                    <TabsTrigger value="asistente" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-2">Datos del Asistente</TabsTrigger>
                    <TabsTrigger value="evidencia" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-2">Evidencias</TabsTrigger>
                  </TabsList>
                </div>
                
                <ScrollArea className="flex-1 px-6">
                  <div className="py-6">
                    <TabsContent value="curso" className="space-y-6 mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1"><Label>No. (Folio)</Label><Input value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} /></div>
                        <div className="space-y-1"><Label>Grupo</Label><Input value={formData.cursoGrupo} onChange={e => setFormData({...formData, cursoGrupo: e.target.value})} /></div>
                        <div className="md:col-span-2 space-y-1"><Label>Nombre del Curso</Label><Input value={formData.cursoNombre} onChange={e => setFormData({...formData, cursoNombre: e.target.value})} /></div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1"><Label>Horas</Label><Input type="number" value={formData.duracionHoras} onChange={e => setFormData({...formData, duracionHoras: parseInt(e.target.value) || 0})} /></div>
                        <div className="space-y-1"><Label>Fecha Inicio</Label><Input type="date" value={formData.fechaInicio} onChange={e => setFormData({...formData, fechaInicio: e.target.value})} /></div>
                        <div className="space-y-1"><Label>Fecha Término</Label><Input type="date" value={formData.fechaTermino} onChange={e => setFormData({...formData, fechaTermino: e.target.value})} /></div>
                        <div className="space-y-1"><Label>No. Oficio</Label><Input value={formData.numeroOficio} onChange={e => setFormData({...formData, numeroOficio: e.target.value})} /></div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold border-b pb-1">Instructores</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[0, 1, 2].map(idx => (
                            <div key={idx} className="space-y-1">
                              <Label>Instructor {idx + 1}</Label>
                              <Input value={formData.instructores[idx]} onChange={e => {
                                const newInst = [...formData.instructores];
                                newInst[idx] = e.target.value;
                                setFormData({...formData, instructores: newInst});
                              }} />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-1"><Label>Sede (CCT)</Label><Input value={formData.cctSede} onChange={e => setFormData({...formData, cctSede: e.target.value.toUpperCase()})} /></div>
                        <div className="space-y-1">
                          <Label>SETES</Label>
                          <Select value={formData.setes} onValueChange={(val:any) => setFormData({...formData, setes: val})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="S">Sí</SelectItem><SelectItem value="N">No</SelectItem></SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="asistente" className="space-y-6 mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1"><Label>Ap. Paterno</Label><Input value={formData.asistentePaterno} onChange={e => setFormData({...formData, asistentePaterno: e.target.value})} /></div>
                        <div className="space-y-1"><Label>Ap. Materno</Label><Input value={formData.asistenteMaterno} onChange={e => setFormData({...formData, asistenteMaterno: e.target.value})} /></div>
                        <div className="space-y-1"><Label>Nombre(s)</Label><Input value={formData.asistenteNombres} onChange={e => setFormData({...formData, asistenteNombres: e.target.value})} /></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1"><Label>RFC</Label><Input className="uppercase" value={formData.asistenteRFC} onChange={e => setFormData({...formData, asistenteRFC: e.target.value.toUpperCase()})} /></div>
                        <div className="space-y-1"><Label>CCT Plantel</Label><Input className="uppercase" value={formData.asistenteCCT} onChange={e => setFormData({...formData, asistenteCCT: e.target.value.toUpperCase()})} /></div>
                        <div className="space-y-1"><Label>Nombre C.T.</Label><Input value={formData.asistenteNombreCT} onChange={e => setFormData({...formData, asistenteNombreCT: e.target.value})} /></div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1"><Label>ZE</Label><Input value={formData.asistenteZE} onChange={e => setFormData({...formData, asistenteZE: e.target.value})} /></div>
                        <div className="space-y-1"><Label>Sector</Label><Input value={formData.asistenteSector} onChange={e => setFormData({...formData, asistenteSector: e.target.value})} /></div>
                        <div className="space-y-1"><Label>Región</Label><Input value={formData.asistenteRegion} onChange={e => setFormData({...formData, asistenteRegion: e.target.value})} /></div>
                        <div className="space-y-1"><Label>Valle</Label><Input value={formData.asistenteValle} onChange={e => setFormData({...formData, asistenteValle: e.target.value})} /></div>
                      </div>
                    </TabsContent>

                    <TabsContent value="evidencia" className="space-y-6 mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2"><Label>Reporte PDF</Label><Input type="file" accept=".pdf" onChange={e => handleFileChange(e, 'pdf')} /></div>
                        <div className="space-y-2"><Label>Fotos Evidencia</Label><Input type="file" multiple accept="image/*" onChange={e => handleFileChange(e, 'photo')} /></div>
                      </div>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>

              <DialogFooter className="p-6 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar Registro</Button>
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
                  <TableHead>CCT Plantel</TableHead>
                  <TableHead>Sede</TableHead>
                  <TableHead className="text-center">Evidencias</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length > 0 ? records.map((record) => (
                  <TableRow key={record.id} className="hover:bg-muted/30">
                    <TableCell className="font-bold text-xs">{record.id}</TableCell>
                    <TableCell><div className="flex flex-col"><span className="font-medium text-sm">{record.cursoNombre}</span></div></TableCell>
                    <TableCell className="text-sm">{record.asistenteNombres} {record.asistentePaterno}</TableCell>
                    <TableCell className="text-xs">{record.asistenteCCT}</TableCell>
                    <TableCell className="text-xs">{record.cctSede}</TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        {record.reportPdf && <FileText className="h-4 w-4 text-blue-500" />}
                        {record.evidencePhotos && record.evidencePhotos.length > 0 && <span className="text-[10px] font-bold"><ImageIcon className="h-3 w-3 inline" /> {record.evidencePhotos.length}</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={6} className="text-center py-10">No hay registros.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
