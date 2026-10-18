function intervaloAgradavel(amplitude: number, quantidade: number, inteiro: boolean) {
  const intervaloBruto = amplitude / quantidade;
  const potencia = 10 ** Math.floor(Math.log10(intervaloBruto));
  const proporcao = intervaloBruto / potencia;
  const fator =
    proporcao <= 1
      ? 1
      : proporcao <= 2
        ? 2
        : proporcao <= 2.5
          ? 2.5
          : proporcao <= 5
            ? 5
            : 10;
  return Math.max(inteiro ? 1 : 0, fator * potencia);
}

// Escalas definem somente a geometria dos eixos, sem recalcular estatísticas.
export function criarEscalaIntervalo(minimo: number, maximo: number, quantidade = 5, inteiro = false) {
  if (minimo === maximo) {
    const margem = Math.abs(minimo) * 0.1 || 1;
    minimo -= margem;
    maximo += margem;
  }
  const intervalo = intervaloAgradavel(maximo - minimo, quantidade, inteiro);
  const arredondar = (valor: number) => Number(valor.toPrecision(12));
  const inicio = arredondar(Math.floor(minimo / intervalo) * intervalo);
  const limite = arredondar(Math.ceil(maximo / intervalo) * intervalo);
  const marcacoes = Array.from(
    { length: Math.round((limite - inicio) / intervalo) + 1 },
    (_, index) => arredondar(inicio + index * intervalo),
  );

  return { inicio, intervalo, limite, marcacoes };
}

export function criarEscalaAgradavel(maximo: number, quantidade = 5, inteiro = false) {
  const escala = criarEscalaIntervalo(0, maximo > 0 ? maximo : 1, quantidade, inteiro);
  // Um bloco livre acima das marcas evita encostar no teto do gráfico.
  const limite = Number((escala.limite + escala.intervalo).toPrecision(12));
  return { ...escala, limite, marcacoes: [...escala.marcacoes, limite] };
}
