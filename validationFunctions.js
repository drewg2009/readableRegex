module.exports = class ValidationFunctions {
  // Function to remove all non-numeric characters
  static onlyNumbers(str) {
    return str.replace(/[^0-9]/g, '');
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

  static isCSV(str) {
    const csvRegex = /^(\s*(\w+)\s*,?\s*)+$/;
    return csvRegex.test(str);
  }

  // Function to include only specific characters in input string
  static includeOnlyTheseCharacters(inputString, onlyTheseCharacters) {
    const regex = new RegExp(`[^${onlyTheseCharacters.join("")}]`, "g");
    return inputString.replace(regex, "");
  }
}