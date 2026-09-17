export function criarEscalaAgradavel(maximo: number, quantidade = 5) {
  const valorSeguro = Math.max(1, maximo);
  const intervaloBruto = valorSeguro / quantidade;
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
  const intervalo = fator * potencia;
  const limite = Math.ceil(valorSeguro / intervalo) * intervalo;
  const marcacoes = Array.from(
    { length: Math.round(limite / intervalo) + 1 },
    (_, index) => index * intervalo,
  );

  return { intervalo, limite, marcacoes };
}
