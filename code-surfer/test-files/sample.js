// Test file with various issues for Code Surfer to detect

// 1. Unused variable (should be detected)
const unusedVar = 'This variable is never used'

// 2. Async function without await (should be detected)
async function asyncWithoutAwait() {
  console.log('This async function has no await')
  return 42
}

// 3. Long function (should be detected as code smell)
function longFunction() {
  // This function is intentionally long to trigger the long function rule
  console.log('Line 1')
  console.log('Line 2')
  console.log('Line 3')
  console.log('Line 4')
  console.log('Line 5')
  console.log('Line 6')
  console.log('Line 7')
  console.log('Line 8')
  console.log('Line 9')
  console.log('Line 10')
  console.log('Line 11')
  console.log('Line 12')
  console.log('Line 13')
  console.log('Line 14')
  console.log('Line 15')
  console.log('Line 16')
  console.log('Line 17')
  console.log('Line 18')
  console.log('Line 19')
  console.log('Line 20')
  console.log('Line 21')
  console.log('Line 22')
  console.log('Line 23')
  console.log('Line 24')
  console.log('Line 25')
  console.log('Line 26')
  console.log('Line 27')
  console.log('Line 28')
  console.log('Line 29')
  console.log('Line 30')
  console.log('Line 31')
  console.log('Line 32')
  console.log('Line 33')
  console.log('Line 34')
  console.log('Line 35')
  console.log('Line 36')
  console.log('Line 37')
  console.log('Line 38')
  console.log('Line 39')
  console.log('Line 40')
  console.log('Line 41')
  console.log('Line 42')
  console.log('Line 43')
  console.log('Line 44')
  console.log('Line 45')
  console.log('Line 46')
  console.log('Line 47')
  console.log('Line 48')
  console.log('Line 49')
  console.log('Line 50')
  console.log('Line 51')
  console.log('Line 52')
  console.log('Line 53')
  console.log('Line 54')
  console.log('Line 55')
  return 'This function is way too long!'
}

// 4. Good code (should not trigger any issues)
async function goodAsyncFunction() {
  const data = await fetch('/api/data')
  return data.json()
}

function usedVariableExample() {
  const usedVar = 'This variable is used'
  console.log(usedVar)
  return usedVar
}

// Export to avoid "unused" warnings in some contexts
export { goodAsyncFunction, usedVariableExample }
