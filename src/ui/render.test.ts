import { describe, expect, it } from "vitest";
import { renderPagination } from "./render";

describe("renderPagination", () => {
  it("renderiza los controles de navegación y la información de página", () => {
    const container = { innerHTML: "" } as unknown as HTMLElement;

    renderPagination(5, 12, 240, container);

    expect(container.innerHTML).toContain("Página 5 de 12");
    expect(container.innerHTML).toContain('data-page="4"');
    expect(container.innerHTML).toContain('data-page="6"');
    expect(container.innerHTML).toContain("Siguiente");
  });
});
