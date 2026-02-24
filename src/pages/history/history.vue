<template>
	<view class="container">
		<view class="tab-bar">
			<view 
				class="tab-item"
				:class="{ active: activeTab === 'all' }"
				@click="switchTab('all')"
			>
				<text class="tab-text">全部</text>
			</view>
			<view 
				class="tab-item"
				:class="{ active: activeTab === 'win' }"
				@click="switchTab('win')"
			>
				<text class="tab-text">胜</text>
			</view>
			<view 
				class="tab-item"
				:class="{ active: activeTab === 'lose' }"
				@click="switchTab('lose')"
			>
				<text class="tab-text">负</text>
			</view>
		</view>
		
		<scroll-view class="content" scroll-y="true" @scrolltolower="loadMore">
			<view v-if="filteredRecords.length === 0" class="empty-state">
				<view class="empty-icon">📊</view>
				<text class="empty-text">暂无历史记录</text>
				<text class="empty-tip">快去开始一局游戏吧！</text>
			</view>
			
			<view v-else class="record-list">
				<view 
					v-for="(record, index) in filteredRecords" 
					:key="record.id"
					class="record-item"
					@click="viewDetail(record)"
				>
					<view class="record-header">
						<view class="room-info">
							<text class="room-id">房间 #{{record.roomCode}}</text>
							<text class="game-mode">{{record.mode === 'multi' ? '多人模式' : '单人模式'}}</text>
						</view>
						<view class="result-badge" :class="record.result">
							<text class="result-text">{{getResultText(record.result)}}</text>
						</view>
					</view>
					
					<view class="record-content">
						<view class="score-section">
							<text class="section-title">我的成绩</text>
							<view class="my-score">
								<text class="score-label">得分:</text>
								<text class="score-value" :class="{ 'positive': record.finalScore > 0, 'negative': record.finalScore <= 0 }">
									{{record.finalScore > 0 ? '+' : ''}}{{record.finalScore}}
								</text>
								<text class="rank-label">排名: 第{{record.rank}}名</text>
							</view>
						</view>
						
						<view class="game-info">
							<text class="game-time">{{formatTime(record.endTime)}}</text>
							<text class="game-duration">游戏时长: {{formatDuration(record.duration)}}</text>
						</view>
					</view>
				</view>
			</view>
			
			<view v-if="loading" class="loading">
				<text class="loading-text">加载中...</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import CloudAPI from '@/utils/cloud.js'
	
	export default {
		data() {
			return {
				activeTab: 'all',
				records: [],
				loading: false,
				currentUserId: '',
				page: 0,
				limit: 10,
				hasMore: true
			}
		},
		computed: {
			filteredRecords() {
				if (this.activeTab === 'all') {
					return this.records;
				}
				return this.records.filter(record => record.result === this.activeTab);
			}
		},
		onLoad() {
			this.loadRecords();
		},
		onShow() {
			// 页面显示时刷新数据
			this.refreshRecords();
		},
		onPullDownRefresh() {
			this.refreshRecords();
		},
		methods: {
			// 切换tab
			switchTab(tab) {
				this.activeTab = tab;
			},
			
			// 加载历史记录
			async loadRecords() {
				if (this.loading || !this.hasMore) return;
				
				console.log('历史页面: 开始加载历史记录');
				this.loading = true;
				
				try {
					// 先检查用户是否登录
					const user = await CloudAPI.getCurrentUser();
					console.log('历史页面: 当前用户', user);
					
					if (!user) {
						console.log('历史页面: 用户未登录，清空记录');
						this.records = [];
						this.loading = false;
						return;
					}
					
					const newRecords = await CloudAPI.getUserGameHistory(this.limit, this.page * this.limit);
					console.log('历史页面: 获取到历史记录', newRecords);
					
					if (this.page === 0) {
						this.records = newRecords;
					} else {
						this.records = [...this.records, ...newRecords];
					}
					
					this.hasMore = newRecords.length === this.limit;
					this.page++;
				} catch (error) {
					console.error('历史页面: 加载历史记录失败:', error);
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					});
				} finally {
					this.loading = false;
				}
			},
			
			// 刷新记录
			refreshRecords() {
				this.page = 0;
				this.hasMore = true;
				this.records = [];
				this.loadRecords();
				uni.stopPullDownRefresh();
			},
			
			// 加载更多
			loadMore() {
				this.loadRecords();
			},
			
			// 获取结果文本
			getResultText(result) {
				const texts = {
					win: '胜',
					lose: '负'
				};
				return texts[result] || '';
			},
			
			// 格式化时间
			formatTime(timestamp) {
				const date = new Date(timestamp);
				const now = new Date();
				const diff = now - date;
				
				if (diff < 24 * 60 * 60 * 1000) {
					return '今天 ' + date.toTimeString().substr(0, 5);
				} else if (diff < 48 * 60 * 60 * 1000) {
					return '昨天 ' + date.toTimeString().substr(0, 5);
				} else {
					return date.toLocaleDateString() + ' ' + date.toTimeString().substr(0, 5);
				}
			},
			
			// 格式化游戏时长
			formatDuration(seconds) {
				const minutes = Math.floor(seconds / 60);
				const remainingSeconds = seconds % 60;
				return `${minutes}分${remainingSeconds}秒`;
			},
			
			// 查看详情
			viewDetail(record) {
				uni.showModal({
					title: '游戏详情',
					content: `房间: #${record.roomCode}\n模式: ${record.mode === 'multi' ? '多人模式' : '单人模式'}\n结果: ${this.getResultText(record.result)}\n排名: 第${record.rank}名\n得分: ${record.finalScore}\n时间: ${this.formatTime(record.endTime)}`,
					showCancel: false
				});
			}
		}
	}
</script>

<style scoped>
	.container {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #F5F5F5;
	}
	
	.tab-bar {
		display: flex;
		background: #FFFFFF;
		border-bottom: 1rpx solid #E5E5E5;
	}
	
	.tab-item {
		flex: 1;
		padding: 30rpx 0;
		text-align: center;
		position: relative;
	}
	
	.tab-item.active .tab-text {
		color: #007AFF;
		font-weight: 600;
	}
	
	.tab-item.active::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 60rpx;
		height: 4rpx;
		background: #007AFF;
		border-radius: 2rpx;
	}
	
	.tab-text {
		font-size: 30rpx;
		color: #666666;
		transition: all 0.3s ease;
	}
	
	.content {
		flex: 1;
		padding: 0 30rpx;
	}
	
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 200rpx 0;
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
	}
	
	.record-list {
		padding: 30rpx 0;
	}
	
	.record-item {
		background: #FFFFFF;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	}
	
	.record-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 25rpx;
	}
	
	.room-info {
		display: flex;
		flex-direction: column;
	}
	
	.room-id {
		font-size: 30rpx;
		font-weight: 600;
		color: #333333;
		margin-bottom: 8rpx;
	}
	
	.game-mode {
		font-size: 24rpx;
		color: #666666;
	}
	
	.result-badge {
		padding: 8rpx 20rpx;
		border-radius: 20rpx;
		font-size: 24rpx;
	}
	
	.result-badge.win {
		background: #E8F5E8;
		color: #52C41A;
	}
	
	.result-badge.lose {
		background: #FFF2F0;
		color: #FF4D4F;
	}
	
	.record-content {
		border-top: 1rpx solid #F0F0F0;
		padding-top: 25rpx;
	}
	
	.section-title {
		font-size: 26rpx;
		color: #666666;
		margin-bottom: 20rpx;
		display: block;
	}
	
	.score-section {
		margin-bottom: 25rpx;
	}
	
	.my-score {
		display: flex;
		align-items: center;
	}
	
	.score-label {
		font-size: 28rpx;
		color: #666666;
		margin-right: 10rpx;
	}
	
	.score-value {
		font-size: 28rpx;
		font-weight: 600;
		color: #666666;
	}
	
	.score-value.positive {
		color: #52C41A;
	}
	
	.score-value.negative {
		color: #FF4D4F;
	}
	
	.rank-label {
		font-size: 24rpx;
		color: #999999;
		margin-left: 10rpx;
	}
	
	.game-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 15rpx;
		border-top: 1rpx solid #F0F0F0;
	}
	
	.game-time {
		font-size: 24rpx;
		color: #999999;
	}
	
	.game-duration {
		font-size: 24rpx;
		color: #999999;
	}
	
	.loading {
		display: flex;
		justify-content: center;
		padding: 30rpx 0;
	}
	
	.loading-text {
		font-size: 26rpx;
		color: #999999;
	}
</style> 