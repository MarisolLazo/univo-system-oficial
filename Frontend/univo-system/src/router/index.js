import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../store/auth.js'

const routes = [
  { path:'/login', name:'login', component:()=>import('../views/LoginView.vue'), meta:{public:true} },
  {
    path:'/',
    component:()=>import('../views/MainLayout.vue'),
    meta:{ requiresAuth:true },
    children:[
      { path:'',            redirect:'/dashboard' },
      { path:'dashboard',   name:'dashboard',     component:()=>import('../views/DashboardView.vue') },
      { path:'estudiantes', name:'estudiantes',   component:()=>import('../views/EstudiantesView.vue') },
      { path:'asistencias', name:'asistencias',   component:()=>import('../views/AsistenciasView.vue') },
      { path:'actividades', name:'actividades',   component:()=>import('../views/ActividadesView.vue') },
      { path:'presentaciones',name:'presentaciones',component:()=>import('../views/PresentacionesView.vue') },
      { path:'recursos',    name:'recursos',      component:()=>import('../views/RecursosView.vue') },
      { path:'prestamos',   name:'prestamos',     component:()=>import('../views/PrestamosView.vue') },
      { path:'permisos',    name:'permisos',      component:()=>import('../views/PermisosView.vue') },
    ]
  },
  { path:'/:pathMatch(.*)*', redirect:'/' }
]

const router = createRouter({ history:createWebHashHistory(), routes })

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isLoggedIn) return '/login'
  if (to.path==='/login' && auth.isLoggedIn) return '/dashboard'
})

export default router