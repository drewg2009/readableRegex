async function getResponse() {
  const inputString = document.querySelector("#inputString").value;
  const fieldToValidate = document.querySelector("#fieldToValidate").value;
  const endpoint = fieldToValidate.length?"isField":document.querySelector('select[name="endpoint"]').value;

  // Use window.location.origin to get the base URL
  const baseUrl = window.location.origin;

  try {
    const response = await fetch(`${baseUrl}/api/${endpoint}`, {
      method: "POST",
      body: JSON.stringify({
        inputString: inputString,
        fieldToValidate: fieldToValidate.slice(0, 100), // Limit to 100 characters
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const json = await response.json();
    const transformedString = json.result;
    document.querySelector("#responseBox").textContent = transformedString;
  } catch (exception) {
    alert(
      "Error executing regex, try again later! Contact developer for support"
    );
    throw exception;
  }
}

function enableButton() {
  const inputString = document.querySelector("#inputString").value;
  document.querySelector("#getResponseButton").disabled =
    inputString.length > 0 ? false : true;
}
