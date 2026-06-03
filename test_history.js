const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('history.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously" });
const window = dom.window;

// Mock localStorage
let store = {
  "r-pizza-all-orders": JSON.stringify([{
    id: "RPZ-20260603-12345",
    createdAt: new Date().toISOString(),
    details: { name: "Test", phone: "123", service: "Delivery" },
    status: "Pending",
    total: 50000,
    cart: [{ name: "Margherita", qty: 250, price: 200 }]
  }])
};

window.localStorage.getItem = (key) => store[key] || null;
window.localStorage.setItem = (key, val) => { store[key] = val; };

// Trigger load
window.document.dispatchEvent(new window.Event("DOMContentLoaded"));

setTimeout(() => {
  console.log("Empty CTA hidden:", window.document.getElementById("empty-cta").hidden);
  console.log("List HTML length:", window.document.getElementById("history-list").innerHTML.length);
  const errs = window.errors || [];
  console.log("Errors:", errs);
}, 500);
