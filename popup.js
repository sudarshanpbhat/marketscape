let allFunds = document.getElementById("allFunds")
let allCategories = document.getElementById("allCategories")
let categoryView = document.getElementById("categoryView")

let CATEGORIES = [
	"Mutual Fund",
	"Stocks",  
	"Debt", 
	"Index", 
	"Gold",
	"Other"
]

/**
 * All funds data scraped from webpage is saved here 
 * 
 * Data structure: 
 * {
 *   fundName: {
 *      invested: 302394, 
 *      current: 313490
 *   }
 * }
 */
var FUNDS = {};

chrome.tabs.query(
	{
		active: true, 
		currentWindow: true
	}, 
	function(tabs) {
		// Get scraped fund data from the content script
  	chrome.tabs.sendMessage(
  		tabs[0].id, 
  		{
  			action: "getFunds"
  		}, 
  		function(funds) {
  			FUNDS = funds
  			refreshData()
  		}
  	);
  	populateCategories()
	}
);

function refreshData() {
	// Generate hashcodes of funds
	hashedFundNamesList = Object.keys(FUNDS).map(
		function(fundName) { 
			return hashCode(fundName) 
		}
	);

	// Get stored hashmap where key is hashcode and value is category
	chrome.storage.sync.get(
		hashedFundNamesList, 
		function(fundCategoryMap) {
			// List of funds UI
			var table = document.createElement("div")
  		for (key in FUNDS) {
  			// Fund row
	  		var row = document.createElement("div")
	  		var rowClass = document.createAttribute("class");
	  		rowClass.value = "fundRow";
	  		row.setAttributeNode(rowClass);

  			// Fund name
	  		var fundNameElement = document.createElement("p")
	  		fundNameElement.textContent = key 
	  		var fundNameClass = document.createAttribute("class")
	  		fundNameClass.value = "fundName"
	  		fundNameElement.setAttributeNode(fundNameClass);
	  		row.appendChild(fundNameElement)
				
				// Invested amount
				var invested = document.createElement("p")
				invested.textContent = "Invested: " + parseFloat(FUNDS[key].invested).toFixed(2).toString();
				row.appendChild(invested)

				// Current amount
				var current = document.createElement("p")
				current.textContent = "Current value: " + parseFloat(FUNDS[key].current).toFixed(2).toString();
				row.appendChild(current)

				// Category
				var selector = document.createElement("select")
				selector.addEventListener("change", onChangeCategory);
 
				var nameAttribute = document.createAttribute("name")
				nameAttribute.value = "Category"
				selector.setAttributeNode(nameAttribute)

				var idAttribute = document.createAttribute("id")
				idAttribute.value = key
				selector.setAttributeNode(idAttribute)

				// Selected category
				categorySelected = false
				CATEGORIES.forEach(
					function(category, index, array) {
						var option = document.createElement("option", { value: category.toLowerCase() });
						option.innerHTML = category

						idAttribute = document.createAttribute("class")
						idAttribute.value = category.toLowerCase()
						option.setAttributeNode(idAttribute)

						isSelected = fundCategoryMap[hashCode(key)] === category
						if (isSelected || (!categorySelected && index === (CATEGORIES.length - 1))) {
							categorySelected = true

							var selectedAttribute = document.createAttribute("selected")
							option.setAttributeNode(selectedAttribute)
						}
						selector.appendChild(option)
					}
				)
				row.appendChild(selector)
				table.appendChild(row)
	  	}
	  	allFunds.innerHTML = '';
	  	allFunds.appendChild(table)

			var categoryBreakup = {}
	  	for (key in FUNDS) {
	  		categorySelected = false
	  		CATEGORIES.forEach(
	  			function(category, index, array) {
	  				isSelected = fundCategoryMap[hashCode(key)] === category
	  				if (isSelected || (!categorySelected && index === (CATEGORIES.length - 1))) {
	  					categorySelected = true

		  				if (!categoryBreakup[category] || categoryBreakup[category] == null) {
								categoryBreakup[category] = { invested: 0, current: 0 }
							}
							categoryBreakup[category].invested += FUNDS[key].invested
							categoryBreakup[category].current += FUNDS[key].current
		  			}
	  			}
	  		);
	  	}
	  	updateMarketAllocation(categoryBreakup)
  	}
  );
}

function onChangeCategory(event) {
	let mappings = {}
	mappings[hashCode(event.target.id)] = event.target.value
	chrome.storage.sync.set(mappings)
	refreshData()
}	

function hashCode(str) {
  var hash = 0, i, chr;
  for (i = 0; i < str.length; i++) {
    chr   = str.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return "x" + hash.toString();
}

function updateMarketAllocation(categoryBreakup) {
	var categoryBreakupTable = document.createElement("table")
	var headingRow = document.createElement("tr");
	var categoryHead = document.createElement("th")
	var investedHead = document.createElement("th")
	var currentHead = document.createElement("th")
	var shareHead = document.createElement("th")

	categoryHead.textContent = "Category"
	investedHead.textContent = "Invested"
	currentHead.textContent = "Current Value"
	shareHead.textContent = "Share"

	headingRow.appendChild(categoryHead);
	headingRow.appendChild(investedHead);
	headingRow.appendChild(currentHead);
	headingRow.appendChild(shareHead);
	categoryBreakupTable.appendChild(headingRow);

	var total = Object.values(categoryBreakup).reduce(function (a, b) { return (a + b.current); }, 0)
	var totalInvested = Object.values(categoryBreakup).reduce(function (a, b) { return (a + b.invested); }, 0)
	for (category in categoryBreakup) {
		var row = document.createElement("tr")
		var catCell = document.createElement("td")
		var investedCell = document.createElement("td")
		var currentCell = document.createElement("td")
		var share = document.createElement("td")

		var rightAlignedClass = document.createAttribute("class")
		rightAlignedClass.value = "amount"
		investedCell.setAttributeNode(rightAlignedClass.cloneNode(true))
		currentCell.setAttributeNode(rightAlignedClass.cloneNode(true))
		share.setAttributeNode(rightAlignedClass)

		catCell.innerHTML = category
		investedCell.innerHTML = parseFloat(categoryBreakup[category].invested).toFixed(2)
		currentCell.innerHTML = parseFloat(categoryBreakup[category].current).toFixed(2)
		share.innerHTML = parseFloat(categoryBreakup[category].current / total * 100).toFixed(2) + "%";

		row.appendChild(catCell)
		row.appendChild(investedCell)
		row.appendChild(currentCell)
		row.appendChild(share)
		categoryBreakupTable.appendChild(row)
	}

	// Add total
	var totalRow = document.createElement("tr")
	var totalCell = document.createElement("td")
	var totalInvestedCell = document.createElement("td")
	var totalCurrentCell = document.createElement("td")
	var totalShareCell = document.createElement("td")

	var rightAlignedClass = document.createAttribute("class")
	rightAlignedClass.value = "amount"

	totalInvestedCell.setAttributeNode(rightAlignedClass.cloneNode(true))
	totalCurrentCell.setAttributeNode(rightAlignedClass.cloneNode(true))
	totalShareCell.setAttributeNode(rightAlignedClass)

	totalCell.innerHTML = "Total"
	totalInvestedCell.innerHTML = parseFloat(totalInvested).toFixed(2)
	totalCurrentCell.innerHTML = parseFloat(total).toFixed(2)
	totalShareCell.innerHTML = "100%"

	totalRow.appendChild(totalCell)
	totalRow.appendChild(totalInvestedCell)
	totalRow.appendChild(totalCurrentCell)
	totalRow.appendChild(totalShareCell)
	categoryBreakupTable.appendChild(totalRow)

	categoryView.innerHTML = '';
	categoryView.appendChild(categoryBreakupTable)
}


function openTab(event) {
	tabName = event.srcElement.innerText
	// Declare all variables
	var i, tabcontent, tablinks;

	// Get all elements with class="tabcontent" and hide them
	tabcontent = document.getElementsByClassName("tabcontent");
	for (i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
	}

	// Get all elements with class="tablinks" and remove the class "active"
	tablinks = document.getElementsByClassName("tablinks");
	for (i = 0; i < tablinks.length; i++) {
		tablinks[i].className = tablinks[i].className.replace(" active", "");
	}

	// Show the current tab, and add an "active" class to the button that opened the tab
	document.getElementById(tabName).style.display = "block";
	event.currentTarget.className += " active";
}

function populateCategories() {
	var table = document.createElement("table")
	CATEGORIES.forEach(
		function (category, index, array) {
			var categoryRow = document.createElement("tr");
			var categoryCell = document.createElement("td");
			categoryCell.innerHTML = category;
			categoryRow.appendChild(categoryCell);
			table.appendChild(categoryRow);
		}
	);
	allCategories.appendChild(table);
}

document.getElementById("dashboard").addEventListener("click", openTab)
document.getElementById("categories").addEventListener("click", openTab)
document.getElementById("dashboard").click();
