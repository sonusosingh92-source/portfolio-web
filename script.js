const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
  siteNav.classList.toggle("is-open", !isExpanded);
});

siteNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    siteNav.classList.remove("is-open");
  });
});

document.querySelector("#year").textContent = new Date().getFullYear();

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 },
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const sectionLinks = [...siteNav.querySelectorAll('a[href^="#"]')];
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      sectionLinks.forEach((link) => {
        link.classList.toggle("active", link.hash === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-35% 0px -55% 0px" },
);

document.querySelectorAll("main section[id]").forEach((section) => sectionObserver.observe(section));

const calculatorDialog = document.querySelector(".calculator-dialog");
const calculatorValue = calculatorDialog.querySelector(".calculator-value");
const calculatorExpression = calculatorDialog.querySelector(".calculator-expression");
let displayValue = "0";
let storedValue = null;
let pendingOperator = null;
let startNewNumber = false;

function updateCalculator() {
  calculatorValue.value = displayValue;
  calculatorExpression.textContent =
    storedValue !== null && pendingOperator
      ? `${storedValue} ${pendingOperator === "*" ? "×" : pendingOperator === "/" ? "÷" : pendingOperator}`
      : "";
}

function calculate(left, right, operator) {
  if (operator === "+") return left + right;
  if (operator === "-") return left - right;
  if (operator === "*") return left * right;
  if (operator === "/") return right === 0 ? null : left / right;
  return right;
}

function formatResult(value) {
  if (!Number.isFinite(value)) return "Error";
  return String(Number.parseFloat(value.toPrecision(10)));
}

function handleCalculatorInput(action, value) {
  if (action === "clear") {
    displayValue = "0";
    storedValue = null;
    pendingOperator = null;
    startNewNumber = false;
  } else if (action === "digit" && displayValue !== "Error") {
    if (startNewNumber || displayValue === "0") {
      displayValue = value;
      startNewNumber = false;
    } else if (displayValue.replace("-", "").replace(".", "").length < 12) {
      displayValue += value;
    }
  } else if (action === "decimal" && displayValue !== "Error") {
    if (startNewNumber) {
      displayValue = "0.";
      startNewNumber = false;
    } else if (!displayValue.includes(".")) {
      displayValue += ".";
    }
  } else if (action === "sign" && displayValue !== "Error") {
    displayValue = String(Number(displayValue) * -1);
  } else if (action === "percent" && displayValue !== "Error") {
    displayValue = formatResult(Number(displayValue) / 100);
  } else if (action === "operator" && displayValue !== "Error") {
    const currentValue = Number(displayValue);
    if (storedValue !== null && pendingOperator && !startNewNumber) {
      const result = calculate(storedValue, currentValue, pendingOperator);
      displayValue = result === null ? "Error" : formatResult(result);
      storedValue = result;
    } else {
      storedValue = currentValue;
    }
    pendingOperator = value;
    startNewNumber = true;
  } else if (action === "equals" && storedValue !== null && pendingOperator && displayValue !== "Error") {
    const result = calculate(storedValue, Number(displayValue), pendingOperator);
    displayValue = result === null ? "Error" : formatResult(result);
    storedValue = null;
    pendingOperator = null;
    startNewNumber = true;
  }
  updateCalculator();
}

document.querySelectorAll("[data-open-calculator]").forEach((button) => {
  button.addEventListener("click", () => calculatorDialog.showModal());
});

calculatorDialog.querySelector(".dialog-close").addEventListener("click", () => calculatorDialog.close());
calculatorDialog.addEventListener("click", (event) => {
  if (event.target === calculatorDialog) calculatorDialog.close();
});
calculatorDialog.querySelector(".calculator-keys").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-calc]");
  if (button) handleCalculatorInput(button.dataset.calc, button.dataset.value);
});

document.addEventListener("keydown", (event) => {
  if (!calculatorDialog.open) return;
  const keyActions = {
    Enter: ["equals"],
    "=": ["equals"],
    Escape: ["close"],
    Backspace: ["clear"],
    ".": ["decimal"],
  };
  if (/^\d$/.test(event.key)) {
    handleCalculatorInput("digit", event.key);
  } else if (["+", "-", "*", "/"].includes(event.key)) {
    handleCalculatorInput("operator", event.key);
  } else if (keyActions[event.key]) {
    const [action] = keyActions[event.key];
    if (action === "close") calculatorDialog.close();
    else handleCalculatorInput(action);
  } else {
    return;
  }
  event.preventDefault();
});
