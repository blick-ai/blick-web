import { useEffect, useState } from "react"
import { enviarCapturaSimples, SessaoExpiradaError } from "../services/api"
import { useToast } from "../contexts/toastContext"

function arquivoParaBase64(arquivo) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader()
        leitor.onload = () => {
            // remove o prefixo "data:image/jpeg;base64," — o backend espera so o base64 puro
            const base64 = leitor.result.split(",")[1] || ""
            resolve(base64)
        }
        leitor.onerror = () => reject(new Error("Não foi possível ler o arquivo de imagem."))
        leitor.readAsDataURL(arquivo)
    })
}

export default function UploadModal({ onFechar, onSucesso, onSessaoExpirada }) {
    const { mostrarToast } = useToast()

    const [arquivo, setArquivo] = useState(null)
    const [urlPreview, setUrlPreview] = useState(null)
    const [enviando, setEnviando] = useState(false)

    // gera/limpa a URL de preview sempre que o arquivo muda — evita
    // vazamento de memoria (URL.revokeObjectURL) quando troca de foto
    // ou fecha o modal
    useEffect(() => {
        if (!arquivo) {
            setUrlPreview(null)
            return
        }
        const url = URL.createObjectURL(arquivo)
        setUrlPreview(url)
        return () => URL.revokeObjectURL(url)
    }, [arquivo])

    function handleSelecionarArquivo(evento) {
        const arquivoSelecionado = evento.target.files?.[0] || null
        setArquivo(arquivoSelecionado)
    }

    async function handleEnviar() {
        if (!arquivo) {
            mostrarToast("aviso", "Selecione uma imagem da planta.")
            return
        }

        setEnviando(true)
        try {
            const imagemBase64 = await arquivoParaBase64(arquivo)
            await enviarCapturaSimples({ imagemBase64 })
            mostrarToast("sucesso", "Captura adicionada com sucesso")
            onSucesso?.()
            onFechar()
        } catch (erro) {
            if (erro instanceof SessaoExpiradaError) {
                onSessaoExpirada?.()
                onFechar()
                return
            }
            mostrarToast("erro", erro.message || "Não foi possível enviar a captura.")
        } finally {
            setEnviando(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1B2125] border border-[#8A898B]/25 rounded-2xl p-6 max-w-md w-full flex flex-col gap-4">
                <div className="flex flex-row justify-between items-center">
                    <p className="text-white font-bold text-lg">Adicionar captura</p>
                    <button
                        type="button"
                        onClick={onFechar}
                        className="text-[#8A898B] hover:text-white"
                        aria-label="Fechar"
                    >
                        ✕
                    </button>
                </div>

                <p className="text-[#8A898B] text-xs">
                    A data da captura é lida automaticamente da própria foto — não é preciso preencher nada além da imagem.
                </p>

                <div className="flex flex-col gap-2">
                    {urlPreview ? (
                        <div className="relative">
                            <img
                                src={urlPreview}
                                alt="Pré-visualização da foto selecionada"
                                className="w-full aspect-[4/3] object-cover rounded-lg border border-[#8A898B]/25"
                            />
                            <button
                                type="button"
                                onClick={() => setArquivo(null)}
                                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs rounded-full w-7 h-7 flex items-center justify-center"
                                aria-label="Remover foto selecionada"
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        <label
                            htmlFor="upload-imagem"
                            className="bg-[#16191C] border border-dashed border-[#8A898B]/40 rounded-lg px-3 py-10 text-center text-sm cursor-pointer hover:border-[#4A9B9A] transition-colors flex flex-col items-center gap-2"
                        >
                            <span className="text-2xl">📷</span>
                            <span className="text-[#8A898B]">Clique para escolher uma foto da planta</span>
                        </label>
                    )}
                    <input
                        id="upload-imagem"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleSelecionarArquivo}
                    />
                    {!urlPreview && (
                        <label
                            htmlFor="upload-imagem"
                            className="text-[#4A9B9A] text-xs font-bold text-center cursor-pointer hover:underline"
                        >
                            Selecionar arquivo
                        </label>
                    )}
                </div>

                <div className="flex flex-row gap-3 justify-end pt-2">
                    <button
                        type="button"
                        onClick={onFechar}
                        disabled={enviando}
                        className="text-[#8A898B] hover:text-white text-sm font-bold px-4 py-2 disabled:opacity-40"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleEnviar}
                        disabled={enviando}
                        className="bg-[#4A9B9A] hover:bg-[#3d8483] text-white text-sm font-bold rounded-xl px-4 py-2 disabled:opacity-60"
                    >
                        {enviando ? "Enviando…" : "Adicionar captura"}
                    </button>
                </div>
            </div>
        </div>
    )
}