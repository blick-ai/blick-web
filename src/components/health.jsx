import healthIcon from "../assets/images/health.png"
import { STATUS_CONFIG } from "../utils/status"

function percentual(quantidade, total) {
    if (!total) return 0
    return Math.round((quantidade / total) * 100)
}

export default function Health({ resumo, carregando }) {
    if (carregando || !resumo) {
        return (
            <div className="bg-[#16191C] w-full border border-[#8A898B]/25 flex flex-col rounded-lg p-3 gap-2">
                <div className="flex flex-row items-center gap-1.5">
                    <img src={healthIcon} className="w-3.5 h-auto" />
                    <p className="text-[#8A898B] font-bold text-[10px]">DISTRIBUIÇÃO GERAL</p>
                </div>
                <p className="text-[#8A898B] text-xs">Carregando…</p>
            </div>
        )
    }

    const { total, saudavel, naoSaudavel } = resumo

    const itens = [
        { chave: "saudavel", label: STATUS_CONFIG.saudavel.label, color: STATUS_CONFIG.saudavel.color, quantidade: saudavel },
        { chave: "nao_saudavel", label: STATUS_CONFIG.nao_saudavel.label, color: STATUS_CONFIG.nao_saudavel.color, quantidade: naoSaudavel },
    ]

    return (
        <div className="bg-[#16191C] w-full border border-[#8A898B]/25 flex flex-col rounded-lg p-3 gap-2">
            <div className="flex flex-row items-center gap-1.5">
                <img src={healthIcon} className="w-3.5 h-auto" />
                <p className="text-[#8A898B] font-bold text-[10px]">DISTRIBUIÇÃO GERAL</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {itens.map((item) => (
                    <div key={item.chave} className="flex flex-col">
                        <p className="font-extrabold text-lg" style={{ color: item.color }}>
                            {percentual(item.quantidade, total)}%
                        </p>
                        <p className="text-[#8A898B] font-bold text-[9px] uppercase">{item.label}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}