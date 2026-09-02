'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Box, 
  Search, 
  PlusCircle, 
  Trash2, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  History,
  Archive,
  X,
  ArrowLeftRight,
  UserCheck,
  ClipboardList,
  Save,
  Calendar,
  CheckCircle2,
  RefreshCcw,
  PackageSearch,
  Pencil,
  Plus,
  Minus
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

type WarehouseItem = {
  id: string;
  name: string;
  category: 'Cómputo' | 'Redes' | 'Herramientas' | 'Consumibles';
  stock: number;
  minStock: number;
  lastUpdated: string;
}

type WarehouseMovement = {
  id: string;
  itemId: string;
  itemName: string;
  type: 'entrada' | 'salida';
  quantity: number;
  date: string;
  reason: string;
  technician: string;
}

const DEFAULT_ITEMS: WarehouseItem[] = [
  { id: '1', name: 'CABLE UTP CAT 6 (METROS)', category: 'Redes', stock: 150, minStock: 50, lastUpdated: new Date().toISOString() },
  { id: '2', name: 'CONECTORES RJ45', category: 'Redes', stock: 80, minStock: 20, lastUpdated: new Date().toISOString() },
  { id: '3', name: 'MONITOR LED 21"', category: 'Cómputo', stock: 12, minStock: 3, lastUpdated: new Date().toISOString() },
  { id: '4', name: 'TECLADO USB ESTÁNDAR', category: 'Cómputo', stock: 10, minStock: 5, lastUpdated: new Date().toISOString() },
  { id: '5', name: 'KIT DE HERRAMIENTAS TÉCNICO', category: 'Herramientas', stock: 15, minStock: 2, lastUpdated: new Date().toISOString() }
]

export function WarehouseSystemDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast()
  const [items, setItems] = useState<WarehouseItem[]>([])
  const [movements, setMovements] = useState<WarehouseMovement[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('inventario')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const [newItemForm, setNewItemForm] = useState({
    name: '',
    category: 'Cómputo' as WarehouseItem['category'],
    stock: 0,
    minStock: 5
  })

  const [movementForm, setMovementForm] = useState({
    itemId: '',
    type: 'entrada' as 'entrada' | 'salida',
    quantity: 1,
    reason: '',
    technician: ''
  })

  const loadData = useCallback(() => {
    try {
      const storedItems = JSON.parse(localStorage.getItem('coees_warehouse_items_v2') || '[]')
      const storedMoves = JSON.parse(localStorage.getItem('coees_warehouse_moves_v2') || '[]')
      
      if (storedItems.length === 0) {
        setItems(DEFAULT_ITEMS)
        localStorage.setItem('coees_warehouse_items_v2', JSON.stringify(DEFAULT_ITEMS))
      } else {
        setItems(storedItems)
      }
      setMovements(storedMoves)
    } catch (e) {
      console.error("Error al cargar datos del almacén:", e)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [loadData])

  useEffect(() => {
    if (open) {
      loadData()
      setSearchTerm('')
    }
  }, [open, loadData])

  const filteredItems = useMemo(() => {
    let list = [...items];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(item => 
        (item.name || '').toLowerCase().includes(term) ||
        (item.category || '').toLowerCase().includes(term)
      )
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [items, searchTerm])

  const handleEditItem = (item: WarehouseItem) => {
    setEditingItemId(item.id)
    setNewItemForm({
      name: item.name,
      category: item.category,
      stock: item.stock,
      minStock: item.minStock
    })
    setIsAddDialogOpen(true)
  }

  const handleSaveItem = () => {
    if (!newItemForm.name) {
      toast({ variant: "destructive", title: "Nombre faltante" })
      return
    }

    let updated;
    if (editingItemId) {
      updated = items.map(item => item.id === editingItemId ? {
        ...item,
        name: newItemForm.name.toUpperCase(),
        category: newItemForm.category,
        stock: newItemForm.stock,
        minStock: newItemForm.minStock,
        lastUpdated: new Date().toISOString()
      } : item)
    } else {
      const newItem: WarehouseItem = {
        ...newItemForm,
        id: `ITEM-${Date.now()}`,
        name: newItemForm.name.toUpperCase(),
        lastUpdated: new Date().toISOString()
      }
      updated = [...items, newItem]
    }

    setItems(updated)
    localStorage.setItem('coees_warehouse_items_v2', JSON.stringify(updated))
    setEditingItemId(null)
    setIsAddDialogOpen(false)
    toast({ title: "Insumo guardado" })
  }

  const handleRegisterMovement = () => {
    if (!movementForm.itemId || !movementForm.reason || movementForm.quantity <= 0) {
      toast({ variant: "destructive", title: "Datos incompletos" })
      return
    }

    const itemIndex = items.findIndex(i => i.id === movementForm.itemId)
    if (itemIndex === -1) return
    const item = items[itemIndex]

    if (movementForm.type === 'salida' && item.stock < movementForm.quantity) {
      toast({ variant: "destructive", title: "Stock insuficiente" })
      return
    }

    const newMovement: WarehouseMovement = {
      id: `MOVE-${Date.now()}`,
      itemId: item.id,
      itemName: item.name,
      type: movementForm.type,
      quantity: movementForm.quantity,
      date: format(new Date(), 'dd/MM/yyyy HH:mm'),
      reason: movementForm.reason.toUpperCase(),
      technician: movementForm.technician.toUpperCase()
    }

    const updatedItems = [...items]
    const newStock = movementForm.type === 'entrada' 
      ? item.stock + movementForm.quantity 
      : item.stock - movementForm.quantity
    
    updatedItems[itemIndex] = { ...item, stock: newStock, lastUpdated: new Date().toISOString() }
    const updatedMoves = [newMovement, ...movements]

    setItems(updatedItems)
    setMovements(updatedMoves)
    localStorage.setItem('coees_warehouse_items_v2', JSON.stringify(updatedItems))
    localStorage.setItem('coees_warehouse_moves_v2', JSON.stringify(updatedMoves))

    setMovementForm({ itemId: '', type: 'entrada', quantity: 1, reason: '', technician: '' })
    toast({ title: "Movimiento registrado" })
  }

  const handleDeleteItem = (id: string) => {
    if (!confirm("¿Desea eliminar este insumo?")) return
    const updated = items.filter(i => i.id !== id)
    setItems(updated)
    localStorage.setItem('coees_warehouse_items_v2', JSON.stringify(updated))
    toast({ title: "Insumo eliminado" })
  }

  if (!mounted) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[1200px] h-[95vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white">
          <DialogHeader className="p-6 bg-[#9f2241] text-white shrink-0 flex flex-row justify-between items-center pr-12">
            <div className="space-y-1">
              <DialogTitle className="uppercase font-black text-2xl flex items-center gap-4">
                 <Archive className="h-8 w-8 text-[#B38E5D]" /> Almacén Técnico COEES
              </DialogTitle>
              <DialogDescription className="text-white/60 font-bold text-[10px] tracking-widest mt-1">
                 Gestión institucional de suministros para brigadas F4 y F5
              </DialogDescription>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-8 bg-white border-b shrink-0 z-10">
               <TabsList className="bg-transparent h-12 p-0 gap-8">
                  <TabsTrigger value="inventario" className="rounded-none border-b-4 border-transparent data-[state=active]:border-[#9f2241] data-[state=active]:bg-transparent px-2 py-3 text-[10px] font-black uppercase tracking-wider transition-all">
                     1. Inventario (Catálogo)
                  </TabsTrigger>
                  <TabsTrigger value="movimientos" className="rounded-none border-b-4 border-transparent data-[state=active]:border-[#9f2241] data-[state=active]:bg-transparent px-2 py-3 text-[10px] font-black uppercase tracking-wider transition-all">
                     2. Entradas y Salidas
                  </TabsTrigger>
                  <TabsTrigger value="historial" className="rounded-none border-b-4 border-transparent data-[state=active]:border-[#9f2241] data-[state=active]:bg-transparent px-2 py-3 text-[10px] font-black uppercase tracking-wider transition-all">
                     3. Bitácora de Movimientos
                  </TabsTrigger>
               </TabsList>
            </div>

            <TabsContent value="inventario" className="flex-1 overflow-hidden m-0 p-6 flex flex-col gap-4 outline-none bg-slate-50/30">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                  <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-3 h-4 w-4 text-slate-300 group-focus-within:text-[#9f2241] transition-colors" />
                    <Input 
                        placeholder="FILTRAR INSUMOS..." 
                        className="h-10 pl-11 pr-10 rounded-xl bg-white border-slate-100 shadow-sm text-[11px] font-bold uppercase"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3 text-slate-400 hover:text-rose-500">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                  </div>
                  <Button onClick={() => { setEditingItemId(null); setNewItemForm({ name: '', category: 'Cómputo', stock: 0, minStock: 5 }); setIsAddDialogOpen(true); }} className="btn-institutional h-10 px-6 shadow-lg text-[10px] gap-2 shrink-0">
                      <PlusCircle className="h-4 w-4" /> Registrar Insumo
                  </Button>
                </div>

                <div className="flex-1 border border-slate-100 rounded-[1.5rem] bg-white shadow-sm overflow-hidden">
                  <ScrollArea className="h-full">
                      <Table>
                          <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b">
                          <TableRow className="h-10">
                              <TableHead className="font-black text-[9px] text-[#9f2241] uppercase pl-8">Categoría</TableHead>
                              <TableHead className="font-black text-[9px] text-[#9f2241] uppercase">Nombre del Insumo</TableHead>
                              <TableHead className="font-black text-[9px] text-[#9f2241] uppercase text-center">Stock</TableHead>
                              <TableHead className="font-black text-[9px] text-[#9f2241] uppercase text-center">Estatus</TableHead>
                              <TableHead className="text-right font-black text-[9px] text-[#9f2241] uppercase pr-10">Gestión</TableHead>
                          </TableRow>
                          </TableHeader>
                          <TableBody>
                          {filteredItems.length > 0 ? filteredItems.map((item) => {
                              const isLowStock = item.stock <= item.minStock;
                              return (
                              <TableRow key={item.id} className="hover:bg-slate-50 transition-colors h-14 border-b border-slate-50">
                                  <TableCell className="pl-8">
                                    <Badge variant="outline" className={cn("font-black text-[7px] uppercase px-2 h-4 border-2", item.category === 'Cómputo' ? "text-blue-600 border-blue-100 bg-blue-50" : "text-emerald-600 border-emerald-100 bg-emerald-50")}>{item.category}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-black text-slate-700 uppercase">{item.name}</span>
                                        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Mínimo: {item.minStock}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className={cn("text-lg font-black", isLowStock ? "text-rose-500" : "text-[#9f2241]")}>{item.stock}</span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge className={cn("font-black text-[6px] border-none px-2 h-4", isLowStock ? "bg-rose-500 text-white animate-pulse" : "bg-emerald-500 text-white")}>
                                      {isLowStock ? <AlertTriangle className="h-2 w-2 mr-1" /> : <CheckCircle2 className="h-2 w-2 mr-1" />}
                                      {isLowStock ? 'CRÍTICO' : 'ÓPTIMO'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right pr-8">
                                      <div className="flex justify-end gap-0.5">
                                          <Button variant="ghost" size="icon" title="Editar" className="h-7 w-7 text-primary hover:bg-primary/5" onClick={() => handleEditItem(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                                          <Button variant="ghost" size="icon" title="Borrar" className="h-7 w-7 text-slate-300 hover:text-rose-600" onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                      </div>
                                  </TableCell>
                              </TableRow>
                              )
                          }) : (
                              <TableRow><TableCell colSpan={5} className="text-center py-20 opacity-20"><PackageSearch className="h-10 w-10 mx-auto mb-2" /><p className="text-[10px] font-black uppercase">Sin resultados</p></TableCell></TableRow>
                          )}
                          </TableBody>
                      </Table>
                  </ScrollArea>
                </div>
            </TabsContent>

            <TabsContent value="movimientos" className="flex-1 overflow-hidden m-0 p-4 lg:p-8 outline-none bg-slate-50/30">
                <ScrollArea className="h-full">
                  <div className="max-w-4xl mx-auto py-2">
                    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-xl space-y-6">
                      <div className="flex items-center gap-4 border-b pb-4">
                        <div className="h-10 w-10 rounded-xl bg-[#9f2241]/10 flex items-center justify-center text-[#9f2241]"><ArrowLeftRight className="h-5 w-5" /></div>
                        <div>
                          <h3 className="text-base font-black text-slate-800 uppercase leading-none">Registrar Movimiento</h3>
                          <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Actualización de flujo operativo de insumos</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-primary uppercase pl-1">1. Seleccionar Insumo</Label>
                          <Select value={movementForm.itemId} onValueChange={v => setMovementForm({...movementForm, itemId: v})}>
                            <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold uppercase shadow-inner text-[11px]"><SelectValue placeholder="BUSCAR ARTÍCULO..." /></SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-2xl z-[100]">
                              {items.map(i => (<SelectItem key={i.id} value={i.id} className="text-[10px] font-bold uppercase">{i.name} ({i.stock} DISP.)</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-primary uppercase pl-1">2. Tipo de Acción</Label>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setMovementForm({...movementForm, type: 'entrada'})} 
                              className={cn(
                                "flex-1 h-11 rounded-xl border-2 flex items-center justify-center gap-2 font-black text-[10px] uppercase transition-all", 
                                movementForm.type === 'entrada' ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm" : "bg-white border-slate-100 text-slate-400"
                              )}
                            >
                              <ArrowUpRight className="h-4 w-4" /> Entrada
                            </button>
                            <button 
                              onClick={() => setMovementForm({...movementForm, type: 'salida'})} 
                              className={cn(
                                "flex-1 h-11 rounded-xl border-2 flex items-center justify-center gap-2 font-black text-[10px] uppercase transition-all", 
                                movementForm.type === 'salida' ? "bg-rose-50 border-rose-500 text-rose-700 shadow-sm" : "bg-white border-slate-100 text-slate-400"
                              )}
                            >
                              <ArrowDownRight className="h-4 w-4" /> Salida
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-primary uppercase pl-1">3. Cantidad de Artículos</Label>
                          <Input 
                            type="number" 
                            min={1}
                            className="h-11 rounded-xl bg-slate-50 border-none text-center font-black text-xl shadow-inner" 
                            value={movementForm.quantity} 
                            onChange={e => setMovementForm({...movementForm, quantity: parseInt(e.target.value) || 0})} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-primary uppercase pl-1">4. Analista Responsable</Label>
                          <Input 
                            placeholder="NOMBRE COMPLETO..." 
                            className="h-11 rounded-xl bg-slate-50 border-none font-bold uppercase text-[11px] shadow-inner" 
                            value={movementForm.technician} 
                            onChange={e => setMovementForm({...movementForm, technician: e.target.value})} 
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label className="text-[10px] font-black text-primary uppercase pl-1">5. Motivo / CCT de Destino</Label>
                          <Input 
                            placeholder="EJ. MANTENIMIENTO F4 CCT 15DES0001R..." 
                            className="h-11 rounded-xl bg-slate-50 border-none font-bold uppercase text-[11px] shadow-inner" 
                            value={movementForm.reason} 
                            onChange={e => setMovementForm({...movementForm, reason: e.target.value})} 
                          />
                        </div>
                      </div>

                      <Button onClick={handleRegisterMovement} className="w-full btn-institutional h-14 rounded-2xl shadow-2xl text-xs gap-3">
                        <Save className="h-5 w-5" /> Procesar y Actualizar Almacén
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
            </TabsContent>

            <TabsContent value="historial" className="flex-1 overflow-hidden m-0 p-6 flex flex-col gap-4 outline-none bg-slate-50/30">
                <div className="flex justify-between items-end shrink-0">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-[#9f2241] uppercase leading-none">Bitácora de Auditoría</h3>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Registro inalterable de flujo técnico</p>
                  </div>
                  <Badge variant="outline" className="h-8 px-4 rounded-xl border-primary/20 text-primary font-black text-[9px] uppercase">
                    {movements.length} Movimientos
                  </Badge>
                </div>
                <div className="flex-1 border border-slate-100 rounded-[1.5rem] bg-white shadow-sm overflow-hidden">
                  <ScrollArea className="h-full">
                    <Table>
                      <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b">
                        <TableRow className="h-10">
                          <TableHead className="font-black text-[9px] uppercase pl-8">Fecha</TableHead>
                          <TableHead className="font-black text-[9px] uppercase">Tipo</TableHead>
                          <TableHead className="font-black text-[9px] uppercase">Insumo</TableHead>
                          <TableHead className="font-black text-[9px] uppercase">Técnico</TableHead>
                          <TableHead className="font-black text-[9px] uppercase">Observaciones</TableHead>
                          <TableHead className="text-center font-black text-[9px] uppercase pr-8">Cant.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movements.length > 0 ? movements.map((move) => (
                          <TableRow key={move.id} className="hover:bg-slate-50 transition-colors h-14 border-b border-slate-50">
                            <TableCell className="pl-8 text-[8px] font-black text-slate-400 uppercase">{move.date}</TableCell>
                            <TableCell><Badge className={cn("font-black text-[7px] h-4 uppercase border-none", move.type === 'entrada' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>{move.type}</Badge></TableCell>
                            <TableCell className="text-[10px] font-black text-slate-700 uppercase">{move.itemName}</TableCell>
                            <TableCell className="text-[10px] font-bold text-slate-600 uppercase">{move.technician}</TableCell>
                            <TableCell className="text-[9px] font-medium text-slate-500 italic truncate max-w-[150px]">"{move.reason}"</TableCell>
                            <TableCell className="text-center pr-8 font-black text-xs">{move.type === 'entrada' ? '+' : '-'}{move.quantity}</TableCell>
                          </TableRow>
                        )) : (
                          <TableRow><TableCell colSpan={6} className="text-center py-20 opacity-30 text-[10px] font-black uppercase">Sin registros en bitácora</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="p-4 bg-slate-50 border-t shrink-0">
             <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-10 px-8 rounded-xl font-bold text-[10px] text-slate-400 uppercase">Cerrar Almacén</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2rem] p-0 overflow-hidden bg-white border-none shadow-2xl z-[150]">
          <DialogHeader className="p-6 bg-[#B38E5D] text-white">
            <DialogTitle className="font-black text-lg uppercase">{editingItemId ? 'Editar Insumo' : 'Nuevo Insumo'}</DialogTitle>
            <DialogDescription className="text-white/70 text-[9px] font-bold uppercase mt-1">Configuración técnica del artículo</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-5">
             <div className="space-y-1.5"><Label className="text-[10px] font-black text-primary uppercase pl-1">Nombre del artículo</Label><Input className="h-10 rounded-xl bg-slate-50 border-none shadow-inner font-bold uppercase text-[11px]" value={newItemForm.name} onChange={e => setNewItemForm({...newItemForm, name: e.target.value})} /></div>
             <div className="space-y-1.5"><Label className="text-[10px] font-black text-primary uppercase pl-1">Categoría</Label><Select value={newItemForm.category} onValueChange={(val: any) => setNewItemForm({...newItemForm, category: val})}><SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none shadow-inner font-bold uppercase text-[11px]"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl border-none shadow-2xl z-[200]"><SelectItem value="Cómputo" className="font-bold text-[10px] uppercase">Cómputo</SelectItem><SelectItem value="Redes" className="font-bold text-[10px] uppercase">Redes</SelectItem><SelectItem value="Herramientas" className="font-bold text-[10px] uppercase">Herramientas</SelectItem><SelectItem value="Consumibles" className="font-bold text-[10px] uppercase">Consumibles</SelectItem></SelectContent></Select></div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[10px] font-black text-primary uppercase pl-1">Stock Actual</Label><Input type="number" className="h-10 rounded-xl bg-slate-50 border-none shadow-inner text-center font-black" value={newItemForm.stock} onChange={e => setNewItemForm({...newItemForm, stock: parseInt(e.target.value) || 0})} /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black text-primary uppercase pl-1">Mínimo Crítico</Label><Input type="number" className="h-10 rounded-xl bg-slate-50 border-none shadow-inner text-center font-black" value={newItemForm.minStock} onChange={e => setNewItemForm({...newItemForm, minStock: parseInt(e.target.value) || 0})} /></div>
             </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t gap-3">
            <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="h-10 px-6 text-[10px] font-black uppercase text-slate-400">Cancelar</Button>
            <Button onClick={handleSaveItem} className="btn-institutional h-10 px-10 text-[10px] shadow-xl gap-2"><Save className="h-4 w-4" /> {editingItemId ? 'Actualizar' : 'Registrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
