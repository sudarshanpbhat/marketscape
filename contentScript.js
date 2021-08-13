chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == "getFunds")
      if (window.location.host.includes("kite.zerodha.com")) {
      	sendResponse(getKiteFunds());
      } else if (window.location.host.includes("coin.zerodha.com")) {
      	sendResponse(getCoinFunds());
      }
  }
);

// Scrapes the kite.zerodha dashboard and returns funds in json format
function getKiteFunds() {
	holdings = document.getElementsByClassName("holdings")[0]
	rows = holdings.getElementsByTagName("TR")
	fundData = {}
	for (i = 0; i < rows.length; i++) {
		if (rows[i].tagName !== "TR") {
			continue;
		}

		if (rows[i].children[0].tagName !== "TD") {
			continue;
		}

		fundName = rows[i].children[0].children[0].innerText
		qty = 0
		for (j = 0; j < rows[i].children[1].children.length; j++) {
			qty += parseFloat(rows[i].children[1].children[j].innerText.replace(/T[12]{1}:/g, '').trim())
		}
		avg = rows[i].children[2].innerText
		invested = qty * parseFloat(sanitizeAmount(avg))
		current = rows[i].children[4].innerText
		fundData[fundName] = { invested: sanitizeAmount(invested.toString()), current: sanitizeAmount(current.toString()) }
	}
	return fundData;
}

// Scrapes the coin.zerodha dashboard and returns funds in json format
function getCoinFunds() {
	rows = document.getElementsByClassName("cursor-pointer")
	fundData = {}
	for (i = 0; i < rows.length; i++) {
		if (rows[i].tagName !== "TR") {
			continue;
		}

		fundName = rows[i].getElementsByClassName("portfolio-table-row")[0].innerText
		invested = rows[i].getElementsByClassName("portfolio-table-row")[4].innerText
		current = rows[i].getElementsByClassName("portfolio-table-row")[5].innerText
		fundData[fundName] = { invested: sanitizeAmount(invested), current: sanitizeAmount(current) }
	}
	return fundData
}

// Sanitize the amount value
function sanitizeAmount(amount) {
	// Length should be greater than 0
	if (amount.length == 0) {
		return amount
	}

	// Remove the rupee symbol
	cleanValue = amount
	if (cleanValue.charCodeAt(0) == 8377) {
		cleanValue = cleanValue.substring(1)
	}

	// Remove commas
	cleanValue = cleanValue.replace(/,/g, "")

	// Convert from string to float
	return parseFloat(cleanValue)
}