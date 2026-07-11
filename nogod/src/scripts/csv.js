const CSV = (module => {

  module.castValue = (key, val, referenceObj) => {
    if (val === undefined || val === null || val === '') return val
    
    const ref = referenceObj[key]
    if (typeof ref === 'number') return parseFloat(val) || 0
    if (typeof ref === 'boolean') return val.toLowerCase() === 'true' || val === '1'
    return val
  }

  module.parse = text => {
    const result = []
    let row = []
    let inQuotes = false
    let currentVal = ''

    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const nextChar = text[i + 1]

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          currentVal += '"'
          i++ // skip next quote
        } else if (char === '"') {
          inQuotes = false
        } else {
          currentVal += char
        }
      } else {
        if (char === '"') {
          inQuotes = true
        } else if (char === ',') {
          row.push(currentVal)
          currentVal = ''
        } else if (char === '\n') {
          row.push(currentVal)
          result.push(row)
          row = []
          currentVal = ''
        } else if (char !== '\r') {
          currentVal += char
        }
      }
    }
    
    row.push(currentVal)
    result.push(row)
    
    // Filter out completely empty rows
    const final =  result.filter(r => r.some(cell => cell.trim() !== ''))
    console.log(final)
    return final
  }

  return module

})({})

window.CSV = CSV