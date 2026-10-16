export const STATUS_CONFIG = {
    saudavel: { label: "SAUDÁVEL", color: "#4CAF50", bg: "#1A2E1A" },
    nao_saudavel: { label: "NÃO SAUDÁVEL", color: "#C75050", bg: "#2E1A1A" },
    nao_milho: { label: "NÃO É MILHO", color: "#8A898B", bg: "#232323" },
}

// Usado especificamente pra alimentar o mapa de calor (ver
// obterPontosMapaCalor em services/api.js). Antes da migracao pra 2
// classes, juntava praga+doenca num unico grupo "alerta" pra nao precisar
// de 2 mapas separados; agora so existe "nao_saudavel" mesmo, mas o
// formato (objeto com .valores, uma lista) foi mantido pra nao precisar
// mexer em api.js tambem.
export const GRUPOS_STATUS_GERAL = {
    alerta: { label: "NÃO SAUDÁVEL", color: "#C75050", valores: ["nao_saudavel"] },
}

const STATUS_PADRAO = { label: "PENDENTE", color: "#8A898B", bg: "#232323" }

export function statusInfo(statusGeral) {
    return STATUS_CONFIG[statusGeral] || STATUS_PADRAO
}

export function paraPercentual(confianca) {
    if (confianca === null || confianca === undefined) return null
    return Math.round(confianca * 100)
}

export function formatarHora(timestampIso) {
    if (!timestampIso) return "-"
    const data = new Date(timestampIso)
    if (Number.isNaN(data.getTime())) return "-"
    return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

export function formatarData(timestampIso) {
    if (!timestampIso) return "-"
    const data = new Date(timestampIso)
    if (Number.isNaN(data.getTime())) return "-"
    return data.toLocaleDateString("pt-BR")
}