import { useState } from "react"
import StatusBar from "./statusBar"
import VitalCard from "./vitalCard"
import ConfirmModal from "./confirmModal"
import plantPlaceholder from "../assets/images/plant-placeholder.png"
import cameraGray from "../assets/images/camera-gray.png"
import locationPin from "../assets/images/location-pin.png"
import { statusInfo, formatarHora, formatarData } from "../utils/status"
import { excluirCaptura, SessaoExpiradaError } from "../services/api"
import { useToast } from "../contexts/toastContext"

const LABEL_STATUS_PIPELINE = {
    PENDENTE: "Pendente de classificação",
    CLASSIFICADO: "Classificada",
    ERRO: "Falha na classificação",
}

const LABEL_CLASSE = {
    saudavel: "Saudável",
    nao_saudavel: "Não saudável",
    nao_milho: "Não é milho",
}

export default function PlantHighlight({ captura, carregando, erro, onExcluida, onSessaoExpirada, onFechar }) {
    const { mostrarToast } = useToast()
    const [excluindo, setExcluindo] = useState(false)
    const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false)
    if (carregando) {
        return (
            <div className="bg-[#1B2125] border border-[#8A898B]/25 rounded-2xl p-8 flex items-center justify-center flex-1">
                <p className="text-[#8A898B] text-sm">Carregando detalhes da captura…</p>
            </div>
        )
    }

    if (erro) {
        return (
            <div className="bg-[#1B2125] border border-[#8A898B]/25 rounded-2xl p-8 flex items-center justify-center flex-1">
                <p className="text-[#C75050] text-sm">{erro}</p>
            </div>
        )
    }

    if (!captura) return null

    const {
        capturaId,
        timestamp,
        status,
        statusGeral,
        confiancaStatusGeral,
        subtipo,
        probabilidades,
        latitude,
        longitude,
        imagemUrl,
        erroDetalhes,
        alertaEmitido,
        origem,
    } = captura

    const { label, color, bg } = statusInfo(statusGeral)
    const classificada = status === "CLASSIFICADO"

    async function handleConfirmarExclusao() {
        setExcluindo(true)
        try {
            await excluirCaptura(capturaId, timestamp)
            setMostrarConfirmacao(false)
            mostrarToast("sucesso", "Captura excluída com sucesso")
            onExcluida?.(capturaId)
        } catch (erro) {
            if (erro instanceof SessaoExpiradaError) {
                setMostrarConfirmacao(false)
                onSessaoExpirada?.()
            } else {
                setMostrarConfirmacao(false)
                mostrarToast("erro", erro.message || "Não foi possível excluir esta captura.")
            }
        } finally {
            setExcluindo(false)
        }
    }

    return (
        <div className="flex flex-col flex-1 min-w-0 gap-0">
            <div className="bg-[#1B2125] border border-[#8A898B]/25 rounded-t-2xl p-4">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-row justify-between items-start flex-wrap gap-2">
                        <div className="flex flex-row gap-2 items-center flex-wrap">
                            <div className="border rounded-full py-0.5 px-3 text-center" style={{ backgroundColor: bg, borderColor: color }}>
                                <p className="font-bold text-[10px]" style={{ color }}>
                                    ● {classificada ? label : LABEL_STATUS_PIPELINE[status] || status}
                                </p>
                            </div>
                            {alertaEmitido && (
                                <div className="border rounded-full py-0.5 px-3 text-center bg-[#C75050]/20 border-[#C75050]">
                                    <p className="font-bold text-[10px] text-[#C75050]">⚠ ALERTA EMITIDO</p>
                                </div>
                            )}
                            <div
                                className={`border rounded-full py-0.5 px-3 text-center ${origem === "manual"
                                        ? "bg-[#4A9B9A]/20 border-[#4A9B9A]"
                                        : "bg-[#8A898B]/20 border-[#8A898B]/40"
                                    }`}
                            >
                                <p className={`font-bold text-[10px] ${origem === "manual" ? "text-[#4A9B9A]" : "text-[#8A898B]"}`}>
                                    {origem === "manual" ? "📷 CAPTURA MANUAL" : "🚜 CAPTURA DO ROVER"}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onFechar}
                            title="Fechar"
                            className="text-[#8A898B] hover:text-white transition-colors shrink-0 p-1"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex flex-row gap-2 items-center">
                        <img src={cameraGray} className="w-4 h-4" />
                        <p className="text-white font-bold uppercase">Captura {formatarData(timestamp)} - {formatarHora(timestamp)}</p>
                    </div>
                    {latitude != null && longitude != null && (
                        <div className="flex flex-row gap-2 text-[#8A898B] text-sm items-center flex-wrap">
                            <img src={locationPin} className="w-4 h-4 shrink-0" />
                            <p>{latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-[#1B2125] border border-t-0 border-[#8A898B]/25 p-4 flex flex-col items-center justify-center">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                    <img
                        src={imagemUrl || plantPlaceholder}
                        className="w-full sm:w-40 md:w-100 h-auto rounded-2xl object-cover"
                    />
                </div>
            </div>

            {classificada && probabilidades && (
                <div className="bg-[#1B2125] border border-t-0 border-[#8A898B]/25 p-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-3 w-full">
                        {classificada ? (
                            <>
                                <p className="text-[#8A898B] font-bold">ESTADO DA PLANTA</p>
                                <StatusBar statusGeral={statusGeral} confianca={confiancaStatusGeral} size="lg" />
                                {subtipo && (
                                    <p className="text-[#8A898B] text-sm">Subtipo identificado: <span className="text-white">{subtipo}</span></p>
                                )}

                                {alertaEmitido && (
                                    <div className="bg-[#C75050]/10 border border-[#C75050] rounded-xl p-3 flex flex-col gap-1">
                                        <p className="text-[#C75050] font-bold text-sm">⚠ Alerta — {LABEL_CLASSE[statusGeral] || statusGeral} detectado</p>
                                        <p className="text-[#8A898B] text-xs">
                                            Recomenda-se uma inspeção visual no local pra confirmar a extensão do
                                            problema e decidir se é necessária alguma ação (tratamento, isolamento
                                            da área, etc.).
                                        </p>
                                    </div>
                                )}

                                {statusGeral === "nao_milho" && (
                                    <div className="bg-[#2A2D31] border border-[#8A898B]/40 rounded-xl p-3 flex flex-col gap-1">
                                        <p className="text-[#8A898B] font-bold text-sm">ℹ Esta captura pode ser ignorada</p>
                                        <p className="text-[#8A898B] text-xs">
                                            O modelo não identificou uma planta de milho válida nesta imagem
                                            (câmera bloqueada, enquadramento fora da plantação, ou baixa qualidade).
                                            Não representa um problema real na lavoura.
                                        </p>
                                    </div>
                                )}

                                <p className="text-[#8A898B] text-sm">
                                    Classificação gerada pelo modelo de visão computacional a partir desta captura.
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-[#8A898B] font-bold">STATUS DA CLASSIFICAÇÃO</p>
                                <p className="text-white text-sm">
                                    {status === "PENDENTE"
                                        ? "Esta captura ainda não foi classificada pelo modelo."
                                        : "A classificação desta captura falhou."}
                                </p>
                                {status === "ERRO" && erroDetalhes && (
                                    <p className="text-[#C75050] text-xs font-mono wrap-break-word">{erroDetalhes}</p>
                                )}
                            </>
                        )}
                    </div>
                    </div>
                </div>
            )}

            <div className="bg-[#1B2125] border border-t-0 border-[#8A898B]/25 rounded-b-2xl p-4 flex justify-end">
                <button
                    type="button"
                    onClick={() => setMostrarConfirmacao(true)}
                    disabled={excluindo}
                    title="Excluir esta captura"
                    className="flex flex-row items-center gap-2 text-[#8A898B] hover:text-[#C75050] disabled:opacity-40 transition-colors text-xs font-bold"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M19 6V20C19 21.1 18.1 22 17 22H7C5.9 22 5 21.1 5 20V6M8 6V4C8 2.9 8.9 2 10 2H14C15.1 2 16 2.9 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Excluir captura
                </button>
            </div>

            {mostrarConfirmacao && (
                <ConfirmModal
                    titulo="Excluir captura"
                    mensagem={`Tem certeza que deseja excluir a captura ${capturaId}? Essa ação não pode ser desfeita — o registro e a imagem serão apagados permanentemente.`}
                    textoConfirmar="Excluir"
                    perigoso
                    carregando={excluindo}
                    onConfirmar={handleConfirmarExclusao}
                    onCancelar={() => setMostrarConfirmacao(false)}
                />
            )}
        </div>
    )
}