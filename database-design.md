# 计分助手小程序 - 云开发数据库设计

## 数据库环境
- 环境ID: `cloud1`

## 表结构设计

### 1. users - 用户表
```json
{
  "_id": "用户ID（自动生成）",
  "_openid": "微信用户openid（自动添加）",
  "nickName": "用户昵称",
  "avatarUrl": "头像链接",
  "createTime": "注册时间（时间戳）",
  "updateTime": "最后更新时间（时间戳）",
  "totalGames": "总游戏次数（默认0）",
  "winGames": "胜利次数（默认0）",
  "totalScore": "总积分（默认0）"
}
```

### 2. rooms - 房间表
```json
{
  "_id": "房间ID（自动生成）",
  "roomCode": "房间号（6位数字）",
  "ownerId": "房主用户ID",
  "ownerOpenid": "房主openid",
  "ownerName": "房主昵称",
  "mode": "游戏模式（multi/single）",
  "status": "房间状态（waiting/playing/finished）",
  "playerCount": "当前玩家数量",
  "maxPlayers": "最大玩家数（默认8）",
  "gameStarted": "游戏是否开始（boolean）",
  "createTime": "创建时间（时间戳）",
  "startTime": "开始时间（时间戳）",
  "endTime": "结束时间（时间戳）"
}
```

### 3. room_players - 房间玩家表
```json
{
  "_id": "记录ID（自动生成）",
  "roomId": "房间ID",
  "userId": "用户ID",
  "openid": "用户openid",
  "nickName": "用户昵称",
  "avatarUrl": "头像链接",
  "score": "当前得分（默认0）",
  "isOwner": "是否房主（boolean）",
  "joinTime": "加入时间（时间戳）",
  "status": "状态（active/left）"
}
```

### 4. score_records - 给分记录表
```json
{
  "_id": "记录ID（自动生成）",
  "roomId": "房间ID",
  "gameId": "游戏ID",
  "fromUserId": "给分用户ID",
  "fromOpenid": "给分用户openid",
  "fromUserName": "给分用户昵称",
  "toUserId": "得分用户ID",
  "toOpenid": "得分用户openid",
  "toUserName": "得分用户昵称",
  "score": "分数（正负数）",
  "createTime": "创建时间（时间戳）"
}
```

### 5. games - 游戏记录表
```json
{
  "_id": "游戏ID（自动生成）",
  "roomId": "房间ID",
  "roomCode": "房间号",
  "mode": "游戏模式（multi/single）",
  "ownerId": "房主ID",
  "ownerName": "房主昵称",
  "playerCount": "玩家数量",
  "duration": "游戏时长（秒）",
  "totalScoreRecords": "总给分次数",
  "startTime": "开始时间（时间戳）",
  "endTime": "结束时间（时间戳）",
  "createTime": "创建时间（时间戳）"
}
```

### 6. game_players - 游戏玩家结果表
```json
{
  "_id": "记录ID（自动生成）",
  "gameId": "游戏ID",
  "roomId": "房间ID",
  "userId": "用户ID",
  "openid": "用户openid",
  "nickName": "用户昵称",
  "avatarUrl": "头像链接",
  "finalScore": "最终得分",
  "rank": "排名",
  "isWin": "是否胜利（boolean）",
  "createTime": "创建时间（时间戳）"
}
```

## 索引设计

### users 表索引
- `_openid`（唯一索引）

### rooms 表索引
- `roomCode`（唯一索引）
- `ownerId`
- `status`
- `createTime`

### room_players 表索引
- `roomId`
- `userId`
- `openid`
- `roomId + userId`（复合索引）

### score_records 表索引
- `roomId`
- `gameId`
- `fromUserId`
- `toUserId`
- `createTime`

### games 表索引
- `roomId`
- `ownerId`
- `endTime`

### game_players 表索引
- `gameId`
- `userId`
- `openid`
- `gameId + userId`（复合索引）

## 权限设计

### 数据库权限
- 所有集合：仅本人可读写（根据 openid 判断）
- rooms: 房间内玩家可读，房主可写
- room_players: 房间内玩家可读，房主和本人可写
- score_records: 房间内玩家可读，参与游戏的玩家可写
- games: 参与游戏的玩家可读
- game_players: 参与游戏的玩家可读

## 导入步骤

1. 在云开发控制台创建以上6个集合
2. 为每个集合添加相应的索引
3. 配置数据库权限
4. 可选：导入测试数据 