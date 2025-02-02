async function getResponse() {
    const endpoint = document.querySelector('select[name="endpoint"]').value
    const inputString = document.querySelector('#inputString').value
    const encodedInputString = encodeURIComponent(inputString)

    //local dev const baseUrl = 'http://localhost:3000/api/'
    const baseUrl = 'https://readable-regex-8d81b79167bf.herokuapp.com/api/'

    try {
        const response = await fetch(baseUrl + endpoint + "?inputString=" + encodedInputString)
        const json = await response.json()
        const transformedString = json.result
        document.querySelector('#responseBox').textContent = transformedString

    }
    catch(exception) {
        alert('Error executing regex, try again later! Contact developer for support')
        throw exception
    }
}

function enableButton() {
    const inputString = document.querySelector('#inputString').value
    document.querySelector('#getResponseButton').disabled = inputString.length > 0 ? false : true
}