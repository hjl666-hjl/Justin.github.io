# Spring Boot快速入门

> 本文将带你从零开始搭建一个Spring Boot Web应用，涵盖项目创建、数据库操作、RESTful API设计等核心内容。

## 什么是Spring Boot？

Spring Boot是Spring框架的简化版，它通过"约定优于配置"的理念，让开发者能够快速搭建Spring应用，无需繁琐的XML配置。

## 1. 创建项目

### 使用Spring Initializr

访问 [start.spring.io](https://start.spring.io/)，选择：

- **Project**: Maven
- **Language**: Java
- **Spring Boot**: 3.x
- **Dependencies**: Spring Web, Spring Data JPA, MySQL Driver

### 项目结构

```
src/
├── main/
│   ├── java/
│   │   └── com/example/demo/
│   │       ├── DemoApplication.java      # 启动类
│   │       ├── controller/               # 控制器层
│   │       ├── service/                  # 服务层
│   │       ├── repository/               # 数据访问层
│   │       └── entity/                   # 实体类
│   └── resources/
│       └── application.yml               # 配置文件
└── test/
```

## 2. 配置数据库

在 `application.yml` 中配置MySQL连接：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/demo?useSSL=false&serverTimezone=UTC
    username: root
    password: 123456
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
```

## 3. 创建实体类

```java
package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 50)
    private String username;
    
    @Column(nullable = false)
    private String email;
    
    private Integer age;
    
    @Column(name = "create_time")
    private LocalDateTime createTime;
}
```

## 4. 创建Repository

```java
package com.example.demo.repository;

import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // 根据用户名查询
    User findByUsername(String username);
    
    // 根据年龄范围查询
    List<User> findByAgeBetween(Integer minAge, Integer maxAge);
    
    // 自定义查询
    @Query("SELECT u FROM User u WHERE u.email LIKE %:keyword%")
    List<User> searchByEmail(@Param("keyword") String keyword);
}
```

## 5. 创建Service

```java
package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    public List<User> findAll() {
        return userRepository.findAll();
    }
    
    public User findById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("用户不存在"));
    }
    
    public User save(User user) {
        user.setCreateTime(LocalDateTime.now());
        return userRepository.save(user);
    }
    
    public void delete(Long id) {
        userRepository.deleteById(id);
    }
}
```

## 6. 创建Controller

```java
package com.example.demo.controller;

import com.example.demo.entity.User;
import com.example.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    // 获取所有用户
    @GetMapping
    public List<User> findAll() {
        return userService.findAll();
    }
    
    // 根据ID获取用户
    @GetMapping("/{id}")
    public User findById(@PathVariable Long id) {
        return userService.findById(id);
    }
    
    // 创建用户
    @PostMapping
    public User create(@RequestBody User user) {
        return userService.save(user);
    }
    
    // 更新用户
    @PutMapping("/{id}")
    public User update(@PathVariable Long id, @RequestBody User user) {
        user.setId(id);
        return userService.save(user);
    }
    
    // 删除用户
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        userService.delete(id);
    }
}
```

## 7. 统一响应格式

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Result<T> {
    private Integer code;
    private String message;
    private T data;
    
    public static <T> Result<T> success(T data) {
        return new Result<>(200, "success", data);
    }
    
    public static <T> Result<T> error(String message) {
        return new Result<>(500, message, null);
    }
}
```

## 8. 运行测试

启动应用后，使用Postman或curl测试API：

```bash
# 获取所有用户
curl http://localhost:8080/api/users

# 创建用户
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"justin","email":"justin@example.com","age":24}'

# 获取单个用户
curl http://localhost:8080/api/users/1

# 删除用户
curl -X DELETE http://localhost:8080/api/users/1
```

## 总结

Spring Boot通过自动配置大大简化了Spring应用的开发流程。本文介绍了：

1. 项目创建与结构
2. 数据库配置
3. 三层架构（Controller-Service-Repository）
4. RESTful API设计

掌握这些基础后，你可以继续学习Spring Security、Spring Cloud等进阶内容。

---

*本文作者：Justin*  
*发布日期：2024-11-20*
