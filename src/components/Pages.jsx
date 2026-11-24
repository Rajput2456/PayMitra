import React, { useMemo, useState } from "react";
import { Avatar, Icon } from "./Icons.jsx";
import { CATEGORIES, balanceBetween, currentMonthTotal, formatRupees, simplifyBalances } from "../lib/finance.js";

const personName = (data, id) => id === "me" ? `${data.user.name} (you)` : data.friends.find((friend) => friend.id === id)?.name || "Former member";
const personInfo = (data, id) => id === "me" ? data.user : data.friends.find((friend) => friend.id === id) || { id, name: "Former member", initials: "FM", color: "#e4e9e5" };
const dateLabel = (date) => new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const amountTone = (amount) => amount > 0 ? "positive" : amount < 0 ? "negative" : "neutral";

export function PageTitle({ eyebrow, title, subtitle, action }) {
  return <div className="page-title"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{subtitle && <p className="page-subtitle">{subtitle}</p>}</div>{action}</div>;
}

function StatCard({ label, value, note, icon, tone = "mint", testId }) {
  return <article className="stat-card" data-testid={testId}><div className={`stat-icon stat-${tone}`}><Icon name={icon} size={19} /></div><p>{label}</p><strong>{value}</strong><small>{note}</small></article>;
}

function SpendingBars({ expenses }) {
  const rows = useMemo(() => {
    const totals = new Map();
    expenses.forEach((expense) => totals.set(expense.category, (totals.get(expense.category) || 0) + expense.amountPaise));
    return [...totals].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [expenses]);
  const max = Math.max(1, ...rows.map((row) => row[1]));
  const colors = ["#1c7554", "#83c9a7", "#ebad76", "#8b9acb"];
  if (!rows.length) return <p className="muted-copy">Add a few expenses to see where the money goes.</p>;
  return <div className="spending-bars">{rows.map(([category, amount], index) => <div className="spending-bar-row" key={category}><div className="spending-bar-label"><span><i style={{ background: colors[index] }} />{category}</span><strong>{formatRupees(amount)}</strong></div><div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(5, amount / max * 100)}%`, background: colors[index] }} /></div></div>)}</div>;
}

export function DashboardPage({ data, people, transfers, netBalances, onAddExpense, onSettle, onNavigate, onOpenGroup, onEditExpense, onDeleteExpense }) {
  const owedToMe = transfers.filter((row) => row.toId === "me").reduce((sum, row) => sum + row.amountPaise, 0);
  const iOwe = transfers.filter((row) => row.fromId === "me").reduce((sum, row) => sum + row.amountPaise, 0);
  const net = (netBalances.get("me") ?? 0);
  const monthSpend = currentMonthTotal(data.expenses);
  const budget = data.budgets.monthlyPaise || 0;
  const budgetPercent = budget ? Math.min(100, Math.round(monthSpend / budget * 100)) : 0;
  const visibleGroups = [...data.groups].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")).slice(0, 3);
  const recent = [...data.expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  return <>
    <PageTitle eyebrow={today.toUpperCase()} title={`Namaste, ${data.user.name.split(" ")[0]}`} subtitle="Your shared spending, all in one easy place." action={<div className="title-actions"><button className="button button-quiet hide-mobile" onClick={() => onNavigate("settle")}><Icon name="settle" /> Settle up</button><button className="button button-primary" onClick={onAddExpense} data-testid="quick-add-expense"><Icon name="plus" /> Add expense</button></div>} />
    <section className="dashboard-hero-grid">
      <article className="net-card">
        <div className="net-card-top"><span className="net-icon"><Icon name="wallet" size={20} /></span><span className="net-chip"><i /> Live demo balance</span></div>
        <p>Overall net balance</p>
        <h2 className={net >= 0 ? "net-positive" : "net-negative"}>{net >= 0 ? "+" : "−"}{formatRupees(Math.abs(net))}</h2>
        <span className="net-caption">{net >= 0 ? "Your friends owe you more than you owe them." : "You owe a little more than your friends owe you."}</span>
        <div className="net-card-bottom"><span><strong>{formatRupees(owedToMe)}</strong><small>You're owed</small></span><span><strong>{formatRupees(iOwe)}</strong><small>You owe</small></span><button aria-label="View settlement suggestions" onClick={() => onNavigate("settle")}><Icon name="arrow" /></button></div>
      </article>
      <div className="stats-grid">
        <StatCard label="You're owed" value={formatRupees(owedToMe)} note="Across friends & groups" icon="arrow" tone="mint" testId="stat-owed" />
        <StatCard label="You owe" value={formatRupees(iOwe)} note="Across friends & groups" icon="settle" tone="sand" testId="stat-owe" />
        <StatCard label="Active groups" value={String(data.groups.length).padStart(2, "0")} note="Good company, clear tabs" icon="groups" tone="lavender" testId="stat-groups" />
        <StatCard label="Friends" value={String(data.friends.filter((friend) => friend.active !== false).length).padStart(2, "0")} note="In your PayMitra circle" icon="friends" tone="rose" testId="stat-friends" />
      </div>
    </section>

    <section className="dashboard-grid">
      <article className="panel spending-panel"><div className="panel-head"><div><p className="eyebrow">THIS MONTH</p><h2>Spending snapshot</h2></div><button className="text-button" onClick={() => onNavigate("insights")}>See insights <Icon name="arrow" size={15} /></button></div>
        <div className="spending-total"><strong>{formatRupees(monthSpend)}</strong><span>shared expenses</span></div>
        <div className="budget-progress"><div className="progress-track"><div className={`progress-fill ${budgetPercent >= 100 ? "over-budget" : ""}`} style={{ width: `${budgetPercent}%` }} /></div><div><span>{budget ? `${budgetPercent}% of ${formatRupees(budget)} monthly budget` : "Set a monthly budget in Settings"}</span><strong>{budget ? formatRupees(Math.max(0, budget - monthSpend)) : ""} left</strong></div></div>
        <SpendingBars expenses={data.expenses.filter((expense) => new Date(`${expense.date}T12:00:00`).getMonth() === new Date().getMonth())} />
      </article>
      <article className="panel group-panel"><div className="panel-head"><div><p className="eyebrow">YOUR CIRCLE</p><h2>Groups</h2></div><button className="text-button" onClick={() => onNavigate("groups")}>All groups <Icon name="arrow" size={15} /></button></div>
        <div className="group-list-compact">{visibleGroups.map((group) => {
          const spent = data.expenses.filter((expense) => expense.groupId === group.id).reduce((sum, expense) => sum + expense.amountPaise, 0);
          return <button className="group-compact-row" key={group.id} onClick={() => onOpenGroup(group.id)}><span className="group-emoji" style={{ background: group.color }}>{group.emoji}</span><span className="group-row-name"><strong>{group.name}</strong><small>{group.memberIds.length} members · {data.expenses.filter((expense) => expense.groupId === group.id).length} expenses</small></span><span className="group-row-total">{formatRupees(spent)}<Icon name="chevron" size={15} /></span></button>;
        })}</div>
      </article>
    </section>

    <section className="dashboard-grid dashboard-grid-bottom">
      <article className="panel activity-panel"><div className="panel-head"><div><p className="eyebrow">THE LATEST</p><h2>Recent expenses</h2></div><button className="text-button" onClick={() => onNavigate("expenses")}>View history <Icon name="arrow" size={15} /></button></div>
        <div className="activity-list">{recent.map((expense) => <ActivityRow key={expense.id} expense={expense} data={data} onEdit={onEditExpense} onDelete={onDeleteExpense} />)}</div>
      </article>
      <article className="panel settle-panel"><div className="panel-head"><div><p className="eyebrow">CLEAR IT UP</p><h2>Suggested settlements</h2></div><span className="count-pill">{transfers.length}</span></div>
        {transfers.length ? <div className="suggestion-list">{transfers.slice(0, 3).map((transfer, index) => <div className="suggestion-row" key={`${transfer.fromId}-${transfer.toId}-${index}`}><div className="suggestion-people"><Avatar person={people.find((person) => person.id === transfer.fromId)} size="sm" /><Icon name="back" size={14} /><Avatar person={people.find((person) => person.id === transfer.toId)} size="sm" /><span><strong>{transfer.fromId === "me" ? "You" : personName(data, transfer.fromId)}</strong><small>pays {transfer.toId === "me" ? "you" : personName(data, transfer.toId)}</small></span></div><div className="suggestion-action"><strong>{formatRupees(transfer.amountPaise)}</strong><button onClick={() => onSettle(transfer)} aria-label={`Settle ${formatRupees(transfer.amountPaise)}`}>Settle</button></div></div>)}</div> : <div className="empty-inline"><span className="empty-icon"><Icon name="check" /></span><strong>All squared away</strong><p>No settlements needed right now.</p></div>}
        {transfers.length > 3 && <button className="button button-outline button-full" onClick={() => onNavigate("settle")}>See all suggestions</button>}
      </article>
    </section>
  </>;
}

export function ActivityRow({ expense, data, onEdit, onDelete, compact = false }) {
  const group = data.groups.find((item) => item.id === expense.groupId);
  const paidBy = expense.payerId === "me" ? "You paid" : `${personName(data, expense.payerId).split(" ")[0]} paid`;
  return <div className={`activity-row ${compact ? "activity-compact" : ""}`} data-testid={`expense-row-${expense.id}`}>
    <span className={`category-icon category-${expense.category?.toLowerCase().replace(/[^a-z]+/g, "-") || "other"}`}><Icon name={expense.category === "Travel" ? "trip" : expense.category === "Shopping" ? "wallet" : expense.category === "Entertainment" ? "sparkle" : "expense"} size={17} /></span>
    <div className="activity-description"><strong>{expense.title}</strong><span>{paidBy}{group ? ` · ${group.name}` : " · Friends"} · {dateLabel(expense.date)}</span></div>
    <strong className="activity-amount">{formatRupees(expense.amountPaise)}</strong>
    <div className="row-actions"><button className="icon-button small-icon-button" aria-label={`Edit ${expense.title}`} onClick={() => onEdit(expense)}><Icon name="edit" size={15} /></button><button className="icon-button small-icon-button danger-hover" aria-label={`Delete ${expense.title}`} onClick={() => onDelete(expense)}><Icon name="trash" size={15} /></button></div>
  </div>;
}

export function FriendsPage({ data, onAddFriend, onSelectFriend }) {
  const [query, setQuery] = useState("");
  const friends = data.friends.filter((friend) => friend.active !== false && friend.name.toLowerCase().includes(query.toLowerCase()));
  return <>
    <PageTitle eyebrow="YOUR PEOPLE" title="Friends" subtitle="Good friends, clear balances. Always." action={<button className="button button-primary" onClick={onAddFriend} data-testid="add-friend"><Icon name="plus" /> Add a friend</button>} />
    <div className="toolbar-panel"><label className="search-box"><Icon name="search" /><input aria-label="Search friends" placeholder="Find a friend" value={query} onChange={(event) => setQuery(event.target.value)} data-testid="friend-search" /></label><span className="muted-label">{friends.length} friends</span></div>
    {friends.length ? <div className="friend-grid">{friends.map((friend) => {
      const balance = balanceBetween(data.expenses, data.settlements, "me", friend.id);
      const activityCount = data.expenses.filter((expense) => expense.participantIds.includes(friend.id)).length;
      return <button className="friend-card" key={friend.id} onClick={() => onSelectFriend(friend.id)} data-testid={`friend-${friend.id}`}>
        <span className="friend-card-top"><Avatar person={friend} size="lg" /><span className="friend-card-arrow"><Icon name="arrow" size={16} /></span></span>
        <strong>{friend.name}</strong><small>{activityCount} shared expenses</small>
        <span className={`friend-balance ${amountTone(balance)}`}>{balance > 0 ? `Owes you ${formatRupees(balance)}` : balance < 0 ? `You owe ${formatRupees(Math.abs(balance))}` : "All settled up"}</span>
      </button>;
    })}</div> : <EmptyState icon="search" title="No friends found" body="Try another name or add someone new." action={onAddFriend} actionLabel="Add a friend" />}
    <section className="info-strip"><span className="info-strip-icon"><Icon name="sparkle" /></span><p><strong>A little clarity goes a long way.</strong> Add expenses with friends to keep every shared plan friendly and stress-free.</p></section>
  </>;
}

export function FriendDetail({ data, friendId, onBack, onAddExpense, onSettle }) {
  const friend = data.friends.find((item) => item.id === friendId);
  if (!friend) return null;
  const balance = balanceBetween(data.expenses, data.settlements, "me", friend.id);
  const rows = data.expenses.filter((expense) => expense.participantIds.includes(friend.id)).sort((a, b) => b.date.localeCompare(a.date));
  const commonGroups = data.groups.filter((group) => group.memberIds.includes(friend.id) && group.memberIds.includes("me"));
  return <>
    <button className="back-link" onClick={onBack}><Icon name="back" size={16} /> All friends</button>
    <section className="detail-hero friend-detail-hero"><div><Avatar person={friend} size="xl" /><div><p className="eyebrow">FRIENDSHIP</p><h1>{friend.name}</h1><p className="page-subtitle">In {commonGroups.length} shared groups · {rows.length} shared expenses</p></div></div><div className="detail-hero-actions"><button className="button button-outline" onClick={() => onAddExpense(friend.id)}><Icon name="plus" /> Add expense</button><button className="button button-primary" onClick={() => onSettle(friend.id)}><Icon name="settle" /> Settle up</button></div></section>
    <section className="friend-balance-banner"><div><p className="eyebrow">YOUR BALANCE WITH {friend.name.split(" ")[0].toUpperCase()}</p><strong className={amountTone(balance)}>{balance > 0 ? `${friend.name.split(" ")[0]} owes you ${formatRupees(balance)}` : balance < 0 ? `You owe ${formatRupees(Math.abs(balance))}` : "You're all settled up"}</strong><span>Calculated from shared expenses and recorded settlements.</span></div><span className="balance-banner-icon"><Icon name="wallet" size={23} /></span></section>
    <section className="panel"><div className="panel-head"><div><p className="eyebrow">TOGETHER</p><h2>Shared history</h2></div><span className="count-pill">{rows.length}</span></div><div className="activity-list">{rows.map((expense) => <ActivityRow key={expense.id} expense={expense} data={data} onEdit={() => {}} onDelete={() => {}} compact />)}</div></section>
  </>;
}

export function GroupsPage({ data, onCreateGroup, onOpenGroup }) {
  return <>
    <PageTitle eyebrow="BETTER TOGETHER" title="Groups" subtitle="Trips, homes, and all the little plans in between." action={<button className="button button-primary" onClick={onCreateGroup} data-testid="create-group"><Icon name="plus" /> Create a group</button>} />
    <div className="group-grid">{data.groups.map((group) => {
      const expenses = data.expenses.filter((expense) => expense.groupId === group.id);
      const spent = expenses.reduce((sum, expense) => sum + expense.amountPaise, 0);
      const balance = simplifyBalances(data.expenses, data.settlements, [data.user, ...data.friends], group.id).balances.get("me") || 0;
      return <button className="group-card" key={group.id} onClick={() => onOpenGroup(group.id)} data-testid={`group-${group.id}`}>
        <span className="group-card-head"><span className="group-emoji group-emoji-large" style={{ background: group.color }}>{group.emoji}</span><span className="group-card-arrow"><Icon name="arrow" size={17} /></span></span>
        <strong className="group-card-title">{group.name}</strong><span className="group-card-description">{group.memberIds.length} people · {expenses.length} expenses</span>
        <span className="avatar-stack">{group.memberIds.slice(0, 5).map((id) => <Avatar key={id} person={id === "me" ? data.user : data.friends.find((friend) => friend.id === id)} size="xs" />)}{group.memberIds.length > 5 && <small>+{group.memberIds.length - 5}</small>}</span>
        <span className="group-card-bottom"><span>{formatRupees(spent)}<small> total spend</small></span><span className={amountTone(balance)}>{balance > 0 ? `+${formatRupees(balance)}` : balance < 0 ? `−${formatRupees(Math.abs(balance))}` : "Settled"}</span></span>
      </button>;
    })}</div>
    <section className="info-strip"><span className="info-strip-icon"><Icon name="groups" /></span><p><strong>Make the memories, not the mental math.</strong> A group keeps shared expenses and balances together from the first plan to the final chai.</p></section>
  </>;
}

export function GroupDetail({ data, group, onBack, onAddExpense, onSettle, onAddMember, onRemoveMember, onDeleteGroup, onEditExpense, onDeleteExpense }) {
  if (!group) return null;
  const groupExpenses = data.expenses.filter((expense) => expense.groupId === group.id).sort((a, b) => b.date.localeCompare(a.date));
  const groupLedger = simplifyBalances(data.expenses, data.settlements, [data.user, ...data.friends], group.id);
  const groupTransfers = groupLedger.transfers;
  const spent = groupExpenses.reduce((sum, expense) => sum + expense.amountPaise, 0);
  const budget = data.budgets.groupPaise[group.id] || 0;
  const percent = budget ? Math.min(100, Math.round(spent / budget * 100)) : 0;
  return <>
    <button className="back-link" onClick={onBack}><Icon name="back" size={16} /> All groups</button>
    <section className="detail-hero group-detail-hero"><div><span className="group-emoji group-emoji-large" style={{ background: group.color }}>{group.emoji}</span><div><p className="eyebrow">GROUP DETAILS</p><h1>{group.name}</h1><p className="page-subtitle">{group.memberIds.length} members · {groupExpenses.length} expenses</p></div></div><div className="detail-hero-actions"><button className="button button-outline" onClick={() => onSettle(group.id)}><Icon name="settle" /> Settle up</button><button className="button button-primary" onClick={() => onAddExpense(group.id)}><Icon name="plus" /> Add expense</button></div></section>
    <section className="group-detail-grid">
      <article className="panel group-members-panel"><div className="panel-head"><div><p className="eyebrow">THE CIRCLE</p><h2>Members</h2></div><button className="small-add-button" onClick={() => onAddMember(group)}><Icon name="plus" size={15} /> Add</button></div>
        <div className="member-list">{group.memberIds.map((id) => { const person = id === "me" ? data.user : data.friends.find((friend) => friend.id === id); const balance = groupLedger.balances.get(id) || 0; return <div className="member-row" key={id}><Avatar person={person} size="sm" /><span className="member-name"><strong>{id === "me" ? "You" : personName(data, id)}</strong><small>{id === "me" ? "Group admin" : "Member"}</small></span><span className={`member-balance ${amountTone(balance)}`}>{balance > 0 ? `+${formatRupees(balance)}` : balance < 0 ? `−${formatRupees(Math.abs(balance))}` : "₹0.00"}</span>{id !== "me" && <button className="icon-button small-icon-button" aria-label={`Remove ${personName(data, id)} from group`} onClick={() => onRemoveMember(group, id)}><Icon name="close" size={14} /></button>}</div>; })}</div>
        <p className="helper-note">Positive amounts are owed to that member; negative amounts are what they owe.</p>
      </article>
      <article className="panel group-budget-panel"><div className="panel-head"><div><p className="eyebrow">GROUP SPENDING</p><h2>Budget check-in</h2></div><span className="group-emoji" style={{ background: group.color }}>{group.emoji}</span></div><div className="budget-big-number">{formatRupees(spent)}<small> spent together</small></div>{budget ? <><div className="progress-track"><div className={`progress-fill ${percent >= 100 ? "over-budget" : ""}`} style={{ width: `${percent}%` }} /></div><div className="budget-caption"><span>{percent}% of {formatRupees(budget)} budget</span><strong>{formatRupees(Math.max(0, budget - spent))} left</strong></div></> : <p className="muted-copy">Set a group budget from the Trip Planner or Settings.</p>}<div className="simplify-note"><Icon name="sparkle" size={16} /><span><strong>Clearer settle-ups</strong><small>{groupTransfers.length ? `${groupTransfers.length} suggested payment${groupTransfers.length === 1 ? "" : "s"} can square up this group.` : "Everyone is squared away."}</small></span></div></article>
    </section>
    <section className="panel"><div className="panel-head"><div><p className="eyebrow">THE LEDGER</p><h2>Group expenses</h2></div><button className="button button-outline button-small" onClick={onDeleteGroup}><Icon name="trash" size={15} /> Delete group</button></div><div className="activity-list">{groupExpenses.length ? groupExpenses.map((expense) => <ActivityRow key={expense.id} expense={expense} data={data} onEdit={onEditExpense} onDelete={onDeleteExpense} />) : <p className="muted-copy padded-copy">No expenses in this group yet. Add the first one to get started.</p>}</div></section>
  </>;
}

export function ExpensesPage({ data, onAddExpense, onSmartBill, onEditExpense, onDeleteExpense }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [group, setGroup] = useState("all");
  const rows = [...data.expenses].sort((a, b) => b.date.localeCompare(a.date)).filter((expense) => {
    const text = `${expense.title} ${expense.category} ${personName(data, expense.payerId)} ${data.groups.find((item) => item.id === expense.groupId)?.name || ""}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (category === "all" || expense.category === category) && (group === "all" || expense.groupId === group);
  });
  return <>
    <PageTitle eyebrow="THE PAPER TRAIL" title="Expenses" subtitle="Every shared little thing, in one tidy ledger." action={<div className="title-actions"><button className="button button-quiet hide-mobile" onClick={onSmartBill}><Icon name="upload" /> Split a bill</button><button className="button button-primary" onClick={onAddExpense} data-testid="add-expense"><Icon name="plus" /> Add expense</button></div>} />
    <div className="toolbar-panel expenses-toolbar"><label className="search-box"><Icon name="search" /><input aria-label="Search expenses" placeholder="Search expenses, people, groups..." value={query} onChange={(event) => setQuery(event.target.value)} data-testid="expense-search" /></label><label className="filter-select"><Icon name="filter" /><select aria-label="Filter category" value={category} onChange={(event) => setCategory(event.target.value)} data-testid="category-filter"><option value="all">All categories</option>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label><label className="filter-select"><Icon name="groups" /><select aria-label="Filter group" value={group} onChange={(event) => setGroup(event.target.value)} data-testid="group-filter"><option value="all">All groups</option>{data.groups.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
    <section className="panel expense-table-panel"><div className="table-heading"><span>Description</span><span>Group</span><span>Paid by</span><span>Date</span><span>Amount</span><span>Actions</span></div><div className="expense-table" data-testid="expense-list">{rows.length ? rows.map((expense) => <div className="expense-table-row" key={expense.id} data-testid={`expense-row-${expense.id}`}>
      <div className="expense-table-title"><span className="category-icon"><Icon name={expense.category === "Travel" ? "trip" : expense.category === "Shopping" ? "wallet" : "expense"} size={16} /></span><span><strong>{expense.title}</strong><small>{expense.category} · {expense.participantIds.length} people</small></span></div>
      <span className="table-muted">{data.groups.find((item) => item.id === expense.groupId)?.name || "Friends"}</span><span className="table-muted">{expense.payerId === "me" ? "You" : personName(data, expense.payerId).split(" ")[0]}</span><span className="table-muted">{dateLabel(expense.date)}</span><strong className="table-amount">{formatRupees(expense.amountPaise)}</strong><span className="table-actions"><button className="icon-button small-icon-button" aria-label={`Edit ${expense.title}`} data-testid={`edit-${expense.id}`} onClick={() => onEditExpense(expense)}><Icon name="edit" size={15} /></button><button className="icon-button small-icon-button danger-hover" aria-label={`Delete ${expense.title}`} data-testid={`delete-${expense.id}`} onClick={() => onDeleteExpense(expense)}><Icon name="trash" size={15} /></button></span>
    </div>) : <div className="table-empty"><Icon name="search" /><strong>No matching expenses</strong><p>Try clearing a filter or searching another phrase.</p></div>}</div><footer className="table-footer"><span>Showing {rows.length} of {data.expenses.length} expenses</span><span>Amounts in Indian rupees</span></footer></section>
    <section className="info-strip"><span className="info-strip-icon"><Icon name="wallet" /></span><p><strong>Simple, transparent splits.</strong> Each expense is saved in paise, and your balances are recalculated from the ledger every time.</p></section>
  </>;
}

export function SettlementsPage({ data, people, groupFilter, onGroupFilter, transfers, history, onRecord }) {
  return <>
    <PageTitle eyebrow="CLOSE THE LOOP" title="Settle up" subtitle="Make the last step feel just as easy as the first." action={<label className="filter-select settle-group-select"><Icon name="groups" /><select aria-label="Settlement group" value={groupFilter} onChange={(event) => onGroupFilter(event.target.value)} data-testid="settle-group-filter"><option value="all">All balances</option>{data.groups.map((group) => <option value={group.id} key={group.id}>{group.name}</option>)}</select></label>} />
    <section className="settle-intro-card"><div className="settle-intro-art"><span>₹</span><i /><i /><i /></div><div><p className="eyebrow">SMART SETTLEMENTS</p><h2>Fewer transfers. More time together.</h2><p>PayMitra nets each person's balance and suggests a practical set of payments to bring the group to zero.</p></div><span className="settle-intro-count"><strong>{transfers.length}</strong><small>payments to settle</small></span></section>
    <section className="panel"><div className="panel-head"><div><p className="eyebrow">WHO PAYS WHOM</p><h2>Suggested payments</h2></div><span className="count-pill">{transfers.length}</span></div>
      {transfers.length ? <div className="transfer-list">{transfers.map((transfer, index) => <div className="transfer-card" key={`${transfer.fromId}-${transfer.toId}-${index}`} data-testid={`transfer-${transfer.fromId}-${transfer.toId}`}><span className="transfer-order">{String(index + 1).padStart(2, "0")}</span><Avatar person={people.find((person) => person.id === transfer.fromId)} /><span className="transfer-main"><strong>{transfer.fromId === "me" ? "You" : personName(data, transfer.fromId)}</strong><small>pays</small><strong>{transfer.toId === "me" ? "you" : personName(data, transfer.toId)}</strong></span><span className="transfer-amount">{formatRupees(transfer.amountPaise)}</span><button className="button button-primary button-small" onClick={() => onRecord(transfer)} data-testid={`record-transfer-${transfer.fromId}-${transfer.toId}`}>Record</button></div>)}</div> : <div className="empty-inline empty-settle"><span className="empty-icon"><Icon name="check" /></span><strong>No payments needed</strong><p>Everyone's balances are looking good.</p></div>}
    </section>
    <section className="panel"><div className="panel-head"><div><p className="eyebrow">RECORDED IN PAYMITRA</p><h2>Settlement history</h2></div><span className="count-pill">{history.length}</span></div>{history.length ? <div className="activity-list">{history.map((payment) => <div className="activity-row settlement-history-row" key={payment.id}><span className="settlement-history-icon"><Icon name="check" size={16} /></span><div className="activity-description"><strong>{payment.fromId === "me" ? "You" : personName(data, payment.fromId)} paid {payment.toId === "me" ? "you" : personName(data, payment.toId)}</strong><span>{payment.note || "Recorded settlement"} · {dateLabel(payment.date)}{payment.groupId ? ` · ${data.groups.find((group) => group.id === payment.groupId)?.name || "Group"}` : ""}</span></div><strong className="activity-amount">{formatRupees(payment.amountPaise)}</strong></div>)}</div> : <p className="muted-copy padded-copy">Recorded payments will show up here. This demo does not move real money.</p>}</section>
    <p className="demo-notice"><Icon name="wallet" size={15} /> Simulated only — PayMitra does not connect to banks or move money.</p>
  </>;
}

export function InsightsPage({ data }) {
  const categoryTotals = useMemo(() => {
    const totals = new Map();
    data.expenses.forEach((expense) => totals.set(expense.category, (totals.get(expense.category) || 0) + expense.amountPaise));
    return [...totals].sort((a, b) => b[1] - a[1]);
  }, [data.expenses]);
  const total = categoryTotals.reduce((sum, [, amount]) => sum + amount, 0);
  const totalMonth = currentMonthTotal(data.expenses);
  const colors = ["#0f6245", "#78bd9d", "#d9a877", "#9b9bd1", "#d27d78", "#b1c9a5", "#7896ad", "#d4d9d3"];
  let running = 0;
  const gradient = categoryTotals.length ? `conic-gradient(${categoryTotals.map(([, amount], index) => { const start = running / Math.max(1, total) * 100; running += amount; const end = running / Math.max(1, total) * 100; return `${colors[index % colors.length]} ${start}% ${end}%`; }).join(", ")})` : "conic-gradient(#e8eee9 0 100%)";
  const previousMonths = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(); date.setMonth(date.getMonth() - (5 - index));
    const monthExpenses = data.expenses.filter((expense) => { const itemDate = new Date(`${expense.date}T12:00:00`); return itemDate.getMonth() === date.getMonth() && itemDate.getFullYear() === date.getFullYear(); });
    return { label: date.toLocaleDateString("en-IN", { month: "short" }), amount: monthExpenses.reduce((sum, expense) => sum + expense.amountPaise, 0) };
  });
  const maxMonth = Math.max(1, ...previousMonths.map((month) => month.amount));
  return <>
    <PageTitle eyebrow="SMALL TRENDS, BIG PICTURE" title="Insights" subtitle="A clear look at the way your circle spends." action={<span className="period-pill"><Icon name="calendar" size={15} /> Last 6 months</span>} />
    <section className="insights-stats"><StatCard label="Shared spending" value={formatRupees(total)} note="All recorded expenses" icon="expense" testId="insight-spend" /><StatCard label="This month" value={formatRupees(totalMonth)} note={new Date().toLocaleDateString("en-IN", { month: "long" })} icon="calendar" tone="sand" /><StatCard label="Top category" value={categoryTotals[0]?.[0] || "—"} note={categoryTotals[0] ? formatRupees(categoryTotals[0][1]) : "No expenses yet"} icon="sparkle" tone="lavender" /><StatCard label="Avg. per expense" value={formatRupees(data.expenses.length ? Math.round(total / data.expenses.length) : 0)} note={`${data.expenses.length} shared entries`} icon="insights" tone="rose" /></section>
    <section className="insights-grid"><article className="panel category-insight"><div className="panel-head"><div><p className="eyebrow">WHERE IT GOES</p><h2>Category breakdown</h2></div></div><div className="donut-layout"><div className="donut-chart" style={{ background: gradient }}><span><strong>{formatRupees(total, true)}</strong><small>Total spend</small></span></div><div className="donut-legend">{categoryTotals.slice(0, 6).map(([category, amount], index) => <div className="legend-row" key={category}><i style={{ background: colors[index % colors.length] }} /><span>{category}</span><strong>{formatRupees(amount)}</strong></div>)}</div></div></article>
      <article className="panel trend-insight"><div className="panel-head"><div><p className="eyebrow">MONTH OVER MONTH</p><h2>Spending trend</h2></div><span className="trend-tag"><Icon name="insights" size={14} /> 6 months</span></div><div className="trend-chart">{previousMonths.map((month, index) => <div className="trend-column" key={`${month.label}-${index}`}><strong>{month.amount ? formatRupees(month.amount, true) : ""}</strong><span className="trend-bar-shell"><i style={{ height: `${month.amount ? Math.max(5, month.amount / maxMonth * 100) : 2}%` }} /></span><small>{month.label}</small></div>)}</div><p className="helper-note">Only demo expenses saved in this browser are included.</p></article></section>
    <section className="panel"><div className="panel-head"><div><p className="eyebrow">BY PERSON</p><h2>Shared spend in your circle</h2></div></div><div className="person-spend-list">{[data.user, ...data.friends.filter((friend) => friend.active !== false)].map((person) => { const paid = data.expenses.filter((expense) => expense.payerId === person.id).reduce((sum, expense) => sum + expense.amountPaise, 0); return <div className="person-spend-row" key={person.id}><Avatar person={person} size="sm" /><span>{person.id === "me" ? "You" : person.name}</span><div className="bar-track"><i className="bar-fill" style={{ width: `${total ? Math.max(3, paid / total * 100) : 0}%` }} /></div><strong>{formatRupees(paid)}</strong></div>; })}</div></section>
  </>;
}

export function TripPlannerPage({ data, onSaveTrip, onAddExpense }) {
  const [name, setName] = useState(data.trip.name);
  const [groupId, setGroupId] = useState(data.trip.groupId || "");
  const [budget, setBudget] = useState((data.trip.budgetPaise / 100).toFixed(2));
  const [participantIds, setParticipantIds] = useState(data.trip.participantIds || []);
  const group = data.groups.find((item) => item.id === groupId);
  const expenseRows = data.expenses.filter((expense) => expense.groupId === groupId);
  const spent = expenseRows.reduce((sum, expense) => sum + expense.amountPaise, 0);
  const budgetPaise = Math.round(Number(budget || 0) * 100);
  const percent = budgetPaise ? Math.min(100, Math.round(spent / budgetPaise * 100)) : 0;
  const perPerson = participantIds.length ? Math.ceil(spent / participantIds.length) : 0;
  const categories = ["Accommodation", "Food & Drinks", "Travel", "Other"];
  const save = (event) => { event.preventDefault(); if (!name.trim() || !groupId || budgetPaise < 0) return; onSaveTrip({ name: name.trim(), groupId, budgetPaise, participantIds }); };
  const changeGroup = (id) => { setGroupId(id); const selected = data.groups.find((item) => item.id === id); setParticipantIds(selected?.memberIds || []); };
  return <>
    <PageTitle eyebrow="PLAN THE GOOD PART" title="Trip planner" subtitle="Give the itinerary a budget before the memories begin." action={<button className="button button-primary" onClick={() => onAddExpense(groupId, participantIds, "Travel")} data-testid="trip-add-expense"><Icon name="plus" /> Add trip expense</button>} />
    <section className="trip-hero"><div className="trip-hero-copy"><span className="trip-hero-icon">✦</span><p className="eyebrow">YOUR NEXT ADVENTURE</p><h2>{name || "A trip worth remembering"}</h2><p>Track the shared bits of the journey without turning the group chat into a spreadsheet.</p><div className="trip-hero-meta"><span><Icon name="groups" size={15} /> {participantIds.length} travellers</span><span><Icon name="expense" size={15} /> {expenseRows.length} expenses</span></div></div><div className="trip-hero-balance"><span>Trip budget</span><strong>{formatRupees(budgetPaise)}</strong><div className="trip-progress"><i style={{ width: `${percent}%` }} /></div><small>{formatRupees(spent)} spent · {formatRupees(Math.max(0, budgetPaise - spent))} left</small><div className="trip-people-chips">{participantIds.slice(0, 5).map((id) => <Avatar key={id} person={personInfo(data, id)} size="sm" />)}</div></div></section>
    <section className="trip-grid"><article className="panel trip-setup-panel"><div className="panel-head"><div><p className="eyebrow">THE PLAN</p><h2>Trip details</h2></div><span className="count-pill">Editable</span></div><form className="stacked-form" onSubmit={save}><label className="field">Trip name<input value={name} onChange={(event) => setName(event.target.value)} aria-label="Trip name" data-testid="trip-name" /></label><label className="field">Expense group<select value={groupId} onChange={(event) => changeGroup(event.target.value)} aria-label="Trip group" data-testid="trip-group">{data.groups.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="field">Total trip budget<div className="input-affix"><span>₹</span><input inputMode="decimal" value={budget} onChange={(event) => setBudget(event.target.value)} aria-label="Trip budget" data-testid="trip-budget" /></div></label><div className="field"><span>Travellers</span><div className="mini-participants">{(group?.memberIds || []).map((id) => <label key={id} className={participantIds.includes(id) ? "checked" : ""}><input type="checkbox" checked={participantIds.includes(id)} onChange={() => setParticipantIds((current) => current.includes(id) ? current.filter((personId) => personId !== id) : [...current, id])} />{id === "me" ? "You" : personName(data, id)}</label>)}</div></div><button className="button button-primary" type="submit" data-testid="save-trip">Save trip plan <Icon name="check" /></button></form></article>
      <article className="panel trip-breakdown-panel"><div className="panel-head"><div><p className="eyebrow">TRIP SPEND</p><h2>Where it went</h2></div><span className="trip-spend-total">{formatRupees(spent)}</span></div><div className="trip-category-list">{categories.map((category) => { const amount = expenseRows.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amountPaise, 0); return <div className="trip-category-row" key={category}><span className="category-icon"><Icon name={category === "Travel" ? "trip" : category === "Accommodation" ? "groups" : "expense"} size={15} /></span><span>{category}</span><strong>{formatRupees(amount)}</strong></div>; })}</div><div className="trip-share-card"><span><small>Estimated spend per traveller</small><strong>{formatRupees(perPerson)}</strong></span><span className="trip-share-avatar">÷ {Math.max(1, participantIds.length)}</span></div><p className="helper-note">Estimate only; actual shares come from each expense's split settings.</p></article></section>
    <section className="panel"><div className="panel-head"><div><p className="eyebrow">PACKING THE LEDGER</p><h2>Trip expenses</h2></div><button className="text-button" onClick={() => onAddExpense(groupId, participantIds, "Accommodation")}><Icon name="plus" size={15} /> Add expense</button></div><div className="activity-list">{expenseRows.length ? expenseRows.map((expense) => <ActivityRow key={expense.id} expense={expense} data={data} onEdit={() => {}} onDelete={() => {}} compact />) : <p className="muted-copy padded-copy">No trip expenses yet.</p>}</div></section>
  </>;
}

export function SettingsPage({ data, onSaveProfile, onSaveBudget, onSaveGroupBudget, onReset }) {
  const [name, setName] = useState(data.user.name);
  const [monthly, setMonthly] = useState((data.budgets.monthlyPaise / 100).toFixed(2));
  const [groupBudgets, setGroupBudgets] = useState(Object.fromEntries(data.groups.map((group) => [group.id, ((data.budgets.groupPaise[group.id] || 0) / 100).toFixed(2)])));
  return <>
    <PageTitle eyebrow="YOUR PAYMITRA" title="Settings" subtitle="A few details to make this demo feel like yours." />
    <div className="settings-layout"><section className="panel settings-card"><div className="panel-head"><div><p className="eyebrow">PROFILE</p><h2>Your demo profile</h2></div><Avatar person={{ ...data.user, name }} size="lg" /></div><form className="stacked-form" onSubmit={(event) => { event.preventDefault(); onSaveProfile(name); }}><label className="field">Display name<input value={name} onChange={(event) => setName(event.target.value)} aria-label="Display name" data-testid="profile-name" /></label><label className="field">Currency<span className="static-setting">🇮🇳 Indian rupee (INR)</span></label><button className="button button-primary" type="submit" data-testid="save-profile">Save profile</button></form></section>
      <section className="panel settings-card"><div className="panel-head"><div><p className="eyebrow">SPENDING GUARDRAIL</p><h2>Monthly budget</h2></div><span className="setting-icon"><Icon name="wallet" /></span></div><form className="stacked-form" onSubmit={(event) => { event.preventDefault(); onSaveBudget(Math.round(Number(monthly || 0) * 100)); }}><label className="field">Budget for this month<div className="input-affix"><span>₹</span><input inputMode="decimal" value={monthly} onChange={(event) => setMonthly(event.target.value)} aria-label="Monthly budget" data-testid="monthly-budget" /></div></label><p className="helper-note">Your dashboard progress updates as soon as you save.</p><button className="button button-primary" type="submit" data-testid="save-budget">Save budget</button></form></section>
      <section className="panel settings-card settings-card-wide"><div className="panel-head"><div><p className="eyebrow">GROUP PLANS</p><h2>Group budgets</h2></div></div><div className="group-budget-settings">{data.groups.map((group) => <label className="group-budget-row" key={group.id}><span className="group-emoji" style={{ background: group.color }}>{group.emoji}</span><span>{group.name}</span><div className="input-affix input-affix-small"><span>₹</span><input inputMode="decimal" aria-label={`${group.name} budget`} value={groupBudgets[group.id] || "0.00"} onChange={(event) => setGroupBudgets((current) => ({ ...current, [group.id]: event.target.value }))} data-testid={`group-budget-${group.id}`} /></div><button className="text-button" onClick={() => onSaveGroupBudget(group.id, Math.round(Number(groupBudgets[group.id] || 0) * 100))} type="button">Save</button></label>)}</div></section>
      <section className="panel settings-card settings-card-wide reset-card"><div><p className="eyebrow">START FRESH</p><h2>Reset demo data</h2><p>Restore the sample friends, groups, expenses, budgets, and trip plan in this browser.</p></div><button className="button button-outline" onClick={onReset} data-testid="reset-demo">Reset demo data</button></section></div>
    <p className="demo-notice"><Icon name="wallet" size={15} /> Your data stays in this browser's LocalStorage. PayMitra has no account system or backend.</p>
  </>;
}

export function EmptyState({ icon = "expense", title, body, action, actionLabel }) {
  return <div className="empty-state"><span className="empty-state-icon"><Icon name={icon} size={24} /></span><h2>{title}</h2><p>{body}</p>{action && <button className="button button-outline" onClick={action}>{actionLabel || "Get started"}</button>}</div>;
}
