// 先加载依赖（规范执行顺序，避免潜在问题）
require('./common/runtime.js')
require('./common/vendor.js')
require('./common/main.js')

App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请升级微信基础库到2.2.3以上版本以使用云开发');
      return;
    }

    try {
      wx.cloud.init({
        env: 'cloud1-7ga9fv70b0f6c3fe', // 替换为云开发控制台的真实ID
        traceUser: true,
      });
      console.log('云开发初始化代码执行完成，环境ID：cloud1-7ga9fv70b0f6c3fe');
      
      // 验证云环境是否有效（关键：新增验证逻辑）
      const db = wx.cloud.database();
      db.collection('test').get({
        success: () => console.log('云环境验证成功！'),
        fail: (err) => {
          console.error('云环境验证失败：', err);
          console.warn('请检查：1.环境ID是否正确 2.云开发是否开通 3.账号是否有云开发权限');
        }
      });
    } catch (err) {
      console.error('云开发初始化异常：', err);
    }
  },
  globalData: {
    userInfo: null
  }
})