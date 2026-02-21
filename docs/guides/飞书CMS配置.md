# 飞书 CMS 与 OSS 配置指南

## 1. 飞书多维表格配置

### 1.1 字段要求与初始化

确保多维表格包含以下字段。如果字段不存在，可运行以下脚本自动创建：

```bash
# 1. 初始化 OSS 文件记录表 (用于存储文件元数据)
npx tsx src/scripts/init-oss-table.ts

# 2. 创建附件字段 (头像、大图)
npx tsx src/scripts/add-attachment-fields.ts

# 3. 创建 OSS URL 回写字段
npx tsx src/scripts/add-oss-fields.ts
```

**主表（故事记录表）核心字段：**
- **头像** (附件): 建议 JPG/PNG, 500x500px
- **大图** (附件): 建议 JPG/PNG, 1920x1080px+
- **头像OSS_URL** (文本): 脚本自动回写
- **大图OSS_URL** (文本): 脚本自动回写
- **状态** (单选): 必须设为 `已发布` (Published) 才会同步

### 1.2 权限设置

1. 在飞书开发者后台创建企业自建应用，启用 `bitable:app:readonly` (读取) 和 `bitable:app` (写入，用于回写URL) 权限。
2. **重要**: 在多维表格右上角 "..." -> "更多" -> "添加应用"，将你的应用添加进去，否则会报 403 错误。

## 2. 阿里云 OSS 配置

### 2.1 环境变量配置 (`.env.local`)

```env
# 飞书配置
FEISHU_APP_ID=cli_...
FEISHU_APP_SECRET=...
FEISHU_APP_TOKEN=...
FEISHU_TABLE_ID=...

# 阿里云 OSS 配置
ALIYUN_OSS_REGION=oss-cn-guangzhou
ALIYUN_OSS_BUCKET=your-bucket-name
ALIYUN_OSS_ACCESS_KEY_ID=your_access_key_id
ALIYUN_OSS_ACCESS_KEY_SECRET=your_access_key_secret
```

### 2.2 Bucket 设置
- **权限**: 公共读 (Public Read)
- **CORS**: 允许来源 `*` (开发调试用)

## 3. 图片上传与同步流程

### 方式一：通过飞书附件上传（推荐）

这是最简单的方式，适合日常使用。

1. **上传图片**: 在飞书表格的“头像”和“大图”字段上传图片。
2. **设置状态**: 将记录的“状态”字段设置为“已发布”。
3. **运行同步**:
   ```bash
   npm run sync
   ```
4. **自动处理**:
   - 脚本会自动下载飞书附件 -> 计算 MD5 -> 上传 OSS。
   - 生成永久 URL -> 回写到飞书表格的 `OSS_URL` 字段。
   - 前端构建时将使用 OSS URL，确保加载速度。

### 方式二：手动上传到 OSS

如果需要手动管理，可直接上传到 OSS 并手动填写 `OSS_URL` 字段。脚本检测到 URL 已存在将跳过上传。

## 4. 文件去重机制

脚本使用文件的 **MD5 哈希** 作为 OSS 文件名 (e.g., `a1b2c3d4... .png`)。
- **优势**: 相同文件多次上传只会存储一份，节省空间。
- **注意**: 如果修改了图片内容，MD5 会变化，将视为新文件上传。
