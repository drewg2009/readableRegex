const express = require('express');
const { rateLimit } = require("express-rate-limit");
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors')
const ValidationFunctions = require('./validationFunctions');
const { urlUtils } = require("./utils/urlUtils");
const expressJSDocSwagger = require('express-jsdoc-swagger');
const fetchAiGeneratedContent = require('./runGeminiPrompt');
const requiredParameterResponse = 'Input string required as a parameter.'

// Load environment variables
require('dotenv').config();
/**
 * Global rate limiter middleware
 * limits the number of request sent to our application
 * each IP can make up to 1000 requests per `windowsMs` (1 minute)
 */
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

const options = {
  info: {
    version: '1.0.0',
    title: 'Readable Regex',
    license: {
      name: 'MIT',
    },
  },
  //TODO will add this later when we have API tokens
  // security: {
  //   BasicAuth: {
  //     type: 'http',
  //     scheme: 'basic',
  //   },
  // },
  // Base directory which we use to locate your JSDOC files
  baseDir: __dirname,
  // Glob pattern to find your jsdoc files (multiple patterns can be added in an array)
  // This pattern finds any .js file. The default value from the docs didn't work
  filesPattern: '*.js',
  // URL where SwaggerUI will be rendered
  swaggerUIPath: '/api-docs',
  // Expose OpenAPI UI
  exposeSwaggerUI: true,
  // Expose Open API JSON Docs documentation in `apiDocsPath` path.
  exposeApiDocs: false,
  // Open API JSON Docs endpoint.
  apiDocsPath: '/v3/api-docs',
  // Set non-required fields as nullable by default
  notRequiredAsNullable: false,
  // You can customize your UI options.
  // you can extend swagger-ui-express config. You can checkout an example of this
  // in the `example/configuration/swaggerOptions.js`
  swaggerUiOptions: {},
  // multiple option in case you want more that one instance
  multiple: true,
};

expressJSDocSwagger(app)(options);


app.use(limiter)

// Set API URL based on environment
const apiUrl =
  process.env.NODE_ENV === 'production'
    ? process.env.PROD_API_URL
    : 'http://localhost:3000'

app.use(cors())
// Middleware to parse JSON request bodies
app.use(express.json());
app.set('view engine', 'pug');


/**
 * Basic request
 * @typedef {object} BasicRequest
 * @property {string} inputString.required - Input string
 */

/**
 * Basic response
 * @typedef {object} BasicResponse
 * @property {string} result - Result
 */

/**
 * Bad request response
 * @typedef {object} BadRequestResponse
 * @property {string} error
 */

/**
 * A ExcludeCharactersModel
 * @typedef {object} ExcludeCharactersModel
 * @property {string} inputString.required - The inputString
 * @property {string} excludeTheseCharacters.required - The excludeTheseCharacters
 */

/**
 * A ZipCodeModel
 * @typedef {object} ZipCodeModel
 * @property {string} inputString.required - The zip code to validate
 * @property {string} countryCode.required - The country code to use for validation
 */

/**
 * A OnlyTheseCharactersModel
 * @typedef {object} OnlyTheseCharactersModel
 * @property {string} inputString.required - The string to validate against the allowed characters
 * @property {string} onlyTheseCharacters.required - The characters that are allowed in the input string
 */

/**
 * A IsUrlModel
 * @typedef {object} IsUrlModel
 * @property {string} inputString.required - The URL string to validate
 * @property {boolean} [connectToUrlTest] - Optionally test if the URL is reachable
 */

/**
 * POST /api/isField
 * @summary Returns true/false based on the input string and fieldToValidate
 * @param {BasicRequest} request.body.required
 * @return {BasicResponse} 200 - Success response
 * @return {BadRequestResponse} 400 - Bad request response
 * @example request - test
 * {
 *   "inputString": "test@gmail.com"
 * }
 * @example response - 200 - example payload
 * {
 *    "result": true,
 *    "explanation": "The email address 'test@gmail.com' follows the standard format: local-part@domain.  It contains a username ('test'), an '@' symbol, and a domain name ('gmail.com')."
  }
 * @example response - 400 - example
 * {
 *   "error": "Input string/FieldTovalidate required as a parameter."
 * }
 */
app.post('/api/isField', async (req, res) => {
  const { inputString, fieldToValidate } = req.body;

  if (!inputString || !fieldToValidate) {
    return res.status(400).json({ error: requiredParameterResponse });
  }
  const instructionToLLM = `Can you return true or false if this field '${fieldToValidate}' is valid? Here is the value for this field: '${inputString}'. Can you only return this in a valid JSON string so I can parse it without the text formatting for JSON, and don't write anything else like json or quotes,just the json result) where the 'result' property will be true or false, and the 'explanation' will be the reason for why it's true or false?
  Note:treat special characters(.,@/-+ etc) and digits as Lowercase
  Note:Consider date formats of all over the world
  "// YYYY-MM-DD
  // MM/DD/YYYY or DD/MM/YYYY
  // YYYY/MM/DD
  // DD-MM-YYYY or MM-DD-YYYY
  // YYYY.MM.DD
  // DD.MM.YYYY or MM.DD.YYYY
  // YYYYMMDD
  // YYYY-MM-DD HH:mm:ss"
  Note:Consider strings with only 0 and 1 to be binary
  Note:In case of phone number take into consideration all phone number formats all over the world
  Note:In case of zip code take into consideration zip codes all over the world
  `;
  try {
    const aiJsonResponse = await fetchAiGeneratedContent(instructionToLLM)
    const jsonResult = JSON.parse(aiJsonResponse)// get the string returned from LLM and extract only the JSON part from it
    res.json(jsonResult)
  }
  catch (e) {
    res.json({error: e.message})
  }

});

/**
 * POST /api/isEmailAddress
 * @summary Returns true if valid email address, false otherwise
 * @description This endpoint validates if the provided string is a valid email address.
 * @param {BasicRequest} request.body.required
 * @return {BasicResponse} 200 - Success response
 * @return {BadRequestResponse} 400 - Bad request response
 * @example request - test
 * {
 *   "inputString": "test@gmail.com"
 * }
 * @example response - 200 - example payload
 * {
 *   "result": true
 * }
 * @example response - 400 - example
 * {
 *   "error": "Input string required as a parameter."
 * }
 */
app.post('/api/isEmailAddress', (req, res) => {
  const { inputString } = req.body;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  const result = ValidationFunctions.isEmailAddress(inputString);
  res.json({ result });
});

/**
 * POST /api/isBoolean
 * @summary Returns true if valid boolean value, otherwise false. Valid boolean values include: 'true', 'false', '0', '1', 'TRUE', 'FALSE', 'True', 'False'
 * @description This endpoint checks if the input string is a valid boolean value, supporting various formats such as 'TRUE', 'FALSE', '1', '0', and more.
 * @param {BasicRequest} request.body.required
 * @return {BasicResponse} 200 - Success response
 * @return {BadRequestResponse} 400 - Bad request response
 * @example request - test
 * {
 *   "inputString": "TRUE"
 * }
 * @example response - 200 - example payload
 * {
 *   "result": true
 * }
 * @example response - 400 - example
 * {
 *   "error": "Input string required as a parameter."
 * }
 */
app.post('/api/isBoolean', (req, res) => {
  const { inputString } = req.body;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  const result = ValidationFunctions.isBoolean(inputString);
  res.json({ result });
});

/**
 * POST /api/isPhoneNumber
 * @summary Returns true if the input string is a valid phone number, otherwise false
 * @description This endpoint validates if the input string matches a valid phone number format.
 * @param {BasicRequest} request.body.required - Request body containing the input string
 * @return {BasicResponse} 200 - Success response
 * @return {BadRequestResponse} 400 - Bad request response
 * @example request - test
 * {
 *   "inputString": "+1234567890"
 * }
 * @example response - 200 - example payload
 * {
 *   "result": true
 * }
 * @example response - 400 - example
 * {
 *   "error": "Input string required as a parameter."
 * }
 */
app.post('/api/isPhoneNumber', (req, res) => {
  const { inputString } = req.body;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  const result = ValidationFunctions.isPhoneNumber(inputString);
  res.json({ result });
});

/**
 * POST /api/onlySpecialCharacters
 * @summary Extracts and returns only the special characters from the input string
 * @description This endpoint extracts special characters (non-alphanumeric characters) from the given string.
 * @param {BasicRequest} request.body.required - Request body containing the input string
 * @return {BasicResponse} 200 - Success response with extracted special characters
 * @return {BadRequestResponse} 400 - Bad request response
 * @example request - test
 * {
 *   "inputString": "Hello@World!"
 * }
 * @example response - 200 - example payload
 * {
 *   "result": "@!"
 * }
 * @example response - 400 - example
 * {
 *   "error": "Input string required as a parameter."
 * }
 */
app.post('/api/onlySpecialCharacters', (req, res) => {
  const { inputString } = req.body;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  const result = ValidationFunctions.onlySpecialCharacters(inputString);
  res.json({ result });
});

/**
 * POST /api/trim
 * @summary Trims leading and trailing whitespace from the input string
 * @description This endpoint removes any leading and trailing whitespace from the provided string.
 * @param {BasicRequest} request.body.required - Request body containing the input string
 * @return {BasicResponse} 200 - Success response with trimmed string
 * @return {BadRequestResponse} 400 - Bad request response
 * @example request - test
 * {
 *   "inputString": "   Hello World!   "
 * }
 * @example response - 200 - example payload
 * {
 *   "result": "Hello World!"
 * }
 * @example response - 400 - example
 * {
 *   "error": "Input string required as a parameter."
 * }
 */
app.post('/api/trim', (req, res) => {
  const inputString = req.body.inputString;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  const result = ValidationFunctions.trim(inputString);
  res.json({ result });
});

/**
 * POST /api/onlyNumbers
 * @summary Extracts and returns only the numbers from the input string
 * @description This endpoint filters out all non-numeric characters from the input string, returning only the numbers.
 * @param {BasicRequest} request.body.required - Request body containing the input string
 * @return {BasicResponse} 200 - Success response with extracted numbers
 * @return {BadRequestResponse} 400 - Bad request response
 * @example request - test
 * {
 *   "inputString": "abc123def456"
 * }
 * @example response - 200 - example payload
 * {
 *   "result": "123456"
 * }
 * @example response - 400 - example
 * {
 *   "error": "Input string required as a parameter."
 * }
 */
app.post('/api/onlyNumbers', (req, res) => {
  const { inputString } = req.body;
  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  const result = ValidationFunctions.onlyNumbers(inputString);
  res.json({ result });
});

/**
 * POST /api/onlyLetters
 * @summary Extracts and returns only the letters from the input string
 * @description This endpoint filters out all non-alphabetic characters from the input string, returning only the letters.
 * @param {BasicRequest} request.body.required - Request body containing the input string
 * @return {BasicResponse} 200 - Success response with extracted letters
 * @return {BadRequestResponse} 400 - Bad request response
 * @example request - test
 * {
 *   "inputString": "abc123def"
 * }
 * @example response - 200 - example payload
 * {
 *   "result": "abcdef"
 * }
 * @example response - 400 - example
 * {
 *   "error": "Input string required as a parameter."
 * }
 */
app.post('/api/onlyLetters', (req, res) => {
  const { inputString } = req.body;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  const result = ValidationFunctions.onlyLetters(inputString);
  res.json({ result });
});

/**
 * POST /api/excludeTheseCharacters
 * @summary Removes the specified characters from the input string
 * @description This endpoint removes all occurrences of the specified characters from the given input string.
 * @param {ExcludeCharactersModel} request.body.required - Request body containing the characters to exclude and the input string
 * @return {BasicResponse} 200 - Success response with the string after excluding the specified characters
 * @return {BadRequestResponse} 400 - Bad request response
 * @example request - test
 * {
 *   "excludeTheseCharacters": "!@#",
 *   "inputString": "abc!123@def#456"
 * }
 * @example response - 200 - example payload
 * {
 *   "result": "abc123def456"
 * }
 * @example response - 400 - example
 * {
 *   "error": "excludeTheseCharacters and inputString are required."
 * }
 */
app.post("/api/excludeTheseCharacters", (req, res) => {
  const { excludeTheseCharacters, inputString } = req.body;

  if (!excludeTheseCharacters || !inputString) {
    return res.status(400).json({
      error: "excludeTheseCharacters and inputString are required.",
    });
  }

  const result = ValidationFunctions.excludeTheseCharacters(inputString, excludeTheseCharacters);
  res.json({ result });
})

/**
 * POST /api/isAlphaNumeric
 * @summary Returns true if the input string contains only alphanumeric characters (letters and numbers), otherwise false
 * @description This endpoint checks whether the provided input string contains only letters and numbers. It returns `true` if the string is alphanumeric, and `false` otherwise.
 * @param {BasicRequest} request.body.required - The input string to check
 * @return {BasicResponse} 200 - Success response with a boolean result
 * @return {BadRequestResponse} 400 - Bad request response when the input string is missing
 * @example request - test
 * {
 *   "inputString": "abc123"
 * }
 * @example response - 200 - example payload
 * {
 *   "result": true
 * }
 * @example response - 400 - example
 * {
 *   "error": "Input string required as a parameter."
 * }
 */
app.post('/api/isAlphaNumeric', (req, res) => {
  const { inputString } = req.body;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  const result = ValidationFunctions.isAlphaNumeric(inputString);
  res.json({ result });
});

/**
 * POST /api/isZipCode
 * @summary Validates if the input string is a valid zip code for the provided country code
 * @param {ZipCodeModel} request.body.required - The request body containing the zip code and country code
 * @description Validates the zip code against the specified country code. Supported countries include US, UK, CA, AU, DE, FR, JP, BR, IN.
 * @return {BasicResponse} 200 - Success response with a boolean result indicating if the zip code is valid
 * @return {BadRequestResponse} 400 - Bad request response when input is missing or invalid
 * @example request - test
 * {
 *   "inputString": "90210",
 *   "countryCode": "US"
 * }
 * @example response - 200 - example payload
 * {
 *   "result": true
 * }
 * @example response - 400 - example for missing country code
 * {
 *   "error": "inputString and countryCode are required."
 * }
 * @example response - 400 - example for unsupported country code
 * {
 *   "error": "Country code not supported at this time. If this is a valid country code, please open an issue with the developers.",
 *   "supportedCountries": ["US", "UK", "CA", "AU", "DE", "FR", "JP", "BR", "IN"]
 * }
 */
app.post('/api/isZipCode', (req, res) => {
  const { inputString, countryCode } = req.body;

  const patterns = {
    US: /^\d{5}(-\d{4})?$/,
    UK: /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/i,
    CA: /^[A-Z]\d[A-Z] \d[A-Z]\d$/i,
    AU: /^\d{4}$/,
    DE: /^\d{5}$/,
    FR: /^\d{5}$/,
    JP: /^\d{3}-\d{4}$/,
    BR: /^\d{5}-\d{3}$/,
    IN: /^[1-9]\d{5}$/
  };

  if (!inputString || !countryCode) {
    return res.status(400).json({ error: 'inputString and countryCode are required.' });
  }

  const upperCountryCode = countryCode.toUpperCase();

  if (!patterns[upperCountryCode]) {
    return res.status(400).json({
      error: 'Country code not supported at this time. If this is a valid country code, please open an issue with the developers.',
      supportedCountries: Object.keys(patterns)
    });
  }

  const result = ValidationFunctions.isZipCode(inputString, upperCountryCode, patterns);
  res.json({ result });
});

/**
 * POST /api/isInteger
 * @summary Validates if the input string is a valid integer
 * @description Checks whether the provided string can be interpreted as an integer.
 * @param {BasicRequest} request.body.required - The request body containing the string to validate
 * @return {BasicResponse} 200 - Success response with a boolean result indicating if the string is an integer
 * @return {BadRequestResponse} 400 - Bad request response when input is missing or invalid
 * @example request - test
 * {
 *   "inputString": "123"
 * }
 * @example response - 200 - example payload
 * {
 *   "result": true
 * }
 * @example response - 400 - example for missing input string
 * {
 *   "error": "inputString is required."
 * }
 */
app.post('/api/isInteger', (req, res) => {
  const { inputString } = req.body;

  if (!inputString) {
    return res.status(400).json({
      error: 'inputString is required.',
    });
  }

  const result = ValidationFunctions.isInteger(inputString);

  res.json({ result });
});

/**
 * POST /api/isHexadecimal
 * @summary Validates if the input string is a valid hexadecimal number
 * @description Checks if the provided string is a valid hexadecimal number (e.g., 0x1a3, 0xABC123).
 * @param {BasicRequest} request.body.required - The request body containing the string to validate
 * @return {BasicResponse} 200 - Success response with a boolean result indicating if the string is a valid hexadecimal number
 * @return {BadRequestResponse} 400 - Bad request response when input is missing or invalid
 * @example request - test
 * {
 *   "inputString": "0x1A3"
 * }
 * @example response - 200 - example payload
 * {
 *   "result": true
 * }
 * @example response - 400 - example for missing input string
 * {
 *   "error": "inputString is required."
 * }
 */
app.post('/api/isHexadecimal', (req, res) => {
  const { inputString } = req.body;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  const result = ValidationFunctions.isHexadecimal(inputString);
  res.json({ result });
});

/**
 * POST /api/isDecimal
 * @summary Validates if the input string is a valid decimal number
 * @description Checks if the provided string is a valid decimal number (e.g., 123.45, 0.99, -10.5).
 * @param {BasicRequest} request.body.required - The request body containing the string to validate
 * @return {BasicResponse} 200 - Success response with a boolean result indicating if the string is a valid decimal number
 * @return {BadRequestResponse} 400 - Bad request response when input is missing or invalid
 * @example request - test
 * {
 *   "inputString": "123.45"
 * }
 * @example response - 200 - example payload
 * {
 *   "result": true
 * }
 * @example response - 400 - example for missing input string
 * {
 *   "error": "inputString is required."
 * }
 */
app.post('/api/isDecimal', (req, res) => {
  const { inputString } = req.body;

  if (!inputString) {
    return res.status(400).json({
      error: "inputString is required."
    });
  }

  const result = ValidationFunctions.isDecimal(inputString);

  res.json({ result });
});

/**
 * POST /api/isLowercase
 * @summary Validates if the input string contains only lowercase letters
 * @description Checks if the provided string is entirely in lowercase (e.g., "hello", "world").
 * @param {BasicRequest} request.body.required - The request body containing the string to validate
 * @return {BasicResponse} 200 - Success response with a boolean result indicating if the string contains only lowercase letters
 * @return {BadRequestResponse} 400 - Bad request response when input is missing or invalid
 * @example request - test
 * {
 *   "inputString": "hello"
 * }
 * @example response - 200 - example payload
 * {
 *   "result": true
 * }
 * @example response - 400 - example for missing input string
 * {
 *   "error": "inputString is required."
 * }
 */
app.post('/api/isLowercase', (req, res) => {
  const { inputString } = req.body;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }
  const result = ValidationFunctions.isLowercase(inputString);

  res.json({ result });
});

/**
 * POST /api/isDate
 * @summary Validates if the input string is a valid date
 * @description Checks if the provided string is a valid date (e.g., "2025-02-16", "02/16/2025").
 * @param {BasicRequest} request.body.required - The request body containing the string to validate
 * @return {BasicResponse} 200 - Success response with a boolean result indicating if the string is a valid date
 * @return {BadRequestResponse} 400 - Bad request response when input is missing or invalid
 * @example request - test
 * {
 *   "inputString": "2025-02-16"
 * }
 * @example response - 200 - example payload
 * {
 *   "result": true
 * }
 * @example response - 400 - example for missing input string
 * {
 *   "error": "inputString is required."
 * }
 */
app.post('/api/isDate', (req, res) => {
  const { inputString } = req.body;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  const result = ValidationFunctions.isDate(inputString);
  res.json({ result });
});

/**
 * POST /api/onlyTheseCharacters
 * @summary Validates if the input string contains only the specified allowed characters
 * @description Checks if the provided string contains only the characters specified in `onlyTheseCharacters` and excludes all others.
 * @param {OnlyTheseCharactersModel} request.body.required - The request body containing the allowed characters and the string to validate
 * @return {BasicResponse} 200 - Success response with a boolean result indicating if the string contains only the allowed characters
 * @return {BadRequestResponse} 400 - Bad request response when input is missing or invalid
 * @example request - test
 * {
 *   "onlyTheseCharacters": "abc123",
 *   "inputString": "abc123"
 * }
 * @example response - 200 - example payload
 * {
 *   "result": true
 * }
 * @example response - 400 - example for missing characters to include
 * {
 *   "error": "characters to include and inputString are required."
 * }
 */
app.post('/api/onlyTheseCharacters', (req, res) => {
  const { onlyTheseCharacters, inputString } = req.body;

  if (!onlyTheseCharacters || !inputString) {
    return res.status(400).json({
      error: "characters to include and inputString are required.",
    });
  }

  const result = ValidationFunctions.includeOnlyTheseCharacters(inputString, onlyTheseCharacters);
  res.json({ result });
});

/**
 * POST /api/isAllCaps
 * @summary Checks if the input string is entirely in uppercase
 * @description Validates if the provided string is entirely made up of uppercase letters. 
 * @param {BasicRequest} request.body.required - The request body containing the string to validate
 * @return {BasicResponse} 200 - Success response with a boolean result indicating if the string is all uppercase
 * @return {BadRequestResponse} 400 - Bad request response when input is missing or invalid
 * @example request - test
 * {
 *   "inputString": "HELLO"
 * }
 * @example response - 200 - example payload
 * {
 *   "result": true
 * }
 * @example response - 400 - example for missing input string
 * {
 *   "error": "inputString is required."
 * }
 */
app.post('/api/isAllCaps', (req, res) => {
  const { inputString } = req.body;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }
  const result = ValidationFunctions.isAllCaps(inputString);

  res.json({ result });
});

/**
 * POST /api/isUrl
 * @summary Validates if the input string is a valid URL
 * @description Checks if the provided string is a valid URL. Optionally, it can test if the URL is reachable.
 * @param {IsUrlModel} request.body.required - The request body containing the URL string to validate
 * @return {BasicResponse} 200 - Success response with the URL validation result
 * @return {BadRequestResponse} 400 - Bad request response when input is missing or invalid
 * @example request - test
 * {
 *   "inputString": "https://example.com",
 *   "connectToUrlTest": true
 * }
 * @example response - 200 - example payload
 * {
 *   "result": true,
 *   "connectToUrlResult": true
 * }
 * @example response - 400 - example for missing URL
 * {
 *   "error": "inputString is required."
 * }
 */
app.post('/api/isUrl', async (req, res) => {
  const inputString = req.body.inputString;
  const connectToUrlTest = req.body.connectToUrlTest ?? false

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }
  const result = ValidationFunctions.isUrl(inputString);

  if (!connectToUrlTest) {
    return res.json({ result });
  }

  const connectToUrlResult = await urlUtils.isUrlReachable(inputString);

  return res.json({
    result,
    connectToUrlResult
  });
});

/**
 * POST /api/isBinaryString
 * @summary Validates if the input string is a valid binary string
 * @description This endpoint checks if the provided input string consists only of '0's and '1's, which are considered binary digits. It returns `true` if the string is a valid binary string, and `false` otherwise.
 * @param {BasicRequest} request.body.required - The request body containing the string to validate
 * @return {BasicResponse} 200 - Success response with the binary string validation result
 * @return {BadRequestResponse} 400 - Bad request response when input is missing or invalid
 * @example request - test
 * {
 *   "inputString": "1010101010"
 * }
 * @example response - 200 - example payload
 * {
 *   "result": true
 * }
 * @example response - 400 - example for missing input string
 * {
 *   "error": "inputString is required."
 * }
 */
app.post('/api/isBinaryString', (req, res) => {
  const inputString = req.body.inputString;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }
  const result = ValidationFunctions.isBinaryString(inputString);
  return res.json({ result });
});

app.get('/', (req, res) => {
  res.render('index');
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
  console.log(`API URL: ${apiUrl}`);
});
