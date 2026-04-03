/**
 * Split streaming assistant text into a prefix safe to pass to Markdown (marked)
 * and a suffix that should stay plain until more tokens arrive, to avoid a
 * full re-layout flicker when the stream completes.
 */

function findUnclosedFenceStart(s: string): number {
  var lines = s.split("\n");
  var inFence = false;
  var fenceStart = -1;
  var offset = 0;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (/^\s*```/.test(line)) {
      if (!inFence) {
        inFence = true;
        fenceStart = offset;
      } else {
        inFence = false;
        fenceStart = -1;
      }
    }
    offset += line.length;
    if (i < lines.length - 1) {
      offset += 1;
    }
  }
  return inFence ? fenceStart : -1;
}

function doubleAsteriskDelimiterCount(s: string): number {
  var re = /\*\*/g;
  var n = 0;
  while (re.exec(s) !== null) {
    n++;
  }
  return n;
}

function hasIncompleteDoubleAsteriskEmphasis(s: string): boolean {
  return doubleAsteriskDelimiterCount(s) % 2 === 1;
}

function splitAtLastDoubleAsteriskOpen(s: string): { markdown: string; plain: string } {
  var last = s.lastIndexOf("**");
  if (last < 0) {
    return { markdown: s, plain: "" };
  }
  return { markdown: s.slice(0, last), plain: s.slice(last) };
}

export function splitStreamingMarkdown(content: string): { markdown: string; plain: string } {
  if (content === "") {
    return { markdown: "", plain: "" };
  }

  var fenceAt = findUnclosedFenceStart(content);
  if (fenceAt >= 0) {
    return { markdown: content.slice(0, fenceAt), plain: content.slice(fenceAt) };
  }

  var paras = content.split(/\n\n+/);
  if (paras.length > 1) {
    var lastPara = paras[paras.length - 1] ?? "";
    var head = paras.slice(0, -1).join("\n\n");
    if (hasIncompleteDoubleAsteriskEmphasis(lastPara)) {
      return { markdown: head, plain: (head ? "\n\n" : "") + lastPara };
    }
    return { markdown: content, plain: "" };
  }

  var single = paras[0] ?? "";
  if (hasIncompleteDoubleAsteriskEmphasis(single)) {
    return splitAtLastDoubleAsteriskOpen(single);
  }

  return { markdown: content, plain: "" };
}
