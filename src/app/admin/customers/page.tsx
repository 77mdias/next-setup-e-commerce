import AdminModulePlaceholder from "@/components/admin/AdminModulePlaceholder";

export default function AdminCustomersPage() {
  return (
    <AdminModulePlaceholder
      checklist={[
        "Busca por email ou nome com escopo administrativo consistente.",
        "Histórico básico de pedidos para suporte operacional.",
        "Exposição mínima de dados pessoais, preservando o contrato de segurança do painel.",
      ]}
      ctaHref="/admin"
      ctaLabel="Voltar ao dashboard"
      description="A navegação de clientes já está publicada no shell e pronta para receber a visão administrativa completa na task S06-OPS-003."
      eyebrow="Task seguinte: S06-OPS-003"
      title="Módulo de clientes em preparação"
    />
  );
}
