// This should trigger unused variable warning
const unusedVar = 'never used'

// This should trigger async without await warning
async function badAsync() {
  console.log('no await here')
  return 42
}

// Good code (no issues)
function goodFunction() {
  const used = 'this is used'
  console.log(used)
}

const name = "Eduardo"