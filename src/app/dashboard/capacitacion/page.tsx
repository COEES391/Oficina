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
import { PlusCircle, GraduationCap, FileSpreadsheet, Users, Search, Pencil, Image as ImageIcon, FileUp, Download, CheckCircle2 } from "lucide-react"
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
  const [editingId, setEditingId] = useState<string | null>(null)
  
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

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

  const handleEdit = (record: TrainingRecord) => {
    setFormData(record)
    setEditingId(record.id)
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.id || !formData.cursoNombre || !formData.asistenteRFC) {
      toast({ variant: "destructive", title: "Campos incompletos", description: "RFC, Folio y Curso son obligatorios." })
      return
    }

    let updated: TrainingRecord[];
    if (editingId) {
      updated = records.map(r => r.id === editingId ? (formData as TrainingRecord) : r)
      toast({ title: "Registro actualizado con éxito" })
    } else {
      updated = [formData as TrainingRecord, ...records]
      toast({ title: "Registro de asistente exitoso" })
    }

    setRecords(updated)
    localStorage.setItem('training_records_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    setFormData(initialFormState)
    setEditingId(null)
  }

  const downloadTemplate = () => {
    const headers = [
      'Apellido Paterno', 'Apellido Materno', 'Nombre(s)', 'RFC', 'Función', 'Correo electrónico',
      'CCT Plantel', 'Nombre C.T.', 'ZE', 'Sector', 'Modalidad', 'Municipio', 'Región', 'Valle'
    ];
    // Formato de datos vacío para la plantilla
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla Asistentes");
    XLSX.writeFile(wb, "plantilla_importacion_asistentes.xlsx");
    toast({ title: "Plantilla descargada", description: "Completa el CCT y el sistema autocompletará el resto al importar." });
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!formData.cursoNombre || !formData.id) {
      toast({ variant: "destructive", title: "Datos del Curso faltantes", description: "Primero llena el Folio y Nombre del Curso para asociar a los asistentes." });
      return;
    }

    const reader = new FileReader()
    reader.onload = (evt) => {
      const bstr = evt.target?.result
      const wb = XLSX.read(bstr, { type: 'binary' })
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]
      const data: any[] = XLSX.utils.sheet_to_json(ws)

      const importedRecords: TrainingRecord[] = data.map((row, idx) => {
        const cctFromExcel = (row['CCT Plantel'] || row['CCT'] || '').toString().toUpperCase();
        // Búsqueda automática en el catálogo
        const schoolMatch = schoolsDirectory.find(s => s.cct === cctFromExcel);

        return {
          id: `${formData.id}-${idx}-${Date.now()}`,
          cursoGrupo: formData.cursoGrupo,
          cursoNombre: formData.cursoNombre,
          duracionHoras: formData.duracionHoras,
          fechaInicio: formData.fechaInicio,
          fechaTermino: formData.fechaTermino,
          instructores: formData.instructores,
          numeroOficio: formData.numeroOficio,
          materialUtilizado: formData.materialUtilizado,
          cctSede: formData.cctSede,
          setes: formData.setes,
          observaciones: formData.observaciones,
          asistentePaterno: (row['Apellido Paterno'] || '').toString(),
          asistenteMaterno: (row['Apellido Materno'] || '').toString(),
          asistenteNombres: (row['Nombre(s)'] || '').toString(),
          asistenteRFC: (row['RFC'] || '').toString().toUpperCase(),
          asistenteFuncion: (row['Función'] || '').toString(),
          asistenteEmail: (row['Correo electrónico'] || row['Email'] || '').toString(),
          asistenteCCT: cctFromExcel,
          // Si hay match en catálogo, usamos esos datos, si no, lo que venga en el Excel (o vacío)
          asistenteNombreCT: schoolMatch ? schoolMatch.nombre : (row['Nombre C.T.'] || '').toString(),
          asistenteZE: schoolMatch ? schoolMatch.zonaEscolar : (row['ZE'] || '').toString(),
          asistenteSector: schoolMatch ? schoolMatch.sector : (row['Sector'] || '').toString(),
          asistenteModalidad: schoolMatch ? schoolMatch.modalidad : (row['Modalidad'] || '').toString(),
          asistenteMunicipio: schoolMatch ? schoolMatch.municipio : (row['Municipio'] || '').toString(),
          asistenteRegion: schoolMatch ? schoolMatch.region : (row['Región'] || '').toString(),
          asistenteValle: schoolMatch ? schoolMatch.valle : (row['Valle'] || '').toString(),
          evidencePhotos: [],
        }
      })

      const newRecords = [...importedRecords, ...records]
      setRecords(newRecords)
      localStorage.setItem('training_records_full', JSON.stringify(newRecords))
      toast({ title: "Importación Exitosa", description: `Se han cargado ${importedRecords.length} asistentes. Se autocompletaron los datos geográficos desde el catálogo.` })
      setIsDialogOpen(false)
    }
    reader.readAsBinaryString(file)
  }

  const filteredSchools = schoolsDirectory.filter(s => 
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.cct.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase">Capacitación Institucional</h2>
          <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Seguimiento de personal capacitado y cursos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) {
              setFormData(initialFormState)
              setEditingId(null)
              setSearchTerm('')
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 font-black uppercase text-xs px-8 h-12">
                <PlusCircle className="h-5 w-5" /> Registrar Asistente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col p-0">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle className="uppercase font-black text-primary">{editingId ? 'Editar Registro' : 'Registrar Asistente Capacitado'}</DialogTitle>
                <DialogDescription className="font-bold text-xs">
                  Ingrese la información del asistente y del curso impartido.
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 py-2 bg-muted/20 border-b">
                 <div className="flex flex-col gap-2">
                    <Label className="text-[10px] font-black text-primary flex items-center gap-1 uppercase"><Search className="h-3 w-3"/> Autocompletar desde catálogo:</Label>
                    <div className="flex gap-2">
                      <Select value={targetType} onValueChange={(val: any) => setTargetType(val)}>
                        <SelectTrigger className="w-40 h-8 text-[10px] font-bold uppercase"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asistente">Para Asistente</SelectItem>
                          <SelectItem value="sede">Para CCT Sede</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input 
                        placeholder="Buscar plantel..." 
                        className="h-8 text-[10px]" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                    </div>
                    {searchTerm && (
                      <div className="absolute z-50 bg-white border rounded shadow-lg max-h-40 overflow-auto w-[400px] mt-16 ml-44">
                        {filteredSchools.map(s => (
                          <div key={s.cct} className="p-2 hover:bg-muted text-[10px] cursor-pointer border-b flex justify-between" onClick={() => handleSelectSchool(s.cct)}>
                            <span className="font-bold">{s.cct}</span>
                            <span>{s.nombre}</span>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
              </div>
              
              <Tabs defaultValue="curso" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 border-b">
                  <TabsList className="w-full justify-start rounded-none bg-transparent h-auto p-0">
                    <TabsTrigger value="curso" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-2 text-[10px] font-black uppercase tracking-wider">Datos del Curso</TabsTrigger>
                    <TabsTrigger value="asistente" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-2 text-[10px] font-black uppercase tracking-wider">Datos del Asistente</TabsTrigger>
                    <TabsTrigger value="evidencia" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-2 text-[10px] font-black uppercase tracking-wider">Evidencias y Carga Masiva</TabsTrigger>
                  </TabsList>
                </div>
                
                <ScrollArea className="flex-1 px-6">
                  <div className="py-6">
                    <TabsContent value="curso" className="space-y-6 mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1"><Label className="text-xs font-bold uppercase">Folio Registro</Label><Input value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} /></div>
                        <div className="space-y-1"><Label className="text-xs font-bold uppercase">Grupo</Label><Input value={formData.cursoGrupo} onChange={e => setFormData({...formData, cursoGrupo: e.target.value})} /></div>
                        <div className="md:col-span-2 space-y-1"><Label className="text-xs font-bold uppercase">Nombre del Curso</Label><Input value={formData.cursoNombre} onChange={e => setFormData({...formData, cursoNombre: e.target.value})} /></div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1"><Label className="text-xs font-bold uppercase">Horas Duración</Label><Input type="number" value={formData.duracionHoras} onChange={e => setFormData({...formData, duracionHoras: parseInt(e.target.value) || 0})} /></div>
                        <div className="space-y-1"><Label className="text-xs font-bold uppercase">Fecha Inicio</Label><Input type="date" value={formData.fechaInicio} onChange={e => setFormData({...formData, fechaInicio: e.target.value})} /></div>
                        <div className="space-y-1"><Label className="text-xs font-bold uppercase">Fecha Término</Label><Input type="date" value={formData.fechaTermino} onChange={e => setFormData({...formData, fechaTermino: e.target.value})} /></div>
                        <div className="space-y-1"><Label className="text-xs font-bold uppercase">No. Oficio</Label><Input value={formData.numeroOficio} onChange={e => setFormData({...formData, numeroOficio: e.target.value})} /></div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase text-primary border-b pb-1">Instructores Ponentes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[0, 1, 2].map(idx => (
                            <div key={idx} className="space-y-1">
                              <Label className="text-[10px] font-bold">Ponente {idx + 1}</Label>
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
                        <div className="md:col-span-2 space-y-1"><Label className="text-xs font-bold uppercase">CCT Sede</Label><Input className="font-mono uppercase" value={formData.cctSede} onChange={e => setFormData({...formData, cctSede: e.target.value.toUpperCase()})} /></div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold uppercase">SETES</Label>
                          <Select value={formData.setes} onValueChange={(val:any) => setFormData({...formData, setes: val})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="S">Sí</SelectItem><SelectItem value="N">No</SelectItem></SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="asistente" className="space-y-6 mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1"><Label className="text-xs font-bold uppercase">Apellido Paterno</Label><Input value={formData.asistentePaterno} onChange={e => setFormData({...formData, asistentePaterno: e.target.value})} /></div>
                        <div className="space-y-1"><Label className="text-xs font-bold uppercase">Apellido Materno</Label><Input value={formData.asistenteMaterno} onChange={e => setFormData({...formData, asistenteMaterno: e.target.value})} /></div>
                        <div className="space-y-1"><Label className="text-xs font-bold uppercase">Nombre(s)</Label><Input value={formData.asistenteNombres} onChange={e => setFormData({...formData, asistenteNombres: e.target.value})} /></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1"><Label className="text-xs font-bold uppercase">RFC</Label><Input className="uppercase font-mono" value={formData.asistenteRFC} onChange={e => setFormData({...formData, asistenteRFC: e.target.value.toUpperCase()})} /></div>
                        <div className="space-y-1"><Label className="text-xs font-bold uppercase">CCT Plantel Origen</Label><Input className="uppercase font-mono" value={formData.asistenteCCT} onChange={e => setFormData({...formData, asistenteCCT: e.target.value.toUpperCase()})} /></div>
                        <div className="space-y-1"><Label className="text-xs font-bold uppercase">Nombre C.T.</Label><Input value={formData.asistenteNombreCT} onChange={e => setFormData({...formData, asistenteNombreCT: e.target.value})} /></div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1"><Label className="text-[10px] font-bold uppercase">ZE</Label><Input value={formData.asistenteZE} readOnly className="bg-muted/50" /></div>
                        <div className="space-y-1"><Label className="text-[10px] font-bold uppercase">Sector</Label><Input value={formData.asistenteSector} readOnly className="bg-muted/50" /></div>
                        <div className="space-y-1"><Label className="text-[10px] font-bold uppercase">Región</Label><Input value={formData.asistenteRegion} readOnly className="bg-muted/50" /></div>
                        <div className="space-y-1"><Label className="text-[10px] font-bold uppercase">Valle</Label><Input value={formData.asistenteValle} readOnly className="bg-muted/50" /></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1"><Label className="text-xs font-bold uppercase">Función</Label><Input value={formData.asistenteFuncion} onChange={e => setFormData({...formData, asistenteFuncion: e.target.value})} /></div>
                        <div className="space-y-1"><Label className="text-xs font-bold uppercase">Correo Electrónico</Label><Input type="email" value={formData.asistenteEmail} onChange={e => setFormData({...formData, asistenteEmail: e.target.value})} /></div>
                      </div>
                    </TabsContent>

                    <TabsContent value="evidencia" className="space-y-8 mt-0">
                      <div className="bg-slate-50 p-8 rounded-xl border-2 border-primary/20 border-dashed flex flex-col items-center text-center gap-6">
                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                          <FileSpreadsheet className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-black uppercase text-sm text-primary">Gestión Masiva de Asistentes</h4>
                          <p className="text-xs font-bold text-muted-foreground max-w-md mx-auto">
                            Descarga la plantilla con los campos requeridos. Al llenar el **CCT**, el sistema autocompletará el resto de datos geográficos automáticamente al importar.
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4">
                          <Button variant="outline" onClick={downloadTemplate} className="gap-2 font-black uppercase text-[10px] px-6 border-primary/30 hover:bg-primary/5">
                            <Download className="h-4 w-4" /> Descargar Plantilla Excel
                          </Button>
                          <div className="relative">
                            <Input
                              type="file"
                              accept=".xlsx, .xls"
                              className="hidden"
                              id="excel-import-dialog"
                              onChange={handleImportExcel}
                            />
                            <Button asChild className="gap-2 font-black uppercase text-[10px] px-6">
                              <label htmlFor="excel-import-dialog" className="cursor-pointer">
                                <FileUp className="h-4 w-4" /> Importar Lista desde Excel
                              </label>
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase text-primary">Reporte PDF / Lista de Asistencia y Evidencias</Label>
                        <Input type="file" multiple accept="image/*,.pdf" onChange={handleFileChange} className="cursor-pointer" />
                        
                        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center gap-4">
                           <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                           <div>
                              <p className="text-[10px] font-black uppercase text-emerald-800">Control de Evidencias</p>
                              <p className="text-[9px] font-bold text-emerald-600 mt-1">
                                Las evidencias fotográficas y el reporte PDF se asocian al registro del curso para auditorías y reportes ejecutivos.
                              </p>
                           </div>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>

              <DialogFooter className="p-6 border-t bg-slate-50">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="font-bold uppercase text-xs">Cancelar</Button>
                <Button onClick={handleSave} className="font-black uppercase text-xs px-8">
                  {editingId ? 'Actualizar Asistente' : 'Guardar Asistente'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-md border-t-4 border-t-primary overflow-hidden">
        <CardHeader className="bg-slate-50/50">
          <CardTitle className="flex items-center gap-2 text-primary uppercase font-black text-lg">
            <GraduationCap className="h-6 w-6" />
            Control Escolar de Capacitación
          </CardTitle>
          <CardDescription className="font-bold text-xs uppercase tracking-tight">Historial de personal capacitado por plantel y región.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100">
                <TableRow>
                  <TableHead className="font-black text-[10px] uppercase">No.</TableHead>
                  <TableHead className="font-black text-[10px] uppercase">Curso</TableHead>
                  <TableHead className="font-black text-[10px] uppercase">Nombre del Asistente</TableHead>
                  <TableHead className="font-black text-[10px] uppercase">RFC</TableHead>
                  <TableHead className="font-black text-[10px] uppercase">Plantel Origen</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-center">Evidencias</TableHead>
                  <TableHead className="text-right font-black text-[10px] uppercase">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length > 0 ? records.map((record) => (
                  <TableRow key={record.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="font-black text-xs text-primary">{record.id.split('-')[0]}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-slate-700">{record.cursoNombre}</span>
                        <span className="text-[9px] text-muted-foreground uppercase">{record.cursoGrupo}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {record.asistenteNombres} {record.asistentePaterno} {record.asistenteMaterno}
                    </TableCell>
                    <TableCell className="font-mono text-xs uppercase text-muted-foreground">{record.asistenteRFC}</TableCell>
                    <TableCell className="text-[10px] font-bold">
                       <div className="flex flex-col">
                          <span>{record.asistenteCCT}</span>
                          <span className="text-[9px] text-muted-foreground truncate max-w-[150px]">{record.asistenteNombreCT}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        {record.evidencePhotos && record.evidencePhotos.length > 0 && (
                          <div className="flex items-center gap-1">
                            <ImageIcon className="h-4 w-4 text-pink-500" />
                            <span className="text-[9px] font-bold">({record.evidencePhotos.length})</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => handleEdit(record)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-20 bg-slate-50/20">
                      <div className="flex flex-col items-center gap-2 opacity-50">
                        <GraduationCap className="h-10 w-10 text-primary" />
                        <p className="font-black text-xs uppercase">Sin registros de capacitación disponibles.</p>
                      </div>
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
