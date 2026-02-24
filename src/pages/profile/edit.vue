<template>
	<view class="container">
		<view class="form-section">
			<view class="form-item">
				<text class="form-label">头像</text>
				<view class="avatar-section" @click="chooseAvatar">
					<image 
						class="avatar" 
						:src="form.avatarUrl || '/static/default-avatar.png'" 
						mode="aspectFill"
					></image>
					<view class="avatar-overlay">
						<text class="avatar-tip">点击更换</text>
					</view>
				</view>
			</view>
			
			<view class="form-item">
				<text class="form-label">昵称</text>
				<input 
					class="form-input" 
					v-model="form.nickName" 
					placeholder="请输入昵称"
					maxlength="20"
				/>
			</view>
			
			<view class="form-tips">
				<text class="tip-text">• 昵称长度不超过20个字符</text>
				<text class="tip-text">• 头像支持从相册选择</text>
			</view>
		</view>
		
		<view class="button-section">
			<button class="save-btn" @click="saveProfile" :disabled="!canSave">
				<text class="save-btn-text">保存</text>
			</button>
		</view>
		
		<!-- 上传中提示 -->
		<view v-if="uploading" class="upload-modal">
			<view class="upload-content">
				<view class="upload-icon">📤</view>
				<text class="upload-text">正在上传头像...</text>
			</view>
		</view>
	</view>
</template>

<script>
	import CloudAPI from '@/utils/cloud.js'
	
	export default {
		data() {
			return {
				form: {
					nickName: '',
					avatarUrl: ''
				},
				originalData: {},
				uploading: false
			}
		},
		computed: {
			canSave() {
				return this.form.nickName.trim().length > 0 && 
					   (this.form.nickName !== this.originalData.nickName || 
					    this.form.avatarUrl !== this.originalData.avatarUrl);
			}
		},
		onLoad() {
			this.loadUserInfo();
		},
		methods: {
			// 加载用户信息
			async loadUserInfo() {
				try {
					const userInfo = await CloudAPI.getCurrentUser();
					if (userInfo) {
						this.form = {
							nickName: userInfo.nickName || '',
							avatarUrl: userInfo.avatarUrl || ''
						};
						this.originalData = { ...this.form };
					} else {
						uni.showToast({
							title: '请先登录',
							icon: 'none'
						});
						uni.navigateBack();
					}
				} catch (error) {
					console.error('加载用户信息失败:', error);
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					});
					uni.navigateBack();
				}
			},
			
			// 选择头像
			chooseAvatar() {
				uni.showActionSheet({
					itemList: ['从相册选择', '拍照'],
					success: (res) => {
						if (res.tapIndex === 0) {
							this.chooseImageFromAlbum();
						} else if (res.tapIndex === 1) {
							this.chooseImageFromCamera();
						}
					}
				});
			},
			
			// 从相册选择
			chooseImageFromAlbum() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album'],
					success: (res) => {
						this.handleImageSelect(res.tempFilePaths[0]);
					},
					fail: (err) => {
						console.log('选择图片失败:', err);
						uni.showToast({
							title: '选择图片失败',
							icon: 'none'
						});
					}
				});
			},
			
			// 拍照
			chooseImageFromCamera() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['camera'],
					success: (res) => {
						this.handleImageSelect(res.tempFilePaths[0]);
					},
					fail: (err) => {
						console.log('拍照失败:', err);
						uni.showToast({
							title: '拍照失败',
							icon: 'none'
						});
					}
				});
			},
			
			// 处理图片选择
			handleImageSelect(tempPath) {
				// 预览图片
				uni.previewImage({
					urls: [tempPath],
					success: () => {
						// 确认使用
						uni.showModal({
							title: '确认',
							content: '是否使用这张图片作为头像？',
							success: (res) => {
								if (res.confirm) {
									this.uploadAvatar(tempPath);
								}
							}
						});
					}
				});
			},
			
			// 上传头像
			uploadAvatar(tempPath) {
				this.uploading = true;
				
				// 模拟上传过程
				setTimeout(() => {
					// 在实际应用中，这里应该调用真实的上传接口
					// 这里我们直接使用临时路径作为头像
					this.form.avatarUrl = tempPath;
					this.uploading = false;
					
					uni.showToast({
						title: '头像上传成功',
						icon: 'success'
					});
				}, 2000);
			},
			
			// 保存资料
			async saveProfile() {
				if (!this.canSave) {
					return;
				}
				
				const nickName = this.form.nickName.trim();
				if (nickName.length === 0) {
					uni.showToast({
						title: '请输入昵称',
						icon: 'none'
					});
					return;
				}
				
				if (nickName.length > 20) {
					uni.showToast({
						title: '昵称长度不能超过20个字符',
						icon: 'none'
					});
					return;
				}
				
				uni.showLoading({
					title: '保存中...'
				});
				
				try {
					await CloudAPI.saveUser({
						nickName: this.form.nickName,
						avatarUrl: this.form.avatarUrl
					});
					
					uni.hideLoading();
					uni.showToast({
						title: '保存成功',
						icon: 'success'
					});
					
					// 返回上一页
					setTimeout(() => {
						uni.navigateBack();
					}, 1500);
				} catch (error) {
					uni.hideLoading();
					console.error('保存失败:', error);
					uni.showToast({
						title: '保存失败',
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
		padding: 40rpx 30rpx;
	}
	
	.form-section {
		background: #FFFFFF;
		border-radius: 25rpx;
		padding: 40rpx 30rpx;
		margin-bottom: 40rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
	}
	
	.form-item {
		margin-bottom: 50rpx;
	}
	
	.form-item:last-child {
		margin-bottom: 0;
	}
	
	.form-label {
		display: block;
		font-size: 30rpx;
		font-weight: 600;
		color: #333333;
		margin-bottom: 20rpx;
	}
	
	.avatar-section {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		position: relative;
	}
	
	.avatar {
		width: 200rpx;
		height: 200rpx;
		border-radius: 100rpx;
		background: #F5F5F5;
		border: 4rpx solid #E5E5E5;
	}
	
	.avatar-overlay {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.6);
		color: #FFFFFF;
		padding: 10rpx 20rpx;
		border-radius: 20rpx;
		font-size: 24rpx;
	}
	
	.avatar-tip {
		color: #FFFFFF;
		font-size: 24rpx;
	}
	
	.form-input {
		width: 100%;
		height: 80rpx;
		background: #F8F9FF;
		border: 2rpx solid #E5E5E5;
		border-radius: 15rpx;
		padding: 0 30rpx;
		font-size: 30rpx;
		color: #333333;
	}
	
	.form-input:focus {
		border-color: #007AFF;
		background: #FFFFFF;
	}
	
	.form-tips {
		margin-top: 30rpx;
		padding: 25rpx;
		background: #F8F9FF;
		border-radius: 15rpx;
		border-left: 6rpx solid #007AFF;
	}
	
	.tip-text {
		display: block;
		font-size: 24rpx;
		color: #666666;
		line-height: 1.6;
		margin-bottom: 8rpx;
	}
	
	.tip-text:last-child {
		margin-bottom: 0;
	}
	
	.button-section {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 30rpx;
		background: #FFFFFF;
		border-top: 1rpx solid #E5E5E5;
	}
	
	.save-btn {
		width: 100%;
		height: 90rpx;
		background: linear-gradient(135deg, #007AFF, #5856D6);
		border: none;
		border-radius: 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
	}
	
	.save-btn[disabled] {
		background: #CCCCCC;
		opacity: 0.6;
	}
	
	.save-btn:not([disabled]):active {
		transform: scale(0.98);
	}
	
	.save-btn-text {
		font-size: 32rpx;
		font-weight: 600;
		color: #FFFFFF;
	}
	
	.upload-modal {
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
	
	.upload-content {
		background: #FFFFFF;
		border-radius: 20rpx;
		padding: 60rpx 80rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.upload-icon {
		font-size: 80rpx;
		margin-bottom: 30rpx;
	}
	
	.upload-text {
		font-size: 28rpx;
		color: #333333;
	}
</style> 