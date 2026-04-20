// Rule data helpers. Rules store their conditions as `groups` —
// an OR of AND-groups. e.g. [[A, B], [C]]  means (A AND B) OR C.

export function emptyGroups() {
  return [[{ f: '', op: '', val: '' }]];
}

// Backwards compatibility: legacy rules carry `conds` + `logic`.
// This normaliser returns a `groups` array regardless of input shape.
export function getGroups(rule) {
  if (rule?.groups && rule.groups.length > 0) return rule.groups;
  const conds = rule?.conds || [];
  if ((rule?.logic || 'AND') === 'OR') {
    return conds.map(c => [c]);
  }
  return [conds];
}

export function isGroupsComplete(groups, noValueOps = []) {
  if (!groups || groups.length === 0) return false;
  return groups.every(g =>
    g.length > 0 && g.every(c => c.f && c.op && (noValueOps.includes(c.op) || (c.val ?? '') !== ''))
  );
}

// Evaluate groups against a single invoice using a caller-supplied
// per-condition evaluator. Returns true iff any AND-group matches fully.
export function evaluateGroups(inv, groups, evaluateCond) {
  if (!groups || groups.length === 0) return false;
  return groups.some(g => g.length > 0 && g.every(c => evaluateCond(inv, c)));
}
