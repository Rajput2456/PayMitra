const currentUser = { id: "me", name: "Aanya Sharma", color: "#d9efe5", initials: "AS" };

const friends = [
  { id: "maya", name: "Maya Iyer", color: "#f3e1d5", initials: "MI", active: true },
  { id: "kabir", name: "Kabir Mehta", color: "#dce7f8", initials: "KM", active: true },
  { id: "zara", name: "Zara Khan", color: "#f4dfeb", initials: "ZK", active: true },
  { id: "ravi", name: "Ravi Nair", color: "#e9e4fa", initials: "RN", active: true },
  { id: "arjun", name: "Arjun Das", color: "#e1eee7", initials: "AD", active: true },
  { id: "nisha", name: "Nisha Patel", color: "#fae8ce", initials: "NP", active: true },
];

const groups = [
  { id: "college", name: "College Friends", emoji: "🎓", color: "#e9e4fa", memberIds: ["me", "maya", "kabir", "zara", "nisha"] },
  { id: "goa", name: "Goa Trip", emoji: "🌴", color: "#d9efe5", memberIds: ["me", "maya", "kabir", "zara"] },
  { id: "roommates", name: "Roommates", emoji: "🏡", color: "#f5ead4", memberIds: ["me", "ravi", "arjun"] },
  { id: "weekend", name: "Weekend Trip", emoji: "🚗", color: "#dce7f8", memberIds: ["me", "maya", "arjun", "nisha"] },
  { id: "office", name: "Office Buddies", emoji: "☕", color: "#f4dfeb", memberIds: ["me", "kabir", "ravi", "zara"] },
];

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (days) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
const equalShares = (amountPaise, ids) => {
  const base = Math.floor(amountPaise / ids.length);
  const extra = amountPaise - base * ids.length;
  return ids.map((personId, index) => ({ personId, amountPaise: base + (index < extra ? 1 : 0) }));
};
const expense = (id, title, amountPaise, payerId, participantIds, groupId, category, days) => ({
  id,
  title,
  amountPaise,
  payerId,
  participantIds,
  shares: equalShares(amountPaise, participantIds),
  splitMethod: "equal",
  groupId,
  category,
  date: days === 0 ? today() : daysAgo(days),
  createdAt: new Date(Date.now() - days * 86_400_000).toISOString(),
});

export function createDemoData() {
  return {
    version: 1,
    user: currentUser,
    friends: structuredClone(friends),
    groups: structuredClone(groups),
    expenses: [
      expense("exp-goa-stay", "Goa villa stay", 1_800_000, "me", ["me", "maya", "kabir", "zara"], "goa", "Accommodation", 1),
      expense("exp-groceries", "Sunday groceries", 320_000, "maya", ["me", "maya", "ravi"], "roommates", "Groceries", 3),
      expense("exp-train", "Train tickets", 450_000, "kabir", ["me", "maya", "kabir"], "goa", "Travel", 4),
      expense("exp-dinner", "Dinner at Mizu", 2_100_00, "me", ["me", "zara"], "college", "Food & Drinks", 5),
      expense("exp-electricity", "Electricity bill", 486_000, "ravi", ["me", "ravi", "arjun"], "roommates", "Utilities", 7),
      expense("exp-supplies", "House supplies", 257_500, "me", ["me", "ravi", "arjun"], "roommates", "Shopping", 9),
      expense("exp-coffee", "Coffee catch-up", 95_000, "zara", ["me", "zara"], "college", "Food & Drinks", 11),
      expense("exp-museum", "Museum tickets", 360_000, "nisha", ["me", "nisha", "maya", "arjun"], "weekend", "Entertainment", 14),
    ],
    settlements: [],
    budgets: {
      monthlyPaise: 4_200_000,
      groupPaise: { goa: 4_000_000, roommates: 2_500_000 },
    },
    trip: {
      name: "Goa Getaway",
      groupId: "goa",
      budgetPaise: 4_000_000,
      participantIds: ["me", "maya", "kabir", "zara"],
    },
  };
}

export const STORAGE_KEY = "paymitra-demo-data-v1";

export function loadDemoData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDemoData();
    const parsed = JSON.parse(raw);
    if (
      parsed?.version === 1 &&
      parsed.user?.id === "me" &&
      Array.isArray(parsed.friends) &&
      Array.isArray(parsed.groups) &&
      Array.isArray(parsed.expenses) &&
      Array.isArray(parsed.settlements) &&
      parsed.budgets &&
      parsed.trip
    ) return parsed;
  } catch {
    // A malformed or unavailable browser store falls back to a fresh demo.
  }
  return createDemoData();
}
