import { defineTool } from "eve/tools";
import { z } from "zod";
import {
	classificar,
	definirDono,
	type Lead,
	leadVazio,
	limparIndicacaoSeMidia,
	type Propriedade,
	podeInformarValor,
	resolverContato,
	triagemPronta,
	valorIndicativo,
} from "../lib/agro";
import { chaveDoCampo } from "../lib/agro-campos";
import { regiaoPorRotulo } from "../lib/agro-regioes";
import { writeField } from "../lib/fields";
import { focusOn } from "../lib/focus";
import { assertResearchPurpose } from "../lib/session-purpose";

const propriedade = z.object({
	municipio: z.string().optional(),
	uf: z.string().optional(),
	areaTotalHa: z.number().nullable().optional(),
	areaPropriaHa: z.number().nullable().optional(),
	areaArrendadaHa: z.number().nullable().optional(),
	areaIrrigadaHa: z.number().nullable().optional(),
	qtdMaquinario: z.number().int().nullable().optional(),
	estruturaDistinta: z.enum(["sim", "nao"]).optional(),
});

const FRASE = "Valor indicativo, nao e proposta. O consultor fecha o numero.";

export default defineTool({
	description:
		"Apply Agro-SaaS commercial rules to a company and, when given, its deal. Classifies the plan, the indicative price and the next owner. Never invent a price or choose a tied owner yourself.",
	inputSchema: z.object({
		companyId: z.string(),
		dealId: z.string().optional(),
		tipoCliente: z.enum(["produtor", "consultoria"]).optional(),
		tipoPessoa: z.enum(["CPF", "CNPJ"]).optional(),
		culturas: z.string().optional(),
		atividadesSecundarias: z.string().optional(),
		possuiEquipeTecnica: z.enum(["sim", "nao"]).optional(),
		origemConhecimento: z.string().optional(),
		indicadorNome: z.string().optional(),
		indicadorContato: z.string().optional(),
		indicadorRelacionamento: z.string().optional(),
		indicadorDesde: z.string().optional(),
		regiao: z.string().optional(),
		regioesAtuacao: z.string().optional(),
		melhorHorarioContato: z.string().optional(),
		qtdPropriedades: z.number().int().optional(),
		numClientesConsultoria: z.number().int().nullable().optional(),
		propriedades: z.array(propriedade).default([]),
		hunterAtribuido: z.string().nullable().optional(),
		parceiroOrigem: z.string().nullable().optional(),
		responsavelContato: z.string().nullable().optional(),
		dataInicioRelacionamentoHunter: z.string().nullable().optional(),
		dataInicioRelacionamentoParceiro: z.string().nullable().optional(),
		evidenciaRelacionamento: z.boolean().optional(),
		donoConta: z.string().nullable().optional(),
		gerenteUserId: z.string().nullable().optional(),
		felipeUserId: z.string().nullable().optional(),
	}),
	async execute(input, ctx) {
		assertResearchPurpose(ctx);
		focusOn({ companyId: input.companyId });

		const lead: Lead = leadVazio({
			propriedades: input.propriedades as Propriedade[],
			qtdPropriedades: input.qtdPropriedades,
			tipoCliente: input.tipoCliente,
			tipoPessoa: input.tipoPessoa,
			culturas: input.culturas,
			atividadesSecundarias: input.atividadesSecundarias,
			possuiEquipeTecnica: input.possuiEquipeTecnica,
			origemConhecimento: input.origemConhecimento,
			indicadorNome: input.indicadorNome,
			indicadorContato: input.indicadorContato,
			indicadorRelacionamento: input.indicadorRelacionamento,
			indicadorDesde: input.indicadorDesde,
			regiao: input.regiao,
			regioesAtuacao: input.regioesAtuacao,
			melhorHorarioContato: input.melhorHorarioContato,
			numClientesConsultoria: input.numClientesConsultoria,
			hunterAtribuido: input.hunterAtribuido,
			parceiroOrigem: input.parceiroOrigem,
			responsavelContato: input.responsavelContato,
			dataInicioRelacionamentoHunter: input.dataInicioRelacionamentoHunter,
			dataInicioRelacionamentoParceiro: input.dataInicioRelacionamentoParceiro,
			evidenciaRelacionamento: input.evidenciaRelacionamento,
			donoConta: input.donoConta,
		});

		limparIndicacaoSeMidia(lead);
		classificar(lead);
		const pronta = triagemPronta(lead);
		const cadastrada = input.regiao ? regiaoPorRotulo(input.regiao) : null;
		const responsavel = resolverContato(
			lead,
			cadastrada,
			input.gerenteUserId ?? null,
			input.felipeUserId ?? null,
		);
		const dono = definirDono(
			lead,
			input.gerenteUserId ?? null,
			input.felipeUserId ?? null,
		);
		const valor = podeInformarValor(lead)
			? valorIndicativo(lead.planoSugerido, lead.areaHa)
			: null;

		const companyValues = {
			[chaveDoCampo("Tipo de cliente")]: lead.tipoCliente || null,
			[chaveDoCampo("Tipo de pessoa")]: lead.tipoPessoa || null,
			[chaveDoCampo("Culturas")]: lead.culturas || null,
			[chaveDoCampo("Atividades secundarias")]:
				lead.atividadesSecundarias || null,
			[chaveDoCampo("Equipe tecnica")]: lead.possuiEquipeTecnica || null,
			[chaveDoCampo("Origem do conhecimento")]: lead.origemConhecimento || null,
			[chaveDoCampo("Nome de quem indicou")]: lead.indicadorNome || null,
			[chaveDoCampo("Contato de quem indicou")]: lead.indicadorContato || null,
			[chaveDoCampo("Relacionamento com quem indicou")]:
				lead.indicadorRelacionamento || null,
			[chaveDoCampo("Indicacao desde")]: lead.indicadorDesde || null,
			[chaveDoCampo("Regiao comercial")]:
				cadastrada?.label ?? lead.regiao ?? null,
			[chaveDoCampo("Regioes de atuacao")]: lead.regioesAtuacao || null,
			[chaveDoCampo("Melhor horario de contato")]:
				lead.melhorHorarioContato || null,
			[chaveDoCampo("Quantidade de propriedades")]:
				lead.qtdPropriedades ?? null,
			[chaveDoCampo("Clientes da consultoria")]:
				lead.numClientesConsultoria ?? null,
			[chaveDoCampo("Propriedades")]: JSON.stringify(lead.propriedades),
			[chaveDoCampo("Area total ha")]: lead.areaHa,
			[chaveDoCampo("Irrigacao")]: lead.irrigacao,
			[chaveDoCampo("Plano sugerido")]: lead.planoSugerido || null,
			[chaveDoCampo("Contrato customizado")]: lead.contratoCustomizado,
			[chaveDoCampo("Confianca do plano")]: lead.confiancaPlano || null,
			[chaveDoCampo("Responsavel do contato")]: responsavel,
			[chaveDoCampo("Dono da conta")]: lead.donoConta ?? null,
			[chaveDoCampo("Responsavel do conflito")]:
				lead.responsavelConflito ?? null,
		} satisfies Record<string, string | number | boolean | null>;

		const escritos: string[] = [];
		const recusados: { key: string; reason: string }[] = [];
		for (const [key, value] of Object.entries(companyValues)) {
			if (!key) continue;
			const result = await writeField({
				entity: "COMPANY",
				recordId: input.companyId,
				key,
				value,
			});
			if (result.written) escritos.push(key);
			else recusados.push({ key, reason: result.reason });
		}

		if (input.dealId) {
			const dealValues = {
				[chaveDoCampo("Plano do negocio")]: lead.planoSugerido || null,
				[chaveDoCampo("Valor indicativo BRL")]: valor,
				[chaveDoCampo("Texto do valor indicativo")]:
					valor === null ? null : FRASE,
			} satisfies Record<string, string | number | null>;
			for (const [key, value] of Object.entries(dealValues)) {
				const result = await writeField({
					entity: "DEAL",
					recordId: input.dealId,
					key,
					value,
				});
				if (result.written) escritos.push(key);
				else recusados.push({ key, reason: result.reason });
			}
		}

		return {
			triagemPronta: pronta,
			planoSugerido: lead.planoSugerido || null,
			confiancaPlano: lead.confiancaPlano || null,
			areaHa: lead.areaHa,
			irrigacao: lead.irrigacao,
			contratoCustomizado: lead.contratoCustomizado,
			valorIndicativoBrl: valor,
			valorEhProposta: false as const,
			responsavelContato: responsavel,
			dono: dono,
			donoConta: lead.donoConta ?? null,
			responsavelConflito: lead.responsavelConflito ?? null,
			escritos,
			recusados,
		};
	},
});
