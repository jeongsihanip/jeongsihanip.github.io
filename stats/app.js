/* 한입 스탯 — data/stats.json 렌더러 */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const nf = new Intl.NumberFormat('ko-KR');
  const fmt = (n) => (n === null || n === undefined || Number.isNaN(n) ? '—' : nf.format(n));

  const PENDING = '집계 대기';

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }

  async function boot() {
    let data;
    try {
      const res = await fetch('data/stats.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      data = await res.json();
    } catch (err) {
      $('#statusNote').textContent =
        '통계 데이터(data/stats.json)를 불러오지 못했습니다. 로컬 서버로 열었는지 확인해 주세요. (' + err.message + ')';
      return;
    }
    render(data);
  }

  function render(data) {
    const s = data.summary || {};
    const brands = [data.jeongsihanip, data.susihanip].filter(Boolean);

    // header time
    $('#updatedAt').textContent = '업데이트 ' + (data.updatedAtLabel || data.updatedAt || '—');

    // KPI
    const per = s.websitePeriodLabel ? ' · GA4 ' + s.websitePeriodLabel : '';
    renderPendingKpi($('#kpi-visitors'), $('#kpi-visitors-sub'), s.websiteVisitors, '두 사이트 합계' + per);
    renderPendingKpi($('#kpi-pageviews'), $('#kpi-pageviews-sub'), s.pageviews, '두 사이트 합계' + per);
    const ga4Tag = $('#ga4Tag');
    if (ga4Tag) ga4Tag.textContent = s.websitePeriodLabel ? 'GA4 실측 · ' + s.websitePeriodLabel : 'GA4 실측';
    $('#kpi-ytviews').textContent = fmt(s.youtubeViews) + '회';
    $('#kpi-subs').textContent = fmt(s.subscribers) + '명';

    if (s.videoCount !== undefined) {
      $('#kpi-ytviews-sub').textContent = '공개 영상 ' + fmt(s.videoCount) + '편 조회수 합 (좋아요 ' + fmt(s.likes) + '개)';
    }
    $('#kpi-subs-sub').textContent = 'YouTube 공개 구독자 · 두 채널 합';

    // KPI 배지·상태
    const setKpi = (sel, status) => {
      const card = $(sel);
      if (!card) return;
      card.dataset.status = status;
      const badge = $('.badge', card);
      if (badge) {
        badge.textContent = status === 'pending' ? '집계 대기' : '실측';
        badge.className = 'badge ' + (status === 'pending' ? 'badge-pending' : 'badge-live');
      }
    };
    setKpi('#kpi-visitors', s.status && s.status.website === 'pending' ? 'pending' : 'live');
    setKpi('#kpi-pageviews', s.status && s.status.website === 'pending' ? 'pending' : 'live');

    // status note
    const noteParts = [];
    if (s.youtubeNote) noteParts.push('유튜브 — ' + s.youtubeNote);
    if (s.websiteNote) noteParts.push('웹사이트 — ' + s.websiteNote);
    $('#statusNote').textContent = noteParts.join('  ·  ');

    // footer source
    if (data.source) {
      $('#footSource').textContent =
        '유튜브: ' + data.source.youtube + ' · 최종 확인 ' + (data.updatedAtLabel || '') +
        ' / 웹사이트: ' + data.source.website;
    }

    renderYoutube(brands, data);
    renderWeb(brands, data);
    renderSchedule(brands);
  }

  function renderPendingKpi(valueNode, subNode, value, reason) {
    if (value === null || value === undefined) {
      valueNode.textContent = '—';
      valueNode.dataset.pending = 'true';
      subNode.textContent = '측정 시작(집계 대기) · ' + reason;
    } else {
      valueNode.textContent = fmt(value);
      subNode.textContent = reason;
    }
  }

  /* ── 유튜브 ── */
  function renderYoutube(brands, data) {
    const grid = $('#ytGrid');
    grid.innerHTML = '';
    brands.forEach((b) => {
      const y = b.youtube || {};
      const card = el('article', 'yt-card');
      card.dataset.brand = b.theme === 'gold-yellow' ? 'susihanip' : 'jeongsihanip';

      const head = el('div', 'yt-head');
      head.innerHTML =
        '<span class="yt-logo" aria-hidden="true">' + (b.theme === 'gold-yellow' ? '水' : '正') + '</span>' +
        '<span><span class="yt-name">' + esc(b.name) + '</span><span class="yt-handle">' + esc(b.handle) + '</span></span>' +
        '<a class="yt-open" href="' + esc(y.url) + '" target="_blank" rel="noopener">채널 열기 ↗</a>';
      card.appendChild(head);

      const subs = y.subscribers === 0 ? '0' : fmt(y.subscribers);
      const nums = el('div', 'yt-nums');
      nums.innerHTML =
        '<div class="yt-num"><span>구독자</span><b>' + subs + '</b><small>' + (y.subscribersStatus === 'public_hidden' ? '공개 미표시' : '명') + '</small></div>' +
        '<div class="yt-num"><span>총 조회수</span><b>' + fmt(y.totalViews) + '</b><small>영상 합계</small></div>' +
        '<div class="yt-num"><span>좋아요</span><b>' + fmt(y.likes) + '</b><small>영상 ' + fmt(y.videoCount) + '편</small></div>';
      card.appendChild(nums);

      const vids = y.videos || [];
      if (vids.length) {
        const max = Math.max.apply(null, vids.map((v) => v.views || 0)) || 1;
        const list = el('ul', 'vids');
        vids.forEach((v) => {
          const li = el('li');
          const pct = Math.max(4, Math.round(((v.views || 0) / max) * 100));
          li.innerHTML =
            '<a class="vid" href="' + esc(v.url) + '" target="_blank" rel="noopener">' +
            '<div class="vid-top"><span class="vid-title">' + esc(v.shortTitle || v.title) + '</span></div>' +
            '<div class="vid-meta"><span>조회수 <b>' + fmt(v.views) + '</b></span>' +
            '<span>좋아요 <b>' + fmt(v.likes) + '</b></span>' +
            '<span>' + esc(v.publishedLabel || '') + '</span>' +
            '<span>' + Math.floor((v.durationSec || 0) / 60) + ':' + String((v.durationSec || 0) % 60).padStart(2, '0') + '</span></div>' +
            '<div class="vid-bar"><i style="width:' + pct + '%"></i></div>' +
            '</a>';
          list.appendChild(li);
        });
        card.appendChild(list);
      } else {
        card.appendChild(
          el('div', 'vid-empty',
            '<b>아직 업로드된 영상이 없습니다.</b><br>' + esc(y.nextUp || '') +
            ' 첫 영상이 올라오면 조회수·좋아요가 여기에 자동으로 표시됩니다.')
        );
      }

      const note = el('p', 'yt-note');
      const bits = [];
      bits.push('영상 ' + fmt(y.videoCount || 0) + '편 · 조회수 ' + fmt(y.totalViews || 0) + '회');
      if (y.checkedAt) bits.push('확인 ' + y.checkedAt.replace('T', ' ').slice(0, 16));
      note.textContent = bits.join(' · ');
      card.appendChild(note);

      grid.appendChild(card);
    });
  }

  /* ── 웹사이트 ── */
  function renderWeb(brands, data) {
    const grid = $('#webGrid');
    grid.innerHTML = '';
    brands.forEach((b) => {
      const site = b.site || {};
      const key = b.theme === 'gold-yellow' ? 'susihanip' : 'jeongsihanip';
      const sample = (data.sample && data.sample[key]) || {};
      const live = Array.isArray(site.daily) && site.daily.length > 0;
      const daily = live ? site.daily : (sample.daily || []);
      const sources = (live ? site.trafficSources : sample.trafficSources) || [];
      const pages = site.topPages || [];
      const unis = site.topUniversities || [];
      const badge = live
        ? '<span class="badge badge-live">GA4 실측</span>'
        : '<span class="badge badge-sample">샘플</span>';
      const card = el('article', 'web-card');
      card.dataset.brand = key;

      const head = el('div', 'web-head');
      head.innerHTML =
        '<span class="web-dot" aria-hidden="true"></span>' +
        '<b>' + esc(b.name) + ' 사이트</b>' +
        '<a class="web-link" href="' + esc(site.url) + '" target="_blank" rel="noopener">' + esc(site.url.replace('https://', '')) + ' ↗</a>';
      card.appendChild(head);
      card.appendChild(el('p', 'web-sub',
        esc(site.title || '') + ' · 대학 ' + fmt(site.universityCount) + '곳 · ' +
        (site.status === 'pending' ? site.statusLabel : (site.source || site.statusLabel || ''))));

      // 방문자 추이
      const p1 = el('div', 'panel');
      p1.innerHTML =
        '<div class="panel-head"><h3>일별 방문자 · 페이지뷰</h3>' + badge + '</div>' +
        '<div class="chart-holder"></div>' +
        '<div class="legend"><span><i class="lg-vis"></i>방문자</span><span><i class="lg-pv"></i>페이지뷰</span></div>';
      card.appendChild(p1);
      $('.chart-holder', p1).appendChild(lineChart(daily, site, live));
      if (live) {
        card.appendChild(el('p', 'chart-note',
          esc(site.periodLabel || '') + ' · 활성 사용자 ' + fmt(site.visitors) + '명 · 조회수 ' + fmt(site.pageviews) +
          (site.latestDate ? ' · 최근 집계일 ' + esc(site.latestDate) : '') +
          (site.pendingNote ? ' · ' + esc(site.pendingNote) : '')));
      }

      // 유입 경로
      const p2 = el('div', 'panel');
      p2.innerHTML = '<div class="panel-head"><h3>유입 경로</h3>' + badge + '</div><div class="sources"></div>';
      card.appendChild(p2);
      const srcBox = $('.sources', p2);
      sources.forEach((t) => {
        const row = el('div', 'src');
        const pct = t.value === undefined || t.value === null ? null : Math.min(100, t.value);
        row.innerHTML =
          '<span>' + esc(t.name) + '</span>' +
          '<span class="src-bar"><i style="width:' + (pct === null ? 0 : pct) + '%"></i></span>' +
          '<b>' + (pct === null ? '—' : pct + '%') + '</b>' +
          (t.users === undefined ? '' : '<small>' + fmt(t.users) + '명</small>');
        srcBox.appendChild(row);
      });

      // 인기 페이지 / 인기 대학 클릭
      const p3 = el('div', 'panel');
      if (pages.length) {
        p3.innerHTML = '<div class="panel-head"><h3>인기 페이지</h3>' + badge + '</div><div class="ranks"></div>';
        card.appendChild(p3);
        const pageBox = $('.ranks', p3);
        pages.forEach((pg, i) => {
          const row = el('div', 'rank');
          row.innerHTML =
            '<span class="no">' + (i + 1) + '</span>' +
            '<span class="nm">' + esc(pg.path) + '</span>' +
            '<span class="cl"><b>' + fmt(pg.views) + '</b> 조회 · ' + fmt(pg.users) + '명</span>';
          pageBox.appendChild(row);
        });
        if (site.topUniversitiesNote) {
          p3.appendChild(el('p', 'panel-note', '대학 카드 클릭 집계는 ' + esc(site.topUniversitiesNote)));
        }
      } else if (unis.length) {
        p3.innerHTML = '<div class="panel-head"><h3>인기 대학 클릭 TOP 5</h3>' + badge + '</div><div class="ranks"></div>';
        card.appendChild(p3);
        const rankBox = $('.ranks', p3);
        unis.forEach((u, i) => {
          const row = el('div', 'rank');
          row.innerHTML =
            '<span class="no">' + (i + 1) + '</span>' +
            '<span class="nm">' + esc(u.name) + '</span>' +
            '<span class="cl"><b>' + fmt(u.clicks) + '</b> 클릭</span>';
          rankBox.appendChild(row);
        });
      } else {
        p3.innerHTML = '<div class="panel-head"><h3>인기 대학 클릭 TOP 5</h3><span class="badge badge-pending">집계 준비</span></div>' +
          '<p class="panel-note">' + esc(site.topUniversitiesNote || '대학 카드 클릭 이벤트 수집 전입니다.') + '</p>';
        card.appendChild(p3);
      }

      const caption = el('p', 'yt-note');
      caption.textContent = live
        ? 'GA4 실측값입니다. 방문자는 사이트별 순 활성 사용자, 조회수는 페이지뷰(화면 조회) 기준입니다.'
        : '샘플 데이터 · 실제 집계 아님. GA4 연동 후 실수치로 대체됩니다.';
      card.appendChild(caption);

      grid.appendChild(card);
    });
  }

  function lineChart(daily, site, live) {
    const W = 460, H = 158, L = 28, R = 8, T = 12, B = 22;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('class', 'chart');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', live ? '일별 방문자와 페이지뷰 차트' : '일별 방문자와 페이지뷰 샘플 차트');

    if (!daily.length) {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', W / 2); t.setAttribute('y', H / 2);
      t.setAttribute('text-anchor', 'middle'); t.setAttribute('class', 'axis');
      t.textContent = '집계 대기';
      svg.appendChild(t);
      return svg;
    }

    const maxV = Math.max.apply(null, daily.map((d) => Math.max(d.visitors, d.pageviews)));
    const niceMax = niceCeil(maxV);
    const ticks = 4;
    const x = (i) => L + (i * (W - L - R)) / Math.max(1, daily.length - 1);
    const y = (v) => T + (1 - v / niceMax) * (H - T - B);

    // grid
    for (let g = 0; g <= ticks; g++) {
      const val = (niceMax / ticks) * g;
      const yy = y(val);
      const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      ln.setAttribute('x1', L); ln.setAttribute('x2', W - R);
      ln.setAttribute('y1', yy); ln.setAttribute('y2', yy);
      ln.setAttribute('class', 'grid-line');
      svg.appendChild(ln);
      const lb = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      lb.setAttribute('x', L - 6); lb.setAttribute('y', yy + 3);
      lb.setAttribute('text-anchor', 'end'); lb.setAttribute('class', 'axis');
      lb.textContent = Math.round(val);
      svg.appendChild(lb);
    }

    const path = (key) => daily.map((d, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(d[key]).toFixed(1)).join(' ');
    const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    area.setAttribute('d', path('visitors') + ' L' + x(daily.length - 1).toFixed(1) + ' ' + y(0) + ' L' + x(0) + ' ' + y(0) + ' Z');
    area.setAttribute('class', 'area');
    area.style.fill = 'var(--accent)';
    svg.appendChild(area);

    const pv = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pv.setAttribute('d', path('pageviews'));
    pv.setAttribute('class', 'line-pv');
    svg.appendChild(pv);

    const vis = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    vis.setAttribute('d', path('visitors'));
    vis.setAttribute('class', 'line-vis');
    svg.appendChild(vis);

    // x labels
    const step = 4;
    let lastLabeled = -99;
    daily.forEach((d, i) => {
      const isLast = i === daily.length - 1;
      if (i % step !== 0 && !isLast) return;
      if (isLast && i - lastLabeled < 2) return;
      lastLabeled = i;
      const lb = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      lb.setAttribute('x', x(i)); lb.setAttribute('y', H - 6);
      lb.setAttribute('text-anchor', i === 0 ? 'start' : isLast ? 'end' : 'middle');
      lb.setAttribute('class', 'axis');
      lb.textContent = d.date;
      svg.appendChild(lb);
    });

    // last dot
    const last = daily[daily.length - 1];
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', x(daily.length - 1)); dot.setAttribute('cy', y(last.visitors));
    dot.setAttribute('r', 3.4); dot.setAttribute('class', 'dot');
    svg.appendChild(dot);

    return svg;
  }

  function niceCeil(v) {
    if (!v || v <= 4) return 4;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / p;
    const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 4 ? 4 : n <= 5 ? 5 : n <= 8 ? 8 : 10;
    return m * p;
  }

  /* ── 일정 ── */
  function renderSchedule(brands) {
    const grid = $('#scheduleGrid');
    grid.innerHTML = '';
    brands.forEach((b) => {
      const y = b.youtube || {};
      const key = b.theme === 'gold-yellow' ? 'susihanip' : 'jeongsihanip';
      const d = el('div', 'sch');
      d.dataset.brand = key;
      d.innerHTML =
        '<span class="sch-badge">' + esc(b.name) + '</span>' +
        '<div><b>' + esc(y.schedule || '') + '</b><p>' + esc(y.nextUp || '') + '</p></div>';
      grid.appendChild(d);
    });
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  boot();
})();
