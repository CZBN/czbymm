// 云开发工具类
const db = wx.cloud.database()

export default {
  // 数据库引用
  db: db,
  
  // 集合引用
  collections: {
    users: db.collection('users'),
    rooms: db.collection('rooms'),
    roomPlayers: db.collection('room_players'),
    scoreRecords: db.collection('score_records'),
    games: db.collection('games'),
    gamePlayers: db.collection('game_players')
  },
  
  // 获取当前用户信息
  async getCurrentUser() {
    try {
      console.log('开始获取用户信息...')
      
      // 先尝试从本地缓存获取
      const cachedUser = uni.getStorageSync('currentUser')
      console.log('本地缓存用户:', cachedUser)
      
      const res = await this.collections.users.where({
        _openid: '{openid}' // 云开发会自动替换为当前用户openid
      }).get()
      
      console.log('云数据库查询结果:', res)
      
      if (res.data.length > 0) {
        const user = res.data[0]
        console.log('从云数据库获取到用户:', user)
        
        // 更新本地缓存
        uni.setStorageSync('currentUser', user)
        return user
      } else {
        console.log('云数据库中未找到用户')
        
        // 如果云数据库中没有，但本地有缓存，返回缓存
        if (cachedUser && cachedUser._id) {
          console.log('返回本地缓存用户')
          return cachedUser
        }
        
        return null
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      
      // 出错时尝试返回本地缓存
      const cachedUser = uni.getStorageSync('currentUser')
      if (cachedUser && cachedUser._id) {
        console.log('错误时返回本地缓存用户')
        return cachedUser
      }
      
      throw error
    }
  },
  
  // 创建或更新用户信息
  async saveUser(userInfo) {
    try {
      console.log('开始保存用户信息:', userInfo)
      
      const existUser = await this.getCurrentUser()
      const now = Date.now()
      
      let savedUser = null
      
      if (existUser) {
        console.log('更新现有用户')
        // 更新用户信息
        await this.collections.users.doc(existUser._id).update({
          data: {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl,
            updateTime: now
          }
        })
        savedUser = { ...existUser, ...userInfo, updateTime: now }
      } else {
        console.log('创建新用户')
        // 创建新用户
        const newUser = {
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          createTime: now,
          updateTime: now,
          totalGames: 0,
          winGames: 0,
          totalScore: 0
        }
        
        const res = await this.collections.users.add({
          data: newUser
        })
        
        savedUser = { ...newUser, _id: res._id }
      }
      
      console.log('保存的用户信息:', savedUser)
      
      // 更新本地缓存
      uni.setStorageSync('currentUser', savedUser)
      
      return savedUser
    } catch (error) {
      console.error('保存用户信息失败:', error)
      throw error
    }
  },
  
  // 清除用户信息（退出登录时调用）
  clearUser() {
    uni.removeStorageSync('currentUser')
    console.log('已清除用户信息')
  },
  
  // 生成6位房间号
  generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString()
  },
  
  // 创建房间
  async createRoom(mode = 'multi') {
    try {
      console.log('开始创建房间, 模式:', mode)
      
      const user = await this.getCurrentUser()
      console.log('创建房间时的用户信息:', user)
      
      if (!user) {
        throw new Error('用户未登录')
      }
      
      const roomCode = this.generateRoomCode()
      const now = Date.now()
      
      const roomData = {
        roomCode: roomCode,
        ownerId: user._id,
        ownerOpenid: user._openid,
        ownerName: user.nickName,
        mode: mode,
        status: 'waiting',
        playerCount: 1,
        maxPlayers: 8,
        gameStarted: false,
        createTime: now,
        startTime: null,
        endTime: null
      }
      
      console.log('房间数据:', roomData)
      
      const roomRes = await this.collections.rooms.add({
        data: roomData
      })
      
      console.log('房间创建结果:', roomRes)
      
      // 房主加入房间
      await this.collections.roomPlayers.add({
        data: {
          roomId: roomRes._id,
          userId: user._id,
          openid: user._openid,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          score: 0,
          isOwner: true,
          joinTime: now,
          status: 'active'
        }
      })
      
      return { ...roomData, _id: roomRes._id }
    } catch (error) {
      console.error('创建房间失败:', error)
      throw error
    }
  },
  
  // 加入房间
  async joinRoom(roomCode) {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        throw new Error('用户未登录')
      }
      
      // 查找房间
      const roomRes = await this.collections.rooms.where({
        roomCode: roomCode,
        status: 'waiting'
      }).get()
      
      if (roomRes.data.length === 0) {
        throw new Error('房间不存在或已结束')
      }
      
      const room = roomRes.data[0]
      
      // 检查是否已在房间中
      const existPlayer = await this.collections.roomPlayers.where({
        roomId: room._id,
        userId: user._id,
        status: 'active'
      }).get()
      
      if (existPlayer.data.length > 0) {
        return room
      }
      
      // 检查房间是否已满
      if (room.playerCount >= room.maxPlayers) {
        throw new Error('房间已满')
      }
      
      const now = Date.now()
      
      // 加入房间
      await this.collections.roomPlayers.add({
        data: {
          roomId: room._id,
          userId: user._id,
          openid: user._openid,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          score: 0,
          isOwner: false,
          joinTime: now,
          status: 'active'
        }
      })
      
      // 更新房间玩家数量
      await this.collections.rooms.doc(room._id).update({
        data: {
          playerCount: room.playerCount + 1
        }
      })
      
      return room
    } catch (error) {
      console.error('加入房间失败:', error)
      throw error
    }
  },
  
  // 获取房间玩家列表
  async getRoomPlayers(roomId) {
    try {
      const res = await this.collections.roomPlayers.where({
        roomId: roomId,
        status: 'active'
      }).orderBy('joinTime', 'asc').get()
      
      return res.data
    } catch (error) {
      console.error('获取房间玩家失败:', error)
      throw error
    }
  },
  
  // 开始游戏
  async startGame(roomId) {
    try {
      const now = Date.now()
      
      await this.collections.rooms.doc(roomId).update({
        data: {
          gameStarted: true,
          status: 'playing',
          startTime: now
        }
      })
      
      return true
    } catch (error) {
      console.error('开始游戏失败:', error)
      throw error
    }
  },
  
  // 给分
  async giveScore(roomId, toUserId, score) {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        throw new Error('用户未登录')
      }
      
      // 获取目标玩家信息
      const toPlayerRes = await this.collections.roomPlayers.where({
        roomId: roomId,
        userId: toUserId,
        status: 'active'
      }).get()
      
      if (toPlayerRes.data.length === 0) {
        throw new Error('目标玩家不存在')
      }
      
      const toPlayer = toPlayerRes.data[0]
      const now = Date.now()
      
      // 添加给分记录
      await this.collections.scoreRecords.add({
        data: {
          roomId: roomId,
          gameId: null, // 游戏结束时会更新
          fromUserId: user._id,
          fromOpenid: user._openid,
          fromUserName: user.nickName,
          toUserId: toUserId,
          toOpenid: toPlayer.openid,
          toUserName: toPlayer.nickName,
          score: score,
          createTime: now
        }
      })
      
      // 更新玩家分数
      await this.collections.roomPlayers.doc(toPlayer._id).update({
        data: {
          score: toPlayer.score + score
        }
      })
      
      return true
    } catch (error) {
      console.error('给分失败:', error)
      throw error
    }
  },
  
  // 获取给分记录
  async getScoreRecords(roomId) {
    try {
      const res = await this.collections.scoreRecords.where({
        roomId: roomId
      }).orderBy('createTime', 'desc').get()
      
      return res.data
    } catch (error) {
      console.error('获取给分记录失败:', error)
      throw error
    }
  },
  
  // 结算游戏
  async settleGame(roomId) {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        throw new Error('用户未登录')
      }
      
      // 获取房间信息
      const roomRes = await this.collections.rooms.doc(roomId).get()
      const room = roomRes.data
      
      const now = Date.now()
      const duration = Math.floor((now - room.startTime) / 1000)
      
      // 获取房间玩家
      const players = await this.getRoomPlayers(roomId)
      
      // 获取给分记录
      const scoreRecords = await this.getScoreRecords(roomId)
      
      // 创建游戏记录
      const gameData = {
        roomId: roomId,
        roomCode: room.roomCode,
        mode: room.mode,
        ownerId: room.ownerId,
        ownerName: room.ownerName,
        playerCount: players.length,
        duration: duration,
        totalScoreRecords: scoreRecords.length,
        startTime: room.startTime,
        endTime: now,
        createTime: now
      }
      
      const gameRes = await this.collections.games.add({
        data: gameData
      })
      
      const gameId = gameRes._id
      
      // 更新给分记录的gameId
      for (const record of scoreRecords) {
        await this.collections.scoreRecords.doc(record._id).update({
          data: { gameId: gameId }
        })
      }
      
      // 创建游戏玩家结果记录
      const sortedPlayers = players.sort((a, b) => b.score - a.score)
      
      for (let i = 0; i < sortedPlayers.length; i++) {
        const player = sortedPlayers[i]
        
        await this.collections.gamePlayers.add({
          data: {
            gameId: gameId,
            roomId: roomId,
            userId: player.userId,
            openid: player.openid,
            nickName: player.nickName,
            avatarUrl: player.avatarUrl,
            finalScore: player.score,
            rank: i + 1,
            isWin: player.score > 0,
            createTime: now
          }
        })
        
        // 更新用户统计
        const userStats = await this.collections.users.doc(player.userId).get()
        const userData = userStats.data
        
        await this.collections.users.doc(player.userId).update({
          data: {
            totalGames: userData.totalGames + 1,
            winGames: userData.winGames + (player.score > 0 ? 1 : 0),
            totalScore: userData.totalScore + player.score,
            updateTime: now
          }
        })
      }
      
      // 更新房间状态
      await this.collections.rooms.doc(roomId).update({
        data: {
          status: 'finished',
          endTime: now
        }
      })
      
      return gameData
    } catch (error) {
      console.error('结算游戏失败:', error)
      throw error
    }
  },
  
  // 获取用户游戏历史
  async getUserGameHistory(limit = 10, skip = 0) {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return []
      }
      
      const res = await this.collections.gamePlayers.where({
        openid: user._openid
      }).orderBy('createTime', 'desc').skip(skip).limit(limit).get()
      
      // 获取完整游戏信息
      const gameIds = res.data.map(item => item.gameId)
      const gamesRes = await this.collections.games.where({
        _id: db.command.in(gameIds)
      }).get()
      
      const gamesMap = {}
      gamesRes.data.forEach(game => {
        gamesMap[game._id] = game
      })
      
      // 合并数据
      const history = res.data.map(item => {
        const game = gamesMap[item.gameId] || {}
        return {
          ...item,
          ...game,
          result: item.isWin ? 'win' : 'lose'
        }
      })
      
      return history
    } catch (error) {
      console.error('获取游戏历史失败:', error)
      throw error
    }
  }
} 