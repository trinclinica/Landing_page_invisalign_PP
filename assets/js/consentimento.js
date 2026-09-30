/* Clínica Patrícia Peclat — consentimento de cookies (Google Consent Mode v2)
 *
 * O estado padrão (tudo negado) e a reaplicação da escolha salva são feitos por um script
 * inline no <head>, antes do GTM. Este arquivo cuida do banner, do painel de preferências,
 * da gravação da escolha e das atualizações de consentimento.
 *
 * Armazenamento: localStorage, chave "pp-consentimento" (JSON com analise, marketing, versão e data).
 * Eventos enviados ao dataLayer: gtag('consent', 'update', …) e { event: 'consentimento_atualizado' }.
 */
(() => {
  const CHAVE = 'pp-consentimento';
  const VERSAO = 1;

  // Links das políticas: preencher quando as páginas existirem (ex.: '/privacidade', '/cookies').
  const POLITICAS = { privacidade: '', cookies: '' };

  const banner = document.getElementById('consentimento');
  const painel = document.getElementById('consentimento-preferencias');
  if (!banner || !painel) return;

  window.dataLayer = window.dataLayer || [];
  const gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  const ler = () => {
    try {
      const v = JSON.parse(localStorage.getItem(CHAVE));
      return v && v.versao === VERSAO ? v : null;
    } catch { return null; }
  };
  const gravar = (escolha) => {
    try { localStorage.setItem(CHAVE, JSON.stringify({ ...escolha, versao: VERSAO, data: new Date().toISOString() })); } catch { /* navegação privada: vale só para esta visita */ }
  };
  const estados = ({ analise, marketing }) => ({
    analytics_storage: analise ? 'granted' : 'denied',
    ad_storage: marketing ? 'granted' : 'denied',
    ad_user_data: marketing ? 'granted' : 'denied',
    ad_personalization: marketing ? 'granted' : 'denied',
  });

  const aplicar = (escolha) => {
    gtag('consent', 'update', estados(escolha));
    window.dataLayer.push({ event: 'consentimento_atualizado', consentimento_analise: !!escolha.analise, consentimento_marketing: !!escolha.marketing });
    gravar(escolha);
    fecharBanner();
    fecharPainel();
  };

  /* Banner */
  const abrirBanner = () => { banner.hidden = false; };
  const fecharBanner = () => { banner.hidden = true; };

  /* Painel de preferências */
  const chkAnalise = painel.querySelector('[name="analise"]');
  const chkMarketing = painel.querySelector('[name="marketing"]');
  let focoAnterior = null;
  const abrirPainel = () => {
    const atual = ler() || { analise: false, marketing: false };
    chkAnalise.checked = !!atual.analise;
    chkMarketing.checked = !!atual.marketing;
    focoAnterior = document.activeElement;
    painel.hidden = false;
    document.body.classList.add('consentimento-aberto');
    painel.querySelector('.consentimento-painel__caixa').focus();
  };
  const fecharPainel = () => {
    if (painel.hidden) return;
    painel.hidden = true;
    document.body.classList.remove('consentimento-aberto');
    if (focoAnterior && document.contains(focoAnterior)) focoAnterior.focus();
  };

  document.addEventListener('click', (e) => {
    const alvo = e.target.closest('[data-consentimento]');
    if (!alvo) return;
    const acao = alvo.dataset.consentimento;
    if (acao === 'aceitar') aplicar({ analise: true, marketing: true });
    else if (acao === 'recusar') aplicar({ analise: false, marketing: false });
    else if (acao === 'personalizar' || acao === 'abrir') { e.preventDefault(); abrirPainel(); }
    else if (acao === 'salvar') aplicar({ analise: chkAnalise.checked, marketing: chkMarketing.checked });
    else if (acao === 'fechar') { fecharPainel(); if (!ler()) abrirBanner(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !painel.hidden) { fecharPainel(); if (!ler()) abrirBanner(); }
  });

  // Links das políticas só aparecem quando configurados (evita links quebrados)
  document.querySelectorAll('[data-politica]').forEach((a) => {
    const url = POLITICAS[a.dataset.politica];
    if (url) { a.href = url; a.hidden = false; }
  });
  document.querySelectorAll('.consentimento__politicas').forEach((p) => {
    p.hidden = ![...p.querySelectorAll('[data-politica]')].some((a) => !a.hidden);
  });

  if (!ler()) abrirBanner();
})();
