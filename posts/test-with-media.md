# 多媒体测试文章

> 这是一篇测试文章，用于演示博客系统对图片、视频、音频等多媒体文件的支持。

## 图片展示

下面是一个示例图片：

![示例图片](./assets/demo-image.svg)

你也可以使用外部图片链接：

![Vue Logo](https://vuejs.org/images/logo.svg)

## 代码示例

### JavaScript 代码

```javascript
// 一个简单的异步函数示例
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();
    console.log('用户数据:', data);
    return data;
  } catch (error) {
    console.error('获取用户数据失败:', error);
    throw error;
  }
}

// 使用示例
fetchUserData(123).then(user => {
  console.log(`欢迎, ${user.name}!`);
});
```

### Python 代码

```python
# Python 装饰器示例
def timer(func):
    import time
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f'{func.__name__} 执行耗时: {end - start:.2f}秒')
        return result
    return wrapper

@timer
def slow_function():
    import time
    time.sleep(2)
    return "完成"

slow_function()
```

### HTML 代码

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>示例页面</title>
  <style>
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello World</h1>
    <p>这是一个示例页面</p>
  </div>
</body>
</html>
```

## 表格展示

| 技术栈 | 用途 | 熟练度 |
|--------|------|--------|
| Vue.js | 前端框架 | ⭐⭐⭐⭐⭐ |
| Spring Boot | 后端框架 | ⭐⭐⭐⭐ |
| MySQL | 数据库 | ⭐⭐⭐⭐ |
| Docker | 容器化 | ⭐⭐⭐ |
| Kubernetes | 容器编排 | ⭐⭐ |

## 列表展示

### 无序列表

- 第一项内容
- 第二项内容
  - 嵌套项 A
  - 嵌套项 B
- 第三项内容

### 有序列表

1. 首先，准备开发环境
2. 然后，创建项目结构
3. 接着，编写核心代码
4. 最后，测试和部署

## 引用块

> 代码是写给人看的，顺便能在机器上运行。
> 
> —— Donald Knuth

## 文本样式

这是一段普通文本，其中包含 **粗体文字**、*斜体文字*、~~删除线文字~~ 和 `行内代码`。

你也可以使用 [链接文字](https://github.com) 来添加超链接。

## 分割线

---

## 总结

通过这篇测试文章，我们验证了博客系统对以下功能的支持：

1. ✅ Markdown 基础语法
2. ✅ 代码高亮（多语言）
3. ✅ 图片展示
4. ✅ 表格渲染
5. ✅ 列表（有序/无序）
6. ✅ 引用块
7. ✅ 文本样式

---

*本文作者：Justin*  
*发布日期：2024-12-04*
