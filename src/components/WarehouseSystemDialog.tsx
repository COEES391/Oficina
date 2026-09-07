
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
import { Textarea } from '@/components/ui/textarea'
import * as XLSX from 'xlsx'
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
  Pencil,
  Truck,
  Users,
  ShoppingBag,
  HandCoins,
  ChevronLeft,
  RotateCcw,
  FileSpreadsheet,
  AlertCircle,
  Calendar,
  FileText,
  ClipboardList,
  User,
  Settings2,
  Loader2,
  Eraser,
  FileSearch,
  LogOut,
  MinusCircle,
  Building2,
  Mail,
  Phone,
  UserPlus
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'

type WarehouseItem = {
  id: string; name: string; code?: string; category: 'Cómputo' | 'Redes' | 'Herramientas' | 'Consumibles';
  stock: number; minStock: number; lastUpdated: any; provider?: string;
}

type WarehouseMovement = {
  id: string; itemId: string; itemName: string; itemCode?: string; category?: string; unit?: string;
  type: 'entrada' | 'salida'; quantity: number; date: string; folio?: string; provider?: string;
  reason: string; technician: string; cct?: string;
}

type Provider = { id: string; name: string; contact: string; phone: string; email: string; address: string; }
type WarehouseUser = { id: string; name: string; area: string; office: string; }

export function WarehouseSystemDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast()
  const [currentView, setCurrentView] = useState<'dashboard' | 'productos' | 'proveedores' | 'usuarios' | 'entradas' | 'salidas' | 'reg_entrada' | 'reg_salida'>('dashboard')
  const [items, setItems] = useState<WarehouseItem[]>([])
  const [movements, setMovements] = useState<WarehouseMovement[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [warehouseUsers, setWarehouseUsers] = useState<WarehouseUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddProviderOpen, setIsAddProviderOpen] = useState(false)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const [newItemForm, setNewItemForm] = useState({
    name: '', code: '', category: 'Cómputo' as WarehouseItem['category'], stock: 0, minStock: 5, provider: ''
  })

  const [providerForm, setProviderForm] = useState({
    name: '', contact: '', phone: '', email: '', address: ''
  })

  const [clientForm, setClientForm] = useState({
    name: '', area: '', office: ''
  })

  const [movementForm, setMovementForm] = useState({
    itemId: '', folio: '', unit: 'PZA', type: 'entrada' as 'entrada' | 'salida', quantity: 1, reason: '', technician: '', cct: '', provider: ''
  })

  useEffect(() => {
    setMounted(true)
    if (!open) return

    setIsLoading(true)
    
    const itemsUnsubscribe = onSnapshot(collection(db, 'warehouse_items'), (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as WarehouseItem[])
    })

    const movesUnsubscribe = onSnapshot(query(collection(db, 'warehouse_movements'), orderBy('updatedAt', 'desc')), (snapshot) => {
      setMovements(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as WarehouseMovement[])
      setIsLoading(false)
    })

    const provUnsubscribe = onSnapshot(collection(db, 'warehouse_providers'), (snapshot) => {
      setProviders(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Provider[])
    })

    const usersUnsubscribe = onSnapshot(collection(db, 'warehouse_clients'), (snapshot) => {
      setWarehouseUsers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as WarehouseUser[])
    })

    return () => { 
      itemsUnsubscribe(); 
      movesUnsubscribe(); 
      provUnsubscribe(); 
      usersUnsubscribe(); 
    }
  }, [open])

  const filteredItems = useMemo(() => {
    let list = [...items];
    if (searchTerm && currentView === 'productos') {
      const term = searchTerm.toLowerCase();
      list = list.filter(item => (item.name || '').toLowerCase().includes(term) || (item.code || '').toLowerCase().includes(term))
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [items, searchTerm, currentView])

  const filteredMovements = useMemo(() => {
    const type = currentView === 'entradas' ? 'entrada' : 'salida';
    let list = movements.filter(m => m.type === type);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(m => (m.itemName || '').toLowerCase().includes(term) || (m.folio || '').toLowerCase().includes(term));
    }
    return list;
  }, [movements, searchTerm, currentView]);

  const filteredProviders = useMemo(() => {
    let list = [...providers];
    if (searchTerm && currentView === 'proveedores') {
      const term = searchTerm.toLowerCase();
      list = list.filter(p => (p.name || '').toLowerCase().includes(term) || (p.contact || '').toLowerCase().includes(term));
    }
    return list;
  }, [providers, searchTerm, currentView]);

  const filteredUsers = useMemo(() => {
    let list = [...warehouseUsers];
    if (searchTerm && currentView === 'usuarios') {
      const term = searchTerm.toLowerCase();
      list = list.filter(u => (u.name || '').toLowerCase().includes(term) || (u.office || '').toLowerCase().includes(term));
    }
    return list;
  }, [warehouseUsers, searchTerm, currentView]);

  const criticalItems = useMemo(() => items.filter(i => i.stock <= i.minStock), [items]);

  const handleRegisterMovement = async (type: 'entrada' | 'salida') => {
    const currentMovement = { ...movementForm, type };
    if (!currentMovement.itemId || !currentMovement.reason || currentMovement.quantity <= 0) {
      toast({ variant: "destructive", title: "Faltan campos técnicos" }); return;
    }
    
    const currentItem = items.find(i => i.id === currentMovement.itemId);
    if (!currentItem) return;

    if (type === 'salida' && currentItem.stock < currentMovement.quantity) {
      toast({ variant: "destructive", title: "Stock insuficiente para la entrega" }); return;
    }

    try {
      const moveData = {
        ...currentMovement,
        itemName: currentItem.name,
        itemCode: currentItem.code || 'S/C',
        category: currentItem.category,
        date: format(new Date(), 'dd/MM/yyyy'),
        updatedAt: serverTimestamp()
      }

      await addDoc(collection(db, 'warehouse_movements'), moveData);
      
      const newStock = type === 'entrada' ? currentItem.stock + currentMovement.quantity : currentItem.stock - currentMovement.quantity;
      await updateDoc(doc(db, 'warehouse_items', currentItem.id), { stock: newStock, lastUpdated: serverTimestamp() });

      toast({ title: "Movimiento Registrado", description: `Inventario actualizado: ${currentItem.name}` });
      setCurrentView(type === 'entrada' ? 'entradas' : 'salidas');
      setMovementForm({ itemId: '', folio: '', unit: 'PZA', type: 'entrada', quantity: 1, reason: '', technician: '', cct: '', provider: '' });
    } catch (e) {
      toast({ variant: "destructive", title: "Error de sincronización" });
    }
  }

  const handleSaveItem = async () => {
    if (!newItemForm.name) return;
    try {
      const data = { ...newItemForm, name: newItemForm.name.toUpperCase(), code: newItemForm.code.toUpperCase(), lastUpdated: serverTimestamp() };
      if (editingItemId) {
        await updateDoc(doc(db, 'warehouse_items', editingItemId), data);
      } else {
        await addDoc(collection(db, 'warehouse_items'), data);
      }
      setIsAddDialogOpen(false); setEditingItemId(null);
      toast({ title: "Producto Guardado" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al guardar" });
    }
  }

  const handleSaveProvider = async () => {
    if (!providerForm.name) return;
    try {
      await addDoc(collection(db, 'warehouse_providers'), { ...providerForm, name: providerForm.name.toUpperCase(), updatedAt: serverTimestamp() });
      setIsAddProviderOpen(false);
      setProviderForm({ name: '', contact: '', phone: '', email: '', address: '' });
      toast({ title: "Proveedor Registrado" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al guardar proveedor" });
    }
  }

  const handleSaveClient = async () => {
    if (!clientForm.name) return;
    try {
      await addDoc(collection(db, 'warehouse_clients'), { ...clientForm, name: clientForm.name.toUpperCase(), updatedAt: serverTimestamp() });
      setIsAddUserOpen(false);
      setClientForm({ name: '', area: '', office: '' });
      toast({ title: "Usuario Registrado" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al guardar usuario" });
    }
  }

  const downloadExcelInventory = () => {
    const data = items.map(i => ({
      Código: i.code || 'S/C',
      Categoría: i.category,
      Producto: i.name,
      Existencia: i.stock,
      'Mínimo': i.minStock,
      Estatus: i.stock <= 0 ? 'AGOTADO' : i.stock <= i.minStock ? 'STOCK BAJO' : 'OK'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario Maestro");
    XLSX.writeFile(wb, `Inventario_Técnico_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
  }

  const handleEditItem = (item: WarehouseItem) => {
    setNewItemForm({ name: item.name, code: item.code || '', category: item.category, stock: item.stock, minStock: item.minStock, provider: item.provider || '' });
    setEditingItemId(item.id);
    setIsAddDialogOpen(true);
  }

  if (!mounted) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1400px] h-[95vh] flex flex-col p-0 overflow-hidden rounded-[3rem] border-none shadow-2xl bg-[#f8f9fa]">
        <DialogHeader className="p-6 bg-[#9f2241] text-white shrink-0 flex flex-row justify-between items-center pr-12">
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-3">
              {currentView !== 'dashboard' && (
                <button onClick={() => setCurrentView('dashboard')} className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"><ChevronLeft className="h-6 w-6" /></button>
              )}
              <DialogTitle className="uppercase font-black text-2xl">CONTROL DE INVENTARIOS EN LA NUBE</DialogTitle>
            </div>
            <DialogDescription className="text-white/60 font-bold text-[10px] tracking-widest mt-1 uppercase">Sistema Integral de Abastecimiento Técnico • Auditoría 2026</DialogDescription>
          </div>
          <div className="flex items-center gap-4">
             {criticalItems.length > 0 && (
               <Badge className="bg-rose-500 text-white border-none animate-pulse px-4 py-1.5 rounded-full text-[9px] font-black shadow-lg">
                 <AlertCircle className="h-3 w-3 mr-2" /> {criticalItems.length} ALERTAS DE STOCK CRÍTICO
               </Badge>
             )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading && currentView !== 'dashboard' ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30">
               <Loader2 className="h-12 w-12 animate-spin text-primary" />
               <p className="text-[10px] font-black uppercase mt-4 tracking-widest">Sincronizando inventarios...</p>
            </div>
          ) : currentView === 'dashboard' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white/50 animate-in fade-in zoom-in-95 duration-500">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl w-full">
                  <button onClick={() => setCurrentView('productos')} className="flex flex-col items-center justify-center p-8 bg-white rounded-[2.5rem] border-2 border-slate-50 shadow-sm hover:shadow-2xl hover:scale-105 transition-all group">
                     <div className="h-20 w-20 rounded-[1.8rem] bg-blue-600 flex items-center justify-center text-white mb-5 shadow-xl group-hover:rotate-6 transition-transform"><Box className="h-10 w-10" /></div>
                     <span className="text-xs font-black uppercase text-slate-700 tracking-[0.15em]">PRODUCTOS</span>
                     <p className="text-[9px] font-bold text-slate-400 mt-2">CATÁLOGO MAESTRO</p>
                  </button>

                  <button onClick={() => { setMovementForm(prev => ({...prev, type: 'entrada'})); setCurrentView('reg_entrada'); }} className="flex flex-col items-center justify-center p-8 bg-white rounded-[2.5rem] border-2 border-slate-50 shadow-sm hover:shadow-2xl hover:scale-105 transition-all group">
                     <div className="h-20 w-20 rounded-[1.8rem] bg-[#621132] flex items-center justify-center text-white mb-5 shadow-xl group-hover:scale-110 transition-transform"><PlusCircle className="h-10 w-10" /></div>
                     <span className="text-xs font-black uppercase text-slate-700 tracking-[0.15em]">REQUISICIONES / ENTRADAS</span>
                     <p className="text-[9px] font-bold text-slate-400 mt-2">REGISTRAR INGRESO</p>
                  </button>

                  <button onClick={() => { setMovementForm(prev => ({...prev, type: 'salida'})); setCurrentView('reg_salida'); }} className="flex flex-col items-center justify-center p-8 bg-white rounded-[2.5rem] border-2 border-slate-50 shadow-sm hover:shadow-2xl hover:scale-105 transition-all group">
                     <div className="h-20 w-20 rounded-[1.8rem] bg-rose-600 flex items-center justify-center text-white mb-5 shadow-xl group-hover:scale-110 transition-transform"><MinusCircle className="h-10 w-10" /></div>
                     <span className="text-xs font-black uppercase text-slate-700 tracking-[0.15em]">ENTREGAS / SALIDAS</span>
                     <p className="text-[9px] font-bold text-slate-400 mt-2">REGISTRAR EGRESO</p>
                  </button>

                  <button onClick={() => setCurrentView('entradas')} className="flex flex-col items-center justify-center p-8 bg-white rounded-[2.5rem] border-2 border-slate-50 shadow-sm hover:shadow-2xl hover:scale-105 transition-all group">
                     <div className="h-20 w-20 rounded-[1.8rem] bg-emerald-600 flex items-center justify-center text-white mb-5 shadow-xl group-hover:translate-y-[-5px] transition-transform"><ArrowUpRight className="h-10 w-10" /></div>
                     <span className="text-xs font-black uppercase text-slate-700 tracking-[0.15em]">BITÁCORA ENTRADAS</span>
                     <p className="text-[9px] font-bold text-slate-400 mt-2">BASE DE DATOS</p>
                  </button>

                  <button onClick={() => setCurrentView('salidas')} className="flex flex-col items-center justify-center p-8 bg-white rounded-[2.5rem] border-2 border-slate-50 shadow-sm hover:shadow-2xl hover:scale-105 transition-all group">
                     <div className="h-20 w-20 rounded-[1.8rem] bg-amber-500 flex items-center justify-center text-white mb-5 shadow-xl group-hover:translate-y-[5px] transition-transform"><ArrowDownRight className="h-10 w-10" /></div>
                     <span className="text-xs font-black uppercase text-slate-700 tracking-[0.15em]">BITÁCORA SALIDAS</span>
                     <p className="text-[9px] font-bold text-slate-400 mt-2">BASE DE DATOS</p>
                  </button>

                  <button onClick={() => setCurrentView('proveedores')} className="flex flex-col items-center justify-center p-8 bg-white rounded-[2.5rem] border-2 border-slate-50 shadow-sm hover:shadow-2xl hover:scale-105 transition-all group">
                     <div className="h-20 w-20 rounded-[1.8rem] bg-slate-800 flex items-center justify-center text-white mb-5 shadow-xl"><Truck className="h-10 w-10" /></div>
                     <span className="text-xs font-black uppercase text-slate-700 tracking-[0.15em]">PROVEEDORES</span>
                     <p className="text-[9px] font-bold text-slate-400 mt-2">DIRECTORIO TÉCNICO</p>
                  </button>

                  <button onClick={() => setCurrentView('usuarios')} className="flex flex-col items-center justify-center p-8 bg-white rounded-[2.5rem] border-2 border-slate-50 shadow-sm hover:shadow-2xl hover:scale-105 transition-all group">
                     <div className="h-20 w-20 rounded-[1.8rem] bg-indigo-600 flex items-center justify-center text-white mb-5 shadow-xl"><Users className="h-10 w-10" /></div>
                     <span className="text-xs font-black uppercase text-slate-700 tracking-[0.15em]">USUARIOS ALMACÉN</span>
                     <p className="text-[9px] font-bold text-slate-400 mt-2">CLIENTES INTERNOS</p>
                  </button>
               </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
               {/* Barra de Herramientas Dinámica */}
               <div className="px-8 py-3 bg-slate-50 border-b flex items-center justify-between shadow-sm shrink-0">
                  <div className="flex gap-4">
                     {(currentView === 'reg_entrada' || currentView === 'reg_salida') && (
                       <Button onClick={() => handleRegisterMovement(currentView === 'reg_entrada' ? 'entrada' : 'salida')} className="btn-institutional h-10 px-8 text-[11px] gap-2 shadow-xl"><Save className="h-4 w-4" /> GUARDAR</Button>
                     )}
                     {currentView === 'proveedores' && (
                        <Button onClick={() => setIsAddProviderOpen(true)} className="btn-institutional h-10 px-6 rounded-xl text-[10px]"><UserPlus className="h-4 w-4 mr-2" /> NUEVO PROVEEDOR</Button>
                     )}
                     {currentView === 'usuarios' && (
                        <Button onClick={() => setIsAddUserOpen(true)} className="btn-institutional h-10 px-6 rounded-xl text-[10px]"><UserPlus className="h-4 w-4 mr-2" /> NUEVO USUARIO</Button>
                     )}
                     {currentView === 'productos' && (
                        <Button onClick={() => { setEditingItemId(null); setNewItemForm({name: '', code: '', category: 'Cómputo', stock: 0, minStock: 5, provider: ''}); setIsAddDialogOpen(true); }} className="btn-institutional h-10 px-8 rounded-xl text-[10px]"><PlusCircle className="h-4 w-4 mr-2" /> NUEVO INSUMO</Button>
                     )}
                     {['reg_entrada', 'reg_salida'].includes(currentView) && (
                       <Button variant="ghost" onClick={() => setMovementForm({ itemId: '', folio: '', unit: 'PZA', type: 'entrada', quantity: 1, reason: '', technician: '', cct: '', provider: '' })} className="h-10 px-6 rounded-xl text-slate-400 font-black uppercase text-[10px] gap-2"><Eraser className="h-4 w-4" /> LIMPIAR</Button>
                     )}
                  </div>
                  <Button variant="outline" onClick={() => setCurrentView('dashboard')} className="h-10 px-8 rounded-xl border-slate-200 text-slate-500 font-black uppercase text-[10px] gap-2 hover:bg-slate-100"><RotateCcw className="h-4 w-4" /> VOLVER AL MENÚ</Button>
               </div>

               {/* Barra de Búsqueda para Listados */}
               {['productos', 'entradas', 'salidas', 'proveedores', 'usuarios'].includes(currentView) && (
                 <div className="px-8 py-4 bg-white border-b flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
                    <div className="relative flex-1 w-full max-w-xl group">
                       <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                       <Input placeholder={`FILTRAR EN ${currentView.toUpperCase()}...`} className="h-11 pl-12 rounded-2xl bg-slate-50 border-none shadow-inner text-xs font-bold uppercase" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    {currentView === 'productos' && (
                       <Button onClick={downloadExcelInventory} variant="outline" className="h-11 px-6 rounded-2xl border-emerald-200 text-emerald-700 font-black uppercase text-[10px] gap-2 shadow-md hover:bg-emerald-50"><FileSpreadsheet className="h-4 w-4" /> EXPORTAR EXCEL</Button>
                    )}
                 </div>
               )}

               <ScrollArea className="flex-1">
                  <div className="p-8">
                     {currentView === 'productos' && (
                        <div className="space-y-6">
                           {criticalItems.length > 0 && (
                             <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-[2rem] flex items-center gap-6 shadow-sm animate-in slide-in-from-top duration-500">
                                <div className="h-12 w-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg"><AlertCircle className="h-6 w-6" /></div>
                                <div className="flex-1"><h4 className="text-[11px] font-black text-rose-700 uppercase tracking-widest">Insumos Críticos Detectados</h4><p className="text-[9px] font-bold text-rose-600/70 uppercase mt-1">Existen {criticalItems.length} productos agotados o por debajo del stock mínimo.</p></div>
                             </div>
                           )}
                           <Table className="bg-white rounded-[2rem] shadow-2xl border-none overflow-hidden">
                              <TableHeader className="bg-slate-50 border-b">
                                 <TableRow className="h-14">
                                    <TableHead className="pl-8 font-black text-[10px] uppercase text-primary w-24">CÓDIGO</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase text-primary">CATEGORÍA</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase text-primary">PRODUCTO / INSUMO</TableHead>
                                    <TableHead className="text-center font-black text-[10px] uppercase text-primary w-24">STOCK</TableHead>
                                    <TableHead className="text-center font-black text-[10px] uppercase text-primary w-32">ESTATUS</TableHead>
                                    <TableHead className="text-right pr-10 w-20"></TableHead>
                                 </TableRow>
                              </TableHeader>
                              <TableBody>
                                 {filteredItems.map(item => (
                                    <TableRow key={item.id} className="h-16 border-b border-slate-50 hover:bg-slate-50">
                                       <TableCell className="pl-8 font-mono font-black text-[11px] text-primary">{item.code || 'S/C'}</TableCell>
                                       <TableCell><Badge variant="outline" className="text-[9px] font-bold px-2 py-0.5 border-slate-200">{item.category}</Badge></TableCell>
                                       <TableCell className="font-black text-xs text-slate-700 uppercase">{item.name}</TableCell>
                                       <TableCell className="text-center"><span className={cn("text-xl font-black", item.stock <= 0 ? "text-rose-600" : item.stock <= item.minStock ? "text-amber-500" : "text-emerald-600")}>{item.stock}</span></TableCell>
                                       <TableCell className="text-center"><Badge className={cn("text-[8px] font-black border-none uppercase px-3 h-5", item.stock <= 0 ? "bg-rose-100 text-rose-700" : item.stock <= item.minStock ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>{item.stock <= 0 ? 'AGOTADO' : item.stock <= item.minStock ? 'STOCK BAJO' : 'OPTIMO'}</Badge></TableCell>
                                       <TableCell className="text-right pr-8"><Button variant="ghost" size="icon" onClick={() => handleEditItem(item)} className="h-9 w-9 rounded-xl text-primary"><Pencil className="h-4 w-4" /></Button></TableCell>
                                    </TableRow>
                                 ))}
                                 {filteredItems.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-20 opacity-30 text-xs font-black uppercase">Sin productos registrados</TableCell></TableRow>}
                              </TableBody>
                           </Table>
                        </div>
                     )}

                     {currentView === 'reg_entrada' && (
                        <div className="max-w-5xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 pb-20">
                           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl space-y-12">
                              <div className="space-y-8">
                                 <div className="flex items-center gap-3 border-b-2 border-primary/10 pb-2"><Archive className="h-5 w-5 text-accent" /><h4 className="text-xs font-black uppercase text-accent tracking-widest">Información de la Requisición</h4></div>
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-2"><Label className="text-[10px] font-black text-primary uppercase pl-1">Numero de requisición</Label><Input className="h-12 font-mono font-black uppercase bg-slate-50 border-none shadow-inner text-primary" value={movementForm.folio} onChange={e => setMovementForm({...movementForm, folio: e.target.value.toUpperCase()})} /></div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black text-primary uppercase pl-1">Proveedor / Origen</Label>
                                       <Select value={movementForm.provider} onValueChange={v => setMovementForm({...movementForm, provider: v})}>
                                          <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold uppercase"><SelectValue placeholder={providers.length > 0 ? "ELEGIR PROVEEDOR..." : "REGISTRAR PROVEEDORES PRIMERO..."} /></SelectTrigger>
                                          <SelectContent className="rounded-2xl z-[300]">{providers.map(p => (<SelectItem key={p.id} value={p.name} className="font-black text-[10px] uppercase">{p.name}</SelectItem>))}</SelectContent>
                                       </Select>
                                    </div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black text-primary uppercase pl-1">Fecha</Label><div className="h-12 bg-slate-50 rounded-xl flex items-center px-4 font-bold text-slate-400 text-sm border-2 border-dashed">{format(new Date(), 'dd/MM/yyyy')}</div></div>
                                 </div>
                                 <div className="space-y-2"><Label className="text-[10px] font-black text-primary uppercase pl-1">Observación de Auditoría</Label><Textarea className="min-h-[100px] bg-slate-50 border-none rounded-2xl p-6 font-bold uppercase shadow-inner" value={movementForm.reason} onChange={e => setMovementForm({...movementForm, reason: e.target.value.toUpperCase()})} placeholder="NOTAS SOBRE EL ESTADO FÍSICO DE LA ENTREGA..." /></div>
                              </div>
                              <div className="bg-[#9f2241]/5 p-8 rounded-[2.5rem] border border-[#9f2241]/10 space-y-8">
                                 <div className="flex items-center gap-3 border-b-2 border-primary/10 pb-2"><Settings2 className="h-5 w-5 text-primary" /><h4 className="text-xs font-black uppercase text-primary tracking-widest">Detalle Técnico del Producto</h4></div>
                                 <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                    <div className="space-y-2"><Label className="text-[10px] font-black text-primary uppercase pl-1">Código Producto</Label><div className="h-12 bg-white rounded-xl flex items-center px-4 font-mono font-black text-primary border-2 border-white shadow-sm">{items.find(i => i.id === movementForm.itemId)?.code || 'S/C'}</div></div>
                                    <div className="md:col-span-2 space-y-2"><Label className="text-[10px] font-black text-primary uppercase pl-1">Seleccionar Producto</Label>
                                       <Select value={movementForm.itemId} onValueChange={v => setMovementForm({...movementForm, itemId: v})}>
                                          <SelectTrigger className="h-12 rounded-xl bg-white border-2 border-white shadow-xl font-black uppercase text-xs"><SelectValue placeholder="CATÁLOGO MAESTRO..." /></SelectTrigger>
                                          <SelectContent className="rounded-2xl z-[300] max-h-[300px]">{items.map(i => (<SelectItem key={i.id} value={i.id} className="font-black text-[10px] uppercase">{i.name}</SelectItem>))}</SelectContent>
                                       </Select>
                                    </div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black text-primary uppercase pl-1">Unidad</Label>
                                       <Select value={movementForm.unit} onValueChange={v => setMovementForm({...movementForm, unit: v})}>
                                          <SelectTrigger className="h-12 rounded-xl bg-white border-none shadow-sm font-black"><SelectValue /></SelectTrigger>
                                          <SelectContent className="rounded-xl"><SelectItem value="PZA" className="font-black text-[10px]">PIEZA</SelectItem><SelectItem value="MTS" className="font-black text-[10px]">METROS</SelectItem><SelectItem value="KTS" className="font-black text-[10px]">KITS</SelectItem></SelectContent>
                                       </Select>
                                    </div>
                                    <div className="md:col-span-4 flex justify-center">
                                       <div className="w-full max-w-[200px] space-y-2">
                                          <Label className="text-[10px] font-black text-primary uppercase text-center block">Cantidad Ingresada</Label>
                                          <Input type="number" className="h-16 font-black text-3xl text-center bg-white border-4 border-primary/20 rounded-3xl shadow-2xl text-primary" value={movementForm.quantity} onChange={e => setMovementForm({...movementForm, quantity: parseInt(e.target.value) || 0})} />
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     {currentView === 'reg_salida' && (
                        <div className="max-w-5xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 pb-20">
                           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl space-y-12">
                              <div className="space-y-8">
                                 <div className="flex items-center gap-3 border-b-2 border-rose-100 pb-2"><Archive className="h-5 w-5 text-rose-600" /><h4 className="text-xs font-black uppercase text-rose-600 tracking-widest">Información de la Entrega</h4></div>
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-2"><Label className="text-[10px] font-black text-rose-600 uppercase pl-1">Nº Documento / Folio</Label><Input className="h-12 font-mono font-black uppercase bg-slate-50 border-none shadow-inner text-rose-600" value={movementForm.folio} onChange={e => setMovementForm({...movementForm, folio: e.target.value.toUpperCase()})} /></div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black text-rose-600 uppercase pl-1">Usuarios (Clientes)</Label>
                                       <Select value={movementForm.cct} onValueChange={v => setMovementForm({...movementForm, cct: v})}>
                                          <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold uppercase"><SelectValue placeholder={warehouseUsers.length > 0 ? "ELEGIR RECEPTOR..." : "REGISTRAR USUARIOS PRIMERO..."} /></SelectTrigger>
                                          <SelectContent className="rounded-2xl z-[300]">{warehouseUsers.map(u => (<SelectItem key={u.id} value={u.name} className="font-black text-[10px] uppercase">{u.office} • {u.name}</SelectItem>))}</SelectContent>
                                       </Select>
                                    </div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black text-rose-600 uppercase pl-1">Fecha</Label><div className="h-12 bg-slate-50 rounded-xl flex items-center px-4 font-bold text-slate-400 text-sm border-2 border-dashed">{format(new Date(), 'dd/MM/yyyy')}</div></div>
                                 </div>
                                 <div className="space-y-2"><Label className="text-[10px] font-black text-rose-600 uppercase pl-1">Observación</Label><Textarea className="min-h-[100px] bg-slate-50 border-none rounded-2xl p-6 font-bold uppercase shadow-inner" value={movementForm.reason} onChange={e => setMovementForm({...movementForm, reason: e.target.value.toUpperCase()})} placeholder="MOTIVO DEL EGRESO O FOLIO DE SERVICIO..." /></div>
                              </div>
                              <div className="bg-rose-500/5 p-8 rounded-[2.5rem] border border-rose-500/10 space-y-8">
                                 <div className="flex items-center gap-3 border-b-2 border-rose-200 pb-2"><Settings2 className="h-5 w-5 text-rose-600" /><h4 className="text-xs font-black uppercase text-rose-600 tracking-widest">Detalle del Insumo a Entregar</h4></div>
                                 <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                    <div className="space-y-2"><Label className="text-[10px] font-black text-rose-600 uppercase pl-1">Código Producto</Label><div className="h-12 bg-white rounded-xl flex items-center px-4 font-mono font-black text-rose-600 border-2 border-white shadow-sm">{items.find(i => i.id === movementForm.itemId)?.code || 'S/C'}</div></div>
                                    <div className="md:col-span-2 space-y-2"><Label className="text-[10px] font-black text-rose-600 uppercase pl-1">Seleccionar Producto</Label>
                                       <Select value={movementForm.itemId} onValueChange={v => setMovementForm({...movementForm, itemId: v})}>
                                          <SelectTrigger className="h-12 rounded-xl bg-white border-2 border-white shadow-xl font-black uppercase text-xs text-rose-600"><SelectValue placeholder="CATÁLOGO MAESTRO..." /></SelectTrigger>
                                          <SelectContent className="rounded-2xl z-[300] max-h-[300px]">{items.map(i => (<SelectItem key={i.id} value={i.id} className="font-black text-[10px] uppercase">{i.name}</SelectItem>))}</SelectContent>
                                       </Select>
                                    </div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black text-rose-600 uppercase pl-1">Cantidad Stock</Label><div className="h-12 bg-white rounded-xl flex items-center justify-center font-black text-xl text-primary border-4 border-primary/10 shadow-inner">{items.find(i => i.id === movementForm.itemId)?.stock || 0}</div></div>
                                    <div className="md:col-span-4 flex justify-center">
                                       <div className="w-full max-w-[200px] space-y-2">
                                          <Label className="text-[10px] font-black text-rose-600 uppercase text-center block">Cantidad a Entregar</Label>
                                          <Input type="number" className="h-16 font-black text-3xl text-center bg-white border-4 border-rose-600/20 rounded-3xl shadow-2xl text-rose-600" value={movementForm.quantity} onChange={e => setMovementForm({...movementForm, quantity: parseInt(e.target.value) || 0})} />
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     {(currentView === 'entradas' || currentView === 'salidas') && (
                        <Table className="bg-white rounded-[2rem] shadow-2xl border-none overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                           <TableHeader className="bg-slate-50 border-b">
                              <TableRow className="h-12">
                                 <TableHead className="pl-8 text-[9px] font-black uppercase">Folio</TableHead>
                                 <TableHead className="text-[9px] font-black uppercase">Fecha</TableHead>
                                 <TableHead className="text-[9px] font-black uppercase">Producto</TableHead>
                                 <TableHead className="text-center text-[9px] font-black uppercase">Cant</TableHead>
                                 <TableHead className="text-[9px] font-black uppercase">{currentView === 'entradas' ? 'Proveedor' : 'Usuario'}</TableHead>
                                 <TableHead className="text-right pr-10 text-[9px] font-black uppercase">Acciones</TableHead>
                              </TableRow>
                           </TableHeader>
                           <TableBody>
                              {filteredMovements.map(m => (
                                 <TableRow key={m.id} className="h-14 border-b border-slate-50 hover:bg-slate-50">
                                    <TableCell className="pl-8 font-mono font-black text-primary text-[10px]">{m.folio || '--'}</TableCell>
                                    <TableCell className="text-[10px] font-bold text-slate-400">{m.date}</TableCell>
                                    <TableCell className="font-black text-[11px] text-slate-700 uppercase">{m.itemName}</TableCell>
                                    <TableCell className="text-center font-black text-primary text-sm">{m.quantity}</TableCell>
                                    <TableCell className="text-[10px] font-bold text-slate-500 uppercase">{m.provider || m.cct}</TableCell>
                                    <TableCell className="text-right pr-8">
                                       <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300 hover:text-rose-600" onClick={async () => { if(confirm("¿Remover registro?")) await deleteDoc(doc(db, 'warehouse_movements', m.id)); }}><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                 </TableRow>
                              ))}
                              {filteredMovements.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-20 opacity-30 text-xs font-black uppercase">No hay registros históricos</TableCell></TableRow>}
                           </TableBody>
                        </Table>
                     )}

                     {currentView === 'proveedores' && (
                        <Table className="bg-white rounded-[2rem] shadow-2xl border-none overflow-hidden animate-in fade-in">
                           <TableHeader className="bg-slate-50 border-b">
                              <TableRow className="h-12">
                                 <TableHead className="pl-8 font-black text-[9px] uppercase">Nombre del Proveedor</TableHead>
                                 <TableHead className="font-black text-[9px] uppercase">Contacto / Teléfono</TableHead>
                                 <TableHead className="font-black text-[9px] uppercase">Email Institucional</TableHead>
                                 <TableHead className="text-right pr-10"></TableHead>
                              </TableRow>
                           </TableHeader>
                           <TableBody>
                              {filteredProviders.map(p => (
                                 <TableRow key={p.id} className="h-14 border-b border-slate-50 hover:bg-slate-50">
                                    <TableCell className="pl-8 font-black text-slate-700 text-xs uppercase">{p.name}</TableCell>
                                    <TableCell className="font-bold text-slate-500 text-[10px] uppercase">{p.contact} • {p.phone}</TableCell>
                                    <TableCell className="font-mono text-[10px] text-primary">{p.email}</TableCell>
                                    <TableCell className="text-right pr-8"><Button variant="ghost" size="icon" onClick={async () => { if(confirm("¿Eliminar proveedor?")) await deleteDoc(doc(db, 'warehouse_providers', p.id)); }} className="h-8 w-8 text-rose-300 hover:text-rose-600"><Trash2 className="h-4 w-4" /></Button></TableCell>
                                 </TableRow>
                              ))}
                              {filteredProviders.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-20 opacity-30 text-xs font-black uppercase">Directorio vacío</TableCell></TableRow>}
                           </TableBody>
                        </Table>
                     )}

                     {currentView === 'usuarios' && (
                        <Table className="bg-white rounded-[2rem] shadow-2xl border-none overflow-hidden animate-in fade-in">
                           <TableHeader className="bg-slate-50 border-b">
                              <TableRow className="h-12">
                                 <TableHead className="pl-8 font-black text-[9px] uppercase">Nombre del Usuario / Responsable</TableHead>
                                 <TableHead className="font-black text-[9px] uppercase">Oficina Regional</TableHead>
                                 <TableHead className="font-black text-[9px] uppercase">Área de Adscripción</TableHead>
                                 <TableHead className="text-right pr-10"></TableHead>
                              </TableRow>
                           </TableHeader>
                           <TableBody>
                              {filteredUsers.map(u => (
                                 <TableRow key={u.id} className="h-14 border-b border-slate-50 hover:bg-slate-50">
                                    <TableCell className="pl-8">
                                       <div className="flex items-center gap-3">
                                          <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-primary"><User className="h-4 w-4" /></div>
                                          <span className="font-black text-slate-700 text-xs uppercase">{u.name}</span>
                                       </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-primary text-[10px] uppercase">{u.office}</TableCell>
                                    <TableCell className="font-bold text-slate-400 text-[10px] uppercase">{u.area}</TableCell>
                                    <TableCell className="text-right pr-8"><Button variant="ghost" size="icon" onClick={async () => { if(confirm("¿Eliminar usuario?")) await deleteDoc(doc(db, 'warehouse_clients', u.id)); }} className="h-8 w-8 text-rose-300 hover:text-rose-600"><Trash2 className="h-4 w-4" /></Button></TableCell>
                                 </TableRow>
                              ))}
                              {filteredUsers.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-20 opacity-30 text-xs font-black uppercase">Sin usuarios registrados</TableCell></TableRow>}
                           </TableBody>
                        </Table>
                     )}
                  </div>
               </ScrollArea>
            </div>
          )}
        </div>

        {/* DIÁLOGOS DE ALTA RÁPIDA */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
           <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
              <DialogHeader className="p-8 bg-primary text-white"><DialogTitle className="uppercase font-black text-xl flex items-center gap-3"><Box className="h-7 w-7 text-accent" /> {editingItemId ? 'Editar Insumo' : 'Alta de Nuevo Insumo'}</DialogTitle></DialogHeader>
              <div className="p-8 space-y-6">
                 <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Categoría del Producto</Label>
                       <Select value={newItemForm.category} onValueChange={(v: any) => setNewItemForm({...newItemForm, category: v})}>
                          <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none shadow-inner font-bold uppercase"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl"><SelectItem value="Cómputo" className="text-[10px] font-bold">EQUIPO DE CÓMPUTO</SelectItem><SelectItem value="Redes" className="text-[10px] font-bold">REDES Y CONECTIVIDAD</SelectItem><SelectItem value="Herramientas" className="text-[10px] font-bold">HERRAMIENTAS</SelectItem><SelectItem value="Consumibles" className="text-[10px] font-bold">CONSUMIBLES</SelectItem></SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Código Técnico</Label><Input className="h-11 font-mono font-black bg-slate-50 border-none rounded-xl" value={newItemForm.code} onChange={e => setNewItemForm({...newItemForm, code: e.target.value.toUpperCase()})} /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Nombre del Insumo</Label><Input className="h-11 font-black bg-slate-50 border-none rounded-xl uppercase" value={newItemForm.name} onChange={e => setNewItemForm({...newItemForm, name: e.target.value.toUpperCase()})} /></div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Stock Mínimo</Label><Input type="number" className="h-11 font-black text-center bg-slate-50 border-none rounded-xl" value={newItemForm.minStock} onChange={e => setNewItemForm({...newItemForm, minStock: parseInt(e.target.value) || 0})} /></div>
                       <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Stock Inicial</Label><Input type="number" className="h-11 font-black text-center bg-slate-50 border-none rounded-xl" value={newItemForm.stock} onChange={e => setNewItemForm({...newItemForm, stock: parseInt(e.target.value) || 0})} disabled={!!editingItemId} /></div>
                    </div>
                 </div>
              </div>
              <DialogFooter className="p-8 bg-slate-50 border-t flex justify-end gap-4"><Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="text-[10px] font-black uppercase">CANCELAR</Button><Button onClick={handleSaveItem} className="btn-institutional h-12 px-10 text-[10px] shadow-2xl"><Save className="h-4 w-4 mr-2" /> GUARDAR</Button></DialogFooter>
           </DialogContent>
        </Dialog>

        <Dialog open={isAddProviderOpen} onOpenChange={setIsAddProviderOpen}>
           <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
              <DialogHeader className="p-8 bg-slate-800 text-white"><DialogTitle className="uppercase font-black text-xl flex items-center gap-3"><Truck className="h-7 w-7 text-accent" /> Registro de Proveedor</DialogTitle></DialogHeader>
              <div className="p-8 space-y-4">
                 <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Nombre / Razón Social</Label><Input className="h-11 bg-slate-50 border-none rounded-xl" value={providerForm.name} onChange={e => setProviderForm({...providerForm, name: e.target.value.toUpperCase()})} /></div>
                 <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Persona de Contacto</Label><Input className="h-11 bg-slate-50 border-none rounded-xl" value={providerForm.contact} onChange={e => setProviderForm({...providerForm, contact: e.target.value.toUpperCase()})} /></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Teléfono</Label><Input className="h-11 bg-slate-50 border-none rounded-xl" value={providerForm.phone} onChange={e => setProviderForm({...providerForm, phone: e.target.value})} /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Email</Label><Input className="h-11 bg-slate-50 border-none rounded-xl" value={providerForm.email} onChange={e => setProviderForm({...providerForm, email: e.target.value.toLowerCase()})} /></div>
                 </div>
              </div>
              <DialogFooter className="p-8 bg-slate-50 border-t"><Button onClick={handleSaveProvider} className="w-full btn-institutional">REGISTRAR PROVEEDOR</Button></DialogFooter>
           </DialogContent>
        </Dialog>

        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
           <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
              <DialogHeader className="p-8 bg-indigo-900 text-white"><DialogTitle className="uppercase font-black text-xl flex items-center gap-3"><Users className="h-7 w-7 text-accent" /> Registro de Usuario Almacén</DialogTitle></DialogHeader>
              <div className="p-8 space-y-4">
                 <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Nombre del Responsable</Label><Input className="h-11 bg-slate-50 border-none rounded-xl" value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value.toUpperCase()})} /></div>
                 <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Oficina Regional</Label><Input className="h-11 bg-slate-50 border-none rounded-xl" value={clientForm.office} onChange={e => setClientForm({...clientForm, office: e.target.value.toUpperCase()})} /></div>
                 <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Área / Cargo</Label><Input className="h-11 bg-slate-50 border-none rounded-xl" value={clientForm.area} onChange={e => setClientForm({...clientForm, area: e.target.value.toUpperCase()})} /></div>
              </div>
              <DialogFooter className="p-8 bg-slate-50 border-t"><Button onClick={handleSaveClient} className="w-full btn-institutional">REGISTRAR USUARIO</Button></DialogFooter>
           </DialogContent>
        </Dialog>

        <DialogFooter className="p-4 bg-slate-100/50 border-t shrink-0"><Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-10 px-8 text-[10px] font-black uppercase text-slate-400">CERRAR ALMACÉN</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
