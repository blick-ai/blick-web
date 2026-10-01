import { useEffect, useState } from "react"
import Sidebar from "../components/sidebar"
import PhotoList from "../components/photoList"
import PhotoHeader from "../components/photoHeader"
import PlantHighlight from "../components/plantHighlight"
import FilterPanel from "../components/filterPanel"
import Pagination from "../components/pagination"
import SessaoExpiradaModal from "../components/sessaoExpiradaModal"
import UploadModal from "../components/uploadModal"
import { listarCapturas, obterCaptura, obterCapturasDoCache, obterResumoGeral, obterPontosMapaCalor, SessaoExpiradaError } from "../services/api"

const TAMANHO_PAGINA = 8

const FILTROS_VAZIOS = { statusGeral: "", origem: "", dataInicio: "", dataFim: "" }

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
    const [pontosCalor, setPontosCalor] = useState([])
    const [carregandoPontosCalor, setCarregandoPontosCalor] = useState(true)
    const [refreshTick, setRefreshTick] = useState(0)
    const [mostrarUploadModal, setMostrarUploadModal] = useState(false)

    useEffect(() => {
        let cancelado = false

        const paramsBusca = {
            pagina,
            tamanhoPagina: TAMANHO_PAGINA,
            statusGeral: filtros.statusGeral || undefined,
            origem: filtros.origem || undefined,
            dataInicio: filtros.dataInicio || undefined,
            dataFim: filtros.dataFim || undefined,
        }

        const doCache = obterCapturasDoCache(paramsBusca)
        if (doCache) {
            setCapturas(doCache.capturas)
            setTotal(doCache.total)
            setTotalPaginas(doCache.totalPaginas)
            setErroLista("")
            setCarregandoLista(false)
        } else {
            setCarregandoLista(true)
            setErroLista("")
        }

        async function carregar() {
            try {
                const resultado = await listarCapturas(paramsBusca)
                if (cancelado) return
                setCapturas(resultado.capturas)
                setTotal(resultado.total)
                setTotalPaginas(resultado.totalPaginas)
            } catch (erro) {
                if (cancelado) return
                if (erro instanceof SessaoExpiradaError) {
                    setSessaoExpirada(true)
                    return
                }
                if (!doCache) {
                    setErroLista(erro.message || "Não foi possível carregar as capturas.")
                }
            } finally {
                if (!cancelado) setCarregandoLista(false)
            }
        }

        carregar()
        return () => { cancelado = true }
    }, [filtros, pagina, refreshTick])

    useEffect(() => {
        let cancelado = false

        async function carregarResumo() {
            setCarregandoResumo(true)
            try {
                const resultado = await obterResumoGeral()
                if (cancelado) return
                setResumoGeral(resultado)
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
        return () => { cancelado = true }
    }, [refreshTick])

    useEffect(() => {
        let cancelado = false

        async function carregarPontosCalor() {
            setCarregandoPontosCalor(true)
            try {
                const pontos = await obterPontosMapaCalor()
                if (cancelado) return
                setPontosCalor(pontos)
            } catch (erro) {
                if (cancelado) return
                if (erro instanceof SessaoExpiradaError) {
                    setSessaoExpirada(true)
                    return
                }
                setPontosCalor([])
            } finally {
                if (!cancelado) setCarregandoPontosCalor(false)
            }
        }

        carregarPontosCalor()
        return () => { cancelado = true }
    }, [refreshTick])

    useEffect(() => {
        if (!selecionada) {
            setDetalhe(null)
            setErroDetalhe("")
            return
        }

        let cancelado = false

        async function carregarDetalhe() {
            setCarregandoDetalhe(true)
            setErroDetalhe("")
            try {
                const resultado = await obterCaptura(selecionada.capturaId, selecionada.timestamp)
                if (cancelado) return
                setDetalhe(resultado)
            } catch (erro) {
                if (cancelado) return
                if (erro instanceof SessaoExpiradaError) {
                    setSessaoExpirada(true)
                    return
                }
                setErroDetalhe(erro.message || "Não foi possível carregar o detalhe desta captura.")
            } finally {
                if (!cancelado) setCarregandoDetalhe(false)
            }
        }

        carregarDetalhe()
        return () => { cancelado = true }
    }, [selecionada])

    function handleFiltrosChange(novosFiltros) {
        setFiltros(novosFiltros)
        setPagina(1)
    }

    function handleLimparFiltros() {
        setFiltros(FILTROS_VAZIOS)
        setPagina(1)
    }

    const capturasFiltradas = busca
        ? capturas.filter((c) => c.capturaId.toLowerCase().includes(busca.toLowerCase()))
        : capturas

    return (
        <div className="bg-[#16191C] flex flex-row min-h-screen items-stretch">
            {sessaoExpirada && <SessaoExpiradaModal />}
            <Sidebar
                resumo={resumoGeral}
                carregandoResumo={carregandoResumo}
                pontosCalor={pontosCalor}
                carregandoPontosCalor={carregandoPontosCalor}
            />
            <div className="flex flex-col gap-4 p-4 md:p-6 flex-1 min-w-0 pt-20 md:pt-6">
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
                <div className="flex flex-col gap-3 min-w-0 flex-1 min-h-0">
                    <PhotoList
                        capturas={capturasFiltradas}
                        selectedId={selecionada?.capturaId}
                        onSelect={setSelecionada}
                        carregando={carregandoLista}
                        erro={erroLista}
                    />
                    <Pagination paginaAtual={pagina} totalPaginas={totalPaginas} onChange={setPagina} />
                </div>
            </div>

            {selecionada && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/60" onClick={() => setSelecionada(null)} />
                    <div className="relative bg-[#16191C] flex flex-col w-full h-full sm:h-auto sm:max-h-[90vh] sm:w-[90vw] sm:max-w-2xl sm:rounded-2xl border border-[#8A898B]/25 overflow-hidden">
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <PlantHighlight
                                captura={detalhe}
                                carregando={carregandoDetalhe}
                                erro={erroDetalhe}
                                onExcluida={() => {
                                    setSelecionada(null)
                                    setRefreshTick((t) => t + 1)
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
                    onSucesso={() => setRefreshTick((t) => t + 1)}
                    onSessaoExpirada={() => setSessaoExpirada(true)}
                />
            )}
        </div>
    )
}