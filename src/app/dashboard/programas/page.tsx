
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { programsData, type ProgramStatus } from "@/lib/planning-data"
import { schoolsDirectory } from "@/lib/schools-directory"
import { cn } from "@/lib/utils"
import { 
  PlusCircle, 
  Pencil, 
  Monitor, 
  Trash2,
  Activity,
  Plus,
  MonitorCheck,
  Building2,
  Target
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
    numeroEquipos: 0, observaciones: '', capacitacion: 'N', asistentes: [], email: ''
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
    if (!formData.id || !formData.cct) {
      toast({ variant: "destructive", title: "Datos Incompletos", description: "Folio y CCT obligatorios." });
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
          <h2 className="text-2xl font-black tracking-tight text-primary uppercase">Módulos Técnicos COEES</h2>
          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
            <Activity className="h-3 w-3 text-accent" /> Control de Programas y Auditoría 2026
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full h-12 bg-white border border-slate-100 p-1 rounded-xl shadow-sm overflow-x-auto">
          {PROGRAM_RUBROS.map(rubro => (
            <TabsTrigger 
              key={rubro} 
              value={rubro} 
              className="flex-1 h-full text-[9px] font-black uppercase rounded-lg tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
            >
              {rubro}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 animate-in fade-in duration-500">
          <Card className="executive-card p-6 flex items-center justify-between border-2 border-white">
             <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                 <Target className="h-5 w-5" />
               </div>
               <div>
                 <h3 className="text-lg font-black uppercase text-slate-900 leading-none">{activeTab}</h3>
                 <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Registros de Auditoría Técnica</p>
               </div>
             </div>
             <Button onClick={() => { setFormData({...initialFormState, name: activeTab, id: `PROG-${activeTab.substring(0,2)}-${Date.now()}`}); setEditingId(null); setIsDialogOpen(true); }} className="btn-institutional px-6 h-10 text-[9px]">
                <PlusCircle className="h-3.5 w-3.5 mr-2" /> Nuevo Registro
             </Button>
          </Card>

          <Card className="executive-card p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  {activeTab === 'Conoce mi Escuela' ? (
                    <TableRow>
                      <TableHead className="text-[9px] font-black uppercase">CCT</TableHead>
                      <TableHead className="text-[9px] font-black uppercase">Agrupado</TableHead>
                      <TableHead className="text-[9px] font-black uppercase">Vert.</TableHead>
                      <TableHead className="text-[9px] font-black uppercase">Sect.</TableHead>
                      <TableHead className="text-[9px] font-black uppercase">Zona</TableHead>
                      <TableHead className="text-[9px] font-black uppercase">Alta</TableHead>
                      <TableHead className="text-[9px] font-black uppercase">Modif.</TableHead>
                      <TableHead className="text-[9px] font-black uppercase">Revisión</TableHead>
                      <TableHead className="text-[9px] font-black uppercase">Fecha</TableHead>
                      <TableHead className="text-[9px] font-black uppercase">Status</TableHead>
                      <TableHead className="text-[9px] font-black uppercase">Email</TableHead>
                      <TableHead className="text-[9px] font-black uppercase">Suspensión / Acciones</TableHead>
                      <TableHead className="text-[9px] font-black uppercase">Observaciones</TableHead>
                    </TableRow>
                  ) : (
                    <TableRow>
                      <TableHead className="text-[9px] font-black uppercase">ID / CCT</TableHead>
                      <TableHead className="text-[9px] font-black uppercase">Plantel</TableHead>
                      <TableHead className="text-[9px] font-black uppercase">Modalidad</TableHead>
                      <TableHead className="text-[9px] font-black uppercase">Valle</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-center">Detalle</TableHead>
                      <TableHead className="text-[9px] font-black uppercase">Estatus</TableHead>
                      <TableHead className="text-right text-[9px] font-black uppercase pr-8">Acción</TableHead>
                    </TableRow>
                  )}
                </TableHeader>
                <TableBody>
                  {currentTabRecords.map(rec => (
                    <TableRow key={rec.id} className="hover:bg-slate-50 transition-colors">
                      {activeTab === 'Conoce mi Escuela' ? (
                        <>
                          <TableCell className="font-black text-[9px] text-primary">{rec.cct}</TableCell>
                          <TableCell className="text-[8px] font-bold text-slate-500">{rec.agrupado}</TableCell>
                          <TableCell className="text-[9px] font-black">{rec.vertiente}</TableCell>
                          <TableCell className="text-[9px] text-center">{rec.sector}</TableCell>
                          <TableCell className="text-[9px] text-center">{rec.zonaEscolar}</TableCell>
                          <TableCell className="text-[8px]">{rec.fechaAlta}</TableCell>
                          <TableCell className="text-[8px]">{rec.fechaModif}</TableCell>
                          <TableCell className="text-[8px]">{rec.fechaRevision}</TableCell>
                          <TableCell className="text-[8px]">{rec.date}</TableCell>
                          <TableCell>
                             <Badge variant="outline" className={cn("text-[8px] font-black uppercase", rec.status === 'concluido' ? 'border-emerald-500 text-emerald-600' : 'border-amber-500 text-amber-600')}>
                                {rec.status}
                             </Badge>
                          </TableCell>
                          <TableCell className="text-[8px] font-mono text-muted-foreground lowercase">{rec.email}</TableCell>
                          <TableCell className="bg-slate-50/30">
                            <div className="flex flex-col gap-0.5 items-center">
                               <span className="text-[8px] text-rose-500 font-bold mb-1">{rec.fechaSuspension || '-'}</span>
                               <div className="flex flex-col gap-0.5">
                                 <button className="text-[7px] font-black text-blue-600 hover:underline uppercase">REVISAR</button>
                                 <button className="text-[7px] font-black text-emerald-600 hover:underline uppercase">PUBLICAR</button>
                                 <button className="text-[7px] font-black text-rose-600 hover:underline uppercase">SUSPENDER</button>
                                 <button className="text-[7px] font-black text-amber-600 hover:underline uppercase">OBSERVAR</button>
                                 <button className="text-[7px] font-black text-slate-600 hover:underline uppercase">ECONTACTO</button>
                                 <button className="text-[7px] font-black text-indigo-600 hover:underline uppercase">CONTRASEÑA</button>
                               </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-[8px] text-left italic max-w-[150px] truncate">{rec.observaciones}</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-black text-[9px] text-primary">{rec.cct || rec.id}</TableCell>
                          <TableCell className="text-[10px] font-bold text-slate-700">{rec.schoolName}</TableCell>
                          <TableCell><Badge className="bg-slate-900 text-white text-[8px] px-2">{rec.modalidad}</Badge></TableCell>
                          <TableCell className="text-[8px] font-black uppercase tracking-widest">{rec.valle}</TableCell>
                          <TableCell className="text-center">
                            {rec.name === 'Cuentas Institucionales' ? (
                               <span className="text-[8px] font-mono text-primary font-bold">{rec.email}</span>
                            ) : (
                               <span className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center font-black text-primary mx-auto text-xs">{rec.numeroEquipos}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("text-[9px] font-black uppercase px-3 py-1", rec.status === 'activo' || rec.status === 'concluido' ? 'bg-emerald-500' : 'bg-slate-100 text-slate-400')}>
                              {rec.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                             <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => {setFormData(rec); setEditingId(rec.id); setIsDialogOpen(true);}} className="h-7 w-7"><Pencil className="h-3 w-3" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => setRecords(records.filter(r => r.id !== rec.id))} className="h-7 w-7 text-rose-500"><Trash2 className="h-3 w-3" /></Button>
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
        <DialogContent className="sm:max-w-[700px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="uppercase font-black text-primary">Gestión de {activeTab}</DialogTitle>
            <DialogDescription className="font-bold text-[10px]">Ingrese los datos para la auditoría institucional COEES.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             {activeTab === 'Cuentas Institucionales' ? (
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1"><Label className="text-[10px] font-black uppercase">CCT Plantel</Label><Input placeholder="15DESXXXXX" className="uppercase h-10" value={formData.cct} onChange={e => handleSelectSchool(e.target.value)} /></div>
                   <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Titular de la Cuenta</Label><Input value={formData.schoolName} onChange={e => setFormData({...formData, schoolName: e.target.value})} className="h-10" /></div>
                   <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Correo Institucional</Label><Input placeholder="@desysa.gob.mx" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-10" /></div>
                   <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Estatus Operativo</Label>
                      <Select value={formData.status} onValueChange={(val:any) => setFormData({...formData, status: val})}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="activo">ACTIVO</SelectItem><SelectItem value="inactivo">INACTIVO</SelectItem></SelectContent>
                      </Select>
                   </div>
                   <div className="col-span-2 space-y-1"><Label className="text-[10px] font-black uppercase">Observaciones</Label><Textarea value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} /></div>
                </div>
             ) : (
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1"><Label className="text-[10px] font-black uppercase">CCT</Label><Input placeholder="15DESXXXXX" value={formData.cct} onChange={e => handleSelectSchool(e.target.value)} /></div>
                   <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Folio</Label><Input value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} /></div>
                   <div className="space-y-1"><Label className="text-[10px] font-black uppercase">N. Equipos</Label><Input type="number" value={formData.numeroEquipos} onChange={e => setFormData({...formData, numeroEquipos: parseInt(e.target.value)||0})} /></div>
                   <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Capacitación</Label>
                      <Select value={formData.capacitacion} onValueChange={(val:any) => setFormData({...formData, capacitacion: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="S">SÍ</SelectItem><SelectItem value="N">NO</SelectItem></SelectContent>
                      </Select>
                   </div>
                   <div className="col-span-2 space-y-1"><Label className="text-[10px] font-black uppercase">Observaciones</Label><Textarea value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} /></div>
                </div>
             )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-10 text-[9px] font-black uppercase">Cancelar</Button>
            <Button onClick={handleSave} className="btn-institutional px-10 h-10 text-[9px]">Guardar Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
