// Sample workspace data so every screen renders. Replace with your live data source.
export const LEAD_STATUSES = [
  "new", "contacted", "interested", "follow_up", "quotation_sent", "proposal", "negotiation",
  "pending_payment", "won", "closed", "converted", "not_able_to_contact", "not_interested",
  "lost", "dnp", "rejected",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type Priority = "low" | "medium" | "high";

export const STATUS_META: Record<LeadStatus, { label: string; tone: string }> = {
  new: { label: "New", tone: "info" },
  contacted: { label: "Contacted", tone: "info" },
  interested: { label: "Interested", tone: "primary" },
  follow_up: { label: "Follow up", tone: "warning" },
  quotation_sent: { label: "Quotation sent", tone: "violet" },
  proposal: { label: "Proposal", tone: "violet" },
  negotiation: { label: "Negotiation", tone: "violet" },
  pending_payment: { label: "Pending payment", tone: "warning" },
  won: { label: "Won", tone: "success" },
  closed: { label: "Closed", tone: "success" },
  converted: { label: "Converted", tone: "success" },
  not_able_to_contact: { label: "Not able to contact", tone: "subtle" },
  not_interested: { label: "Not interested", tone: "subtle" },
  lost: { label: "Lost", tone: "destructive" },
  dnp: { label: "DNP", tone: "subtle" },
  rejected: { label: "Rejected", tone: "destructive" },
};

import type { Lead } from '../types';
export type { Lead };

export const REPS = ["Rajesh Sharma", "Sales Executive"];
const companies = ["Tata Elxsi", "Infosys BPM", "Zoho Corp", "Freshworks", "Mahindra Logistics", "Razorpay", "Ather Energy", "Nykaa", "Dunzo", "Swiggy Instamart", "Ola Electric", "Groww", "Cred", "Lenskart", "Urban Company", "Meesho", "PhonePe", "Zerodha", "BigBasket", "Delhivery", "Byju's", "upGrad"];
const reqs = ["ERP integration", "Cloud migration", "Custom CRM rollout", "Mobile app build", "Data warehouse", "Security audit", "AI chatbot", "Payment gateway", "HRMS suite"];
const names = ["Vikram Rao", "Ananya Gupta", "Rohan Das", "Meera Pillai", "Aditya Kulkarni", "Kavya Reddy", "Nikhil Jain", "Isha Malhotra"];
const desig = ["CTO", "VP Engineering", "Head of IT", "Procurement Lead", "Founder", "Director Ops"];
const cats = ["Enterprise", "SMB", "Government", "Startup"];
const statusCycle: LeadStatus[] = ["new", "interested", "follow_up", "quotation_sent", "won", "pending_payment", "lost", "not_able_to_contact", "interested", "new", "won", "dnp", "follow_up", "not_interested"];

export const LEADS: Lead[] = companies.map((c, i) => ({
  id: `L-${1040 + i}`, sno: i + 1, company: c, requirement: reqs[i % reqs.length],
  client: names[i % names.length], designation: desig[i % desig.length],
  phone: `+91 98${(45012300 + i * 7919).toString().slice(0, 8)}`,
  email: `${names[i % names.length].split(" ")[0].toLowerCase()}@${c.toLowerCase().replace(/[^a-z]/g, "")}.com`,
  category: cats[i % cats.length], value: [180000, 420000, 95000, 1250000, 640000, 310000, 860000][i % 7],
  date: `2026-${String(9 + (i % 2)).padStart(2, "0")}-${String(1 + ((i * 3) % 27)).padStart(2, "0")}`,
  status: statusCycle[i % statusCycle.length], priority: (["high", "medium", "low"] as Priority[])[i % 3],
  rep: i % 6 === 5 ? null : REPS[i % REPS.length],
}));

export const REVENUE_TREND = [
  { m: "May", revenue: 2.1, target: 3 }, { m: "Jun", revenue: 2.8, target: 3 },
  { m: "Jul", revenue: 3.4, target: 3.5 }, { m: "Aug", revenue: 3.1, target: 3.5 },
  { m: "Sep", revenue: 4.2, target: 4 }, { m: "Oct", revenue: 3.6, target: 4.5 },
];

export const TEAM = REPS.map((name, i) => {
  const target = [1800000, 1500000, 1600000, 1200000, 1400000][i];
  const achieved = [1640000, 1580000, 980000, 1090000, 620000][i];
  return { name, target, achieved, leads: [42, 38, 31, 27, 22][i], won: [11, 12, 6, 8, 4][i], calls: [128, 141, 96, 88, 61][i] };
});

export const ACTIVITY = [
  { type: "call", who: "Priya Nair", what: "Called Vikram Rao at Razorpay", meta: "Discussed integration scope, 14 min", t: "09:42" },
  { type: "email", who: "Arjun Mehta", what: "Sent quotation to Tata Elxsi", meta: "Q-2291 · ₹12.5L", t: "09:15" },
  { type: "won", who: "Sneha Iyer", what: "Marked Freshworks as won", meta: "₹6.4L · Cloud migration", t: "Yesterday" },
  { type: "whatsapp", who: "Rahul Verma", what: "WhatsApp follow-up with Ather Energy", meta: "Awaiting PO", t: "Yesterday" },
  { type: "meeting", who: "Karan Shah", what: "Meeting booked with Groww", meta: "Fri, 11:00 · Demo", t: "Oct 6" },
  { type: "note", who: "Priya Nair", what: "Note added on Zerodha", meta: "Budget approved for Q4", t: "Oct 6" },
];

export const QUOTA_HISTORY = [
  { period: "May 2026", type: "monthly", target: 1200000, achieved: 980000 },
  { period: "Jun 2026", type: "monthly", target: 1200000, achieved: 1310000 },
  { period: "Jul 2026", type: "monthly", target: 1400000, achieved: 1260000 },
  { period: "Aug 2026", type: "monthly", target: 1400000, achieved: 1520000 },
  { period: "Sep 2026", type: "monthly", target: 1500000, achieved: 1580000 },
  { period: "Oct 2026", type: "monthly", target: 1500000, achieved: 640000 },
];

export const inr = (n: number) =>
  n >= 10000000 ? `₹${(n / 10000000).toFixed(2)}Cr` : n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString("en-IN")}`;
