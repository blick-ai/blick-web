const severityColor = {
    critical: "#C75050",
    warning: "#D4A34A",
    healthy: "#4CAF50",
}

const severityLabel = {
    critical: "CRÍTICO",
    warning: "ATENÇÃO",
    healthy: "BAIXO",
}

function exibirOuNulo(valor) {
    if (valor === null || valor === undefined || valor === "") return "Nulo"
    if (Array.isArray(valor)) return valor.length ? valor.join(", ") : "Nulo"
    if (typeof valor === "object") {
        try {
            return JSON.stringify(valor)
        } catch {
            return "Nulo"
        }
    }
    return String(valor)
}

export default function PlantInfoModal({ data, onClose }) {
    const planta = data ?? {}
    const cultivoIdeal = planta.cultivoIdeal ?? planta.cultivo_ideal ?? {}
    const pragasDoencas = Array.isArray(planta.pragasDoencas)
        ? planta.pragasDoencas
        : Array.isArray(planta.pragas_doencas)
          ? planta.pragas_doencas
          : []

    const camposTaxonomicos = [
        { label: "Família", value: planta.familia },
        { label: "Ciclo", value: planta.ciclo },
        { label: "Origem", value: planta.origem },
    ]

    const camposCultivo = [
        { label: "Solo", value: cultivoIdeal.solo },
        { label: "pH", value: cultivoIdeal.ph },
        { label: "Temperatura", value: cultivoIdeal.temperatura },
        { label: "Precipitação", value: cultivoIdeal.precipitacao },
        { label: "Luminosidade", value: cultivoIdeal.luminosidade },
    ]

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={onClose}
        >
            <div
                className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#8A898B]/25 bg-[#1B2125]"
                onClick={(evento) => evento.stopPropagation()}
            >
                <div className="flex items-start justify-between border-b border-[#8A898B]/25 p-5">
                    <div className="flex flex-col gap-0.5">
                        <p className="text-lg font-extrabold text-white">
                            {exibirOuNulo(planta.nome_comum ?? planta.nomeComum)}
                        </p>
                        <p className="text-sm italic text-[#8A898B]">
                            {exibirOuNulo(
                                planta.nome_cientifico ?? planta.nomeCientifico,
                            )}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar modal"
                        className="mt-0.5 text-xl leading-none text-[#8A898B] hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex flex-col gap-5 overflow-y-auto p-5">
                    <section className="flex flex-col gap-3">
                        <p className="text-[10px] font-bold text-[#8A898B]">
                            DADOS TAXONÔMICOS
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {camposTaxonomicos.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex flex-col gap-0.5 rounded-lg bg-[#16191C] px-3 py-2"
                                >
                                    <p className="text-[9px] font-bold uppercase text-[#8A898B]">
                                        {item.label}
                                    </p>
                                    <p className="text-xs font-bold text-white">
                                        {exibirOuNulo(item.value)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="flex flex-col gap-3">
                        <p className="text-[10px] font-bold text-[#8A898B]">
                            CONDIÇÕES IDEAIS DE CULTIVO
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {camposCultivo.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex flex-col gap-0.5 rounded-lg bg-[#16191C] px-3 py-2"
                                >
                                    <p className="text-[9px] font-bold uppercase text-[#8A898B]">
                                        {item.label}
                                    </p>
                                    <p className="text-xs font-bold text-white">
                                        {exibirOuNulo(item.value)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="flex flex-col gap-3">
                        <p className="text-[10px] font-bold text-[#8A898B]">
                            PRAGAS E DOENÇAS COMUNS
                        </p>
                        <div className="flex flex-col gap-2">
                            {pragasDoencas.length === 0 ? (
                                <div className="rounded-lg bg-[#16191C] px-3 py-2.5">
                                    <p className="text-xs text-white">Nulo</p>
                                </div>
                            ) : (
                                pragasDoencas.map((item, indice) => {
                                    const praga = item ?? {}
                                    const severidade = praga.severidade
                                    const cor =
                                        severityColor[severidade] ?? "#8A898B"
                                    const tipo = exibirOuNulo(praga.tipo)

                                    return (
                                        <div
                                            key={praga.nome ?? indice}
                                            className="flex flex-col gap-1 rounded-lg bg-[#16191C] px-3 py-2.5"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-bold text-white">
                                                        {exibirOuNulo(praga.nome)}
                                                    </p>
                                                    <span
                                                        className="rounded-full border px-1.5 py-0.5 text-[9px] font-bold"
                                                        style={{
                                                            color: cor,
                                                            borderColor: `${cor}55`,
                                                            backgroundColor: `${cor}18`,
                                                        }}
                                                    >
                                                        {tipo.toUpperCase()}
                                                    </span>
                                                </div>
                                                <span
                                                    className="text-[9px] font-bold"
                                                    style={{ color: cor }}
                                                >
                                                    {severityLabel[severidade] ?? "Nulo"}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-[#8A898B]">
                                                {exibirOuNulo(praga.descricao)}
                                            </p>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}