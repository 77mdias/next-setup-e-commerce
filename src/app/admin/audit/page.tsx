import AdminModulePlaceholder from "@/components/admin/AdminModulePlaceholder";

export default function AdminAuditPage() {
  return (
    <AdminModulePlaceholder
      checklist={[
        "Registro de eventos sensíveis com ator, recurso, quando e antes/depois.",
        "Consulta segura para ações críticas de pedidos, catálogo e clientes.",
        "Contrato pronto para suportar trilha de auditoria das mutações administrativas.",
      ]}
      ctaHref="/admin"
      ctaLabel="Voltar ao dashboard"
      description="A rota de auditoria entra no shell agora para manter a navegação operacional coesa. A trilha auditável completa será conectada ao módulo administrativo nas tasks seguintes."
      eyebrow="Task seguinte: S06-OPS-003"
      title="Módulo de auditoria em preparação"
    />
  );
}
