// server.js
// This file sets up the core express server and middleware.
// We separate the server configuration into this file to address an issue where SuperTest prevents the server from properly closing after tests are executed.

const express = require('express');
const { rateLimit } = require("express-rate-limit");
const csv = require('csv-parser');
const app = express();
const cors = require('cors')
const ValidationFunctions = require('./validationFunctions');
const { urlUtils } = require("./utils/urlUtils");
const expressJSDocSwagger = require('express-jsdoc-swagger');
const fetchAiGeneratedContent = require('./runGeminiPrompt');
const axios = require('axios');

// Constants and Error Messages
const requiredParameterResponse = 'Input string required as a parameter.';
const MAX_REQUEST_SIZE = '10mb';  // Maximum request body size (10 megabytes)
const MAX_REQUEST_SIZE_BYTES = 10 * 1024 * 1024;  // 10MB in bytes
const SIZE_LIMIT_ERROR = 'Input exceeds maximum size of 10MB';

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

app.use(cors())
// Middleware to parse JSON request bodies with size limit
app.use(express.json({ 
  limit: MAX_REQUEST_SIZE,
  verify: (req, res, buf) => {
    if (buf.length > MAX_REQUEST_SIZE_BYTES) {
      throw new Error('Request payload too large');
    }
  }
}));
app.use(express.raw({ limit: MAX_REQUEST_SIZE }));
app.set('view engine', 'pug');
// Ensure Express looks in the correct folder
app.set('views', './views');

// Serve static files
app.use(express.static('public'));

// Error handling middleware for payload size errors
app.use((err, req, res, next) => {
  // Check for payload size errors first
  if (err.status === 413 || err.type === 'entity.too.large' || err.message === 'Request payload too large') {
    return res.status(413).json({ error: SIZE_LIMIT_ERROR });
  }
  
  // Then check for syntax errors
  if (err instanceof SyntaxError) {
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  
  next();
});

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
 * Gemini validation request
 * @typedef {object} GeminiValidationRequest
 * @property {string} inputString.required - Input string
 * @property {string} fieldToValidate.required - Field type to validate (i.e email, phone number, etc)
 */

/**
 * Gemini response
 * @typedef {object} GeminiResponse
 * @property {string} result - true if matches field properties to validate, false otherwise
 * @property {string} explanation - how it got to that result
 */

/**
 * Contains request
 * @typedef {object} ContainsRequest
 * @property {string} inputString.required - Input string
 * @property {string} stringContained.required - String contained
 * @property {boolean} caseSensitive.required - Case sensitivity
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
 * A MatchRequest
 * @typedef {object} MatchRequest
 * @property {string} inputString.required - The input string to compare
 * @property {string} comparisonString.required - The string to compare against
 * @property {boolean} [caseSensitive=true] - Whether the comparison should be case-sensitive (default: true)
 */


/**
 * POST /api/isField
 * @summary Returns true/false based on the input string and fieldToValidate
 * @param {GeminiValidationRequest} request.body.required
 * @return {GeminiResponse} 200 - Success response
 * @return {BadRequestResponse} 400 - Bad request response
 * @example request - test
 * {
 *   "inputString": "test@gmail.com",
 *   "fieldToValidate": "email"
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
    res.json({ error: e.message })
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
 * POST /api/contains
 * @summary Checks if inputString contains a supplied string.
 * @description Returns true if the inputString contains the supplied string, otherwise false
 * @param {ContainsRequest} request.body.required - Request body
 * @return {BasicResponse} 200 - Success response with trimmed string
 * @return {BadRequestResponse} 400 - Bad request response
 * @example request - test
 * {
 *   "inputString": "   Hello World!   ",
 *   "containsString": "World",
 *   "caseSensitive": true
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
app.post('/api/contains', (req, res) => {
  const inputString = req.body.inputString;
  const stringContained = req.body.stringContained
  const caseSensitive = req.body.caseSensitive

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  if(!stringContained) {
    return res.status(400).json({error: 'stringContained is a required parameter'})
  }

  // only throw an error if caseSensitive is not passed, which means it's undefiend. 
  // The ! operation won't work because when a boolean is passed, it will flip it, instead of checking if the value exists
  if(caseSensitive === undefined) {
    return res.status(400).json({error: 'caseSensitive is a required parameter'})
  }
  
  const result = ValidationFunctions.contains(inputString, stringContained, caseSensitive)
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
      error: { error: requiredParameterResponse }
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

/**
 * POST /api/isEqual
 * @summary Checks if the input string matches the comparison string
 * @description Compares two strings and returns true if they match. Supports optional case sensitivity.
 * @param {MatchRequest} request.body.required - The request body containing the strings to compare
 * @return {BasicResponse} 200 - Success response with a boolean result indicating if the strings match
 * @return {BadRequestResponse} 400 - Bad request response when input is missing or invalid
 * @example request - case-sensitive match
 * {
 *   "inputString": "Hello",
 *   "comparisonString": "Hello",
 *   "caseSensitive": true
 * }
 * @example response - 200 - example payload
 * {
 *   "result": true
 * }
 * @example request - case-insensitive match
 * {
 *   "inputString": "Hello",
 *   "comparisonString": "hello",
 *   "caseSensitive": false
 * }
 * @example response - 200 - example payload
 * {
 *   "result": true
 * }
 * @example response - 400 - example for missing input string
 * {
 *   "error": "inputString and comparisonString are required."
 * }
 */
app.post('/api/isEqual', (req, res) => {
  const { inputString, comparisonString, caseSensitive = true } = req.body;

  if (!inputString || !comparisonString) {
    return res.status(400).json({ error: "inputString and comparisonString are required." });
  }

  const result = ValidationFunctions.isEqual(inputString, comparisonString, caseSensitive);
  res.json({ result });
});

/**
 * POST /api/isCSV
 * @summary Validates if the input string is a valid CSV format
 * @param {BasicRequest} request.body.required
 * @return {BasicResponse} 200 - Success response
 * @return {BadRequestResponse} 400 - Bad request response
 * @example request - test
 * {
 *   "inputString": "name,age\njohn,30\nsmith,25"
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
app.post('/api/isCSV', (req, res) => {
  const { inputString } = req.body;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  // Check if input size exceeds limit
  if (Buffer.byteLength(inputString, 'utf8') > MAX_REQUEST_SIZE_BYTES) {
    return res.status(413).json({ error: SIZE_LIMIT_ERROR });
  }

  const records = [];
  const csvParser = csv({ headers: false });

  csvParser.on('data', (row) => {
    records.push(row);
  });

  csvParser.on('end', () => {
    res.json({ result: true });
  });

  csvParser.on('error', (err) => {
    console.error(err);
    res.status(500).json({ error: 'Failed to parse CSV data' });
  });

  csvParser.write(inputString);
  csvParser.end();
});

app.get('/', (req, res) => {
  res.render('pages/index', { title: 'Home' });
});

app.get('/about', (req, res) => {
  res.render('pages/about', { title: 'About' });
});

app.get('/contact', (req, res) => {
  res.render('pages/contact', { title: 'Contact' });
});


/**
 * POST /api/isCountry
 * @summary Returns true/false based on the input string and whether it is a valid country
 * @param {BasicRequest} request.body.required
 * @return {BasicResponse} 200 - Success response
 * @return {BadRequestResponse} 400 - Bad request response
 * @example request - test
 * {
 *   "inputString": "United States"
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
app.post('/api/isCountry', async (req, res) => {
  const inputString = req.body.inputString;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  try {
    const reply = await axios.post('https://countriesnow.space/api/v0.1/countries/currency', {
      "country": inputString
    });

    return res.json({ result: reply.data.error === false });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.json({ result: false });
    }

    const error_details = handleAxiosError(error);
    return res.json({ error: error_details });
  }
});

module.exports = app;
