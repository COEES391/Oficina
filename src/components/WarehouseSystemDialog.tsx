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
  ShieldCheck
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

type WarehouseUser = {
  id: string;
  name: string;
  location: 'Regional' | 'Central (Toluca)';
  status: 'Activo' | 'Inactivo';
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
  
  const [mounted, setMounted] = useState(false)

  const [newItemForm, setNewItemForm] = useState({
    name: '',
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
        (item.category || '').toLowerCase().includes(term)
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
    if (currentView === 'entradas') return movements.filter(m => m.type === 'entrada')
    if (currentView === 'salidas') return movements.filter(m => m.type === 'salida')
    return movements
  }, [movements, currentView])

  // PRODUCT LOGIC
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
    if (!newItemForm.name) return
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
    const newStock = movementForm.type === 'entrada' ? item.stock + movementForm.quantity : item.stock - movementForm.quantity
    updatedItems[itemIndex] = { ...item, stock: newStock, lastUpdated: new Date().toISOString() }
    const updatedMoves = [newMovement, ...movements]
    setItems(updatedItems)
    setMovements(updatedMoves)
    localStorage.setItem('coees_warehouse_items_v4', JSON.stringify(updatedItems))
    localStorage.setItem('coees_warehouse_moves_v4', JSON.stringify(updatedMoves))
    setMovementForm({ itemId: '', type: 'entrada', quantity: 1, reason: '', technician: '', cct: '' })
    toast({ title: "Movimiento registrado" })
  }

  const NavigationButton = ({ icon: Icon, label, target, color }: { icon: any, label: string, target: any, color: string }) => (
    <button 
      onClick={() => { setCurrentView(target); setSearchTerm(''); }}
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
                <div className="p-6 pb-4 flex items-center justify-between bg-white border-b shrink-0">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentView('dashboard')} className="h-10 px-4 rounded-xl border border-slate-200 text-slate-400 hover:text-primary font-black text-[10px] uppercase flex items-center gap-2"><ChevronLeft className="h-4 w-4" /> Volver al Inicio</button>
                    <div className="h-6 w-px bg-slate-200" />
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">
                       {currentView === 'productos' && 'Gestión de Productos e Insumos'}
                       {currentView === 'proveedores' && 'Directorio de Proveedores'}
                       {currentView === 'usuarios' && 'Base de Usuarios Institucionales'}
                       {currentView === 'entradas' && 'Bitácora de Entradas'}
                       {currentView === 'salidas' && 'Bitácora de Salidas'}
                       {currentView === 'registro' && 'Registrar Operación'}
                    </h3>
                  </div>
                  
                  {(currentView === 'productos' || currentView === 'proveedores' || currentView === 'usuarios') && (
                    <div className="flex gap-3">
                      <div className="relative w-64 group">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-300 group-focus-within:text-primary" />
                        <Input placeholder="FILTRAR..." className="h-9 pl-9 rounded-xl border-slate-100 bg-slate-50 text-[10px] font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                      </div>
                      <Button onClick={() => {
                        if (currentView === 'productos') { setEditingItemId(null); setIsAddDialogOpen(true); }
                        if (currentView === 'proveedores') { setEditingProviderId(null); setIsAddProviderDialogOpen(true); }
                        if (currentView === 'usuarios') { setEditingUserId(null); setNewUserForm({name: '', location: 'Regional', status: 'Activo'}); setIsAddUserDialogOpen(true); }
                      }} className="btn-institutional h-9 px-4 rounded-xl text-[9px] gap-2">
                        <PlusCircle className="h-3.5 w-3.5" /> 
                        {currentView === 'productos' ? 'Nuevo Insumo' : currentView === 'proveedores' ? 'Nuevo Proveedor' : 'Nuevo Usuario'}
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
                              <TableHead className="text-right font-black text-[9px] uppercase pr-10">Gestión</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredItems.map((item) => (
                              <TableRow key={item.id} className="hover:bg-slate-50 h-14 border-b border-slate-50">
                                <TableCell className="pl-8"><Badge variant="outline" className="font-black text-[7px] uppercase px-2 h-4">{item.category}</Badge></TableCell>
                                <TableCell><div className="flex flex-col"><span className="text-[12px] font-black text-slate-700 uppercase">{item.name}</span><span className="text-[7px] font-bold text-slate-400 uppercase">Mínimo: {item.minStock}</span></div></TableCell>
                                <TableCell className="text-center font-black text-[#9f2241] text-lg">{item.stock}</TableCell>
                                <TableCell className="text-right pr-8">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleEditItem(item)}><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300" onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
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
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleEditProvider(p)}><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300" onClick={() => handleDeleteProvider(p.id)}><Trash2 className="h-4 w-4" /></Button>
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
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5" onClick={() => handleEditUser(u)}><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300 hover:text-rose-600" onClick={() => handleDeleteUser(u.id)}><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  )}

                  {(currentView === 'entradas' || currentView === 'salidas') && (
                    <div className="h-full border border-slate-100 rounded-[2rem] bg-white shadow-xl overflow-hidden">
                      <ScrollArea className="h-full">
                        <Table>
                          <TableHeader className="bg-slate-50 border-b sticky top-0 z-10"><TableRow className="h-10"><TableHead className="font-black text-[9px] uppercase pl-8">Fecha</TableHead><TableHead className="font-black text-[9px] uppercase">Insumo</TableHead><TableHead className="font-black text-[9px] uppercase">Técnico / Origen</TableHead><TableHead className="text-center font-black text-[9px] uppercase pr-8">Cant.</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {filteredMovements.map((move) => (
                              <TableRow key={move.id} className="h-14 border-b border-slate-50">
                                <TableCell className="pl-8 text-[8px] font-black text-slate-400 uppercase">{move.date}</TableCell>
                                <TableCell className="text-[11px] font-black text-slate-700 uppercase">{move.itemName}</TableCell>
                                <TableCell className="text-[10px] font-bold text-slate-600 uppercase">{move.technician} {move.cct && `(${move.cct})`}</TableCell>
                                <TableCell className="text-center pr-8 font-black text-xs text-primary">{move.quantity}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  )}

                  {currentView === 'registro' && (
                    <div className="max-w-4xl mx-auto py-10 h-full overflow-hidden flex flex-col">
                      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl space-y-10 animate-in zoom-in-95 duration-500 overflow-hidden flex flex-col">
                        <div className="flex items-center gap-5 border-b pb-8 shrink-0">
                          <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600"><ArrowLeftRight className="h-8 w-8" /></div>
                          <div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase leading-none">Registrar Operación</h3>
                            <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Actualización de flujo técnico institucional</p>
                          </div>
                        </div>

                        <ScrollArea className="flex-1 pr-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-3">
                              <Label className="text-[11px] font-black text-primary uppercase pl-2">1. Seleccionar Insumo</Label>
                              <Select value={movementForm.itemId} onValueChange={v => setMovementForm({...movementForm, itemId: v})}>
                                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold uppercase text-[12px] shadow-inner"><SelectValue placeholder="BUSCAR INSUMO..." /></SelectTrigger>
                                <SelectContent className="rounded-2xl shadow-2xl z-[300]">{items.map(i => (<SelectItem key={i.id} value={i.id} className="text-[11px] font-bold uppercase">{i.name} ({i.stock} DISP.)</SelectItem>))}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-3">
                              <Label className="text-[11px] font-black text-primary uppercase pl-2">2. Tipo de Movimiento</Label>
                              <div className="flex gap-4">
                                <button onClick={() => setMovementForm({...movementForm, type: 'entrada'})} className={cn("flex-1 h-14 rounded-2xl border-2 flex items-center justify-center gap-3 font-black text-[12px] uppercase transition-all", movementForm.type === 'entrada' ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg" : "bg-white border-slate-100 text-slate-400")}>
                                  <ArrowUpRight className="h-6 w-6" /> Requisición
                                </button>
                                <button onClick={() => setMovementForm({...movementForm, type: 'salida'})} className={cn("flex-1 h-14 rounded-2xl border-2 flex items-center justify-center gap-3 font-black text-[12px] uppercase transition-all", movementForm.type === 'salida' ? "bg-rose-50 border-rose-500 text-rose-700 shadow-lg" : "bg-white border-slate-100 text-slate-400")}>
                                  <ArrowDownRight className="h-6 w-6" /> Entrega
                                </button>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <Label className="text-[11px] font-black text-primary uppercase pl-2">3. Cantidad</Label>
                              <Input type="number" min={1} className="h-14 rounded-2xl bg-slate-50 border-none text-center font-black text-3xl shadow-inner" value={movementForm.quantity} onChange={e => setMovementForm({...movementForm, quantity: parseInt(e.target.value) || 0})} />
                            </div>
                            <div className="space-y-3">
                              <Label className="text-[11px] font-black text-primary uppercase pl-2">4. Analista / Técnico</Label>
                              <Input placeholder="NOMBRE COMPLETO..." className="h-14 rounded-2xl bg-slate-50 border-none font-bold uppercase text-[12px] shadow-inner" value={movementForm.technician} onChange={e => setMovementForm({...movementForm, technician: e.target.value})} />
                            </div>
                            <div className="space-y-3">
                              <Label className="text-[11px] font-black text-primary uppercase pl-2">5. Destino (Área / CCT)</Label>
                              <Input placeholder="EJ. OFICINA REGIONAL / 15DES..." className="h-14 rounded-2xl bg-slate-50 border-none font-black text-center shadow-inner uppercase" value={movementForm.cct} onChange={e => setMovementForm({...movementForm, cct: e.target.value.toUpperCase()})} />
                            </div>
                            <div className="space-y-3">
                              <Label className="text-[11px] font-black text-primary uppercase pl-2">6. Motivo del Movimiento</Label>
                              <Input placeholder="EJ. ACTUALIZACIÓN BRIGADA..." className="h-14 rounded-2xl bg-slate-50 border-none font-bold uppercase text-[12px] shadow-inner" value={movementForm.reason} onChange={e => setMovementForm({...movementForm, reason: e.target.value})} />
                            </div>
                          </div>
                        </ScrollArea>

                        <Button onClick={handleRegisterMovement} className="w-full btn-institutional h-20 rounded-3xl shadow-2xl text-base gap-4 shrink-0 mt-8">
                          <Save className="h-7 w-7" /> PROCESAR OPERACIÓN
                        </Button>
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
             <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Descripción</Label><Input className="h-12 font-black uppercase text-xs" value={newItemForm.name} onChange={e => setNewItemForm({...newItemForm, name: e.target.value})} /></div>
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Categoría</Label>
                  <Select value={newItemForm.category} onValueChange={(val: any) => setNewItemForm({...newItemForm, category: val})}>
                    <SelectTrigger className="h-11 font-bold uppercase text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[300]"><SelectItem value="Cómputo">CÓMPUTO</SelectItem><SelectItem value="Redes">REDES</SelectItem><SelectItem value="Herramientas">HERRAMIENTAS</SelectItem><SelectItem value="Consumibles">CONSUMIBLES</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Mínimo</Label><Input type="number" className="h-11 text-center font-black" value={newItemForm.minStock} onChange={e => setNewItemForm({...newItemForm, minStock: parseInt(e.target.value) || 0})} /></div>
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Proveedor</Label>
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
