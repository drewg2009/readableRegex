const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors')

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
const router = express.Router()
//a middleware sub-stack shows request info for any type of HTTP request to the /user/:id path


const decodeErrorMessage = 'Invalid input string. Could not decode URI component.'


// Function to remove all non-numeric characters
function onlyNumbers(str) {
  return str.replace(/[^0-9]/g, '');
}

// Function to remove all non-letter characters (including spaces and punctuation)
function onlyLetters(str) {
  return str.replace(/[^a-zA-Z]/g, '');
}

function onlySpecialCharacters(str) {
  return str.replace(/[a-zA-Z0-9\s]/g, ''); // Keep only special characters
}

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

function isEmailAddress(str) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
}

function isPhoneNumber(str) {
  // A basic phone number regex (you might need to adjust it for your specific needs)
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4}$/im;
  return phoneRegex.test(str);
}

// GET routes for isEmailAddress and isPhoneNumber

app.get('/api/isEmailAddress', (req, res) => {
  let inputString = req.query.inputString;

  if (!inputString) {
    return res.status(400).json({ error: 'Input string is required as a query parameter.' });
  }


  const result = isEmailAddress(inputString);
  res.json({ result });
});

app.get('/api/isPhoneNumber', (req, res) => {
  let inputString = req.query.inputString;

  if (!inputString) {
    return res.status(400).json({ error: 'Input string is required as a query parameter.' });
  }

  const result = isPhoneNumber(inputString);
  res.json({ result });
});


// GET route for onlySpecialCharacters
app.get('/api/onlySpecialCharacters', (req, res) => {
  let inputString = req.query.inputString;

  if (!inputString) {
    return res.status(400).json({ error: 'Input string is required as a query parameter.' });
  }

  const result = onlySpecialCharacters(inputString);
  res.json({ result });
});

// Example using query parameters (GET requests)

app.get('/api/onlyNumbers', (req, res) => {
  const inputString = req.query.inputString;
  if (!inputString) {
    return res.status(400).json({ error: 'Input string is required as a query parameter.' });
  }

  const result = onlyNumbers(inputString);
  res.json({ result });
});

app.get('/api/onlyLetters', (req, res) => {
  const inputString = req.query.inputString;

  if (!inputString) {
    return res.status(400).json({ error: 'Input string is required as a query parameter.' });
  }

  const result = onlyLetters(inputString);
  res.json({ result });
});

app.get('/', (req, res) => {
  res.render('index')
})

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
