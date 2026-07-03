
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
  CheckCircle2, 
  UserCheck, 
  Calendar, 
  FileText, 
  Eye, 
  Download, 
  Printer, 
  FileBox,
  Pencil,
  Trash2,
  ShieldCheck,
  Save,
  X,
  AlertCircle,
  Circle
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

  useEffect(() => {
    setMounted(true)
    const stored = JSON.parse(localStorage.getItem('atres_bitacora') || '[]')
    setRecords(stored)

    // Check Admin Status
    const rfc = localStorage.getItem('userRfc')
    if (rfc === 'COEES') {
      setIsAdmin(true)
    } else {
      const storedUsers: AppUser[] = JSON.parse(localStorage.getItem('app_users_v1') || '[]')
      const user = storedUsers.find(u => u.rfc.toUpperCase() === rfc?.toUpperCase())
      if (user?.role === 'admin') setIsAdmin(true)
    }
  }, [])

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records;
    const term = searchTerm.toUpperCase();
    return records.filter(r => 
      (r.cct || '').toUpperCase().includes(term) ||
      (r.schoolName || '').toUpperCase().includes(term) ||
      (r.folio || '').toUpperCase().includes(term) ||
      (r.tecnico || '').toUpperCase().includes(term)
    );
  }, [searchTerm, records]);

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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bitácora ATRES");
    XLSX.writeFile(workbook, `Bitacora_ATRES_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const downloadFile = (data: string, name: string) => {
    const link = document.createElement('a');
    link.href = data;
    link.download = name;
    link.click();
  }

  const printFile = (data: string) => {
    const win = window.open();
    if (!win) return;
    win.document.write(`<iframe src="${data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
  }

  const handleEdit = (record: BitacoraEntry) => {
    setEditingRecord({ ...record });
    setIsEditDialogOpen(true);
  }

  const handleDelete = (id: string) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    localStorage.setItem('atres_bitacora', JSON.stringify(updated));
    toast({ title: "Registro eliminado", description: "El folio ha sido removido de la bitácora." });
  }

  const saveEdits = () => {
    if (!editingRecord) return;
    const updated = records.map(r => r.id === editingRecord.id ? editingRecord : r);
    setRecords(updated);
    localStorage.setItem('atres_bitacora', JSON.stringify(updated));
    setIsEditDialogOpen(false);
    setEditingRecord(null);
    toast({ title: "Registro actualizado", description: "Los cambios se guardaron correctamente." });
  }

  const getStatusBadge = (status: BitacoraEntry['status']) => {
    switch (status) {
      case 'atendido':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 h-6 px-3 rounded-full">
            <Circle className="h-1.5 w-1.5 fill-emerald-600 border-none" /> Atendido
          </Badge>
        );
      case 'proceso':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5 h-6 px-3 rounded-full">
            <Circle className="h-1.5 w-1.5 fill-amber-500 border-none" /> En Proceso
          </Badge>
        );
      case 'pendiente':
      default:
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 gap-1.5 h-6 px-3 rounded-full">
            <Circle className="h-1.5 w-1.5 fill-rose-600 border-none" /> No Atendido
          </Badge>
        );
    }
  }

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase leading-none">Bitácora de Solicitudes</h2>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2 mt-1">
            <History className="h-4 w-4 text-accent" /> Control Histórico de Atención Final ATRES
          </p>
        </div>
        
        <Button onClick={downloadExcel} variant="outline" className="h-12 px-8 rounded-xl border-emerald-200 text-emerald-700 font-black uppercase text-[10px] gap-2 hover:bg-emerald-50 shadow-md">
          <FileSpreadsheet className="h-5 w-5" /> Exportar a Excel
        </Button>
      </div>

      <Card className="executive-card p-6 bg-white/80 border-none shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-6">
           <div className="flex items-center gap-3 w-full md:w-auto">
              <Search className="h-5 w-5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buscador Operativo:</span>
           </div>
           
           <div className="relative flex-1 w-full">
              <Input 
                placeholder="BUSCAR POR CCT, PLANTEL, TÉCNICO O FOLIO..." 
                className="h-12 rounded-xl bg-slate-50 border-primary/10 pl-12 text-sm font-bold uppercase shadow-inner focus:bg-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
           </div>

           <Badge variant="outline" className="h-12 px-6 rounded-xl border-primary/20 text-primary font-black text-[10px] uppercase">
             Total Atenciones: {filteredRecords.length}
           </Badge>
        </div>
      </Card>

      <Card className="executive-card p-0 shadow-2xl border-none overflow-hidden bg-white">
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader className="bg-slate-50 border-b">
              <TableRow className="h-14">
                <TableHead className="w-24 text-[10px] font-black uppercase text-center pl-6">Folio</TableHead>
                <TableHead className="min-w-[150px] text-[10px] font-black uppercase">Fecha / Hora</TableHead>
                <TableHead className="min-w-[180px] text-[10px] font-black uppercase">Identificación del Plantel</TableHead>
                <TableHead className="min-w-[200px] text-[10px] font-black uppercase">Resumen Operativo</TableHead>
                <TableHead className="w-40 text-[10px] font-black uppercase text-center">Estatus Operativo</TableHead>
                <TableHead className="min-w-[120px] text-[10px] font-black uppercase text-center">Analista</TableHead>
                <TableHead className="w-28 text-[10px] font-black uppercase text-center">Expediente</TableHead>
                {isAdmin && <TableHead className="text-right text-[10px] font-black uppercase pr-10">Acción</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? filteredRecords.map((r) => (
                <TableRow key={r.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 h-24 group">
                  <TableCell className="pl-6 text-center">
                    <span className="font-mono font-black text-xs text-primary">{r.folio}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Calendar className="h-3 w-3 text-accent" />
                       <span className="text-[10px] font-bold text-slate-500">{r.fecha}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-700 uppercase leading-none">{r.schoolName}</span>
                      <div className="flex items-center gap-2 mt-1.5">
                         <Badge variant="secondary" className="bg-primary/5 text-primary text-[8px] font-black border-primary/10">{r.cct}</Badge>
                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{r.oficina.replace("Oficina de ", "")}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-[9px] font-semibold text-slate-600 leading-relaxed line-clamp-3 max-w-[300px]">
                      {r.servicio}
                    </p>
                  </TableCell>
                  <TableCell className="text-center">
                     {getStatusBadge(r.status)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                       <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                       <span className="text-[10px] font-black text-slate-700 uppercase">{r.tecnico}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                     <div className="flex items-center justify-center gap-2">
                        {r.pdfData ? (
                          <div className="flex gap-1">
                             <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg shadow-sm" onClick={() => setPdfToPreview(r.pdfData!)}>
                                <Eye className="h-4 w-4" />
                             </Button>
                             <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg shadow-sm" onClick={() => downloadFile(r.pdfData!, r.pdfName || 'folio.pdf')}>
                                <Download className="h-4 w-4" />
                             </Button>
                          </div>
                        ) : (
                          <span className="text-[8px] font-black text-slate-300 uppercase italic">Sin PDF</span>
                        )}
                        {r.excelData ? (
                           <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg shadow-sm" onClick={() => downloadFile(r.excelData!, r.excelName || 'base.xlsx')}>
                              <FileSpreadsheet className="h-4 w-4" />
                           </Button>
                        ) : (
                          <span className="text-[8px] font-black text-slate-300 uppercase italic">Sin Excel</span>
                        )}
                     </div>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right pr-10">
                      <div className="flex justify-end gap-2">
                         <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5 rounded-xl transition-all" onClick={() => handleEdit(r)}>
                            <Pencil className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-600 hover:bg-rose-50 rounded-xl transition-all" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="h-4 w-4" />
                         </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-28 opacity-30">
                    <div className="flex flex-col items-center gap-4">
                      <History className="h-12 w-12 text-slate-300" />
                      <p className="text-sm font-black uppercase tracking-widest text-slate-400">Sin registros en bitácora para mostrar</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="flex items-center gap-3 p-4 bg-accent/5 border border-accent/10 rounded-2xl animate-pulse">
         <UserCheck className="h-5 w-5 text-accent" />
         <p className="text-[10px] font-black uppercase tracking-[0.15em] text-accent">
            Histórico consolidado de atenciones técnicas. Los datos aquí mostrados son auditables y permanentes para el reporte de actividades COEES 2026.
         </p>
      </div>

      {/* DIÁLOGO DE EDICIÓN (ADMIN ONLY) */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if(!open) setEditingRecord(null); }}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-primary text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheck className="h-24 w-24" /></div>
            <DialogTitle className="uppercase font-black text-white text-xl flex items-center gap-4 relative z-10">
              <Pencil className="h-6 w-6 text-accent" /> Corregir Registro Histórico
            </DialogTitle>
            <DialogDescription className="text-white/60 font-bold text-[10px] uppercase tracking-[0.3em] mt-2 relative z-10">
              Modificación controlada de atención técnica concluida
            </DialogDescription>
          </DialogHeader>

          {editingRecord && (
            <div className="p-8 space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Folio Asociado</Label>
                     <div className="h-10 bg-slate-50 rounded-xl flex items-center px-4 font-mono font-black text-primary border border-slate-100 shadow-inner">{editingRecord.folio}</div>
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Analista Responsable</Label>
                     <Input 
                        className="h-10 bg-white rounded-xl border-slate-200 font-black uppercase text-xs"
                        value={editingRecord.tecnico}
                        onChange={e => setEditingRecord({...editingRecord, tecnico: e.target.value.toUpperCase()})}
                     />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-primary pl-1">Estatus del Semáforo</Label>
                     <Select value={editingRecord.status} onValueChange={(val: any) => setEditingRecord({...editingRecord, status: val})}>
                        <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 font-black uppercase text-[10px]">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                           <SelectItem value="atendido" className="text-[10px] font-black text-emerald-600">🟢 ATENDIDO</SelectItem>
                           <SelectItem value="proceso" className="text-[10px] font-black text-amber-600">🟡 EN PROCESO</SelectItem>
                           <SelectItem value="pendiente" className="text-[10px] font-black text-rose-600">🔴 NO ATENDIDO</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>

               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary pl-1">Resumen Operativo del Servicio</Label>
                  <Textarea 
                    className="min-h-[160px] bg-slate-50 border-none rounded-2xl p-4 text-xs font-semibold shadow-inner focus:bg-white transition-all"
                    value={editingRecord.servicio}
                    onChange={e => setEditingRecord({...editingRecord, servicio: e.target.value.toUpperCase()})}
                  />
               </div>

               <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-amber-600" />
                  <p className="text-[9px] font-black text-amber-800 uppercase leading-tight">
                    Esta acción modificará permanentemente el registro en la bitácora oficial y en los reportes de planeación anual.
                  </p>
               </div>
            </div>
          )}

          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4">
             <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="font-black text-[10px] uppercase h-12 px-8">Cancelar</Button>
             <Button onClick={saveEdits} className="btn-institutional h-12 px-12 text-[10px] gap-2"><Save className="h-4 w-4" /> Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VISOR DE PDF INTEGRADO */}
      <Dialog open={!!pdfToPreview} onOpenChange={() => setPdfToPreview(null)}>
        <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <DialogHeader className="p-5 bg-primary text-white shrink-0 flex flex-row justify-between items-center pr-12">
            <div className="space-y-1">
              <DialogTitle className="uppercase font-black text-white text-lg flex items-center gap-3">
                <FileText className="h-5 w-5 text-accent" /> VISOR OFICIAL COEES - BITÁCORA
              </DialogTitle>
              <DialogDescription className="text-white/60 text-[9px] font-bold uppercase tracking-widest">Documentación Histórica de Solicitud de Servicio</DialogDescription>
            </div>
            <Button onClick={() => pdfToPreview && printFile(pdfToPreview)} className="bg-white text-primary hover:bg-slate-100 font-black text-[9px] uppercase h-9 px-5 rounded-lg gap-2 shadow-xl">
               <Printer className="h-3.5 w-3.5" /> Imprimir Documento
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
