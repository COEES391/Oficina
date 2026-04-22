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
import { trainingRecords, type TrainingRecord } from "@/lib/planning-data"
import { PlusCircle, GraduationCap, FileSpreadsheet, Users, BookOpen, MapPin } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from 'xlsx'

export default function TrainingPage() {
  const { toast } = useToast()
  const [records, setRecords] = useState<TrainingRecord[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const initialFormState: Omit<TrainingRecord, 'id'> = {
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

  const handleSave = () => {
    if (!formData.cursoNombre || !formData.asistenteRFC || !formData.asistenteNombres) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "El Nombre del Curso, el RFC y el Nombre del Asistente son obligatorios.",
      })
      return
    }

    const newRecord: TrainingRecord = {
      ...formData,
      id: `C${Math.floor(1000 + Math.random() * 9000)}`,
    }

    const updated = [newRecord, ...records]
    setRecords(updated)
    localStorage.setItem('training_records_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    setFormData(initialFormState)
    
    toast({
      title: "Registro exitoso",
      description: `Capacitación para ${newRecord.asistenteNombres} guardada correctamente.`,
    })
  }

  const exportToExcel = () => {
    const dataToExport = records.map(r => ({
      'No.': r.id,
      'Procedencia (Grupo)': r.cursoGrupo,
      'Curso Nombre': r.cursoNombre,
      'Duración Horas': r.duracionHoras,
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
      'Correo electrónico': r.asistenteEmail,
      'CCT': r.asistenteCCT,
      'Nombre CT': r.asistenteNombreCT,
      'Z.E.': r.asistenteZE,
      'Sector': r.asistenteSector,
      'Modalidad': r.asistenteModalidad,
      'Municipio': r.asistenteMunicipio,
      'Región': r.asistenteRegion,
      'Valle': r.asistenteValle,
      'CCT Sede': r.cctSede,
      'SETES (S/N)': r.setes,
      'Observaciones': r.observaciones,
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
          <p className="text-muted-foreground">Registro histórico de cursos y talleres impartidos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Exportar a Excel
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" /> Registrar Capacitación
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col p-0">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle>Formato de Registro de Capacitación</DialogTitle>
                <DialogDescription>
                  Capture todos los campos del formato oficial de capacitación DESySA.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="flex-1 px-6">
                <div className="grid gap-8 py-4">
                  {/* Sección 1: Datos del Curso */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-1 text-primary">
                      <BookOpen className="h-4 w-4" /> Información del Curso
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cursoGrupo">Procedencia (Grupo)</Label>
                        <Input id="cursoGrupo" value={formData.cursoGrupo} onChange={(e) => setFormData({...formData, cursoGrupo: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="cursoNombre">Nombre del Curso</Label>
                        <Input id="cursoNombre" value={formData.cursoNombre} onChange={(e) => setFormData({...formData, cursoNombre: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="horas">Duración (Horas)</Label>
                        <Input type="number" id="horas" value={formData.duracionHoras} onChange={(e) => setFormData({...formData, duracionHoras: parseInt(e.target.value) || 0})} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="fInicio">Fecha Inicio</Label>
                        <Input type="date" id="fInicio" value={formData.fechaInicio} onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="fTermino">Fecha Término</Label>
                        <Input type="date" id="fTermino" value={formData.fechaTermino} onChange={(e) => setFormData({...formData, fechaTermino: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="oficio">No. de Oficio</Label>
                        <Input id="oficio" value={formData.numeroOficio} onChange={(e) => setFormData({...formData, numeroOficio: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="material">Material Utilizado</Label>
                        <Input id="material" value={formData.materialUtilizado} onChange={(e) => setFormData({...formData, materialUtilizado: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  {/* Sección 2: Instructores */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-1 text-primary">
                      <Users className="h-4 w-4" /> Instructor(es)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {formData.instructores.map((ins, idx) => (
                        <div key={idx} className="space-y-1">
                          <Label htmlFor={`ins-${idx}`}>Instructor {idx + 1}</Label>
                          <Input 
                            id={`ins-${idx}`} 
                            value={ins} 
                            onChange={(e) => {
                              const newIns = [...formData.instructores];
                              newIns[idx] = e.target.value;
                              setFormData({...formData, instructores: newIns});
                            }} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sección 3: Datos del Asistente */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-1 text-primary">
                      <Users className="h-4 w-4" /> Datos del Asistente
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="paterno">Apellido Paterno</Label>
                        <Input id="paterno" value={formData.asistentePaterno} onChange={(e) => setFormData({...formData, asistentePaterno: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="materno">Apellido Materno</Label>
                        <Input id="materno" value={formData.asistenteMaterno} onChange={(e) => setFormData({...formData, asistenteMaterno: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="nombres">Nombre(s)</Label>
                        <Input id="nombres" value={formData.asistenteNombres} onChange={(e) => setFormData({...formData, asistenteNombres: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="rfc">RFC</Label>
                        <Input id="rfc" value={formData.asistenteRFC} onChange={(e) => setFormData({...formData, asistenteRFC: e.target.value.toUpperCase()})} className="uppercase font-mono" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="funcion">Función</Label>
                        <Input id="funcion" value={formData.asistenteFuncion} onChange={(e) => setFormData({...formData, asistenteFuncion: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="email">Correo electrónico</Label>
                        <Input type="email" id="email" value={formData.asistenteEmail} onChange={(e) => setFormData({...formData, asistenteEmail: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="asistCCT">CCT del Centro de Trabajo</Label>
                        <Input id="asistCCT" value={formData.asistenteCCT} onChange={(e) => setFormData({...formData, asistenteCCT: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <Label htmlFor="asistNombreCT">Nombre del Centro de Trabajo</Label>
                        <Input id="asistNombreCT" value={formData.asistenteNombreCT} onChange={(e) => setFormData({...formData, asistenteNombreCT: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="asistZE">Z.E.</Label>
                        <Input id="asistZE" value={formData.asistenteZE} onChange={(e) => setFormData({...formData, asistenteZE: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="asistSector">Sector</Label>
                        <Input id="asistSector" value={formData.asistenteSector} onChange={(e) => setFormData({...formData, asistenteSector: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="asistMod">Modalidad</Label>
                        <Input id="asistMod" value={formData.asistenteModalidad} onChange={(e) => setFormData({...formData, asistenteModalidad: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="asistMun">Municipio</Label>
                        <Input id="asistMun" value={formData.asistenteMunicipio} onChange={(e) => setFormData({...formData, asistenteMunicipio: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="asistReg">Región</Label>
                        <Input id="asistReg" value={formData.asistenteRegion} onChange={(e) => setFormData({...formData, asistenteRegion: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="asistValle">Valle</Label>
                        <Input id="asistValle" value={formData.asistenteValle} onChange={(e) => setFormData({...formData, asistenteValle: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  {/* Sección 4: Sede y Adicionales */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-1 text-primary">
                      <MapPin className="h-4 w-4" /> Sede y Observaciones
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cctSede">CCT Sede</Label>
                        <Input id="cctSede" value={formData.cctSede} onChange={(e) => setFormData({...formData, cctSede: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="setes">SETES (S/N)</Label>
                        <Select value={formData.setes} onValueChange={(val) => setFormData({...formData, setes: val as 'S' | 'N'})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="S">Sí (S)</SelectItem>
                            <SelectItem value="N">No (N)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="obs">Observaciones</Label>
                      <Textarea id="obs" value={formData.observaciones} onChange={(e) => setFormData({...formData, observaciones: e.target.value})} className="h-20" />
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter className="p-6 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar Registro Oficial</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <CardTitle>Historial Detallado de Capacitación</CardTitle>
          </div>
          <CardDescription>Registro de asistentes y cursos por ciclo escolar.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] w-full border rounded-md">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Asistente</TableHead>
                  <TableHead>RFC</TableHead>
                  <TableHead>CCT CT</TableHead>
                  <TableHead>Municipio</TableHead>
                  <TableHead>Instructor(es)</TableHead>
                  <TableHead>F. Inicio</TableHead>
                  <TableHead className="text-center">SETES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length > 0 ? records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-xs font-bold">{record.id}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={record.cursoNombre}>{record.cursoNombre}</TableCell>
                    <TableCell className="font-medium">{`${record.asistenteNombres} ${record.asistentePaterno}`}</TableCell>
                    <TableCell className="font-mono text-xs">{record.asistenteRFC}</TableCell>
                    <TableCell className="text-xs">{record.asistenteCCT}</TableCell>
                    <TableCell className="text-xs">{record.asistenteMunicipio}</TableCell>
                    <TableCell className="text-xs">{record.instructores.filter(i => i).join(', ')}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{record.fechaInicio}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={record.setes === 'S' ? 'default' : 'outline'}>
                        {record.setes}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-20 text-muted-foreground">
                      No hay registros detallados de capacitación.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}