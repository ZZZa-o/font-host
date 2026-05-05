# Font Host

一个轻量的自托管字体服务，上传字体文件后自动生成 `@font-face`  链接。

## 项目结构

```
font-host/
├── server.js          # Express 服务端
├── public/
│   └── index.html     # 字体管理界面
├── fonts/             # 字体存储目录（自动创建）
└── package.json
```

## 快速开始

```bash
npm install
npm start
```

服务默认运行在 `http://localhost:3000`。

## 环境变量

| 变量       | 默认值    | 说明                              |
|------------|-----------|-----------------------------------|
| `PORT`     | `3000`    | 监听端口                          |
| `FONT_DIR` | `./fonts` | 字体文件存储目录（建议挂载持久卷）|

## 支持格式

`.ttf` · `.otf` · `.woff` · `.woff2`（单文件上限 50 MB）

## 接口说明

### CSS 接口

| 方法 | 路径             | 说明                                        |
|------|------------------|---------------------------------------------|
| GET  | `/css`           | 返回所有字体的 `@font-face` 汇总 CSS        |
| GET  | `/css/:filename` | 返回指定字体的 `@font-face` CSS             |
| GET  | `/fonts/:filename` | 字体文件直链                              |

`/css` 支持 `?base=https://your-domain.com` 参数，用于生成带完整域名的字体 URL。

### REST API

| 方法   | 路径               | 说明                              |
|--------|--------------------|-----------------------------------|
| GET    | `/api/fonts`       | 获取字体列表（含元数据）          |
| POST   | `/api/upload`      | 上传字体（`multipart`，字段名 `font`）|
| DELETE | `/api/fonts/:name` | 删除指定字体                      |


## 部署

### Zeabur

1. 将项目推送到 Git 仓库
2. 在 Zeabur 创建服务并连接仓库
3. 添加持久化存储，挂载路径设为 `/app/fonts`（或通过 `FONT_DIR` 指定其他路径）
4. 设置环境变量 `PORT`（Zeabur 会自动注入，通常无需手动设置）

### Render

1. 将项目推送到 Git 仓库
2. 在 Render 创建 **Web Service**，连接仓库
3. 配置如下：

   | 字段             | 值              |
   |------------------|-----------------|
   | Runtime          | Node            |
   | Build Command    | `npm install`   |
   | Start Command    | `npm start`     |

4. 在 **Environment** 中添加环境变量：

   | 变量       | 值         |
   |------------|------------|
   | `FONT_DIR` | `/data/fonts` |

5. 在 **Disks** 中添加持久化磁盘：
   - Mount Path：`/data`
   - 建议容量：1 GB 起（视字体数量而定）

> ⚠️ Render 免费套餐不支持持久化磁盘，服务重启后字体文件会丢失。如需长期使用，请升级到付费套餐。

## 管理界面

访问根路径 `/` 即可打开内置的字体管理页面，支持：

- 点击或拖拽批量上传字体
- 实时上传进度显示
- 使用实际字体渲染的预览文本
- 一键复制 CSS 链接 / 字体直链
- 删除字体
