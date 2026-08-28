
'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
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
import { schoolsDirectory, type SchoolInfo } from "@/lib/schools-directory"
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
  Monitor,
  Search,
  X,
  Plus
} from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { VisitSchedulerDialog } from '@/components/VisitSchedulerDialog'
import { cn } from '@/lib/utils'

const REGIONAL_OFFICES = [
  "Oficina de Tecnóloga Educativa Ecatepec",
  "Oficina de Tecnóloga Educativa Naucalpan",
  "Oficina de Tecnóloga Educativa Nezahualcóyotl",
  "Oficina de Tecnóloga Educativa Toluca",
  "Oficina de COEES Tultitlan"
];

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
  const [warehouseActiveTab, setWarehouseActiveTab] = useState('resumen')
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<WarehouseMovement[]>([])
  const [movementForm, setMovementForm] = useState({
    type: 'salida' as 'entrada' | 'salida',
    itemId: '',
    qty: 0,
    recipient: '',
    folio: ''
  })
  
  const [listSearchTerm, setListSearchTerm] = useState('') 
  const [officeFilter, setOfficeFilter] = useState('all')
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null)

  const initialFormState: Omit<SupportTicket, 'status'> = {
    id: '',
    cct: '',
    schoolName: '',
    zonaEscolar: '',
    sector: '',
    modalidad: '',
    municipio: '',
    region: '',
    valle: '',
    tecnicos: '',
    oficinaRegionalAtencion: '',
    numeroOficio: '',
    alumnosBeneficiados: 0,
    docentesBeneficiados: 0,
    numeroEquipos: 0,
    tipoIncidencia: 'mantenimiento',
    materialUtilizado: '',
    setes: 'N',
    observaciones: '',
    fechaEntrada: '',
    fechaSalida: '',
    serviciosMC: 0,
    serviciosMP: 0,
    reportPdf: '',
    evidencePhotos: [],
    mantenimientoDetalle: {
      equipoTecnologico: '',
      equipoTecnologicoOtro: '',
      equipos: Array(10).fill({ equipo: '', marca: '', serie: '', censal: '' }),
      fallaIdentificada: '',
      servicioRealizado: ''
    }
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

  const handleEdit = (ticket: SupportTicket) => {
    setFormData({ ...ticket });
    setEditingTicketId(ticket.id || null);
    setIsDialogOpen(true);
  }

  const handleDeleteTicket = (id: string) => {
    const updated = tickets.filter(t => t.id !== id);
    setTickets(updated);
    localStorage.setItem('support_tickets_full', JSON.stringify(updated));
    toast({ title: "Registro eliminado" });
  }

  const handleRegisterMovement = () => {
    const { itemId, qty, type, recipient, folio } = movementForm;
    if (!itemId || qty <= 0) { toast({ variant: "destructive", title: "Datos incompletos" }); return; }
    const item = inventory.find(i => i.id === parseInt(itemId));
    if (!item) return;
    if (type === 'salida' && item.qty < qty) { toast({ variant: "destructive", title: "Stock insuficiente" }); return; }
    
    const newQty = type === 'entrada' ? item.qty + qty : item.qty - qty;
    const updatedInventory = inventory.map(i => i.id === item.id ? { ...i, qty: newQty } : i);
    const newMovement: WarehouseMovement = { 
      id: `MOV-${Date.now()}`, 
      type, 
      itemId: item.id, 
      itemName: item.name, 
      qty, 
      date: format(new Date(), 'dd/MM/yyyy HH:mm'), 
      recipient: recipient?.toUpperCase(), 
      folio: folio?.toUpperCase()
    };
    
    setInventory(updatedInventory);
    setMovements([newMovement, ...movements]);
    localStorage.setItem('coees_inventory_v1', JSON.stringify(updatedInventory));
    localStorage.setItem('coees_movements_v1', JSON.stringify([newMovement, ...movements]));
    setMovementForm({ type: 'salida', itemId: '', qty: 0, recipient: '', folio: '' });
    toast({ title: "Movimiento registrado" });
  }

  const filteredTickets = tickets.filter(t => {
    const matchSearch = (t.cct || '').toUpperCase().includes(listSearchTerm.toUpperCase()) ||
      (t.schoolName || '').toUpperCase().includes(listSearchTerm.toUpperCase()) ||
      (t.id || '').toUpperCase().includes(listSearchTerm.toUpperCase());
    const matchOffice = officeFilter === 'all' || t.oficinaRegionalAtencion === officeFilter;
    return matchSearch && matchOffice;
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b">
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
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id} className="hover:bg-slate-50 transition-colors h-16 group">
                  <TableCell className="text-center pl-6 font-mono font-black text-xs text-primary">#{ticket.id}</TableCell>
                  <TableCell><div className="flex flex-col"><span className="text-[11px] font-black uppercase leading-none">{ticket.schoolName}</span><span className="text-[9px] font-bold text-muted-foreground mt-1">{ticket.cct}</span></div></TableCell>
                  <TableCell><Badge variant="outline" className="text-[9px] font-black uppercase">{ticket.tipoIncidencia}</Badge></TableCell>
                  <TableCell className="text-[10px] font-bold text-slate-500">{ticket.fechaEntrada}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn("text-[8px] font-black h-5 px-3 rounded-full", ticket.status === 'atendido' ? "bg-emerald-500" : ticket.status === 'en proceso' ? "bg-amber-500" : "bg-rose-500")}>
                      {ticket.status?.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                     <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleEdit(ticket)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300" onClick={() => ticket.id && handleDeleteTicket(ticket.id)}><Trash2 className="h-4 w-4" /></Button>
                     </div>
                  </TableCell>
                </TableRow>
              ))}
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
                <TabsTrigger value="resumen" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all">Dashboard</TabsTrigger>
                <TabsTrigger value="inventario" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all">Inventario Actual</TabsTrigger>
                <TabsTrigger value="movimientos" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all">Registro de Flujo</TabsTrigger>
              </TabsList>
            </div>
            <div className="flex-1 overflow-hidden">
              <TabsContent value="resumen" className="h-full m-0 p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="executive-card p-6 bg-primary/5 border-l-8 border-l-primary flex justify-between items-start">
                    <div><p className="text-[10px] font-black uppercase text-primary/60">Insumos Críticos</p><h3 className="text-4xl font-black text-primary mt-1">{lowStockItems.length}</h3></div>
                    <AlertTriangle className="h-10 w-10 text-primary opacity-20" />
                  </Card>
                  <Card className="executive-card p-6 bg-accent/5 border-l-8 border-l-accent flex justify-between items-start">
                    <div><p className="text-[10px] font-black uppercase text-accent/60">Movimientos Hoy</p><h3 className="text-4xl font-black text-accent mt-1">{movements.length}</h3></div>
                    <TrendingUp className="h-10 w-10 text-accent opacity-20" />
                  </Card>
                  <Card className="executive-card p-6 bg-emerald-50 border-l-8 border-l-emerald-500 flex justify-between items-start">
                    <div><p className="text-[10px] font-black uppercase text-emerald-600/60">Total SKU</p><h3 className="text-4xl font-black text-emerald-600 mt-1">{inventory.length}</h3></div>
                    <Package className="h-10 w-10 text-emerald-500 opacity-20" />
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="inventario" className="h-full m-0 p-0">
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b">
                      <TableRow><TableHead className="pl-8 py-4 font-black uppercase text-[10px]">Insumo Técnico</TableHead><TableHead className="text-center font-black uppercase text-[10px]">Stock</TableHead><TableHead className="text-center font-black uppercase text-[10px]">Unidad</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventory.map(i => (
                        <TableRow key={i.id} className="h-16 hover:bg-slate-50 border-b border-slate-50">
                          <TableCell className="pl-8 font-black text-slate-700 text-xs uppercase">{i.name}</TableCell>
                          <TableCell className="text-center"><Badge className={cn("text-xs font-black h-8 w-14 flex items-center justify-center", i.qty <= i.minStock ? "bg-rose-500" : "bg-primary")}>{i.qty}</Badge></TableCell>
                          <TableCell className="text-center text-[10px] font-bold text-slate-500 uppercase">{i.unit}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="movimientos" className="h-full m-0 p-8 flex flex-col gap-6 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 shrink-0">
                   {/* Salida */}
                   <Card className="p-6 bg-slate-50 border-t-4 border-t-accent rounded-[2rem] shadow-xl">
                      <div className="flex items-center gap-3 mb-6"><div className="h-10 w-10 bg-accent rounded-xl flex items-center justify-center text-white"><TrendingDown className="h-6 w-6" /></div><h4 className="text-sm font-black uppercase text-accent">Salida de Material</h4></div>
                      <div className="space-y-4">
                        <Select value={movementForm.itemId} onValueChange={(val) => setMovementForm({...movementForm, itemId: val})}><SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold uppercase"><SelectValue placeholder="ELEGIR MATERIAL..." /></SelectTrigger><SelectContent className="rounded-xl">{inventory.map(i => <SelectItem key={`sal-${i.id}`} value={i.id.toString()} className="text-[11px] font-bold uppercase">{i.name} ({i.qty})</SelectItem>)}</SelectContent></Select>
                        <div className="grid grid-cols-2 gap-4">
                          <Input type="number" placeholder="CANTIDAD" className="h-12 bg-white rounded-xl text-center font-black" value={movementForm.qty || ''} onChange={e => setMovementForm({...movementForm, qty: parseInt(e.target.value) || 0})} />
                          <Input placeholder="FOLIO / SOLICITUD" className="h-12 bg-white rounded-xl uppercase font-mono px-4 text-xs font-black" value={movementForm.folio} onChange={e => setMovementForm({...movementForm, folio: e.target.value.toUpperCase()})} />
                        </div>
                        <Input placeholder="USUARIO A QUIEN SE LE DIO EL MATERIAL..." className="h-12 bg-white rounded-xl uppercase font-black px-6 text-xs" value={movementForm.recipient} onChange={e => setMovementForm({...movementForm, recipient: e.target.value.toUpperCase()})} />
                        <Button onClick={() => { setMovementForm(prev => ({...prev, type: 'salida'})); handleRegisterMovement(); }} className="w-full bg-accent hover:bg-accent/90 text-white h-14 rounded-xl font-black uppercase shadow-lg transition-all active:scale-95">Registrar Salida</Button>
                      </div>
                   </Card>
                   {/* Entrada */}
                   <Card className="p-6 bg-slate-50 border-t-4 border-t-primary rounded-[2rem] shadow-xl">
                      <div className="flex items-center gap-3 mb-6"><div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white"><TrendingUp className="h-6 w-6" /></div><h4 className="text-sm font-black uppercase text-primary">Entrada de Material</h4></div>
                      <div className="space-y-4">
                        <Select value={movementForm.itemId} onValueChange={(val) => setMovementForm({...movementForm, itemId: val})}><SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold uppercase"><SelectValue placeholder="ELEGIR MATERIAL..." /></SelectTrigger><SelectContent className="rounded-xl">{inventory.map(i => <SelectItem key={`ent-${i.id}`} value={i.id.toString()} className="text-[11px] font-bold uppercase">{i.name}</SelectItem>)}</SelectContent></Select>
                        <div className="grid grid-cols-2 gap-4">
                          <Input type="number" placeholder="CANTIDAD" className="h-12 bg-white rounded-xl text-center font-black" value={movementForm.qty || ''} onChange={e => setMovementForm({...movementForm, qty: parseInt(e.target.value) || 0})} />
                          <Input placeholder="QUIEN RECIBE..." className="h-12 bg-white rounded-xl uppercase font-black px-4 text-xs" value={movementForm.recipient} onChange={e => setMovementForm({...movementForm, recipient: e.target.value.toUpperCase()})} />
                        </div>
                        <Button onClick={() => { setMovementForm(prev => ({...prev, type: 'entrada'})); handleRegisterMovement(); }} className="w-full btn-institutional h-14 shadow-lg active:scale-95 transition-all">Registrar Entrada</Button>
                      </div>
                   </Card>
                </div>
                <div className="flex-1 overflow-hidden border-2 border-slate-100 rounded-[2rem] bg-white shadow-inner flex flex-col">
                   <div className="p-4 bg-slate-50 border-b flex items-center justify-between"><div className="flex items-center gap-2"><History className="h-4 w-4 text-slate-400" /><span className="text-[10px] font-black uppercase text-slate-500">Historial de Registro de Flujo</span></div></div>
                   <ScrollArea className="flex-1">
                      <Table>
                        <TableHeader className="bg-white sticky top-0 z-10 border-b"><TableRow><TableHead className="pl-8 py-3 text-[9px] font-black uppercase">Fecha</TableHead><TableHead className="text-[9px] font-black uppercase text-center">Tipo</TableHead><TableHead className="text-[9px] font-black uppercase">Material</TableHead><TableHead className="text-[9px] font-black uppercase text-center">Cant.</TableHead><TableHead className="text-[9px] font-black uppercase">Folio / Usuario</TableHead></TableRow></TableHeader>
                        <TableBody>{movements.map(m => (<TableRow key={m.id} className="h-12 hover:bg-slate-50 border-b border-slate-50"><TableCell className="pl-8 text-[9px] font-bold text-slate-400">{m.date}</TableCell><TableCell className="text-center"><Badge className={cn("text-[8px] font-black px-2 h-5", m.type === 'entrada' ? "bg-emerald-500" : "bg-accent")}>{m.type.toUpperCase()}</Badge></TableCell><TableCell className="text-[10px] font-black uppercase text-slate-700">{m.itemName}</TableCell><TableCell className="text-center font-black text-primary">{m.qty}</TableCell><TableCell><div className="flex flex-col"><span className="text-[9px] font-black text-primary leading-none">{m.folio || '-'}</span><span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5 truncate max-w-[150px]">{m.recipient || '-'}</span></div></TableCell></TableRow>))}</TableBody>
                      </Table>
                   </ScrollArea>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <VisitSchedulerDialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen} areaId="soporte" areaName="Soporte Técnico" />
    </div>
  );
}
