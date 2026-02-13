# 飞书配置说明

## 🚨 重要提示

当前项目已完成基础架构搭建，但飞书数据同步功能需要正确的 `app_token` 才能工作。

## 当前状态

✅ **已完成**:
- 项目框架搭建
- 飞书 API 认证（App ID 和 Secret 已配置）
- 真实数据同步流程

❌ **待完成**:
- 获取正确的多维表格 `app_token`
- 完成飞书数据同步

## 如何获取 app_token

### 方法 1：从多维表格界面获取（最简单）

1. 打开飞书多维表格
2. 点击右上角 **"..."** 菜单
3. 选择 **"高级"** -> **"获取 app_token"**
4. 复制 app_token

### 方法 2：从分享链接获取

1. 点击多维表格的 **"分享"** 按钮
2. 复制链接
3. 链接格式：`https://xxx.feishu.cn/base/{app_token}?table={table_id}`
4. 提取其中的 `app_token`

### 方法 3：创建独立的多维表格

如果当前表格嵌入在知识库中，建议：
1. 创建一个新的独立多维表格
2. 复制数据
3. 使用新表格的 app_token

## 配置步骤

获取到 `app_token` 后，更新 `.env.local`：

```bash
FEISHU_APP_ID=cli_a8f7fa2cdc38d00c
FEISHU_APP_SECRET=xwUmOcayheyUOkMaREp0SdTv0wZFv1cC
FEISHU_APP_TOKEN=<您的 app_token>
FEISHU_TABLE_ID=tblWufNIW5TtO3Am
```

然后运行测试：

```bash
npx tsx src/scripts/test-feishu-correct.ts
```

## 详细文档

查看 `docs/飞书配置指南.md` 了解更多详情。

## 需要帮助？

如果遇到问题，请在 GitHub Issues 中提出。
