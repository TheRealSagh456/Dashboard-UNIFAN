export function separarAlternativas(valor: string | null) {
  return [...new Set((valor ?? "").split(";").map((item) => item.trim()).filter(Boolean))];
}

export function sugerirRespostasMultiplas(cabecalho: string, valores: Array<string | null>) {
  const nome = cabecalho.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();
  return /^(quais\b|marque\b|selecione\b)|multipla escolha|mais de uma|todas as opcoes/.test(nome)
    && valores.some((valor) => separarAlternativas(valor).length > 1);
}
