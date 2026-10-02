import { render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { MemoryRouter } from "react-router"
import Dashboard from "../pages/dashboard"

// 1. Criamos a simulação do localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}
// 2. Injetamos globalmente no ambiente de teste
vi.stubGlobal('localStorage', localStorageMock)

beforeEach(() => {
    localStorage.setItem("access_token", "token-expirado")
})

afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
})

describe("Sessão expirada", () => {
    test("mostra o modal de sessão expirada quando a API responde 401", async () => {
        globalThis.fetch = vi.fn(() =>
            Promise.resolve({
                ok: false,
                status: 401,
                json: () => Promise.resolve({ detail: "Not authenticated" }),
            })
        )

        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText("Sessão expirada")).toBeDefined()
        })

        expect(screen.getByText(/Fazer login novamente/i)).toBeDefined()
    })
})