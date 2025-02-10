# Readable Regex API

This API provides endpoints for performing common string manipulation tasks, specifically removing non-numeric and non-letter characters from input strings. It's built using Express.js and designed to encapsulate the underlying regular expression logic for improved readability and maintainability.

Who knows, this API could evolve to do a lot more than it currently does, so please keep an open mind and bring all ideas to the table, they are welcome!

Although the project has Regex in the name, it's not a requirement to use Regex on the backend if it's not possible or beneficial.

## Summary

The API offers two primary functions: removing non-numeric characters and removing non-letter characters from a given string. These functions are accessible via POST requests to dedicated endpoints. The API accepts a JSON payload containing the input string and returns a JSON response with the modified string.

## Benefits

*   **Improved Readability:** Complex regular expressions are hidden behind simple function calls, making the code much easier to understand. Instead of seeing cryptic regex scattered throughout the application, developers interact with clear and descriptive function names.

*   **Enhanced Maintainability:** If the regex logic needs to be updated (e.g., to support different character sets or handle edge cases), changes only need to be made in one central location. This significantly reduces the risk of errors and makes maintenance much simpler.

*   **Increased Reusability:** The API can be used by multiple parts of the same application or even by entirely different applications. This promotes code reuse and reduces redundancy.

*   **Simplified Testing:** The core string manipulation functions are easily testable in isolation, leading to more robust and reliable code.

*   **Abstraction:** The API provides a layer of abstraction, shielding developers from the complexities of regular expressions. Clients of the API don't need to understand the underlying regex to use the string manipulation functions.

## Usage (Example)

Clients interact with the API by sending POST requests with query params containing the input string and endpoint. The API returns a JSON response with the modified string. See the individual endpoint documentation (if needed) for specific request and response formats.

Sample POST Request 

```
    try {
        const response = await fetch("https://readable-regex-8d81b79167bf.herokuapp.com/api/onlyNumbers", {
            method: 'POST',
            body: JSON.stringify({
                inputString: "1234abc"
            }),
            headers: {
                "Content-Type": "application/json"
            }
        })
        const json = await response.json()
        const transformedString = json.result
        document.querySelector('#responseBox').textContent = transformedString // 1234

    }
    catch (exception) {
        alert('Error executing regex, try again later! Contact developer for support')
        throw exception
    }
```

## How to Contribute

1. `git clone` the project locally
2. Create a branch off of the `main` branch and run `git checkout` on that branch
3. Change the base URL locally to `localhost` in the client-side app or when testing to make sure you are testing against the local api
4. Add your changes and validate they are working locally. Add routes as POST.
5. Open a PR to the main branch containing the value of the PR, any screenshots or video recordings to demonstrate the value and any tests that can be added (unit, feature, proof of manual testing)
6. A repo admin/moderator will review the PR along with other contributors. If there is feedback, please address it, commit any changes, and reach out for a rereview.
7. Once approved a repo admin/moderator will merge the PR to `main`, deploying the service to production

### Dev Standards

I want to keep this casual for now, but still want to deliver quality. 

Please at a minimum try to do the following to upkeep the quality of this project: 

1. Write code that is easily readable (small functions, organized files, easy to understand and descriptive function names/files/etc)
2. Test code thoroughly (manually with screenshots or proof of it working or with unit tests if possible)
3. Write JSDoc strings with schemas and endpoint information for each endpoint to generate docs for the API. See the Documentation section for more details below.

## New Features/Issues

We have boards for Discussions and Issues that you can leverage for new ideas, innovations, bug fixes, and enhancements. 

Create new issues for features, innovation ideas, bugs, or enhancements. If you aren't sure about adding an issue, go over to the Discussions board to ask questions, collaborate, and coordinate documenting new issues. 

## Running the API

Using `node`  
```bash
node index.js  // Or npm start Or npm run start
```
Or if you want your backend changes to refresh automatically you can use "nodemon" ( Development Mode )
```bash
nodemon index.js // Or npm run dev
```

## Documentation

We are using the [`express-jsdoc-swagger`](https://brikev.github.io/express-jsdoc-swagger-docs/#/) package to write docs for the API. 

It's utilizing the OpenAPI pattern for API specs and swagger to generate a UI for testing/reading docs.

To view the docs, visit the `/api-docs` path from the base URL. 


[Prod Docs](https://readable-regex-8d81b79167bf.herokuapp.com/api-docs/)

[Local Docs](http://localhost:3000/api-docs/)


## Testing

### Writing tests

We are using the [Jest framework](https://jestjs.io/) for testing.

It's best to write tests for custom logic and not external functions you have not written. 
The goal is to test this API to ensure it's functioning properly. 

Tests will live in the `tests` folder. 

Create a new file for each function or set of related functions you are testing. I.e. `onlyNumbers.js` tests the `onlyNumbers` function

Test edge cases and different scenarios to ensure the function behaves with different inputs for each parameter. 

Tests are configured to run on every push and pull requests for every branch using a Node Github Workflow that builds and runs tests.

### Running tests 

1. Run `npm install` to install any test packages needed
2. Run `npm test` to run the jest tests


## Support

Here is the official Readable Regex [Slack Channel Invite Link](https://join.slack.com/t/readableregex/shared_invite/zt-2zdksij4k-wEYXgPNSFOWXYlNM3CSq0Q)

Collaborate, ask questions, get feedback, and get to know your fellow devs on Slack today!

Please feel free to contact drewg2009@gmail.com for information about contributing, troubleshooting, or other concerns.

## Deployment

Deployed on Heroku Server. Once successfully merged to main branch, auto-deployment is made. 

## Donations

TBD 

To support the deployment, scaling, and distribution of this API (big or small), we will want to gather funds.
The plan for this is pending as this is a very new release
