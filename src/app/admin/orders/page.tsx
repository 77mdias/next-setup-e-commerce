import AdminModulePlaceholder from "@/components/admin/AdminModulePlaceholder";

export default function AdminOrdersPage() {
  return (
    <AdminModulePlaceholder
      checklist={[
        "Listagem com filtros operacionais por status, pagamento e janela.",
        "Detalhe do pedido com histórico e ações permitidas por papel.",
        "Estados seguros para exceções sem expor dados além do escopo da loja.",
      ]}
      ctaHref="/admin"
      ctaLabel="Voltar ao dashboard"
      description="A rota já existe dentro do shell administrativo para estabilizar a navegação da operação. A entrega funcional do módulo de pedidos entra na task S06-OPS-001."
      eyebrow="Task seguinte: S06-OPS-001"
      title="Módulo de pedidos em preparação"
    />
  );
}
