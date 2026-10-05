const API_URL = import.meta.env.VITE_API_URL;

export class SessaoExpiradaError extends Error {
  constructor() {
    super("Sessão expirada");
    this.name = "SessaoExpiradaError";
  }
}

import { GRUPOS_STATUS_GERAL } from "../utils/status";

const CACHE_PREFIXO = "blick_cache_capturas:";
const CACHE_TTL_MS = 60 * 1000;
const CACHE_MAX_ENTRADAS = 100;
const MAX_REQUISICOES_PARALELAS = 4;

const cacheMemoria = new Map();
const requisicoesEmAndamento = new Map();
let geracaoCache = 0;

function getToken() {
  try {
    return localStorage.getItem("access_token");
  } catch {
    return null;
  }
}

function identidadeSessao() {
  const token = getToken() || "";
  let hash = 2166136261;

  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function serializar(params) {
  const normalizados = Object.fromEntries(
    Object.entries(params)
      .filter(([, valor]) => valor !== undefined && valor !== "")
      .sort(([a], [b]) => a.localeCompare(b)),
  );

  return JSON.stringify(normalizados);
}

function chaveCache(params) {
  return `${CACHE_PREFIXO}${identidadeSessao()}:${serializar(params)}`;
}

function guardarEmMemoria(chave, dados, ttl) {
  cacheMemoria.delete(chave);
  cacheMemoria.set(chave, {
    dados,
    expiraEm: Date.now() + ttl,
  });

  if (cacheMemoria.size > CACHE_MAX_ENTRADAS) {
    const chaveMaisAntiga = cacheMemoria.keys().next().value;
    cacheMemoria.delete(chaveMaisAntiga);
  }
}

function lerCache(params) {
  const chave = chaveCache(params);
  const agora = Date.now();
  const memoria = cacheMemoria.get(chave);

  if (memoria && memoria.expiraEm > agora) {
    return memoria.dados;
  }

  if (memoria) {
    cacheMemoria.delete(chave);
  }

  try {
    const bruto = localStorage.getItem(chave);
    if (!bruto) return null;

    const { timestamp, dados } = JSON.parse(bruto);

    if (!Number.isFinite(timestamp) || agora - timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(chave);
      return null;
    }

    guardarEmMemoria(chave, dados, CACHE_TTL_MS);
    return dados;
  } catch {
    return null;
  }
}

function salvarCache(params, dados, ttl = CACHE_TTL_MS, persistir = false) {
  const chave = chaveCache(params);
  guardarEmMemoria(chave, dados, ttl);

  if (!persistir) return;

  try {
    localStorage.setItem(
      chave,
      JSON.stringify({ timestamp: Date.now(), dados }),
    );
  } catch {
    // Cache persistente indisponível ou sem espaço: a aplicação segue normalmente.
  }
}

async function comCache(
  params,
  carregar,
  ttl = CACHE_TTL_MS,
  persistir = false,
) {
  const chave = chaveCache(params);
  const agora = Date.now();
  const memoria = cacheMemoria.get(chave);

  if (memoria && memoria.expiraEm > agora) {
    return memoria.dados;
  }

  if (memoria) {
    cacheMemoria.delete(chave);
  }

  if (persistir) {
    const persistido = lerCache(params);
    if (persistido !== null) return persistido;
  }

  const requisicaoExistente = requisicoesEmAndamento.get(chave);
  if (requisicaoExistente) return requisicaoExistente;

  const geracao = geracaoCache;
  const requisicao = Promise.resolve()
    .then(carregar)
    .then((dados) => {
      if (geracao === geracaoCache) {
        salvarCache(params, dados, ttl, persistir);
      }

      return dados;
    })
    .finally(() => {
      if (requisicoesEmAndamento.get(chave) === requisicao) {
        requisicoesEmAndamento.delete(chave);
      }
    });

  requisicoesEmAndamento.set(chave, requisicao);
  return requisicao;
}

function limparCacheListagem() {
  geracaoCache += 1;
  cacheMemoria.clear();
  requisicoesEmAndamento.clear();

  try {
    const chaves = Object.keys(localStorage).filter((chave) =>
      chave.startsWith(CACHE_PREFIXO),
    );

    chaves.forEach((chave) => localStorage.removeItem(chave));
  } catch {
    // Falha ao limpar o cache não deve impedir upload ou exclusão.
  }
}

async function apiFetch(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    throw new SessaoExpiradaError();
  }

  const texto = await response.text();
  let corpo = null;

  if (texto) {
    try {
      corpo = JSON.parse(texto);
    } catch {
      corpo = texto;
    }
  }

  if (!response.ok) {
    const detalhe = corpo?.detail;
    const mensagem = Array.isArray(detalhe)
      ? detalhe.map((item) => item.msg || JSON.stringify(item)).join("; ")
      : typeof detalhe === "string"
        ? detalhe
        : `Erro ${response.status} ao consultar a API`;

    throw new Error(mensagem);
  }

  return corpo;
}

function campo(objeto, ...nomes) {
  for (const nome of nomes) {
    if (objeto?.[nome] !== undefined) return objeto[nome];
  }

  return undefined;
}

function normalizarResumo(item = {}) {
  return {
    ...item,
    capturaId: campo(item, "capturaId", "captura_id"),
    timestamp: campo(item, "timestamp", "dataCaptura", "data_captura"),
    status: campo(item, "status", "statusPipeline", "status_pipeline"),
    statusGeral: campo(
      item,
      "statusGeral",
      "status_geral",
      "classificacaoGeral",
      "classificacao_geral",
    ),
    confiancaStatusGeral: campo(
      item,
      "confiancaStatusGeral",
      "confianca_status_geral",
    ),
    latitude: campo(item, "latitude", "lat"),
    longitude: campo(item, "longitude", "lng", "lon"),
    alertaEmitido: campo(item, "alertaEmitido", "alerta_emitido"),
    imagemUrl: campo(item, "imagemUrl", "imagem_url"),
    origem: campo(item, "origem") || "rover",
  };
}

function normalizarListaResposta(resposta = {}) {
  const capturas = Array.isArray(resposta)
    ? resposta
    : resposta.capturas || resposta.items || resposta.data || [];

  return {
    ...resposta,
    capturas: capturas.map(normalizarResumo),
    pagina: campo(resposta, "pagina", "page"),
    tamanhoPagina: campo(
      resposta,
      "tamanhoPagina",
      "tamanho_pagina",
      "pageSize",
    ),
    total: campo(resposta, "total", "totalCount") ?? capturas.length,
    totalPaginas:
      campo(resposta, "totalPaginas", "total_paginas", "totalPages") ?? 0,
  };
}

function primeiroValor(...valores) {
    return valores.find(
        (valor) => valor !== undefined && valor !== null && valor !== "",
    ) ?? null
}

function normalizarDetalhe(resposta = {}) {
    const item = resposta.captura ?? resposta.data ?? resposta
    const diagnostico = item.diagnostico ?? {}
    const localizacao = item.localizacao ?? {}
    const alerta = item.alerta ?? {}

    return {
        ...item,
        capturaId: primeiroValor(item.capturaId, item.captura_id),
        timestamp: primeiroValor(
            item.timestamp,
            item.capturadoEm,
            item.capturado_em,
        ),
        status: primeiroValor(
            item.status,
            item.statusProcessamento,
            item.status_processamento,
        ),
        statusGeral: primeiroValor(
            item.statusGeral,
            item.status_geral,
            diagnostico.status,
        ),
        confiancaStatusGeral: primeiroValor(
            item.confiancaStatusGeral,
            item.confianca_status_geral,
            diagnostico.confianca,
        ),
        latitude: primeiroValor(
            item.latitude,
            localizacao.latitude,
        ),
        longitude: primeiroValor(
            item.longitude,
            localizacao.longitude,
        ),
        alertaEmitido: primeiroValor(
            item.alertaEmitido,
            item.alerta_emitido,
            alerta.emitido,
            false,
        ),
        alertaEmitidoEm: primeiroValor(
            item.alertaEmitidoEm,
            item.alerta_emitido_em,
            alerta.ultimaEmissao,
            alerta.ultima_emissao,
        ),
        imagemUrl: primeiroValor(item.imagemUrl, item.imagem_url),
        erroDetalhes: primeiroValor(
            item.erroDetalhes,
            item.erro_detalhes,
        ),
        statusHistory: item.statusHistory ?? item.status_history ?? [],
        analisePorPlanta: Array.isArray(item.plantas)
            ? item.plantas
            : Array.isArray(item.analisePorPlanta)
              ? item.analisePorPlanta
              : Array.isArray(item.analise_por_planta)
                ? item.analise_por_planta
                : [],
        origem: item.origem ?? "rover",
    }
}

const STATUS_SAUDE_MILHO = ["saudavel", "nao_saudavel"];

export async function listarCapturas({
  pagina = 1,
  tamanhoPagina = 8,
  status,
  statusGeral,
  origem,
  dataInicio,
  dataFim,
  plantacaoId,
} = {}) {
  const filtros = {
    pagina,
    tamanhoPagina,
    status,
    statusGeral,
    origem,
    dataInicio,
    dataFim,
    plantacaoId,
  };

  if (!status && !statusGeral) {
    return listarCapturasMultiStatus({
      pagina,
      tamanhoPagina,
      origem,
      dataInicio,
      dataFim,
      plantacaoId,
      valores: STATUS_SAUDE_MILHO,
    });
  }

  const params = new URLSearchParams();
  params.set("pagina", String(pagina));
  params.set("tamanhoPagina", String(tamanhoPagina));

  if (status) params.set("status", status);
  if (statusGeral) params.set("statusGeral", statusGeral);
  if (origem) params.set("origem", origem);
  if (dataInicio) params.set("dataInicio", dataInicio);
  if (dataFim) params.set("dataFim", dataFim);
  if (plantacaoId) params.set("plantacaoId", plantacaoId);

  return comCache(
    { tipo: "lista", ...filtros },
    async () => {
      const resposta = await apiFetch(`/capturas?${params.toString()}`);
      return normalizarListaResposta(resposta);
    },
    CACHE_TTL_MS,
    true,
  );
}

const TAMANHO_MAXIMO_BACKEND = 100;

async function listarCapturasMultiStatus({
  pagina,
  tamanhoPagina,
  origem,
  dataInicio,
  dataFim,
  plantacaoId,
  valores,
}) {
  const chave = {
    tipo: "lista-multi",
    pagina,
    tamanhoPagina,
    origem,
    dataInicio,
    dataFim,
    plantacaoId,
    valores,
  };

  return comCache(
    chave,
    async () => {
      const itensNecessarios = pagina * tamanhoPagina;
      const numeroDeBlocos = Math.ceil(
        itensNecessarios / TAMANHO_MAXIMO_BACKEND,
      );

      async function buscarStatusCompleto(statusGeral) {
        const respostas = [];

        for (
          let inicio = 0;
          inicio < numeroDeBlocos;
          inicio += MAX_REQUISICOES_PARALELAS
        ) {
          const quantidade = Math.min(
            MAX_REQUISICOES_PARALELAS,
            numeroDeBlocos - inicio,
          );

          const lote = await Promise.all(
            Array.from({ length: quantidade }, (_, indice) =>
              listarCapturas({
                pagina: inicio + indice + 1,
                tamanhoPagina: TAMANHO_MAXIMO_BACKEND,
                statusGeral,
                origem,
                dataInicio,
                dataFim,
                plantacaoId,
              }),
            ),
          );

          respostas.push(...lote);
        }

        return {
          capturas: respostas.flatMap((resposta) => resposta.capturas),
          total: respostas[0]?.total ?? 0,
        };
      }

      const respostas = await Promise.all(valores.map(buscarStatusCompleto));
      const todasCapturas = respostas.flatMap((resposta) => resposta.capturas);

      todasCapturas.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
      );

      const total = respostas.reduce(
        (soma, resposta) => soma + resposta.total,
        0,
      );
      const inicio = (pagina - 1) * tamanhoPagina;

      return {
        capturas: todasCapturas.slice(inicio, inicio + tamanhoPagina),
        pagina,
        tamanhoPagina,
        total,
        totalPaginas: Math.ceil(total / tamanhoPagina),
      };
    },
    CACHE_TTL_MS,
    true,
  );
}

export function obterCapturasDoCache({
  pagina = 1,
  tamanhoPagina = 8,
  status,
  statusGeral,
  origem,
  dataInicio,
  dataFim,
  plantacaoId,
} = {}) {
  const filtros = {
    pagina,
    tamanhoPagina,
    status,
    statusGeral,
    origem,
    dataInicio,
    dataFim,
    plantacaoId,
  };

  if (!status && !statusGeral) {
    return lerCache({
      tipo: "lista-multi",
      pagina,
      tamanhoPagina,
      origem,
      dataInicio,
      dataFim,
      plantacaoId,
      valores: STATUS_SAUDE_MILHO,
    });
  }

  return lerCache({ tipo: "lista", ...filtros });
}

export async function obterCaptura(capturaId, timestamp, plantacaoId) {
  return comCache(
    { tipo: "detalhe", capturaId, timestamp, plantacaoId },
    async () => {
      const params = new URLSearchParams({ timestamp });
      if (plantacaoId) params.set("plantacao_id", plantacaoId);

      const resposta = await apiFetch(
        `/capturas/${capturaId}?${params.toString()}`,
      );
      console.log("Resposta bruta de obterCaptura:", resposta);
      return normalizarDetalhe(resposta);
    },
    5 * 60 * 1000,
  );
}

export async function obterResumoGeral(plantacaoId) {
  return comCache({ tipo: "resumo", plantacaoId }, async () => {
    const [saudavel, naoSaudavel, naoMilho, erro] = await Promise.all([
      listarCapturas({
        statusGeral: "saudavel",
        tamanhoPagina: 1,
        plantacaoId,
      }),
      listarCapturas({
        statusGeral: "nao_saudavel",
        tamanhoPagina: 1,
        plantacaoId,
      }),
      listarCapturas({
        statusGeral: "nao_milho",
        tamanhoPagina: 1,
        plantacaoId,
      }),
      listarCapturas({
        status: "ERRO",
        tamanhoPagina: 1,
        plantacaoId,
      }),
    ]);

    return {
      saudavel: saudavel.total,
      naoSaudavel: naoSaudavel.total,
      naoMilho: naoMilho.total,
      impossivel: erro.total,
      total: saudavel.total + naoSaudavel.total,
    };
  });
}

export async function excluirCaptura(capturaId, timestamp, plantacaoId) {
  const params = new URLSearchParams({ timestamp });
  if (plantacaoId) params.set("plantacao_id", plantacaoId);

  const resultado = await apiFetch(
    `/capturas/${capturaId}?${params.toString()}`,
    { method: "DELETE" },
  );

  limparCacheListagem();
  return resultado;
}

function normalizarPontoMapa(item) {
  return {
    capturaId: campo(item, "capturaId", "captura_id"),
    timestamp: item.timestamp,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    statusGeral: campo(item, "statusGeral", "status_geral"),
  };
}

export async function obterPontosMapaCalor(plantacaoId) {
  const chave = { tipo: "mapa", plantacaoId };

  return comCache(
    chave,
    async () => {
      const params = new URLSearchParams();
      if (plantacaoId) params.set("plantacaoId", plantacaoId);

      const query = params.toString();
      const resposta = await apiFetch(
        `/capturas/mapa${query ? `?${query}` : ""}`,
      );

      return (resposta?.pontos || [])
        .map(normalizarPontoMapa)
        .filter(
          (ponto) =>
            Number.isFinite(ponto.latitude) && Number.isFinite(ponto.longitude),
        );
    },
    30 * 1000,
  );
}

export async function enviarCaptura({
  diaMesAno,
  latitude,
  longitude,
  imagemBase64,
}) {
  const resposta = await apiFetch("/capturas", {
    method: "POST",
    body: JSON.stringify({
      dia_mes_ano: diaMesAno,
      latitude,
      longitude,
      imagem_base64: imagemBase64,
    }),
  });

  limparCacheListagem();
  return resposta;
}

export async function enviarCapturaSimples({ imagemBase64 }) {
  const resposta = await apiFetch("/capturas/upload-simples", {
    method: "POST",
    body: JSON.stringify({ imagem_base64: imagemBase64 }),
  });

  limparCacheListagem();
  return resposta;
}

export { API_URL };
