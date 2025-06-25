'use strict';

// =========================
// DOM References
// =========================
let compareButton, containsButton, clearButton;
let leftTextarea, rightTextarea;
let leftReplaceBackslashes, rightReplaceBackslashes;
let comparisonResultTable, containsResultTable;
let commonLinesList, leftLinesList, rightLinesList, containsLinesList;

// =========================
// Comparison State
// =========================
let commonLines = [];
let leftOnlyLines = [];
let rightOnlyLines = [];

// =========================
// DOM Manipulation
// =========================
function hideElement(el) {
    el.classList.add('hidden');
}

function showElement(el) {
    el.classList.remove('hidden');
}

function clearContent(els) {
    els.forEach(el => {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    });
}

// =========================
// Utility Functions
// =========================
function getLines() {
    let left = leftTextarea.value.split('\n').map(l => l.trim()).filter(Boolean);
    let right = rightTextarea.value.split('\n').map(l => l.trim()).filter(Boolean);

    if (leftReplaceBackslashes.checked) {
        left = left.map(l => l.replace(/\\/g, '/'));
    }
    if (rightReplaceBackslashes.checked) {
        right = right.map(l => l.replace(/\\/g, '/'));
    }

    return { left, right };
}

function countMatches(arr, val) {
    return arr.filter(item => item === val).length;
}

function highlightTerms(term, line) {
    return line.split(term).join(`<span class="highlight">${term}</span>`);
}

function search(term, lines) {
    const results = [];
    lines.forEach((line, idx) => {
        if (line.includes(term)) {
            results.push({
                lineNr: idx + 1,
                lineText: highlightTerms(term, line)
            });
        }
    });
    return { count: results.length, lines: results };
}

function debounce(fn, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}

// =========================
// Rendering Functions
// =========================
function addRow(table, { nr, text, count }) {
    const row = document.createElement('tr');
    row.innerHTML = `
    <td>${nr}.</td>
    <td>${text}</td>
    <td class="text-center">${count}</td>`;
    table.appendChild(row);
}

function addCommonRow(table, { text, originCount, matchCount }) {
    const row = document.createElement('tr');
    row.innerHTML = `
    <td>${text}</td>
    <td class="text-center">${originCount}</td>
    <td class="text-center">${matchCount}</td>`;
    table.appendChild(row);
}

function addContainsRow(table, { nr, text, count, lines }) {
    const row = document.createElement('tr');
    row.innerHTML = `
    <td>${nr}.</td>
    <td>${text}</td>
    <td>${count}</td>
    <td>${lines.map(l => `${l.lineNr}. ${l.lineText}`).join('<br>')}</td>`;
    table.appendChild(row);
}

function updateLineNumbers() {
    const leftCount = leftTextarea.value.split("\n").length;
    const rightCount = rightTextarea.value.split("\n").length;

    leftLineNumbers.innerHTML = Array.from({ length: leftCount }, (_, i) => i + 1).join("<br>");
    rightLineNumbers.innerHTML = Array.from({ length: rightCount }, (_, i) => i + 1).join("<br>");
}


// =========================
// Result Handlers
// =========================
function handleCompare() {
    clearResults();
    showElement(comparisonResultTable);

    const { left, right } = getLines();

    left.forEach((line, i) => {
        if (commonLines.includes(line)) return;

        const matchCount = countMatches(right, line);
        if (matchCount > 0) {
            commonLines.push(line);
            addCommonRow(commonLinesList, {
                text: line,
                originCount: countMatches(left, line),
                matchCount
            });
        } else if (!leftOnlyLines.includes(line)) {
            leftOnlyLines.push(line);
            addRow(leftLinesList, {
                nr: i + 1,
                text: line,
                count: countMatches(left, line)
            });
        }
    });

    right.forEach((line, i) => {
        if (!left.includes(line) && !rightOnlyLines.includes(line)) {
            rightOnlyLines.push(line);
            addRow(rightLinesList, {
                nr: i + 1,
                text: line,
                count: countMatches(right, line)
            });
        }
    });
}

function handleContains() {
    clearResults();
    showElement(containsResultTable);

    const { left: terms, right: lines } = getLines();
    terms.forEach((term, i) => {
        const result = search(term, lines);
        addContainsRow(containsLinesList, {
            nr: i + 1,
            text: term,
            count: result.count,
            lines: result.lines
        });
    });
}

function handleClear() {
    leftTextarea.value = '';
    rightTextarea.value = '';
    clearResults();
    leftLineNumbers.innerHTML = '';
    rightLineNumbers.innerHTML = '';
}

function clearResults() {
    clearContent([
        commonLinesList,
        leftLinesList,
        rightLinesList,
        containsLinesList
    ]);

    commonLines = [];
    leftOnlyLines = [];
    rightOnlyLines = [];

    hideElement(comparisonResultTable);
    hideElement(containsResultTable);
}

// =========================
// Initialization
// =========================
document.addEventListener('DOMContentLoaded', () => {
    // Buttons
    compareButton = document.getElementById('compareButton');
    containsButton = document.getElementById('containsButton');
    clearButton = document.getElementById('clearButton');

    // Textareas
    leftTextarea = document.getElementById('leftTextarea');
    rightTextarea = document.getElementById('rightTextarea');

    // Checkboxes
    leftReplaceBackslashes = document.getElementById('leftReplaceBackslashes');
    rightReplaceBackslashes = document.getElementById('rightReplaceBackslashes');

    // Tables & Result lists
    comparisonResultTable = document.getElementById('comparisonResult');
    containsResultTable = document.getElementById('containsResult');
    commonLinesList = document.getElementById('commonLinesList');
    leftLinesList = document.getElementById('leftLinesList');
    rightLinesList = document.getElementById('rightLinesList');
    containsLinesList = document.getElementById('containsLinesList');

    // Event listeners
    compareButton.addEventListener('click', handleCompare);
    containsButton.addEventListener('click', handleContains);
    clearButton.addEventListener('click', handleClear);

    leftTextarea.addEventListener("input", debounce(updateLineNumbers, 50)); // runs at most once every 100ms
    leftTextarea.addEventListener("scroll", () => {
        document.getElementById("leftLineNumbers").scrollTop = leftTextarea.scrollTop;
    });
    rightTextarea.addEventListener("input", debounce(updateLineNumbers, 50)); // runs at most once every 100ms
    rightTextarea.addEventListener("scroll", () => {
        document.getElementById("rightLineNumbers").scrollTop = rightTextarea.scrollTop;
    });

    // Line numbers
    updateLineNumbers();

    // Autofocus
    leftTextarea.focus();
});
