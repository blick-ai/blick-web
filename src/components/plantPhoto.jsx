import cameraGray from "../assets/images/camera-gray.png"
import plantPlaceholder from "../assets/images/plant-placeholder.png"
import { formatarHora, formatarData, statusInfo } from "../utils/status"
import locationPin from "../assets/images/location-pin.png"

const LABEL_STATUS_PIPELINE = {
    PENDENTE: "Pendente",
    CLASSIFICADO: "Classificada",
    ERRO: "Erro na classificação",
}

export default function PlantPhoto({
    timestamp,
    status,
    statusGeral,
    latitude,
    longitude,
    alertaEmitido,
    imagemUrl,
    origem,
    selected,
    onSelect,
}) {
    const pendenteOuErro = status !== "CLASSIFICADO"
    const { label, color } = statusInfo(statusGeral)

    return (
        <div
            onClick={onSelect}
            className={`bg-[#1B2125] border flex flex-row rounded-2xl p-3 sm:p-4 gap-3 sm:gap-4 items-center w-full cursor-pointer transition-colors duration-150 ${selected ? "border-[#4A9B9A]" : "border-[#8A898B]/25 hover:border-white"}`}
        >
            <img
                src={imagemUrl || plantPlaceholder}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0"
                loading="lazy"
            />
            <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex flex-row justify-between items-center gap-2">
                    <div className="flex flex-row gap-2 items-center min-w-0">
                        <img src={cameraGray} className="w-4 h-4 shrink-0" />
                        <p className="text-white font-bold uppercase truncate">{formatarData(timestamp)} - {formatarHora(timestamp)}</p>
                        {alertaEmitido && (
                            <span className="bg-[#C75050]/20 text-[#C75050] text-[9px] font-bold rounded-full px-2 py-0.5 shrink-0">
                                ALERTA
                            </span>
                        )}
                        <span
                            className={`text-[9px] font-bold rounded-full px-2 py-0.5 shrink-0 ${origem === "manual"
                                    ? "bg-[#4A9B9A]/20 text-[#4A9B9A]"
                                    : "bg-[#8A898B]/20 text-[#8A898B]"
                                }`}
                        >
                            {origem === "manual" ? "📷 MANUAL" : "🚜 ROVER"}
                        </span>
                    </div>
                </div>
                <div className="flex flex-row flex-wrap gap-x-2 gap-y-0.5 text-white text-ss sm:text-sm">
                    {latitude != null && longitude != null && (
                        <>
                        <img src={locationPin} className="w-4 h-4 shrink-0" />
                            <p>{latitude.toFixed(4)}, {longitude.toFixed(4)}</p>
                        </>
                    )}
                </div>
                <div className="flex flex-row gap-3 items-center">
                    {pendenteOuErro ? (
                        <p className="text-[#8A898B] text-xs font-bold flex-1">
                            {LABEL_STATUS_PIPELINE[status] || status}
                        </p>
                    ) : (
                        <p className="text-sm font-bold flex-1" style={{ color }}>
                            {label}
                        </p>
                    )}
                    <p className="text-[#8A898B] text-2xl font-bold shrink-0">&gt;</p>
                </div>
            </div>
        </div>
    )
}