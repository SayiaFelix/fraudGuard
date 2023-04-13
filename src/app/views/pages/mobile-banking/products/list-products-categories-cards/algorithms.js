var isValid = function(s) {

  // get string

  // loop over string to check on brackets
  // opening -(- )
  // if closing bracket is wrong return false
  // else go to end of string
  // return true.

  // Example: "())"

  let bracesMap = {};

  for (let i = 0; i < s.length; i ++) {
    console.log(s.length);

    let c = s[i];

    if (c === "(" ) {

      if(c[i+1] ===  ")" | c[i+1] ===  "{" | c[i+1] ===  "[") {

      } else {
        return false;
      }

    //   bracesMap['('] = ++bracesMap['('];
    // } else if(c== "{") {
    //   bracesMap['{'] = ++bracesMap['{'];
    // }else if(c == "[") {
    //   bracesMap['['] = ++bracesMap['['];
    // }


  }

  }

  isValid("[](){}");
}