import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { parseISO } from "date-fns";

interface AcademicEvent {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  type: string;
  is_public: boolean;
  created_at: string;
}

const SharedCalendarPage = () => {
  const { token } = useParams<{ token: string }>();
  const [event, setEvent] = useState<AcademicEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const fetchSharedEvent = async () => {
      if (!token) {
        setError("Token de compartilhamento não fornecido.");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: invokeError } = await supabase.functions.invoke('get-shared-calendar-events', {
          body: JSON.stringify({ token }),
        });

        if (invokeError) {
          throw new Error(invokeError.message);
        }

        if (data && data.event) {
          setEvent(data.event);
          setDate(new Date(data.event.start_date)); // Set calendar to event date
        } else {
          setError("Evento não encontrado ou token inválido/expirado.");
        }
      } catch (err: any) {
        console.error("Erro ao buscar evento compartilhado:", err);
        setError(err.message || "Erro ao carregar evento compartilhado.");
        toast.error("Erro ao carregar evento compartilhado: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedEvent();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando evento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center text-red-500">
        <h1 className="text-3xl font-bold mb-4">Erro</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Evento Não Encontrado</h1>
        <p>O evento que você está tentando acessar não existe ou o link é inválido.</p>
      </div>
    );
  }

  const getEventsForDate = (day: Date) => {
    if (!event) return [];
    return format(new Date(event.start_date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd") ? [event] : [];
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Calendário Acadêmico Compartilhado</h1>
      <p className="text-center text-muted-foreground mb-8">Visualização de evento público.</p>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/2">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border mx-auto"
            components={{
              DayContent: ({ date: day }) => {
                const dayEvents = getEventsForDate(day);
                return (
                  <div className="relative text-center">
                    {day.getDate()}
                    {dayEvents.length > 0 && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1">
                        {dayEvents.map((evt) => (
                          <span
                            key={evt.id}
                            className="h-1 w-1 rounded-full bg-blue-500"
                            title={evt.title}
                          ></span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              },
            }}
          />
        </div>
        <div className="md:w-1/2">
          <h2 className="text-2xl font-semibold mb-4">Detalhes do Evento</h2>
          <div className="border p-4 rounded-md shadow-sm space-y-2">
            <h3 className="text-xl font-medium">{event.title}</h3>
            <p className="text-sm text-muted-foreground">Tipo: {event.type}</p>
            <p className="text-sm text-muted-foreground">
              Início: {format(parseISO(event.start_date), "dd/MM/yyyy HH:mm")}
            </p>
            {event.end_date && (
              <p className="text-sm text-muted-foreground">
                Término: {format(parseISO(event.end_date), "dd/MM/yyyy HH:mm")}
              </p>
            )}
            <p className="text-base mt-2">{event.description || "Nenhuma descrição fornecida."}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedCalendarPage;