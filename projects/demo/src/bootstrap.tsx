import {render} from 'react-dom'
import RouterComp from 'src/RouterComp'

render(<RouterComp />, document.getElementById('emp-root'))

// class TreasureInfoStore {
//   awardDuration = 2000 // 中奖动画世界
//   treasureInfo: undefined // 宝藏页面信息
//   treasureLevel = 0 // 当前搜寻等级   0.低级   1.高级
// }
/*
console.log('[[[check array from]]]', Array.from('ldskjfkasdflajsdkfjl').keys())
const t = Array.from('ldskjfkasdflajsdkfjl')
console.log('length', t, t.keys())
for (const v of t) {
  console.log(v)
}
const arr = ['a', , 'c']
const sparseKeys = Object.keys(arr)
const denseKeys = [...arr.keys()]
console.log(sparseKeys) // ['0', '2']
console.log(denseKeys) // [0, 1, 2]
//
const array1 = ['a', 'b', 'c']
const iterator = array1.keys()
for (const key of iterator) {
  console.log(key)
}
*/
