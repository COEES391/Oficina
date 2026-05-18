'use client'
import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { schoolsDirectory, type SchoolInfo } from "@/lib/schools-directory"
import { Database, Search, School, MapPin, Hash } from "lucide-react"

export default function BaseCctPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredSchools = useMemo(() => {
    if (!searchTerm) return schoolsDirectory;
    const term = searchTerm.toUpperCase();
    return schoolsDirectory.filter(s => 
      s.cct.toUpperCase().includes(term) || 
      s.nombre.toUpperCase().includes(term) ||
      s.municipio.toUpperCase().includes(term)
    );
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase leading-none">Base Maestra CCT</h2>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2 mt-1">
            <Database className="h-4 w-4 text-accent" /> Directorio Institucional Edoméx 2026
          </p>
        </div>
      </div>

      <Card className="executive-card p-6 bg-white/80 border-none shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Search className="h-5 w-5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buscador Operativo:</span>
          </div>
          
          <div className="relative flex-1 w-full">
            <Input 
              placeholder="Buscar por CCT, Nombre de Escuela o Municipio..." 
              className="h-12 rounded-xl bg-slate-50 border-primary/10 pl-12 text-sm font-bold uppercase shadow-inner focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
          </div>

          <Badge variant="outline" className="h-12 px-6 rounded-xl border-primary/20 text-primary font-black text-[10px] uppercase">
            Total Planteles: {filteredSchools.length}
          </Badge>
        </div>
      </Card>

      <Card className="executive-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-12 text-[10px] font-black uppercase text-center"><Hash className="h-3 w-3 inline mr-1" />#</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Región / Valle</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Municipio</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Mod.</TableHead>
                <TableHead className="text-[10px] font-black uppercase">CCT</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Nombre del Centro de Trabajo</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">ZE</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">Sector</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchools.length > 0 ? filteredSchools.map((s, idx) => (
                <TableRow key={s.cct} className="hover:bg-slate-50 transition-colors group">
                  <TableCell className="text-center font-black text-[10px] text-muted-foreground">{idx + 1}.-</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-700">{s.region}</span>
                      <span className="text-[8px] font-bold text-accent uppercase tracking-widest">Valle de {s.valle}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[10px] font-bold text-slate-500 uppercase">{s.municipio}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px] font-black border-slate-200 text-slate-600 bg-white">
                      {s.modalidad}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-black text-[10px] text-primary group-hover:scale-105 transition-transform">{s.cct}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <School className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-black text-slate-700 uppercase leading-tight max-w-[400px]">
                        {s.nombre}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-[10px] font-bold text-slate-600">{s.zonaEscolar}</TableCell>
                  <TableCell className="text-center text-[10px] font-bold text-slate-600">{s.sectorNum}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-20 bg-slate-50/20">
                    <div className="flex flex-col items-center gap-3 opacity-40">
                      <Search className="h-10 w-10 text-primary" />
                      <p className="text-[10px] font-black uppercase text-muted-foreground">No se encontraron planteles con los criterios de búsqueda.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
