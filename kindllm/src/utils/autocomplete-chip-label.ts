/**
 * Chip label: show only the part of the completion after labelBase (frozen at fetch time).
 * Using the current input as base would re-truncate on every keystroke (bad on Kindle).
 */
export function chipLabelAfterBase(
  completion: string,
  labelBaseTrimmed: string
): string {
  var base = labelBaseTrimmed.toLowerCase();
  if (!base) {
    return completion;
  }
  var c = completion;
  if (c.toLowerCase().indexOf(base) === 0) {
    return c.slice(base.length).replace(/^\s+/, "");
  }
  return completion;
}

/**
 * Whether we can skip a new autocomplete request: user only extended the query
 * and every completion still starts with the current input.
 */
export function shouldSkipAutocompleteRefetch(
  currentTrimmed: string,
  fetchedForTrimmed: string,
  completions: string[]
): boolean {
  if (
    completions.length === 0 ||
    !fetchedForTrimmed ||
    currentTrimmed.length < fetchedForTrimmed.length
  ) {
    return false;
  }
  var cur = currentTrimmed.toLowerCase();
  var base = fetchedForTrimmed.toLowerCase();
  if (cur.indexOf(base) !== 0) {
    return false;
  }
  for (var i = 0; i < completions.length; i++) {
    if (completions[i].toLowerCase().indexOf(cur) !== 0) {
      return false;
    }
  }
  return true;
}
