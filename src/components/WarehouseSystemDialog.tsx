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
  Plus
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type WarehouseItem = {
  id: string;
  name: string;
  category: 'Cómputo' | 'Redes' | 'Herramientas' | 'Consumibles';
  stock: number;
  minStock: number;
  lastUpdated: string;
}

export function WarehouseSystemDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast()
  const [items, setItems] = useState<WarehouseItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const initialForm = {
    name: '',
    category: 'Cómputo' as WarehouseItem['category'],
    stock: 0,
    minStock: 5
  }
  const [formData, setFormData] = useState(initialForm)

  useEffect(() => {
    setMounted(true)
    const stored = JSON.parse(localStorage.getItem('coees_warehouse_v1') || '[]')
    if (stored.length === 0) {
      const defaultItems: WarehouseItem[] = [
        { id: '1', name: 'Cable UTP Cat 6 (Metros)', category: 'Redes', stock: 150, minStock: 50, lastUpdated: new Date().toISOString() },
        { id: '2', name: 'Conectores RJ45', category: 'Redes', stock: 80, minStock: 20, lastUpdated: new Date().toISOString() },
        { id: '3', name: 'Monitor LED 21"', category: 'Cómputo', stock: 12, minStock: 3, lastUpdated: new Date().toISOString() },
        { id: '4', name: 'Teclado USB Estándar', category: 'Cómputo', stock: 4, minStock: 5, lastUpdated: new Date().toISOString() },
        { id: '5', name: 'Kit de Herramientas Técnico', category: 'Herramientas', stock: 15, minStock: 2, lastUpdated: new Date().toISOString() }
      ]
      setItems(defaultItems)
      localStorage.setItem('coees_warehouse_v1', JSON.stringify(defaultItems))
    } else {
      setItems(stored)
    }
  }, [])

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name))
  }, [items, searchTerm])

  const handleAddItem = () => {
    if (!formData.name) return
    const newItem: WarehouseItem = {
      ...formData,
      id: `ITEM-${Date.now()}`,
      lastUpdated: new Date().toISOString()
    }
    const updated = [...items, newItem]
    setItems(updated)
    localStorage.setItem('coees_warehouse_v1', JSON.stringify(updated))
    setFormData(initialForm)
    setIsAddDialogOpen(false)
    toast({ title: "Artículo Registrado", description: `${newItem.name} se sumó al almacén.` })
  }

  const handleDelete = (id: string) => {
    const updated = items.filter(i => i.id !== id)
    setItems(updated)
    localStorage.setItem('coees_warehouse_v1', JSON.stringify(updated))
    toast({ title: "Artículo Eliminado" })
  }

  const updateStock = (id: string, delta: number) => {
    const updated = items.map(item => {
      if (item.id === id) {
        const newStock = Math.max(0, item.stock + delta)
        return { ...item, stock: newStock, lastUpdated: new Date().toISOString() }
      }
      return item
    })
    setItems(updated)
    localStorage.setItem('coees_warehouse_v1', JSON.stringify(updated))
  }

  if (!mounted) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[3rem] border-none shadow-2xl bg-[#f8f5f0]">
        <DialogHeader className="p-8 bg-[#9f2241] text-white shrink-0 flex flex-row justify-between items-center pr-12">
          <div className="space-y-1">
            <DialogTitle className="uppercase font-black text-2xl flex items-center gap-4">
               <Archive className="h-8 w-8 text-[#B38E5D]" /> Almacén de Insumos Técnicos
            </DialogTitle>
            <DialogDescription className="text-white/60 font-bold text-[10px] tracking-widest mt-1">
              Control de existencias para Soporte Técnico • Sistema COEES 2026
            </DialogDescription>
          </div>
          <button onClick={() => onOpenChange(false)} className="h-10 w-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-all">
            <X className="h-6 w-6" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col p-8 gap-6">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="relative flex-1 w-full group">
                 <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-300 group-focus-within:text-[#9f2241] transition-colors" />
                 <Input 
                    placeholder="Buscar por nombre o categoría..." 
                    className="h-12 pl-12 rounded-2xl bg-white border-none shadow-inner text-sm font-bold placeholder:text-slate-300"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                 />
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)} className="btn-institutional h-12 px-8 shadow-xl text-[11px] gap-2">
                 <PlusCircle className="h-5 w-5" /> Registrar nuevo artículo
              </Button>
           </div>

           <div className="flex-1 border rounded-[2.5rem] bg-white shadow-2xl overflow-hidden flex flex-col">
              <ScrollArea className="flex-1">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b">
                    <TableRow className="h-12">
                      <TableHead className="font-black text-[10px] text-[#9f2241] uppercase pl-8">Categoría</TableHead>
                      <TableHead className="font-black text-[10px] text-[#9f2241] uppercase">Nombre del artículo</TableHead>
                      <TableHead className="font-black text-[10px] text-[#9f2241] uppercase text-center">Stock actual</TableHead>
                      <TableHead className="font-black text-[10px] text-[#9f2241] uppercase text-center">Estatus</TableHead>
                      <TableHead className="text-right font-black text-[10px] text-[#9f2241] uppercase pr-10">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const isLowStock = item.stock <= item.minStock;
                      return (
                        <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors h-20 border-b border-slate-50">
                          <TableCell className="pl-8">
                            <Badge variant="outline" className={cn(
                              "font-black text-[9px] uppercase px-3 h-6 border-2",
                              item.category === 'Cómputo' ? "text-blue-600 border-blue-100 bg-blue-50" :
                              item.category === 'Redes' ? "text-emerald-600 border-emerald-100 bg-emerald-50" :
                              item.category === 'Herramientas' ? "text-amber-600 border-amber-100 bg-amber-50" :
                              "text-purple-600 border-purple-100 bg-purple-50"
                            )}>
                              {item.category === 'Cómputo' && <Monitor className="h-3 w-3 mr-1" />}
                              {item.category === 'Redes' && <Wifi className="h-3 w-3 mr-1" />}
                              {item.category === 'Herramientas' && <Wrench className="h-3 w-3 mr-1" />}
                              {item.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                             <div className="flex flex-col">
                               <span className="text-sm font-black text-slate-700">{item.name}</span>
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Min. Stock: {item.minStock}</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-center">
                             <div className="flex items-center justify-center gap-4">
                                <button onClick={() => updateStock(item.id, -1)} className="h-8 w-8 rounded-lg bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all font-black text-xl flex items-center justify-center shadow-sm">-</button>
                                <span className={cn("text-2xl font-black w-12 text-center", isLowStock ? "text-rose-500" : "text-primary")}>{item.stock}</span>
                                <button onClick={() => updateStock(item.id, 1)} className="h-8 w-8 rounded-lg bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 transition-all font-black text-xl flex items-center justify-center shadow-sm">+</button>
                             </div>
                          </TableCell>
                          <TableCell className="text-center">
                             {isLowStock ? (
                               <Badge className="bg-rose-500 text-white font-black text-[8px] gap-1 animate-pulse border-none">
                                 <AlertTriangle className="h-2 w-2" /> CRÍTICO
                               </Badge>
                             ) : (
                               <Badge className="bg-emerald-500 text-white font-black text-[8px] gap-1 border-none">
                                 <Box className="h-2 w-2" /> SUFICIENTE
                               </Badge>
                             )}
                          </TableCell>
                          <TableCell className="text-right pr-8">
                             <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => handleDelete(item.id)}>
                                <Trash2 className="h-4 w-4" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
           </div>
        </div>

        <DialogFooter className="p-6 bg-white border-t shrink-0">
           <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-12 px-10 rounded-2xl font-black text-xs text-slate-400">Cerrar Almacén</Button>
        </DialogFooter>
      </DialogContent>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-0 overflow-hidden bg-white border-none shadow-2xl">
          <DialogHeader className="p-8 bg-[#B38E5D] text-white">
            <DialogTitle className="font-black text-xl uppercase">Nuevo artículo de almacén</DialogTitle>
            <DialogDescription className="text-white/70 text-[10px] font-bold uppercase mt-1">Suma un nuevo ítem al catálogo de inventario.</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
             <div className="space-y-2">
                <Label className="text-[10px] font-black text-primary pl-1">Nombre del artículo</Label>
                <Input 
                   className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold uppercase" 
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                />
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-black text-primary pl-1">Categoría</Label>
                <Select value={formData.category} onValueChange={(val: any) => setFormData({...formData, category: val})}>
                   <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold"><SelectValue /></SelectTrigger>
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
                  <Label className="text-[10px] font-black text-primary pl-1">Stock Inicial</Label>
                  <Input 
                     type="number" 
                     className="h-12 rounded-xl bg-slate-50 border-none shadow-inner text-center font-black" 
                     value={formData.stock}
                     onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-primary pl-1">Stock Mínimo</Label>
                  <Input 
                     type="number" 
                     className="h-12 rounded-xl bg-slate-50 border-none shadow-inner text-center font-black" 
                     value={formData.minStock}
                     onChange={e => setFormData({...formData, minStock: parseInt(e.target.value) || 0})}
                  />
                </div>
             </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t gap-4">
             <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="h-12 px-6 text-xs font-bold uppercase">Cancelar</Button>
             <Button onClick={handleAddItem} className="btn-institutional h-12 px-10 text-xs shadow-xl">Guardar en Almacén</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
