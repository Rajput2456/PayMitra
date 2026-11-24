import React, { useMemo, useState } from "react";
import { Avatar, Icon } from "./Icons.jsx";
import { Modal } from "./Modal.jsx";
import { CATEGORIES, equalSplit, formatRupees, parseRupees, splitByAmount, splitByPercent, splitTotal } from "../lib/finance.js";

const asRupeesText = (paise) => `${Math.floor(paise / 100)}.${String(paise % 100).padStart(2, "0")}`;
const balancedPercentages = (ids) => {
  const base = Math.floor(10_000 / Math.max(1, ids.length));
  const remainder = 10_000 - base * ids.length;
  return Object.fromEntries(ids.map((id, index) => [id, ((base + (index < remainder ? 1 : 0)) / 100).toFixed(2)]));
};

function initialForm(data, expense, defaultGroupId, defaultParticipantIds, defaultCategory) {
  const groupId = expense?.groupId || defaultGroupId || "";
  const group = data.groups.find((item) => item.id === groupId);
  const participantIds = expense?.participantIds || defaultParticipantIds || group?.memberIds || ["me", data.friends.find((friend) => friend.active !== false)?.id].filter(Boolean);
  const amountPaise = expense?.amountPaise ?? 0;
  const splitInputs = {};
  if (expense?.shares) {
    expense.shares.forEach(({ personId, amountPaise: value }) => { splitInputs[personId] = asRupeesText(value); });
  } else {
    equalSplit(amountPaise, participantIds).forEach(({ personId, amountPaise: value }) => { splitInputs[personId] = asRupeesText(value); });
  }
  return {
    title: expense?.title || "",
    amount: expense ? asRupeesText(amountPaise) : "",
    payerId: expense?.payerId || "me",
    date: expense?.date || new Date().toISOString().slice(0, 10),
    groupId,
    category: expense?.category || defaultCategory || "Food & Drinks",
    participantIds: [...participantIds],
    splitMethod: expense?.splitMethod || "equal",
    splitInputs,
    percentages: balancedPercentages(participantIds),
  };
}

export function ExpenseForm({ data, expense, defaultGroupId, defaultParticipantIds, defaultCategory, onSave, onClose }) {
  const [form, setForm] = useState(() => initialForm(data, expense, defaultGroupId, defaultParticipantIds, defaultCategory));
  const [error, setError] = useState("");
  const activeFriends = data.friends.filter((friend) => friend.active !== false);
  const people = [data.user, ...activeFriends];
  const personById = useMemo(() => Object.fromEntries(people.map((person) => [person.id, person])), [data.user, data.friends]);
  const amountPaise = parseRupees(form.amount);
  const selectedPeople = form.participantIds.map((id) => personById[id]).filter(Boolean);
  const customShares = form.splitMethod === "amount"
    ? splitByAmount(selectedPeople.map((person) => ({ personId: person.id, value: form.splitInputs[person.id] ?? "" })))
    : form.splitMethod === "percent"
      ? splitByPercent(amountPaise ?? 0, selectedPeople.map((person) => ({ personId: person.id, value: form.percentages[person.id] ?? "0" })))
      : amountPaise !== null && form.participantIds.length ? equalSplit(amountPaise, form.participantIds) : null;
  const shareTotal = customShares ? splitTotal(customShares) : null;
  const percentTotal = selectedPeople.reduce((sum, person) => sum + Math.round(Number(form.percentages[person.id] || 0) * 100), 0);
  const splitValid = form.splitMethod === "percent"
    ? percentTotal === 10_000 && !!customShares
    : !!customShares && shareTotal === amountPaise;

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const changeGroup = (groupId) => {
    const group = data.groups.find((item) => item.id === groupId);
    const nextIds = group?.memberIds || ["me", activeFriends[0]?.id].filter(Boolean);
    setForm((current) => ({
      ...current,
      groupId,
      participantIds: [...nextIds],
      splitMethod: "equal",
      splitInputs: Object.fromEntries(equalSplit(parseRupees(current.amount) || 0, nextIds).map((share) => [share.personId, asRupeesText(share.amountPaise)])),
      percentages: balancedPercentages(nextIds),
    }));
  };
  const toggleParticipant = (personId) => {
    setForm((current) => {
      const participantIds = current.participantIds.includes(personId)
        ? current.participantIds.filter((id) => id !== personId)
        : [...current.participantIds, personId];
      return {
        ...current,
        participantIds,
        splitInputs: { ...current.splitInputs, ...Object.fromEntries(equalSplit(parseRupees(current.amount) || 0, participantIds).map((share) => [share.personId, current.splitInputs[share.personId] ?? asRupeesText(share.amountPaise)])) },
        percentages: { ...balancedPercentages(participantIds), ...current.percentages },
      };
    });
  };
  const setAmount = (value) => {
    setForm((current) => {
      const nextPaise = parseRupees(value) || 0;
      const nextSplitInputs = Object.fromEntries(equalSplit(nextPaise, current.participantIds).map((share) => [share.personId, asRupeesText(share.amountPaise)]));
      return { ...current, amount: value, splitInputs: current.splitMethod === "amount" ? nextSplitInputs : current.splitInputs };
    });
  };

  const submit = (event) => {
    event.preventDefault();
    const total = parseRupees(form.amount);
    if (!form.title.trim()) return setError("Add a short description for this expense.");
    if (total === null || total <= 0) return setError("Enter an amount greater than ₹0.00.");
    if (!form.participantIds.length) return setError("Choose at least one person in the split.");
    if (!splitValid) return setError(form.splitMethod === "percent" ? "Percentages must add up to exactly 100%." : "Split amounts must add up to the expense total.");
    const shares = customShares;
    onSave({
      id: expense?.id || `exp-${Date.now()}`,
      title: form.title.trim(),
      amountPaise: total,
      payerId: form.payerId,
      date: form.date,
      category: form.category,
      groupId: form.groupId || null,
      participantIds: form.participantIds,
      shares,
      splitMethod: form.splitMethod,
      createdAt: expense?.createdAt || new Date().toISOString(),
    });
  };

  return (
    <Modal title={expense ? "Edit expense" : "Add an expense"} eyebrow={expense ? "UPDATE THE DETAILS" : "KEEP THE GROUP IN SYNC"} onClose={onClose} size="lg" testId="expense-dialog">
      <form className="expense-form" onSubmit={submit}>
        <div className="expense-form-main">
          <div className="form-grid form-grid-two">
            <label className="field field-wide">What was it for?
              <input autoFocus name="title" placeholder="e.g. Dinner at Mizu" value={form.title} onChange={(event) => setField("title", event.target.value)} data-testid="expense-title" />
            </label>
            <label className="field">Amount
              <div className="input-affix"><span>₹</span><input name="amount" inputMode="decimal" placeholder="0.00" value={form.amount} onChange={(event) => setAmount(event.target.value)} data-testid="expense-amount" /></div>
            </label>
            <label className="field">Paid by
              <select value={form.payerId} onChange={(event) => setField("payerId", event.target.value)} data-testid="expense-payer">
                {people.map((person) => <option value={person.id} key={person.id}>{person.id === "me" ? `${person.name} (you)` : person.name}</option>)}
              </select>
            </label>
            <label className="field">Date
              <input type="date" value={form.date} onChange={(event) => setField("date", event.target.value)} data-testid="expense-date" />
            </label>
            <label className="field">Group or friendship
              <select value={form.groupId} onChange={(event) => changeGroup(event.target.value)} data-testid="expense-group">
                <option value="">Just between friends</option>
                {data.groups.map((group) => <option key={group.id} value={group.id}>{group.emoji} {group.name}</option>)}
              </select>
            </label>
            <label className="field">Category
              <select value={form.category} onChange={(event) => setField("category", event.target.value)} data-testid="expense-category">
                {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
          </div>

          <section className="split-section">
            <div className="split-section-head">
              <div><p className="eyebrow">THE SPLIT</p><h3>Who shared this?</h3></div>
              <span className="split-total">Total <strong>{amountPaise && amountPaise > 0 ? formatRupees(amountPaise) : "₹0.00"}</strong></span>
            </div>
            <div className="participant-list">
              {people.map((person) => (
                <label className={`participant-option ${form.participantIds.includes(person.id) ? "selected" : ""}`} key={person.id}>
                  <input type="checkbox" checked={form.participantIds.includes(person.id)} onChange={() => toggleParticipant(person.id)} data-testid={`participant-${person.id}`} />
                  <Avatar person={person} size="sm" />
                  <span>{person.id === "me" ? "You" : person.name}</span>
                  {person.id === form.payerId && <small>paid</small>}
                </label>
              ))}
            </div>

            <div className="split-method-tabs" role="tablist" aria-label="Split method">
              {[{ id: "equal", label: "Equally" }, { id: "amount", label: "By amount" }, { id: "percent", label: "By %" }].map((method) => (
                <button type="button" role="tab" aria-selected={form.splitMethod === method.id} className={form.splitMethod === method.id ? "active" : ""} key={method.id} onClick={() => setField("splitMethod", method.id)} data-testid={`split-${method.id}`}>
                  {method.label}
                </button>
              ))}
            </div>
            {form.splitMethod === "equal" ? (
              <div className="split-preview" data-testid="equal-split-preview">
                {customShares?.map((share) => <div className="split-preview-row" key={share.personId}><span>{personById[share.personId]?.name || "Friend"}</span><strong>{formatRupees(share.amountPaise)}</strong></div>)}
                {!selectedPeople.length && <p className="muted-copy">Choose who shared the expense.</p>}
              </div>
            ) : form.splitMethod === "amount" ? (
              <div className="custom-split-list" data-testid="amount-split-fields">
                {selectedPeople.map((person) => <label className="custom-split-row" key={person.id}><span><Avatar person={person} size="sm" />{person.id === "me" ? "You" : person.name}</span><div className="input-affix input-affix-small"><span>₹</span><input aria-label={`Share for ${person.name}`} inputMode="decimal" value={form.splitInputs[person.id] ?? ""} onChange={(event) => setForm((current) => ({ ...current, splitInputs: { ...current.splitInputs, [person.id]: event.target.value } }))} data-testid={`share-${person.id}`} /></div></label>)}
              </div>
            ) : (
              <div className="custom-split-list" data-testid="percent-split-fields">
                {selectedPeople.map((person) => <label className="custom-split-row" key={person.id}><span><Avatar person={person} size="sm" />{person.id === "me" ? "You" : person.name}</span><div className="input-affix input-affix-small"><input aria-label={`Percentage for ${person.name}`} inputMode="decimal" value={form.percentages[person.id] ?? "0.00"} onChange={(event) => setForm((current) => ({ ...current, percentages: { ...current.percentages, [person.id]: event.target.value } }))} data-testid={`percent-${person.id}`} /><span>%</span></div></label>)}
              </div>
            )}
            <div className={`split-validation ${splitValid ? "valid" : "invalid"}`} aria-live="polite" data-testid="split-validation">
              <Icon name={splitValid ? "check" : "sparkle"} size={15} />
              {splitValid ? "Splits add up correctly" : form.splitMethod === "percent" ? `${(percentTotal / 100).toFixed(2)}% of 100% assigned` : amountPaise === null ? "Enter the expense amount to preview the split" : `${formatRupees(shareTotal ?? 0)} of ${formatRupees(amountPaise)}`}
            </div>
          </section>
        </div>
        <footer className="modal-footer">
          {error && <p className="form-error" role="alert" data-testid="form-error">{error}</p>}
          <div className="footer-actions"><button className="button button-quiet" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit" data-testid="save-expense">{expense ? "Save changes" : "Save expense"}<Icon name="arrow" size={15} /></button></div>
        </footer>
      </form>
    </Modal>
  );
}
