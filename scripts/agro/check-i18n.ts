#!/usr/bin/env bun
/**
 * Add-on Agro — verificação do catálogo pt-BR.
 *
 * Uso:  bun scripts/agro/check-i18n.ts [--hardcoded] [caminho...]
 *
 * 1. Lista chaves usadas em tr("...") que ainda não estão em
 *    packages/agro-i18n/src/pt-BR.json (aparecem em inglês na tela).
 * 2. Lista chaves do catálogo que não são mais usadas (o upstream mudou o texto).
 * 3. Com --hardcoded: lista textos em JSX/props que parecem visíveis ao usuário
 *    e ainda não foram envolvidos em tr() (heurística; revise manualmente).
 * Sai com código 1 se houver chaves faltando.
 */
import { readFileSync } from "node:fs";
import { Glob } from "bun";

const ROOT = new URL("../../", import.meta.url).pathname;
const args = process.argv.slice(2);
const hardcoded = args.includes("--hardcoded");
const paths = args.filter((a) => !a.startsWith("--"));
const roots = paths.length ? paths : ["apps/app", "packages/ui/src"];

const catalog: Record<string, string> = JSON.parse(
	readFileSync(`${ROOT}packages/agro-i18n/src/pt-BR.json`, "utf8"),
);

const used = new Set<string>();
const missing = new Map<string, string>();
const suspects: string[] = [];

const TR = /\btr(?:Plural)?\(\s*(?:[^,"]+,\s*)?"((?:[^"\\]|\\.)*)"/g;
const STAGE = /label: "([^"]+)", tone/g;
const JSX_TEXT = />\s*([A-Z][A-Za-z ,.'’…?!—-]*[a-z.…?!])\s*</g;
const PROP =
	/\b(?:header|label|title|placeholder|description|aria-label|allLabel|empty)(?:=|: )"([A-Z][^"]*[a-z][^"]*)"/g;

for (const root of roots) {
	const glob = new Glob("**/*.{ts,tsx}");
	for (const rel of glob.scanSync({ cwd: `${ROOT}${root}` })) {
		if (rel.includes("node_modules") || rel.includes(".next/")) continue;
		const file = `${root}/${rel}`;
		const src = readFileSync(`${ROOT}${file}`, "utf8");
		for (const re of [TR, STAGE]) {
			for (const m of src.matchAll(re)) {
				const key = m[1].replace(/\\"/g, '"');
				used.add(key);
				if (!(key in catalog)) missing.set(key, file);
			}
		}
		if (hardcoded) {
			src.split("\n").forEach((line, i) => {
				if (/^\s*(import|\/\/|\*)/.test(line) || line.includes("className"))
					return;
				for (const re of [JSX_TEXT, PROP]) {
					for (const m of line.matchAll(re)) {
						suspects.push(`${file}:${i + 1}  ${m[1]}`);
					}
				}
			});
		}
	}
}

const unused = Object.keys(catalog).filter((k) => !used.has(k));
console.log(
	`Catálogo: ${Object.keys(catalog).length} chaves; usadas: ${used.size}`,
);
console.log(`\nFaltando no pt-BR.json (${missing.size}):`);
for (const [k, f] of missing) console.log(`  "${k}"  (${f})`);
if (!paths.length) {
	console.log(`\nSem uso no código (${unused.length}):`);
	for (const k of unused) console.log(`  "${k}"`);
}
if (hardcoded) {
	console.log(`\nTextos fixos sem tr() (${suspects.length}):`);
	for (const s of suspects) console.log(`  ${s}`);
}
process.exit(missing.size ? 1 : 0);
