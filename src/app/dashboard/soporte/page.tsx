'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supportData, type SupportTicket } from "@/lib/planning-data";
import { 
  PlusCircle, 
  LifeBuoy, 
  Pencil, 
  Trash2,
  Archive, 
  History,
  Save,
  Search,
  X,
  Wrench,
  Wifi,
  Settings,
  ClipboardCheck,
  Monitor
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { VisitSchedulerDialog } from '@/components/VisitSchedulerDialog';
import { cn } from '@/lib/utils';

export default function SupportPage() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(false);
  
  const [listSearchTerm, setListSearchTerm] = useState(''); 
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);

  const initialFormState: any = {
    id: '',
    cct: '',
    schoolName: '',
    tecnicos: '',
    fechaEntrada: format(new Date(), 'yyyy-MM-dd'),
    tipoIncidencia: 'mantenimiento',
    fases: {
      diagnostico: false,
      cableado: false,
      conectores: false,
      pastaTermica: false,
      limpieza: false,
      configuracion: false,
      pruebas: false
    }
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    setMounted(true);
    const stored = JSON.parse(localStorage.getItem('support_tickets_full') || '[]');
    setTickets(stored.length === 0 ? supportData : stored);
  }, []);

  const handleSave = () => {
    if (!formData.id || !formData.cct) {
      toast({ variant: "destructive", title: "Datos incompletos", description: "El folio y CCT son obligatorios." });
      return;
    }
    const updated = editingTicketId 
      ? tickets.map(t => t.id === editingTicketId ? { ...formData, status: t.status } : t)
      : [{ ...formData, status: 'pendiente' }, ...tickets];
    
    localStorage.setItem('support_tickets_full', JSON.stringify(updated));
    setTickets(updated);
    setIsDialogOpen(false);
    resetForm();
    setEditingTicketId(null);
    toast({ title: "Registro guardado" });
  }

  const resetForm = () => setFormData(initialFormState);

  const handleDeleteTicket = (id: string) => {
    if (!confirm("¿Desea eliminar este reporte?")) return;
    const updated = tickets.filter(t => t.id !== id);
    setTickets(updated);
    localStorage.setItem('support_tickets_full', JSON.stringify(updated));
    toast({ title: "Reporte eliminado" });
  }

  const handleEdit = (ticket: SupportTicket) => {
    setFormData({
      ...ticket,
      fases: (ticket as any).fases || initialFormState.fases
    });
    setEditingTicketId(ticket.id!);
    setIsDialogOpen(true);
  }

  const filteredTickets = tickets.filter(t => {
    const matchSearch = (t.cct || '').toUpperCase().includes(listSearchTerm.toUpperCase()) ||
      (t.schoolName || '').toUpperCase().includes(listSearchTerm.toUpperCase()) ||
      (t.id || '').toUpperCase().includes(listSearchTerm.toUpperCase());
    return matchSearch;
  });

  const toggleFase = (faseKey: string) => {
    setFormData({
      ...formData,
      fases: {
        ...formData.fases,
        [faseKey]: !formData.fases[faseKey]
      }
    });
  }

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-primary">Soporte técnico</h2>
          <p className="text-xs font-bold text-muted-foreground flex items-center gap-2">
            <LifeBuoy className="h-4 w-4 text-accent" /> Centro de control operativo institucional
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button onClick={() => setIsSchedulerOpen(true)} variant="outline" className="h-12 px-6 rounded-xl border-primary/20 text-primary font-bold text-[11px] gap-2 shadow-md hover:bg-primary/5">
            <ClipboardCheck className="h-5 w-5" /> Agenda de visitas
          </Button>
          <Button onClick={() => { resetForm(); setEditingTicketId(null); setIsDialogOpen(true); }} className="btn-institutional h-12 px-8 shadow-xl text-[11px]">
            <PlusCircle className="h-5 w-5 mr-2" /> Nuevo reporte de servicio
          </Button>
        </div>
      </div>

      <Card className="executive-card p-0 shadow-xl border-t-8 border-t-primary">
        <CardHeader className="bg-slate-50/50 p-6 border-b">
           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <History className="h-6 w-6" />
                 </div>
                 <div>
                    <CardTitle className="text-base font-black">Historial de servicios</CardTitle>
                    <CardDescription className="text-xs font-bold text-slate-400">Seguimiento de folios de atención técnica</CardDescription>
                 </div>
              </div>
              <div className="relative w-full md:w-64">
                 <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                 <Input 
                   placeholder="Buscar CCT o folio..." 
                   className="h-9 pl-10 rounded-xl border-slate-200 text-xs font-bold bg-white"
                   value={listSearchTerm}
                   onChange={e => setListSearchTerm(e.target.value)}
                 />
              </div>
           </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-100/30">
              <TableRow>
                <TableHead className="w-24 text-xs font-bold pl-6">Folio</TableHead>
                <TableHead className="min-w-[200px] text-xs font-bold">Centro de trabajo</TableHead>
                <TableHead className="text-xs font-bold">Servicio</TableHead>
                <TableHead className="text-xs font-bold">Fecha</TableHead>
                <TableHead className="text-xs font-bold text-center">Estatus</TableHead>
                <TableHead className="text-right text-xs font-bold pr-10">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length > 0 ? filteredTickets.map((ticket) => (
                <TableRow key={ticket.id} className="hover:bg-slate-50 transition-colors h-16 group">
                  <TableCell className="text-center pl-6 font-mono font-black text-sm text-primary">#{ticket.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700 leading-none">{ticket.schoolName}</span>
                      <span className="text-[10px] font-bold text-muted-foreground mt-1">{ticket.cct}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary capitalize">{ticket.tipoIncidencia}</Badge></TableCell>
                  <TableCell className="text-xs font-bold text-slate-500">{ticket.fechaEntrada}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn("text-[10px] font-bold px-3 h-5 rounded-full border-none", 
                      ticket.status === 'atendido' ? "bg-emerald-500 text-white" : 
                      ticket.status === 'en proceso' ? "bg-amber-500 text-white" : 
                      "bg-rose-500 text-white")}>
                      {ticket.status === 'atendido' ? 'Atendido' : ticket.status === 'en proceso' ? 'En proceso' : 'Pendiente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                     <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5 rounded-xl" onClick={() => handleEdit(ticket)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => ticket.id && handleDeleteTicket(ticket.id)}><Trash2 className="h-4 w-4" /></Button>
                     </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={6} className="text-center py-24 opacity-30 text-sm font-bold uppercase tracking-widest">Sin reportes registrados</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingTicketId(null); }}>
        <DialogContent className="sm:max-w-[850px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white flex flex-col h-[90vh]">
          <DialogHeader className="p-8 bg-primary text-white shrink-0">
            <DialogTitle className="font-black text-2xl flex items-center gap-4">
              <PlusCircle className="h-8 w-8 text-accent" /> {editingTicketId ? 'Editar reporte de servicio' : 'Nuevo reporte de servicio'}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="p-8 space-y-8">
               {/* Sección de Identificación */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-8 rounded-[2.5rem] border border-primary/5 shadow-inner">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-primary pl-1">Folio oficial</Label>
                    <Input 
                      placeholder="COEES-000" 
                      className="h-12 bg-white rounded-xl border-primary/10 font-mono font-black text-lg px-6 shadow-sm text-primary uppercase" 
                      value={formData.id} 
                      onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-primary pl-1">CCT del plantel</Label>
                    <Input 
                      placeholder="15DES0000X" 
                      className="h-12 bg-white rounded-xl border-primary/10 font-mono font-black text-lg px-6 shadow-sm uppercase" 
                      value={formData.cct} 
                      onChange={e => setFormData({...formData, cct: e.target.value.toUpperCase()})} 
                      maxLength={10}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-xs font-black text-primary pl-1">Nombre del plantel</Label>
                    <Input 
                      placeholder="Nombre del centro de trabajo..." 
                      className="h-12 bg-white rounded-xl border-primary/10 font-bold px-6 shadow-sm uppercase" 
                      value={formData.schoolName} 
                      onChange={e => setFormData({...formData, schoolName: e.target.value.toUpperCase()})} 
                    />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-xs font-black text-primary pl-1">Tipo de servicio</Label>
                     <Select value={formData.tipoIncidencia} onValueChange={(val: any) => setFormData({...formData, tipoIncidencia: val})}>
                        <SelectTrigger className="h-12 bg-white border-primary/10 rounded-xl font-bold px-6 shadow-sm uppercase">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                           <SelectItem value="red local" className="text-xs font-bold">Red local</SelectItem>
                           <SelectItem value="red edusat" className="text-xs font-bold">Red Edusat</SelectItem>
                           <SelectItem value="mantenimiento" className="text-xs font-bold">Mantenimiento preventivo</SelectItem>
                           <SelectItem value="teleplanteles" className="text-xs font-bold">Teleplanteles</SelectItem>
                           <SelectItem value="cuenta institucional" className="text-xs font-bold">Cuentas institucionales</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-2">
                     <Label className="text-xs font-black text-primary pl-1">Fecha de atención</Label>
                     <Input type="date" className="h-12 bg-white border-primary/10 rounded-xl font-bold px-6 shadow-sm" value={formData.fechaEntrada} onChange={e => setFormData({...formData, fechaEntrada: e.target.value})} />
                  </div>
               </div>

               {/* SECCIÓN DE FASES TÉCNICAS - SIEMPRE VISIBLE */}
               <div className="space-y-6 pt-2 animate-in zoom-in-95 duration-500">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                     <Wrench className="h-5 w-5 text-accent" />
                     <h4 className="text-xs font-black text-accent tracking-widest uppercase">Ficha técnica: Fases de atención</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {[
                       { id: 'diagnostico', label: 'Diagnóstico integral inicial', icon: <Search className="h-4 w-4" /> },
                       { id: 'cableado', label: 'Revisión física de cableado', icon: <Wifi className="h-4 w-4" /> },
                       { id: 'conectores', label: 'Ponchado de conectores RJ45', icon: <Settings className="h-4 w-4" /> },
                       { id: 'pastaTermica', label: 'Cambio de pasta térmica', icon: <Settings className="h-4 w-4" /> },
                       { id: 'limpieza', label: 'Limpieza interna de equipo', icon: <Wrench className="h-4 w-4" /> },
                       { id: 'configuracion', label: 'Configuración lógica / IPs', icon: <Monitor className="h-4 w-4" /> },
                       { id: 'pruebas', label: 'Pruebas de señal y enlace', icon: <ClipboardCheck className="h-4 w-4" /> },
                     ].map(fase => (
                       <div 
                         key={fase.id} 
                         className={cn(
                           "flex items-center space-x-4 p-5 rounded-[1.5rem] border transition-all cursor-pointer group shadow-sm", 
                           formData.fases?.[fase.id] ? "bg-emerald-50 border-emerald-300 ring-1 ring-emerald-100 shadow-md" : "bg-white border-slate-100 hover:border-primary/20"
                         )} 
                         onClick={() => toggleFase(fase.id)}
                       >
                          <Checkbox 
                            checked={formData.fases?.[fase.id] || false} 
                            onCheckedChange={() => toggleFase(fase.id)} 
                            className="h-6 w-6 border-primary data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-600 rounded-lg" 
                          />
                          <div className="flex items-center gap-3">
                             <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center transition-colors", formData.fases?.[fase.id] ? "bg-emerald-100 text-emerald-600" : "bg-slate-50 text-slate-400")}>
                               {fase.icon}
                             </div>
                             <Label className="text-sm font-bold cursor-pointer group-hover:text-primary transition-colors leading-tight">{fase.label}</Label>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="space-y-4">
                  <Label className="text-xs font-black text-primary pl-2">Analistas responsables</Label>
                  <Input placeholder="Nombres del personal comisionado..." className="h-12 bg-slate-50 border-none rounded-xl font-bold px-6 shadow-inner uppercase" value={formData.tecnicos} onChange={e => setFormData({...formData, tecnicos: e.target.value.toUpperCase()})} />
               </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-6 shrink-0 shadow-inner">
             <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-14 px-10 rounded-2xl font-bold text-xs text-slate-400 hover:text-primary transition-all">Cancelar</Button>
             <Button onClick={handleSave} className="btn-institutional h-14 px-16 text-xs gap-3 rounded-2xl shadow-2xl"><Save className="h-6 w-6" /> Guardar reporte</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VisitSchedulerDialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen} areaId="soporte" areaName="Soporte técnico" />
    </div>
  );
}
