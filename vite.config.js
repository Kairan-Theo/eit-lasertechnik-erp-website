import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        apps: resolve(__dirname, 'apps.html'),
        billingNote: resolve(__dirname, 'billing-note.html'),
        bom: resolve(__dirname, 'bom.html'),
        contacts: resolve(__dirname, 'contacts.html'),
        crm: resolve(__dirname, 'crm.html'),
        inventoryDetail: resolve(__dirname, 'inventory-detail.html'),
        inventory: resolve(__dirname, 'inventory.html'),
        invoice: resolve(__dirname, 'invoice.html'),
        taxInvoice: resolve(__dirname, 'tax-invoice.html'),
        login: resolve(__dirname, 'login.html'),
        manufacturing: resolve(__dirname, 'manufacturing.html'),
        newMo: resolve(__dirname, 'new-mo.html'),
        notification: resolve(__dirname, 'notification.html'),
        printPo: resolve(__dirname, 'print-po.html'),
        products: resolve(__dirname, 'products.html'),
        project: resolve(__dirname, 'project.html'),
        quotation: resolve(__dirname, 'quotation.html'),
        receipt: resolve(__dirname, 'receipt.html'),
        signup: resolve(__dirname, 'signup.html'),
      },
    },
  },
})
