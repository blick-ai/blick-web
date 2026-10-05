const TAMANHO_JANELA = 5
const PASSO_PAGINACAO = 5

export default function Pagination({
    paginaAtual,
    totalPaginas,
    onChange,
    carregando = false,
}) {
    const total = Math.max(0, Math.floor(Number(totalPaginas) || 0))
    const pagina = Math.min(
        Math.max(Math.floor(Number(paginaAtual) || 1), 1),
        Math.max(total, 1),
    )

    if (total <= 1) return null

    let inicio = Math.max(1, pagina - Math.floor(TAMANHO_JANELA / 2))
    let fim = Math.min(total, inicio + TAMANHO_JANELA - 1)
    inicio = Math.max(1, fim - TAMANHO_JANELA + 1)

    const paginas = Array.from(
        { length: fim - inicio + 1 },
        (_, indice) => inicio + indice,
    )

    const navegar = (destino) => {
        const paginaDestino = Math.min(Math.max(destino, 1), total)
        if (paginaDestino !== pagina) onChange(paginaDestino)
    }

    const botaoBase =
        "min-w-8 h-8 px-2 rounded-lg text-xs font-bold flex items-center justify-center transition-colors"
    const botaoInativo =
        `${botaoBase} text-[#8A898B] hover:text-white hover:bg-[#1B2125] disabled:opacity-40 disabled:cursor-not-allowed`
    const botaoAtivo = `${botaoBase} bg-[#4A9B9A] text-white`

    return (
        <nav
            className="flex flex-wrap items-center justify-center gap-1"
            aria-label="Paginação"
        >
            <button
                type="button"
                className={botaoInativo}
                onClick={() => navegar(pagina - PASSO_PAGINACAO)}
                disabled={carregando || pagina <= 1}
                aria-label={`Voltar ${PASSO_PAGINACAO} páginas`}
            >
                −5
            </button>

            {inicio > 1 && (
                <>
                    {inicio > 2 && (
                        <span className="px-1 text-[#8A898B]" aria-hidden="true">
                            …
                        </span>
                    )}
                </>
            )}

            {paginas.map((numero) => (
                <button
                    key={numero}
                    type="button"
                    className={numero === pagina ? botaoAtivo : botaoInativo}
                    onClick={() => navegar(numero)}
                    disabled={carregando || numero === pagina}
                    aria-current={numero === pagina ? "page" : undefined}
                    aria-label={`Página ${numero}`}
                >
                    {numero}
                </button>
            ))}

            {fim < total && (
                <>
                    {fim < total - 1 && (
                        <span className="px-1 text-[#8A898B]" aria-hidden="true">
                            …
                        </span>
                    )}
                </>
            )}

            <button
                type="button"
                className={botaoInativo}
                onClick={() => navegar(pagina + PASSO_PAGINACAO)}
                disabled={carregando || pagina >= total}
                aria-label={`Avançar ${PASSO_PAGINACAO} páginas`}
            >
                +5
            </button>
        </nav>
    )
}