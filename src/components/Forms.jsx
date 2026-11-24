import React, { useEffect, useMemo, useState } from "react";
import { Avatar, Icon } from "./Icons.jsx";
import { Modal } from "./Modal.jsx";
import { formatRupees, getOutstandingTransfer, parseRupees, splitTotal } from "../lib/finance.js";

const initialsFor = (name) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
const palette = ["#f3e1d5", "#dce7f8", "#f4dfeb", "#e9e4fa", "#e1eee7", "#fae8ce", "#d9efe5"];

export function AddFriendDialog({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  return <Modal title="Add a friend" eyebrow="GROW YOUR CIRCLE" onClose={onClose} testId="friend-dialog">
    <form className="stacked-form modal-form" onSubmit={(event) => { event.preventDefault(); if (!name.trim()) return setError("Add your friend's name to continue."); onSave({ id: `friend-${Date.now()}`, name: name.trim(), initials: initialsFor(name), color: palette[name.trim().length % palette.length], active: true }); }}>
      <div className="friend-form-intro"><span className="friend-form-avatar">{initialsFor(name) || <Icon name="friends" />}</span><p>Keep your shared plans and little spends in one place.</p></div>
      <label className="field">Friend's name<input autoFocus placeholder="e.g. Priya Kapoor" value={name} onChange={(event) => setName(event.target.value)} data-testid="friend-name" /></label>
      <p className="helper-note">This demo stores names only. No contact details are needed.</p>
      {error && <p className="form-error" role="alert" data-testid="form-error">{error}</p>}
      <div className="modal-footer modal-footer-inline"><button className="button button-quiet" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit" data-testid="save-friend">Add friend <Icon name="plus" size={15} /></button></div>
    </form>
  </Modal>;
}

export function CreateGroupDialog({ data, onClose, onSave }) {
  const [name, setName] = useState("");
  const [memberIds, setMemberIds] = useState(["me"]);
  const [emoji, setEmoji] = useState("🌿");
  const [error, setError] = useState("");
  const icons = ["🌿", "🏡", "✈️", "🎓", "🍜", "☕", "🎉", "🌊"];
  const people = [data.user, ...data.friends.filter((friend) => friend.active !== false)];
  return <Modal title="Create a group" eyebrow="BETTER TOGETHER" onClose={onClose} testId="group-dialog">
    <form className="stacked-form modal-form" onSubmit={(event) => { event.preventDefault(); if (!name.trim()) return setError("Give your group a name."); if (memberIds.length < 2) return setError("Choose at least one friend for the group."); onSave({ id: `group-${Date.now()}`, name: name.trim(), emoji, color: palette[memberIds.length % palette.length], memberIds }); }}>
      <label className="field">Group name<input autoFocus placeholder="e.g. Saturday supper club" value={name} onChange={(event) => setName(event.target.value)} data-testid="group-name" /></label>
      <fieldset className="emoji-picker"><legend>Pick a little group mark</legend>{icons.map((item) => <button type="button" className={emoji === item ? "selected" : ""} key={item} onClick={() => setEmoji(item)} aria-label={`Choose ${item}`}>{item}</button>)}</fieldset>
      <fieldset className="member-picker"><legend>Invite members <small>{memberIds.length} selected</small></legend>{people.map((person) => <label className="member-picker-row" key={person.id}><input type="checkbox" checked={memberIds.includes(person.id)} onChange={() => setMemberIds((current) => current.includes(person.id) ? current.filter((id) => id !== person.id) : [...current, person.id])} /> <Avatar person={person} size="sm" /><span>{person.id === "me" ? `${person.name} (you)` : person.name}</span></label>)}</fieldset>
      {error && <p className="form-error" role="alert" data-testid="form-error">{error}</p>}
      <div className="modal-footer modal-footer-inline"><button className="button button-quiet" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit" data-testid="save-group">Create group <Icon name="plus" size={15} /></button></div>
    </form>
  </Modal>;
}

export function AddGroupMemberDialog({ data, group, onClose, onSave }) {
  const [memberId, setMemberId] = useState("");
  const eligible = data.friends.filter((friend) => friend.active !== false && !group.memberIds.includes(friend.id));
  return <Modal title="Add a member" eyebrow={group.name.toUpperCase()} onClose={onClose} testId="group-member-dialog">
    <form className="stacked-form modal-form" onSubmit={(event) => { event.preventDefault(); if (memberId) onSave(memberId); }}>
      {eligible.length ? <label className="field">Choose a friend<select autoFocus value={memberId} onChange={(event) => setMemberId(event.target.value)} data-testid="group-member-select"><option value="">Select someone</option>{eligible.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label> : <p className="empty-inline">Everyone in your friend list is already in this group.</p>}
      <div className="modal-footer modal-footer-inline"><button className="button button-quiet" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit" disabled={!memberId}>Add to group <Icon name="plus" size={15} /></button></div>
    </form>
  </Modal>;
}

export function SettleDialog({ data, people, initialTransfer, groupId, onClose, onSave }) {
  const [fromId, setFromId] = useState(initialTransfer?.fromId || "me");
  const [toId, setToId] = useState(initialTransfer?.toId || data.friends.find((friend) => friend.active !== false)?.id || "");
  const [amount, setAmount] = useState(initialTransfer ? (initialTransfer.amountPaise / 100).toFixed(2) : "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const available = getOutstandingTransfer(data.expenses, data.settlements, people, fromId, toId, groupId === "all" ? null : groupId);
  const amountPaise = parseRupees(amount);
  const valid = amountPaise !== null && amountPaise > 0 && amountPaise <= available && fromId !== toId && available > 0;
  const activePeople = people.filter((person) => person.id === "me" || person.active !== false);
  const handleFrom = (value) => { setFromId(value); setAmount(""); setError(""); };
  const handleTo = (value) => { setToId(value); setAmount(""); setError(""); };
  return <Modal title="Record a settlement" eyebrow="A SIMULATED PAYMENT" onClose={onClose} testId="settlement-dialog">
    <form className="stacked-form modal-form" onSubmit={(event) => { event.preventDefault(); if (!valid) return setError(available <= 0 ? "There is no outstanding transfer between these people." : `Enter an amount up to ${formatRupees(available)}.`); onSave({ id: `settlement-${Date.now()}`, fromId, toId, amountPaise, date, note: note.trim(), groupId: groupId && groupId !== "all" ? groupId : null }); }}>
      <div className="settlement-direction"><label className="field">From<select value={fromId} onChange={(event) => handleFrom(event.target.value)} data-testid="settle-from">{activePeople.map((person) => <option key={person.id} value={person.id}>{person.id === "me" ? `${person.name} (you)` : person.name}</option>)}</select></label><span className="settlement-arrow"><Icon name="back" size={18} /></span><label className="field">To<select value={toId} onChange={(event) => handleTo(event.target.value)} data-testid="settle-to">{activePeople.map((person) => <option key={person.id} value={person.id}>{person.id === "me" ? `${person.name} (you)` : person.name}</option>)}</select></label></div>
      <div className="settle-limit-banner"><span><small>Outstanding suggestion</small><strong>{formatRupees(available)}</strong></span><span className="settle-limit-icon"><Icon name="settle" /></span></div>
      <label className="field">Settlement amount<div className="input-affix"><span>₹</span><input autoFocus inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" data-testid="settlement-amount" /></div></label>
      <div className="form-grid form-grid-two"><label className="field">Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} data-testid="settlement-date" /></label><label className="field">Note <small>Optional</small><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="e.g. UPI transfer" /></label></div>
      <p className="helper-note">This records a demo settlement only; it does not send money.</p>
      {error && <p className="form-error" role="alert" data-testid="settlement-error">{error}</p>}
      <div className="modal-footer modal-footer-inline"><button className="button button-quiet" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit" disabled={!valid} data-testid="save-settlement">Record settlement <Icon name="check" size={15} /></button></div>
    </form>
  </Modal>;
}

export function SmartBillDialog({ data, onClose, onUseDetails }) {
  const [title, setTitle] = useState("Dinner bill");
  const [groupId, setGroupId] = useState(data.groups[0]?.id || "");
  const [items, setItems] = useState([{ id: 1, title: "Main course", amount: "0.00" }]);
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const group = data.groups.find((item) => item.id === groupId);
  const total = items.reduce((sum, item) => sum + (parseRupees(item.amount) || 0), 0);
  useEffect(() => () => image?.url && URL.revokeObjectURL(image.url), [image]);
  const updateItem = (id, key, value) => setItems((current) => current.map((item) => item.id === id ? { ...item, [key]: value } : item));
  return <Modal title="Split a bill" eyebrow="SMART BILL SPLITTER · DEMO" onClose={onClose} size="lg" testId="bill-dialog">
    <div className="bill-form">
      <div className="bill-upload-area"><label className="bill-upload"><input type="file" accept="image/*" aria-label="Upload a sample bill image" data-testid="bill-image" onChange={(event) => { const file = event.target.files?.[0]; if (file) setImage({ name: file.name, url: URL.createObjectURL(file) }); }} /><span className="upload-circle"><Icon name="upload" size={20} /></span><strong>{image?.name || "Add a bill photo"}</strong><small>{image ? "Preview stays on this device" : "Optional · PNG, JPG, or WEBP"}</small></label>{image?.url && <img className="bill-preview" src={image.url} alt="Local bill preview" />}</div>
      <div className="bill-entry"><label className="field">Expense description<input value={title} onChange={(event) => setTitle(event.target.value)} data-testid="bill-title" /></label><label className="field">Group<select value={groupId} onChange={(event) => setGroupId(event.target.value)} data-testid="bill-group">{data.groups.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="bill-items-head"><strong>Enter bill items</strong><button type="button" className="text-button" onClick={() => setItems((current) => [...current, { id: Date.now(), title: "", amount: "0.00" }])}><Icon name="plus" size={14} /> Add item</button></div>{items.map((item, index) => <div className="bill-item-row" key={item.id}><label><span className="sr-only">Item {index + 1}</span><input placeholder="Item name" value={item.title} onChange={(event) => updateItem(item.id, "title", event.target.value)} /></label><label className="input-affix input-affix-small"><span>₹</span><input inputMode="decimal" aria-label={`Amount for item ${index + 1}`} value={item.amount} onChange={(event) => updateItem(item.id, "amount", event.target.value)} /></label><button className="icon-button small-icon-button" aria-label={`Remove item ${index + 1}`} onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}><Icon name="close" size={14} /></button></div>)}<div className="bill-total"><span>Bill total</span><strong>{formatRupees(total)}</strong></div></div>
      <div className="bill-note"><Icon name="sparkle" size={16} /><p><strong>Manual review, no OCR.</strong> PayMitra doesn't upload or scan your bill. Enter the items yourself, then review the total before adding it.</p></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-footer modal-footer-inline"><button className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" data-testid="use-bill-details" onClick={() => { if (!title.trim() || total <= 0) return setError("Add a description and at least one item amount greater than ₹0."); if (items.some((item) => !item.title.trim() || (parseRupees(item.amount) ?? -1) < 0)) return setError("Name each item and enter a valid amount."); onUseDetails({ title: title.trim(), amountPaise: total, groupId, participantIds: group?.memberIds || ["me"], category: "Food & Drinks" }); }}>Review & add expense <Icon name="arrow" size={15} /></button></div>
    </div>
  </Modal>;
}

export function ConfirmDialog({ title, body, confirmLabel = "Confirm", danger = false, onClose, onConfirm }) {
  return <Modal title={title} eyebrow="ARE YOU SURE?" onClose={onClose} size="sm">
    <div className="confirm-dialog"><p>{body}</p><div className="modal-footer modal-footer-inline"><button className="button button-quiet" onClick={onClose}>Keep it</button><button className={`button ${danger ? "button-danger" : "button-primary"}`} onClick={onConfirm}>{confirmLabel}</button></div></div>
  </Modal>;
}
