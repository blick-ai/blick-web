import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { MemoryRouter } from "react-router"
import Dashboard from "../pages/dashboard"

const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}

vi.stubGlobal("localStorage", localStorageMock)

beforeEach(() => {
    localStorage.setItem("access_token", "token-expirado")
})

afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
})

describe("Sessão expirada", () => {
    test("mostra o modal quando a API responde 401", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(() =>
                Promise.resolve({
                    ok: false,
                    status: 401,
                    json: () =>
                        Promise.resolve({ detail: "Not authenticated" }),
                }),
            ),
        )

        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>,
        )

        // Esse texto é exclusivo do modal; "Sessão expirada" também
        // pode aparecer na mensagem de erro do mapa.
        expect(
            await screen.findByText(/Fazer login novamente/i),
        ).toBeDefined()
    })
})