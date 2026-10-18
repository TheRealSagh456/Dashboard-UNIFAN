const formatador = new Intl.NumberFormat("pt-BR", { maximumSignificantDigits: 5 });
const cientifico = new Intl.NumberFormat("pt-BR", { notation: "scientific", maximumFractionDigits: 3 });

export function formatarValorDoEixo(valor: number) {
  const absoluto = Math.abs(valor);
  return (absoluto > 0 && (absoluto < 0.0001 || absoluto >= 1000000) ? cientifico : formatador).format(valor);
}

export function quebrarRotulo(texto: string, largura = 20, maximoLinhas = 3) {
  const palavras = texto.split(/\s+/);
  const linhas: string[] = [];
  let linha = "";
  for (const palavra of palavras) {
    if (linha && linha.length + palavra.length + 1 > largura) {
      linhas.push(linha);
      linha = "";
    }
    linha += (linha ? " " : "") + palavra;
  }
  if (linha) linhas.push(linha);
  return linhas.slice(0, maximoLinhas).map((valor, i) =>
    valor.length > largura || (i === maximoLinhas - 1 && linhas.length > maximoLinhas)
      ? valor.slice(0, largura - 1) + "…" : valor,
  );
}

export function criarSetores<T extends { value: number }>(data: T[]) {
  const total = data.reduce((soma, item) => soma + item.value, 0);
  let acumulado = 0;
  return data.map((item) => {
    const start = total ? (acumulado / total) * 360 : 0;
    acumulado += item.value;
    return { ...item, start, end: total ? (acumulado / total) * 360 : 0 };
  });
}
