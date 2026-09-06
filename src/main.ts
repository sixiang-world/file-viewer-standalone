import { createApp } from 'vue'
import App from './App.vue'
import FileViewer from '@file-viewer/vue3-full'
import './style.css'

const app = createApp(App)
app.use(FileViewer)
app.mount('#app')
