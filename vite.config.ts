import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        login: path.resolve(__dirname, 'login.html'),
        signup: path.resolve(__dirname, 'signup.html'),
        apps: path.resolve(__dirname, 'apps.html'),
        crm: path.resolve(__dirname, 'crm.html'),
        manufacturing: path.resolve(__dirname, 'manufacturing.html'),
        inventory: path.resolve(__dirname, 'inventory.html'),
        bom: path.resolve(__dirname, 'bom.html'),
        products: path.resolve(__dirname, 'products.html'),
        contacts: path.resolve(__dirname, 'contacts.html'),
        quotation: path.resolve(__dirname, 'quotation.html'),
        invoice: path.resolve(__dirname, 'invoice.html'),
        notification: path.resolve(__dirname, 'notification.html'),
        admin: path.resolve(__dirname, 'admin.html'),
        project: path.resolve(__dirname, 'project.html'),
      },
    },
  },
})
