"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Fingerprint } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const FormSchema = z.object({
  rfc: z.string().min(10, {
    message: "El RFC debe tener al menos 10 caracteres.",
  }).max(13, {
    message: "El RFC no debe tener más de 13 caracteres."
  }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      rfc: "",
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast({
      title: "Inicio de sesión exitoso",
      description: `Bienvenido, ${data.rfc}.`,
    });
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center justify-center text-center mb-8">
        <div className="bg-primary/20 text-primary p-3 rounded-full mb-4">
            <Fingerprint className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-bold tracking-tighter text-foreground">
          AsistenciaFacil
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          Inicia sesión con tu RFC para registrar tu asistencia de entrada y salida.
        </p>
      </div>

      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa tu RFC para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="rfc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RFC</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu RFC aquí" {...field} />
                    </FormControl>
                    <FormDescription>
                      Este es tu identificador único.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                Ingresar
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
