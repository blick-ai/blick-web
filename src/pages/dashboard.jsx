import { useEffect, useRef, useState } from "react"
import Sidebar from "../components/sidebar"
import PhotoList from "../components/photoList"
import PhotoHeader from "../components/photoHeader"
import PlantHighlight from "../components/plantHighlight"
import FilterPanel from "../components/filterPanel"
import Pagination from "../components/pagination"
import SessaoExpiradaModal from "../components/sessaoExpiradaModal"
import UploadModal from "../components/uploadModal"
import {
    listarCapturas,
    obterCaptura,
    obterResumoGeral,
    SessaoExpiradaError,
} from "../services/api"

const TAMANHO_PAGINA = 8
const TAMANHO_PAGINA_NOTIFICACOES = 100
const STATUS_NOTIFICACAO = ["nao_saudavel", "nao_milho"]
const CHAVE_INICIO_NOTIFICACOES = "blick_inicio_notificacoes_v2"

const FILTROS_VAZIOS = {
    statusGeral: "",
    origem: "",
    dataInicio: "",
    dataFim: "",
}

function obterInicioNotificacoes() {
    try {
        const salvo = localStorage.getItem(CHAVE_INICIO_NOTIFICACOES)

        if (salvo && Number.isFinite(new Date(salvo).getTime())) {
            return salvo
        }

        const agora = new Date().toISOString()
        localStorage.setItem(CHAVE_INICIO_NOTIFICACOES, agora)
        return agora
    } catch {
        return new Date().toISOString()
    }
}

function idDaCaptura(captura) {
    return captura?.capturaId ?? captura?.captura_id ?? null
}

function timestampDaCaptura(captura) {
    return (
        captura?.timestamp ??
        captura?.capturadoEm ??
        captura?.capturado_em ??
        null
    )
}

function dataDeEntradaDaCaptura(captura) {
    return (
        captura?.criadoEm ??
        captura?.criado_em ??
        captura?.createdAt ??
        captura?.created_at ??
        captura?.dataCriacao ??
        captura?.data_criacao ??
        captura?.recebidoEm ??
        captura?.recebido_em ??
        timestampDaCaptura(captura)
    )
}

function capturasDaResposta(resposta) {
    if (Array.isArray(resposta)) return resposta
    if (Array.isArray(resposta?.capturas)) return resposta.capturas
    if (Array.isArray(resposta?.items)) return resposta.items
    if (Array.isArray(resposta?.data)) return resposta.data
    return []
}

function normalizarStatus(status) {
    return String(status ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\s-]+/g, "_")
}

function statusDaCaptura(captura) {
    return normalizarStatus(
        captura?.statusGeral ??
            captura?.status_geral ??
            captura?.diagnostico?.status,
    )
}

function chaveDaCaptura(captura) {
    const id = idDaCaptura(captura)
    const timestamp = timestampDaCaptura(captura)

    if (id == null && timestamp == null) return null
    return `${id ?? ""}-${timestamp ?? ""}`
}

function formatarDataNotificacao(timestamp) {
    if (!timestamp) return ""

    const data = new Date(timestamp)
    if (Number.isNaN(data.getTime())) return ""

    return data.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    })
}

async function listarCapturasPorStatus(statusGeral) {
    const primeiraResposta = await listarCapturas({
        pagina: 1,
        tamanhoPagina: TAMANHO_PAGINA_NOTIFICACOES,
        statusGeral,
    })

    const capturas = capturasDaResposta(primeiraResposta)
    const totalPaginasInformado = Number(primeiraResposta?.totalPaginas)
    const totalInformado = Number(primeiraResposta?.total)
    const totalPaginas =
        totalPaginasInformado > 0
            ? totalPaginasInformado
            : Math.ceil(totalInformado / TAMANHO_PAGINA_NOTIFICACOES)

    for (let paginaAtual = 2; paginaAtual <= totalPaginas; paginaAtual += 1) {
        const resposta = await listarCapturas({
            pagina: paginaAtual,
            tamanhoPagina: TAMANHO_PAGINA_NOTIFICACOES,
            statusGeral,
        })

        capturas.push(...capturasDaResposta(resposta))
    }

    return capturas
}

export default function Dashboard() {
    const [inicioNotificacoes] = useState(obterInicioNotificacoes)
    const [filtros, setFiltros] = useState(FILTROS_VAZIOS)
    const [pagina, setPagina] = useState(1)
    const [busca, setBusca] = useState("")
    const [capturas, setCapturas] = useState([])
    const [notificacoes, setNotificacoes] = useState([])
    const [total, setTotal] = useState(0)
    const [totalPaginas, setTotalPaginas] = useState(0)
    const [carregandoLista, setCarregandoLista] = useState(true)
    const [erroLista, setErroLista] = useState("")
    const [selecionada, setSelecionada] = useState(null)
    const [detalhe, setDetalhe] = useState(null)
    const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)
    const [erroDetalhe, setErroDetalhe] = useState("")
    const [sessaoExpirada, setSessaoExpirada] = useState(false)
    const [resumoGeral, setResumoGeral] = useState(null)
    const [carregandoResumo, setCarregandoResumo] = useState(true)
    const [refreshTick, setRefreshTick] = useState(0)
    const [mostrarUploadModal, setMostrarUploadModal] = useState(false)
    const [capturaParaMapa, setCapturaParaMapa] = useState(null)
    const [sidebarAberta, setSidebarAberta] = useState(false)
    const [notificacoesAbertas, setNotificacoesAbertas] = useState(false)
    const notificacoesRef = useRef(null)

    useEffect(() => {
        if (!notificacoesAbertas) return

        function fecharAoClicarFora(evento) {
            if (!notificacoesRef.current?.contains(evento.target)) {
                setNotificacoesAbertas(false)
            }
        }

        function fecharComEscape(evento) {
            if (evento.key === "Escape") {
                setNotificacoesAbertas(false)
            }
        }

        document.addEventListener("pointerdown", fecharAoClicarFora)
        document.addEventListener("keydown", fecharComEscape)

        return () => {
            document.removeEventListener("pointerdown", fecharAoClicarFora)
            document.removeEventListener("keydown", fecharComEscape)
        }
    }, [notificacoesAbertas])

    useEffect(() => {
        let cancelado = false

        async function carregarCapturas() {
            setCarregandoLista(true)
            setErroLista("")

            try {
                const resultado = await listarCapturas({
                    pagina,
                    tamanhoPagina: TAMANHO_PAGINA,
                    statusGeral: filtros.statusGeral || undefined,
                    origem: filtros.origem || undefined,
                    dataInicio: filtros.dataInicio || undefined,
                    dataFim: filtros.dataFim || undefined,
                })

                if (cancelado) return

                setCapturas(capturasDaResposta(resultado))
                setTotal(resultado?.total ?? 0)
                setTotalPaginas(resultado?.totalPaginas ?? 0)
            } catch (erro) {
                if (cancelado) return

                if (erro instanceof SessaoExpiradaError) {
                    setSessaoExpirada(true)
                    return
                }

                setErroLista(
                    erro.message || "Não foi possível carregar as capturas.",
                )
            } finally {
                if (!cancelado) setCarregandoLista(false)
            }
        }

        carregarCapturas()

        return () => {
            cancelado = true
        }
    }, [filtros, pagina, refreshTick])

    useEffect(() => {
        let cancelado = false

        async function carregarNotificacoes() {
            try {
                const grupos = await Promise.all(
                    STATUS_NOTIFICACAO.map(listarCapturasPorStatus),
                )

                if (cancelado) return

                const inicioMs = new Date(inicioNotificacoes).getTime()
                const unicas = new Map()

                grupos.flat().forEach((captura) => {
                    const status = statusDaCaptura(captura)
                    const origem = normalizarStatus(captura?.origem)
                    const dataEntrada = new Date(
                        dataDeEntradaDaCaptura(captura) ?? "",
                    ).getTime()

                    if (
                        !["manual", "rover"].includes(origem) ||
                        !STATUS_NOTIFICACAO.includes(status) ||
                        !Number.isFinite(dataEntrada) ||
                        dataEntrada < inicioMs
                    ) {
                        return
                    }

                    const chave = chaveDaCaptura(captura)

                    if (chave) {
                        unicas.set(chave, {
                            ...captura,
                            tipoAlerta: status,
                        })
                    }
                })

                setNotificacoes(
                    [...unicas.values()].sort(
                        (a, b) =>
                            new Date(timestampDaCaptura(b) || 0) -
                            new Date(timestampDaCaptura(a) || 0),
                    ),
                )
            } catch (erro) {
                if (cancelado) return

                if (erro instanceof SessaoExpiradaError) {
                    setSessaoExpirada(true)
                }
            }
        }

        carregarNotificacoes()
        const intervalo = window.setInterval(carregarNotificacoes, 65000)

        return () => {
            cancelado = true
            window.clearInterval(intervalo)
        }
    }, [inicioNotificacoes, refreshTick])

    useEffect(() => {
        let cancelado = false

        async function carregarResumo() {
            setCarregandoResumo(true)

            try {
                const resultado = await obterResumoGeral()
                if (!cancelado) setResumoGeral(resultado)
            } catch (erro) {
                if (cancelado) return

                if (erro instanceof SessaoExpiradaError) {
                    setSessaoExpirada(true)
                }
            } finally {
                if (!cancelado) setCarregandoResumo(false)
            }
        }

        carregarResumo()

        return () => {
            cancelado = true
        }
    }, [refreshTick])

    useEffect(() => {
        if (!selecionada) {
            setDetalhe(null)
            setErroDetalhe("")
            setCarregandoDetalhe(false)
            return
        }

        let cancelado = false

        async function carregarDetalhe() {
            setDetalhe(selecionada)
            setErroDetalhe("")

            const capturaId = idDaCaptura(selecionada)
            const timestamp = timestampDaCaptura(selecionada)
            const plantacaoId =
                selecionada.plantacaoId ?? selecionada.plantacao_id

            if (capturaId == null || timestamp == null) {
                setCarregandoDetalhe(false)
                setErroDetalhe(
                    "Não foi possível carregar os detalhes: faltam o ID ou o timestamp da captura.",
                )
                return
            }

            setCarregandoDetalhe(true)

            try {
                const resposta = await obterCaptura(
                    capturaId,
                    timestamp,
                    plantacaoId,
                )

                if (cancelado) return

                const resultado =
                    resposta?.captura ?? resposta?.data ?? resposta ?? {}

                const camposPresentes = Object.fromEntries(
                    Object.entries(resultado).filter(
                        ([, valor]) =>
                            valor !== undefined && valor !== null && valor !== "",
                    ),
                )

                setDetalhe({ ...selecionada, ...camposPresentes })
            } catch (erro) {
                if (cancelado) return

                if (erro instanceof SessaoExpiradaError) {
                    setSessaoExpirada(true)
                    return
                }

                setErroDetalhe(
                    erro.message ||
                        "Não foi possível carregar os detalhes desta captura.",
                )
            } finally {
                if (!cancelado) setCarregandoDetalhe(false)
            }
        }

        carregarDetalhe()

        return () => {
            cancelado = true
        }
    }, [selecionada])

    function handleFiltrosChange(novosFiltros) {
        setFiltros(novosFiltros)
        setPagina(1)
    }

    function handleLimparFiltros() {
        setFiltros(FILTROS_VAZIOS)
        setPagina(1)
    }

    function handleSelecionarCapturaNoMapa(capturaDoMapa) {
        setSelecionada(capturaDoMapa)
    }

    function handleExibirNoMapa(captura) {
        setCapturaParaMapa({
            captura,
            chave: `${idDaCaptura(captura) ?? ""}-${Date.now()}`,
        })
        setSidebarAberta(true)
        setSelecionada(null)
    }

    function handleSelecionarNotificacao(captura) {
        setNotificacoesAbertas(false)
        setSelecionada(captura)
    }

    const capturasFiltradas = busca
        ? capturas.filter((captura) =>
              String(idDaCaptura(captura) ?? "")
                  .toLowerCase()
                  .includes(busca.toLowerCase()),
          )
        : capturas

    return (
        <div className="flex min-h-screen flex-row items-stretch bg-[#16191C]">
            {sessaoExpirada && <SessaoExpiradaModal />}

            <Sidebar
                resumo={resumoGeral}
                carregandoResumo={carregandoResumo}
                capturaParaMapa={capturaParaMapa}
                onSelecionarCapturaNoMapa={handleSelecionarCapturaNoMapa}
                aberto={sidebarAberta}
                onOpenChange={setSidebarAberta}
            />

            <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 pt-20 md:p-6 md:pt-6">
                <PhotoHeader
                    total={total}
                    busca={busca}
                    onBuscaChange={setBusca}
                    filtroSlot={
                        <div className="flex items-center gap-2">
                            <div className="relative" ref={notificacoesRef}>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setNotificacoesAbertas(
                                            (abertas) => !abertas,
                                        )
                                    }
                                    aria-label={`Abrir notificações${notificacoes.length ? ` (${notificacoes.length})` : ""}`}
                                    aria-expanded={notificacoesAbertas}
                                    className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#8A898B]/30 bg-[#1B2125] text-[#E6E6E6] transition-colors hover:bg-[#252C31]"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        className="h-5 w-5"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>

                                    {notificacoes.length > 0 && (
                                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C75050] px-1 text-[10px] font-bold text-white">
                                            {notificacoes.length > 9
                                                ? "9+"
                                                : notificacoes.length}
                                        </span>
                                    )}
                                </button>

                                {notificacoesAbertas && (
                                    <div
                                        role="dialog"
                                        aria-label="Notificações"
                                        className="absolute left-0 top-full z-[60] mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[#8A898B]/25 bg-[#1B2125] shadow-xl"
                                    >
                                        <div className="flex items-center justify-between border-b border-[#8A898B]/20 px-4 py-3">
                                            <h2 className="text-sm font-bold text-white">
                                                Notificações
                                            </h2>
                                            <span className="text-xs text-[#8A898B]">
                                                {notificacoes.length}
                                            </span>
                                        </div>

                                        {notificacoes.length === 0 ? (
                                            <p className="px-4 py-5 text-sm text-[#8A898B]">
                                                Nenhuma notificação nova.
                                            </p>
                                        ) : (
                                            <ul className="max-h-80 overflow-y-auto">
                                                {notificacoes.map(
                                                    (captura, indice) => {
                                                        const capturaId =
                                                            idDaCaptura(captura)
                                                        const timestamp =
                                                            timestampDaCaptura(
                                                                captura,
                                                            )
                                                        const alertaNaoMilho =
                                                            captura.tipoAlerta ===
                                                            "nao_milho"

                                                        return (
                                                            <li
                                                                key={
                                                                    chaveDaCaptura(
                                                                        captura,
                                                                    ) ?? indice
                                                                }
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleSelecionarNotificacao(
                                                                            captura,
                                                                        )
                                                                    }
                                                                    className="flex w-full flex-col gap-1 border-b border-[#8A898B]/10 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[#252C31]"
                                                                >
                                                                    <span
                                                                        className={`text-sm font-semibold ${
                                                                            alertaNaoMilho
                                                                                ? "text-[#D4A34A]"
                                                                                : "text-[#E05A56]"
                                                                        }`}
                                                                    >
                                                                        {alertaNaoMilho
                                                                            ? "Imagem identificada como não sendo milho"
                                                                            : "Planta não saudável detectada"}
                                                                    </span>
                                                                    <span className="text-xs text-[#D4D6D8]">
                                                                        Captura{" "}
                                                                        {capturaId ??
                                                                            "sem ID"}
                                                                    </span>
                                                                    {formatarDataNotificacao(
                                                                        timestamp,
                                                                    ) && (
                                                                        <span className="text-xs text-[#8A898B]">
                                                                            {formatarDataNotificacao(
                                                                                timestamp,
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            </li>
                                                        )
                                                    },
                                                )}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>

                            <FilterPanel
                                filtros={filtros}
                                onChange={handleFiltrosChange}
                                onLimpar={handleLimparFiltros}
                                onCarregarCaptura={() =>
                                    setMostrarUploadModal(true)
                                }
                            />
                        </div>
                    }
                />

                <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
                    <PhotoList
                        capturas={capturasFiltradas}
                        selectedId={idDaCaptura(selecionada)}
                        onSelect={setSelecionada}
                        carregando={carregandoLista}
                        erro={erroLista}
                    />

                    <Pagination
                        paginaAtual={pagina}
                        totalPaginas={totalPaginas}
                        onChange={setPagina}
                        carregando={carregandoLista}
                    />
                </div>
            </main>

            {selecionada && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="fixed inset-0 bg-black/60"
                        onClick={() => setSelecionada(null)}
                    />

                    <div className="relative flex h-full w-full flex-col overflow-hidden border border-[#8A898B]/25 bg-[#16191C] sm:h-auto sm:max-h-[90vh] sm:w-[90vw] sm:max-w-2xl sm:rounded-2xl">
                        <div className="custom-scrollbar flex-1 overflow-y-auto">
                            <PlantHighlight
                                captura={detalhe ?? selecionada}
                                carregando={carregandoDetalhe}
                                erro={erroDetalhe}
                                onExibirNoMapa={handleExibirNoMapa}
                                onExcluida={() => {
                                    setSelecionada(null)
                                    setRefreshTick((tick) => tick + 1)
                                }}
                                onSessaoExpirada={() => setSessaoExpirada(true)}
                                onFechar={() => setSelecionada(null)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {mostrarUploadModal && (
                <UploadModal
                    onFechar={() => setMostrarUploadModal(false)}
                    onSucesso={() => setRefreshTick((tick) => tick + 1)}
                    onSessaoExpirada={() => setSessaoExpirada(true)}
                />
            )}
        </div>
    )
}