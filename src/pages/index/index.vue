<template>
	<view class="container">
		<!-- 顶部导航栏：模拟小程序原生导航栏样式 -->
		<view class="nav-bar">
			<text class="nav-back" @click="goBack">←</text>
			<text class="nav-title">打牌记账</text>
			<view class="nav-actions">
				<text class="nav-action" @click="showShare">↗</text>
				<text class="nav-action" @click="showMore">—</text>
				<text class="nav-action" @click="showCircle">○</text>
			</view>
		</view>

		<!-- 顶部Banner广告（新增）：支持动态加载广告素材 -->
		<!-- v-if确保广告素材加载完成后再显示，避免占位符闪烁 -->
		<view class="top-banner" @click="handleBannerClick('top')" v-if="topBannerData">
			<image 
				class="banner-image" 
				:src="topBannerData.imageUrl" 
				mode="widthFix"
				lazy-load="true"  <!-- 懒加载优化性能 -->
			></image>
		</view>

		<!-- 顶部用户信息区：核心用户数据展示 -->
		<view class="user-section">
			<view class="avatar-wrapper">
				<!-- 用户头像：优先显示用户头像，无则显示默认头像 -->
				<image class="avatar" :src="userInfo.avatar || '/static/default-avatar.png'"></image>
			</view>
			<text class="nickname">{{ userInfo.nickname || '未设置昵称' }}</text>
			
			<!-- 核心数据展示行：好友排名 + 总积分 -->
			<view class="stats-row">
				<view class="stat-item">
					<text class="stat-value">{{ friendRank }}</text>
					<text class="stat-label">好友排名</text>
				</view>
				<view class="divider"></view>
				<view class="stat-item">
					<text class="stat-value">{{ totalScore }}</text>
					<text class="stat-label">总积分</text>
				</view>
			</view>
			
			<!-- 战绩行：可点击跳转战绩详情页 -->
			<view class="record-row" @click="goToRecord">
				<text class="record-text">赢{{ winCount }}次 / 输{{ loseCount }}次 / 胜率{{ winRate }}%</text>
				<text class="record-arrow">战绩 ></text>
			</view>
		</view>
		
		<!-- 主操作按钮区：核心功能入口 -->
		<view class="main-buttons">
			<view class="btn-primary" @click="startMultiGame">我要开房</view>
			<view class="btn-outline" @click="scanToJoin">扫码进房</view>
		</view>
		
		<!-- 辅助链接区：次要功能入口 -->
		<view class="link-group">
			<view class="link-item" @click="goToService">客服</view>
			<view class="link-item" @click="getAvatarNickname">获取头像昵称</view>
			<view class="link-item" @click="showManual">使用手册</view>
		</view>
		
		<!-- 底部Banner广告（保留）：支持动态加载广告素材 -->
		<view class="ad-section" @click="handleBannerClick('bottom')" v-if="bottomBannerData">
			<image 
				class="ad-image" 
				:src="bottomBannerData.imageUrl" 
				mode="widthFix"
				lazy-load="true"
			></image>
			<view class="ad-info">
				<image 
					class="ad-icon" 
					:src="bottomBannerData.iconUrl || '/static/game-icon.png'" 
				></image>
				<text class="ad-title">{{ bottomBannerData.title || '向僵尸开炮' }}</text>
				<text class="ad-desc">{{ bottomBannerData.desc || '向僵尸开炮正版官服，点击...' }}</text>
				<view class="ad-button" @click.stop="enterMiniGame">进入小游戏</view>
			</view>
		</view>
		
		<!-- 二维码弹窗（保留原有逻辑） -->
		<view class="qr-modal" v-if="showQRModal" @click="closeQRModal">
			<view class="qr-content" @click.stop>
				<view class="qr-header">
					<text class="qr-title">小程序二维码</text>
					<text class="close-btn" @click="closeQRModal">×</text>
				</view>
				<view class="qr-image">
					<text class="qr-placeholder">小程序二维码</text>
				</view>
				<text class="qr-tip">长按保存图片，分享给朋友</text>
			</view>
		</view>
	</view>
</template>

<script>
	// 导入云函数API工具类
	import CloudAPI from '@/utils/cloud.js'
	
	export default {
		// 页面数据定义
		data() {
			return {
				// 二维码弹窗显示状态
				showQRModal: false,
				// 用户信息
				userInfo: {
					avatar: '',
					nickname: ''
				},
				// 用户战绩数据（模拟数据，实际应从接口获取）
				friendRank: 0,
				totalScore: 500,
				winCount: 1,
				loseCount: 0,
				winRate: 100,
				// 顶部Banner广告数据
				topBannerData: null,
				// 底部Banner广告数据
				bottomBannerData: null
			}
		},
		
		// 页面加载完成生命周期
		onLoad() {
			console.log('首页加载完成');
			// 并行加载用户信息和广告素材，提升页面加载效率
			Promise.all([
				this.loadUserInfo(),      // 加载用户信息
				this.loadAdMaterials()    // 加载广告素材
			]).catch(error => {
				console.error('首页初始化失败:', error);
			});
		},
		
		// 方法定义
		methods: {
			/**
			 * 顶部导航栏返回按钮点击事件
			 */
			goBack() {
				uni.navigateBack({
					delta: 1  // 返回上一级页面
				});
			},
			
			/**
			 * 显示分享功能
			 */
			showShare() {
				uni.showToast({ 
					title: '分享功能暂未开放', 
					icon: 'none',
					duration: 1500
				});
			},
			
			/**
			 * 显示更多选项
			 */
			showMore() {
				uni.showToast({ 
					title: '更多功能暂未开放', 
					icon: 'none',
					duration: 1500
				});
			},
			
			/**
			 * 显示圆形菜单
			 */
			showCircle() {
				uni.showActionSheet({
					itemList: ['关于我们', '清除缓存', '检查更新'],
					success: (res) => {
						switch(res.tapIndex) {
							case 0:
								uni.showModal({
									title: '关于我们',
									content: '打牌记账 - 专业的多人游戏计分工具',
									showCancel: false
								});
								break;
							case 1:
								uni.clearStorage();
								uni.showToast({ title: '缓存已清除', icon: 'success' });
								break;
							case 2:
								uni.showToast({ title: '当前已是最新版本', icon: 'none' });
								break;
						}
					}
				});
			},
			
			/**
			 * 加载广告素材（支持动态配置）
			 * 实际项目中应从后端接口获取广告数据
			 */
			async loadAdMaterials() {
				try {
					// 模拟从接口获取广告数据（实际项目中替换为真实接口请求）
					// const adData = await CloudAPI.getAdMaterials();
					
					// 模拟广告数据（实际使用时删除，替换为接口返回数据）
					const adData = {
						topBanner: {
							imageUrl: 'https://picsum.photos/750/200',  // 顶部Banner图片
							linkUrl: 'https://www.example.com/top-ad', // 广告跳转链接
							id: 'top_ad_001'                           // 广告ID（用于统计）
						},
						bottomBanner: {
							imageUrl: 'https://picsum.photos/750/300',  // 底部Banner主图
							iconUrl: 'https://picsum.photos/80/80',     // 游戏图标
							title: '向僵尸开炮',                        // 广告标题
							desc: '向僵尸开炮正版官服，点击立即体验',    // 广告描述
							linkUrl: 'https://www.example.com/bottom-ad',// 广告跳转链接
							id: 'bottom_ad_001'                          // 广告ID
						}
					};
					
					// 赋值广告数据，触发页面渲染
					this.topBannerData = adData.topBanner;
					this.bottomBannerData = adData.bottomBanner;
					
					console.log('广告素材加载成功');
				} catch (error) {
					console.error('加载广告素材失败:', error);
					// 广告加载失败时使用默认素材，保证页面正常显示
					this.topBannerData = {
						imageUrl: '/static/top-banner.png',
						linkUrl: '',
						id: 'default_top_ad'
					};
					this.bottomBannerData = {
						imageUrl: '/static/ad-sample.png',
						iconUrl: '/static/game-icon.png',
						title: '向僵尸开炮',
						desc: '向僵尸开炮正版官服，点击...',
						linkUrl: '',
						id: 'default_bottom_ad'
					};
				}
			},
			
			/**
			 * Banner广告点击事件处理
			 * @param {String} type 广告类型：top/bottom
			 */
			handleBannerClick(type) {
				try {
					// 获取对应广告数据
					const adData = type === 'top' ? this.topBannerData : this.bottomBannerData;
					
					// 广告点击统计（实际项目中调用统计接口）
					console.log(`广告点击：${type}，ID：${adData.id}`);
					
					// 有跳转链接则打开
					if (adData.linkUrl) {
						// 小程序内打开广告链接
						uni.navigateTo({
							url: `/pages/webview/webview?url=${encodeURIComponent(adData.linkUrl)}`
						});
					} else {
						uni.showToast({ 
							title: '广告链接暂未配置', 
							icon: 'none' 
						});
					}
				} catch (error) {
					console.error('处理广告点击失败:', error);
					uni.showToast({ 
						title: '操作失败，请重试', 
						icon: 'none' 
					});
				}
			},
			
			/**
			 * 加载用户信息和战绩数据
			 */
			async loadUserInfo() {
				try {
					// 获取当前登录用户信息
					const userInfo = await CloudAPI.getCurrentUser();
					if (userInfo) {
						this.userInfo = userInfo;
						// 加载用户战绩数据
						await this.loadUserStats(userInfo._id);
					}
					console.log('用户信息加载成功');
				} catch (error) {
					console.error('加载用户信息失败:', error);
					// 使用默认用户信息，保证页面正常显示
					this.userInfo = {
						avatar: '/static/default-avatar.png',
						nickname: '游客'
					};
				}
			},
			
			/**
			 * 加载用户战绩数据
			 * @param {String} userId 用户ID
			 */
			async loadUserStats(userId) {
				try {
					// 从云函数获取用户战绩
					const stats = await CloudAPI.getUserStats(userId);
					if (stats) {
						this.friendRank = stats.friendRank || 0;
						this.totalScore = stats.totalScore || 0;
						this.winCount = stats.winCount || 0;
						this.loseCount = stats.loseCount || 0;
						// 计算胜率（避免除以0）
						this.winRate = this.winCount + this.loseCount > 0 
							? Math.round((this.winCount / (this.winCount + this.loseCount)) * 100) 
							: 0;
					}
				} catch (error) {
					console.error('加载用户战绩失败:', error);
					// 使用默认战绩数据
					this.friendRank = 0;
					this.totalScore = 0;
					this.winCount = 0;
					this.loseCount = 0;
					this.winRate = 0;
				}
			},
			
			/**
			 * 检查用户登录状态
			 * @returns {Boolean} 登录状态
			 */
			async checkLogin() {
				console.log('首页: 开始检查登录状态');
				try {
					const userInfo = await CloudAPI.getCurrentUser();
					console.log('首页: 获取到用户信息', userInfo);
					const isLogin = !!userInfo;
					console.log('首页: 登录状态', isLogin);
					return isLogin;
				} catch (error) {
					console.error('首页: 检查登录状态失败:', error);
					return false;
				}
			},
			
			/**
			 * 跳转到登录页面
			 */
			goToLogin() {
				uni.showModal({
					title: '提示',
					content: '请先登录后再使用该功能',
					success: (res) => {
						if (res.confirm) {
							uni.switchTab({
								url: '/pages/profile/profile'
							});
						}
					}
				});
			},
			
			/**
			 * 开始多人游戏（我要开房）
			 */
			async startMultiGame() {
				// 检查登录状态
				const isLogin = await this.checkLogin();
				if (!isLogin) {
					this.goToLogin();
					return;
				}
				
				// 显示加载提示
				uni.showLoading({
					title: '创建房间中...'
				});
				
				try {
					// 创建多人模式房间
					const room = await CloudAPI.createRoom('multi');
					uni.hideLoading();
					
					// 跳转到房间页面
					uni.navigateTo({
						url: `/pages/room/room?roomId=${room._id}&roomCode=${room.roomCode}&mode=multi&isOwner=true`
					});
				} catch (error) {
					uni.hideLoading();
					console.error('创建房间失败:', error);
					uni.showToast({
						title: error.message || '创建房间失败',
						icon: 'none'
					});
				}
			},
			
			/**
			 * 扫码加入房间
			 */
			scanToJoin() {
				// 调用小程序扫码API
				uni.scanCode({
					success: (res) => {
						console.log('扫码结果：', res);
						// 解析房间码
						const roomCode = this.parseRoomCode(res.result);
						if (roomCode) {
							this.joinRoom(roomCode);
						} else {
							uni.showToast({
								title: '无效的房间码',
								icon: 'none'
							});
						}
					},
					fail: (err) => {
						console.log('扫码失败：', err);
						uni.showToast({
							title: '扫码失败',
							icon: 'none'
						});
					}
				});
			},
			
			/**
			 * 解析房间码（6位数字）
			 * @param {String} code 扫码结果
			 * @returns {String|null} 有效房间码或null
			 */
			parseRoomCode(code) {
				// 正则匹配6位数字房间码
				if (/^\d{6}$/.test(code)) {
					return code;
				}
				return null;
			},
			
			/**
			 * 加入房间
			 * @param {String} roomCode 房间码
			 */
			async joinRoom(roomCode) {
				// 检查登录状态
				const isLogin = await this.checkLogin();
				if (!isLogin) {
					// 未登录时存储待加入的房间码，登录后自动加入
					uni.setStorageSync('pendingRoomCode', roomCode);
					this.goToLogin();
					return;
				}
				
				// 显示加载提示
				uni.showLoading({
					title: '加入房间中...'
				});
				
				try {
					// 加入房间
					const room = await CloudAPI.joinRoom(roomCode);
					uni.hideLoading();
					
					// 跳转到房间页面
					uni.navigateTo({
						url: `/pages/room/room?roomId=${room._id}&roomCode=${room.roomCode}&mode=${room.mode}&isOwner=false`
					});
				} catch (error) {
					uni.hideLoading();
					console.error('加入房间失败:', error);
					uni.showToast({
						title: error.message || '加入房间失败',
						icon: 'none'
					});
				}
			},
			
			/**
			 * 显示小程序二维码
			 */
			showQRCode() {
				this.showQRModal = true;
			},
			
			/**
			 * 关闭二维码弹窗
			 */
			closeQRModal() {
				this.showQRModal = false;
			},
			
			/**
			 * 跳转到战绩页面
			 */
			goToRecord() {
				uni.navigateTo({
					url: '/pages/record/record'
				});
			},
			
			/**
			 * 跳转到客服页面
			 */
			goToService() {
				uni.navigateTo({
					url: '/pages/service/service'
				});
			},
			
			/**
			 * 获取微信头像昵称
			 */
			async getAvatarNickname() {
				try {
					// 更新用户信息
					const userInfo = await CloudAPI.updateUserInfo();
					this.userInfo = userInfo;
					uni.showToast({
						title: '获取成功',
						icon: 'success'
					});
				} catch (error) {
					uni.showToast({
						title: '获取失败',
						icon: 'none'
					});
				}
			},
			
			/**
			 * 显示使用手册
			 */
			showManual() {
				uni.showModal({
					title: '使用手册',
					content: '1. 我要开房：创建房间邀请好友\n2. 扫码进房：扫描好友分享的房间码加入房间\n3. 获取头像昵称：同步微信头像和昵称',
					showCancel: false
				});
			},
			
			/**
			 * 进入小游戏（广告按钮）
			 */
			enterMiniGame() {
				uni.showToast({
					title: '进入小游戏',
					icon: 'none'
				});
			}
		}
	}
</script>

<style scoped>
	/* 页面容器：基础样式 */
	.container {
		min-height: 100vh;          /* 占满屏幕高度 */
		background-color: #FFFFFF;  /* 白色背景 */
		padding: 0 30rpx;           /* 左右内边距 */
	}

	/* 顶部导航栏样式 */
	.nav-bar {
		display: flex;              /* 弹性布局 */
		align-items: center;        /* 垂直居中 */
		justify-content: space-between; /* 两端对齐 */
		height: 88rpx;              /* 导航栏高度 */
		padding: 0 20rpx;           /* 内边距 */
		background-color: #FFFFFF;  /* 白色背景 */
		border-bottom: 1rpx solid #EEEEEE; /* 底部边框 */
	}
	.nav-back {
		font-size: 36rpx;           /* 返回按钮字体大小 */
		color: #333333;             /* 黑色文字 */
	}
	.nav-title {
		font-size: 32rpx;           /* 标题字体大小 */
		font-weight: 600;           /* 加粗 */
		color: #333333;             /* 黑色文字 */
	}
	.nav-actions {
		display: flex;              /* 弹性布局 */
	}
	.nav-action {
		font-size: 32rpx;           /* 操作按钮字体大小 */
		color: #333333;             /* 黑色文字 */
		margin-left: 20rpx;         /* 左边距 */
	}

	/* 顶部Banner广告样式 */
	.top-banner {
		width: 100%;                /* 宽度100% */
		margin: 20rpx 0;            /* 上下外边距 */
		border-radius: 15rpx;       /* 圆角 */
		overflow: hidden;           /* 隐藏溢出内容 */
	}
	.banner-image {
		width: 100%;                /* 宽度100% */
		height: auto;               /* 高度自适应 */
	}
	
	/* 用户信息区样式 */
	.user-section {
		display: flex;              /* 弹性布局 */
		flex-direction: column;     /* 垂直排列 */
		align-items: center;        /* 水平居中 */
		padding: 40rpx 0;           /* 上下内边距 */
	}
	
	.avatar-wrapper {
		width: 120rpx;              /* 头像容器宽度 */
		height: 120rpx;             /* 头像容器高度 */
		border-radius: 60rpx;       /* 圆形头像 */
		background-color: #F5F5F5;  /* 灰色背景（占位） */
		display: flex;              /* 弹性布局 */
		align-items: center;        /* 垂直居中 */
		justify-content: center;    /* 水平居中 */
		margin-bottom: 20rpx;       /* 下边距 */
	}
	
	.avatar {
		width: 100%;                /* 头像宽度100% */
		height: 100%;               /* 头像高度100% */
		border-radius: 60rpx;       /* 圆形头像 */
	}
	
	.nickname {
		font-size: 36rpx;           /* 昵称字体大小 */
		color: #333333;             /* 黑色文字 */
		margin-bottom: 40rpx;       /* 下边距 */
	}
	
	.stats-row {
		display: flex;              /* 弹性布局 */
		align-items: center;        /* 垂直居中 */
		justify-content: center;    /* 水平居中 */
		width: 100%;                /* 宽度100% */
		margin-bottom: 30rpx;       /* 下边距 */
	}
	
	.stat-item {
		display: flex;              /* 弹性布局 */
		flex-direction: column;     /* 垂直排列 */
		align-items: center;        /* 水平居中 */
		flex: 1;                    /* 等分宽度 */
	}
	
	.stat-value {
		font-size: 48rpx;           /* 数值字体大小 */
		font-weight: bold;          /* 加粗 */
		color: #333333;             /* 黑色文字 */
		margin-bottom: 8rpx;        /* 下边距 */
	}
	
	.stat-label {
		font-size: 24rpx;           /* 标签字体大小 */
		color: #999999;             /* 灰色文字 */
	}
	
	.divider {
		width: 1rpx;                /* 分隔线宽度 */
		height: 40rpx;              /* 分隔线高度 */
		background-color: #EEEEEE;  /* 浅灰色 */
	}
	
	.record-row {
		display: flex;              /* 弹性布局 */
		align-items: center;        /* 垂直居中 */
		justify-content: center;    /* 水平居中 */
	}
	
	.record-text {
		font-size: 28rpx;           /* 战绩文字大小 */
		color: #FF6B35;             /* 橙色文字 */
		margin-right: 10rpx;        /* 右边距 */
	}
	
	.record-arrow {
		font-size: 28rpx;           /* 箭头字体大小 */
		color: #FF6B35;             /* 橙色文字 */
	}
	
	/* 主操作按钮样式 */
	.main-buttons {
		display: flex;              /* 弹性布局 */
		justify-content: space-between; /* 两端对齐 */
		margin-bottom: 40rpx;       /* 下边距 */
	}
	
	.btn-primary {
		flex: 1;                    /* 等分宽度 */
		height: 80rpx;              /* 按钮高度 */
		line-height: 80rpx;         /* 行高（垂直居中） */
		text-align: center;         /* 文字居中 */
		border-radius: 10rpx;       /* 圆角 */
		background-color: #FF6B35;  /* 橙色背景 */
		color: #FFFFFF;             /* 白色文字 */
		font-size: 32rpx;           /* 字体大小 */
		margin-right: 20rpx;        /* 右边距 */
	}
	
	.btn-outline {
		flex: 1;                    /* 等分宽度 */
		height: 80rpx;              /* 按钮高度 */
		line-height: 80rpx;         /* 行高（垂直居中） */
		text-align: center;         /* 文字居中 */
		border-radius: 10rpx;       /* 圆角 */
		border: 2rpx solid #FF6B35; /* 橙色边框 */
		color: #FF6B35;             /* 橙色文字 */
		font-size: 32rpx;           /* 字体大小 */
	}
	
	/* 辅助链接区样式 */
	.link-group {
		display: flex;              /* 弹性布局 */
		justify-content: center;    /* 水平居中 */
		margin-bottom: 40rpx;       /* 下边距 */
	}
	
	.link-item {
		font-size: 26rpx;           /* 字体大小 */
		color: #333333;             /* 黑色文字 */
		padding: 10rpx 20rpx;       /* 内边距 */
		border: 1rpx solid #EEEEEE; /* 浅灰色边框 */
		border-radius: 30rpx;       /* 圆角 */
		margin: 0 10rpx;            /* 左右外边距 */
	}
	
	/* 底部Banner广告样式 */
	.ad-section {
		display: flex;              /* 弹性布局 */
		flex-direction: column;     /* 垂直排列 */
		background-color: #F9F9F9;  /* 浅灰色背景 */
		border-radius: 15rpx;       /* 圆角 */
		overflow: hidden;           /* 隐藏溢出内容 */
	}
	
	.ad-image {
		width: 100%;                /* 宽度100% */
		height: auto;               /* 高度自适应 */
	}
	
	.ad-info {
		padding: 20rpx;             /* 内边距 */
	}
	
	.ad-icon {
		width: 80rpx;               /* 图标宽度 */
		height: 80rpx;              /* 图标高度 */
		border-radius: 15rpx;       /* 圆角 */
		margin-bottom: 10rpx;       /* 下边距 */
	}
	
	.ad-title {
		font-size: 28rpx;           /* 标题字体大小 */
		color: #333333;             /* 黑色文字 */
		margin-bottom: 8rpx;        /* 下边距 */
		display: block;             /* 块级元素 */
	}
	
	.ad-desc {
		font-size: 24rpx;           /* 描述字体大小 */
		color: #999999;             /* 灰色文字 */
		margin-bottom: 20rpx;       /* 下边距 */
		display: block;             /* 块级元素 */
	}
	
	.ad-button {
		width: 200rpx;              /* 按钮宽度 */
		height: 60rpx;              /* 按钮高度 */
		line-height: 60rpx;         /* 行高（垂直居中） */
		text-align: center;         /* 文字居中 */
		border-radius: 30rpx;       /* 圆角 */
		background-color: #00C853;  /* 绿色背景 */
		color: #FFFFFF;             /* 白色文字 */
		font-size: 26rpx;           /* 字体大小 */
	}
	
	/* 二维码弹窗样式 */
	.qr-modal {
		position: fixed;            /* 固定定位 */
		top: 0;                     /* 顶部对齐 */
		left: 0;                    /* 左侧对齐 */
		right: 0;                   /* 右侧对齐 */
		bottom: 0;                  /* 底部对齐 */
		background: rgba(0, 0, 0, 0.5); /* 半透明黑色背景 */
		display: flex;              /* 弹性布局 */
		align-items: center;        /* 垂直居中 */
		justify-content: center;    /* 水平居中 */
		z-index: 1000;              /* 高z-index确保在最上层 */
	}
	
	.qr-content {
		background: #FFFFFF;        /* 白色背景 */
		border-radius: 20rpx;       /* 圆角 */
		padding: 40rpx;             /* 内边距 */
		margin: 0 60rpx;            /* 左右外边距 */
		max-width: 600rpx;          /* 最大宽度 */
		width: 100%;                /* 宽度100% */
	}
	
	.qr-header {
		display: flex;              /* 弹性布局 */
		justify-content: space-between; /* 两端对齐 */
		align-items: center;        /* 垂直居中 */
		margin-bottom: 40rpx;       /* 下边距 */
	}
	
	.qr-title {
		font-size: 32rpx;           /* 标题字体大小 */
		font-weight: 600;           /* 加粗 */
		color: #333333;             /* 黑色文字 */
	}
	
	.close-btn {
		font-size: 48rpx;           /* 关闭按钮字体大小 */
		color: #999999;             /* 灰色文字 */
		line-height: 1;             /* 行高1 */
	}
	
	.qr-image {
		width: 400rpx;              /* 二维码容器宽度 */
		height: 400rpx;             /* 二维码容器高度 */
		background: #F5F5F5;        /* 灰色背景 */
		border-radius: 15rpx;       /* 圆角 */
		display: flex;              /* 弹性布局 */
		align-items: center;        /* 垂直居中 */
		justify-content: center;    /* 水平居中 */
		margin: 0 auto 30rpx;       /* 居中 + 下边距 */
		border: 2rpx dashed #CCCCCC; /* 虚线边框 */
	}
	
	.qr-placeholder {
		font-size: 28rpx;           /* 占位文字大小 */
		color: #999999;             /* 灰色文字 */
	}
	
	.qr-tip {
		text-align: center;         /* 文字居中 */
		font-size: 24rpx;           /* 提示文字大小 */
		color: #666666;             /* 深灰色文字 */
		display: block;             /* 块级元素 */
	}
</style>