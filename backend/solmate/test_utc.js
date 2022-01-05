var date = new Date
var now = Math.floor(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(), date.getUTCDate() , 
      date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds())/1000)

console.log(now)