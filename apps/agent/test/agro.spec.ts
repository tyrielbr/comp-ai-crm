import { describe, expect, it } from "bun:test";
import {
	classificar,
	definirDono,
	leadVazio,
	podeInformarValor,
	resolverContato,
	triagemPronta,
	valorIndicativo,
} from "../agent/lib/agro";

describe("regras comerciais Agro-SaaS", () => {
	it("escolhe Padrão e cobra o excedente acima de 700 ha", () => {
		const lead = leadVazio({
			tipoCliente: "produtor",
			propriedades: [{ areaTotalHa: 800, areaIrrigadaHa: 0 }],
		});
		classificar(lead);
		expect(lead.planoSugerido).toBe("Padrao");
		expect(lead.contratoCustomizado).toBe(false);
		expect(valorIndicativo("Padrao", 800)).toBe(880);
	});

	it("escolhe Profissional quando há irrigação", () => {
		const lead = leadVazio({
			tipoCliente: "produtor",
			propriedades: [{ areaTotalHa: 400, areaIrrigadaHa: 10 }],
		});
		classificar(lead);
		expect(lead.planoSugerido).toBe("Profissional");
		expect(valorIndicativo("Profissional", 400)).toBe(1190);
	});

	it("marca contrato custom acima de 2.767 ha e não inventa número sem plano", () => {
		const lead = leadVazio({
			tipoCliente: "produtor",
			propriedades: [{ areaTotalHa: 3000 }],
		});
		classificar(lead);
		expect(lead.contratoCustomizado).toBe(true);
		expect(podeInformarValor(lead)).toBe(true);
		expect(valorIndicativo("Em_validacao", 3000)).toBeNull();
	});

	it("cai no Felipe quando a região não tem Hunter nem Parceiro", () => {
		const lead = leadVazio({ origemConhecimento: "Google" });
		expect(resolverContato(lead, {}, null, "felipe")).toBe("felipe");
	});

	it("deixa o dono vazio quando as datas empatam", () => {
		const lead = leadVazio({
			hunterAtribuido: "hunter-1",
			parceiroOrigem: "parceiro-1",
			dataInicioRelacionamentoHunter: "2020-01-01",
			dataInicioRelacionamentoParceiro: "2020-01-01",
			evidenciaRelacionamento: true,
		});
		expect(definirDono(lead, "gerente", "felipe")).toBe("empate");
		expect(lead.donoConta).toBeNull();
		expect(lead.responsavelConflito).toBe("gerente");
	});

	it("recusa triagem sem origem", () => {
		const lead = leadVazio({
			propriedades: [
				{
					municipio: "Rio Verde",
					uf: "GO",
					areaTotalHa: 1,
					areaPropriaHa: 1,
					areaArrendadaHa: 0,
					areaIrrigadaHa: 0,
					qtdMaquinario: 0,
					estruturaDistinta: "nao",
				},
			],
		});
		expect(triagemPronta(lead)).toBe(false);
	});
});
