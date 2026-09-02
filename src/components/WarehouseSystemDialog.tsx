
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
  ArrowUpRight, 
  ArrowDownRight, 
  Archive,
  X,
  ArrowLeftRight,
  Save,
  CheckCircle2,
  PackageSearch,
  Pencil,
  Truck,
  Users,
  ShoppingBag,
  HandCoins,
  ChevronLeft,
  Building2,
  Phone,
  User,
  ShieldCheck,
  Hash,
  ClipboardList,
  RotateCcw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

type WarehouseItem = {
  id: string;
  name: string;
  code?: string;
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
  itemCode?: string;
  category?: string;
  unit?: string;
  type: 'entrada' | 'salida';
  quantity: number;
  date: string;
  folio?: string;
  provider?: string;
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

type WarehouseUser = {
  id: string;
  name: string;
  location: 'Regional' | 'Central (Toluca)';
  status: 'Activo' | 'Inactivo';
}

const DEFAULT_ITEMS: WarehouseItem[] = [
  { id: '1', name: 'CABLE UTP CAT 6 (METROS)', code: 'UTP-001', category: 'Redes', stock: 150, minStock: 50, lastUpdated: new Date().toISOString() },
  { id: '2', name: 'CONECTORES RJ45', code: 'RJ45-002', category: 'Redes', stock: 80, minStock: 20, lastUpdated: new Date().toISOString() },
  { id: '3', name: 'MONITOR LED 21"', code: 'MON-003', category: 'Cómputo', stock: 12, minStock: 3, lastUpdated: new Date().toISOString() },
  { id: '4', name: 'TECLADO USB ESTÁNDAR', code: 'TEC-004', category: 'Cómputo', stock: 10, minStock: 5, lastUpdated: new Date().toISOString() },
  { id: '5', name: 'KIT DE HERRAMIENTAS TÉCNICO', code: 'KIT-005', category: 'Herramientas', stock: 15, minStock: 2, lastUpdated: new Date().toISOString() }
]

const DEFAULT_PROVIDERS: Provider[] = [
  { id: 'p1', name: 'TECNOLOGÍA GLOBAL SA', contact: 'Ing. Alberto Ruiz', phone: '5512345678', category: 'Hardware' },
  { id: 'p2', name: 'REDES Y SUMINISTROS EDOMEX', contact: 'Lic. Maria Perez', phone: '5587654321', category: 'Redes' }
]

const DEFAULT_USERS: WarehouseUser[] = [
  { id: 'u1', name: 'OFICINA REGIONAL ECATEPEC', location: 'Regional', status: 'Activo' },
  { id: 'u2', name: 'OFICINA REGIONAL NAUCALPAN', location: 'Regional', status: 'Activo' },
  { id: 'u3', name: 'OFICINA REGIONAL NEZAHUALCÓYOTL', location: 'Regional', status: 'Activo' },
  { id: 'u4', name: 'TOLUCA CAPACITACIÓN', location: 'Central (Toluca)', status: 'Activo' },
  { id: 'u5', name: 'TOLUCA SOPORTE', location: 'Central (Toluca)', status: 'Activo' },
  { id: 'u6', name: 'TOLUCA PROGRAMAS', location: 'Central (Toluca)', status: 'Activo' },
  { id: 'u7', name: 'TOLUCA JEFATURA', location: 'Central (Toluca)', status: 'Activo' },
  { id: 'u8', name: 'TOLUCA SUBJEFATURA', location: 'Central (Toluca)', status: 'Activo' },
  { id: 'u9', name: 'TOLUCA PLANEACIÓN', location: 'Central (Toluca)', status: 'Activo' }
]

export function WarehouseSystemDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast()
  const [currentView, setCurrentView] = useState<'dashboard' | 'productos' | 'proveedores' | 'usuarios' | 'entradas' | 'salidas' | 'registro'>('dashboard')
  const [items, setItems] = useState<WarehouseItem[]>([])
  const [movements, setMovements] = useState<WarehouseMovement[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [users, setUsers] = useState<WarehouseUser[]>([])
  
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddProviderDialogOpen, setIsAddProviderDialogOpen] = useState(false)
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingMovementId, setEditingMovementId] = useState<string | null>(null)
  
  const [mounted, setMounted] = useState(false)

  const [newItemForm, setNewItemForm] = useState({
    name: '',
    code: '',
    category: 'Cómputo' as WarehouseItem['category'],
    stock: 0,
    minStock: 5,
    provider: ''
  })

  const [newProviderForm, setNewProviderForm] = useState({
    name: '',
    contact: '',
    phone: '',
    category: ''
  })

  const [newUserForm, setNewUserForm] = useState({
    name: '',
    location: 'Regional' as WarehouseUser['location'],
    status: 'Activo' as WarehouseUser['status']
  })

  const [movementForm, setMovementForm] = useState({
    itemId: '',
    folio: '',
    unit: 'PZA',
    type: 'entrada' as 'entrada' | 'salida',
    quantity: 1,
    reason: '',
    technician: '',
    cct: ''
  })

  const loadData = useCallback(() => {
    try {
      const storedItems = JSON.parse(localStorage.getItem('coees_warehouse_items_v4') || '[]')
      const storedMoves = JSON.parse(localStorage.getItem('coees_warehouse_moves_v4') || '[]')
      const storedProviders = JSON.parse(localStorage.getItem('coees_warehouse_providers_v4') || '[]')
      const storedUsers = JSON.parse(localStorage.getItem('coees_warehouse_users_v4') || '[]')
      
      setItems(storedItems.length === 0 ? DEFAULT_ITEMS : storedItems)
      setProviders(storedProviders.length === 0 ? DEFAULT_PROVIDERS : storedProviders)
      setUsers(storedUsers.length === 0 ? DEFAULT_USERS : storedUsers)
      setMovements(storedMoves)
      
      if (storedItems.length === 0) localStorage.setItem('coees_warehouse_items_v4', JSON.stringify(DEFAULT_ITEMS))
      if (storedProviders.length === 0) localStorage.setItem('coees_warehouse_providers_v4', JSON.stringify(DEFAULT_PROVIDERS))
      if (storedUsers.length === 0) localStorage.setItem('coees_warehouse_users_v4', JSON.stringify(DEFAULT_USERS))
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
    if (searchTerm && currentView === 'productos') {
      const term = searchTerm.toLowerCase();
      list = list.filter(item => 
        (item.name || '').toLowerCase().includes(term) ||
        (item.category || '').toLowerCase().includes(term) ||
        (item.code || '').toLowerCase().includes(term)
      )
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [items, searchTerm, currentView])

  const filteredProviders = useMemo(() => {
    let list = [...providers];
    if (searchTerm && currentView === 'proveedores') {
      const term = searchTerm.toLowerCase();
      list = list.filter(p => 
        (p.name || '').toLowerCase().includes(term) ||
        (p.contact || '').toLowerCase().includes(term) ||
        (p.category || '').toLowerCase().includes(term)
      )
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [providers, searchTerm, currentView])

  const filteredUsers = useMemo(() => {
    let list = [...users];
    if (searchTerm && currentView === 'usuarios') {
      const term = searchTerm.toLowerCase();
      list = list.filter(u => 
        (u.name || '').toLowerCase().includes(term) ||
        (u.location || '').toLowerCase().includes(term)
      )
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [users, searchTerm, currentView])

  const filteredMovements = useMemo(() => {
    let list = [...movements];
    if (currentView === 'entradas') list = list.filter(m => m.type === 'entrada')
    if (currentView === 'salidas') list = list.filter(m => m.type === 'salida')
    
    if (searchTerm && (currentView === 'entradas' || currentView === 'salidas')) {
      const term = searchTerm.toLowerCase();
      list = list.filter(m => 
        (m.itemName || '').toLowerCase().includes(term) ||
        (m.folio || '').toLowerCase().includes(term) ||
        (m.cct || '').toLowerCase().includes(term) ||
        (m.technician || '').toLowerCase().includes(term)
      )
    }
    return list
  }, [movements, currentView, searchTerm])

  // PRODUCT LOGIC
  const handleEditItem = (item: WarehouseItem) => {
    setEditingItemId(item.id)
    setNewItemForm({
      name: item.name,
      code: item.code || '',
      category: item.category,
      stock: item.stock,
      minStock: item.minStock,
      provider: item.provider || ''
    })
    setIsAddDialogOpen(true)
  }

  const handleSaveItem = () => {
    if (!newItemForm.name) return
    let updated;
    if (editingItemId) {
      updated = items.map(item => item.id === editingItemId ? {
        ...item,
        name: newItemForm.name.toUpperCase(),
        code: newItemForm.code.toUpperCase(),
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
        code: newItemForm.code.toUpperCase(),
        lastUpdated: new Date().toISOString()
      }
      updated = [newItem, ...items]
    }
    setItems(updated)
    localStorage.setItem('coees_warehouse_items_v4', JSON.stringify(updated))
    setIsAddDialogOpen(false)
    toast({ title: "Insumo guardado" })
  }

  const handleDeleteItem = (id: string) => {
    if (!confirm("¿Eliminar insumo?")) return
    const updated = items.filter(i => i.id !== id)
    setItems(updated)
    localStorage.setItem('coees_warehouse_items_v4', JSON.stringify(updated))
    toast({ title: "Insumo eliminado" })
  }

  // PROVIDER LOGIC
  const handleEditProvider = (provider: Provider) => {
    setEditingProviderId(provider.id)
    setNewProviderForm({
      name: provider.name,
      contact: provider.contact,
      phone: provider.phone,
      category: provider.category
    })
    setIsAddProviderDialogOpen(true)
  }

  const handleSaveProvider = () => {
    if (!newProviderForm.name) return
    let updated;
    if (editingProviderId) {
      updated = providers.map(p => p.id === editingProviderId ? {
        ...p,
        name: newProviderForm.name.toUpperCase(),
        contact: newProviderForm.contact.toUpperCase(),
        phone: newProviderForm.phone,
        category: newProviderForm.category.toUpperCase()
      } : p)
    } else {
      const newProvider: Provider = {
        ...newProviderForm,
        id: `PROV-${Date.now()}`,
        name: newProviderForm.name.toUpperCase(),
        contact: newProviderForm.contact.toUpperCase(),
        category: newProviderForm.category.toUpperCase()
      }
      updated = [newProvider, ...providers]
    }
    setProviders(updated)
    localStorage.setItem('coees_warehouse_providers_v4', JSON.stringify(updated))
    setIsAddProviderDialogOpen(false)
    toast({ title: "Proveedor guardado" })
  }

  const handleDeleteProvider = (id: string) => {
    if (!confirm("¿Eliminar proveedor?")) return
    const updated = providers.filter(p => p.id !== id)
    setProviders(updated)
    localStorage.setItem('coees_warehouse_providers_v4', JSON.stringify(updated))
    toast({ title: "Proveedor eliminado" })
  }

  // USER LOGIC
  const handleEditUser = (user: WarehouseUser) => {
    setEditingUserId(user.id)
    setNewUserForm({
      name: user.name,
      location: user.location,
      status: user.status
    })
    setIsAddUserDialogOpen(true)
  }

  const handleSaveUser = () => {
    if (!newUserForm.name) return
    let updated;
    if (editingUserId) {
      updated = users.map(u => u.id === editingUserId ? {
        ...u,
        name: newUserForm.name.toUpperCase(),
        location: newUserForm.location,
        status: newUserForm.status
      } : u)
    } else {
      const newUser: WarehouseUser = {
        ...newUserForm,
        id: `WUSER-${Date.now()}`,
        name: newUserForm.name.toUpperCase()
      }
      updated = [newUser, ...users]
    }
    setUsers(updated)
    localStorage.setItem('coees_warehouse_users_v4', JSON.stringify(updated))
    setIsAddUserDialogOpen(false)
    toast({ title: "Usuario actualizado" })
  }

  const handleDeleteUser = (id: string) => {
    if (!confirm("¿Remover esta área/oficina del directorio?")) return
    const updated = users.filter(u => u.id !== id)
    setUsers(updated)
    localStorage.setItem('coees_warehouse_users_v4', JSON.stringify(updated))
    toast({ title: "Registro removido" })
  }

  // MOVEMENT LOGIC
  const handleEditMovement = (move: WarehouseMovement) => {
    setEditingMovementId(move.id)
    setMovementForm({
      itemId: move.itemId,
      folio: move.folio || '',
      unit: move.unit || 'PZA',
      type: move.type,
      quantity: move.quantity,
      reason: move.reason,
      technician: move.technician,
      cct: move.cct || ''
    })
    setCurrentView('registro')
  }

  const handleDeleteMovement = (id: string) => {
    if (!confirm("¿Desea eliminar este registro de movimiento? El stock será revertido.")) return
    const move = movements.find(m => m.id === id)
    if (!move) return

    const updatedItems = [...items]
    const itemIndex = updatedItems.findIndex(i => i.id === move.itemId)
    if (itemIndex !== -1) {
      const item = updatedItems[itemIndex]
      // Revertir el stock: si era entrada, restar. si era salida, sumar.
      const newStock = move.type === 'entrada' ? item.stock - move.quantity : item.stock + move.quantity
      updatedItems[itemIndex] = { ...item, stock: newStock, lastUpdated: new Date().toISOString() }
    }

    const updatedMoves = movements.filter(m => m.id !== id)
    setItems(updatedItems)
    setMovements(updatedMoves)
    
    localStorage.setItem('coees_warehouse_items_v4', JSON.stringify(updatedItems))
    localStorage.setItem('coees_warehouse_moves_v4', JSON.stringify(updatedMoves))
    toast({ title: "Registro eliminado y stock revertido" })
  }

  const handleRegisterMovement = () => {
    if (!movementForm.itemId || !movementForm.reason || movementForm.quantity <= 0) {
      toast({ variant: "destructive", title: "Datos incompletos" })
      return
    }
    const itemIndex = items.findIndex(i => i.id === movementForm.itemId)
    if (itemIndex === -1) return
    const item = items[itemIndex]
    
    // Si estamos editando, primero revertimos el stock anterior
    let updatedItems = [...items]
    if (editingMovementId) {
      const oldMove = movements.find(m => m.id === editingMovementId)
      if (oldMove) {
        const oldItemIndex = updatedItems.findIndex(i => i.id === oldMove.itemId)
        if (oldItemIndex !== -1) {
          const oldItem = updatedItems[oldItemIndex]
          const revertedStock = oldMove.type === 'entrada' ? oldItem.stock - oldMove.quantity : oldItem.stock + oldMove.quantity
          updatedItems[oldItemIndex] = { ...oldItem, stock: revertedStock }
        }
      }
    }

    // Volvemos a obtener el item del array actualizado para el calculo final
    const currentItem = updatedItems.find(i => i.id === movementForm.itemId)
    if (!currentItem) return
    
    if (movementForm.type === 'salida' && currentItem.stock < movementForm.quantity) {
      toast({ variant: "destructive", title: "Stock insuficiente" })
      return
    }

    const moveData: WarehouseMovement = {
      id: editingMovementId || `MOVE-${Date.now()}`,
      itemId: currentItem.id,
      itemName: currentItem.name,
      itemCode: currentItem.code,
      category: currentItem.category,
      unit: movementForm.unit.toUpperCase(),
      type: movementForm.type,
      quantity: movementForm.quantity,
      date: format(new Date(), 'dd/MM/yyyy'),
      folio: movementForm.folio.toUpperCase(),
      provider: currentItem.provider || 'S/D',
      reason: movementForm.reason.toUpperCase(),
      technician: movementForm.technician.toUpperCase(),
      cct: movementForm.cct.toUpperCase()
    }

    const finalStock = movementForm.type === 'entrada' ? currentItem.stock + movementForm.quantity : currentItem.stock - movementForm.quantity
    updatedItems = updatedItems.map(i => i.id === currentItem.id ? { ...i, stock: finalStock, lastUpdated: new Date().toISOString() } : i)
    
    const updatedMoves = editingMovementId ? movements.map(m => m.id === editingMovementId ? moveData : m) : [moveData, ...movements]
    
    setItems(updatedItems)
    setMovements(updatedMoves)
    
    localStorage.setItem('coees_warehouse_items_v4', JSON.stringify(updatedItems))
    localStorage.setItem('coees_warehouse_moves_v4', JSON.stringify(updatedMoves))
    
    setMovementForm({ itemId: '', folio: '', unit: 'PZA', type: 'entrada', quantity: 1, reason: '', technician: '', cct: '' })
    setEditingMovementId(null)
    toast({ title: editingMovementId ? "Registro actualizado" : "Movimiento registrado con éxito" })
    setCurrentView(movementForm.type === 'entrada' ? 'entradas' : 'salidas')
  }

  const NavigationButton = ({ icon: Icon, label, target, color }: { icon: any, label: string, target: any, color: string }) => (
    <button 
      onClick={() => { setCurrentView(target); setSearchTerm(''); setEditingMovementId(null); }}
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
        <DialogContent className="sm:max-w-[1300px] h-[95vh] flex flex-col p-0 overflow-hidden rounded-[3rem] border-none shadow-2xl bg-[#f8f9fa]">
          <DialogHeader className="p-6 bg-[#9f2241] text-white shrink-0 flex flex-row justify-between items-center pr-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Archive className="h-32 w-32" /></div>
            <div className="space-y-1 relative z-10">
              <div className="flex items-center gap-3">
                {currentView !== 'dashboard' && (
                  <button onClick={() => { setCurrentView('dashboard'); setEditingMovementId(null); }} className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                <DialogTitle className="uppercase font-black text-2xl flex items-center gap-4">CONTROL DE INVENTARIOS COEES</DialogTitle>
              </div>
              <DialogDescription className="text-white/60 font-bold text-[10px] tracking-widest mt-1 uppercase">Sistema Integral de Abastecimiento Técnico • Auditoría 2026</DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            {currentView === 'dashboard' ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl w-full">
                  <NavigationButton icon={Truck} label="Proveedores" target="proveedores" color="bg-amber-500" />
                  <NavigationButton icon={Box} label="Productos" target="productos" color="bg-blue-600" />
                  <NavigationButton icon={Users} label="Base Usuarios" target="usuarios" color="bg-rose-500" />
                  <NavigationButton icon={ArrowUpRight} label="Base Entradas" target="entradas" color="bg-emerald-600" />
                  <NavigationButton icon={ArrowDownRight} label="Base Salidas" target="salidas" color="bg-rose-600" />
                  <NavigationButton icon={ShoppingBag} label="Requisiciones" target="registro" color="bg-indigo-600" />
                  <NavigationButton icon={HandCoins} label="Entregas / Salidas" target="registro" color="bg-teal-600" />
                  <button onClick={() => onOpenChange(false)} className="flex flex-col items-center justify-center p-6 bg-slate-100 rounded-[2rem] border-2 border-transparent hover:bg-slate-200 transition-all group">
                    <div className="h-16 w-16 rounded-3xl bg-slate-400 flex items-center justify-center text-white mb-4 shadow-md"><X className="h-8 w-8" /></div>
                    <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Cerrar Almacén</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
                <div className="p-6 pb-4 flex flex-col md:flex-row items-center justify-between bg-white border-b shrink-0 gap-4">
                  <div className="flex items-center gap-4">
                    <button onClick={() => { setCurrentView('dashboard'); setEditingMovementId(null); }} className="h-10 px-4 rounded-xl border border-slate-200 text-slate-400 hover:text-primary font-black text-[10px] uppercase flex items-center gap-2"><ChevronLeft className="h-4 w-4" /> Volver al Inicio</button>
                    <div className="h-6 w-px bg-slate-200" />
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">
                       {currentView === 'productos' && 'Gestión de Productos e Insumos'}
                       {currentView === 'proveedores' && 'Directorio de Proveedores'}
                       {currentView === 'usuarios' && 'Base de Usuarios Institucionales'}
                       {currentView === 'entradas' && 'Base de Datos de Entradas'}
                       {currentView === 'salidas' && 'Base de Datos de Salidas'}
                       {currentView === 'registro' && (editingMovementId ? 'Editar Operación Técnica' : 'Registrar Operación Técnica')}
                    </h3>
                  </div>
                  
                  <div className="flex gap-3">
                    {(currentView === 'entradas' || currentView === 'salidas' || currentView === 'productos' || currentView === 'proveedores' || currentView === 'usuarios') && (
                      <div className="relative w-64 group">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-300 group-focus-within:text-primary" />
                        <Input placeholder="FILTRAR..." className="h-9 pl-9 rounded-xl border-slate-100 bg-slate-50 text-[10px] font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                      </div>
                    )}
                    
                    {currentView === 'entradas' && (
                      <Button onClick={() => { setMovementForm({...movementForm, type: 'entrada'}); setCurrentView('registro'); setEditingMovementId(null); }} className="bg-emerald-600 hover:bg-emerald-700 h-9 px-4 rounded-xl text-[9px] gap-2 shadow-lg">
                        <PlusCircle className="h-3.5 w-3.5" /> Nueva Entrada
                      </Button>
                    )}
                    {currentView === 'salidas' && (
                      <Button onClick={() => { setMovementForm({...movementForm, type: 'salida'}); setCurrentView('registro'); setEditingMovementId(null); }} className="bg-rose-600 hover:bg-rose-700 h-9 px-4 rounded-xl text-[9px] gap-2 shadow-lg">
                        <PlusCircle className="h-3.5 w-3.5" /> Nueva Salida
                      </Button>
                    )}

                    {(currentView === 'productos' || currentView === 'proveedores' || currentView === 'usuarios') && (
                      <Button onClick={() => {
                        if (currentView === 'productos') { setEditingItemId(null); setNewItemForm({name: '', code: '', category: 'Cómputo', stock: 0, minStock: 5, provider: ''}); setIsAddDialogOpen(true); }
                        if (currentView === 'proveedores') { setEditingProviderId(null); setIsAddProviderDialogOpen(true); }
                        if (currentView === 'usuarios') { setEditingUserId(null); setNewUserForm({name: '', location: 'Regional', status: 'Activo'}); setIsAddUserDialogOpen(true); }
                      }} className="btn-institutional h-9 px-4 rounded-xl text-[9px] gap-2">
                        <PlusCircle className="h-3.5 w-3.5" /> 
                        {currentView === 'productos' ? 'Nuevo Insumo' : currentView === 'proveedores' ? 'Nuevo Proveedor' : 'Nuevo Usuario'}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-hidden p-6 bg-slate-50/30">
                  {currentView === 'productos' && (
                    <div className="h-full border border-slate-100 rounded-[2rem] bg-white shadow-xl overflow-hidden">
                      <ScrollArea className="h-full">
                        <Table>
                          <TableHeader className="bg-slate-50 border-b sticky top-0 z-10 shadow-sm">
                            <TableRow className="h-10">
                              <TableHead className="font-black text-[9px] uppercase pl-8">Código</TableHead>
                              <TableHead className="font-black text-[9px] uppercase">Categoría</TableHead>
                              <TableHead className="font-black text-[9px] uppercase">Descripción del Insumo</TableHead>
                              <TableHead className="font-black text-[9px] uppercase text-center">Existencia</TableHead>
                              <TableHead className="text-right font-black text-[9px] uppercase pr-10">Gestión</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredItems.map((item) => (
                              <TableRow key={item.id} className="hover:bg-slate-50 h-14 border-b border-slate-50">
                                <TableCell className="pl-8 font-mono text-[10px] font-black text-primary">{item.code || 'S/C'}</TableCell>
                                <TableCell><Badge variant="outline" className="font-black text-[7px] uppercase px-2 h-4">{item.category}</Badge></TableCell>
                                <TableCell><div className="flex flex-col"><span className="text-[12px] font-black text-slate-700 uppercase">{item.name}</span><span className="text-[7px] font-bold text-slate-400 uppercase">Mínimo: {item.minStock}</span></div></TableCell>
                                <TableCell className="text-center font-black text-[#9f2241] text-lg">{item.stock}</TableCell>
                                <TableCell className="text-right pr-8">
                                  <div className="flex justify-end gap-1">
                                    <button onClick={() => handleEditItem(item)} className="h-8 w-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary/5 transition-colors"><Pencil className="h-4 w-4" /></button>
                                    <button onClick={() => handleDeleteItem(item.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  )}

                  {currentView === 'proveedores' && (
                    <div className="h-full border border-slate-100 rounded-[2rem] bg-white shadow-xl overflow-hidden">
                      <ScrollArea className="h-full">
                        <Table>
                          <TableHeader className="bg-slate-50 border-b sticky top-0 z-10">
                            <TableRow className="h-10">
                              <TableHead className="font-black text-[9px] uppercase pl-8">Empresa</TableHead>
                              <TableHead className="font-black text-[9px] uppercase">Contacto / Teléfono</TableHead>
                              <TableHead className="text-right font-black text-[9px] uppercase pr-10">Gestión</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredProviders.map((p) => (
                              <TableRow key={p.id} className="h-14 border-b border-slate-50 hover:bg-slate-50">
                                <TableCell className="pl-8 font-black text-slate-700 text-xs uppercase">{p.name}</TableCell>
                                <TableCell className="font-bold text-slate-500 text-[10px] uppercase">{p.contact} • {p.phone}</TableCell>
                                <TableCell className="text-right pr-8">
                                  <div className="flex justify-end gap-1">
                                    <button onClick={() => handleEditProvider(p)} className="h-8 w-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary/5"><Pencil className="h-4 w-4" /></button>
                                    <button onClick={() => handleDeleteProvider(p.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-rose-300 hover:text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  )}

                  {currentView === 'usuarios' && (
                    <div className="h-full border border-slate-100 rounded-[2rem] bg-white shadow-xl overflow-hidden">
                      <ScrollArea className="h-full">
                        <Table>
                          <TableHeader className="bg-slate-50 border-b sticky top-0 z-10">
                            <TableRow className="h-10">
                              <TableHead className="font-black text-[9px] uppercase pl-8">Oficina / Área Central</TableHead>
                              <TableHead className="font-black text-[9px] uppercase">Ubicación Jerárquica</TableHead>
                              <TableHead className="font-black text-[9px] uppercase text-center">Estatus</TableHead>
                              <TableHead className="text-right font-black text-[9px] uppercase pr-10">Gestión</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredUsers.map((u) => (
                              <TableRow key={u.id} className="h-14 border-b border-slate-50 hover:bg-slate-50">
                                <TableCell className="pl-8 font-black text-slate-700 text-[11px] uppercase">{u.name}</TableCell>
                                <TableCell className="font-bold text-slate-400 text-[10px] uppercase">{u.location}</TableCell>
                                <TableCell className="text-center">
                                  <Badge className={cn("text-[7px] font-black uppercase h-4 px-2", u.status === 'Activo' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                                    {u.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right pr-8">
                                  <div className="flex justify-end gap-1">
                                    <button onClick={() => handleEditUser(u)} className="h-8 w-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary/5"><Pencil className="h-4 w-4" /></button>
                                    <button onClick={() => handleDeleteUser(u.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-rose-300 hover:text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  )}

                  {currentView === 'entradas' && (
                    <div className="h-full border border-slate-100 rounded-[2rem] bg-white shadow-xl overflow-hidden">
                      <ScrollArea className="h-full">
                        <Table>
                          <TableHeader className="bg-slate-900 border-b sticky top-0 z-10 shadow-lg">
                            <TableRow className="h-10">
                              <TableHead className="font-black text-[8px] uppercase text-white pl-6">Fecha</TableHead>
                              <TableHead className="font-black text-[8px] uppercase text-white">N_Doc</TableHead>
                              <TableHead className="font-black text-[8px] uppercase text-white">Proveedor</TableHead>
                              <TableHead className="font-black text-[8px] uppercase text-white">Código</TableHead>
                              <TableHead className="font-black text-[8px] uppercase text-white">Categoría</TableHead>
                              <TableHead className="font-black text-[8px] uppercase text-white">Nombre Producto</TableHead>
                              <TableHead className="font-black text-[8px] uppercase text-white">U. Medida</TableHead>
                              <TableHead className="font-black text-[8px] uppercase text-white">Observación</TableHead>
                              <TableHead className="font-black text-[8px] uppercase text-white text-center">Cantidad</TableHead>
                              <TableHead className="text-right font-black text-[8px] uppercase text-white pr-6">Acción</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredMovements.length > 0 ? filteredMovements.map((move) => (
                              <TableRow key={move.id} className="h-12 border-b border-slate-50 hover:bg-slate-50 group">
                                <TableCell className="pl-6 text-[8px] font-black text-slate-500 uppercase">{move.date}</TableCell>
                                <TableCell className="font-mono text-[9px] font-black text-primary uppercase">{move.folio || '-'}</TableCell>
                                <TableCell className="text-[9px] font-bold text-slate-600 uppercase">{move.provider}</TableCell>
                                <TableCell className="font-mono text-[8px] font-bold text-slate-400">{move.itemCode || '-'}</TableCell>
                                <TableCell className="text-[8px] font-black uppercase text-accent">{move.category}</TableCell>
                                <TableCell className="text-[10px] font-black text-slate-700 uppercase">{move.itemName}</TableCell>
                                <TableCell className="text-[8px] font-bold text-slate-500 uppercase">{move.unit}</TableCell>
                                <TableCell className="text-[8px] font-medium text-slate-400 uppercase italic truncate max-w-[150px]">{move.reason}</TableCell>
                                <TableCell className="text-center font-black text-xs text-primary">{move.quantity}</TableCell>
                                <TableCell className="text-right pr-6">
                                  <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditMovement(move)} className="h-6 w-6 rounded-md flex items-center justify-center text-primary hover:bg-primary/5"><Pencil className="h-3 w-3" /></button>
                                    <button onClick={() => handleDeleteMovement(move.id)} className="h-6 w-6 rounded-md flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50"><Trash2 className="h-3 w-3" /></button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )) : (
                              <TableRow><TableCell colSpan={10} className="text-center py-20 opacity-20 text-[10px] font-black uppercase">Sin registros de entrada</TableCell></TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  )}

                  {currentView === 'salidas' && (
                    <div className="h-full border border-slate-100 rounded-[2rem] bg-white shadow-xl overflow-hidden">
                      <ScrollArea className="h-full">
                        <Table>
                          <TableHeader className="bg-slate-900 border-b sticky top-0 z-10 shadow-lg">
                            <TableRow className="h-10">
                              <TableHead className="font-black text-[8px] uppercase text-white pl-6">Fecha</TableHead>
                              <TableHead className="font-black text-[8px] uppercase text-white">Insumo</TableHead>
                              <TableHead className="font-black text-[8px] uppercase text-white">Técnico / Responsable</TableHead>
                              <TableHead className="font-black text-[8px] uppercase text-white">Destino / Área</TableHead>
                              <TableHead className="font-black text-[8px] uppercase text-white">Motivo</TableHead>
                              <TableHead className="text-center font-black text-[8px] uppercase text-white">Cant.</TableHead>
                              <TableHead className="text-right font-black text-[8px] uppercase text-white pr-6">Acción</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredMovements.length > 0 ? filteredMovements.map((move) => (
                              <TableRow key={move.id} className="h-12 border-b border-slate-50 hover:bg-slate-50 group">
                                <TableCell className="pl-6 text-[8px] font-black text-slate-500 uppercase">{move.date}</TableCell>
                                <TableCell className="text-[10px] font-black text-slate-700 uppercase">{move.itemName}</TableCell>
                                <TableCell className="text-[9px] font-bold text-slate-600 uppercase">{move.technician}</TableCell>
                                <TableCell className="text-[9px] font-black text-primary uppercase">{move.cct || '-'}</TableCell>
                                <TableCell className="text-[8px] font-medium text-slate-400 uppercase italic truncate max-w-[200px]">{move.reason}</TableCell>
                                <TableCell className="text-center font-black text-xs text-rose-600">{move.quantity}</TableCell>
                                <TableCell className="text-right pr-6">
                                  <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditMovement(move)} className="h-6 w-6 rounded-md flex items-center justify-center text-primary hover:bg-primary/5"><Pencil className="h-3 w-3" /></button>
                                    <button onClick={() => handleDeleteMovement(move.id)} className="h-6 w-6 rounded-md flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50"><Trash2 className="h-3 w-3" /></button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )) : (
                              <TableRow><TableCell colSpan={7} className="text-center py-20 opacity-20 text-[10px] font-black uppercase">Sin registros de salida</TableCell></TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  )}

                  {currentView === 'registro' && (
                    <div className="max-w-4xl mx-auto py-6 h-full overflow-hidden flex flex-col">
                      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl space-y-8 animate-in zoom-in-95 duration-500 overflow-hidden flex flex-col">
                        <div className="flex items-center gap-4 border-b pb-6 shrink-0 justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600"><ArrowLeftRight className="h-6 w-6" /></div>
                            <div>
                              <h3 className="text-xl font-black text-slate-800 uppercase leading-none">
                                {editingMovementId ? 'Editar Operación Técnica' : 'Registrar Operación Técnica'}
                              </h3>
                              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Auditoría y Flujo de Suministros</p>
                            </div>
                          </div>
                          {editingMovementId && (
                            <Badge className="bg-amber-500 text-white font-black uppercase px-4 h-8 rounded-xl shadow-lg flex items-center gap-2">
                              <RotateCcw className="h-3.5 w-3.5" /> Modo Edición
                            </Badge>
                          )}
                        </div>

                        <ScrollArea className="flex-1 pr-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-primary uppercase pl-1">1. Seleccionar Insumo del Catálogo</Label>
                              <Select value={movementForm.itemId} onValueChange={v => setMovementForm({...movementForm, itemId: v})}>
                                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold uppercase text-[11px] shadow-inner"><SelectValue placeholder="BUSCAR INSUMO..." /></SelectTrigger>
                                <SelectContent className="rounded-xl shadow-2xl z-[300]">{items.map(i => (<SelectItem key={i.id} value={i.id} className="text-[10px] font-bold uppercase">{i.name} ({i.stock} EN STOCK)</SelectItem>))}</SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-primary uppercase pl-1">2. Tipo de Movimiento</Label>
                              <div className="flex gap-3">
                                <button onClick={() => setMovementForm({...movementForm, type: 'entrada'})} className={cn("flex-1 h-12 rounded-xl border-2 flex items-center justify-center gap-2 font-black text-[10px] uppercase transition-all", movementForm.type === 'entrada' ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md" : "bg-white border-slate-100 text-slate-300")}>
                                  <ArrowUpRight className="h-5 w-5" /> Entrada
                                </button>
                                <button onClick={() => setMovementForm({...movementForm, type: 'salida'})} className={cn("flex-1 h-12 rounded-xl border-2 flex items-center justify-center gap-2 font-black text-[10px] uppercase transition-all", movementForm.type === 'salida' ? "bg-rose-50 border-rose-500 text-rose-700 shadow-md" : "bg-white border-slate-100 text-slate-300")}>
                                  <ArrowDownRight className="h-5 w-5" /> Salida
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <Label className="text-[10px] font-black text-primary uppercase pl-1">{movementForm.type === 'entrada' ? 'Folio Factura / N_Doc' : 'Folio de Salida'}</Label>
                                  <Input placeholder="EJ. 001/2026" className="h-11 rounded-xl bg-slate-50 border-none font-mono font-black text-center shadow-inner uppercase" value={movementForm.folio} onChange={e => setMovementForm({...movementForm, folio: e.target.value})} />
                               </div>
                               <div className="space-y-2">
                                  <Label className="text-[10px] font-black text-primary uppercase pl-1">Unidad de Medida</Label>
                                  <Select value={movementForm.unit} onValueChange={v => setMovementForm({...movementForm, unit: v})}>
                                     <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold uppercase text-[10px] shadow-inner"><SelectValue /></SelectTrigger>
                                     <SelectContent className="z-[300]">
                                        <SelectItem value="PZA" className="text-[10px] font-bold">PIEZA (PZA)</SelectItem>
                                        <SelectItem value="MTS" className="text-[10px] font-bold">METROS (MTS)</SelectItem>
                                        <SelectItem value="KITS" className="text-[10px] font-bold">KITS (KITS)</SelectItem>
                                        <SelectItem value="PAQ" className="text-[10px] font-bold">PAQUETE (PAQ)</SelectItem>
                                        <SelectItem value="CAJA" className="text-[10px] font-bold">CAJA (CAJA)</SelectItem>
                                     </SelectContent>
                                  </Select>
                               </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-primary uppercase pl-1">Cantidad Operada</Label>
                              <Input type="number" min={1} className="h-11 rounded-xl bg-slate-50 border-none text-center font-black text-2xl shadow-inner text-primary" value={movementForm.quantity} onChange={e => setMovementForm({...movementForm, quantity: parseInt(e.target.value) || 0})} />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-primary uppercase pl-1">Analista / Técnico Responsable</Label>
                              <Input placeholder="NOMBRE COMPLETO..." className="h-11 rounded-xl bg-slate-50 border-none font-bold uppercase text-[10px] shadow-inner" value={movementForm.technician} onChange={e => setMovementForm({...movementForm, technician: e.target.value})} />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-primary uppercase pl-1">{movementForm.type === 'entrada' ? 'Origen / Área' : 'Destino (Área / CCT)'}</Label>
                              <Input placeholder="EJ. OFICINA REGIONAL / ÁREA CENTRAL..." className="h-11 rounded-xl bg-slate-50 border-none font-black text-center shadow-inner uppercase text-[10px]" value={movementForm.cct} onChange={e => setMovementForm({...movementForm, cct: e.target.value.toUpperCase()})} />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                              <Label className="text-[10px] font-black text-primary uppercase pl-1">{movementForm.type === 'entrada' ? 'Observaciones de Compra/Ingreso' : 'Motivo de Salida / Entrega'}</Label>
                              <Input placeholder="DESCRIPCIÓN DETALLADA DEL MOVIMIENTO..." className="h-11 rounded-xl bg-slate-50 border-none font-bold uppercase text-[10px] shadow-inner" value={movementForm.reason} onChange={e => setMovementForm({...movementForm, reason: e.target.value})} />
                            </div>
                          </div>
                        </ScrollArea>

                        <div className="flex gap-4 shrink-0 mt-4">
                          {editingMovementId && (
                            <Button variant="ghost" onClick={() => { setEditingMovementId(null); setMovementForm({ itemId: '', folio: '', unit: 'PZA', type: 'entrada', quantity: 1, reason: '', technician: '', cct: '' }); setCurrentView(movementForm.type === 'entrada' ? 'entradas' : 'salidas'); }} className="h-16 px-10 rounded-2xl font-bold uppercase text-xs">Cancelar</Button>
                          )}
                          <Button onClick={handleRegisterMovement} className="flex-1 btn-institutional h-16 rounded-2xl shadow-xl text-[12px] gap-3">
                            <CheckCircle2 className="h-5 w-5" /> {editingMovementId ? 'ACTUALIZAR REGISTRO TÉCNICO' : 'PROCESAR MOVIMIENTO INSTITUCIONAL'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO: AGREGAR/EDITAR INSUMO */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-0 overflow-hidden bg-white border-none shadow-2xl z-[150]">
          <DialogHeader className="p-8 bg-[#B38E5D] text-white">
            <DialogTitle className="font-black text-xl uppercase flex items-center gap-3"><PlusCircle className="h-6 w-6" /> {editingItemId ? 'Actualizar Insumo' : 'Nuevo Registro de Insumo'}</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase">Código Interno</Label>
                   <Input className="h-11 font-mono font-black uppercase text-xs" value={newItemForm.code} onChange={e => setNewItemForm({...newItemForm, code: e.target.value})} placeholder="EJ. UTP-001" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Categoría</Label>
                  <Select value={newItemForm.category} onValueChange={(val: any) => setNewItemForm({...newItemForm, category: val})}>
                    <SelectTrigger className="h-11 font-bold uppercase text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[300]"><SelectItem value="Cómputo">CÓMPUTO</SelectItem><SelectItem value="Redes">REDES</SelectItem><SelectItem value="Herramientas">HERRAMIENTAS</SelectItem><SelectItem value="Consumibles">CONSUMIBLES</SelectItem></SelectContent>
                  </Select>
                </div>
             </div>
             <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Descripción del Producto</Label><Input className="h-12 font-black uppercase text-xs" value={newItemForm.name} onChange={e => setNewItemForm({...newItemForm, name: e.target.value})} /></div>
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Existencia Inicial</Label><Input type="number" className="h-11 text-center font-black" value={newItemForm.stock} onChange={e => setNewItemForm({...newItemForm, stock: parseInt(e.target.value) || 0})} /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Stock Mínimo</Label><Input type="number" className="h-11 text-center font-black" value={newItemForm.minStock} onChange={e => setNewItemForm({...newItemForm, minStock: parseInt(e.target.value) || 0})} /></div>
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Proveedor Recomendado</Label>
                <Select value={newItemForm.provider} onValueChange={v => setNewItemForm({...newItemForm, provider: v})}>
                   <SelectTrigger className="h-11 font-bold uppercase text-[10px]"><SelectValue /></SelectTrigger>
                   <SelectContent className="z-[300]">{providers.map(p => (<SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>))}</SelectContent>
                </Select>
             </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t"><Button onClick={handleSaveItem} className="btn-institutional h-12 px-12 text-[11px] shadow-2xl w-full">Confirmar Registro</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO: AGREGAR/EDITAR PROVEEDOR */}
      <Dialog open={isAddProviderDialogOpen} onOpenChange={setIsAddProviderDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-0 overflow-hidden bg-white border-none shadow-2xl z-[150]">
          <DialogHeader className="p-8 bg-indigo-600 text-white">
             <DialogTitle className="font-black text-xl uppercase flex items-center gap-3"><Truck className="h-6 w-6" /> {editingProviderId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-5">
             <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Empresa</Label><Input className="h-11 font-black uppercase text-xs" value={newProviderForm.name} onChange={e => setNewProviderForm({...newProviderForm, name: e.target.value})} /></div>
             <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Contacto</Label><Input className="h-11 font-bold uppercase text-xs" value={newProviderForm.contact} onChange={e => setNewProviderForm({...newProviderForm, contact: e.target.value})} /></div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Teléfono</Label><Input className="h-11 font-mono text-xs" value={newProviderForm.phone} onChange={e => setNewProviderForm({...newProviderForm, phone: e.target.value})} /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Categoría</Label><Input className="h-11 font-bold uppercase text-[10px]" value={newProviderForm.category} onChange={e => setNewProviderForm({...newProviderForm, category: e.target.value})} /></div>
             </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t"><Button onClick={handleSaveProvider} className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-2xl text-[11px] font-black uppercase w-full">Guardar Proveedor</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO: AGREGAR/EDITAR USUARIO (ÁREA/OFICINA) */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-0 overflow-hidden bg-white border-none shadow-2xl z-[150]">
          <DialogHeader className="p-8 bg-rose-600 text-white">
             <DialogTitle className="font-black text-xl uppercase flex items-center gap-3">
               <ShieldCheck className="h-8 w-8 text-accent" /> {editingUserId ? 'Editar Área Institucional' : 'Alta de Nueva Área'}
             </DialogTitle>
             <DialogDescription className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-2">Control de destinatarios y responsables técnicos</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
             <div className="space-y-2">
                <Label className="text-[10px] font-black text-primary uppercase pl-1">Nombre de la Oficina o Área</Label>
                <div className="relative">
                   <Input className="h-12 rounded-2xl bg-slate-50 border-none shadow-inner font-black uppercase text-xs pl-10" value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value.toUpperCase()})} placeholder="EJ. OFICINA REGIONAL TOLUCA..." />
                   <Building2 className="absolute left-3 top-3.5 h-5 w-5 text-slate-300" />
                </div>
             </div>
             <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-primary uppercase pl-1">Ubicación Jerárquica</Label>
                  <Select value={newUserForm.location} onValueChange={(val: any) => setNewUserForm({...newUserForm, location: val})}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none shadow-inner font-bold uppercase text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-2xl z-[300]">
                      <SelectItem value="Regional" className="text-[10px] font-bold">REGIONAL</SelectItem>
                      <SelectItem value="Central (Toluca)" className="text-[10px] font-bold">CENTRAL (TOLUCA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-primary uppercase pl-1">Estatus Operativo</Label>
                  <Select value={newUserForm.status} onValueChange={(val: any) => setNewUserForm({...newUserForm, status: val})}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none shadow-inner font-bold uppercase text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-2xl z-[300]">
                      <SelectItem value="Activo" className="text-[10px] font-bold text-emerald-600">ACTIVO</SelectItem>
                      <SelectItem value="Inactivo" className="text-[10px] font-bold text-rose-600">INACTIVO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t gap-3">
             <Button variant="ghost" onClick={() => setIsAddUserDialogOpen(false)} className="h-12 px-6 text-[11px] font-black uppercase text-slate-400">Cancelar</Button>
             <Button onClick={handleSaveUser} className="bg-rose-600 hover:bg-rose-700 text-white h-12 px-10 rounded-2xl text-[11px] font-black uppercase shadow-xl gap-2">
               <Save className="h-4 w-4" /> {editingUserId ? 'Confirmar Cambios' : 'Registrar Área'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
