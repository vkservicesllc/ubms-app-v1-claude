function sortArrayByObjectKey(array, key, asc = true) {

    return array.sort(function(a, b) {
        var x = a[key]
        var y = b[key]
        
        if (typeof x === 'string') x = x.toLowerCase()
        if (typeof y === 'string') y = y.toLowerCase()
        
        if (x < y) return asc === true ? -1 : 1
        if (x > y) return asc === true ? 1 : -1
        return 0
    })
}


function sortObjectByKey(obj, sortOrder = 'asc') {
    const sortedKeys = Object.keys(obj).sort((a, b) => {
      if (sortOrder === 'asc') return a.localeCompare(b)
      else if (sortOrder === 'desc') return b.localeCompare(a)
    })
  
    const sortedObj = sortedKeys.reduce((sorted, key) => {
      sorted[key] = obj[key]
      return sorted
    }, {})
  
    return sortedObj
}


function sortObjectByValue(obj, sortOrder = 'asc') {
    const sortedEntries = Object.entries(obj).sort((a, b) => {
      let x = 1, y = -1

      if (sortOrder == 'desc') {
        x = -1
        y = 1
      }

      if (a[1] > b[1]) return x
      else if (a[1] < b[1]) return y
      else return 0
    })
  
    const sortedObj = Object.fromEntries(sortedEntries)
  
    return sortedObj
}


export { sortArrayByObjectKey, sortObjectByKey, sortObjectByValue }