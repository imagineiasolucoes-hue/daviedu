import usePageTitle from "@/hooks/usePageTitle";

const Comunicacao = () => {
  usePageTitle("Comunicação");
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Comunicação</h1>
      <p className="text-muted-foreground mt-2">
        Envie avisos, mensagens e gerencie a agenda escolar.
      </p>
    </div>
  );
};

export default Comunicacao;