import klarImg from "../assets/images/klar.png"

// Especificacoes reais do Rover JPL (Klar), fixas - o sistema nao tem
// telemetria ao vivo do carrinho (velocidade/bateria/posicao/capturas do
// dia nao chegam da API pra esse card), entao mostramos a ficha tecnica
// em vez de fingir um valor "ao vivo" sem fonte de dado por tras.
const VELOCIDADE_MAXIMA = "17 cm/s"
const PESO = "11,34 kg"
const DIMENSOES = "60,96 × 30,48 cm"
const BATERIA_TIPO = "13,2V recarregável - Green Series (MaxAmps.com)"
const BATERIA_FAIXA = "11,5V   –   16,75V conforme nível de carga"

export default function CarInfo() {
    return (
        <div className="bg-[#16191C] w-full border border-[#8A898B]/25 flex flex-col rounded-lg p-3 gap-2">
            <p className="text-[#8A898B] font-bold text-[10px]">ROVER KLAR</p>

            <img src={klarImg} alt="Rover Klar" className="w-full rounded-lg object-cover" />

            <div className="flex flex-col gap-1 text-xs">
                <div className="flex flex-row justify-between">
                    <p className="text-[#8A898B]">Base</p>
                    <p className="text-white font-bold">JPL Open Source Rover</p>
                </div>
                <div className="flex flex-row justify-between">
                    <p className="text-[#8A898B]">Velocidade máxima</p>
                    <p className="text-white font-bold">{VELOCIDADE_MAXIMA}</p>
                </div>
                <div className="flex flex-row justify-between">
                    <p className="text-[#8A898B]">Peso</p>
                    <p className="text-white font-bold">{PESO}</p>
                </div>
                <div className="flex flex-row justify-between">
                    <p className="text-[#8A898B]">Dimensões</p>
                    <p className="text-white font-bold">{DIMENSOES}</p>
                </div>
                <div className="flex flex-col gap-1 pt-2 border-t border-[#8A898B]/15 mt-1">
                    <p className="text-[#8A898B]">Bateria</p>
                    <p className="text-white font-bold">{BATERIA_TIPO}</p>
                    <p className="text-[#8A898B] text-[10px] mt-0.5">{BATERIA_FAIXA}</p>
                </div>
            </div>
        </div>
    )
}