# JavaScript异步编程详解

> 异步编程是JavaScript的核心特性之一，本文将带你从回调函数到Promise，再到async/await，全面理解JS异步编程。

## 为什么需要异步？

JavaScript是单线程语言，如果所有操作都同步执行，遇到耗时操作（如网络请求）时，页面会卡死。异步编程让我们可以在等待耗时操作的同时，继续执行其他代码。

## 1. 回调函数 (Callback)

最早的异步解决方案：

```javascript
function fetchData(callback) {
  setTimeout(() => {
    const data = { name: 'Justin', age: 24 }
    callback(data)
  }, 1000)
}

fetchData(function(data) {
  console.log('获取到数据:', data)
})
```

### 回调地狱问题

当多个异步操作需要顺序执行时，会出现"回调地狱"：

```javascript
fetchUser(function(user) {
  fetchOrders(user.id, function(orders) {
    fetchProducts(orders[0].id, function(products) {
      console.log(products)
      // 继续嵌套...
    })
  })
})
```

## 2. Promise

ES6引入的Promise优雅地解决了回调地狱：

```javascript
function fetchData() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const data = { name: 'Justin', age: 24 }
      resolve(data)
    }, 1000)
  })
}

fetchData()
  .then(data => {
    console.log('获取到数据:', data)
    return fetchMoreData(data.id)
  })
  .then(moreData => {
    console.log('更多数据:', moreData)
  })
  .catch(error => {
    console.error('出错了:', error)
  })
```

### Promise的三种状态

- **Pending**：初始状态，等待中
- **Fulfilled**：操作成功完成
- **Rejected**：操作失败

### 常用方法

```javascript
// 并行执行多个Promise
Promise.all([fetch1(), fetch2(), fetch3()])
  .then(([result1, result2, result3]) => {
    console.log('全部完成')
  })

// 竞速，返回最快的结果
Promise.race([fetch1(), fetch2()])
  .then(fastestResult => {
    console.log('最快的结果:', fastestResult)
  })
```

## 3. Async/Await

ES2017引入的async/await让异步代码看起来像同步代码：

```javascript
async function getData() {
  try {
    const user = await fetchUser()
    const orders = await fetchOrders(user.id)
    const products = await fetchProducts(orders[0].id)
    console.log(products)
  } catch (error) {
    console.error('出错了:', error)
  }
}

getData()
```

### 并行执行优化

```javascript
async function getData() {
  // 串行执行（较慢）
  const user = await fetchUser()
  const config = await fetchConfig()
  
  // 并行执行（更快）
  const [user, config] = await Promise.all([
    fetchUser(),
    fetchConfig()
  ])
}
```

## 实战示例：封装请求函数

```javascript
class Http {
  async get(url) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('请求失败:', error)
      throw error
    }
  }
  
  async post(url, data) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      return await response.json()
    } catch (error) {
      console.error('请求失败:', error)
      throw error
    }
  }
}

// 使用
const http = new Http()
const users = await http.get('/api/users')
```

## 总结

| 方案 | 优点 | 缺点 |
|------|------|------|
| 回调函数 | 简单直接 | 回调地狱，难以维护 |
| Promise | 链式调用，错误处理统一 | 语法稍复杂 |
| Async/Await | 代码清晰，像同步代码 | 需要ES2017+支持 |

**推荐**：现代项目优先使用 async/await，配合 Promise.all 处理并行请求。

---

*本文作者：Justin*  
*发布日期：2024-11-28*
