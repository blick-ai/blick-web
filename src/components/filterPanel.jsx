import { useState } from "react"
import { STATUS_CONFIG } from "../utils/status"

const OPCOES_STATUS_GERAL = [
    { value: "", label: "Todas" },
    { value: "saudavel", label: STATUS_CONFIG.saudavel.label },
    { value: "nao_saudavel", label: STATUS_CONFIG.nao_saudavel.label },
]

const OPCOES_ORIGEM = [
    { value: "", label: "Todas" },
    { value: "rover", label: "ROVER" },
    { value: "manual", label: "MANUAL" },
]

function GrupoBotoes({ titulo, opcoes, valorAtual, onChange }) {
    return (
        <div className="flex flex-col gap-2">
            <p className="text-[#8A898B] font-bold text-[10px] uppercase">{titulo}</p>
            <div className="flex flex-row flex-wrap gap-2">
                {opcoes.map((opcao) => (
                    <button
                        key={opcao.value || "todas"}
                        type="button"
                        onClick={() => onChange(opcao.value)}
                        className={`rounded-full py-1.5 px-3 text-[10px] font-bold border transition-colors ${valorAtual === opcao.value
                                ? "bg-[#4A9B9A] border-[#4A9B9A] text-white"
                                : "bg-transparent border-[#8A898B]/50 text-[#8A898B] hover:border-white hover:text-white"
                            }`}
                    >
                        {opcao.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default function FilterPanel({ filtros, onChange, onLimpar, onCarregarCaptura = () => { } }) {
    const [aberto, setAberto] = useState(false)

    const quantidadeAtiva = [
        filtros.statusGeral,
        filtros.origem,
        filtros.dataInicio,
        filtros.dataFim,
    ].filter(Boolean).length

    return (
        <div className="flex flex-row items-start gap-2">
            <button
                type="button"
                onClick={onCarregarCaptura}
                className="flex flex-row items-center gap-2 rounded-xl border border-[#4A9B9A] bg-[#4A9B9A] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#3F8483] hover:border-[#3F8483] active:bg-[#356E6D] active:border-[#356E6D]"
            >
                Carregar Captura
                <svg fill="currentColor" className="w-4 h-4 shrink-0" viewBox="0 0 477.075 477.075" xmlns="http://www.w3.org/2000/svg">
                    <path d="M358.387,159.975h-38.9c-7.5,0-13.5,6-13.5,13.5s6,13.5,13.5,13.5h38.9c19.1,0,34.7,15.6,34.7,34.7v193.8 c0,19.1-15.6,34.7-34.7,34.7h-239.8c-19.1,0-34.7-15.6-34.7-34.7v-193.9c0-19.1,15.6-34.7,34.7-34.7h38.9c7.5,0,13.5-6,13.5-13.5 s-6-13.5-13.5-13.5h-38.9c-34,0-61.7,27.7-61.7,61.7v193.8c0,34,27.7,61.7,61.7,61.7h239.9c34,0,61.7-27.7,61.7-61.7v-193.8 C420.087,187.575,392.387,159.975,358.387,159.975z" />
                    <path d="M166.987,104.175l58-58v218c0,7.5,6,13.5,13.5,13.5s13.5-6,13.5-13.5v-218l58,58c2.6,2.6,6.1,4,9.5,4s6.9-1.3,9.5-4 c5.3-5.3,5.3-13.8,0-19.1l-81.1-81.1c-5.3-5.3-13.8-5.3-19.1,0l-81.1,81.1c-5.3,5.3-5.3,13.8,0,19.1 C153.187,109.475,161.687,109.475,166.987,104.175z" />
                </svg>
            </button>

            <div className="relative">
                <button
                    type="button"
                    onClick={() => setAberto((v) => !v)}
                    className={`flex flex-row items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${aberto || quantidadeAtiva > 0
                            ? "bg-[#4A9B9A]/15 border-[#4A9B9A] text-[#4A9B9A]"
                            : "bg-[#1B2125] border-[#8A898B]/25 text-[#8A898B] hover:border-white hover:text-white"
                        }`}
                >
                    Filtros
                    {quantidadeAtiva > 0 && (
                        <span className="bg-[#4A9B9A] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
                            {quantidadeAtiva}
                        </span>
                    )}
                </button>

                {aberto && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setAberto(false)} />
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#1B2125] border border-[#8A898B]/25 rounded-xl p-4 flex flex-col gap-4 z-20 shadow-xl">
                            <GrupoBotoes
                                titulo="Estado da planta"
                                opcoes={OPCOES_STATUS_GERAL}
                                valorAtual={filtros.statusGeral || ""}
                                onChange={(v) => onChange({ ...filtros, statusGeral: v })}
                            />

                            <GrupoBotoes
                                titulo="Origem da captura"
                                opcoes={OPCOES_ORIGEM}
                                valorAtual={filtros.origem || ""}
                                onChange={(v) => onChange({ ...filtros, origem: v })}
                            />

                            <div className="flex flex-col gap-2">
                                <p className="text-[#8A898B] font-bold text-[10px] uppercase">Período</p>
                                <div className="flex flex-row gap-2 items-center">
                                    <input
                                        type="date"
                                        value={filtros.dataInicio || ""}
                                        onChange={(e) => onChange({ ...filtros, dataInicio: e.target.value })}
                                        className="bg-[#16191C] text-white text-xs border border-[#8A898B]/25 rounded-lg px-2 py-1.5 outline-none focus:border-[#4A9B9A] flex-1"
                                    />
                                    <p className="text-[#8A898B] text-xs">até</p>
                                    <input
                                        type="date"
                                        value={filtros.dataFim || ""}
                                        onChange={(e) => onChange({ ...filtros, dataFim: e.target.value })}
                                        className="bg-[#16191C] text-white text-xs border border-[#8A898B]/25 rounded-lg px-2 py-1.5 outline-none focus:border-[#4A9B9A] flex-1"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    onLimpar()
                                    setAberto(false)
                                }}
                                className="text-[#8A898B] hover:text-white text-xs font-bold self-start"
                            >
                                Limpar filtros
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}