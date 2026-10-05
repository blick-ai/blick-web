import { useEffect, useState } from "react"
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

const FILTROS_VAZIOS = {
    statusGeral: "",
    origem: "",
    dataInicio: "",
    dataFim: "",
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

function capturasDaResposta(resposta) {
    if (Array.isArray(resposta)) return resposta
    if (Array.isArray(resposta?.capturas)) return resposta.capturas
    if (Array.isArray(resposta?.items)) return resposta.items
    return []
}

export default function Dashboard() {
    const [filtros, setFiltros] = useState(FILTROS_VAZIOS)
    const [pagina, setPagina] = useState(1)
    const [busca, setBusca] = useState("")
    const [capturas, setCapturas] = useState([])
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
                    "Não foi possível carregar os detalhes: o ponto do mapa não contém o ID ou o timestamp da captura.",
                )
                return
            }

            setCarregandoDetalhe(true)

            try {
                // Busca diretamente o detalhe da captura selecionada no mapa.
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
        // Não altera a página nem procura a captura na lista.
        // A seleção abre o modal e dispara a consulta de detalhe.
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
                        <FilterPanel
                            filtros={filtros}
                            onChange={handleFiltrosChange}
                            onLimpar={handleLimparFiltros}
                            onCarregarCaptura={() => setMostrarUploadModal(true)}
                        />
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