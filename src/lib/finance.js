export const CATEGORIES = ["Food & Drinks", "Travel", "Shopping", "Groceries", "Accommodation", "Entertainment", "Utilities", "Other"];

export function parseRupees(value) {
  const input = String(value ?? "").trim().replace(/,/g, "");
  const match = input.match(/^(-?)(\d+)(?:\.(\d*))?$/);
  if (!match) return null;
  const sign = match[1] === "-" ? -1 : 1;
  const whole = Number(match[2]);
  if (!Number.isSafeInteger(whole)) return null;
  const decimals = (match[3] ?? "").padEnd(3, "0");
  const paise = Number(decimals.slice(0, 2)) + (Number(decimals[2]) >= 5 ? 1 : 0);
  return sign * (whole * 100 + paise);
}

export function formatRupees(paise = 0, compact = false) {
  const amount = (Number.isFinite(Number(paise)) ? Number(paise) : 0) / 100;
  if (compact && Math.abs(amount) >= 100_000) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 }).format(amount);
  }
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

export function equalSplit(amountPaise, participantIds) {
  if (!participantIds.length) return [];
  const base = Math.floor(amountPaise / participantIds.length);
  const remainder = amountPaise - base * participantIds.length;
  return participantIds.map((personId, index) => ({ personId, amountPaise: base + (index < remainder ? 1 : 0) }));
}

function largestRemainder(amountPaise, weights) {
  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
  if (!totalWeight) return weights.map(({ personId }) => ({ personId, amountPaise: 0 }));
  const allocations = weights.map(({ personId, weight }) => {
    const product = amountPaise * weight;
    return { personId, amountPaise: Math.floor(product / totalWeight), remainder: product % totalWeight };
  });
  let centsLeft = amountPaise - allocations.reduce((sum, item) => sum + item.amountPaise, 0);
  const byRemainder = [...allocations].sort((a, b) => b.remainder - a.remainder);
  for (let index = 0; index < centsLeft; index += 1) {
    const chosen = byRemainder[index % byRemainder.length];
    allocations.find((item) => item.personId === chosen.personId).amountPaise += 1;
  }
  return allocations.map(({ personId, amountPaise: share }) => ({ personId, amountPaise: share }));
}

export function splitByPercent(amountPaise, participants) {
  const weights = participants.map(({ personId, value }) => ({
    personId,
    weight: Math.round(Number(value) * 100),
  }));
  if (weights.some(({ weight }) => !Number.isInteger(weight) || weight < 0) || weights.reduce((sum, row) => sum + row.weight, 0) !== 10_000) return null;
  return largestRemainder(amountPaise, weights);
}

export function splitByAmount(participants) {
  const shares = participants.map(({ personId, value }) => ({ personId, amountPaise: parseRupees(value) }));
  if (shares.some(({ amountPaise }) => amountPaise === null || amountPaise < 0)) return null;
  return shares;
}

export function splitTotal(shares) {
  return shares.reduce((sum, share) => sum + (Number(share.amountPaise) || 0), 0);
}

export function applyExpenseToBalances(expenses, settlements = [], groupId = null) {
  const balances = new Map();
  const add = (id, amount) => balances.set(id, (balances.get(id) ?? 0) + amount);
  for (const expense of expenses) {
    if (groupId && expense.groupId !== groupId) continue;
    if (!Number.isInteger(expense.amountPaise) || !expense.payerId || !Array.isArray(expense.shares)) continue;
    add(expense.payerId, expense.amountPaise);
    for (const share of expense.shares) add(share.personId, -share.amountPaise);
  }
  for (const payment of settlements) {
    if (groupId && payment.groupId !== groupId) continue;
    if (!Number.isInteger(payment.amountPaise) || payment.amountPaise <= 0) continue;
    add(payment.fromId, payment.amountPaise);
    add(payment.toId, -payment.amountPaise);
  }
  return balances;
}

export function simplifyBalances(expenses, settlements, people, groupId = null) {
  const balances = applyExpenseToBalances(expenses, settlements, groupId);
  const debtors = [];
  const creditors = [];
  for (const person of people) {
    const balance = balances.get(person.id) ?? 0;
    if (balance < 0) debtors.push({ id: person.id, amountPaise: -balance });
    if (balance > 0) creditors.push({ id: person.id, amountPaise: balance });
  }
  debtors.sort((a, b) => b.amountPaise - a.amountPaise);
  creditors.sort((a, b) => b.amountPaise - a.amountPaise);
  const transfers = [];
  let debtorIndex = 0;
  let creditorIndex = 0;
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amountPaise = Math.min(debtor.amountPaise, creditor.amountPaise);
    if (amountPaise > 0) transfers.push({ fromId: debtor.id, toId: creditor.id, amountPaise });
    debtor.amountPaise -= amountPaise;
    creditor.amountPaise -= amountPaise;
    if (debtor.amountPaise === 0) debtorIndex += 1;
    if (creditor.amountPaise === 0) creditorIndex += 1;
  }
  return { balances, transfers };
}

export function currentMonthTotal(expenses, now = new Date()) {
  const month = now.getMonth();
  const year = now.getFullYear();
  return expenses
    .filter((expense) => {
      const date = new Date(`${expense.date}T12:00:00`);
      return date.getMonth() === month && date.getFullYear() === year;
    })
    .reduce((sum, expense) => sum + expense.amountPaise, 0);
}

export function getOutstandingTransfer(expenses, settlements, people, fromId, toId, groupId = null) {
  const { transfers } = simplifyBalances(expenses, settlements, people, groupId);
  return transfers.find((transfer) => transfer.fromId === fromId && transfer.toId === toId)?.amountPaise ?? 0;
}

export function balanceBetween(expenses, settlements, firstId, secondId, groupId = null) {
  let balance = 0;
  for (const expense of expenses) {
    if (groupId && expense.groupId !== groupId) continue;
    const firstShare = expense.shares?.find((share) => share.personId === firstId)?.amountPaise ?? 0;
    const secondShare = expense.shares?.find((share) => share.personId === secondId)?.amountPaise ?? 0;
    if (expense.payerId === firstId) balance += secondShare;
    if (expense.payerId === secondId) balance -= firstShare;
  }
  for (const payment of settlements) {
    if (groupId && payment.groupId !== groupId) continue;
    if (payment.fromId === secondId && payment.toId === firstId) balance -= payment.amountPaise;
    if (payment.fromId === firstId && payment.toId === secondId) balance += payment.amountPaise;
  }
  return balance;
}
