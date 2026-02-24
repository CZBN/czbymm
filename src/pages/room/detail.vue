<template>
	<view class="container">
		<view class="header">
			<text class="title">给分详情</text>
			<text class="subtitle">房间 #{{roomId}}</text>
		</view>
		
		<view v-if="records.length === 0" class="empty-state">
			<view class="empty-icon">📋</view>
			<text class="empty-text">暂无给分记录</text>
			<text class="empty-tip">开始游戏后的给分记录将在这里显示</text>
		</view>
		
		<view v-else class="records-list">
			<view 
				v-for="(record, index) in records" 
				:key="record.id"
				class="record-item"
			>
				<view class="record-header">
					<text class="record-time">{{formatTime(record.time)}}</text>
					<view class="score-badge" :class="{ 'positive': record.score > 0, 'negative': record.score < 0 }">
						<text class="score-text">{{record.score > 0 ? '+' : ''}}{{record.score}}</text>
					</view>
				</view>
				
				<view class="record-content">
					<view class="player-info from-player">
						<view class="player-label">给分人</view>
						<view class="player-detail">
							<image class="player-avatar" src="/static/default-avatar.png"></image>
							<text class="player-name">{{record.fromPlayer.name}}</text>
						</view>
					</view>
					
					<view class="arrow-section">
						<text class="arrow">→</text>
					</view>
					
					<view class="player-info to-player">
						<view class="player-label">得分人</view>
						<view class="player-detail">
							<image class="player-avatar" src="/static/default-avatar.png"></image>
							<text class="player-name">{{record.toPlayer.name}}</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<view class="summary-section" v-if="records.length > 0">
			<view class="summary-header">
				<text class="summary-title">统计信息</text>
			</view>
			<view class="summary-content">
				<view class="summary-item">
					<text class="summary-label">总记录数</text>
					<text class="summary-value">{{records.length}}</text>
				</view>
				<view class="summary-item">
					<text class="summary-label">最高单次得分</text>
					<text class="summary-value positive">+{{maxScore}}</text>
				</view>
				<view class="summary-item">
					<text class="summary-label">最低单次得分</text>
					<text class="summary-value negative">{{minScore}}</text>
				</view>
			</view>
		</view>
		
		<view class="bottom-actions">
			<button class="back-btn" @click="goBack">
				<text class="back-text">返回房间</text>
			</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				roomId: '',
				records: []
			}
		},
		computed: {
			maxScore() {
				if (this.records.length === 0) return 0;
				return Math.max(...this.records.map(r => r.score));
			},
			minScore() {
				if (this.records.length === 0) return 0;
				return Math.min(...this.records.map(r => r.score));
			}
		},
		onLoad(options) {
			this.roomId = options.roomId || '';
			this.loadRecords(options.records);
		},
		methods: {
			// 加载记录
			loadRecords(recordsStr) {
				try {
					if (recordsStr) {
						this.records = JSON.parse(decodeURIComponent(recordsStr));
					} else {
						// 如果没有传递记录，可以从本地存储或接口获取
						this.records = [];
					}
					
					// 按时间倒序排列
					this.records.sort((a, b) => b.time - a.time);
				} catch (error) {
					console.error('解析记录失败:', error);
					this.records = [];
					uni.showToast({
						title: '数据加载失败',
						icon: 'none'
					});
				}
			},
			
			// 格式化时间
			formatTime(timestamp) {
				const date = new Date(timestamp);
				const now = new Date();
				const diff = now.getTime() - date.getTime();
				
				// 如果是今天
				if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
					const minutes = Math.floor(diff / (1000 * 60));
					if (minutes < 1) {
						return '刚刚';
					} else if (minutes < 60) {
						return `${minutes}分钟前`;
					} else {
						const hours = Math.floor(minutes / 60);
						return `${hours}小时前`;
					}
				} else {
					// 其他日期显示具体时间
					const month = (date.getMonth() + 1).toString().padStart(2, '0');
					const day = date.getDate().toString().padStart(2, '0');
					const hour = date.getHours().toString().padStart(2, '0');
					const minute = date.getMinutes().toString().padStart(2, '0');
					return `${month}-${day} ${hour}:${minute}`;
				}
			},
			
			// 返回房间
			goBack() {
				uni.navigateBack();
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
	
	.header {
		background: #FFFFFF;
		border-radius: 20rpx;
		padding: 40rpx 30rpx;
		margin-bottom: 30rpx;
		text-align: center;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
	}
	
	.title {
		font-size: 36rpx;
		font-weight: 600;
		color: #333333;
		display: block;
		margin-bottom: 10rpx;
	}
	
	.subtitle {
		font-size: 26rpx;
		color: #666666;
	}
	
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 150rpx 0;
		background: #FFFFFF;
		border-radius: 20rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
	}
	
	.empty-icon {
		font-size: 120rpx;
		margin-bottom: 30rpx;
		opacity: 0.5;
	}
	
	.empty-text {
		font-size: 32rpx;
		color: #666666;
		margin-bottom: 15rpx;
	}
	
	.empty-tip {
		font-size: 26rpx;
		color: #999999;
		text-align: center;
		line-height: 1.5;
	}
	
	.records-list {
		margin-bottom: 30rpx;
	}
	
	.record-item {
		background: #FFFFFF;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
	}
	
	.record-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 25rpx;
		padding-bottom: 15rpx;
		border-bottom: 1rpx solid #F0F0F0;
	}
	
	.record-time {
		font-size: 24rpx;
		color: #999999;
	}
	
	.score-badge {
		padding: 8rpx 20rpx;
		border-radius: 20rpx;
		font-size: 24rpx;
		font-weight: 600;
	}
	
	.score-badge.positive {
		background: #E8F5E8;
		color: #52C41A;
	}
	
	.score-badge.negative {
		background: #FFF2F0;
		color: #FF4D4F;
	}
	
	.score-text {
		color: inherit;
		font-size: inherit;
		font-weight: inherit;
	}
	
	.record-content {
		display: flex;
		align-items: center;
	}
	
	.player-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.player-label {
		font-size: 22rpx;
		color: #999999;
		margin-bottom: 15rpx;
	}
	
	.player-detail {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.player-avatar {
		width: 80rpx;
		height: 80rpx;
		border-radius: 40rpx;
		margin-bottom: 10rpx;
		background: #F5F5F5;
	}
	
	.player-name {
		font-size: 26rpx;
		color: #333333;
		text-align: center;
	}
	
	.arrow-section {
		flex: 0 0 80rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	
	.arrow {
		font-size: 32rpx;
		color: #CCCCCC;
		font-weight: bold;
	}
	
	.summary-section {
		background: #FFFFFF;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
	}
	
	.summary-header {
		margin-bottom: 25rpx;
		padding-bottom: 15rpx;
		border-bottom: 1rpx solid #F0F0F0;
	}
	
	.summary-title {
		font-size: 30rpx;
		font-weight: 600;
		color: #333333;
	}
	
	.summary-content {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}
	
	.summary-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #F8F8F8;
	}
	
	.summary-item:last-child {
		border-bottom: none;
	}
	
	.summary-label {
		font-size: 28rpx;
		color: #666666;
	}
	
	.summary-value {
		font-size: 28rpx;
		font-weight: 600;
		color: #333333;
	}
	
	.summary-value.positive {
		color: #52C41A;
	}
	
	.summary-value.negative {
		color: #FF4D4F;
	}
	
	.bottom-actions {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 30rpx;
		background: #FFFFFF;
		border-top: 1rpx solid #E5E5E5;
	}
	
	.back-btn {
		width: 100%;
		height: 80rpx;
		background: linear-gradient(135deg, #007AFF, #5856D6);
		border: none;
		border-radius: 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.back-text {
		color: #FFFFFF;
		font-size: 28rpx;
		font-weight: 600;
	}
</style> 