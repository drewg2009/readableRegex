const axios = require('axios');
module.exports = class ValidationFunctions {
  // Function to remove all non-numeric characters
  static onlyNumbers(str) {
    return str.replace(/[^0-9]/g, '');
  }

  /**
   * If integer return true, otherwise false
   */
  static isInteger(str) {
    const regex = /^(0|[1-9][0-9]*)$/
    return regex.test(str)
  }

  // Function to remove all non-letter characters (including spaces and punctuation)
  static onlyLetters(str) {
    return str.replace(/[^a-zA-Z]/g, '');
  }

  static onlySpecialCharacters(str) {
    return str.replace(/[a-zA-Z0-9\s]/g, ''); // Keep only special characters
  }

  static isEmailAddress(str) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(str);
  }

  // Function to trim leading and trailing whitespace
  static trim(str) {
    return str.trim();
  }

  // Function to exclude specific characters
  static excludeTheseCharacters(inputString, excludeChars) {
    const regex = new RegExp(`[${excludeChars}]`, "g");
    return inputString.replace(regex, "");
  }

  static isPhoneNumber(str) {
    // A basic phone number regex (you might need to adjust it for your specific needs)
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4}$/im;
    return phoneRegex.test(str);
  }

  static isAlphaNumeric(str) {
    const alphaNumericRegex = /^[a-zA-Z0-9]+$/;
    return alphaNumericRegex.test(str);
  }


  static isZipCode(str, countryCode, patterns) {
    return patterns[countryCode].test(str.replace(/\s/g, ''));
  }

  static isLowercase(str) {
    return /^[a-z]+$/g.test(str);
  }

  static isHexadecimal(str) {
    return /^0x[0-9a-fA-F]+$/.test(str);
  }

  static isDecimal(str) {
    // Allowed decimal: 23.45; 34.; .45; -273.15; -42.; -.45;
    const isDecimalRegex = /^[+-]?((\d+(\.\d*))|(\.\d+))$/;
    return isDecimalRegex.test(str);
  }

  static isBinaryString(str) {
    const regex = new RegExp("^[01]+$");
    return regex.test(str);
  }

  static isAllCaps(str) {
    return /^[A-Z]+$/.test(str);
  }

  static isUrl(str) {
    return /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,6})(\/[^\s]*)?$/i.test(str);
  }

  static isDate(dateStr) {
    if (!dateStr || typeof dateStr !== "string") return false;

    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return true;

    const dateFormats = [
      /^\d{4}-\d{2}-\d{2}$/,                   // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/,                 // MM/DD/YYYY or DD/MM/YYYY
      /^\d{4}\/\d{2}\/\d{2}$/,                 // YYYY/MM/DD
      /^\d{2}-\d{2}-\d{4}$/,                   // DD-MM-YYYY or MM-DD-YYYY
      /^\d{4}\.\d{2}\.\d{2}$/,                 // YYYY.MM.DD
      /^\d{2}\.\d{2}\.\d{4}$/,                 // DD.MM.YYYY or MM.DD.YYYY
      /^\d{8}$/,                               // YYYYMMDD
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/  // YYYY-MM-DD HH:mm:ss
    ];

    return dateFormats.some((regex) => regex.test(dateStr));
  }

  // Function to include only specific characters in input string
  static includeOnlyTheseCharacters(inputString, onlyTheseCharacters) {
    const regex = new RegExp(`[^${onlyTheseCharacters.join("")}]`, "g");
    return inputString.replace(regex, "");
  }

  static isBoolean(inputString) {
    const validBooleanValues = ['true', 'false', '0', '1', 'TRUE', 'FALSE', 'True', 'False']
    return validBooleanValues.includes(inputString)
  }

  static isEqual(str, comparison, caseSensitive = true) {
    if (typeof str !== "string" || typeof comparison !== "string") {
      return false;
    }
    return caseSensitive ? str === comparison : str.toLowerCase() === comparison.toLowerCase();
  }

  /**
   * Return if inputString contains stringContained
   * True if it contains it, false otherwise
   * 
   * If case sensitive, compare them as is,
   * Else if not case sensitive, convert them both to lowercase to compare them as the same casing
   * 
   * @param {string} inputString 
   * @param {string} stringContained 
   * @param {boolean} caseSensitive 
   * 
   * return {boolean} - True if inputString contains stringContained, false otherwise
   */
  static contains(inputString, stringContained, caseSensitive) {
    if(!caseSensitive) {
      inputString = inputString.toLowerCase()
      stringContained = stringContained.toLowerCase()
    }

    return inputString.includes(stringContained)
  }

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