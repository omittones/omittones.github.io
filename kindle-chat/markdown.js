function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineMarkdown(text) {
  // Split on `code spans`, keeping delimiters at odd indices
  var parts = text.split(/(`[^`\n]+`)/);
  var out = '';
  for (var i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      out += '<code>' + escapeHtml(parts[i].slice(1, -1)) + '</code>';
    } else {
      var s = escapeHtml(parts[i]);
      s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
      s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
      out += s;
    }
  }
  return out;
}

function processBlock(text) {
  var lines = text.split('\n');
  var html = '';
  var listType = null;
  var listItems = [];
  var paraLines = [];

  function flushList() {
    if (!listItems.length) return;
    html += '<' + listType + '>';
    for (var j = 0; j < listItems.length; j++) html += '<li>' + listItems[j] + '</li>';
    html += '</' + listType + '>';
    listItems = []; listType = null;
  }
  function flushPara() {
    if (!paraLines.length) return;
    html += '<p>' + paraLines.join('<br>') + '</p>';
    paraLines = [];
  }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.trim() === '') { flushList(); flushPara(); continue; }

    var hm = line.match(/^(#{1,6})\s+(.+)$/);
    if (hm) {
      flushList(); flushPara();
      var lvl = hm[1].length;
      html += '<h' + lvl + '>' + inlineMarkdown(hm[2]) + '</h' + lvl + '>';
      continue;
    }

    var ulm = line.match(/^[-*+]\s+(.*)$/);
    if (ulm) {
      flushPara();
      if (listType !== 'ul') { flushList(); listType = 'ul'; }
      listItems.push(inlineMarkdown(ulm[1]));
      continue;
    }

    var olm = line.match(/^\d+[.)]\s+(.*)$/);
    if (olm) {
      flushPara();
      if (listType !== 'ol') { flushList(); listType = 'ol'; }
      listItems.push(inlineMarkdown(olm[1]));
      continue;
    }

    flushList();
    paraLines.push(inlineMarkdown(line));
  }
  flushList(); flushPara();
  return html;
}

function parseMarkdown(text) {
  var segments = [];
  var re = /```(\w*)\n?([\s\S]*?)```/g;
  var last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: 'text', val: text.slice(last, m.index) });
    segments.push({ type: 'code', val: m[2].replace(/\n$/, '') });
    last = re.lastIndex;
  }
  if (last < text.length) segments.push({ type: 'text', val: text.slice(last) });

  var html = '';
  for (var i = 0; i < segments.length; i++) {
    var seg = segments[i];
    html += seg.type === 'code'
      ? '<pre><code>' + escapeHtml(seg.val) + '</code></pre>'
      : processBlock(seg.val);
  }
  return html;
}
