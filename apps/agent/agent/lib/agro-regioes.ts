export type RegiaoComercial = {
	slug: string;
	label: string;
	hunter: string | null;
	parceiro: string | null;
	hunterDisponivel: boolean;
};

/** Onze regiões. Hunter e Parceiro ficam vazios até alguém gravar o usuário. */
export const REGIOES: readonly RegiaoComercial[] = [
	{
		slug: "anapolis-goiania",
		label: "Anapolis/Goiania",
		hunter: null,
		parceiro: null,
		hunterDisponivel: true,
	},
	{
		slug: "estrada-de-ferro",
		label: "Estrada de Ferro",
		hunter: null,
		parceiro: null,
		hunterDisponivel: true,
	},
	{
		slug: "cristalina",
		label: "Cristalina",
		hunter: null,
		parceiro: null,
		hunterDisponivel: true,
	},
	{
		slug: "unai-paracatu",
		label: "Unai/Paracatu",
		hunter: null,
		parceiro: null,
		hunterDisponivel: true,
	},
	{
		slug: "sp-pr",
		label: "SP/PR",
		hunter: null,
		parceiro: null,
		hunterDisponivel: true,
	},
	{
		slug: "ms",
		label: "MS",
		hunter: null,
		parceiro: null,
		hunterDisponivel: true,
	},
	{
		slug: "mt-sw-para",
		label: "MT/Sudoeste do Para",
		hunter: null,
		parceiro: null,
		hunterDisponivel: true,
	},
	{
		slug: "to",
		label: "TO",
		hunter: null,
		parceiro: null,
		hunterDisponivel: true,
	},
	{
		slug: "ma",
		label: "MA",
		hunter: null,
		parceiro: null,
		hunterDisponivel: true,
	},
	{
		slug: "pi-ba",
		label: "PI/BA",
		hunter: null,
		parceiro: null,
		hunterDisponivel: true,
	},
	{
		slug: "sc-rs",
		label: "SC/RS",
		hunter: null,
		parceiro: null,
		hunterDisponivel: true,
	},
];

export function regiaoPorRotulo(rotulo: string): RegiaoComercial | null {
	const alvo = rotulo.trim().toLowerCase();
	return (
		REGIOES.find(
			(regiao) => regiao.label.toLowerCase() === alvo || regiao.slug === alvo,
		) ?? null
	);
}
