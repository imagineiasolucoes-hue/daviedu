import usePageTitle from "@/hooks/usePageTitle";

const Pedagogico = () => {
  usePageTitle("Pedagógico");
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Pedagógico</h1>
      <p className="text-muted-foreground mt-2">
        Gerencie disciplinas, notas, frequência e boletins.
      </p>
    </div>
  );
};

export default Pedagogico;