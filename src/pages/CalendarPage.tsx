"use client";

import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, Trash2, Edit, Copy, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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

const eventTypes = [
  "Feriado",
  "Prova",
  "Reunião",
  "Prazo",
  "Evento Escolar",
  "Outro",
];

const CalendarPage = () => {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AcademicEvent[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<AcademicEvent | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    type: "",
    is_public: false,
  });
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");

  const tenantId = profile?.tenant_id;

  useEffect(() => {
    if (tenantId) {
      fetchEvents();
    }
  }, [tenantId, date, filterType, filterDate, viewMode]);

  const fetchEvents = async () => {
    if (!tenantId) return;

    let query = supabase
      .from("academic_events")
      .select("*")
      .eq("tenant_id", tenantId);

    if (filterType !== "all") {
      query = query.eq("type", filterType);
    }

    if (filterDate) {
      const startOfDay = format(filterDate, "yyyy-MM-ddT00:00:00.000Z");
      const endOfDay = format(filterDate, "yyyy-MM-ddT23:59:59.999Z");
      query = query.gte("start_date", startOfDay).lte("start_date", endOfDay);
    } else if (date && viewMode === "month") {
      const startOfMonth = format(new Date(date.getFullYear(), date.getMonth(), 1), "yyyy-MM-ddT00:00:00.000Z");
      const endOfMonth = format(new Date(date.getFullYear(), date.getMonth() + 1, 0), "yyyy-MM-ddT23:59:59.999Z");
      query = query.gte("start_date", startOfMonth).lte("start_date", endOfMonth);
    } else if (date && viewMode === "year") {
      const startOfYear = format(new Date(date.getFullYear(), 0, 1), "yyyy-MM-ddT00:00:00.000Z");
      const endOfYear = format(new Date(date.getFullYear(), 11, 31), "yyyy-MM-ddT23:59:59.999Z");
      query = query.gte("start_date", startOfYear).lte("start_date", endOfYear);
    }

    const { data, error } = await query.order("start_date", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar eventos: " + error.message);
    } else {
      setEvents(data || []);
      setFilteredEvents(data || []);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (field: "start_date" | "end_date", selectedDate: Date | undefined) => {
    setForm((prev) => ({
      ...prev,
      [field]: selectedDate ? selectedDate.toISOString() : "",
    }));
  };

  const handleTypeChange = (value: string) => {
    setForm((prev) => ({ ...prev, type: value }));
  };

  const handlePublicToggle = (checked: boolean) => {
    setForm((prev) => ({ ...prev, is_public: checked }));
  };

  const handleSaveEvent = async () => {
    if (!tenantId) {
      toast.error("Tenant ID não encontrado. Não é possível salvar o evento.");
      return;
    }

    const eventData = {
      tenant_id: tenantId,
      title: form.title,
      description: form.description,
      start_date: form.start_date,
      end_date: form.end_date || null,
      type: form.type,
      is_public: form.is_public,
    };

    let error = null;
    if (currentEvent) {
      // Update existing event
      const { error: updateError } = await supabase
        .from("academic_events")
        .update(eventData)
        .eq("id", currentEvent.id);
      error = updateError;
    } else {
      // Add new event
      const { error: insertError } = await supabase
        .from("academic_events")
        .insert(eventData);
      error = insertError;
    }

    if (error) {
      toast.error("Erro ao salvar evento: " + error.message);
    } else {
      toast.success("Evento salvo com sucesso!");
      setIsSheetOpen(false);
      resetForm();
      fetchEvents();
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Tem certeza que deseja excluir este evento?")) return;

    const { error } = await supabase
      .from("academic_events")
      .delete()
      .eq("id", eventId);

    if (error) {
      toast.error("Erro ao excluir evento: " + error.message);
    } else {
      toast.success("Evento excluído com sucesso!");
      setIsSheetOpen(false);
      fetchEvents();
    }
  };

  const handleShareEvent = async (eventId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-calendar-share-token', {
        body: JSON.stringify({ event_id: eventId }),
      });

      if (error) {
        throw new Error(error.message);
      }

      const token = data.token;
      const origin = window.location.origin;
      setShareLink(`${origin}/shared-calendar/${token}`);
      setIsShareDialogOpen(true);
    } catch (error: any) {
      toast.error("Erro ao gerar link de compartilhamento: " + error.message);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copiado para a área de transferência!");
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      start_date: "",
      end_date: "",
      type: "",
      is_public: false,
    });
    setCurrentEvent(null);
  };

  const openAddEventSheet = () => {
    resetForm();
    setIsSheetOpen(true);
  };

  const openEditEventSheet = (event: AcademicEvent) => {
    setCurrentEvent(event);
    setForm({
      title: event.title,
      description: event.description || "",
      start_date: event.start_date,
      end_date: event.end_date || "",
      type: event.type,
      is_public: event.is_public,
    });
    setIsSheetOpen(true);
  };

  const handleFilterTypeChange = (value: string) => {
    setFilterType(value);
  };

  const handleFilterDateChange = (selectedDate: Date | undefined) => {
    setFilterDate(selectedDate);
  };

  const handleViewModeChange = (mode: "month" | "year") => {
    setViewMode(mode);
  };

  const getEventsForDate = (day: Date) => {
    return filteredEvents.filter(
      (event) =>
        format(new Date(event.start_date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );
  };

  if (isProfileLoading) {
    return <div>Carregando perfil...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Calendário Acadêmico</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
        <Button onClick={openAddEventSheet} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" /> Adicionar Evento
        </Button>

        <div className="flex items-center gap-2">
          <Label htmlFor="filterType">Filtrar por Tipo:</Label>
          <Select value={filterType} onValueChange={handleFilterTypeChange}>
            <SelectTrigger id="filterType" className="w-[180px]">
              <SelectValue placeholder="Todos os Tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              {eventTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="filterDate">Filtrar por Data:</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !filterDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filterDate ? format(filterDate, "PPP") : <span>Selecionar data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filterDate}
                onSelect={handleFilterDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {filterDate && (
            <Button variant="ghost" onClick={() => setFilterDate(undefined)}>
              Limpar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            onClick={() => handleViewModeChange("month")}
          >
            Mês
          </Button>
          <Button
            variant={viewMode === "year" ? "default" : "outline"}
            onClick={() => handleViewModeChange("year")}
          >
            Ano
          </Button>
        </div>
      </div>

      <div className="flex">
        <div className="w-full">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
            components={{
              DayContent: ({ date: day }) => {
                const dayEvents = getEventsForDate(day);
                return (
                  <div className="relative text-center">
                    {day.getDate()}
                    {dayEvents.length > 0 && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1">
                        {dayEvents.map((event) => (
                          <span
                            key={event.id}
                            className="h-1 w-1 rounded-full bg-blue-500"
                            title={event.title}
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
        <div className="w-1/2 pl-4">
          <h2 className="text-2xl font-semibold mb-4">Eventos para {date ? format(date, "PPP") : "a data selecionada"}</h2>
          {getEventsForDate(date || new Date()).length === 0 ? (
            <p className="text-muted-foreground">Nenhum evento para esta data.</p>
          ) : (
            <div className="space-y-2">
              {getEventsForDate(date || new Date()).map((event) => (
                <div key={event.id} className="border p-3 rounded-md shadow-sm flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">{event.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.start_date), "dd/MM/yyyy HH:mm")}
                      {event.end_date && ` - ${format(new Date(event.end_date), "dd/MM/yyyy HH:mm")}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {event.is_public && (
                      <Button variant="ghost" size="icon" onClick={() => handleShareEvent(event.id)}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => openEditEventSheet(event)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{currentEvent ? "Editar Evento" : "Adicionar Novo Evento"}</SheetTitle>
            <SheetDescription>
              {currentEvent ? "Edite os detalhes do evento." : "Preencha os detalhes para adicionar um novo evento."}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSaveEvent(); }} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" value={form.title} onChange={handleInputChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={form.description} onChange={handleInputChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start_date">Data e Hora de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.start_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.start_date ? format(new Date(form.start_date), "PPP HH:mm") : <span>Selecionar data e hora</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.start_date ? new Date(form.start_date) : undefined}
                    onSelect={(d) => handleDateChange("start_date", d)}
                    initialFocus
                  />
                  <div className="p-3 border-t">
                    <Input
                      type="time"
                      value={form.start_date ? format(new Date(form.start_date), "HH:mm") : ""}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(":");
                        const newDate = form.start_date ? new Date(form.start_date) : new Date();
                        newDate.setHours(parseInt(hours));
                        newDate.setMinutes(parseInt(minutes));
                        handleDateChange("start_date", newDate);
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_date">Data e Hora de Término (Opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.end_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.end_date ? format(new Date(form.end_date), "PPP HH:mm") : <span>Selecionar data e hora</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.end_date ? new Date(form.end_date) : undefined}
                    onSelect={(d) => handleDateChange("end_date", d)}
                    initialFocus
                  />
                  <div className="p-3 border-t">
                    <Input
                      type="time"
                      value={form.end_date ? format(new Date(form.end_date), "HH:mm") : ""}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(":");
                        const newDate = form.end_date ? new Date(form.end_date) : new Date();
                        newDate.setHours(parseInt(hours));
                        newDate.setMinutes(parseInt(minutes));
                        handleDateChange("end_date", newDate);
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo de Evento</Label>
              <Select value={form.type} onValueChange={handleTypeChange} required>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_public"
                checked={form.is_public}
                onCheckedChange={handlePublicToggle}
              />
              <Label htmlFor="is_public">Tornar evento público (compartilhável)</Label>
            </div>
            <Button type="submit">{currentEvent ? "Salvar Alterações" : "Adicionar Evento"}</Button>
            {currentEvent && (
              <Button variant="destructive" onClick={() => handleDeleteEvent(currentEvent.id)}>
                <Trash2 className="h-4 w-4 mr-2" /> Excluir Evento
              </Button>
            )}
          </form>
        </SheetContent>
      </Sheet>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartilhar Evento</DialogTitle>
            <DialogDescription>
              Copie o link abaixo para compartilhar este evento público.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Input value={shareLink} readOnly />
            <Button onClick={copyShareLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;