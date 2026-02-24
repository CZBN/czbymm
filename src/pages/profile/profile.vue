<template>
	<view class="container">
		<!-- 未登录状态 -->
		<view v-if="!userInfo" class="login-section">
			<view class="login-content">
				<view class="login-icon">👤</view>
				<text class="login-title">未登录</text>
				<text class="login-desc">授权微信信息，享受更好的体验</text>
				<button class="login-btn" @click="requestLogin">
					<text class="login-btn-text">微信授权登录</text>
				</button>
			</view>
		</view>
		
		<!-- 已登录状态 -->
		<view v-else class="profile-section">
			<view class="profile-header">
				<view class="profile-info" @click="goToEdit">
					<image class="avatar" :src="userInfo.avatar || '/static/default-avatar.png'" mode="aspectFill"></image>
					<view class="user-details">
						<text class="username">{{userInfo.name}}</text>
						<text class="user-desc">点击编辑资料</text>
					</view>
					<text class="edit-arrow">></text>
				</view>
			</view>
			
			<view class="stats-section">
				<view class="stats-title">游戏统计</view>
				<view class="stats-grid">
					<view class="stat-item">
						<text class="stat-number">{{gameStats.totalGames}}</text>
						<text class="stat-label">总场次</text>
					</view>
					<view class="stat-item">
						<text class="stat-number">{{gameStats.winGames}}</text>
						<text class="stat-label">胜利</text>
					</view>
					<view class="stat-item">
						<text class="stat-number">{{gameStats.winRate}}%</text>
						<text class="stat-label">胜率</text>
					</view>
					<view class="stat-item">
						<text class="stat-number">{{gameStats.totalScore}}</text>
						<text class="stat-label">总积分</text>
					</view>
				</view>
			</view>
			
			<view class="menu-section">
				<view class="menu-item" @click="goToHistory">
					<text class="menu-icon">📊</text>
					<text class="menu-text">历史记录</text>
					<text class="menu-arrow">></text>
				</view>
				<view class="menu-item" @click="showAbout">
					<text class="menu-icon">ℹ️</text>
					<text class="menu-text">关于我们</text>
					<text class="menu-arrow">></text>
				</view>
				<view class="menu-item" @click="confirmLogout">
					<text class="menu-icon">🚪</text>
					<text class="menu-text">退出登录</text>
					<text class="menu-arrow">></text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import CloudAPI from '@/utils/cloud.js'
	
	export default {
		data() {
			return {
				userInfo: null,
				gameStats: {
					totalGames: 0,
					winGames: 0,
					winRate: 0,
					totalScore: 0
				}
			}
		},
		onLoad() {
			this.loadUserInfo();
			
			// 检查是否有待加入的房间
			const pendingRoomCode = uni.getStorageSync('pendingRoomCode');
			if (pendingRoomCode && this.userInfo) {
				uni.removeStorageSync('pendingRoomCode');
				this.joinPendingRoom(pendingRoomCode);
			}
		},
		onShow() {
			this.loadUserInfo();
		},
		methods: {
			// 加载用户信息
			async loadUserInfo() {
				console.log('Profile页面: 开始加载用户信息');
				try {
					const userInfo = await CloudAPI.getCurrentUser();
					console.log('Profile页面: 获取到用户信息', userInfo);
					this.userInfo = userInfo;
					
					if (userInfo) {
						console.log('Profile页面: 用户已登录，加载游戏统计');
						this.loadGameStats();
					} else {
						console.log('Profile页面: 用户未登录');
					}
				} catch (error) {
					console.error('Profile页面: 加载用户信息失败:', error);
					this.userInfo = null;
				}
			},
			
			// 请求登录
			requestLogin() {
				uni.showModal({
					title: '授权确认',
					content: '是否授权获取微信用户信息？授权后可以使用完整功能。',
					success: (res) => {
						if (res.confirm) {
							this.getUserProfile();
						}
					}
				});
			},
			
			// 获取用户信息
			getUserProfile() {
				uni.getUserProfile({
					desc: '用于完善用户资料',
					success: async (res) => {
						console.log('获取用户信息成功:', res);
						
						try {
							const userInfo = await CloudAPI.saveUser({
								nickName: res.userInfo.nickName,
								avatarUrl: res.userInfo.avatarUrl
							});
							
							this.userInfo = userInfo;
							
							uni.showToast({
								title: '登录成功',
								icon: 'success'
							});
							
							// 检查是否有待加入的房间
							const pendingRoomCode = uni.getStorageSync('pendingRoomCode');
							if (pendingRoomCode) {
								uni.removeStorageSync('pendingRoomCode');
								this.joinPendingRoom(pendingRoomCode);
							}
							
							this.loadGameStats();
						} catch (error) {
							console.error('保存用户信息失败:', error);
							uni.showToast({
								title: '登录失败',
								icon: 'none'
							});
						}
					},
					fail: (err) => {
						console.log('获取用户信息失败:', err);
						uni.showToast({
							title: '授权失败',
							icon: 'none'
						});
					}
				});
			},
			
			// 加入待处理的房间
			async joinPendingRoom(roomCode) {
				try {
					await CloudAPI.joinRoom(roomCode);
					uni.showModal({
						title: '提示',
						content: `成功加入房间 #${roomCode}`,
						showCancel: false,
						success: () => {
							uni.navigateTo({
								url: `/pages/room/room?roomCode=${roomCode}&isOwner=false`
							});
						}
					});
				} catch (error) {
					console.error('加入房间失败:', error);
					uni.showToast({
						title: error.message || '加入房间失败',
						icon: 'none'
					});
				}
			},
			
			// 加载游戏统计
			loadGameStats() {
				if (this.userInfo) {
					this.gameStats = {
						totalGames: this.userInfo.totalGames || 0,
						winGames: this.userInfo.winGames || 0,
						winRate: this.userInfo.totalGames > 0 ? Math.floor((this.userInfo.winGames / this.userInfo.totalGames) * 100) : 0,
						totalScore: this.userInfo.totalScore || 0
					};
				}
			},
			
			// 跳转到编辑页面
			goToEdit() {
				uni.navigateTo({
					url: '/pages/profile/edit'
				});
			},
			
			// 跳转到历史记录
			goToHistory() {
				uni.switchTab({
					url: '/pages/history/history'
				});
			},
			
			// 显示关于我们
			showAbout() {
				uni.showModal({
					title: '关于我们',
					content: '计分助手 v1.0\n\n一个简单实用的多人游戏计分工具，支持多人协作计分，让游戏更加有趣！\n\n如有问题请联系客服。',
					showCancel: false
				});
			},
			
			// 确认退出登录
			confirmLogout() {
				uni.showModal({
					title: '退出确认',
					content: '确定要退出登录吗？',
					success: (res) => {
						if (res.confirm) {
							this.logout();
						}
					}
				});
			},
			
			// 退出登录
			logout() {
				// 清除云开发用户缓存
				CloudAPI.clearUser();
				// 清除本地缓存
				uni.clearStorageSync();
				this.userInfo = null;
				console.log('用户已退出登录');
				uni.showToast({
					title: '已退出登录',
					icon: 'success'
				});
			}
		}
	}
</script>

<style scoped>
	.container {
		min-height: 100vh;
		background: #F5F5F5;
	}
	
	/* 未登录状态样式 */
	.login-section {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 0 60rpx;
	}
	
	.login-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: #FFFFFF;
		border-radius: 30rpx;
		padding: 80rpx 60rpx;
		box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
	}
	
	.login-icon {
		font-size: 120rpx;
		margin-bottom: 40rpx;
		opacity: 0.8;
	}
	
	.login-title {
		font-size: 36rpx;
		font-weight: 600;
		color: #333333;
		margin-bottom: 20rpx;
	}
	
	.login-desc {
		font-size: 26rpx;
		color: #666666;
		text-align: center;
		line-height: 1.5;
		margin-bottom: 60rpx;
	}
	
	.login-btn {
		background: linear-gradient(135deg, #007AFF, #5856D6);
		border: none;
		border-radius: 50rpx;
		padding: 25rpx 80rpx;
		width: 100%;
		max-width: 400rpx;
	}
	
	.login-btn-text {
		font-size: 30rpx;
		color: #FFFFFF;
		font-weight: 600;
	}
	
	/* 已登录状态样式 */
	.profile-section {
		padding: 40rpx 30rpx;
	}
	
	.profile-header {
		background: #FFFFFF;
		border-radius: 25rpx;
		margin-bottom: 30rpx;
		overflow: hidden;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
	}
	
	.profile-info {
		display: flex;
		align-items: center;
		padding: 40rpx 30rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}
	
	.avatar {
		width: 120rpx;
		height: 120rpx;
		border-radius: 60rpx;
		margin-right: 30rpx;
		border: 4rpx solid rgba(255, 255, 255, 0.3);
	}
	
	.user-details {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	
	.username {
		font-size: 36rpx;
		font-weight: 600;
		color: #FFFFFF;
		margin-bottom: 10rpx;
	}
	
	.user-desc {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.8);
	}
	
	.edit-arrow {
		font-size: 32rpx;
		color: rgba(255, 255, 255, 0.8);
	}
	
	.stats-section {
		background: #FFFFFF;
		border-radius: 25rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
	}
	
	.stats-title {
		font-size: 30rpx;
		font-weight: 600;
		color: #333333;
		margin-bottom: 30rpx;
	}
	
	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 30rpx;
	}
	
	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 30rpx 20rpx;
		background: #F8F9FF;
		border-radius: 20rpx;
	}
	
	.stat-number {
		font-size: 36rpx;
		font-weight: 600;
		color: #007AFF;
		margin-bottom: 10rpx;
	}
	
	.stat-label {
		font-size: 24rpx;
		color: #666666;
	}
	
	.menu-section {
		background: #FFFFFF;
		border-radius: 25rpx;
		overflow: hidden;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
	}
	
	.menu-item {
		display: flex;
		align-items: center;
		padding: 35rpx 30rpx;
		border-bottom: 1rpx solid #F0F0F0;
		transition: all 0.3s ease;
	}
	
	.menu-item:last-child {
		border-bottom: none;
	}
	
	.menu-item:active {
		background: #F8F9FF;
	}
	
	.menu-icon {
		font-size: 36rpx;
		margin-right: 25rpx;
		width: 50rpx;
	}
	
	.menu-text {
		flex: 1;
		font-size: 30rpx;
		color: #333333;
	}
	
	.menu-arrow {
		font-size: 28rpx;
		color: #CCCCCC;
	}
</style> 