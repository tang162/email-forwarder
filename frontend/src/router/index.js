import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Inbox from '../views/Inbox.vue'
import Config from '../views/Config.vue'
import Status from '../views/Status.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/inbox/:emailId',
    name: 'Inbox',
    component: Inbox,
    props: true
  },
  {
    path: '/config',
    name: 'Config',
    component: Config
  },
  {
    path: '/status',
    name: 'Status',
    component: Status
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
