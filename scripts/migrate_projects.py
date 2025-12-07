import os
import json

projects = [
    {
        "id": "douyin-unfollow",
        "title": "抖音一键取关项目",
        "category": "Automation",
        "description": "Automated script for batch unfollowing on Douyin platform.",
        "image": "./img/p1.png",
        "link": "https://github.com/hjl666-hjl"
    },
    {
        "id": "taobao-snipe",
        "title": "淘宝抢单项目",
        "category": "E-Commerce Script",
        "description": "High-speed automated order sniping system for Taobao.",
        "image": "./img/project/wangyiyun.png",
        "link": "https://github.com/hjl666-hjl"
    },
    {
        "id": "campus-login",
        "title": "自动登录校园网项目",
        "category": "Network Utility",
        "description": "Auto-login script for university campus network authentication.",
        "image": "./img/project/wangzhan.png",
        "link": "https://github.com/hjl666-hjl"
    },
    {
        "id": "dr-strange",
        "title": "Dr. Strange Magic Particles",
        "category": "Interactive 3D",
        "description": "Web-based particle system simulating movie effects using Three.js.",
        "image": "./img/videoback2.jpg",
        "link": "./Three3dTest/index.html"
    },
    {
        "id": "opengl-monument",
        "title": "OpenGL Monument Valley",
        "category": "Computer Graphics",
        "description": "Recreating the Monument Valley scene using C++ and OpenGL.",
        "image": "./img/project3.png",
        "link": "./project3.html"
    },
    {
        "id": "ipv6-tunnel",
        "title": "IPv6 over IPv4 Tunnel",
        "category": "Network Engineering",
        "description": "Campus network traffic optimization and tunneling solution.",
        "image": "./img/project1.png",
        "link": "./project1.html"
    },
    {
        "id": "community-checkin",
        "title": "部分社区自动签到",
        "category": "Automation",
        "description": "Daily automated check-in script for various online communities.",
        "image": "./img/project/tushu.png"
    },
    {
        "id": "waste-classification",
        "title": "安卓垃圾分类软件",
        "category": "Android App",
        "description": "Mobile application helping users classify waste correctly.",
        "image": "./img/box8.gif"
    },
    {
        "id": "ticket-snipe",
        "title": "自动抢票软件",
        "category": "Desktop Software",
        "description": "Desktop application for automated ticket booking.",
        "image": "./img/box7.gif"
    },
    {
        "id": "php-library",
        "title": "PHP图书馆系统",
        "category": "Web System",
        "description": "Full-stack library management system built with PHP.",
        "image": "./img/box3.gif"
    },
    {
        "id": "rsa-encryption",
        "title": "RSA加密算法编写",
        "category": "Security",
        "description": "Implementation of RSA encryption algorithm from scratch.",
        "image": "./img/box4.gif"
    }
]

base_path = "posts/assets"

if not os.path.exists(base_path):
    os.makedirs(base_path)

for p in projects:
    folder_path = os.path.join(base_path, p["id"])
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
    
    # Create info.json
    info = {k: v for k, v in p.items() if k != "id"}
    with open(os.path.join(folder_path, "info.json"), "w", encoding="utf-8") as f:
        json.dump(info, f, ensure_ascii=False, indent=2)
    
    # Create README.md
    readme_content = f"""# {p['title']}

## Project Overview
{p['description']}

> This is a placeholder for the project documentation. 
> Please update this file with detailed project information, installation steps, and usage guides.

## Features
- Feature 1
- Feature 2
- Feature 3

## Tech Stack
- {p['category']}
"""
    with open(os.path.join(folder_path, "README.md"), "w", encoding="utf-8") as f:
        f.write(readme_content)

print("Migration completed.")
