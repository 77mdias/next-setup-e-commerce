import AdminModulePlaceholder from "@/components/admin/AdminModulePlaceholder";

export default function AdminCatalogPage() {
  return (
    <AdminModulePlaceholder
      checklist={[
        "Listagem e edição de produtos com isolamento por loja.",
        "Gestão de imagens e persistência segura de mídia administrativa.",
        "Ajuste de estoque e categorias dentro do painel operacional.",
      ]}
      ctaHref="/admin"
      ctaLabel="Voltar ao dashboard"
      description="O shell já reserva a entrada do catálogo administrativo e evita links quebrados. A funcionalidade completa entra na task S06-OPS-002."
      eyebrow="Task seguinte: S06-OPS-002"
      title="Módulo de catálogo em preparação"
    />
  );
}
