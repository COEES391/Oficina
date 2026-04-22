'use client'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { supportData } from "@/lib/planning-data"

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Movimientos de Soporte Técnico</CardTitle>
          <CardDescription>Seguimiento de incidencias en planteles educativos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Folio</TableHead>
                <TableHead>Escuela</TableHead>
                <TableHead>Incidencia</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supportData.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono">{ticket.id}</TableCell>
                  <TableCell>{ticket.school}</TableCell>
                  <TableCell>{ticket.issue}</TableCell>
                  <TableCell>
                    <Badge variant={ticket.status === 'resuelto' ? 'default' : ticket.status === 'pendiente' ? 'destructive' : 'outline'}>
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{ticket.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
