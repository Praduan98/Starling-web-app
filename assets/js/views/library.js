/* Library — brand assets, caption templates and hashtag sets */
(function (SL) {
  'use strict';
  SL.views = SL.views || {};
  const st = { tab: 'assets', type: '', q: '' };

  function assetCard(a) {
    return '<article class="card card-hover asset" data-asset="' + a.id + '">' +
      '<div class="asset-media"><img src="' + a.src + '" alt="' + SL.esc(a.name) + '" loading="lazy">' +
        (a.type === 'Video' ? '<span class="asset-type">' + SL.icon('play', 10) + (a.duration || 'Video') + '</span>' : '') +
        '<div class="asset-actions"><button class="btn btn-secondary btn-sm" type="button" data-use>' + SL.icon('square-pen', 14) + 'Use in post</button>' +
        '<button class="icon-btn icon-btn-sm" style="background:var(--surface);box-shadow:var(--shadow-md)" type="button" data-amenu aria-label="More actions for ' + SL.esc(a.name) + '">' + SL.icon('ellipsis', 16) + '</button></div>' +
      '</div>' +
      '<div class="asset-body"><div class="asset-name-row"><span class="asset-name truncate" title="' + SL.esc(a.name) + '">' + SL.esc(a.name) + '</span><span class="asset-uses">' + (a.uses ? 'Used ' + a.uses + '×' : 'New') + '</span></div>' +
        '<div class="asset-tags">' + a.tags.slice(0, 2).map(function (t) { return '<span class="badge">' + SL.esc(t) + '</span>'; }).join('') + '</div></div>' +
    '</article>';
  }

  SL.views.library = {
    title: 'Library',
    sub: 'Approved brand assets, templates and hashtag sets for the whole team',
    render: function (el) {
      function body() {
        if (st.tab === 'templates') {
          return '<div class="grid grid-3">' + SL.data.templates.map(function (t) {
            return '<article class="card card-hover tpl"><div class="row"><span class="kpi-ic">' + SL.icon('file-text', 16) + '</span><h3 class="h5">' + SL.esc(t.name) + '</h3></div>' +
              '<p>' + SL.esc(t.text).replace(/\[([^\]]+)\]/g, '<mark>$1</mark>') + '</p>' +
              '<div class="row"><span class="text-xs text-muted">Used ' + t.uses + '×</span><button class="btn btn-soft btn-sm ml-auto" type="button" data-tpl="' + t.id + '">Use template</button></div></article>';
          }).join('') + '</div>';
        }
        if (st.tab === 'hashtags') {
          return '<div class="grid grid-1-1">' + SL.data.hashtagSets.map(function (h) {
            return '<article class="card card-pad stack-3"><div class="row"><span class="kpi-ic">' + SL.icon('hash', 16) + '</span><h3 class="h5">' + SL.esc(h.name) + '</h3><span class="badge ml-auto">' + h.tags.length + ' tags</span></div>' +
              '<div class="tagset">' + h.tags.map(function (t) { return '<span class="badge badge-brand">' + SL.esc(t) + '</span>'; }).join('') + '</div>' +
              '<div class="row"><button class="btn btn-secondary btn-sm" type="button" data-copy="' + SL.esc(h.tags.join(' ')) + '">' + SL.icon('copy', 14) + 'Copy</button><button class="btn btn-ghost btn-sm" type="button" data-hcompose="' + SL.esc(h.tags.join(' ')) + '">' + SL.icon('square-pen', 14) + 'New post with set</button></div></article>';
          }).join('') + '</div>';
        }
        const list = SL.data.assets.filter(function (a) {
          return (!st.type || a.type === st.type) && (!st.q || (a.name + ' ' + a.tags.join(' ')).toLowerCase().indexOf(st.q.toLowerCase()) > -1);
        });
        return '<div class="toolbar">' +
            '<div class="input-group" style="width:min(320px,100%)">' + SL.icon('search', 16) + '<label class="sr-only" for="libQ">Search assets</label><input class="input" id="libQ" placeholder="Search by name or tag" value="' + SL.esc(st.q) + '"></div>' +
            ['', 'Image', 'Video'].map(function (t) { return '<button type="button" class="chip" data-type="' + t + '" aria-pressed="' + (st.type === t) + '">' + (t ? SL.icon(t === 'Image' ? 'image' : 'video', 14) + t + 's' : 'All media') + '</button>'; }).join('') +
            '<span class="text-sm text-muted ml-auto">' + list.length + ' items</span>' +
          '</div>' +
          '<label class="dropzone" id="dropzone" style="display:block;margin-bottom:20px;cursor:pointer">' +
            '<input type="file" id="libFile" accept="image/*" multiple class="sr-only">' +
            '<span class="row" style="justify-content:center;gap:12px">' + SL.icon('upload', 20) + '<span><b>Drop images here</b> or click to upload</span><span class="text-xs">PNG, JPG, WebP · up to 20 MB</span></span>' +
          '</label>' +
          (list.length ? '<div class="lib-grid">' + list.map(assetCard).join('') + '</div>' :
            '<div class="card empty"><div class="empty-icon">' + SL.icon('images', 22) + '</div><h3>No assets match</h3><p>Try a different search or filter, or upload something new.</p></div>');
      }

      function draw() {
        el.innerHTML =
          '<div class="page-head" style="margin-bottom:8px"><div class="tabs" role="tablist" aria-label="Library sections" style="border-bottom:0">' +
            [['assets', 'images', 'Media', SL.data.assets.length], ['templates', 'file-text', 'Templates', SL.data.templates.length], ['hashtags', 'hash', 'Hashtag sets', SL.data.hashtagSets.length]].map(function (t) {
              return '<button class="tab" role="tab" type="button" data-tab="' + t[0] + '" aria-selected="' + (st.tab === t[0]) + '">' + SL.icon(t[1], 16) + t[2] + '<span class="count count-muted">' + t[3] + '</span></button>';
            }).join('') + '</div>' +
            '<div class="page-actions"><button class="btn btn-primary btn-sm" type="button" data-upload>' + SL.icon('upload', 16) + 'Upload</button></div></div>' +
          '<hr style="margin-bottom:20px">' +
          '<div id="libBody">' + body() + '</div>';
        bind();
      }

      function addFiles(files) {
        const imgs = Array.prototype.filter.call(files, function (f) { return /^image\//.test(f.type); });
        if (!imgs.length) { SL.toast('Only images are supported here', { type: 'error', message: 'Upload PNG, JPG or WebP files.' }); return; }
        imgs.forEach(function (f) {
          SL.data.assets.unshift({ id: 'up' + Date.now() + Math.random().toString(36).slice(2, 5), name: f.name.replace(/\.[^.]+$/, ''), src: URL.createObjectURL(f), type: 'Image', tags: ['Uploaded'], uses: 0, temp: true });
        });
        draw();
        SL.toast(imgs.length + ' file' + (imgs.length > 1 ? 's' : '') + ' uploaded', { message: 'Uploads stay for this session in the prototype.' });
      }

      function bind() {
        const q = SL.$('#libQ', el);
        if (q) q.addEventListener('input', SL.debounce(function () { st.q = q.value; const pos = q.selectionStart; SL.$('#libBody', el).innerHTML = body(); bind(); const n = SL.$('#libQ', el); n.focus(); n.selectionStart = n.selectionEnd = pos; }, 200));
        const dz = SL.$('#dropzone', el), fi = SL.$('#libFile', el);
        if (!dz) return;
        fi.addEventListener('change', function () { addFiles(fi.files); });
        ['dragenter', 'dragover'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('is-over'); }); });
        ['dragleave', 'drop'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('is-over'); }); });
        dz.addEventListener('drop', function (e) { addFiles(e.dataTransfer.files); });
      }

      el.addEventListener('click', function (e) {
        const t = e.target;
        const tab = t.closest('[data-tab]'); if (tab) { st.tab = tab.getAttribute('data-tab'); draw(); return; }
        const ty = t.closest('[data-type]'); if (ty) { st.type = ty.getAttribute('data-type'); SL.$('#libBody', el).innerHTML = body(); bind(); return; }
        if (t.closest('[data-upload]')) { if (st.tab !== 'assets') { st.tab = 'assets'; draw(); } SL.$('#libFile', el).click(); return; }
        const tpl = t.closest('[data-tpl]');
        if (tpl) { const tp = SL.data.templates.find(function (x) { return x.id === tpl.getAttribute('data-tpl'); }); SL.compose({ text: tp.text }); return; }
        const cp = t.closest('[data-copy]');
        if (cp) { const txt = cp.getAttribute('data-copy'); try { navigator.clipboard.writeText(txt); } catch (err) {} SL.toast('Hashtags copied', { type: 'info', duration: 2200 }); return; }
        const hc = t.closest('[data-hcompose]'); if (hc) { SL.compose({ text: '\n\n' + hc.getAttribute('data-hcompose') }); return; }
        const card = t.closest('[data-asset]'); if (!card) return;
        const a = SL.data.assets.find(function (x) { return x.id === card.getAttribute('data-asset'); });
        if (t.closest('[data-use]')) { SL.compose({ media: [a.src], channels: ['ig', 'fb'] }); return; }
        if (t.closest('[data-amenu]')) {
          SL.menu(t.closest('[data-amenu]'), [
            { label: 'Use in post', icon: 'square-pen', onClick: function () { SL.compose({ media: [a.src], channels: ['ig', 'fb'] }); } },
            { label: 'Rename', icon: 'pencil', onClick: function () {
              SL.modal({ title: 'Rename asset', width: 420, body: '<div class="field"><label class="label" for="rnA">Name</label><input class="input" id="rnA" value="' + SL.esc(a.name) + '" autofocus></div>',
                foot: '<button class="btn btn-secondary" data-close type="button">Cancel</button><button class="btn btn-primary" type="button" data-ok>Save</button>',
                onMount: function (m, l) { m.querySelector('[data-ok]').addEventListener('click', function () { const v = m.querySelector('#rnA').value.trim(); if (v) { a.name = v; if (!a.temp) SL.data.save('assets'); } l.close(true); draw(); }); } });
            } },
            { label: 'Download', icon: 'download', onClick: function () { const l = document.createElement('a'); l.href = a.src; l.download = a.name; document.body.appendChild(l); l.click(); l.remove(); } },
            'sep',
            { label: 'Delete', icon: 'trash-2', danger: true, onClick: function () {
              const i = SL.data.assets.indexOf(a); SL.data.assets.splice(i, 1); SL.data.save('assets'); draw();
              SL.toast('Asset deleted', { action: { label: 'Undo', onClick: function () { SL.data.assets.splice(i, 0, a); SL.data.save('assets'); draw(); } } });
            } }
          ], { align: 'right' });
        }
      });

      draw();
    }
  };
})(window.SL);
