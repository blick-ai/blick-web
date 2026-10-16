import { useEffect, useRef, useState } from "react"
import { obterPontosMapaCalor } from "../services/api"

const LEAFLET_CSS =
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
const CLUSTER_CSS =
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.css"
const CLUSTER_DEFAULT_CSS =
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.css"
const LEAFLET_JS =
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"
const CLUSTER_JS =
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.js"

let leafletPromise

function adicionarCss(href) {
    if (document.querySelector(`link[href="${href}"]`)) return

    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = href
    document.head.appendChild(link)
}

function carregarScript(src) {
    return new Promise((resolve, reject) => {
        const existente = document.querySelector(`script[src="${src}"]`)

        if (existente?.dataset.loaded === "true") {
            resolve()
            return
        }

        const script = existente || document.createElement("script")

        script.addEventListener(
            "load",
            () => {
                script.dataset.loaded = "true"
                resolve()
            },
            { once: true },
        )
        script.addEventListener(
            "error",
            () => reject(new Error(`Falha ao carregar ${src}`)),
            { once: true },
        )

        if (!existente) {
            script.src = src
            script.async = true
            document.head.appendChild(script)
        }
    })
}

function carregarLeaflet() {
    if (!leafletPromise) {
        adicionarCss(LEAFLET_CSS)
        adicionarCss(CLUSTER_CSS)
        adicionarCss(CLUSTER_DEFAULT_CSS)

        leafletPromise = (async () => {
            await carregarScript(LEAFLET_JS)
            await carregarScript(CLUSTER_JS)

            if (!window.L?.markerClusterGroup) {
                throw new Error("Leaflet MarkerCluster não foi carregado.")
            }

            return window.L
        })().catch((erro) => {
            leafletPromise = null
            throw erro
        })
    }

    return leafletPromise
}

function obterLocalizacao(item) {
    return item?.localizacao ?? item?.localizacaoFoto ?? item?.localizacao_foto ?? {}
}

function obterLatitude(item) {
    const localizacao = obterLocalizacao(item)
    return item?.latitude ?? item?.lat ?? localizacao.latitude ?? null
}

function obterLongitude(item) {
    const localizacao = obterLocalizacao(item)
    return item?.longitude ?? item?.lng ?? item?.lon ?? localizacao.longitude ?? null
}

function coordenadaValida(item) {
    const latitude = Number(obterLatitude(item))
    const longitude = Number(obterLongitude(item))

    return (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
    )
}

function idDaCaptura(captura) {
    return captura?.capturaId ?? captura?.captura_id ?? null
}

function corDoMarcador(statusGeral) {
    const status = String(statusGeral ?? "").toLowerCase()

    if (status === "nao_saudavel" || status === "não_saudável") {
        return "#E05A56"
    }
    if (status === "saudavel" || status === "saudável") {
        return "#4A9B9A"
    }
    if (status === "nao_milho" || status === "não_milho") {
        return "#D6A84F"
    }
    return "#8A898B"
}

function conteudoPopup(texto) {
    const elemento = document.createElement("span")
    elemento.textContent = texto
    return elemento
}

export default function AffectedPlantsMap({
    plantacaoId,
    refreshKey = 0,
    capturaParaMapa,
    onSelecionarCaptura,
}) {
    const secaoRef = useRef(null)
    const mapaElement = useRef(null)
    const mapaRef = useRef(null)
    const clusterRef = useRef(null)
    const marcadorFocoRef = useRef(null)

    const [pontos, setPontos] = useState([])
    const [carregandoPontos, setCarregandoPontos] = useState(true)
    const [erroPontos, setErroPontos] = useState("")
    const [erroMapa, setErroMapa] = useState("")
    const [mapaPronto, setMapaPronto] = useState(false)

    useEffect(() => {
        let cancelado = false

        async function carregarPontos() {
            setCarregandoPontos(true)
            setErroPontos("")

            try {
                const resultado = await obterPontosMapaCalor(plantacaoId)
                if (cancelado) return

                setPontos(
                    (Array.isArray(resultado) ? resultado : []).filter(
                        coordenadaValida,
                    ),
                )
            } catch (erro) {
                if (cancelado) return

                setPontos([])
                setErroPontos(
                    erro.message || "Não foi possível carregar os pontos do mapa.",
                )
            } finally {
                if (!cancelado) setCarregandoPontos(false)
            }
        }

        carregarPontos()

        return () => {
            cancelado = true
        }
    }, [plantacaoId, refreshKey])

    useEffect(() => {
        let cancelado = false

        async function inicializarMapa() {
            try {
                const L = await carregarLeaflet()
                if (cancelado || !mapaElement.current) return

                const mapa = L.map(mapaElement.current, {
                    maxZoom: 21,
                    scrollWheelZoom: true,
                })

                mapaRef.current = mapa

                L.tileLayer(
                    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                    {
                        maxZoom: 21,
                        maxNativeZoom: 19,
                        attribution: "Imagens © Esri",
                    },
                ).addTo(mapa)

                const grupo = L.markerClusterGroup({
                    disableClusteringAtZoom: 20,
                    maxClusterRadius: 40,
                    showCoverageOnHover: false,
                })

                clusterRef.current = grupo
                mapa.addLayer(grupo)
                mapa.setView([-23.6471, -46.5744], 13)

                if (typeof ResizeObserver !== "undefined") {
                    const observer = new ResizeObserver(() => {
                        mapa.invalidateSize()
                    })

                    observer.observe(mapaElement.current)
                    mapa.once("unload", () => observer.disconnect())
                }

                setMapaPronto(true)
                window.setTimeout(() => mapa.invalidateSize(), 100)
            } catch (erro) {
                if (!cancelado) {
                    setErroMapa(
                        erro.message || "Não foi possível inicializar o mapa.",
                    )
                }
            }
        }

        inicializarMapa()

        return () => {
            cancelado = true
            clusterRef.current = null
            mapaRef.current?.remove()
            mapaRef.current = null
            marcadorFocoRef.current = null
            setMapaPronto(false)
        }
    }, [])

    useEffect(() => {
        if (!mapaPronto || !clusterRef.current || carregandoPontos) return

        const L = window.L
        const grupo = clusterRef.current
        grupo.clearLayers()

        const marcadores = pontos.map((ponto) => {
            const latitude = Number(obterLatitude(ponto))
            const longitude = Number(obterLongitude(ponto))
            const status =
                ponto.statusGeral ??
                ponto.status_geral ??
                ponto.diagnostico?.status
            const cor = corDoMarcador(status)

            const icone = L.divIcon({
                className: "",
                html: `<span style="display:block;width:14px;height:14px;border:2px solid white;border-radius:50%;background:${cor};box-shadow:0 1px 5px #0009"></span>`,
                iconSize: [14, 14],
                iconAnchor: [7, 7],
            })

            const marcador = L.marker([latitude, longitude], { icon: icone })

            marcador.on("click", () => {
                onSelecionarCaptura?.(ponto)
            })

            return marcador
        })

        grupo.addLayers(marcadores)

        if (marcadores.length && !capturaParaMapa) {
            mapaRef.current.fitBounds(grupo.getBounds(), {
                padding: [20, 20],
                maxZoom: 18,
            })
        }
    }, [
        pontos,
        carregandoPontos,
        mapaPronto,
        onSelecionarCaptura,
        capturaParaMapa,
    ])

    useEffect(() => {
        if (!capturaParaMapa || !mapaPronto || !mapaRef.current) return

        const captura = capturaParaMapa.captura ?? capturaParaMapa
        const latitude = Number(obterLatitude(captura))
        const longitude = Number(obterLongitude(captura))

        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            return
        }

        const L = window.L
        const mapa = mapaRef.current
        const id = idDaCaptura(captura)
        const textoPopup = id != null ? `Captura ${id}` : "Captura selecionada"

        window.setTimeout(() => {
            secaoRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            })
            mapa.invalidateSize()
            mapa.flyTo([latitude, longitude], Math.max(mapa.getZoom(), 18))

            if (marcadorFocoRef.current) {
                mapa.removeLayer(marcadorFocoRef.current)
            }

            marcadorFocoRef.current = L.circleMarker([latitude, longitude], {
                radius: 10,
                color: "#FFFFFF",
                weight: 3,
                fillColor: "#4A9B9A",
                fillOpacity: 1,
            })
                .addTo(mapa)
                .bindPopup(conteudoPopup(textoPopup))
                .openPopup()
        }, 350)
    }, [capturaParaMapa, mapaPronto])

    return (
        <section
            ref={secaoRef}
            className="flex w-full min-w-0 flex-col overflow-hidden rounded-xl border border-[#2A2F35] bg-[#16191D] text-[#E6E6E6]"
        >
            <div className="flex items-center justify-between gap-2 border-b border-[#2A2F35] px-3 py-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[#9AA3AB]">
                    Mapa de capturas
                </h2>
                <span className="text-xs text-[#7D868E]">
                    {pontos.length} posições
                </span>
            </div>

            <div className="relative h-[260px] min-h-[220px] w-full">
                <div ref={mapaElement} className="absolute inset-0" />

                {carregandoPontos && (
                    <p className="absolute left-2 top-2 z-[500] rounded bg-[#16191D]/90 px-2 py-1 text-xs">
                        Carregando pontos…
                    </p>
                )}

                {erroPontos && (
                    <p className="absolute left-2 right-2 top-2 z-[500] rounded bg-[#16191D]/90 px-2 py-1 text-xs text-[#E05A56]">
                        {erroPontos}
                    </p>
                )}

                {erroMapa && (
                    <p className="absolute left-2 right-2 top-2 z-[500] rounded bg-[#16191D]/90 px-2 py-1 text-xs text-[#E05A56]">
                        {erroMapa}
                    </p>
                )}
            </div>
        </section>
    )
}