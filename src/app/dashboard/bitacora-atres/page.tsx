'use client'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  History, 
  Search, 
  FileSpreadsheet, 
  Building2, 
  UserCheck, 
  Calendar, 
  FileText, 
  Eye, 
  Download, 
  Printer, 
  Pencil, 
  Trash2, 
  ShieldCheck, 
  Save, 
  AlertCircle,
  Bell,
  X
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog"
import { type BitacoraEntry, type AppUser } from '@/lib/planning-data'
import * as XLSX from 'xlsx'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const TrafficLight = ({ status }: { status: BitacoraEntry['status'] }) => {
  return (
    <div className="inline-flex flex-col gap-0.5 bg-slate-900 p-1 rounded-lg shadow-xl border border-slate-700/50 w-6">
      {/* Luz Roja */}
      <div className={cn(
        "h-2.5 w-2.5 rounded-full transition-all duration-500 border border-black/20 mx-auto",
        status === 'pendiente' 
          ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" 
          : "bg-rose-900/30 grayscale"
      )} title="No Atendido" />
      
      {/* Luz Ámbar */}
      <div className={cn(
        "h-2.5 w-2.5 rounded-full transition-all duration-500 border border-black/20 mx-auto",
        status === 'proceso' 
          ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" 
          : "bg-amber-900/30 grayscale"
      )} title="En Proceso" />
      
      {/* Luz Verde */}
      <div className={cn(
        "h-2.5 w-2.5 rounded-full transition-all duration-500 border border-black/20 mx-auto", status === 'atendido' 
          ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" 
          : "bg-emerald-900/30 grayscale"
      )} title="Atendido" />
    </div>
  );
}

export default function BitacoraAtresPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<BitacoraEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [pdfToPreview, setPdfToPreview] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Edit State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<BitacoraEntry | null>(null)

  const loadData = () => {
    const stored = JSON.parse(localStorage.getItem('atres_bitacora') || '[]')
    setRecords(stored)

    const rfc = localStorage.getItem('userRfc')
    if (rfc === 'COEES') {
      setIsAdmin(true)
    } else {
      const storedUsers: AppUser[] = JSON.parse(localStorage.getItem('app_users_v1') || '[]')
      const user = storedUsers.find(u => u.rfc.toUpperCase() === rfc?.toUpperCase())
      if (user?.role === 'admin') setIsAdmin(true)
    }
  }

  useEffect(() => {
    setMounted(true)
    loadData()

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'atres_bitacora') loadData()
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records;
    const term = searchTerm.toUpperCase();
    return records.filter(r => 
      (r.cct || '').toUpperCase().includes(term) ||
      (r.schoolName || '').toUpperCase().includes(term) ||
      (r.folio || '').toUpperCase().includes(term) ||
      (r.tecnico || '').toUpperCase().includes(term) ||
      (r.status || '').toUpperCase().includes(term)
    );
  }, [searchTerm, records]);

  const pendingCount = useMemo(() => records.filter(r => r.status === 'pendiente').length, [records]);

  const downloadExcel = () => {
    const dataToExport = filteredRecords.map(r => ({
      Folio: r.folio,
      Fecha: r.fecha,
      CCT: r.cct,
      Plantel: r.schoolName,
      Servicio: r.servicio,
      Técnico: r.tecnico,
      Oficina: r.oficina,
      Estatus: r.status === 'atendido' ? 'Atendido' : r.status === 'proceso' ? 'En Proceso' : 'No Atendido'
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bitácora SOLICITUDES");
    XLSX.writeFile(workbook, `Bitacora_SOLICITUDES_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const downloadFile = (data: string, name: string) => {
    const link = document.createElement('a'); link.href = data; link.download = name; link.click();
  }

  const printFile = (data: string) => {
    const win = window.open();
    if (!win) return;
    win.document.write(`<iframe src="${data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
  }

  const handleEdit = (record: BitacoraEntry) => { setEditingRecord({ ...record }); setIsEditDialogOpen(true); }

  const handleDelete = (id: string) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    localStorage.setItem('atres_bitacora', JSON.stringify(updated));
    toast({ title: "Registro eliminado" });
  }

  const saveEdits = () => {
    if (!editingRecord) return;
    const updated = records.map(r => r.id === editingRecord.id ? editingRecord : r);
    setRecords(updated);
    localStorage.setItem('atres_bitacora', JSON.stringify(updated));
    setIsEditDialogOpen(false);
    setEditingRecord(null);
    toast({ title: "Registro actualizado" });
  }

  if (!mounted) return null;

  return (
    <div className="space-y-4 animate-in fade-in duration-700 w-full max-w-full overflow-hidden px-1">
      {/* ALERTA OPERATIVA COMPACTA */}
      {pendingCount > 0 && (
        <div className="bg-rose-600 text-white p-2.5 rounded-xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-3 animate-in slide-in-from-top duration-500 ring-2 ring-rose-200/50">
           <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center animate-pulse">
                <Bell className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest leading-none">Nueva Alerta Operativa</h3>
                <p className="text-[8px] font-bold uppercase opacity-80 mt-0.5">Existen {pendingCount} folios PENDIENTES que requieren atención inmediata.</p>
              </div>
           </div>
           <div className="flex gap-2">
             <Button 
                onClick={() => setSearchTerm('pendiente')} 
                className="bg-white text-rose-600 hover:bg-slate-100 font-black uppercase text-[8px] h-7 px-4 rounded-lg shadow-md border-none transition-all active:scale-95"
             >
                Atender Solicitudes
             </Button>
             <Button variant="ghost" onClick={() => setSearchTerm('')} className="text-white hover:bg-white/10 h-7 w-7 p-0 rounded-lg"><X className="h-3 w-3" /></Button>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-black tracking-tight text-primary uppercase leading-none">Bitácora de Solicitudes</h2>
          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
            <History className="h-3.5 w-3.5 text-accent" /> Control Histórico de Atención
          </p>
        </div>
        
        <Button onClick={downloadExcel} variant="outline" className="h-9 px-6 rounded-xl border-emerald-200 text-emerald-700 font-black uppercase text-[9px] gap-2 hover:bg-emerald-50 shadow-sm">
          <FileSpreadsheet className="h-4 w-4" /> Exportar a Excel
        </Button>
      </div>

      <Card className="executive-card p-3 bg-white/80 border-none shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-4">
           <div className="flex items-center gap-2 w-full md:w-auto">
              <Search className="h-4 w-4 text-primary" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Buscador:</span>
           </div>
           
           <div className="relative flex-1 w-full">
              <Input 
                placeholder="BUSCAR POR CCT, PLANTEL, TÉCNICO O FOLIO..." 
                className="h-9 rounded-lg bg-slate-50 border-primary/10 pl-9 text-[10px] font-bold uppercase shadow-inner focus:bg-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-300" />
           </div>

           <Badge variant="outline" className="h-9 px-4 rounded-lg border-primary/20 text-primary font-black text-[9px] uppercase">
             Total: {filteredRecords.length}
           </Badge>
        </div>
      </Card>

      <Card className="executive-card p-0 shadow-2xl border-none overflow-hidden bg-white">
        <div className="overflow-x-auto w-full">
          <Table className="w-full">
            <TableHeader className="bg-slate-50 border-b">
              <TableRow className="h-10">
                <TableHead className="w-12 text-[9px] font-black uppercase text-center pl-4">Estatus</TableHead>
                <TableHead className="w-24 text-[9px] font-black uppercase text-center text-primary">Folio</TableHead>
                <TableHead className="w-32 text-[9px] font-black uppercase">Fecha / Hora</TableHead>
                <TableHead className="min-w-[180px] text-[9px] font-black uppercase">Plantel Institucional</TableHead>
                <TableHead className="min-w-[220px] text-[9px] font-black uppercase">Resumen Operativo</TableHead>
                <TableHead className="w-32 text-[9px] font-black uppercase text-center">Analista</TableHead>
                <TableHead className="w-28 text-[9px] font-black uppercase text-center">Expediente</TableHead>
                {isAdmin && <TableHead className="text-right text-[9px] font-black uppercase pr-6 w-24">Acción</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? filteredRecords.map((r) => (
                <TableRow key={r.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 group">
                  <TableCell className="pl-4 text-center py-2">
                    <TrafficLight status={r.status} />
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <span className="font-mono font-black text-[10px] text-primary">{r.folio}</span>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-1.5">
                       <Calendar className="h-3 w-3 text-accent opacity-60" />
                       <span className="text-[9px] font-bold text-slate-500">{r.fecha}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-black text-slate-700 uppercase leading-none truncate max-w-[180px]">{r.schoolName}</span>
                      <div className="flex items-center gap-2 mt-1">
                         <Badge variant="secondary" className="bg-primary/5 text-primary text-[7px] font-black border-primary/10 h-4 px-1.5">{r.cct}</Badge>
                         <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[100px]">{r.oficina?.replace("Oficina de ", "")}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <p className="text-[9px] font-semibold text-slate-600 leading-tight line-clamp-2 max-w-[300px]">
                      {r.servicio}
                    </p>
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <div className="flex items-center justify-center gap-1.5">
                       <UserCheck className="h-3 w-3 text-emerald-600 opacity-60" />
                       <span className="text-[9px] font-black text-slate-700 uppercase truncate max-w-[100px]">{r.tecnico}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                     <div className="flex items-center justify-center gap-1.5">
                        {r.pdfData ? (
                          <div className="flex gap-1">
                             <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg shadow-sm" onClick={() => setPdfToPreview(r.pdfData!)}>
                                <Eye className="h-3.5 w-3.5" />
                             </Button>
                             <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg shadow-sm" onClick={() => downloadFile(r.pdfData!, r.pdfName || 'folio.pdf')}>
                                <Download className="h-3.5 w-3.5" />
                             </Button>
                          </div>
                        ) : (
                          <span className="text-[7px] font-black text-slate-300 uppercase italic">Sin PDF</span>
                        )}
                        {r.excelData ? (
                           <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg shadow-sm" onClick={() => downloadFile(r.excelData!, r.excelName || 'base.xlsx')}>
                              <FileSpreadsheet className="h-3.5 w-3.5" />
                           </Button>
                        ) : (
                          <span className="text-[7px] font-black text-slate-300 uppercase italic">Sin Excel</span>
                        )}
                     </div>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right pr-6 py-2">
                      <div className="flex justify-end gap-1">
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/5 rounded-lg transition-all" onClick={() => handleEdit(r)}>
                            <Pencil className="h-3.5 w-3.5" />
                         </Button>
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600 hover:bg-rose-50 rounded-lg transition-all" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                         </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-20 opacity-30">
                    <div className="flex flex-col items-center gap-2">
                      <History className="h-8 w-8 text-slate-300" />
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sin registros en bitácora</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="flex items-center gap-2 p-2.5 bg-accent/5 border border-accent/10 rounded-xl">
         <AlertCircle className="h-3.5 w-3.5 text-accent" />
         <p className="text-[8px] font-black uppercase tracking-[0.1em] text-accent">
            El semáforo indica la situación operativa final para reporte administrativo 2026.
         </p>
      </div>

      {/* DIÁLOGO DE EDICIÓN COMPACTO */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if(!open) setEditingRecord(null); }}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-primary text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10"><ShieldCheck className="h-20 w-20" /></div>
            <DialogTitle className="uppercase font-black text-white text-lg flex items-center gap-3 relative z-10">
              <Pencil className="h-5 w-5 text-accent" /> Corregir Registro
            </DialogTitle>
            <DialogDescription className="text-white/60 font-bold text-[9px] uppercase tracking-[0.2em] mt-1 relative z-10">
              Modificación controlada de atención técnica
            </DialogDescription>
          </DialogHeader>

          {editingRecord && (
            <div className="p-6 space-y-5">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Folio Asociado</Label>
                     <div className="h-9 bg-slate-50 rounded-lg flex items-center px-3 font-mono font-black text-primary border border-slate-100 shadow-inner text-sm">{editingRecord.folio}</div>
                  </div>
                  <div className="space-y-1">
                     <Label className="text-[9px] font-black uppercase text-slate-400 pl-1">Analista Técnico</Label>
                     <Input 
                        className="h-9 bg-white rounded-lg border-slate-200 font-black uppercase text-[10px]"
                        value={editingRecord.tecnico}
                        onChange={e => setEditingRecord({...editingRecord, tecnico: e.target.value.toUpperCase()})}
                     />
                  </div>
               </div>

               <div className="space-y-3">
                  <Label className="text-[9px] font-black uppercase text-primary pl-1">Actualizar Estatus Operativo</Label>
                  <div className="flex items-center gap-4 bg-slate-900 p-3 rounded-xl border border-slate-700 shadow-inner">
                    <TrafficLight status={editingRecord.status} />
                    <Select value={editingRecord.status} onValueChange={(val: any) => setEditingRecord({...editingRecord, status: val})}>
                      <SelectTrigger className="h-9 rounded-lg bg-white/10 border-white/20 font-black uppercase text-[9px] text-white">
                          <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                          <SelectItem value="atendido" className="text-[9px] font-black text-emerald-600">🟢 ATENDIDO</SelectItem>
                          <SelectItem value="proceso" className="text-[9px] font-black text-amber-600">🟡 EN PROCESO</SelectItem>
                          <SelectItem value="pendiente" className="text-[9px] font-black text-rose-600">🔴 NO ATENDIDO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
               </div>

               <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-primary pl-1">Resumen Operativo del Servicio</Label>
                  <Textarea 
                    className="min-h-[120px] bg-slate-50 border-none rounded-xl p-3 text-[10px] font-semibold shadow-inner focus:bg-white transition-all"
                    value={editingRecord.servicio}
                    onChange={e => setEditingRecord({...editingRecord, servicio: e.target.value.toUpperCase()})}
                  />
               </div>
            </div>
          )}

          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-3">
             <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="font-black text-[9px] uppercase h-10 px-6">Cancelar</Button>
             <Button onClick={saveEdits} className="btn-institutional h-10 px-10 text-[9px] gap-2"><Save className="h-3.5 w-3.5" /> Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VISOR DE PDF INTEGRADO */}
      <Dialog open={!!pdfToPreview} onOpenChange={() => setPdfToPreview(null)}>
        <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <DialogHeader className="p-4 bg-primary text-white shrink-0 flex flex-row justify-between items-center pr-12">
            <div className="space-y-1">
              <DialogTitle className="uppercase font-black text-white text-lg flex items-center gap-3">
                <FileText className="h-5 w-5 text-accent" /> VISOR OFICIAL COEES
              </DialogTitle>
              <DialogDescription className="text-white/60 text-[9px] font-bold uppercase tracking-widest">Documentación de Solicitud</DialogDescription>
            </div>
            <Button onClick={() => pdfToPreview && printFile(pdfToPreview)} className="bg-white text-primary hover:bg-slate-100 font-black text-[9px] uppercase h-9 px-5 rounded-lg gap-2 shadow-xl">
               <Printer className="h-3.5 w-3.5" /> Imprimir
            </Button>
          </DialogHeader>
          <div className="flex-1 bg-slate-800 p-1">
             <iframe src={pdfToPreview || ''} className="w-full h-full border-none rounded-xl bg-white" title="PDF Preview" />
          </div>
          <DialogFooter className="p-3 bg-slate-50 border-t shrink-0">
             <Button variant="ghost" onClick={() => setPdfToPreview(null)} className="h-9 px-8 font-black uppercase text-[9px]">CERRAR VISOR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
