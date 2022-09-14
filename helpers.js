module.exports = {
  encodeStr: function (str) {
    let charCodeArr = [];
    for (let i = 0; i < str.length; i++) {
      let code = str.charCodeAt(i);
      charCodeArr.push(code);
    }
    return charCodeArr;
  },
  decodeCharCodes: function (codes) {
    const charArr = codes.split(" ");
    return String.fromCharCode(...charArr);
  },
};
