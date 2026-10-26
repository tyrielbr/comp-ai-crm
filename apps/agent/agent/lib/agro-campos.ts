import type { FieldEntity, FieldType } from "@crm/db/enums";
import { fieldKeyFromLabel } from "@crm/db/fields";
import { REGIOES } from "./agro-regioes";

export type CampoAgro = {
	entity: FieldEntity;
	label: string;
	type: FieldType;
	options?: string[];
	agentBrief: string;
};

const REGRA =
	"Plano, dono, responsavel e valor indicativo saem da ferramenta agro_comercial. Nao calcule e nao invente.";

export const CAMPOS_AGRO: readonly CampoAgro[] = [
	{
		entity: "COMPANY",
		label: "Tipo de cliente",
		type: "SELECT",
		options: ["produtor", "consultoria"],
		agentBrief: "produtor ou consultoria, como a pessoa se descreveu.",
	},
	{
		entity: "COMPANY",
		label: "Tipo de pessoa",
		type: "SELECT",
		options: ["CPF", "CNPJ"],
		agentBrief: "CPF ou CNPJ informado. Nao chute.",
	},
	{
		entity: "COMPANY",
		label: "Culturas",
		type: "TEXT",
		agentBrief: "Culturas que a pessoa disse que planta.",
	},
	{
		entity: "COMPANY",
		label: "Atividades secundarias",
		type: "TEXT",
		agentBrief: "Outras atividades alem da lavoura principal, se houver.",
	},
	{
		entity: "COMPANY",
		label: "Equipe tecnica",
		type: "SELECT",
		options: ["sim", "nao"],
		agentBrief: "sim ou nao, se existe equipe tecnica.",
	},
	{
		entity: "COMPANY",
		label: "Origem do conhecimento",
		type: "SELECT",
		options: [
			"Indicacao de amigo",
			"Indicacao de prestador de servico",
			"Google",
			"Facebook",
			"Instagram",
			"YouTube",
			"Outro meio",
		],
		agentBrief: "Como conheceu a Agro-SaaS. Midia zera os campos de indicacao.",
	},
	{
		entity: "COMPANY",
		label: "Nome de quem indicou",
		type: "TEXT",
		agentBrief: "So em indicacao. Nome de quem indicou.",
	},
	{
		entity: "COMPANY",
		label: "Contato de quem indicou",
		type: "TEXT",
		agentBrief: "So em indicacao. Telefone ou outro contato de quem indicou.",
	},
	{
		entity: "COMPANY",
		label: "Relacionamento com quem indicou",
		type: "TEXT",
		agentBrief: "So em indicacao. Como se conhecem.",
	},
	{
		entity: "COMPANY",
		label: "Indicacao desde",
		type: "DATE",
		agentBrief: "So em indicacao. Desde quando se conhecem, YYYY-MM-DD.",
	},
	{
		entity: "COMPANY",
		label: "Regiao comercial",
		type: "SELECT",
		options: REGIOES.map((regiao) => regiao.label),
		agentBrief: "Regiao comercial da fazenda. Hunter e Parceiro vem dessa lista.",
	},
	{
		entity: "COMPANY",
		label: "Regioes de atuacao",
		type: "TEXT",
		agentBrief: "Onde a pessoa disse que atua.",
	},
	{
		entity: "COMPANY",
		label: "Melhor horario de contato",
		type: "TEXT",
		agentBrief: "Horario que a pessoa pediu para ser procurada.",
	},
	{
		entity: "COMPANY",
		label: "Quantidade de propriedades",
		type: "NUMBER",
		agentBrief: "Quantas propriedades a pessoa declarou.",
	},
	{
		entity: "COMPANY",
		label: "Clientes da consultoria",
		type: "NUMBER",
		agentBrief: "So consultoria. Numero de clientes atendidos.",
	},
	{
		entity: "COMPANY",
		label: "Propriedades",
		type: "LONG_TEXT",
		agentBrief:
			"JSON das propriedades: municipio, uf, areas, maquinas e estrutura distinta. A ferramenta agro_comercial grava o consolidado.",
	},
	{
		entity: "COMPANY",
		label: "Area total ha",
		type: "NUMBER",
		agentBrief: REGRA,
	},
	{
		entity: "COMPANY",
		label: "Irrigacao",
		type: "CHECKBOX",
		agentBrief: REGRA,
	},
	{
		entity: "COMPANY",
		label: "Plano sugerido",
		type: "SELECT",
		options: ["Padrao", "Profissional", "Empresarial", "Em_validacao"],
		agentBrief: REGRA,
	},
	{
		entity: "COMPANY",
		label: "Contrato customizado",
		type: "CHECKBOX",
		agentBrief: "Ligado quando a area total passa de 2767 ha. Nao encerra a triagem.",
	},
	{
		entity: "COMPANY",
		label: "Confianca do plano",
		type: "TEXT",
		agentBrief: REGRA,
	},
	{
		entity: "COMPANY",
		label: "Responsavel do contato",
		type: "TEXT",
		agentBrief: REGRA,
	},
	{
		entity: "COMPANY",
		label: "Dono da conta",
		type: "TEXT",
		agentBrief: "Quem faz a proposta. Empate de datas deixa vazio.",
	},
	{
		entity: "COMPANY",
		label: "Responsavel do conflito",
		type: "TEXT",
		agentBrief: "Gerente ou Felipe, quando as datas de relacionamento empatam.",
	},
	{
		entity: "DEAL",
		label: "Plano do negocio",
		type: "SELECT",
		options: ["Padrao", "Profissional", "Empresarial", "Em_validacao"],
		agentBrief: REGRA,
	},
	{
		entity: "DEAL",
		label: "Valor indicativo BRL",
		type: "NUMBER",
		agentBrief:
			"Reais, nao e proposta. So existe com plano Padrao, Profissional ou Empresarial e area coletada.",
	},
	{
		entity: "DEAL",
		label: "Texto do valor indicativo",
		type: "LONG_TEXT",
		agentBrief: "Frase dita ao lead. Deixa claro que nao e proposta.",
	},
];

export function chaveDoCampo(label: string): string {
	return fieldKeyFromLabel(label);
}
