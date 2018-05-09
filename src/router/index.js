import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
//載入元件ChatRoom
import ChatRoom from '@/components/ChatRoom'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/helloworld',
      name: 'HelloWorld',
      component: HelloWorld
    },
    {
      //路徑用於網址列
      path: '/',
      //name用於設定連結，例如樣板頁中可用下面方式來寫連結，就不用寫<a>掛path了
      //<router-link :to="{ name: 'ChatRoom' }>ChatRoom Page</router-link>
      name: 'ChatRoom',
      //到這個ChatRoom(/)時，使用ChatRoom元件
      component: ChatRoom
    }
  ]
})
