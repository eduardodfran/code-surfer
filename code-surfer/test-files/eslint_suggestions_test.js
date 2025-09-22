// Test file for ESLint suggestions
function testFunction() {
  // var instead of const/let
  var userName = 'John'
  var age = 25
  age = 30 // This will be reassigned

  // String concatenation instead of template literals
  var greeting = 'Hello ' + userName + '!'
  var message = 'Age: ' + age

  // == instead of ===
  if (age == 30) {
    console.log('Age is thirty')
  }

  // indexOf instead of includes
  var fruits = ['apple', 'banana']
  if (fruits.indexOf('apple') !== -1) {
    console.log('Found apple')
  }

  // Function expression instead of arrow function
  fruits.map(function (fruit) {
    return fruit.toUpperCase()
  })

  // Object property not using shorthand
  var userObj = {
    userName: userName,
    age: age,
  }

  // Array access that could use destructuring
  var firstFruit = fruits[0]
  var secondFruit = fruits[1]

  // Nested property access without optional chaining
  var user = { profile: { name: 'John' } }
  if (user && user.profile) {
    console.log(user.profile.name)
  }

  return userObj
}

testFunction()
