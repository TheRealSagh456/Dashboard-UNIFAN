export function formatarTituloDoArquivo(nomeArquivo: string) {
  const semExtensao = nomeArquivo.replace(/\.[^.]+$/, "");
  const palavras = semExtensao
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!palavras) return "Relatório do dashboard";
  return palavras.charAt(0).toLocaleUpperCase("pt-BR") + palavras.slice(1);
}
