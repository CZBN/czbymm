<template>
	<view class="container">
		<!-- 房间头部信息 -->
		<view class="room-header">
			<view class="room-info">
				<text class="room-title">房间 #{{roomCode}}</text>
				<text class="room-subtitle">{{ownerName}}的房间</text>
			</view>
			<view class="room-qr" v-if="isOwner && !gameStarted" @click="showRoomQR">
				<text class="qr-icon">📱</text>
				<text class="qr-text">邀请码</text>
			</view>
		</view>
		
		<!-- 玩家计分表格 -->
		<view class="score-table">
			<view class="table-header">
				<text class="header-player">玩家</text>
				<text class="header-score">得分</text>
				<text class="header-action">操作</text>
			</view>
			
			<view class="table-body">
				<view 
					v-for="player in players" 
					:key="player._id"
					class="player-row"
					:class="{ 'is-current': player.userId === currentUserId }"
				>
					<view class="player-info">
						<image class="player-avatar" :src="player.avatarUrl || '/static/default-avatar.png'"></image>
						<view class="player-details">
							<text class="player-name">{{player.nickName}}</text>
							<text class="player-status" v-if="player.userId === ownerId">房主</text>
						</view>
					</view>
					
					<view class="player-score">
						<text class="score-number" :class="{ 'positive': player.score > 0, 'negative': player.score < 0 }">
							{{player.score > 0 ? '+' : ''}}{{player.score}}
						</text>
					</view>
					
					<view class="player-action">
						<button 
							v-if="player.userId !== currentUserId && gameStarted"
							class="give-score-btn"
							@click="showGiveScore(player)"
						>
							给分
						</button>
						<text v-else class="no-action">--</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 房间控制按钮 -->
		<view class="room-controls">
			<button class="control-btn detail-btn" @click="showScoreDetail">
				<text class="btn-text">给分详情</text>
			</button>
			
			<button 
				v-if="isOwner"
				class="control-btn"
				:class="gameStarted ? 'settle-btn' : 'start-btn'"
				@click="gameStarted ? settleRoom() : startGame()"
			>
				<text class="btn-text">{{gameStarted ? '结算房间' : '开始游戏'}}</text>
			</button>
		</view>
		
		<!-- 房间二维码弹窗 -->
		<view class="qr-modal" v-if="showQRModal" @click="closeQRModal">
			<view class="qr-content" @click.stop>
				<view class="qr-header">
					<text class="qr-title">房间邀请码</text>
					<text class="close-btn" @click="closeQRModal">×</text>
				</view>
				<view class="qr-image">
					<text class="qr-code">{{roomCode}}</text>
				</view>
				<text class="qr-tip">分享房间号给朋友，或点击下方按钮分享</text>
				<button class="share-btn" @click="shareRoom">
					<text class="share-text">分享到微信</text>
				</button>
			</view>
		</view>
		
		<!-- 给分弹窗 -->
		<view class="give-score-modal" v-if="showGiveScoreModal" @click="closeGiveScore">
			<view class="give-score-content" @click.stop>
				<view class="give-score-header">
					<text class="give-score-title">给 {{targetPlayer.nickName}} 计分</text>
					<text class="close-btn" @click="closeGiveScore">×</text>
				</view>
				
				<view class="score-input-section">
					<text class="input-label">分数</text>
					<input 
						class="score-input"
						v-model.number="giveScoreAmount"
						type="number"
						placeholder="输入分数"
						@input="onScoreInput"
					/>
					<text class="input-tip">正数为加分，负数为扣分</text>
				</view>
				
				<view class="quick-scores">
					<text class="quick-title">快速选择</text>
					<view class="quick-buttons">
						<button 
							v-for="score in quickScores"
							:key="score"
							class="quick-btn"
							@click="selectQuickScore(score)"
						>
							{{score > 0 ? '+' : ''}}{{score}}
						</button>
					</view>
				</view>
				
				<button 
					class="confirm-give-btn"
					@click="confirmGiveScore"
					:disabled="!giveScoreAmount"
				>
					<text class="confirm-text">确认给分</text>
				</button>
			</view>
		</view>
	</view>
</template>

<script>
	import CloudAPI from '@/utils/cloud.js'
	
	export default {
		data() {
			return {
				roomId: '',
				roomCode: '',
				mode: 'multi',
				isOwner: false,
				ownerId: '',
				ownerName: '',
				currentUserId: '',
				gameStarted: false,
				players: [],
				showQRModal: false,
				showGiveScoreModal: false,
				targetPlayer: {},
				giveScoreAmount: 0,
				quickScores: [10, 20, 50, -10, -20, -50],
				scoreRecords: [],
				refreshTimer: null
			}
		},
		onLoad(options) {
			this.roomId = options.roomId || '';
			this.roomCode = options.roomCode || '';
			this.mode = options.mode || 'multi';
			this.isOwner = options.isOwner === 'true';
			
			this.initRoom();
		},
		onShow() {
			// 房间页面显示时刷新数据
			this.refreshRoomData();
			// 启动定时刷新
			this.startRefreshTimer();
		},
		onHide() {
			// 停止定时刷新
			this.stopRefreshTimer();
		},
		onUnload() {
			// 停止定时刷新
			this.stopRefreshTimer();
		},
		methods: {
			// 初始化房间
			async initRoom() {
				try {
					const user = await CloudAPI.getCurrentUser();
					if (!user) {
						uni.showToast({
							title: '请先登录',
							icon: 'none'
						});
						uni.navigateBack();
						return;
					}
					
					this.currentUserId = user._id;
					await this.loadRoomData();
					
					// 如果是房主且是第一次创建，显示邀请码
					if (this.isOwner) {
						setTimeout(() => {
							this.showRoomQR();
						}, 1000);
					}
				} catch (error) {
					console.error('初始化房间失败:', error);
					uni.showToast({
						title: '房间不存在',
						icon: 'none'
					});
					uni.navigateBack();
				}
			},
			
			// 加载房间数据
			async loadRoomData() {
				try {
					// 获取房间玩家列表
					const players = await CloudAPI.getRoomPlayers(this.roomId);
					this.players = players;
					
					// 获取房间信息
					const roomRes = await CloudAPI.db.collection('rooms').doc(this.roomId).get();
					const room = roomRes.data;
					
					this.ownerId = room.ownerId;
					this.ownerName = room.ownerName;
					this.gameStarted = room.gameStarted;
					
					// 获取给分记录
					this.scoreRecords = await CloudAPI.getScoreRecords(this.roomId);
				} catch (error) {
					console.error('加载房间数据失败:', error);
					throw error;
				}
			},
			
			// 刷新房间数据
			async refreshRoomData() {
				try {
					await this.loadRoomData();
				} catch (error) {
					console.error('刷新房间数据失败:', error);
				}
			},
			
			// 启动定时刷新
			startRefreshTimer() {
				this.refreshTimer = setInterval(() => {
					this.refreshRoomData();
				}, 3000); // 每3秒刷新一次
			},
			
			// 停止定时刷新
			stopRefreshTimer() {
				if (this.refreshTimer) {
					clearInterval(this.refreshTimer);
					this.refreshTimer = null;
				}
			},
			
			// 开始游戏
			async startGame() {
				if (this.players.length < 2) {
					uni.showModal({
						title: '提示',
						content: '至少需要2名玩家才能开始游戏',
						showCancel: false
					});
					return;
				}
				
				uni.showModal({
					title: '确认',
					content: '确定开始游戏吗？游戏开始后将开始计分。',
					success: async (res) => {
						if (res.confirm) {
							try {
								await CloudAPI.startGame(this.roomId);
								this.gameStarted = true;
								uni.showToast({
									title: '游戏开始！',
									icon: 'success'
								});
							} catch (error) {
								console.error('开始游戏失败:', error);
								uni.showToast({
									title: '开始游戏失败',
									icon: 'none'
								});
							}
						}
					}
				});
			},
			
			// 显示房间二维码
			showRoomQR() {
				this.showQRModal = true;
			},
			
			// 关闭二维码弹窗
			closeQRModal() {
				this.showQRModal = false;
			},
			
			// 分享房间
			shareRoom() {
				// 在实际应用中调用微信分享接口
				uni.showToast({
					title: '分享功能开发中',
					icon: 'none'
				});
			},
			
			// 显示给分弹窗
			showGiveScore(player) {
				this.targetPlayer = player;
				this.giveScoreAmount = 0;
				this.showGiveScoreModal = true;
			},
			
			// 关闭给分弹窗
			closeGiveScore() {
				this.showGiveScoreModal = false;
				this.targetPlayer = {};
				this.giveScoreAmount = 0;
			},
			
			// 分数输入处理
			onScoreInput(e) {
				this.giveScoreAmount = parseInt(e.detail.value) || 0;
			},
			
			// 选择快速分数
			selectQuickScore(score) {
				this.giveScoreAmount = score;
			},
			
			// 确认给分
			async confirmGiveScore() {
				if (!this.giveScoreAmount) {
					uni.showToast({
						title: '请输入分数',
						icon: 'none'
					});
					return;
				}
				
				try {
					await CloudAPI.giveScore(this.roomId, this.targetPlayer.userId, this.giveScoreAmount);
					
					uni.showToast({
						title: `已给${this.targetPlayer.nickName}${this.giveScoreAmount > 0 ? '+' : ''}${this.giveScoreAmount}分`,
						icon: 'success'
					});
					
					// 刷新房间数据
					await this.refreshRoomData();
					
					this.closeGiveScore();
				} catch (error) {
					console.error('给分失败:', error);
					uni.showToast({
						title: error.message || '给分失败',
						icon: 'none'
					});
				}
			},
			
			// 显示给分详情
			showScoreDetail() {
				if (this.scoreRecords.length === 0) {
					uni.showToast({
						title: '暂无给分记录',
						icon: 'none'
					});
					return;
				}
				
				uni.navigateTo({
					url: `/pages/room/detail?roomId=${this.roomId}&roomCode=${this.roomCode}&records=${encodeURIComponent(JSON.stringify(this.scoreRecords))}`
				});
			},
			
			// 结算房间
			settleRoom() {
				uni.showModal({
					title: '确认结算',
					content: '确定要结算房间吗？结算后房间将解散，分数将记录到历史中。',
					success: (res) => {
						if (res.confirm) {
							this.doSettleRoom();
						}
					}
				});
			},
			
			// 执行结算
			async doSettleRoom() {
				uni.showLoading({
					title: '结算中...'
				});
				
				try {
					await CloudAPI.settleGame(this.roomId);
					
					uni.hideLoading();
					uni.showModal({
						title: '结算完成',
						content: '房间已结算，感谢游戏！',
						showCancel: false,
						success: () => {
							uni.navigateBack();
						}
					});
				} catch (error) {
					uni.hideLoading();
					console.error('结算游戏失败:', error);
					uni.showToast({
						title: error.message || '结算失败',
						icon: 'none'
					});
				}
			}
		}
	}
</script>

<style scoped>
	.container {
		min-height: 100vh;
		background: #F5F5F5;
		padding: 30rpx;
	}
	
	.room-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #FFFFFF;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
	}
	
	.room-info {
		flex: 1;
	}
	
	.room-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333333;
		display: block;
		margin-bottom: 8rpx;
	}
	
	.room-subtitle {
		font-size: 24rpx;
		color: #666666;
	}
	
	.room-qr {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 15rpx;
		background: #F8F9FF;
		border-radius: 15rpx;
		min-width: 120rpx;
	}
	
	.qr-icon {
		font-size: 32rpx;
		margin-bottom: 5rpx;
	}
	
	.qr-text {
		font-size: 22rpx;
		color: #007AFF;
	}
	
	.score-table {
		background: #FFFFFF;
		border-radius: 20rpx;
		margin-bottom: 30rpx;
		overflow: hidden;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
	}
	
	.table-header {
		display: flex;
		background: #F8F9FF;
		padding: 25rpx 30rpx;
		border-bottom: 1rpx solid #E5E5E5;
	}
	
	.header-player {
		flex: 2;
		font-size: 26rpx;
		font-weight: 600;
		color: #333333;
	}
	
	.header-score {
		flex: 1;
		text-align: center;
		font-size: 26rpx;
		font-weight: 600;
		color: #333333;
	}
	
	.header-action {
		flex: 1;
		text-align: center;
		font-size: 26rpx;
		font-weight: 600;
		color: #333333;
	}
	
	.table-body {
		padding: 0;
	}
	
	.player-row {
		display: flex;
		align-items: center;
		padding: 25rpx 30rpx;
		border-bottom: 1rpx solid #F0F0F0;
	}
	
	.player-row:last-child {
		border-bottom: none;
	}
	
	.player-row.is-current {
		background: #F0F8FF;
	}
	
	.player-info {
		flex: 2;
		display: flex;
		align-items: center;
	}
	
	.player-avatar {
		width: 60rpx;
		height: 60rpx;
		border-radius: 30rpx;
		margin-right: 20rpx;
		background: #F5F5F5;
	}
	
	.player-details {
		flex: 1;
	}
	
	.player-name {
		font-size: 28rpx;
		color: #333333;
		display: block;
		margin-bottom: 5rpx;
	}
	
	.player-status {
		font-size: 22rpx;
		color: #007AFF;
		background: #E8F4FF;
		padding: 4rpx 12rpx;
		border-radius: 10rpx;
	}
	
	.player-score {
		flex: 1;
		text-align: center;
	}
	
	.score-number {
		font-size: 32rpx;
		font-weight: 600;
		color: #666666;
	}
	
	.score-number.positive {
		color: #52C41A;
	}
	
	.score-number.negative {
		color: #FF4D4F;
	}
	
	.player-action {
		flex: 1;
		text-align: center;
	}
	
	.give-score-btn {
		background: #007AFF;
		color: #FFFFFF;
		border: none;
		border-radius: 20rpx;
		padding: 12rpx 25rpx;
		font-size: 24rpx;
	}
	
	.no-action {
		font-size: 24rpx;
		color: #CCCCCC;
	}
	
	.room-controls {
		display: flex;
		gap: 20rpx;
	}
	
	.control-btn {
		flex: 1;
		height: 80rpx;
		border: none;
		border-radius: 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
		font-weight: 600;
	}
	
	.detail-btn {
		background: #F8F9FF;
		color: #007AFF;
		border: 2rpx solid #007AFF;
	}
	
	.start-btn {
		background: linear-gradient(135deg, #52C41A, #73D13D);
		color: #FFFFFF;
	}
	
	.settle-btn {
		background: linear-gradient(135deg, #FF6B6B, #FF8E53);
		color: #FFFFFF;
	}
	
	.btn-text {
		color: inherit;
		font-size: inherit;
		font-weight: inherit;
	}
	
	/* 弹窗样式 */
	.qr-modal, .give-score-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}
	
	.qr-content, .give-score-content {
		background: #FFFFFF;
		border-radius: 20rpx;
		padding: 40rpx;
		margin: 0 60rpx;
		max-width: 600rpx;
		width: 100%;
	}
	
	.qr-header, .give-score-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 40rpx;
	}
	
	.qr-title, .give-score-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333333;
	}
	
	.close-btn {
		font-size: 48rpx;
		color: #999999;
		line-height: 1;
	}
	
	.qr-image {
		width: 300rpx;
		height: 300rpx;
		background: #F5F5F5;
		border-radius: 15rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 30rpx;
		border: 2rpx dashed #CCCCCC;
	}
	
	.qr-code {
		font-size: 36rpx;
		font-weight: 600;
		color: #007AFF;
	}
	
	.qr-tip {
		text-align: center;
		font-size: 24rpx;
		color: #666666;
		display: block;
		margin-bottom: 30rpx;
	}
	
	.share-btn {
		width: 100%;
		height: 80rpx;
		background: #52C41A;
		border: none;
		border-radius: 15rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.share-text {
		color: #FFFFFF;
		font-size: 28rpx;
		font-weight: 600;
	}
	
	.score-input-section {
		margin-bottom: 40rpx;
	}
	
	.input-label {
		font-size: 28rpx;
		color: #333333;
		margin-bottom: 15rpx;
		display: block;
	}
	
	.score-input {
		width: 100%;
		height: 80rpx;
		background: #F8F9FF;
		border: 2rpx solid #E5E5E5;
		border-radius: 15rpx;
		padding: 0 30rpx;
		font-size: 32rpx;
		color: #333333;
		text-align: center;
	}
	
	.input-tip {
		font-size: 22rpx;
		color: #666666;
		margin-top: 10rpx;
		display: block;
		text-align: center;
	}
	
	.quick-scores {
		margin-bottom: 40rpx;
	}
	
	.quick-title {
		font-size: 26rpx;
		color: #666666;
		margin-bottom: 20rpx;
		display: block;
	}
	
	.quick-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 15rpx;
	}
	
	.quick-btn {
		flex: 1;
		min-width: 100rpx;
		height: 60rpx;
		background: #F8F9FF;
		border: 2rpx solid #E5E5E5;
		border-radius: 10rpx;
		font-size: 24rpx;
		color: #666666;
	}
	
	.quick-btn:active {
		background: #007AFF;
		color: #FFFFFF;
		border-color: #007AFF;
	}
	
	.confirm-give-btn {
		width: 100%;
		height: 80rpx;
		background: linear-gradient(135deg, #007AFF, #5856D6);
		border: none;
		border-radius: 15rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.confirm-give-btn[disabled] {
		background: #CCCCCC;
		opacity: 0.6;
	}
	
	.confirm-text {
		color: #FFFFFF;
		font-size: 28rpx;
		font-weight: 600;
	}
</style> 