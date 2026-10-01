import { useMemo } from "react"
import { STATUS_CONFIG } from "../utils/status"

const NUM_COLUNAS = 6
const COR_MIN = "#1B2125"
const COR_MAX = STATUS_CONFIG.doenca.color

function interpolarCor(corA, corB, t) {
    const hexParaRgb = (hex) => {
        const valor = hex.replace("#", "")
        return [0, 2, 4].map((i) => parseInt(valor.slice(i, i + 2), 16))
    }
    const [r1, g1, b1] = hexParaRgb(corA)
    const [r2, g2, b2] = hexParaRgb(corB)
    const r = Math.round(r1 + (r2 - r1) * t)
    const g = Math.round(g1 + (g2 - g1) * t)
    const b = Math.round(b1 + (b2 - b1) * t)
    return `rgb(${r}, ${g}, ${b})`
}

function montarGrade(pontos, numColunas) {
    const latitudes = pontos.map((p) => p.latitude)
    const longitudes = pontos.map((p) => p.longitude)

    const minLat = Math.min(...latitudes)
    const maxLat = Math.max(...latitudes)
    const minLng = Math.min(...longitudes)
    const maxLng = Math.max(...longitudes)
    const margemLat = (maxLat - minLat || 0.0005) * 0.1
    const margemLng = (maxLng - minLng || 0.0005) * 0.1
    const latInicio = minLat - margemLat
    const latFim = maxLat + margemLat
    const lngInicio = minLng - margemLng
    const lngFim = maxLng + margemLng
    const latSpan = latFim - latInicio
    const lngSpan = lngFim - lngInicio
    const numLinhas = Math.max(2, Math.min(10, Math.round(numColunas * (latSpan / lngSpan))))

    const celulas = Array.from({ length: numLinhas }, () => Array(numColunas).fill(0))

    for (const ponto of pontos) {
        let coluna = Math.floor(((ponto.longitude - lngInicio) / lngSpan) * numColunas)
        let linha = Math.floor(((latFim - ponto.latitude) / latSpan) * numLinhas) // norte (lat maior) fica em cima

        coluna = Math.min(numColunas - 1, Math.max(0, coluna))
        linha = Math.min(numLinhas - 1, Math.max(0, linha))

        celulas[linha][coluna] += 1
    }

    return celulas
}

export default function Heatmap({ pontos, carregando }) {
    const celulas = useMemo(() => {
        if (!pontos || pontos.length === 0) return null
        return montarGrade(pontos, NUM_COLUNAS)
    }, [pontos])

    const maxValor = useMemo(() => {
        if (!celulas) return 0
        return Math.max(1, ...celulas.flat())
    }, [celulas])

    if (carregando || !pontos) {
        return (
            <div className="bg-[#16191C] w-full border border-[#8A898B]/25 flex flex-col rounded-lg p-3 gap-2">
                <p className="text-[#8A898B] font-bold text-[10px]">LOCALIZAÇÃO DAS PLANTAS AFETADAS</p>
                <p className="text-[#8A898B] text-xs">Carregando…</p>
            </div>
        )
    }

    if (!celulas) {
        return (
            <div className="bg-[#16191C] w-full border border-[#8A898B]/25 flex flex-col rounded-lg p-3 gap-2">
                <p className="text-[#8A898B] font-bold text-[10px]">LOCALIZAÇÃO DAS PLANTAS AFETADAS</p>
                <p className="text-[#8A898B] text-xs">Nenhuma planta afetada localizada.</p>
            </div>
        )
    }

    const numLinhas = celulas.length
    const numColunas = celulas[0].length

    return (
        <div className="bg-[#16191C] w-full border border-[#8A898B]/25 flex flex-col rounded-lg p-3 gap-2">
            <p className="text-[#8A898B] font-bold text-[10px]">LOCALIZAÇÃO DAS PLANTAS AFETADAS</p>

            <div className="flex flex-row items-center gap-2">
                <span className="text-[9px] text-[#8A898B]">0</span>
                <div
                    className="flex-1 h-2 rounded-full"
                    style={{ background: `linear-gradient(to right, ${COR_MIN}, ${COR_MAX})` }}
                />
                <span className="text-[9px] text-[#8A898B]">{maxValor}</span>
            </div>

            <div
                className="grid gap-0.5 w-full"
                style={{
                    gridTemplateColumns: `repeat(${numColunas}, 1fr)`,
                    gridTemplateRows: `repeat(${numLinhas}, 1fr)`,
                    aspectRatio: `${numColunas} / ${numLinhas}`,
                }}
            >
                {celulas.flatMap((linha, indiceLinha) =>
                    linha.map((valor, indiceColuna) => {
                        const intensidade = valor / maxValor
                        return (
                            <div
                                key={`${indiceLinha}-${indiceColuna}`}
                                title={`${valor} planta${valor === 1 ? "" : "s"} afetada${valor === 1 ? "" : "s"}`}
                                className="rounded-xs flex items-center justify-center"
                                style={{ backgroundColor: interpolarCor(COR_MIN, COR_MAX, intensidade) }}
                            >
                                {valor > 0 && (
                                    <span className="text-[8px] font-bold text-white/80">{valor}</span>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}