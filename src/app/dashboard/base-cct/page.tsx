'use client'
import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { schoolsDirectory, type SchoolInfo } from "@/lib/schools-directory"
import { Database, Search, School, MapPin, Hash, Users, BookOpen, GraduationCap } from "lucide-react"

export default function BaseCctPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredSchools = useMemo(() => {
    if (!searchTerm) return schoolsDirectory;
    const term = searchTerm.toUpperCase();
    return schoolsDirectory.filter(s => 
      s.cct.toUpperCase().includes(term) || 
      s.nombre.toUpperCase().includes(term) ||
      s.municipio.toUpperCase().includes(term) ||
      s.region.toUpperCase().includes(term)
    );
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase leading-none">Base Maestra CCT</h2>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2 mt-1">
            <Database className="h-4 w-4 text-accent" /> Catálogo Institucional Edoméx 2026 - Datos Estadísticos
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
              placeholder="Buscar por CCT, Nombre de Escuela, Municipio o Región..." 
              className="h-12 rounded-xl bg-slate-50 border-primary/10 pl-12 text-sm font-bold uppercase shadow-inner focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
          </div>

          <Badge variant="outline" className="h-12 px-6 rounded-xl border-primary/20 text-primary font-black text-[10px] uppercase">
            Registros: {filteredSchools.length}
          </Badge>
        </div>
      </Card>

      <Card className="executive-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-12 text-[10px] font-black uppercase text-center">#</TableHead>
                <TableHead className="text-[10px] font-black uppercase min-w-[150px]">Región / Valle</TableHead>
                <TableHead className="text-[10px] font-black uppercase min-w-[120px]">Municipio</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Turno</TableHead>
                <TableHead className="text-[10px] font-black uppercase">CCT</TableHead>
                <TableHead className="text-[10px] font-black uppercase min-w-[250px]">Nombre del Centro de Trabajo</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center"><Users className="h-3 w-3 inline mr-1" /> Alums</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center"><BookOpen className="h-3 w-3 inline mr-1" /> Gpos</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center"><GraduationCap className="h-3 w-3 inline mr-1" /> Mtros</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">ZE / Sect</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchools.length > 0 ? filteredSchools.map((s, idx) => (
                <TableRow key={`${s.cct}-${s.turno}`} className="hover:bg-slate-50 transition-colors group">
                  <TableCell className="text-center font-black text-[10px] text-muted-foreground">{idx + 1}.-</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-700">{s.region}</span>
                      <span className="text-[8px] font-bold text-accent uppercase tracking-widest">Valle de {s.valle}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[10px] font-bold text-slate-500 uppercase">{s.municipio}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[8px] font-black", s.turno === 'MATUTINO' ? 'border-emerald-200 text-emerald-600' : 'border-amber-200 text-amber-600')}>
                      {s.turno}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-black text-[10px] text-primary group-hover:scale-105 transition-transform">{s.cct}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <School className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-700 uppercase leading-tight max-w-[300px]">
                          {s.nombre}
                        </span>
                        <span className="text-[8px] text-muted-foreground font-bold">{s.servicioEducativo}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-black text-primary text-[11px]">{s.alumnos}</TableCell>
                  <TableCell className="text-center font-black text-slate-600 text-[11px]">{s.grupos}</TableCell>
                  <TableCell className="text-center font-black text-accent text-[11px]">{s.maestros}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-600">{s.zonaEscolar}</span>
                      <span className="text-[9px] font-black text-primary">{s.sector.split(' ')[0]}</span>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-20 bg-slate-50/20">
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
