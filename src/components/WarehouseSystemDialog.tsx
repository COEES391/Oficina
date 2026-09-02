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
  Minus,
  Truck,
  Users,
  LayoutGrid,
  ShoppingBag,
  HandCoins,
  ChevronLeft,
  School,
  Building2,
  Briefcase
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { schoolsDirectory, type SchoolInfo } from '@/lib/schools-directory'

type WarehouseItem = {
  id: string;
  name: string;
  category: 'Cómputo' | 'Redes' | 'Herramientas' | 'Consumibles';
  stock: number;
  minStock: number;
  lastUpdated: string;
  provider?: string;
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
  cct?: string;
}

type Provider = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  category: string;
}

const DEFAULT_ITEMS: WarehouseItem[] = [
  { id: '1', name: 'CABLE UTP CAT 6 (METROS)', category: 'Redes', stock: 150, minStock: 50, lastUpdated: new Date().toISOString() },
  { id: '2', name: 'CONECTORES RJ45', category: 'Redes', stock: 80, minStock: 20, lastUpdated: new Date().toISOString() },
  { id: '3', name: 'MONITOR LED 21"', category: 'Cómputo', stock: 12, minStock: 3, lastUpdated: new Date().toISOString() },
  { id: '4', name: 'TECLADO USB ESTÁNDAR', category: 'Cómputo', stock: 10, minStock: 5, lastUpdated: new Date().toISOString() },
  { id: '5', name: 'KIT DE HERRAMIENTAS TÉCNICO', category: 'Herramientas', stock: 15, minStock: 2, lastUpdated: new Date().toISOString() }
]

const DEFAULT_PROVIDERS: Provider[] = [
  { id: 'p1', name: 'TECNOLOGÍA GLOBAL SA', contact: 'Ing. Alberto Ruiz', phone: '5512345678', category: 'Hardware' },
  { id: 'p2', name: 'REDES Y SUMINISTROS EDOMEX', contact: 'Lic. Maria Perez', phone: '5587654321', category: 'Redes' }
]

export function WarehouseSystemDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast()
  const [currentView, setCurrentView] = useState<'dashboard' | 'productos' | 'proveedores' | 'clientes' | 'entradas' | 'salidas' | 'registro'>('dashboard')
  const [items, setItems] = useState<WarehouseItem[]>([])
  const [movements, setMovements] = useState<WarehouseMovement[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const [newItemForm, setNewItemForm] = useState({
    name: '',
    category: 'Cómputo' as WarehouseItem['category'],
    stock: 0,
    minStock: 5,
    provider: ''
  })

  const [movementForm, setMovementForm] = useState({
    itemId: '',
    type: 'entrada' as 'entrada' | 'salida',
    quantity: 1,
    reason: '',
    technician: '',
    cct: ''
  })

  const loadData = useCallback(() => {
    try {
      const storedItems = JSON.parse(localStorage.getItem('coees_warehouse_items_v3') || '[]')
      const storedMoves = JSON.parse(localStorage.getItem('coees_warehouse_moves_v3') || '[]')
      const storedProviders = JSON.parse(localStorage.getItem('coees_warehouse_providers_v3') || '[]')
      
      if (storedItems.length === 0) {
        setItems(DEFAULT_ITEMS)
        localStorage.setItem('coees_warehouse_items_v3', JSON.stringify(DEFAULT_ITEMS))
      } else {
        setItems(storedItems)
      }

      if (storedProviders.length === 0) {
        setProviders(DEFAULT_PROVIDERS)
        localStorage.setItem('coees_warehouse_providers_v3', JSON.stringify(DEFAULT_PROVIDERS))
      } else {
        setProviders(storedProviders)
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
      setCurrentView('dashboard')
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

  const filteredMovements = useMemo(() => {
    if (currentView === 'entradas') return movements.filter(m => m.type === 'entrada')
    if (currentView === 'salidas') return movements.filter(m => m.type === 'salida')
    return movements
  }, [movements, currentView])

  const handleEditItem = (item: WarehouseItem) => {
    setEditingItemId(item.id)
    setNewItemForm({
      name: item.name,
      category: item.category,
      stock: item.stock,
      minStock: item.minStock,
      provider: item.provider || ''
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
        provider: newItemForm.provider,
        lastUpdated: new Date().toISOString()
      } : item)
    } else {
      const newItem: WarehouseItem = {
        ...newItemForm,
        id: `ITEM-${Date.now()}`,
        name: newItemForm.name.toUpperCase(),
        lastUpdated: new Date().toISOString()
      }
      updated = [newItem, ...items]
    }

    setItems(updated)
    localStorage.setItem('coees_warehouse_items_v3', JSON.stringify(updated))
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
      technician: movementForm.technician.toUpperCase(),
      cct: movementForm.cct.toUpperCase()
    }

    const updatedItems = [...items]
    const newStock = movementForm.type === 'entrada' 
      ? item.stock + movementForm.quantity 
      : item.stock - movementForm.quantity
    
    updatedItems[itemIndex] = { ...item, stock: newStock, lastUpdated: new Date().toISOString() }
    const updatedMoves = [newMovement, ...movements]

    setItems(updatedItems)
    setMovements(updatedMoves)
    localStorage.setItem('coees_warehouse_items_v3', JSON.stringify(updatedItems))
    localStorage.setItem('coees_warehouse_moves_v3', JSON.stringify(updatedMoves))

    setMovementForm({ itemId: '', type: 'entrada', quantity: 1, reason: '', technician: '', cct: '' })
    toast({ title: "Movimiento registrado con éxito" })
  }

  const handleDeleteItem = (id: string) => {
    if (!confirm("¿Desea eliminar este insumo del catálogo?")) return
    const updated = items.filter(i => i.id !== id)
    setItems(updated)
    localStorage.setItem('coees_warehouse_items_v3', JSON.stringify(updated))
    toast({ title: "Insumo eliminado" })
  }

  const NavigationButton = ({ icon: Icon, label, target, color }: { icon: any, label: string, target: any, color: string }) => (
    <button 
      onClick={() => setCurrentView(target)}
      className="flex flex-col items-center justify-center p-6 bg-white rounded-[2rem] border-2 border-slate-50 shadow-sm hover:shadow-2xl hover:scale-105 transition-all group"
    >
      <div className={cn("h-16 w-16 rounded-3xl flex items-center justify-center text-white mb-4 shadow-xl transition-transform group-hover:rotate-6", color)}>
        <Icon className="h-8 w-8" />
      </div>
      <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider text-center">{label}</span>
    </button>
  )

  if (!mounted) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[1200px] h-[95vh] flex flex-col p-0 overflow-hidden rounded-[3rem] border-none shadow-2xl bg-[#f8f9fa]">
          <DialogHeader className="p-6 bg-[#9f2241] text-white shrink-0 flex flex-row justify-between items-center pr-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Archive className="h-32 w-32" /></div>
            <div className="space-y-1 relative z-10">
              <div className="flex items-center gap-3">
                {currentView !== 'dashboard' && (
                  <button onClick={() => setCurrentView('dashboard')} className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                <DialogTitle className="uppercase font-black text-2xl flex items-center gap-4">
                  CONTROL DE INVENTARIOS COEES
                </DialogTitle>
              </div>
              <DialogDescription className="text-white/60 font-bold text-[10px] tracking-widest mt-1 uppercase">
                 Sistema Integral de Abastecimiento Técnico • Auditoría 2026
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            {currentView === 'dashboard' ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl w-full">
                  <NavigationButton icon={Truck} label="Proveedores" target="proveedores" color="bg-amber-500" />
                  <NavigationButton icon={Box} label="Productos" target="productos" color="bg-blue-600" />
                  <NavigationButton icon={School} label="Base Clientes (CCT)" target="clientes" color="bg-rose-500" />
                  <NavigationButton icon={ArrowUpRight} label="Base Entradas" target="entradas" color="bg-emerald-600" />
                  <NavigationButton icon={ArrowDownRight} label="Base Salidas" target="salidas" color="bg-rose-600" />
                  <NavigationButton icon={ShoppingBag} label="Compras / Ingresos" target="registro" color="bg-indigo-600" />
                  <NavigationButton icon={HandCoins} label="Entregas / Salidas" target="registro" color="bg-teal-600" />
                  <button 
                    onClick={() => onOpenChange(false)}
                    className="flex flex-col items-center justify-center p-6 bg-slate-100 rounded-[2rem] border-2 border-transparent hover:bg-slate-200 transition-all group"
                  >
                    <div className="h-16 w-16 rounded-3xl bg-slate-400 flex items-center justify-center text-white mb-4 shadow-md">
                      <X className="h-8 w-8" />
                    </div>
                    <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Cerrar Almacén</span>
                  </button>
                </div>

                <div className="mt-16 w-full max-w-4xl bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
                   <div className="flex items-center gap-6">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="h-6 w-6" /></div>
                      <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estatus de Almacén</p><p className="text-sm font-black text-slate-700 uppercase">Inventario Operativo al 100%</p></div>
                   </div>
                   <div className="flex gap-4">
                      <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase">Insumos Totales</p><p className="text-xl font-black text-primary">{items.length}</p></div>
                      <div className="w-px h-10 bg-slate-100" />
                      <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase">Stock Crítico</p><p className="text-xl font-black text-rose-500">{items.filter(i => i.stock <= i.minStock).length}</p></div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
                <div className="p-6 pb-0 flex items-center justify-between bg-white border-b shrink-0">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentView('dashboard')} className="h-10 px-4 rounded-xl border border-slate-200 text-slate-400 hover:text-primary font-black text-[10px] uppercase flex items-center gap-2">
                       <ChevronLeft className="h-4 w-4" /> Volver al Inicio
                    </button>
                    <div className="h-6 w-px bg-slate-200" />
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">
                       {currentView === 'productos' && 'Gestión de Productos e Insumos'}
                       {currentView === 'proveedores' && 'Directorio de Proveedores Institucionales'}
                       {currentView === 'clientes' && 'Base Maestra de Centros de Trabajo (CCT)'}
                       {currentView === 'entradas' && 'Bitácora de Entradas (Ingresos)'}
                       {currentView === 'salidas' && 'Bitácora de Salidas (Egresos)'}
                       {currentView === 'registro' && 'Registrar Operación (Entrada/Salida)'}
                    </h3>
                  </div>
                  
                  {currentView === 'productos' && (
                    <div className="flex gap-3">
                      <div className="relative w-64 group">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-300 group-focus-within:text-primary" />
                        <Input placeholder="BUSCAR PRODUCTO..." className="h-9 pl-9 rounded-xl border-slate-100 bg-slate-50 text-[10px] font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                      </div>
                      <Button onClick={() => { setEditingItemId(null); setNewItemForm({ name: '', category: 'Cómputo', stock: 0, minStock: 5, provider: '' }); setIsAddDialogOpen(true); }} className="btn-institutional h-9 px-4 rounded-xl text-[9px] gap-2">
                        <PlusCircle className="h-3.5 w-3.5" /> Nuevo Insumo
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-hidden p-6 bg-slate-50/30">
                  {currentView === 'productos' && (
                    <div className="h-full border border-slate-100 rounded-[2rem] bg-white shadow-xl overflow-hidden">
                      <ScrollArea className="h-full">
                        <Table>
                          <TableHeader className="bg-slate-50 border-b sticky top-0 z-10 shadow-sm">
                            <TableRow className="h-10">
                              <TableHead className="font-black text-[9px] uppercase pl-8">Categoría</TableHead>
                              <TableHead className="font-black text-[9px] uppercase">Descripción del Insumo</TableHead>
                              <TableHead className="font-black text-[9px] uppercase text-center">Existencia</TableHead>
                              <TableHead className="font-black text-[9px] uppercase text-center">Estatus</TableHead>
                              <TableHead className="text-right font-black text-[9px] uppercase pr-10">Gestión</TableHead>
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
                                        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Mínimo Crítico: {item.minStock}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center"><span className={cn("text-lg font-black", isLowStock ? "text-rose-500" : "text-[#9f2241]")}>{item.stock}</span></TableCell>
                                  <TableCell className="text-center">
                                    <Badge className={cn("font-black text-[6px] border-none px-2 h-4", isLowStock ? "bg-rose-500 text-white animate-pulse" : "bg-emerald-500 text-white")}>
                                      {isLowStock ? 'CRÍTICO' : 'ÓPTIMO'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right pr-8">
                                      <div className="flex justify-end gap-0.5">
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/5" onClick={() => handleEditItem(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-rose-600" onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                      </div>
                                  </TableCell>
                                </TableRow>
                              )
                            }) : (
                              <TableRow><TableCell colSpan={5} className="text-center py-20 opacity-20"><PackageSearch className="h-10 w-10 mx-auto mb-2" /><p className="text-[10px] font-black uppercase">Sin registros en catálogo</p></TableCell></TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  )}

                  {currentView === 'proveedores' && (
                    <div className="h-full border border-slate-100 rounded-[2rem] bg-white shadow-xl overflow-hidden">
                      <ScrollArea className="h-full">
                        <Table>
                          <TableHeader className="bg-slate-50 border-b sticky top-0 z-10 shadow-sm"><TableRow className="h-10"><TableHead className="font-black text-[9px] uppercase pl-8">Proveedor</TableHead><TableHead className="font-black text-[9px] uppercase">Contacto</TableHead><TableHead className="font-black text-[9px] uppercase">Teléfono</TableHead><TableHead className="font-black text-[9px] uppercase">Categoría</TableHead></TableRow></TableHeader>
                          <TableBody>{providers.map((p) => (<TableRow key={p.id} className="h-14 border-b border-slate-50"><TableCell className="pl-8 font-black text-slate-700 text-xs uppercase">{p.name}</TableCell><TableCell className="font-bold text-slate-500 text-[11px] uppercase">{p.contact}</TableCell><TableCell className="font-mono text-slate-400 text-xs">{p.phone}</TableCell><TableCell><Badge variant="secondary" className="text-[7px] font-black uppercase">{p.category}</Badge></TableCell></TableRow>))}</TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  )}

                  {currentView === 'clientes' && (
                    <div className="h-full border border-slate-100 rounded-[2rem] bg-white shadow-xl overflow-hidden">
                      <ScrollArea className="h-full">
                        <Table>
                          <TableHeader className="bg-slate-50 border-b sticky top-0 z-10 shadow-sm"><TableRow className="h-10"><TableHead className="font-black text-[9px] uppercase pl-8">CCT</TableHead><TableHead className="font-black text-[9px] uppercase">Nombre del Plantel</TableHead><TableHead className="font-black text-[9px] uppercase">Municipio</TableHead><TableHead className="font-black text-[9px] uppercase">Modalidad</TableHead></TableRow></TableHeader>
                          <TableBody>{schoolsDirectory.slice(0, 100).map((s) => (<TableRow key={`${s.cct}-${s.turno}`} className="h-14 border-b border-slate-50"><TableCell className="pl-8 font-mono font-black text-primary text-xs">{s.cct}</TableCell><TableCell className="font-black text-slate-700 text-[10px] uppercase truncate max-w-[200px]">{s.nombre}</TableCell><TableCell className="font-bold text-slate-500 text-[10px] uppercase">{s.municipio}</TableCell><TableCell><Badge variant="outline" className="text-[7px] font-black uppercase border-primary/20">{s.modalidad}</Badge></TableCell></TableRow>))}</TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  )}

                  {(currentView === 'entradas' || currentView === 'salidas') && (
                    <div className="h-full border border-slate-100 rounded-[2rem] bg-white shadow-xl overflow-hidden">
                      <ScrollArea className="h-full">
                        <Table>
                          <TableHeader className="bg-slate-50 border-b sticky top-0 z-10 shadow-sm"><TableRow className="h-10"><TableHead className="font-black text-[9px] uppercase pl-8">Fecha</TableHead><TableHead className="font-black text-[9px] uppercase">Insumo</TableHead><TableHead className="font-black text-[9px] uppercase">Técnico</TableHead><TableHead className="font-black text-[9px] uppercase">Detalle / Destino</TableHead><TableHead className="text-center font-black text-[9px] uppercase pr-8">Cant.</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {filteredMovements.length > 0 ? filteredMovements.map((move) => (
                              <TableRow key={move.id} className="h-14 border-b border-slate-50">
                                <TableCell className="pl-8 text-[8px] font-black text-slate-400 uppercase">{move.date}</TableCell>
                                <TableCell className="text-[11px] font-black text-slate-700 uppercase">{move.itemName}</TableCell>
                                <TableCell className="text-[10px] font-bold text-slate-600 uppercase">{move.technician}</TableCell>
                                <TableCell className="text-[9px] font-medium text-slate-500 italic truncate max-w-[200px]">"{move.reason}" {move.cct && `• ${move.cct}`}</TableCell>
                                <TableCell className="text-center pr-8 font-black text-xs text-primary">{move.quantity}</TableCell>
                              </TableRow>
                            )) : (
                              <TableRow><TableCell colSpan={5} className="text-center py-20 opacity-30 text-[10px] font-black uppercase">Sin movimientos registrados</TableCell></TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  )}

                  {currentView === 'registro' && (
                    <div className="max-w-4xl mx-auto py-4 h-full">
                      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl space-y-8 animate-in zoom-in-95 duration-500 h-full overflow-hidden flex flex-col">
                        <div className="flex items-center gap-5 border-b pb-6 shrink-0">
                          <div className="h-14 w-14 rounded-2xl bg-[#9f2241]/10 flex items-center justify-center text-[#9f2241]"><ArrowLeftRight className="h-7 w-7" /></div>
                          <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase leading-none">Registrar Operación</h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">Actualización de flujo técnico institucional</p>
                          </div>
                        </div>

                        <ScrollArea className="flex-1 pr-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-primary uppercase pl-2">1. Seleccionar Insumo</Label>
                              <Select value={movementForm.itemId} onValueChange={v => setMovementForm({...movementForm, itemId: v})}>
                                <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold uppercase text-[11px] shadow-inner"><SelectValue placeholder="BUSCAR INSUMO..." /></SelectTrigger>
                                <SelectContent className="rounded-2xl shadow-2xl">{items.map(i => (<SelectItem key={i.id} value={i.id} className="text-[10px] font-bold uppercase">{i.name} ({i.stock} DISP.)</SelectItem>))}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-primary uppercase pl-2">2. Tipo de Movimiento</Label>
                              <div className="flex gap-3">
                                <button onClick={() => setMovementForm({...movementForm, type: 'entrada'})} className={cn("flex-1 h-12 rounded-2xl border-2 flex items-center justify-center gap-2 font-black text-[11px] uppercase transition-all", movementForm.type === 'entrada' ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg" : "bg-white border-slate-100 text-slate-400")}>
                                  <ArrowUpRight className="h-5 w-5" /> Entrada
                                </button>
                                <button onClick={() => setMovementForm({...movementForm, type: 'salida'})} className={cn("flex-1 h-12 rounded-2xl border-2 flex items-center justify-center gap-2 font-black text-[11px] uppercase transition-all", movementForm.type === 'salida' ? "bg-rose-50 border-rose-500 text-rose-700 shadow-lg" : "bg-white border-slate-100 text-slate-400")}>
                                  <ArrowDownRight className="h-5 w-5" /> Salida
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-primary uppercase pl-2">3. Cantidad</Label>
                              <Input type="number" min={1} className="h-12 rounded-2xl bg-slate-50 border-none text-center font-black text-2xl shadow-inner" value={movementForm.quantity} onChange={e => setMovementForm({...movementForm, quantity: parseInt(e.target.value) || 0})} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-primary uppercase pl-2">4. Analista / Técnico</Label>
                              <Input placeholder="NOMBRE COMPLETO..." className="h-12 rounded-2xl bg-slate-50 border-none font-bold uppercase text-[11px] shadow-inner" value={movementForm.technician} onChange={e => setMovementForm({...movementForm, technician: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-primary uppercase pl-2">5. CCT Destino (Solo para Salidas)</Label>
                              <Input placeholder="15DES0000X..." className="h-12 rounded-2xl bg-slate-50 border-none font-mono font-black text-center shadow-inner" value={movementForm.cct} onChange={e => setMovementForm({...movementForm, cct: e.target.value.toUpperCase()})} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-primary uppercase pl-2">6. Motivo del Movimiento</Label>
                              <Input placeholder="EJ. COMPRA PROVEEDOR / ENTREGA BRIGADA..." className="h-12 rounded-2xl bg-slate-50 border-none font-bold uppercase text-[11px] shadow-inner" value={movementForm.reason} onChange={e => setMovementForm({...movementForm, reason: e.target.value})} />
                            </div>
                          </div>
                        </ScrollArea>

                        <Button onClick={handleRegisterMovement} className="w-full btn-institutional h-16 rounded-3xl shadow-2xl text-sm gap-4 shrink-0">
                          <Save className="h-6 w-6" /> PROCESAR OPERACIÓN
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 bg-slate-100/50 border-t shrink-0 flex justify-between items-center px-10">
             <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Sistema Auditado • COEES 2026</p></div>
             <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-10 px-8 rounded-xl font-bold text-[10px] text-slate-400 hover:text-primary uppercase">Cerrar Almacén</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-0 overflow-hidden bg-white border-none shadow-2xl z-[150]">
          <DialogHeader className="p-8 bg-[#B38E5D] text-white">
            <DialogTitle className="font-black text-xl uppercase flex items-center gap-3">
              <PlusCircle className="h-6 w-6" /> {editingItemId ? 'Actualizar Insumo' : 'Nuevo Registro de Insumo'}
            </DialogTitle>
            <DialogDescription className="text-white/70 text-[10px] font-bold uppercase mt-2 tracking-widest">Configuración técnica del catálogo maestro</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
             <div className="space-y-2"><Label className="text-[10px] font-black text-primary uppercase pl-2">Descripción del Producto</Label><Input className="h-12 rounded-2xl bg-slate-50 border-none shadow-inner font-black uppercase text-xs" value={newItemForm.name} onChange={e => setNewItemForm({...newItemForm, name: e.target.value})} placeholder="EJ. CABLE UTP CAT6..." /></div>
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-primary uppercase pl-2">Categoría Técnica</Label>
                  <Select value={newItemForm.category} onValueChange={(val: any) => setNewItemForm({...newItemForm, category: val})}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none shadow-inner font-bold uppercase text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-2xl z-[200]">
                      <SelectItem value="Cómputo" className="text-[10px] font-bold">CÓMPUTO</SelectItem>
                      <SelectItem value="Redes" className="text-[10px] font-bold">REDES</SelectItem>
                      <SelectItem value="Herramientas" className="text-[10px] font-bold">HERRAMIENTAS</SelectItem>
                      <SelectItem value="Consumibles" className="text-[10px] font-bold">CONSUMIBLES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label className="text-[10px] font-black text-primary uppercase pl-2">Mínimo en Stock</Label><Input type="number" className="h-11 rounded-xl bg-slate-50 border-none shadow-inner text-center font-black" value={newItemForm.minStock} onChange={e => setNewItemForm({...newItemForm, minStock: parseInt(e.target.value) || 0})} /></div>
             </div>
             {!editingItemId && (
               <div className="space-y-2"><Label className="text-[10px] font-black text-primary uppercase pl-2">Existencia Inicial</Label><Input type="number" className="h-12 rounded-2xl bg-slate-50 border-none shadow-inner text-center font-black text-xl" value={newItemForm.stock} onChange={e => setNewItemForm({...newItemForm, stock: parseInt(e.target.value) || 0})} /></div>
             )}
             <div className="space-y-2">
                <Label className="text-[10px] font-black text-primary uppercase pl-2">Proveedor Recomendado</Label>
                <Select value={newItemForm.provider} onValueChange={v => setNewItemForm({...newItemForm, provider: v})}>
                   <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none shadow-inner font-bold uppercase text-[10px]">
                      <SelectValue placeholder="SELECCIONAR..." />
                   </SelectTrigger>
                   <SelectContent className="rounded-xl shadow-2xl z-[200]">
                      {providers.length > 0 ? (
                        providers.map(p => (<SelectItem key={p.id} value={p.name} className="text-[10px] font-bold">{p.name}</SelectItem>))
                      ) : (
                        <SelectItem value="SIN PROVEEDOR" disabled className="text-[10px] font-bold">SIN PROVEEDORES</SelectItem>
                      )}
                   </SelectContent>
                </Select>
             </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t gap-4">
            <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="h-12 px-8 text-[11px] font-black uppercase text-slate-400">Cancelar</Button>
            <Button onClick={handleSaveItem} className="btn-institutional h-12 px-12 text-[11px] shadow-2xl gap-3"><Save className="h-4 w-4" /> {editingItemId ? 'Guardar Cambios' : 'Confirmar Registro'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
