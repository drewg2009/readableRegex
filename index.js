const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors')
const ValidationFunctions = require('./validationFunctions')

app.use(cors())
/**
 * Global request middlware
 * 
 * Handles decoding of input strings that are using encodeURIComponent on the client side
 * This way we can process special character decoding per request in one spot
 */
app.use((req, res, next) => {
  if (req.path.includes('/api')) {
    if (req.query.inputString) {
      const decodedInputString = getDecodedInputString(req.query.inputString)
      if (decodedInputString === decodeErrorMessage) {
        return getDecodedInputStringErrResponse()
      }
    }
  }
  next()
})
// Middleware to parse JSON request bodies
app.use(express.json());
app.set('view engine', 'pug')

const decodeErrorMessage = 'Invalid input string. Could not decode URI component.'


function getDecodedInputString(inputString) {

  // Decode the URI component to handle special characters
  try {
    inputString = decodeURIComponent(inputString);
  } catch (error) {
    return decodeErrorMessage
  }
  return inputString
}

function getDecodedInputStringErrResponse() {
  return res.status(400).json({ error: decodeErrorMessage })
}

// GET routes for isEmailAddress and isPhoneNumber
app.get('/api/isEmailAddress', (req, res) => {
  let inputString = req.query.inputString;

  if (!inputString) {
    return res.status(400).json({ error: 'Input string is required as a query parameter.' });
  }

  const result = ValidationFunctions.isEmailAddress(inputString);
  res.json({ result });
});

app.get('/api/isPhoneNumber', (req, res) => {
  let inputString = req.query.inputString;

  if (!inputString) {
    return res.status(400).json({ error: 'Input string is required as a query parameter.' });
  }

  const result = ValidationFunctions.isPhoneNumber(inputString);
  res.json({ result });
});


// GET route for onlySpecialCharacters
app.get('/api/onlySpecialCharacters', (req, res) => {
  let inputString = req.query.inputString;

  if (!inputString) {
    return res.status(400).json({ error: 'Input string is required as a query parameter.' });
  }

  const result = ValidationFunctions.onlySpecialCharacters(inputString);
  res.json({ result });
});

// Example using query parameters (GET requests)

app.get('/api/onlyNumbers', (req, res) => {
  const inputString = req.query.inputString;
  if (!inputString) {
    return res.status(400).json({ error: 'Input string is required as a query parameter.' });
  }

  const result = ValidationFunctions.onlyNumbers(inputString);
  res.json({ result });
});

app.get('/api/onlyLetters', (req, res) => {
  const inputString = req.query.inputString;

  if (!inputString) {
    return res.status(400).json({ error: 'Input string is required as a query parameter.' });
  }

  const result = ValidationFunctions.onlyLetters(inputString);
  res.json({ result });
});

// POST route for excludeTheseCharacters
app.post("/api/excludeTheseCharacters", (req, res) => {
  const { excludeTheseCharacters, inputString } = req.body;

  if (!excludeTheseCharacters || !inputString) {
    return res.status(400).json({
      error: "excludeTheseCharacters and inputString are required.",
    });
  }

  const result = ValidationFunctions.excludeTheseCharacters(inputString, excludeTheseCharacters);
  res.json({ result });
});

app.get('/', (req, res) => {
  res.render('index')
})

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
