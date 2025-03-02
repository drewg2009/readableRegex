const axios = require('axios');
module.exports = class ValidationFunctions {
  /**
   * Removes all non-numeric characters from a string.
   * 
   * @param {string} str - The input string to be cleaned.
   * @returns {string} - A new string containing only numeric characters (0-9).
   */
  static onlyNumbers(str) {
    return str.replace(/[^0-9]/g, '');
  }

  /**
   * Checks if a string represents a valid positive integer.
   * 
   * This function will return `true` if the string represents a valid integer.
   * (i.e., a non-negative whole number). Leading zeros are not allowed except for '0'.
   * 
   * @param {string} str - The input string to test.
   * @returns {boolean} - True if the string represents a valid integer, otherwise `false`.
   */
  static isInteger(str) {
    const regex = /^(0|[1-9][0-9]*)$/
    return regex.test(str)
  }

  /**
   * Removes all non-letter characters from a string.
   * This strips away spaces, punctuation, numbers, and any other non-alphabetical characters.
   * 
   * @param {string} str - The input string to be cleaned
   * @returns {string} - A new string containing only alphabetical characters (a-z, A-Z).
   */
  static onlyLetters(str) {
    return str.replace(/[^a-zA-Z]/g, '');
  }

  /**
   * Removes all alphanumberic characters and spaces, leaving only special characters.
   * 
   * @param {string} str - The input string to filter.
   * @returns {string} - A new string contaninig only special characters (anything that is not a letter, number, or space).
   */
  static onlySpecialCharacters(str) {
    return str.replace(/[a-zA-Z0-9\s]/g, '');
  }

  /**
   * Validates if the proviced string is a valid email address.
   * The email must follow the pattern "local-part@domain".
   * 
   * @param {string} str - The input email to check.
   * @returns {boolean} - Returns `true` if the string is a valid email address, otherwise `false`
   */
  static isEmailAddress(str) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check for valid email pattern
    if (emailRegex.test(str)) {
      // Check for consecutive dots in the domain part
      const domainPart = str.split('@')[1];
      if (domainPart.includes('..')) {
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Trims leading and trailing whitespace from a given string.
   * 
   * @param {string} str - The input string to trim.
   * @returns {string} - A new string with leading and trailing whitespace removed.
   */
  static trim(str) {
    return str.trim();
  }

  /**
   * Removes specific characters from a string based on a provided list of characters to exclude.
   * 
   * @param {string} inputString - The input string from which characters will be removed.
   * @param {string} excludeChars - A string containing the characters to exclude from the inputString.
   * @returns {string} - A new string with the excluded characters removed.
   */
  static excludeTheseCharacters(inputString, excludeChars) {
    const regex = new RegExp(`[${excludeChars}]`, "g");
    return inputString.replace(regex, "");
  }

  /**
   * Validates whether a given string is a valid phone number using a basic regex pattern.
   * 
   * @param {string} str - The string to validate as a phone number.
   * @returns {boolean} - Returns `true` if the string matches the phone number pattern, otherwise `false`.
   * 
   */
  static isPhoneNumber(str) {
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4}$/im;
    return phoneRegex.test(str);
  }

  /**
   * Checks if the given string contains only alphanumeric characters (letters and numbers).
   * 
   * This function checks if the input string contains only letters (both uppercase and lowercase)
   * and numbers (digits 0-9). It will return `true` if the string contains only alphanumeric characters,
   * and `false` otherwise.
   * 
   * @param {string} str - The string to be checked.
   * @returns {boolean} - Returns `true` if the string is alphanumeric, `false` otherwise.
   * 
   * @example
   * isAlphaNumeric('abc123');  // Returns true
   * isAlphaNumeric('abc 123'); // Returns false (contains space)
   * isAlphaNumeric('abc!123'); // Returns false (contains special character)
   */
  static isAlphaNumeric(str) {
    const alphaNumericRegex = /^[a-zA-Z0-9]+$/;
    return alphaNumericRegex.test(str);
  }

  /**
   * Checks if the given string is a valid zip code for a specific country.
   * 
   * This function validates the zip code against a predefined pattern for the specified country.
   * It removes any spaces from the input string before testing it against the pattern.
   * 
   * @param {string} str - The string to be checked (zip code).
   * @param {string} countryCode - The country code (e.g., 'US', 'CA').
   * @returns {boolean} - Returns `true` if the zip code matches the pattern for the given country, `false` otherwise.
   * 
   * @example
   * isZipCode('12345', 'US');  // Returns true
   * isZipCode('K1A 0B1', 'CA'); // Returns true
   * isZipCode('123-45', 'US');  // Returns false
   */
  static isZipCode(str, countryCode) {
    const patterns = {
      US: /^\d{5}(-\d{4})?$/,
      UK: /^[A-Z]{1,2}\d[A-Z\d]?(\s?\d[A-Z]{2})$/i,
      CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
      AU: /^\d{4}$/,
      DE: /^\d{5}$/,
      FR: /^\d{5}$/,
      JP: /^\d{3}-\d{4}$/,
      BR: /^\d{5}-\d{3}$/,
      IN: /^[1-9]\d{5}$/
    };

    // Ensure the input string and country code are valid
    if (!str || !countryCode) return false;

    // Normalize country code to uppercase
    const upperCountryCode = countryCode.toUpperCase();

    // Check if the country code has a corresponding pattern
    if (!patterns[upperCountryCode]) return false;

    // Clean the input string and validate it using the respective pattern
    return patterns[upperCountryCode].test(str.replace(/\s+/g, ''));  // Remove spaces and check
  }

  /**
   * Checks if the given string contains only lowercase letters.
   * 
   * This function validates whether the input string contains only lowercase alphabetical characters (a-z).
   * It returns `true` if the string consists entirely of lowercase letters, and `false` otherwise.
   * 
   * @param {string} str - The string to be checked.
   * @returns {boolean} - Returns `true` if the string contains only lowercase letters, `false` otherwise.
   * 
   * @example
   * isLowercase('hello');  // Returns true
   * isLowercase('Hello');  // Returns false
   * isLowercase('123abc'); // Returns false
   */
  static isLowercase(str) {
    return /^[a-z]+$/g.test(str);
  }

  /**
   * Checks if the given string is a valid hexadecimal number (with `0x` prefix).
   * 
   * This function validates whether the input string matches the format of a hexadecimal number, 
   * which starts with `0x` or `0X` followed by one or more characters in the range `0-9`, `a-f`, or `A-F`.
   * 
   * @param {string} str - The string to be checked.
   * @returns {boolean} - Returns `true` if the string is a valid hexadecimal number, `false` otherwise.
   * 
   * @example
   * isHexadecimal('0x1a3f');   // Returns true
   * isHexadecimal('0XABC123'); // Returns false
   * isHexadecimal('0xABC123'); // Returns true
   * isHexadecimal('1a3f');     // Returns false
   * isHexadecimal('0xg123');   // Returns false
   */
  static isHexadecimal(str) {
    return /^0x[0-9a-fA-F]+$/.test(str);
  }

  /**
   * Checks if the given string is a valid decimal number.
   * 
   * This function validates whether the input string represents a valid decimal number, including positive and negative decimals,
   * integers, and numbers with or without a decimal point.
   * 
   * Supported formats:
   * - `23.45` (valid)
   * - `34.` (valid)
   * - `.45` (valid)
   * - `-273.15` (valid)
   * - `-42.` (valid)
   * - `-.45` (valid)
   * - `23` (valid)
   * - `+34` (valid)
   * - `-+34` (invalid)
   * 
   * @param {string} str - The string to be checked (decimal number).
   * @returns {boolean} - Returns `true` if the string is a valid decimal number, `false` otherwise.
   * 
   * @example
   * isDecimal('23.45'); // Returns true
   * isDecimal('34.');   // Returns true
   * isDecimal('.45');   // Returns true
   * isDecimal('-273.15'); // Returns true
   * isDecimal('-42.');   // Returns true
   * isDecimal('23');     // Returns true
   * isDecimal('-.45');   // Returns true
   * isDecimal('34');     // Returns true
   * isDecimal('-+34');   // Returns false
   * isDecimal('34abc');  // Returns false
   */
  static isDecimal(str) {
    const isDecimalRegex = /^[+-]?(\d+(\.\d*)?|\.\d+)$/;
    return isDecimalRegex.test(str);
  }

  /**
   * Validates if the given string is a binary string (contains only '0' and '1').
   * 
   * @param {string} str - The string to be tested.
   * @returns {boolean} - Returns `true` if the string is a valid binary string, otherwise `false`.
   */
  static isBinaryString(str) {
    const regex = new RegExp("^[01]+$");
    return regex.test(str);
  }

  /**
   * Validates if the given string contains only uppercase letters (A-Z).
   * 
   * @param {string} str - The string to be tested.
   * @returns {boolean} - Returns `true` if the string contains only uppercase letters, otherwise `false`.
   */
  static isAllCaps(str) {
    return /^[A-Z]+$/.test(str);
  }

  /**
   * Validates if the given string is a valid URL.
   * Supports optional protocols (http:// or https://), domain names, and optional paths.
   * 
   * @param {string} str - The string to be tested.
   * @returns {boolean} - Returns `true` if the string is a valid URL, otherwise `false`.
   */
  static isUrl(str) {
    return /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,6})(\/[^\s]*)?$/i.test(str);
  }

  /**
   * Validates if the given string is a valid date in multiple formats.
   * Supports formats like:
   * - YYYY-MM-DD
   * - MM/DD/YYYY or DD/MM/YYYY
   * - YYYY/MM/DD
   * - DD-MM-YYYY or MM-DD-YYYY
   * - YYYY.MM.DD
   * - DD.MM.YYYY or MM.DD.YYYY
   * - YYYYMMDD
   * - YYYY-MM-DD HH:mm:ss (with time)
   * 
   * @param {string} dateStr - The string to be tested.
   * @returns {boolean} - Returns `true` if the string matches any valid date format, otherwise `false`.
   */
  static isDate(dateStr) {
    if (!dateStr || typeof dateStr !== "string") return false;

    const dateFormats = [
      /^\d{4}-\d{2}-\d{2}$/,                   // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/,                 // MM/DD/YYYY or DD/MM/YYYY
      /^\d{4}\/\d{2}\/\d{2}$/,                 // YYYY/MM/DD
      /^\d{2}-\d{2}-\d{4}$/,                   // DD-MM-YYYY or MM-DDYYYY
      /^\d{4}\.\d{2}\.\d{2}$/,                 // YYYY.MM.DD
      /^\d{2}\.\d{2}\.\d{4}$/,                 // DD.MM.YYYY or MM.DD.YYYY
      /^\d{8}$/,                               // YYYYMMDD
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/  // YYYY-MM-DD HH:mm:ss
    ];

    // Check for valid date formats
    const isValidFormat = dateFormats.some((regex) => regex.test(dateStr));

    // Ensure that the string only uses a single separator type (e.g., no mixed separators like - and /)
    const invalidSeparators = /[-/.\s]{2,}/; // Match any consecutive mixed separators (e.g., "2025-02/23")
    const hasInvalidSeparators = invalidSeparators.test(dateStr);

    return isValidFormat && !hasInvalidSeparators;
  }

  /**
   * Filters the input string to include only the specified characters.
   *
   * This function removes any characters from `inputString` that are not present in 
   * the `onlyTheseCharacters` array.
   *
   * @param {string} inputString - The original string to be filtered.
   * @param {string[]} onlyTheseCharacters - An array of characters that should be kept in the output string.
   * @returns {string} - A new string containing only the allowed characters.
   */
  static includeOnlyTheseCharacters(inputString, onlyTheseCharacters) {
    const regex = new RegExp(`[^${onlyTheseCharacters.join("")}]`, "g");
    return inputString.replace(regex, "");
  }

  /**
   * Checks if the given input string represents a valid boolean value.
   *
   * This function considers the following values as valid booleans:
   * - String representations: `"true"`, `"false"`, `"TRUE"`, `"FALSE"`, `"True"`, `"False"`
   * - Numeric representations: `"0"` (false), `"1"` (true)
   *
   * @param {string} inputString - The string to check.
   * @returns {boolean} - `true` if the input string is a valid boolean representation, otherwise `false`.
   *
   * @example
   * isBoolean("true"); // Returns: true
   * isBoolean("false"); // Returns: true
   * isBoolean("TRUE"); // Returns: true
   * isBoolean("1"); // Returns: true
   * isBoolean("yes"); // Returns: false
   * isBoolean("maybe"); // Returns: false
   * isBoolean("False"); // Returns: true
   * isBoolean("0"); // Returns: true
   */
  static isBoolean(inputString) {
    const validBooleanValues = ['true', 'false', '0', '1', 'TRUE', 'FALSE', 'True', 'False']
    return validBooleanValues.includes(inputString)
  }

  /**
   * Checks if two strings are equal, with an option for case sensitivity.
   *
   * This function compares two strings and determines whether they are equal. 
   * By default, the comparison is case-sensitive, but it can be made case-insensitive 
   * by setting `caseSensitive` to `false`.
   *
   * @param {string} str - The first string to compare.
   * @param {string} comparison - The second string to compare.
   * @param {boolean} [caseSensitive=true] - Whether the comparison should be case-sensitive.
   * @returns {boolean} - `true` if the strings are equal based on the comparison settings, otherwise `false`.
   *
   * @example
   * isEqual("hello", "hello"); // Returns: true
   * isEqual("hello", "Hello"); // Returns: false (case-sensitive)
   * isEqual("hello", "Hello", false); // Returns: true (case-insensitive)
   * isEqual("world", "World", true); // Returns: false
   * isEqual("world", "World", false); // Returns: true
   * isEqual("test", 123); // Returns: false (invalid input type)
   */
  static isEqual(str, comparison, caseSensitive = true) {
    if (typeof str !== "string" || typeof comparison !== "string") {
      return false;
    }
    return caseSensitive ? str === comparison : str.toLowerCase() === comparison.toLowerCase();
  }

  /**
   * Checks whether `inputString` contains `stringContained`.
   *
   * Returns `true` if `inputString` includes `stringContained`, otherwise returns `false`.
   * The comparison can be case-sensitive or case-insensitive.
   *
   * @param {string} inputString - The main string in which to search.
   * @param {string} stringContained - The substring to check for within `inputString`.
   * @param {boolean} [caseSensitive=true] - Whether the comparison should be case-sensitive (default: true).
   * @returns {boolean} - `true` if `inputString` contains `stringContained`, otherwise `false`.
   *
   * @example
   * contains("Hello World", "world"); // Returns: false (case-sensitive by default)
   * contains("Hello World", "world", false); // Returns: true (case-insensitive)
   * contains("JavaScript", "script", true); // Returns: false (case-sensitive)
   * contains("JavaScript", "Script", false); // Returns: true (case-insensitive)
   */
  static contains(inputString, stringContained, caseSensitive = true) {
    if (!caseSensitive) {
      inputString = inputString.toLowerCase()
      stringContained = stringContained.toLowerCase()
    }

    return inputString.includes(stringContained)
  }

  /**
   * Checks whether the given `inputString` is a valid country name.
   *
   * Sends a request to an external API to verify if the provided `inputString` matches a recognized country.
   *
   * @param {string} inputString - The name of the country to validate.
   * @returns {Promise<boolean>} - Resolves to `true` if `inputString` is a valid country, otherwise `false`.
   *
   * @throws {Error} - Throws an error if the request fails for reasons other than a 404 response.
   *
   * @example
   * await isCountry("France"); // Returns: true
   * await isCountry("Atlantis"); // Returns: false
   * await isCountry(""); // Returns: false
   */
  static async isCountry(inputString) {
    try {
      const reply = await axios.post('https://countriesnow.space/api/v0.1/countries/currency', {
        "country": inputString
      });

      return reply.data.error === false;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return false;
      }

      const error_details = handleAxiosError(error);
      throw new Error(error_details);
    }
  }
}

const handleAxiosError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    return `Error ${error.response.status}: ${error.response.data.message}`;
  } else if (error.request) {
    // The request was made but no response was received
    return 'No response received from the server';
  } else {
    // Something happened in setting up the request that triggered an Error
    return `Error: ${error.message}`;
  }
};