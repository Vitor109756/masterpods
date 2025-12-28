// script.js — lógica básica do carrinho e checkout

function getCart() {
  try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch (e) { return []; }
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Canonical product prices — keep in sync with product cards in `index.backup.html`
const PRODUCTS = {
  'Mango Ice': 65.00,
  'Strawberry': 70.00,
  'Mint': 75.00
};

function normalizeCartPrices() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  let changed = false;
  cart.forEach(item => {
    if (PRODUCTS.hasOwnProperty(item.name) && item.price !== PRODUCTS[item.name]) {
      item.price = PRODUCTS[item.name];
      changed = true;
    }
  });
  if (changed) localStorage.setItem('cart', JSON.stringify(cart));
  return cart;
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  const el = document.getElementById('cart-count');
  if (el) el.innerText = count;
}

function addToCart(name, price) {
  const cart = getCart();
  const existing = cart.find(i => i.name === name && i.price === price);
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  saveCart(cart);
  updateCartCount();
  // breve feedback visual
  alert(name + ' adicionado ao carrinho');
}

function renderCartItems() {
  const cart = normalizeCartPrices();
  const container = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  if (!container) return;
  container.innerHTML = '';
  let total = 0;
  cart.forEach((item, idx) => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';
    li.style.marginBottom = '0.5rem';

    const info = document.createElement('div');
    info.innerText = `${item.name} x${item.qty} — R$ ${(item.price * item.qty).toFixed(2)}`;

    const btns = document.createElement('div');
    const inc = document.createElement('button'); inc.innerText = '+'; inc.onclick = () => { item.qty++; saveCart(cart); renderCartItems(); updateCartCount(); };
    const dec = document.createElement('button'); dec.innerText = '-'; dec.onclick = () => { item.qty = Math.max(0, (item.qty||1)-1); if (item.qty === 0) cart.splice(idx,1); saveCart(cart); renderCartItems(); updateCartCount(); };
    btns.appendChild(inc); btns.appendChild(dec);

    li.appendChild(info); li.appendChild(btns);
    container.appendChild(li);
    total += item.price * item.qty;
  });
  if (totalEl) totalEl.innerText = total.toFixed(2);
}

function openCart() {
  const modal = document.getElementById('cart-modal');
  if (!modal) return;
  renderCartItems();
  modal.style.display = 'flex';
}

function closeCart() {
  const modal = document.getElementById('cart-modal');
  if (!modal) return;
  modal.style.display = 'none';
}

function finalizarCompra() {
  // redireciona para checkout.html — os dados do carrinho estão no localStorage
  window.location.href = 'checkout.html';
}

// Checkout page helpers
function renderCheckout() {
  const cart = normalizeCartPrices();
  const list = document.getElementById('checkout-items');
  const totalEl = document.getElementById('checkout-total');
  if (!list) return;
  list.innerHTML = '';
  let total = 0;
  cart.forEach(item => {
    const li = document.createElement('li');
    li.innerText = `${item.name} x${item.qty} — R$ ${(item.price * item.qty).toFixed(2)}`;
    list.appendChild(li);
    total += item.price * item.qty;
  });
  if (totalEl) totalEl.innerText = total.toFixed(2);
}

function getShippingInfo() {
  try {
    const s = JSON.parse(localStorage.getItem('shippingInfo') || 'null');
    if (s) return s;
  } catch (e) {}
  // fallback: read form values if present on page
  const name = document.getElementById('buyer-name');
  if (!name) return null;
  const info = {
    name: (document.getElementById('buyer-name')?.value || '').trim(),
    phone: (document.getElementById('buyer-phone')?.value || '').trim(),
    street: (document.getElementById('buyer-street')?.value || '').trim(),
    number: (document.getElementById('buyer-number')?.value || '').trim(),
    neighborhood: (document.getElementById('buyer-neighborhood')?.value || '').trim(),
    city: (document.getElementById('buyer-city')?.value || '').trim(),
    state: (document.getElementById('buyer-state')?.value || '').trim(),
    zip: (document.getElementById('buyer-zip')?.value || '').trim(),
    note: (document.getElementById('buyer-note')?.value || '').trim()
  };
  // require minimal fields
  if (!info.name || !info.phone || !info.street || !info.number || !info.neighborhood || !info.city || !info.state) return null;
  return info;
}

function saveShippingInfo(info) {
  localStorage.setItem('shippingInfo', JSON.stringify(info));
}

function loadShippingForm() {
  try {
    const s = JSON.parse(localStorage.getItem('shippingInfo') || 'null');
    if (!s) return;
    if (document.getElementById('buyer-name')) {
      document.getElementById('buyer-name').value = s.name || '';
      document.getElementById('buyer-phone').value = s.phone || '';
      document.getElementById('buyer-street').value = s.street || '';
      document.getElementById('buyer-number').value = s.number || '';
      document.getElementById('buyer-neighborhood').value = s.neighborhood || '';
      document.getElementById('buyer-city').value = s.city || '';
      document.getElementById('buyer-state').value = s.state || '';
      document.getElementById('buyer-zip').value = s.zip || '';
      document.getElementById('buyer-note').value = s.note || '';
    }
  } catch (e) { /* ignore */ }
}

// Salva cada pedido no histórico (localStorage 'orders')
function saveOrderToHistory(order) {
  try {
    const arr = JSON.parse(localStorage.getItem('orders') || '[]');
    arr.unshift(order); // adiciona no início
    localStorage.setItem('orders', JSON.stringify(arr));
    updateOrdersBadge();
  } catch (e) { console.error('Erro ao salvar pedido', e); }
}

function updateOrdersBadge() {
  const badge = document.getElementById('orders-badge');
  if (!badge) return;
  const list = JSON.parse(localStorage.getItem('orders') || '[]');
  if (list && list.length > 0) { badge.style.display = 'inline-block'; badge.innerText = list.length; } else { badge.style.display = 'none'; }
}

function getExportCount() {
  return parseInt(localStorage.getItem('exportCount') || '0', 10);
}

function incrementExportCount() {
  const c = getExportCount() + 1;
  localStorage.setItem('exportCount', String(c));
}

function updateExportBadge() {
  const b = document.getElementById('export-badge');
  if (!b) return;
  const c = getExportCount();
  if (c > 0) { b.style.display = 'inline-block'; b.innerText = c; } else { b.style.display = 'none'; }
}

function exportOrders() {
  const orders = JSON.parse(localStorage.getItem('orders') || '[]');
  if (!orders || orders.length === 0) { alert('Nenhum pedido para exportar'); return; }
  const blob = new Blob([JSON.stringify(orders, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'orders.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  // increment export counter and update badge
  incrementExportCount();
  updateExportBadge();
  alert('Exportação iniciada. O arquivo orders.json foi salvo no seu computador.');
} 

function renderOrders() {
  const list = JSON.parse(localStorage.getItem('orders') || '[]');
  const ul = document.getElementById('orders-list');
  const no = document.getElementById('no-orders');
  if (!ul) return;
  ul.innerHTML = '';
  if (!list || list.length === 0) { if (no) no.style.display = 'block'; updateOrdersBadge(); return; } else if (no) no.style.display = 'none';
  list.forEach(order => {
    const li = document.createElement('li');
    li.style.border = '1px solid #eee'; li.style.padding = '0.75rem'; li.style.borderRadius = '6px'; li.style.marginBottom = '0.75rem';
    const h = document.createElement('div'); h.innerHTML = `<strong>${order.id}</strong> — ${new Date(order.createdAt).toLocaleString()} — R$ ${order.total.toFixed(2)}`;
    const status = document.createElement('div'); status.style.marginTop = '0.25rem'; status.style.color = 'var(--muted)'; status.innerText = `${order.paymentStatus ? order.paymentStatus : 'Pendente'}${order.paymentMethod ? ' — ' + order.paymentMethod : ''}`;
    const show = document.createElement('button'); show.innerText = 'Ver detalhes'; show.style.marginTop = '0.5rem'; show.style.background = 'transparent'; show.style.border = '1px solid #ddd'; show.style.padding = '0.35rem 0.5rem'; show.style.borderRadius = '6px';
    const details = document.createElement('div'); details.style.display = 'none'; details.style.marginTop = '0.5rem';
    show.onclick = () => {
      if (details.style.display === 'none') {
        details.style.display = 'block';
        details.innerHTML = '';
        const items = document.createElement('ul'); items.style.margin = '0 0 0.5rem 1rem';
        order.items.forEach(it=> {const lii=document.createElement('li'); lii.innerText=`${it.name} x${it.qty} — R$ ${(it.price*it.qty).toFixed(2)}`; items.appendChild(lii);});
        details.appendChild(items);
        if (order.estimatedDelivery) { const d = new Date(order.estimatedDelivery); const p=document.createElement('p'); p.innerHTML = '<strong>Entrega prevista:</strong> '+d.toLocaleDateString(); details.appendChild(p); }
        if (order.shipping) { const s=document.createElement('div'); s.innerHTML = `<p>${order.shipping.name} — ${order.shipping.street}, ${order.shipping.number} — ${order.shipping.city}/${order.shipping.state}</p>`; details.appendChild(s);}      
      } else { details.style.display = 'none'; }
    };
    li.appendChild(h); li.appendChild(status); li.appendChild(show); li.appendChild(details);
    ul.appendChild(li);
  });
  const clearBtn = document.getElementById('clear-orders');
  if (clearBtn) clearBtn.addEventListener('click', ()=>{ if(confirm('Limpar histórico de pedidos?')){ localStorage.removeItem('orders'); renderOrders(); updateOrdersBadge(); } });
  const exportBtn = document.getElementById('export-orders');
  if (exportBtn) exportBtn.addEventListener('click', exportOrders);
}

function validateShippingForm() {
  const info = {
    name: (document.getElementById('buyer-name')?.value || '').trim(),
    phone: (document.getElementById('buyer-phone')?.value || '').trim(),
    street: (document.getElementById('buyer-street')?.value || '').trim(),
    number: (document.getElementById('buyer-number')?.value || '').trim(),
    neighborhood: (document.getElementById('buyer-neighborhood')?.value || '').trim(),
    city: (document.getElementById('buyer-city')?.value || '').trim(),
    state: (document.getElementById('buyer-state')?.value || '').trim(),
    zip: (document.getElementById('buyer-zip')?.value || '').trim(),
    note: (document.getElementById('buyer-note')?.value || '').trim()
  };
  const missing = [];
  if (!info.name) missing.push('Nome');
  if (!info.phone) missing.push('Telefone');
  if (!info.street) missing.push('Rua');
  if (!info.number) missing.push('Número');
  if (!info.neighborhood) missing.push('Bairro');
  if (!info.city) missing.push('Cidade');
  if (!info.state) missing.push('Estado');
  if (missing.length) { alert('Preencha os campos: ' + missing.join(', ')); return null; }
  return info;
}

function finalizePurchase() {
  const cart = getCart();
  if (!cart || cart.length === 0) { alert('Carrinho vazio'); return; }
  const info = validateShippingForm();
  if (!info) return;
  // Salva os dados de entrega e marca como pronto para pagamento
  saveShippingInfo(info);
  localStorage.setItem('readyToPay', '1');
  // não finaliza automaticamente — exige pagamento no site
  const el = document.getElementById('ready-msg');
  if (el) el.innerHTML = 'Dados salvos. Agora escolha <strong>Pagar (Cartão)</strong> ou <strong>Pagar com PIX</strong> para concluir o pagamento.\n(PIX expira em 30 minutos)';
  alert('Dados salvos. Agora escolha um método de pagamento para concluir a compra.');
}

function payOrder() {
  const cart = getCart();
  if (!cart || cart.length === 0) { alert('Carrinho vazio'); return; }
  if (localStorage.getItem('readyToPay') !== '1') { alert('Clique em "Finalizar compra" primeiro para salvar os dados de entrega antes de pagar.'); return; }
  const shipping = getShippingInfo();
  if (!shipping) { alert('Dados de entrega ausentes. Preencha o formulário e clique em "Finalizar compra".'); return; }
  const now = Date.now();
  const estimatedDelivery = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(); // +7 dias
  const order = {
    id: 'ORD' + Date.now(),
    createdAt: new Date().toISOString(),
    items: cart,
    total: cart.reduce((s,i)=>s+i.price*i.qty, 0),
    shipping,
    paymentMethod: 'Cartão',
    paymentStatus: 'Pago',
    estimatedDelivery
  };
  // salva no histórico
  saveOrderToHistory(order);
  localStorage.setItem('lastOrder', JSON.stringify(order));
  // remove a flag de pronto para pagamento
  localStorage.removeItem('readyToPay');
  // limpa carrinho
  localStorage.removeItem('cart');
  updateCartCount();
  // redireciona para confirmação
  window.location.href = 'order-confirmation.html';
}

// --- PIX flow (simulado) ---
function initiatePix() {
  const cart = getCart();
  if (!cart || cart.length === 0) { alert('Carrinho vazio'); return; }
  if (localStorage.getItem('readyToPay') !== '1') { alert('Clique em "Finalizar compra" primeiro para salvar os dados de entrega antes de gerar o PIX.'); return; }
  const shipping = getShippingInfo();
  if (!shipping) { alert('Dados de entrega ausentes. Preencha o formulário e clique em "Finalizar compra".'); return; }
  const id = 'PIX' + Date.now();
  const total = cart.reduce((s,i)=>s + i.price * i.qty, 0);
  const pixPayment = {
    id,
    createdAt: new Date().toISOString(),
    items: cart,
    total,
    shipping,
    pixKey: 'aada7db0-40b2-47bc-875c-3b0d2b2c9489',
    txid: id,
    expiresAt: Date.now() + 30 * 60 * 1000 // 30 min
  };
  const list = JSON.parse(localStorage.getItem('pixPayments') || '[]');
  list.push(pixPayment);
  localStorage.setItem('pixPayments', JSON.stringify(list));
  // redireciona para a página de pagamento PIX
  window.location.href = 'pix-payment.html?pid=' + encodeURIComponent(id);
} 

function renderPixPaymentPage() {
  const qs = new URLSearchParams(window.location.search);
  const pid = qs.get('pid');
  const list = JSON.parse(localStorage.getItem('pixPayments') || '[]');
  const payment = list.find(p => p.id === pid);
  const container = document.getElementById('pix-details');
  if (!payment || !container) { container.innerText = 'Pagamento não encontrado.'; return; }
  container.innerHTML = '';
  const h = document.createElement('h2'); h.innerText = 'Pagamento via PIX'; container.appendChild(h);
  const p = document.createElement('p'); p.innerHTML = `<strong>Valor:</strong> R$ ${payment.total.toFixed(2)}`; container.appendChild(p);
  const k = document.createElement('p'); k.innerHTML = `<strong>Chave PIX:</strong> <code>${payment.pixKey}</code>`; container.appendChild(k);

  // Mostrar endereço de entrega (se existir)
  if (payment.shipping) {
    const sh = document.createElement('div');
    sh.style.margin = '0.5rem 0';
    sh.innerHTML = `<strong>Entrega:</strong> ${payment.shipping.name} — ${payment.shipping.street}, ${payment.shipping.number} — ${payment.shipping.neighborhood}, ${payment.shipping.city}/${payment.shipping.state}`;
    container.appendChild(sh);
  }

  // Exibe a chave PIX em destaque (sem QR) e oferece botão para copiar
  const keyWrap = document.createElement('div');
  keyWrap.style.display = 'flex'; keyWrap.style.alignItems = 'center'; keyWrap.style.gap = '0.5rem'; keyWrap.style.margin = '0.5rem 0';

  const keyBox = document.createElement('div');
  keyBox.style.padding = '0.75rem 1rem';
  keyBox.style.border = '1px dashed #ccc';
  keyBox.style.borderRadius = '8px';
  keyBox.style.background = '#fafafa';
  keyBox.style.fontFamily = 'monospace';
  keyBox.style.fontSize = '1.25rem';
  keyBox.style.fontWeight = '700';
  keyBox.style.letterSpacing = '0.5px';
  keyBox.style.flex = '1';
  keyBox.style.textAlign = 'center';
  keyBox.innerText = payment.pixKey;

  const copyBtn = document.createElement('button');
  copyBtn.innerText = 'Copiar chave';
  copyBtn.style.background = 'var(--primary)'; copyBtn.style.color = 'white'; copyBtn.style.border = 'none'; copyBtn.style.padding = '0.5rem 0.75rem'; copyBtn.style.borderRadius = '6px';
  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(payment.pixKey);
      copyBtn.innerText = 'Copiado!';
      setTimeout(() => copyBtn.innerText = 'Copiar chave', 2000);
    } catch (e) {
      alert('Não foi possível copiar a chave automaticamente. Por favor, copie manualmente: ' + payment.pixKey);
    }
  };

  keyWrap.appendChild(keyBox);
  keyWrap.appendChild(copyBtn);
  container.appendChild(keyWrap);

  const note = document.createElement('p'); note.style.color = 'var(--muted)'; note.innerText = 'Copie a chave PIX acima e cole no app do seu banco para realizar o pagamento. Depois clique em "Já paguei" para confirmar.'; container.appendChild(note);

  // tempo restante e controles
  const timer = document.createElement('div'); timer.style.marginTop = '0.25rem'; timer.style.color = 'var(--muted)'; container.appendChild(timer);

  const btns = document.createElement('div'); btns.style.display = 'flex'; btns.style.gap = '0.5rem';
  const paid = document.createElement('button'); paid.innerText = 'Já paguei'; paid.style.background = 'var(--primary)'; paid.style.color = 'white'; paid.style.border = 'none'; paid.style.padding = '0.5rem 0.75rem'; paid.style.borderRadius = '6px';
  const cancel = document.createElement('a'); cancel.innerText = 'Cancelar'; cancel.href = 'checkout.html'; cancel.style.display = 'inline-block'; cancel.style.padding = '0.5rem 0.75rem'; cancel.style.borderRadius = '6px'; cancel.style.background = '#eee'; cancel.style.textDecoration = 'none'; cancel.style.color = 'inherit';
  btns.appendChild(paid); btns.appendChild(cancel);
  container.appendChild(btns);

  // area para mostrar aviso de expiração
  const expiredNotice = document.createElement('div');
  expiredNotice.style.color = 'red';
  expiredNotice.style.marginTop = '0.5rem';
  expiredNotice.style.display = 'none';
  container.appendChild(expiredNotice);

  function updateTimer() {
    const now = Date.now();
    const remaining = payment.expiresAt - now;
    if (remaining <= 0) {
      timer.innerText = 'O pagamento expirou.';
      paid.disabled = true; paid.setAttribute('aria-disabled','true'); paid.style.opacity = 0.6;
      // desabilita cópia da chave
      if (copyBtn) { copyBtn.disabled = true; copyBtn.setAttribute('aria-disabled','true'); copyBtn.style.opacity = 0.6; }
      // mostra aviso com link para gerar novo pagamento
      expiredNotice.innerHTML = 'O pagamento expirou. <a href="checkout.html">Gerar novo pagamento</a>';
      expiredNotice.style.display = 'block';
      return;
    }
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    timer.innerText = `Expira em ${mins}m ${secs}s`;
    // se estava mostrando aviso, oculta e reabilita botões
    if (expiredNotice.style.display === 'block') {
      expiredNotice.style.display = 'none';
      if (copyBtn) { copyBtn.disabled = false; copyBtn.removeAttribute('aria-disabled'); copyBtn.style.opacity = 1; }
      paid.disabled = false; paid.removeAttribute('aria-disabled'); paid.style.opacity = 1;
    }
  }
  updateTimer();
  const intervalId = setInterval(() => {
    updateTimer();
  }, 1000);

  paid.onclick = () => {
    const now = Date.now();
    if (now > payment.expiresAt) { alert('O pagamento expirou — gere um novo pagamento no checkout.'); return; }
    confirmPixPayment(pid);
  };

  // limpar intervalo quando sair da página (segurança simples)
  window.addEventListener('beforeunload', () => clearInterval(intervalId));
}

function confirmPixPayment(pid) {
  const list = JSON.parse(localStorage.getItem('pixPayments') || '[]');
  const idx = list.findIndex(p => p.id === pid);
  if (idx === -1) { alert('Pagamento não encontrado'); return; }
  const payment = list[idx];
  if (Date.now() > payment.expiresAt) { alert('O pagamento expirou. Gere um novo PIX no checkout.'); return; }
  const estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // +7 dias
  const order = {
    id: 'ORD' + Date.now(),
    createdAt: new Date().toISOString(),
    items: payment.items,
    total: payment.total,
    paymentMethod: 'PIX',
    pixTxId: payment.txid,
    paymentStatus: 'Pago',
    shipping: payment.shipping || getShippingInfo() || null,
    estimatedDelivery
  };
  // salva no histórico
  saveOrderToHistory(order);
  localStorage.setItem('lastOrder', JSON.stringify(order));
  // remove pix payment
  list.splice(idx, 1);
  localStorage.setItem('pixPayments', JSON.stringify(list));
  // remove flag readyToPay
  localStorage.removeItem('readyToPay');
  // limpa carrinho
  localStorage.removeItem('cart');
  updateCartCount();
  // redireciona para confirmação
  window.location.href = 'order-confirmation.html';
}

function renderConfirmation() {
  const el = document.getElementById('order-summary');
  if (!el) return;
  const order = JSON.parse(localStorage.getItem('lastOrder') || 'null');
  if (!order) { el.innerText = 'Nenhum pedido encontrado.'; return; }
  // Mostra apenas a data prevista conforme solicitado
  const d = order.estimatedDelivery ? new Date(order.estimatedDelivery) : null;
  el.innerHTML = '';
  const h = document.createElement('h2'); h.innerText = 'Pedido recebido — ' + order.id; el.appendChild(h);
  if (d) {
    const dp = document.createElement('p');
    dp.innerHTML = `<strong>Entrega prevista:</strong> ${d.toLocaleDateString()} (${d.toLocaleString([], {hour:'2-digit', minute:'2-digit'} )})`;
    el.appendChild(dp);
  } else {
    const p = document.createElement('p'); p.innerText = 'Data de entrega será informada após confirmação do pagamento.'; el.appendChild(p);
  }
}

// Eventos on load
document.addEventListener('DOMContentLoaded', () => {
  normalizeCartPrices();
  updateCartCount();

  const cartBtn = document.getElementById('cart-btn');
  if (cartBtn) cartBtn.addEventListener('click', openCart);

  // Detectar página de checkout
  if (document.getElementById('checkout-items')) {
    renderCheckout();
    // preenche formulário se houver dados salvos
    loadShippingForm();
    const finalizeBtn = document.getElementById('finalize-btn');
    if (finalizeBtn) finalizeBtn.addEventListener('click', finalizePurchase);
    const payBtn = document.getElementById('pay-btn');
    if (payBtn) payBtn.addEventListener('click', payOrder);
    // botão para gerar PIX (substitui exibição da chave)
    const genPixBtn = document.getElementById('generate-pix-btn');
    if (genPixBtn) genPixBtn.addEventListener('click', initiatePix);
  }

  // Detectar página de pagamento PIX
  if (document.getElementById('pix-payment')) {
    renderPixPaymentPage();
  }

  // Detectar página de confirmação
  if (document.getElementById('order-summary')) {
    renderConfirmation();
  }

  // Detectar página de pedidos
  if (document.getElementById('orders-list')) {
    renderOrders();
    updateOrdersBadge();
    updateExportBadge();
  }
});
