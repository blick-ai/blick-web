import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { MemoryRouter } from "react-router"
import Dashboard from "../pages/dashboard"
import { ToastProvider } from "../contexts/toastContext"
import * as api from "../services/api"

// 1. Mock do localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}
vi.stubGlobal('localStorage', localStorageMock)

// 2. Mock da API
vi.mock("../services/api", () => {
    return {
        listarCapturas: vi.fn(),
        obterCaptura: vi.fn(),
        obterCapturasDoCache: vi.fn(),
        obterResumoGeral: vi.fn(),
        SessaoExpiradaError: class extends Error {}
    }
})

// 3. NOVO: Mock do componente PlantPhoto
// Assim a gente força ele a renderizar o ID na tela só durante o teste,
// sem precisar alterar o código original dos seus componentes visuais.
vi.mock("../components/plantPhoto", () => {
    return {
        default: ({ capturaId, onSelect }) => (
            <button onClick={onSelect} data-testid="mock-plant-photo">
                {capturaId}
            </button>
        )
    }
})

const RESPOSTA_LISTA = {
    capturas: [
        {
            capturaId: "20260801143755-32204d9f",
            timestamp: "2026-08-01T14:37:55Z",
            status: "CLASSIFICADO",
            statusGeral: "doenca",
            confiancaStatusGeral: 0.87,
            latitude: -23.5,
            longitude: -46.6,
            alertaEmitido: true,
        },
    ],
    pagina: 1,
    tamanhoPagina: 8,
    total: 1,
    totalPaginas: 1,
}

const RESPOSTA_DETALHE = {
    capturaId: "20260801143755-32204d9f",
    plantacaoId: "plantacao-mock-001",
    carrinhoId: "carrinho-mock-001",
    clienteId: "cliente-1",
    timestamp: "2026-08-01T14:37:55Z",
    status: "CLASSIFICADO",
    latitude: -23.5,
    longitude: -46.6,
    statusGeral: "doenca",
    confiancaStatusGeral: 0.87,
    subtipo: null,
    confiancaSubtipo: null,
    probabilidades: { saudavel: 0.05, praga: 0.08, doenca: 0.87, nao_milho: 0.0 },
    modeloVersaoBorda: "plants_v1.tflite",
    confiancaBorda: 0.97,
    imagemUrl: "https://fake-s3/foto.jpg",
    statusHistory: [],
    erroDetalhes: null,
    alertaEmitido: true,
    alertaEmitidoEm: "2026-08-01T14:38:00Z",
}

beforeEach(() => {
    localStorage.setItem("access_token", "token-fake")

    // Define os retornos do mock da API
    api.listarCapturas.mockResolvedValue(RESPOSTA_LISTA)
    api.obterCaptura.mockResolvedValue(RESPOSTA_DETALHE)
    api.obterResumoGeral.mockResolvedValue({}) 
    api.obterCapturasDoCache.mockReturnValue(null) 
})

afterEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
})

describe("Dashboard", () => {
    test("carrega a lista de capturas ao montar, sem buscar detalhe nenhum ainda", async () => {
        render(
            <ToastProvider>
                <MemoryRouter>
                    <Dashboard />
                </MemoryRouter>
            </ToastProvider>
        )

        await waitFor(() => {
            // Volta a procurar pelo ID, pois nosso mock do PlantPhoto agora renderiza ele!
            expect(screen.getByText(/20260801143755-32204d9f/i)).toBeDefined()
        })

        expect(api.obterCaptura).not.toHaveBeenCalled()
    })

    test("busca o detalhe somente quando o usuario clica na captura", async () => {
        render(
            <ToastProvider>
                <MemoryRouter>
                    <Dashboard />
                </MemoryRouter>
            </ToastProvider>
        )

        const item = await screen.findByText(/20260801143755-32204d9f/i)
        fireEvent.click(item)

        await waitFor(() => {
            expect(api.obterCaptura).toHaveBeenCalledTimes(1)
        })

        await waitFor(() => {
            // Verifica se o detalhe renderizou a porcentagem (PlantHighlight)
            expect(screen.getAllByText("87%").length).toBeGreaterThan(0)
        })
    })
})