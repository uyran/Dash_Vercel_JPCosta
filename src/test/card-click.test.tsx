import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Card } from "@/routes/index";

const DETAIL = "BALAO_DE_DETALHE";

const setHover = (matches: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
};

const renderCard = () =>
  render(<Card label="Novas cidades" value="12" details={<p>{DETAIL}</p>} />);

const cartao = () => screen.getByRole("button", { name: "Novas cidades" });

const balaoAberto = async () => expect(await screen.findByText(DETAIL)).toBeInTheDocument();
const balaoFechado = async () =>
  await waitFor(() => expect(screen.queryByText(DETAIL)).not.toBeInTheDocument());

afterEach(() => setHover(false));

describe("Cartão clicável (balão de detalhes)", () => {
  it("com mouse: 1º clique abre, 2º clique fecha, 3º clique reabre", async () => {
    setHover(true);
    renderCard();

    fireEvent.click(cartao());
    await balaoAberto();

    fireEvent.click(cartao());
    await balaoFechado();

    fireEvent.click(cartao());
    await balaoAberto();
  });

  it("com mouse: depois de fechar por clique, mover o mouse sobre o cartão não reabre sozinho", async () => {
    setHover(true);
    renderCard();

    fireEvent.click(cartao());
    await balaoAberto();

    fireEvent.click(cartao());
    await balaoFechado();

    fireEvent.pointerMove(cartao());
    expect(screen.queryByText(DETAIL)).not.toBeInTheDocument();
  });

  it("com mouse: sair do cartão fecha e, ao voltar, o hover abre de novo", async () => {
    setHover(true);
    renderCard();

    fireEvent.click(cartao());
    await balaoAberto();

    fireEvent.pointerMove(cartao());
    fireEvent.pointerLeave(cartao());
    await balaoFechado();

    fireEvent.pointerEnter(cartao());
    fireEvent.pointerMove(cartao());
    await balaoAberto();
  });

  it("sem mouse (touch): cliques alternam abrir/fechar repetidamente", async () => {
    setHover(false);
    renderCard();

    fireEvent.click(cartao());
    await balaoAberto();

    fireEvent.click(cartao());
    await balaoFechado();

    fireEvent.click(cartao());
    await balaoAberto();
  });

  it("com mouse: um evento espúrio do Radix não fecha o balão aberto por clique e o 2º clique oculta", () => {
    vi.useFakeTimers();
    try {
      setHover(true);
      renderCard();
      const card = cartao();

      act(() => {
        card.focus();
      });
      fireEvent.click(card);
      expect(screen.queryByText(DETAIL)).toBeInTheDocument();

      act(() => {
        card.blur();
      });
      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(screen.queryByText(DETAIL)).toBeInTheDocument();

      act(() => {
        card.focus();
      });
      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(screen.queryByText(DETAIL)).toBeInTheDocument();

      fireEvent.click(card);
      expect(screen.queryByText(DETAIL)).not.toBeInTheDocument();

      fireEvent.click(card);
      expect(screen.queryByText(DETAIL)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
