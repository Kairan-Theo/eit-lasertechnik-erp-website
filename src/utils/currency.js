export function THBText(num) {
  if (!num || num === 0) return "ศูนย์บาทถ้วน"
  num = Number(num).toFixed(2)
  let [baht, satang] = num.split(".")
  const thaiNum = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"]
  const unit = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"]

  function convert(n) {
    let res = ""
    let len = n.length
    for (let i = 0; i < len; i++) {
      let digit = parseInt(n.charAt(i))
      let pos = len - i - 1
      if (digit !== 0) {
        if (pos === 0 && digit === 1 && len > 1) res += "เอ็ด"
        else if (pos === 1 && digit === 2) res += "ยี่"
        else if (pos === 1 && digit === 1) res += ""
        else res += thaiNum[digit]

        if (pos === 0) res += ""
        else if (pos === 1) res += "สิบ"
        else res += unit[pos]
      }
    }
    return res
  }

  let text = ""
  if (parseInt(baht) > 0) {
    if (baht.length > 6) {
       let millions = baht.substring(0, baht.length - 6)
       let remainder = baht.substring(baht.length - 6)
       text += convert(millions) + "ล้าน" + convert(remainder)
    } else {
       text += convert(baht)
    }
    text += "บาท"
  }

  if (parseInt(satang) > 0) {
    text += convert(satang) + "สตางค์"
  } else {
    text += "ถ้วน"
  }
  return text
}
