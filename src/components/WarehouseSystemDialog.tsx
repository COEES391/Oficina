
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
  Loader2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'

type WarehouseItem = {
  id: string; name: string; code?: string; category: 'Cómputo' | 'Redes' | 'Herramientas' | 'Consumibles';
  stock: number; minStock: number; lastUpdated: string; provider?: string;
}

type WarehouseMovement = {
  id: string; itemId: string; itemName: string; itemCode?: string; category?: string; unit?: string;
  type: 'entrada' | 'salida'; quantity: number; date: string; folio?: string; provider?: string;
  reason: string; technician: string; cct?: string;
}

export function WarehouseSystemDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast()
  const [currentView, setCurrentView] = useState<'dashboard' | 'productos' | 'proveedores' | 'usuarios' | 'entradas' | 'salidas' | 'registro'>('dashboard')
  const [items, setItems] = useState<WarehouseItem[]>([])
  const [movements, setMovements] = useState<WarehouseMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingMovementId, setEditingMovementId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const [newItemForm, setNewItemForm] = useState({
    name: '', code: '', category: 'Cómputo' as WarehouseItem['category'], stock: 0, minStock: 5, provider: ''
  })

  const [movementForm, setMovementForm] = useState({
    itemId: '', folio: '', unit: 'PZA', type: 'entrada' as 'entrada' | 'salida', quantity: 1, reason: '', technician: '', cct: '', provider: ''
  })

  // Sincronización robusta con Firestore para cualquier hosting
  useEffect(() => {
    setMounted(true)
    if (!open) return

    setIsLoading(true)
    const itemsUnsubscribe = onSnapshot(collection(db, 'warehouse_items'), (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as WarehouseItem[])
    })

    const movesUnsubscribe = onSnapshot(query(collection(db, 'warehouse_movements'), orderBy('date', 'desc')), (snapshot) => {
      setMovements(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as WarehouseMovement[])
      setIsLoading(false)
    })

    return () => { itemsUnsubscribe(); movesUnsubscribe(); }
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

  const handleRegisterMovement = async () => {
    if (!movementForm.itemId || !movementForm.reason || movementForm.quantity <= 0) {
      toast({ variant: "destructive", title: "Datos incompletos" }); return;
    }
    
    const currentItem = items.find(i => i.id === movementForm.itemId);
    if (!currentItem) return;

    if (movementForm.type === 'salida' && currentItem.stock < movementForm.quantity) {
      toast({ variant: "destructive", title: "Existencias insuficientes para la salida" }); return;
    }

    try {
      const moveData = {
        ...movementForm,
        itemName: currentItem.name,
        itemCode: currentItem.code,
        category: currentItem.category,
        date: format(new Date(), 'dd/MM/yyyy'),
        updatedAt: serverTimestamp()
      }

      await addDoc(collection(db, 'warehouse_movements'), moveData);
      
      const newStock = movementForm.type === 'entrada' ? currentItem.stock + movementForm.quantity : currentItem.stock - movementForm.quantity;
      await updateDoc(doc(db, 'warehouse_items', currentItem.id), { stock: newStock, lastUpdated: serverTimestamp() });

      setMovementForm({ itemId: '', folio: '', unit: 'PZA', type: 'entrada', quantity: 1, reason: '', technician: '', cct: '', provider: '' });
      toast({ title: "Operación exitosa", description: "El inventario ha sido actualizado en la nube." });
      setCurrentView(movementForm.type === 'entrada' ? 'entradas' : 'salidas');
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
      toast({ title: "Catálogo actualizado" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al guardar insumo" });
    }
  }

  if (!mounted) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1300px] h-[95vh] flex flex-col p-0 overflow-hidden rounded-[3rem] border-none shadow-2xl bg-[#f8f9fa]">
        <DialogHeader className="p-6 bg-[#9f2241] text-white shrink-0 flex flex-row justify-between items-center pr-12">
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-3">
              {currentView !== 'dashboard' && (
                <button onClick={() => setCurrentView('dashboard')} className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"><ChevronLeft className="h-5 w-5" /></button>
              )}
              <DialogTitle className="uppercase font-black text-2xl">CONTROL DE INVENTARIOS EN LA NUBE</DialogTitle>
            </div>
            <DialogDescription className="text-white/60 font-bold text-[10px] tracking-widest mt-1 uppercase">Sistema Multi-Usuario Portátil • COEES 2026</DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading && currentView !== 'dashboard' ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-[10px] font-black uppercase mt-4">Sincronizando inventarios...</p></div>
          ) : currentView === 'dashboard' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl w-full">
                <button onClick={() => {setCurrentView('productos'); setSearchTerm('');}} className="flex flex-col items-center justify-center p-6 bg-white rounded-[2rem] border-2 border-slate-50 shadow-sm hover:shadow-2xl hover:scale-105 transition-all group">
                   <div className="h-16 w-16 rounded-3xl bg-blue-600 flex items-center justify-center text-white mb-4 shadow-xl"><Box className="h-8 w-8" /></div>
                   <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider">Productos</span>
                </button>
                <button onClick={() => {setCurrentView('entradas'); setSearchTerm('');}} className="flex flex-col items-center justify-center p-6 bg-white rounded-[2rem] border-2 border-slate-50 shadow-sm hover:shadow-2xl hover:scale-105 transition-all group">
                   <div className="h-16 w-16 rounded-3xl bg-emerald-600 flex items-center justify-center text-white mb-4 shadow-xl"><ArrowUpRight className="h-8 w-8" /></div>
                   <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider">Bitácora Entradas</span>
                </button>
                <button onClick={() => {setCurrentView('salidas'); setSearchTerm('');}} className="flex flex-col items-center justify-center p-6 bg-white rounded-[2rem] border-2 border-slate-50 shadow-sm hover:shadow-2xl hover:scale-105 transition-all group">
                   <div className="h-16 w-16 rounded-3xl bg-rose-600 flex items-center justify-center text-white mb-4 shadow-xl"><ArrowDownRight className="h-8 w-8" /></div>
                   <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider">Bitácora Salidas</span>
                </button>
                <button onClick={() => {setCurrentView('registro'); setMovementForm(prev => ({...prev, type: 'entrada'}));}} className="flex flex-col items-center justify-center p-6 bg-white rounded-[2rem] border-2 border-slate-50 shadow-sm hover:shadow-2xl hover:scale-105 transition-all group">
                   <div className="h-16 w-16 rounded-3xl bg-[#621132] flex items-center justify-center text-white mb-4 shadow-xl"><ShoppingBag className="h-8 w-8" /></div>
                   <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider">Registrar Entrada</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
               <div className="p-6 bg-white border-b flex justify-between items-center shrink-0">
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary">Vista: {currentView.toUpperCase()}</h3>
                  <div className="flex gap-4">
                     <div className="relative w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
                        <Input placeholder="Buscar..." className="h-9 pl-10 rounded-xl border-slate-100 bg-slate-50 text-[10px] font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                     </div>
                     {currentView === 'productos' && (
                        <Button onClick={() => { setEditingItemId(null); setNewItemForm({name: '', code: '', category: 'Cómputo', stock: 0, minStock: 5, provider: ''}); setIsAddDialogOpen(true); }} className="btn-institutional h-9 px-6 rounded-xl text-[9px]">Nuevo Insumo</Button>
                     )}
                  </div>
               </div>
               <ScrollArea className="flex-1 p-6">
                 {currentView === 'productos' && (
                   <Table className="bg-white rounded-[2rem] shadow-xl overflow-hidden border">
                      <TableHeader className="bg-slate-50"><TableRow><TableHead className="font-black text-[9px] uppercase pl-8">Código</TableHead><TableHead className="font-black text-[9px] uppercase">Categoría</TableHead><TableHead className="font-black text-[9px] uppercase">Producto</TableHead><TableHead className="text-center font-black text-[9px] uppercase">Stock</TableHead><TableHead className="text-right pr-10"></TableHead></TableRow></TableHeader>
                      <TableBody>
                        {filteredItems.map(item => (
                          <TableRow key={item.id} className="h-14 border-b">
                            <TableCell className="pl-8 font-mono font-black text-primary text-[10px]">{item.code || 'S/C'}</TableCell>
                            <TableCell><Badge variant="outline" className="text-[8px]">{item.category}</Badge></TableCell>
                            <TableCell className="font-black text-xs text-slate-700 uppercase">{item.name}</TableCell>
                            <TableCell className="text-center font-black text-lg text-primary">{item.stock}</TableCell>
                            <TableCell className="text-right pr-8"><Button variant="ghost" size="icon" onClick={() => handleEditItem(item)}><Pencil className="h-4 w-4" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                   </Table>
                 )}

                 {currentView === 'registro' && (
                   <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
                      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl space-y-10">
                         <div className={cn("p-3 rounded-2xl text-center shadow-lg", movementForm.type === 'entrada' ? "bg-emerald-600" : "bg-rose-600")}>
                            <h4 className="text-white font-black uppercase text-sm tracking-widest">{movementForm.type === 'entrada' ? 'REQUISICIÓN (INGRESO)' : 'ENTREGA (EGRESO)'}</h4>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Insumo / Producto</Label>
                               <Select value={movementForm.itemId} onValueChange={v => setMovementForm({...movementForm, itemId: v})}>
                                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold uppercase"><SelectValue placeholder="SELECCIONAR..." /></SelectTrigger>
                                  <SelectContent className="rounded-xl shadow-2xl z-[300]">{items.map(i => (<SelectItem key={i.id} value={i.id} className="font-black text-[10px] uppercase">{i.name}</SelectItem>))}</SelectContent>
                               </Select>
                            </div>
                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Cantidad</Label><Input type="number" className="h-12 font-black text-2xl text-center bg-slate-50 border-none shadow-inner" value={movementForm.quantity} onChange={e => setMovementForm({...movementForm, quantity: parseInt(e.target.value) || 0})} /></div>
                            <div className="md:col-span-2 space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Folio / Documento</Label><Input className="h-12 font-mono font-black uppercase bg-slate-50 border-none shadow-inner" value={movementForm.folio} onChange={e => setMovementForm({...movementForm, folio: e.target.value})} /></div>
                            <div className="md:col-span-2 space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Observaciones Técnicas</Label><Textarea className="min-h-[100px] bg-slate-50 border-none rounded-2xl p-6 font-bold uppercase shadow-inner" value={movementForm.reason} onChange={e => setMovementForm({...movementForm, reason: e.target.value})} /></div>
                         </div>
                         <Button onClick={handleRegisterMovement} className="w-full btn-institutional h-14 text-sm gap-3 shadow-2xl"><Save className="h-6 w-6" /> Guardar en Servidor Central</Button>
                      </div>
                   </div>
                 )}
               </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
