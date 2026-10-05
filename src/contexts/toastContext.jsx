/* eslint-disable react-refresh/only-export-components -- arquivo de contexto: exportar o Provider (componente) junto do hook useToast() é o padrão usual para esse tipo de arquivo */
import { createContext, useCallback, useContext, useRef, useState } from "react"

const ToastContext = createContext(null)

const DURACAO_PADRAO = {
    sucesso: 5000,
    erro: 5000,
    aviso: 2500,
}

const ESTILO_POR_TIPO = {
    sucesso: { bg: "bg-[#1A2E1A]", borda: "border-[#4CAF50]", texto: "text-[#4CAF50]", icone: "✓" },
    erro: { bg: "bg-[#2E1A1A]", borda: "border-[#C75050]", texto: "text-[#C75050]", icone: "✕" },
    aviso: { bg: "bg-[#2A2200]", borda: "border-[#D4A34A]", texto: "text-[#D4A34A]", icone: "!" },
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])
    const proximoId = useRef(0)

    const removerToast = useCallback((id) => {
        setToasts((atuais) => atuais.filter((t) => t.id !== id))
    }, [])

    const mostrarToast = useCallback((tipo, mensagem, duracaoMs) => {
        const id = proximoId.current++
        const duracao = duracaoMs ?? DURACAO_PADRAO[tipo] ?? 5000
        setToasts((atuais) => [...atuais, { id, tipo, mensagem }])
        setTimeout(() => removerToast(id), duracao)
        return id
    }, [removerToast])

    return (
        <ToastContext.Provider value={{ mostrarToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
                {toasts.map((toast) => {
                    const estilo = ESTILO_POR_TIPO[toast.tipo] || ESTILO_POR_TIPO.aviso
                    return (
                        <div
                            key={toast.id}
                            role="status"
                            className={`${estilo.bg} border ${estilo.borda} rounded-xl px-4 py-3 shadow-lg flex flex-row items-start gap-2`}
                        >
                            <span className={`${estilo.texto} font-bold shrink-0`}>{estilo.icone}</span>
                            <p className="text-white text-sm flex-1">{toast.mensagem}</p>
                            <button
                                type="button"
                                onClick={() => removerToast(toast.id)}
                                className="text-[#8A898B] hover:text-white shrink-0 text-xs"
                                aria-label="Fechar notificação"
                            >
                                ✕
                            </button>
                        </div>
                    )
                })}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const contexto = useContext(ToastContext)
    if (!contexto) {
        throw new Error("useToast precisa ser usado dentro de um <ToastProvider>")
    }
    return contexto
}