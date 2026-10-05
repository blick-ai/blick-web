import { useState } from "react"
import StatusBar from "./statusBar"
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

function exibirOuNulo(valor) {
    return valor === null || valor === undefined || valor === ""
        ? "Nulo"
        : String(valor)
}

function formatarCoordenada(valor) {
    if (valor === null || valor === undefined || valor === "") return "Nulo"

    const numero = Number(valor)
    return Number.isFinite(numero) ? numero.toFixed(6) : "Nulo"
}

function formatarDataSegura(timestamp, formatador) {
    if (timestamp === null || timestamp === undefined || timestamp === "") {
        return "Nulo"
    }

    try {
        return formatador(timestamp) || "Nulo"
    } catch {
        return "Nulo"
    }
}

function obterStatusInfoSeguro(statusGeral) {
    if (!statusGeral) {
        return {
            label: "Nulo",
            color: "#8A898B",
            bg: "rgba(138,137,139,0.15)",
        }
    }

    try {
        return (
            statusInfo(statusGeral) ?? {
                label: exibirOuNulo(statusGeral),
                color: "#8A898B",
                bg: "rgba(138,137,139,0.15)",
            }
        )
    } catch {
        return {
            label: exibirOuNulo(statusGeral),
            color: "#8A898B",
            bg: "rgba(138,137,139,0.15)",
        }
    }
}

export default function PlantHighlight({
    captura,
    carregando,
    erro,
    onExcluida,
    onSessaoExpirada,
    onFechar,
    onExibirNoMapa,
}) {
    const { mostrarToast } = useToast()
    const [excluindo, setExcluindo] = useState(false)
    const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false)

    if (!captura) return null

    const capturaId = captura.capturaId ?? captura.captura_id
    const timestamp =
        captura.timestamp ?? captura.capturadoEm ?? captura.capturado_em
    const status =
        captura.status ?? captura.statusProcessamento ?? captura.status_processamento
    const diagnostico = captura.diagnostico ?? {}
    const localizacao = captura.localizacao ?? {}
    const statusGeral =
        captura.statusGeral ??
        captura.status_geral ??
        diagnostico.status
    const confiancaStatusGeral =
        captura.confiancaStatusGeral ??
        captura.confianca_status_geral ??
        diagnostico.confianca
    const subtipo = captura.subtipo
    const latitude = captura.latitude ?? localizacao.latitude
    const longitude = captura.longitude ?? localizacao.longitude
    const imagemUrl = captura.imagemUrl ?? captura.imagem_url
    const erroDetalhes = captura.erroDetalhes ?? captura.erro_detalhes
    const alertaEmitido =
        captura.alertaEmitido ??
        captura.alerta_emitido ??
        captura.alerta?.emitido
    const origem = captura.origem

    const { label, color, bg } = obterStatusInfoSeguro(statusGeral)
    const classificada = status === "CLASSIFICADO"
    const statusNormalizado = String(statusGeral ?? "").toLowerCase()
    const statusNaoSaudavel =
        statusNormalizado === "nao_saudavel" ||
        statusNormalizado === "não_saudável"
    const exibirAlerta = Boolean(alertaEmitido) && statusNaoSaudavel
    const coordenadas =
        latitude !== null &&
        latitude !== undefined &&
        latitude !== "" &&
        longitude !== null &&
        longitude !== undefined &&
        longitude !== ""

    async function handleConfirmarExclusao() {
        if (capturaId == null || timestamp == null) {
            mostrarToast(
                "erro",
                "Não é possível excluir: faltam os dados da captura.",
            )
            return
        }

        setExcluindo(true)
        try {
            await excluirCaptura(capturaId, timestamp)
            setMostrarConfirmacao(false)
            mostrarToast("sucesso", "Captura excluída com sucesso")
            onExcluida?.(capturaId)
        } catch (erroExclusao) {
            if (erroExclusao instanceof SessaoExpiradaError) {
                setMostrarConfirmacao(false)
                onSessaoExpirada?.()
            } else {
                setMostrarConfirmacao(false)
                mostrarToast(
                    "erro",
                    erroExclusao.message ||
                        "Não foi possível excluir esta captura.",
                )
            }
        } finally {
            setExcluindo(false)
        }
    }

    return (
        <div className="flex min-w-0 flex-1 flex-col gap-0">
            <div className="rounded-t-2xl border border-[#8A898B]/25 bg-[#1B2125] p-4">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <div
                                className="rounded-full border px-3 py-0.5 text-center"
                                style={{ backgroundColor: bg, borderColor: color }}
                            >
                                <p className="text-[10px] font-bold" style={{ color }}>
                                    ●{" "}
                                    {classificada
                                        ? label
                                        : LABEL_STATUS_PIPELINE[status] ??
                                          exibirOuNulo(status)}
                                </p>
                            </div>

                            {exibirAlerta && (
                                <div className="rounded-full border border-[#C75050] bg-[#C75050]/20 px-3 py-0.5 text-center">
                                    <p className="text-[10px] font-bold text-[#C75050]">
                                        ⚠ ALERTA EMITIDO
                                    </p>
                                </div>
                            )}

                            <div
                                className={`rounded-full border px-3 py-0.5 text-center ${
                                    origem === "manual"
                                        ? "border-[#4A9B9A] bg-[#4A9B9A]/20"
                                        : "border-[#8A898B]/40 bg-[#8A898B]/20"
                                }`}
                            >
                                <p
                                    className={`text-[10px] font-bold ${
                                        origem === "manual"
                                            ? "text-[#4A9B9A]"
                                            : "text-[#8A898B]"
                                    }`}
                                >
                                    {origem === "manual"
                                        ? "CAPTURA MANUAL"
                                        : origem
                                          ? "CAPTURA DO ROVER"
                                          : "Origem: Nulo"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => onExibirNoMapa?.(captura)}
                                disabled={!coordenadas}
                                title={
                                    coordenadas
                                        ? "Exibir esta captura no mapa"
                                        : "Esta captura não possui coordenadas"
                                }
                                className="rounded-lg border border-[#4A9B9A]/50 px-3 py-1 text-xs font-bold text-[#4A9B9A] transition-colors hover:bg-[#4A9B9A]/10 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Exibir no mapa
                            </button>

                            <button
                                type="button"
                                onClick={onFechar}
                                title="Fechar"
                                aria-label="Fechar modal"
                                className="shrink-0 p-1 text-[#8A898B] transition-colors hover:text-white"
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M6 6L18 18M6 18L18 6"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <img src={cameraGray} alt="" className="h-4 w-4" />
                        <p className="font-bold uppercase text-white">
                            Captura {exibirOuNulo(capturaId)} —{" "}
                            {formatarDataSegura(timestamp, formatarData)}{" "}
                            {formatarDataSegura(timestamp, formatarHora)}
                        </p>
                    </div>

                    <div className="text-sm text-[#8A898B]">
                        <p>ID da captura: {exibirOuNulo(capturaId)}</p>
                    </div>

                    {coordenadas ? (
                        <div className="flex flex-wrap items-center gap-2 text-sm text-[#8A898B]">
                            <img
                                src={locationPin}
                                alt=""
                                className="h-4 w-4 shrink-0"
                            />
                            <p>
                                {formatarCoordenada(latitude)},{" "}
                                {formatarCoordenada(longitude)}
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-[#8A898B]">
                            Coordenadas: Nulo
                        </p>
                    )}

                    {carregando && (
                        <p className="text-xs text-[#8A898B]" role="status">
                            Atualizando informações…
                        </p>
                    )}

                    {erro && (
                        <p className="text-xs text-[#D4A34A]" role="alert">
                            {erro}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-col items-center justify-center border border-t-0 border-[#8A898B]/25 bg-[#1B2125] p-4">
                <img
                    src={
                        typeof imagemUrl === "string" && imagemUrl
                            ? imagemUrl
                            : plantPlaceholder
                    }
                    alt={`Imagem da captura ${exibirOuNulo(capturaId)}`}
                    onError={(evento) => {
                        evento.currentTarget.src = plantPlaceholder
                    }}
                    className="h-auto w-full rounded-2xl object-cover sm:w-40 md:w-full"
                />
                {!imagemUrl && (
                    <p className="mt-2 text-xs text-[#8A898B]">Imagem: Nulo</p>
                )}
            </div>

            <div className="border border-t-0 border-[#8A898B]/25 bg-[#1B2125] p-4">
                {classificada ? (
                    <div className="flex w-full flex-col gap-3">
                        <p className="font-bold text-[#8A898B]">ESTADO DA PLANTA</p>

                        {statusGeral ? (
                            <StatusBar
                                statusGeral={statusGeral}
                                confianca={confiancaStatusGeral}
                                size="lg"
                            />
                        ) : (
                            <p className="text-sm text-white">Saúde: Nulo</p>
                        )}

                        <p className="text-sm text-[#8A898B]">
                            Confiança: {exibirOuNulo(confiancaStatusGeral)}
                        </p>

                        {subtipo != null && subtipo !== "" && (
                            <p className="text-sm text-[#8A898B]">
                                Subtipo identificado:{" "}
                                <span className="text-white">{subtipo}</span>
                            </p>
                        )}

                        {exibirAlerta && (
                            <div className="flex flex-col gap-1 rounded-xl border border-[#C75050] bg-[#C75050]/10 p-3">
                                <p className="text-sm font-bold text-[#C75050]">
                                    ⚠ Alerta —{" "}
                                    {LABEL_CLASSE[statusNormalizado] ??
                                        exibirOuNulo(statusGeral)}{" "}
                                    detectado
                                </p>
                                <p className="text-xs text-[#8A898B]">
                                    Recomenda-se uma inspeção visual no local para
                                    confirmar a extensão do problema e decidir se é
                                    necessária alguma ação.
                                </p>
                            </div>
                        )}

                        {statusNormalizado === "nao_milho" && (
                            <div className="flex flex-col gap-1 rounded-xl border border-[#8A898B]/40 bg-[#2A2D31] p-3">
                                <p className="text-sm font-bold text-[#8A898B]">
                                    ℹ Esta captura pode ser ignorada
                                </p>
                                <p className="text-xs text-[#8A898B]">
                                    O modelo não identificou uma planta de milho válida
                                    nesta imagem.
                                </p>
                            </div>
                        )}

                        <p className="text-sm text-[#8A898B]">
                            Classificação gerada pelo modelo de visão computacional
                            a partir desta captura.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <p className="font-bold text-[#8A898B]">
                            STATUS DA CLASSIFICAÇÃO
                        </p>
                        <p className="text-sm text-white">
                            {status === "PENDENTE"
                                ? "Esta captura ainda não foi classificada pelo modelo."
                                : status === "ERRO"
                                  ? "A classificação desta captura falhou."
                                  : "Status: Nulo"}
                        </p>
                        {status === "ERRO" && (
                            <p className="break-words font-mono text-xs text-[#C75050]">
                                {exibirOuNulo(erroDetalhes)}
                            </p>
                        )}
                        <p className="text-sm text-[#8A898B]">
                            Saúde: {exibirOuNulo(statusGeral)}
                        </p>
                        <p className="text-sm text-[#8A898B]">
                            Confiança: {exibirOuNulo(confiancaStatusGeral)}
                        </p>
                    </div>
                )}
            </div>

            <div className="flex justify-end rounded-b-2xl border border-t-0 border-[#8A898B]/25 bg-[#1B2125] p-4">
                <button
                    type="button"
                    onClick={() => setMostrarConfirmacao(true)}
                    disabled={
                        excluindo || capturaId == null || timestamp == null
                    }
                    title="Excluir esta captura"
                    className="flex items-center gap-2 text-xs font-bold text-[#8A898B] transition-colors hover:text-[#C75050] disabled:opacity-40"
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                    >
                        <path
                            d="M3 6H5H21"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M19 6V20C19 21.1 18.1 22 17 22H7C5.9 22 5 21.1 5 20V6M8 6V4C8 2.9 8.9 2 10 2H14C15.1 2 16 2.9 16 4V6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    Excluir captura
                </button>
            </div>

            {mostrarConfirmacao && (
                <ConfirmModal
                    titulo="Excluir captura"
                    mensagem={`Tem certeza que deseja excluir a captura ${exibirOuNulo(capturaId)}? Essa ação não pode ser desfeita.`}
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