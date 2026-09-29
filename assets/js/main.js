/* Dra. Patrícia Peclat — landing Invisalign */

/* ---------- Menu (tablet e celular) ---------- */
(() => {
  const menu = document.querySelector('.menu');
  const botao = menu?.querySelector('.menu__botao');
  if (!menu || !botao) return;
  const icone = botao.querySelector('use');
  const alternar = (abrir) => {
    menu.classList.toggle('is-aberto', abrir);
    botao.setAttribute('aria-expanded', String(abrir));
    botao.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
    icone.setAttribute('href', abrir ? '#i-fechar' : '#i-menu');
  };
  botao.addEventListener('click', () => alternar(!menu.classList.contains('is-aberto')));
  menu.querySelectorAll('.menu__lista a').forEach((a) => a.addEventListener('click', () => alternar(false)));
})();

/* ---------- Casos tratáveis: comparador antes/depois ----------
 * Ajuste de registro do render DEPOIS sobre o ANTES (somente translação), em pixels do
 * render de referência (960 x 720). Medido pelo centro do contorno externo do modelo.
 *   diastema 6/1, mordida cruzada 8/2, apinhamento 9/3: diferença só de posição.
 *   mordida aberta 0/0: diferença de 1 a 2 px, imperceptível.
 *   prognatismo 5/0: parte da diferença é mudança real do formato do modelo.
 *   mordida profunda 10/3: o modelo do DEPOIS é ~1% mais largo e ~2% mais alto; a sobra fica dividida.
 */
const RENDER_REF = { largura: 960, altura: 720 };
const AJUSTES_3D = {
  'diastema':         { x: 6,  y: 1 },
  'mordida-cruzada':  { x: 8,  y: 2 },
  'mordida-aberta':   { x: 0,  y: 0 },
  'prognatismo':      { x: 5,  y: 0 },
  'apinhamento':      { x: 9,  y: 3 },
  'mordida-profunda': { x: 10, y: 3 },
};

function iniciarComparador(el) {
  const controle = el.querySelector('.comparador__controle');
  const ajuste = AJUSTES_3D[el.dataset.caso];
  if (ajuste) {
    el.style.setProperty('--dx', (ajuste.x / RENDER_REF.largura) * 100 + '%');
    el.style.setProperty('--dy', (ajuste.y / RENDER_REF.altura) * 100 + '%');
  }

  let posAtual = 0, animacao = 0;
  const aplicar = (pos) => {
    posAtual = pos;
    el.style.setProperty('--pos', pos + '%');
    controle.setAttribute('aria-valuenow', Math.round(pos));
  };
  const limitar = (pct) => Math.min(100, Math.max(0, pct));
  const posicionar = (pct) => { cancelAnimationFrame(animacao); aplicar(limitar(pct)); };
  const reduzirMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Clique/toque fora do controle: o slider desliza suavemente até o ponto
  const deslizar = (pct) => {
    const destino = limitar(pct), origem = posAtual, inicio = performance.now(), duracao = 320;
    if (reduzirMovimento) return posicionar(destino);
    cancelAnimationFrame(animacao);
    const passo = (agora) => {
      const t = Math.min(1, (agora - inicio) / duracao);
      aplicar(origem + (destino - origem) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) animacao = requestAnimationFrame(passo);
    };
    animacao = requestAnimationFrame(passo);
  };
  const pctDoEvento = (e) => {
    const r = el.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * 100;
  };
  posicionar(parseFloat(getComputedStyle(el).getPropertyValue('--pos')) || 50);

  // Mouse e toque (pointer events); o CSS usa touch-action: pan-y para manter o scroll vertical livre
  let arrastando = false, deslocamento = 0;
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    arrastando = true;
    el.setPointerCapture(e.pointerId);
    if (controle.contains(e.target)) {
      deslocamento = pctDoEvento(e) - posAtual;   // pegou o controle: arrasta sem salto
      el.classList.add('is-arrastando');
    } else {
      deslocamento = 0;
      deslizar(pctDoEvento(e));
    }
  });
  el.addEventListener('pointermove', (e) => {
    if (!arrastando) return;
    el.classList.add('is-arrastando');
    posicionar(pctDoEvento(e) - deslocamento);
  });
  const soltar = () => { arrastando = false; el.classList.remove('is-arrastando'); };
  el.addEventListener('pointerup', soltar);
  el.addEventListener('pointercancel', soltar);   // o navegador assumiu o gesto (scroll vertical)

  // Teclado
  controle.addEventListener('keydown', (e) => {
    const passo = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, Home: -100, End: 100 }[e.key];
    if (passo === undefined) return;
    e.preventDefault();
    posicionar(posAtual + passo);
  });
}

document.querySelectorAll('.comparador[data-caso]').forEach(iniciarComparador);
