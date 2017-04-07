function sum (x) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log('done')
      return resolve(1000)
    }, 1000)
  })
}


var clients = Array.from({length: 10}, (v, k) => k+1).map(client => {
  return sum(client)
})
setTimeout(() => {
  Promise.all(clients).then(x => {
    console.log('all donde')
  })
}, 5000)
