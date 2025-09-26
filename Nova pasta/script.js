// ===============================
// JAVASCRIPT FUNCIONAL COM RESUMO E COMPARATIVO DE EQUIPAMENTOS (ATUALIZADO)
// ===============================

const grupos = ["debito", "credito"];
const bandeiras = ["visa", "master", "elo", "amex", "hiper"];
const detalhesTabela = {};
const totalTexto = {};

// Inicializa objetos para cada grupo
grupos.forEach(grupo => {
  detalhesTabela[grupo] = [];
  totalTexto[grupo] = "";
});

// Máscara para campos numéricos
["agencia", "conta", "cnpj-empresa"].forEach(id => {
  const campo = document.getElementById(id);
  if (campo) {
    campo.addEventListener("input", () => {
      campo.value = campo.value.replace(/\D/g, "");
    });
  }
});

function criarSeção(grupo, titulo) {
  const isParcelamento = grupo.startsWith("parcelamento");

  const tooltipHtml = `
    <div class="tooltip-wrapper" style="margin-left: 10px;">
  <span class="tooltip-icon">i</span>
  <span class="tooltip-text">
    Com base no <strong>faturamento mensal</strong> informado e nas <strong>taxas da Cielo</strong> e do <strong>concorrente</strong>, 
    o sistema calcula a <strong>diferença mensal</strong> e <strong>anual</strong> de custos.
  </span>
</div>

  `;

  let tituloHtml;

  if (isParcelamento) {
    tituloHtml = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2 style="display: flex; align-items: center; gap: 10px;">
          <div>
            Parcelamento 
            <span contenteditable="true" class="editable-titulo" data-grupo="${grupo}">${titulo}</span>
            <small class="dica-edicao">← (clique para editar)</small>
          </div>
        </h2>
        <div style="display: flex; align-items: center; gap: 10px;">
          <button type="button" class="remove-btn" data-remover="${grupo}">🗑 Remover</button>
          ${tooltipHtml}
        </div>
      </div>
    `;
  } else {
    tituloHtml = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2>${titulo}</h2>
        ${tooltipHtml}
      </div>
    `;
  }

  const listaBandeiras = grupo === "debito" ? ["visa", "master", "elo"] : [...bandeiras];

  let tabela = `<section class="comparativo-bandeiras" style='margin-bottom:60px'>
      <form id="form-${grupo}">
        ${tituloHtml}
        <table class="tabela-comparativa">
          <thead>
            <tr>
              <th>Bandeira</th>
              <th>Faturamento Mês (R$)</th>
              <th>Taxa Cielo (%)</th>
              <th>Taxa Conc (%)</th>
              <th>Custo Cielo</th>
              <th>Custo Conc</th>
              <th>Diferença</th>
            </tr>
          </thead>
          <tbody>`;

  listaBandeiras.forEach(b => {
    const label = b.toUpperCase();
    const imagem = `<img src="img/${b}.png" alt="${label}" class="logo-bandeira">`;

    tabela += `<tr>
      <td>${imagem} ${label}</td>
      <td><input type="number" name="${grupo}-faturamento-${b}"></td>
      <td><input type="number" name="${grupo}-taxaCielo-${b}"></td>
      <td><input type="number" name="${grupo}-taxaConc-${b}"></td>
      <td><input type="text" name="${grupo}-custoCielo-${b}" disabled></td>
      <td><input type="text" name="${grupo}-custoConc-${b}" disabled></td>
      <td><input type="text" name="${grupo}-dif-reais-${b}" disabled></td>
    </tr>`;
  });

  tabela += `</tbody></table>
    <div class="form-actions">
      <button type="button" class="add-btn green" data-grupo="${grupo}" data-action="calcular">Calcular Diferença</button>
      <button type="button" class="add-btn red" data-grupo="${grupo}" data-action="limpar">Limpar Tudo</button>
    </div>
    <div id="resumo-${grupo}" class="resumo-visual" style="margin-top: 40px;"></div>
  </form></section>`;

  return tabela;
}


// Função utilitária para extrair número de string
function formatarParaNumero(texto) {
  return parseFloat((texto || "0").replace(/[^\d.\-]/g, "")) || 0;
}

// Calcula os valores da linha para cada bandeira
function calcularLinha(grupo, bandeira) {
  const faturamento = formatarParaNumero(document.querySelector(`[name='${grupo}-faturamento-${bandeira}']`).value);
  const taxaCielo = formatarParaNumero(document.querySelector(`[name='${grupo}-taxaCielo-${bandeira}']`).value);
  const taxaConc = formatarParaNumero(document.querySelector(`[name='${grupo}-taxaConc-${bandeira}']`).value);

  const custoCielo = faturamento * (taxaCielo / 100);
  const custoConc = faturamento * (taxaConc / 100);
  const diffReais = custoCielo - custoConc;

  // 👉 Atualiza os campos da tabela
  const campoCielo = document.querySelector(`[name='${grupo}-custoCielo-${bandeira}']`);
  const campoConc = document.querySelector(`[name='${grupo}-custoConc-${bandeira}']`);
  const campoDif = document.querySelector(`[name='${grupo}-dif-reais-${bandeira}']`);

  if (campoCielo) campoCielo.value = `R$ ${formatarMoeda(custoCielo)}`;
  if (campoConc) campoConc.value = `R$ ${formatarMoeda(custoConc)}`;
  if (campoDif) campoDif.value = `${diffReais >= 0 ? "+" : "-"}R$ ${formatarMoeda(Math.abs(diffReais))}`;

  return {
    bandeira,
    custoCielo,
    custoConc,
    diffReais,
    faturamento
  };
}



function calcularResumo(grupo) {
  const listaBandeiras = grupo === "debito" ? ["visa", "master", "elo"] : [...bandeiras];
  const resultados = listaBandeiras.map(b => calcularLinha(grupo, b));

  let totalMensal = 0;
  let totalAnual = 0;

  let html = `<div class="resumo-taxas-matriz">`;

  resultados.forEach(r => {
    const mensalCielo = r.custoCielo;
    const mensalConc = r.custoConc;
    const diffMensal = mensalConc - mensalCielo;

    const anualCielo = mensalCielo * 12;
    const anualConc = mensalConc * 12;
    const diffAnual = anualConc - anualCielo;

    totalMensal += diffMensal;
    totalAnual += diffAnual;

    const corMensal = diffMensal >= 0 ? "positivo" : "negativo";
    const corAnual = diffAnual >= 0 ? "positivo" : "negativo";

    html += `
      <div class="card-taxa-detalhado">
        <img src="img/${r.bandeira}.png" alt="${r.bandeira.toUpperCase()}" />
        <span>${r.bandeira.toUpperCase()}</span>
        <p>Mensal Cielo: R$ ${mensalCielo.toFixed(2)}</p>
        <p>Mensal Concorrente: R$ ${mensalConc.toFixed(2)}</p>
        <p class="valor ${corMensal}">Diferença Mensal: ${diffMensal >= 0 ? "+" : "–"}R$ ${Math.abs(diffMensal).toFixed(2)}</p>
        <hr>
        <p>Anual Cielo: R$ ${anualCielo.toFixed(2)}</p>
        <p>Anual Concorrente: R$ ${anualConc.toFixed(2)}</p>
        <p class="valor ${corAnual}">Diferença Anual: ${diffAnual >= 0 ? "+" : "–"}R$ ${Math.abs(diffAnual).toFixed(2)}</p>
      </div>
    `;
  });

  const corTotalMensal = totalMensal >= 0 ? "positivo" : "negativo";
  const corTotalAnual = totalAnual >= 0 ? "positivo" : "negativo";

  html += `
    <div class="card-total">
      <h4>Resultado Total</h4>
      <p class="valor ${corTotalMensal}">Diferença Mensal Total: ${totalMensal >= 0 ? "+" : "–"}R$ ${Math.abs(totalMensal).toFixed(2)}</p>
      <p class="valor ${corTotalAnual}">Diferença Anual Total: ${totalAnual >= 0 ? "+" : "–"}R$ ${Math.abs(totalAnual).toFixed(2)}</p>
    </div>
  </div>`;

  document.getElementById(`resumo-${grupo}`).innerHTML = html;
}






function limparTabela(grupo) {
  const todasBandeiras = [...bandeiras];
  todasBandeiras.forEach(b => {
    ["faturamento", "taxaCielo", "taxaConc", "custoCielo", "custoConc", "dif-reais"].forEach(campo => {
  const el = document.querySelector(`[name='${grupo}-${campo}-${b}']`);
  if (el) el.value = "";
  });
  });
  document.getElementById(`resumo-${grupo}`).innerHTML = "";
}

function formatarNumero(valor) {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}



// ===============================
// EQUIPAMENTOS
// ===============================

function calcularEquipamentos() {
  const campos = ["zip", "flash", "lio", "tef"];

  let totalQtdCielo = 0;
  let totalQtdConc = 0;
  let totalCustoCieloMensal = 0;
  let totalCustoConcMensal = 0;

  campos.forEach(campo => {
    const qtdCielo = parseInt(document.querySelector(`[name='qtd-${campo}']`)?.value) || 0;
    const qtdConc = parseInt(document.querySelector(`[name='qtdc-${campo}']`)?.value) || 0;
    const custoCieloUnit = parseFloat(document.querySelector(`[name='cielo-${campo}']`)?.value) || 0;
    const custoConcUnit = parseFloat(document.querySelector(`[name='conc-${campo}']`)?.value) || 0;

    totalQtdCielo += qtdCielo;
    totalQtdConc += qtdConc;
    totalCustoCieloMensal += qtdCielo * custoCieloUnit;
    totalCustoConcMensal += qtdConc * custoConcUnit;
  });

  const totalCustoCieloAnual = totalCustoCieloMensal * 12;
  const totalCustoConcAnual = totalCustoConcMensal * 12;

  // Diferença para frase comparativa
  const diferenca = totalCustoCieloMensal - totalCustoConcMensal;
  const textoComparativo = diferenca === 0
    ? "A Cielo tem o mesmo custo mensal que o concorrente."
    : diferenca > 0
      ? `A Cielo tem um custo mensal R$ ${diferenca.toFixed(2)} maior que o concorrente.`
      : `A Cielo tem um custo mensal R$ ${Math.abs(diferenca).toFixed(2)} menor que o concorrente.`;

  const html = `
    <div style="display: flex; gap: 40px; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 200px; background: #e6f4ff; padding: 20px; border-radius: 8px;">
        <h4 style="margin-bottom: 10px;">CIELO</h4>
        <p>Qtd Total: <strong>${totalQtdCielo}</strong></p>
        <p>Custo Mensal: <strong>R$ ${totalCustoCieloMensal.toFixed(2)}</strong></p>
        <p>Custo Anual: <strong>R$ ${totalCustoCieloAnual.toFixed(2)}</strong></p>
      </div>
      <div style="flex: 1; min-width: 200px; background: #fff3f3; padding: 20px; border-radius: 8px;">
        <h4 style="margin-bottom: 10px;">Concorrente</h4>
        <p>Qtd Total: <strong>${totalQtdConc}</strong></p>
        <p>Custo Mensal: <strong>R$ ${totalCustoConcMensal.toFixed(2)}</strong></p>
        <p>Custo Anual: <strong>R$ ${totalCustoConcAnual.toFixed(2)}</strong></p>
      </div>
    </div>
    <p style="margin-top: 20px; font-weight: bold; color: #003366;">${textoComparativo}</p>
  `;

  const resultado = document.getElementById("resultado-equipamentos");
  resultado.innerHTML = html;
  resultado.style.display = "block";
}



function limparEquipamentos() {
  const campos = document.querySelectorAll("#equipamentos-form input");
  campos.forEach(campo => {
    campo.value = "";
  });

  const resultado = document.getElementById("resultado-equipamentos");
  resultado.innerHTML = "";
  resultado.style.display = "none";
}



function aplicarEventosGlobais() {
  document.querySelectorAll('[data-action="calcular"]').forEach(btn => {
    btn.onclick = () => calcularResumo(btn.dataset.grupo);
  });
  document.querySelectorAll('[data-action="limpar"]').forEach(btn => {
    btn.onclick = () => limparTabela(btn.dataset.grupo);
  });
  document.querySelectorAll('[data-remover]').forEach(btn => {
    btn.onclick = () => removerParcelamento(btn.dataset.remover);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const secoesContainer = document.getElementById("secoes-comparativas");
  secoesContainer.innerHTML = criarSeção("debito", "Débito") + criarSeção("credito", "Crédito");

  const parcelamentoWrapper = document.getElementById("parcelamento-wrapper");
  if (parcelamentoWrapper) {
    parcelamentoWrapper.innerHTML = criarSeção("parcelamento-1", "6x");
    const botaoAdicionar = document.createElement("div");
    botaoAdicionar.className = "form-actions";
    botaoAdicionar.innerHTML = `<button class="add-btn" onclick="adicionarParcelamento()">+ Adicionar Parcelamento</button>`;
    parcelamentoWrapper.appendChild(botaoAdicionar);
  }

  aplicarEventosGlobais();

  // 👉 ADICIONA ESSA LINHA AQUI:
  inicializarServicos();

  const fatMensal = document.getElementById("fat-mensal");
  const fatAnual = document.getElementById("fat-anual");
  if (fatMensal && fatAnual) {
    fatMensal.addEventListener("input", () => {
      const valor = formatarParaNumero(fatMensal.value);
      fatAnual.value = "R$ " + (valor * 12).toFixed(2);
    });
  }

  const selectRA = document.getElementById("possui-ra");
  if (selectRA) {
    selectRA.addEventListener("change", () => {
      window.possuiRA = selectRA.value;
    });
  }
});


function removerParcelamento(grupo) {
  const form = document.getElementById(`form-${grupo}`);
  if (form) {
    const section = form.closest("section");
    if (section && grupo.startsWith("parcelamento")) {
      section.remove();
    }
  }
}

let contadorParcelamentos = 1;
function adicionarParcelamento() {
  contadorParcelamentos++;
  const novoId = `parcelamento-${contadorParcelamentos}`;
  const wrapper = document.getElementById("parcelamento-wrapper");
  const novaSeção = document.createElement("div");
  novaSeção.innerHTML = criarSeção(novoId, `${contadorParcelamentos + 5}x`);
  wrapper.insertBefore(novaSeção, wrapper.lastElementChild);
  aplicarEventosGlobais();
}

window.toggleSeção = function (id) {
  const el = document.getElementById(id);
  const btn = document.getElementById("btn-toggle-parcelamento");
  const ativo = el.classList.contains("active");
  el.classList.toggle("active");
  btn.textContent = ativo ? "+ Parcelamento" : "– Parcelamento";
};




// ===============================
// JAVASCRIPT - SERVIÇOS
// ===============================

const servicosLista = [
  "Cesta de Serviços",
  "Cartão de Crédito: Anuidade",
  "Pix na Máquina / Pix via QR Code",
  "Boletos: Tarifa de Registro",
  "Folha de Pagamento: Transmissão",
  "TED"
];

function formatarInteiro(valor) {
  return Math.round(valor).toLocaleString("pt-BR");
}

function inicializarServicos() {
  const corpo = document.getElementById("corpo-servicos");

  servicosLista.forEach((nome, i) => {
    const isQtdFixa = i === 0 || i === 1; // Cesta de Serviços e Cartão Anuidade

    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${nome}</td>
      <td><input type="number" class="input-servico" id="qtd-${i}" ${isQtdFixa ? "disabled" : ""}></td>
      <td><input type="number" class="input-servico" id="atual-${i}"></td>
      <td><input type="number" class="input-servico" id="proposto-${i}"></td>
      <td class="bg-calculado"><span id="mes-${i}"></span></td>
      <td class="bg-calculado"><span id="ano-${i}"></span></td>
      <td class="bg-calculado"><span id="perc-${i}"></span></td>
    `;
    corpo.appendChild(linha);
  });
}

function calcularServicos() {
  let totalQtd = 0;
  let totalAtualCalculado = 0;
  let totalPropostoCalculado = 0;
  let totalMes = 0;
  let totalAno = 0;
  let somaPercentuais = 0;
  let linhasValidas = 0;

  servicosLista.forEach((_, i) => {
    const qtdInput = document.getElementById(`qtd-${i}`);
    const atual = parseFloat(document.getElementById(`atual-${i}`)?.value || 0);
    const proposto = parseFloat(document.getElementById(`proposto-${i}`)?.value || 0);

    const qtdParaCalculo = qtdInput.disabled && (atual > 0 || proposto > 0)
      ? 1
      : parseFloat(qtdInput?.value || 0);

    // Cálculos linha a linha
    const mes = (atual - proposto) * qtdParaCalculo;
    const ano = mes * 12;
    const perc = atual !== 0 ? ((atual - proposto) / atual) * 100 : 0;

    document.getElementById(`mes-${i}`).textContent = formatarInteiro(mes);
    document.getElementById(`ano-${i}`).textContent = formatarInteiro(ano);
    document.getElementById(`perc-${i}`).textContent = `${perc.toFixed(1)}%`;

    // Totais das quantidades apenas para linhas não fixas
    if (!qtdInput.disabled) totalQtd += qtdParaCalculo;

    // Acumulando total ponderado de atual e proposto com base na quantidade
    totalAtualCalculado += atual * qtdParaCalculo;
    totalPropostoCalculado += proposto * qtdParaCalculo;

    if (atual !== 0) {
      somaPercentuais += perc;
      linhasValidas++;
    }
  });

  // Total final de diferença mês e ano
  totalMes = totalAtualCalculado - totalPropostoCalculado;
  totalAno = totalMes * 12;

  const mediaPercentual = linhasValidas > 0 ? somaPercentuais / linhasValidas : 0;

  // Atualizar os campos do total (última linha)
  document.getElementById("total-qtd").textContent = formatarInteiro(totalQtd);
  document.getElementById("total-atual").textContent = formatarInteiro(totalAtualCalculado);
  document.getElementById("total-proposto").textContent = formatarInteiro(totalPropostoCalculado);
  document.getElementById("total-mes").textContent = formatarInteiro(totalMes);
  document.getElementById("total-ano").textContent = formatarInteiro(totalAno);
  document.getElementById("total-percentual").textContent = `${mediaPercentual.toFixed(1)}%`;

  // Atualiza quadrantes visuais
  document.getElementById("resumo-serv-mes").textContent = formatarMoeda(totalMes);
  document.getElementById("resumo-serv-ano").textContent = formatarMoeda(totalAno);
  document.getElementById("resumo-serv-perc").textContent = `${mediaPercentual.toFixed(1)}%`;
  document.getElementById("resumo-serv-perc-ano").textContent = `${mediaPercentual.toFixed(1)}%`;

  // Mostra os quadrantes
  document.getElementById("resultado-servicos").style.display = "block";
}




function limparServicos() {
  servicosLista.forEach((_, i) => {
    document.getElementById(`qtd-${i}`).value = "";
    document.getElementById(`atual-${i}`).value = "";
    document.getElementById(`proposto-${i}`).value = "";
    document.getElementById(`mes-${i}`).textContent = "";
    document.getElementById(`ano-${i}`).textContent = "";
    document.getElementById(`perc-${i}`).textContent = "";
  });

  document.getElementById("total-qtd").textContent = "";
  document.getElementById("total-atual").textContent = "";
  document.getElementById("total-proposto").textContent = "";
  document.getElementById("total-mes").textContent = "";
  document.getElementById("total-ano").textContent = "";
  document.getElementById("total-percentual").textContent = "";

  // Esconde o resumo visual de serviços (novidade)
  const boxResumo = document.getElementById("resultado-servicos");
  if (boxResumo) {
    boxResumo.style.display = "none";
  }
}



// ===============================
// JAVASCRIPT - CÁLCULO INVEST FÁCIL (VERSÃO SEGURA)
// ===============================

// Formata valores com separador de milhar e duas casas decimais
// Função para formatar valores como moeda brasileira
function formatarMoeda(valor) {
  return parseFloat(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Atribui valor formatado ao campo se existir
function setValueIfExists(id, valor) {
  const el = document.getElementById(id);
  if (el) el.value = formatarMoeda(valor);
}

// Atualiza automaticamente os valores anuais e totais, incluindo o saldo
function calcularInvestFacilParcial() {
  const get = id => parseFloat(document.getElementById(id)?.value || 0);

  const fatCartao = get("invest-fat");
  const boletos = get("invest-boletos");
  const pix = get("invest-pix");
  const diversos = get("invest-diversos");
  const folha = get("invest-folha");

  const entrada = fatCartao + boletos + pix;
  const saida = diversos + folha;
  const saldoMes = entrada - saida;
  const saldoAno = saldoMes * 12;

  setValueIfExists("invest-fat-ano", fatCartao * 12);
  setValueIfExists("invest-boletos-ano", boletos * 12);
  setValueIfExists("invest-pix-ano", pix * 12);
  setValueIfExists("invest-diversos-ano", diversos * 12);
  setValueIfExists("invest-folha-ano", folha * 12);
  setValueIfExists("invest-saldo-mes", saldoMes);
  setValueIfExists("invest-saldo-ano", saldoAno);
}

// Exibe os quadrantes de saldo e resultado projetado
function calcularInvestFacil() {
  const saldoEl = document.getElementById("invest-saldo-mes");
  const saldo = saldoEl ? parseFloat(saldoEl.value.replace(".", "").replace(",", ".")) : 0;

  const repasseMes = saldo * 0.0136;
  const repasseAno = repasseMes * 12;
  const incrementoMes = repasseMes * 0.05;
  const incrementoAno = incrementoMes * 12;

  const setTextIfExists = (id, valor) => {
    const el = document.getElementById(id);
    if (el) el.textContent = formatarMoeda(valor);
  };

  setTextIfExists("repasse-mes", repasseMes);
  setTextIfExists("repasse-ano", repasseAno);
  setTextIfExists("incremento-mes", incrementoMes);
  setTextIfExists("incremento-ano", incrementoAno);

  const resultadoDiv = document.getElementById("resultado-invest");
  if (resultadoDiv) {
    resultadoDiv.style.display = "flex";
  }
}

// Limpa todos os campos do Invest Fácil e esconde o resumo
function limparInvestFacil() {
  const inputs = document.querySelectorAll("#invest-facil-form input[type='number'], #invest-facil-form input[type='text']");
  inputs.forEach(input => input.value = "");

  const limparSpan = id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "0,00";
  };

  limparSpan("repasse-mes");
  limparSpan("repasse-ano");
  limparSpan("incremento-mes");
  limparSpan("incremento-ano");

  const resultadoDiv = document.getElementById("resultado-invest");
  if (resultadoDiv) resultadoDiv.style.display = "none";
}




// ===============================
// GDAD
// ===============================

function calcularGdadAutomaticamente() {
  const inputFaturamento = document.getElementById("invest-fat");
  const gdadFaturamento = document.getElementById("gdad-faturamento");
  const gdadMes = document.getElementById("gdad-mes");
  const gdadAno = document.getElementById("gdad-ano");

  if (!inputFaturamento || !gdadFaturamento || !gdadMes || !gdadAno) return;

  const valorFaturamento = parseFloat(inputFaturamento.value || 0);

  // Atualiza campo de exibição de faturamento
  gdadFaturamento.value = valorFaturamento.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  // Verifica se R.A está marcado
  const isRaSim = document.getElementById("ra-sim")?.checked;
  const isRaNao = document.getElementById("ra-nao")?.checked;

  // Só calcula se alguma opção estiver marcada
  if (isRaSim || isRaNao) {
    const percentual = isRaSim ? 0.003 : 0.0015;
    const valorMensal = valorFaturamento * percentual;
    const valorAnual = valorMensal * 12;

    gdadMes.value = valorMensal.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

    gdadAno.value = valorAnual.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  } else {
    gdadMes.value = "";
    gdadAno.value = "";
  }
}

// Atualiza GDAD sempre que o faturamento ou R.A for alterado
document.getElementById("invest-fat")?.addEventListener("input", calcularGdadAutomaticamente);
document.getElementById("ra-sim")?.addEventListener("change", calcularGdadAutomaticamente);
document.getElementById("ra-nao")?.addEventListener("change", calcularGdadAutomaticamente);



// ===============================
// RESUMO FINAL
// ===============================

function formatarMoedaResumo(valor) {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function calcularResumoFinal() {
  calcularResumo("debito");
  calcularResumo("credito");
  calcularEquipamentos();
  calcularServicos();
  calcularInvestFacil();

  const gruposValidos = ["debito", "credito"];
  for (let i = 1; i <= contadorParcelamentos; i++) {
    gruposValidos.push(`parcelamento-${i}`);
  }

  let totalMensalTaxas = 0, totalAnualTaxas = 0;
  let totalCustoCieloMensal = 0, totalCustoConcMensal = 0;

  gruposValidos.forEach(grupo => {
    const bandeiras = grupo === "debito" ? ["visa", "master", "elo"] : ["visa", "master", "elo", "amex", "hiper"];
    bandeiras.forEach(b => {
      const f = parseFloat(document.querySelector(`[name='${grupo}-faturamento-${b}']`)?.value || 0);
      const tCielo = parseFloat(document.querySelector(`[name='${grupo}-taxaCielo-${b}']`)?.value || 0);
      const tConc = parseFloat(document.querySelector(`[name='${grupo}-taxaConc-${b}']`)?.value || 0);
      totalCustoCieloMensal += (f * tCielo) / 100;
      totalCustoConcMensal += (f * tConc) / 100;
      totalMensalTaxas += (f * (tConc - tCielo)) / 100;
      totalAnualTaxas += (f * (tConc - tCielo)) / 100 * 12;
    });
  });

  const custoCieloAnual = totalCustoCieloMensal * 12;
  const custoConcAnual = totalCustoConcMensal * 12;

  const campos = ["zip", "flash", "lio", "tef"];
  let qtdCielo = 0, qtdConc = 0, custoCielo = 0, custoConc = 0;

  campos.forEach(c => {
    const qC = parseInt(document.querySelector(`[name='qtd-${c}']`)?.value || 0);
    const qX = parseInt(document.querySelector(`[name='qtdc-${c}']`)?.value || 0);
    const vC = parseFloat(document.querySelector(`[name='cielo-${c}']`)?.value || 0);
    const vX = parseFloat(document.querySelector(`[name='conc-${c}']`)?.value || 0);
    qtdCielo += qC;
    qtdConc += qX;
    custoCielo += qC * vC;
    custoConc += qX * vX;
  });

  const difEquip = custoConc - custoCielo;

  const atualServ = parseFloat((document.getElementById("total-atual")?.textContent || "0").replace(/\./g, "").replace(",", "."));
  const propServ = parseFloat((document.getElementById("total-proposto")?.textContent || "0").replace(/\./g, "").replace(",", "."));
  const mesServ = parseFloat((document.getElementById("total-mes")?.textContent || "0").replace(/\./g, "").replace(",", "."));
  const anoServ = parseFloat((document.getElementById("total-ano")?.textContent || "0").replace(/\./g, "").replace(",", "."));

  const pegarTextoSpan = id => parseFloat((document.getElementById(id)?.textContent || "0").replace(/\./g, "").replace(",", "."));
  const repM = pegarTextoSpan("repasse-mes");
  const repA = pegarTextoSpan("repasse-ano");
  const incM = pegarTextoSpan("incremento-mes");
  const incA = pegarTextoSpan("incremento-ano");

  const limparInputComRS = id => {
    const el = document.getElementById(id);
    if (!el) return 0;
    const texto = el.value.replace(/[^\d,]/g, "").replace(",", ".");
    return parseFloat(texto || 0);
  };

  const gdadMes = limparInputComRS("gdad-mes");
  const gdadAno = limparInputComRS("gdad-ano");

  const cliente_mensal = totalMensalTaxas + difEquip - mesServ;
  const cliente_anual = (totalMensalTaxas * 12) + difEquip - (mesServ * 12);

  const empresa = document.getElementById("nome-empresa")?.value || "Cliente não informado";

  const corCliente = cliente_mensal >= 0 ? "#28a745" : "#dc3545";
  const textoCliente = cliente_mensal <= 0 ? "redução" : "elevação";

  const html = `
  <div class="resumo-linha">
    <div class="resumo-card bg-taxas">
      <h4>📊 Comparativo de Taxas</h4>
      <p>Custo Cielo Mensal: <strong>${formatarMoedaResumo(totalCustoCieloMensal)}</strong></p>
      <p>Custo Concorrente Mensal: <strong>${formatarMoedaResumo(totalCustoConcMensal)}</strong></p>
      <p>Custo Cielo Anual: <strong>${formatarMoedaResumo(custoCieloAnual)}</strong></p>
      <p>Custo Concorrente Anual: <strong>${formatarMoedaResumo(custoConcAnual)}</strong></p>
      <p style="margin-top: 10px;">
        A Cielo tem um custo <strong>${totalMensalTaxas >= 0 ? "menor" : "maior"}</strong> que o concorrente de 
        <strong>${formatarMoedaResumo(Math.abs(totalMensalTaxas))}</strong> por mês.
      </p>
    </div>

    <div class="resumo-card bg-equipamentos">
      <h4>🖥️ Equipamentos</h4>
      <p>Qtd. Cielo: <strong>${qtdCielo}</strong></p>
      <p>Qtd. Conc.: <strong>${qtdConc}</strong></p>
      <p>Custo Mensal Cielo: <strong>${formatarMoedaResumo(custoCielo)}</strong></p>
      <p>Custo Mensal Concorrente: <strong>${formatarMoedaResumo(custoConc)}</strong></p>
      <p>Custo Anual Cielo: <strong>${formatarMoedaResumo(custoCielo * 12)}</strong></p>
      <p>Custo Anual Concorrente: <strong>${formatarMoedaResumo(custoConc * 12)}</strong></p>
      <p style="margin-top: 10px;">
        A Cielo tem um custo <strong>${custoCielo < custoConc ? "menor" : "maior"}</strong> que o concorrente de 
        <strong>${formatarMoedaResumo(Math.abs(custoCielo - custoConc))}</strong> por mês.
      </p>
    </div>
  </div>

  <div class="resumo-linha">
    <div class="resumo-card bg-servicos">
      <h4>🧾 Produtos e Serviços</h4>
      <p>Custo Atual: <strong>${formatarMoedaResumo(atualServ)}</strong></p>
      <p>Custo Proposto: <strong>${formatarMoedaResumo(propServ)}</strong></p>
      <p>Total Mensal: <strong>${formatarMoedaResumo(mesServ)}</strong></p>
      <p>Total Anual: <strong>${formatarMoedaResumo(anoServ)}</strong></p>
      <p style="margin-top: 10px;">
        A proposta apresenta uma <strong>${mesServ > 0 ? "redução" : "elevação"}</strong> de 
        <strong>${formatarMoedaResumo(Math.abs(mesServ))}</strong> por mês nos produtos/serviços contratados.
      </p>
    </div>

    <div class="resumo-card bg-invest">
      <h4>📅 Invest Fácil</h4>
      <p>Saldo Médio Projetado Mensal: <strong>${formatarMoedaResumo(repM)}</strong></p>
      <p>Saldo Médio Projetado Anual: <strong>${formatarMoedaResumo(repA)}</strong></p>
      <p>Resultado Projetado Mensal: <strong>${formatarMoedaResumo(incM)}</strong></p>
      <p>Resultado Projetado Anual: <strong>${formatarMoedaResumo(incA)}</strong></p>
      <p style="margin-top: 10px;">
        O Invest Fácil poderá gerar um <strong>acréscimo</strong> de 
        <strong>${formatarMoedaResumo(incM)}</strong> por mês em resultado projetado.
      </p>
    </div>
  </div>

  <div class="resumo-linha">
    <div class="resumo-card resumo-gdad bg-resumo">
      <h4>📘 Resultado GDAD</h4>
      <p>Resultado GDAD Projetado (Mensal): <strong>${formatarMoedaResumo(gdadMes)}</strong></p>
      <p>Resultado GDAD Projetado (Anual): <strong>${formatarMoedaResumo(gdadAno)}</strong></p>
    </div>
  </div>

  <div id="bloco-resultado-total" class="resumo-cliente destaque-resultado-final" style="margin-top: 30px; text-align: center;">
    <p style="font-size: 1.1rem; margin-bottom: 10px;">
      Para o cliente <strong id="nome-cliente-final">${empresa}</strong>, temos o seguinte cenário:
    </p>

    ${
      document.getElementById("visao-grupo")?.checked ? (() => {
        const getListItems = (selector) =>
          [...document.querySelectorAll(selector)]
            .map(el => `<li>${el.childNodes[0].textContent.trim()}</li>`)
            .join("");

        const cnpjs = getListItems("#lista-cnpjs .composicao-item");
        const agencias = getListItems("#lista-agencias .composicao-item");
        const contas = getListItems("#lista-contas .composicao-item");

        if (!cnpjs && !agencias && !contas) return "";

        return `
          <div class="resumo-grupo-container">
            ${cnpjs ? `
              <div class="resumo-grupo-card">
                <h4>📄 CNPJs do Grupo</h4>
                <ul>${cnpjs}</ul>
              </div>` : ""}
            ${agencias ? `
              <div class="resumo-grupo-card">
                <h4>🏦 Agências</h4>
                <ul>${agencias}</ul>
              </div>` : ""}
            ${contas ? `
              <div class="resumo-grupo-card">
                <h4>💳 Contas</h4>
                <ul>${contas}</ul>
              </div>` : ""}
          </div>
        `;
      })() : ""
    }

    <div class="resumo-linha">
      <div class="resumo-card bg-servicos">
        <h4>👤 Visão do Cliente</h4>
        <p><strong>Custo Final:</strong> Houve uma ${cliente_mensal < 0 ? "redução" : "elevação"} de 
        <strong>${formatarMoedaResumo(Math.abs(cliente_mensal))}</strong> por mês e 
        <strong>${formatarMoedaResumo(Math.abs(cliente_anual))}</strong> por ano.</p>
      </div>

      <div class="resumo-card bg-invest">
        <h4>🏦 Visão do Banco</h4>
        <p><strong>Resultado Projetado:</strong> Estima-se um acréscimo de 
        <strong>${formatarMoedaResumo(incM + gdadMes)}</strong> por mês e 
        <strong>${formatarMoedaResumo(incA + gdadAno)}</strong> por ano com Invest Fácil + GDAD.</p>
      </div>
    </div>

    <div class="resumo-cliente destaque-resultado-final" style="margin-top: 20px; text-align: center;">
      ${(() => {
        const diferencaLiquida = (incM + gdadMes) - cliente_mensal;
        const classificacao = diferencaLiquida > 0 
          ? '<strong style="color: green;">vantajosa para o banco</strong>' 
          : '<strong style="color: red;">menos vantajosa para o banco</strong>';
        return `
          <p style="font-size: 1.1rem;">
            A proposta apresenta uma diferença líquida de 
            <strong>${formatarMoedaResumo(Math.abs(diferencaLiquida))}</strong> por mês, sendo considerada ${classificacao}.
          </p>
        `;
      })()}
    </div>
  </div>
`;




   const resultado = document.getElementById("resumo-final");
  if (resultado) {
    const titulo = resultado.querySelector("h2");
    const tituloClonado = titulo?.cloneNode(true);
    resultado.innerHTML = "";
    if (tituloClonado) resultado.appendChild(tituloClonado);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    while (wrapper.firstChild) resultado.appendChild(wrapper.firstChild);
    resultado.style.display = "block";
  }
}




// ===============================
// GERAR PDF
// ===============================

async function exportarComoImagemPDF() {
  const area = document.querySelector(".container");
  const overlay = document.getElementById("loading-pdf-overlay");

  if (!area) {
    alert("Área para exportação não encontrada.");
    return;
  }

  // Mostrar a mensagem de carregamento
  if (overlay) overlay.style.display = "flex";

  try {
    const { jsPDF } = window.jspdf;
    await new Promise(resolve => setTimeout(resolve, 300)); // tempo de ajuste de layout

    const canvas = await html2canvas(area, { scale: 3, useCORS: true });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const pdfRatio = pageWidth / pageHeight;
    const imgRatio = imgProps.width / imgProps.height;

    let imgWidth = pageWidth;
    let imgHeight = pageWidth / imgRatio;

    if (imgHeight > pageHeight) {
      imgHeight = pageHeight;
      imgWidth = pageHeight * imgRatio;
    }

    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;

    pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
    pdf.save("relatorio-simulacao.pdf");
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    alert("Ocorreu um erro ao gerar o PDF.");
  } finally {
    // Ocultar a mensagem
    if (overlay) overlay.style.display = "none";
  }
}





// ===============================
// LIMPAR TUDO GLOBAL
// ===============================

function limparTudo() {
  Swal.fire({
    title: 'Tem certeza?',
    text: "Todos os dados preenchidos serão perdidos!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sim, limpar tudo',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      location.reload();
    }
  });
}



document.querySelectorAll('input[name="tipo-visao"]').forEach(radio => {
  radio.addEventListener('change', atualizarCamposVisao);
});

function atualizarCamposVisao() {
  const visaoGrupo = document.getElementById("visao-grupo").checked;

  const labelNomeEmpresa = document.querySelector('label[for="nome-empresa"]') || document.querySelector('label:has(#nome-empresa)');
  const campoAgencia = document.getElementById("agencia")?.closest("label");
  const campoConta = document.getElementById("conta")?.closest("label");
  const campoCnpj = document.getElementById("cnpj-empresa")?.closest("label");

  const campoNumeroGrupo = document.getElementById("campo-numero-grupo");
  const campoComposicao = document.getElementById("campo-composicao");

  if (visaoGrupo) {
    if (labelNomeEmpresa) labelNomeEmpresa.childNodes[0].nodeValue = "Nome do Grupo:";
    if (campoAgencia) campoAgencia.style.display = "none";
    if (campoConta) campoConta.style.display = "none";
    if (campoCnpj) campoCnpj.style.display = "none";
    campoNumeroGrupo.style.display = "block";
    campoComposicao.style.display = "block";
  } else {
    if (labelNomeEmpresa) labelNomeEmpresa.childNodes[0].nodeValue = "Nome da Empresa:";
    if (campoAgencia) campoAgencia.style.display = "block";
    if (campoConta) campoConta.style.display = "block";
    if (campoCnpj) campoCnpj.style.display = "block";
    campoNumeroGrupo.style.display = "none";
    campoComposicao.style.display = "none";
  }
}

["lista-cnpjs", "lista-agencias", "lista-contas"].forEach(id => {
  const campo = document.getElementById(id);
  if (campo) {
    campo.addEventListener("keypress", function(e) {
      // Permite só números e Enter
      if (!/[0-9]/.test(e.key) && e.key !== "Enter" && e.key !== "Backspace") {
        e.preventDefault();
      }
    });
  }
});

function adicionarItem(tipo) {
  let inputId = "";
  let listaId = "";

  if (tipo === "cnpj") {
    inputId = "input-cnpj";
    listaId = "lista-cnpjs";
  } else if (tipo === "agencia") {
    inputId = "input-agencia";
    listaId = "lista-agencias";
  } else if (tipo === "conta") {
    inputId = "input-conta";
    listaId = "lista-contas";
  }

  const input = document.getElementById(inputId);
  const lista = document.getElementById(listaId);
  const valor = input.value.trim();

  if (valor && /^\d+$/.test(valor)) {  // Só permite números
    const item = document.createElement("span");
    item.className = "composicao-item";
    item.textContent = valor;

    const botaoRemover = document.createElement("button");
    botaoRemover.textContent = "×";
    botaoRemover.onclick = () => item.remove();

    item.appendChild(botaoRemover);
    lista.appendChild(item);
    input.value = "";
  } else {
    Swal.fire({
      icon: "warning",
      title: "Somente números!",
      text: "Por favor, digite apenas números antes de adicionar.",
    });
  }
}

function criarChip(valor, listaId) {
  const lista = document.getElementById(listaId);
  const chip = document.createElement("span");
  chip.className = "composicao-item";
  chip.textContent = valor;

  const botao = document.createElement("button");
  botao.textContent = "×";
  botao.onclick = () => chip.remove();

  chip.appendChild(botao);
  lista.appendChild(chip);
}

function configurarCampoComEnter(inputId, listaId) {
  const input = document.getElementById(inputId);
  input.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      adicionarItensDoInput(input, listaId);
    }
  });

  input.addEventListener("blur", function() {
    adicionarItensDoInput(input, listaId);
  });
}

function adicionarItensDoInput(input, listaId) {
  const valores = input.value.split(",").map(v => v.trim()).filter(v => v);
  let algumInvalido = false;

  valores.forEach(valor => {
    if (/^\d+$/.test(valor)) {
      criarChip(valor, listaId);
    } else {
      algumInvalido = true;
    }
  });

  if (algumInvalido) {
    Swal.fire({
      icon: "warning",
      title: "Atenção!",
      text: "Digite apenas números (separados por vírgula).",
    });
  }

  input.value = "";
}


// 👉 Inicie quando carregar a página:
document.addEventListener("DOMContentLoaded", function() {
  configurarCampoComEnter("input-cnpj", "lista-cnpjs");
  configurarCampoComEnter("input-agencia", "lista-agencias");
  configurarCampoComEnter("input-conta", "lista-contas");
});






















