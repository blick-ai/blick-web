import QuantityBar from "./quantityBar"
import { STATUS_CONFIG } from "../utils/status"

export default function Sweep({ resumo, carregando }) {
    if (carregando || !resumo) {
        return (
            <div className="bg-[#16191C] w-full border border-[#8A898B]/25 flex flex-col rounded-lg p-3 gap-2">
                <p className="text-[#8A898B] font-bold text-[10px]">RESUMO DA VARREDURA</p>
                <p className="text-[#8A898B] text-xs">Carregando…</p>
            </div>
        )
    }

    const { total, saudavel, naoSaudavel } = resumo

    return (
        <div className="bg-[#16191C] w-full border border-[#8A898B]/25 flex flex-col rounded-lg p-3 gap-2">
            <p className="text-[#8A898B] font-bold text-[10px]">RESUMO DA VARREDURA</p>
            <div className="flex flex-row gap-1.5 items-baseline">
                <p className="text-white font-extrabold text-xl">{total}</p>
                <p className="text-[#8A898B] font-bold text-[10px]">capturas analisadas</p>
            </div>

            <QuantityBar status="Saudável" quantity={saudavel} total={total} color={STATUS_CONFIG.saudavel.color} />
            <QuantityBar status="Não saudável" quantity={naoSaudavel} total={total} color={STATUS_CONFIG.nao_saudavel.color} />
        </div>
    )
}