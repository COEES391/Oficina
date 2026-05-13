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
import { programsData, type ProgramStatus } from "@/lib/planning-data"
import { schoolsDirectory } from "@/lib/schools-directory"
import { cn } from "@/lib/utils"
import { 
  PlusCircle, 
  Pencil, 
  Trash2,
  Activity,
  Target,
  MapPin
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const PROGRAM_RUBROS = [
  'Biblioteca Digital',
  'Cuentas Institucionales',
  'Geoposición',
  'Conoce mi Escuela'
];

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [activeTab, setActiveTab] = useState(PROGRAM_RUBROS[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const initialFormState: ProgramStatus = {
    id: '', name: '', progress: 0, status: 'activo', date: new Date().toISOString(), cct: '', schoolName: '', 
    zonaEscolar: '', sector: '', modalidad: '', municipio: '', region: '', valle: '',
    numeroEquipos: 0, observaciones: '', capacitacion: 'N', asistentes: [], email: '',
    latitud: '', longitud: ''
  }

  const [formData, setFormData] = useState<ProgramStatus>(initialFormState)

  useEffect(() => {
    setMounted(true)
    const stored = JSON.parse(localStorage.getItem('programs_full') || '[]')
    setRecords(stored.length > 0 ? stored : programsData)
  }, [])

  const handleSelectSchool = (cct: string) => {
    const school = schoolsDirectory.find(s => s.cct.toUpperCase() === cct.toUpperCase())
    if (school) {
      setFormData(prev => ({
        ...prev,
        cct: school.cct,
        schoolName: school.nombre,
        zonaEscolar: school.zonaEscolar,
        sector: school.sector,
        modalidad: school.modalidad,
        municipio: school.municipio,
        valle: school.valle
      }))
    }
  }

  const handleSave = () => {
    if (!formData.cct) {
      toast({ variant: "destructive", title: "Datos Incompletos", description: "El CCT es obligatorio." });
      return;
    }
    const updated = editingId ? records.map(r => r.id === editingId ? formData : r) : [formData, ...records];
    setRecords(updated)
    localStorage.setItem('programs_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    setEditingId(null)
    setFormData(initialFormState)
    toast({ title: "Registro guardado" })
  }

  const currentTabRecords = useMemo(() => {
    if (activeTab === 'Conoce mi Escuela') {
       return records.filter(r => r.name === 'Conoce mi Escuela').sort((a,b) => (a.cct||'').localeCompare(b.cct||''));
    }
    return records.filter(r => r.name === activeTab);
  }, [records, activeTab]);

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase">Módulos Técnicos COEES</h2>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent" /> Control de Programas y Auditoría 2026
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
          <Card className="executive-card p-6 flex items-center justify-between">
             <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                 {activeTab === 'Geoposición' ? <MapPin className="h-6 w-6" /> : <Target className="h-6 w-6" />}
               </div>
               <div>
                 <h3 className="text-xl font-black uppercase text-slate-900 leading-none">{activeTab}</h3>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Registros de Auditoría Técnica</p>
               </div>
             </div>
             <Button onClick={() => { setFormData({...initialFormState, name: activeTab, id: `PROG-${activeTab.substring(0,2)}-${Date.now()}`}); setEditingId(null); setIsDialogOpen(true); }} className="btn-institutional px-8 text-[11px]">
                <PlusCircle className="h-5 w-5 mr-2" /> Nuevo Registro
             </Button>
          </Card>

          <Card className="executive-card p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  {activeTab === 'Conoce mi Escuela' ? (
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase">CCT</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Agrupado</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Vert.</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Sect.</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Zona</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Alta</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Modif.</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Revisión</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Fecha</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Status</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Email</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-center">Acciones</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Observaciones</TableHead>
                    </TableRow>
                  ) : activeTab === 'Geoposición' ? (
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase">CCT</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Zona</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Sector</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Nombre Plantel</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Valle</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Municipio</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Latitud</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Longitud</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Estatus</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase pr-8">Acción</TableHead>
                    </TableRow>
                  ) : (
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase">ID / CCT</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Plantel</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Modalidad</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Valle</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-center">Detalle</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Estatus</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase pr-8">Acción</TableHead>
                    </TableRow>
                  )}
                </TableHeader>
                <TableBody>
                  {currentTabRecords.map(rec => (
                    <TableRow key={rec.id} className="hover:bg-slate-50 transition-colors">
                      {activeTab === 'Conoce mi Escuela' ? (
                        <>
                          <TableCell className="font-black text-[10px] text-primary">{rec.cct}</TableCell>
                          <TableCell className="text-[9px] font-bold text-slate-500">{rec.agrupado}</TableCell>
                          <TableCell className="text-[10px] font-black">{rec.vertiente}</TableCell>
                          <TableCell className="text-[10px] text-center">{rec.sector}</TableCell>
                          <TableCell className="text-[10px] text-center">{rec.zonaEscolar}</TableCell>
                          <TableCell className="text-[9px]">{rec.fechaAlta}</TableCell>
                          <TableCell className="text-[9px]">{rec.fechaModif}</TableCell>
                          <TableCell className="text-[9px]">{rec.fechaRevision}</TableCell>
                          <TableCell className="text-[9px]">{rec.date}</TableCell>
                          <TableCell>
                             <Badge variant="outline" className={cn("text-[9px] font-black uppercase", rec.status === 'activo' || rec.status === 'concluido' ? 'border-emerald-500 text-emerald-600' : 'border-amber-500 text-amber-600')}>
                                {rec.status}
                             </Badge>
                          </TableCell>
                          <TableCell className="text-[9px] font-mono text-muted-foreground lowercase">{rec.email}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 py-1">
                                 <button className="text-[8px] font-black text-blue-600 hover:underline uppercase text-left">REVISAR</button>
                                 <button className="text-[8px] font-black text-emerald-600 hover:underline uppercase text-left">PUBLICAR</button>
                                 <button className="text-[8px] font-black text-rose-600 hover:underline uppercase text-left">SUSPENDER</button>
                                 <button className="text-[8px] font-black text-amber-600 hover:underline uppercase text-left">OBSERVAR</button>
                                 <button className="text-[8px] font-black text-slate-600 hover:underline uppercase text-left">ECONTACTO</button>
                                 <button className="text-[8px] font-black text-primary hover:underline uppercase text-left">CONTRASEÑA</button>
                            </div>
                          </TableCell>
                          <TableCell className="text-[9px] text-left italic max-w-[150px] truncate">{rec.observaciones}</TableCell>
                        </>
                      ) : activeTab === 'Geoposición' ? (
                        <>
                          <TableCell className="font-black text-[10px] text-primary">{rec.cct}</TableCell>
                          <TableCell className="text-[10px] font-bold text-slate-600">{rec.zonaEscolar}</TableCell>
                          <TableCell className="text-[10px] font-bold text-slate-600">{rec.sector}</TableCell>
                          <TableCell className="text-[10px] font-black text-slate-700">{rec.schoolName}</TableCell>
                          <TableCell className="text-[10px] uppercase font-bold text-slate-500">{rec.valle}</TableCell>
                          <TableCell className="text-[10px] uppercase font-bold text-slate-500">{rec.municipio}</TableCell>
                          <TableCell className="text-[10px] font-mono text-primary font-bold">{rec.latitud}</TableCell>
                          <TableCell className="text-[10px] font-mono text-primary font-bold">{rec.longitud}</TableCell>
                          <TableCell>
                            <Badge className={cn("text-[9px] font-black uppercase px-2", rec.status === 'activo' ? 'bg-emerald-500' : 'bg-slate-200 text-slate-600')}>
                              {rec.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                             <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => {setFormData(rec); setEditingId(rec.id); setIsDialogOpen(true);}} className="h-8 w-8 hover:text-primary"><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => {
                                  const updated = records.filter(r => r.id !== rec.id);
                                  setRecords(updated);
                                  localStorage.setItem('programs_full', JSON.stringify(updated));
                                }} className="h-8 w-8 text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                             </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-black text-[10px] text-primary">{rec.cct || rec.id}</TableCell>
                          <TableCell className="text-sm font-bold text-slate-700">{rec.schoolName}</TableCell>
                          <TableCell><Badge className="bg-slate-900 text-white text-[10px] px-3">{rec.modalidad}</Badge></TableCell>
                          <TableCell className="text-[10px] font-black uppercase tracking-widest">{rec.valle}</TableCell>
                          <TableCell className="text-center">
                            {rec.name === 'Cuentas Institucionales' ? (
                               <span className="text-[10px] font-mono text-primary font-bold">{rec.email}</span>
                            ) : (
                               <span className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center font-black text-primary mx-auto text-sm">{rec.numeroEquipos}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("text-[10px] font-black uppercase px-4 py-1.5", rec.status === 'activo' || rec.status === 'concluido' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400')}>
                              {rec.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                             <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => {setFormData(rec); setEditingId(rec.id); setIsDialogOpen(true);}} className="h-8 w-8 hover:text-primary transition-colors"><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => {
                                  const updated = records.filter(r => r.id !== rec.id);
                                  setRecords(updated);
                                  localStorage.setItem('programs_full', JSON.stringify(updated));
                                  toast({ title: "Registro eliminado" });
                                }} className="h-8 w-8 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></Button>
                             </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[2rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="uppercase font-black text-primary text-2xl">Gestión de {activeTab}</DialogTitle>
            <DialogDescription className="font-bold text-[11px] uppercase tracking-widest">Ingrese los datos para la auditoría institucional COEES.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary">CCT</Label><Input placeholder="15DESXXXXX" className="font-mono uppercase border-primary/10" value={formData.cct} onChange={e => handleSelectSchool(e.target.value)} /></div>
                
                <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary">Estatus Auditoría</Label>
                   <Select value={formData.status} onValueChange={(val:any) => setFormData({...formData, status: val})}>
                     <SelectTrigger className="border-primary/10 font-bold"><SelectValue /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="activo">ACTIVO</SelectItem>
                       <SelectItem value="inactivo">INACTIVO</SelectItem>
                     </SelectContent>
                   </Select>
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2"><Label className="text-[11px] font-black uppercase text-primary">Nombre del CCT / Titular</Label><Input value={formData.schoolName} onChange={e => setFormData({...formData, schoolName: e.target.value})} className="font-bold" /></div>

                {activeTab === 'Geoposición' ? (
                  <>
                    <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary">Zona Escolar</Label><Input value={formData.zonaEscolar} readOnly className="bg-slate-50" /></div>
                    <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary">Sector</Label><Input value={formData.sector} readOnly className="bg-slate-50" /></div>
                    <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary">Valle</Label><Input value={formData.valle} readOnly className="bg-slate-50" /></div>
                    <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary">Municipio</Label><Input value={formData.municipio} readOnly className="bg-slate-50" /></div>
                    <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary">Latitud</Label><Input placeholder="19.XXXX" className="border-primary/20 font-mono" value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} /></div>
                    <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary">Longitud</Label><Input placeholder="-99.XXXX" className="border-primary/20 font-mono" value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} /></div>
                  </>
                ) : activeTab === 'Cuentas Institucionales' ? (
                  <div className="col-span-1 md:col-span-2 space-y-2"><Label className="text-[11px] font-black uppercase text-primary">Email Institucional</Label><Input className="font-mono lowercase" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                ) : null}

                <div className="col-span-1 md:col-span-2 space-y-2"><Label className="text-[11px] font-black uppercase text-primary">Observaciones Técnicas</Label><Textarea className="min-h-[80px] border-primary/10" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} /></div>
             </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-12 text-[10px] font-black uppercase px-8">Cancelar</Button>
            <Button onClick={handleSave} className="btn-institutional px-12 text-[10px] h-12">Guardar Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}