
'use client'
import { useState, useEffect, useMemo } from 'react'
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
  Monitor,
  Wifi,
  Wrench,
  X,
  Plus,
  ArrowLeftRight,
  UserCheck,
  ClipboardList,
  Save,
  Calendar,
  CheckCircle2
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

export function WarehouseSystemDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast()
  const [items, setItems] = useState<WarehouseItem[]>([])
  const [movements, setMovements] = useState<WarehouseMovement[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('inventario')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Form states
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

  useEffect(() => {
    setMounted(true)
    const storedItems = JSON.parse(localStorage.getItem('coees_warehouse_items_v2') || '[]')
    const storedMoves = JSON.parse(localStorage.getItem('coees_warehouse_moves_v2') || '[]')
    
    if (storedItems.length === 0) {
      const defaultItems: WarehouseItem[] = [
        { id: '1', name: 'Cable UTP Cat 6 (Metros)', category: 'Redes', stock: 150, minStock: 50, lastUpdated: new Date().toISOString() },
        { id: '2', name: 'Conectores RJ45', category: 'Redes', stock: 80, minStock: 20, lastUpdated: new Date().toISOString() },
        { id: '3', name: 'Monitor LED 21"', category: 'Cómputo', stock: 12, minStock: 3, lastUpdated: new Date().toISOString() },
        { id: '4', name: 'Teclado USB Estándar', category: 'Cómputo', stock: 10, minStock: 5, lastUpdated: new Date().toISOString() },
        { id: '5', name: 'Kit de Herramientas Técnico', category: 'Herramientas', stock: 15, minStock: 2, lastUpdated: new Date().toISOString() }
      ]
      setItems(defaultItems)
      localStorage.setItem('coees_warehouse_items_v2', JSON.stringify(defaultItems))
    } else {
      setItems(storedItems)
    }
    setMovements(storedMoves)
  }, [])

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name))
  }, [items, searchTerm])

  const handleAddItem = () => {
    if (!newItemForm.name) return
    const newItem: WarehouseItem = {
      ...newItemForm,
      id: `ITEM-${Date.now()}`,
      lastUpdated: new Date().toISOString()
    }
    const updated = [...items, newItem]
    setItems(updated)
    localStorage.setItem('coees_warehouse_items_v2', JSON.stringify(updated))
    setNewItemForm({ name: '', category: 'Cómputo', stock: 0, minStock: 5 })
    setIsAddDialogOpen(false)
    toast({ title: "Insumo registrado", description: `${newItem.name} se sumó al catálogo.` })
  }

  const handleRegisterMovement = () => {
    if (!movementForm.itemId || !movementForm.reason || movementForm.quantity <= 0) {
      toast({ variant: "destructive", title: "Datos incompletos" })
      return
    }

    const item = items.find(i => i.id === movementForm.itemId)
    if (!item) return

    if (movementForm.type === 'salida' && item.stock < movementForm.quantity) {
      toast({ variant: "destructive", title: "Stock insuficiente", description: `Solo hay ${item.stock} unidades disponibles.` })
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

    // Actualizar stock del item
    const updatedItems = items.map(i => {
      if (i.id === item.id) {
        const newStock = movementForm.type === 'entrada' 
          ? i.stock + movementForm.quantity 
          : i.stock - movementForm.quantity
        return { ...i, stock: newStock, lastUpdated: new Date().toISOString() }
      }
      return i
    })

    const updatedMoves = [newMovement, ...movements]

    setItems(updatedItems)
    setMovements(updatedMoves)
    localStorage.setItem('coees_warehouse_items_v2', JSON.stringify(updatedItems))
    localStorage.setItem('coees_warehouse_moves_v2', JSON.stringify(updatedMoves))

    setMovementForm({ itemId: '', type: 'entrada', quantity: 1, reason: '', technician: '' })
    toast({ title: "Movimiento registrado", description: `${item.name} actualizado correctamente.` })
  }

  const handleDeleteItem = (id: string) => {
    if (!confirm("¿Desea eliminar este insumo del catálogo?")) return
    const updated = items.filter(i => i.id !== id)
    setItems(updated)
    localStorage.setItem('coees_warehouse_items_v2', JSON.stringify(updated))
    toast({ title: "Insumo eliminado" })
  }

  if (!mounted) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1300px] h-[95vh] flex flex-col p-0 overflow-hidden rounded-[3rem] border-none shadow-2xl bg-[#f8f5f0]">
        <DialogHeader className="p-8 bg-[#9f2241] text-white shrink-0 flex flex-row justify-between items-center pr-12">
          <div className="space-y-1">
            <DialogTitle className="uppercase font-black text-2xl flex items-center gap-4">
               <Archive className="h-8 w-8 text-[#B38E5D]" /> Almacén Técnico COEES
            </DialogTitle>
            <DialogDescription className="text-white/60 font-bold text-[10px] tracking-widest mt-1">
               Gestión de entradas, salidas y control de insumos • Auditoría 2026
            </DialogDescription>
          </div>
          <button onClick={() => onOpenChange(false)} className="h-10 w-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-all">
            <X className="h-6 w-6" />
          </button>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 bg-white border-b shrink-0 shadow-sm z-10">
             <TabsList className="bg-transparent h-14 p-0 gap-10">
                <TabsTrigger value="inventario" className="rounded-none border-b-4 border-transparent data-[state=active]:border-[#9f2241] data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all">
                   1. Inventario (Insumos)
                </TabsTrigger>
                <TabsTrigger value="movimientos" className="rounded-none border-b-4 border-transparent data-[state=active]:border-[#9f2241] data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all">
                   2. Entradas y Salidas
                </TabsTrigger>
                <TabsTrigger value="historial" className="rounded-none border-b-4 border-transparent data-[state=active]:border-[#9f2241] data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all">
                   3. Bitácora de Movimientos
                </TabsTrigger>
             </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
             {/* Pestaña 1: Inventario */}
             <TabsContent value="inventario" className="h-full m-0 p-8 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-300 group-focus-within:text-[#9f2241] transition-colors" />
                    <Input 
                        placeholder="Buscar por nombre o categoría..." 
                        className="h-12 pl-12 rounded-2xl bg-white border-none shadow-inner text-sm font-bold"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => setIsAddDialogOpen(true)} className="btn-institutional h-12 px-8 shadow-xl text-[11px] gap-2">
                    <PlusCircle className="h-5 w-5" /> Nuevo Insumo
                  </Button>
                </div>

                <div className="flex-1 border-2 border-slate-100 rounded-[2.5rem] bg-white shadow-2xl overflow-hidden">
                   <ScrollArea className="h-full">
                      <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b">
                          <TableRow className="h-12">
                            <TableHead className="font-black text-[10px] text-[#9f2241] uppercase pl-8">Categoría</TableHead>
                            <TableHead className="font-black text-[10px] text-[#9f2241] uppercase">Insumo / Descripción</TableHead>
                            <TableHead className="font-black text-[10px] text-[#9f2241] uppercase text-center">Stock Actual</TableHead>
                            <TableHead className="font-black text-[10px] text-[#9f2241] uppercase text-center">Estatus</TableHead>
                            <TableHead className="text-right font-black text-[10px] text-[#9f2241] uppercase pr-10">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredItems.map((item) => {
                            const isLowStock = item.stock <= item.minStock;
                            return (
                              <TableRow key={item.id} className="hover:bg-slate-50 transition-colors h-16 border-b border-slate-50">
                                <TableCell className="pl-8">
                                  <Badge variant="outline" className={cn(
                                    "font-black text-[8px] uppercase px-2 h-5 border-2",
                                    item.category === 'Cómputo' ? "text-blue-600 border-blue-100 bg-blue-50" :
                                    item.category === 'Redes' ? "text-emerald-600 border-emerald-100 bg-emerald-50" :
                                    item.category === 'Herramientas' ? "text-amber-600 border-amber-100 bg-amber-50" :
                                    "text-purple-600 border-purple-100 bg-purple-50"
                                  )}>
                                    {item.category}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                   <div className="flex flex-col">
                                     <span className="text-sm font-black text-slate-700">{item.name}</span>
                                     <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Punto de re-orden: {item.minStock}</span>
                                   </div>
                                </TableCell>
                                <TableCell className="text-center">
                                   <span className={cn("text-xl font-black", isLowStock ? "text-rose-500" : "text-primary")}>{item.stock}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                   {isLowStock ? (
                                     <Badge className="bg-rose-500 text-white font-black text-[7px] gap-1 animate-pulse border-none">
                                       <AlertTriangle className="h-2 w-2" /> CRÍTICO
                                     </Badge>
                                   ) : (
                                     <Badge className="bg-emerald-500 text-white font-black text-[7px] gap-1 border-none">
                                       <CheckCircle2 className="h-2 w-2" /> ÓPTIMO
                                     </Badge>
                                   )}
                                </TableCell>
                                <TableCell className="text-right pr-8">
                                   <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => handleDeleteItem(item.id)}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                   </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                   </ScrollArea>
                </div>
             </TabsContent>

             {/* Pestaña 2: Movimientos */}
             <TabsContent value="movimientos" className="h-full m-0 p-8">
                <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                   <div className="bg-white p-10 rounded-[3rem] border shadow-2xl space-y-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                        <ArrowLeftRight className="h-40 w-40" />
                      </div>

                      <div className="flex items-center gap-4 border-b pb-4">
                         <div className="h-12 w-12 rounded-2xl bg-[#9f2241]/10 flex items-center justify-center text-[#9f2241]">
                            <ArrowLeftRight className="h-6 w-6" />
                         </div>
                         <div>
                            <h3 className="text-lg font-black text-slate-800 uppercase leading-none">Registro de Movimiento</h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Actualice el flujo de materiales del almacén</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black text-primary pl-1 uppercase">1. Seleccionar Insumo</Label>
                            <Select value={movementForm.itemId} onValueChange={v => setMovementForm({...movementForm, itemId: v})}>
                               <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold"><SelectValue placeholder="BUSCAR ARTÍCULO..." /></SelectTrigger>
                               <SelectContent className="rounded-xl border-none shadow-2xl">
                                  {items.map(i => (
                                    <SelectItem key={i.id} value={i.id} className="text-xs font-bold uppercase">{i.name} (Stock: {i.stock})</SelectItem>
                                  ))}
                               </SelectContent>
                            </Select>
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black text-primary pl-1 uppercase">2. Tipo de Acción</Label>
                            <div className="flex gap-2">
                               <button 
                                  onClick={() => setMovementForm({...movementForm, type: 'entrada'})}
                                  className={cn("flex-1 h-12 rounded-xl border-2 flex items-center justify-center gap-2 font-black text-[10px] uppercase transition-all", movementForm.type === 'entrada' ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg" : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50")}
                               >
                                  <ArrowUpRight className="h-4 w-4" /> Entrada (Suma)
                               </button>
                               <button 
                                  onClick={() => setMovementForm({...movementForm, type: 'salida'})}
                                  className={cn("flex-1 h-12 rounded-xl border-2 flex items-center justify-center gap-2 font-black text-[10px] uppercase transition-all", movementForm.type === 'salida' ? "bg-rose-50 border-rose-500 text-rose-700 shadow-lg" : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50")}
                               >
                                  <ArrowDownRight className="h-4 w-4" /> Salida (Resta)
                               </button>
                            </div>
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black text-primary pl-1 uppercase">3. Cantidad de Unidades</Label>
                            <Input 
                               type="number" 
                               className="h-12 rounded-xl bg-slate-50 border-none shadow-inner text-center font-black text-2xl"
                               value={movementForm.quantity}
                               onChange={e => setMovementForm({...movementForm, quantity: parseInt(e.target.value) || 0})}
                            />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black text-primary pl-1 uppercase">4. Técnico Responsable</Label>
                            <div className="relative">
                               <Input 
                                  placeholder="NOMBRE DEL ANALISTA..." 
                                  className="h-12 pl-10 rounded-xl bg-slate-50 border-none shadow-inner font-bold uppercase text-xs"
                                  value={movementForm.technician}
                                  onChange={e => setMovementForm({...movementForm, technician: e.target.value})}
                               />
                               <UserCheck className="absolute left-3 top-3.5 h-5 w-5 text-slate-300" />
                            </div>
                         </div>
                         <div className="md:col-span-2 space-y-2">
                            <Label className="text-[10px] font-black text-primary pl-1 uppercase">5. Motivo del Movimiento / Destino</Label>
                            <div className="relative">
                               <Input 
                                  placeholder="EJ. MANTENIMIENTO PREVENTIVO CCT 15DES0001R O REPOSICIÓN DE STOCK..." 
                                  className="h-12 pl-10 rounded-xl bg-slate-50 border-none shadow-inner font-bold uppercase text-xs"
                                  value={movementForm.reason}
                                  onChange={e => setMovementForm({...movementForm, reason: e.target.value})}
                               />
                               <ClipboardList className="absolute left-3 top-3.5 h-5 w-5 text-slate-300" />
                            </div>
                         </div>
                      </div>

                      <div className="pt-4">
                         <Button onClick={handleRegisterMovement} className="w-full btn-institutional h-14 rounded-2xl shadow-2xl text-xs gap-3">
                            <Save className="h-5 w-5" /> Aplicar y Actualizar Almacén
                         </Button>
                      </div>
                   </div>
                </div>
             </TabsContent>

             {/* Pestaña 3: Historial */}
             <TabsContent value="historial" className="h-full m-0 p-8 flex flex-col gap-6">
                <div className="flex justify-between items-end mb-2">
                   <div className="space-y-1">
                      <h3 className="text-xl font-black text-primary uppercase leading-none">Bitácora Técnica</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rastreo de flujos y auditoría de insumos</p>
                   </div>
                   <Badge variant="outline" className="h-9 px-6 rounded-xl border-primary/20 text-primary font-black text-[10px] uppercase">
                     {movements.length} Registros de Auditoría
                   </Badge>
                </div>

                <div className="flex-1 border-2 border-slate-100 rounded-[2.5rem] bg-white shadow-2xl overflow-hidden">
                   <ScrollArea className="h-full">
                      <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b">
                          <TableRow className="h-12">
                            <TableHead className="font-black text-[10px] text-[#9f2241] uppercase pl-8">Fecha y Hora</TableHead>
                            <TableHead className="font-black text-[10px] text-[#9f2241] uppercase">Tipo / Insumo</TableHead>
                            <TableHead className="font-black text-[10px] text-[#9f2241] uppercase">Técnico Analista</TableHead>
                            <TableHead className="font-black text-[10px] text-[#9f2241] uppercase">Motivo / Servicio</TableHead>
                            <TableHead className="font-black text-[10px] text-[#9f2241] uppercase text-center pr-8">Cant.</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {movements.map((move) => (
                            <TableRow key={move.id} className="hover:bg-slate-50 transition-colors h-16 border-b border-slate-50">
                              <TableCell className="pl-8">
                                 <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3 text-slate-300" />
                                    <span className="text-[9px] font-black text-slate-500 uppercase">{move.date}</span>
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <div className="flex items-center gap-3">
                                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shadow-sm", move.type === 'entrada' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                                       {move.type === 'entrada' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="text-[10px] font-black text-slate-700 uppercase leading-none">{move.itemName}</span>
                                       <span className={cn("text-[8px] font-black uppercase mt-1", move.type === 'entrada' ? "text-emerald-500" : "text-rose-500")}>{move.type}</span>
                                    </div>
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <span className="text-[10px] font-bold text-slate-600 uppercase">{move.technician || 'COEES-ADMIN'}</span>
                              </TableCell>
                              <TableCell>
                                 <p className="text-[10px] font-medium text-slate-500 italic max-w-[300px] truncate">"{move.reason}"</p>
                              </TableCell>
                              <TableCell className="text-center pr-8">
                                 <Badge className={cn("font-black text-[11px] h-6 w-12 flex items-center justify-center rounded-lg border-none shadow-sm", move.type === 'entrada' ? "bg-emerald-50 text-white" : "bg-rose-50 text-white")}>
                                    {move.type === 'entrada' ? '+' : '-'}{move.quantity}
                                 </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                   </ScrollArea>
                </div>
             </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="p-6 bg-white border-t shrink-0">
           <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-12 px-10 rounded-2xl font-black text-xs text-slate-400">Cerrar Almacén</Button>
        </DialogFooter>
      </DialogContent>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-0 overflow-hidden bg-white border-none shadow-2xl">
          <DialogHeader className="p-8 bg-[#B38E5D] text-white">
            <DialogTitle className="font-black text-xl uppercase">Nuevo Insumo al Catálogo</DialogTitle>
            <DialogDescription className="text-white/70 text-[10px] font-bold uppercase mt-1">Defina un nuevo artículo para su control de stock.</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
             <div className="space-y-2">
                <Label className="text-[10px] font-black text-primary pl-1 uppercase">Nombre del artículo</Label>
                <Input 
                   className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold uppercase" 
                   value={newItemForm.name}
                   onChange={e => setNewItemForm({...newItemForm, name: e.target.value.toUpperCase()})}
                />
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-black text-primary pl-1 uppercase">Categoría Técnica</Label>
                <Select value={newItemForm.category} onValueChange={(val: any) => setNewItemForm({...newItemForm, category: val})}>
                   <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold uppercase"><SelectValue placeholder="ELEGIR..." /></SelectTrigger>
                   <SelectContent className="rounded-xl border-none shadow-2xl">
                      <SelectItem value="Cómputo" className="font-bold text-xs uppercase">Cómputo</SelectItem>
                      <SelectItem value="Redes" className="font-bold text-xs uppercase">Redes</SelectItem>
                      <SelectItem value="Herramientas" className="font-bold text-xs uppercase">Herramientas</SelectItem>
                      <SelectItem value="Consumibles" className="font-bold text-xs uppercase">Consumibles</SelectItem>
                   </SelectContent>
                </Select>
             </div>
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-primary pl-1 uppercase">Stock Inicial</Label>
                  <Input 
                     type="number" 
                     className="h-12 rounded-xl bg-slate-50 border-none shadow-inner text-center font-black" 
                     value={newItemForm.stock}
                     onChange={e => setNewItemForm({...newItemForm, stock: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-primary pl-1 uppercase">Punto Crítico (Min)</Label>
                  <Input 
                     type="number" 
                     className="h-12 rounded-xl bg-slate-50 border-none shadow-inner text-center font-black" 
                     value={newItemForm.minStock}
                     onChange={e => setNewItemForm({...newItemForm, minStock: parseInt(e.target.value) || 0})}
                  />
                </div>
             </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t gap-4">
             <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="h-12 px-6 text-xs font-black uppercase text-slate-400">Cancelar</Button>
             <Button onClick={handleAddItem} className="btn-institutional h-12 px-12 text-[10px] shadow-xl">Guardar en Catálogo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
