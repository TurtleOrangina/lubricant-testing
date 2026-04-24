# Lubricant Testing

In this project we are building a small web page that visualizes testing data
from bicycle chain lubricant tests in a accessible and modern way.

## Test data

- Product name
- Product category (one of: immersive wax, wax drip, wet-drip)
- Product cost (in AUD)
- Main Test: Chain wear rate during for each of (up to) 6 stages of 1000km each:
  - Block 1 - No Contamination
  - Block 2 - Dry Offroad conditions
  - Block 3 - No Contamination
  - Block 4 - Wet conditions riding
  - Block 5 - No Contamination
  - Block 6 - Harsh wet conditions riding
- Single Application Logevity. The two numbers "wear rate jump point [km]" and the "total wear allowance [km]" for each of the three conditions:
  - Dry Road
  - Dry Gravel
  - Extreme Conditions

Note that partially filled data is possible:

- product name and category should always exist.
- cost can be missing/unknown
- Main test can be entirely missing
- If the main test is not missing, it will not always contains all blocks, if the test had to be aborted at some point the following blocks will be missing/unset. But no block will ever be skipped.
- Each of the three conditions of the single application longevity test can be missing, but if a condition is not missing, it should always contain the two numbers (jump point and wear allowance).

## Tech stack

- echarts for interactive plots/charts
- vue
- html/css/typescript
- hard-code the test data and not use a API/database yet
- vite (and single file building to ship a single html file to the customer)
- yarn
- Automatic code formatting
- Linting via oxlint
- Type checking via vue-tsc

## Philosophy

- Use state of the art modern tools and libraries
- Use best practices where possible
- Clean code, use type annotations and modern language features to avoid
  complicated or error prone code.
