const form = document.getElementById("transaction-form");
const transactionList = document.getElementById("transaction-list");
const monthlyBudgetInput = document.getElementById("monthly-budget");

let transactions = JSON.parse(localStorage.getItem("moneyTrackTransactions")) || [];
let monthlyBudget = Number(localStorage.getItem("moneyTrackBudget")) || 50000;

document.getElementById("date").value = new Date().toISOString().slice(0, 10);
monthlyBudgetInput.value = monthlyBudget;

function formatMoney(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2
  }).format(amount);
}
function saveData() {
  localStorage.setItem("moneyTrackTransactions", JSON.stringify(transactions));
  localStorage.setItem("moneyTrackBudget", String(monthlyBudget));
}

function renderTransactions() {
  transactionList.innerHTML = "";

  if (transactions.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.className = "empty-message";
    cell.textContent = "No transactions yet. Add one above to get started.";
    row.appendChild(cell);
    transactionList.appendChild(row);
    return;
  }


  transactions.slice().reverse().forEach((transaction) => {
    const row = document.createElement("tr");
    const values = [
      transaction.description,
      transaction.category,
      transaction.date,
      transaction.type
    ];

    values.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    const amountCell = document.createElement("td");
    amountCell.textContent = (transaction.type === "income" ? "+" : "−") + formatMoney(transaction.amount);
    amountCell.className = transaction.type === "income" ? "income-text" : "expense-text";
    row.appendChild(amountCell);

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      transactions = transactions.filter((item) => item.id !== transaction.id);
      saveData();
      updateDashboard();
    });
    actionCell.appendChild(deleteButton);
    row.appendChild(actionCell);
    transactionList.appendChild(row);
  });
}

function updateDashboard() {
  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + item.amount, 0);

  const expenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + item.amount, 0);

  document.getElementById("total-income").textContent = formatMoney(income);
  document.getElementById("total-expenses").textContent = formatMoney(expenses);
  document.getElementById("current-balance").textContent = formatMoney(income - expenses);
  document.getElementById("budget-remaining").textContent = formatMoney(monthlyBudget - expenses);
  document.getElementById("budget-spent").textContent = formatMoney(expenses);
  document.getElementById("budget-total").textContent = formatMoney(monthlyBudget);

  const percentage = monthlyBudget > 0 ? (expenses / monthlyBudget) * 100 : (expenses > 0 ? 100 : 0);
  document.getElementById("budget-progress").style.width = Math.min(percentage, 100) + "%";

  const message = document.getElementById("budget-message");
  if (expenses > monthlyBudget) {
    message.textContent = "You have gone over your budget.";
    message.classList.add("warning");
  } else {
    message.textContent = "You are within your budget.";
    message.classList.remove("warning");
  }

  renderTransactions();
  renderCategories();
}

function renderCategories() {
  const categoryBreakdown = document.getElementById("category-breakdown");
  categoryBreakdown.innerHTML = "";

  const totals = {};
  transactions
    .filter((item) => item.type === "expense")
    .forEach((item) => {
      totals[item.category] = (totals[item.category] || 0) + item.amount;
    });

  const categories = Object.entries(totals);
  if (categories.length === 0) {
    const message = document.createElement("p");
    message.className = "panel empty-category";
    message.textContent = "Your expense categories will appear here when you add expenses.";
    categoryBreakdown.appendChild(message);
    return;
  }

  categories.sort((a, b) => b[1] - a[1]).forEach(([category, amount]) => {
    const card = document.createElement("div");
    card.className = "category-card";
    const name = document.createElement("p");
    name.textContent = category;
    const total = document.createElement("strong");
    total.textContent = formatMoney(amount);
    card.append(name, total);
    categoryBreakdown.appendChild(card);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const description = document.getElementById("description").value.trim();
  const amount = Number(document.getElementById("amount").value);
  const type = document.getElementById("transaction-type").value;
  const date = document.getElementById("date").value;
  const category = document.getElementById("category").value;

  if (!description || !date || !Number.isFinite(amount) || amount <= 0) {
    alert("Please enter a description, date, and amount greater than zero.");
    return;
  }

  transactions.push({
    id: Date.now(),
    description,
    amount,
    type,
    date,
    category
  });

  saveData();
  updateDashboard();
  form.reset();
  document.getElementById("date").value = new Date().toISOString().slice(0, 10);
});

document.getElementById("save-budget").addEventListener("click", () => {
  const newBudget = Number(monthlyBudgetInput.value);
  if (!Number.isFinite(newBudget) || newBudget < 0) {
    alert("Please enter a valid budget amount.");
    return;
  }
  monthlyBudget = newBudget;
  saveData();
  updateDashboard();
});

document.getElementById("clear-transactions").addEventListener("click", () => {
  if (transactions.length === 0) {
    alert("There are no transactions to clear.");
    return;
  }
  if (confirm("Are you sure you want to delete all transactions?")) {
    transactions = [];
    saveData();
    updateDashboard();
  }
});

updateDashboard();
