# 云开发配置指南

## 一、开通云开发环境

1. **登录微信开发者工具**
2. **在项目中开通云开发**
   - 点击工具栏中的"云开发"按钮
   - 开通云开发环境，环境ID设置为 `cloud1`
   - 选择基础版（免费）

## 二、创建数据库集合

在云开发控制台 → 数据库 → 集合管理中创建以下集合：

### 1. users（用户表）
```bash
# 在云开发控制台创建集合
集合名称: users
```

### 2. rooms（房间表）
```bash
集合名称: rooms
```

### 3. room_players（房间玩家表）
```bash
集合名称: room_players
```

### 4. score_records（给分记录表）
```bash
集合名称: score_records
```

### 5. games（游戏记录表）
```bash
集合名称: games
```

### 6. game_players（游戏玩家结果表）
```bash
集合名称: game_players
```

## 三、设置数据库索引

为了提高查询性能，需要为各个集合添加索引：

### users 表索引
- `_openid`（单字段索引，唯一）

### rooms 表索引
- `roomCode`（单字段索引，唯一）
- `ownerId`（单字段索引）
- `status`（单字段索引）
- `createTime`（单字段索引）

### room_players 表索引
- `roomId`（单字段索引）
- `userId`（单字段索引）
- `openid`（单字段索引）
- `roomId,userId`（复合索引）

### score_records 表索引
- `roomId`（单字段索引）
- `gameId`（单字段索引）
- `fromUserId`（单字段索引）
- `toUserId`（单字段索引）
- `createTime`（单字段索引）

### games 表索引
- `roomId`（单字段索引）
- `ownerId`（单字段索引）
- `endTime`（单字段索引）

### game_players 表索引
- `gameId`（单字段索引）
- `userId`（单字段索引）
- `openid`（单字段索引）
- `gameId,userId`（复合索引）

## 四、配置数据库权限

在云开发控制台 → 数据库 → 安全规则中设置权限：

### 默认权限设置
```javascript
// 所有用户可读写自己的数据
{
  "read": true,
  "write": "doc._openid == auth.openid"
}
```

### 特殊权限配置

#### rooms 表权限
```javascript
{
  "read": true,
  "write": "doc.ownerOpenid == auth.openid"
}
```

#### room_players 表权限
```javascript
{
  "read": true,
  "write": "doc.openid == auth.openid"
}
```

## 五、编译和测试

1. **重新编译项目**
```bash
npm run dev:mp-weixin
```

2. **在微信开发者工具中测试**
   - 确保云开发环境已开通
   - 测试用户登录功能
   - 测试房间创建和加入
   - 测试给分功能
   - 测试历史记录

## 六、常见问题

### 1. 云开发初始化失败
- 检查 `main.js` 中的环境ID是否正确
- 确保微信开发者工具中已开通云开发

### 2. 数据库操作失败
- 检查集合是否已创建
- 检查数据库权限配置
- 查看微信开发者工具控制台错误信息

### 3. 用户登录失败
- 确保已配置正确的 AppID
- 检查 `getUserProfile` 接口调用

### 4. 权限不足
- 检查数据库安全规则配置
- 确保用户已正确登录并获取 openid

## 七、部署说明

在正式发布前：

1. **检查所有功能是否正常**
2. **配置正式环境的 AppID**
3. **设置合适的数据库权限**
4. **添加错误处理和日志记录**
5. **进行性能优化**

## 八、升级说明

从本地存储版本升级到云开发版本：

1. **数据迁移**：原本地存储的数据无法自动迁移
2. **用户需要重新登录**
3. **历史记录需要重新生成**
4. **建议在测试环境充分测试后再发布** 