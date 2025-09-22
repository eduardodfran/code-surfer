// Test JavaScript file for Code Surfer analysis
const fs = require('fs')
const path = require('path')

// This function has issues for testing
async function problematicFunction(data, callback) {
  const unusedVariable = 'This is never used'

  // This async function has no await
  return await unusedVariable
}

function veryLongFunction() {
  // This function will be flagged as too long
  let result = 0
  for (let i = 0; i < 100; i++) {
    if (i > 10) {
      if (i < 50) {
        if (i % 2 === 0) {
          for (let j = 0; j < i; j++) {
            if (j > 5) {
              while (j < 20) {
                j++
                if (j === 15) {
                  break
                }
              }
            }
            result += j
          }
        }
      }
    }
  }
  return result
}

class TestClass {
  constructor(name) {
    this.name = name
  }

  goodMethod() {
    return `Hello, ${this.name}!`
  }
}

// Good practices
const goodFunction = async (items) => {
  try {
    const results = await Promise.all(
      items.map(async (item) => await processItem(item))
    )
    return results
  } catch (error) {
    console.error('Error processing items:', error)
    throw error
  }
}

async function processItem(item) {
  // Simulate async processing
  return new Promise((resolve) => {
    setTimeout(() => resolve((item.processed = true)), 10)
  })
}
