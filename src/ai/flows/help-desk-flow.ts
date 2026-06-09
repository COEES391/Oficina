'use server';
/**
 * @fileOverview Agente de IA para la Mesa de Ayuda COEES.
 *
 * - chatWithHelpDesk - Función principal para interactuar con el chatbot técnico.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const HelpDeskInputSchema = z.object({
  message: z.string().describe('El mensaje o duda técnica del usuario.'),
});

const HelpDeskOutputSchema = z.object({
  response: z.string().describe('La respuesta técnica del asistente.'),
});

export async function chatWithHelpDesk(input: z.infer<typeof HelpDeskInputSchema>) {
  return helpDeskFlow(input);
}

const helpDeskFlow = ai.defineFlow(
  {
    name: 'helpDeskFlow',
    inputSchema: HelpDeskInputSchema,
    outputSchema: HelpDeskOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `Eres el "Asistente Técnico Virtual COEES" del Estado de México. 
      Tu misión es ayudar a docentes y coordinadores con problemas técnicos en:
      1. ATRES (Sistema de Seguimiento).
      2. Cuentas Institucionales (@desysa.edu.mx).
      3. Red Edusat y Red Local.
      
      Instrucciones de estilo:
      - Sé profesional, amable e institucional.
      - Usa términos técnicos pero fáciles de entender.
      - Si el usuario menciona problemas de conexión, recomiéndale verificar el cableado o reiniciar el micropak.
      - Si necesitan apoyo remoto, diles que proporcionen su ID de AnyDesk en el botón de "Soporte Remoto" para que un técnico humano intervenga.
      
      Mensaje del usuario: ${input.message}`,
      output: { schema: HelpDeskOutputSchema }
    });
    return output!;
  }
);
