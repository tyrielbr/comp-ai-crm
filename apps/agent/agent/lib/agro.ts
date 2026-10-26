/** Regras comerciais do Agro-SaaS. O modelo não calcula preço nem escolhe dono. */

export const EXCEDENTE_HA = 0.9;
export const LIMITE_CUSTOM_HA = 2767;
export const LIMITE_CONFIANCA_HA = 10000;

export const PLANOS = {
	Padrao: { piso: 790, franquiaHa: 700 },
	Profissional: { piso: 1190, franquiaHa: 1050 },
	Empresarial: { piso: 2490, franquiaHa: 2767 },
} as const;

export type PlanoFechado = keyof typeof PLANOS;

export const INDICACAO_AMIGO = "Indicacao de amigo";
export const INDICACAO_PRESTADOR = "Indicacao de prestador de servico";
export const MIDIAS = [
	"Google",
	"Facebook",
	"Instagram",
	"YouTube",
	"Outro meio",
] as const;

export type Propriedade = {
	municipio?: string;
	uf?: string;
	areaTotalHa?: number | null;
	areaPropriaHa?: number | null;
	areaArrendadaHa?: number | null;
	areaIrrigadaHa?: number | null;
	qtdMaquinario?: number | null;
	estruturaDistinta?: string;
};

export type Regiao = {
	hunter?: string | null;
	parceiro?: string | null;
	hunterDisponivel?: boolean;
};

export type Lead = {
	propriedades: Propriedade[];
	qtdPropriedades?: number | null;
	tipoCliente?: string;
	tipoPessoa?: string;
	regiao?: string;
	regioesAtuacao?: string;
	culturas?: string;
	atividadesSecundarias?: string;
	possuiEquipeTecnica?: string;
	melhorHorarioContato?: string;
	origemConhecimento?: string;
	origemLead?: string;
	indicadorNome?: string;
	indicadorContato?: string;
	indicadorRelacionamento?: string;
	indicadorDesde?: string | null;
	numClientesConsultoria?: number | null;
	hunterAtribuido?: string | null;
	parceiroOrigem?: string | null;
	responsavelContato?: string | null;
	dataInicioRelacionamentoHunter?: string | null;
	dataInicioRelacionamentoParceiro?: string | null;
	evidenciaRelacionamento?: boolean;
	donoConta?: string | null;
	responsavelConflito?: string | null;
	areaHa: number;
	irrigacao: boolean;
	contratoCustomizado: boolean;
	planoSugerido: string;
	confiancaPlano: string;
};

export function leadVazio(parcial: Partial<Lead> = {}): Lead {
	return {
		propriedades: [],
		areaHa: 0,
		irrigacao: false,
		contratoCustomizado: false,
		planoSugerido: "",
		confiancaPlano: "",
		...parcial,
	};
}

function texto(valor: string | null | undefined): string {
	return (valor ?? "").trim();
}

export function derivar(lead: Lead): void {
	const linhas = lead.propriedades;
	lead.areaHa = linhas.reduce(
		(soma, linha) => soma + Number(linha.areaTotalHa ?? 0),
		0,
	);
	lead.irrigacao = linhas.some((linha) => Number(linha.areaIrrigadaHa ?? 0) > 0);
	lead.contratoCustomizado = lead.areaHa > LIMITE_CUSTOM_HA;
}

function estrutura(lead: Lead): string {
	if (lead.tipoCliente === "consultoria") return "clara";
	const linhas = lead.propriedades;
	const quantidade = lead.qtdPropriedades || linhas.length;
	if (!quantidade) return "incompleta";
	if (quantidade <= 1) return "ausente";
	if (
		linhas.length > 0 &&
		linhas.every((linha) => linha.estruturaDistinta === "nao")
	) {
		return "ausente";
	}
	const pares = new Set<string>();
	for (const linha of linhas) {
		const municipio = texto(linha.municipio).toLowerCase();
		const uf = texto(linha.uf).toUpperCase();
		if (municipio || uf) pares.add(`${municipio}|${uf}`);
	}
	const distintas = linhas.filter((linha) => linha.estruturaDistinta === "sim");
	const clara =
		quantidade > 1 &&
		pares.size > 1 &&
		linhas.length > 1 &&
		distintas.length === linhas.length &&
		lead.tipoPessoa === "CNPJ" &&
		lead.possuiEquipeTecnica === "sim";
	if (clara) return "clara";
	if (quantidade > 1) return "duvidosa";
	return "incompleta";
}

export function classificar(lead: Lead): void {
	derivar(lead);
	if (!lead.tipoCliente) return;
	const forma = estrutura(lead);
	if (forma === "clara" && lead.areaHa > LIMITE_CONFIANCA_HA) {
		lead.planoSugerido = "Empresarial";
		lead.confiancaPlano = "alta";
		return;
	}
	if (forma === "clara" || forma === "duvidosa") {
		lead.planoSugerido = "Em_validacao";
		lead.confiancaPlano = "revisar";
		return;
	}
	if (forma === "ausente" && lead.propriedades.length > 0) {
		lead.planoSugerido = lead.irrigacao ? "Profissional" : "Padrao";
		lead.confiancaPlano = "";
	}
}

function linhaCompleta(linha: Propriedade): boolean {
	if (!texto(linha.municipio) || !texto(linha.uf)) return false;
	if (
		linha.areaTotalHa == null ||
		linha.areaPropriaHa == null ||
		linha.areaArrendadaHa == null ||
		linha.areaIrrigadaHa == null ||
		linha.qtdMaquinario == null
	) {
		return false;
	}
	return linha.estruturaDistinta === "sim" || linha.estruturaDistinta === "nao";
}

export function triagemPronta(lead: Lead): boolean {
	const linhas = lead.propriedades;
	if (linhas.length === 0) return false;
	if (!lead.qtdPropriedades) lead.qtdPropriedades = linhas.length;
	if (Number(lead.qtdPropriedades) !== linhas.length) return false;
	const obrigatorios = [
		lead.tipoCliente,
		lead.tipoPessoa,
		texto(lead.regiao),
		texto(lead.regioesAtuacao),
		texto(lead.culturas),
		texto(lead.atividadesSecundarias),
		lead.possuiEquipeTecnica,
		texto(lead.melhorHorarioContato),
		lead.origemConhecimento,
	];
	if (obrigatorios.some((item) => !item)) return false;
	if (
		lead.origemConhecimento === INDICACAO_AMIGO ||
		lead.origemConhecimento === INDICACAO_PRESTADOR
	) {
		if (!texto(lead.indicadorNome) || !texto(lead.indicadorContato)) return false;
		if (!texto(lead.indicadorRelacionamento) || !lead.indicadorDesde) return false;
	}
	if (lead.tipoCliente === "consultoria" && lead.numClientesConsultoria == null) {
		return false;
	}
	return linhas.every(linhaCompleta);
}

export function limparIndicacaoSeMidia(lead: Lead): void {
	if (!MIDIAS.includes(lead.origemConhecimento as (typeof MIDIAS)[number])) return;
	lead.indicadorNome = "";
	lead.indicadorContato = "";
	lead.indicadorRelacionamento = "";
	lead.indicadorDesde = null;
}

export function valorIndicativo(plano: string, areaHa: number): number | null {
	const item = PLANOS[plano as PlanoFechado];
	if (!item) return null;
	const excedente = Math.max(0, areaHa - item.franquiaHa) * EXCEDENTE_HA;
	return Math.round((item.piso + excedente) * 100) / 100;
}

export function podeInformarValor(lead: Lead): boolean {
	return lead.planoSugerido in PLANOS && lead.propriedades.length > 0;
}

export function resolverContato(
	lead: Lead,
	regiao: Regiao | null,
	gerente: string | null,
	felipe: string | null,
): string | null {
	if (lead.responsavelContato) return lead.responsavelContato;
	if (
		lead.origemConhecimento === INDICACAO_AMIGO ||
		lead.origemConhecimento === INDICACAO_PRESTADOR
	) {
		return lead.responsavelContato ?? null;
	}
	if (regiao?.hunter && regiao.hunterDisponivel !== false) {
		lead.hunterAtribuido = regiao.hunter;
		lead.responsavelContato = regiao.hunter;
		return regiao.hunter;
	}
	if (regiao?.parceiro) {
		lead.responsavelContato = regiao.parceiro;
		return regiao.parceiro;
	}
	if (gerente) {
		lead.responsavelContato = gerente;
		return gerente;
	}
	if (felipe) {
		lead.responsavelContato = felipe;
		return felipe;
	}
	return null;
}

export type ResultadoDono = "definido" | "empate" | "sem_dados";

export function definirDono(
	lead: Lead,
	gerente: string | null,
	felipe: string | null,
): ResultadoDono {
	if (lead.donoConta) return "definido";
	const hunter = lead.dataInicioRelacionamentoHunter;
	const parceiro = lead.dataInicioRelacionamentoParceiro;
	if (!hunter || !parceiro || !lead.evidenciaRelacionamento) return "sem_dados";
	if (!lead.hunterAtribuido || !lead.parceiroOrigem) return "sem_dados";
	if (hunter === parceiro) {
		lead.donoConta = null;
		lead.responsavelConflito = gerente || felipe;
		return "empate";
	}
	lead.donoConta = hunter < parceiro ? lead.hunterAtribuido : lead.parceiroOrigem;
	return "definido";
}
