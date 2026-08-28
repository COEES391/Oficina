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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supportData, type SupportTicket } from "@/lib/planning-data"
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
  ShoppingCart,
  CheckCircle2
} from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { VisitSchedulerDialog } from '@/components/VisitSchedulerDialog'
import { cn } from '@/lib/utils'

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
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false)
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(false)
  const [isCriticalDialogOpen, setIsCriticalDialogOpen] = useState(false)
  const [warehouseActiveTab, setWarehouseActiveTab] = useState('resumen')
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<WarehouseMovement[]>([])
  
  const [movementForm, setMovementForm] = useState({
    itemIdEntrada: '',
    itemIdSalida: '',
    qtyEntrada: 0,
    qtySalida: 0,
    recipientEntrada: '',
    recipientSalida: '',
    folio: ''
  })
  
  const [listSearchTerm, setListSearchTerm] = useState('') 
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null)

  const initialFormState: Omit<SupportTicket, 'status'> = {
    id: '',
    cct: '',
    schoolName: '',
    tecnicos: '',
    fechaEntrada: '',
    tipoIncidencia: 'mantenimiento' as any,
  }

  const [formData, setFormData] = useState(initialFormState)

  useEffect(() => {
    setMounted(true)
    const stored = JSON.parse(localStorage.getItem('support_tickets_full') || '[]')
    setTickets(stored.length === 0 ? supportData : stored)

    const storedInv = JSON.parse(localStorage.getItem('coees_inventory_v1') || '[]')
    setInventory(storedInv.length === 0 ? INITIAL_INVENTORY : storedInv)

    const storedMovs = JSON.parse(localStorage.getItem('coees_movements_v1') || '[]')
    setMovements(storedMovs)

    setFormData(prev => ({ ...prev, fechaEntrada: format(new Date(), 'yyyy-MM-dd') }))
  }, [])

  const handleSave = () => {
    if (!formData.id || !formData.cct) {
      toast({ variant: "destructive", title: "Faltan datos obligatorios" }); return;
    }
    const updated = editingTicketId 
      ? tickets.map(t => t.id === editingTicketId ? { ...formData, status: t.status } as SupportTicket : t)
      : [{ ...formData, status: 'pendiente' } as SupportTicket, ...tickets];
    
    localStorage.setItem('support_tickets_full', JSON.stringify(updated));
    setTickets(updated);
    setIsDialogOpen(false);
    resetForm();
    setEditingTicketId(null);
    toast({ title: "Reporte Guardado" });
  }

  const resetForm = () => setFormData({ ...initialFormState, id: '', fechaEntrada: format(new Date(), 'yyyy-MM-dd') })

  const handleRegisterMovement = (type: 'entrada' | 'salida') => {
    const { itemIdEntrada, itemIdSalida, qtyEntrada, qtySalida, recipientEntrada, recipientSalida, folio } = movementForm;
    
    const itemId = type === 'entrada' ? itemIdEntrada : itemIdSalida;
    const qty = type === 'entrada' ? qtyEntrada : qtySalida;
    const recipient = type === 'entrada' ? recipientEntrada : recipientSalida;

    if (!itemId || qty <= 0) { 
      toast({ variant: "destructive", title: "Datos incompletos", description: "Seleccione material y cantidad." }); 
      return; 
    }
    
    const item = inventory.find(i => i.id === parseInt(itemId));
    if (!item) return;
    
    if (type === 'salida' && item.qty < qty) { 
      toast({ variant: "destructive", title: "Stock insuficiente" }); 
      return; 
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
    
    if (type === 'entrada') {
      setMovementForm(prev => ({ ...prev, itemIdEntrada: '', qtyEntrada: 0, recipientEntrada: '' }));
    } else {
      setMovementForm(prev => ({ ...prev, itemIdSalida: '', qtySalida: 0, recipientSalida: '', folio: '' }));
    }
    
    toast({ title: "Movimiento registrado con éxito" });
  }

  const handleDeleteTicket = (id: string) => {
    const updated = tickets.filter(t => t.id !== id);
    setTickets(updated);
    localStorage.setItem('support_tickets_full', JSON.stringify(updated));
    toast({ title: "Reporte eliminado" });
  }

  const handleEdit = (ticket: SupportTicket) => {
    setFormData({
      id: ticket.id || '',
      cct: ticket.cct || '',
      schoolName: ticket.schoolName || '',
      tecnicos: ticket.tecnicos || '',
      fechaEntrada: ticket.fechaEntrada || '',
      tipoIncidencia: ticket.tipoIncidencia || 'mantenimiento' as any,
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

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase leading-none">Soporte Técnico COEES</h2>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2 mt-1">
            <LifeBuoy className="h-4 w-4 text-accent" /> Centro de Control Operativo Institucional
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button onClick={() => setIsWarehouseOpen(true)} variant="outline" className="h-12 px-8 rounded-xl border-primary/20 text-primary font-black uppercase text-[10px] gap-2 shadow-md hover:bg-primary/5">
            <Archive className="h-5 w-5" /> Almacén
          </Button>
          <Button onClick={() => { resetForm(); setEditingTicketId(null); setIsDialogOpen(true); }} className="btn-institutional h-12 px-10 rounded-xl shadow-lg">
            <PlusCircle className="h-5 w-5 mr-2" /> Nuevo Reporte
          </Button>
        </div>
      </div>

      <Card className="executive-card p-0 shadow-xl overflow-hidden border-t-8 border-t-primary">
        <CardHeader className="bg-slate-50/50 p-6 border-b">
           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <History className="h-6 w-6" />
                 </div>
                 <div>
                    <CardTitle className="text-base font-black uppercase">Reportes Recientes</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Seguimiento de folios de atención técnica</CardDescription>
                 </div>
              </div>
              <div className="relative w-full md:w-64">
                 <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                 <Input 
                   placeholder="BUSCAR CCT O FOLIO..." 
                   className="h-9 pl-10 rounded-xl border-slate-200 text-[10px] font-black uppercase bg-white"
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
                <TableHead className="w-20 text-[10px] font-black uppercase text-center pl-6">Folio</TableHead>
                <TableHead className="min-w-[200px] text-[10px] font-black uppercase">Centro de Trabajo</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Servicio</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Fecha</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">Estatus</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase pr-10">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length > 0 ? filteredTickets.map((ticket) => (
                <TableRow key={ticket.id} className="hover:bg-slate-50 transition-colors h-16 group">
                  <TableCell className="text-center pl-6 font-mono font-black text-xs text-primary">#{ticket.id}</TableCell>
                  <TableCell><div className="flex flex-col"><span className="text-[11px] font-black uppercase leading-none">{ticket.schoolName}</span><span className="text-[9px] font-bold text-muted-foreground mt-1">{ticket.cct}</span></div></TableCell>
                  <TableCell><Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 text-primary">{ticket.tipoIncidencia}</Badge></TableCell>
                  <TableCell className="text-[10px] font-bold text-slate-500">{ticket.fechaEntrada}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn("text-[8px] font-black h-5 px-3 rounded-full", ticket.status === 'atendido' ? "bg-emerald-500" : ticket.status === 'en proceso' ? "bg-amber-500" : "bg-rose-500")}>
                      {ticket.status?.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                     <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg" onClick={() => handleEdit(ticket)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg" onClick={() => ticket.id && handleDeleteTicket(ticket.id)}><Trash2 className="h-4 w-4" /></Button>
                     </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-24 opacity-30 text-[10px] font-black uppercase tracking-widest">Sin reportes encontrados</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isWarehouseOpen} onOpenChange={setIsWarehouseOpen}>
        <DialogContent className="sm:max-w-[1200px] rounded-[2.5rem] h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-[#9f2241] text-white shrink-0">
            <DialogTitle className="uppercase font-black text-white text-2xl flex items-center gap-4">
              <Package className="h-8 w-8 text-accent" /> Control de Almacén Técnico COEES
            </DialogTitle>
            <DialogDescription className="text-white/60 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Sistema Integral de Entradas, Salidas y Stock Crítico</DialogDescription>
          </DialogHeader>
          <Tabs value={warehouseActiveTab} onValueChange={setWarehouseActiveTab} className="flex-1 flex flex-col overflow-hidden bg-white">
            <div className="px-8 border-b bg-slate-50/50">
              <TabsList className="bg-transparent h-14 p-0 gap-8">
                <TabsTrigger value="resumen" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all">DASHBOARD</TabsTrigger>
                <TabsTrigger value="inventario" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all">INVENTARIO ACTUAL</TabsTrigger>
                <TabsTrigger value="movimientos" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all">REGISTRO DE FLUJO</TabsTrigger>
              </TabsList>
            </div>
            <div className="flex-1 overflow-hidden">
              <TabsContent value="resumen" className="h-full m-0 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <Card 
                        className="executive-card p-8 bg-primary/5 border-l-[12px] border-l-primary flex justify-between items-center shadow-xl cursor-pointer hover:bg-primary/10 transition-all group"
                        onClick={() => setIsCriticalDialogOpen(true)}
                      >
                        <div className="space-y-1">
                          <p className="text-[11px] font-black uppercase text-primary/60 tracking-widest">Insumos Críticos</p>
                          <h3 className="text-6xl font-black text-primary leading-none">{lowStockItems.length}</h3>
                        </div>
                        <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <AlertTriangle className="h-10 w-10" />
                        </div>
                      </Card>
                      <Card className="executive-card p-8 bg-accent/5 border-l-[12px] border-l-accent flex justify-between items-center shadow-xl">
                        <div className="space-y-1">
                          <p className="text-[11px] font-black uppercase text-accent/60 tracking-widest">Movimientos Hoy</p>
                          <h3 className="text-6xl font-black text-accent leading-none">{movements.filter(m => m.date.includes(format(new Date(), 'dd/MM/yyyy'))).length}</h3>
                        </div>
                        <div className="h-16 w-16 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                          <Activity className="h-10 w-10" />
                        </div>
                      </Card>
                      <Card className="executive-card p-8 bg-emerald-50 border-l-[12px] border-l-emerald-500 flex justify-between items-center shadow-xl">
                        <div className="space-y-1">
                          <p className="text-[11px] font-black uppercase text-emerald-600/60 tracking-widest">Total de SKUs</p>
                          <h3 className="text-6xl font-black text-emerald-600 leading-none">{inventory.length}</h3>
                        </div>
                        <div className="h-16 w-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                          <Box className="h-10 w-10" />
                        </div>
                      </Card>
                    </div>

                    <div className="mt-12 space-y-6">
                      <h4 className="text-sm font-black uppercase text-slate-800 tracking-[0.2em] flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-primary" /> Alertas de Abastecimiento Inmediato
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {lowStockItems.map(item => (
                          <div key={`alert-${item.id}`} className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex items-center justify-between shadow-sm">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-rose-800 leading-none">{item.name}</span>
                              <span className="text-[8px] font-bold text-rose-400 mt-1 uppercase">Stock: {item.qty} {item.unit}</span>
                            </div>
                            <Badge className="bg-rose-600 text-white font-black text-[9px]">CRÍTICO</Badge>
                          </div>
                        ))}
                        {lowStockItems.length === 0 && (
                          <div className="col-span-full p-8 text-center border-2 border-dashed rounded-[2rem] opacity-30">
                            <p className="text-xs font-black uppercase tracking-widest">Todos los insumos se encuentran en niveles óptimos</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="inventario" className="h-full m-0 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <Table className="w-full">
                    <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b">
                      <TableRow className="h-14">
                        <TableHead className="pl-12 font-black uppercase text-[11px] text-primary">Insumo Técnico / Material</TableHead>
                        <TableHead className="text-center font-black uppercase text-[11px] text-primary">Existencia Actual</TableHead>
                        <TableHead className="text-center font-black uppercase text-[11px] text-primary">Unidad</TableHead>
                        <TableHead className="text-center font-black uppercase text-[11px] text-primary">Estatus Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventory.map(i => (
                        <TableRow key={i.id} className="h-20 hover:bg-slate-50 border-b border-slate-50 transition-colors">
                          <TableCell className="pl-12 font-black text-slate-700 text-sm uppercase">{i.name}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-3">
                               <Badge className={cn("text-base font-black h-10 w-20 flex items-center justify-center rounded-xl shadow-lg shadow-black/5", i.qty <= i.minStock ? "bg-rose-500 hover:bg-rose-600" : "bg-primary hover:bg-primary/90")}>{i.qty}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">{i.unit}</TableCell>
                          <TableCell className="text-center">
                             <div className="flex flex-col items-center gap-1">
                                {i.qty <= i.minStock ? (
                                  <>
                                    <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                    <span className="text-[8px] font-black text-rose-600 uppercase">Solicitar</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                    <span className="text-[8px] font-black text-emerald-600 uppercase">Disponible</span>
                                  </>
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
                            <h4 className="text-base font-black uppercase text-accent tracking-tighter">Salida de Material</h4>
                          </div>
                          <div className="space-y-6 mt-6">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">ELEGIR MATERIAL...</Label>
                              <Select value={movementForm.itemIdSalida} onValueChange={(val) => setMovementForm(prev => ({...prev, itemIdSalida: val}))}>
                                  <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-black uppercase text-xs focus:ring-accent shadow-inner">
                                    <SelectValue placeholder="SELECCIONAR INSUMO..." />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                                    {inventory.map(i => <SelectItem key={`sal-${i.id}`} value={i.id.toString()} className="text-[11px] font-bold uppercase">{i.name} (Disponibles: {i.qty})</SelectItem>)}
                                  </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">CANTIDAD</Label>
                                <Input type="number" placeholder="0" className="h-14 bg-slate-50 border-none rounded-2xl text-center font-black text-2xl shadow-inner" value={movementForm.qtySalida || ''} onChange={e => setMovementForm(prev => ({...prev, qtySalida: parseInt(e.target.value) || 0}))} />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">FOLIO / SOLICITUD</Label>
                                <Input placeholder="S/F" className="h-14 bg-slate-50 border-none rounded-2xl uppercase font-mono px-6 text-sm font-black shadow-inner" value={movementForm.folio} onChange={e => setMovementForm(prev => ({...prev, folio: e.target.value.toUpperCase()}))} />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">USUARIO A QUIEN SE LE DIO EL MATERIAL...</Label>
                              <Input 
                                  placeholder="NOMBRE DEL ANALISTA O DOCENTE..." 
                                  className="h-14 bg-slate-50 border-none rounded-2xl uppercase font-black px-8 text-xs shadow-inner" 
                                  value={movementForm.recipientSalida} 
                                  onChange={e => setMovementForm(prev => ({...prev, recipientSalida: e.target.value.toUpperCase()}))} 
                              />
                            </div>
                            <Button onClick={() => handleRegisterMovement('salida')} className="w-full bg-accent hover:bg-accent/90 text-white h-16 rounded-[1.5rem] font-black uppercase shadow-2xl shadow-accent/20 transition-all active:scale-[0.98] mt-4">REGISTRAR SALIDA</Button>
                          </div>
                      </Card>

                      {/* Panel Entrada */}
                      <Card className="executive-card p-10 border-t-[12px] border-t-primary bg-white shadow-2xl relative">
                          <div className="absolute top-8 right-10 flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><TrendingUp className="h-6 w-6" /></div>
                            <h4 className="text-base font-black uppercase text-primary tracking-tighter">Entrada de Material</h4>
                          </div>
                          <div className="space-y-6 mt-6">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">ELEGIR MATERIAL...</Label>
                              <Select value={movementForm.itemIdEntrada} onValueChange={(val) => setMovementForm(prev => ({...prev, itemIdEntrada: val}))}>
                                  <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-black uppercase text-xs shadow-inner">
                                    <SelectValue placeholder="SELECCIONAR INSUMO..." />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                                    {inventory.map(i => <SelectItem key={`ent-${i.id}`} value={i.id.toString()} className="text-[11px] font-bold uppercase">{i.name}</SelectItem>)}
                                  </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">CANTIDAD</Label>
                                  <Input type="number" placeholder="0" className="h-14 bg-slate-50 border-none rounded-2xl text-center font-black text-2xl shadow-inner" value={movementForm.qtyEntrada || ''} onChange={e => setMovementForm(prev => ({...prev, qtyEntrada: parseInt(e.target.value) || 0}))} />
                              </div>
                              <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">QUIEN RECIBE...</Label>
                                  <Input 
                                    placeholder="ANALISTA RESPONSABLE..." 
                                    className="h-14 bg-slate-50 border-none rounded-2xl uppercase font-black px-8 text-xs shadow-inner" 
                                    value={movementForm.recipientEntrada} 
                                    onChange={e => setMovementForm(prev => ({...prev, recipientEntrada: e.target.value.toUpperCase()}))} 
                                  />
                              </div>
                            </div>
                            <div className="pt-4">
                              <Button onClick={() => handleRegisterMovement('entrada')} className="w-full btn-institutional h-16 shadow-2xl shadow-primary/20 active:scale-[0.98] transition-all rounded-[1.5rem]">REGISTRAR ENTRADA</Button>
                            </div>
                          </div>
                      </Card>
                    </div>

                    <div className="overflow-hidden border-2 border-slate-100 rounded-[2.5rem] bg-white shadow-2xl flex flex-col">
                      <div className="p-5 bg-slate-50 border-b flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <History className="h-5 w-5 text-slate-400" />
                            <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Historial de Registro de Flujo en Tiempo Real</span>
                          </div>
                          <Badge variant="outline" className="bg-white text-primary font-black border-primary/20 px-3">{movements.length} Movimientos</Badge>
                      </div>
                      <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-white sticky top-0 z-10 border-b shadow-sm">
                              <TableRow>
                                  <TableHead className="pl-10 py-4 text-[10px] font-black uppercase text-slate-400">Fecha y Hora</TableHead>
                                  <TableHead className="text-center text-[10px] font-black uppercase text-slate-400">Operación</TableHead>
                                  <TableHead className="text-[10px] font-black uppercase text-slate-400">Material Insumo</TableHead>
                                  <TableHead className="text-center text-[10px] font-black uppercase text-slate-400">Cantidad</TableHead>
                                  <TableHead className="text-[10px] font-black uppercase text-slate-400">Folio / Responsable</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {movements.map(m => (
                                <TableRow key={m.id} className="h-14 hover:bg-slate-50 border-b border-slate-50 transition-colors">
                                  <TableCell className="pl-10 text-[10px] font-bold text-slate-400">{m.date}</TableCell>
                                  <TableCell className="text-center">
                                    <Badge className={cn("text-[8px] font-black px-3 h-5 rounded-full", m.type === 'entrada' ? "bg-emerald-500" : "bg-accent")}>{m.type.toUpperCase()}</Badge>
                                  </TableCell>
                                  <TableCell className="text-[11px] font-black uppercase text-slate-700">{m.itemName}</TableCell>
                                  <TableCell className="text-center font-black text-primary text-base">{m.qty}</TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-primary leading-none">{m.folio || 'INGRESO'}</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase mt-1 truncate max-w-[180px]">{m.recipient || 'S/D'}</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {movements.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="text-center py-20 opacity-20 font-black uppercase text-xs">Sin movimientos registrados recientemente</TableCell></TableRow>
                              )}
                            </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
          <DialogFooter className="p-4 bg-slate-50 border-t shrink-0 flex justify-end">
             <Button variant="ghost" onClick={() => setIsWarehouseOpen(false)} className="rounded-xl h-10 px-8 text-[10px] font-black uppercase">Cerrar Almacén</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ventana Emergente de Insumos Críticos */}
      <Dialog open={isCriticalDialogOpen} onOpenChange={setIsCriticalDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <DialogHeader className="p-8 bg-primary text-white shrink-0">
             <div className="flex items-center gap-5">
                <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center text-white shadow-inner">
                   <AlertTriangle className="h-10 w-10" />
                </div>
                <div>
                   <DialogTitle className="uppercase font-black text-2xl">Insumos Críticos</DialogTitle>
                   <DialogDescription className="text-white/60 font-bold text-[10px] uppercase tracking-widest mt-1">Artículos con stock igual o inferior al mínimo permitido</DialogDescription>
                </div>
             </div>
          </DialogHeader>
          <div className="p-0">
             {lowStockItems.length > 0 ? (
               <Table>
                 <TableHeader className="bg-slate-50">
                    <TableRow>
                       <TableHead className="pl-8 font-black uppercase text-[10px] text-slate-400 h-12">Insumo Técnico</TableHead>
                       <TableHead className="text-center font-black uppercase text-[10px] text-slate-400 h-12">Stock Actual</TableHead>
                       <TableHead className="text-center font-black uppercase text-[10px] text-slate-400 h-12">Mínimo</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {lowStockItems.map(item => (
                      <TableRow key={`critical-list-${item.id}`} className="h-16 border-b border-slate-50">
                         <TableCell className="pl-8">
                            <div className="flex flex-col">
                               <span className="text-xs font-black uppercase text-slate-800">{item.name}</span>
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.unit}</span>
                            </div>
                         </TableCell>
                         <TableCell className="text-center">
                            <Badge className="bg-rose-500 text-white font-black text-sm px-4 h-8 rounded-lg shadow-lg shadow-rose-200">{item.qty}</Badge>
                         </TableCell>
                         <TableCell className="text-center">
                            <span className="text-xs font-bold text-slate-400">{item.minStock}</span>
                         </TableCell>
                      </TableRow>
                    ))}
                 </TableBody>
               </Table>
             ) : (
               <div className="p-20 text-center space-y-4 opacity-30">
                  <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-500" />
                  <p className="text-sm font-black uppercase tracking-[0.2em]">Todos los insumos en orden</p>
               </div>
             )}
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-3">
             <Button 
                onClick={() => { setIsCriticalDialogOpen(false); setWarehouseActiveTab('movimientos'); }} 
                className="btn-institutional h-12 px-8 text-[9px] gap-2"
             >
                <PlusCircle className="h-4 w-4" /> REGISTRAR ENTRADA
             </Button>
             <Button variant="ghost" onClick={() => setIsCriticalDialogOpen(false)} className="rounded-xl h-12 px-6 text-[9px] font-black uppercase">CERRAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VisitSchedulerDialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen} areaId="soporte" areaName="Soporte Técnico" />

      {/* Diálogo de Nuevo Reporte */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <DialogHeader className="p-8 bg-primary text-white shrink-0">
            <DialogTitle className="uppercase font-black text-white text-2xl flex items-center gap-4">
              <PlusCircle className="h-8 w-8 text-accent" /> {editingTicketId ? 'Editar Folio Técnico' : 'Alta de Reporte de Servicio'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Folio Oficial</Label>
                  <Input 
                    placeholder="COEES-000" 
                    className="h-12 bg-slate-50 border-none rounded-xl font-mono font-black text-lg px-6 shadow-inner text-primary uppercase" 
                    value={formData.id} 
                    onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">CCT del Plantel</Label>
                  <Input 
                    placeholder="15DES0000X" 
                    className="h-12 bg-slate-50 border-none rounded-xl font-mono font-black text-lg px-6 shadow-inner uppercase" 
                    value={formData.cct} 
                    onChange={e => setFormData({...formData, cct: e.target.value.toUpperCase()})} 
                  />
                </div>
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary">Nombre del Plantel</Label>
                <Input 
                  placeholder="NOMBRE INSTITUCIONAL..." 
                  className="h-12 bg-slate-50 border-none rounded-xl font-black uppercase px-6 shadow-inner" 
                  value={formData.schoolName} 
                  onChange={e => setFormData({...formData, schoolName: e.target.value.toUpperCase()})} 
                />
             </div>
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-primary">Tipo de Incidencia</Label>
                   <Select value={formData.tipoIncidencia} onValueChange={(val: any) => setFormData({...formData, tipoIncidencia: val})}>
                      <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl font-bold uppercase shadow-inner">
                         <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                         <SelectItem value="red local" className="text-[11px] font-bold">RED LOCAL</SelectItem>
                         <SelectItem value="red edusat" className="text-[11px] font-bold">RED EDUSAT</SelectItem>
                         <SelectItem value="mantenimiento" className="text-[11px] font-bold">MANTENIMIENTO</SelectItem>
                         <SelectItem value="teleplanteles" className="text-[11px] font-bold">TELEPLANTELES</SelectItem>
                         <SelectItem value="cuenta institucional" className="text-[11px] font-bold">CUENTA INSTITUCIONAL</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-primary">Fecha Programada</Label>
                   <Input type="date" className="h-12 bg-slate-50 border-none rounded-xl font-bold shadow-inner" value={formData.fechaEntrada} onChange={e => setFormData({...formData, fechaEntrada: e.target.value})} />
                </div>
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary">Personal Técnico Comisionado</Label>
                <Input placeholder="NOMBRES DE LOS ANALISTAS..." className="h-12 bg-slate-50 border-none rounded-xl font-black uppercase px-6 shadow-inner" value={formData.tecnicos} onChange={e => setFormData({...formData, tecnicos: e.target.value.toUpperCase()})} />
             </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4">
             <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-12 px-8 text-[10px] font-black uppercase">Cancelar</Button>
             <Button onClick={handleSave} className="btn-institutional h-12 px-14 shadow-2xl"><Save className="h-4 w-4 mr-2" /> Guardar Reporte</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
