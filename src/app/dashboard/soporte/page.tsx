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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { supportData, type SupportTicket } from "@/lib/planning-data";
import { 
  PlusCircle, 
  LifeBuoy, 
  Pencil, 
  Trash2,
  Archive, 
  Package,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  History,
  Save,
  Search,
  X,
  Activity,
  Box,
  CheckCircle2,
  Plus,
  Layers,
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

type InventoryItem = {
  id: number;
  name: string;
  qty: number;
  unit: string;
  minStock: number;
  category: string;
  locations: string[];
};

type WarehouseMovement = {
  id: string;
  type: 'entrada' | 'salida';
  itemId: number;
  itemName: string;
  qty: number;
  date: string;
  recipient?: string;
  folio?: string;
};

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 1, name: 'Cable UTP Categoría 6', qty: 4, unit: 'Bobina (305m)', minStock: 2, category: 'REDES', locations: ['TOLUCA'] },
  { id: 2, name: 'Conectores RJ45 (Bolsa)', qty: 2, unit: 'Bolsa 100pzs', minStock: 5, category: 'REDES', locations: ['ECATEPEC'] },
  { id: 3, name: 'Pasta Térmica Jeringa', qty: 15, unit: 'Pieza', minStock: 10, category: 'MTTO', locations: ['TOLUCA'] },
  { id: 4, name: 'Limpiador de Contactos (Spray)', qty: 10, unit: 'Pieza', minStock: 5, category: 'MTTO', locations: ['NEZAHUALCÓYOTL'] },
  { id: 5, name: 'Aire Comprimido', qty: 18, unit: 'Pieza', minStock: 10, category: 'MTTO', locations: ['NAUCALPAN'] },
];

export default function SupportPage() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(false);
  const [isCriticalDialogOpen, setIsCriticalDialogOpen] = useState(false);
  const [isNewItemDialogOpen, setIsNewItemDialogOpen] = useState(false);
  const [warehouseActiveTab, setWarehouseActiveTab] = useState('resumen');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<WarehouseMovement[]>([]);
  
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    unit: 'Pieza',
    minStock: 5
  });

  const [movementForm, setMovementForm] = useState({
    itemIdEntrada: '',
    itemIdSalida: '',
    qtyEntrada: 0,
    qtySalida: 0,
    recipientEntrada: '',
    recipientSalida: '',
    folio: ''
  });
  
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
    },
    consumibles: []
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    setMounted(true);
    const stored = JSON.parse(localStorage.getItem('support_tickets_full') || '[]');
    setTickets(stored.length === 0 ? supportData : stored);

    const storedInv = JSON.parse(localStorage.getItem('coees_inventory_v1') || '[]');
    setInventory(storedInv.length === 0 ? INITIAL_INVENTORY : storedInv);

    const storedMovs = JSON.parse(localStorage.getItem('coees_movements_v1') || '[]');
    setMovements(storedMovs);
  }, []);

  const handleSave = () => {
    if (!formData.id || !formData.cct) {
      toast({ variant: "destructive", title: "Faltan datos obligatorios", description: "El folio y CCT son necesarios." }); return;
    }
    const updated = editingTicketId 
      ? tickets.map(t => t.id === editingTicketId ? { ...formData, status: t.status } : t)
      : [{ ...formData, status: 'pendiente' }, ...tickets];
    
    localStorage.setItem('support_tickets_full', JSON.stringify(updated));
    setTickets(updated);
    setIsDialogOpen(false);
    resetForm();
    setEditingTicketId(null);
    toast({ title: "Reporte guardado con éxito" });
  }

  const resetForm = () => setFormData(initialFormState);

  const handleAddNewItem = () => {
    if (!newItemForm.name || !newItemForm.unit) {
      toast({ variant: "destructive", title: "Datos incompletos" }); return;
    }
    const newItem: InventoryItem = {
      id: Date.now(),
      name: newItemForm.name.toUpperCase(),
      qty: 0,
      unit: newItemForm.unit,
      minStock: newItemForm.minStock,
      category: 'GENERAL',
      locations: ['TOLUCA']
    };
    const updatedInventory = [...inventory, newItem];
    setInventory(updatedInventory);
    localStorage.setItem('coees_inventory_v1', JSON.stringify(updatedInventory));
    setMovementForm(prev => ({ ...prev, itemIdEntrada: newItem.id.toString() }));
    setIsNewItemDialogOpen(false);
    setNewItemForm({ name: '', unit: 'Pieza', minStock: 5 });
    toast({ title: "Nuevo material registrado" });
  };

  const handleRegisterMovement = (type: 'entrada' | 'salida') => {
    const { itemIdEntrada, itemIdSalida, qtyEntrada, qtySalida, recipientEntrada, recipientSalida, folio } = movementForm;
    const itemId = type === 'entrada' ? itemIdEntrada : itemIdSalida;
    const qty = type === 'entrada' ? qtyEntrada : qtySalida;
    const recipient = type === 'entrada' ? recipientEntrada : recipientSalida;

    if (!itemId || qty <= 0) { 
      toast({ variant: "destructive", title: "Datos incompletos" }); return; 
    }
    const item = inventory.find(i => i.id === parseInt(itemId));
    if (!item) return;
    if (type === 'salida' && item.qty < qty) { 
      toast({ variant: "destructive", title: "Stock insuficiente" }); return; 
    }
    const newQty = type === 'entrada' ? item.qty + qty : item.qty - qty;
    const updatedInventory = inventory.map(i => i.id === item.id ? { ...i, qty: newQty } : i);
    const newMovement: WarehouseMovement = { 
      id: `MOV-${Date.now()}`, 
      type, 
      itemId: item.id, 
      itemName: item.name, 
      qty, 
      date: format(new Date(), 'dd/MM/yyyy HH:mm'), 
      recipient: recipient?.toUpperCase() || 'S/D', 
      folio: folio?.toUpperCase() || 'S/F'
    };
    setInventory(updatedInventory);
    const updatedMovements = [newMovement, ...movements];
    setMovements(updatedMovements);
    localStorage.setItem('coees_inventory_v1', JSON.stringify(updatedInventory));
    localStorage.setItem('coees_movements_v1', JSON.stringify(updatedMovements));
    setMovementForm({ itemIdEntrada: '', itemIdSalida: '', qtyEntrada: 0, qtySalida: 0, recipientEntrada: '', recipientSalida: '', folio: '' });
    toast({ title: "Movimiento registrado" });
  }

  const handleDeleteTicket = (id: string) => {
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

  const lowStockItems = useMemo(() => inventory.filter(i => i.qty <= i.minStock), [inventory]);

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
          <h2 className="text-3xl font-black tracking-tight text-primary">Soporte Técnico</h2>
          <p className="text-xs font-bold text-muted-foreground flex items-center gap-2">
            <LifeBuoy className="h-4 w-4 text-accent" /> Centro de control operativo institucional
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button onClick={() => setIsWarehouseOpen(true)} variant="outline" className="h-12 px-8 rounded-xl border-primary/20 text-primary font-bold text-xs gap-2 shadow-md hover:bg-primary/5">
            <Archive className="h-5 w-5" /> Almacén técnico
          </Button>
          <Button onClick={() => { resetForm(); setEditingTicketId(null); setIsDialogOpen(true); }} className="btn-institutional h-12 px-10 shadow-xl">
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
                    <CardTitle className="text-base font-black">Reportes de servicio</CardTitle>
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
                <TableHead className="text-xs font-bold">Tipo de servicio</TableHead>
                <TableHead className="text-xs font-bold">Fecha programada</TableHead>
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
                     <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        <DialogContent className="sm:max-w-[800px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white flex flex-col h-[90vh]">
          <DialogHeader className="p-8 bg-primary text-white shrink-0">
            <DialogTitle className="font-black text-2xl flex items-center gap-4">
              <PlusCircle className="h-8 w-8 text-accent" /> {editingTicketId ? 'Editar folio de servicio' : 'Alta de reporte de servicio'}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="p-8 space-y-8">
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
                    <Label className="text-xs font-black text-primary pl-1">Nombre institucional del plantel</Label>
                    <Input 
                      placeholder="Nombre del centro de trabajo..." 
                      className="h-12 bg-white rounded-xl border-primary/10 font-bold px-6 shadow-sm uppercase" 
                      value={formData.schoolName} 
                      onChange={e => setFormData({...formData, schoolName: e.target.value.toUpperCase()})} 
                    />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-xs font-black text-primary pl-1">Tipo de incidencia</Label>
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
                     <Label className="text-xs font-black text-primary pl-1">Fecha programada</Label>
                     <Input type="date" className="h-12 bg-white border-primary/10 rounded-xl font-bold px-6 shadow-sm" value={formData.fechaEntrada} onChange={e => setFormData({...formData, fechaEntrada: e.target.value})} />
                  </div>
               </div>

               {/* SECCIÓN DINÁMICA: FASES TÉCNICAS */}
               {(formData.tipoIncidencia === 'red local' || formData.tipoIncidencia === 'red edusat' || formData.tipoIncidencia === 'mantenimiento') && (
                 <div className="space-y-6 pt-2 animate-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                       <Wrench className="h-5 w-5 text-accent" />
                       <h4 className="text-xs font-black text-accent tracking-widest uppercase">Fases de atención técnica</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {[
                         { id: 'diagnostico', label: 'Diagnóstico integral inicial', icon: <Search className="h-4 w-4" /> },
                         { id: 'cableado', label: 'Revisión física de cableado', icon: <Wifi className="h-4 w-4" /> },
                         { id: 'conectores', label: 'Ponchado de conectores RJ45', icon: <Layers className="h-4 w-4" /> },
                         { id: 'pastaTermica', label: 'Cambio de pasta térmica', icon: <Settings className="h-4 w-4" /> },
                         { id: 'limpieza', label: 'Limpieza interna de equipo', icon: <Wrench className="h-4 w-4" /> },
                         { id: 'configuracion', label: 'Configuración lógica / IPs', icon: <Monitor className="h-4 w-4" /> },
                         { id: 'pruebas', label: 'Pruebas de señal y enlace', icon: <ClipboardCheck className="h-4 w-4" /> },
                       ].map(fase => (
                         <div 
                           key={fase.id} 
                           className={cn(
                             "flex items-center space-x-4 p-5 rounded-[1.5rem] border transition-all cursor-pointer group shadow-sm", 
                             formData.fases[fase.id] ? "bg-emerald-50 border-emerald-300 ring-1 ring-emerald-100 shadow-md" : "bg-white border-slate-100 hover:border-primary/20"
                           )} 
                           onClick={() => toggleFase(fase.id)}
                         >
                            <Checkbox 
                              checked={formData.fases[fase.id]} 
                              onCheckedChange={() => toggleFase(fase.id)} 
                              className="h-6 w-6 border-primary data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-600 rounded-lg" 
                            />
                            <div className="flex items-center gap-3">
                               <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center transition-colors", formData.fases[fase.id] ? "bg-emerald-100 text-emerald-600" : "bg-slate-50 text-slate-400")}>
                                 {fase.icon}
                               </div>
                               <Label className="text-sm font-bold cursor-pointer group-hover:text-primary transition-colors leading-tight">{fase.label}</Label>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
               )}

               <div className="space-y-4">
                  <Label className="text-xs font-black text-primary pl-2">Personal técnico comisionado</Label>
                  <Input placeholder="Nombres de los analistas responsables..." className="h-12 bg-slate-50 border-none rounded-xl font-bold px-6 shadow-inner uppercase" value={formData.tecnicos} onChange={e => setFormData({...formData, tecnicos: e.target.value.toUpperCase()})} />
               </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-6 shrink-0 shadow-inner">
             <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-14 px-10 rounded-2xl font-bold text-xs text-slate-400 hover:text-primary transition-all">Cancelar</Button>
             <Button onClick={handleSave} className="btn-institutional h-14 px-16 text-xs gap-3 rounded-2xl shadow-2xl"><Save className="h-6 w-6" /> Guardar reporte</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE ALMACÉN TÉCNICO */}
      <Dialog open={isWarehouseOpen} onOpenChange={setIsWarehouseOpen}>
        <DialogContent className="sm:max-w-[1200px] rounded-[2.5rem] h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white shrink-0">
            <DialogTitle className="font-black text-2xl flex items-center gap-4">
              <Package className="h-8 w-8 text-accent" /> Control de almacén técnico
            </DialogTitle>
            <DialogDescription className="text-white/60 font-bold text-xs tracking-widest mt-2">Sistema integral de entradas, salidas y stock crítico</DialogDescription>
          </DialogHeader>
          <Tabs value={warehouseActiveTab} onValueChange={setWarehouseActiveTab} className="flex-1 flex flex-col overflow-hidden bg-white">
            <div className="px-8 border-b bg-slate-50/50">
              <TabsList className="bg-transparent h-14 p-0 gap-8">
                <TabsTrigger value="resumen" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-bold uppercase tracking-wider transition-all">Panel resumen</TabsTrigger>
                <TabsTrigger value="inventario" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-bold uppercase tracking-wider transition-all">Inventario actual</TabsTrigger>
                <TabsTrigger value="movimientos" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-bold uppercase tracking-wider transition-all">Flujo de materiales</TabsTrigger>
              </TabsList>
            </div>
            <div className="flex-1 overflow-hidden">
              <TabsContent value="resumen" className="h-full m-0 p-0 overflow-hidden">
                <ScrollArea className="h-full p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <Card 
                        className="executive-card p-8 bg-primary/5 border-l-[12px] border-l-primary flex justify-between items-center shadow-xl cursor-pointer hover:bg-primary/10 transition-all group"
                        onClick={() => setIsCriticalDialogOpen(true)}
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-black text-primary/60 tracking-widest">Insumos críticos</p>
                          <h3 className="text-6xl font-black text-primary leading-none">{lowStockItems.length}</h3>
                        </div>
                        <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <AlertTriangle className="h-10 w-10" />
                        </div>
                      </Card>
                      <Card className="executive-card p-8 bg-accent/5 border-l-[12px] border-l-accent flex justify-between items-center shadow-xl">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-accent/60 tracking-widest">Movimientos hoy</p>
                          <h3 className="text-6xl font-black text-accent leading-none">{movements.filter(m => m.date.includes(format(new Date(), 'dd/MM/yyyy'))).length}</h3>
                        </div>
                        <div className="h-16 w-16 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                          <Activity className="h-10 w-10" />
                        </div>
                      </Card>
                      <Card className="executive-card p-8 bg-emerald-50 border-l-[12px] border-l-emerald-500 flex justify-between items-center shadow-xl">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-emerald-600/60 tracking-widest">Total de materiales</p>
                          <h3 className="text-6xl font-black text-emerald-600 leading-none">{inventory.length}</h3>
                        </div>
                        <div className="h-16 w-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                          <Box className="h-10 w-10" />
                        </div>
                      </Card>
                    </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="inventario" className="h-full m-0 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <Table className="w-full">
                    <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b h-14">
                      <TableRow>
                        <TableHead className="pl-12 font-bold text-xs">Material o insumo técnico</TableHead>
                        <TableHead className="text-center font-bold text-xs">Existencia</TableHead>
                        <TableHead className="text-center font-bold text-xs">Unidad de medida</TableHead>
                        <TableHead className="text-center font-bold text-xs">Estatus de stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventory.map(i => (
                        <TableRow key={i.id} className="h-20 hover:bg-slate-50 transition-colors">
                          <TableCell className="pl-12 font-bold text-sm text-slate-700">{i.name}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn("text-base font-black h-10 w-20 flex items-center justify-center rounded-xl", i.qty <= i.minStock ? "bg-rose-500" : "bg-primary")}>{i.qty}</Badge>
                          </TableCell>
                          <TableCell className="text-center text-xs font-bold text-slate-500">{i.unit}</TableCell>
                          <TableCell className="text-center">
                             <div className="flex flex-col items-center gap-1">
                                {i.qty <= i.minStock ? (
                                  <span className="text-[10px] font-bold text-rose-600">Reabastecer inmediato</span>
                                ) : (
                                  <span className="text-[10px] font-bold text-emerald-600">Disponible</span>
                                )}
                             </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="movimientos" className="h-full m-0 p-0 bg-slate-50/50 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-8 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {/* Panel Salida */}
                      <Card className="executive-card p-10 border-t-[12px] border-t-accent bg-white shadow-2xl relative">
                          <div className="absolute top-8 right-10 flex items-center gap-3">
                            <div className="h-10 w-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent"><TrendingDown className="h-6 w-6" /></div>
                            <h4 className="text-base font-black text-accent">Salida de material</h4>
                          </div>
                          <div className="space-y-6 mt-6">
                            <div className="space-y-2">
                              <Label className="text-xs font-bold text-slate-400 pl-1">Seleccionar material</Label>
                              <Select value={movementForm.itemIdSalida} onValueChange={(val) => setMovementForm(prev => ({...prev, itemIdSalida: val}))}>
                                  <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold text-xs shadow-inner">
                                    <SelectValue placeholder="Elegir insumo..." />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-2xl">
                                    {inventory.map(i => <SelectItem key={`sal-${i.id}`} value={i.id.toString()} className="text-xs font-bold">{i.name} (Disp: {i.qty})</SelectItem>)}
                                  </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-400 pl-1">Cantidad</Label>
                                <Input type="number" className="h-14 bg-slate-50 border-none rounded-2xl text-center font-black text-2xl shadow-inner" value={movementForm.qtySalida || ''} onChange={e => setMovementForm(prev => ({...prev, qtySalida: parseInt(e.target.value) || 0}))} />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-400 pl-1">Folio asociado</Label>
                                <Input className="h-14 bg-slate-50 border-none rounded-2xl font-mono px-6 text-sm font-black shadow-inner uppercase" value={movementForm.folio} onChange={e => setMovementForm(prev => ({...prev, folio: e.target.value.toUpperCase()}))} />
                              </div>
                            </div>
                            <Button onClick={() => handleRegisterMovement('salida')} className="w-full bg-accent hover:bg-accent/90 text-white h-16 rounded-[1.5rem] font-black text-xs shadow-xl mt-4">Registrar salida</Button>
                          </div>
                      </Card>

                      {/* Panel Entrada */}
                      <Card className="executive-card p-10 border-t-[12px] border-t-primary bg-white shadow-2xl relative">
                          <div className="absolute top-8 right-10 flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><TrendingUp className="h-6 w-6" /></div>
                            <h4 className="text-base font-black text-primary">Entrada de material</h4>
                          </div>
                          <div className="space-y-6 mt-6">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center pr-1">
                                <Label className="text-xs font-bold text-slate-400 pl-1">Seleccionar material</Label>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" onClick={() => setIsNewItemDialogOpen(true)}><Plus className="h-4 w-4" /></Button>
                              </div>
                              <Select value={movementForm.itemIdEntrada} onValueChange={(val) => setMovementForm(prev => ({...prev, itemIdEntrada: val}))}>
                                  <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold text-xs shadow-inner">
                                    <SelectValue placeholder="Elegir o crear nuevo..." />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-2xl">
                                    {inventory.map(i => <SelectItem key={`ent-${i.id}`} value={i.id.toString()} className="text-xs font-bold">{i.name}</SelectItem>)}
                                  </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-400 pl-1">Cantidad de ingreso</Label>
                                <Input type="number" className="h-14 bg-slate-50 border-none rounded-2xl text-center font-black text-2xl shadow-inner" value={movementForm.qtyEntrada || ''} onChange={e => setMovementForm(prev => ({...prev, qtyEntrada: parseInt(e.target.value) || 0}))} />
                            </div>
                            <Button onClick={() => handleRegisterMovement('entrada')} className="w-full btn-institutional h-16 rounded-[1.5rem] mt-4">Registrar entrada</Button>
                          </div>
                      </Card>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
          <DialogFooter className="p-4 bg-slate-50 border-t shrink-0 flex justify-end">
             <Button variant="ghost" onClick={() => setIsWarehouseOpen(false)} className="rounded-xl h-10 px-8 text-xs font-bold">Cerrar almacén</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VisitSchedulerDialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen} areaId="soporte" areaName="Soporte técnico" />
    </div>
  );
}
