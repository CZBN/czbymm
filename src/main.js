import Vue from 'vue'
import App from './App'
import './uni.promisify.adaptor'

Vue.config.productionTip = false

App.mpType = 'app'

// 初始化云开发
wx.cloud.init({
  env: 'cloud1-8g0hmbzg2c269794', // 使用正确的云开发环境ID
  traceUser: true
})

const app = new Vue({
  ...App
})
app.$mount()
