/* Balão de ajuda mostrado ao passar o mouse sobre os botões de ordenação
   das colunas de tabela. Posicionado abaixo do botão para não ser cortado
   pelos containers com overflow:auto. */
export function AjudaOrdem() {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-1/2 top-[calc(100%+6px)] z-50 -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-[11px] font-medium text-popover-foreground opacity-0 shadow-md transition-opacity delay-150 group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      Ordem crescente ou decrescente
    </span>
  );
}
