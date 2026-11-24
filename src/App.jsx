import React, { useEffect, useMemo, useState } from "react";
import { AddFriendDialog, AddGroupMemberDialog, ConfirmDialog, CreateGroupDialog, SettleDialog, SmartBillDialog } from "./components/Forms.jsx";
import { Avatar, BrandMark, Icon } from "./components/Icons.jsx";
import { ExpenseForm } from "./components/ExpenseForm.jsx";
import { DashboardPage, ExpensesPage, FriendDetail, FriendsPage, GroupDetail, GroupsPage, InsightsPage, SettlementsPage, SettingsPage, TripPlannerPage } from "./components/Pages.jsx";
import { createDemoData, loadDemoData, STORAGE_KEY } from "./data.js";
import { applyExpenseToBalances, balanceBetween, equalSplit, formatRupees, simplifyBalances } from "./lib/finance.js";

const navigation = [
  { id: "dashboard", label: "Overview", icon: "dashboard" },
  { id: "friends", label: "Friends", icon: "friends" },
  { id: "groups", label: "Groups", icon: "groups" },
  { id: "expenses", label: "Expenses", icon: "expense" },
  { id: "settle", label: "Settle up", icon: "settle" },
  { id: "insights", label: "Insights", icon: "insights" },
  { id: "trip", label: "Trip planner", icon: "trip" },
  { id: "settings", label: "Settings", icon: "settings" },
];

export default function App() {
  const [data, setData] = useState(loadDemoData);
  const [page, setPage] = useState("dashboard");
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedFriendId, setSelectedFriendId] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settlementGroup, setSettlementGroup] = useState("all");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* Storage can be unavailable in private or restricted contexts. */ }
  }, [data]);
  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 3400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const people = useMemo(() => [data.user, ...data.friends], [data.user, data.friends]);
  const ledger = useMemo(() => simplifyBalances(data.expenses, data.settlements, people), [data.expenses, data.settlements, people]);
  const transferSuggestions = ledger.transfers;
  const filteredLedger = useMemo(() => settlementGroup === "all"
    ? simplifyBalances(data.expenses, data.settlements, people)
    : simplifyBalances(data.expenses, data.settlements, people, settlementGroup), [data.expenses, data.settlements, people, settlementGroup]);
  const settlementHistory = useMemo(() => [...data.settlements].filter((payment) => settlementGroup === "all" || payment.groupId === settlementGroup).sort((a, b) => b.date.localeCompare(a.date)), [data.settlements, settlementGroup]);

  const notify = (message, tone = "success") => setToast({ message, tone, id: Date.now() });
  const navigate = (nextPage) => {
    setPage(nextPage);
    setSelectedGroupId(null);
    setSelectedFriendId(null);
    setMobileMenuOpen(false);
  };
  const openExpense = (expense = null, options = {}) => setModal({ type: "expense", expense, ...options });
  const openSettlement = (transfer = null, groupId = settlementGroup) => setModal({ type: "settlement", transfer, groupId });
  const saveExpense = (expense) => {
    setData((current) => ({ ...current, expenses: current.expenses.some((item) => item.id === expense.id) ? current.expenses.map((item) => item.id === expense.id ? expense : item) : [expense, ...current.expenses] }));
    setModal(null);
    setNow(Date.now());
    notify(data.expenses.some((item) => item.id === expense.id) ? "Expense updated. Balances are in sync." : "Expense added. Balances are in sync.");
  };
  const deleteExpense = (expense) => setModal({
    type: "confirm",
    title: "Delete this expense?",
    body: `“${expense.title}” will be removed from the ledger and all balances will recalculate.`,
    confirmLabel: "Delete expense",
    danger: true,
    onConfirm: () => {
      setData((current) => ({ ...current, expenses: current.expenses.filter((item) => item.id !== expense.id) }));
      setModal(null);
      notify("Expense deleted and balances recalculated.");
    },
  });
  const addFriend = (friend) => {
    setData((current) => ({ ...current, friends: [...current.friends, friend] }));
    setModal(null);
    notify(`${friend.name} is in your circle.`);
  };
  const removeFriend = (friend) => {
    setModal({
      type: "confirm", title: `Remove ${friend.name.split(" ")[0]}?`, body: "This hides them from your friend list and group pickers. Existing expense history stays in the ledger.", confirmLabel: "Remove friend", danger: true,
      onConfirm: () => {
        setData((current) => ({ ...current, friends: current.friends.map((item) => item.id === friend.id ? { ...item, active: false } : item), groups: current.groups.map((group) => ({ ...group, memberIds: group.memberIds.filter((id) => id !== friend.id) })) }));
        setModal(null);
        setSelectedFriendId(null);
        notify(`${friend.name} was removed from your active circle.`);
      },
    });
  };
  const createGroup = (group) => {
    setData((current) => ({ ...current, groups: [group, ...current.groups] }));
    setModal(null);
    setSelectedGroupId(group.id);
    setPage("groups");
    notify(`${group.name} is ready for your crew.`);
  };
  const addGroupMember = (memberId) => {
    const group = data.groups.find((item) => item.id === modal.group.id);
    setData((current) => ({ ...current, groups: current.groups.map((item) => item.id === group.id ? { ...item, memberIds: [...new Set([...item.memberIds, memberId])] } : item) }));
    setModal(null);
    notify(`${data.friends.find((friend) => friend.id === memberId)?.name || "Friend"} added to ${group.name}.`);
  };
  const removeGroupMember = (group, memberId) => {
    const person = data.friends.find((friend) => friend.id === memberId);
    setData((current) => ({ ...current, groups: current.groups.map((item) => item.id === group.id ? { ...item, memberIds: item.memberIds.filter((id) => id !== memberId) } : item) }));
    notify(`${person?.name || "Member"} removed from ${group.name}. Past expenses are unchanged.`);
  };
  const deleteGroup = (group) => setModal({
    type: "confirm", title: `Delete ${group.name}?`, body: "This removes the group and its demo expenses and settlements. This cannot be undone.", confirmLabel: "Delete group", danger: true,
    onConfirm: () => {
      setData((current) => ({
        ...current,
        groups: current.groups.filter((item) => item.id !== group.id),
        expenses: current.expenses.filter((expense) => expense.groupId !== group.id),
        settlements: current.settlements.filter((payment) => payment.groupId !== group.id),
        budgets: { ...current.budgets, groupPaise: Object.fromEntries(Object.entries(current.budgets.groupPaise).filter(([id]) => id !== group.id)) },
        trip: current.trip.groupId === group.id ? { ...current.trip, groupId: current.groups.find((item) => item.id !== group.id)?.id || "", participantIds: [] } : current.trip,
      }));
      setSelectedGroupId(null);
      setModal(null);
      notify(`${group.name} and its demo activity were removed.`);
    },
  });
  const recordSettlement = (payment) => {
    setData((current) => ({ ...current, settlements: [payment, ...current.settlements] }));
    setModal(null);
    setNow(Date.now());
    notify("Settlement recorded. Your balances are updated.");
  };
  const useBillDetails = ({ title, amountPaise, groupId, participantIds, category }) => {
    const participants = participantIds.length ? participantIds : ["me"];
    const payment = {
      id: `exp-${Date.now()}`, title, amountPaise, payerId: "me", date: new Date().toISOString().slice(0, 10), category,
      groupId: groupId || null, participantIds: participants, shares: equalSplit(amountPaise, participants), splitMethod: "equal", createdAt: new Date().toISOString(),
    };
    setData((current) => ({ ...current, expenses: [payment, ...current.expenses] }));
    setModal(null);
    setPage("expenses");
    notify("Bill details added as a demo expense. No OCR was used.");
  };
  const saveTrip = (trip) => {
    setData((current) => ({ ...current, trip }));
    notify("Trip plan saved.");
  };
  const setProfileName = (name) => {
    if (!name.trim()) return notify("Add a display name first.", "error");
    const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
    setData((current) => ({ ...current, user: { ...current.user, name: name.trim(), initials } }));
    notify("Profile saved.");
  };
  const saveMonthlyBudget = (monthlyPaise) => {
    if (!Number.isFinite(monthlyPaise) || monthlyPaise < 0) return notify("Enter a valid budget.", "error");
    setData((current) => ({ ...current, budgets: { ...current.budgets, monthlyPaise } }));
    notify("Monthly budget updated.");
  };
  const saveGroupBudget = (groupId, amount) => {
    if (!Number.isFinite(amount) || amount < 0) return notify("Enter a valid group budget.", "error");
    setData((current) => ({ ...current, budgets: { ...current.budgets, groupPaise: { ...current.budgets.groupPaise, [groupId]: amount } } }));
    notify("Group budget saved.");
  };
  const resetDemo = () => setModal({
    type: "confirm", title: "Reset all demo data?", body: "Your local changes will be replaced with the original PayMitra sample friends, groups, expenses, budgets, and trip.", confirmLabel: "Reset demo data", danger: true,
    onConfirm: () => {
      const fresh = createDemoData();
      setData(fresh);
      setSelectedGroupId(null);
      setSelectedFriendId(null);
      setPage("dashboard");
      setModal(null);
      notify("Demo data restored.");
    },
  });

  const openFriendSettle = (friendId) => {
    const direct = balanceBetween(data.expenses, data.settlements, "me", friendId);
    const transfer = direct > 0
      ? { fromId: friendId, toId: "me", amountPaise: direct }
      : direct < 0 ? { fromId: "me", toId: friendId, amountPaise: Math.abs(direct) } : null;
    const validSuggestion = transferSuggestions.find((item) => item.fromId === transfer?.fromId && item.toId === transfer?.toId);
    if (!validSuggestion) {
      setPage("settle"); setSelectedFriendId(null); notify("Use the suggested group payment to keep everyone in sync."); return;
    }
    openSettlement(validSuggestion, "all");
  };
  const group = selectedGroupId ? data.groups.find((item) => item.id === selectedGroupId) : null;
  const selectedFriend = selectedFriendId ? data.friends.find((item) => item.id === selectedFriendId && item.active !== false) : null;
  const showPage = () => {
    if (page === "dashboard") return <DashboardPage data={data} people={people} transfers={transferSuggestions} netBalances={ledger.balances} onAddExpense={() => openExpense()} onSettle={(transfer) => openSettlement(transfer, "all")} onNavigate={navigate} onOpenGroup={(id) => { setSelectedGroupId(id); setPage("groups"); }} onEditExpense={openExpense} onDeleteExpense={deleteExpense} />;
    if (page === "friends" && selectedFriend) return <FriendDetail data={data} friendId={selectedFriend.id} onBack={() => setSelectedFriendId(null)} onAddExpense={(friendId) => openExpense(null, { defaultParticipantIds: ["me", friendId] })} onSettle={openFriendSettle} />;
    if (page === "friends") return <FriendsPage data={data} onAddFriend={() => setModal({ type: "friend" })} onSelectFriend={setSelectedFriendId} />;
    if (page === "groups" && group) return <GroupDetail data={data} group={group} onBack={() => setSelectedGroupId(null)} onAddExpense={(groupId) => openExpense(null, { defaultGroupId: groupId })} onSettle={(groupId) => { setSettlementGroup(groupId); setSelectedGroupId(null); setPage("settle"); }} onAddMember={(group) => setModal({ type: "group-member", group })} onRemoveMember={removeGroupMember} onDeleteGroup={() => deleteGroup(group)} onEditExpense={openExpense} onDeleteExpense={deleteExpense} />;
    if (page === "groups") return <GroupsPage data={data} onCreateGroup={() => setModal({ type: "group-create" })} onOpenGroup={setSelectedGroupId} />;
    if (page === "expenses") return <ExpensesPage data={data} onAddExpense={() => openExpense()} onSmartBill={() => setModal({ type: "smart-bill" })} onEditExpense={openExpense} onDeleteExpense={deleteExpense} />;
    if (page === "settle") return <SettlementsPage data={data} people={people} groupFilter={settlementGroup} onGroupFilter={setSettlementGroup} transfers={filteredLedger.transfers} history={settlementHistory} onRecord={(transfer) => openSettlement(transfer, settlementGroup)} />;
    if (page === "insights") return <InsightsPage data={data} />;
    if (page === "trip") return <TripPlannerPage data={data} onSaveTrip={saveTrip} onAddExpense={(groupId, participantIds, category) => openExpense(null, { defaultGroupId: groupId, defaultParticipantIds: participantIds, defaultCategory: category })} />;
    return <SettingsPage data={data} onSaveProfile={setProfileName} onSaveBudget={saveMonthlyBudget} onSaveGroupBudget={saveGroupBudget} onReset={resetDemo} />;
  };

  const renderModal = () => {
    if (!modal) return null;
    if (modal.type === "expense") return <ExpenseForm key={modal.expense?.id || `${modal.defaultGroupId || "new"}-${modal.defaultCategory || ""}`} data={data} expense={modal.expense} defaultGroupId={modal.defaultGroupId} defaultParticipantIds={modal.defaultParticipantIds} defaultCategory={modal.defaultCategory} onSave={saveExpense} onClose={() => setModal(null)} />;
    if (modal.type === "friend") return <AddFriendDialog onClose={() => setModal(null)} onSave={addFriend} />;
    if (modal.type === "group-create") return <CreateGroupDialog data={data} onClose={() => setModal(null)} onSave={createGroup} />;
    if (modal.type === "group-member") return <AddGroupMemberDialog data={data} group={modal.group} onClose={() => setModal(null)} onSave={addGroupMember} />;
    if (modal.type === "settlement") return <SettleDialog key={`${modal.transfer?.fromId}-${modal.transfer?.toId}-${modal.groupId}`} data={data} people={people} initialTransfer={modal.transfer} groupId={modal.groupId} onClose={() => setModal(null)} onSave={recordSettlement} />;
    if (modal.type === "smart-bill") return <SmartBillDialog data={data} onClose={() => setModal(null)} onUseDetails={useBillDetails} />;
    if (modal.type === "confirm") return <ConfirmDialog title={modal.title} body={modal.body} confirmLabel={modal.confirmLabel} danger={modal.danger} onClose={() => setModal(null)} onConfirm={modal.onConfirm} />;
    return null;
  };

  return <div className={`app-shell ${mobileMenuOpen ? "mobile-nav-open" : ""}`}>
    <aside className="sidebar">
      <div className="brand-lockup"><BrandMark size={39} /><span><strong>PayMitra</strong><small>Dosti bhi, hisab bhi.</small></span><button className="sidebar-close icon-button" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}><Icon name="close" /></button></div>
      <div className="workspace-chip"><span className="workspace-avatar">{data.user.initials || "AS"}</span><span><strong>My workspace</strong><small>Personal demo</small></span><Icon name="chevron" size={14} /></div>
      <nav className="side-nav" aria-label="Main navigation"><p className="nav-section-label">YOUR SPACE</p>{navigation.map((item) => <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => navigate(item.id)} data-testid={`nav-${item.id}`}><Icon name={item.icon} size={18} /><span>{item.label}</span>{item.id === "settle" && transferSuggestions.length > 0 && <small className="nav-count">{transferSuggestions.length}</small>}</button>)}</nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-tip"><span className="tip-star"><Icon name="sparkle" size={16} /></span><strong>Friends first.<br />Math second.</strong><p>Keep every shared plan feeling easy.</p></div>
      <button className="profile-switcher" onClick={() => navigate("settings")} data-testid="profile-settings"><Avatar person={data.user} size="sm" /><span><strong>{data.user.name}</strong><small>Demo profile</small></span><Icon name="chevron" size={15} /></button>
    </aside>
    {mobileMenuOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} />}
    <div className="main-column">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu-button icon-button" aria-label="Open navigation" onClick={() => setMobileMenuOpen(true)}><Icon name="menu" /></button><span className="breadcrumb">PayMitra <i>/</i> <strong>{navigation.find((item) => item.id === page)?.label || "Overview"}</strong></span></div><div className="topbar-actions"><button className="topbar-search" onClick={() => { navigate("expenses"); window.setTimeout(() => document.querySelector('[data-testid="expense-search"]')?.focus(), 60); }}><Icon name="search" size={16} /><span>Search expenses</span><kbd>⌘ K</kbd></button><span className="topbar-divider" /><button className="profile-mini" onClick={() => navigate("settings")} aria-label="Open settings"><Avatar person={data.user} size="sm" /><Icon name="chevron" size={14} /></button></div></header>
      <main className="page-content" key={`${page}-${selectedGroupId || ""}-${selectedFriendId || ""}`}>{showPage()}</main>
      <footer className="app-footer"><span>PayMitra <i>·</i> Demo mode</span><span>Made for sharing, built for clarity <b>✦</b></span></footer>
    </div>
    {modal && renderModal()}
    {toast && <div className={`toast toast-${toast.tone}`} role="status" data-testid="toast"><span><Icon name={toast.tone === "error" ? "close" : "check"} size={16} /></span>{toast.message}<button aria-label="Dismiss notification" onClick={() => setToast(null)}><Icon name="close" size={14} /></button></div>}
  </div>;
}
